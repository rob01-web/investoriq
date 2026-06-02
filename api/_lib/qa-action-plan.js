import { containsProhibitedPublicLanguage } from "./investoriq-qa-doctrine.js";

const ACTION_PLAN_VERSION = "phase_1_action_plan_2026_05_05";

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };

function normalizeSeverity(value) {
  const severity = String(value || "").toLowerCase();
  return severityRank[severity] ? severity : "low";
}

function highestSeverity(actions) {
  return (Array.isArray(actions) ? actions : []).reduce((highest, action) => (
    severityRank[normalizeSeverity(action?.severity)] > severityRank[highest]
      ? normalizeSeverity(action.severity)
      : highest
  ), "low");
}

function hasCriticalCompliance(actions) {
  return (Array.isArray(actions) ? actions : []).some((action) =>
    Boolean(action?.blocks_customer_delivery) &&
    (
      normalizeSeverity(action?.severity) === "critical" ||
      /BUY|SELL|HOLD|PUBLIC_LANGUAGE|RECOMMENDATION|VENDOR_LANGUAGE/i.test(String(action?.code || ""))
    )
  );
}

function pushAction(actions, action) {
  actions.push({
    code: action.code,
    title: action.title,
    source_artifact: action.source_artifact,
    severity: normalizeSeverity(action.severity),
    action_type: action.action_type,
    owner_area: action.owner_area,
    recommended_next_step: action.recommended_next_step,
    requires_code_patch: Boolean(action.requires_code_patch),
    requires_regeneration: Boolean(action.requires_regeneration),
    blocks_customer_delivery: Boolean(action.blocks_customer_delivery),
    blocks_public_sample: Boolean(action.blocks_public_sample),
    blocks_high_value_outreach: Boolean(action.blocks_high_value_outreach),
    safe_to_auto_fix: Boolean(action.safe_to_auto_fix),
    evidence: action.evidence || null,
  });
}

function summarizeCounts(actions) {
  const counts = {
    total: 0,
    by_action_type: {},
    by_owner_area: {},
    by_severity: {},
    requires_code_patch: 0,
    requires_regeneration: 0,
    blocks_public_sample: 0,
    blocks_high_value_outreach: 0,
    safe_to_auto_fix: 0,
  };
  for (const action of Array.isArray(actions) ? actions : []) {
    counts.total += 1;
    counts.by_action_type[action.action_type] = (counts.by_action_type[action.action_type] || 0) + 1;
    counts.by_owner_area[action.owner_area] = (counts.by_owner_area[action.owner_area] || 0) + 1;
    counts.by_severity[action.severity] = (counts.by_severity[action.severity] || 0) + 1;
    if (action.requires_code_patch) counts.requires_code_patch += 1;
    if (action.requires_regeneration) counts.requires_regeneration += 1;
    if (action.blocks_public_sample) counts.blocks_public_sample += 1;
    if (action.blocks_high_value_outreach) counts.blocks_high_value_outreach += 1;
    if (action.safe_to_auto_fix) counts.safe_to_auto_fix += 1;
  }
  return counts;
}

function hasDerivedAcquisitionEvidence(evidence) {
  const loan = evidence?.loan_term_sheet || evidence?.loan_term_sheet_parsed || evidence?.debt_payload || evidence || {};
  return Boolean(
    loan?.has_purchase_price ||
    loan?.has_derived_acquisition_debt ||
    Number(loan?.purchase_price) > 0 ||
    Number(loan?.derived_acquisition_loan_amount) > 0 ||
    loan?.debt_basis === "acquisition_financing_assumption"
  );
}

function hasCurrentDebtBalanceEvidence(evidence) {
  const loan = evidence?.mortgage_statement || evidence?.mortgage_statement_parsed || evidence || {};
  return Boolean(
    loan?.has_balance ||
    Number(loan?.outstanding_balance) > 0 ||
    Number(loan?.monthly_payment) > 0 ||
    Number(loan?.annual_debt_service) > 0
  );
}

function collectDebtContext({ sourceReportCoverageQa = null, qaFixRouting = null } = {}) {
  const candidates = [];
  const currentDebtState = sourceReportCoverageQa?.current_debt_state || null;
  const inventoryLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  if (inventoryLoan) candidates.push(inventoryLoan);
  const inventoryRentRoll = sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed;
  const renderedSignals = Array.isArray(sourceReportCoverageQa?.rendered_text_signals)
    ? sourceReportCoverageQa.rendered_text_signals
    : [];
  const deterministicFlags = Array.isArray(sourceReportCoverageQa?.deterministic_flags)
    ? sourceReportCoverageQa.deterministic_flags
    : [];
  let acquisitionFinancingRendered = renderedSignals.includes("acquisition_financing_assumptions");
  for (const flag of deterministicFlags) {
    if (flag?.evidence?.loan_term_sheet) candidates.push(flag.evidence.loan_term_sheet);
    if (flag?.evidence?.loan_term_sheet_parsed) candidates.push(flag.evidence.loan_term_sheet_parsed);
    if (flag?.evidence?.acquisition_financing?.rendered) acquisitionFinancingRendered = true;
  }
  for (const route of Array.isArray(qaFixRouting?.routes) ? qaFixRouting.routes : []) {
    if (route?.evidence?.loan_term_sheet) candidates.push(route.evidence.loan_term_sheet);
    if (route?.evidence?.loan_term_sheet_parsed) candidates.push(route.evidence.loan_term_sheet_parsed);
    if (route?.evidence?.acquisition_financing?.rendered) acquisitionFinancingRendered = true;
  }
  return {
    has_derived_acquisition_debt:
      Boolean(currentDebtState?.has_proposed_acquisition_financing) ||
      candidates.some((candidate) => hasDerivedAcquisitionEvidence(candidate)),
    has_current_debt_balance:
      Boolean(currentDebtState?.has_true_current_debt_balance) ||
      candidates.some((candidate) => hasCurrentDebtBalanceEvidence(candidate)),
    current_debt_state: currentDebtState,
    acquisition_assumption_state: sourceReportCoverageQa?.acquisition_assumption_state || null,
    acquisition_financing_rendered: acquisitionFinancingRendered,
    source_coverage_passed: sourceReportCoverageQa?.qa_status === "pass" || deterministicFlags.length === 0,
    rent_roll_present: Boolean(inventoryRentRoll?.present),
  };
}

