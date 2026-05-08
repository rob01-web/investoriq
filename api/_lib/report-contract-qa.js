import { containsProhibitedPublicLanguage } from "./investoriq-qa-doctrine.js";

const REPORT_CONTRACT_QA_VERSION = "2026.05.08.1";

function stripHtml(html) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/(tr|p|div|li|h[1-6]|section|article|td|th)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function latestPayload(artifacts, type) {
  return (Array.isArray(artifacts) ? artifacts : []).find((row) => row?.type === type)?.payload || null;
}

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function addViolation(violations, violation) {
  violations.push({
    code: violation.code,
    severity: violation.severity || "medium",
    category: violation.category || "report_contract",
    message: violation.message || "",
    evidence: violation.evidence || {},
    blocks_customer_delivery: Boolean(violation.blocks_customer_delivery),
    blocks_public_sample: violation.blocks_public_sample !== false,
    blocks_high_value_outreach: violation.blocks_high_value_outreach !== false,
  });
}

function windowAfter(text, pattern, chars = 1400) {
  const match = pattern.exec(text);
  if (!match) return "";
  return text.slice(match.index, match.index + chars);
}

function hasBadMoneyRow(section, { allowNegative = false } = {}) {
  const lines = String(section || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines.some((line) => {
    if (/\$\s*0(?:\.00)?\b/.test(line)) return true;
    if (!allowNegative && /(?:-\s*\$|\$\s*-|\([\s$]*[\d,]+(?:\.\d{1,2})?\))/.test(line)) return true;
    return false;
  });
}

function reportTypeIsScreening(reportType, reportTier) {
  return String(reportType || "").toLowerCase() === "screening" || Number(reportTier) === 1;
}

function hasTrueCurrentDebt(artifacts, sourceReportCoverageQa) {
  const loan = latestPayload(artifacts, "loan_term_sheet_parsed");
  const mortgage = latestPayload(artifacts, "mortgage_statement_parsed");
  const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  const invMortgage = sourceReportCoverageQa?.artifact_inventory?.mortgage_statement_parsed;
  return Boolean(
    positive(loan?.loan_amount) ||
    positive(loan?.outstanding_balance) ||
    positive(mortgage?.loan_amount) ||
    positive(mortgage?.outstanding_balance) ||
    invLoan?.has_balance ||
    invMortgage?.has_balance
  );
}

function hasDerivedAcquisitionDebt(artifacts, sourceReportCoverageQa) {
  const loan = latestPayload(artifacts, "loan_term_sheet_parsed");
  const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  return Boolean(
    positive(loan?.derived_acquisition_loan_amount) ||
    positive(loan?.purchase_price) ||
    loan?.debt_basis === "acquisition_financing_assumption" ||
    invLoan?.has_derived_acquisition_debt ||
    invLoan?.has_purchase_price
  );
}

function hasStructuredRenovation(artifacts) {
  const renovation = latestPayload(artifacts, "renovation_parsed");
  return Boolean(
    positive(renovation?.total_budget) ||
    positive(renovation?.total_capex) ||
    positive(renovation?.renovation_budget) ||
    (Array.isArray(renovation?.budget_rows) && renovation.budget_rows.length > 0) ||
    (Array.isArray(renovation?.scope_rows) && renovation.scope_rows.length > 0) ||
    (Array.isArray(renovation?.scope_items) && renovation.scope_items.length > 0)
  );
}

function coreCoveragePresent(sourceReportCoverageQa) {
  const inv = sourceReportCoverageQa?.artifact_inventory || {};
  return Boolean(inv?.t12_parsed?.has_core_totals && inv?.rent_roll_parsed?.present);
}

function countBySeverity(violations) {
  const counts = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const violation of violations) {
    counts.total += 1;
    const severity = ["critical", "high", "medium", "low"].includes(violation?.severity)
      ? violation.severity
      : "medium";
    counts[severity] += 1;
  }
  return counts;
}

