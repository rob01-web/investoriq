import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const migrationSource = fs.readFileSync(
  'supabase/migrations/20260814000100_transition_worker_job_release_queued_ownership.sql',
  'utf8'
);
const workerSource = fs.readFileSync('api/admin-run-worker.js', 'utf8');
const runnerSource = fs.readFileSync('api/admin/run-eligible-jobs-once.js', 'utf8');
const dashboardSource = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

const changedFiles = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const allowedFiles = new Set([
  'supabase/migrations/20260729000200_h6_worker_claim_lease_fencing.sql',
  'supabase/migrations/20260814000100_transition_worker_job_release_queued_ownership.sql',
  'api/_lib/generate-client-report-impl.js',
  'api/_lib/generate-client-report-handler.js',
  'api/admin-run-worker.js',
  'api/admin/queue-metrics.js',
  'api/admin/run-eligible-jobs-once.js',
  'src/pages/AdminDashboard.jsx',
  'tests/qa/core-publication-recovery-smoke.js',
  'tests/qa/delivery-decision-state-smoke.js',
  'tests/qa/docraptor-provider-error-observability-smoke.js',
  'tests/qa/full-underwriting-publication-atomicity-regression.js',
  'tests/qa/p0c-final-pdf-publication-quality-boss-smoke.js',
  'tests/qa/h6-worker-claim-lease-fencing-smoke.js',
  'tests/qa/h8-entitlement-restoration-event-smoke.js',
  'tests/qa/phase3-worker-render-recovery-contract-smoke.js',
  'tests/qa/report-publication-authority-boundary-smoke.js',
  'tests/qa/report-quality-manifest-smoke.js',
  'tests/qa/screening-report-sealed-lane-authority-smoke.js',
  'supabase/migrations/20260830183000_phase3_worker_runtime_recovery_authority.sql',
  'docs/PHASE3_WORKER_RENDER_RUNTIME_RECOVERY_AUTHORITY_2026-08-30.md',
  'docs/OPERATIONS_RECOVERY_RUNBOOK.md',
  'docs/STATUS.md',
  'docs/ROADMAP.md',
  '!INVESTORIQ_CURRENT_GAMEPLAN_HANDOFF_UPDATED_2026-07-28.md',
  '!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-06_GATE3_ACTIVE.md',
  'docs/ROADMAP_UPDATED_2026-08-06_GATE3_ACTIVE.md',
  'docs/STATUS_UPDATED_2026-08-06_GATE3_ACTIVE.md',
]);

for (const file of changedFiles) {
  assert.ok(allowedFiles.has(file), `Unexpected changed file: ${file}`);
}

