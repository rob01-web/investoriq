import assert from "assert";
import fs from "fs";

process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.INVESTORIQ_ENABLE_TEST_HOOKS = process.env.INVESTORIQ_ENABLE_TEST_HOOKS || "true";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";
process.env.ADMIN_RUN_KEY = process.env.ADMIN_RUN_KEY || "test-admin-run-key";

const { __test__: rawGeneratorTest } = await import("../../api/generate-client-report.js");
const {
  buildCanonicalSupportDocAuthorityRows,
  buildDocumentTreatmentSummaryHtml,
  buildPreliminaryFinancingReadinessSummaryHtml,
  buildAcquisitionFinancingAssumptionsHtml,
  buildAcquisitionFinancingReadinessHtml,
  buildHistoricalCapexDisplayCopy,
  resolveRenovationDisplayMode,
  buildFrameworkSensitivityDisplayCopy,
} = await import("../../api/_lib/document-treatment-authority.js");
const generatorTest = {
  ...rawGeneratorTest,
  buildCanonicalSupportDocAuthorityRows,
  buildDocumentTreatmentSummaryHtml,
  buildPreliminaryFinancingReadinessSummaryHtml,
  buildAcquisitionFinancingAssumptionsHtml,
  buildAcquisitionFinancingReadinessHtml,
  buildHistoricalCapexDisplayCopy,
  buildRenovationDisplayCopy: buildHistoricalCapexDisplayCopy,
  resolveRenovationDisplayMode,
  buildFrameworkSensitivityDisplayCopy,
};
const generateClientReport = (await import("../../api/generate-client-report.js")).default;
const {
  buildDeliveryResponseCompatibilityAliases,
  buildReportStoragePath,
  assertValidReportPublicationInsert,
  isValidReportStoragePath,
} = await import("../../api/_lib/report-delivery-output.js");
const {
  buildCurrentDebtAssessmentState,
  buildAcquisitionAssumptionState,
  buildFullUnderwritingSectionEligibility,
  buildCanonicalVisibleClassificationState,
  buildSourceReconciliationState,
  buildSourceReconciliationRenderState,
  resolveCanonicalRentRollAnnualTotals,
} = await import("../../api/_lib/report-surface-contracts.js");
const {
  formatCurrentDebtAssessmentCopy,
} = await import("../../api/_lib/acquisition-memo-v2-surface-copy.js");
const {
  buildSupportDocTaxonomyState,
  resolveCanonicalSupportDocAuthority,
} = await import("../../api/_lib/support-doc-taxonomy.js");
const { buildCanonicalDeliveryDecisionState } = await import("../../api/_lib/qa-action-plan.js");
const { buildFullUnderwritingState } = await import("../../api/_lib/full-underwriting-state.js");
const { buildReportContractQa } = await import("../../api/_lib/report-contract-qa.js");

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
const formatPercent1 = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
};
const healQaArtifacts = [
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
const healQaCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true, unit_count: 10, occupancy: 1 },
  },
};
const reportSource = fs.readFileSync("api/generate-client-report.js", "utf8");
const contractsSource = fs.readFileSync("api/_lib/report-surface-contracts.js", "utf8");
const templateSource = fs.readFileSync("api/report-template-runtime.html", "utf8");
assert.equal(/<h3>\s*InvestorIQ Estimates\s*<\/h3>/.test(reportSource), false);
assert.match(reportSource, /Document-Backed Screening Outputs/);
assert.match(reportSource, /Document-Backed Acquisition Memo Outputs/);
const legacyFallbackCallCount = (reportSource.match(/resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback\(/g) || []).length;
assert.equal(legacyFallbackCallCount, 2);
assert.ok(
  contractsSource.includes('const dcfSourceConstrained =') &&
    contractsSource.includes('sectionKey === "dcf"') &&
    contractsSource.includes('!hasVerifiedCurrentDebtBalance')
);
assert.ok(
  contractsSource.includes('const advancedModelingSourceConstrained =') &&
    contractsSource.includes('sectionKey === "advanced_modeling"') &&
    contractsSource.includes('!hasVerifiedCurrentDebtBalance')
);
assert.match(reportSource, /if \(effectiveReportMode === "v1_core"\) \{[\s\S]*stripMarkedSection\(finalHtml, "SECTION_7_REFI_STABILITY"\)[\s\S]*stripMarkedSection\(finalHtml, "SECTION_9_DCF"\)[\s\S]*stripMarkedSection\(finalHtml, "SECTION_10_ADV_MODEL"\)[\s\S]*stripMarkedSection\(finalHtml, "SECTION_CHART_EQUITY_COMPONENTS"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_10_COMPARABLE_CONTEXT"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "RELATIVE_POSITIONING"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_9_DCF"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_10_ADV_MODEL"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_10_DCF_SUMMARY"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_3"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_9_DCF_TABLE"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "EXEC_DSCR_CARD"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_7_DEBT"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_7_DEBT_TABLES"\)/);
assert.match(reportSource, /stripMarkedSection\(finalHtml, "SECTION_8_DEAL_SCORE"\)/);
assert.match(reportSource, /buildRelativePositioningCopy\(/);
assert.match(templateSource, /<!-- BEGIN SECTION_10_COMPARABLE_CONTEXT -->/);
assert.match(templateSource, /<!-- BEGIN RELATIVE_POSITIONING -->/);
assert.match(templateSource, /\{\{RELATIVE_POSITIONING_COPY\}\}/);
assert.match(templateSource, /\{\{RELATIVE_POSITIONING_NOTE\}\}/);

const fullRenderSupportDocuments = [
  { original_filename: "T12_Operating_Statement.pdf", doc_type: "t12", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:00:00Z" },
  { original_filename: "Rent_Roll_Summary.pdf", doc_type: "rent_roll", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:01:00Z" },
  {
    original_filename: "Current_Loan_Summary.pdf",
    doc_type: "supporting_document",
    semantic_doc_role: "current_mortgage_statement",
    outstanding_balance: 7250000,
    interest_rate: 0.0615,
    amort_years: 25,
    monthly_payment: 46531,
    parse_status: "parsed",
    parse_error: "",
    uploaded_at: "2026-06-04T12:02:00Z",
  },
  {
    original_filename: "Purchase_Assumptions.pdf",
    doc_type: "appraisal",
    semantic_doc_role: "appraisal",
    purchase_price: 10640000,
    going_in_cap_rate: 0.058,
    noi_basis: 611800,
    parse_status: "parsed",
    parse_error: "",
    uploaded_at: "2026-06-04T12:03:00Z",
  },
  { original_filename: "Property_Tax_Support.pdf", doc_type: "supporting_document", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:04:00Z" },
  { original_filename: "CapEx_Notes.txt", doc_type: "supporting_document", parse_status: "parsed_with_warnings", parse_error: "", uploaded_at: "2026-06-04T12:05:00Z" },
  { original_filename: "Market_Rent_Survey_Excerpt.txt", doc_type: "supporting_document", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:06:00Z" },
  { original_filename: "Broker_Email_Context.msg", doc_type: "supporting_document", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:07:00Z" },
  { original_filename: "Phase_I_ESA_Context.pdf", doc_type: "supporting_document", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:08:00Z" },
  { original_filename: "Unsupported_Appraisal_Excerpt.pdf", doc_type: "supporting_document", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:09:00Z" },
  {
    original_filename: "This_is_an_extremely_long_supporting_document_filename_that_should_wrap_cleanly_in_the_document_treatment_summary_table_for_audit_transparency_only.txt",
    doc_type: "supporting_document",
    parse_status: "parsed",
    parse_error: "",
    uploaded_at: "2026-06-04T12:09:30Z",
  },
  { id: "purchase-acq-file", original_filename: "purchase_assumptions_source.txt", doc_type: "loan_term_sheet", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:10:00Z" },
  { id: "purchase-appraisal-file", original_filename: "purchase_assumptions_source.txt", doc_type: "appraisal", parse_status: "parsed", parse_error: "", uploaded_at: "2026-06-04T12:11:00Z" },
];

const fullRenderCoverageArtifacts = [
  {
    type: "loan_term_sheet_parsed",
    payload: {
      file_id: "purchase-acq-file",
      original_filename: "purchase_assumptions_source.txt",
      semantic_doc_role: "purchase_assumptions",
      semantic_doc_display_label: "purchase_assumptions",
      validated: true,
      purchase_price: 10640000,
      going_in_cap_rate: 0.0575,
      noi_basis: 611800,
      debt_basis: "acquisition_financing_assumption",
      accepted_fields: ["purchase_price", "going_in_cap_rate", "noi_basis"],
    },
  },
  {
    type: "appraisal_parsed",
    payload: {
      file_id: "purchase-appraisal-file",
      original_filename: "purchase_assumptions_source.txt",
      semantic_doc_role: "appraisal",
      semantic_doc_display_label: "appraisal",
      validated: false,
      cap_rate: 0.0575,
    },
  },
];

const fullRenderHarnessRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_full_render_smoke",
    report_type: "underwriting",
    property_name: "Harbourstone",
    sections: {
      unitValueAdd: "Source-bound launch memo context for operating and rent positioning only.",
      neighborhoodAnalysis: "Source context and support-doc treatment remain limited to documented inputs.",
    },
    sectionEligibility: {
      source_constrained_section_count: 0,
      sections: {
        operating_profile: { rendered: true, eligible: true, source_constrained: false, omitted: false },
        operating_statement: { rendered: true, eligible: true, source_constrained: false, omitted: false },
        market_context: { rendered: true, eligible: true, source_constrained: false, omitted: false },
        data_coverage: { rendered: true, eligible: true, source_constrained: false, omitted: false },
      },
    },
    __test_return_final_html: true,
    __test_payloads: {
      t12Payload: {
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
        gross_potential_rent: 1850000,
        gross_scheduled_rent: 1850000,
      },
      loanTermSheetTermsPayload: {
        debt_basis: "current_debt_context",
        outstanding_balance: 8750000,
        ltv: 0.70,
        interest_rate: 0.058,
        amortization_years: 30,
        source_text: "Current debt support for lender discussion only.",
        semantic_doc_role: "loan_debt_support",
        semantic_doc_display_label: "loan_debt_support",
      },
      acquisitionTermsPayload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 10640000,
        going_in_cap_rate: 0.058,
        noi_basis: 611800,
        source_text: "Purchase assumptions / acquisition context for launch-mode readiness only.",
      },
      mortgagePayload: {
        outstanding_balance: 8750000,
        interest_rate: 0.0525,
        amort_years: 30,
        ltv: 0.70,
        monthly_payment: 52500,
      },
      rentRollPayload: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_market_annual: 1137600,
        units: [
          { unit: "101", status: "occupied", in_place_rent: 2100, market_rent: 2250, beds: 1, sqft: 720 },
          { unit: "102", status: "occupied", in_place_rent: 2125, market_rent: 2275, beds: 1, sqft: 735 },
          { unit: "201", status: "vacant", in_place_rent: 0, market_rent: 2300, beds: 2, sqft: 980 },
        ],
        totals: {
          summary_row_detected: true,
          total_units: 48,
          occupied_units: 46,
          vacant_units: 2,
          occupancy: 0.9583333333,
          in_place_rent_annual: 1036800,
          market_rent_annual: 1137600,
        },
      },
      computedRentRoll: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_annual_market: 1137600,
        annual_in_place_rent: 1036800,
        annual_market_rent: 1137600,
        avg_in_place_rent: 1800,
        avg_market_rent: 1980,
        rent_to_market_gap: 0.0961538462,
        units: [
          { unit: "101", status: "occupied", in_place_rent: 2100, market_rent: 2250, beds: 1, sqft: 720 },
          { unit: "102", status: "occupied", in_place_rent: 2125, market_rent: 2275, beds: 1, sqft: 735 },
          { unit: "201", status: "vacant", in_place_rent: 0, market_rent: 2300, beds: 2, sqft: 980 },
        ],
      },
      propertyTaxPayload: {
        annual_tax: 24000,
        original_filename: "Property_Tax_Support.pdf",
      },
      documentSources: fullRenderSupportDocuments,
      coverageArtifacts: fullRenderCoverageArtifacts,
    },
  },
};

const fullRenderHarnessResponse = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return payload;
  },
};

await generateClientReport(fullRenderHarnessRequest, fullRenderHarnessResponse);
assert.equal(fullRenderHarnessResponse.statusCode, 200);
assert.equal(fullRenderHarnessResponse.body?.success, true);
const fullRenderHtml = String(fullRenderHarnessResponse.body?.final_html || "");
let financingSectionMatch = null;
if (!process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY) {
  assert.match(fullRenderHtml, /ACQUISITION MEMO/i);
  assert.match(fullRenderHtml, /Acquisition Memo Summary/i);
  assert.match(fullRenderHtml, /Operating Snapshot/i);
  assert.match(fullRenderHtml, /(?:Rent Positioning Summary|Unit-Level Rent Positioning|Summary Rent Positioning)/i);
  assert.match(fullRenderHtml, /Rent Upside \/ Value Sensitivity/i);
  assert.match(fullRenderHtml, /Cap-Rate Value Indication/i);
  assert.match(fullRenderHtml, /Preliminary Financing Readiness Summary/i);
  assert.ok(
    /Acquisition Request Context|Proposed Acquisition Financing Context|Purchase Assumptions \/ Proposed Acquisition Financing Context/i.test(fullRenderHtml),
    "Expected an acquisition financing context label in the full render harness"
  );
  assert.match(fullRenderHtml, /Operating (Support|Snapshot)/i);
  assert.match(fullRenderHtml, /Lender Diligence Checklist/i);
  assert.match(fullRenderHtml, /Shown for lender discussion and acquisition diligence support only/i);
  assert.match(fullRenderHtml, /Outstanding Balance/i);
  assert.match(fullRenderHtml, /Interest Rate/i);
  assert.match(fullRenderHtml, /Amortization/i);
  financingSectionMatch = /Preliminary Financing Readiness Summary[\s\S]*?Lender Diligence Checklist/i.exec(fullRenderHtml);
  assert.ok(financingSectionMatch, "Missing preliminary financing readiness summary block");
}
if (!process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY) {
  assert.equal(typeof financingSectionMatch[0], "string");
}

const completeFinancingHarnessRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_generic_financing_context",
    report_type: "underwriting",
    property_name: "Generic Financing Context Package",
    __test_return_final_html: true,
    __test_payloads: {
      t12Payload: {
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
      },
      rentRollPayload: {
        total_units: 12,
        occupied_units: 11,
        vacant_units: 1,
      },
      loanTermSheetTermsPayload: {
        debt_basis: "proposed_acquisition_financing",
        semantic_doc_role: "purchase_assumptions",
        purchase_price: 1250000,
        stated_acquisition_loan_amount: 937500,
        ltv: 0.75,
        interest_rate: 0.0585,
        amortization_years: 30,
        lender_fee_percent: 0.01,
        source_text: "Proposed acquisition financing context for lender discussion only.",
      },
      acquisitionTermsPayload: {
        debt_basis: "proposed_acquisition_financing",
        purchase_price: 1250000,
        ltv: 0.75,
        interest_rate: 0.0585,
        amortization_years: 30,
        source_text: "Purchase assumptions / acquisition context for lender discussion only.",
      },
    },
  },
};
if (!process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY) {
const generateClientReportForFinancing = (await import("../../api/generate-client-report.js?complete-financing-smoke")).default;
const completeFinancingHarnessResponse = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return payload;
  },
};
await generateClientReportForFinancing(completeFinancingHarnessRequest, completeFinancingHarnessResponse);
assert.equal(completeFinancingHarnessResponse.statusCode, 200);
assert.equal(completeFinancingHarnessResponse.body?.success, true);
const completeFinancingHtml = String(completeFinancingHarnessResponse.body?.final_html || "");
assert.match(completeFinancingHtml, /Proposed Acquisition Financing Context/i);

assert.match(fullRenderHtml, /Source Context \/ Support Document Treatment/i);
assert.match(fullRenderHtml, /Data Coverage \/ Source Reliability/i);
assert.match(fullRenderHtml, /Source Reliability/i);
assert.ok(
  /Source Treatment \/ Quantitative Use/i.test(fullRenderHtml) ||
    /Support Document Treatment/i.test(fullRenderHtml),
  "Expected support-document treatment disclosure to remain present even if the exact subsection label changes"
);
assert.match(fullRenderHtml, /Excluded \/ Deferred Analysis/i);
assert.match(fullRenderHtml, /Property_Tax_Support\.pdf/i);
assert.match(fullRenderHtml, /Market_Rent_Survey_Excerpt\.txt/i);
assert.match(fullRenderHtml, /CapEx_Notes\.txt/i);
assert.match(fullRenderHtml, /Phase_I_ESA_Context\.pdf/i);
assert.match(fullRenderHtml, /Broker_Email_Context\.msg/i);
assert.match(fullRenderHtml, /Unsupported_Appraisal_Excerpt\.pdf/i);
const checklistSectionMatch = /Lender Diligence Checklist[\s\S]*?<\/table>/i.exec(fullRenderHtml);
assert.ok(checklistSectionMatch, "Missing lender diligence checklist");
const checklistSectionHtml = checklistSectionMatch[0];
assert.ok(
  /Property tax support/i.test(checklistSectionHtml) ||
    /Property_Tax_Support\.pdf/i.test(fullRenderHtml),
  "Expected property tax support to remain disclosed in either the checklist row label or the supporting-document treatment surface"
);
if (/Environmental \/ Phase I support/i.test(checklistSectionHtml)) {
  assert.match(checklistSectionHtml, /Context only \/ not modeled/i);
}
if (/Appraisal support/i.test(checklistSectionHtml)) {
  assert.match(checklistSectionHtml, /Context only unless structured value exists/i);
}
if (/CapEx \/ renovation plan/i.test(checklistSectionHtml)) {
  assert.match(checklistSectionHtml, /Context only unless verified budget and rent-lift assumptions exist/i);
}
const canonicalDeliverableDecision = buildCanonicalDeliveryDecisionState({
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
  customer_publish_eligible: false,
  report_publishable: false,
  report_blocked: true,
  customer_publish_blockers: ["LEGACY_BLOCKER_SHOULD_NOT_WIN"],
  public_sample_ready: true,
  high_value_outreach_ready: true,
});
assert.equal(canonicalDeliverableDecision.customer_delivery_allowed, true);
assert.equal(canonicalDeliverableDecision.hold_delivery, false);
assert.equal(canonicalDeliverableDecision.customer_status_label, "ready");
assert.equal(canonicalDeliverableDecision.diagnostics.customer_publish_eligible, true);
assert.equal(canonicalDeliverableDecision.diagnostics.report_publishable, true);
assert.equal(canonicalDeliverableDecision.diagnostics.report_blocked, false);
assert.equal(canonicalDeliverableDecision.legacy_compatibility.customer_delivery_allowed, true);
const normalizedDeliverableAliases = buildDeliveryResponseCompatibilityAliases(canonicalDeliverableDecision);
assert.equal(normalizedDeliverableAliases.report_blocked, false);
assert.equal(normalizedDeliverableAliases.report_publishable, true);
assert.equal(normalizedDeliverableAliases.customer_delivery_ready, true);
assert.equal(normalizedDeliverableAliases.customer_publish_eligible, true);
assert.match(normalizedDeliverableAliases.launch_path_recommendation, /^customer_deliverable/);
const unresolvedTokens = fullRenderHtml.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
if (unresolvedTokens.length > 0) {
  throw new Error(`Unresolved tokens: ${unresolvedTokens.slice(0, 10).join(", ")}`);
}
const visibleFullRenderHtml = fullRenderHtml.replace(/<!--[\s\S]*?-->/g, "");
const visibleFullRenderText = visibleFullRenderHtml
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ");
if (/Cannot access 'rrUnits' before initialization/i.test(fullRenderHtml)) {
  throw new Error("rrUnits TDZ crash surfaced in full render");
}
if (/hasForwardLookingRenovationInputs is not defined/i.test(fullRenderHtml)) {
  throw new Error("Renovation flag undefined surfaced in full render");
}
assert.ok(
  /purchase_assumptions_source\.txt/i.test(fullRenderHtml),
  "Missing purchase_assumptions_source.txt disclosure in final HTML"
);
const listedNotModeledSectionMatch = /<p class="subsection-title">Listed but Not Quantitatively Modeled<\/p>[\s\S]*?(?=<p class="subsection-title">|$)/i.exec(fullRenderHtml);
if (listedNotModeledSectionMatch) {
  assert.equal(/purchase_assumptions_source\.txt/i.test(listedNotModeledSectionMatch[0]), false);
}
const forbiddenSurfacePatterns = [
  /Capital Risk Profile/i,
  /Current Debt DSCR/i,
  /\bDSCR\b/i,
  /Debt Coverage Constraint/i,
  /refinance capacity/i,
  /refinance proceeds/i,
  /refinance stability/i,
  /\bDCF\b/i,
  /Discounted Cash Flow/i,
  /\bwaterfall\b/i,
  /equity return/i,
  /deal score/i,
  /final recommendation/i,
  /launch memo/i,
  /Acquisition Financing Readiness/i,
  /Proposed Acquisition Debt Sizing/i,
  /\bBUY\b/i,
  /\bSELL\b/i,
  /\bHOLD\b/i,
  /Estimated Annual Debt Service/i,
  /Going-In DSCR/i,
];
const forbiddenSurfaceHit = forbiddenSurfacePatterns.find((pattern) => pattern.test(visibleFullRenderText));
if (forbiddenSurfaceHit) {
  throw new Error(`Forbidden surface leaked in visible HTML: ${forbiddenSurfaceHit}`);
}

const screeningHarnessRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_screening_full_render_smoke",
    report_type: "screening",
    property_name: "Harbourstone",
    __test_return_final_html: true,
    __test_payloads: {
      t12Payload: {
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
        gross_potential_rent: 1850000,
        gross_scheduled_rent: 1850000,
      },
      rentRollPayload: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_market_annual: 1137600,
        totals: {
          summary_row_detected: true,
          total_units: 48,
          occupied_units: 46,
          vacant_units: 2,
          occupancy: 0.9583333333,
          in_place_rent_annual: 1036800,
          market_rent_annual: 1137600,
        },
      },
      computedRentRoll: {
        total_units: 48,
        occupied_units: 46,
        vacant_units: 2,
        occupancy: 0.9583333333,
        total_in_place_annual: 1036800,
        total_annual_market: 1137600,
        annual_in_place_rent: 1036800,
        annual_market_rent: 1137600,
        avg_in_place_rent: 1800,
        avg_market_rent: 1980,
        rent_to_market_gap: 0.0961538462,
      },
    },
  },
};
const screeningHarnessResponse = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return payload;
  },
};
await generateClientReport(screeningHarnessRequest, screeningHarnessResponse);
assert.equal(screeningHarnessResponse.statusCode, 200);
assert.equal(screeningHarnessResponse.body?.success, true);
const screeningHtml = String(screeningHarnessResponse.body?.final_html || "");
assert.match(screeningHtml, /Data Coverage &amp; Source Limitations/i);
assert.match(screeningHtml, /Source Reliability/i);
assert.match(screeningHtml, /T12 Operating Statement/i);
assert.match(screeningHtml, /Rent Roll/i);
assert.match(screeningHtml, /Advanced financing and return-projection modules are outside the Screening Report scope\./i);
assert.equal(/launch memo/i.test(screeningHtml), false);
const screeningUnresolvedTokens = screeningHtml.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
if (screeningUnresolvedTokens.length > 0) {
  throw new Error(`Screening unresolved tokens: ${screeningUnresolvedTokens.slice(0, 10).join(", ")}`);
}
const screeningVisibleText = screeningHtml
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ");
const screeningForbiddenHit = forbiddenSurfacePatterns.find((pattern) => pattern.test(screeningVisibleText));
if (screeningForbiddenHit) {
  throw new Error(`Forbidden surface leaked in screening HTML: ${screeningForbiddenHit}`);
}

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
  /const canonicalOccupancyNoteValue = resolveOccupancyNoteValue\(computedRentRoll, rentRollPayload\)/
);
assert.match(
  reportSource,
  /function resolveCanonicalDataCoverageHeadlineState\([\s\S]*?headlineMode[\s\S]*?severityState[\s\S]*?source/
);
assert.match(
  reportSource,
  /const canonicalDataCoverageHeadlineState = resolveCanonicalDataCoverageHeadlineState\([\s\S]*?dataCoverageState[\s\S]*?sourceReconciliationState[\s\S]*?sectionEligibility[\s\S]*?effectiveReportMode/
);
assert.match(
  reportSource,
  /const isUnderwritingScopeHeadline = canonicalDataCoverageHeadlineState\.headlineMode === "underwriting_scope"/
);
assert.match(
  reportSource,
  /function shouldRenderCanonicalSection\([\s\S]*?sectionEligibility\?\.sections\?\.\[sectionKey\][\s\S]*?source_constrained[\s\S]*?omitted[\s\S]*?rendered[\s\S]*?eligible/
);
assert.match(
  reportSource,
  /const showSection7 = shouldRenderCanonicalSection\([\s\S]*?sectionKey: "debt_structure"[\s\S]*?rendererDefault/
);
assert.match(
  reportSource,
  /const showSection8 = shouldRenderCanonicalSection\([\s\S]*?sectionKey: "deal_scorecard"[\s\S]*?rendererDefault/
);
assert.match(
  reportSource,
  /const showSection9 = shouldRenderCanonicalSection\([\s\S]*?sectionKey: "dcf"[\s\S]*?rendererDefault/
);
// Backup source-level check: keep one light guard that source coverage QA call still exists.
assert.match(reportSource, /const sourceCoverageQa = buildSourceReportCoverageQa\(/);

// Primary runtime proof: generator canonical-state builder includes the canonical keys that must be
// propagated downstream into source coverage QA in production flow.
const canonicalRenderStateForPropagation = generatorTest.buildRendererCanonicalState({
  reportMode: "v1_core",
  reportType: "underwriting",
  mortgagePayload: {
    outstanding_balance: 8250000,
    annual_debt_service: 540000,
    interest_rate: 5.25,
    amort_years: 25,
  },
  loanTermSheetTermsPayload: {
    purchase_price: 12500000,
    stated_acquisition_loan_amount: 8500000,
    derived_acquisition_loan_amount: 8125000,
    debt_basis: "acquisition_financing_assumption",
  },
  t12Payload: {
    gross_potential_rent: 1800000,
    effective_gross_income: 1700000,
    net_operating_income: 960000,
  },
  computedRentRoll: {
    total_units: 24,
  },
  rentRollPayload: {
    total_units: 24,
  },
});
assert.equal(
  canonicalRenderStateForPropagation &&
    typeof canonicalRenderStateForPropagation === "object",
  true
);
assert.equal(
  canonicalRenderStateForPropagation.currentDebtAssessmentState &&
    typeof canonicalRenderStateForPropagation.currentDebtAssessmentState === "object",
  true
);
assert.equal(
  canonicalRenderStateForPropagation.acquisitionAssumptionState &&
    typeof canonicalRenderStateForPropagation.acquisitionAssumptionState === "object",
  true
);
assert.equal(
  canonicalRenderStateForPropagation.sourceReconciliationState &&
    typeof canonicalRenderStateForPropagation.sourceReconciliationState === "object",
  true
);
assert.equal(
  canonicalRenderStateForPropagation.sectionEligibility &&
    typeof canonicalRenderStateForPropagation.sectionEligibility === "object",
  true
);
assert.equal(
  canonicalRenderStateForPropagation.underwritingState?.core?.dataCoverage &&
    typeof canonicalRenderStateForPropagation.underwritingState.core.dataCoverage === "object",
  true
);
const canonicalHeadlineWins = generatorTest.resolveCanonicalDataCoverageHeadlineState({
  dataCoverageState: {
    headlineMode: "screening_notes",
    severityState: "core_inputs_confirmed",
    sectionConstrainedCount: 0,
  },
  sourceReconciliationState: { status: "source_reconciliation_required" },
  sectionEligibility: { source_constrained_section_count: 4 },
  effectiveReportMode: "v1_core",
});
assert.equal(canonicalHeadlineWins.headlineMode, "screening_notes");
assert.equal(canonicalHeadlineWins.severityState, "core_inputs_confirmed");
assert.equal(canonicalHeadlineWins.source, "canonical");

const canonicalHeadlineFallback = generatorTest.resolveCanonicalDataCoverageHeadlineState({
  dataCoverageState: null,
  sourceReconciliationState: { status: "source_reconciliation_required" },
  sectionEligibility: { source_constrained_section_count: 2 },
  effectiveReportMode: "v1_core",
});
assert.equal(canonicalHeadlineFallback.headlineMode, "underwriting_scope");
assert.equal(canonicalHeadlineFallback.severityState, "source_reconciliation_disclosure");
assert.equal(canonicalHeadlineFallback.source, "fallback");

const acquisitionSupportWithoutRenderedSignal = buildAcquisitionAssumptionState({
  loanTermSheetTermsPayload: {
    semantic_doc_role: "purchase_assumptions",
    debt_basis: "acquisition_financing_assumption",
    purchase_price: 14000000,
    ltv: 70,
    interest_rate: 5.4,
    amortization_years: 30,
    derived_acquisition_loan_amount: 9800000,
  },
  currentDebtState: {
    has_proposed_acquisition_financing: true,
    has_true_current_debt_balance: false,
  },
  sourceReportCoverageQa: {
    rendered_text_signals: [],
    artifact_inventory: {
      loan_term_sheet_parsed: {
        present: true,
      },
    },
  },
});
assert.equal(acquisitionSupportWithoutRenderedSignal.acquisition_assumptions_supported, true);
assert.equal(acquisitionSupportWithoutRenderedSignal.acquisition_support_status, "validated_supported");

const acquisitionPhraseOnlyDoesNotCreateCanonicalSupport = buildAcquisitionAssumptionState({
  loanTermSheetTermsPayload: {
    semantic_doc_role: null,
    debt_basis: "",
    purchase_price: null,
    ltv: null,
    interest_rate: null,
    amortization_years: null,
    derived_acquisition_loan_amount: null,
  },
  currentDebtState: {
    has_proposed_acquisition_financing: false,
    has_true_current_debt_balance: false,
  },
  sourceReportCoverageQa: {
    rendered_text_signals: ["acquisition_financing_assumptions"],
    artifact_inventory: {
      loan_term_sheet_parsed: {
        present: false,
      },
    },
  },
});
assert.equal(acquisitionPhraseOnlyDoesNotCreateCanonicalSupport.acquisition_assumptions_supported, false);

const canonicalEligibleWithoutRenderedHeading = buildFullUnderwritingSectionEligibility({
  artifacts: [
    {
      type: "t12_parsed",
      payload: {
        effective_gross_income: 1200000,
        total_operating_expenses: 700000,
        net_operating_income: 500000,
      },
    },
    {
      type: "rent_roll_parsed",
      payload: { total_units: 24 },
    },
  ],
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
  },
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    rendered_sections: {
      has_operating_statement_section: false,
    },
  },
});
assert.equal(canonicalEligibleWithoutRenderedHeading.sections.operating_statement.eligible, true);
assert.equal(canonicalEligibleWithoutRenderedHeading.sections.operating_statement.omitted, false);
assert.equal(canonicalEligibleWithoutRenderedHeading.sections.operating_statement.rendered, true);
assert.equal(canonicalEligibleWithoutRenderedHeading.sections.operating_statement.rendered_observed, false);

const renderedHeadingOnlyCannotPromoteUnsupported = buildFullUnderwritingSectionEligibility({
  artifacts: [],
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
  },
  sourceReportCoverageQa: {
    rendered_sections: {
      has_operating_profile_section: true,
      has_renovation_section: true,
    },
  },
});
assert.equal(renderedHeadingOnlyCannotPromoteUnsupported.sections.operating_profile.eligible, false);
assert.equal(renderedHeadingOnlyCannotPromoteUnsupported.sections.operating_profile.source_constrained, true);
assert.equal(renderedHeadingOnlyCannotPromoteUnsupported.sections.operating_profile.rendered_observed, true);
assert.equal(renderedHeadingOnlyCannotPromoteUnsupported.sections.renovation_strategy.eligible, false);
assert.equal(renderedHeadingOnlyCannotPromoteUnsupported.sections.renovation_strategy.source_constrained, true);

const constrainedSectionBlocked = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      debt_structure: {
        source_constrained: true,
        omitted: false,
        rendered: true,
        eligible: true,
      },
    },
  },
  sectionKey: "debt_structure",
  rendererDefault: true,
});
assert.equal(constrainedSectionBlocked, false);

