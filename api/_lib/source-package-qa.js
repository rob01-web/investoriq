import {
  INVESTORIQ_QA_DOCTRINE,
  INVESTORIQ_INSTITUTIONAL_REPORT_QA_CHECKLIST,
  containsProhibitedPublicLanguage,
  isAllowedMethodologyOnlyText,
  isFilenameHintOnlyText,
} from "./investoriq-qa-doctrine.js";
import { buildSupportDocTaxonomyState, hasCurrentDebtSemanticState } from "./report-surface-contracts.js";

const SOURCE_PACKAGE_QA_VERSION = "2026.05.07.1";
const DEFAULT_MODEL =
  process.env.QA_SOURCE_PACKAGE_MODEL ||
  process.env.QA_REVIEW_MODEL ||
  process.env.OPENAI_REPORT_QA_MODEL ||
  "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.QA_SOURCE_PACKAGE_TIMEOUT_MS || "15000", 10);
const MAX_RENDERED_TEXT_CHARS = 60000;

const FINDING_ARRAY_FIELDS = [
  "doc_treatment_findings",
  "possible_parser_misses",
  "possible_false_unsupported_docs",
  "possible_support_contamination",
  "source_report_consistency_findings",
  "false_positive_likely_findings",
];

function stripHtmlForSourcePackageQa(html) {
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
    ? `${text.slice(0, MAX_RENDERED_TEXT_CHARS)}\n[truncated for internal source-package review]`
    : text;
}

function compactFile(row) {
  return {
    id: row?.id || null,
    original_filename: String(row?.original_filename || ""),
    doc_type: String(row?.doc_type || ""),
    mime_type: String(row?.mime_type || ""),
    parse_status: String(row?.parse_status || ""),
    parse_error: row?.parse_error || null,
  };
}

function summarizeArtifact(row) {
  const payload = row?.payload && typeof row.payload === "object" ? row.payload : {};
  const taxonomy = buildSupportDocTaxonomyState({
    declaredDocType: payload?.detected_doc_type || row?.doc_type || null,
    detectedDocType: payload?.detected_doc_type || row?.doc_type || null,
    originalFilename: payload?.original_filename || row?.original_filename || null,
    rawText: payload?.excerpt || payload?.text || null,
    payload,
  });
  const semanticDocRole = payload?.semantic_doc_role || taxonomy.semantic_doc_role;
  const semanticDocRoleConfidence =
    payload?.semantic_doc_role_confidence ?? taxonomy.semantic_doc_role_confidence;
  const semanticDocRoleReason = payload?.semantic_doc_role_reason || taxonomy.semantic_doc_role_reason;
  const summary = {
    type: row?.type || null,
    method: payload?.method || null,
    parse_warnings: Array.isArray(payload?.parse_warnings) ? payload.parse_warnings.slice(0, 8) : [],
    semantic_doc_role: semanticDocRole,
    semantic_doc_role_confidence: semanticDocRoleConfidence,
    semantic_doc_role_reason: semanticDocRoleReason,
  };
  if (row?.type === "rent_roll_parsed") {
    return {
      ...summary,
      total_units: payload?.total_units ?? payload?.unit_count ?? null,
      occupancy: payload?.totals?.occupancy ?? payload?.occupancy ?? null,
      unit_count: Array.isArray(payload?.units) ? payload.units.length : null,
      unit_mix_count: Array.isArray(payload?.unit_mix) ? payload.unit_mix.length : null,
    };
  }
  if (row?.type === "t12_parsed") {
    return {
      ...summary,
      effective_gross_income: payload?.effective_gross_income ?? null,
      total_operating_expenses: payload?.total_operating_expenses ?? null,
      net_operating_income: payload?.net_operating_income ?? null,
      income_line_count: Array.isArray(payload?.income_lines) ? payload.income_lines.length : 0,
      expense_line_count: Array.isArray(payload?.expense_lines) ? payload.expense_lines.length : 0,
    };
  }
  if (["loan_term_sheet_parsed", "mortgage_statement_parsed"].includes(row?.type)) {
    const hasOutstandingBalance = Number(payload?.outstanding_balance) > 0;
    const hasLoanAmount = Number(payload?.loan_amount) > 0;
    return {
      ...summary,
      has_balance: row?.type === "mortgage_statement_parsed" ? hasOutstandingBalance : hasLoanAmount || hasOutstandingBalance,
      has_payment: Number(payload?.monthly_payment) > 0 || Number(payload?.annual_debt_service) > 0,
      has_rate: Number(payload?.interest_rate) > 0,
      has_amortization: Number(payload?.amort_years) > 0,
      has_purchase_price: Number(payload?.purchase_price) > 0,
      has_derived_acquisition_debt: Number(payload?.derived_acquisition_loan_amount) > 0,
      debt_basis: payload?.debt_basis || null,
    };
  }
  if (row?.type === "renovation_parsed") {
    return {
      ...summary,
      total_budget: payload?.total_budget ?? payload?.total_capex ?? null,
      budget_row_count: Array.isArray(payload?.budget_rows) ? payload.budget_rows.length : 0,
      scope_row_count: Array.isArray(payload?.scope_rows) ? payload.scope_rows.length : 0,
    };
  }
  if (row?.type === "appraisal_parsed") {
    return {
      ...summary,
      value: payload?.value ?? payload?.appraised_value ?? null,
      appraised_value: payload?.appraised_value ?? payload?.value ?? null,
      cap_rate: payload?.cap_rate ?? null,
      valuation_date: payload?.valuation_date ?? null,
      value_basis: payload?.value_basis ?? null,
      appraisal_type: payload?.appraisal_type ?? null,
    };
  }
  if (row?.type === "property_tax_parsed") {
    return { ...summary, annual_tax: payload?.annual_tax ?? null };
  }
  if (row?.type === "document_text_extracted") {
    const excerpt = String(payload?.excerpt || payload?.text || "").slice(0, 1600).trim();
    return {
      ...summary,
      original_filename: payload?.original_filename || null,
      chars: payload?.chars ?? (typeof payload?.text === "string" ? payload.text.length : null),
      excerpt,
    };
  }
  return summary;
}

