import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { __test__: reportTestHelpers } = await import("../../api/generate-client-report.js");
const { buildReportContractQa } = await import("../../api/_lib/report-contract-qa.js");

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-US")}`;

const renovationBudgetCardHtml = reportTestHelpers.buildRenovationBudgetCardHtml(
  [
    { category: "Exterior / Curb Appeal", estimated_cost: 45000 },
    { category: "Unit Turns", estimated_cost: 120000 },
  ],
  formatCurrency,
  "Return impact is not calculated without document-supported rent lift, timing, and cost recovery assumptions."
);
assert.equal(renovationBudgetCardHtml.includes("Scope of Work"), false);
assert.equal(renovationBudgetCardHtml.includes("Percent of Budget"), false);
assert.equal(renovationBudgetCardHtml.includes("Primary Objective"), false);
assert.equal(renovationBudgetCardHtml.includes("Category"), true);
assert.equal(renovationBudgetCardHtml.includes("Estimated Cost"), true);
assert.equal(renovationBudgetCardHtml.includes("<tbody></tbody>"), false);

const renovationExecutionCardHtml = reportTestHelpers.buildRenovationExecutionCardHtml(
  [],
  formatCurrency,
  "Return impact is not calculated without document-supported rent lift, timing, and cost recovery assumptions."
);
assert.equal(
  renovationExecutionCardHtml.includes(
    "Return impact is not calculated without document-supported rent lift, timing, and cost recovery assumptions."
  ),
  true
);
assert.equal(renovationExecutionCardHtml.includes("ROI"), false);
assert.equal(renovationExecutionCardHtml.includes("payback"), false);
assert.equal(renovationExecutionCardHtml.includes("implementation schedule"), false);

const headerOnlyRenovationReport = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
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
  ],
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true, unit_count: 10, occupancy: 1 },
    },
  },
  html: [
    "<h2>Renovation Budget Breakdown</h2>",
    "<table><thead><tr><th>Category</th><th>Scope of Work</th><th>Estimated Cost</th><th>Percent of Budget</th><th>Primary Objective</th></tr></thead><tbody></tbody></table>",
    "<h2>Cost Per Unit and Execution Phasing</h2>",
    "<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody></tbody></table>",
  ].join("\n"),
});

assert.equal(
  headerOnlyRenovationReport.violations.some((v) => v.code === "RENOVATION_BUDGET_EMPTY_TABLE"),
  true
);
assert.equal(
  headerOnlyRenovationReport.violations.some((v) => v.code === "RENOVATION_EXECUTION_EMPTY_TABLE"),
  true
);

console.log("renovation rendering smoke PASS");
