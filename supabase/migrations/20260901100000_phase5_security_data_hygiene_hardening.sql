begin;

-- Phase 5: remove direct browser access to raw pipeline state. Customer reads
-- are served through authenticated server boundaries and governed report APIs.
drop policy if exists analysis_jobs_select_own on public.analysis_jobs;
drop policy if exists ajf_select_own_job on public.analysis_job_files;
drop policy if exists analysis_job_files_select_own on public.analysis_job_files;
drop policy if exists rp_select_own on public.report_purchases;
drop policy if exists "Users can view their own reports" on public.reports;
drop policy if exists reports_select_own on public.reports;

revoke all on table public.analysis_jobs from public, anon, authenticated;
revoke all on table public.analysis_job_files from public, anon, authenticated;
revoke all on table public.analysis_artifacts from public, anon, authenticated;
revoke all on table public.report_purchases from public, anon, authenticated;
revoke all on table public.reports from public, anon, authenticated;

grant select, insert, update, delete on table public.analysis_jobs to service_role;
grant select, insert, update, delete on table public.analysis_job_files to service_role;
grant select, insert, update, delete on table public.analysis_artifacts to service_role;
grant select, insert, update, delete on table public.report_purchases to service_role;
grant select, insert, update, delete on table public.reports to service_role;

comment on table public.analysis_jobs is
  'Internal governed pipeline state. Direct anon/authenticated access is denied; customer status is served through authenticated server boundaries.';
comment on table public.analysis_job_files is
  'Internal registered-source state. Direct anon/authenticated access is denied.';
comment on table public.analysis_artifacts is
  'Internal pipeline evidence. Customer-safe subsets are projected by authenticated server boundaries.';
comment on table public.report_purchases is
  'Server-owned report entitlement ledger. Customer balances are projected by authenticated server boundaries.';
comment on table public.reports is
  'Internal report revision state. Customer publication is exposed only through the governed publication projection and server API.';

-- The admission RPC is the one intentional authenticated SECURITY DEFINER
-- entry point into the pipeline. It validates auth.uid(), purchase ownership,
-- staged object ownership and core-mode admission inside one governed routine.
revoke all on function public.consume_purchase_and_create_job(text, jsonb, jsonb) from public, anon;
grant execute on function public.consume_purchase_and_create_job(text, jsonb, jsonb) to authenticated, service_role;
comment on function public.consume_purchase_and_create_job(text, jsonb, jsonb) is
  'Intentional authenticated admission boundary. Phase 5 preserves this RPC while raw pipeline table access is denied.';

-- Trigger and internal helper functions must never be callable as public RPCs.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'analysis_jobs_promote_report_revision_trigger',
        'classify_worker_terminal_domain',
        'close_worker_recovery_episode_on_publication',
        'is_current_user_report_removed',
        'record_worker_stage_checkpoint',
        'report_revision_has_published_analysis_job',
        'reports_apply_revision_defaults'
      )
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.signature);
    execute format('grant execute on function %s to service_role', r.signature);
  end loop;
end;
$$;

-- Constant worker helpers had no explicit search_path and inherited PUBLIC
-- execute. Lock both even though they are not SECURITY DEFINER.
alter function public.worker_lease_duration() set search_path = pg_catalog, public;
alter function public.worker_max_attempt_count() set search_path = pg_catalog, public;
revoke all on function public.worker_lease_duration() from public, anon, authenticated;
revoke all on function public.worker_max_attempt_count() from public, anon, authenticated;
grant execute on function public.worker_lease_duration() to service_role;
grant execute on function public.worker_max_attempt_count() to service_role;

-- Launch-path foreign-key indexes identified by the Phase 5 live advisor pass.
create index if not exists analysis_job_admission_receipts_purchase_id_idx
  on public.analysis_job_admission_receipts (purchase_id);
create index if not exists analysis_job_events_job_id_idx
  on public.analysis_job_events (job_id);
create index if not exists analysis_jobs_admission_receipt_id_idx
  on public.analysis_jobs (admission_receipt_id);
create index if not exists analysis_jobs_recovery_episode_id_idx
  on public.analysis_jobs (recovery_episode_id);
create index if not exists property_files_property_id_idx
  on public.property_files (property_id);
create index if not exists property_files_user_id_idx
  on public.property_files (user_id);
create index if not exists report_issues_artifact_id_idx
  on public.report_issues (artifact_id);
create index if not exists report_publication_receipts_delivery_gate_artifact_id_idx
  on public.report_publication_receipts (delivery_gate_artifact_id);
create index if not exists report_publication_receipts_manifest_artifact_id_idx
  on public.report_publication_receipts (manifest_artifact_id);
