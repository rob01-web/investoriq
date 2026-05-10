import { containsProhibitedPublicLanguage } from "./investoriq-qa-doctrine.js";

const QA_DIRECTOR_REVIEW_VERSION = "2026.05.08.1";

function stripHtml(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/(p|div|tr|li|h[1-6]|section|article|td|th)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function allQaText(...items) {
  return items.map((item) => JSON.stringify(item || {})).join(" ");
}

function addFinding(findings, finding) {
  if (findings.length >= 5) return;
  findings.push({
    code: finding.code,
    severity: finding.severity || "low",
    classification: finding.classification || "advisory_attention",
    message: finding.message || "",
    evidence_excerpt: finding.evidence_excerpt || "",
    evidence: finding.evidence || null,
  });
}

function hasActionPlanCustomerBlock(qaActionPlan) {
  return Boolean(qaActionPlan?.customer_delivery_ready === false) ||
    (Array.isArray(qaActionPlan?.prioritized_actions) &&
      qaActionPlan.prioritized_actions.some((action) => action?.blocks_customer_delivery));
}

function hasHighSeverityPublicOrOutreachAction(qaActionPlan) {
  const highSeverity = new Set(["high", "critical"]);
  return Array.isArray(qaActionPlan?.prioritized_actions) &&
    qaActionPlan.prioritized_actions.some((action) =>
      highSeverity.has(String(action?.severity || "").toLowerCase()) &&
      (action?.blocks_public_sample === true || action?.blocks_high_value_outreach === true)
    );
}

function riskFromFindings(findings, target) {
  const rank = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return findings.reduce((risk, finding) => {
    const severity = finding?.severity || "low";
    const applies =
      target === "customer" ? finding?.blocks_customer_delivery :
      target === "public" ? finding?.blocks_public_sample :
      finding?.blocks_high_value_outreach;
    return applies && rank[severity] > rank[risk] ? severity : risk;
  }, "none");
}

export function buildQaDirectorReview({
  jobId = null,
  userId = null,
  propertyName = null,
  reportType = null,
  reportTier = null,
  reportContractQa = null,
  qaActionPlan = null,
  renderedReportQa = null,
  sourcePackageQa = null,
  qaManagerReview = null,
  sourceReportCoverageQa = null,
  html = "",
} = {}) {
  const text = stripHtml(html);
  const qaText = allQaText(renderedReportQa, sourcePackageQa, qaManagerReview);
  const findings = [];
  const missedFailureClasses = [];
  const overblockedFailureClasses = [];

  const dscrPressure = /Primary Pressure Point\s*:?\s*DSCR[^0-9]{0,30}([0-9]+(?:\.[0-9]+)?)x/i.exec(text);
  const dscrPressureValue = dscrPressure ? Number(dscrPressure[1]) : null;
  if (
    Number.isFinite(dscrPressureValue) &&
    dscrPressureValue < 1.25 &&
    /DSCR[^.]{0,80}(?:not clearly highlighted|not highlighted|unclear|insufficiently highlighted)/i.test(qaText)
  ) {
    overblockedFailureClasses.push("dscr_highlight_false_positive");
    addFinding(findings, {
      code: "QA_FALSE_POSITIVE_DSCR_HIGHLIGHT_ALREADY_PRESENT",
      severity: "low",
      classification: "likely_false_positive_overblock",
      message: "QA flagged DSCR prominence even though the rendered report already uses DSCR as the Primary Pressure Point.",
      evidence_excerpt: dscrPressure[0],
    });
  }

  if (
    /unsupported docs?.{0,120}(?:not clearly excluded|not excluded|unclear)/i.test(qaText) &&
    /Unsupported or unstructured uploads remain excluded from modeled outputs/i.test(text)
  ) {
    overblockedFailureClasses.push("unsupported_docs_exclusion_false_positive");
    addFinding(findings, {
      code: "QA_FALSE_POSITIVE_UNSUPPORTED_DOCS_ALREADY_DISCLOSED",
      severity: "low",
      classification: "likely_false_positive_overblock",
      message: "QA flagged unsupported-doc disclosure even though the rendered report excludes unsupported uploads from modeled outputs.",
      evidence_excerpt: "Unsupported or unstructured uploads remain excluded from modeled outputs.",
    });
  }

  if (
    Array.isArray(reportContractQa?.violations) &&
    reportContractQa.violations.some((violation) => violation?.code === "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH")
  ) {
    addFinding(findings, {
      code: "QA_DIRECTOR_RECONCILIATION_MISMATCH_PRESENT",
      severity: "medium",
      classification: "advisory_attention",
      message: "Report Contract QA contains a current-debt DSCR reconciliation mismatch that requires attention.",
      evidence: {
        report_contract_qa: true,
      },
    });
  }

  const hasCriticalContract = Array.isArray(reportContractQa?.violations) &&
    reportContractQa.violations.some((violation) => violation?.severity === "critical" || violation?.blocks_customer_delivery);
  if (hasCriticalContract && !hasActionPlanCustomerBlock(qaActionPlan)) {
    missedFailureClasses.push("critical_contract_not_reflected_in_action_plan");
    addFinding(findings, {
      code: "QA_ACTION_PLAN_MISSED_CRITICAL_CONTRACT",
      severity: "critical",
      classification: "action_plan_incomplete",
      message: "Report Contract QA contains customer-blocking critical violations but QA Action Plan does not block customer delivery.",
      evidence: { contract_status: reportContractQa?.contract_status, customer_delivery_ready: qaActionPlan?.customer_delivery_ready },
    });
  }

  const hardPublicLanguage = containsProhibitedPublicLanguage(text) || /\b(?:AI|OpenAI|LLM)\b/i.test(text);
  if (hardPublicLanguage && !hasActionPlanCustomerBlock(qaActionPlan)) {
    missedFailureClasses.push("hard_public_language_not_blocked");
    addFinding(findings, {
      code: "QA_DIRECTOR_MISSED_HARD_PUBLIC_LANGUAGE_BLOCKER",
      severity: "critical",
      classification: "likely_missed_blocker",
      message: "Rendered text contains prohibited public language but QA Action Plan does not block customer delivery.",
      evidence_excerpt: text.match(/\b(?:BUY|SELL|HOLD|AI|OpenAI|LLM)\b.{0,120}/i)?.[0] || "",
    });
  }

  if (hasHighSeverityPublicOrOutreachAction(qaActionPlan)) {
    addFinding(findings, {
      code: "QA_DIRECTOR_ACTION_PLAN_PUBLIC_OUTREACH_BLOCKER_PRESENT",
      severity: "medium",
      classification: "advisory_attention",
      message: "QA Action Plan contains high-severity public-sample or high-value-outreach blockers that require attention.",
      evidence: {
        customer_delivery_ready: qaActionPlan?.customer_delivery_ready,
        public_sample_ready: qaActionPlan?.public_sample_ready,
        high_value_outreach_ready: qaActionPlan?.high_value_outreach_ready,
      },
    });
  }

  const overall =
    missedFailureClasses.length > 0 ? "likely_missed_blocker" :
    findings.some((finding) => finding.classification === "action_plan_incomplete") ? "action_plan_incomplete" :
    overblockedFailureClasses.length > 0 ? "likely_false_positive_overblock" :
    findings.length > 0 ? "advisory_attention" :
    "no_missed_issue_detected";

  const decoratedFindings = findings.map((finding) => ({
    ...finding,
    blocks_customer_delivery: finding.severity === "critical" && finding.classification === "likely_missed_blocker",
    blocks_public_sample: ["medium", "high", "critical"].includes(finding.severity),
    blocks_high_value_outreach: ["medium", "high", "critical"].includes(finding.severity),
  }));

  return {
    event: "qa_director_review",
    version: QA_DIRECTOR_REVIEW_VERSION,
    advisory_only: true,
    no_public_surface: true,
    model_status: "deterministic_v1",
    job_id: jobId,
    user_id: userId,
    property_name: propertyName,
    report_type: reportType,
    report_tier: reportTier,
    overall_director_decision: overall,
    customer_delivery_risk: riskFromFindings(decoratedFindings, "customer"),
    public_sample_risk: riskFromFindings(decoratedFindings, "public"),
    high_value_outreach_risk: riskFromFindings(decoratedFindings, "outreach"),
    missed_failure_classes: missedFailureClasses.slice(0, 5),
    overblocked_failure_classes: overblockedFailureClasses.slice(0, 5),
    findings: decoratedFindings.slice(0, 5),
    timestamp: new Date().toISOString(),
  };
}

export const __test__ = {
  stripHtml,
};
