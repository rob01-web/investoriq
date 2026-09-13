import {
  buildDeterministicReportContractQaSeal as buildBaseDeterministicReportContractQaSeal,
  DETERMINISTIC_REPORT_CONTRACT as BASE_DETERMINISTIC_REPORT_CONTRACT,
} from "./deterministic-report-contract-qa-seal-base.js";
import { OPERATING_COST_COVERAGE_RATIO, calculateOperatingCostCoverageRatio } from "./canonical-operating-metrics.js";

export * from "./deterministic-report-contract-qa-seal-base.js";

const {
  breakEvenLabel: _legacyBreakEvenLabel,
  breakEvenFormula: _legacyBreakEvenFormula,
  ...CURRENT_BASE_DETERMINISTIC_REPORT_CONTRACT
} = BASE_DETERMINISTIC_REPORT_CONTRACT;

export const DETERMINISTIC_REPORT_CONTRACT = Object.freeze({
  ...CURRENT_BASE_DETERMINISTIC_REPORT_CONTRACT,
  operatingCostCoverageRatioLabel: OPERATING_COST_COVERAGE_RATIO.label,
  operatingCostCoverageRatioFormula: OPERATING_COST_COVERAGE_RATIO.formula,
});

const OPERATING_COST_COVERAGE_FORMULA = OPERATING_COST_COVERAGE_RATIO.formula;
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
    .replace(/&(?:ndash|mdash);|&#(?:8211|8212);|&#x(?:2013|2014);/gi, "-")
    .replace(/[\u2010-\u2015]/g, "-")
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

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractOperatingCostCoveragePercentages(text = "") {
  const values = [];
  const labelPattern = escapeRegExp(OPERATING_COST_COVERAGE_RATIO.label);
  const pattern = new RegExp(
    `${labelPattern}\\s*(?::|\\|)?\\s*([+\\-]?\\d+(?:\\.\\d+)?)\\s*%`,
    "gi"
  );
  let match;
  while ((match = pattern.exec(String(text || ""))) !== null) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) values.push(value);
  }
  return values;
}

export function validateOperatingCostCoverage(html = "", operatingCostCoverageRatio = null) {
  const issues = [];
  const visibleText = stripCustomerHtml(html);
  if (/\bBreak(?:[-\u2010-\u2015 ]+)Even\s+Occupancy\b/i.test(visibleText)) {
    issues.push(issue(
      "MISLEADING_BREAK_EVEN_OCCUPANCY_LABEL_VISIBLE",
      "Customer output must not present the OpEx divided by GPR ratio as a physical occupancy break-even threshold.",
      {},
      "html.operatingCostCoverageRatio.label"
    ));
  }

  if (!operatingCostCoverageRatio || typeof operatingCostCoverageRatio !== "object" || Array.isArray(operatingCostCoverageRatio)) return issues;

  const numerator = finite(operatingCostCoverageRatio.numerator);
  const denominator = finite(operatingCostCoverageRatio.denominator);
  const result = finite(operatingCostCoverageRatio.result);
  const upstreamResult = finite(operatingCostCoverageRatio.upstreamResult);
  const expected = calculateOperatingCostCoverageRatio({ operatingExpenses: numerator, grossPotentialRent: denominator });
  if (operatingCostCoverageRatio.displayReady === false && expected === null && result === null && upstreamResult === null) {
    if (extractOperatingCostCoveragePercentages(visibleText).length) {
      issues.push(issue("OPERATING_COST_COVERAGE_UNAVAILABLE_VALUE_VISIBLE", "Unavailable Operating Cost Coverage Ratio must not expose a numeric result."));
    }
    return issues;
  }
  if (operatingCostCoverageRatio.displayReady === false && expected !== null) {
    issues.push(issue("OPERATING_COST_COVERAGE_VALID_INPUTS_SUPPRESSED", "Available accepted inputs require their canonical Operating Cost Coverage Ratio."));
  }
  if (operatingCostCoverageRatio.units !== undefined && operatingCostCoverageRatio.units !== "ratio") {
    issues.push(issue("OPERATING_COST_COVERAGE_UNITS_INVALID", "Operating Cost Coverage Ratio uses explicit ratio units."));
  }
  if (!Number.isFinite(expected)) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_INPUTS_INVALID",
      "Operating Cost Coverage Ratio requires a non-negative operating-expense numerator and a positive Gross Potential Rent denominator.",
      { numerator, denominator },
      "contract.operatingCostCoverageRatio.inputs"
    ));
    return issues;
  }

  if (String(operatingCostCoverageRatio.label || "").trim() !== OPERATING_COST_COVERAGE_RATIO.label) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_LABEL_MISMATCH",
      "Operating Cost Coverage Ratio must preserve the canonical customer label.",
      {
        label: operatingCostCoverageRatio.label || null,
        expected_label: OPERATING_COST_COVERAGE_RATIO.label,
      },
      "contract.operatingCostCoverageRatio.label"
    ));
  }

  if (String(operatingCostCoverageRatio.formula || "").trim() !== OPERATING_COST_COVERAGE_FORMULA) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_FORMULA_MISMATCH",
      "Operating Cost Coverage Ratio must preserve the accepted operating-expense divided by T12 Gross Potential Rent formula.",
      { formula: operatingCostCoverageRatio.formula || null, expected_formula: OPERATING_COST_COVERAGE_FORMULA },
      "contract.operatingCostCoverageRatio.formula"
    ));
  }

  if (!Number.isFinite(result) || Math.abs(result - expected) > 1e-9) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_CANONICAL_MATH_MISMATCH",
      "Operating Cost Coverage Ratio disagrees with accepted OpEx divided by T12 Gross Potential Rent.",
      { numerator, denominator, expected_result: expected, canonical_result: result },
      "contract.operatingCostCoverageRatio.result"
    ));
  }

  if (Number.isFinite(upstreamResult) && Math.abs(upstreamResult - expected) > 1e-9) {
    issues.push(issue(
      "OPERATING_COST_COVERAGE_UPSTREAM_RESULT_MISMATCH",
      "Upstream Operating Cost Coverage Ratio disagrees with the accepted formula inputs.",
      { numerator, denominator, expected_result: expected, upstream_result: upstreamResult },
      "contract.operatingCostCoverageRatio.upstreamResult"
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
  // The base validator still carries a legacy operating-ratio adapter. Suppress
  // that historical input so the canonical OCCR validator below is the only
  // active external operating-ratio authority.
  const base = buildBaseDeterministicReportContractQaSeal({
    ...args,
    breakEven: null,
    upstreamSeal: normalizeUpstreamSeal(args?.upstreamSeal),
  });
  const retainedIssues = (Array.isArray(base?.issues) ? base.issues : [])
    .filter((entry) => !LEGACY_BREAK_EVEN_CODES.has(String(entry?.code || "")));
  const operatingCostCoverageRatio = args?.operatingCostCoverageRatio ?? null;
  const coverageIssues = validateOperatingCostCoverage(args?.html, operatingCostCoverageRatio);
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
