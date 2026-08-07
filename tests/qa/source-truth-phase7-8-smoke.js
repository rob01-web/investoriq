import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildConstitutionalDeliveryGateDecision } from "../../api/_lib/delivery-gate-constitution.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";
import {
  TERMINAL_FAILURE_CODES,
  classifyTerminalFailureCode,
} from "../../lib/terminal-failure-taxonomy.js";
import { classifyFailure } from "../../src/lib/jobFailureMessaging.js";

const sourceTruthPackage = buildCanonicalSourceTruthPackage({
  artifacts: [
    {
      id: "phase7-t12",
      type: "t12_parsed",
      payload: {
        file_id: "phase7-t12-file",
        effective_gross_income: 1000000,
        total_operating_expenses: 400000,
        net_operating_income: 600000,
        core_t12_validation: { ok: true, failures: [] },
      },
    },
    {
      id: "phase7-rent-roll",
      type: "rent_roll_parsed",
      payload: {
        file_id: "phase7-rent-roll-file",
        total_units: 2,
        occupancy: 1,
        units: [
          { unit: "1", status: "Occupied", in_place_rent: 2000 },
          { unit: "2", status: "Occupied", in_place_rent: 2000 },
        ],
      },
    },
  ],
});
assert.equal(sourceTruthPackage.core_publishable, true);

const deliverable = buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage,
  pipelineCompliancePassed: true,
  htmlSafetyValidationPassed: true,
  rendererCompleted: true,
  customerBlockers: [],
});
assert.equal(deliverable.delivery_gate_status, "deliverable");
assert.equal(deliverable.report_publishable, true);
assert.equal(deliverable.final_delivery_authority, "constitutional_delivery_gate");

for (const [field, value] of [
  ["pipelineCompliancePassed", false],
  ["htmlSafetyValidationPassed", false],
  ["rendererCompleted", false],
]) {
  const blocked = buildConstitutionalDeliveryGateDecision({
    sourceTruthPackage,
    pipelineCompliancePassed: true,
    htmlSafetyValidationPassed: true,
    rendererCompleted: true,
    customerBlockers: [],
    [field]: value,
  });
  assert.equal(blocked.report_publishable, true, `${field} must preserve publish-required authority`);
  assert.equal(blocked.report_authority_status, "publish_required");
  assert.equal(blocked.representation_required, true);
}
const customerBlocked = buildConstitutionalDeliveryGateDecision({
  sourceTruthPackage,
  pipelineCompliancePassed: true,
  htmlSafetyValidationPassed: true,
  rendererCompleted: true,
  customerBlockers: ["HARD_PUBLIC_LANGUAGE_CONTRACT"],
});
assert.equal(customerBlocked.report_publishable, false);

for (const code of Object.values(TERMINAL_FAILURE_CODES)) {
  const classification = classifyTerminalFailureCode(code);
  const isDocumentFailure = code.startsWith("CORE_");
  assert.equal(classification.customer_document_replacement_required, isDocumentFailure);
  const customerClassification = classifyFailure({ error_code: code });
  assert.equal(
    customerClassification.kind === "system_failure",
    !isDocumentFailure,
    `${code} terminal customer classification mismatch`
  );
}

console.log("source-truth Phase 7 and 8 smoke PASS");

const generatorSource = readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const workerSource = readFileSync("api/admin-run-worker.js", "utf8");
assert.match(generatorSource, /buildConstitutionalDeliveryGateDecision\(\{/);
assert.match(generatorSource, /sourceTruthPackage:\s*sourceTruthPackageResult/);
assert.match(generatorSource, /pipelineCompliancePassed:/);
assert.match(generatorSource, /htmlSafetyValidationPassed:/);
assert.match(generatorSource, /rendererCompleted:/);
assert.match(generatorSource, /SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED/);
assert.match(generatorSource, /PDF_ARTIFACT_FAILED/);
assert.match(generatorSource, /STORAGE_PUBLICATION_FAILED/);
assert.match(workerSource, /generatorErrorCode = String\(failureBody\?\.error_code \|\| generatorErrorCode\)/);
assert.match(workerSource, /generatorErrorCode = 'PDF_ARTIFACT_FAILED'/);
assert.match(workerSource, /generatorErrorCode = 'STORAGE_PUBLICATION_FAILED'/);
assert.match(workerSource, /errorCode: generatorErrorCode/);