const omittedSectionBlocked = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      deal_scorecard: {
        source_constrained: false,
        omitted: true,
        rendered: true,
        eligible: true,
      },
    },
  },
  sectionKey: "deal_scorecard",
  rendererDefault: true,
});
assert.equal(omittedSectionBlocked, false);

const canonicalEligibleWins = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      dcf: {
        source_constrained: false,
        omitted: false,
        rendered: true,
        eligible: true,
      },
    },
  },
  sectionKey: "dcf",
  rendererDefault: false,
});
assert.equal(canonicalEligibleWins, true);

const canonicalAbsentFallback = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: null,
  sectionKey: "dcf",
  rendererDefault: false,
});
assert.equal(canonicalAbsentFallback, false);
const canonicalNeighborhoodEligible = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      market_context: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  sectionKey: "market_context",
  rendererDefault: false,
});
assert.equal(canonicalNeighborhoodEligible, true);
const canonicalNeighborhoodConstrained = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      market_context: {
        eligible: true,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  sectionKey: "market_context",
  rendererDefault: true,
});
assert.equal(canonicalNeighborhoodConstrained, false);
const canonicalNeighborhoodAbsentFallback = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: null,
  sectionKey: "market_context",
  rendererDefault: false,
});
assert.equal(canonicalNeighborhoodAbsentFallback, false);
const canonicalMarketContextVisibilityEligible = generatorTest.resolveMarketContextSectionVisibility({
  sectionEligibility: {
    sections: {
      market_context: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  // Local narrative fallback would strip if canonical authority were ignored.
  rendererDefault: false,
});
assert.equal(canonicalMarketContextVisibilityEligible.keepNeighborhood, true);
assert.equal(canonicalMarketContextVisibilityEligible.keepLocationTable, true);
const canonicalMarketContextVisibilityConstrained = generatorTest.resolveMarketContextSectionVisibility({
  sectionEligibility: {
    sections: {
      market_context: {
        eligible: true,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  rendererDefault: true,
});
assert.equal(canonicalMarketContextVisibilityConstrained.keepNeighborhood, false);
assert.equal(canonicalMarketContextVisibilityConstrained.keepLocationTable, false);
const canonicalMarketContextVisibilityFallbackOnly = generatorTest.resolveMarketContextSectionVisibility({
  sectionEligibility: null,
  rendererDefault: false,
});
assert.equal(canonicalMarketContextVisibilityFallbackOnly.keepNeighborhood, false);
assert.equal(canonicalMarketContextVisibilityFallbackOnly.keepLocationTable, false);
const canonicalFinalRecommendationEligible = generatorTest.resolveFinalRecommendationSectionVisibility({
  sectionEligibility: {
    sections: {
      final_recommendation: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  // Local narrative fallback would strip if canonical authority were ignored.
  rendererDefault: false,
});
assert.equal(canonicalFinalRecommendationEligible, true);
const canonicalFinalRecommendationConstrained = generatorTest.resolveFinalRecommendationSectionVisibility({
  sectionEligibility: {
    sections: {
      final_recommendation: {
        eligible: true,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  rendererDefault: true,
});
assert.equal(canonicalFinalRecommendationConstrained, false);
const canonicalFinalRecommendationAbsentFallback = generatorTest.resolveFinalRecommendationSectionVisibility({
  sectionEligibility: null,
  rendererDefault: false,
});
assert.equal(canonicalFinalRecommendationAbsentFallback, false);
const canonicalDebtTablesEligible = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      debt_structure: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  sectionKey: "debt_structure",
  rendererDefault: false,
});
assert.equal(canonicalDebtTablesEligible, true);
const canonicalDebtTablesConstrained = generatorTest.shouldRenderCanonicalSection({
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
  sectionKey: "debt_structure",
  rendererDefault: true,
});
assert.equal(canonicalDebtTablesConstrained, false);
const canonicalRiskMatrixEligible = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      risk_register: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  sectionKey: "risk_register",
  rendererDefault: false,
});
assert.equal(canonicalRiskMatrixEligible, true);
const canonicalDcfSummaryEligible = generatorTest.shouldRenderCanonicalSection({
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
  sectionKey: "dcf",
  rendererDefault: false,
});
assert.equal(canonicalDcfSummaryEligible, true);
const canonicalDcfSummaryConstrained = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: {
    sections: {
      dcf: {
        eligible: false,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  sectionKey: "dcf",
  rendererDefault: true,
});
assert.equal(canonicalDcfSummaryConstrained, false);
const canonicalDebtAbsentFallback = generatorTest.shouldRenderCanonicalSection({
  sectionEligibility: null,
  sectionKey: "debt_structure",
  rendererDefault: false,
});
assert.equal(canonicalDebtAbsentFallback, false);
const canonicalDocumentSourcesRequiredNoDocs = generatorTest.resolveDocumentSourcesSectionVisibility({
  sectionEligibility: {
    sections: {
      methodology: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
      data_coverage: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: true,
      },
    },
  },
  sourceReconciliationState: { status: "source_reconciliation_required" },
  effectiveReportMode: "v1_core",
  hasDocSources: false,
});
assert.equal(canonicalDocumentSourcesRequiredNoDocs, true);
const canonicalDocumentSourcesOmitted = generatorTest.resolveDocumentSourcesSectionVisibility({
  sectionEligibility: {
    sections: {
      methodology: {
        eligible: true,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
      data_coverage: {
        eligible: true,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
  sourceReconciliationState: { status: "core_inputs_confirmed" },
  effectiveReportMode: "v1_core",
  hasDocSources: true,
});
assert.equal(canonicalDocumentSourcesOmitted, false);
const canonicalAbsentDocumentSourcesFallback = generatorTest.resolveDocumentSourcesSectionVisibility({
  sectionEligibility: null,
  sourceReconciliationState: null,
  effectiveReportMode: "v1_core",
  hasDocSources: false,
});
assert.equal(canonicalAbsentDocumentSourcesFallback, false);
const screeningDocumentSourcesAlwaysStrip = generatorTest.resolveDocumentSourcesSectionVisibility({
  sectionEligibility: {
    sections: {
      methodology: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
  sourceReconciliationState: { status: "source_reconciliation_required" },
  effectiveReportMode: "screening_v1",
  hasDocSources: true,
});
assert.equal(screeningDocumentSourcesAlwaysStrip, false);
const tierOneCascadeScreening = generatorTest.shouldApplyTierOneStripCascade({
  effectiveReportMode: "screening_v1",
  reportType: "screening",
  reportTier: 1,
  sectionEligibility: null,
});
assert.equal(tierOneCascadeScreening, true);
const tierOneCascadeUnderwritingProtected = generatorTest.shouldApplyTierOneStripCascade({
  effectiveReportMode: "v1_core",
  reportType: "underwriting",
  reportTier: 1,
  sectionEligibility: {
    sections: {
      debt_structure: {
        eligible: true,
        rendered: true,
        omitted: false,
        source_constrained: false,
      },
    },
  },
});
assert.equal(tierOneCascadeUnderwritingProtected, false);
const tierOneCascadeInconsistentScreeningBlockedByCanonical = generatorTest.shouldApplyTierOneStripCascade({
  effectiveReportMode: "screening_v1",
  reportType: "screening",
  reportTier: 1,
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
});
assert.equal(tierOneCascadeInconsistentScreeningBlockedByCanonical, false);
const tierOneCascadeCanonicalConstrainedStillApplies = generatorTest.shouldApplyTierOneStripCascade({
  effectiveReportMode: "screening_v1",
  reportType: "screening",
  reportTier: 1,
  sectionEligibility: {
    sections: {
      dcf: {
        eligible: false,
        rendered: false,
        omitted: true,
        source_constrained: true,
      },
    },
  },
});
assert.equal(tierOneCascadeCanonicalConstrainedStillApplies, true);
const dataCoverageDnaSection = [
  "<p>DATA NOT AVAILABLE</p>",
  "<p>DATA NOT AVAILABLE</p>",
  "<p>DATA NOT AVAILABLE</p>",
].join("");
const canonicalCoverageRetainedDespiteDna = generatorTest.shouldStripDataCoverageSectionByRenderedCopy({
  coverageSectionHtml: dataCoverageDnaSection,
  hasCanonicalCoverageAuthority: true,
});
assert.equal(canonicalCoverageRetainedDespiteDna, false);
const canonicalCoverageAbsentUsesDnaFallback = generatorTest.shouldStripDataCoverageSectionByRenderedCopy({
  coverageSectionHtml: dataCoverageDnaSection,
  hasCanonicalCoverageAuthority: false,
});
assert.equal(canonicalCoverageAbsentUsesDnaFallback, true);
const screeningIgnoresDebtCoverageConstraintLabel = generatorTest.normalizeVisibleReportClassification({
  baseClass: "Stable",
  effectiveReportMode: "screening_v1",
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: false,
  debtCoverageConstraintActive: true,
});
assert.equal(screeningIgnoresDebtCoverageConstraintLabel, "Stable");
const underwritingAppliesDebtCoverageConstraintLabel = generatorTest.normalizeVisibleReportClassification({
  baseClass: "Stable",
  effectiveReportMode: "v1_core",
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: false,
  debtCoverageConstraintActive: true,
});
assert.equal(underwritingAppliesDebtCoverageConstraintLabel, "Review - Debt Coverage Constraint");
const screeningCanonicalClassificationIgnoresDebtNotAssessed = buildCanonicalVisibleClassificationState({
  reportType: "screening",
  reportTier: 1,
  baseLabel: "Stable",
  hasDscrScore: false,
  currentDebtDscr: null,
  debtCoverageConstraintActive: true,
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: false,
});
assert.equal(screeningCanonicalClassificationIgnoresDebtNotAssessed.label, "Stable");
const underwritingCanonicalClassificationAppliesDebtNotAssessed = buildCanonicalVisibleClassificationState({
  reportType: "underwriting",
  reportTier: 2,
  baseLabel: "Stable",
  hasDscrScore: false,
  currentDebtDscr: null,
  debtCoverageConstraintActive: true,
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: false,
});
assert.equal(underwritingCanonicalClassificationAppliesDebtNotAssessed.label, "Review - Debt Coverage Constraint");
const sourceReconciliationPrecedenceLabel = generatorTest.normalizeVisibleReportClassification({
  baseClass: "Fragile",
  effectiveReportMode: "v1_core",
  sourceReconciliationCapActive: true,
  coreSupportInsufficient: false,
  debtCoverageConstraintActive: true,
});
assert.equal(sourceReconciliationPrecedenceLabel, "Review - Source Reconciliation Disclosure");
const coreInsufficientPrecedenceLabel = generatorTest.normalizeVisibleReportClassification({
  baseClass: "Sensitized",
  effectiveReportMode: "v1_core",
  sourceReconciliationCapActive: false,
  coreSupportInsufficient: true,
  debtCoverageConstraintActive: true,
});
assert.equal(coreInsufficientPrecedenceLabel, "Review - Insufficient Core Support");
const approvedVisibleLabels = new Set([
  "Stable",
  "Sensitized",
  "Fragile",
  "Review - Source Reconciliation Disclosure",
  "Review - Insufficient Core Support",
  "Review - Debt Coverage Constraint",
]);
[
  screeningIgnoresDebtCoverageConstraintLabel,
  underwritingAppliesDebtCoverageConstraintLabel,
  sourceReconciliationPrecedenceLabel,
  coreInsufficientPrecedenceLabel,
].forEach((label) => {
  assert.equal(approvedVisibleLabels.has(label), true);
});
const screeningConsumerPrefersCanonicalLabel = generatorTest.resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel: "Review - Source Reconciliation Disclosure",
  localVisibleLabel: "Stable",
  screeningClass: "Fragile",
});
assert.equal(screeningConsumerPrefersCanonicalLabel, "Review - Source Reconciliation Disclosure");
const screeningConsumerFallsBackToLocalVisibleLabel = generatorTest.resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel: "",
  localVisibleLabel: "Sensitized",
  screeningClass: "Stable",
});
assert.equal(screeningConsumerFallsBackToLocalVisibleLabel, "Sensitized");
const screeningConsumerFallsBackToScreeningClass = generatorTest.resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel: "",
  localVisibleLabel: "",
  screeningClass: "Fragile",
});
assert.equal(screeningConsumerFallsBackToScreeningClass, "Fragile");
const screeningConsumerRejectsUnapprovedLabel = generatorTest.resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel: "High Risk",
  localVisibleLabel: "Outside Parameters",
  screeningClass: "Insufficient Data",
});
assert.equal(screeningConsumerRejectsUnapprovedLabel, "");
assert.equal(
  /showSection11[\s\S]{0,250}stripMarkedSection\(finalHtml, \"SECTION_4_NEIGHBORHOOD\"\)/.test(reportSource),
  false
);
assert.match(
  reportSource,
  /resolveMarketContextSectionVisibility\([\s\S]{0,260}sectionEligibility[\s\S]{0,260}rendererDefault/
);
assert.match(
  reportSource,
  /resolveFinalRecommendationSectionVisibility\([\s\S]{0,260}sectionEligibility[\s\S]{0,260}rendererDefault/
);
assert.match(
  reportSource,
  /resolveDocumentSourcesSectionVisibility\([\s\S]{0,260}sectionEligibility[\s\S]{0,260}sourceReconciliationState[\s\S]{0,260}effectiveReportMode/
);
assert.match(
  reportSource,
  /shouldStripDataCoverageSectionByRenderedCopy\([\s\S]{0,220}hasCanonicalCoverageAuthority/
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
  /const computedVisibleLabelInputs = \{[\s\S]{0,500}baseClass:\s*baseVisibleClass[\s\S]{0,500}sourceReconciliationCapActive[\s\S]{0,300}coreSupportInsufficient[\s\S]{0,300}debtCoverageConstraintActive/
);
assert.match(
  reportSource,
  /function normalizeVisibleReportClassification\([\s\S]*sourceReconciliationCapActive[\s\S]*Review - Source Reconciliation Disclosure[\s\S]*coreSupportInsufficient[\s\S]*Review - Insufficient Core Support[\s\S]*debtCoverageConstraintActive[\s\S]*Review - Debt Coverage Constraint/
);
assert.match(
  reportSource,
  /underwritingState\.core\.classification\.visibleLabelInputs = computedVisibleLabelInputs[\s\S]{0,300}underwritingState\.core\.classification\.visibleLabel = computedCoverClassificationLabel/
);
assert.match(
  reportSource,
  /const currentDebtAssessmentState =\s*underwritingState\?\.core\?\.currentDebt\?\.assessmentState \|\| canonicalCurrentDebtAssessmentState/
);
assert.match(
  reportSource,
  /const refiDebtRenderStateForScreeningBlock = sharedRefiDebtRenderState/
);
assert.match(
  reportSource,
  /const acquisitionFinancingAssumptionsRender = buildAcquisitionMemoV2AcquisitionFinancingAssumptionsHtmlLane\([\s\S]{0,300}returnState:\s*true/
);
assert.match(
  reportSource,
  /underwritingState\.core\.acquisition\.triangleValidationState\s*=\s*acquisitionFinancingAssumptionsRender\.triangleValidationState/
);
assert.match(
  reportSource,
  /const propertyTaxBindingState =\s*underwritingState\?\.core\?\.documentTreatment\?\.propertyTaxBindingState \|\| null/
);
assert.match(
  reportSource,
  /buildAcquisitionMemoV2DocumentTreatmentSummaryHtmlLane\(\{[\s\S]{0,1200}propertyTaxBindingState[\s\S]{0,400}\}\)/
);
assert.match(
  reportSource,
  /const sectionEligibilityState =\s*underwritingState\?\.core\?\.sections\?\.eligibilityState \|\| sectionEligibility/
);
assert.match(
  reportSource,
  /buildScreeningDataCoverageSummary\(\{[\s\S]{0,1200}sectionEligibility:\s*sectionEligibilityState[\s\S]{0,1200}dataCoverageState[\s\S]{0,1200}optionalSectionState/
);
assert.match(
  reportSource,
  /dealScoreState\.dealScoreTableHtml = alignDealScorecardVisibleClassificationHtml\([\s\S]{0,220}coverClassificationLabel/
);
assert.equal(/if \(screeningClass === "Fragile"\) return "High Risk"/.test(reportSource), false);
assert.equal(
  /effectiveReportMode === "screening_v1"[\s\S]{0,180}Review - Debt Coverage Constraint/.test(reportSource),
  false
);
assert.equal(/Pass Conditions \(All must hold\)|Hard Disqualifiers \(Any triggers fail\)|Decision Status: Full Compliance|Decision Status: Non-Compliance|Decision Status: Partial Compliance/.test(reportSource), false);
assert.equal(/reportTierBadges|reportTierBadgeHtml|Screening Scope|Source-Constrained|Debt Not Provided|Disclosure Required/.test(reportSource), false);
assert.match(
  reportSource,
  /const coverVerdictLabel = effectiveReportMode === "v1_core"\s*\?\s*"ACQUISITION<br\/>MEMO"/
);
assert.match(
  reportSource,
  /sourceReconciliationNarrativePolicy\.data_coverage_required[\s\S]{0,280}Primary Constraint: Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation\./
);
assert.match(
  reportSource,
  /sourceReconciliationNarrativePolicy\.data_coverage_required[\s\S]{0,260}riskBullets\.unshift\([\s\S]{0,200}classification is capped pending source reconciliation\./
);
assert.match(
  reportSource,
  /const execVerdictLabel = effectiveReportMode === "v1_core"\s*\?\s*"ACQUISITION MEMO"/
);
assert.match(
  reportSource,
  /launchMemoMode:\s*effectiveReportMode === "v1_core"/
);
assert.match(
  reportSource,
  /Acquisition Memo Summary:/
);
assert.match(
  reportSource,
  /Source Context/
);
assert.match(
  reportSource,
  /finalHtml = replaceAll\(finalHtml, "\{\{NEIGHBORHOOD_CONTEXT_BLOCK\}\}", sourceContextBlockHtml \|\| neighborhoodContextHtml\);/
);
assert.equal(/CAPITAL RISK PROFILE/.test(reportSource), false);
assert.equal(/Current Debt DSCR reflects current outstanding debt service and T12 NOI only\./.test(reportSource), false);
assert.equal(/DSCR \(Computed\)/i.test(reportSource), false);
assert.equal(/Review - Debt Coverage Constraint/i.test(reportSource), true);
assert.match(reportSource, /execRefiLine = "";?/);
assert.equal(/Top Income Line Share of EGI/.test(reportSource), false);
assert.match(reportSource, /Top Income Line Compared with EGI/);
assert.match(reportSource, /EGI is net of vacancy \/ credit-loss offsets/);
assert.match(
  reportSource,
  /Gross rental income may exceed EGI where vacancy, credit loss, or concessions reduce effective gross income\./
);
assert.match(
  reportSource,
  /const occupancyInterpretation = `Break-even occupancy is \$\{beoFmt\} versus current occupancy of \$\{currFmt\}, indicating a \$\{bufPts\} percentage-point operating cushion based on reported T12 totals\.`/
);
assert.match(
  reportSource,
  /const reconciliationCaution = hasSourceReconciliationCaution[\s\S]{0,260}variance-sensitive conclusions remain constrained when rent roll and T12 income evidence are materially unreconciled\./
);
assert.match(
  reportSource,
  /const hasSourceReconciliationCaution =[\s\S]{0,180}sourceReconciliationNarrativePolicy\?\.data_coverage_required === true[\s\S]{0,120}hasSourceReconciliationVariance/
);
assert.equal(/BUY|SELL|proceed recommendation/i.test(reportSource), false);
assert.equal(/shown as unavailable/i.test(reportSource), false);
assert.match(
  reportSource,
  /Metrics dependent on missing source inputs are omitted or qualified\./
);
assert.match(reportSource, /Unsupported metrics are not inferred\./);
assert.match(
  reportSource,
  /Framework value sensitivity is based on reported T12 NOI and remains subject to the rent roll\/T12 reconciliation disclosure in Data Coverage\./
);
assert.match(
  reportSource,
  /dcfSourceReconciliationLimited[\s\S]{0,400}Framework value sensitivity is based on reported T12 NOI and remains subject to the rent roll\/T12 reconciliation disclosure in Data Coverage\./
);
assert.match(
  reportSource,
  /delivery_gate_status === "user_needs_documents"/
);
assert.match(
  reportSource,
  /finalHtml = stripMarkedSection\(finalHtml, "SECTION_7_REFI_STABILITY"\);/
);
assert.match(
  reportSource,
  /stripMarkedSection\(finalHtml, "SECTION_7_REFI_STABILITY"\)/
);
assert.match(
  reportSource,
  /const renderCanonicalDscrDerived[\s\S]*renderCanonicalNoi\s*\/\s*renderCanonicalAnnualDebtService/
);
assert.equal(
  /hasComputedCurrentDebtDscr[\s\S]{0,400}Refinance Stability Classification: Not Assessed/.test(reportSource),
  false
);
assert.equal(/Refinance Stability Classification: Source-Limited/.test(reportSource), false);
assert.match(reportSource, /finalHtml = stripMarkedSection\(finalHtml, "SECTION_7_REFI_STABILITY"\);/);
assert.match(reportSource, /finalHtml = replaceAll\(finalHtml, "\{\{DEBT_DSCR_NOTE\}\}", ""\);/);
assert.match(reportSource, /finalHtml = replaceAll\(finalHtml, "\{\{DEBT_REFI_CONSIDERATIONS\}\}", ""\);/);
assert.equal(/\b(?:BUY\s*\/\s*SELL\s*\/\s*HOLD|BUY\s+RECOMMENDATION|SELL\s+RECOMMENDATION|HOLD\s+RECOMMENDATION)\b/i.test(reportSource), false);
assert.equal(/classified from the uploaded file names/i.test(reportSource), false);
assert.equal(/purchase (?:price|assumptions?)[\s\S]{0,80}(?:is|equals|represents)\s+appraised value/i.test(reportSource), false);
assert.match(reportSource, /unsupported appraisal\/market survey files are not treated as appraised value/i);
assert.match(
  reportSource,
  /const acquisitionPurchasePriceVerifiedByTriangle =[\s\S]{0,260}verifiedFields\.includes\("purchase_price"\)/
);
assert.match(
  reportSource,
  /reason_code:\s*"lender_fee_percent_not_verified"/
);
assert.match(
  reportSource,
  /reason_code:\s*"stated_acquisition_loan_amount_not_verified"/
);
assert.match(
  reportSource,
  /if \(marketSurveyLike\) \{[\s\S]{0,220}Market survey \/ rent context only; not used to override rent roll\./
);
assert.match(
  reportSource,
  /(?:Acquisition assumptions context only; used only for displayed purchase\/cap-rate context and not used to override T12, Rent Roll, or current debt\.|Acquisition context only; not quantitatively modeled\.)/
);

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
assert.equal(rentRollLeakFreeHtml.includes("Top Income Line Share of EGI"), false);

const overEgiIncomeConcentrationHtml = generatorTest.buildScreeningIncomeForensicsHtml({
  t12Payload: {
    effective_gross_income: 1100000,
    gross_potential_rent: 1850000,
    gross_scheduled_rent: 1850000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
    income_lines: [{ label: "Gross Rental Income", amount: 1850000 }],
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    occupancy: 0.95,
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 961200,
    occupancy: 0.95,
  },
  formatCurrency,
});
assert.match(overEgiIncomeConcentrationHtml, /Top Income Line Compared with EGI/);
assert.match(overEgiIncomeConcentrationHtml, /EGI is net of vacancy \/ credit-loss offsets/i);
assert.match(
  overEgiIncomeConcentrationHtml,
  /Gross rental income may exceed EGI where vacancy, credit loss, or concessions reduce effective gross income\./i
);
assert.equal(overEgiIncomeConcentrationHtml.includes("Top Income Line Share of EGI"), false);

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

const noVerifiedCurrentDebtCanonicalState = generatorTest.buildRendererCanonicalState({
  rentRollPayload: { total_units: 48, total_in_place_annual: 1087488 },
  computedRentRoll: { total_units: 48, total_in_place_annual: 1087488 },
  mortgagePayload: null,
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
assert.equal(noVerifiedCurrentDebtCanonicalState.currentDebtAssessmentState?.has_true_current_debt_balance, false);
assert.equal(noVerifiedCurrentDebtCanonicalState.sectionEligibility?.sections?.dcf?.source_constrained, true);
assert.equal(noVerifiedCurrentDebtCanonicalState.sectionEligibility?.sections?.advanced_modeling?.source_constrained, true);
assert.equal(noVerifiedCurrentDebtCanonicalState.sectionEligibility?.sections?.debt_structure?.source_constrained, true);

const verifiedCurrentDebtCanonicalState = generatorTest.buildRendererCanonicalState({
  rentRollPayload: { total_units: 48, total_in_place_annual: 1087488 },
  computedRentRoll: { total_units: 48, total_in_place_annual: 1087488 },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    semantic_doc_role: "current_mortgage_statement",
    debt_basis: "current_debt_balance",
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    monthly_payment: 9000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
  },
});
assert.equal(verifiedCurrentDebtCanonicalState.currentDebtAssessmentState?.has_true_current_debt_balance, true);

const verifiedCurrentDebtEligibility = buildFullUnderwritingSectionEligibility({
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    rendered_sections: {},
  },
  currentDebtState: {
    current_debt_dscr_status: "computed",
    current_debt_assessed: true,
    has_true_current_debt_balance: true,
    current_debt_dscr: 1.32,
    current_debt_annual_debt_service: 492000,
    current_debt_balance: 1500000,
    current_debt_service_source: "source_payment",
    current_debt_limitation_reason_code: null,
  },
  sourceReconciliationState: { status: "aligned" },
});
assert.equal(verifiedCurrentDebtEligibility.sections?.dcf?.source_constrained, false);
assert.equal(verifiedCurrentDebtEligibility.sections?.advanced_modeling?.source_constrained, false);

const acquisitionOnlyRefiRenderState = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: acquisitionOnlyCanonicalState.currentDebtAssessmentState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: acquisitionOnlyCanonicalState.underwritingState?.core?.acquisition?.assumptionState?.validated_fields
    ? {
        purchase_price: 2000000,
        ltv: 0.75,
        interest_rate: 0.065,
        amortization_years: 30,
        derived_acquisition_loan_amount: 1500000,
      }
    : null,
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(acquisitionOnlyRefiRenderState.allowDebtMath, false);
const acquisitionOnlyRefiSufficiency = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {},
  t12Payload: { net_operating_income: 650000 },
  currentDebtAssessmentState: acquisitionOnlyCanonicalState.currentDebtAssessmentState,
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    purchase_price: 2000000,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
    derived_acquisition_loan_amount: 1500000,
  },
});
assert.match(
  acquisitionOnlyRefiSufficiency,
  /Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided\./i
);

const verifiedCurrentDebtRefiRenderState = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: {
    current_debt_dscr_status: "computed",
    current_debt_assessed: true,
    has_true_current_debt_balance: true,
    current_debt_dscr: 1.32,
    current_debt_annual_debt_service: 492000,
    current_debt_balance: 1500000,
    current_debt_service_source: "source_payment",
    current_debt_limitation_reason_code: null,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    semantic_doc_role: "current_mortgage_statement",
    debt_basis: "current_debt_balance",
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    monthly_payment: 9000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(verifiedCurrentDebtRefiRenderState.allowDebtMath, true);
const verifiedCurrentDebtRefiSufficiency = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {},
  t12Payload: { net_operating_income: 650000 },
  currentDebtAssessmentState: {
    current_debt_dscr_status: "computed",
    current_debt_assessed: true,
    has_true_current_debt_balance: true,
    current_debt_dscr: 1.32,
    current_debt_annual_debt_service: 492000,
    current_debt_balance: 1500000,
    current_debt_service_source: "source_payment",
    current_debt_limitation_reason_code: null,
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: {
    semantic_doc_role: "current_mortgage_statement",
    debt_basis: "current_debt_balance",
    current_outstanding_balance: 1500000,
    current_loan_balance: 1500000,
    outstanding_balance: 1500000,
    monthly_payment: 9000,
    interest_rate: 0.065,
    amortization_years: 30,
  },
});
assert.match(verifiedCurrentDebtRefiSufficiency, /Advanced financing sufficiency not produced due to insufficient inputs/i);
assert.match(verifiedCurrentDebtRefiSufficiency, /NOI \(base\)/i);
assert.equal(/no verified current outstanding debt balance/i.test(verifiedCurrentDebtRefiSufficiency), false);

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
assert.match(computedScorecardEntry.scoreRow.label, /Current Debt DSCR|DSCR \(Current Debt\)/i);
assert.match(computedScorecardEntry.scoreRow.value, /^\d+\.\d{2}x$/);
const nonComputedWithRawMortgageScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_current_outstanding_balance",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
    monthly_payment: 9500,
  },
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(nonComputedWithRawMortgageScorecardEntry.hasDscrScore, false);
assert.equal(nonComputedWithRawMortgageScorecardEntry.scoreRow, null);
assert.equal(nonComputedWithRawMortgageScorecardEntry.currentDebtCoverage, null);
const nonComputedWithRawMortgageDealScoreState = generatorTest.buildDealScorecardState({
  expenseRatioR: 0.369,
  noiMarginR: 0.631,
  execOccupancy: 0.95,
  breakEvenOccR: 0.369,
  marketRentPremiumRatio: 0.16,
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_current_outstanding_balance",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
    monthly_payment: 9500,
  },
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
assert.equal(Number.isFinite(nonComputedWithRawMortgageDealScoreState.computedDscrForVerdict), false);
assert.equal(/Current Debt DSCR|DSCR \(Current Debt\)/i.test(nonComputedWithRawMortgageDealScoreState.dealScoreTableHtml), false);

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
assert.equal(loanTermOnlyCurrentDebtState.current_debt_assessed, true);
assert.equal(loanTermOnlyCurrentDebtState.current_debt_dscr_status, "computed");
assert.ok(Number.isFinite(loanTermOnlyCurrentDebtState.current_debt_dscr));
assert.ok(Number.isFinite(loanTermOnlyCurrentDebtState.current_debt_annual_debt_service));
assert.equal(
  loanTermOnlyCurrentDebtState.current_debt_service,
  loanTermOnlyCurrentDebtState.current_debt_annual_debt_service
);
assert.ok(
  loanTermOnlyCurrentDebtState.current_debt_service_source === "computed_payment" ||
  loanTermOnlyCurrentDebtState.current_debt_service_source === "source_payment"
);
assert.equal(loanTermOnlyCurrentDebtState.acquisition_only_exclusion, false);
assert.equal(loanTermOnlyCurrentDebtState.refi_basis_eligible, true);
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
  /Current Debt DSCR|DSCR \(Current Debt\)/i.test(String(row?.label || ""))
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
const ambiguousAcquisitionLoanSelection = generatorTest.resolveCanonicalLoanTermSheetArtifacts([
  {
    payload: {
      semantic_doc_role: "loan_term_sheet",
      debt_basis: "proposed_acquisition_financing",
      outstanding_balance: 2250000,
      purchase_price: 3000000,
      ltv: 0.75,
      derived_acquisition_loan_amount: 2250000,
      interest_rate: 0.071,
      amortization_years: 30,
    },
  },
]);
assert.equal(ambiguousAcquisitionLoanSelection.currentDebtPayload, null);
const ambiguousAcquisitionDebtState = buildCurrentDebtAssessmentState({
  mortgagePayload: null,
  loanTermSheetTermsPayload: ambiguousAcquisitionLoanSelection.currentDebtPayload,
  t12Noi: 611789.1838458668,
});
assert.equal(ambiguousAcquisitionDebtState.current_debt_dscr_status, "not_assessed");
assert.equal(ambiguousAcquisitionDebtState.current_debt_dscr, null);
const inventoryOnlyMortgageDebtState = buildCurrentDebtAssessmentState({
  sourceReportCoverageQa: {
    artifact_inventory: {
      mortgage_statement_parsed: {
        present: true,
        has_balance: true,
        has_payment: true,
        has_rate: true,
        has_amortization: true,
      },
    },
  },
  t12Noi: 700000,
});
assert.equal(inventoryOnlyMortgageDebtState.current_debt_dscr_status, "not_assessed");
assert.equal(inventoryOnlyMortgageDebtState.has_true_current_debt_balance, false);
assert.equal(inventoryOnlyMortgageDebtState.current_debt_dscr, null);
assert.equal(inventoryOnlyMortgageDebtState.refi_basis_eligible, false);
const inventoryOnlyLoanTermDebtState = buildCurrentDebtAssessmentState({
  sourceReportCoverageQa: {
    artifact_inventory: {
      loan_term_sheet_parsed: {
        present: true,
        has_balance: true,
        has_payment: true,
        has_rate: true,
        has_amortization: true,
        semantic_doc_role: "current_debt_terms",
        debt_basis: "existing_mortgage_debt",
      },
    },
  },
  t12Noi: 700000,
});
assert.equal(inventoryOnlyLoanTermDebtState.current_debt_dscr_status, "not_assessed");
assert.equal(inventoryOnlyLoanTermDebtState.has_true_current_debt_balance, false);
assert.equal(inventoryOnlyLoanTermDebtState.current_debt_dscr, null);
assert.equal(inventoryOnlyLoanTermDebtState.refi_basis_eligible, false);
const mixedExplicitCurrentDebtProofSelection = generatorTest.resolveCanonicalLoanTermSheetArtifacts([
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
      semantic_doc_role: "current_debt_terms",
      debt_basis: "existing_mortgage_debt",
      outstanding_balance: 8750000,
      current_outstanding_balance: 8750000,
      interest_rate: 0.0525,
      amortization_years: 30,
    },
  },
]);
assert.equal(Number(mixedExplicitCurrentDebtProofSelection.currentDebtPayload?.outstanding_balance), 8750000);
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
const launchMemoDealScoreState = generatorTest.buildDealScorecardState({
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
  launchMemoMode: true,
  launchMemoBaseLabel: "Stable",
});
assert.equal(launchMemoDealScoreState.displayVerdict?.label, "Stable");
assert.equal(launchMemoDealScoreState.hasDscrScore, false);
assert.equal(
  /Current Debt DSCR|Debt Coverage Constraint|refinance capacity|refinance proceeds/i.test(launchMemoDealScoreState.dealScoreTableHtml),
  false
);

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
assert.equal(mixedDebtBasis.annualDebtService, 579813.8872489922);
assert.equal(mixedDebtBasis.dscr, 1.0551661722053094);
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
assert.match(mixedRefiSufficiencyHtml, /Advanced financing sufficiency not produced due to insufficient inputs/i);
assert.match(mixedRefiSufficiencyHtml, /NOI \(base\)/i);
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
assert.equal(mortgageOnlyNonCanonicalRefiBasis.hasTrueCurrentDebtBalance, false);
assert.equal(mortgageOnlyNonCanonicalRefiBasis.debtBalance, null);
assert.equal(mortgageOnlyNonCanonicalRefiBasis.annualDebtService, null);
assert.equal(mortgageOnlyNonCanonicalRefiBasis.dscr, null);
assert.equal(acquisitionOnlyRefiBasis.isAcquisitionOnly, true);
const notAssessedRefiModel = generatorTest.buildRefiStabilityModel({
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05],
    stress_cap_rate_bps: [0],
    stress_rate_bps: [0],
  },
  currentDebtState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "missing_current_debt_support",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
  },
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 650000 },
  formatValue: formatCurrency,
});
assert.equal(notAssessedRefiModel?.tier, null);
assert.equal(String(notAssessedRefiModel?.html || "").trim(), "");

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
assert.match(missingRefiAssumptionSufficiencyHtml, /Advanced financing sufficiency not produced due to insufficient inputs/i);
assert.match(missingRefiAssumptionSufficiencyHtml, /NOI \(base\)/i);
assert.equal(/Refinance cap rate|<td>Missing<\/td>/i.test(missingRefiAssumptionSufficiencyHtml), false);
const sourceLimitedRefiSufficiencyHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
    stress_noi_shocks: [-0.05],
    stress_cap_rate_bps: [0],
    stress_rate_bps: [0],
  },
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "missing_current_debt_support",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
  },
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 650000 },
});
assert.match(sourceLimitedRefiSufficiencyHtml, /Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided\./i);
assert.equal(/\$1,500,000|Interest rate|Amortization \(years\)|Refinance cap rate/i.test(sourceLimitedRefiSufficiencyHtml), false);
const sourceLimitedRenderStateForCombinedRefiBlock = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "missing_current_debt_support",
  },
  mortgagePayload: {
    outstanding_balance: 1500000,
    interest_rate: 0.065,
    amort_years: 30,
  },
  loanTermSheetTermsPayload: null,
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
    refi_interest_rate: 0.065,
    refi_amort_years: 30,
    refi_cap_rate_base: 0.055,
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(sourceLimitedRenderStateForCombinedRefiBlock.status, "source_limited");
assert.equal(sourceLimitedRenderStateForCombinedRefiBlock.allowDebtMath, false);
const pr5BUnderwritingState = buildFullUnderwritingState({
  reportMode: "v1_core",
  reportType: "underwriting",
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "missing_current_debt_support",
  },
  refiDebtRenderState: sourceLimitedRenderStateForCombinedRefiBlock,
  scorecardCoverageState: {
    currentDebtCoverage: null,
    usedCanonicalState: false,
  },
  acquisitionAssumptionState: null,
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
  },
  sectionEligibility: {
    sections: {
      renovation_strategy: { source_constrained: true },
      dcf: { source_constrained: false },
    },
  },
  propertyTaxPayload: {
    annual_tax: 24000,
    source_file_id: "tax-bound-id",
    original_filename: "Tax_Bound.pdf",
  },
});
assert.equal(pr5BUnderwritingState?.meta?.version, "pr5-b-v1");
assert.equal(pr5BUnderwritingState?.core?.currentDebt?.refiRenderState?.status, sourceLimitedRenderStateForCombinedRefiBlock.status);
assert.equal(pr5BUnderwritingState?.core?.currentDebt?.refiRenderState?.allowDebtMath, false);
assert.equal(pr5BUnderwritingState?.core?.acquisition?.assumptionState, null);
assert.equal(pr5BUnderwritingState?.core?.acquisition?.triangleValidationState, null);
assert.equal(pr5BUnderwritingState?.core?.documentTreatment?.propertyTaxBindingState?.hasValidatedAnnualTax, true);
const sourceLimitedCombinedRefiBlockHtml =
  sourceLimitedRefiSufficiencyHtml +
  (sourceLimitedRenderStateForCombinedRefiBlock.allowDebtMath
    ? generatorTest.buildFinancingEnvelopeGrid(650000, 48)
    : "");
