import assert from "node:assert/strict";
import {
  FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION,
  FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION,
  buildFullUnderwritingDebtIntelligenceV1,
  validateFullUnderwritingDebtIntelligenceV1,
} from "../../api/_lib/full-underwriting-debt-intelligence-v1.js";

let passed = 0;
function ok(value, message) { assert.ok(value, message); passed += 1; }
function eq(actual, expected, message) { assert.equal(actual, expected, message); passed += 1; }
function close(actual, expected, tolerance, message) {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} vs ${expected}`);
  passed += 1;
}

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
      facts: {
        purchase_price: 13500000,
        proposed_loan_amount: 9450000,
        ltv: 0.70,
      },
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
        lenderFee: {
          calculationStatus: "calculated",
          lenderFeeDollars: 80325,
        },
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
  valueSemantics: { wholePropertyValue: { noi: 945000 } },
};

const contract = buildFullUnderwritingDebtIntelligenceV1({
  customerSurfaceModel: model,
  reportMeta: { generatedAt: "2026-07-17T12:00:00.000Z", reportType: "underwriting" },
});

// Contract and authority.
eq(contract.version, FULL_UNDERWRITING_DEBT_INTELLIGENCE_VERSION, "version");
eq(contract.policyVersion, FULL_UNDERWRITING_DEBT_SENSITIVITY_POLICY_VERSION, "policy version");
eq(contract.identity.propertyName, "Institutional Gate 10 Property", "property identity");
eq(contract.authority.authorityCreating, false, "no authority creation");
eq(contract.authority.sourceTruthMutationAllowed, false, "no source truth mutation");
eq(contract.authority.publicationAuthorityAllowed, false, "no publication authority");
eq(contract.authority.deliveryAuthorityAllowed, false, "no delivery authority");
eq(contract.authority.revisionAuthorityAllowed, false, "no revision authority");
eq(contract.authority.scenarioOutputsAreEvidence, false, "scenario not evidence");
eq(contract.authority.thresholdInferenceAllowed, false, "no threshold inference");
eq(contract.authority.lenderCovenantInferenceAllowed, false, "no covenant inference");
eq(contract.authority.riskGradeInferenceAllowed, false, "no risk grade");
eq(contract.authority.investmentRecommendationAllowed, false, "no investment recommendation");
eq(contract.authority.refinancingModelAllowed, false, "no refinancing model");
eq(contract.authority.currentDebtRateShockAllowed, false, "no current-debt rate shock");

// Base current debt profile.
eq(contract.baseProfiles.currentDebt.displayReady, true, "current debt ready");
eq(contract.baseProfiles.currentDebt.balance.value, 6800000, "current balance");
close(contract.baseProfiles.currentDebt.rate.value, 0.0485, 1e-12, "current rate");
eq(contract.baseProfiles.currentDebt.amortizationRemainingYears.value, 24, "current amortization");
eq(contract.baseProfiles.currentDebt.maturityDate.value, "2029-11-01", "current maturity");
eq(contract.baseProfiles.currentDebt.monthlyDebtService.value, 39250, "current monthly debt service");
eq(contract.baseProfiles.currentDebt.annualDebtService.value, 471000, "current annual debt service");
close(contract.baseProfiles.currentDebt.dscr.value, 945000 / 471000, 1e-12, "current dscr");
eq(contract.baseProfiles.currentDebt.noiCushionToOneX.value, 474000, "current NOI cushion");
eq(contract.baseProfiles.currentDebt.noiCushionToOneX.evidenceClass, "deterministic_calculated", "current cushion class");

// Base proposed financing profile.
eq(contract.baseProfiles.proposedFinancing.displayReady, true, "proposed financing ready");
eq(contract.baseProfiles.proposedFinancing.loanAmount.value, 9450000, "proposed loan");
close(contract.baseProfiles.proposedFinancing.ltv.value, 0.70, 1e-12, "proposed LTV");
close(contract.baseProfiles.proposedFinancing.rate.value, 0.0595, 1e-12, "proposed rate");
eq(contract.baseProfiles.proposedFinancing.amortizationYears.value, 30, "proposed amortization");
close(contract.baseProfiles.proposedFinancing.lenderFeePercent.value, 0.0085, 1e-12, "proposed fee");
eq(contract.baseProfiles.proposedFinancing.lenderFeeDollars.value, 80325, "proposed fee dollars");
close(contract.baseProfiles.proposedFinancing.monthlyDebtService.value, 56354.10318408046, 1e-8, "proposed monthly debt service");
close(contract.baseProfiles.proposedFinancing.annualDebtService.value, 676249.2382089655, 1e-8, "proposed annual debt service");
close(contract.baseProfiles.proposedFinancing.dscr.value, 1.3974137738074446, 1e-12, "proposed dscr");
close(contract.baseProfiles.proposedFinancing.noiCushionToOneX.value, 268750.7617910345, 1e-8, "proposed NOI cushion");

// Rate / DSCR sensitivity.
eq(contract.proposedRateSensitivity.displayReady, true, "rate sensitivity ready");
eq(contract.proposedRateSensitivity.evidenceClass, "scenario", "rate family scenario class");
eq(contract.proposedRateSensitivity.rows.length, 3, "three rate stresses");
const r50 = contract.proposedRateSensitivity.rows[0];
const r100 = contract.proposedRateSensitivity.rows[1];
const r200 = contract.proposedRateSensitivity.rows[2];
eq(r50.scenarioInputs.rateStressBasisPoints, 50, "+50 bps");
eq(r100.scenarioInputs.rateStressBasisPoints, 100, "+100 bps");
eq(r200.scenarioInputs.rateStressBasisPoints, 200, "+200 bps");
for (const rateRow of contract.proposedRateSensitivity.rows) {
  eq(rateRow.scenario, true, "row scenario true");
  eq(rateRow.sourceBacked, false, "row not source backed");
  eq(rateRow.evidenceClass, "scenario", "row scenario class");
  ok(rateRow.outputs.annualDebtService > contract.baseProfiles.proposedFinancing.annualDebtService.value, "stressed debt service above base");
  ok(rateRow.outputs.dscr < contract.baseProfiles.proposedFinancing.dscr.value, "stressed DSCR below base");
  ok(rateRow.outputs.noiCushionToOneX < contract.baseProfiles.proposedFinancing.noiCushionToOneX.value, "stressed cushion below base");
}
close(r50.scenarioInputs.scenarioRate, 0.0645, 1e-12, "+50 rate");
close(r50.outputs.annualDebtService, 713040.3321549625, 1e-5, "+50 ADS");
close(r50.outputs.dscr, 1.325310725613522, 1e-8, "+50 DSCR");
close(r100.scenarioInputs.scenarioRate, 0.0695, 1e-12, "+100 rate");
close(r100.outputs.annualDebtService, 750648.9258344097, 1e-5, "+100 ADS");
close(r100.outputs.dscr, 1.258910747057358, 1e-8, "+100 DSCR");
close(r200.scenarioInputs.scenarioRate, 0.0795, 1e-12, "+200 rate");
close(r200.outputs.annualDebtService, 828139.7608747203, 1e-5, "+200 ADS");
close(r200.outputs.dscr, 1.141111735779775, 1e-8, "+200 DSCR");
ok(/not a forecast/i.test(r100.qualification), "scenario qualification");
ok(/future debt replacement model/i.test(r100.qualification), "no future debt replacement model authority");

// Maturity.
eq(contract.maturityContext.displayReady, true, "maturity ready");
eq(contract.maturityContext.maturityDate.value, "2029-11-01", "maturity date");
eq(contract.maturityContext.daysToMaturity.value, 1203, "days to maturity");
eq(contract.maturityContext.maturityPosition.value, "future", "maturity position");
eq(contract.maturityContext.refinancingReadiness.refinancingModelEligible, false, "refinance model not eligible");
eq(contract.maturityContext.refinancingReadiness.proposedAcquisitionFinancingTreatedAsRefinancing, false, "proposed financing not treated as refinance");

// Capacity metrics / interpretation.
eq(contract.capacityInterpretation.displayReady, true, "capacity ready");
close(contract.capacityInterpretation.metrics.proposedDebtYield.value, 0.10, 1e-12, "debt yield");
close(contract.capacityInterpretation.metrics.proposedMortgageConstant.value, 676249.2382089655 / 9450000, 1e-12, "mortgage constant");
close(contract.capacityInterpretation.metrics.proposedDebtInclusiveBreakEvenOccupancy.value, (555000 + 676249.2382089655) / 1612800, 1e-12, "proposed debt break-even occupancy");
ok(contract.capacityInterpretation.observations.length >= 4, "decision observations created");
ok(contract.capacityInterpretation.observations.some((o) => o.key === "coverage_comparison"), "coverage comparison");
ok(contract.capacityInterpretation.observations.some((o) => o.key === "debt_service_comparison"), "debt service comparison");
ok(contract.capacityInterpretation.observations.some((o) => o.key === "occupancy_vs_debt_break_even"), "occupancy break-even comparison");
ok(contract.capacityInterpretation.observations.some((o) => o.key === "rate_100bps_dscr_change" && o.evidenceClass === "scenario"), "+100 bps observation scenario labeled");
ok(/no lender covenant/i.test(contract.capacityInterpretation.qualification), "capacity qualification");

// Availability, disposition and boundaries.
eq(contract.availability.chapterDisplayReady, true, "chapter ready");
eq(contract.availability.baseCoverageReady, true, "base coverage ready");
eq(contract.availability.proposedRateSensitivityReady, true, "rate sensitivity ready availability");
eq(contract.availability.maturityContextReady, true, "maturity ready availability");
eq(contract.availability.capacityInterpretationReady, true, "capacity ready availability");
eq(contract.sectionDispositions.coverageHeadroom.disposition, "include", "coverage included");
eq(contract.sectionDispositions.proposedRateSensitivity.disposition, "include", "rate sensitivity included");
eq(contract.sectionDispositions.maturityContext.disposition, "include", "maturity included");
eq(contract.sectionDispositions.capacityInterpretation.disposition, "include", "capacity included");
eq(contract.boundaries.currentDebtIsNotProposedFinancing, true, "debt identities separated");
eq(contract.boundaries.proposedRateStressIsScenarioOnly, true, "rate stress scenario boundary");
eq(contract.boundaries.currentDebtRateStressDeferred, true, "current rate stress deferred");
eq(contract.boundaries.refinanceTermsNotInferred, true, "no refi terms inference");
eq(contract.boundaries.noLenderCovenantInference, true, "no covenant inference boundary");
eq(contract.boundaries.noCreditDecision, true, "no credit decision");
eq(contract.boundaries.noInvestmentRecommendation, true, "no recommendation");
eq(contract.boundaries.noRiskGrade, true, "no risk grade");

// Validation and immutability.
const validation = validateFullUnderwritingDebtIntelligenceV1(contract);
eq(validation.ok, true, validation.issues.join(","));
eq(Object.isFrozen(contract), true, "contract frozen");
eq(Object.isFrozen(contract.proposedRateSensitivity.rows[0]), true, "scenario row frozen");
const originalRate = model.sections.proposedFinancingContext.facts.interest_rate;
eq(originalRate, 0.0595, "input not mutated");

const invalid = structuredClone(contract);
invalid.authority.investmentRecommendationAllowed = true;
eq(validateFullUnderwritingDebtIntelligenceV1(invalid).ok, false, "invalid recommendation authority rejected");
const invalidScenario = structuredClone(contract);
invalidScenario.proposedRateSensitivity.rows[0].sourceBacked = true;
eq(validateFullUnderwritingDebtIntelligenceV1(invalidScenario).ok, false, "scenario cannot become source-backed");
assert.throws(() => buildFullUnderwritingDebtIntelligenceV1({}), /ELITE_DEBT_CUSTOMER_SURFACE_MODEL_REQUIRED/); passed += 1;

// Partial/collapse behavior.
const partial = buildFullUnderwritingDebtIntelligenceV1({
  customerSurfaceModel: {
    identity: { propertyName: "Partial Debt Property" },
    sections: {
      currentDebtContext: {
        factAvailability: { sourceBacked: true },
        facts: { current_outstanding_balance: 2500000, maturity_date: null },
      },
    },
  },
});
eq(partial.availability.chapterDisplayReady, true, "partial debt chapter can survive");
eq(partial.availability.proposedRateSensitivityReady, false, "unsupported rate sensitivity collapses");
eq(partial.sectionDispositions.proposedRateSensitivity.disposition, "collapse", "rate sensitivity collapsed");
eq(partial.availability.maturityContextReady, false, "unsupported maturity collapses");
eq(partial.sectionDispositions.maturityContext.disposition, "collapse", "maturity collapsed");
eq(partial.boundaries.currentDebtRateStressDeferred, true, "partial current debt still not shocked");

console.log(`PASS full-underwriting-debt-intelligence-v1-smoke (${passed}/${passed})`);
