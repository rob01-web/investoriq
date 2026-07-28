import assert from "node:assert/strict";
import {
  TERMINAL_FAILURE_CODES,
} from "../../lib/terminal-failure-taxonomy.js";
import {
  TERMINAL_FAILURE_TIER_MAP,
  describeTerminalFailureTier,
} from "../../api/_lib/terminal-failure-tier-map.js";

const expectedCodes = Object.values(TERMINAL_FAILURE_CODES);
assert.deepEqual(Object.keys(TERMINAL_FAILURE_TIER_MAP).sort(), expectedCodes.sort());

const t12 = describeTerminalFailureTier(TERMINAL_FAILURE_CODES.CORE_T12_CATASTROPHICALLY_UNUSABLE);
assert.equal(t12.tier, 1);
assert.deepEqual(t12.affected_sections, ["t12", "source_truth_package", "customer_delivery"]);
assert.equal(t12.customer_message_category, "customer_document_replacement_required");

const reportContract = describeTerminalFailureTier(TERMINAL_FAILURE_CODES.REPORT_CONTRACT_FAILED);
assert.equal(reportContract.tier, 2);
assert.deepEqual(reportContract.affected_sections, ["report_contract", "customer_surface", "qa"]);
assert.equal(reportContract.customer_message_category, "publish_with_limitation");

const pdfArtifact = describeTerminalFailureTier(TERMINAL_FAILURE_CODES.PDF_ARTIFACT_FAILED);
assert.equal(pdfArtifact.tier, 3);
assert.ok(pdfArtifact.affected_sections.includes("pdf_artifact"));
assert.equal(pdfArtifact.customer_message_category, "publication_recovery_required");

assert.equal(describeTerminalFailureTier("not-a-real-code"), null);

console.log("h0-75 failure tier map smoke PASS");
