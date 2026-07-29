alter table public.analysis_jobs
  add column if not exists worker_attempt_id uuid,
  add column if not exists worker_attempt_count integer not null default 0,
  add column if not exists worker_lease_expires_at timestamptz,
  add column if not exists worker_claimed_at timestamptz,
  add column if not exists worker_last_heartbeat_at timestamptz,
  add column if not exists worker_claimed_by text,
  add column if not exists dead_lettered_at timestamptz;

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_worker_attempt_count_nonnegative;

alter table public.analysis_jobs
  add constraint analysis_jobs_worker_attempt_count_nonnegative
  check (worker_attempt_count >= 0);

alter table public.analysis_jobs
  drop constraint if exists analysis_jobs_dead_letter_terminal_state;

alter table public.analysis_jobs
  add constraint analysis_jobs_dead_letter_terminal_state
  check (dead_lettered_at is null or status = 'dead_letter');

create or replace function public.worker_lease_duration()
returns interval
language sql
immutable
as $$
  select interval '30 minutes';
$$;

create or replace function public.worker_max_attempt_count()
returns integer
language sql
immutable
as $$
  select 3;
$$;

create or replace function public.claim_worker_job(
  p_job_id uuid,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  return query
  with target as (
    select j.id
    from public.analysis_jobs j
    where j.id = p_job_id
    for update
  ),
  claimed as (
    update public.analysis_jobs j
    set
      status = 'extracting',
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
      failure_reason = null
    from target t
    where j.id = t.id
      and j.status = 'queued'
      and j.dead_lettered_at is null
      and (j.worker_lease_expires_at is null or j.worker_lease_expires_at <= v_now)
    returning j.*
  )
  select * from claimed;
end;
$$;

create or replace function public.claim_next_worker_job(
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_id uuid;
begin
  select j.id
    into v_target_id
  from public.analysis_jobs j
  where j.status = 'queued'
    and j.dead_lettered_at is null
    and (j.worker_lease_expires_at is null or j.worker_lease_expires_at <= now())
  order by j.created_at asc, j.id asc
  for update skip locked
  limit 1;

  if v_target_id is null then
    return;
  end if;

  return query
  select * from public.claim_worker_job(v_target_id, p_claimed_by);
end;
$$;

create or replace function public.renew_worker_lease(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  return query
  update public.analysis_jobs j
     set worker_last_heartbeat_at = v_now,
         worker_lease_expires_at = v_now + public.worker_lease_duration(),
         worker_claimed_by = coalesce(v_claimed_by, j.worker_claimed_by)
   where j.id = p_job_id
     and j.worker_attempt_id = p_worker_attempt_id
     and j.dead_lettered_at is null
     and j.status in ('extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing')
     and j.worker_lease_expires_at is not null
     and j.worker_lease_expires_at > v_now
  returning j.*;
end;
$$;

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
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
begin
  return query
  update public.analysis_jobs j
     set status = p_next_status,
         worker_last_heartbeat_at = v_now,
         worker_lease_expires_at = case
           when p_next_status in ('published', 'failed', 'dead_letter') then null
           else v_now + public.worker_lease_duration()
         end,
         worker_claimed_by = coalesce(v_claimed_by, j.worker_claimed_by)
   where j.id = p_job_id
     and j.worker_attempt_id = p_worker_attempt_id
     and j.status = p_expected_current_status
     and j.dead_lettered_at is null
     and (
       p_expected_current_status = 'queued'
       or (j.worker_lease_expires_at is not null and j.worker_lease_expires_at > v_now)
     )
  returning j.*;
end;
$$;

create or replace function public.fail_worker_job(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_error_code text default null,
  p_error_message text default null,
  p_failure_reason text default null,
  p_claimed_by text default null
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
  v_retry_limit integer := public.worker_max_attempt_count();
begin
  return query
  update public.analysis_jobs j
     set status = case
           when coalesce(j.worker_attempt_count, 0) >= v_retry_limit then 'dead_letter'
           else 'failed'
         end,
         worker_last_heartbeat_at = v_now,
         worker_lease_expires_at = null,
         worker_claimed_by = coalesce(v_claimed_by, j.worker_claimed_by),
         dead_lettered_at = case
           when coalesce(j.worker_attempt_count, 0) >= v_retry_limit then v_now
           else j.dead_lettered_at
         end,
         error_code = case when p_error_code is null then j.error_code else p_error_code end,
         error_message = case when p_error_message is null then j.error_message else p_error_message end,
         failure_reason = case when p_failure_reason is null then j.failure_reason else p_failure_reason end
   where j.id = p_job_id
     and j.worker_attempt_id = p_worker_attempt_id
     and j.status = p_expected_current_status
     and j.dead_lettered_at is null
     and j.worker_lease_expires_at is not null
     and j.worker_lease_expires_at > v_now
  returning j.*;
end;
$$;

create or replace function public.requeue_worker_job(
  p_job_id uuid,
  p_claimed_by text default null,
  p_allow_expired_lease_recovery boolean default false
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  return query
  update public.analysis_jobs j
     set status = 'queued',
         started_at = null,
         worker_attempt_id = null,
         worker_lease_expires_at = null,
         worker_claimed_at = null,
         worker_last_heartbeat_at = null,
         worker_claimed_by = null,
         dead_lettered_at = null,
         error_code = null,
         error_message = null,
         failure_reason = null
   where j.id = p_job_id
     and j.status <> 'published'
     and (
       j.status in ('failed', 'dead_letter')
       or (
         p_allow_expired_lease_recovery = true
         and j.status in ('extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing')
         and j.worker_lease_expires_at is not null
         and j.worker_lease_expires_at <= v_now
       )
     )
  returning j.*;
end;
$$;

create or replace function public.claim_next_job()
returns setof public.analysis_jobs
language sql
security definer
set search_path = public
as $$
  select * from public.claim_next_worker_job();
$$;

create or replace function public.admin_requeue_job(
  p_job_id uuid,
  p_reason text default null
)
returns setof public.analysis_jobs
language sql
security definer
set search_path = public
as $$
  select * from public.requeue_worker_job(p_job_id, p_reason, false);
$$;

revoke all on function public.worker_lease_duration() from public;
revoke all on function public.worker_max_attempt_count() from public;
revoke all on function public.claim_worker_job(uuid, text) from public;
revoke all on function public.claim_next_worker_job(text) from public;
revoke all on function public.renew_worker_lease(uuid, uuid, text) from public;
revoke all on function public.transition_worker_job(uuid, uuid, text, text, text) from public;
revoke all on function public.fail_worker_job(uuid, uuid, text, text, text, text, text) from public;
revoke all on function public.requeue_worker_job(uuid, text, boolean) from public;
revoke all on function public.claim_next_job() from public;
revoke all on function public.admin_requeue_job(uuid, text) from public;

grant execute on function public.worker_lease_duration() to service_role;
grant execute on function public.worker_max_attempt_count() to service_role;
grant execute on function public.claim_worker_job(uuid, text) to service_role;
grant execute on function public.claim_next_worker_job(text) to service_role;
grant execute on function public.renew_worker_lease(uuid, uuid, text) to service_role;
grant execute on function public.transition_worker_job(uuid, uuid, text, text, text) to service_role;
grant execute on function public.fail_worker_job(uuid, uuid, text, text, text, text, text) to service_role;
grant execute on function public.requeue_worker_job(uuid, text, boolean) to service_role;
grant execute on function public.claim_next_job() to service_role;
grant execute on function public.admin_requeue_job(uuid, text) to service_role;
