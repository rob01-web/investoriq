import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(qaDir, '../..');

// Canonical launch suite only. Historical RETEST reproductions, Acquisition-named
// diagnostic suites, institutional/IC experiments, and future Premium suites are
// intentionally excluded from launch authority.
const launchCriticalSuite = [
  ['architecture authority', 'launch-critical-architecture-smoke.js'],
  ['customer trust boundary', 'p0-a2-customer-boundary-smoke.js'],
  ['authenticated identity', 'h1-authenticated-identity-boundary-smoke.js'],
  ['immutable staged source registration', 'h5-staged-source-registration-guard-smoke.js'],
  ['current disclosure enforcement', 'legal-disclosure-authority-smoke.js'],
  ['exact worker claim', 'exact-job-worker-claim-smoke.js'],
  ['retry/dead-letter boundary', 'dead-letter-status-constraint-smoke.js'],
  ['governed requeue boundary', 'governed-requeue-worker-job-smoke.js'],
  ['canonical source authority', 'source-authority-smoke.js'],
  ['canonical source survivor matrix', 'source-truth-constitutional-matrix-smoke.js'],
  ['Screening construction', 'screening-report-sealed-lane-authority-smoke.js'],
  ['Full Underwriting construction', 'full-underwriting-gates-full-render-smoke.js'],
  ['canonical delivery decision', 'delivery-decision-state-smoke.js'],
  ['single publication authority', 'report-publication-authority-boundary-smoke.js'],
  ['publication recovery/idempotency', 'core-publication-recovery-smoke.js'],
  ['mandatory Quality Manifest', 'report-quality-manifest-smoke.js'],
  ['atomic entitlement restoration', 'h8-entitlement-restoration-event-smoke.js'],
  ['governed admin worker boundary', 'admin-run-worker-gate-smoke.js'],
  ['source spreadsheet math and publication continuity', 'publication-math-continuity-smoke.js'],
  ['customer dispatch runtime', 'customer-route-dispatch-runtime-smoke.js'],
  ['core admission contract', 'phase1-admission-core-mode-contract-smoke.js'],
  ['checkout runtime', 'phase4-checkout-runtime-smoke.js'],
  ['webhook entitlement runtime', 'phase4-webhook-runtime-smoke.js'],
  ['checkout status runtime', 'phase4-checkout-status-runtime-smoke.js'],
  ['commerce authority', 'phase4-commerce-stripe-entitlement-contract-smoke.js'],
  ['customer data hygiene', 'phase5-security-data-hygiene-contract-smoke.js'],
  ['artifact compensation runtime', 'phase2-artifact-compensation-regression.js'],
  ['atomic publication delivery', 'phase2-atomic-publication-delivery-contract-smoke.js'],
  ['customer boundary runtime', 'phase5-customer-boundary-runtime-smoke.js'],
  ['worker and renderer recovery', 'phase3-worker-render-recovery-contract-smoke.js'],
  ['bounded PDF provider request', 'docraptor-request-timeout-smoke.js'],
  ['Vercel function budget', 'vercel-function-budget-smoke.js'],
];

const failures = [];
const startedAt = Date.now();

for (const [label, filename] of launchCriticalSuite) {
  const testPath = path.join(qaDir, filename);
  if (!fs.existsSync(testPath)) {
    failures.push({ label, filename, status: 'missing' });
    console.error(`FAIL ${label}: missing ${filename}`);
    continue;
  }

  process.stdout.write(`\n[launch-qa] ${label} -> ${filename}\n`);
  const result = spawnSync(process.execPath, [testPath], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120_000,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    failures.push({
      label,
      filename,
      status: result.signal ? `signal:${result.signal}` : `exit:${result.status}`,
    });
    console.error(`FAIL ${label}`);
  } else {
    console.log(`PASS ${label}`);
  }
}

const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\n[launch-qa] completed ${launchCriticalSuite.length} checks in ${durationSeconds}s`);

if (failures.length > 0) {
  console.error(`[launch-qa] FAIL ${failures.length}/${launchCriticalSuite.length}`);
  for (const failure of failures) {
    console.error(` - ${failure.label}: ${failure.filename} (${failure.status})`);
  }
  process.exitCode = 1;
} else {
  console.log(`[launch-qa] PASS ${launchCriticalSuite.length}/${launchCriticalSuite.length}`);
}
