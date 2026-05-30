import assert from "node:assert/strict";
import { buildQaActionPlan, buildDeliveryGateDecision } from "../../api/_lib/qa-action-plan.js";
import { buildQaFixRouting } from "../../api/_lib/qa-fix-routing.js";
import { buildSourceReconciliationState } from "../../api/_lib/report-surface-contracts.js";
const qaActionPlanTest = (await import("../../api/_lib/qa-action-plan.js")).__test__;

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

const canonicalMirrorPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "PUBLIC_LANGUAGE_COMPLIANCE_REVIEW",
      severity: "critical",
      message: "Hard compliance warning for advisory action continuity.",
    },
  ],
  sourceReportCoverageQa: {
    deterministic_flags: [],
  },
  renderedReportQa: { findings: [] },
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});
assert.equal(canonicalMirrorPlan.customer_delivery_ready, true);
assert.equal(canonicalMirrorPlan.public_sample_ready, false);
assert.equal(canonicalMirrorPlan.high_value_outreach_ready, false);
assert.equal(canonicalMirrorPlan.readiness_source, "canonical_delivery_state");
assert.equal(canonicalMirrorPlan.readiness_fallback_used, false);

const canonicalConflictPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "PUBLIC_LANGUAGE_COMPLIANCE_REVIEW",
      severity: "critical",
      message: "Would normally block from local action synthesis.",
    },
  ],
  sourceReportCoverageQa: {
    deterministic_flags: [
      {
        code: "PUBLIC_SAMPLE_NOT_READY",
        severity: "high",
      },
    ],
  },
  renderedReportQa: { findings: [] },
  deliveryGateDecision: {
    delivery_gate_status: "deliverable",
    customer_publish_eligible: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
  },
});
assert.equal(canonicalConflictPlan.customer_delivery_ready, true);
assert.equal(canonicalConflictPlan.public_sample_ready, true);
assert.equal(canonicalConflictPlan.high_value_outreach_ready, true);
assert.equal(canonicalConflictPlan.canonical_delivery_gate_status, "deliverable");
assert.equal(canonicalConflictPlan.readiness_source, "canonical_delivery_state");

const legacyFallbackPlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: null,
  renderedReportQa: null,
  qaFixRouting: null,
});
assert.equal(legacyFallbackPlan.readiness_source, "legacy_action_plan_fallback");
assert.equal(legacyFallbackPlan.readiness_fallback_used, true);
assert.equal(legacyFallbackPlan.customer_delivery_ready, true);
assert.equal(legacyFallbackPlan.public_sample_ready, true);
assert.equal(legacyFallbackPlan.high_value_outreach_ready, true);
assert.equal(Array.isArray(legacyFallbackPlan.prioritized_actions), true);
assert.equal(typeof legacyFallbackPlan.action_counts?.total, "number");

const actionsByCode = Object.fromEntries(plan.prioritized_actions.map((action) => [action.code, action]));
const serialized = JSON.stringify(plan);

assert.equal(plan.event, "qa_action_plan");
assert.equal(plan.advisory_only, true);
assert.equal(plan.no_public_surface, true);
assert.equal(plan.public_sample_ready, false);
assert.equal(plan.high_value_outreach_ready, false);
assert.equal(plan.customer_delivery_ready, true);
assert.notEqual(plan.delivery_recommendation, "customer_deliverable");
assert.equal(plan.launch_path_recommendation, "customer_deliverable_with_internal_advisory");
assert.equal(
  /before sample use|before public sample|high-value outreach use|public sample or outreach|public sample or high-value|public sample or outreach report|underwriting_private_beta_recommended|screening_only_public_launch_recommended|do_not_use_for_public_or_high_value_outreach|Ken|high-value quality tier/i.test(serialized),
  false
);
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

const canonicalPublishEligibilityMirror = qaActionPlanTest.buildPublishEligibilitySummary({
  deliveryGateStatus: "deliverable",
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  prioritizedActions: [
    {
      code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
      action_type: "code_patch_required",
      owner_area: "report_renderer",
      blocks_customer_delivery: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      requires_regeneration: true,
    },
  ],
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});
assert.equal(canonicalPublishEligibilityMirror.customer_publish_eligible, true);
assert.equal(canonicalPublishEligibilityMirror.report_publishable, true);
assert.equal(canonicalPublishEligibilityMirror.customer_delivery_ready, true);
assert.equal(canonicalPublishEligibilityMirror.report_blocked, false);
assert.equal(canonicalPublishEligibilityMirror.readiness_source, "canonical_delivery_state");
assert.equal(canonicalPublishEligibilityMirror.readiness_fallback_used, false);
assert.equal(Array.isArray(canonicalPublishEligibilityMirror.report_quality_blockers), true);
assert.equal(
  canonicalPublishEligibilityMirror.report_quality_blockers.length > 0 ||
    (canonicalPublishEligibilityMirror.report_quality_advisories || []).length > 0,
  true
);
assert.equal(canonicalPublishEligibilityMirror.public_sample_ready, false);
assert.equal(canonicalPublishEligibilityMirror.high_value_outreach_ready, false);

const canonicalPublishEligibilityHeld = qaActionPlanTest.buildPublishEligibilitySummary({
  deliveryGateStatus: "deliverable",
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  prioritizedActions: [],
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "admin_review_required",
    customer_delivery_allowed: false,
    public_sample_ready: true,
    high_value_outreach_ready: true,
  },
});
assert.equal(canonicalPublishEligibilityHeld.customer_publish_eligible, false);
assert.equal(canonicalPublishEligibilityHeld.report_publishable, false);
assert.equal(canonicalPublishEligibilityHeld.customer_delivery_ready, false);
assert.equal(canonicalPublishEligibilityHeld.report_blocked, true);
assert.equal(canonicalPublishEligibilityHeld.admin_review_required, true);
assert.equal(canonicalPublishEligibilityHeld.user_needs_documents, false);
assert.equal(
  String(canonicalPublishEligibilityHeld.publish_decision_reason || "").startsWith("admin_review_required:"),
  true
);

const legacyPublishEligibilityFallback = qaActionPlanTest.buildPublishEligibilitySummary({
  deliveryGateStatus: "deliverable",
  sourceReportCoverageQa: {
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  prioritizedActions: [],
});
assert.equal(legacyPublishEligibilityFallback.readiness_source, "legacy_publish_eligibility_fallback");
assert.equal(legacyPublishEligibilityFallback.readiness_fallback_used, true);
assert.equal(legacyPublishEligibilityFallback.customer_publish_eligible, true);
assert.equal(legacyPublishEligibilityFallback.report_publishable, true);
assert.equal(legacyPublishEligibilityFallback.customer_delivery_ready, true);

const sparsePlan = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: null,
  renderedReportQa: null,
  qaFixRouting: null,
  qaManagerReview: null,
  reportContractQa: null,
  reportType: "underwriting",
  reportTier: 2,
});
assert.equal(sparsePlan.event, "qa_action_plan");
assert.equal(sparsePlan.source_reconciliation_state, null);
assert.equal(sparsePlan.section_eligibility, null);
assert.equal(
  /before sample use|before public sample|high-value outreach use|public sample or outreach|public sample or high-value|public sample or outreach report|underwriting_private_beta_recommended|screening_only_public_launch_recommended|do_not_use_for_public_or_high_value_outreach|Ken|high-value quality tier/i.test(JSON.stringify(sparsePlan)),
  false
);

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

const supportedAcquisitionAssumptionsPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "unsupported_acquisition_assumptions",
      severity: "high",
      message: "Unsupported acquisition assumptions.",
      evidence: { summary: "Acquisition assumptions flagged." },
    },
  ],
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    rendered_text_signals: ["acquisition_financing_assumptions"],
    current_debt_state: {
      has_proposed_acquisition_financing: true,
      has_true_current_debt_balance: false,
    },
    acquisition_assumption_state: {
      acquisition_assumptions_supported: true,
      has_validated_acquisition_assumptions: true,
      current_debt_separated: true,
    },
  },
  renderedReportQa: { findings: [] },
  reportType: "underwriting",
  reportTier: 2,
});
const supportedAcquisitionAssumptionsAction = supportedAcquisitionAssumptionsPlan.prioritized_actions.find(
  (action) => action.code === "unsupported_acquisition_assumptions"
);
assert.equal(supportedAcquisitionAssumptionsAction.action_type, "no_action_false_positive");
assert.equal(supportedAcquisitionAssumptionsAction.blocks_public_sample, false);
assert.equal(supportedAcquisitionAssumptionsAction.blocks_high_value_outreach, false);

const partialAcquisitionAssumptionsPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "unsupported_acquisition_assumptions",
      severity: "high",
      message: "Unsupported acquisition assumptions.",
      evidence: { summary: "Acquisition assumptions flagged." },
    },
  ],
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    rendered_text_signals: ["acquisition_financing_assumptions"],
    current_debt_state: {
      has_proposed_acquisition_financing: true,
      has_true_current_debt_balance: false,
    },
    acquisition_assumption_state: {
      acquisition_assumptions_supported: false,
      has_validated_acquisition_assumptions: false,
      current_debt_separated: true,
    },
  },
  renderedReportQa: { findings: [] },
  reportType: "underwriting",
  reportTier: 2,
});
const partialAcquisitionAssumptionsAction = partialAcquisitionAssumptionsPlan.prioritized_actions.find(
  (action) => action.code === "unsupported_acquisition_assumptions"
);
assert.equal(partialAcquisitionAssumptionsAction.action_type, "source_document_limitation");
assert.equal(partialAcquisitionAssumptionsAction.blocks_public_sample, true);
assert.equal(partialAcquisitionAssumptionsAction.blocks_high_value_outreach, true);

const cleanGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(cleanGate.delivery_gate_status, "deliverable");
assert.equal(cleanGate.customer_delivery_ready, cleanGate.customer_publish_eligible);
assert.equal(cleanGate.report_publishable, cleanGate.customer_publish_eligible);
assert.equal(cleanGate.report_blocked, !cleanGate.report_publishable);
assert.equal(cleanGate.readiness_hierarchy?.final_delivery_authority, "delivery_gate");
assert.equal(cleanGate.final_delivery_authority, "delivery_gate");
assert.equal(cleanGate.readiness_hierarchy.final_delivery_status, "deliverable");
assert.equal(cleanGate.launch_path_recommendation, "customer_deliverable");
assert.equal(cleanGate.final_delivery_authority, "delivery_gate");
assert.equal(cleanGate.readiness_hierarchy.final_delivery_status, "deliverable");
assert.equal(cleanGate.report_publishable, true);
assert.equal(cleanGate.report_blocked, false);
assert.equal(Array.isArray(cleanGate.report_quality_blockers), true);
assert.equal(cleanGate.report_quality_blockers.length, 0);

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
    customer_delivery_ready: true,
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
assert.equal(adminReviewGate.customer_publish_eligible, false);
assert.equal(adminReviewGate.customer_delivery_ready, adminReviewGate.customer_publish_eligible);
assert.equal(adminReviewGate.report_publishable, adminReviewGate.customer_publish_eligible);
assert.equal(adminReviewGate.report_blocked, !adminReviewGate.report_publishable);
assert.equal(adminReviewGate.readiness_hierarchy?.final_delivery_authority, "delivery_gate");
assert.equal(adminReviewGate.final_delivery_authority, "delivery_gate");
assert.equal(adminReviewGate.readiness_hierarchy.final_delivery_status, "admin_review_required");
assert.equal(adminReviewGate.launch_path_recommendation, "admin_review_required");
assert.equal(adminReviewGate.final_delivery_authority, "delivery_gate");
assert.equal(adminReviewGate.readiness_hierarchy.final_delivery_status, "admin_review_required");

const rentRollGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
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
    customer_delivery_ready: true,
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
assert.equal(rentRollGate.delivery_gate_status, "deliverable");
assert.equal(rentRollGate.customer_delivery_ready, true);
assert.equal(rentRollGate.public_sample_ready, true);
assert.equal(rentRollGate.high_value_outreach_ready, true);
assert.equal(rentRollGate.report_publishable, true);
assert.equal(rentRollGate.report_blocked, false);
assert.equal(Array.isArray(rentRollGate.report_quality_advisories), true);

const rentRollPublicOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      reason_code: null,
    },
  },
  reportContractQa: {
    contract_status: "warn",
    customer_delivery_ready: true,
    violations: [
      {
        code: "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
        severity: "high",
        category: "report_contract",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: true,
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
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(rentRollPublicOnlyGate.delivery_gate_status, "deliverable");
assert.equal(rentRollPublicOnlyGate.customer_delivery_ready, true);
assert.equal(rentRollPublicOnlyGate.public_sample_ready, false);
assert.equal(rentRollPublicOnlyGate.high_value_outreach_ready, false);
assert.equal(rentRollPublicOnlyGate.report_publishable, true);
assert.equal(rentRollPublicOnlyGate.report_blocked, false);

const renderedRentRollGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      reason_code: null,
    },
  },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
        severity: "high",
        category: "source_report_reconciliation",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        recommended_next_step: "Remove the rendered contradiction before delivery.",
        requires_code_patch: true,
        requires_regeneration: true,
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(renderedRentRollGate.delivery_gate_status, "admin_review_required");
assert.equal(renderedRentRollGate.customer_delivery_ready, false);
assert.equal(renderedRentRollGate.report_publishable, false);
assert.equal(renderedRentRollGate.report_blocked, true);
assert.equal(Array.isArray(renderedRentRollGate.report_quality_blockers), true);

const managerContradictionPlan = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaManagerReview: {
    decisions: [
      {
        classification: "real_source_report_contradiction",
        severity: "high",
        source_code: "rent_roll_vs_t12_gpr_discrepancy",
        source_artifact: "qa_manager_review",
        blocks_customer_delivery: true,
        recommended_action_type: "admin_review_required",
        rationale: "Verify the rendered rent roll and T12 source values before delivery.",
      },
    ],
  },
});
const managerContradictionAction = managerContradictionPlan.prioritized_actions.find(
  (action) => action.code === "rent_roll_vs_t12_gpr_discrepancy"
);
assert.equal(managerContradictionAction.action_type, "source_document_limitation");
assert.equal(managerContradictionAction.owner_area, "source_reconciliation");
assert.equal(managerContradictionAction.title, "Rent roll source totals require verification");
assert.equal(
  managerContradictionAction.recommended_next_step,
  "Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating."
);
assert.equal(managerContradictionAction.blocks_customer_delivery, false);
assert.equal(managerContradictionAction.blocks_public_sample, true);

