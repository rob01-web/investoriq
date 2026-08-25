import assert from "node:assert/strict";
import {
  buildFullUnderwritingOperatingIntelligenceContract,
  validateFullUnderwritingOperatingIntelligenceContract,
} from "../../api/_lib/full-underwriting-operating-intelligence-contract.js";

function baseSourceTruth() {
  return {
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "elite-03-job",
    property_name: "ELITE Operating Property",
    core_publishable: true,
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
    core: {
      t12: {
        file_id: "t12-file",
        artifact_id: "t12-artifact",
        accepted_facts: {
          gross_potential_rent: 1612800,
          effective_gross_income: 1500000,
          total_operating_expenses: 555000,
          net_operating_income: 945000,
          income_lines: [{ label: "Rental Revenue", amount: 1500000 }],
          expense_lines: [
            { label: "Property Taxes", amount: 185000 },
            { label: "Insurance", amount: 72000 },
            { label: "Repairs & Maintenance", amount: 104000 },
            { label: "Utilities", amount: 86000 },
            { label: "Property Management", amount: 60000 },
            { label: "Payroll / Admin", amount: 28000 },
          ],
        },
      },
      rent_roll: {
        file_id: "rr-file",
        artifact_id: "rr-artifact",
        accepted_facts: {
          total_units: 64,
          occupancy: 0.9375,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
          unit_mix: [
            { label: "1BR", count: 32, current_rent: 1850, market_rent: 2050 },
            { label: "2BR", count: 32, current_rent: 1881.25, market_rent: 2425 },
          ],
        },
      },
    },
  };
}

const contract = buildFullUnderwritingOperatingIntelligenceContract({
  sourceTruthPackage: baseSourceTruth(),
  propertyProfile: { propertyName: "ELITE Operating Property" },
});
const validation = validateFullUnderwritingOperatingIntelligenceContract(contract);
assert.equal(validation.ok, true, JSON.stringify(validation.issues));
assert.equal(contract.authority.authorityCreating, false);
assert.equal(contract.authority.sourceTruthMutationAllowed, false);
assert.equal(contract.authority.scenarioAllowed, false);
assert.equal(contract.authority.investmentRecommendationAllowed, false);
assert.equal(contract.revenueQuality.grossRentCapitalizationAuthorized, false);
assert.equal(contract.metrics.revenueRealizationGap.value, 112800);
assert.equal(contract.metrics.revenueRealizationRatio.value, 1500000 / 1612800);
assert.equal(contract.metrics.annualGrossRentDifference.value, 285600);
assert.equal(contract.metrics.expenseRatio.value, 555000 / 1500000);
assert.equal(contract.metrics.noiMargin.value, 945000 / 1500000);
assert.equal(contract.metrics.noiPerUnit.value, 945000 / 64);
assert.equal(contract.metrics.breakEvenOccupancy.value, 555000 / 1612800);
assert.equal(contract.metrics.occupancyBreakEvenSpread.value, 0.9375 - (555000 / 1612800));
assert.equal(contract.noiAnalysis.noiIdentityReconciles, true);
assert.equal(contract.expenseStructure.largestExpenseCategory.label, "Property Taxes");
assert.ok(contract.expenseStructure.topThreeExpenseShare > 0);
assert.equal(contract.unitRentConcentration.largestUnitCategory.unitShare, 0.5);
assert.equal(contract.unitRentConcentration.largestPositiveRentGapCategory.label, "2BR");
assert.equal(contract.unitRentConcentration.occupancyConcentrationEstablished, false);
assert.match(contract.unitRentConcentration.occupancyConcentrationQualification, /not inferred/i);
assert.ok(contract.operatingInterpretation.items.length >= 5);
assert.equal(contract.ttmOperatingStatement.historicalTrendAvailable, false);

const withHistory = baseSourceTruth();
withHistory.core.t12.accepted_facts.historical_periods = [
  { period: "2024", effective_gross_income: 1400000, total_operating_expenses: 540000, net_operating_income: 860000 },
  { period: "2025", effective_gross_income: 1500000, total_operating_expenses: 555000, net_operating_income: 945000 },
];
const historical = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage: withHistory });
assert.equal(historical.ttmOperatingStatement.historicalTrendAvailable, true);
assert.ok(historical.operatingInterpretation.items.some((item) => item.code === "HISTORICAL_NOI_CHANGE"));

const t12Only = baseSourceTruth();
t12Only.core.rent_roll = null;
t12Only.core_input_sufficiency_state.evidence.core_source_mode = "t12_minimum_core";
const t12OnlyContract = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage: t12Only });
assert.equal(t12OnlyContract.sectionDispositions.operatingPerformanceOverview.disposition, "include_qualified");
assert.equal(t12OnlyContract.sectionDispositions.unitRentConcentration.disposition, "collapse");
assert.equal(t12OnlyContract.sectionDispositions.noiAnalysis.disposition, "include");

const rrOnly = baseSourceTruth();
rrOnly.core.t12 = null;
rrOnly.core_input_sufficiency_state.evidence.core_source_mode = "rent_roll_minimum_core";
const rrOnlyContract = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage: rrOnly });
assert.equal(rrOnlyContract.sectionDispositions.operatingPerformanceOverview.disposition, "include_qualified");
assert.equal(rrOnlyContract.sectionDispositions.revenueQuality.disposition, "include_qualified");
assert.equal(rrOnlyContract.sectionDispositions.expenseStructure.disposition, "collapse");
assert.equal(rrOnlyContract.sectionDispositions.noiAnalysis.disposition, "collapse");
assert.equal(rrOnlyContract.sectionDispositions.unitRentConcentration.disposition, "include");

const unreconciledExpenses = baseSourceTruth();
unreconciledExpenses.core.t12.accepted_facts.expense_lines = [
  { label: "Huge Category A", amount: 500000 },
  { label: "Huge Category B", amount: 500000 },
];
const unreconciled = buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage: unreconciledExpenses });
assert.equal(unreconciled.expenseStructure.compositionEligible, false);
assert.equal(unreconciled.expenseStructure.largestExpenseCategory, null);
assert.equal(unreconciled.sectionDispositions.expenseStructure.disposition, "compact");

assert.throws(
  () => buildFullUnderwritingOperatingIntelligenceContract({ sourceTruthPackage: { source: "raw_parser" } }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED/
);

const serialized = JSON.stringify(contract).toUpperCase();
for (const forbidden of ["\"BUY\"", "\"SELL\"", "\"HOLD\"", "IRR", "MOIC"]) {
  assert.equal(serialized.includes(forbidden), false, `forbidden token leaked: ${forbidden}`);
}

console.log("PASS full-underwriting-operating-intelligence-contract-smoke (32/32)");
