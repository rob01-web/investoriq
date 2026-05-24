import assert from "node:assert/strict";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";
import { buildQaActionPlan } from "../../api/_lib/qa-action-plan.js";
import { sanitizeFinalCustomerHtml } from "../../api/_lib/report-surface-contracts.js";

const baseArtifacts = [
  {
    type: "t12_parsed",
    payload: {
      effective_gross_income: 1000000,
      total_operating_expenses: 400000,
      net_operating_income: 600000,
    },
  },
  {
    type: "rent_roll_parsed",
    payload: {
      total_units: 10,
      occupancy: 1,
    },
  },
];

const baseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true, unit_count: 10, occupancy: 1 },
  },
};

const honestLumpSum = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Income & Expense Summary (Lump-Sum T12)</h2>",
    "<p>No line-item detail available. Effective Gross Income (TTM): $1,000,000.</p>",
    "<p>No line-item expense detail available. Total Operating Expenses (TTM): $400,000.</p>",
  ].join("\n"),
});
assert.equal(honestLumpSum.violations.length, 0);
assert.equal(honestLumpSum.customer_delivery_ready, true);

const sanitizedHtml = sanitizeFinalCustomerHtml(
  "<p>Current\uFFFEdebt DSCR \u200b / Not assessed / Current debt balance not provided</p>"
);
assert.equal(sanitizedHtml.includes("\uFFFE"), false);
assert.equal(sanitizedHtml.includes("\u200b"), false);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: baseArtifacts,
    sourceReportCoverageQa: baseCoverage,
    html: sanitizedHtml,
  }).violations.some((v) => v.code === "RENDERED_MOJIBAKE_LEAK"),
  false
);

const rentRollContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Rent Roll Summary</h2>",
    "<table>",
    "<tr><td>Total Units</td><td>48</td></tr>",
    "<tr><td>Weighted Avg Market Rent</td><td>$1,888/month</td></tr>",
    "<tr><td>Annual Market Rent (Total)</td><td>$21,744,000</td></tr>",
    "<tr><td>Weighted Avg In-Place Rent</td><td>$1,700/month</td></tr>",
    "<tr><td>Annual In-Place Rent (Total)</td><td>$979,200</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  rentRollContradiction.violations.some((v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"),
  true
);
const rentRollContradictionViolation = rentRollContradiction.violations.find(
  (v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"
);
assert.equal(rentRollContradictionViolation.evidence.total_units, 48);
assert.equal(rentRollContradictionViolation.evidence.annual_market_rent_total, 21744000);
assert.equal(rentRollContradictionViolation.evidence.weighted_avg_market_rent, 1888);
assert.equal(rentRollContradictionViolation.evidence.implied_avg_market_rent, 37750);
assert.equal(rentRollContradictionViolation.evidence.annual_in_place_rent_total, 979200);
assert.equal(rentRollContradictionViolation.evidence.weighted_avg_in_place_rent, 1700);
assert.equal(rentRollContradictionViolation.evidence.implied_avg_in_place_rent, 1700);

const rentRollContradictionPlan = buildQaActionPlan({
  reportContractQa: rentRollContradiction,
  sourceReportCoverageQa: baseCoverage,
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
  reportType: "underwriting",
  reportTier: 2,
});
const rentRollAction = rentRollContradictionPlan.prioritized_actions.find(
  (action) => action.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"
);
assert.equal(rentRollAction.action_type, "render_gating_fix_required");
assert.equal(rentRollAction.owner_area, "rent_roll_normalizer");
assert.equal(rentRollAction.blocks_customer_delivery, false);
assert.equal(rentRollAction.blocks_public_sample, true);
assert.equal(rentRollAction.blocks_high_value_outreach, true);

const rentRollConsistent = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Rent Roll Summary</h2>",
    "<table>",
    "<tr><td>Total Units</td><td>48</td></tr>",
    "<tr><td>Weighted Avg Market Rent</td><td>$1,888/month</td></tr>",
    "<tr><td>Annual Market Rent (Total)</td><td>$1,087,488</td></tr>",
    "<tr><td>Weighted Avg In-Place Rent</td><td>$1,700/month</td></tr>",
    "<tr><td>Annual In-Place Rent (Total)</td><td>$979,200</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  rentRollConsistent.violations.some((v) => v.code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION"),
  false
);

