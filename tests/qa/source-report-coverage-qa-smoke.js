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
if (!["validated", "validated_partial", "validated_supported"].includes(String(acquisitionRenderedResult.acquisition_assumption_state?.acquisition_support_status || ""))) {
  console.error("Expected acquisition assumptions to remain validated, validated-partial, or validated-supported.");
  console.error("Actual state:", acquisitionRenderedResult.acquisition_assumption_state);
  process.exit(1);
}
if (!["validated", "validated_partial", "validated_supported"].includes(String(acquisitionRenderedResult.artifact_inventory?.loan_term_sheet_parsed?.acquisition_assumption_state?.acquisition_support_status || ""))) {
  console.error("Expected loan term sheet artifact inventory to carry validated acquisition state.");
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
if (rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state?.evidence?.occupancy_basis !== "row_positive_rent") {
  console.error("Expected row-derived positive-rent occupancy basis for no-explicit-occupancy case.");
  console.error("Actual rent roll evidence:", rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state?.evidence);
  process.exit(1);
}
if (rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state?.reason_code !== "rent_roll_occupancy_not_modeled") {
  console.error("Expected occupancy to remain not-modeled (section constrained) for row-positive-rent-only basis.");
  console.error("Actual rent roll state:", rentRollNoOccupancyStillUsable.rent_roll_sufficiency_state);
  process.exit(1);
}

const rentRollExplicitOccupancy = buildSourceReportCoverageQa({
  jobId: "rent-roll-explicit-occupancy-smoke",
  userId: "user-smoke",
  propertyName: "Explicit Occupancy Rent Roll",
  reportType: "screening",
  reportTier: 1,
  uploadedFiles: [
    { id: "t12-1", original_filename: "ExplicitOcc_T12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "rr-1", original_filename: "ExplicitOcc_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
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
        total_units: 12,
        totals: { total_units: 12, occupancy: 0.92, in_place_rent_annual: 174000, summary_row_detected: true },
      },
    },
  ],
  html: "<html><body><h2>Screening</h2></body></html>",
});

