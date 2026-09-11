begin;

-- InvestorIQ launch E2E production contract reconciliation.
-- Generated from already-certified Phase 1 through Phase 4 authorities.
-- This migration intentionally DOES NOT recreate the Phase 1 legacy admission primitive.
-- The strict September 8 consume_purchase_and_create_job_untrusted_legacy authority remains intact.
-- Phase 5 browser-read lockdown remains intentionally deferred because the current Dashboard
-- still reads customer-owned pipeline state directly under existing RLS policies.
-- Scheduler authority is restored in disabled state only. Activation is a separate owner action.

-- Restore only the corrected governed outer admission wrapper from Phase 1.
create or replace function public.consume_purchase_and_create_job(
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
  v_has_core_file boolean;
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

  select count(*),
         bool_or(lower(coalesce(f.doc_type, '')) in ('rent_roll', 't12', 't12_or_operating_statement'))
    into v_file_count, v_has_core_file
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
    and (o.metadata->>'size')::bigint = f.bytes
    and lower(coalesce(o.metadata->>'mimetype', '')) = lower(coalesce(f.mime_type, ''));

  if v_file_count < 1 or coalesce(v_has_core_file, false) is false or v_object_count <> v_file_count then
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
    ) order by f.uploaded_at, f.id
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

-- Restore atomic publication and customer publication projection from Phase 2.
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

-- Restore current bounded worker recovery contracts and scheduler authority from Phase 3.
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

-- Restore atomic Stripe entitlement grant and receipt authority from Phase 4.
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
