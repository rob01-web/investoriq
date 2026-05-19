import { buildSourceReportCoverageQa } from "../../api/_lib/source-report-coverage-qa.js";
import { buildSourceReconciliationState } from "../../api/_lib/report-surface-contracts.js";

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
    {
      type: "appraisal_parsed",
      payload: {
        appraised_value: 34500000,
        valuation_date: "2026-05-01",
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
if (acquisitionRenderedResult.acquisition_assumption_state?.has_validated_acquisition_assumptions !== true) {
  console.error("Expected validated acquisition assumptions state.");
  console.error("Actual state:", acquisitionRenderedResult.acquisition_assumption_state);
  process.exit(1);
}
if (acquisitionRenderedResult.acquisition_assumption_state?.acquisition_assumptions_supported !== true) {
  console.error("Expected acquisition assumptions to be marked supported.");
  console.error("Actual state:", acquisitionRenderedResult.acquisition_assumption_state);
  process.exit(1);
}
if (acquisitionRenderedResult.artifact_inventory?.loan_term_sheet_parsed?.acquisition_assumption_state?.acquisition_assumptions_supported !== true) {
  console.error("Expected loan term sheet artifact inventory to carry supported acquisition state.");
  console.error("Actual inventory:", acquisitionRenderedResult.artifact_inventory?.loan_term_sheet_parsed);
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

const partialAcquisitionResult = buildSourceReportCoverageQa({
  jobId: "partial-acquisition-smoke",
  userId: "user-smoke",
  propertyName: "Partial Acquisition Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "PartialAcquisition_PurchaseAssumptions.pdf", doc_type: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "PartialAcquisition_T12.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "3", original_filename: "PartialAcquisition_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        gross_potential_rent: 1000000,
        effective_gross_income: 900000,
        net_operating_income: 400000,
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_in_place_annual: 1100000,
        total_units: 20,
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 34500000,
        ltv: 85,
      },
    },
  ],
  html: "<html><body><h2>Debt Structure & Financing</h2><p>Proposed Acquisition Debt Sizing</p></body></html>",
});

if (partialAcquisitionResult.acquisition_assumption_state?.has_validated_acquisition_assumptions !== false) {
  console.error("Expected partial acquisition assumptions to remain unvalidated.");
  console.error("Actual state:", partialAcquisitionResult.acquisition_assumption_state);
  process.exit(1);
}
if (partialAcquisitionResult.acquisition_assumption_state?.acquisition_assumptions_supported !== false) {
  console.error("Expected partial acquisition assumptions to remain unsupported.");
  console.error("Actual state:", partialAcquisitionResult.acquisition_assumption_state);
  process.exit(1);
}

const sourceReconciliationResult = buildSourceReportCoverageQa({
  jobId: "reconciliation-smoke",
  userId: "user-smoke",
  propertyName: "Reconciliation Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "Reconciliation_T12.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "Reconciliation_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        gross_potential_rent: 1000000,
        effective_gross_income: 900000,
        total_operating_expenses: 500000,
        net_operating_income: 400000,
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_in_place_annual: 1100000,
        total_units: 20,
        occupancy: 0.95,
      },
    },
  ],
  html: [
    "<html><body>",
    "<h2>Operating Profile</h2>",
    "<p>Rent roll annualized rent is +10.0% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p>",
    "</body></html>",
  ].join("\n"),
});

