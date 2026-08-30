import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveStructuredFinancialWorkerGateDecision,
} from '../../api/admin-run-worker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const worker = read('api/admin-run-worker.js');
const rendererHandler = read('api/_lib/generate-client-report-handler.js');
const renderer = read('api/_lib/generate-client-report-impl.js');
const deliveryOutput = read('api/_lib/report-delivery-output.js');
const migration = read('supabase/migrations/20260830183000_phase3_worker_runtime_recovery_authority.sql');
const restorationMigration = read('supabase/migrations/20260818130000_p0_d_recovery_observability_legacy_quarantine.sql');
const queueMetrics = read('api/admin/queue-metrics.js');
const vercel = JSON.parse(read('vercel.json'));
const workflow = read('.github/workflows/worker-kick.yml');

assert.equal(vercel.functions['api/admin-run-worker.js'].maxDuration, 300);
assert.equal('crons' in vercel, false);
assert.match(workflow, /workflow_dispatch/);
assert.doesNotMatch(workflow, /schedule:/);

assert.match(worker, /WORKER_RUNTIME_BUDGET_SECONDS = 270/);
assert.match(worker, /WORKER_RENDER_TIMEOUT_MS = 210_000/);
assert.match(worker, /WORKER_FETCH_TIMEOUT_MS = 50_000/);
assert.match(worker, /WORKER_LEASE_HEARTBEAT_MS = 45_000/);
assert.match(worker, /WORKER_MIN_RENDER_WINDOW_SECONDS = 225/);
assert.match(worker, /reason: 'insufficient_render_window'/);
assert.match(worker, /runWithWorkerLeaseHeartbeat/);
assert.match(worker, /await renewWorkerLeaseForJob\(job\)/);
assert.match(worker, /runCanonicalReportRenderer/);
assert.match(worker, /internal:canonical-report-renderer/);
assert.match(worker, /rpc\('claim_worker_job'/);
assert.doesNotMatch(worker, /rpc\('claim_next_worker_job'/);
assert.doesNotMatch(worker, /\/api\/generate-client-report/);
assert.doesNotMatch(worker, /consumeCreditOnce|credit_consumed|report_credits/);
assert.doesNotMatch(worker, /\.from\('reports'\)[\s\S]{0,500}property_name/);
assert.match(worker, /resolveOrCreateReportPublicationRecord/);
assert.match(worker, /ensureReportDownloadArtifact/);
assert.match(worker, /finalize_worker_publication_v2/);
assert.doesNotMatch(worker, /transitionWorkerJob\(job, 'publishing', 'published'/);

assert.match(rendererHandler, /runCanonicalReportRenderer/);
assert.match(renderer, /renderer_ownership: "worker_artifact_authority"/);
assert.match(renderer, /reportFamily: "screening"/);
assert.match(renderer, /reportFamily: "full_underwriting"/);
assert.match(renderer, /final_html: immutableScreeningOutput\.html/);
assert.match(renderer, /final_html: docHtml/);
assert.doesNotMatch(renderer, /requestDocRaptorPdf/);
assert.doesNotMatch(renderer, /generated_reports/);
assert.doesNotMatch(renderer, /\.from\(["']reports["']\)/);
assert.doesNotMatch(renderer, /\.from\(["']analysis_jobs["']\)[\s\S]{0,100}\.update/);

assert.match(deliveryOutput, /requestDocRaptorPdf/);
assert.match(deliveryOutput, /resolveOrCreateReportPublicationRecord/);
assert.match(deliveryOutput, /ensureReportDownloadArtifact/);
assert.match(deliveryOutput, /storageBucket\.upload/);

assert.match(migration, /worker_scheduler_authority/);
assert.match(migration, /authority = 'supabase_cron_pg_net'/);
assert.match(migration, /enabled = false/);
assert.match(migration, /worker_effective_attempt_limit/);
assert.match(migration, /worker_max_attempt_count\(\) \+ 3/);
assert.match(migration, /enforce_worker_recovery_lifetime_budget/);
assert.match(migration, /RECOVERY_LIFETIME_BUDGET_EXHAUSTED/);
assert.match(migration, /set status = 'dead_letter'/);
assert.match(migration, /restore_job_entitlement_on_exhaustion/);
assert.match(migration, /grant execute on function public\.requeue_worker_job[^;]+to service_role/i);
assert.match(restorationMigration, /report_publication_receipts[\s\S]*publication_status = 'complete'/);
assert.match(restorationMigration, /set consumed_at = null, job_id = null/);
assert.match(restorationMigration, /event_type[\s\S]*entitlement_restored/);

assert.match(queueMetrics, /analysis_job_files'[\s\S]{0,220}uploaded_at/);
assert.doesNotMatch(queueMetrics, /analysis_job_files'[\s\S]{0,220}parse_error, created_at/);

for (const parsedState of [
  { hasRentRollParsed: true, hasT12Parsed: false, expected: 'rent_roll_minimum_core' },
  { hasRentRollParsed: false, hasT12Parsed: true, expected: 't12_minimum_core' },
  { hasRentRollParsed: true, hasT12Parsed: true, expected: 'dual_source_core' },
]) {
  const decision = resolveStructuredFinancialWorkerGateDecision({
    ...parsedState,
    stage: 'rendering',
  });
  assert.equal(decision.action, 'continue');
  assert.equal(decision.sourceMode, parsedState.expected);
}

const noCoreDecision = resolveStructuredFinancialWorkerGateDecision({
  hasRentRollParsed: false,
  hasT12Parsed: false,
  stage: 'rendering',
});
assert.notEqual(noCoreDecision.action, 'continue');

console.log('phase3-worker-render-recovery-contract-smoke: PASS');
