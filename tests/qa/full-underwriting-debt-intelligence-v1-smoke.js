import assert from "node:assert/strict";
import {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  buildFullUnderwritingDebtIntelligenceV1,
  validateFullUnderwritingDebtIntelligenceV1,
} from "../../api/_lib/full-underwriting-debt-intelligence-v1.js";

const model = {
  identity: { propertyName: "Institutional Gate 10 Property", reportType: "underwriting" },
  sections: {
    operatingStatementTTMSummary: {
      factAvailability: { sourceBacked: true },
      facts: { net_operating_income: 945000 },
    },
    unitMix: {
      factAvailability: { sourceBacked: true },
      facts: { occupancy: 0.9375, total_units: 64 },
    },
    currentDebtContext: {
      factAvailability: { sourceBacked: true },
      facts: {
        current_outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_remaining_years: 24,
        monthly_payment: 39250,
        maturity_date: "2029-11-01",
      },
    },
    proposedFinancingContext: {
      factAvailability: { sourceBacked: true },
      facts: {
        proposed_loan_amount: 9450000,
        ltv: 0.70,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
      },
    },
    acquisitionRequestContext: {
      factAvailability: { sourceBacked: true },
      facts: { purchase_price: 13500000, proposed_loan_amount: 9450000, ltv: 0.70 },
    },
    debtServiceCoverage: {
      factAvailability: { sourceBacked: true, sectionDisplayReady: true },
      facts: {
        currentDebt: {
          monthlyDebtService: 39250,
          annualDebtService: 471000,
          dscr: 945000 / 471000,
          selectedMethod: "source_stated_monthly_payment",
        },
        proposedFinancing: {
          monthlyDebtService: 56354.10318408046,
          annualDebtService: 676249.2382089655,
          dscr: 1.3974137738074446,
          selectedMethod: "deterministic_amortization_model",
        },
      },
    },
    debtTermAnalysis: {
      factAvailability: { sourceBacked: true, sectionDisplayReady: true },
      facts: {
        lenderFee: { calculationStatus: "calculated", lenderFeeDollars: 80325 },
        maturity: {
          currentDebt: {
            analysisStatus: "assessed",
            maturityDate: "2029-11-01",
            normalizedMaturityDate: "2029-11-01",
            asOfDate: "2026-07-17",
            daysToMaturity: 1203,
            maturityPosition: "future",
          },
        },
        refinancingReadiness: {
          assessmentStatus: "limited",
          assessmentState: "current_maturity_identified_refinancing_terms_not_available",
          refinancingModelEligible: false,
          proposedAcquisitionFinancingTreatedAsRefinancing: false,
        },
      },
    },
    debtCapacityAndCoverage: {
      factAvailability: { sourceBacked: true, sectionDisplayReady: true },
      facts: {
        proposedDebtYield: { result: 0.10, displayReady: true },
        proposedMortgageConstant: { result: 676249.2382089655 / 9450000, displayReady: true },
        dscr: { result: 1.3974137738074446, displayReady: true },
        ltv: { result: 0.70, displayReady: true },
        debtCapacityResult: { result: "Governed capacity metrics available", displayReady: true },
        bindingConstraint: { result: "Not established by provided sources", displayReady: true },
        currentDebtInclusiveBreakEvenOccupancy: { result: (555000 + 471000) / 1612800, displayReady: true },
        proposedDebtInclusiveBreakEvenOccupancy: { result: (555000 + 676249.2382089655) / 1612800, displayReady: true },
        currentDebtInclusiveBreakEvenMonthlyRentPerUnit: { result: (555000 + 471000) / 64 / 12, displayReady: true },
        proposedDebtInclusiveBreakEvenMonthlyRentPerUnit: { result: (555000 + 676249.2382089655) / 64 / 12, displayReady: true },
      },
    },
  },
};

const contract = buildFullUnderwritingDebtIntelligenceV1({
  customerSurfaceModel: model,
  reportMeta: { generatedAt: "2026-07-17T12:00:00.000Z", reportType: "underwriting" },
});

assert.equal(contract.version, FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION);
assert.equal(contract.policyVersion, FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION);
assert.equal(contract.identity.propertyName, "Institutional Gate 10 Property");
for (const [key, expected] of Object.entries({
  authorityCreating: false,
  sourceTruthMutationAllowed: false,
  publicationAuthorityAllowed: false,
  deliveryAuthorityAllowed: false,
  revisionAuthorityAllowed: false,
  scenarioOutputsAreEvidence: false,
  thresholdInferenceAllowed: false,
  lenderCovenantInferenceAllowed: false,
  riskGradeInferenceAllowed: false,
  investmentRecommendationAllowed: false,
  refinancingModelAllowed: false,
  currentDebtRateShockAllowed: false,
})) assert.equal(contract.authority[key], expected, `authority.${key}`);

assert.equal(contract.baseProfiles.currentDebt.balance.value, 6800000);
assert.equal(contract.baseProfiles.currentDebt.monthlyDebtService.value, 39250);
assert.equal(contract.baseProfiles.currentDebt.annualDebtService.value, 471000);
assert.ok(Math.abs(contract.baseProfiles.currentDebt.dscr.value - (945000 / 471000)) < 1e-12);
assert.equal(contract.baseProfiles.currentDebt.noiCushionToOneX.value, 474000);