const sourceReconciliationConflictState = buildSourceReconciliationState({
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    annual_in_place_rent: 961200,
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
if (sourceReconciliationConflictState.rr_annual_in_place !== 961200) {
  console.error("Expected coherent row-derived rent-roll annual to win.");
  console.error("Actual state:", sourceReconciliationConflictState);
  process.exit(1);
}
if (sourceReconciliationConflictState.variance_pct !== -0.48043243243243244) {
  console.error("Expected canonical negative reconciliation variance.");
  console.error("Actual state:", sourceReconciliationConflictState);
  process.exit(1);
}
if (sourceReconciliationConflictState.source_selection?.rr_annual_in_place?.source_path !== "row_derived_units.monthly_rent_x_12") {
  console.error("Expected row-derived source path to win.");
  console.error("Actual state:", sourceReconciliationConflictState);
  process.exit(1);
}
if (!sourceReconciliationConflictState.source_selection?.rr_annual_in_place?.suppressed_values?.some((entry) => entry.value === 1962456)) {
  console.error("Expected incoherent summary total to be suppressed.");
  console.error("Actual state:", sourceReconciliationConflictState);
  process.exit(1);
}
const sourceReconciliationPassThroughResult = buildSourceReportCoverageQa({
  jobId: "reconciliation-pass-through-smoke",
  userId: "user-smoke",
  propertyName: "Reconciliation Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<html><body><p>Rent roll annualized rent is +6.1% vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.</p></body></html>",
  sourceReconciliationState: sourceReconciliationConflictState,
});
if (sourceReconciliationPassThroughResult.source_reconciliation_state?.rr_annual_in_place !== 961200) {
  console.error("Expected source coverage QA to preserve the supplied canonical reconciliation state.");
  console.error("Actual state:", sourceReconciliationPassThroughResult.source_reconciliation_state);
  process.exit(1);
}

if (sourceReconciliationResult.source_reconciliation_state?.status !== "source_reconciliation_required") {
  console.error("Expected source reconciliation state to require review.");
  console.error("Actual state:", sourceReconciliationResult.source_reconciliation_state);
  process.exit(1);
}
if (sourceReconciliationResult.source_reconciliation_state?.source_reconciliation_disclosure !== "InvestorIQ has not reconciled this variance and does not infer the cause.") {
  console.error("Expected canonical reconciliation disclosure.");
  console.error("Actual state:", sourceReconciliationResult.source_reconciliation_state);
  process.exit(1);
}
if (sourceReconciliationResult.core_input_sufficiency_state?.publishability_bucket !== "disclose_only_publishable") {
  console.error("Expected reconciliation to remain publishable with disclosure only.");
  console.error("Actual core-input state:", sourceReconciliationResult.core_input_sufficiency_state);
  process.exit(1);
}
if (sourceReconciliationResult.section_eligibility?.sections?.data_coverage?.publishability_bucket !== "disclose_only_publishable") {
  console.error("Expected data coverage to remain disclose-only publishable for reconciliation variance.");
  console.error("Actual data coverage section:", sourceReconciliationResult.section_eligibility?.sections?.data_coverage);
  process.exit(1);
}
if (!sourceReconciliationResult.deterministic_flags.some((flag) => flag.code === "RENT_ROLL_T12_RECONCILIATION_REQUIRED")) {
  console.error("Expected reconciliation flag to be emitted.");
  console.error("Actual flags:", sourceReconciliationResult.deterministic_flags.map((flag) => flag.code));
  process.exit(1);
}

const supportRolePrecedenceResult = buildSourceReportCoverageQa({
  jobId: "support-role-precedence-smoke",
  userId: "user-smoke",
  propertyName: "Support Role Precedence",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "pa-1", original_filename: "PurchaseAssumptions.pdf", doc_type: "appraisal", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "be-1", original_filename: "BrokerEmail.pdf", doc_type: "loan_term_sheet", mime_type: "application/pdf", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "loan_term_sheet_parsed",
      payload: {
        file_id: "pa-1",
        original_filename: "PurchaseAssumptions.pdf",
        semantic_doc_role: "purchase_assumptions",
        semantic_doc_role_confidence: 0.96,
        semantic_doc_display_label: "purchase_assumptions",
        purchase_price: 34500000,
        ltv: 85,
        interest_rate: 3.8,
        amortization_years: 40,
        going_in_cap_rate: 4.99,
      },
    },
    {
      type: "document_text_extracted",
      payload: {
        file_id: "be-1",
        original_filename: "BrokerEmail.pdf",
        text: "From: broker@example.com\nSubject: update\nPlease call me about the deal.",
      },
    },
  ],
  html: "<html><body><p>Support role precedence</p></body></html>",
});