assert.equal(/Maximum Financing Envelope|Base Case Supportable Loan/i.test(sourceLimitedCombinedRefiBlockHtml), false);
const notAssessedRefiSufficiencyHtml = generatorTest.buildScreeningRefiSufficiencyTable({
  financials: {},
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_current_debt_document",
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: null,
  t12Payload: { net_operating_income: 650000 },
});
assert.match(notAssessedRefiSufficiencyHtml, /Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided\./i);
assert.equal(/Interest rate|Amortization \(years\)|Refinance cap rate|<td>Missing<\/td>/i.test(notAssessedRefiSufficiencyHtml), false);
const notAssessedRenderStateForCombinedRefiBlock = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
    current_debt_limitation_reason_code: "no_current_debt_document",
  },
  mortgagePayload: null,
  loanTermSheetTermsPayload: null,
  financials: {},
  t12Payload: { net_operating_income: 650000 },
});
const notAssessedCombinedRefiBlockHtml =
  notAssessedRefiSufficiencyHtml +
  (notAssessedRenderStateForCombinedRefiBlock.allowDebtMath
    ? generatorTest.buildFinancingEnvelopeGrid(650000, 48)
    : "");
assert.equal(/Maximum Financing Envelope|Base Case Supportable Loan/i.test(notAssessedCombinedRefiBlockHtml), false);
const acquisitionOnlyRenderStateForCombinedRefiBlock = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: null,
    loanTermSheetTermsPayload: {
      purchase_price: 2000000,
      ltv: 0.75,
      interest_rate: 0.065,
      amortization_years: 30,
      derived_acquisition_loan_amount: 1500000,
      debt_basis: "acquisition_financing_assumption",
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
    debt_basis: "acquisition_financing_assumption",
  },
  financials: {
    refi_ltv_max: 0.75,
    refi_dscr_min: 1.25,
  },
  t12Payload: { net_operating_income: 650000 },
});
assert.equal(acquisitionOnlyRenderStateForCombinedRefiBlock.allowDebtMath, false);
const acquisitionOnlyCombinedRefiBlockHtml =
  generatorTest.buildScreeningRefiSufficiencyTable({
    financials: {
      refi_ltv_max: 0.75,
      refi_dscr_min: 1.25,
    },
    currentDebtAssessmentState: acquisitionOnlyRenderStateForCombinedRefiBlock.canonicalRefiDebtBasis?.limitationReasonCode
      ? buildCurrentDebtAssessmentState({
          mortgagePayload: null,
          loanTermSheetTermsPayload: {
            purchase_price: 2000000,
            ltv: 0.75,
            interest_rate: 0.065,
            amortization_years: 30,
            derived_acquisition_loan_amount: 1500000,
            debt_basis: "acquisition_financing_assumption",
          },
          t12Noi: 650000,
        })
      : null,
    mortgagePayload: null,
    loanTermSheetTermsPayload: {
      purchase_price: 2000000,
      ltv: 0.75,
      interest_rate: 0.065,
      amortization_years: 30,
      derived_acquisition_loan_amount: 1500000,
      debt_basis: "acquisition_financing_assumption",
    },
    t12Payload: { net_operating_income: 650000 },
  }) +
  (acquisitionOnlyRenderStateForCombinedRefiBlock.allowDebtMath
    ? generatorTest.buildFinancingEnvelopeGrid(650000, 48)
    : "");
