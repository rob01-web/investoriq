-- RPC: consume_purchase_and_create_job
-- Atomically consumes one unconsumed purchase and creates a job for the same user/type.

create or replace function public.consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
as $$
declare
  v_purchase_id uuid;
  v_product_type text;
  v_job_id uuid;
begin
  if p_report_type is null or p_report_type not in ('screening','underwriting') then
    raise exception 'INVALID_REPORT_TYPE';
  end if;

  select id, product_type
    into v_purchase_id, v_product_type
  from public.report_purchases
  where user_id = auth.uid()
    and product_type = p_report_type
    and consumed_at is null
  order by created_at asc
  for update skip locked
  limit 1;

  if v_purchase_id is null then
    raise exception 'NO_AVAILABLE_CREDIT';
  end if;

  if v_product_type not in ('screening','underwriting') then
    raise exception 'INVALID_REPORT_TYPE';
  end if;

  insert into public.analysis_jobs (
    user_id,
    report_type,
    property_name,
    status,
    started_at
  )
  values (
    auth.uid(),
    v_product_type,
    nullif(p_job_payload->>'property_name',''),
    'needs_documents',
    null
  )
  returning id into v_job_id;

  update public.report_purchases
  set consumed_at = now(),
      job_id = v_job_id
  where id = v_purchase_id;

  return query select v_job_id, v_purchase_id;
end;
$$;