function actionForReportFlag(flag, context = {}) {
  const code = String(flag?.code || "");
  const severity = flag?.severity || "medium";
  const text = [
    code,
    flag?.message,
    flag?.issue,
    flag?.suggested_review,
    flag?.rationale,
    flag?.evidence?.summary,
  ].filter(Boolean).join(" ");
  if (code === "MARKET_SURVEY_CLASSIFICATION_REVIEW" && context.source_coverage_passed && context.rent_roll_present) {
    return {
      code,
      title: "Market survey classification note",
      source_artifact: "report_qa_flags",
      severity: "low",
      action_type: "no_action_false_positive",
      owner_area: "qa_calibration",
      recommended_next_step: "No code action required when market survey parsing failed safely, a real rent roll parsed, and source coverage passed.",
      requires_code_patch: false,
      requires_regeneration: false,
      blocks_customer_delivery: false,
      blocks_public_sample: false,
      blocks_high_value_outreach: false,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "T12_TOTALS_ONLY") {
    return {
      code,
      title: "T12 line-item extraction gap",
      source_artifact: "report_qa_flags",
      severity,
      action_type: "parser_fix_required",
      owner_area: "parser",
      recommended_next_step: "Inspect T12 text/table extraction and add deterministic line-item support when the source contains line detail.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "DEBT_FILE_WITH_MISSING_BALANCE") {
    const derivedOnly =
      (hasDerivedAcquisitionEvidence(flag?.evidence) || context.has_derived_acquisition_debt) &&
      !hasCurrentDebtBalanceEvidence(flag?.evidence) &&
      !context.has_current_debt_balance;
    const derivedOnlyRendered = derivedOnly && context.acquisition_financing_rendered;
    return {
      code,
      title: derivedOnlyRendered
        ? "Acquisition financing is not current debt"
        : derivedOnly ? "Acquisition financing mapping review" : "Debt balance extraction gap",
      source_artifact: "report_qa_flags",
      severity: derivedOnlyRendered ? "low" : severity,
      action_type: derivedOnlyRendered ? "no_action_false_positive" : derivedOnly ? "artifact_mapping_fix_required" : "parser_fix_required",
      owner_area: derivedOnlyRendered ? "qa_calibration" : derivedOnly ? "report_mapping" : "parser",
      recommended_next_step: derivedOnlyRendered
        ? "No current debt balance action is required when proposed acquisition financing rendered separately and no true current debt balance was provided."
        : derivedOnly
        ? "Render proposed acquisition financing separately and do not use it as current debt or refinance balance."
        : "Inspect the debt source and parser before treating current DSCR/refi outputs as complete.",
      requires_code_patch: !derivedOnlyRendered,
      requires_regeneration: !derivedOnlyRendered,
      blocks_public_sample: !derivedOnlyRendered,
      blocks_high_value_outreach: !derivedOnlyRendered,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT") {
    const derivedOnly =
      (hasDerivedAcquisitionEvidence(flag?.evidence) || context.has_derived_acquisition_debt) &&
      !hasCurrentDebtBalanceEvidence(flag?.evidence) &&
      !context.has_current_debt_balance;
    const derivedOnlyRendered = derivedOnly && context.acquisition_financing_rendered;
    return {
      code,
      title: derivedOnly ? "Current DSCR source limitation with acquisition financing present" : "Debt DSCR render gating review",
      source_artifact: "report_qa_flags",
      severity: derivedOnlyRendered ? "low" : severity,
      action_type: derivedOnly ? "source_document_limitation" : "render_gating_fix_required",
      owner_area: derivedOnly ? "source_documents" : "report_renderer",
      recommended_next_step: derivedOnly
        ? "Keep current DSCR unassessed unless true current debt exists; verify acquisition DSCR renders separately."
        : "Inspect debt artifacts and current DSCR render gating.",
      requires_code_patch: !derivedOnly,
      requires_regeneration: !derivedOnly,
      blocks_public_sample: !derivedOnlyRendered,
      blocks_high_value_outreach: !derivedOnlyRendered,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (
    /unsupported.*acquisition.*assumptions|acquisition.*assumptions?.*unsupported|unsupported_acquisition_assumptions/i.test(text)
  ) {
    const acquisitionState = context.acquisition_assumption_state || null;
    const supportedAcquisitionAssumptions = Boolean(
      acquisitionState?.acquisition_assumptions_supported &&
      acquisitionState?.has_validated_acquisition_assumptions &&
      acquisitionState?.current_debt_separated &&
      context.acquisition_financing_rendered &&
      !context.has_current_debt_balance
    );
    return supportedAcquisitionAssumptions
      ? {
          code,
          title: "Acquisition assumptions are document-supported and rendered separately",
          source_artifact: "report_qa_flags",
          severity: "low",
          action_type: "no_action_false_positive",
          owner_area: "qa_calibration",
          recommended_next_step: "No action required when validated purchase assumptions are rendered separately and are not current debt.",
          requires_code_patch: false,
          requires_regeneration: false,
          blocks_public_sample: false,
          blocks_high_value_outreach: false,
          blocks_customer_delivery: false,
          safe_to_auto_fix: false,
          evidence: flag?.evidence || null,
        }
      : {
          code,
          title: "Acquisition assumptions support review",
          source_artifact: "report_qa_flags",
          severity,
          action_type: "source_document_limitation",
          owner_area: "source_documents",
          recommended_next_step: "Verify whether the acquisition assumptions are fully documented and supported before external distribution.",
          requires_code_patch: false,
          requires_regeneration: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
          blocks_customer_delivery: false,
          safe_to_auto_fix: false,
          evidence: flag?.evidence || null,
        };
  }
  if (code === "ACQUISITION_FINANCING_RENDER_MISSING") {
    return {
      code,
      title: "Acquisition financing section did not render",
      source_artifact: "report_qa_flags",
      severity,
      action_type: "render_gating_fix_required",
      owner_area: "report_renderer",
      recommended_next_step: "Inspect acquisition financing renderer, token replacement, and section gating.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "DOCRAPTOR_NOT_PRODUCTION_MODE") {
    return {
      code,
      title: "Production PDF configuration not enabled",
      source_artifact: "report_qa_flags",
      severity,
      action_type: "production_config_only",
      owner_area: "production_config",
      recommended_next_step: "Enable and verify production PDF mode before external distribution.",
      requires_code_patch: false,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (/BUY|SELL|HOLD|PUBLIC_LANGUAGE|RECOMMENDATION|VENDOR_LANGUAGE/i.test(code)) {
    return {
      code,
      title: "Critical public language compliance issue",
      source_artifact: "report_qa_flags",
      severity: "critical",
      action_type: "code_patch_required",
      owner_area: "report_renderer",
      recommended_next_step: "Remove prohibited public language at the deterministic template/render source and regenerate.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  return null;
}

function actionForCoverageFlag(flag) {
  const code = String(flag?.code || "");
  const severity = flag?.severity || "medium";
  if (code === "PUBLIC_SAMPLE_NOT_READY") return null;
  if (code === "T12_LINE_ITEM_DETAIL_MISSING") {
    return {
      code,
      title: "T12 line-item parser gap",
      source_artifact: "source_report_coverage_qa",
      severity,
      action_type: "parser_fix_required",
      owner_area: "parser",
      recommended_next_step: "Patch deterministic T12 extraction if source line items exist; otherwise classify as source-document limitation.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "RENOVATION_DOC_NOT_STRUCTURED") {
    return {
      code,
      title: "Renovation artifact extraction gap",
      source_artifact: "source_report_coverage_qa",
      severity,
      action_type: "artifact_mapping_fix_required",
      owner_area: "parser",
      recommended_next_step: "Classify and extract structured CapEx budget data when the uploaded source contains budget cues.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "RENT_ROLL_T12_RECONCILIATION_REQUIRED") {
    const state = flag?.evidence?.source_reconciliation_state || {};
    const parserSuspected = String(state?.status || "") === "parser_suspected";
    const publicOutreachBlocked = String(state?.public_outreach_impact || "") === "block_until_review";
    return {
      code,
      title: "Rent roll and T12 reconciliation review",
      source_artifact: "source_report_coverage_qa",
      severity: parserSuspected ? "high" : "medium",
      action_type: "source_document_limitation",
      owner_area: "source_reconciliation",
      recommended_next_step: parserSuspected
        ? "Review the rent roll and T12 extraction path for a parser or normalization issue before external use."
        : "Document the rent roll vs T12 variance, disclose it institutionally, and complete internal advisory review before external use.",
      requires_code_patch: false,
      requires_regeneration: false,
      blocks_customer_delivery: false,
      blocks_public_sample: publicOutreachBlocked,
      blocks_high_value_outreach: publicOutreachBlocked,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT") {
    const derivedOnly = hasDerivedAcquisitionEvidence(flag?.evidence) && !hasCurrentDebtBalanceEvidence(flag?.evidence);
    return {
      code,
      title: derivedOnly ? "Proposed acquisition financing display review" : "Purchase assumptions debt artifact gap",
      source_artifact: "source_report_coverage_qa",
      severity,
      action_type: derivedOnly ? "render_gating_fix_required" : "artifact_mapping_fix_required",
      owner_area: derivedOnly ? "report_renderer" : "parser",
      recommended_next_step: derivedOnly
        ? "Render proposed acquisition debt sizing separately without changing current debt/refi logic."
        : "Extract document-supported purchase/debt inputs or disclose limitation.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  if (
    code === "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED" ||
    code === "FULL_UNDERWRITING_SUPPORT_UNDERUSED" ||
    code === "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL" ||
    code === "CONTRADICTORY_INSUFFICIENT_DATA_CLASSIFICATION"
  ) {
    return {
      code,
      title: code === "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL" || code === "CONTRADICTORY_INSUFFICIENT_DATA_CLASSIFICATION"
        ? "Contradictory Insufficient Data classification"
        : "Full Underwriting depth underdeveloped",
      source_artifact: "source_report_coverage_qa",
      severity,
      action_type: "render_gating_fix_required",
      owner_area: "report_renderer",
      recommended_next_step: code === "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL" || code === "CONTRADICTORY_INSUFFICIENT_DATA_CLASSIFICATION"
        ? "Patch capital risk profile gating so core operating metrics prevent an Insufficient Data label."
        : "Inspect parser artifacts and section gating before external distribution.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: flag?.evidence || null,
    };
  }
  return null;
}

function actionForRoute(route) {
  if (!route || route.code === "PUBLIC_SAMPLE_REVIEW_HOLD") return null;
  const mapping = {
    display_fix: ["code_patch_required", "report_renderer"],
    parser_gap: ["parser_fix_required", "parser"],
    artifact_gap: ["artifact_mapping_fix_required", "parser"],
    render_gating_gap: ["render_gating_fix_required", "report_renderer"],
    source_insufficient: ["source_document_limitation", "source_documents"],
  };
  const [actionType, ownerArea] = mapping[route.routing] || [];
  if (!actionType) return null;
  return {
    code: route.code,
    title: route.message || "QA route requires action",
    source_artifact: "qa_fix_routing",
    severity: route.severity || "medium",
    action_type: actionType,
    owner_area: ownerArea,
    recommended_next_step: route.action || "Inspect QA route and resolve before external use.",
    requires_code_patch: ["display_fix", "parser_gap", "artifact_gap", "render_gating_gap"].includes(route.routing),
    requires_regeneration: Boolean(route.requires_regeneration),
    blocks_public_sample: Boolean(route.public_sample_blocker),
    blocks_high_value_outreach: Boolean(route.public_sample_blocker),
    safe_to_auto_fix: Boolean(route.safe_auto_fix),
    evidence: route.evidence || null,
  };
}

function actionForRenderedFinding(finding) {
  const text = [finding?.code, finding?.issue, finding?.message, finding?.suggested_review, finding?.excerpt]
    .filter(Boolean)
    .join(" ");
  if (!text) return null;
  const excerptText = String(finding?.excerpt || "");
  const issueText = String(finding?.issue || finding?.message || "");
  const actualReportText = excerptText || issueText;
  const prohibitedPublicLanguage = containsProhibitedPublicLanguage(actualReportText);
  const softComplianceReview =
    String(finding?.category || "").toLowerCase() === "compliance" ||
    /investment recommendation|recommendation language|rating|ratings/i.test(text);
  const display = /DATA NOT AVAILABLE|placeholder|template token|mojibake|insufficient data|not assessed/i.test(text);
  if (!prohibitedPublicLanguage && !softComplianceReview && !display) return null;
  if (softComplianceReview && !prohibitedPublicLanguage && !display) {
    return {
      code: "RENDERED_LANGUAGE_REVIEW",
      title: "Rendered language review",
      source_artifact: "rendered_report_qa_advisory",
      severity: normalizeSeverity(finding?.severity) === "warn" ? "medium" : "low",
      action_type: "no_action_false_positive",
      owner_area: "qa_calibration",
      recommended_next_step: "No deterministic code action required unless the excerpt contains prohibited recommendation, public model/vendor, guarantee, or fabricated-certainty language.",
      requires_code_patch: false,
      requires_regeneration: false,
      blocks_customer_delivery: false,
      blocks_public_sample: false,
      blocks_high_value_outreach: false,
      safe_to_auto_fix: false,
      evidence: {
        excerpt: finding?.excerpt || null,
        suggested_review: finding?.suggested_review || null,
      },
    };
  }
  return {
    code: finding?.code || (prohibitedPublicLanguage ? "PUBLIC_LANGUAGE_COMPLIANCE_REVIEW" : "RENDERED_DISPLAY_REVIEW"),
    title: prohibitedPublicLanguage ? "Rendered compliance language review" : "Rendered display polish review",
    source_artifact: "rendered_report_qa_advisory",
    severity: prohibitedPublicLanguage ? "critical" : finding?.severity || "medium",
    action_type: prohibitedPublicLanguage ? "code_patch_required" : "render_gating_fix_required",
    owner_area: "report_renderer",
    recommended_next_step: prohibitedPublicLanguage
      ? "Remove prohibited public language at the deterministic render source and regenerate."
      : "Patch deterministic rendering or section gating if the warning is valid.",
    requires_code_patch: true,
    requires_regeneration: true,
    blocks_customer_delivery: prohibitedPublicLanguage,
    blocks_public_sample: true,
    blocks_high_value_outreach: true,
    safe_to_auto_fix: false,
    evidence: {
      excerpt: finding?.excerpt || null,
      suggested_review: finding?.suggested_review || null,
    },
  };
}

function isHardPublicLanguageExcerpt(text) {
  return containsProhibitedPublicLanguage(text);
}

function managerSuppressesRenderedFinding(qaManagerReview, finding) {
  const excerpt = String(finding?.excerpt || "").toLowerCase();
  const code = String(finding?.code || finding?.issue || finding?.message || "").toLowerCase();
  return (Array.isArray(qaManagerReview?.decisions) ? qaManagerReview.decisions : []).some((decision) => {
    if (decision?.classification !== "false_positive" && decision?.classification !== "no_action") return false;
    if (String(decision?.source_artifact || "").toLowerCase() !== "rendered_report_qa_advisory") return false;
    const decisionCode = String(decision?.source_code || "").toLowerCase();
    const decisionExcerpt = String(decision?.evidence_excerpt || "").toLowerCase();
    return (
      (decisionCode && code && (decisionCode === code || code.includes(decisionCode))) ||
      (decisionExcerpt && excerpt && (decisionExcerpt.includes(excerpt) || excerpt.includes(decisionExcerpt)))
    );
  });
}

function actionForManagerDecision(decision) {
  const classification = String(decision?.classification || "");
  if (classification === "false_positive" || classification === "no_action") {
    return null;
  }
  const sourceCode = String(decision?.source_code || "");

  const actionTypeByClassification = {
    real_parser_or_artifact_risk: "parser_fix_required",
    real_source_report_contradiction: "render_gating_fix_required",
    real_public_language_risk: "code_patch_required",
    source_document_limitation: "source_document_limitation",
    production_config_only: "production_config_only",
    admin_review_optional: "model_review_recommended",
  };
  const ownerByClassification = {
    real_parser_or_artifact_risk: "parser",
    real_source_report_contradiction: "report_renderer",
    real_public_language_risk: "report_renderer",
    source_document_limitation: "source_documents",
    production_config_only: "production_config",
    admin_review_optional: "qa_manager",
  };
  const actionType = actionTypeByClassification[classification];
  if (!actionType) return null;

  const contradictionReview = classification === "real_source_report_contradiction";
  const hardPublicLanguage = classification === "real_public_language_risk" &&
    isHardPublicLanguageExcerpt(decision?.evidence_excerpt);
  const speculativePublicLanguage = classification === "real_public_language_risk" && !hardPublicLanguage;
  const sourceTotalsVerification = sourceCode === "rent_roll_vs_t12_gpr_discrepancy";
  const contradictionBlocksCustomer = Boolean(decision?.blocks_customer_delivery);
  const requiresCodePatch = hardPublicLanguage ||
    (!speculativePublicLanguage &&
      classification !== "admin_review_optional" &&
      classification !== "source_document_limitation" &&
      classification !== "production_config_only" &&
      Boolean(decision?.requires_code_patch));
  const adminReadableNextStep = sourceTotalsVerification
    ? "Review rent roll unit rows, rent roll summary totals, and T12 GPR. Confirm which source total should control before regenerating."
    : "Review the uploaded source documents and parsed values. Confirm the correct source-backed value before regenerating.";

  return {
    code: sourceCode || "QA_MANAGER_REVIEW",
    title: sourceTotalsVerification
      ? "Rent roll source totals require verification"
      : contradictionReview
      ? "Source-document reconciliation requires verification"
      : decision?.rationale || "QA manager review decision",
    source_artifact: "qa_manager_review",
    severity: hardPublicLanguage ? "critical" : normalizeSeverity(decision?.severity),
    action_type: sourceTotalsVerification
      ? "source_document_limitation"
      : contradictionReview
      ? contradictionBlocksCustomer
        ? "admin_review_required"
        : "source_reconciliation_review_recommended"
      : hardPublicLanguage
      ? "code_patch_required"
      : speculativePublicLanguage
      ? "model_review_recommended"
      : actionType,
    owner_area: sourceTotalsVerification
      ? "source_reconciliation"
      : contradictionReview
      ? "source_reconciliation"
      : speculativePublicLanguage
      ? "qa_manager"
      : ownerByClassification[classification],
    recommended_next_step: speculativePublicLanguage
      ? "Review manually only if actual rendered excerpt contains prohibited public language."
      : sourceTotalsVerification
      ? adminReadableNextStep
      : contradictionReview
      ? adminReadableNextStep
      : decision?.recommended_action_type || "Review QA manager decision.",
    requires_code_patch: requiresCodePatch,
    requires_regeneration: Boolean(decision?.requires_regeneration),
    blocks_customer_delivery: sourceTotalsVerification
      ? false
      : contradictionReview
      ? contradictionBlocksCustomer
      : hardPublicLanguage,
    blocks_public_sample: sourceTotalsVerification
      ? true
      : contradictionReview
      ? true
      : !speculativePublicLanguage && (Boolean(decision?.blocks_public_sample) || hardPublicLanguage),
    blocks_high_value_outreach: sourceTotalsVerification
      ? true
      : contradictionReview
      ? true
      : !speculativePublicLanguage && (Boolean(decision?.blocks_high_value_outreach) || hardPublicLanguage),
    safe_to_auto_fix: false,
    evidence: {
      classification,
      source_artifact: decision?.source_artifact || null,
      source_code: sourceCode || null,
      evidence_excerpt: decision?.evidence_excerpt || null,
      rationale: decision?.rationale || null,
    },
  };
}

function actionForReportContractViolation(violation) {
  if (!violation) return null;
  const code = String(violation?.code || "REPORT_CONTRACT_VIOLATION");
  const hardPublicOrDebug =
    code === "HARD_PUBLIC_LANGUAGE_CONTRACT" ||
    String(violation?.category || "") === "public_language";
  if (code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION") {
    return {
      code,
      title: violation?.message || "Rent roll total normalization contradiction",
      source_artifact: "report_contract_qa",
      severity: "high",
      action_type: "render_gating_fix_required",
      owner_area: "rent_roll_normalizer",
      recommended_next_step: "Inspect rent roll total normalization and regenerate.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: violation?.evidence || null,
    };
  }
  if (code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH") {
    return {
      code,
      title: "Current debt DSCR reconciliation mismatch",
      source_artifact: "report_contract_qa",
      severity: "high",
      action_type: "admin_review_required",
      owner_area: "report_renderer",
      recommended_next_step: "Align all rendered current-debt DSCR values to the source-of-truth current debt service basis before external distribution.",
      requires_code_patch: true,
      requires_regeneration: true,
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
      safe_to_auto_fix: false,
      evidence: violation?.evidence || null,
    };
  }
  const materiallyMisleadingDebt =
    code === "UNSUPPORTED_CURRENT_DEBT_RENDERED" ||
    code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED";
  const deterministicSelfHealEligible = classifyReportContractViolationCode(code) === "self_heal_render" || (
    code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH" &&
    isDiscloseOnlySourceReconciliationState(violation?.evidence?.source_reconciliation_state)
  );
  const actionType = hardPublicOrDebug ? "code_patch_required" : "render_gating_fix_required";
  return {
    code,
    title: violation?.message || "Rendered report contract violation",
    source_artifact: "report_contract_qa",
    severity: hardPublicOrDebug ? "critical" : normalizeSeverity(violation?.severity),
    action_type: actionType,
    owner_area: hardPublicOrDebug ? "report_renderer" : "qa_contract",
    recommended_next_step: hardPublicOrDebug
      ? "Remove prohibited public/internal/debug language at the deterministic render source and regenerate."
      : deterministicSelfHealEligible
      ? "Apply deterministic self-heal (collapse/omit/qualify/replace with canonical disclosure) for the affected rendered surface, then regenerate."
      : "Patch deterministic renderer gating so the unsupported table, section, label, or report-type content cannot render.",
    requires_code_patch: true,
    requires_regeneration: true,
    blocks_customer_delivery:
      deterministicSelfHealEligible
        ? false
        : Boolean(violation?.blocks_customer_delivery) || (hardPublicOrDebug || materiallyMisleadingDebt),
    blocks_public_sample: Boolean(violation?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(violation?.blocks_high_value_outreach),
    safe_to_auto_fix: false,
    evidence: violation?.evidence || null,
  };
}

function dedupeActions(actions) {
  const seen = new Set();
  return actions.filter((action) => {
    const key = action.code;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sortActions(actions) {
  return [...actions].sort((a, b) => (
    severityRank[normalizeSeverity(b.severity)] - severityRank[normalizeSeverity(a.severity)] ||
    Number(b.blocks_public_sample) - Number(a.blocks_public_sample) ||
    Number(b.requires_code_patch) - Number(a.requires_code_patch)
  ));
}

function buildRootCauseSummary(actions) {
  const counts = summarizeCounts(actions);
  return {
    parser_work_needed: Boolean(counts.by_action_type.parser_fix_required),
    artifact_mapping_work_needed: Boolean(counts.by_action_type.artifact_mapping_fix_required),
    render_gating_work_needed: Boolean(counts.by_action_type.render_gating_fix_required),
    production_config_only: counts.total > 0 && counts.total === (counts.by_action_type.production_config_only || 0),
    source_document_limitation_present: Boolean(counts.by_action_type.source_document_limitation),
    public_sample_blocked_by_rollup_only: false,
  };
}

function deliveryRecommendation({ actions, publicSampleReady, customerReady }) {
  if (!customerReady) return "regenerate_after_code_or_mapping_fix";
  if (actions.some((action) => action.action_type === "source_document_limitation") && actions.every((action) => !action.requires_code_patch)) {
    return "source_package_insufficient";
  }
  if (actions.some((action) => action.requires_code_patch)) return "regenerate_after_code_or_mapping_fix";
  if (!publicSampleReady) return "distribution_context_review";
  if (actions.length > 0) return "customer_deliverable_with_internal_warning";
  return "customer_deliverable";
}

function resolveCanonicalReadinessOverride({
  deliveryDecisionState = null,
  canonicalDeliveryDecisionState = null,
  deliveryGateDecision = null,
  delivery_gate_decision = null,
} = {}) {
  const candidates = [
    canonicalDeliveryDecisionState,
    deliveryDecisionState,
    deliveryGateDecision,
    delivery_gate_decision,
  ];
  for (const raw of candidates) {
    if (!raw || typeof raw !== "object") continue;
    const hasCanonicalShape =
      raw.delivery_gate_status !== undefined ||
      raw.customer_delivery_allowed !== undefined ||
      raw.customer_publish_eligible !== undefined ||
      raw.customer_delivery_ready !== undefined;
    if (!hasCanonicalShape) continue;
    const normalized = raw?.source === "canonical_delivery_decision"
      ? raw
      : buildCanonicalDeliveryDecisionState(raw);
    return {
      present: true,
      normalized,
      has_public_sample_ready: raw.public_sample_ready !== undefined,
      has_high_value_outreach_ready: raw.high_value_outreach_ready !== undefined,
    };
  }
  return {
    present: false,
    normalized: null,
    has_public_sample_ready: false,
    has_high_value_outreach_ready: false,
  };
}

function reasonCodeForAction(action) {
  return String(action?.code || "");
}

function uniqueCodes(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

const legacyCustomerBlockerFallbackCodes = new Set([
  "RENDERED_TEMPLATE_TOKEN_LEAK",
  "RENDERED_MOJIBAKE_LEAK",
  "PUBLIC_LANGUAGE_CONTRACT_VIOLATION",
  "HARD_PUBLIC_LANGUAGE_CONTRACT",
  "INTERNAL_DEBUG_LANGUAGE_LEAK",
  "UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED",
  "CORE_METRICS_WITH_INSUFFICIENT_DATA_CONTRACT",
]);

const deterministicCustomerHardDefectCodes = new Set([
  "RENDERED_TEMPLATE_TOKEN_LEAK",
  "RENDERED_MOJIBAKE_LEAK",
  "PUBLIC_LANGUAGE_CONTRACT_VIOLATION",
  "HARD_PUBLIC_LANGUAGE_CONTRACT",
  "INTERNAL_DEBUG_LANGUAGE_LEAK",
  "CORE_METRICS_WITH_INSUFFICIENT_DATA_CONTRACT",
]);

const deterministicRegenerationRequiredCodes = new Set([
  "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
  "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
  "RENDERED_PLACEHOLDER_METRIC_VALUE",
  "RENDERED_PLACEHOLDER_VALUE_LEAK",
  "RENDERED_TEMPLATE_TOKEN_LEAK",
  "RENDERED_MOJIBAKE_LEAK",
  "PUBLIC_LANGUAGE_CONTRACT_VIOLATION",
  "HARD_PUBLIC_LANGUAGE_CONTRACT",
  "INTERNAL_DEBUG_LANGUAGE_LEAK",
  "REPORT_TYPE_SECTION_LEAK",
  "UNSUPPORTED_CURRENT_DEBT_RENDERED",
  "UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED",
  "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
  "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
  "SCREENING_UNDERWRITING_SECTION_LEAK",
  "CORE_METRICS_WITH_INSUFFICIENT_DATA_CONTRACT",
]);

const knownSelfHealRenderContractCodes = new Set([
  "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
  "CURRENT_DEBT_COMPUTED_STALE_LIMITATION_COPY",
  "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
  "RENDERED_PLACEHOLDER_METRIC_VALUE",
  "RENDERED_PLACEHOLDER_VALUE_LEAK",
  "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
  "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
  "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT",
  "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
  "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT",
  "SECTION_ELIGIBILITY_CURRENT_DEBT_RENDER_DRIFT",
  "SECTION_ELIGIBILITY_REFI_RENDER_DRIFT",
  "REPORT_TYPE_SECTION_LEAK",
  "SCREENING_UNDERWRITING_SECTION_LEAK",
  "UNSUPPORTED_CURRENT_DEBT_RENDERED",
  "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
  "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
]);

function classifyReportContractViolationCode(code = "") {
  const normalized = String(code || "").toUpperCase();
  if (!normalized) return "unknown";
  if (knownSelfHealRenderContractCodes.has(normalized)) return "self_heal_render";
  if (isNonNegotiableCustomerHardDefect(normalized)) return "hard_customer_defect";
  return "unknown";
}

function hasRecognizedCustomerBlockRationaleMetadata(violation = null) {
  if (!violation || typeof violation !== "object") return false;
  const explicitReason = String(
    violation?.customer_block_reason ||
    violation?.customer_block_rationale ||
    violation?.customer_safety_class ||
    violation?.delivery_block_class ||
    ""
  ).trim();
  if (explicitReason) return true;
  const category = String(violation?.category || "").trim().toLowerCase();
  const recognizedHardCategories = new Set([
    "public_language",
    "section_gating_contract",
    "report_type_contract",
    "debt_contract",
    "system_contract_failure",
  ]);
  if (recognizedHardCategories.has(category)) return true;
  const customerImpact = normalizeImpactValue(violation?.customer_delivery_impact);
  const hasExplicitBlockingImpact = [
    "block",
    "blocked",
    "customer_blocked",
    "customer_delivery_blocked",
    "customer_delivery_blocker",
  ].includes(customerImpact);
  return hasExplicitBlockingImpact && Boolean(explicitReason || recognizedHardCategories.has(category));
}

const managerContradictionLimitationCodes = new Set([
  "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
  "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
  "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
  "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
  "DEBT_FILE_WITH_MISSING_BALANCE",
]);

const managerContradictionCorroboratingCoverageCodes = new Set([
  "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL",
  "T12_LINE_ITEM_DETAIL_MISSING",
  "RENOVATION_DOC_NOT_STRUCTURED",
]);

function isManagerContradictionAction(action) {
  return (
    String(action?.source_artifact || "") === "qa_manager_review" &&
    String(action?.evidence?.classification || "") === "real_source_report_contradiction"
  );
}

function isManagerContradictionCustomerBlocking(action, {
  contractViolations = [],
  deterministicFlags = [],
} = {}) {
  if (!isManagerContradictionAction(action)) return false;

  const hardPublicLanguage = containsProhibitedPublicLanguage(String(action?.evidence?.evidence_excerpt || ""));

  const contractBlocksCustomer = (Array.isArray(contractViolations) ? contractViolations : []).some((violation) => {
    if (!violation) return false;
    const violationCode = String(violation?.code || "").toUpperCase();
    if (violation?.blocks_customer_delivery === true) return true;
    if (violation?.blocks_customer_delivery === false) return false;
    if (
      violationCode === "HARD_PUBLIC_LANGUAGE_CONTRACT" ||
      String(violation?.category || "") === "public_language"
    ) {
      return true;
    }
    if (violationCode === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION") {
      return true;
    }
    return classifyActionDeliveryImpact(actionForReportContractViolation(violation)) === "customer_delivery_blocker";
  });

  const deterministicBlocksCustomer = (Array.isArray(deterministicFlags) ? deterministicFlags : []).some((flag) => {
    const flagCode = String(flag?.code || "").toUpperCase();
    const routing = String(flag?.routing || "");
    const explicitCustomerBlock =
      Boolean(flag?.blocks_customer_delivery) ||
      Boolean(flag?.customer_delivery_blocker) ||
      ["block", "blocked", "customer_blocked", "customer_delivery_blocked", "customer_delivery_blocker"].includes(
        normalizeImpactValue(flag?.evidence?.customer_delivery_impact)
      ) ||
      ["block", "blocked", "customer_blocked", "customer_delivery_blocked", "customer_delivery_blocker"].includes(
        normalizeImpactValue(flag?.evidence?.source_reconciliation_state?.customer_delivery_impact)
      );
    return (
      flagCode &&
      explicitCustomerBlock &&
      !managerContradictionLimitationCodes.has(flagCode) &&
      managerContradictionCorroboratingCoverageCodes.has(flagCode) &&
      ["parser_gap", "artifact_gap", "render_gating_gap", "admin_review_required"].includes(routing)
    );
  });

  return hardPublicLanguage || contractBlocksCustomer || deterministicBlocksCustomer;
}

function isCustomerPublishBlockingViolation(violation) {
  return isCustomerPublishBlockingViolationWithContext(violation);
}

function isCustomerPublishBlockingViolationWithContext(violation, {
  coreSufficiencyPublishable = false,
} = {}) {
  if (!violation) return false;
  const code = String(violation?.code || "").toUpperCase();
  if (!code) return false;
  const contractClass = classifyReportContractViolationCode(code);
  const isDeterministicSelfHealRenderViolation =
    contractClass === "self_heal_render" ||
    (
      code === "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH" &&
      isDiscloseOnlySourceReconciliationState(violation?.evidence?.source_reconciliation_state)
    );
  if (isDeterministicSelfHealRenderViolation) return false;
  if (isOptionalSupportingContractOverblockViolation(violation, { coreSufficiencyPublishable })) return false;
  const customerImpact = normalizeImpactValue(
    violation?.customer_delivery_impact ??
    violation?.evidence?.customer_delivery_impact
  );
  const explicitlyNonBlockingImpact = [
    "allow",
    "disclose_only",
    "advisory_only",
    "public_only",
    "public_outreach_only",
  ].includes(customerImpact);
  if (violation?.blocks_customer_delivery === true) return true;
  if (violation?.blocks_customer_delivery === false) {
    return isNonNegotiableCustomerHardDefect(code);
  }
  if (explicitlyNonBlockingImpact) return false;
  return isNonNegotiableCustomerHardDefect(code) || legacyCustomerBlockerFallbackCodes.has(code);
}

function isOptionalSupportingContractOverblockViolation(violation, {
  coreSufficiencyPublishable = false,
} = {}) {
  if (!coreSufficiencyPublishable) return false;
  if (!violation) return false;
  const code = String(violation?.code || "").toUpperCase();
  if (!code || isNonNegotiableCustomerHardDefect(code)) return false;
  if (violation?.blocks_customer_delivery !== true) return false;
  const category = String(violation?.category || "").toLowerCase();
  const sourceArtifact = String(violation?.source_artifact || "").toLowerCase();
  return (
    category.includes("source_document") ||
    category.includes("source_report_coverage") ||
    category.includes("source_documents") ||
    sourceArtifact.includes("source_report_coverage_qa")
  );
}

function normalizeImpactValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function hasExplicitCustomerBlockImpact(value) {
  const normalized = normalizeImpactValue(value);
  return [
    "block",
    "blocked",
    "customer_blocked",
    "customer_delivery_blocked",
    "customer_delivery_blocker",
  ].includes(normalized);
}

function isDiscloseOnlySourceReconciliationState(state) {
  if (!state || typeof state !== "object") return false;
  const publishabilityBucket = normalizeImpactValue(state?.publishability_bucket);
  const customerDeliveryImpact = normalizeImpactValue(state?.customer_delivery_impact);
  if (publishabilityBucket === "disclose_only_publishable") return true;
  if (customerDeliveryImpact === "disclose_only") return true;
  if (hasExplicitCustomerBlockImpact(customerDeliveryImpact)) return false;
  if (publishabilityBucket === "user_needs_documents" || publishabilityBucket === "admin_review_required" || publishabilityBucket === "system_contract_failure") return false;
  return String(state?.status || "") === "source_reconciliation_required";
}

function isNonNegotiableCustomerHardDefect(code) {
  const normalized = String(code || "").toUpperCase();
  if (!normalized) return false;
  return deterministicCustomerHardDefectCodes.has(normalized);
}

function isCoreInputCustomerFailClosed(coreInputSufficiencyState = null) {
  const state = coreInputSufficiencyState && typeof coreInputSufficiencyState === "object"
    ? coreInputSufficiencyState
    : {};
  const bucket = normalizeImpactValue(state?.publishability_bucket);
  const customerImpact = normalizeImpactValue(state?.customer_delivery_impact);
  const hasTypedBlockingSignal =
    state?.blocks_customer_delivery === true ||
    state?.fail_closed === true ||
    state?.system_contract_failure === true ||
    state?.required_core_docs_missing === true ||
    [
      "block",
      "blocked",
      "customer_blocked",
      "customer_delivery_blocked",
      "customer_delivery_blocker",
    ].includes(customerImpact) ||
    bucket === "user_needs_documents" ||
    bucket === "system_contract_failure";
  if (hasTypedBlockingSignal) return true;

  const hasTypedNonBlockingSignal =
    state?.blocks_customer_delivery === false ||
    ["allow", "disclose_only", "advisory_only", "public_only", "public_outreach_only"].includes(customerImpact);
  if (hasTypedNonBlockingSignal) return false;

  const reasonCode = String(state?.reason_code || "").toLowerCase();
  return (
    reasonCode.includes("equation_mismatch") ||
    reasonCode.includes("core_input_verification_inconsistency") ||
    reasonCode.includes("system_contract_failure") ||
    reasonCode.includes("deterministic_failure")
  );
}

function classifySourceFlagDeliveryImpact(flag) {
  if (!flag) return false;
  if (Boolean(flag?.blocks_customer_delivery)) return true;
  if (Boolean(flag?.customer_delivery_blocker)) return true;
  if (String(flag?.classification || "").toLowerCase() === "missing_required_source") return true;
  const customerDeliveryImpact = normalizeImpactValue(flag?.evidence?.customer_delivery_impact);
  const reconciliationImpact = normalizeImpactValue(flag?.evidence?.source_reconciliation_state?.customer_delivery_impact);
  const blockingImpacts = new Set([
    "block",
    "blocked",
    "customer_blocked",
    "customer_delivery_blocked",
    "customer_delivery_blocker",
  ]);
  if (blockingImpacts.has(customerDeliveryImpact)) return true;
  if (blockingImpacts.has(reconciliationImpact)) return true;
  return false;
}

function isRegenerationRequiredViolation(violation) {
  if (!violation) return false;
  const code = String(violation?.code || "").toUpperCase();
  return deterministicRegenerationRequiredCodes.has(code);
}

function isCustomerRegenerationRequiredCode(code, {
  actionRows = [],
  contractViolations = [],
  deterministicFlags = [],
} = {}) {
  const normalized = String(code || "").toUpperCase();
  if (!normalized || !deterministicRegenerationRequiredCodes.has(normalized)) return false;

  const contractMatch = (Array.isArray(contractViolations) ? contractViolations : [])
    .find((violation) => String(violation?.code || "").toUpperCase() === normalized);
  if (contractMatch) {
    if (contractMatch?.blocks_customer_delivery === true) return true;
    if (contractMatch?.blocks_customer_delivery === false) {
      return isNonNegotiableCustomerHardDefect(normalized);
    }
  }

  const actionMatches = (Array.isArray(actionRows) ? actionRows : [])
    .filter((action) => String(action?.code || "").toUpperCase() === normalized);
  if (actionMatches.some((action) => action?.blocks_customer_delivery === true)) return true;
  if (actionMatches.some((action) => action?.blocks_customer_delivery === false)) {
    return isNonNegotiableCustomerHardDefect(normalized);
  }

  const deterministicMatch = (Array.isArray(deterministicFlags) ? deterministicFlags : [])
    .find((flag) => String(flag?.code || "").toUpperCase() === normalized);
  if (deterministicMatch && classifySourceFlagDeliveryImpact(deterministicMatch)) return true;

  return isNonNegotiableCustomerHardDefect(normalized);
}

function buildPublishEligibilitySummary({
  deliveryGateStatus = "deliverable",
  reasonCode = null,
  sourceReportCoverageQa = null,
  reportContractQa = null,
  qaActionPlan = null,
  prioritizedActions = [],
  contractViolations = [],
  deterministicFlags = [],
  sourceNeedsDocs = false,
  customerDeliveryBlockerAction = null,
  managerContradictionAction = null,
  managerContradictionBlocksCustomer = false,
  reconciliationViolation = null,
  publicOrOutreachOnlyAction = null,
  deliveryDecisionState = null,
  canonicalDeliveryDecisionState = null,
  delivery_gate_decision = null,
  deliveryGateDecision = null,
}) {
  const sourceReconciliationState = sourceReportCoverageQa?.source_reconciliation_state || null;
  const coreInputSufficiencyState = sourceReportCoverageQa?.core_input_sufficiency_state || null;
  const coreSufficiencyPublishable = isCoreSufficiencyPublishableBucket(coreInputSufficiencyState?.publishability_bucket);
  const coreValidRequiredCoverage = isCoreValidRequiredCoverageState(sourceReportCoverageQa);
  const sourceReconciliationIsDiscloseOnly = isDiscloseOnlySourceReconciliationState(sourceReconciliationState);
  const sourceInventory = sourceReportCoverageQa?.artifact_inventory || {};
  const t12Ready = Boolean(sourceInventory?.t12_parsed?.present && sourceInventory?.t12_parsed?.has_core_totals);
  const rentRollReady = Boolean(sourceInventory?.rent_roll_parsed?.present);
  const requiredCoreCoverageReady = t12Ready && rentRollReady;

  const deterministicPublicSampleBlockers = uniqueCodes(
    (Array.isArray(deterministicFlags) ? deterministicFlags : [])
      .filter((flag) => String(flag?.routing || "") === "public_sample_blocker")
      .map((flag) => flag?.code)
  );
  const actionRows = Array.isArray(prioritizedActions) ? prioritizedActions : [];
  const customerActionBlockers = actionRows
    .filter((action) => {
      if (isOptionalSupportingOverblockAction(action, { coreSufficiencyPublishable })) return false;
      if (coreValidRequiredCoverage && isCoreValidNonBlockingIssueCode(action?.code)) return false;
      return isManagerContradictionAction(action)
        ? managerContradictionBlocksCustomer
        : classifyActionDeliveryImpact(action) === "customer_delivery_blocker";
    })
    .map((action) => action?.code);
  const publicSampleActionBlockers = actionRows
    .filter((action) => Boolean(action?.blocks_public_sample))
    .map((action) => action?.code);
  const outreachActionBlockers = actionRows
    .filter((action) => Boolean(action?.blocks_high_value_outreach))
    .map((action) => action?.code);
  const advisoryOnlyFindings = uniqueCodes([
    ...actionRows
      .filter((action) => classifyActionDeliveryImpact(action) === "advisory_only")
      .map((action) => action?.code),
    ...((Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => !violation?.blocks_customer_delivery && !violation?.blocks_public_sample && !violation?.blocks_high_value_outreach)
      .map((violation) => violation?.code)),
  ]);

  const contractCustomerBlockingViolations = uniqueCodes(
    (Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) =>
        isCustomerPublishBlockingViolationWithContext(violation, { coreSufficiencyPublishable }) &&
        !(coreValidRequiredCoverage && isCoreValidNonBlockingIssueCode(violation?.code))
      )
      .map((violation) => violation?.code)
  );
  const contractPublicSampleBlockers = uniqueCodes(
    (Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => Boolean(violation?.blocks_public_sample))
      .map((violation) => violation?.code)
  );
  const contractOutreachBlockers = uniqueCodes(
    (Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => Boolean(violation?.blocks_high_value_outreach))
      .map((violation) => violation?.code)
  );
  const unclassifiedCustomerBlockersMissingRationale = uniqueCodes(
    (Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => {
        if (!violation || violation?.blocks_customer_delivery !== true) return false;
        const codeClass = classifyReportContractViolationCode(violation?.code);
        if (codeClass !== "unknown") return false;
        if (isOptionalSupportingContractOverblockViolation(violation, { coreSufficiencyPublishable })) return false;
        return !hasRecognizedCustomerBlockRationaleMetadata(violation);
      })
      .map(() => "UNCLASSIFIED_CUSTOMER_BLOCKER_REQUIRES_RATIONALE")
  );
  const optionalSupportingContractAdvisories = uniqueCodes(
    (Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => isOptionalSupportingContractOverblockViolation(violation, { coreSufficiencyPublishable }))
      .map((violation) => violation?.code)
  );

  const customerPublishBlockerCandidates = uniqueCodes([
    ...(sourceNeedsDocs ? [
      reasonCode,
      customerDeliveryBlockerAction?.code,
    ] : []),
    ...contractCustomerBlockingViolations,
    ...customerActionBlockers,
    ...(managerContradictionAction && managerContradictionBlocksCustomer ? [managerContradictionAction.code] : []),
    ...(reconciliationViolation && isCustomerPublishBlockingViolationWithContext(reconciliationViolation, { coreSufficiencyPublishable }) ? [reconciliationViolation.code] : []),
  ]);

  const publicSampleBlockers = uniqueCodes([
    ...contractPublicSampleBlockers,
    ...publicSampleActionBlockers,
    ...deterministicPublicSampleBlockers,
  ]);

  const highValueOutreachBlockers = uniqueCodes([
    ...contractOutreachBlockers,
    ...outreachActionBlockers,
    ...publicSampleBlockers,
  ]);

  const publicSampleBlockerSet = new Set(publicSampleBlockers.map((entry) => String(entry || "").toUpperCase()));
  const highValueOutreachBlockerSet = new Set(highValueOutreachBlockers.map((entry) => String(entry || "").toUpperCase()));
  const sourceLimitationsByCode = new Set(
    actionRows
      .filter((action) => String(action?.action_type || "") === "source_document_limitation")
      .map((action) => String(action?.code || "").toUpperCase())
      .filter(Boolean)
  );
  for (const flag of Array.isArray(deterministicFlags) ? deterministicFlags : []) {
    if (String(flag?.classification || "").toLowerCase() === "missing_required_source" && flag?.code) {
      sourceLimitationsByCode.add(String(flag.code).toUpperCase());
    }
  }
  const optionalLimitationCodes = new Set(
    actionRows
      .filter((action) =>
        String(action?.action_type || "") === "source_document_limitation" &&
        !Boolean(action?.blocks_customer_delivery)
      )
      .map((action) => String(action?.code || "").toUpperCase())
      .filter(Boolean)
  );
  const customerPublishBlockers = customerPublishBlockerCandidates.filter((code) => {
    const normalized = String(code || "").toUpperCase();
    if (!normalized) return false;
    if (coreValidRequiredCoverage && isCoreValidNonBlockingIssueCode(normalized)) return false;
    if (publicSampleBlockerSet.has(normalized)) return false;
    if (highValueOutreachBlockerSet.has(normalized)) return false;
    if (optionalLimitationCodes.has(normalized)) return false;
    if (
      coreSufficiencyPublishable &&
      requiredCoreCoverageReady &&
      sourceLimitationsByCode.has(normalized) &&
      !isNonNegotiableCustomerHardDefect(normalized)
    ) return false;
    if (sourceReconciliationIsDiscloseOnly && normalized === "RENT_ROLL_T12_RECONCILIATION_REQUIRED") return false;
    return true;
  });
  const regenerationRecommended = Boolean(
    qaActionPlan?.regenerate_recommended ||
    actionRows.some((action) => action?.requires_regeneration) ||
    contractViolations.some((violation) => isRegenerationRequiredViolation(violation))
  );
  const regenerationRequiredForCustomerDelivery = Boolean(
    customerPublishBlockers.some((code) =>
      isCustomerRegenerationRequiredCode(code, {
        actionRows,
        contractViolations,
        deterministicFlags,
      })
    )
  );
  const regenerationRequiredForPublicSample = Boolean(
    publicSampleBlockers.some((code) => deterministicRegenerationRequiredCodes.has(String(code || "").toUpperCase())) ||
    highValueOutreachBlockers.some((code) => deterministicRegenerationRequiredCodes.has(String(code || "").toUpperCase()))
  );
  const regenerationRequired = regenerationRequiredForCustomerDelivery || regenerationRequiredForPublicSample;

  const systemBugReasonCodes = uniqueCodes([
    ...(Array.isArray(contractViolations) ? contractViolations : [])
      .filter((violation) => {
        const category = String(violation?.category || "").toLowerCase();
        const code = String(violation?.code || "").toUpperCase();
        return (
          category.includes("report_contradiction") ||
          category.includes("internal_consistency") ||
          category.includes("public_language") ||
          code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH" ||
          code === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION" ||
          code === "HARD_PUBLIC_LANGUAGE_CONTRACT"
        );
      })
      .map((violation) => violation?.code),
    ...actionRows
      .filter((action) =>
        Boolean(action?.blocks_customer_delivery) &&
        ["report_renderer", "parser", "production_config"].includes(String(action?.owner_area || ""))
      )
      .map((action) => action?.code),
  ]);
  const sourceLimitationReasonCodes = uniqueCodes([
    ...Array.from(sourceLimitationsByCode),
    ...(sourceReconciliationIsDiscloseOnly ? ["RENT_ROLL_T12_RECONCILIATION_REQUIRED"] : []),
  ]);
  const failClosedReasonCodes = uniqueCodes(
    customerPublishBlockers.filter((code) => !systemBugReasonCodes.includes(code))
  );
  const ownerAreas = Array.from(new Set(actionRows.map((action) => String(action?.owner_area || "")).filter(Boolean)));
  const customerDeliveryImpact = customerPublishBlockers.length > 0
    ? "block"
    : (sourceReconciliationIsDiscloseOnly || sourceLimitationReasonCodes.length > 0 ? "disclose_only" : "allow");
  const normalizedDeliveryGateStatus = normalizeCustomerDeliveryGateStatus(deliveryGateStatus);
  const adminReviewImpact = "none";
  const publicSampleImpact = publicSampleBlockers.length > 0 ? "block_until_review" : "allow";
  const highValueOutreachImpact = highValueOutreachBlockers.length > 0 ? "block_until_review" : "allow";
  const displayDisclosureLevel = customerDeliveryImpact === "disclose_only"
    ? (sourceReconciliationIsDiscloseOnly ? "source_reconciliation" : "source_limited")
    : "none";

  const customerPublishEligibleComputed = Boolean(
    normalizedDeliveryGateStatus === "deliverable" &&
    requiredCoreCoverageReady &&
    !sourceNeedsDocs &&
    customerPublishBlockers.length === 0
  );
  const customerBlockingReconciliationViolation =
    reconciliationViolation && isCustomerPublishBlockingViolation(reconciliationViolation)
      ? reconciliationViolation
      : null;
  const adminReviewBlockingAction =
    customerDeliveryBlockerAction ||
    customerBlockingReconciliationViolation ||
    (managerContradictionBlocksCustomer ? managerContradictionAction : null);

  const publishDecisionReason = customerPublishEligibleComputed
    ? "customer_publish_eligible"
    : adminReviewBlockingAction
    ? `user_needs_documents:${reasonCode || adminReviewBlockingAction?.code || customerPublishBlockers[0] || "CUSTOMER_DELIVERY_BLOCKED"}`
    : sourceNeedsDocs
    ? `user_needs_documents:${reasonCode || customerPublishBlockers[0] || "SOURCE_DOCUMENT_LIMITATION"}`
    : customerPublishBlockers.length > 0
    ? `customer_blocked:${customerPublishBlockers[0]}`
    : requiredCoreCoverageReady
    ? "customer_publish_eligible"
    : "customer_publish_not_ready";
  const reportQualityBlockers = customerPublishBlockers;
  const readinessOverride = resolveCanonicalReadinessOverride({
    deliveryDecisionState,
    canonicalDeliveryDecisionState,
    deliveryGateDecision,
    delivery_gate_decision,
  });
  const liveCoverageContext = Boolean(sourceReportCoverageQa);
  const allowLegacyReadinessFallback = !liveCoverageContext && !readinessOverride.present;
  const canonicalReasonCodeRaw =
    readinessOverride.normalized?.customer_status_reason_code ||
    readinessOverride.normalized?.reason_code ||
    reasonCode ||
    null;
  const deprecatedAdminReviewResolution = resolveDeprecatedAdminReviewGateStatus({
    statusValue: readinessOverride.normalized?.delivery_gate_status || null,
    reasonCode: canonicalReasonCodeRaw,
    explicitCoreFailure: !requiredCoreCoverageReady || sourceNeedsDocs,
  });
  const reportQualityAdvisories = uniqueCodes([
    ...advisoryOnlyFindings,
    ...unclassifiedCustomerBlockersMissingRationale,
    ...optionalSupportingContractAdvisories,
    ...publicSampleBlockers,
    ...highValueOutreachBlockers,
    ...(deprecatedAdminReviewResolution.inject_diagnostic_code
      ? [deprecatedAdminReviewResolution.inject_diagnostic_code]
      : []),
  ]);
  // Legacy readiness synthesis. Canonical override may replace these truth fields below.
  const reportPublishableLegacy = Boolean(
    normalizedDeliveryGateStatus === "deliverable" &&
      requiredCoreCoverageReady &&
      !sourceNeedsDocs &&
      reportQualityBlockers.length === 0
  );
  const customerPublishEligibleLegacy = customerPublishEligibleComputed;
  const customerDeliveryReadyAliasLegacy = customerPublishEligibleLegacy && reportPublishableLegacy;
  const publicSampleReadyLegacy = Boolean(
    reportPublishableLegacy &&
    publicSampleBlockers.length === 0 &&
    publicSampleImpact !== "block_until_review"
  );
  const highValueOutreachReadyLegacy = Boolean(
    reportPublishableLegacy &&
    highValueOutreachBlockers.length === 0 &&
    highValueOutreachImpact !== "block_until_review"
  );
  const canonicalDeliveryGateStatusRaw = readinessOverride.normalized?.delivery_gate_status || null;
  const canonicalDeliveryGateStatus = normalizeCustomerDeliveryGateStatus(
    deprecatedAdminReviewResolution.gate_status || canonicalDeliveryGateStatusRaw
  );
  const canonicalHasExplicitCustomerAllowed =
    readinessOverride.normalized?.customer_delivery_allowed !== undefined &&
    readinessOverride.normalized?.customer_delivery_allowed !== null;
  const canonicalCustomerDeliveryAllowed =
    readinessOverride.present
      ? canonicalHasExplicitCustomerAllowed
        ? Boolean(readinessOverride.normalized?.customer_delivery_allowed)
        : canonicalDeliveryGateStatus === "deliverable"
      : canonicalDeliveryGateStatus === "deliverable" &&
        requiredCoreCoverageReady &&
        (liveCoverageContext ? true : !sourceNeedsDocs && customerPublishBlockers.length === 0);
  const customerPublishEligible = allowLegacyReadinessFallback
    ? customerPublishEligibleLegacy
    : canonicalCustomerDeliveryAllowed;
  const reportPublishable = allowLegacyReadinessFallback
    ? reportPublishableLegacy
    : canonicalCustomerDeliveryAllowed;
  const customerDeliveryReadyAlias = allowLegacyReadinessFallback
    ? customerDeliveryReadyAliasLegacy
    : canonicalCustomerDeliveryAllowed;
  const publicSampleReady = allowLegacyReadinessFallback
    ? publicSampleReadyLegacy
    : Boolean(
      canonicalDeliveryGateStatus === "deliverable" &&
      requiredCoreCoverageReady &&
      publicSampleBlockers.length === 0 &&
      publicSampleImpact !== "block_until_review"
    );
  const highValueOutreachReady = allowLegacyReadinessFallback
    ? highValueOutreachReadyLegacy
    : Boolean(
      canonicalDeliveryGateStatus === "deliverable" &&
      requiredCoreCoverageReady &&
      highValueOutreachBlockers.length === 0 &&
      highValueOutreachImpact !== "block_until_review"
    );
  const userNeedsDocuments = normalizedDeliveryGateStatus === "user_needs_documents";
  const readinessSource = allowLegacyReadinessFallback
    ? "legacy_publish_eligibility_fallback"
    : "canonical_delivery_state";
  const readinessFallbackUsed = allowLegacyReadinessFallback;
  const publishDecisionReasonFinal = allowLegacyReadinessFallback
    ? publishDecisionReason
    : canonicalDeliveryGateStatus === "deliverable"
      ? "customer_publish_eligible"
      : `${canonicalDeliveryGateStatus || "delivery_gate_status_unknown"}:${String(
          canonicalReasonCodeRaw ||
            reasonCode ||
            canonicalDeliveryGateStatus ||
            "canonical_delivery_gate_state"
        )}`;

  return {
    delivery_authority: "delivery_gate",
    report_quality_blockers: reportQualityBlockers,
    report_quality_advisories: reportQualityAdvisories,
    report_publishable: reportPublishable,
    report_blocked: !reportPublishable,
    report_quality_decision_reason: publishDecisionReasonFinal,
    readiness_source: readinessSource,
    readiness_fallback_used: readinessFallbackUsed,
    canonical_delivery_gate_status: canonicalDeliveryGateStatus,
    // Legacy alias for compatibility; canonical authority remains customer_publish_eligible.
    customer_delivery_ready: customerDeliveryReadyAlias,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    customer_publish_eligible: customerPublishEligible,
    customer_publish_blockers: customerPublishBlockers,
    public_sample_blockers: publicSampleBlockers,
    high_value_outreach_blockers: highValueOutreachBlockers,
    readiness_hierarchy: {
      final_delivery_authority: "delivery_gate",
      final_delivery_status: readinessOverride.present
        ? (normalizeCustomerDeliveryGateStatus(canonicalDeliveryGateStatus) || normalizedDeliveryGateStatus)
        : normalizedDeliveryGateStatus,
      report_publishable: reportPublishable,
      report_blocked: !reportPublishable,
      report_quality_blockers: reportQualityBlockers,
      report_quality_advisories: reportQualityAdvisories,
      customer_publish_eligible: customerPublishEligible,
      customer_delivery_ready: customerDeliveryReadyAlias,
      customer_publish_blockers: customerPublishBlockers,
      public_sample_ready: publicSampleReady,
      public_sample_blockers: publicSampleBlockers,
      high_value_outreach_ready: highValueOutreachReady,
      high_value_outreach_blockers: highValueOutreachBlockers,
      advisory_only_findings: advisoryOnlyFindings,
    },
    advisory_only_findings: advisoryOnlyFindings,
    regeneration_recommended: regenerationRecommended,
    regeneration_required_for_customer_delivery: regenerationRequiredForCustomerDelivery,
    regeneration_required_for_public_sample: regenerationRequiredForPublicSample,
    regeneration_required: regenerationRequired,
    customer_delivery_impact: customerDeliveryImpact,
    public_sample_impact: publicSampleImpact,
    high_value_outreach_impact: highValueOutreachImpact,
    admin_review_impact: adminReviewImpact,
    fail_closed_reason_codes: failClosedReasonCodes,
    source_limitation_reason_codes: sourceLimitationReasonCodes,
    system_bug_reason_codes: systemBugReasonCodes,
    display_disclosure_level: displayDisclosureLevel,
    owner_areas: ownerAreas,
    admin_review_required: false,
    user_needs_documents: userNeedsDocuments,
    publish_decision_reason: publishDecisionReasonFinal,
    core_valid_required_coverage: coreValidRequiredCoverage,
    legacy_readiness_aliases: {
      customer_delivery_ready_alias_of_customer_publish_eligible: true,
      report_publishable_authority: "delivery_gate_and_canonical_customer_blockers",
      public_sample_ready_non_authoritative_for_customer_delivery: true,
      high_value_outreach_ready_non_authoritative_for_customer_delivery: true,
    },
    distribution_context: {
      non_authoritative_exposure_metadata: true,
      public_sample_ready: publicSampleReady,
      high_value_outreach_ready: highValueOutreachReady,
      public_sample_blockers: publicSampleBlockers,
      high_value_outreach_blockers: highValueOutreachBlockers,
    },
  };
}

function classifyActionDeliveryImpact(action) {
  const code = String(action?.code || "").toUpperCase();
  const actionType = String(action?.action_type || "");
  const ownerArea = String(action?.owner_area || "");
  const blocksCustomer = action?.blocks_customer_delivery;
  const blocksPublic = Boolean(action?.blocks_public_sample);
  const blocksOutreach = Boolean(action?.blocks_high_value_outreach);
  const requiresPatch = Boolean(action?.requires_code_patch);
  const requiresRegeneration = Boolean(action?.requires_regeneration);

  const customerDeliveryBlockerCodes = new Set([
    "UNSUPPORTED_CURRENT_DEBT_RENDERED",
    "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
  ]);
  const publicOrOutreachOnlyCodes = new Set([
    "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
    "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
    "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
    "T12_LINE_ITEM_DETAIL_MISSING",
    "RENOVATION_DOC_NOT_STRUCTURED",
    "ACQUISITION_FINANCING_RENDER_MISSING",
    "DOCRAPTOR_NOT_PRODUCTION_MODE",
  ]);

  if (blocksCustomer === true) {
    return "customer_delivery_blocker";
  }
  if (blocksCustomer !== false && customerDeliveryBlockerCodes.has(code)) {
    return "customer_delivery_blocker";
  }

  if (
    actionType === "source_document_limitation" ||
    actionType === "production_config_only" ||
    publicOrOutreachOnlyCodes.has(code) ||
    ((blocksPublic || blocksOutreach) && (requiresPatch || requiresRegeneration) &&
      ["report_renderer", "parser", "rent_roll_normalizer", "production_config"].includes(ownerArea))
  ) {
    return "public_or_outreach_only_blocker";
  }

  if (
    actionType === "no_action_false_positive" ||
    actionType === "model_review_recommended" ||
    actionType === "admin_review_optional"
  ) {
    return "advisory_only";
  }

  return "advisory_only";
}

function isCoreSufficiencyPublishableBucket(bucketValue) {
  const bucket = normalizeImpactValue(bucketValue);
  return (
    bucket === "core_sufficient_publishable" ||
    bucket === "section_constrained_publishable" ||
    bucket === "disclose_only_publishable"
  );
}

const CORE_VALID_NON_BLOCKING_ISSUE_CODES = new Set([
  "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
  "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT",
  "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
  "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT",
  "SECTION_ELIGIBILITY_CURRENT_DEBT_RENDER_DRIFT",
  "SECTION_ELIGIBILITY_REFI_RENDER_DRIFT",
  "UNSUPPORTED_CURRENT_DEBT_RENDERED",
  "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
  "REPORT_TYPE_SECTION_LEAK",
  "SCREENING_UNDERWRITING_SECTION_LEAK",
  "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
  "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
  "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
  "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
  "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
]);

function isValidatedSufficiencyState(state = null) {
  if (!state || typeof state !== "object") return false;
  const bucket = normalizeImpactValue(state?.publishability_bucket);
  const status = String(state?.status || "").toLowerCase();
  return (
    status === "validated" &&
    bucket !== "user_needs_documents" &&
    bucket !== "admin_review_required" &&
    bucket !== "system_contract_failure"
  );
}

export function isCoreValidRequiredCoverageState(sourceReportCoverageQa = null) {
  const sourceInventory = sourceReportCoverageQa?.artifact_inventory || {};
  const coreInputSufficiencyState = sourceReportCoverageQa?.core_input_sufficiency_state || null;
  const t12State = sourceReportCoverageQa?.t12_sufficiency_state || coreInputSufficiencyState?.evidence?.t12_state || null;
  const rentRollState = sourceReportCoverageQa?.rent_roll_sufficiency_state || coreInputSufficiencyState?.evidence?.rent_roll_state || null;
  return Boolean(
    sourceInventory?.t12_parsed?.present &&
    sourceInventory?.rent_roll_parsed?.present &&
    isValidatedSufficiencyState(t12State) &&
    isValidatedSufficiencyState(rentRollState) &&
    isValidatedSufficiencyState(coreInputSufficiencyState)
  );
}

function isCoreValidNonBlockingIssueCode(code = "") {
  return CORE_VALID_NON_BLOCKING_ISSUE_CODES.has(String(code || "").toUpperCase());
}

function normalizeCustomerDeliveryGateStatus(statusValue) {
  const normalized = String(statusValue || "deliverable").toLowerCase();
  return normalized;
}

const DEPRECATED_ADMIN_REVIEW_CORE_FAIL_REASON_PATTERNS = [
  /missing_required_t12/i,
  /missing_required_rent_roll/i,
  /missing_required_source_documents/i,
  /core_input_verification_inconsistency/i,
  /rent_roll_unusable/i,
  /t12_unusable/i,
  /system_contract_failure/i,
];

const DEPRECATED_ADMIN_REVIEW_NON_CORE_REASON_PATTERNS = [
  /report_type_section_leak/i,
  /rendered_data_not_available_placeholder/i,
  /deal_scorecard_stale_dscr_placeholder/i,
  /rendered_placeholder_metric_value/i,
  /rendered_placeholder_value_leak/i,
  /internal_rent_roll_total_contradiction/i,
];

function classifyDeprecatedAdminReviewReason(reasonCode = "") {
  const reason = String(reasonCode || "").trim();
  if (!reason) return "unknown";
  if (DEPRECATED_ADMIN_REVIEW_CORE_FAIL_REASON_PATTERNS.some((pattern) => pattern.test(reason))) {
    return "core_fail";
  }
  if (DEPRECATED_ADMIN_REVIEW_NON_CORE_REASON_PATTERNS.some((pattern) => pattern.test(reason))) {
    return "non_core_diagnostic";
  }
  return "unknown";
}

function resolveDeprecatedAdminReviewGateStatus({
  statusValue = "",
  reasonCode = "",
  explicitCoreFailure = false,
} = {}) {
  const normalized = String(statusValue || "deliverable").toLowerCase();
  if (normalized !== "admin_review_required") {
    return {
      gate_status: normalized,
      classification: null,
      inject_diagnostic_code: null,
    };
  }
  const classification = classifyDeprecatedAdminReviewReason(reasonCode);
  if (classification === "core_fail" || explicitCoreFailure) {
    return {
      gate_status: "user_needs_documents",
      classification,
      inject_diagnostic_code: null,
    };
  }
  return {
    gate_status: "deliverable",
    classification,
    inject_diagnostic_code:
      classification === "unknown" ? "DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION" : null,
  };
}

function isOptionalSupportingOverblockAction(action, {
  coreSufficiencyPublishable = false,
} = {}) {
  if (!coreSufficiencyPublishable) return false;
  if (!action || String(action?.action_type || "") !== "source_document_limitation") return false;
  if (action?.blocks_customer_delivery !== true) return false;
  const code = String(action?.code || "").toUpperCase();
  if (!code) return true;
  return !isNonNegotiableCustomerHardDefect(code);
}

function resolveNeedsDocumentsReasonCode({
  sourceDocumentAction = null,
  coreInputSufficiencyState = null,
  sourceLimitations = [],
  sourceStatus = "",
} = {}) {
  return (
    sourceDocumentAction?.code ||
    coreInputSufficiencyState?.reason_code ||
    sourceLimitations[0]?.code ||
    (sourceStatus === "needs_documents"
      ? "missing_required_source_documents"
      : sourceStatus === "failed"
      ? "source_document_validation_failed"
      : sourceStatus) ||
    "SOURCE_DOCUMENT_LIMITATION"
  );
}

export function buildDeliveryGateDecision({
  sourceReportCoverageQa = null,
  reportContractQa = null,
  qaActionPlan = null,
  qaDirectorReview = null,
  deliveryDecisionState = null,
  canonicalDeliveryDecisionState = null,
  delivery_gate_decision = null,
  deliveryGateDecision = null,
} = {}) {
  const prioritizedActions = Array.isArray(qaActionPlan?.prioritized_actions) ? qaActionPlan.prioritized_actions : [];
  const actionImpactRows = prioritizedActions.map((action) => ({
    action,
    impact: classifyActionDeliveryImpact(action),
  }));
  const contractViolations = Array.isArray(reportContractQa?.violations) ? reportContractQa.violations : [];
  const deterministicFlags = Array.isArray(sourceReportCoverageQa?.deterministic_flags) ? sourceReportCoverageQa.deterministic_flags : [];
  const sourceStatus = String(sourceReportCoverageQa?.qa_status || "").toLowerCase();
  const coreInputSufficiencyState = sourceReportCoverageQa?.core_input_sufficiency_state || null;
  const coreInputBucket = String(coreInputSufficiencyState?.publishability_bucket || "").toLowerCase();
  const coreSufficiencyPublishable = isCoreSufficiencyPublishableBucket(coreInputBucket);
  const coreValidRequiredCoverage = isCoreValidRequiredCoverageState(sourceReportCoverageQa);
  const coreInputRequiredCoreDocsMissing = coreInputSufficiencyState?.required_core_docs_missing === true;
  const coreInputCustomerFailClosed = isCoreInputCustomerFailClosed(coreInputSufficiencyState);
  const coreInputSystemContractFailureTyped = coreInputSufficiencyState?.system_contract_failure === true;
  const sourceReconciliationState = sourceReportCoverageQa?.source_reconciliation_state || null;
  const readinessOverride = resolveCanonicalReadinessOverride({
    deliveryDecisionState,
    canonicalDeliveryDecisionState,
    deliveryGateDecision,
    delivery_gate_decision,
  });
  const deprecatedAdminReviewResolution = resolveDeprecatedAdminReviewGateStatus({
    statusValue: readinessOverride.normalized?.delivery_gate_status || null,
    reasonCode:
      readinessOverride.normalized?.customer_status_reason_code ||
      readinessOverride.normalized?.reason_code ||
      null,
    explicitCoreFailure: coreInputRequiredCoreDocsMissing || coreInputCustomerFailClosed || coreInputSystemContractFailureTyped,
  });
  const canonicalDeliveryGateStatus = normalizeCustomerDeliveryGateStatus(
    deprecatedAdminReviewResolution.gate_status || readinessOverride.normalized?.delivery_gate_status || null
  );
  const sourceReconciliationIsDiscloseOnly = isDiscloseOnlySourceReconciliationState(sourceReconciliationState);
  const sourceLimitations = deterministicFlags.filter((flag) => classifySourceFlagDeliveryImpact(flag));
  const sourceBlockingFlags = deterministicFlags.filter((flag) => {
    if (!flag) return false;
    if (Boolean(flag?.blocks_customer_delivery) || Boolean(flag?.customer_delivery_blocker)) return true;
    if (String(flag?.classification || "").toLowerCase() === "missing_required_source") return true;
    const customerDeliveryImpact = normalizeImpactValue(flag?.evidence?.customer_delivery_impact);
    const reconciliationImpact = normalizeImpactValue(flag?.evidence?.source_reconciliation_state?.customer_delivery_impact);
    const blockingImpacts = new Set([
      "block",
      "blocked",
      "customer_blocked",
      "customer_delivery_blocked",
      "customer_delivery_blocker",
    ]);
    return blockingImpacts.has(customerDeliveryImpact) || blockingImpacts.has(reconciliationImpact);
  });
  const missingRequiredSource =
    sourceStatus === "needs_documents" ||
    sourceStatus === "failed" ||
    coreInputBucket === "user_needs_documents" ||
    coreInputRequiredCoreDocsMissing ||
    sourceLimitations.some((flag) => String(flag?.classification || "").toLowerCase() === "missing_required_source");
  const reconciliationViolation = contractViolations.find((violation) =>
    /RECONCILIATION_MISMATCH|CONTRADICTION/i.test(String(violation?.code || "")) ||
    String(violation?.code || "") === "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION" ||
    /source_report_reconciliation|report_contradiction/i.test(String(violation?.category || ""))
  ) || null;
  const managerContradictionAction = prioritizedActions.find(isManagerContradictionAction) || null;
  const managerContradictionBlocksCustomer = !coreValidRequiredCoverage && isManagerContradictionCustomerBlocking(managerContradictionAction, {
    contractViolations,
    deterministicFlags,
  });
  const contractCustomerBlockingViolation =
    contractViolations.find((violation) =>
      isCustomerPublishBlockingViolationWithContext(violation, { coreSufficiencyPublishable }) &&
      !(coreValidRequiredCoverage && isCoreValidNonBlockingIssueCode(violation?.code))
    ) || null;
  const sourceDocumentAction = prioritizedActions.find((action) => action?.action_type === "source_document_limitation") || null;
  const sourceDocumentActionBlocksCustomer = Boolean(sourceDocumentAction?.blocks_customer_delivery);
  const sourceDocumentActionIsOptionalOverblock = isOptionalSupportingOverblockAction(sourceDocumentAction, {
    coreSufficiencyPublishable,
  });
  const sourceDocumentActionIsCustomerBlocking = sourceDocumentActionBlocksCustomer && !sourceDocumentActionIsOptionalOverblock;
  const customerDeliveryBlockerAction =
    actionImpactRows.find((row) =>
      row.impact === "customer_delivery_blocker" &&
      !isManagerContradictionAction(row.action) &&
      !isOptionalSupportingOverblockAction(row.action, { coreSufficiencyPublishable }) &&
      !(coreValidRequiredCoverage && isCoreValidNonBlockingIssueCode(row.action?.code))
    )?.action ||
    contractCustomerBlockingViolation ||
    (managerContradictionBlocksCustomer ? managerContradictionAction : null) ||
    null;
  const publicOrOutreachOnlyAction =
    actionImpactRows.find((row) => row.impact === "public_or_outreach_only_blocker")?.action ||
    null;
  const adminReviewAction = customerDeliveryBlockerAction || (managerContradictionBlocksCustomer ? managerContradictionAction : null) || null;
  const directorMismatch =
    String(qaDirectorReview?.overall_director_decision || "") !== "no_missed_issue_detected" &&
    Boolean(adminReviewAction || (reconciliationViolation && isCustomerPublishBlockingViolationWithContext(reconciliationViolation, { coreSufficiencyPublishable })));

  const sourceNeedsDocs =
    !coreValidRequiredCoverage &&
    ((!sourceReconciliationIsDiscloseOnly && (missingRequiredSource || sourceBlockingFlags.length > 0)) ||
    sourceDocumentActionIsCustomerBlocking);
  const sourceNeedsReview =
    !coreValidRequiredCoverage &&
    (coreInputBucket === "system_contract_failure" ||
    coreInputSystemContractFailureTyped ||
    (coreInputBucket === "admin_review_required" && coreInputCustomerFailClosed));
  const customerBlockingReconciliationViolation =
    reconciliationViolation && isCustomerPublishBlockingViolationWithContext(reconciliationViolation, { coreSufficiencyPublishable })
      ? reconciliationViolation
      : null;
  const adminReviewBlockingAction =
    customerDeliveryBlockerAction ||
    customerBlockingReconciliationViolation ||
    (managerContradictionBlocksCustomer ? managerContradictionAction : null);
  if (readinessOverride.present) {
    const publishEligibility = buildPublishEligibilitySummary({
      deliveryGateStatus: canonicalDeliveryGateStatus || "deliverable",
      reasonCode: String(
        readinessOverride.normalized?.customer_status_reason_code ||
        readinessOverride.normalized?.reason_code ||
        canonicalDeliveryGateStatus ||
        ""
      ) || null,
      sourceReportCoverageQa,
      reportContractQa,
      qaActionPlan,
      prioritizedActions,
      contractViolations,
      deterministicFlags,
      sourceNeedsDocs,
      customerDeliveryBlockerAction,
      managerContradictionAction,
      managerContradictionBlocksCustomer,
      reconciliationViolation,
      publicOrOutreachOnlyAction,
      adminReviewAction: customerDeliveryBlockerAction || (managerContradictionBlocksCustomer ? managerContradictionAction : null) || null,
      deliveryDecisionState,
      canonicalDeliveryDecisionState,
      delivery_gate_decision,
      deliveryGateDecision,
    });
    const canonicalHasExplicitCustomerAllowed =
      readinessOverride.normalized?.customer_delivery_allowed !== undefined &&
      readinessOverride.normalized?.customer_delivery_allowed !== null;
    const canonicalCustomerAllowed =
      String(readinessOverride.normalized?.delivery_gate_status || "").toLowerCase() === "admin_review_required"
        ? canonicalDeliveryGateStatus === "deliverable"
        : canonicalHasExplicitCustomerAllowed
          ? Boolean(readinessOverride.normalized?.customer_delivery_allowed)
          : canonicalDeliveryGateStatus === "deliverable";
    const publicReady = readinessOverride.has_public_sample_ready
      ? Boolean(readinessOverride.normalized?.public_sample_ready)
      : publishEligibility.public_sample_ready;
    const outreachReady = readinessOverride.has_high_value_outreach_ready
      ? Boolean(readinessOverride.normalized?.high_value_outreach_ready)
      : publishEligibility.high_value_outreach_ready;
    return {
      final_delivery_authority: "delivery_gate",
      delivery_gate_status: canonicalDeliveryGateStatus || "deliverable",
      reason_code: readinessOverride.normalized?.customer_status_reason_code || readinessOverride.normalized?.reason_code || null,
      top_action_code: prioritizedActions[0]?.code || null,
      owner_area: prioritizedActions[0]?.owner_area || null,
      recommended_next_step: prioritizedActions[0]?.recommended_next_step || null,
      customer_delivery_ready: canonicalCustomerAllowed,
      customer_publish_eligible: canonicalCustomerAllowed,
      report_publishable: canonicalCustomerAllowed,
      report_blocked: !canonicalCustomerAllowed,
      public_sample_ready: publicReady,
      high_value_outreach_ready: outreachReady,
      admin_review_required: false,
      user_needs_documents: canonicalDeliveryGateStatus === "user_needs_documents",
      launch_path_recommendation:
        canonicalDeliveryGateStatus === "user_needs_documents"
          ? "user_needs_documents"
          : "customer_deliverable",
      readiness_source: "canonical_delivery_state",
      readiness_fallback_used: false,
      canonical_delivery_gate_status: canonicalDeliveryGateStatus,
      readiness_hierarchy: {
        final_delivery_authority: "delivery_gate",
        final_delivery_status: canonicalDeliveryGateStatus || "deliverable",
        customer_delivery_ready: canonicalCustomerAllowed,
        public_sample_ready: publicReady,
        high_value_outreach_ready: outreachReady,
        advisory_only_findings: Array.isArray(qaActionPlan?.advisory_only_findings) ? qaActionPlan.advisory_only_findings.length : 0,
      },
      ...publishEligibility,
      deprecated_admin_review_reason_classification: deprecatedAdminReviewResolution.classification,
      deprecated_admin_review_reason_requires_classification:
        deprecatedAdminReviewResolution.inject_diagnostic_code === "DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION",
      customer_delivery_ready_legacy: canonicalCustomerAllowed,
    };
  }

  if (sourceNeedsDocs && !customerDeliveryBlockerAction && !customerBlockingReconciliationViolation) {
    const gateReason = resolveNeedsDocumentsReasonCode({
      sourceDocumentAction,
      coreInputSufficiencyState,
      sourceLimitations,
      sourceStatus,
    });
    const publishEligibility = buildPublishEligibilitySummary({
      deliveryGateStatus: "user_needs_documents",
      reasonCode: gateReason,
      sourceReportCoverageQa,
      reportContractQa,
      qaActionPlan,
      prioritizedActions,
      contractViolations,
      deterministicFlags,
      sourceNeedsDocs: true,
      customerDeliveryBlockerAction,
      managerContradictionAction,
      managerContradictionBlocksCustomer,
      reconciliationViolation,
      publicOrOutreachOnlyAction,
      adminReviewAction: null,
      deliveryDecisionState,
      canonicalDeliveryDecisionState,
      delivery_gate_decision,
      deliveryGateDecision,
    });
    return {
      delivery_gate_status: "user_needs_documents",
      reason_code: gateReason,
      top_action_code: sourceDocumentAction?.code || sourceLimitations[0]?.code || null,
      owner_area: sourceDocumentAction?.owner_area || "source_documents",
      recommended_next_step: sourceDocumentAction?.recommended_next_step || "Request the missing required source documents or required source value before delivering the report.",
      customer_delivery_ready: false,
      public_sample_ready: publishEligibility.public_sample_ready,
      high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
      ...publishEligibility,
    };
  }
  if (sourceNeedsReview && !customerDeliveryBlockerAction && !customerBlockingReconciliationViolation) {
    const gateReason =
      coreInputSufficiencyState?.reason_code ||
      sourceDocumentAction?.code ||
      sourceLimitations[0]?.code ||
      "SYSTEM_CONTRACT_FAILURE";
    const publishEligibility = buildPublishEligibilitySummary({
      deliveryGateStatus: "user_needs_documents",
      reasonCode: gateReason,
      sourceReportCoverageQa,
      reportContractQa,
      qaActionPlan,
      prioritizedActions,
      contractViolations,
      deterministicFlags,
      sourceNeedsDocs: false,
      customerDeliveryBlockerAction,
      managerContradictionAction,
      managerContradictionBlocksCustomer,
      reconciliationViolation,
      publicOrOutreachOnlyAction,
      adminReviewAction: null,
      deliveryDecisionState,
      canonicalDeliveryDecisionState,
      delivery_gate_decision,
      deliveryGateDecision,
    });
    return {
      final_delivery_authority: "delivery_gate",
      delivery_gate_status: "user_needs_documents",
      reason_code: gateReason,
      top_action_code: sourceDocumentAction?.code || sourceLimitations[0]?.code || null,
      owner_area: "report_renderer",
      recommended_next_step: "Fail closed and capture system contract diagnostics before regeneration.",
      customer_delivery_ready: false,
      public_sample_ready: publishEligibility.public_sample_ready,
      high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
      ...publishEligibility,
    };
  }
  const customerDeliveryBlocked = Boolean(
    !coreValidRequiredCoverage &&
    (customerDeliveryBlockerAction || customerBlockingReconciliationViolation || directorMismatch || (managerContradictionBlocksCustomer ? managerContradictionAction : null))
  );

  if (customerDeliveryBlocked) {
    const topAction = customerDeliveryBlockerAction || customerBlockingReconciliationViolation || (managerContradictionBlocksCustomer ? managerContradictionAction : null) || prioritizedActions[0] || null;
    const reasonCode =
      reasonCodeForAction(adminReviewAction) ||
      reasonCodeForAction(customerBlockingReconciliationViolation) ||
      reasonCodeForAction(customerDeliveryBlockerAction) ||
      reasonCodeForAction(managerContradictionAction) ||
      String(qaDirectorReview?.findings?.[0]?.code || "ADMIN_REVIEW_REQUIRED");
    const publishEligibility = buildPublishEligibilitySummary({
      deliveryGateStatus: "user_needs_documents",
      reasonCode,
      sourceReportCoverageQa,
      reportContractQa,
      qaActionPlan,
      prioritizedActions,
      contractViolations,
      deterministicFlags,
      sourceNeedsDocs,
      customerDeliveryBlockerAction,
      managerContradictionAction,
      managerContradictionBlocksCustomer,
      reconciliationViolation,
      publicOrOutreachOnlyAction,
      adminReviewAction: customerDeliveryBlockerAction || (managerContradictionBlocksCustomer ? managerContradictionAction : null) || null,
      deliveryDecisionState,
      canonicalDeliveryDecisionState,
      delivery_gate_decision,
      deliveryGateDecision,
    });
    return {
      final_delivery_authority: "delivery_gate",
      delivery_gate_status: "user_needs_documents",
      reason_code: reasonCode,
      top_action_code: topAction?.code || null,
      owner_area: topAction?.owner_area || "report_renderer",
      recommended_next_step: topAction?.recommended_next_step || "Fail closed and resolve customer-delivery blocker before regeneration.",
      customer_delivery_ready: false,
      public_sample_ready: publishEligibility.public_sample_ready,
      high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
      launch_path_recommendation: "user_needs_documents",
      readiness_hierarchy: {
        final_delivery_authority: "delivery_gate",
        final_delivery_status: "user_needs_documents",
        customer_delivery_ready: false,
        public_sample_ready: publishEligibility.public_sample_ready,
        high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
        advisory_only_findings: Array.isArray(qaActionPlan?.advisory_only_findings) ? qaActionPlan.advisory_only_findings.length : 0,
      },
      ...publishEligibility,
    };
  }

  const publishEligibility = buildPublishEligibilitySummary({
    deliveryGateStatus: "deliverable",
    reasonCode: null,
    sourceReportCoverageQa,
    reportContractQa,
    qaActionPlan,
    prioritizedActions,
    contractViolations,
    deterministicFlags,
    sourceNeedsDocs,
    customerDeliveryBlockerAction,
    managerContradictionAction,
    managerContradictionBlocksCustomer,
    reconciliationViolation,
    publicOrOutreachOnlyAction,
    adminReviewAction: null,
    deliveryDecisionState,
    canonicalDeliveryDecisionState,
    delivery_gate_decision,
    deliveryGateDecision,
  });

  return {
    final_delivery_authority: "delivery_gate",
    delivery_gate_status: "deliverable",
    reason_code: null,
    top_action_code: prioritizedActions[0]?.code || null,
    owner_area: prioritizedActions[0]?.owner_area || null,
    recommended_next_step: prioritizedActions[0]?.recommended_next_step || null,
    customer_delivery_ready: publishEligibility.report_publishable,
    public_sample_ready: publishEligibility.public_sample_ready,
    high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
    launch_path_recommendation: publishEligibility.report_publishable ? "customer_deliverable" : "user_needs_documents",
    readiness_hierarchy: {
      final_delivery_authority: "delivery_gate",
      final_delivery_status: "deliverable",
      customer_delivery_ready: publishEligibility.report_publishable,
      public_sample_ready: publishEligibility.public_sample_ready,
      high_value_outreach_ready: publishEligibility.high_value_outreach_ready,
      advisory_only_findings: Array.isArray(qaActionPlan?.advisory_only_findings) ? qaActionPlan.advisory_only_findings.length : 0,
    },
    ...publishEligibility,
  };
}

export function buildCanonicalDeliveryDecisionState(deliveryGateDecision = null) {
  const state = deliveryGateDecision && typeof deliveryGateDecision === "object"
    ? deliveryGateDecision
    : {};
  const coreValidRequiredCoverage = state.core_valid_required_coverage === true;
  const deprecatedAdminReviewResolution = resolveDeprecatedAdminReviewGateStatus({
    statusValue: state.delivery_gate_status || "deliverable",
    reasonCode: state.reason_code || state.publish_decision_reason || null,
    explicitCoreFailure: false,
  });
  const deliveryGateStatus = coreValidRequiredCoverage
    ? "deliverable"
    : normalizeCustomerDeliveryGateStatus(
      deprecatedAdminReviewResolution.gate_status || state.delivery_gate_status || "deliverable"
    );
  const wasDeprecatedAdminReviewStatus =
    String(state.delivery_gate_status || "").toLowerCase() === "admin_review_required";
  const hasExplicitCanonicalCustomerAllowed =
    state.customer_delivery_allowed !== undefined && state.customer_delivery_allowed !== null;
  const customerBlockers = Array.isArray(state.customer_publish_blockers) ? state.customer_publish_blockers : [];
  const customerDeliveryAllowed = coreValidRequiredCoverage
    ? true
    : hasExplicitCanonicalCustomerAllowed
    ? (
      wasDeprecatedAdminReviewStatus && deprecatedAdminReviewResolution.classification === "core_fail"
        ? false
        : wasDeprecatedAdminReviewStatus && deliveryGateStatus === "deliverable"
          ? true
          : Boolean(state.customer_delivery_allowed)
    )
    : Boolean(deliveryGateStatus === "deliverable" && customerBlockers.length === 0);
  const holdDelivery = !coreValidRequiredCoverage && deliveryGateStatus !== "deliverable";
  const publicBlockers = Array.isArray(state.public_sample_blockers) ? state.public_sample_blockers : [];
  const highValueBlockers = Array.isArray(state.high_value_outreach_blockers) ? state.high_value_outreach_blockers : [];
  const reasonCode = String(state.reason_code || state.publish_decision_reason || deliveryGateStatus || "").trim() || null;

  const customerStatusLabel =
    coreValidRequiredCoverage || (deliveryGateStatus === "deliverable" && customerDeliveryAllowed)
      ? "ready"
      : deliveryGateStatus === "user_needs_documents"
          ? "needs_documents"
          : "publication_held";
  const customerMessage =
    customerStatusLabel === "ready"
      ? "This report is eligible for customer delivery."
      : customerStatusLabel === "needs_documents"
          ? "Additional required documents are needed before this report can be delivered."
          : "This report is currently held and cannot be delivered.";

  return {
    delivery_gate_status: deliveryGateStatus,
    customer_delivery_allowed: customerDeliveryAllowed,
    hold_delivery: holdDelivery,
    customer_status_label: customerStatusLabel,
    customer_status_reason_code: reasonCode,
    customer_message: customerMessage,
    public_sample_ready: Boolean(state.public_sample_ready),
    high_value_outreach_ready: Boolean(state.high_value_outreach_ready),
    public_blockers: publicBlockers,
    high_value_blockers: highValueBlockers,
    customer_blockers: customerBlockers,
    credit_restore_required: !coreValidRequiredCoverage && deliveryGateStatus === "user_needs_documents",
    fail_closed_reason_code: !customerDeliveryAllowed && !coreValidRequiredCoverage ? reasonCode : null,
    core_valid_required_coverage: coreValidRequiredCoverage,
    diagnostics: {
      owner_area: state.owner_area || null,
      recommended_next_step: state.recommended_next_step || null,
      reason_code: state.reason_code || null,
      readiness_hierarchy: state.readiness_hierarchy || null,
      customer_publish_eligible: state.customer_publish_eligible ?? null,
      report_publishable: state.report_publishable ?? null,
      report_blocked: state.report_blocked ?? null,
      public_sample_blockers: publicBlockers,
      high_value_outreach_blockers: highValueBlockers,
      customer_publish_blockers: customerBlockers,
      core_valid_required_coverage: coreValidRequiredCoverage,
      deprecated_admin_review_reason_classification: deprecatedAdminReviewResolution.classification,
      deprecated_admin_review_reason_requires_classification:
        deprecatedAdminReviewResolution.inject_diagnostic_code === "DEPRECATED_ADMIN_REVIEW_REASON_REQUIRES_CLASSIFICATION",
    },
    source: "canonical_delivery_decision",
  };
}

export function buildQaActionPlan({
  reportQaFlags = [],
  sourceReportCoverageQa = null,
  renderedReportQa = null,
  qaFixRouting = null,
  qaManagerReview = null,
  reportContractQa = null,
  jobId = null,
  userId = null,
  propertyName = null,
  reportType = null,
  reportTier = null,
  deliveryDecisionState = null,
  canonicalDeliveryDecisionState = null,
  delivery_gate_decision = null,
  deliveryGateDecision = null,
} = {}) {
  const actions = [];
  const debtContext = collectDebtContext({ sourceReportCoverageQa, qaFixRouting });

  for (const flag of Array.isArray(reportQaFlags) ? reportQaFlags : []) {
    const action = actionForReportFlag(flag, debtContext);
    if (action) pushAction(actions, action);
  }
  for (const flag of Array.isArray(sourceReportCoverageQa?.deterministic_flags) ? sourceReportCoverageQa.deterministic_flags : []) {
    const action = actionForCoverageFlag(flag);
    if (action) pushAction(actions, action);
  }
  for (const route of Array.isArray(qaFixRouting?.routes) ? qaFixRouting.routes : []) {
    const action = actionForRoute(route);
    if (action) pushAction(actions, action);
  }
  for (const finding of Array.isArray(renderedReportQa?.findings) ? renderedReportQa.findings : []) {
    if (managerSuppressesRenderedFinding(qaManagerReview, finding)) continue;
    const action = actionForRenderedFinding(finding);
    if (action) pushAction(actions, action);
  }
  for (const decision of Array.isArray(qaManagerReview?.decisions) ? qaManagerReview.decisions : []) {
    const action = actionForManagerDecision(decision);
    if (action) pushAction(actions, action);
  }
  for (const violation of Array.isArray(reportContractQa?.violations) ? reportContractQa.violations : []) {
    const action = actionForReportContractViolation(violation);
    if (action) pushAction(actions, action);
  }

  const prioritizedActions = sortActions(dedupeActions(actions));
  const counts = summarizeCounts(prioritizedActions);
  const publicSampleReadyLegacy =
    (qaFixRouting ? Boolean(qaFixRouting.public_sample_ready) : true) &&
    (reportContractQa ? Boolean(reportContractQa.public_sample_ready) : true) &&
    !prioritizedActions.some((action) => action.blocks_public_sample);
  const highValueOutreachReadyLegacy =
    publicSampleReadyLegacy &&
    !prioritizedActions.some((action) => action.blocks_high_value_outreach);
  const liveCoverageContext = Boolean(sourceReportCoverageQa);
  const customerReadyLegacy = !hasCriticalCompliance(
    liveCoverageContext
      ? prioritizedActions.filter((action) => !isCoreValidNonBlockingIssueCode(action?.code))
      : prioritizedActions
  );
  const regenerateRecommended = prioritizedActions.some((action) => action.requires_regeneration);
  const unsafeToAutoFixCount = prioritizedActions.filter((action) => !action.safe_to_auto_fix).length;
  const legacyDeliveryRecommendation = deliveryRecommendation({
    actions: prioritizedActions,
    publicSampleReady: publicSampleReadyLegacy,
    customerReady: customerReadyLegacy,
  });
  const legacyLaunchPathRecommendation = customerReadyLegacy
    ? (publicSampleReadyLegacy && highValueOutreachReadyLegacy ? "customer_deliverable" : "customer_deliverable_with_internal_advisory")
    : "internal_review_recommended";
  const readinessOverride = resolveCanonicalReadinessOverride({
    deliveryDecisionState,
    canonicalDeliveryDecisionState,
    deliveryGateDecision,
    delivery_gate_decision,
  });
  const customerReady = readinessOverride.present
    ? Boolean(readinessOverride.normalized?.customer_delivery_allowed)
    : customerReadyLegacy;
  const useLegacyFallback = !liveCoverageContext && !readinessOverride.present;
  const canonicalCustomerReady = Boolean(customerReady);
  const publicSampleReady = useLegacyFallback && readinessOverride.has_public_sample_ready
    ? Boolean(readinessOverride.normalized?.public_sample_ready)
    : Boolean(canonicalCustomerReady && publicSampleReadyLegacy);
  const highValueOutreachReady = useLegacyFallback && readinessOverride.has_high_value_outreach_ready
    ? Boolean(readinessOverride.normalized?.high_value_outreach_ready)
    : Boolean(canonicalCustomerReady && highValueOutreachReadyLegacy);
  const canonicalDeliveryGateStatus = readinessOverride.normalized?.delivery_gate_status || null;
  const canonicalLaunchPathRecommendation = customerReady
    ? (publicSampleReady && highValueOutreachReady ? "customer_deliverable" : "customer_deliverable_with_internal_advisory")
    : "internal_review_recommended";
  const canonicalDeliveryRecommendation = customerReady
    ? "customer_publish_eligible"
    : "customer_publish_not_ready";
  const finalDeliveryStatus = readinessOverride.present
    ? canonicalDeliveryGateStatus || (customerReady ? "delivery_gate_ready" : "delivery_gate_blocked")
    : customerReady ? "delivery_gate_ready" : "delivery_gate_blocked";
  const launchPathRecommendation = readinessOverride.present
    ? canonicalDeliveryGateStatus === "user_needs_documents"
      ? "user_needs_documents"
      : canonicalLaunchPathRecommendation
    : liveCoverageContext
      ? canonicalLaunchPathRecommendation
      : legacyLaunchPathRecommendation;
  const resolvedDeliveryRecommendation = readinessOverride.present
    ? canonicalDeliveryGateStatus === "user_needs_documents"
      ? "source_package_insufficient"
      : canonicalDeliveryRecommendation
    : liveCoverageContext
      ? canonicalDeliveryRecommendation
      : legacyDeliveryRecommendation;
  const readinessSource = liveCoverageContext
    ? "canonical_delivery_state"
    : readinessOverride.present
      ? "canonical_delivery_state"
      : "legacy_action_plan_fallback";
  const readinessFallbackUsed = !liveCoverageContext && !readinessOverride.present;

  return {
    event: "qa_action_plan",
    version: ACTION_PLAN_VERSION,
    advisory_only: true,
    no_public_surface: true,
    job_id: jobId,
    user_id: userId,
    property_name: propertyName,
    report_type: reportType,
    report_tier: reportTier,
    timestamp: new Date().toISOString(),
    delivery_recommendation: resolvedDeliveryRecommendation,
    customer_delivery_ready: customerReady,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    launch_path_recommendation: launchPathRecommendation,
    readiness_source: readinessSource,
    readiness_fallback_used: readinessFallbackUsed,
    canonical_delivery_gate_status: canonicalDeliveryGateStatus,
    core_input_sufficiency_state: sourceReportCoverageQa?.core_input_sufficiency_state || null,
    t12_sufficiency_state: sourceReportCoverageQa?.t12_sufficiency_state || null,
    rent_roll_sufficiency_state: sourceReportCoverageQa?.rent_roll_sufficiency_state || null,
    source_reconciliation_state: sourceReportCoverageQa?.source_reconciliation_state || null,
    section_eligibility: sourceReportCoverageQa?.section_eligibility || null,
    readiness_hierarchy: {
      final_delivery_authority: "delivery_gate",
      final_delivery_status: finalDeliveryStatus,
      customer_delivery_ready: customerReady,
      public_sample_ready: publicSampleReady,
      high_value_outreach_ready: highValueOutreachReady,
      advisory_only_findings: counts.total,
    },
    regenerate_recommended: regenerateRecommended,
    safe_to_regenerate_now: regenerateRecommended && !prioritizedActions.some((action) => action.requires_code_patch),
    unsafe_to_auto_fix_count: unsafeToAutoFixCount,
    highest_severity: highestSeverity(prioritizedActions),
    root_cause_summary: buildRootCauseSummary(prioritizedActions),
    prioritized_actions: prioritizedActions,
    action_counts: counts,
    model_upgrade_recommended: false,
    notes: [
      "Internal advisory action plan only.",
      "Does not mutate reports, parser values, worker state, or publication state.",
      "QA manager decisions are advisory and cannot change deterministic financial values.",
      "Derived acquisition financing must remain separate from current debt and refinance balance logic.",
    ],
  };
}

export const __test__ = {
  summarizeCounts,
  buildCanonicalDeliveryDecisionState,
  buildPublishEligibilitySummary,
  resolveCanonicalReadinessOverride,
};
