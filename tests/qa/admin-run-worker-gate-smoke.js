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

console.log("admin-run-worker-gate smoke PASS");