const genericContradictionAction = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaManagerReview: {
    decisions: [
      {
        classification: "real_source_report_contradiction",
        severity: "medium",
        source_code: "source_value_mismatch",
        source_artifact: "qa_manager_review",
        blocks_customer_delivery: false,
        recommended_action_type: "verify_calculation_and_source_data",
        rationale: "Check the uploaded source documents against parsed values.",
      },
    ],
  },
}).prioritized_actions.find((action) => action.code === "source_value_mismatch");
assert.equal(genericContradictionAction.recommended_next_step, "Review the uploaded source documents and parsed values. Confirm the correct source-backed value before regenerating.");

const managerContradictionGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: managerContradictionPlan,
});
assert.equal(managerContradictionGate.delivery_gate_status, "deliverable");
assert.equal(managerContradictionGate.customer_delivery_ready, true);
assert.equal(managerContradictionGate.public_sample_ready, false);
assert.equal(managerContradictionGate.high_value_outreach_ready, false);
assert.equal(managerContradictionGate.report_publishable, true);

const advisoryOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [],
    advisory_only_findings: ["ADVISORY_ONLY_FLAG"],
  },
});
assert.equal(advisoryOnlyGate.report_publishable, true);
assert.equal(advisoryOnlyGate.customer_delivery_ready, true);
assert.equal(advisoryOnlyGate.public_sample_ready, true);
assert.equal(advisoryOnlyGate.high_value_outreach_ready, true);

const sourceTotalsVerificationAction = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaManagerReview: {
    decisions: [
      {
        classification: "real_source_report_contradiction",
        severity: "high",
        source_code: "rent_roll_vs_t12_gpr_discrepancy",
        source_artifact: "qa_manager_review",
        blocks_customer_delivery: false,
        recommended_action_type: "admin_review_required",
        rationale: "Confirm source totals before publication.",
      },
    ],
  },
}).prioritized_actions.find((action) => action.code === "rent_roll_vs_t12_gpr_discrepancy");
assert.equal(sourceTotalsVerificationAction.action_type, "source_document_limitation");
assert.equal(sourceTotalsVerificationAction.owner_area, "source_reconciliation");
assert.equal(sourceTotalsVerificationAction.blocks_customer_delivery, false);
assert.equal(sourceTotalsVerificationAction.blocks_public_sample, true);

const retest8SourceReconciliationState = buildSourceReconciliationState({
  computedRentRoll: {
    total_units: 48,
    total_in_place_annual: 961200,
    unit_mix: [{ count: 48, current_rent: 1668.75 }],
  },
  rentRollPayload: {
    total_units: 48,
    total_in_place_annual: 1962456,
    unit_mix: [{ count: 48, current_rent: 1668.75 }],
  },
  t12Payload: { gross_potential_rent: 1850000 },
});
const retest8SourceReportCoverageQa = {
  qa_status: "warn",
  deterministic_flags: [
    {
      code: "RENT_ROLL_T12_RECONCILIATION_REQUIRED",
      severity: "medium",
      message: "Material variance between rent roll annualized in-place rent and T12 gross potential rent requires review.",
      evidence: {
        source_reconciliation_state: {
          ...retest8SourceReconciliationState,
          publishability_bucket: "disclose_only_publishable",
          customer_delivery_impact: "disclose_only",
          public_outreach_impact: "block_until_review",
        },
        rendered_text_signals: [],
      },
      routing: "public_sample_blocker",
      blocks_customer_delivery: false,
    },
  ],
  artifact_inventory: {
    t12_parsed: {
      present: true,
      has_core_totals: true,
    },
    rent_roll_parsed: {
      present: true,
    },
  },
  core_input_sufficiency_state: {
    publishability_bucket: "disclose_only_publishable",
    reason_code: "source_reconciliation_disclosed",
  },
  source_reconciliation_state: {
    ...retest8SourceReconciliationState,
    publishability_bucket: "disclose_only_publishable",
    customer_delivery_impact: "disclose_only",
    public_outreach_impact: "block_until_review",
  },
};
const reconciliationActionPlan = buildQaActionPlan({
  sourceReportCoverageQa: retest8SourceReportCoverageQa,
  reportContractQa: { contract_status: "pass", violations: [] },
});
const reconciliationAction = reconciliationActionPlan.prioritized_actions.find((action) => action.code === "RENT_ROLL_T12_RECONCILIATION_REQUIRED");
assert.equal(reconciliationAction.action_type, "source_document_limitation");
assert.equal(reconciliationAction.owner_area, "source_reconciliation");
assert.equal(reconciliationAction.blocks_customer_delivery, false);
assert.equal(reconciliationAction.blocks_public_sample, true);
assert.equal(reconciliationAction.blocks_high_value_outreach, true);
const reconciliationGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: retest8SourceReportCoverageQa,
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: reconciliationActionPlan,
});
assert.equal(reconciliationGate.delivery_gate_status, "deliverable");
assert.equal(reconciliationGate.customer_delivery_ready, true);
assert.equal(reconciliationGate.customer_publish_eligible, true);
assert.equal(reconciliationGate.report_publishable, true);
assert.deepEqual(reconciliationGate.customer_publish_blockers, []);
assert.equal(reconciliationGate.customer_delivery_impact, "disclose_only");
assert.equal((reconciliationGate.source_limitation_reason_codes || []).includes("RENT_ROLL_T12_RECONCILIATION_REQUIRED"), true);
assert.equal(reconciliationGate.public_sample_ready, false);
assert.equal(reconciliationGate.high_value_outreach_ready, false);

const reconciliationExplicitBlockGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    ...retest8SourceReportCoverageQa,
    source_reconciliation_state: {
      ...retest8SourceReconciliationState,
      publishability_bucket: "admin_review_required",
      customer_delivery_impact: "block",
      public_outreach_impact: "block_until_review",
    },
    deterministic_flags: [
      {
        code: "RENT_ROLL_T12_RECONCILIATION_REQUIRED",
        severity: "high",
        message: "Material source mismatch requires blocking review.",
        evidence: {
          source_reconciliation_state: {
            ...retest8SourceReconciliationState,
            publishability_bucket: "admin_review_required",
            customer_delivery_impact: "block",
            public_outreach_impact: "block_until_review",
          },
        },
        routing: "public_sample_blocker",
        blocks_customer_delivery: true,
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      ...retest8SourceReportCoverageQa,
      source_reconciliation_state: {
        ...retest8SourceReconciliationState,
        publishability_bucket: "admin_review_required",
        customer_delivery_impact: "block",
        public_outreach_impact: "block_until_review",
      },
      deterministic_flags: [
        {
          code: "RENT_ROLL_T12_RECONCILIATION_REQUIRED",
          severity: "high",
          message: "Material source mismatch requires blocking review.",
          evidence: {
            source_reconciliation_state: {
              ...retest8SourceReconciliationState,
              publishability_bucket: "admin_review_required",
              customer_delivery_impact: "block",
              public_outreach_impact: "block_until_review",
            },
          },
          routing: "public_sample_blocker",
          blocks_customer_delivery: true,
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.notEqual(reconciliationExplicitBlockGate.delivery_gate_status, "deliverable");
assert.equal(reconciliationExplicitBlockGate.customer_publish_eligible, false);

const discloseOnlyKeywordFlagGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "SOURCE_REVIEW_REQUIRED_BUT_DISCLOSE_ONLY",
        severity: "medium",
        message: "Disclosure only review required.",
        evidence: {
          customer_delivery_impact: "disclose_only",
        },
        routing: "public_sample_blocker",
        blocks_customer_delivery: false,
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "SOURCE_REVIEW_REQUIRED_BUT_DISCLOSE_ONLY",
          severity: "medium",
          message: "Disclosure only review required.",
          evidence: {
            customer_delivery_impact: "disclose_only",
          },
          routing: "public_sample_blocker",
          blocks_customer_delivery: false,
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(discloseOnlyKeywordFlagGate.delivery_gate_status, "deliverable");
assert.equal(discloseOnlyKeywordFlagGate.public_sample_ready, false);

const publicOnlyKeywordFlagGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "PUBLIC_SAMPLE_MISSING_CONTEXT",
        severity: "medium",
        message: "Public sample review only.",
        routing: "public_sample_blocker",
        blocks_customer_delivery: false,
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "PUBLIC_SAMPLE_MISSING_CONTEXT",
          severity: "medium",
          message: "Public sample review only.",
          routing: "public_sample_blocker",
          blocks_customer_delivery: false,
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(publicOnlyKeywordFlagGate.delivery_gate_status, "deliverable");
assert.equal(publicOnlyKeywordFlagGate.public_sample_ready, false);

const explicitCustomerBlockingGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "needs_documents",
    deterministic_flags: [
      {
        code: "MISSING_REQUIRED_T12",
        severity: "high",
        message: "T12 source is missing.",
        blocks_customer_delivery: true,
        evidence: {
          customer_delivery_impact: "block",
        },
      },
    ],
    artifact_inventory: {
      t12_parsed: {
        present: false,
        has_core_totals: false,
      },
      rent_roll_parsed: {
        present: true,
      },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "user_needs_documents",
      reason_code: "missing_required_t12",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "needs_documents",
      deterministic_flags: [
        {
          code: "MISSING_REQUIRED_T12",
          severity: "high",
          message: "T12 source is missing.",
          blocks_customer_delivery: true,
          evidence: {
            customer_delivery_impact: "block",
          },
        },
      ],
      artifact_inventory: {
        t12_parsed: {
          present: false,
          has_core_totals: false,
        },
        rent_roll_parsed: {
          present: true,
        },
      },
      core_input_sufficiency_state: {
        publishability_bucket: "user_needs_documents",
        reason_code: "missing_required_t12",
      },
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(explicitCustomerBlockingGate.delivery_gate_status, "user_needs_documents");

const uppercaseImpactGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "IMPACT_CASE_UPPER",
        severity: "medium",
        message: "Uppercase impact variant.",
        evidence: {
          customer_delivery_impact: "BLOCK",
        },
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "IMPACT_CASE_UPPER",
          severity: "medium",
          message: "Uppercase impact variant.",
          evidence: {
            customer_delivery_impact: "BLOCK",
          },
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(uppercaseImpactGate.delivery_gate_status, "user_needs_documents");

const lowercaseImpactGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "IMPACT_CASE_LOWER",
        severity: "medium",
        message: "Lowercase blocked variant.",
        evidence: {
          customer_delivery_impact: "blocked",
        },
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "IMPACT_CASE_LOWER",
          severity: "medium",
          message: "Lowercase blocked variant.",
          evidence: {
            customer_delivery_impact: "blocked",
          },
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(lowercaseImpactGate.delivery_gate_status, "user_needs_documents");

const nestedImpactGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "IMPACT_CASE_NESTED",
        severity: "medium",
        message: "Nested impact variant.",
        evidence: {
          source_reconciliation_state: {
            customer_delivery_impact: "customer_delivery_blocked",
          },
        },
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "IMPACT_CASE_NESTED",
          severity: "medium",
          message: "Nested impact variant.",
          evidence: {
            source_reconciliation_state: {
              customer_delivery_impact: "customer_delivery_blocked",
            },
          },
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(nestedImpactGate.delivery_gate_status, "user_needs_documents");

const discloseOnlyImpactGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "SOURCE_REVIEW_REQUIRED_BUT_DISCLOSE_ONLY",
        severity: "medium",
        message: "Disclosure-only review required.",
        evidence: {
          customer_delivery_impact: "disclose_only",
        },
        blocks_customer_delivery: false,
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "SOURCE_REVIEW_REQUIRED_BUT_DISCLOSE_ONLY",
          severity: "medium",
          message: "Disclosure-only review required.",
          evidence: {
            customer_delivery_impact: "disclose_only",
          },
          blocks_customer_delivery: false,
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(discloseOnlyImpactGate.delivery_gate_status, "deliverable");

const reviewOnlyImpactGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [
      {
        code: "PUBLIC_SAMPLE_MISSING_CONTEXT",
        severity: "medium",
        message: "Review-only variant.",
        evidence: {
          customer_delivery_impact: "review_only",
        },
        routing: "public_sample_blocker",
        blocks_customer_delivery: false,
      },
    ],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "pass",
      deterministic_flags: [
        {
          code: "PUBLIC_SAMPLE_MISSING_CONTEXT",
          severity: "medium",
          message: "Review-only variant.",
          evidence: {
            customer_delivery_impact: "review_only",
          },
          routing: "public_sample_blocker",
          blocks_customer_delivery: false,
        },
      ],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(reviewOnlyImpactGate.delivery_gate_status, "deliverable");

const needsDocumentsStatusGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "needs_documents",
    deterministic_flags: [],
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "needs_documents",
      deterministic_flags: [],
    },
    reportContractQa: { contract_status: "pass", violations: [] },
  }),
});
assert.equal(needsDocumentsStatusGate.delivery_gate_status, "user_needs_documents");
assert.equal(needsDocumentsStatusGate.reason_code, "missing_required_source_documents");

const missingRentRollGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "needs_documents",
    deterministic_flags: [
      {
        code: "MISSING_REQUIRED_RENT_ROLL",
        severity: "high",
        message: "Rent roll is missing or unusable.",
        blocks_customer_delivery: true,
      },
    ],
    artifact_inventory: {
      t12_parsed: {
        present: true,
        has_core_totals: true,
      },
      rent_roll_parsed: {
        present: false,
      },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: { customer_delivery_ready: false, prioritized_actions: [] },
});
assert.equal(missingRentRollGate.delivery_gate_status, "user_needs_documents");

const sectionConstrainedGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    core_input_sufficiency_state: {
      publishability_bucket: "section_constrained_publishable",
      reason_code: "t12_line_item_detail_missing",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(sectionConstrainedGate.delivery_gate_status, "deliverable");
assert.equal(sectionConstrainedGate.customer_delivery_ready, false);

const discloseOnlySufficiencyGateBare = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    core_input_sufficiency_state: {
      publishability_bucket: "disclose_only_publishable",
      reason_code: "source_reconciliation_disclosed",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(discloseOnlySufficiencyGateBare.delivery_gate_status, "deliverable");

const adminReviewSufficiencyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    core_input_sufficiency_state: {
      publishability_bucket: "admin_review_required",
      reason_code: "t12_noi_equation_mismatch",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(adminReviewSufficiencyGate.delivery_gate_status, "admin_review_required");

const renderedReconciliationMismatchGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    source_reconciliation_state: {
      publishability_bucket: "disclose_only_publishable",
      customer_delivery_impact: "disclose_only",
      public_outreach_impact: "block_until_review",
      variance_pct: 0.06078702702702703,
    },
  },
  reportContractQa: {
    contract_status: "fail",
    customer_delivery_ready: false,
    violations: [
      {
        code: "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
        severity: "high",
        message: "Rendered Rent Roll vs T12 GPR variance disagrees with canonical source reconciliation state.",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
        evidence: {
          canonical_variance_pct: 0.06078702702702703,
          rendered_values: [{ label: "Rent Roll vs T12 GPR Variance", value: -48.0 }],
        },
      },
    ],
  },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: {
      qa_status: "warn",
      deterministic_flags: [],
      source_reconciliation_state: {
        publishability_bucket: "disclose_only_publishable",
        customer_delivery_impact: "disclose_only",
        public_outreach_impact: "block_until_review",
        variance_pct: 0.06078702702702703,
      },
    },
    reportContractQa: {
      contract_status: "fail",
      customer_delivery_ready: false,
      violations: [
        {
          code: "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
          severity: "high",
          message: "Rendered Rent Roll vs T12 GPR variance disagrees with canonical source reconciliation state.",
          blocks_customer_delivery: true,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
  }),
});
assert.equal(renderedReconciliationMismatchGate.delivery_gate_status, "admin_review_required");
assert.match(renderedReconciliationMismatchGate.publish_decision_reason, /^admin_review_required:/i);

const sectionConstrainedSufficiencyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: {
        present: true,
        has_core_totals: true,
      },
      rent_roll_parsed: {
        present: true,
      },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "section_constrained_publishable",
      reason_code: "t12_line_item_detail_missing",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(sectionConstrainedSufficiencyGate.delivery_gate_status, "deliverable");
assert.equal(sectionConstrainedSufficiencyGate.customer_delivery_ready, true);
assert.equal(sectionConstrainedSufficiencyGate.publish_decision_reason, "customer_publish_eligible");

const discloseOnlySufficiencyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: {
        present: true,
        has_core_totals: true,
      },
      rent_roll_parsed: {
        present: true,
      },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "disclose_only_publishable",
      reason_code: "source_reconciliation_disclosed",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(discloseOnlySufficiencyGate.delivery_gate_status, "deliverable");
assert.equal(discloseOnlySufficiencyGate.customer_delivery_ready, true);

const systemContractFailureSufficiencyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    core_input_sufficiency_state: {
      publishability_bucket: "system_contract_failure",
      reason_code: "contract_failure",
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: true,
    high_value_outreach_ready: true,
    prioritized_actions: [],
  },
});
assert.equal(systemContractFailureSufficiencyGate.delivery_gate_status, "admin_review_required");