if (supportRolePrecedenceResult.uploaded_files?.[0]?.display_doc_type !== "purchase_assumptions") {
  console.error("Expected purchase assumptions display role in source coverage uploaded files.");
  console.error("Actual uploaded file:", supportRolePrecedenceResult.uploaded_files?.[0]);
  process.exit(1);
}
if (supportRolePrecedenceResult.uploaded_files?.[1]?.display_doc_type !== "broker_email") {
  console.error("Expected broker email display role in source coverage uploaded files.");
  console.error("Actual uploaded file:", supportRolePrecedenceResult.uploaded_files?.[1]);
  process.exit(1);
}

const coreSufficiencyResult = buildSourceReportCoverageQa({
  jobId: "core-sufficiency-smoke",
  userId: "user-smoke",
  propertyName: "Core Sufficiency Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "t12-1", original_filename: "CoreSufficiency_T12.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "rr-1", original_filename: "CoreSufficiency_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        gross_potential_rent: 3300000,
        effective_gross_income: 2517120,
        total_operating_expenses: 793685,
        net_operating_income: 1723435,
        income_lines: [
          { label: "Gross Potential Rent", amount: 3300000 },
        ],
        expense_lines: [
          { label: "Taxes", amount: 275000 },
        ],
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 144,
        occupancy: 0.96,
        totals: {
          summary_row_detected: true,
          total_units: 144,
          occupied_units: 138.24,
          occupancy: 0.96,
          in_place_rent_annual: 1962456,
        },
      },
    },
  ],
  html: [
    "<html><body>",
    "<h2>Operating Statement</h2>",
    "<h2>Operating Profile</h2>",
    "<h2>Deal Scorecard</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

if (coreSufficiencyResult.t12_sufficiency_state?.publishability_bucket !== "core_sufficient_publishable") {
  console.error("Expected T12 to be core sufficient.");
  console.error("Actual T12 state:", coreSufficiencyResult.t12_sufficiency_state);
  process.exit(1);
}
if (coreSufficiencyResult.rent_roll_sufficiency_state?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected rent roll to be section constrained but publishable.");
  console.error("Actual rent roll state:", coreSufficiencyResult.rent_roll_sufficiency_state);
  process.exit(1);
}
if (coreSufficiencyResult.core_input_sufficiency_state?.publishability_bucket !== "disclose_only_publishable") {
  console.error("Expected overall core-input sufficiency to remain publishable with disclosure only.");
  console.error("Actual core-input state:", coreSufficiencyResult.core_input_sufficiency_state);
  process.exit(1);
}
if (coreSufficiencyResult.section_eligibility?.sections?.renovation_strategy?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected renovation strategy to collapse as section-constrained, not block the report.");
  console.error("Actual renovation section:", coreSufficiencyResult.section_eligibility?.sections?.renovation_strategy);
  process.exit(1);
}
if (coreSufficiencyResult.section_eligibility?.sections?.debt_structure?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected debt structure to stay section-constrained without true current debt.");
  console.error("Actual debt section:", coreSufficiencyResult.section_eligibility?.sections?.debt_structure);
  process.exit(1);
}

const t12MissingGprResult = buildSourceReportCoverageQa({
  jobId: "t12-missing-gpr-smoke",
  userId: "user-smoke",
  propertyName: "T12 Missing GPR Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "t12-1", original_filename: "T12MissingGPR_T12.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "rr-1", original_filename: "T12MissingGPR_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
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
        totals: {
          summary_row_detected: true,
          total_units: 144,
          occupied_units: 138.24,
          occupancy: 0.96,
          in_place_rent_annual: 1962456,
        },
      },
    },
  ],
  html: [
    "<html><body>",
    "<h2>Operating Statement</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

if (t12MissingGprResult.t12_sufficiency_state?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected T12 without GPR to remain section-constrained but publishable.");
  console.error("Actual T12 state:", t12MissingGprResult.t12_sufficiency_state);
  process.exit(1);
}
if (t12MissingGprResult.core_input_sufficiency_state?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected overall core-input sufficiency to remain publishable when T12 is core-valid but missing GPR.");
  console.error("Actual core-input state:", t12MissingGprResult.core_input_sufficiency_state);
  process.exit(1);
}

const t12NoDetailResult = buildSourceReportCoverageQa({
  jobId: "t12-no-detail-smoke",
  userId: "user-smoke",
  propertyName: "T12 No Detail Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "t12-1", original_filename: "T12NoDetail_T12.pdf", doc_type: "t12", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "rr-1", original_filename: "T12NoDetail_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        gross_potential_rent: 3300000,
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
        totals: {
          summary_row_detected: true,
          total_units: 144,
          occupied_units: 138.24,
          occupancy: 0.96,
          in_place_rent_annual: 1962456,
        },
      },
    },
  ],
  html: [
    "<html><body>",
    "<h2>Operating Statement</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "</body></html>",
  ].join("\n"),
});