assert.equal(/Maximum Financing Envelope|Base Case Supportable Loan/i.test(acquisitionOnlyCombinedRefiBlockHtml), false);
const validRenderStateForCombinedRefiBlock = generatorTest.buildRefiDebtRenderState({
  currentDebtAssessmentState: loanTermOnlyCurrentDebtState,
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
  },
  t12Payload: { net_operating_income: 650000 },
});
const validCombinedRefiBlockHtml =
  generatorTest.buildScreeningRefiSufficiencyTable({
    financials: {
      refi_ltv_max: 0.75,
      refi_dscr_min: 1.25,
      refi_interest_rate: 0.065,
      refi_amort_years: 30,
      refi_cap_rate_base: 0.055,
      stress_noi_shocks: [-0.05],
      stress_cap_rate_bps: [0],
      stress_rate_bps: [0],
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
  }) +
  (validRenderStateForCombinedRefiBlock.allowDebtMath
    ? generatorTest.buildFinancingEnvelopeGrid(650000, 48)
    : "");
assert.match(validCombinedRefiBlockHtml, /Maximum Financing Envelope|Base Case Supportable Loan/i);

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
assert.match(retest9DealScoreState.dealScoreTableHtml, /Operating Metrics Score: 95 \/ 100/);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Composite score reflects available operating, occupancy, rent-gap, and current-debt metrics only/i);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Rent-roll\/T12 reconciliation remains unresolved/i);
assert.match(retest9DealScoreState.dealScoreTableHtml, /Classification is capped by source reconciliation\./i);
assert.match(retest9DealScoreState.dealScoreTableHtml, /should not be read as an unconstrained investment score/i);

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
const insufficientCoreSupportAlignedScorecardHtml = generatorTest.alignDealScorecardVisibleClassificationHtml(
  constrainedDscrDealScoreState.dealScoreTableHtml,
  "Review - Insufficient Core Support"
);
assert.match(insufficientCoreSupportAlignedScorecardHtml, /Review - Insufficient Core Support/);
assert.equal(/Review - Debt Coverage Constraint/i.test(insufficientCoreSupportAlignedScorecardHtml), false);

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
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Operating Metrics Score: 94 \/ 100/);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Current debt is not assessed/i);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Rent-roll\/T12 reconciliation remains unresolved/i);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /Classification is capped by source reconciliation\./i);
assert.match(constrainedDealScoreState.dealScoreTableHtml, /should not be read as an unconstrained investment score/i);
assert.equal(/Current Debt DSCR[\s\S]{0,120}0\/10/i.test(constrainedDealScoreState.dealScoreTableHtml), false);

const acquisitionOnlyCurrentDebtState = buildCurrentDebtAssessmentState({
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
});
assert.equal(acquisitionOnlyCurrentDebtState.current_debt_assessed, false);
assert.equal(acquisitionOnlyCurrentDebtState.current_debt_dscr_status, "not_assessed");
assert.equal(acquisitionOnlyCurrentDebtState.current_debt_dscr, null);
assert.equal(acquisitionOnlyCurrentDebtState.acquisition_only_exclusion, true);
assert.equal(acquisitionOnlyCurrentDebtState.refi_basis_eligible, false);
assert.equal(
  acquisitionOnlyCurrentDebtState.current_debt_service,
  acquisitionOnlyCurrentDebtState.current_debt_annual_debt_service
);
const acquisitionOnlyScorecardEntry = generatorTest.buildCurrentDebtScorecardEntry({
  currentDebtState: acquisitionOnlyCurrentDebtState,
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

assert.match(screeningDataCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(screeningDataCoverageHtml, /Core operating inputs \(T12 and Rent Roll\) were fully verified/i);
assert.match(screeningDataCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
assert.equal(screeningDataCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(screeningDataCoverageHtml), false);
assert.match(screeningDataCoverageHtml, /T12 Operating Statement/i);
assert.match(screeningDataCoverageHtml, /Rent Roll/i);
const acquisitionMemoCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
  t12Payload: {
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 1087488,
    total_market_annual: 1187488,
    occupancy: 0.95,
    summary_row_detected: true,
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1087488,
    total_market_annual: 1187488,
    occupancy: 0.95,
    totals: {
      total_units: 48,
      occupied_units: 46,
      in_place_rent_annual: 1087488,
      market_rent_annual: 1187488,
      summary_row_detected: true,
    },
  },
  financials: {},
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: false,
  hasUploadedFiles: true,
  documentSources: [
    { original_filename: "T12.pdf", doc_type: "t12", parse_status: "parsed" },
    { original_filename: "Rent Roll.pdf", doc_type: "rent_roll", parse_status: "parsed" },
    { original_filename: "Property Tax.pdf", doc_type: "property_tax", parse_status: "parsed" },
  ],
  currentDebtAssessmentState: buildCurrentDebtAssessmentState({
    mortgagePayload: null,
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
assert.match(acquisitionMemoCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(acquisitionMemoCoverageHtml, /Core operating inputs \(T12 and Rent Roll\) were fully verified/i);
assert.match(acquisitionMemoCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
assert.match(acquisitionMemoCoverageHtml, /T12 Operating Statement/i);
assert.match(acquisitionMemoCoverageHtml, /Rent Roll/i);
assert.equal(/<table>\s*<\/table>/.test(acquisitionMemoCoverageHtml), false);

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
assert.equal(budgetOnlyRenovationDisplayCopy.section_title, "Renovation Budget Summary");
assert.equal(budgetOnlyRenovationDisplayCopy.budget_card_title, "Renovation Budget Items");
assert.equal(budgetOnlyRenovationDisplayCopy.show_execution_card, false);
assert.match(budgetOnlyRenovationDisplayCopy.budget_note, /Budget and scope items are displayed from the uploaded renovation budget/i);
assert.match(budgetOnlyRenovationDisplayCopy.interpretation, /does not model renovation ROI, rent lift, payback, phasing, cost recovery, or implementation schedule/i);

const forwardLookingRenovationDisplayCopy = generatorTest.buildRenovationDisplayCopy({
  renovationDisplayMode: "forward_looking_modelable",
});
assert.equal(forwardLookingRenovationDisplayCopy.section_title, "Document-Supported Renovation Assumptions");
assert.equal(forwardLookingRenovationDisplayCopy.budget_card_title, "Renovation Budget Items");
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
assert.match(documentTreatmentHtml, /Historical CapEx Note\.pdf[\s\S]{0,220}Historical Capital Items/i);
assert.match(documentTreatmentHtml, /Historical CapEx Note\.pdf[\s\S]{0,260}Historical capital items are displayed for context only\./i);
assert.match(documentTreatmentHtml, /Environmental due-diligence context only; not used quantitatively\./i);
assert.equal(
  /Market survey \/ rent context only; not used to override rent roll\.|Unsupported Market Survey\.pdf[\s\S]{0,220}Listed for auditability only; not used quantitatively/i.test(documentTreatmentHtml),
  true
);
assert.equal(/Unsupported Phase I ESA\.pdf[\s\S]{0,220}(Structured property tax input|Property tax support is displayed only)/i.test(documentTreatmentHtml), false);
assert.match(documentTreatmentHtml, /data-treatment-source="metadata"/i);
assert.equal(/classified from the uploaded file names/i.test(documentTreatmentHtml), false);
assert.equal(/public sample|high[- ]value outreach|advisory only|docraptor|vendor/i.test(documentTreatmentHtml), false);
assert.equal(/Forward-looking renovation support is document-backed/i.test(documentTreatmentHtml), false);
assert.equal(/Document-Supported Renovation Assumptions/i.test(documentTreatmentHtml), false);
const marketSurveyTaggedAsRentRollHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "market_rent_survey_unstructured_source.txt",
      doc_type: "rent_roll",
      parse_status: "parsed_with_warnings",
      parse_error: "unsupported_file_type_for_structured_parsing",
    },
  ],
});
assert.match(marketSurveyTaggedAsRentRollHtml, /Market survey \/ rent context only; not used to override rent roll\./i);
assert.equal(/Structured rent roll input/i.test(marketSurveyTaggedAsRentRollHtml), false);
assert.equal(/Rent-roll support is displayed only/i.test(marketSurveyTaggedAsRentRollHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]{0,260}market_rent_survey_unstructured_source\.txt/i.test(
    marketSurveyTaggedAsRentRollHtml
  ),
  false
);
const purchaseAssumptionsLimitedUseHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: [
    {
      original_filename: "purchase_assumptions_source.txt",
      doc_type: "appraisal",
      semantic_doc_role: "appraisal",
      purchase_price: 10640000,
      going_in_cap_rate: 0.058,
      noi_basis: 611800,
      parse_status: "parsed",
    },
  ],
});
assert.match(
  purchaseAssumptionsLimitedUseHtml,
  /Purchase price \/ going-in cap \/ NOI basis support; does not override T12\/Rent Roll operating truth\./i
);
assert.match(purchaseAssumptionsLimitedUseHtml, /Displayed \/ Limited Use/i);
assert.match(purchaseAssumptionsLimitedUseHtml, /Purchase Assumptions \/ Acquisition Context/i);
assert.equal(/Appraisal Context/i.test(purchaseAssumptionsLimitedUseHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Listed but Not Quantitatively Modeled<\/p>[\s\S]*purchase_assumptions_source\.txt/i.test(
    purchaseAssumptionsLimitedUseHtml
  ),
  false
);
const purchaseAssumptionsPrecedenceHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: [
    {
      original_filename: "purchase_assumptions_source.txt",
      source_file_id: "purchase-assumptions-shared-source",
      file_id: "purchase-assumptions-shared-file",
      doc_type: "appraisal",
      semantic_doc_role: "appraisal",
      parse_status: "parsed",
    },
    {
      original_filename: "purchase_assumptions_source.txt",
      source_file_id: "purchase-assumptions-shared-source",
      file_id: "purchase-assumptions-shared-file",
      doc_type: "loan_term_sheet",
      semantic_doc_role: "purchase_assumptions",
      purchase_price: 10640000,
      going_in_cap_rate: 0.0575,
      noi_basis: 611800,
      accepted_fields: ["purchase_price", "going_in_cap_rate"],
      parse_status: "parsed",
    },
  ],
});
assert.match(purchaseAssumptionsPrecedenceHtml, /purchase_assumptions_source\.txt/i);
assert.match(purchaseAssumptionsPrecedenceHtml, /Purchase Assumptions \/ Acquisition Context/i);
assert.match(
  purchaseAssumptionsPrecedenceHtml,
  /Purchase price \/ going-in cap \/ NOI basis support; does not override T12\/Rent Roll operating truth\./i
);
const purchaseAssumptionsSourceTreatmentTable =
  String(purchaseAssumptionsPrecedenceHtml.match(/<p class="subsection-title">Source Treatment \/ Quantitative Use<\/p>[\s\S]*?<table[\s\S]*?<\/table>/i)?.[0] || "");
assert.equal((purchaseAssumptionsSourceTreatmentTable.match(/purchase_assumptions_source\.txt/gi) || []).length, 1);
assert.equal(/Appraisal Context/i.test(purchaseAssumptionsPrecedenceHtml), false);
assert.equal(/Listed for auditability only; not used quantitatively/i.test(purchaseAssumptionsPrecedenceHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Listed but Not Quantitatively Modeled<\/p>[\s\S]*purchase_assumptions_source\.txt/i.test(
    purchaseAssumptionsPrecedenceHtml
  ),
  false
);
const dealInputsPrecedenceHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: [
    {
      original_filename: "deal_inputs_uploaded_by_user.txt",
      source_file_id: "deal-inputs-shared-source",
      file_id: "deal-inputs-shared-file",
      doc_type: "appraisal",
      semantic_doc_role: "appraisal",
      parse_status: "parsed",
    },
    {
      original_filename: "deal_inputs_uploaded_by_user.txt",
      source_file_id: "deal-inputs-shared-source",
      file_id: "deal-inputs-shared-file",
      doc_type: "loan_term_sheet",
      semantic_doc_role: "purchase_assumptions",
      purchase_price: 10640000,
      going_in_cap_rate: 0.0575,
      noi_basis: 611800,
      accepted_fields: ["purchase_price", "going_in_cap_rate"],
      parse_status: "parsed",
    },
  ],
});
assert.match(dealInputsPrecedenceHtml, /Purchase Assumptions \/ Acquisition Context/i);
assert.equal(/Appraisal Context/i.test(dealInputsPrecedenceHtml), false);
assert.equal(/Listed for auditability only; not used quantitatively/i.test(dealInputsPrecedenceHtml), false);
assert.equal(
  /<p class=\"subsection-title\">Listed but Not Quantitatively Modeled<\/p>[\s\S]*deal_inputs_uploaded_by_user\.txt/i.test(
    dealInputsPrecedenceHtml
  ),
  false
);
const unsupportedAppraisalHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: [
    {
      original_filename: "Unsupported Appraisal Summary.pdf",
      doc_type: "appraisal",
      semantic_doc_role: "appraisal",
      parse_status: "parsed_with_warnings",
      parse_error: "doc_type_unclassified",
    },
  ],
});
assert.match(unsupportedAppraisalHtml, /Appraisal Context/i);
assert.match(unsupportedAppraisalHtml, /Context only/i);
assert.equal(/Purchase Assumptions \/ Acquisition Context/i.test(unsupportedAppraisalHtml), false);
const loanTermsSimpleHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: [
    {
      original_filename: "loan_terms_simple_source.txt",
      doc_type: "loan_term_sheet",
      semantic_doc_role: "loan_term_sheet",
      parse_status: "parsed",
    },
  ],
});
assert.match(
  loanTermsSimpleHtml,
  /(?:Debt support received \/ contextual or deferred|Acquisition context \/ document-derived purchase-price or cap-rate reference|Acquisition context only; not quantitatively modeled\.)/i
);
assert.equal(
  /Purchase Assumptions \/ Acquisition Context|Structured current debt input|Core quantitative source|Appraisal Context/i.test(loanTermsSimpleHtml),
  false
);
const acquisitionFinancingReadinessHtml = generatorTest.buildAcquisitionFinancingReadinessHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    stated_acquisition_loan_amount: 937500,
    ltv: 0.75,
    interest_rate: 0.0585,
    amortization_years: 30,
    lender_fee_percent: 0.01,
    debt_basis: "proposed_acquisition_financing",
    semantic_doc_role: "purchase_assumptions",
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportMode: "v1_core",
});
assert.match(acquisitionFinancingReadinessHtml, /Proposed Acquisition Financing Context/i);
assert.match(acquisitionFinancingReadinessHtml, /Purchase Price/i);
assert.match(acquisitionFinancingReadinessHtml, /Proposed Loan Amount/i);
assert.match(acquisitionFinancingReadinessHtml, /LTV/i);
assert.match(acquisitionFinancingReadinessHtml, /Interest Rate/i);
assert.match(acquisitionFinancingReadinessHtml, /Amortization/i);
assert.match(acquisitionFinancingReadinessHtml, /Closing \/ Lender Fee/i);
assert.match(acquisitionFinancingReadinessHtml, /source-bound proposed acquisition financing context only/i);
assert.equal(/refinance proceeds|refinance stability|current debt DSCR|DCF|waterfall|equity return|BUY|SELL|HOLD|Going-In DSCR|Estimated Annual Debt Service/i.test(acquisitionFinancingReadinessHtml), false);
const acquisitionFinancingReadinessCurrentDebtOnlyHtml = generatorTest.buildAcquisitionFinancingReadinessHtml({
  loanTermSheetTermsPayload: {
    debt_basis: "current_debt_context",
    semantic_doc_role: "current_debt_terms",
    current_outstanding_balance: 8750000,
    interest_rate: 0.0525,
    amortization_years: 30,
    ltv: 0.7,
    lender_fee_percent: 0.01,
    financing_fee_percent: 0.01,
    origination_fee_percent: 0.01,
  },
  acquisitionTermsPayload: {
    purchase_price: 1250000,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportMode: "v1_core",
  currentDebtAssessmentState: {
    has_true_current_debt_balance: true,
    current_debt_dscr_status: "computed",
  },
});
assert.match(acquisitionFinancingReadinessCurrentDebtOnlyHtml, /Proposed Acquisition Financing:\s*Not source-complete \/ not modeled\./i);
assert.equal(/Proposed Loan Amount/i.test(acquisitionFinancingReadinessCurrentDebtOnlyHtml), false);
assert.equal(/Interest Rate/i.test(acquisitionFinancingReadinessCurrentDebtOnlyHtml), false);
assert.equal(/Amortization/i.test(acquisitionFinancingReadinessCurrentDebtOnlyHtml), false);
assert.equal(/Closing \/ Lender Fee/i.test(acquisitionFinancingReadinessCurrentDebtOnlyHtml), false);
assert.equal(/refinance proceeds|refinance stability|current debt DSCR|DCF|waterfall|equity return|BUY|SELL|HOLD|Going-In DSCR|Estimated Annual Debt Service/i.test(acquisitionFinancingReadinessCurrentDebtOnlyHtml), false);
const acquisitionFinancingReadinessCollapsedHtml = generatorTest.buildAcquisitionFinancingReadinessHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    ltv: 0.75,
    interest_rate: 0.0585,
    debt_basis: "proposed_acquisition_financing",
    semantic_doc_role: "purchase_assumptions",
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportMode: "v1_core",
});
assert.match(acquisitionFinancingReadinessCollapsedHtml, /Proposed Acquisition Financing:\s*Not source-complete \/ not modeled\./i);
assert.equal(/Going-In DSCR|Estimated Annual Debt Service/i.test(acquisitionFinancingReadinessCollapsedHtml), false);
assert.equal(/Proposed Loan Amount/i.test(acquisitionFinancingReadinessCollapsedHtml), false);
assert.equal(/refinance proceeds|refinance stability|current debt DSCR|DCF|waterfall|equity return|BUY|SELL|HOLD/i.test(acquisitionFinancingReadinessCollapsedHtml), false);
const acquisitionQaCalibrationRender = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 2100000,
  },
  reportType: "underwriting",
  reportTier: 2,
  returnState: true,
  acquisitionTriangleValidationState: {
    status: "incomplete",
    triangleConsistent: true,
    verifiedFields: ["purchase_price"],
    missingFields: ["ltv", "interest_rate", "amortization_years", "stated_acquisition_loan_amount"],
    inconsistentFields: [],
    disclosureReasonCode: "acq_triangle_missing_required_terms",
    renderedBehavior: "collapse_to_disclosure",
  },
});
assert.equal(acquisitionQaCalibrationRender.renderBehavior, "collapse_to_disclosure");
assert.equal(acquisitionQaCalibrationRender.triangleValidationState.verifiedFields.includes("purchase_price"), true);
assert.equal(acquisitionQaCalibrationRender.triangleValidationState.missingFields.includes("ltv"), true);
assert.equal(acquisitionQaCalibrationRender.triangleValidationState.missingFields.includes("interest_rate"), true);
assert.equal(acquisitionQaCalibrationRender.triangleValidationState.missingFields.includes("amortization_years"), true);
assert.equal(
  acquisitionQaCalibrationRender.triangleValidationState.missingFields.includes("stated_acquisition_loan_amount"),
  true
);
const zoningSupportTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Zoning Compliance Letter.pdf",
      doc_type: "supporting_documents_unclassified",
      semantic_doc_role: "property_tax_support",
      semantic_doc_display_label: "Property tax support",
      semantic_doc_role_reason: "zoning compliance context",
      parse_status: "parsed_with_warnings",
      parse_error: "doc_type_unclassified",
    },
  ],
  propertyTaxPayload: { annual_tax: 18950 },
});
assert.match(zoningSupportTreatmentHtml, /Other Support Document/i);
assert.match(zoningSupportTreatmentHtml, /Context only/i);
assert.match(zoningSupportTreatmentHtml, /Zoning\/compliance context only; not used quantitatively\./i);
assert.equal(/Structured property tax input|Property tax support is displayed only/i.test(zoningSupportTreatmentHtml), false);
assert.equal(/<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]*Zoning Compliance Letter\.pdf/i.test(zoningSupportTreatmentHtml), false);
const stalePropertyTaxRoleEnvironmentalHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Environmental_Site_Assessment.pdf",
      doc_type: "supporting_documents_unclassified",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      semantic_doc_role_reason: "stale_semantic_role",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: { annual_tax: 21000, source_file_id: "tax-doc-1" },
});
assert.match(stalePropertyTaxRoleEnvironmentalHtml, /Environmental due-diligence context only; not used quantitatively\./i);
assert.equal(/Structured property tax input|Property-tax support is displayed only/i.test(stalePropertyTaxRoleEnvironmentalHtml), false);
const stalePropertyTaxRoleZoningHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Zoning_Compliance_Memo.pdf",
      doc_type: "supporting_documents_unclassified",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      semantic_doc_role_reason: "stale_semantic_role",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: { annual_tax: 21000, source_file_id: "tax-doc-1" },
});
assert.match(stalePropertyTaxRoleZoningHtml, /Property Tax Support/i);
assert.match(stalePropertyTaxRoleZoningHtml, /Corroborating support|Uploaded support document - not used quantitatively\./i);
assert.equal(/Structured property tax input|Property-tax support is displayed only/i.test(stalePropertyTaxRoleZoningHtml), false);
assert.equal(/<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]*Zoning_Compliance_Memo\.pdf/i.test(stalePropertyTaxRoleZoningHtml), false);
const environmentalCanonicalRoleTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Phase_I_ESA.pdf",
      doc_type: "supporting_documents_unclassified",
      semantic_doc_role: "environmental_due_diligence",
      semantic_doc_display_label: "Property tax support",
      semantic_doc_role_reason: "environmental_support_signals",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: { annual_tax: 18950, source_file_id: "tax-doc-1" },
});
assert.match(environmentalCanonicalRoleTreatmentHtml, /Environmental due-diligence context only; not used quantitatively\./i);
assert.equal(/Structured property tax input|Property-tax support is displayed only/i.test(environmentalCanonicalRoleTreatmentHtml), false);
const appraisalCanonicalRoleTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Appraisal_Report.pdf",
      doc_type: "appraisal",
      semantic_doc_role: "appraisal",
      semantic_doc_display_label: "appraisal",
      parse_status: "parsed",
    },
  ],
});
assert.match(appraisalCanonicalRoleTreatmentHtml, /Listed but Not Quantitatively Modeled/i);
assert.match(appraisalCanonicalRoleTreatmentHtml, /Listed for auditability only; not used quantitatively/i);
assert.equal(/<p class=\"subsection-title\">Modeled Inputs<\/p>[\s\S]*Appraisal_Report\.pdf/i.test(appraisalCanonicalRoleTreatmentHtml), false);

const historicalOnlyRenovationForcedForwardModeHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Historical_CapEx_Note.pdf", doc_type: "renovation", semantic_doc_role: "renovation_budget", parse_status: "parsed" },
  ],
  renovationDisplayMode: "forward_looking_modelable",
  hasForwardLookingRenovationInputs: false,
});
assert.equal(/Forward-looking renovation support is document-backed/i.test(historicalOnlyRenovationForcedForwardModeHtml), false);
assert.match(historicalOnlyRenovationForcedForwardModeHtml, /Displayed \/ Limited Use|Listed but Not Quantitatively Modeled/i);
assert.match(historicalOnlyRenovationForcedForwardModeHtml, /Historical Capital Items|Historical capital items are displayed for context only/i);
assert.equal(/Document-Supported Renovation Assumptions/i.test(historicalOnlyRenovationForcedForwardModeHtml), false);
assert.equal(/Renovation \/ CapEx Budget Context/i.test(historicalOnlyRenovationForcedForwardModeHtml), false);

