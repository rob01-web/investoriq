import assert from "node:assert/strict";
import fs from "fs";

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");

assert.match(
  workerSource,
  /if \(deliveryGateStatus === 'admin_review_required' \|\| deliveryGateStatus === 'user_needs_documents'\)\s*\{[\s\S]{0,240}reportId = reportData\?\.reportId \|\| null;[\s\S]{0,240}storagePath = reportData\?\.storagePath \|\| null;[\s\S]{0,240}\} else if \(!reportData\?\.reportId\)\s*\{[\s\S]{0,160}generatorError = `Report generation failed/
);

assert.equal(
  /deliveryGateStatus === 'user_needs_documents'[\s\S]{0,320}error_code:\s*'REPORT_GENERATION_FAILED'/.test(workerSource),
  false
);

assert.equal(
  /deliveryGateStatus === 'admin_review_required'[\s\S]{0,320}error_code:\s*'REPORT_GENERATION_FAILED'/.test(workerSource),
  false
);

const typedGateAnchor = workerSource.indexOf("const isTypedGateOutcome");
assert.notEqual(typedGateAnchor, -1);
const reportEventAnchor = workerSource.indexOf("const reportEventErr", typedGateAnchor);
assert.notEqual(reportEventAnchor, -1);
const typedGateWindow = workerSource.slice(typedGateAnchor, reportEventAnchor);
assert.match(typedGateWindow, /deliveryGateStatus === 'user_needs_documents'/);
assert.match(typedGateWindow, /from_status:\s*'rendering'/);
assert.match(typedGateWindow, /to_status:\s*'failed'/);
assert.match(typedGateWindow, /error_code\s*=\s*'MISSING_REQUIRED_SOURCE_DATA'/);
assert.equal(/status:\s*'needs_documents'/.test(typedGateWindow), false);
assert.match(typedGateWindow, /failedJobIds\.push\(job\.id\)/);
assert.match(typedGateWindow, /deliveryGateStatus === 'admin_review_required'/);
assert.match(typedGateWindow, /to_status:\s*'publishing'/);
assert.match(typedGateWindow, /'delivery_gate_decision'/);
assert.equal(/to_status:\s*'pdf_generating'/.test(typedGateWindow), false);
assert.equal(/deliveryGateStatus === 'user_needs_documents'[\s\S]{0,320}to_status:\s*'needs_documents'/.test(workerSource), false);
assert.equal(/deliveryGateStatus === 'admin_review_required'[\s\S]{0,320}to_status:\s*'publishing'/.test(workerSource.slice(reportEventAnchor)), false);
assert.match(workerSource, /if \(!reportId \|\| !storagePath\)\s*\{/);
assert.match(workerSource, /missing for deliverable path/);
assert.match(workerSource, /error_code:\s*'REPORT_GENERATION_FAILED'/);
assert.equal(/upload replacement documents|upload more documents|resume/i.test(workerSource), false);
assert.equal(/status:\s*'needs_documents'/.test(workerSource), false);

console.log("admin-run-worker-gate smoke PASS");