function normalizeFindings(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    code: String(row?.code || "SOURCE_PACKAGE_REVIEW_NOTE"),
    severity: ["critical", "high", "medium", "low", "info"].includes(row?.severity) ? row.severity : "info",
    message: String(row?.message || row?.issue || ""),
    evidence: row?.evidence && typeof row.evidence === "object" ? row.evidence : {},
    suggested_review: String(row?.suggested_review || ""),
  }));
}

function textOfFinding(finding) {
  return [
    finding?.code,
    finding?.message,
    finding?.suggested_review,
    finding?.evidence?.summary,
    finding?.evidence?.source,
    finding?.evidence?.file,
    finding?.evidence?.artifact_type,
    finding?.evidence?.excerpt,
  ].filter(Boolean).join(" ").toLowerCase();
}

function hasProhibitedPublicRisk(text) {
  return containsProhibitedPublicLanguage(text);
}

function isFilenameTokenOnlyFinding(finding) {
  return isFilenameHintOnlyText(finding);
}

function isDeterministicLanguageGuaranteeFalsePositive(finding) {
  return isAllowedMethodologyOnlyText(finding);
}

function extractRenderedOccupancy(text) {
  const source = typeof text === "string" ? text : "";
  const match = source.match(/\boccupancy\b[^0-9]{0,40}(\d{1,3}(?:\.\d+)?)\s*%/i);
  if (!match) return null;
  const pct = Number(match[1]);
  return Number.isFinite(pct) ? pct / 100 : null;
}

function isOccupancyFalsePositive(finding, compactPayload) {
  const text = textOfFinding(finding);
  if (!/occupancy/.test(text) || !/conflict|inconsistent|contradict|mismatch|null|missing/.test(text)) {
    return false;
  }
  const coverageOccupancy = Number(
    compactPayload?.source_report_coverage_qa?.artifact_inventory?.rent_roll_parsed?.occupancy
  );
  const renderedOccupancy = extractRenderedOccupancy(compactPayload?.rendered_report_text);
  return (
    Number.isFinite(coverageOccupancy) &&
    Number.isFinite(renderedOccupancy) &&
    Math.abs(coverageOccupancy - renderedOccupancy) < 0.005
  );
}

function isClearRenderedDisclosureFalsePositive(finding, compactPayload) {
  const findingText = textOfFinding(finding);
  const renderedText = String(compactPayload?.rendered_report_text || "").toLowerCase();
  const currentDebtState = compactPayload?.source_report_coverage_qa?.current_debt_state || null;
  const currentDebtNotAssessedDisclosure =
    currentDebtState?.current_debt_dscr_status !== "computed" &&
    Boolean(currentDebtState?.current_debt_limitation_reason_code);
  const semanticCurrentDebtStatePresent = hasCurrentDebtSemanticState(currentDebtState);
  if (
    /unsupported|unstructured/.test(findingText) &&
    /unsupported or unstructured uploads remain excluded from modeled outputs|not used quantitatively|excluded from modeled outputs/.test(renderedText)
  ) {
    return true;
  }
  if (
    /current debt|current dscr|refinance|debt coverage/.test(findingText) &&
    ((semanticCurrentDebtStatePresent && currentDebtNotAssessedDisclosure) ||
      (!semanticCurrentDebtStatePresent &&
        /current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance|current outstanding debt balance not provided|current debt service is not assessed|no current debt document provided|current debt terms were not fully provided|current debt service not assessed/.test(renderedText))) &&
    /current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance|current-debt dscr and refinance capacity were not assessed because no current outstanding debt balance was verified|proposed acquisition financing was modeled separately where validated/i.test(renderedText) &&
    /proposed acquisition debt sizing|derived acquisition loan amount|not current outstanding debt/.test(renderedText)
  ) {
    return true;
  }
  if (
    /document[- ]constrained review|constrained/.test(findingText) &&
    /core input coverage confirmed|data coverage|underwriting gaps|current debt coverage and refinance sufficiency were not produced/.test(renderedText) &&
    !/buy|sell|hold|guarantee|risk-free|openai|llm/.test(findingText)
  ) {
    return true;
  }
  return false;
}

