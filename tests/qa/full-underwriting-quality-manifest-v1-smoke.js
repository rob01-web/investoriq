import assert from "node:assert/strict";
import {
  buildFullUnderwritingQualityManifestV1,
  FULL_UNDERWRITING_QUALITY_MANIFEST_V1_CONTRACT,
  validateFullUnderwritingQualityManifestV1,
} from "../../api/_lib/full-underwriting-quality-manifest-v1.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  core_publishable: true,
  core: {
    t12: { accepted_facts: { net_operating_income: 684000 } },
    rent_roll: { accepted_facts: { total_units: 80, occupancy: 0.95 } },
  },
  core_input_sufficiency_state: {
    evidence: { core_source_mode: "dual_source_core" },
  },
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    source_reconciliation_disclosure: "Accepted operating sources require reconciliation disclosure.",
  },
  support: {
    accepted: [
      {
        file_id: "support-1",
        canonical_role: "purchase_assumptions",
        section_eligibility: { acquisition_request_context: true },
      },
      {
        file_id: "support-2",
        canonical_role: "appraisal_context",
        section_eligibility: { appraisal_context: true },
      },
    ],
    advisory: [
      { file_id: "support-3", status: "ambiguous" },
    ],
    rejected: [],
  },
  disclosures: [{ code: "SOURCE_RECONCILIATION_DISCLOSURE", text: "Reconciliation disclosure." }],
};

const customerSurfaceModel = {
  identity: {
    propertyName: "Manifest Test Property",
    reportTitle: "Underwriting Report",
  },
  qualityManifest: {
    sectionDispositionEntries: [
      { sectionKey: "operatingStatementTTMSummary", finalDisposition: "include" },
      { sectionKey: "debtCapacityAndCoverage", finalDisposition: "compact" },
      { sectionKey: "marketSurveyContext", finalDisposition: "omit" },
      { sectionKey: "currentDebtContext", finalDisposition: "include_qualified" },
    ],
  },
  financialTruth: {
    breakEvenOccupancy: { result: 0.38, displayReady: true },
  },
};

const contract = buildFullUnderwritingQualityManifestV1({
  sourceTruthPackage,
  customerSurfaceModel,
  financialIntelligence: {
    receiptVersion: 1,
    calculationReceipts: [{ calculationKey: "proposedDebtYield", eligible: true }],
  },
  scenarioEngine: { source: "full_underwriting_scenario_engine_v1" },
  reportMeta: {
    generatedAt: "2026-08-20T12:00:00.000Z",
  },
  reportIdentity: {
    fullTitle: "InvestorIQ Underwriting Report",
  },
  replacementCoverage: {
    debtCapacityAndCoverage: true,
  },
});

assert.equal(FULL_UNDERWRITING_QUALITY_MANIFEST_V1_CONTRACT.authorityCreating, false);
assert.equal(FULL_UNDERWRITING_QUALITY_MANIFEST_V1_CONTRACT.downstreamConsumeOnly, true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(validateFullUnderwritingQualityManifestV1(contract).ok, true);
assert.equal(contract.report.productIdentity, "InvestorIQ Underwriting Report");
assert.equal(contract.report.propertyName, "Manifest Test Property");
assert.equal(contract.evidenceBasis.sourceMode.code, "dual_source_core");
assert.equal(contract.evidenceBasis.sourceMode.label, "T12 + Rent Roll");
assert.equal(contract.coreEvidence.length, 2);
assert.equal(contract.supportEvidence.acceptedCount, 2);
assert.equal(contract.supportEvidence.usedCount, 2);
assert.equal(contract.supportEvidence.excludedCount, 1);
assert.deepEqual([...contract.supportEvidence.usedRoleLabels].sort(), [
  "Appraisal / valuation support",
  "Transaction / proposed financing support",
]);
assert.equal(contract.evidenceBasis.coreReconciliation.label, "Reconciliation disclosure presented");
assert.equal(contract.sectionCoverage.included, 1);
assert.equal(contract.sectionCoverage.qualified, 1);
assert.equal(contract.sectionCoverage.compact, 1);
assert.equal(contract.sectionCoverage.omitted, 1);
assert.deepEqual([...contract.sectionCoverage.reducedOrOmittedSections].sort(), [
  "Market Rent Survey Context",
]);
assert.deepEqual([...contract.sectionCoverage.replacementSections], [
  "Debt Capacity & Coverage",
]);
assert.equal(contract.scenarios.included, true);
assert.equal(contract.calculations.frameworkVersion, 1);
assert.equal(contract.certification.publicationReceiptState, "recorded_with_publication_record");
assert.equal(contract.authority.changesSourceTruth, false);
assert.equal(contract.authority.changesDeliveryAuthority, false);
assert.equal(contract.authority.changesPublicationAuthority, false);

console.log("full-underwriting-quality-manifest-v1-smoke: PASS");
