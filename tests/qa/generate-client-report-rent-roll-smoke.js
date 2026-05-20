import assert from "assert";
import fs from "fs";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { __test__: generatorTest } = await import("../../api/generate-client-report.js");
const {
  buildCurrentDebtAssessmentState,
  formatCurrentDebtAssessmentCopy,
  buildSourceReconciliationState,
  buildSourceReconciliationRenderState,
  resolveCanonicalRentRollAnnualTotals,
} = await import("../../api/_lib/report-surface-contracts.js");
const { buildReportContractQa } = await import("../../api/_lib/report-contract-qa.js");

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const legacyFallbackCallCount = (reportSource.match(/resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/g) || []).length;
assert.equal(legacyFallbackCallCount, 2);
assert.match(
  reportSource,
  /function resolveCanonicalCurrentDebtScoreInputs[\s\S]*?resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/
);
assert.equal(
  /function resolveCanonicalRefiDebtBasis[\s\S]*?resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/.test(reportSource),
  false
);
assert.equal(/function buildCurrentDebtScorecardEntry[\s\S]*?resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/.test(reportSource), false);
assert.equal(/function buildDealScorecardState[\s\S]*?resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/.test(reportSource), false);
assert.equal(/function render[\s\S]*?resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/i.test(reportSource), false);
assert.equal(/if \(effectiveReportMode !== "v1_core"\)[\s\S]{0,400}buildDealScoreTable\(tables\.dealScore/.test(reportSource), false);
assert.match(
  reportSource,
  /if \(effectiveReportMode !== "v1_core"\)[\s\S]{0,500}\{\{DEAL_SCORE_TABLE\}\}", ""/
);
assert.match(
  reportSource,
  /const dealScoreTableHtml = effectiveReportMode === "v1_core"\s*\?\s*dealScoreState\.dealScoreTableHtml\s*:\s*""/
);
assert.match(
  reportSource,
  /const execGpr = resolveCanonicalT12GprValue\(t12Payload\)/
);
assert.match(
  reportSource,
  /const screeningOccupancy = coerceNumber\(resolveOccupancyNoteValue\(computedRentRoll, rentRollPayload\)\)/
);
assert.match(
  reportSource,
  /const canonicalExecOccupancy = coerceNumber\(resolveOccupancyNoteValue\(computedRentRoll, rentRollPayload\)\)/
);
assert.match(
  reportSource,
  /const rrOccNow = coerceNumber\(resolveOccupancyNoteValue\(computedRentRoll, rentRollPayload\)\)/
);
assert.match(
  reportSource,
  /const isPartialRentRollSample =\s*computedRentRoll\?\.is_partial_sample === true \|\|\s*rentRollPayload\?\.is_partial_sample === true/
);
assert.match(
  reportSource,
  /const coverClassificationLabel = dealScoreState\.displayVerdict\?\.label \|\|/
);
assert.match(
  reportSource,
  /delivery_gate_status === "admin_review_required"[\s\S]{0,120}\|\|[\s\S]{0,120}delivery_gate_status === "user_needs_documents"/
);
assert.match(
  reportSource,
  /if \(!hasCanonicalCurrentRefiDebtBasis && !hasComputedCurrentDebtDscr && currentDebtAssessmentState\?\.current_debt_limitation_reason_code\)/
);
assert.match(
  reportSource,
  /const renderCanonicalDscrDerived[\s\S]*renderCanonicalNoi\s*\/\s*renderCanonicalAnnualDebtService/
);
assert.equal(
  /hasComputedCurrentDebtDscr[\s\S]{0,400}Refinance Stability Classification: Not Assessed/.test(reportSource),
  false
);
assert.match(
  reportSource,
  /Refinance Stability Classification: Source-Limited/
);
assert.match(
  reportSource,
  /const hasCanonicalCurrentRefiDebtBasis[\s\S]*hasCanonicalCurrentRefiDebtBasis && !canRenderRefi/
);
assert.equal(/\b(?:BUY\s*\/\s*SELL\s*\/\s*HOLD|BUY\s+RECOMMENDATION|SELL\s+RECOMMENDATION|HOLD\s+RECOMMENDATION)\b/i.test(reportSource), false);
assert.equal(/classified from the uploaded file names/i.test(reportSource), false);
assert.equal(/purchase (?:price|assumptions?)[\s\S]{0,80}(?:is|equals|represents)\s+appraised value/i.test(reportSource), false);
assert.match(reportSource, /unsupported appraisal\/market survey files are not treated as appraised value/i);

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

const partialSampleOccupancyNoteValue = generatorTest.resolveOccupancyNoteValue(
  {
    is_partial_sample: true,
    summary_row_detected: false,
    occupancy: null,
  },
  {
    occupancy: 0.97,
    totals: {
      summary_row_detected: false,
    },
  }
);
assert.equal(partialSampleOccupancyNoteValue, "Not assessed");
const partialSampleWithDerivedComputedOccupancy = generatorTest.resolveOccupancyNoteValue(
  {
    is_partial_sample: true,
    summary_row_detected: false,
    occupancy: 0.97,
  },
  {
    occupancy: 0.97,
    totals: {
      summary_row_detected: false,
    },
  }
);
assert.equal(partialSampleWithDerivedComputedOccupancy, "Not assessed");

const trustedSummaryOccupancyNoteValue = generatorTest.resolveOccupancyNoteValue(
  {
    is_partial_sample: true,
    summary_row_detected: true,
    occupancy: 0.96,
  },
  {
    occupancy: 0.75,
    totals: {
      summary_row_detected: true,
      occupancy: 0.96,
    },
  }
);
assert.equal(trustedSummaryOccupancyNoteValue, 0.96);

const canonicalGprFromScheduled = generatorTest.resolveCanonicalT12GprValue({
  gross_potential_rent: null,
  gross_scheduled_rent: 1850000,
});
assert.equal(canonicalGprFromScheduled, 1850000);

const t12SummaryFromScheduledGpr = generatorTest.buildT12SummaryHtml(
  {
    gross_potential_rent: null,
    gross_scheduled_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  formatCurrency
);
assert.match(t12SummaryFromScheduledGpr, /\$1,850,000/);

const canonicalMarketTotals = resolveCanonicalRentRollAnnualTotals({
  computedRentRoll: {
    total_units: 48,
    total_market_annual: 21744000,
    unit_mix: [{ count: 48, market_rent: 1888 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_market_annual: 21744000,
    totals: {
      total_units: 48,
      summary_row_detected: true,
      market_rent_annual: 21744000,
      market_rent_monthly: 1812000,
    },
    unit_mix: [{ count: 48, market_rent: 1888 }],
  },
});
assert.equal(canonicalMarketTotals.market.value, 1087488);
assert.equal(canonicalMarketTotals.market.source_path, "row_derived_units.monthly_rent_x_12");
assert.equal(canonicalMarketTotals.market.confidence, "high");
assert.equal(
  canonicalMarketTotals.market.suppressed_values.some((entry) => entry.value === 21744000),
  true
);

const rentRollLeakFreeHtml = generatorTest.buildScreeningIncomeForensicsHtml({
  t12Payload: {
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
    gross_scheduled_rent: 1850000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    total_market_annual: 21744000,
    occupancy: 0.95,
    unit_mix: [{ count: 48, current_rent: 1668.75, market_rent: 1888 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    total_market_annual: 21744000,
    occupancy: 0.95,
    unit_mix: [{ count: 48, current_rent: 1668.75, market_rent: 1888 }],
    totals: {
      total_units: 48,
      occupied_units: 46,
      in_place_rent_annual: 1962456,
      market_rent_annual: 21744000,
      market_rent_monthly: 1812000,
      summary_row_detected: true,
    },
  },
  formatCurrency,
  sourceReconciliationState: {
    status: "source_reconciliation_required",
    publishability_bucket: "disclose_only_publishable",
    rr_annual_in_place: 961200,
    t12_gpr: 1850000,
    variance_pct: -0.48043243243243244,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
});
assert.equal(rentRollLeakFreeHtml.includes("$21,744,000"), false);
assert.match(rentRollLeakFreeHtml, /\$1,087,488/);
assert.match(rentRollLeakFreeHtml, /\$961,200/);

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
assert.equal(rendererCanonicalState.sourceReportCoverageQa?.artifact_inventory?.property_tax_parsed?.has_annual_tax, true);

const invalidPropertyTaxCanonicalState = generatorTest.buildRendererCanonicalState({
  t12Payload: {
    net_operating_income: 650000,
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
  },
  propertyTaxPayload: { annual_tax: 2024 },
});
assert.equal(invalidPropertyTaxCanonicalState.sourceReportCoverageQa?.artifact_inventory?.property_tax_parsed?.has_annual_tax, false);

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
assert.equal(acquisitionOnlyDebtCopy.value, "Not assessed - no current debt document");
assert.match(acquisitionOnlyDebtCopy.explanation, /Proposed acquisition financing is shown separately/i);
assert.match(acquisitionOnlyDebtCopy.explanation, /Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified/i);
assert.equal(acquisitionOnlyDebtCopy.explanation.includes(".."), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(acquisitionOnlyDebtCopy.explanation), false);

const trueCurrentDebtCopy = formatCurrentDebtAssessmentCopy({
  currentDebtState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
    },
    t12Noi: 650000,
  }),
});
assert.notEqual(trueCurrentDebtCopy.value, "Not assessed");
assert.match(trueCurrentDebtCopy.value, /^\d+\.\d{2}x$/);
assert.match(trueCurrentDebtCopy.explanation, /Current debt DSCR computed from verified current debt balance and debt service/i);

const computedScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
  currentDebtState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
    },
    t12Noi: 650000,
  }),
  mortgagePayload: {
    outstanding_balance: 1500000,
    monthly_payment: 9000,
    interest_rate: 0.065,
    amort_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
});
assert.equal(computedScorecardEntry.hasDscrScore, true);
assert.match(computedScorecardEntry.scoreRow.label, /DSCR \(Current Debt\)|DSCR \(Computed\)/i);
assert.match(computedScorecardEntry.scoreRow.value, /^\d+\.\d{2}x$/);

