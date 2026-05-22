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
const helperDefMatches = workerSource.match(/const restoreEntitlementForFailedJob = async/g) || [];
assert.equal(helperDefMatches.length, 1);
const inlineRestoreSqlMatches = workerSource.match(/update\(\{ consumed_at: null, job_id: null \}\)/g) || [];
assert.equal(inlineRestoreSqlMatches.length, 1);
const helperCallMatches = workerSource.match(/await restoreEntitlementForFailedJob\(/g) || [];
assert.ok(helperCallMatches.length >= 1);
const recordFailureAnchor = workerSource.indexOf("const recordJobFailure = async");
assert.notEqual(recordFailureAnchor, -1);
const hasCreditAnchor = workerSource.indexOf("const hasCreditConsumed", recordFailureAnchor);
assert.notEqual(hasCreditAnchor, -1);
const recordFailureWindow = workerSource.slice(recordFailureAnchor, hasCreditAnchor);
assert.match(recordFailureWindow, /await restoreEntitlementForFailedJob\(/);
assert.equal(/update\(\{ consumed_at: null, job_id: null \}\)/.test(recordFailureWindow), false);
assert.match(typedGateWindow, /deliveryGateStatus === 'user_needs_documents'/);
assert.match(typedGateWindow, /from_status:\s*'rendering'/);
assert.match(typedGateWindow, /to_status:\s*'failed'/);
assert.match(typedGateWindow, /error_code\s*=\s*'MISSING_REQUIRED_SOURCE_DATA'/);
assert.equal(/status:\s*'needs_documents'/.test(typedGateWindow), false);
assert.match(typedGateWindow, /failedJobIds\.push\(job\.id\)/);
assert.match(typedGateWindow, /deliveryGateStatus === 'admin_review_required'/);
assert.match(typedGateWindow, /to_status:\s*'publishing'/);
assert.match(typedGateWindow, /'delivery_gate_decision'/);
assert.equal(
  /deliveryGateStatus === 'admin_review_required'[\s\S]{0,600}await restoreEntitlementForFailedJob\(/.test(
    typedGateWindow
  ),
  false
);
assert.equal(/to_status:\s*'pdf_generating'/.test(typedGateWindow), false);
assert.equal(/deliveryGateStatus === 'user_needs_documents'[\s\S]{0,320}to_status:\s*'needs_documents'/.test(workerSource), false);
assert.equal(/deliveryGateStatus === 'admin_review_required'[\s\S]{0,320}to_status:\s*'publishing'/.test(workerSource.slice(reportEventAnchor)), false);
assert.match(workerSource, /if \(!reportId \|\| !storagePath\)\s*\{/);
assert.match(workerSource, /missing for deliverable path/);
assert.match(workerSource, /error_code:\s*'REPORT_GENERATION_FAILED'/);
const publishedAnchor = workerSource.indexOf("const completeUpdate = { status: 'published' }");
assert.notEqual(publishedAnchor, -1);
const publishedWindow = workerSource.slice(publishedAnchor);
assert.equal(/await restoreEntitlementForFailedJob\(/.test(publishedWindow), false);
const forbiddenWorkerCopy = [
  "upload replacement " + "documents",
  "upload more " + "documents",
  "re" + "sume",
];
assert.equal(
  forbiddenWorkerCopy.some((phrase) => new RegExp(phrase, "i").test(workerSource)),
  false
);
assert.equal(/status:\s*'needs_documents'/.test(workerSource), false);
assert.equal(/missing:\s*\[\s*'rent_roll'\s*,\s*'t12_or_operating_statement'\s*\]/.test(workerSource), false);
assert.match(workerSource, /const missingStructuredArtifacts = \[\];/);
assert.match(workerSource, /if \(!hasRentRollParsed\) missingStructuredArtifacts\.push\('rent_roll'\);/);
assert.match(workerSource, /if \(!hasT12Parsed\) missingStructuredArtifacts\.push\('t12_or_operating_statement'\);/);
assert.match(workerSource, /missing:\s*missingStructuredArtifacts/);
assert.match(
  workerSource,
  /if \(!rentRollRes\.ok\)[\s\S]{0,260}parse_status:\s*'failed'[\s\S]{0,220}parse_error:\s*'rent_roll_parse_request_failed'/
);
assert.match(
  workerSource,
  /if \(!t12Res\.ok\)[\s\S]{0,260}parse_status:\s*'failed'[\s\S]{0,220}parse_error:\s*'t12_parse_request_failed'/
);
assert.match(
  workerSource,
  /'structured_doc_parse_dispatch_failed'[\s\S]{0,220}doc_type:\s*'rent_roll'/
);
assert.match(
  workerSource,
  /'structured_doc_parse_dispatch_failed'[\s\S]{0,220}doc_type:\s*'t12'/
);
assert.equal(/x-cron-secret/.test(workerSource), true);

console.log("admin-run-worker-gate smoke PASS");
