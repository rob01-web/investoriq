import { buildCanonicalVisibleClassificationState, buildCurrentDebtAssessmentState, buildAcquisitionAssumptionState, buildSourceReconciliationState, buildFullUnderwritingSectionEligibility, buildSourceReconciliationNarrativeProminencePolicy, resolveCanonicalRentRollAnnualTotals } from "./report-surface-contracts.js";
import { buildFullUnderwritingState } from "./full-underwriting-state.js";
import { formatCurrentDebtAssessmentCopy } from "./acquisition-memo-v2-surface-copy.js";
import { formatMultiple, formatPercent1, escapeHtml } from "./report-formatting-helpers.js";
import { materiallyDifferent, isFinitePositive } from "./report-number-helpers.js";

const DATA_NOT_AVAILABLE = "Not assessed";

const coerceNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, "").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

export function resolveSafeAnnualRentTotal({
  totalUnits,
  weightedAvgRent,
  summaryAnnualTotal,
  rowAnnualTotal,
  isPartialSample = false,
  preferSummaryAnnual = false,
} = {}) {
  const units = coerceNumber(totalUnits);
  const weighted = coerceNumber(weightedAvgRent);
  const summaryAnnual = coerceNumber(summaryAnnualTotal);
  const rowAnnual = coerceNumber(rowAnnualTotal);
  if (preferSummaryAnnual && Number.isFinite(summaryAnnual) && summaryAnnual > 0) return summaryAnnual;
  if (
    !isPartialSample &&
    Number.isFinite(units) &&
    units > 0 &&
    Number.isFinite(summaryAnnual) &&
    Number.isFinite(weighted)
  ) {
    const impliedMonthly = summaryAnnual / 12 / units;
    if (!materiallyDifferent(impliedMonthly, weighted)) return summaryAnnual;
  }
  if (!isPartialSample && Number.isFinite(units) && units > 0 && Number.isFinite(weighted)) {
    return weighted * units * 12;
  }
  if (Number.isFinite(summaryAnnual)) return summaryAnnual;
  if (Number.isFinite(rowAnnual)) return rowAnnual;
  return null;
}

function resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(mortgagePayload, t12Noi) {
  const balance = coerceNumber(mortgagePayload?.outstanding_balance);
  const interestRatePct = coerceNumber(mortgagePayload?.interest_rate);
  const amortYears = coerceNumber(mortgagePayload?.amort_years);
  const sourceMonthlyPayment = coerceNumber(mortgagePayload?.monthly_payment ?? mortgagePayload?.monthly_debt_service);
  const sourceAnnualDebtService = coerceNumber(mortgagePayload?.annual_debt_service);
  const monthlyRate = Number.isFinite(interestRatePct) && interestRatePct > 0 && Number.isFinite(amortYears) && amortYears > 0
    ? (interestRatePct / 100) / 12
    : null;
  const months = Number.isFinite(amortYears) && amortYears > 0 ? Math.round(amortYears * 12) : null;
  const computedMonthlyPayment =
    Number.isFinite(balance) &&
    balance > 0 &&
    Number.isFinite(monthlyRate) &&
    monthlyRate > 0 &&
    Number.isFinite(months) &&
    months > 0
      ? balance * ((monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
      : null;
  const annualDebtService = Number.isFinite(sourceAnnualDebtService) && sourceAnnualDebtService > 0
    ? sourceAnnualDebtService
    : Number.isFinite(sourceMonthlyPayment) && sourceMonthlyPayment > 0
    ? sourceMonthlyPayment * 12
    : Number.isFinite(computedMonthlyPayment) && computedMonthlyPayment > 0
    ? computedMonthlyPayment * 12
    : null;
  const dscr =
    Number.isFinite(balance) &&
    balance > 0 &&
    Number.isFinite(t12Noi) &&
    t12Noi > 0 &&
    Number.isFinite(annualDebtService) &&
    annualDebtService > 0
      ? t12Noi / annualDebtService
      : null;
  return {
    balance,
    interestRatePct,
    amortYears,
    sourceMonthlyPayment,
    computedMonthlyPayment,
    annualDebtService,
    dscr,
    hasSourcePayment: Number.isFinite(sourceMonthlyPayment) && sourceMonthlyPayment > 0,
    hasVerifiedOutstandingBalance: Number.isFinite(balance) && balance > 0,
  };
}

function currentDebtNotAssessedCopy({
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Noi = null,
} = {}) {
  return formatCurrentDebtAssessmentCopy({
    currentDebtState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    t12Noi,
  });
}

function resolveCanonicalCurrentDebtScoreInputs({
  currentDebtState = null,
  mortgagePayload = null,
  t12Payload = null,
} = {}) {
  const hasCanonicalDebtState = Boolean(
    currentDebtState &&
    (
      currentDebtState?.current_debt_dscr_status !== undefined ||
      currentDebtState?.current_debt_assessed !== undefined
    )
  );
  const canonicalStatus = String(currentDebtState?.current_debt_dscr_status || "").trim().toLowerCase();
  const canonicalDscr = coerceNumber(currentDebtState?.current_debt_dscr);
  const canonicalAnnualDebtService = coerceNumber(currentDebtState?.current_debt_annual_debt_service);
  const canonicalHasSourcePayment = String(currentDebtState?.current_debt_service_source || "").trim().toLowerCase() === "source_payment";
  if (canonicalStatus === "computed" && Number.isFinite(canonicalDscr) && canonicalDscr > 0) {
    return {
      currentDebtCoverage: {
        balance: coerceNumber(currentDebtState?.current_debt_balance),
        hasVerifiedOutstandingBalance: Boolean(currentDebtState?.has_true_current_debt_balance),
        dscr: canonicalDscr,
        annualDebtService:
          Number.isFinite(canonicalAnnualDebtService) && canonicalAnnualDebtService > 0
            ? canonicalAnnualDebtService
            : null,
        hasSourcePayment: canonicalHasSourcePayment,
      },
      usedCanonicalState: true,
    };
  }
  if (hasCanonicalDebtState) {
    return {
      currentDebtCoverage: null,
      usedCanonicalState: true,
    };
  }
  const fallbackCoverage = resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(
    mortgagePayload,
    coerceNumber(t12Payload?.net_operating_income)
  );
  if (Number.isFinite(fallbackCoverage?.dscr) && fallbackCoverage.dscr > 0) {
    return {
      currentDebtCoverage: fallbackCoverage,
      usedCanonicalState: false,
    };
  }
  return {
    currentDebtCoverage: null,
    usedCanonicalState: false,
  };
}

export function resolveCanonicalRefiDebtBasis({
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  financials = null,
  t12Payload = null,
} = {}) {
  const f = financials && typeof financials === "object" ? financials : {};
  const hasCanonicalDebtState = Boolean(
    currentDebtState &&
      (currentDebtState?.current_debt_dscr_status !== undefined ||
        currentDebtState?.current_debt_assessed !== undefined)
  );
  const canonicalHasTrueBalance = Boolean(currentDebtState?.has_true_current_debt_balance);
  const canonicalReasonCode = String(
    currentDebtState?.current_debt_limitation_reason_code || ""
  ).trim();
  const canonicalDscrStatus = String(
    currentDebtState?.current_debt_dscr_status || ""
  ).trim().toLowerCase();
  const canonicalBalance = coerceNumber(currentDebtState?.current_debt_balance);
  const canonicalAnnualDebtService = coerceNumber(
    currentDebtState?.current_debt_annual_debt_service
  );
  const canonicalDscr = coerceNumber(currentDebtState?.current_debt_dscr);
  const loanTermDebtBalance =
    coerceNumber(loanTermSheetTermsPayload?.current_outstanding_balance) ??
    coerceNumber(loanTermSheetTermsPayload?.current_loan_balance) ??
    coerceNumber(loanTermSheetTermsPayload?.outstanding_balance) ??
    null;
  const loanTermInterestRate =
    coerceNumber(loanTermSheetTermsPayload?.interest_rate) ?? null;
  const loanTermAmortYears =
    coerceNumber(loanTermSheetTermsPayload?.amortization_years) ??
    coerceNumber(loanTermSheetTermsPayload?.amort_years) ??
    null;
  const canonicalComputedDebtBasis =
    canonicalDscrStatus === "computed" &&
    Number.isFinite(canonicalBalance) &&
    canonicalBalance > 0 &&
    canonicalReasonCode !== "acquisition_only_not_current_debt";
  const hasTrueCurrentDebtBalanceDerived = Boolean(
    (canonicalHasTrueBalance && Number.isFinite(canonicalBalance) && canonicalBalance > 0) ||
      canonicalComputedDebtBasis
  );
  const debtBalance =
    hasTrueCurrentDebtBalanceDerived && canonicalDscrStatus === "computed"
      ? canonicalBalance
      : null;
  const interestRatePct =
    coerceNumber(f.refi_interest_rate) ??
    coerceNumber(mortgagePayload?.interest_rate) ??
    loanTermInterestRate ??
    null;
  const amortYears =
    coerceNumber(f.refi_amort_years) ??
    coerceNumber(mortgagePayload?.amort_years) ??
    loanTermAmortYears ??
    null;
  const annualDebtService =
    canonicalDscrStatus === "computed" &&
    Number.isFinite(canonicalAnnualDebtService) &&
    canonicalAnnualDebtService > 0
      ? canonicalAnnualDebtService
      : null;
  const canonicalCurrentDebtNotComputed =
    hasCanonicalDebtState && canonicalDscrStatus !== "computed";
  return {
    hasTrueCurrentDebtBalance:
      canonicalCurrentDebtNotComputed ? false : hasTrueCurrentDebtBalanceDerived,
    isAcquisitionOnly:
      canonicalReasonCode === "acquisition_only_not_current_debt" &&
      !canonicalHasTrueBalance,
    debtBalance: canonicalCurrentDebtNotComputed ? null : debtBalance,
    interestRatePct,
    amortYears,
    annualDebtService: canonicalCurrentDebtNotComputed ? null : annualDebtService,
    dscr:
      canonicalDscrStatus === "computed" &&
      Number.isFinite(canonicalDscr) &&
      canonicalDscr > 0
        ? canonicalDscr
        : null,
    debtServiceSource: String(currentDebtState?.current_debt_service_source || "").trim(),
    limitationReasonCode: canonicalReasonCode || null,
  };
}

export function buildRefiDebtRenderState({
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  financials = null,
  t12Payload = null,
} = {}) {
  const canonicalRefiDebtBasis = resolveCanonicalRefiDebtBasis({
    currentDebtState: currentDebtAssessmentState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials,
    t12Payload,
  });
  const hasVerifiedCurrentDebtBalance = Boolean(canonicalRefiDebtBasis?.hasTrueCurrentDebtBalance);
  const isAcquisitionOnly = Boolean(canonicalRefiDebtBasis?.isAcquisitionOnly);
  const canonicalDebtStatus = String(
    currentDebtAssessmentState?.current_debt_dscr_status || ""
  ).trim().toLowerCase();
  const canonicalRefiEligible =
    currentDebtAssessmentState?.refi_basis_eligible === true ||
    canonicalDebtStatus === "computed";
  const debtLikeSignalsPresent = [
    canonicalRefiDebtBasis?.debtBalance,
    canonicalRefiDebtBasis?.interestRatePct,
    canonicalRefiDebtBasis?.amortYears,
    canonicalRefiDebtBasis?.annualDebtService,
    mortgagePayload?.outstanding_balance,
    mortgagePayload?.interest_rate,
    mortgagePayload?.amort_years,
    loanTermSheetTermsPayload?.outstanding_balance,
    loanTermSheetTermsPayload?.current_outstanding_balance,
    loanTermSheetTermsPayload?.current_loan_balance,
    loanTermSheetTermsPayload?.interest_rate,
    loanTermSheetTermsPayload?.amortization_years,
    loanTermSheetTermsPayload?.amort_years,
    financials?.refi_debt_balance,
    financials?.refi_interest_rate,
    financials?.refi_amort_years,
  ].some((value) => Number.isFinite(coerceNumber(value)) && coerceNumber(value) > 0);
  let status = "valid";
  let disclosureReasonCode = "current_debt_verified";
  if (hasVerifiedCurrentDebtBalance && !isAcquisitionOnly && canonicalRefiEligible) {
    status = "valid";
    disclosureReasonCode = "current_debt_verified";
  } else if (isAcquisitionOnly) {
    status = "not_assessed";
    disclosureReasonCode = "acquisition_only_not_current_debt";
  } else if (debtLikeSignalsPresent) {
    status = "source_limited";
    disclosureReasonCode = "current_debt_source_limited";
  } else {
    status = "not_assessed";
    disclosureReasonCode = "no_verified_current_debt_balance";
  }
  return {
    status,
    hasVerifiedCurrentDebtBalance,
    isAcquisitionOnly,
    allowDebtMath: status === "valid" && canonicalRefiEligible === true,
    disclosureReasonCode,
    canonicalRefiDebtBasis,
  };
}

export function buildCurrentDebtScorecardEntry({
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Payload = null,
} = {}) {
  const canonicalStatus = String(currentDebtState?.current_debt_dscr_status || "").trim().toLowerCase();
  const hasCanonicalDebtState = Boolean(
    currentDebtState &&
    (
      currentDebtState?.current_debt_dscr_status !== undefined ||
      currentDebtState?.current_debt_assessed !== undefined
    )
  );
  const canonicalDscr = coerceNumber(currentDebtState?.current_debt_dscr);
  const canonicalAnnualDebtService = coerceNumber(currentDebtState?.current_debt_annual_debt_service);
  const canonicalDscrDerivedFromService =
    canonicalStatus === "computed" &&
    Number.isFinite(canonicalAnnualDebtService) &&
    canonicalAnnualDebtService > 0 &&
    Number.isFinite(coerceNumber(t12Payload?.net_operating_income)) &&
    coerceNumber(t12Payload?.net_operating_income) > 0
      ? coerceNumber(t12Payload?.net_operating_income) / canonicalAnnualDebtService
      : null;
  const canonicalDscrForScore = Number.isFinite(canonicalDscr) && canonicalDscr > 0
    ? canonicalDscr
    : canonicalDscrDerivedFromService;
  const canonicalHasSourcePayment = String(currentDebtState?.current_debt_service_source || "").trim().toLowerCase() === "source_payment";
  if (canonicalStatus === "computed" && Number.isFinite(canonicalDscrForScore) && canonicalDscrForScore > 0) {
    return {
      currentDebtCoverage: {
        dscr: canonicalDscrForScore,
        annualDebtService: Number.isFinite(canonicalAnnualDebtService) && canonicalAnnualDebtService > 0
          ? canonicalAnnualDebtService
          : null,
        hasSourcePayment: canonicalHasSourcePayment,
      },
      hasDscrScore: true,
      scoreRow: {
        label: "Current Debt DSCR",
        value: formatMultiple(canonicalDscrForScore, 2),
        pts: canonicalDscrForScore > 1.35 ? 10 : canonicalDscrForScore >= 1.25 ? 7 : 3,
        max: 10,
        band: canonicalDscrForScore > 1.35 ? "Above 1.35x" : canonicalDscrForScore >= 1.25 ? "1.25–1.35x" : "Below 1.25x",
      },
    };
  }
  const { currentDebtCoverage } = hasCanonicalDebtState
    ? { currentDebtCoverage: null }
    : resolveCanonicalCurrentDebtScoreInputs({
        currentDebtState,
        mortgagePayload,
        t12Payload,
      });
  if (currentDebtCoverage && Number.isFinite(currentDebtCoverage.dscr) && currentDebtCoverage.dscr > 0) {
    return {
      currentDebtCoverage,
      hasDscrScore: true,
      scoreRow: {
        label: "Current Debt DSCR",
        value: formatMultiple(currentDebtCoverage.dscr, 2),
        pts: currentDebtCoverage.dscr > 1.35 ? 10 : currentDebtCoverage.dscr >= 1.25 ? 7 : 3,
        max: 10,
        band: currentDebtCoverage.dscr > 1.35 ? "Above 1.35x" : currentDebtCoverage.dscr >= 1.25 ? "1.25–1.35x" : "Below 1.25x",
      },
    };
  }
  const dscrNotAssessedCopy = currentDebtNotAssessedCopy({
    currentDebtState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    t12Noi: coerceNumber(t12Payload?.net_operating_income),
  });
  return {
    currentDebtCoverage,
    hasDscrScore: false,
    scoreRow: null,
    dscrNotAssessedCopy,
  };
}

export function buildDealScorecardState({
  expenseRatioR = null,
  noiMarginR = null,
  execOccupancy = null,
  breakEvenOccR = null,
  marketRentPremiumRatio = null,
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Payload = null,
  sourceReconciliationState = null,
  launchMemoMode = false,
  launchMemoBaseLabel = null,
} = {}) {
  const scoreRows = [];
  let totalPoints = 0;
  let maxPoints = 0;
  if (Number.isFinite(expenseRatioR)) {
    const pts = expenseRatioR < 0.55 ? 10 : expenseRatioR <= 0.65 ? 6 : 2;
    totalPoints += pts;
    maxPoints += 10;
    scoreRows.push({
      label: "Expense Ratio",
      value: formatPercent1(expenseRatioR),
      pts,
      max: 10,
      band: expenseRatioR < 0.55 ? "Below 55%" : expenseRatioR <= 0.65 ? "55–65%" : "Above 65%",
    });
  }
  if (Number.isFinite(noiMarginR)) {
    const pts = noiMarginR > 0.45 ? 10 : noiMarginR >= 0.35 ? 6 : 2;
    totalPoints += pts;
    maxPoints += 10;
    scoreRows.push({
      label: "NOI Margin",
      value: formatPercent1(noiMarginR),
      pts,
      max: 10,
      band: noiMarginR > 0.45 ? "Above 45%" : noiMarginR >= 0.35 ? "35–45%" : "Below 35%",
    });
  }
  if (Number.isFinite(execOccupancy)) {
    const pts = execOccupancy > 0.95 ? 10 : execOccupancy >= 0.85 ? 7 : 4;
    totalPoints += pts;
    maxPoints += 10;
    scoreRows.push({
      label: "Occupancy Rate",
      value: formatPercent1(execOccupancy),
      pts,
      max: 10,
      band: execOccupancy > 0.95 ? "Above 95%" : execOccupancy >= 0.85 ? "85–95%" : "Below 85%",
    });
  }
  if (Number.isFinite(breakEvenOccR)) {
    const pts = breakEvenOccR < 0.70 ? 10 : breakEvenOccR <= 0.80 ? 6 : 2;
    totalPoints += pts;
    maxPoints += 10;
    scoreRows.push({
      label: "Break-Even Occupancy",
      value: formatPercent1(breakEvenOccR),
      pts,
      max: 10,
      band: breakEvenOccR < 0.70 ? "Below 70%" : breakEvenOccR <= 0.80 ? "70–80%" : "Above 80%",
    });
  }
  if (Number.isFinite(marketRentPremiumRatio) && !Number.isNaN(marketRentPremiumRatio)) {
    const pct = marketRentPremiumRatio * 100;
    const pts = pct > 15 ? 10 : pct >= 5 ? 7 : 4;
    totalPoints += pts;
    maxPoints += 10;
    scoreRows.push({
      label: "Rent-to-Market Gap",
      value: formatPercent1(marketRentPremiumRatio),
      pts,
      max: 10,
      band: pct > 15 ? ">15% upside" : pct >= 5 ? "5–15% upside" : "<5% upside",
    });
  }

  let hasDscrScore = false;
  let computedDscrForVerdict = null;
  let currentDebtScorecardEntry = null;
  if (!launchMemoMode) {
    currentDebtScorecardEntry = buildCurrentDebtScorecardEntry({
      currentDebtState: currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Payload,
    });
    const currentDebtCoverage = currentDebtScorecardEntry.currentDebtCoverage;
    if (currentDebtScorecardEntry.hasDscrScore) {
      computedDscrForVerdict = coerceNumber(currentDebtCoverage.dscr);
      totalPoints += currentDebtScorecardEntry.scoreRow.pts;
      maxPoints += currentDebtScorecardEntry.scoreRow.max;
      scoreRows.push(currentDebtScorecardEntry.scoreRow);
      hasDscrScore = true;
    } else if (currentDebtScorecardEntry.scoreRow) {
      scoreRows.push(currentDebtScorecardEntry.scoreRow);
    }
  }

  if (!(scoreRows.length >= 4 && maxPoints > 0)) {
    return {
      scoreRows,
      score: null,
      hasDscrScore,
      computedDscrForVerdict,
      currentDebtScorecardEntry,
      summaryLabel: launchMemoBaseLabel || null,
      scorecardLabel: launchMemoBaseLabel || null,
      dealScoreTableHtml: "",
      coverageLabel: null,
      coverClassificationLabel: null,
      visibleClassificationLabel: null,
      classificationLabel: null,
      verdictLabel: null,
    };
  }
  const score = Math.round((totalPoints / maxPoints) * 100);
  const normalizedScore = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
  const verdictLabel = normalizedScore >= 80 ? "Strong" : normalizedScore >= 60 ? "Constrained" : "Fragile";
  const summaryLabel = launchMemoBaseLabel || null;
  const coverClassificationLabel = buildCanonicalVisibleClassificationState({
    reportType: "underwriting",
    reportTier: 2,
    baseLabel: verdictLabel,
    sourceReconciliationCapActive: Boolean(sourceReconciliationState?.source_reconciliation_cap_active),
    coreSupportInsufficient: Boolean(sourceReconciliationState?.core_support_insufficient),
    debtCoverageConstraintActive: Boolean(computedDscrForVerdict && computedDscrForVerdict < 1.25),
  }).label;
  const dealScoreTableHtml = `<table><tbody>${scoreRows.map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td><td>${row.pts}</td></tr>`).join("")}</tbody></table>`;
  return {
    scoreRows,
    score: normalizedScore,
    hasDscrScore,
    computedDscrForVerdict,
    currentDebtScorecardEntry,
    summaryLabel,
    scorecardLabel: summaryLabel,
    dealScoreTableHtml,
    coverageLabel: coverClassificationLabel,
    coverClassificationLabel,
    visibleClassificationLabel: coverClassificationLabel,
    classificationLabel: coverClassificationLabel,
    verdictLabel,
  };
}

export function normalizeAcquisitionFinancingArtifactPayload(payload = null) {
  if (!payload || typeof payload !== "object") return payload;
  const normalized = { ...payload };
  const rendererDerivedFields = { ...(normalized._renderer_derived_fields || {}) };
  const setDerivedField = (key, value) => {
    if (Number.isFinite(coerceNumber(value)) && coerceNumber(value) > 0) {
      rendererDerivedFields[key] = coerceNumber(value);
    }
  };
  const firstFinite = (...values) => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const parseMoneyFromCapture = (rawValue) => {
    if (typeof rawValue !== "string") return null;
    const numeric = Number(rawValue.replace(/[$,\s]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };
  const extractPurchasePriceFromText = (text) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const patterns = [
      /price\s*ref[^0-9$]{0,12}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /(?:at|based on)\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*purchase price/i,
      /(?:purchase|acquisition|asking)\s*price[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /([0-9][0-9,]*(?:\.[0-9]+)?)\s*purchase price/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const parsed = parseMoneyFromCapture(match?.[1] ?? null);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const extractLoanAmountFromText = (text) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const patterns = [
      /price\s*ref[^\n]{0,80}?loan[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /loan amount\s*\([^)]*\)\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /(?:loan amount|mortgage amount|proposed loan amount|acquisition loan amount|proposed loan|acquisition loan)[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /([0-9][0-9,]*(?:\.[0-9]+)?)\s*loan/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const parsed = parseMoneyFromCapture(match?.[1] ?? null);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const extractPercentFromText = (text, labelRegex) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const directPattern = new RegExp(`(?:${labelRegex.source})[^0-9\\n]{0,20}([0-9]+(?:\\.[0-9]+)?)\\s*%`, "i");
    const reversePattern = new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*%[^\\n]{0,20}(?:${labelRegex.source})`, "i");
    const directMatch = text.match(directPattern);
    const reverseMatch = text.match(reversePattern);
    const parsed = Number(directMatch?.[1] ?? reverseMatch?.[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed / 100 : null;
  };
  const extractYearsFromText = (text, labelRegex) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const directPattern = new RegExp(`(?:${labelRegex.source})[^0-9\\n]{0,20}([0-9]{1,2}(?:\\.[0-9]+)?)`, "i");
    const reversePattern = new RegExp(`([0-9]{1,2}(?:\\.[0-9]+)?)\\s*(?:years?|yrs?)?[^\\n]{0,20}(?:${labelRegex.source})`, "i");
    const directMatch = text.match(directPattern);
    const reverseMatch = text.match(reversePattern);
    const parsed = Number(directMatch?.[1] ?? reverseMatch?.[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const materiallyDifferentAmount = (left, right) => {
    const a = coerceNumber(left);
    const b = coerceNumber(right);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    const scale = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) > Math.max(100, scale * 0.02);
  };
  const rawText = [
    normalized?.source_text,
    normalized?.raw_text,
    normalized?.extracted_text,
    normalized?.notes,
    normalized?.closing_cost_notes,
    normalized?.acquisition_support?.source_text,
    normalized?.acquisition_support?.raw_text,
    normalized?.acquisition_support?.extracted_text,
    normalized?.acquisition_support?.notes,
    normalized?.acquisition_support?.closing_cost_notes,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");
  const explicitPurchasePriceFromText = extractPurchasePriceFromText(rawText);
  const explicitLoanAmountFromText = extractLoanAmountFromText(rawText);
  const purchasePrice = firstFinite(
    normalized.purchase_price,
    normalized.purchasePrice,
    normalized.acquisition_price,
    normalized.purchase_price_amount
  );
  const statedLoanAmount = firstFinite(
    normalized.stated_acquisition_loan_amount,
    normalized.loan_amount,
    normalized.proposed_loan_amount,
    normalized.acquisition_loan_amount
  );
  const resolvedStatedLoanAmount = statedLoanAmount;
  let resolvedPurchasePrice = purchasePrice;
  setDerivedField("purchase_price_from_text", explicitPurchasePriceFromText);
  setDerivedField("stated_acquisition_loan_amount_from_text", explicitLoanAmountFromText);
  if (
    Number.isFinite(explicitPurchasePriceFromText) &&
    explicitPurchasePriceFromText > 0 &&
    Number.isFinite(resolvedStatedLoanAmount) &&
    resolvedStatedLoanAmount > 0 &&
    !materiallyDifferentAmount(resolvedPurchasePrice, resolvedStatedLoanAmount) &&
    materiallyDifferentAmount(explicitPurchasePriceFromText, resolvedStatedLoanAmount)
  ) {
    setDerivedField("purchase_price_from_text", explicitPurchasePriceFromText);
  }
  if (Number.isFinite(resolvedPurchasePrice) && resolvedPurchasePrice > 0) {
    normalized.purchase_price = resolvedPurchasePrice;
  }
  if (Number.isFinite(resolvedStatedLoanAmount) && resolvedStatedLoanAmount > 0) {
    normalized.stated_acquisition_loan_amount = resolvedStatedLoanAmount;
    normalized.loan_amount = resolvedStatedLoanAmount;
  }
  const lenderFeePercent = firstFinite(
    normalized.lender_fee_percent,
    normalized.financing_fee_percent,
    normalized.origination_fee_percent,
    extractPercentFromText(rawText, /(lender fee|financing fee|origination fee)/)
  );
  const lenderFeeFallbackMatch =
    typeof rawText === "string"
      ? rawText.match(/(?:lender fee|financing fee|origination fee)[^0-9\n]{0,20}([0-9]+(?:\.[0-9]+)?)\s*%/i)
      : null;
  const lenderFeeFallback = Number(lenderFeeFallbackMatch?.[1]);
  const resolvedLenderFeePercent =
    Number.isFinite(lenderFeePercent) && lenderFeePercent > 0
      ? lenderFeePercent
      : Number.isFinite(lenderFeeFallback) && lenderFeeFallback > 0
      ? lenderFeeFallback / 100
      : null;
  const hasExplicitLenderFeePercent = Number.isFinite(
    firstFinite(
      normalized.lender_fee_percent,
      normalized.financing_fee_percent,
      normalized.origination_fee_percent
    )
  );
  setDerivedField("lender_fee_percent_from_text", resolvedLenderFeePercent);
  if (hasExplicitLenderFeePercent && Number.isFinite(resolvedLenderFeePercent) && resolvedLenderFeePercent > 0) {
    normalized.lender_fee_percent = resolvedLenderFeePercent;
  }
  const closingCostNotes = String(normalized.closing_cost_notes || "");
  const hasLegalAppraisalMention = /legal|appraisal/i.test(`${closingCostNotes} ${rawText}`);
  const closingCostsPercent = coerceNumber(normalized.closing_costs_percent);
  if (!Number.isFinite(closingCostsPercent) || closingCostsPercent <= 0) {
    delete normalized.closing_costs_percent;
    if (hasLegalAppraisalMention && !/not quantified/i.test(closingCostNotes)) {
      normalized.closing_cost_notes = [closingCostNotes.trim(), "Legal/appraisal costs noted; not quantified."]
        .filter(Boolean)
        .join(" ");
    }
  }
  const ltv = coerceNumber(normalized.ltv);
  if ((!Number.isFinite(ltv) || ltv <= 0) && typeof rawText === "string" && rawText.length > 0) {
    const ltvPattern = /(?:\bltv\b|loan[-\s]*to[-\s]*value)[^0-9\n]{0,20}([0-9]+(?:\.[0-9]+)?)\s*%/i;
    const reverseLtvPattern = /([0-9]+(?:\.[0-9]+)?)\s*%[^\n]{0,20}(?:\bltv\b|loan[-\s]*to[-\s]*value)/i;
    const ltvMatch = rawText.match(ltvPattern) || rawText.match(reverseLtvPattern);
    const ltvFromText = Number(ltvMatch?.[1]);
    if (Number.isFinite(ltvFromText) && ltvFromText > 0) normalized.ltv = ltvFromText / 100;
  }
  const ratePattern = /(?:interest rate|\brate\b)[^0-9\n]{0,20}([0-9]+(?:\.[0-9]+)?)\s*%/i;
  const reverseRatePattern = /([0-9]+(?:\.[0-9]+)?)\s*%[^\n]{0,20}(?:interest rate|\brate\b)/i;
  const rateMatch = rawText.match(ratePattern) || rawText.match(reverseRatePattern);
  const rateFromText = Number(rateMatch?.[1]);
  if ((!Number.isFinite(coerceNumber(normalized.interest_rate)) || coerceNumber(normalized.interest_rate) <= 0) && Number.isFinite(rateFromText) && rateFromText > 0) {
    normalized.interest_rate = rateFromText / 100;
  }
  const amortPattern = /(?:amortization|amort|am\b)[^0-9\n]{0,20}([0-9]{1,2}(?:\.[0-9]+)?)/i;
  const reverseAmortPattern = /([0-9]{1,2}(?:\.[0-9]+)?)\s*(?:years?|yrs?)?[^\n]{0,20}(?:amortization|amort|am\b)/i;
  const amortMatch = rawText.match(amortPattern) || rawText.match(reverseAmortPattern);
  const amortYearsFromText = Number(amortMatch?.[1]);
  if ((!Number.isFinite(coerceNumber(normalized.amortization_years)) || coerceNumber(normalized.amortization_years) <= 0) && Number.isFinite(amortYearsFromText) && amortYearsFromText > 0) {
    normalized.amortization_years = amortYearsFromText;
  }
  const computedFromPurchaseAndLtv =
    Number.isFinite(resolvedPurchasePrice) &&
    resolvedPurchasePrice > 0 &&
    Number.isFinite(coerceNumber(normalized.ltv)) &&
    coerceNumber(normalized.ltv) > 0
      ? resolvedPurchasePrice * coerceNumber(normalized.ltv)
      : null;
  setDerivedField("derived_acquisition_loan_amount_from_purchase_ltv", computedFromPurchaseAndLtv);
  if (!Number.isFinite(resolvedStatedLoanAmount) || resolvedStatedLoanAmount <= 0) {
    // Preserve parsed/source provenance. Derived values remain in renderer metadata only.
  } else {
    if (
      Number.isFinite(computedFromPurchaseAndLtv) &&
      computedFromPurchaseAndLtv > 0 &&
      materiallyDifferentAmount(resolvedStatedLoanAmount, computedFromPurchaseAndLtv)
    ) {
      normalized.acquisition_limitation_reason_code = "stated_vs_purchase_ltv_mismatch";
    } else {
      delete normalized.acquisition_limitation_reason_code;
    }
  }
  if (Object.keys(rendererDerivedFields).length > 0) {
    normalized._renderer_derived_fields = rendererDerivedFields;
  }
  return normalized;
}

export function resolveCanonicalLoanTermSheetArtifacts(loanArtifacts = []) {
  const rows = Array.isArray(loanArtifacts) ? loanArtifacts : [];
  if (rows.length === 0) {
    return {
      currentDebtArtifact: null,
      acquisitionArtifact: null,
      currentDebtPayload: null,
      acquisitionPayload: null,
    };
  }
  const hasExplicitCurrentDebtProof = (payload = {}) => {
    const role = String(payload?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(payload?.debt_basis || "").trim().toLowerCase();
    const hasCurrentBalance =
      isFinitePositive(payload?.outstanding_balance) ||
      isFinitePositive(payload?.current_outstanding_balance) ||
      isFinitePositive(payload?.current_loan_balance);
    const currentDebtRole = [
      "current_mortgage_statement",
      "current_debt_terms",
      "mortgage_statement",
    ].includes(role);
    const neutralLoanTermRole = ["loan_term_sheet", ""].includes(role);
    const currentDebtBasis = /(current|existing|mortgage)/.test(debtBasis) && !/acquisition|proposed|purchase/.test(debtBasis);
    return Boolean(
      (hasCurrentBalance && (currentDebtRole || currentDebtBasis || (neutralLoanTermRole && !/acquisition|proposed|purchase/.test(debtBasis)))) ||
      currentDebtRole ||
      currentDebtBasis
    );
  };
  const hasAcquisitionOnlySignals = (payload = {}) => {
    const role = String(payload?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(payload?.debt_basis || "").trim().toLowerCase();
    const hasAcquisitionTerms =
      isFinitePositive(payload?.purchase_price) ||
      isFinitePositive(payload?.derived_acquisition_loan_amount) ||
      isFinitePositive(payload?.ltv) ||
      isFinitePositive(payload?.stated_acquisition_loan_amount) ||
      role === "purchase_assumptions" ||
      role.includes("acquisition") ||
      debtBasis.includes("acquisition") ||
      debtBasis.includes("proposed") ||
      debtBasis.includes("purchase");
    return Boolean(hasAcquisitionTerms && !hasExplicitCurrentDebtProof(payload));
  };
  const scored = rows.map((row, index) => {
    const payload = normalizeAcquisitionFinancingArtifactPayload(
      row?.payload && typeof row.payload === "object" ? row.payload : {}
    );
    const role = String(payload?.semantic_doc_role || "").trim().toLowerCase();
    const debtBasis = String(payload?.debt_basis || "").trim().toLowerCase();
    const hasBalance =
      isFinitePositive(payload?.outstanding_balance) ||
      isFinitePositive(payload?.current_outstanding_balance) ||
      isFinitePositive(payload?.current_loan_balance);
    const hasTerms =
      isFinitePositive(payload?.interest_rate) ||
      isFinitePositive(payload?.amortization_years) ||
      isFinitePositive(payload?.amort_years) ||
      isFinitePositive(payload?.ltv) ||
      isFinitePositive(payload?.monthly_payment) ||
      isFinitePositive(payload?.annual_debt_service);
    const hasAcquisitionSignals =
      isFinitePositive(payload?.purchase_price) ||
      isFinitePositive(payload?.going_in_cap_rate) ||
      isFinitePositive(payload?.derived_acquisition_loan_amount) ||
      debtBasis.includes("acquisition") ||
      role === "purchase_assumptions" ||
      role.includes("acquisition") ||
      role.includes("appraisal");
    const supportsCurrentDebtRole = [
      "current_mortgage_statement",
      "current_debt_terms",
      "mortgage_statement",
      "loan_term_sheet",
      "",
    ].includes(role);
    const explicitCurrentDebtProof = hasExplicitCurrentDebtProof(payload);
    const acquisitionOnlySignals = hasAcquisitionOnlySignals(payload);
    const currentDebtScore =
      (hasBalance ? 400 : 0) +
      (supportsCurrentDebtRole ? 150 : 0) +
      (hasTerms ? 40 : 0) +
      (role ? 30 : 20) -
      (hasAcquisitionSignals && !hasBalance ? 80 : 0) -
      (debtBasis.includes("acquisition") ? 80 : 0) +
      (explicitCurrentDebtProof ? 220 : 0) -
      (acquisitionOnlySignals ? 500 : 0);
    const acquisitionScore =
      (hasAcquisitionSignals ? 240 : 0) +
      (role === "purchase_assumptions" || role.includes("acquisition") ? 120 : 0) +
      (isFinitePositive(payload?.derived_acquisition_loan_amount) ? 100 : 0) +
      (debtBasis.includes("acquisition") ? 100 : 0);
    return { row, index, currentDebtScore, acquisitionScore, payload, explicitCurrentDebtProof, acquisitionOnlySignals };
  });
  const currentDebtCandidate = [...scored].sort((a, b) => b.currentDebtScore - a.currentDebtScore || a.index - b.index)[0] || null;
  const currentDebtArtifact =
    currentDebtCandidate &&
    currentDebtCandidate.currentDebtScore > 0 &&
    !currentDebtCandidate.acquisitionOnlySignals &&
    currentDebtCandidate.explicitCurrentDebtProof
      ? currentDebtCandidate.row
      : null;
  const acquisitionArtifact =
    [...scored].sort((a, b) => b.acquisitionScore - a.acquisitionScore || a.index - b.index)[0]?.row ||
    currentDebtArtifact ||
    rows[0] ||
    null;
  return {
    currentDebtArtifact,
    acquisitionArtifact,
    currentDebtPayload: normalizeAcquisitionFinancingArtifactPayload(currentDebtArtifact?.payload || null),
    acquisitionPayload: normalizeAcquisitionFinancingArtifactPayload(acquisitionArtifact?.payload || null),
  };
}

export function resolveCanonicalT12GprValue(t12Payload = null) {
  return coerceNumber(
    t12Payload?.gross_potential_rent ??
      t12Payload?.gross_scheduled_rent
  );
}

export function resolveOccupancyNoteValue(computedRentRoll = null, rentRollPayload = null) {
  const isPartialSample =
    computedRentRoll?.is_partial_sample === true ||
    rentRollPayload?.is_partial_sample === true;
  const hasTrustedSummaryTotals =
    rentRollPayload?.totals?.summary_row_detected === true ||
    rentRollPayload?.summary_row_detected === true ||
    computedRentRoll?.summary_row_detected === true;
  if (isPartialSample && !hasTrustedSummaryTotals) {
    return DATA_NOT_AVAILABLE;
  }
  if (computedRentRoll && (computedRentRoll.occupancy === null || computedRentRoll.occupancy === undefined)) {
    return DATA_NOT_AVAILABLE;
  }
  const trustedSummaryOccupancy = hasTrustedSummaryTotals
    ? coerceNumber(rentRollPayload?.totals?.occupancy ?? rentRollPayload?.occupancy)
    : null;
  return trustedSummaryOccupancy ?? computedRentRoll?.occupancy ?? rentRollPayload?.occupancy;
}

export function buildT12SummaryHtml(t12Payload, formatValue) {
  if (!t12Payload) return "";
  const canonicalGpr = resolveCanonicalT12GprValue(t12Payload);
  const rows = [
    ["Gross Potential Rent", canonicalGpr],
    ["Effective Gross Income", t12Payload.effective_gross_income],
    ["Total Operating Expenses", t12Payload.total_operating_expenses],
    ["Net Operating Income", t12Payload.net_operating_income],
  ];
  const rowHtml = rows
    .map(([label, value]) => {
      const display = Number.isFinite(Number(value)) ? formatValue(value) : "";
      return `<tr><td>${label}</td><td>${display}</td></tr>`;
    })
    .join("");
  const hasAny = rows.some(([, value]) => Number.isFinite(Number(value)));
  if (!hasAny) return "";
  return `<table><tr><th>Metric</th><th>Value</th></tr>${rowHtml}</table>`;
}

export function normalizeVisibleReportClassification({
  baseClass = null,
  effectiveReportMode = "screening_v1",
  sourceReconciliationCapActive = false,
  coreSupportInsufficient = false,
  debtCoverageConstraintActive = false,
} = {}) {
  const underwritingMode = String(effectiveReportMode || "").toLowerCase() === "v1_core";
  if (sourceReconciliationCapActive) {
    return "Review - Source Reconciliation Disclosure";
  }
  if (coreSupportInsufficient) {
    return "Review - Insufficient Core Support";
  }
  if (underwritingMode && debtCoverageConstraintActive) {
    return "Review - Debt Coverage Constraint";
  }
  if (baseClass === "Stable" || baseClass === "Sensitized" || baseClass === "Fragile") {
    return baseClass;
  }
  const state = buildCanonicalVisibleClassificationState({
    reportType: underwritingMode ? "underwriting" : "screening",
    reportTier: underwritingMode ? 2 : 1,
    baseLabel: baseClass,
    sourceReconciliationCapActive,
    coreSupportInsufficient,
    debtCoverageConstraintActive: underwritingMode && Boolean(debtCoverageConstraintActive),
  });
  return state.label;
}

export function alignDealScorecardVisibleClassificationHtml(dealScoreTableHtml, visibleClassificationLabel) {
  if (typeof dealScoreTableHtml !== "string" || !dealScoreTableHtml.trim()) return dealScoreTableHtml || "";
  if (typeof visibleClassificationLabel !== "string" || !visibleClassificationLabel.trim()) return dealScoreTableHtml;
  return dealScoreTableHtml.replace(
    /(<span style="font-size:24px;font-weight:800;color:#1F3A5F;letter-spacing:2px;">)([^<]*)(<\/span>)/i,
    `$1${escapeHtml(visibleClassificationLabel)}$3`
  );
}

export function shouldRenderCanonicalSection({
  sectionEligibility = null,
  sectionKey = "",
  rendererDefault = true,
} = {}) {
  const entry = sectionEligibility?.sections?.[sectionKey];
  if (!entry || typeof entry !== "object") return Boolean(rendererDefault);
  if (entry.source_constrained === true || entry.omitted === true) return false;
  if (entry.rendered === true || entry.eligible === true) return true;
  return Boolean(rendererDefault);
}

export function resolveMarketContextSectionVisibility({
  sectionEligibility = null,
  rendererDefault = false,
} = {}) {
  const keepMarketContext = shouldRenderCanonicalSection({
    sectionEligibility,
    sectionKey: "market_context",
    rendererDefault,
  });
  return {
    keepNeighborhood: keepMarketContext,
    keepLocationTable: keepMarketContext,
  };
}

export function resolveFinalRecommendationSectionVisibility({
  sectionEligibility = null,
  rendererDefault = false,
} = {}) {
  const sectionMap =
    sectionEligibility?.sections && typeof sectionEligibility.sections === "object"
      ? sectionEligibility.sections
      : null;
  if (!sectionMap) return Boolean(rendererDefault);
  const canonicalKeys = ["final_recommendation", "final_recommendations", "final_recs"];
  const canonicalKey =
    canonicalKeys.find((key) => sectionMap?.[key] && typeof sectionMap[key] === "object") || null;
  if (!canonicalKey) return Boolean(rendererDefault);
  return shouldRenderCanonicalSection({
    sectionEligibility,
    sectionKey: canonicalKey,
    rendererDefault,
  });
}

export function resolveDocumentSourcesSectionVisibility({
  sectionEligibility = null,
  sourceReconciliationState = null,
  effectiveReportMode = "screening_v1",
  hasDocSources = false,
} = {}) {
  if (effectiveReportMode === "screening_v1") return false;
  const hasCanonicalSectionEligibility = Boolean(
    sectionEligibility &&
      typeof sectionEligibility === "object" &&
      sectionEligibility.sections &&
      typeof sectionEligibility.sections === "object"
  );
  if (!hasCanonicalSectionEligibility) {
    return Boolean(hasDocSources);
  }
  const methodologyVisible = shouldRenderCanonicalSection({
    sectionEligibility,
    sectionKey: "methodology",
    rendererDefault: Boolean(hasDocSources),
  });
  const dataCoverageVisible = shouldRenderCanonicalSection({
    sectionEligibility,
    sectionKey: "data_coverage",
    rendererDefault: true,
  });
  const reconciliationPolicy =
    buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState);
  const canonicalTransparencyRequired =
    Boolean(dataCoverageVisible) ||
    Boolean(reconciliationPolicy?.data_coverage_required);
  return Boolean(methodologyVisible || canonicalTransparencyRequired);
}

export function shouldApplyTierOneStripCascade({
  effectiveReportMode = "screening_v1",
  reportType = null,
  reportTier = 1,
  sectionEligibility = null,
} = {}) {
  if (Number(reportTier) !== 1) return false;
  const normalizedMode = String(effectiveReportMode || "").trim().toLowerCase();
  const normalizedType = String(reportType || "").trim().toLowerCase();
  const screeningIntent = normalizedMode === "screening_v1" || normalizedType === "screening";
  if (!screeningIntent) return false;
  const sectionMap =
    sectionEligibility?.sections && typeof sectionEligibility.sections === "object"
      ? sectionEligibility.sections
      : null;
  if (!sectionMap) return true;
  const underwritingSectionKeys = [
    "scenario_analysis",
    "market_context",
    "risk_register",
    "renovation_strategy",
    "debt_structure",
    "deal_scorecard",
    "dcf",
    "advanced_modeling",
    "final_recommendation",
    "final_recommendations",
    "final_recs",
  ];
  const canonicalUnderwritingSectionVisible = underwritingSectionKeys.some((sectionKey) =>
    shouldRenderCanonicalSection({
      sectionEligibility,
      sectionKey,
      rendererDefault: false,
    })
  );
  return !canonicalUnderwritingSectionVisible;
}

export function shouldStripDataCoverageSectionByRenderedCopy({
  coverageSectionHtml = "",
  hasCanonicalCoverageAuthority = false,
} = {}) {
  if (hasCanonicalCoverageAuthority) return false;
  const coverageHtml = String(coverageSectionHtml || "");
  if (
    /<p class="subsection-title">\s*(Data Coverage \/ Source Reliability|Source Reliability)\s*<\/p>/i.test(coverageHtml) ||
    /<p class="subsection-title">\s*Document Treatment Summary\s*<\/p>/i.test(coverageHtml) ||
    /Data Coverage &amp; Source Limitations/i.test(coverageHtml) ||
    /Source Context \/ Support Document Treatment/i.test(coverageHtml) ||
    /T12 Operating Statement/i.test(coverageHtml) ||
    /Rent Roll/i.test(coverageHtml)
  ) {
    return false;
  }
  const dnaCount = (coverageHtml.match(/DATA NOT AVAILABLE/g) || []).length;
  return dnaCount >= 3;
}

function buildRentPositioningSummaryCard({
  title = "Rent Positioning Summary",
  body = "Verified rent-roll summary totals indicate in-place rents are below documented market rent.",
  totalUnits = null,
  occupiedUnits = null,
  occupancy = null,
  annualInPlace = null,
  annualMarket = null,
  formatCurrency,
} = {}) {
  const rows = [];
  const units = Number(totalUnits);
  const occupied = Number(occupiedUnits);
  const hasUnits = Number.isFinite(units) && units > 0;
  const hasOccupied = Number.isFinite(occupied) && occupied >= 0;
  const vacantUnits = hasUnits && hasOccupied ? Math.max(0, units - occupied) : null;
  const inPlace = Number(annualInPlace);
  const market = Number(annualMarket);
  const hasInPlace = Number.isFinite(inPlace);
  const hasMarket = Number.isFinite(market);
  if (hasInPlace) rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(inPlace)}</td></tr>`);
  if (hasMarket) rows.push(`<tr><td>Annual Market Rent</td><td>${formatCurrency(market)}</td></tr>`);
  if (hasInPlace && hasMarket && market > inPlace) {
    const annualUpside = market - inPlace;
    const rentGapPct = inPlace > 0 ? ((market - inPlace) / inPlace) * 100 : null;
    rows.push(`<tr><td>Annual Gross Rent Upside</td><td>${formatCurrency(annualUpside)}</td></tr>`);
    rows.push(`<tr><td>Rent Gap %</td><td>${Number.isFinite(rentGapPct) ? `${rentGapPct.toLocaleString("en-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : DATA_NOT_AVAILABLE}</td></tr>`);
  }
  if (hasUnits) rows.push(`<tr><td>Total Units</td><td>${Math.round(units)}</td></tr>`);
  if (hasOccupied) rows.push(`<tr><td>Occupied Units</td><td>${Math.round(occupied)}</td></tr>`);
  if (Number.isFinite(vacantUnits)) rows.push(`<tr><td>Vacant Units</td><td>${Math.round(vacantUnits)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td>${typeof occupancy === "string" ? occupancy : `${Math.round(Number(occupancy) * 100)}%`}</td></tr>`);
  const rowHtml = rows.join("");
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">${escapeHtml(title)}</p><table><tbody>${rowHtml}</tbody></table><p class="small" style="margin-top:8px;color:#64748b;">${escapeHtml(body)}</p></div>`;
}

export function collapseSummaryOnlyUnitMixSection(
  html,
  {
    summaryOnlyRentRollSurface = false,
    summaryTitle = "Rent Positioning Summary",
    summaryBody = "Verified rent-roll summary totals indicate in-place rents are below documented market rent.",
    summaryMetrics = {},
  } = {}
) {
  if (!summaryOnlyRentRollSurface) return html;
  const denseSummaryCard = buildRentPositioningSummaryCard({
    title: summaryTitle,
    body: summaryBody,
    totalUnits: summaryMetrics.totalUnits,
    occupiedUnits: summaryMetrics.occupiedUnits,
    occupancy: summaryMetrics.occupancy,
    annualInPlace: summaryMetrics.annualInPlace,
    annualMarket: summaryMetrics.annualMarket,
    formatCurrency: summaryMetrics.formatCurrency || ((value) => String(value)),
  });
  return String(html || "").replace(
    /<p class="subsection-title">Unit Mix and Rent Positioning<\/p>[\s\S]*?<table class="unit-mix-table">[\s\S]*?<\/table>/,
    denseSummaryCard
  );
}

export function stripThinSectionPages(html) {
  if (!html) return html;
  return String(html).replace(/<section class="section page-break">([\s\S]*?)<\/section>/gi, (match, inner) => {
    if (
      /<span class="section-header-title">\s*(Data Coverage &amp; Source Limitations|Source Context \/ Support Document Treatment)\s*<\/span>/i.test(inner) ||
      /<p class="subsection-title">\s*Document Treatment Summary\s*<\/p>/i.test(inner) ||
      /<p class="subsection-title">\s*(Data Coverage \/ Source Reliability|Source Reliability|Income Reconstruction|Operating Expenses|Expense Ratio Sensitivity|NOI Stability Review|Rent Roll Distribution)\s*<\/p>/i.test(inner)
    ) {
      return match;
    }
    const innerText = String(inner || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = innerText ? innerText.split(/\s+/).length : 0;
    const hasNonEmptyTable = /<table\b[\s\S]*?<tbody>[\s\S]*?<tr[\s\S]*?<\/tr>[\s\S]*?<\/tbody>[\s\S]*?<\/table>/i.test(inner);
    const hasDenseContent = /<(?:div class="card|div class='card'|img\b|ul\b|ol\b)/i.test(inner) || hasNonEmptyTable;
    const paragraphCount = (String(inner || "").match(/<p\b/gi) || []).length;
    const hasSectionHeader = /<div class="section-header">/i.test(inner);
    if (hasSectionHeader && !hasDenseContent && paragraphCount <= 1 && wordCount < 60) {
      return "";
    }
    return match;
  });
}

export function resolveCanonicalDataCoverageHeadlineState({
  dataCoverageState = null,
  sourceReconciliationState = null,
  sectionEligibility = null,
  effectiveReportMode = "screening_v1",
} = {}) {
  const canonicalHeadlineMode = typeof dataCoverageState?.headlineMode === "string"
    ? dataCoverageState.headlineMode
    : null;
  const canonicalSeverityState = typeof dataCoverageState?.severityState === "string"
    ? dataCoverageState.severityState
    : null;
  const fallbackHeadlineMode = effectiveReportMode === "v1_core" ? "underwriting_scope" : "screening_notes";
  const sourceConstrainedSectionCount = Number(
    dataCoverageState?.sectionConstrainedCount ??
    sectionEligibility?.source_constrained_section_count ??
    0
  );
  const fallbackSeverityState = buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required
    ? "source_reconciliation_disclosure"
    : sourceConstrainedSectionCount > 0
    ? "source_limitations_disclosure"
    : "core_inputs_confirmed";
  return {
    headlineMode: canonicalHeadlineMode || fallbackHeadlineMode,
    severityState: canonicalSeverityState || fallbackSeverityState,
    source: canonicalHeadlineMode || canonicalSeverityState ? "canonical" : "fallback",
  };
}

export function buildRendererCanonicalState({
  computedRentRoll = null,
  rentRollPayload = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  t12Payload = null,
  appraisalPayload = null,
  propertyTaxPayload = null,
  reportMode = null,
  reportType = null,
}) {
  const currentDebtAssessmentState = buildCurrentDebtAssessmentState({
    mortgagePayload,
    loanTermSheetTermsPayload,
    t12Noi: coerceNumber(t12Payload?.net_operating_income),
  });
  const sourceReportCoverageQa = {
    artifact_inventory: {
      t12_parsed: {
        present: Boolean(t12Payload),
        has_core_totals:
          Number.isFinite(coerceNumber(t12Payload?.gross_potential_rent)) ||
          Number.isFinite(coerceNumber(t12Payload?.effective_gross_income)) ||
          Number.isFinite(coerceNumber(t12Payload?.net_operating_income)),
      },
      rent_roll_parsed: {
        present: Boolean(computedRentRoll || rentRollPayload),
        total_units: coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units) ?? null,
        has_total_units: Number.isFinite(coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units)),
      },
      mortgage_statement_parsed: {
        present: Boolean(mortgagePayload),
        has_balance: Number.isFinite(coerceNumber(mortgagePayload?.outstanding_balance)),
        has_payment:
          Number.isFinite(coerceNumber(mortgagePayload?.monthly_payment)) ||
          Number.isFinite(coerceNumber(mortgagePayload?.annual_debt_service)),
        has_rate: Number.isFinite(coerceNumber(mortgagePayload?.interest_rate)),
        has_amortization: Number.isFinite(coerceNumber(mortgagePayload?.amort_years)),
      },
      loan_term_sheet_parsed: {
        present: Boolean(loanTermSheetTermsPayload),
        has_derived_acquisition_debt: Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.derived_acquisition_loan_amount)),
        has_purchase_price: Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price)),
        has_rate: Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.interest_rate)),
        has_amortization: Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.amortization_years ?? loanTermSheetTermsPayload?.amort_years)),
      },
      appraisal_parsed: {
        present: Boolean(appraisalPayload),
        has_appraised_value: Number.isFinite(coerceNumber(appraisalPayload?.appraised_value)),
        has_cap_rate: Number.isFinite(coerceNumber(appraisalPayload?.cap_rate)),
      },
      property_tax_parsed: {
        present: Boolean(propertyTaxPayload),
        has_annual_tax: isFinitePositive(propertyTaxPayload?.annual_tax),
      },
    },
    rendered_sections: {},
    deterministic_flags: [],
    rendered_text_signals: [],
    qa_status: "not_run",
  };
  const sourceReconciliationState = buildSourceReconciliationState({
    computedRentRoll,
    rentRollPayload,
    t12Payload,
    sourceReportCoverageQa,
  });
  const acquisitionAssumptionState = buildAcquisitionAssumptionState({
    loanTermSheetTermsPayload,
    sourceReportCoverageQa,
    currentDebtState: currentDebtAssessmentState,
  });
  const sectionEligibility = buildFullUnderwritingSectionEligibility({
    sourceReportCoverageQa: {
      artifact_inventory: sourceReportCoverageQa?.artifact_inventory || {},
      rendered_sections: sourceReportCoverageQa?.rendered_sections || {},
    },
    currentDebtState: currentDebtAssessmentState,
    sourceReconciliationState,
  });
  const refiDebtRenderState = buildRefiDebtRenderState({
    currentDebtAssessmentState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials: null,
    t12Payload,
  });
  const scorecardCoverageState = resolveCanonicalCurrentDebtScoreInputs({
    currentDebtState: currentDebtAssessmentState,
    mortgagePayload,
    t12Payload,
  });
  const underwritingState = buildFullUnderwritingState({
    reportMode,
    reportType,
    currentDebtAssessmentState,
    refiDebtRenderState,
    scorecardCoverageState,
    acquisitionAssumptionState,
    acquisitionTriangleValidationState: null,
    sourceReconciliationState,
    sectionEligibility,
    propertyTaxPayload,
  });
  return {
    currentDebtAssessmentState,
    sourceReportCoverageQa,
    sourceReconciliationState,
    acquisitionAssumptionState,
    sectionEligibility,
    underwritingState,
  };
}