const loanTermOnlyCurrentDebtState = buildCurrentDebtAssessmentState({
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    outstanding_balance: 1500000,
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Noi: 650000,
});
assert.equal(loanTermOnlyCurrentDebtState.current_debt_dscr_status, "computed");
assert.ok(Number.isFinite(loanTermOnlyCurrentDebtState.current_debt_dscr));
const loanTermOnlyScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
  currentDebtState: loanTermOnlyCurrentDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    outstanding_balance: 1500000,
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
});
assert.equal(loanTermOnlyScorecardEntry.hasDscrScore, true);
assert.match(loanTermOnlyScorecardEntry.scoreRow.value, /^\d+\.\d{2}x$/);
assert.notEqual(loanTermOnlyScorecardEntry.scoreRow.value, "Not assessed - no current debt document");
assert.notEqual(loanTermOnlyScorecardEntry.scoreRow.value, "No current debt document provided");
assert.ok(Number.isFinite(loanTermOnlyScorecardEntry.scoreRow.pts));
assert.equal(loanTermOnlyScorecardEntry.scoreRow.max, 10);
assert.notEqual(loanTermOnlyScorecardEntry.scoreRow.pts, 0);
const loanTermOnlyDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: loanTermOnlyCurrentDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    outstanding_balance: 1500000,
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.ok(Number.isFinite(loanTermOnlyDealScoreState.computedDscrForVerdict));
assert.match(loanTermOnlyDealScoreState.dealScoreTableHtml, /Current Debt|DSCR/i);
assert.equal(/Not assessed - no current debt document|No current debt document provided/i.test(loanTermOnlyDealScoreState.dealScoreTableHtml), false);
const loanTermOnlyDscrRow = loanTermOnlyDealScoreState.scoreRows.find((row) =>
  /Current Debt DSCR|DSCR \(Current Debt\)|DSCR \(Computed\)/i.test(String(row?.label || ""))
);
assert.ok(loanTermOnlyDscrRow);
assert.notEqual(loanTermOnlyDscrRow.pts, 0);
const harbourstoneDebtState = {
  current_debt_dscr_status: "computed",
  current_debt_dscr: 1.0551661722053094,
  has_current_debt_document: true,
  has_true_current_debt_balance: true,
  current_debt_service_source: "source_payment",
};
const harbourstoneDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: harbourstoneDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 650000 },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.ok(Number.isFinite(harbourstoneDealScoreState.computedDscrForVerdict));
assert.ok(Math.abs(harbourstoneDealScoreState.computedDscrForVerdict - 1.0551661722053094) < 0.01);
assert.equal(/Not assessed - no current debt document|No current debt document provided/i.test(harbourstoneDealScoreState.dealScoreTableHtml), false);
assert.equal(/Current Debt DSCR[\s\S]{0,120}0\/10/i.test(harbourstoneDealScoreState.dealScoreTableHtml), false);
const derivedComputedDebtState = {
  current_debt_dscr_status: "computed",
  current_debt_dscr: null,
  current_debt_annual_debt_service: 579813.8872489922,
  has_current_debt_document: true,
  has_true_current_debt_balance: true,
  current_debt_service_source: "source_payment",
};
const derivedComputedScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
  currentDebtState: derivedComputedDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 611789.1838458668 },
});
assert.equal(derivedComputedScorecardEntry.hasDscrScore, true);
assert.match(derivedComputedScorecardEntry.scoreRow.value, /^\d+\.\d{2}x$/);
const canonicalLoanSelection = generatorTest.resolveCanonicalLoanTermSheetArtifacts([
  {
    payload: {
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "acquisition_financing_assumption",
      purchase_price: 12000000,
      ltv: 0.7,
      interest_rate: 0.0525,
      amortization_years: 30,
      derived_acquisition_loan_amount: 8400000,
    },
  },
  {
    payload: {
      semantic_doc_role: "loan_term_sheet",
      outstanding_balance: 8750000,
      current_outstanding_balance: 8750000,
      interest_rate: 0.0525,
      amortization_years: 30,
    },
  },
]);
assert.equal(Number(canonicalLoanSelection.currentDebtPayload?.outstanding_balance), 8750000);
const canonicalLoanDebtState = buildCurrentDebtAssessmentState({
  mortgagePayload: null,
  loanTermSheetTermsPayload: canonicalLoanSelection.currentDebtPayload,
  t12Noi: 611789.1838458668,
});
assert.equal(canonicalLoanDebtState.current_debt_dscr_status, "computed");
assert.equal(canonicalLoanDebtState.has_true_current_debt_balance, true);
const canonicalLoanRefiBlockHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.0525,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05],
    stress_cap_rate_bps: [0],
    stress_rate_bps: [0],
  },
  t12Payload: { net_operating_income: 611789.1838458668 },
  currentDebtAssessmentState: canonicalLoanDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: canonicalLoanSelection.currentDebtPayload,
});
assert.equal(/No current debt document provided|Not assessed - no current debt document|no true current debt balance was verified/i.test(canonicalLoanRefiBlockHtml), false);
const canonicalLoanDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: canonicalLoanDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: canonicalLoanSelection.currentDebtPayload,
  t12Payload: { net_operating_income: 611789.1838458668 },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.equal(/No current debt document provided|Not assessed - no current debt document|no true current debt balance was verified/i.test(canonicalLoanDealScoreState.dealScoreTableHtml), false);