const dealScorecardViolationPlan = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
        severity: "high",
        message: "Deal Scorecard renders a stale placeholder for current debt DSCR.",
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
const dealScorecardViolationAction = dealScorecardViolationPlan.prioritized_actions.find(
  (action) => action.code === "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER"
);
assert.equal(dealScorecardViolationAction.blocks_customer_delivery, false);
assert.equal(dealScorecardViolationAction.action_type, "render_gating_fix_required");
assert.equal(
  dealScorecardViolationAction.recommended_next_step.includes("deterministic self-heal"),
  true
);
assert.equal(
  buildDeliveryGateDecision({
    sourceReportCoverageQa: {
      qa_status: "pass",
      core_input_sufficiency_state: {
        publishability_bucket: "disclose_only_publishable",
        customer_delivery_impact: "disclose_only",
        required_core_docs_missing: false,
      },
      artifact_inventory: {
        t12_parsed: { present: true, has_core_totals: true },
        rent_roll_parsed: { present: true },
      },
      deterministic_flags: [],
    },
    reportContractQa: {
      contract_status: "block",
      customer_delivery_ready: false,
      violations: [
        {
          code: "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
          severity: "high",
          message: "Deal Scorecard renders a stale placeholder for current debt DSCR.",
          customer_delivery_impact: "disclose_only",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
    qaActionPlan: dealScorecardViolationPlan,
  }).delivery_gate_status,
  "deliverable"
);
assert.equal(
  buildDeliveryGateDecision({
    sourceReportCoverageQa: {
      qa_status: "pass",
      core_input_sufficiency_state: {
        publishability_bucket: "disclose_only_publishable",
        customer_delivery_impact: "disclose_only",
        required_core_docs_missing: false,
      },
      artifact_inventory: {
        t12_parsed: { present: true, has_core_totals: true },
        rent_roll_parsed: { present: true },
      },
      deterministic_flags: [],
    },
    reportContractQa: {
      contract_status: "block",
      customer_delivery_ready: false,
      violations: [
        {
          code: "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
          severity: "high",
          message: "Deal Scorecard renders a stale placeholder for current debt DSCR.",
          customer_delivery_impact: "disclose_only",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
    qaActionPlan: dealScorecardViolationPlan,
  }).customer_publish_eligible,
  true
);

const placeholderContractViolationPlan = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
        severity: "high",
        message: "Rendered report contains stale DATA NOT AVAILABLE placeholder text.",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
const placeholderContractViolationAction = placeholderContractViolationPlan.prioritized_actions.find(
  (action) => action.code === "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER"
);
assert.equal(placeholderContractViolationAction.blocks_customer_delivery, false);
assert.equal(placeholderContractViolationAction.action_type, "render_gating_fix_required");
assert.equal(
  buildDeliveryGateDecision({
    sourceReportCoverageQa: {
      qa_status: "pass",
      core_input_sufficiency_state: {
        publishability_bucket: "core_sufficient_publishable",
        customer_delivery_impact: "allow",
        required_core_docs_missing: false,
      },
      artifact_inventory: {
        t12_parsed: { present: true, has_core_totals: true },
        rent_roll_parsed: { present: true },
      },
      deterministic_flags: [],
    },
    reportContractQa: {
      contract_status: "block",
      customer_delivery_ready: false,
      violations: [
        {
          code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
          severity: "high",
          message: "Rendered report contains stale DATA NOT AVAILABLE placeholder text.",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
    qaActionPlan: placeholderContractViolationPlan,
  }).delivery_gate_status,
  "deliverable"
);
assert.equal(
  buildDeliveryGateDecision({
    sourceReportCoverageQa: {
      qa_status: "pass",
      core_input_sufficiency_state: {
        publishability_bucket: "core_sufficient_publishable",
        customer_delivery_impact: "allow",
        required_core_docs_missing: false,
      },
      artifact_inventory: {
        t12_parsed: { present: true, has_core_totals: true },
        rent_roll_parsed: { present: true },
      },
      deterministic_flags: [],
    },
    reportContractQa: {
      contract_status: "block",
      customer_delivery_ready: false,
      violations: [
        {
          code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
          severity: "high",
          message: "Rendered report contains stale DATA NOT AVAILABLE placeholder text.",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
    qaActionPlan: placeholderContractViolationPlan,
  }).customer_publish_eligible,
  true
);

const unsupportedCurrentDebtRenderedGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      required_core_docs_missing: false,
      customer_delivery_impact: "allow",
      blocks_customer_delivery: false,
    },
  },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "UNSUPPORTED_CURRENT_DEBT_RENDERED",
        category: "section_gating_contract",
        severity: "high",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [],
  },
});
assert.equal(unsupportedCurrentDebtRenderedGate.delivery_gate_status, "admin_review_required");
assert.equal(unsupportedCurrentDebtRenderedGate.customer_publish_eligible, false);

const docRaptorOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
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
assert.equal(docRaptorOnlyGate.customer_publish_eligible, true);
assert.deepEqual(docRaptorOnlyGate.customer_publish_blockers, []);
assert.equal(docRaptorOnlyGate.public_sample_ready, false);
assert.equal(docRaptorOnlyGate.high_value_outreach_ready, false);
assert.equal(docRaptorOnlyGate.distribution_context?.non_authoritative_exposure_metadata, true);
assert.equal(docRaptorOnlyGate.customer_publish_blockers.includes("DOCRAPTOR_NOT_PRODUCTION_MODE"), false);
assert.equal((docRaptorOnlyGate.public_sample_blockers || []).length > 0, true);
assert.equal((docRaptorOnlyGate.high_value_outreach_blockers || []).length > 0, true);

const publicSampleOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "PUBLIC_SAMPLE_NOT_READY",
        action_type: "production_config_only",
        owner_area: "production_config",
        recommended_next_step: "Do not use for public sample yet.",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(publicSampleOnlyGate.delivery_gate_status, "deliverable");
assert.equal(publicSampleOnlyGate.customer_publish_eligible, true);
assert.deepEqual(publicSampleOnlyGate.customer_publish_blockers, []);
assert.equal(publicSampleOnlyGate.public_sample_ready, false);
assert.equal(publicSampleOnlyGate.high_value_outreach_ready, false);
assert.equal(publicSampleOnlyGate.customer_publish_blockers.includes("PUBLIC_SAMPLE_NOT_READY"), false);
assert.equal((publicSampleOnlyGate.report_quality_blockers || []).includes("PUBLIC_SAMPLE_NOT_READY"), false);

const aiOnlyAdvisoryGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: managerSpeculativePublicLanguagePlan,
});
assert.equal(aiOnlyAdvisoryGate.delivery_gate_status, "deliverable");
assert.equal(aiOnlyAdvisoryGate.customer_publish_eligible, true);
assert.deepEqual(aiOnlyAdvisoryGate.customer_publish_blockers, []);
assert.equal(aiOnlyAdvisoryGate.public_sample_ready, true);
assert.equal(aiOnlyAdvisoryGate.high_value_outreach_ready, true);

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
assert.equal(needsDocumentsGate.customer_publish_eligible, false);
assert.equal(needsDocumentsGate.customer_delivery_ready, needsDocumentsGate.customer_publish_eligible);
assert.equal(needsDocumentsGate.report_publishable, needsDocumentsGate.customer_publish_eligible);
assert.equal(needsDocumentsGate.report_blocked, !needsDocumentsGate.report_publishable);
assert.equal(needsDocumentsGate.readiness_hierarchy?.final_delivery_authority, "delivery_gate");

const optionalSupportingGapGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      required_core_docs_missing: false,
      customer_delivery_impact: "allow",
      blocks_customer_delivery: false,
    },
  },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [
      {
        code: "DEBT_FILE_WITH_MISSING_BALANCE",
        action_type: "source_document_limitation",
        owner_area: "source_documents",
        blocks_customer_delivery: true,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
});
assert.equal(optionalSupportingGapGate.delivery_gate_status, "deliverable");
assert.equal(optionalSupportingGapGate.customer_publish_eligible, true);
assert.equal(optionalSupportingGapGate.report_publishable, true);
assert.deepEqual(optionalSupportingGapGate.customer_publish_blockers, []);
assert.equal(optionalSupportingGapGate.customer_delivery_impact, "disclose_only");
assert.deepEqual(optionalSupportingGapGate.source_limitation_reason_codes, ["DEBT_FILE_WITH_MISSING_BALANCE"]);

const optionalSupportingContractViolationGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      required_core_docs_missing: false,
      customer_delivery_impact: "allow",
      blocks_customer_delivery: false,
    },
  },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "DEBT_FILE_WITH_MISSING_BALANCE",
        category: "source_documents",
        source_artifact: "source_report_coverage_qa",
        severity: "medium",
        blocks_customer_delivery: true,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [],
  },
});
assert.equal(optionalSupportingContractViolationGate.delivery_gate_status, "deliverable");
assert.equal(optionalSupportingContractViolationGate.customer_publish_eligible, true);
assert.equal(optionalSupportingContractViolationGate.report_publishable, true);
assert.deepEqual(optionalSupportingContractViolationGate.customer_publish_blockers, []);
assert.equal((optionalSupportingContractViolationGate.report_quality_advisories || []).includes("DEBT_FILE_WITH_MISSING_BALANCE"), true);

const hardContractDefectGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "core_sufficient_publishable",
      required_core_docs_missing: false,
      customer_delivery_impact: "allow",
      blocks_customer_delivery: false,
    },
  },
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
        category: "public_language",
        source_artifact: "report_contract_qa",
        severity: "critical",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [],
  },
});
assert.equal(hardContractDefectGate.delivery_gate_status, "admin_review_required");
assert.equal(hardContractDefectGate.customer_publish_eligible, false);
assert.equal(
  String(hardContractDefectGate.publish_decision_reason || "").startsWith("admin_review_required:HARD_PUBLIC_LANGUAGE_CONTRACT"),
  true
);

