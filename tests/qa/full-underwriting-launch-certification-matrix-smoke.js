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
      occupancy: 0.95,
    },
  },
];

const baseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true, unit_count: 10, occupancy: 0.95 },
  },
};

// CLEAN_CURRENT_DEBT
const cleanCurrentDebt = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.06,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    "<p>Current debt coverage was assessed from verified current debt inputs.</p>",
    "<p>Debt Structure Summary</p>",
    "<p>Current Debt DSCR: 1.06x</p>",
    "<p>DSCR sensitivity: +100 bps stress remains above 1.00x.</p>",
  ].join("\n"),
});
assert.equal(cleanCurrentDebt.customer_delivery_ready, true);
assert.equal(
  cleanCurrentDebt.violations.some((v) => v.code === "REFI_NOT_ASSESSED_COPY_CONTRADICTS_CURRENT_DEBT_RENDER"),
  false
);

// ACQUISITION_ONLY
const acquisitionOnly = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: [
    ...baseArtifacts,
    {
      type: "loan_term_sheet_parsed",
      payload: {
        debt_basis: "acquisition_financing_assumption",
        purchase_price: 2100000,
        derived_acquisition_loan_amount: 840000,
      },
    },
  ],
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "not_assessed",
      has_true_current_debt_balance: false,
      current_debt_limitation_reason_code: "acquisition_only_not_current_debt",
    },
  },
  html: [
    "<p>Proposed acquisition financing is shown separately and is not current outstanding debt.</p>",
    "<p>Proposed Acquisition Debt Sizing</p>",
    "<p>Derived Acquisition Loan Amount: $840,000</p>",
    "<p>Proposed Acquisition DSCR: 1.12x</p>",
    "<p>Proposed acquisition financing is not used as current refinance debt balance.</p>",
    "<p>Current debt and refinance coverage were not assessed because no true current debt balance was verified.</p>",
  ].join("\n"),
});
assert.equal(acquisitionOnly.customer_delivery_ready, true);
assert.equal(/Current Debt DSCR\s*:\s*\d/i.test(acquisitionOnly.violations.map((v) => v.evidence?.excerpt || "").join(" ")), false);
assert.equal(
  acquisitionOnly.violations.some((v) => v.code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT"),
  false
);

// CURRENT_DEBT_PLUS_ACQUISITION_CONTEXT
const mixedDebtContext = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    current_debt_state: {
      current_debt_dscr_status: "computed",
      current_debt_dscr: 1.08,
      has_true_current_debt_balance: true,
    },
  },
  html: [
    '<p class="subsection-title">Modeled Inputs</p>',
    '<ul><li>Current_Debt_Terms_Source.txt - Structured current debt input</li></ul>',
    '<p class="subsection-title">Displayed / Limited Use</p>',
    "<ul><li>Purchase_Assumptions_Context.txt - Acquisition assumptions context only; used only for displayed purchase/cap-rate context and not used to override T12, Rent Roll, or current debt.</li></ul>",
  ].join("\n"),
});
assert.equal(
  mixedDebtContext.violations.some((v) => v.code === "CURRENT_DEBT_DOCUMENT_TREATMENT_CONTRADICTION"),
  false
);

// MESSY_SUPPORT_DOCS
const messySupportDocs = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    support_documents: [
      { original_filename: "Market_Rent_Survey.txt", semantic_doc_role: "market_survey" },
      { original_filename: "Broker_Email_Context.txt", semantic_doc_role: "background" },
      { original_filename: "Phase_I_Environmental.pdf", semantic_doc_role: "environmental_due_diligence" },
    ],
  },
  html: [
    "<p>Market_Rent_Survey.txt - Market survey / rent context only; not used to override rent roll.</p>",
    "<p>Broker_Email_Context.txt - Listed for context only.</p>",
    "<p>Phase_I_Environmental.pdf - Environmental due-diligence context only; not used quantitatively.</p>",
  ].join("\n"),
});
assert.equal(
  messySupportDocs.violations.some((v) => v.code === "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT"),
  false
);

// PROPERTY_TAX_BINDING_CONTAMINATION
const propertyTaxContamination = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: {
    ...baseCoverage,
    property_tax_binding_state: {
      hasReliableBinding: true,
      allows_multiple_bound_sources: false,
    },
  },
  html: [
    '<p class="subsection-title">Modeled Inputs</p>',
    '<ul><li>Bound_Tax_Document.pdf - Structured property tax input</li></ul>',
    '<p class="subsection-title">Displayed / Limited Use</p>',
    "<ul><li>Phase_I_Environmental.pdf - Environmental due-diligence context only.</li><li>Zoning_Compliance_Memo.pdf - Zoning/compliance context only.</li></ul>",
  ].join("\n"),
});
assert.equal(
  propertyTaxContamination.violations.some((v) => v.code === "PROPERTY_TAX_STRUCTURED_INPUT_BINDING_CONTRADICTION"),
  false
);

// DCF_CAP_RATE_PROVENANCE
const dcfCapSafeRefiAssumption = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (refinance/underwriting cap assumption (not a verified exit cap))</p>",
});
assert.equal(
  dcfCapSafeRefiAssumption.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);
const dcfCapSafeGoingInReference = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (document-stated going-in cap reference (sensitivity anchor only; not a verified exit cap))</p>",
});
assert.equal(
  dcfCapSafeGoingInReference.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);
const dcfCapSafeFramework = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: "<p>Exit cap: 5.75% (standardized framework assumption)</p>",
});
assert.equal(
  dcfCapSafeFramework.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  false
);
const dcfCapOverclaim = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  html: [
    "<p>Exit cap: 5.75% (document-derived exit cap)</p>",
    "<p>Going-in cap reference only; not a verified exit cap.</p>",
  ].join("\n"),
});
assert.equal(
  dcfCapOverclaim.violations.some((v) => v.code === "DCF_EXIT_CAP_SOURCE_OVERCLAIM"),
  true
);

// READINESS_BLOCKER_HIERARCHY
const readinessContradiction = buildReportContractQa({
  reportType: "underwriting",
  reportTier: 2,
  artifacts: baseArtifacts,
  sourceReportCoverageQa: baseCoverage,
  qaFixRouting: {
    public_sample_ready: true,
    public_sample_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
    public_sample_impact: "block_until_review",
    high_value_outreach_ready: true,
    high_value_outreach_blockers: ["ACQUISITION_FINANCING_FIELD_LIMITED"],
    high_value_outreach_impact: "block_until_review",
  },
  html: "<p>Rendered report body.</p>",
});
assert.equal(
  readinessContradiction.violations.some((v) => v.code === "PUBLIC_SAMPLE_READY_WITH_BLOCKERS"),
  true
);
assert.equal(
  readinessContradiction.violations.some((v) => v.code === "HIGH_VALUE_OUTREACH_READY_WITH_BLOCKERS"),
  true
);

const readinessActionPlan = buildQaActionPlan({
  reportContractQa: readinessContradiction,
  sourceReportCoverageQa: baseCoverage,
  renderedReportQa: { findings: [] },
  qaFixRouting: {
    public_sample_ready: false,
    high_value_outreach_ready: false,
    customer_delivery_ready: true,
  },
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(readinessActionPlan.customer_delivery_ready, true);
assert.equal(readinessActionPlan.public_sample_ready, false);
assert.equal(readinessActionPlan.high_value_outreach_ready, false);

console.log("full-underwriting-launch-certification-matrix smoke PASS");
