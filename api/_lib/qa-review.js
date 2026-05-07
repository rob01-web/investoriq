import {
  INVESTORIQ_QA_DOCTRINE,
  isAllowedMethodologyOnlyText,
} from "./investoriq-qa-doctrine.js";

const REVIEW_VERSION = "2026.05.05.1";
// Fallback follows the existing project convention used by extraction-recovery helpers.
const DEFAULT_MODEL =
  process.env.QA_REVIEW_MODEL ||
  process.env.OPENAI_REPORT_QA_MODEL ||
  "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.QA_REVIEW_TIMEOUT_MS || "15000", 10);
const MAX_REVIEW_CHARS = 180000;

function stripHtmlForReview(html) {
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
  if (text.length > MAX_REVIEW_CHARS) {
    text = `${text.slice(0, MAX_REVIEW_CHARS)}\n[truncated for internal review]`;
  }
  return text;
}

const SYSTEM_PROMPT = [
  "You are an internal institutional real estate report reviewer.",
  INVESTORIQ_QA_DOCTRINE,
  "Review only the finalized report text provided by the user.",
  "Do not rewrite the report. Do not invent facts. Do not propose new financial values.",
  "Do not override deterministic source documents, parsers, calculations, debt, DSCR, NOI, rent, cap rate, valuation, refinance, or score outputs.",
  "Only flag issues that a human reviewer should inspect before using the report as a public or investor-facing sample.",
  "",
  "Important metric guidance:",
  "Do not flag break-even occupancy as contradictory merely because it differs from current occupancy.",
  "Current occupancy and break-even occupancy are distinct metrics.",
  "A lower break-even occupancy than current occupancy is generally an operating cushion, not a contradiction.",
  "Only flag occupancy math if the formula, label, or displayed relationship is internally inconsistent, impossible, or unsupported by the shown data.",
  "",
  "Important compliance guidance:",
  "Do not request, recommend, or suggest adding BUY, SELL, HOLD, or investment recommendation language.",
  "InvestorIQ reports intentionally avoid investment recommendations.",
  "Compliance findings should flag the presence of recommendation language, not its absence.",
  "Flag issues across these categories:",
  "numbers: internal numeric consistency, unit/currency/period mismatches, headline metric contradictions.",
  "language: typos, mojibake, unfinished fragments, raw template tokens, stale headings, DATA NOT AVAILABLE leaks.",
  "support: uploaded/support evidence appears inconsistent with rendered statements, or report wording implies unsupported support.",
  "compliance: BUY, SELL, HOLD, investment recommendation language, guaranteed/risk-free language, public model/vendor wording.",
  "",
  "Return advisory findings only. Do not decide whether publication should be blocked.",
  "Return only valid JSON matching the schema.",
].join("\n");

const RESPONSE_SCHEMA = {
  name: "rendered_report_qa_advisory",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["score", "status", "summary", "findings"],
    properties: {
      score: {
        type: "integer",
        minimum: 0,
        maximum: 100,
      },
      status: {
        type: "string",
        enum: ["pass", "warn", "review"],
      },
      summary: {
        type: "string",
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["category", "severity", "issue", "excerpt", "suggested_review"],
          properties: {
            category: {
              type: "string",
              enum: ["numbers", "language", "support", "compliance"],
            },
            severity: {
              type: "string",
              enum: ["critical", "warn", "info"],
            },
            issue: {
              type: "string",
            },
            excerpt: {
              type: "string",
            },
            suggested_review: {
              type: "string",
            },
          },
        },
      },
    },
  },
};

function countFindings(findings) {
  const rows = Array.isArray(findings) ? findings : [];
  return {
    total: rows.length,
    critical: rows.filter((f) => f?.severity === "critical").length,
    warn: rows.filter((f) => f?.severity === "warn").length,
    info: rows.filter((f) => f?.severity === "info").length,
    numbers: rows.filter((f) => f?.category === "numbers").length,
    language: rows.filter((f) => f?.category === "language").length,
    support: rows.filter((f) => f?.category === "support").length,
    compliance: rows.filter((f) => f?.category === "compliance").length,
  };
}

function textOfFinding(finding) {
  return [
    finding?.issue,
    finding?.suggested_review,
    finding?.excerpt,
  ].filter(Boolean).join(" ").toLowerCase();
}