const loanTermOnlyRefiBasis = generatorTest.resolveCanonicalRefiDebtBasis({
  currentDebtState: loanTermOnlyCurrentDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05, -0.1],
    stress_cap_rate_bps: [0, 50],
    stress_rate_bps: [0, 100],
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(loanTermOnlyRefiBasis.isAcquisitionOnly, false);
assert.ok(Number.isFinite(loanTermOnlyRefiBasis.dscr));
const mixedDebtBasis = generatorTest.resolveCanonicalRefiDebtBasis({
  currentDebtState: {
    current_debt_dscr_status: "computed",
    has_true_current_debt_balance: true,
    current_debt_balance: 1500000,
    current_debt_annual_debt_service: 579813.8872489922,
    current_debt_dscr: 1.0551661722053094,
    current_debt_limitation_reason_code: null,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    purchase_price: 3000000,
    ltv: 0.75,
    derived_acquisition_loan_amount: 2250000,
    interest_rate: 0.071,
    amortization_years: 30,
  },
  financials: {
    refi_debt_balance: 2250000,
    refi_interest_rate: 0.071,
    refi_amort_years: 30,
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05],
    stress_cap_rate_bps: [0],
    stress_rate_bps: [0],
  },
  t12Payload: { net_operating_income: 611789.1838458668 },
});
assert.equal(mixedDebtBasis.isAcquisitionOnly, false);
assert.equal(mixedDebtBasis.debtBalance, 1500000);
const mixedRefiSufficiencyHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {
    refi_debt_balance: 2250000,
    refi_interest_rate: 0.071,
    refi_amort_years: 30,
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05],
    stress_cap_rate_bps: [0],
    stress_rate_bps: [0],
  },
  t12Payload: { net_operating_income: 611789.1838458668 },
  currentDebtAssessmentState: {
    current_debt_dscr_status: "computed",
    has_true_current_debt_balance: true,
    current_debt_balance: 1500000,
    current_debt_annual_debt_service: 579813.8872489922,
    current_debt_dscr: 1.0551661722053094,
    current_debt_limitation_reason_code: null,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    purchase_price: 3000000,
    ltv: 0.75,
    derived_acquisition_loan_amount: 2250000,
    interest_rate: 0.071,
    amortization_years: 30,
  },
});
assert.match(mixedRefiSufficiencyHtml, /\$1,500,000/);
assert.equal(/\$2,250,000/.test(mixedRefiSufficiencyHtml), false);
assert.equal(/no current debt|not assessed|no verified current debt document/i.test(mixedRefiSufficiencyHtml), false);
const loanTermOnlyRefiModel = generatorTest.buildRefiStabilityModel({
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05, -0.1],
    stress_cap_rate_bps: [0, 50],
    stress_rate_bps: [0, 100],
  },
  currentDebtState: loanTermOnlyCurrentDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: { net_operating_income: 650000 },
  formatValue: formatCurrency,
});
assert.ok(loanTermOnlyRefiModel?.tier);
assert.equal(/Not Assessed|no current debt document provided/i.test(String(loanTermOnlyRefiModel?.html || "")), false);

