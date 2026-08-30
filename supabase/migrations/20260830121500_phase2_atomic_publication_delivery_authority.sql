begin;

-- InvestorIQ Phase 2 publication authority.
-- Publication is one atomic database event: final manifest + receipt + published job + current revision.
-- The reports table is metadata and revision lineage only; it has no publication status authority.

create table if not exists public.customer_report_removals (
  report_id uuid primary key references public.reports(id) on delete cascade,
  user_id uuid not null,
  removed_by_actor_id uuid not null,
  removed_by_role text not null check (removed_by_role in ('customer','admin')),
  removed_at timestamptz not null default now()
);

alter table public.customer_report_removals enable row level security;
revoke all on table public.customer_report_removals from public, anon, authenticated;
grant select, insert, update on table public.customer_report_removals to service_role;

-- Historical trigger ownership is removed. The atomic finalizer below is the only authority
-- allowed to establish a newly published current revision.
drop trigger if exists analysis_jobs_promote_report_revision_trigger on public.analysis_jobs;

create or replace function public.finalize_worker_publication_v2(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_claimed_by text,
  p_manifest_payload jsonb,
  p_manifest_object_path text
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_now timestamptz := now();
  v_claimed_by text := nullif(btrim(coalesce(p_claimed_by, '')), '');
  v_manifest_path text := nullif(btrim(coalesce(p_manifest_object_path, '')), '');
  v_job public.analysis_jobs%rowtype;
  v_report public.reports%rowtype;
  v_manifest public.analysis_artifacts%rowtype;
  v_delivery public.analysis_artifacts%rowtype;
  v_decision jsonb;
  v_storage storage.objects%rowtype;
  v_receipt public.report_publication_receipts%rowtype;
  v_current public.reports%rowtype;
  v_action text;
  v_current_count integer := 0;
begin
  if p_job_id is null or p_worker_attempt_id is null or v_claimed_by is null then
    raise exception 'PUBLICATION_WORKER_AUTHORITY_REQUIRED';
  end if;

  select * into v_job
  from public.analysis_jobs
  where id = p_job_id
  for update;
  if not found then raise exception 'PUBLICATION_JOB_NOT_FOUND'; end if;

  -- Idempotent replay after an ambiguous client/network response. A committed publication
  -- may be returned only when every governed lineage invariant is still complete.
  if v_job.status = 'published' then
    if v_job.report_id is null then raise exception 'PUBLICATION_PUBLISHED_REPORT_LINK_MISSING'; end if;
    select * into v_report from public.reports where id = v_job.report_id for update;
    select * into v_receipt
      from public.report_publication_receipts
      where job_id = v_job.id and report_id = v_job.report_id and publication_status = 'complete'
      for update;
    if not found
       or v_report.id is null
       or v_report.user_id is distinct from v_job.user_id
       or v_report.is_current_revision is not true
       or v_report.revision_source_job_id is distinct from v_job.id
       or v_receipt.user_id is distinct from v_job.user_id
       or v_receipt.revision_request_key is distinct from v_report.revision_request_key
       or v_receipt.storage_path is distinct from v_report.storage_path then
      raise exception 'PUBLICATION_PUBLISHED_LINEAGE_INCOMPLETE';
    end if;
    perform 1 from storage.objects o
      where o.bucket_id = 'generated_reports'
        and o.id = v_receipt.storage_object_id
        and o.name = v_report.storage_path;
    if not found then raise exception 'PUBLICATION_PUBLISHED_OBJECT_MISSING'; end if;
    return query select j.* from public.analysis_jobs j where j.id = v_job.id;
    return;
  end if;

  if p_expected_current_status <> 'publishing' or v_job.status <> p_expected_current_status then
    raise exception 'PUBLICATION_EXPECTED_PUBLISHING_STATE_REQUIRED';
  end if;
  if v_job.worker_attempt_id is distinct from p_worker_attempt_id
     or v_job.worker_claimed_by is distinct from v_claimed_by
     or v_job.worker_lease_expires_at is null
     or v_job.worker_lease_expires_at <= v_now then
    raise exception 'PUBLICATION_WORKER_LEASE_INVALID';
  end if;
  if v_job.admission_receipt_id is null
     or v_job.product_identity not in ('screening','full_underwriting')
     or v_job.report_family <> v_job.product_identity then
    raise exception 'PUBLICATION_GOVERNED_ADMISSION_REQUIRED';
  end if;
  if v_job.report_id is null then raise exception 'PUBLICATION_REPORT_LINK_REQUIRED'; end if;

  select * into v_report
  from public.reports
  where id = v_job.report_id
  for update;
  if not found then raise exception 'PUBLICATION_REPORT_NOT_FOUND'; end if;
  if v_report.user_id is distinct from v_job.user_id then raise exception 'PUBLICATION_OWNER_LINEAGE_MISMATCH'; end if;
  if v_report.revision_request_key is null then raise exception 'PUBLICATION_REVISION_REQUEST_KEY_REQUIRED'; end if;
  if v_report.revision_family_key is null then raise exception 'PUBLICATION_REVISION_FAMILY_KEY_REQUIRED'; end if;
  if v_report.revision_source_job_id is distinct from v_job.id then
    raise exception 'PUBLICATION_REVISION_SOURCE_JOB_MISMATCH';
  end if;
  if v_report.is_current_revision is true then
    raise exception 'PUBLICATION_PREMATURE_CURRENT_REVISION';
  end if;
  if (v_job.product_identity = 'screening' and v_report.report_type <> 'screening')
     or (v_job.product_identity = 'full_underwriting' and v_report.report_type <> 'underwriting') then
    raise exception 'PUBLICATION_PRODUCT_REPORT_MISMATCH';
  end if;

  -- Serialize all publication/promotion work for this revision family.
  perform 1 from public.reports r
  where r.revision_family_key = v_report.revision_family_key
  for update;

  select * into v_current
  from public.reports r
  where r.revision_family_key = v_report.revision_family_key
    and r.is_current_revision = true
  order by r.revision_number desc, r.created_at desc
  limit 1;

  if found and v_current.id <> v_report.id
     and coalesce(v_current.revision_number, 0) >= coalesce(v_report.revision_number, 0) then
    raise exception 'PUBLICATION_STALE_REVISION';
  end if;

  select * into v_storage
  from storage.objects o
  where o.bucket_id = 'generated_reports'
    and o.name = v_report.storage_path
  limit 1;
  if not found then raise exception 'PUBLICATION_GENERATED_OBJECT_MISSING'; end if;

  select * into v_delivery
  from public.analysis_artifacts a
  where a.job_id = v_job.id
    and a.user_id = v_job.user_id
    and a.type = 'delivery_gate_decision'
  order by a.created_at desc
  limit 1;
  if not found then raise exception 'PUBLICATION_CANONICAL_DELIVERY_DECISION_REQUIRED'; end if;

  v_decision := coalesce(v_delivery.payload->'deliveryDecisionState', v_delivery.payload);
  if coalesce(v_decision->>'source','') <> 'canonical_delivery_decision' then
    raise exception 'PUBLICATION_DELIVERY_DECISION_NOT_CANONICAL';
  end if;
  if coalesce((v_decision->>'customer_delivery_allowed')::boolean, false) is not true
     or coalesce((v_decision->>'hold_delivery')::boolean, false) is true
     or coalesce(v_decision->>'delivery_gate_status','') <> 'deliverable' then
    raise exception 'PUBLICATION_DELIVERY_NOT_ALLOWED';
  end if;
  if coalesce((v_decision->>'core_valid_required_coverage')::boolean, false) is not true then
    raise exception 'PUBLICATION_CORE_COVERAGE_NOT_VALID';
  end if;

  if p_manifest_payload is null or jsonb_typeof(p_manifest_payload) <> 'object' then
    raise exception 'PUBLICATION_FINAL_MANIFEST_REQUIRED';
  end if;
  if v_manifest_path is null then raise exception 'PUBLICATION_FINAL_MANIFEST_PATH_REQUIRED'; end if;
  if coalesce(p_manifest_payload #>> '{publication,state}', '') <> 'published' then
    raise exception 'PUBLICATION_FINAL_MANIFEST_STATE_INVALID';
  end if;
  if coalesce(p_manifest_payload #>> '{publication,storagePath}', '') <> v_report.storage_path then
    raise exception 'PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH';
  end if;

  insert into public.analysis_artifacts(
    job_id, user_id, type, bucket, object_path, payload
  ) values (
    v_job.id, v_job.user_id, 'report_quality_manifest', 'internal', v_manifest_path, p_manifest_payload
  ) returning * into v_manifest;

  v_action := upper(coalesce(v_decision->>'canonical_delivery_action',''));
  if v_action not in ('DELIVER','DELIVER_WITH_QUALITY_INCIDENT') then
    v_action := case
      when coalesce(p_manifest_payload #>> '{qualityState,confidence}', '') = 'verified_publication_with_quality_incident'
        then 'DELIVER_WITH_QUALITY_INCIDENT'
      else 'DELIVER'
    end;
  end if;

  select * into v_receipt
  from public.report_publication_receipts r
  where r.job_id = v_job.id
  for update;

  if found then
    if v_receipt.report_id <> v_report.id
       or v_receipt.revision_request_key <> v_report.revision_request_key
       or v_receipt.storage_path <> v_report.storage_path
       or v_receipt.storage_object_id <> v_storage.id
       or v_receipt.delivery_gate_artifact_id <> v_delivery.id then
      raise exception 'PUBLICATION_RECEIPT_IDEMPOTENCY_CONFLICT';
    end if;
    -- A receipt cannot legitimately pre-exist a not-yet-published v2 transaction.
    raise exception 'PUBLICATION_PREEXISTING_RECEIPT_CONFLICT';
  end if;

  insert into public.report_publication_receipts(
    job_id, report_id, user_id, product_identity, report_family,
    revision_request_key, storage_path, storage_object_id, storage_metadata,
    manifest_artifact_id, delivery_gate_artifact_id, canonical_delivery_action,
    publication_status, completed_at
  ) values (
    v_job.id, v_report.id, v_job.user_id, v_job.product_identity, v_job.report_family,
    v_report.revision_request_key, v_report.storage_path, v_storage.id, coalesce(v_storage.metadata,'{}'::jsonb),
    v_manifest.id, v_delivery.id, v_action, 'complete', v_now
  ) returning * into v_receipt;

  update public.analysis_jobs j
     set status = 'published',
         worker_lease_expires_at = null,
         worker_last_heartbeat_at = v_now,
         terminal_domain = null,
         last_checkpoint = 'published',
         last_checkpoint_at = v_now
   where j.id = v_job.id
     and j.status = 'publishing'
     and j.worker_attempt_id = p_worker_attempt_id
     and j.worker_claimed_by = v_claimed_by;
  if not found then raise exception 'PUBLICATION_JOB_COMMIT_RACE'; end if;

  if v_current.id is not null and v_current.id <> v_report.id then
    update public.reports
       set is_current_revision = false
     where id = v_current.id;
  end if;

  update public.reports
     set is_current_revision = true,
         revision_published_at = coalesce(revision_published_at, v_now)
   where id = v_report.id;
  if not found then raise exception 'PUBLICATION_REVISION_PROMOTION_FAILED'; end if;

  select count(*) into v_current_count
  from public.reports r
  where r.revision_family_key = v_report.revision_family_key
    and r.is_current_revision = true;
  if v_current_count <> 1 then raise exception 'PUBLICATION_CURRENT_REVISION_INVARIANT_FAILED'; end if;

  return query select j.* from public.analysis_jobs j where j.id = v_job.id;
end;
$$;

revoke all on function public.finalize_worker_publication_v2(uuid,uuid,text,text,jsonb,text) from public, anon, authenticated;
grant execute on function public.finalize_worker_publication_v2(uuid,uuid,text,text,jsonb,text) to service_role;

-- Disable the old publication primitive. This prevents any caller from reintroducing
-- split publication state or relying on a reports.status field that does not exist.
create or replace function public.finalize_worker_publication(
  p_job_id uuid,
  p_worker_attempt_id uuid,
  p_expected_current_status text,
  p_claimed_by text
)
returns setof public.analysis_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'PUBLICATION_ATOMIC_V2_REQUIRED';
end;
$$;
revoke all on function public.finalize_worker_publication(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.finalize_worker_publication(uuid,uuid,text,text) to service_role;

-- Re-issue the worker transition primitive. Published is no longer a generic transition.
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
    raise exception 'PUBLICATION_ATOMIC_V2_REQUIRED';
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
revoke all on function public.transition_worker_job(uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.transition_worker_job(uuid,uuid,text,text,text) to service_role;

-- Service-owned customer projection. A row exists only when publication, revision and
-- physical object lineage are all complete. Legacy/unpublished rows cannot enter this view.
create or replace view public.customer_published_report_projection
with (security_invoker = true)
as
select
  r.id,
  r.user_id,
  r.property_name,
  r.report_type,
  r.created_at,
  r.storage_path,
  r.revision_kind,
  r.revision_number,
  r.revision_family_key,
  r.revision_root_report_id,
  r.revision_parent_report_id,
  r.revision_request_key,
  r.revision_source_job_id,
  r.is_current_revision,
  r.revision_published_at,
  'published'::text as publication_state,
  pr.id as publication_receipt_id,
  pr.completed_at as publication_completed_at,
  pr.canonical_delivery_action,
  pr.product_identity,
  pr.report_family,
  pr.storage_object_id,
  j.id as publication_job_id
from public.reports r
join public.report_publication_receipts pr
  on pr.report_id = r.id
 and pr.user_id = r.user_id
 and pr.revision_request_key = r.revision_request_key
 and pr.storage_path = r.storage_path
 and pr.publication_status = 'complete'
join public.analysis_jobs j
  on j.id = pr.job_id
 and j.id = r.revision_source_job_id
 and j.report_id = r.id
 and j.user_id = r.user_id
 and j.status = 'published'
 and j.product_identity = pr.product_identity
 and j.report_family = pr.report_family
join storage.objects o
  on o.id = pr.storage_object_id
 and o.bucket_id = 'generated_reports'
 and o.name = r.storage_path
left join public.customer_report_removals crm on crm.report_id = r.id
where r.is_current_revision = true
  and crm.report_id is null;

revoke all on table public.customer_published_report_projection from public, anon, authenticated;
grant select on table public.customer_published_report_projection to service_role;

-- Service-only administrative projection preserves legacy/unpublished visibility without
-- inventing a reports.status column.
create or replace view public.admin_report_projection
with (security_invoker = true)
as
select
  r.id,
  r.user_id,
  r.property_name,
  r.storage_path,
  r.created_at,
  r.report_type,
  r.revision_kind,
  r.revision_number,
  r.revision_family_key,
  r.revision_root_report_id,
  r.revision_parent_report_id,
  r.revision_request_key,
  r.revision_source_job_id,
  r.is_current_revision,
  r.revision_published_at,
  pr.id as publication_receipt_id,
  pr.completed_at as publication_completed_at,
  j.id as publication_job_id,
  case
    when pr.publication_status = 'complete'
      and j.status = 'published'
      and j.report_id = r.id
      and j.user_id = r.user_id
      and pr.user_id = r.user_id
      and pr.revision_request_key = r.revision_request_key
      and pr.storage_path = r.storage_path
      and o.id is not null
      and r.is_current_revision = true then 'published'
    when pr.publication_status = 'complete'
      and j.status = 'published'
      and o.id is not null then 'historical_published'
    when pr.id is not null then 'publication_incomplete'
    when r.revision_source_job_id is null then 'legacy_archive_only'
    else 'unpublished'
  end::text as publication_state,
  (crm.report_id is not null) as customer_removed
from public.reports r
left join public.report_publication_receipts pr on pr.report_id = r.id
left join public.analysis_jobs j on j.id = pr.job_id
left join storage.objects o
  on o.id = pr.storage_object_id
 and o.bucket_id = 'generated_reports'
 and o.name = r.storage_path
left join public.customer_report_removals crm on crm.report_id = r.id;

revoke all on table public.admin_report_projection from public, anon, authenticated;
grant select on table public.admin_report_projection to service_role;

-- Remove direct authenticated generated-report policies while preserving unrelated
-- Storage policies, then add restrictive bucket guards. Signed downloads are created only
-- by the service-role customer endpoint after publication lineage is proven.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd in ('SELECT','INSERT','UPDATE','DELETE','ALL')
      and roles::text ilike '%authenticated%'
      and (
        coalesce(qual, '') ilike '%generated_reports%' or
        coalesce(with_check, '') ilike '%generated_reports%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', v_policy.policyname);
  end loop;
end $$;

drop policy if exists generated_reports_authenticated_select_denied on storage.objects;
create policy generated_reports_authenticated_select_denied
on storage.objects as restrictive
for select to authenticated
using (bucket_id <> 'generated_reports');

drop policy if exists generated_reports_authenticated_insert_denied on storage.objects;
create policy generated_reports_authenticated_insert_denied
on storage.objects as restrictive
for insert to authenticated
with check (bucket_id <> 'generated_reports');

drop policy if exists generated_reports_authenticated_update_denied on storage.objects;
create policy generated_reports_authenticated_update_denied
on storage.objects as restrictive
for update to authenticated
using (bucket_id <> 'generated_reports')
with check (bucket_id <> 'generated_reports');

drop policy if exists generated_reports_authenticated_delete_denied on storage.objects;
create policy generated_reports_authenticated_delete_denied
on storage.objects as restrictive
for delete to authenticated
using (bucket_id <> 'generated_reports');

-- Legacy policy: reports without governed publication lineage are retained, not deleted or
-- auto-backfilled, and are excluded from the customer projection. Their state remains visible
-- to service/admin operations as legacy_archive_only or unpublished.

commit;
