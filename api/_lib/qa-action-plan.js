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
  const loan = evidence?.loan_term_sheet || evidence?.loan_term_sheet_parsed || evidence?.debt_payload || evidence || {};
  return Boolean(
    loan?.has_balance ||
    Number(loan?.loan_amount) > 0 ||
    Number(loan?.outstanding_balance) > 0 ||
    Number(loan?.monthly_payment) > 0 ||
    Number(loan?.annual_debt_service) > 0
  );
}

function collectDebtContext({ sourceReportCoverageQa = null, qaFixRouting = null } = {}) {
  const candidates = [];
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
    has_derived_acquisition_debt: candidates.some((candidate) => hasDerivedAcquisitionEvidence(candidate)),
    has_current_debt_balance: candidates.some((candidate) => hasCurrentDebtBalanceEvidence(candidate)),
    acquisition_financing_rendered: acquisitionFinancingRendered,
    source_coverage_passed: sourceReportCoverageQa?.qa_status === "pass" || deterministicFlags.length === 0,
    rent_roll_present: Boolean(inventoryRentRoll?.present),
  };
}

function actionForReportFlag(flag, context = {}) {
  const code = String(flag?.code || "");
  const severity = flag?.severity || "medium";
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
      recommended_next_step: "Enable and verify production PDF mode before public sample or outreach use.",
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
        : "Inspect parser artifacts and section gating before using as public sample or outreach report.",
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
    recommended_next_step: route.action || "Inspect QA route and resolve before sample use.",
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

  const hardPublicLanguage = classification === "real_public_language_risk" &&
    isHardPublicLanguageExcerpt(decision?.evidence_excerpt);
  const speculativePublicLanguage = classification === "real_public_language_risk" && !hardPublicLanguage;
  const requiresCodePatch = hardPublicLanguage ||
    (!speculativePublicLanguage &&
      classification !== "admin_review_optional" &&
      classification !== "source_document_limitation" &&
      classification !== "production_config_only" &&
      Boolean(decision?.requires_code_patch));

  return {
    code: decision?.source_code || "QA_MANAGER_REVIEW",
    title: decision?.rationale || "QA manager review decision",
    source_artifact: "qa_manager_review",
    severity: hardPublicLanguage ? "critical" : normalizeSeverity(decision?.severity),
    action_type: hardPublicLanguage ? "code_patch_required" : speculativePublicLanguage ? "model_review_recommended" : actionType,
    owner_area: speculativePublicLanguage ? "qa_manager" : ownerByClassification[classification],
    recommended_next_step: speculativePublicLanguage
      ? "Review manually only if actual rendered excerpt contains prohibited public language."
      : decision?.recommended_action_type || "Review QA manager decision.",
    requires_code_patch: requiresCodePatch,
    requires_regeneration: Boolean(decision?.requires_regeneration) && requiresCodePatch,
    blocks_customer_delivery: hardPublicLanguage,
    blocks_public_sample: !speculativePublicLanguage && (Boolean(decision?.blocks_public_sample) || hardPublicLanguage),
    blocks_high_value_outreach: !speculativePublicLanguage && (Boolean(decision?.blocks_high_value_outreach) || hardPublicLanguage),
    safe_to_auto_fix: false,
    evidence: {
      classification,
      source_artifact: decision?.source_artifact || null,
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
      recommended_next_step: "Align all rendered current-debt DSCR values to the source-of-truth current debt service basis before public sample or high-value outreach use.",
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
    code === "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT" ||
    code === "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED";
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
      : "Patch deterministic renderer gating so the unsupported table, section, label, or report-type content cannot render.",
    requires_code_patch: true,
    requires_regeneration: true,
    blocks_customer_delivery: Boolean(violation?.blocks_customer_delivery) && (hardPublicOrDebug || materiallyMisleadingDebt),
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
  if (!publicSampleReady) return "do_not_use_for_public_or_high_value_outreach";
  if (actions.length > 0) return "customer_deliverable_with_internal_warning";
  return "customer_deliverable";
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
  const publicSampleReady =
    (qaFixRouting ? Boolean(qaFixRouting.public_sample_ready) : true) &&
    (reportContractQa ? Boolean(reportContractQa.public_sample_ready) : true) &&
    !prioritizedActions.some((action) => action.blocks_public_sample);
  const highValueOutreachReady =
    publicSampleReady &&
    !prioritizedActions.some((action) => action.blocks_high_value_outreach);
  const customerReady = !hasCriticalCompliance(prioritizedActions);
  const regenerateRecommended = prioritizedActions.some((action) => action.requires_regeneration);
  const unsafeToAutoFixCount = prioritizedActions.filter((action) => !action.safe_to_auto_fix).length;

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
    delivery_recommendation: deliveryRecommendation({
      actions: prioritizedActions,
      publicSampleReady,
      customerReady,
    }),
    customer_delivery_ready: customerReady,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
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
};