function filterSourcePackageFalsePositives(review, compactPayload) {
  for (const field of FINDING_ARRAY_FIELDS) {
    review[field] = normalizeFindings(review[field]).filter((finding) => (
      !isFilenameTokenOnlyFinding(finding) &&
      !isDeterministicLanguageGuaranteeFalsePositive(finding) &&
      !isOccupancyFalsePositive(finding, compactPayload) &&
      !isClearRenderedDisclosureFalsePositive(finding, compactPayload)
    ));
  }
  return review;
}

function countAllFindings(review) {
  const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const field of FINDING_ARRAY_FIELDS) {
    for (const finding of normalizeFindings(review?.[field])) {
      counts.total += 1;
      counts[finding.severity] = (counts[finding.severity] || 0) + 1;
    }
  }
  return counts;
}

function highestSeverityFromCounts(counts) {
  if (counts.critical > 0) return "critical";
  if (counts.high > 0) return "high";
  if (counts.medium > 0) return "medium";
  if (counts.low > 0) return "low";
  return counts.info > 0 ? "info" : "none";
}

const SOURCE_PACKAGE_QA_PROMPT = [
  "You are an internal InvestorIQ source-package QA reviewer.",
  INVESTORIQ_QA_DOCTRINE,
  INVESTORIQ_INSTITUTIONAL_REPORT_QA_CHECKLIST,
  "Review uploaded file treatment, source document text excerpts, parsed artifact summaries, deterministic coverage QA, rendered QA, and rendered report text.",
  "Filename and upload-slot tokens are never source truth. Do not infer unsupported status from filename tokens such as UNSUPPORTED, TEST, CLEAN, MESSY, or QA unless parse status, deterministic artifacts, or rendered reliance provide separate evidence.",
  "Prioritize source_report_coverage_qa.artifact_inventory over compact raw parsed_artifacts when they differ. For example, if source_report_coverage_qa says rent_roll_parsed occupancy is 1, do not flag occupancy as null from a compact artifact summary.",
  "Missing supplemental parsed fields are not high severity when source_report_coverage_qa passes, deterministic_flags are empty, the report does not rely on that supplemental field, or the value is already represented in T12 or otherwise not required for the rendered analysis.",
  "Pending or supporting documents are contamination risks only if the rendered report appears to rely on them quantitatively or makes unsupported claims from them.",
  "You may flag possible parser misses, unsupported-doc treatment, ignored documents, source/report inconsistencies, possible support contamination, and likely false-positive QA flags.",
  "You must not write accepted financial values, override deterministic parsers or math, or propose changing NOI, rent, occupancy, debt, DSCR, cap rate, valuation, refinance, or score outputs.",
  "Flag BUY, SELL, HOLD, investment recommendation/advice, public model/vendor claims, guarantees, fabricated certainty, and unsupported accuracy claims if present.",
  "Return advisory findings only. Do not decide whether publication is blocked.",
  "Return only valid JSON matching the schema.",
].join("\n");

