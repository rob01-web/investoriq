import assert from 'node:assert/strict';
import fs from 'node:fs';

const workerPath = 'api/admin-run-worker.js';
const workerSource = fs.readFileSync(workerPath, 'utf8');

assert.match(workerSource, /'process_exact_queued_job'/);
assert.match(workerSource, /controlledActions = new Set\([\s\S]*'process_exact_queued_job'/);

const exactIdx = workerSource.indexOf("controlledAction === 'process_exact_queued_job'");
assert.ok(exactIdx > 0, 'exact action branch must exist');

const exactSlice = workerSource.slice(exactIdx, exactIdx + 4500);
assert.match(exactSlice, /rpc\('claim_worker_job'/);
assert.match(exactSlice, /p_job_id:\s*controlJob\.id/);
assert.match(exactSlice, /p_claimed_by:\s*workerInvocationId/);
assert.match(exactSlice, /currentStatus !== 'queued'/);
assert.match(exactSlice, /hasActiveLease/);
assert.match(exactSlice, /status\(409\)/);
assert.match(exactSlice, /exactJobMode = true/);
assert.equal(/claim_next_worker_job/.test(exactSlice), false, 'exact branch must not call claim_next_worker_job');
assert.equal(/claim_next_job/.test(exactSlice), false, 'exact branch must not call claim_next_job');
assert.equal(/\.eq\('status',\s*'queued'\)[\s\S]*\.order\('created_at'/.test(exactSlice), false, 'exact branch must not scan queued candidates');

// Fail-closed: claim failure returns before queue path; exact mode skips queue scan
assert.match(workerSource, /Exact-job mode never scans the queue/);
assert.match(workerSource, /exactJobMode\s*\?\s*\{\s*data:\s*\[\],\s*error:\s*null\s*\}/);

// Normal worker path retained
const normalClaimIdx = workerSource.indexOf("rpc('claim_worker_job', { p_job_id: job.id");
assert.ok(normalClaimIdx > exactIdx, 'normal queue claim path retained after exact branch');
assert.match(workerSource, /\.eq\('status',\s*'queued'\)\s*\n\s*\.order\('created_at',\s*\{\s*ascending:\s*true\s*\}\)/);

// No RETEST UUID hard-coding
assert.equal(/084a982e-ff6e-49b0-a7f7-473ed314aada/i.test(workerSource), false);

// Controlled auth boundary shared (same controlledActions gate)
assert.match(workerSource, /if \(!controlledActions\.has\(controlledAction\)\)/);
assert.match(workerSource, /if \(!controlledJobId\)/);

console.log('exact-job-worker-claim-smoke: PASS');
