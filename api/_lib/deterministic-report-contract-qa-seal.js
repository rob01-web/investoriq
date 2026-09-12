import { buildDeterministicReportContractQaSeal as buildBaseDeterministicReportContractQaSeal } from "./deterministic-report-contract-qa-seal-base.js";

export * from "./deterministic-report-contract-qa-seal-base.js";

const OPERATING_COST_COVERAGE_FORMULA = "total_operating_expenses / gross_potential_rent";
const LEGACY_BREAK_EVEN_CODES = new Set([
  "BREAK_EVEN_CONTRACT_IDENTITY_MISMATCH",
  "BREAK_EVEN_CANONICAL_MATH_MISMATCH",
  "BREAK_EVEN_UPSTREAM_RESULT_MISMATCH",
  "BREAK_EVEN_RENDERED_RESULT_MISMATCH",
]);

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
    .replace(/\s+/g, " ")
    .trim();
}

function issue(code, message, evidence = {}, path = "html.operatingCostCoverageRatio") {
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

function extractOperatingCostCoveragePercentages(text = "") {
  const values = [];
  const pattern = /Operating Cost Coverage Ratio\s*(?::|\|)?\s*([+\-]?\d+(?:\.\d+)?)\s*%/gi;
  let match;
  while ((match = pattern.exec(String(text || ""))) !== null) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

function validateOperatingCostCoverage(html = "", breakEven = null) {
  if (!breakEven || typeof breakEven !== "object" || Array.isArray(breakEven)) return [];

  const issues = [];
  const numerator = finite(breakEven.numerator);
  const denominator = finite(breakEven.denominator);
  const result = finite(breakEven.result);
  const upstreamResult = finite(breakEven.upstreamResult);
  const expected = Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0
    ? numerator / denominator
    : null;
  if (!Number.isFinite(expected)) return issues;

  if (String(breakEven.formula || "").trim() !== OPERATING_COST_COVERAGE_FORMULA) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_FORMULA_MISMATCH",
      "Operating Cost Coverage Ratio must preserve the accepted operating-expense divided by T12 Gross Potential Rent formula.",
      { formula: breakEven.formula || null, expected_formula: OPERATING_COST_COVERAGE_FORMULA },
      "contract.breakEvenOccupancy.formula"
    ));
  }

  if (!Number.isFinite(result) || Math.abs(result - expected) > 1e-9) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_CANONICAL_MATH_MISMATCH",
      "Operating Cost Coverage Ratio disagrees with accepted OpEx divided by T12 Gross Potential Rent.",
      { numerator, denominator, expected_result: expected, canonical_result: result },
      "contract.breakEvenOccupancy.result"
    ));
  }

  if (Number.isFinite(upstreamResult) && Math.abs(upstreamResult - expected) > 1e-9) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_UPSTREAM_RESULT_MISMATCH",
      "Upstream Operating Cost Coverage Ratio disagrees with the accepted formula inputs.",
      { numerator, denominator, expected_result: expected, upstream_result: upstreamResult },
      "contract.breakEvenOccupancy.upstreamResult"
    ));
  }

  const visibleText = stripCustomerHtml(html);
  if (/\bBreak[- ]Even Occupancy\b/i.test(visibleText)) {
    issues.push(issue(
      "MISLEADING_BREAK_EVEN_OCCUPANCY_LABEL_VISIBLE",
      "Customer output must not present the OpEx divided by GPR ratio as a physical Break-Even Occupancy threshold.",
      {},
      "html.operatingCostCoverageRatio.label"
    ));
  }

  const renderedValues = extractOperatingCostCoveragePercentages(visibleText);
  const expectedPercentage = expected * 100;
  if (renderedValues.length === 0 || renderedValues.some((value) => Math.abs(value - expectedPercentage) > 0.051)) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_RENDERED_RESULT_MISMATCH",
      "Every rendered Operating Cost Coverage Ratio value must agree with accepted OpEx divided by T12 Gross Potential Rent.",
      { numerator, denominator, expected_percentage: expectedPercentage, rendered_percentage_values: renderedValues }
    ));
  }

  return issues;
}

function normalizeUpstreamSeal(upstreamSeal = null) {
  if (!upstreamSeal || typeof upstreamSeal !== "object" || Array.isArray(upstreamSeal)) return upstreamSeal;

  const sourceIssues = Array.isArray(upstreamSeal.issues) ? upstreamSeal.issues : [];
  const retainedIssues = sourceIssues.filter((entry) => {
    const code = String(entry?.code || "");
    if (LEGACY_BREAK_EVEN_CODES.has(code)) return false;
    if (code !== "CANONICAL_QA_DISAGREEMENT") return true;

    const evidence = entry?.evidence && typeof entry.evidence === "object" ? entry.evidence : {};
    const downstreamCodes = Array.isArray(evidence.downstream_issue_codes)
      ? evidence.downstream_issue_codes.map((value) => String(value || "")).filter(Boolean)
      : [];
    const upstreamCodes = Array.isArray(evidence.upstream_issue_codes)
      ? evidence.upstream_issue_codes.map((value) => String(value || "")).filter(Boolean)
      : [];
    const legacyOnly = downstreamCodes.length > 0 &&
      downstreamCodes.every((value) => LEGACY_BREAK_EVEN_CODES.has(value)) &&
      upstreamCodes.every((value) => LEGACY_BREAK_EVEN_CODES.has(value));
    return !legacyOnly;
  });

  return {
    ...upstreamSeal,
    ok: retainedIssues.length === 0 ? true : Boolean(upstreamSeal.ok),
    issues: retainedIssues,
    canonical_qa_agreement: !retainedIssues.some((entry) => entry?.code === "CANONICAL_QA_DISAGREEMENT"),
  };
}

export function buildDeterministicReportContractQaSeal(args = {}) {
  // The base validator owns the historical Break-Even Occupancy contract. The
  // current customer contract is Operating Cost Coverage Ratio, so do not let
  // the historical validator manufacture a disagreement before the current
  // validator evaluates the governed surface.
  const base = buildBaseDeterministicReportContractQaSeal({
    ...args,
    breakEven: null,
    upstreamSeal: normalizeUpstreamSeal(args?.upstreamSeal),
  });
  const retainedIssues = (Array.isArray(base?.issues) ? base.issues : [])
    .filter((entry) => !LEGACY_BREAK_EVEN_CODES.has(String(entry?.code || "")));
  const coverageIssues = validateOperatingCostCoverage(args?.html, args?.breakEven);
  const issues = [...retainedIssues, ...coverageIssues];
  const ok = issues.length === 0;

  return {
    ...base,
    ok,
    status: ok ? "pass" : "internal_render_contract_failure",
    failure_class: ok ? null : "internal_render_contract_failure",
    canonical_qa_agreement: !issues.some((entry) => entry?.code === "CANONICAL_QA_DISAGREEMENT"),
    issues,
  };
}
