begin;

-- New launch jobs are intentionally narrow. Historical aliases remain as data but cannot
-- be inserted into the active launch lane after this cutover.
alter table public.analysis_jobs drop constraint if exists analysis_jobs_report_type_check;
alter table public.analysis_jobs
  add constraint analysis_jobs_report_type_current_launch_check
  check (report_type in ('screening','underwriting')) not valid;

-- Explicit lineage constraints for the new governed authorities.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'analysis_jobs_admission_receipt_id_fkey') then
    alter table public.analysis_jobs
      add constraint analysis_jobs_admission_receipt_id_fkey
      foreign key (admission_receipt_id) references public.analysis_job_admission_receipts(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'analysis_jobs_recovery_episode_id_fkey') then
    alter table public.analysis_jobs
      add constraint analysis_jobs_recovery_episode_id_fkey
      foreign key (recovery_episode_id) references public.worker_recovery_episodes(id);
  end if;
end $$;

-- Immutable/append-only authority surfaces are readable by trusted service operations but
-- not directly mutable outside their SECURITY DEFINER primitives.
grant select on table public.analysis_job_admission_receipts to service_role;
grant select on table public.worker_recovery_episodes to service_role;
grant select on table public.worker_stage_checkpoints to service_role;
grant select on table public.report_publication_receipts to service_role;
revoke update, delete on table public.analysis_job_admission_receipts from service_role;
revoke delete on table public.worker_recovery_episodes from service_role;
revoke update, delete on table public.worker_stage_checkpoints from service_role;
revoke update, delete on table public.report_publication_receipts from service_role;

create table if not exists public.legacy_job_reconciliation_decisions (
  job_id uuid primary key references public.analysis_jobs(id) on delete cascade,
  classified_state text not null check (classified_state in ('quarantined','remedy_required','archive_only','eligible_for_governed_migration')),
  reason text not null,
  authorized_actor text not null,
  decision_meta jsonb not null default '{}'::jsonb,
  decided_at timestamptz not null default now()
);
alter table public.legacy_job_reconciliation_decisions enable row level security;
revoke all on table public.legacy_job_reconciliation_decisions from anon, authenticated;
grant select, insert on table public.legacy_job_reconciliation_decisions to service_role;
revoke update, delete on table public.legacy_job_reconciliation_decisions from service_role;

-- Read-only operational projection: actual state, lease, attempts, recovery, checkpoint,
-- product provenance, and terminal jurisdiction. It is internal/service-only.
create or replace view public.worker_operational_status
with (security_invoker = true)
as
select
  j.id as job_id,
  j.user_id,
  j.report_type,
  j.product_identity,
  j.report_family,
  j.status,
  j.worker_attempt_count,
  public.worker_effective_attempt_limit(j.id) as effective_attempt_limit,
  j.worker_attempt_id,
  j.worker_claimed_by,
  j.worker_claimed_at,
  j.worker_last_heartbeat_at,
  j.worker_lease_expires_at,
  (j.worker_lease_expires_at is not null and j.worker_lease_expires_at <= now()) as lease_expired,
  j.recovery_episode_id,
  re.retry_budget as recovery_retry_budget,
  re.attempts_consumed as recovery_attempts_consumed,
  re.status as recovery_status,
  j.last_checkpoint,
  j.last_checkpoint_at,
  j.terminal_domain,
  j.error_code,
  j.created_at,
  j.dead_lettered_at,
  j.admission_receipt_id,
  (j.admission_receipt_id is null) as legacy_quarantined
from public.analysis_jobs j
left join public.worker_recovery_episodes re on re.id = j.recovery_episode_id;

revoke all on table public.worker_operational_status from public, anon, authenticated;
grant select on table public.worker_operational_status to service_role;

