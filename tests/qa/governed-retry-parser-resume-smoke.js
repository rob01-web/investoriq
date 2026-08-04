import assert from 'node:assert/strict';
import fs from 'node:fs';

const workerPath = 'api/admin-run-worker.js';
const workerSource = fs.readFileSync(workerPath, 'utf8');

// 1) Governed-retry signal is authoritative worker_admin_requeued
assert.match(workerSource, /hasWorkerEvent\(job\.id,\s*'worker_admin_requeued'\)/);
assert.match(workerSource, /const isGovernedRetry = Boolean\(governedRetryCheck\.exists\)/);

// 2) Core reparable helper: pending/extracted always; failed only when governed retry
assert.match(workerSource, /const isCoreReparableStatus = \(parseStatus\) =>/);
const helperIdx = workerSource.indexOf('const isCoreReparableStatus = (parseStatus) =>');
assert.ok(helperIdx > 0);
const helperSlice = workerSource.slice(helperIdx, helperIdx + 450);
assert.match(helperSlice, /ps === 'pending' \|\| ps === 'extracted'/);
assert.match(helperSlice, /isGovernedRetry && ps === 'failed'/);

// 3) First-run path still treats pending/extracted as reparable (helper used in precheck)
assert.match(workerSource, /hasPendingStructuredPrecheck[\s\S]{0,200}isCoreReparableStatus/);

// 4) anyPending and core filters use isCoreReparableStatus (failed only when governed)
const anyIdx = workerSource.indexOf('const anyPending = relevantFiles.some');
assert.ok(anyIdx > 0, 'anyPending block must exist');
const anySlice = workerSource.slice(anyIdx, anyIdx + 900);
assert.match(anySlice, /isCoreReparableStatus\(file\.parse_status\)/);
assert.match(anySlice, /hasPendingRentRoll[\s\S]{0,250}isCoreReparableStatus/);
assert.match(anySlice, /hasPendingT12[\s\S]{0,250}isCoreReparableStatus/);

// 5) Stale failed status is cleared to pending before redispatch (supersession path)
assert.match(
  workerSource,
  /parse_status \|\| ''\)\.toLowerCase\(\) === 'failed'[\s\S]{0,220}parse_status:\s*'pending'/
);

// 6) Non-governed: failed is not reparable (isGovernedRetry gate on failed only)
assert.match(helperSlice, /if \(isGovernedRetry && ps === 'failed'\) return true/);

// 7) Fail-closed terminal path retained
assert.match(workerSource, /MISSING_STRUCTURED_FINANCIAL_ARTIFACTS/);
assert.match(workerSource, /applyTerminalFailureOutcome/);

// 8) No automatic retry loop introduced
assert.equal(/setInterval\s*\(/.test(workerSource.slice(helperIdx, helperIdx + 8000)), false);
assert.equal(/governed_requeue_worker_job[\s\S]{0,80}setTimeout/.test(workerSource), false);

// 9) No RETEST UUID hard-coding / no purchase mutation in resume helper region
assert.equal(/084a982e-ff6e-49b0-a7f7-473ed314aada/i.test(workerSource), false);
const resumeRegion = workerSource.slice(helperIdx, helperIdx + 3500);
assert.equal(/report_purchases/.test(resumeRegion), false);
assert.equal(/credit_balance/.test(resumeRegion), false);

// 10) Exact-job isolation retained
assert.match(workerSource, /'process_exact_queued_job'/);
assert.match(workerSource, /exactJobMode\s*=\s*true/);

// 11) Workflow schedule paused; workflow_dispatch preserved
const workflow = fs.readFileSync('.github/workflows/worker-kick.yml', 'utf8');
assert.match(workflow, /workflow_dispatch/);
assert.match(workflow, /#\s*schedule:/);
assert.equal(/^\s*schedule:\s*$/m.test(workflow), false);
assert.equal(/^\s*-\s*cron:\s*"\*\/5/m.test(workflow), false);
assert.match(workflow, /admin-run-worker/);
assert.match(workflow, /run-eligible-jobs-once/);

console.log('governed-retry-parser-resume-smoke: PASS');