assert.equal(contract.baseProfiles.proposedFinancing.loanAmount.value, 9450000);
assert.ok(Math.abs(contract.baseProfiles.proposedFinancing.rate.value - 0.0595) < 1e-12);
assert.equal(contract.baseProfiles.proposedFinancing.amortizationYears.value, 30);
assert.ok(Math.abs(contract.baseProfiles.proposedFinancing.annualDebtService.value - 676249.2382089655) < 1e-8);
assert.ok(Math.abs(contract.baseProfiles.proposedFinancing.dscr.value - 1.3974137738074446) < 1e-12);

assert.equal(contract.proposedRateSensitivity.displayReady, true);
assert.equal(contract.proposedRateSensitivity.rows.length, 3);
assert.deepEqual(contract.proposedRateSensitivity.rows.map((row) => row.scenarioInputs.rateStressBasisPoints), [50, 100, 200]);
for (const row of contract.proposedRateSensitivity.rows) {
  assert.equal(row.evidenceClass, "scenario");
  assert.equal(row.sourceBacked, false);
  assert.ok(row.outputs.annualDebtService > contract.baseProfiles.proposedFinancing.annualDebtService.value);
  assert.ok(row.outputs.dscr < contract.baseProfiles.proposedFinancing.dscr.value);
  assert.match(row.qualification, /not a forecast/i);
}
const plus100 = contract.proposedRateSensitivity.rows.find((row) => row.scenarioInputs.rateStressBasisPoints === 100);
assert.ok(Math.abs(plus100.scenarioInputs.scenarioRate - 0.0695) < 1e-12);
assert.ok(Math.abs(plus100.outputs.annualDebtService - 750648.9258344097) < 1e-5);
assert.ok(Math.abs(plus100.outputs.dscr - 1.258910747057358) < 1e-8);

assert.equal(contract.maturityContext.displayReady, true);
assert.equal(contract.maturityContext.maturityDate.value, "2029-11-01");
assert.equal(contract.maturityContext.daysToMaturity.value, 1203);
assert.equal(contract.maturityContext.refinancingReadiness.refinancingModelEligible, false);

const capacity = contract.capacityInterpretation;
assert.equal(capacity.displayReady, true);
assert.equal(capacity.metrics.currentDebtInclusiveBreakEvenOccupancy.label, "Current Debt-Inclusive Cost Coverage Ratio");
assert.equal(capacity.metrics.proposedDebtInclusiveBreakEvenOccupancy.label, "Proposed Debt-Inclusive Cost Coverage Ratio");
assert.match(capacity.metrics.proposedDebtInclusiveBreakEvenOccupancy.formula, /accepted_t12_operating_expenses/);
assert.match(capacity.metrics.proposedDebtInclusiveBreakEvenOccupancy.qualification, /not a physical occupancy threshold/i);
assert.ok(Math.abs(capacity.metrics.proposedDebtInclusiveBreakEvenOccupancy.value - ((555000 + 676249.2382089655) / 1612800)) < 1e-12);
assert.ok(capacity.observations.some((item) => item.key === "coverage_comparison"));
assert.ok(capacity.observations.some((item) => item.key === "debt_service_comparison"));
assert.ok(capacity.observations.some((item) => item.key === "rate_100bps_dscr_change" && item.evidenceClass === "scenario"));
assert.equal(capacity.observations.some((item) => item.key === "occupancy_vs_debt_break_even"), false);
assert.doesNotMatch(JSON.stringify(capacity.observations), /percentage points (?:above|below).*occupancy coverage point/i);
assert.match(capacity.qualification, /no lender covenant/i);
assert.match(capacity.qualification, /no.*physical occupancy threshold/i);

assert.equal(contract.availability.chapterDisplayReady, true);
assert.equal(contract.sectionDispositions.coverageHeadroom.disposition, "include");
assert.equal(contract.sectionDispositions.proposedRateSensitivity.disposition, "include");
assert.equal(contract.sectionDispositions.maturityContext.disposition, "include");
assert.equal(contract.sectionDispositions.capacityInterpretation.disposition, "include");
assert.equal(contract.boundaries.currentDebtIsNotProposedFinancing, true);
assert.equal(contract.boundaries.proposedRateStressIsScenarioOnly, true);
assert.equal(contract.boundaries.noLenderCovenantInference, true);
assert.equal(contract.boundaries.noInvestmentRecommendation, true);

const validation = validateFullUnderwritingDebtIntelligenceV1(contract);
assert.equal(validation.ok, true, validation.issues.join(","));
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.proposedRateSensitivity.rows[0]), true);

const serialized = JSON.stringify(contract).toUpperCase();
for (const token of ["\"BUY\"", "\"SELL\"", "\"HOLD\"", "IRR", "MOIC"]) {
  assert.equal(serialized.includes(token), false, `forbidden token leaked: ${token}`);
}

console.log("PASS full-underwriting-debt-intelligence-v1-smoke");
