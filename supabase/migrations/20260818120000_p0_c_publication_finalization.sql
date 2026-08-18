begin;

create table if not exists public.report_publication_receipts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.analysis_jobs(id) on delete cascade,
  report_id uuid not null unique references public.reports(id) on delete cascade,
  user_id uuid not null,
  product_identity text not null check (product_identity in ('screening','full_underwriting')),
  report_family text not null check (report_family in ('screening','full_underwriting')),
  revision_request_key text not null unique,
  storage_path text not null,
  storage_object_id uuid not null,
  storage_metadata jsonb not null default '{}'::jsonb,
  manifest_artifact_id uuid not null references public.analysis_artifacts(id),
  delivery_gate_artifact_id uuid not null references public.analysis_artifacts(id),
  canonical_delivery_action text not null check (
    canonical_delivery_action in ('DELIVER','DELIVER_WITH_QUALITY_INCIDENT')
  ),
  publication_status text not null default 'complete' check (publication_status = 'complete'),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.report_publication_receipts enable row level security;
revoke all on table public.report_publication_receipts from anon, authenticated;
create index if not exists report_publication_receipts_user_report_idx
  on public.report_publication_receipts(user_id, report_id);

create or replace function public.finalize_worker_publication(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_claimed_by text
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_job public.analysis_jobs%rowtype;
  v_report public.reports%rowtype;
  v_manifest public.analysis_artifacts%rowtype;
  v_delivery public.analysis_artifacts%rowtype;
  v_decision jsonb;
  v_storage storage.objects%rowtype;
  v_action text;
  v_existing public.report_publication_receipts%rowtype;
begin
  select * into v_job from public.analysis_jobs where id = p_job_id for update;
  if not found then return; end if;
  if v_job.status <> p_expected_current_status
     or v_job.worker_attempt_id is distinct from p_worker_attempt_id
     or v_job.worker_claimed_by is distinct from nullif(btrim(coalesce(p_claimed_by,'')), '')
     or v_job.worker_lease_expires_at is null
     or v_job.worker_lease_expires_at <= v_now then return; end if;
  if v_job.admission_receipt_id is null
     or v_job.product_identity not in ('screening','full_underwriting')
     or v_job.report_family <> v_job.product_identity then
    raise exception 'PUBLICATION_GOVERNED_ADMISSION_REQUIRED';
  end if;
  if v_job.report_id is null then raise exception 'PUBLICATION_REPORT_LINK_REQUIRED'; end if;

  select * into v_report from public.reports where id = v_job.report_id for update;
  if not found then raise exception 'PUBLICATION_REPORT_NOT_FOUND'; end if;
  if v_report.user_id <> v_job.user_id then raise exception 'PUBLICATION_OWNER_LINEAGE_MISMATCH'; end if;
  if v_report.status <> 'published' then raise exception 'PUBLICATION_REPORT_ROW_NOT_READY'; end if;
  if v_report.revision_request_key is null then raise exception 'PUBLICATION_REVISION_REQUEST_KEY_REQUIRED'; end if;
  if v_report.revision_source_job_id is distinct from v_job.id then
    raise exception 'PUBLICATION_REVISION_SOURCE_JOB_MISMATCH';
  end if;
  if (v_job.product_identity = 'screening' and v_report.report_type <> 'screening')
     or (v_job.product_identity = 'full_underwriting' and v_report.report_type <> 'underwriting') then
    raise exception 'PUBLICATION_PRODUCT_REPORT_MISMATCH';
  end if;

  select * into v_storage
  from storage.objects o
  where o.bucket_id = 'generated_reports' and o.name = v_report.storage_path
  limit 1;
  if not found then raise exception 'PUBLICATION_GENERATED_OBJECT_MISSING'; end if;

  select * into v_manifest
  from public.analysis_artifacts a
  where a.job_id = v_job.id
    and a.user_id = v_job.user_id
    and a.type = 'report_quality_manifest'
  order by a.created_at desc limit 1;
  if not found then raise exception 'PUBLICATION_QUALITY_MANIFEST_REQUIRED'; end if;

  select * into v_delivery
  from public.analysis_artifacts a
  where a.job_id = v_job.id
    and a.user_id = v_job.user_id
    and a.type = 'delivery_gate_decision'
  order by a.created_at desc limit 1;
  if not found then raise exception 'PUBLICATION_CANONICAL_DELIVERY_DECISION_REQUIRED'; end if;

  v_decision := coalesce(v_delivery.payload->'deliveryDecisionState', v_delivery.payload);
  if coalesce(v_decision->>'source','') <> 'canonical_delivery_decision' then
    raise exception 'PUBLICATION_DELIVERY_DECISION_NOT_CANONICAL';
  end if;
  if coalesce((v_decision->>'customer_delivery_allowed')::boolean, false) is not true then
    raise exception 'PUBLICATION_DELIVERY_NOT_ALLOWED';
  end if;
  if coalesce((v_decision->>'core_valid_required_coverage')::boolean, false) is not true then
    raise exception 'PUBLICATION_CORE_COVERAGE_NOT_VALID';
  end if;

  v_action := case
    when lower(coalesce(v_decision->>'delivery_gate_status','')) like '%quality%'
      or lower(coalesce(v_manifest.payload->>'publication_state','')) like '%quality%'
      then 'DELIVER_WITH_QUALITY_INCIDENT'
    else 'DELIVER'
  end;

  select * into v_existing
  from public.report_publication_receipts r
  where r.job_id = v_job.id
  for update;

  if found then
    if v_existing.report_id <> v_report.id
       or v_existing.revision_request_key <> v_report.revision_request_key
       or v_existing.storage_path <> v_report.storage_path
       or v_existing.manifest_artifact_id <> v_manifest.id
       or v_existing.delivery_gate_artifact_id <> v_delivery.id then
      raise exception 'PUBLICATION_RECEIPT_IDEMPOTENCY_CONFLICT';
    end if;
  else
    insert into public.report_publication_receipts(
      job_id, report_id, user_id, product_identity, report_family,
      revision_request_key, storage_path, storage_object_id, storage_metadata,
      manifest_artifact_id, delivery_gate_artifact_id, canonical_delivery_action,
      publication_status, completed_at
    ) values (
      v_job.id, v_report.id, v_job.user_id, v_job.product_identity, v_job.report_family,
      v_report.revision_request_key, v_report.storage_path, v_storage.id, coalesce(v_storage.metadata,'{}'::jsonb),
      v_manifest.id, v_delivery.id, v_action, 'complete', v_now
    );
  end if;

  return query
  update public.analysis_jobs j
     set status = 'published',
         worker_lease_expires_at = null,
         worker_last_heartbeat_at = v_now,
         terminal_domain = null,
         last_checkpoint = 'published',
         last_checkpoint_at = v_now
   where j.id = v_job.id
     and j.status = p_expected_current_status
     and j.worker_attempt_id = p_worker_attempt_id
     and j.worker_claimed_by = nullif(btrim(coalesce(p_claimed_by,'')), '')
  returning j.*;
end;
$$;

revoke all on function public.finalize_worker_publication(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.finalize_worker_publication(uuid, uuid, text, text) to service_role;

-- The existing transition RPC remains the worker-facing state API, but published is now
-- a delegated finalization operation and queued is delegated to the single requeue authority.
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
  if p_next_status = 'published' then
    return query select * from public.finalize_worker_publication(
      p_job_id, p_worker_attempt_id, p_expected_current_status, v_claimed_by
    );
    return;
  end if;

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
         worker_lease_expires_at = v_now + public.worker_lease_duration(),
         last_checkpoint = case
           when p_next_status in ('underwriting','scoring','rendering','pdf_generating','publishing') then p_next_status
           else j.last_checkpoint
         end,
         last_checkpoint_at = case
           when p_next_status in ('underwriting','scoring','rendering','pdf_generating','publishing') then v_now
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

-- A report is current only when a complete publication receipt proves exact job/report lineage.
create or replace function public.report_revision_has_published_analysis_job(p_report_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.analysis_jobs j
    join public.report_publication_receipts pr
      on pr.job_id = j.id and pr.report_id = p_report_id and pr.publication_status = 'complete'
    join public.reports r on r.id = p_report_id
    where j.report_id = p_report_id
      and j.status = 'published'
      and j.user_id = r.user_id
      and pr.user_id = r.user_id
      and pr.revision_request_key = r.revision_request_key
      and pr.storage_path = r.storage_path
  );
$$;

create or replace function public.promote_report_revision_to_current(p_report_id uuid)
returns table(promoted boolean, stale boolean, report_id uuid, demoted_report_id uuid, revision_family_key text, revision_number integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_target public.reports%rowtype;
  v_receipt public.report_publication_receipts%rowtype;
  v_job public.analysis_jobs%rowtype;
  v_current public.reports%rowtype;
  v_demoted uuid := null;
begin
  select * into v_target from public.reports where id = p_report_id for update;
  if not found then raise exception 'REPORT_REVISION_NOT_FOUND'; end if;

  select * into v_receipt
  from public.report_publication_receipts pr
  where pr.report_id = v_target.id and pr.publication_status = 'complete'
  for update;
  if not found then return query select false, false, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number; return; end if;

  select * into v_job from public.analysis_jobs where id = v_receipt.job_id;
  if not found or v_job.status <> 'published'
     or v_job.report_id <> v_target.id
     or v_job.user_id <> v_target.user_id
     or v_receipt.user_id <> v_target.user_id
     or v_receipt.revision_request_key <> v_target.revision_request_key
     or v_receipt.storage_path <> v_target.storage_path
     or v_receipt.product_identity <> v_job.product_identity
     or v_receipt.report_family <> v_job.report_family then
    raise exception 'REPORT_REVISION_PUBLICATION_LINEAGE_INVALID';
  end if;

  if v_target.revision_family_key is null then raise exception 'REPORT_REVISION_FAMILY_KEY_MISSING'; end if;

  perform 1 from public.reports r where r.revision_family_key = v_target.revision_family_key for update;
  select * into v_current
  from public.reports r
  where r.revision_family_key = v_target.revision_family_key
    and r.is_current_revision = true
    and public.report_revision_has_published_analysis_job(r.id)
  order by r.revision_number desc, r.created_at desc limit 1;

  if found and v_current.id = v_target.id then
    update public.reports set revision_published_at = coalesce(revision_published_at, now())
     where id = v_target.id;
    return query select true, false, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number;
    return;
  end if;

  if found and coalesce(v_current.revision_number,0) > coalesce(v_target.revision_number,0) then
    return query select false, true, v_target.id, null::uuid, v_target.revision_family_key, v_target.revision_number;
    return;
  end if;

  if found then
    update public.reports set is_current_revision = false where id = v_current.id;
    v_demoted := v_current.id;
  end if;

  update public.reports
     set is_current_revision = true,
         revision_published_at = coalesce(revision_published_at, now())
   where id = v_target.id;

  return query select true, false, v_target.id, v_demoted, v_target.revision_family_key, v_target.revision_number;
end;
$$;

revoke all on function public.promote_report_revision_to_current(uuid) from public, anon, authenticated;
grant execute on function public.promote_report_revision_to_current(uuid) to service_role;

commit;
