import assert from "assert";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { __test__: generatorTest } = await import("../../api/generate-client-report.js");
const {
  buildCurrentDebtAssessmentState,
  formatCurrentDebtAssessmentCopy,
} = await import("../../api/_lib/report-surface-contracts.js");

const correctedAnnualMarketRent = generatorTest.resolveSafeAnnualRentTotal({
  totalUnits: 48,
  weightedAvgRent: 1888,
  summaryAnnualTotal: 21744000,
  rowAnnualTotal: 1087488,
  isPartialSample: false,
});

assert.equal(correctedAnnualMarketRent, 1087488);
assert.equal(correctedAnnualMarketRent / 12 / 48, 1888);
assert.equal(correctedAnnualMarketRent - 961200, 126288);

const cleanAnnualMarketRent = generatorTest.resolveSafeAnnualRentTotal({
  totalUnits: 48,
  weightedAvgRent: 1888,
  summaryAnnualTotal: 1087488,
  rowAnnualTotal: 1087488,
  isPartialSample: false,
});

assert.equal(cleanAnnualMarketRent, 1087488);

const rendererCanonicalState = generatorTest.buildRendererCanonicalState({
  computedRentRoll: { total_units: 48, total_in_place_annual: 1087488 },
  rentRollPayload: { total_units: 48, total_in_place_annual: 1087488 },
  mortgagePayload: {
    outstanding_balance: 1500000,
    monthly_payment: 9000,
    interest_rate: 0.065,
    amort_years: 30,
  },
  loanTermSheetTermsPayload: {
    purchase_price: 2000000,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
    derived_acquisition_loan_amount: 1500000,
  },
  t12Payload: {
    net_operating_income: 650000,
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
  },
  appraisalPayload: { appraised_value: 2250000, cap_rate: 0.0625 },
  propertyTaxPayload: { annual_tax: 24000 },
});

assert.equal(rendererCanonicalState.currentDebtAssessmentState?.current_debt_dscr_status, "computed");
assert.equal(rendererCanonicalState.sourceReconciliationState?.status, "aligned");
assert.ok(rendererCanonicalState.sectionEligibility);

const acquisitionOnlyCanonicalState = generatorTest.buildRendererCanonicalState({
  mortgagePayload: {
    monthly_payment: 9250,
    interest_rate: 0.0625,
    amort_years: 25,
  },
  loanTermSheetTermsPayload: {
    purchase_price: 2000000,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
    derived_acquisition_loan_amount: 1500000,
  },
  t12Payload: {
    net_operating_income: 650000,
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
  },
});

assert.equal(acquisitionOnlyCanonicalState.currentDebtAssessmentState?.has_true_current_debt_balance, false);
assert.equal(acquisitionOnlyCanonicalState.currentDebtAssessmentState?.current_debt_limitation_reason_code, "acquisition_only_not_current_debt");

const acquisitionOnlyDebtCopy = formatCurrentDebtAssessmentCopy({
  currentDebtState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      monthly_payment: 9250,
      interest_rate: 0.0625,
      amort_years: 25,
    },
    loanTermSheetTermsPayload: {
      purchase_price: 2000000,
      ltv: 0.75,
      interest_rate: 0.065,
      amortization_years: 30,
      derived_acquisition_loan_amount: 1500000,
    },
    t12Noi: 650000,
  }),
});
assert.equal(acquisitionOnlyDebtCopy.value, "Not assessed");
assert.match(acquisitionOnlyDebtCopy.explanation, /Proposed acquisition financing is shown separately/i);
assert.match(acquisitionOnlyDebtCopy.explanation, /Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified/i);
assert.equal(acquisitionOnlyDebtCopy.explanation.includes(".."), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(acquisitionOnlyDebtCopy.explanation), false);

const screeningDataCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
  t12Payload: {
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1087488,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1087488,
    occupancy: 0.95,
    units: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
    totals: {
      total_units: 48,
      occupied_units: 46,
      in_place_rent_annual: 1087488,
      market_rent_annual: 1117800,
      summary_row_detected: true,
    },
  },
  financials: {},
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      monthly_payment: 9250,
      interest_rate: 0.0625,
      amort_years: 25,
    },
    loanTermSheetTermsPayload: {
      purchase_price: 2000000,
      ltv: 0.75,
      interest_rate: 0.065,
      amortization_years: 30,
      derived_acquisition_loan_amount: 1500000,
    },
    t12Noi: 650000,
  }),
  sourceReconciliationState: {
    status: "aligned",
    variance_pct: null,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
  sectionEligibility: {
    source_constrained_section_count: 0,
  },
});

assert.match(screeningDataCoverageHtml, /Proposed acquisition financing is shown separately/i);
assert.match(screeningDataCoverageHtml, /Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified/i);
assert.equal(screeningDataCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(screeningDataCoverageHtml), false);

console.log("generate-client-report rent-roll smoke PASS");