const historicalOnlyOverrideWithNoisyForwardFlagHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "CapEx Scope.pdf",
      doc_type: "renovation",
      semantic_doc_role: "renovation_budget",
      semantic_doc_role_reason: "historical capital items only",
      parse_status: "parsed",
    },
  ],
  renovationDisplayMode: "forward_looking_modelable",
  hasForwardLookingRenovationInputs: true,
  renovationPayload: {
    timing_or_phasing: "Historical",
    interpretation: "Historical capital items only. No forward-looking budget, no rent lift, no ROI, no payback, and no implementation schedule.",
  },
});
assert.equal(/Forward-looking renovation support is document-backed/i.test(historicalOnlyOverrideWithNoisyForwardFlagHtml), false);
assert.match(historicalOnlyOverrideWithNoisyForwardFlagHtml, /Displayed \/ Limited Use|Listed but Not Quantitatively Modeled/i);
assert.match(historicalOnlyOverrideWithNoisyForwardFlagHtml, /Historical Capital Items|Historical capital items are displayed for context only/i);
assert.equal(/Document-Supported Renovation Assumptions/i.test(historicalOnlyOverrideWithNoisyForwardFlagHtml), false);
assert.equal(/Renovation \/ CapEx Budget Context/i.test(historicalOnlyOverrideWithNoisyForwardFlagHtml), false);

const forwardLookingRenovationAuthorityRows = generatorTest.buildCanonicalSupportDocAuthorityRows({
  documentSources: [
    {
      id: "ren1",
      original_filename: "Forward Looking Renovation Budget.pdf",
      doc_type: "renovation",
      semantic_doc_role: "renovation_budget",
      parse_status: "parsed",
      source_text: "Structured Renovation / CapEx Plan. Total renovation budget $1,138,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225, Months 1-18. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325, Months 1-24. Common/exterior/contingency rows included.",
    },
  ],
  artifacts: [
    {
      type: "renovation_parsed",
      payload: {
        file_id: "ren1",
        original_filename: "Forward Looking Renovation Budget.pdf",
        semantic_doc_role: "renovation_budget",
        total_budget: 1138000,
        budget_rows: [
          { category: "1BR unit turns", unit_count: 18, cost_per_unit: 18000, expected_monthly_rent_lift: 225, phase_timing: "Months 1-18" },
          { category: "2BR unit turns", unit_count: 22, cost_per_unit: 22000, expected_monthly_rent_lift: 325, phase_timing: "Months 1-24" },
        ],
        timing_or_phasing: "12 months implementation",
        rent_lift: "150",
      },
    },
  ],
  renovationPayload: {
    total_budget: 1138000,
    budget_rows: [
      { category: "1BR unit turns", unit_count: 18, cost_per_unit: 18000, expected_monthly_rent_lift: 225, phase_timing: "Months 1-18" },
      { category: "2BR unit turns", unit_count: 22, cost_per_unit: 22000, expected_monthly_rent_lift: 325, phase_timing: "Months 1-24" },
    ],
    timing_or_phasing: "12 months implementation",
    rent_lift: "150",
  },
});
const forwardLookingRenovationModeledTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Forward Looking Renovation Budget.pdf",
      doc_type: "renovation",
      semantic_doc_role: "renovation_budget",
      parse_status: "parsed",
    },
  ],
  supportDocAuthorityRows: forwardLookingRenovationAuthorityRows,
  renovationDisplayMode: "forward_looking_with_rent_lift",
  hasForwardLookingRenovationInputs: true,
  renovationPayload: {
    timing_or_phasing: "12 months implementation",
    rent_lift: "150",
  },
});
assert.match(forwardLookingRenovationModeledTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(forwardLookingRenovationModeledTreatmentHtml, /Structured renovation \/ CapEx context/i);
assert.match(forwardLookingRenovationModeledTreatmentHtml, /Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only/i);
assert.equal(
  /No verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided/i.test(
    forwardLookingRenovationModeledTreatmentHtml
  ),
  false
);

const forwardLookingRowEvidenceTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Reno Plan Willowmere.pdf", doc_type: "renovation", semantic_doc_role: "renovation_budget", parse_status: "parsed" },
  ],
  renovationDisplayMode: "historical_only",
  hasForwardLookingRenovationInputs: false,
  renovationPayload: {
    total_budget: 540000,
    budget_rows: [
      { unit_type: "1BR", unit_count: 8, cost_per_unit: 18000, expected_monthly_rent_lift: 125, phase_timing: "Months 1-18" },
      { unit_type: "2BR", unit_count: 6, cost_per_unit: 22000, expected_monthly_rent_lift: 175, phase_timing: "Months 1-24" },
    ],
  },
});
assert.equal(/Historical capital items are displayed for context only/i.test(forwardLookingRowEvidenceTreatmentHtml), false);
assert.match(forwardLookingRowEvidenceTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(forwardLookingRowEvidenceTreatmentHtml, /Structured renovation \/ CapEx context/i);
assert.match(forwardLookingRowEvidenceTreatmentHtml, /Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only/i);
assert.equal(/ROI, payback, NOI, valuation, or refinance outputs/i.test(forwardLookingRowEvidenceTreatmentHtml), true);
assert.equal(
  /No verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided/i.test(
    forwardLookingRowEvidenceTreatmentHtml
  ),
  false
);

const budgetOnlyNoRoiTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "Renovation Budget Items.pdf",
      doc_type: "renovation",
      semantic_doc_role: "renovation_budget",
      parse_status: "parsed",
      source_text: "Renovation / CapEx Budget Context. Total renovation budget $540,000. Common Areas scope only. Rent lift, ROI, payback, and implementation schedule were not provided.",
    },
  ],
  renovationDisplayMode: "budget_only_no_roi",
  hasForwardLookingRenovationInputs: true,
  renovationPayload: {
    total_budget: 540000,
    budget_rows: [
      { category: "Common Areas", estimated_cost: 125000 },
    ],
  },
});
assert.match(budgetOnlyNoRoiTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(budgetOnlyNoRoiTreatmentHtml, /Budget\/scope only/i);
assert.equal(/Forward-looking renovation support is document-backed/i.test(budgetOnlyNoRoiTreatmentHtml), false);
assert.equal(
  /No verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided/i.test(
    budgetOnlyNoRoiTreatmentHtml
  ),
  false
);

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
assert.match(budgetOnlyDocumentTreatmentHtml, /Renovation \/ CapEx Budget Context|Budget\/scope only/i);

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
assert.match(budgetOnlyRenovationCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(budgetOnlyRenovationCoverageHtml, /Core operating inputs \(T12 and Rent Roll\) were fully verified/i);
assert.match(budgetOnlyRenovationCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
assert.equal(budgetOnlyRenovationCoverageHtml.includes("Historical Capital Expenditure Summary"), false);

const filenameFallbackHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Rent Roll.xlsx" },
  ],
});
assert.match(filenameFallbackHtml, /Displayed \/ Limited Use/i);
assert.equal(/Structured rent roll input/i.test(filenameFallbackHtml), false);
assert.match(filenameFallbackHtml, /data-treatment-source="filename_fallback"/i);
assert.equal(/Structured current debt input/i.test(filenameFallbackHtml), false);
assert.equal(/Current debt coverage was assessed from verified current debt inputs/i.test(filenameFallbackHtml), false);
assert.equal(/classified from the uploaded file names/i.test(filenameFallbackHtml), false);
const filenameOnlyPropertyTaxUnboundHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { original_filename: "Municipal Tax Notice.pdf" },
  ],
  propertyTaxPayload: {
    annual_tax: 18500,
  },
});
assert.equal(/Property-tax support is displayed only/i.test(filenameOnlyPropertyTaxUnboundHtml), false);
assert.match(filenameOnlyPropertyTaxUnboundHtml, /Uploaded support document - not used quantitatively\./i);
const filenameOnlyPropertyTaxMismatchedBindingHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { id: "doc-tax-row", original_filename: "Property Tax Bill.pdf" },
  ],
  propertyTaxPayload: {
    annual_tax: 18500,
    source_file_id: "other-doc-id",
  },
});
assert.equal(/Property-tax support is displayed only/i.test(filenameOnlyPropertyTaxMismatchedBindingHtml), false);
assert.match(filenameOnlyPropertyTaxMismatchedBindingHtml, /Uploaded support document - not used quantitatively\./i);
const filenameOnlyPropertyTaxBoundHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    { id: "doc-tax-bound", original_filename: "Property Tax Statement.pdf" },
  ],
  propertyTaxPayload: {
    annual_tax: 18500,
    source_file_id: "doc-tax-bound",
  },
});
assert.match(
  filenameOnlyPropertyTaxBoundHtml,
  /Limited corroborating support: supports T12 property tax line; not used to override T12 totals\./i
);
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
      id: "doc-property-tax-1",
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
    source_file_id: "doc-property-tax-1",
  },
});
assert.match(propertyTaxValidatedTreatmentHtml, /Displayed \/ Limited Use/i);
assert.match(
  propertyTaxValidatedTreatmentHtml,
  /Limited corroborating support: supports T12 property tax line; not used to override T12 totals\./i
);
const propertyTaxMismatchedSupportDocHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      id: "doc-env-1",
      original_filename: "Environmental_Report.pdf",
      doc_type: "supporting",
      display_doc_type: "Environmental",
      semantic_doc_role: "environmental",
      semantic_doc_display_label: "environmental support",
      parse_status: "parsed",
    },
    {
      id: "doc-property-tax-2",
      original_filename: "Tax_Record.pdf",
      doc_type: "property_tax",
      display_doc_type: "Property Tax",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: {
    annual_tax: 21000,
    source_file_id: "doc-property-tax-2",
  },
});
assert.equal(/Environmental_Report\.pdf[\s\S]{0,220}(Structured property tax input|Property tax support)/i.test(propertyTaxMismatchedSupportDocHtml), false);
assert.match(
  propertyTaxMismatchedSupportDocHtml,
  /Tax_Record\.pdf[\s\S]{0,220}Limited corroborating support: supports T12 property tax line; not used to override T12 totals\./i
);
const propertyTaxMissingBindingHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  documentSources: [
    {
      original_filename: "PropertyTaxSource.pdf",
      doc_type: "property_tax",
      display_doc_type: "Property Tax",
      semantic_doc_role: "property_tax",
      semantic_doc_display_label: "property_tax",
      parse_status: "parsed",
    },
  ],
  propertyTaxPayload: {
    annual_tax: 22000,
  },
});
assert.equal(/Structured property tax input/i.test(propertyTaxMissingBindingHtml), false);
assert.match(propertyTaxMissingBindingHtml, /Uploaded support document - not used quantitatively\./i);

const summaryOnlyUnitMixCollapsedHtml = generatorTest.collapseSummaryOnlyUnitMixSection(
  '<p class="subsection-title">Unit Mix and Rent Positioning</p><table class="unit-mix-table"><tbody></tbody></table>',
  {
    summaryOnlyRentRollSurface: true,
    summaryTitle: "Summary Rent Positioning",
    summaryBody: "Summary totals indicate in-place rent is below documented market rent.",
    summaryMetrics: {
      totalUnits: 48,
      occupiedUnits: 46,
      occupancy: 0.9583,
      annualInPlace: 1036800,
      annualMarket: 1137600,
      formatCurrency,
    },
  }
);
assert.equal(/unit-mix-table/i.test(summaryOnlyUnitMixCollapsedHtml), false);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Summary Rent Positioning/i);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Annual In-Place Rent/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Annual Market Rent/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Annual Gross Rent Upside/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Rent Gap %/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Total Units/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Occupied Units/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Vacant Units/);
assert.match(summaryOnlyUnitMixCollapsedHtml, /Occupancy/);
const summaryOnlyRentPositioningTitle = generatorTest.resolveRentPositioningSectionTitle({
  effectiveReportMode: "v1_core",
  summaryOnlyRentRollSurface: true,
});
assert.equal(summaryOnlyRentPositioningTitle.title, "Summary Rent Positioning & Value Sensitivity");
assert.equal(/Unit-Level/i.test(summaryOnlyRentPositioningTitle.title), false);
assert.equal(
  generatorTest.resolveRentPositioningSectionTitle({
    effectiveReportMode: "v1_core",
    summaryOnlyRentRollSurface: false,
  }).title,
  "Unit-Level Rent Positioning & Value Sensitivity"
);
const acquisitionMemoSummaryCardHtml = generatorTest.buildAcquisitionMemoSummaryCard({
  units: 48,
  occupancy: 0.9583,
  annualInPlace: 1036800,
  annualMarket: 1137600,
  annualUpsideRatio: 0.097,
  purchasePrice: 10640000,
  goingInCapRate: 0.0575,
  noi: 611800,
  formatCurrency,
  formatPercent1,
});
assert.match(acquisitionMemoSummaryCardHtml, /Acquisition Memo Summary/);
assert.match(acquisitionMemoSummaryCardHtml, /Purchase Price/);
assert.match(acquisitionMemoSummaryCardHtml, /NOI Basis/);
assert.equal(/<table>\s*<\/table>/.test(acquisitionMemoSummaryCardHtml), false);
assert.equal(/<table>\s*<\/table>/.test(acquisitionMemoSummaryCardHtml), false);
const operatingSnapshotCardHtml = generatorTest.buildOperatingSnapshotCard({
  units: 48,
  occupancy: 0.9583,
  annualInPlace: 1036800,
  egi: 1500000,
  operatingExpenses: 600000,
  noi: 900000,
  expenseRatio: 0.4,
  noiMargin: 0.6,
  breakEvenOccupancy: 0.4,
  formatCurrency,
  formatPercent1,
});
assert.match(operatingSnapshotCardHtml, /Operating Snapshot/);
assert.match(operatingSnapshotCardHtml, /Effective Gross Income/);
assert.match(operatingSnapshotCardHtml, /Break-Even Occupancy/);
assert.equal(/<table>\s*<\/table>/.test(operatingSnapshotCardHtml), false);
assert.equal(/<table>\s*<\/table>/.test(operatingSnapshotCardHtml), false);
const rentUpsideValueSensitivityCardHtml = generatorTest.buildRentUpsideValueSensitivityCard({
  annualInPlace: 1036800,
  annualMarket: 1137600,
  formatCurrency,
});
assert.match(rentUpsideValueSensitivityCardHtml, /Rent Upside \/ Value Sensitivity/);
assert.match(rentUpsideValueSensitivityCardHtml, /Implied Value Sensitivity at Stabilization/);
assert.equal(/Unit-Level/i.test(rentUpsideValueSensitivityCardHtml), false);
assert.equal(/<table>\s*<\/table>/.test(rentUpsideValueSensitivityCardHtml), false);
assert.equal(/<table>\s*<\/table>/.test(rentUpsideValueSensitivityCardHtml), false);
const sourceContextBlockHtml = generatorTest.buildLaunchSourceContextBlock({
  reportMode: "v1_core",
  documentSources: [
    { original_filename: "T12.pdf", doc_type: "t12" },
    { original_filename: "Rent Roll.pdf", doc_type: "rent_roll" },
    { original_filename: "Property Tax.pdf", doc_type: "property_tax" },
    { original_filename: "Appraisal Summary.pdf", doc_type: "appraisal" },
    { original_filename: "Broker Email.pdf", doc_type: "broker_email" },
  ],
  currentDebtAssessmentState: {
    current_debt_dscr_status: "not_assessed",
    has_true_current_debt_balance: false,
  },
  hasForwardLookingRenovationInputs: false,
  renovationDisplayMode: null,
  renovationPayload: null,
  propertyTaxPayload: { annual_tax: 92000 },
  propertyTaxBindingState: { hasValidatedAnnualTax: true, annualTaxStatus: "validated" },
  documentQuantitativeUsageMap: null,
});
assert.match(sourceContextBlockHtml, /Modeled core inputs are limited to T12 and Rent Roll/);
assert.match(sourceContextBlockHtml, /Document Treatment Summary/);
assert.match(sourceContextBlockHtml, /context-only/i);
assert.match(sourceContextBlockHtml, /Acquisition context is limited to verified purchase assumptions and document-derived cap-rate reference where supported\./i);
assert.match(sourceContextBlockHtml, /Advanced financing and return-projection modules remain deferred unless explicitly supported by the report family and verified source basis\./i);
assert.equal(/<table>\s*<\/table>/.test(sourceContextBlockHtml), false);
assert.match(reportSource, /function buildRentPositioningSummaryCard/);
assert.match(reportSource, /function buildAcquisitionMemoSummaryCard/);
assert.match(reportSource, /function buildOperatingSnapshotCard/);
assert.match(reportSource, /function buildRentUpsideValueSensitivityCard/);
assert.match(reportSource, /function buildLaunchSourceContextBlock/);
assert.match(reportSource, /function resolveRentPositioningSectionTitle/);
assert.match(reportSource, /SECTION_0_6_ACQUISITION_MEMO_SUMMARY/);
assert.match(reportSource, /SECTION_0_7_OPERATING_SNAPSHOT/);
assert.match(reportSource, /SECTION_2_1_RENT_UPSIDE_VALUE_SENSITIVITY/);
assert.match(reportSource, /SECTION_2_2_CAP_RATE_VALUE_INDICATION/);
assert.match(reportSource, /Source Context \/ Support Document Treatment/);
assert.match(reportSource, /Data Coverage &amp; Source Limitations/);
assert.match(reportSource, /function stripThinSectionPages/);
assert.match(
  reportSource,
  /const acquisitionMemoUnits = coerceNumber\(computedRentRoll\?\.total_units \?\? rentRollPayload\?\.total_units\);/
);
assert.match(
  reportSource,
  /capRateValueIndicationBlockHtml = buildCapRateValueTable\(/
);
assert.equal(
  /capRateValueIndicationBlockHtml = buildCapRateValueTable\(\s*coerceNumber\(t12Payload\?\.net_operating_income\),\s*rrUnits,/.test(
    reportSource
  ),
  false
);
const strippedEmptyHeadingHtml = generatorTest.stripEmptyHeadingBlocks(
  '<div><p class="section-intro">   </p><p class="subsection-title">  </p><p>Body</p></div>'
);
assert.equal(/section-intro|subsection-title/i.test(strippedEmptyHeadingHtml), false);
const thinSectionCollapsedHtml = generatorTest.stripThinSectionPages(
  '<section class="section page-break"><div class="section-header"><span class="section-header-eyebrow">Section 01</span><span class="section-header-title">Thin Example</span><span class="section-header-sub">Orphan heading</span></div><p>Only one weak sentence.</p></section>'
);
assert.equal(thinSectionCollapsedHtml.trim(), "");
const denseSectionPreservedHtml = generatorTest.stripThinSectionPages(
  '<section class="section page-break"><div class="section-header"><span class="section-header-eyebrow">Section 01</span><span class="section-header-title">Dense Example</span><span class="section-header-sub">Source supported</span></div><table><tbody><tr><td>Metric</td><td>Value</td></tr></tbody></table></section>'
);
assert.match(denseSectionPreservedHtml, /Dense Example/);
assert.match(denseSectionPreservedHtml, /Metric/);
const emptyTableSectionCollapsedHtml = generatorTest.stripThinSectionPages(
  '<section class="section page-break"><div class="section-header"><span class="section-header-eyebrow">Section 02</span><span class="section-header-title">Empty Table</span><span class="section-header-sub">Orphan table</span></div><table><tbody></tbody></table></section>'
);
assert.equal(emptyTableSectionCollapsedHtml.trim(), "");
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
assert.match(acquisitionSizingHtml, /<th>Input<\/th><th>Document-Derived Value<\/th>/i);
const acquisitionCanonicalMappingHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    loan_amount: 937500,
    ltv: 0.75,
    lender_fee_percent: 0.01,
    interest_rate: 0.065,
    amortization_years: 30,
    closing_cost_notes: "1.00% lender fee plus standard legal/appraisal costs",
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.match(acquisitionCanonicalMappingHtml, /Purchase Price[\s\S]{0,80}\$1,250,000/i);
assert.match(acquisitionCanonicalMappingHtml, /Stated Acquisition Loan Amount[\s\S]{0,80}\$937,500/i);
assert.equal(/Purchase Price[\s\S]{0,80}\$937,500/i.test(acquisitionCanonicalMappingHtml), false);
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,80}\$703,125/i.test(acquisitionCanonicalMappingHtml), false);
assert.match(acquisitionCanonicalMappingHtml, /Lender Fee[\s\S]{0,80}1\.0%/i);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(acquisitionCanonicalMappingHtml), false);
assert.equal(/Current Debt DSCR/i.test(acquisitionCanonicalMappingHtml), false);
assert.equal(/differ materially; stated source values are shown without silent re-derivation/i.test(acquisitionCanonicalMappingHtml), false);
const acquisitionInconsistentTriangleHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    loan_amount: 500000,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(/<th>Input<\/th><th>Document-Derived Value<\/th>/i.test(acquisitionInconsistentTriangleHtml), false);
assert.match(acquisitionInconsistentTriangleHtml, /not safe to render as a full debt sizing table/i);
assert.match(acquisitionInconsistentTriangleHtml, /differ materially; stated source values are shown without silent re-derivation/i);
assert.equal(/Purchase Price[\s\S]{0,80}\$1,250,000/i.test(acquisitionInconsistentTriangleHtml), false);
assert.equal(/Documented LTV[\s\S]{0,80}75\.0%/i.test(acquisitionInconsistentTriangleHtml), false);
assert.equal(/Stated Acquisition Loan Amount[\s\S]{0,80}\$500,000/i.test(acquisitionInconsistentTriangleHtml), false);
assert.match(acquisitionInconsistentTriangleHtml, /Interest Rate[\s\S]{0,80}6\.50%/i);
assert.match(acquisitionInconsistentTriangleHtml, /Amortization[\s\S]{0,80}30 years/i);
const acquisitionGoingInCapOnlyHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    ltv: 0.75,
    going_in_cap_rate: 0.0575,
    closing_costs_percent: 0.01,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.match(acquisitionGoingInCapOnlyHtml, /Going-In Cap Rate[\s\S]{0,80}5\.8%/i);
