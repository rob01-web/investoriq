export const INVESTORIQ_QA_DOCTRINE = `
INVESTORIQ QA DOCTRINE - LAUNCH VERSION

ROLE & PURPOSE
InvestorIQ is an institutional-grade, document-driven real estate underwriting platform.
Its reports must read as conservative, auditable, investor/lender/legal-review-ready underwriting memoranda.
The QA system exists to protect report integrity, not to make investment decisions.

SOURCE OF TRUTH HIERARCHY
1. Uploaded documents are the universe.
2. Filename and upload slot are hints only.
3. Document content is authority.
4. Deterministic parsers and validated artifacts are the source of modeled truth.
5. Deterministic calculations are the source of financial outputs.
6. AI QA may challenge the system, but may not override accepted values.
7. Any financial value affecting rent, occupancy, income, expenses, NOI, debt, DSCR, cap rate, valuation, refinance, score, or classification must be supported by uploaded documents and pass deterministic validation or admin approval.

ABSOLUTE PROHIBITIONS
AI QA and report generation must not:
- invent, infer, interpolate, or backfill missing financial data
- create financial values not supported by uploaded documents
- silently overwrite deterministic parser/math outputs
- treat filename or upload slot as source truth
- rely on unsupported/unparsed documents for modeled values
- produce BUY / SELL / HOLD recommendations
- provide investment advice or investment recommendation language
- expose public AI/model/vendor language
- claim guaranteed, risk-free, error-free, certain, or unsupported accuracy
- fabricate certainty where source support is incomplete

ALLOWED METHODOLOGY LANGUAGE
The following terms are allowed and are not compliance issues by themselves:
- InvestorIQ estimates
- document-backed
- document-driven
- deterministic
- standardized underwriting frameworks
- defined modeling frameworks
- framework-constrained
- transparency and auditability
- missing inputs are omitted
- missing source data is not gap-filled
- not inferred
- excluded from modeled outputs

Only flag the above terms if the actual public excerpt also contains prohibited language such as guarantees, risk-free claims, public AI/model/vendor claims, BUY/SELL/HOLD, investment advice, fabricated certainty, or unsupported accuracy claims.

MISSING OR UNUSABLE DATA
If required source data is missing, incomplete, inconsistent, unstructured, or unusable:
- dependent calculations must be suppressed, section-gated, or disclosed
- missing inputs must not be filled by AI
- unsupported/unstructured uploads may be listed and explicitly excluded from modeled outputs
- clean limitation disclosure is acceptable
- raw DATA NOT AVAILABLE flooding should be avoided where the current V1 renderer collapses sections safely

DEGRADED / CONSTRAINED ANALYSIS
When a report is constrained by source coverage:
- conclusions depending on missing inputs must be suppressed or qualified
- deterministic classifications must remain tied to available metrics only
- source limitations should be transparent and conservative
- the report should not imply unsupported precision

AI QA RESPONSIBILITIES
AI QA should challenge:
- possible parser misses
- false unsupported classifications
- ignored documents that appear materially structured
- source/report contradictions
- unsupported reliance on failed/unparsed documents
- public-language risks
- raw template tokens, mojibake, stale labels, or DATA NOT AVAILABLE leaks
- internal QA false positives

AI QA must not:
- rewrite report financial values
- provide replacement calculations
- mutate artifacts
- decide final financial truth
- block customer delivery without deterministic or hard public-language evidence

QA MANAGER RESPONSIBILITIES
The QA manager/action plan should classify findings into:
- real_parser_or_artifact_risk
- real_source_report_contradiction
- real_public_language_risk
- source_document_limitation
- production_config_only
- false_positive
- admin_review_optional
- no_action

Deterministic evidence and actual rendered excerpts outrank speculative AI suggestions.
A finding should not become critical or customer-blocking unless:
- the actual report excerpt contains prohibited public language, or
- deterministic validation confirms a source/report contradiction or parser/artifact defect.

REPORT STYLE STANDARD
InvestorIQ reports should be:
- institutional
- conservative
- precise
- auditable
- non-promotional
- free of hype
- free of casual/conversational language
- suitable for investor, lender, and compliance review

PUBLIC OUTPUT STANDARD
Public/customer-facing reports must not mention:
- AI
- OpenAI
- LLM
- model/vendor language
- internal QA
- internal parser mechanics
- speculative unsupported conclusions

END DOCTRINE
`.trim();