create or replace function public.restore_job_entitlement_on_exhaustion(
  p_job_id uuid,
  p_reason text,
  p_error_code text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.analysis_jobs%rowtype;
  v_purchase_id uuid;
begin
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found or v_job.status not in ('queued','failed','dead_letter') then return null; end if;
  if exists (
    select 1 from public.report_publication_receipts pr
    where pr.job_id = p_job_id and pr.publication_status = 'complete'
  ) then return null; end if;

  select p.id into v_purchase_id
  from public.report_purchases p
  where p.job_id = p_job_id
    and p.user_id = v_job.user_id
    and p.consumed_at is not null
  order by p.created_at asc limit 1 for update;

  if v_purchase_id is null then return null; end if;

  update public.report_purchases
     set consumed_at = null, job_id = null
   where id = v_purchase_id and job_id = p_job_id and consumed_at is not null;
  if not found then return null; end if;

  update public.analysis_jobs set purchase_id = null where id = p_job_id;

  insert into public.analysis_job_events(job_id, actor, event_type, from_status, to_status, meta)
  values (
    p_job_id, 'worker_authority', 'entitlement_restored', v_job.status, v_job.status,
    jsonb_build_object(
      'purchase_id', v_purchase_id,
      'reason', p_reason,
      'error_code', p_error_code,
      'authority', 'bounded_retry_exhaustion'
    )
  );
  return v_purchase_id;
end;
$$;
revoke all on function public.restore_job_entitlement_on_exhaustion(uuid,text,text) from public, anon, authenticated;
grant execute on function public.restore_job_entitlement_on_exhaustion(uuid,text,text) to service_role;

-- Re-issue the single claim primitive with atomic entitlement remedy on exhausted budgets.
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
  v_job public.analysis_jobs%rowtype;
  v_limit integer;
  v_episode public.worker_recovery_episodes%rowtype;
begin
  if v_claimed_by is null then return; end if;

  select j.* into v_job
  from public.analysis_jobs j
  join public.analysis_job_admission_receipts a
    on a.id = j.admission_receipt_id and a.job_id = j.id and a.user_id = j.user_id
  where j.id = p_job_id
    and j.status = 'queued'
    and j.product_identity in ('screening','full_underwriting')
    and j.report_family = j.product_identity
  for update of j;
  if not found then return; end if;

  v_limit := public.worker_effective_attempt_limit(p_job_id);
  if coalesce(v_job.worker_attempt_count,0) >= v_limit then
    update public.analysis_jobs
       set status = 'dead_letter', dead_lettered_at = v_now,
           worker_attempt_id = null, worker_lease_expires_at = null,
           worker_claimed_at = null, worker_last_heartbeat_at = null, worker_claimed_by = null,
           terminal_domain = 'internal_platform', error_code = 'WORKER_RETRY_BUDGET_EXHAUSTED',
           error_message = 'Bounded worker retry budget exhausted', failure_reason = 'bounded_retry_exhausted'
     where id = p_job_id;
    perform public.restore_job_entitlement_on_exhaustion(
      p_job_id, 'bounded_retry_exhausted', 'WORKER_RETRY_BUDGET_EXHAUSTED'
    );
    return;
  end if;

  select * into v_episode
  from public.worker_recovery_episodes e
  where e.job_id = p_job_id and e.status = 'open'
  for update;

  if found then
    if v_episode.attempts_consumed >= v_episode.retry_budget then
      update public.worker_recovery_episodes set status = 'exhausted', closed_at = v_now where id = v_episode.id;
      update public.analysis_jobs
         set status = 'dead_letter', dead_lettered_at = v_now, recovery_episode_id = null,
             terminal_domain = 'internal_platform', error_code = 'RECOVERY_EPISODE_EXHAUSTED',
             error_message = 'Authorized recovery episode exhausted', failure_reason = 'bounded_recovery_exhausted'
       where id = p_job_id;
      perform public.restore_job_entitlement_on_exhaustion(
        p_job_id, 'bounded_recovery_exhausted', 'RECOVERY_EPISODE_EXHAUSTED'
      );
      return;
    end if;
    update public.worker_recovery_episodes set attempts_consumed = attempts_consumed + 1 where id = v_episode.id;
  end if;

  return query
  update public.analysis_jobs j
     set status = 'extracting', started_at = v_now,
         worker_attempt_count = coalesce(j.worker_attempt_count,0) + 1,
         worker_attempt_id = gen_random_uuid(),
         worker_lease_expires_at = v_now + public.worker_lease_duration(),
         worker_claimed_at = v_now, worker_last_heartbeat_at = v_now,
         worker_claimed_by = v_claimed_by, dead_lettered_at = null,
         error_code = null, error_message = null, failure_reason = null,
         terminal_domain = null, last_checkpoint = 'extracting', last_checkpoint_at = v_now
   where j.id = p_job_id and j.status = 'queued'
  returning j.*;
end;
$$;
revoke all on function public.claim_worker_job(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_worker_job(uuid,text) to service_role;

-- Safer recovery-episode purchase lookup; malformed historical event metadata cannot cast
-- into UUID and accidentally break governed recovery.
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
  v_budget integer := greatest(1, least(coalesce(p_retry_budget,1),3));
begin
  if v_actor is null or v_reason is null then raise exception 'RECOVERY_AUTHORITY_AND_REASON_REQUIRED'; end if;
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found then raise exception 'RECOVERY_JOB_NOT_FOUND'; end if;
  if v_job.status not in ('failed','dead_letter') then raise exception 'RECOVERY_TERMINAL_STATE_REQUIRED'; end if;
  if v_job.admission_receipt_id is null then raise exception 'RECOVERY_GOVERNED_ADMISSION_REQUIRED'; end if;
  if exists (select 1 from public.report_publication_receipts pr where pr.job_id = p_job_id) then
    raise exception 'RECOVERY_PUBLISHED_JOB_NOT_ELIGIBLE';
  end if;

  select * into v_purchase
  from public.report_purchases p
  where p.job_id = p_job_id and p.user_id = v_job.user_id
  order by p.created_at asc limit 1 for update;

  if not found then
    select p.* into v_purchase
    from (
      select (e.meta->>'purchase_id')::uuid as purchase_id, e.created_at
      from public.analysis_job_events e
      where e.job_id = p_job_id
        and e.event_type = 'entitlement_restored'
        and coalesce(e.meta->>'purchase_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      order by e.created_at desc
      limit 1
    ) lineage
    join public.report_purchases p on p.id = lineage.purchase_id
    where p.user_id = v_job.user_id and p.job_id is null and p.consumed_at is null
    for update of p;
  end if;
  if not found then raise exception 'RECOVERY_EXACT_PURCHASE_LINEAGE_REQUIRED'; end if;
  v_purchase_id := v_purchase.id;

  if v_purchase.job_id is null and v_purchase.consumed_at is null then
    update public.report_purchases set job_id = p_job_id, consumed_at = now()
     where id = v_purchase_id and job_id is null and consumed_at is null;
  elsif v_purchase.job_id = p_job_id and v_purchase.consumed_at is null then
    update public.report_purchases set consumed_at = now() where id = v_purchase_id;
  elsif v_purchase.job_id <> p_job_id then
    raise exception 'RECOVERY_PURCHASE_BOUND_TO_OTHER_JOB';
  end if;

  update public.worker_recovery_episodes set status = 'superseded', closed_at = now()
   where job_id = p_job_id and status = 'open';

  insert into public.worker_recovery_episodes(
    job_id,purchase_id,authorized_actor,reason,source_terminal_state,resume_checkpoint,retry_budget
  ) values (
    p_job_id,v_purchase_id,v_actor,v_reason,v_job.status,
    coalesce(nullif(btrim(coalesce(p_resume_checkpoint,'')),''),v_job.last_checkpoint,'admitted'),v_budget
  ) returning id into v_episode_id;

  update public.analysis_jobs
     set status='queued', purchase_id=v_purchase_id, recovery_episode_id=v_episode_id,
         terminal_domain=null, started_at=null, worker_attempt_id=null, worker_lease_expires_at=null,
         worker_claimed_at=null, worker_last_heartbeat_at=null, worker_claimed_by=null,
         dead_lettered_at=null, error_code=null, error_message=null, failure_reason=null,
         last_checkpoint=coalesce(nullif(btrim(coalesce(p_resume_checkpoint,'')),''),v_job.last_checkpoint,'admitted'),
         last_checkpoint_at=now()
   where id=p_job_id;

  insert into public.analysis_job_events(job_id,actor,event_type,from_status,to_status,meta)
  values (
    p_job_id,v_actor,'recovery_episode_started',v_job.status,'queued',
    jsonb_build_object('episode_id',v_episode_id,'purchase_id',v_purchase_id,'reason',v_reason,'retry_budget',v_budget)
  );

  episode_id:=v_episode_id; job_id:=p_job_id; purchase_id:=v_purchase_id; status:='queued'; retry_budget:=v_budget;
  return next;
end;
$$;
revoke all on function public.begin_worker_recovery_episode(uuid,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.begin_worker_recovery_episode(uuid,text,text,text,integer) to service_role;

create or replace function public.classify_worker_terminal_domain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if NEW.status in ('failed','dead_letter') and NEW.status is distinct from OLD.status then
    NEW.terminal_domain := case
      when coalesce(NEW.error_code,'') in (
        'ADMISSION_PROVENANCE_INVALID','UNSUPPORTED_PRODUCT','JOB_INTEGRITY_INVALID'
      ) then 'admission_integrity'
      when coalesce(NEW.error_code,'') in (
        'CORE_T12_CATASTROPHICALLY_UNUSABLE','CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE','CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY'
      ) then 'source_core'
      else 'internal_platform'
    end;
  end if;
  return NEW;
end;
$$;
drop trigger if exists analysis_jobs_terminal_domain_trigger on public.analysis_jobs;
create trigger analysis_jobs_terminal_domain_trigger
before update of status,error_code on public.analysis_jobs
for each row execute function public.classify_worker_terminal_domain();

create or replace function public.close_worker_recovery_episode_on_publication()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if NEW.status = 'published' and OLD.status is distinct from NEW.status and NEW.recovery_episode_id is not null then
    update public.worker_recovery_episodes
       set status='completed', closed_at=now()
     where id=NEW.recovery_episode_id and status='open';
  end if;
  return NEW;
end;
$$;
drop trigger if exists analysis_jobs_recovery_episode_close_trigger on public.analysis_jobs;
create trigger analysis_jobs_recovery_episode_close_trigger
after update of status on public.analysis_jobs
for each row execute function public.close_worker_recovery_episode_on_publication();

commit;
