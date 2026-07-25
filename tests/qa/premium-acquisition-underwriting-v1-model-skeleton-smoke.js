import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_PROHIBITED_INPUTS,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  buildPremiumAcquisitionUnderwritingV1Model,
  resolvePremiumAcquisitionUnderwritingV1Activation,
  validatePremiumAcquisitionUnderwritingV1Model,
} from "../../api/_lib/premium-acquisition-underwriting-v1-model.js";

const disabled = resolvePremiumAcquisitionUnderwritingV1Activation();
assert.equal(disabled.capabilityFlag, "PREMIUM_ACQUISITION_UNDERWRITING_V1");
assert.equal(disabled.capabilityEnabled, false);
assert.equal(disabled.reportSurfaceVersion, BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION);
assert.equal(disabled.premiumSurfacePinned, false);
assert.equal(disabled.requested, false);
assert.equal(disabled.rendererEligible, false);
assert.equal(disabled.publicationEligible, false);
assert.equal(disabled.status, "disabled_capability");

const disabledEvenWhenPinned = resolvePremiumAcquisitionUnderwritingV1Activation({
  capabilityEnabled: false,
  reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
});
assert.equal(disabledEvenWhenPinned.premiumSurfacePinned, true);
assert.equal(disabledEvenWhenPinned.requested, false);
assert.equal(disabledEvenWhenPinned.rendererEligible, false);

const capabilityWithoutPinnedJob = resolvePremiumAcquisitionUnderwritingV1Activation({
  capabilityEnabled: true,
  reportSurfaceVersion: BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
});
assert.equal(capabilityWithoutPinnedJob.capabilityEnabled, true);
assert.equal(capabilityWithoutPinnedJob.premiumSurfacePinned, false);
assert.equal(capabilityWithoutPinnedJob.requested, false);
assert.equal(capabilityWithoutPinnedJob.status, "surface_version_not_premium");

const dualActivatedButDisconnected = resolvePremiumAcquisitionUnderwritingV1Activation({
  capabilityEnabled: "true",
  reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
});
assert.equal(dualActivatedButDisconnected.capabilityEnabled, true);
assert.equal(dualActivatedButDisconnected.premiumSurfacePinned, true);
assert.equal(dualActivatedButDisconnected.requested, true);
assert.equal(dualActivatedButDisconnected.status, "requested_disconnected");
assert.equal(dualActivatedButDisconnected.rendererEligible, false);
assert.equal(dualActivatedButDisconnected.publicationEligible, false);

for (const ambiguousCapability of ["1", "yes", "on", 1, {}, []]) {
  assert.equal(
    resolvePremiumAcquisitionUnderwritingV1Activation({
      capabilityEnabled: ambiguousCapability,
      reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    }).requested,
    false,
  );
}

const canonicalSourceTruthPackage = {
  schema_version: "canonical_source_truth_test_v1",
  authority: "source_truth",
  accepted: {
    t12: { noi: 945000 },
    rentRoll: { total_units: 120 },
  },
};
const canonicalFinancialIntelligence = {
  contractVersion: "financial_intelligence_test_v1",
  authority: "canonical_financial_intelligence",
  customerSections: {
    debtServiceCoverage: { status: "computed", dscr: 2.01 },
  },
};
const canonicalSourceReconciliation = {
  version: "source_reconciliation_test_v1",
  status: "reconciled",
  source_reconciliation_disclosure: "Synthetic canonical disclosure.",
};
const canonicalReportIdentity = {
  schemaVersion: "canonical_report_identity_test_v1",
  authority: "canonical_report_identity",
  reportTitle: "Underwriting Report",
};
const canonicalDocumentTreatment = {
  modelVersion: "canonical_document_treatment_test_v1",
  status: "accepted",
};

const model = buildPremiumAcquisitionUnderwritingV1Model({
  canonicalSourceTruthPackage,
  canonicalFinancialIntelligence,
  canonicalSourceReconciliation,
  canonicalReportIdentity,
  canonicalDocumentTreatment,
  capabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
});

assert.equal(model.modelVersion, PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION);
assert.equal(model.phase, "disconnected_model_skeleton");
assert.equal(model.validation.ok, true, JSON.stringify(model.validation.issues, null, 2));
assert.equal(model.validation.status, "valid_disconnected_skeleton");
assert.equal(model.integration.connected, false);
assert.equal(model.integration.customerSurfaceEligible, false);
assert.equal(model.integration.rendererInsertionPresent, false);
assert.equal(model.activation.requested, true);
assert.equal(model.activation.rendererEligible, false);
assert.equal(model.customerSurface, null);
assert.deepEqual(model.calculations, []);
assert.equal(model.inputContract.mode, "canonical_receipts_only");
assert.equal(model.inputContract.rawReceiptPayloadsRetained, false);
assert.deepEqual(
  model.inputContract.prohibitedInputs,
  [...PREMIUM_ACQUISITION_UNDERWRITING_V1_PROHIBITED_INPUTS],
);

