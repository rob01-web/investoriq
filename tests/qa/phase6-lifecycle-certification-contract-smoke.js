import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  simulateWorkerLifecycle,
  workerStateScenarios,
} from '../e2e/worker-state-scenarios.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const scenarioByProfile = (profile) => {
  const scenario = workerStateScenarios.find((candidate) => candidate.profile === profile);
  assert.ok(scenario, `Missing Phase 6 scenario: ${profile}`);
  return scenario;
};

const phase1Authority = read('docs/PHASE1_ADMISSION_UPLOAD_CORE_MODE_CONTRACT_2026-08-28.md');
const phase2Migration = read('supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql');
const phase3Authority = read('docs/PHASE3_WORKER_RENDER_RUNTIME_RECOVERY_AUTHORITY_2026-08-30.md');
const uploadGate = read('src/lib/reportUploadGate.js');
const fakeSupabase = read('tests/e2e/fake-supabase.js');
const workerScenarios = read('tests/e2e/worker-state-scenarios.js');
const customerReportsRoute = read('api/customer-reports.js');
const customerDownloadRoute = read('api/customer-report-download.js');

// Phase 1 is the forward admission authority. Either usable core source survives.
assert.match(phase1Authority, /t12_minimum_core[\s\S]*admissible/i);
assert.match(phase1Authority, /rent_roll_minimum_core[\s\S]*admissible/i);
assert.match(phase1Authority, /valid T12 or a valid Rent Roll is sufficient/i);
assert.match(uploadGate, /if \(hasT12\) return 't12_minimum_core'/);
assert.match(uploadGate, /if \(hasRentRoll\) return 'rent_roll_minimum_core'/);
assert.match(uploadGate, /canGenerate: hasCoreDocs/);
assert.match(workerScenarios, /Phase 1 authority: either usable core source survives/);
assert.doesNotMatch(workerScenarios, /if \(!parsed\.has\("rent_roll"\)\) missing\.push/);
assert.doesNotMatch(workerScenarios, /if \(!parsed\.has\("t12"\)\) missing\.push/);

// Phase 2 and Phase 3 establish one atomic publication authority.
assert.match(phase2Migration, /reports table is metadata and revision lineage only; it has no publication status authority/i);
assert.match(phase2Migration, /create or replace function public\.finalize_worker_publication_v2/i);
assert.match(phase2Migration, /publication_status, completed_at/i);
assert.match(phase2Migration, /set status = 'published'/i);
assert.match(phase2Migration, /set is_current_revision = true/i);
assert.match(phase2Migration, /if p_next_status = 'published' then[\s\S]*PUBLICATION_ATOMIC_V2_REQUIRED/i);
assert.match(phase3Authority, /finalize_worker_publication_v2 remains the only path to published state/i);

