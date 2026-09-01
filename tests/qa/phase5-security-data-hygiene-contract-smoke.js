import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve('.');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const wrapper = read('src/lib/customerBoundarySupabase.js');
const handler = read('api/_lib/customer-boundary-handler.js');
const migration = read('supabase/migrations/20260901100000_phase5_security_data_hygiene_hardening.sql');
const phase2 = read('supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql');
const vercel = read('vercel.json');

// Browser access to raw pipeline state must be intercepted, never passed through.
assert.match(wrapper, /tableName === 'analysis_jobs'/);
assert.match(wrapper, /tableName === 'report_purchases'/);
assert.match(wrapper, /surface=jobs/);
assert.match(wrapper, /surface=entitlements/);
assert.match(wrapper, /surface=admin_entitlements/);

// Customer server projections expose only deliberately safe job/entitlement fields.
assert.match(handler, /surface === 'jobs'/);
assert.match(handler, /surface === 'entitlements'/);
assert.match(handler, /surface === 'admin_entitlements'/);
assert.match(handler, /select\('id, property_name, report_type, status, created_at, error_code'\)/);
assert.doesNotMatch(handler, /select\('[^']*failure_reason[^']*'\)/);
assert.doesNotMatch(handler, /select\('[^']*error_message[^']*'\)/);
assert.match(handler, /error_code: safeCustomerFailureCode\(row\.error_code\)/);
assert.match(handler, /failure_reason: null/);
assert.match(handler, /error_message: null/);
assert.match(handler, /select\('product_type'\)/);

// Raw pipeline tables become service-role only in the forward migration.
for (const table of ['analysis_jobs', 'analysis_job_files', 'analysis_artifacts', 'report_purchases', 'reports']) {
  assert.ok(
    migration.includes(`revoke all on table public.${table} from public, anon, authenticated;`),
    `${table} must revoke direct browser privileges`,
  );
  assert.ok(
    migration.includes(`grant select, insert, update, delete on table public.${table} to service_role;`),
    `${table} must preserve service-role operation`,
  );
}

// Admission is the intentional authenticated SECURITY DEFINER exception.
assert.match(
  migration,
  /grant execute on function public\.consume_purchase_and_create_job\(text, jsonb, jsonb\) to authenticated, service_role;/,
);
assert.match(migration, /Intentional authenticated admission boundary/);

// Internal trigger/helper functions cannot remain public/auth RPCs.
for (const fn of [
  'analysis_jobs_promote_report_revision_trigger',
  'classify_worker_terminal_domain',
  'close_worker_recovery_episode_on_publication',
  'is_current_user_report_removed',
  'record_worker_stage_checkpoint',
  'report_revision_has_published_analysis_job',
  'reports_apply_revision_defaults',
]) {
  assert.ok(migration.includes(`'${fn}'`), `${fn} must be in the revoke set`);
}
assert.match(migration, /revoke all on function %s from public, anon, authenticated/);
assert.match(migration, /grant execute on function %s to service_role/);

// Mutable helper search paths and launch-path foreign keys are hardened.
assert.match(migration, /alter function public\.worker_lease_duration\(\) set search_path = pg_catalog, public;/);
assert.match(migration, /alter function public\.worker_max_attempt_count\(\) set search_path = pg_catalog, public;/);
for (const indexName of [
  'analysis_job_admission_receipts_purchase_id_idx',
  'analysis_job_events_job_id_idx',
  'analysis_jobs_admission_receipt_id_idx',
  'analysis_jobs_recovery_episode_id_idx',
  'property_files_property_id_idx',
  'property_files_user_id_idx',
  'report_issues_artifact_id_idx',
  'report_publication_receipts_delivery_gate_artifact_id_idx',
  'report_publication_receipts_manifest_artifact_id_idx',
  'report_purchases_job_id_idx',
  'worker_recovery_episodes_purchase_id_idx',
  'worker_stage_checkpoints_recovery_episode_id_idx',
]) {
  assert.ok(migration.includes(indexName), `${indexName} is required by Phase 5`);
}

// RLS auth evaluation is hoisted without weakening the existing ownership checks.
assert.match(migration, /\(select auth\.uid\(\)\) = id/);
assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);

// Storage work is classification-only. Unreferenced never means delete.
assert.match(migration, /storage_object_hygiene_inventory_v1/);
assert.match(migration, /pipeline_internal_artifact/);
assert.match(migration, /legacy_pdf_candidate_review/);
assert.match(migration, /unknown_preserve/);
assert.match(migration, /false as deletion_authorized/);
assert.doesNotMatch(migration, /delete\s+from\s+storage\.objects/i);
assert.doesNotMatch(migration, /storage\.emptyBucket|remove\s*\(/i);

// Phase 2 legacy report quarantine remains the authority; Phase 5 does not backfill/delete it.
assert.match(phase2, /legacy_archive_only/);
assert.match(phase2, /Legacy policy: reports without governed publication lineage are retained/i);
assert.match(phase2, /not deleted or\s*\n-- auto-backfilled/i);

// Phase 5 adds no new deployable API function; it reuses the existing job-status route.
assert.match(vercel, /customer-job-status/);
assert.doesNotMatch(vercel, /customer-entitlements/);

console.log('phase5-security-data-hygiene-contract-smoke: PASS');