const sourceReconciliationCoverage = {
  ...baseCoverage,
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    rr_annual_in_place: 1962456,
    t12_gpr: 1850000,
    variance_pct: 0.06078702702702703,
    has_material_variance: true,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
};
const sourceReconciliationMatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>+6.1%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is +6.1% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
  ].join("\n"),
});
assert.equal(
  sourceReconciliationMatch.violations.some((v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"),
  false
);

const sourceReconciliationMismatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>-48.0%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is -48.0% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
  ].join("\n"),
});
assert.equal(
  sourceReconciliationMismatch.violations.some((v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"),
  true
);
const sourceReconciliationMismatchViolation = sourceReconciliationMismatch.violations.find(
  (v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"
);
assert.equal(sourceReconciliationMismatchViolation.blocks_customer_delivery, false);
assert.equal(sourceReconciliationMismatchViolation.customer_delivery_impact, "disclose_only");
assert.equal(sourceReconciliationMismatchViolation.evidence.canonical_variance_pct, 0.06078702702702703);
assert.equal(
  sourceReconciliationMismatchViolation.evidence.rendered_values.some((entry) => entry.value === -48.0),
  true
);

const sourceReconciliationBlockingCoverage = {
  ...baseCoverage,
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    rr_annual_in_place: 1962456,
    t12_gpr: 1850000,
    variance_pct: 0.06078702702702703,
    has_material_variance: true,
    publishability_bucket: "admin_review_required",
    customer_delivery_impact: "block",
    public_outreach_impact: "block_until_review",
  },
};
const sourceReconciliationMismatchBlocking = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: sourceReconciliationBlockingCoverage,
  html: [
    "<h2>Operating Profile</h2>",
    "<table>",
    "<tr><td>Rent Roll vs T12 GPR Variance</td><td>-48.0%</td></tr>",
    "</table>",
    "<p>Rent roll annualized rent is -48.0% vs T12 GPR.</p>",
  ].join("\n"),
});
const sourceReconciliationMismatchBlockingViolation = sourceReconciliationMismatchBlocking.violations.find(
  (v) => v.code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH"
);
assert.equal(sourceReconciliationMismatchBlockingViolation.blocks_customer_delivery, true);
assert.equal(sourceReconciliationMismatchBlockingViolation.customer_delivery_impact, "block");

const badIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><tr><td>Effective Gross Income</td><td>$1,000,000</td></tr>",
    "<tr><td>Vacancy Loss</td><td>-$50,000</td></tr>",
    "<tr><td>Other Income</td><td>$0</td></tr></table>",
  ].join("\n"),
});
assert.equal(badIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_CONTRACT"), true);

const headerOnlyIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(headerOnlyIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_EMPTY_TABLE"), true);

const scopedIncomeTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><tr><td>Parking Income</td><td>$27,000</td></tr>",
    "<tr><td>Laundry Income</td><td>$18,400</td></tr></table>",
    "<h2>Operating Profile</h2>",
    "<p>Vacancy allowance is reflected elsewhere in the report.</p>",
  ].join("\n"),
});
assert.equal(scopedIncomeTable.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_CONTRACT"), false);

const headerOnlyRenovationBudgetTable = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Renovation Budget Breakdown</h2>",
    "<table><thead><tr><th>Category</th><th>Scope of Work</th><th>Estimated Cost</th><th>Percent of Budget</th><th>Primary Objective</th></tr></thead><tbody></tbody></table>",
    "<h2>Cost Per Unit and Execution Phasing</h2>",
    "<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(
  headerOnlyRenovationBudgetTable.violations.some((v) => v.code === "RENOVATION_BUDGET_EMPTY_TABLE"),
  true
);
assert.equal(
  headerOnlyRenovationBudgetTable.violations.some((v) => v.code === "RENOVATION_EXECUTION_EMPTY_TABLE"),
  true
);