function isOnlyBreakEvenOccupancyFalsePositive(finding) {
  const text = textOfFinding(finding);
  const exactKnownFalsePositive =
    text.includes("break-even occupancy is stated as 31.5%, which is inconsistent with the reported current occupancy of 96.0%.") ||
    text.includes("verify the calculation of break-even occupancy to ensure it aligns with the current occupancy.");
  if (exactKnownFalsePositive) {
    return true;
  }
  const mentionsBreakEven = /break[- ]?even occupancy/.test(text);
  const mentionsCurrentOccupancy = /current occupancy|occupancy rate/.test(text);
  const contradictionOnly = /contradict|inconsistent|differs|different|mismatch/.test(text);
  const mathConcern = /formula|calculation|impossible|unsupported|greater than 100|less than 0|negative/.test(text);
  return mentionsBreakEven && mentionsCurrentOccupancy && contradictionOnly && !mathConcern;
}

function isOnlyRecommendationAbsenceFalsePositive(finding) {
  const text = textOfFinding(finding);
  const exactKnownFalsePositive =
    text.includes("the report does not contain explicit investment recommendation language") ||
    text.includes("double-check the report for any language that could be interpreted as an investment recommendation.");
  if (exactKnownFalsePositive && !/\b(buy|sell|hold)\b/.test(text)) {
    return true;
  }
  const asksForRecommendation = /add|include|provide|should contain|missing|absence|absent|lacks|lack/.test(text);
  const recommendationLanguage = /buy|sell|hold|investment recommendation|recommendation language|clear recommendation/.test(text);
  const actualForbiddenLanguage = /excerpt[^]*\b(buy|sell|hold)\b/.test(text) && !asksForRecommendation;
  return asksForRecommendation && recommendationLanguage && !actualForbiddenLanguage;
}

function isOnlyAllowedMethodologyLanguageFalsePositive(finding) {
  if (finding?.category !== "compliance") return false;
  return isAllowedMethodologyOnlyText(finding);
}

function filterAdvisoryFalsePositives(findings) {
  const rows = Array.isArray(findings) ? findings : [];
  return rows.filter((finding) => (
    !isOnlyBreakEvenOccupancyFalsePositive(finding) &&
    !isOnlyRecommendationAbsenceFalsePositive(finding) &&
    !isOnlyAllowedMethodologyLanguageFalsePositive(finding)
  ));
}

async function callReviewModel({ apiKey, model, userContent, timeoutMs = DEFAULT_TIMEOUT_MS }) {
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
          { role: "system", content: SYSTEM_PROMPT },
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
      const err = new Error(`review request failed (${response.status}): ${text.slice(0, 500)}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("review response was empty");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      const parseErr = new Error("review response was not valid JSON");
      parseErr.responseText = content.slice(0, 500);
      throw parseErr;
    }

    return {
      review: parsed,
      model: data?.model || model,
      usage: data?.usage || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runRenderedReportQaAdvisory({
  html,
  context = {},
  apiKey = process.env.OPENAI_API_KEY,
  model = DEFAULT_MODEL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured");
    err.code = "QA_NO_KEY";
    throw err;
  }
  if (typeof html !== "string" || html.length < 200) {
    const err = new Error("rendered report HTML is missing or too short");
    err.code = "QA_NO_HTML";
    throw err;
  }

  const reviewText = stripHtmlForReview(html);
  const userContent = [
    `Property: ${context.property_name || "Unknown"}`,
    `Report type: ${context.report_type || "Unknown"}`,
    `Report tier: ${context.report_tier ?? "Unknown"}`,
    "",
    "Rendered report text:",
    "----- BEGIN REPORT -----",
    reviewText,
    "----- END REPORT -----",
  ].join("\n");

  const { review, model: usedModel, usage } = await callReviewModel({
    apiKey,
    model,
    userContent,
    timeoutMs,
  });
  const rawFindings = Array.isArray(review?.findings) ? review.findings : [];
  const findings = filterAdvisoryFalsePositives(rawFindings);
  const removedFindingCount = rawFindings.length - findings.length;
  const rawModelScore = Number.isFinite(review?.score) ? review.score : null;
  const adjustedScore = rawModelScore === null
    ? null
    : Math.min(100, rawModelScore + (removedFindingCount * 10));
  const counts = countFindings(findings);
  const status =
    counts.critical > 0 ? "review" :
    counts.warn > 0 ? "warn" :
    typeof review?.status === "string" ? review.status : "review";

  return {
    review: { ...review, findings },
    raw_model_score: rawModelScore,
    score: adjustedScore,
    status,
    summary: typeof review?.summary === "string" ? review.summary : "",
    findings,
    counts,
    removed_false_positive_count: removedFindingCount,
    model: usedModel,
    usage,
    version: REVIEW_VERSION,
    timeout_ms: timeoutMs,
    advisory_only: true,
  };
}

export const __test__ = {
  stripHtmlForReview,
  countFindings,
  filterAdvisoryFalsePositives,
  SYSTEM_PROMPT,
  RESPONSE_SCHEMA,
};
