import assert from "node:assert/strict";
import { buildQaActionPlan, buildDeliveryGateDecision } from "../../api/_lib/qa-action-plan.js";
import { buildQaFixRouting } from "../../api/_lib/qa-fix-routing.js";

const sourceReportCoverageQa = {
  deterministic_flags: [
    {
      code: "T12_LINE_ITEM_DETAIL_MISSING",
      severity: "medium",
      message: "T12 line-item detail did not reach the report.",
      evidence: { income_line_count: 0, expense_line_count: 0 },
    },
    {
      code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
      severity: "high",
      message: "Purchase assumptions did not reach debt output.",
      evidence: {
        loan_term_sheet: {
          has_purchase_price: true,
          has_derived_acquisition_debt: true,
          has_balance: false,
          has_rate: true,
          has_amortization: true,
        },
      },
    },
    {
      code: "PUBLIC_SAMPLE_NOT_READY",
      severity: "high",
      message: "Rollup sample readiness flag.",
      evidence: {},
    },
  ],
};

const reportQaFlags = [
  {
    code: "DEBT_FILE_WITH_MISSING_BALANCE",
    severity: "high",
    message: "Debt file missing current balance.",
    evidence: {
      loan_term_sheet: {
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
      },
    },
  },
  {
    code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
    severity: "medium",
    message: "DSCR not assessed with debt context.",
    evidence: {
      loan_term_sheet: {
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
      },
    },
  },
  {
    code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
    severity: "medium",
    message: "DocRaptor not production mode.",
    evidence: { docraptor_mode: "test" },
  },
];

const renderedReportQa = {
  findings: [
    {
      code: "RENDERED_DISPLAY_WARNING",
      severity: "medium",
      issue: "Vague Insufficient Data wording appears in final report.",
      excerpt: "Insufficient Data",
    },
  ],
};

const qaFixRouting = buildQaFixRouting({
  reportQaFlags,
  sourceReportCoverageQa,
  renderedReportQa,
  reportType: "underwriting",
  reportTier: 2,
});

const plan = buildQaActionPlan({
  reportQaFlags,
  sourceReportCoverageQa,
  renderedReportQa,
  qaFixRouting,
  reportType: "underwriting",
  reportTier: 2,
  jobId: "forest-city-action-plan-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
});

const actionsByCode = Object.fromEntries(plan.prioritized_actions.map((action) => [action.code, action]));
const serialized = JSON.stringify(plan);

assert.equal(plan.event, "qa_action_plan");
assert.equal(plan.advisory_only, true);
assert.equal(plan.no_public_surface, true);
assert.equal(plan.public_sample_ready, false);
assert.equal(plan.high_value_outreach_ready, false);
assert.equal(plan.customer_delivery_ready, true);
assert.notEqual(plan.delivery_recommendation, "customer_deliverable");
assert.equal(actionsByCode.T12_LINE_ITEM_DETAIL_MISSING.action_type, "parser_fix_required");
assert.equal(
  ["render_gating_fix_required", "artifact_mapping_fix_required"].includes(
    actionsByCode.PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT.action_type
  ),
  true
);
assert.equal(actionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type, "artifact_mapping_fix_required");
assert.equal(actionsByCode.DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT.action_type, "source_document_limitation");
assert.equal(actionsByCode.DOCRAPTOR_NOT_PRODUCTION_MODE.action_type, "production_config_only");
assert.equal(Boolean(actionsByCode.PUBLIC_SAMPLE_NOT_READY), false);
assert.equal(/OpenAI|LLM|vendor/i.test(serialized), false);

const sparseDebtFlagPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "DEBT_FILE_WITH_MISSING_BALANCE",
      severity: "high",
      message: "Debt file missing current balance.",
      evidence: { parse_warning: "missing_loan_amount" },
    },
    {
      code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
      severity: "medium",
      message: "DSCR not assessed with debt context.",
      evidence: { has_debt_terms_payload: true },
    },
  ],
  sourceReportCoverageQa: {
    artifact_inventory: {
      loan_term_sheet_parsed: {
        present: true,
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
        has_rate: true,
        has_amortization: true,
      },
    },
    deterministic_flags: [],
  },
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
});