assert.equal(/Interest Rate[\s\S]{0,80}%/i.test(acquisitionGoingInCapOnlyHtml), false);
assert.equal(/Estimated Annual Debt Service/i.test(acquisitionGoingInCapOnlyHtml), false);
const acquisitionMissingPurchasePriceHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    loan_amount: 900000,
    ltv: 0.75,
    interest_rate: 0.061,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(/<th>Input<\/th><th>Document-Derived Value<\/th>/i.test(acquisitionMissingPurchasePriceHtml), false);
assert.equal(/Purchase Price[\s\S]{0,80}\$/i.test(acquisitionMissingPurchasePriceHtml), false);
assert.match(acquisitionMissingPurchasePriceHtml, /not safe to render as a full debt sizing table/i);
const acquisitionMismatchedStatedVsDerivedHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1000000,
    loan_amount: 650000,
    ltv: 0.8,
    interest_rate: 0.062,
    amortization_years: 30,
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,80}\$/i.test(acquisitionMismatchedStatedVsDerivedHtml), false);
assert.match(acquisitionMismatchedStatedVsDerivedHtml, /differ materially; stated source values are shown without silent re-derivation/i);
assert.equal(/Stated Acquisition Loan Amount[\s\S]{0,80}\$650,000/i.test(acquisitionMismatchedStatedVsDerivedHtml), false);
assert.match(acquisitionMismatchedStatedVsDerivedHtml, /Interest Rate[\s\S]{0,80}6\.20%/i);
assert.match(acquisitionMismatchedStatedVsDerivedHtml, /Amortization[\s\S]{0,80}30 years/i);
const acquisitionLenderFeeNotExplicitlyVerifiedHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload: {
    purchase_price: 1250000,
    loan_amount: 937500,
    ltv: 0.75,
    interest_rate: 0.065,
    amortization_years: 30,
    source_text: "Closing / Fees 1.00% lender fee + legal/appraisal costs.",
    closing_cost_notes: "legal/appraisal costs noted",
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(/Lender Fee[\s\S]{0,80}1\.0%/i.test(acquisitionLenderFeeNotExplicitlyVerifiedHtml), false);
assert.match(acquisitionLenderFeeNotExplicitlyVerifiedHtml, /Closing Cost Notes[\s\S]{0,120}Legal\/appraisal costs noted; not quantified/i);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(acquisitionLenderFeeNotExplicitlyVerifiedHtml), false);
const acquisitionContextTextMappingHtml = generatorTest.buildAcquisitionFinancingAssumptionsHtml({
  acquisitionTermsPayload: {
    purchase_price: 937500,
    loan_amount: 937500,
    ltv: 0.75,
    interest_rate: 5.85,
    amortization_years: 30,
    closing_cost_notes: "1.00% lender fee + standard legal / appraisal costs",
    source_text:
      "Loan Amount (at $1,250,000 purchase price) $937,500. Proposed Loan-to-Value (LTV) 75%. Interest Rate 5.85%. Amortization 30 years. Closing / Fees 1.00% lender fee + standard legal / appraisal costs.",
  },
  t12Payload: {
    net_operating_income: 650000,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.match(acquisitionContextTextMappingHtml, /Purchase Price[\s\S]{0,80}\$1,250,000/i);
assert.match(acquisitionContextTextMappingHtml, /Stated Acquisition Loan Amount[\s\S]{0,80}\$937,500/i);
assert.equal(/Purchase Price[\s\S]{0,80}\$937,500/i.test(acquisitionContextTextMappingHtml), false);
assert.equal(/Derived Acquisition Loan Amount[\s\S]{0,80}\$703,125/i.test(acquisitionContextTextMappingHtml), false);
assert.equal(/Lender Fee[\s\S]{0,80}1\.0%/i.test(acquisitionContextTextMappingHtml), false);
assert.match(acquisitionContextTextMappingHtml, /Closing Cost Notes[\s\S]{0,120}Legal\/appraisal costs noted; not quantified/i);
assert.equal(/Closing Costs[\s\S]{0,80}0\.0%/i.test(acquisitionContextTextMappingHtml), false);
assert.equal(/differ materially; stated source values are shown without silent re-derivation/i.test(acquisitionContextTextMappingHtml), false);
assert.equal(/Current Debt DSCR/i.test(acquisitionContextTextMappingHtml), false);
const normalizedAcquisitionArtifactPayload = generatorTest.normalizeAcquisitionFinancingArtifactPayload({
  purchase_price: 937500,
  loan_amount: 937500,
  ltv: 0.75,
  closing_costs_percent: 0,
  source_text:
    "Loan Amount (at $1,250,000 purchase price) $937,500. Proposed Loan-to-Value (LTV) 75%. Closing / Fees 1.00% lender fee + standard legal / appraisal costs.",
});
assert.equal(normalizedAcquisitionArtifactPayload.purchase_price, 937500);
assert.equal(normalizedAcquisitionArtifactPayload.stated_acquisition_loan_amount, 937500);
assert.equal(normalizedAcquisitionArtifactPayload.loan_amount, 937500);
assert.equal(normalizedAcquisitionArtifactPayload.lender_fee_percent, undefined);
assert.equal(normalizedAcquisitionArtifactPayload._renderer_derived_fields?.purchase_price_from_text, 1250000);
assert.equal(normalizedAcquisitionArtifactPayload._renderer_derived_fields?.stated_acquisition_loan_amount_from_text, 937500);
assert.equal(Number((normalizedAcquisitionArtifactPayload._renderer_derived_fields?.lender_fee_percent_from_text || 0).toFixed(4)), 0.01);
assert.equal(Number((normalizedAcquisitionArtifactPayload._renderer_derived_fields?.derived_acquisition_loan_amount_from_purchase_ltv || 0).toFixed(0)), 703125);
assert.equal("closing_costs_percent" in normalizedAcquisitionArtifactPayload, false);
assert.match(String(normalizedAcquisitionArtifactPayload.closing_cost_notes || ""), /Legal\/appraisal costs noted; not quantified/i);
assert.equal(normalizedAcquisitionArtifactPayload.outstanding_balance, undefined);
const normalizedAcquisitionShorthandPayload = generatorTest.normalizeAcquisitionFinancingArtifactPayload({
  source_text: "Price ref: 1,250,000 -> Loan 937,500; Fees 1% lender fee + legal",
  debt_basis: "acquisition_financing_assumption",
});
assert.equal(normalizedAcquisitionShorthandPayload.purchase_price, undefined);
assert.equal(normalizedAcquisitionShorthandPayload.stated_acquisition_loan_amount, undefined);
assert.equal(normalizedAcquisitionShorthandPayload.loan_amount, undefined);
assert.equal(normalizedAcquisitionShorthandPayload.lender_fee_percent, undefined);
assert.equal(normalizedAcquisitionShorthandPayload._renderer_derived_fields?.purchase_price_from_text, 1250000);
assert.equal(normalizedAcquisitionShorthandPayload._renderer_derived_fields?.stated_acquisition_loan_amount_from_text, 937500);
assert.equal(Number((normalizedAcquisitionShorthandPayload._renderer_derived_fields?.lender_fee_percent_from_text || 0).toFixed(4)), 0.01);
assert.match(String(normalizedAcquisitionShorthandPayload.closing_cost_notes || ""), /not quantified/i);

const normalizedAcquisitionTablePayload = generatorTest.normalizeAcquisitionFinancingArtifactPayload({
  source_text: "Loan Amount (at $1,250,000 purchase price) $937,500",
});
assert.equal(normalizedAcquisitionTablePayload.purchase_price, undefined);
assert.equal(normalizedAcquisitionTablePayload.stated_acquisition_loan_amount, undefined);
assert.equal(normalizedAcquisitionTablePayload._renderer_derived_fields?.purchase_price_from_text, 1250000);
assert.equal(normalizedAcquisitionTablePayload._renderer_derived_fields?.stated_acquisition_loan_amount_from_text, 937500);

const normalizedAcquisitionLabeledPayload = generatorTest.normalizeAcquisitionFinancingArtifactPayload({
  source_text: "Purchase Price: $1,250,000 / Loan Amount: $937,500 / LTV: 75% / AM: 30 years / Rate: 5.85% / Origination fee 1.25%",
});
assert.equal(normalizedAcquisitionLabeledPayload.purchase_price, undefined);
assert.equal(normalizedAcquisitionLabeledPayload.stated_acquisition_loan_amount, undefined);
assert.equal(normalizedAcquisitionLabeledPayload._renderer_derived_fields?.purchase_price_from_text, 1250000);
assert.equal(normalizedAcquisitionLabeledPayload._renderer_derived_fields?.stated_acquisition_loan_amount_from_text, 937500);
assert.equal(Number(normalizedAcquisitionLabeledPayload.ltv.toFixed(4)), 0.75);
assert.equal(Number(normalizedAcquisitionLabeledPayload.interest_rate.toFixed(4)), 0.0585);
assert.equal(normalizedAcquisitionLabeledPayload.amortization_years, 30);
assert.equal(normalizedAcquisitionLabeledPayload.lender_fee_percent, undefined);
assert.equal(Number((normalizedAcquisitionLabeledPayload._renderer_derived_fields?.lender_fee_percent_from_text || 0).toFixed(4)), 0.0125);

const normalizedAcquisitionGenericVariant = generatorTest.normalizeAcquisitionFinancingArtifactPayload({
  source_text: "Asking Price: $2,840,000 / Proposed Loan: $2,130,000 / Loan-to-Value 75% / AMORT 25 years / Interest rate 6.1% / Financing fee 0.85%",
});
assert.equal(normalizedAcquisitionGenericVariant.purchase_price, undefined);
assert.equal(normalizedAcquisitionGenericVariant.stated_acquisition_loan_amount, undefined);
assert.equal(normalizedAcquisitionGenericVariant._renderer_derived_fields?.purchase_price_from_text, 2840000);
assert.equal(normalizedAcquisitionGenericVariant._renderer_derived_fields?.stated_acquisition_loan_amount_from_text, 2130000);
assert.equal(Number(normalizedAcquisitionGenericVariant.ltv.toFixed(4)), 0.75);
assert.equal(normalizedAcquisitionGenericVariant.amortization_years, 25);
assert.equal(normalizedAcquisitionGenericVariant.lender_fee_percent, undefined);
assert.equal(Number((normalizedAcquisitionGenericVariant._renderer_derived_fields?.lender_fee_percent_from_text || 0).toFixed(4)), 0.0085);
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
assert.match(liveCurrentDebtModeledCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(liveCurrentDebtModeledCoverageHtml, /Core operating inputs \(T12 and Rent Roll\) were fully verified/i);
assert.match(liveCurrentDebtModeledCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
const cleanScreeningCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    variance_pct: 0,
    source_reconciliation_disclosure: null,
  },
  sectionEligibility: {
    source_constrained_section_count: 0,
  },
});
assert.match(cleanScreeningCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.equal(/SOURCE LIMITATIONS DISCLOSURE/i.test(cleanScreeningCoverageHtml), false);

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
const sourceLimitedScreeningCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    variance_pct: null,
    source_reconciliation_disclosure: null,
  },
  sectionEligibility: {
    source_constrained_section_count: 0,
    source_limited_disclosure_required: true,
  },
});
assert.match(sourceLimitedScreeningCoverageHtml, /SOURCE LIMITATIONS DISCLOSURE/i);

const cleanCoreOptionalConstrainedUnderwritingCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
  documentSources: [],
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    variance_pct: 0,
    source_reconciliation_disclosure: null,
  },
  sectionEligibility: {
    source_constrained_section_count: 2,
    source_limited_disclosure_required: false,
  },
  hasForwardLookingRenovationInputs: false,
});
assert.match(cleanCoreOptionalConstrainedUnderwritingCoverageHtml, /CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified/i);
assert.equal(/SOURCE LIMITATIONS DISCLOSURE/i.test(cleanCoreOptionalConstrainedUnderwritingCoverageHtml), false);
assert.match(cleanCoreOptionalConstrainedUnderwritingCoverageHtml, /Optional underwriting sections are source-constrained where supporting inputs were not verified\./i);

const cleanCoreUnsupportedSupportDocsUnderwritingCoverageHtml = generatorTest.buildScreeningDataCoverageSummary({
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
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
  documentSources: [
    { original_filename: "UNSUPPORTED_Market_Survey.pdf", parse_status: "unsupported", doc_type: "market_survey" },
    { original_filename: "UNSUPPORTED_Phase_I_ESA.pdf", parse_status: "unsupported", doc_type: "environmental_report" },
  ],
  sourceReconciliationState: {
    status: "aligned",
    publishability_bucket: "core_sufficient_publishable",
    variance_pct: 0,
    source_reconciliation_disclosure: null,
  },
  sectionEligibility: {
    source_constrained_section_count: 1,
    source_limited_disclosure_required: false,
  },
  hasForwardLookingRenovationInputs: false,
});
assert.match(cleanCoreUnsupportedSupportDocsUnderwritingCoverageHtml, /CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified/i);
assert.equal(/SOURCE LIMITATIONS DISCLOSURE/i.test(cleanCoreUnsupportedSupportDocsUnderwritingCoverageHtml), false);
assert.match(cleanCoreUnsupportedSupportDocsUnderwritingCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
assert.equal(/BEGIN DOCUMENT_TREATMENT_SUMMARY/i.test(cleanCoreUnsupportedSupportDocsUnderwritingCoverageHtml), false);

const reconciliationDisclosureCoverageHtmlUnderwriting = generatorTest.buildScreeningDataCoverageSummary({
  t12Payload: {
    gross_potential_rent: 1087488,
    effective_gross_income: 1100000,
    total_operating_expenses: 450000,
    net_operating_income: 650000,
  },
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    total_market_annual: 1117800,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 961200,
    total_market_annual: 1117800,
    occupancy: 0.95,
    unit_mix: [{ label: "1BR", in_place_rent: 1888, market_rent: 1950 }],
  },
  financials: {},
  effectiveReportMode: "v1_core",
  supportingUnderwritingDocsUsed: true,
  hasUploadedFiles: true,
  documentSources: [],
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
    status: "source_reconciliation_required",
    publishability_bucket: "disclose_only_publishable",
    variance_pct: -0.48043243243243244,
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
  sectionEligibility: {
    source_constrained_section_count: 0,
  },
  hasForwardLookingRenovationInputs: false,
});
assert.match(reconciliationDisclosureCoverageHtmlUnderwriting, /Field extraction completeness does not imply cross-source reconciliation/i);

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
assert.match(liveCurrentDebtLimitedCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(liveCurrentDebtLimitedCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
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
const parserSignalReconciliationState = buildSourceReconciliationState({
  computedRentRoll: {
    total_units: 20,
    total_in_place_annual: 1260000,
  },
  rentRollPayload: {
    total_units: 20,
    total_in_place_annual: 1260000,
  },
  t12Payload: {
    gross_potential_rent: 1000000,
  },
  sourceReportCoverageQa: {
    deterministic_flags: [
      { code: "RENT_ROLL_T12_VARIANCE", routing: "parser_gap" },
      { code: "RENT_ROLL_T12_VARIANCE", routing: "artifact_gap" },
    ],
  },
});
assert.equal(parserSignalReconciliationState.status, "source_reconciliation_required");
assert.equal(parserSignalReconciliationState.customer_delivery_impact, "disclose_only");
assert.equal(parserSignalReconciliationState.public_outreach_impact, "block_until_review");
assert.equal(parserSignalReconciliationState.parser_suspected, false);
assert.equal(parserSignalReconciliationState.parser_signal_observed, true);
const insufficientInputReconciliationState = buildSourceReconciliationState({
  computedRentRoll: { total_units: 20, total_in_place_annual: null },
  rentRollPayload: { total_units: 20, total_in_place_annual: null },
  t12Payload: { gross_potential_rent: null },
});
assert.equal(insufficientInputReconciliationState.status, "insufficient_inputs");
const alignedReconciliationState = buildSourceReconciliationState({
  computedRentRoll: { total_units: 20, total_in_place_annual: 1000000 },
  rentRollPayload: { total_units: 20, total_in_place_annual: 1000000 },
  t12Payload: { gross_potential_rent: 1000000 },
});
assert.equal(alignedReconciliationState.status, "aligned");

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

const acquisitionOnlyLoanTerms = {
  purchase_price: 10640000,
  ltv: 70,
  interest_rate: 5.25,
  amortization_years: 30,
  debt_basis: "acquisition_financing_assumption",
  derived_acquisition_loan_amount: 7448000,
};
const currentDebtNotAssessedState = buildCurrentDebtAssessmentState({
  loanTermSheetTermsPayload: acquisitionOnlyLoanTerms,
  t12Noi: 960000,
});
assert.equal(currentDebtNotAssessedState.current_debt_dscr_status, "not_assessed");
assert.equal(currentDebtNotAssessedState.acquisition_only_exclusion, true);

const currentDebtSectionHealedHtml = generatorTest.applyFinalSectionHealRenderGuards(
  [
    "<!-- BEGIN SECTION_7_REFI_STABILITY -->",
    '<p class="subsection-title">DSCR Sensitivity &amp; Coverage Threshold Analysis</p>',
    '<table><tr><td>Current Debt DSCR</td><td>1.42x</td></tr></table>',
    '<p class="subsection-title">Refinance Stress Test &amp; Binding Constraint Analysis</p><p>{{DEBT_REFI_CONSIDERATIONS}}</p>',
    '<p class="subsection-title">Current Debt Coverage &amp; Constraint Sensitivity</p>{{REFI_SENSITIVITY_MATRIX_BLOCK}}',
    '<div><p class="subsection-title">Maximum Financing Envelope (Standardized Framework)</p><p>Debt balance 8750000</p></div>',
    "<!-- END SECTION_7_REFI_STABILITY -->",
  ].join("\n"),
  {
    effectiveReportMode: "v1_core",
    reportType: "underwriting",
    currentDebtAssessmentState: currentDebtNotAssessedState,
    loanTermSheetTermsPayload: acquisitionOnlyLoanTerms,
    t12Payload: { net_operating_income: 960000 },
  }
);
assert.equal(
  /Current Debt DSCR|DSCR Sensitivity|Refinance Proceeds|Maximum Financing Envelope/i.test(currentDebtSectionHealedHtml),
  false
);
assert.equal(
  currentDebtSectionHealedHtml.length === 0 || /not assessed/i.test(currentDebtSectionHealedHtml),
  true
);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: healQaArtifacts,
    sourceReportCoverageQa: healQaCoverage,
    html: currentDebtSectionHealedHtml,
  }).violations.some((v) =>
    [
      "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
      "UNSUPPORTED_CURRENT_DEBT_RENDERED",
      "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
      "REPORT_TYPE_SECTION_LEAK",
    ].includes(v.code)
  ),
  false
);

const acquisitionMemoHealedHtml = generatorTest.applyFinalSectionHealRenderGuards(
  [
    "<!-- BEGIN SECTION_3_SCENARIO -->",
    "<section>Scenario Analysis & Five-Year Outlook</section>",
    "<!-- END SECTION_3_SCENARIO -->",
    "<!-- BEGIN SECTION_7_DEBT -->",
    "<section>Debt Structure & Financing</section>",
    "<!-- END SECTION_7_DEBT -->",
    "<!-- BEGIN SECTION_9_DCF -->",
    "<section>Discounted Cash Flow (DCF)</section>",
    "<!-- END SECTION_9_DCF -->",
    "<!-- BEGIN SECTION_10_ADV_MODEL -->",
    "<section>Advanced Financial Modeling</section>",
    "<!-- END SECTION_10_ADV_MODEL -->",
    "<!-- BEGIN SECTION_CHART_EQUITY_COMPONENTS -->",
    "<section>Equity Cash Flow Waterfall</section>",
    "<!-- END SECTION_CHART_EQUITY_COMPONENTS -->",
  ].join("\n"),
  {
    effectiveReportMode: "v1_core",
    reportType: "underwriting",
  }
);
assert.equal(
  /Scenario Analysis|Five-Year Outlook|Debt Structure|Debt Financing|Discounted Cash Flow|Advanced Financial Modeling|Equity Cash Flow Waterfall/i.test(acquisitionMemoHealedHtml),
  false
);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: healQaArtifacts,
    sourceReportCoverageQa: healQaCoverage,
    html: acquisitionMemoHealedHtml,
  }).violations.some((v) =>
    [
      "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
      "REPORT_TYPE_SECTION_LEAK",
      "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
    ].includes(v.code)
  ),
  false
);

