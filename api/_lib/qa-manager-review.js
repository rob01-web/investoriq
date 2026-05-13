import {
  INVESTORIQ_QA_DOCTRINE,
  INVESTORIQ_INSTITUTIONAL_REPORT_QA_CHECKLIST,
  containsProhibitedPublicLanguage,
} from "./investoriq-qa-doctrine.js";

const QA_MANAGER_REVIEW_VERSION = "2026.05.07.1";
const DEFAULT_MODEL =
  process.env.QA_MANAGER_MODEL ||
  process.env.QA_SOURCE_PACKAGE_MODEL ||
  process.env.QA_REVIEW_MODEL ||
  process.env.OPENAI_REPORT_QA_MODEL ||
  "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.QA_MANAGER_TIMEOUT_MS || "15000", 10);
const MAX_RENDERED_TEXT_CHARS = 50000;

function stripHtmlForManager(html) {
  if (typeof html !== "string") return "";
  let text = html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<\/(p|div|tr|li|h[1-6]|section|article|header|footer|td|th)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.length > MAX_RENDERED_TEXT_CHARS
    ? `${text.slice(0, MAX_RENDERED_TEXT_CHARS)}\n[truncated for internal QA manager review]`
    : text;
}

function normalizeDecision(decision) {
  return {
    source_code: String(decision?.source_code || "QA_MANAGER_REVIEW_NOTE"),
    source_artifact: String(decision?.source_artifact || ""),
    classification: [
      "real_parser_or_artifact_risk",
      "real_source_report_contradiction",
      "real_public_language_risk",
      "source_document_limitation",
      "production_config_only",
      "false_positive",
      "admin_review_optional",
      "no_action",
    ].includes(decision?.classification) ? decision.classification : "admin_review_optional",
    severity: ["critical", "high", "medium", "low", "info"].includes(decision?.severity)
      ? decision.severity
      : "info",
    rationale: String(decision?.rationale || ""),
    evidence_excerpt: String(decision?.evidence_excerpt || ""),
    recommended_action_type: String(decision?.recommended_action_type || "admin_review_optional"),
    requires_code_patch: Boolean(decision?.requires_code_patch),
    requires_regeneration: Boolean(decision?.requires_regeneration),
    blocks_customer_delivery: Boolean(decision?.blocks_customer_delivery),
    blocks_public_sample: Boolean(decision?.blocks_public_sample),
    blocks_high_value_outreach: Boolean(decision?.blocks_high_value_outreach),
  };
}

function coveragePassed(sourceReportCoverageQa) {
  return (
    sourceReportCoverageQa?.qa_status === "pass" &&
    (!Array.isArray(sourceReportCoverageQa?.deterministic_flags) ||
      sourceReportCoverageQa.deterministic_flags.length === 0)
  );
}

function hasUnsupportedExclusionDisclosure(text) {
  const source = String(text || "");
  return (
    /not used quantitatively/i.test(source) ||
    /excluded from modeled outputs/i.test(source) ||
    /unsupported or unstructured uploads remain excluded/i.test(source)
  );
}

function hasCurrentDebtLimitationDisclosure(text, currentDebtState = null) {
  const source = String(text || "");
  const stateDisclosure =
    currentDebtState?.current_debt_dscr_status !== "computed" &&
    Boolean(currentDebtState?.current_debt_limitation_reason_code);
  return (
    stateDisclosure ||
    /Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(source) ||
    /Current Debt DSCR[^.]{0,120}current outstanding debt balance not provided/i.test(source) ||
    /Current debt service is not assessed because no current outstanding debt balance was provided/i.test(source) ||
    /Current-debt DSCR and refinance capacity were not assessed because no current outstanding debt balance was verified/i.test(source) ||
    /No current debt document provided/i.test(source) ||
    /Current debt terms were not fully provided/i.test(source) ||
    /Current debt service not assessed/i.test(source)
  );
}

function hasClassificationContext(text) {
  const source = String(text || "");
  return (
    /capital risk profile/i.test(source) ||
    /primary pressure point/i.test(source) ||
    /DSCR|refinance|lender threshold|coverage threshold/i.test(source) ||
    /expense ratio|NOI margin|break[- ]?even occupancy/i.test(source) ||
    /standardized underwriting threshold/i.test(source)
  );
}