if (rentRollExplicitOccupancy.rent_roll_sufficiency_state?.evidence?.occupancy_basis !== "explicit_summary") {
  console.error("Expected explicit-summary occupancy basis when summary occupancy is provided.");
  console.error("Actual rent roll evidence:", rentRollExplicitOccupancy.rent_roll_sufficiency_state?.evidence);
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

const canonicalSeparatedNoisyDebtCues = buildSourceReportCoverageQa({
  jobId: "canonical-separated-noisy-debt-cues",
  userId: "user-smoke",
  propertyName: "Canonical Separated",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "Noisy_Debt_Terms.pdf", doc_type: "loan_term_sheet", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "2", original_filename: "Purchase_Assumptions.pdf", doc_type: "purchase_assumptions", mime_type: "application/pdf", parse_status: "parsed" },
    { id: "3", original_filename: "Core_T12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "4", original_filename: "Core_RentRoll.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    { type: "t12_parsed", payload: { effective_gross_income: 2500000, total_operating_expenses: 1200000, net_operating_income: 1300000 } },
    { type: "rent_roll_parsed", payload: { total_units: 80, occupancy: 0.95 } },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 20000000,
        ltv: 75,
        interest_rate: 5.2,
        amort_years: 30,
        derived_acquisition_loan_amount: 15000000,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  html: [
    "<h2>Debt Structure & Financing</h2>",
    "<p>Current Debt DSCR: 1.25x</p>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
    "<p>Proposed Acquisition Debt Sizing</p>",
    "<p>Derived Acquisition Loan Amount $15,000,000</p>",
  ].join("\n"),
});
if (canonicalSeparatedNoisyDebtCues.deterministic_flags.some((flag) => flag.code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT")) {
  console.error("Canonical acquisition-separated state should prevent authoritative purchase-assumptions debt-structure flag.");
  process.exit(1);
}

const canonicalComputedCurrentDebtNoisyHints = buildSourceReportCoverageQa({
  jobId: "canonical-computed-current-debt-noisy-hints",
  userId: "user-smoke",
  propertyName: "Canonical Computed Debt",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "finance-note.txt", doc_type: "supporting_documents_unclassified", mime_type: "text/plain", parse_status: "parsed" },
    { id: "2", original_filename: "ops-t12.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "3", original_filename: "rr.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    { type: "t12_parsed", payload: { effective_gross_income: 1800000, total_operating_expenses: 900000, net_operating_income: 900000 } },
    { type: "rent_roll_parsed", payload: { total_units: 60, occupancy: 0.96 } },
    {
      type: "mortgage_statement_parsed",
      payload: {
        outstanding_balance: 7000000,
        monthly_payment: 42000,
        annual_debt_service: 504000,
        interest_rate: 4.9,
        amort_years: 25,
      },
    },
  ],
  html: [
    "<h2>Current Debt Coverage</h2>",
    "<p>Current Debt DSCR 1.79x</p>",
    "<p>Debt structure reviewed.</p>",
  ].join("\n"),
});
if (canonicalComputedCurrentDebtNoisyHints.deterministic_flags.some((flag) => flag.code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT")) {
  console.error("Canonical computed current debt with support present should not fail from weak filename/doc-type hints.");
  process.exit(1);
}

const canonicalAbsentLegacyFallbackStillSignals = buildSourceReportCoverageQa({
  jobId: "canonical-absent-legacy-fallback-signals",
  userId: "user-smoke",
  propertyName: "Fallback Property",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "Debt_Terms.docx", doc_type: "supporting_documents_unclassified", mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", parse_status: "parsed" },
    { id: "2", original_filename: "T12_Fallback.xlsx", doc_type: "t12", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
    { id: "3", original_filename: "RentRoll_Fallback.xlsx", doc_type: "rent_roll", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", parse_status: "parsed" },
  ],
  artifacts: [
    { type: "t12_parsed", payload: { effective_gross_income: 900000, total_operating_expenses: 500000, net_operating_income: 400000 } },
    { type: "rent_roll_parsed", payload: { total_units: 24, occupancy: 0.9 } },
  ],
  html: [
    "<h2>Debt Structure</h2>",
    "<p>Current Debt DSCR</p>",
    "<p>current debt terms were not fully provided</p>",
    "<p>No current debt document provided</p>",
  ].join("\n"),
});
if (
  !canonicalAbsentLegacyFallbackStillSignals.rendered_text_signals.includes("dscr_current_debt_not_assessed") &&
  !canonicalAbsentLegacyFallbackStillSignals.rendered_text_signals.includes("debt_sizing_balance_not_provided")
) {
  console.error("Legacy fallback should still retain debt/acquisition diagnostics when canonical debt/acquisition state is absent.");
  process.exit(1);
}

const canonicalSectionOmittedWithRenderedHeading = buildSourceReportCoverageQa({
  jobId: "canonical-section-omitted-rendered-heading",
  userId: "user-smoke",
  propertyName: "Canonical Omitted Section",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Debt Structure & Financing</h2><p>Rendered debt section marker appears.</p>",
  sectionEligibility: {
    sections: {
      debt_structure: {
        eligible: false,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  coreInputSufficiencyState: { status: "core_sufficient_publishable", publishability_bucket: "core_sufficient_publishable" },
  t12SufficiencyState: { status: "core_sufficient_publishable" },
  rentRollSufficiencyState: { status: "core_sufficient_publishable" },
  dataCoverageState: { headlineMode: "underwriting_scope", severityState: "core_inputs_confirmed" },
});
if (canonicalSectionOmittedWithRenderedHeading.section_eligibility?.sections?.debt_structure?.omitted !== true) {
  console.error("Canonical omitted debt section should remain authoritative despite rendered heading.");
  process.exit(1);
}
if (canonicalSectionOmittedWithRenderedHeading.section_eligibility?.sections?.debt_structure?.source_constrained !== true) {
  console.error("Canonical source-constrained debt section should remain authoritative.");
  process.exit(1);
}

const canonicalSectionEligibleMissingHeading = buildSourceReportCoverageQa({
  jobId: "canonical-section-eligible-missing-heading",
  userId: "user-smoke",
  propertyName: "Canonical Eligible Section",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Operating Profile</h2><p>No explicit DCF heading rendered in this snippet.</p>",
  sectionEligibility: {
    sections: {
      dcf: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  coreInputSufficiencyState: { status: "core_sufficient_publishable", publishability_bucket: "core_sufficient_publishable" },
  t12SufficiencyState: { status: "core_sufficient_publishable" },
  rentRollSufficiencyState: { status: "core_sufficient_publishable" },
  dataCoverageState: { headlineMode: "underwriting_scope", severityState: "core_inputs_confirmed" },
});
if (canonicalSectionEligibleMissingHeading.section_eligibility?.sections?.dcf?.eligible !== true) {
  console.error("Canonical eligible DCF section should not be downgraded by missing rendered heading.");
  process.exit(1);
}
if (canonicalSectionEligibleMissingHeading.section_eligibility?.sections?.dcf?.omitted !== false) {
  console.error("Canonical rendered DCF section should not be marked omitted from rendered-heading inference.");
  process.exit(1);
}

const canonicalCleanNoisyRenderedPhrases = buildSourceReportCoverageQa({
  jobId: "canonical-clean-noisy-rendered-phrases",
  userId: "user-smoke",
  propertyName: "Canonical Clean Coverage",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: [
    "<h2>Data Coverage & Underwriting Scope</h2>",
    "<p>No line-item detail available for this T12 format.</p>",
    "<p>Current debt terms were not fully provided.</p>",
    "<p>No current debt document provided.</p>",
  ].join("\n"),
  sectionEligibility: {
    sections: {
      operating_profile: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
    },
  },
  coreInputSufficiencyState: { status: "core_sufficient_publishable", publishability_bucket: "core_sufficient_publishable" },
  t12SufficiencyState: { status: "core_sufficient_publishable" },
  rentRollSufficiencyState: { status: "core_sufficient_publishable" },
  dataCoverageState: { headlineMode: "underwriting_scope", severityState: "core_inputs_confirmed" },
});
const canonicalCleanNoisyCodes = new Set(canonicalCleanNoisyRenderedPhrases.deterministic_flags.map((flag) => flag.code));
if (canonicalCleanNoisyCodes.has("T12_LINE_ITEM_DETAIL_MISSING") || canonicalCleanNoisyCodes.has("PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT")) {
  console.error("Rendered noisy phrases should not create authoritative parser/artifact gaps when canonical sufficiency/eligibility states exist.");
  console.error("Actual flags:", Array.from(canonicalCleanNoisyCodes).join(", "));
  process.exit(1);
}
if (canonicalCleanNoisyRenderedPhrases.deterministic_flags.some((flag) => flag.routing === "public_sample_blocker" || flag.routing === "artifact_gap" || flag.routing === "parser_gap")) {
  console.error("Canonical clean state should not produce readiness-style blockers from rendered phrases alone.");
  console.error("Actual flags:", canonicalCleanNoisyRenderedPhrases.deterministic_flags);
  process.exit(1);
}

const canonicalConstrainedCleanRendered = buildSourceReportCoverageQa({
  jobId: "canonical-constrained-clean-rendered",
  userId: "user-smoke",
  propertyName: "Canonical Constrained Coverage",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Data Coverage & Underwriting Scope</h2><p>All inputs appear complete.</p>",
  sectionEligibility: {
    sections: {
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: true },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: true },
    },
    source_constrained: true,
    source_constrained_section_count: 2,
  },
  coreInputSufficiencyState: { status: "disclose_only_publishable", publishability_bucket: "disclose_only_publishable" },
  t12SufficiencyState: { status: "core_sufficient_publishable" },
  rentRollSufficiencyState: { status: "core_sufficient_publishable" },
  dataCoverageState: { headlineMode: "underwriting_scope", severityState: "source_limitations_disclosure" },
});
if (canonicalConstrainedCleanRendered.section_eligibility?.sections?.debt_structure?.source_constrained !== true) {
  console.error("Canonical constrained section should remain authoritative even when rendered text appears clean.");
  process.exit(1);
}
if (canonicalConstrainedCleanRendered.section_eligibility?.sections?.debt_structure?.omitted !== true) {
  console.error("Canonical omitted debt section should remain omitted despite clean rendered copy.");
  process.exit(1);
}

const acquisitionOnlyLoanTermNotCurrentDebt = buildSourceReportCoverageQa({
  jobId: "acquisition-only-loan-term-not-current-debt",
  userId: "user-smoke",
  propertyName: "Acquisition Only Loan Term",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 1800000,
        total_operating_expenses: 900000,
        net_operating_income: 900000,
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        outstanding_balance: 15000000,
        purchase_price: 20000000,
        ltv: 75,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  html: "<h2>Debt Structure</h2><p>Acquisition assumptions only.</p>",
});
if (acquisitionOnlyLoanTermNotCurrentDebt.current_debt_state?.current_debt_dscr_status !== "not_assessed") {
  console.error("Acquisition/proposed loan term should not become assessed current debt.");
  process.exit(1);
}
if (acquisitionOnlyLoanTermNotCurrentDebt.current_debt_state?.has_true_current_debt_balance === true) {
  console.error("Acquisition/proposed loan term should not produce true current debt balance.");
  process.exit(1);
}
if (acquisitionOnlyLoanTermNotCurrentDebt.artifact_inventory?.loan_term_sheet_parsed?.present !== true) {
  console.error("Loan term artifact should remain present for acquisition support context.");
  process.exit(1);
}

const explicitCurrentDebtLoanTermAccepted = buildSourceReportCoverageQa({
  jobId: "explicit-current-debt-loan-term-accepted",
  userId: "user-smoke",
  propertyName: "Explicit Current Debt Loan Term",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 2200000,
        total_operating_expenses: 1000000,
        net_operating_income: 1200000,
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        semantic_doc_role: "current_debt_terms",
        debt_basis: "existing_mortgage_debt",
        current_outstanding_balance: 8000000,
        interest_rate: 5.5,
        amort_years: 25,
        annual_debt_service: 560000,
      },
    },
  ],
  html: "<h2>Current Debt Coverage</h2>",
});
if (explicitCurrentDebtLoanTermAccepted.current_debt_state?.current_debt_dscr_status !== "computed") {
  console.error("Explicit current-debt loan term should be accepted for computed current debt.");
  process.exit(1);
}
if (explicitCurrentDebtLoanTermAccepted.current_debt_state?.has_true_current_debt_balance !== true) {
  console.error("Explicit current-debt loan term should produce true current debt balance.");
  process.exit(1);
}

const mixedAcquisitionAndCurrentDebtPackage = buildSourceReportCoverageQa({
  jobId: "mixed-acquisition-and-current-debt-package",
  userId: "user-smoke",
  propertyName: "Mixed Debt Package",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 2000000,
        total_operating_expenses: 900000,
        net_operating_income: 1100000,
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 25000000,
        ltv: 70,
        derived_acquisition_loan_amount: 17500000,
        debt_basis: "acquisition_financing_assumption",
      },
    },
    {
      type: "loan_term_sheet_parsed",
      payload: {
        semantic_doc_role: "current_debt_terms",
        debt_basis: "existing_mortgage_debt",
        current_outstanding_balance: 9000000,
        interest_rate: 5.25,
        amort_years: 30,
        annual_debt_service: 600000,
      },
    },
  ],
  html: "<h2>Debt Structure & Financing</h2><p>Includes current debt and acquisition assumptions.</p>",
});
if (mixedAcquisitionAndCurrentDebtPackage.current_debt_state?.current_debt_dscr_status !== "computed") {
  console.error("Mixed package should select explicit current-debt row for current debt assessment.");
  process.exit(1);
}
if (mixedAcquisitionAndCurrentDebtPackage.acquisition_assumption_state?.has_proposed_acquisition_financing !== true) {
  console.error("Mixed package should preserve acquisition support separately.");
  process.exit(1);
}

