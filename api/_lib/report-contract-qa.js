import { containsProhibitedPublicLanguage } from "./investoriq-qa-doctrine.js";

import { buildCurrentDebtAssessmentState, hasCurrentDebtSemanticState } from "./report-surface-contracts.js";

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

function latestPayloads(artifacts, type) {
  return (Array.isArray(artifacts) ? artifacts : [])
    .filter((row) => row?.type === type)
    .map((row) => (row?.payload && typeof row.payload === "object" ? row.payload : null))
    .filter(Boolean);
}

function resolveLoanTermSheetPayloads(artifacts, sourceReportCoverageQa = null) {
  const allLoanPayloads = latestPayloads(artifacts, "loan_term_sheet_parsed");
  if (allLoanPayloads.length === 0) {
    return { currentDebtLoan: null, acquisitionLoan: null };
  }

  const scored = allLoanPayloads.map((loan, index) => {
    const role = String(loan?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(loan?.debt_basis || "").trim().toLowerCase();
    const hasCurrentBalance =
      positive(loan?.outstanding_balance) ||
      positive(loan?.current_outstanding_balance) ||
      positive(loan?.current_loan_balance);
    const hasCurrentDebtTerms =
      positive(loan?.interest_rate) ||
      positive(loan?.amortization_years) ||
      positive(loan?.amort_years) ||
      positive(loan?.monthly_payment) ||
      positive(loan?.annual_debt_service) ||
      positive(loan?.ltv);
    const currentDebtRole = ["current_mortgage_statement", "current_debt_terms", "mortgage_statement", "loan_term_sheet", ""].includes(role);
    const acquisitionSignal =
      positive(loan?.purchase_price) ||
      positive(loan?.going_in_cap_rate) ||
      positive(loan?.derived_acquisition_loan_amount) ||
      role === "purchase_assumptions" ||
      role.includes("acquisition") ||
      role.includes("appraisal") ||
      debtBasis.includes("acquisition");

    const currentDebtScore =
      (hasCurrentBalance ? 400 : 0) +
      (currentDebtRole ? 150 : 0) +
      (hasCurrentDebtTerms ? 40 : 0) -
      (acquisitionSignal && !hasCurrentBalance ? 80 : 0) -
      (debtBasis.includes("acquisition") ? 80 : 0);
    const acquisitionScore =
      (acquisitionSignal ? 260 : 0) +
      (positive(loan?.derived_acquisition_loan_amount) ? 100 : 0) +
      (role === "purchase_assumptions" ? 100 : 0) +
      (debtBasis.includes("acquisition") ? 100 : 0);
    return { loan, index, currentDebtScore, acquisitionScore };
  });

  const currentDebtLoan = [...scored]
    .sort((a, b) => b.currentDebtScore - a.currentDebtScore || a.index - b.index)[0]?.loan || null;
  const acquisitionLoan = [...scored]
    .sort((a, b) => b.acquisitionScore - a.acquisitionScore || a.index - b.index)[0]?.loan || currentDebtLoan;

  // Prefer inventory-level acquisition support when coverage already resolved it.
  const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  const invAcq = invLoan?.acquisition_support;
  const acquisitionLoanFromInventory = invAcq
    ? {
        purchase_price: invAcq.purchase_price,
        derived_acquisition_loan_amount: invAcq.derived_acquisition_loan_amount,
        debt_basis: invAcq.debt_basis,
        semantic_doc_role: invAcq.semantic_doc_role,
      }
    : null;

  return {
    currentDebtLoan,
    acquisitionLoan: acquisitionLoanFromInventory || acquisitionLoan,
  };
}

function positive(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasCurrentDebtNotAssessedPhrase(text) {
  const source = String(text || "");
  return (
    /Current debt balance not provided/i.test(source) ||
    /No current debt document provided/i.test(source) ||
    /Current outstanding debt balance not provided/i.test(source) ||
    /Current debt terms were not fully provided/i.test(source) ||
    /Current debt service not assessed/i.test(source) ||
    /Current debt service is not assessed/i.test(source) ||
    /current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(source) ||
    /Proposed acquisition financing was modeled separately where validated/i.test(source)
    ||
    /Current-debt DSCR and refinance capacity were not assessed because no current outstanding debt balance was verified/i.test(source)
  );
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

function extractSourceReconciliationVarianceValues(text) {
  const source = String(text || "");
  const values = [];
  const pushValue = (label, rawValue) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    values.push({ label, value: Math.round(value * 100) / 100 });
  };

  const patterns = [
    {
      label: "Rent Roll vs T12 GPR Variance",
      pattern: /Rent Roll vs T12 GPR Variance[^0-9+\-]{0,80}([+\-]?\d+(?:\.\d+)?)%/i,
    },
    {
      label: "Rent roll annualized rent is",
      pattern: /Rent roll annualized rent is[^0-9+\-]{0,80}([+\-]?\d+(?:\.\d+)?)%\s*(?:vs|higher than|lower than)\s*T12 GPR/i,
    },
  ];

  for (const { label, pattern } of patterns) {
    const match = pattern.exec(source);
    if (match) pushValue(label, match[1]);
  }
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
    customer_delivery_impact: violation.customer_delivery_impact || null,
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

function addRenderedLeakViolation(violations, {
  code,
  severity = "high",
  category = "report_contract",
  message,
  evidence,
  blocksCustomerDelivery = true,
  customerDeliveryImpact = null,
}) {
  addViolation(violations, {
    code,
    severity,
    category,
    message,
    evidence,
    customer_delivery_impact: customerDeliveryImpact,
    blocks_customer_delivery: blocksCustomerDelivery,
    blocks_public_sample: true,
    blocks_high_value_outreach: true,
  });
}

function isDiscloseOnlyReconciliationState(state) {
  if (!state || typeof state !== "object") return false;
  const bucket = String(state?.publishability_bucket || "").trim().toLowerCase();
  const impact = String(state?.customer_delivery_impact || "").trim().toLowerCase();
  if (bucket === "disclose_only_publishable") return true;
  if (impact === "disclose_only") return true;
  if (["block", "blocked", "customer_blocked", "customer_delivery_blocked", "customer_delivery_blocker"].includes(impact)) return false;
  if (["user_needs_documents", "admin_review_required", "system_contract_failure"].includes(bucket)) return false;
  return String(state?.status || "") === "source_reconciliation_required";
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
  return tableMatch[0];
}

function tableRowsFromHtml(tableHtml) {
  const raw = String(tableHtml || "");
  const rowMatches = raw.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  return rowMatches.map((rowHtml) => ({
    html: rowHtml,
    text: stripHtml(rowHtml).replace(/\s+/g, " ").trim(),
  }));
}

function hasMeaningfulTableBodyRows(tableHtml) {
  const raw = String(tableHtml || "");
  if (!raw) return false;
  const rowMatches = raw.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  const placeholderPatterns = [
    /^(?:no data|data not available|n\/a|not available|none|—|–|-)\.?$/i,
    /^no\s+(?:expense|income)?\s*(?:drivers?|lines?|rows?|items?)$/i,
    /^no\s+meaningful\s+(?:rows?|data)$/i,
    /^placeholder(?:\s+row)?$/i,
  ];
  return rowMatches.some((row) => {
    const tdCells = row.match(/<td\b[\s\S]*?<\/td>/gi) || [];
    if (tdCells.length === 0) return false;
    const cellTexts = tdCells
      .map((cell) => stripHtml(cell).replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (cellTexts.length === 0) return false;
    const meaningfulCell = cellTexts.some((cellText) => {
      if (placeholderPatterns.some((pattern) => pattern.test(cellText))) return false;
      return /[A-Za-z0-9]/.test(cellText);
    });
    return meaningfulCell;
  });
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
  const currentDebtState = sourceReportCoverageQa?.current_debt_state;
  if (currentDebtState && currentDebtState.has_true_current_debt_balance === true) {
    return true;
  }
  const { currentDebtLoan: loan } = resolveLoanTermSheetPayloads(artifacts, sourceReportCoverageQa);
  const mortgage = latestPayload(artifacts, "mortgage_statement_parsed");
  const invMortgage = sourceReportCoverageQa?.artifact_inventory?.mortgage_statement_parsed;
  const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  const loanSemanticRole = String(
    invLoan?.semantic_doc_role || loan?.semantic_doc_role || ""
  ).trim().toLowerCase();
  const loanDebtBasis = String(
    loan?.debt_basis || invLoan?.debt_basis || ""
  ).trim().toLowerCase();
  const loanOutstandingBalance = Number(
    loan?.outstanding_balance ?? loan?.current_outstanding_balance ?? loan?.current_loan_balance ?? NaN
  );
  const loanHasCurrentDebtSignal =
    Number.isFinite(loanOutstandingBalance) && loanOutstandingBalance > 0 ||
    (
      Boolean(invLoan?.has_balance) &&
      ["loan_term_sheet", "mortgage_statement", "current_mortgage_statement", "current_debt_terms", ""].includes(loanSemanticRole)
    );
  const loanAcquisitionOnlySignal =
    loanDebtBasis.includes("acquisition") ||
    loanSemanticRole === "purchase_assumptions" ||
    (
      Boolean(invLoan?.has_derived_acquisition_debt) &&
      Boolean(invLoan?.has_purchase_price) &&
      !(Number.isFinite(loanOutstandingBalance) && loanOutstandingBalance > 0)
    );
  return Boolean(
    positive(mortgage?.outstanding_balance) ||
    invMortgage?.has_balance ||
    (loanHasCurrentDebtSignal && !loanAcquisitionOnlySignal)
  );
}

function hasDerivedAcquisitionDebt(artifacts, sourceReportCoverageQa) {
  const { acquisitionLoan: loan } = resolveLoanTermSheetPayloads(artifacts, sourceReportCoverageQa);
  const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed;
  const invAcq = invLoan?.acquisition_support || null;
  return Boolean(
    positive(loan?.derived_acquisition_loan_amount) ||
    positive(loan?.purchase_price) ||
    loan?.debt_basis === "acquisition_financing_assumption" ||
    invAcq?.has_derived_acquisition_debt ||
    invAcq?.has_purchase_price ||
    invLoan?.has_derived_acquisition_debt ||
    invLoan?.has_purchase_price
  );
}

function normalizePercentForComparison(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed > 1 ? parsed / 100 : parsed;
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
  const t12Payload = latestPayload(artifacts, "t12_parsed") || null;
  const currentDebtState =
    sourceReportCoverageQa?.current_debt_state ||
    buildCurrentDebtAssessmentState({
      artifacts,
      sourceReportCoverageQa,
      t12Noi: t12Payload?.net_operating_income,
    });
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
  const safeCurrentDebtLimitationState =
    currentDebtState?.current_debt_dscr_status !== "computed" &&
    Boolean(currentDebtState?.current_debt_limitation_reason_code);
  const hasSemanticCurrentDebtState = hasCurrentDebtSemanticState(currentDebtState);
  const currentDebtNotAssessedPhrase =
    !hasSemanticCurrentDebtState &&
    (
      /Current Debt DSCR[\s\S]{0,180}(?:Not assessed|NOT ASSESSED)[\s\S]{0,180}(?:current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)/i.test(text) ||
      /Current Debt DSCR[\s\S]{0,180}(?:current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)[\s\S]{0,180}(?:Not assessed|NOT ASSESSED)/i.test(text)
    );
  const dealScorecardTable = firstTableAfterHeading(rawHtml, /Deal Scorecard/i);
  const dealScorecardRows = tableRowsFromHtml(dealScorecardTable);
  const dealScorecardDscrRows = dealScorecardRows.filter((row) =>
    /\b(?:Current Debt DSCR|DSCR \(Current Debt\))\b/i.test(row.text)
  );
  const dscrPlaceholderTokenPattern = /(?:DATA NOT AVAILABLE|N\/A|Not modeled|undefined|null|NaN|\[object Object\])/i;
  const dscrNoDebtLanguagePattern = /(?:current debt balance not provided|no current debt document provided|no verified current debt document|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed|no true current debt balance was verified)/i;
  const dscrNotAssessedPattern = /\b(?:Not assessed|NOT ASSESSED)\b/i;
  const dscrFiniteValuePattern = /\b\d+(?:\.\d+)?x\b/i;
  const hasDealScorecardDscrPlaceholder =
    !(
      safeCurrentDebtLimitationState ||
      currentDebtNotAssessedPhrase
    ) &&
    dealScorecardDscrRows.some((row) => {
      const rowText = String(row?.text || "");
      const hasFiniteDscrValue = dscrFiniteValuePattern.test(rowText);
      const hasPlaceholderToken = dscrPlaceholderTokenPattern.test(rowText);
      const hasNoDebtLanguage = dscrNoDebtLanguagePattern.test(rowText);
      const hasNotAssessedLanguage = dscrNotAssessedPattern.test(rowText);
      const hasStaleLanguage = hasPlaceholderToken || hasNoDebtLanguage || hasNotAssessedLanguage;
      if (!hasStaleLanguage) return false;
      if (hasFiniteDscrValue && !hasNoDebtLanguage && !hasNotAssessedLanguage) return false;
      return true;
    });
  const hasMetricNaPlaceholder =
    /\b(?:DSCR|NOI|IRR|Cap Rate|Occupancy|Rent|Score|Value|Return|LTV|ROI|payback)\b[\s\S]{0,60}\bN\/A\b/i.test(text);
  const hasTemplateTokenLeak =
    /\{\{[^}]+\}\}|__TOKEN__|__[_A-Z0-9]+__|%%[A-Z0-9_]+%%/i.test(text);
  const hasMojibakeLeak =
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B\u200C\u200D\u2060\uFEFF\uFFFD\uFFFE\uFFFF]/.test(text) ||
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
  const hasComputedCurrentDebtState = String(currentDebtState?.current_debt_dscr_status || "").toLowerCase() === "computed";
  const hasStaleMissingDebtCopy =
    /SOURCE-CONSTRAINED DEBT NOT PROVIDED|DEBT NOT PROVIDED|No verified current debt document was provided|No current debt document provided|Not assessed - no current debt document|current-debt DSCR and refinance capacity were not assessed|no true current debt balance was verified/i.test(text);

  if (hasDealScorecardDscrPlaceholder) {
    addRenderedLeakViolation(violations, {
      code: "DEAL_SCORECARD_STALE_DSCR_PLACEHOLDER",
      severity: "high",
      message: "Deal Scorecard renders a stale placeholder for current debt DSCR.",
      customerDeliveryImpact: "disclose_only",
      blocksCustomerDelivery: false,
      evidence: {
        excerpt:
          dealScorecardDscrRows[0]?.html ||
          firstPatternExcerpt(dealScorecardTable, [/\b(?:Current Debt DSCR|DSCR \(Current Debt\))\b[\s\S]{0,160}?(?:DATA NOT AVAILABLE|N\/A|Not modeled|undefined|null|NaN|\[object Object\]|Not assessed|NOT ASSESSED|current debt balance not provided|no current debt document provided|no verified current debt document|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed|no true current debt balance was verified)/i]) ||
          leakProbeExcerpt,
      },
    });
  } else if (/\bDATA NOT AVAILABLE\b/i.test(text)) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_DATA_NOT_AVAILABLE_PLACEHOLDER",
      severity: "high",
      message: "Rendered report contains stale DATA NOT AVAILABLE placeholder text.",
      customerDeliveryImpact: "disclose_only",
      blocksCustomerDelivery: false,
      evidence: { excerpt: firstPatternExcerpt(text, [/\bDATA NOT AVAILABLE\b/i]) || leakProbeExcerpt },
    });
  }
  if (hasMetricNaPlaceholder) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_PLACEHOLDER_METRIC_VALUE",
      severity: "high",
      message: "Rendered report uses N/A as a metric value where a clean omission or disclosure is required.",
      customerDeliveryImpact: "disclose_only",
      blocksCustomerDelivery: false,
      evidence: { excerpt: firstPatternExcerpt(text, [/\bN\/A\b/i]) || leakProbeExcerpt },
    });
  }
  if (/\bundefined\b/i.test(text) || /\bnull\b/i.test(text) || /\bNaN\b/i.test(text) || /\[object Object\]/i.test(text)) {
    addRenderedLeakViolation(violations, {
      code: "RENDERED_PLACEHOLDER_VALUE_LEAK",
      severity: "high",
      message: "Rendered report contains raw placeholder value leakage.",
      customerDeliveryImpact: "disclose_only",
      blocksCustomerDelivery: false,
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
  const supportDocPropertyTaxLeakMatch = /(?:phase\s*i|phase\s*1|esa|environment(?:al)?|recognized environmental condition|recognized environmental conditions|zoning|compliance|permitted use|municipal zoning)[\s\S]{0,180}(?:property tax support|structured property tax input|modeled property tax input)|(?:property tax support|structured property tax input|modeled property tax input)[\s\S]{0,180}(?:phase\s*i|phase\s*1|esa|environment(?:al)?|recognized environmental condition|recognized environmental conditions|zoning|compliance|permitted use|municipal zoning)/i.exec(text);
  if (supportDocPropertyTaxLeakMatch) {
    addViolation(violations, {
      code: "SUPPORT_DOC_TREATMENT_LABEL_CONTRACT",
      severity: "high",
      category: "compliance",
      message: "Environmental/zoning/compliance support docs are labeled as property-tax support or modeled property-tax input.",
      evidence: {
        excerpt: supportDocPropertyTaxLeakMatch[0],
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  if (hasComputedCurrentDebtState && hasStaleMissingDebtCopy) {
    addRenderedLeakViolation(violations, {
      code: "CURRENT_DEBT_COMPUTED_STALE_LIMITATION_COPY",
      severity: "high",
      message: "Rendered report contains missing-current-debt limitation copy even though canonical current debt is computed.",
      customerDeliveryImpact: "disclose_only",
      blocksCustomerDelivery: false,
      evidence: { excerpt: firstPatternExcerpt(text, [/No verified current debt document was provided|No current debt document provided|Not assessed - no current debt document|current-debt DSCR and refinance capacity were not assessed/i]) || leakProbeExcerpt },
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

  const incomeWindow = firstTableAfterHeading(rawHtml, /Top Positive Income Lines|Top Income Drivers/i);
  if (incomeWindow) {
    const incomeText = stripHtml(incomeWindow);
    const hasMeaningfulRows = hasMeaningfulTableBodyRows(incomeWindow);
    if (!hasMeaningfulRows) {
      addViolation(violations, {
        code: "TOP_POSITIVE_INCOME_LINES_EMPTY_TABLE",
        severity: "high",
        category: "table_contract",
        message: "Top Positive Income Lines renders a table header without meaningful rows.",
        evidence: { excerpt: incomeWindow.slice(0, 500) },
      });
    }
    const badIncomeLabel =
      /\b(?:Effective Gross Income|EGI|Gross Potential Rent|GPR|Total Income|Net Operating Income|NOI|subtotal|total|vacancy|loss|concession|bad debt|collection loss)\b/i.test(incomeText);
    if (badIncomeLabel || hasBadMoneyRow(incomeText)) {
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

  const canonicalSourceReconciliationVariance = Number(sourceReportCoverageQa?.source_reconciliation_state?.variance_pct);
  const renderedSourceReconciliationVarianceValues = extractSourceReconciliationVarianceValues(text);
  if (Number.isFinite(canonicalSourceReconciliationVariance) && renderedSourceReconciliationVarianceValues.length > 0) {
    const canonicalVariancePct = canonicalSourceReconciliationVariance * 100;
    const mismatchedValues = renderedSourceReconciliationVarianceValues.filter((entry) =>
      Math.abs(entry.value - canonicalVariancePct) > 0.2
    );
    if (mismatchedValues.length > 0) {
      const reconciliationState = sourceReportCoverageQa?.source_reconciliation_state || null;
      const discloseOnlyReconciliationMismatch = isDiscloseOnlyReconciliationState(reconciliationState);
      addViolation(violations, {
        code: "RENDERED_SOURCE_RECONCILIATION_VARIANCE_MISMATCH",
        severity: "high",
        category: "source_report_reconciliation",
        message: "Rendered rent roll vs T12 GPR variance disagrees with canonical source reconciliation state.",
        evidence: {
          source_reconciliation_state: reconciliationState,
          canonical_variance_pct: canonicalSourceReconciliationVariance,
          canonical_rr_annual_in_place: sourceReportCoverageQa?.source_reconciliation_state?.rr_annual_in_place ?? null,
          canonical_t12_gpr: sourceReportCoverageQa?.source_reconciliation_state?.t12_gpr ?? null,
          rendered_values: renderedSourceReconciliationVarianceValues,
          excerpt:
            firstPatternExcerpt(text, [
              /Rent Roll vs T12 GPR Variance/i,
              /Rent roll annualized rent is/i,
            ]) || leakProbeExcerpt,
        },
        customer_delivery_impact: discloseOnlyReconciliationMismatch ? "disclose_only" : "block",
        blocks_customer_delivery: !discloseOnlyReconciliationMismatch,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }

  const expenseWindow = firstTableAfterHeading(rawHtml, /Top Expense Drivers|Top 3 Expense Drivers|Expense Drivers/i);
  if (expenseWindow) {
    const expenseText = stripHtml(expenseWindow);
    const hasMeaningfulRows = hasMeaningfulTableBodyRows(expenseWindow);
    if (!hasMeaningfulRows) {
      addViolation(violations, {
        code: "TOP_EXPENSE_DRIVERS_EMPTY_TABLE",
        severity: "high",
        category: "table_contract",
        message: "Top Expense Drivers renders a table header without meaningful rows.",
        evidence: { excerpt: expenseWindow.slice(0, 500) },
      });
    }
    const badExpenseLabel =
      /\b(?:Total Operating Expenses|Total Expenses|subtotal|total|Effective Gross Income|EGI|Gross Potential Rent|GPR|NOI)\b/i.test(expenseText);
    if (badExpenseLabel || hasBadMoneyRow(expenseText, { allowNegative: true })) {
      addViolation(violations, {
        code: "TOP_EXPENSE_DRIVERS_CONTRACT",
        severity: "high",
        category: "table_contract",
        message: "Top Expense Drivers includes total, subtotal, zero, income, or NOI rows.",
        evidence: { excerpt: expenseWindow.slice(0, 500) },
      });
    }
  }

  const renovationBudgetWindow = subsectionAfter(rawHtml, /Renovation Budget Breakdown/i, [/Cost Per Unit and Execution Phasing/i, /Interpretation/i], 2600);
  if (renovationBudgetWindow) {
    const hasHeaderOnlyTable =
      /<table\b[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>\s*(?:<!--[\s\S]*?-->\s*)*<\/tbody>/i.test(renovationBudgetWindow) ||
      !/<tbody>[\s\S]*?<tr\b/i.test(renovationBudgetWindow);
    if (hasHeaderOnlyTable) {
      addViolation(violations, {
        code: "RENOVATION_BUDGET_EMPTY_TABLE",
        severity: "high",
        category: "table_contract",
        message: "Renovation Budget Breakdown renders a table header without meaningful rows.",
        evidence: { excerpt: renovationBudgetWindow.slice(0, 700) },
      });
    }
  }

  const renovationExecutionWindow = subsectionAfter(rawHtml, /Cost Per Unit and Execution Phasing/i, [/Interpretation/i], 2200);
  if (renovationExecutionWindow) {
    const hasHeaderOnlyTable =
      /<table\b[\s\S]*?<thead>[\s\S]*?<\/thead>[\s\S]*?<tbody>\s*(?:<!--[\s\S]*?-->\s*)*<\/tbody>/i.test(renovationExecutionWindow) ||
      !/<tbody>[\s\S]*?<tr\b/i.test(renovationExecutionWindow);
    if (hasHeaderOnlyTable) {
      addViolation(violations, {
        code: "RENOVATION_EXECUTION_EMPTY_TABLE",
        severity: "high",
        category: "table_contract",
        message: "Cost Per Unit and Execution Phasing renders a table header without meaningful rows.",
        evidence: { excerpt: renovationExecutionWindow.slice(0, 700) },
      });
    }
  }

  const derivedAcq = hasDerivedAcquisitionDebt(artifacts, sourceReportCoverageQa);
  const currentDebt = hasTrueCurrentDebt(artifacts, sourceReportCoverageQa);
  const { acquisitionLoan } = resolveLoanTermSheetPayloads(artifacts, sourceReportCoverageQa);
  const hasCurrentDebtTermsSupport =
    Boolean(sourceReportCoverageQa?.artifact_inventory?.mortgage_statement_parsed?.present) ||
    hasTrueCurrentDebt(artifacts, sourceReportCoverageQa) ||
    Boolean(currentDebtState?.has_current_debt_document);
  if (derivedAcq && !currentDebt) {
    const cleanCurrentDebtLimitation =
      /Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(text) ||
      (hasSemanticCurrentDebtState ? safeCurrentDebtLimitationState : /Current Debt DSCR[\s\S]{0,180}(?:current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed|NOT ASSESSED)/i.test(text)) ||
      safeCurrentDebtLimitationState ||
      hasCurrentDebtNotAssessedPhrase(text) ||
      /current debt service is not assessed because no current outstanding debt balance was provided/i.test(text);
    const hasSeparation =
      /Proposed Acquisition Debt Sizing/i.test(text) &&
      /Derived Acquisition Loan Amount/i.test(text) &&
      /Proposed Acquisition DSCR/i.test(text) &&
      /not current outstanding debt/i.test(text) &&
      /not used as (?:a )?current refinance debt balance/i.test(text);
    const contaminated =
      (/DSCR Sensitivity|Refinance Stress Test|Current Debt Coverage|Full Refinance Sufficiency/i.test(text) && !cleanCurrentDebtLimitation) ||
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)[0-9.]+x/i.test(text) ||
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
  if (acquisitionLoan && typeof acquisitionLoan === "object") {
    const acquisitionSection = subsectionAfter(
      text,
      /Proposed Acquisition Debt Sizing/i,
      [/Current Debt Coverage/i, /Deal Scorecard/i, /Risk Register/i],
      2400
    );
    const purchasePrice = Number(acquisitionLoan?.purchase_price);
    const statedLoan = Number(acquisitionLoan?.stated_acquisition_loan_amount ?? acquisitionLoan?.loan_amount);
    if (
      Number.isFinite(purchasePrice) &&
      purchasePrice > 0 &&
      Number.isFinite(statedLoan) &&
      statedLoan > 0 &&
      Math.abs(purchasePrice - statedLoan) > Math.max(100, purchasePrice * 0.02)
    ) {
      const renderedPurchaseMatch = /Purchase Price[^\n]{0,120}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i.exec(acquisitionSection);
      const renderedStatedLoanMatch = /Stated Acquisition Loan Amount[^\n]{0,120}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i.exec(acquisitionSection);
      const renderedPurchaseValue = renderedPurchaseMatch
        ? Number(String(renderedPurchaseMatch[1]).replace(/,/g, ""))
        : null;
      const renderedStatedLoanValue = renderedStatedLoanMatch
        ? Number(String(renderedStatedLoanMatch[1]).replace(/,/g, ""))
        : null;
      const badPurchaseLine =
        Number.isFinite(renderedPurchaseValue) &&
        Math.abs(renderedPurchaseValue - purchasePrice) > Math.max(100, purchasePrice * 0.02) &&
        (
          Math.abs(renderedPurchaseValue - statedLoan) <= Math.max(100, statedLoan * 0.02) ||
          (
            Number.isFinite(renderedStatedLoanValue) &&
            Math.abs(renderedPurchaseValue - renderedStatedLoanValue) <= Math.max(100, renderedStatedLoanValue * 0.02)
          )
        );
      if (badPurchaseLine) {
        addViolation(violations, {
          code: "ACQUISITION_PURCHASE_PRICE_LOAN_AMOUNT_MISMATCH_RENDERED",
          severity: "high",
          category: "debt_contract",
          message: "Rendered acquisition purchase price appears to be populated from stated loan amount.",
          evidence: { purchase_price: purchasePrice, stated_acquisition_loan_amount: statedLoan, excerpt: acquisitionSection.slice(0, 400) },
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        });
      }
    }
    const lenderFeePercent = normalizePercentForComparison(
      acquisitionLoan?.lender_fee_percent ?? acquisitionLoan?.origination_fee_percent ?? acquisitionLoan?.financing_fee_percent
    );
    if (
      Number.isFinite(lenderFeePercent) &&
      lenderFeePercent > 0 &&
      /Proposed Acquisition Debt Sizing/i.test(text) &&
      !/Lender Fee/i.test(acquisitionSection)
    ) {
      addViolation(violations, {
        code: "ACQUISITION_LENDER_FEE_OMITTED_RENDERED",
        severity: "high",
        category: "debt_contract",
        message: "Document-stated lender/origination fee was parsed but omitted in rendered acquisition section.",
        evidence: { lender_fee_percent: lenderFeePercent, excerpt: acquisitionSection.slice(0, 400) },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
    const closingCostNotes = String(acquisitionLoan?.closing_cost_notes || "").toLowerCase();
    const hasOnlyUnquantifiedClosingNotes =
      (closingCostNotes.includes("legal") || closingCostNotes.includes("appraisal") || closingCostNotes.includes("closing")) &&
      !positive(acquisitionLoan?.closing_costs_percent);
    if (hasOnlyUnquantifiedClosingNotes && /Closing Costs[^\\n]{0,40}0\.0%/i.test(acquisitionSection)) {
      addViolation(violations, {
        code: "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES",
        severity: "high",
        category: "debt_contract",
        message: "Rendered acquisition section shows Closing Costs 0.0% despite only unquantified legal/appraisal/closing notes.",
        evidence: { excerpt: firstPatternExcerpt(acquisitionSection, [/Closing Costs[^\n]{0,40}0\.0%/i]) },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
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
    const numericCurrentDebtDscrRendered =
      /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current outstanding debt balance not provided|current debt service is not assessed)[0-9.]+x/i.test(text);
    const numericT12CurrentDebtDscrRendered =
      /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i.test(text);
    const currentDebtUnsupported =
      numericT12CurrentDebtDscrRendered ||
      numericCurrentDebtDscrRendered;
    if (currentDebtUnsupported) {
      addViolation(violations, {
        code: "UNSUPPORTED_CURRENT_DEBT_RENDERED",
        severity: "critical",
        category: "section_gating_contract",
        message: "Current debt analysis rendered without true current debt balance support.",
        evidence: {
          current_debt_balance_present: false,
          current_debt_terms_present: hasCurrentDebtTermsSupport,
          current_debt_state: currentDebtState?.current_debt_dscr_status || null,
          current_debt_limitation_reason_code: currentDebtState?.current_debt_limitation_reason_code || null,
          excerpt: firstPatternExcerpt(text, [
            /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)[0-9.]+x/i,
            /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i,
          ]),
        },
        blocks_customer_delivery: true,
      });
      addViolation(violations, {
        code: "UNSUPPORTED_CURRENT_DEBT_ANALYSIS_RENDERED",
        severity: "critical",
        category: "section_gating_contract",
        message: "Numeric current-debt analysis rendered without true current debt balance support.",
        evidence: {
          current_debt_balance_present: false,
          current_debt_terms_present: hasCurrentDebtTermsSupport,
          excerpt: firstPatternExcerpt(text, [
            /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)[0-9.]+x/i,
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