const tokenNamedPlan = buildQaActionPlan({
  sourceReportCoverageQa: { qa_status: "pass", deterministic_flags: [] },
  reportContractQa: { contract_status: "pass", violations: [] },
  qaFixRouting: null,
  propertyName: "123 Test Avenue - Final QA Sample",
});
assert.equal(tokenNamedPlan.property_name, "123 Test Avenue - Final QA Sample");

const canonicalPublishGateWithLegacyFalseFlags = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "pass",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: true, has_core_totals: true },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "section_constrained_publishable",
      required_core_docs_missing: false,
      blocks_customer_delivery: false,
    },
  },
  reportContractQa: {
    contract_status: "warn",
    customer_delivery_ready: false,
    violations: [
      {
        code: "SOFT_WARN_ONLY",
        severity: "medium",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [],
  },
});
assert.equal(canonicalPublishGateWithLegacyFalseFlags.delivery_gate_status, "deliverable");
assert.equal(canonicalPublishGateWithLegacyFalseFlags.report_publishable, true);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.customer_delivery_ready, true);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.customer_publish_eligible, true);
assert.deepEqual(canonicalPublishGateWithLegacyFalseFlags.customer_publish_blockers, []);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.report_blocked, false);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.customer_delivery_ready, canonicalPublishGateWithLegacyFalseFlags.customer_publish_eligible);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.readiness_hierarchy?.final_delivery_authority, "delivery_gate");
assert.equal(
  canonicalPublishGateWithLegacyFalseFlags.legacy_readiness_aliases?.public_sample_ready_non_authoritative_for_customer_delivery,
  true
);
assert.equal(
  canonicalPublishGateWithLegacyFalseFlags.legacy_readiness_aliases?.high_value_outreach_ready_non_authoritative_for_customer_delivery,
  true
);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.admin_review_required, false);
assert.equal(canonicalPublishGateWithLegacyFalseFlags.user_needs_documents, false);

// Regression lock: customer-delivery gate doctrine must remain stable.
const gateLockBaseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true },
  },
  core_input_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    required_core_docs_missing: false,
    customer_delivery_impact: "allow",
    blocks_customer_delivery: false,
  },
};

const gateLockScenario = ({
  sourceReportCoverageQa = gateLockBaseCoverage,
  reportContractQa = { contract_status: "pass", violations: [] },
  qaActionPlan = { customer_delivery_ready: true, prioritized_actions: [] },
}) => buildDeliveryGateDecision({ sourceReportCoverageQa, reportContractQa, qaActionPlan });

