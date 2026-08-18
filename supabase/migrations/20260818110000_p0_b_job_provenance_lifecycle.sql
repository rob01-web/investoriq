begin;

-- P0-B: canonical product/provenance and bounded recovery state.
alter table public.analysis_jobs
  add column if not exists product_identity text,
  add column if not exists report_family text,
  add column if not exists admission_receipt_id uuid,
  add column if not exists recovery_episode_id uuid,
  add column if not exists terminal_domain text,
  add column if not exists last_checkpoint text,
  add column if not exists last_checkpoint_at timestamptz;

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_product_identity_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_product_identity_check
  check (product_identity is null or product_identity in ('screening', 'full_underwriting'));

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_report_family_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_report_family_check
  check (report_family is null or report_family in ('screening', 'full_underwriting'));

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_terminal_domain_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_terminal_domain_check
  check (terminal_domain is null or terminal_domain in ('admission_integrity', 'source_core', 'internal_platform'));

create table if not exists public.analysis_job_admission_receipts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.analysis_jobs(id) on delete cascade,
  purchase_id uuid not null references public.report_purchases(id),
  user_id uuid not null,
  report_type text not null check (report_type in ('screening', 'underwriting')),
  product_identity text not null check (product_identity in ('screening', 'full_underwriting')),
  report_family text not null check (report_family in ('screening', 'full_underwriting')),
  disclosure_key text not null,
  disclosure_version text not null,
  disclosure_text_hash text not null,
  disclosure_session_identifier text not null,
  staged_source_manifest jsonb not null,
  admitted_at timestamptz not null default now()
);