function normalizeManagerDecisions(decisions, context = {}) {
  const renderedText = context.renderedText || "";
  const sourceCoverage = context.sourceReportCoverageQa || null;
  const currentDebtState = sourceCoverage?.current_debt_state || null;
  return (Array.isArray(decisions) ? decisions : []).map((decision) => {
    const normalized = normalizeDecision(decision);
    const text = [
      normalized.source_code,
      normalized.rationale,
      normalized.evidence_excerpt,
      normalized.recommended_action_type,
    ].join(" ");
    const unsupportedReference =
      /unsupported|unstructured|pending|supporting document/i.test(text) &&
      !/relied on quantitatively|quantitatively relies|modeled value|unsupported claim/i.test(text);
    if (
      unsupportedReference &&
      coveragePassed(sourceCoverage) &&
      hasUnsupportedExclusionDisclosure(renderedText)
    ) {
      return {
        ...normalized,
        classification: "false_positive",
        severity: "info",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      };
    }

    const classificationTerm =
      /\b(Sensitized|Stable|Fragile|Refinance Shortfall Under Stress)\b/i.test(text);
    if (
      classificationTerm &&
      hasClassificationContext(renderedText) &&
      !containsProhibitedPublicLanguage(normalized.evidence_excerpt)
    ) {
      return {
        ...normalized,
        classification: "false_positive",
        severity: "info",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      };
    }

    const currentDebtLimitationDisclosure =
      /Current debt|Current Debt|current debt|current dscr|refinance|debt coverage/i.test(text) &&
      /No current debt document provided|Current debt terms were not fully provided|Current debt service not assessed|Current debt balance not provided|Current outstanding debt balance not provided/i.test(text);
    if (
      currentDebtLimitationDisclosure &&
      hasCurrentDebtLimitationDisclosure(renderedText, currentDebtState) &&
      /Proposed Acquisition Debt Sizing|Derived Acquisition Loan Amount|not current outstanding debt/i.test(renderedText)
    ) {
      return {
        ...normalized,
        classification: "false_positive",
        severity: "info",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      };
    }

    const currentDebtClarity =
      /current debt|current dscr|refinance|debt coverage/i.test(text) &&
      /unclear|not clear|confusing|not assessed|missing|not produced|no current debt document provided|current debt terms were not fully provided|current debt service not assessed/i.test(text);
    if (
      currentDebtClarity &&
      hasCurrentDebtLimitationDisclosure(renderedText, currentDebtState) &&
      /Proposed Acquisition Debt Sizing|Derived Acquisition Loan Amount|not current outstanding debt/i.test(renderedText)
    ) {
      return {
        ...normalized,
        classification: "false_positive",
        severity: "info",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      };
    }

    const constrainedLanguage =
      /\b(Document-Constrained Review|Constrained)\b/i.test(text) &&
      !containsProhibitedPublicLanguage(normalized.evidence_excerpt);
    if (
      constrainedLanguage &&
      /CORE INPUT COVERAGE CONFIRMED|Data Coverage|Current debt coverage and refinance sufficiency were not produced/i.test(renderedText)
    ) {
      return {
        ...normalized,
        classification: "false_positive",
        severity: "info",
        recommended_action_type: "no_action",
        requires_code_patch: false,
        requires_regeneration: false,
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      };
    }

    return normalized;
  });
}

function countDecisions(decisions) {
  const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, by_classification: {} };
  for (const decision of Array.isArray(decisions) ? decisions : []) {
    counts.total += 1;
    counts[decision.severity] = (counts[decision.severity] || 0) + 1;
    counts.by_classification[decision.classification] =
      (counts.by_classification[decision.classification] || 0) + 1;
  }
  return counts;
}

function highestSeverity(decisions) {
  const rank = { none: 0, info: 1, low: 2, medium: 3, high: 4, critical: 5 };
  return (Array.isArray(decisions) ? decisions : []).reduce((highest, decision) => (
    rank[decision?.severity] > rank[highest] ? decision.severity : highest
  ), "none");
}

const QA_MANAGER_PROMPT = [
  "You are InvestorIQ's internal QA manager.",
  INVESTORIQ_QA_DOCTRINE,
  INVESTORIQ_INSTITUTIONAL_REPORT_QA_CHECKLIST,
  "Review rendered_report_qa_advisory, source_package_qa_advisory, source_report_coverage_qa, qa_fix_routing, report_qa_flags, and rendered report text signals.",
  "Treat source_report_coverage_qa, deterministic_flags, report_qa_flags, and rendered report text as higher authority than AI speculation.",
  "Treat actual rendered excerpt text as the source for public-language escalation, not speculative suggested_review wording.",
  "Do not treat unsupported, pending, or supporting documents as issues merely because they are listed if the report says unstructured/unsupported docs are excluded from modeled outputs and source coverage passes.",
  "If rendered text says documents are not used quantitatively, excluded from modeled outputs, or unsupported/unstructured uploads remain excluded, do not classify the listing of those files as a contradiction unless the report also relies on them quantitatively.",
  "Do not classify institutional classification terms such as Sensitized, Stable, Fragile, or Refinance Shortfall Under Stress as public-language risk when nearby report context includes Capital Risk Profile, Primary Pressure Point, DSCR/refi explanations, threshold language, expense ratio, NOI margin, or break-even occupancy.",
  "Do flag if the rendered report quantitatively relies on an unsupported/unparsed document or contradicts the exclusion disclosure.",
  "Do flag plausible parser misses only when deterministic/source evidence supports the miss.",
  "You may recommend action categories only. Do not output replacement financial values. Do not mutate report copy. Do not change artifacts, reports, jobs, or lifecycle state.",
  "Return advisory decisions only. Do not decide publication blocking.",
  "Return only valid JSON matching the schema.",
].join("\n");

