// api/generate-client-report.js
import dotenv from "dotenv";
dotenv.config();
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
import { buildQaActionPlan, buildDeliveryGateDecision } from "./_lib/qa-action-plan.js";
// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// ---------- Formatting Helpers ----------
function isNil(value) {
  return value === undefined || value === null;
}
function formatCurrency(value, options = {}) {
  const { decimals = 0, prefix = "$", suffix = "" } = options;
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    prefix +
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix
  );
}
function formatPercent(value, decimals = 1) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value) * 100;
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}
function formatPercent1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(1)}%`;
}
function formatPercentExactDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return `${n.toFixed(1)}%`;
}
function formatCapPercentExact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(2)}%`;
}
function formatInterestRatePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  const pct = n > 1.5 ? n : n * 100;
  return `${pct.toFixed(2)}%`;
}
function formatMultiple(value, decimals = 2) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "x"
  );
}
function formatYears(value, decimals = 1) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " yrs"
  );
}
function formatDistanceKm(value) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + " km"
  );
}
// Helper to safely replace all occurrences of a token
function replaceAll(str, token, value) {
  if (!str || !token) return str;
  return str.includes(token) ? str.split(token).join(value ?? "") : str;
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
} = {}) {
  const units = coerceNumber(totalUnits);
  const weighted = coerceNumber(weightedAvgRent);
  const summaryAnnual = coerceNumber(summaryAnnualTotal);
  const rowAnnual = coerceNumber(rowAnnualTotal);
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
function resolveCurrentDebtCoverage(mortgagePayload, t12Noi) {
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
function currentDebtNotAssessedCopy({ mortgagePayload, loanTermSheetTermsPayload } = {}) {
  if (mortgagePayload) {
    return {
      value: "Not assessed",
      explanation: "Current debt terms were not fully provided",
      band: "Current debt balance, rate, and amortization not fully provided",
    };
  }
  if (loanTermSheetTermsPayload) {
    return {
      value: "Not assessed",
      explanation: "Current debt balance not provided",
      band: "Current debt balance not provided",
    };
  }
  return {
    value: "Not assessed",
    explanation: "No current debt document provided",
    band: "No current debt document provided",
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
function buildRefiStabilityModel({ financials, t12Payload, formatValue }) {
  const f = financials && typeof financials === "object" ? financials : {};
  const debtBalance = coerceNumber(f.refi_debt_balance);
  const ltvMaxRaw = coerceNumber(f.refi_ltv_max);
  const ltvMax = Number.isFinite(ltvMaxRaw) && ltvMaxRaw > 1.5 ? ltvMaxRaw / 100 : ltvMaxRaw;
  const dscrMin = coerceNumber(f.refi_dscr_min);
  const interestRateRaw = coerceNumber(f.refi_interest_rate);
  const amortYears = coerceNumber(f.refi_amort_years);
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
  <p class="subsection-title"><strong>Full Refinance Sufficiency (Deterministic)</strong></p>
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
function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function normalizeExitCapSourceLabel(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const compact = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (compact === "document-derived") return "document derived";
  return escapeHtml(raw);
}
function hasMeaningfulNarrative(html) {
  if (!html || typeof html !== "string") return false;
  if (html.includes(DATA_NOT_AVAILABLE)) return false;
  if (!html.replace(/<[^>]*>/g, "").trim()) return false;
  return true;
}
function sanitizeDisplayText(s) {
  if (!s) return s;
  return String(s)
    .replace(/\bUnderwritting\b/gi, "Underwriting")
    .replace(/\s+([,.])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function sanitizePropertyNameDisplayText(s) {
  if (!s) return s;
  return sanitizeDisplayText(s)
    .replace(/\bFinal\s+Regression\b/gi, " ")
    .replace(/\s*\((?:clean|messy|test|qa|final\s+regression)[^)]*\)\s*/gi, " ")
    .replace(/['"]\s*(?:clean|messy|qa|test)\s*['"]/gi, " ")
    .replace(/\b(?:clean|messy)\s+(Underwriting|Screening)\s+Test\s+\d+\b/gi, "$1")
    .replace(/\b(Underwriting|Screening)\s+Test\s+\d+\b/gi, "$1")
    .replace(/\s*[-|:]\s*$/g, "")
    .replace(/^\s*[-|:]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function sanitizeTypography(html) {
  if (typeof html !== "string") return html;
  return html
    .replace(/[\u2013\u2014]/g, "-")      // en/em dash
    .replace(/[\u2018\u2019]/g, "'")      // smart apostrophes
    .replace(/[\u201C\u201D]/g, '"')      // smart quotes
    .replace(/&(?:ndash|mdash);/g, "-")
    .replace(/\u00b7/g, " | ")
    .replace(/\u2212/g, "-")
    .replace(/\u00c2\u00b7/g, " | ")
    .replace(/\u00c3\u201a\u00c2\u00b7/g, " | ")
    .replace(/\u00e2\u20ac\u201d/g, "-")
    .replace(/\u00e2\u20ac\u201c/g, "-")
    .replace(/\u00e2\u02c6\u2019/g, "-")
    .replace(/\u00c3\u201a/g, "");
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
      "Metrics that depend on missing source inputs are shown as unavailable.</p>";
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
function stripChartBlockByAlt(html, altText) {
  if (!altText) return html;
  const escapedAlt = altText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<div class=\"chart-block[\\s\\S]*?<img[^>]*(alt=\"${escapedAlt}\"[^>]*src=\"\"|src=\"\"[^>]*alt=\"${escapedAlt}\")[^>]*>[\\s\\S]*?<\\/div>`,
    "g"
  );
  return html.replace(re, "");
}
function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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
function buildT12SummaryHtml(t12Payload, formatValue) {
  if (!t12Payload) return "";
  const rows = [
    ["Gross Potential Rent", t12Payload.gross_potential_rent],
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
  const rows = [
    ["In-Place Gross Potential Rent", t12Payload.gross_potential_rent],
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
function buildRenovationBudgetRows(rows, formatValue) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const category = String(row.category ?? row.line_item ?? row.item ?? "").trim();
      const scope = String(row.scope_of_work ?? row.scope ?? "").trim();
      const costNum = coerceNumber(row.estimated_cost ?? row.cost ?? row.amount);
      const costRaw = String(row.estimated_cost ?? row.cost ?? row.amount ?? "").trim();
      const cost = Number.isFinite(costNum)
        ? formatValue(costNum)
        : escapeHtml(costRaw);
      const pctRaw = String(
        row.percent_of_budget ?? row.percent ?? row.percentage ?? ""
      ).trim();
      const objective = String(
        row.primary_objective ?? row.objective ?? row.note ?? ""
      ).trim();
      if (!category && !scope && !cost && !pctRaw && !objective) return "";
      return `<tr><td>${escapeHtml(category)}</td><td>${escapeHtml(
        scope
      )}</td><td>${cost}</td><td>${escapeHtml(pctRaw)}</td><td>${escapeHtml(
        objective
      )}</td></tr>`;
    })
    .filter(Boolean)
    .join("");
}
function buildRenovationExecutionRows(rows, formatValue) {
  if (!Array.isArray(rows) || rows.length === 0) return "";
  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return "";
      const metric = String(row.metric ?? row.label ?? row.item ?? "").trim();
      const valueNum = coerceNumber(row.value ?? row.amount);
      const valueRaw = String(row.value ?? row.amount ?? "").trim();
      const value = Number.isFinite(valueNum)
        ? formatValue(valueNum)
        : escapeHtml(valueRaw);
      if (!metric && !value) return "";
      return `<tr><td>${escapeHtml(metric)}</td><td>${value}</td></tr>`;
    })
    .filter(Boolean)
    .join("");
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
    ? `Derived from reported NOI of ${formatCurrency(noi)}. Standardized framework benchmarks are shown with any valid document-derived cap rate.`
    : `Derived from reported NOI of ${formatCurrency(noi)}. Cap rates are standardized framework benchmarks, not document-sourced.`;
  return `<div class="card no-break"><p class="subsection-title">Cap Rate Value Indication</p><table><thead><tr><th>Cap Rate</th><th>Implied Value</th><th>Per Unit</th></tr></thead><tbody>${rows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">${footnote}</p></div>`;
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
function buildAcquisitionFinancingAssumptionsHtml({ loanTermSheetTermsPayload, t12Payload, reportType, reportTier }) {
  const normalizedReportType = String(reportType || "").toLowerCase();
  const numericTier = Number(reportTier);
  const isFullUnderwriting = normalizedReportType === "underwriting" || numericTier === 2;
  if (!isFullUnderwriting || !loanTermSheetTermsPayload || typeof loanTermSheetTermsPayload !== "object") return "";

  const purchasePrice = coerceNumber(loanTermSheetTermsPayload.purchase_price);
  const ltv = coerceNumber(loanTermSheetTermsPayload.ltv);
  const loanAmount = coerceNumber(loanTermSheetTermsPayload.derived_acquisition_loan_amount);
  const ratePct = coerceNumber(loanTermSheetTermsPayload.interest_rate);
  const amortYears = coerceNumber(loanTermSheetTermsPayload.amortization_years ?? loanTermSheetTermsPayload.amort_years);
  const goingInCapRate = coerceNumber(loanTermSheetTermsPayload.going_in_cap_rate);
  const closingCostsPercent = coerceNumber(loanTermSheetTermsPayload.closing_costs_percent);
  const hasMeaningfulAcquisitionField = [
    purchasePrice,
    ltv,
    loanAmount,
    ratePct,
    amortYears,
    goingInCapRate,
    closingCostsPercent,
  ].some((value) => Number.isFinite(value) && value > 0);
  if (!hasMeaningfulAcquisitionField) return "";

  const noi = coerceNumber(t12Payload?.net_operating_income);
  const limitations = [];
  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    limitations.push("Purchase price was not verified in the uploaded documents.");
  }
  if (!Number.isFinite(ltv) || ltv <= 0) {
    limitations.push("Acquisition debt sizing was not modeled because LTV was not verified in the uploaded documents.");
  }
  if (!Number.isFinite(ratePct) || ratePct <= 0) {
    limitations.push("Estimated acquisition debt service was not modeled because the interest rate was not verified.");
  }
  if (!Number.isFinite(amortYears) || amortYears <= 0) {
    limitations.push("Estimated acquisition debt service was not modeled because amortization was not verified.");
  }
  const mortgageConstant = computeMortgageConstant(ratePct / 100, amortYears);
  const annualDebtService =
    Number.isFinite(loanAmount) &&
    loanAmount > 0 &&
    Number.isFinite(mortgageConstant) &&
    mortgageConstant > 0
      ? loanAmount * mortgageConstant
      : null;
  const acquisitionDscr =
    Number.isFinite(noi) && noi > 0 && Number.isFinite(annualDebtService) && annualDebtService > 0
      ? noi / annualDebtService
      : null;
  const rows = [
    Number.isFinite(purchasePrice) && purchasePrice > 0 ? ["Purchase Price", formatCurrency(purchasePrice)] : null,
    Number.isFinite(ltv) && ltv > 0 ? ["Documented LTV", formatPercent1(ltv)] : null,
    Number.isFinite(loanAmount) && loanAmount > 0 ? ["Derived Acquisition Loan Amount", formatCurrency(loanAmount)] : null,
    Number.isFinite(ratePct) && ratePct > 0 ? ["Interest Rate", formatInterestRatePercent(ratePct)] : null,
    Number.isFinite(amortYears) && amortYears > 0 ? ["Amortization", `${Math.round(amortYears)} years`] : null,
    Number.isFinite(goingInCapRate) && goingInCapRate > 0 ? ["Going-In Cap Rate", formatPercent1(goingInCapRate)] : null,
    Number.isFinite(closingCostsPercent) && closingCostsPercent >= 0 ? ["Closing Costs", formatPercentExactDisplay(closingCostsPercent)] : null,
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

  return `<div class="card no-break" style="margin:12px 0;"><p class="subsection-title">Proposed Acquisition Debt Sizing</p><p class="small">Derived from uploaded purchase assumptions. This is not current outstanding debt and is not used as a current refinance debt balance.</p><table><thead><tr><th>Input</th><th>Document-Derived Value</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("")}</tbody></table>${limitationHtml}</div>`;
}
function buildScreeningRefiSufficiencyTable({ financials, t12Payload }) {
  const f = financials && typeof financials === "object" ? financials : {};
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
      present: isPresentScalar(coerceNumber(f.refi_debt_balance)),
      value: Number.isFinite(coerceNumber(f.refi_debt_balance))
        ? formatCurrency(coerceNumber(f.refi_debt_balance))
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
      present: isPresentScalar(coerceNumber(f.refi_interest_rate)),
      value: Number.isFinite(coerceNumber(f.refi_interest_rate))
        ? formatInterestRatePercent(coerceNumber(f.refi_interest_rate))
        : " - ",
    },
    {
      label: "Amortization (years)",
      present: isPresentScalar(coerceNumber(f.refi_amort_years)),
      value: Number.isFinite(coerceNumber(f.refi_amort_years))
        ? formatYears(coerceNumber(f.refi_amort_years))
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
  return `<p>Refinance Stability Classification not produced due to insufficient refinance inputs.</p><table><thead><tr><th>Input</th><th>Status</th><th>Provided Value</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="small">This sufficiency check verifies whether deterministic refinance classification inputs are present in uploaded documents. Missing required inputs prevent refinance stability scoring.</p>`;
}
function buildScreeningDataCoverageSummary({
  t12Payload,
  computedRentRoll,
  rentRollPayload,
  financials,
  effectiveReportMode,
  supportingUnderwritingDocsUsed = false,
  hasUploadedFiles = false,
}) {
  const t12Checks = [
    {
      label: "gross_potential_rent",
      present: Number.isFinite(coerceNumber(t12Payload?.gross_potential_rent)),
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
  const isPartialRentRollSample = computedRentRoll?.is_partial_sample === true;
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
  const rrOccPresent = Number.isFinite(
    coerceNumber(computedRentRoll?.occupancy ?? (isPartialRentRollSample ? null : rentRollPayload?.occupancy))
  ) || (!isPartialRentRollSample && Number.isFinite(deriveOccFromRentRollUnits(rentRollPayload)));
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
  const coverageTableHtml = `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;"><thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Dataset</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Fields Present</th><th style="text-align:center;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Coverage</th><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;">Missing</th></tr></thead><tbody><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">T12 Operating Statement</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${t12PresentCount}/${t12Checks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${t12CoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(t12Missing.join(", ") || "None")}</td></tr><tr><td style="padding:4px 8px;border:1px solid #E5E7EB;">Rent Roll</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${rrPresentCount}/${rentRollChecks.length}</td><td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:600;color:#1e293b;">${rrCoveragePct}%</td><td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(rrMissing.join(", ") || "None")}</td></tr></tbody></table>`;
  if (allPresent) {
    if (effectiveReportMode === "screening_v1") {
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Fully Verified</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">All required screening inputs were fully extracted from uploaded documents.</p>${coverageTableHtml}</div>`;
    }
    if (effectiveReportMode === "v1_core" && supportingUnderwritingDocsUsed) {
      return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">Core financial inputs (T12, Rent Roll, and available structured debt data) were extracted and incorporated into underwriting analysis. Supplemental documents that are not converted into structured report inputs are not used quantitatively. Unsupported or unstructured uploads remain excluded from modeled outputs.</p>${coverageTableHtml}</div>`;
    }
    return `<div style="background:#FFFFFF;border:1px solid #E5E7EB;border-left:3px solid #B8860B;border-radius:4px;padding:14px 16px;margin-top:8px;margin-bottom:12px;"><p style="font-weight:700;font-size:13px;color:#1e293b;margin:0 0 4px 0;">CORE INPUT COVERAGE CONFIRMED: T12 and Rent Roll Verified</p><p style="margin:0 0 10px 0;color:#374151;font-size:11px;">Structured T12, rent roll, and debt inputs are used where available. Unsupported or unstructured uploads remain excluded from modeled outputs. Proposed acquisition financing was modeled separately where validated. Current-debt DSCR and refinance capacity were not assessed because no current outstanding debt balance was verified.</p>${coverageTableHtml}</div>${hasUploadedFiles ? `<p class="small" style="margin-top:8px;">Uploaded files are listed separately; only structured inputs are used quantitatively.</p>` : ""}`;
  }
  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p>${coverageTableHtml}${nextBestUploadsHtml}<p class="small">Sections were omitted where minimum source coverage was not met.</p>${unlocksCard}`;
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
  const annualInPlace = coerceNumber(computedRentRoll?.total_in_place_annual);
  const annualMarket = coerceNumber(computedRentRoll?.total_market_annual);
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
  const concentrationLineHtml = Number.isFinite(topIncomeLineConcentration)
    ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Top Income Line Concentration</p><div style="font-size:11px;line-height:1.6;color:#374151;">${escapeHtml(
        formatPercent1(topIncomeLineConcentration)
      )}</div></div>`
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
  const rrAnnual = coerceNumber(
    computedRentRoll?.total_in_place_annual ?? rentRollPayload?.total_in_place_annual
  );
  const gpr = coerceNumber(t12Payload?.gross_potential_rent);
  const rrVsGprPct =
    Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0
      ? (rrAnnual - gpr) / gpr
      : null;
  const bullets = [];
  if (Number.isFinite(topIncomeLineConcentration) && topIncomeLineConcentration >= 0.85) {
    bullets.push(
      `Top income line concentration is ${formatPercent1(
        topIncomeLineConcentration
      )} of EGI (concentration flag).`
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
  if (Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    if (rrVsGprPct >= 0) {
      bullets.push(
        `Rent roll annualized rent is +${formatPercent1(rrVsGprPct)} vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.`
      );
    } else {
      bullets.push(
        `Rent roll annualized rent is -${formatPercent1(Math.abs(rrVsGprPct))} vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.`
      );
    }
  }
  const bulletsHtml = [...new Set(bullets)]
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const bulletsCard = bulletsHtml
    ? `<div class="card no-break" style="margin-top:6px;"><ul>${bulletsHtml}</ul></div>`
    : "";
  return `<div class="grid-2-balanced"><div class="card no-break"><p class="subsection-title">Top Positive Income Lines (% of EGI, before vacancy offset)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${incomeRowsHtml}</tbody></table></div><div class="card no-break"><p class="subsection-title">Top Expense Drivers (share of OpEx)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${expenseRowsHtml}</tbody></table></div></div>${concentrationLineHtml}${bulletsCard}`;
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
}) {
  const egi = coerceNumber(t12Payload?.effective_gross_income);
  const opex = coerceNumber(t12Payload?.total_operating_expenses);
  const noi = coerceNumber(t12Payload?.net_operating_income);
  const rrAnnual = coerceNumber(
    computedRentRoll?.total_in_place_annual ?? rentRollPayload?.total_in_place_annual
  );
  const gpr = coerceNumber(t12Payload?.gross_potential_rent);
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
  let rrVsGprPct = null;
  if (Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0) {
    rrVsGprPct = (rrAnnual - gpr) / gpr;
    rows.push(
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${formatPercent1(
        rrVsGprPct
      )}</td></tr>`
    );
  }
  if (rows.length === 0) return "";
  const noiMargin =
    Number.isFinite(noi) && Number.isFinite(egi) && egi > 0 ? noi / egi : null;
  const expenseRatio =
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 ? opex / egi : null;
  const flags = [];
  if (Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    if (rrVsGprPct >= 0) {
      flags.push(
        `Rent roll annualized rent is +${formatPercent1(
          rrVsGprPct
        )} vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.`
      );
    } else {
      flags.push(
        `Rent roll annualized rent is -${formatPercent1(Math.abs(rrVsGprPct))} vs T12 GPR. InvestorIQ has not reconciled this variance and does not infer the cause.`
      );
    }
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
  if (Number.isFinite(rrVsGprPct)) {
    stabilityDrivers.push({
      label: `Rent Roll vs T12 GPR ${formatPercent1(rrVsGprPct)}`,
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
  const isPartialRentRollSample = computedRentRoll?.is_partial_sample === true;
  const rrOccupiedUnits = coerceNumber(
    computedRentRoll?.occupied_units ?? (isPartialRentRollSample ? null : rentRollPayload?.occupied_units)
  );
  let occupancy = coerceNumber(
    computedRentRoll?.occupancy ?? (isPartialRentRollSample ? null : rentRollPayload?.occupancy)
  );
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
function buildScreeningRentRollDistributionHtml({
  computedRentRoll,
  rentRollPayload,
  formatCurrency,
}) {
  const source =
    computedRentRoll && typeof computedRentRoll === "object"
      ? computedRentRoll
      : rentRollPayload && typeof rentRollPayload === "object"
      ? rentRollPayload
      : null;
  if (!source) return "";
  if (source.is_partial_sample === true) return "";
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
  let totalInPlaceAnnual = coerceNumber(source.total_in_place_annual);
  if (!Number.isFinite(totalInPlaceAnnual)) {
    const inPlaceMonthly = coerceNumber(source.total_in_place_monthly);
    if (Number.isFinite(inPlaceMonthly)) totalInPlaceAnnual = inPlaceMonthly * 12;
  }
  let totalMarketAnnual = coerceNumber(source.total_market_annual);
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
      `<tr><td>Weighted Avg In-Place Rent</td><td>${formatCurrency(
        weightedInPlace
      )}</td></tr>`
    );
  }
  if (Number.isFinite(weightedMarket)) {
    metricsRows.push(
      `<tr><td>Weighted Avg Market Rent</td><td>${formatCurrency(
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
  const bandsHtml = rentBandRows
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
  if (!rows.length) return "";
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
  for (const row of rows) {
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
// ---------- Main Handler ----------
export default async function handler(req, res) {
  let effectiveUserId = null;
  try {
    const body = req.body || {};
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
    const allowedReportTypes = ["screening", "underwriting", "ic"];
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
    const rawReportType = String(
      body?.report_type || jobReportType || "screening"
    ).toLowerCase();
    const reportType = allowedReportTypes.includes(rawReportType)
      ? rawReportType
      : "screening";
    const effectiveReportMode =
      reportType === "screening" ? "screening_v1" : "v1_core";
    const reportTier =
      reportType === "underwriting" ? 2 : reportType === "ic" ? 3 : 1;
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
    if (promptInstructions.length > 0) {
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
    let appraisalPayload = null;
    let appraisalCapRateBase = null;
    let propertyTaxPayload = null;
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
        const { data: loanTermSheetArtifact } = await supabase
          .from("analysis_artifacts")
          .select("payload")
          .eq("job_id", jobId)
          .eq("type", "loan_term_sheet_parsed")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const rawLoanTermSheetPayload = loanTermSheetArtifact?.payload || null;
        const loanTermSheetPayload = hasUsableDebtPayload(rawLoanTermSheetPayload) ? rawLoanTermSheetPayload : null;
        loanTermSheetTermsPayload = hasDebtTermsPayload(rawLoanTermSheetPayload) ? rawLoanTermSheetPayload : null;
      }
      const { data: sourceRows, error: sourceErr } = await supabase
        .from("analysis_job_files")
        .select("original_filename, uploaded_at")
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
      const resolvedInPlaceAnnual = resolveSafeAnnualRentTotal({
        totalUnits,
        weightedAvgRent: Number.isFinite(summaryAvgInPlaceRent) ? summaryAvgInPlaceRent : avgInPlaceRent,
        summaryAnnualTotal: summaryInPlaceAnnual,
        rowAnnualTotal: totalInPlaceAnnual,
        isPartialSample: isPartialRentRollSample,
      });
      const resolvedMarketAnnual = resolveSafeAnnualRentTotal({
        totalUnits,
        weightedAvgRent: Number.isFinite(summaryAvgMarketRent) ? summaryAvgMarketRent : avgMarketRent,
        summaryAnnualTotal: summaryMarketAnnual,
        rowAnnualTotal: totalMarketAnnual,
        isPartialSample: isPartialRentRollSample,
      });
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
        total_in_place_monthly: Number.isFinite(resolvedInPlaceMonthly) ? resolvedInPlaceMonthly : Number.isFinite(summaryInPlaceMonthly) ? summaryInPlaceMonthly : isPartialRentRollSample ? DATA_NOT_AVAILABLE : totalInPlaceMonthly ?? DATA_NOT_AVAILABLE,
        total_market_monthly: Number.isFinite(resolvedMarketMonthly) ? resolvedMarketMonthly : Number.isFinite(summaryMarketMonthly) ? summaryMarketMonthly : isPartialRentRollSample ? DATA_NOT_AVAILABLE : totalMarketMonthly ?? DATA_NOT_AVAILABLE,
        total_in_place_annual: Number.isFinite(resolvedInPlaceAnnual) ? resolvedInPlaceAnnual : Number.isFinite(summaryInPlaceAnnual) ? summaryInPlaceAnnual : isPartialRentRollSample ? DATA_NOT_AVAILABLE : totalInPlaceAnnual ?? DATA_NOT_AVAILABLE,
        total_market_annual: Number.isFinite(resolvedMarketAnnual) ? resolvedMarketAnnual : Number.isFinite(summaryMarketAnnual) ? summaryMarketAnnual : isPartialRentRollSample ? DATA_NOT_AVAILABLE : totalMarketAnnual ?? DATA_NOT_AVAILABLE,
        rent_to_market_gap: Number.isFinite(resolvedInPlaceAnnual) && Number.isFinite(resolvedMarketAnnual) && resolvedInPlaceAnnual > 0 && resolvedMarketAnnual > resolvedInPlaceAnnual
          ? (resolvedMarketAnnual - resolvedInPlaceAnnual) / resolvedInPlaceAnnual
          : Number.isFinite(summaryRentToMarketGap) ? summaryRentToMarketGap : null,
        is_partial_sample: isPartialRentRollSample,
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
      .replace(/\s*\((clean|messy)\s*test\d+\)\s*/gi, " ")
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
      "InvestorIQ estimates are document-backed and framework-constrained, using uploaded documents and standardized underwriting frameworks. When required inputs are missing, those estimates are omitted rather than inferred."
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{METHODOLOGY_NOTES}}",
      "Metrics and tables reflect document-backed inputs, deterministic calculations, and framework-constrained outputs. Missing source data is not gap-filled."
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
    ? "Assumptions in this memorandum are permitted only when anchored to uploaded documents or standardized underwriting frameworks. InvestorIQ does not invent missing data or fabricate market inputs."
    : "Outputs are document-backed and framework-constrained. Missing inputs are not inferred."
);
finalHtml = replaceAll(
  finalHtml,
  "{{UNIT_POSITIONING_SECTION_TITLE}}",
  effectiveReportMode === "screening_v1"
    ? "Unit-Level Rent Positioning"
    : "Unit-Level Rent Positioning & Value Sensitivity"
);
finalHtml = replaceAll(
  finalHtml,
  "{{UNIT_POSITIONING_SECTION_SUBTITLE}}",
  effectiveReportMode === "screening_v1"
    ? "Market-rent gap based on uploaded rent roll"
    : "Market-rent gap and implied value sensitivity"
);
if (effectiveReportMode === "screening_v1") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_4_NEIGHBORHOOD");
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
    } else {
      // v1_core: keep S2-S5 and S7 because they contain computed T12/rent roll data
      // relevant for underwriting. Only strip S6 (screening-specific refi sufficiency
      // check, replaced by the full Refi Stability Classification section).
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
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
      finalHtml = replaceAll(
        finalHtml,
        "{{DEAL_SCORE_TABLE}}",
        buildDealScoreTable(tables.dealScore || [], tables.totalDealScore)
      );
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
    const execMetricsParts = [];
    const execUnits = coerceNumber(
      computedRentRoll?.total_units ??
        rentRollPayload?.total_units ??
        rentRollPayload?.totals?.total_units
    );
    const execEgi = coerceNumber(t12Payload?.effective_gross_income);
    const execOpex = coerceNumber(t12Payload?.total_operating_expenses);
    const execNoi = coerceNumber(t12Payload?.net_operating_income);
    const execGpr =
      coerceNumber(t12Payload?.gross_potential_rent) ??
      coerceNumber(t12Payload?.gross_scheduled_rent) ??
      coerceNumber(t12Payload?.gross_income) ??
      coerceNumber(t12Payload?.total_income);
    const execOccFromT12 =
      coerceNumber(t12Payload?.physical_occupancy) ??
      coerceNumber(t12Payload?.economic_occupancy) ??
      coerceNumber(t12Payload?.occupancy);
    const rentRollIsPartialSample = computedRentRoll?.is_partial_sample === true;
    const rrTotalUnits =
      coerceNumber(computedRentRoll?.total_units) ??
      coerceNumber(rentRollPayload?.totals?.total_units);
    const rrOccupiedUnits =
      coerceNumber(computedRentRoll?.occupied_units) ??
      coerceNumber(rentRollPayload?.totals?.occupied_units);
    const rrExplicitOccupancy = coerceNumber(computedRentRoll?.occupancy);
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
      : Number.isFinite(rrExplicitOccupancy)
        ? rrExplicitOccupancy
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
        computedRentRoll?.total_in_place_annual ??
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
    const refiFinancials = {
      ...rawFinancials,
      refi_debt_balance:
        rawFinancials?.refi_debt_balance ??
        mortgagePayload?.outstanding_balance ??
        null,
      refi_interest_rate:
        rawFinancials?.refi_interest_rate ??
        mortgagePayload?.interest_rate ??
        null,
      refi_amort_years:
        rawFinancials?.refi_amort_years ??
        mortgagePayload?.amort_years ??
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
    const hasSourceReconciliationVariance = Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05;
    let primaryPressurePoint = driver1?.label
      ? driver1.value
        ? `${driver1.label} (${driver1.value})`
        : driver1.label
      : "No material operating pressure point identified from available core metrics.";
    if (!driver1 && hasSourceReconciliationVariance) {
      primaryPressurePoint = "Source reconciliation variance between rent roll and T12 gross potential rent requires review.";
    }
    // For underwriting, override pressure point with DSCR-based language if mortgage available
    if (effectiveReportMode === "v1_core" && mortgagePayload) {
      const currentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, coerceNumber(t12Payload?.net_operating_income));
      if (Number.isFinite(currentDebtCoverage.dscr) && currentDebtCoverage.dscr > 0) {
        const _ds = formatMultiple(currentDebtCoverage.dscr, 2);
        if (currentDebtCoverage.dscr < 1.25) {
          primaryPressurePoint = `DSCR of ${_ds} constrains refinance capacity below standard lender coverage thresholds`;
        } else if (currentDebtCoverage.dscr < 1.35) {
          primaryPressurePoint = `DSCR of ${_ds}: moderate debt coverage with limited refinancing cushion`;
        } else if (!driver1) {
          primaryPressurePoint = "No material debt-coverage pressure point identified from available current debt metrics.";
        }
      }
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
    if (effectiveReportMode === "v1_core" && hasCoreUnderwritingOperatingMetrics && screeningClass === "Stable") {
      screeningClass = "Document-Constrained Review";
      screeningExplanation =
        "Core operating metrics are present, while debt/refinance conclusions remain constrained by uploaded source coverage.";
    }
    if (effectiveReportMode === "screening_v1") {
      execScreeningLines.push(
        `<p class="exec-classification">${escapeHtml(`Operating Profile: ${screeningClass}`)}</p>`
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
              ? "PASS"
              : "FAIL"
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
        ? "Decision Status: Non-Compliance"
        : allPass
        ? "Decision Status: Full Compliance"
        : satisfiedCount === 0
        ? "Decision Status: Non-Compliance"
        : `Decision Status: Partial Compliance (${satisfiedCount} of 3 criteria satisfied)`;
      decisionContextHtml = `<div class="card no-break" style="margin-top:10px;"><p class="subsection-title">Operating Decision Summary</p><p class="exec-signal-line"><strong>Pass Conditions (All must hold)</strong></p><ul>${passLinesHtml}</ul><p class="exec-signal-line"><strong>Hard Disqualifiers (Any triggers fail)</strong></p><ul>${disqualifierLinesHtml}</ul><p class="exec-signal-line">${decisionStatusText}</p></div>`;
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
                ? screeningClass || DATA_NOT_AVAILABLE
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
    if (
      effectiveReportMode === "screening_v1" &&
      screeningHasSufficientData &&
      decisionContextInputs.some((v) => Number.isFinite(v))
    ) {
      if (anyHardDisq) {
        screeningClass = "Fragile";
      } else if (allPass) {
        screeningClass = "Stable";
      } else {
        screeningClass = "Sensitized";
      }
    }
    const currentDebtDscrForDisplay = resolveCurrentDebtCoverage(
      mortgagePayload,
      coerceNumber(t12Payload?.net_operating_income)
    )?.dscr;
    const coverClassificationLabel = (() => {
      if (effectiveReportMode === "v1_core") {
        if (screeningClass === "Fragile") return "High Risk";
        if (Number.isFinite(currentDebtDscrForDisplay) && currentDebtDscrForDisplay < 1.25) return "Constrained";
        if (refiStabilityResult?.tier === "Refinance Shortfall Under Stress") return "Constrained";
        if (screeningClass === "Stable") return "Stable";
        return "Review";
      }
      if (screeningClass === "Stable") return "Stable";
      if (screeningClass === "Fragile") return "High Risk";
      return "Review";
    })();
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
        `Occupancy is ${formatPercent1(execOccupancy)}, reflecting fully stabilized in-place tenancy.`
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
    // v1_core underwriting-specific bullets (DSCR, refi stability, debt capacity)
    if (effectiveReportMode === "v1_core") {
      const currentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, coerceNumber(t12Payload?.net_operating_income));
      if (Number.isFinite(currentDebtCoverage.dscr) && currentDebtCoverage.dscr > 0) {
        const _ds = formatMultiple(currentDebtCoverage.dscr, 2);
        if (currentDebtCoverage.dscr >= 1.35) {
          upsideBullets.push(`DSCR of ${_ds} exceeds the 1.35x preferred threshold. Debt service is well-covered by T12 NOI.`);
        } else if (currentDebtCoverage.dscr >= 1.25) {
          riskBullets.push(`DSCR of ${_ds} is adequate but below the 1.35x preferred threshold. Limited coverage cushion.`);
        } else {
          riskBullets.push(`Base case DSCR of ${_ds} falls below standard lender coverage thresholds, constraining refinance capacity and limiting debt proceeds under both current and stressed conditions.`);
        }
      } else {
        riskBullets.push(
          loanTermSheetTermsPayload
            ? "Debt terms were identified from purchase-assumption support. Current debt service is not assessed because no current outstanding debt balance was provided."
            : "Debt terms were not included in the uploaded documents; Current Debt DSCR and refinance risk are not assessed in this report."
        );
      }
      const _refiClass = screeningClass && screeningClass !== "Insufficient Data"
        ? `Operating profile classified ${screeningClass}. Under stressed conditions, refinance proceeds are constrained by declining coverage and reduced capital flexibility.`
        : null;
      if (_refiClass) riskBullets.push(_refiClass);
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
    let execAnnualInPlaceTokenValue = Number.isFinite(coerceNumber(computedRentRoll?.total_in_place_annual))
      ? coerceNumber(computedRentRoll.total_in_place_annual)
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
    finalHtml = replaceAll(
      finalHtml,
      "{{OPERATING_PROFILE_CLASSIFICATION}}",
      coverClassificationLabel
    );
    const verdictCssClass = coverClassificationLabel === "Stable" ? "verdict-stable"
      : coverClassificationLabel === "High Risk" ? "verdict-fragile"
      : coverClassificationLabel === "Review" ? "verdict-sensitized"
      : coverClassificationLabel === "Constrained" ? "verdict-sensitized"
      : "";
    finalHtml = replaceAll(finalHtml, "{{VERDICT_CSS_CLASS}}", verdictCssClass);
    // Verdict label tokens: differentiate screening triage vs underwriting capital profile
    const coverVerdictLabel = effectiveReportMode === "v1_core"
      ? "CAPITAL RISK<br/>PROFILE"
      : "SCREENING<br/>SIGNAL";
    finalHtml = replaceAll(finalHtml, "{{COVER_VERDICT_LABEL}}", coverVerdictLabel);
    const execVerdictLabel = effectiveReportMode === "v1_core"
      ? "CAPITAL RISK PROFILE"
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
      const modeLabel = effectiveReportMode === "v1_core" ? "Full Underwriting" : "Preliminary Screening";
snapRows.push(`<div style="display:flex;gap:12px;padding:3px 0;"><span style="width:96px;color:#9CA3AF;font-size:10px;letter-spacing:.5px;text-transform:uppercase;">Report Tier</span><span style="${coverSnapshotValueStyle}">${modeLabel}</span></div>`);
      const snapHtml = snapRows.length > 0
        ? `<div style="margin-top:0;padding-top:0;">${snapRows.join("")}</div>`
        : "";
      finalHtml = replaceAll(finalHtml, "{{COVER_ASSET_SNAPSHOT}}", snapHtml);
    }
    const reportTypeLabel = effectiveReportMode === "v1_core" ? "Underwriting Memorandum" : "Preliminary Investment Screening Memorandum";
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
    if (whyLine || decisionContextHtml || miniSensitivityHtml) {
      const pressureAnchor = `<div class="verdict-pressure">Primary Pressure Point &mdash; ${escapeHtml(primaryPressurePoint)}</div>`;
      const pressureReplacement = `<div class="verdict-pressure">Primary Pressure Point: ${escapeHtml(primaryPressurePoint)}</div>${
        whyLine ? `<p class="exec-signal-line">${escapeHtml(whyLine)}</p>` : ""
      }${decisionContextHtml}${miniSensitivityHtml}`;
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
    // Ranked drivers are screening-only and only render when a true pressure driver exists.
    if (effectiveReportMode === "v1_core" || !driver1) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_RANKED_DRIVERS");
    }
    // Build exec verdict expansion: classification framework + investment thesis
    let execVerdictExpansionHtml = "";
    if (effectiveReportMode === "screening_v1" && screeningClass && screeningClass !== "Insufficient Data") {
      const tierDefs = [
        { name: "Stable",     er: "< 55%",   nm: "> 45%",  beo: "< 75%" },
        { name: "Sensitized", er: "55\u201365%", nm: "35\u201345%", beo: "75\u201385%" },
        { name: "Fragile",    er: "> 65%",   nm: "< 35%",  beo: "> 85%" },
      ];
      const tierRows = tierDefs.map((t) => {
        const isCurrent = t.name === screeningClass;
        const rowStyle = isCurrent ? ` style="font-weight:600;background:#f0f9ff;"` : "";
        const marker = isCurrent ? " \u25B6" : "";
        return `<tr${rowStyle}><td>${escapeHtml(t.name + marker)}</td><td>${t.er}</td><td>${t.nm}</td><td>${t.beo}</td></tr>`;
      }).join("");
      const frameworkCard = `<div class="card no-break" style="margin-top:16px;"><p class="subsection-title">Classification Framework</p><table><thead><tr><th>Tier</th><th>Expense Ratio</th><th>NOI Margin</th><th>Break-even Occ.</th></tr></thead><tbody>${tierRows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:8px;">Standardized underwriting thresholds. &#9654; = current classification.</p></div>`;
      // Investment thesis: fully deterministic
      const rrOccNow = coerceNumber(computedRentRoll?.occupancy);
      const rrInPlace = coerceNumber(computedRentRoll?.total_in_place_annual);
      const rrMarket  = coerceNumber(computedRentRoll?.total_market_annual);
      const rrUpsidePct = coerceNumber(computedRentRoll?.rent_to_market_gap) ??
        ((Number.isFinite(rrInPlace) && Number.isFinite(rrMarket) && rrInPlace > 0)
          ? (rrMarket - rrInPlace) / rrInPlace : null);
      const erPctStr  = Number.isFinite(expenseRatioR) ? `${(expenseRatioR * 100).toFixed(1)}%` : null;
      const nmPctStr  = Number.isFinite(noiMarginR)    ? `${(noiMarginR * 100).toFixed(1)}%`    : null;
      const parts = [];
      if (Number.isFinite(rrOccNow)) parts.push(`The property is ${formatPercent1(rrOccNow)} occupied`);
      if (Number.isFinite(rrUpsidePct) && rrUpsidePct > 0) parts.push(`carries reported rent-to-market upside of ${formatPercent1(rrUpsidePct)}`);
      let thesisText = parts.length > 0 ? parts.join(" and ") + ". " : "";
      if (screeningClass === "Sensitized" && erPctStr && nmPctStr) {
        thesisText += `NOI margin compression to ${nmPctStr}, primarily attributable to a ${erPctStr} expense ratio, supports a Sensitized classification. Operating improvement sensitivity is tied to expense-ratio reduction and the observed rent-to-market gap.`;
      } else if (screeningClass === "Fragile" && erPctStr) {
        thesisText += `An expense ratio of ${erPctStr} and compressed margins classify the profile as Fragile. Material operational improvement is required.`;
      } else if (screeningClass === "Stable") {
        thesisText += `Operating results remain stable based on uploaded operating data.`;
      }
      const thesisCard = thesisText
        ? `<div class="card no-break" style="margin-top:6px;"><p class="subsection-title">Operating Summary</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0 0 6px 0;">${escapeHtml(thesisText)}</p><p class="small" style="color:#64748b;font-style:italic;">All statements derive from reported metrics and standardized classification thresholds. No forward-looking projections.</p></div>`
        : "";
      execVerdictExpansionHtml = `${frameworkCard}${thesisCard}`;
    } else if (effectiveReportMode === "v1_core" && screeningClass && screeningClass !== "Insufficient Data") {
      // Underwriting: show capital risk profile card + DSCR note + operating classification
      const erPctStr = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : null;
      const nmPctStr = Number.isFinite(noiMarginR)    ? formatPercent1(noiMarginR)    : null;
      const beoStr   = Number.isFinite(breakEvenOccR) ? formatPercent1(breakEvenOccR) : null;
      let rows = "";
      if (erPctStr) rows += `<tr><td>Expense Ratio</td><td style="font-weight:600;">${erPctStr}</td></tr>`;
      if (nmPctStr) rows += `<tr><td>NOI Margin</td><td style="font-weight:600;">${nmPctStr}</td></tr>`;
      if (beoStr)   rows += `<tr><td>Break-Even Occupancy</td><td style="font-weight:600;">${beoStr}</td></tr>`;
      const profileCard = `<div class="card no-break" style="margin-top:16px;border-left:3px solid #B8860B;"><p class="subsection-title">Capital Risk Profile: <span style="color:#1e293b;">${coverClassificationLabel.toUpperCase()}</span></p><table><tbody>${rows}</tbody></table><p class="small" style="color:#64748b;font-style:italic;margin-top:6px;">Operating profile classification based on standardized underwriting thresholds from uploaded documents only.</p></div>`;
      execVerdictExpansionHtml = profileCard;
    }
    const acquisitionFinancingAssumptionsHtml = buildAcquisitionFinancingAssumptionsHtml({
      loanTermSheetTermsPayload,
      t12Payload,
      reportType,
      reportTier,
    });
    const hasProposedAcquisitionFinancing = Boolean(String(acquisitionFinancingAssumptionsHtml || "").trim());
    const hasTrueCurrentDebtBalance = Boolean(
      isFinitePositive(mortgagePayload?.outstanding_balance)
    );
    const acquisitionOnlyDebt = effectiveReportMode === "v1_core" && hasProposedAcquisitionFinancing && !hasTrueCurrentDebtBalance;
    finalHtml = replaceAll(finalHtml, "{{EXEC_VERDICT_EXPANSION}}", execVerdictExpansionHtml);
    finalHtml = replaceAll(finalHtml, "{{KEY_UPSIDE_DRIVERS_BULLETS}}", upsideHtml);
    finalHtml = replaceAll(finalHtml, "{{KEY_RISKS_BULLETS}}", risksHtml);
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
    if (acquisitionOnlyDebt) {
      finalHtml = replaceMarkedSection(
        finalHtml,
        "SECTION_7_DEBT",
        `<!-- BEGIN SECTION_7_DEBT -->
<section class="section page-break">
  <div class="no-break">
    <div class="section-header">
      <span class="section-header-eyebrow">Section 03</span>
      <span class="section-header-title">Debt Structure &amp; Financing</span>
      <span class="section-header-sub">Proposed acquisition financing and current debt limitations</span>
    </div>
    <div class="card no-break">
      <p class="subsection-title">Current Debt / Refinance Limitation</p>
      <p>Current debt coverage and refinance sufficiency were not produced because no uploaded source provided a true current outstanding debt balance. Proposed acquisition financing is shown separately and is not treated as current debt.</p>
    </div>
    ${acquisitionFinancingAssumptionsHtml}
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
    finalHtml = finalHtml.replace(
      "{{DCF_INTERPRETATION}}",
      getNarrativeHtml("dcfInterpretation")
    );
    finalHtml = finalHtml.replace(
      "{{FINAL_RECOMMENDATION}}",
      getNarrativeHtml("finalRecommendation")
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
    const rrUnits = Number(computedRentRoll?.total_units);
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
    finalHtml = replaceAll(
      finalHtml,
      "{{UNIT_VALUE_ADD_RIGHT_COLUMN}}",
      suppressUnitLevelRentLift
        ? ""
        : effectiveReportMode === "screening_v1"
        ? (() => {
            const annualInPlace = coerceNumber(computedRentRoll?.total_in_place_annual ?? computedRentRoll?.total_annual_in_place);
            const annualMarket = coerceNumber(computedRentRoll?.total_market_annual ?? computedRentRoll?.total_annual_market);
            if (Number.isFinite(annualInPlace) && annualInPlace > 0 && Number.isFinite(annualMarket) && annualMarket > annualInPlace) {
              return `<div class="card no-break"><p class="subsection-title">Rent Positioning Summary</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0;">Rent roll data indicates in-place rents are below market across the current unit mix.</p></div>`;
            }
            return "";
          })()
        : buildCapRateValueTable(
            coerceNumber(t12Payload?.net_operating_income),
            rrUnits,
            mortgagePayload?.refi_cap_rate ?? loanTermSheetTermsPayload?.refi_cap_rate ?? appraisalCapRateBase
          )
    );
    // Rent Upside Pathway card: full-width below the grid
    {
      let upsideHtml = "";
      const annualInPlace = coerceNumber(computedRentRoll?.total_in_place_annual ?? computedRentRoll?.total_annual_in_place);
      const annualMarket  = coerceNumber(computedRentRoll?.total_market_annual   ?? computedRentRoll?.total_annual_market);
      if (!suppressUnitLevelRentLift && effectiveReportMode !== "screening_v1" && Number.isFinite(annualInPlace) && annualInPlace > 0 && Number.isFinite(annualMarket) && annualMarket > annualInPlace) {
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
          `<p class="small" style="margin-top:6px;">Implied value sensitivity reflects annual rent gap capitalized at the stated cap rate and remains conditional on market-rent capture and occupancy.</p></div>` +
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
    const occupancyValue =
      computedRentRoll && (computedRentRoll.occupancy === null || computedRentRoll.occupancy === undefined)
        ? DATA_NOT_AVAILABLE
        : computedRentRoll?.occupancy ?? rentRollPayload?.occupancy;
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
    const screeningIncomeForensicsHtml = effectiveReportMode === "screening_v1"
      ? (() => {
          const operatingSummaryLines = [];
          const screeningOccupancy = coerceNumber(computedRentRoll?.occupancy ?? (computedRentRoll?.is_partial_sample === true ? null : rentRollPayload?.occupancy));
          const screeningAnnualInPlace = coerceNumber(computedRentRoll?.total_in_place_annual ?? rentRollPayload?.total_in_place_annual);
          const screeningExpenseRatio = Number.isFinite(t12EgiValue) && Number.isFinite(t12TotalExpensesValue) && t12EgiValue > 0
            ? t12TotalExpensesValue / t12EgiValue
            : null;
          const screeningNoiMargin = Number.isFinite(t12EgiValue) && Number.isFinite(t12NoiValue) && t12EgiValue > 0
            ? t12NoiValue / t12EgiValue
            : null;
          const screeningAvgInPlace = coerceNumber(computedRentRoll?.avg_in_place_rent ?? rentRollPayload?.avg_in_place_rent);
          const screeningAvgMarket = coerceNumber(computedRentRoll?.avg_market_rent ?? rentRollPayload?.avg_market_rent);
          if (Number.isFinite(screeningOccupancy) || Number.isFinite(screeningAnnualInPlace)) {
            const incomeParts = [];
            if (Number.isFinite(screeningOccupancy)) incomeParts.push(`occupancy of ${formatPercent1(screeningOccupancy)}`);
            if (Number.isFinite(screeningAnnualInPlace)) incomeParts.push(`annual in-place rent of ${formatCurrency(screeningAnnualInPlace)}`);
            if (incomeParts.length > 0) operatingSummaryLines.push(`${incomeParts[0].charAt(0).toUpperCase() + incomeParts[0].slice(1)}${incomeParts.length > 1 ? ` and ${incomeParts.slice(1).join(" and ")}` : ""}.`);
          }
          if (Number.isFinite(t12TotalExpensesValue) || Number.isFinite(screeningExpenseRatio)) {
            const expenseParts = [];
            if (Number.isFinite(t12TotalExpensesValue)) expenseParts.push(`total operating expenses of ${formatCurrency(t12TotalExpensesValue)}`);
            if (Number.isFinite(screeningExpenseRatio)) expenseParts.push(`an expense ratio of ${formatPercent1(screeningExpenseRatio)}`);
            if (expenseParts.length > 0) operatingSummaryLines.push(`${expenseParts[0].charAt(0).toUpperCase() + expenseParts[0].slice(1)}${expenseParts.length > 1 ? ` and ${expenseParts.slice(1).join(" and ")}` : ""}.`);
          }
          if (Number.isFinite(t12NoiValue) || Number.isFinite(screeningNoiMargin)) {
            const noiParts = [];
            if (Number.isFinite(t12NoiValue)) noiParts.push(`NOI of ${formatCurrency(t12NoiValue)}`);
            if (Number.isFinite(screeningNoiMargin)) noiParts.push(`an NOI margin of ${formatPercent1(screeningNoiMargin)}`);
            if (noiParts.length > 0) operatingSummaryLines.push(`${noiParts[0].charAt(0).toUpperCase() + noiParts[0].slice(1)}${noiParts.length > 1 ? `, reflecting ${noiParts.slice(1).join(" and ")}` : ""}.`);
          }
          if (Number.isFinite(screeningAvgInPlace) && Number.isFinite(screeningAvgMarket) && screeningAvgInPlace > 0 && screeningAvgMarket > screeningAvgInPlace) {
            operatingSummaryLines.push("Rent roll data supports below-market in-place rents across the current unit mix.");
          }
          return operatingSummaryLines.length > 0
            ? `<div class="card no-break"><p class="subsection-title">Operating Profile Summary</p><p style="font-size:11px;line-height:1.6;color:#374151;margin:0;">${escapeHtml(operatingSummaryLines.join(" "))}</p></div>`
            : "";
        })()
      : buildScreeningIncomeForensicsHtml({
          t12Payload,
          computedRentRoll,
          rentRollPayload,
          formatCurrency,
        });
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_INCOME_FORENSICS_BLOCK}}",
      screeningIncomeForensicsHtml
    );
    const screeningExpenseHtml = effectiveReportMode === "screening_v1" ? "" : buildScreeningExpenseStructureHtml({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
    });
    const screeningNoiHtml = effectiveReportMode === "screening_v1" ? "" : buildScreeningNoiStabilityHtml({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      formatCurrency,
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
    if (effectiveReportMode === "screening_v1") {
      if ((screeningIncomeForensicsHtml || "").trim().length === 0) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S2_INCOME_FORENSICS");
      }
      if ((screeningExpenseHtml || "").trim().length === 0) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S3_EXPENSE_STRUCTURE");
      }
      if ((screeningNoiHtml || "").trim().length === 0) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S4_NOI_STABILITY");
      }
    }
    if ((screeningRentRollHtml || "").trim().length === 0) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S5_RENT_ROLL_DISTRIBUTION");
    }
    const screeningRefiSufficiencyHtml =
      effectiveReportMode === "screening_v1"
        ? ""
        : (
            buildScreeningRefiSufficiencyTable({ financials, t12Payload }) +
            buildFinancingEnvelopeGrid(
              coerceNumber(t12Payload?.net_operating_income),
              Number.isFinite(rrUnits) && rrUnits > 0 ? rrUnits : Number(computedRentRoll?.total_units)
            )
          );
    let screeningCoverageHtml = "";
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_REFI_DATA_SUFFICIENCY_BLOCK}}",
      screeningRefiSufficiencyHtml
    );
    const screeningHasSufficientDataGate = hasMinimumScreeningCoverage(t12Payload);
    if (effectiveReportMode === "screening_v1") {
      if (!screeningHasSufficientDataGate) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S2_INCOME_FORENSICS");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S3_EXPENSE_STRUCTURE");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S4_NOI_STABILITY");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S5_RENT_ROLL_DISTRIBUTION");
      }
    }
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
        hasPositiveRenovationAmount(renovationPayload?.renovation_budget) ||
        hasPositiveRenovationAmount(financials?.renovation_total_budget) ||
        hasPositiveRenovationAmount(financials?.renovation_total_capex)
    );
    const hasVerifiedStructuredRenovationInput = Boolean(
      hasVerifiedRenovationAmount ||
        hasStructuredRenovationRows(renovationPayload?.budget_rows) ||
        hasStructuredRenovationRows(renovationPayload?.execution_rows) ||
        hasStructuredRenovationRows(financials?.renovation_budget_rows) ||
        hasStructuredRenovationRows(financials?.renovation_execution_rows)
    );
    const hasExplicitRenovationInput = Boolean(hasVerifiedStructuredRenovationInput);
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
    const hasRenovationFilenameSignal = renovationSourceFilenames.length > 0;
    const renovationSourceFilenameText = renovationSourceFilenames.map((name) => escapeHtml(name)).join(", ");
    const renovationAcknowledgmentHtml =
      !hasExplicitRenovationInput && hasRenovationFilenameSignal
        ? `<strong>Uploaded Renovation / CapEx Document:</strong> Uploaded renovation/CapEx source file acknowledged: ${renovationSourceFilenameText}. Historical capital expenditure or renovation support was identified, but no verified forward-looking renovation budget, rent-lift plan, ROI, payback analysis, or implementation schedule was extracted. Historical CapEx is acknowledged but not modeled as a prospective renovation strategy.`
        : "";
    if (renovationAcknowledgmentHtml && documentSourcesHtml) {
      documentSourcesHtml += `<p class="small" style="margin-top:8px;">${renovationAcknowledgmentHtml}</p>`;
    }
    const renovationBudgetRows = hasExplicitRenovationInput
      ? buildRenovationBudgetRows(
          financials?.renovation_budget_rows || renovationPayload?.budget_rows || [],
          formatCurrency
        )
      : "";
    const renovationExecutionRows = hasExplicitRenovationInput
      ? buildRenovationExecutionRows(
          financials?.renovation_execution_rows ||
            renovationPayload?.execution_rows ||
            [],
          formatCurrency
        )
      : "";
    const renovationBudgetNote = hasExplicitRenovationInput
      ? String(
          financials?.renovation_budget_note ??
            renovationPayload?.budget_note ??
            DATA_NOT_AVAILABLE
        ).trim() || DATA_NOT_AVAILABLE
      : DATA_NOT_AVAILABLE;
    const renovationExecutionNote = hasExplicitRenovationInput
      ? String(
          financials?.renovation_execution_note ??
            renovationPayload?.execution_note ??
            DATA_NOT_AVAILABLE
        ).trim() || DATA_NOT_AVAILABLE
      : DATA_NOT_AVAILABLE;
    const renovationInterpretation = hasExplicitRenovationInput
      ? String(
          sections?.renovationInterpretation ??
            financials?.renovation_interpretation ??
            renovationPayload?.interpretation ??
            DATA_NOT_AVAILABLE
        ).trim() || DATA_NOT_AVAILABLE
      : DATA_NOT_AVAILABLE;
    finalHtml = replaceAll(finalHtml, "{{RENOVATION_BUDGET_ROWS}}", renovationBudgetRows);
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_BUDGET_NOTE}}",
      escapeHtml(renovationBudgetNote)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_EXECUTION_ROWS}}",
      renovationExecutionRows
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_EXECUTION_NOTE}}",
      escapeHtml(renovationExecutionNote)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{RENOVATION_INTERPRETATION}}",
      escapeHtml(renovationInterpretation)
    );
    let canRenderRefi = false;
    if (effectiveReportMode !== "v1_core") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
      finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", "");
    } else {
      const refiResult = buildRefiStabilityModel({
        financials: refiFinancials,
        t12Payload,
        formatValue: formatCurrency,
      });
      const validRefiTiers = new Set([
        "Stable",
        "Sensitized",
        "Fragile",
        "Refinance Shortfall Under Stress",
      ]);
      const refiHtml = String(refiResult?.html || "").trim();
      canRenderRefi =
        validRefiTiers.has(refiResult?.tier) && refiHtml.length > 0;
      const hasDebtButIncompleteRefiInputs =
        Boolean(mortgagePayload) && !canRenderRefi;
      if (canRenderRefi) {
        finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", refiHtml);
      } else if (hasDebtButIncompleteRefiInputs) {
        const hasCompleteCurrentDebtTerms =
          isFinitePositive(refiFinancials?.refi_debt_balance) &&
          isFinitePositive(refiFinancials?.refi_interest_rate) &&
          isFinitePositive(refiFinancials?.refi_amort_years);
        const missingRefiCapRate = !isFinitePositive(refiFinancials?.refi_cap_rate_base);
        const refiNotProducedCopy =
          hasCompleteCurrentDebtTerms && missingRefiCapRate
            ? "Debt terms were identified, but deterministic refinance proceeds classification was not produced because refinance cap-rate or valuation support was incomplete."
            : "Debt was identified from uploaded documents, but deterministic refinance classification was not produced because one or more required refinance inputs were incomplete.";
        finalHtml = replaceAll(
          finalHtml,
          "{{REFI_STABILITY_BLOCK}}",
          `<div class="card no-break"><p><strong>Refinance Stability Classification: Not Produced</strong></p><p>${refiNotProducedCopy}</p><p class="small">Required refinance inputs include current debt balance, interest rate, amortization, refinance cap rate, NOI, and deterministic stress assumptions.</p></div>`
        );
      } else {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
        finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", "");
      }
    }
    const showOperatingStatement = Boolean(
      t12IncomeRows ||
        t12ExpenseRows ||
        (Number.isFinite(t12EgiValue) && Number.isFinite(t12TotalExpensesValue)) ||
        Number.isFinite(t12NoiValue)
    );
    if (!showOperatingStatement) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_OPERATING_STATEMENT");
    }
    const renovationStrategyHtml = getNarrativeHtml("renovationNarrative");
    const showRenovationSection = hasExplicitRenovationInput && Boolean(
      (renovationBudgetRows || "").trim() ||
        (renovationExecutionRows || "").trim() ||
        renovationInterpretation !== DATA_NOT_AVAILABLE ||
        (renovationStrategyHtml && renovationStrategyHtml !== DATA_NOT_AVAILABLE)
    );
    if (!showRenovationSection) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
    }
    if (!documentSourcesHtml) {
      finalHtml = finalHtml.replace(
        /<div class="section">[\s\S]*?<div class="section-number">0\.5 Document Sources<\/div>[\s\S]*?\{\{DOCUMENT_SOURCES_TABLE\}\}[\s\S]*?<\/div>\s*/m,
        ""
      );
    }
    finalHtml = replaceAll(finalHtml, "{{DOCUMENT_SOURCES_TABLE}}", documentSourcesHtml);
    const hasDocSources =
      Array.isArray(documentSources) &&
      documentSources.length > 0 &&
      Boolean(documentSourcesHtml);
    if (!hasDocSources || effectiveReportMode === "screening_v1") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_DOC_SOURCES");
    }
    // Exec summary always shows because both modes have computed KPI grid and verdict block
    // (v1_core previously gated on AI narrative "execSummary" which is never populated)
    if (false) {
      finalHtml = stripMarkedSection(finalHtml, "EXEC_SUMMARY");
    }
    const showUnitValueAdd = hasMeaningfulNarrative(getNarrativeHtml("unitValueAdd"));
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
    const showRisk = hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    if (!showRisk) {
      finalHtml = stripMarkedSection(finalHtml, "RISK_ASSESSMENT");
    }
    const showRenovation = hasMeaningfulNarrative(getNarrativeHtml("renovationNarrative"));
    if (!showRenovation) {
      finalHtml = stripMarkedSection(finalHtml, "RENOVATION_NARRATIVE");
    }
    const showDebt = hasMeaningfulNarrative(getNarrativeHtml("debtStructure"));
    if (!showDebt) {
      finalHtml = stripMarkedSection(finalHtml, "DEBT_STRUCTURE");
    }
    const showDealScoreSummary = hasMeaningfulNarrative(getNarrativeHtml("dealScoreSummary"));
    if (!showDealScoreSummary) {
      finalHtml = stripMarkedSection(finalHtml, "DEAL_SCORE_SUMMARY");
    }
    const showDealScoreInterpretation = hasMeaningfulNarrative(
      getNarrativeHtml("dealScoreInterpretation")
    );
    if (!showDealScoreInterpretation) {
      finalHtml = stripMarkedSection(finalHtml, "DEAL_SCORE_INTERPRETATION");
    }
    // SECTION_8_INTERPRETATION strip is deferred to the v1_core block
    // For screening mode, the token is already cleared (empty string) by the early replacement,
    // so the section will be stripped by the DNA safety pass and section strip cascade.
    const showAdvancedModeling = hasMeaningfulNarrative(
      getNarrativeHtml("advancedModelingIntro")
    );
    if (!showAdvancedModeling) {
      finalHtml = stripMarkedSection(finalHtml, "ADVANCED_MODELING_INTRO");
    }
    const showDcf = hasMeaningfulNarrative(getNarrativeHtml("dcfInterpretation"));
    if (!showDcf) {
      finalHtml = stripMarkedSection(finalHtml, "DCF_INTERPRETATION");
    }
    const showFinalRecommendation = hasMeaningfulNarrative(
      getNarrativeHtml("finalRecommendation")
    );
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
      "gross_potential_rent",
      "effective_gross_income",
      "total_operating_expenses",
      "net_operating_income",
    ].some((key) => Number.isFinite(Number(t12Payload?.[key])));
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
    const showSection2 = hasRentRollData && hasTargetRentInputs && hasPositiveLiftSignal;
    if (!showSection2) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_UNIT_VALUE_ADD");
    }
    const showSection2Roi =
      Array.isArray(tables.renovationSummary) && tables.renovationSummary.length > 0;
    if (!showSection2Roi) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_RENOVATION_ROI");
    }
    let scenarioTableHtml = "";
    // Note: scenarioTableHtml is built later in the v1_core block (~line 4210+).
    // Do NOT check scenarioTableHtml.length here because it is always empty at this point.
    const showSection3 =
      (hasRentRollData && hasT12Data && Array.isArray(tables.scenarios) && tables.scenarios.length > 0) ||
      (effectiveReportMode === "v1_core" && hasT12Data); // v1_core always builds scenario table from T12
    if (!showSection3) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
    }
    const showSection4 =
      hasMeaningfulNarrative(getNarrativeHtml("neighborhoodAnalysis")) ||
      hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    if (!showSection4) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_4_NEIGHBORHOOD");
    }
    const showSection4Table = hasMeaningfulNarrative(
      getNarrativeHtml("neighborhoodAnalysis")
    );
    if (!showSection4Table) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_4_LOCATION_TABLE");
    }
    const showSection5 = hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    if (!showSection5) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK");
    }
    const showSection5Matrix =
      Array.isArray(tables.riskMatrix) && tables.riskMatrix.length > 0;
    if (!showSection5Matrix) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK_MATRIX");
    }
    const showSection6 =
      showRenovationSection ||
      (Array.isArray(tables.renovationSummary) && tables.renovationSummary.length > 0);
    if (!showSection6) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_6_RENOVATION");
    }
    // Build deterministic underwriting blocks from parsed supporting docs
    // Debt Capital Structure rows (from mortgage_statement_parsed)
    let debtCapitalRowsHtml = "";
    if (mortgagePayload && effectiveReportMode === "v1_core") {
      const dcRows = [];
      if (mortgagePayload.lender_name) {
        dcRows.push(`<tr><td>Lender</td><td>${escapeHtml(String(mortgagePayload.lender_name))}</td></tr>`);
      }
      const bal = coerceNumber(mortgagePayload.outstanding_balance);
      if (Number.isFinite(bal) && bal > 0) {
        dcRows.push(`<tr><td>Outstanding Balance</td><td>${formatCurrency(bal)}</td></tr>`);
      }
      const ratePct = coerceNumber(mortgagePayload.interest_rate);
      if (Number.isFinite(ratePct) && ratePct > 0) {
        dcRows.push(`<tr><td>Interest Rate</td><td>${ratePct.toFixed(2)}%</td></tr>`);
      }
      const amort = coerceNumber(mortgagePayload.amort_years);
      const pni = coerceNumber(mortgagePayload.monthly_payment);
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
    if (mortgagePayload && t12Payload && effectiveReportMode === "v1_core") {
      const noiBase = coerceNumber(t12Payload.net_operating_income);
      const baseRatePct = coerceNumber(mortgagePayload.interest_rate); // e.g. 4.5
      const debtBal = coerceNumber(mortgagePayload.outstanding_balance);
      const amortYrs = coerceNumber(mortgagePayload.amort_years) || 25;
      const currentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, noiBase);
      const resolvedCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const baseCapPct = (Number.isFinite(resolvedCapPct) && resolvedCapPct > 0) ? resolvedCapPct : 5.5;
      const capSource = (Number.isFinite(resolvedCapPct) && resolvedCapPct > 0) ? "document-derived" : "stated default";

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
    if (t12Payload && effectiveReportMode === "v1_core") {
      const noiYear0 = coerceNumber(t12Payload.net_operating_income);
      const resolvedExitCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const exitCapPct = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? resolvedExitCapPct : 5.5;
      const exitCapSource = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? "document-derived" : "stated default";
      const GROWTH = 0.03; // 3% annual NOI growth stated assumption
      const DISCOUNT = 0.08; // 8% discount rate stated assumption

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
        tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;" colspan="5">Estimated Intrinsic Value (Sum of PVs)</td>`;
        tableHtml += `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(totalPv)}</td>`;
        tableHtml += `</tr>`;
        tableHtml += `</tbody></table>`;
        tableHtml += `<p class="small" style="margin-top:6px;">Basis: T12 NOI = ${formatCurrency(noiYear0)} | Annual NOI growth: 3.0% (stated) | Discount rate: 8.0% (stated) | Exit cap: ${formatCapPercentExact(exitCapPct)} (${normalizeExitCapSourceLabel(exitCapSource)})</p>`;
        // Cap rate sensitivity on intrinsic value
        const noi5dcf = noiYear0 * Math.pow(1 + GROWTH, 5);
        const capRatesDcf = [4.5, 5.0, 5.5, 6.0, 6.5];
        const capRatesDcfRows = capRatesDcf.some((cap) => Math.abs(cap - exitCapPct) < 0.01)
        ? capRatesDcf
        : [...capRatesDcf, exitCapPct].sort((a, b) => a - b);
        tableHtml += `<p class="subsection-title" style="margin-top:16px;margin-bottom:6px;">Intrinsic Value: Exit Cap Rate Sensitivity</p>`;
        tableHtml += `<table style="width:100%;border-collapse:collapse;font-size:11px;">`;
        tableHtml += `<thead><tr><th style="text-align:left;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Exit Cap Rate</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Year 5 Exit Value</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">Implied Intrinsic Value</th><th style="text-align:right;padding:4px 8px;background:#F1F5F9;color:#1e293b;border:1px solid #E5E7EB;font-weight:600;">vs. Base</th></tr></thead><tbody>`;
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
          tableHtml += `<tr${rowBg}><td style="padding:4px 8px;border:1px solid #E5E7EB;">${isBase ? formatCapPercentExact(rowCap) : `${cap.toFixed(1)}%`}${isBase ? ` <span style="font-size:9px;color:#6B7280;">(${normalizeExitCapSourceLabel(exitCapSource)})</span>` : ""}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(exitV)}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${formatCurrency(pvSum)}</td><td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;color:${vs === "-" ? "#374151" : pvSum > totalPv ? "#B8860B" : "#64748B"};">${vs}</td></tr>`;
        }
        tableHtml += `</tbody></table>`;
        dcfTableHtml = tableHtml;
      }
    }
    // End underwriting block builders

    // Deterministic 5-Year NOI Scenario Table (Conservative / Base / Optimistic)
    let scenarioTrajectoryChartHtml = "";
    if (effectiveReportMode === "v1_core" && t12Payload) {
      const noiBasis = coerceNumber(t12Payload.net_operating_income);
      const resolvedExitCapPct = coerceNumber(refiFinancials?.refi_cap_rate_base);
      const exitCapPct = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? resolvedExitCapPct : 5.5;
      const exitCapSource = (Number.isFinite(resolvedExitCapPct) && resolvedExitCapPct > 0) ? "document-derived" : "5.5% stated";
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
        sTbl += `<p class="small" style="margin-top:6px;">Basis: T12 NOI = ${formatCurrency(noiBasis)} | Exit cap: ${formatCapPercentExact(exitCapPct)} (${normalizeExitCapSourceLabel(exitCapSource)}). Scenario outputs are deterministic from document-backed inputs.</p>`;
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
          sTbl += `<tr${rowStyle}><td style="padding:4px 8px;border:1px solid #E5E7EB;">${isBase ? formatCapPercentExact(rowCap) : `${cap.toFixed(1)}%`}${isBase ? ` <span style="font-size:9px;color:#6B7280;">(${normalizeExitCapSourceLabel(exitCapSource)})</span>` : ""}</td>`;
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
    let dealScoreTableHtml = "";
    let dealScoreRows = [];
    if (effectiveReportMode === "v1_core") {
      const scoreRows = [];
      let totalPoints = 0;
      let maxPoints = 0;
      if (Number.isFinite(expenseRatioR)) {
        const pts = expenseRatioR < 0.55 ? 10 : expenseRatioR <= 0.65 ? 6 : 2;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({ label: "Expense Ratio", value: formatPercent1(expenseRatioR), pts, max: 10, band: expenseRatioR < 0.55 ? "Below 55%" : expenseRatioR <= 0.65 ? "55\u201365%" : "Above 65%" });
      }
      if (Number.isFinite(noiMarginR)) {
        const pts = noiMarginR > 0.45 ? 10 : noiMarginR >= 0.35 ? 6 : 2;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({ label: "NOI Margin", value: formatPercent1(noiMarginR), pts, max: 10, band: noiMarginR > 0.45 ? "Above 45%" : noiMarginR >= 0.35 ? "35\u201345%" : "Below 35%" });
      }
      if (Number.isFinite(execOccupancy)) {
        const pts = execOccupancy > 0.95 ? 10 : execOccupancy >= 0.85 ? 7 : 4;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({ label: "Occupancy Rate", value: formatPercent1(execOccupancy), pts, max: 10, band: execOccupancy > 0.95 ? "Above 95%" : execOccupancy >= 0.85 ? "85\u201395%" : "Below 85%" });
      }
      if (Number.isFinite(breakEvenOccR)) {
        const pts = breakEvenOccR < 0.70 ? 10 : breakEvenOccR <= 0.80 ? 6 : 2;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({ label: "Break-Even Occupancy", value: formatPercent1(breakEvenOccR), pts, max: 10, band: breakEvenOccR < 0.70 ? "Below 70%" : breakEvenOccR <= 0.80 ? "70\u201380%" : "Above 80%" });
      }
      if (Number.isFinite(marketRentPremiumRatio) && !isNaN(marketRentPremiumRatio)) {
        const pct = marketRentPremiumRatio * 100;
        const pts = pct > 15 ? 10 : pct >= 5 ? 7 : 4;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({ label: "Rent-to-Market Gap", value: formatPercent1(marketRentPremiumRatio), pts, max: 10, band: pct > 15 ? ">15% upside" : pct >= 5 ? "5\u201315% upside" : "<5% upside" });
      }
      let hasDscrScore = false;
      let computedDscrForVerdict = null;
      const currentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, coerceNumber(t12Payload?.net_operating_income));
      if (Number.isFinite(currentDebtCoverage.dscr) && currentDebtCoverage.dscr > 0) {
        computedDscrForVerdict = currentDebtCoverage.dscr;
        const pts = currentDebtCoverage.dscr > 1.35 ? 10 : currentDebtCoverage.dscr >= 1.25 ? 7 : 3;
        totalPoints += pts; maxPoints += 10;
        scoreRows.push({
          label: currentDebtCoverage.hasSourcePayment ? "DSCR (Current Debt)" : "DSCR (Computed)",
          value: formatMultiple(currentDebtCoverage.dscr, 2),
          pts,
          max: 10,
          band: currentDebtCoverage.dscr > 1.35 ? "Above 1.35x" : currentDebtCoverage.dscr >= 1.25 ? "1.25\u20131.35x" : "Below 1.25x",
        });
        hasDscrScore = true;
      }
      if (!hasDscrScore) {
        totalPoints += 0; maxPoints += 10;
        const dscrNotAssessedCopy = currentDebtNotAssessedCopy({ mortgagePayload, loanTermSheetTermsPayload });
        scoreRows.push({
          label: "Current Debt DSCR",
          value: dscrNotAssessedCopy.value,
          pts: 0,
          max: 10,
          band: dscrNotAssessedCopy.band,
        });
      }
      if (scoreRows.length >= 4 && maxPoints > 0) {
        const score = Math.round((totalPoints / maxPoints) * 100);
        const normalVerdictLabel = score >= 70 ? "Within Underwriting Parameters" : score >= 50 ? "Review" : "Outside Parameters";
        const hasDebtCoverageConstraint =
          hasDscrScore &&
          Number.isFinite(computedDscrForVerdict) &&
          computedDscrForVerdict < 1.25;
        const verdictLabel =
          hasDebtCoverageConstraint && score >= 70
            ? "Review - Debt Coverage Constraint"
            : !hasDscrScore && score >= 70
            ? "Review"
            : normalVerdictLabel;
        const verdictColor = "#1F3A5F";
        const rows = scoreRows.map((r) =>
          `<tr>` +
          `<td style="padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(r.label)}</td>` +
          `<td style="text-align:right;padding:4px 8px;border:1px solid #E5E7EB;">${escapeHtml(r.value)}</td>` +
          `<td style="padding:4px 8px;border:1px solid #E5E7EB;color:#3F5E84;">${escapeHtml(r.band)}</td>` +
          `<td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;font-weight:700;">${r.pts}/${r.max}</td>` +
          `</tr>`
        ).join("");
        dealScoreTableHtml =
          `<div class="card no-break" style="margin-top:12px;">` +
          `<div style="text-align:center;padding:10px 0 14px;border-bottom:1px solid #E5E7EB;margin-bottom:12px;">` +
          `<span style="font-size:24px;font-weight:800;color:${verdictColor};letter-spacing:2px;">${verdictLabel}</span>` +
          `<span style="display:block;font-size:12px;color:#3F5E84;margin-top:4px;">Composite Score: ${score} / 100</span>` +
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
          `<td colspan="3" style="padding:4px 8px;border:1px solid #E5E7EB;">Composite Score (normalized)</td>` +
          `<td style="text-align:center;padding:4px 8px;border:1px solid #E5E7EB;">${score}/100</td>` +
          `</tr></tfoot>` +
          `</table>` +
          `<p class="small" style="margin-top:8px;color:#3F5E84;">Composite score is calculated from reported metrics only. Base score thresholds: Within Underwriting Parameters \u2265 70 | Review 50\u201369 | Outside Parameters &lt; 50. DSCR below 1.25x or not assessed applies a mandatory Review verdict cap.</p>` +
          `</div>`;
        dealScoreRows = scoreRows;
      }
    }

    const showSection7 =
      hasMeaningfulNarrative(getNarrativeHtml("debtStructure")) ||
      debtCapitalRowsHtml.length > 0 ||
      String(acquisitionFinancingAssumptionsHtml || "").trim().length > 0;
    if (!showSection7) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
    }
    const showSection7Tables =
      (Array.isArray(tables.debtStructure) && tables.debtStructure.length > 0) ||
      debtCapitalRowsHtml.length > 0 ||
      refiCollapseGridHtml.length > 0;
    if (!showSection7Tables) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT_TABLES");
    }
    const showSection8 =
      (Array.isArray(tables.dealScore) && tables.dealScore.length > 0) ||
      hasMeaningfulNarrative(getNarrativeHtml("dealScoreSummary")) ||
      hasMeaningfulNarrative(getNarrativeHtml("dealScoreInterpretation")) ||
      dealScoreTableHtml.length > 0;
    if (!showSection8) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
    }
    const showSection9 =
      (Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) || dcfTableHtml.length > 0;
    if (!showSection9) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
    }
    const showSection9Table =
      (Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) || dcfTableHtml.length > 0;
    if (!showSection9Table) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF_TABLE");
    }
    const showSection10 =
      (Array.isArray(tables.comps) && tables.comps.length > 0) ||
      hasMeaningfulNarrative(getNarrativeHtml("advancedModelingIntro"));
    if (!showSection10) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_ADV_MODEL");
    }
    const showSection11 = hasMeaningfulNarrative(getNarrativeHtml("finalRecommendation"));
    if (!showSection11) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_11_FINAL_RECS");
    }
    finalHtml = stripMarkedSection(finalHtml, "SECTION_4_NEIGHBORHOOD");
    const hasRiskMatrixRows = Array.isArray(tables?.riskMatrix) && tables.riskMatrix.length > 0;
    const hasRiskNarrative = hasMeaningfulNarrative(getNarrativeHtml("riskAssessment"));
    if (!hasRiskMatrixRows && !hasRiskNarrative) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_5_RISK_MATRIX");
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
    if (!hasDcfMetric) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_10_DCF_SUMMARY");
    }
    if (reportTier === 1) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_3_SCENARIO");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_RENOVATION_ROI");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_4_NEIGHBORHOOD");
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
    if (finalHtml.includes(dataCoverageBegin) && finalHtml.includes(dataCoverageEnd)) {
      const escapedCoverageToken = dataCoverageToken.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const coverageMatch = finalHtml.match(
        new RegExp(
          `<!-- BEGIN ${escapedCoverageToken} -->([\\s\\S]*?)<!-- END ${escapedCoverageToken} -->`
        )
      );
      const coverageSection = coverageMatch?.[1] || "";
      const dnaCount = (coverageSection.match(/DATA NOT AVAILABLE/g) || []).length;
      if (dnaCount >= 3) {
        finalHtml = stripMarkedSection(finalHtml, dataCoverageToken);
      }
    }
    finalHtml = replaceAll(finalHtml, "{{REPORT_MODE}}", effectiveReportMode);
    finalHtml = finalHtml.replace(/Primary Pressure Point\s*-\s*/g, "Primary Pressure Point: ");
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
    finalHtml = finalHtml.replace(
      /DATA COVERAGE\s*&\s*UNDERWRITING GAPS\s*-\s*MISSING INPUTS AND OMITTED SECTIONS/g,
      effectiveReportMode === "v1_core"
        ? "Data Coverage & Underwriting Gaps - Missing Inputs and Omitted Sections"
        : "Data Coverage & Screening Notes - Missing Inputs and Omitted Sections"
    );
    if (effectiveReportMode !== "v1_core") {
      finalHtml = finalHtml.replace(
        /<span class="section-header-title">Data Coverage &amp; Underwriting Gaps<\/span>/g,
        '<span class="section-header-title">Data Coverage &amp; Screening Notes</span>'
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
    screeningCoverageHtml = buildScreeningDataCoverageSummary({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      financials,
      effectiveReportMode,
      supportingUnderwritingDocsUsed,
      hasUploadedFiles: Array.isArray(documentSources) && documentSources.length > 0 && Boolean(documentSourcesHtml),
    });
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
      if (mortgagePayload) {
          const la = coerceNumber(mortgagePayload.outstanding_balance);
          const rp = coerceNumber(mortgagePayload.interest_rate);
          const ay = coerceNumber(mortgagePayload.amort_years) || 25;
          const an = coerceNumber(t12Payload?.net_operating_income);
          const currentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, an);
        if (Number.isFinite(currentDebtCoverage.dscr) && currentDebtCoverage.dscr > 0) {
          const dscr = currentDebtCoverage.dscr;
          if (Number.isFinite(dscr) && dscr > 0) {
            const flag = dscr < 1.25 ? "STRESSED" : dscr < 1.35 ? "ADEQUATE" : "STRONG";
            const color = dscr < 1.25 ? "#dc2626" : dscr < 1.35 ? "#d97706" : "#16a34a";
            addRisk("DSCR (Current Debt)", formatMultiple(dscr, 2), "STRONG > 1.35x | ADEQUATE 1.25-1.35x | STRESSED < 1.25x", flag, color);
          }
        } else {
          const dscrNotAssessedCopy = currentDebtNotAssessedCopy({ mortgagePayload, loanTermSheetTermsPayload });
          addRisk("Current Debt DSCR", dscrNotAssessedCopy.value, dscrNotAssessedCopy.explanation, "NOT ASSESSED", "#9CA3AF");
        }
      } else {
        addRisk(
          "Current Debt DSCR",
          currentDebtNotAssessedCopy({ mortgagePayload, loanTermSheetTermsPayload }).value,
          currentDebtNotAssessedCopy({ mortgagePayload, loanTermSheetTermsPayload }).explanation,
          "NOT ASSESSED",
          "#9CA3AF"
        );
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
      // DSCR KPI card in exec summary
      {
        let execDscrText = null;
        const execCurrentDebtCoverage = resolveCurrentDebtCoverage(mortgagePayload, coerceNumber(t12Payload?.net_operating_income));
        if (Number.isFinite(execCurrentDebtCoverage.dscr) && execCurrentDebtCoverage.dscr > 0) {
          execDscrText = formatMultiple(execCurrentDebtCoverage.dscr, 2);
        }
        if (execDscrText) {
          finalHtml = replaceAll(finalHtml, "{{EXEC_DSCR_COMPUTED}}", execDscrText);
        } else {
          finalHtml = stripMarkedSection(finalHtml, "EXEC_DSCR_CARD");
        }
      }
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
        html = `<div class="no-break" style="margin-top:16px;"><p class="subsection-title" style="margin-bottom:6px;">Break-Even Occupancy Buffer</p>` +
          `<div style="background:#E5E7EB;height:20px;border-radius:4px;overflow:hidden;position:relative;">` +
          `<div style="background:#B8860B;height:100%;width:${beoW}%;border-radius:4px 0 0 4px;"></div>` +
          `</div>` +
          `<div style="display:flex;justify-content:space-between;margin-top:5px;">` +
          `<span style="font-size:10px;color:#1e293b;font-weight:600;">Break-even: ${beoFmt}</span>` +
          `<span style="font-size:10px;color:#1e293b;font-weight:600;">Current occupancy: ${currFmt}</span>` +
          `</div>` +
          `<p class="small" style="margin-top:4px;color:${bufColor};font-weight:700;">Buffer: ${bufPts} percentage points &mdash; ${bufLabel}</p></div>`;
      }
      finalHtml = replaceAll(finalHtml, "{{OCCUPANCY_BUFFER_VISUAL}}", html);
    }
    // Safety: clear chart tokens for screening mode (scenario section is stripped, so token won't be in HTML, but be safe)
    finalHtml = replaceAll(finalHtml, "{{SCENARIO_TRAJECTORY_CHART}}", "");
    // End HTML/CSS Charts

    // Hard fail-closed: purge all remaining {{...}} tokens before HTML leaves this function
    // Build a deterministic institutional-grade rationale sentence from computed metrics
    let execRationale = "";
    if (screeningClass && screeningClass !== "Insufficient Data" && effectiveReportMode === "screening_v1") {
      const erStr  = Number.isFinite(expenseRatioR) ? formatPercent1(expenseRatioR) : null;
      const nmStr  = Number.isFinite(noiMarginR)    ? formatPercent1(noiMarginR)    : null;
      const beoStr = Number.isFinite(breakEvenOccR) ? formatPercent1(breakEvenOccR) : null;
      if (screeningClass === "Stable") {
        const parts = [];
        if (erStr)  parts.push(`expense ratio of ${erStr}`);
        if (nmStr)  parts.push(`NOI margin of ${nmStr}`);
        if (beoStr) parts.push(`break-even occupancy of ${beoStr}`);
        execRationale = parts.length > 0
          ? `Classified STABLE: ${parts.join(", ")} are within institutional operating thresholds.`
          : "Classified STABLE: operating metrics remain within defined screening thresholds.";
      } else if (screeningClass === "Sensitized") {
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
      } else if (screeningClass === "Fragile") {
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
// 9. Send to DocRaptor (STILL IN TEST MODE)
const htmlStringRaw =
  typeof safeHtml === "string"
    ? safeHtml
    : safeHtml && typeof safeHtml === "object" && typeof safeHtml.html === "string"
      ? safeHtml.html
      : String(safeHtml || "");
const htmlString = sanitizeTypography(htmlStringRaw);
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
    /Proposed Acquisition Debt Sizing|Derived Acquisition Loan Amount/i.test(htmlString);
  const acquisitionFinancingDerivedOnlyRendered =
    acquisitionFinancingInputsUsable &&
    acquisitionFinancingRendered &&
    !isFinitePositive(loanTermSheetTermsPayload?.loan_amount) &&
    !isFinitePositive(loanTermSheetTermsPayload?.outstanding_balance) &&
    !isFinitePositive(mortgagePayload?.loan_amount) &&
    !isFinitePositive(mortgagePayload?.outstanding_balance) &&
    loanTermSheetTermsPayload?.debt_basis === "acquisition_financing_assumption";

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
  if (
    Number.isFinite(annualTax) &&
    ((annualTax >= 1900 && annualTax <= 2100) || annualTax < 1000)
  ) {
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
// Replace multi-byte Unicode chars with HTML entities so DocRaptor/Prince
// renders them correctly regardless of charset detection.
let docHtml = dedupeDataNotAvailableBySection(htmlString);
let sourceCoverageQaResult = null;
let renderedQaResult = null;
let renderedQaStatus = "not_run";
let qaFixRoutingResult = null;
let qaManagerReviewResult = null;
let reportContractQaResult = null;
let qaActionPlanResult = null;
let qaDirectorReviewResult = null;
let deliveryGateDecisionResult = null;
let sourcePackageQaResult = null;
let sourcePackageQaFiles = [];
let sourcePackageQaArtifacts = [];
try {
  let coverageFiles = Array.isArray(documentSources) ? documentSources : [];
  let coverageArtifacts = [];
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
  const sourceCoverageQa = buildSourceReportCoverageQa({
    jobId: jobId || null,
    userId: effectiveUserId || null,
    propertyName: property_name || jobPropertyName || "Unknown",
    reportType,
    reportTier,
    html: docHtml,
    uploadedFiles: coverageFiles,
    artifacts: coverageArtifacts,
  });
  sourceCoverageQaResult = sourceCoverageQa;
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
          html_length: docHtml.length,
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
    html: docHtml,
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
        html_length: docHtml.length,
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
          report_type: reportType,
          report_tier: reportTier,
          html_length: docHtml.length,
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
    html: docHtml,
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
    html: docHtml,
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
    html: docHtml,
    artifacts: sourcePackageQaArtifacts,
    sourceReportCoverageQa: sourceCoverageQaResult,
    reportQaFlags,
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
    html: docHtml,
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
  const gateTimestamp = new Date().toISOString().replace(/:/g, "-");
  if (jobId) {
    const { error: deliveryGateErr } = await supabase.from("analysis_artifacts").insert([
      {
        job_id: jobId || null,
        user_id: effectiveUserId || null,
        type: "delivery_gate_decision",
        bucket: "internal",
        object_path: `analysis_jobs/${jobId || "unknown"}/delivery_gate_decision/${gateTimestamp}.json`,
        payload: deliveryGateDecision,
      },
    ]);
    if (deliveryGateErr) {
      console.error("Failed to write delivery_gate_decision artifact:", deliveryGateErr);
    }
  }
} catch (err) {
  console.error("Failed to build delivery_gate_decision artifact:", err?.message || err);
}
  if (deliveryGateDecisionResult?.delivery_gate_status === "admin_review_required") {
    return res.status(200).json({
      ok: true,
      success: true,
      reportId: null,
    storagePath: null,
    url: null,
    delivery_gate_status: deliveryGateDecisionResult.delivery_gate_status,
    delivery_gate_reason_code: deliveryGateDecisionResult?.reason_code || null,
    delivery_gate_top_action_code: deliveryGateDecisionResult?.top_action_code || null,
    delivery_gate_owner_area: deliveryGateDecisionResult?.owner_area || null,
      delivery_gate_recommended_next_step: deliveryGateDecisionResult?.recommended_next_step || null,
      customer_delivery_ready: false,
      public_sample_ready: deliveryGateDecisionResult?.public_sample_ready ?? true,
      high_value_outreach_ready: deliveryGateDecisionResult?.high_value_outreach_ready ?? true,
      customer_publish_eligible: deliveryGateDecisionResult?.customer_publish_eligible ?? false,
      customer_publish_blockers: deliveryGateDecisionResult?.customer_publish_blockers || [],
      public_sample_blockers: deliveryGateDecisionResult?.public_sample_blockers || [],
      high_value_outreach_blockers: deliveryGateDecisionResult?.high_value_outreach_blockers || [],
      advisory_only_findings: deliveryGateDecisionResult?.advisory_only_findings || [],
      regeneration_recommended: deliveryGateDecisionResult?.regeneration_recommended ?? false,
      regeneration_required_for_customer_delivery: deliveryGateDecisionResult?.regeneration_required_for_customer_delivery ?? false,
      regeneration_required_for_public_sample: deliveryGateDecisionResult?.regeneration_required_for_public_sample ?? false,
      regeneration_required: deliveryGateDecisionResult?.regeneration_required ?? false,
      admin_review_required: deliveryGateDecisionResult?.admin_review_required ?? true,
      user_needs_documents: deliveryGateDecisionResult?.user_needs_documents ?? false,
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
  docHtml = sanitizeTypography(docHtml);
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
        // 10. Create DB row first so we have a deterministic report_id for storage
    const holdDelivery =
      deliveryGateDecisionResult?.delivery_gate_status &&
      deliveryGateDecisionResult.delivery_gate_status !== "deliverable";
    const { data: reportRow, error: reportCreateError } = await supabase
      .from("reports")
      .insert({
  user_id: effectiveUserId,
            property_name: property_name || "Property",
  report_type: reportType,
  storage_path: holdDelivery ? null : "pending",
})
      .select("id")
      .single();
    if (reportCreateError || !reportRow?.id) {
      console.error("Report DB Create Error:", reportCreateError);
      throw new Error("Failed to create report record");
    }
    const reportId = reportRow.id;
    // 11. Persist PDF to Supabase Storage using required contract: {user_id}/{report_id}.pdf
    const storagePath = `${effectiveUserId}/${reportId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("generated_reports")
      .upload(storagePath, pdfResponse.data, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      throw new Error("Failed to upload report to storage");
    }
    // 12. Update DB row with final storage_path
    if (!holdDelivery) {
      const { error: reportUpdateError } = await supabase
        .from("reports")
        .update({ storage_path: storagePath })
        .eq("id", reportId);
      if (reportUpdateError) {
        console.error("Report DB Update Error:", reportUpdateError);
        // Do not throw. The PDF is stored and we can still return the signed URL.
      }
    }
    // 13. Generate Signed URL for immediate viewing (valid for 1 hour)
    let signedData = { signedUrl: null };
    if (!holdDelivery) {
      const { data: signedResult, error: signedError } = await supabase.storage
        .from("generated_reports")
        .createSignedUrl(storagePath, 3600);
      if (signedError) {
        console.error("Signed URL Error:", signedError);
        throw new Error("Failed to generate access link");
      }
      signedData = signedResult || signedData;
    }
    // 14. Return JSON with the report URL and report_id
    res.status(200).json({
      success: true,
      reportId,
      url: signedData.signedUrl,
      delivery_gate_status: deliveryGateDecisionResult?.delivery_gate_status || "deliverable",
      delivery_gate_reason_code: deliveryGateDecisionResult?.reason_code || null,
      delivery_gate_top_action_code: deliveryGateDecisionResult?.top_action_code || null,
      delivery_gate_owner_area: deliveryGateDecisionResult?.owner_area || null,
      delivery_gate_recommended_next_step: deliveryGateDecisionResult?.recommended_next_step || null,
      customer_delivery_ready: deliveryGateDecisionResult?.customer_delivery_ready ?? true,
      public_sample_ready: deliveryGateDecisionResult?.public_sample_ready ?? true,
      high_value_outreach_ready: deliveryGateDecisionResult?.high_value_outreach_ready ?? true,
      customer_publish_eligible: deliveryGateDecisionResult?.customer_publish_eligible ?? true,
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
  buildAcquisitionFinancingAssumptionsHtml,
  buildRenovationBudgetRows,
  buildRenovationExecutionRows,
  buildScreeningDataCoverageSummary,
  buildT12SummaryHtml,
  materiallyDifferent,
  resolveSafeAnnualRentTotal,
};
