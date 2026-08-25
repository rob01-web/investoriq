import assert from "assert";
import { readFileSync } from "fs";

import { buildAcquisitionMemoBossContract } from "../../api/_lib/acquisition-memo-boss-contract.js";
import { runAcquisitionMemoV2Pipeline } from "../../api/_lib/acquisition-memo-v2-pipeline.js";
import { buildDeterministicReportContractQaSeal } from "../../api/_lib/deterministic-report-contract-qa-seal.js";
import { runScreeningReportPipeline } from "../../api/_lib/screening-report-pipeline.js";
import { buildCanonicalSourceTruthPackage } from "../../api/_lib/source-truth-package.js";

const t12Artifact = {
  id: "validated-t12",
  type: "t12_parsed",
  payload: {
    file_id: "t12-file",
    original_filename: "Authority_T12.xlsx",
    effective_gross_income: 1000000,
    total_operating_expenses: 400000,
    net_operating_income: 600000,
    gross_potential_rent: 1100000,
    income_lines: [{ label: "Vacancy", amount: -100000 }],
    expense_lines: [{ label: "Operating Expenses", amount: 400000 }],
    core_t12_validation: { ok: true, failures: [] },
  },
};
const rentRollArtifact = {
  id: "validated-rent-roll",
  type: "rent_roll_parsed",
  payload: {
    file_id: "rent-roll-file",
    original_filename: "Authority_Rent_Roll.xlsx",
    total_units: 2,
    occupancy: 0.5,
    units: [
      { unit: "1", status: "Occupied", in_place_rent: 45000, market_rent: 47500 },
      { unit: "2", status: "Vacant", in_place_rent: 0, market_rent: 47500 },
    ],
    unit_mix: [{ unit_type: "2BR", count: 2, current_rent: 22500, market_rent: 47500 }],
  },
};
const validSourceTruth = buildCanonicalSourceTruthPackage({
  jobId: "source-truth-pipeline-authority",
  propertyName: "Authority Property",
  artifacts: [t12Artifact, rentRollArtifact],
});
assert.equal(validSourceTruth.core_publishable, true);
const screeningHtml = "<html><body>Authority Property</body></html>";
const deterministicContractQaSeal = buildDeterministicReportContractQaSeal({ html: screeningHtml });
assert.equal(deterministicContractQaSeal.ok, true);

const screeningOutput = runScreeningReportPipeline({
  finalHtml: screeningHtml,
  sourceTruthPackage: validSourceTruth,
  sourceTruthRequired: true,
  deliveryGateDecisionResult: { delivery_gate_status: "deliverable" },
  deterministicContractQaSeal,
});
assert.equal(screeningOutput.sourceTruthPackage, validSourceTruth);
assert.equal(screeningOutput.sealedCustomerOutput, true);

