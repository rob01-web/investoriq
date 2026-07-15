import assert from "node:assert/strict";

import { buildAcquisitionMemoBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { buildConstitutionalDeliveryGateDecision } from "../../api/_lib/delivery-gate-constitution.js";
import { runScreeningReportPipeline } from "../../api/_lib/screening-report-pipeline.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";
import { classifyTerminalFailureCode } from "../../lib/terminal-failure-taxonomy.js";
import { buildCustomerFailureMessage } from "../../src/lib/jobFailureMessaging.js";

const baseT12 = {
  file_id: "matrix-t12-file",
  original_filename: "Matrix_T12.xlsx",
  effective_gross_income: 1000000,
  total_operating_expenses: 400000,
  net_operating_income: 600000,
  gross_potential_rent: 1050000,
  income_lines: [{ label: "Rental income", amount: 1000000 }],
  expense_lines: [{ label: "Operating expenses", amount: 400000 }],
  core_t12_validation: { ok: true, failures: [] },
};
const baseRentRoll = {
  file_id: "matrix-rent-roll-file",
  original_filename: "Matrix_Rent_Roll.xlsx",
  total_units: 2,
  occupancy: 0.5,
  annual_in_place_rent: 48000,
  annual_market_rent: 52800,
  units: [
    { unit: "1", status: "Occupied", in_place_rent: 2000, market_rent: 2200 },
    { unit: "2", status: "Vacant", in_place_rent: 0, market_rent: 2200 },
  ],
  unit_mix: [{ unit_type: "1BR", count: 2, current_rent: 1000, market_rent: 2200 }],
};

function coreArtifacts({ t12 = baseT12, rentRoll = baseRentRoll, support = [] } = {}) {
  return [
    { id: "matrix-t12", type: "t12_parsed", payload: structuredClone(t12) },
    { id: "matrix-rent-roll", type: "rent_roll_parsed", payload: structuredClone(rentRoll) },
    ...support,
  ];
}

function assertPublishableInBothLanes(name, sourceTruthPackage) {
  assert.equal(sourceTruthPackage.core_publishable, true, `${name} source truth must publish`);
  const gate = buildConstitutionalDeliveryGateDecision({
    sourceTruthPackage,
    pipelineCompliancePassed: true,
    htmlSafetyValidationPassed: true,
    rendererCompleted: true,
    customerBlockers: [],
  });
  assert.equal(gate.report_publishable, true, `${name} constitutional gate must publish`);

  const screening = runScreeningReportPipeline({
    finalHtml: `<html><body>${name}</body></html>`,
    sourceTruthPackage,
    sourceTruthRequired: true,
    deliveryGateDecisionResult: gate,
    deterministicContractQaSeal: {
      source: "deterministic_report_contract_qa",
      ok: true,
      status: "sealed",
      issues: [],
    },
  });
  assert.equal(screening.sealedLane, "screening_lane");

  const acquisitionContract = buildAcquisitionMemoBossContract({
    canonicalSourcePackage: { supportDocs: new Map() },
    sourceTruthPackage,
    acquisitionMemoProjection: { supportDocProjection: {}, financingReadinessSignals: {} },
    coreMetrics: {},
    propertyProfile: { propertyName: name },
    reportMeta: { reportMode: "v1_core" },
    reportMode: "v1_core",
  });
  assert.equal(acquisitionContract.coreGate.publishAllowed, true, `${name} Acquisition Memo must publish`);
}

const missingGpr = structuredClone(baseT12);
delete missingGpr.gross_potential_rent;
const missingLineDetail = structuredClone(baseT12);
delete missingLineDetail.income_lines;
delete missingLineDetail.expense_lines;
const missingMarketRent = structuredClone(baseRentRoll);
delete missingMarketRent.annual_market_rent;
missingMarketRent.units = missingMarketRent.units.map(({ market_rent, ...unit }) => unit);
delete missingMarketRent.unit_mix;
const derivableOccupancy = structuredClone(baseRentRoll);
delete derivableOccupancy.occupancy;
const summaryOnlyRentRoll = {
  ...structuredClone(baseRentRoll),
  units: [],
  unit_mix: [],
  summary_row_detected: true,
};
const varianceT12 = { ...structuredClone(baseT12), gross_potential_rent: 60000 };

const publishScenarios = [
  { name: "complete_core", artifacts: coreArtifacts() },
  { name: "t12_missing_gpr", artifacts: coreArtifacts({ t12: missingGpr }) },
  { name: "t12_missing_line_detail", artifacts: coreArtifacts({ t12: missingLineDetail }) },
  { name: "rent_roll_missing_market_rents", artifacts: coreArtifacts({ rentRoll: missingMarketRent }) },
  { name: "rent_roll_derivable_occupancy", artifacts: coreArtifacts({ rentRoll: derivableOccupancy }) },
  { name: "summary_only_rent_roll", artifacts: coreArtifacts({ rentRoll: summaryOnlyRentRoll }) },
  { name: "reconcilable_variance", artifacts: coreArtifacts({ t12: varianceT12 }) },
  { name: "failed_renovation", artifacts: coreArtifacts({ support: [{ id: "reno-error", type: "renovation_parse_error", payload: { file_id: "reno-file", error_message: "unreadable" } }] }) },
  { name: "failed_appraisal", artifacts: coreArtifacts({ support: [{ id: "appraisal-error", type: "appraisal_parse_error", payload: { file_id: "appraisal-file", error_message: "unreadable" } }] }) },
  { name: "ambiguous_current_debt", artifacts: coreArtifacts({ support: [{ id: "debt-text", type: "document_text_extracted", payload: { file_id: "debt-file", text: "Debt context requires validation." } }] }) },
  { name: "support_limitation_mentions_rent_roll", artifacts: coreArtifacts({ support: [{ id: "support-text", type: "document_text_extracted", payload: { file_id: "support-file", text: "Do not use this market survey as a rent roll." } }] }) },
  {
    name: "competing_core_candidate",
    artifacts: [
      ...coreArtifacts(),
      {
        id: "later-invalid-t12",
        type: "t12_parsed",
        created_at: "2099-01-01T00:00:00.000Z",
        payload: { ...structuredClone(baseT12), file_id: "invalid-t12", validated: false },
      },
    ],
  },
];

for (const scenario of publishScenarios) {
  const sourceTruthPackage = buildCanonicalSourceTruthPackage({
    jobId: `matrix-${scenario.name}`,
    propertyName: scenario.name,
    artifacts: scenario.artifacts,
  });
  assertPublishableInBothLanes(scenario.name, sourceTruthPackage);
}

const catastrophicScenarios = [
  { name: "blacked_out_t12", artifacts: coreArtifacts({ t12: { file_id: "matrix-t12-file", validated: false } }), code: "CORE_T12_CATASTROPHICALLY_UNUSABLE" },
  { name: "unreadable_rent_roll", artifacts: coreArtifacts({ rentRoll: { file_id: "matrix-rent-roll-file", validated: false } }), code: "CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE" },
  { name: "fundamentally_irreconcilable_core", artifacts: coreArtifacts({ t12: { ...baseT12, net_operating_income: 50 } }), code: "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY" },
];

for (const scenario of catastrophicScenarios) {
  const sourceTruthPackage = buildCanonicalSourceTruthPackage({ artifacts: scenario.artifacts });
  assert.equal(sourceTruthPackage.core_publishable, false, `${scenario.name} must block source truth`);
  for (const lane of ["screening", "acquisition_memo"]) {
    const gate = buildConstitutionalDeliveryGateDecision({
      sourceTruthPackage,
      pipelineCompliancePassed: true,
      htmlSafetyValidationPassed: true,
      rendererCompleted: true,
      customerBlockers: [scenario.code],
    });
    assert.equal(gate.report_publishable, false, `${scenario.name} ${lane} must block`);
    assert.equal(classifyTerminalFailureCode(scenario.code).customer_document_replacement_required, true);
  }
}

const internalFailureScenarios = [
  "SOURCE_TRUTH_PACKAGE_CONSTRUCTION_FAILED",
  "REPORT_RENDER_FAILED",
  "PDF_ARTIFACT_FAILED",
  "STORAGE_PUBLICATION_FAILED",
];
for (const code of internalFailureScenarios) {
  for (const lane of ["screening", "acquisition_memo"]) {
    const classification = classifyTerminalFailureCode(code);
    assert.equal(classification.failure_class, "internal_system_failure", `${code} ${lane} must be internal`);
    assert.equal(classification.customer_document_replacement_required, false);
    const copy = buildCustomerFailureMessage({ error_code: code });
    assert.equal(/replace|clearer|rent roll|operating statement|source package could not/i.test(JSON.stringify(copy)), false);
  }
}

console.log("source-truth constitutional matrix smoke PASS");
