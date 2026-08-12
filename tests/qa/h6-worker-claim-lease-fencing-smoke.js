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
  '!INVESTORIQ_CANONICAL_HANDOFF_UPDATED_2026-08-06_GATE3_ACTIVE.md',
  'docs/ROADMAP_UPDATED_2026-08-06_GATE3_ACTIVE.md',
  'docs/STATUS_UPDATED_2026-08-06_GATE3_ACTIVE.md',
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
assert.equal(/create or replace function public\.claim_next_job\s*\(/i.test(migrationSource), false);
assert.equal(/create or replace function public\.admin_requeue_job\s*\(/i.test(migrationSource), false);
assert.equal(/drop function(?: if exists)? public\.claim_next_job\b/i.test(migrationSource), false);
assert.equal(/drop function(?: if exists)? public\.admin_requeue_job\b/i.test(migrationSource), false);
assert.equal(/from public\.reports r[\s\S]*r\.job_id/i.test(migrationSource), false);
assert.equal(/r\.status = 'published'/i.test(migrationSource), false);
assert.match(
  migrationSource,
  /from public\.analysis_jobs aj[\s\S]*aj\.id = p_job_id[\s\S]*aj\.status = 'published'[\s\S]*aj\.report_id is not null/i
);

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
  /handoffTimedOutWorkerJob/,
  /deferredJobIds\.has\(job\.id\)/,
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
assert.match(workerSource, /\.not\('worker_lease_expires_at', 'is', null\)/);
assert.match(workerSource, /\.lte\('worker_lease_expires_at', nowIso\)/);
assert.match(workerSource, /p_claimed_by: job\.worker_claimed_by \|\| null/);
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
