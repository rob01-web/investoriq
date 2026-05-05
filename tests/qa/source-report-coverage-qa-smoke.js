import { buildSourceReportCoverageQa } from "../../api/_lib/source-report-coverage-qa.js";

const result = buildSourceReportCoverageQa({
  jobId: "forest-city-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "ForestCityManor_T12_2024-2025.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "ForestCityManor_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "3", original_filename: "ForestCityManor_PurchaseAssumptions.pdf", doc_type: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "4", original_filename: "ForestCityManor_RenovationBudget.docx", doc_type: "renovation_budget", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 3200000,
        total_operating_expenses: 1550000,
        net_operating_income: 1650000,
        income_lines: [],
        expense_lines: [],
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 144,
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        interest_rate: 5.75,
        amort_years: 25,
      },
    },
  ],
  html: [
    "<html><body>",
    "<h1>Full Underwriting Report</h1>",
    "<h2>Operating Statement</h2>",
    "<p>No line-item detail available for this T12 format. All values are reported totals.</p>",
    "<p>Uploaded Renovation / CapEx Document: Uploaded renovation/CapEx source file acknowledged. No structured CapEx modeling was produced because the file was not converted into verified structured renovation inputs.</p>",
    "<p>Debt terms were partially identified; DSCR and current-debt service are not assessed.</p>",
    "<p>Not assessed: debt sizing balance not provided.</p>",
    "<p>Refinance Stability Classification not produced due to insufficient refinance inputs.</p>",
    "<h2>Deal Scorecard</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

const expected = [
  "T12_LINE_ITEM_DETAIL_MISSING",
  "RENOVATION_DOC_NOT_STRUCTURED",
  "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
  "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
  "PUBLIC_SAMPLE_NOT_READY",
];

const actual = new Set(result.deterministic_flags.map((flag) => flag.code));
const missing = expected.filter((code) => !actual.has(code));

if (missing.length > 0) {
  console.error("Missing expected flags:", missing.join(", "));
  console.error("Actual flags:", Array.from(actual).join(", "));
  process.exit(1);
}

console.log("source-report-coverage-qa smoke PASS");
console.log(Array.from(actual).join(", "));