assert.throws(
  () => runScreeningReportPipeline({ sourceTruthRequired: true }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED/
);

const rentRollOnlySourceTruth = buildCanonicalSourceTruthPackage({
  jobId: "source-truth-pipeline-authority-rent-roll-only",
  propertyName: "Authority Property",
  artifacts: [rentRollArtifact],
});
assert.equal(rentRollOnlySourceTruth.core_publishable, true);
assert.equal(rentRollOnlySourceTruth.true_blockers.includes("CORE_T12_NOT_VALIDATED"), false);
const rentRollOnlyOutput = runScreeningReportPipeline({
  finalHtml: screeningHtml,
  sourceTruthPackage: rentRollOnlySourceTruth,
  sourceTruthRequired: true,
  deliveryGateDecisionResult: { delivery_gate_status: "deliverable" },
  deterministicContractQaSeal,
});
assert.equal(rentRollOnlyOutput.sealedCustomerOutput, true);

const blockedSourceTruth = buildCanonicalSourceTruthPackage({
  jobId: "source-truth-pipeline-authority-blocked",
  propertyName: "Authority Property",
  artifacts: [],
});
assert.equal(blockedSourceTruth.core_publishable, false);
assert.ok(Array.isArray(blockedSourceTruth.true_blockers) && blockedSourceTruth.true_blockers.length > 0);
assert.throws(
  () => runScreeningReportPipeline({
    sourceTruthPackage: blockedSourceTruth,
    sourceTruthRequired: true,
    deliveryGateDecisionResult: { delivery_gate_status: "deliverable" },
  }),
  /SCREENING_DELIVERY_CONTRADICTS_SOURCE_TRUTH/
);

const legacyCanonicalPackage = {
  coreT12: {
    fileId: "legacy-t12",
    role: "core_t12",
    canonicalLabel: "Legacy T12",
    extractedFacts: { effective_gross_income: 999999999 },
  },
  coreRentRoll: {
    fileId: "legacy-rent-roll",
    role: "core_rent_roll",
    canonicalLabel: "Legacy Rent Roll",
    extractedFacts: { total_units: 999999 },
  },
  supportDocs: new Map(),
};
const validBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: legacyCanonicalPackage,
  sourceTruthPackage: validSourceTruth,
  acquisitionMemoProjection: { supportDocProjection: {}, financingReadinessSignals: {} },
  coreMetrics: {},
  propertyProfile: { propertyName: "Authority Property" },
  reportMeta: { reportMode: "v1_core" },
  reportMode: "v1_core",
});
assert.equal(validBossContract.coreGate.publishAllowed, true);
assert.equal(validBossContract.coreGate.sourceTruthPackageValid, true);
assert.equal(validBossContract.sourceTruth.authority?.source, "canonical_source_truth_package");
assert.equal(validBossContract.sourceTruth.coreT12?.fileId, "t12-file");
assert.equal(validBossContract.sourceTruth.coreRentRoll?.fileId, "rent-roll-file");
assert.notEqual(validBossContract.sourceTruth.coreT12?.fileId, "legacy-t12");

const blockedBossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: legacyCanonicalPackage,
  sourceTruthPackage: blockedSourceTruth,
  acquisitionMemoProjection: { supportDocProjection: {}, financingReadinessSignals: {} },
  coreMetrics: {},
  propertyProfile: { propertyName: "Authority Property" },
  reportMeta: { reportMode: "v1_core" },
  reportMode: "v1_core",
});
assert.equal(blockedBossContract.coreGate.publishAllowed, false);
assert.ok(Array.isArray(blockedBossContract.coreGate.fatalReasons) && blockedBossContract.coreGate.fatalReasons.length > 0);

await assert.rejects(
  runAcquisitionMemoV2Pipeline({
    acquisitionMemoV2DocumentArgs: { sourceTruthRequired: true },
  }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED/
);
await assert.rejects(
  runAcquisitionMemoV2Pipeline({
    acquisitionMemoV2DocumentArgs: {
      sourceTruthPackage: blockedSourceTruth,
      sourceTruthRequired: true,
    },
  }),
  /ACQUISITION_MEMO_SOURCE_TRUTH_NOT_PUBLISHABLE/
);

const generatorSource = readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
assert.match(generatorSource, /type:\s*"source_truth_package"/);
assert.match(generatorSource, /sourceTruthPackage:\s*sourceTruthPackageResult,\s*sourceTruthRequired:\s*true/);
assert.match(
  generatorSource,
  /runScreeningReportPipeline\(\{[\s\S]*?sourceTruthPackage:\s*sourceTruthPackageResult,[\s\S]*?sourceTruthRequired:\s*true/
);
assert.match(
  generatorSource,
  /buildSourceReportCoverageQa\(\{[\s\S]*?sourceTruthPackage:\s*sourceTruthPackageResult/
);
assert.doesNotMatch(
  generatorSource,
  /coreInputSufficiencyState:\s*[\s\S]{0,160}?coreInputSufficiencyState\s*\|\|/
);

console.log("source-truth pipeline authority smoke PASS");
