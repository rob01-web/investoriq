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

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  const hasExplicitCurrentDebtProof = (loan = {}) => {
    const role = String(loan?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(loan?.debt_basis || "").trim().toLowerCase();
    const hasCurrentBalance =
      positive(loan?.outstanding_balance) ||
      positive(loan?.current_outstanding_balance) ||
      positive(loan?.current_loan_balance);
    const currentDebtRole = [
      "current_mortgage_statement",
      "current_debt_terms",
      "mortgage_statement",
    ].includes(role);
    const neutralLoanTermRole = ["loan_term_sheet", ""].includes(role);
    const currentDebtBasis =
      /(current|existing|mortgage)/.test(debtBasis) &&
      !/acquisition|proposed|purchase/.test(debtBasis);
    return Boolean(
      (hasCurrentBalance &&
        (currentDebtRole ||
          currentDebtBasis ||
          (neutralLoanTermRole &&
            !/acquisition|proposed|purchase/.test(debtBasis)))) ||
        currentDebtRole ||
        currentDebtBasis
    );
  };
  const hasAcquisitionOnlySignals = (loan = {}) => {
    const role = String(loan?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(loan?.debt_basis || "").trim().toLowerCase();
    const hasAcquisitionTerms =
      positive(loan?.purchase_price) ||
      positive(loan?.derived_acquisition_loan_amount) ||
      positive(loan?.ltv) ||
      positive(loan?.stated_acquisition_loan_amount) ||
      role === "purchase_assumptions" ||
      role.includes("acquisition") ||
      debtBasis.includes("acquisition") ||
      debtBasis.includes("proposed") ||
      debtBasis.includes("purchase");
    return Boolean(hasAcquisitionTerms && !hasExplicitCurrentDebtProof(loan));
  };

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
    const explicitCurrentDebtProof = hasExplicitCurrentDebtProof(loan);
    const acquisitionOnlySignals = hasAcquisitionOnlySignals(loan);

    const currentDebtScore =
      (hasCurrentBalance ? 400 : 0) +
      (currentDebtRole ? 150 : 0) +
      (hasCurrentDebtTerms ? 40 : 0) -
      (acquisitionSignal && !hasCurrentBalance ? 80 : 0) -
      (debtBasis.includes("acquisition") ? 80 : 0) +
      (explicitCurrentDebtProof ? 220 : 0) -
      (acquisitionOnlySignals ? 500 : 0);
    const acquisitionScore =
      (acquisitionSignal ? 260 : 0) +
      (positive(loan?.derived_acquisition_loan_amount) ? 100 : 0) +
      (role === "purchase_assumptions" ? 100 : 0) +
      (debtBasis.includes("acquisition") ? 100 : 0);
    return { loan, index, currentDebtScore, acquisitionScore, explicitCurrentDebtProof, acquisitionOnlySignals };
  });

  const currentDebtCandidate =
    [...scored].sort((a, b) => b.currentDebtScore - a.currentDebtScore || a.index - b.index)[0] || null;
  const currentDebtLoan =
    currentDebtCandidate &&
    currentDebtCandidate.currentDebtScore > 0 &&
    currentDebtCandidate.explicitCurrentDebtProof &&
    !currentDebtCandidate.acquisitionOnlySignals
      ? currentDebtCandidate.loan
      : null;
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

function coerceNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeOccupancyRatio(value) {
  const n = coerceNumber(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 0 && n <= 1) return n;
  if (n > 1 && n <= 100) return n / 100;
  return null;
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

function extractRenderedOccupancyValues(text) {
  const source = String(text || "");
  const values = [];
  const blockedContext = /\b(?:break[- ]?even|stabilized|sensitized|buffer|stress|threshold|vacancy|market occupancy)\b/i;
  const labels = [
    "Occupancy",
    "Current Occupancy",
    "Rent Roll Occupancy",
    "Physical Occupancy",
  ];
  for (const label of labels) {
    const pattern = new RegExp(`${escapeRegExp(label)}[^0-9]{0,40}([0-9]+(?:\\.[0-9]+)?)\\s*%?`, "ig");
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const windowStart = Math.max(0, match.index - 60);
      const windowEnd = Math.min(source.length, match.index + match[0].length + 60);
      const contextWindow = source.slice(windowStart, windowEnd);
      if (blockedContext.test(contextWindow)) continue;
      const ratio = normalizeOccupancyRatio(match[1]);
      if (!Number.isFinite(ratio)) continue;
      values.push({
        label,
        value: ratio,
      });
    }
  }
  return values;
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
  const currentDebtLabelMatch = /Current Debt DSCR[^0-9]{0,80}([0-9]+(?:\.[0-9]+)?)x/i.exec(source);
  if (currentDebtLabelMatch) pushValue("Current Debt DSCR", currentDebtLabelMatch[1]);

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

function resolveCanonicalCurrentDebtStateForQa({
  sourceReportCoverageQa = null,
  artifacts = [],
} = {}) {
  const coverageAuthority = sourceReportCoverageQa?.authority_provenance || null;
  const canonicalCurrentDebtSource = String(
    coverageAuthority?.current_debt_state_source ||
    sourceReportCoverageQa?.current_debt_state_source ||
    ""
  ).toLowerCase();
  const canonicalCurrentDebtAuthoritative =
    coverageAuthority?.current_debt_state_authoritative === true ||
    canonicalCurrentDebtSource === "canonical_input";
  const canonicalStateCandidates = [
    sourceReportCoverageQa?.underwritingState?.core?.currentDebt?.assessmentState,
    sourceReportCoverageQa?.report_surface_contracts?.current_debt_state,
  ].filter((row) => row && typeof row === "object");
  const explicitCanonicalState = canonicalStateCandidates[0] || null;
  if (explicitCanonicalState) {
    return {
      source: "canonical_payload",
      state: explicitCanonicalState,
    };
  }
  const currentDebtStateMarkedFallback = canonicalCurrentDebtSource === "fallback_reconstructed";
  const currentDebtStateCandidate =
    sourceReportCoverageQa?.current_debt_state && typeof sourceReportCoverageQa.current_debt_state === "object"
      ? sourceReportCoverageQa.current_debt_state
      : null;
  if (
    currentDebtStateCandidate &&
    canonicalCurrentDebtAuthoritative &&
    !currentDebtStateMarkedFallback
  ) {
    return {
      source: "canonical_payload",
      state: currentDebtStateCandidate,
    };
  }
  if (
    sourceReportCoverageQa?.currentDebtAssessmentState &&
    typeof sourceReportCoverageQa.currentDebtAssessmentState === "object" &&
    canonicalCurrentDebtAuthoritative
  ) {
    return {
      source: "canonical_payload",
      state: sourceReportCoverageQa.currentDebtAssessmentState,
    };
  }
  return {
    source: "fallback_inferred",
    state: buildCurrentDebtAssessmentState({
      artifacts,
      sourceReportCoverageQa,
      t12Noi: latestPayload(artifacts, "t12_parsed")?.net_operating_income,
    }),
  };
}

function resolveCanonicalAcquisitionDebtSeparationTruth({
  sourceReportCoverageQa = null,
  currentDebtState = null,
} = {}) {
  const acquisitionState =
    sourceReportCoverageQa?.acquisition_assumption_state ||
    sourceReportCoverageQa?.acquisitionAssumptionState ||
    sourceReportCoverageQa?.underwritingState?.core?.acquisition?.assumptionState ||
    sourceReportCoverageQa?.report_surface_contracts?.acquisition_assumption_state ||
    null;
  const hasCanonicalAcquisitionState = Boolean(acquisitionState && typeof acquisitionState === "object");
  const hasCanonicalCurrentDebtState = Boolean(
    currentDebtState &&
      (
        currentDebtState?.current_debt_dscr_status !== undefined ||
        currentDebtState?.current_debt_assessed !== undefined
      )
  );
  if (hasCanonicalAcquisitionState || hasCanonicalCurrentDebtState) {
    const canonicalCurrentDebtComputed = String(currentDebtState?.current_debt_dscr_status || "").trim().toLowerCase() === "computed";
    const hasProposedAcquisitionFinancing = Boolean(
      acquisitionState?.has_proposed_acquisition_financing ??
      currentDebtState?.has_proposed_acquisition_financing ??
      false
    );
    const hasTrueCurrentDebtBalance = Boolean(
      currentDebtState?.has_true_current_debt_balance ??
      (canonicalCurrentDebtComputed ? true : false)
    );
    const acquisitionOnlyExclusion = Boolean(
      currentDebtState?.acquisition_only_exclusion === true ||
      String(currentDebtState?.current_debt_limitation_reason_code || "").trim() === "acquisition_only_not_current_debt"
    );
    return {
      hasCanonicalTruth: true,
      hasProposedAcquisitionFinancing,
      hasTrueCurrentDebtBalance,
      currentDebtSeparated:
        acquisitionState?.current_debt_separated === true ||
        (hasProposedAcquisitionFinancing && !hasTrueCurrentDebtBalance) ||
        acquisitionOnlyExclusion,
      source: hasCanonicalAcquisitionState ? "acquisition_assumption_state" : "current_debt_state",
    };
  }
  return {
    hasCanonicalTruth: false,
    hasProposedAcquisitionFinancing: false,
    hasTrueCurrentDebtBalance: false,
    currentDebtSeparated: false,
    source: "legacy_fallback_only",
  };
}

function resolveCanonicalAcquisitionValuesForQa({ sourceReportCoverageQa = null, fallbackLoan = null } = {}) {
  const canonicalStateCandidates = [
    sourceReportCoverageQa?.acquisition_assumption_state,
    sourceReportCoverageQa?.acquisitionAssumptionState,
    sourceReportCoverageQa?.underwritingState?.core?.acquisition?.assumptionState,
    sourceReportCoverageQa?.report_surface_contracts?.acquisition_assumption_state,
  ].filter((row) => row && typeof row === "object");
  const canonicalState = canonicalStateCandidates[0] || null;
  const canonicalSource = canonicalState ? "canonical_acquisition_state" : "legacy_artifact_fallback";
  const canonicalValues = {
    hasCanonicalAcquisitionState: Boolean(canonicalState),
    hasCanonicalAcquisitionValues: false,
    source: canonicalSource,
    purchase_price: null,
    stated_acquisition_loan_amount: null,
    derived_acquisition_loan_amount: null,
    lender_fee_percent: null,
    validated_fields: Array.isArray(canonicalState?.validated_fields) ? canonicalState.validated_fields : null,
    verified_fields: Array.isArray(canonicalState?.verified_fields) ? canonicalState.verified_fields : null,
  };

  if (canonicalState) {
    canonicalValues.purchase_price = coerceNumber(canonicalState?.purchase_price);
    canonicalValues.stated_acquisition_loan_amount = coerceNumber(
      canonicalState?.stated_acquisition_loan_amount ?? canonicalState?.loan_amount
    );
    canonicalValues.derived_acquisition_loan_amount = coerceNumber(canonicalState?.derived_acquisition_loan_amount);
    canonicalValues.lender_fee_percent = normalizePercentForComparison(
      canonicalState?.lender_fee_percent ?? canonicalState?.origination_fee_percent ?? canonicalState?.financing_fee_percent
    );
    canonicalValues.hasCanonicalAcquisitionValues = (
      Number.isFinite(canonicalValues.purchase_price) ||
      Number.isFinite(canonicalValues.stated_acquisition_loan_amount) ||
      Number.isFinite(canonicalValues.derived_acquisition_loan_amount) ||
      Number.isFinite(canonicalValues.lender_fee_percent)
    );
  }

  if (!canonicalValues.hasCanonicalAcquisitionValues) {
    canonicalValues.source = "legacy_artifact_fallback";
    canonicalValues.purchase_price = coerceNumber(fallbackLoan?.purchase_price);
    canonicalValues.stated_acquisition_loan_amount = coerceNumber(
      fallbackLoan?.stated_acquisition_loan_amount ?? fallbackLoan?.loan_amount
    );
    canonicalValues.derived_acquisition_loan_amount = coerceNumber(fallbackLoan?.derived_acquisition_loan_amount);
    canonicalValues.lender_fee_percent = normalizePercentForComparison(
      fallbackLoan?.lender_fee_percent ?? fallbackLoan?.origination_fee_percent ?? fallbackLoan?.financing_fee_percent
    );
  }

  return canonicalValues;
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

function extractDocumentTreatmentSection(rawHtml, title) {
  const source = String(rawHtml || "");
  if (!source || !title) return "";
  const headingPattern = new RegExp(
    `<p[^>]*class=["']subsection-title["'][^>]*>\\s*${escapeRegExp(title)}\\s*<\\/p>`,
    "i"
  );
  const headingMatch = headingPattern.exec(source);
  if (!headingMatch) return "";
  const after = source.slice(headingMatch.index + headingMatch[0].length);
  const stopMatch = /<p[^>]*class=["']subsection-title["'][^>]*>/i.exec(after);
  return stopMatch ? after.slice(0, stopMatch.index) : after;
}

function extractDocumentTreatmentFileNames(rawHtml, title) {
  const sectionHtml = extractDocumentTreatmentSection(rawHtml, title);
  if (!sectionHtml) return [];
  const liMatches = sectionHtml.match(/<li\b[\s\S]*?<\/li>/gi) || [];
  const names = [];
  for (const li of liMatches) {
    const text = stripHtml(li).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const name = text.split(/\s+-\s+/)[0]?.trim() || "";
    if (!name) continue;
    names.push(name.toLowerCase());
  }
  return [...new Set(names)];
}

function extractDocumentTreatmentRows(rawHtml, title) {
  const sectionHtml = extractDocumentTreatmentSection(rawHtml, title);
  if (!sectionHtml) return [];
  const liMatches = sectionHtml.match(/<li\b[\s\S]*?<\/li>/gi) || [];
  const rows = [];
  for (const li of liMatches) {
    const text = stripHtml(li).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const name = text.split(/\s+-\s+/)[0]?.trim() || "";
    if (!name) continue;
    rows.push({
      name: name.toLowerCase(),
      label: text.toLowerCase(),
      raw: text,
    });
  }
  return rows;
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

function resolveCanonicalDeliveryDecisionForQa({
  deliveryGateDecision = null,
  sourceReportCoverageQa = null,
} = {}) {
  const sourceGate = sourceReportCoverageQa?.delivery_gate_decision || null;
  const directCanonical = deliveryGateDecision?.deliveryDecisionState || null;
  const sourceCanonical = sourceGate?.deliveryDecisionState || null;
  const sourceResolved = sourceGate?.resolved_delivery_decision || null;
  if (directCanonical && typeof directCanonical === "object") {
    return { state: directCanonical, source: "deliveryDecisionState" };
  }
  if (sourceCanonical && typeof sourceCanonical === "object") {
    return { state: sourceCanonical, source: "delivery_gate_decision.deliveryDecisionState" };
  }
  if (sourceResolved && typeof sourceResolved === "object") {
    return { state: sourceResolved, source: "delivery_gate_decision.resolved_delivery_decision" };
  }
  if (deliveryGateDecision && typeof deliveryGateDecision === "object" && deliveryGateDecision.delivery_gate_status) {
    return {
      state: {
        delivery_gate_status: String(deliveryGateDecision.delivery_gate_status),
        customer_delivery_allowed: deliveryGateDecision.customer_publish_eligible ?? deliveryGateDecision.customer_delivery_ready ?? null,
        hold_delivery:
          deliveryGateDecision.hold_delivery ??
          deliveryGateDecision.holdDelivery ??
          (String(deliveryGateDecision.delivery_gate_status) !== "deliverable"),
      },
      source: "delivery_gate_decision_direct",
    };
  }
  return { state: null, source: "legacy_fallback_only" };
}

function coreCoveragePresent(sourceReportCoverageQa) {
  const inv = sourceReportCoverageQa?.artifact_inventory || {};
  return Boolean(inv?.t12_parsed?.has_core_totals && inv?.rent_roll_parsed?.present);
}

function hasCanonicalCoverageAuthority(sourceReportCoverageQa = null) {
  const coverageAuthority = sourceReportCoverageQa?.authority_provenance || null;
  const coverageSource = String(
    coverageAuthority?.coverage_state_source ||
    sourceReportCoverageQa?.coverage_state_source ||
    ""
  ).toLowerCase();
  return Boolean(
    coverageAuthority?.coverage_authoritative === true ||
    coverageAuthority?.section_eligibility_authoritative === true ||
    coverageAuthority?.sufficiency_authoritative === true ||
    coverageSource === "canonical_input"
  );
}

function inferCanonicalVerdictCapState(sourceReportCoverageQa = null) {
  const coverageAuthority = sourceReportCoverageQa?.authority_provenance || null;
  const coverageAuthorityPresent = hasCanonicalCoverageAuthority(sourceReportCoverageQa);
  const reconciliationStateSource = String(
    coverageAuthority?.source_reconciliation_state_source ||
    sourceReportCoverageQa?.source_reconciliation_state_source ||
    ""
  ).toLowerCase();
  const reconciliationAuthoritative =
    coverageAuthority?.source_reconciliation_state_authoritative === true ||
    reconciliationStateSource === "canonical_input" ||
    coverageAuthorityPresent;
  const currentDebtStateSource = String(
    coverageAuthority?.current_debt_state_source ||
    sourceReportCoverageQa?.current_debt_state_source ||
    ""
  ).toLowerCase();
  const currentDebtAuthoritative =
    coverageAuthority?.current_debt_state_authoritative === true ||
    currentDebtStateSource === "canonical_input";
  const currentDebtMarkedFallback = currentDebtStateSource === "fallback_reconstructed";
  const verdictState =
    sourceReportCoverageQa?.visible_classification_state ||
    sourceReportCoverageQa?.display_verdict_state ||
    sourceReportCoverageQa?.canonical_display_verdict_state ||
    null;
  const explicitCapReason = String(verdictState?.cap_reason_code || "").trim();
  if (explicitCapReason) {
    return {
      has_cap: true,
      cap_reason_code: explicitCapReason,
      expected_label: String(verdictState?.label || "").trim() || null,
    };
  }
  const reconciliationStatus = String(sourceReportCoverageQa?.source_reconciliation_state?.status || "").toLowerCase();
  if (
    reconciliationAuthoritative &&
    (reconciliationStatus === "source_reconciliation_required" || reconciliationStatus === "parser_suspected")
  ) {
    return {
      has_cap: true,
      cap_reason_code: "source_reconciliation_disclosure",
      expected_label: "Review - Source Reconciliation Disclosure",
    };
  }
  const currentDebtState = sourceReportCoverageQa?.current_debt_state || null;
  const debtDscr = Number(currentDebtState?.current_debt_dscr);
  if (
    currentDebtAuthoritative &&
    !currentDebtMarkedFallback &&
    currentDebtState?.current_debt_dscr_status === "computed" &&
    Number.isFinite(debtDscr) &&
    debtDscr < 1.25
  ) {
    return {
      has_cap: true,
      cap_reason_code: "debt_coverage_constraint",
      expected_label: "Review - Debt Coverage Constraint",
    };
  }
  if (
    currentDebtAuthoritative &&
    !currentDebtMarkedFallback &&
    currentDebtState?.current_debt_dscr_status === "not_assessed"
  ) {
    return {
      has_cap: true,
      cap_reason_code: "debt_coverage_not_assessed",
      expected_label: "Review - Debt Coverage Constraint",
    };
  }
  const coreBucket = String(sourceReportCoverageQa?.core_input_sufficiency_state?.publishability_bucket || "").toLowerCase();
  if (
    coverageAuthorityPresent &&
    ["user_needs_documents", "admin_review_required", "system_contract_failure"].includes(coreBucket)
  ) {
    return {
      has_cap: true,
      cap_reason_code: "insufficient_core_support",
      expected_label: "Review - Insufficient Core Support",
    };
  }
  return {
    has_cap: false,
    cap_reason_code: null,
    expected_label: null,
  };
}

function resolveCanonicalRentRollAnnualTotalsForContract({
  artifacts = [],
  sourceReportCoverageQa = null,
} = {}) {
  const rentRollPayload = latestPayload(artifacts, "rent_roll_parsed") || null;
  const totals = rentRollPayload?.totals && typeof rentRollPayload.totals === "object" ? rentRollPayload.totals : null;
  const isPartialSample = rentRollPayload?.is_partial_sample === true;
  const trustedSummaryTotals =
    totals?.summary_row_detected === true ||
    rentRollPayload?.summary_row_detected === true;
  const canonicalAnnualInPlaceCandidates = [
    sourceReportCoverageQa?.source_reconciliation_state?.rr_annual_in_place,
    rentRollPayload?.annual_in_place_rent,
    rentRollPayload?.annualized_in_place_rent,
    rentRollPayload?.total_in_place_annual,
    totals?.in_place_rent_annual,
    totals?.current_rent_annual,
    Number.isFinite(coerceNumber(totals?.in_place_rent_monthly)) ? coerceNumber(totals?.in_place_rent_monthly) * 12 : null,
    Number.isFinite(coerceNumber(totals?.current_rent_monthly)) ? coerceNumber(totals?.current_rent_monthly) * 12 : null,
  ];
  const canonicalAnnualMarketCandidates = [
    rentRollPayload?.annual_market_rent,
    rentRollPayload?.annualized_market_rent,
    rentRollPayload?.total_market_annual,
    totals?.market_rent_annual,
    Number.isFinite(coerceNumber(totals?.market_rent_monthly)) ? coerceNumber(totals?.market_rent_monthly) * 12 : null,
  ];
  const firstPositiveFinite = (values) => {
    for (const value of values) {
      const n = coerceNumber(value);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };
  return {
    annual_in_place_rent: firstPositiveFinite(canonicalAnnualInPlaceCandidates),
    annual_market_rent: firstPositiveFinite(canonicalAnnualMarketCandidates),
    is_partial_sample: isPartialSample,
    trusted_summary_totals: trustedSummaryTotals,
    rent_roll_state: sourceReportCoverageQa?.rent_roll_sufficiency_state || null,
    rent_roll_inventory: sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed || null,
  };
}

function resolveCanonicalOccupancyForContract({
  artifacts = [],
  sourceReportCoverageQa = null,
} = {}) {
  const rentRollPayload = latestPayload(artifacts, "rent_roll_parsed") || null;
  const totals = rentRollPayload?.totals && typeof rentRollPayload.totals === "object" ? rentRollPayload.totals : null;
  const invRentRoll = sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed || null;
  const rrSufficiency = sourceReportCoverageQa?.rent_roll_sufficiency_state || null;
  const occupancyCandidates = [
    invRentRoll?.occupancy,
    rrSufficiency?.occupancy,
    rrSufficiency?.evidence?.occupancy,
    rentRollPayload?.occupancy,
    totals?.occupancy,
    (Number.isFinite(coerceNumber(totals?.occupied_units)) &&
      Number.isFinite(coerceNumber(totals?.total_units)) &&
      coerceNumber(totals?.total_units) > 0)
      ? coerceNumber(totals?.occupied_units) / coerceNumber(totals?.total_units)
      : null,
  ];
  let canonicalOccupancy = null;
  for (const candidate of occupancyCandidates) {
    const normalized = normalizeOccupancyRatio(candidate);
    if (Number.isFinite(normalized) && normalized >= 0 && normalized <= 1) {
      canonicalOccupancy = normalized;
      break;
    }
  }
  const isPartialSample = rentRollPayload?.is_partial_sample === true;
  const trustedSummaryTotals =
    totals?.summary_row_detected === true ||
    rentRollPayload?.summary_row_detected === true;
  const sufficiencyNotes = Array.isArray(rrSufficiency?.notes) ? rrSufficiency.notes : [];
  const occupancyTrustedBySufficiency = sufficiencyNotes.includes("summary_totals_trusted");
  return {
    canonical_occupancy: canonicalOccupancy,
    is_partial_sample: isPartialSample,
    trusted_occupancy: trustedSummaryTotals || occupancyTrustedBySufficiency,
    rent_roll_state: rrSufficiency || null,
    rent_roll_inventory: invRentRoll || null,
  };
}

function normalizeSupportRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (!role) return null;
  if (/property[_\s-]*tax|tax[_\s-]*bill|municipal[_\s-]*tax|assessment[_\s-]*tax|property[_\s-]*tax[_\s-]*statement/.test(role)) return "property_tax";
  if (/phase[_\s-]*i|phase[_\s-]*1|esa|environment/.test(role)) return "environmental";
  if (/zoning|compliance/.test(role)) return "zoning_compliance";
  if (/market[_\s-]*survey/.test(role)) return "market_survey";
  if (/appraisal|valuation/.test(role)) return "appraisal";
  if (/background|qualitative|unmodeled|limited_support|support/.test(role)) return "qualitative_support";
  return role;
}

function collectCanonicalSupportDocs(sourceReportCoverageQa = null, artifacts = []) {
  const docs = [];
  const pushDoc = (row) => {
    if (!row || typeof row !== "object") return;
    const role = normalizeSupportRole(
      row.semantic_doc_role ||
      row.document_role ||
      row.source_role ||
      row.doc_type ||
      row.role
    );
    if (!role) return;
    const name = String(
      row.original_filename ||
      row.file_name ||
      row.filename ||
      row.name ||
      ""
    ).trim() || null;
    const treatmentText = String(
      row.treatment ||
      row.modeled_input_type ||
      row.semantic_doc_display_label ||
      ""
    ).toLowerCase();
    const explicitlyModeled =
      /structured|modeled|quantitative|underwriting input|used in modeled outputs/.test(treatmentText) &&
      !/unmodeled|qualitative|context/.test(treatmentText);
    docs.push({ role, name, explicitly_modeled: explicitlyModeled, source: row });
  };

  const supportRows = [
    ...(Array.isArray(sourceReportCoverageQa?.support_documents) ? sourceReportCoverageQa.support_documents : []),
    ...(Array.isArray(sourceReportCoverageQa?.document_treatment) ? sourceReportCoverageQa.document_treatment : []),
    ...(Array.isArray(sourceReportCoverageQa?.document_treatments) ? sourceReportCoverageQa.document_treatments : []),
  ];
  for (const row of supportRows) pushDoc(row);

  for (const artifact of Array.isArray(artifacts) ? artifacts : []) {
    const payload = artifact?.payload;
    if (!payload || typeof payload !== "object") continue;
    if (
      !payload.semantic_doc_role &&
      !payload.document_role &&
      !payload.source_role &&
      !payload.doc_type
    ) continue;
    pushDoc(payload);
  }

  const inv = sourceReportCoverageQa?.artifact_inventory || {};
  const invCandidates = [
    inv.appraisal_parsed,
    inv.property_tax_parsed,
    inv.renovation_parsed,
    inv.loan_term_sheet_parsed,
    inv.mortgage_statement_parsed,
  ];
  for (const row of invCandidates) pushDoc(row);

  return docs;
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
  qaFixRouting = null,
  deliveryGateDecision = null,
} = {}) {
  const rawHtml = String(html || "");
  const text = stripHtml(html);
  const lower = text.toLowerCase();
  const violations = [];
  const t12Payload = latestPayload(artifacts, "t12_parsed") || null;
  const canonicalCurrentDebtResolution = resolveCanonicalCurrentDebtStateForQa({
    sourceReportCoverageQa,
    artifacts,
  });
  const currentDebtState = canonicalCurrentDebtResolution.state;
  const hasCanonicalCurrentDebtState = Boolean(
    canonicalCurrentDebtResolution.source === "canonical_payload" &&
    currentDebtState &&
      (
        currentDebtState?.current_debt_dscr_status !== undefined ||
        currentDebtState?.current_debt_assessed !== undefined
      )
  );
  const sectionEligibilitySections = sourceReportCoverageQa?.section_eligibility?.sections || null;
  const debtStructureEligibility = sectionEligibilitySections?.debt_structure || null;
  const renovationEligibility = sectionEligibilitySections?.renovation_strategy || null;
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
  const screeningLeakPatternsForUnderwriting = [
    /\bDocument-Backed Screening Outputs\b/i,
    /\bInvestorIQ screening outputs are document-backed\b/i,
    /\bUnit-Level Rent Positioning\b/i,
  ];
  const underwritingLeakPatternsForScreening = [
    /\bDebt Structure\b/i,
    /\bCurrent Debt Coverage\b/i,
    /\bRefinance Stability Classification\b/i,
    /\bDiscounted Cash Flow\b/i,
    /\bDeal Scorecard\b/i,
    /\bAdvanced Modeling\b/i,
    /\bFinal Recommendation\b/i,
    /\bRenovation Strategy\b/i,
  ];
  const screeningLeakExcerptInUnderwriting = !reportTypeIsScreeningReport
    ? firstPatternExcerpt(text, screeningLeakPatternsForUnderwriting)
    : "";
  const underwritingLeakExcerptInScreening = reportTypeIsScreeningReport
    ? firstPatternExcerpt(text, underwritingLeakPatternsForScreening)
    : "";
  const hasScreeningLeakInUnderwriting = !reportTypeIsScreeningReport && Boolean(screeningLeakExcerptInUnderwriting);
  const hasUnderwritingLeakInScreening = reportTypeIsScreeningReport && Boolean(underwritingLeakExcerptInScreening);
  const hasComputedCurrentDebtState = String(currentDebtState?.current_debt_dscr_status || "").toLowerCase() === "computed";
  const hasCanonicalCurrentDebtNotComputed =
    String(currentDebtState?.current_debt_dscr_status || "").trim().length > 0 &&
    String(currentDebtState?.current_debt_dscr_status || "").toLowerCase() !== "computed";
  const hasStaleMissingDebtCopy =
    /SOURCE-CONSTRAINED DEBT NOT PROVIDED|DEBT NOT PROVIDED|No verified current debt document was provided|No current debt document provided|Not assessed - no current debt document|current-debt DSCR and refinance capacity were not assessed|no true current debt balance was verified/i.test(text);
  const coreInputBucket = String(sourceReportCoverageQa?.core_input_sufficiency_state?.publishability_bucket || "").toLowerCase();
  const reconciliationStatus = String(sourceReportCoverageQa?.source_reconciliation_state?.status || "").toLowerCase();
  const canonicalCoverageAuthorityPresent = hasCanonicalCoverageAuthority(sourceReportCoverageQa);
  const noMaterialReconciliationDisclosureActive =
    reconciliationStatus !== "source_reconciliation_required" &&
    reconciliationStatus !== "parser_suspected";
  const sourceLimitationHeadlineShown =
    /CORE INPUTS EXTRACTED\s*-\s*SOURCE LIMITATIONS DISCLOSURE/i.test(text) ||
    /(?:^|\n)\s*SOURCE LIMITATIONS DISCLOSURE(?:\s|$)/i.test(text);
  if (
    !reportTypeIsScreeningReport &&
    canonicalCoverageAuthorityPresent &&
    coreInputBucket === "core_sufficient_publishable" &&
    noMaterialReconciliationDisclosureActive &&
    sourceLimitationHeadlineShown
  ) {
    addViolation(violations, {
      code: "DATA_COVERAGE_OPTIONAL_LIMITATION_HEADLINE_DRIFT",
      severity: "high",
      category: "data_coverage_taxonomy_contract",
      message: "Data Coverage headline implies core source limitation despite clean core T12/rent roll coverage and no active source reconciliation disclosure.",
      evidence: {
        core_input_publishability_bucket: coreInputBucket,
        source_reconciliation_status: reconciliationStatus || null,
        excerpt: firstPatternExcerpt(text, [/CORE INPUTS EXTRACTED\s*-\s*SOURCE LIMITATIONS DISCLOSURE/i, /SOURCE LIMITATIONS DISCLOSURE/i]) || leakProbeExcerpt,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const hasDataCoverageHeading = /Data Coverage/i.test(text);
  const canonicalSourceConstraintExpected =
    canonicalCoverageAuthorityPresent &&
    (
      coreInputBucket === "disclose_only_publishable" ||
      coreInputBucket === "section_constrained_publishable" ||
      reconciliationStatus === "source_reconciliation_required" ||
      reconciliationStatus === "parser_suspected" ||
      Object.values(sectionEligibilitySections || {}).some((section) => section?.source_constrained === true)
    );
  const renderedSourceConstraintCopyPresent =
    /SOURCE LIMITATIONS DISCLOSURE|SOURCE RECONCILIATION DISCLOSURE|source-constrained|withheld sections|not assessed|not produced due to insufficient/i.test(text);
  if (
    !reportTypeIsScreeningReport &&
    canonicalSourceConstraintExpected &&
    hasDataCoverageHeading &&
    !renderedSourceConstraintCopyPresent
  ) {
    addViolation(violations, {
      code: "DATA_COVERAGE_CANONICAL_LIMITATION_MISSING",
      severity: "high",
      category: "data_coverage_taxonomy_contract",
      message: "Canonical coverage state requires source-limitation disclosure, but rendered Data Coverage copy appears clean and omits limitation language.",
      evidence: {
        core_input_publishability_bucket: coreInputBucket || null,
        source_reconciliation_status: reconciliationStatus || null,
        canonical_source_constrained_sections: Object.entries(sectionEligibilitySections || {})
          .filter(([, section]) => section?.source_constrained === true)
          .map(([key]) => key),
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const renderedDebtSectionHeadingPresent = /Debt Structure|Current Debt Coverage/i.test(text);
  if (
    !reportTypeIsScreeningReport &&
    debtStructureEligibility &&
    debtStructureEligibility.source_constrained === true &&
    debtStructureEligibility.omitted === true &&
    renderedDebtSectionHeadingPresent
  ) {
    addViolation(violations, {
      code: "SECTION_ELIGIBILITY_DEBT_HEADING_CONFORMANCE_DRIFT",
      severity: "high",
      category: "section_eligibility_render_contract",
      message: "Canonical section eligibility omits source-constrained debt section, but rendered output still includes debt section heading language.",
      evidence: {
        section_eligibility_debt_structure: debtStructureEligibility,
        excerpt: firstPatternExcerpt(text, [/Debt Structure/i, /Current Debt Coverage/i]) || leakProbeExcerpt,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  if (
    !reportTypeIsScreeningReport &&
    debtStructureEligibility &&
    debtStructureEligibility.rendered === true &&
    debtStructureEligibility.source_constrained !== true &&
    !renderedDebtSectionHeadingPresent
  ) {
    addViolation(violations, {
      code: "SECTION_ELIGIBILITY_DEBT_HEADING_MISSING",
      severity: "medium",
      category: "section_eligibility_render_contract",
      message: "Canonical section eligibility expects rendered debt section, but rendered heading language is missing.",
      evidence: {
        section_eligibility_debt_structure: debtStructureEligibility,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const hasComputedCurrentDebtSurface =
    /Current Debt DSCR\s*[:\n]\s*(?!Not assessed|NOT ASSESSED|current debt balance not provided|no current debt document provided|current outstanding debt balance not provided|current debt terms were not fully provided|current debt service not assessed|current debt service is not assessed)[0-9.]+x/i.test(text) ||
    /DSCR \(T12 NOI\)\s*\n?\s*[0-9.]+x/i.test(text);
  const hasCurrentDebtCoverageSurface =
    /Current Debt Coverage|DSCR Sensitivity|Full Refinance Sufficiency/i.test(text) &&
    !/current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(text);
  const hasRefiQuantitativeSurface =
    /Refinance Proceeds\s*\/\s*Debt Balance|Base Case Supportable Loan|Maximum Financing Envelope|Refinance Stability Classification\s*[:\n]\s*(?:Stable|Review|Constrained|Sensitized|Fragile|High Risk|Refinance Shortfall)/i.test(text);
  if (hasCanonicalCurrentDebtNotComputed && (hasCurrentDebtCoverageSurface || hasRefiQuantitativeSurface)) {
    addViolation(violations, {
      code: "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
      severity: "critical",
      category: "section_eligibility_render_contract",
      message: "Canonical current-debt state is not computed, but rendered output includes quantitative debt/refinance analysis surfaces.",
      evidence: {
        canonical_current_debt_state: {
          current_debt_dscr_status: currentDebtState?.current_debt_dscr_status || null,
          current_debt_assessed: currentDebtState?.current_debt_assessed ?? null,
          has_true_current_debt_balance: currentDebtState?.has_true_current_debt_balance ?? null,
          current_debt_limitation_reason_code: currentDebtState?.current_debt_limitation_reason_code || null,
          refi_basis_eligible: currentDebtState?.refi_basis_eligible ?? null,
          qa_canonical_source: canonicalCurrentDebtResolution.source,
        },
        has_current_debt_coverage_surface: hasCurrentDebtCoverageSurface,
        has_refi_quantitative_surface: hasRefiQuantitativeSurface,
        excerpt:
          firstPatternExcerpt(text, [
            /Current Debt Coverage/i,
            /DSCR Sensitivity/i,
            /Full Refinance Sufficiency/i,
            /Refinance Proceeds\s*\/\s*Debt Balance/i,
            /Maximum Financing Envelope/i,
            /Refinance Stability Classification/i,
          ]) || leakProbeExcerpt,
      },
      blocks_customer_delivery: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  if (
    !reportTypeIsScreeningReport &&
    debtStructureEligibility &&
    debtStructureEligibility.source_constrained === true &&
    debtStructureEligibility.omission_reason_code === "no_true_current_debt_source" &&
    (hasComputedCurrentDebtSurface || hasCurrentDebtCoverageSurface)
  ) {
    addViolation(violations, {
      code: "SECTION_ELIGIBILITY_CURRENT_DEBT_RENDER_DRIFT",
      severity: "high",
      category: "section_eligibility_render_contract",
      message: "Canonical section eligibility marks current debt as source-constrained, but rendered output includes computed current-debt analysis surfaces.",
      evidence: {
        section_eligibility_debt_structure: debtStructureEligibility,
        current_debt_state: currentDebtState || null,
        excerpt: firstPatternExcerpt(text, [/Current Debt DSCR/i, /Current Debt Coverage/i, /DSCR \(T12 NOI\)/i]) || leakProbeExcerpt,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const hasRefiEligibilityDrift =
    /Refinance Stability Classification\s*[:\n]\s*(?:Stable|Review|Constrained|Sensitized|Fragile|High Risk|Refinance Shortfall)/i.test(text) ||
    /Refinance Proceeds\s*\/\s*Debt Balance/i.test(text) ||
    /Refinance Stress Test|Binding Constraint/i.test(text);
  if (
    !reportTypeIsScreeningReport &&
    debtStructureEligibility &&
    debtStructureEligibility.source_constrained === true &&
    debtStructureEligibility.omission_reason_code === "no_true_current_debt_source" &&
    hasRefiEligibilityDrift &&
    !/refinance stability classification not produced due to insufficient refinance inputs|current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance/i.test(text)
  ) {
    addViolation(violations, {
      code: "SECTION_ELIGIBILITY_REFI_RENDER_DRIFT",
      severity: "high",
      category: "section_eligibility_render_contract",
      message: "Canonical section eligibility marks refinance/current-debt basis as constrained, but rendered output includes refinance classification or proceeds surfaces.",
      evidence: {
        section_eligibility_debt_structure: debtStructureEligibility,
        current_debt_state: currentDebtState || null,
        excerpt: firstPatternExcerpt(text, [/Refinance Stability Classification/i, /Refinance Proceeds/i, /Refinance Stress Test/i, /Binding Constraint/i]) || leakProbeExcerpt,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const hasRenovationModelingSurface =
    /Renovation (?:ROI|Return)|payback analysis|NOI impact|value impact|rent lift/i.test(text) &&
    !/No renovation return, rent lift, ROI, or payback analysis is modeled|not modeled as a prospective renovation strategy|no verified forward-looking/i.test(text);
  if (
    !reportTypeIsScreeningReport &&
    renovationEligibility &&
    renovationEligibility.source_constrained === true &&
    hasRenovationModelingSurface
  ) {
    addViolation(violations, {
      code: "SECTION_ELIGIBILITY_RENOVATION_RENDER_DRIFT",
      severity: "high",
      category: "section_eligibility_render_contract",
      message: "Canonical section eligibility marks renovation strategy as source-constrained, but rendered output includes forward-looking renovation modeling surfaces.",
      evidence: {
        section_eligibility_renovation_strategy: renovationEligibility,
        excerpt: firstPatternExcerpt(text, [/Renovation ROI/i, /payback analysis/i, /NOI impact/i, /value impact/i, /rent lift/i]) || leakProbeExcerpt,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const canonicalVerdictCapState = inferCanonicalVerdictCapState(sourceReportCoverageQa);
  const canonicalDeliveryResolution = resolveCanonicalDeliveryDecisionForQa({
    deliveryGateDecision,
    sourceReportCoverageQa,
  });
  const canonicalDeliveryState = canonicalDeliveryResolution.state;
  const hasCanonicalDeliveryState = Boolean(canonicalDeliveryState && typeof canonicalDeliveryState === "object");
  const readinessPayloadCandidates = hasCanonicalDeliveryState
    ? [canonicalDeliveryState]
    : [
        deliveryGateDecision,
        sourceReportCoverageQa?.delivery_gate_decision,
        qaFixRouting,
      ].filter(Boolean);

  if (hasCanonicalDeliveryState) {
    const canonicalDeliveryGateStatus = String(canonicalDeliveryState?.delivery_gate_status || "").trim().toLowerCase();
    const canonicalDeliveryAllowed =
      canonicalDeliveryState?.customer_delivery_allowed === null || canonicalDeliveryState?.customer_delivery_allowed === undefined
        ? null
        : Boolean(canonicalDeliveryState?.customer_delivery_allowed);
    const canonicalHoldDelivery =
      canonicalDeliveryState?.hold_delivery === null || canonicalDeliveryState?.hold_delivery === undefined
        ? null
        : Boolean(canonicalDeliveryState?.hold_delivery);

    const legacyDeliveryGateStatusCandidates = [
      deliveryGateDecision?.delivery_gate_status,
      sourceReportCoverageQa?.delivery_gate_decision?.delivery_gate_status,
      qaFixRouting?.delivery_gate_status,
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);
    if (
      canonicalDeliveryGateStatus &&
      legacyDeliveryGateStatusCandidates.some((value) => value !== canonicalDeliveryGateStatus)
    ) {
      addViolation(violations, {
        code: "CANONICAL_DELIVERY_GATE_STATUS_CONFLICT",
        severity: "high",
        category: "delivery_conformance_contract",
        message: "Canonical delivery gate status conflicts with legacy delivery gate status alias payloads.",
        evidence: {
          canonical_delivery_gate_status: canonicalDeliveryGateStatus,
          legacy_delivery_gate_status_candidates: legacyDeliveryGateStatusCandidates,
          canonical_delivery_source: canonicalDeliveryResolution.source,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }

    const legacyDeliveryAllowedCandidates = [
      deliveryGateDecision?.customer_publish_eligible,
      deliveryGateDecision?.customer_delivery_ready,
      sourceReportCoverageQa?.delivery_gate_decision?.customer_publish_eligible,
      sourceReportCoverageQa?.delivery_gate_decision?.customer_delivery_ready,
      qaFixRouting?.customer_publish_eligible,
      qaFixRouting?.customer_delivery_ready,
    ].filter((value) => value === true || value === false);
    if (
      canonicalDeliveryAllowed !== null &&
      legacyDeliveryAllowedCandidates.some((value) => Boolean(value) !== canonicalDeliveryAllowed)
    ) {
      addViolation(violations, {
        code: "CANONICAL_DELIVERY_ALIAS_CONFLICT",
        severity: "high",
        category: "delivery_conformance_contract",
        message: "Canonical customer delivery eligibility conflicts with legacy readiness aliases.",
        evidence: {
          canonical_customer_delivery_allowed: canonicalDeliveryAllowed,
          legacy_delivery_allowed_candidates: legacyDeliveryAllowedCandidates,
          canonical_delivery_source: canonicalDeliveryResolution.source,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }

    const legacyHoldCandidates = [
      deliveryGateDecision?.hold_delivery,
      deliveryGateDecision?.holdDelivery,
      sourceReportCoverageQa?.delivery_gate_decision?.hold_delivery,
      sourceReportCoverageQa?.delivery_gate_decision?.holdDelivery,
      qaFixRouting?.hold_delivery,
      qaFixRouting?.holdDelivery,
    ].filter((value) => value === true || value === false);
    if (
      canonicalHoldDelivery !== null &&
      legacyHoldCandidates.some((value) => Boolean(value) !== canonicalHoldDelivery)
    ) {
      addViolation(violations, {
        code: "CANONICAL_DELIVERY_HOLD_ALIAS_CONFLICT",
        severity: "high",
        category: "delivery_conformance_contract",
        message: "Canonical hold-delivery flag conflicts with legacy hold aliases.",
        evidence: {
          canonical_hold_delivery: canonicalHoldDelivery,
          legacy_hold_candidates: legacyHoldCandidates,
          canonical_delivery_source: canonicalDeliveryResolution.source,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }

  for (const readinessPayload of readinessPayloadCandidates) {
    const publicSampleReady = readinessPayload?.public_sample_ready;
    const publicSampleBlockers = Array.isArray(readinessPayload?.public_sample_blockers)
      ? readinessPayload.public_sample_blockers
      : Array.isArray(readinessPayload?.readiness_hierarchy?.public_sample_blockers)
        ? readinessPayload.readiness_hierarchy.public_sample_blockers
        : Array.isArray(readinessPayload?.distribution_context?.public_sample_blockers)
          ? readinessPayload.distribution_context.public_sample_blockers
          : [];
    const publicSampleImpact = String(
      readinessPayload?.public_sample_impact ||
      readinessPayload?.readiness_hierarchy?.public_sample_impact ||
      readinessPayload?.distribution_context?.public_sample_impact ||
      ""
    ).toLowerCase();
    if (publicSampleReady === true && (publicSampleBlockers.length > 0 || publicSampleImpact === "block_until_review")) {
      addViolation(violations, {
        code: "PUBLIC_SAMPLE_READY_WITH_BLOCKERS",
        severity: "high",
        category: "distribution_readiness_contract",
        message: "Public-sample readiness is true while blockers or block-until-review impact are present.",
        evidence: {
          public_sample_ready: publicSampleReady,
          public_sample_blockers: publicSampleBlockers,
          public_sample_impact: publicSampleImpact || null,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }

    const highValueReady = readinessPayload?.high_value_outreach_ready;
    const highValueBlockers = Array.isArray(readinessPayload?.high_value_outreach_blockers)
      ? readinessPayload.high_value_outreach_blockers
      : Array.isArray(readinessPayload?.readiness_hierarchy?.high_value_outreach_blockers)
        ? readinessPayload.readiness_hierarchy.high_value_outreach_blockers
        : Array.isArray(readinessPayload?.distribution_context?.high_value_outreach_blockers)
          ? readinessPayload.distribution_context.high_value_outreach_blockers
          : [];
    const highValueImpact = String(
      readinessPayload?.high_value_outreach_impact ||
      readinessPayload?.readiness_hierarchy?.high_value_outreach_impact ||
      readinessPayload?.distribution_context?.high_value_outreach_impact ||
      ""
    ).toLowerCase();
    if (highValueReady === true && (highValueBlockers.length > 0 || highValueImpact === "block_until_review")) {
      addViolation(violations, {
        code: "HIGH_VALUE_OUTREACH_READY_WITH_BLOCKERS",
        severity: "high",
        category: "distribution_readiness_contract",
        message: "High-value-outreach readiness is true while blockers or block-until-review impact are present.",
        evidence: {
          high_value_outreach_ready: highValueReady,
          high_value_outreach_blockers: highValueBlockers,
          high_value_outreach_impact: highValueImpact || null,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }
  const renderedStableClassification =
    /\b(?:Within Underwriting Parameters|Refinance Stability Classification\s*[:\n]\s*Stable|Capital Risk Profile\s*[:\n]\s*Stable)\b/i.test(text);
  const renderedReviewDebtConstraint = /Review\s*-\s*Debt Coverage Constraint/i.test(text);
  const renderedReviewSourceReconciliation = /Review\s*-\s*Source Reconciliation Disclosure/i.test(text);
  const renderedReviewInsufficientCoreSupport = /Review\s*-\s*Insufficient Core Support/i.test(text);
  const canonicalVisibleClassificationLabel = String(
    sourceReportCoverageQa?.visible_classification_state?.label ||
    sourceReportCoverageQa?.display_verdict_state?.label ||
    sourceReportCoverageQa?.canonical_display_verdict_state?.label ||
    canonicalVerdictCapState.expected_label ||
    ""
  ).trim();
  const canonicalVisibleClassificationRegex = canonicalVisibleClassificationLabel
    ? new RegExp(escapeRegex(canonicalVisibleClassificationLabel), "i")
    : null;
  if (canonicalVerdictCapState.has_cap && renderedStableClassification) {
    addViolation(violations, {
      code: "VERDICT_CAP_RENDER_DRIFT",
      severity: "high",
      category: "visible_classification_contract",
      message: "Canonical verdict state is capped at Review, but rendered report includes uncapped stable classification language.",
      evidence: {
        canonical_cap_reason_code: canonicalVerdictCapState.cap_reason_code,
        canonical_expected_label: canonicalVerdictCapState.expected_label,
        excerpt: firstPatternExcerpt(text, [/Within Underwriting Parameters/i, /Refinance Stability Classification\s*[:\n]\s*Stable/i, /Capital Risk Profile\s*[:\n]\s*Stable/i]) || leakProbeExcerpt,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  if (
    canonicalVerdictCapState.cap_reason_code === "debt_coverage_constraint" ||
    canonicalVerdictCapState.cap_reason_code === "debt_coverage_not_assessed"
  ) {
    if (!renderedReviewDebtConstraint) {
      addViolation(violations, {
        code: "VERDICT_CAP_EXPLANATION_CONTRADICTION",
        severity: "high",
        category: "visible_classification_contract",
        message: "Canonical debt-coverage cap exists, but rendered report lacks aligned debt-coverage review classification language.",
        evidence: {
          canonical_cap_reason_code: canonicalVerdictCapState.cap_reason_code,
          canonical_expected_label: canonicalVerdictCapState.expected_label,
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  } else if (canonicalVerdictCapState.cap_reason_code === "source_reconciliation_disclosure") {
    if (!renderedReviewSourceReconciliation) {
      addViolation(violations, {
        code: "VERDICT_CAP_EXPLANATION_CONTRADICTION",
        severity: "high",
        category: "visible_classification_contract",
        message: "Canonical source-reconciliation cap exists, but rendered report lacks aligned source-reconciliation review classification language.",
        evidence: {
          canonical_cap_reason_code: canonicalVerdictCapState.cap_reason_code,
          canonical_expected_label: canonicalVerdictCapState.expected_label,
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  } else if (canonicalVerdictCapState.cap_reason_code === "insufficient_core_support") {
    if (!renderedReviewInsufficientCoreSupport) {
      addViolation(violations, {
        code: "VERDICT_CAP_EXPLANATION_CONTRADICTION",
        severity: "high",
        category: "visible_classification_contract",
        message: "Canonical insufficient-core-support cap exists, but rendered report lacks aligned insufficient-core-support review classification language.",
        evidence: {
          canonical_cap_reason_code: canonicalVerdictCapState.cap_reason_code,
          canonical_expected_label: canonicalVerdictCapState.expected_label,
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }
  const visibleClassificationLabels = [];
  const addVisibleLabel = (label, pattern) => {
    if (pattern.test(text)) visibleClassificationLabels.push(label);
  };
  addVisibleLabel("review_debt_coverage_constraint", /Review\s*-\s*Debt Coverage Constraint/i);
  addVisibleLabel("review_source_reconciliation_disclosure", /Review\s*-\s*Source Reconciliation Disclosure/i);
  addVisibleLabel("review_insufficient_core_support", /Review\s*-\s*Insufficient Core Support/i);
  addVisibleLabel("stable", /\b(?:Within Underwriting Parameters|Refinance Stability Classification\s*[:\n]\s*Stable|Capital Risk Profile\s*[:\n]\s*Stable)\b/i);
  const uniqueVisibleLabels = [...new Set(visibleClassificationLabels)];
  const hasConflictingVisibleClassifications =
    uniqueVisibleLabels.length > 1 &&
    (
      uniqueVisibleLabels.includes("stable") ||
      uniqueVisibleLabels.filter((label) => label.startsWith("review_")).length > 1
    );
  if (hasConflictingVisibleClassifications) {
    addViolation(violations, {
      code: "VISIBLE_CLASSIFICATION_CONFLICT",
      severity: "high",
      category: "visible_classification_contract",
      message: "Rendered report contains conflicting visible classification labels across sections.",
      evidence: {
        visible_classification_labels: uniqueVisibleLabels,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  if (canonicalVisibleClassificationRegex && !canonicalVisibleClassificationRegex.test(text)) {
    addViolation(violations, {
      code: "VISIBLE_CLASSIFICATION_CANONICAL_MISMATCH",
      severity: "high",
      category: "visible_classification_contract",
      message: "Rendered report visible classification does not match canonical visible classification state.",
      evidence: {
        canonical_visible_classification_label: canonicalVisibleClassificationLabel,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }

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
      evidence: {
        report_type: reportTypeLabel,
        excerpt: hasScreeningLeakInUnderwriting
          ? screeningLeakExcerptInUnderwriting
          : underwritingLeakExcerptInScreening || leakProbeExcerpt,
      },
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
  const canonicalSupportDocs = collectCanonicalSupportDocs(sourceReportCoverageQa, artifacts);
  if (canonicalSupportDocs.length > 0) {
    const propertyTaxRenderedLabelPattern =
      /structured property tax input|modeled property tax input|property tax support|limited property tax support|property tax evidence|property tax source/i;
    const modeledRenderedLabelPattern =
      /structured input|modeled input|modeled support|quantitative support|used in modeled outputs|used as underwriting input/i;
    const nonPropertyTaxRoles = new Set([
      "environmental",
      "zoning_compliance",
      "market_survey",
      "appraisal",
      "background",
      "qualitative_support",
      "unmodeled_support",
      "limited_support",
    ]);
    const conflictingDocs = [];
    for (const doc of canonicalSupportDocs) {
      const role = normalizeSupportRole(doc.role);
      if (!role) continue;
      const isCanonicalPropertyTax = role === "property_tax";
      const isCanonicalNonModeled = !doc.explicitly_modeled && !isCanonicalPropertyTax;
      const docName = String(doc.name || "").trim();
      const roleKeyword =
        role === "environmental" ? /phase\s*i|phase\s*1|esa|environment/i :
        role === "zoning_compliance" ? /zoning|compliance|permitted use|municipal zoning/i :
        role === "market_survey" ? /market survey|rent survey|rent comp/i :
        role === "appraisal" ? /appraisal|valuation/i :
        role === "qualitative_support" ? /qualitative|background|support/i :
        null;

      let contextWindow = "";
      if (docName) {
        const docMatch = new RegExp(escapeRegExp(docName), "i").exec(text);
        if (docMatch) {
          const windowStart = Math.max(0, docMatch.index - 140);
          const windowEnd = Math.min(text.length, docMatch.index + docMatch[0].length + 220);
          contextWindow = text.slice(windowStart, windowEnd);
        }
      }
      if (!contextWindow && roleKeyword) {
        const roleMatch = roleKeyword.exec(text);
        if (roleMatch) {
          const windowStart = Math.max(0, roleMatch.index - 120);
          const windowEnd = Math.min(text.length, roleMatch.index + roleMatch[0].length + 220);
          contextWindow = text.slice(windowStart, windowEnd);
        }
      }
      if (!contextWindow) continue;

      const hasPropertyTaxLabel = propertyTaxRenderedLabelPattern.test(contextWindow);
      const hasModeledLabel =
        modeledRenderedLabelPattern.test(contextWindow) &&
        !/not used in modeled outputs|not modeled|qualitative support|unmodeled support|for context only/i.test(contextWindow);
      if (
        nonPropertyTaxRoles.has(role) &&
        (hasPropertyTaxLabel || (isCanonicalNonModeled && hasModeledLabel))
      ) {
        conflictingDocs.push({
          canonical_role: role,
          canonical_treatment_modeled: doc.explicitly_modeled,
          document_name: docName || null,
          rendered_conflicting_label: hasPropertyTaxLabel
            ? "property_tax_modeled_label"
            : "generic_modeled_label",
          excerpt: contextWindow.trim(),
          source_summary: doc.source || null,
        });
      }
    }
    if (conflictingDocs.length > 0) {
      addViolation(violations, {
        code: "SUPPORT_DOC_CANONICAL_ROLE_RENDER_DRIFT",
        severity: "high",
        category: "support_document_treatment_contract",
        message: "Rendered support-document treatment labels conflict with canonical support-document role/treatment metadata.",
        evidence: {
          conflicts: conflictingDocs,
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }
  const modeledDocNames = extractDocumentTreatmentFileNames(rawHtml, "Modeled Inputs");
  const modeledDocRows = extractDocumentTreatmentRows(rawHtml, "Modeled Inputs");
  const displayedLimitedRows = extractDocumentTreatmentRows(rawHtml, "Displayed / Limited Use");
  const listedNotModeledDocNames = extractDocumentTreatmentFileNames(
    rawHtml,
    "Listed but Not Quantitatively Modeled"
  );
  const listedNotModeledRows = extractDocumentTreatmentRows(
    rawHtml,
    "Listed but Not Quantitatively Modeled"
  );
  const duplicateDocumentTreatmentNames = modeledDocNames.filter((name) =>
    listedNotModeledDocNames.includes(name)
  );
  if (duplicateDocumentTreatmentNames.length > 0) {
    addViolation(violations, {
      code: "DOCUMENT_TREATMENT_DUPLICATE_CATEGORY_CONFLICT",
      severity: "high",
      category: "support_document_treatment_contract",
      message:
        "Document Treatment Summary lists the same file under both modeled and not-quantitatively-modeled categories.",
      evidence: {
        duplicate_files: duplicateDocumentTreatmentNames,
      },
      customer_delivery_impact: "disclose_only",
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
  const structuredCurrentDebtNames = modeledDocRows
    .filter((row) => /structured current debt input/i.test(row.raw))
    .map((row) => row.name);
  const acquisitionOnlyNames = displayedLimitedRows
    .filter((row) => /acquisition assumptions context only/i.test(row.raw))
    .map((row) => row.name);
  const listedOnlyNames = listedNotModeledRows.map((row) => row.name);
  const contradictoryCurrentDebtFiles = [...new Set(
    structuredCurrentDebtNames.filter((name) =>
      acquisitionOnlyNames.includes(name) || listedOnlyNames.includes(name)
    )
  )];
  if (contradictoryCurrentDebtFiles.length > 0) {
    addViolation(violations, {
      code: "CURRENT_DEBT_DOCUMENT_TREATMENT_CONTRADICTION",
      severity: "high",
      category: "support_document_treatment_contract",
      message: "A file is labeled as structured current-debt input and also labeled acquisition-only or not-quantitatively-modeled.",
      evidence: {
        conflicting_files: contradictoryCurrentDebtFiles,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }

  const propertyTaxStructuredRows = modeledDocRows.filter((row) =>
    /structured property tax input/i.test(row.raw)
  );
  if (propertyTaxStructuredRows.length > 0) {
    const bindingState =
      sourceReportCoverageQa?.property_tax_binding_state ||
      sourceReportCoverageQa?.document_treatment?.property_tax_binding_state ||
      null;
    const allowsMultipleStructuredPropertyTax = Boolean(
      bindingState?.allows_multiple_bound_sources ||
      bindingState?.allow_multiple_bound_sources ||
      bindingState?.multiple_bound_sources_allowed ||
      bindingState?.supports_multiple_bound_sources
    );
    const dangerPattern = /phase\s*i|phase\s*1|esa|environment(?:al)?|zoning|compliance|appraisal|market survey/i;
    const dangerousStructuredRows = propertyTaxStructuredRows
      .filter((row) => dangerPattern.test(row.raw))
      .map((row) => row.raw);
    if (propertyTaxStructuredRows.length > 1 && !allowsMultipleStructuredPropertyTax) {
      addViolation(violations, {
        code: "PROPERTY_TAX_STRUCTURED_INPUT_BINDING_CONTRADICTION",
        severity: "high",
        category: "support_document_treatment_contract",
        message: "Document Treatment Summary labels multiple files as structured property-tax input without explicit canonical multi-source binding support.",
        evidence: {
          structured_property_tax_rows: propertyTaxStructuredRows.map((row) => row.raw),
          property_tax_binding_state: bindingState,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    } else if (dangerousStructuredRows.length > 0) {
      addViolation(violations, {
        code: "PROPERTY_TAX_STRUCTURED_INPUT_BINDING_CONTRADICTION",
        severity: "high",
        category: "support_document_treatment_contract",
        message: "Structured property-tax input labeling includes environmental/zoning/appraisal/market-survey style support docs.",
        evidence: {
          dangerous_structured_rows: dangerousStructuredRows,
          property_tax_binding_state: bindingState,
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }

  const hasRefiNotAssessedCopy =
    /refinance stability was not assessed|refinance capacity was not assessed|current debt and refinance coverage were not assessed|current debt and refinance analysis was omitted/i.test(text);
  const hasCurrentDebtAssessedEvidence =
    /Current Debt DSCR\s*[:\n]\s*[0-9.]+x|Debt Structure Summary|Outstanding Balance|DSCR sensitivity|Current debt coverage was assessed/i.test(text);
  if (hasRefiNotAssessedCopy && hasCurrentDebtAssessedEvidence) {
    addViolation(violations, {
      code: "REFI_NOT_ASSESSED_COPY_CONTRADICTS_CURRENT_DEBT_RENDER",
      severity: "high",
      category: "debt_contract",
      message: "Rendered refinance not-assessed copy contradicts rendered current-debt assessed metrics/surfaces.",
      evidence: {
        excerpt:
          firstPatternExcerpt(text, [
            /refinance stability was not assessed/i,
            /refinance capacity was not assessed/i,
            /current debt and refinance coverage were not assessed/i,
            /current debt and refinance analysis was omitted/i,
          ]) || leakProbeExcerpt,
      },
      blocks_customer_delivery: false,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }

  const hasDocumentDerivedExitCapClaim = /\bdocument-derived exit cap\b/i.test(text);
  const verifiedExitCapMentions = text.match(/\bverified exit cap\b/gi) || [];
  const negatedVerifiedExitCapMentions = text.match(/\bnot\s+(?:a\s+)?verified exit cap\b/gi) || [];
  const hasUnnegatedVerifiedExitCapClaim =
    verifiedExitCapMentions.length > 0 &&
    verifiedExitCapMentions.length > negatedVerifiedExitCapMentions.length;
  const hasConservativeCapProvenanceDisclosure =
    /going-in cap reference|acquisition cap-rate reference|sensitivity anchor only|framework sensitivity|standardized framework assumption|standardized assumption|not an appraisal|refinance\/underwriting cap assumption|not a verified exit cap|not verified exit cap/i.test(text);
  if (
    (hasDocumentDerivedExitCapClaim || hasUnnegatedVerifiedExitCapClaim) &&
    hasConservativeCapProvenanceDisclosure
  ) {
    addViolation(violations, {
      code: "DCF_EXIT_CAP_SOURCE_OVERCLAIM",
      severity: "high",
      category: "dcf_source_attribution_contract",
      message: "Rendered DCF cap-rate attribution overclaims verified/document-derived exit-cap support while also indicating going-in/framework-only support.",
      evidence: {
        excerpt:
          firstPatternExcerpt(text, [
            /document-derived exit cap/i,
            /verified exit cap/i,
            /going-in cap reference/i,
            /acquisition cap-rate reference/i,
            /not a verified exit cap/i,
          ]) || leakProbeExcerpt,
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

  const canonicalRentRollTotals = resolveCanonicalRentRollAnnualTotalsForContract({
    artifacts,
    sourceReportCoverageQa,
  });
  const canonicalAnnualInPlaceRent = coerceNumber(canonicalRentRollTotals?.annual_in_place_rent);
  const canonicalAnnualMarketRent = coerceNumber(canonicalRentRollTotals?.annual_market_rent);
  const hasCanonicalAnnualRentTotals =
    (Number.isFinite(canonicalAnnualInPlaceRent) && canonicalAnnualInPlaceRent > 0) ||
    (Number.isFinite(canonicalAnnualMarketRent) && canonicalAnnualMarketRent > 0);
  const skipCanonicalRentRollParityForUntrustedPartialSample =
    canonicalRentRollTotals?.is_partial_sample === true &&
    canonicalRentRollTotals?.trusted_summary_totals !== true;
  if (hasCanonicalAnnualRentTotals && !skipCanonicalRentRollParityForUntrustedPartialSample) {
    const renderedAnnualInPlaceRent = extractLabeledNumber(text, [
      "Annual In-Place Rent (Total)",
      "Annual In-Place Rent",
    ]);
    const renderedAnnualMarketRent = extractLabeledNumber(text, [
      "Annual Market Rent (Total)",
      "Annual Market Rent (100% Occupancy)",
      "Annual Market Rent",
    ]);
    const absTolerance = 100;
    const relTolerance = 0.005;
    const mismatchedValues = [];
    if (
      Number.isFinite(canonicalAnnualInPlaceRent) &&
      canonicalAnnualInPlaceRent > 0 &&
      Number.isFinite(renderedAnnualInPlaceRent)
    ) {
      const absDiff = Math.abs(renderedAnnualInPlaceRent - canonicalAnnualInPlaceRent);
      const relDiff = absDiff / Math.max(Math.abs(canonicalAnnualInPlaceRent), 1);
      if (absDiff > absTolerance && relDiff > relTolerance) {
        mismatchedValues.push({
          metric: "annual_in_place_rent",
          canonical_value: canonicalAnnualInPlaceRent,
          rendered_value: renderedAnnualInPlaceRent,
          absolute_difference: absDiff,
          relative_difference: relDiff,
        });
      }
    }
    if (
      Number.isFinite(canonicalAnnualMarketRent) &&
      canonicalAnnualMarketRent > 0 &&
      Number.isFinite(renderedAnnualMarketRent)
    ) {
      const absDiff = Math.abs(renderedAnnualMarketRent - canonicalAnnualMarketRent);
      const relDiff = absDiff / Math.max(Math.abs(canonicalAnnualMarketRent), 1);
      if (absDiff > absTolerance && relDiff > relTolerance) {
        mismatchedValues.push({
          metric: "annual_market_rent",
          canonical_value: canonicalAnnualMarketRent,
          rendered_value: renderedAnnualMarketRent,
          absolute_difference: absDiff,
          relative_difference: relDiff,
        });
      }
    }
    if (mismatchedValues.length > 0) {
      addViolation(violations, {
        code: "RENT_ROLL_CANONICAL_ANNUAL_TOTAL_DRIFT",
        severity: "high",
        category: "source_report_reconciliation",
        message: "Rendered annual rent-roll totals drift from canonical annual rent-roll totals.",
        evidence: {
          canonical_annual_in_place_rent: Number.isFinite(canonicalAnnualInPlaceRent) ? canonicalAnnualInPlaceRent : null,
          canonical_annual_market_rent: Number.isFinite(canonicalAnnualMarketRent) ? canonicalAnnualMarketRent : null,
          rendered_annual_in_place_rent: Number.isFinite(renderedAnnualInPlaceRent) ? renderedAnnualInPlaceRent : null,
          rendered_annual_market_rent: Number.isFinite(renderedAnnualMarketRent) ? renderedAnnualMarketRent : null,
          mismatched_values: mismatchedValues,
          tolerance: {
            absolute_difference: absTolerance,
            relative_difference: relTolerance,
          },
          excerpt:
            firstPatternExcerpt(text, [
              /Annual In-Place Rent(?: \(Total\))?/i,
              /Annual Market Rent(?: \(Total\)| \(100% Occupancy\))?/i,
            ]) || leakProbeExcerpt,
          rent_roll_state: canonicalRentRollTotals?.rent_roll_state || null,
          rent_roll_inventory: canonicalRentRollTotals?.rent_roll_inventory || null,
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }

  const canonicalOccupancyState = resolveCanonicalOccupancyForContract({
    artifacts,
    sourceReportCoverageQa,
  });
  const canonicalOccupancy = canonicalOccupancyState?.canonical_occupancy;
  const skipOccupancyParityForUntrustedPartialSample =
    canonicalOccupancyState?.is_partial_sample === true &&
    canonicalOccupancyState?.trusted_occupancy !== true;
  if (
    Number.isFinite(canonicalOccupancy) &&
    canonicalOccupancy >= 0 &&
    canonicalOccupancy <= 1 &&
    !skipOccupancyParityForUntrustedPartialSample
  ) {
    const renderedOccupancyValues = extractRenderedOccupancyValues(text);
    if (renderedOccupancyValues.length > 0) {
      const tolerancePercentagePoints = 0.5;
      const mismatchedValues = renderedOccupancyValues.filter((entry) =>
        Math.abs((entry.value - canonicalOccupancy) * 100) > tolerancePercentagePoints
      ).map((entry) => ({
        ...entry,
        canonical_value: canonicalOccupancy,
        absolute_difference_percentage_points: Math.abs((entry.value - canonicalOccupancy) * 100),
      }));
      if (mismatchedValues.length > 0) {
        addViolation(violations, {
          code: "OCCUPANCY_CANONICAL_VALUE_DRIFT",
          severity: "high",
          category: "source_report_reconciliation",
          message: "Rendered occupancy values drift from canonical occupancy.",
          evidence: {
            canonical_occupancy: canonicalOccupancy,
            rendered_values: renderedOccupancyValues,
            mismatched_values: mismatchedValues,
            tolerance_percentage_points: tolerancePercentagePoints,
            excerpt:
              firstPatternExcerpt(text, [
                /Occupancy/i,
                /Current Occupancy/i,
                /Rent Roll Occupancy/i,
                /Physical Occupancy/i,
              ]) || leakProbeExcerpt,
            rent_roll_state: canonicalOccupancyState?.rent_roll_state || null,
            rent_roll_inventory: canonicalOccupancyState?.rent_roll_inventory || null,
          },
          customer_delivery_impact: "disclose_only",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        });
      }
    }
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

  // Rendered DSCR extraction is evidence-only for conformance checks.
  const currentDebtDscrValues = extractCurrentDebtDscrValues(text);
  const canonicalCurrentDebtDscrStatus = String(currentDebtState?.current_debt_dscr_status || "").toLowerCase();
  const canonicalCurrentDebtDscr = Number(currentDebtState?.current_debt_dscr);
  if (hasCanonicalCurrentDebtState && canonicalCurrentDebtDscrStatus === "computed" && Number.isFinite(canonicalCurrentDebtDscr)) {
    const tolerance = 0.02;
    const mismatchedValues = currentDebtDscrValues.filter((entry) =>
      Math.abs(entry.value - canonicalCurrentDebtDscr) > tolerance
    );
    if (mismatchedValues.length > 0) {
      addViolation(violations, {
        code: "CURRENT_DEBT_DSCR_CANONICAL_VALUE_DRIFT",
        severity: "high",
        category: "source_report_reconciliation",
        message: "Rendered current-debt DSCR values drift from canonical computed current-debt DSCR.",
        evidence: {
          canonical_current_debt_dscr: canonicalCurrentDebtDscr,
          rendered_values: currentDebtDscrValues,
          mismatched_values: mismatchedValues,
          tolerance,
          excerpt:
            firstPatternExcerpt(text, [
              /\bDSCR \(Computed\)\b/i,
              /\bDSCR \(T12 NOI\)\b/i,
              /\bDSCR \(Current Debt\)\b/i,
              /\bCurrent Debt DSCR\b/i,
              /\bCurrent Debt Coverage\b/i,
            ]) || leakProbeExcerpt,
          current_debt_state: {
            current_debt_dscr_status: currentDebtState?.current_debt_dscr_status || null,
            current_debt_dscr: currentDebtState?.current_debt_dscr ?? null,
            current_debt_assessed: currentDebtState?.current_debt_assessed ?? null,
            has_true_current_debt_balance: currentDebtState?.has_true_current_debt_balance ?? null,
            current_debt_limitation_reason_code: currentDebtState?.current_debt_limitation_reason_code || null,
            refi_basis_eligible: currentDebtState?.refi_basis_eligible ?? null,
            qa_canonical_source: canonicalCurrentDebtResolution.source,
          },
        },
        customer_delivery_impact: "disclose_only",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
  }
  const canonicalDebtNotComputed = canonicalCurrentDebtDscrStatus && canonicalCurrentDebtDscrStatus !== "computed";
  if (hasCanonicalCurrentDebtState && canonicalDebtNotComputed && currentDebtDscrValues.length > 0) {
    addViolation(violations, {
      code: "CURRENT_DEBT_DSCR_CANONICAL_NOT_ASSESSED_CONFLICT",
      severity: "critical",
      category: "source_report_reconciliation",
      message: "Canonical current-debt state is not computed, but rendered report includes numeric current-debt DSCR evidence.",
      evidence: {
        canonical_current_debt_state: {
          current_debt_dscr_status: currentDebtState?.current_debt_dscr_status || null,
          current_debt_assessed: currentDebtState?.current_debt_assessed ?? null,
          has_true_current_debt_balance: currentDebtState?.has_true_current_debt_balance ?? null,
          current_debt_limitation_reason_code: currentDebtState?.current_debt_limitation_reason_code || null,
          refi_basis_eligible: currentDebtState?.refi_basis_eligible ?? null,
          qa_canonical_source: canonicalCurrentDebtResolution.source,
        },
        rendered_values: currentDebtDscrValues,
        excerpt:
          firstPatternExcerpt(text, [
            /\bDSCR \(Computed\)\b/i,
            /\bDSCR \(T12 NOI\)\b/i,
            /\bDSCR \(Current Debt\)\b/i,
            /\bCurrent Debt DSCR\b/i,
          ]) || leakProbeExcerpt,
      },
      blocks_customer_delivery: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    });
  }
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

  const canonicalAcquisitionDebtTruth = resolveCanonicalAcquisitionDebtSeparationTruth({
    sourceReportCoverageQa,
    currentDebtState,
  });
  const derivedAcq = canonicalAcquisitionDebtTruth.hasCanonicalTruth
    ? canonicalAcquisitionDebtTruth.hasProposedAcquisitionFinancing
    : hasDerivedAcquisitionDebt(artifacts, sourceReportCoverageQa);
  const canonicalDebtComputed = String(currentDebtState?.current_debt_dscr_status || "").trim().toLowerCase() === "computed";
  const currentDebt = canonicalAcquisitionDebtTruth.hasCanonicalTruth
    ? canonicalAcquisitionDebtTruth.hasTrueCurrentDebtBalance
    : hasCanonicalCurrentDebtState
    ? canonicalDebtComputed
    : hasTrueCurrentDebt(artifacts, sourceReportCoverageQa);
  const { acquisitionLoan } = resolveLoanTermSheetPayloads(artifacts, sourceReportCoverageQa);
  const hasCurrentDebtTermsSupport = hasCanonicalCurrentDebtState
    ? canonicalDebtComputed
    : (
      Boolean(sourceReportCoverageQa?.artifact_inventory?.mortgage_statement_parsed?.present) ||
      hasTrueCurrentDebt(artifacts, sourceReportCoverageQa) ||
      Boolean(currentDebtState?.has_current_debt_document)
    );
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
        evidence: {
          has_separation: hasSeparation,
          contaminated_current_debt_language: contaminated,
          canonical_truth_source: canonicalAcquisitionDebtTruth.source,
          canonical_truth_present: canonicalAcquisitionDebtTruth.hasCanonicalTruth,
          canonical_current_debt_separated: canonicalAcquisitionDebtTruth.currentDebtSeparated,
        },
        blocks_customer_delivery: contaminated,
      });
    }
  }
  if (acquisitionLoan && typeof acquisitionLoan === "object") {
    const canonicalAcquisitionValues = resolveCanonicalAcquisitionValuesForQa({
      sourceReportCoverageQa,
      fallbackLoan: acquisitionLoan,
    });
    const acquisitionSection = subsectionAfter(
      text,
      /Proposed Acquisition Debt Sizing/i,
      [/Current Debt Coverage/i, /Deal Scorecard/i, /Risk Register/i],
      2400
    );
    const hasAcquisitionSection = /Proposed Acquisition Debt Sizing/i.test(text) && String(acquisitionSection || "").trim().length > 0;
    const purchasePrice = Number(canonicalAcquisitionValues?.purchase_price);
    const statedLoan = Number(canonicalAcquisitionValues?.stated_acquisition_loan_amount);
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
    const lenderFeePercent = normalizePercentForComparison(canonicalAcquisitionValues?.lender_fee_percent);
    const canUseArtifactLenderFeeFallback = !canonicalAcquisitionValues?.hasCanonicalAcquisitionState;
    const fallbackArtifactLenderFeePercent = canUseArtifactLenderFeeFallback
      ? normalizePercentForComparison(
        acquisitionLoan?.lender_fee_percent ?? acquisitionLoan?.origination_fee_percent ?? acquisitionLoan?.financing_fee_percent
      )
      : null;
    const authoritativeLenderFeePercent = Number.isFinite(lenderFeePercent) ? lenderFeePercent : fallbackArtifactLenderFeePercent;
    if (
      Number.isFinite(authoritativeLenderFeePercent) &&
      authoritativeLenderFeePercent > 0 &&
      /Proposed Acquisition Debt Sizing/i.test(text) &&
      !/Lender Fee/i.test(acquisitionSection)
    ) {
      addViolation(violations, {
        code: "ACQUISITION_LENDER_FEE_OMITTED_RENDERED",
        severity: "high",
        category: "debt_contract",
        message: "Document-stated lender/origination fee was parsed but omitted in rendered acquisition section.",
        evidence: {
          lender_fee_percent: authoritativeLenderFeePercent,
          qa_canonical_source: canonicalAcquisitionValues?.source || "legacy_artifact_fallback",
          excerpt: acquisitionSection.slice(0, 400),
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
    const canUseArtifactClosingFallback = !canonicalAcquisitionValues?.hasCanonicalAcquisitionState;
    const closingCostNotes = canUseArtifactClosingFallback ? String(acquisitionLoan?.closing_cost_notes || "").toLowerCase() : "";
    const hasOnlyUnquantifiedClosingNotes =
      (closingCostNotes.includes("legal") || closingCostNotes.includes("appraisal") || closingCostNotes.includes("closing")) &&
      !positive(acquisitionLoan?.closing_costs_percent);
    if (hasOnlyUnquantifiedClosingNotes && /Closing Costs[^\\n]{0,40}0\.0%/i.test(acquisitionSection)) {
      addViolation(violations, {
        code: "ACQUISITION_CLOSING_COSTS_ZERO_RENDERED_WITH_UNQUANTIFIED_NOTES",
        severity: "high",
        category: "debt_contract",
        message: "Rendered acquisition section shows Closing Costs 0.0% despite only unquantified legal/appraisal/closing notes.",
        evidence: {
          qa_canonical_source: canonicalAcquisitionValues?.source || "legacy_artifact_fallback",
          excerpt: firstPatternExcerpt(acquisitionSection, [/Closing Costs[^\n]{0,40}0\.0%/i]),
        },
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      });
    }
    if (hasAcquisitionSection) {
      const invLoan = sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed || null;
      const invAcq = invLoan?.acquisition_support || null;
      const canonicalPurchasePrice = coerceNumber(canonicalAcquisitionValues?.purchase_price);
      const canonicalStatedLoanAmount = coerceNumber(canonicalAcquisitionValues?.stated_acquisition_loan_amount);
      const canonicalDerivedLoanAmount = coerceNumber(canonicalAcquisitionValues?.derived_acquisition_loan_amount);
      const canonicalLenderFeePercent = normalizePercentForComparison(canonicalAcquisitionValues?.lender_fee_percent);

      const renderedPurchasePrice = extractLabeledNumber(acquisitionSection, ["Purchase Price"]);
      const renderedStatedLoanAmount = extractLabeledNumber(acquisitionSection, ["Stated Acquisition Loan Amount"]);
      const renderedDerivedLoanAmount =
        extractLabeledNumber(acquisitionSection, ["Derived Acquisition Loan Amount"]) ??
        extractLabeledNumber(acquisitionSection, ["Acquisition Loan Amount"]);
      const renderedLenderFeeMatch =
        /(?:Lender Fee|Origination Fee|Financing Fee)[^0-9]{0,80}([0-9]+(?:\.[0-9]+)?)\s*%/i.exec(acquisitionSection);
      const renderedLenderFeePercent = renderedLenderFeeMatch
        ? coerceNumber(renderedLenderFeeMatch[1]) / 100
        : null;

      const moneyAbsTolerance = 100;
      const moneyRelTolerance = 0.005;
      const feeTolerancePercentagePoints = 0.05;
      const mismatchedValues = [];
      const compareMoney = (metric, canonicalValue, renderedValue) => {
        if (!Number.isFinite(canonicalValue) || canonicalValue <= 0 || !Number.isFinite(renderedValue)) return;
        const absDiff = Math.abs(renderedValue - canonicalValue);
        const relDiff = absDiff / Math.max(Math.abs(canonicalValue), 1);
        if (absDiff > moneyAbsTolerance && relDiff > moneyRelTolerance) {
          mismatchedValues.push({
            metric,
            canonical_value: canonicalValue,
            rendered_value: renderedValue,
            absolute_difference: absDiff,
            relative_difference: relDiff,
          });
        }
      };
      compareMoney("purchase_price", canonicalPurchasePrice, renderedPurchasePrice);
      compareMoney("stated_acquisition_loan_amount", canonicalStatedLoanAmount, renderedStatedLoanAmount);
      compareMoney("derived_acquisition_loan_amount", canonicalDerivedLoanAmount, renderedDerivedLoanAmount);
      if (Number.isFinite(canonicalLenderFeePercent) && canonicalLenderFeePercent > 0 && Number.isFinite(renderedLenderFeePercent)) {
        const absDiffPercentagePoints = Math.abs(renderedLenderFeePercent - canonicalLenderFeePercent) * 100;
        if (absDiffPercentagePoints > feeTolerancePercentagePoints) {
          mismatchedValues.push({
            metric: "lender_fee_percent",
            canonical_value: canonicalLenderFeePercent,
            rendered_value: renderedLenderFeePercent,
            absolute_difference_percentage_points: absDiffPercentagePoints,
          });
        }
      }
      if (mismatchedValues.length > 0) {
        addViolation(violations, {
          code: "ACQUISITION_CANONICAL_VALUE_DRIFT",
          severity: "high",
          category: "debt_contract",
          message: "Rendered acquisition financing values drift from canonical acquisition financing values.",
          evidence: {
            canonical_purchase_price: Number.isFinite(canonicalPurchasePrice) ? canonicalPurchasePrice : null,
            rendered_purchase_price: Number.isFinite(renderedPurchasePrice) ? renderedPurchasePrice : null,
            canonical_stated_acquisition_loan_amount: Number.isFinite(canonicalStatedLoanAmount) ? canonicalStatedLoanAmount : null,
            rendered_stated_acquisition_loan_amount: Number.isFinite(renderedStatedLoanAmount) ? renderedStatedLoanAmount : null,
            canonical_derived_acquisition_loan_amount: Number.isFinite(canonicalDerivedLoanAmount) ? canonicalDerivedLoanAmount : null,
            rendered_derived_acquisition_loan_amount: Number.isFinite(renderedDerivedLoanAmount) ? renderedDerivedLoanAmount : null,
            canonical_lender_fee_percent: Number.isFinite(canonicalLenderFeePercent) ? canonicalLenderFeePercent : null,
            rendered_lender_fee_percent: Number.isFinite(renderedLenderFeePercent) ? renderedLenderFeePercent : null,
            mismatched_values: mismatchedValues,
            tolerance: {
              money_absolute_difference: moneyAbsTolerance,
              money_relative_difference: moneyRelTolerance,
              percent_absolute_difference_percentage_points: feeTolerancePercentagePoints,
            },
            qa_canonical_source: canonicalAcquisitionValues?.source || "legacy_artifact_fallback",
            excerpt: acquisitionSection.slice(0, 500),
            acquisition_inventory_summary: invAcq || null,
          },
          customer_delivery_impact: "disclose_only",
          blocks_customer_delivery: false,
          blocks_public_sample: true,
          blocks_high_value_outreach: true,
        });
      }
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

  if (!hasCanonicalCurrentDebtState && (!currentDebt || !hasCurrentDebtTermsSupport)) {
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
  const violationCustomerDeliveryReady = !violations.some((violation) => violation.blocks_customer_delivery);
  const violationPublicSampleReady = !violations.some((violation) => violation.blocks_public_sample && ["medium", "high", "critical"].includes(violation.severity));
  const violationHighValueOutreachReady = !violations.some((violation) => violation.blocks_high_value_outreach && ["medium", "high", "critical"].includes(violation.severity));
  const customerDeliveryReady = hasCanonicalDeliveryState
    ? Boolean(canonicalDeliveryState?.customer_delivery_allowed)
    : violationCustomerDeliveryReady;
  const publicSampleReady = hasCanonicalDeliveryState
    ? Boolean(canonicalDeliveryState?.public_sample_ready)
    : violationPublicSampleReady;
  const highValueOutreachReady = hasCanonicalDeliveryState
    ? Boolean(canonicalDeliveryState?.high_value_outreach_ready)
    : violationHighValueOutreachReady;

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
    delivery_conformance_source: canonicalDeliveryResolution.source,
    canonical_delivery_state_present: hasCanonicalDeliveryState,
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
