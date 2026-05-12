import { containsProhibitedPublicLanguage } from "./investoriq-qa-doctrine.js";

const REPORT_CONTRACT_QA_VERSION = "2026.05.09.1";

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

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractLabeledNumber(text, labels) {
  const source = String(text || "");
  for (const label of Array.isArray(labels) ? labels : []) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s*[:\\-]?\\s*\\$?([0-9,]+(?:\\.[0-9]+)?)`, "i");
    const match = pattern.exec(source);
    if (!match) continue;
    const value = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function extractCurrentDebtDscrValues(text) {
  const source = String(text || "");
  const values = [];
  const pushValue = (label, rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    values.push({ label, value: Math.round(value * 100) / 100 });
  };

  for (const label of ["DSCR (Computed)", "DSCR (T12 NOI)"]) {
    const match = new RegExp(`${escapeRegExp(label)}[^0-9]{0,80}([0-9]+(?:\\.[0-9]+)?)x`, "i").exec(source);
    if (match) pushValue(label, match[1]);
  }

  const dealScorecardSection = subsectionAfter(source, /Deal Scorecard/i, [/Risk Register/i], 2000);
  const dealScorecardMatch = /DSCR\s*\(Current Debt\)[^0-9]{0,80}?([0-9]+(?:\.[0-9]+)?)x/i.exec(dealScorecardSection);
  if (dealScorecardMatch) pushValue("Deal Scorecard: DSCR (Current Debt)", dealScorecardMatch[1]);

  const currentDebtCoverageSection = subsectionAfter(source, /Current Debt Coverage|Constraint Sensitivity/i, [/Deal Scorecard/i, /Risk Register/i], 2500);
  const baseMatch = /\bBase(?:\s*Case)?\b[^0-9]{0,80}?([0-9]+(?:\.[0-9]+)?)x/i.exec(currentDebtCoverageSection);
  if (baseMatch) pushValue("Current Debt Coverage: Base", baseMatch[1]);

  const riskRegisterSection = subsectionAfter(source, /Risk Register/i, [/Deal Scorecard/i], 2000);
  const riskRegisterMatch = /DSCR\s*\(Current Debt\)[^0-9]{0,80}?([0-9]+(?:\.[0-9]+)?)x/i.exec(riskRegisterSection);
  if (riskRegisterMatch) pushValue("Risk Register: DSCR (Current Debt)", riskRegisterMatch[1]);

  return values;
}

function materiallyDifferent(expectedValue, actualValue) {
  if (!Number.isFinite(expectedValue) || !Number.isFinite(actualValue)) return false;
  const delta = Math.abs(expectedValue - actualValue);
  const scale = Math.max(Math.abs(expectedValue), Math.abs(actualValue), 1);
  return delta > 10 && delta / scale > 0.02;
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

function excerptAround(text, needle, radius = 140) {
  const source = String(text || "");
  const index = source.toUpperCase().indexOf(String(needle || "").toUpperCase());
  if (index < 0) return source.slice(0, Math.min(source.length, radius * 2)).trim();
  return source
    .slice(Math.max(0, index - radius), Math.min(source.length, index + String(needle || "").length + radius))
    .replace(/\s+/g, " ")
    .trim();
}

function firstPatternExcerpt(text, patterns, radius = 140) {
  const source = String(text || "");
  for (const pattern of Array.isArray(patterns) ? patterns : []) {
    const match = pattern.exec(source);
    if (!match) continue;
    return source
      .slice(Math.max(0, match.index - radius), Math.min(source.length, match.index + match[0].length + radius))
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
}

function addRenderedLeakViolation(violations, { code, severity = "high", category = "report_contract", message, evidence, blocksCustomerDelivery = true }) {
  addViolation(violations, {
    code,
    severity,
    category,
    message,
    evidence,
    blocks_customer_delivery: blocksCustomerDelivery,
    blocks_public_sample: true,
    blocks_high_value_outreach: true,
  });
}

function windowAfter(text, pattern, chars = 1400) {
  const match = pattern.exec(text);
  if (!match) return "";
  return text.slice(match.index, match.index + chars);
}

function subsectionAfter(text, pattern, stopPatterns = [], chars = 1400) {
  const raw = windowAfter(text, pattern, chars);
  if (!raw) return "";
  let end = raw.length;
  for (const stopPattern of stopPatterns) {
    const match = stopPattern.exec(raw);
    if (match && match.index > 0 && match.index < end) end = match.index;
  }
  return raw.slice(0, end);
}

function firstTableAfterHeading(html, headingPattern) {
  const source = String(html || "");
  const headingMatch = headingPattern.exec(source);
  if (!headingMatch) return "";
  const slice = source.slice(headingMatch.index);
  const tableMatch = /<table\b[\s\S]*?<\/table>/i.exec(slice);
  if (!tableMatch) return "";
  return stripHtml(tableMatch[0]);
}

function primaryPressurePointLine(text) {
  const match = /Primary Pressure Point\s*:?\s*([^\n]+)/i.exec(text);
  return match ? match[0].trim() : "";
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
  const rawHtml = String(html || "");
  const text = stripHtml(html);
  const lower = text.toLowerCase();
  const violations = [];
  const totalUnits = extractLabeledNumber(text, ["Total Units"]);
  const annualMarketRentTotal = extractLabeledNumber(text, [
    "Annual Market Rent (Total)",
    "Annual Market Rent (100% Occupancy)",
    "Annual Market Rent",
  ]);
  const weightedAvgMarketRent = extractLabeledNumber(text, [
    "Weighted Avg Market Rent",
    "Avg Market Rent",
  ]);
  const annualInPlaceRentTotal = extractLabeledNumber(text, [
    "Annual In-Place Rent (Total)",
    "Annual In-Place Rent",
  ]);
  const weightedAvgInPlaceRent = extractLabeledNumber(text, [
    "Weighted Avg In-Place Rent",
    "Avg In-Place Rent",
    "Average In-Place Rent",
  ]);
  const impliedAvgMarketRent =
    Number.isFinite(totalUnits) && totalUnits > 0 && Number.isFinite(annualMarketRentTotal)
      ? annualMarketRentTotal / 12 / totalUnits
      : null;
  const impliedAvgInPlaceRent =
    Number.isFinite(totalUnits) && totalUnits > 0 && Number.isFinite(annualInPlaceRentTotal)
      ? annualInPlaceRentTotal / 12 / totalUnits
      : null;

  const reportTypeIsScreeningReport = reportTypeIsScreening(reportType, reportTier);
  const reportTypeLabel = reportTypeIsScreeningReport ? "screening" : "underwriting";

  const leakProbeExcerpt = firstPatternExcerpt(text, [
    /\bDATA NOT AVAILABLE\b/i,
    /\bN\/A\b/i,
    /\bundefined\b/i,
    /\bnull\b/i,
    /\bNaN\b/i,
    /\[object Object\]/i,
    /\{\{[^}]+\}\}/,
    /__TOKEN__[A-Z0-9_]*__/i,
    /%%[A-Z0-9_]+%%/i,
  ]);
  const hasDealScorecardDscrPlaceholder =
    /Deal Scorecard[\s\S]{0,600}?Current Debt DSCR[\s\S]{0,120}?(?:DATA NOT AVAILABLE|N\/A|undefined|null|NaN|\[object Object\])/i.test(text) ||
    /Current Debt DSCR[\s\S]{0,120}?(?:DATA NOT AVAILABLE|N\/A|undefined|null|NaN|\[object Object\])/i.test(text) ||
    /DSCR[\s\S]{0,120}?(?:DATA NOT AVAILABLE|N\/A|undefined|null|NaN|\[object Object\])/i.test(text);
  const hasMetricNaPlaceholder =
    /\b(?:DSCR|NOI|IRR|Cap Rate|Occupancy|Rent|Score|Value|Return|LTV|ROI|payback)\b[\s\S]{0,60}\bN\/A\b/i.test(text);
  const hasTemplateTokenLeak =
    /\{\{[^}]+\}\}|__TOKEN__|__[_A-Z0-9]+__|%%[A-Z0-9_]+%%/i.test(text);
  const hasMojibakeLeak =
    /â€|Â|â€¢|â†’|â€”|â€“|â€œ|â€|Ã[\x80-\xBF]/i.test(text);
  const hasPublicLanguageLeak =
    containsProhibitedPublicLanguage(text) ||
    /\b(?:AI|OpenAI|LLM|model-generated|vendor-generated|investment advice|investment recommendation)\b/i.test(text) ||
    /\bguaranteed\b|\brisk-free\b|\berror-free\b|\bcertain return\b/i.test(text);
  const hasInternalDebugLeak =
    /\badmin review\b/i.test(text) ||
    /\bQA manager\b/i.test(text) ||
    /\bQA director\b/i.test(text) ||
    /\bparser\b/i.test(text) ||
    /\bartifact\b/i.test(text) ||
    /\binternal QA\b/i.test(text) ||
    /\binternal debug\b/i.test(text) ||
    /\binternal parser\b/i.test(text) ||
    /\binternal artifact\b/i.test(text) ||
    /\bworker_event\b/i.test(text) ||
    /\bdelivery_gate\b/i.test(text);
  const hasScreeningLeakInUnderwriting =
    !reportTypeIsScreeningReport &&
    /\b(?:Screening|Insufficient Data)\b/i.test(text);
  const hasUnderwritingLeakInScreening =
    reportTypeIsScreeningReport &&
    /\b(?:Debt Structure|Current Debt Coverage|Refinance Stability Classification|Discounted Cash Flow|DCF|Deal Scorecard|Advanced Modeling|Final Recommendation|Renovation Strategy)\b/i.test(text);

  if (hasDealScorecardDscrPlaceholder) {
    addRenderedLeakViolation(violations, {
      code: "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
      severity: "high",
      message: "Deal Scorecard renders a stale placeholder for current debt DSCR.",
      evidence: { excerpt: firstPatternExcerpt(text, [/Deal Scorecard[\s\S]{0,600}?Current Debt DSCR[\s\S]{0,120}?(?:DATA NOT AVAILABLE|N\/A|undefined|null|NaN|\[object Object\])/i]) || leakProbeExcerpt },
    });
  } else if (/\bDATA NOT AVAILABLE\b/i.test(text)) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
      severity: "high",
      message: "Rendered report contains stale DATA NOT AVAILABLE placeholder text.",
      evidence: { excerpt: firstPatternExcerpt(text, [/\bDATA NOT AVAILABLE\b/i]) || leakProbeExcerpt },
    });
  }
  if (hasMetricNaPlaceholder) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_PLACEHOLDER_METRIC_VALUE",
      severity: "high",
      message: "Rendered report uses N/A as a metric value where a clean omission or disclosure is required.",
      evidence: { excerpt: firstPatternExcerpt(text, [/\bN\/A\b/i]) || leakProbeExcerpt },
    });
  }
  if (/\bundefined\b/i.test(text) || /\bnull\b/i.test(text) || /\bNaN\b/i.test(text) || /\[object Object\]/i.test(text)) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_PLACEHOLDER_VALUE_LEAK",
      severity: "high",
      message: "Rendered report contains raw placeholder value leakage.",
      evidence: { excerpt: leakProbeExcerpt },
    });
  }
  if (hasTemplateTokenLeak) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_TEMPLATE_TOKEN_LEAK",
      severity: "high",
      message: "Rendered report contains unresolved template token remnants.",
      evidence: { excerpt: leakProbeExcerpt },
    });
  }
  if (hasMojibakeLeak) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_MOJIBAKE_LEAK",
      severity: "high",
      message: "Rendered report contains mojibake or encoding garbage.",
      evidence: { excerpt: leakProbeExcerpt },
    });
  }
  if (hasPublicLanguageLeak) {
    addRenderedLeakViolation(violations, {
      code: "PUBLIC_LANGUAGE_CONTRACT_VIOLATION",
      severity: "critical",
      category: "public_language",
      message: "Rendered report contains prohibited public language.",
      evidence: { excerpt: leakProbeExcerpt },
      blocksCustomerDelivery: true,
    });
  }
  if (hasInternalDebugLeak) {
    addRenderedLeakViolation(violations, {
      code: "INTERNAL_DEBUG_LANGUAGE_LEAK",
      severity: "high",
      message: "Rendered report contains internal or debug language that should not appear in customer-facing output.",
      evidence: { excerpt: leakProbeExcerpt },
    });
  }
  if (hasScreeningLeakInUnderwriting || hasUnderwritingLeakInScreening) {
    addRenderedLeakViolation(violations, {
      code: "REPORT_TYPE_SECTION_LEAK",
      severity: "high",
      message: "Rendered report contains section labels that conflict with the report type.",
      evidence: { report_type: reportTypeLabel, excerpt: leakProbeExcerpt },
    });
  }

  if (
    materiallyDifferent(impliedAvgMarketRent, weightedAvgMarketRent) ||
    materiallyDifferent(impliedAvgInPlaceRent, weightedAvgInPlaceRent)
  ) {
    addViolation(violations, {
      code: "INTERNAL_RENT_ROLL_TOTAL_CONTRADICTION",
      severity: "high",
      category: "report_contract",
      message: "Rent roll annual totals do not reconcile to the displayed weighted average rents.",
      evidence: {
        total_units: Number.isFinite(totalUnits) ? totalUnits : null,
        annual_market_rent_total: Number.isFinite(annualMarketRentTotal) ? annualMarketRentTotal : null,
        weighted_avg_market_rent: Number.isFinite(weightedAvgMarketRent) ? weightedAvgMarketRent : null,
        implied_avg_market_rent: Number.isFinite(impliedAvgMarketRent) ? impliedAvgMarketRent : null,
        annual_in_place_rent_total: Number.isFinite(annualInPlaceRentTotal) ? annualInPlaceRentTotal : null,
        weighted_avg_in_place_rent: Number.isFinite(weightedAvgInPlaceRent) ? weightedAvgInPlaceRent : null,
        implied_avg_in_place_rent: Number.isFinite(impliedAvgInPlaceRent) ? impliedAvgInPlaceRent : null,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }

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

  const tableStopPatterns = [
    /Expense Ratio Sensitivity/i,
    /Expense Composition/i,
    /NOI Sensitivity/i,
    /Break[- ]?even/i,
    /Operating Statement/i,
    /Data Coverage/i,
    /Scenario Analysis/i,
    /Top Expense Drivers/i,
    /Expense Drivers/i,
  ];
  const incomeWindow = firstTableAfterHeading(rawHtml, /Top Positive Income Lines|Top Income Drivers/i);
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

  const currentDebtDscrValues = extractCurrentDebtDscrValues(text);
  if (currentDebtDscrValues.length >= 2) {
    const numericValues = currentDebtDscrValues.map((entry) => entry.value).filter((value) => Number.isFinite(value));
    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    if (maxValue - minValue > 0.05) {
      addViolation(violations, {
        code: "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH",
        severity: "high",
        category: "source_report_reconciliation",
        message: "Current-debt DSCR values disagree across rendered report sections.",
        evidence: {
          rendered_values: currentDebtDscrValues,
          min_value: minValue,
          max_value: maxValue,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }

  const expenseWindow = subsectionAfter(text, /Top Expense Drivers|Top 3 Expense Drivers|Expense Drivers/i, tableStopPatterns);
  if (expenseWindow) {
    const badExpenseLabel =
      /\b(?:Total Operating Expenses|Total Expenses|subtotal|total|Effective Gross Income|EGI|Gross Potential Rent|GPR|NOI)\b/i.test(expenseWindow);
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
  const hasCurrentDebtTermsSupport =
    Boolean(sourceReportCoverageQa?.artifact_inventory?.mortgage_statement_parsed?.present) ||
    Boolean(sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed?.present) ||
    hasTrueCurrentDebt(artifacts, sourceReportCoverageQa);
  if (derivedAcq && !currentDebt) {
    const cleanCurrentDebtLimitation =
      /Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(text) ||
      /Current Debt DSCR[\s\S]{0,180}(?:current outstanding debt balance not provided|current debt service is not assessed|NOT ASSESSED)/i.test(text) ||
      /current debt service is not assessed because no current outstanding debt balance was provided/i.test(text);
    const hasSeparation =
      /Proposed Acquisition Debt Sizing/i.test(text) &&
      /Derived Acquisition Loan Amount/i.test(text) &&
      /Proposed Acquisition DSCR/i.test(text) &&
      /not current outstanding debt/i.test(text) &&
      /not used as (?:a )?current refinance debt balance/i.test(text);
    const contaminated =
      (/DSCR Sensitivity|Refinance Stress Test|Current Debt Coverage|Full Refinance Sufficiency/i.test(text) && !cleanCurrentDebtLimitation) ||
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current outstanding debt balance not provided|current debt service is not assessed)[0-9.]+x/i.test(text) ||
      /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i.test(text) ||
      /Refinance Proceeds\s*\/\s*Debt Balance/i.test(text) ||
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
      /Renovation (?:ROI|Return)|value-add return|payback analysis|rent lift|phasing|implementation schedule/i.test(text) &&
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

  if (!currentDebt || !hasCurrentDebtTermsSupport) {
    const currentDebtUnsupported =
      /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i.test(text) ||
      /Current Debt DSCR[\s\S]{0,120}?(?:0\/10|Debt terms not provided)/i.test(text) ||
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current outstanding debt balance not provided|current debt service is not assessed)[0-9.]+x/i.test(text);
    if (currentDebtUnsupported) {
      addViolation(violations, {
        code: "UNSUPPORTED_CURRENT_DEBT_RENDERED",
        severity: "critical",
        category: "section_gating_contract",
        message: "Current debt analysis rendered without true current debt balance support.",
        evidence: {
          current_debt_balance_present: false,
          current_debt_terms_present: hasCurrentDebtTermsSupport,
          excerpt: firstPatternExcerpt(text, [
            /Current Debt DSCR[\s\S]{0,120}?(?:0\/10|Debt terms not provided)/i,
            /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current outstanding debt balance not provided|current debt service is not assessed)[0-9.]+x/i,
            /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i,
          ]),
        },
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

  const pressureWindow = primaryPressurePointLine(text);
  const dscrMatch = /\bDSCR\b[^0-9]{0,30}([0-9]+(?:\.[0-9]+)?)x/i.exec(pressureWindow);
  const dscrValue = dscrMatch ? Number(dscrMatch[1]) : null;
  if (
    pressureWindow &&
    (Number.isFinite(dscrValue)
      ? dscrValue >= 1.35
      : (
        /Expense Ratio[^0-9]{0,30}(?:[0-4]?\d(?:\.\d)?|5[0-4](?:\.\d)?)%/i.test(pressureWindow) ||
        /NOI Margin[^0-9]{0,30}(?:4[6-9](?:\.\d)?|[5-9]\d(?:\.\d)?)%/i.test(pressureWindow) ||
        /Occupancy[^0-9]{0,30}(?:9[1-9](?:\.\d)?|100(?:\.0)?)%/i.test(pressureWindow) ||
        /Break[- ]?even Occupancy[^0-9]{0,30}(?:[0-6]?\d(?:\.\d)?)%/i.test(pressureWindow)
      )) &&
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
  extractLabeledNumber,
  materiallyDifferent,
  hasDerivedAcquisitionDebt,
  hasTrueCurrentDebt,
  hasStructuredRenovation,
};
