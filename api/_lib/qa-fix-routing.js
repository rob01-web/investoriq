const ROUTING_VERSION = "phase_1c_2026_05_05";

const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };

function normalizeSeverity(value) {
  const severity = String(value || "").toLowerCase();
  return severityRank[severity] ? severity : "low";
}

function highestSeverity(routes) {
  return (Array.isArray(routes) ? routes : []).reduce((highest, route) => (
    severityRank[normalizeSeverity(route?.severity)] > severityRank[highest]
      ? normalizeSeverity(route.severity)
      : highest
  ), "low");
}

function uniqueCodes(values) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean))];
}

function addRoute(routes, route) {
  routes.push({
    code: route.code,
    source: route.source,
    severity: normalizeSeverity(route.severity),
    category: route.category || null,
    routing: route.routing,
    action: route.action,
    safe_auto_fix: Boolean(route.safe_auto_fix),
    requires_regeneration: Boolean(route.requires_regeneration),
    admin_review_required: Boolean(route.admin_review_required),
    elite_blocker: Boolean(route.elite_blocker),
    distribution_config_blocker: Boolean(route.distribution_config_blocker),
    message: route.message || "",
    evidence: route.evidence || null,
  });
}

function routeCounts(routes) {
  const counts = {
    total: 0,
    by_routing: {},
    by_severity: {},
    safe_auto_fix: 0,
    requires_regeneration: 0,
    admin_review_required: 0,
    elite_blocker: 0,
    distribution_config_blocker: 0,
  };
  for (const route of Array.isArray(routes) ? routes : []) {
    counts.total += 1;
    const routing = route.routing || "unknown";
    const severity = normalizeSeverity(route.severity);
    counts.by_routing[routing] = (counts.by_routing[routing] || 0) + 1;
    counts.by_severity[severity] = (counts.by_severity[severity] || 0) + 1;
    if (route.safe_auto_fix) counts.safe_auto_fix += 1;
    if (route.requires_regeneration) counts.requires_regeneration += 1;
    if (route.admin_review_required) counts.admin_review_required += 1;
    if (route.elite_blocker) counts.elite_blocker += 1;
    if (route.distribution_config_blocker) counts.distribution_config_blocker += 1;
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

function buildRoutingContext(sourceReportCoverageQa) {
  const inventoryLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed || null;
  const inventoryRentRoll = sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed || null;
  const renderedSignals = Array.isArray(sourceReportCoverageQa?.rendered_text_signals)
    ? sourceReportCoverageQa.rendered_text_signals
    : [];
  const deterministicFlags = Array.isArray(sourceReportCoverageQa?.deterministic_flags)
    ? sourceReportCoverageQa.deterministic_flags
    : [];
  let acquisitionFinancingRendered = renderedSignals.includes("acquisition_financing_assumptions");
  const acquisitionFinancingReadinessLimitedRendered = renderedSignals.includes("acquisition_financing_readiness_limited");
  for (const flag of deterministicFlags) {
    if (flag?.evidence?.acquisition_financing?.rendered) acquisitionFinancingRendered = true;
  }
  return {
    has_derived_acquisition_debt: hasDerivedAcquisitionEvidence(inventoryLoan),
    has_current_debt_balance: hasCurrentDebtBalanceEvidence(inventoryLoan),
    acquisition_financing_rendered: acquisitionFinancingRendered,
    acquisition_financing_readiness_limited_rendered: acquisitionFinancingReadinessLimitedRendered,
    source_coverage_passed: sourceReportCoverageQa?.qa_status === "pass" || deterministicFlags.length === 0,
    rent_roll_present: Boolean(inventoryRentRoll?.present),
  };
}

function routeDisplayFix(flag, source) {
  const code = String(flag?.code || "");
  const exactSafeCodes = new Set([
    "DSCR_NOT_ASSESSED_RAW_WORDING",
    "DATA_NOT_AVAILABLE_VISIBLE",
    "RAW_TEMPLATE_TOKEN",
    "MOJIBAKE",
    "PUBLIC_DASH_CHARACTER",
  ]);
  return {
    code,
    source,
    severity: flag?.severity || "medium",
    category: flag?.category || "display_quality",
    routing: "display_fix",
      action: "deterministic_template_or_render_patch",
      safe_auto_fix: exactSafeCodes.has(code),
      requires_regeneration: true,
      admin_review_required: normalizeSeverity(flag?.severity) === "high" || normalizeSeverity(flag?.severity) === "critical",
      elite_blocker: normalizeSeverity(flag?.severity) !== "low",
      distribution_config_blocker: false,
      message: flag?.message || "Visible report output requires deterministic display cleanup.",
      evidence: flag?.evidence || null,
    };
}

function routeParserGap(flag, source, context = {}) {
  const code = String(flag?.code || "");
  const parserGapCodes = new Set([
    "T12_LINE_ITEM_DETAIL_MISSING",
    "T12_TOTALS_ONLY",
    "RENOVATION_DOC_NOT_STRUCTURED",
    "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
    "DEBT_FILE_WITH_MISSING_BALANCE",
  ]);
  if (!parserGapCodes.has(code)) return null;
  const derivedOnlyRendered =
    code === "DEBT_FILE_WITH_MISSING_BALANCE" &&
    (hasDerivedAcquisitionEvidence(flag?.evidence) || context.has_derived_acquisition_debt) &&
    !hasCurrentDebtBalanceEvidence(flag?.evidence) &&
    !context.has_current_debt_balance &&
    context.acquisition_financing_rendered;
  if (derivedOnlyRendered) {
    return {
      code,
      source,
      severity: "low",
      category: flag?.category || "qa_calibration",
      routing: "source_insufficient",
      action: "no_current_debt_balance_action_when_acquisition_financing_rendered",
      safe_auto_fix: false,
      requires_regeneration: false,
      admin_review_required: false,
      elite_blocker: false,
      distribution_config_blocker: false,
      message: "Proposed acquisition financing rendered separately; missing current debt balance is not a parser blocker.",
      evidence: flag?.evidence || null,
    };
  }
  const routing = code === "RENOVATION_DOC_NOT_STRUCTURED" || code === "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT"
    ? "artifact_gap"
    : "parser_gap";
  const severity = normalizeSeverity(flag?.severity || "medium");
  return {
    code,
    source,
    severity,
    category: flag?.category || "parser_extraction_gap",
    routing,
    action: "parser_or_artifact_fix_required",
    safe_auto_fix: false,
    requires_regeneration: true,
    admin_review_required: true,
    elite_blocker: severity === "medium" || severity === "high" || severity === "critical",
    distribution_config_blocker: false,
    message: flag?.message || "Structured source data did not reach the report.",
    evidence: flag?.evidence || null,
  };
}

function routeRenderGap(flag, source, context = {}) {
  const code = String(flag?.code || "");
  const renderGapCodes = new Set([
    "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
    "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
    "MISSING_DEBT_SECTION_WITH_DEBT_TERMS",
    "MISSING_RENOVATION_SECTION_WITH_RENOVATION_DOC",
    "MISSING_REFI_STABILITY_WITH_FINANCING_ASSUMPTIONS",
    "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
  ]);
  if (!renderGapCodes.has(code)) return null;
  const derivedOnlyRendered =
    code === "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT" &&
    (hasDerivedAcquisitionEvidence(flag?.evidence) || context.has_derived_acquisition_debt) &&
    !hasCurrentDebtBalanceEvidence(flag?.evidence) &&
    !context.has_current_debt_balance &&
    context.acquisition_financing_rendered;
  if (derivedOnlyRendered) {
    return {
      code,
      source,
      severity: flag?.severity || "medium",
      category: flag?.category || "source_document_limitation",
      routing: "source_insufficient",
      action: "keep_current_dscr_unassessed_without_true_current_debt_balance",
      safe_auto_fix: false,
      requires_regeneration: false,
      admin_review_required: false,
      elite_blocker: false,
      distribution_config_blocker: false,
      message: flag?.message || "Current DSCR remains unassessed because only proposed acquisition financing was provided.",
      evidence: flag?.evidence || null,
    };
  }
  const publicOnlyDepthCodes = new Set([
    "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
    "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
  ]);
  if (publicOnlyDepthCodes.has(code)) {
    return {
      code,
      source,
      severity: flag?.severity || "medium",
      category: flag?.category || "render_gating_gap",
      routing: "render_gating_gap",
      action: "document_section_depth_constraints_for_elite_readiness",
      safe_auto_fix: false,
      requires_regeneration: false,
      admin_review_required: false,
      elite_blocker: true,
      distribution_config_blocker: false,
      message: flag?.message || "Rendered underwriting depth is source-constrained relative to the support package.",
      evidence: flag?.evidence || null,
    };
  }
  return {
    code,
    source,
    severity: flag?.severity || "medium",
    category: flag?.category || "render_gating_gap",
    routing: "render_gating_gap",
    action: "inspect_parser_artifacts_and_render_gating_for_elite_readiness",
    safe_auto_fix: false,
    requires_regeneration: true,
    admin_review_required: true,
    elite_blocker: true,
    distribution_config_blocker: false,
    message: flag?.message || "Rendered report depth does not match available source support.",
    evidence: flag?.evidence || null,
  };
}

function routeSourceInsufficient(flag, source) {
  const code = String(flag?.code || "");
  if (!/SOURCE|UNSUPPORTED|MISSING_DOCUMENT|INSUFFICIENT/i.test(code)) return null;
  const severity = normalizeSeverity(flag?.severity || "medium");
  return {
    code,
    source,
    severity,
    category: flag?.category || "source_insufficient",
    routing: "source_insufficient",
    action: "request_better_source_documents_or_disclose_limitation",
    safe_auto_fix: false,
    requires_regeneration: false,
    admin_review_required: severity === "high" || severity === "critical",
    elite_blocker: true,
    distribution_config_blocker: false,
    message: flag?.message || "Source package is insufficient or unsupported for showcase use.",
    evidence: flag?.evidence || null,
  };
}

function routeRenderedFinding(finding) {
  const text = [
    finding?.code,
    finding?.category,
    finding?.message,
    finding?.issue,
    finding?.suggested_review,
    finding?.excerpt,
  ].filter(Boolean).join(" ");
  const displayPattern = /DATA NOT AVAILABLE|template token|mojibake|encoding|placeholder|not assessed|em dash|en dash|unsupported placeholder/i;
  if (!displayPattern.test(text)) return null;
  return routeDisplayFix({
    code: finding?.code || "RENDERED_REPORT_DISPLAY_WARNING",
    severity: finding?.severity || "medium",
    category: finding?.category || "display_quality",
    message: finding?.message || finding?.issue || "Rendered report contains a visible display-quality warning.",
    evidence: {
      excerpt: finding?.excerpt || null,
      suggested_review: finding?.suggested_review || null,
    },
  }, "rendered_report_qa_advisory");
}

function routeFlag(flag, source, context = {}) {
  if (String(flag?.code || "") === "ACQUISITION_FINANCING_FIELD_LIMITED") {
    const limitedRendered = Boolean(context.acquisition_financing_readiness_limited_rendered);
    return {
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      source,
      severity: limitedRendered ? "low" : normalizeSeverity(flag?.severity || "medium"),
      category: flag?.category || "source_document_limitation",
      routing: "source_insufficient",
      action: limitedRendered
        ? "no_action_false_positive"
        : "acquisition_financing_remains_source_limited_until_terms_are_complete",
      safe_auto_fix: false,
      requires_regeneration: false,
      admin_review_required: false,
      elite_blocker: false,
      distribution_config_blocker: false,
      message: limitedRendered
        ? "Acquisition financing is intentionally source-limited and correctly qualified in the memo."
        : flag?.message || "Acquisition financing remains source-limited until proposed terms are source-complete.",
      evidence: flag?.evidence || null,
    };
  }
  if (String(flag?.code || "") === "DOCRAPTOR_NOT_PRODUCTION_MODE") {
    return {
      code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
      source,
      severity: normalizeSeverity(flag?.severity || "medium"),
      category: flag?.category || "production_config",
      routing: "distribution_config_blocker",
      action: "verify_production_pdf_mode_before_external_distribution",
      safe_auto_fix: false,
      requires_regeneration: true,
      admin_review_required: false,
      elite_blocker: false,
      distribution_config_blocker: true,
      message: flag?.message || "Production PDF configuration is not enabled.",
      evidence: flag?.evidence || null,
    };
  }
  if (
    String(flag?.code || "") === "MARKET_SURVEY_CLASSIFICATION_REVIEW" &&
    context.source_coverage_passed &&
    context.rent_roll_present
  ) {
    return {
      code: "MARKET_SURVEY_CLASSIFICATION_REVIEW",
      source,
      severity: "low",
      category: flag?.category || "source_document_hygiene",
      routing: "source_insufficient",
      action: "market_survey_classification_note_only_when_rent_roll_parsed",
      safe_auto_fix: false,
      requires_regeneration: false,
      admin_review_required: false,
      elite_blocker: false,
      distribution_config_blocker: false,
      message: flag?.message || "Market survey classification review is informational because rent roll parsing and source coverage passed.",
      evidence: flag?.evidence || null,
    };
  }
  return (
    routeParserGap(flag, source, context) ||
    routeRenderGap(flag, source, context) ||
    routeSourceInsufficient(flag, source) ||
    routeDisplayFix(flag, source)
  );
}

export function buildQaFixRouting({
  reportQaFlags = [],
  sourceReportCoverageQa = null,
  renderedReportQa = null,
  reportType = null,
  reportTier = null,
  jobId = null,
  userId = null,
  propertyName = null,
} = {}) {
  const routes = [];
  const routingContext = buildRoutingContext(sourceReportCoverageQa);

  for (const flag of Array.isArray(reportQaFlags) ? reportQaFlags : []) {
    const route = routeFlag(flag, "report_qa_flags", routingContext);
    if (route) addRoute(routes, route);
  }

  for (const flag of Array.isArray(sourceReportCoverageQa?.deterministic_flags) ? sourceReportCoverageQa.deterministic_flags : []) {
    if (flag?.code === "PUBLIC_SAMPLE_NOT_READY") continue;
    const route = routeFlag(flag, "source_report_coverage_qa", routingContext);
    if (route) addRoute(routes, route);
  }

  for (const finding of Array.isArray(renderedReportQa?.findings) ? renderedReportQa.findings : []) {
    const route = routeRenderedFinding(finding);
    if (route) addRoute(routes, route);
  }

  const counts = routeCounts(routes);
  const highSeverity = highestSeverity(routes);
  const eliteBlockers = uniqueCodes(routes.filter((route) => route.elite_blocker).map((route) => route.code));
  const distributionConfigBlockers = uniqueCodes(routes.filter((route) => route.distribution_config_blocker).map((route) => route.code));
  const eliteReady = eliteBlockers.length === 0;
  const distributionConfigBlocked = distributionConfigBlockers.length > 0;
  return {
    event: "qa_fix_routing",
    advisory_only: true,
    no_public_surface: true,
    job_id: jobId,
    user_id: userId,
    property_name: propertyName,
    report_type: reportType,
    report_tier: reportTier,
    routes,
    route_counts: counts,
    highest_severity: highSeverity,
    elite_ready: eliteReady,
    elite_readiness_blockers: eliteBlockers,
    distribution_config_blocked: distributionConfigBlocked,
    distribution_config_blockers: distributionConfigBlockers,
    advisory_only_findings: uniqueCodes(routes.filter((route) => !route.elite_blocker).map((route) => route.code)),
    customer_delivery_action: "advisory_only_no_delivery_block",
    admin_action_required: routes.some((route) => route.admin_review_required),
    deterministic_auto_fix_available: routes.some((route) => route.safe_auto_fix),
    regenerate_recommended: routes.some((route) => route.requires_regeneration),
    version: ROUTING_VERSION,
    timestamp: new Date().toISOString(),
  };
}

export const __test__ = {
  routeCounts,
};