assert.match(migrationSource, /create or replace function public\.transition_worker_job\(/i);
assert.match(migrationSource, /when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /started_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /worker_last_heartbeat_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /worker_lease_expires_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /worker_attempt_id = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /worker_claimed_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /worker_claimed_by = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /dead_lettered_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /error_code = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /error_message = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(migrationSource, /failure_reason = case[\s\S]*when p_next_status = 'queued' then null/i);

assert.match(workerSource, /assertCurrentWorkerInvocationOwnership/);
assert.match(workerSource, /rpc\('claim_worker_job'/);
assert.doesNotMatch(workerSource, /rpc\('claim_next_worker_job'/);
assert.match(workerSource, /rpc\('renew_worker_lease'/);
assert.match(workerSource, /rpc\('transition_worker_job'/);
assert.match(workerSource, /rpc\('fail_expired_worker_job'/);
assert.match(workerSource, /restore_failed_worker_entitlement/);
assert.match(workerSource, /rpc\('requeue_worker_job'/);
assert.match(workerSource, /eq\('worker_attempt_id', currentAttemptId\)/);
assert.match(workerSource, /eq\('worker_attempt_id', workerAttemptId\)/);
assert.match(workerSource, /eq\('worker_claimed_by', workerInvocationId\)/);
assert.match(workerSource, /\.not\('worker_lease_expires_at', 'is', null\)/);
assert.match(workerSource, /\.lte\('worker_lease_expires_at', nowIso\)/);
assert.match(workerSource, /p_claimed_by: job\.worker_claimed_by \|\| null/);
assert.match(workerSource, /transitionWorkerJob\(job, 'rendering', 'pdf_generating'/);
assert.match(workerSource, /transitionWorkerJob\(job, 'pdf_generating', 'publishing'/);
assert.doesNotMatch(workerSource, /transitionWorkerJob\(job, 'publishing', 'published'/);
assert.match(workerSource, /finalize_worker_publication_v2/);
assert.equal(/claim_and_consume_job/.test(workerSource), false);

assert.match(migrationSource, /and j\.worker_claimed_by = v_claimed_by/i);
assert.equal(/worker_claimed_by\s*=\s*coalesce\(/i.test(migrationSource), false);

assert.doesNotMatch(runnerSource, /rpc\('claim_next_worker_job'/);
assert.doesNotMatch(runnerSource, /rpc\('requeue_worker_job'/);
assert.match(runnerSource, /begin_worker_recovery_episode/);
assert.match(runnerSource, /claimant: false/);

assert.match(dashboardSource, /dead_letter/);
assert.match(dashboardSource, /Requeue dead-letter job/);
assert.match(dashboardSource, /Only enabled when the selected job is failed or dead-lettered\./);

const leaseMs = 30 * 60 * 1000;
const fixedNow = Date.parse('2026-07-29T12:00:00.000Z');
const liveLeaseExpiry = () => new Date(fixedNow + leaseMs).toISOString();
const expiredLeaseExpiry = () => new Date(fixedNow - 1000).toISOString();
const makeJob = (overrides = {}) => ({
  id: 'job-h6-smoke',
  status: 'queued',
  worker_attempt_id: null,
  worker_attempt_count: 0,
  worker_lease_expires_at: null,
  worker_claimed_at: null,
  worker_last_heartbeat_at: null,
  worker_claimed_by: null,
  dead_lettered_at: null,
  purchase_id: 'purchase-h6-smoke',
  ...overrides,
});
const makeState = (jobOverrides = {}) => ({
  job: makeJob(jobOverrides),
  purchase: {
    id: 'purchase-h6-smoke',
    job_id: 'job-h6-smoke',
    consumed_at: '2026-07-29T11:30:00.000Z',
  },
  publishedReport: false,
});
const matchesOwnership = (job, attemptId, claimedBy) =>
  job.worker_attempt_id === attemptId && job.worker_claimed_by === claimedBy;
const claimNext = (state, claimedBy) => {
  const { job } = state;
  if (job.status !== 'queued' || job.dead_lettered_at || !claimedBy) {
    return null;
  }
  if (job.worker_lease_expires_at && Date.parse(job.worker_lease_expires_at) > fixedNow) {
    return null;
  }
  const attemptId = randomUUID();
  job.status = 'extracting';
  job.worker_attempt_count += 1;
  job.worker_attempt_id = attemptId;
  job.worker_lease_expires_at = liveLeaseExpiry();
  job.worker_claimed_at = new Date(fixedNow).toISOString();
  job.worker_last_heartbeat_at = new Date(fixedNow).toISOString();
  job.worker_claimed_by = claimedBy;
  job.dead_lettered_at = null;
  return attemptId;
};
const renewLease = (state, attemptId, claimedBy) => {
  const { job } = state;
  if (!matchesOwnership(job, attemptId, claimedBy)) return false;
  if (!['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'].includes(job.status)) {
    return false;
  }
  if (!job.worker_lease_expires_at || Date.parse(job.worker_lease_expires_at) <= fixedNow) {
    return false;
  }
  job.worker_last_heartbeat_at = new Date(fixedNow).toISOString();
  job.worker_lease_expires_at = liveLeaseExpiry();
  return true;
};
const transitionJob = (state, attemptId, claimedBy, expectedStatus, nextStatus) => {
  const { job } = state;
  if (!matchesOwnership(job, attemptId, claimedBy)) return false;
  if (job.status !== expectedStatus) return false;
  if (expectedStatus !== 'queued' && (!job.worker_lease_expires_at || Date.parse(job.worker_lease_expires_at) <= fixedNow)) {
    return false;
  }
  job.status = nextStatus;
  job.worker_last_heartbeat_at = new Date(fixedNow).toISOString();
  if (nextStatus === 'queued') {
    job.started_at = null;
    job.worker_attempt_id = null;
    job.worker_claimed_at = null;
    job.worker_last_heartbeat_at = null;
    job.worker_claimed_by = null;
    job.worker_lease_expires_at = null;
    job.dead_lettered_at = null;
    job.error_code = null;
    job.error_message = null;
    job.failure_reason = null;
    return true;
  }
  job.worker_lease_expires_at = ['published', 'failed', 'dead_letter'].includes(nextStatus)
    ? null
    : liveLeaseExpiry();
  return true;
};
const failJob = (state, attemptId, claimedBy, expectedStatus, isExpiredLease = false) => {
  const { job } = state;
  if (!matchesOwnership(job, attemptId, claimedBy)) return false;
  if (job.status !== expectedStatus) return false;
  const leaseExpiry = job.worker_lease_expires_at ? Date.parse(job.worker_lease_expires_at) : null;
  if (isExpiredLease ? leaseExpiry === null || leaseExpiry > fixedNow : leaseExpiry === null || leaseExpiry <= fixedNow) {
    return false;
  }
  const exhausted = job.worker_attempt_count >= 3;
  job.status = exhausted ? 'dead_letter' : 'failed';
  job.worker_last_heartbeat_at = new Date(fixedNow).toISOString();
  job.worker_lease_expires_at = null;
  if (exhausted) {
    job.dead_lettered_at = new Date(fixedNow).toISOString();
  }
  return true;
};
const requeueJob = (state, allowExpiredLeaseRecovery = false) => {
  const { job } = state;
  const liveLease = job.worker_lease_expires_at ? Date.parse(job.worker_lease_expires_at) > fixedNow : false;
  if (
    job.status === 'published' ||
    (['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'].includes(job.status) &&
      !allowExpiredLeaseRecovery &&
      liveLease)
  ) {
    return false;
  }
  if (['failed', 'dead_letter'].includes(job.status) || (allowExpiredLeaseRecovery && !liveLease)) {
    job.status = 'queued';
    job.worker_attempt_id = null;
    job.worker_lease_expires_at = null;
    job.worker_claimed_at = null;
    job.worker_last_heartbeat_at = null;
    job.worker_claimed_by = null;
    job.dead_lettered_at = null;
    job.error_code = null;
    job.error_message = null;
    job.failure_reason = null;
    return true;
  }
  return false;
};
const restoreEntitlement = (state, attemptId, claimedBy, terminalStatus) => {
  const { job, purchase, publishedReport } = state;
  if (!matchesOwnership(job, attemptId, claimedBy)) return false;
  if (!['failed', 'dead_letter'].includes(terminalStatus) || job.status !== terminalStatus) return false;
  if (publishedReport) return false;
  if (purchase.job_id !== job.id || purchase.consumed_at === null) return false;
  purchase.consumed_at = null;
  purchase.job_id = null;
  job.purchase_id = null;
  return true;
};
const canActiveStageProcess = (job, claimedBy) => job.worker_claimed_by === claimedBy && !!job.worker_attempt_id;
const activeWorkerStatuses = new Set(['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing']);
const selectExpiredRecoveryJobs = (jobs, nowValue) =>
  jobs.filter(
    (job) =>
      activeWorkerStatuses.has(job.status) &&
      !!job.worker_lease_expires_at &&
      Date.parse(job.worker_lease_expires_at) <= nowValue &&
      !job.dead_lettered_at
  );
const runExpiredRecoverySweep = (jobs, nowValue, recoveryInvocationId) =>
  selectExpiredRecoveryJobs(jobs, nowValue).map((job) => {
    const recovered = failJob({ job }, job.worker_attempt_id, job.worker_claimed_by, job.status, true);
    return {
      recoveryInvocationId,
      jobId: job.id,
      attemptId: job.worker_attempt_id,
      claimedBy: job.worker_claimed_by,
      status: job.status,
      recovered,
    };
  });
const handoffJob = (state, attemptId, claimedBy, elapsedSeconds) => {
  const { job } = state;
  if (!matchesOwnership(job, attemptId, claimedBy)) return false;
  if (job.status !== 'extracting') return false;
  if ((elapsedSeconds || 0) < 42) return false;
  job.status = 'queued';
  job.worker_attempt_id = null;
  job.worker_lease_expires_at = null;
  job.worker_claimed_at = null;
  job.worker_last_heartbeat_at = null;
  job.worker_claimed_by = null;
  return true;
};
const claimNextForInvocation = (state, invocation, claimedBy) => {
  if (invocation.deferredJobIds.has(state.job.id)) return null;
  const attemptId = claimNext(state, claimedBy);
  if (attemptId) {
    invocation.claimedJobIds.add(state.job.id);
  }
  return attemptId;
};

{
  const state = makeState();
  const attemptA = claimNext(state, 'worker-a');
  assert.ok(attemptA);
  assert.equal(state.job.worker_claimed_by, 'worker-a');
  assert.ok(state.job.worker_lease_expires_at);
  assert.equal(renewLease(state, attemptA, 'worker-b'), false);
  assert.equal(transitionJob(state, attemptA, 'worker-b', 'extracting', 'underwriting'), false);
  assert.equal(failJob(state, attemptA, 'worker-b', 'extracting'), false);
  assert.equal(canActiveStageProcess(state.job, 'worker-b'), false);
  assert.equal(canActiveStageProcess(state.job, 'worker-a'), true);
}

{
  const state = makeState({
    status: 'extracting',
    worker_attempt_count: 1,
    worker_attempt_id: 'attempt-expired-a',
    worker_lease_expires_at: expiredLeaseExpiry(),
    worker_claimed_by: 'worker-a',
    worker_claimed_at: '2026-07-29T11:00:00.000Z',
    worker_last_heartbeat_at: '2026-07-29T11:00:00.000Z',
  });
  const expiredRows = selectExpiredRecoveryJobs([state.job], fixedNow);
  assert.equal(expiredRows.length, 1);
  assert.equal(expiredRows[0].worker_claimed_by, 'worker-a');
  const recoveryResults = runExpiredRecoverySweep([state.job], fixedNow, 'worker-b');
  assert.equal(recoveryResults.length, 1);
  assert.equal(recoveryResults[0].recoveryInvocationId, 'worker-b');
  assert.equal(recoveryResults[0].claimedBy, 'worker-a');
  assert.equal(recoveryResults[0].attemptId, 'attempt-expired-a');
  assert.equal(recoveryResults[0].recovered, true);
  assert.equal(state.job.status, 'failed');
}

{
  const state = makeState();
  const attemptA = claimNext(state, 'worker-a');
  assert.ok(attemptA);
  assert.equal(renewLease(state, attemptA, 'worker-a'), true);
  assert.equal(transitionJob(state, attemptA, 'worker-a', 'extracting', 'underwriting'), true);
  assert.equal(state.job.worker_claimed_by, 'worker-a');
  assert.equal(state.job.status, 'underwriting');
  assert.equal(failJob(state, attemptA, 'worker-a', 'underwriting'), true);
  assert.equal(state.job.status, 'failed');
  assert.equal(restoreEntitlement(state, attemptA, 'worker-a', 'failed'), true);
  assert.equal(state.purchase.consumed_at, null);
  assert.equal(state.purchase.job_id, null);
  assert.equal(state.job.purchase_id, null);
}

{
  const state = makeState();
  const attemptA = claimNext(state, 'worker-a');
  assert.ok(attemptA);
  assert.equal(requeueJob(state), false);
  state.job.status = 'failed';
  state.job.worker_lease_expires_at = null;
  assert.equal(requeueJob(state), true);
  const attemptB = claimNext(state, 'worker-b');
  assert.ok(attemptB);
  assert.notEqual(attemptB, attemptA);
  assert.equal(state.job.worker_claimed_by, 'worker-b');
  assert.equal(renewLease(state, attemptA, 'worker-a'), false);
  assert.equal(transitionJob(state, attemptA, 'worker-a', 'extracting', 'underwriting'), false);
  assert.equal(failJob(state, attemptA, 'worker-a', 'extracting'), false);
  assert.equal(restoreEntitlement(state, attemptA, 'worker-a', 'failed'), false);
}

{
  const state = makeState();
  state.jobFiles = [
    { id: 'file-rent-roll', job_id: state.job.id, doc_type: 'rent_roll', parse_status: 'parsed' },
    { id: 'file-t12', job_id: state.job.id, doc_type: 't12', parse_status: 'parsed' },
  ];

  const invocationA = { claimedJobIds: new Set(), deferredJobIds: new Set() };
  const invocationB = { claimedJobIds: new Set(), deferredJobIds: new Set() };

  const attemptA = claimNext(state, 'worker-a');
  assert.ok(attemptA);
  assert.equal(handoffJob(state, attemptA, 'worker-a', 50), true);
  invocationA.deferredJobIds.add(state.job.id);
  assert.equal(state.job.status, 'queued');
  assert.equal(state.job.worker_claimed_by, null);
  assert.equal(state.job.worker_attempt_id, null);
  assert.equal(state.job.worker_lease_expires_at, null);
  assert.equal(claimNextForInvocation(state, invocationA, 'worker-a'), null);
  assert.equal(renewLease(state, attemptA, 'worker-a'), false);
  assert.equal(transitionJob(state, attemptA, 'worker-a', 'extracting', 'underwriting'), false);
  assert.equal(failJob(state, attemptA, 'worker-a', 'extracting'), false);
  assert.equal(state.jobFiles.every((file) => file.parse_status === 'parsed'), true);

  const attemptB = claimNextForInvocation(state, invocationB, 'worker-b');
  assert.ok(attemptB);
  assert.notEqual(attemptB, attemptA);
  assert.equal(state.job.status, 'extracting');
  assert.equal(state.job.worker_claimed_by, 'worker-b');
  assert.equal(state.job.worker_attempt_id, attemptB);
  assert.equal(invocationB.claimedJobIds.has(state.job.id), true);
  assert.equal(selectExpiredRecoveryJobs([state.job], fixedNow).length, 0);
  assert.equal(state.jobFiles.filter((file) => file.parse_status === 'parsed').length, 2);
}

{
  const state = makeState({
    status: 'extracting',
    worker_attempt_count: 3,
    worker_attempt_id: 'attempt-live',
    worker_lease_expires_at: expiredLeaseExpiry(),
    worker_claimed_by: 'worker-a',
    worker_claimed_at: '2026-07-29T11:00:00.000Z',
    worker_last_heartbeat_at: '2026-07-29T11:00:00.000Z',
  });
  state.purchase.consumed_at = '2026-07-29T11:30:00.000Z';
  assert.equal(failJob(state, 'attempt-live', 'worker-a', 'extracting', true), true);
  assert.equal(state.job.status, 'dead_letter');
  assert.ok(state.job.dead_lettered_at);
  assert.equal(restoreEntitlement(state, 'attempt-live', 'worker-a', 'dead_letter'), true);
  assert.equal(state.purchase.consumed_at, null);
}

{
  const state = makeState({
    status: 'extracting',
    worker_attempt_count: 1,
    worker_attempt_id: 'attempt-expired',
    worker_lease_expires_at: expiredLeaseExpiry(),
    worker_claimed_by: 'worker-a',
  });
  assert.equal(failJob(state, 'attempt-expired', 'worker-b', 'extracting', true), false);
  assert.equal(failJob(state, 'attempt-expired', 'worker-a', 'extracting', true), true);
  assert.equal(state.job.status, 'failed');
  state.job.status = 'failed';
  state.job.worker_attempt_id = null;
  assert.equal(requeueJob(state), true);
  const attemptB = claimNext(state, 'worker-b');
  assert.ok(attemptB);
  assert.equal(restoreEntitlement(state, 'attempt-expired', 'worker-a', 'failed'), false);
}

{
  const state = makeState({
    status: 'rendering',
    worker_attempt_count: 1,
    worker_attempt_id: 'attempt-live-handoff',
    worker_lease_expires_at: liveLeaseExpiry(),
    worker_claimed_by: 'worker-a',
    worker_claimed_at: '2026-07-29T11:45:00.000Z',
    worker_last_heartbeat_at: '2026-07-29T11:50:00.000Z',
    started_at: '2026-07-29T11:45:00.000Z',
    error_code: 'REPORT_RENDER_FAILED',
    error_message: 'REPORT_RENDER_FAILED',
    failure_reason: 'worker_timeout',
  });
  assert.equal(transitionJob(state, 'attempt-live-handoff', 'worker-a', 'rendering', 'queued'), true);
  assert.equal(state.job.status, 'queued');
  assert.equal(state.job.worker_attempt_id, null);
  assert.equal(state.job.worker_claimed_by, null);
  assert.equal(state.job.worker_claimed_at, null);
  assert.equal(state.job.worker_last_heartbeat_at, null);
  assert.equal(state.job.worker_lease_expires_at, null);
  assert.equal(state.job.started_at, null);
  assert.equal(state.job.error_code, null);
  assert.equal(state.job.error_message, null);
  assert.equal(state.job.failure_reason, null);

  const attemptB = claimNext(state, 'worker-b');
  assert.ok(attemptB);
  assert.equal(state.job.status, 'extracting');
  assert.equal(state.job.worker_claimed_by, 'worker-b');
  assert.equal(state.job.worker_attempt_id, attemptB);
  assert.equal(claimNext(state, 'worker-a'), null);
}

{
  const state = makeState({
    status: 'extracting',
    worker_attempt_count: 1,
    worker_attempt_id: 'attempt-live-b',
    worker_lease_expires_at: liveLeaseExpiry(),
    worker_claimed_by: 'worker-a',
  });
  const expiredRows = selectExpiredRecoveryJobs([state.job], fixedNow);
  assert.equal(expiredRows.length, 0);
  assert.equal(canActiveStageProcess(state.job, 'worker-b'), false);
  assert.equal(renewLease(state, 'attempt-live-b', 'worker-b'), false);
  assert.equal(transitionJob(state, 'attempt-live-b', 'worker-b', 'extracting', 'underwriting'), false);
}

{
  const state = makeState({
    status: 'extracting',
    worker_attempt_count: 3,
    worker_attempt_id: 'attempt-exhaust',
    worker_lease_expires_at: liveLeaseExpiry(),
    worker_claimed_by: 'worker-a',
  });
  assert.equal(failJob(state, 'attempt-exhaust', 'worker-a', 'extracting'), true);
  assert.equal(state.job.status, 'dead_letter');
  assert.ok(state.job.dead_lettered_at);
}

console.log('h6-worker-claim-lease-fencing smoke PASS');