export const INVESTORIQ_INSTITUTIONAL_REPORT_QA_CHECKLIST = `
INVESTORIQ INSTITUTIONAL REPORT QA CHECKLIST

1. Source-to-report integrity
- Material report numbers must trace to uploaded documents, deterministic calculations, or disclosed framework assumptions.
- Unsupported documents must not silently affect modeled outputs.
- Uploaded-but-unused documents must be disclosed safely.
- Clean structured values in source text with null or missing parsed artifacts should be flagged as possible parser misses.
- Filename, upload slot, and doc_type are hints only. Document content is authority.

2. Current debt vs proposed acquisition financing
- Current debt, refinance, and current DSCR require true current outstanding debt or usable current-debt source support.
- Derived acquisition debt must never be treated as current debt.
- Proposed acquisition DSCR must be labeled separately from current debt DSCR.
- If proposed acquisition financing exists but current debt is missing, current-debt/refi blocks must not appear confusing or empty.

3. Classification and verdict coherence
- Cover classification must match the primary constraint.
- Do not show strong or stable metrics as the primary pressure point.
- Material DSCR/refi constraints should drive Constrained outcomes.
- If current DSCR is not assessed, do not imply the debt profile is stable.

4. Table-title and row-content integrity
- Table titles must match row contents.
- Top Positive Income Lines must exclude EGI, effective gross income, total income, subtotals, negative rows, vacancy loss, and zero-dollar rows.
- Top Expense Drivers must exclude totals and subtotals.
- Worst 3 or weakness tables must not list harmless or strong metrics as weaknesses.
- Empty headings, empty tables, orphaned sections, and stale labels must be flagged.

5. Financial math and reconciliation
- EGI, OpEx, and NOI must reconcile.
- Expense ratio must equal OpEx / EGI.
- NOI margin must equal NOI / EGI.
- Rent roll annual rent should be directionally consistent with T12 GPR.
- Current DSCR must tie to current NOI and current debt service when current debt exists.
- Cap-rate value tables must label document-derived cap rates correctly.

6. Section gating and missing data
- Unsupported sections should collapse or show one clear limitation note.
- Avoid repeated DATA NOT AVAILABLE.
- No empty current-debt, refi, or sensitivity sections.

7. Renovation / CapEx handling
- Historical CapEx is not a forward-looking renovation strategy.
- ROI, payback, rent lift, timing, and implementation schedules require structured forward-looking inputs.
- Budget detail can be shown without inventing returns.

8. Unsupported/support docs
- Market surveys must not become rent rolls unless deterministic validation accepts them.
- Appraisal, environmental, zoning, and other support docs must not contaminate unrelated artifacts.
- Unsupported docs listed in Uploaded Files must be clearly excluded from modeled outputs where applicable.

9. Public sample / high-value outreach readiness
- No DocRaptor watermark.
- No TEST, MESSY, CLEAN, UNSUPPORTED, QA, or source fixture filenames in public-facing samples.
- No public AI, vendor, or model language.
- No BUY, SELL, HOLD, or recommendation language.
- No mojibake, typos, awkward punctuation, dangling periods, or internal debug wording.

10. Visual/institutional presentation
- Cover hierarchy should feel premium and institutional.
- Typography and color treatment should be consistent.
- Charts and tables must look intentional and institutional.
- Warnings should be visible but not alarmist.

END CHECKLIST
`.trim();

export const ALLOWED_METHODOLOGY_LANGUAGE_PATTERNS = [
  /investoriq estimates/i,
  /document[- ]?backed/i,
  /document[- ]?driven/i,
  /deterministic/i,
  /standardized underwriting frameworks/i,
  /defined modeling frameworks/i,
  /framework[- ]?constrained/i,
  /transparency and auditability/i,
  /missing inputs are omitted/i,
  /missing source data is not gap[- ]?filled/i,
  /not inferred/i,
  /excluded from modeled outputs/i,
  /omitted rather than inferred/i,
];

export const PROHIBITED_PUBLIC_LANGUAGE_PATTERNS = [
  /\b(BUY|SELL|HOLD)\b/i,
  /\b(?:recommend(?:ed|s|ation)?|advise[sd]?)\s+(?:purchase|acquisition|invest|investment|sale|sell|hold)\b/i,
  /\binvestment (?:recommendation|advice)\b/i,
  /\b(?:AI-assisted|AI assisted|OpenAI|LLM|model-generated|vendor-generated)\b/i,
  /\b(?:guarantee|guaranteed|guarantees|risk-free|cannot lose|certain return|error-free|fabricated certainty|unsupported accuracy)\b/i,
  /\baccurate without support\b/i,
];

export const FILENAME_HINT_ONLY_PATTERNS = [
  /\bUNSUPPORTED\b/i,
  /\bTEST\b/i,
  /\bCLEAN\b/i,
  /\bMESSY\b/i,
  /\bQA\b/i,
];

function textFromInput(input) {
  if (!input) return "";
  if (typeof input === "string") return input;
  return [
    input.code,
    input.issue,
    input.message,
    input.suggested_review,
    input.excerpt,
    input.evidence?.summary,
    input.evidence?.source,
    input.evidence?.file,
    input.evidence?.artifact_type,
    input.evidence?.excerpt,
  ].filter(Boolean).join(" ");
}

export function containsProhibitedPublicLanguage(text) {
  const source = String(text || "");
  return PROHIBITED_PUBLIC_LANGUAGE_PATTERNS.some((pattern) => pattern.test(source));
}

export function containsAllowedMethodologyLanguage(text) {
  const source = String(text || "");
  return ALLOWED_METHODOLOGY_LANGUAGE_PATTERNS.some((pattern) => pattern.test(source));
}

export function isAllowedMethodologyOnlyText(input) {
  const fullText = textFromInput(input);
  const excerptText = typeof input === "object" && input !== null
    ? String(input.excerpt || input.evidence?.excerpt || "")
    : fullText;
  return containsAllowedMethodologyLanguage(fullText) && !containsProhibitedPublicLanguage(excerptText || fullText);
}

export function isFilenameHintOnlyText(input) {
  const fullText = textFromInput(input);
  const mentionsFilenameToken = FILENAME_HINT_ONLY_PATTERNS.some((pattern) => pattern.test(fullText));
  if (!mentionsFilenameToken) return false;
  const filenameOnly = /filename|file name|named|token/i.test(fullText);
  const substantiveUse = /rendered report|relied on|modeled|quantitative|parsed value|parse_error|parse status|failed validation|contamination/i.test(fullText);
  return filenameOnly && !substantiveUse;
}
