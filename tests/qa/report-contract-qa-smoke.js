import assert from "node:assert/strict";
import { buildReportContractQa } from "../../api/_lib/report-contract-qa.js";
import { buildQaActionPlan } from "../../api/_lib/qa-action-plan.js";

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
assert.equal(acquisitionWithCurrentRefiHeadings.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"), true);

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
    "<ol><li>Property Taxes: 30.0%</li><li>Insurance: 10.0%</li></ol>",
    "<h2>Expense Ratio Sensitivity</h2>",
    "<table><tr><td>60%</td><td>Implied NOI</td></tr></table>",
  ].join("\n"),
});
assert.equal(expenseSensitivityAfterDrivers.violations.some((v) => v.code === "TOP_EXPENSE_DRIVERS_CONTRACT"), false);

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
