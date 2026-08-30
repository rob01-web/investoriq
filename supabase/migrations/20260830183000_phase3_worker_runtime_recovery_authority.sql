begin;

-- Phase 3 keeps one declared scheduler authority while activation remains an
-- explicit production operation outside this migration.
create table if not exists public.worker_scheduler_authority (
  singleton boolean primary key default true check (singleton),
  authority text not null check (authority = 'supabase_cron_pg_net'),
  endpoint_path text not null check (endpoint_path = '/api/admin-run-worker'),
  schedule_expression text not null,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.worker_scheduler_authority(
  singleton,
  authority,
  endpoint_path,
  schedule_expression,
  enabled,
  updated_at
)
values (true, 'supabase_cron_pg_net', '/api/admin-run-worker', '*/3 * * * *', false, now())
on conflict (singleton) do update
set authority = excluded.authority,
    endpoint_path = excluded.endpoint_path,
    schedule_expression = excluded.schedule_expression,
    enabled = false,
    updated_at = now();

alter table public.worker_scheduler_authority enable row level security;
revoke all on table public.worker_scheduler_authority from public, anon, authenticated;
grant select on table public.worker_scheduler_authority to service_role;

-- Three base attempts plus at most three explicitly authorized lifetime
-- recovery attempts. Superseded episodes cannot expand the lifetime budget.
create or replace function public.worker_effective_attempt_limit(p_job_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select least(
    public.worker_max_attempt_count() + 3,
    public.worker_max_attempt_count() + coalesce(sum(e.retry_budget), 0)::integer
  )
  from public.worker_recovery_episodes e
  where e.job_id = p_job_id;
$$;

revoke all on function public.worker_effective_attempt_limit(uuid) from public, anon, authenticated;
grant execute on function public.worker_effective_attempt_limit(uuid) to service_role;

create or replace function public.enforce_worker_recovery_lifetime_budget()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt_count integer;
  v_remaining integer;
begin
  select coalesce(j.worker_attempt_count, 0)
    into v_attempt_count
  from public.analysis_jobs j
  where j.id = new.job_id
  for update;

  if not found then
    raise exception 'RECOVERY_JOB_NOT_FOUND';
  end if;

  v_remaining := public.worker_max_attempt_count() + 3 - v_attempt_count;
  if v_remaining <= 0 then
    raise exception 'RECOVERY_LIFETIME_BUDGET_EXHAUSTED';
  end if;

  new.retry_budget := greatest(1, least(coalesce(new.retry_budget, 1), 3, v_remaining));
  return new;
end;
$$;

drop trigger if exists worker_recovery_lifetime_budget_guard on public.worker_recovery_episodes;
create trigger worker_recovery_lifetime_budget_guard
before insert on public.worker_recovery_episodes
for each row execute function public.enforce_worker_recovery_lifetime_budget();

revoke all on function public.enforce_worker_recovery_lifetime_budget() from public, anon, authenticated;

-- One requeue primitive now resolves exhaustion immediately. It does not leave
-- an active job waiting for a later claim or lease expiry to reach dead letter.
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
  v_authorized boolean := false;
  v_exhaustion_code text;
  v_exhaustion_reason text;
begin
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found or v_job.status = 'published' or v_job.admission_receipt_id is null then return; end if;

  if v_job.status in ('extracting','underwriting','scoring','rendering','pdf_generating','publishing') then
    v_authorized := v_job.worker_claimed_by = v_claimed_by
      and v_job.worker_lease_expires_at is not null
      and (
        v_job.worker_lease_expires_at > v_now
        or (p_allow_expired_lease_recovery and v_job.worker_lease_expires_at <= v_now)
      );
  elsif v_job.status in ('failed','dead_letter') then
    select * into v_episode
    from public.worker_recovery_episodes e
    where e.job_id = p_job_id and e.status = 'open'
    for update;
    v_authorized := found and v_episode.attempts_consumed < v_episode.retry_budget;
  end if;

  if not v_authorized then return; end if;

  v_limit := public.worker_effective_attempt_limit(p_job_id);
  if coalesce(v_job.worker_attempt_count, 0) >= v_limit then
    v_exhaustion_code := case
      when v_episode.id is not null then 'RECOVERY_EPISODE_EXHAUSTED'
      else 'WORKER_RETRY_BUDGET_EXHAUSTED'
    end;
    v_exhaustion_reason := case
      when v_episode.id is not null then 'bounded_recovery_exhausted'
      else 'bounded_retry_exhausted'
    end;

    if v_episode.id is not null then
      update public.worker_recovery_episodes
         set status = 'exhausted', closed_at = v_now
       where id = v_episode.id;
    end if;

    update public.analysis_jobs
       set status = 'dead_letter',
           dead_lettered_at = v_now,
           recovery_episode_id = null,
           worker_attempt_id = null,
           worker_lease_expires_at = null,
           worker_claimed_at = null,
           worker_last_heartbeat_at = null,
           worker_claimed_by = null,
           terminal_domain = 'internal_platform',
           error_code = v_exhaustion_code,
           error_message = 'Bounded worker retry budget exhausted',
           failure_reason = v_exhaustion_reason
     where id = p_job_id;

    perform public.restore_job_entitlement_on_exhaustion(
      p_job_id,
      v_exhaustion_reason,
      v_exhaustion_code
    );

    return query select j.* from public.analysis_jobs j where j.id = p_job_id;
    return;
  end if;

  if v_job.status in ('extracting','underwriting','scoring','rendering','pdf_generating','publishing') then
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
           failure_reason = null,
           last_checkpoint = coalesce(j.last_checkpoint, v_job.status),
           last_checkpoint_at = v_now
     where j.id = p_job_id
    returning j.*;
    return;
  end if;

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
         failure_reason = null,
         terminal_domain = null,
         recovery_episode_id = v_episode.id,
         last_checkpoint = coalesce(v_episode.resume_checkpoint, j.last_checkpoint, 'admitted'),
         last_checkpoint_at = v_now
   where j.id = p_job_id
  returning j.*;
end;
$$;

revoke all on function public.requeue_worker_job(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.requeue_worker_job(uuid, text, boolean) to service_role;

commit;
