import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const migrationSource = fs.readFileSync(
  'supabase/migrations/20260729000200_h6_worker_claim_lease_fencing.sql',
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
  'api/admin-run-worker.js',
  'api/admin/run-eligible-jobs-once.js',
  'src/pages/AdminDashboard.jsx',
  'tests/qa/h6-worker-claim-lease-fencing-smoke.js',
  'docs/STATUS.md',
  'docs/ROADMAP.md',
  '!INVESTORIQ_CURRENT_GAMEPLAN_HANDOFF_UPDATED_2026-07-28.md',
]);

for (const file of changedFiles) {
  assert.ok(allowedFiles.has(file), `Unexpected changed file: ${file}`);
}

for (const pattern of [
  /worker_attempt_id uuid/i,
  /worker_attempt_count integer not null default 0/i,
  /worker_lease_expires_at timestamptz/i,
  /worker_claimed_at timestamptz/i,
  /worker_last_heartbeat_at timestamptz/i,
  /worker_claimed_by text/i,
  /dead_lettered_at timestamptz/i,
  /worker_lease_duration\(\)/i,
  /worker_max_attempt_count\(\)/i,
  /claim_worker_job\(/i,
  /claim_next_worker_job\(/i,
  /renew_worker_lease\(/i,
  /transition_worker_job\(/i,
  /fail_worker_job\(/i,
  /requeue_worker_job\(/i,
]) {
  assert.match(migrationSource, pattern);
}

assert.match(migrationSource, /check \(worker_attempt_count >= 0\)/i);
assert.match(migrationSource, /check \(dead_lettered_at is null or status = 'dead_letter'\)/i);
assert.match(migrationSource, /select \* from public\.claim_worker_job\(v_target_id, p_claimed_by\)/i);
assert.match(migrationSource, /select \* from public\.claim_next_worker_job\(\)/i);
assert.match(migrationSource, /select \* from public\.requeue_worker_job\(p_job_id, p_reason, false\)/i);

for (const pattern of [
  /claim_worker_job/,
  /claim_next_worker_job/,
  /renew_worker_lease/,
  /transition_worker_job/,
  /fail_worker_job/,
  /fail_expired_worker_job/,
  /restore_failed_worker_entitlement/,
  /requeue_worker_job/,
  /worker_attempt_id/,
  /worker_lease_expires_at/,
  /worker_last_heartbeat_at/,
  /worker_claimed_by/,
  /dead_lettered_at/,
  /STALE_WORKER_ATTEMPT/,
  /worker_claimed/,
  /worker_lease_renewed/,
  /worker_lease_expired/,
  /worker_reclaimed/,
  /worker_attempt_failed/,
  /worker_dead_lettered/,
  /worker_admin_requeued/,
  /stale_worker_rejected/,
  /entitlement_restored/,
]) {
  assert.match(workerSource, pattern);
}

assert.match(workerSource, /assertCurrentWorkerInvocationOwnership/);
assert.match(workerSource, /rpc\('claim_worker_job'/);
assert.match(workerSource, /rpc\('claim_next_worker_job'/);
assert.match(workerSource, /rpc\('renew_worker_lease'/);
assert.match(workerSource, /rpc\('transition_worker_job'/);
assert.match(workerSource, /rpc\('fail_worker_job'/);
assert.match(workerSource, /rpc\('fail_expired_worker_job'/);
assert.match(workerSource, /restore_failed_worker_entitlement/);
assert.match(workerSource, /rpc\('requeue_worker_job'/);
assert.match(workerSource, /eq\('worker_attempt_id', currentAttemptId\)/);
assert.match(workerSource, /eq\('worker_attempt_id', workerAttemptId\)/);
assert.match(workerSource, /eq\('worker_claimed_by', workerInvocationId\)/);
assert.match(workerSource, /transitionWorkerJob\(job, 'rendering', 'pdf_generating'/);
assert.match(workerSource, /transitionWorkerJob\(job, 'pdf_generating', 'publishing'/);
assert.match(workerSource, /transitionWorkerJob\(job, 'publishing', 'published'/);
assert.match(workerSource, /\/\/ const completeUpdate = \{ status: 'published' \};/);
assert.equal(/claim_and_consume_job/.test(workerSource), false);

assert.match(migrationSource, /and j\.worker_claimed_by = v_claimed_by/i);
assert.equal(/worker_claimed_by\s*=\s*coalesce\(/i.test(migrationSource), false);

assert.match(runnerSource, /rpc\('claim_next_worker_job'/);
assert.match(runnerSource, /rpc\('requeue_worker_job'/);
assert.match(runnerSource, /worker_attempt_id/);
assert.match(runnerSource, /worker_lease_expires_at/);

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
