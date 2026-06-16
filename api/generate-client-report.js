// api/generate-client-report.js
import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";
import { ensureSentenceIntegrity } from "../src/lib/sentenceIntegrity.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; // DocRaptor
import { createClient } from "@supabase/supabase-js";
import { INVESTORIQ_MASTER_PROMPT_V71 } from "../lib/investoriqMasterPromptV71.js";
import { runRenderedReportQaAdvisory } from "./_lib/qa-review.js";
import { runSourcePackageQaAdvisory } from "./_lib/source-package-qa.js";
import { runQaManagerReview } from "./_lib/qa-manager-review.js";
import { buildQaDirectorReview } from "./_lib/qa-director-review.js";
import { buildReportContractQa } from "./_lib/report-contract-qa.js";
import { buildSourceReportCoverageQa } from "./_lib/source-report-coverage-qa.js";
import { buildQaFixRouting } from "./_lib/qa-fix-routing.js";
import { buildQaActionPlan, buildDeliveryGateDecision, buildCanonicalDeliveryDecisionState } from "./_lib/qa-action-plan.js";
import {
  buildAcquisitionAssumptionState,
  buildAssumptionAttributionState,
  buildCurrentDebtAssessmentState,
  buildCanonicalDisplayVerdictState,
  buildCanonicalVisibleClassificationState,
  buildFullUnderwritingSectionEligibility,
  dedupeRenovationMetricRows,
  formatAssumptionAttributionLabel,
  formatCurrentDebtAssessmentCopy,
  buildSourceReconciliationRenderState,
  buildSupportDocTaxonomyState,
  resolveCanonicalSupportDocAuthority,
  resolveCanonicalRentRollAnnualTotals,
  formatRenovationMetricValue,
  normalizeRenovationMetricKind,
  buildSourceReconciliationState,
  buildSourceReconciliationNarrativeProminencePolicy,
  sanitizeFinalCustomerHtml,
} from "./_lib/report-surface-contracts.js";
import { buildCanonicalSourcePackage } from "./_lib/canonical-source-package.js";
import { buildAcquisitionMemoProjection } from "./_lib/acquisition-memo-projection.js";
import { renderAcquisitionMemo } from "./_lib/acquisition-memo-renderer.js";
import { renderCompleteAcquisitionMemoV2Html } from "./_lib/acquisition-memo-v2-document.js";
import {
  buildDeliveryResponseCompatibilityAliases,
  buildReportStoragePath,
  assertValidReportPublicationInsert,
  sanitizeTypography,
} from "./_lib/report-delivery-output.js";
import {
  resolveReportTypeAndTier,
  constantTimeEqual,
} from "./_lib/report-request-context.js";
import {
  isNil,
  formatCurrency,
  formatPercent,
  formatPercent1,
  formatPercentExactDisplay,
  formatCapPercentExact,
  formatInterestRatePercent,
  formatMultiple,
  formatYears,
  formatDistanceKm,
  escapeHtml,
  replaceAll,
  sanitizeDisplayText,
  sanitizePropertyNameDisplayText,
} from "./_lib/report-formatting-helpers.js";
import { buildFullUnderwritingState } from "./_lib/full-underwriting-state.js";
// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
function normalizeVisibleReportClassification({
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
function resolveScreeningClassificationConsumerLabel({
  canonicalVisibleLabel = "",
  localVisibleLabel = "",
  screeningClass = "",
} = {}) {
  const approvedLabels = new Set([
    "Stable",
    "Sensitized",
    "Fragile",
    "Review - Source Reconciliation Disclosure",
    "Review - Insufficient Core Support",
    "Review - Debt Coverage Constraint",
  ]);
  const canonical = String(canonicalVisibleLabel || "").trim();
  if (approvedLabels.has(canonical)) return canonical;
  const local = String(localVisibleLabel || "").trim();
  if (approvedLabels.has(local)) return local;
  const screening = String(screeningClass || "").trim();
  if (approvedLabels.has(screening)) return screening;
  return "";
}
function alignDealScorecardVisibleClassificationHtml(dealScoreTableHtml, visibleClassificationLabel) {
  if (typeof dealScoreTableHtml !== "string" || !dealScoreTableHtml.trim()) return dealScoreTableHtml || "";
  if (typeof visibleClassificationLabel !== "string" || !visibleClassificationLabel.trim()) return dealScoreTableHtml;
  return dealScoreTableHtml.replace(
    /(<span style="font-size:24px;font-weight:800;color:#1F3A5F;letter-spacing:2px;">)([^<]*)(<\/span>)/i,
    `$1${escapeHtml(visibleClassificationLabel)}$3`
  );
}
const DATA_NOT_AVAILABLE = "Not assessed";
const SECTION_OMITTED = "Section intentionally omitted due to insufficient source data.";
const coerceNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, "").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};
function materiallyDifferent(a, b, absoluteTolerance = 10, relativeTolerance = 0.02) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  const delta = Math.abs(left - right);
  const scale = Math.max(Math.abs(left), Math.abs(right), 1);
  return delta > absoluteTolerance && delta / scale > relativeTolerance;
}
function resolveSafeAnnualRentTotal({
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
// LEGACY_DO_NOT_USE fallback.
// Allowed caller: resolveCanonicalCurrentDebtScoreInputs only.
// Never call directly from renderer/scorecard/table/report section paths.
function resolveLEGACY_DO_NOT_USE_MortgageDebtCoverageFallback(mortgagePayload, t12Noi) {
  const balance = coerceNumber(mortgagePayload?.outstanding_balance);
  const interestRatePct = coerceNumber(mortgagePayload?.interest_rate);
  const amortYears = coerceNumber(mortgagePayload?.amort_years);
  const sourceMonthlyPayment = coerceNumber(
    mortgagePayload?.monthly_payment ?? mortgagePayload?.monthly_debt_service
  );
  const sourceAnnualDebtService = coerceNumber(mortgagePayload?.annual_debt_service);
  const computedMonthlyPayment =
    Number.isFinite(balance) &&
    balance > 0 &&
    Number.isFinite(interestRatePct) &&
    interestRatePct > 0 &&
    Number.isFinite(amortYears) &&
    amortYears > 0
      ? balance * computeMortgageConstant(interestRatePct / 100, amortYears)
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
  const canonicalStatus = String(
    currentDebtState?.current_debt_dscr_status || ""
  ).trim().toLowerCase();
  const canonicalDscr = coerceNumber(currentDebtState?.current_debt_dscr);
  const canonicalAnnualDebtService = coerceNumber(
    currentDebtState?.current_debt_annual_debt_service
  );
  const canonicalHasSourcePayment = String(
    currentDebtState?.current_debt_service_source || ""
  )
    .trim()
    .toLowerCase() === "source_payment";
  if (
    canonicalStatus === "computed" &&
    Number.isFinite(canonicalDscr) &&
    canonicalDscr > 0
  ) {
    return {
      currentDebtCoverage: {
        balance: coerceNumber(currentDebtState?.current_debt_balance),
        hasVerifiedOutstandingBalance: Boolean(currentDebtState?.has_true_current_debt_balance),
        dscr: canonicalDscr,
        annualDebtService:
          Number.isFinite(canonicalAnnualDebtService) &&
          canonicalAnnualDebtService > 0
            ? canonicalAnnualDebtService
            : null,
        hasSourcePayment: canonicalHasSourcePayment,
      },
      usedCanonicalState: true,
    };
  }
  if (hasCanonicalDebtState) {
    // Canonical debt state exists and is not computed: do not allow legacy mortgage fallback
    // to produce rendered/customer DSCR truth.
    return {
      currentDebtCoverage: null,
      usedCanonicalState: true,
    };
  }
  // Legacy compatibility path for missing canonical state only.
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
function resolveCanonicalRefiDebtBasis({
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
function buildRefiDebtRenderState({
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
function resolveRefiNarrativeMode({
  refiDebtRenderState = null,
  hasComputedCurrentDebtDscr = false,
  hasCanonicalCurrentRefiDebtBasis = false,
  canRenderFullRefi = false,
} = {}) {
  if (canRenderFullRefi) {
    return {
      mode: "full_refi_assessed",
      classification: "assessed",
      copy: "Refinance stability and proceeds coverage were assessed from verified current debt inputs and deterministic refinance assumptions.",
    };
  }
  const status = String(refiDebtRenderState?.status || "").trim().toLowerCase();
  const disclosureReasonCode = String(refiDebtRenderState?.disclosureReasonCode || "").trim().toLowerCase();
  const currentDebtAssessed = Boolean(
    refiDebtRenderState?.status === "valid" &&
      (hasComputedCurrentDebtDscr ||
        (hasCanonicalCurrentRefiDebtBasis && refiDebtRenderState?.allowDebtMath === true))
  );
  if (currentDebtAssessed) {
    return {
      mode: "current_debt_coverage_assessed_full_refi_limited",
      classification: "source_limited",
      copy: "Current debt coverage was assessed from verified current debt inputs; advanced financing outputs remain source-limited because forward refinance assumptions were incomplete.",
    };
  }
  if (
    status === "not_assessed" &&
    (disclosureReasonCode === "acquisition_only_not_current_debt" || refiDebtRenderState?.isAcquisitionOnly)
  ) {
    return {
      mode: "no_current_debt_acquisition_only",
      classification: "not_assessed",
      copy: "Proposed acquisition financing was identified but is not current outstanding debt; current debt and refinance coverage were not assessed.",
    };
  }
  if (status === "source_limited") {
    return {
      mode: "source_limited_no_dscr",
      classification: "source_limited",
      copy: "Debt context was identified, but current debt coverage could not be assessed because verified current outstanding debt support was incomplete.",
    };
  }
  return {
    mode: "no_debt_inputs",
    classification: "not_assessed",
    copy: "Current debt and refinance analysis was omitted because no verified debt inputs were provided.",
  };
}
function buildCurrentDebtScorecardEntry({
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
        band: currentDebtCoverage.dscr > 1.35 ? "Above 1.35x" : currentDebtCoverage.dscr >= 1.25 ? "1.25\u20131.35x" : "Below 1.25x",
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
function buildDealScorecardState({
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
}) {
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
      band: expenseRatioR < 0.55 ? "Below 55%" : expenseRatioR <= 0.65 ? "55\u201365%" : "Above 65%",
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
      band: noiMarginR > 0.45 ? "Above 45%" : noiMarginR >= 0.35 ? "35\u201345%" : "Below 35%",
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
      band: execOccupancy > 0.95 ? "Above 95%" : execOccupancy >= 0.85 ? "85\u201395%" : "Below 85%",
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
      band: breakEvenOccR < 0.70 ? "Below 70%" : breakEvenOccR <= 0.80 ? "70\u201380%" : "Above 80%",
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
      band: pct > 15 ? ">15% upside" : pct >= 5 ? "5\u201315% upside" : "<5% upside",
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
      displayVerdict: null,
      dealScoreTableHtml: "",
    };
  }

  const score = Math.round((totalPoints / maxPoints) * 100);
  const sourceReconciliationConstrained = Boolean(
    buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required
  );
  const displayVerdict = launchMemoMode
    ? buildCanonicalVisibleClassificationState({
      reportType: "screening",
      reportTier: 1,
        baseLabel: launchMemoBaseLabel || "Stable",
        sourceReconciliationState,
        sourceReconciliationCapActive: sourceReconciliationConstrained,
        coreSupportInsufficient: false,
        debtCoverageConstraintActive: false,
      })
    : buildCanonicalDisplayVerdictState({
        score,
        hasDscrScore,
        currentDebtDscr: computedDscrForVerdict,
        sourceReconciliationState,
      });
  const rows = scoreRows.map((r) =>
    {
      const scoreDisplay = Number.isFinite(Number(r.max)) && Number(r.max) > 0
        ? `${r.pts}/${r.max}`
        : "N/A";
      return (
    `<tr>` +
    `<td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(r.label)}</td>` +
    `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(r.value)}</td>` +
    `<td style="padding:4px 8px;border:1px solid #E5E7EB;color:#3F5E84;">${escapeHtml(r.band)}</td>` +
    `<td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:700;">${scoreDisplay}</td>` +
    `</tr>`
      );
    }
  ).join("");
  const scoreLabel = sourceReconciliationConstrained ? "Operating Metrics Score" : "Composite Score";
  let note = launchMemoMode
    ? (sourceReconciliationConstrained
        ? "Operating metrics are shown with source reconciliation disclosure; advanced financing and return-projection modules are outside the Screening Report scope."
        : "Composite score reflects available operating metrics only. Base score thresholds: Stable 70+ | Sensitized 50-69 | Fragile <50.")
    : displayVerdict.cap_explanation ||
      "Composite score is calculated from reported metrics only. Base score thresholds: Within Underwriting Parameters \u2265 70 | Review 50\u201369 | Outside Parameters < 50. DSCR below 1.25x or not assessed applies a mandatory Review verdict cap.";
  if (!launchMemoMode && (sourceReconciliationConstrained || displayVerdict.cap_reason_code === "debt_coverage_constraint" || displayVerdict.cap_reason_code === "debt_coverage_not_assessed")) {
    const noteParts = [
      "Composite score reflects available operating, occupancy, rent-gap, and current-debt metrics only.",
    ];
    if (displayVerdict.cap_reason_code === "debt_coverage_constraint") {
      noteParts.push("Current debt DSCR is below 1.25x.");
    } else if (displayVerdict.cap_reason_code === "debt_coverage_not_assessed" || hasDscrScore === false) {
      noteParts.push("Current debt is not assessed.");
    }
    if (sourceReconciliationConstrained || displayVerdict.cap_reason_code === "source_reconciliation_disclosure") {
      noteParts.push("Rent-roll/T12 reconciliation remains unresolved.");
      noteParts.push("Classification is capped by source reconciliation.");
    }
    noteParts.push("This score reflects available operating metrics only and should not be read as an unconstrained investment score.");
    note = noteParts.join(" ");
  }
  const dealScoreTableHtml =
    `<div class="card no-break" style="margin-top:12px;">` +
    `<div style="text-align:center;padding:10px 0 14px;border-bottom:1px solid #E5E7EB;margin-bottom:12px;">` +
    `<span style="font-size:24px;font-weight:800;color:#1F3A5F;letter-spacing:2px;">${escapeHtml(displayVerdict.label)}</span>` +
    `<span style="display:block;font-size:12px;color:#3F5E84;margin-top:4px;">${scoreLabel}: ${score} / 100</span>` +
    `</div>` +
    `<table style="width:100%;border-collapse:collapse;font-size:11px;">` +
    `<thead><tr>` +
    `<th style="text-align:left;padding:4px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;">Factor</th>` +
    `<th style="text-align:right;padding:4px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;">Value</th>` +
    `<th style="padding:4px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;">Threshold</th>` +
    `<th style="text-align:center;padding:4px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;">Score</th>` +
    `</tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `<tfoot><tr style="background:#FFFFFF;font-weight:700;">` +
    `<td colspan="3" style="padding:4px 8px;border:1px solid #E5E7EB;">${scoreLabel} (normalized)</td>` +
    `<td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${score}/100</td>` +
    `</tr></tfoot>` +
    `</table>` +
    `<p class="small" style="margin-top:8px;color:#3F5E84;">${escapeHtml(note)}</p>` +
    `</div>`;

  return {
    scoreRows,
    score,
    hasDscrScore,
    computedDscrForVerdict,
    currentDebtScorecardEntry,
    displayVerdict,
    dealScoreTableHtml,
  };
}
function isFiniteNumber(x) {
  const n = Number(x);
  return Number.isFinite(n);
}
function isFinitePositive(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0;
}
// Returns true only when a parsed debt payload contains the minimum
// field set required to support debt-aware underwriting analysis.
// Prevents weak partial debt payloads from being treated as valid debt data
// and silently rendering DSCR / refinance content as if complete.
function hasUsableDebtPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const bal = Number(payload.outstanding_balance ?? payload.loan_amount ?? "");
  const rate = Number(payload.interest_rate ?? "");
  const amort = Number(payload.amort_years ?? "");
  const monthlyPayment = Number(payload.monthly_payment ?? "");
  const hasBalance = Number.isFinite(bal) && bal > 0;
  const hasRate = Number.isFinite(rate) && rate > 0;
  const hasAmort = Number.isFinite(amort) && amort > 0;
  const hasMonthlyPayment = Number.isFinite(monthlyPayment) && monthlyPayment > 0;
  return hasBalance && (hasMonthlyPayment || (hasRate && hasAmort));
}
function hasUsableCurrentMortgagePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const balance = Number(payload.outstanding_balance ?? "");
  const payment = Number(payload.monthly_payment ?? payload.monthly_debt_service ?? "");
  const annual = Number(payload.annual_debt_service ?? "");
  const rate = Number(payload.interest_rate ?? "");
  const amort = Number(payload.amort_years ?? "");
  const lender = String(payload.lender_name || "").trim();
  const maturity = String(payload.maturity_date || "").trim();
  return Boolean(
    (Number.isFinite(balance) && balance > 0) ||
    (Number.isFinite(payment) && payment > 0) ||
    (Number.isFinite(annual) && annual > 0) ||
    (Number.isFinite(rate) && rate > 0) ||
    (Number.isFinite(amort) && amort > 0) ||
    lender ||
    maturity
  );
}
function hasDebtTermsPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  return (
    isFinitePositive(payload.interest_rate) ||
    isFinitePositive(payload.amort_years) ||
    isFinitePositive(payload.ltv) ||
    isFinitePositive(payload.refi_cap_rate)
  );
}
function normalizeAcquisitionFinancingArtifactPayload(payload = null) {
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
      /price\s*ref[^\\n]{0,80}?loan[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
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
function resolveCanonicalLoanTermSheetArtifacts(loanArtifacts = []) {
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

function buildDocumentQuantitativeUsageMap({
  effectiveReportMode = "screening_v1",
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
} = {}) {
  const hasTrueCurrentDebtBalance = Boolean(currentDebtAssessmentState?.has_true_current_debt_balance);
  const currentDebtComputed = String(currentDebtAssessmentState?.current_debt_dscr_status || "").trim().toLowerCase() === "computed";
  const launchMemoMode = String(effectiveReportMode || "").toLowerCase() === "v1_core";
  const payloadHasCurrentDebtSignals = Boolean(
    isFinitePositive(mortgagePayload?.outstanding_balance) ||
    isFinitePositive(mortgagePayload?.current_outstanding_balance) ||
    isFinitePositive(mortgagePayload?.current_loan_balance) ||
    (!launchMemoMode && (
      isFinitePositive(loanTermSheetTermsPayload?.outstanding_balance) ||
      isFinitePositive(loanTermSheetTermsPayload?.current_outstanding_balance) ||
      isFinitePositive(loanTermSheetTermsPayload?.current_loan_balance)
    ))
  );
  const hasCurrentDebtQuantitativeUse =
    hasTrueCurrentDebtBalance ||
    currentDebtComputed ||
    payloadHasCurrentDebtSignals;
  if (!hasCurrentDebtQuantitativeUse) {
    return { rows: [] };
  }
  const normalizeIdentityToken = (value) => {
    const token = String(value ?? "").trim().toLowerCase();
    return token.length > 0 ? token : "";
  };
  const rows = [];
  const pushCurrentDebtUsage = (payload = null, sourceBasis = null) => {
    if (!payload || typeof payload !== "object") return;
    if (launchMemoMode && sourceBasis === "canonical_loan_term_sheet_payload") return;
    const idTokens = [
      payload?.source_file_id,
      payload?.file_id,
      payload?.document_id,
      payload?.artifact_file_id,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    const nameTokens = [
      payload?.source_original_filename,
      payload?.original_filename,
      payload?.file_name,
      payload?.filename,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    if (idTokens.length === 0 && nameTokens.length === 0) return;
    const usageFields = [
      isFinitePositive(payload?.outstanding_balance) || isFinitePositive(payload?.current_outstanding_balance) || isFinitePositive(payload?.current_loan_balance)
        ? "current_outstanding_balance"
        : null,
      isFinitePositive(payload?.interest_rate) ? "interest_rate" : null,
      isFinitePositive(payload?.amortization_years) || isFinitePositive(payload?.amort_years) ? "amortization_years" : null,
      isFinitePositive(payload?.monthly_payment) || isFinitePositive(payload?.annual_debt_service) ? "debt_service" : null,
      currentDebtComputed ? "current_debt_dscr_basis" : null,
    ].filter(Boolean);
    rows.push({
      usageType: "current_debt",
      source_basis: sourceBasis || "canonical_payload",
      fields_used: [...new Set(usageFields)],
      identity: {
        idTokens: new Set(idTokens),
        nameTokens: new Set(nameTokens),
      },
    });
  };
    pushCurrentDebtUsage(mortgagePayload, "canonical_mortgage_payload");
  pushCurrentDebtUsage(loanTermSheetTermsPayload, "canonical_loan_term_sheet_payload");
  return { rows };
}

function getReportQaStatus(flags) {
  const items = Array.isArray(flags) ? flags : [];
  if (items.some((flag) => flag?.severity === "critical")) {
    return { qa_status: "block", severity: "critical" };
  }
  if (items.some((flag) => flag?.severity === "high")) {
    return { qa_status: "admin_review", severity: "high" };
  }
  if (items.some((flag) => flag?.severity === "medium")) {
    return { qa_status: "warn", severity: "medium" };
  }
  if (items.some((flag) => flag?.severity === "low")) {
    return { qa_status: "warn", severity: "low" };
  }
  return { qa_status: "pass", severity: "none" };
}
function hasMinimumScreeningCoverage(t12Payload) {
  const gpr =
    t12Payload?.gross_potential_rent ??
    t12Payload?.gross_scheduled_rent ??
    t12Payload?.gross_income ??
    t12Payload?.total_income;
  const totalExp =
    t12Payload?.total_operating_expenses ??
    t12Payload?.total_expenses ??
    t12Payload?.expenses_total;
  const expenseLines =
    t12Payload?.expense_lines_found ??
    t12Payload?.expense_lines_count ??
    t12Payload?.expense_line_count;
  const hasCore = isFinitePositive(gpr) && isFiniteNumber(totalExp);
  const hasExpenseDetail = Number.isFinite(Number(expenseLines))
    ? Number(expenseLines) >= 3
    : isFinitePositive(totalExp);
  return hasCore && hasExpenseDetail;
}
function computeMortgageConstant(rateAnnual, amortYears) {
  const r = Number(rateAnnual);
  const years = Number(amortYears);
  if (!Number.isFinite(r) || !Number.isFinite(years) || years <= 0) return null;
  const n = years * 12;
  const rm = r / 12;
  if (rm === 0) return 12 / n;
  const denominator = 1 - (1 + rm) ** -n;
  if (!Number.isFinite(denominator) || denominator <= 0) return null;
  const pm = rm / denominator;
  const mc = pm * 12;
  return Number.isFinite(mc) && mc > 0 ? mc : null;
}
function toRateRatio(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n / 100 : n; // treat 5.25 as 5.25% => 0.0525
}
function toCapRatio(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n / 100 : n; // treat 6.0 as 6.0% => 0.06
}
function buildRefiStabilityModel({
  financials,
  t12Payload,
  formatValue,
  currentDebtState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
}) {
  const f = financials && typeof financials === "object" ? financials : {};
  const refiDebtRenderState = buildRefiDebtRenderState({
    currentDebtAssessmentState: currentDebtState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials: f,
    t12Payload,
  });
  if (!refiDebtRenderState.allowDebtMath) {
    return { tier: null, evidence: null, html: "" };
  }
  const canonicalRefiDebtBasis = refiDebtRenderState.canonicalRefiDebtBasis;
  const debtBalance = coerceNumber(canonicalRefiDebtBasis.debtBalance);
  const ltvMaxRaw = coerceNumber(f.refi_ltv_max);
  const ltvMax = Number.isFinite(ltvMaxRaw) && ltvMaxRaw > 1.5 ? ltvMaxRaw / 100 : ltvMaxRaw;
  const dscrMin = coerceNumber(f.refi_dscr_min);
  const interestRateRaw = coerceNumber(canonicalRefiDebtBasis.interestRatePct ?? f.refi_interest_rate);
  const amortYears = coerceNumber(canonicalRefiDebtBasis.amortYears ?? f.refi_amort_years);
  const capRateBaseRaw = coerceNumber(f.refi_cap_rate_base);
  const interestRate = toRateRatio(interestRateRaw);
  const capRateBase = toCapRatio(capRateBaseRaw);
  const explicitNoiBase = coerceNumber(f.noi_base);
  const noiFromT12 = coerceNumber(t12Payload?.net_operating_income);
  const noiBase = Number.isFinite(explicitNoiBase) ? explicitNoiBase : noiFromT12;
  const stressNoiShocksRaw = f.stress_noi_shocks;
  const stressCapRateBpsRaw = f.stress_cap_rate_bps;
  const stressRateBpsRaw = f.stress_rate_bps;
  const stressNoiShocks = Array.isArray(stressNoiShocksRaw)
    ? stressNoiShocksRaw.map((v) => coerceNumber(v))
    : null;
  const stressCapRateBps = Array.isArray(stressCapRateBpsRaw)
    ? stressCapRateBpsRaw.map((v) => coerceNumber(v))
    : null;
  const stressRateBps = Array.isArray(stressRateBpsRaw)
    ? stressRateBpsRaw.map((v) => coerceNumber(v))
    : null;
  const requiredScalars = [
    debtBalance,
    ltvMax,
    dscrMin,
    interestRate,
    amortYears,
    capRateBase,
    noiBase,
  ];
  const hasValidScalars =
    requiredScalars.every((v) => Number.isFinite(v)) &&
    debtBalance > 0 &&
    ltvMax > 0 &&
    dscrMin > 0 &&
    amortYears > 0 &&
    capRateBase > 0 &&
    noiBase > 0;
  const hasValidStressArrays =
    Array.isArray(stressNoiShocks) &&
    stressNoiShocks.length > 0 &&
    stressNoiShocks.every((v) => Number.isFinite(v)) &&
    Array.isArray(stressCapRateBps) &&
    stressCapRateBps.length > 0 &&
    stressCapRateBps.every((v) => Number.isFinite(v)) &&
    Array.isArray(stressRateBps) &&
    stressRateBps.length > 0 &&
    stressRateBps.every((v) => Number.isFinite(v));
  if (!hasValidScalars || !hasValidStressArrays) {
    return { tier: null, evidence: null, html: "" };
  }
  const baseMc = computeMortgageConstant(interestRate, amortYears);
  const baseCap = capRateBase;
  if (!Number.isFinite(baseMc) || !Number.isFinite(baseCap) || baseCap <= 0) {
    return { tier: null, evidence: null, html: "" };
  }
  const baseValue = noiBase / baseCap;
  const baseLoanLtv = baseValue * ltvMax;
  const baseLoanDscr = noiBase / (dscrMin * baseMc);
  const baseMaxProceeds = Math.min(baseLoanLtv, baseLoanDscr);
  const coverageBase = baseMaxProceeds / debtBalance;
  const baseBinding =
    baseLoanLtv <= baseLoanDscr ? "LTV-limited" : "DSCR-limited";
  if (!Number.isFinite(coverageBase)) {
    return { tier: null, evidence: null, html: "" };
  }
  const stressPoints = [];
  for (const noiShock of stressNoiShocks) {
    for (const capBps of stressCapRateBps) {
      for (const rateBps of stressRateBps) {
        const noi = noiBase * (1 + noiShock);
        const cap = capRateBase + capBps / 10000;
        const rate = interestRate + rateBps / 10000;
        const mc = computeMortgageConstant(rate, amortYears);
        let maxProceeds = 0;
        let coverage = Number.NEGATIVE_INFINITY;
        if (Number.isFinite(noi) && Number.isFinite(cap) && Number.isFinite(mc) && noi > 0 && cap > 0) {
          const value = noi / cap;
          const loanLtv = value * ltvMax;
          const loanDscr = noi / (dscrMin * mc);
          maxProceeds = Math.min(loanLtv, loanDscr);
          coverage = maxProceeds / debtBalance;
        }
        stressPoints.push({
          noiShock,
          capBps,
          rateBps,
          proceeds: maxProceeds,
          coverage,
        });
      }
    }
  }
  const coverageWorst = stressPoints.reduce(
    (minCoverage, point) =>
      point.coverage < minCoverage ? point.coverage : minCoverage,
    Number.POSITIVE_INFINITY
  );
  const worstFiniteCoverage = Number.isFinite(coverageWorst)
    ? coverageWorst
    : Number.NEGATIVE_INFINITY;
  const worstPoint = stressPoints
    .slice()
    .sort((a, b) => a.coverage - b.coverage)[0] || null;
  const worstNoiShockText =
    worstPoint && Number.isFinite(worstPoint.noiShock)
      ? formatPercent1(worstPoint.noiShock)
      : DATA_NOT_AVAILABLE;
  const worstCapBpsText =
    worstPoint && Number.isFinite(Number(worstPoint.capBps))
      ? `${Math.round(Number(worstPoint.capBps))} bps`
      : DATA_NOT_AVAILABLE;
  const worstRateBpsText =
    worstPoint && Number.isFinite(Number(worstPoint.rateBps))
      ? `${Math.round(Number(worstPoint.rateBps))} bps`
      : DATA_NOT_AVAILABLE;
  const worstDriverTripleText = `${worstNoiShockText} | ${worstCapBpsText} | ${worstRateBpsText}`;
  let worstNoi = null;
  let worstCap = null;
  let worstRate = null;
  let worstMc = null;
  let worstValue = null;
  let worstLoanLtv = null;
  let worstLoanDscr = null;
  let worstMaxProceeds = null;
  let worstCoverage = worstFiniteCoverage;
  let worstBinding = null;
  let capIsBinding = null;
  if (worstPoint && Number.isFinite(worstPoint.noiShock)) {
    worstNoi = noiBase * (1 + worstPoint.noiShock);
    worstCap = capRateBase + worstPoint.capBps / 10000;
    worstRate = interestRate + worstPoint.rateBps / 10000;
    worstMc = computeMortgageConstant(worstRate, amortYears);
    if (
      Number.isFinite(worstNoi) && worstNoi > 0 &&
      Number.isFinite(worstCap) && worstCap > 0 &&
      Number.isFinite(worstMc) && worstMc > 0
    ) {
      worstValue = worstNoi / worstCap;
      worstLoanLtv = worstValue * ltvMax;
      worstLoanDscr = worstNoi / (dscrMin * worstMc);
      capIsBinding = worstLoanLtv <= worstLoanDscr;
      worstMaxProceeds = Math.min(worstLoanLtv, worstLoanDscr);
      worstCoverage = worstMaxProceeds / debtBalance;
      worstBinding =
        worstLoanLtv <= worstLoanDscr ? "LTV-limited" : "DSCR-limited";
    }
  }
  let refiTier = "Stable";
  if (coverageBase < 1.0) {
    refiTier = "Refinance Shortfall Under Stress";
  } else if (worstFiniteCoverage < 0.90) {
    refiTier = "Refinance Shortfall Under Stress";
  } else if (worstFiniteCoverage < 1.0) {
    refiTier = "Fragile";
  } else if (worstFiniteCoverage < 1.1) {
    refiTier = "Sensitized";
  }
  const formatCoverage = (value) =>
    Number.isFinite(value) ? formatMultiple(value, 2) : DATA_NOT_AVAILABLE;
  const evidence = `base_coverage=${formatCoverage(
    coverageBase
  )}; worst_coverage=${formatCoverage(
    worstFiniteCoverage
  )}; thresholds: fail<1.00x (base) or worst<0.90x; fragile<1.00x; sensitized<1.10x`;
  const worstRows = stressPoints
    .slice()
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 4)
    .map((point) => {
      const noiShockPct = `${(point.noiShock * 100).toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`;
      const capBpsLabel = `${Math.round(point.capBps)} bps`;
      const rateBpsLabel = `${Math.round(point.rateBps)} bps`;
      const proceedsLabel = Number.isFinite(point.proceeds)
        ? formatValue(point.proceeds)
        : DATA_NOT_AVAILABLE;
      const coverageLabel = formatCoverage(point.coverage);
      return `<tr><td>${noiShockPct}</td><td>${capBpsLabel}</td><td>${rateBpsLabel}</td><td>${proceedsLabel}</td><td>${coverageLabel}</td></tr>`;
    })
    .join("");
  const fmtMoney = (x) => (Number.isFinite(x) ? formatValue(x) : DATA_NOT_AVAILABLE);
  const fmtRate = (x) => (Number.isFinite(x) ? formatInterestRatePercent(x) : DATA_NOT_AVAILABLE);
  const fmtCap = (x) => (Number.isFinite(x) ? formatPercent(x, 2) : DATA_NOT_AVAILABLE);
  const fmtX = (x) => (Number.isFinite(x) ? formatMultiple(x, 2) : DATA_NOT_AVAILABLE);
  const sufficiencyTableHtml = `<div class="card no-break" style="margin-top:6px;">
  <p class="subsection-title"><strong>Refinance Sufficiency (Deterministic)</strong></p>
  <table>
    <thead>
      <tr><th>Metric</th><th>Base Case</th><th>Worst Case</th></tr>
    </thead>
    <tbody>
      <tr><td>NOI</td><td>${fmtMoney(noiBase)}</td><td>${fmtMoney(worstNoi)}</td></tr>
      <tr><td>Cap Rate</td><td>${fmtCap(baseCap)}</td><td>${fmtCap(worstCap)}</td></tr>
      <tr><td>Implied Value (NOI / Cap)</td><td>${fmtMoney(baseValue)}</td><td>${fmtMoney(worstValue)}</td></tr>
      <tr><td>LTV-Limited Proceeds</td><td>${fmtMoney(baseLoanLtv)}</td><td>${fmtMoney(worstLoanLtv)}</td></tr>
      <tr><td>DSCR-Limited Proceeds</td><td>${fmtMoney(baseLoanDscr)}</td><td>${fmtMoney(worstLoanDscr)}</td></tr>
      <tr><td>Binding Constraint</td><td>${escapeHtml(baseBinding)}</td><td>${escapeHtml(worstBinding || DATA_NOT_AVAILABLE)}${capIsBinding === null ? "" : capIsBinding ? " (Cap/LTV binding)" : " (Rate/DSCR binding)"}</td></tr>
      <tr><td>Max Proceeds (min of above)</td><td>${fmtMoney(baseMaxProceeds)}</td><td>${fmtMoney(worstMaxProceeds)}</td></tr>
      <tr><td>Coverage (Max Proceeds / Debt Balance)</td><td>${fmtX(coverageBase)}</td><td>${fmtX(worstCoverage)}</td></tr>
      <tr><td>Worst-Case Drivers (NOI shock | Cap expansion | Rate shock)</td><td> - </td><td>${escapeHtml(worstDriverTripleText)}</td></tr>
    </tbody>
  </table>
</div>`;
  const refiHtml = `<div class="card no-break"><p><strong>Refinance Stability Classification: ${escapeHtml(
    refiTier
  )}</strong></p><p>Refinance Proceeds / Debt Balance: ${formatCoverage(
    coverageBase
  )}</p><p>Stressed Proceeds / Debt Balance: ${formatCoverage(
    worstFiniteCoverage
  )}</p><table><thead><tr><th>NOI Shock</th><th>Cap Expansion (bps)</th><th>Rate Shock (bps)</th><th>Max Proceeds</th><th>Coverage</th></tr></thead><tbody>${worstRows}</tbody></table></div>${sufficiencyTableHtml}`;
  return { tier: refiTier, evidence, html: refiHtml };
}
function normalizeExitCapSourceLabel(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (compact === "document_derived") return "document derived";
  if (compact === "standardized_framework" || compact === "standardized_framework_assumption") {
    return "standardized framework assumption";
  }
  if (compact === "user_provided") return "user-provided";
  if (compact === "unavailable") return "unavailable";
  return escapeHtml(raw);
}
function normalizeCapRatePercent(value) {
  const n = coerceNumber(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > 1.5 ? n : n * 100;
}
function capRateMatches(a, b, tolerance = 0.01) {
  const left = normalizeCapRatePercent(a);
  const right = normalizeCapRatePercent(b);
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;
}
function resolveCapRateSourceProvenance({
  capRatePercent = null,
  rawFinancials = null,
  loanTermSheetTermsPayload = null,
  acquisitionAssumptionState = null,
  appraisalPayload = null,
} = {}) {
  const pickFirstFinite = (...values) => {
    for (const value of values) {
      const numeric = coerceNumber(value);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
    return null;
  };
  const rf = rawFinancials && typeof rawFinancials === "object" ? rawFinancials : {};
  const loan = loanTermSheetTermsPayload && typeof loanTermSheetTermsPayload === "object"
    ? loanTermSheetTermsPayload
    : {};
  const appraisal = appraisalPayload && typeof appraisalPayload === "object" ? appraisalPayload : {};
  const explicitExitCap = pickFirstFinite(
    rf?.exit_cap_rate,
    rf?.terminal_cap_rate,
    rf?.resale_cap_rate,
    rf?.disposition_cap_rate,
    rf?.reversion_cap_rate,
    loan?.exit_cap_rate,
    loan?.terminal_cap_rate,
    loan?.resale_cap_rate,
    loan?.disposition_cap_rate,
    loan?.reversion_cap_rate,
    appraisal?.exit_cap_rate,
    appraisal?.terminal_cap_rate,
    appraisal?.resale_cap_rate,
    appraisal?.disposition_cap_rate,
    appraisal?.reversion_cap_rate
  );
  const hasExplicitExitCap = Number.isFinite(coerceNumber(explicitExitCap)) && coerceNumber(explicitExitCap) > 0;
  const explicitRefiOrUnderwritingCap = pickFirstFinite(
    rf?.refi_cap_rate_base,
    loan?.refi_cap_rate,
    loan?.underwriting_cap_rate,
    appraisal?.cap_rate
  );
  const hasRefiOrUnderwritingCap =
    Number.isFinite(coerceNumber(explicitRefiOrUnderwritingCap)) && coerceNumber(explicitRefiOrUnderwritingCap) > 0;
  const goingInCapReference = pickFirstFinite(
    acquisitionAssumptionState?.validated_fields?.going_in_cap_rate ? loan?.going_in_cap_rate : null,
    loan?.going_in_cap_rate
  );
  const hasGoingInCapReference =
    Number.isFinite(coerceNumber(goingInCapReference)) && coerceNumber(goingInCapReference) > 0;
  const capMatchesGoingInReference =
    hasGoingInCapReference && capRateMatches(capRatePercent, goingInCapReference);

  if (hasExplicitExitCap && capRateMatches(capRatePercent, explicitExitCap)) {
    return {
      mode: "verified_exit_cap",
      label: "document-derived exit cap",
    };
  }
  if (capMatchesGoingInReference) {
    return {
      mode: "acquisition_going_in_reference",
      label: "document-stated going-in cap reference (sensitivity anchor only; not a verified exit cap)",
    };
  }
  if (hasRefiOrUnderwritingCap && capRateMatches(capRatePercent, explicitRefiOrUnderwritingCap)) {
    return {
      mode: "refi_or_underwriting_cap_assumption",
      label: "refinance/underwriting cap assumption (not a verified exit cap)",
    };
  }
  if (Number.isFinite(coerceNumber(capRatePercent)) && coerceNumber(capRatePercent) > 0) {
    return {
      mode: "framework_default",
      label: "standardized framework assumption",
    };
  }
  return {
    mode: "unverified_or_unsupported",
    label: "unsupported cap-rate context",
  };
}
function hasMeaningfulNarrative(html) {
  if (!html || typeof html !== "string") return false;
  if (html.includes(DATA_NOT_AVAILABLE)) return false;
  if (!html.replace(/<[^>]*>/g, "").trim()) return false;
  return true;
}
function sanitizeScreeningRankedDriversHtml(html) {
  if (typeof html !== "string") return html;
  const sectionPattern = /<!-- BEGIN EXEC_RANKED_DRIVERS -->([\s\S]*?)<!-- END EXEC_RANKED_DRIVERS -->/g;
  return html.replace(sectionPattern, (_full, body) => {
    if (typeof body !== "string" || !body.trim()) return "";
    let nextBody = body.replace(/<li>([\s\S]*?)<\/li>/gi, (row, inner) => {
      const plain = String(inner || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!plain) return "";
      if (
        /^\d+\.\s*:\s*\(trigger:\s*\)$/i.test(plain) ||
        /^:\s*\(trigger:\s*\)$/i.test(plain) ||
        /^\(trigger:\s*\)$/i.test(plain) ||
        /^:$/i.test(plain)
      ) {
        return "";
      }
      return row;
    });
    nextBody = nextBody.replace(/<ol>\s*<\/ol>/gi, "");
    const hasValidRow = /<li>[\s\S]*?<\/li>/i.test(nextBody);
    return hasValidRow ? `<!-- BEGIN EXEC_RANKED_DRIVERS -->${nextBody}<!-- END EXEC_RANKED_DRIVERS -->` : "";
  });
}

function dedupeDataNotAvailableBySection(html) {
  if (typeof html !== "string") return html;
  const sectionPattern = /<!-- BEGIN ([A-Z0-9_]+) -->([\s\S]*?)<!-- END \1 -->/g;
  const shortDna = "Not assessed";
  return html.replace(sectionPattern, (full, token, body) => {
    if (typeof body !== "string" || !body.includes(DATA_NOT_AVAILABLE)) return full;
    if (token === "SECTION_8_DEAL_SCORE") {
      return `<!-- BEGIN ${token} -->${body.split(DATA_NOT_AVAILABLE).join(shortDna)}<!-- END ${token} -->`;
    }
    const note =
      `<p class="small data-gap-note">${DATA_NOT_AVAILABLE}. ` +
      "Metrics dependent on missing source inputs are omitted or qualified. Unsupported metrics are not inferred.</p>";
    let nextBody = body.split(DATA_NOT_AVAILABLE).join(shortDna);
    if (!/class="small data-gap-note"/.test(nextBody)) {
      nextBody = `${note}${nextBody}`;
    }
    return `<!-- BEGIN ${token} -->${nextBody}<!-- END ${token} -->`;
  });
}
function stripMarkedSection(html, key) {
  const token = String(key || "");
  if (!token) return html;
  const begin = `<!-- BEGIN ${token} -->`;
  const end = `<!-- END ${token} -->`;
  if (!html.includes(begin)) return html;
  if (!html.includes(end)) {
    console.warn(`Section marker missing END for ${token}`);
    return html;
  }
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<!-- BEGIN ${escapedToken} -->[\\s\\S]*?<!-- END ${escapedToken} -->`,
    "g"
  );
  return html.replace(re, "");
}
function replaceMarkedSection(html, key, replacement = "") {
  const token = String(key || "");
  if (!token) return html;
  const begin = `<!-- BEGIN ${token} -->`;
  const end = `<!-- END ${token} -->`;
  if (!html.includes(begin) || !html.includes(end)) return html;
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<!-- BEGIN ${escapedToken} -->[\\s\\S]*?<!-- END ${escapedToken} -->`,
    "g"
  );
  return html.replace(re, replacement);
}
function stripT12DetailSubsection(html, headingText) {
  if (!html) return html;
  const escapedHeading = String(headingText || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escapedHeading) return html;
  // Pattern A: heading is <h3> or similar + the next table
  const patternA = new RegExp(
    String.raw`<h[1-6][^>]*>\s*${escapedHeading}\s*<\/h[1-6]>\s*[\s\S]*?<table[\s\S]*?<\/table>\s*`,
    "i"
  );
  // Pattern B: heading is a div/span label + the next table (common in templates)
  const patternB = new RegExp(
    String.raw`<(div|span)[^>]*>\s*${escapedHeading}\s*<\/\1>\s*[\s\S]*?<table[\s\S]*?<\/table>\s*`,
    "i"
  );
  let out = html.replace(patternA, "");
  out = out.replace(patternB, "");
  return out;
}
function stripEmptyHeadingBlocks(html) {
  if (!html) return html;
  return String(html)
    .replace(/<p class="section-intro">\s*<\/p>\s*/gi, "")
    .replace(/<p class="subsection-title">\s*<\/p>\s*/gi, "");
}
function stripThinSectionPages(html) {
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
  if (hasInPlace) {
    rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(inPlace)}</td></tr>`);
  }
  if (hasMarket) {
    rows.push(`<tr><td>Annual Market Rent</td><td>${formatCurrency(market)}</td></tr>`);
  }
  if (hasInPlace && hasMarket && market > inPlace) {
    const annualUpside = market - inPlace;
    const rentGapPct = inPlace > 0 ? ((market - inPlace) / inPlace) * 100 : null;
    rows.push(`<tr><td>Annual Gross Rent Upside</td><td>${formatCurrency(annualUpside)}</td></tr>`);
    rows.push(
      `<tr><td>Rent Gap %</td><td>${
        Number.isFinite(rentGapPct)
          ? `${rentGapPct.toLocaleString("en-CA", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}%`
          : "Not assessed"
      }</td></tr>`
    );
  } else if (hasInPlace || hasMarket) {
    rows.push(`<tr><td>Annual Gross Rent Upside</td><td>Not assessed</td></tr>`);
    rows.push(`<tr><td>Rent Gap %</td><td>Not assessed</td></tr>`);
  }
  if (hasUnits) {
    rows.push(`<tr><td>Total Units</td><td>${Math.round(units)}</td></tr>`);
  }
  if (hasOccupied) {
    rows.push(`<tr><td>Occupied Units</td><td>${Math.round(occupied)}</td></tr>`);
  }
  if (Number.isFinite(vacantUnits)) {
    rows.push(`<tr><td>Vacant Units</td><td>${Math.round(vacantUnits)}</td></tr>`);
  }
  if (Number.isFinite(occupancy)) {
    rows.push(
      `<tr><td>Occupancy</td><td>${(occupancy * 100).toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%</td></tr>`
    );
  }
  const metricsHtml = rows.length
    ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows.join("")}</tbody></table>`
    : "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">${escapeHtml(title)}</p>${metricsHtml}<p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${escapeHtml(body)}</p></div>`;
}

function resolveRentPositioningSectionTitle({
  effectiveReportMode = "screening_v1",
  summaryOnlyRentRollSurface = false,
} = {}) {
  if (effectiveReportMode === "screening_v1") {
    return {
      title: summaryOnlyRentRollSurface ? "Summary Rent Positioning" : "Unit-Level Rent Positioning",
      subtitle: summaryOnlyRentRollSurface
        ? "Rent positioning based on verified rent-roll summary totals"
        : "Market-rent gap based on uploaded rent roll",
    };
  }
  return {
    title: summaryOnlyRentRollSurface
      ? "Summary Rent Positioning & Value Sensitivity"
      : "Unit-Level Rent Positioning & Value Sensitivity",
    subtitle: summaryOnlyRentRollSurface
      ? "Summary totals, verified rent position, and implied value sensitivity"
      : "Market-rent gap and implied value sensitivity",
  };
}
function collapseSummaryOnlyUnitMixSection(
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
function stripChartBlockByAlt(html, altText) {
  if (!altText) return html;
  const escapedAlt = altText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<div class=\"chart-block[\\s\\S]*?<img[^>]*(alt=\"${escapedAlt}\"[^>]*src=\"\"|src=\"\"[^>]*alt=\"${escapedAlt}\")[^>]*>[\\s\\S]*?<\\/div>`,
    "g"
  );
  return html.replace(re, "");
}

function resolveCanonicalDataCoverageHeadlineState({
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

function shouldRenderCanonicalSection({
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
function resolveMarketContextSectionVisibility({
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
function resolveFinalRecommendationSectionVisibility({
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

function resolveDocumentSourcesSectionVisibility({
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
function shouldApplyTierOneStripCascade({
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
function shouldStripDataCoverageSectionByRenderedCopy({
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
function buildUnitMixRows(unitMix = [], totalUnits, formatValue) {
  const toNum = (v) => {
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
    if (typeof v !== "string") return NaN;
    const trimmed = v.trim();
    if (!trimmed) return NaN;
    const parenNeg = trimmed.startsWith("(") && trimmed.endsWith(")");
    const unwrapped = parenNeg ? trimmed.slice(1, -1) : trimmed;
    const normalized = unwrapped.replace(/[^\d.-]/g, "");
    if (!normalized) return NaN;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return NaN;
    const absParsed = Math.abs(parsed);
    return parenNeg ? -absParsed : parsed;
  };
  if (!Array.isArray(unitMix) || unitMix.length === 0) return "";
  const rows = unitMix
    .map((row) => {
      const rawUnitType = String(row.unit_type ?? "").trim();
      const normalizedUnitType = /^(studio|0|0br|0 br|0-bed|0 bed)$/i.test(rawUnitType)
        ? "Studio"
        : rawUnitType;
      const unitType = escapeHtml(normalizedUnitType);
      const countNum = toNum(row.count);
      const avgSqftNum = toNum(row.avg_sqft);
      const currentRentNum = toNum(row.current_rent);
      const marketRentNum = toNum(row.market_rent);
      const currentRentDisplayNum = Number.isFinite(currentRentNum) ? Math.round(currentRentNum) : NaN;
      const marketRentDisplayNum = Number.isFinite(marketRentNum) ? Math.round(marketRentNum) : NaN;
      const count = Number.isFinite(countNum) ? String(Math.round(countNum)) : "";
      const avgSqft = Number.isFinite(avgSqftNum)
        ? String(Math.round(avgSqftNum))
        : "";
      const currentRent = Number.isFinite(currentRentNum)
        ? formatValue(currentRentNum)
        : "";
      const marketRent = Number.isFinite(marketRentNum)
        ? formatValue(marketRentNum)
        : "";
      const plannedLift =
        Number.isFinite(currentRentDisplayNum) && Number.isFinite(marketRentDisplayNum)
          ? formatValue(marketRentDisplayNum - currentRentDisplayNum)
          : "";
      return `<tr>
            <td>${unitType}</td>
            <td>${count}</td>
            <td>${avgSqft}</td>
            <td>${currentRent}</td>
            <td>${marketRent}</td>
            <td>${plannedLift}</td>
          </tr>`;
    })
    .join("");
  return rows;
}
function injectUnitMixTable(html, rowsHtml) {
  if (!rowsHtml) return html;
  const regex =
    /(<p class="subsection-title">Illustrative Unit Mix and Rent Lift<\/p>[\s\S]*?<table>[\s\S]*?<tbody>)([\s\S]*?)(<\/tbody>)/;
  if (!regex.test(html)) return html;
  return html.replace(regex, `$1${rowsHtml}$3`);
}
function injectOccupancyNote(html, occupancy) {
  if (occupancy === null || occupancy === undefined) return html;
  const occupancyPercent =
    typeof occupancy === "string"
      ? occupancy
      : `${Math.round(Number(occupancy) * 100)}%`;
  const note = `<p class="small" style="margin-top:8px;">
        <strong>Reported occupancy (rent roll):</strong> ${occupancyPercent}
      </p>`;
  const regex =
    /(Illustrative Unit Mix and Rent Lift<\/p>[\s\S]*?<\/table>\s*)<p class="small" style="margin-top:8px;">[\s\S]*?<\/p>/;
  if (!regex.test(html)) return html;
  return html.replace(regex, `$1${note}`);
}
function resolveOccupancyNoteValue(computedRentRoll = null, rentRollPayload = null) {
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
function deriveOccFromRentRollUnits(rentRollPayload) {
  const rrRowsRaw =
    rentRollPayload?.units ||
    rentRollPayload?.rows ||
    rentRollPayload?.rent_roll ||
    rentRollPayload?.data ||
    [];
  const rrRows = Array.isArray(rrRowsRaw) ? rrRowsRaw : [];
  if (rrRows.length === 0) return null;
  const unitRows = rrRows.filter((u) => {
    const id =
      u?.unit ??
      u?.unit_number ??
      u?.unit_no ??
      u?.unit_id ??
      u?.unitid ??
      u?.suite ??
      u?.apt ??
      u?.apartment;
    return String(id ?? "").trim().length > 0;
  });
  if (unitRows.length === 0) return null;
  const total = unitRows.length;
  const occupied = unitRows.reduce((acc, u) => {
    const s = String(u?.status || u?.unit_status || "").toLowerCase();
    if (s.includes("occupied")) return acc + 1;
    const r = coerceNumber(u?.in_place_rent ?? u?.current_rent ?? u?.rent);
    return Number.isFinite(r) && r > 0 ? acc + 1 : acc;
  }, 0);
  return total > 0 ? occupied / total : null;
}
function resolveCanonicalT12GprValue(t12Payload = null) {
  return coerceNumber(
    t12Payload?.gross_potential_rent ??
      t12Payload?.gross_scheduled_rent
  );
}
function buildT12SummaryHtml(t12Payload, formatValue) {
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
  return `<table>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
        ${rowHtml}
      </table>`;
}
function buildT12KeyMetricRows(t12Payload, formatValue) {
  if (!t12Payload) return "";
  const canonicalGpr = resolveCanonicalT12GprValue(t12Payload);
  const rows = [
    ["In-Place Gross Potential Rent", canonicalGpr],
    ["Effective Gross Income (TTM)", t12Payload.effective_gross_income],
    ["Operating Expenses (TTM)", t12Payload.total_operating_expenses],
    ["Net Operating Income (TTM)", t12Payload.net_operating_income],
  ];
  return rows
    .map(([label, value]) => {
      const display = Number.isFinite(Number(value)) ? formatValue(value) : "";
      return `<tr>
          <td>${label}</td>
          <td>${display}</td>
        </tr>`;
    })
    .join("");
}
function buildT12IncomeRows(t12Payload, formatValue) {
  if (!t12Payload || typeof t12Payload !== "object") return "";
  const candidateCollection = Array.isArray(t12Payload.income_lines)
    ? t12Payload.income_lines
    : t12Payload.income_breakdown &&
      (Array.isArray(t12Payload.income_breakdown) ||
        typeof t12Payload.income_breakdown === "object")
    ? t12Payload.income_breakdown
    : Array.isArray(t12Payload.line_items)
    ? t12Payload.line_items.filter(
        (entry) => String(entry?.category ?? "").trim().toLowerCase() === "income"
      )
    : null;
  if (!candidateCollection) return "";
  const rows = [];
  const seen = new Set();
  const addRow = (labelRaw, amountRaw) => {
    const label = String(labelRaw ?? "").trim();
    const amountNum = coerceNumber(amountRaw);
    if (!label || !Number.isFinite(amountNum)) return;
    const rowKey = `${label}::${amountNum}`;
    if (seen.has(rowKey)) return;
    seen.add(rowKey);
    rows.push(
      `<tr><td>${escapeHtml(label)}</td><td>${formatValue(amountNum)}</td></tr>`
    );
  };
  if (Array.isArray(candidateCollection)) {
    candidateCollection.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const label =
          entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "";
        const amount =
          entry.amount ?? entry.value ?? entry.ttm ?? entry.total ?? null;
        addRow(label, amount);
      }
    });
  } else {
    Object.entries(candidateCollection).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        addRow(
          value.line_item ?? value.label ?? value.name ?? key,
          value.amount ?? value.value ?? value.ttm ?? value.total
        );
      } else {
        addRow(key, value);
      }
    });
  }
  if (rows.length < 3) return "";
  return rows.join("");
}
function buildT12ExpenseRows(t12Payload, formatValue) {
  if (!t12Payload || typeof t12Payload !== "object") return "";
  const candidateCollection = Array.isArray(t12Payload.expense_lines)
    ? t12Payload.expense_lines
    : t12Payload.expense_breakdown &&
      (Array.isArray(t12Payload.expense_breakdown) ||
        typeof t12Payload.expense_breakdown === "object")
    ? t12Payload.expense_breakdown
    : Array.isArray(t12Payload.line_items)
    ? t12Payload.line_items.filter(
        (entry) => String(entry?.category ?? "").trim().toLowerCase() === "expense"
      )
    : null;
  if (!candidateCollection) return "";
  const rows = [];
  const seen = new Set();
  const addRow = (labelRaw, amountRaw) => {
    const label = String(labelRaw ?? "").trim();
    const amountNum = coerceNumber(amountRaw);
    if (!label || !Number.isFinite(amountNum)) return;
    const rowKey = `${label}::${amountNum}`;
    if (seen.has(rowKey)) return;
    seen.add(rowKey);
    rows.push(
      `<tr><td>${escapeHtml(label)}</td><td>${formatValue(amountNum)}</td></tr>`
    );
  };
  if (Array.isArray(candidateCollection)) {
    candidateCollection.forEach((entry) => {
      if (entry && typeof entry === "object") {
        const label =
          entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "";
        const amount =
          entry.amount ?? entry.value ?? entry.ttm ?? entry.total ?? null;
        addRow(label, amount);
      }
    });
  } else {
    Object.entries(candidateCollection).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        addRow(
          value.line_item ?? value.label ?? value.name ?? key,
          value.amount ?? value.value ?? value.ttm ?? value.total
        );
      } else {
        addRow(key, value);
      }
    });
  }
  if (rows.length < 3) return "";
  return rows.join("");
}
function summarizeRenovationBudgetRows(rows, formatValue) {
  const visibleColumns = {
    category: false,
    scope: false,
    cost: false,
    unitType: false,
    unitCount: false,
    costPerUnit: false,
    expectedMonthlyRentLift: false,
    phaseTiming: false,
    grossAnnualRentLiftPotential: false,
    percent: false,
    objective: false,
  };
  const normalizedRows = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const category = String(row.category ?? row.line_item ?? row.item ?? "").trim();
    const scope = String(row.scope_of_work ?? row.scope ?? "").trim();
    const unitType = String(row.unit_type ?? "").trim();
    const unitCountRaw = row.unit_count ?? "";
    const unitCountNum = coerceNumber(unitCountRaw);
    const unitCount = Number.isFinite(unitCountNum) ? String(Math.round(unitCountNum)) : String(unitCountRaw).trim();
    const costNum = coerceNumber(row.estimated_cost ?? row.cost ?? row.amount);
    const costRaw = String(row.estimated_cost ?? row.cost ?? row.amount ?? "").trim();
    const cost = Number.isFinite(costNum) ? formatValue(costNum) : escapeHtml(costRaw);
    const costPerUnitNum = coerceNumber(row.cost_per_unit);
    const costPerUnitRaw = String(row.cost_per_unit ?? "").trim();
    const costPerUnit = Number.isFinite(costPerUnitNum) ? formatValue(costPerUnitNum) : escapeHtml(costPerUnitRaw);
    const expectedMonthlyRentLiftNum = coerceNumber(row.expected_monthly_rent_lift);
    const expectedMonthlyRentLiftRaw = String(row.expected_monthly_rent_lift ?? "").trim();
    const expectedMonthlyRentLift = Number.isFinite(expectedMonthlyRentLiftNum)
      ? formatValue(expectedMonthlyRentLiftNum)
      : escapeHtml(expectedMonthlyRentLiftRaw);
    const phaseTiming = String(row.phase_timing ?? row.timing_or_phasing ?? "").trim();
    const grossAnnualRentLiftPotential =
      Number.isFinite(unitCountNum) && Number.isFinite(expectedMonthlyRentLiftNum)
        ? formatValue(unitCountNum * expectedMonthlyRentLiftNum * 12)
        : "";
    const pctKind = normalizeRenovationMetricKind({
      metric_kind: "percent_of_budget",
      label: "percent of budget",
    });
    const pctRawValue = row.percent_of_budget ?? row.percent ?? row.percentage ?? "";
    const pctValue = coerceNumber(pctRawValue);
    const pct = formatRenovationMetricValue({
      metricKind: pctKind,
      value: pctValue,
    });
    const percent = Number.isFinite(pctValue) ? pct : String(pctRawValue ?? "").trim();
    const objective = String(row.primary_objective ?? row.objective ?? row.note ?? "").trim();
    if (
      !category &&
      !scope &&
      !cost &&
      !unitType &&
      !unitCount &&
      !costPerUnit &&
      !expectedMonthlyRentLift &&
      !phaseTiming &&
      !grossAnnualRentLiftPotential &&
      !percent &&
      !objective
    ) continue;
    visibleColumns.category ||= Boolean(category);
    visibleColumns.scope ||= Boolean(scope);
    visibleColumns.cost ||= Boolean(cost);
    visibleColumns.unitType ||= Boolean(unitType);
    visibleColumns.unitCount ||= Boolean(unitCount);
    visibleColumns.costPerUnit ||= Boolean(costPerUnit);
    visibleColumns.expectedMonthlyRentLift ||= Boolean(expectedMonthlyRentLift);
    visibleColumns.phaseTiming ||= Boolean(phaseTiming);
    visibleColumns.grossAnnualRentLiftPotential ||= Boolean(grossAnnualRentLiftPotential);
    visibleColumns.percent ||= Boolean(percent);
    visibleColumns.objective ||= Boolean(objective);
    normalizedRows.push({
      category,
      scope,
      cost,
      unitType,
      unitCount,
      costPerUnit,
      expectedMonthlyRentLift,
      phaseTiming,
      grossAnnualRentLiftPotential,
      percent,
      objective,
    });
  }
  return { visibleColumns, rows: normalizedRows };
}

function canonicalizeDocumentTreatmentSources(documentSources = []) {
  const normalizeToken = (value) => String(value ?? "").trim().toLowerCase();
  const normalizeText = (value) => normalizeToken(value).replace(/\s+/g, " ");
  const firstFinite = (...values) => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const extractMoneyNearLabels = (text, labels) => {
    const source = String(text || "");
    for (const label of Array.isArray(labels) ? labels : []) {
      const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patterns = [
        new RegExp(`${escaped}[^0-9\\n]{0,60}\\$?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`, "i"),
        new RegExp(`\\$?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*(?:is\\s+)?(?:the\\s+)?${escaped}`, "i"),
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(source);
        if (!match) continue;
        const numeric = Number(String(match[1]).replace(/,/g, ""));
        if (Number.isFinite(numeric) && numeric > 0) return numeric;
      }
    }
    return null;
  };
  const extractPercentNearLabels = (text, labels) => {
    const source = String(text || "");
    for (const label of Array.isArray(labels) ? labels : []) {
      const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patterns = [
        new RegExp(`${escaped}[^0-9\\n]{0,60}([0-9]+(?:\\.[0-9]+)?)\\s*%`, "i"),
        new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*%[^\\n]{0,60}${escaped}`, "i"),
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(source);
        if (!match) continue;
        const numeric = Number(match[1]);
        if (Number.isFinite(numeric) && numeric > 0) return numeric / 100;
      }
    }
    return null;
  };
  const extractYearsNearLabels = (text, labels) => {
    const source = String(text || "");
    for (const label of Array.isArray(labels) ? labels : []) {
      const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const patterns = [
        new RegExp(`${escaped}[^0-9\\n]{0,60}([0-9]{1,2}(?:\\.[0-9]+)?)`, "i"),
        new RegExp(`([0-9]{1,2}(?:\\.[0-9]+)?)\\s*(?:years?|yrs?)?[^\\n]{0,60}${escaped}`, "i"),
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(source);
        if (!match) continue;
        const numeric = Number(match[1]);
        if (Number.isFinite(numeric) && numeric > 0) return numeric;
      }
    }
    return null;
  };
  const rows = Array.isArray(documentSources)
    ? documentSources.filter((row) => row && typeof row === "object")
    : [];
  if (rows.length === 0) return [];

  const canonicalIdentityKey = (row) => {
    const filename = normalizeToken(row?.original_filename || row?.file_name || row?.filename);
    if (filename) return `filename:${filename}`;
    const ids = [
      row?.source_file_id,
      row?.file_id,
      row?.document_id,
      row?.artifact_file_id,
      row?.id,
    ]
      .map(normalizeToken)
      .filter(Boolean);
    return ids[0] ? `id:${ids[0]}` : "";
  };

  const authorityScore = (row) => {
    const roleText = normalizeText([
      row?.semantic_doc_role,
      row?.semantic_doc_display_label,
      row?.display_doc_type,
      row?.doc_type,
      row?.semantic_doc_role_reason,
    ]
      .filter(Boolean)
      .join(" | "));
    if (/(?:\bt12\b|income reconstruction|operating statement|rent roll)/i.test(roleText)) return 900;
    if (/(?:purchase[_\s-]*assumptions|acquisition[_\s-]*context|document[-\s]*derived acquisition context|purchase price|going[-\s]*in cap|noi basis)/i.test(roleText)) return 800;
    if (/(?:property tax|tax support)/i.test(roleText)) return 700;
    if (/(?:current mortgage|current debt|loan\/? debt support|debt support|loan term sheet)/i.test(roleText)) return 600;
    if (/(?:renovation|capex|capital expenditure)/i.test(roleText)) return 500;
    if (/(?:market survey|rent survey|rent comp)/i.test(roleText)) return 400;
    if (/(?:phase\s*i|esa|environment|zoning|compliance)/i.test(roleText)) return 300;
    if (/(?:appraisal|valuation|market value)/i.test(roleText)) return 200;
    return 100;
  };

  const grouped = new Map();
  rows.forEach((row, index) => {
    const key = canonicalIdentityKey(row);
    if (!key) return;
    const entry = { row, index, score: authorityScore(row) };
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(entry);
  });

  const merged = [];
  for (const entries of grouped.values()) {
    if (!Array.isArray(entries) || entries.length === 0) continue;
    entries.sort((left, right) => right.score - left.score || left.index - right.index);
    const winner = entries[0];
    const winnerText = normalizeText([
      winner.row?.source_text,
      winner.row?.raw_text,
      winner.row?.notes,
      winner.row?.loan_terms_text,
      winner.row?.extracted_text,
    ].filter(Boolean).join(" | "));
    const winnerTaxonomy = buildSupportDocTaxonomyState({
      declaredDocType: winner.row?.doc_type || null,
      detectedDocType: winner.row?.display_doc_type || null,
      originalFilename: winner.row?.original_filename || null,
      rawText: winnerText,
      payload: winner.row,
    });
      const explicitRole = normalizeText(winnerTaxonomy?.semantic_doc_role || "");
      const explicitDisplayLabel = String(winnerTaxonomy?.semantic_doc_display_label || "").trim();
      const explicitRoleAuthority = (() => {
        if (explicitRole === "structured_renovation_capex_plan") {
          const rowText = winnerText;
          const totalBudget = firstFinite(
            winner.row?.total_budget,
            winner.row?.total_capex,
            winner.row?.renovation_budget,
            extractMoneyNearLabels(rowText, [
              "total renovation budget",
              "renovation budget",
              "capex budget",
              "capital budget",
            ])
          );
          return {
            canonical_support_doc_role: "structured_renovation_capex_plan",
            semantic_doc_role: "structured_renovation_capex_plan",
            semantic_doc_display_label: "Structured Renovation / CapEx Plan",
            document_role_label: "Structured Renovation / CapEx Plan",
            treatment_label: "Structured renovation / CapEx context",
            use_label: "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled.",
            treatment_category: "Displayed / Limited Use",
            has_structured_renovation_budget: true,
            total_budget: totalBudget,
            budget_rows: Array.isArray(winner.row?.budget_rows) ? winner.row.budget_rows : [],
            execution_rows: Array.isArray(winner.row?.execution_rows) ? winner.row.execution_rows : [],
            unit_count: firstFinite(winner.row?.unit_count, winner.row?.scope_units),
            per_unit_cost: firstFinite(winner.row?.per_unit_cost, winner.row?.budget_per_unit),
            timing_or_phasing: winner.row?.timing_or_phasing || null,
            rent_lift: winner.row?.rent_lift || null,
            has_renovation_rent_lift: /rent lift|expected monthly rent lift/i.test(winnerText),
            has_renovation_phasing: /\b(month|months|phase|phasing|quarter|q[1-4]|implementation schedule)\b/i.test(winnerText),
          };
        }
        if (explicitRole === "renovation_capex_budget_context") {
          const rowText = winnerText;
          const totalBudget = firstFinite(
            winner.row?.total_budget,
            winner.row?.total_capex,
            winner.row?.renovation_budget,
            extractMoneyNearLabels(rowText, [
              "total renovation budget",
              "renovation budget",
              "capex budget",
              "capital budget",
            ])
          );
          return {
            canonical_support_doc_role: "renovation_capex_budget_context",
            semantic_doc_role: "renovation_capex_budget_context",
            semantic_doc_display_label: "Renovation / CapEx Budget Context",
            document_role_label: "Renovation / CapEx Budget Context",
            treatment_label: "Budget/scope only",
            use_label: "Document-stated renovation budget/scope is acknowledged; rent lift, ROI, payback, and phasing are not modeled unless provided.",
            treatment_category: "Displayed / Limited Use",
            has_structured_renovation_budget: true,
            total_budget: totalBudget,
            budget_rows: Array.isArray(winner.row?.budget_rows) ? winner.row.budget_rows : [],
            execution_rows: Array.isArray(winner.row?.execution_rows) ? winner.row.execution_rows : [],
            has_renovation_rent_lift: false,
            has_renovation_phasing: false,
          };
        }
      if (explicitRole === "purchase_assumptions") {
        return {
          canonical_support_doc_role: "purchase_assumptions",
          semantic_doc_role: "purchase_assumptions",
          semantic_doc_display_label: explicitDisplayLabel || "Purchase Assumptions / Acquisition Context",
          document_role_label: "Purchase Assumptions / Acquisition Context",
          treatment_label: "Acquisition context / document-derived acquisition context",
          use_label: "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth.",
          treatment_category: "Displayed / Limited Use",
          has_acquisition_support: true,
          has_proposed_acquisition_financing: /proposed acquisition financing/i.test(winnerText),
        };
      }
        if (explicitRole === "current_mortgage_statement") {
          const rowText = winnerText;
          const outstandingBalance = firstFinite(
            winner.row?.outstanding_balance,
            winner.row?.current_outstanding_balance,
            winner.row?.current_loan_balance,
            extractMoneyNearLabels(rowText, [
              "current outstanding principal balance",
              "unpaid principal balance",
              "outstanding principal balance",
              "current outstanding balance",
              "outstanding balance",
              "principal balance",
              "current loan balance",
              "mortgage balance",
              "loan balance",
              "outstanding loan",
              "remaining balance",
              "balance outstanding",
            ])
          );
          const interestRate = firstFinite(
            winner.row?.interest_rate,
            extractPercentNearLabels(rowText, ["interest rate", "rate", "coupon rate", "note rate"])
          );
          const amortYears = firstFinite(
            winner.row?.amortization_years,
            winner.row?.amort_years,
            extractYearsNearLabels(rowText, ["amortization", "amort", "remaining", "years remaining"])
          );
          const ltv = firstFinite(
            winner.row?.ltv,
            extractPercentNearLabels(rowText, ["ltv", "loan to value", "loan-to-value"])
          );
          return {
            canonical_support_doc_role: "current_debt_context",
            semantic_doc_role: "current_debt_context",
            semantic_doc_display_label: explicitDisplayLabel || "Debt Support Received / Contextual",
            document_role_label: "Debt Support Received / Contextual",
            treatment_label: "Debt support received / contextual or deferred",
            use_label: "Uploaded existing/current debt context only; not proposed acquisition financing.",
            treatment_category: "Displayed / Limited Use",
            has_current_debt_context: true,
            outstanding_balance: outstandingBalance,
            current_outstanding_balance: outstandingBalance,
            current_loan_balance: outstandingBalance,
            interest_rate: interestRate,
            amortization_years: amortYears,
            amort_years: amortYears,
            ltv,
            debt_basis: "current_debt_context",
          };
        }
      return null;
    })();
    merged.push({
      ...winner.row,
      canonical_document_treatment_identity_key: canonicalIdentityKey(winner.row),
      ...(explicitRoleAuthority || {}),
    });
  }
  return merged;
}

function buildCanonicalSupportDocAuthorityRows({
  documentSources = [],
  artifacts = [],
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  mortgagePayload = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  appraisalPayload = null,
} = {}) {
  const normalizeToken = (value) => String(value ?? "").trim().toLowerCase();
  const normalizeText = (value) => normalizeToken(value).replace(/\s+/g, " ");
    const firstFinite = (...values) => {
      for (const value of values) {
        const parsed = coerceNumber(value);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      return null;
    };
    const extractMoneyNearLabels = (text, labels) => {
      const source = String(text || "");
      for (const label of Array.isArray(labels) ? labels : []) {
        const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patterns = [
          new RegExp(`${escaped}[^0-9\\n]{0,60}\\$?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)`, "i"),
          new RegExp(`\\$?\\s*([0-9][0-9,]*(?:\\.[0-9]+)?)\\s*(?:is\\s+)?(?:the\\s+)?${escaped}`, "i"),
        ];
        for (const pattern of patterns) {
          const match = pattern.exec(source);
          if (!match) continue;
          const numeric = Number(String(match[1]).replace(/,/g, ""));
          if (Number.isFinite(numeric) && numeric > 0) return numeric;
        }
      }
      return null;
    };
    const extractPercentNearLabels = (text, labels) => {
      const source = String(text || "");
      for (const label of Array.isArray(labels) ? labels : []) {
        const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patterns = [
          new RegExp(`${escaped}[^0-9\\n]{0,60}([0-9]+(?:\\.[0-9]+)?)\\s*%`, "i"),
          new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*%[^\\n]{0,60}${escaped}`, "i"),
        ];
        for (const pattern of patterns) {
          const match = pattern.exec(source);
          if (!match) continue;
          const numeric = Number(match[1]);
          if (Number.isFinite(numeric) && numeric > 0) return numeric / 100;
        }
      }
      return null;
    };
    const extractYearsNearLabels = (text, labels) => {
      const source = String(text || "");
      for (const label of Array.isArray(labels) ? labels : []) {
        const escaped = String(label || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const patterns = [
          new RegExp(`${escaped}[^0-9\\n]{0,60}([0-9]{1,2}(?:\\.[0-9]+)?)`, "i"),
          new RegExp(`([0-9]{1,2}(?:\\.[0-9]+)?)\\s*(?:years?|yrs?)?[^\\n]{0,60}${escaped}`, "i"),
        ];
        for (const pattern of patterns) {
          const match = pattern.exec(source);
          if (!match) continue;
          const numeric = Number(match[1]);
          if (Number.isFinite(numeric) && numeric > 0) return numeric;
        }
      }
      return null;
    };
    const identityKeyFor = (row = {}) => {
    const filename = normalizeToken(row?.original_filename || row?.source_original_filename || row?.file_name || row?.filename);
    if (filename) return `filename:${filename}`;
    const id = [
      row?.source_file_id,
      row?.file_id,
      row?.document_id,
      row?.artifact_file_id,
      row?.id,
    ].map(normalizeToken).find(Boolean);
    return id ? `id:${id}` : "";
  };
  const payloadRows = [
    { type: "loan_term_sheet_parsed", payload: loanTermSheetTermsPayload },
    { type: "loan_term_sheet_parsed", payload: acquisitionTermsPayload },
    { type: "mortgage_statement_parsed", payload: mortgagePayload },
    { type: "renovation_parsed", payload: renovationPayload },
    { type: "property_tax_parsed", payload: propertyTaxPayload },
    { type: "appraisal_parsed", payload: appraisalPayload },
    ...(Array.isArray(artifacts) ? artifacts : []),
  ]
    .map((entry) => {
      const payload = entry?.payload && typeof entry.payload === "object" ? entry.payload : null;
      if (!payload) return null;
      return {
        ...payload,
        artifact_type: entry?.type || payload?.artifact_type || null,
      };
    })
    .filter(Boolean);
  const rows = [
    ...(Array.isArray(documentSources) ? documentSources : []),
    ...payloadRows,
  ].filter((row) => row && typeof row === "object");
  if (!rows.length) return [];

  const grouped = new Map();
  rows.forEach((row, index) => {
    const key = identityKeyFor(row);
    if (!key) return;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ row, index });
  });

  const hasAnyNumber = (row, keys) => keys.some((key) => Number.isFinite(coerceNumber(row?.[key])) && coerceNumber(row?.[key]) > 0);
  const hasAnyText = (row, keys, pattern) => keys.some((key) => pattern.test(normalizeText(row?.[key])));
  const combinedTextFor = (row) => [
    row?.semantic_doc_role,
    row?.semantic_doc_display_label,
    row?.semantic_doc_role_reason,
    row?.display_doc_type,
    row?.doc_type,
    row?.artifact_type,
    row?.original_filename,
    row?.source_original_filename,
    row?.file_name,
    row?.filename,
    row?.debt_basis,
    row?.source_text,
    row?.raw_text,
    row?.notes,
    row?.loan_terms_text,
    row?.extracted_text,
    row?.text,
    row?.payload?.text,
    row?.excerpt,
    row?.payload?.excerpt,
  ].filter(Boolean).join(" | ");

  const classifyAuthority = (row) => {
    const text = normalizeText(combinedTextFor(row));
    const evidenceBonus =
      (row?.validated === true ? 50 : 0) +
      (typeof row?.artifact_type === "string" && /_parsed$/i.test(String(row?.artifact_type)) ? 25 : 0) +
      (row?.ai_assisted === true ? 10 : 0);
    const hasExplicitCurrentDebtEvidence =
      /(existing current debt statement|current debt context|existing current debt|current debt terms|current outstanding balance|current mortgage|existing debt|current mortgage statement)/i.test(text) &&
      /(interest rate|note rate|coupon rate)/i.test(text) &&
      /(amortization|amortization remaining|monthly payment|maturity date|outstanding balance|principal balance|years remaining|remaining years)/i.test(text);
    const hasStructuredRenovationEvidence =
      /(structured renovation \/ capex plan|structured forward-looking renovation|total renovation budget|forward[-\s]*looking renovation)/i.test(text) &&
      /(rent lift|expected rent lift|expected monthly rent lift)/i.test(text) &&
      /(phasing|months|implementation schedule|phase)/i.test(text);
    if (hasExplicitCurrentDebtEvidence) {
      const outstandingBalance = firstFinite(
        row?.outstanding_balance,
        row?.current_outstanding_balance,
        row?.current_loan_balance,
        extractMoneyNearLabels(text, [
          "current outstanding principal balance",
          "unpaid principal balance",
          "outstanding principal balance",
          "current outstanding balance",
          "outstanding balance",
          "principal balance",
          "current loan balance",
          "mortgage balance",
          "loan balance",
          "outstanding loan",
          "remaining balance",
          "balance outstanding",
        ])
      );
      const interestRate = firstFinite(
        row?.interest_rate,
        extractPercentNearLabels(text, ["interest rate", "rate", "coupon rate", "note rate"])
      );
      const amortYears = firstFinite(
        row?.amortization_years,
        row?.amort_years,
        extractYearsNearLabels(text, ["amortization", "amort", "remaining", "years remaining"])
      );
      const ltv = firstFinite(
        row?.ltv,
        extractPercentNearLabels(text, ["ltv", "loan to value", "loan-to-value"])
      );
      return {
        score: 2000 + evidenceBonus,
        canonical_support_doc_role: "current_debt_context",
        document_role_label: "Debt Support Received / Contextual",
        treatment_label: "Debt support received / contextual or deferred",
        use_label: "Uploaded existing/current debt context only; not proposed acquisition financing.",
        treatment_category: "Displayed / Limited Use",
        has_current_debt_context: true,
        outstanding_balance: outstandingBalance,
        current_outstanding_balance: outstandingBalance,
        current_loan_balance: outstandingBalance,
        interest_rate: interestRate,
        amortization_years: amortYears,
        amort_years: amortYears,
        ltv,
        debt_basis: "current_debt_context",
        authoritySource: "explicit_current_debt_source_text",
      };
    }
    if (hasStructuredRenovationEvidence) {
      const totalBudget = firstFinite(
        row?.total_budget,
        row?.total_capex,
        row?.renovation_budget,
        extractMoneyNearLabels(text, ["total renovation budget", "renovation budget", "capex budget", "capital budget"])
      );
      const rentLift = firstFinite(
        row?.rent_lift,
        row?.expected_monthly_rent_lift,
        extractMoneyNearLabels(text, ["rent lift", "expected rent lift", "expected monthly rent lift"])
      );
      const phasingText =
        row?.timing_or_phasing ||
        row?.phase_timing ||
        row?.execution_note ||
        row?.notes ||
        row?.source_text ||
        row?.raw_text ||
        row?.payload?.text ||
        row?.text ||
        null;
      return {
        score: 1900 + evidenceBonus,
        canonical_support_doc_role: "structured_renovation_capex_plan",
        document_role_label: "Structured Renovation / CapEx Plan",
        treatment_label: "Structured renovation / CapEx context",
        use_label: "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled.",
        treatment_category: "Displayed / Limited Use",
        has_structured_renovation_budget: true,
        total_budget: totalBudget,
        has_renovation_rent_lift: true,
        has_renovation_phasing: true,
        rent_lift: rentLift,
        timing_or_phasing: phasingText,
        authoritySource: "explicit_renovation_source_text",
      };
    }
    const hasPurchaseContext =
      hasAnyNumber(row, ["purchase_price", "purchasePrice", "acquisition_price", "asking_price", "purchase_price_amount", "going_in_cap_rate", "noi_basis", "net_operating_income_basis"]) ||
      /(purchase[_\s-]*assumptions|acquisition[_\s-]*context|purchase price|going[-\s]*in cap|noi basis|proposed acquisition)/i.test(text);
    const hasProposedFinancing =
      hasAnyNumber(row, ["stated_acquisition_loan_amount", "derived_acquisition_loan_amount", "proposed_loan_amount", "acquisition_loan_amount"]) ||
      (
        hasAnyNumber(row, ["ltv", "interest_rate", "amort_years", "amortization_years", "lender_fee_percent", "financing_fee_percent", "origination_fee_percent"]) &&
        /(proposed|acquisition|purchase)/i.test(text)
      );
    const hasCurrentDebt =
      !hasPurchaseContext &&
      (
        hasAnyNumber(row, ["outstanding_balance", "current_outstanding_balance", "current_loan_balance"]) ||
        /(current mortgage|current debt|existing debt|existing mortgage|outstanding principal|payoff|unpaid principal|current loan)/i.test(text)
      );
    const hasRenovation =
      hasAnyNumber(row, ["total_budget", "total_capex", "renovation_budget"]) ||
      Array.isArray(row?.budget_rows) ||
      Array.isArray(row?.execution_rows) ||
      /(renovation|capex|capital expenditure|capital budget|construction budget|scope of work|rent lift|phasing)/i.test(text);
    const hasRenovationRentLift =
      hasAnyNumber(row, ["rent_lift", "expected_monthly_rent_lift"]) ||
      /(rent lift|expected monthly rent lift)/i.test(text) ||
      [...(Array.isArray(row?.budget_rows) ? row.budget_rows : []), ...(Array.isArray(row?.execution_rows) ? row.execution_rows : [])]
        .some((item) => hasAnyNumber(item, ["expected_monthly_rent_lift", "rent_lift"]));
    const hasRenovationPhasing =
      hasAnyText(row, ["timing_or_phasing", "phase_timing", "execution_note", "source_text", "raw_text", "notes"], /\b(month|months|phase|phasing|q[1-4]|quarter|implementation schedule)\b/i) ||
      [...(Array.isArray(row?.budget_rows) ? row.budget_rows : []), ...(Array.isArray(row?.execution_rows) ? row.execution_rows : [])]
        .some((item) => hasAnyText(item, ["phase_timing", "timing_or_phasing"], /\b(month|months|phase|phasing|q[1-4]|quarter)\b/i));
    const hasPropertyTax = hasAnyNumber(row, ["annual_tax", "property_tax", "tax_amount"]) || /(property tax|tax bill|tax notice|municipal tax)/i.test(text);
      const hasMarketSurvey = /(market survey|market rent survey|rent survey|rent comp|rent comparable)/i.test(text);
      const hasEnvironmental = /(phase\s*i|phase\s*1|esa|environment|environmental|site assessment)/i.test(text);
    const hasAppraisal = /(appraisal|appraised value|valuation report|opinion of value)/i.test(text);

      if (hasProposedFinancing || hasPurchaseContext) {
        return {
          score: (hasProposedFinancing ? 860 : 800) + evidenceBonus,
          canonical_support_doc_role: hasProposedFinancing ? "proposed_acquisition_financing" : "purchase_assumptions",
          document_role_label: "Purchase Assumptions / Acquisition Context",
        treatment_label: "Acquisition context / document-derived acquisition context",
        use_label: "Purchase price / going-in cap / NOI basis and proposed acquisition financing context; does not override T12/Rent Roll operating truth.",
        treatment_category: "Displayed / Limited Use",
        has_acquisition_support: true,
        has_proposed_acquisition_financing: Boolean(hasProposedFinancing),
      };
      }
      if (hasCurrentDebt) {
        const outstandingBalance = firstFinite(
          row?.outstanding_balance,
          row?.current_outstanding_balance,
          row?.current_loan_balance,
          extractMoneyNearLabels(text, [
            "current outstanding principal balance",
            "unpaid principal balance",
            "outstanding principal balance",
            "current outstanding balance",
            "outstanding balance",
            "principal balance",
            "current loan balance",
            "mortgage balance",
            "loan balance",
            "outstanding loan",
            "remaining balance",
            "balance outstanding",
          ])
        );
        const interestRate = firstFinite(
          row?.interest_rate,
          extractPercentNearLabels(text, ["interest rate", "rate", "coupon rate", "note rate"])
        );
        const amortYears = firstFinite(
          row?.amortization_years,
          row?.amort_years,
          extractYearsNearLabels(text, ["amortization", "amort", "remaining", "years remaining"])
        );
        const ltv = firstFinite(
          row?.ltv,
          extractPercentNearLabels(text, ["ltv", "loan to value", "loan-to-value"])
        );
        return {
          score: 700 + evidenceBonus,
          canonical_support_doc_role: "current_debt_context",
          document_role_label: "Debt Support Received / Contextual",
          treatment_label: "Debt support received / contextual or deferred",
          use_label: "Uploaded existing/current debt context only; not proposed acquisition financing.",
          treatment_category: "Displayed / Limited Use",
          has_current_debt_context: true,
          outstanding_balance: outstandingBalance,
          current_outstanding_balance: outstandingBalance,
          current_loan_balance: outstandingBalance,
          interest_rate: interestRate,
          amortization_years: amortYears,
          amort_years: amortYears,
          ltv,
          debt_basis: "current_debt_context",
        };
      }
      if (hasPropertyTax) {
        return {
          score: 650 + evidenceBonus,
        canonical_support_doc_role: "property_tax",
        document_role_label: "Property Tax Support",
        treatment_label: "Corroborating support",
        use_label: "Corroborating property-tax support; does not override T12 totals.",
        treatment_category: "Displayed / Limited Use",
      };
    }
      if (hasRenovation) {
        const hasRenovationNegationSignals = /not provided|no rent lift|no roi|no payback|no implementation schedule|historical capex|historical capital|past repairs|prior work|completed work/i.test(text);
        const structured = !hasRenovationNegationSignals && (hasRenovationRentLift || hasRenovationPhasing || /structured renovation \/ capex plan|forward-looking renovation plan/i.test(text));
        const totalBudget = firstFinite(
          row?.total_budget,
          row?.total_capex,
          row?.renovation_budget,
          extractMoneyNearLabels(text, ["total renovation budget", "renovation budget", "capex budget", "capital budget"])
        );
        return {
          score: 600 + evidenceBonus,
          canonical_support_doc_role: structured ? "structured_renovation_capex_plan" : "renovation_capex_budget_context",
          document_role_label: structured ? "Structured Renovation / CapEx Plan" : "Renovation / CapEx Budget Context",
          treatment_label: structured ? "Structured renovation / CapEx context" : "Budget/scope only",
        use_label: structured
            ? "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI/payback/returns are not modeled."
            : "Document-stated renovation budget/scope is acknowledged; rent lift, ROI, payback, and phasing are not modeled unless provided.",
          treatment_category: "Displayed / Limited Use",
          has_structured_renovation_budget: true,
          total_budget: totalBudget,
          budget_rows: Array.isArray(row?.budget_rows) ? row.budget_rows : [],
          execution_rows: Array.isArray(row?.execution_rows) ? row.execution_rows : [],
          unit_count: firstFinite(row?.unit_count, row?.scope_units),
          per_unit_cost: firstFinite(row?.per_unit_cost, row?.budget_per_unit),
          timing_or_phasing: row?.timing_or_phasing || null,
          rent_lift: row?.rent_lift || null,
          has_renovation_rent_lift: Boolean(hasRenovationRentLift),
          has_renovation_phasing: Boolean(hasRenovationPhasing),
        };
      }
      if (hasMarketSurvey) {
        return {
          score: 500 + evidenceBonus,
        canonical_support_doc_role: "market_survey_context",
        document_role_label: "Market Rent Context",
        treatment_label: "Context only",
        use_label: "Market/rent context only; does not override Rent Roll market rent.",
        treatment_category: "Listed but Not Quantitatively Modeled",
      };
    }
      if (hasEnvironmental) {
        return {
          score: 400 + evidenceBonus,
        canonical_support_doc_role: "environmental_due_diligence_context",
        document_role_label: "Environmental Due Diligence Context",
        treatment_label: "Context only",
        use_label: "Environmental due-diligence context only; no quantitative model impact.",
        treatment_category: "Listed but Not Quantitatively Modeled",
      };
    }
      if (hasAppraisal) {
        return {
          score: 300 + evidenceBonus,
        canonical_support_doc_role: "appraisal_context",
        document_role_label: "Appraisal Context",
        treatment_label: "Context only",
        use_label: "Appraisal context only unless structured appraised value is verified; does not override deterministic valuation.",
        treatment_category: "Listed but Not Quantitatively Modeled",
      };
    }
      return {
        score: 100 + evidenceBonus,
      canonical_support_doc_role: "other_support_context",
      document_role_label: "Other Support Document",
      treatment_label: "Context only",
      use_label: "Listed for auditability only; not used quantitatively.",
      treatment_category: "Listed but Not Quantitatively Modeled",
    };
  };

  const authorityRows = [];
  for (const [key, entries] of grouped.entries()) {
    const enriched = entries.map(({ row, index }) => ({
      row,
      index,
      authority: classifyAuthority(row),
    }));
    enriched.sort((left, right) => right.authority.score - left.authority.score || left.index - right.index);
    const winner = enriched[0];
    const filename = String(
      winner.row?.original_filename ||
      winner.row?.source_original_filename ||
      winner.row?.file_name ||
      winner.row?.filename ||
      ""
    ).trim();
    authorityRows.push({
      ...winner.row,
      original_filename: filename,
      canonical_support_doc_identity_key: key,
      canonical_document_treatment_identity_key: key,
      semantic_doc_role: winner.authority.canonical_support_doc_role,
      semantic_doc_display_label: winner.authority.document_role_label,
      ...winner.authority,
      allowed_uses: [winner.authority.use_label],
      forbidden_uses: [
        "Does not override T12 or Rent Roll core truth.",
        "Does not open DSCR, refinance, DCF, waterfall, equity return, deal score, or final recommendation surfaces.",
      ],
    });
  }
  return authorityRows.filter((row) => String(row?.original_filename || "").trim().length > 0);
}

function buildDocumentTreatmentSummaryHtml({
  documentSources = [],
  supportDocAuthorityRows = null,
  reportMode = null,
  currentDebtAssessmentState = null,
  canonicalAcquisitionState = null,
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  documentQuantitativeUsageMap = null,
  canonicalSupportDocMap = null,
  renderedDocumentTreatmentRowsOut = null,
} = {}) {
  const normalizeIdentityToken = (value) => {
    const token = String(value ?? "").trim().toLowerCase();
    return token.length > 0 ? token : "";
  };
  const resolvePropertyTaxSourceBindings = (payload = null, bindingState = null) => {
    const bindingIds = Array.isArray(bindingState?.bindingCandidates?.idCandidates)
      ? bindingState.bindingCandidates.idCandidates
      : null;
    const bindingNames = Array.isArray(bindingState?.bindingCandidates?.nameCandidates)
      ? bindingState.bindingCandidates.nameCandidates
      : null;
    if (bindingIds || bindingNames) {
      const idCandidates = (bindingIds || []).map(normalizeIdentityToken).filter(Boolean);
      const nameCandidates = (bindingNames || []).map(normalizeIdentityToken).filter(Boolean);
      const stateHasReliableBinding =
        typeof bindingState?.hasReliableBinding === "boolean"
          ? bindingState.hasReliableBinding
          : idCandidates.length > 0 || nameCandidates.length > 0;
      if (!stateHasReliableBinding && idCandidates.length === 0 && nameCandidates.length === 0) {
        // Preserve legacy payload-derived behavior when state binding is present but empty.
      } else {
      return {
        hasReliableBinding: stateHasReliableBinding,
        idCandidates: new Set(idCandidates),
        nameCandidates: new Set(nameCandidates),
      };
      }
    }
    const idCandidates = [
      payload?.source_file_id,
      payload?.file_id,
      payload?.document_id,
      payload?.artifact_file_id,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    const nameCandidates = [
      payload?.source_original_filename,
      payload?.original_filename,
      payload?.file_name,
      payload?.filename,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    return {
      hasReliableBinding: idCandidates.length > 0 || nameCandidates.length > 0,
      idCandidates: new Set(idCandidates),
      nameCandidates: new Set(nameCandidates),
    };
  };
  const rowMatchesPropertyTaxSourceBinding = (row, binding) => {
    if (!binding?.hasReliableBinding) return false;
    const rowIdTokens = [
      row?.id,
      row?.file_id,
      row?.source_file_id,
      row?.document_id,
      row?.artifact_file_id,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    if (rowIdTokens.some((token) => binding.idCandidates.has(token))) return true;
    const rowNameTokens = [row?.original_filename, row?.file_name, row?.filename]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    return rowNameTokens.some((token) => binding.nameCandidates.has(token));
  };
  const authoritativeDocumentSources = Array.isArray(supportDocAuthorityRows) && supportDocAuthorityRows.length > 0
    ? supportDocAuthorityRows
    : canonicalizeDocumentTreatmentSources(documentSources);
  const files = authoritativeDocumentSources
    .map((row) => ({
      id: row?.id ?? null,
      file_id: row?.file_id ?? null,
      source_file_id: row?.source_file_id ?? null,
      document_id: row?.document_id ?? null,
      artifact_file_id: row?.artifact_file_id ?? null,
      purchase_price: row?.purchase_price ?? null,
      acquisition_price: row?.acquisition_price ?? null,
      asking_price: row?.asking_price ?? null,
      purchase_price_amount: row?.purchase_price_amount ?? null,
      going_in_cap_rate: row?.going_in_cap_rate ?? null,
      noi_basis: row?.noi_basis ?? null,
      net_operating_income_basis: row?.net_operating_income_basis ?? null,
      outstanding_balance: row?.outstanding_balance ?? null,
      current_outstanding_balance: row?.current_outstanding_balance ?? null,
      current_loan_balance: row?.current_loan_balance ?? null,
      loan_amount: row?.loan_amount ?? null,
      stated_acquisition_loan_amount: row?.stated_acquisition_loan_amount ?? null,
      derived_acquisition_loan_amount: row?.derived_acquisition_loan_amount ?? null,
      ltv: row?.ltv ?? null,
      interest_rate: row?.interest_rate ?? null,
      amort_years: row?.amort_years ?? null,
      amortization_years: row?.amortization_years ?? null,
      source_text: String(row?.source_text || "").trim(),
      raw_text: String(row?.raw_text || "").trim(),
      notes: String(row?.notes || "").trim(),
      loan_terms_text: String(row?.loan_terms_text || "").trim(),
      extracted_text: String(row?.extracted_text || "").trim(),
      original_filename: String(row?.original_filename || "").trim(),
      file_name: String(row?.file_name || "").trim(),
      doc_type: String(row?.doc_type || "").trim(),
      display_doc_type: String(row?.display_doc_type || "").trim(),
      semantic_doc_role: String(row?.semantic_doc_role || "").trim(),
      semantic_doc_display_label: String(row?.semantic_doc_display_label || "").trim(),
      semantic_doc_role_reason: String(row?.semantic_doc_role_reason || "").trim(),
      semantic_doc_role_confidence: row?.semantic_doc_role_confidence ?? null,
      parse_status: String(row?.parse_status || "").trim(),
      parse_error: String(row?.parse_error || "").trim(),
      canonical_support_doc_role: String(row?.canonical_support_doc_role || "").trim(),
      document_role_label: String(row?.document_role_label || "").trim(),
      treatment_label: String(row?.treatment_label || "").trim(),
      use_label: String(row?.use_label || "").trim(),
      treatment_category: String(row?.treatment_category || "").trim(),
      has_acquisition_support: row?.has_acquisition_support === true,
      has_proposed_acquisition_financing: row?.has_proposed_acquisition_financing === true,
      has_current_debt_context: row?.has_current_debt_context === true,
      has_structured_renovation_budget: row?.has_structured_renovation_budget === true,
      has_renovation_rent_lift: row?.has_renovation_rent_lift === true,
      has_renovation_phasing: row?.has_renovation_phasing === true,
  }))
    .filter((row) => row.original_filename.length > 0);
  if (!files.length) return "";
  const setRenderedDocumentTreatmentRows = (rows) => {
    if (!renderedDocumentTreatmentRowsOut) return;
    const nextRows = Array.isArray(rows) ? rows : [];
    if (Array.isArray(renderedDocumentTreatmentRowsOut)) {
      renderedDocumentTreatmentRowsOut.splice(0, renderedDocumentTreatmentRowsOut.length, ...nextRows);
      return;
    }
    if (typeof renderedDocumentTreatmentRowsOut === "object") {
      renderedDocumentTreatmentRowsOut.rows = nextRows;
    }
  };

  const canonicalSupportDocEntries = canonicalSupportDocMap instanceof Map && canonicalSupportDocMap.size > 0
    ? Array.from(canonicalSupportDocMap.entries()).filter(([fileId, authority]) => Boolean(fileId) && authority && typeof authority === "object")
    : [];
  if (canonicalSupportDocEntries.length > 0) {
    const normalizeCanonicalSupportDocAuthorityRow = (authority = {}, fileId = "") => {
      const canonicalRole = String(
        authority?.role ||
        authority?.canonical_support_doc_role ||
        authority?.semantic_doc_role ||
        ""
      ).trim();
      const roleLabel = String(
        authority?.displayLabel ||
        authority?.document_role_label ||
        authority?.semantic_doc_display_label ||
        ""
      ).trim() || "Other Support Document";
      const treatmentLabel = String(
        authority?.treatment ||
        authority?.treatment_label ||
        ""
      ).trim() || "Context only";
      const useLabel = String(
        authority?.use ||
        authority?.use_label ||
        (Array.isArray(authority?.allowed_uses) ? authority.allowed_uses[0] : "") ||
        ""
      ).trim() || "Listed for auditability only; not used quantitatively.";
      const category = String(
        authority?.category ||
        authority?.treatment_category ||
        ""
      ).trim() || "Listed but Not Quantitatively Modeled";
      const originalFilename = String(
        authority?.originalFilename ||
        authority?.original_filename ||
        authority?.file_name ||
        authority?.filename ||
        fileId ||
        ""
      ).trim() || String(fileId || "");
      return {
        fileId: String(fileId || "").trim(),
        category,
        canonicalRole: canonicalRole || "other_support_context",
        displayLabel: roleLabel || "Other Support Document",
        treatmentLabel,
        useLabel,
        originalFilename,
        authoritySource: String(authority?.authoritySource || authority?.authority_source || "canonical_support_doc_authority").trim() || "canonical_support_doc_authority",
        confidence: Number.isFinite(Number(authority?.confidence)) ? Number(authority.confidence) : null,
        sourceText: String(
          authority?.source_text ||
          authority?.raw_text ||
          authority?.extracted_text ||
          authority?.notes ||
          authority?.loan_terms_text ||
          ""
        ).trim(),
        parserRole: String(authority?.semantic_doc_role || authority?.parser_role || "").trim(),
        parserDisplayLabel: String(authority?.semantic_doc_display_label || authority?.parser_display_label || "").trim(),
        outstanding_balance: authority?.outstanding_balance ?? authority?.current_outstanding_balance ?? authority?.current_loan_balance ?? null,
        purchase_price: authority?.purchase_price ?? authority?.acquisition_price ?? authority?.asking_price ?? null,
        total_budget: authority?.total_budget ?? authority?.total_capex ?? authority?.renovation_budget ?? null,
        interest_rate: authority?.interest_rate ?? null,
        amortization_years: authority?.amortization_years ?? authority?.amort_years ?? null,
        ltv: authority?.ltv ?? null,
        lender_fee_percent: authority?.lender_fee_percent ?? authority?.financing_fee_percent ?? authority?.origination_fee_percent ?? null,
        rent_lift: authority?.rent_lift ?? null,
        timing_or_phasing: authority?.timing_or_phasing ?? null,
        budget_rows: Array.isArray(authority?.budget_rows) ? authority.budget_rows : null,
        execution_rows: Array.isArray(authority?.execution_rows) ? authority.execution_rows : null,
        invariant_status: authority?.invariant_status || authority?.treatment_category || null,
      };
    };
    const canonicalRows = canonicalSupportDocEntries.map(([fileId, authority]) => {
      const normalized = normalizeCanonicalSupportDocAuthorityRow(authority, fileId);
      return {
        key: String(normalized.fileId || fileId).toLowerCase(),
        name: escapeHtml(normalized.originalFilename),
        role: escapeHtml(normalized.displayLabel),
        treatment: escapeHtml(normalized.treatmentLabel),
        use: escapeHtml(normalized.useLabel),
        note: escapeHtml(normalized.useLabel),
        source_basis: normalized.authoritySource,
        reason_code: `canonical_support_doc_${String(normalized.canonicalRole || "other_support").toLowerCase().replace(/[^a-z0-9]+/g, "_") || "other_support"}`,
        category: normalized.category,
        normalized,
      };
    });
    const canonicalModeled = [];
    const canonicalLimitedUse = [];
    const canonicalNotModeled = [];
    const pushUnique = (bucket, entry) => {
      if (!entry || bucket.some((existing) => existing.key === entry.key)) return;
      bucket.push(entry);
    };
    for (const row of canonicalRows) {
      if (row.category === "Modeled Inputs") {
        pushUnique(canonicalModeled, row);
      } else if (row.category === "Displayed / Limited Use") {
        pushUnique(canonicalLimitedUse, row);
      } else {
        pushUnique(canonicalNotModeled, row);
      }
    }
    const section = (title, items, emptyNote) => {
      const listHtml = items.length
        ? `<ul style="margin:6px 0 0 18px;padding:0;">${items
            .map((item) => `<li data-treatment-source="${escapeHtml(item.source_basis || "")}" data-treatment-code="${escapeHtml(item.reason_code || "")}" style="margin:0 0 4px 0;">${item.name}${item.note ? ` <span style="color:#64748b;">- ${item.note}</span>` : ""}</li>`)
            .join("")}</ul>`
        : `<p class="small" style="margin:6px 0 0 0;color:#64748b;">${escapeHtml(emptyNote)}</p>`;
      return `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:#1F3A5F;">${escapeHtml(title)}</div>${listHtml}</div>`;
    };
    const sourceTreatmentCellStyle = "padding:4px 8px;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;";
    const sourceTreatmentRowsHtml = canonicalRows
      .map((row) => `<tr><td style="${sourceTreatmentCellStyle}">${row.name}</td><td style="${sourceTreatmentCellStyle}">${row.role}</td><td style="${sourceTreatmentCellStyle}">${row.treatment}</td><td style="${sourceTreatmentCellStyle}">${row.use}</td></tr>`)
      .join("");
    const sourceTreatmentTableHtml = sourceTreatmentRowsHtml
      ? `<div style="margin-top:10px;"><p class="subsection-title">Source Treatment / Quantitative Use</p><table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:28%;">Filename</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Document Role</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Treatment</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Use</th></tr></thead><tbody>${sourceTreatmentRowsHtml}</tbody></table></div>`
      : "";
    setRenderedDocumentTreatmentRows(
      canonicalRows.map((row) => ({
        filename: String(row.normalized?.originalFilename || row.name || "").trim(),
        displayLabel: String(row.normalized?.displayLabel || row.role || "").trim(),
        treatment: String(row.normalized?.treatmentLabel || row.treatment || "").trim(),
        use: String(row.normalized?.useLabel || row.use || "").trim(),
      }))
    );
    return `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Document Treatment Summary</p><p class="small" style="margin:0;color:#374151;">Uploaded files are listed for auditability. Only structured source inputs are used quantitatively. Unsupported or unclassified support files are not used to override modeled outputs.</p>${sourceTreatmentTableHtml}${section("Modeled Inputs", canonicalModeled, "No modeled inputs were classified from structured source metadata.")}${section("Displayed / Limited Use", canonicalLimitedUse, "No limited-use historical capital items were classified from structured source metadata.")}${section("Listed but Not Quantitatively Modeled", canonicalNotModeled, "No additional unmodeled support files were identified.")}</div>`;
  }

  // LEGACY FALLBACK – DO NOT USE FOR NEW REPORTS
  const modeled = [];
  const limitedUse = [];
  const notModeled = [];
  const pushUnique = (bucket, entry) => {
    if (!entry || bucket.some((existing) => existing.key === entry.key)) return;
    bucket.push(entry);
  };
  const normalizedText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();
  const hasText = (value, pattern) => pattern.test(normalizedText(value));
  const hasAnyText = (...values) => values.some((value) => String(value || "").trim().length > 0);
  const launchMemoMode = String(reportMode || "").toLowerCase() === "v1_core";
  const acquisitionAuthorityPayload =
    (acquisitionTermsPayload && typeof acquisitionTermsPayload === "object" ? acquisitionTermsPayload : null) ||
    (loanTermSheetTermsPayload && typeof loanTermSheetTermsPayload === "object" ? loanTermSheetTermsPayload : null);
  const hasCanonicalAcquisitionAuthority = Boolean(
    canonicalAcquisitionState &&
      (
        canonicalAcquisitionState.has_validated_acquisition_assumptions === true ||
        canonicalAcquisitionState.has_proposed_acquisition_financing === true ||
        canonicalAcquisitionState.acquisition_assumptions_supported === true
      )
  ) || Boolean(
    acquisitionAuthorityPayload &&
      (
        Number.isFinite(coerceNumber(acquisitionAuthorityPayload?.purchase_price)) ||
        Number.isFinite(coerceNumber(acquisitionAuthorityPayload?.going_in_cap_rate)) ||
        Number.isFinite(coerceNumber(acquisitionAuthorityPayload?.noi_basis)) ||
        Number.isFinite(coerceNumber(acquisitionAuthorityPayload?.stated_acquisition_loan_amount)) ||
        Number.isFinite(coerceNumber(acquisitionAuthorityPayload?.derived_acquisition_loan_amount))
      )
  );
  const hasForwardLookingRenovationRowSignals = () => {
    const rows = [
      ...(Array.isArray(renovationPayload?.budget_rows) ? renovationPayload.budget_rows : []),
      ...(Array.isArray(renovationPayload?.execution_rows) ? renovationPayload.execution_rows : []),
    ];
    return rows.some((row) => {
      const phaseTiming = normalizedText(row?.phase_timing || row?.timing_or_phasing || "");
      const hasFutureTiming = /\b(month|months|phase|q[1-4]|quarter|year|years)\b/.test(phaseTiming) && !/\bhistorical\b/.test(phaseTiming);
      const hasRentLift = Number.isFinite(coerceNumber(row?.expected_monthly_rent_lift)) && coerceNumber(row?.expected_monthly_rent_lift) > 0;
      return hasFutureTiming || hasRentLift;
    });
  };
  const hasHistoricalOnlyRenovationEvidence = (row = null) => {
    const payloadText = [
      renovationPayload?.timing_or_phasing,
      renovationPayload?.interpretation,
      renovationPayload?.budget_note,
      renovationPayload?.execution_note,
    ]
      .map(normalizedText)
      .join(" | ");
    const rowText = [
      row?.semantic_doc_role,
      row?.semantic_doc_display_label,
      row?.semantic_doc_role_reason,
      row?.display_doc_type,
      row?.doc_type,
      row?.parse_error,
    ]
      .map(normalizedText)
      .join(" | ");
    const combined = `${payloadText} | ${rowText}`;
    const explicitHistoricalSignals =
      /(^|[^a-z])historical([^a-z]|$)|past repairs?|prior work|completed work|completed items?|historical capex|historical capital/i.test(combined);
    const explicitNoForwardSignals =
      /no forward-looking budget|no rent lift|no roi|no payback|no implementation schedule/i.test(combined);
    const timingHistorical = /\btiming[_\s-]*or[_\s-]*phasing\b[\s\S]{0,30}\bhistorical\b/i.test(`timing_or_phasing ${payloadText}`) ||
      /\bhistorical\b/.test(normalizedText(renovationPayload?.timing_or_phasing));
    return explicitHistoricalSignals || explicitNoForwardSignals || timingHistorical;
  };
  const currentDebtHasTrueBalance = Boolean(currentDebtAssessmentState?.has_true_current_debt_balance);
  const currentDebtIsAssessed = currentDebtAssessmentState?.current_debt_dscr_status === "computed";
  const hasValidatedModeledPropertyTax =
    propertyTaxBindingState?.hasValidatedAnnualTax === true ||
    isValidAnnualPropertyTaxValue(propertyTaxPayload?.annual_tax);
  const propertyTaxSourceBinding = resolvePropertyTaxSourceBindings(propertyTaxPayload, propertyTaxBindingState);
  const quantitativeUsageRows = Array.isArray(documentQuantitativeUsageMap?.rows)
    ? documentQuantitativeUsageMap.rows
    : [];
  const findQuantitativeUsage = (row) => {
    if (!quantitativeUsageRows.length) return null;
    const rowIdTokens = [
      row?.id,
      row?.file_id,
      row?.source_file_id,
      row?.document_id,
      row?.artifact_file_id,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    if (rowIdTokens.length > 0) {
      const idMatch = quantitativeUsageRows.find((entry) => {
        const ids = entry?.identity?.idTokens;
        return ids instanceof Set && rowIdTokens.some((token) => ids.has(token));
      });
      if (idMatch) return idMatch;
    }
    const rowNameTokens = [row?.original_filename, row?.file_name, row?.filename]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    if (rowNameTokens.length === 0) return null;
    return quantitativeUsageRows.find((entry) => {
      const names = entry?.identity?.nameTokens;
      return names instanceof Set && rowNameTokens.some((token) => names.has(token));
    }) || null;
  };
  const rowHasAcquisitionSupport = (row) =>
    (Number.isFinite(coerceNumber(row?.purchase_price)) && coerceNumber(row?.purchase_price) > 0) ||
    (Number.isFinite(coerceNumber(row?.acquisition_price)) && coerceNumber(row?.acquisition_price) > 0) ||
    (Number.isFinite(coerceNumber(row?.asking_price)) && coerceNumber(row?.asking_price) > 0) ||
    (Number.isFinite(coerceNumber(row?.purchase_price_amount)) && coerceNumber(row?.purchase_price_amount) > 0) ||
    (Number.isFinite(coerceNumber(row?.going_in_cap_rate)) && coerceNumber(row?.going_in_cap_rate) > 0) ||
    (Number.isFinite(coerceNumber(row?.noi_basis)) && coerceNumber(row?.noi_basis) > 0) ||
    (Number.isFinite(coerceNumber(row?.net_operating_income_basis)) && coerceNumber(row?.net_operating_income_basis) > 0) ||
    /purchase price|going[-\s]*in cap|noi basis|net operating income basis|acquisition context|purchase context|document-derived cap-rate reference/i.test(
      normalizedText([row?.source_text, row?.raw_text, row?.notes, row?.loan_terms_text, row?.extracted_text].filter(Boolean).join(" | "))
    );
  const sourceTreatmentIdentityKey = (row) => {
    const tokens = [
      row?.source_file_id,
      row?.file_id,
      row?.document_id,
      row?.artifact_file_id,
      row?.original_filename,
    ]
      .map(normalizeIdentityToken)
      .filter(Boolean);
    return tokens[0] || "";
  };
  const sourceTreatmentAuthorityScore = (row, classification) => {
    const canonicalRole = normalizedText(row?.semantic_doc_role || row?.display_doc_type || row?.doc_type || "");
    const reason = normalizedText(classification?.reason_code || "");
    let tier = 100;
    if (
      canonicalRole === "t12" ||
      canonicalRole === "rent_roll" ||
      reason === "structured_operating_input" ||
      reason === "structured_rent_roll_input"
    ) {
      tier = 900;
    } else if (
      rowHasAcquisitionSupport(row) &&
      (reason === "purchase_assumptions_acquisition_context" ||
        reason === "loan_term_sheet_acquisition_context" ||
        canonicalRole === "purchase_assumptions" ||
        canonicalRole === "loan_term_sheet")
    ) {
      tier = 800;
    } else if (
      reason === "property_tax_support_corroborating" ||
      reason === "property_tax_support_unbound" ||
      canonicalRole === "property_tax"
    ) {
      tier = 700;
    } else if (
      reason === "current_debt_not_assessed" ||
      reason === "current_debt_not_used_here" ||
      reason === "structured_current_debt_input" ||
      reason === "canonical_current_debt_quantitative_usage" ||
      canonicalRole === "current_mortgage_statement" ||
      canonicalRole === "loan_term_sheet"
    ) {
      tier = 600;
    } else if (
      reason === "historical_capex_only" ||
      reason === "renovation_budget_no_roi_inputs" ||
      reason === "renovation_forward_looking_transparency_only" ||
      canonicalRole === "renovation_budget"
    ) {
      tier = 500;
    } else if (reason === "market_survey_context_only" || canonicalRole === "market_survey") {
      tier = 400;
    } else if (
      reason === "environmental_support_context_only" ||
      reason === "zoning_compliance_context_only" ||
      canonicalRole === "environmental_due_diligence" ||
      canonicalRole === "zoning_compliance_context"
    ) {
      tier = 300;
    } else if (reason === "unsupported_appraisal_or_market_source" || canonicalRole === "appraisal") {
      tier = 200;
    }
    const parsedBonus = String(row?.parse_status || "").toLowerCase() === "parsed" ? 10 : 0;
    const warningPenalty = /warning|parsed_with_warnings/.test(normalizedText(row?.parse_status || "")) ? -5 : 0;
    const acquisitionBonus = rowHasAcquisitionSupport(row) ? 20 : 0;
    return tier * 1000 + parsedBonus + warningPenalty + acquisitionBonus;
  };
  const sourceTreatmentEntriesByIdentity = new Map();
  const classifyRow = (row) => {
    if (row?.canonical_support_doc_role && row?.treatment_label && row?.use_label) {
      const reasonCode = `canonical_support_doc_${normalizedText(row.canonical_support_doc_role).replace(/[^a-z0-9]+/g, "_")}`;
      return {
        category: row.treatment_category || "Displayed / Limited Use",
        note: row.use_label,
        reason_code: reasonCode,
        source_basis: "canonical_support_doc_authority",
      };
    }
    const quantitativeUsage = findQuantitativeUsage(row);
    if (quantitativeUsage?.usageType === "current_debt") {
      return {
        category: "Modeled Inputs",
        note: "Structured current debt input",
        reason_code: "canonical_current_debt_quantitative_usage",
        source_basis: quantitativeUsage?.source_basis || "canonical_usage_map",
      };
    }
    const canonicalSupportDocTaxonomy = buildSupportDocTaxonomyState({
      declaredDocType: row?.doc_type || null,
      detectedDocType: row?.display_doc_type || null,
      originalFilename: row?.original_filename || null,
      rawText: [
        row?.source_text,
        row?.raw_text,
        row?.notes,
        row?.loan_terms_text,
        row?.extracted_text,
      ].filter(Boolean).join(" | "),
      payload: {
        semantic_doc_role: row?.semantic_doc_role || null,
        semantic_doc_role_reason: row?.semantic_doc_role_reason || null,
        doc_type: row?.doc_type || null,
        display_doc_type: row?.display_doc_type || null,
      },
    });
    const canonicalRole = normalizedText(canonicalSupportDocTaxonomy?.semantic_doc_role || "");
    const existingSemanticRole = normalizedText(row?.semantic_doc_role || "");
    const trustedExistingRoleSet = new Set([
      "t12",
      "rent_roll",
      "current_mortgage_statement",
      "property_tax",
      "renovation_budget",
      "loan_term_sheet",
      "purchase_assumptions",
      "appraisal",
      "environmental_due_diligence",
      "zoning_compliance_context",
      "broker_email",
    ]);
    const hasSemanticMetadata = hasAnyText(
      row.semantic_doc_role,
      row.semantic_doc_display_label,
      row.display_doc_type,
      row.doc_type,
      row.parse_status,
      row.parse_error
    );
    const sourceBasis = hasSemanticMetadata ? "metadata" : "filename_fallback";
    const metadataText = [
      row.semantic_doc_role,
      row.semantic_doc_display_label,
      row.display_doc_type,
      row.doc_type,
      row.parse_status,
      row.parse_error,
    ]
      .map(normalizedText)
      .join(" | ");
    const fileText = normalizedText(row.original_filename);
    const isParsed = /parsed/.test(metadataText);
    const hasWarnings = /parsed_with_warnings|warning/.test(metadataText);
    const isUnclassified = /unclassified|supporting_documents_unclassified|doc_type_unclassified/.test(metadataText);
    const filenameOnly = sourceBasis === "filename_fallback";
    const semanticText = hasSemanticMetadata ? metadataText : "";
    const semanticAndFileText = `${semanticText} | ${fileText}`;
    const purchaseAssumptionsFilenameHint = /purchase[_\s-]?assumptions/.test(fileText);
    const canonicalAcquisitionRoleOverride = hasCanonicalAcquisitionAuthority && purchaseAssumptionsFilenameHint;
    const explicitEnvironmentalSignals = /(phase[\s_]*i|phase[\s_]*1|esa|environment|environmental|site assessment|recognized environmental condition|recognized environmental conditions|\brec\b)/.test(semanticAndFileText);
    const explicitZoningSignals = /(zoning|compliance|permitted use|municipal zoning|land use|entitlement|municipal code)/.test(semanticAndFileText);
    const canonicalRoleCandidate =
      canonicalAcquisitionRoleOverride
        ? "purchase_assumptions"
        : canonicalRole && canonicalRole !== "other_support"
        ? canonicalRole
        : trustedExistingRoleSet.has(existingSemanticRole)
        ? existingSemanticRole
        : canonicalRole;
    const effectiveCanonicalRole =
      canonicalRoleCandidate === "environmental_due_diligence" && !explicitEnvironmentalSignals
        ? ""
        : canonicalRoleCandidate === "zoning_compliance_context" && !explicitZoningSignals
        ? ""
        : canonicalRoleCandidate;
    const hasUsefulCanonicalRole = effectiveCanonicalRole.length > 0 && effectiveCanonicalRole !== "other_support";

    const supportedOperating = hasUsefulCanonicalRole
      ? effectiveCanonicalRole === "t12"
      : /(^|\b)(t12|trailing-?12|ttm operating statement|operating statement|income statement)(\b|$)/.test(semanticText);
    const supportedRentRoll = hasUsefulCanonicalRole
      ? effectiveCanonicalRole === "rent_roll"
      : /(^|\b)(rent roll|rent_roll)(\b|$)/.test(semanticText);
    const supportedMortgage =
      hasUsefulCanonicalRole
        ? effectiveCanonicalRole === "current_mortgage_statement"
        : /(^|\b)(mortgage statement|current mortgage statement|mortgage_statement)(\b|$)/.test(semanticText);
    const supportedPropertyTax =
      hasUsefulCanonicalRole
        ? effectiveCanonicalRole === "property_tax"
        : /(^|\b)(property tax|property_tax|tax bill|tax notice|municipal tax)(\b|$)/.test(semanticText);
    const supportedRenovation =
      hasUsefulCanonicalRole
        ? effectiveCanonicalRole === "renovation_budget" ||
          effectiveCanonicalRole === "structured_renovation_capex_plan" ||
          effectiveCanonicalRole === "renovation_capex_budget_context"
        : /(^|\b)(renovation|renovation_budget|capex|cap ex|capital expenditure|capital plan|capital budget)(\b|$)/.test(semanticText);
    const supportedLoanTerms =
      hasUsefulCanonicalRole
        ? (effectiveCanonicalRole === "loan_term_sheet" || effectiveCanonicalRole === "purchase_assumptions")
        : /(^|\b)(loan term sheet|loan_term_sheet|purchase assumptions|proposed acquisition financing)(\b|$)/.test(semanticText);
    const hasLaunchAcquisitionContext = rowHasAcquisitionSupport(row) || canonicalAcquisitionRoleOverride;
    const appraisalLike =
      hasUsefulCanonicalRole
        ? effectiveCanonicalRole === "appraisal" && !hasLaunchAcquisitionContext
        : /(^|\b)(appraisal|valuation report|opinion of value|appraised value)(\b|$)/.test(semanticAndFileText);
    const marketSurveyLike =
      /(market[\s_]*survey|market[\s_]*rent[\s_]*survey|rent[\s_]*survey|rent[\s_]*comp(?:arables)?)/.test(semanticAndFileText);
    const environmentalLike = hasUsefulCanonicalRole
      ? effectiveCanonicalRole === "environmental_due_diligence"
      : /(^|\b)(phase i|phase 1|phase_i|esa|environment|environmental|site assessment|recognized environmental condition|recognized environmental conditions|rec)(\b|$)/.test(semanticAndFileText);
    const zoningComplianceLike = hasUsefulCanonicalRole
      ? effectiveCanonicalRole === "zoning_compliance_context"
      : /(^|\b)(zoning|compliance|permitted use|municipal zoning|land use|entitlement|municipal code)(\b|$)/.test(semanticAndFileText);
    const phaseIOrContext = /(^|\b)(phase i|phase_i|esa|environment|broker|email|background|supporting|generic|document)(\b|$)/.test(semanticAndFileText);

    if (supportedOperating) {
      return {
        category: isParsed && !hasWarnings && !isUnclassified ? "Modeled Inputs" : "Displayed / Limited Use",
        note: isParsed && !hasWarnings && !isUnclassified
          ? "Structured operating input"
          : "Operating support is displayed only; structured parsed state was not validated for modeled use.",
        reason_code: isParsed && !hasWarnings && !isUnclassified ? "structured_operating_input" : "operating_support_limited_use",
        source_basis: sourceBasis,
      };
    }
    if (marketSurveyLike) {
      return {
        category: "Listed but Not Quantitatively Modeled",
        note: "Market survey / rent context only; not used to override rent roll.",
        reason_code: "market_survey_context_only",
        source_basis: sourceBasis,
      };
    }
    if (supportedRentRoll) {
      return {
        category: isParsed && !hasWarnings && !isUnclassified ? "Modeled Inputs" : "Displayed / Limited Use",
        note: isParsed && !hasWarnings && !isUnclassified
          ? "Structured rent roll input"
          : "Rent-roll support is displayed only; structured parsed state was not validated for modeled use.",
        reason_code: isParsed && !hasWarnings && !isUnclassified ? "structured_rent_roll_input" : "rent_roll_support_limited_use",
        source_basis: sourceBasis,
      };
    }
    if (supportedMortgage) {
      if (launchMemoMode) {
        return {
          category: "Displayed / Limited Use",
          note: currentDebtHasTrueBalance
            ? "Debt support received / contextual or deferred."
            : "Debt support received / contextual or deferred.",
          reason_code: currentDebtHasTrueBalance ? "current_debt_not_used_here" : "current_debt_not_assessed",
          source_basis: sourceBasis,
        };
      }
      if (isParsed && !hasWarnings && !isUnclassified && currentDebtHasTrueBalance && currentDebtIsAssessed) {
        return {
          category: "Modeled Inputs",
          note: "Structured current debt input",
          reason_code: "structured_current_debt_input",
          source_basis: sourceBasis,
        };
      }
      return {
        category: hasWarnings || isUnclassified ? "Listed but Not Quantitatively Modeled" : "Displayed / Limited Use",
        note: currentDebtHasTrueBalance
          ? "Current debt input is not used quantitatively here."
          : "Current debt support only; no verified current debt balance.",
        reason_code: currentDebtHasTrueBalance ? "current_debt_not_used_here" : "current_debt_not_assessed",
        source_basis: sourceBasis,
      };
    }
    if (environmentalLike) {
      return {
        category: "Listed but Not Quantitatively Modeled",
        note: "Environmental due-diligence context only; not used quantitatively.",
        reason_code: "environmental_support_context_only",
        source_basis: sourceBasis,
      };
    }
    if (zoningComplianceLike) {
      return {
        category: "Listed but Not Quantitatively Modeled",
        note: "Zoning/compliance context only; not used quantitatively.",
        reason_code: "zoning_compliance_context_only",
        source_basis: sourceBasis,
      };
    }
    if (supportedPropertyTax && !filenameOnly && !environmentalLike && !zoningComplianceLike) {
      const boundToValidatedPropertyTaxSource = rowMatchesPropertyTaxSourceBinding(row, propertyTaxSourceBinding);
      const canUseCorroboratingPropertyTaxLabel = isParsed &&
        !hasWarnings &&
        !isUnclassified &&
        hasValidatedModeledPropertyTax &&
        boundToValidatedPropertyTaxSource;
      return {
        category: canUseCorroboratingPropertyTaxLabel ? "Displayed / Limited Use" : "Displayed / Limited Use",
        note: canUseCorroboratingPropertyTaxLabel
          ? "Limited corroborating support: supports T12 property tax line; not used to override T12 totals."
          : "Uploaded support document - not used quantitatively.",
        reason_code: canUseCorroboratingPropertyTaxLabel ? "property_tax_support_corroborating" : "property_tax_support_unbound",
        source_basis: sourceBasis,
      };
    }
    const acquisitionContextSemanticHint =
      /purchase price|going[-\s]*in cap|noi basis|net operating income basis|acquisition context|purchase context|document-derived cap-rate reference/i.test(semanticAndFileText);
    const acquisitionContextRoleHint =
      effectiveCanonicalRole === "purchase_assumptions" ||
      effectiveCanonicalRole === "loan_term_sheet" ||
      effectiveCanonicalRole === "appraisal" ||
      effectiveCanonicalRole === "other_support";
    if (
      hasLaunchAcquisitionContext &&
      (purchaseAssumptionsFilenameHint || acquisitionContextSemanticHint || acquisitionContextRoleHint)
    ) {
      return {
        category: "Displayed / Limited Use",
        note: "Purchase price / going-in cap / NOI basis support; does not override T12/Rent Roll operating truth.",
        reason_code: "purchase_assumptions_acquisition_context",
        source_basis: sourceBasis,
      };
    }
    if (supportedRenovation) {
      const renovationSourceBasis =
        sourceBasis === "metadata"
          ? "metadata"
          : sourceBasis === "filename_fallback"
          ? "filename_fallback"
          : "artifact_inventory";
      const normalizedRenovationDisplayMode =
        renovationDisplayMode === "forward_looking_modelable" ||
        renovationDisplayMode === "forward_looking_with_rent_lift" ||
        renovationDisplayMode === "budget_only_no_roi" ||
        renovationDisplayMode === "historical_only"
          ? renovationDisplayMode
          : "historical_only";
      const historicalOnlyOverride = hasHistoricalOnlyRenovationEvidence(row);
      const hasForwardLookingRenovationRowSupport = hasForwardLookingRenovationRowSignals();
      const hasValidatedForwardLookingRenovationSupport = Boolean(
        hasForwardLookingRenovationInputs || hasForwardLookingRenovationRowSupport
      );
      if (historicalOnlyOverride) {
        return {
          category: "Displayed / Limited Use",
          note: "Historical capital items are displayed for context only.",
          reason_code: "historical_capex_only",
          source_basis: renovationSourceBasis,
        };
      }
      if (normalizedRenovationDisplayMode === "forward_looking_modelable" && hasValidatedForwardLookingRenovationSupport) {
        return {
          category: "Displayed / Limited Use",
          note: "Structured renovation budget and timing/phasing are displayed for source transparency only; ROI, payback, NOI impact, valuation, and refinance outputs are not modeled.",
          reason_code: "forward_looking_renovation_input",
          source_basis: renovationSourceBasis,
        };
      }
      if (normalizedRenovationDisplayMode === "forward_looking_with_rent_lift" && hasValidatedForwardLookingRenovationSupport) {
        return {
          category: "Displayed / Limited Use",
          note: "Structured renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; ROI, payback, NOI impact, valuation, and refinance outputs are not modeled.",
          reason_code: "forward_looking_renovation_rent_lift_input",
          source_basis: renovationSourceBasis,
        };
      }
      if (normalizedRenovationDisplayMode === "budget_only_no_roi") {
        return {
          category: "Displayed / Limited Use",
          note: "Budget/scope only; no ROI/payback/rent-lift modeling",
          reason_code: "renovation_budget_no_roi_inputs",
          source_basis: renovationSourceBasis,
        };
      }
      if (normalizedRenovationDisplayMode === "historical_only" && hasValidatedForwardLookingRenovationSupport) {
        return {
          category: "Displayed / Limited Use",
          note: "Document-stated renovation budget, rent-lift assumptions, and phasing are displayed for source transparency only; not used for ROI, payback, NOI, valuation, or refinance outputs.",
          reason_code: "renovation_forward_looking_transparency_only",
          source_basis: renovationSourceBasis,
        };
      }
      return {
        category: "Displayed / Limited Use",
        note: "Historical capital items are displayed for context only.",
        reason_code: "historical_capex_only",
        source_basis: renovationSourceBasis,
      };
    }
    if (supportedLoanTerms) {
      const purchaseAssumptionsLike =
        effectiveCanonicalRole === "purchase_assumptions" ||
        /(^|\b)purchase[_\s-]?assumptions(\b|$)/.test(semanticAndFileText);
      const hasDocumentDerivedAcquisitionContext =
        hasLaunchAcquisitionContext ||
        (typeof purchasePrice !== "undefined" && Number.isFinite(purchasePrice) && purchasePrice > 0) ||
        (typeof goingInCapRate !== "undefined" && Number.isFinite(goingInCapRate) && goingInCapRate > 0);
      if (purchaseAssumptionsLike) {
        return {
          category: "Displayed / Limited Use",
          note: hasDocumentDerivedAcquisitionContext
            ? "Acquisition assumptions context only; used only for displayed purchase/cap-rate context and not used to override T12, Rent Roll, or current debt."
            : "Acquisition context only; not quantitatively modeled.",
          reason_code: hasDocumentDerivedAcquisitionContext
            ? "loan_term_sheet_acquisition_context"
            : "purchase_assumptions_context_only",
          source_basis: sourceBasis,
        };
      }
      return {
        category: hasDocumentDerivedAcquisitionContext
          ? "Purchase Assumptions / Acquisition Context"
          : "Displayed / Limited Use",
        note: hasDocumentDerivedAcquisitionContext
          ? "Acquisition context / document-derived purchase-price or cap-rate reference. Does not override T12 or Rent Roll."
          : (launchMemoMode ? "Debt support received / contextual or deferred." : "Acquisition context only; not quantitatively modeled."),
        reason_code: hasDocumentDerivedAcquisitionContext
          ? "loan_term_sheet_acquisition_context"
          : (launchMemoMode ? "current_debt_not_used_here" : "loan_term_sheet_proposed_acquisition_only"),
        source_basis: sourceBasis,
      };
    }
    if (appraisalLike) {
      return {
        category: "Listed but Not Quantitatively Modeled",
        note: "Listed for auditability only; not used quantitatively",
        reason_code: "unsupported_appraisal_or_market_source",
        source_basis: sourceBasis,
      };
    }
    if (phaseIOrContext || isUnclassified || hasWarnings) {
      return {
        category: "Listed but Not Quantitatively Modeled",
        note: "Listed for auditability only; not used quantitatively",
        reason_code: isUnclassified ? "unclassified_support_file" : hasWarnings ? "parse_warning_support_file" : "support_context_file",
        source_basis: sourceBasis,
      };
    }
    if (filenameOnly) {
      const lower = fileText;
      const boundToValidatedPropertyTaxSource = rowMatchesPropertyTaxSourceBinding(row, propertyTaxSourceBinding);
      const canUsePropertyTaxSupportLabel =
        hasValidatedModeledPropertyTax &&
        propertyTaxSourceBinding.hasReliableBinding &&
        boundToValidatedPropertyTaxSource;
      const filenameFallbackClass =
        /\bt12\b|trailing[- ]?12|12[- ]?month|ttm operating statement|operating statement/.test(lower)
          ? {
              category: "Displayed / Limited Use",
              note: "Operating support is displayed only; filename-only evidence is not modeled.",
              reason_code: "filename_fallback_operating_support_only",
            }
          : /rent\s*roll/.test(lower)
          ? {
              category: "Displayed / Limited Use",
              note: "Rent-roll support is displayed only; filename-only evidence is not modeled.",
              reason_code: "filename_fallback_rent_roll_support_only",
            }
          : /property\s*tax|tax\s*notice|tax\s*bill|municipal\s*tax/.test(lower) && !/phase\s*i|esa|environment|environmental|zoning|compliance/.test(lower)
          ? {
              category: "Displayed / Limited Use",
              note: canUsePropertyTaxSupportLabel
                ? "Limited corroborating support: supports T12 property tax line; not used to override T12 totals."
                : "Uploaded support document - not used quantitatively.",
              reason_code: canUsePropertyTaxSupportLabel
                ? "filename_fallback_property_tax_support_corroborating"
                : "filename_fallback_property_tax_support_unbound",
            }
          : /phase\s*i|esa|environment|environmental/.test(lower)
          ? {
              category: "Listed but Not Quantitatively Modeled",
              note: "Environmental due-diligence context only; not used quantitatively.",
              reason_code: "filename_fallback_environmental_support_only",
            }
          : /zoning|compliance|land\s*use|entitlement/.test(lower)
          ? {
              category: "Listed but Not Quantitatively Modeled",
              note: "Zoning/compliance context only; not used quantitatively.",
              reason_code: "filename_fallback_zoning_support_only",
            }
          : /debt|mortgage|loan|lender|amort|interest\s*rate|term\s*sheet/.test(lower)
          ? {
              category: "Displayed / Limited Use",
              note: "Debt support is displayed only; filename-only evidence is not modeled.",
              reason_code: "filename_fallback_debt_support_only",
            }
          : /capex|capital expenditure|renovation|construction budget|scope of work|improvement/.test(lower)
          ? {
              category: "Displayed / Limited Use",
              note: "Historical capital items are displayed for context only.",
              reason_code: "historical_capex_only",
            }
          : /(market[\s_]*survey|market[\s_]*rent[\s_]*survey|rent[\s_]*survey|rent[\s_]*comp(?:arables)?)/.test(lower)
          ? {
              category: "Listed but Not Quantitatively Modeled",
              note: "Market survey / rent context only; not used to override rent roll.",
              reason_code: "filename_fallback_market_survey_context_only",
            }
          : /appraisal/.test(lower)
          ? {
              category: "Listed but Not Quantitatively Modeled",
              note: "Listed for auditability only; not used quantitatively",
              reason_code: "filename_fallback_unsupported_appraisal_source",
            }
          : /phase i|broker|email|background|supporting/.test(lower)
          ? {
              category: "Listed but Not Quantitatively Modeled",
              note: "Listed for auditability only; not used quantitatively",
              reason_code: "filename_fallback_unclassified_support_file",
            }
          : {
              category: "Listed but Not Quantitatively Modeled",
              note: "Listed for auditability only; not used quantitatively",
              reason_code: "filename_fallback_unclassified_support_file",
            };
      return {
        ...filenameFallbackClass,
        source_basis: "filename_fallback",
      };
    }
    return {
      category: "Listed but Not Quantitatively Modeled",
      note: "Listed for auditability only; not used quantitatively",
      reason_code: "unclassified_support_file",
      source_basis: sourceBasis,
    };
  };

  const sourceTreatmentEntries = [];
  files.forEach((file, sourceIndex) => {
    const classification = classifyRow(file);
    const sourceIdentityKey = sourceTreatmentIdentityKey(file);
    const sourceTreatmentAuthorityScoreValue = sourceTreatmentAuthorityScore(file, classification);
    const groupedEntry = {
      file,
      classification,
      sourceIdentityKey,
      sourceTreatmentAuthorityScore: sourceTreatmentAuthorityScoreValue,
      sourceIndex,
    };
    if (!sourceTreatmentEntriesByIdentity.has(sourceIdentityKey)) {
      sourceTreatmentEntriesByIdentity.set(sourceIdentityKey, []);
    }
    sourceTreatmentEntriesByIdentity.get(sourceIdentityKey).push(groupedEntry);
  });
  for (const groupedEntries of sourceTreatmentEntriesByIdentity.values()) {
    if (!Array.isArray(groupedEntries) || groupedEntries.length === 0) continue;
    groupedEntries.sort((left, right) => {
      if (right.sourceTreatmentAuthorityScore !== left.sourceTreatmentAuthorityScore) {
        return right.sourceTreatmentAuthorityScore - left.sourceTreatmentAuthorityScore;
      }
      return left.sourceIndex - right.sourceIndex;
    });
    sourceTreatmentEntries.push(groupedEntries[0]);
  }
  sourceTreatmentEntries.sort((left, right) => left.sourceIndex - right.sourceIndex);
  for (const entry of sourceTreatmentEntries) {
    const file = entry.file;
    const classification = entry.classification;
    const entryRow = {
      key: file.original_filename.toLowerCase(),
      name: escapeHtml(file.original_filename),
      note: escapeHtml(classification.note),
      source_basis: classification.source_basis,
      reason_code: classification.reason_code,
      category: classification.category,
    };
    if (classification.category === "Modeled Inputs") {
      pushUnique(modeled, entryRow);
    } else if (classification.category === "Displayed / Limited Use") {
      pushUnique(limitedUse, entryRow);
    } else {
      pushUnique(notModeled, entryRow);
    }
  }

  const section = (title, items, emptyNote) => {
    const listHtml = items.length
      ? `<ul style="margin:6px 0 0 18px;padding:0;">${items
          .map((item) => `<li data-treatment-source="${escapeHtml(item.source_basis || "")}" data-treatment-code="${escapeHtml(item.reason_code || "")}" style="margin:0 0 4px 0;">${item.name}${item.note ? ` <span style="color:#64748b;">- ${item.note}</span>` : ""}</li>`)
          .join("")}</ul>`
      : `<p class="small" style="margin:6px 0 0 0;color:#64748b;">${escapeHtml(emptyNote)}</p>`;
    return `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:700;color:#1F3A5F;">${escapeHtml(title)}</div>${listHtml}</div>`;
  };
  const resolveDocumentRoleLabel = (row, classification) => {
    if (row?.document_role_label) return row.document_role_label;
    const canonicalRole = normalizedText(row?.semantic_doc_role || row?.display_doc_type || row?.doc_type || "");
    if (/^(t12|trailing[-_\s]?12|ttm operating statement|operating statement|income statement)$/.test(canonicalRole)) {
      return "T12 Operating Statement";
    }
    if (/^rent[_\s-]?roll$/.test(canonicalRole)) {
      return "Rent Roll";
    }
    if (/^property[_\s-]?tax$/.test(canonicalRole)) {
      return "Property Tax Support";
    }
    if (/^(purchase[_\s-]?assumptions|purchase assumptions)$/.test(canonicalRole)) {
      return "Purchase Assumptions / Acquisition Context";
    }
    if (/^(current mortgage statement|current debt terms|mortgage statement|debt terms)$/.test(canonicalRole)) {
      return "Loan / Debt Support";
    }
    if (/^(market survey|market rent survey|rent survey|rent comps|rent comparables)$/.test(canonicalRole)) {
      return "Market Rent Context";
    }
    if (/^(structured renovation capex plan|structured renovation \/ capex plan|renovation capex budget context|renovation budget|capex|capital expenditure|capital budget|construction budget|renovation)$/.test(canonicalRole)) {
      return "CapEx / Renovation Context";
    }
    if (/^(environmental due diligence|phase i|phase 1|esa|environmental)$/.test(canonicalRole)) {
      return "Environmental Due Diligence Context";
    }
    if (
      /^(appraisal|valuation report|opinion of value)$/.test(canonicalRole) &&
      ![
        "loan_term_sheet_proposed_acquisition_only",
        "loan_term_sheet_acquisition_context",
        "purchase_assumptions_acquisition_context",
        "purchase_assumptions_context_only",
      ].includes(classification?.reason_code)
    ) {
      return "Appraisal Context";
    }
    if (/^(broker email|broker|email|background|diligence)$/.test(canonicalRole)) {
      return "Broker / Diligence Context";
    }
    if (classification?.reason_code === "property_tax_support_corroborating" || classification?.reason_code === "property_tax_support_unbound") {
      return "Property Tax Support";
    }
    if (classification?.reason_code === "current_debt_not_assessed" || classification?.reason_code === "current_debt_not_used_here" || classification?.reason_code === "structured_current_debt_input") {
      return launchMemoMode ? "Debt Support Received / Contextual" : "Loan / Debt Support";
    }
    if (classification?.reason_code === "loan_term_sheet_proposed_acquisition_only") {
      return "Purchase Assumptions";
    }
    if (classification?.reason_code === "loan_term_sheet_acquisition_context") {
      return "Purchase Assumptions / Acquisition Context";
    }
    if (classification?.reason_code === "purchase_assumptions_acquisition_context") {
      return "Purchase Assumptions / Acquisition Context";
    }
    if (classification?.reason_code === "purchase_assumptions_context_only") {
      return "Purchase Assumptions / Acquisition Context";
    }
    if (
      classification?.reason_code === "forward_looking_renovation_input" ||
      classification?.reason_code === "forward_looking_renovation_rent_lift_input" ||
      classification?.reason_code === "renovation_forward_looking_transparency_only"
    ) {
      return "Structured Renovation / CapEx Plan";
    }
    if (classification?.reason_code === "renovation_budget_no_roi_inputs") {
      return "Renovation / CapEx Budget Context";
    }
    if (classification?.reason_code === "historical_capex_only") {
      return "Historical Capital Items";
    }
    return "Other Support Document";
  };
  const resolveTreatmentLabel = (row, classification) => {
    if (row?.treatment_label) return row.treatment_label;
    switch (classification?.reason_code) {
      case "structured_current_debt_input":
        return "Core quantitative source";
      case "canonical_current_debt_quantitative_usage":
        return "Core quantitative source";
      case "property_tax_support_corroborating":
        return "Corroborating support";
      case "property_tax_support_unbound":
      case "filename_fallback_property_tax_support_corroborating":
      case "filename_fallback_property_tax_support_unbound":
        return "Corroborating support";
      case "loan_term_sheet_proposed_acquisition_only":
      case "loan_term_sheet_acquisition_context":
        return "Acquisition context / document-derived purchase-price or cap-rate reference";
      case "purchase_assumptions_acquisition_context":
        return "Acquisition context / document-derived acquisition context";
      case "purchase_assumptions_context_only":
        return "Context only";
      case "current_debt_not_assessed":
      case "current_debt_not_used_here":
        return "Debt support received / contextual or deferred";
      case "market_survey_context_only":
      case "filename_fallback_market_survey_context_only":
        return "Context only";
      case "historical_capex_only":
        return "Context only";
      case "renovation_budget_no_roi_inputs":
        return "Budget/scope only";
      case "renovation_capex_budget_context":
        return "Budget/scope only";
      case "structured_renovation_capex_plan":
        return "Structured renovation / CapEx context";
      case "renovation_forward_looking_transparency_only":
      case "forward_looking_renovation_input":
      case "forward_looking_renovation_rent_lift_input":
        return "Structured renovation / CapEx context";
      case "environmental_support_context_only":
      case "filename_fallback_environmental_support_only":
        return "Context only";
      case "zoning_compliance_context_only":
      case "filename_fallback_zoning_support_only":
        return "Context only";
      case "unsupported_appraisal_or_market_source":
      case "filename_fallback_unsupported_appraisal_source":
        return "Context only";
      case "support_context_file":
      case "unclassified_support_file":
      case "filename_fallback_unclassified_support_file":
      default:
        return classification?.category === "Modeled Inputs" ? "Core quantitative source" : "Context only";
    }
  };
  const sourceTreatmentCellStyle = "padding:4px 8px;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;";
  const sourceTreatmentRowsHtml = sourceTreatmentEntries
    .map((entry) => {
      const file = entry.file || entry;
      const classification = entry.classification || classifyRow(file);
      const rowRoleLabel = resolveDocumentRoleLabel(file, classification);
      const rowTreatmentLabel = resolveTreatmentLabel(file, classification);
      return `<tr><td style="${sourceTreatmentCellStyle}">${escapeHtml(file.original_filename)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(rowRoleLabel)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(rowTreatmentLabel)}</td><td style="${sourceTreatmentCellStyle}">${escapeHtml(classification.note)}</td></tr>`;
    })
    .join("");
  const sourceTreatmentTableHtml = sourceTreatmentRowsHtml
    ? `<div style="margin-top:10px;"><p class="subsection-title">Source Treatment / Quantitative Use</p><table style="width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:28%;">Filename</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Document Role</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Treatment</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;vertical-align:top;white-space:normal;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;width:24%;">Use</th></tr></thead><tbody>${sourceTreatmentRowsHtml}</tbody></table></div>`
    : "";
  setRenderedDocumentTreatmentRows(
    sourceTreatmentEntries.map((entry) => ({
      filename: String(entry.file?.original_filename || "").trim(),
      displayLabel: String(resolveDocumentRoleLabel(entry.file, entry.classification) || "").trim(),
      treatment: String(resolveTreatmentLabel(entry.file, entry.classification) || "").trim(),
      use: String(entry.classification?.note || "").trim(),
    }))
  );

  setRenderedDocumentTreatmentRows(
    sourceTreatmentEntries.map((entry) => ({
      filename: String(entry.file?.original_filename || "").trim(),
      displayLabel: String(resolveDocumentRoleLabel(entry.file, entry.classification) || "").trim(),
      treatment: String(resolveTreatmentLabel(entry.file, entry.classification) || "").trim(),
      use: String(entry.classification?.note || "").trim(),
    }))
  );
  return `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Document Treatment Summary</p><p class="small" style="margin:0;color:#374151;">Uploaded files are listed for auditability. Only structured source inputs are used quantitatively. Unsupported or unclassified support files are not used to override modeled outputs.</p>${sourceTreatmentTableHtml}${section("Modeled Inputs", modeled, "No modeled inputs were classified from structured source metadata.")}${section("Displayed / Limited Use", limitedUse, "No limited-use historical capital items were classified from structured source metadata.")}${section("Listed but Not Quantitatively Modeled", notModeled, "No additional unmodeled support files were identified.")}</div>`;
}

function buildHistoricalCapexDisplayCopy({
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
} = {}) {
  const normalizedRenovationDisplayMode =
    renovationDisplayMode === "forward_looking_modelable" ||
    renovationDisplayMode === "forward_looking_with_rent_lift" ||
    renovationDisplayMode === "budget_only_no_roi" ||
    renovationDisplayMode === "historical_only"
      ? renovationDisplayMode
      : "historical_only";
  const historicalCapitalItemsDisclaimer =
    "Historical capital items are displayed for context only. InvestorIQ does not model renovation ROI, rent lift, payback, or implementation schedule without document-supported forward-looking assumptions.";
  const budgetOnlyDisclaimer =
    "Budget and scope items are displayed from the uploaded renovation budget. InvestorIQ does not model renovation ROI, rent lift, payback, phasing, cost recovery, or implementation schedule because those assumptions were not provided.";
  if (normalizedRenovationDisplayMode === "budget_only_no_roi") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Renovation Budget Summary",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: false,
      budget_note: budgetOnlyDisclaimer,
      execution_note: budgetOnlyDisclaimer,
      interpretation: budgetOnlyDisclaimer,
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  if (normalizedRenovationDisplayMode === "forward_looking_modelable") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Document-Supported Renovation Assumptions",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: true,
      budget_note: DATA_NOT_AVAILABLE,
      execution_note: DATA_NOT_AVAILABLE,
      interpretation: DATA_NOT_AVAILABLE,
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  if (normalizedRenovationDisplayMode === "forward_looking_with_rent_lift") {
    return {
      display_mode: normalizedRenovationDisplayMode,
      section_title: "Document-Stated Renovation Assumptions",
      budget_card_title: "Renovation Budget Items",
      show_execution_card: true,
      budget_note:
        "Document-stated renovation rent-lift assumptions are displayed by row for source transparency only. Gross annual rent-lift potential is shown only where unit count and expected monthly rent lift are explicitly provided and is not converted into NOI, ROI, payback, valuation, or refinance outputs.",
      execution_note:
        "ROI, payback, cost recovery, NOI impact, valuation impact, and refinance impact are not modeled unless those assumptions are explicitly document-supported.",
      interpretation:
        "Document-stated rent-lift assumptions are shown for transparency only. This is not an NOI, ROI, payback, valuation, or refinance model.",
      historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
    };
  }
  return {
    display_mode: normalizedRenovationDisplayMode,
    section_title: "Historical Capital Expenditure Summary",
    budget_card_title: "Historical Capital Items",
    show_execution_card: false,
    budget_note: "Historical capital items are displayed for context only.",
    execution_note: historicalCapitalItemsDisclaimer,
    interpretation: historicalCapitalItemsDisclaimer,
    historical_capex_disclaimer: historicalCapitalItemsDisclaimer,
  };
}

const buildRenovationDisplayCopy = buildHistoricalCapexDisplayCopy;

function resolveRenovationDisplayMode({
  financials = null,
  renovationPayload = null,
  documentSources = [],
  hasForwardLookingRenovationInputs = false,
} = {}) {
  const hasMeaningfulText = (value) =>
    typeof value === "string" && value.trim().length > 0 && value.trim() !== DATA_NOT_AVAILABLE;
  const hasPositive = (value) => {
    const parsed = coerceNumber(value);
    return Number.isFinite(parsed) && parsed > 0;
  };
  const hasStructuredRows = (rows) =>
    Array.isArray(rows) &&
    rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const amount = coerceNumber(
        row.estimated_cost ?? row.amount ?? row.cost ?? row.value ?? row.total ?? row.budget
      );
      return Number.isFinite(amount) && amount > 0;
    });
  const hasRowLevelRentLift = (rows) =>
    Array.isArray(rows) &&
    rows.some((row) => {
      if (!row || typeof row !== "object") return false;
      const rowRentLift = coerceNumber(row.expected_monthly_rent_lift ?? row.rent_lift);
      return Number.isFinite(rowRentLift) && rowRentLift > 0;
    });
  const hasBudgetEvidence = Boolean(
    hasPositive(renovationPayload?.total_budget) ||
      hasPositive(renovationPayload?.total_capex) ||
      hasPositive(renovationPayload?.renovation_budget) ||
      hasStructuredRows(renovationPayload?.budget_rows) ||
      hasStructuredRows(renovationPayload?.execution_rows)
  );
  const hasForwardLookingSignals = Boolean(
    hasForwardLookingRenovationInputs ||
      [
        renovationPayload?.timing_or_phasing,
        renovationPayload?.rent_lift,
        renovationPayload?.roi,
        renovationPayload?.payback_period,
      ].some((value) => hasMeaningfulText(value))
  );
  const hasDocumentedRentLift = Boolean(
    hasMeaningfulText(renovationPayload?.rent_lift) ||
      hasRowLevelRentLift(renovationPayload?.budget_rows)
  );
  const historicalSignalsText = [
    renovationPayload?.interpretation,
    renovationPayload?.budget_note,
    renovationPayload?.execution_note,
    Array.isArray(documentSources)
      ? documentSources
          .map((row) =>
            [
              row?.semantic_doc_role,
              row?.semantic_doc_display_label,
              row?.display_doc_type,
              row?.doc_type,
              row?.parse_status,
              row?.parse_error,
              row?.original_filename,
            ]
              .map((value) => String(value || "").trim())
              .join(" ")
          )
          .join(" ")
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const hasHistoricalOnlySignals = /historical|past repairs?|prior work|completed items?|completed work|historical capex/i.test(
    historicalSignalsText
  );
  if (hasBudgetEvidence) {
    if (hasHistoricalOnlySignals && !hasForwardLookingSignals) {
      return "historical_only";
    }
    if (hasDocumentedRentLift && !hasMeaningfulText(renovationPayload?.roi)) {
      return "forward_looking_with_rent_lift";
    }
    return hasForwardLookingSignals ? "forward_looking_modelable" : "budget_only_no_roi";
  }
  if (hasHistoricalOnlySignals) {
    return "historical_only";
  }
  return null;
}

function buildFrameworkSensitivityDisplayCopy() {
  return {
    scenario_section_title: "Scenario Analysis & Five-Year Outlook - Framework Sensitivity",
    dcf_section_title: "DCF Framework Sensitivity",
    dcf_summary_title: "DCF Framework Sensitivity Summary (Base Case)",
    dcf_value_label: "Framework-Indicated Present Value (Sum of PVs)",
    dcf_framework_note:
      "This is a framework sensitivity, not an appraisal, and does not rely on unsupported appraisal or market survey files.",
  };
}

function isValidAnnualPropertyTaxValue(value) {
  const annualTax = coerceNumber(value);
  if (!Number.isFinite(annualTax) || annualTax <= 0) return false;
  if (annualTax >= 1900 && annualTax <= 2100) return false;
  if (annualTax < 1000) return false;
  return true;
}

function buildRenovationBudgetRows(rows, formatValue, columnVisibility = null) {
  const summary = summarizeRenovationBudgetRows(rows, formatValue);
  const visibleColumns = columnVisibility || summary.visibleColumns;
  const columns = [
    { key: "category", label: "Category" },
    { key: "scope", label: "Scope of Work" },
    { key: "unitType", label: "Unit Type" },
    { key: "unitCount", label: "Unit Count" },
    { key: "costPerUnit", label: "Cost per Unit" },
    { key: "expectedMonthlyRentLift", label: "Expected Monthly Rent Lift (Document-Stated Assumption)" },
    { key: "phaseTiming", label: "Phase Timing / Phasing" },
    { key: "grossAnnualRentLiftPotential", label: "Gross Annual Rent-Lift Potential (Document-Stated Assumption)" },
    { key: "cost", label: "Estimated Cost" },
    { key: "percent", label: "Percent of Budget" },
    { key: "objective", label: "Primary Objective" },
  ].filter((column) => visibleColumns[column.key]);
  if (!columns.length || !summary.rows.length) return "";
  return summary.rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const value = row[column.key] ?? "";
          return `<td>${escapeHtml(value)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
}

function buildRenovationBudgetCardHtml(rows, formatValue, note = DATA_NOT_AVAILABLE, columnVisibility = null, title = "Renovation Budget Items") {
  const summary = summarizeRenovationBudgetRows(rows, formatValue);
  const visibleColumns = columnVisibility || summary.visibleColumns;
  const columns = [
    { key: "category", label: "Category" },
    { key: "scope", label: "Scope of Work" },
    { key: "unitType", label: "Unit Type" },
    { key: "unitCount", label: "Unit Count" },
    { key: "costPerUnit", label: "Cost per Unit" },
    { key: "expectedMonthlyRentLift", label: "Expected Monthly Rent Lift (Document-Stated Assumption)" },
    { key: "phaseTiming", label: "Phase Timing / Phasing" },
    { key: "grossAnnualRentLiftPotential", label: "Gross Annual Rent-Lift Potential (Document-Stated Assumption)" },
    { key: "cost", label: "Estimated Cost" },
    { key: "percent", label: "Percent of Budget" },
    { key: "objective", label: "Primary Objective" },
  ].filter((column) => visibleColumns[column.key]);
  if (!columns.length || !summary.rows.length) return "";
  const rowsHtml = buildRenovationBudgetRows(rows, formatValue, visibleColumns);
  return `<div class="no-break">
        <p class="subsection-title">${escapeHtml(title)}</p>
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p class="small" style="margin-top:8px;">
      <strong>InvestorIQ:</strong> ${escapeHtml(note)}
    </p>
  </div>`;
}

function summarizeRenovationExecutionRows(rows, formatValue) {
  const normalizedRows = [];
  for (const row of dedupeRenovationMetricRows(Array.isArray(rows) ? rows : [])) {
    if (!row || typeof row !== "object") continue;
    const metricKind = normalizeRenovationMetricKind(row);
    const metricSource = String(row.metric ?? row.label ?? row.item ?? row.category ?? "").trim();
    const metric =
      metricKind === "unit_count"
        ? "Unit Count (unit turns scope)"
        : metricKind === "per_unit_cost"
        ? "Per Unit Cost (unit turns scope)"
        : metricSource;
    const valueSource =
      row.value ??
      row.amount ??
      row.estimated_cost ??
      row.scope_of_work ??
      row.percent_of_budget ??
      row.percent ??
      row.percentage ??
      "";
    const value = formatRenovationMetricValue({
      metricKind,
      value: valueSource,
      formatCurrency: formatValue,
      formatPercent: formatPercent1,
    });
    if (!metric || !value) continue;
    normalizedRows.push({ metric, value });
  }
  return normalizedRows;
}

function buildRenovationExecutionRows(rows, formatValue) {
  return summarizeRenovationExecutionRows(rows, formatValue)
    .map((row) => `<tr><td>${escapeHtml(row.metric)}</td><td>${row.value}</td></tr>`)
    .join("");
}

function buildRenovationExecutionCardHtml(rows, formatValue, note = DATA_NOT_AVAILABLE) {
  const normalizedRows = summarizeRenovationExecutionRows(rows, formatValue);
  const rowsHtml = normalizedRows
    .map((row) => `<tr><td>${escapeHtml(row.metric)}</td><td>${row.value}</td></tr>`)
    .join("");
  if (!rowsHtml) {
    return note && note !== DATA_NOT_AVAILABLE
      ? `<div style="margin-top:18px; page-break-before: avoid; break-before: avoid;">
  <p class="small" style="margin-top:8px;">
    <strong>InvestorIQ:</strong> ${escapeHtml(note)}
  </p>
</div>`
      : "";
  }
  return `<div style="margin-top:18px; page-break-before: avoid; break-before: avoid;">
    <p class="subsection-title">Execution and Unit-Cost Inputs (Document-Stated)</p>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <p class="small" style="margin-top:8px;">
      <strong>InvestorIQ:</strong> ${escapeHtml(note)}
    </p>
  </div>`;
}
function buildT12PerUnitRows(egi, opex, noi, units) {
  if (!Number.isFinite(units) || units <= 0) return "";
  return [
    ["EGI per Unit (TTM)", egi],
    ["OpEx per Unit (TTM)", opex],
    ["NOI per Unit (TTM)", noi],
  ]
    .filter(([, v]) => Number.isFinite(v))
    .map(
      ([label, v]) =>
        `<tr><td>${label}</td><td>${formatCurrency(v / units)}</td></tr>`
    )
    .join("");
}
function buildCapRateValueTable(noi, units, documentDerivedCapRate = null) {
  if (!Number.isFinite(noi) || noi <= 0) return "";
  const capRates = [0.05, 0.06, 0.07];
  const docCapRate = toCapRatio(documentDerivedCapRate);
  const addDocumentDerivedCapRate =
    Number.isFinite(docCapRate) &&
    docCapRate > 0 &&
    !capRates.some((rate) => Math.abs(rate - docCapRate) < 0.0001);
  const tableRates = [...capRates];
  if (addDocumentDerivedCapRate) {
    tableRates.push(docCapRate);
  }
  const rows = tableRates
    .map((r) => {
      const val = noi / r;
      const perUnit = Number.isFinite(units) && units > 0 ? val / units : null;
      const label = addDocumentDerivedCapRate && Math.abs(r - docCapRate) < 0.0001
        ? `${formatCapPercentExact(r)} (document derived)`
        : `${(r * 100).toFixed(1)}%`;
      return `<tr><td>${label}</td><td>${formatCurrency(val)}</td><td>${perUnit !== null ? formatCurrency(perUnit) : "-"}</td></tr>`;
    })
    .join("");
  const footnote = addDocumentDerivedCapRate
    ? `Derived from reported NOI of ${formatCurrency(noi)}. Standardized framework benchmarks are shown with any valid document-derived cap rate. Purchase price and unsupported appraisal/market survey files are not treated as appraised value.`
    : `Derived from reported NOI of ${formatCurrency(noi)}. Cap rates are standardized framework benchmarks, not document-sourced, and do not represent appraised value.`;
  return `<div class="card no-break"><p class="subsection-title">Cap Rate Value Indication</p><table><thead><tr><th>Cap Rate</th><th>Implied Value</th><th>Per Unit</th></tr></thead><tbody>${rows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${footnote}</p></div>`;
}

function buildPreliminaryFinancingReadinessSummaryHtml({
  reportMode = null,
  acquisitionMemoRenderContext = null,
  acquisitionMemoV2Projection = null,
  acquisitionAssumptionState = null,
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  sourceReportCoverageQa = null,
  supportDocAuthorityRows = null,
  canonicalSupportDocMap = null,
  formatCurrency,
  formatPercent1,
  formatInterestRatePercent,
} = {}) {
  if (String(reportMode || "").toLowerCase() !== "v1_core") return "";
  const ctx = acquisitionMemoRenderContext && typeof acquisitionMemoRenderContext === "object"
    ? acquisitionMemoRenderContext
    : {};
  const firstFinite = (...values) => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const authorityRows = canonicalSupportDocMap instanceof Map && canonicalSupportDocMap.size > 0
    ? Array.from(canonicalSupportDocMap.values()).filter((row) => row && typeof row === "object")
    : Array.isArray(supportDocAuthorityRows) && supportDocAuthorityRows.length > 0
    ? supportDocAuthorityRows
    : Array.isArray(sourceReportCoverageQa?.support_document_authority_rows)
    ? sourceReportCoverageQa.support_document_authority_rows
    : Array.isArray(sourceReportCoverageQa?.document_treatment_canonical_rows)
    ? sourceReportCoverageQa.document_treatment_canonical_rows
    : [];
  const authorityByRole = (pattern) => authorityRows.find((row) => pattern.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || "")));
  const purchaseAssumptionsAuthorityRow = authorityRows.find((row) =>
    row?.has_acquisition_support === true ||
    row?.has_proposed_acquisition_financing === true ||
    /(purchase_assumptions|proposed_acquisition_financing)/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || ""))
  ) || null;
  const proposedFinancingAuthorityRow = authorityRows.find((row) =>
    row?.has_proposed_acquisition_financing === true ||
    /proposed_acquisition_financing/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || ""))
  ) || null;
  const currentDebtAuthorityRow = authorityRows.find((row) =>
    row?.has_current_debt_context === true ||
    /(current_debt_context|current_mortgage_statement|debt_support_received)/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || row?.document_role_label || row?.treatment_label || ""))
  ) || null;
  const renovationAuthorityRow = authorityByRole(/renovation|capex/i);
  const appraisalAuthorityRow = authorityByRole(/appraisal/i);
  const environmentalAuthorityRow = authorityByRole(/environmental|phase|esa/i);
  const escapeLabel = (value) => escapeHtml(String(value ?? ""));
  const t12Verified = Boolean(
    sourceReportCoverageQa?.artifact_inventory?.t12_parsed?.present === true &&
    sourceReportCoverageQa?.artifact_inventory?.t12_parsed?.has_core_totals === true
  );
  const rentRollVerified = Boolean(
    sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed?.present === true &&
    sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed?.has_total_units === true
  );
  const purchasePrice = firstFinite(ctx.purchasePrice, purchaseAssumptionsAuthorityRow?.purchase_price, purchaseAssumptionsAuthorityRow?.purchasePrice, purchaseAssumptionsAuthorityRow?.acquisition_price, acquisitionTermsPayload?.purchase_price, acquisitionTermsPayload?.purchasePrice);
  const noiBasis = firstFinite(ctx.acquisitionNoiBasis, purchaseAssumptionsAuthorityRow?.noi_basis, purchaseAssumptionsAuthorityRow?.net_operating_income_basis, acquisitionTermsPayload?.noi_basis, acquisitionTermsPayload?.net_operating_income_basis, acquisitionTermsPayload?.noi);
  const goingInCapRate = firstFinite(ctx.goingInCapRate, purchaseAssumptionsAuthorityRow?.going_in_cap_rate, acquisitionTermsPayload?.going_in_cap_rate);
  const units = firstFinite(ctx.units, sourceReportCoverageQa?.artifact_inventory?.rent_roll_parsed?.total_units);
  const pricePerUnit = Number.isFinite(purchasePrice) && Number.isFinite(units) && units > 0 ? purchasePrice / units : null;
  const noiPerUnit = Number.isFinite(noiBasis) && Number.isFinite(units) && units > 0 ? noiBasis / units : null;
  const egi = firstFinite(ctx.egi);
  const opEx = firstFinite(ctx.opEx);
  const noi = firstFinite(ctx.noi, noiBasis);
  const expenseRatio = firstFinite(ctx.expenseRatio);
  const noiMargin = firstFinite(ctx.noiMargin);
  const occupancy = firstFinite(ctx.occupancy);
  const breakEvenOccupancy = firstFinite(ctx.breakEvenOccupancy);
  const annualInPlaceRent = firstFinite(ctx.annualInPlaceRent);
  const annualMarketRent = firstFinite(ctx.annualMarketRent);
  const annualRentUpside = firstFinite(ctx.annualRentUpside);
  const rentGapPercent = firstFinite(ctx.rentGapPercent);
  const annualRentUpsideDisplay =
    Number.isFinite(annualMarketRent) && Number.isFinite(annualInPlaceRent)
      ? Math.max(0, annualMarketRent - annualInPlaceRent)
      : null;
  const rentGapPercentDisplay =
    Number.isFinite(annualMarketRent) && Number.isFinite(annualInPlaceRent) && annualInPlaceRent > 0
      ? ((annualMarketRent - annualInPlaceRent) / annualInPlaceRent) * 100
      : null;
  const documentDerivedCapRate = firstFinite(
    sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed?.acquisition_support?.going_in_cap_rate,
    sourceReportCoverageQa?.artifact_inventory?.loan_term_sheet_parsed?.going_in_cap_rate,
    ctx.goingInCapRate,
    acquisitionTermsPayload?.going_in_cap_rate,
    acquisitionTermsPayload?.document_derived_cap_rate
  );
  const proposedAcquisitionFinancingSourceComplete = Boolean(
    proposedFinancingAuthorityRow?.has_proposed_acquisition_financing === true ||
    (purchaseAssumptionsAuthorityRow && (
      Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.purchase_price)) &&
      (
        Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.stated_acquisition_loan_amount)) ||
        Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.loan_amount)) ||
        Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.derived_acquisition_loan_amount)) ||
        Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.ltv))
      ) &&
      Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.interest_rate)) &&
      Number.isFinite(coerceNumber(purchaseAssumptionsAuthorityRow?.amort_years ?? purchaseAssumptionsAuthorityRow?.amortization_years))
    ))
  );
  const currentDebtHasVerifiedBalance = Boolean(currentDebtAssessmentState?.has_true_current_debt_balance === true || currentDebtAuthorityRow);
  const currentDebtBalance = firstFinite(
    currentDebtAssessmentState?.current_debt_balance,
    currentDebtAuthorityRow?.outstanding_balance,
    currentDebtAuthorityRow?.current_outstanding_balance,
    currentDebtAuthorityRow?.current_loan_balance,
    mortgagePayload?.outstanding_balance,
    mortgagePayload?.current_outstanding_balance,
    mortgagePayload?.current_loan_balance
  );
  const currentDebtInterestRate = firstFinite(
    currentDebtAuthorityRow?.interest_rate,
    mortgagePayload?.interest_rate,
    mortgagePayload?.rate
  );
  const currentDebtAmortYears = firstFinite(
    currentDebtAuthorityRow?.amort_years,
    currentDebtAuthorityRow?.amortization_years,
    mortgagePayload?.amort_years,
    mortgagePayload?.amortization_years
  );
  const currentDebtLtv = firstFinite(
    currentDebtAuthorityRow?.ltv,
    mortgagePayload?.ltv
  );
  const currentDebtRows = currentDebtHasVerifiedBalance
    ? [
        Number.isFinite(currentDebtBalance) ? `<tr><td>Outstanding Balance</td><td style="font-weight:600;">${formatCurrency(currentDebtBalance)}</td></tr>` : "",
        Number.isFinite(currentDebtInterestRate) ? `<tr><td>Interest Rate</td><td style="font-weight:600;">${formatInterestRatePercent(currentDebtInterestRate)}</td></tr>` : "",
        Number.isFinite(currentDebtAmortYears) ? `<tr><td>Amortization</td><td style="font-weight:600;">${Math.round(currentDebtAmortYears)} years</td></tr>` : "",
        Number.isFinite(currentDebtLtv) ? `<tr><td>LTV</td><td style="font-weight:600;">${formatPercent1(currentDebtLtv)}</td></tr>` : "",
      ].filter(Boolean)
    : [];
  const proposedAcquisitionRows = [];
  if (proposedAcquisitionFinancingSourceComplete) {
    proposedAcquisitionRows.push(`<tr><td colspan="2" style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">Proposed Acquisition Financing: Source-complete inputs provided / available for future underwriting.</td></tr>`);
  } else {
    proposedAcquisitionRows.push(`<tr><td colspan="2" style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">Proposed Acquisition Financing: Not source-complete / not modeled.</td></tr>`);
  }
  const requestRows = [
    Number.isFinite(purchasePrice) ? `<tr><td>Purchase Price</td><td style="font-weight:600;">${formatCurrency(purchasePrice)}</td></tr>` : "",
    Number.isFinite(noiBasis) ? `<tr><td>NOI Basis</td><td style="font-weight:600;">${formatCurrency(noiBasis)}</td></tr>` : "",
    Number.isFinite(goingInCapRate) ? `<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercent1(goingInCapRate)}</td></tr>` : "",
    Number.isFinite(units) ? `<tr><td>Units</td><td style="font-weight:600;">${Math.round(units)}</td></tr>` : "",
    Number.isFinite(pricePerUnit) ? `<tr><td>Price per Unit</td><td style="font-weight:600;">${formatCurrency(pricePerUnit)}</td></tr>` : "",
    Number.isFinite(noiPerUnit) ? `<tr><td>NOI per Unit</td><td style="font-weight:600;">${formatCurrency(noiPerUnit)}</td></tr>` : "",
  ].filter(Boolean);
  const operatingRows = [
    Number.isFinite(egi) ? `<tr><td>Effective Gross Income</td><td style="font-weight:600;">${formatCurrency(egi)}</td></tr>` : "",
    Number.isFinite(opEx) ? `<tr><td>Operating Expenses</td><td style="font-weight:600;">${formatCurrency(opEx)}</td></tr>` : "",
    Number.isFinite(noi) ? `<tr><td>NOI</td><td style="font-weight:600;">${formatCurrency(noi)}</td></tr>` : "",
    Number.isFinite(expenseRatio) ? `<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercent1(expenseRatio)}</td></tr>` : "",
    Number.isFinite(noiMargin) ? `<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercent1(noiMargin)}</td></tr>` : "",
    Number.isFinite(occupancy) ? `<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercent1(occupancy)}</td></tr>` : "",
    Number.isFinite(breakEvenOccupancy) ? `<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercent1(breakEvenOccupancy)}</td></tr>` : "",
  ].filter(Boolean);
  const rentSupportRows = [
    Number.isFinite(annualInPlaceRent) ? `<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatCurrency(annualInPlaceRent)}</td></tr>` : "",
    Number.isFinite(annualMarketRent) ? `<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatCurrency(annualMarketRent)}</td></tr>` : "",
    Number.isFinite(annualRentUpsideDisplay) ? `<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatCurrency(annualRentUpsideDisplay)}</td></tr>` : "",
    Number.isFinite(rentGapPercentDisplay) ? `<tr><td>Rent Gap %</td><td style="font-weight:600;">${formatPercent1(rentGapPercentDisplay)}</td></tr>` : "",
  ].filter(Boolean);
  const capRateRows = [];
  if (Number.isFinite(noiBasis) && noiBasis > 0) {
    for (const capRate of [0.05, 0.06, 0.07]) {
      const impliedValue = noiBasis / capRate;
      const impliedPerUnit = Number.isFinite(units) && units > 0 ? impliedValue / units : null;
      capRateRows.push(
        `<tr><td>${(capRate * 100).toFixed(1)}% cap rate</td><td style="font-weight:600;">${formatCurrency(impliedValue)}</td><td style="font-weight:600;">${Number.isFinite(impliedPerUnit) ? formatCurrency(impliedPerUnit) : "-"}</td></tr>`
      );
    }
  }
  const checklistRows = [
    `<tr><td>T12 verified</td><td style="font-weight:600;">${t12Verified ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Rent Roll verified</td><td style="font-weight:600;">${rentRollVerified ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Purchase assumptions provided</td><td style="font-weight:600;">${Number.isFinite(purchasePrice) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Property tax support</td><td style="font-weight:600;">${Boolean(propertyTaxBindingState?.hasValidatedAnnualTax || isValidAnnualPropertyTaxValue(propertyTaxPayload?.annual_tax)) ? "Yes" : "No"}</td></tr>`,
    `<tr><td>Proposed acquisition loan terms complete</td><td style="font-weight:600;">${proposedAcquisitionFinancingSourceComplete ? "Yes" : "No"}</td></tr>`,
  ];
  const supportPresenceRows = [
    Boolean(appraisalAuthorityRow)
      ? `<tr><td>Appraisal support</td><td style="font-weight:600;">Context only unless structured value exists</td></tr>`
      : "",
    Boolean(environmentalAuthorityRow)
      ? `<tr><td>Environmental / Phase I support</td><td style="font-weight:600;">Context only / not modeled</td></tr>`
      : "",
    Boolean(renovationAuthorityRow)
      ? `<tr><td>CapEx / renovation plan</td><td style="font-weight:600;">Context only unless verified budget and rent-lift assumptions exist</td></tr>`
      : "",
  ].filter(Boolean);
  const currentDebtChecklistPresent = Boolean(
    acquisitionMemoV2Projection?.financingReadinessSignals?.hasCurrentDebtContext === true ||
    acquisitionMemoV2Projection?.currentDebtContext ||
    acquisitionMemoV2Projection?.supportDocProjection?.currentDebtContext ||
    acquisitionMemoV2Projection?.lenderDiligenceChecklist?.some(
      (row) => /current debt context uploaded/i.test(String(row?.label || row?.text || "")) && row?.value === true
    ) ||
    currentDebtAuthorityRow ||
    (canonicalSupportDocMap instanceof Map &&
      Array.from(canonicalSupportDocMap.values()).some((row) =>
        String(row?.canonicalRole || row?.role || "").trim() === "current_debt_context"
      ))
  );
  const currentDebtChecklistLegacyFallbackPresent = Boolean(
    currentDebtAssessmentState?.has_current_debt_document ||
    currentDebtAuthorityRow ||
    (canonicalSupportDocMap instanceof Map &&
      Array.from(canonicalSupportDocMap.values()).some((row) =>
        String(row?.canonicalRole || row?.role || "").trim() === "current_debt_context"
      ))
  );
  const currentDebtChecklistValue = acquisitionMemoV2Projection?.financingReadinessSignals?.hasCurrentDebtContext === true
    ? "Yes"
    : acquisitionMemoV2Projection
      ? currentDebtChecklistPresent
        ? "Yes"
        : "No"
      : currentDebtChecklistLegacyFallbackPresent
        ? "Yes"
        : "No";
  checklistRows.splice(
    4,
    0,
    `<tr><td>Current debt context uploaded</td><td style="font-weight:600;">${currentDebtChecklistValue}</td></tr>`
  );
  const sectionHasContent =
    requestRows.length > 0 ||
    operatingRows.length > 0 ||
    rentSupportRows.length > 0 ||
    currentDebtRows.length > 0 ||
    proposedAcquisitionRows.length > 0;
  if (!sectionHasContent) {
    return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Preliminary Financing Readiness Summary</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">Preliminary financing readiness was not assessed because the required source-backed acquisition and operating inputs were not fully available.</p></div>`;
  }
  const currentDebtContextHtml = currentDebtRows.length > 0
    ? `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${currentDebtRows.join("")}</tbody></table>`
    : `<p class="small" style="margin:0;color:#64748b;">No verified current debt context was provided.</p>`;
  const proposedAcquisitionHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${proposedAcquisitionRows.join("")}</tbody></table>`;
  const checklistHtml = [
    ...checklistRows,
    ...supportPresenceRows,
  ].join("");
  const lenderNote = "Shown for lender discussion and acquisition diligence support only. This Acquisition Memo organizes verified operating evidence, rent-positioning support, acquisition context, and uploaded financing context. It does not represent loan approval, lender commitment, or institutional credit-committee underwriting.";
  return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Preliminary Financing Readiness Summary</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">${escapeHtml(lenderNote)}</p><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Acquisition Request Context</p>${requestRows.length ? `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${requestRows.join("")}</tbody></table>` : `<p class="small" style="margin:0;color:#64748b;">No acquisition request context was available.</p>`}</div><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Operating Support</p>${operatingRows.length ? `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${operatingRows.join("")}</tbody></table>` : `<p class="small" style="margin:0;color:#64748b;">No operating support rows were available.</p>`}</div><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Rent / Value Support</p>${rentSupportRows.length || capRateRows.length || Number.isFinite(documentDerivedCapRate) ? `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${rentSupportRows.join("")}${capRateRows.length ? capRateRows.join("") : ""}${Number.isFinite(documentDerivedCapRate) ? `<tr><td>Document-derived cap-rate reference</td><td style="font-weight:600;">${formatCapPercentExact(documentDerivedCapRate)}</td><td>-</td></tr>` : ""}</tbody></table>` : `<p class="small" style="margin:0;color:#64748b;">No rent/value support rows were available.</p>`}</div><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Debt / Financing Context</p><div style="margin-bottom:8px;"><div style="font-size:11px;font-weight:600;color:#1F3A5F;margin-bottom:4px;">Uploaded Existing Debt Context</div>${currentDebtContextHtml}</div><div><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${proposedAcquisitionRows.join("")}</tbody></table></div></div><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Lender Diligence Checklist</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${checklistHtml}</tbody></table></div></div>`;
}

function buildAcquisitionMemoSummaryCard({
  units = null,
  occupancy = null,
  annualInPlace = null,
  annualMarket = null,
  annualUpsideRatio = null,
  purchasePrice = null,
  goingInCapRate = null,
  noi = null,
  formatCurrency,
  formatPercent1,
} = {}) {
  const rows = [];
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td>${Math.round(units)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td>${formatPercent1(occupancy)}</td></tr>`);
  if (Number.isFinite(annualInPlace)) rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr>`);
  if (Number.isFinite(annualMarket)) rows.push(`<tr><td>Annual Market Rent</td><td>${formatCurrency(annualMarket)}</td></tr>`);
  if (Number.isFinite(annualUpsideRatio)) rows.push(`<tr><td>Annual Rent Upside</td><td>${formatPercent1(annualUpsideRatio)}</td></tr>`);
  if (Number.isFinite(purchasePrice)) rows.push(`<tr><td>Purchase Price</td><td>${formatCurrency(purchasePrice)}</td></tr>`);
  if (Number.isFinite(goingInCapRate)) rows.push(`<tr><td>Going-In Cap Rate</td><td>${formatPercent1(goingInCapRate)}</td></tr>`);
  if (Number.isFinite(noi)) rows.push(`<tr><td>NOI Basis</td><td>${formatCurrency(noi)}</td></tr>`);
  if (!rows.length) return "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Acquisition Memo Summary</p><table><tbody>${rows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Source-bound acquisition memo summary using verified operating metrics and acquisition context. Additional modeling remains deferred unless explicitly supported by the report family and verified source basis.</p></div>`;
}

function buildOperatingSnapshotCard({
  units = null,
  occupancy = null,
  annualInPlace = null,
  egi = null,
  operatingExpenses = null,
  noi = null,
  expenseRatio = null,
  noiMargin = null,
  breakEvenOccupancy = null,
  formatCurrency,
  formatPercent1,
} = {}) {
  const rows = [];
  if (Number.isFinite(units) && units > 0) rows.push(`<tr><td>Units</td><td>${Math.round(units)}</td></tr>`);
  if (Number.isFinite(occupancy)) rows.push(`<tr><td>Occupancy</td><td>${formatPercent1(occupancy)}</td></tr>`);
  if (Number.isFinite(annualInPlace)) rows.push(`<tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr>`);
  if (Number.isFinite(egi)) rows.push(`<tr><td>Effective Gross Income</td><td>${formatCurrency(egi)}</td></tr>`);
  if (Number.isFinite(operatingExpenses)) rows.push(`<tr><td>Operating Expenses</td><td>${formatCurrency(operatingExpenses)}</td></tr>`);
  if (Number.isFinite(noi)) rows.push(`<tr><td>NOI</td><td>${formatCurrency(noi)}</td></tr>`);
  if (Number.isFinite(expenseRatio)) rows.push(`<tr><td>Expense Ratio</td><td>${formatPercent1(expenseRatio)}</td></tr>`);
  if (Number.isFinite(noiMargin)) rows.push(`<tr><td>NOI Margin</td><td>${formatPercent1(noiMargin)}</td></tr>`);
  if (Number.isFinite(breakEvenOccupancy)) rows.push(`<tr><td>Break-Even Occupancy</td><td>${formatPercent1(breakEvenOccupancy)}</td></tr>`);
  if (!rows.length) return "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Snapshot</p><table><tbody>${rows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Snapshot is built from verified operating inputs only. No forward projection assumptions are introduced.</p></div>`;
}

function buildRentUpsideValueSensitivityCard({
  annualInPlace = null,
  annualMarket = null,
  formatCurrency,
} = {}) {
  if (!Number.isFinite(annualInPlace) || annualInPlace <= 0 || !Number.isFinite(annualMarket) || annualMarket <= annualInPlace) return "";
  const annualGap = annualMarket - annualInPlace;
  const capRates = [5.0, 6.0, 7.0];
  const capRows = capRates.map((cap) => {
    const impliedLift = annualGap / (cap / 100);
    return `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${cap.toFixed(1)}% cap rate</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">${formatCurrency(impliedLift)}</td></tr>`;
  }).join("");
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Rent Upside / Value Sensitivity</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr><tr><td>Annual Market Rent</td><td>${formatCurrency(annualMarket)}</td></tr><tr style="background:#FEFCE8;font-weight:700;"><td style="color:#B8860B;">Annual Gross Rent Upside</td><td style="color:#B8860B;">${formatCurrency(annualGap)}</td></tr></tbody></table><div style="margin-top:10px;"><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Implied Value Sensitivity at Stabilization</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${capRows}</tbody></table></div><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Implied value sensitivity capitalizes the verified annual rent gap at standardized cap-rate assumptions. It remains conditional on market-rent capture and occupancy.</p></div>`;
}

function buildLaunchSourceContextBlock({
  reportMode = null,
  documentSources = [],
  currentDebtAssessmentState = null,
  canonicalAcquisitionState = null,
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  documentQuantitativeUsageMap = null,
  supportDocAuthorityRows = null,
  canonicalSupportDocMap = null,
  renderedDocumentTreatmentRowsOut = null,
} = {}) {
  const intro = `<p class="small" style="margin:0 0 10px 0;color:#374151;line-height:1.6;">Modeled core inputs are limited to T12 and Rent Roll. Corroborating support includes validated property tax support when annual tax evidence aligns with the T12 tax line. Market survey, broker email, appraisal summary, Phase I ESA / environmental, zoning / compliance, and CapEx / renovation notes remain context-only unless explicitly validated for quantitative use. Acquisition context is limited to verified purchase assumptions and document-derived cap-rate reference where supported.</p>`;
  const treatment = buildDocumentTreatmentSummaryHtml({
    reportMode,
    documentSources,
    currentDebtAssessmentState,
    canonicalAcquisitionState,
    loanTermSheetTermsPayload,
    acquisitionTermsPayload,
    hasForwardLookingRenovationInputs,
    renovationDisplayMode,
    renovationPayload,
    propertyTaxPayload,
    propertyTaxBindingState,
    documentQuantitativeUsageMap,
    supportDocAuthorityRows,
    canonicalSupportDocMap,
    renderedDocumentTreatmentRowsOut,
  });
  const excludedDeferredHtml = `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Excluded / Deferred Analysis</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">Advanced financing and return-projection modules remain deferred unless explicitly supported by the report family and verified source basis.</p></div>`;
  return `${intro}<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${treatment}<!-- END DOCUMENT_TREATMENT_SUMMARY -->${excludedDeferredHtml}`;
}
function buildFinancingEnvelopeGrid(noi, units) {
  if (!Number.isFinite(noi) || noi <= 0) return "";
  const dscrTargets = [
    { label: "1.10x (CMHC / Insured)", value: 1.10 },
    { label: "1.25x (Conventional)", value: 1.25 },
    { label: "1.35x (Conservative)", value: 1.35 },
  ];
  const rateScenarios = [5.50, 6.50, 7.50];
  const n = 25 * 12; // 25-year amortization
  function maxLoanAtRate(annualRatePct, dscrTarget) {
    const monthlyDS = noi / dscrTarget / 12;
    const r = annualRatePct / 100 / 12;
    return monthlyDS * (1 - Math.pow(1 + r, -n)) / r;
  }
  const headerCells = rateScenarios.map((r) => `<th>${r.toFixed(2)}% Rate</th>`).join("");
  const bodyRows = dscrTargets
    .map(({ label, value }) => {
      const cells = rateScenarios
        .map((r) => `<td>${formatCurrency(maxLoanAtRate(r, value))}</td>`)
        .join("");
      return `<tr><td><strong>${escapeHtml(label)}</strong></td>${cells}</tr>`;
    })
    .join("");
  const unitsNote =
    Number.isFinite(units) && units > 0 ? `, ${units} units` : "";
  return `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Maximum Financing Envelope (Standardized Framework)</p><p class="small" style="margin-bottom:8px;">Maximum supportable loan principal at each DSCR threshold and interest rate. Anchor: reported NOI of <strong>${formatCurrency(noi)}</strong>${escapeHtml(unitsNote)}. Uses standardized 25-year amortization input.</p><div class="base-case-financing"><strong>Base Case Supportable Loan (6.50% Rate, 1.25x DSCR):</strong> ${formatCurrency(maxLoanAtRate(6.5, 1.25))}</div><table><thead><tr><th>DSCR Threshold</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table><div class="financing-interpretation">At 6.50% interest and 1.25x DSCR, the reported NOI supports the principal shown above. Financing capacity declines as interest rates increase or DSCR requirements tighten. Grid reflects standardized framework thresholds only.</div><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Interest rates and DSCR thresholds are standardized framework inputs, not document-sourced. Grid shows maximum financing supportable by the reported NOI at each scenario.</p></div>`;
}
function buildAcquisitionFinancingAssumptionsHtml({
  loanTermSheetTermsPayload,
  acquisitionTermsPayload = null,
  t12Payload,
  reportType,
  reportTier,
  acquisitionTriangleValidationState = null,
  returnState = false,
}) {
  const normalizedReportType = String(reportType || "").toLowerCase();
  const numericTier = Number(reportTier);
  const isFullUnderwriting = normalizedReportType === "underwriting" || numericTier === 2;
  if (!isFullUnderwriting) return "";
  const currentDebtTermsPayload =
    loanTermSheetTermsPayload && typeof loanTermSheetTermsPayload === "object"
      ? loanTermSheetTermsPayload
      : null;
  const acquisitionContextPayload =
    acquisitionTermsPayload && typeof acquisitionTermsPayload === "object"
      ? acquisitionTermsPayload
      : null;
  const acquisitionSupportPayload =
    acquisitionContextPayload?.acquisition_support &&
    typeof acquisitionContextPayload.acquisition_support === "object"
      ? acquisitionContextPayload.acquisition_support
      : null;
  const termsPayload = acquisitionContextPayload || currentDebtTermsPayload;
  if (!termsPayload || typeof termsPayload !== "object") return "";

  const firstFinite = (...values) => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const materiallyDifferentAmount = (left, right) => {
    const a = coerceNumber(left);
    const b = coerceNumber(right);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    const scale = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) > Math.max(100, scale * 0.02);
  };
  const parseMoneyFromCapture = (rawValue) => {
    if (typeof rawValue !== "string") return null;
    const normalized = rawValue.replace(/[$,\s]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const extractPurchasePriceFromText = (text) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const contextualPatterns = [
      /price\s*ref[^0-9$]{0,12}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /(?:at|based on)\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*purchase price/i,
      /(?:purchase|acquisition|asking)\s*price[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /([0-9][0-9,]*(?:\.[0-9]+)?)\s*purchase price/i,
    ];
    for (const pattern of contextualPatterns) {
      const match = text.match(pattern);
      const parsed = parseMoneyFromCapture(match?.[1] ?? null);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const extractStatedLoanAmountFromText = (text) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const contextualPatterns = [
      /price\s*ref[^\n]{0,80}?loan[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /loan amount\s*\([^)]*\)\s*\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /(?:loan amount|mortgage amount|proposed loan amount|acquisition loan amount|proposed loan|acquisition loan)[^$0-9]{0,24}\$?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
      /([0-9][0-9,]*(?:\.[0-9]+)?)\s*loan/i,
    ];
    for (const pattern of contextualPatterns) {
      const match = text.match(pattern);
      const parsed = parseMoneyFromCapture(match?.[1] ?? null);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const extractPercentFromText = (text, labelRegex) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const pattern = new RegExp(`(?:${labelRegex.source})[^0-9\\n]{0,20}([0-9]+(?:\\.[0-9]+)?)\\s*%`, "i");
    const reversePattern = new RegExp(`([0-9]+(?:\\.[0-9]+)?)\\s*%[^\\n]{0,20}(?:${labelRegex.source})`, "i");
    const directMatch = text.match(pattern);
    const reverseMatch = text.match(reversePattern);
    const parsed = Number(directMatch?.[1] ?? reverseMatch?.[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed / 100 : null;
  };
  const extractYearsFromText = (text, labelRegex) => {
    if (typeof text !== "string" || !text.trim()) return null;
    const pattern = new RegExp(`(?:${labelRegex.source})[^0-9\\n]{0,20}([0-9]{1,2}(?:\\.[0-9]+)?)`, "i");
    const reversePattern = new RegExp(`([0-9]{1,2}(?:\\.[0-9]+)?)\\s*(?:years?|yrs?)?[^\\n]{0,20}(?:${labelRegex.source})`, "i");
    const directMatch = text.match(pattern);
    const reverseMatch = text.match(reversePattern);
    const parsed = Number(directMatch?.[1] ?? reverseMatch?.[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const acquisitionContextText = [
    termsPayload?.source_text,
    termsPayload?.raw_text,
    termsPayload?.notes,
    termsPayload?.loan_terms_text,
    termsPayload?.extracted_text,
    termsPayload?.closing_cost_notes,
    acquisitionSupportPayload?.source_text,
    acquisitionSupportPayload?.raw_text,
    acquisitionSupportPayload?.notes,
    acquisitionSupportPayload?.loan_terms_text,
    acquisitionSupportPayload?.extracted_text,
    acquisitionSupportPayload?.closing_cost_notes,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");

  let purchasePrice = firstFinite(
    termsPayload.purchase_price,
    termsPayload.purchasePrice,
    termsPayload.acquisition_price,
    termsPayload.purchase_price_amount,
    acquisitionSupportPayload?.purchase_price,
    acquisitionSupportPayload?.purchasePrice,
    acquisitionSupportPayload?.acquisition_price,
    acquisitionSupportPayload?.purchase_price_amount
  );
  const ltvFromText = extractPercentFromText(acquisitionContextText, /(ltv|loan[-\s]*to[-\s]*value)/);
  const ltv = firstFinite(termsPayload.ltv, acquisitionSupportPayload?.ltv, ltvFromText);
  let statedLoanAmount = firstFinite(
    termsPayload.stated_acquisition_loan_amount,
    termsPayload.loan_amount,
    termsPayload.proposed_loan_amount,
    termsPayload.acquisition_loan_amount,
    termsPayload.stated_loan_amount,
    acquisitionSupportPayload?.loan_amount,
    acquisitionSupportPayload?.proposed_loan_amount,
    acquisitionSupportPayload?.acquisition_loan_amount,
    acquisitionSupportPayload?.stated_loan_amount
  );
  const purchasePriceFromText = extractPurchasePriceFromText(acquisitionContextText);
  const statedLoanAmountFromText = extractStatedLoanAmountFromText(acquisitionContextText);
  const interestRateFromText = extractPercentFromText(
    acquisitionContextText,
    /(interest rate|loan rate|note rate|coupon rate)/
  );
  const goingInCapRateFromText = extractPercentFromText(
    acquisitionContextText,
    /(going[-\s]*in cap rate|going[-\s]*cap rate|going[-\s]*cap|cap rate)/
  );
  const amortYearsFromText = extractYearsFromText(acquisitionContextText, /(amortization|amort|am\b)/);
  if (!Number.isFinite(statedLoanAmount) || statedLoanAmount <= 0) {
    statedLoanAmount = statedLoanAmountFromText;
  }
  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    purchasePrice = purchasePriceFromText;
  } else if (
    Number.isFinite(statedLoanAmount) &&
    statedLoanAmount > 0 &&
    materiallyDifferentAmount(purchasePrice, purchasePriceFromText) &&
    !materiallyDifferentAmount(purchasePrice, statedLoanAmount) &&
    Number.isFinite(purchasePriceFromText) &&
    purchasePriceFromText > 0
  ) {
    // If extracted purchase price duplicated loan amount, prefer explicit purchase-price context from source text.
    purchasePrice = purchasePriceFromText;
  }
  const providedDerivedLoanAmount = firstFinite(
    termsPayload.derived_acquisition_loan_amount,
    acquisitionSupportPayload?.derived_acquisition_loan_amount
  );
  const computedDerivedLoanAmount =
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0 &&
    Number.isFinite(ltv) &&
    ltv > 0
      ? purchasePrice * ltv
      : null;
  const derivedLoanAmount =
    Number.isFinite(statedLoanAmount) && statedLoanAmount > 0
      ? null
      : firstFinite(providedDerivedLoanAmount, computedDerivedLoanAmount);

  const interestRatePct = firstFinite(
    termsPayload.interest_rate,
    acquisitionSupportPayload?.interest_rate,
    interestRateFromText
  );
  const amortYears = firstFinite(
    termsPayload.amortization_years,
    termsPayload.amort_years,
    acquisitionSupportPayload?.amortization_years,
    acquisitionSupportPayload?.amort_years,
    amortYearsFromText
  );
  const goingInCapRate = firstFinite(
    termsPayload.going_in_cap_rate,
    acquisitionSupportPayload?.going_in_cap_rate,
    goingInCapRateFromText
  );
  const closingCostsPercent = firstFinite(
    termsPayload.closing_costs_percent,
    acquisitionSupportPayload?.closing_costs_percent
  );
  const lenderFeePercentFromText = extractPercentFromText(
    acquisitionContextText,
    /(lender fee|financing fee|origination fee)/
  );
  const lenderFeeExplicitlyVerified = [
    termsPayload.lender_fee_percent,
    termsPayload.financing_fee_percent,
    termsPayload.origination_fee_percent,
    acquisitionSupportPayload?.lender_fee_percent,
    acquisitionSupportPayload?.financing_fee_percent,
    acquisitionSupportPayload?.origination_fee_percent,
  ].some((value) => Number.isFinite(coerceNumber(value)) && coerceNumber(value) > 0);
  const lenderFeePercent = firstFinite(
    termsPayload.lender_fee_percent,
    termsPayload.financing_fee_percent,
    termsPayload.origination_fee_percent,
    acquisitionSupportPayload?.lender_fee_percent,
    acquisitionSupportPayload?.financing_fee_percent,
    acquisitionSupportPayload?.origination_fee_percent,
    lenderFeePercentFromText
  );
  const unquantifiedLegalAppraisalMention = /legal|appraisal/.test(
    `${String(termsPayload?.closing_cost_notes || "")} ${String(acquisitionSupportPayload?.closing_cost_notes || "")}`.toLowerCase()
  );
  const hasMeaningfulAcquisitionField = [
    purchasePrice,
    ltv,
    statedLoanAmount,
    derivedLoanAmount,
    interestRatePct,
    amortYears,
    goingInCapRate,
    closingCostsPercent,
    lenderFeePercent,
  ].some((value) => Number.isFinite(value) && value > 0);
  if (!hasMeaningfulAcquisitionField) return "";
  const validateAcquisitionTriangle = ({
    purchasePrice: trianglePurchasePrice,
    statedLoanAmount: triangleStatedLoanAmount,
    derivedLoanAmount: triangleDerivedLoanAmount,
    ltv: triangleLtv,
    ratePct: triangleRatePct,
    amortYears: triangleAmortYears,
    lenderFeePercent: triangleLenderFeePercent,
  }) => {
    const verifiedFields = [];
    const missingFields = [];
    const inconsistentFields = [];
    const hasPurchasePrice = Number.isFinite(trianglePurchasePrice) && trianglePurchasePrice > 0;
    const hasStatedLoan = Number.isFinite(triangleStatedLoanAmount) && triangleStatedLoanAmount > 0;
    const hasDerivedLoan = Number.isFinite(triangleDerivedLoanAmount) && triangleDerivedLoanAmount > 0;
    const hasLtv = Number.isFinite(triangleLtv) && triangleLtv > 0;
    const hasRate = Number.isFinite(triangleRatePct) && triangleRatePct > 0;
    const hasAmort = Number.isFinite(triangleAmortYears) && triangleAmortYears > 0;
    const hasLenderFee = Number.isFinite(triangleLenderFeePercent) && triangleLenderFeePercent > 0;
    if (hasPurchasePrice) verifiedFields.push("purchase_price");
    if (hasStatedLoan) verifiedFields.push("stated_acquisition_loan_amount");
    if (hasDerivedLoan) verifiedFields.push("derived_acquisition_loan_amount");
    if (hasLtv) verifiedFields.push("ltv");
    if (hasRate) verifiedFields.push("interest_rate");
    if (hasAmort) verifiedFields.push("amortization_years");
    if (hasLenderFee) verifiedFields.push("lender_fee_percent");
    if (!hasPurchasePrice) missingFields.push("purchase_price");
    if (!hasLtv) missingFields.push("ltv");
    if (!hasRate) missingFields.push("interest_rate");
    if (!hasAmort) missingFields.push("amortization_years");
    const computedLoanFromTriangle =
      hasPurchasePrice && hasLtv ? trianglePurchasePrice * triangleLtv : null;
    if (
      hasStatedLoan &&
      Number.isFinite(computedLoanFromTriangle) &&
      computedLoanFromTriangle > 0 &&
      materiallyDifferentAmount(triangleStatedLoanAmount, computedLoanFromTriangle)
    ) {
      inconsistentFields.push("stated_vs_purchase_ltv_loan_amount");
    }
    if (hasDerivedLoan && hasStatedLoan && materiallyDifferentAmount(triangleDerivedLoanAmount, triangleStatedLoanAmount)) {
      inconsistentFields.push("stated_vs_derived_loan_amount");
    }
    let status = "valid";
    let disclosureReasonCode = null;
    if (!hasPurchasePrice && (hasStatedLoan || hasLtv || hasDerivedLoan)) {
      status = "incomplete";
      disclosureReasonCode = "acq_triangle_missing_purchase_price";
    }
    if (inconsistentFields.length > 0) {
      status = "inconsistent";
      disclosureReasonCode = "acq_triangle_internal_mismatch";
    }
    if (!hasLtv && !hasStatedLoan && !hasDerivedLoan) {
      status = "unsupported";
      disclosureReasonCode = "acq_triangle_missing_financing_basis";
    }
    return {
      status,
      triangleConsistent: inconsistentFields.length === 0,
      verifiedFields,
      missingFields,
      inconsistentFields,
      disclosureReasonCode,
      renderedBehavior: status === "valid" ? "render_table" : "collapse_to_disclosure",
    };
  };
  const computedAcquisitionTriangleValidation = validateAcquisitionTriangle({
    purchasePrice,
    statedLoanAmount,
    derivedLoanAmount,
    ltv,
    ratePct: interestRatePct,
    amortYears,
    lenderFeePercent,
  });
  const acquisitionTriangleValidation =
    acquisitionTriangleValidationState && typeof acquisitionTriangleValidationState === "object"
      ? acquisitionTriangleValidationState
      : computedAcquisitionTriangleValidation;

  const noi = coerceNumber(t12Payload?.net_operating_income);
  const limitations = [];
  const hasDocumentStatedPurchasePrice = Number.isFinite(purchasePrice) && purchasePrice > 0;
  if (!hasDocumentStatedPurchasePrice) {
    limitations.push("Purchase price was not verified in the uploaded documents.");
  } else {
    limitations.push(
      "Purchase price is document-stated in uploaded acquisition assumptions and is shown for acquisition context only. It is not appraised value and is not treated as current outstanding debt."
    );
  }
  if (!Number.isFinite(ltv) || ltv <= 0) {
    limitations.push("Acquisition debt sizing was not modeled because LTV was not verified in the uploaded documents.");
  }
  if (
    Number.isFinite(statedLoanAmount) &&
    statedLoanAmount > 0 &&
    Number.isFinite(computedDerivedLoanAmount) &&
    computedDerivedLoanAmount > 0 &&
    materiallyDifferentAmount(statedLoanAmount, computedDerivedLoanAmount)
  ) {
    limitations.push(
      "Stated acquisition loan amount and purchase-price/LTV-derived loan amount differ materially; stated source values are shown without silent re-derivation."
    );
  }
  if (!Number.isFinite(interestRatePct) || interestRatePct <= 0) {
    limitations.push("Estimated acquisition debt service was not modeled because the interest rate was not verified.");
  }
  if (!Number.isFinite(amortYears) || amortYears <= 0) {
    limitations.push("Estimated acquisition debt service was not modeled because amortization was not verified.");
  }
  if (acquisitionTriangleValidation.status !== "valid") {
    limitations.push(
      "Acquisition debt sizing table was collapsed because acquisition purchase/loan/LTV inputs were incomplete, inconsistent, or unsupported."
    );
  }
  const mortgageConstant = computeMortgageConstant(interestRatePct / 100, amortYears);
  const annualDebtService =
    Number.isFinite(statedLoanAmount ?? derivedLoanAmount) &&
    (statedLoanAmount ?? derivedLoanAmount) > 0 &&
    Number.isFinite(mortgageConstant) &&
    mortgageConstant > 0
      ? (statedLoanAmount ?? derivedLoanAmount) * mortgageConstant
      : null;
  const acquisitionDscr =
    Number.isFinite(noi) && noi > 0 && Number.isFinite(annualDebtService) && annualDebtService > 0
      ? noi / annualDebtService
      : null;
  const rows = [
    Number.isFinite(purchasePrice) && purchasePrice > 0 ? ["Purchase Price", formatCurrency(purchasePrice)] : null,
    Number.isFinite(ltv) && ltv > 0 ? ["Documented LTV", formatPercent1(ltv)] : null,
    Number.isFinite(statedLoanAmount) && statedLoanAmount > 0 ? ["Stated Acquisition Loan Amount", formatCurrency(statedLoanAmount)] : null,
    Number.isFinite(derivedLoanAmount) && derivedLoanAmount > 0 ? ["Derived Acquisition Loan Amount", formatCurrency(derivedLoanAmount)] : null,
    Number.isFinite(interestRatePct) && interestRatePct > 0 ? ["Interest Rate", formatInterestRatePercent(interestRatePct)] : null,
    Number.isFinite(amortYears) && amortYears > 0 ? ["Amortization", `${Math.round(amortYears)} years`] : null,
    Number.isFinite(goingInCapRate) && goingInCapRate > 0 ? ["Going-In Cap Rate", formatPercent1(goingInCapRate)] : null,
    Number.isFinite(closingCostsPercent) && closingCostsPercent > 0 ? ["Closing Costs", formatPercentExactDisplay(closingCostsPercent)] : null,
    lenderFeeExplicitlyVerified && Number.isFinite(lenderFeePercent) && lenderFeePercent > 0
      ? ["Lender Fee", formatPercent1(lenderFeePercent)]
      : null,
    !Number.isFinite(closingCostsPercent) && unquantifiedLegalAppraisalMention ? ["Closing Cost Notes", "Legal/appraisal costs noted; not quantified"] : null,
  ].filter(Boolean);
  if (Number.isFinite(annualDebtService) && annualDebtService > 0) {
    rows.push(["Estimated Annual Debt Service", formatCurrency(annualDebtService)]);
  }
  if (Number.isFinite(acquisitionDscr) && acquisitionDscr > 0) {
    rows.push(["Proposed Acquisition DSCR", formatMultiple(acquisitionDscr, 2)]);
  }

  const limitationHtml = limitations.length
    ? `<p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${escapeHtml(limitations.join(" "))}</p>`
    : "";
  if (acquisitionTriangleValidation.renderedBehavior === "collapse_to_disclosure") {
    const inconsistentFieldSet = new Set(acquisitionTriangleValidation.inconsistentFields || []);
    const hasStatedVsPurchaseLtvMismatch = inconsistentFieldSet.has("stated_vs_purchase_ltv_loan_amount");
    const hasStatedVsDerivedMismatch = inconsistentFieldSet.has("stated_vs_derived_loan_amount");
    const safeRows = rows.filter(([label]) => {
      const normalizedLabel = String(label || "");
      if (/Estimated Annual Debt Service|Proposed Acquisition DSCR/i.test(normalizedLabel)) return false;
      if (hasStatedVsPurchaseLtvMismatch) {
        if (/Purchase Price|Documented LTV|Stated Acquisition Loan Amount/i.test(normalizedLabel)) return false;
      }
      if (hasStatedVsDerivedMismatch) {
        if (/Stated Acquisition Loan Amount|Derived Acquisition Loan Amount/i.test(normalizedLabel)) return false;
      }
      return true;
    });
    const safeRowsHtml = safeRows.length
      ? `<table><thead><tr><th>Verified Field</th><th>Document-Derived Value</th></tr></thead><tbody>${safeRows
          .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
          .join("")}</tbody></table>`
      : "";
    const html = `<div class="card no-break" style="margin:12px 0;"><p class="subsection-title">Proposed Acquisition Debt Sizing</p><p class="small">Acquisition financing inputs were not safe to render as a full debt sizing table. This section is limited to non-contradictory verified fields only. This is not current outstanding debt and is not used as a current refinance debt balance.</p>${safeRowsHtml}${limitationHtml}</div>`;
    if (returnState) {
      return {
        html,
        triangleValidationState: acquisitionTriangleValidation,
        renderBehavior: acquisitionTriangleValidation.renderedBehavior,
      };
    }
    return html;
  }
  const html = `<div class="card no-break" style="margin:12px 0;"><p class="subsection-title">Proposed Acquisition Debt Sizing</p><p class="small">Derived from uploaded purchase assumptions. This is not current outstanding debt, is not used as a current refinance debt balance, and does not represent appraised value.</p><table><thead><tr><th>Input</th><th>Document-Derived Value</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>${limitationHtml}</div>`;
  if (returnState) {
    return {
      html,
      triangleValidationState: acquisitionTriangleValidation,
      renderBehavior: acquisitionTriangleValidation.renderedBehavior,
    };
  }
  return html;
}
function buildAcquisitionFinancingReadinessHtml({
  loanTermSheetTermsPayload = null,
  acquisitionTermsPayload = null,
  t12Payload = null,
  reportMode = null,
  currentDebtAssessmentState = null,
  supportDocAuthorityRows = null,
} = {}) {
  if (String(reportMode || "").toLowerCase() !== "v1_core") return "";
  const authorityRows = Array.isArray(supportDocAuthorityRows) ? supportDocAuthorityRows : [];
  const proposedAuthorityRow = authorityRows.find((row) =>
    row?.has_proposed_acquisition_financing === true ||
    /proposed_acquisition_financing/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || ""))
  ) || null;
  const currentDebtAuthorityRow = authorityRows.find((row) =>
    row?.has_current_debt_context === true ||
    /current_debt_context/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || ""))
  ) || null;
  const currentLoanPayload =
    loanTermSheetTermsPayload && typeof loanTermSheetTermsPayload === "object"
      ? loanTermSheetTermsPayload
      : null;
  const acquisitionContextPayload =
    acquisitionTermsPayload && typeof acquisitionTermsPayload === "object"
      ? acquisitionTermsPayload
      : null;
  const acquisitionSupportPayload =
    acquisitionContextPayload?.acquisition_support &&
    typeof acquisitionContextPayload.acquisition_support === "object"
      ? acquisitionContextPayload.acquisition_support
      : null;
  const combinedText = [
    currentLoanPayload?.source_text,
    currentLoanPayload?.raw_text,
    currentLoanPayload?.notes,
    currentLoanPayload?.loan_terms_text,
    currentLoanPayload?.extracted_text,
    acquisitionContextPayload?.source_text,
    acquisitionContextPayload?.raw_text,
    acquisitionContextPayload?.notes,
    acquisitionContextPayload?.loan_terms_text,
    acquisitionContextPayload?.extracted_text,
    acquisitionSupportPayload?.source_text,
    acquisitionSupportPayload?.raw_text,
    acquisitionSupportPayload?.notes,
    acquisitionSupportPayload?.loan_terms_text,
    acquisitionSupportPayload?.extracted_text,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");
  const currentDebtSourceLike =
    /(current mortgage statement|existing mortgage|true current debt|current outstanding balance|outstanding principal|unpaid principal|current loan balance|current mortgage balance|payoff statement|payoff balance|current monthly debt service)/i.test(combinedText) ||
    ["current_mortgage_statement", "current_debt_terms", "mortgage_statement"].includes(
      String(currentLoanPayload?.semantic_doc_role || acquisitionContextPayload?.semantic_doc_role || "").trim().toLowerCase()
    ) ||
    (
      /(current|existing|mortgage)/i.test(String(currentLoanPayload?.debt_basis || acquisitionContextPayload?.debt_basis || "")) &&
      !/(acquisition|proposed|purchase)/i.test(String(currentLoanPayload?.debt_basis || acquisitionContextPayload?.debt_basis || ""))
    );
  const proposedAcquisitionSourcePayload = proposedAuthorityRow || (currentDebtSourceLike ? null : currentLoanPayload);
  const hasProposedAcquisitionTerms = Boolean(
    proposedAuthorityRow ||
    currentDebtAssessmentState?.has_proposed_acquisition_financing ||
    String(proposedAcquisitionSourcePayload?.debt_basis || acquisitionContextPayload?.debt_basis || "").toLowerCase().includes("acquisition") ||
    /(?:purchase|proposed acquisition|acquisition financing|going[-\s]*in cap|purchase price)/i.test(combinedText) ||
    String(proposedAcquisitionSourcePayload?.semantic_doc_role || acquisitionContextPayload?.semantic_doc_role || "").trim().toLowerCase() === "purchase_assumptions"
  );
  const hasAcquisitionContextHints =
    Number.isFinite(coerceNumber(acquisitionContextPayload?.purchase_price ?? acquisitionSupportPayload?.purchase_price)) ||
    Number.isFinite(coerceNumber(acquisitionContextPayload?.going_in_cap_rate ?? acquisitionSupportPayload?.going_in_cap_rate)) ||
    Number.isFinite(coerceNumber(acquisitionContextPayload?.ltv ?? acquisitionSupportPayload?.ltv)) ||
    Number.isFinite(coerceNumber(acquisitionContextPayload?.interest_rate ?? acquisitionSupportPayload?.interest_rate)) ||
    Number.isFinite(
      coerceNumber(
        acquisitionContextPayload?.amort_years ??
        acquisitionContextPayload?.amortization_years ??
        acquisitionSupportPayload?.amort_years ??
        acquisitionSupportPayload?.amortization_years
      )
    );
  const hasSourceBoundProposedAcquisitionContext =
    Number.isFinite(coerceNumber(proposedAcquisitionSourcePayload?.purchase_price ?? acquisitionContextPayload?.purchase_price ?? acquisitionSupportPayload?.purchase_price)) &&
    (
      Number.isFinite(coerceNumber(proposedAcquisitionSourcePayload?.stated_acquisition_loan_amount ?? proposedAcquisitionSourcePayload?.loan_amount ?? proposedAcquisitionSourcePayload?.derived_acquisition_loan_amount)) ||
      Number.isFinite(coerceNumber(proposedAcquisitionSourcePayload?.ltv ?? acquisitionContextPayload?.ltv ?? acquisitionSupportPayload?.ltv))
    ) &&
    Number.isFinite(coerceNumber(proposedAcquisitionSourcePayload?.interest_rate ?? acquisitionContextPayload?.interest_rate ?? acquisitionSupportPayload?.interest_rate)) &&
    Number.isFinite(
      coerceNumber(
        proposedAcquisitionSourcePayload?.amort_years ??
        proposedAcquisitionSourcePayload?.amortization_years ??
        acquisitionContextPayload?.amort_years ??
        acquisitionContextPayload?.amortization_years ??
        acquisitionSupportPayload?.amort_years ??
        acquisitionSupportPayload?.amortization_years
      )
  );
  if (!hasSourceBoundProposedAcquisitionContext) {
    if (!hasProposedAcquisitionTerms && !currentDebtSourceLike && !currentDebtAuthorityRow && !hasAcquisitionContextHints) return "";
    const notes = ["Proposed Acquisition Financing: Not source-complete / not modeled."];
    if (currentDebtSourceLike || currentDebtAuthorityRow) {
      notes.push("Current/existing debt support was uploaded, but it remains contextual and is not treated as proposed acquisition financing.");
    }
    return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Proposed Acquisition Financing Context</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">${escapeHtml(notes.join(" "))}</p></div>`;
  }

  const firstFinite = (...values) => {
    for (const value of values) {
      const parsed = coerceNumber(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return null;
  };
  const purchasePrice = firstFinite(
    proposedAcquisitionSourcePayload?.purchase_price,
    proposedAcquisitionSourcePayload?.purchasePrice,
    proposedAcquisitionSourcePayload?.acquisition_price,
    proposedAcquisitionSourcePayload?.purchase_price_amount,
    acquisitionContextPayload?.purchase_price,
    acquisitionContextPayload?.purchasePrice,
    acquisitionContextPayload?.acquisition_price,
    acquisitionContextPayload?.purchase_price_amount,
    acquisitionSupportPayload?.purchase_price,
    acquisitionSupportPayload?.purchasePrice,
    acquisitionSupportPayload?.acquisition_price,
    acquisitionSupportPayload?.purchase_price_amount
  );
  const explicitLtv = firstFinite(
    proposedAcquisitionSourcePayload?.ltv,
    acquisitionContextPayload?.ltv,
    acquisitionSupportPayload?.ltv
  );
  const statedLoanAmount = firstFinite(
    proposedAcquisitionSourcePayload?.stated_acquisition_loan_amount,
    proposedAcquisitionSourcePayload?.loan_amount,
    proposedAcquisitionSourcePayload?.proposed_loan_amount,
    proposedAcquisitionSourcePayload?.acquisition_loan_amount,
    proposedAcquisitionSourcePayload?.stated_loan_amount,
    acquisitionContextPayload?.stated_acquisition_loan_amount,
    acquisitionContextPayload?.loan_amount,
    acquisitionContextPayload?.proposed_loan_amount,
    acquisitionContextPayload?.acquisition_loan_amount,
    acquisitionContextPayload?.stated_loan_amount,
    acquisitionSupportPayload?.stated_acquisition_loan_amount,
    acquisitionSupportPayload?.loan_amount,
    acquisitionSupportPayload?.proposed_loan_amount,
    acquisitionSupportPayload?.acquisition_loan_amount,
    acquisitionSupportPayload?.stated_loan_amount
  );
  const derivedLoanFromLtv =
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0 &&
    Number.isFinite(explicitLtv) &&
    explicitLtv > 0
      ? purchasePrice * explicitLtv
      : null;
  const proposedLoanAmount = firstFinite(statedLoanAmount, derivedLoanFromLtv);
  const interestRatePct = firstFinite(
    proposedAcquisitionSourcePayload?.interest_rate,
    acquisitionContextPayload?.interest_rate,
    acquisitionSupportPayload?.interest_rate
  );
  const amortYears = firstFinite(
    proposedAcquisitionSourcePayload?.amortization_years,
    proposedAcquisitionSourcePayload?.amort_years,
    acquisitionContextPayload?.amortization_years,
    acquisitionContextPayload?.amort_years,
    acquisitionSupportPayload?.amortization_years,
    acquisitionSupportPayload?.amort_years
  );
  const derivedLtv =
    Number.isFinite(proposedLoanAmount) &&
    proposedLoanAmount > 0 &&
    Number.isFinite(purchasePrice) &&
    purchasePrice > 0
      ? proposedLoanAmount / purchasePrice
      : null;
  const currentDebtContextOnly = Boolean(
    currentDebtAssessmentState?.has_true_current_debt_balance ||
    currentDebtAssessmentState?.current_debt_dscr_status === "computed"
  );
  const lenderFeePercent = firstFinite(
    proposedAcquisitionSourcePayload?.lender_fee_percent,
    proposedAcquisitionSourcePayload?.financing_fee_percent,
    proposedAcquisitionSourcePayload?.origination_fee_percent,
    acquisitionContextPayload?.lender_fee_percent,
    acquisitionContextPayload?.financing_fee_percent,
    acquisitionContextPayload?.origination_fee_percent,
    acquisitionSupportPayload?.lender_fee_percent,
    acquisitionSupportPayload?.financing_fee_percent,
    acquisitionSupportPayload?.origination_fee_percent
  );
  const rows = [
    ["Purchase Price", formatCurrency(purchasePrice)],
    ["Proposed Loan Amount", formatCurrency(proposedLoanAmount)],
    [
      "LTV",
      Number.isFinite(derivedLtv)
        ? formatPercent1(derivedLtv)
        : Number.isFinite(explicitLtv)
        ? formatPercent1(explicitLtv)
        : "Not assessed",
    ],
    ["Interest Rate", formatInterestRatePercent(interestRatePct)],
    ["Amortization", `${Math.round(amortYears)} years`],
    Number.isFinite(lenderFeePercent) ? ["Closing / Lender Fee", formatPercentExactDisplay(lenderFeePercent)] : null,
  ].filter(Boolean);
  return `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Proposed Acquisition Financing Context</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">This is source-bound proposed acquisition financing context only. It is not loan approval, lender commitment, credit decision, refinance sufficiency analysis, or debt-service underwriting.</p><table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:11px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F8FAFC;color:#1e293b;border:1px solid #E5E7EB;">Input</th><th style="text-align:left;padding:4px 8px;background:#F8FAFC;color:#1e293b;border:1px solid #E5E7EB;">Value</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(label)}</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(value)}</td></tr>`).join("")}</tbody></table></div>`;
}
function buildScreeningRefiSufficiencyTable({
  financials,
  t12Payload,
  currentDebtAssessmentState = null,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
} = {}) {
  const f = financials && typeof financials === "object" ? financials : {};
  const refiDebtRenderState = buildRefiDebtRenderState({
    currentDebtAssessmentState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials: f,
    t12Payload,
  });
  if (!refiDebtRenderState.allowDebtMath) {
    if (refiDebtRenderState.status === "source_limited") {
      return `<p>Debt/refinance metrics were source-limited because the uploaded debt evidence did not verify a current outstanding debt balance sufficient for refinance analysis.</p>`;
    }
    return `<p>Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided.</p>`;
  }
  const canonicalRefiDebtBasis = refiDebtRenderState.canonicalRefiDebtBasis;
  const canonicalRefiInterestRate = coerceNumber(canonicalRefiDebtBasis?.interestRatePct);
  const canonicalRefiAmortYears = coerceNumber(canonicalRefiDebtBasis?.amortYears);
  const noiFromT12 = coerceNumber(t12Payload?.net_operating_income);
  const noiFromFinancials = coerceNumber(f.noi_base);
  const noiValue = Number.isFinite(noiFromT12) ? noiFromT12 : noiFromFinancials;
  const formatBps = (x) => `${Math.round(Number(x))} bps`;
  const formatPercentArray = (arr) =>
    `[${arr.map((entry) => formatPercent1(coerceNumber(entry))).join(", ")}]`;
  const formatBpsArray = (arr) =>
    `[${arr.map((entry) => formatBps(coerceNumber(entry))).join(", ")}]`;
  const isPresentScalar = (value) => Number.isFinite(value) && value > 0;
  const isPresentArray = (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => Number.isFinite(coerceNumber(entry)));
  const rows = [
    {
      label: "NOI (base)",
      present: isPresentScalar(noiValue),
      value: Number.isFinite(noiValue) ? formatCurrency(noiValue) : " - ",
    },
    {
      label: "Current loan balance",
      present: isPresentScalar(coerceNumber(canonicalRefiDebtBasis.debtBalance)),
      value: Number.isFinite(coerceNumber(canonicalRefiDebtBasis.debtBalance))
        ? formatCurrency(coerceNumber(canonicalRefiDebtBasis.debtBalance))
        : " - ",
    },
    {
      label: "Max LTV",
      present: isPresentScalar(coerceNumber(f.refi_ltv_max)),
      value: Number.isFinite(coerceNumber(f.refi_ltv_max))
        ? formatPercent1(coerceNumber(f.refi_ltv_max))
        : " - ",
    },
    {
      label: "Minimum DSCR",
      present: isPresentScalar(coerceNumber(f.refi_dscr_min)),
      value: Number.isFinite(coerceNumber(f.refi_dscr_min))
        ? formatMultiple(coerceNumber(f.refi_dscr_min))
        : " - ",
    },
    {
      label: "Interest rate",
      present: isPresentScalar(canonicalRefiInterestRate),
      value: Number.isFinite(canonicalRefiInterestRate)
        ? formatInterestRatePercent(canonicalRefiInterestRate)
        : " - ",
    },
    {
      label: "Amortization (years)",
      present: isPresentScalar(canonicalRefiAmortYears),
      value: Number.isFinite(canonicalRefiAmortYears)
        ? formatYears(canonicalRefiAmortYears)
        : " - ",
    },
    {
      label: "Refinance cap rate",
      present: isPresentScalar(coerceNumber(f.refi_cap_rate_base)),
      value: Number.isFinite(coerceNumber(f.refi_cap_rate_base))
        ? formatCapPercentExact(coerceNumber(f.refi_cap_rate_base))
        : " - ",
    },
    {
      label: "NOI stress shocks",
      present: isPresentArray(f.stress_noi_shocks),
      value: isPresentArray(f.stress_noi_shocks)
        ? escapeHtml(formatPercentArray(f.stress_noi_shocks))
        : " - ",
    },
    {
      label: "Cap rate stress (bps)",
      present: isPresentArray(f.stress_cap_rate_bps),
      value: isPresentArray(f.stress_cap_rate_bps)
        ? escapeHtml(formatBpsArray(f.stress_cap_rate_bps))
        : " - ",
    },
    {
      label: "Rate stress (bps)",
      present: isPresentArray(f.stress_rate_bps),
      value: isPresentArray(f.stress_rate_bps)
        ? escapeHtml(formatBpsArray(f.stress_rate_bps))
        : " - ",
    },
  ];
  const rowsHtml = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.label)}</td><td>${
          row.present ? "Present" : "Missing"
        }</td><td>${row.value}</td></tr>`
    )
    .join("");
  return `<p>Advanced financing sufficiency not produced due to insufficient inputs.</p><table><thead><tr><th>Input</th><th>Status</th><th>Provided Value</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="small">This sufficiency check verifies whether required inputs are present in uploaded documents. Missing required inputs prevent advanced financing analysis.</p>`;
}
function buildScreeningDataCoverageSummary({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  mortgagePayload = null,
  loanTermSheetTermsPayload = null,
  financials,
  effectiveReportMode,
  supportingUnderwritingDocsUsed = false,
  hasUploadedFiles = false,
  documentSources = [],
  currentDebtAssessmentState = null,
  sourceReconciliationState = null,
  sectionEligibility = null,
  dataCoverageState = null,
  optionalSectionState = null,
  hasForwardLookingRenovationInputs = false,
  renovationDisplayMode = null,
  renovationPayload = null,
  propertyTaxPayload = null,
  propertyTaxBindingState = null,
  documentQuantitativeUsageMap = null,
  supportDocAuthorityRows = null,
  canonicalSupportDocMap = null,
  renderedDocumentTreatmentRowsOut = null,
}) {
  const canonicalGpr = resolveCanonicalT12GprValue(t12Payload);
  const t12Checks = [
    {
      label: "gross_potential_rent",
      present: Number.isFinite(canonicalGpr),
    },
    {
      label: "effective_gross_income",
      present: Number.isFinite(coerceNumber(t12Payload?.effective_gross_income)),
    },
    {
      label: "total_operating_expenses",
      present: Number.isFinite(coerceNumber(t12Payload?.total_operating_expenses)),
    },
    {
      label: "net_operating_income",
      present: Number.isFinite(coerceNumber(t12Payload?.net_operating_income)),
    },
  ];
  const t12PresentCount = t12Checks.filter((entry) => entry.present).length;
  const t12CoveragePct = ((t12PresentCount / t12Checks.length) * 100).toLocaleString(
    "en-CA",
    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
  );
  const t12Missing = t12Checks
    .filter((entry) => !entry.present)
    .map((entry) => entry.label);
  const rentRollRows = Array.isArray(rentRollPayload?.units) && rentRollPayload.units.length > 0
    ? rentRollPayload.units
    : Array.isArray(computedRentRoll?.unit_mix)
    ? computedRentRoll.unit_mix
    : Array.isArray(rentRollPayload?.unit_mix)
    ? rentRollPayload.unit_mix
    : [];
  const totalUnitsPresent = Number.isFinite(
    coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units)
  );
  const isPartialRentRollSample =
    computedRentRoll?.is_partial_sample === true ||
    rentRollPayload?.is_partial_sample === true;
  const hasTrustedRentRollSummaryTotals =
    rentRollPayload?.totals?.summary_row_detected === true;
  const occFromT12 =
    coerceNumber(t12Payload?.physical_occupancy) ??
    coerceNumber(t12Payload?.economic_occupancy) ??
    coerceNumber(t12Payload?.occupancy);
  const rrTotalUnits =
    coerceNumber(computedRentRoll?.total_units) ??
    coerceNumber(rentRollPayload?.totals?.total_units);
  const rrOccupiedUnits =
    coerceNumber(computedRentRoll?.occupied_units) ??
    coerceNumber(rentRollPayload?.totals?.occupied_units);
  const occFromRR =
    Number.isFinite(rrTotalUnits) && rrTotalUnits > 0 && Number.isFinite(rrOccupiedUnits)
      ? rrOccupiedUnits / rrTotalUnits
      : null;
  const canonicalOccupancyNoteValue = resolveOccupancyNoteValue(computedRentRoll, rentRollPayload);
  const rrOccPresent = Number.isFinite(coerceNumber(canonicalOccupancyNoteValue)) ||
    (!isPartialRentRollSample && Number.isFinite(deriveOccFromRentRollUnits(rentRollPayload)));
  const inPlacePresent =
    Number.isFinite(coerceNumber(computedRentRoll?.total_in_place_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.in_place_rent_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.in_place_rent_monthly)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.current_rent_monthly)) ||
    (Array.isArray(rentRollRows)
      ? rentRollRows.some((row) =>
        Number.isFinite(coerceNumber(row?.in_place_rent ?? row?.current_rent))
      )
      : false);
  const marketPresent =
    Number.isFinite(coerceNumber(computedRentRoll?.total_market_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.market_rent_annual)) ||
    Number.isFinite(coerceNumber(rentRollPayload?.totals?.market_rent_monthly)) ||
    (Array.isArray(rentRollRows)
      ? rentRollRows.some((row) =>
        Number.isFinite(coerceNumber(row?.market_rent))
      )
      : false);
  const rentRollChecks = [
    { label: "total_units", present: totalUnitsPresent },
    { label: "in_place_rent", present: inPlacePresent },
    { label: "market_rent", present: marketPresent },
    {
      label: "Occupancy / unit status (occupied/vacant) or occupied/total summary",
      present: rrOccPresent,
    },
  ];
  const rrPresentCount = rentRollChecks.filter((entry) => entry.present).length;
  const rrCoveragePct = ((rrPresentCount / rentRollChecks.length) * 100).toLocaleString(
    "en-CA",
    { minimumFractionDigits: 1, maximumFractionDigits: 1 }
  );
  const rrMissing = rentRollChecks
    .filter((entry) => !entry.present)
    .map((entry) => entry.label);
  const missingInputs = [...t12Missing, ...rrMissing];
  const missingHtml = missingInputs.length
    ? missingInputs.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")
    : "";
  const suggestions = [];
  if (t12Missing.length > 0) {
    suggestions.push("Trailing-12 Operating Statement (T12) with EGI, OpEx, NOI");
  }
  if (rrMissing.includes("in_place_rent") || rrMissing.includes("market_rent")) {
    suggestions.push("Current Rent Roll with in-place & market rents");
  }
  if (!rrOccPresent) {
    suggestions.push("Rent Roll with unit status (occupied/vacant) or occupied/total summary");
  }
  const suggestionHtml = [...new Set(suggestions)]
    .slice(0, 3)
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join("");
  const nextBestUploadsHtml = suggestionHtml
    ? `<p class="subsection-title" style="margin-top:6px;">Next Best Document Uploads</p><ul>${suggestionHtml}</ul>`
    : "";
  const unlocksCard = "";
  const allPresent = missingInputs.length === 0;
  const sourceReconciliationRequired = Boolean(
    buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required
  );
  const sourceConstrainedSectionCount = Number(
    dataCoverageState?.sectionConstrainedCount ??
    sectionEligibility?.source_constrained_section_count ??
    0
  );
  const explicitScreeningSourceLimitedDisclosure =
    sectionEligibility?.source_limited_disclosure_required === true ||
    sectionEligibility?.screening_source_limited_disclosure_required === true;
  const explicitUnderwritingSourceLimitedDisclosure =
    sectionEligibility?.source_limited_disclosure_required === true;
  const sourceLimitedDisclosureRequired =
    effectiveReportMode === "screening_v1"
      ? explicitScreeningSourceLimitedDisclosure || (sourceConstrainedSectionCount > 0 && !allPresent)
      : explicitUnderwritingSourceLimitedDisclosure;
  const suppressVerifiedCoverageCopy = sourceReconciliationRequired || sourceLimitedDisclosureRequired;
  const reconciliationCoverageHeadline = sourceReconciliationRequired
    ? "CORE INPUTS EXTRACTED - SOURCE RECONCILIATION DISCLOSURE"
    : sourceLimitedDisclosureRequired
    ? "CORE INPUTS EXTRACTED - SOURCE LIMITATIONS DISCLOSURE"
    : null;
  const disclosureCoverageBody =
    sourceReconciliationRequired
      ? "Required T12 and rent roll fields were extracted, but rent roll and T12 remain materially unreconciled. Review the Source Reconciliation disclosure before relying on variance-sensitive conclusions."
      : "Required core fields were extracted, but one or more underwriting sections remain source-constrained based on uploaded support documents.";
  const reconciliationCoverageBody =
    "Required T12 and rent roll fields were extracted, but rent roll and T12 remain materially unreconciled. Review the Source Reconciliation disclosure before relying on variance-sensitive conclusions.";
  const fieldCompletenessClarification = sourceReconciliationRequired
    ? `<p style="margin:8px 0 0 0;color:#374151;font-size:11px;">Field extraction completeness does not imply cross-source reconciliation. The T12 and rent roll fields were extracted, but the income scale variance remains unresolved.</p>`
    : "";
  const coverageTableHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Dataset</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Fields Present</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Coverage</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Missing</th></tr></thead><tbody><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">T12 Operating Statement</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${t12PresentCount}/${t12Checks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${t12CoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(t12Missing.join(", ") || "None")}</td></tr><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Rent Roll</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${rrPresentCount}/${rentRollChecks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${rrCoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(rrMissing.join(", ") || "None")}</td></tr></tbody></table>`;
  const sourceReliabilityRows = [
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">T12 Operating Statement</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Core quantitative source</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">EGI, OpEx, and NOI</td></tr>`,
    `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Rent Roll</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Core quantitative source</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Units, occupancy, in-place rent, and market rent</td></tr>`,
    effectiveReportMode === "v1_core"
      ? `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Support documents</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Context only unless validated</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Corroborating support, not an override for modeled core inputs</td></tr>`
      : `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Unsupported inputs</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Omitted</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">Missing or unsupported items are not inferred</td></tr>`,
  ].join("");
  const sourceReliabilityFooter =
    effectiveReportMode === "screening_v1"
      ? "Advanced financing and return-projection modules are outside the Screening Report scope."
      : "Advanced financing and return-projection modules remain deferred unless explicitly supported by the report family and verified source basis.";
  const sourceReliabilityHtml = `<div style="margin-top:10px;"><p class="subsection-title">Data Coverage / Source Reliability</p><table style="width:100%;border-collapse:collapse;font-size:11px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Source</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Treatment</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Use</th></tr></thead><tbody>${sourceReliabilityRows}</tbody></table><p class="small" style="margin:6px 0 0 0;color:#64748b;">${escapeHtml(sourceReliabilityFooter)}</p></div>`;
  if (allPresent) {
    if (effectiveReportMode === "screening_v1") {
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Fully Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : "All required screening inputs were fully extracted from uploaded documents.")}</p>${coverageTableHtml}${sourceReliabilityHtml}${fieldCompletenessClarification}</div>`;
    }
    if (effectiveReportMode === "v1_core") {
      const memoCoverageCopy = sourceReconciliationRequired
        ? "T12 and Rent Roll core fields were extracted, but they remain materially unreconciled. Review the Source Context / Support Document Treatment section before relying on variance-sensitive conclusions."
        : "Core operating inputs (T12 and Rent Roll) were fully verified. Optional support documents are listed for context and auditability only unless explicitly validated for quantitative use.";
      const optionalSupportCopy = sourceLimitedDisclosureRequired
        ? "Optional or support documents remain qualitative/context-only unless they are explicitly validated and bound to a modeled input."
        : "Optional or support documents remain qualitative/context-only unless they are explicitly validated and bound to a modeled input.";
      const sectionEligibilityCopy = (
        Number(optionalSectionState?.renovationEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.appraisalEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.marketSurveyEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.environmentalEligibility?.source_constrained ? 1 : 0) +
        Number(optionalSectionState?.zoningEligibility?.source_constrained ? 1 : 0)
      ) > 0 || sourceConstrainedSectionCount > 0
        ? "Optional underwriting sections are source-constrained where supporting inputs were not verified."
        : "";
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : memoCoverageCopy)}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(optionalSupportCopy)}</p>${sectionEligibilityCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(sectionEligibilityCopy)}</p>` : ""}${coverageTableHtml}${sourceReliabilityHtml}${fieldCompletenessClarification}</div>`;
    }
    const currentDebtCoverageState = formatCurrentDebtAssessmentCopy({
      currentDebtState: currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Noi: coerceNumber(t12Payload?.net_operating_income),
    });
    const currentDebtCoverageCopy =
      currentDebtAssessmentState?.current_debt_limitation_reason_code === "acquisition_only_not_current_debt" &&
      !currentDebtAssessmentState?.has_true_current_debt_balance
        ? "Structured T12, rent roll, and supporting documents are listed where available. Unsupported or unstructured uploads remain excluded from modeled outputs."
        : "Structured T12, rent roll, and supporting documents are listed where available. Unsupported or unstructured uploads remain excluded from modeled outputs.";
    const reconciliationCopy = sourceReconciliationState?.source_reconciliation_disclosure;
    const sectionEligibilityCopy = (
      Number(optionalSectionState?.renovationEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.appraisalEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.marketSurveyEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.environmentalEligibility?.source_constrained ? 1 : 0) +
      Number(optionalSectionState?.zoningEligibility?.source_constrained ? 1 : 0)
    ) > 0 || sourceConstrainedSectionCount > 0
      ? "Optional underwriting sections are source-constrained where supporting inputs were not verified."
      : "";
    const treatmentSummaryHtml = buildDocumentTreatmentSummaryHtml({
      reportMode: effectiveReportMode,
      documentSources,
      currentDebtAssessmentState,
      hasForwardLookingRenovationInputs,
      renovationDisplayMode,
      renovationPayload,
      propertyTaxPayload,
      propertyTaxBindingState,
      documentQuantitativeUsageMap,
      supportDocAuthorityRows,
      canonicalSupportDocMap,
      renderedDocumentTreatmentRowsOut,
    });
    return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">${suppressVerifiedCoverageCopy ? reconciliationCoverageHeadline : "CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified"}</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(suppressVerifiedCoverageCopy ? disclosureCoverageBody : currentDebtCoverageCopy)}</p>${reconciliationCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(reconciliationCopy)}</p>` : ""}${sectionEligibilityCopy ? `<p style="margin:0 0 10px 0;color:#374151;font-size:11px;">${escapeHtml(sectionEligibilityCopy)}</p>` : ""}<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${treatmentSummaryHtml}<!-- END DOCUMENT_TREATMENT_SUMMARY -->${coverageTableHtml}${fieldCompletenessClarification}</div>${hasUploadedFiles ? `<p class="small" style="margin-top:8px;">Uploaded files are listed separately; only structured inputs are used quantitatively.</p>` : ""}`;
  }
  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p>${coverageTableHtml}${sourceReliabilityHtml}${nextBestUploadsHtml}<p class="small">Sections not supported by minimum verified source coverage were intentionally withheld from analysis.</p>${unlocksCard}`;
}
function isEligiblePositiveIncomeDriver(row) {
  const label = String(row?.label || "").trim();
  const amount = coerceNumber(row?.amount);
  if (!label || !Number.isFinite(amount) || amount <= 0) return false;
  return !/\b(?:Effective Gross Income|EGI|Gross Potential Rent|GPR|Total Income|Net Operating Income|NOI|subtotal|total|vacancy|loss|concession|bad debt|collection loss)\b/i.test(label);
}
function isEligiblePositiveExpenseDriver(row) {
  const label = String(row?.label || "").trim();
  const amount = coerceNumber(row?.amount);
  if (!label || !Number.isFinite(amount) || amount <= 0) return false;
  return !/\b(?:Total Operating Expenses|Total Expenses|subtotal|total|Effective Gross Income|EGI|Gross Potential Rent|GPR|NOI)\b/i.test(label);
}
function buildScreeningIncomeForensicsHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
  sourceReconciliationState = null,
}) {
  const toRows = (collection) => {
    if (!collection) return [];
    if (Array.isArray(collection)) {
      return collection
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const label = String(
            entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? ""
          ).trim();
          const amount = coerceNumber(
            entry.amount ?? entry.value ?? entry.ttm ?? entry.total
          );
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    if (typeof collection === "object") {
      return Object.entries(collection)
        .map(([key, value]) => {
          if (value && typeof value === "object") {
            const label = String(
              value.line_item ?? value.label ?? value.name ?? key ?? ""
            ).trim();
            const amount = coerceNumber(
              value.amount ?? value.value ?? value.ttm ?? value.total
            );
            if (!label || !Number.isFinite(amount)) return null;
            return { label, amount };
          }
          const amount = coerceNumber(value);
          const label = String(key ?? "").trim();
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    return [];
  };
  const incomeLinesRaw = Array.isArray(t12Payload?.income_lines)
    ? t12Payload.income_lines
    : t12Payload?.income_breakdown
    ? t12Payload.income_breakdown
    : Array.isArray(t12Payload?.line_items)
    ? t12Payload.line_items.filter(
        (entry) => String(entry?.category ?? "").trim().toLowerCase() === "income"
      )
    : [];
  const expenseLinesRaw = Array.isArray(t12Payload?.expense_lines)
    ? t12Payload.expense_lines
    : Array.isArray(t12Payload?.expense_breakdown)
    ? t12Payload.expense_breakdown
    : t12Payload?.expense_breakdown &&
      typeof t12Payload.expense_breakdown === "object"
    ? Object.entries(t12Payload.expense_breakdown).map(([label, amount]) => ({
        label,
        amount,
      }))
    : Array.isArray(t12Payload?.line_items)
    ? t12Payload.line_items.filter(
        (entry) => String(entry?.category ?? "").trim().toLowerCase() === "expense"
      )
    : [];
  const incomeLines = toRows(incomeLinesRaw)
    .filter(isEligiblePositiveIncomeDriver)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const expenseLines = toRows(expenseLinesRaw)
    .filter(isEligiblePositiveExpenseDriver)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const canonicalAnnualTotals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
  const annualInPlace = coerceNumber(canonicalAnnualTotals?.in_place?.value);
  const annualMarket = coerceNumber(canonicalAnnualTotals?.market?.value);
  const upsideCard =
    Number.isFinite(annualInPlace) &&
    Number.isFinite(annualMarket) &&
    annualMarket > annualInPlace &&
    annualInPlace > 0
      ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Revenue Upside Quantification</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Annual In-Place Rent</td><td>${formatCurrency(annualInPlace)}</td></tr><tr><td>Annual Market Rent (100% Occupancy)</td><td>${formatCurrency(annualMarket)}</td></tr><tr><td>Gross Rent Upside</td><td>${formatCurrency(annualMarket - annualInPlace)} (${(((annualMarket - annualInPlace) / annualInPlace) * 100).toFixed(1)}%)</td></tr></tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">All values document derived from uploaded rent roll. Market rents as stated in document.</p></div>`
      : "";
  if (incomeLines.length === 0 && expenseLines.length === 0) {
    // Lump-sum T12: no line items; return summary-level fallback card
    const egi = coerceNumber(t12Payload?.effective_gross_income);
    const opex = coerceNumber(t12Payload?.total_operating_expenses);
    const noi = coerceNumber(t12Payload?.net_operating_income);
    const summaryRows = [
      ["Effective Gross Income (TTM)", egi],
      ["Total Operating Expenses (TTM)", opex],
      ["Net Operating Income (TTM)", noi],
    ]
      .filter(([, v]) => Number.isFinite(v))
      .map(([label, v]) => `<tr><td>${label}</td><td>${formatCurrency(v)}</td></tr>`)
      .join("");
    if (!summaryRows) return "";
    return `<div class="card no-break"><p class="subsection-title">Income &amp; Expense Summary (Lump-Sum T12)</p><table><thead><tr><th>Line Item</th><th>Amount (TTM)</th></tr></thead><tbody>${summaryRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">No line-item detail available for this T12 format. All values are reported totals.</p></div>${upsideCard}`;
  }
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const incomeRowsHtml = incomeLines
    .map((row) => {
      const share =
        Number.isFinite(egi) && egi > 0 ? ` (${formatPercent1(row.amount / egi)})` : "";
      return `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(
        row.amount
      )}${escapeHtml(share)}</td></tr>`;
    })
    .join("");
  const expenseRowsHtml = expenseLines
    .map((row) => {
      const share =
        Number.isFinite(opex) && opex > 0 ? ` (${formatPercent1(row.amount / opex)})` : "";
      return `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(
        row.amount
      )}${escapeHtml(share)}</td></tr>`;
    })
    .join("");
  const topIncomeLineConcentration =
    Number.isFinite(egi) &&
    egi > 0 &&
    incomeLines.length > 0 &&
    Number.isFinite(incomeLines[0]?.amount)
      ? incomeLines[0].amount / egi
      : null;
  const concentrationExceedsEgi = Number.isFinite(topIncomeLineConcentration) && topIncomeLineConcentration > 1;
  const concentrationLineHtml = Number.isFinite(topIncomeLineConcentration)
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Top Income Line Compared with EGI</p><div style="font-size:11px;line-height:1.6;color:#374151;">${escapeHtml(
        formatPercent1(topIncomeLineConcentration)
      )}${concentrationExceedsEgi ? ` <span style="color:#6b7280;">(EGI is net of vacancy / credit-loss offsets)</span>` : ""}</div><div class="note">Largest eligible income line compared with Effective Gross Income after vacancy / credit-loss offsets.${concentrationExceedsEgi ? " Gross rental income may exceed EGI where vacancy, credit loss, or concessions reduce effective gross income." : ""}</div></div>`
    : "";
  let marketPremiumPct = null;
  const avgInPlace = coerceNumber(
    computedRentRoll?.avg_in_place_rent ?? rentRollPayload?.avg_in_place_rent
  );
  const avgMarket = coerceNumber(
    computedRentRoll?.avg_market_rent ?? rentRollPayload?.avg_market_rent
  );
  const explicitRentGap = coerceNumber(computedRentRoll?.rent_to_market_gap);
  if (Number.isFinite(explicitRentGap)) {
    marketPremiumPct = explicitRentGap * 100;
  } else if (Number.isFinite(avgInPlace) && Number.isFinite(avgMarket) && avgInPlace > 0) {
    marketPremiumPct = ((avgMarket - avgInPlace) / avgInPlace) * 100;
  }
  const marketRentPremiumRatio = Number.isFinite(marketPremiumPct)
    ? marketPremiumPct / 100
    : NaN;
  const sourceReconciliationRenderState = buildSourceReconciliationRenderState({
    sourceReconciliationState,
  });
  const rrVsGprPct = sourceReconciliationRenderState?.variance_pct ?? null;
  const rrVsGprDisplay = sourceReconciliationRenderState?.variance_display ?? null;
  const bullets = [];
  if (Number.isFinite(topIncomeLineConcentration) && topIncomeLineConcentration >= 0.85) {
    bullets.push(
      `Top income line concentration is ${formatPercent1(
        topIncomeLineConcentration
      )} of EGI${topIncomeLineConcentration > 1 ? " (EGI net of vacancy / credit-loss offsets)" : ""} (concentration flag).`
  );
}

  const otherIncome = incomeLines.find((row) => /other/i.test(row.label));
  if (
    otherIncome &&
    Number.isFinite(egi) &&
    egi > 0 &&
    Number.isFinite(otherIncome.amount / egi) &&
    otherIncome.amount / egi >= 0.05
  ) {
    bullets.push(
      `Other income represents ${formatPercent1(
        otherIncome.amount / egi
      )} of EGI (verify sustainability and recurring nature).`
    );
  }
  const largestExpense = expenseLines[0];
  if (
    largestExpense &&
    Number.isFinite(opex) &&
    opex > 0 &&
    Number.isFinite(largestExpense.amount / opex) &&
    largestExpense.amount / opex >= 0.2
  ) {
    bullets.push(
      `Largest operating expense line item is ${largestExpense.label} at ${formatPercent1(
        largestExpense.amount / opex
      )} of OpEx (concentration flag).`
    );
  }
  if (Number.isFinite(marketRentPremiumRatio) && marketRentPremiumRatio >= 0.10) {
    bullets.push(
      `In-place rents trail market by approximately ${formatPercent1(
        marketRentPremiumRatio
      )} (observed rent gap).`
    );
  }
  if (sourceReconciliationRenderState?.renderable && Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    bullets.push(
      `Rent Roll vs T12 GPR variance: ${rrVsGprDisplay}. See Data Coverage.`
    );
  }
  const bulletsHtml = [...new Set(bullets)]
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const bulletsCard = bulletsHtml
    ? `<div class="card no-break" style="margin-top:6px;"><ul>${bulletsHtml}</ul></div>`
    : "";
  const incomeCard = incomeRowsHtml
    ? `<div class="card no-break"><p class="subsection-title">Top Positive Income Lines Compared with EGI</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${incomeRowsHtml}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:6px;">Line-item comparisons use EGI as denominator; EGI is net of vacancy / credit-loss offsets.</p></div>`
    : "";
  const expenseCard = expenseRowsHtml
    ? `<div class="card no-break"><p class="subsection-title">Top Expense Drivers (share of OpEx)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${expenseRowsHtml}</tbody></table></div>`
    : "";
  const driverCards =
    incomeCard && expenseCard
      ? `<div class="grid-2-balanced">${incomeCard}${expenseCard}</div>`
      : incomeCard || expenseCard;
  return `${driverCards}${concentrationLineHtml}${bulletsCard}`;
}
function buildScreeningExpenseStructureHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
}) {
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const noi = coerceNumber(t12Payload?.net_operating_income);
  const units = coerceNumber(
    computedRentRoll?.total_units ?? rentRollPayload?.total_units
  );
  const rows = [];
  if (Number.isFinite(egi) && Number.isFinite(opex) && egi > 0) {
    const expenseRatio = opex / egi;
    rows.push(
      `<tr><td>Operating Expense Ratio</td><td>${formatPercent1(
        expenseRatio
      )}</td></tr>`
    );
  }
  if (Number.isFinite(opex) && Number.isFinite(units) && units > 0) {
    rows.push(
      `<tr><td>Operating Expense per Unit</td><td>${formatCurrency(
        opex / units
      )}</td></tr>`
    );
  }
  if (Number.isFinite(noi) && Number.isFinite(units) && units > 0) {
    rows.push(
      `<tr><td>NOI per Unit</td><td>${formatCurrency(noi / units)}</td></tr>`
    );
  }
  if (rows.length === 0) return "";
  const metricsCard = `<div class="card no-break"><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows.join(
    ""
  )}</tbody></table></div>`;
  const toExpenseRows = (source) => {
    if (Array.isArray(source)) {
      return source
        .map((entry) => {
          const label = String(
            entry?.line_item ?? entry?.label ?? entry?.name ?? entry?.item ?? ""
          ).trim();
          const amount = coerceNumber(
            entry?.amount_ttm ??
              entry?.ttm_amount ??
              entry?.annual_amount ??
              entry?.annual ??
              entry?.ytd ??
              entry?.total_amount ??
              entry?.amount ??
              entry?.value ??
              entry?.ttm ??
              entry?.total
          );
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    if (source && typeof source === "object") {
      return Object.entries(source)
        .map(([key, value]) => {
          const label = String(
            value?.line_item ?? value?.label ?? value?.name ?? value?.item ?? key ?? ""
          ).trim();
          const amount = coerceNumber(
            value?.amount_ttm ??
              value?.ttm_amount ??
              value?.annual_amount ??
              value?.annual ??
              value?.ytd ??
              value?.total_amount ??
              value?.amount ??
              value?.value ??
              value?.ttm ??
              value?.total ??
              value
          );
          if (!label || !Number.isFinite(amount)) return null;
          return { label, amount };
        })
        .filter(Boolean);
    }
    return [];
  };
  const expenseRowsFromExpenseLines = toExpenseRows(t12Payload?.expense_lines);
  const expenseRowsFromBreakdown = toExpenseRows(t12Payload?.expense_breakdown);
  const expenseRowsFromLineItems = toExpenseRows(
    Array.isArray(t12Payload?.line_items)
      ? t12Payload.line_items.filter(
          (entry) => String(entry?.category ?? "").trim().toLowerCase() === "expense"
        )
      : []
  );
  const allExpenseRows = (
    expenseRowsFromExpenseLines.length > 0
      ? expenseRowsFromExpenseLines
      : expenseRowsFromBreakdown.length > 0
      ? expenseRowsFromBreakdown
      : expenseRowsFromLineItems
  ).filter(isEligiblePositiveExpenseDriver);
  const totalOpEx = allExpenseRows.reduce((s, r) => s + r.amount, 0);
  const expenseDriverRows = allExpenseRows
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const flags = [];
  const expenseRatio =
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 ? opex / egi : null;
  if (Number.isFinite(expenseRatio) && expenseRatio >= 0.60) {
    flags.push("Operating expense ratio is sensitized (>= 55%) and elevated (> 60%).");
  }
  if (totalOpEx > 0 && expenseDriverRows.some((r) => r.amount / totalOpEx >= 0.30)) {
    flags.push("Top expense line exceeds 30% of OpEx (concentration risk).");
  }
  const flagsHtml = flags
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const rankedExpenseDrivers = allExpenseRows.map((row) => ({
    label: row.label,
    pct: totalOpEx > 0 ? (row.amount / totalOpEx) * 100 : NaN,
  }));
  const top3 = (rankedExpenseDrivers || [])
    .filter((x) => x && x.label && Number.isFinite(x.pct))
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
  const top3Html = top3.length >= 2
    ? `<div class="subsection-title" style="margin-top:10px;">Top 3 Expense Drivers</div><ol>${top3
        .map((x) => `<li>${escapeHtml(x.label)}: ${x.pct.toFixed(1)}%</li>`)
        .join("")}</ol>`
    : Number.isFinite(opex) && opex > 0
    ? `<div class="subsection-title" style="margin-top:10px;">Expense Drivers</div><p class="small" style="color:#64748b;font-style:italic;">No line-item expense detail available. Total Operating Expenses: ${formatCurrency(opex)}.</p>`
    : "";
  const hasExpenseFlagsCard = Boolean(flagsHtml) || Boolean(top3Html);
  const expenseFlagsCard = hasExpenseFlagsCard
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Expense Flags (Deterministic)</p>${flagsHtml ? `<ul>${flagsHtml}</ul>` : ""}${top3Html}</div>`
    : "";
  const expenseSensRows =
    Number.isFinite(egi) && egi > 0
      ? [0.50, 0.55, 0.60, 0.65, 0.70]
          .map((r) => {
            const impliedOpex = egi * r;
            const impliedNoi = egi - impliedOpex;
            return `<tr><td>${(r * 100).toFixed(0)}%</td><td>${formatCurrency(impliedOpex)}</td><td>${formatCurrency(impliedNoi)}</td></tr>`;
          })
          .join("")
      : "";
  const expenseSensCard = expenseSensRows
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Expense Ratio Sensitivity</p><table><thead><tr><th>Expense Ratio</th><th>Implied OpEx</th><th>Implied NOI</th></tr></thead><tbody>${expenseSensRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Anchored to reported EGI of ${formatCurrency(egi)}. Standardized threshold scenarios.</p></div>`
    : "";
  return `${metricsCard}${expenseFlagsCard}${expenseSensCard}`;
}
function buildScreeningNoiStabilityHtml({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
  sourceReconciliationState = null,
}) {
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const noi = coerceNumber(t12Payload?.net_operating_income);
  const rows = [];
  if (Number.isFinite(egi) && Number.isFinite(noi) && egi > 0) {
    const noiMargin = noi / egi;
    rows.push(
      `<tr><td>NOI Margin</td><td>${formatPercent1(noiMargin)}</td></tr>`
    );
  }
  if (Number.isFinite(egi) && Number.isFinite(opex) && egi > 0) {
    const expenseSensitivity = 1 - opex / egi;
    rows.push(
      `<tr><td>Expense Sensitivity</td><td>${formatPercent1(
        expenseSensitivity
      )}</td></tr>`
    );
  }
  if (Number.isFinite(opex) && Number.isFinite(egi) && egi > 0) {
    const breakEvenOcc = opex / egi;
    if (Number.isFinite(breakEvenOcc)) {
      rows.push(
        `<tr><td>Break-even Occupancy</td><td>${formatPercent1(
          breakEvenOcc
        )}</td></tr>`
      );
    }
  }
  const sourceReconciliationRenderState = buildSourceReconciliationRenderState({
    sourceReconciliationState,
  });
  let rrVsGprPct = sourceReconciliationRenderState?.variance_pct ?? null;
  const rrVsGprDisplay = sourceReconciliationRenderState?.variance_display ?? null;
  if (sourceReconciliationRenderState?.renderable) {
    rows.push(
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${rrVsGprDisplay}</td></tr>`
    );
  }
  if (rows.length === 0) return "";
  const noiMargin =
    Number.isFinite(noi) && Number.isFinite(egi) && egi > 0 ? noi / egi : null;
  const expenseRatio =
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 ? opex / egi : null;
  const flags = [];
  if (sourceReconciliationRenderState?.renderable && Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    flags.push(
      `Rent Roll vs T12 GPR variance: ${rrVsGprDisplay}. See Data Coverage.`
    );
  }
  if (Number.isFinite(noiMargin) && noiMargin < 0.35) {
    flags.push(`NOI margin is ${formatPercent1(noiMargin)} (thin margin flag).`);
  }
  if (Number.isFinite(expenseRatio) && expenseRatio > 0.65) {
    flags.push(
      `Expense ratio is ${formatPercent1(expenseRatio)} (high expense load flag).`
    );
  }
  const stabilityDrivers = [];
  if (Number.isFinite(noiMargin)) {
    stabilityDrivers.push({
      label: `NOI Margin ${formatPercent1(noiMargin)}`,
      severity: Math.max(0, 0.35 - noiMargin),
    });
  }
  if (Number.isFinite(expenseRatio)) {
    stabilityDrivers.push({
      label: `Expense Ratio ${formatPercent1(expenseRatio)}`,
      severity: Math.max(0, expenseRatio - 0.65),
    });
  }
  if (sourceReconciliationRenderState?.renderable) {
    stabilityDrivers.push({
      label: `Rent Roll vs T12 GPR ${rrVsGprDisplay}`,
      severity: Math.max(0, Math.abs(rrVsGprPct) - 0.05),
    });
  }
  const rankedDrivers = stabilityDrivers
    .filter((driver) => Number(driver?.severity) > 0)
    .slice()
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((d) => d.label);
  const stabilityWorstThree = Array.isArray(rankedDrivers)
    ? rankedDrivers.slice(0, 3)
    : [];
  const driverRankHtml = stabilityWorstThree.length
    ? `<p class="subsection-title">Stability Drivers (Worst 3)</p><ol>${stabilityWorstThree.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`
    : "";
  const uniqueFlags = [...new Set(flags)];
  const flagsHtml = uniqueFlags
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const screeningFlagsCard =
    driverRankHtml || flagsHtml
      ? `<div class="card no-break" style="margin-top:6px;">${driverRankHtml}${
          flagsHtml ? `<p class="subsection-title">Variance Flags (Deterministic)</p><ul>${flagsHtml}</ul>` : ""
        }</div>`
      : "";
  const rrTotalUnits = coerceNumber(
    computedRentRoll?.total_units ?? rentRollPayload?.total_units
  );
  const isPartialRentRollSample =
    computedRentRoll?.is_partial_sample === true ||
    rentRollPayload?.is_partial_sample === true;
  const rrOccupiedUnits = coerceNumber(
    computedRentRoll?.occupied_units ?? (isPartialRentRollSample ? null : rentRollPayload?.occupied_units)
  );
  let occupancy = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
  if (
    !Number.isFinite(occupancy) &&
    Number.isFinite(rrTotalUnits) &&
    rrTotalUnits > 0 &&
    Number.isFinite(rrOccupiedUnits)
  ) {
    occupancy = rrOccupiedUnits / rrTotalUnits;
  }
  if (!Number.isFinite(occupancy) && !isPartialRentRollSample) {
    occupancy = deriveOccFromRentRollUnits(rentRollPayload);
  }
  const sensitivityRows = [];
  if (Number.isFinite(egi) && Number.isFinite(noi) && Number.isFinite(opex)) {
    const noiCostShock = noi - 0.05 * opex;
    if (Number.isFinite(noiCostShock) && egi > 0) {
      sensitivityRows.push(
        `<tr><td>Expenses +5% (cost shock)</td><td>${formatCurrency(noiCostShock)}</td><td>${formatPercent1(noiCostShock / egi)}</td></tr>`
      );
    }
    const noiRevenueShock = noi - 0.05 * egi;
    const egiRevenueShock = egi * 0.95;
    if (Number.isFinite(noiRevenueShock) && egiRevenueShock > 0) {
      sensitivityRows.push(
        `<tr><td>Income -5% (revenue shock)</td><td>${formatCurrency(noiRevenueShock)}</td><td>${formatPercent1(noiRevenueShock / egiRevenueShock)}</td></tr>`
      );
    }
    const noiCombined = noi - 0.05 * opex - 0.05 * egi;
    const egiCombined = egi * 0.95;
    if (Number.isFinite(noiCombined) && egiCombined > 0) {
      sensitivityRows.push(
        `<tr><td>Combined Shock (-5% income, +5% expenses)</td><td>${formatCurrency(noiCombined)}</td><td>${formatPercent1(noiCombined / egiCombined)}</td></tr>`
      );
    }
  }
  const sensitivityCard = sensitivityRows.length
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">NOI Sensitivity (Deterministic)</p><table><thead><tr><th>Scenario</th><th>Implied NOI</th><th>NOI Margin (Implied)</th></tr></thead><tbody>${sensitivityRows.join(
        ""
      )}</tbody></table></div>`
    : "";
  let vacancyBufferCard = "";
  if (
    !isPartialRentRollSample &&
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 &&
    Number.isFinite(rrTotalUnits) && rrTotalUnits > 0 && Number.isFinite(occupancy)
  ) {
    const beOcc = opex / egi;
    const cushion = occupancy - beOcc;
    if (Number.isFinite(cushion) && cushion > 0) {
      const cushionUnits = Math.floor(cushion * rrTotalUnits);
      const vbRows = [
        `<tr><td>Break-even Occupancy</td><td>${formatPercent1(beOcc)}</td></tr>`,
        `<tr><td>Current Occupancy</td><td>${formatPercent1(occupancy)}</td></tr>`,
        `<tr><td>Occupancy Cushion</td><td>${(cushion * 100).toFixed(1)} pts</td></tr>`,
        `<tr><td>Units That Can Become Vacant</td><td>${cushionUnits} of ${Math.round(rrTotalUnits)}</td></tr>`,
      ].join("");
      vacancyBufferCard = `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Vacancy Buffer</p><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${vbRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">At current occupancy, the property can absorb ${cushionUnits} vacant unit${cushionUnits !== 1 ? "s" : ""} before reaching neutral cash flow. Break-even derived from reported T12 totals.</p></div>`;
    }
  }
  return `<div class="card no-break"><table><thead><tr><th>Indicator</th><th>Value</th></tr></thead><tbody>${rows.join(
    ""
  )}</tbody></table></div>${screeningFlagsCard}${sensitivityCard}${vacancyBufferCard}`;
}

function applyFinalSourceReconciliationRenderGuard(html, sourceReconciliationState = null) {
  const inputHtml = String(html || "");
  const renderState = buildSourceReconciliationRenderState({ sourceReconciliationState });
  const canonicalDisplay = renderState?.variance_display || null;
  const disclosure =
    renderState?.source_reconciliation_disclosure ||
    "InvestorIQ has not reconciled this variance and does not infer the cause.";
  const staleVarianceRegex = /-48\.0%/g;
  const snippetPatterns = [
    /Rent Roll vs T12 GPR Variance[^<\n]{0,160}/gi,
    /Rent roll annualized rent is[^<\n]{0,220}/gi,
    /Source reconciliation variance of[^<\n]{0,220}/gi,
  ];
  const displayPatterns = [
    /<tr[^>]*>\s*<td>\s*Rent Roll vs T12 GPR Variance\s*<\/td>\s*<td>\s*([+\-]?\d+(?:\.\d+)?)%\s*<\/td>\s*<\/tr>/gi,
    /Rent roll annualized rent is\s*([+\-]?\d+(?:\.\d+)?)%\s*vs\s*T12 GPR/gi,
    /Source reconciliation variance of\s*([+\-]?\d+(?:\.\d+)?)%\s*between rent roll and T12 gross potential rent requires review\./gi,
    /<li>\s*Rent Roll vs T12 GPR\s*([+\-]?\d+(?:\.\d+)?)%\s*<\/li>/gi,
  ];
  const extractSnippets = (text) =>
    snippetPatterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => match[0])).slice(0, 10);
  const extractVarianceDisplays = (text) =>
    displayPatterns.flatMap((pattern) => Array.from(text.matchAll(pattern), (match) => {
      const display = match[1];
      const numericDisplay = Number(display);
      return Number.isFinite(numericDisplay)
        ? `${numericDisplay >= 0 ? "+" : "-"}${Math.abs(numericDisplay).toFixed(1)}%`
        : null;
    }).filter(Boolean)).slice(0, 10);
  const matchedSnippetsBefore = extractSnippets(inputHtml);
  const matchedDisplaysBefore = extractVarianceDisplays(inputHtml);
  const staleMinus48CountBefore = (inputHtml.match(staleVarianceRegex) || []).length;

  let outputHtml = inputHtml;
  const normalizeOrRemove = (pattern, replacement) => {
    outputHtml = outputHtml.replace(pattern, replacement);
  };

  if (renderState?.renderable && canonicalDisplay) {
    normalizeOrRemove(
      /<tr><td>Rent Roll vs T12 GPR Variance<\/td><td>[^<]*<\/td><\/tr>/gi,
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${escapeHtml(canonicalDisplay)}</td></tr>`
    );
    normalizeOrRemove(
      /Rent Roll vs T12 GPR Variance\s*[+\-]?\d+(?:\.\d+)?%/gi,
      `Rent Roll vs T12 GPR Variance ${escapeHtml(canonicalDisplay)}`
    );
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR\.\s*InvestorIQ has not reconciled this variance and does not infer the cause\./gi,
      `Rent roll annualized rent is ${escapeHtml(canonicalDisplay)} vs T12 GPR. ${escapeHtml(disclosure)}`
    );
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR/gi,
      `Rent roll annualized rent is ${escapeHtml(canonicalDisplay)} vs T12 GPR`
    );
    normalizeOrRemove(
      /<li>\s*Rent Roll vs T12 GPR\s*[+\-]?\d+(?:\.\d+)?%\s*<\/li>/gi,
      `<li>Rent Roll vs T12 GPR ${escapeHtml(canonicalDisplay)}</li>`
    );
    normalizeOrRemove(
      /Source reconciliation variance of\s*[+\-]?\d+(?:\.\d+)?%\s*between rent roll and T12 gross potential rent requires review\./gi,
      `Source reconciliation variance of ${escapeHtml(canonicalDisplay)} between rent roll and T12 gross potential rent requires review.`
    );
  } else {
    normalizeOrRemove(/<tr><td>Rent Roll vs T12 GPR Variance<\/td><td>[^<]*<\/td><\/tr>/gi, "");
    normalizeOrRemove(/Rent Roll vs T12 GPR Variance\s*[+\-]?\d+(?:\.\d+)?%/gi, "");
    normalizeOrRemove(
      /Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR\.\s*InvestorIQ has not reconciled this variance and does not infer the cause\./gi,
      ""
    );
    normalizeOrRemove(/Rent roll annualized rent is\s*[+\-]?\d+(?:\.\d+)?%\s*vs\s*T12 GPR/gi, "");
    normalizeOrRemove(/<li>\s*Rent Roll vs T12 GPR\s*[+\-]?\d+(?:\.\d+)?%\s*<\/li>/gi, "");
    normalizeOrRemove(
      /Source reconciliation variance of\s*[+\-]?\d+(?:\.\d+)?%\s*between rent roll and T12 gross potential rent requires review\./gi,
      ""
    );
    normalizeOrRemove(
      /Source reconciliation variance of\s*[+\-]?\d+(?:\.\d+)?%\s*between rent roll and T12 gross potential rent requires review\./gi,
      ""
    );
  }

  let matchedSnippetsAfter = extractSnippets(outputHtml);
  let matchedDisplaysAfter = extractVarianceDisplays(outputHtml);
  let staleMinus48CountAfter = (outputHtml.match(staleVarianceRegex) || []).length;
  let changed = outputHtml !== inputHtml;
  const renderableDisplay = canonicalDisplay && renderState?.renderable;
  let displayMismatchAfter =
    renderableDisplay
      ? matchedDisplaysAfter.some((display) => display !== canonicalDisplay) ||
        matchedDisplaysAfter.length === 0 && (
          /Rent Roll vs T12 GPR Variance/i.test(outputHtml) ||
          /Rent roll annualized rent is/i.test(outputHtml) ||
          /Source reconciliation variance of/i.test(outputHtml)
        )
      : matchedDisplaysAfter.length > 0;
  if (displayMismatchAfter) {
    const fallbackHtml = outputHtml
      .replace(staleVarianceRegex, "")
      .replace(/<tr[^>]*>\s*<td>\s*Rent Roll vs T12 GPR Variance\s*<\/td>\s*<td>[\s\S]*?<\/td>\s*<\/tr>/gi, "")
      .replace(/Rent Roll vs T12 GPR Variance[^<\n]{0,160}/gi, "")
      .replace(/Rent roll annualized rent is[^<\n]{0,220}/gi, "")
      .replace(/Source reconciliation variance of[^<\n]{0,220}/gi, "");
    const fallbackMatchedSnippets = extractSnippets(fallbackHtml);
    const fallbackMatchedDisplays = extractVarianceDisplays(fallbackHtml);
    const fallbackStaleMinus48Count = (fallbackHtml.match(staleVarianceRegex) || []).length;
    const fallbackMismatch =
      renderableDisplay
        ? fallbackMatchedDisplays.some((display) => display !== canonicalDisplay) ||
          fallbackMatchedDisplays.length === 0 && (
            /Rent Roll vs T12 GPR Variance/i.test(fallbackHtml) ||
            /Rent roll annualized rent is/i.test(fallbackHtml) ||
            /Source reconciliation variance of/i.test(fallbackHtml)
          )
        : fallbackMatchedDisplays.length > 0;
    outputHtml = fallbackHtml;
    matchedSnippetsAfter = fallbackMatchedSnippets;
    matchedDisplaysAfter = fallbackMatchedDisplays;
    staleMinus48CountAfter = fallbackStaleMinus48Count;
    changed = outputHtml !== inputHtml;
    displayMismatchAfter = fallbackMismatch;
    if (displayMismatchAfter) {
      console.error("[investoriq] source_reconciliation_final_guard_postcheck_failed", {
        canonical_display: canonicalDisplay,
        renderable: Boolean(renderState?.renderable),
        matched_displays_before: matchedDisplaysBefore,
        matched_displays_after: matchedDisplaysAfter,
        matched_snippets_before: matchedSnippetsBefore,
        matched_snippets_after: matchedSnippetsAfter,
        stale_minus_48_count_before: staleMinus48CountBefore,
        stale_minus_48_count_after: staleMinus48CountAfter,
        replaced_or_suppressed: changed,
      });
    }
  }
  if (changed) {
    console.warn("[investoriq] source_reconciliation_final_guard", {
      canonical_display: canonicalDisplay,
      renderable: Boolean(renderState?.renderable),
      matched_displays_before: matchedDisplaysBefore,
      matched_displays_after: matchedDisplaysAfter,
      matched_snippets_before: matchedSnippetsBefore,
      matched_snippets_after: matchedSnippetsAfter,
      stale_minus_48_count_before: staleMinus48CountBefore,
      stale_minus_48_count_after: staleMinus48CountAfter,
      replaced_or_suppressed: true,
    });
  }
  return {
    html: outputHtml,
    render_state: renderState,
    matched_snippets_before: matchedSnippetsBefore,
    matched_snippets_after: matchedSnippetsAfter,
    matched_displays_before: matchedDisplaysBefore,
    matched_displays_after: matchedDisplaysAfter,
    stale_minus_48_count_before: staleMinus48CountBefore,
    stale_minus_48_count_after: staleMinus48CountAfter,
    replaced_or_suppressed: changed,
  };
}

function applyFinalSectionHealRenderGuards(
  html,
  {
    effectiveReportMode = null,
    reportType = null,
    currentDebtAssessmentState = null,
    mortgagePayload = null,
    loanTermSheetTermsPayload = null,
    financials = null,
    t12Payload = null,
    sourceReconciliationState = null,
  } = {}
) {
  let outputHtml = String(html || "");
  const acquisitionFinancingReadinessInputsUsable =
    String(effectiveReportMode || "").trim().toLowerCase() === "v1_core" &&
    (
      currentDebtAssessmentState?.has_proposed_acquisition_financing === true ||
      String(loanTermSheetTermsPayload?.debt_basis || "").toLowerCase().includes("acquisition") ||
      String(loanTermSheetTermsPayload?.semantic_doc_role || "").trim().toLowerCase() === "purchase_assumptions" ||
      (
        Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price)) &&
        (
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.stated_acquisition_loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.derived_acquisition_loan_amount)) ||
          Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.ltv))
        ) &&
        Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.interest_rate)) &&
        Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.amortization_years ?? loanTermSheetTermsPayload?.amort_years)) &&
        Number.isFinite(coerceNumber(t12Payload?.net_operating_income))
      )
    );
  const currentDebtNeedsHeal = Boolean(
    buildRefiDebtRenderState({
      currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      financials,
      t12Payload,
    })?.allowDebtMath !== true
  );
  if (effectiveReportMode === "screening_v1") {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_8_DEAL_SCORE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_ADV_MODEL");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_11_FINAL_RECS");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
  } else if (effectiveReportMode === "v1_core") {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_3_SCENARIO");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_3");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_5_RISK");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_6_RENOVATION");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_8_DEAL_SCORE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_9_DCF_TABLE");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_ADV_MODEL");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_DCF_SUMMARY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_10_COMPARABLE_CONTEXT");
    outputHtml = stripMarkedSection(outputHtml, "RELATIVE_POSITIONING");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_11_FINAL_RECS");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_DEAL_SCORE_BAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_EXPENSE_RATIO");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_EQUITY_COMPONENTS");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_BREAKEVEN");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_RISK_RADAR");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_CHART_RENOVATION");
    if (!acquisitionFinancingReadinessInputsUsable) {
      outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT");
    }
  }
  if (effectiveReportMode === "v1_core" || String(reportType || "").trim().length > 0) {
    outputHtml = stripMarkedSection(outputHtml, "SECTION_S6_RENOVATION");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
  }
  if (currentDebtNeedsHeal) {
    const currentDebtNotAssessedRenderCopy = currentDebtNotAssessedCopy({
      currentDebtState: currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Noi: coerceNumber(t12Payload?.net_operating_income),
    });
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_REFI_STABILITY");
    outputHtml = stripMarkedSection(outputHtml, "SECTION_7_DEBT_TABLES");
    outputHtml = stripMarkedSection(outputHtml, "EXEC_DSCR_CARD");
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">DSCR Sensitivity &amp; Coverage Threshold Analysis<\/p>[\s\S]*?<p class="small" style="margin-top:8px;">[\s\S]*?<\/p>/i,
      `<p class="small">${escapeHtml(currentDebtNotAssessedRenderCopy.explanation)}</p>`
    );
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">Refinance Stress Test &amp; Binding Constraint Analysis<\/p>[\s\S]*?<p>\s*\{\{DEBT_REFI_CONSIDERATIONS\}\}\s*<\/p>/i,
      ""
    );
    outputHtml = outputHtml.replace(
      /<p class="subsection-title">Current Debt Coverage &amp; Constraint Sensitivity<\/p>[\s\S]*?\{\{REFI_SENSITIVITY_MATRIX_BLOCK\}\}/i,
      ""
    );
    outputHtml = replaceAll(outputHtml, "{{DEBT_DSCR_NOTE}}", currentDebtNotAssessedRenderCopy.explanation);
    outputHtml = replaceAll(outputHtml, "{{DEBT_REFI_CONSIDERATIONS}}", currentDebtNotAssessedRenderCopy.explanation);
    outputHtml = replaceAll(outputHtml, "{{REFI_SENSITIVITY_MATRIX_BLOCK}}", "");
    outputHtml = outputHtml.replace(
      /<tr[^>]*>\s*<td[^>]*>\s*Current Debt DSCR\s*<\/td>[\s\S]*?<\/tr>/gi,
      ""
    );
    outputHtml = outputHtml.replace(
      /<div[^>]*>\s*<p class="subsection-title">Maximum Financing Envelope \(Standardized Framework\)<\/p>[\s\S]*?<\/div>/gi,
      ""
    );
  }
  if (sourceReconciliationState) {
    outputHtml = applyFinalSourceReconciliationRenderGuard(
      outputHtml,
      sourceReconciliationState
    ).html;
  }
  outputHtml = stripEmptyHeadingBlocks(outputHtml);
  return sanitizeFinalCustomerHtml(outputHtml);
}
function buildScreeningRentRollDistributionHtml({
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
}) {
  const isPartialRentRollSample =
    computedRentRoll?.is_partial_sample === true ||
    rentRollPayload?.is_partial_sample === true;
  const source =
    computedRentRoll && typeof computedRentRoll === "object"
      ? computedRentRoll
      : rentRollPayload && typeof rentRollPayload === "object"
      ? rentRollPayload
      : null;
  if (!source) return "";
  if (isPartialRentRollSample) return "";
  const payloadUnits = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : [];
  const payloadUnitMix = Array.isArray(rentRollPayload?.unit_mix) ? rentRollPayload.unit_mix : [];
  const computedUnitMix = Array.isArray(computedRentRoll?.unit_mix) ? computedRentRoll.unit_mix : [];
  const hasRowLevelSupport = payloadUnits.length > 0 || payloadUnitMix.length > 0 || computedUnitMix.length > 0;
  const canonicalAnnualTotals = resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
  const totalUnits = coerceNumber(source.total_units);
  const occupiedUnits = coerceNumber(source.occupied_units);
  let occupancy = coerceNumber(source.occupancy);
  if (
    !Number.isFinite(occupancy) &&
    Number.isFinite(occupiedUnits) &&
    Number.isFinite(totalUnits) &&
    totalUnits > 0
  ) {
    occupancy = occupiedUnits / totalUnits;
  }
  let totalInPlaceAnnual = coerceNumber(canonicalAnnualTotals?.in_place?.value ?? source.total_in_place_annual);
  if (!Number.isFinite(totalInPlaceAnnual)) {
    const inPlaceMonthly = coerceNumber(source.total_in_place_monthly);
    if (Number.isFinite(inPlaceMonthly)) totalInPlaceAnnual = inPlaceMonthly * 12;
  }
  let totalMarketAnnual = coerceNumber(canonicalAnnualTotals?.market?.value ?? source.total_market_annual);
  if (!Number.isFinite(totalMarketAnnual)) {
    const marketMonthly = coerceNumber(source.total_market_monthly);
    if (Number.isFinite(marketMonthly)) totalMarketAnnual = marketMonthly * 12;
  }
  const unitMix = Array.isArray(source.unit_mix) ? source.unit_mix : [];
  let weightedInPlace = null;
  let weightedMarket = null;
  if (unitMix.length > 0) {
    let sumCountInPlace = 0;
    let sumRentInPlace = 0;
    let sumCountMarket = 0;
    let sumRentMarket = 0;
    unitMix.forEach((row) => {
      const count = coerceNumber(row?.count);
      if (!Number.isFinite(count) || count <= 0) return;
      const currentRent = coerceNumber(row?.current_rent);
      const marketRent = coerceNumber(row?.market_rent);
      if (Number.isFinite(currentRent)) {
        sumCountInPlace += count;
        sumRentInPlace += count * currentRent;
      }
      if (Number.isFinite(marketRent)) {
        sumCountMarket += count;
        sumRentMarket += count * marketRent;
      }
    });
    if (sumCountInPlace > 0) weightedInPlace = sumRentInPlace / sumCountInPlace;
    if (sumCountMarket > 0) weightedMarket = sumRentMarket / sumCountMarket;
  }
  if (
    !Number.isFinite(weightedInPlace) &&
    Number.isFinite(totalInPlaceAnnual) &&
    Number.isFinite(totalUnits) &&
    totalUnits > 0
  ) {
    weightedInPlace = totalInPlaceAnnual / totalUnits / 12;
  }
  if (
    !Number.isFinite(weightedMarket) &&
    Number.isFinite(totalMarketAnnual) &&
    Number.isFinite(totalUnits) &&
    totalUnits > 0
  ) {
    weightedMarket = totalMarketAnnual / totalUnits / 12;
  }
  const metricsRows = [];
  if (Number.isFinite(totalUnits)) {
    metricsRows.push(`<tr><td>Total Units</td><td>${Math.round(totalUnits)}</td></tr>`);
  }
  if (Number.isFinite(occupiedUnits)) {
    metricsRows.push(
      `<tr><td>Occupied Units</td><td>${Math.round(occupiedUnits)}</td></tr>`
    );
  }
  if (Number.isFinite(occupancy)) {
    metricsRows.push(
      `<tr><td>Occupancy</td><td>${(occupancy * 100).toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%</td></tr>`
    );
  }
  if (Number.isFinite(weightedInPlace)) {
    metricsRows.push(
      `<tr><td>${hasRowLevelSupport ? "Weighted Avg In-Place Rent" : "Implied Avg In-Place Rent"}</td><td>${formatCurrency(
        weightedInPlace
      )}</td></tr>`
    );
  }
  if (Number.isFinite(weightedMarket)) {
    metricsRows.push(
      `<tr><td>${hasRowLevelSupport ? "Weighted Avg Market Rent" : "Implied Avg Market Rent"}</td><td>${formatCurrency(
        weightedMarket
      )}</td></tr>`
    );
  }
  if (
    Number.isFinite(weightedInPlace) &&
    Number.isFinite(weightedMarket) &&
    weightedInPlace > 0
  ) {
    const premiumPct = ((weightedMarket - weightedInPlace) / weightedInPlace) * 100;
    metricsRows.push(
      `<tr><td>Market Rent Gap (Avg)</td><td>${premiumPct.toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%</td></tr>`
    );
  }
  if (Number.isFinite(totalInPlaceAnnual)) {
    metricsRows.push(
      `<tr><td>Annual In-Place Rent (Total)</td><td>${formatCurrency(
        totalInPlaceAnnual
      )}</td></tr>`
    );
  }
  if (Number.isFinite(totalMarketAnnual)) {
    metricsRows.push(
      `<tr><td>Annual Market Rent (Total)</td><td>${formatCurrency(
        totalMarketAnnual
      )}</td></tr>`
    );
  }
  const totalInPlaceMonthly = Number.isFinite(totalInPlaceAnnual) ? totalInPlaceAnnual / 12 : null;
  const totalMarketMonthly = Number.isFinite(totalMarketAnnual) ? totalMarketAnnual / 12 : null;
  if (Number.isFinite(totalInPlaceMonthly)) {
    metricsRows.push(
      `<tr><td>Monthly In-Place Rent (Total)</td><td>${formatCurrency(totalInPlaceMonthly)}</td></tr>`
    );
  }
  if (Number.isFinite(totalMarketMonthly)) {
    metricsRows.push(
      `<tr><td>Monthly Market Rent (Total)</td><td>${formatCurrency(totalMarketMonthly)}</td></tr>`
    );
  }
  const rentBandRows = unitMix
    .map((row) => {
      const units = coerceNumber(row?.count);
      if (!Number.isFinite(units) || units <= 0) return "";
      const inPlace = coerceNumber(row?.current_rent);
      const market = coerceNumber(row?.market_rent);
      const inPlaceDisplay = Number.isFinite(inPlace) ? Math.round(inPlace) : null;
      const marketDisplay = Number.isFinite(market) ? Math.round(market) : null;
      const gap = Number.isFinite(inPlaceDisplay) && Number.isFinite(marketDisplay) ? marketDisplay - inPlaceDisplay : null;
      const gapPct =
        Number.isFinite(inPlace) &&
        Number.isFinite(market) &&
        inPlace > 0
          ? ((market - inPlace) / inPlace) * 100
          : null;
      return `<tr><td>${escapeHtml(String(row?.unit_type ?? ""))}</td><td>${Math.round(
        units
      )}</td><td>${
        Number.isFinite(inPlace) ? formatCurrency(inPlace) : ""
      }</td><td>${
        Number.isFinite(market) ? formatCurrency(market) : ""
      }</td><td>${
        Number.isFinite(gap) ? formatCurrency(gap) : ""
      }</td><td>${
        Number.isFinite(gapPct)
          ? `${gapPct.toLocaleString("en-CA", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}%`
          : ""
      }</td></tr>`;
    })
    .filter(Boolean)
    .join("");
  let largestUnitType = "";
  let largestUnitTypeConcentration = null;
  if (unitMix.length > 0 && Number.isFinite(totalUnits) && totalUnits > 0) {
    const largestMixRow = unitMix
      .map((row) => ({
        unitType: String(row?.unit_type ?? "").trim(),
        count: coerceNumber(row?.count),
      }))
      .filter((row) => Number.isFinite(row.count) && row.count > 0)
      .sort((a, b) => b.count - a.count)[0];
    if (largestMixRow) {
      largestUnitType = largestMixRow.unitType;
      largestUnitTypeConcentration = largestMixRow.count / totalUnits;
    }
  }
  if (metricsRows.length === 0 && !rentBandRows) return "";
  const metricsHtml =
    metricsRows.length > 0
      ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${metricsRows.join(
          ""
        )}</tbody></table>`
      : "";
  const bandsHtml = rentBandRows && hasRowLevelSupport
    ? `<p class="subsection-title" style="margin-top:6px;">Rent Bands (In-Place)</p><table><thead><tr><th>Unit Type</th><th>Units</th><th>Avg In-Place</th><th>Avg Market</th><th>Gap ($)</th><th>Gap (%)</th></tr></thead><tbody>${rentBandRows}</tbody></table>`
    : "";
  return `<div class="card no-break">${metricsHtml}${bandsHtml}</div>`;
}
function injectKeyMetricsRows(html, rowsHtml) {
  if (!rowsHtml) return html;
  const regex =
    /(<p class="label">Key Metrics Snapshot \(Base Case\)<\/p>[\s\S]*?<table>[\s\S]*?<tbody>)([\s\S]*?)(<\/tbody>)/;
  if (!regex.test(html)) return html;
  return html.replace(regex, `$1$2${rowsHtml}$3`);
}
// ---------- Dynamic Table Builders ----------
function buildUnitMixTable(rows = []) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Unit Type</th>
    <th>Count</th>
    <th>Average Sq Ft</th>
    <th>Current Avg Rent</th>
    <th>Documented Market Rent</th>
    <th>Monthly Rent Gap</th>
  </tr>
`;
  for (const row of rows) {
    const lift =
      !isNil(row.lift)
        ? row.lift
        : !isNil(row.targetRent) && !isNil(row.currentRent)
        ? Number(row.targetRent) - Number(row.currentRent)
        : null;
    html += `
  <tr>
    <td>${row.type ?? ""}</td>
    <td>${!isNil(row.count) ? row.count : ""}</td>
    <td>${!isNil(row.avgSqft) ? row.avgSqft : ""}</td>
    <td>${formatCurrency(row.currentRent)}</td>
    <td>${formatCurrency(row.targetRent)}</td>
    <td>${!isNil(lift) ? formatCurrency(lift) : ""}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function buildRenovationTable(rows = []) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Scope</th>
    <th>Approximate Cost per Unit</th>
    <th>Indicative Rent Lift</th>
    <th>Simple Payback</th>
  </tr>
`;
  for (const row of rows) {
    const monthlyLift = row.rentLift;
    const paybackYears =
      !isNil(row.simplePaybackYears)
        ? row.simplePaybackYears
        : !isNil(row.costPerSuite) &&
          !isNil(monthlyLift) &&
          Number(monthlyLift) !== 0
        ? Number(row.costPerSuite) / (Number(monthlyLift) * 12)
        : null;
    html += `
  <tr>
    <td>${row.scope ?? ""}</td>
    <td>${formatCurrency(row.costPerSuite)}</td>
    <td>${
      !isNil(monthlyLift)
        ? formatCurrency(monthlyLift, { prefix: "$", suffix: " per month" })
        : ""
    }</td>
    <td>${!isNil(paybackYears) ? formatYears(paybackYears) : ""}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function buildScenarioTable(rows = []) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Scenario</th>
    <th>Rent Growth</th>
    <th>Economic Vacancy</th>
    <th>Expense Growth</th>
    <th>Exit Cap Rate</th>
  </tr>
`;
  for (const row of rows) {
    html += `
  <tr>
    <td><span class="scenario-label">${row.name ?? ""}</span></td>
    <td>${formatPercent(row.rentGrowth)}</td>
    <td>${formatPercent(row.vacancy)}</td>
    <td>${formatPercent(row.expenseGrowth)}</td>
    <td>${formatPercent(row.exitCap)}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function buildReturnSummaryTable(rows = []) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Scenario</th>
    <th>Levered IRR</th>
    <th>Equity Multiple</th>
    <th>Scenario Sale Price</th>
  </tr>
`;
  for (const row of rows) {
    const salePriceText =
      row.salePriceText ||
      (!isNil(row.salePrice)
        ? formatCurrency(row.salePrice / 1_000_000, {
            prefix: "$",
            suffix: " million",
            decimals: 1,
          })
        : "");
    html += `
  <tr>
    <td>${row.name ?? ""}</td>
    <td>${formatPercent(row.irr)}</td>
    <td>${formatMultiple(row.equityMultiple, 2)}</td>
    <td>${salePriceText}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function buildCapitalPlanTable(rows = []) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Category</th>
    <th>Estimated Cost</th>
    <th>Share of Budget</th>
    <th>Primary Objective</th>
  </tr>
`;
  for (const row of rows) {
    html += `
  <tr>
    <td>${row.category ?? ""}</td>
    <td>${formatCurrency(row.estimatedCost)}</td>
    <td>${!isNil(row.shareOfBudget) ? formatPercent(row.shareOfBudget) : ""}</td>
    <td>${row.objective ?? ""}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function buildDealScoreTable(rows = [], totalScore) {
  if (!rows.length) return "";
  let html = `
<table>
  <tr>
    <th>Factor</th>
    <th>Score (1-10)</th>
    <th>Weight</th>
    <th>Weighted Contribution</th>
  </tr>
`;
  let total = 0;
  for (const row of rows) {
    const weighted = !isNil(row.weighted)
      ? row.weighted
      : !isNil(row.score) && !isNil(row.weight)
      ? (Number(row.score) * Number(row.weight)) / 10
      : null;
    if (!isNil(weighted)) total += Number(weighted);
    html += `
  <tr>
    <td>${row.factor ?? ""}</td>
    <td>${!isNil(row.score) ? row.score : ""}</td>
    <td>${
      !isNil(row.weight)
        ? formatPercent(row.weight, 0) // already in 0-1 form ideally
        : ""
    }</td>
    <td>${
      !isNil(weighted)
        ? weighted.toLocaleString("en-CA", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : ""
    }</td>
  </tr>
`;
  }
  const finalScore =
    !isNil(totalScore) && !isNaN(Number(totalScore))
      ? Number(totalScore)
      : total;
  html += `
  <tr>
    <th colspan="3">Total Deal Score</th>
    <th>${finalScore.toLocaleString("en-CA", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}</th>
  </tr>
</table>
`;
  return html;
}
function buildCompsTable(rows = []) {
  const meaningfulRows = (Array.isArray(rows) ? rows : []).filter((row) =>
    [row?.name, row?.submarket, row?.distanceKm, row?.units, row?.pricePerDoor, row?.capRate].some((value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
    )
  );
  if (!meaningfulRows.length) return "";
  let html = `
<table>
  <tr>
    <th>Comparable</th>
    <th>Submarket</th>
    <th>Approx. Distance</th>
    <th>Units</th>
    <th>Price per Door</th>
    <th>Cap Rate (Stabilized)</th>
  </tr>
`;
  for (const row of meaningfulRows) {
    html += `
  <tr>
    <td>${row.name ?? ""}</td>
    <td>${row.submarket ?? ""}</td>
    <td>${formatDistanceKm(row.distanceKm)}</td>
    <td>${!isNil(row.units) ? row.units : ""}</td>
    <td>${formatCurrency(row.pricePerDoor)}</td>
    <td>${formatPercent(row.capRate)}</td>
  </tr>
`;
  }
  html += `
</table>
`;
  return html;
}
function hasMeaningfulComparableRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).some((row) =>
    [row?.name, row?.submarket, row?.distanceKm, row?.units, row?.pricePerDoor, row?.capRate].some((value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
    )
  );
}
function buildRelativePositioningCopy(rows = []) {
  const meaningfulRows = (Array.isArray(rows) ? rows : []).filter((row) =>
    [row?.name, row?.submarket, row?.distanceKm, row?.units, row?.pricePerDoor, row?.capRate].some((value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
    )
  );
  if (!meaningfulRows.length) return "";
  const count = meaningfulRows.length;
  const submarkets = [...new Set(
    meaningfulRows
      .map((row) => String(row?.submarket || "").trim())
      .filter(Boolean)
  )];
  const submarketText = submarkets.length > 0 ? ` across ${submarkets.join(", ")}` : "";
  return `Relative positioning is based on ${count} supported comparable${count === 1 ? "" : "s"}${submarketText} and remains limited to the market context shown above.`;
}
// ---------- Chart Helper ----------
const CHART_BASE_URL =
  process.env.CHART_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://investoriq.tech");
// Default to inlining charts so the report always picks up the latest PNGs.
// Set INLINE_CHARTS=false in environments where you serve charts from a CDN.
const INLINE_CHARTS =
  process.env.INLINE_CHARTS === undefined
    ? true
    : process.env.INLINE_CHARTS === "true";
function chartVersion(filename) {
  try {
    const stat = fs.statSync(
      path.join(process.cwd(), "public", "charts", "institutional", filename)
    );
    return String(stat.mtime.getTime());
  } catch (err) {
    return String(Date.now());
  }
}
function chartUrl(filename) {
  const version = chartVersion(filename);
  return `${CHART_BASE_URL}/charts/institutional/${filename}?v=${version}`;
}
function inlineChart(filename, fallbackUrl) {
  if (!INLINE_CHARTS) return fallbackUrl;
  const imgPath = path.join(
    process.cwd(),
    "public",
    "charts",
    "institutional",
    filename
  );
  try {
    const b64 = fs.readFileSync(imgPath).toString("base64");
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.warn(`Inline chart missing (${filename}), using fallback URL`);
    return fallbackUrl;
  }
}
function applyChartPlaceholders(html, charts = {}) {
  const defaults = {
    renovationChartUrl: inlineChart("renovation_roi.png", chartUrl("renovation_roi.png")),
    cashflowChartUrl: inlineChart("cashflow_5yr.png", chartUrl("cashflow_5yr.png")),
    irrScenarioChartUrl: inlineChart("irr_scenario.png", chartUrl("irr_scenario.png")),
    riskRadarChartUrl: inlineChart("risk_radar.png", chartUrl("risk_radar.png")),
    dealScoreRadarChartUrl: inlineChart(
      "deal_score_radar.png",
      chartUrl("deal_score_radar.png")
    ),
    dealScoreBarChartUrl: inlineChart("deal_score_bar.png", chartUrl("deal_score_bar.png")),
    expenseRatioChartUrl: inlineChart("expense_ratio.png", chartUrl("expense_ratio.png")),
    equityComponentsChartUrl: inlineChart(
      "equity_return_components.png",
      chartUrl("equity_return_components.png")
    ),
    noiWaterfallChartUrl: inlineChart("noi_waterfall.png", chartUrl("noi_waterfall.png")),
    breakevenChartUrl: inlineChart(
      "break_even_occupancy.png",
      chartUrl("break_even_occupancy.png")
    ),
  };
  const merged = { ...defaults, ...(charts || {}) };
  let out = html;
  out = replaceAll(out, "{{RENOVATION_CHART_URL}}", merged.renovationChartUrl);
  out = replaceAll(out, "{{CASHFLOW_CHART_URL}}", merged.cashflowChartUrl);
  out = replaceAll(
    out,
    "{{IRR_SCENARIO_CHART_URL}}",
    merged.irrScenarioChartUrl
  );
  out = replaceAll(out, "{{RISK_RADAR_CHART_URL}}", merged.riskRadarChartUrl);
  out = replaceAll(
    out,
    "{{DEAL_SCORE_RADAR_CHART_URL}}",
    merged.dealScoreRadarChartUrl
  );
  out = replaceAll(
    out,
    "{{DEAL_SCORE_BAR_CHART_URL}}",
    merged.dealScoreBarChartUrl
  );
  out = replaceAll(
    out,
    "{{EXPENSE_RATIO_CHART_URL}}",
    merged.expenseRatioChartUrl
  );
  out = replaceAll(
    out,
    "{{EQUITY_COMPONENTS_CHART_URL}}",
    merged.equityComponentsChartUrl
  );
  out = replaceAll(
    out,
    "{{NOI_WATERFALL_CHART_URL}}",
    merged.noiWaterfallChartUrl
  );
  out = replaceAll(out, "{{BREAKEVEN_CHART_URL}}", merged.breakevenChartUrl);
  return out;
}

function buildRendererCanonicalState({
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
        has_annual_tax: isValidAnnualPropertyTaxValue(propertyTaxPayload?.annual_tax),
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
// ---------- Main Handler ----------
export default async function handler(req, res) {
  let effectiveUserId = null;
  try {
    const body = req.body || {};
    const isFullRenderHarness = body?.__test_return_final_html === true;
    const isAdminRegen = body?.admin_regen === true;
    if (isAdminRegen) {
      const internalKey = (process.env.INTERNAL_REGEN_KEY || "").trim();
      if (!internalKey) {
        return res
          .status(500)
          .json({ error: "Server misconfigured: missing INTERNAL_REGEN_KEY" });
      }
      const regenHeaderRaw = req.headers["x-internal-admin-regen"];
      const regenHeader = Array.isArray(regenHeaderRaw)
        ? regenHeaderRaw[0]
        : regenHeaderRaw;
      const provided = (typeof regenHeader === "string" ? regenHeader : "").trim();
      if (!provided || !constantTimeEqual(provided, internalKey)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }
    const adminRunKey = (process.env.ADMIN_RUN_KEY || "").trim();
    let headerKey = req.headers["x-admin-run-key"];
    if (Array.isArray(headerKey)) headerKey = headerKey[0];
    headerKey = (typeof headerKey === "string" ? headerKey : "").trim();
    if (!isAdminRegen) {
      if (!adminRunKey) {
        return res
          .status(500)
          .json({ error: "Server misconfigured: missing ADMIN_RUN_KEY" });
      }
      if (!headerKey || headerKey !== adminRunKey) {
        return res.status(401).json({
          error: "Unauthorized",
          hint: "bad admin key",
          has_header: Boolean(headerKey),
          env_key_len: adminRunKey.length,
          header_key_len: headerKey.length,
        });
      }
    }
    // 1. Parse input JSON (structured)
    const {
      userId: bodyUserId,
      property_name,
      property_address,
      property_title,
      supporting_documents = [],
    } = body;
    const jobId = body?.job_id || body?.jobId;
    effectiveUserId = bodyUserId || null;
    let jobReportType = null;
    let jobUserId = null;
    let jobPropertyName = null;
    if (jobId) {
      const { data: jobRow } = await supabase
        .from("analysis_jobs")
        .select("report_type, user_id, property_name")
        .eq("id", jobId)
        .maybeSingle();
      jobReportType = jobRow?.report_type || null;
      jobUserId = jobRow?.user_id || null;
      jobPropertyName = jobRow?.property_name || null;
      if (!effectiveUserId) {
        effectiveUserId = jobUserId;
      }
      if (!effectiveUserId) {
        return res.status(404).json({ error: "Job not found" });
      }
      if (jobUserId && effectiveUserId && jobUserId !== effectiveUserId) {
        return res.status(403).json({ error: "Job ownership mismatch" });
      }
    }
    if (isAdminRegen) {
      if (typeof jobId !== "string" || !jobId.trim()) {
        return res.status(400).json({ error: "job_id is required" });
      }
      if (!effectiveUserId) {
        if (!jobUserId) {
          return res.status(404).json({ error: "Job not found" });
        }
        effectiveUserId = jobUserId;
      }
    }
    const reportTypeResolution = resolveReportTypeAndTier({
      bodyReportType: body?.report_type ?? null,
      jobReportType: jobReportType ?? null,
    });
    if (!reportTypeResolution.ok) {
      return res.status(400).json({
        error: "Invalid report_type",
        report_type: reportTypeResolution.providedToken,
        normalized_report_type: reportTypeResolution.normalizedToken,
        allowed_report_types: reportTypeResolution.allowedTypes,
        supported_aliases: reportTypeResolution.supportedAliases,
      });
    }
    const reportType = reportTypeResolution.reportType;
    const effectiveReportMode = reportTypeResolution.effectiveReportMode;
    const reportTier = reportTypeResolution.reportTier;
    const allowAssumptions = reportTier >= 2;
    const nowIso = new Date().toISOString();
    const promptInstructions = [
      INVESTORIQ_MASTER_PROMPT_V71,
      ...(Array.isArray(body.instructions) ? body.instructions : []),
    ];
    if (!effectiveUserId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const sections = body.sections || {};
    if (promptInstructions.length > 0 && !isFullRenderHarness) {
      const safeTimestamp = nowIso.replace(/:/g, "-");
      const { error: promptEventErr } = await supabase
        .from("analysis_artifacts")
        .insert({
          job_id: jobId || null,
          user_id: effectiveUserId,
          type: "worker_event",
          bucket: "system",
          object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/prompt_version_applied/${safeTimestamp}.json`,
          payload: {
            event: "prompt_version_applied",
            prompt_key: "investoriq_master_prompt",
            prompt_version: "v7.1",
            timestamp: nowIso,
          },
        });
      if (promptEventErr) {
        console.error("Failed to log prompt_version_applied:", promptEventErr);
      }
    }
    // ------------------------------------------------------------------
// Sample-mode fallback: prevent unresolved {{TOKENS}} from crashing
// ------------------------------------------------------------------
    
    const tables = body.tables || {};
    const charts = body.charts || {};
    // Optional financials payload; falls back to sample values
    const financials = body.financials || {};
    const harnessPayloads = isFullRenderHarness && body?.__test_payloads && typeof body.__test_payloads === "object"
      ? body.__test_payloads
      : null;
    const harnessComputedRentRoll =
      harnessPayloads && harnessPayloads.computedRentRoll && typeof harnessPayloads.computedRentRoll === "object"
        ? harnessPayloads.computedRentRoll
        : null;
    const getSection = (key) => sections[key] || "";
    const getNarrativeHtml = (key) => {
      const html = sections?.[key] || "";
      return typeof html === "string" ? html : "";
    };
    let documentSourcesHtml = "";
    let documentSources = [];
    let rentRollPayload = null;
    let t12Payload = null;
    let mortgagePayload = null;
    let loanTermSheetTermsPayload = null;
    let acquisitionTermsPayload = null;
    let appraisalPayload = null;
    let appraisalCapRateBase = null;
    let propertyTaxPayload = null;
    if (harnessPayloads) {
      if (harnessPayloads.rentRollPayload !== undefined) rentRollPayload = harnessPayloads.rentRollPayload;
      if (harnessPayloads.t12Payload !== undefined) t12Payload = harnessPayloads.t12Payload;
      if (harnessPayloads.mortgagePayload !== undefined) mortgagePayload = harnessPayloads.mortgagePayload;
      if (harnessPayloads.loanTermSheetTermsPayload !== undefined) loanTermSheetTermsPayload = harnessPayloads.loanTermSheetTermsPayload;
      if (harnessPayloads.acquisitionTermsPayload !== undefined) acquisitionTermsPayload = harnessPayloads.acquisitionTermsPayload;
      if (harnessPayloads.propertyTaxPayload !== undefined) propertyTaxPayload = harnessPayloads.propertyTaxPayload;
      if (Array.isArray(harnessPayloads.documentSources)) {
        documentSources = harnessPayloads.documentSources;
        const items = harnessPayloads.documentSources
          .map((row) => {
            const name = escapeHtml(row?.original_filename || "Unnamed file");
            const uploadedAt = row?.uploaded_at
              ? new Date(row.uploaded_at).toLocaleString()
              : "Unknown date";
            return `<li>${name}  -  ${escapeHtml(uploadedAt)}</li>`;
          })
          .join("");
        documentSourcesHtml = `<ul>${items}</ul>`;
      }
    }
    if (jobId) {
      const { data: rentRollArtifact } = await supabase
        .from("analysis_artifacts")
        .select("payload")
        .eq("job_id", jobId)
        .eq("type", "rent_roll_parsed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      rentRollPayload = rentRollArtifact?.payload || null;
      const { data: t12Artifact } = await supabase
        .from("analysis_artifacts")
        .select("payload")
        .eq("job_id", jobId)
        .eq("type", "t12_parsed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      t12Payload = t12Artifact?.payload || null;
      if (effectiveReportMode === "v1_core") {
        const { data: mortgageArtifact } = await supabase
          .from("analysis_artifacts")
          .select("payload")
          .eq("job_id", jobId)
          .eq("type", "mortgage_statement_parsed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        // Mortgage statement
        const rawMortgagePayload = mortgageArtifact?.payload || null;
        mortgagePayload = hasUsableCurrentMortgagePayload(rawMortgagePayload) ? rawMortgagePayload : null;
        const { data: appraisalArtifacts } = await supabase
          .from("analysis_artifacts")
          .select("payload")
          .eq("job_id", jobId)
          .eq("type", "appraisal_parsed")
          .order("created_at", { ascending: false })
          .limit(10);
        const appraisalRows = Array.isArray(appraisalArtifacts) ? appraisalArtifacts : [];
        appraisalPayload = appraisalRows[0]?.payload || null;
        const usableAppraisalCapRateArtifact = appraisalRows.find((artifact) =>
          isFinitePositive(coerceNumber(artifact?.payload?.cap_rate))
        );
        appraisalCapRateBase = usableAppraisalCapRateArtifact?.payload?.cap_rate ?? null;
        const { data: propertyTaxArtifact } = await supabase
          .from("analysis_artifacts")
          .select("payload")
          .eq("job_id", jobId)
          .eq("type", "property_tax_parsed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        propertyTaxPayload = propertyTaxArtifact?.payload || null;
        const { data: loanTermSheetArtifacts } = await supabase
          .from("analysis_artifacts")
          .select("payload")
          .eq("job_id", jobId)
          .eq("type", "loan_term_sheet_parsed")
          .order("created_at", { ascending: false })
          .limit(10);
        const canonicalLoanSelection = resolveCanonicalLoanTermSheetArtifacts(loanTermSheetArtifacts || []);
        const canonicalCurrentDebtLoanPayload = canonicalLoanSelection.currentDebtPayload || null;
        acquisitionTermsPayload = canonicalLoanSelection.acquisitionPayload || null;
        loanTermSheetTermsPayload = hasDebtTermsPayload(canonicalCurrentDebtLoanPayload)
          ? canonicalCurrentDebtLoanPayload
          : null;
      }
      const { data: sourceRows, error: sourceErr } = await supabase
        .from("analysis_job_files")
        .select("original_filename, doc_type, parse_status, parse_error, uploaded_at")
        .eq("job_id", jobId)
        .order("uploaded_at", { ascending: true });
      if (!sourceErr && sourceRows && sourceRows.length > 0) {
        documentSources = sourceRows;
        const items = sourceRows
          .map((row) => {
            const name = escapeHtml(row.original_filename || "Unnamed file");
            const uploadedAt = row.uploaded_at
              ? new Date(row.uploaded_at).toLocaleString()
              : "Unknown date";
            return `<li>${name}  -  ${escapeHtml(uploadedAt)}</li>`;
          })
          .join("");
        documentSourcesHtml = `<ul>${items}</ul>`;
      }
    }
    let computedRentRoll = null;
    if (harnessComputedRentRoll) {
      computedRentRoll = harnessComputedRentRoll;
    }
    const rentRollUnits = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : null;
    if (rentRollUnits && rentRollUnits.length > 0) {
      const parsedTotalUnits = coerceNumber(rentRollPayload?.total_units);
      const totalUnits = Number.isFinite(parsedTotalUnits) && parsedTotalUnits > 0 ? parsedTotalUnits : rentRollUnits.length;
      const isPartialRentRollSample =
        Number.isFinite(parsedTotalUnits) &&
        parsedTotalUnits > 0 &&
        rentRollUnits.length > 0 &&
        parsedTotalUnits !== rentRollUnits.length;
      const rentRollSummaryTotals =
        rentRollPayload?.totals && typeof rentRollPayload.totals === "object"
          ? rentRollPayload.totals
          : null;
      const hasTrustedRentRollSummaryTotals =
        rentRollSummaryTotals?.summary_row_detected === true;
      const summaryOccupancy = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.occupancy)
        : null;
      const summaryInPlaceMonthly = hasTrustedRentRollSummaryTotals
        ? coerceNumber(
            rentRollSummaryTotals.in_place_rent_monthly ??
              rentRollSummaryTotals.current_rent_monthly
          )
        : null;
      const summaryMarketMonthly = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.market_rent_monthly)
        : null;
      const summaryInPlaceAnnual = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.in_place_rent_annual) ??
          (Number.isFinite(summaryInPlaceMonthly) ? summaryInPlaceMonthly * 12 : null)
        : null;
      const summaryMarketAnnual = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.market_rent_annual) ??
          (Number.isFinite(summaryMarketMonthly) ? summaryMarketMonthly * 12 : null)
        : null;
      const summaryAvgInPlaceRent = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.avg_in_place_rent)
        : null;
      const summaryAvgMarketRent = hasTrustedRentRollSummaryTotals
        ? coerceNumber(rentRollSummaryTotals.avg_market_rent)
        : null;
      const summaryRentToMarketGap =
        Number.isFinite(summaryInPlaceAnnual) &&
        Number.isFinite(summaryMarketAnnual) &&
        summaryInPlaceAnnual > 0 &&
        summaryMarketAnnual > summaryInPlaceAnnual
          ? (summaryMarketAnnual - summaryInPlaceAnnual) / summaryInPlaceAnnual
          : null;
      let occupiedUnits = 0;
      let vacantUnits = 0;
      const inPlaceRents = [];
      const marketRents = [];
      const unitMixMap = {};
      const rentByBeds = {};
      const marketRentByBeds = {};
      const sqftByBeds = {};
      for (const unit of rentRollUnits) {
        const statusText = String(unit?.status || "").toLowerCase();
        if (statusText) {
          if (statusText.includes("occup")) {
            occupiedUnits += 1;
          } else if (statusText.includes("vacant")) {
            vacantUnits += 1;
          }
        } else if (Number(unit?.in_place_rent) > 0) {
          occupiedUnits += 1;
        }
        const beds = coerceNumber(unit?.beds);
        const inPlaceRent = coerceNumber(unit?.in_place_rent);
        const marketRent = coerceNumber(unit?.market_rent);
        const sqft = coerceNumber(unit?.sqft);
        if (Number.isFinite(inPlaceRent)) {
          inPlaceRents.push(inPlaceRent);
        }
        if (Number.isFinite(marketRent)) {
          marketRents.push(marketRent);
        }
        const unitKey = Number.isFinite(beds)
          ? String(beds)
          : String(unit?.unit_type || "").trim() || null;
        if (unitKey) {
          unitMixMap[unitKey] = (unitMixMap[unitKey] || 0) + 1;
          if (Number.isFinite(inPlaceRent)) {
            if (!rentByBeds[unitKey]) {
              rentByBeds[unitKey] = [];
            }
            rentByBeds[unitKey].push(inPlaceRent);
          }
          if (Number.isFinite(marketRent)) {
            if (!marketRentByBeds[unitKey]) {
              marketRentByBeds[unitKey] = [];
            }
            marketRentByBeds[unitKey].push(marketRent);
          }
          if (Number.isFinite(sqft)) {
            if (!sqftByBeds[unitKey]) {
              sqftByBeds[unitKey] = [];
            }
            sqftByBeds[unitKey].push(sqft);
          }
        }
      }
      const occupancy =
        totalUnits > 0 && (occupiedUnits + vacantUnits > 0)
          ? occupiedUnits / totalUnits
          : null;
      const avgInPlaceRent =
        inPlaceRents.length > 0
          ? inPlaceRents.reduce((sum, value) => sum + value, 0) / inPlaceRents.length
          : null;
      const avgMarketRent =
        marketRents.length > 0
          ? marketRents.reduce((sum, value) => sum + value, 0) / marketRents.length
          : null;
      const totalInPlaceMonthly =
        inPlaceRents.length > 0 ? inPlaceRents.reduce((sum, value) => sum + value, 0) : null;
      const totalMarketMonthly =
        marketRents.length > 0 ? marketRents.reduce((sum, value) => sum + value, 0) : null;
      const totalInPlaceAnnual =
        totalInPlaceMonthly !== null ? totalInPlaceMonthly * 12 : null;
      const totalMarketAnnual =
        totalMarketMonthly !== null ? totalMarketMonthly * 12 : null;
      const resolvedAnnualTotals = resolveCanonicalRentRollAnnualTotals({
        computedRentRoll: {
          total_units: totalUnits,
          units: rentRollUnits,
          unit_mix: [],
          summary_row_detected: hasTrustedRentRollSummaryTotals,
          total_in_place_annual: totalInPlaceAnnual,
          total_market_annual: totalMarketAnnual,
        },
        rentRollPayload: {
          total_units: totalUnits,
          units: rentRollUnits,
          unit_mix: [],
          totals: rentRollSummaryTotals,
        },
      });
      const suppressSampledAnnualTotals = isPartialRentRollSample && !hasTrustedRentRollSummaryTotals;
      const resolvedInPlaceAnnual = suppressSampledAnnualTotals ? null : resolvedAnnualTotals?.in_place?.value ?? null;
      const resolvedMarketAnnual = suppressSampledAnnualTotals ? null : resolvedAnnualTotals?.market?.value ?? null;
      const resolvedInPlaceMonthly = Number.isFinite(resolvedInPlaceAnnual)
        ? resolvedInPlaceAnnual / 12
        : null;
      const resolvedMarketMonthly = Number.isFinite(resolvedMarketAnnual)
        ? resolvedMarketAnnual / 12
        : null;
      const unitMix = Object.entries(unitMixMap)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([bedKey, count]) => {
          const inPlaceValues = rentByBeds[bedKey] || [];
          const marketValues = marketRentByBeds[bedKey] || [];
          const sqftValues = sqftByBeds[bedKey] || [];
          const avgInPlaceRent =
            inPlaceValues.length > 0
              ? inPlaceValues.reduce((sum, value) => sum + value, 0) / inPlaceValues.length
              : null;
          const avgMarketRent =
            marketValues.length > 0
              ? marketValues.reduce((sum, value) => sum + value, 0) / marketValues.length
              : null;
          const avgSqft =
            sqftValues.length > 0
              ? sqftValues.reduce((sum, value) => sum + value, 0) / sqftValues.length
              : null;
          return {
            unit_type: bedKey === "0" ? "Studio" : /^\d+$/.test(bedKey) ? `${bedKey} Bed` : bedKey,
            count,
            current_rent: Number.isFinite(avgInPlaceRent) ? avgInPlaceRent : null,
            market_rent: Number.isFinite(avgMarketRent) ? avgMarketRent : null,
            avg_sqft: Number.isFinite(avgSqft) ? Math.round(avgSqft) : null,
          };
        });
      computedRentRoll = {
        total_units: totalUnits,
        occupied_units: isPartialRentRollSample ? null : occupiedUnits,
        vacant_units: isPartialRentRollSample ? null : vacantUnits,
        occupancy: Number.isFinite(summaryOccupancy) ? summaryOccupancy : isPartialRentRollSample ? null : occupancy,
        avg_in_place_rent: Number.isFinite(summaryAvgInPlaceRent) ? summaryAvgInPlaceRent : avgInPlaceRent ?? DATA_NOT_AVAILABLE,
        avg_market_rent: Number.isFinite(summaryAvgMarketRent) ? summaryAvgMarketRent : avgMarketRent ?? DATA_NOT_AVAILABLE,
        total_in_place_monthly: Number.isFinite(resolvedInPlaceMonthly) ? resolvedInPlaceMonthly : isPartialRentRollSample ? DATA_NOT_AVAILABLE : DATA_NOT_AVAILABLE,
        total_market_monthly: Number.isFinite(resolvedMarketMonthly) ? resolvedMarketMonthly : isPartialRentRollSample ? DATA_NOT_AVAILABLE : DATA_NOT_AVAILABLE,
        total_in_place_annual: Number.isFinite(resolvedInPlaceAnnual) ? resolvedInPlaceAnnual : isPartialRentRollSample ? DATA_NOT_AVAILABLE : DATA_NOT_AVAILABLE,
        total_market_annual: Number.isFinite(resolvedMarketAnnual) ? resolvedMarketAnnual : isPartialRentRollSample ? DATA_NOT_AVAILABLE : DATA_NOT_AVAILABLE,
        rent_to_market_gap: Number.isFinite(resolvedInPlaceAnnual) && Number.isFinite(resolvedMarketAnnual) && resolvedInPlaceAnnual > 0 && resolvedMarketAnnual > resolvedInPlaceAnnual
          ? (resolvedMarketAnnual - resolvedInPlaceAnnual) / resolvedInPlaceAnnual
          : Number.isFinite(summaryRentToMarketGap) ? summaryRentToMarketGap : null,
        is_partial_sample: isPartialRentRollSample,
        summary_row_detected: hasTrustedRentRollSummaryTotals,
        unit_mix: unitMix,
      };
    }
    const rentRollUnitMixRows =
      computedRentRoll?.unit_mix && computedRentRoll.unit_mix.length > 0
        ? computedRentRoll.unit_mix.map((row) => ({
            type: row.unit_type,
            count: row.count,
            avgSqft: row.avg_sqft,
            currentRent: row.current_rent,
            targetRent: row.market_rent,
          }))
        : null;
    const payloadUnits = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : [];
    const payloadUnitMix = Array.isArray(rentRollPayload?.unit_mix) ? rentRollPayload.unit_mix : [];
    const computedUnitMix = Array.isArray(computedRentRoll?.unit_mix) ? computedRentRoll.unit_mix : [];
    const hasRentRollRowLevelSupport =
      payloadUnits.length > 0 || payloadUnitMix.length > 0 || computedUnitMix.length > 0;
    const summaryTotals = rentRollPayload?.totals && typeof rentRollPayload.totals === "object"
      ? rentRollPayload.totals
      : null;
    const summaryOnlyRentRollSurface =
      hasRentRollRowLevelSupport === false &&
      Number.isFinite(coerceNumber(summaryTotals?.in_place_rent_annual ?? summaryTotals?.in_place_rent_monthly)) &&
      Number.isFinite(coerceNumber(summaryTotals?.market_rent_annual ?? summaryTotals?.market_rent_monthly));
    // 2. Load the HTML template (SACRED MASTER COPY)
    const templatePath = path.join(__dirname, "report-template-runtime.html");
    let htmlTemplate = fs.readFileSync(templatePath, "utf8");
    // 3. Inject property identity
    let finalHtml = htmlTemplate;
    const propertyName = property_name || jobPropertyName || "";
    const propertyAddress = property_address || "";
    const propertyTitle = property_title || "";
    const displayPropertyName =
      sanitizePropertyNameDisplayText(propertyName)?.trim() || "Property";
    const displayPropertyAddress = (sanitizeDisplayText(propertyAddress) || "").replace(/\s+,/g, ",");
    const displayPropertyTitle = sanitizeDisplayText(propertyTitle) || "";
    const propertyNameDisplay = displayPropertyName
      .replace(/\s{2,}/g, " ")
      .replace(/\s+,/g, ",")
      .trim();
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_NAME}}", propertyNameDisplay);
    finalHtml = replaceAll(finalHtml, "{{REPORT_DATE}}", new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }));
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_ADDRESS}}", displayPropertyAddress);
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_ADDRESS_LINE}}", displayPropertyAddress);
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_TITLE}}", displayPropertyTitle);
    finalHtml = replaceAll(finalHtml, "{{CITY}}", "");
    finalHtml = replaceAll(finalHtml, "{{PROVINCE}}", "");
    // Strip the preceding separator together with the token when submarket is empty
    finalHtml = finalHtml.replace(/\s*\|\s*\{\{PROPERTY_SUBMARKET\}\}/g, "");
    // Strip "{{PROPERTY_SUBMARKET}} Location Review" subtitle when submarket is empty
    finalHtml = finalHtml.replace(/\{\{PROPERTY_SUBMARKET\}\}\s+Location Review/g, "Location Overview");
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_SUBMARKET}}", "");
    finalHtml = finalHtml.replace(/\(\s*,\s*\)/g, "");
    // 4. Inject key financial metrics
    finalHtml = replaceAll(
      finalHtml,
      "{{PURCHASE_PRICE}}",
      formatCurrency(financials.purchasePrice) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{TOTAL_PROJECT_COST}}",
      formatCurrency(financials.totalProjectCost) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{EQUITY_REQUIRED}}",
      formatCurrency(financials.equityRequired) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{CAP_RATE_ON_COST}}",
      formatPercent(financials.capRateOnCost) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{LEVERED_IRR}}",
      formatPercent(financials.leveredIrr) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{EQUITY_MULTIPLE}}",
      formatMultiple(financials.equityMultiple, 2) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{YEAR1_COC}}",
      formatPercent(financials.year1CoC) || DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{ESTIMATES_DISCLOSURE}}",
      effectiveReportMode === "screening_v1"
        ? "InvestorIQ screening outputs are document-backed and framework-constrained, using uploaded documents and standardized underwriting frameworks. When required inputs are missing, those outputs are omitted rather than inferred."
        : "InvestorIQ acquisition memo outputs are document-backed and framework-constrained, using uploaded documents and standardized underwriting frameworks. When required inputs are missing, those outputs are omitted rather than inferred."
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{METHODOLOGY_NOTES}}",
      "Metrics and tables reflect document-backed inputs, deterministic calculations, and framework-constrained outputs. Missing source data is not gap-filled."
    );
    finalHtml = finalHtml.replace(
      /<h3>\s*InvestorIQ Estimates\s*<\/h3>/g,
      effectiveReportMode === "screening_v1"
        ? "<h3>Document-Backed Screening Outputs</h3>"
        : "<h3>Document-Backed Acquisition Memo Outputs</h3>"
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{LIMITATIONS_NOTES}}",
      "This memorandum is limited to the documents provided and the fields that could be verified. Missing values are disclosed and excluded from analysis."
    );
    finalHtml = replaceAll(
  finalHtml,
  "{{ASSUMPTIONS_DISCLOSURE}}",
  allowAssumptions
    ? "Assumptions in this memorandum are permitted only when anchored to uploaded documents or standardized underwriting frameworks. Unverified inputs are excluded; no synthetic values are introduced into deterministic outputs."
    : "Outputs are document-backed and framework-constrained. Missing inputs are not inferred."
);
const rentPositioningSectionLabel = resolveRentPositioningSectionTitle({
  effectiveReportMode,
  summaryOnlyRentRollSurface,
});
finalHtml = replaceAll(finalHtml, "{{UNIT_POSITIONING_SECTION_TITLE}}", rentPositioningSectionLabel.title);
finalHtml = replaceAll(finalHtml, "{{UNIT_POSITIONING_SECTION_SUBTITLE}}", rentPositioningSectionLabel.subtitle);
    if (effectiveReportMode === "screening_v1") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_ADV_MODEL");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_11_FINAL_RECS");
      finalHtml = stripMarkedSection(finalHtml, "EXEC_DSCR_CARD");
      finalHtml = stripMarkedSection(finalHtml, "T12_INCOME_TABLE");
      finalHtml = stripMarkedSection(finalHtml, "T12_EXPENSE_TABLE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_0_6_ACQUISITION_MEMO_SUMMARY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_0_7_OPERATING_SNAPSHOT");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_1_RENT_UPSIDE_VALUE_SENSITIVITY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_2_CAP_RATE_VALUE_INDICATION");
    } else {
      // v1_core: keep S2-S5 and S7 because they contain computed T12/rent roll data
      // relevant for underwriting. Only strip S6 (screening-specific refi sufficiency
      // check, replaced by the full Refi Stability Classification section).
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
      finalHtml = stripMarkedSection(finalHtml, "EXEC_DSCR_CARD");
    }
    // 5. Inject dynamic tables (fall back to blank if not provided)
    finalHtml = replaceAll(
      finalHtml,
      "{{UNIT_MIX_TABLE}}",
      buildUnitMixTable(rentRollUnitMixRows || tables.unitMix || [])
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_TABLE}}",
      buildRenovationTable(tables.renovationSummary || [])
    );
    // For v1_core, SCENARIO_TABLE and DEAL_SCORE_TABLE are built from computed document metrics
    // below and replaced in the v1_core block. Skip the early (empty) replacement here.
    if (effectiveReportMode !== "v1_core") {
      finalHtml = replaceAll(
        finalHtml,
        "{{SCENARIO_TABLE}}",
        buildScenarioTable(tables.scenarios || [])
      );
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{RETURN_SUMMARY_TABLE}}",
      buildReturnSummaryTable(tables.returnSummary || [])
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{CAPITAL_PLAN_TABLE}}",
      buildCapitalPlanTable(tables.capitalPlan || [])
    );
    if (effectiveReportMode !== "v1_core") {
      // LEGACY BYPASS REMOVED: do not source DEAL_SCORE_TABLE from tables.dealScore.
      // Canonical owner is buildDealScorecardState in v1_core path.
      finalHtml = replaceAll(finalHtml, "{{DEAL_SCORE_TABLE}}", "");
      // These tokens are only populated in v1_core; clear for screening
      finalHtml = replaceAll(finalHtml, "{{DEAL_SCORE_INLINE_CHART}}", "");
      finalHtml = replaceAll(finalHtml, "{{DEAL_SCORE_INTERPRETATION_HTML}}", "");
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{COMPARABLES_TABLE}}",
      buildCompsTable(tables.comps || [])
    );
    // 6. Inject charts (URLs  -  can be overridden by caller)
    finalHtml = applyChartPlaceholders(finalHtml, charts);
    const radarMatch = finalHtml.match(
      /<img[^>]*class="chart-img chart-img--deal-score-radar"[^>]*src="([^"]*)"/i
    );
    const radarHtml = radarMatch?.[1] || "";
    let radarSectionHtml = "present";
    if (!radarHtml || radarHtml.trim() === "") {
      radarSectionHtml = "";
    }
    if (radarSectionHtml === "") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
    }
    // 7. Inject ALL narrative sections (12)
    const {
      currentDebtAssessmentState: canonicalCurrentDebtAssessmentState,
      sourceReportCoverageQa,
      sourceReconciliationState,
      sectionEligibility: canonicalSectionEligibility,
      underwritingState: canonicalUnderwritingState,
    } = buildRendererCanonicalState({
      computedRentRoll,
      rentRollPayload,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Payload,
      appraisalPayload,
      propertyTaxPayload,
      reportMode: effectiveReportMode,
      reportType,
    });
    let sectionEligibility = canonicalSectionEligibility;
    let underwritingState = canonicalUnderwritingState;
    if (
      isFullRenderHarness &&
      harnessPayloads &&
      harnessPayloads.sectionEligibility &&
      typeof harnessPayloads.sectionEligibility === "object"
    ) {
      sectionEligibility = harnessPayloads.sectionEligibility;
      if (underwritingState && typeof underwritingState === "object") {
        underwritingState = {
          ...underwritingState,
          core: {
            ...(underwritingState.core || {}),
            sections: {
              ...((underwritingState.core || {}).sections || {}),
              eligibilityState: harnessPayloads.sectionEligibility,
            },
          },
        };
      }
    }
    const currentDebtAssessmentState =
      underwritingState?.core?.currentDebt?.assessmentState || canonicalCurrentDebtAssessmentState;
    const propertyTaxBindingState =
      underwritingState?.core?.documentTreatment?.propertyTaxBindingState || null;
    const sharedRefiDebtRenderState =
      underwritingState?.core?.currentDebt?.refiRenderState ||
      buildRefiDebtRenderState({
        currentDebtAssessmentState,
        mortgagePayload,
        loanTermSheetTermsPayload,
        financials,
        t12Payload,
      });
    const rentRollAnnualTotals =
      sourceReconciliationState?.rent_roll_annual_totals ||
      resolveCanonicalRentRollAnnualTotals({ computedRentRoll, rentRollPayload });
    const hasVerifiedCurrentDebtBalance = Boolean(currentDebtAssessmentState?.has_true_current_debt_balance);
    let documentQuantitativeUsageMap = buildDocumentQuantitativeUsageMap({
      effectiveReportMode,
      currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
    });
    const renderCanonicalDscrDirect = coerceNumber(currentDebtAssessmentState?.current_debt_dscr);
    const renderCanonicalAnnualDebtService = coerceNumber(currentDebtAssessmentState?.current_debt_annual_debt_service);
    const renderCanonicalNoi = coerceNumber(t12Payload?.net_operating_income);
    const renderCanonicalDscrDerived =
      Number.isFinite(renderCanonicalAnnualDebtService) &&
      renderCanonicalAnnualDebtService > 0 &&
      Number.isFinite(renderCanonicalNoi) &&
      renderCanonicalNoi > 0
        ? renderCanonicalNoi / renderCanonicalAnnualDebtService
        : null;
    const renderCanonicalDscr =
      Number.isFinite(renderCanonicalDscrDirect) && renderCanonicalDscrDirect > 0
        ? renderCanonicalDscrDirect
        : renderCanonicalDscrDerived;
    const hasComputedCurrentDebtDscr =
      String(currentDebtAssessmentState?.current_debt_dscr_status || "").trim().toLowerCase() === "computed" &&
      Number.isFinite(renderCanonicalDscr) &&
      renderCanonicalDscr > 0;
    const execMetricsParts = [];
    const execUnits = coerceNumber(
      computedRentRoll?.total_units ??
        rentRollPayload?.total_units ??
        rentRollPayload?.totals?.total_units
    );
    const execEgi = coerceNumber(t12Payload?.effective_gross_income);
    const execOpex = coerceNumber(t12Payload?.total_operating_expenses);
    const execNoi = coerceNumber(t12Payload?.net_operating_income);
    const execGpr = resolveCanonicalT12GprValue(t12Payload);
    const execOccFromT12 =
      coerceNumber(t12Payload?.physical_occupancy) ??
      coerceNumber(t12Payload?.economic_occupancy) ??
      coerceNumber(t12Payload?.occupancy);
    const rentRollIsPartialSample =
      computedRentRoll?.is_partial_sample === true ||
      rentRollPayload?.is_partial_sample === true;
    const rrTotalUnits =
      coerceNumber(computedRentRoll?.total_units) ??
      coerceNumber(rentRollPayload?.totals?.total_units);
    const rrOccupiedUnits =
      coerceNumber(computedRentRoll?.occupied_units) ??
      coerceNumber(rentRollPayload?.totals?.occupied_units);
    const canonicalExecOccupancy = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
    const execOccFromRR =
      !rentRollIsPartialSample && Number.isFinite(rrTotalUnits) && rrTotalUnits > 0 && Number.isFinite(rrOccupiedUnits)
        ? rrOccupiedUnits / rrTotalUnits
        : null;
    const rrUnitRows = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : [];
    const rrTotalUnitsFromRows = rrUnitRows.length > 0 ? rrUnitRows.length : null;
    const rrOccupiedFromRows = rrUnitRows.length
      ? rrUnitRows.reduce((acc, u) => {
          const status = String(u?.lease_status || u?.status || "").toLowerCase();
          const rent = Number(u?.in_place_rent ?? u?.current_rent ?? u?.rent);
          if (status.includes("vacant")) return acc;
          if (Number.isFinite(rent) && rent > 0) return acc + 1;
          return acc;
        }, 0)
      : null;
    const rrOccFromRows =
      Number.isFinite(rrTotalUnitsFromRows) &&
      rrTotalUnitsFromRows > 0 &&
      Number.isFinite(rrOccupiedFromRows)
        ? rrOccupiedFromRows / rrTotalUnitsFromRows
        : null;
    const rrAnnualInPlaceFromRows = rrUnitRows.length
      ? rrUnitRows.reduce((acc, u) => {
          const rent = Number(u?.in_place_rent ?? u?.current_rent ?? u?.rent);
          return Number.isFinite(rent) && rent > 0 ? acc + rent * 12 : acc;
        }, 0)
      : null;
    let execOccupancy =
      Number.isFinite(execOccFromT12)
        ? execOccFromT12
      : Number.isFinite(canonicalExecOccupancy)
        ? canonicalExecOccupancy
      : Number.isFinite(execOccFromRR)
        ? execOccFromRR
        : rentRollIsPartialSample ? null : rrOccFromRows;
    if (!Number.isFinite(execOccupancy) && !rentRollIsPartialSample) {
      const rrUnits = rentRollPayload?.units;
      if (Array.isArray(rrUnits) && rrUnits.length > 0) {
        const totalUnits = rrUnits.length;
        const occupiedUnits = rrUnits.filter((u) => {
          const status = (u.status || u.unit_status || "").toString().toLowerCase().trim();
          const hasStatus = status.length > 0 && status !== "null" && status !== "undefined";
          if (hasStatus) return status.includes("occupied");
          return Number(u.in_place_rent) > 0;
        }).length;
        if (totalUnits > 0 && occupiedUnits >= 0) {
          const derivedOcc = occupiedUnits / totalUnits;
          if (Number.isFinite(derivedOcc)) {
            execOccupancy = derivedOcc;
          }
        }
      }
    }
    const execAnnualInPlace = coerceNumber(
      computedRentRoll?.annual_in_place_rent ??
        computedRentRoll?.annual_in_place_rent_total ??
        computedRentRoll?.annual_current_rent ??
        computedRentRoll?.in_place_rent_annual ??
        (rentRollIsPartialSample ? null : rrAnnualInPlaceFromRows) ??
        rentRollAnnualTotals?.in_place?.value ??
        rentRollPayload?.total_in_place_annual
    );
    const execMonthlyInPlace = coerceNumber(
      computedRentRoll?.total_in_place_monthly ??
        rentRollPayload?.total_in_place_monthly ??
        (Number.isFinite(execAnnualInPlace) ? execAnnualInPlace / 12 : null)
    );
    const expenseRatio = Number.isFinite(coerceNumber(t12Payload?.expense_ratio))
      ? coerceNumber(t12Payload?.expense_ratio)
      : Number.isFinite(execEgi) && Number.isFinite(execOpex) && execEgi > 0
      ? execOpex / execEgi
      : null;
    const noiMargin =
      Number.isFinite(coerceNumber(t12Payload?.net_operating_income)) &&
      Number.isFinite(coerceNumber(t12Payload?.effective_gross_income)) &&
      coerceNumber(t12Payload?.effective_gross_income) > 0
        ? coerceNumber(t12Payload?.net_operating_income) /
          coerceNumber(t12Payload?.effective_gross_income)
        : null;
    const breakEvenOccupancy =
      Number.isFinite(execOpex) &&
      Number.isFinite(execEgi) &&
      execEgi > 0
        ? execOpex / execEgi
        : null;
    const toRatioMetric = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n > 1.5 ? n / 100 : n;
    };
    const expenseRatioR = toRatioMetric(expenseRatio);
    const noiMarginR = toRatioMetric(noiMargin);
    const breakEvenOccR = toRatioMetric(breakEvenOccupancy);
    const breakEvenOccRatio = breakEvenOccR;
    const breakEvenOcc = breakEvenOccR;
    const toPctValue = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n > 1.5 ? n : n * 100;
    };
    const breakEvenOccPct = toPctValue(breakEvenOcc);
    const operatingCushionPct =
      Number.isFinite(execOccupancy) && Number.isFinite(breakEvenOccPct)
        ? (execOccupancy * 100) - breakEvenOccPct
        : null;
    const marketRentPremiumPct =
      Number.isFinite(coerceNumber(computedRentRoll?.rent_to_market_gap))
        ? coerceNumber(computedRentRoll?.rent_to_market_gap) * 100
        : Number.isFinite(coerceNumber(computedRentRoll?.avg_market_rent)) &&
      Number.isFinite(coerceNumber(computedRentRoll?.avg_in_place_rent)) &&
      coerceNumber(computedRentRoll?.avg_in_place_rent) > 0
        ? ((coerceNumber(computedRentRoll?.avg_market_rent) -
            coerceNumber(computedRentRoll?.avg_in_place_rent)) /
            coerceNumber(computedRentRoll?.avg_in_place_rent)) *
          100
        : null;
    const marketRentPremiumRatio = Number.isFinite(marketRentPremiumPct)
      ? marketRentPremiumPct / 100
      : NaN;
    const execOpexRatio =
      Number.isFinite(execEgi) && Number.isFinite(execOpex) && execEgi > 0
        ? formatPercent1(execOpex / execEgi)
        : null;
    if (Number.isFinite(execUnits) && execUnits > 0) execMetricsParts.push(`Units: ${Math.round(execUnits)}`);
    if (Number.isFinite(execOccupancy)) execMetricsParts.push(`Occupancy: ${formatPercent1(execOccupancy)}`);
    if (Number.isFinite(execAnnualInPlace)) execMetricsParts.push(`Annual In-Place Rent: ${formatCurrency(execAnnualInPlace)}`);
    if (Number.isFinite(execEgi)) execMetricsParts.push(`EGI: ${formatCurrency(execEgi)}`);
    if (Number.isFinite(execOpex)) execMetricsParts.push(`OpEx: ${formatCurrency(execOpex)}`);
    if (Number.isFinite(execNoi)) execMetricsParts.push(`NOI: ${formatCurrency(execNoi)}`);
    if (execOpexRatio) execMetricsParts.push(`OpEx Ratio: ${execOpexRatio}`);
    const execUnitsText =
      Number.isFinite(execUnits) && execUnits > 0 ? String(Math.round(execUnits)) : DATA_NOT_AVAILABLE;
    const execNoiText = Number.isFinite(execNoi) ? formatCurrency(execNoi) : DATA_NOT_AVAILABLE;
    const execOccupancyText = Number.isFinite(execOccupancy)
      ? formatPercent1(execOccupancy)
      : DATA_NOT_AVAILABLE;
    const execAnnualInPlaceText = Number.isFinite(execAnnualInPlace)
      ? formatCurrency(execAnnualInPlace)
      : DATA_NOT_AVAILABLE;
    const execEgiText = Number.isFinite(execEgi) ? formatCurrency(execEgi) : DATA_NOT_AVAILABLE;
    const execOpexText = Number.isFinite(execOpex) ? formatCurrency(execOpex) : DATA_NOT_AVAILABLE;
    const expenseRatioBand = Number.isFinite(expenseRatioR)
      ? expenseRatioR >= 0.65
        ? "Fragile"
        : expenseRatioR >= 0.55
        ? "Sensitized"
        : "Stable"
      : null;
    const noiMarginBand = Number.isFinite(noiMarginR)
      ? noiMarginR <= 0.3
        ? "Fragile"
        : noiMarginR <= 0.45
        ? "Sensitized"
        : "Stable"
      : null;
    const breakEvenBand = Number.isFinite(breakEvenOccRatio)
      ? breakEvenOccRatio >= 0.8
        ? "Fragile"
        : breakEvenOccRatio >= 0.75
        ? "Sensitized"
        : "Stable"
      : null;
    const execOpexRatioText = Number.isFinite(expenseRatioR)
      ? `${formatPercent1(expenseRatioR)}${expenseRatioBand ? ` (${expenseRatioBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    const execNoiMarginText = Number.isFinite(noiMarginR)
      ? `${formatPercent1(noiMarginR)}${noiMarginBand ? ` (${noiMarginBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    const execBreakEvenText = Number.isFinite(breakEvenOccRatio)
      ? `${formatPercent1(breakEvenOccRatio)}${breakEvenBand ? ` (${breakEvenBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    const rawFinancials = body?.financials || {};
    const canonicalRefiDebtBasis =
      sharedRefiDebtRenderState?.canonicalRefiDebtBasis ||
      resolveCanonicalRefiDebtBasis({
        currentDebtState: currentDebtAssessmentState,
        mortgagePayload,
        loanTermSheetTermsPayload,
        financials: rawFinancials,
        t12Payload,
      });
    const refiFinancials = {
      ...rawFinancials,
      refi_debt_balance:
        canonicalRefiDebtBasis?.debtBalance ??
        rawFinancials?.refi_debt_balance ??
        null,
      refi_interest_rate:
        canonicalRefiDebtBasis?.interestRatePct ??
        rawFinancials?.refi_interest_rate ??
        null,
      refi_amort_years:
        canonicalRefiDebtBasis?.amortYears ??
        rawFinancials?.refi_amort_years ??
        null,
      refi_cap_rate_base:
        rawFinancials?.refi_cap_rate_base ??
        mortgagePayload?.refi_cap_rate ??
        appraisalCapRateBase ??
        null,
      refi_ltv_max:
        rawFinancials?.refi_ltv_max ?? null,
      refi_dscr_min:
        rawFinancials?.refi_dscr_min ??
        1.25,
      stress_noi_shocks:
        rawFinancials?.stress_noi_shocks ??
        [-0.05, -0.10, -0.15],
      stress_cap_rate_bps:
        rawFinancials?.stress_cap_rate_bps ??
        [0, 50, 100],
      stress_rate_bps:
        rawFinancials?.stress_rate_bps ??
        [0, 100, 200],
      noi_base:
        rawFinancials?.noi_base ??
        t12Payload?.net_operating_income ??
        null,
    };
    let execRefiLine = "";
    let refiStabilityResult = null;
    if (effectiveReportMode === "v1_core") {
      refiStabilityResult = buildRefiStabilityModel({
        financials: refiFinancials,
        t12Payload,
        formatValue: formatCurrency,
        currentDebtState: currentDebtAssessmentState,
        mortgagePayload,
        loanTermSheetTermsPayload,
      });
      const refiTier = refiStabilityResult?.tier;
      const validRefiTiers = new Set([
        "Stable",
        "Sensitized",
        "Fragile",
        "Refinance Shortfall Under Stress",
      ]);
      if (validRefiTiers.has(refiTier)) {
        execRefiLine = `<p>Refinance Stability Classification: ${escapeHtml(refiTier)}.</p>`;
      }
      execRefiLine = "";
    }
    const execArticle = String(execUnitsText).trim().startsWith("8") ? "an" : "a";
    const execOpeningLine = `<p>${escapeHtml(
      `${displayPropertyName} is ${execArticle} ${execUnitsText}-unit multifamily asset generating ${execNoiText} in trailing twelve-month NOI.`
    )}</p>`;
    const execStructuredMetricsLine = `<p class="exec-kpis">${escapeHtml(
      `Occupancy: ${execOccupancyText} | Annual In-Place Rent: ${execAnnualInPlaceText} | OpEx Ratio: ${execOpexRatioText}`
    )}</p>`;
    const execNarrativeHtml = effectiveReportMode === "screening_v1" ? "" : getNarrativeHtml("execSummary");
    const execScreeningLines = [];
    let screeningClass = null;
    let screeningVisibleClassificationLabel = null;
    let screeningExplanation = null;
    const driverCandidates = [];
    if (Number.isFinite(expenseRatioR)) {
      const severity =
        expenseRatioR > 0.65
          ? expenseRatioR - 0.65
          : expenseRatioR > 0.55
          ? expenseRatioR - 0.55
          : 0;
      const trigger =
        expenseRatioR > 0.65
          ? ">= 65.0% fragile threshold breached"
          : expenseRatioR > 0.55
          ? ">= 55.0% sensitized threshold breached"
          : "< 55.0% within stable range";
      driverCandidates.push({
        label: "Expense Ratio",
        value: formatPercent1(expenseRatioR),
        trigger,
        severity,
      });
    }
    if (Number.isFinite(noiMarginR)) {
      const severity =
        noiMarginR < 0.35
          ? 0.35 - noiMarginR
          : noiMarginR < 0.45
          ? 0.45 - noiMarginR
          : 0;
      const trigger =
        noiMarginR < 0.35
          ? "<= 35.0% fragile threshold breached"
          : noiMarginR < 0.45
          ? "<= 45.0% sensitized threshold breached"
          : ">= 45.0% within stable range";
      driverCandidates.push({
        label: "NOI Margin",
        value: formatPercent1(noiMarginR),
        trigger,
        severity,
      });
    }
    if (Number.isFinite(breakEvenOccR)) {
      const severity =
        breakEvenOccR > 0.85
          ? breakEvenOccR - 0.85
          : breakEvenOccR > 0.75
          ? breakEvenOccR - 0.75
          : 0;
      const trigger =
        breakEvenOccR > 0.85
          ? ">= 85.0% fragile threshold breached"
          : breakEvenOccR > 0.75
          ? ">= 75.0% sensitized threshold breached"
          : "< 75.0% within stable range";
      driverCandidates.push({
        label: "Break-even Occupancy",
        value: formatPercent1(breakEvenOccR),
        trigger,
        severity,
      });
    }
    const rankedDrivers = driverCandidates
      .slice()
      .sort((a, b) => b.severity - a.severity);
    const pressureDrivers = rankedDrivers.filter((driver) => Number(driver?.severity) > 0);
    const driver1 = pressureDrivers[0] || null;
    const driver2 = pressureDrivers[1] || null;
    const driver3 = pressureDrivers[2] || null;
    const sourceReconciliationRenderState = buildSourceReconciliationRenderState({
      sourceReconciliationState,
    });
    const sourceReconciliationNarrativePolicy =
      buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState);
    const rrVsGprPct = sourceReconciliationRenderState?.variance_pct ?? null;
    const rrVsGprDisplay = sourceReconciliationRenderState?.variance_display ?? null;
    const hasSourceReconciliationVariance = sourceReconciliationRenderState?.renderable && Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05;
    let primaryPressurePoint = driver1?.label
      ? driver1.value
        ? `${driver1.label} (${driver1.value})`
        : driver1.label
      : "Primary Constraint: No material operating pressure signal was triggered from assessed core metrics; refer to Data Coverage for source-limited areas.";
    if (!driver1 && hasSourceReconciliationVariance && sourceReconciliationNarrativePolicy.primary_pressure_point_allowed) {
      primaryPressurePoint = `Source reconciliation variance of ${rrVsGprDisplay} between rent roll and T12 gross potential rent requires review.`;
    }
    if (
      effectiveReportMode === "v1_core" &&
      sourceReconciliationNarrativePolicy.data_coverage_required &&
      hasSourceReconciliationVariance
    ) {
      primaryPressurePoint =
        "Primary Constraint: Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation.";
    }
    const hasCoreUnderwritingOperatingMetrics =
      Number.isFinite(execEgi) &&
      Number.isFinite(execOpex) &&
      Number.isFinite(execNoi) &&
      Number.isFinite(execUnits) &&
      execUnits > 0 &&
      Number.isFinite(execOccupancy) &&
      Number.isFinite(expenseRatioR) &&
      Number.isFinite(noiMarginR) &&
      Number.isFinite(breakEvenOccR);
    const screeningHasSufficientData =
      effectiveReportMode === "v1_core"
        ? hasCoreUnderwritingOperatingMetrics
        : hasMinimumScreeningCoverage(t12Payload);
    // Operating profile classification: computed for both modes with deterministic threshold math
    if (!screeningHasSufficientData) {
      screeningClass = "Insufficient Data";
      screeningExplanation =
        "Insufficient operating data to classify the operating profile.";
    } else if (
      (Number.isFinite(expenseRatioR) && expenseRatioR > 0.65) ||
      (Number.isFinite(noiMarginR) && noiMarginR < 0.35) ||
      (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.85)
    ) {
      screeningClass = "Fragile";
      screeningExplanation =
        "Operating margin is narrow relative to current expense load.";
    } else if (
      (Number.isFinite(expenseRatioR) && expenseRatioR > 0.55) ||
      (Number.isFinite(noiMarginR) && noiMarginR < 0.45) ||
      (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.75)
    ) {
      screeningClass = "Sensitized";
      screeningExplanation =
        "Cash flow remains positive but is sensitive to changes in income and expenses.";
    } else {
      screeningClass = "Stable";
      screeningExplanation =
        "Operating margins remain within a stable range based on uploaded operating results.";
    }
    if (effectiveReportMode === "screening_v1") {
      screeningVisibleClassificationLabel = normalizeVisibleReportClassification({
        baseClass: screeningClass,
        effectiveReportMode,
        sourceReconciliationCapActive: Boolean(
          sourceReconciliationNarrativePolicy?.data_coverage_required === true && hasSourceReconciliationVariance
        ),
        coreSupportInsufficient: Boolean(!screeningHasSufficientData || screeningClass === "Insufficient Data"),
        debtCoverageConstraintActive: false,
      });
      execScreeningLines.push(
        `<p class="exec-classification">${escapeHtml(`Operating Profile: ${screeningVisibleClassificationLabel}`)}</p>`
      );
      execScreeningLines.push(
        `<p class="exec-classification-note">${escapeHtml(screeningExplanation)}</p>`
      );
      execScreeningLines.push(
        ``
      );
    }
    const classificationDrivers = [];
    if (Number.isFinite(expenseRatioR) && expenseRatioR >= 0.55) {
      classificationDrivers.push(
        `elevated Expense Ratio (${formatPercent1(expenseRatioR)})`
      );
    }
    if (Number.isFinite(noiMarginR) && noiMarginR <= 0.45) {
      classificationDrivers.push(
        `compressed NOI Margin (${formatPercent1(noiMarginR)})`
      );
    }
    if (Number.isFinite(breakEvenOccR) && breakEvenOccR >= 0.75) {
      classificationDrivers.push(
        `high Break-even Occupancy (${formatPercent1(breakEvenOccR)})`
      );
    }
    const whyLine =
      classificationDrivers.length > 0
        ? `Driven by ${classificationDrivers.join(" and ")}.`
        : "";
    const toPercentMetric = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n <= 1.5 ? n * 100 : n;
    };
    const expenseRatioPct = toPercentMetric(expenseRatioR);
    const noiMarginPct = toPercentMetric(noiMarginR);
    const breakEvenDecisionPct = toPercentMetric(breakEvenOccR);
    const decisionContextInputs = [expenseRatioPct, noiMarginPct, breakEvenDecisionPct];
    let passChecks = [];
    let disqualifierChecks = [];
    let anyHardDisq = false;
    let finitePassCount = 0;
    let allPass = false;
    let decisionContextHtml = "";
    let miniSensitivityHtml = "";
    if (decisionContextInputs.some((v) => Number.isFinite(v))) {
      const formatDecisionValue = (v) =>
        Number.isFinite(v) ? `${v.toFixed(1)}%` : "Not assessed";
      passChecks = [
        {
          label: "Expense Ratio < 55%",
          value: expenseRatioPct,
          test: (v) => v < 55,
        },
        {
          label: "NOI Margin > 40%",
          value: noiMarginPct,
          test: (v) => v > 40,
        },
        {
          label: "Break-even Occupancy < 85%",
          value: breakEvenDecisionPct,
          test: (v) => v < 85,
        },
      ];
      disqualifierChecks = [
        {
          label: "Expense Ratio >= 65%",
          value: expenseRatioPct,
          test: (v) => v >= 65,
        },
        {
          label: "NOI Margin <= 30%",
          value: noiMarginPct,
          test: (v) => v <= 30,
        },
        {
          label: "Break-even Occupancy >= 95%",
          value: breakEvenDecisionPct,
          test: (v) => v >= 95,
        },
      ];
      const passLinesHtml = passChecks
        .map((row) => {
          const status = Number.isFinite(row.value)
            ? row.test(row.value)
              ? "Meets threshold"
              : "Below threshold"
            : "Not assessed";
          return `<li>${escapeHtml(row.label)}: ${escapeHtml(status)} (${escapeHtml(
            formatDecisionValue(row.value)
          )})</li>`;
        })
        .join("");
      const disqualifierLinesHtml = disqualifierChecks
        .map((row) => {
          const status = Number.isFinite(row.value)
            ? row.test(row.value)
              ? "TRIGGERED"
              : "NOT TRIGGERED"
            : "Not assessed";
          return `<li>${escapeHtml(row.label)}: ${escapeHtml(status)} (${escapeHtml(
            formatDecisionValue(row.value)
          )})</li>`;
        })
        .join("");
      const satisfiedCount = passChecks.filter(
        (row) => Number.isFinite(row.value) && row.test(row.value)
      ).length;
      anyHardDisq = disqualifierChecks.some(
        (row) => Number.isFinite(row.value) && row.test(row.value)
      );
      finitePassCount = passChecks.filter((row) => Number.isFinite(row.value)).length;
      allPass = finitePassCount === passChecks.length && satisfiedCount === passChecks.length;
      const decisionStatusText = anyHardDisq
        ? "Decision Status: Elevated Risk Triggered"
        : allPass
        ? "Decision Status: Metrics Aligned"
        : satisfiedCount === 0
        ? "Decision Status: Elevated Risk Triggered"
        : `Decision Status: Mixed Signals (${satisfiedCount} of 3 thresholds met)`;
      decisionContextHtml = `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Operating Decision Summary</p><p class="exec-signal-line"><strong>Operating Thresholds</strong></p><ul>${passLinesHtml}</ul><p class="exec-signal-line"><strong>Hard Risk Triggers</strong></p><ul>${disqualifierLinesHtml}</ul><p class="exec-signal-line">${decisionStatusText}</p></div>`;
    }
    if (
      effectiveReportMode === "screening_v1" &&
      Number.isFinite(execEgi) &&
      execEgi > 0 &&
      Number.isFinite(execOpex) &&
      execOpex > 0
    ) {
      const baseEGI = execEgi;
      const baseExpenses = execOpex;
      const baseNOI = baseEGI - baseExpenses;
      const baseMarginR =
        Number.isFinite(baseNOI) && baseEGI > 0 ? baseNOI / baseEGI : null;
      const expenseUp5Expenses = baseExpenses * 1.05;
      const expenseUp5NOI = baseEGI - expenseUp5Expenses;
      const expenseUp5MarginR =
        Number.isFinite(expenseUp5NOI) && baseEGI > 0 ? expenseUp5NOI / baseEGI : null;
      const incomeDown5EGI = baseEGI * 0.95;
      const incomeDown5NOI = incomeDown5EGI - baseExpenses;
      const incomeDown5MarginR =
        Number.isFinite(incomeDown5NOI) && incomeDown5EGI > 0 ? incomeDown5NOI / incomeDown5EGI : null;
      const combinedEGI = baseEGI * 0.95;
      const combinedExpenses = baseExpenses * 1.05;
      const combinedNOI = combinedEGI - combinedExpenses;
      const marginC =
        Number.isFinite(combinedNOI) && combinedEGI > 0 ? combinedNOI / combinedEGI : null;
      const sensitivityRows = [
        { label: "Base", margin: baseMarginR },
        { label: "Expenses +5%", margin: expenseUp5MarginR },
        { label: "Income -5%", margin: incomeDown5MarginR },
        { label: "Combined Shock", margin: marginC },
      ]
        .filter((row) => Number.isFinite(row.margin))
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.label)}</td><td>${formatPercent1(row.margin)}</td><td>${escapeHtml(
              row.label === "Base"
                ? screeningVisibleClassificationLabel || screeningClass || DATA_NOT_AVAILABLE
                : Number.isFinite(row.margin) && row.margin <= 0.3
                ? "Fragile"
                : Number.isFinite(row.margin) && row.margin > 0.4
                ? "Stable"
                : "Sensitized"
            )}</td></tr>`
        )
        .join("");
      if (sensitivityRows) {
        const marginCompressionBps =
          Number.isFinite(baseMarginR) && Number.isFinite(marginC)
            ? Math.round((baseMarginR - marginC) * 10000)
            : null;
        miniSensitivityHtml = `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Operating Stress Summary</p><table><thead><tr><th>Stress Case</th><th>NOI Margin</th><th>Classification</th></tr></thead><tbody>${sensitivityRows}</tbody></table>${
          Number.isFinite(marginCompressionBps)
            ? `<p class="exec-signal-line">Under modest operating stress, NOI margin compresses by ${marginCompressionBps} bps.</p>`
            : ""
        }${
          Number.isFinite(marginC) && marginC <= 0.3
            ? `<p class="exec-signal-line">Modest operating deterioration would materially compress margin.</p>`
            : ""
        }</div>`;
      }
    }
    const currentDebtDscrForDisplay =
      canonicalRefiDebtBasis?.dscr ?? currentDebtAssessmentState.current_debt_dscr;
    if (Number.isFinite(execUnits) && execUnits > 0) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(`Units: ${Math.round(execUnits)}`)}</p>`
      );
    }
    if (Number.isFinite(execOccupancy)) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(
          `Occupancy: ${formatPercent1(execOccupancy)}`
        )}</p>`
      );
    }
    if (Number.isFinite(execMonthlyInPlace) || Number.isFinite(execAnnualInPlace)) {
      const rentParts = [];
      if (Number.isFinite(execMonthlyInPlace)) {
        rentParts.push(`In-Place Rent (Monthly): ${formatCurrency(execMonthlyInPlace)}`);
      }
      if (Number.isFinite(execAnnualInPlace)) {
        rentParts.push(`In-Place Rent (Annualized): ${formatCurrency(execAnnualInPlace)}`);
      }
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(rentParts.join(" | "))}</p>`
      );
    }
    if (Number.isFinite(execNoi)) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(`NOI: ${formatCurrency(execNoi)}`)}</p>`
      );
    }
    if (execOpexRatio) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(`Expense Ratio: ${execOpexRatio}`)}</p>`
      );
    }
    if (Number.isFinite(noiMarginR)) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(
          `NOI Margin: ${formatPercent1(noiMarginR)}`
        )}</p>`
      );
    }
    if (Number.isFinite(Number(breakEvenOcc))) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(
          `Break-even Occupancy: ${formatPercent1(breakEvenOcc)}`
        )}</p>`
      );
    }
    const upsideBullets = [];
    if (Number.isFinite(marketRentPremiumRatio) && marketRentPremiumRatio >= 0.10) {
      upsideBullets.push(
        `In-place rents trail market by ~${formatPercent1(
          marketRentPremiumRatio
        )} (observed rent gap).`
      );
    }
    if (Number.isFinite(execOccupancy) && execOccupancy >= 0.95) {
      upsideBullets.push(
        `Occupancy is ${formatPercent1(execOccupancy)}, reflecting near-stabilized in-place tenancy.`
      );
    }
    if (Number.isFinite(operatingCushionPct) && operatingCushionPct >= 25) {
      upsideBullets.push(
        `Operating cushion of ${formatPercent1(
          operatingCushionPct
        )} above break-even occupancy based on in-place performance.`
      );
    }
    const riskBullets = [];
    if (Number.isFinite(expenseRatioR) && expenseRatioR > 0.55) {
      riskBullets.push(
        `Expense ratio is ${formatPercent1(
          expenseRatioR
        )}, pressuring NOI margin.`
      );
    }
    if (Number.isFinite(noiMarginR) && noiMarginR < 0.45) {
      riskBullets.push(
        `NOI margin is ${formatPercent1(
          noiMarginR
        )}, leaving limited buffer for shocks.`
      );
    }
    if (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.75) {
      riskBullets.push(
        `Break-even occupancy is ${formatPercent1(
          breakEvenOccR
        )}, increasing sensitivity to vacancy and income disruption.`
      );
    }
    if (effectiveReportMode === "v1_core" && sourceReconciliationNarrativePolicy.data_coverage_required && hasSourceReconciliationVariance) {
      riskBullets.unshift(
        "Rent roll and T12 income evidence remain materially unreconciled; classification is capped pending source reconciliation."
      );
    }
    if (isFullRenderHarness && body?.__test_payloads && typeof body.__test_payloads === "object") {
      const harnessPayloads = body.__test_payloads;
      if (harnessPayloads.rentRollPayload !== undefined) rentRollPayload = harnessPayloads.rentRollPayload;
      if (harnessPayloads.t12Payload !== undefined) t12Payload = harnessPayloads.t12Payload;
      if (harnessPayloads.mortgagePayload !== undefined) mortgagePayload = harnessPayloads.mortgagePayload;
      if (harnessPayloads.loanTermSheetTermsPayload !== undefined) loanTermSheetTermsPayload = harnessPayloads.loanTermSheetTermsPayload;
      if (harnessPayloads.acquisitionTermsPayload !== undefined) acquisitionTermsPayload = harnessPayloads.acquisitionTermsPayload;
      if (harnessPayloads.propertyTaxPayload !== undefined) propertyTaxPayload = harnessPayloads.propertyTaxPayload;
      if (Array.isArray(harnessPayloads.documentSources)) {
        documentSources = harnessPayloads.documentSources;
        const items = harnessPayloads.documentSources
          .map((row) => {
            const name = escapeHtml(row?.original_filename || "Unnamed file");
            const uploadedAt = row?.uploaded_at
              ? new Date(row.uploaded_at).toLocaleString()
              : "Unknown date";
            return `<li>${name}  -  ${escapeHtml(uploadedAt)}</li>`;
          })
          .join("");
        documentSourcesHtml = `<ul>${items}</ul>`;
      }
      documentQuantitativeUsageMap = buildDocumentQuantitativeUsageMap({
        effectiveReportMode,
        currentDebtAssessmentState,
        mortgagePayload,
        loanTermSheetTermsPayload,
      });
    }
    const upsideHtml = upsideBullets
      .slice(0, 3)
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    const risksHtml = riskBullets
      .slice(0, 3)
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    const execRentRollSource =
      computedRentRoll && typeof computedRentRoll === "object"
        ? computedRentRoll
        : rentRollPayload && typeof rentRollPayload === "object"
        ? rentRollPayload
        : null;
    const rrRowsRaw =
      rentRollPayload?.units ||
      rentRollPayload?.rows ||
      rentRollPayload?.rent_roll ||
      rentRollPayload?.data ||
      [];
    const rrRows = Array.isArray(rrRowsRaw) ? rrRowsRaw : [];
    const execTotalUnits = coerceNumber(execRentRollSource?.total_units);
    const execOccupiedUnits = coerceNumber(execRentRollSource?.occupied_units);
    const execOccupancyTokenText = Number.isFinite(execOccupancy)
      ? formatPercent1(execOccupancy)
      : DATA_NOT_AVAILABLE;
    const execUnitMix = Array.isArray(execRentRollSource?.unit_mix)
      ? execRentRollSource.unit_mix
      : [];
    let weightedAvgInPlaceRent = coerceNumber(execRentRollSource?.avg_in_place_rent);
    if (!Number.isFinite(weightedAvgInPlaceRent) && execUnitMix.length > 0) {
      let sumCountInPlace = 0;
      let sumRentInPlace = 0;
      execUnitMix.forEach((row) => {
        const count = coerceNumber(row?.count);
        const currentRent = coerceNumber(row?.current_rent);
        if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(currentRent)) return;
        sumCountInPlace += count;
        sumRentInPlace += count * currentRent;
      });
      if (sumCountInPlace > 0) weightedAvgInPlaceRent = sumRentInPlace / sumCountInPlace;
    }
    let execAnnualInPlaceTokenValue = Number.isFinite(coerceNumber(rentRollAnnualTotals?.in_place?.value))
      ? coerceNumber(rentRollAnnualTotals.in_place.value)
      : null;
    if (
      !Number.isFinite(execAnnualInPlaceTokenValue) &&
      !rentRollIsPartialSample &&
      Number.isFinite(weightedAvgInPlaceRent) &&
      Number.isFinite(execTotalUnits) &&
      execTotalUnits > 0
    ) {
      execAnnualInPlaceTokenValue = weightedAvgInPlaceRent * execTotalUnits * 12;
    } else if (!Number.isFinite(execAnnualInPlaceTokenValue) && !rentRollIsPartialSample && rrRows.length > 0) {
      const annualFromRows = rrRows.reduce((acc, row) => {
        const status = String(row?.lease_status || row?.status || "").trim().toLowerCase();
        const currentRent = Number(row?.current_rent ?? row?.in_place_rent ?? row?.rent);
        if (!Number.isFinite(currentRent) || currentRent <= 0) return acc;
        if (status && status === "vacant") return acc;
        return acc + currentRent * 12;
      }, 0);
      execAnnualInPlaceTokenValue = Number.isFinite(annualFromRows) ? annualFromRows : null;
    }
    const execAnnualInPlaceTokenText = Number.isFinite(execAnnualInPlaceTokenValue)
      ? formatCurrency(execAnnualInPlaceTokenValue)
      : DATA_NOT_AVAILABLE;
    finalHtml = replaceAll(finalHtml, "{{EXEC_UNITS}}", execUnitsText);
    finalHtml = replaceAll(finalHtml, "{{EXEC_OCCUPANCY}}", execOccupancyTokenText);
    finalHtml = replaceAll(
      finalHtml,
      "{{EXEC_ANNUAL_IN_PLACE}}",
      execAnnualInPlaceTokenText
    );
    finalHtml = replaceAll(finalHtml, "{{EXEC_EGI}}", execEgiText);
    finalHtml = replaceAll(finalHtml, "{{EXEC_OPEX}}", execOpexText);
    finalHtml = replaceAll(finalHtml, "{{EXEC_NOI}}", execNoiText);
    finalHtml = replaceAll(finalHtml, "{{EXEC_EXPENSE_RATIO}}", execOpexRatioText);
    finalHtml = replaceAll(finalHtml, "{{EXEC_NOI_MARGIN}}", execNoiMarginText);
    finalHtml = replaceAll(
      finalHtml,
      "{{EXEC_BREAK_EVEN_OCCUPANCY}}",
      execBreakEvenText
    );
    const execSnapshotTokens = [
      "{{EXEC_UNITS}}",
      "{{EXEC_OCCUPANCY}}",
      "{{EXEC_ANNUAL_IN_PLACE}}",
      "{{EXEC_EGI}}",
      "{{EXEC_OPEX}}",
      "{{EXEC_NOI}}",
      "{{EXEC_EXPENSE_RATIO}}",
      "{{EXEC_NOI_MARGIN}}",
      "{{EXEC_BREAK_EVEN_OCCUPANCY}}",
    ];
    execSnapshotTokens.forEach((token) => {
      if (finalHtml.includes(token)) {
        finalHtml = replaceAll(finalHtml, token, DATA_NOT_AVAILABLE);
      }
    });
    const execSnapshotValues = [
      execUnitsText,
      execOccupancyText,
      execAnnualInPlaceText,
      execEgiText,
      execOpexText,
      execNoiText,
      execOpexRatioText,
      execNoiMarginText,
      execBreakEvenText,
    ];
    if (
      execSnapshotValues.every((value) => value === DATA_NOT_AVAILABLE) &&
      finalHtml.includes("<!-- BEGIN EXEC_METRICS_SNAPSHOT -->") &&
      finalHtml.includes("<!-- END EXEC_METRICS_SNAPSHOT -->")
    ) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_METRICS_SNAPSHOT");
    }
    const dealScoreState = buildDealScorecardState({
      expenseRatioR,
      noiMarginR,
      execOccupancy,
      breakEvenOccR,
      marketRentPremiumRatio,
      currentDebtAssessmentState,
      mortgagePayload,
      loanTermSheetTermsPayload,
      t12Payload,
      sourceReconciliationState,
      launchMemoMode: effectiveReportMode === "v1_core",
      launchMemoBaseLabel: screeningClass,
    });
    const sourceReconciliationCapActive = Boolean(
      sourceReconciliationNarrativePolicy?.data_coverage_required === true &&
      hasSourceReconciliationVariance
    );
    const debtCoverageConstraintActive = Boolean(
      effectiveReportMode === "v1_core" &&
      (
        dealScoreState?.displayVerdict?.cap_reason_code === "debt_coverage_constraint" ||
        (Number.isFinite(currentDebtDscrForDisplay) && currentDebtDscrForDisplay > 0 && currentDebtDscrForDisplay < 1.25)
      )
    );
    const coreSupportInsufficient = Boolean(
      !screeningHasSufficientData ||
      screeningClass === "Insufficient Data" ||
      dealScoreState?.displayVerdict?.label === "Insufficient Data"
    );
    const baseVisibleClass =
      effectiveReportMode === "screening_v1"
        ? (screeningClass === "Fragile" ? "Fragile" : screeningClass)
        : (screeningClass === "Fragile" ? "Fragile" : screeningClass);
    const computedVisibleLabelInputs = {
      baseClass: baseVisibleClass,
      sourceReconciliationCapActive,
      coreSupportInsufficient,
      debtCoverageConstraintActive: effectiveReportMode === "v1_core" ? false : debtCoverageConstraintActive,
    };
    const canonicalVisibleClassificationState = buildCanonicalVisibleClassificationState({
      reportType: effectiveReportMode === "v1_core" ? "screening" : reportType,
      reportTier: effectiveReportMode === "v1_core" ? 1 : reportTier,
      baseLabel: baseVisibleClass,
      score: dealScoreState?.score,
      hasDscrScore: effectiveReportMode === "screening_v1" ? dealScoreState?.hasDscrScore : false,
      currentDebtDscr: effectiveReportMode === "screening_v1" ? dealScoreState?.computedDscrForVerdict : null,
      sourceReconciliationState,
      sourceReconciliationCapActive,
      coreSupportInsufficient,
      debtCoverageConstraintActive: false,
    });
    const computedCoverClassificationLabel = canonicalVisibleClassificationState.label;
    if (underwritingState?.core?.classification) {
      underwritingState.core.classification.visibleLabelInputs = computedVisibleLabelInputs;
      underwritingState.core.classification.visibleLabel = computedCoverClassificationLabel;
      underwritingState.core.classification.visibleClassificationState = canonicalVisibleClassificationState;
      underwritingState.core.classification.verdictState = effectiveReportMode === "v1_core" ? null : dealScoreState.displayVerdict || null;
    }
    const classificationState = underwritingState?.core?.classification || null;
    const coverClassificationLabel =
      classificationState?.visibleClassificationState?.label || classificationState?.visibleLabel || computedCoverClassificationLabel;
    const screeningVisibleClassificationForConsumers =
      effectiveReportMode === "screening_v1"
        ? resolveScreeningClassificationConsumerLabel({
            canonicalVisibleLabel: coverClassificationLabel,
            localVisibleLabel: screeningVisibleClassificationLabel,
            screeningClass,
          })
        : "";
    if (effectiveReportMode === "v1_core") {
      dealScoreState.dealScoreTableHtml = alignDealScorecardVisibleClassificationHtml(
        dealScoreState.dealScoreTableHtml,
        coverClassificationLabel
      );
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{OPERATING_PROFILE_CLASSIFICATION}}",
      coverClassificationLabel
    );
    const verdictCssClass = coverClassificationLabel === "Stable" ? "verdict-stable"
      : /^Review\b/i.test(coverClassificationLabel) ? "verdict-sensitized"
      : coverClassificationLabel === "High Risk" || coverClassificationLabel === "Fragile" ? "verdict-fragile"
      : coverClassificationLabel === "Constrained" ? "verdict-sensitized"
      : coverClassificationLabel === "Outside Parameters" ? "verdict-fragile"
      : "";
    finalHtml = replaceAll(finalHtml, "{{VERDICT_CSS_CLASS}}", verdictCssClass);
    // Verdict label tokens: differentiate screening triage vs acquisition memo
    const coverVerdictLabel = effectiveReportMode === "v1_core"
      ? "ACQUISITION<br/>MEMO"
      : "SCREENING<br/>SIGNAL";
    finalHtml = replaceAll(finalHtml, "{{COVER_VERDICT_LABEL}}", coverVerdictLabel);
    const execVerdictLabel = effectiveReportMode === "v1_core"
      ? "ACQUISITION MEMO"
      : "SCREENING SIGNAL";
    finalHtml = replaceAll(finalHtml, "{{EXEC_VERDICT_LABEL}}", execVerdictLabel);
    // Cover metric strip: screening only; strip when values unavailable
    {
      const coverNoi = execNoiText !== DATA_NOT_AVAILABLE ? execNoiText : "";
      const coverER = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : "";
      const coverNM = Number.isFinite(noiMarginR) ? formatPercent1(noiMarginR) : "";
      const coverUnits = execUnitsText !== DATA_NOT_AVAILABLE ? execUnitsText : "";
      if (coverUnits && coverNoi && coverER && coverNM) {
        finalHtml = replaceAll(finalHtml, "{{COVER_UNITS}}", coverUnits);
        finalHtml = replaceAll(finalHtml, "{{COVER_NOI}}", coverNoi);
        finalHtml = replaceAll(finalHtml, "{{COVER_EXPENSE_RATIO}}", coverER);
        finalHtml = replaceAll(finalHtml, "{{COVER_NOI_MARGIN}}", coverNM);
      } else {
        finalHtml = stripMarkedSection(finalHtml, "COVER_METRIC_STRIP");
      }
    }
    // Cover asset snapshot: fills the bottom of the cover page
    {
      const snapRows = [];
      const coverSnapshotValueStyle = "color:#F9FAFB;font-size:11px;font-weight:600;";
      const _coverRrUnits = Number(computedRentRoll?.total_units);
      const unitCount = Number.isFinite(_coverRrUnits) && _coverRrUnits > 0 ? _coverRrUnits : null;
      if (unitCount) snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Asset Class</span><span style="${coverSnapshotValueStyle}">Multifamily - ${unitCount} Units</span></div>`);
      const docCount = Array.isArray(documentSources) ? documentSources.length : 0;
      if (docCount > 0) snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Documents</span><span style="${coverSnapshotValueStyle}">${docCount} uploaded file${docCount === 1 ? "" : "s"}</span></div>`);
      const modeLabel = effectiveReportMode === "v1_core" ? "Acquisition Memo" : "Preliminary Screening";
      snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Report Tier</span><div style="${coverSnapshotValueStyle}">${modeLabel}</div></div>`);
      const snapHtml = snapRows.length > 0
        ? `<div style="margin-top:0;padding-top:0;">${snapRows.join("")}</div>`
        : "";
      finalHtml = replaceAll(finalHtml, "{{COVER_ASSET_SNAPSHOT}}", snapHtml);
    }
    const reportTypeLabel = effectiveReportMode === "v1_core" ? "Acquisition Memo" : "Preliminary Investment Screening Memorandum";
    finalHtml = replaceAll(finalHtml, "{{REPORT_TYPE_LABEL}}", reportTypeLabel);
    finalHtml = replaceAll(finalHtml, "{{COVER_REPORT_TYPE_LABEL}}", reportTypeLabel);
    if (effectiveReportMode === "v1_core") {
      finalHtml = finalHtml.replace(
        /<p class="small" style="margin-top:8px;">\s*This report is a preliminary investment screening memorandum\. Full refinance, debt, and valuation modeling are provided in the Underwriting Report\.\s*<\/p>/i,
        ""
      );
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{PRIMARY_PRESSURE_POINT}}",
      primaryPressurePoint
    );
    if (whyLine || decisionContextHtml || miniSensitivityHtml || sourceReconciliationNarrativePolicy.disclosure_label) {
      const reconciliationDisclosureLine =
        sourceReconciliationNarrativePolicy.executive_summary_allowed &&
        !sourceReconciliationNarrativePolicy.primary_pressure_point_allowed &&
        sourceReconciliationNarrativePolicy.disclosure_label
          ? `<p class="exec-signal-line">${escapeHtml(sourceReconciliationNarrativePolicy.disclosure_label)}</p>`
          : "";
      const pressureLabel = String(primaryPressurePoint || "").startsWith("Primary Constraint:")
        ? "Primary Constraint"
        : "Primary Pressure Point";
      const pressureText = pressureLabel === "Primary Constraint"
        ? String(primaryPressurePoint || "").replace(/^Primary Constraint:\s*/i, "")
        : primaryPressurePoint;
      const pressureAnchor = `<div class="verdict-pressure">Primary Pressure Point &mdash; ${escapeHtml(primaryPressurePoint)}</div>`;
      const pressureReplacement = `<div class="verdict-pressure">${pressureLabel}: ${escapeHtml(pressureText)}</div>${
        whyLine ? `<p class="exec-signal-line">${escapeHtml(whyLine)}</p>` : ""
      }${reconciliationDisclosureLine}${decisionContextHtml}${miniSensitivityHtml}`;
      if (finalHtml.includes(pressureAnchor)) {
        finalHtml = finalHtml.replace(pressureAnchor, pressureReplacement);
      }
    }
    finalHtml = replaceAll(finalHtml, "{{DRIVER_1_LABEL}}", driver1?.label || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_1_VALUE}}", driver1?.value || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_1_TRIGGER}}", driver1?.trigger || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_2_LABEL}}", driver2?.label || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_2_VALUE}}", driver2?.value || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_2_TRIGGER}}", driver2?.trigger || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_3_LABEL}}", driver3?.label || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_3_VALUE}}", driver3?.value || "");
    finalHtml = replaceAll(finalHtml, "{{DRIVER_3_TRIGGER}}", driver3?.trigger || "");
    if (effectiveReportMode === "screening_v1") {
      finalHtml = sanitizeScreeningRankedDriversHtml(finalHtml);
    }
    // Ranked drivers are screening-only and only render when a true pressure driver exists.
    if (effectiveReportMode === "v1_core" || !driver1) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_RANKED_DRIVERS");
    }
    // Build exec verdict expansion: classification framework + investment thesis
    let acquisitionMemoSummaryBlockHtml = "";
    let operatingSnapshotBlockHtml = "";
    let rentUpsideValueSensitivityBlockHtml = "";
    let capRateValueIndicationBlockHtml = "";
    let preliminaryFinancingReadinessSummaryBlockHtml = "";
    let sourceContextBlockHtml = "";
    let dataCoverageBlockHtml = "";
    let execVerdictExpansionHtml = "";
    const acquisitionMemoUnits = coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
    const rrUnits = Number.isFinite(acquisitionMemoUnits) ? acquisitionMemoUnits : null;
    let hasForwardLookingRenovationInputs = false;
    const renderedDocumentTreatmentRows = [];
    let sourcePackageQaFiles = [];
    let sourcePackageQaArtifacts = [];
    let coverageFiles = Array.isArray(documentSources) ? documentSources : [];
    let coverageArtifacts = [];
    if (isFullRenderHarness && body?.__test_payloads && typeof body.__test_payloads === "object" && Array.isArray(body.__test_payloads.coverageArtifacts)) {
      coverageArtifacts = body.__test_payloads.coverageArtifacts;
    }
    if (jobId) {
      const { data: jobFiles, error: jobFilesErr } = await supabase
        .from("analysis_job_files")
        .select("id, original_filename, doc_type, mime_type, parse_status, parse_error")
        .eq("job_id", jobId);
      if (!jobFilesErr && Array.isArray(jobFiles)) {
        coverageFiles = jobFiles;
      }
      const { data: artifactRows, error: artifactRowsErr } = await supabase
        .from("analysis_artifacts")
        .select("type, payload, created_at")
        .eq("job_id", jobId)
        .in("type", [
          "rent_roll_parsed",
          "t12_parsed",
          "loan_term_sheet_parsed",
          "mortgage_statement_parsed",
          "renovation_parsed",
          "appraisal_parsed",
          "property_tax_parsed",
          "document_text_extracted",
        ])
        .order("created_at", { ascending: false });
      if (!artifactRowsErr && Array.isArray(artifactRows)) {
        coverageArtifacts = artifactRows;
      }
    }
    sourcePackageQaFiles = coverageFiles;
    sourcePackageQaArtifacts = coverageArtifacts;
    const acqMemoV2SourceAuthorityEnabled =
      process.env.ACQ_MEMO_V2_SOURCE_AUTHORITY === "true" ||
      body?.__test_enable_acq_memo_v2_source_authority === true;
    let acquisitionMemoV2Bridge = null;
    // --- V2 SOURCE AUTHORITY BRIDGE START ---
    if (effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled) {
      const canonicalSourcePackage = buildCanonicalSourcePackage(coverageFiles, coverageArtifacts);
      const acquisitionMemoProjection = buildAcquisitionMemoProjection(canonicalSourcePackage);
      const renderedAcquisitionMemo = renderAcquisitionMemo(acquisitionMemoProjection);
      acquisitionMemoV2Bridge = {
        canonicalSourcePackage,
        acquisitionMemoProjection,
        renderedAcquisitionMemo,
      };
    }
    // --- V2 SOURCE AUTHORITY BRIDGE END ---
    const supportFileRows = Array.isArray(coverageFiles)
      ? coverageFiles.filter((file) => {
        const text = String([
          file?.original_filename,
          file?.doc_type,
          file?.display_doc_type,
        ].filter(Boolean).join(" ")).toLowerCase();
        return !/(t12|rent[_\s-]*roll)/i.test(text);
      })
      : [];
    const canonicalSupportDocAuthorityRows = buildCanonicalSupportDocAuthorityRows({
      documentSources: supportFileRows,
      artifacts: coverageArtifacts,
      loanTermSheetTermsPayload,
      acquisitionTermsPayload,
      mortgagePayload,
      renovationPayload: null,
      propertyTaxPayload,
      appraisalPayload,
    });
    const canonicalSupportDocMap = new Map();
    const canonicalSupportDocAuthorityMapRows = [];
    const supportDocMapKeyForRow = (row = {}) => String(
      row?.file_id ||
      row?.source_file_id ||
      row?.document_id ||
      row?.artifact_file_id ||
      row?.id ||
      row?.canonical_support_doc_identity_key ||
      row?.original_filename ||
      ""
    ).trim().toLowerCase();
    for (const authority of canonicalSupportDocAuthorityRows) {
      if (!authority || typeof authority !== "object") continue;
      const mapKey = supportDocMapKeyForRow(authority);
      if (!mapKey) continue;
      canonicalSupportDocMap.set(mapKey, authority);
      const extractedText = String(
        authority?.source_text ||
        authority?.raw_text ||
        authority?.extracted_text ||
        authority?.notes ||
        authority?.loan_terms_text ||
        ""
      ).trim();
      canonicalSupportDocAuthorityMapRows.push({
        filename: authority?.original_filename || null,
        file_id: authority?.file_id || authority?.source_file_id || authority?.document_id || authority?.artifact_file_id || authority?.id || null,
        map_keys_written: [mapKey],
        extracted_text_present: Boolean(extractedText),
        extracted_text_snippet: extractedText ? extractedText.slice(0, 500) : null,
        parser_role: authority?.semantic_doc_role || null,
        parser_display_label: authority?.semantic_doc_display_label || null,
        authority_source: authority?.authoritySource || authority?.authority_source || null,
        final_canonical_role: authority?.canonical_support_doc_role || authority?.semantic_doc_role || null,
        final_display_label: authority?.document_role_label || authority?.semantic_doc_display_label || null,
        treatment: authority?.treatment_label || authority?.treatment || null,
        use: authority?.use_label || authority?.use || null,
        confidence: Number.isFinite(Number(authority?.confidence)) ? Number(authority.confidence) : null,
        outstanding_balance: authority?.outstanding_balance ?? authority?.current_outstanding_balance ?? authority?.current_loan_balance ?? null,
        purchase_price: authority?.purchase_price ?? authority?.acquisition_price ?? authority?.asking_price ?? null,
        total_budget: authority?.total_budget ?? authority?.total_capex ?? authority?.renovation_budget ?? null,
        interest_rate: authority?.interest_rate ?? null,
        amortization_years: authority?.amortization_years ?? authority?.amort_years ?? null,
        ltv: authority?.ltv ?? null,
        lender_fee_percent: authority?.lender_fee_percent ?? authority?.financing_fee_percent ?? authority?.origination_fee_percent ?? null,
        rent_lift: authority?.rent_lift ?? null,
        timing_or_phasing: authority?.timing_or_phasing ?? null,
        budget_rows: Array.isArray(authority?.budget_rows) ? authority.budget_rows : null,
        execution_rows: Array.isArray(authority?.execution_rows) ? authority.execution_rows : null,
        invariant_status: authority?.treatment_category || null,
      });
    }
    const canonicalSupportDocAuthorityMapArtifact = {
      type: "canonical_support_doc_authority_map",
      bucket: "internal",
      payload: canonicalSupportDocAuthorityMapRows,
    };
    const renderAcquisitionAuthorityRow = canonicalSupportDocAuthorityRows.find((row) =>
      row?.has_acquisition_support === true ||
      row?.has_proposed_acquisition_financing === true ||
      /(purchase_assumptions|proposed_acquisition_financing)/i.test(String(row?.canonical_support_doc_role || ""))
    ) || null;
    const acquisitionMemoRenderContext = {
      units: acquisitionMemoUnits,
      occupiedUnits: coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units),
      vacantUnits:
        Number.isFinite(acquisitionMemoUnits) &&
        Number.isFinite(coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units))
          ? Math.max(
              acquisitionMemoUnits - coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units),
              0
            )
          : null,
      occupancy: execOccupancy,
      annualInPlaceRent: execAnnualInPlace,
      annualMarketRent: coerceNumber(
        rentRollAnnualTotals?.market?.value ??
        computedRentRoll?.total_annual_market ??
        rentRollPayload?.total_annual_market
      ),
      annualRentUpside: marketRentPremiumRatio,
      rentGapPercent: Number.isFinite(marketRentPremiumRatio) ? marketRentPremiumRatio * 100 : null,
      egi: execEgi,
      opEx: execOpex,
      noi: execNoi,
      expenseRatio: expenseRatioR,
      noiMargin: noiMarginR,
      breakEvenOccupancy: breakEvenOccR,
      purchasePrice: Number.isFinite(coerceNumber(acquisitionTermsPayload?.purchase_price))
        ? coerceNumber(acquisitionTermsPayload?.purchase_price)
        : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price))
          ? coerceNumber(loanTermSheetTermsPayload?.purchase_price)
          : Number.isFinite(coerceNumber(renderAcquisitionAuthorityRow?.purchase_price))
            ? coerceNumber(renderAcquisitionAuthorityRow?.purchase_price)
          : null,
      goingInCapRate: Number.isFinite(coerceNumber(acquisitionTermsPayload?.going_in_cap_rate))
        ? coerceNumber(acquisitionTermsPayload?.going_in_cap_rate)
        : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate))
          ? coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate)
          : Number.isFinite(coerceNumber(renderAcquisitionAuthorityRow?.going_in_cap_rate))
            ? coerceNumber(renderAcquisitionAuthorityRow?.going_in_cap_rate)
          : null,
      acquisitionNoiBasis: execNoi,
      hasForwardLookingRenovationInputs,
      renovationDisplayMode: null,
      renovationPayload: null,
      propertyTaxPayload,
      propertyTaxBindingState,
      documentQuantitativeUsageMap,
      documentSources,
      canonicalSupportDocMap,
      supportDocAuthorityRows: canonicalSupportDocAuthorityRows,
      canonical_support_doc_authority_map: canonicalSupportDocAuthorityMapArtifact,
    };
    if (effectiveReportMode === "screening_v1" && screeningVisibleClassificationForConsumers) {
      const tierDefs = [
        { name: "Stable",     er: "< 55%",   nm: "> 45%",  beo: "< 75%" },
        { name: "Sensitized", er: "55\u201365%", nm: "35\u201345%", beo: "75\u201385%" },
        { name: "Fragile",    er: "> 65%",   nm: "< 35%",  beo: "> 85%" },
      ];
      const tierRows = tierDefs.map((t) => {
        const isCurrent = t.name === screeningVisibleClassificationForConsumers;
        const rowStyle = isCurrent ? ` style="font-weight:600;background:#f0f9ff;"` : "";
        const marker = isCurrent ? " \u25B6" : "";
        return `<tr${rowStyle}><td>${escapeHtml(t.name + marker)}</td><td>${t.er}</td><td>${t.nm}</td><td>${t.beo}</td></tr>`;
      }).join("");
      const screeningClassificationDisclosure =
        /^(Stable|Sensitized|Fragile)$/i.test(screeningVisibleClassificationForConsumers)
          ? ""
          : `<p class="small" style="color:#64748b;margin-top:6px;">Current classification: ${escapeHtml(screeningVisibleClassificationForConsumers)}.</p>`;
      const frameworkCard = `<div class="card no-break" style="margin-top:16px;"><p class="subsection-title">Classification Framework</p><table><thead><tr><th>Tier</th><th>Expense Ratio</th><th>NOI Margin</th><th>Break-even Occ.</th></tr></thead><tbody>${tierRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Standardized underwriting thresholds. &#9654; = current classification.</p>${screeningClassificationDisclosure}</div>`;
      // Investment thesis: fully deterministic
      const rrOccNow = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
      const rrInPlace = coerceNumber(rentRollAnnualTotals?.in_place?.value);
      const rrMarket  = coerceNumber(rentRollAnnualTotals?.market?.value);
      const rrUpsidePct = coerceNumber(computedRentRoll?.rent_to_market_gap) ??
        ((Number.isFinite(rrInPlace) && Number.isFinite(rrMarket) && rrInPlace > 0)
          ? (rrMarket - rrInPlace) / rrInPlace : null);
      const erPctStr  = Number.isFinite(expenseRatioR) ? `${(expenseRatioR * 100).toFixed(1)}%` : null;
      const nmPctStr  = Number.isFinite(noiMarginR)    ? `${(noiMarginR * 100).toFixed(1)}%`    : null;
      const parts = [];
      if (Number.isFinite(rrOccNow)) parts.push(`The property is ${formatPercent1(rrOccNow)} occupied`);
      if (Number.isFinite(rrUpsidePct) && rrUpsidePct > 0) parts.push(`carries reported rent-to-market upside of ${formatPercent1(rrUpsidePct)}`);
      let thesisText = parts.length > 0 ? parts.join(" and ") + ". " : "";
      if (screeningVisibleClassificationForConsumers === "Sensitized" && erPctStr && nmPctStr) {
        thesisText += `NOI margin compression to ${nmPctStr}, primarily attributable to a ${erPctStr} expense ratio, supports a Sensitized classification. Operating improvement sensitivity is tied to expense-ratio reduction and the observed rent-to-market gap.`;
      } else if (screeningVisibleClassificationForConsumers === "Fragile" && erPctStr) {
        thesisText += `An expense ratio of ${erPctStr} and compressed margins classify the profile as Fragile. Material operational improvement is required.`;
      } else if (screeningVisibleClassificationForConsumers === "Stable") {
        thesisText += `Operating results remain stable based on uploaded operating data.`;
      }
      const thesisCard = thesisText
        ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Summary</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0 0 6px 0;">${escapeHtml(thesisText)}</p><p class="small" style="color:#64748b;font-style:italic;">All statements derive from reported metrics and standardized classification thresholds. No forward-looking projections.</p></div>`
        : "";
      execVerdictExpansionHtml = `${frameworkCard}${thesisCard}`;
    } else if (effectiveReportMode === "v1_core" && screeningClass && screeningClass !== "Insufficient Data") {
      // Acquisition Memo: operating summary plus source context, not debt/refi profiling
      const annualMarketRentTokenValue = Number.isFinite(coerceNumber(rentRollAnnualTotals?.market?.value))
        ? coerceNumber(rentRollAnnualTotals?.market?.value)
        : null;
      const purchasePriceTokenValue = Number.isFinite(coerceNumber(acquisitionTermsPayload?.purchase_price))
        ? coerceNumber(acquisitionTermsPayload?.purchase_price)
        : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price))
          ? coerceNumber(loanTermSheetTermsPayload?.purchase_price)
          : null;
      const goingInCapRateTokenValue = Number.isFinite(coerceNumber(acquisitionTermsPayload?.going_in_cap_rate))
        ? coerceNumber(acquisitionTermsPayload?.going_in_cap_rate)
        : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate))
          ? coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate)
          : null;
      const summaryRows = [];
      if (Number.isFinite(acquisitionMemoRenderContext.occupancy)) summaryRows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.occupancy)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.annualInPlaceRent)) summaryRows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatCurrency(acquisitionMemoRenderContext.annualInPlaceRent)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.annualMarketRent)) summaryRows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatCurrency(acquisitionMemoRenderContext.annualMarketRent)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.annualRentUpside)) summaryRows.push(`<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.annualRentUpside)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.expenseRatio)) summaryRows.push(`<tr><td>Expense Ratio</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.expenseRatio)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.noiMargin)) summaryRows.push(`<tr><td>NOI Margin</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.noiMargin)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.breakEvenOccupancy)) summaryRows.push(`<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.breakEvenOccupancy)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.purchasePrice)) summaryRows.push(`<tr><td>Purchase Price</td><td style="font-weight:600;">${formatCurrency(acquisitionMemoRenderContext.purchasePrice)}</td></tr>`);
      if (Number.isFinite(acquisitionMemoRenderContext.goingInCapRate)) summaryRows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.goingInCapRate)}</td></tr>`);
      const summaryNote = "Source-bound acquisition memo summary using operating metrics, verified acquisition context, and disclosure-only support-doc treatment. Additional modeling remains deferred from the launch acquisition memo.";
      const contextNote = "Document treatment and data coverage later enumerate property tax corroboration, market survey context, CapEx context, appraisal context, environmental / Phase I context, and broker email auditability where present.";
      const summaryCard = `<div class="card no-break" style="margin-top:16px;border-left:3px solid #B8860B;"><p class="subsection-title">Acquisition Memo Summary: <span style="color:#1e293b;">${coverClassificationLabel.toUpperCase()}</span></p><table><tbody>${summaryRows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:6px;">${escapeHtml(summaryNote)}</p></div>`;
      const contextCard = `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Source Context</p><p class="small" style="margin:0;color:#374151;line-height:1.6;">${escapeHtml(contextNote)}</p></div>`;
      acquisitionMemoSummaryBlockHtml = buildAcquisitionMemoSummaryCard({
        units: acquisitionMemoRenderContext.units,
        occupancy: acquisitionMemoRenderContext.occupancy,
        annualInPlace: acquisitionMemoRenderContext.annualInPlaceRent,
        annualMarket: acquisitionMemoRenderContext.annualMarketRent,
        annualUpsideRatio: acquisitionMemoRenderContext.annualRentUpside,
        purchasePrice: acquisitionMemoRenderContext.purchasePrice,
        goingInCapRate: acquisitionMemoRenderContext.goingInCapRate,
        noi: acquisitionMemoRenderContext.acquisitionNoiBasis,
        formatCurrency,
        formatPercent1,
      });
      operatingSnapshotBlockHtml = buildOperatingSnapshotCard({
        units: acquisitionMemoRenderContext.units,
        occupancy: acquisitionMemoRenderContext.occupancy,
        annualInPlace: acquisitionMemoRenderContext.annualInPlaceRent,
        egi: acquisitionMemoRenderContext.egi,
        operatingExpenses: acquisitionMemoRenderContext.opEx,
        noi: acquisitionMemoRenderContext.noi,
        expenseRatio: acquisitionMemoRenderContext.expenseRatio,
        noiMargin: acquisitionMemoRenderContext.noiMargin,
        breakEvenOccupancy: acquisitionMemoRenderContext.breakEvenOccupancy,
        formatCurrency,
        formatPercent1,
      });
      rentUpsideValueSensitivityBlockHtml = buildRentUpsideValueSensitivityCard({
        annualInPlace: acquisitionMemoRenderContext.annualInPlaceRent,
        annualMarket: acquisitionMemoRenderContext.annualMarketRent,
        formatCurrency,
      });
      capRateValueIndicationBlockHtml = buildCapRateValueTable(
        acquisitionMemoRenderContext.acquisitionNoiBasis,
        acquisitionMemoRenderContext.units,
        acquisitionMemoRenderContext.goingInCapRate ?? appraisalCapRateBase
      );
      preliminaryFinancingReadinessSummaryBlockHtml = buildPreliminaryFinancingReadinessSummaryHtml({
        reportMode: effectiveReportMode,
        acquisitionMemoRenderContext,
        acquisitionMemoV2Projection: acquisitionMemoV2Bridge?.acquisitionMemoProjection || null,
        acquisitionAssumptionState: underwritingState?.core?.acquisition?.assumptionState || null,
        currentDebtAssessmentState,
        mortgagePayload,
        loanTermSheetTermsPayload,
        acquisitionTermsPayload,
        propertyTaxPayload,
        propertyTaxBindingState,
        sourceReportCoverageQa,
        supportDocAuthorityRows: acquisitionMemoRenderContext.supportDocAuthorityRows,
        canonicalSupportDocMap: acquisitionMemoRenderContext.canonicalSupportDocMap,
        formatCurrency,
        formatPercent1,
        formatInterestRatePercent,
      });
      sourceContextBlockHtml = buildLaunchSourceContextBlock({
        reportMode: effectiveReportMode,
        documentSources: acquisitionMemoRenderContext.documentSources,
        currentDebtAssessmentState,
        canonicalAcquisitionState:
          underwritingState?.core?.acquisition?.assumptionState ||
          null,
        loanTermSheetTermsPayload,
        acquisitionTermsPayload,
        hasForwardLookingRenovationInputs: acquisitionMemoRenderContext.hasForwardLookingRenovationInputs,
        renovationDisplayMode: acquisitionMemoRenderContext.renovationDisplayMode,
        renovationPayload: acquisitionMemoRenderContext.renovationPayload,
        propertyTaxPayload: acquisitionMemoRenderContext.propertyTaxPayload,
        propertyTaxBindingState: acquisitionMemoRenderContext.propertyTaxBindingState,
        documentQuantitativeUsageMap: acquisitionMemoRenderContext.documentQuantitativeUsageMap,
        supportDocAuthorityRows: acquisitionMemoRenderContext.supportDocAuthorityRows,
        canonicalSupportDocMap: acquisitionMemoRenderContext.canonicalSupportDocMap,
        renderedDocumentTreatmentRowsOut: renderedDocumentTreatmentRows,
      });
      dataCoverageBlockHtml = "";
      execVerdictExpansionHtml = `${summaryCard}${contextCard}`;
    }
    const acquisitionRenderStateFromBuilder = underwritingState?.core?.acquisition || {};
    const acquisitionFinancingAssumptionsRender = buildAcquisitionFinancingAssumptionsHtml({
      loanTermSheetTermsPayload,
      acquisitionTermsPayload,
      t12Payload,
      reportType,
      reportTier,
      acquisitionTriangleValidationState: acquisitionRenderStateFromBuilder?.triangleValidationState || null,
      returnState: true,
    });
    const acquisitionFinancingAssumptionsHtml =
      typeof acquisitionFinancingAssumptionsRender === "string"
        ? acquisitionFinancingAssumptionsRender
        : acquisitionFinancingAssumptionsRender?.html || "";
    if (underwritingState?.core?.acquisition && acquisitionFinancingAssumptionsRender && typeof acquisitionFinancingAssumptionsRender === "object") {
      underwritingState.core.acquisition.triangleValidationState =
        acquisitionFinancingAssumptionsRender.triangleValidationState || null;
      underwritingState.core.acquisition.renderBehavior =
        acquisitionFinancingAssumptionsRender.renderBehavior || null;
    }
    const acquisitionFinancingReadinessHtml = buildAcquisitionFinancingReadinessHtml({
      loanTermSheetTermsPayload,
      acquisitionTermsPayload,
      t12Payload,
      reportMode: effectiveReportMode,
      currentDebtAssessmentState,
      supportDocAuthorityRows: acquisitionMemoRenderContext.supportDocAuthorityRows,
    });
    const neighborhoodAnnualMarketRentValue = Number.isFinite(coerceNumber(rentRollAnnualTotals?.market?.value))
      ? coerceNumber(rentRollAnnualTotals?.market?.value)
      : null;
    const neighborhoodPurchasePriceValue = Number.isFinite(coerceNumber(acquisitionTermsPayload?.purchase_price))
      ? coerceNumber(acquisitionTermsPayload?.purchase_price)
      : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.purchase_price))
        ? coerceNumber(loanTermSheetTermsPayload?.purchase_price)
        : null;
    const neighborhoodGoingInCapRateValue = Number.isFinite(coerceNumber(acquisitionTermsPayload?.going_in_cap_rate))
      ? coerceNumber(acquisitionTermsPayload?.going_in_cap_rate)
      : Number.isFinite(coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate))
        ? coerceNumber(loanTermSheetTermsPayload?.going_in_cap_rate)
        : null;
    const neighborhoodContextRows = [];
    if (Number.isFinite(acquisitionMemoRenderContext.occupancy)) neighborhoodContextRows.push(`<tr><td>Occupancy</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.occupancy)}</td></tr>`);
    if (Number.isFinite(acquisitionMemoRenderContext.annualInPlaceRent)) neighborhoodContextRows.push(`<tr><td>Annual In-Place Rent</td><td style="font-weight:600;">${formatCurrency(acquisitionMemoRenderContext.annualInPlaceRent)}</td></tr>`);
    if (Number.isFinite(neighborhoodAnnualMarketRentValue)) neighborhoodContextRows.push(`<tr><td>Annual Market Rent</td><td style="font-weight:600;">${formatCurrency(neighborhoodAnnualMarketRentValue)}</td></tr>`);
    if (Number.isFinite(acquisitionMemoRenderContext.annualRentUpside)) neighborhoodContextRows.push(`<tr><td>Annual Rent Upside</td><td style="font-weight:600;">${formatPercent1(acquisitionMemoRenderContext.annualRentUpside)}</td></tr>`);
    if (Number.isFinite(neighborhoodPurchasePriceValue)) neighborhoodContextRows.push(`<tr><td>Purchase Price</td><td style="font-weight:600;">${formatCurrency(neighborhoodPurchasePriceValue)}</td></tr>`);
    if (Number.isFinite(neighborhoodGoingInCapRateValue)) neighborhoodContextRows.push(`<tr><td>Going-In Cap Rate</td><td style="font-weight:600;">${formatPercent1(neighborhoodGoingInCapRateValue)}</td></tr>`);
    const neighborhoodContextHtml = neighborhoodContextRows.length > 0
      ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">${effectiveReportMode === "screening_v1" ? "Source Context" : "Acquisition Context"}</p><table><tbody>${neighborhoodContextRows.join("")}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:6px;">${effectiveReportMode === "screening_v1" ? "Source-bound operating context only. Advanced financing and return-projection modules are outside the Screening Report scope." : "Source-bound operating and acquisition context only. No projections, debt sizing, refinance, or return modeling."}</p></div>`
      : (effectiveReportMode === "v1_core"
        ? `<p class="small" style="margin:0;color:#374151;line-height:1.6;">Source-supported context is limited to operating metrics currently available from T12 and rent roll inputs. Advanced financing and return-projection modules remain excluded from this report.</p>`
        : "");
    finalHtml = replaceAll(finalHtml, "{{EXEC_VERDICT_EXPANSION}}", execVerdictExpansionHtml);
    finalHtml = replaceAll(finalHtml, "{{ACQUISITION_MEMO_SUMMARY_BLOCK}}", acquisitionMemoSummaryBlockHtml);
    finalHtml = replaceAll(finalHtml, "{{OPERATING_SNAPSHOT_BLOCK}}", operatingSnapshotBlockHtml);
    finalHtml = replaceAll(finalHtml, "{{RENT_UPSIDE_VALUE_SENSITIVITY_BLOCK}}", rentUpsideValueSensitivityBlockHtml);
    finalHtml = replaceAll(finalHtml, "{{CAP_RATE_VALUE_INDICATION_BLOCK}}", capRateValueIndicationBlockHtml);
    finalHtml = replaceAll(finalHtml, "{{NEIGHBORHOOD_CONTEXT_BLOCK}}", sourceContextBlockHtml || neighborhoodContextHtml);
    finalHtml = replaceAll(finalHtml, "{{KEY_UPSIDE_DRIVERS_BULLETS}}", upsideHtml);
    finalHtml = replaceAll(finalHtml, "{{KEY_RISKS_BULLETS}}", risksHtml);
    if (!(effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.renderedAcquisitionMemo)) {
      finalHtml = replaceAll(finalHtml, "{{PRELIMINARY_FINANCING_READINESS_SUMMARY_BLOCK}}", preliminaryFinancingReadinessSummaryBlockHtml);
      finalHtml = replaceMarkedSection(
        finalHtml,
        "SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY",
        `<!-- BEGIN SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->${preliminaryFinancingReadinessSummaryBlockHtml || ""}<!-- END SECTION_0_8_PRELIMINARY_FINANCING_READINESS_SUMMARY -->`
      );
    }
    const acquisitionMemoV2DocumentArgs = {
      acquisitionMemoProjection: acquisitionMemoV2Bridge?.acquisitionMemoProjection || null,
      renderedAcquisitionMemo: acquisitionMemoV2Bridge?.renderedAcquisitionMemo || null,
      sourcePackage: acquisitionMemoV2Bridge?.canonicalSourcePackage || null,
      coreMetrics: {
        occupancy: execOccupancy,
        annualInPlaceRent: execAnnualInPlace,
        annualMarketRent: acquisitionMemoRenderContext?.annualMarketRent ?? null,
        egi: execEgi,
        opEx: execOpex,
        noi: execNoi,
        expenseRatio: expenseRatioR,
        noiMargin: noiMarginR,
        breakEvenOccupancy: breakEvenOccR,
        purchasePrice: acquisitionMemoRenderContext?.purchasePrice ?? null,
        goingInCapRate: acquisitionMemoRenderContext?.goingInCapRate ?? null,
      },
      reportMeta: {
        reportType,
        reportMode: effectiveReportMode,
        reportTier,
        generatedAt: new Date().toISOString(),
        propertyName: propertyNameDisplay,
        propertyAddress: displayPropertyAddress,
        propertyTitle: displayPropertyTitle,
      },
      propertyProfile: {
        propertyName: propertyNameDisplay,
        propertyAddress: displayPropertyAddress,
        propertyTitle: displayPropertyTitle,
      },
    };
    if (!String(upsideHtml || "").trim()) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_UPSIDE_BULLETS");
    }
    if (!String(risksHtml || "").trim()) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_RISK_BULLETS");
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{OPERATING_CUSHION}}",
      Number.isFinite(operatingCushionPct) ? `${operatingCushionPct.toFixed(1)}%` : ""
    );
    finalHtml = finalHtml.replace(
      "{{UNIT_VALUE_ADD}}",
      getNarrativeHtml("unitValueAdd")
    );
    finalHtml = finalHtml.replace(
      "{{CASH_FLOW_PROJECTIONS}}",
      getNarrativeHtml("cashFlowProjections")
    );
    finalHtml = finalHtml.replace(
      "{{NEIGHBORHOOD_ANALYSIS}}",
      getNarrativeHtml("neighborhoodAnalysis")
    );
    finalHtml = finalHtml.replace(
      "{{RISK_ASSESSMENT}}",
      getNarrativeHtml("riskAssessment")
    );
    finalHtml = finalHtml.replace(
      "{{RENOVATION_NARRATIVE}}",
      getNarrativeHtml("renovationNarrative")
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_STRATEGY}}",
      getNarrativeHtml("renovationNarrative")
    );
    finalHtml = finalHtml.replace(
      "{{DEBT_STRUCTURE}}",
      getNarrativeHtml("debtStructure")
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{ACQUISITION_FINANCING_ASSUMPTIONS}}",
      acquisitionFinancingAssumptionsHtml
    );
    if (effectiveReportMode === "v1_core" && acquisitionFinancingReadinessHtml) {
      finalHtml = replaceMarkedSection(
        finalHtml,
        "SECTION_7_DEBT",
        `<!-- BEGIN SECTION_7_DEBT -->
<section class="section page-break">
  <div class="no-break">
    <div class="section-header">
      <span class="section-header-eyebrow">Section 03</span>
      <span class="section-header-title">Proposed Acquisition Financing Context</span>
      <span class="section-header-sub">Source-bound proposed acquisition financing context only</span>
    </div>
    ${acquisitionFinancingReadinessHtml}
  </div>
</section>
<!-- END SECTION_7_DEBT -->`
      );
    }
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_SUMMARY}}",
      getNarrativeHtml("dealScoreSummary")
    );
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_INTERPRETATION}}",
      getNarrativeHtml("dealScoreInterpretation")
    );
    finalHtml = finalHtml.replace(
      "{{ADVANCED_MODELING_INTRO}}",
      getNarrativeHtml("advancedModelingIntro")
    );
    const dcfInterpretationHtml = getNarrativeHtml("dcfInterpretation");
    const dcfSourceReconciliationLimitation =
      effectiveReportMode === "v1_core" &&
      buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required
        ? `<p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Framework value sensitivity is based on reported T12 NOI and remains subject to the rent roll/T12 reconciliation disclosure in Data Coverage.</p>`
        : "";
    finalHtml = finalHtml.replace(
      "{{DCF_INTERPRETATION}}",
      `${dcfInterpretationHtml}${dcfSourceReconciliationLimitation}`
    );
    finalHtml = finalHtml.replace(
      "{{FINAL_RECOMMENDATION}}",
      getNarrativeHtml("finalRecommendation")
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RELATIVE_POSITIONING_COPY}}",
      buildRelativePositioningCopy(tables.comps || [])
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RELATIVE_POSITIONING_NOTE}}",
      hasMeaningfulComparableRows(tables.comps || [])
        ? "Comparable positioning remains limited to the supported market context shown above and is not extrapolated beyond document-backed rows."
        : ""
    );
    const suppressUnitLevelRentLift =
      computedRentRoll?.is_partial_sample === true;
    const unitMix = suppressUnitLevelRentLift
      ? null
      : computedRentRoll?.unit_mix || rentRollPayload?.unit_mix;
    const unitMixRows = suppressUnitLevelRentLift
      ? ""
      : buildUnitMixRows(
          unitMix,
          computedRentRoll?.total_units ?? rentRollPayload?.total_units,
          formatCurrency
        );
    let descriptorLine = "";
    if (Number.isFinite(rrUnits) && rrUnits > 0) {
      descriptorLine = `${rrUnits}-Unit Multifamily`;
    }
    if (!descriptorLine) {
      finalHtml = stripMarkedSection(finalHtml, "PROPERTY_DESCRIPTOR_LINE");
    } else {
      finalHtml = replaceAll(finalHtml, "{{PROPERTY_DESCRIPTOR_LINE}}", descriptorLine);
    }
    finalHtml = finalHtml.replace(/ - \s*,\s*/g, "");
    finalHtml = finalHtml.replace(/-\s*,\s*/g, "");
    finalHtml = finalHtml.replace(/\s*,\s*<\/h1>/g, "</h1>");
    finalHtml = replaceAll(finalHtml, "{{UNIT_MIX_ROWS}}", unitMixRows || "");
    if (!summaryOnlyRentRollSurface && !String(unitMixRows || "").trim()) {
      finalHtml = finalHtml.replace(
        /<p class="subsection-title">Unit Mix and Rent Positioning<\/p>\s*<table class="unit-mix-table">[\s\S]*?<tbody>\s*<\/tbody>\s*<\/table>/i,
        ""
      );
    }
    if (summaryOnlyRentRollSurface) {
      finalHtml = collapseSummaryOnlyUnitMixSection(finalHtml, {
        summaryOnlyRentRollSurface: true,
        summaryTitle: effectiveReportMode === "screening_v1" ? "Summary Rent Positioning" : "Rent Positioning Evidence",
        summaryBody:
          effectiveReportMode === "screening_v1"
            ? "Summary totals indicate in-place rent is below documented market rent."
            : "Verified rent-roll summary totals indicate in-place rents are below documented market rent.",
        summaryMetrics: {
          totalUnits: coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units),
          occupiedUnits: coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units),
          occupancy: coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload)),
          annualInPlace: coerceNumber(rentRollAnnualTotals?.in_place?.value ?? computedRentRoll?.total_annual_in_place ?? rentRollPayload?.total_in_place_annual),
          annualMarket: coerceNumber(rentRollAnnualTotals?.market?.value ?? computedRentRoll?.total_annual_market ?? rentRollPayload?.total_market_annual),
          formatCurrency,
        },
      });
    }
    finalHtml = replaceAll(
      finalHtml,
      "{{UNIT_VALUE_ADD_RIGHT_COLUMN}}",
      suppressUnitLevelRentLift
        ? ""
        : effectiveReportMode === "screening_v1"
        ? (() => {
            const annualInPlace = coerceNumber(rentRollAnnualTotals?.in_place?.value ?? computedRentRoll?.total_annual_in_place);
            const annualMarket = coerceNumber(rentRollAnnualTotals?.market?.value ?? computedRentRoll?.total_annual_market);
            const occupancy = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
            const totalUnits = coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
            const occupiedUnits = coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units);
            if (summaryOnlyRentRollSurface) {
              return `<div class="card no-break"><p class="subsection-title">Source Context</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0;">Verified rent-roll summary totals were used because row-level unit mix was not provided. The metrics above remain source-bound and document-derived.</p></div>`;
            }
            if (
              Number.isFinite(annualInPlace) ||
              Number.isFinite(annualMarket) ||
              Number.isFinite(occupancy) ||
              Number.isFinite(totalUnits) ||
              Number.isFinite(occupiedUnits)
            ) {
              const summaryBody =
                Number.isFinite(annualInPlace) &&
                Number.isFinite(annualMarket) &&
                annualMarket > annualInPlace
                  ? "Rent roll data indicates in-place rents are below market across the current unit mix."
                  : "Source-bound rent positioning summary uses verified totals where available and leaves unsupported metrics unassessed.";
              return "";
            }
            return "";
          })()
        : (() => {
            const annualInPlace = coerceNumber(rentRollAnnualTotals?.in_place?.value ?? computedRentRoll?.total_annual_in_place);
            const annualMarket = coerceNumber(rentRollAnnualTotals?.market?.value ?? computedRentRoll?.total_annual_market);
            const occupancy = coerceNumber(resolveOccupancyNoteValue(computedRentRoll, rentRollPayload));
            const totalUnits = coerceNumber(computedRentRoll?.total_units ?? rentRollPayload?.total_units);
            const occupiedUnits = coerceNumber(computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units);
            if (
              Number.isFinite(annualInPlace) ||
              Number.isFinite(annualMarket) ||
              Number.isFinite(occupancy) ||
              Number.isFinite(totalUnits) ||
              Number.isFinite(occupiedUnits)
            ) {
              if (summaryOnlyRentRollSurface) {
                return "";
              }
              const summaryBody =
                Number.isFinite(annualInPlace) &&
                Number.isFinite(annualMarket) &&
                annualMarket > annualInPlace
                  ? "Rent roll data indicates in-place rents are below documented market rent across the current unit mix."
                  : "Source-bound rent positioning evidence uses verified totals where available and leaves unsupported metrics unassessed.";
              return buildRentPositioningSummaryCard({
                title: "Rent Positioning Summary",
                body: summaryBody,
                totalUnits,
                occupiedUnits,
                occupancy,
                annualInPlace,
                annualMarket,
                formatCurrency,
              });
            }
            return "";
          })()
    );
    // Rent Upside Pathway card: full-width below the grid
    {
      let upsideHtml = "";
      const annualInPlace = coerceNumber(rentRollAnnualTotals?.in_place?.value ?? computedRentRoll?.total_annual_in_place);
      const annualMarket  = coerceNumber(rentRollAnnualTotals?.market?.value ?? computedRentRoll?.total_annual_market);
      if (!suppressUnitLevelRentLift && effectiveReportMode === "screening_v1" && Number.isFinite(annualInPlace) && annualInPlace > 0 && Number.isFinite(annualMarket) && annualMarket > annualInPlace) {
        const annualGap = annualMarket - annualInPlace;
        const capRates = [5.0, 6.0, 7.0];
        const capRows = capRates.map(cap => {
          const impliedLift = annualGap / (cap / 100);
          return `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">${cap.toFixed(1)}% cap rate</td>` +
            `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">${formatCurrency(impliedLift)}</td></tr>`;
        }).join("");
        upsideHtml = `<div class="no-break" style="margin-top:20px;border-top:1px solid #E5E7EB;padding-top:16px;">` +
          `<p class="subsection-title" style="margin-bottom:8px;">Rent Upside Pathway: Mark-to-Market Analysis</p>` +
          `<div class="grid-2">` +
          `<div><table style="width:100%;border-collapse:collapse;font-size:11px;">` +
          `<tbody>` +
          `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Annual In-Place Rent</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(annualInPlace)}</td></tr>` +
          `<tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Annual Market Rent</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(annualMarket)}</td></tr>` +
          `<tr style="background:#FEFCE8;font-weight:700;"><td style="padding:4px 8px;border:1px solid #E5E7EB;color:#B8860B;">Annual Gross Rent Upside</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;color:#B8860B;">${formatCurrency(annualGap)}</td></tr>` +
          `</tbody></table></div>` +
          `<div><p class="subsection-title" style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;margin-bottom:4px;">Implied Value Sensitivity at Stabilization</p>` +
          `<table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>${capRows}</tbody></table>` +
          `<p class="small" style="margin-top:6px;">Implied value sensitivity reflects annual rent gap capitalized at the selected cap-rate assumption and remains conditional on market-rent capture and occupancy.</p></div>` +
          `</div></div>`;
      }
      finalHtml = replaceAll(finalHtml, "{{UNIT_VALUE_ADD_UPSIDE_PATHWAY}}", upsideHtml);
    }
    const hasAnyAvgSqft =
      Array.isArray(unitMix) &&
      unitMix.some((r) => Number.isFinite(Number(r?.avg_sqft)) && Number(r.avg_sqft) > 0);
    if (!hasAnyAvgSqft) {
      finalHtml = finalHtml.replace(
        /(<table[^>]*class="[^"]*unit-mix-table[^"]*"[^>]*>[\s\S]*?<thead>[\s\S]*?<tr>[\s\S]*?)<th>\s*Avg\s*Sq\s*Ft\s*<\/th>\s*([\s\S]*?<\/tr>[\s\S]*?<\/thead>[\s\S]*?<tbody>)([\s\S]*?)(<\/tbody>[\s\S]*?<\/table>)/i,
        (_, beforeHeader, afterHeader, tbodyHtml, tableEnd) => {
          const updatedTbody = String(tbodyHtml || "").replace(
            /(<tr>\s*<td[\s\S]*?<\/td>\s*<td[\s\S]*?<\/td>\s*)<td[\s\S]*?<\/td>\s*/gi,
            "$1"
          );
          return `${beforeHeader}${afterHeader}${updatedTbody}${tableEnd}`;
        }
      );
    }
    const occupancyValue = resolveOccupancyNoteValue(computedRentRoll, rentRollPayload);
    finalHtml = injectOccupancyNote(finalHtml, occupancyValue);
    const t12EgiValue = coerceNumber(t12Payload?.effective_gross_income);
    const t12TotalExpensesValue = coerceNumber(t12Payload?.total_operating_expenses);
    const t12NoiValue = coerceNumber(t12Payload?.net_operating_income);
    const t12ExpenseRatioValue =
      Number.isFinite(t12EgiValue) &&
      Number.isFinite(t12TotalExpensesValue) &&
      t12EgiValue > 0
        ? formatPercent1(t12TotalExpensesValue / t12EgiValue)
        : DATA_NOT_AVAILABLE;
    const t12IncomeRowsRaw = buildT12IncomeRows(t12Payload, formatCurrency);
    const t12ExpenseRowsRaw = buildT12ExpenseRows(t12Payload, formatCurrency);
    const t12IncomeRows = String(t12IncomeRowsRaw || "").trim()
      ? t12IncomeRowsRaw
      : Number.isFinite(t12EgiValue)
      ? `<tr><td colspan="2" style="color:#64748b;font-style:italic;">No line-item detail available. Effective Gross Income (TTM): ${formatCurrency(t12EgiValue)}.</td></tr>`
      : "";
    const t12ExpenseRows = String(t12ExpenseRowsRaw || "").trim()
      ? t12ExpenseRowsRaw
      : Number.isFinite(t12TotalExpensesValue)
      ? `<tr><td colspan="2" style="color:#64748b;font-style:italic;">No line-item detail available. Total Operating Expenses (TTM): ${formatCurrency(t12TotalExpensesValue)}.</td></tr>`
      : "";
    finalHtml = replaceAll(finalHtml, "{{T12_INCOME_ROWS}}", effectiveReportMode === "screening_v1" ? "" : (t12IncomeRows || ""));
    finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_ROWS}}", effectiveReportMode === "screening_v1" ? "" : (t12ExpenseRows || ""));
    if (!String(t12IncomeRows || "").trim()) {
      finalHtml = stripMarkedSection(finalHtml, "T12_INCOME_TABLE");
      finalHtml = stripT12DetailSubsection(finalHtml, "Income Reconstruction (TTM)");
    }
    if (!String(t12ExpenseRows || "").trim()) {
      finalHtml = stripMarkedSection(finalHtml, "T12_EXPENSE_TABLE");
      finalHtml = stripT12DetailSubsection(finalHtml, "Operating Expenses (TTM)");
    }
    finalHtml = stripEmptyHeadingBlocks(finalHtml);
    finalHtml = stripThinSectionPages(finalHtml);
    finalHtml = replaceAll(
      finalHtml,
      "{{T12_EGI}}",
      Number.isFinite(t12EgiValue) ? formatCurrency(t12EgiValue) : DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{T12_TOTAL_EXPENSES}}",
      Number.isFinite(t12TotalExpensesValue)
        ? formatCurrency(t12TotalExpensesValue)
        : DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{T12_NOI}}",
      Number.isFinite(t12NoiValue) ? formatCurrency(t12NoiValue) : DATA_NOT_AVAILABLE
    );
    finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_RATIO}}", t12ExpenseRatioValue);
    finalHtml = replaceAll(
      finalHtml,
      "{{T12_PER_UNIT_ROWS}}",
      buildT12PerUnitRows(t12EgiValue, t12TotalExpensesValue, t12NoiValue, rrUnits)
    );
    const screeningIncomeForensicsHtml = buildScreeningIncomeForensicsHtml({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
      sourceReconciliationState,
    });
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_INCOME_FORENSICS_BLOCK}}",
      screeningIncomeForensicsHtml
    );
    const screeningExpenseHtml = buildScreeningExpenseStructureHtml({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
    });
    const screeningNoiHtml = buildScreeningNoiStabilityHtml({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
      sourceReconciliationState,
    });
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_EXPENSE_STRUCTURE_BLOCK}}",
      screeningExpenseHtml
    );
    finalHtml = replaceAll(finalHtml, "{{SCREENING_NOI_STABILITY_BLOCK}}", screeningNoiHtml);
    const screeningRentRollHtml = buildScreeningRentRollDistributionHtml({
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
    });
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_RENT_ROLL_BLOCK}}",
      screeningRentRollHtml
    );
    const screeningRefiSufficiencyHtml =
      effectiveReportMode === "screening_v1"
        ? ""
        : (() => {
            const refiDebtRenderStateForScreeningBlock = sharedRefiDebtRenderState;
            const sufficiencyHtml = buildScreeningRefiSufficiencyTable({
              financials,
              t12Payload,
              currentDebtAssessmentState,
              mortgagePayload,
              loanTermSheetTermsPayload,
            });
            const financingEnvelopeHtml = refiDebtRenderStateForScreeningBlock.allowDebtMath
              ? buildFinancingEnvelopeGrid(
                  coerceNumber(t12Payload?.net_operating_income),
                  Number.isFinite(rrUnits) && rrUnits > 0 ? rrUnits : Number(computedRentRoll?.total_units)
                )
              : "";
            return sufficiencyHtml + financingEnvelopeHtml;
          })();
    let screeningCoverageHtml = "";
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_REFI_DATA_SUFFICIENCY_BLOCK}}",
      screeningRefiSufficiencyHtml
    );
    let renovationPayload = null;
    if (jobId) {
      const { data: renovationArtifact } = await supabase
        .from("analysis_artifacts")
        .select("payload")
        .eq("job_id", jobId)
        .eq("type", "renovation_parsed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      renovationPayload = renovationArtifact?.payload || null;
    }
    const hasMeaningfulRenovationText = (value) =>
      typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim() !== DATA_NOT_AVAILABLE;
    const hasMeaningfulRenovationRows = (rows) =>
      Array.isArray(rows) &&
      rows.some((row) => {
        if (row && typeof row === "object") {
          return Object.values(row).some((value) => String(value ?? "").trim().length > 0);
        }
        return String(row ?? "").trim().length > 0;
      });
    const hasPositiveRenovationAmount = (value) => {
      const parsed = coerceNumber(value);
      return Number.isFinite(parsed) && parsed > 0;
    };
    const hasStructuredRenovationRows = (rows) =>
      Array.isArray(rows) &&
      rows.some((row) => {
        if (!row || typeof row !== "object") return false;
        const amount = coerceNumber(
          row.estimated_cost ??
            row.amount ??
            row.cost ??
            row.value ??
            row.total ??
            row.budget
        );
        return Number.isFinite(amount) && amount > 0;
      });
    const hasVerifiedRenovationAmount = Boolean(
      hasPositiveRenovationAmount(renovationPayload?.total_budget) ||
        hasPositiveRenovationAmount(renovationPayload?.total_capex) ||
        hasPositiveRenovationAmount(renovationPayload?.renovation_budget)
    );
    const hasVerifiedStructuredRenovationInput = Boolean(
      hasVerifiedRenovationAmount ||
      hasStructuredRenovationRows(renovationPayload?.budget_rows) ||
        hasStructuredRenovationRows(renovationPayload?.execution_rows)
    );
    const hasExplicitRenovationInput = Boolean(hasVerifiedStructuredRenovationInput);
    const hasForwardLookingRenovationAssumptions = Boolean(
      hasVerifiedStructuredRenovationInput &&
        [
          renovationPayload?.timing_or_phasing,
          renovationPayload?.rent_lift,
          renovationPayload?.roi,
          renovationPayload?.payback_period,
        ].some((value) => hasMeaningfulRenovationText(value))
    );
    const renovationFilenameTerms = [
      "capex",
      "cap ex",
      "capital expenditure",
      "capital expenditures",
      "capital plan",
      "capital budget",
      "renovation",
      "renovations",
      "renovation budget",
      "reno",
      "budget",
      "construction budget",
      "scope of work",
      "improvement",
      "improvements",
    ];
    const renovationSourceFilenames = Array.isArray(documentSources) ? documentSources
      .map((row) => String(row?.original_filename || "").trim())
      .filter((name) => {
        const lower = name.toLowerCase();
        return lower && renovationFilenameTerms.some((term) => lower.includes(term));
      }) : [];
    const renovationAuthorityRows = acquisitionMemoRenderContext?.canonicalSupportDocMap instanceof Map && acquisitionMemoRenderContext.canonicalSupportDocMap.size > 0
      ? Array.from(acquisitionMemoRenderContext.canonicalSupportDocMap.values()).filter((row) => row && typeof row === "object")
      : Array.isArray(acquisitionMemoRenderContext?.supportDocAuthorityRows) && acquisitionMemoRenderContext.supportDocAuthorityRows.length > 0
      ? acquisitionMemoRenderContext.supportDocAuthorityRows
      : buildCanonicalSupportDocAuthorityRows({
          documentSources,
          renovationPayload,
        });
    const canonicalRenovationAuthorityRow = renovationAuthorityRows.find((row) =>
      row?.role === "structured_renovation" ||
      row?.role === "renovation_capex_budget_context" ||
      /structured_renovation|renovation_capex_budget_context|renovation|capex/i.test(String(row?.canonical_support_doc_role || row?.semantic_doc_role || row?.document_role_label || row?.treatment_label || ""))
    ) || null;
    const hasRenovationFilenameSignal = renovationSourceFilenames.length > 0;
    const hasRenovationAuthoritySignal = Boolean(canonicalRenovationAuthorityRow);
    const renovationSourceFilenameText = renovationSourceFilenames.map((name) => escapeHtml(name)).join(", ");
    const renovationAcknowledgmentHtml = !hasRenovationFilenameSignal && !hasRenovationAuthoritySignal
      ? ""
      : canonicalRenovationAuthorityRow?.role === "structured_renovation" ||
        hasForwardLookingRenovationAssumptions ||
        Boolean(canonicalRenovationAuthorityRow?.has_renovation_rent_lift || canonicalRenovationAuthorityRow?.has_renovation_phasing)
      ? `<strong>Uploaded Renovation / CapEx Document:</strong> Structured renovation budget, rent-lift assumptions, and phasing were received and are displayed for source transparency only. Renovation ROI, payback, NOI impact, valuation, and refinance outputs are not modeled.`
      : hasExplicitRenovationInput || Boolean(canonicalRenovationAuthorityRow?.has_structured_renovation_budget)
      ? `<strong>Uploaded Renovation / CapEx Document:</strong> Budget/scope items were received. Rent lift, ROI, payback, phasing, and implementation schedule were not provided; therefore renovation returns were not assessed.`
      : `<strong>Uploaded Renovation / CapEx Document:</strong> Renovation/CapEx support was received. No verified forward-looking renovation budget, rent-lift assumptions, ROI, payback, or implementation schedule was provided; therefore renovation returns were not assessed.`;
    if (renovationAcknowledgmentHtml && documentSourcesHtml) {
      documentSourcesHtml += `<p class="small" style="margin-top:8px;">${renovationAcknowledgmentHtml}</p>`;
    }
    const renovationBudgetSourceRows = hasExplicitRenovationInput
      ? renovationPayload?.budget_rows || []
      : [];
    const renovationExecutionSourceRows = hasExplicitRenovationInput
      ? renovationPayload?.execution_rows || []
      : [];
    const renovationBudgetRows = hasExplicitRenovationInput
      ? buildRenovationBudgetRows(renovationBudgetSourceRows, formatCurrency)
      : "";
    const renovationExecutionRows = hasExplicitRenovationInput
      ? buildRenovationExecutionRows(renovationExecutionSourceRows, formatCurrency)
      : "";
    const renovationReturnAssumptionsPresent = hasExplicitRenovationInput &&
      [
        renovationPayload?.timing_or_phasing,
        renovationPayload?.rent_lift,
        renovationPayload?.roi,
        renovationPayload?.payback_period,
      ].some((value) => hasMeaningfulRenovationText(value));
    const renovationDisplayMode = resolveRenovationDisplayMode({
      financials,
      renovationPayload,
      documentSources,
      hasForwardLookingRenovationInputs: renovationReturnAssumptionsPresent,
    });
    hasForwardLookingRenovationInputs = Boolean(renovationReturnAssumptionsPresent);
    acquisitionMemoRenderContext.hasForwardLookingRenovationInputs = hasForwardLookingRenovationInputs;
    acquisitionMemoRenderContext.renovationDisplayMode = renovationDisplayMode;
    acquisitionMemoRenderContext.renovationPayload = renovationPayload;
    acquisitionMemoRenderContext.propertyTaxPayload = propertyTaxPayload;
    acquisitionMemoRenderContext.propertyTaxBindingState = propertyTaxBindingState;
    acquisitionMemoRenderContext.documentQuantitativeUsageMap = documentQuantitativeUsageMap;
    const renovationDisplayCopy = buildHistoricalCapexDisplayCopy({
      renovationDisplayMode,
      hasForwardLookingRenovationInputs: renovationReturnAssumptionsPresent,
    });
    const hasRenovationDisplayMode = Boolean(renovationDisplayMode);
    const renovationBudgetNote =
      hasRenovationDisplayMode && renovationDisplayMode === "forward_looking_modelable"
        ? String(
            renovationPayload?.budget_note ??
              DATA_NOT_AVAILABLE
          ).trim() || DATA_NOT_AVAILABLE
        : hasRenovationDisplayMode
        ? renovationDisplayCopy.budget_note
        : DATA_NOT_AVAILABLE;
    const renovationExecutionNote =
      hasRenovationDisplayMode && renovationDisplayMode === "forward_looking_modelable"
        ? String(
            renovationPayload?.execution_note ??
              DATA_NOT_AVAILABLE
          ).trim() || DATA_NOT_AVAILABLE
        : hasRenovationDisplayMode
        ? renovationDisplayCopy.execution_note
        : DATA_NOT_AVAILABLE;
    const renovationInterpretation =
      hasRenovationDisplayMode && renovationDisplayMode === "forward_looking_modelable"
        ? String(
            sections?.renovationInterpretation ??
              renovationPayload?.interpretation ??
              DATA_NOT_AVAILABLE
          ).trim() || DATA_NOT_AVAILABLE
        : hasRenovationDisplayMode
        ? renovationDisplayCopy.interpretation
        : DATA_NOT_AVAILABLE;
    const renovationBudgetCardHtml = hasExplicitRenovationInput
  ? buildRenovationBudgetCardHtml(
      renovationBudgetSourceRows,
      formatCurrency,
      renovationBudgetNote,
      null,
      renovationDisplayCopy.budget_card_title
    )
  : "";
    const renovationExecutionCardHtml = hasExplicitRenovationInput
      ? renovationDisplayMode === "forward_looking_modelable" || renovationDisplayMode === "forward_looking_with_rent_lift"
        ? buildRenovationExecutionCardHtml(
          renovationExecutionSourceRows,
          formatCurrency,
          renovationExecutionNote
        )
        : ""
      : "";
    const normalizeRenovationNote = (value) =>
      String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    const normalizedInterpretationNote = normalizeRenovationNote(renovationInterpretation);
    const interpretationDuplicatesBudget =
      normalizedInterpretationNote &&
      normalizedInterpretationNote !== normalizeRenovationNote(DATA_NOT_AVAILABLE) &&
      normalizedInterpretationNote === normalizeRenovationNote(renovationBudgetNote) &&
      Boolean(renovationBudgetCardHtml);
    const interpretationDuplicatesExecution =
      normalizedInterpretationNote &&
      normalizedInterpretationNote !== normalizeRenovationNote(DATA_NOT_AVAILABLE) &&
      normalizedInterpretationNote === normalizeRenovationNote(renovationExecutionNote) &&
      Boolean(renovationExecutionCardHtml);
    const renovationInterpretationForRender =
      interpretationDuplicatesBudget || interpretationDuplicatesExecution
        ? DATA_NOT_AVAILABLE
        : renovationInterpretation;
    const normalizedRenovationBudgetCardHtml = renovationBudgetCardHtml;
    finalHtml = finalHtml.replace(
      /<!-- RENOVATION BUDGET TABLE -->[\s\S]*?<!-- COST PER UNIT -->/,
      () =>
        normalizedRenovationBudgetCardHtml
          ? `${normalizedRenovationBudgetCardHtml}\n\n  <!-- COST PER UNIT -->`
          : "  <!-- COST PER UNIT -->"
    );
    finalHtml = finalHtml.replace(
      /<!-- COST PER UNIT -->[\s\S]*?<!-- INTERPRETATION -->/,
      () =>
        renovationExecutionCardHtml
          ? `${renovationExecutionCardHtml}\n\n  <!-- INTERPRETATION -->`
          : "  <!-- INTERPRETATION -->"
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_INTERPRETATION}}",
      escapeHtml(renovationInterpretationForRender)
    );
    let canRenderRefi = false;
    const currentDebtNotAssessedRenderCopy =
      "Current debt and refinance capacity were not assessed because no verified current outstanding debt balance was provided.";
    finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
    finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", "");
    finalHtml = replaceAll(finalHtml, "{{DEBT_DSCR_NOTE}}", "");
    finalHtml = replaceAll(finalHtml, "{{DEBT_REFI_CONSIDERATIONS}}", "");
    const earlySectionEligibilityStateForRender =
      underwritingState?.core?.sections?.eligibilityState || sectionEligibility || null;
    const showOperatingStatement = Boolean(
      t12IncomeRows ||
        t12ExpenseRows ||
        (Number.isFinite(t12EgiValue) && Number.isFinite(t12TotalExpensesValue)) ||
        Number.isFinite(t12NoiValue)
    );
    const keepOperatingStatement = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "operating_statement",
      rendererDefault: showOperatingStatement,
    });
    if (!keepOperatingStatement) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_OPERATING_STATEMENT");
    }
    const renovationStrategyHtml = getNarrativeHtml("renovationNarrative");
    const showRenovationSection = hasRenovationDisplayMode && Boolean(
      (renovationBudgetCardHtml || "").trim() ||
        (renovationExecutionCardHtml || "").trim() ||
        renovationInterpretation !== DATA_NOT_AVAILABLE ||
        (renovationStrategyHtml && renovationStrategyHtml !== DATA_NOT_AVAILABLE)
    );
    const keepRenovationEarly = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "renovation_strategy",
      rendererDefault: showRenovationSection,
    });
    if (!keepRenovationEarly) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
    }
    const hasDocSources =
      Array.isArray(documentSources) &&
      documentSources.length > 0 &&
      Boolean(documentSourcesHtml);
    const keepDocumentSourcesSection = resolveDocumentSourcesSectionVisibility({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sourceReconciliationState,
      effectiveReportMode,
      hasDocSources,
    });
    const fallbackDocumentSourcesHtml = keepDocumentSourcesSection
      ? '<p class="small">Document source transparency is required for this report scope. Structured source-treatment details were not available at render time.</p>'
      : "";
    finalHtml = replaceAll(
      finalHtml,
      "{{DOCUMENT_SOURCES_TABLE}}",
      hasDocSources ? documentSourcesHtml : fallbackDocumentSourcesHtml
    );
    if (!keepDocumentSourcesSection) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_DOC_SOURCES");
    }
    // Exec summary always shows because both modes have computed KPI grid and verdict block
    // (v1_core previously gated on AI narrative "execSummary" which is never populated)
    if (false) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_SUMMARY");
    }
    const showUnitValueAdd = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "operating_profile",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("unitValueAdd")),
    });
    if (!showUnitValueAdd) {
      finalHtml = stripMarkedSection(finalHtml, "UNIT_VALUE_ADD");
    }
    const showCashFlow = hasMeaningfulNarrative(getNarrativeHtml("cashFlowProjections"));
    if (!showCashFlow) {
      finalHtml = stripMarkedSection(finalHtml, "CASH_FLOW_PROJECTIONS");
    }
    const showNeighborhood = hasMeaningfulNarrative(getNarrativeHtml("neighborhoodAnalysis"));
    if (!showNeighborhood) {
      finalHtml = stripMarkedSection(finalHtml, "NEIGHBORHOOD_ANALYSIS");
    }
    const showRisk = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "risk_register",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("riskAssessment")),
    });
    if (!showRisk) {
      finalHtml = stripMarkedSection(finalHtml, "RISK_ASSESSMENT");
    }
    const showRenovation = hasMeaningfulNarrative(getNarrativeHtml("renovationNarrative"));
    if (!showRenovation) {
      finalHtml = stripMarkedSection(finalHtml, "RENOVATION_NARRATIVE");
    }
    const showDebt = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "debt_structure",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("debtStructure")),
    });
    if (!showDebt) {
      finalHtml = stripMarkedSection(finalHtml, "DEBT_STRUCTURE");
    }
    const showDealScoreSummary = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "deal_scorecard",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("dealScoreSummary")),
    });
    if (!showDealScoreSummary) {
      finalHtml = stripMarkedSection(finalHtml, "DEAL_SCORE_SUMMARY");
    }
    const showDealScoreInterpretation = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "deal_scorecard",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("dealScoreInterpretation")),
    });
    if (!showDealScoreInterpretation) {
      finalHtml = stripMarkedSection(finalHtml, "DEAL_SCORE_INTERPRETATION");
    }
    // SECTION_8_INTERPRETATION strip is deferred to the v1_core block
    // For screening mode, the token is already cleared (empty string) by the early replacement,
    // so the section will be stripped by the DNA safety pass and section strip cascade.
    const showAdvancedModeling = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "advanced_modeling",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("advancedModelingIntro")),
    });
    if (!showAdvancedModeling) {
      finalHtml = stripMarkedSection(finalHtml, "ADVANCED_MODELING_INTRO");
    }
    const showDcf = shouldRenderCanonicalSection({
      sectionEligibility: earlySectionEligibilityStateForRender,
      sectionKey: "dcf",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("dcfInterpretation")),
    });
    if (!showDcf) {
      finalHtml = stripMarkedSection(finalHtml, "DCF_INTERPRETATION");
    }
    const showFinalRecommendation = resolveFinalRecommendationSectionVisibility({
      sectionEligibility: earlySectionEligibilityStateForRender,
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("finalRecommendation")),
    });
    if (!showFinalRecommendation) {
      finalHtml = stripMarkedSection(finalHtml, "FINAL_RECOMMENDATION");
    }
    const hasRentRollUnitMix =
      !suppressUnitLevelRentLift &&
      (
        (Array.isArray(rentRollUnits) && rentRollUnits.length > 0) ||
        (Array.isArray(rentRollPayload?.unit_mix) && rentRollPayload.unit_mix.length > 0)
      );
    const hasRentRollRents =
      (Array.isArray(rentRollUnits) &&
        rentRollUnits.some(
          (unit) =>
            Number.isFinite(coerceNumber(unit?.in_place_rent)) &&
            Number.isFinite(coerceNumber(unit?.market_rent))
        )) ||
      (Array.isArray(rentRollPayload?.unit_mix) &&
        rentRollPayload.unit_mix.some(
          (row) =>
            Number.isFinite(Number(row?.current_rent)) &&
            Number.isFinite(Number(row?.market_rent))
        ));
    const hasRentRollData = hasRentRollUnitMix && hasRentRollRents;
    const hasT12Data = [
      "effective_gross_income",
      "total_operating_expenses",
      "net_operating_income",
    ].some((key) => Number.isFinite(Number(t12Payload?.[key]))) || Number.isFinite(canonicalGpr);
    const marketRentPremiumAvg =
      Number.isFinite(coerceNumber(computedRentRoll?.rent_to_market_gap))
        ? coerceNumber(computedRentRoll?.rent_to_market_gap)
        : Number.isFinite(coerceNumber(computedRentRoll?.avg_market_rent)) &&
      Number.isFinite(coerceNumber(computedRentRoll?.avg_in_place_rent)) &&
      coerceNumber(computedRentRoll?.avg_in_place_rent) > 0
        ? (coerceNumber(computedRentRoll?.avg_market_rent) -
            coerceNumber(computedRentRoll?.avg_in_place_rent)) /
          coerceNumber(computedRentRoll?.avg_in_place_rent)
        : null;
    const hasTargetRentInputs =
      !suppressUnitLevelRentLift &&
      (
        (Array.isArray(rentRollUnits) &&
          rentRollUnits.some((unit) => Number.isFinite(coerceNumber(unit?.market_rent)))) ||
        (Array.isArray(computedRentRoll?.unit_mix) &&
          computedRentRoll.unit_mix.some((row) => Number.isFinite(coerceNumber(row?.market_rent)))) ||
        (Array.isArray(rentRollPayload?.unit_mix) &&
          rentRollPayload.unit_mix.some((row) => Number.isFinite(Number(row?.market_rent))))
      );
    const hasPositiveLiftSignal =
      !suppressUnitLevelRentLift && (
      (Number.isFinite(marketRentPremiumAvg) && marketRentPremiumAvg > 0) ||
      (Array.isArray(computedRentRoll?.unit_mix) &&
        computedRentRoll.unit_mix.some(
          (row) =>
            Number.isFinite(coerceNumber(row?.current_rent)) &&
            Number.isFinite(coerceNumber(row?.market_rent)) &&
            coerceNumber(row?.market_rent) > coerceNumber(row?.current_rent)
        )) ||
      (Array.isArray(rentRollPayload?.unit_mix) &&
        rentRollPayload.unit_mix.some(
          (row) =>
            Number.isFinite(Number(row?.current_rent)) &&
            Number.isFinite(Number(row?.market_rent)) &&
            Number(row?.market_rent) > Number(row?.current_rent)
        )));
    const sectionEligibilityStateForRender =
      underwritingState?.core?.sections?.eligibilityState || sectionEligibility || null;
    const showSection2 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "operating_profile",
      rendererDefault: hasRentRollData && hasTargetRentInputs && hasPositiveLiftSignal,
    });
    if (!showSection2) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_UNIT_VALUE_ADD");
    }
    const showSection2Roi = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "renovation_strategy",
      rendererDefault: Array.isArray(tables.renovationSummary) && tables.renovationSummary.length > 0,
    });
    if (!showSection2Roi) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_RENOVATION_ROI");
    }
    let scenarioTableHtml = "";
    // Note: scenarioTableHtml is built later in the v1_core block (~line 4210+).
    // Do NOT check scenarioTableHtml.length here because it is always empty at this point.
    const showSection3 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "scenario_analysis",
      rendererDefault:
        hasVerifiedCurrentDebtBalance &&
        (
          (hasRentRollData && hasT12Data && Array.isArray(tables.scenarios) && tables.scenarios.length > 0) ||
          (effectiveReportMode === "v1_core" && hasT12Data) // v1_core always builds scenario table from T12
        ),
    });
    if (!showSection3) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
    }
    const section4FallbackRenderDefault =
      effectiveReportMode === "v1_core" ||
      hasMeaningfulNarrative(getNarrativeHtml("neighborhoodAnalysis")) ||
      hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    const showSection5 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "risk_register",
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("riskAssessment")),
    });
    if (!showSection5) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK");
    }
    const showSection5Matrix = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "risk_register",
      rendererDefault: Array.isArray(tables.riskMatrix) && tables.riskMatrix.length > 0,
    });
    if (!showSection5Matrix) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK_MATRIX");
    }
    const showSection6 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "renovation_strategy",
      rendererDefault:
        showRenovationSection ||
        (Array.isArray(tables.renovationSummary) && tables.renovationSummary.length > 0),
    });
    if (!showSection6) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
    }
    // Build deterministic underwriting blocks from parsed supporting docs
    // Debt Capital Structure rows (from mortgage_statement_parsed)
    const canonicalRefiDebtBasisForUnderwriting = canonicalRefiDebtBasis;
    let debtCapitalRowsHtml = "";
    if (effectiveReportMode === "v1_core" && canonicalRefiDebtBasisForUnderwriting.hasTrueCurrentDebtBalance) {
      const dcRows = [];
      if (mortgagePayload?.lender_name) {
        dcRows.push(`<tr><td>Lender</td><td>${escapeHtml(String(mortgagePayload.lender_name))}</td></tr>`);
      }
      const bal = coerceNumber(canonicalRefiDebtBasisForUnderwriting.debtBalance);
      if (Number.isFinite(bal) && bal > 0) {
        dcRows.push(`<tr><td>Outstanding Balance</td><td>${formatCurrency(bal)}</td></tr>`);
      }
      const ratePct = coerceNumber(canonicalRefiDebtBasisForUnderwriting.interestRatePct);
      if (Number.isFinite(ratePct) && ratePct > 0) {
        dcRows.push(`<tr><td>Interest Rate</td><td>${ratePct.toFixed(2)}%</td></tr>`);
      }
      const amort = coerceNumber(canonicalRefiDebtBasisForUnderwriting.amortYears);
      const pni = Number.isFinite(coerceNumber(canonicalRefiDebtBasisForUnderwriting.annualDebtService))
        ? coerceNumber(canonicalRefiDebtBasisForUnderwriting.annualDebtService) / 12
        : coerceNumber(mortgagePayload?.monthly_payment);
      if (Number.isFinite(pni) && pni > 0) {
        dcRows.push(`<tr><td>Monthly P&I</td><td>${formatCurrency(pni)}</td></tr>`);
      }
      const t12Noi = coerceNumber(t12Payload?.net_operating_income);
      let annualDs = null;
      if (Number.isFinite(bal) && bal > 0 && Number.isFinite(pni) && pni > 0) {
        annualDs = pni * 12;
      } else if (
        Number.isFinite(bal) && bal > 0 &&
        Number.isFinite(ratePct) && ratePct > 0 &&
        Number.isFinite(amort) && amort > 0
      ) {
        const mc = computeMortgageConstant(ratePct / 100, amort);
        if (Number.isFinite(mc) && mc > 0) {
          annualDs = bal * mc;
        }
      }
      if (Number.isFinite(t12Noi) && t12Noi > 0 && Number.isFinite(annualDs) && annualDs > 0) {
        dcRows.push(`<tr><td>DSCR (T12 NOI)</td><td>${formatMultiple(t12Noi / annualDs, 2)}</td></tr>`);
      }
      if (Number.isFinite(amort) && amort > 0) {
        dcRows.push(`<tr><td>Amortization</td><td>${amort} years</td></tr>`);
      }
      if (dcRows.length > 0) debtCapitalRowsHtml = dcRows.join("");
    }

    // Refi Collapse Risk Grid (3x3 DSCR sensitivity matrix)
    let refiCollapseGridHtml = "";
    if (t12Payload && effectiveReportMode === "v1_core" && canonicalRefiDebtBasisForUnderwriting.hasTrueCurrentDebtBalance) {
      const noiBase = coerceNumber(t12Payload.net_operating_income);
      const baseRatePct = coerceNumber(canonicalRefiDebtBasisForUnderwriting.interestRatePct); // e.g. 4.5
      const debtBal = coerceNumber(canonicalRefiDebtBasisForUnderwriting.debtBalance);
      const amortYrs = coerceNumber(canonicalRefiDebtBasisForUnderwriting.amortYears) || 25;
      const currentDebtCoverage = {
        annualDebtService: coerceNumber(canonicalRefiDebtBasisForUnderwriting.annualDebtService),
      };
      const resolvedCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const baseCapPct = (Number.isFinite(resolvedCapPct) && resolvedCapPct > 0) ? resolvedCapPct : 5.5;
      const capSourceLabel = resolveCapRateSourceProvenance({
        capRatePercent: baseCapPct,
        rawFinancials,
        loanTermSheetTermsPayload,
        acquisitionAssumptionState: underwritingState?.core?.acquisition?.assumptionState || null,
        appraisalPayload,
      }).label;

      if (Number.isFinite(noiBase) && noiBase > 0 && Number.isFinite(baseRatePct) && baseRatePct > 0 && Number.isFinite(debtBal) && debtBal > 0) {
        const LTV = 0.75;
        const MIN_DSCR_QUAL = 1.25;
        const rateScenarios = [
          { label: `Base (${formatInterestRatePercent(baseRatePct)})`, addPct: 0 },
          { label: `+100 bps (${formatInterestRatePercent(baseRatePct + 1)})`, addPct: 1 },
          { label: `+200 bps (${formatInterestRatePercent(baseRatePct + 2)})`, addPct: 2 },
        ];

        let grid = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">`;
        grid += `<thead><tr>`;
        grid += `<th style="text-align:left;padding:4px 8px;background:#F3F4F6;border:1px solid #E5E7EB;">Rate Scenario</th>`;
        grid += `<th style="text-align:center;padding:4px 8px;background:#F3F4F6;border:1px solid #E5E7EB;">DSCR</th>`;
        grid += `</tr></thead><tbody>`;

        for (const rs of rateScenarios) {
          const newRateDec = (baseRatePct + rs.addPct) / 100;
          const mc = computeMortgageConstant(newRateDec, amortYrs);
          grid += `<tr>`;
          grid += `<td style="padding:4px 8px;font-weight:600;background:#F9FAFB;border:1px solid #E5E7EB;">${escapeHtml(rs.label)}</td>`;
          let coverageDisplay = "N/A";
          let bg = "#F9FAFB";
          let fc = "#374151";
          const annualDs =
            rs.addPct === 0 && Number.isFinite(currentDebtCoverage.annualDebtService) && currentDebtCoverage.annualDebtService > 0
              ? currentDebtCoverage.annualDebtService
              : mc && mc > 0
              ? debtBal * mc
              : null;
          if (Number.isFinite(annualDs) && annualDs > 0) {
            const coverage = annualDs > 0 ? noiBase / annualDs : 0;
            if (coverage > 0 && Number.isFinite(coverage)) {
              coverageDisplay = formatMultiple(coverage, 2);
              if (coverage < 1.00) { bg = "#F8FAFC"; fc = "#64748B"; }
              else if (coverage < 1.25) { bg = "#F8FAFC"; fc = "#64748B"; }
              else { bg = "#FEFCE8"; fc = "#B8860B"; }
            }
          }
          grid += `<td style="text-align:center;padding:4px 8px;background:${bg};color:${fc};font-weight:600;border:1px solid #E5E7EB;">${coverageDisplay}</td>`;
          grid += `</tr>`;
        }
        grid += `</tbody></table>`;
        grid += `<p class="small" style="margin-top:6px;">Base row uses source monthly debt service when provided; rate-shock rows use the current debt balance under interest-rate scenarios only. Green = coverage >= 1.25 | Amber = 1.00-1.24 | Red = below 1.00</p>`;
        refiCollapseGridHtml = grid;
      }
    }

    // Deterministic 5-Year DCF from T12 NOI
    let dcfTableHtml = "";
    if (t12Payload && effectiveReportMode === "v1_core" && hasVerifiedCurrentDebtBalance) {
      const dcfDisplayCopy = buildFrameworkSensitivityDisplayCopy();
      const dcfSourceReconciliationLimited = Boolean(
        buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState).data_coverage_required
      );
      const noiYear0 = coerceNumber(t12Payload.net_operating_income);
      const resolvedExitCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const exitCapPct = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? resolvedExitCapPct : 5.5;
      const exitCapSourceLabel = resolveCapRateSourceProvenance({
        capRatePercent: exitCapPct,
        rawFinancials,
        loanTermSheetTermsPayload,
        acquisitionAssumptionState: underwritingState?.core?.acquisition?.assumptionState || null,
        appraisalPayload,
      }).label;
      const GROWTH = 0.03; // 3% annual NOI growth standardized framework assumption
      const DISCOUNT = 0.08; // 8% discount rate standardized framework assumption

      if (Number.isFinite(noiYear0) && noiYear0 > 0) {
        const exitCapDec = exitCapPct / 100;
        let tableHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">`;
        tableHtml += `<thead><tr>`;
        for (const h of ["Year", "NOI", "Exit Value", "Total Cash Flow", "PV Factor", "Present Value"]) {
          tableHtml += `<th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">${h}</th>`;
        }
        tableHtml += `</tr></thead><tbody>`;

        let totalPv = 0;
        for (let yr = 1; yr <= 5; yr++) {
          const noi = noiYear0 * Math.pow(1 + GROWTH, yr);
          const exitValue = yr === 5 ? noi / exitCapDec : 0;
          const totalCf = noi + exitValue;
          const pvFactor = 1 / Math.pow(1 + DISCOUNT, yr);
          const pv = totalCf * pvFactor;
          totalPv += pv;
          const exitDisplay = yr === 5 ? formatCurrency(exitValue) : "-";
          tableHtml += `<tr>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">Year ${yr}</td>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(noi)}</td>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${exitDisplay}</td>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(totalCf)}</td>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${pvFactor.toFixed(4)}</td>`;
          tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(pv)}</td>`;
          tableHtml += `</tr>`;
        }
        tableHtml += `<tr style="background:#F3F4F6;font-weight:700;">`;
        tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;" colspan="5">${dcfDisplayCopy.dcf_value_label}</td>`;
        tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(totalPv)}</td>`;
        tableHtml += `</tr>`;
        tableHtml += `</tbody></table>`;
        tableHtml += `<p class="small" style="margin-top:6px;">Basis: T12 NOI = ${formatCurrency(noiYear0)} | Annual NOI growth: 3.0% (${formatAssumptionAttributionLabel("standardized_framework")}) | Discount rate: 8.0% (${formatAssumptionAttributionLabel("standardized_framework")}) | Exit cap: ${formatCapPercentExact(exitCapPct)} (${exitCapSourceLabel}) | ${dcfDisplayCopy.dcf_framework_note}</p>`;
        // Cap rate framework sensitivity
        const noi5dcf = noiYear0 * Math.pow(1 + GROWTH, 5);
        const capRatesDcf = [4.5, 5.0, 5.5, 6.0, 6.5];
        const capRatesDcfRows = capRatesDcf.some((cap) => Math.abs(cap - exitCapPct) < 0.01)
        ? capRatesDcf
        : [...capRatesDcf, exitCapPct].sort((a, b) => a - b);
        tableHtml += `<p class="subsection-title" style="margin-top:16px;margin-bottom:6px;">Framework Value Sensitivity: Exit Cap Rate</p>`;
        tableHtml += `<table style="width:100%;border-collapse:collapse;font-size:11px;">`;
        tableHtml += `<thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Exit Cap Rate</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Year 5 Exit Value</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Framework-Indicated Present Value</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">vs. Base</th></tr></thead><tbody>`;
        for (const cap of capRatesDcfRows) {
          const isBase = Math.abs(cap - exitCapPct) < 0.01;
          const rowCap = isBase ? exitCapPct : cap;
          const exitV = noi5dcf / (rowCap / 100);
          const pvSum = [1,2,3,4,5].reduce((sum, yr) => {
            const noiYr = noiYear0 * Math.pow(1 + GROWTH, yr);
            const ev = yr === 5 ? exitV : 0;
            return sum + (noiYr + ev) / Math.pow(1 + DISCOUNT, yr);
          }, 0);
          const rowBg = isBase ? ` style="background:#FEFCE8;font-weight:700;"` : ``;
          const vs = isBase ? "-" : ((pvSum - totalPv) / totalPv * 100).toFixed(1) + "%";
          tableHtml += `<tr${rowBg}><td style="padding:4px 8px;border:1px solid #E5E7EB;">${isBase ? formatCapPercentExact(rowCap) : `${cap.toFixed(1)}%`}${isBase ? ` <span style="font-size:9px;color:#6B7280;">(${exitCapSourceLabel})</span>` : ""}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(exitV)}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(pvSum)}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;color:${vs === "-" ? "#374151" : pvSum > totalPv ? "#B8860B" : "#64748B"};">${vs}</td></tr>`;
        }
        tableHtml += `</tbody></table>`;
        if (dcfSourceReconciliationLimited) {
          tableHtml += `<p class="small" style="margin-top:6px;color:#64748b;font-style:italic;">Framework value sensitivity is based on reported T12 NOI and remains subject to the rent roll/T12 reconciliation disclosure in Data Coverage.</p>`;
        }
        dcfTableHtml = tableHtml;
      }
    }
    // End underwriting block builders

    // Deterministic 5-Year NOI Scenario Table (Conservative / Base / Optimistic)
    let scenarioTrajectoryChartHtml = "";
    if (effectiveReportMode === "v1_core" && t12Payload && hasVerifiedCurrentDebtBalance) {
      const noiBasis = coerceNumber(t12Payload.net_operating_income);
      const resolvedExitCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const exitCapPct = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? resolvedExitCapPct : 5.5;
      const exitCapSourceLabel = resolveCapRateSourceProvenance({
        capRatePercent: exitCapPct,
        rawFinancials,
        loanTermSheetTermsPayload,
        acquisitionAssumptionState: underwritingState?.core?.acquisition?.assumptionState || null,
        appraisalPayload,
      }).label;
      const exitCapDec = exitCapPct / 100;
      if (Number.isFinite(noiBasis) && noiBasis > 0) {
        const growthRates = [
          { label: "Conservative", rate: 0.02 },
          { label: "Base", rate: 0.03 },
          { label: "Optimistic", rate: 0.04 },
        ];
        let sTbl = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">`;
        sTbl += `<thead><tr>`;
        sTbl += `<th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Year</th>`;
        for (const s of growthRates) {
          sTbl += `<th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">${s.label} (${(s.rate * 100).toFixed(0)}% growth)</th>`;
        }
        sTbl += `</tr></thead><tbody>`;
        for (let yr = 1; yr <= 5; yr++) {
          sTbl += `<tr>`;
          sTbl += `<td style="padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;">Year ${yr}</td>`;
          for (const s of growthRates) {
            const noi = noiBasis * Math.pow(1 + s.rate, yr);
            sTbl += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(noi)}</td>`;
          }
          sTbl += `</tr>`;
        }
        sTbl += `<tr style="background:#F3F4F6;font-weight:700;">`;
        sTbl += `<td style="padding:4px 8px;border:1px solid #E5E7EB;">Year 5 Exit Value</td>`;
        for (const s of growthRates) {
          const noi5 = noiBasis * Math.pow(1 + s.rate, 5);
          sTbl += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(noi5 / exitCapDec)}</td>`;
        }
        sTbl += `</tr></tbody></table>`;
        sTbl += `<p class="small" style="margin-top:6px;">Basis: T12 NOI = ${formatCurrency(noiBasis)} | Exit cap: ${formatCapPercentExact(exitCapPct)} (${exitCapSourceLabel}). Scenario outputs are deterministic from reported NOI and standardized framework assumptions; this is not an appraisal.</p>`;
        // Cap rate exit value sensitivity sub-table
        const capRateRows = [4.5, 5.0, 5.5, 6.0, 6.5];
        const capRateSensitivityRows = capRateRows.some((cap) => Math.abs(cap - exitCapPct) < 0.01)
        ? capRateRows
        : [...capRateRows, exitCapPct].sort((a, b) => a - b);
        sTbl += `<p class="subsection-title" style="margin-top:16px;margin-bottom:6px;">Year 5 Exit Value: Cap Rate Sensitivity</p>`;
        sTbl += `<table style="width:100%;border-collapse:collapse;font-size:11px;">`;
        sTbl += `<thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Exit Cap Rate</th>`;
        for (const s of growthRates) {
          sTbl += `<th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">${s.label}</th>`;
        }
        sTbl += `</tr></thead><tbody>`;
        for (const cap of capRateSensitivityRows) {
          const isBase = Math.abs(cap - exitCapPct) < 0.01;
          const rowCap = isBase ? exitCapPct : cap;
          const rowStyle = isBase ? ` style="background:#FEFCE8;font-weight:700;"` : ``;
          sTbl += `<tr${rowStyle}><td style="padding:4px 8px;border:1px solid #E5E7EB;">${isBase ? formatCapPercentExact(rowCap) : `${cap.toFixed(1)}%`}${isBase ? ` <span style="font-size:9px;color:#6B7280;">(${exitCapSourceLabel})</span>` : ""}</td>`;
          for (const s of growthRates) {
            const noi5 = noiBasis * Math.pow(1 + s.rate, 5);
            sTbl += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(noi5 / (rowCap / 100))}</td>`;
          }
          sTbl += `</tr>`;
        }
        sTbl += `</tbody></table>`;
        scenarioTableHtml = sTbl;
        // Scenario trajectory chart: 5-year NOI bars per scenario
        const maxNoi5 = noiBasis * Math.pow(1.04, 5);
        const trajRows = growthRates.map((s, idx) => {
          const colors = ["#64748b", "#1e40af", "#d97706"];
          const color = colors[idx] || "#374151";
          const bars = [1,2,3,4,5].map(yr => {
            const noi = noiBasis * Math.pow(1 + s.rate, yr);
            const w = maxNoi5 > 0 ? Math.round((noi / maxNoi5) * 90) : 10;
            return `<td style="padding:2px 3px;width:14%;"><div style="background:${color};height:9px;border-radius:2px;width:${w}%;min-width:3px;"></div></td>`;
          }).join("");
          const noi5 = noiBasis * Math.pow(1 + s.rate, 5);
          return `<tr><td style="padding:3px 8px;font-size:10px;font-weight:600;color:${color};width:20%;">${escapeHtml(s.label)}</td>${bars}<td style="padding:3px 8px;font-size:10px;font-weight:700;text-align:right;">${formatCurrency(noi5)}</td></tr>`;
        }).join("");
        scenarioTrajectoryChartHtml = `<div class="no-break" style="margin-top:16px;"><p class="subsection-title" style="margin-bottom:6px;">5-Year NOI Trajectory</p><table style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:left;padding:2px 8px;font-size:9px;color:#6B7280;font-weight:600;text-transform:uppercase;width:20%;">Scenario</th><th colspan="5" style="text-align:center;padding:2px 4px;font-size:9px;color:#6B7280;font-weight:600;text-transform:uppercase;">Year 1 &rarr; Year 5</th><th style="text-align:right;padding:2px 8px;font-size:9px;color:#6B7280;font-weight:600;text-transform:uppercase;">Year 5 NOI</th></tr></thead><tbody>${trajRows}</tbody></table></div>`;
      }
    }

    // Deal Score: weighted composite from document-verified metrics only
    const dealScoreTableHtml = effectiveReportMode === "v1_core"
      ? dealScoreState.dealScoreTableHtml
      : "";
    const dealScoreRows = effectiveReportMode === "v1_core" ? dealScoreState.scoreRows : [];

    const showSection7 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "debt_structure",
      rendererDefault:
        hasMeaningfulNarrative(getNarrativeHtml("debtStructure")) ||
        debtCapitalRowsHtml.length > 0 ||
        String(acquisitionFinancingAssumptionsHtml || "").trim().length > 0 ||
        String(acquisitionFinancingReadinessHtml || "").trim().length > 0,
    });
    const showProposedAcquisitionFinancingContext =
      String(acquisitionFinancingReadinessHtml || "").trim().length > 0;
    if (!showSection7 && !showProposedAcquisitionFinancingContext) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
    }
    const showSection7Tables = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "debt_structure",
      rendererDefault:
        (Array.isArray(tables.debtStructure) && tables.debtStructure.length > 0) ||
        debtCapitalRowsHtml.length > 0 ||
        refiCollapseGridHtml.length > 0,
    });
    if (!showSection7Tables) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT_TABLES");
    }
    const showSection8 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "deal_scorecard",
      rendererDefault:
        (Array.isArray(tables.dealScore) && tables.dealScore.length > 0) ||
        hasMeaningfulNarrative(getNarrativeHtml("dealScoreSummary")) ||
        hasMeaningfulNarrative(getNarrativeHtml("dealScoreInterpretation")) ||
        dealScoreTableHtml.length > 0,
    });
    if (!showSection8) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
    }
    const showSection9 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "dcf",
      rendererDefault:
        hasVerifiedCurrentDebtBalance &&
        ((Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) || dcfTableHtml.length > 0),
    });
    if (!showSection9) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
    }
    const showSection9Table = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "dcf",
      rendererDefault:
        hasVerifiedCurrentDebtBalance &&
        ((Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) || dcfTableHtml.length > 0),
    });
    if (!showSection9Table) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF_TABLE");
    }
    const showSection10 = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "advanced_modeling",
      rendererDefault:
        hasVerifiedCurrentDebtBalance ||
        hasMeaningfulComparableRows(tables.comps || []) ||
        hasMeaningfulNarrative(getNarrativeHtml("advancedModelingIntro")),
    });
    if (!showSection10) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_ADV_MODEL");
    }
    const showSection11 = resolveFinalRecommendationSectionVisibility({
      sectionEligibility: sectionEligibilityStateForRender,
      rendererDefault: hasMeaningfulNarrative(getNarrativeHtml("finalRecommendation")),
    });
    if (!showSection11) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_11_FINAL_RECS");
    }
    if (effectiveReportMode === "v1_core") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
      if (!String(acquisitionFinancingReadinessHtml || "").trim()) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
      }
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT_TABLES");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF_TABLE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_ADV_MODEL");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_DCF_SUMMARY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_COMPARABLE_CONTEXT");
      finalHtml = stripMarkedSection(finalHtml, "RELATIVE_POSITIONING");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_11_FINAL_RECS");
      finalHtml = stripMarkedSection(finalHtml, "EXEC_DSCR_CARD");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_BAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_EXPENSE_RATIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_EQUITY_COMPONENTS");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_BREAKEVEN");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_RISK_RADAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_RENOVATION");
    }
    const marketContextVisibility = resolveMarketContextSectionVisibility({
      sectionEligibility: sectionEligibilityStateForRender,
      rendererDefault: section4FallbackRenderDefault,
    });
    if (effectiveReportMode === "v1_core") {
      marketContextVisibility.keepNeighborhood = true;
      marketContextVisibility.keepLocationTable = true;
    }
    if (!marketContextVisibility.keepLocationTable) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_4_LOCATION_TABLE");
    }
    const hasMeaningfulComps = hasMeaningfulComparableRows(tables.comps || []);
    if (!hasMeaningfulComps) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_COMPARABLE_CONTEXT");
      finalHtml = stripMarkedSection(finalHtml, "RELATIVE_POSITIONING");
    }
    const hasRiskMatrixRows = Array.isArray(tables?.riskMatrix) && tables.riskMatrix.length > 0;
    const hasRiskNarrative = hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    if (!showSection5Matrix && !hasRiskNarrative) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK_MATRIX");
    }
    const showScenarioAnalysisSection =
      hasVerifiedCurrentDebtBalance &&
      (
        showCashFlow ||
        (Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) ||
        scenarioTableHtml.length > 0
      );
    if (!showScenarioAnalysisSection) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3");
    }
    const dcfRow =
      Array.isArray(tables?.returnSummary) && tables.returnSummary.length > 0
        ? tables.returnSummary[0] || {}
        : {};
    const hasDcfMetric =
      Number.isFinite(coerceNumber(dcfRow?.irr)) ||
      Number.isFinite(coerceNumber(dcfRow?.equityMultiple)) ||
      Number.isFinite(coerceNumber(dcfRow?.salePrice)) ||
      (typeof dcfRow?.salePriceText === "string" && dcfRow.salePriceText.trim().length > 0);
    const showSection10DcfSummary = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "dcf",
      rendererDefault: hasVerifiedCurrentDebtBalance && hasDcfMetric,
    });
    if (!showSection10DcfSummary) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_DCF_SUMMARY");
    }
    if (shouldApplyTierOneStripCascade({
      effectiveReportMode,
      reportType,
      reportTier,
      sectionEligibility: sectionEligibilityStateForRender,
    })) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_RENOVATION_ROI");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_ADV_MODEL");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_11_FINAL_RECS");
    }
    const allowCharts = reportTier >= 3;
    if (!allowCharts) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_RENOVATION");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_RISK_RADAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_BREAKEVEN");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_BAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_EXPENSE_RATIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_EQUITY_COMPONENTS");
    }
    if (!allowAssumptions) {
      finalHtml = stripMarkedSection(finalHtml, "ASSUMPTIONS_ONLY");
    }
    finalHtml = stripChartBlockByAlt(finalHtml, "Renovation ROI and Rent Lift Chart");
    finalHtml = stripChartBlockByAlt(finalHtml, "IRR by Scenario");
    finalHtml = stripChartBlockByAlt(finalHtml, "Risk Factor Radar Chart");
    finalHtml = stripChartBlockByAlt(finalHtml, "Break-Even Occupancy Analysis");
    finalHtml = stripChartBlockByAlt(finalHtml, "Deal Score Radar Chart");
    finalHtml = stripChartBlockByAlt(finalHtml, "Deal Score Factor Breakdown Bar Chart");
    finalHtml = stripChartBlockByAlt(finalHtml, "Operating Expense Ratio Chart");
    finalHtml = stripChartBlockByAlt(finalHtml, "Equity Return Components");
    const dataCoverageToken = finalHtml.includes("<!-- BEGIN SECTION_7_DATA_COVERAGE -->")
      ? "SECTION_7_DATA_COVERAGE"
      : "SECTION_S7_DATA_COVERAGE_GAPS";
    const dataCoverageBegin = `<!-- BEGIN ${dataCoverageToken} -->`;
    const dataCoverageEnd = `<!-- END ${dataCoverageToken} -->`;
    const canonicalDataCoverageAuthorityPresent = Boolean(
      (sectionEligibilityStateForRender?.sections?.data_coverage &&
        typeof sectionEligibilityStateForRender.sections.data_coverage === "object") ||
      (underwritingState?.core?.dataCoverage &&
        typeof underwritingState.core.dataCoverage === "object") ||
      (dataCoverageState && typeof dataCoverageState === "object")
    );
    const keepDataCoverageSection = shouldRenderCanonicalSection({
      sectionEligibility: sectionEligibilityStateForRender,
      sectionKey: "data_coverage",
      rendererDefault: true,
    });
    if (!keepDataCoverageSection) {
      finalHtml = stripMarkedSection(finalHtml, dataCoverageToken);
    } else if (!isFullRenderHarness && finalHtml.includes(dataCoverageBegin) && finalHtml.includes(dataCoverageEnd)) {
      const escapedCoverageToken = dataCoverageToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const coverageMatch = finalHtml.match(
        new RegExp(
          `<!-- BEGIN ${escapedCoverageToken} -->([\\s\\S]*?)<!-- END ${escapedCoverageToken} -->`
        )
      );
      const coverageSection = coverageMatch?.[1] || "";
      if (shouldStripDataCoverageSectionByRenderedCopy({
        coverageSectionHtml: coverageSection,
        hasCanonicalCoverageAuthority: canonicalDataCoverageAuthorityPresent,
      })) {
        finalHtml = stripMarkedSection(finalHtml, dataCoverageToken);
      }
    }
    finalHtml = replaceAll(finalHtml, "{{REPORT_MODE}}", effectiveReportMode);
    if (effectiveReportMode === "v1_core") {
      const dcfDisplayCopy = buildFrameworkSensitivityDisplayCopy();
      finalHtml = finalHtml.replace(
        /Scenario Analysis &amp; Five-Year Outlook/g,
        dcfDisplayCopy.scenario_section_title.replace(/&/g, "&amp;")
      );
      finalHtml = finalHtml.replace(
        /Discounted Cash Flow \(DCF\)/g,
        dcfDisplayCopy.dcf_section_title
      );
      finalHtml = finalHtml.replace(
        /Discounted Cash Flow Summary \(Base Case\)/g,
        dcfDisplayCopy.dcf_summary_title
      );
      if (renovationDisplayMode !== "forward_looking_modelable") {
        finalHtml = finalHtml.replace(
          /Renovation Strategy &amp; Capital Plan/g,
          renovationDisplayCopy.section_title
        );
      }
    }
    finalHtml = finalHtml.replace(/Primary Pressure Point\s*-\s*/g, "Primary Pressure Point: ");
    finalHtml = finalHtml.replace(
      /Primary Pressure Point:\s*Primary Constraint:\s*/g,
      "Primary Constraint: "
    );
    finalHtml = finalHtml.replace(/(\d+)-Unit Multifamily\./g, "$1-Unit Multifamily");
    finalHtml = finalHtml.replace(/Key Metrics Snapshot\./g, "Key Metrics Snapshot");
    finalHtml = finalHtml.replace(/Key Upside Drivers\./g, "Key Upside Drivers");
    finalHtml = finalHtml.replace(/Key Risks and Constraints\./g, "Key Risks and Constraints");
    finalHtml = finalHtml.replace(
      /EXPENSE STRUCTURE ANALYSIS\s*-\s*EXPENSE RATIO,\s*DRIVERS,\s*AND INTENSITY FLAGS/g,
      "Expense Structure Analysis - Expense Ratio, Drivers, and Intensity Flags"
    );
    finalHtml = finalHtml.replace(
      /NOI STABILITY REVIEW\s*-\s*MARGIN,\s*VOLATILITY,\s*AND OPERATING LEVERAGE INDICATORS/g,
      "NOI Stability Review - Margin, Volatility, and Operating Leverage Indicators"
    );
    finalHtml = finalHtml.replace(
      /RENT ROLL DISTRIBUTION\s*-\s*OCCUPANCY,\s*RENT DISPERSION,\s*AND UNIT MIX PROFILE/g,
      "Rent Roll Distribution - Occupancy, Rent Dispersion, and Unit Mix Profile"
    );
    const sectionEligibilityState =
      underwritingState?.core?.sections?.eligibilityState || sectionEligibility;
    const dataCoverageState = underwritingState?.core?.dataCoverage || null;
    const canonicalDataCoverageHeadlineState = resolveCanonicalDataCoverageHeadlineState({
      dataCoverageState,
      sourceReconciliationState,
      sectionEligibility: sectionEligibilityState,
      effectiveReportMode,
    });
    const isUnderwritingScopeHeadline = canonicalDataCoverageHeadlineState.headlineMode === "underwriting_scope";
    finalHtml = finalHtml.replace(
      /DATA COVERAGE\s*&\s*UNDERWRITING GAPS\s*-\s*MISSING INPUTS AND OMITTED SECTIONS/g,
      isUnderwritingScopeHeadline
        ? "Data Coverage & Underwriting Scope - Source-Supported Inputs and Withheld Sections"
        : "Data Coverage & Screening Notes - Missing Inputs and Omitted Sections"
    );
    finalHtml = finalHtml.replace(
      /<span class="section-header-title">Data Coverage &amp; Underwriting Gaps<\/span>/g,
      isUnderwritingScopeHeadline
        ? '<span class="section-header-title">Data Coverage &amp; Underwriting Scope</span>'
        : '<span class="section-header-title">Data Coverage &amp; Screening Notes</span>'
    );
    finalHtml = finalHtml.replace(
      /<span class="section-header-sub">Missing Inputs and Omitted Sections<\/span>/gi,
      isUnderwritingScopeHeadline
        ? '<span class="section-header-sub">Source-Supported Inputs and Withheld Sections</span>'
        : '<span class="section-header-sub">Missing Inputs and Omitted Sections</span>'
    );
    if (isUnderwritingScopeHeadline) {
      finalHtml = finalHtml.replace(
        /Missing inputs and omitted sections/gi,
        "Source-Supported Inputs and Withheld Sections"
      );
    }
    if (!isUnderwritingScopeHeadline) {
      finalHtml = finalHtml.replace(
        /<span class="section-header-title">Data Coverage &amp; Underwriting Gaps<\/span>/g,
        '<span class="section-header-title">Data Coverage &amp; Screening Notes</span>'
      );
    }
    if (effectiveReportMode === "v1_core") {
      finalHtml = finalHtml.replace(
        /<span class="section-header-title">Data Coverage &amp; Underwriting Scope<\/span>/g,
        '<span class="section-header-title">Data Coverage &amp; Source Limitations</span>'
      );
      finalHtml = finalHtml.replace(
        /<span class="section-header-title">Data Coverage &amp; Screening Notes<\/span>/g,
        '<span class="section-header-title">Data Coverage &amp; Source Limitations</span>'
      );
      finalHtml = finalHtml.replace(
        /DATA COVERAGE\s*&\s*UNDERWRITING SCOPE\s*-\s*SOURCE-SUPPORTED INPUTS AND WITHHELD SECTIONS/gi,
        "Data Coverage & Source Limitations - Source-Supported Inputs and Withheld Sections"
      );
      finalHtml = finalHtml.replace(
        /Missing inputs and omitted sections/gi,
        "Source limitations and omitted sections"
      );
    }
    finalHtml = finalHtml.replace(
      /REFINANCE DATA SUFFICIENCY FLAG\s*-\s*ELIGIBILITY FOR REFINANCE STABILITY CLASSIFICATION/g,
      "Refinance Data Sufficiency - Eligibility for Refinance Stability Classification"
    );
    const supportingUnderwritingDocsUsed =
      effectiveReportMode === "v1_core" &&
      Boolean(
        canRenderRefi ||
        String(debtCapitalRowsHtml || "").trim().length > 0 ||
        String(refiCollapseGridHtml || "").trim().length > 0 ||
        String(dcfTableHtml || "").includes("(appraisal)") ||
        String(scenarioTableHtml || "").includes("(appraisal)")
      );
    if (underwritingState?.core?.dataCoverage) {
      underwritingState.core.dataCoverage.supportingDocsUsed = supportingUnderwritingDocsUsed;
      if (!underwritingState.core.dataCoverage.headlineMode) {
        underwritingState.core.dataCoverage.headlineMode = canonicalDataCoverageHeadlineState.headlineMode;
      }
      if (!underwritingState.core.dataCoverage.severityState) {
        underwritingState.core.dataCoverage.severityState = canonicalDataCoverageHeadlineState.severityState;
      }
    }
    const optionalSectionState = underwritingState?.core?.optionalSections || null;
    dataCoverageBlockHtml = buildScreeningDataCoverageSummary({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      mortgagePayload,
      loanTermSheetTermsPayload,
      financials,
      effectiveReportMode,
      supportingUnderwritingDocsUsed,
      hasUploadedFiles: Array.isArray(documentSources) && documentSources.length > 0 && Boolean(documentSourcesHtml),
      documentSources,
      currentDebtAssessmentState,
      sourceReconciliationState,
      sectionEligibility: sectionEligibilityState,
      dataCoverageState,
      optionalSectionState,
      hasForwardLookingRenovationInputs: renovationReturnAssumptionsPresent,
      renovationDisplayMode,
      renovationPayload,
      propertyTaxPayload,
      propertyTaxBindingState,
      documentQuantitativeUsageMap,
      supportDocAuthorityRows: acquisitionMemoRenderContext?.supportDocAuthorityRows || null,
      canonicalSupportDocMap: acquisitionMemoRenderContext?.canonicalSupportDocMap || null,
      renderedDocumentTreatmentRowsOut: renderedDocumentTreatmentRows,
    });
    screeningCoverageHtml = dataCoverageBlockHtml;
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_DATA_COVERAGE_BLOCK}}",
      screeningCoverageHtml
    );
    // Underwriting token replacements (before leftover cleanup)
    if (effectiveReportMode === "v1_core") {
      finalHtml = replaceAll(finalHtml, "{{DEBT_CAPITAL_STRUCTURE_ROWS}}", debtCapitalRowsHtml);
      finalHtml = replaceAll(finalHtml, "{{REFI_SENSITIVITY_MATRIX_BLOCK}}", refiCollapseGridHtml);
      finalHtml = replaceAll(finalHtml, "{{DCF_TABLE_BLOCK}}", dcfTableHtml);
      finalHtml = replaceAll(finalHtml, "{{SCENARIO_TABLE}}", scenarioTableHtml);
      finalHtml = replaceAll(finalHtml, "{{SCENARIO_TRAJECTORY_CHART}}", scenarioTrajectoryChartHtml);
      finalHtml = replaceAll(finalHtml, "{{DEAL_SCORE_TABLE}}", dealScoreTableHtml);
      // Return Summary and Comparables have no data source, so strip their subsections cleanly
      // Strip fabricated PNG charts (pre-built images with baked-in axes, not document-derived)
      // Replace with inline HTML/CSS bar chart built from actual dealScoreRows
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_RADAR");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_CHART_DEAL_SCORE_BAR");
      let dealScoreInlineChartHtml = "";
      if (dealScoreRows.length > 0) {
        const iChartRows = dealScoreRows.map((r) => {
          const ratio = r.max > 0 ? r.pts / r.max : 0;
          const barColor = "#B8860B";
          const barWidth = Math.round(ratio * 100);
          return (
            `<tr style="border-bottom:1px solid #F3F4F6;">` +
            `<td style="padding:5px 8px;font-size:11px;width:28%;white-space:nowrap;">${escapeHtml(r.label)}</td>` +
            `<td style="padding:5px 8px;font-size:11px;width:12%;text-align:right;font-weight:600;">${escapeHtml(r.value)}</td>` +
            `<td style="padding:5px 8px;width:40%;">` +
            `<div style="background:#E5E7EB;height:10px;border-radius:5px;overflow:hidden;">` +
            `<div style="background:${barColor};height:100%;width:${barWidth}%;border-radius:5px;"></div>` +
            `</div>` +
            `</td>` +
            `<td style="padding:5px 8px;font-size:11px;width:8%;text-align:center;font-weight:700;color:${barColor};">${r.pts}/${r.max}</td>` +
            `<td style="padding:5px 8px;font-size:10px;width:12%;color:#6B7280;">${escapeHtml(r.band)}</td>` +
            `</tr>`
          );
        }).join("");
        dealScoreInlineChartHtml =
          `<div class="no-break" style="margin-top:16px;">` +
          `<p class="subsection-title" style="margin-bottom:8px;">Score Factor Breakdown</p>` +
          `<table style="width:100%;border-collapse:collapse;">` +
          `<thead><tr style="background:#F3F4F6;">` +
          `<th style="text-align:left;padding:5px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;">Factor</th>` +
          `<th style="text-align:right;padding:5px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;">Value</th>` +
          `<th style="padding:5px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;">Performance Bar</th>` +
          `<th style="text-align:center;padding:5px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;">Pts</th>` +
          `<th style="padding:5px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#6B7280;">Band</th>` +
          `</tr></thead>` +
          `<tbody>${iChartRows}</tbody>` +
          `</table>` +
          `<p class="small" style="margin-top:6px;color:#9CA3AF;">Signals are document-backed and framework-constrained. Missing inputs are not inferred.</p>` +
          `</div>`;
      }
      finalHtml = replaceAll(finalHtml, "{{DEAL_SCORE_INLINE_CHART}}", dealScoreInlineChartHtml);
      // Deal score interpretation: strip the section because inline chart is the visual interpretation
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_INTERPRETATION");
      // Risk Register: deterministic from computed metrics
      {
        const riskRows = [];
        const addRisk = (factor, reading, threshold, flag, color) => {
          riskRows.push(`<tr><td style="padding:5px 8px;border:1px solid #E5E7EB;font-weight:600;font-size:11px;">${escapeHtml(factor)}</td>` +
            `<td style="padding:5px 8px;border:1px solid #E5E7EB;font-size:11px;">${escapeHtml(reading)}</td>` +
            `<td style="padding:5px 8px;border:1px solid #E5E7EB;font-size:10px;color:#3F5E84;">${escapeHtml(threshold)}</td>` +
            `<td style="padding:5px 8px;border:1px solid #E5E7EB;text-align:center;"><span style="background:#FFFFFF;color:#1F3A5F;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;border:1px solid #E9EEF5;">${escapeHtml(flag)}</span></td></tr>`);
        };
        if (Number.isFinite(expenseRatioR)) {
          const flag = expenseRatioR > 0.65 ? "ELEVATED" : expenseRatioR > 0.55 ? "WATCH" : "CLEAR";
          const color = expenseRatioR > 0.65 ? "#dc2626" : expenseRatioR > 0.55 ? "#d97706" : "#16a34a";
          addRisk("Expense Ratio", formatPercent1(expenseRatioR), "CLEAR < 55% | WATCH 55-65% | ELEVATED > 65%", flag, color);
        }
        if (Number.isFinite(noiMarginR)) {
          const flag = noiMarginR < 0.35 ? "LOW" : noiMarginR < 0.45 ? "WATCH" : "STRONG";
          const color = noiMarginR < 0.35 ? "#dc2626" : noiMarginR < 0.45 ? "#d97706" : "#16a34a";
          addRisk("NOI Margin", formatPercent1(noiMarginR), "STRONG > 45% | WATCH 35-45% | LOW < 35%", flag, color);
        }
        if (Number.isFinite(execOccupancy)) {
          const flag = execOccupancy < 0.85 ? "LOW" : execOccupancy < 0.95 ? "WATCH" : "CLEAR";
          const color = execOccupancy < 0.85 ? "#dc2626" : execOccupancy < 0.95 ? "#d97706" : "#16a34a";
          addRisk("Occupancy Rate", formatPercent1(execOccupancy), "CLEAR > 95% | WATCH 85-95% | LOW < 85%", flag, color);
        }
        if (Number.isFinite(breakEvenOccR)) {
          const flag = breakEvenOccR > 0.80 ? "ELEVATED" : breakEvenOccR > 0.70 ? "WATCH" : "CLEAR";
          const color = breakEvenOccR > 0.80 ? "#dc2626" : breakEvenOccR > 0.70 ? "#d97706" : "#16a34a";
          addRisk("Break-Even Occupancy", formatPercent1(breakEvenOccR), "CLEAR < 70% | WATCH 70-80% | ELEVATED > 80%", flag, color);
        }
        if (Number.isFinite(marketRentPremiumRatio)) {
          const flag = marketRentPremiumRatio > 0.15 ? "UPSIDE" : marketRentPremiumRatio > 0.05 ? "MODERATE" : "MINIMAL";
          const color = marketRentPremiumRatio > 0.15 ? "#16a34a" : marketRentPremiumRatio > 0.05 ? "#1e40af" : "#6B7280";
          addRisk("Rent-to-Market Gap", formatPercent1(marketRentPremiumRatio) + " below market", "> 15% = meaningful upside | 5-15% = moderate | < 5% = minimal", flag, color);
        }
      {
        const canonicalRefiDebtBasisForRiskRegister = canonicalRefiDebtBasis;
        if (Number.isFinite(canonicalRefiDebtBasisForRiskRegister.dscr) && canonicalRefiDebtBasisForRiskRegister.dscr > 0) {
          const dscr = canonicalRefiDebtBasisForRiskRegister.dscr;
          const flag = dscr < 1.25 ? "STRESSED" : dscr < 1.35 ? "ADEQUATE" : "STRONG";
          const color = dscr < 1.25 ? "#dc2626" : dscr < 1.35 ? "#d97706" : "#16a34a";
          addRisk("DSCR (Current Debt)", formatMultiple(dscr, 2), "STRONG > 1.35x | ADEQUATE 1.25-1.35x | STRESSED < 1.25x", flag, color);
        } else {
        const dscrNotAssessedCopy = currentDebtNotAssessedCopy({
          currentDebtState: currentDebtAssessmentState,
          mortgagePayload,
          loanTermSheetTermsPayload,
          t12Noi: coerceNumber(t12Payload?.net_operating_income),
        });
        addRisk(
          "Current Debt DSCR",
          dscrNotAssessedCopy.value,
          dscrNotAssessedCopy.explanation,
          "NOT ASSESSED",
          "#9CA3AF"
        );
        }
      }
        const riskRegisterHtml = riskRows.length > 0
          ? `<div class="no-break" style="margin-top:20px;border-top:1px solid #E5E7EB;padding-top:16px;">` +
            `<p class="subsection-title" style="margin-bottom:8px;">Risk Register: Deterministic Signal Summary</p>` +
            `<table style="width:100%;border-collapse:collapse;"><thead><tr>` +
            `<th style="text-align:left;padding:5px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;font-size:10px;text-transform:uppercase;">Risk Factor</th>` +
            `<th style="text-align:left;padding:5px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;font-size:10px;text-transform:uppercase;">Current Reading</th>` +
            `<th style="text-align:left;padding:5px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;font-size:10px;text-transform:uppercase;">Threshold</th>` +
            `<th style="text-align:center;padding:5px 8px;background:#FFFFFF;color:#1F3A5F;border:1px solid #E9EEF5;font-size:10px;text-transform:uppercase;">Flag</th>` +
            `</tr></thead><tbody>${riskRows.join("")}</tbody></table>` +
            `<p class="small" style="margin-top:6px;">Signals are derived deterministically from document-backed inputs and framework-constrained calculations. Missing inputs are not inferred.</p></div>`
          : "";
        finalHtml = replaceAll(finalHtml, "{{RISK_REGISTER_TABLE}}", riskRegisterHtml);
      }
      // Return Summary and Comparables have no data source, so strip cleanly
      finalHtml = replaceAll(finalHtml, "{{RETURN_SUMMARY_TABLE}}", "");
      finalHtml = stripMarkedSection(finalHtml, "RETURN_SUMMARY_SUBSECTION");
      finalHtml = replaceAll(finalHtml, "{{COMPARABLES_TABLE}}", "");
      // DSCR KPI card is deferred from the Acquisition Memo launch path.
      finalHtml = stripMarkedSection(finalHtml, "EXEC_DSCR_CARD");
    }
    // ===== HTML/CSS Charts (shared across Screening + Underwriting) =====
    // Chart 1: NOI Waterfall
    {
      finalHtml = replaceAll(finalHtml, "{{NOI_WATERFALL_CHART}}", "");
    }
    // Chart 2: Expense Breakdown bar chart
    {
      let html = "";
      const expLines = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines : [];
      const totalOpEx = Number.isFinite(t12TotalExpensesValue) && t12TotalExpensesValue > 0
        ? t12TotalExpensesValue
        : expLines.reduce((s, l) => s + (coerceNumber(l.amount ?? l.value ?? l.ttm_amount) || 0), 0);
      if (expLines.length > 0 && totalOpEx > 0) {
        const sorted = [...expLines]
          .map(l => ({ label: String(l.label || l.name || l.line_item || ""), amt: coerceNumber(l.amount ?? l.value ?? l.ttm_amount) || 0 }))
          .filter(l => l.amt > 0)
          .sort((a, b) => b.amt - a.amt)
          .slice(0, 8);
        const trs = sorted.map(l => {
          const pct = (l.amt / totalOpEx) * 100;
          const w = Math.max(1, Math.round(pct));
          return `<tr><td class="analysis-chart-table-label" style="padding:3px 8px;font-size:10px;width:30%;">${escapeHtml(l.label)}</td>` +
            `<td style="padding:3px 8px;width:44%;"><div style="background:#E5E7EB;height:10px;border-radius:3px;overflow:hidden;"><div style="background:#94A3B8;height:100%;width:${w}%;border-radius:3px;"></div></div></td>` +
            `<td style="padding:3px 8px;font-size:10px;font-weight:700;text-align:right;"><span class="analysis-chart-table-pct">${pct.toFixed(1)}%</span></td>` +
            `<td style="padding:3px 8px;font-size:10px;text-align:right;color:#6B7280;"><span class="analysis-chart-table-value">${formatCurrency(l.amt)}</span></td></tr>`;
        }).join("");
        html = `<div class="no-break analysis-chart-table" style="margin-top:16px;"><p class="subsection-title" style="margin-bottom:6px;">Expense Composition (% of Total OpEx)</p><table class="analysis-chart-table-grid" style="width:100%;border-collapse:collapse;">${trs}</table></div>`;
      }
      finalHtml = replaceAll(finalHtml, "{{EXPENSE_BREAKDOWN_CHART}}", html);
    }
    // Chart 3: Rent Distribution (in-place vs market by unit type)
    {
      let html = "";
      const avgInplaceRent = coerceNumber(computedRentRoll?.avg_in_place_rent);
      const avgMarketRent = coerceNumber(computedRentRoll?.avg_market_rent);
      const inplace = avgInplaceRent;
      const market = avgMarketRent;
      const unitMixData =
        suppressUnitLevelRentLift
          ? []
          : Array.isArray(computedRentRoll?.unit_mix)
          ? computedRentRoll.unit_mix
          : [];
      if (!inplace || !market) {
        finalHtml = replaceAll(finalHtml, "{{RENT_DISTRIBUTION_CHART}}", "");
      } else if (unitMixData.length > 0) {
        const maxRent = Math.max(...unitMixData.flatMap(u => [
          coerceNumber(u.avg_market_rent ?? u.market_rent) || 0,
          coerceNumber(u.avg_in_place_rent ?? u.in_place_rent) || 0,
        ]));
        if (maxRent > 0) {
          const trs = unitMixData.map(u => {
            const inPlace = coerceNumber(u.avg_in_place_rent ?? u.in_place_rent) || 0;
            const market = coerceNumber(u.avg_market_rent ?? u.market_rent) || 0;
            const label = u.unit_type || (Number.isFinite(u.beds) ? `${u.beds} Bed` : "Unit");
            const ipW = Math.round((inPlace / maxRent) * 90);
            const mktW = Math.round((market / maxRent) * 90);
            const gapPct = inPlace > 0 && market > inPlace ? ((market - inPlace) / inPlace * 100).toFixed(1) : null;
            return `<tr>` +
              `<td style="padding:4px 8px;font-size:10px;font-weight:600;width:18%;">${escapeHtml(label)}</td>` +
              `<td style="padding:4px 6px;width:30%;"><div style="background:#E5E7EB;height:9px;border-radius:2px;overflow:hidden;"><div style="background:#1e293b;height:100%;width:${ipW}%;border-radius:2px;"></div></div><span style="font-size:9px;color:#374151;">&nbsp;${formatCurrency(inPlace)}</span></td>` +
              `<td style="padding:4px 6px;width:30%;"><div style="background:#E5E7EB;height:9px;border-radius:2px;overflow:hidden;"><div style="background:#94A3B8;height:100%;width:${mktW}%;border-radius:2px;"></div></div><span style="font-size:9px;color:#374151;">&nbsp;${formatCurrency(market)}</span></td>` +
              `<td style="padding:4px 8px;font-size:10px;font-weight:700;text-align:right;color:${gapPct ? "#B8860B" : "#374151"};">${gapPct ? `+${gapPct}% gap` : "-"}</td></tr>`;
          }).join("");
          html = `<div class="no-break" style="margin-top:16px;"><p class="subsection-title" style="margin-bottom:4px;">In-Place vs. Market Rent by Unit Type</p>` +
            `<table style="width:100%;border-collapse:collapse;"><thead><tr>` +
            `<th style="text-align:left;padding:2px 8px;font-size:9px;color:#6B7280;text-transform:uppercase;">Unit Type</th>` +
            `<th style="padding:2px 6px;font-size:9px;color:#64748B;text-transform:uppercase;">In-Place</th>` +
            `<th style="padding:2px 6px;font-size:9px;color:#64748B;text-transform:uppercase;">Market</th>` +
            `<th style="text-align:right;padding:2px 8px;font-size:9px;color:#6B7280;text-transform:uppercase;">Upside Gap</th>` +
            `</tr></thead><tbody>${trs}</tbody></table></div>`;
        }
      }
      finalHtml = replaceAll(finalHtml, "{{RENT_DISTRIBUTION_CHART}}", html);
    }
    // Chart 4: Occupancy buffer gauge
    {
      let html = "";
      if (Number.isFinite(breakEvenOccR) && Number.isFinite(execOccupancy) && breakEvenOccR > 0 && execOccupancy > 0) {
        const beoFmt = formatPercent1(breakEvenOccR);
        const currFmt = formatPercent1(execOccupancy);
        const bufPts = ((execOccupancy - breakEvenOccR) * 100).toFixed(1);
        const beoW = Math.round(breakEvenOccR * 100);
        const bufColor = "#B8860B";
        const bufLabel = (execOccupancy - breakEvenOccR) >= 0.20 ? "Strong cushion" : (execOccupancy - breakEvenOccR) >= 0.10 ? "Adequate cushion" : "Limited cushion";
        const hasSourceReconciliationCaution =
          sourceReconciliationNarrativePolicy?.data_coverage_required === true &&
          hasSourceReconciliationVariance;
        const occupancyInterpretation = `Break-even occupancy is ${beoFmt} versus current occupancy of ${currFmt}, indicating a ${bufPts} percentage-point operating cushion based on reported T12 totals.`;
        const reconciliationCaution = hasSourceReconciliationCaution
          ? " Interpret this cushion alongside source reconciliation disclosure, because variance-sensitive conclusions remain constrained when rent roll and T12 income evidence are materially unreconciled."
          : "";
        html = `<div class="no-break" style="margin-top:16px;"><p class="subsection-title" style="margin-bottom:6px;">Break-Even Occupancy Buffer</p>` +
          `<div style="background:#E5E7EB;height:20px;border-radius:4px;overflow:hidden;position:relative;">` +
          `<div style="background:#B8860B;height:100%;width:${beoW}%;border-radius:4px 0 0 4px;"></div>` +
          `</div>` +
          `<div style="display:flex;justify-content:space-between;margin-top:5px;">` +
          `<span style="font-size:10px;color:#1e293b;font-weight:600;">Break-even: ${beoFmt}</span>` +
          `<span style="font-size:10px;color:#1e293b;font-weight:600;">Current occupancy: ${currFmt}</span>` +
          `</div>` +
          `<p class="small" style="margin-top:4px;color:${bufColor};font-weight:700;">Buffer: ${bufPts} percentage points - ${bufLabel}</p>` +
          `<div style="margin-top:6px;padding:8px 10px;border:1px solid #E5E7EB;border-left:3px solid #9CA3AF;border-radius:4px;background:#F9FAFB;">` +
          `<p class="small" style="margin:0;color:#374151;">${escapeHtml(occupancyInterpretation + reconciliationCaution)}</p>` +
          `</div></div>`;
      }
      finalHtml = replaceAll(finalHtml, "{{OCCUPANCY_BUFFER_VISUAL}}", html);
    }
    // Safety: clear chart tokens for screening mode (scenario section is stripped, so token won't be in HTML, but be safe)
    finalHtml = replaceAll(finalHtml, "{{SCENARIO_TRAJECTORY_CHART}}", "");
    // End HTML/CSS Charts

    // Hard fail-closed: purge all remaining {{...}} tokens before HTML leaves this function
    // Build a deterministic institutional-grade rationale sentence from computed metrics
    let execRationale = "";
    if (effectiveReportMode === "v1_core" && dealScoreState.displayVerdict?.cap_explanation) {
      execRationale = dealScoreState.displayVerdict.cap_explanation;
    } else if (effectiveReportMode === "screening_v1" && screeningVisibleClassificationForConsumers) {
      const erStr  = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : null;
      const nmStr  = Number.isFinite(noiMarginR)    ? formatPercent1(noiMarginR)    : null;
      const beoStr = Number.isFinite(breakEvenOccR) ? formatPercent1(breakEvenOccR) : null;
      if (screeningVisibleClassificationForConsumers === "Stable") {
        const parts = [];
        if (erStr)  parts.push(`expense ratio of ${erStr}`);
        if (nmStr)  parts.push(`NOI margin of ${nmStr}`);
        if (beoStr) parts.push(`break-even occupancy of ${beoStr}`);
        execRationale = parts.length > 0
          ? `Classified STABLE: ${parts.join(", ")} are within institutional operating thresholds.`
          : "Classified STABLE: operating metrics remain within defined screening thresholds.";
      } else if (screeningVisibleClassificationForConsumers === "Sensitized") {
        const breaches = [];
        if (Number.isFinite(expenseRatioR) && expenseRatioR > 0.55 && erStr)
          breaches.push(`elevated operating expense burden (${erStr}) breaches the sensitized threshold`);
        if (Number.isFinite(noiMarginR) && noiMarginR < 0.45 && nmStr)
          breaches.push(`compressed NOI margin (${nmStr}) breaches the sensitized threshold`);
        if (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.75 && beoStr)
          breaches.push(`break-even occupancy of ${beoStr} exceeds the 75.0% sensitized threshold`);
        execRationale = breaches.length > 0
          ? `Operating profile classified as SENSITIZED: ${breaches.join("; ")}.`
          : `Operating profile classified as SENSITIZED: ${screeningExplanation}`;
      } else if (screeningVisibleClassificationForConsumers === "Fragile") {
        const breaches = [];
        if (Number.isFinite(expenseRatioR) && expenseRatioR > 0.65 && erStr)
          breaches.push(`expense ratio of ${erStr} breaches the 65.0% fragile threshold`);
        if (Number.isFinite(noiMarginR) && noiMarginR < 0.35 && nmStr)
          breaches.push(`NOI margin of ${nmStr} is critically compressed`);
        if (Number.isFinite(breakEvenOccR) && breakEvenOccR > 0.85 && beoStr)
          breaches.push(`break-even occupancy of ${beoStr} breaches the 85.0% fragile threshold`);
        execRationale = breaches.length > 0
          ? `Classified FRAGILE: ${breaches.join("; ")}.`
          : `Classified FRAGILE: ${screeningExplanation}`;
      } else if (screeningVisibleClassificationForConsumers === "Review - Source Reconciliation Disclosure") {
        execRationale = "Classification is capped by source reconciliation disclosure pending reconciliation of rent roll and T12 evidence.";
      } else if (screeningVisibleClassificationForConsumers === "Review - Insufficient Core Support") {
        execRationale = "Classification is capped by insufficient core support. Required core operating evidence remains incomplete.";
      }
    } else if (screeningClass === "Insufficient Data") {
      execRationale = "Insufficient operating data to determine classification.";
    }
    finalHtml = replaceAll(finalHtml, "{{EXEC_CLASSIFICATION_RATIONALE}}", execRationale);
    finalHtml = finalHtml.replace(/^\s*\{\{EXEC_CLASSIFICATION_RATIONALE\}\}\s*$/gm, "");
    const leftoverTokens = finalHtml.match(/\{\{[A-Z0-9_]+\}\}/g) || [];
    leftoverTokens.forEach((t) => {
      finalHtml = finalHtml.replaceAll(t, "");
    });
    // Optional: log which narrative sections are missing for debugging
    const missingKeys = [
      "execSummary",
      "unitValueAdd",
      "cashFlowProjections",
      "neighborhoodAnalysis",
      "riskAssessment",
      "renovationNarrative",
      "debtStructure",
      "dealScoreSummary",
      "dealScoreInterpretation",
      "advancedModelingIntro",
      "dcfInterpretation",
      "finalRecommendation",
    ].filter((k) => !sections[k]);
    if (missingKeys.length > 0) {
      console.warn("WARN Missing narrative sections:", missingKeys.join(", "));
    }
    // 8. Sentence integrity with safe fallback
    let safeHtml = finalHtml;
    let warnings = [];
    try {
      safeHtml = ensureSentenceIntegrity(finalHtml);
    } catch (err) {
      warnings.push(err?.message || "Sentence integrity validation failed");
    }
    if (warnings.length > 0) {
      console.warn("WARN Sentence Integrity Warnings:");
      warnings.forEach((w) => console.warn(" - " + w));
      if (!isFullRenderHarness) {
        const safeTimestamp = new Date().toISOString().replace(/:/g, "-");
        const { error: warnErr } = await supabase
          .from("analysis_artifacts")
          .insert([
            {
              job_id: jobId || null,
              user_id: effectiveUserId || null,
              type: "worker_event",
              bucket: "internal",
              object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/sentence_integrity_warning/${safeTimestamp}.json`,
              payload: {
                warnings,
                timestamp: new Date().toISOString(),
              },
            },
          ]);
        if (warnErr) {
          console.error("Failed to write sentence_integrity_warning artifact:", warnErr);
        }
      }
    }
    if (isFullRenderHarness) {
      const htmlStringRaw =
        typeof safeHtml === "string"
          ? safeHtml
          : safeHtml && typeof safeHtml === "object" && typeof safeHtml.html === "string"
            ? safeHtml.html
            : String(safeHtml || "");
      let htmlString = sanitizeTypography(htmlStringRaw);
      const harnessDocumentTreatmentHtml = buildDocumentTreatmentSummaryHtml({
        reportMode: effectiveReportMode,
        documentSources,
        currentDebtAssessmentState,
        canonicalAcquisitionState:
          underwritingState?.core?.acquisition?.assumptionState ||
          acquisitionAssumptionState ||
          null,
        loanTermSheetTermsPayload,
        acquisitionTermsPayload,
        hasForwardLookingRenovationInputs: renovationReturnAssumptionsPresent,
        renovationDisplayMode,
        renovationPayload,
        propertyTaxPayload,
        propertyTaxBindingState,
        documentQuantitativeUsageMap,
        canonicalSupportDocMap: acquisitionMemoRenderContext?.canonicalSupportDocMap || null,
        renderedDocumentTreatmentRowsOut: renderedDocumentTreatmentRows,
      });
      if (effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.acquisitionMemoProjection) {
        htmlString = renderCompleteAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs);
      } else if (typeof htmlString === "string" && htmlString.includes("<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->")) {
        htmlString = htmlString.replace(
          /<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->[\s\S]*?<!-- END DOCUMENT_TREATMENT_SUMMARY -->/,
          `<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${harnessDocumentTreatmentHtml || ""}<!-- END DOCUMENT_TREATMENT_SUMMARY -->`
        );
      }
      return res.status(200).json({
        success: true,
        report_type: reportType,
        report_mode: effectiveReportMode,
        final_html: htmlString,
      });
    }
// 9. Send to DocRaptor (STILL IN TEST MODE)
const htmlStringRaw =
  typeof safeHtml === "string"
    ? safeHtml
    : safeHtml && typeof safeHtml === "object" && typeof safeHtml.html === "string"
      ? safeHtml.html
      : String(safeHtml || "");
let htmlString = sanitizeTypography(htmlStringRaw);
const htmlLength = htmlString.length;
const hasClosingHtml = htmlString.includes("</html>");
const hasFinalRecommendation =
  htmlString.includes("11.0") && htmlString.includes("Final Recommendations");
const hasSectionTwelve =
  htmlString.includes("12.0") && htmlString.includes("Methodology & Data Transparency");
const docraptorMode =
  process.env.DOCRAPTOR_MODE === "production" ? "production" : "test";
const allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true";
const integrityTimestamp = new Date().toISOString().replace(/:/g, "-");
try {
  const { error: integrityErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "worker_event",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/report_html_integrity/${integrityTimestamp}.json`,
      payload: {
        event: "report_html_integrity",
        html_length: htmlLength,
        has_closing_html: hasClosingHtml,
        has_final_recommendation: hasFinalRecommendation,
        has_section_12: hasSectionTwelve,
        report_tier: reportTier,
        report_type: reportType,
        allow_assumptions: allowAssumptions,
        timestamp: new Date().toISOString(),
      },
    },
  ]);
  if (integrityErr) {
    console.error("Failed to write report_html_integrity event:", integrityErr);
  }
} catch (err) {
  console.error("Failed to log report_html_integrity:", err);
}
let reportQaFlags = [];
try {
  const qaFlags = [];
  let qaFileRows = Array.isArray(documentSources) ? documentSources : [];
  if (jobId) {
    const { data: qaFiles, error: qaFilesErr } = await supabase
      .from("analysis_job_files")
      .select("original_filename, doc_type, parse_status, parse_error")
      .eq("job_id", jobId);
    if (!qaFilesErr && Array.isArray(qaFiles)) {
      qaFileRows = qaFiles;
    }
  }
  const normalizedSourceFiles = qaFileRows.map((row) => ({
    original_filename: String(row?.original_filename || ""),
    doc_type: String(row?.doc_type || ""),
    parse_status: String(row?.parse_status || ""),
    parse_error: String(row?.parse_error || ""),
  }));
  const fileNameText = normalizedSourceFiles
    .map((row) => row.original_filename.toLowerCase())
    .join(" | ");
  const debtLookingFile = normalizedSourceFiles.find((row) =>
    row.doc_type === "mortgage_statement" ||
    /(current\s+debt|mortgage|outstanding\s+balance|unpaid\s+principal|loan\s+balance)/i.test(row.original_filename)
  );
  let parsedDebtArtifacts = [];
  if (jobId) {
    const { data: debtArtifacts, error: debtArtifactsErr } = await supabase
      .from("analysis_artifacts")
      .select("type,payload")
      .eq("job_id", jobId)
      .in("type", ["loan_term_sheet_parsed", "mortgage_statement_parsed"]);
    if (!debtArtifactsErr && Array.isArray(debtArtifacts)) {
      parsedDebtArtifacts = debtArtifacts;
    }
  }
  const debtArtifactWithMissingBalance = parsedDebtArtifacts.find((artifact) => {
    const payload = artifact?.payload || {};
    if (artifact?.type !== "mortgage_statement_parsed") return false;
    const hasDebtTerms =
      hasDebtTermsPayload(payload) ||
      isFinitePositive(payload.monthly_payment) ||
      (Array.isArray(payload.parse_warnings) &&
        payload.parse_warnings.includes("missing_loan_amount"));
    const loanAmount = coerceNumber(payload.loan_amount);
    const outstandingBalance = coerceNumber(payload.outstanding_balance);
    return hasDebtTerms && !isFinitePositive(loanAmount) && !isFinitePositive(outstandingBalance);
  });
  const parsedDebtBalance = coerceNumber(mortgagePayload?.outstanding_balance);
  const debtTermsPresent =
    Boolean(debtLookingFile) ||
    hasDebtTermsPayload(mortgagePayload);
  const acquisitionFinancingInputsUsable =
    effectiveReportMode === "v1_core" &&
    isFinitePositive(loanTermSheetTermsPayload?.purchase_price) &&
    isFinitePositive(loanTermSheetTermsPayload?.ltv) &&
    isFinitePositive(loanTermSheetTermsPayload?.interest_rate) &&
    isFinitePositive(loanTermSheetTermsPayload?.amort_years) &&
    isFinitePositive(loanTermSheetTermsPayload?.derived_acquisition_loan_amount);
  const acquisitionFinancingRendered =
    /Proposed Acquisition Financing Context|Acquisition Financing Readiness|Proposed Loan Amount|Documented LTV/i.test(htmlString);
  const acquisitionFinancingReadinessInputsUsable =
    effectiveReportMode === "v1_core" &&
    /acquisition|proposed|purchase/i.test(
      String(
        loanTermSheetTermsPayload?.debt_basis ||
        acquisitionTermsPayload?.debt_basis ||
        loanTermSheetTermsPayload?.semantic_doc_role ||
        acquisitionTermsPayload?.semantic_doc_role ||
        loanTermSheetTermsPayload?.source_text ||
        acquisitionTermsPayload?.source_text ||
        ""
      ).toLowerCase()
    ) &&
    isFinitePositive(loanTermSheetTermsPayload?.purchase_price ?? acquisitionTermsPayload?.purchase_price) &&
    (
      isFinitePositive(loanTermSheetTermsPayload?.stated_acquisition_loan_amount) ||
      isFinitePositive(loanTermSheetTermsPayload?.loan_amount) ||
      isFinitePositive(loanTermSheetTermsPayload?.derived_acquisition_loan_amount) ||
      isFinitePositive(loanTermSheetTermsPayload?.ltv) ||
      isFinitePositive(acquisitionTermsPayload?.ltv)
    ) &&
    isFinitePositive(loanTermSheetTermsPayload?.interest_rate ?? acquisitionTermsPayload?.interest_rate) &&
    isFinitePositive(
      loanTermSheetTermsPayload?.amort_years ??
      loanTermSheetTermsPayload?.amortization_years ??
      acquisitionTermsPayload?.amort_years ??
      acquisitionTermsPayload?.amortization_years
    ) &&
    isFinitePositive(t12Payload?.net_operating_income);
  const acquisitionFinancingReadinessRendered =
    /Proposed Acquisition Financing Context|Acquisition Financing Readiness|Source-complete inputs provided \/ available for future underwriting\.|Proposed Loan Amount|Documented LTV|Interest Rate|Amortization/i.test(htmlString);
  const acquisitionFinancingDerivedOnlyRendered =
    acquisitionFinancingInputsUsable &&
    acquisitionFinancingRendered &&
    !isFinitePositive(loanTermSheetTermsPayload?.loan_amount) &&
    !isFinitePositive(loanTermSheetTermsPayload?.outstanding_balance) &&
    !isFinitePositive(mortgagePayload?.loan_amount) &&
    !isFinitePositive(mortgagePayload?.outstanding_balance) &&
    loanTermSheetTermsPayload?.debt_basis === "acquisition_financing_assumption";
  const acquisitionLenderFeePresent = isFinitePositive(
    loanTermSheetTermsPayload?.lender_fee_percent ??
    loanTermSheetTermsPayload?.origination_fee_percent ??
    loanTermSheetTermsPayload?.financing_fee_percent
  );
  const acquisitionStatedLoanPresent = isFinitePositive(
    loanTermSheetTermsPayload?.stated_acquisition_loan_amount ?? loanTermSheetTermsPayload?.loan_amount
  );
  const acquisitionTriangleValidationStateForQa =
    underwritingState?.core?.acquisition?.triangleValidationState || null;
  const acquisitionPurchasePriceVerifiedByTriangle =
    acquisitionTriangleValidationStateForQa &&
    Array.isArray(acquisitionTriangleValidationStateForQa.verifiedFields) &&
    acquisitionTriangleValidationStateForQa.verifiedFields.includes("purchase_price");
  const acquisitionPurchasePricePresent =
    isFinitePositive(loanTermSheetTermsPayload?.purchase_price) || acquisitionPurchasePriceVerifiedByTriangle;

  if (acquisitionFinancingInputsUsable && !acquisitionFinancingRendered) {
    qaFlags.push({
      code: "ACQUISITION_FINANCING_RENDER_MISSING",
      severity: "high",
      message: "Proposed acquisition financing inputs were parsed but did not render.",
      evidence: {
        purchase_price_present: isFinitePositive(loanTermSheetTermsPayload?.purchase_price),
        ltv_present: isFinitePositive(loanTermSheetTermsPayload?.ltv),
        derived_acquisition_loan_amount_present: isFinitePositive(loanTermSheetTermsPayload?.derived_acquisition_loan_amount),
        current_loan_amount_present: isFinitePositive(loanTermSheetTermsPayload?.loan_amount),
      },
      admin_check: "Inspect report renderer/token/section gating.",
    });
  }
  if (acquisitionFinancingReadinessInputsUsable && !acquisitionFinancingReadinessRendered) {
    qaFlags.push({
      code: "ACQUISITION_FINANCING_READINESS_RENDER_MISSING",
      severity: "high",
      message: "Proposed acquisition financing inputs were parsed but the launch readiness section did not render.",
      evidence: {
        purchase_price_present: isFinitePositive(loanTermSheetTermsPayload?.purchase_price ?? acquisitionTermsPayload?.purchase_price),
        ltv_present: isFinitePositive(loanTermSheetTermsPayload?.ltv ?? acquisitionTermsPayload?.ltv),
        proposed_loan_amount_present: isFinitePositive(loanTermSheetTermsPayload?.stated_acquisition_loan_amount ?? loanTermSheetTermsPayload?.loan_amount ?? loanTermSheetTermsPayload?.derived_acquisition_loan_amount),
        interest_rate_present: isFinitePositive(loanTermSheetTermsPayload?.interest_rate ?? acquisitionTermsPayload?.interest_rate),
        amort_years_present: isFinitePositive(loanTermSheetTermsPayload?.amort_years ?? loanTermSheetTermsPayload?.amortization_years ?? acquisitionTermsPayload?.amort_years ?? acquisitionTermsPayload?.amortization_years),
      },
      admin_check: "Inspect launch acquisition financing readiness rendering and section gating.",
    });
  }
  if (effectiveReportMode === "v1_core" && !acquisitionPurchasePricePresent && isFinitePositive(loanTermSheetTermsPayload?.ltv)) {
    qaFlags.push({
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      severity: "medium",
      reason_code: "purchase_price_not_verified",
      message: "Acquisition financing purchase price was not verified; acquisition section should be qualified/limited.",
      evidence: {
        purchase_price_present: false,
        ltv_present: isFinitePositive(loanTermSheetTermsPayload?.ltv),
      },
      admin_check: "Review canonical acquisition field extraction for purchase price support.",
    });
  }
  if (effectiveReportMode === "v1_core" && !acquisitionStatedLoanPresent && !isFinitePositive(loanTermSheetTermsPayload?.derived_acquisition_loan_amount)) {
    qaFlags.push({
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      severity: "medium",
      reason_code: "stated_acquisition_loan_amount_not_verified",
      message: "Stated acquisition loan amount was not verified; acquisition loan rows should remain omitted/qualified.",
      evidence: {
        stated_acquisition_loan_amount_present: false,
        derived_acquisition_loan_amount_present: isFinitePositive(loanTermSheetTermsPayload?.derived_acquisition_loan_amount),
      },
      admin_check: "Review canonical acquisition field extraction for stated loan amount support.",
    });
  }
  if (effectiveReportMode === "v1_core" && !acquisitionLenderFeePresent) {
    qaFlags.push({
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      severity: "low",
      reason_code: "lender_fee_percent_not_verified",
      message: "Lender/origination fee percent was not verified from acquisition support.",
      evidence: {
        lender_fee_percent_present: false,
      },
      admin_check: "Confirm fee terms were absent or unparseable in source acquisition support.",
    });
  }
  if (effectiveReportMode === "v1_core" && loanTermSheetTermsPayload?.debt_basis === "acquisition_financing_assumption") {
    qaFlags.push({
      code: "ACQUISITION_NOT_CURRENT_DEBT_CLASSIFICATION",
      severity: "low",
      reason_code: "acquisition_financing_not_current_debt",
      message: "Acquisition/proposed financing is classified separately from current debt coverage basis.",
      evidence: {
        debt_basis: loanTermSheetTermsPayload?.debt_basis || null,
        outstanding_balance_present: isFinitePositive(loanTermSheetTermsPayload?.outstanding_balance),
      },
      admin_check: "Informational classification marker; no action required if current-debt separation remains intact.",
    });
  }

  if (
    effectiveReportMode === "v1_core" &&
    !isFinitePositive(parsedDebtBalance) &&
    !acquisitionFinancingDerivedOnlyRendered &&
    (debtArtifactWithMissingBalance || (debtLookingFile && debtTermsPresent))
  ) {
    const debtPayload =
      debtArtifactWithMissingBalance?.payload ||
      loanTermSheetTermsPayload ||
      mortgagePayload ||
      {};
    qaFlags.push({
      code: "DEBT_FILE_WITH_MISSING_BALANCE",
      severity: "high",
      message: "Debt terms were identified, but no debt balance or loan amount was parsed.",
      evidence: {
        artifact_type: debtArtifactWithMissingBalance?.type || null,
        doc_type: debtLookingFile?.doc_type || null,
        parse_status: debtLookingFile?.parse_status || null,
      interest_rate: debtPayload?.interest_rate ?? null,
      amort_years: debtPayload?.amort_years ?? null,
      ltv: debtPayload?.ltv ?? null,
      refi_cap_rate: debtPayload?.refi_cap_rate ?? null,
        parse_warning: Array.isArray(debtPayload?.parse_warnings)
          ? debtPayload.parse_warnings.find((warning) => warning === "missing_loan_amount") || null
          : null,
      },
      admin_check: "Review the source debt document and loan-term parser. If the document contains an outstanding balance, update parser support before treating DSCR/refinance outputs as complete.",
    });
  }

  const annualTax = coerceNumber(propertyTaxPayload?.annual_tax);
  const hasValidatedAnnualPropertyTax = isValidAnnualPropertyTaxValue(annualTax);
  if (Number.isFinite(annualTax) && !hasValidatedAnnualPropertyTax) {
    qaFlags.push({
      code: "PROPERTY_TAX_AMOUNT_IMPLAUSIBLE",
      severity: "medium",
      message: "The parsed annual property tax value appears year-like or implausibly low.",
      evidence: {
        parsed_annual_tax: annualTax,
        original_filename: propertyTaxPayload?.original_filename || null,
      },
      admin_check: "Confirm the property tax parser did not capture a tax year instead of the annual tax amount.",
    });
  }
  if (hasValidatedAnnualPropertyTax) {
    const t12ExpenseLines = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines : [];
    const t12PropertyTaxLine = t12ExpenseLines.find((line) => {
      const label = String(line?.label || line?.name || "").trim().toLowerCase();
      if (!label) return false;
      if (!/(property tax|real estate tax|municipal tax|\bre taxes\b)/i.test(label)) return false;
      if (/total|subtotal/i.test(label)) return false;
      const amount = coerceNumber(line?.amount ?? line?.value ?? line?.annual_amount);
      return Number.isFinite(amount) && amount > 0;
    });
    const t12PropertyTaxAmount = coerceNumber(
      t12PropertyTaxLine?.amount ?? t12PropertyTaxLine?.value ?? t12PropertyTaxLine?.annual_amount
    );
    if (Number.isFinite(t12PropertyTaxAmount) && t12PropertyTaxAmount > 0) {
      const variancePct = Math.abs(annualTax - t12PropertyTaxAmount) / Math.max(annualTax, t12PropertyTaxAmount);
      if (variancePct >= 0.1 && Math.abs(annualTax - t12PropertyTaxAmount) >= 1000) {
        qaFlags.push({
          code: "PROPERTY_TAX_T12_MISMATCH",
          severity: "medium",
          message: "Property tax parsed annual value and T12 property-tax line appear materially inconsistent.",
          evidence: {
            parsed_annual_tax: annualTax,
            t12_property_tax_line_amount: t12PropertyTaxAmount,
            original_filename: propertyTaxPayload?.original_filename || null,
          },
          admin_check: "Review property-tax bill and T12 tax line mapping; disclose the mismatch before relying on tax-sensitive outputs.",
        });
      }
    }
  }

  const dscrAssessedFromDebtRows = /<td>DSCR \(T12 NOI\)<\/td><td>[0-9.]+x<\/td>/i.test(htmlString);
  if (
    debtTermsPresent &&
    !dscrAssessedFromDebtRows &&
    htmlString.includes("DSCR") &&
    /Current Debt DSCR[^<]{0,120}(?:Not assessed|current outstanding debt balance not provided)|current outstanding debt balance not provided/i.test(htmlString)
  ) {
    qaFlags.push({
      code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
      severity: "medium",
      message: "The report indicates Current Debt DSCR was not assessed even though debt-looking support or debt terms were present.",
      evidence: {
        debt_filename: debtLookingFile?.original_filename || null,
        has_debt_terms_payload: hasDebtTermsPayload(loanTermSheetTermsPayload) || hasDebtTermsPayload(mortgagePayload),
      },
      admin_check: "Review whether the debt source file should have produced a usable balance, rate, and amortization before publication.",
    });
  }

  const incomeLineCount = Array.isArray(t12Payload?.income_lines) ? t12Payload.income_lines.length : 0;
  const expenseLineCount = Array.isArray(t12Payload?.expense_lines) ? t12Payload.expense_lines.length : 0;
  if (t12Payload && incomeLineCount === 0 && expenseLineCount === 0) {
    qaFlags.push({
      code: "T12_TOTALS_ONLY",
      severity: "low",
      message: "The parsed T12 artifact contains core totals but no income or expense line-item detail.",
      evidence: {
        method: t12Payload?.method || null,
        income_line_count: incomeLineCount,
        expense_line_count: expenseLineCount,
      },
      admin_check: "For a showcase report, consider using a source format that produces line-item T12 detail.",
    });
  }

  const surveyLikeFailed = normalizedSourceFiles.find((row) =>
    /(market|survey|rent_survey|comp|comparable|market_rent)/i.test(row.original_filename) &&
    row.doc_type === "rent_roll" &&
    row.parse_status === "failed"
  );
  if (surveyLikeFailed) {
    qaFlags.push({
      code: "MARKET_SURVEY_CLASSIFICATION_REVIEW",
      severity: "low",
      message: "A market-survey-like support file is present and may require classification review if it was treated as rent roll input.",
      evidence: {
        filename: surveyLikeFailed.original_filename,
        doc_type: surveyLikeFailed.doc_type,
        parse_status: surveyLikeFailed.parse_status,
        parse_error: surveyLikeFailed.parse_error || null,
      },
      admin_check: "Confirm market survey files are not being counted as failed core rent-roll files.",
    });
  }

  let usableAppraisalCapRates = [];
  if (jobId) {
    const { data: appraisalArtifacts, error: appraisalArtifactsErr } = await supabase
      .from("analysis_artifacts")
      .select("payload")
      .eq("job_id", jobId)
      .eq("type", "appraisal_parsed");
    if (!appraisalArtifactsErr && Array.isArray(appraisalArtifacts)) {
      usableAppraisalCapRates = appraisalArtifacts
        .map((artifact) => coerceNumber(artifact?.payload?.cap_rate))
        .filter((value) => isFinitePositive(value));
    }
  }
  if (
    effectiveReportMode === "v1_core" &&
    !isFinitePositive(refiFinancials?.refi_cap_rate_base) &&
    (usableAppraisalCapRates.length > 0 ||
      /cap(?:italization)? rate|going-in cap|purchase assumption/i.test(fileNameText))
  ) {
    qaFlags.push({
      code: "CAP_RATE_SUPPORT_NOT_USED",
      severity: "medium",
      message: "Cap-rate or purchase-assumption support appears present by filename/context, but no usable cap-rate basis reached the report financials.",
      evidence: {
        refi_cap_rate_base: refiFinancials?.refi_cap_rate_base ?? null,
        appraisal_cap_rate: appraisalPayload?.cap_rate ?? null,
        usable_appraisal_cap_rates: usableAppraisalCapRates,
      },
      admin_check: "Review appraisal and purchase-support artifacts for valid cap-rate support masked by later null artifacts or classification issues.",
    });
  }

  if (docraptorMode !== "production" || !allowProductionPdf) {
    qaFlags.push({
      code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
      severity: "medium",
      message: "DocRaptor is not configured for production PDF output.",
      evidence: {
        docraptor_mode: docraptorMode,
        allow_production_pdf: allowProductionPdf,
      },
      admin_check: "Do not use this PDF as a public sample until production PDF mode is enabled and verified.",
    });
  }

  const qaSummary = getReportQaStatus(qaFlags);
  reportQaFlags = qaFlags;
  const qaTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: qaErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "report_qa_flags",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/report_qa_flags/${qaTimestamp}.json`,
      payload: {
        event: "report_qa_flags",
        qa_status: qaSummary.qa_status,
        severity: qaSummary.severity,
        flags: qaFlags,
        report_type: reportType,
        report_tier: reportTier,
        html_length: htmlLength,
        timestamp: new Date().toISOString(),
      },
    },
  ]);
  if (qaErr) {
    console.error("Failed to write report_qa_flags artifact:", qaErr);
  }
} catch (err) {
  console.error("Failed to build report_qa_flags artifact:", err);
}
if (!hasClosingHtml) {
  const truncatedTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "report_html_truncated",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/report_html_truncated/${truncatedTimestamp}.json`,
        payload: {
          error: "report_html_truncated",
          html_length: htmlLength,
          has_closing_html: hasClosingHtml,
          has_final_recommendation: hasFinalRecommendation,
          has_section_12: hasSectionTwelve,
          html: htmlString,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (err) {
    console.error("Failed to write report_html_truncated artifact:", err);
  }
  if (jobId) {
    await supabase
      .from("analysis_jobs")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_code: "REPORT_HTML_TRUNCATED",
        error_message: "report_html_truncated",
      })
      .eq("id", jobId);
  }
  return res.status(500).json({ error: "report_html_truncated" });
}
const templateLength = typeof htmlTemplate === "string" ? htmlTemplate.length : null;
if (!hasSectionTwelve) {
  const incompleteTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "report_html_incomplete",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/report_html_incomplete/${incompleteTimestamp}.json`,
        payload: {
          error: "report_html_incomplete",
          template_path: templatePath,
          template_length: templateLength,
          final_length: htmlLength,
          first_500: htmlString.slice(0, 500),
          last_500: htmlString.slice(-500),
          has_section_12: hasSectionTwelve,
          has_closing_html: hasClosingHtml,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (err) {
    console.error("Failed to write report_html_incomplete artifact:", err);
  }
  if (jobId) {
    await supabase
      .from("analysis_jobs")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_code: "REPORT_HTML_INCOMPLETE",
        error_message: "report_html_incomplete",
      })
      .eq("id", jobId);
  }
  return res.status(500).json({ error: "report_html_incomplete" });
}
let pdfResponse;
// Final customer-facing HTML surface used for both QA and DocRaptor.
const buildMarkerValue =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  null;
const runtimeMarkerTimestamp = new Date().toISOString().replace(/:/g, "-");
if (jobId) {
  try {
    await supabase.from("analysis_artifacts").insert([{
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "worker_event",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/generate_client_report_runtime_marker/${runtimeMarkerTimestamp}.json`,
      payload: {
        event: "generate_client_report_runtime_marker",
        marker_version: "source-reconciliation-final-guard-v3",
        build_marker: buildMarkerValue || "source-reconciliation-final-guard-v3",
        git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || null,
        deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
        report_type: reportType,
        job_id: jobId || null,
        timestamp: new Date().toISOString(),
      },
    }]);
  } catch (err) {
    console.error("Failed to write generate_client_report_runtime_marker artifact:", err?.message || err);
  }
}
// --- V2 SOURCE AUTHORITY BRIDGE START ---
if (effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.acquisitionMemoProjection) {
  htmlString = renderCompleteAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs);
}
// --- V2 SOURCE AUTHORITY BRIDGE END ---
  let qaHtml = sanitizeTypography(dedupeDataNotAvailableBySection(htmlString));
const qaHtmlBeforeFinalSourceReconciliationGuard = qaHtml;
const finalSourceReconciliationGuard = applyFinalSourceReconciliationRenderGuard(
  qaHtmlBeforeFinalSourceReconciliationGuard,
  sourceReconciliationState
);
qaHtml = finalSourceReconciliationGuard.html;
qaHtml = applyFinalSectionHealRenderGuards(qaHtml, {
  effectiveReportMode,
  reportType,
  currentDebtAssessmentState,
  mortgagePayload,
  loanTermSheetTermsPayload,
  financials,
  t12Payload,
});
const finalSourceReconciliationGuardDiagnostic = {
  event: "source_reconciliation_final_guard_diagnostic",
  guard_version: "source-reconciliation-final-guard-v3",
  guard_ran: true,
  html_length_before: String(qaHtmlBeforeFinalSourceReconciliationGuard || "").length,
  html_length_after: String(finalSourceReconciliationGuard.html || "").length,
  canonical_variance_display: finalSourceReconciliationGuard.render_state?.variance_display || null,
  canonical_variance_pct: finalSourceReconciliationGuard.render_state?.variance_pct ?? null,
  canonical_rr_annual_in_place_source: finalSourceReconciliationGuard.render_state?.rr_annual_in_place_source || null,
  canonical_t12_gpr_source: finalSourceReconciliationGuard.render_state?.t12_gpr_source || null,
  canonical_source_selection: finalSourceReconciliationGuard.render_state?.source_selection || null,
  stale_minus_48_count_before: finalSourceReconciliationGuard.stale_minus_48_count_before || 0,
  stale_minus_48_count_after: finalSourceReconciliationGuard.stale_minus_48_count_after || 0,
  rent_roll_vs_t12_snippet_before: finalSourceReconciliationGuard.matched_snippets_before || [],
  rent_roll_vs_t12_snippet_after: finalSourceReconciliationGuard.matched_snippets_after || [],
  rent_roll_vs_t12_display_before: finalSourceReconciliationGuard.matched_displays_before || [],
  rent_roll_vs_t12_display_after: finalSourceReconciliationGuard.matched_displays_after || [],
  report_contract_qa_receives_guarded_html: true,
  timestamp: new Date().toISOString(),
};
if (jobId) {
  try {
    await supabase.from("analysis_artifacts").insert([{
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "worker_event",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/source_reconciliation_final_guard_diagnostic/${runtimeMarkerTimestamp}.json`,
      payload: finalSourceReconciliationGuardDiagnostic,
    }]);
  } catch (err) {
    console.error("Failed to write source_reconciliation_final_guard_diagnostic artifact:", err?.message || err);
  }
}
const finalSourceReconciliationGuardHasMismatch =
  finalSourceReconciliationGuard.render_state?.renderable
    ? finalSourceReconciliationGuard.matched_displays_after.some((display) => display !== finalSourceReconciliationGuard.render_state?.variance_display) ||
      (finalSourceReconciliationGuard.matched_displays_after.length === 0 &&
        (
          /Rent Roll vs T12 GPR Variance/i.test(qaHtml) ||
          /Rent roll annualized rent is/i.test(qaHtml) ||
          /Source reconciliation variance of/i.test(qaHtml)
        ))
    : finalSourceReconciliationGuard.matched_displays_after.length > 0;
if (finalSourceReconciliationGuardHasMismatch) {
  console.error("source_reconciliation_final_guard_postcheck_failed", finalSourceReconciliationGuardDiagnostic);
  const guardFailure = new Error("Final HTML reconciliation guard failed to remove stale variance text");
  guardFailure.code = "REPORT_GENERATION_FAILED";
  guardFailure.context = finalSourceReconciliationGuardDiagnostic;
  throw guardFailure;
}
if (finalSourceReconciliationGuard.replaced_or_suppressed) {
  console.warn("[investoriq] final reconciliation guard applied", {
    canonical_display: finalSourceReconciliationGuard.render_state?.variance_display || null,
    matched_snippets_before: finalSourceReconciliationGuard.matched_snippets_before,
    matched_snippets_after: finalSourceReconciliationGuard.matched_snippets_after,
    renderable: Boolean(finalSourceReconciliationGuard.render_state?.renderable),
  });
}
let docHtml = qaHtml;
let sourceCoverageQaResult = null;
let renderedQaResult = null;
let renderedQaStatus = "not_run";
let qaFixRoutingResult = null;
let qaManagerReviewResult = null;
let reportContractQaResult = null;
let qaActionPlanResult = null;
let qaDirectorReviewResult = null;
let deliveryGateDecisionResult = null;
let deliveryDecisionStateResult = null;
let sourcePackageQaResult = null;
try {
  const supportDocAuthorityRowsForQa = canonicalSupportDocAuthorityRows;
  const sourceCoverageQa = buildSourceReportCoverageQa({
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
    reportType,
    reportTier,
    html: qaHtml,
    uploadedFiles: sourcePackageQaFiles,
    artifacts: sourcePackageQaArtifacts,
    sourceReconciliationState,
    visibleClassificationState: underwritingState?.core?.classification?.visibleClassificationState || null,
    currentDebtState:
      underwritingState?.core?.currentDebt?.assessmentState ||
      currentDebtAssessmentState ||
      null,
    acquisitionAssumptionState:
      underwritingState?.core?.acquisition?.assumptionState ||
      acquisitionAssumptionState ||
      null,
    coreInputSufficiencyState:
      underwritingState?.core?.sufficiency?.coreInputState ||
      coreInputSufficiencyState ||
      null,
    t12SufficiencyState:
      underwritingState?.core?.sufficiency?.t12State ||
      t12SufficiencyState ||
      null,
    rentRollSufficiencyState:
      underwritingState?.core?.sufficiency?.rentRollState ||
      rentRollSufficiencyState ||
      null,
    sectionEligibility:
      underwritingState?.core?.sections?.eligibilityState ||
      sectionEligibility ||
      null,
    dataCoverageState:
      underwritingState?.core?.dataCoverage ||
      dataCoverageState ||
      null,
    underwritingState,
  });
  sourceCoverageQa.canonical_support_doc_authority_map = canonicalSupportDocAuthorityMapArtifact;
  sourceCoverageQa.support_document_authority_rows = supportDocAuthorityRowsForQa;
  sourceCoverageQa.document_treatment_canonical_rows = supportDocAuthorityRowsForQa.length > 0
    ? supportDocAuthorityRowsForQa
    : canonicalizeDocumentTreatmentSources(
      Array.isArray(sourceCoverageQa?.uploaded_files) ? sourceCoverageQa.uploaded_files : []
    );
  if (typeof finalHtml === "string" && /Proposed Acquisition Financing Context|Source-complete inputs provided \/ available for future underwriting\./i.test(finalHtml)) {
    const renderedSignals = Array.isArray(sourceCoverageQa.rendered_text_signals)
      ? sourceCoverageQa.rendered_text_signals
      : [];
    if (!renderedSignals.includes("acquisition_financing_assumptions")) {
      renderedSignals.push("acquisition_financing_assumptions");
    }
    sourceCoverageQa.rendered_text_signals = renderedSignals;
  }
  if (typeof finalHtml === "string" && /Proposed Acquisition Financing:\s*Not source-complete \/ not modeled\./i.test(finalHtml)) {
    const renderedSignals = Array.isArray(sourceCoverageQa.rendered_text_signals)
      ? sourceCoverageQa.rendered_text_signals
      : [];
    if (!renderedSignals.includes("acquisition_financing_readiness_limited")) {
      renderedSignals.push("acquisition_financing_readiness_limited");
    }
    sourceCoverageQa.rendered_text_signals = renderedSignals;
  }
  sourceCoverageQaResult = sourceCoverageQa;
  if (effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.acquisitionMemoProjection) {
    finalHtml = renderCompleteAcquisitionMemoV2Html(acquisitionMemoV2DocumentArgs);
  }
  if (!(effectiveReportMode === "v1_core" && acqMemoV2SourceAuthorityEnabled && acquisitionMemoV2Bridge?.renderedAcquisitionMemo) && typeof finalHtml === "string" && finalHtml.includes("<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->")) {
    const richerDocumentTreatmentHtml = buildDocumentTreatmentSummaryHtml({
      reportMode: effectiveReportMode,
      documentSources: Array.isArray(sourceCoverageQa?.uploaded_files) ? sourceCoverageQa.uploaded_files : [],
      currentDebtAssessmentState,
      canonicalAcquisitionState:
        underwritingState?.core?.acquisition?.assumptionState ||
        acquisitionAssumptionState ||
        null,
      loanTermSheetTermsPayload,
      acquisitionTermsPayload,
      hasForwardLookingRenovationInputs: Boolean(renovationReturnAssumptionsPresent),
      renovationDisplayMode,
      propertyTaxPayload,
      propertyTaxBindingState,
      documentQuantitativeUsageMap,
      supportDocAuthorityRows: sourceCoverageQa.support_document_authority_rows,
      canonicalSupportDocMap,
      renderedDocumentTreatmentRowsOut: renderedDocumentTreatmentRows,
    });
    finalHtml = finalHtml.replace(
      /<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->[\s\S]*?<!-- END DOCUMENT_TREATMENT_SUMMARY -->/,
      `<!-- BEGIN DOCUMENT_TREATMENT_SUMMARY -->${richerDocumentTreatmentHtml}<!-- END DOCUMENT_TREATMENT_SUMMARY -->`
    );
  }
  const coverageQaTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: coverageQaErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "source_report_coverage_qa",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/source_report_coverage_qa/${coverageQaTimestamp}.json`,
      payload: sourceCoverageQa,
    },
  ]);
  if (coverageQaErr) {
    console.error("Failed to write source_report_coverage_qa artifact:", coverageQaErr);
  }
  const canonicalSupportDocAuthorityTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: canonicalSupportDocAuthorityErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "canonical_support_doc_authority",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/canonical_support_doc_authority/${canonicalSupportDocAuthorityTimestamp}.json`,
      payload: {
        canonical_support_doc_entries: canonicalSupportDocEntries,
        canonical_support_doc_count: canonicalSupportDocEntries.length,
      },
    },
  ]);
  if (canonicalSupportDocAuthorityErr) {
    console.error("Failed to write canonical_support_doc_authority artifact:", canonicalSupportDocAuthorityErr);
  }
} catch (err) {
  console.error("Failed to build source_report_coverage_qa artifact:", err?.message || err);
}
const renderedQaEnabled = String(process.env.QA_REVIEW_ENABLED || "true").toLowerCase() !== "false";
if (!renderedQaEnabled) {
  renderedQaStatus = "skipped";
  const renderedQaSkippedTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "worker_event",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/rendered_report_qa_advisory_skipped/${renderedQaSkippedTimestamp}.json`,
        payload: {
          event: "rendered_report_qa_advisory_skipped",
          advisory_only: true,
          no_public_surface: true,
          reason: "QA_REVIEW_ENABLED=false",
          report_type: reportType,
          report_tier: reportTier,
          html_length: qaHtml.length,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (qaSkipWriteErr) {
    console.error("Failed to write rendered_report_qa_advisory_skipped event:", qaSkipWriteErr);
  }
} else {
try {
  const renderedQaStartedAt = Date.now();
  const renderedQa = await runRenderedReportQaAdvisory({
    html: qaHtml,
    context: {
      property_name: property_name || jobPropertyName || "Unknown",
      report_type: reportType,
      report_tier: reportTier,
    },
  });
  renderedQaResult = renderedQa;
  renderedQaStatus = renderedQa.status;
  const renderedQaTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: renderedQaErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "rendered_report_qa_advisory",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/rendered_report_qa_advisory/${renderedQaTimestamp}.json`,
      payload: {
        event: "rendered_report_qa_advisory",
        advisory_only: true,
        no_public_surface: true,
        qa_status: renderedQa.status,
        model_status: renderedQa.status,
        raw_model_score: renderedQa.raw_model_score,
        score: renderedQa.score,
        summary: renderedQa.summary,
        counts: renderedQa.counts,
        findings: renderedQa.findings,
        removed_false_positive_count: renderedQa.removed_false_positive_count,
        model: renderedQa.model,
        usage: renderedQa.usage,
        version: renderedQa.version,
        timeout_ms: renderedQa.timeout_ms,
        report_type: reportType,
        report_tier: reportTier,
        html_length: qaHtml.length,
        elapsed_ms: Date.now() - renderedQaStartedAt,
        timestamp: new Date().toISOString(),
      },
    },
  ]);
  if (renderedQaErr) {
    console.error("Failed to write rendered_report_qa_advisory artifact:", renderedQaErr);
  }
} catch (err) {
  renderedQaStatus = "failed";
  console.error("Rendered report QA advisory failed:", err?.message || err);
  const renderedQaFailureTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "worker_event",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/rendered_report_qa_advisory_failed/${renderedQaFailureTimestamp}.json`,
        payload: {
          event: "rendered_report_qa_advisory_failed",
          advisory_only: true,
          no_public_surface: true,
          error: err?.message || String(err),
          error_code: err?.code || null,
          provider_error_class: err?.provider_error_class || null,
          provider_error_code: err?.provider_error_code || null,
          provider_error_type: err?.provider_error_type || null,
          provider_error_message: err?.provider_error_message || null,
          provider_response_status: Number.isFinite(err?.provider_response_status)
            ? err.provider_response_status
            : Number.isFinite(err?.status)
            ? err.status
            : null,
          provider_request_id: err?.provider_request_id || null,
          report_type: reportType,
          report_tier: reportTier,
          html_length: qaHtml.length,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (qaFailureWriteErr) {
    console.error("Failed to write rendered_report_qa_advisory_failed event:", qaFailureWriteErr);
  }
}
}
try {
  const sourcePackageQaStartedAt = Date.now();
  const sourcePackageQa = await runSourcePackageQaAdvisory({
    html: qaHtml,
    uploadedFiles: sourcePackageQaFiles,
    artifacts: sourcePackageQaArtifacts,
    sourceReportCoverageQa: sourceCoverageQaResult,
    renderedReportQa: renderedQaResult,
    context: {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      property_name: property_name || jobPropertyName || "Unknown",
      report_type: reportType,
      report_tier: reportTier,
    },
  });
  sourcePackageQaResult = sourcePackageQa;
  const sourcePackageQaTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: sourcePackageQaErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "source_package_qa_advisory",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/source_package_qa_advisory/${sourcePackageQaTimestamp}.json`,
      payload: {
        ...sourcePackageQa,
        elapsed_ms: Date.now() - sourcePackageQaStartedAt,
      },
    },
  ]);
  if (sourcePackageQaErr) {
    console.error("Failed to write source_package_qa_advisory artifact:", sourcePackageQaErr);
  }
} catch (err) {
  console.error("Source package QA advisory failed:", err?.message || err);
  const sourcePackageQaFailureTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "worker_event",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/source_package_qa_advisory_failed/${sourcePackageQaFailureTimestamp}.json`,
        payload: {
          event: "source_package_qa_advisory_failed",
          advisory_only: true,
          no_public_surface: true,
          error: err?.message || String(err),
          error_code: err?.code || null,
          provider_error_class: err?.provider_error_class || null,
          provider_error_code: err?.provider_error_code || null,
          provider_error_type: err?.provider_error_type || null,
          provider_error_message: err?.provider_error_message || null,
          provider_response_status: Number.isFinite(err?.provider_response_status)
            ? err.provider_response_status
            : Number.isFinite(err?.status)
            ? err.status
            : null,
          provider_request_id: err?.provider_request_id || null,
          report_type: reportType,
          report_tier: reportTier,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (sourcePackageQaFailureWriteErr) {
    console.error("Failed to write source_package_qa_advisory_failed event:", sourcePackageQaFailureWriteErr);
  }
}
try {
  const qaFixRouting = buildQaFixRouting({
    reportQaFlags,
    sourceReportCoverageQa: sourceCoverageQaResult,
    renderedReportQa: renderedQaResult,
    reportType,
    reportTier,
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
  });
  qaFixRoutingResult = qaFixRouting;
  const routingTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: routingErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "qa_fix_routing",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/qa_fix_routing/${routingTimestamp}.json`,
      payload: qaFixRouting,
    },
  ]);
  if (routingErr) {
    console.error("Failed to write qa_fix_routing artifact:", routingErr);
  }
} catch (err) {
  console.error("Failed to build qa_fix_routing artifact:", err?.message || err);
}
try {
  const qaManagerStartedAt = Date.now();
  const qaManagerReview = await runQaManagerReview({
    html: qaHtml,
    renderedReportQa: renderedQaResult,
    sourcePackageQa: sourcePackageQaResult,
    sourceReportCoverageQa: sourceCoverageQaResult,
    qaFixRouting: qaFixRoutingResult,
    reportQaFlags,
    context: {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      property_name: property_name || jobPropertyName || "Unknown",
      report_type: reportType,
      report_tier: reportTier,
    },
  });
  qaManagerReviewResult = qaManagerReview;
  const managerTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: managerErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "qa_manager_review",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/qa_manager_review/${managerTimestamp}.json`,
      payload: {
        ...qaManagerReview,
        elapsed_ms: Date.now() - qaManagerStartedAt,
      },
    },
  ]);
  if (managerErr) {
    console.error("Failed to write qa_manager_review artifact:", managerErr);
  }
} catch (err) {
  console.error("QA manager review failed:", err?.message || err);
  const managerFailureTimestamp = new Date().toISOString().replace(/:/g, "-");
  try {
    await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "worker_event",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/worker_event/qa_manager_review_failed/${managerFailureTimestamp}.json`,
        payload: {
          event: "qa_manager_review_failed",
          advisory_only: true,
          no_public_surface: true,
          error: err?.message || String(err),
          error_code: err?.code || null,
          provider_error_class: err?.provider_error_class || null,
          provider_error_code: err?.provider_error_code || null,
          provider_error_type: err?.provider_error_type || null,
          provider_error_message: err?.provider_error_message || null,
          provider_response_status: Number.isFinite(err?.provider_response_status)
            ? err.provider_response_status
            : Number.isFinite(err?.status)
            ? err.status
            : null,
          provider_request_id: err?.provider_request_id || null,
          report_type: reportType,
          report_tier: reportTier,
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (managerFailureWriteErr) {
    console.error("Failed to write qa_manager_review_failed event:", managerFailureWriteErr);
  }
}
try {
  const reportContractQa = buildReportContractQa({
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
    reportType,
    reportTier,
    html: qaHtml,
    artifacts: sourcePackageQaArtifacts,
    sourceReportCoverageQa: sourceCoverageQaResult,
    reportQaFlags,
    qaFixRouting: qaFixRoutingResult || null,
    deliveryGateDecision: deliveryGateDecisionResult || null,
    canonicalSupportDocMap,
    renderedDocumentTreatmentRows,
  });
  reportContractQaResult = reportContractQa;
  const contractTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: contractErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "report_contract_qa",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/report_contract_qa/${contractTimestamp}.json`,
      payload: reportContractQa,
    },
  ]);
  if (contractErr) {
    console.error("Failed to write report_contract_qa artifact:", contractErr);
  }
} catch (err) {
  console.error("Failed to build report_contract_qa artifact:", err?.message || err);
}
try {
  const summaryTimestamp = new Date().toISOString().replace(/:/g, "-");
  const coverageSeverity = sourceCoverageQaResult?.severity || "not_run";
  const renderedSeverity =
    renderedQaResult?.counts?.critical > 0 ? "high" :
    renderedQaResult?.counts?.warn > 0 ? "medium" :
    renderedQaResult ? "low" :
    renderedQaStatus === "failed" ? "medium" : "low";
  const severityRank = { not_run: 0, low: 1, medium: 2, high: 3 };
  const highestSeverity =
    severityRank[coverageSeverity] >= severityRank[renderedSeverity]
      ? coverageSeverity
      : renderedSeverity;
  const publicSampleReady =
    !sourceCoverageQaResult?.deterministic_flags?.some((flag) => flag?.code === "PUBLIC_SAMPLE_NOT_READY") &&
    highestSeverity !== "high";
  const { error: summaryErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "qa_review_summary",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/qa_review_summary/${summaryTimestamp}.json`,
      payload: {
        event: "qa_review_summary",
        advisory_only: true,
        no_public_surface: true,
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        rendered_qa_status: renderedQaStatus,
        coverage_qa_status: sourceCoverageQaResult?.qa_status || "not_run",
        fix_routing_status: qaFixRoutingResult ? "available" : "not_run",
        fix_route_counts: qaFixRoutingResult?.route_counts || null,
        regenerate_recommended: qaFixRoutingResult?.regenerate_recommended ?? false,
        admin_action_required: qaFixRoutingResult?.admin_action_required ?? false,
        highest_severity: highestSeverity,
        public_sample_ready: qaFixRoutingResult?.public_sample_ready ?? publicSampleReady,
        related_artifact_types: [
          "rendered_report_qa_advisory",
          "source_report_coverage_qa",
          "source_package_qa_advisory",
          "qa_fix_routing",
          "qa_manager_review",
          "report_contract_qa",
          "qa_director_review",
        ],
        timestamp: new Date().toISOString(),
      },
    },
  ]);
  if (summaryErr) {
    console.error("Failed to write qa_review_summary artifact:", summaryErr);
  }
} catch (err) {
  console.error("Failed to build qa_review_summary artifact:", err?.message || err);
}
try {
  const qaActionPlan = buildQaActionPlan({
    reportQaFlags,
    sourceReportCoverageQa: sourceCoverageQaResult,
    renderedReportQa: renderedQaResult,
    qaFixRouting: qaFixRoutingResult,
    qaManagerReview: qaManagerReviewResult,
    reportContractQa: reportContractQaResult,
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
    reportType,
    reportTier,
  });
  qaActionPlanResult = qaActionPlan;
  const actionPlanTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: actionPlanErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "qa_action_plan",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/qa_action_plan/${actionPlanTimestamp}.json`,
      payload: qaActionPlan,
    },
  ]);
  if (actionPlanErr) {
    console.error("Failed to write qa_action_plan artifact:", actionPlanErr);
  }
} catch (err) {
  console.error("Failed to build qa_action_plan artifact:", err?.message || err);
}
try {
  const qaDirectorReview = buildQaDirectorReview({
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
    reportType,
    reportTier,
    reportContractQa: reportContractQaResult,
    qaActionPlan: qaActionPlanResult,
    renderedReportQa: renderedQaResult,
    sourcePackageQa: sourcePackageQaResult,
    qaManagerReview: qaManagerReviewResult,
    sourceReportCoverageQa: sourceCoverageQaResult,
    html: qaHtml,
  });
  qaDirectorReviewResult = qaDirectorReview;
  const directorTimestamp = new Date().toISOString().replace(/:/g, "-");
  const { error: directorErr } = await supabase.from("analysis_artifacts").insert([
    {
      job_id: jobId || null,
      user_id: effectiveUserId || null,
      type: "qa_director_review",
      bucket: "internal",
      object_path: `analysis_jobs/${jobId || "unknown"}/qa_director_review/${directorTimestamp}.json`,
      payload: qaDirectorReview,
    },
  ]);
  if (directorErr) {
    console.error("Failed to write qa_director_review artifact:", directorErr);
  }
} catch (err) {
  console.error("Failed to build qa_director_review artifact:", err?.message || err);
}
try {
  const deliveryGateDecision = buildDeliveryGateDecision({
    sourceReportCoverageQa: sourceCoverageQaResult,
    reportContractQa: reportContractQaResult,
    qaActionPlan: qaActionPlanResult,
    qaDirectorReview: qaDirectorReviewResult,
  });
  deliveryGateDecisionResult = deliveryGateDecision;
  deliveryDecisionStateResult = buildCanonicalDeliveryDecisionState(deliveryGateDecisionResult);
  const gateTimestamp = new Date().toISOString().replace(/:/g, "-");
  if (jobId) {
    const { error: deliveryGateErr } = await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "delivery_gate_decision",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/delivery_gate_decision/${gateTimestamp}.json`,
        payload: {
          ...(normalizedDeliveryGateDecision || deliveryGateDecision),
        },
      },
    ]);
    if (deliveryGateErr) {
      console.error("Failed to write delivery_gate_decision artifact:", deliveryGateErr);
    }
  }
  } catch (err) {
    console.error("Failed to build delivery_gate_decision artifact:", err?.message || err);
  }
  const normalizedDeliveryAliases = buildDeliveryResponseCompatibilityAliases(deliveryDecisionStateResult);
  const normalizedDeliveryGateDecision = deliveryGateDecisionResult
    ? {
        ...deliveryGateDecisionResult,
        ...normalizedDeliveryAliases,
        legacy_compatibility: normalizedDeliveryAliases.legacy_compatibility,
        readiness_hierarchy: normalizedDeliveryAliases.readiness_hierarchy,
        deliveryDecisionState: deliveryDecisionStateResult,
      }
    : null;
  if (
    deliveryGateDecisionResult?.delivery_gate_status === "user_needs_documents" &&
    deliveryDecisionStateResult?.core_valid_required_coverage !== true
  ) {
    const blockedDecisionState = deliveryDecisionStateResult || buildCanonicalDeliveryDecisionState(deliveryGateDecisionResult);
    const failClosedDecisionState = {
      ...blockedDecisionState,
      customer_status_label: "needs_documents",
      customer_message:
        "Report could not be generated. InvestorIQ could not produce a defensible report from the required uploaded documents. Your report credit has been restored, and you may start a new report with corrected source documents.",
    };
    const deliveryAliases = buildDeliveryResponseCompatibilityAliases(blockedDecisionState);
    return res.status(200).json({
      ok: true,
      success: true,
      reportId: null,
    storagePath: null,
    url: null,
    deliveryDecisionState: failClosedDecisionState,
    delivery_gate_status: deliveryAliases.delivery_gate_status,
    customer_delivery_allowed: deliveryAliases.customer_delivery_allowed,
    hold_delivery: deliveryAliases.hold_delivery,
    holdDelivery: deliveryAliases.holdDelivery,
    report_publishable: deliveryAliases.report_publishable,
    report_blocked: deliveryAliases.report_blocked,
    customer_delivery_ready: deliveryAliases.customer_delivery_ready,
    customer_publish_eligible: deliveryAliases.customer_publish_eligible,
    launch_path_recommendation: deliveryAliases.launch_path_recommendation,
    readiness_hierarchy: deliveryAliases.readiness_hierarchy,
    legacy_compatibility: deliveryAliases.legacy_compatibility,
    delivery_gate_reason_code: deliveryGateDecisionResult?.reason_code || null,
    delivery_gate_top_action_code: deliveryGateDecisionResult?.top_action_code || null,
    delivery_gate_owner_area: deliveryGateDecisionResult?.owner_area || null,
      delivery_gate_recommended_next_step: deliveryGateDecisionResult?.recommended_next_step || null,
      customer_publish_blockers: deliveryGateDecisionResult?.customer_publish_blockers || [],
      public_sample_blockers: deliveryGateDecisionResult?.public_sample_blockers || [],
      high_value_outreach_blockers: deliveryGateDecisionResult?.high_value_outreach_blockers || [],
      advisory_only_findings: deliveryGateDecisionResult?.advisory_only_findings || [],
      regeneration_recommended: deliveryGateDecisionResult?.regeneration_recommended ?? false,
      regeneration_required_for_customer_delivery: deliveryGateDecisionResult?.regeneration_required_for_customer_delivery ?? false,
      regeneration_required_for_public_sample: deliveryGateDecisionResult?.regeneration_required_for_public_sample ?? false,
      regeneration_required: deliveryGateDecisionResult?.regeneration_required ?? false,
      admin_review_required: false,
      user_needs_documents:
        deliveryGateDecisionResult?.user_needs_documents ??
        deliveryAliases.delivery_gate_status === "user_needs_documents",
      publish_decision_reason: deliveryGateDecisionResult?.publish_decision_reason || null,
    });
  }
if (docraptorMode === "production" && !allowProductionPdf) {
  const disabledMessage =
    "Production PDF generation is disabled. Contact support to enable production output.";
  if (jobId) {
    await supabase
      .from("analysis_jobs")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_code: "PRODUCTION_PDF_DISABLED",
        error_message: disabledMessage,
      })
      .eq("id", jobId);
  }
  throw new Error("PRODUCTION_PDF_DISABLED");
}
try {
  docHtml = sanitizeTypography(qaHtml);
  const docFinalSourceReconciliationGuard = applyFinalSourceReconciliationRenderGuard(
    docHtml,
    sourceReconciliationState
  );
  docHtml = docFinalSourceReconciliationGuard.html;
  docHtml = applyFinalSectionHealRenderGuards(docHtml, {
    effectiveReportMode,
    reportType,
    currentDebtAssessmentState,
    mortgagePayload,
    loanTermSheetTermsPayload,
    financials,
    t12Payload,
  });
  const docFinalSourceReconciliationGuardHasMismatch =
    docFinalSourceReconciliationGuard.render_state?.renderable
      ? docFinalSourceReconciliationGuard.matched_displays_after.some((display) => display !== docFinalSourceReconciliationGuard.render_state?.variance_display) ||
        (docFinalSourceReconciliationGuard.matched_displays_after.length === 0 &&
          (
            /Rent Roll vs T12 GPR Variance/i.test(docHtml) ||
            /Rent roll annualized rent is/i.test(docHtml) ||
            /Source reconciliation variance of/i.test(docHtml)
          ))
      : docFinalSourceReconciliationGuard.matched_displays_after.length > 0;
  if (docFinalSourceReconciliationGuardHasMismatch) {
    console.error("source_reconciliation_final_guard_postcheck_failed_docraptor", {
      canonical_display: docFinalSourceReconciliationGuard.render_state?.variance_display || null,
      stale_minus_48_count_before: docFinalSourceReconciliationGuard.stale_minus_48_count_before,
      stale_minus_48_count_after: docFinalSourceReconciliationGuard.stale_minus_48_count_after,
      matched_snippets_before: docFinalSourceReconciliationGuard.matched_snippets_before,
      matched_snippets_after: docFinalSourceReconciliationGuard.matched_snippets_after,
    });
    console.warn("Final DocRaptor HTML reconciliation guard fell back to disclosure-only suppression", {
      canonical_display: docFinalSourceReconciliationGuard.render_state?.variance_display || null,
      stale_minus_48_count_before: docFinalSourceReconciliationGuard.stale_minus_48_count_before,
      stale_minus_48_count_after: docFinalSourceReconciliationGuard.stale_minus_48_count_after,
      matched_snippets_before: docFinalSourceReconciliationGuard.matched_snippets_before,
      matched_snippets_after: docFinalSourceReconciliationGuard.matched_snippets_after,
    });
  }
  pdfResponse = await axios.post(
    "https://docraptor.com/docs",
    {
      test: docraptorMode !== "production",
      document_content: docHtml,
      name: "InvestorIQ-ClientReport.pdf",
      document_type: "pdf",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          process.env.DOCRAPTOR_API_KEY + ":"
        ).toString("base64")}`,
      },
      responseType: "arraybuffer",
    }
  );
} catch (err) {
  console.error("DOCRAPTOR ERROR STATUS:", err.response?.status);
  console.error("DOCRAPTOR ERROR BODY:");
  console.error(err.response?.data?.toString());
  throw err;
}
        const canonicalDeliveryDecisionState = deliveryDecisionStateResult || buildCanonicalDeliveryDecisionState(deliveryGateDecisionResult);
        const holdDelivery = Boolean(canonicalDeliveryDecisionState.hold_delivery);
    const publicationSeed = jobId || crypto.randomUUID();
    const storagePath = buildReportStoragePath({
      effectiveUserId,
      reportSeed: publicationSeed,
    });
    const publicationContext = {
      jobId: jobId || null,
      userId: effectiveUserId || null,
      reportType: reportType || null,
      deliveryGateStatus: deliveryGateDecisionResult?.delivery_gate_status || null,
      holdDelivery: Boolean(holdDelivery),
      coreValidRequiredCoverage: Boolean(canonicalDeliveryDecisionState?.core_valid_required_coverage),
      publicationSeed,
    };
    let validatedStoragePath;
    try {
      validatedStoragePath = assertValidReportPublicationInsert({
      storagePath,
      reportType,
      deliveryGateStatus: deliveryGateDecisionResult?.delivery_gate_status || null,
      holdDelivery,
      coreValidRequiredCoverage: Boolean(canonicalDeliveryDecisionState?.core_valid_required_coverage),
      context: publicationContext,
    });
    } catch (err) {
      console.error("Report publication invariant failed:", err?.context || publicationContext, err?.message || err);
      throw err;
    }
    // 10. Persist PDF to Supabase Storage using required contract: {user_id}/{publicationSeed}.pdf
    const { error: uploadError } = await supabase.storage
      .from("generated_reports")
      .upload(validatedStoragePath, pdfResponse.data, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error("Failed to upload report to storage");
    }
    // 11. Create DB row only after a valid upload path exists
    const { data: reportRow, error: reportCreateError } = await supabase
      .from("reports")
      .insert({
        user_id: effectiveUserId,
        property_name: property_name || "Property",
        report_type: reportType,
        storage_path: validatedStoragePath,
      })
      .select("id")
      .single();
    if (reportCreateError || !reportRow?.id) {
      console.error("Report DB Create Error:", reportCreateError, publicationContext);
      try {
        await supabase.storage.from("generated_reports").remove([validatedStoragePath]);
      } catch (cleanupErr) {
        console.error("Failed to cleanup uploaded report after DB insert failure:", cleanupErr);
      }
      throw new Error("Failed to create report record");
    }
    const reportId = reportRow.id;
    // 12. Generate Signed URL for immediate viewing (valid for 1 hour)
    let signedData = { signedUrl: null };
    if (!holdDelivery) {
      const { data: signedResult, error: signedError } = await supabase.storage
        .from("generated_reports")
        .createSignedUrl(validatedStoragePath, 3600);
      if (signedError) {
        console.error("Signed URL Error:", signedError);
        throw new Error("Failed to generate access link");
      }
      signedData = signedResult || signedData;
    }
    // 13. Return JSON with the report URL and report_id
    const deliveryAliases = buildDeliveryResponseCompatibilityAliases(canonicalDeliveryDecisionState);
    res.status(200).json({
      success: true,
      reportId,
      url: signedData.signedUrl,
      deliveryDecisionState: canonicalDeliveryDecisionState,
    delivery_gate_status: deliveryAliases.delivery_gate_status,
    customer_delivery_allowed: deliveryAliases.customer_delivery_allowed,
    hold_delivery: deliveryAliases.hold_delivery,
    holdDelivery: deliveryAliases.holdDelivery,
    report_publishable: deliveryAliases.report_publishable,
    report_blocked: deliveryAliases.report_blocked,
    customer_delivery_ready: deliveryAliases.customer_delivery_ready,
    customer_publish_eligible: deliveryAliases.customer_publish_eligible,
    launch_path_recommendation: deliveryAliases.launch_path_recommendation,
    readiness_hierarchy: deliveryAliases.readiness_hierarchy,
    legacy_compatibility: deliveryAliases.legacy_compatibility,
      delivery_gate_reason_code: deliveryGateDecisionResult?.reason_code || null,
      delivery_gate_top_action_code: deliveryGateDecisionResult?.top_action_code || null,
      delivery_gate_owner_area: deliveryGateDecisionResult?.owner_area || null,
      delivery_gate_recommended_next_step: deliveryGateDecisionResult?.recommended_next_step || null,
      customer_publish_blockers: deliveryGateDecisionResult?.customer_publish_blockers || [],
      public_sample_blockers: deliveryGateDecisionResult?.public_sample_blockers || [],
      high_value_outreach_blockers: deliveryGateDecisionResult?.high_value_outreach_blockers || [],
      advisory_only_findings: deliveryGateDecisionResult?.advisory_only_findings || [],
      regeneration_recommended: deliveryGateDecisionResult?.regeneration_recommended ?? false,
      regeneration_required_for_customer_delivery: deliveryGateDecisionResult?.regeneration_required_for_customer_delivery ?? false,
      regeneration_required_for_public_sample: deliveryGateDecisionResult?.regeneration_required_for_public_sample ?? false,
      regeneration_required: deliveryGateDecisionResult?.regeneration_required ?? false,
      admin_review_required: deliveryGateDecisionResult?.admin_review_required ?? false,
      user_needs_documents: deliveryGateDecisionResult?.user_needs_documents ?? false,
      publish_decision_reason: deliveryGateDecisionResult?.publish_decision_reason || null,
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: err?.message || "Failed to generate report" });
  } finally {
  }
}

export const __test__ = {
  normalizeAcquisitionFinancingArtifactPayload,
  alignDealScorecardVisibleClassificationHtml,
  buildAcquisitionFinancingAssumptionsHtml,
  buildAcquisitionFinancingReadinessHtml,
  buildPreliminaryFinancingReadinessSummaryHtml,
  buildCurrentDebtScorecardEntry,
  buildDealScorecardState,
  resolveCanonicalRefiDebtBasis,
  buildRefiDebtRenderState,
  buildRefiStabilityModel,
  buildScreeningRefiSufficiencyTable,
  buildFinancingEnvelopeGrid,
  buildAcquisitionMemoSummaryCard,
  buildOperatingSnapshotCard,
  buildRentUpsideValueSensitivityCard,
  buildLaunchSourceContextBlock,
  buildCapRateValueTable,
  resolveRentPositioningSectionTitle,
  buildDocumentTreatmentSummaryHtml,
  buildHistoricalCapexDisplayCopy,
  stripEmptyHeadingBlocks,
  stripThinSectionPages,
  collapseSummaryOnlyUnitMixSection,
  resolveRenovationDisplayMode,
  buildRenovationDisplayCopy,
  buildFrameworkSensitivityDisplayCopy,
  buildReportStoragePath,
  buildDeliveryResponseCompatibilityAliases,
  buildRendererCanonicalState,
  applyFinalSourceReconciliationRenderGuard,
  applyFinalSectionHealRenderGuards,
  buildScreeningIncomeForensicsHtml,
  buildScreeningExpenseStructureHtml,
  buildScreeningNoiStabilityHtml,
  buildScreeningRentRollDistributionHtml,
  sanitizeScreeningRankedDriversHtml,
  buildRenovationBudgetRows,
  buildRenovationBudgetCardHtml,
  buildRenovationExecutionRows,
  buildRenovationExecutionCardHtml,
  buildScreeningDataCoverageSummary,
  assertValidReportPublicationInsert,
  isValidReportStoragePath,
  buildT12SummaryHtml,
  resolveCanonicalT12GprValue,
  materiallyDifferent,
  resolveSafeAnnualRentTotal,
  resolveOccupancyNoteValue,
  resolveCanonicalLoanTermSheetArtifacts,
  buildCanonicalSupportDocAuthorityRows,
  resolveCanonicalDataCoverageHeadlineState,
  normalizeVisibleReportClassification,
  resolveScreeningClassificationConsumerLabel,
  shouldRenderCanonicalSection,
  shouldApplyTierOneStripCascade,
  resolveMarketContextSectionVisibility,
  resolveFinalRecommendationSectionVisibility,
  resolveDocumentSourcesSectionVisibility,
  shouldStripDataCoverageSectionByRenderedCopy,
  buildDeliveryResponseCompatibilityAliases,
  resolveReportTypeAndTier,
};
