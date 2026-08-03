import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const migrationPath = 'supabase/migrations/20260803000100_governed_requeue_worker_job.sql';
const workerPath = 'api/admin-run-worker.js';
const migrationSource = fs.readFileSync(migrationPath, 'utf8');
const workerSource = fs.readFileSync(workerPath, 'utf8');

// --- migration contract ---
assert.match(migrationSource, /create or replace function public\.governed_requeue_worker_job\(/i);
assert.match(migrationSource, /p_job_id uuid/i);
assert.match(migrationSource, /for update/i);
assert.match(migrationSource, /status not in \('failed', 'dead_letter'\)/i);
assert.match(migrationSource, /GOVERNED_REQUEUE_PUBLISHED_BLOCKED/);
assert.match(migrationSource, /GOVERNED_REQUEUE_STATUS_NOT_ELIGIBLE/);
assert.match(migrationSource, /GOVERNED_REQUEUE_NO_LINKED_OR_RESTORED_PURCHASE/);
assert.match(migrationSource, /GOVERNED_REQUEUE_AMBIGUOUS_PURCHASE_LINEAGE/);
assert.match(migrationSource, /GOVERNED_REQUEUE_WRONG_USER_PURCHASE/);
assert.match(migrationSource, /GOVERNED_REQUEUE_WRONG_PRODUCT_TYPE/);
assert.match(migrationSource, /GOVERNED_REQUEUE_PURCHASE_BOUND_TO_OTHER_JOB/);
assert.match(migrationSource, /event_type = 'entitlement_restored'/);
assert.match(migrationSource, /meta->>'purchase_id'/);
assert.match(migrationSource, /purchase_already_linked boolean/i);
assert.match(migrationSource, /purchase_rebound boolean/i);
assert.match(migrationSource, /credit_balance_changed boolean/i);
assert.match(migrationSource, /credit_balance_changed := false/);
assert.match(migrationSource, /new_job_created := false/);
assert.match(migrationSource, /new_purchase_created := false/);
assert.match(migrationSource, /status = 'queued'/);
assert.match(migrationSource, /worker_attempt_id = null/);
assert.match(migrationSource, /dead_lettered_at = null/);
assert.match(migrationSource, /grant execute on function public\.governed_requeue_worker_job\(uuid, text\) to service_role/);
assert.match(migrationSource, /revoke all on function public\.governed_requeue_worker_job\(uuid, text\) from anon/);
assert.match(migrationSource, /revoke all on function public\.governed_requeue_worker_job\(uuid, text\) from authenticated/);

assert.match(migrationSource, /v_already_linked := true/);
assert.match(migrationSource, /set job_id = p_job_id,\s*consumed_at = v_now/s);
assert.match(migrationSource, /v_rebound := true/);

assert.match(workerSource, /rpc\('governed_requeue_worker_job'/);
assert.match(workerSource, /purchase_rebound/);
assert.match(workerSource, /purchase_already_linked/);
assert.match(workerSource, /credit_balance_changed: false/);

const terminalIdx = workerSource.indexOf('if (eligibleTerminal)');
const governedIdx = workerSource.indexOf("rpc('governed_requeue_worker_job'");
const legacyIdx = workerSource.indexOf("rpc('requeue_worker_job'");
assert.ok(terminalIdx > 0 && governedIdx > terminalIdx, 'governed RPC must be under eligibleTerminal branch');
assert.ok(legacyIdx > governedIdx, 'legacy requeue_worker_job retained after governed path');

const dashboardSource = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
assert.match(dashboardSource, /requeue_failed_job/);
assert.match(dashboardSource, /runControlledFixQueueAction\('requeue_failed_job'\)/);

const h6 = fs.readFileSync('tests/qa/h6-worker-claim-lease-fencing-smoke.js', 'utf8');
assert.match(h6, /requeue_worker_job/);
assert.match(h6, /restore_failed_worker_entitlement/);

console.log('governed-requeue-worker-job-smoke: PASS');