const RESPONSE_SCHEMA = {
  name: "source_package_qa_advisory",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "model_status",
      "doc_treatment_findings",
      "possible_parser_misses",
      "possible_false_unsupported_docs",
      "possible_support_contamination",
      "source_report_consistency_findings",
      "false_positive_likely_findings",
    ],
    properties: {
      summary: { type: "string" },
      model_status: { type: "string", enum: ["pass", "warn", "review"] },
      doc_treatment_findings: { type: "array", items: { $ref: "#/$defs/finding" } },
      possible_parser_misses: { type: "array", items: { $ref: "#/$defs/finding" } },
      possible_false_unsupported_docs: { type: "array", items: { $ref: "#/$defs/finding" } },
      possible_support_contamination: { type: "array", items: { $ref: "#/$defs/finding" } },
      source_report_consistency_findings: { type: "array", items: { $ref: "#/$defs/finding" } },
      false_positive_likely_findings: { type: "array", items: { $ref: "#/$defs/finding" } },
    },
    $defs: {
      finding: {
        type: "object",
        additionalProperties: false,
        required: ["code", "severity", "message", "evidence", "suggested_review"],
        properties: {
          code: { type: "string" },
          severity: { type: "string", enum: ["critical", "high", "medium", "low", "info"] },
          message: { type: "string" },
          evidence: {
            type: "object",
            additionalProperties: false,
            required: ["summary", "source", "file", "artifact_type", "excerpt"],
            properties: {
              summary: { type: "string" },
              source: { type: "string" },
              file: { type: "string" },
              artifact_type: { type: "string" },
              excerpt: { type: "string" },
            },
          },
          suggested_review: { type: "string" },
        },
      },
    },
  },
};

async function callSourcePackageReviewModel({ apiKey, model, userContent, timeoutMs }) {
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
          { role: "system", content: SOURCE_PACKAGE_QA_PROMPT },
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
      const err = new Error(`source package review request failed (${response.status}): ${text.slice(0, 500)}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("source package review response was empty");
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

export async function runSourcePackageQaAdvisory({
  html,
  uploadedFiles = [],
  artifacts = [],
  sourceReportCoverageQa = null,
  renderedReportQa = null,
  context = {},
  apiKey = process.env.OPENAI_API_KEY,
  model = DEFAULT_MODEL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!apiKey) {
    const err = new Error("OPENAI_API_KEY is not configured");
    err.code = "SOURCE_PACKAGE_QA_NO_KEY";
    throw err;
  }

  const compactPayload = {
    property_name: context.property_name || "Unknown",
    report_type: context.report_type || "Unknown",
    report_tier: context.report_tier ?? "Unknown",
    uploaded_files: (Array.isArray(uploadedFiles) ? uploadedFiles : []).map(compactFile),
    parsed_artifacts: (Array.isArray(artifacts) ? artifacts : []).map(summarizeArtifact),
    source_report_coverage_qa: sourceReportCoverageQa
      ? {
          qa_status: sourceReportCoverageQa.qa_status || null,
          severity: sourceReportCoverageQa.severity || null,
          deterministic_flags: Array.isArray(sourceReportCoverageQa.deterministic_flags)
            ? sourceReportCoverageQa.deterministic_flags
            : [],
          artifact_inventory: sourceReportCoverageQa.artifact_inventory || null,
          rendered_text_signals: sourceReportCoverageQa.rendered_text_signals || [],
          current_debt_state: sourceReportCoverageQa.current_debt_state || null,
        }
      : null,
    rendered_report_qa_advisory: renderedReportQa
      ? {
          status: renderedReportQa.status || null,
          counts: renderedReportQa.counts || null,
          findings: Array.isArray(renderedReportQa.findings) ? renderedReportQa.findings : [],
        }
      : null,
    rendered_report_text: stripHtmlForSourcePackageQa(html),
  };

  const { review, model: usedModel, usage } = await callSourcePackageReviewModel({
    apiKey,
    model,
    timeoutMs,
    userContent: JSON.stringify(compactPayload),
  });

  filterSourcePackageFalsePositives(review, compactPayload);
  const counts = countAllFindings(review);
  const highestSeverity = highestSeverityFromCounts(counts);

  return {
    event: "source_package_qa_advisory",
    version: SOURCE_PACKAGE_QA_VERSION,
    advisory_only: true,
    no_public_surface: true,
    job_id: context.job_id || null,
    user_id: context.user_id || null,
    property_name: context.property_name || null,
    report_type: context.report_type || null,
    report_tier: context.report_tier ?? null,
    model_status: review?.model_status || "review",
    summary: typeof review?.summary === "string" ? review.summary : "",
    doc_treatment_findings: review.doc_treatment_findings,
    possible_parser_misses: review.possible_parser_misses,
    possible_false_unsupported_docs: review.possible_false_unsupported_docs,
    possible_support_contamination: review.possible_support_contamination,
    source_report_consistency_findings: review.source_report_consistency_findings,
    false_positive_likely_findings: review.false_positive_likely_findings,
    counts,
    highest_severity: highestSeverity,
    model: usedModel,
    usage,
    timeout_ms: timeoutMs,
    timestamp: new Date().toISOString(),
  };
}

export const __test__ = {
  stripHtmlForSourcePackageQa,
  summarizeArtifact,
  countAllFindings,
  SOURCE_PACKAGE_QA_PROMPT,
  RESPONSE_SCHEMA,
};