const acquisitionOnlyRefiBasis = generatorTest.resolveCanonicalRefiDebtBasis({
  currentDebtState: buildCurrentDebtAssessmentState({
    mortgagePayload: null,
    loanTermSheetTermsPayload: {
      purchase_price: 2000000,
      ltv: 0.75,
      interest_rate: 0.065,
      amortization_years: 30,
      derived_acquisition_loan_amount: 1500000,
    },
    t12Noi: 650000,
  }),
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    purchase_price: 2000000,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
    derived_acquisition_loan_amount: 1500000,
  },
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(acquisitionOnlyRefiBasis.hasTrueCurrentDebtBalance, false);
assert.equal(acquisitionOnlyRefiBasis.annualDebtService, null);
assert.equal(acquisitionOnlyRefiBasis.dscr, null);

const mortgageOnlyNonCanonicalRefiBasis = generatorTest.resolveCanonicalRefiDebtBasis({
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "missing_current_debt_support",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
    monthly_payment: 9500,
  },
  loanTermSheetTermsPayload: null,
  financials: {},
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(mortgageOnlyNonCanonicalRefiBasis.annualDebtService, null);
assert.equal(mortgageOnlyNonCanonicalRefiBasis.dscr, null);
assert.equal(acquisitionOnlyRefiBasis.isAcquisitionOnly, true);

const missingRefiAssumptionSufficiencyHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    stress_noi_shocks: [-0.05, -0.1],
    stress_cap_rate_bps: [0, 50],
    stress_rate_bps: [0, 100],
  },
  currentDebtAssessmentState: loanTermOnlyCurrentDebtState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.match(missingRefiAssumptionSufficiencyHtml, /Refinance cap rate/i);
assert.match(missingRefiAssumptionSufficiencyHtml, /Missing/i);
assert.match(missingRefiAssumptionSufficiencyHtml, /Refinance Stability Classification not produced due to insufficient refinance inputs/i);

const retest9CurrentDebtState = buildCurrentDebtAssessmentState({
  mortgagePayload: {
    outstanding_balance: 1500000,
    annual_debt_service: 91549.29577464789,
    interest_rate: 0.055,
    amort_years: 25,
  },
  t12Noi: 650000,
});
const retest9DealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: retest9CurrentDebtState,
  mortgagePayload: {
    outstanding_balance: 1500000,
    annual_debt_service: 91549.29577464789,
    interest_rate: 0.055,
    amort_years: 25,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  sourceReconciliationState: {
    status: "source_reconciliation_required",
    publishability_bucket: "disclose_only_publishable",
    rr_annual_in_place: 961200,
    t12_gpr: 1850000,
    variance_pct: -0.48043243243243244,
    has_material_variance: true,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
});
assert.equal(retest9DealScoreState.score, 95);
assert.equal(retest9DealScoreState.displayVerdict?.label, "Review - Source Reconciliation Disclosure");
assert.equal(retest9DealScoreState.displayVerdict?.score_label, "Within Underwriting Parameters");
assert.equal(retest9DealScoreState.displayVerdict?.cap_reason_code, "source_reconciliation_disclosure");
assert.match(retest9DealScoreState.displayVerdict?.cap_explanation || "", /rent-roll\/T12 reconciliation variance described in Data Coverage/i);
assert.equal(retest9DealScoreState.dealScoreTableHtml.includes("Within Underwriting Parameters"), false);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Review - Source Reconciliation Disclosure/);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Composite Score: 95 \/ 100/);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Composite score reflects available operating, occupancy, rent-gap, and current-debt metrics only/i);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Rent-roll\/T12 reconciliation remains unresolved/i);
assert.match(retest9DealScoreState.dealScoreTableHtml, /The score should not be read as refinance-ready or unconstrained/i);

const cleanStrongDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: retest9CurrentDebtState,
  mortgagePayload: {
    outstanding_balance: 1500000,
    annual_debt_service: 91549.29577464789,
    interest_rate: 0.055,
    amort_years: 25,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.equal(cleanStrongDealScoreState.score, 95);
assert.equal(cleanStrongDealScoreState.displayVerdict?.label, "Within Underwriting Parameters");
assert.equal(cleanStrongDealScoreState.dealScoreTableHtml.includes("Review - Source Reconciliation Disclosure"), false);
const constrainedDscrDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: {
    current_debt_dscr_status: "computed",
    current_debt_dscr: 1.1,
    current_debt_annual_debt_service: 590909.0909,
    has_true_current_debt_balance: true,
    has_current_debt_document: true,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: null,
  t12Payload: {
    net_operating_income: 650000,
  },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.equal(constrainedDscrDealScoreState.score, 83);
assert.equal(constrainedDscrDealScoreState.displayVerdict?.label, "Review - Debt Coverage Constraint");
assert.equal(constrainedDscrDealScoreState.displayVerdict?.score_label, "Within Underwriting Parameters");
assert.equal(constrainedDscrDealScoreState.displayVerdict?.cap_reason_code, "debt_coverage_constraint");
assert.equal(constrainedDscrDealScoreState.dealScoreTableHtml.includes("Within Underwriting Parameters"), false);
assert.match(constrainedDscrDealScoreState.dealScoreTableHtml, /Review - Debt Coverage Constraint/);
assert.match(constrainedDscrDealScoreState.dealScoreTableHtml, /Current debt DSCR is below 1\.25x/i);
assert.equal(/Current debt is not assessed/i.test(constrainedDscrDealScoreState.dealScoreTableHtml), false);

const constrainedDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
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
  },
  sourceReconciliationState: {
    status: "source_reconciliation_required",
    publishability_bucket: "disclose_only_publishable",
    rr_annual_in_place: 961200,
    t12_gpr: 1850000,
    variance_pct: -0.48043243243243244,
    has_material_variance: true,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
});
assert.equal(constrainedDealScoreState.displayVerdict?.label, "Review - Source Reconciliation Disclosure");
assert.equal(constrainedDealScoreState.displayVerdict?.score_label, "Within Underwriting Parameters");
assert.equal(constrainedDealScoreState.score, 94);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Current debt is not assessed/i);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Rent-roll\/T12 reconciliation remains unresolved/i);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /The score should not be read as refinance-ready or unconstrained/i);
assert.equal(/Current Debt DSCR[\s\S]{0,120}0\/10/i.test(constrainedDealScoreState.dealScoreTableHtml), false);

const acquisitionOnlyScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
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
  },
});
assert.equal(acquisitionOnlyScorecardEntry.hasDscrScore, false);
assert.equal(acquisitionOnlyScorecardEntry.scoreRow, null);

const acquisitionOnlyDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
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
  t12Payload: { net_operating_income: 650000 },
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    rr_annual_in_place: 1087488,
    t12_gpr: 1087488,
    variance_pct: 0,
    has_material_variance: false,
    customer_delivery_impact: "none",
    public_outreach_impact: "none",
    source_reconciliation_disclosure: null,
  },
});
assert.equal(/Not assessed - no current debt document|No current debt document provided/i.test(acquisitionOnlyDealScoreState.dealScoreTableHtml), false);
assert.equal(/Current Debt DSCR[\s\S]{0,120}0\/10/i.test(acquisitionOnlyDealScoreState.dealScoreTableHtml), false);
assert.equal(/Current Debt DSCR[\s\S]{0,120}(?:Not modeled|N\/A)/i.test(acquisitionOnlyDealScoreState.dealScoreTableHtml), false);

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
  documentSources: [
    { original_filename: "Final.pdf", doc_type: "t12", parse_status: "parsed" },
    { original_filename: "Market Survey.pdf", doc_type: "rent_roll", parse_status: "parsed" },
    { original_filename: "Historical CapEx Note.pdf", doc_type: "renovation", semantic_doc_role: "renovation_budget", parse_status: "parsed" },
    { original_filename: "Broker email background context.msg", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "unclassified_support_document" },
    { original_filename: "Unsupported Appraisal Summary.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
    { original_filename: "Unsupported Market Survey.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
    { original_filename: "Unsupported Phase I ESA.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
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
  hasForwardLookingRenovationInputs: false,
});

assert.match(screeningDataCoverageHtml, /Core financial inputs/i);
assert.equal(screeningDataCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(screeningDataCoverageHtml), false);
assert.match(screeningDataCoverageHtml, /Document Treatment Summary/i);
assert.match(screeningDataCoverageHtml, /Modeled Inputs/i);
assert.match(screeningDataCoverageHtml, /Displayed \/ Limited Use/i);
assert.match(screeningDataCoverageHtml, /Listed but Not Quantitatively Modeled/i);
assert.match(screeningDataCoverageHtml, /Historical capital items are displayed for context only/i);
assert.match(screeningDataCoverageHtml, /Final\.pdf/i);
assert.match(screeningDataCoverageHtml, /Market Survey\.pdf/i);
assert.match(screeningDataCoverageHtml, /Historical CapEx Note\.pdf/i);
assert.match(screeningDataCoverageHtml, /Unsupported Appraisal Summary\.pdf/i);
assert.match(screeningDataCoverageHtml, /Unsupported Market Survey\.pdf/i);
assert.match(screeningDataCoverageHtml, /Unsupported Phase I ESA\.pdf/i);
assert.match(screeningDataCoverageHtml, /Broker email background context\.msg/i);

const historicalCapexDisplayCopy = generatorTest.buildRenovationDisplayCopy({
  renovationDisplayMode: "historical_only",
});
assert.equal(historicalCapexDisplayCopy.section_title, "Historical Capital Expenditure Summary");
assert.equal(historicalCapexDisplayCopy.budget_card_title, "Historical Capital Items");
assert.match(historicalCapexDisplayCopy.interpretation, /Historical capital items are displayed for context only/i);
assert.match(historicalCapexDisplayCopy.interpretation, /does not model renovation ROI, rent lift, payback, or implementation schedule/i);

const budgetOnlyRenovationDisplayCopy = generatorTest.buildRenovationDisplayCopy({
  renovationDisplayMode: "budget_only_no_roi",
});
assert.equal(budgetOnlyRenovationDisplayCopy.section_title, "Renovation Budget Summary - No ROI Inputs Provided");
assert.equal(budgetOnlyRenovationDisplayCopy.budget_card_title, "Renovation Budget Items");
assert.equal(budgetOnlyRenovationDisplayCopy.show_execution_card, false);
assert.match(budgetOnlyRenovationDisplayCopy.budget_note, /Budget and scope items are displayed from the uploaded renovation budget/i);
assert.match(budgetOnlyRenovationDisplayCopy.interpretation, /does not model renovation ROI, rent lift, payback, phasing, cost recovery, or implementation schedule/i);

const forwardLookingRenovationDisplayCopy = generatorTest.buildRenovationDisplayCopy({
  renovationDisplayMode: "forward_looking_modelable",
});
assert.equal(forwardLookingRenovationDisplayCopy.section_title, "Renovation Strategy & Capital Plan");
assert.equal(forwardLookingRenovationDisplayCopy.budget_card_title, "Renovation Budget Breakdown");
assert.equal(forwardLookingRenovationDisplayCopy.show_execution_card, true);
const financialsOnlyRenovationMode = generatorTest.resolveRenovationDisplayMode({
  financials: {
    renovation_total_budget: 325000,
    renovation_rent_lift: "150",
    renovation_timing_or_phasing: "12 months",
    renovation_roi: "12%",
  },
  renovationPayload: null,
  documentSources: [{ original_filename: "Northbank Renovation Budget.pdf" }],
  hasForwardLookingRenovationInputs: true,
});
assert.equal(financialsOnlyRenovationMode, null);

const frameworkSensitivityDisplayCopy = generatorTest.buildFrameworkSensitivityDisplayCopy();
assert.equal(frameworkSensitivityDisplayCopy.dcf_section_title, "DCF Framework Sensitivity");
assert.equal(frameworkSensitivityDisplayCopy.scenario_section_title, "Scenario Analysis & Five-Year Outlook - Framework Sensitivity");
assert.equal(frameworkSensitivityDisplayCopy.dcf_value_label, "Framework-Indicated Present Value (Sum of PVs)");
assert.match(frameworkSensitivityDisplayCopy.dcf_framework_note, /framework sensitivity, not an appraisal/i);
assert.match(frameworkSensitivityDisplayCopy.dcf_framework_note, /unsupported appraisal or market survey files/i);

const documentTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Final.pdf", doc_type: "t12", parse_status: "parsed" },
    { original_filename: "Market Survey.pdf", doc_type: "rent_roll", parse_status: "parsed" },
    { original_filename: "Historical CapEx Note.pdf", doc_type: "renovation", semantic_doc_role: "renovation_budget", parse_status: "parsed" },
    { original_filename: "Broker email background context.msg", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "unclassified_support_document" },
    { original_filename: "Unsupported Appraisal Summary.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
    { original_filename: "Unsupported Market Survey.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
    { original_filename: "Unsupported Phase I ESA.pdf", doc_type: "supporting_documents_unclassified", parse_status: "parsed_with_warnings", parse_error: "doc_type_unclassified" },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
    },
    t12Noi: 650000,
  }),
  hasForwardLookingRenovationInputs: false,
});
assert.match(documentTreatmentHtml, /Modeled Inputs/i);
assert.match(documentTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(documentTreatmentHtml, /Listed but Not Quantitatively Modeled/i);
assert.match(documentTreatmentHtml, /Unsupported Appraisal Summary\.pdf/i);
assert.match(documentTreatmentHtml, /Historical capital items are displayed for context only/i);
assert.match(documentTreatmentHtml, /data-treatment-source="metadata"/i);
assert.equal(/classified from the uploaded file names/i.test(documentTreatmentHtml), false);
assert.equal(/public sample|high[- ]value outreach|advisory only|docraptor|vendor/i.test(documentTreatmentHtml), false);

const metadataFirstOverFilenameHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Rent Roll.xlsx",
      doc_type: "supporting_documents_unclassified",
      display_doc_type: "Supporting Document",
      semantic_doc_role: "supporting_documents_unclassified",
      semantic_doc_display_label: "supporting_documents_unclassified",
      parse_status: "parsed_with_warnings",
      parse_error: "doc_type_unclassified",
    },
  ],
});
assert.match(metadataFirstOverFilenameHtml, /Listed but Not Quantitatively Modeled/i);
assert.equal(/Structured rent roll input/i.test(metadataFirstOverFilenameHtml), false);

const budgetOnlyDocumentTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Northbank Reno Budget.pdf",
      doc_type: "renovation",
      display_doc_type: "Renovation Budget",
      semantic_doc_role: "renovation_budget",
      semantic_doc_display_label: "renovation_budget",
      parse_status: "parsed",
    },
  ],
  renovationDisplayMode: "budget_only_no_roi",
});
assert.match(budgetOnlyDocumentTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(budgetOnlyDocumentTreatmentHtml, /Budget\/scope only; no ROI\/payback\/rent-lift modeling/i);

const budgetOnlyRenovationCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
  financials: {
    renovation_total_budget: 291500,
    renovation_budget_rows: [
      { category: "Exterior", scope_of_work: "Roof repairs", estimated_cost: 120000 },
      { category: "Interior", scope_of_work: "Unit turns", estimated_cost: 171500 },
    ],
    renovation_budget_note: "Structured renovation budget categories and costs only.",
  },
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
  documentSources: [
    {
      original_filename: "Northbank Reno Budget.pdf",
      doc_type: "renovation",
      display_doc_type: "Renovation Budget",
      semantic_doc_role: "renovation_budget",
      semantic_doc_display_label: "renovation_budget",
      parse_status: "parsed",
    },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
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
  hasForwardLookingRenovationInputs: false,
  renovationDisplayMode: "budget_only_no_roi",
});
assert.match(budgetOnlyRenovationCoverageHtml, /Budget\/scope only; no ROI\/payback\/rent-lift modeling/i);
assert.equal(budgetOnlyRenovationCoverageHtml.includes("Historical Capital Expenditure Summary"), false);

const filenameFallbackHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Rent Roll.xlsx" },
  ],
});
assert.match(filenameFallbackHtml, /Displayed \/ Limited Use/i);
assert.equal(/Structured rent roll input/i.test(filenameFallbackHtml), false);
assert.match(filenameFallbackHtml, /data-treatment-source="filename_fallback"/i);
assert.equal(/classified from the uploaded file names/i.test(filenameFallbackHtml), false);
const filenameOnlyRenovationTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "CapEx Plan - Historical.pdf" },
  ],
  renovationDisplayMode: null,
});
assert.equal(
  /<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]*CapEx Plan - Historical\.pdf/i.test(filenameOnlyRenovationTreatmentHtml),
  false
);
assert.match(filenameOnlyRenovationTreatmentHtml, /Displayed \/ Limited Use|Listed but Not Quantitatively Modeled/i);
assert.equal(/Renovation Strategy & Capital Plan/i.test(filenameOnlyRenovationTreatmentHtml), false);
const unvalidatedStructuredDocTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "T12 Statement.pdf",
      doc_type: "t12",
      display_doc_type: "T12",
      semantic_doc_role: "t12",
      semantic_doc_display_label: "t12",
      parse_status: "parsed_with_warnings",
      parse_error: "totals_incomplete",
    },
  ],
});
assert.match(unvalidatedStructuredDocTreatmentHtml, /Displayed \/ Limited Use/i);
assert.equal(/Structured operating input/i.test(unvalidatedStructuredDocTreatmentHtml), false);

const propertyTaxUnvalidatedTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "PropertyTaxNotice.pdf",
      doc_type: "property_tax",
      display_doc_type: "Property Tax",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: {
    annual_tax: 2024,
  },
});
assert.match(propertyTaxUnvalidatedTreatmentHtml, /Displayed \/ Limited Use/i);
assert.equal(/Structured property tax input/i.test(propertyTaxUnvalidatedTreatmentHtml), false);

const propertyTaxValidatedTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "PropertyTaxNotice.pdf",
      doc_type: "property_tax",
      display_doc_type: "Property Tax",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: {
    annual_tax: 18950,
  },
});
assert.match(propertyTaxValidatedTreatmentHtml, /Modeled Inputs/i);
assert.match(propertyTaxValidatedTreatmentHtml, /Structured property tax input/i);
const acquisitionSizingHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 2000000,
    ltv: 0.75,
    derived_acquisition_loan_amount: 1500000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.match(acquisitionSizingHtml, /Proposed Acquisition DSCR/i);
assert.equal(/Current Debt DSCR/i.test(acquisitionSizingHtml), false);
assert.match(acquisitionSizingHtml, /not current outstanding debt/i);
assert.match(acquisitionSizingHtml, /does not represent appraised value/i);
assert.equal(/BUY|SELL|HOLD/i.test(acquisitionSizingHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]*Unsupported (?:Appraisal Summary|Market Survey)\.pdf/i.test(documentTreatmentHtml),
  false
);

const liveCurrentDebtModeledCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
  documentSources: [
    { original_filename: "Debt Package.pdf", doc_type: "mortgage_statement", display_doc_type: "Current Mortgage Statement", parse_status: "parsed" },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
      outstanding_balance: 1500000,
      monthly_payment: 9000,
      interest_rate: 0.065,
      amort_years: 30,
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
  hasForwardLookingRenovationInputs: false,
});
assert.match(liveCurrentDebtModeledCoverageHtml, /Structured current debt input/i);
assert.match(liveCurrentDebtModeledCoverageHtml, /Modeled Inputs/i);
const reconciliationDisclosureCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
  t12Payload: {
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1087488,
    total_market_annual: 1117800,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1087488,
    total_market_annual: 1117800,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  financials: {},
  effectiveReportMode: "screening_v1",
  sourceReconciliationState: {
    status: "source_reconciliation_required",
    publishability_bucket: "disclose_only_publishable",
    variance_pct: 0.06,
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
  sectionEligibility: {
    source_constrained_section_count: 0,
  },
});
assert.match(reconciliationDisclosureCoverageHtml, /SOURCE RECONCILIATION DISCLOSURE/i);
assert.equal(/Fully Verified/i.test(reconciliationDisclosureCoverageHtml), false);
assert.equal(/public sample|high[- ]value outreach|advisory only|docraptor|vendor/i.test(reconciliationDisclosureCoverageHtml), false);

const liveCurrentDebtLimitedCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
  documentSources: [
    { original_filename: "Debt Package.pdf", doc_type: "mortgage_statement", display_doc_type: "Current Mortgage Statement", parse_status: "parsed_with_warnings", parse_error: "no_current_balance" },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: {
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
  hasForwardLookingRenovationInputs: false,
});
assert.match(liveCurrentDebtLimitedCoverageHtml, /Current debt support only; no verified current debt balance/i);
assert.equal(/Structured current debt input/i.test(liveCurrentDebtLimitedCoverageHtml), false);

const sourceReconciliationFixture = {
  status: "source_reconciliation_required",
  publishability_bucket: "disclose_only_publishable",
  rr_annual_in_place: 1962456,
  t12_gpr: 1850000,
  variance_pct: 0.06078702702702703,
  has_material_variance: true,
  customer_delivery_impact: "disclose_only",
  public_outreach_impact: "block_until_review",
  source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
};
const sourceReconciliationRenderState = buildSourceReconciliationRenderState({
  sourceReconciliationState: sourceReconciliationFixture,
});
assert.equal(sourceReconciliationRenderState.renderable, true);
assert.equal(sourceReconciliationRenderState.variance_display, "+6.1%");
assert.equal(sourceReconciliationRenderState.source_reconciliation_disclosure, "InvestorIQ has not reconciled this variance and does not infer the cause.");
assert.equal(sourceReconciliationRenderState.variance_pct, 0.06078702702702703);

const rendererReconciliationState = generatorTest.buildRendererCanonicalState({
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
  },
  t12Payload: {
    gross_potential_rent: 1850000,
    gross_scheduled_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
});
assert.equal(rendererReconciliationState.sourceReconciliationState?.variance_pct, 0.06078702702702703);
assert.equal(
  buildSourceReconciliationRenderState({
    sourceReconciliationState: rendererReconciliationState.sourceReconciliationState,
  }).variance_display,
  "+6.1%"
);

const unsafeSourceReconciliationRenderState = buildSourceReconciliationRenderState({
  sourceReconciliationState: {
    ...sourceReconciliationFixture,
    publishability_bucket: "disclose_only_publishable",
    variance_pct: -0.48,
  },
});
assert.equal(unsafeSourceReconciliationRenderState.renderable, false);
assert.equal(unsafeSourceReconciliationRenderState.variance_display, null);
assert.equal(unsafeSourceReconciliationRenderState.variance_pct, null);

const conflictSourceReconciliationState = buildSourceReconciliationState({
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    annual_in_place_rent: 961200,
    total_annual_in_place: 961200,
    summary_row_detected: false,
    unit_mix: [{ count: 48, current_rent: 1668.75 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    annual_in_place_rent: 1962456,
    unit_mix: [{ count: 48, current_rent: 1668.75 }],
    totals: {
      summary_row_detected: true,
      in_place_rent_annual: 1962456,
      current_rent_annual: 1962456,
      in_place_rent_monthly: 163537,
      current_rent_monthly: 163537,
    },
  },
  t12Payload: {
    gross_potential_rent: 1850000,
    gross_scheduled_rent: 1850000,
  },
  sourceReportCoverageQa: {
    artifact_inventory: {
      rent_roll_parsed: { present: true },
      t12_parsed: { present: true, has_core_totals: true },
    },
    rendered_text_signals: [],
    deterministic_flags: [],
  },
});
assert.equal(conflictSourceReconciliationState.rr_annual_in_place, 961200);
assert.equal(conflictSourceReconciliationState.t12_gpr, 1850000);
assert.equal(conflictSourceReconciliationState.variance_pct, -0.48043243243243244);
assert.equal(conflictSourceReconciliationState.source_selection?.rr_annual_in_place?.source_path, "row_derived_units.monthly_rent_x_12");
assert.equal(conflictSourceReconciliationState.source_selection?.rr_annual_in_place?.trusted_summary_totals, true);
assert.equal(conflictSourceReconciliationState.source_selection?.rr_annual_in_place?.selected_reason, "row_derived_units_selected");
assert.equal(
  conflictSourceReconciliationState.source_selection?.rr_annual_in_place?.suppressed_values?.some((entry) => entry.value === 1962456),
  true
);

const conflictSourceReconciliationRenderState = buildSourceReconciliationRenderState({
  sourceReconciliationState: conflictSourceReconciliationState,
});
assert.equal(conflictSourceReconciliationRenderState.renderable, true);
assert.equal(conflictSourceReconciliationRenderState.variance_display, "-48.0%");

const conflictFinalHtml = generatorTest.applyFinalSourceReconciliationRenderGuard(
  "<div><table><tr><td>Rent Roll vs T12 GPR Variance</td><td>+6.1%</td></tr></table><p>Rent roll annualized rent is +6.1% vs T12 GPR.</p></div>",
  conflictSourceReconciliationState
);
assert.equal(conflictFinalHtml.replaced_or_suppressed, true);
assert.equal(conflictFinalHtml.stale_minus_48_count_after > 0, true);
assert.equal(conflictFinalHtml.html.includes("+6.1%"), false);
assert.equal(conflictFinalHtml.matched_displays_before.includes("+6.1%"), true);
assert.equal(conflictFinalHtml.matched_displays_after.includes("-48.0%"), true);
assert.match(conflictFinalHtml.html, /-48\.0%/);

const finalHtmlBeforeGuard = [
  "<div><table><tr><td>Rent Roll vs T12 GPR Variance</td><td>-48.0%</td></tr></table></div>",
  "<p>Rent roll annualized rent is -48.0% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
  "<li>Rent Roll vs T12 GPR -48.0%</li>",
].join("\n");
const finalHtmlGuardResult = generatorTest.applyFinalSourceReconciliationRenderGuard(
  finalHtmlBeforeGuard,
  sourceReconciliationFixture
);
assert.equal(finalHtmlGuardResult.replaced_or_suppressed, true);
assert.equal(finalHtmlGuardResult.stale_minus_48_count_before > 0, true);
assert.equal(finalHtmlGuardResult.stale_minus_48_count_after, 0);
assert.equal(finalHtmlGuardResult.matched_snippets_before.some((entry) => /-48\.0%/.test(entry)), true);
assert.equal(finalHtmlGuardResult.matched_snippets_after.some((entry) => /-48\.0%/.test(entry)), false);
assert.match(finalHtmlGuardResult.html, /Rent Roll vs T12 GPR Variance.*\+6\.1%/s);
assert.match(finalHtmlGuardResult.html, /Rent roll annualized rent is \+6\.1% vs T12 GPR/i);
assert.equal(finalHtmlGuardResult.html.includes("-48.0%"), false);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: [],
    sourceReportCoverageQa: {
      qa_status: "pass",
      source_reconciliation_state: sourceReconciliationFixture,
    },
    html: finalHtmlGuardResult.html,
  }).violations.some((v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"),
  false
);

const reconciliationIncomeHtml = generatorTest.buildScreeningIncomeForensicsHtml({
  t12Payload: {
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
    gross_scheduled_rent: 1850000,
    income_lines: [
      { label: "Parking Income", amount: 27000 },
      { label: "Laundry Income", amount: 18400 },
      { label: "Other Income", amount: 12500 },
    ],
    expense_lines: [
      { label: "Repairs & Maintenance", amount: 78000 },
      { label: "Utilities", amount: 54000 },
      { label: "Payroll", amount: 92000 },
    ],
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
    units: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
    totals: {
      total_units: 48,
      occupied_units: 46,
      in_place_rent_annual: 1962456,
      market_rent_annual: 1117800,
      summary_row_detected: true,
    },
  },
  formatCurrency,
  sourceReconciliationState: sourceReconciliationFixture,
});
assert.match(reconciliationIncomeHtml, /Rent Roll vs T12 GPR variance: \+6\.1%\. See Data Coverage\./i);
assert.equal(reconciliationIncomeHtml.includes("-48.0%"), false);

const reconciliationNoiHtml = generatorTest.buildScreeningNoiStabilityHtml({
  t12Payload: {
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
  },
  formatCurrency,
  sourceReconciliationState: sourceReconciliationFixture,
});
assert.match(reconciliationNoiHtml, /Rent Roll vs T12 GPR Variance/i);
assert.equal(reconciliationNoiHtml.includes("+6.1%"), true);
assert.match(reconciliationNoiHtml, /Rent Roll vs T12 GPR variance: \+6\.1%\. See Data Coverage\./i);
assert.equal(reconciliationNoiHtml.includes("-48.0%"), false);
const partialPayloadNoiHtml = generatorTest.buildScreeningNoiStabilityHtml({
  t12Payload: {
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
  },
  rentRollPayload: {
    is_partial_sample: true,
    total_units: 48,
    occupied_units: 46,
    units: [{ unit: "1A", in_place_rent: 1888 }],
    totals: {
      total_units: 48,
      occupied_units: 46,
      summary_row_detected: false,
    },
  },
  formatCurrency,
  sourceReconciliationState: sourceReconciliationFixture,
});
assert.equal(partialPayloadNoiHtml.includes("Vacancy Buffer"), false);
assert.equal(partialPayloadNoiHtml.includes("Current Occupancy"), false);
const partialPayloadRentRollDistributionHtml = generatorTest.buildScreeningRentRollDistributionHtml({
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
  },
  rentRollPayload: {
    is_partial_sample: true,
    total_units: 48,
    occupied_units: 46,
    units: [{ unit: "1A", in_place_rent: 1888 }],
    totals: {
      total_units: 48,
      occupied_units: 46,
      summary_row_detected: false,
    },
  },
  formatCurrency,
});
assert.equal(partialPayloadRentRollDistributionHtml, "");

