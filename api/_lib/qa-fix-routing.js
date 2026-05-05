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
    public_sample_blocker: Boolean(route.public_sample_blocker),
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
    public_sample_blocker: 0,
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
    if (route.public_sample_blocker) counts.public_sample_blocker += 1;
  }
  return counts;
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
    public_sample_blocker: normalizeSeverity(flag?.severity) !== "low",
    message: flag?.message || "Visible report output requires deterministic display cleanup.",
    evidence: flag?.evidence || null,
  };
}

function routeParserGap(flag, source) {
  const code = String(flag?.code || "");
  const parserGapCodes = new Set([
    "T12_LINE_ITEM_DETAIL_MISSING",
    "T12_TOTALS_ONLY",
    "RENOVATION_DOC_NOT_STRUCTURED",
    "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
    "DEBT_FILE_WITH_MISSING_BALANCE",
  ]);
  if (!parserGapCodes.has(code)) return null;
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
    public_sample_blocker: severity === "medium" || severity === "high" || severity === "critical",
    message: flag?.message || "Structured source data did not reach the report.",
    evidence: flag?.evidence || null,
  };
}

function routeRenderGap(flag, source) {
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
  return {
    code,
    source,
    severity: flag?.severity || "medium",
    category: flag?.category || "render_gating_gap",
    routing: "render_gating_gap",
    action: "inspect_parser_artifacts_and_render_gating",
    safe_auto_fix: false,
    requires_regeneration: true,
    admin_review_required: true,
    public_sample_blocker: true,
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
    public_sample_blocker: true,
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

function routeFlag(flag, source) {
  return (
    routeParserGap(flag, source) ||
    routeRenderGap(flag, source) ||
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

  for (const flag of Array.isArray(reportQaFlags) ? reportQaFlags : []) {
    const route = routeFlag(flag, "report_qa_flags");
    if (route) addRoute(routes, route);
  }

  for (const flag of Array.isArray(sourceReportCoverageQa?.deterministic_flags) ? sourceReportCoverageQa.deterministic_flags : []) {
    if (flag?.code === "PUBLIC_SAMPLE_NOT_READY") continue;
    const route = routeFlag(flag, "source_report_coverage_qa");
    if (route) addRoute(routes, route);
  }

  for (const finding of Array.isArray(renderedReportQa?.findings) ? renderedReportQa.findings : []) {
    const route = routeRenderedFinding(finding);
    if (route) addRoute(routes, route);
  }

  const hasMediumHighParserArtifactOrRenderRoute = routes.some((route) =>
    ["parser_gap", "artifact_gap", "render_gating_gap"].includes(route.routing) &&
    ["medium", "high", "critical"].includes(normalizeSeverity(route.severity))
  );

  if (hasMediumHighParserArtifactOrRenderRoute) {
    addRoute(routes, {
      code: "PUBLIC_SAMPLE_REVIEW_HOLD",
      source: "qa_fix_routing",
      severity: "high",
      category: "public_sample_readiness",
      routing: "public_sample_blocker",
      action: "do_not_use_for_public_or_outreach_sample_until_resolved",
      safe_auto_fix: false,
      requires_regeneration: true,
      admin_review_required: true,
      public_sample_blocker: true,
      message: "Medium or high source, parser, artifact, or render-depth findings require resolution before public or outreach sample use.",
      evidence: {
        blocking_route_codes: routes
          .filter((route) => ["parser_gap", "artifact_gap", "render_gating_gap"].includes(route.routing))
          .map((route) => route.code),
      },
    });
  }

  const counts = routeCounts(routes);
  const highSeverity = highestSeverity(routes);
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
    public_sample_ready: !routes.some((route) => route.public_sample_blocker),
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
