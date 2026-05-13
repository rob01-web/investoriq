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
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
    "<p>No current debt document provided.</p>",
    "<p>Current debt terms were not fully provided.</p>",
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

const insufficientDataContradiction = buildSourceReportCoverageQa({
  jobId: "forest-city-insufficient-data-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "ForestCityManor_T12_2024-2025.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "ForestCityManor_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 2517120,
        total_operating_expenses: 793685,
        net_operating_income: 1723435,
        income_lines: [],
        expense_lines: [],
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 144,
        occupancy: 0.96,
      },
    },
  ],
  html: [
    "<html><body>",
    "<div>CAPITAL RISK PROFILE</div>",
    "<div>Insufficient Data</div>",
    "<p>Units: 144 | Occupancy: 96.0% | EGI: $2,517,120 | NOI: $1,723,435</p>",
    "</body></html>",
  ].join("\n"),
});

const contradictionCodes = new Set(insufficientDataContradiction.deterministic_flags.map((flag) => flag.code));
if (!contradictionCodes.has("CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL")) {
  console.error("Missing CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL flag.");
  console.error("Actual flags:", Array.from(contradictionCodes).join(", "));
  process.exit(1);
}

const rentRollSummaryOccupancyResult = buildSourceReportCoverageQa({
  jobId: "forest-city-summary-occupancy-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
  reportType: "screening",
  reportTier: 1,
  uploadedFiles: [
    { id: "1", original_filename: "ForestCityManor_T12_2024-2025.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "ForestCityManor_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 144,
        occupancy: 0.75,
        totals: {
          summary_row_detected: true,
          total_units: 144,
          occupied_units: 138.24,
          occupancy: 0.96,
        },
      },
    },
  ],
  html: "<html><body><p>Occupancy: 96.0%</p></body></html>",
});

const inventoryOccupancy = rentRollSummaryOccupancyResult.artifact_inventory.rent_roll_parsed.occupancy;
if (inventoryOccupancy !== 0.96) {
  console.error("Expected rent roll inventory occupancy to prefer trusted summary totals.");
  console.error("Actual occupancy:", inventoryOccupancy);
  process.exit(1);
}

const rentRollUnitRowOccupancyResult = buildSourceReportCoverageQa({
  jobId: "richmond-unit-row-occupancy-smoke",
  userId: "user-smoke",
  propertyName: "124 Richmond Street",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "124Richmond_T12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "2", original_filename: "124Richmond_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 12,
        occupancy: 0,
        units: Array.from({ length: 12 }, (_, index) => ({
          unit: String(index + 1),
          current_rent: 1200 + index,
          status: "leased",
        })),
      },
    },
  ],
  html: "<html><body><p>Occupancy: 100.0%</p></body></html>",
});

const unitRowOccupancy = rentRollUnitRowOccupancyResult.artifact_inventory.rent_roll_parsed.occupancy;
if (unitRowOccupancy !== 1) {
  console.error("Expected rent roll inventory occupancy to fall back to unit rows with positive rents.");
  console.error("Actual occupancy:", unitRowOccupancy);
  process.exit(1);
}

const acquisitionRenderedResult = buildSourceReportCoverageQa({
  jobId: "forest-city-acquisition-rendered-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "ForestCityManor_T12_2024-2025.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "ForestCityManor_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "3", original_filename: "ForestCityManor_PurchaseAssumptions.pdf", doc_type: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 3200000,
        total_operating_expenses: 1550000,
        net_operating_income: 1650000,
        income_lines: [{ label: "Gross Potential Rent", amount: 3300000 }],
        expense_lines: [
          { label: "Taxes", amount: 500000 },
          { label: "Insurance", amount: 150000 },
          { label: "Utilities", amount: 300000 },
        ],
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
        purchase_price: 34500000,
        ltv: 85,
        interest_rate: 3.8,
        amort_years: 40,
        derived_acquisition_loan_amount: 29325000,
        loan_amount: null,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  html: [
    "<html><body>",
    "<h1>Full Underwriting Report</h1>",
    "<h2>Operating Statement</h2>",
    "<h2>Debt Structure & Financing</h2>",
    "<p>Proposed Acquisition Debt Sizing</p>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<table><tr><td>Derived Acquisition Loan Amount</td><td>$29,325,000</td></tr><tr><td>Proposed Acquisition DSCR</td><td>1.40x</td></tr></table>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
    "<h2>Deal Scorecard</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

const acquisitionActual = new Set(acquisitionRenderedResult.deterministic_flags.map((flag) => flag.code));
if (acquisitionActual.has("PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT")) {
  console.error("Acquisition financing rendered but purchase-assumptions coverage flag still fired.");
  console.error("Actual flags:", Array.from(acquisitionActual).join(", "));
  process.exit(1);
}

if (!acquisitionRenderedResult.rendered_text_signals.includes("acquisition_financing_assumptions")) {
  console.error("Missing acquisition_financing_assumptions rendered signal.");
  process.exit(1);
}

const acquisitionRenderedT12OnlyResult = buildSourceReportCoverageQa({
  jobId: "forest-city-acquisition-rendered-t12-only-smoke",
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
      type: "renovation_parsed",
      payload: {
        total_capex: 1200000,
        scope_items: ["Interior upgrades"],
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 34500000,
        ltv: 85,
        interest_rate: 3.8,
        amort_years: 40,
        derived_acquisition_loan_amount: 29325000,
        loan_amount: null,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  html: [
    "<html><body>",
    "<h1>Full Underwriting Report</h1>",
    "<h2>Operating Statement</h2>",
    "<p>No line-item detail available for this T12 format. All values are reported totals.</p>",
    "<h2>Scenario Analysis</h2>",
    "<h2>Risk Register</h2>",
    "<h2>Debt Structure & Financing</h2>",
    "<p>Proposed Acquisition Debt Sizing</p>",
    "<p>Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p>",
    "<table><tr><td>Derived Acquisition Loan Amount</td><td>$29,325,000</td></tr><tr><td>Proposed Acquisition DSCR</td><td>1.40x</td></tr></table>",
    "<h2>Deal Scorecard</h2>",
    "<h2>Discounted Cash Flow</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

const acquisitionRenderedT12OnlyActual = new Set(
  acquisitionRenderedT12OnlyResult.deterministic_flags.map((flag) => flag.code)
);
if (!acquisitionRenderedT12OnlyActual.has("T12_LINE_ITEM_DETAIL_MISSING")) {
  console.error("Expected T12_LINE_ITEM_DETAIL_MISSING to remain.");
  process.exit(1);
}
if (acquisitionRenderedT12OnlyActual.has("PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT")) {
  console.error("Purchase assumptions flag fired despite rendered acquisition financing.");
  process.exit(1);
}
if (acquisitionRenderedT12OnlyActual.has("FULL_UNDERWRITING_SUPPORT_UNDERUSED")) {
  console.error("Support underused should not duplicate the remaining T12-only issue.");
  console.error("Actual flags:", Array.from(acquisitionRenderedT12OnlyActual).join(", "));
  process.exit(1);
}
