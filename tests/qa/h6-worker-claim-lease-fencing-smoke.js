import assert from 'node:assert/strict';
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

assert.match(workerSource, /rpc\('claim_worker_job'/);
assert.match(workerSource, /rpc\('claim_next_worker_job'/);
assert.match(workerSource, /rpc\('renew_worker_lease'/);
assert.match(workerSource, /rpc\('transition_worker_job'/);
assert.match(workerSource, /rpc\('fail_worker_job'/);
assert.match(workerSource, /rpc\('requeue_worker_job'/);
assert.match(workerSource, /eq\('worker_attempt_id', currentAttemptId\)/);
assert.match(workerSource, /eq\('worker_attempt_id', workerAttemptId\)/);
assert.match(workerSource, /transitionWorkerJob\(job, 'rendering', 'pdf_generating'/);
assert.match(workerSource, /transitionWorkerJob\(job, 'pdf_generating', 'publishing'/);
assert.match(workerSource, /transitionWorkerJob\(job, 'publishing', 'published'/);
assert.match(workerSource, /\/\/ const completeUpdate = \{ status: 'published' \};/);
assert.equal(/claim_and_consume_job/.test(workerSource), false);

assert.match(runnerSource, /rpc\('claim_next_worker_job'/);
assert.match(runnerSource, /rpc\('requeue_worker_job'/);
assert.match(runnerSource, /worker_attempt_id/);
assert.match(runnerSource, /worker_lease_expires_at/);

assert.match(dashboardSource, /dead_letter/);
assert.match(dashboardSource, /Requeue dead-letter job/);
assert.match(dashboardSource, /Only enabled when the selected job is failed or dead-lettered\./);

console.log('h6-worker-claim-lease-fencing smoke PASS');