const canonicalAuthorityProvenanceResult = buildSourceReportCoverageQa({
  jobId: "canonical-authority-provenance",
  userId: "user-smoke",
  propertyName: "Canonical Authority Provenance",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "DebtNotes.txt", doc_type: "supporting_documents_unclassified", parse_status: "parsed" },
    { id: "2", original_filename: "AcquisitionTerms.pdf", doc_type: "supporting_documents", parse_status: "parsed" },
  ],
  artifacts: [
    {
      type: "loan_term_sheet_parsed",
      payload: {
        purchase_price: 12000000,
        ltv: 75,
        debt_basis: "acquisition_financing_assumption",
      },
    },
  ],
  html: [
    "<h2>Data Coverage</h2>",
    "<p>Current debt service is not assessed because no current outstanding debt balance was provided.</p>",
    "<p>No current debt document provided.</p>",
    "<p>Proposed Acquisition Debt Sizing appears in this narrative text only.</p>",
  ].join("\n"),
  coreInputSufficiencyState: { publishability_bucket: "core_sufficient_publishable" },
  t12SufficiencyState: { is_sufficient: true },
  rentRollSufficiencyState: { is_sufficient: true },
  sectionEligibility: { sections: { debt_structure: { eligible: true, rendered: true, source_constrained: false, omitted: false } } },
  dataCoverageState: { headlineMode: "underwriting_scope", severityState: "core_inputs_confirmed" },
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    current_debt_assessed: false,
    has_proposed_acquisition_financing: true,
  },
  acquisitionAssumptionState: { has_proposed_acquisition_financing: true, has_validated_acquisition_assumptions: true },
});
if (canonicalAuthorityProvenanceResult.authority_provenance?.coverage_authoritative !== true) {
  console.error("Expected canonical coverage authority marker when canonical states are supplied.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.section_eligibility_authoritative !== true) {
  console.error("Expected canonical section authority marker when canonical section eligibility is supplied.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.sufficiency_authoritative !== true) {
  console.error("Expected canonical sufficiency authority marker when canonical sufficiency states are supplied.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.debt_acquisition_authoritative !== true) {
  console.error("Expected canonical debt/acquisition authority marker when canonical debt/acquisition states are supplied.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.current_debt_state_source !== "canonical_input") {
  console.error("Expected current debt state to be marked canonical_input.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.acquisition_assumption_state_source !== "canonical_input") {
  console.error("Expected acquisition assumption state to be marked canonical_input.");
  process.exit(1);
}
if (canonicalAuthorityProvenanceResult.authority_provenance?.legacy_fallback_active !== false) {
  console.error("Expected legacy fallback to be inactive when canonical authority is present.");
  process.exit(1);
}
if (
  canonicalAuthorityProvenanceResult.deterministic_flags.some(
    (flag) =>
      flag.code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT" ||
      flag.routing === "artifact_gap" ||
      flag.routing === "parser_gap"
  )
) {
  console.error("Canonical-present path should not promote noisy rendered/artifact cues to authoritative artifact/parser gaps.");
  process.exit(1);
}

const canonicalSectionEligibilityOnlyAuthorityResult = buildSourceReportCoverageQa({
  jobId: "canonical-section-eligibility-only-authority",
  userId: "user-smoke",
  propertyName: "Canonical Section Eligibility Only",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [
    { id: "1", original_filename: "DebtNotes.txt", doc_type: "supporting_documents_unclassified", parse_status: "parsed" },
  ],
  artifacts: [],
  html: [
    "<h2>Data Coverage</h2>",
    "<p>No line-item detail available.</p>",
    "<p>Current debt service not assessed.</p>",
    "<p>Current debt balance not provided.</p>",
  ].join("\n"),
  sectionEligibility: {
    sections: {
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: true },
    },
  },
});
if (canonicalSectionEligibilityOnlyAuthorityResult.authority_provenance?.section_eligibility_authoritative !== true) {
  console.error("Expected canonical section eligibility authority when explicit sectionEligibility input is provided.");
  process.exit(1);
}
if (canonicalSectionEligibilityOnlyAuthorityResult.authority_provenance?.coverage_authoritative !== true) {
  console.error("Expected canonical coverage authority to be active when explicit sectionEligibility input is provided.");
  process.exit(1);
}
if (
  canonicalSectionEligibilityOnlyAuthorityResult.deterministic_flags.some(
    (flag) =>
      flag.code === "T12_LINE_ITEM_DETAIL_MISSING" ||
      flag.code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT" ||
      flag.routing === "artifact_gap" ||
      flag.routing === "parser_gap"
  )
) {
  console.error("Section-eligibility canonical authority should suppress legacy sufficiency truth-making flags.");
  process.exit(1);
}

const canonicalAbsentProvenanceFallbackResult = buildSourceReportCoverageQa({
  jobId: "canonical-absent-provenance-fallback",
  userId: "user-smoke",
  propertyName: "Canonical Absent Fallback",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Data Coverage</h2><p>Fallback mode</p>",
});
if (canonicalAbsentProvenanceFallbackResult.authority_provenance?.current_debt_state_source !== "fallback_reconstructed") {
  console.error("Expected fallback-reconstructed current debt source when canonical state is absent.");
  process.exit(1);
}
if (canonicalAbsentProvenanceFallbackResult.authority_provenance?.acquisition_assumption_state_source !== "fallback_reconstructed") {
  console.error("Expected fallback-reconstructed acquisition source when canonical state is absent.");
  process.exit(1);
}
if (canonicalAbsentProvenanceFallbackResult.authority_provenance?.legacy_fallback_active !== true) {
  console.error("Expected legacy fallback to remain active when canonical authority is absent.");
  process.exit(1);
}

const underwritingScreeningLikeDepthMismatchResult = buildSourceReportCoverageQa({
  jobId: "underwriting-screening-like-depth-mismatch",
  userId: "user-smoke",
  propertyName: "Depth Mismatch",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: [
    "<h2>Operating Statement</h2>",
    "<p>Limited operating summary only.</p>",
  ].join("\n"),
  sectionEligibility: {
    sections: {
      operating_statement: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      operating_profile: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      expense_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      noi_stability: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      methodology: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
    },
  },
});
if (!underwritingScreeningLikeDepthMismatchResult.deterministic_flags.some((flag) => flag.code === "UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE")) {
  console.error("Expected UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE for underwriting rendered with screening-like depth.");
  process.exit(1);
}

const underwritingDebtNotAssessedAllowedResult = buildSourceReportCoverageQa({
  jobId: "underwriting-debt-not-assessed-allowed",
  userId: "user-smoke",
  propertyName: "Debt Limitation Allowed",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: [
    "<h2>Operating Statement</h2>",
    "<h2>Operating Profile</h2>",
    "<h2>Expense Structure</h2>",
    "<h2>NOI Stability</h2>",
    "<h2>Data Coverage</h2>",
    "<h2>Methodology & Data Transparency</h2>",
    "<p>No current debt document provided. Current-debt DSCR and refinance capacity were not assessed because no true current debt balance was verified.</p>",
  ].join("\n"),
  sectionEligibility: {
    sections: {
      operating_statement: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      operating_profile: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      expense_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      noi_stability: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      methodology: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: true },
    },
  },
});
if (underwritingDebtNotAssessedAllowedResult.deterministic_flags.some((flag) => flag.code === "UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE")) {
  console.error("Did not expect depth conformance failure when underwriting debt is canonically source-constrained with clear limitation copy.");
  process.exit(1);
}

const screeningDoesNotTriggerDepthConformanceResult = buildSourceReportCoverageQa({
  jobId: "screening-depth-guard-not-triggered",
  userId: "user-smoke",
  propertyName: "Screening Depth",
  reportType: "screening",
  reportTier: 1,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Operating Statement</h2><p>Screening summary</p>",
  sectionEligibility: {
    sections: {
      operating_statement: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      operating_profile: { eligible: true, rendered: false, omitted: true, source_constrained: false },
      expense_structure: { eligible: true, rendered: false, omitted: true, source_constrained: false },
      noi_stability: { eligible: true, rendered: false, omitted: true, source_constrained: false },
      data_coverage: { eligible: true, rendered: false, omitted: true, source_constrained: false },
      methodology: { eligible: true, rendered: false, omitted: true, source_constrained: false },
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: false },
    },
  },
});
if (screeningDoesNotTriggerDepthConformanceResult.deterministic_flags.some((flag) => flag.code === "UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE")) {
  console.error("Screening report must not trigger underwriting depth conformance flag.");
  process.exit(1);
}

const underwritingDebtAssessedPassResult = buildSourceReportCoverageQa({
  jobId: "underwriting-debt-assessed-pass",
  userId: "user-smoke",
  propertyName: "Debt Assessed",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: [
    "<h2>Operating Statement</h2>",
    "<h2>Operating Profile</h2>",
    "<h2>Expense Structure</h2>",
    "<h2>NOI Stability</h2>",
    "<h2>Debt Structure & Financing</h2>",
    "<h2>Data Coverage</h2>",
    "<h2>Methodology & Data Transparency</h2>",
  ].join("\n"),
  sectionEligibility: {
    sections: {
      operating_statement: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      operating_profile: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      expense_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      noi_stability: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      methodology: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
    },
  },
});
if (underwritingDebtAssessedPassResult.deterministic_flags.some((flag) => flag.code === "UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE")) {
  console.error("Did not expect depth conformance failure for underwriting with canonical debt assessed and debt section rendered.");
  process.exit(1);
}

const canonicalDebtComputedRenderedWeakPhraseResult = buildSourceReportCoverageQa({
  jobId: "canonical-debt-computed-rendered-weak-phrase",
  userId: "user-smoke",
  propertyName: "Canonical Debt Computed",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<p>No current debt document provided.</p>",
  currentDebtState: {
    current_debt_dscr_status: "computed",
    current_debt_assessed: true,
    has_true_current_debt_balance: true,
    current_debt_dscr: 1.22,
  },
  acquisitionAssumptionState: {
    has_proposed_acquisition_financing: false,
  },
  sectionEligibility: {
    sections: {
      debt_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
    },
  },
});
if (canonicalDebtComputedRenderedWeakPhraseResult.current_debt_state?.current_debt_dscr_status !== "computed") {
  console.error("Canonical computed debt state should remain authoritative despite rendered weak phrase.");
  process.exit(1);
}
if (!canonicalDebtComputedRenderedWeakPhraseResult.deterministic_flags.some((flag) => flag.code === "CURRENT_DEBT_CANONICAL_RENDER_STATE_DRIFT")) {
  console.error("Expected canonical-vs-render debt state drift flag for computed canonical debt with not-assessed rendered phrase.");
  process.exit(1);
}

const canonicalDebtNotAssessedRenderedDebtPhraseResult = buildSourceReportCoverageQa({
  jobId: "canonical-debt-not-assessed-rendered-debt-phrase",
  userId: "user-smoke",
  propertyName: "Canonical Debt Not Assessed",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<p>Current debt terms were not fully provided.</p>",
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    current_debt_assessed: false,
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_current_debt_document",
  },
  acquisitionAssumptionState: {
    has_proposed_acquisition_financing: false,
  },
  sectionEligibility: {
    sections: {
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: true },
    },
  },
});
if (canonicalDebtNotAssessedRenderedDebtPhraseResult.current_debt_state?.current_debt_dscr_status !== "not_assessed") {
  console.error("Rendered debt-like phrase must not promote canonical not-assessed debt state.");
  process.exit(1);
}
if (canonicalDebtNotAssessedRenderedDebtPhraseResult.current_debt_state?.has_true_current_debt_balance === true) {
  console.error("Rendered debt-like phrase must not set canonical true current debt balance.");
  process.exit(1);
}