export function buildReportContractQa({
  jobId = null,
  userId = null,
  propertyName = null,
  reportType = null,
  reportTier = null,
  html = "",
  artifacts = [],
  sourceReportCoverageQa = null,
  reportQaFlags = [],
} = {}) {
  const text = stripHtml(html);
  const lower = text.toLowerCase();
  const violations = [];

  if (
    containsProhibitedPublicLanguage(text) ||
    /\b(?:AI|OpenAI|LLM)\b/i.test(text) ||
    /\binternal QA\b|\bdebug\b|\bparser\b/i.test(text)
  ) {
    addViolation(violations, {
      code: "HARD_PUBLIC_LANGUAGE_CONTRACT",
      severity: "critical",
      category: "public_language",
      message: "Rendered report contains prohibited public, internal, or debug language.",
      evidence: { matched: true },
      blocks_customer_delivery: true,
    });
  }

  if (reportTypeIsScreening(reportType, reportTier)) {
    const underwritingOnly = [
      ["Debt Structure", /\bDebt Structure\b/i],
      ["Current Debt Coverage", /\bCurrent Debt Coverage\b/i],
      ["Refinance Stability Classification", /\bRefinance Stability Classification\b/i],
      ["Discounted Cash Flow", /\bDiscounted Cash Flow\b|\bDCF\b/i],
      ["Deal Scorecard", /\bDeal Scorecard\b/i],
      ["Advanced Modeling", /\bAdvanced Modeling\b/i],
      ["Final Recommendation", /\bFinal Recommendation\b/i],
      ["Renovation Strategy", /\bRenovation Strategy\b|\bROI\b|\bpayback\b/i],
    ].filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
    if (underwritingOnly.length > 0) {
      addViolation(violations, {
        code: "SCREENING_UNDERWRITING_SECTION_LEAK",
        severity: "high",
        category: "report_type_contract",
        message: "Screening report rendered underwriting-only sections.",
        evidence: { sections: underwritingOnly },
      });
    }
  }

  const incomeWindow = windowAfter(text, /Top Positive Income Lines|Top Income Drivers/i);
  if (incomeWindow) {
    const badIncomeLabel =
      /\b(?:Effective Gross Income|EGI|Gross Potential Rent|GPR|Total Income|Net Operating Income|NOI|subtotal|total|vacancy|loss|concession|bad debt|collection loss)\b/i.test(incomeWindow);
    if (badIncomeLabel || hasBadMoneyRow(incomeWindow)) {
      addViolation(violations, {
        code: "TOP_POSITIVE_INCOME_LINES_CONTRACT",
        severity: "high",
        category: "table_contract",
        message: "Top Positive Income Lines includes subtotal, negative, vacancy, zero, or non-positive-income rows.",
        evidence: { excerpt: incomeWindow.slice(0, 500) },
      });
    }
  }

  const expenseWindow = windowAfter(text, /Top Expense Drivers|Expense Drivers/i);
  if (expenseWindow) {
    const badExpenseLabel =
      /\b(?:Total Operating Expenses|Total Expenses|subtotal|total|Effective Gross Income|EGI|NOI)\b/i.test(expenseWindow);
    if (badExpenseLabel || hasBadMoneyRow(expenseWindow, { allowNegative: true })) {
      addViolation(violations, {
        code: "TOP_EXPENSE_DRIVERS_CONTRACT",
        severity: "high",
        category: "table_contract",
        message: "Top Expense Drivers includes total, subtotal, zero, income, or NOI rows.",
        evidence: { excerpt: expenseWindow.slice(0, 500) },
      });
    }
  }

  const derivedAcq = hasDerivedAcquisitionDebt(artifacts, sourceReportCoverageQa);
  const currentDebt = hasTrueCurrentDebt(artifacts, sourceReportCoverageQa);
  if (derivedAcq && !currentDebt) {
    const hasSeparation =
      /Proposed Acquisition Debt Sizing/i.test(text) &&
      /Derived Acquisition Loan Amount/i.test(text) &&
      /Proposed Acquisition DSCR/i.test(text) &&
      /not current outstanding debt/i.test(text) &&
      /not used as (?:a )?current refinance debt balance/i.test(text);
    const contaminated =
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed)/i.test(text) ||
      /Refinance Stability Classification\s*[:\n]\s*(?:Stable|Review|Constrained|Sensitized|Fragile|High Risk|Refinance Shortfall)/i.test(text) ||
      /current (?:outstanding )?(?:debt|refinance debt) balance[^.\n]{0,120}derived acquisition/i.test(text);
    if (!hasSeparation || contaminated) {
      addViolation(violations, {
        code: "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
        severity: contaminated ? "critical" : "high",
        category: "debt_contract",
        message: "Derived acquisition financing is not clearly separated from current debt/refi treatment.",
        evidence: { has_separation: hasSeparation, contaminated_current_debt_language: contaminated },
        blocks_customer_delivery: contaminated,
      });
    }
  }

  if (!hasStructuredRenovation(artifacts)) {
    const renovationUnsupported =
      /Renovation (?:ROI|Return)|payback analysis|rent lift|implementation schedule/i.test(text) &&
      !/No renovation return, rent lift, ROI, or payback analysis is modeled|not modeled as a prospective renovation strategy|no verified forward-looking/i.test(text);
    if (renovationUnsupported) {
      addViolation(violations, {
        code: "UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED",
        severity: "high",
        category: "section_gating_contract",
        message: "Renovation return or implementation analysis rendered without structured forward-looking renovation inputs.",
        evidence: { structured_renovation_present: false },
      });
    }
  }

  if (!currentDebt) {
    const currentDebtUnsupported =
      /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i.test(text) ||
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed)/i.test(text);
    if (currentDebtUnsupported) {
      addViolation(violations, {
        code: "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
        severity: "critical",
        category: "section_gating_contract",
        message: "Current debt analysis rendered without true current debt balance support.",
        evidence: { current_debt_balance_present: false },
        blocks_customer_delivery: true,
      });
    }
  }

  if (
    /Insufficient Data/i.test(text) &&
    /(?:Operating Profile|Capital Risk Profile)/i.test(text) &&
    (
      coreCoveragePresent(sourceReportCoverageQa) ||
      (Array.isArray(sourceReportCoverageQa?.deterministic_flags) &&
        sourceReportCoverageQa.deterministic_flags.some((flag) => flag?.code === "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL"))
    )
  ) {
    addViolation(violations, {
      code: "CORE_METRICS_WITH_INSUFFICIENT_DATA_CONTRACT",
      severity: "high",
      category: "classification_contract",
      message: "Report shows Insufficient Data near profile classification despite core T12 and rent roll coverage.",
      evidence: { core_coverage_present: coreCoveragePresent(sourceReportCoverageQa) },
    });
  }

  const pressureWindow = windowAfter(text, /Primary Pressure Point/i, 500);
  if (
    pressureWindow &&
    (
      /Expense Ratio[^0-9]{0,30}(?:[0-4]?\d(?:\.\d)?|5[0-4](?:\.\d)?)%/i.test(pressureWindow) ||
      /NOI Margin[^0-9]{0,30}(?:4[6-9](?:\.\d)?|[5-9]\d(?:\.\d)?)%/i.test(pressureWindow) ||
      /Occupancy[^0-9]{0,30}(?:9[1-9](?:\.\d)?|100(?:\.0)?)%/i.test(pressureWindow) ||
      /DSCR[^0-9]{0,30}(?:1\.(?:3[5-9]|[4-9]\d)|[2-9]\.\d+)x/i.test(pressureWindow)
    ) &&
    !/supports|strong|well-covered|cushion/i.test(pressureWindow)
  ) {
    addViolation(violations, {
      code: "PRIMARY_PRESSURE_POINT_STABLE_METRIC_CONTRACT",
      severity: "medium",
      category: "classification_contract",
      message: "Primary Pressure Point appears paired with a clearly stable metric.",
      evidence: { excerpt: pressureWindow },
    });
  }

  for (const flag of Array.isArray(reportQaFlags) ? reportQaFlags : []) {
    if (flag?.code === "CORE_METRICS_WITH_INSUFFICIENT_DATA_LABEL") {
      addViolation(violations, {
        code: "CORE_METRICS_WITH_INSUFFICIENT_DATA_CONTRACT",
        severity: "high",
        category: "classification_contract",
        message: "Report QA flags contradictory Insufficient Data classification with core metrics present.",
        evidence: flag?.evidence || {},
      });
    }
  }

  const counts = countBySeverity(violations);
  const contractStatus = counts.critical > 0 ? "block" : counts.total > 0 ? "warn" : "pass";
  const customerDeliveryReady = !violations.some((violation) => violation.blocks_customer_delivery);
  const publicSampleReady = !violations.some((violation) => violation.blocks_public_sample && ["medium", "high", "critical"].includes(violation.severity));
  const highValueOutreachReady = !violations.some((violation) => violation.blocks_high_value_outreach && ["medium", "high", "critical"].includes(violation.severity));

  return {
    event: "report_contract_qa",
    version: REPORT_CONTRACT_QA_VERSION,
    advisory_only: true,
    no_public_surface: true,
    job_id: jobId,
    user_id: userId,
    property_name: propertyName,
    report_type: reportType,
    report_tier: reportTier,
    contract_status: contractStatus,
    customer_delivery_ready: customerDeliveryReady,
    public_sample_ready: publicSampleReady,
    high_value_outreach_ready: highValueOutreachReady,
    violations,
    counts,
    timestamp: new Date().toISOString(),
  };
}

export const __test__ = {
  stripHtml,
  hasDerivedAcquisitionDebt,
  hasTrueCurrentDebt,
  hasStructuredRenovation,
};