const sparseActionsByCode = Object.fromEntries(
  sparseDebtFlagPlan.prioritized_actions.map((action) => [action.code, action])
);

assert.notEqual(sparseActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type, "parser_fix_required");
assert.equal(
  ["artifact_mapping_fix_required", "render_gating_fix_required"].includes(
    sparseActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type
  ),
  true
);
assert.equal(sparseActionsByCode.DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT.action_type, "source_document_limitation");

const cleanPlanWithoutRouting = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: null,
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
});
assert.equal(cleanPlanWithoutRouting.public_sample_ready, true);

const softRenderedCompliancePlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: {
    deterministic_flags: [],
  },
  renderedReportQa: {
    findings: [
      {
        category: "compliance",
        severity: "info",
        issue: "Ensure language does not imply investment recommendations or ratings.",
        excerpt: "InvestorIQ deal score components",
        suggested_review: "Ensure language does not imply investment recommendations or ratings.",
      },
      {
        category: "compliance",
        severity: "warn",
        issue: "Review factual debt constraint language.",
        excerpt: "Base case DSCR of 1.00x falls below standard lender coverage thresholds.",
        suggested_review: "Ensure the statement remains factual and not an investment recommendation.",
      },
      {
        category: "compliance",
        severity: "critical",
        issue: "The report uses the term 'InvestorIQ estimates' which could imply proprietary or guaranteed accuracy.",
        excerpt: "InvestorIQ estimates are document-backed and framework-constrained.",
        suggested_review: "Review whether this implies guaranteed accuracy.",
      },
    ],
  },
  qaFixRouting: null,
});
const softComplianceActions = softRenderedCompliancePlan.prioritized_actions;
assert.equal(softRenderedCompliancePlan.customer_delivery_ready, true);
assert.equal(softRenderedCompliancePlan.public_sample_ready, true);
assert.equal(softRenderedCompliancePlan.high_value_outreach_ready, true);
assert.equal(softRenderedCompliancePlan.action_counts.requires_code_patch, 0);
assert.equal(
  softComplianceActions.every((action) => action.action_type === "no_action_false_positive"),
  true
);
assert.equal(
  softComplianceActions.every((action) => action.code !== "PUBLIC_LANGUAGE_COMPLIANCE_REVIEW"),
  true
);

const hardRenderedCompliancePlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: { deterministic_flags: [] },
  renderedReportQa: {
    findings: [
      {
        category: "compliance",
        severity: "critical",
        issue: "Prohibited recommendation language appears.",
        excerpt: "BUY this property based on the report.",
        suggested_review: "Remove prohibited language.",
      },
    ],
  },
  qaFixRouting: null,
});
const hardComplianceAction = hardRenderedCompliancePlan.prioritized_actions[0];
assert.equal(hardRenderedCompliancePlan.customer_delivery_ready, false);
assert.equal(hardComplianceAction.code, "PUBLIC_LANGUAGE_COMPLIANCE_REVIEW");
assert.equal(hardComplianceAction.severity, "critical");
assert.equal(hardComplianceAction.requires_code_patch, true);

const managerSuppressedMethodologyPlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: { deterministic_flags: [] },
  renderedReportQa: {
    findings: [
      {
        category: "compliance",
        severity: "critical",
        issue: "The report uses the term 'InvestorIQ estimates' which could imply proprietary or guaranteed accuracy.",
        excerpt: "InvestorIQ estimates are document-backed and framework-constrained.",
        suggested_review: "Review whether this implies guaranteed accuracy.",
      },
    ],
  },
  qaFixRouting: null,
  qaManagerReview: {
    decisions: [
      {
        source_code: "The report uses the term 'InvestorIQ estimates' which could imply proprietary or guaranteed accuracy.",
        source_artifact: "rendered_report_qa_advisory",
        classification: "false_positive",
        severity: "info",
        rationale: "Allowed methodology language.",
        evidence_excerpt: "InvestorIQ estimates are document-backed and framework-constrained.",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
});
assert.equal(managerSuppressedMethodologyPlan.customer_delivery_ready, true);
assert.equal(managerSuppressedMethodologyPlan.action_counts.requires_code_patch, 0);
assert.equal(managerSuppressedMethodologyPlan.prioritized_actions.length, 0);

const managerUnsupportedFilenamePlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
  qaManagerReview: {
    decisions: [
      {
        source_code: "UNSUPPORTED_FILENAME_TOKEN_ONLY",
        source_artifact: "source_package_qa_advisory",
        classification: "false_positive",
        severity: "info",
        rationale: "Filename token alone is not source truth.",
        evidence_excerpt: "UNSUPPORTED_capex.xlsx",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
});
assert.equal(managerUnsupportedFilenamePlan.customer_delivery_ready, true);
assert.equal(managerUnsupportedFilenamePlan.prioritized_actions.length, 0);

const managerSpeculativePublicLanguagePlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: { deterministic_flags: [] },
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
  qaManagerReview: {
    decisions: [
      {
        source_code: "SPECULATIVE_PUBLIC_LANGUAGE_REVIEW",
        source_artifact: "source_package_qa_advisory",
        classification: "real_public_language_risk",
        severity: "critical",
        rationale: "Speculative public-language concern without hard excerpt.",
        evidence_excerpt: "InvestorIQ estimates are document-backed.",
        recommended_action_type: "code_patch_required",
        requires_code_patch: true,
        requires_regeneration: true,
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(managerSpeculativePublicLanguagePlan.customer_delivery_ready, true);
assert.equal(managerSpeculativePublicLanguagePlan.action_counts.requires_code_patch, 0);

const marketSurveyRouting = buildQaFixRouting({
  reportQaFlags: [
    {
      code: "MARKET_SURVEY_CLASSIFICATION_REVIEW",
      severity: "medium",
      message: "Market survey failed rent-roll validation.",
      evidence: { contaminated_core_values: false },
    },
  ],
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      rent_roll_parsed: {
        present: true,
      },
    },
  },
  renderedReportQa: { findings: [] },
});
const marketSurveyPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "MARKET_SURVEY_CLASSIFICATION_REVIEW",
      severity: "medium",
      message: "Market survey failed rent-roll validation.",
      evidence: { contaminated_core_values: false },
    },
  ],
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      rent_roll_parsed: {
        present: true,
      },
    },
  },
  renderedReportQa: { findings: [] },
  qaFixRouting: marketSurveyRouting,
});
const marketSurveyAction = marketSurveyPlan.prioritized_actions.find(
  (action) => action.code === "MARKET_SURVEY_CLASSIFICATION_REVIEW"
);
assert.equal(marketSurveyAction.action_type, "no_action_false_positive");
assert.equal(marketSurveyAction.owner_area, "qa_calibration");
assert.equal(marketSurveyAction.requires_code_patch, false);
assert.equal(marketSurveyAction.requires_regeneration, false);
assert.equal(marketSurveyAction.blocks_customer_delivery, false);
assert.equal(marketSurveyAction.blocks_public_sample, false);
assert.equal(marketSurveyAction.blocks_high_value_outreach, false);

