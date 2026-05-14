import assert from "assert";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { __test__: generatorTest } = await import("../../api/generate-client-report.js");
const {
  buildCurrentDebtAssessmentState,
  formatCurrentDebtAssessmentCopy,
  buildSourceReconciliationRenderState,
} = await import("../../api/_lib/report-surface-contracts.js");
const { buildReportContractQa } = await import("../../api/_lib/report-contract-qa.js");

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;

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
assert.equal(acquisitionOnlyScorecardEntry.scoreRow.label, "Current Debt DSCR");
assert.equal(acquisitionOnlyScorecardEntry.scoreRow.value, "Not assessed");

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
});

assert.match(screeningDataCoverageHtml, /Core financial inputs/i);
assert.equal(screeningDataCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(screeningDataCoverageHtml), false);

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
assert.match(reconciliationIncomeHtml, /Rent roll annualized rent is \+6\.1% vs T12 GPR/i);
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
assert.match(reconciliationNoiHtml, /Rent roll annualized rent is \+6\.1% vs T12 GPR/i);
assert.equal(reconciliationNoiHtml.includes("-48.0%"), false);

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
