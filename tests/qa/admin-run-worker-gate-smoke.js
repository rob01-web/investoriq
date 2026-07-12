import assert from "node:assert/strict";
import fs from "node:fs";

import { classifyTerminalFailureCode } from "../../lib/terminal-failure-taxonomy.js";
import { buildCustomerFailureMessage } from "../../src/lib/jobFailureMessaging.js";

const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const resolverStart = workerSource.indexOf("const resolveWorkerDeliveryDecision");
const resolverEnd = workerSource.indexOf("const resolveHeldDeliveryTerminalCode", resolverStart);
assert.notEqual(resolverStart, -1);
assert.notEqual(resolverEnd, -1);
const resolverSource = workerSource.slice(resolverStart, resolverEnd);

assert.match(resolverSource, /deliveryDecisionState\?\.source === 'canonical_delivery_decision'/);
assert.match(resolverSource, /const coreValidRequiredCoverage = hasCanonical[\s\S]*?: false;/);
assert.match(resolverSource, /const rawDeliveryGateStatus = hasCanonical[\s\S]*?: 'blocked';/);
assert.match(resolverSource, /const holdDelivery = hasCanonical[\s\S]*?: true;/);
assert.match(
  resolverSource,
  /const customerDeliveryAllowed =[\s\S]*?hasCanonical &&[\s\S]*?coreValidRequiredCoverage &&[\s\S]*?deliveryGateStatus === 'deliverable' &&[\s\S]*?!holdDelivery &&[\s\S]*?customer_delivery_allowed === true &&[\s\S]*?customerBlockers\.length === 0;/
);
const customerAuthorityStart = resolverSource.indexOf("const customerDeliveryAllowed");
const customerAuthorityEnd = resolverSource.indexOf("const customerStatusReasonCode", customerAuthorityStart);
const customerAuthoritySource = resolverSource.slice(customerAuthorityStart, customerAuthorityEnd);
assert.equal(/reportData\?\.customer_publish_eligible/.test(customerAuthoritySource), false);
assert.equal(/reportData\?\.customer_delivery_ready/.test(customerAuthoritySource), false);
assert.equal(/reportData\?\.holdDelivery/.test(resolverSource), true);
assert.match(resolverSource, /legacyAliasConflicts/);

assert.match(
  workerSource,
  /const shouldHoldDeliveryOutcome =[\s\S]*?isTypedGateOutcome \|\| isResolvedHoldBlockedOutcome;/
);
assert.match(workerSource, /if \(shouldHoldDeliveryOutcome\) \{/);
assert.match(workerSource, /const terminalErrorCode = resolveHeldDeliveryTerminalCode\(resolvedDeliveryDecision\);/);
assert.match(workerSource, /coreValidRequiredCoverage === true[\s\S]*?return 'REPORT_CONTRACT_FAILED'/);
assert.match(workerSource, /return 'CORE_T12_CATASTROPHICALLY_UNUSABLE'/);
assert.match(workerSource, /return 'CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE'/);
assert.match(workerSource, /return 'CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY'/);
assert.match(workerSource, /errorCode: terminalErrorCode/);
assert.match(workerSource, /generatorErrorCode = 'PDF_ARTIFACT_FAILED'/);
assert.match(workerSource, /generatorErrorCode = 'STORAGE_PUBLICATION_FAILED'/);
assert.match(workerSource, /error_code: generatorErrorCode/);
const heldOutcomeStart = workerSource.indexOf("if (shouldHoldDeliveryOutcome)", resolverEnd);
const heldOutcomeEnd = workerSource.indexOf("if (!reportId || !storagePath)", heldOutcomeStart);
const heldOutcomeSource = workerSource.slice(heldOutcomeStart, heldOutcomeEnd);
assert.equal(/errorCode:\s*'MISSING_REQUIRED_SOURCE_DATA'/.test(heldOutcomeSource), false);

for (const code of [
  'SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED',
  'REPORT_RENDER_FAILED',
  'REPORT_CONTRACT_FAILED',
  'PDF_ARTIFACT_FAILED',
  'STORAGE_PUBLICATION_FAILED',
]) {
  const classification = classifyTerminalFailureCode(code);
  assert.equal(classification.customer_document_replacement_required, false);
  const copy = buildCustomerFailureMessage({ error_code: code });
  assert.equal(/replace|clearer|rent roll|operating statement|source package could not/i.test(JSON.stringify(copy)), false);
}

for (const code of [
  'CORE_T12_CATASTROPHICALLY_UNUSABLE',
  'CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE',
  'CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY',
]) {
  assert.equal(classifyTerminalFailureCode(code).customer_document_replacement_required, true);
}

assert.match(workerSource, /if \(!reportId \|\| !storagePath\)\s*\{/);
assert.match(workerSource, /errorCode: 'PDF_ARTIFACT_FAILED'/);
assert.equal(/status:\s*'needs_documents'/.test(workerSource), false);

console.log("admin-run-worker-gate smoke PASS");
