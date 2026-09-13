import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildCanonicalOperatingMetricSet,
  compareCanonicalOperatingMetricSets,
  OPERATING_COST_COVERAGE_RATIO,
} from "../../api/_lib/canonical-operating-metrics.js";
import { buildFullUnderwritingOperatingIntelligenceContract } from "../../api/_lib/full-underwriting-operating-intelligence-contract.js";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";

const t12Facts = {
  gross_potential_rent: 1612800,
  effective_gross_income: 1500000,
  total_operating_expenses: 555000,
  net_operating_income: 945000,
};
const rentRollFacts = {
  total_units: 64,
  occupancy: 0.9375,
  annual_in_place_rent: 1432800,
  annual_market_rent: 1718400,
};
const reconciliation = {
  status: "source_reconciliation_required",
  t12_gpr: 1612800,
  rr_annual_in_place: 1432800,
  difference_amount: -180000,
  variance_pct: -180000 / 1612800,
  source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
};

const shared = buildCanonicalOperatingMetricSet({ t12Facts, rentRollFacts, sourceReconciliationState: reconciliation });
assert.equal(shared.version, "canonical_operating_metrics_v2");
assert.equal(shared.unitsPolicy, "explicit_ratio_units_no_magnitude_inference");
assert.equal(shared.metrics.grossPotentialRent.value, 1612800);
assert.equal(shared.metrics.effectiveGrossIncome.value, 1500000);
assert.equal(shared.metrics.operatingExpenses.value, 555000);
assert.equal(shared.metrics.netOperatingIncome.value, 945000);
assert.equal(shared.metrics.rentRollOccupancy.value, 0.9375);
assert.equal(shared.metrics.operatingCostCoverageRatio.value, 555000 / 1612800);
assert.equal(shared.metrics.operatingCostCoverageRatio.label, OPERATING_COST_COVERAGE_RATIO.label);
assert.equal(shared.metrics.operatingCostCoverageRatio.formula, OPERATING_COST_COVERAGE_RATIO.formula);
assert.notEqual(shared.metrics.rentRollOccupancy.value, shared.metrics.operatingCostCoverageRatio.value);
assert.equal(shared.metrics.annualGrossRentDifference.value, 285600);
assert.equal(shared.metrics.rentToMarketGapRatio.value, 285600 / 1432800);

const highOccr = buildCanonicalOperatingMetricSet({
  t12Facts: { gross_potential_rent: 100, effective_gross_income: 100, total_operating_expenses: 200, net_operating_income: -100 },
  rentRollFacts: { total_units: 1, occupancy: 1, annual_in_place_rent: 100, annual_market_rent: 100 },
});
assert.equal(highOccr.metrics.operatingCostCoverageRatio.value, 2, "200% OCCR must remain 2.0, never 0.02");

const percentOccupancyInput = buildCanonicalOperatingMetricSet({
  t12Facts,
  rentRollFacts: { ...rentRollFacts, occupancy: 93.75 },
});
assert.equal(percentOccupancyInput.metrics.rentRollOccupancy.displayReady, false, "occupancy percent magnitude must not be silently normalized");

const same = buildCanonicalOperatingMetricSet({ t12Facts, rentRollFacts, sourceReconciliationState: reconciliation });
assert.equal(compareCanonicalOperatingMetricSets(shared, same).ok, true);
const changed = buildCanonicalOperatingMetricSet({
  t12Facts: { ...t12Facts, total_operating_expenses: 600000 },
  rentRollFacts,
  sourceReconciliationState: reconciliation,
});
const mismatch = compareCanonicalOperatingMetricSets(shared, changed);
assert.equal(mismatch.ok, false);
assert.ok(mismatch.mismatches.some((entry) => entry.key === "operatingExpenses"));
assert.ok(mismatch.mismatches.some((entry) => entry.key === "operatingCostCoverageRatio"));

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "slice1-continuity",
  property_name: "Stonebridge Lofts",
  core_publishable: true,
  core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  core: {
    t12: { file_id: "t12", artifact_id: "t12-a", accepted_facts: t12Facts },
    rent_roll: { file_id: "rr", artifact_id: "rr-a", accepted_facts: rentRollFacts },
  },
  support: { accepted: [], advisory: [] },
  source_reconciliation_state: reconciliation,
  shared_operating_metrics: shared,
};

const operating = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage });
assert.equal(operating.metrics.operatingCostCoverageRatio.value, shared.metrics.operatingCostCoverageRatio.value);
assert.equal(operating.metrics.operatingCostCoverageRatio.formula, shared.metrics.operatingCostCoverageRatio.formula);
assert.equal(operating.metrics.occupancy.value, shared.metrics.rentRollOccupancy.value);
assert.equal(operating.metrics.breakEvenOccupancy, undefined);
assert.equal(operating.metrics.occupancyBreakEvenSpread, undefined);

const chapter = buildFullUnderwritingChapter1EliteContract({ sourceTruthPackage });
assert.equal(chapter.metrics.operatingCostCoverageRatio.value, shared.metrics.operatingCostCoverageRatio.value);
assert.equal(chapter.metrics.operatingCostCoverageRatio.formula, shared.metrics.operatingCostCoverageRatio.formula);
assert.equal(chapter.metrics.occupancy.value, shared.metrics.rentRollOccupancy.value);
assert.equal(chapter.metrics.breakEvenOccupancy, undefined);
assert.equal(chapter.metrics.occupancyBreakEvenSpread, undefined);

const publicSurfaceFiles = [
  "api/_lib/generate-client-report-impl.js",
  "api/_lib/screening-report-renderer.js",
  "api/report-template-runtime.html",
  "api/_lib/full-underwriting-operating-intelligence-contract-base.js",
  "api/_lib/full-underwriting-operating-intelligence-contract.js",
  "api/_lib/full-underwriting-operating-intelligence-renderer.js",
  "api/_lib/full-underwriting-chapter1-elite-contract-base.js",
  "api/_lib/full-underwriting-chapter1-elite-contract.js",
  "api/_lib/full-underwriting-chapter1-elite-renderer-base.js",
  "api/_lib/acquisition-memo-v2-customer-surface-model-base.js",
  "api/_lib/acquisition-memo-v2-orchestrator.js",
  "api/_lib/acquisition-memo-v2-document-base.js",
];
for (const file of publicSurfaceFiles) {
  const source = fs.readFileSync(file, "utf8");
  assert.equal(/Break[- ]Even Occupancy|Break-even Occ\./i.test(source), false, "retired public alias remains in " + file);
}
assert.equal(fs.readFileSync("api/_lib/full-underwriting-operating-intelligence-contract.js", "utf8").includes("removeCrossBasisOccupancyComparison"), false);
assert.equal(fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-contract.js", "utf8").includes("removeCrossBasisOccupancyComparison"), false);
assert.equal(fs.readFileSync("api/_lib/full-underwriting-operating-intelligence-contract-base.js", "utf8").includes("const occupancyBreakEvenSpread"), false);
assert.equal(fs.readFileSync("api/_lib/full-underwriting-operating-intelligence-contract-base.js", "utf8").includes("metrics.occupancyBreakEvenSpread.displayReady"), false);
assert.equal(fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-contract-base.js", "utf8").includes("OCCUPANCY_ABOVE_BREAK_EVEN"), false);
assert.equal(fs.readFileSync("api/_lib/full-underwriting-chapter1-elite-contract-base.js", "utf8").includes("OCCUPANCY_BELOW_BREAK_EVEN"), false);

console.log("PASS canonical-operating-metric-continuity-smoke");