for (const authorityValue of Object.values(model.authority)) {
  assert.equal(authorityValue, false);
}

assert.deepEqual(Object.keys(model.sections), [...PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS]);
for (const section of Object.values(model.sections)) {
  assert.equal(section.status, "not_connected");
  assert.equal(section.customerVisible, false);
  assert.deepEqual(section.facts, []);
  assert.deepEqual(section.calculations, []);
  assert.deepEqual(section.lineage, []);
  assert.equal(section.collapseReason, "premium_model_skeleton_disconnected");
}

assert.equal(model.inputReceipts.canonicalSourceTruthPackage.present, true);
assert.equal(
  model.inputReceipts.canonicalSourceTruthPackage.schemaVersion,
  "canonical_source_truth_test_v1",
);
assert.equal(model.inputReceipts.canonicalFinancialIntelligence.present, true);
assert.equal(
  model.inputReceipts.canonicalFinancialIntelligence.schemaVersion,
  "financial_intelligence_test_v1",
);
assert.equal(model.inputReceipts.canonicalSourceReconciliation.present, true);
assert.equal(model.inputReceipts.canonicalReportIdentity.present, true);
assert.equal(model.inputReceipts.canonicalDocumentTreatment.present, true);
assert.equal("accepted" in model.inputReceipts.canonicalSourceTruthPackage, false);
assert.equal("customerSections" in model.inputReceipts.canonicalFinancialIntelligence, false);
assert.equal("source_reconciliation_disclosure" in model.inputReceipts.canonicalSourceReconciliation, false);
assert.equal(JSON.stringify(model).includes("945000"), false);
assert.equal(JSON.stringify(model).includes("2.01"), false);
assert.equal(JSON.stringify(model).includes("Synthetic canonical disclosure"), false);

canonicalSourceTruthPackage.accepted.t12.noi = 1;
canonicalFinancialIntelligence.customerSections.debtServiceCoverage.dscr = 0;
assert.equal(JSON.stringify(model).includes("\"noi\":1"), false);
assert.equal(JSON.stringify(model).includes("\"dscr\":0"), false);
assert.equal(Object.isFrozen(model), true);
assert.equal(Object.isFrozen(model.sections), true);
assert.equal(Object.isFrozen(model.sections.operatingPerformance), true);

const missingCanonicalInputs = buildPremiumAcquisitionUnderwritingV1Model({
  capabilityEnabled: true,
  reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
});
assert.equal(missingCanonicalInputs.validation.ok, false);
assert.deepEqual(
  missingCanonicalInputs.validation.issues.map((issue) => issue.code),
  [
    "PREMIUM_CANONICAL_SOURCE_TRUTH_REQUIRED",
    "PREMIUM_CANONICAL_REPORT_IDENTITY_REQUIRED",
  ],
);
assert.equal(missingCanonicalInputs.integration.connected, false);
assert.equal(missingCanonicalInputs.activation.rendererEligible, false);

const tampered = structuredClone(model);
tampered.integration.connected = true;
tampered.authority.deliveryAuthority = true;
tampered.sections.operatingPerformance.status = "required";
tampered.sections.operatingPerformance.customerVisible = true;
tampered.sections.operatingPerformance.facts.push({ value: 945000 });
const tamperedValidation = validatePremiumAcquisitionUnderwritingV1Model(tampered);
assert.equal(tamperedValidation.ok, false);
assert.equal(
  tamperedValidation.issues.some(
    (issue) => issue.code === "PREMIUM_SKELETON_MUST_REMAIN_DISCONNECTED",
  ),
  true,
);
assert.equal(
  tamperedValidation.issues.some(
    (issue) =>
      issue.code === "PREMIUM_SKELETON_AUTHORITY_PROHIBITED" &&
      issue.path === "model.authority.deliveryAuthority",
  ),
  true,
);
assert.equal(
  tamperedValidation.issues.some(
    (issue) =>
      issue.code === "PREMIUM_SECTION_CONNECTED_BEFORE_AUTHORITY" &&
      issue.path === "model.sections.operatingPerformance",
  ),
  true,
);

const moduleSource = fs.readFileSync(
  new URL("../../api/_lib/premium-acquisition-underwriting-v1-model.js", import.meta.url),
  "utf8",
);
for (const forbiddenDependency of [
  "acquisition-memo-v2-customer-surface-model",
  "acquisition-memo-v2-document",
  "admin-run-worker",
  "delivery-gate",
  "final-pdf-publication-quality-boss",
  "generate-client-report",
]) {
  assert.equal(
    moduleSource.includes(`from "./${forbiddenDependency}`),
    false,
    `Disconnected premium model imports ${forbiddenDependency}.`,
  );
}
assert.equal(
  moduleSource.includes(`process.env.${PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG}`),
  false,
);

console.log("Premium Acquisition Underwriting V1 disconnected model skeleton smoke PASS");
