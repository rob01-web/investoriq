import { isCanonicalInstitutionalFinancialIntelligence } from "./institutional-financial-intelligence.js";

const CONTRACT_QA_SEAL_VERSION = "p0b_deterministic_contract_qa_v1";
const BREAK_EVEN_FORMULA = "total_operating_expenses / gross_potential_rent";
const RECONCILIATION_REQUIRED_STATUSES = new Set([
  "source_reconciliation_required",
  "parser_suspected",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripCustomerHtml(html = "") {
  return String(html || "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMoney(value) {
  const number = finite(value);
  if (!Number.isFinite(number)) return null;
  const normalized = Object.is(number, -0) ? 0 : number;
  const absolute = Math.abs(normalized).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return normalized < 0 ? `($${absolute})` : `$${absolute}`;
}

function formatPercent(value, decimals = 1) {
  const number = finite(value);
  if (!Number.isFinite(number)) return null;
  const percentage = Math.abs(number) <= 1 ? number * 100 : number;
  return `${percentage.toFixed(decimals)}%`;
}

function containsLabeledDisplay(text, label, displays = []) {
  const source = String(text || "");
  const labelPattern = escapeRegExp(label);
  return displays.filter(Boolean).some((display) => {
    const displayPattern = escapeRegExp(display);
    return new RegExp(`${labelPattern}[\\s\\S]{0,120}${displayPattern}`, "i").test(source);
  });
}

function extractLabeledPercentValues(text, labelPattern) {
  const source = String(text || "");
  const values = [];
  const pattern = new RegExp(`${labelPattern}\\s*(?::|\\|)?\\s*([+\\-]?\\d+(?:\\.\\d+)?)\\s*%`, "gi");
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function buildIssue(code, message, evidence = {}, path = "html") {
  return {
    code,
    severity: "critical",
    category: "internal_render_contract_failure",
    classification: "internal_render_contract_failure",
    message,
    evidence,
    path,
    blocks_customer_delivery: true,
    customer_document_failure: false,
  };
}

function supportFactComplete(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return Number.isFinite(finite(value));
}

function validateSupportFactBundles(supportSections = null) {
  const issues = [];
  if (!isPlainObject(supportSections)) return issues;
  const supportFactSections = new Set([
    "acquisitionRequestContext",
    "proposedFinancingContext",
    "currentDebtContext",
    "appraisalContext",
    "renovationContext",
    "marketSurveyContext",
    "environmentalContext",
  ]);
  for (const [sectionKey, section] of Object.entries(supportSections)) {
    if (!supportFactSections.has(sectionKey)) continue;
    if (section?.factAvailability?.sourceBacked !== true) continue;
    const required = Array.isArray(section?.factAvailability?.required)
      ? section.factAvailability.required.map((value) => String(value || "").trim()).filter(Boolean)
      : [];
    if (required.length === 0) continue;
    const missing = required.filter((factName) => !supportFactComplete(section?.facts?.[factName]));
    if (missing.length > 0) {
      issues.push(buildIssue(
        "SOURCE_BACKED_SUPPORT_FACT_BUNDLE_INCOMPLETE",
        `${sectionKey} cannot be treated as complete from a filename, role label, or presence signal alone.`,
        { section: sectionKey, required_facts: required, missing_facts: missing },
        `contract.supportSections.${sectionKey}`
      ));
    }
  }
  return issues;
}

function validateIdentity(text, reportIdentity = null) {
  const issues = [];
  const mode = String(reportIdentity?.reportMode || "").trim().toLowerCase();
  const type = String(reportIdentity?.reportType || "").trim().toLowerCase();
  const tier = finite(reportIdentity?.reportTier);
  if (mode === "screening_v1") {
    if (type && !type.includes("screen")) {
      issues.push(buildIssue(
        "REPORT_IDENTITY_CONTRACT_MISMATCH",
        "Screening report mode disagrees with the canonical report type.",
        { report_mode: mode, report_type: type, report_tier: tier },
        "contract.reportIdentity"
      ));
    }
    if (!/(?:Preliminary Investment Screening Memorandum|Screening Signal|Preliminary Screening|Screening Report)/i.test(text) || /Acquisition Memo|Underwriting Report/i.test(text)) {
      issues.push(buildIssue(
        "SCREENING_VISIBLE_IDENTITY_MISMATCH",
        "Screening customer HTML must identify only as the Screening report family.",
        { report_mode: mode, report_type: type, report_tier: tier },
        "html.identity"
      ));
    }
  }
  if (mode === "v1_core") {
    if (type && !/(underwriting|acquisition)/.test(type)) {
      issues.push(buildIssue(
        "REPORT_IDENTITY_CONTRACT_MISMATCH",
        "Acquisition report mode disagrees with the canonical underwriting report type.",
        { report_mode: mode, report_type: type, report_tier: tier },
        "contract.reportIdentity"
      ));
    }
    if (Number.isFinite(tier) && tier !== 2) {
      issues.push(buildIssue(
        "ACQUISITION_TIER_IDENTITY_MISMATCH",
        "Acquisition underwriting output must retain its canonical Tier 2 identity.",
        { report_mode: mode, report_type: type, report_tier: tier },
        "contract.reportIdentity.reportTier"
      ));
    }
    if (!/(?:Underwriting Report|Acquisition Memo)/i.test(text) || /Preliminary Investment Screening Memorandum|Screening Signal/i.test(text)) {
      issues.push(buildIssue(
        "ACQUISITION_VISIBLE_IDENTITY_MISMATCH",
        "Acquisition customer HTML must identify only as the Underwriting report family.",
        { report_mode: mode, report_type: type, report_tier: tier },
        "html.identity"
      ));
    }
  }
  return issues;
}

function validateReconciliation(text, sourceReconciliation = null) {
  const issues = [];
  const state = isPlainObject(sourceReconciliation?.state)
    ? sourceReconciliation.state
    : isPlainObject(sourceReconciliation)
      ? sourceReconciliation
      : null;
  const required = RECONCILIATION_REQUIRED_STATUSES.has(String(state?.status || "").trim().toLowerCase());
  if (!required) return { required: false, publishability: null, issues };

  const canonical = {
    t12_gpr: finite(state?.t12_gpr),
    rr_annual_in_place: finite(state?.rr_annual_in_place),
    difference_amount: finite(state?.difference_amount),
    variance_pct: finite(state?.variance_pct),
    disclosure: String(state?.source_reconciliation_disclosure || "").trim(),
  };
  const missingCanonical = Object.entries(canonical)
    .filter(([, value]) => value === null || value === "")
    .map(([key]) => key);
  if (missingCanonical.length > 0 || sourceReconciliation?.sourceBacked === false) {
    issues.push(buildIssue(
      "CANONICAL_RECONCILIATION_CONTRACT_INCOMPLETE",
      "Required reconciliation reached the render contract without the complete canonical fact bundle.",
      { missing_canonical_facts: missingCanonical, source_backed: sourceReconciliation?.sourceBacked ?? null },
      "contract.sourceReconciliation"
    ));
    return { required: true, publishability: "disclose_only_publishable", issues };
  }

  const expectedRows = [
    ["T12 Gross Potential Rent", [formatMoney(canonical.t12_gpr)]],
    ["Rent Roll Annual In-Place Rent", [formatMoney(canonical.rr_annual_in_place)]],
    ["Rent Roll less T12", [
      formatMoney(canonical.difference_amount),
      canonical.difference_amount < 0 ? `-$${Math.abs(canonical.difference_amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : null,
    ]],
    ["Variance", [formatPercent(canonical.variance_pct, 2), formatPercent(canonical.variance_pct, 1)]],
  ];
  const missingRendered = expectedRows
    .filter(([label, displays]) => !containsLabeledDisplay(text, label, displays))
    .map(([label]) => label);
  if (missingRendered.length > 0) {
    issues.push(buildIssue(
      "REQUIRED_RECONCILIATION_RENDERED_VALUES_MISSING",
      "Required source reconciliation disclosure is missing one or more canonical rendered values.",
      { missing_rendered_labels: missingRendered, canonical },
      "html.sourceReconciliation"
    ));
  }

  const renderedVarianceValues = extractLabeledPercentValues(text, "(?:Rent Roll vs T12 GPR )?Variance");
  const canonicalVariancePercentage = canonical.variance_pct * 100;
  const mismatches = renderedVarianceValues.filter((value) => Math.abs(value - canonicalVariancePercentage) > 0.051);
  if (renderedVarianceValues.length === 0 || mismatches.length > 0) {
    issues.push(buildIssue(
      "RENDERED_RECONCILIATION_VARIANCE_MISMATCH",
      "Rendered reconciliation variance must agree with the canonical variance.",
      { canonical_variance_pct: canonical.variance_pct, rendered_percentage_values: renderedVarianceValues },
      "html.sourceReconciliation.variance"
    ));
  }
  if (!text.includes(canonical.disclosure)) {
    issues.push(buildIssue(
      "REQUIRED_RECONCILIATION_DISCLOSURE_MISSING",
      "The exact canonical source reconciliation disclosure is missing from customer HTML.",
      { canonical_disclosure: canonical.disclosure },
      "html.sourceReconciliation.disclosure"
    ));
  }
  return { required: true, publishability: "disclose_only_publishable", issues };
}

function validateBreakEven(text, breakEven = null) {
  const issues = [];
  if (!isPlainObject(breakEven)) return issues;
  const numerator = finite(breakEven.numerator);
  const denominator = finite(breakEven.denominator);
  const result = finite(breakEven.result);
  const upstreamResult = finite(breakEven.upstreamResult);
  const expected = Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0
    ? numerator / denominator
    : null;
  if (!Number.isFinite(expected)) return issues;
  if (String(breakEven.label || "").trim() !== "Break-Even Occupancy" || String(breakEven.formula || "").trim() !== BREAK_EVEN_FORMULA) {
    issues.push(buildIssue(
      "BREAK_EVEN_CONTRACT_IDENTITY_MISMATCH",
      "Break-Even Occupancy label and formula must use the canonical contract.",
      { label: breakEven.label || null, formula: breakEven.formula || null, expected_formula: BREAK_EVEN_FORMULA },
      "contract.breakEvenOccupancy"
    ));
  }
  if (!Number.isFinite(result) || Math.abs(result - expected) > 1e-9) {
    issues.push(buildIssue(
      "BREAK_EVEN_CANONICAL_MATH_MISMATCH",
      "Break-Even Occupancy result disagrees with canonical OpEx divided by T12 GPR.",
      { numerator, denominator, expected_result: expected, canonical_result: result },
      "contract.breakEvenOccupancy.result"
    ));
  }
  if (Number.isFinite(upstreamResult) && Math.abs(upstreamResult - expected) > 1e-9) {
    issues.push(buildIssue(
      "BREAK_EVEN_UPSTREAM_RESULT_MISMATCH",
      "Upstream Break-Even Occupancy disagrees with the canonical formula inputs.",
      { numerator, denominator, expected_result: expected, upstream_result: upstreamResult },
      "contract.breakEvenOccupancy.upstreamResult"
    ));
  }
  const renderedValues = extractLabeledPercentValues(text, "Break[- ]Even Occupancy");
  const expectedPercentage = expected * 100;
  if (renderedValues.length === 0 || renderedValues.some((value) => Math.abs(value - expectedPercentage) > 0.051)) {
    issues.push(buildIssue(
      "BREAK_EVEN_RENDERED_RESULT_MISMATCH",
      "Every rendered Break-Even Occupancy value must agree with canonical OpEx divided by T12 GPR.",
      { numerator, denominator, expected_percentage: expectedPercentage, rendered_percentage_values: renderedValues },
      "html.breakEvenOccupancy"
    ));
  }
  return issues;
}

function formatFinancialIntelligenceResult(receipt) {
  const result = finite(receipt?.result);
  if (!Number.isFinite(result)) return null;
  const units = String(receipt?.units || "");
  if (units === "ratio_x") return `${result.toFixed(2)}x`;
  if (units === "ratio") return formatPercent(result, 2);
  if (units.startsWith("currency")) return formatMoney(result);
  return String(result);
}

function validateInstitutionalFinancialIntelligence(text, financialIntelligence = null) {
  const issues = [];
  if (financialIntelligence == null) return issues;
  if (!isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) {
    return [buildIssue(
      "FINANCIAL_INTELLIGENCE_RECEIPT_INVALID",
      "The financial-intelligence render contract requires the canonical immutable receipt.",
      {},
      "contract.financialIntelligence"
    )];
  }
  const headings = {
    debtServiceCoverage: "Debt Service and Coverage",
    debtTermAnalysis: "Debt Term and Maturity Analysis",
    coreReconciliation: "Core Source Reconciliation",
    capitalPlanAnalysis: "Capital Plan and Reserve Position",
  };
  const renderedLabels = {
    currentDebtAnnualDebtService: "Current Debt",
    proposedFinancingAnnualDebtService: "Proposed Acquisition Financing",
    currentDebtDscr: "Current Debt",
    proposedFinancingDscr: "Proposed Acquisition Financing",
    proposedLenderFeeDollars: "Proposed Lender Fee",
    coreRentDifference: "Rent Roll less T12",
    coreRentVarianceToT12Gpr: "Variance to T12 Gross Potential Rent",
    coreRentDifferencePerUnitMonthly: "Difference per Unit per Month",
    annualReserveContributionPerUnit: "Annual Reserve Contribution per Unit",
  };
  for (const [sectionKey, section] of Object.entries(financialIntelligence.customerSections || {})) {
    if (section?.displayReady !== true) continue;
    const heading = headings[sectionKey];
    if (heading && !text.includes(heading)) {
      issues.push(buildIssue(
        "FINANCIAL_INTELLIGENCE_SECTION_NOT_RENDERED",
        `${heading} is display-ready but missing from the approved customer surface.`,
        { section: sectionKey },
        `html.financialIntelligence.${sectionKey}`
      ));
    }
  }
  for (const receipt of Array.isArray(financialIntelligence.calculationReceipts)
    ? financialIntelligence.calculationReceipts
    : []) {
    if (receipt?.eligible !== true || receipt?.sectionDisplayReady !== true) continue;
    const display = formatFinancialIntelligenceResult(receipt);
    const calculationKey = String(receipt?.calculationKey || "");
    const label = renderedLabels[calculationKey] || (
      calculationKey.startsWith("capitalPlan") && calculationKey.endsWith("ReserveLessRequirement")
        ? `Capital Plan ${calculationKey.match(/capitalPlan(\d+)/)?.[1] || ""} Reserve less Requirement`.trim()
        : receipt?.label || calculationKey
    );
    if (!display || !containsLabeledDisplay(text, label, [display])) {
      issues.push(buildIssue(
        "FINANCIAL_INTELLIGENCE_VALUE_NOT_RENDERED",
        `${receipt?.label || receipt?.calculationKey || "A canonical calculation"} is missing its canonical value.`,
        {
          calculation_key: calculationKey || null,
          expected_label: label,
          expected_display: display,
          canonical_result: receipt?.result ?? null,
        },
        `html.financialIntelligence.${receipt?.calculationKey || "unknown"}`
      ));
    }
  }
  return issues;
}

export function buildDeterministicReportContractQaSeal({
  html = "",
  reportIdentity = null,
  sourceReconciliation = null,
  breakEven = null,
  supportSections = null,
  financialIntelligence = null,
  grossRentCapitalizationAuthorized = false,
  upstreamSeal = null,
} = {}) {
  const text = stripCustomerHtml(html);
  const fullCustomerIdentitySurface = /<html\b|<!doctype\s+html/i.test(String(html || "")) ||
    /Acquisition Memo|Preliminary Investment Screening Memorandum|Screening Signal/i.test(text);
  const issues = [
    ...(fullCustomerIdentitySurface ? validateIdentity(text, reportIdentity) : []),
    ...validateSupportFactBundles(supportSections),
    ...validateBreakEven(text, breakEven),
    ...validateInstitutionalFinancialIntelligence(text, financialIntelligence),
  ];
  const reconciliation = validateReconciliation(text, sourceReconciliation);
  issues.push(...reconciliation.issues);

  if (grossRentCapitalizationAuthorized !== true && (
    /\b(?:Implied Incremental Value|Capitalized (?:Gross )?Rent|Rent Upside Value)\b/i.test(text) ||
    /\bgross rent (?:upside|difference|gap)[\s\S]{0,100}\bcapitalized at\b/i.test(text)
  )) {
    issues.push(buildIssue(
      "UNAUTHORIZED_GROSS_RENT_CAPITALIZATION",
      "Gross rent may not be capitalized or represented as NOI without an authorized NOI conversion basis.",
      { gross_rent_capitalization_authorized: false },
      "html.valueSemantics"
    ));
  }

  const presenceOnlyRows = [
    "Current debt context uploaded",
    "Current debt context",
    "Purchase assumptions provided",
    "Purchase assumptions",
    "Structured renovation / CapEx plan",
    "Renovation / CapEx plan",
    "Appraisal context",
    "Market survey context",
    "Environmental / Phase I ESA context",
  ].filter((label) => containsLabeledDisplay(text, label, ["Yes"]));
  if (presenceOnlyRows.length > 0) {
    issues.push(buildIssue(
      "MANDATORY_SUPPORT_FACTS_REPRESENTED_BY_PRESENCE_ONLY",
      "Support-document presence cannot be represented as accepted fact completeness.",
      { presence_only_labels: presenceOnlyRows },
      "html.supportFactCompleteness"
    ));
  }

  const visibleCustomerHtml = String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  const prohibitedPunctuation = visibleCustomerHtml.match(/(?:\u2013|\u2014|&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);|â€“|â€”)/gi) || [];
  if (prohibitedPunctuation.length > 0) {
    issues.push(buildIssue(
      "CUSTOMER_VISIBLE_PROHIBITED_PUNCTUATION",
      "Customer-visible prohibited punctuation must be normalized before publication.",
      { matches: [...new Set(prohibitedPunctuation)].slice(0, 10) },
      "html.typography"
    ));
  }

  const preDisagreementOk = issues.length === 0;
  if (isPlainObject(upstreamSeal) && Boolean(upstreamSeal.ok) !== preDisagreementOk) {
    issues.push(buildIssue(
      "CANONICAL_QA_DISAGREEMENT",
      "Independent canonical deterministic QA decisions disagree and must be surfaced.",
      {
        upstream_ok: Boolean(upstreamSeal.ok),
        downstream_ok: preDisagreementOk,
        upstream_issue_codes: Array.isArray(upstreamSeal.issues) ? upstreamSeal.issues.map((issue) => issue?.code).filter(Boolean) : [],
        downstream_issue_codes: issues.map((issue) => issue.code),
      },
      "contract.canonicalQaAgreement"
    ));
  }

  return {
    version: CONTRACT_QA_SEAL_VERSION,
    authority: "deterministic_report_contract_qa_seal",
    ok: issues.length === 0,
    status: issues.length === 0 ? "pass" : "internal_render_contract_failure",
    failure_class: issues.length === 0 ? null : "internal_render_contract_failure",
    customer_document_failure: false,
    source_reconciliation: {
      required: reconciliation.required,
      publishability: reconciliation.publishability,
    },
    canonical_qa_agreement: !issues.some((issue) => issue.code === "CANONICAL_QA_DISAGREEMENT"),
    issues,
  };
}

export const DETERMINISTIC_REPORT_CONTRACT = Object.freeze({
  version: CONTRACT_QA_SEAL_VERSION,
  breakEvenLabel: "Break-Even Occupancy",
  breakEvenFormula: BREAK_EVEN_FORMULA,
});