const underwritingLeakHealedHtml = generatorTest.applyFinalSectionHealRenderGuards(
  [
    "<!-- BEGIN SECTION_S2_INCOME_FORENSICS -->",
    "<p>Income Forensics</p>",
    "<!-- END SECTION_S2_INCOME_FORENSICS -->",
    "<!-- BEGIN SECTION_S3_EXPENSE_STRUCTURE -->",
    "<p>Expense Structure</p>",
    "<!-- END SECTION_S3_EXPENSE_STRUCTURE -->",
  ].join("\n"),
  {
    effectiveReportMode: "v1_core",
    reportType: "underwriting",
  }
);
assert.equal(
  buildReportContractQa({
    reportType: "underwriting",
    reportTier: 2,
    artifacts: healQaArtifacts,
    sourceReportCoverageQa: healQaCoverage,
    html: underwritingLeakHealedHtml,
  }).violations.some((v) => v.code === "REPORT_TYPE_SECTION_LEAK"),
  false
);

const screeningLeakHealedHtml = generatorTest.applyFinalSectionHealRenderGuards(
  [
    "<!-- BEGIN SECTION_7_DEBT -->",
    "<p>Debt Structure</p>",
    "<p>Current Debt Coverage</p>",
    "<p>Refinance Stability Classification</p>",
    "<!-- END SECTION_7_DEBT -->",
  ].join("\n"),
  {
    effectiveReportMode: "screening_v1",
    reportType: "screening",
  }
);
assert.equal(/Debt Structure|Current Debt Coverage|Refinance Stability Classification/i.test(screeningLeakHealedHtml), false);
assert.equal(
  buildReportContractQa({
    reportType: "screening",
    reportTier: 2,
    artifacts: healQaArtifacts,
    sourceReportCoverageQa: healQaCoverage,
    html: screeningLeakHealedHtml,
  }).violations.some((v) => v.code === "SCREENING_UNDERWRITING_SECTION_LEAK"),
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
assert.match(reconciliationIncomeHtml, /Top Income Line Compared with EGI/);
assert.match(reconciliationIncomeHtml, /EGI is net of vacancy \/ credit-loss offsets/i);
assert.equal(reconciliationIncomeHtml.includes("Top Income Line Share of EGI"), false);

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

const summaryOnlyRentRollDistributionHtml = generatorTest.buildScreeningRentRollDistributionHtml({
  computedRentRoll: null,
  rentRollPayload: {
    method: "deterministic_text_summary",
    parse_branch: "rent_roll_text_summary_fallback",
    validated: true,
    units: [],
    unit_mix: [],
    total_units: 48,
    occupied_units: 46,
    occupancy: 0.9583,
    totals: {
      in_place_rent_monthly: 86400,
      in_place_rent_annual: 1036800,
      market_rent_monthly: 94800,
      market_rent_annual: 1137600,
      summary_row_detected: true,
    },
  },
  formatCurrency,
});
assert.match(summaryOnlyRentRollDistributionHtml, /Implied Avg In-Place Rent/);
assert.match(summaryOnlyRentRollDistributionHtml, /Implied Avg Market Rent/);
assert.match(summaryOnlyRentRollDistributionHtml, /Annual In-Place Rent \(Total\).*1,036,800/s);
assert.match(summaryOnlyRentRollDistributionHtml, /Annual Market Rent \(Total\).*1,137,600/s);
assert.equal(summaryOnlyRentRollDistributionHtml.includes("Weighted Avg In-Place Rent"), false);
assert.equal(summaryOnlyRentRollDistributionHtml.includes("Weighted Avg Market Rent"), false);
assert.equal(summaryOnlyRentRollDistributionHtml.includes("Rent Bands (In-Place)"), false);
assert.match(reportSource, /function buildRentPositioningSummaryCard/);
assert.match(reportSource, /function stripThinSectionPages/);

const rowLevelRentRollDistributionHtml = generatorTest.buildScreeningRentRollDistributionHtml({
  computedRentRoll: {
    total_units: 48,
    unit_mix: [{ unit_type: "1BR", count: 48, current_rent: 1668.75, market_rent: 1888 }],
    total_in_place_annual: 961200,
    total_market_annual: 1087488,
  },
  rentRollPayload: {
    total_units: 48,
    units: [{ unit: "101", in_place_rent: 1600, market_rent: 1850 }],
    unit_mix: [{ unit_type: "1BR", count: 48, current_rent: 1668.75, market_rent: 1888 }],
  },
  formatCurrency,
});
assert.match(rowLevelRentRollDistributionHtml, /Weighted Avg In-Place Rent/);
assert.match(rowLevelRentRollDistributionHtml, /Weighted Avg Market Rent/);
assert.match(rowLevelRentRollDistributionHtml, /Rent Bands \(In-Place\)/);
assert.match(reportSource, /Rent Positioning Summary/);
assert.equal(/InvestorIQ estimates are document-backed/i.test(reportSource), false);

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
const malformedRankedDriversHtml = "<!-- BEGIN EXEC_RANKED_DRIVERS --><ol><li>1. NOI Margin: 32.0% (trigger: <= 45.0% sensitized threshold breached)</li><li>3. : (trigger: )</li></ol><!-- END EXEC_RANKED_DRIVERS -->";
const sanitizedRankedDriversHtml = generatorTest.sanitizeScreeningRankedDriversHtml(malformedRankedDriversHtml);
assert.equal(/: \(trigger:\s*\)/i.test(sanitizedRankedDriversHtml), false);
assert.equal(/<li>\s*:\s*<\/li>|<li>\s*\(trigger:\s*\)\s*<\/li>/i.test(sanitizedRankedDriversHtml), false);
assert.match(sanitizedRankedDriversHtml, /NOI Margin: 32\.0%/i);

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

assert.match(acquisitionOnlyCoverageHtml, /CORE INPUT COVERAGE CONFIRMED/i);
assert.match(acquisitionOnlyCoverageHtml, /Core operating inputs \(T12 and Rent Roll\) were fully verified/i);
assert.match(acquisitionOnlyCoverageHtml, /Optional or support documents remain qualitative\/context-only/i);
assert.equal(acquisitionOnlyCoverageHtml.includes("mortgagePayload"), false);
assert.equal(/constrained|stressed|insufficient|shortfall/i.test(acquisitionOnlyCoverageHtml), false);

const publishedReportStoragePath = buildReportStoragePath({
  effectiveUserId: "user_123",
  reportSeed: "report_456",
});
assert.equal(publishedReportStoragePath, "user_123/report_456.pdf");
assert.equal(isValidReportStoragePath(publishedReportStoragePath), true);
assert.equal(isValidReportStoragePath("pending"), false);
assert.equal(isValidReportStoragePath(""), false);
assert.equal(isValidReportStoragePath("user_123/report_456.txt"), false);
assert.doesNotThrow(() =>
  assertValidReportPublicationInsert({
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
    assertValidReportPublicationInsert({
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
    assertValidReportPublicationInsert({
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
    assertValidReportPublicationInsert({
      storagePath: publishedReportStoragePath,
      reportType: "underwriting",
      deliveryGateStatus: "admin_review_required",
      holdDelivery: true,
      context: { jobId: "job-4" },
    }),
  /Report publication blocked before storage insert/i
);
assertPublicationGuardFailure(
  () =>
    assertValidReportPublicationInsert({
      storagePath: publishedReportStoragePath,
      reportType: "underwriting",
      deliveryGateStatus: "user_needs_documents",
      holdDelivery: false,
      context: { jobId: "job-5" },
    }),
  /Report publication blocked before storage insert/i
);
assertPublicationGuardFailure(
  () =>
    assertValidReportPublicationInsert({
      storagePath: publishedReportStoragePath,
      reportType: "underwriting",
      deliveryGateStatus: "deliverable",
      holdDelivery: true,
      context: { jobId: "job-6" },
    }),
  /Report publication blocked before storage insert/i
);
assertPublicationGuardFailure(
  () =>
    assertValidReportPublicationInsert({
      storagePath: "user_123/report_456.txt",
      reportType: "underwriting",
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
      context: { jobId: "job-7" },
    }),
  /Missing valid report storage path/i
);
assertPublicationGuardFailure(
  () =>
    assertValidReportPublicationInsert({
      storagePath: publishedReportStoragePath,
      reportType: "",
      deliveryGateStatus: "deliverable",
      holdDelivery: false,
      context: { jobId: "job-8" },
    }),
  /Missing report type/i
);
assert.doesNotThrow(() => {
  const validatedPath = assertValidReportPublicationInsert({
    storagePath: publishedReportStoragePath,
    reportType: "underwriting",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    context: { jobId: "job-9" },
  });
  assert.equal(validatedPath, publishedReportStoragePath);
});

const attackStyleSupportDocs = [
  {
    id: "a1",
    original_filename: "Stonebridge_Assumptions.pdf",
    doc_type: "environmental",
    semantic_doc_role: "environmental_due_diligence",
    parse_status: "parsed",
    source_text:
      "Purchase Assumptions / Proposed Acquisition Financing. Purchase price $13,500,000. NOI basis $945,000. Proposed loan $9,450,000. LTV 70%. Interest rate 5.95%. Amortization 30 years. Lender fee 0.85%.",
  },
  {
    id: "d1",
    original_filename: "Current_Debt_Stonebridge.pdf",
    doc_type: "supporting_documents_unclassified",
    semantic_doc_role: "other_support",
    parse_status: "parsed",
    source_text:
      "Existing Current Debt Statement. Current outstanding balance $6,800,000. Interest rate 4.85%. 24 years remaining. Monthly payment $39,250. Maturity 2029-11-01.",
  },
  {
    id: "r1",
    original_filename: "Stonebridge_Reno_Plan.pdf",
    doc_type: "rent_roll",
    semantic_doc_role: "rent_roll",
    parse_status: "parsed",
    source_text:
      "Structured Renovation / CapEx Plan. Total renovation budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225, Months 1-18. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325, Months 1-24. Common/exterior/contingency rows included.",
  },
  { id: "ap1", original_filename: "Stonebridge_Appraisal.pdf", doc_type: "appraisal", semantic_doc_role: "appraisal", parse_status: "parsed" },
  { id: "m1", original_filename: "Stonebridge_Market_Survey.pdf", doc_type: "market_survey", semantic_doc_role: "market_survey", parse_status: "parsed" },
  { id: "e1", original_filename: "Stonebridge_Phase_I_ESA.pdf", doc_type: "environmental", semantic_doc_role: "environmental_due_diligence", parse_status: "parsed" },
];
const attackStyleArtifacts = [
  {
    type: "appraisal_parsed",
    payload: {
      file_id: "a1",
      original_filename: "Stonebridge_Assumptions.pdf",
      semantic_doc_role: "appraisal",
      cap_rate: 0.0575,
    },
  },
  {
    type: "loan_term_sheet_parsed",
    payload: {
      file_id: "a1",
      original_filename: "Stonebridge_Assumptions.pdf",
      semantic_doc_role: "purchase_assumptions",
      purchase_price: 10640000,
      stated_acquisition_loan_amount: 7450000,
      ltv: 0.7,
      interest_rate: 0.0575,
      amortization_years: 30,
      lender_fee_percent: 0.01,
      going_in_cap_rate: 0.0575,
      noi_basis: 611800,
      source_text: "Proposed acquisition financing with purchase price, LTV, interest rate, amortization, and lender fee.",
    },
  },
  {
    type: "mortgage_statement_parsed",
    payload: {
      file_id: "d1",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "current_mortgage_statement",
      outstanding_balance: 8750000,
      interest_rate: 0.0525,
      amortization_years: 30,
      ltv: 0.7,
      source_text: "Existing current debt statement with outstanding principal balance.",
    },
  },
  {
    type: "renovation_parsed",
    payload: {
      file_id: "r1",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "renovation_budget",
      total_budget: 1138000,
      budget_rows: [
        { category: "1BR unit turns", unit_count: 18, cost_per_unit: 18000, expected_monthly_rent_lift: 225, phase_timing: "Months 1-18" },
        { category: "2BR unit turns", unit_count: 22, cost_per_unit: 22000, expected_monthly_rent_lift: 325, phase_timing: "Months 1-24" },
      ],
      timing_or_phasing: "Months 1-24",
      rent_lift: "1BR $225; 2BR $325",
    },
  },
  {
    type: "appraisal_parsed",
    payload: {
      file_id: "ap1",
      original_filename: "Stonebridge_Appraisal.pdf",
      semantic_doc_role: "appraisal",
      source_text: "Appraisal summary context only.",
    },
  },
  {
    type: "document_text_extracted",
    payload: {
      file_id: "m1",
      original_filename: "Stonebridge_Market_Survey.pdf",
      semantic_doc_role: "market_survey",
      source_text: "Market rent survey context only.",
    },
  },
  {
    type: "document_text_extracted",
    payload: {
      file_id: "e1",
      original_filename: "Stonebridge_Phase_I_ESA.pdf",
      semantic_doc_role: "environmental_due_diligence",
      source_text: "Phase I ESA environmental due diligence context.",
    },
  },
];
const rawTextFallbackSupportDocs = [
  {
    id: "a1",
    original_filename: "Stonebridge_Assumptions.pdf",
    doc_type: "environmental",
    semantic_doc_role: "environmental_due_diligence",
    parse_status: "parsed",
    source_text: "Purchase Assumptions / Proposed Acquisition Financing. Purchase price $13,500,000. NOI basis $945,000. Proposed loan $9,450,000. LTV 70%. Interest rate 5.95%. Amortization 30 years. Lender fee 0.85%.",
  },
  {
    id: "d1",
    original_filename: "Current_Debt_Stonebridge.pdf",
    doc_type: "supporting_documents_unclassified",
    semantic_doc_role: "other_support",
    parse_status: "parsed",
    source_text: "Existing Current Debt Statement. Current outstanding balance $6,800,000. Interest rate 4.85%. 24 years remaining. Monthly payment $39,250. Maturity 2029-11-01.",
  },
  {
    id: "r1",
    original_filename: "Stonebridge_Reno_Plan.pdf",
    doc_type: "rent_roll",
    semantic_doc_role: "rent_roll",
    parse_status: "parsed",
    source_text: "Structured Renovation / CapEx Plan. Total renovation budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225, Months 1-18. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325, Months 1-24. Common/exterior/contingency rows included.",
  },
];
assert.equal(buildSupportDocTaxonomyState({
  declaredDocType: "supporting_documents",
  originalFilename: "Stonebridge_Assumptions.pdf",
  rawText: rawTextFallbackSupportDocs[0].source_text,
  payload: {
    purchase_price: 13500000,
    going_in_cap_rate: 0.0595,
    noi_basis: 945000,
    stated_acquisition_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
}).semantic_doc_role, "purchase_assumptions");
assert.equal(buildSupportDocTaxonomyState({
  declaredDocType: "supporting_documents",
  originalFilename: "Current_Debt_Stonebridge.pdf",
  rawText: rawTextFallbackSupportDocs[1].source_text,
  payload: {
    outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_years: 24,
    monthly_payment: 39250,
  },
}).semantic_doc_role, "current_mortgage_statement");
assert.match(buildSupportDocTaxonomyState({
  declaredDocType: "supporting_documents",
  originalFilename: "Stonebridge_Reno_Plan.pdf",
  rawText: rawTextFallbackSupportDocs[2].source_text,
  payload: {
    total_budget: 1280000,
    budget_rows: [
      { category: "1BR unit turns", unit_count: 18, cost_per_unit: 18000, expected_monthly_rent_lift: 225, phase_timing: "Months 1-18" },
      { category: "2BR unit turns", unit_count: 22, cost_per_unit: 22000, expected_monthly_rent_lift: 325, phase_timing: "Months 1-24" },
    ],
    timing_or_phasing: "Months 1-24",
  },
}).semantic_doc_display_label || "", /Structured Renovation \/ CapEx Plan/i);

const sovereignCurrentDebtAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Current_Debt_Stonebridge.pdf",
  rawText: "Existing Current Debt Statement. Current Outstanding Balance $6,800,000. Interest rate 4.85%. 24 years remaining. Monthly payment $39,250. Maturity 2029-11-01.",
  payload: {
    outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_years: 24,
    monthly_payment: 39250,
  },
});
assert.equal(sovereignCurrentDebtAuthority.role, "current_debt_context");
assert.equal(sovereignCurrentDebtAuthority.authoritySource, "explicit_keyword");
assert.equal(sovereignCurrentDebtAuthority.confidence, 1);
assert.equal(sovereignCurrentDebtAuthority.outstanding_balance, 6800000);

const sovereignRenovationAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Stonebridge_Reno_Plan.pdf",
  rawText: "Structured Renovation / CapEx Plan. Total Renovation Budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225, Months 1-18. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325, Months 1-24. Common/exterior/contingency rows included.",
  payload: {
    total_budget: 1280000,
    budget_rows: [
      { category: "1BR", total_cost: 324000, expected_monthly_rent_lift: 225 },
    ],
    execution_rows: [
      { phase_timing: "Months 1-18", expected_monthly_rent_lift: 225 },
    ],
  },
});
assert.equal(sovereignRenovationAuthority.role, "structured_renovation");
assert.equal(sovereignRenovationAuthority.authoritySource, "explicit_keyword");
assert.equal(sovereignRenovationAuthority.confidence, 1);
assert.equal(sovereignRenovationAuthority.total_budget, 1280000);

const sovereignPurchaseAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Stonebridge_Assumptions.pdf",
  rawText: "Purchase Assumptions / Proposed Acquisition Financing. Purchase Price $13,500,000. NOI Basis $945,000. Proposed loan $9,450,000. LTV 70%. Interest rate 5.95%. Amortization 30 years. Lender fee 0.85%. Going-In Cap Reference 7.00%.",
  payload: {
    purchase_price: 13500000,
    going_in_cap_rate: 0.07,
    noi_basis: 945000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
});
assert.equal(sovereignPurchaseAuthority.role, "purchase_assumptions");
assert.equal(sovereignPurchaseAuthority.authoritySource, "explicit_keyword");
assert.equal(sovereignPurchaseAuthority.confidence, 1);
assert.equal(sovereignPurchaseAuthority.purchase_price, 13500000);
const supportDocAuthorityRows = generatorTest.buildCanonicalSupportDocAuthorityRows({
  documentSources: attackStyleSupportDocs,
  artifacts: attackStyleArtifacts,
});
assert.equal(supportDocAuthorityRows.filter((row) => row.original_filename === "Stonebridge_Assumptions.pdf").length, 1);
assert.match(
  supportDocAuthorityRows.find((row) => row.original_filename === "Stonebridge_Assumptions.pdf")?.canonical_support_doc_role || "",
  /purchase_assumptions|proposed_acquisition_financing/i
);
assert.equal(
  supportDocAuthorityRows.find((row) => row.original_filename === "Current_Debt_Stonebridge.pdf")?.canonical_support_doc_role,
  "current_debt_context"
);
assert.match(
  supportDocAuthorityRows.find((row) => row.original_filename === "Stonebridge_Reno_Plan.pdf")?.canonical_support_doc_role || "",
  /renovation|capex/i
);
const attackDocumentTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: attackStyleSupportDocs,
  supportDocAuthorityRows,
  canonicalSupportDocMap: new Map([
    ["Stonebridge_Assumptions.pdf", { ...sovereignPurchaseAuthority, originalFilename: "Stonebridge_Assumptions.pdf" }],
    ["Current_Debt_Stonebridge.pdf", { ...sovereignCurrentDebtAuthority, originalFilename: "Current_Debt_Stonebridge.pdf" }],
    ["Stonebridge_Reno_Plan.pdf", { ...sovereignRenovationAuthority, originalFilename: "Stonebridge_Reno_Plan.pdf" }],
    ["Stonebridge_Appraisal.pdf", { role: "appraisal", displayLabel: "Appraisal Context", treatment: "Context only", use: "Listed for auditability only; not used quantitatively.", originalFilename: "Stonebridge_Appraisal.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Market_Survey.pdf", { role: "market_survey", displayLabel: "Market Rent Context", treatment: "Context only", use: "Market/rent context only; does not override Rent Roll market rent.", originalFilename: "Stonebridge_Market_Survey.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Phase_I_ESA.pdf", { role: "environmental_due_diligence", displayLabel: "Environmental Due Diligence Context", treatment: "Context only", use: "Environmental due-diligence context only; no quantitative model impact.", originalFilename: "Stonebridge_Phase_I_ESA.pdf", category: "Listed but Not Quantitatively Modeled" }],
  ]),
  renderedDocumentTreatmentRowsOut: [],
});
assert.match(attackDocumentTreatmentHtml, /Stonebridge_Assumptions\.pdf[\s\S]{0,220}Purchase Assumptions \/ Acquisition Context/i);
assert.equal(/Stonebridge_Assumptions\.pdf[\s\S]{0,220}Environmental/i.test(attackDocumentTreatmentHtml), false);
assert.equal(/Stonebridge_Assumptions\.pdf[\s\S]{0,220}Appraisal Context/i.test(attackDocumentTreatmentHtml), false);
assert.match(attackDocumentTreatmentHtml, /Current_Debt_Stonebridge\.pdf[\s\S]{0,220}Debt Support Received \/ Contextual/i);
assert.equal(/Current_Debt_Stonebridge\.pdf[\s\S]{0,220}Purchase Assumptions/i.test(attackDocumentTreatmentHtml), false);
assert.match(attackDocumentTreatmentHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,240}Structured Renovation \/ CapEx Plan/i);
assert.equal(/Stonebridge_Reno_Plan\.pdf[\s\S]{0,220}Rent Roll/i.test(attackDocumentTreatmentHtml), false);
assert.match(attackDocumentTreatmentHtml, /Stonebridge_Appraisal\.pdf[\s\S]{0,220}Appraisal Context/i);
assert.match(attackDocumentTreatmentHtml, /Stonebridge_Market_Survey\.pdf[\s\S]{0,220}Market Rent Context/i);
assert.match(attackDocumentTreatmentHtml, /Stonebridge_Phase_I_ESA\.pdf[\s\S]{0,220}Environmental Due Diligence Context/i);
const rawTextFallbackTreatmentHtml = generatorTest.buildDocumentTreatmentSummaryHtml({
  reportMode: "v1_core",
  documentSources: rawTextFallbackSupportDocs,
});
assert.match(rawTextFallbackTreatmentHtml, /Stonebridge_Assumptions\.pdf[\s\S]{0,220}Purchase Assumptions \/ Acquisition Context/i);
assert.equal(/Stonebridge_Assumptions\.pdf[\s\S]{0,220}Environmental/i.test(rawTextFallbackTreatmentHtml), false);
assert.match(rawTextFallbackTreatmentHtml, /Current_Debt_Stonebridge\.pdf[\s\S]{0,220}Debt Support Received \/ Contextual/i);
assert.equal(/Current_Debt_Stonebridge\.pdf[\s\S]{0,220}Other Support Document/i.test(rawTextFallbackTreatmentHtml), false);
assert.match(rawTextFallbackTreatmentHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,240}Structured Renovation \/ CapEx Plan/i);
assert.equal(/Stonebridge_Reno_Plan\.pdf[\s\S]{0,220}Other Support Document/i.test(rawTextFallbackTreatmentHtml), false);
const attackPrelimHtml = generatorTest.buildPreliminaryFinancingReadinessSummaryHtml({
  reportMode: "v1_core",
  acquisitionMemoRenderContext: {
    units: 100,
    annualInPlaceRent: 1000000,
    annualMarketRent: 1100000,
    annualRentUpside: 100000,
    rentGapPercent: 0.1,
    egi: 950000,
    opEx: 338200,
    noi: 611800,
    purchasePrice: null,
    goingInCapRate: null,
    acquisitionNoiBasis: 611800,
  },
  supportDocAuthorityRows,
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true, has_total_units: true },
    },
  },
  formatCurrency,
  formatPercent1,
  formatInterestRatePercent: formatPercent1,
});
assert.match(attackPrelimHtml, /Purchase assumptions provided[\s\S]{0,80}Yes/i);
assert.match(attackPrelimHtml, /Current debt context uploaded[\s\S]{0,80}Yes/i);
assert.match(attackPrelimHtml, /Proposed acquisition loan terms complete[\s\S]{0,80}Yes/i);
assert.match(attackPrelimHtml, /Uploaded Existing Debt Context[\s\S]{0,220}Outstanding Balance[\s\S]{0,80}\$6,800,000/i);
assert.match(attackPrelimHtml, /CapEx \/ renovation plan[\s\S]{0,120}Context only unless verified budget and rent-lift assumptions exist/i);
const attackAcquisitionFinancingHtml = generatorTest.buildAcquisitionFinancingReadinessHtml({
  reportMode: "v1_core",
  supportDocAuthorityRows,
});
assert.match(attackAcquisitionFinancingHtml, /Proposed Acquisition Financing Context/i);
assert.match(attackAcquisitionFinancingHtml, /Proposed Loan Amount[\s\S]{0,80}\$7,450,000/i);
assert.match(attackAcquisitionFinancingHtml, /Interest Rate[\s\S]{0,80}5\.75%/i);
assert.equal(/Current Debt DSCR|refinance proceeds|waterfall|deal score|final recommendation|BUY|SELL|HOLD/i.test(attackAcquisitionFinancingHtml), false);
const attackRenderHarnessRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    ...fullRenderHarnessRequest.body,
    userId: "user_stonebridge_render_smoke",
    property_name: "Stonebridge",
    __test_payloads: {
      ...fullRenderHarnessRequest.body.__test_payloads,
      t12Payload: {
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
        gross_potential_rent: 1850000,
        gross_scheduled_rent: 1850000,
      },
      rentRollPayload: {
        total_units: 48,
        occupied_units: 44,
        vacant_units: 4,
        total_annual_in_place: 1000000,
        total_annual_market: 1100800,
        rent_to_market_gap: 0.0961538462,
      },
      acquisitionTermsPayload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 13500000,
        going_in_cap_rate: 0.07,
        noi_basis: 945000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
        source_text: "Purchase assumptions / acquisition context for lender discussion only.",
      },
      loanTermSheetTermsPayload: {
        debt_basis: "current_debt_context",
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_years: 24,
        monthly_payment: 39250,
        source_text: "Current debt support for lender discussion only.",
      },
      mortgagePayload: {
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amort_years: 24,
        monthly_payment: 39250,
        ltv: 0.7,
      },
      propertyTaxPayload: {
        annual_tax: 24000,
        original_filename: "Property_Tax_Support.pdf",
      },
      documentSources: attackStyleSupportDocs,
      coverageArtifacts: attackStyleArtifacts,
    },
  },
};
const attackRenderHarnessResponse = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return payload;
  },
};
await generateClientReport(attackRenderHarnessRequest, attackRenderHarnessResponse);
assert.equal(attackRenderHarnessResponse.statusCode, 200);
assert.equal(attackRenderHarnessResponse.body?.success, true);
const attackRenderHtml = String(attackRenderHarnessResponse.body?.final_html || "");
assert.match(attackRenderHtml, /Current_Debt_Stonebridge\.pdf/i);
assert.match(attackRenderHtml, /Debt Support Received \/ Contextual/i);
assert.match(attackRenderHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,240}Structured Renovation \/ CapEx Plan/i);
assert.match(attackRenderHtml, /Stonebridge_Assumptions\.pdf[\s\S]{0,220}Purchase Assumptions \/ Acquisition Context/i);
assert.match(attackRenderHtml, /Stonebridge_Appraisal\.pdf[\s\S]{0,220}Appraisal Context/i);
assert.match(attackRenderHtml, /Stonebridge_Market_Survey\.pdf[\s\S]{0,220}Market Rent Context/i);
assert.match(attackRenderHtml, /Stonebridge_Phase_I_ESA\.pdf[\s\S]{0,220}Environmental Due Diligence Context/i);
assert.match(attackRenderHtml, /Current debt context uploaded<\/td><td[^>]*>Yes<\/td>/i);
assert.equal(/No verified current debt context was provided/i.test(attackRenderHtml), false);
assert.equal(/Current_Debt_Stonebridge\.pdf[\s\S]{0,300}Purchase Assumptions \/ Acquisition Context/i.test(attackRenderHtml), false);
assert.equal(/Current debt context uploaded<\/td><td[^>]*>No/i.test(attackRenderHtml), false);
assert.equal(/No verified forward-looking renovation budget was provided/i.test(attackRenderHtml), false);
assert.equal(/Stonebridge_Reno_Plan\.pdf[\s\S]{0,300}Other Support Document/i.test(attackRenderHtml), false);
assert.equal(/No verified forward-looking renovation budget/i.test(attackRenderHtml), false);
}