const acquisitionArtifacts = [
  ...baseArtifacts,
  {
    type: "loan_term_sheet_parsed",
    payload: {
      purchase_price: 10000000,
      derived_acquisition_loan_amount: 7000000,
      debt_basis: "acquisition_financing_assumption",
      interest_rate: 0.06,
      amort_years: 25,
    },
  },
];
const acquisitionCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    loan_term_sheet_parsed: {
      present: true,
      has_purchase_price: true,
      has_derived_acquisition_debt: true,
      has_balance: false,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const cleanAcquisition = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<table><tr><td>Derived Acquisition Loan Amount</td><td>$7,000,000</td></tr>",
    "<tr><td>Proposed Acquisition DSCR</td><td>1.20x</td></tr></table>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(cleanAcquisition.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);

const acquisitionWithRiskRegisterLimitation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>Current Debt DSCR</td><td>Current outstanding debt balance not provided</td><td>NOT ASSESSED</td></tr></table>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithRiskRegisterLimitation.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);
assert.equal(acquisitionWithRiskRegisterLimitation.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const acquisitionWithScorecardNotAssessed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    "<h2>Deal Scorecard</h2>",
    "<table><tr><td>Current Debt DSCR</td><td>Not assessed</td><td>0/10</td><td>Current debt balance not provided</td></tr></table>",
  ].join("\n"),
});
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"), false);
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);
assert.equal(acquisitionWithScorecardNotAssessed.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);

for (const safeLimitationRow of [
  "<p>Current Debt DSCR / Not assessed / No current debt document provided / 0/10</p>",
  "<p>Current Debt DSCR / Not assessed / Current debt terms were not fully provided / 0/10</p>",
  "<p>Current Debt DSCR / Not assessed / Current debt service not assessed / 0/10</p>",
]) {
  const safeLimitationReport = buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: acquisitionArtifacts,
    sourceReportCoverageQa: acquisitionCoverage,
    html: [
      "<h2>Deal Scorecard</h2>",
      safeLimitationRow,
      "<p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>",
    ].join("\n"),
  });
  assert.equal(safeLimitationReport.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);
}

const contaminatedAcquisition = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current outstanding debt balance equals derived acquisition debt.</p>",
    "<p>Current Debt DSCR: 1.20x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(contaminatedAcquisition.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), true);
assert.equal(contaminatedAcquisition.customer_delivery_ready, false);
const supportDocTreatmentLeak = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Document Treatment Summary</h2>",
    "<p>Unsupported Phase I ESA.pdf - Structured property tax input</p>",
  ].join("\n"),
});
const supportDocTreatmentViolation = supportDocTreatmentLeak.violations.find(
  (v) => v.code === "SUPPORT_DOC_TREATMENT_LABEL_CONTRACT"
);
assert.equal(Boolean(supportDocTreatmentViolation), true);
assert.equal(supportDocTreatmentViolation.severity, "high");
assert.equal(supportDocTreatmentViolation.blocks_customer_delivery, false);
assert.equal(supportDocTreatmentViolation.blocks_public_sample, true);
assert.equal(supportDocTreatmentViolation.blocks_high_value_outreach, true);

const acquisitionWithCurrentDscrValue = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Current Debt DSCR: 1.20x</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithCurrentDscrValue.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), true);
assert.equal(acquisitionWithCurrentDscrValue.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), true);
const acquisitionPurchasePriceMismatchRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,130,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionPurchasePriceMismatchRendered.violations.some((v) =>
    ["ACQUISITION_PURCHASE_PRICE_LOAN_AMOUNT_MISMATCH_RENDERED", "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"].includes(v.code)
  ),
  true
);

const acquisitionLenderFeeOmittedRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        lender_fee_percent: 0.0085,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Purchase Price</td><td>$2,840,000</td></tr><tr><td>Stated Acquisition Loan Amount</td><td>$2,130,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionLenderFeeOmittedRendered.violations.some((v) => v.code === "ACQUISITION_LENDER_FEE_OMITTED_RENDERED"),
  true
);

const acquisitionClosingCostZeroRendered = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 2840000,
        stated_acquisition_loan_amount: 2130000,
        debt_basis: "acquisition_financing_assumption",
        closing_cost_notes: "Fees 1% lender fee + legal/appraisal costs",
      },
    },
  ],
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<table><tr><td>Closing Costs</td><td>0.0%</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  acquisitionClosingCostZeroRendered.violations.some((v) => v.code === "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES"),
  true
);

const acquisitionWithRefiClassification = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(acquisitionWithRefiClassification.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), true);

const acquisitionWithCurrentRefiHeadings = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Proposed Acquisition Debt Sizing</h2>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<p>Derived Acquisition Loan Amount $7,000,000</p>",
    "<p>Proposed Acquisition DSCR 1.20x</p>",
    "<h3>DSCR Sensitivity & Coverage Threshold Analysis</h3>",
    "<h3>Refinance Stress Test & Binding Constraint Analysis</h3>",
  ].join("\n"),
});
assert.equal(acquisitionWithCurrentRefiHeadings.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);