create index if not exists report_purchases_job_id_idx
  on public.report_purchases (job_id);
create index if not exists worker_recovery_episodes_purchase_id_idx
  on public.worker_recovery_episodes (purchase_id);
create index if not exists worker_stage_checkpoints_recovery_episode_id_idx
  on public.worker_stage_checkpoints (recovery_episode_id);

-- Preserve the customer-facing profile/property/issue capabilities while
-- avoiding repeated per-row auth.uid() evaluation in RLS expressions.
drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile."
  on public.profiles for select to public
  using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile."
  on public.profiles for update to public
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Users can view their own properties." on public.properties;
create policy "Users can view their own properties."
  on public.properties for select to public
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own properties." on public.properties;
create policy "Users can insert their own properties."
  on public.properties for insert to public
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own properties." on public.properties;
create policy "Users can delete their own properties."
  on public.properties for delete to public
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own property files." on public.property_files;
create policy "Users can view their own property files."
  on public.property_files for select to public
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own property files." on public.property_files;
create policy "Users can insert their own property files."
  on public.property_files for insert to public
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own property files." on public.property_files;
create policy "Users can delete their own property files."
  on public.property_files for delete to public
  using ((select auth.uid()) = user_id);

drop policy if exists report_issues_insert_own on public.report_issues;
create policy report_issues_insert_own
  on public.report_issues for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists report_issues_select_own on public.report_issues;
create policy report_issues_select_own
  on public.report_issues for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists report_issues_update_own on public.report_issues;
create policy report_issues_update_own
  on public.report_issues for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Non-destructive Storage classification authority. This view is inventory
-- only: no classification authorizes deletion. Unknown and legacy objects are
-- preserved until an explicit reviewed cleanup decision exists.
drop view if exists public.storage_object_hygiene_inventory_v1;
create view public.storage_object_hygiene_inventory_v1
with (security_invoker = true)
as
select
  o.id as storage_object_id,
  o.bucket_id,
  o.name as object_path,
  o.created_at,
  o.updated_at,
  nullif(o.metadata->>'size', '')::bigint as size_bytes,
  o.metadata->>'mimetype' as mime_type,
  case
    when o.bucket_id = 'staged_uploads'
      and exists (
        select 1 from public.analysis_job_files f
        where f.bucket = 'staged_uploads' and f.object_path = o.name
      )
      then 'registered_source'
    when o.bucket_id = 'staged_uploads'
      and o.created_at >= now() - interval '7 days'
      then 'recent_unregistered_preserve'
    when o.bucket_id = 'staged_uploads'
      then 'staged_cleanup_candidate_review'
    when o.bucket_id = 'generated_reports'
      and exists (
        select 1 from public.report_publication_receipts pr
        where pr.storage_object_id = o.id or pr.storage_path = o.name
      )
      then 'governed_report_artifact'
    when o.bucket_id = 'generated_reports'
      and exists (select 1 from public.reports r where r.storage_path = o.name)
      then 'legacy_report_referenced'
    when o.bucket_id = 'generated_reports' and o.name like 'analysis_jobs/%'
      then 'pipeline_internal_artifact'
    when o.bucket_id = 'generated_reports'
      and lower(coalesce(o.metadata->>'mimetype', '')) = 'application/pdf'
      then 'legacy_pdf_candidate_review'
    else 'unknown_preserve'
  end as classification,
  case
    when o.bucket_id = 'staged_uploads'
      and exists (
        select 1 from public.analysis_job_files f
        where f.bucket = 'staged_uploads' and f.object_path = o.name
      ) then 'preserve'
    when o.bucket_id = 'generated_reports'
      and (
        exists (select 1 from public.report_publication_receipts pr where pr.storage_object_id = o.id or pr.storage_path = o.name)
        or exists (select 1 from public.reports r where r.storage_path = o.name)
        or o.name like 'analysis_jobs/%'
      ) then 'preserve'
    else 'review_required'
  end as cleanup_disposition,
  false as deletion_authorized
from storage.objects o
where o.bucket_id in ('staged_uploads', 'generated_reports');

revoke all on table public.storage_object_hygiene_inventory_v1 from public, anon, authenticated;
grant select on table public.storage_object_hygiene_inventory_v1 to service_role;
comment on view public.storage_object_hygiene_inventory_v1 is
  'Phase 5 non-destructive Storage inventory. deletion_authorized is always false; unreferenced does not mean safe to delete.';

-- Preserve the Phase 2 legacy-report doctrine: retain old report rows and
-- objects, exclude them from governed customer publication, and do not
-- silently backfill or delete them in Phase 5.

commit;