const retest4ShapeSupportDocs = [
  {
    id: "sb-assumptions",
    original_filename: "Stonebridge_Assumptions.pdf",
    doc_type: "supporting_documents_unclassified",
    semantic_doc_role: "purchase_assumptions",
    parse_status: "parsed",
    source_text: "Purchase Assumptions / Proposed Acquisition Financing. Purchase price $13,500,000. NOI basis $945,000. Proposed loan $9,450,000. LTV 70%. Interest rate 5.95%. Amortization 30 years. Lender fee 0.85%.",
  },
  {
    id: "sb-current-debt",
    original_filename: "Current_Debt_Stonebridge.pdf",
    doc_type: "supporting_documents_unclassified",
    semantic_doc_role: "purchase_assumptions",
    debt_basis: "acquisition_financing_assumption",
    parse_status: "parsed",
    source_text: "Current debt support. Existing/current debt context. Current outstanding balance $6,800,000. Interest rate 4.85%. Amortization remaining 24 years. Monthly payment $39,250. Maturity date 2029-11-01. Keep this document separate from Stonebridge_Assumptions.pdf proposed acquisition financing.",
  },
  {
    id: "sb-reno-plan",
    original_filename: "Stonebridge_Reno_Plan.pdf",
    doc_type: "rent_roll",
    semantic_doc_role: "rent_roll",
    parse_status: "parsed",
    source_text: "Structured Renovation / CapEx Plan. Total Renovation Budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325. Phasing Months 1-24. Common/exterior/contingency rows included.",
  },
];
const retest4ShapeArtifacts = [
  {
    type: "document_text_extracted",
    payload: {
      file_id: "sb-current-debt",
      original_filename: "Current_Debt_Stonebridge.pdf",
      text: "Existing Current Debt Statement. This is an existing/current debt context document. Current Outstanding Balance $6,800,000. Interest Rate 4.85%. Amortization Remaining 24 years. Monthly Payment $39,250. Maturity Date 2029-11-01. Keep this document separate from Stonebridge_Assumptions.pdf proposed acquisition financing.",
      excerpt: "Existing Current Debt Statement. This is an existing/current debt context document. Current Outstanding Balance $6,800,000.",
    },
  },
  {
    type: "loan_term_sheet_parsed",
    payload: {
      file_id: "sb-current-debt",
      original_filename: "Current_Debt_Stonebridge.pdf",
      semantic_doc_role: "purchase_assumptions",
      debt_basis: "acquisition_financing_assumption",
      outstanding_balance: 6800000,
      interest_rate: 0.0485,
      amortization_years: 24,
      monthly_payment: 39250,
    },
  },
  {
    type: "document_text_extracted",
    payload: {
      file_id: "sb-reno-plan",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      text: "Structured Renovation / CapEx Plan. Total Renovation Budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325. Phasing Months 1-24. Common/exterior/contingency rows included.",
      excerpt: "Structured Renovation / CapEx Plan. Total Renovation Budget $1,280,000.",
    },
  },
  {
    type: "rent_roll_parsed",
    payload: {
      file_id: "sb-reno-plan",
      original_filename: "Stonebridge_Reno_Plan.pdf",
      semantic_doc_role: "rent_roll",
      budget_rows: [
        { category: "1BR unit turns", unit_count: 18, cost_per_unit: 18000, expected_monthly_rent_lift: 225, phase_timing: "Months 1-18" },
        { category: "2BR unit turns", unit_count: 22, cost_per_unit: 22000, expected_monthly_rent_lift: 325, phase_timing: "Months 1-24" },
      ],
      total_budget: 1280000,
      timing_or_phasing: "Months 1-24",
    },
  },
];
const retest4SovereignRows = generatorTest.buildCanonicalSupportDocAuthorityRows({
  documentSources: retest4ShapeSupportDocs,
  artifacts: retest4ShapeArtifacts,
});
assert.equal(
  retest4SovereignRows.find((row) => row.original_filename === "Current_Debt_Stonebridge.pdf")?.canonical_support_doc_role,
  "current_debt_context"
);
assert.equal(
  retest4SovereignRows.find((row) => row.original_filename === "Stonebridge_Reno_Plan.pdf")?.canonical_support_doc_role,
  "structured_renovation_capex_plan"
);
const retest4RenderRequest = {
  headers: {
    "x-admin-run-key": process.env.ADMIN_RUN_KEY,
  },
  body: {
    userId: "user_stonebridge_render_smoke",
    report_type: "underwriting",
    property_name: "Stonebridge",
    __test_enable_acq_memo_v2_source_authority: true,
    __test_return_final_html: true,
    __test_payloads: {
      t12Payload: {
        effective_gross_income: 1100000,
        total_operating_expenses: 450000,
        net_operating_income: 650000,
        gross_potential_rent: 1850000,
        gross_scheduled_rent: 1850000,
      },
      rentRollPayload: {
        total_units: 48,
        occupied_units: 44,
        vacant_units: 4,
        total_annual_in_place: 1000000,
        total_annual_market: 1100800,
        rent_to_market_gap: 0.0961538462,
      },
      acquisitionTermsPayload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 13500000,
        going_in_cap_rate: 0.07,
        noi_basis: 945000,
        ltv: 0.7,
        interest_rate: 0.0595,
        amortization_years: 30,
        lender_fee_percent: 0.0085,
        source_text: "Purchase assumptions / acquisition context for lender discussion only.",
      },
      loanTermSheetTermsPayload: {
        debt_basis: "current_debt_context",
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amortization_years: 24,
        monthly_payment: 39250,
        source_text: "Current debt support for lender discussion only.",
      },
      mortgagePayload: {
        outstanding_balance: 6800000,
        interest_rate: 0.0485,
        amort_years: 24,
        monthly_payment: 39250,
        ltv: 0.7,
      },
      propertyTaxPayload: {
        annual_tax: 24000,
        original_filename: "Property_Tax_Support.pdf",
      },
      documentSources: retest4ShapeSupportDocs,
      coverageArtifacts: retest4ShapeArtifacts,
    },
  },
};
const retest4RenderResponse = {
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return payload;
  },
};
const previousAcqMemoV2SourceAuthority = process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY;
process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY = "true";
try {
  await generateClientReport(retest4RenderRequest, retest4RenderResponse);
} finally {
  if (previousAcqMemoV2SourceAuthority == null) {
    delete process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY;
  } else {
    process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY = previousAcqMemoV2SourceAuthority;
  }
}
assert.equal(retest4RenderResponse.statusCode, 200);
assert.equal(retest4RenderResponse.body?.success, true);
const retest4RenderHtml = String(retest4RenderResponse.body?.final_html || "");
assert.match(retest4RenderHtml, /Current_Debt_Stonebridge\.pdf[\s\S]{0,2000}Debt Support Received \/ Contextual/i);
assert.match(retest4RenderHtml, /Current debt context uploaded<\/td><td[^>]*>Yes<\/td>/i);
assert.match(retest4RenderHtml, /Stonebridge_Reno_Plan\.pdf[\s\S]{0,300}Structured Renovation \/ CapEx Plan/i);
assert.equal(/No verified current debt context was provided/i.test(retest4RenderHtml), false);
assert.equal(/Current debt context uploaded<\/td><td[^>]*>No/i.test(retest4RenderHtml), false);
assert.equal(/Current_Debt_Stonebridge\.pdf[\s\S]{0,300}Purchase Assumptions \/ Acquisition Context/i.test(retest4RenderHtml), false);
assert.equal(/Current_Debt_Stonebridge\.pdf[\s\S]{0,300}Other Support Document/i.test(retest4RenderHtml), false);
assert.equal(/Stonebridge_Reno_Plan\.pdf[\s\S]{0,300}Other Support Document/i.test(retest4RenderHtml), false);
assert.equal(/No verified forward-looking renovation budget/i.test(retest4RenderHtml), false);
assert.equal(/Stonebridge_Reno_Plan\.pdf[\s\S]{0,300}rent-roll parse\/recovery/i.test(retest4RenderHtml), false);
const attackPrelimHtml = retest4RenderHtml;
const attackAcquisitionFinancingHtml = retest4RenderHtml;
const attackDocumentTreatmentHtml = retest4RenderHtml;
const attackContractSupportDocAuthorityRows = retest4SovereignRows;
const attackContractSovereignCurrentDebtAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Current_Debt_Stonebridge.pdf",
  rawText: "Existing Current Debt Statement. Current Outstanding Balance $6,800,000. Interest rate 4.85%. 24 years remaining. Monthly payment $39,250. Maturity 2029-11-01.",
  payload: {
    outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_years: 24,
    monthly_payment: 39250,
  },
});
const attackContractSovereignRenovationAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Stonebridge_Reno_Plan.pdf",
  rawText: "Structured Renovation / CapEx Plan. Total Renovation Budget $1,280,000. 1BR scope 18 units at $18,000/unit with expected monthly rent lift $225. 2BR scope 22 units at $22,000/unit with expected monthly rent lift $325. Common/exterior/contingency rows included.",
  payload: {
    total_budget: 1280000,
    budget_rows: [
      { category: "1BR", total_cost: 324000, expected_monthly_rent_lift: 225 },
    ],
    execution_rows: [
      { phase_timing: "Months 1-18", expected_monthly_rent_lift: 225 },
    ],
  },
});
const attackContractSovereignPurchaseAuthority = resolveCanonicalSupportDocAuthority({
  originalFilename: "Stonebridge_Assumptions.pdf",
  rawText: "Purchase Assumptions / Proposed Acquisition Financing. Purchase Price $13,500,000. NOI Basis $945,000. Proposed loan $9,450,000. LTV 70%. Interest rate 5.95%. Amortization 30 years. Lender fee 0.85%. Going-In Cap Reference 7.00%.",
  payload: {
    purchase_price: 13500000,
    going_in_cap_rate: 0.07,
    noi_basis: 945000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
});
const attackContractSourceTreatmentTableHtml = `
  <div>
    <p class="subsection-title">Source Treatment / Quantitative Use</p>
    <table>
      <tbody>
        <tr><td>Stonebridge_Assumptions.pdf</td><td>Purchase Assumptions / Acquisition Context</td><td>Acquisition context / document-derived acquisition context</td><td>Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth.</td></tr>
        <tr><td>Current_Debt_Stonebridge.pdf</td><td>Debt Support Received / Contextual</td><td>Debt support received / contextual or deferred</td><td>Uploaded existing/current debt context only; not proposed acquisition financing.</td></tr>
        <tr><td>Stonebridge_Reno_Plan.pdf</td><td>Structured Renovation / CapEx Plan</td><td>Structured renovation / CapEx context</td><td>Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled.</td></tr>
      </tbody>
    </table>
  </div>
`;
const attackContractHtml = `${attackContractSourceTreatmentTableHtml}${attackPrelimHtml}${attackAcquisitionFinancingHtml}${attackDocumentTreatmentHtml}`;
const attackContractQa = buildReportContractQa({
  html: attackContractHtml,
  reportType: "underwriting",
  reportMode: "v1_core",
  sourceReportCoverageQa: {
    support_document_authority_rows: attackContractSupportDocAuthorityRows,
    document_treatment_canonical_rows: attackContractSupportDocAuthorityRows,
  },
  canonicalSupportDocMap: new Map([
    ["Stonebridge_Assumptions.pdf", { ...attackContractSovereignPurchaseAuthority, originalFilename: "Stonebridge_Assumptions.pdf" }],
    ["Current_Debt_Stonebridge.pdf", { ...attackContractSovereignCurrentDebtAuthority, originalFilename: "Current_Debt_Stonebridge.pdf" }],
    ["Stonebridge_Reno_Plan.pdf", { ...attackContractSovereignRenovationAuthority, originalFilename: "Stonebridge_Reno_Plan.pdf" }],
    ["Stonebridge_Appraisal.pdf", { role: "appraisal", displayLabel: "Appraisal Context", treatment: "Context only", use: "Listed for auditability only; not used quantitatively.", originalFilename: "Stonebridge_Appraisal.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Market_Survey.pdf", { role: "market_survey", displayLabel: "Market Rent Context", treatment: "Context only", use: "Market/rent context only; does not override Rent Roll market rent.", originalFilename: "Stonebridge_Market_Survey.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Phase_I_ESA.pdf", { role: "environmental_due_diligence", displayLabel: "Environmental Due Diligence Context", treatment: "Context only", use: "Environmental due-diligence context only; no quantitative model impact.", originalFilename: "Stonebridge_Phase_I_ESA.pdf", category: "Listed but Not Quantitatively Modeled" }],
  ]),
  renderedDocumentTreatmentRows: [
    { filename: "Stonebridge_Assumptions.pdf", displayLabel: "Purchase Assumptions / Acquisition Context", treatment: "Acquisition context / document-derived acquisition context", use: "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth." },
    { filename: "Current_Debt_Stonebridge.pdf", displayLabel: "Debt Support Received / Contextual", treatment: "Debt support received / contextual or deferred", use: "Uploaded existing/current debt context only; not proposed acquisition financing." },
    { filename: "Stonebridge_Reno_Plan.pdf", displayLabel: "Structured Renovation / CapEx Plan", treatment: "Structured renovation / CapEx context", use: "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled." },
  ],
});
assert.equal(
  attackContractQa.violations.some((violation) =>
    ["SUPPORT_DOC_AUTHORITY_DRIFT", "PURCHASE_ASSUMPTIONS_ROLE_DRIFT"].includes(violation.code)
  ),
  false
);
const contradictoryContractQa = buildReportContractQa({
  html: attackDocumentTreatmentHtml,
  reportType: "underwriting",
  reportMode: "v1_core",
  sourceReportCoverageQa: {
    support_document_authority_rows: attackContractSupportDocAuthorityRows,
    document_treatment_canonical_rows: attackContractSupportDocAuthorityRows,
  },
  canonicalSupportDocMap: new Map([
    ["Stonebridge_Assumptions.pdf", { ...attackContractSovereignPurchaseAuthority, originalFilename: "Stonebridge_Assumptions.pdf" }],
    ["Current_Debt_Stonebridge.pdf", { ...attackContractSovereignCurrentDebtAuthority, originalFilename: "Current_Debt_Stonebridge.pdf" }],
    ["Stonebridge_Reno_Plan.pdf", { ...attackContractSovereignRenovationAuthority, originalFilename: "Stonebridge_Reno_Plan.pdf" }],
    ["Stonebridge_Appraisal.pdf", { role: "appraisal", displayLabel: "Appraisal Context", treatment: "Context only", use: "Listed for auditability only; not used quantitatively.", originalFilename: "Stonebridge_Appraisal.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Market_Survey.pdf", { role: "market_survey", displayLabel: "Market Rent Context", treatment: "Context only", use: "Market/rent context only; does not override Rent Roll market rent.", originalFilename: "Stonebridge_Market_Survey.pdf", category: "Listed but Not Quantitatively Modeled" }],
    ["Stonebridge_Phase_I_ESA.pdf", { role: "environmental_due_diligence", displayLabel: "Environmental Due Diligence Context", treatment: "Context only", use: "Environmental due-diligence context only; no quantitative model impact.", originalFilename: "Stonebridge_Phase_I_ESA.pdf", category: "Listed but Not Quantitatively Modeled" }],
  ]),
  renderedDocumentTreatmentRows: [
    { filename: "Stonebridge_Assumptions.pdf", displayLabel: "Environmental Due Diligence Context", treatment: "Context only", use: "Listed for auditability only; not used quantitatively." },
  ],
});
assert.equal(
  contradictoryContractQa.violations.some((violation) => violation.code === "DOCUMENT_TREATMENT_CONTRADICTS_CANONICAL_AUTHORITY" && violation.blocks_acquisition_memo_launch_ready === true && violation.blocks_customer_delivery === false),
  true
);
const tamperedChecklistHtml = `${attackPrelimHtml}${attackAcquisitionFinancingHtml}${attackDocumentTreatmentHtml}`
  .replace(/Purchase assumptions provided<\/td><td style="font-weight:600;">Yes/i, "Purchase assumptions provided</td><td style=\"font-weight:600;\">No")
  .replace(/Current debt context uploaded<\/td><td style="font-weight:600;">Yes/i, "Current debt context uploaded</td><td style=\"font-weight:600;\">No")
  .replace(
    /Structured Renovation \/ CapEx Plan/i,
    "No verified forward-looking renovation budget was provided"
  );
const tamperedChecklistQa = buildReportContractQa({
  html: tamperedChecklistHtml,
  reportType: "underwriting",
  reportMode: "v1_core",
  sourceReportCoverageQa: {
    support_document_authority_rows: attackContractSupportDocAuthorityRows,
    document_treatment_canonical_rows: attackContractSupportDocAuthorityRows,
  },
});
assert.equal(
  tamperedChecklistQa.violations.some((violation) =>
    [
      "PURCHASE_ASSUMPTIONS_CHECKLIST_CONTRADICTION",
      "CURRENT_DEBT_DOCUMENT_TREATMENT_CONTRADICTION",
      "RENOVATION_DOCUMENT_TREATMENT_CONTRADICTION",
      "ACQUISITION_FINANCING_READINESS_MISSING",
    ].includes(violation.code)
  ),
  true
);

console.log("generate-client-report rent-roll smoke PASS");
