import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isCurrentPublishedReportRevision,
  selectCustomerVisiblePublishedReportRevisions,
} from '../../src/lib/reportRevisionAuthority.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const migration = read('supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql');
assert.match(migration, /finalize_worker_publication_v2/i);
assert.match(migration, /insert into public\.analysis_artifacts[\s\S]*report_quality_manifest/i);
assert.match(migration, /insert into public\.report_publication_receipts/i);
assert.match(migration, /set status = 'published'/i);
assert.match(migration, /set is_current_revision = true/i);
assert.match(migration, /PUBLICATION_CURRENT_REVISION_INVARIANT_FAILED/i);
assert.match(migration, /drop trigger if exists analysis_jobs_promote_report_revision_trigger/i);
assert.match(migration, /PUBLICATION_ATOMIC_V2_REQUIRED/i);
assert.match(migration, /customer_published_report_projection/i);
assert.match(migration, /join storage\.objects/i);
assert.match(migration, /publication_status = 'complete'/i);
assert.match(migration, /j\.status = 'published'/i);
assert.match(migration, /r\.is_current_revision = true/i);
assert.match(migration, /legacy_archive_only/i);
assert.match(migration, /#>> '\{publication,state\}'/i);
assert.match(migration, /PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH/i);
assert.match(migration, /generated_reports_authenticated_select_denied/i);
assert.match(migration, /generated_reports_authenticated_insert_denied/i);
assert.match(migration, /generated_reports_authenticated_update_denied/i);
assert.match(migration, /generated_reports_authenticated_delete_denied/i);
assert.match(migration, /as restrictive[\s\S]*for select to authenticated[\s\S]*bucket_id <> 'generated_reports'/i);
assert.doesNotMatch(migration, /v_report\.status/i);

const manifestInsert = migration.indexOf('insert into public.analysis_artifacts');
const receiptInsert = migration.indexOf('insert into public.report_publication_receipts');
const publishedUpdate = migration.indexOf("set status = 'published'");
const currentPromotion = migration.indexOf('set is_current_revision = true');
assert.ok(manifestInsert >= 0 && receiptInsert > manifestInsert, 'Final manifest must precede receipt inside the same transaction.');
assert.ok(publishedUpdate > receiptInsert, 'Receipt must be established before the job is committed published.');
assert.ok(currentPromotion > publishedUpdate, 'Current revision must be established in the same finalizer transaction after publication lineage exists.');

const customerReportsApi = read('api/customer-reports.js');
assert.match(customerReportsApi, /customer_published_report_projection/);
assert.doesNotMatch(customerReportsApi, /\.from\(['"]reports['"]\)/);

const downloadApi = read('api/customer-report-download.js');
assert.match(downloadApi, /customer_published_report_projection/);
assert.match(downloadApi, /generated_reports/);
assert.match(downloadApi, /createSignedUrl/);
assert.doesNotMatch(downloadApi, /\.from\(['"]reports['"]\)/);
assert.doesNotMatch(downloadApi, /reports\.status|\.eq\(['"]status['"],\s*['"]published['"]\)/);

const adminApi = read('api/admin/report-projection.js');
assert.match(adminApi, /admin_report_projection/);
assert.match(adminApi, /report_type/);
assert.doesNotMatch(adminApi, /\.from\(['"]reports['"]\)/);

const current = {
  id: 'current',
  publication_state: 'published',
  is_current_revision: true,
  revision_number: 2,
  storage_path: 'user/current.pdf',
};
const historical = {
  id: 'historical',
  publication_state: 'historical_published',
  is_current_revision: false,
  revision_number: 1,
  storage_path: 'user/historical.pdf',
};
const legacy = {
  id: 'legacy',
  publication_state: 'legacy_archive_only',
  is_current_revision: false,
  revision_number: 1,
  storage_path: 'user/legacy.pdf',
};
assert.equal(isCurrentPublishedReportRevision(current), true);
assert.equal(isCurrentPublishedReportRevision({ ...current, publication_state: 'unpublished' }), false);
assert.equal(isCurrentPublishedReportRevision(historical), false);
assert.deepEqual(selectCustomerVisiblePublishedReportRevisions([historical, legacy, current]).map((row) => row.id), ['current']);

const dashboard = read('src/pages/Dashboard.jsx');
assert.match(dashboard, /\/api\/customer-reports/);
assert.doesNotMatch(dashboard, /storage_path, status, revision_kind/);
assert.doesNotMatch(dashboard, /report\.status/);

const adminDashboard = read('src/pages/AdminDashboard.jsx');
assert.match(adminDashboard, /\/api\/admin\/report-projection/);
assert.doesNotMatch(adminDashboard, /report_type, status, revision_kind/);

const surfaceState = read('src/lib/reportSurfaceState.js');
assert.doesNotMatch(surfaceState, /report\?\.status/);
assert.match(surfaceState, /report\?\.publication_state/);

const revisionAuthority = read('src/lib/reportRevisionAuthority.js');
assert.match(revisionAuthority, /publication_state/);
assert.match(revisionAuthority, /historical_published/);

const boundary = read('src/lib/customerBoundarySupabase.js');
assert.match(boundary, /CustomerReportQueryBuilder/);
assert.match(boundary, /\/api\/customer-reports/);

const worker = read('api/admin-run-worker.js');
assert.match(worker, /finalize_worker_publication_v2/);
assert.match(worker, /customer_published_report_projection/);
assert.doesNotMatch(worker, /promoteReportRevisionToCurrent/);
assert.doesNotMatch(worker, /transitionWorkerJob\(job, 'publishing', 'published'/);

const deliveryOutput = read('api/_lib/report-delivery-output.js');
assert.match(deliveryOutput, /storageBucket\.remove\(\[normalizedStoragePath\]\)/);
assert.match(deliveryOutput, /retainedToPreserveObjectReference/);

console.log('phase2-atomic-publication-delivery-contract-smoke: PASS');