const suppressedReconciliationIncomeHtml = generatorTest.buildScreeningIncomeForensicsHtml({
  t12Payload: {
    gross_potential_rent: 1850000,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
    gross_scheduled_rent: 1850000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    occupancy: 0.95,
  },
  formatCurrency,
  sourceReconciliationState: {
    ...sourceReconciliationFixture,
    publishability_bucket: "system_contract_failure",
  },
});
assert.equal(suppressedReconciliationIncomeHtml.includes("Rent roll annualized rent is"), false);
assert.equal(suppressedReconciliationIncomeHtml.includes("-48.0%"), false);

const acquisitionOnlyCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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

assert.match(acquisitionOnlyCoverageHtml, /Proposed acquisition financing is shown separately/i);
assert.match(acquisitionOnlyCoverageHtml, /Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified/i);
assert.equal(acquisitionOnlyCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(acquisitionOnlyCoverageHtml), false);

const publishedReportStoragePath = generatorTest.buildReportStoragePath({
  effectiveUserId: "user_123",
  reportSeed: "report_456",
});
assert.equal(publishedReportStoragePath, "user_123/report_456.pdf");
assert.equal(generatorTest.isValidReportStoragePath(publishedReportStoragePath), true);
assert.equal(generatorTest.isValidReportStoragePath("pending"), false);
assert.equal(generatorTest.isValidReportStoragePath(""), false);
assert.equal(generatorTest.isValidReportStoragePath("user_123/report_456.txt"), false);
assert.doesNotThrow(() =>
  generatorTest.assertValidReportPublicationInsert({
    storagePath: publishedReportStoragePath,
    reportType: "underwriting",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    context: { jobId: "job-1" },
  })
);
const assertPublicationGuardFailure = (fn, expectedMessage) => {
  try {
    fn();
    assert.fail("Expected report publication guard to throw");
  } catch (err) {
    assert.equal(err.code, "REPORT_GENERATION_FAILED");
    if (expectedMessage) {
      assert.match(String(err.message || ""), expectedMessage);
    }
  }
};

assertPublicationGuardFailure(
  () =>
    generatorTest.assertValidReportPublicationInsert({
      storagePath: "",
      reportType: "underwriting",
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
      context: { jobId: "job-2" },
    }),
  /Missing valid report storage path/i
);
assertPublicationGuardFailure(
  () =>
    generatorTest.assertValidReportPublicationInsert({
      storagePath: null,
      reportType: "underwriting",
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
      context: { jobId: "job-3" },
    }),
  /Missing valid report storage path/i
);
assertPublicationGuardFailure(
  () =>
    generatorTest.assertValidReportPublicationInsert({
      storagePath: publishedReportStoragePath,
      reportType: "underwriting",
      deliveryGateStatus: "admin_review_required",
      holdDelivery: true,
      context: { jobId: "job-4" },
    }),
  /Report publication blocked before storage insert/i
);

console.log("generate-client-report rent-roll smoke PASS");