create table if not exists public.worker_recovery_episodes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.analysis_jobs(id) on delete cascade,
  purchase_id uuid not null references public.report_purchases(id),
  authorized_actor text not null,
  reason text not null,
  source_terminal_state text not null check (source_terminal_state in ('failed', 'dead_letter')),
  resume_checkpoint text,
  retry_budget integer not null check (retry_budget between 1 and 3),
  attempts_consumed integer not null default 0 check (attempts_consumed >= 0),
  status text not null default 'open' check (status in ('open', 'completed', 'exhausted', 'superseded')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists worker_recovery_episodes_one_open_per_job
  on public.worker_recovery_episodes(job_id)
  where status = 'open';

create table if not exists public.worker_stage_checkpoints (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.analysis_jobs(id) on delete cascade,
  worker_attempt_id uuid,
  stage text not null,
  product_identity text,
  report_family text,
  recovery_episode_id uuid references public.worker_recovery_episodes(id),
  receipt jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists worker_stage_checkpoints_attempt_stage_key
  on public.worker_stage_checkpoints(job_id, worker_attempt_id, stage)
  where worker_attempt_id is not null;

alter table public.analysis_job_admission_receipts enable row level security;
alter table public.worker_recovery_episodes enable row level security;
alter table public.worker_stage_checkpoints enable row level security;
revoke all on table public.analysis_job_admission_receipts from anon, authenticated;
revoke all on table public.worker_recovery_episodes from anon, authenticated;
revoke all on table public.worker_stage_checkpoints from anon, authenticated;

-- Preserve the audited H5B transaction as a private implementation primitive.
do $$
begin
  if to_regprocedure('public.consume_purchase_and_create_job_untrusted_legacy(text,jsonb,jsonb)') is null
     and to_regprocedure('public.consume_purchase_and_create_job(text,jsonb,jsonb)') is not null then
    alter function public.consume_purchase_and_create_job(text, jsonb, jsonb)
      rename to consume_purchase_and_create_job_untrusted_legacy;
  end if;
end $$;

revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from public;
revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from anon;
revoke all on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) from authenticated;
grant execute on function public.consume_purchase_and_create_job_untrusted_legacy(text, jsonb, jsonb) to service_role;

-- Sanctioned customer admission authority. The entire legacy transaction rolls back if
-- any postcondition below fails, so entitlement consumption, job creation, file registration,
-- source-byte verification, disclosure proof, and provenance receipt are atomic.
create function public.consume_purchase_and_create_job(
  p_report_type text,
  p_job_payload jsonb,
  p_staged_files jsonb
)
returns table(job_id uuid, purchase_id uuid)
language plpgsql
security definer
set search_path = public, storage, auth, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_session_identifier text := coalesce(
    nullif(auth.jwt()->>'session_id', ''),
    nullif(auth.jwt()->>'jti', '')
  );
  v_job_id uuid;
  v_purchase_id uuid;
  v_product_identity text;
  v_report_family text;
  v_manifest jsonb;
  v_receipt_id uuid;
  v_file_count integer;
  v_object_count integer;
begin
  if v_uid is null then
    raise exception 'ADMISSION_UNAUTHENTICATED';
  end if;
  if p_report_type not in ('screening', 'underwriting') then
    raise exception 'ADMISSION_UNSUPPORTED_PRODUCT';
  end if;
  if v_session_identifier is null then
    raise exception 'ADMISSION_DISCLOSURE_SESSION_IDENTIFIER_MISSING';
  end if;

  if not exists (
    select 1
    from public.disclosure_session_ack_events d
    where d.user_id = v_uid
      and d.disclosure_key = 'analysis_disclosures'
      and d.disclosure_version = 'v2026-08-02'
      and d.disclosure_text_hash = '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340'
      and d.session_identifier = v_session_identifier
  ) then
    raise exception 'ADMISSION_CURRENT_DISCLOSURE_SESSION_REQUIRED';
  end if;

  select x.job_id, x.purchase_id
    into v_job_id, v_purchase_id
  from public.consume_purchase_and_create_job_untrusted_legacy(
    p_report_type,
    p_job_payload,
    p_staged_files
  ) x
  limit 1;

  if v_job_id is null or v_purchase_id is null then
    raise exception 'ADMISSION_LEGACY_TRANSACTION_DID_NOT_RETURN_LINEAGE';
  end if;

  if not exists (
    select 1 from public.analysis_jobs j
    where j.id = v_job_id
      and j.user_id = v_uid
      and j.purchase_id = v_purchase_id
      and j.status = 'queued'
      and j.report_type = p_report_type
  ) then
    raise exception 'ADMISSION_JOB_LINEAGE_INVALID';
  end if;

  if not exists (
    select 1 from public.report_purchases p
    where p.id = v_purchase_id
      and p.user_id = v_uid
      and p.job_id = v_job_id
      and p.consumed_at is not null
      and p.product_type = p_report_type
  ) then
    raise exception 'ADMISSION_PURCHASE_LINEAGE_INVALID';
  end if;

  select count(*) into v_file_count
  from public.analysis_job_files f
  where f.job_id = v_job_id and f.user_id = v_uid;

  select count(*) into v_object_count
  from public.analysis_job_files f
  join storage.objects o
    on o.bucket_id = 'staged_uploads'
   and o.name = f.object_path
  where f.job_id = v_job_id
    and f.user_id = v_uid
    and f.bucket = 'staged_uploads'
    and o.name like ('staged/' || v_uid::text || '/%')
    and nullif(o.metadata->>'size', '') is not null
    and (o.metadata->>'size') ~ '^[0-9]+$'
    and (o.metadata->>'size')::bigint = f.bytes;

  if v_file_count < 2 or v_object_count <> v_file_count then
    raise exception 'ADMISSION_STAGED_OBJECT_METADATA_MISMATCH';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'job_file_id', f.id,
      'bucket', f.bucket,
      'object_path', f.object_path,
      'doc_type', f.doc_type,
      'bytes', f.bytes,
      'mime_type', f.mime_type,
      'storage_size', (o.metadata->>'size')::bigint,
      'storage_mimetype', o.metadata->>'mimetype',
      'storage_created_at', o.created_at,
      'storage_updated_at', o.updated_at
    ) order by f.created_at, f.id
  )
  into v_manifest
  from public.analysis_job_files f
  join storage.objects o
    on o.bucket_id = 'staged_uploads'
   and o.name = f.object_path
  where f.job_id = v_job_id and f.user_id = v_uid;

  v_product_identity := case when p_report_type = 'underwriting' then 'full_underwriting' else 'screening' end;
  v_report_family := v_product_identity;

  insert into public.analysis_job_admission_receipts (
    job_id, purchase_id, user_id, report_type, product_identity, report_family,
    disclosure_key, disclosure_version, disclosure_text_hash,
    disclosure_session_identifier, staged_source_manifest
  ) values (
    v_job_id, v_purchase_id, v_uid, p_report_type, v_product_identity, v_report_family,
    'analysis_disclosures', 'v2026-08-02',
    '7387d8b79ba2ee22147bcc22ce01c50bbc8fee1856a25c0c04baf4dc8f028340',
    v_session_identifier, coalesce(v_manifest, '[]'::jsonb)
  )
  returning id into v_receipt_id;

  update public.analysis_jobs
     set product_identity = v_product_identity,
         report_family = v_report_family,
         admission_receipt_id = v_receipt_id,
         terminal_domain = null,
         last_checkpoint = 'admitted',
         last_checkpoint_at = now()
   where id = v_job_id and user_id = v_uid;

  insert into public.analysis_job_events(job_id, actor, event_type, from_status, to_status, meta)
  values (
    v_job_id,
    'admission_authority',
    'job_admitted',
    null,
    'queued',
    jsonb_build_object(
      'admission_receipt_id', v_receipt_id,
      'purchase_id', v_purchase_id,
      'product_identity', v_product_identity,
      'report_family', v_report_family,
      'disclosure_version', 'v2026-08-02'
    )
  );

  job_id := v_job_id;
  purchase_id := v_purchase_id;
  return next;
