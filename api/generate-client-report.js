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

const DATA_NOT_AVAILABLE = "DATA NOT AVAILABLE (not present in uploaded documents)";
const SECTION_OMITTED = "Section intentionally omitted due to insufficient source data.";

const coerceNumber = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, "").replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

function isFiniteNumber(x) {
  const n = Number(x);
  return Number.isFinite(n);
}

function isFinitePositive(x) {
  const n = Number(x);
  return Number.isFinite(n) && n > 0;
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

function buildRefiStabilityModel({ financials, t12Payload, formatValue }) {
  const f = financials && typeof financials === "object" ? financials : {};
  const debtBalance = coerceNumber(f.refi_debt_balance);
  const ltvMax = coerceNumber(f.refi_ltv_max);
  const dscrMin = coerceNumber(f.refi_dscr_min);
  const interestRate = coerceNumber(f.refi_interest_rate);
  const amortYears = coerceNumber(f.refi_amort_years);
  const capRateBase = coerceNumber(f.refi_cap_rate_base);
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

  const capRateBaseR = toCapRatio(capRateBase);
  const requiredScalars = [
    debtBalance,
    ltvMax,
    dscrMin,
    interestRate,
    amortYears,
    capRateBaseR,
    noiBase,
  ];
  const hasValidScalars =
    requiredScalars.every((v) => Number.isFinite(v)) &&
    debtBalance > 0 &&
    ltvMax > 0 &&
    dscrMin > 0 &&
    amortYears > 0 &&
    capRateBaseR > 0 &&
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
  const baseCap = capRateBaseR;
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
        const cap = capRateBaseR + capBps / 10000;
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

  if (worstPoint && Number.isFinite(worstPoint.noiShock)) {
    worstNoi = noiBase * (1 + worstPoint.noiShock);
    worstCap = capRateBaseR + worstPoint.capBps / 10000;
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
      worstMaxProceeds = Math.min(worstLoanLtv, worstLoanDscr);
      worstCoverage = worstMaxProceeds / debtBalance;
      worstBinding =
        worstLoanLtv <= worstLoanDscr ? "LTV-limited" : "DSCR-limited";
    }
  }

  let refiTier = "Stable";
  if (coverageBase < 1.0) {
    refiTier = "Refinance Failure Under Stress";
  } else if (worstFiniteCoverage < 0.90) {
    refiTier = "Refinance Failure Under Stress";
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
  )}; thresholds: fail<0.90x, fragile<1.00x, sensitized<1.10x`;
  const worstRows = stressPoints
    .slice()
    .sort((a, b) => a.coverage - b.coverage)
    .slice(0, 4)
    .map((point) => {
      const noiShockPct = `${(point.noiShock * 100).toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`;
      const capBpsLabel = `${Math.round(point.capBps)}`;
      const rateBpsLabel = `${Math.round(point.rateBps)}`;
      const proceedsLabel = Number.isFinite(point.proceeds)
        ? formatValue(point.proceeds)
        : DATA_NOT_AVAILABLE;
      const coverageLabel = formatCoverage(point.coverage);
      return `<tr><td>${noiShockPct}</td><td>${capBpsLabel}</td><td>${rateBpsLabel}</td><td>${proceedsLabel}</td><td>${coverageLabel}</td></tr>`;
    })
    .join("");
  const fmtMoney = (x) => (Number.isFinite(x) ? formatValue(x) : DATA_NOT_AVAILABLE);
  const fmtRate = (x) => (Number.isFinite(x) ? formatPercent1(x) : DATA_NOT_AVAILABLE);
  const fmtCap = (x) => (Number.isFinite(x) ? formatPercent1(x) : DATA_NOT_AVAILABLE);
  const fmtX = (x) => (Number.isFinite(x) ? formatMultiple(x, 2) : DATA_NOT_AVAILABLE);
  const fmtRate2 = (x) =>
    Number.isFinite(x)
      ? `${(x * 100).toLocaleString("en-CA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}%`
      : DATA_NOT_AVAILABLE;
  const fmtBufferPct = (x) =>
    Number.isFinite(x)
      ? `${(x * 100).toLocaleString("en-CA", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`
      : DATA_NOT_AVAILABLE;
  const pmtAnnual = (principal, rateRatio, years) => {
    const p = Number(principal);
    const r = toRateRatio(rateRatio);
    const y = Number(years);
    if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(r) || r < 0 || !Number.isFinite(y) || y <= 0) {
      return null;
    }
    const mc = computeMortgageConstant(r, y);
    return Number.isFinite(mc) ? p * mc : null;
  };
  const sufficiencyTableHtml = `<div class="card no-break" style="margin-top:12px;">
  <p><strong>Full Refinance Sufficiency (Deterministic)</strong></p>
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
      <tr><td>Binding Constraint</td><td>${escapeHtml(baseBinding)}</td><td>${escapeHtml(worstBinding || DATA_NOT_AVAILABLE)}</td></tr>
      <tr><td>Max Proceeds (min of above)</td><td>${fmtMoney(baseMaxProceeds)}</td><td>${fmtMoney(worstMaxProceeds)}</td></tr>
      <tr><td>Coverage (Max Proceeds / Debt Balance)</td><td>${fmtX(coverageBase)}</td><td>${fmtX(worstCoverage)}</td></tr>
      <tr><td>Worst-Case Drivers (NOI shock | Cap expansion | Rate shock)</td><td> - </td><td>${escapeHtml(worstDriverTripleText)}</td></tr>
    </tbody>
  </table>
  <p class="small">Base and worst-case proceeds are constrained by the tighter of LTV and DSCR. Coverage below 1.00x indicates a refinance shortfall without paydown.</p>
</div>`;
  const rate0 = toRateRatio(interestRate);
  const capRate0 = capRateBaseR;
  const ltvMaxR = toRateRatio(ltvMax);
  const value0 =
    coerceNumber(f.appraisedValue) ??
    coerceNumber(f.appraised_value) ??
    coerceNumber(f.purchasePrice) ??
    coerceNumber(f.purchase_price);
  const breakpointInputsReady = [
    noiBase,
    debtBalance,
    rate0,
    amortYears,
    value0,
    dscrMin,
    ltvMaxR,
  ].every((v) => Number.isFinite(v)) && debtBalance > 0 && noiBase > 0 && amortYears > 0 && value0 > 0 && dscrMin > 0 && ltvMaxR > 0;
  let breakpointTableHtml = "";
  if (breakpointInputsReady) {
    const ads0 = pmtAnnual(debtBalance, rate0, amortYears);
    const noiFail = Number.isFinite(ads0) ? ads0 * dscrMin : null;
    const noiDropPct = Number.isFinite(noiFail) && noiBase > 0
      ? Math.max(0, 1 - noiFail / noiBase)
      : null;

    let rateFail = null;
    if (Number.isFinite(ads0) && Number.isFinite(rate0)) {
      const baseDscr = ads0 > 0 ? noiBase / ads0 : null;
      if (Number.isFinite(baseDscr) && baseDscr <= dscrMin) {
        rateFail = rate0;
      } else {
        const adsHigh = pmtAnnual(debtBalance, 0.20, amortYears);
        const dscrHigh = Number.isFinite(adsHigh) && adsHigh > 0 ? noiBase / adsHigh : null;
        if (Number.isFinite(dscrHigh) && dscrHigh <= dscrMin) {
          let lo = Math.max(0, rate0);
          let hi = 0.20;
          for (let i = 0; i < 60; i += 1) {
            const mid = (lo + hi) / 2;
            const adsMid = pmtAnnual(debtBalance, mid, amortYears);
            const dscrMid = Number.isFinite(adsMid) && adsMid > 0 ? noiBase / adsMid : null;
            if (!Number.isFinite(dscrMid) || dscrMid <= dscrMin) {
              hi = mid;
            } else {
              lo = mid;
            }
          }
          rateFail = hi;
        }
      }
    }
    const rateDeltaBps = Number.isFinite(rateFail) && Number.isFinite(rate0)
      ? Math.max(0, Math.round((rateFail - rate0) * 10000))
      : null;

    const valueFail = debtBalance / ltvMaxR;
    const valueDropPct = Number.isFinite(valueFail) && value0 > 0
      ? Math.max(0, 1 - valueFail / value0)
      : null;
    const capFail = Number.isFinite(noiBase) && Number.isFinite(valueFail) && valueFail > 0
      ? noiBase / valueFail
      : null;
    const capDeltaBps = Number.isFinite(capFail) && Number.isFinite(capRate0)
      ? Math.max(0, Math.round((capFail - capRate0) * 10000))
      : null;
    const capIsBinding =
      Number.isFinite(capFail) &&
      Number.isFinite(capRate0) &&
      capFail <= capRate0;

    const hasAnyBreakpointBuffer =
      Number.isFinite(noiDropPct) ||
      Number.isFinite(rateDeltaBps) ||
      Number.isFinite(valueDropPct) ||
      (Number.isFinite(capDeltaBps) && (capDeltaBps >= 1 || capIsBinding));

    if (!hasAnyBreakpointBuffer) {
      breakpointTableHtml = "";
    } else {
      const breakpointCandidates = [];
      if (Number.isFinite(noiDropPct)) {
        breakpointCandidates.push({
          sortValue: Math.round(Math.abs(noiDropPct) * 10000),
          text: `NOI (-${fmtBufferPct(noiDropPct)})`,
        });
      }
      if (Number.isFinite(rateDeltaBps)) {
        breakpointCandidates.push({
          sortValue: rateDeltaBps,
          text: `Rate (+${Math.round(rateDeltaBps)} bps)`,
        });
      }
      if (Number.isFinite(valueDropPct)) {
        breakpointCandidates.push({
          sortValue: Math.round(Math.abs(valueDropPct) * 10000),
          text: `Value (-${fmtBufferPct(valueDropPct)})`,
        });
      }
      if (Number.isFinite(capDeltaBps) && (capDeltaBps >= 1 || capIsBinding)) {
        breakpointCandidates.push({
          sortValue: capDeltaBps,
          text: `Cap (+${Math.round(capDeltaBps)} bps)`,
        });
      }
      const primaryBreakpoint = breakpointCandidates
        .slice()
        .sort((a, b) => a.sortValue - b.sortValue)[0] || null;

      breakpointTableHtml = `<div class="card no-break" style="margin-top:12px;">
  <p><strong>Breakpoint Table - Refinance Failure Thresholds</strong></p>
  <table>
    <thead>
      <tr><th>Breakpoint</th><th>Current</th><th>Failure At</th><th>Buffer</th></tr>
    </thead>
    <tbody>
      <tr><td>NOI (TTM)</td><td>${fmtMoney(noiBase)}</td><td>${fmtMoney(noiFail)}</td><td>${Number.isFinite(noiDropPct) ? `${fmtBufferPct(noiDropPct)} NOI decline` : DATA_NOT_AVAILABLE}</td></tr>
      <tr><td>Interest Rate</td><td>${fmtRate2(rate0)}</td><td>${fmtRate2(rateFail)}</td><td>${Number.isFinite(rateDeltaBps) ? `${Math.round(rateDeltaBps)} bps increase` : DATA_NOT_AVAILABLE}</td></tr>
      <tr><td>Value</td><td>${fmtMoney(value0)}</td><td>${fmtMoney(valueFail)}</td><td>${Number.isFinite(valueDropPct) ? `${fmtBufferPct(valueDropPct)} value decline` : DATA_NOT_AVAILABLE}</td></tr>
      <tr><td>Cap Rate</td><td>${fmtRate2(capRate0)}</td><td>${fmtRate2(capFail)}</td><td>${Number.isFinite(capRate0) && Number.isFinite(capDeltaBps) ? `${Math.round(capDeltaBps)} bps cap expansion` : DATA_NOT_AVAILABLE}</td></tr>
    </tbody>
  </table>
  ${primaryBreakpoint ? `<p class="small">Primary Breakpoint: ${escapeHtml(primaryBreakpoint.text)}</p>` : ""}
</div>`;
    }
  const refiHtml = `<div class="card no-break"><p><strong>Refinance Stability Classification: ${escapeHtml(
    refiTier
  )}</strong></p><p>Base Coverage: ${formatCoverage(
    coverageBase
  )}</p><p>Worst-Case Coverage: ${formatCoverage(
    worstFiniteCoverage
  )}</p><p class="small">${escapeHtml(
    evidence
  )}</p><table><thead><tr><th>NOI Shock</th><th>Cap Expansion (bps)</th><th>Rate Shock (bps)</th><th>Max Proceeds</th><th>Coverage</th></tr></thead><tbody>${worstRows}</tbody></table></div>${sufficiencyTableHtml}${breakpointTableHtml}`;  return { tier: refiTier, evidence, html: refiHtml };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasMeaningfulNarrative(html) {
  if (!html || typeof html !== "string") return false;
  if (html.includes(DATA_NOT_AVAILABLE)) return false;
  if (!html.replace(/<[^>]*>/g, "").trim()) return false;
  return true;
}

function sanitizeDisplayText(s) {
  if (!s) return s;
  return String(s).replace(/\s*\((clean|messy|test|qa)[^)]*\)\s*$/i, "").trim();
}

function sanitizeTypography(html) {
  if (typeof html !== "string") return html;
  return html
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/&(?:ndash|mdash);/g, "-");
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
  const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<!-- BEGIN ${escapedToken} -->[\\s\\S]*?<!-- END ${escapedToken} -->`,
    "g"
  );
  return html.replace(re, "");
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
        Number.isFinite(currentRentNum) && Number.isFinite(marketRentNum)
          ? formatValue(marketRentNum - currentRentNum)
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

  const totalNum = toNum(totalUnits);
  const total = Number.isFinite(totalNum) ? String(Math.round(totalNum)) : "";

  const totalRow = `<tr>
            <td><strong>Blended / Total</strong></td>
            <td><strong>${total}</strong></td>
            <td><strong></strong></td>
            <td><strong></strong></td>
            <td><strong></strong></td>
            <td><strong></strong></td>
          </tr>`;

  return `${rows}${totalRow}`;
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
        ? formatPercent1(coerceNumber(f.refi_interest_rate))
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
        ? formatPercent1(coerceNumber(f.refi_cap_rate_base))
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
    coerceNumber(computedRentRoll?.occupancy ?? rentRollPayload?.occupancy)
  ) || Number.isFinite(deriveOccFromRentRollUnits(rentRollPayload));
  const inPlacePresent = Array.isArray(rentRollRows)
    ? rentRollRows.some((row) =>
        Number.isFinite(coerceNumber(row?.in_place_rent ?? row?.current_rent))
      )
    : false;
  const marketPresent = Array.isArray(rentRollRows)
    ? rentRollRows.some((row) =>
        Number.isFinite(coerceNumber(row?.market_rent))
      )
    : false;
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
  if (rrMissing.includes("in_place_rent") || rrMissing.includes("market_rent")) {
    suggestions.push("Current Rent Roll with in-place & market rents");
  if (!rrOccPresent) {
    suggestions.push("Rent Roll with unit status (occupied/vacant) or occupied/total summary");
  const suggestionHtml = [...new Set(suggestions)]
    .slice(0, 3)
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join("");
  const nextBestUploadsHtml = suggestionHtml
    ? `<p class="subsection-title" style="margin-top:12px;">Next Best Document Uploads</p><ul>${suggestionHtml}</ul>`
    : "";

  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p><table><thead><tr><th>Dataset</th><th>Fields Present</th><th>Coverage</th><th>Missing</th></tr></thead><tbody><tr><td>T12</td><td>${t12PresentCount}/${t12Checks.length}</td><td>${t12CoveragePct}%</td><td>${escapeHtml(
    t12Missing.join(", ") || "None"
  )}</td></tr><tr><td>Rent Roll</td><td>${rrPresentCount}/${rentRollChecks.length}</td><td>${rrCoveragePct}%</td><td>${escapeHtml(
    rrMissing.join(", ") || "None"
  )}</td></tr></tbody></table>${missingHtml ? `<ul>${missingHtml}</ul>` : ""}${nextBestUploadsHtml}<p class="small">Sections were omitted where minimum source coverage was not met.</p>`;
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
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
  const expenseLines = toRows(expenseLinesRaw)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  if (incomeLines.length < 2 || expenseLines.length < 2) return "";

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
    ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Top Income Line Concentration</p><p>${escapeHtml(
        formatPercent1(topIncomeLineConcentration)
      )}</p></div>`
    : "";

  let marketPremiumPct = null;
  const avgInPlace = coerceNumber(
    computedRentRoll?.avg_in_place_rent ?? rentRollPayload?.avg_in_place_rent
  );
  const avgMarket = coerceNumber(
    computedRentRoll?.avg_market_rent ?? rentRollPayload?.avg_market_rent
  );
  if (Number.isFinite(avgInPlace) && Number.isFinite(avgMarket) && avgInPlace > 0) {
    marketPremiumPct = ((avgMarket - avgInPlace) / avgInPlace) * 100;
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
  if (Number.isFinite(marketRentPremiumRatio) && marketRentPremiumRatio >= 0.10) {
    bullets.push(
      `In-place rents trail market by approximately ${formatPercent1(
        marketRentPremiumRatio
      )} (document-backed upside).`
    );
  if (Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    if (rrVsGprPct >= 0) {
      bullets.push(
        `Rent roll annualized rent is +${formatPercent1(
          rrVsGprPct
        )} vs T12 GPR (reconciliation flag).`
      );
    } else {
      bullets.push(
        `Rent roll annualized rent is -${formatPercent1(
          Math.abs(rrVsGprPct)
        )} vs T12 GPR (reconciliation flag).`
      );
    }

  const bulletsHtml = [...new Set(bullets)]
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const bulletsCard = bulletsHtml
    ? `<div class="card no-break" style="margin-top:12px;"><ul>${bulletsHtml}</ul></div>`
    : "";

  return `<div class="grid-2-balanced"><div class="card no-break"><p class="subsection-title">Top Income Drivers (share of EGI)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${incomeRowsHtml}</tbody></table></div><div class="card no-break"><p class="subsection-title">Top Expense Drivers (share of OpEx)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${expenseRowsHtml}</tbody></table></div></div>${concentrationLineHtml}${bulletsCard}`;
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
  if (Number.isFinite(opex) && Number.isFinite(units) && units > 0) {
    rows.push(
      `<tr><td>Operating Expense per Unit</td><td>${formatCurrency(
        opex / units
      )}</td></tr>`
    );
  if (Number.isFinite(noi) && Number.isFinite(units) && units > 0) {
    rows.push(
      `<tr><td>NOI per Unit</td><td>${formatCurrency(noi / units)}</td></tr>`
    );

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
  ).filter((r) => r.amount > 0);
  const totalOpEx = allExpenseRows.reduce((s, r) => s + r.amount, 0);
  const expenseDriverRows = allExpenseRows
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const flags = [];
  const expenseRatio =
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 ? opex / egi : null;
  if (Number.isFinite(expenseRatio) && expenseRatio >= 0.60) {
    flags.push("Operating expense ratio is elevated (> 60%).");
  if (totalOpEx > 0 && expenseDriverRows.some((r) => r.amount / totalOpEx >= 0.30)) {
    flags.push("Top expense line exceeds 30% of OpEx (concentration risk).");
  const flagsHtml = flags
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const rankedExpenseDrivers = expenseDriverRows.map((row) => ({
    label: row.label,
    pct: totalOpEx > 0 ? (row.amount / totalOpEx) * 100 : NaN,
  }));
  const top3 = (rankedExpenseDrivers || [])
    .filter((x) => x && x.label && Number.isFinite(x.pct))
    .slice(0, 3);
  const top3Html = top3.length
    ? `<div class="subsection-title" style="margin-top:10px;">Top 3 Expense Drivers</div><ol>${top3
        .map((x) => `<li>${escapeHtml(x.label)}: ${x.pct.toFixed(1)}%</li>`)
        .join("")}</ol>`
    : `<div class="subsection-title" style="margin-top:10px;">Top 3 Expense Drivers</div><div class="small">Expense line-item detail not present in uploaded T12; category ranking omitted.</div>`;
  const flagsCard = (flagsHtml || top3Html)
    ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Expense Flags (Deterministic)</p>${flagsHtml ? `<ul>${flagsHtml}</ul>` : ""}${top3Html}</div>`
    : "";

  return `${metricsCard}${flagsCard}`;
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
  if (Number.isFinite(egi) && Number.isFinite(opex) && egi > 0) {
    const expenseSensitivity = 1 - opex / egi;
    rows.push(
      `<tr><td>Expense Sensitivity</td><td>${formatPercent1(
        expenseSensitivity
      )}</td></tr>`
    );
  if (Number.isFinite(opex) && Number.isFinite(gpr) && gpr > 0) {
    const breakEvenOcc = opex / gpr;
    if (Number.isFinite(breakEvenOcc)) {
      rows.push(
        `<tr><td>Break-even Occupancy</td><td>${formatPercent1(
          breakEvenOcc
        )}</td></tr>`
      );
    }
  if (Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0) {
    const rrVsGprPct = (rrAnnual - gpr) / gpr;
    rows.push(
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${formatPercent1(
        rrVsGprPct
      )}</td></tr>`
    );

  if (rows.length === 0) return "";

  const flags = [];
  if (Number.isFinite(rrVsGprPct) && Math.abs(rrVsGprPct) >= 0.05) {
    if (rrVsGprPct >= 0) {
      flags.push(
        `Rent roll annualized rent is -${formatPercent1(
          Math.abs(rrVsGprPct)
        )} vs T12 GPR (reconciliation flag).`
      );
    }
  if (Number.isFinite(noiMargin) && noiMargin < 0.35) {
    flags.push(`NOI margin is ${formatPercent1(noiMargin)} (thin margin flag).`);
  if (Number.isFinite(expenseRatio) && expenseRatio > 0.65) {
    flags.push(
      `Expense ratio is ${formatPercent1(expenseRatio)} (high expense load flag).`
    );

  const stabilityDrivers = [];
  if (Number.isFinite(noiMargin)) {
    stabilityDrivers.push({
      label: `NOI Margin ${formatPercent1(noiMargin)}`,
      severity: Math.max(0, 0.35 - noiMargin),
    });
  if (Number.isFinite(expenseRatio)) {
    stabilityDrivers.push({
      label: `Expense Ratio ${formatPercent1(expenseRatio)}`,
      severity: Math.max(0, expenseRatio - 0.65),
    });
  if (Number.isFinite(rrVsGprPct)) {
    stabilityDrivers.push({
      label: `Rent Roll vs T12 GPR ${formatPercent1(rrVsGprPct)}`,
      severity: Math.max(0, Math.abs(rrVsGprPct) - 0.05),
    });
  const rankedDrivers = stabilityDrivers
    .slice()
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((d) => d.label);
  const driverRankHtml = rankedDrivers.length
    ? `<p class="subsection-title">Stability Drivers (Worst -> Best)</p><ol>${rankedDrivers
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join("")}</ol>`
    : "";

  const uniqueFlags = [...new Set(flags)];
  const flagsHtml = uniqueFlags
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const flagsCard =
    driverRankHtml || flagsHtml
      ? `<div class="card no-break" style="margin-top:12px;">${driverRankHtml}${
          flagsHtml ? `<p class="subsection-title">Variance Flags (Deterministic)</p><ul>${flagsHtml}</ul>` : ""
        }</div>`
      : "";

  const rrTotalUnits = coerceNumber(
    computedRentRoll?.total_units ?? rentRollPayload?.total_units
  );
  const rrOccupiedUnits = coerceNumber(
    computedRentRoll?.occupied_units ?? rentRollPayload?.occupied_units
  );
  let occupancy = coerceNumber(
    computedRentRoll?.occupancy ?? rentRollPayload?.occupancy
  );
  if (
    !Number.isFinite(occupancy) &&
    Number.isFinite(rrTotalUnits) &&
    rrTotalUnits > 0 &&
    Number.isFinite(rrOccupiedUnits)
  ) {
    occupancy = rrOccupiedUnits / rrTotalUnits;
  if (!Number.isFinite(occupancy)) {
    occupancy = deriveOccFromRentRollUnits(rentRollPayload);

  let sensitivityCard = "";
  if (Number.isFinite(egi) && Number.isFinite(noi) && Number.isFinite(occupancy)) {
    const classifyMargin = (m) =>
      (Number.isFinite(m) && m <= 0.30)
        ? "Fragile"
        : (Number.isFinite(m) && m > 0.40)
          ? "Stable"
          : "Sensitized";
    const baseMarginR = Number.isFinite(noi) && egi > 0 ? noi / egi : null;
    const expenseUp5Expenses = Number.isFinite(opex) ? opex * 1.05 : null;
    const expenseUp5NOI = Number.isFinite(expenseUp5Expenses) ? egi - expenseUp5Expenses : null;
    const expenseUp5MarginR =
      Number.isFinite(expenseUp5NOI) && egi > 0 ? expenseUp5NOI / egi : null;
    const incomeDown5EGI = egi * 0.95;
    const incomeDown5NOI = incomeDown5EGI - opex;
    const incomeDown5MarginR =
      Number.isFinite(incomeDown5NOI) && incomeDown5EGI > 0 ? incomeDown5NOI / incomeDown5EGI : null;
    const combinedEGI = egi * 0.95;
    const combinedExpenses = Number.isFinite(opex) ? opex * 1.05 : null;
    const combinedNOI = Number.isFinite(combinedExpenses) ? combinedEGI - combinedExpenses : null;
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
            classifyMargin(row.margin)
          )}</td></tr>`
      )
      .join("");
    if (sensitivityRows) {
      const marginDeltaBps =
        Number.isFinite(baseMarginR) && Number.isFinite(marginC)
          ? (baseMarginR - marginC) * 10000
          : null;
      let stressLine = "";
      if (Number.isFinite(marginDeltaBps)) {
        if (marginDeltaBps > 0) {
          stressLine = `Under modest operating stress, NOI margin compresses by ${Math.round(marginDeltaBps)} bps.`;
        } else if (marginDeltaBps < 0) {
          stressLine = `Under modest operating stress, NOI margin expands by ${Math.round(Math.abs(marginDeltaBps))} bps.`;
        } else {
          stressLine = `Under modest operating stress, NOI margin remains unchanged.`;
        }
      }
      sensitivityCard = `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Mini Sensitivity Grid - Operating Stress</p><table><thead><tr><th>Stress Case</th><th>NOI Margin</th><th>Classification</th></tr></thead><tbody>${sensitivityRows}</tbody></table>${
        stressLine ? `<p class="exec-signal-line">${escapeHtml(stressLine)}</p>` : ""
      }${
        Number.isFinite(marginC) && marginC <= 0.3
          ? `<p class="exec-signal-line">Stress testing indicates fragility under modest operating deterioration.</p>`
          : ""
      }</div>`;
    }
  return `<div class="card no-break"><table><thead><tr><th>Indicator</th><th>Value</th></tr></thead><tbody>${rows.join(
    ""
  )}</tbody></table></div>${flagsCard}${sensitivityCard}`;
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

  let totalInPlaceAnnual = coerceNumber(source.total_in_place_annual);
  if (!Number.isFinite(totalInPlaceAnnual)) {
    const inPlaceMonthly = coerceNumber(source.total_in_place_monthly);
    if (Number.isFinite(inPlaceMonthly)) totalInPlaceAnnual = inPlaceMonthly * 12;
  let totalMarketAnnual = coerceNumber(source.total_market_annual);
  if (!Number.isFinite(totalMarketAnnual)) {
    const marketMonthly = coerceNumber(source.total_market_monthly);
    if (Number.isFinite(marketMonthly)) totalMarketAnnual = marketMonthly * 12;

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
  if (
    !Number.isFinite(weightedInPlace) &&
    Number.isFinite(totalInPlaceAnnual) &&
    Number.isFinite(totalUnits) &&
    totalUnits > 0
  ) {
    weightedInPlace = totalInPlaceAnnual / totalUnits / 12;
  if (
    !Number.isFinite(weightedMarket) &&
    Number.isFinite(totalMarketAnnual) &&
    Number.isFinite(totalUnits) &&
    totalUnits > 0
  ) {
    weightedMarket = totalMarketAnnual / totalUnits / 12;

  const metricsRows = [];
  if (Number.isFinite(totalUnits)) {
    metricsRows.push(`<tr><td>Total Units</td><td>${Math.round(totalUnits)}</td></tr>`);
  if (Number.isFinite(occupiedUnits)) {
    metricsRows.push(
      `<tr><td>Occupied Units</td><td>${Math.round(occupiedUnits)}</td></tr>`
    );
  if (Number.isFinite(occupancy)) {
    metricsRows.push(
      `<tr><td>Occupancy</td><td>${(occupancy * 100).toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%</td></tr>`
    );
  if (Number.isFinite(weightedInPlace)) {
    metricsRows.push(
      `<tr><td>Weighted Avg In-Place Rent</td><td>${formatCurrency(
        weightedInPlace
      )}</td></tr>`
    );
  if (Number.isFinite(weightedMarket)) {
    metricsRows.push(
      `<tr><td>Weighted Avg Market Rent</td><td>${formatCurrency(
        weightedMarket
      )}</td></tr>`
    );
  if (
    Number.isFinite(weightedInPlace) &&
    Number.isFinite(weightedMarket) &&
    weightedInPlace > 0
  ) {
    const premiumPct = ((weightedMarket - weightedInPlace) / weightedInPlace) * 100;
    metricsRows.push(
      `<tr><td>Market Rent Premium (Avg)</td><td>${premiumPct.toLocaleString("en-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%</td></tr>`
    );
  if (Number.isFinite(totalInPlaceAnnual)) {
    metricsRows.push(
      `<tr><td>Annual In-Place Rent (Total)</td><td>${formatCurrency(
        totalInPlaceAnnual
      )}</td></tr>`
    );
  if (Number.isFinite(totalMarketAnnual)) {
    metricsRows.push(
      `<tr><td>Annual Market Rent (Total)</td><td>${formatCurrency(
        totalMarketAnnual
      )}</td></tr>`
    );

  const rentBandRows = unitMix
    .map((row) => {
      const units = coerceNumber(row?.count);
      if (!Number.isFinite(units) || units <= 0) return "";
      const inPlace = coerceNumber(row?.current_rent);
      const market = coerceNumber(row?.market_rent);
      const gap = Number.isFinite(inPlace) && Number.isFinite(market) ? market - inPlace : null;
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
  if (Number.isFinite(largestUnitTypeConcentration)) {
    metricsRows.push(
      `<tr><td>Largest Unit Type Concentration</td><td>${formatPercent1(
        largestUnitTypeConcentration
      )}</td></tr>`
    );

  if (metricsRows.length === 0 && !rentBandRows) return "";

  const metricsHtml =
    metricsRows.length > 0
      ? `<table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${metricsRows.join(
          ""
        )}</tbody></table>`
      : "";
  const bandsHtml = rentBandRows
    ? `<p class="subsection-title" style="margin-top:12px;">Rent Bands (In-Place)</p><table><thead><tr><th>Unit Type</th><th>Units</th><th>Avg In-Place</th><th>Avg Market</th><th>Gap ($)</th><th>Gap (%)</th></tr></thead><tbody>${rentBandRows}</tbody></table>`
    : "";

  const marketPremiumRatio =
    Number.isFinite(weightedInPlace) &&
    Number.isFinite(weightedMarket) &&
    weightedInPlace > 0
      ? (weightedMarket - weightedInPlace) / weightedInPlace
      : null;
  const flags = [];
  if (Number.isFinite(occupancy) && occupancy < 0.9) {
    flags.push(`Occupancy is ${formatPercent1(occupancy)} (stabilization flag).`);
  if (Number.isFinite(marketPremiumRatio) && marketPremiumRatio >= 0.1) {
    flags.push(
      `In-place rents trail market by ~${formatPercent1(
        marketPremiumRatio
      )} (document-backed upside).`
    );
  if (Number.isFinite(largestUnitTypeConcentration) && largestUnitTypeConcentration >= 0.6) {
    flags.push(
      `Unit mix concentration: ${largestUnitType || "Largest unit type"} represents ${formatPercent1(
        largestUnitTypeConcentration
      )} of units (concentration flag).`
    );
  const flagsHtml = flags
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const flagsCard = flagsHtml
    ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Rent Roll Flags (Deterministic)</p><ul>${flagsHtml}</ul></div>`
    : "";

  return `<div class="card no-break">${metricsHtml}${bandsHtml}</div>${flagsCard}`;
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
    <th>Target Market Rent</th>
    <th>Planned Lift</th>
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
    <th>Illustrative Sale Price</th>
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
        console.error("Failed to write prompt version artifact:", promptEventErr);
      }
    }

    const { data: reportRow, error: reportCreateError } = await supabase
      .from("reports")
      .insert({
        user_id: effectiveUserId,
        job_id: jobId || null,
        report_type: reportType,
        property_name: property_name || jobPropertyName || null,
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
      console.error("Failed to upload report to storage:", uploadError);
      throw new Error("Failed to upload report to storage");
    }

    // 12. Update DB row with final storage_path
    const { error: reportUpdateError } = await supabase
      .from("reports")
      .update({ storage_path: storagePath })
      .eq("id", reportId);

    if (reportUpdateError) {
      console.error("Failed to update report record with storage path:", reportUpdateError);
      // Do not throw. The PDF is stored and we can still return the signed URL.
    }

    // 13. Generate Signed URL for immediate viewing (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("generated_reports")
      .createSignedUrl(storagePath, 3600);

    if (signedError) {
      console.error("Failed to create signed URL:", signedError);
      throw new Error("Failed to generate access link");
    }

    // 14. Return JSON with the report URL and report_id
    res.status(200).json({
      success: true,
      reportId,
      url: signedData.signedUrl,
    });

  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ error: err?.message || "Failed to generate report" });
  } finally {
}





