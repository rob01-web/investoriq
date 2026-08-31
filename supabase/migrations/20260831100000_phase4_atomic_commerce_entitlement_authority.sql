begin;

create table if not exists public.stripe_events (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.commerce_checkout_receipts (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null,
  stripe_event_id text not null,
  user_id uuid not null,
  checkout_product_type text not null,
  quantity integer not null,
  catalog_version text not null,
  stripe_price_id text not null,
  currency text not null,
  amount_subtotal bigint not null,
  amount_total bigint not null,
  checkout_status text not null,
  payment_status text not null,
  expected_screening_count integer not null,
  expected_underwriting_count integer not null,
  entitlement_count integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commerce_checkout_receipts_session_key unique (stripe_session_id),
  constraint commerce_checkout_receipts_event_key unique (stripe_event_id),
  constraint commerce_checkout_receipts_product_check
    check (checkout_product_type in ('screening', 'underwriting', 'bundle')),
  constraint commerce_checkout_receipts_currency_check check (currency = 'usd'),
  constraint commerce_checkout_receipts_quantity_check check (quantity between 1 and 5),
  constraint commerce_checkout_receipts_amount_check
    check (amount_subtotal >= 0 and amount_total >= 0 and amount_total <= amount_subtotal),
  constraint commerce_checkout_receipts_entitlement_count_check
    check (entitlement_count = expected_screening_count + expected_underwriting_count)
);

do $$
begin
  if exists (
    select 1
    from public.report_purchases
    where stripe_session_id is not null
    group by stripe_session_id
    having count(*) > 1
  ) then
    raise exception 'PHASE4_DUPLICATE_STRIPE_ENTITLEMENT_KEYS_REQUIRE_REVIEW';
  end if;
end;
$$;

create unique index if not exists report_purchases_stripe_session_id_unique
  on public.report_purchases (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists commerce_checkout_receipts_user_created_idx
  on public.commerce_checkout_receipts (user_id, created_at desc);

alter table public.commerce_checkout_receipts enable row level security;
revoke all on table public.commerce_checkout_receipts from public, anon, authenticated;
grant select, insert on table public.commerce_checkout_receipts to service_role;

create or replace function public.grant_checkout_entitlements_v1(
  p_stripe_event_id text,
  p_stripe_session_id text,
  p_user_id uuid,
  p_checkout_product_type text,
  p_quantity integer,
  p_catalog_version text,
  p_stripe_price_id text,
  p_currency text,
  p_amount_subtotal bigint,
  p_amount_total bigint,
  p_checkout_status text,
  p_payment_status text
)
returns table (
  receipt_id uuid,
  stripe_session_id text,
  checkout_product_type text,
  quantity integer,
  screening_entitlements integer,
  underwriting_entitlements integer,
  entitlement_count integer,
  idempotent_replay boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_catalog_version constant text := 'investoriq-commerce-v1-2026-08-31';
  v_unit_amount bigint;
  v_expected_subtotal bigint;
  v_screening_count integer;
  v_underwriting_count integer;
  v_total_count integer;
  v_index integer;
  v_expected_type text;
  v_entitlement_session_id text;
  v_existing_purchase public.report_purchases%rowtype;
  v_receipt public.commerce_checkout_receipts%rowtype;
  v_replay boolean := false;
begin
  if nullif(trim(coalesce(p_stripe_event_id, '')), '') is null
     or nullif(trim(coalesce(p_stripe_session_id, '')), '') is null
     or nullif(trim(coalesce(p_stripe_price_id, '')), '') is null then
    raise exception 'COMMERCE_STRIPE_IDENTITY_REQUIRED';
  end if;

  if p_catalog_version is distinct from v_catalog_version then
    raise exception 'COMMERCE_CATALOG_VERSION_MISMATCH';
  end if;

  if lower(coalesce(p_currency, '')) <> 'usd' then
    raise exception 'COMMERCE_CURRENCY_MISMATCH';
  end if;

  if p_checkout_status is distinct from 'complete' then
    raise exception 'COMMERCE_CHECKOUT_NOT_COMPLETE';
  end if;

  if not (
    p_payment_status = 'paid'
    or (p_payment_status = 'no_payment_required' and p_amount_total = 0)
  ) then
    raise exception 'COMMERCE_PAYMENT_NOT_SETTLED';
  end if;

  case p_checkout_product_type
    when 'screening' then
      if p_quantity not between 1 and 5 then raise exception 'COMMERCE_QUANTITY_INVALID'; end if;
      v_unit_amount := 19900;
      v_screening_count := p_quantity;
      v_underwriting_count := 0;
    when 'underwriting' then
      if p_quantity not between 1 and 5 then raise exception 'COMMERCE_QUANTITY_INVALID'; end if;
      v_unit_amount := 49900;
      v_screening_count := 0;
      v_underwriting_count := p_quantity;
    when 'bundle' then
      if p_quantity <> 1 then raise exception 'COMMERCE_BUNDLE_QUANTITY_INVALID'; end if;
      v_unit_amount := 69900;
      v_screening_count := 2;
      v_underwriting_count := 1;
    else
      raise exception 'COMMERCE_PRODUCT_INVALID';
  end case;

  v_expected_subtotal := v_unit_amount * p_quantity;
  v_total_count := v_screening_count + v_underwriting_count;

  if p_amount_subtotal is distinct from v_expected_subtotal then
    raise exception 'COMMERCE_SUBTOTAL_MISMATCH';
  end if;
  if p_amount_total is null or p_amount_total < 0 or p_amount_total > p_amount_subtotal then
    raise exception 'COMMERCE_TOTAL_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_stripe_session_id, 0));

  select r.* into v_receipt
  from public.commerce_checkout_receipts r
  where r.stripe_session_id = p_stripe_session_id
     or r.stripe_event_id = p_stripe_event_id
  order by case when r.stripe_session_id = p_stripe_session_id then 0 else 1 end
  limit 1
  for update;

  if found then
    v_replay := true;
    if v_receipt.stripe_session_id is distinct from p_stripe_session_id
       or v_receipt.user_id is distinct from p_user_id
       or v_receipt.checkout_product_type is distinct from p_checkout_product_type
       or v_receipt.quantity is distinct from p_quantity
       or v_receipt.catalog_version is distinct from p_catalog_version
       or v_receipt.stripe_price_id is distinct from p_stripe_price_id
       or v_receipt.currency is distinct from lower(p_currency)
       or v_receipt.amount_subtotal is distinct from p_amount_subtotal
       or v_receipt.amount_total is distinct from p_amount_total
       or v_receipt.checkout_status is distinct from p_checkout_status
       or v_receipt.payment_status is distinct from p_payment_status
       or v_receipt.expected_screening_count is distinct from v_screening_count
       or v_receipt.expected_underwriting_count is distinct from v_underwriting_count then
      raise exception 'COMMERCE_RECEIPT_REPLAY_MISMATCH';
    end if;
  else
    insert into public.stripe_events (id)
    values (p_stripe_event_id)
    on conflict (id) do nothing;

    insert into public.commerce_checkout_receipts (
      stripe_session_id,
      stripe_event_id,
      user_id,
      checkout_product_type,
      quantity,
      catalog_version,
      stripe_price_id,
      currency,
      amount_subtotal,
      amount_total,
      checkout_status,
      payment_status,
      expected_screening_count,
      expected_underwriting_count,
      entitlement_count
    ) values (
      p_stripe_session_id,
      p_stripe_event_id,
      p_user_id,
      p_checkout_product_type,
      p_quantity,
      p_catalog_version,
      p_stripe_price_id,
      lower(p_currency),
      p_amount_subtotal,
      p_amount_total,
      p_checkout_status,
      p_payment_status,
      v_screening_count,
      v_underwriting_count,
      v_total_count
    )
    returning * into v_receipt;
  end if;

  for v_index in 1..v_total_count loop
    v_expected_type := case when v_index <= v_screening_count then 'screening' else 'underwriting' end;
    v_entitlement_session_id := case
      when v_index = 1 then p_stripe_session_id
      else p_stripe_session_id || '#' || v_index::text
    end;

    select p.* into v_existing_purchase
    from public.report_purchases p
    where p.stripe_session_id = v_entitlement_session_id
    for update;

    if found then
      if v_existing_purchase.user_id is distinct from p_user_id
         or v_existing_purchase.product_type is distinct from v_expected_type then
        raise exception 'COMMERCE_ENTITLEMENT_LINEAGE_MISMATCH';
      end if;
    else
      insert into public.report_purchases (
        user_id,
        product_type,
        job_id,
        consumed_at,
        stripe_session_id
      ) values (
        p_user_id,
        v_expected_type,
        null,
        null,
        v_entitlement_session_id
      );
    end if;
  end loop;

  if (
    select count(*)
    from public.report_purchases p
    where p.stripe_session_id = p_stripe_session_id
       or p.stripe_session_id like p_stripe_session_id || '#%'
  ) <> v_total_count then
    raise exception 'COMMERCE_ENTITLEMENT_COUNT_MISMATCH';
  end if;

  return query
  select
    v_receipt.id,
    v_receipt.stripe_session_id,
    v_receipt.checkout_product_type,
    v_receipt.quantity,
    v_screening_count,
    v_underwriting_count,
    v_total_count,
    v_replay;
end;
$$;

revoke all on function public.grant_checkout_entitlements_v1(
  text, text, uuid, text, integer, text, text, text, bigint, bigint, text, text
) from public, anon, authenticated;
grant execute on function public.grant_checkout_entitlements_v1(
  text, text, uuid, text, integer, text, text, text, bigint, bigint, text, text
) to service_role;

comment on table public.commerce_checkout_receipts is
  'Phase 4 server-owned checkout truth. One settled Stripe session maps atomically to exact report_purchases entitlements.';

commit;