end;
$$;

revoke all on function public.consume_purchase_and_create_job(text, jsonb, jsonb) from public;
revoke all on function public.consume_purchase_and_create_job(text, jsonb, jsonb) from anon;
grant execute on function public.consume_purchase_and_create_job(text, jsonb, jsonb) to authenticated;
grant execute on function public.consume_purchase_and_create_job(text, jsonb, jsonb) to service_role;

create or replace function public.worker_effective_attempt_limit(p_job_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.worker_max_attempt_count() + coalesce(sum(e.retry_budget), 0)::integer
  from public.worker_recovery_episodes e
  where e.job_id = p_job_id;
$$;

revoke all on function public.worker_effective_attempt_limit(uuid) from public, anon, authenticated;
grant execute on function public.worker_effective_attempt_limit(uuid) to service_role;

-- Single exact-job claim authority. Legacy/pre-cutover queued rows without a governed
-- admission receipt are intentionally quarantined, not silently processed or mutated.
create or replace function public.claim_worker_job(
  p_job_id uuid,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
  v_limit integer;
  v_episode public.worker_recovery_episodes%rowtype;
begin
  if v_claimed_by is null then return; end if;

  perform 1
  from public.analysis_jobs j
  join public.analysis_job_admission_receipts a on a.id = j.admission_receipt_id and a.job_id = j.id
  where j.id = p_job_id
    and j.status = 'queued'
    and j.product_identity in ('screening', 'full_underwriting')
    and j.report_family = j.product_identity
  for update of j;
  if not found then return; end if;

  v_limit := public.worker_effective_attempt_limit(p_job_id);

  if (select worker_attempt_count from public.analysis_jobs where id = p_job_id) >= v_limit then
    update public.analysis_jobs
       set status = 'dead_letter',
           dead_lettered_at = v_now,
           worker_attempt_id = null,
           worker_lease_expires_at = null,
           worker_claimed_at = null,
           worker_last_heartbeat_at = null,
           worker_claimed_by = null,
           terminal_domain = 'internal_platform',
           error_code = 'WORKER_RETRY_BUDGET_EXHAUSTED',
           error_message = 'Bounded worker retry budget exhausted',
           failure_reason = 'bounded_retry_exhausted'
     where id = p_job_id;
    return;
  end if;

  select * into v_episode
  from public.worker_recovery_episodes e
  where e.job_id = p_job_id and e.status = 'open'
  for update;

  if found then
    if v_episode.attempts_consumed >= v_episode.retry_budget then
      update public.worker_recovery_episodes
         set status = 'exhausted', closed_at = v_now
       where id = v_episode.id;
      update public.analysis_jobs
         set status = 'dead_letter',
             dead_lettered_at = v_now,
             recovery_episode_id = null,
             terminal_domain = 'internal_platform',
             error_code = 'RECOVERY_EPISODE_EXHAUSTED',
             error_message = 'Authorized recovery episode exhausted',
             failure_reason = 'bounded_recovery_exhausted'
       where id = p_job_id;
      return;
    end if;
    update public.worker_recovery_episodes
       set attempts_consumed = attempts_consumed + 1
     where id = v_episode.id;
  end if;

  return query
  update public.analysis_jobs j
     set status = 'extracting',
         started_at = v_now,
         worker_attempt_count = coalesce(j.worker_attempt_count, 0) + 1,
         worker_attempt_id = gen_random_uuid(),
         worker_lease_expires_at = v_now + public.worker_lease_duration(),
         worker_claimed_at = v_now,
         worker_last_heartbeat_at = v_now,
         worker_claimed_by = v_claimed_by,
         dead_lettered_at = null,
         error_code = null,
         error_message = null,
         failure_reason = null,
         terminal_domain = null,
         last_checkpoint = 'extracting',
         last_checkpoint_at = v_now
   where j.id = p_job_id
     and j.status = 'queued'
  returning j.*;
end;
$$;

revoke all on function public.claim_worker_job(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_worker_job(uuid, text) to service_role;

-- Retire competing claim primitives from every callable role. They remain defined only
-- for migration/history compatibility and cannot establish current worker authority.
revoke all on function public.claim_next_worker_job(text) from public, anon, authenticated, service_role;
do $$
begin
  if to_regprocedure('public.claim_next_job(text)') is not null then
    execute 'revoke all on function public.claim_next_job(text) from public, anon, authenticated, service_role';
  end if;
  if to_regprocedure('public.claim_and_consume_job(uuid)') is not null then
    execute 'revoke all on function public.claim_and_consume_job(uuid) from public, anon, authenticated, service_role';
  end if;
end $$;

-- One requeue/yield primitive for worker-controlled yield, expired-lease recovery,
-- and explicitly authorized terminal recovery. Attempt count is never reset.
create or replace function public.requeue_worker_job(
  p_job_id uuid,
  p_claimed_by text default null,
  p_allow_expired_lease_recovery boolean default false
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
  v_job public.analysis_jobs%rowtype;
  v_limit integer;
  v_episode public.worker_recovery_episodes%rowtype;
begin
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found or v_job.status = 'published' then return; end if;
  if v_job.admission_receipt_id is null then return; end if;

  v_limit := public.worker_effective_attempt_limit(p_job_id);
  if coalesce(v_job.worker_attempt_count, 0) >= v_limit then return; end if;

  if v_job.status in ('extracting','underwriting','scoring','rendering','pdf_generating','publishing') then
    if v_job.worker_claimed_by = v_claimed_by
       and v_job.worker_lease_expires_at is not null
       and (
         v_job.worker_lease_expires_at > v_now
         or (p_allow_expired_lease_recovery and v_job.worker_lease_expires_at <= v_now)
       ) then
      return query
      update public.analysis_jobs j
         set status = 'queued', started_at = null,
             worker_attempt_id = null, worker_lease_expires_at = null,
             worker_claimed_at = null, worker_last_heartbeat_at = null,
             worker_claimed_by = null, dead_lettered_at = null,
             error_code = null, error_message = null, failure_reason = null,
             last_checkpoint = coalesce(j.last_checkpoint, v_job.status),
             last_checkpoint_at = v_now
       where j.id = p_job_id
      returning j.*;
    end if;
    return;
  end if;

  if v_job.status in ('failed','dead_letter') then
    select * into v_episode
    from public.worker_recovery_episodes e
    where e.job_id = p_job_id and e.status = 'open'
    for update;
    if not found or v_episode.attempts_consumed >= v_episode.retry_budget then return; end if;

    return query
    update public.analysis_jobs j
       set status = 'queued', started_at = null,
           worker_attempt_id = null, worker_lease_expires_at = null,
           worker_claimed_at = null, worker_last_heartbeat_at = null,
           worker_claimed_by = null, dead_lettered_at = null,
           error_code = null, error_message = null, failure_reason = null,
           terminal_domain = null,
           recovery_episode_id = v_episode.id,
           last_checkpoint = coalesce(v_episode.resume_checkpoint, j.last_checkpoint, 'admitted'),
           last_checkpoint_at = v_now
     where j.id = p_job_id
    returning j.*;
  end if;
end;
$$;

revoke all on function public.requeue_worker_job(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.requeue_worker_job(uuid, text, boolean) to service_role;

-- Transition-to-queued delegates to the single requeue primitive after exact attempt fencing.
create or replace function public.transition_worker_job(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_next_status text,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  if p_next_status = 'queued' then
    perform 1 from public.analysis_jobs j
    where j.id = p_job_id
      and j.worker_attempt_id = p_worker_attempt_id
      and j.worker_claimed_by = v_claimed_by
      and j.status = p_expected_current_status;
    if not found then return; end if;
    return query select * from public.requeue_worker_job(p_job_id, v_claimed_by, false);
    return;
  end if;

  return query
  update public.analysis_jobs j
     set status = p_next_status,
         worker_last_heartbeat_at = v_now,
         worker_lease_expires_at = case when p_next_status in ('published','failed','dead_letter') then null else v_now + public.worker_lease_duration() end,
         last_checkpoint = case
           when p_next_status in ('underwriting','scoring','rendering','pdf_generating','publishing','published') then p_next_status
           else j.last_checkpoint
         end,
         last_checkpoint_at = case
           when p_next_status in ('underwriting','scoring','rendering','pdf_generating','publishing','published') then v_now
           else j.last_checkpoint_at
         end
   where j.id = p_job_id
     and j.worker_attempt_id = p_worker_attempt_id
     and j.worker_claimed_by = v_claimed_by
     and j.status = p_expected_current_status
     and j.dead_lettered_at is null
     and j.worker_lease_expires_at is not null
     and j.worker_lease_expires_at > v_now
  returning j.*;
end;
$$;

revoke all on function public.transition_worker_job(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.transition_worker_job(uuid, uuid, text, text, text) to service_role;

-- Explicit bounded admin recovery episode. No new job, purchase, or credit is created.
create or replace function public.begin_worker_recovery_episode(
  p_job_id uuid,
  p_authorized_actor text,
  p_reason text,
  p_resume_checkpoint text default null,
  p_retry_budget integer default 1
)
returns table(episode_id uuid, job_id uuid, purchase_id uuid, status text, retry_budget integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.analysis_jobs%rowtype;
  v_purchase public.report_purchases%rowtype;
  v_purchase_id uuid;
  v_episode_id uuid;
  v_actor text := nullif(btrim(coalesce(p_authorized_actor,'')), '');
  v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
  v_budget integer := greatest(1, least(coalesce(p_retry_budget,1), 3));
begin
  if v_actor is null or v_reason is null then raise exception 'RECOVERY_AUTHORITY_AND_REASON_REQUIRED'; end if;

  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found then raise exception 'RECOVERY_JOB_NOT_FOUND'; end if;
  if v_job.status not in ('failed','dead_letter') then raise exception 'RECOVERY_TERMINAL_STATE_REQUIRED'; end if;
  if v_job.admission_receipt_id is null then raise exception 'RECOVERY_GOVERNED_ADMISSION_REQUIRED'; end if;

  select * into v_purchase
  from public.report_purchases p
  where p.job_id = p_job_id and p.user_id = v_job.user_id
  order by p.created_at asc limit 1 for update;

  if not found then
    select p.* into v_purchase
    from public.analysis_job_events e
    join public.report_purchases p on p.id = nullif(e.meta->>'purchase_id','')::uuid
    where e.job_id = p_job_id
      and e.event_type = 'entitlement_restored'
      and p.user_id = v_job.user_id
      and p.job_id is null
      and p.consumed_at is null
    order by e.created_at desc limit 1
    for update of p;
  end if;
  if not found then raise exception 'RECOVERY_EXACT_PURCHASE_LINEAGE_REQUIRED'; end if;
  v_purchase_id := v_purchase.id;

  if v_purchase.job_id is null and v_purchase.consumed_at is null then
    update public.report_purchases
       set job_id = p_job_id, consumed_at = now()
     where id = v_purchase_id and job_id is null and consumed_at is null;
  elsif v_purchase.job_id = p_job_id and v_purchase.consumed_at is null then
    update public.report_purchases set consumed_at = now() where id = v_purchase_id;
  elsif v_purchase.job_id <> p_job_id then
    raise exception 'RECOVERY_PURCHASE_BOUND_TO_OTHER_JOB';
  end if;

  update public.worker_recovery_episodes
     set status = 'superseded', closed_at = now()
   where job_id = p_job_id and status = 'open';

  insert into public.worker_recovery_episodes(
    job_id, purchase_id, authorized_actor, reason, source_terminal_state,
    resume_checkpoint, retry_budget
  ) values (
    p_job_id, v_purchase_id, v_actor, v_reason, v_job.status,
    coalesce(nullif(btrim(coalesce(p_resume_checkpoint,'')), ''), v_job.last_checkpoint, 'admitted'),
    v_budget
  ) returning id into v_episode_id;

  update public.analysis_jobs
     set status = 'queued', purchase_id = v_purchase_id,
         recovery_episode_id = v_episode_id, terminal_domain = null,
         started_at = null, worker_attempt_id = null, worker_lease_expires_at = null,
         worker_claimed_at = null, worker_last_heartbeat_at = null, worker_claimed_by = null,
         dead_lettered_at = null, error_code = null, error_message = null, failure_reason = null,
         last_checkpoint = coalesce(nullif(btrim(coalesce(p_resume_checkpoint,'')), ''), v_job.last_checkpoint, 'admitted'),
         last_checkpoint_at = now()
   where id = p_job_id;

  insert into public.analysis_job_events(job_id, actor, event_type, from_status, to_status, meta)
  values (
    p_job_id, v_actor, 'recovery_episode_started', v_job.status, 'queued',
    jsonb_build_object('episode_id', v_episode_id, 'purchase_id', v_purchase_id, 'reason', v_reason, 'retry_budget', v_budget)
  );

  episode_id := v_episode_id; job_id := p_job_id; purchase_id := v_purchase_id; status := 'queued'; retry_budget := v_budget;
  return next;
end;
$$;

revoke all on function public.begin_worker_recovery_episode(uuid, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.begin_worker_recovery_episode(uuid, text, text, text, integer) to service_role;

-- Preserve old admin RPC signature as a compatibility adapter to the explicit episode authority.
create or replace function public.governed_requeue_worker_job(
  p_job_id uuid,
  p_claimed_by text default null
)
returns table(
  job_id uuid,
  previous_status text,
  new_status text,
  purchase_id uuid,
  purchase_already_linked boolean,
  purchase_rebound boolean,
  credit_balance_changed boolean,
  new_job_created boolean,
  new_purchase_created boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_previous text;
  v_row record;
begin
  select status into v_previous from public.analysis_jobs where id = p_job_id;
  select * into v_row from public.begin_worker_recovery_episode(
    p_job_id,
    coalesce(nullif(btrim(coalesce(p_claimed_by,'')),''), 'governed_requeue_worker_job'),
    'governed_admin_recovery',
    null,
    1
  );
  job_id := p_job_id;
  previous_status := v_previous;
  new_status := 'queued';
  purchase_id := v_row.purchase_id;
  purchase_already_linked := true;
  purchase_rebound := true;
  credit_balance_changed := false;
  new_job_created := false;
  new_purchase_created := false;
  return next;
end;
$$;

revoke all on function public.governed_requeue_worker_job(uuid, text) from public, anon, authenticated;
grant execute on function public.governed_requeue_worker_job(uuid, text) to service_role;

-- Entitlement restoration + authoritative lineage receipt are one SQL transaction.
create or replace function public.restore_failed_worker_entitlement(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_claimed_by text,
  p_terminal_status text,
  p_restore_reason text default null,
  p_restore_error_code text default null
)
returns table(restored boolean, purchase_id uuid, job_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.analysis_jobs%rowtype;
  v_purchase_id uuid;
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by,'')), '');
begin
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found then return; end if;
  if v_job.worker_attempt_id is distinct from p_worker_attempt_id
     or v_job.worker_claimed_by is distinct from v_claimed_by
     or v_job.status <> p_terminal_status
     or v_job.status not in ('failed','dead_letter') then return; end if;
  if exists (select 1 from public.analysis_jobs j where j.id = p_job_id and j.status = 'published' and j.report_id is not null) then return; end if;

  select p.id into v_purchase_id
  from public.report_purchases p
  where p.job_id = p_job_id and p.user_id = v_job.user_id and p.consumed_at is not null
  order by p.created_at asc limit 1 for update;
  if v_purchase_id is null then return; end if;

  update public.report_purchases set consumed_at = null, job_id = null
   where id = v_purchase_id and job_id = p_job_id and consumed_at is not null;
  if not found then return; end if;

  update public.analysis_jobs
     set purchase_id = null,
         terminal_domain = case
           when coalesce(p_restore_error_code,'') in ('CORE_T12_CATASTROPHICALLY_UNUSABLE','CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE','CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY') then 'source_core'
           else 'internal_platform'
         end
   where id = p_job_id
     and worker_attempt_id = p_worker_attempt_id
     and worker_claimed_by = v_claimed_by
     and status = p_terminal_status;
  if not found then raise exception 'ENTITLEMENT_RESTORE_FENCE_LOST'; end if;

  insert into public.analysis_job_events(job_id, actor, event_type, from_status, to_status, meta)
  values (
    p_job_id, 'worker', 'entitlement_restored', p_terminal_status, p_terminal_status,
    jsonb_build_object(
      'purchase_id', v_purchase_id,
      'worker_attempt_id', p_worker_attempt_id,
      'claimed_by', v_claimed_by,
      'reason', p_restore_reason,
      'error_code', p_restore_error_code
    )
  );

  restored := true; purchase_id := v_purchase_id; job_id := p_job_id; return next;
end;
$$;

revoke all on function public.restore_failed_worker_entitlement(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.restore_failed_worker_entitlement(uuid, uuid, text, text, text, text) to service_role;

-- Immutable checkpoint receipts follow successful stage transitions without becoming a
-- second transition authority.
create or replace function public.record_worker_stage_checkpoint()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if NEW.status is distinct from OLD.status
     and NEW.status in ('extracting','underwriting','scoring','rendering','pdf_generating','publishing','published') then
    insert into public.worker_stage_checkpoints(
      job_id, worker_attempt_id, stage, product_identity, report_family, recovery_episode_id, receipt
    ) values (
      NEW.id, NEW.worker_attempt_id, NEW.status, NEW.product_identity, NEW.report_family, NEW.recovery_episode_id,
      jsonb_build_object('from_status', OLD.status, 'to_status', NEW.status, 'attempt_count', NEW.worker_attempt_count)
    ) on conflict do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists analysis_jobs_worker_checkpoint_trigger on public.analysis_jobs;
create trigger analysis_jobs_worker_checkpoint_trigger
after update of status on public.analysis_jobs
for each row execute function public.record_worker_stage_checkpoint();

-- Legacy queue RPC is not a customer authority; admission already creates a queued job.
do $$
begin
  if to_regprocedure('public.queue_job_for_processing(uuid)') is not null then
    execute 'revoke all on function public.queue_job_for_processing(uuid) from public, anon, authenticated';
    execute 'grant execute on function public.queue_job_for_processing(uuid) to service_role';
  end if;
end $$;

commit;