const canonicalAcquisitionOnlyRenderedDebtLookingPhraseResult = buildSourceReportCoverageQa({
  jobId: "canonical-acquisition-only-rendered-debt-looking-phrase",
  userId: "user-smoke",
  propertyName: "Canonical Acquisition Only",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<p>Proposed Acquisition Debt Sizing</p><p>Current debt terms were not fully provided.</p>",
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    current_debt_assessed: false,
    has_true_current_debt_balance: false,
    has_proposed_acquisition_financing: true,
    current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
  },
  acquisitionAssumptionState: {
    has_proposed_acquisition_financing: true,
    has_validated_acquisition_assumptions: true,
    current_debt_separated: true,
  },
  sectionEligibility: {
    sections: {
      debt_structure: { eligible: true, rendered: false, omitted: true, source_constrained: true },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: true },
    },
  },
});
if (canonicalAcquisitionOnlyRenderedDebtLookingPhraseResult.current_debt_state?.has_true_current_debt_balance === true) {
  console.error("Canonical acquisition-only state must not be promoted to true current debt by rendered debt-looking phrases.");
  process.exit(1);
}

const canonicalSectionMissingHeadingConformanceResult = buildSourceReportCoverageQa({
  jobId: "canonical-section-missing-heading-conformance",
  userId: "user-smoke",
  propertyName: "Canonical Missing Heading",
  reportType: "underwriting",
  reportTier: 2,
  uploadedFiles: [],
  artifacts: [],
  html: "<h2>Operating Statement</h2><h2>Data Coverage</h2>",
  sectionEligibility: {
    sections: {
      operating_statement: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      operating_profile: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      expense_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      noi_stability: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      data_coverage: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      methodology: { eligible: true, rendered: true, omitted: false, source_constrained: false },
      debt_structure: { eligible: true, rendered: true, omitted: false, source_constrained: false },
    },
  },
});
if (!canonicalSectionMissingHeadingConformanceResult.deterministic_flags.some((flag) => flag.code === "UNDERWRITING_RENDERED_DEPTH_CONFORMANCE_FAILURE")) {
  console.error("Expected conformance mismatch flag when canonical section eligibility is broad but rendered section families are missing.");
  process.exit(1);
}
if (canonicalSectionMissingHeadingConformanceResult.section_eligibility?.sections?.operating_profile?.eligible !== true) {
  console.error("Missing rendered heading should not mutate canonical section eligibility truth.");
  process.exit(1);
}

console.log("source-report-coverage-qa smoke PASS");