const acquisitionRenderedSourceQa = {
  rendered_text_signals: ["acquisition_financing_assumptions"],
  artifact_inventory: {
    loan_term_sheet_parsed: {
      present: true,
      has_purchase_price: true,
      has_derived_acquisition_debt: true,
      has_balance: false,
      has_rate: true,
      has_amortization: true,
    },
  },
  deterministic_flags: [
    {
      code: "T12_LINE_ITEM_DETAIL_MISSING",
      severity: "medium",
      message: "T12 line-item detail did not reach the report.",
      evidence: { income_line_count: 0, expense_line_count: 0 },
    },
  ],
};
const acquisitionRenderedReportFlags = [
  {
    code: "DEBT_FILE_WITH_MISSING_BALANCE",
    severity: "high",
    message: "Debt file missing current balance.",
    evidence: { parse_warning: "missing_loan_amount" },
  },
  {
    code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
    severity: "medium",
    message: "DSCR not assessed with debt context.",
    evidence: { has_debt_terms_payload: true },
  },
];
const acquisitionRenderedRouting = buildQaFixRouting({
  reportQaFlags: acquisitionRenderedReportFlags,
  sourceReportCoverageQa: acquisitionRenderedSourceQa,
  renderedReportQa: { findings: [] },
  reportType: "underwriting",
  reportTier: 2,
});
const acquisitionRenderedPlan = buildQaActionPlan({
  reportQaFlags: acquisitionRenderedReportFlags,
  sourceReportCoverageQa: acquisitionRenderedSourceQa,
  renderedReportQa: { findings: [] },
  qaFixRouting: acquisitionRenderedRouting,
  reportType: "underwriting",
  reportTier: 2,
});
const acquisitionActionsByCode = Object.fromEntries(
  acquisitionRenderedPlan.prioritized_actions.map((action) => [action.code, action])
);

assert.equal(acquisitionActionsByCode.T12_LINE_ITEM_DETAIL_MISSING.action_type, "parser_fix_required");
assert.equal(acquisitionActionsByCode.DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT.action_type, "source_document_limitation");
assert.equal(acquisitionActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type, "no_action_false_positive");
assert.equal(acquisitionActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.severity, "low");
assert.equal(acquisitionActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.requires_code_patch, false);
assert.equal(acquisitionActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.requires_regeneration, false);
assert.equal(acquisitionActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.blocks_high_value_outreach, false);
assert.equal(Boolean(acquisitionActionsByCode.PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT), false);
assert.equal(Boolean(acquisitionActionsByCode.ACQUISITION_FINANCING_RENDER_MISSING), false);

const cleanGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(cleanGate.delivery_gate_status, "deliverable");

const adminReviewGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: {
    contract_status: "warn",
    violations: [
      {
        code: "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
        severity: "high",
        category: "source_report_reconciliation",
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
        action_type: "admin_review_required",
        owner_area: "report_renderer",
        recommended_next_step: "Align all rendered current-debt DSCR values.",
        requires_code_patch: true,
        requires_regeneration: true,
        blocks_customer_delivery: false,
      },
    ],
  },
  qaDirectorReview: { overall_director_decision: "advisory_attention" },
});
assert.equal(adminReviewGate.delivery_gate_status, "admin_review_required");

const rentRollGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: {
    contract_status: "warn",
    violations: [
      {
        code: "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
        severity: "high",
        category: "report_contract",
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
        action_type: "render_gating_fix_required",
        owner_area: "rent_roll_normalizer",
        recommended_next_step: "Inspect rent roll total normalization and regenerate.",
        requires_code_patch: true,
        requires_regeneration: true,
        blocks_customer_delivery: false,
      },
    ],
  },
});
assert.equal(rentRollGate.delivery_gate_status, "admin_review_required");

const docRaptorOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
        action_type: "production_config_only",
        owner_area: "production_config",
        recommended_next_step: "Enable and verify production PDF mode before public use.",
        requires_code_patch: false,
        requires_regeneration: true,
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(docRaptorOnlyGate.delivery_gate_status, "deliverable");
assert.equal(docRaptorOnlyGate.public_sample_ready, false);

const needsDocumentsGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "needs_documents",
    deterministic_flags: [
      { code: "MISSING_REQUIRED_DOCUMENTS", severity: "high" },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: { customer_delivery_ready: false, prioritized_actions: [] },
});
assert.equal(needsDocumentsGate.delivery_gate_status, "user_needs_documents");

console.log("qa-action-plan smoke PASS");
console.log(plan.prioritized_actions.map((action) => `${action.code}:${action.action_type}`).join(", "));