const createReportStart = fakeSupabase.indexOf('createReport(jobId');
const createReportEnd = fakeSupabase.indexOf('registerGeneratedReportObject', createReportStart);
assert.ok(createReportStart >= 0 && createReportEnd > createReportStart, 'Fake report creation block must exist.');
const createReportBlock = fakeSupabase.slice(createReportStart, createReportEnd);
assert.doesNotMatch(createReportBlock, /status\s*:\s*["']published["']/i);
assert.match(createReportBlock, /delete row\.status/);
assert.match(fakeSupabase, /finalizeWorkerPublicationV2\(jobId\)/);
assert.match(fakeSupabase, /authority: "finalize_worker_publication_v2"/);
assert.match(fakeSupabase, /publication_status: "complete"/);

const minimumCoreCases = [
  ['missing-rent-roll', 't12_minimum_core'],
  ['missing-t12', 'rent_roll_minimum_core'],
];

for (const [profile, expectedCoreMode] of minimumCoreCases) {
  const state = simulateWorkerLifecycle(scenarioByProfile(profile).seed);
  const jobId = state.jobs.keys().next().value;
  const job = state.job(jobId);
  const reports = state.reports.filter((report) => report.job_id === jobId);
  const receipts = state.publicationReceipts.filter((receipt) => receipt.job_id === jobId);
  const finalizationTransitions = state.transitions.filter(
    (transition) => transition.job_id === jobId && transition.authority === 'finalize_worker_publication_v2'
  );
  const generation = state.artifact(jobId, 'report_generation');

  assert.equal(job.status, 'published', `${profile} must publish under minimum-core authority.`);
  assert.equal(reports.length, 1, `${profile} must create exactly one revision row.`);
  assert.equal(Object.hasOwn(reports[0], 'status'), false, 'reports.status must not become publication authority.');
  assert.equal(reports[0].is_current_revision, true, 'Published revision must be current after atomic finalization.');
  assert.equal(receipts.length, 1, 'Atomic finalization must create exactly one publication receipt.');
  assert.equal(receipts[0].publication_status, 'complete');
  assert.equal(receipts[0].report_id, reports[0].id);
  assert.equal(receipts[0].revision_request_key, reports[0].revision_request_key);
  assert.equal(receipts[0].storage_path, reports[0].storage_path);
  assert.equal(finalizationTransitions.length, 1, 'Published transition must be owned by the v2 finalizer.');
  assert.equal(generation?.payload?.core_mode, expectedCoreMode);
  assert.equal(state.artifact(jobId, 'entitlement_restored'), null, 'Surviving minimum-core publication must not restore entitlement.');
}

// Atomic publication replay is idempotent after an ambiguous response.
const replayState = simulateWorkerLifecycle(scenarioByProfile('happy-underwriting').seed);
const replayJobId = replayState.jobs.keys().next().value;
const receiptCountBeforeReplay = replayState.publicationReceipts.length;
const transitionCountBeforeReplay = replayState.transitions.filter(
  (transition) => transition.authority === 'finalize_worker_publication_v2'
).length;
replayState.finalizeWorkerPublicationV2(replayJobId);
assert.equal(replayState.publicationReceipts.length, receiptCountBeforeReplay, 'Replay must not duplicate publication receipts.');
assert.equal(
  replayState.transitions.filter((transition) => transition.authority === 'finalize_worker_publication_v2').length,
  transitionCountBeforeReplay,
  'Replay must not create a second published transition.'
);
assert.equal(replayState.finalizationCalls.length, 1, 'Replay must return committed lineage without a second finalization write.');

// True loss of all usable core artifacts remains terminal in the worker simulator.
const noCoreState = simulateWorkerLifecycle(scenarioByProfile('missing-structured-artifacts').seed);
const noCoreJobId = noCoreState.jobs.keys().next().value;
assert.equal(noCoreState.job(noCoreJobId).status, 'failed');
assert.equal(noCoreState.reports.length, 0);
assert.equal(noCoreState.publicationReceipts.length, 0);
assert.ok(noCoreState.artifact(noCoreJobId, 'entitlement_restored'));

// Cross-source mismatch remains relevant only when both core sources survived.
const mismatchState = simulateWorkerLifecycle(scenarioByProfile('scale-mismatch').seed);
const mismatchJobId = mismatchState.jobs.keys().next().value;
assert.equal(mismatchState.job(mismatchJobId).status, 'failed');
assert.equal(mismatchState.job(mismatchJobId).error_code, 'DOCUMENT_FINANCIAL_SCALE_MISMATCH');
assert.equal(mismatchState.publicationReceipts.length, 0);

// Customer listing and download are owner-bound projections of completed publication lineage.
assert.match(customerReportsRoute, /resolveAuthenticatedActor/);
assert.match(customerReportsRoute, /from\('customer_published_report_projection'\)/);
assert.match(customerReportsRoute, /\.eq\('user_id', auth\.actor\.id\)/);
assert.doesNotMatch(customerReportsRoute, /from\('reports'\)/);

assert.match(customerDownloadRoute, /resolveAuthenticatedActor/);
assert.match(customerDownloadRoute, /from\('customer_published_report_projection'\)/);
assert.match(customerDownloadRoute, /\.eq\('user_id', auth\.actor\.id\)/);
assert.match(customerDownloadRoute, /\.eq\('publication_state', 'published'\)/);
assert.match(customerDownloadRoute, /\.from\('generated_reports'\)[\s\S]*createSignedUrl\(storagePath, 300\)/);
assert.doesNotMatch(customerDownloadRoute, /getPublicUrl\(/);

console.log('phase6-lifecycle-certification-contract-smoke: PASS');