const gateLockOptionalSourceLimitation = gateLockScenario({
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [
      {
        code: "DEBT_FILE_WITH_MISSING_BALANCE",
        action_type: "source_document_limitation",
        owner_area: "source_documents",
        blocks_customer_delivery: true,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
});
assert.equal(gateLockOptionalSourceLimitation.delivery_gate_status, "deliverable");
assert.equal(gateLockOptionalSourceLimitation.customer_publish_eligible, true);
assert.equal(gateLockOptionalSourceLimitation.report_publishable, true);
assert.deepEqual(gateLockOptionalSourceLimitation.customer_publish_blockers, []);

const gateLockOptionalContractViolation = gateLockScenario({
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "DEBT_FILE_WITH_MISSING_BALANCE",
        category: "source_documents",
        source_artifact: "source_report_coverage_qa",
        severity: "medium",
        blocks_customer_delivery: true,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
});
assert.equal(gateLockOptionalContractViolation.delivery_gate_status, "deliverable");
assert.equal(gateLockOptionalContractViolation.customer_publish_eligible, true);
assert.equal(gateLockOptionalContractViolation.report_publishable, true);
assert.deepEqual(gateLockOptionalContractViolation.customer_publish_blockers, []);

const gateLockDiscloseOnlyReconciliation = gateLockScenario({
  sourceReportCoverageQa: {
    ...gateLockBaseCoverage,
    core_input_sufficiency_state: {
      publishability_bucket: "disclose_only_publishable",
      required_core_docs_missing: false,
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
    },
    source_reconciliation_state: {
      status: "source_reconciliation_required",
      publishability_bucket: "disclose_only_publishable",
      customer_delivery_impact: "disclose_only",
      public_outreach_impact: "block_until_review",
    },
    deterministic_flags: [
      {
        code: "RENT_ROLL_T12_RECONCILIATION_REQUIRED",
        severity: "medium",
        blocks_customer_delivery: false,
        routing: "public_sample_blocker",
        evidence: {
          source_reconciliation_state: {
            status: "source_reconciliation_required",
            publishability_bucket: "disclose_only_publishable",
            customer_delivery_impact: "disclose_only",
            public_outreach_impact: "block_until_review",
          },
        },
      },
    ],
  },
});
assert.equal(gateLockDiscloseOnlyReconciliation.delivery_gate_status, "deliverable");
assert.equal(gateLockDiscloseOnlyReconciliation.customer_publish_eligible, true);
assert.equal(gateLockDiscloseOnlyReconciliation.report_publishable, true);
assert.equal(gateLockDiscloseOnlyReconciliation.customer_delivery_impact, "disclose_only");
assert.deepEqual(gateLockDiscloseOnlyReconciliation.customer_publish_blockers, []);

const gateLockSelfHealRender = gateLockScenario({
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
        severity: "high",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: buildQaActionPlan({
    sourceReportCoverageQa: gateLockBaseCoverage,
    reportContractQa: {
      contract_status: "block",
      customer_delivery_ready: false,
      violations: [
        {
          code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
          severity: "high",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        },
      ],
    },
  }),
});
assert.equal(gateLockSelfHealRender.delivery_gate_status, "deliverable");
assert.equal(gateLockSelfHealRender.customer_publish_eligible, true);
assert.equal(gateLockSelfHealRender.report_publishable, true);
assert.deepEqual(gateLockSelfHealRender.customer_publish_blockers, []);

const gateLockPublicOnly = gateLockScenario({
  qaActionPlan: {
    customer_delivery_ready: false,
    prioritized_actions: [
      {
        code: "PUBLIC_SAMPLE_NOT_READY",
        action_type: "production_config_only",
        owner_area: "production_config",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(gateLockPublicOnly.delivery_gate_status, "deliverable");
assert.equal(gateLockPublicOnly.customer_publish_eligible, true);
assert.equal(gateLockPublicOnly.report_publishable, true);
assert.equal((gateLockPublicOnly.customer_publish_blockers || []).includes("PUBLIC_SAMPLE_NOT_READY"), false);

const gateLockHardDefect = gateLockScenario({
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
        category: "public_language",
        severity: "critical",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(gateLockHardDefect.delivery_gate_status, "admin_review_required");
assert.equal(gateLockHardDefect.customer_publish_eligible, false);

const gateLockMissingCoreDoc = gateLockScenario({
  sourceReportCoverageQa: {
    qa_status: "warn",
    deterministic_flags: [],
    artifact_inventory: {
      t12_parsed: { present: false, has_core_totals: false },
      rent_roll_parsed: { present: true },
    },
    core_input_sufficiency_state: {
      publishability_bucket: "user_needs_documents",
      required_core_docs_missing: true,
      customer_delivery_impact: "block",
      blocks_customer_delivery: true,
    },
  },
  qaActionPlan: { customer_delivery_ready: false, prioritized_actions: [] },
});
assert.equal(gateLockMissingCoreDoc.delivery_gate_status, "user_needs_documents");
assert.equal(gateLockMissingCoreDoc.customer_publish_eligible, false);
assert.equal(gateLockMissingCoreDoc.report_publishable, false);

const gateLockUnknownSoftContractCode = gateLockScenario({
  reportContractQa: {
    contract_status: "warn",
    customer_delivery_ready: true,
    violations: [
      {
        code: "FUTURE_SOFT_RENDER_WARNING",
        category: "report_contract",
        severity: "medium",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(gateLockUnknownSoftContractCode.delivery_gate_status, "deliverable");
assert.equal(gateLockUnknownSoftContractCode.customer_publish_eligible, true);
assert.equal(gateLockUnknownSoftContractCode.report_publishable, true);
assert.deepEqual(gateLockUnknownSoftContractCode.customer_publish_blockers, []);
assert.equal((gateLockUnknownSoftContractCode.report_quality_advisories || []).includes("FUTURE_SOFT_RENDER_WARNING"), true);
assert.equal(
  (gateLockUnknownSoftContractCode.report_quality_advisories || []).includes("UNCLASSIFIED_CUSTOMER_BLOCKER_REQUIRES_RATIONALE"),
  false
);

const gateLockUnknownExplicitContractBlock = gateLockScenario({
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "FUTURE_UNCLASSIFIED_CUSTOMER_BLOCKER",
        category: "report_contract",
        severity: "high",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(gateLockUnknownExplicitContractBlock.delivery_gate_status, "admin_review_required");
assert.equal(gateLockUnknownExplicitContractBlock.customer_publish_eligible, false);
assert.equal(gateLockUnknownExplicitContractBlock.report_publishable, false);
assert.equal(
  (gateLockUnknownExplicitContractBlock.report_quality_advisories || []).includes("UNCLASSIFIED_CUSTOMER_BLOCKER_REQUIRES_RATIONALE"),
  true
);
assert.equal(
  (gateLockUnknownExplicitContractBlock.customer_publish_blockers || []).includes("FUTURE_UNCLASSIFIED_CUSTOMER_BLOCKER") ||
    String(gateLockUnknownExplicitContractBlock.publish_decision_reason || "").includes("FUTURE_UNCLASSIFIED_CUSTOMER_BLOCKER"),
  true
);

const gateLockUnknownExplicitContractBlockWithRationale = gateLockScenario({
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "FUTURE_UNCLASSIFIED_CUSTOMER_BLOCKER_WITH_RATIONALE",
        category: "report_contract",
        severity: "high",
        blocks_customer_delivery: true,
        customer_block_reason: "runtime_customer_safety",
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.equal(gateLockUnknownExplicitContractBlockWithRationale.delivery_gate_status, "admin_review_required");
assert.equal(gateLockUnknownExplicitContractBlockWithRationale.customer_publish_eligible, false);
assert.equal(gateLockUnknownExplicitContractBlockWithRationale.report_publishable, false);
assert.equal(
  (gateLockUnknownExplicitContractBlockWithRationale.report_quality_advisories || []).includes("UNCLASSIFIED_CUSTOMER_BLOCKER_REQUIRES_RATIONALE"),
  false
);

const canonicalDeliverableOverrideGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    qa_status: "needs_documents",
    deterministic_flags: [{ code: "MISSING_REQUIRED_DOCUMENTS", severity: "high" }],
    artifact_inventory: {
      t12_parsed: { present: false, has_core_totals: false },
      rent_roll_parsed: { present: false },
    },
  },
  reportContractQa: {
    contract_status: "block",
    violations: [
      {
        code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
        category: "public_language",
        severity: "critical",
        blocks_customer_delivery: true,
      },
    ],
  },
  qaActionPlan: {
    prioritized_actions: [
      {
        code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
        action_type: "code_patch_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
      },
    ],
  },
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});
assert.equal(canonicalDeliverableOverrideGate.delivery_gate_status, "deliverable");
assert.equal(canonicalDeliverableOverrideGate.customer_publish_eligible, true);
assert.equal(canonicalDeliverableOverrideGate.report_publishable, true);
assert.equal(canonicalDeliverableOverrideGate.customer_delivery_ready, true);
assert.equal(canonicalDeliverableOverrideGate.report_blocked, false);
assert.equal(canonicalDeliverableOverrideGate.readiness_source, "canonical_delivery_state");
assert.equal(canonicalDeliverableOverrideGate.readiness_fallback_used, false);

const canonicalAdminReviewOverrideGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: gateLockBaseCoverage,
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "admin_review_required",
    customer_delivery_allowed: false,
    public_sample_ready: true,
    high_value_outreach_ready: true,
  },
});
assert.equal(canonicalAdminReviewOverrideGate.delivery_gate_status, "admin_review_required");
assert.equal(canonicalAdminReviewOverrideGate.customer_publish_eligible, false);
assert.equal(canonicalAdminReviewOverrideGate.report_publishable, false);
assert.equal(canonicalAdminReviewOverrideGate.customer_delivery_ready, false);
assert.equal(canonicalAdminReviewOverrideGate.report_blocked, true);

const canonicalNeedsDocsOverrideGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: gateLockBaseCoverage,
  reportContractQa: { contract_status: "pass", violations: [] },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
  canonicalDeliveryDecisionState: {
    source: "canonical_delivery_decision",
    delivery_gate_status: "user_needs_documents",
    customer_delivery_allowed: false,
    public_sample_ready: true,
    high_value_outreach_ready: true,
  },
});
assert.equal(canonicalNeedsDocsOverrideGate.delivery_gate_status, "user_needs_documents");
assert.equal(canonicalNeedsDocsOverrideGate.customer_publish_eligible, false);
assert.equal(canonicalNeedsDocsOverrideGate.report_publishable, false);
assert.equal(canonicalNeedsDocsOverrideGate.customer_delivery_ready, false);
assert.equal(canonicalNeedsDocsOverrideGate.report_blocked, true);
assert.equal(
  (canonicalNeedsDocsOverrideGate.report_quality_blockers || []).length > 0 ||
    (canonicalNeedsDocsOverrideGate.report_quality_advisories || []).length >= 0,
  true
);

console.log("qa-action-plan smoke PASS");
console.log(plan.prioritized_actions.map((action) => `${action.code}:${action.action_type}`).join(", "));