if (t12NoDetailResult.t12_sufficiency_state?.publishability_bucket !== "section_constrained_publishable") {
  console.error("Expected T12 with missing detail to remain section-constrained but publishable.");
  console.error("Actual T12 state:", t12NoDetailResult.t12_sufficiency_state);
  process.exit(1);
}
if (t12NoDetailResult.core_input_sufficiency_state?.publishability_bucket !== "disclose_only_publishable") {
  console.error("Expected overall core-input sufficiency to remain publishable with disclosure only when T12 lacks detail and reconciliation variance exists.");
  console.error("Actual core-input state:", t12NoDetailResult.core_input_sufficiency_state);
  process.exit(1);
}

const rentRollNoOccupancyStillUsable = buildSourceReportCoverageQa({
  jobId: "rent-roll-no-occupancy-still-usable-smoke",
  userId: "user-smoke",
  propertyName: "Core Usable Rent Roll",
  reportType: "screening",
  reportTier: 1,
  uploadedFiles: [
    { id: "t12-1", original_filename: "CoreUsable_T12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "rr-1", original_filename: "CoreUsable_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        gross_potential_rent: 210000,
        effective_gross_income: 198000,
        total_operating_expenses: 92000,
        net_operating_income: 106000,
        income_lines: [{ label: "Rent", amount: 198000 }],
        expense_lines: [{ label: "Taxes", amount: 30000 }],
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: 12,
        occupancy: null,
        totals: null,
        units: Array.from({ length: 12 }, (_, index) => ({
          unit: String(index + 1),
          current_rent: 1200 + index,
          status: null,
        })),
      },
    },
  ],
  html: "<html><body><h2>Screening</h2></body></html>",
});

if (rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state?.reason_code === "rent_roll_core_structure_missing") {
  console.error("Rent roll with credible unit rows and in-place rent should not be marked core-structure-missing solely due to occupancy/status/totals gaps.");
  console.error("Actual rent roll state:", rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state);
  process.exit(1);
}
if (rentRollNoOccupancyStillUsable.core_input_sufficiency_state?.publishability_bucket === "user_needs_documents") {
  console.error("Core-input sufficiency should remain publishable when T12 and rent roll core structure are usable.");
  console.error("Actual core-input state:", rentRollNoOccupancyStillUsable.core_input_sufficiency_state);
  process.exit(1);
}

const rentRollTrulyUnusable = buildSourceReportCoverageQa({
  jobId: "rent-roll-truly-unusable-smoke",
  userId: "user-smoke",
  propertyName: "Unusable Rent Roll",
  reportType: "screening",
  reportTier: 1,
  uploadedFiles: [
    { id: "t12-1", original_filename: "Unusable_T12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "rr-1", original_filename: "Unusable_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 198000,
        total_operating_expenses: 92000,
        net_operating_income: 106000,
      },
    },
    {
      type: "rent_roll_parsed",
      payload: {
        total_units: null,
        occupancy: null,
        totals: null,
        units: [],
      },
    },
  ],
  html: "<html><body><h2>Screening</h2></body></html>",
});

if (rentRollTrulyUnusable.rent_roll_sufficiency_state?.reason_code !== "rent_roll_core_structure_missing") {
  console.error("Truly unusable rent roll should still fail closed as core-structure-missing.");
  console.error("Actual rent roll state:", rentRollTrulyUnusable.rent_roll_sufficiency_state);
  process.exit(1);
}

console.log("source-report-coverage-qa smoke PASS");