const currentDebtArtifacts = [
  ...baseArtifacts,
  {
    type: "mortgage_statement_parsed",
    payload: {
      outstanding_balance: 6000000,
      interest_rate: 0.055,
      amort_years: 25,
    },
  },
];
const currentDebtCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    mortgage_statement_parsed: {
      present: true,
      has_balance: true,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const currentDebtReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h3>DSCR Sensitivity & Coverage Threshold Analysis</h3>",
    "<p>Current Debt DSCR: 1.30x</p>",
    "<p>Refinance Stability Classification: Stable</p>",
  ].join("\n"),
});
assert.equal(currentDebtReport.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), false);
assert.equal(currentDebtReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const paymentOnlyMortgageArtifacts = [
  ...baseArtifacts,
  {
    type: "mortgage_statement_parsed",
    payload: {
      monthly_payment: 13625,
      annual_debt_service: 163500,
      interest_rate: 0.0425,
      amort_years: 23,
      lender_name: "ABC Bank",
    },
  },
];
const paymentOnlyMortgageCoverage = {
  ...baseCoverage,
  artifact_inventory: {
    ...baseCoverage.artifact_inventory,
    mortgage_statement_parsed: {
      present: true,
      has_balance: false,
      has_payment: true,
      has_rate: true,
      has_amortization: true,
    },
  },
};
const paymentOnlyMortgageReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: paymentOnlyMortgageArtifacts,
  sourceReportCoverageQa: paymentOnlyMortgageCoverage,
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"), false);
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_RENDERED"), false);
assert.equal(paymentOnlyMortgageReport.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"), false);

const mojibakeLeakReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: acquisitionArtifacts,
  sourceReportCoverageQa: acquisitionCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<p>Current\uFFFEdebt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
  ].join("\n"),
});
assert.equal(mojibakeLeakReport.violations.some((v) => v.code === "RENDERED_MOJIBAKE_LEAK"), true);

const currentDebtDscrMismatch = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...currentDebtArtifacts,
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 6000000,
        monthly_payment: 13625,
        interest_rate: 0.055,
        amort_years: 25,
      },
    },
  ],
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<p>DSCR (Computed): 7.10x</p>",
    "<p>DSCR (T12 NOI): 7.10x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>7.10x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 8.10x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>8.10x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrMismatch.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH"),
  true
);

const currentDebtDscrAligned = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...currentDebtArtifacts,
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 6000000,
        monthly_payment: 13625,
        interest_rate: 0.055,
        amort_years: 25,
      },
    },
  ],
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<p>DSCR (Computed): 7.10x</p>",
    "<p>DSCR (T12 NOI): 7.10x</p>",
    "<h3>Current Debt Coverage / Constraint Sensitivity</h3>",
    "<table><tr><td>Base</td><td>7.10x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<p>DSCR (Current Debt): 7.10x</p>",
    "<h2>Risk Register</h2>",
    "<table><tr><td>DSCR (Current Debt)</td><td>7.10x</td></tr></table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrAligned.violations.some((v) => v.code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH"),
  false
);

const currentDebtDscrScorecardComputed = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>DSCR (Current Debt)</td><td>7.10x</td><td>1.25-1.35x</td><td>7/10</td></tr>",
    "</table>",
    "<p>Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.</p>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED"),
  false
);
assert.equal(
  currentDebtDscrScorecardComputed.violations.some((v) => v.code === "CURRENT_DEBT_COMPUTED_STALE_LIMITATION_COPY"),
  true
);

const currentDebtDscrScorecardFalsePositiveGuard = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Executive Summary</h2>",
    "<p>Current Debt DSCR / Not assessed / Current debt balance not provided / 0/10</p>",
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>DSCR (Current Debt)</td><td>7.10x</td><td>1.25-1.35x</td><td>7/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  currentDebtDscrScorecardFalsePositiveGuard.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);
const staleScorecardPlaceholder = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>Not assessed</td><td>current debt balance not provided</td><td>0/10</td></tr>",
    "</table>",
  ].join("\n"),
});
const staleScorecardPlaceholderViolation = staleScorecardPlaceholder.violations.find(
  (v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"
);
assert.equal(Boolean(staleScorecardPlaceholderViolation), true);
assert.equal(staleScorecardPlaceholderViolation.blocks_customer_delivery, false);
assert.equal(staleScorecardPlaceholderViolation.customer_delivery_impact, "disclose_only");

const validComputedDscrScorecardRow = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>7.10x</td><td>Above 1.35x</td><td>10/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  validComputedDscrScorecardRow.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);

