import assert from 'node:assert/strict';
import fs from 'node:fs';

const workerPath = 'api/admin-run-worker.js';
const workerSource = fs.readFileSync(workerPath, 'utf8');

// 1) Action registered in controlledActions and requires job_id via shared gate
assert.match(workerSource, /'fail_exact_expired_worker_job'/);
assert.match(
  workerSource,
  /controlledActions = new Set\([\s\S]*'fail_exact_expired_worker_job'/
);
assert.match(workerSource, /if \(!controlledJobId\)/);
assert.match(workerSource, /Missing job_id/);

const actionIdx = workerSource.indexOf("controlledAction === 'fail_exact_expired_worker_job'");
assert.ok(actionIdx > 0, 'fail_exact_expired_worker_job branch must exist');
const actionEndMarker = workerSource.indexOf(
  "return res.status(400).json({ ok: false, error: 'Unsupported controlled action' });",
  actionIdx
);
assert.ok(actionEndMarker > actionIdx, 'branch end marker must exist');
const actionSlice = workerSource.slice(actionIdx, actionEndMarker);

// 2) Exact-job lookup only (uses controlJob loaded by controlledJobId)
assert.match(workerSource, /\.eq\('id',\s*controlledJobId\)/);
assert.equal(
  /claim_next_worker_job/.test(actionSlice),
  false,
  'exact expired branch must not call claim_next_worker_job'
);
assert.equal(
  /\.eq\('status',\s*'queued'\)[\s\S]{0,120}\.order\('created_at'/.test(actionSlice),
  false,
  'exact expired branch must not scan queued candidates'
);

// 3) Active lease rejects
assert.match(actionSlice, /worker lease is still active/);
assert.match(actionSlice, /status\(409\)/);

// 4) Non-eligible / queued / terminal statuses reject
assert.match(actionSlice, /eligibleActiveStatuses/);
assert.match(actionSlice, /'rendering'/);
assert.match(actionSlice, /Exact expired recovery is only available for eligible active expired worker jobs/);
assert.match(actionSlice, /status\(400\)/);

// 5) Terminal jobs are outside eligibleActiveStatuses (failed/dead_letter/published/queued rejected)
assert.equal(/eligibleActiveStatuses\.includes\('queued'\)/.test(actionSlice), false);
assert.equal(/eligibleActiveStatuses\.includes\('failed'\)/.test(actionSlice), false);
assert.equal(/eligibleActiveStatuses\.includes\('dead_letter'\)/.test(actionSlice), false);
assert.equal(/eligibleActiveStatuses\.includes\('published'\)/.test(actionSlice), false);

// 6) Expired rendering job accepted path uses leaseExpired check
assert.match(actionSlice, /leaseExpired/);
assert.match(actionSlice, /worker_lease_expires_at/);

// 7) Exact attempt and claimant fencing passed to fail_expired_worker_job
assert.match(actionSlice, /rpc\('fail_expired_worker_job'/);
assert.match(actionSlice, /p_job_id:\s*controlJob\.id/);
assert.match(actionSlice, /p_worker_attempt_id:\s*attemptId/);
assert.match(actionSlice, /p_expected_current_status:\s*currentStatus/);
assert.match(actionSlice, /p_claimed_by:\s*claimedBy/);
assert.match(actionSlice, /p_error_code:\s*'TIMEOUT'/);
assert.match(actionSlice, /p_failure_reason:\s*'worker_timeout'/);

// 8) Max-attempt result becomes dead_letter (uses RPC terminal status)
assert.match(actionSlice, /timeoutRow\.status[\s\S]{0,40}dead_letter[\s\S]{0,40}dead_letter[\s\S]{0,20}failed/);
assert.match(actionSlice, /worker_dead_lettered/);

// 9) Existing restoration helper is used
assert.match(actionSlice, /restoreEntitlementForFailedJob\(/);
assert.match(actionSlice, /'worker_timeout'/);
assert.match(actionSlice, /'TIMEOUT'/);

// 10) No normal worker claim loop executes from this branch (returns 200)
assert.match(actionSlice, /return res\.status\(200\)\.json\(/);
assert.equal(/exactJobMode\s*=\s*true/.test(actionSlice), false, 'must not set exactJobMode');
assert.equal(/claim_worker_job/.test(actionSlice), false, 'must not claim');

// 11) No unrelated job selection
assert.equal(/in\('status',\s*inProgressStatuses\)/.test(actionSlice), false);
assert.equal(/expiredRecoveryJobs/.test(actionSlice), false);

// 12) No requeue
assert.equal(/governed_requeue_worker_job/.test(actionSlice), false);
assert.equal(/requeue_worker_job/.test(actionSlice), false);

// 13) No attempt count increment (no claim_worker_job / no worker_attempt_count \+ 1)
assert.equal(/worker_attempt_count[\s\S]{0,20}\+\s*1/.test(actionSlice), false);

// 14) Bounded exact response shape
assert.match(actionSlice, /action:\s*controlledAction/);
assert.match(actionSlice, /job_id:\s*controlJob\.id/);
assert.match(actionSlice, /previous_status:\s*currentStatus/);
assert.match(actionSlice, /final_status:\s*terminalStatus/);
assert.match(actionSlice, /worker_attempt_count:\s*attemptCount/);
assert.match(actionSlice, /worker_attempt_id:\s*attemptId/);
assert.match(actionSlice, /entitlement_restored/);
assert.match(actionSlice, /credit_balance_changed:\s*false/);
assert.match(actionSlice, /message:/);

// Admin audit event recorded
assert.match(actionSlice, /writeAdminControlAudit\(controlJob,\s*controlledAction,\s*'allowed'/);
assert.match(actionSlice, /admin_control_fail_exact_expired_worker_job/);

// Missing fencing fields reject
assert.match(actionSlice, /missing attempt fencing fields/);

// Shared auth boundary retained
assert.match(workerSource, /if \(!controlledActions\.has\(controlledAction\)\)/);

// No RETEST UUID hard-coding
assert.equal(/084a982e-ff6e-49b0-a7f7-473ed314aada/i.test(workerSource), false);

// Existing exact-job and plain recovery paths retained
assert.match(workerSource, /'process_exact_queued_job'/);
assert.match(workerSource, /rpc\('fail_expired_worker_job'/);

console.log('fail-exact-expired-worker-job-smoke: PASS');