const RESPONSE_SCHEMA = {
  name: "qa_manager_review",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["manager_status", "summary", "decisions"],
    properties: {
      manager_status: { type: "string", enum: ["pass", "warn", "review"] },
      summary: { type: "string" },
      decisions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "source_code",
            "source_artifact",
            "classification",
            "severity",
            "rationale",
            "evidence_excerpt",
            "recommended_action_type",
            "requires_code_patch",
            "requires_regeneration",
            "blocks_customer_delivery",
            "blocks_public_sample",
            "blocks_high_value_outreach",
          ],
          properties: {
            source_code: { type: "string" },
            source_artifact: { type: "string" },
            classification: {
              type: "string",
              enum: [
                "real_parser_or_artifact_risk",
                "real_source_report_contradiction",
                "real_public_language_risk",
                "source_document_limitation",
                "production_config_only",
                "false_positive",
                "admin_review_optional",
                "no_action",
              ],
            },
            severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
            rationale: { type: "string" },
            evidence_excerpt: { type: "string" },
            recommended_action_type: { type: "string" },
            requires_code_patch: { type: "boolean" },
            requires_regeneration: { type: "boolean" },
            blocks_customer_delivery: { type: "boolean" },
            blocks_public_sample: { type: "boolean" },
            blocks_high_value_outreach: { type: "boolean" },
          },
        },
      },
    },
  },
};

async function callManagerModel({ apiKey, model, timeoutMs, userContent }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: QA_MANAGER_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: {
          type: "json_schema",
          json_schema: RESPONSE_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const err = new Error(`qa manager review request failed (${response.status}): ${text.slice(0, 500)}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("qa manager review response was empty");
    }
    return {
      review: JSON.parse(content),
      model: data?.model || model,
      usage: data?.usage || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runQaManagerReview({
  html,
  renderedReportQa = null,
  sourcePackageQa = null,
  sourceReportCoverageQa = null,
  qaFixRouting = null,
  reportQaFlags = [],
  context = {},
  apiKey = process.env.OPENAI_API_KEY,
  model = DEFAULT_MODEL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured");
    err.code = "QA_MANAGER_NO_KEY";
    throw err;
  }

  const payload = {
    property_name: context.property_name || "Unknown",
    report_type: context.report_type || "Unknown",
    report_tier: context.report_tier ?? "Unknown",
    report_qa_flags: Array.isArray(reportQaFlags) ? reportQaFlags : [],
    source_report_coverage_qa: sourceReportCoverageQa,
    rendered_report_qa_advisory: renderedReportQa
      ? {
          status: renderedReportQa.status || null,
          counts: renderedReportQa.counts || null,
          findings: Array.isArray(renderedReportQa.findings) ? renderedReportQa.findings : [],
        }
      : null,
    source_package_qa_advisory: sourcePackageQa,
    qa_fix_routing: qaFixRouting,
    rendered_report_text: stripHtmlForManager(html),
  };

  const { review, model: usedModel, usage } = await callManagerModel({
    apiKey,
    model,
    timeoutMs,
    userContent: JSON.stringify(payload),
  });
  const decisions = normalizeManagerDecisions(review?.decisions, {
    renderedText: payload.rendered_report_text,
    sourceReportCoverageQa,
  });
  const counts = countDecisions(decisions);

  return {
    event: "qa_manager_review",
    version: QA_MANAGER_REVIEW_VERSION,
    advisory_only: true,
    no_public_surface: true,
    job_id: context.job_id || null,
    user_id: context.user_id || null,
    property_name: context.property_name || null,
    report_type: context.report_type || null,
    report_tier: context.report_tier ?? null,
    model: usedModel,
    usage,
    timeout_ms: timeoutMs,
    timestamp: new Date().toISOString(),
    manager_status: review?.manager_status || "review",
    summary: typeof review?.summary === "string" ? review.summary : "",
    decisions,
    counts,
    highest_severity: highestSeverity(decisions),
  };
}

export const __test__ = {
  normalizeDecision,
  normalizeManagerDecisions,
  countDecisions,
  hasUnsupportedExclusionDisclosure,
  hasClassificationContext,
  stripHtmlForManager,
  containsProhibitedPublicLanguage,
  QA_MANAGER_PROMPT,
  RESPONSE_SCHEMA,
};