const weakButComputedDscrScorecardRow = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: currentDebtArtifacts,
  sourceReportCoverageQa: currentDebtCoverage,
  html: [
    "<h2>Deal Scorecard</h2>",
    "<table>",
    "<tr><td>Factor</td><td>Value</td><td>Threshold</td><td>Score</td></tr>",
    "<tr><td>Current Debt DSCR</td><td>1.06x</td><td>Below 1.25x</td><td>0/10</td></tr>",
    "</table>",
  ].join("\n"),
});
assert.equal(
  weakButComputedDscrScorecardRow.violations.some((v) => v.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"),
  false
);

const screeningLeak = buildReportContractQa({
  reportType: "screening",
  reportTier: 1,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<h2>Discounted Cash Flow</h2><h2>Debt Structure</h2><h2>Deal Scorecard</h2>",
});
assert.equal(screeningLeak.violations.some((v) => v.code === "SCREENING_UNDERWRITING_SECTION_LEAK"), true);

const buyLanguage = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>BUY this property based on the report.</p>",
});
assert.equal(buyLanguage.contract_status, "block");
assert.equal(buyLanguage.customer_delivery_ready, false);
const buyPlan = buildQaActionPlan({
  reportContractQa: buyLanguage,
  reportQaFlags: [],
  sourceReportCoverageQa: baseCoverage,
  renderedReportQa: { findings: [] },
});
assert.equal(buyPlan.customer_delivery_ready, false);
assert.equal(buyPlan.prioritized_actions[0].source_artifact, "report_contract_qa");

const cleanLimitation = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Uploaded renovation support was identified, but no verified forward-looking renovation budget, rent-lift plan, ROI, payback analysis, or implementation schedule was extracted.</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
  ].join("\n"),
});
assert.equal(cleanLimitation.customer_delivery_ready, true);
assert.equal(cleanLimitation.violations.length, 0);

const expenseSensitivityAfterDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></tbody></table>",
    "<h2>Expense Ratio Sensitivity</h2>",
    "<table><tr><td>60%</td><td>Implied NOI</td></tr></table>",
  ].join("\n"),
});
assert.equal(expenseSensitivityAfterDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_CONTRACT"), false);

const populatedExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Top </p>",
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(populatedExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);
assert.equal(populatedExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_CONTRACT"), false);

const populatedExpenseDriversNoTbody = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><tr><td>Property Taxes</td><td>$120,000</td></tr><tr><td>Insurance</td><td>$60,000</td></tr></table>",
  ].join("\n"),
});
assert.equal(populatedExpenseDriversNoTbody.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);

const placeholderExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><tbody><tr><td>No expense drivers</td><td>N/A</td></tr></tbody></table>",
  ].join("\n"),
});
assert.equal(placeholderExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), true);

const headerOnlyExpenseDrivers = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Expense Drivers</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});
assert.equal(headerOnlyExpenseDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), true);

const neighboringTopText = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<h2>Top Positive Income Lines (% of EGI, before vacancy offset)</h2>",
    "<table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody><tr><td>Management Fees</td><td>$20,000</td></tr></tbody></table>",
    "<p>Top </p>",
    "<h2>Expense Ratio Sensitivity</h2>",
    "<table><tr><td>60%</td><td>Implied NOI</td></tr></table>",
  ].join("\n"),
});
assert.equal(neighboringTopText.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_EMPTY_TABLE"), false);
assert.equal(neighboringTopText.violations.some((v) => v.code === "TOP_POSITIVE_INCOME_LINES_EMPTY_TABLE"), false);

const validDscrPressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: DSCR of 1.06x constrains refinance capacity below standard lender coverage thresholds.</p><p>Expense Ratio 41.0%</p>",
});
assert.equal(validDscrPressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), false);

const stableExpensePressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: Expense Ratio 41.0%</p>",
});
assert.equal(stableExpensePressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), true);

const strongDscrPressure = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Primary Pressure Point: DSCR of 1.40x</p>",
});
assert.equal(strongDscrPressure.violations.some((v) => v.code === "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT"), true);

console.log("report-contract-qa smoke PASS");
