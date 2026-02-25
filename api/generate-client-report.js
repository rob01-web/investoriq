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
  const worstDriverTripleText = `${worstNoiShockText} · ${worstCapBpsText} · ${worstRateBpsText}`;

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
      <tr><td>Worst-Case Drivers (NOI shock · Cap expansion · Rate shock)</td><td> - </td><td>${escapeHtml(worstDriverTripleText)}</td></tr>
    </tbody>
  </table>
  <p class="small">Base and worst-case proceeds are constrained by the tighter of LTV and DSCR. Coverage below 1.00x indicates a refinance shortfall without paydown.</p>
</div>`;
  const refiHtml = `<div class="card no-break"><p><strong>Refinance Stability Classification: ${escapeHtml(
    refiTier
  )}</strong></p><p>Base Coverage: ${formatCoverage(
    coverageBase
  )}</p><p>Worst-Case Coverage: ${formatCoverage(
    worstFiniteCoverage
  )}</p><p class="small">${escapeHtml(
    evidence
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
  return html.replace(/[–—]/g, "-").replace(/&(?:ndash|mdash);/g, "-");
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

  const missingLabels = rows
    .filter((row) => !row.present)
    .map((row) => row.label);
  const missingHtml = missingLabels.length
    ? `<ul>${missingLabels
        .map((label) => `<li>${escapeHtml(label)}</li>`)
        .join("")}</ul>`
    : "";

  return `<p>Refinance Stability Classification not produced due to insufficient refinance inputs.</p><table><thead><tr><th>Input</th><th>Status</th><th>Provided Value</th></tr></thead><tbody>${rowsHtml}</tbody></table>${missingHtml}<p class="small">This sufficiency check verifies whether deterministic refinance classification inputs are present in uploaded documents. Missing required inputs prevent refinance stability scoring.</p>`;
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

  const rentRollRows = Array.isArray(computedRentRoll?.unit_mix)
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
    : "<li>None</li>";
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
    ? `<p class="subsection-title" style="margin-top:12px;">Next Best Document Uploads</p><ul>${suggestionHtml}</ul>`
    : "";

  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p><table><thead><tr><th>Dataset</th><th>Fields Present</th><th>Coverage</th><th>Missing</th></tr></thead><tbody><tr><td>T12</td><td>${t12PresentCount}/${t12Checks.length}</td><td>${t12CoveragePct}%</td><td>${escapeHtml(
    t12Missing.join(", ") || "None"
  )}</td></tr><tr><td>Rent Roll</td><td>${rrPresentCount}/${rentRollChecks.length}</td><td>${rrCoveragePct}%</td><td>${escapeHtml(
    rrMissing.join(", ") || "None"
  )}</td></tr></tbody></table><ul>${missingHtml}</ul>${nextBestUploadsHtml}<p class="small">Sections were omitted where minimum source coverage was not met.</p>`;
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
      )} (document-backed upside).`
    );
  }
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
            entry?.amount ?? entry?.value ?? entry?.ttm ?? entry?.total
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
            value?.amount ?? value?.value ?? value?.ttm ?? value?.total ?? value
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
  const expenseDriverRows = (
    expenseRowsFromExpenseLines.length > 0
      ? expenseRowsFromExpenseLines
      : expenseRowsFromBreakdown.length > 0
      ? expenseRowsFromBreakdown
      : expenseRowsFromLineItems
  )
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  let topDriversCard = "";
  if (
    Number.isFinite(opex) &&
    opex > 0 &&
    Array.isArray(expenseDriverRows) &&
    expenseDriverRows.length >= 2
  ) {
    const topDriverRowsHtml = expenseDriverRows
      .map((row) => {
        const share = row.amount / opex;
        return `<tr><td>${escapeHtml(row.label)}</td><td>${formatCurrency(
          row.amount
        )} (${escapeHtml(formatPercent1(share))})</td></tr>`;
      })
      .join("");
    topDriversCard = `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Top 3 Expense Drivers (Share of OpEx)</p><table><thead><tr><th>Line Item</th><th>Amount</th></tr></thead><tbody>${topDriverRowsHtml}</tbody></table></div>`;
  }

  const flags = [];
  const largestExpense = expenseDriverRows[0];
  if (
    largestExpense &&
    Number.isFinite(opex) &&
    opex > 0 &&
    Number.isFinite(largestExpense.amount / opex) &&
    largestExpense.amount / opex >= 0.2
  ) {
    flags.push(
      `Largest operating expense line item is ${largestExpense.label} at ${formatPercent1(
        largestExpense.amount / opex
      )} of OpEx (concentration flag).`
    );
  }
  const expenseRatio =
    Number.isFinite(opex) && Number.isFinite(egi) && egi > 0 ? opex / egi : null;
  if (Number.isFinite(expenseRatio) && expenseRatio > 0.65) {
    flags.push(
      `Expense ratio is ${formatPercent1(expenseRatio)} (high expense load flag).`
    );
  }
  const noiMargin =
    Number.isFinite(noi) && Number.isFinite(egi) && egi > 0 ? noi / egi : null;
  if (Number.isFinite(noiMargin) && noiMargin < 0.35) {
    flags.push(`NOI margin is ${formatPercent1(noiMargin)} (thin margin flag).`);
  }
  const flagsHtml = flags
    .slice(0, 3)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");
  const flagsCard = flagsHtml
    ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">Expense Flags (Deterministic)</p><ul>${flagsHtml}</ul></div>`
    : "";

  return `${metricsCard}${topDriversCard}${flagsCard}`;
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
  if (Number.isFinite(opex) && Number.isFinite(gpr) && gpr > 0) {
    const breakEvenOcc = opex / gpr;
    if (Number.isFinite(breakEvenOcc)) {
      rows.push(
        `<tr><td>Break-even Occupancy</td><td>${formatPercent1(
          breakEvenOcc
        )}</td></tr>`
      );
    }
  }
  if (Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0) {
    const rrVsGprPct = (rrAnnual - gpr) / gpr;
    rows.push(
      `<tr><td>Rent Roll vs T12 GPR Variance</td><td>${formatPercent1(
        rrVsGprPct
      )}</td></tr>`
    );
  }

  if (rows.length === 0) return "";
  const rrVsGprPct =
    Number.isFinite(rrAnnual) && Number.isFinite(gpr) && gpr > 0
      ? (rrAnnual - gpr) / gpr
      : null;
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
        )} vs T12 GPR (reconciliation flag).`
      );
    } else {
      flags.push(
        `Rent roll annualized rent is −${formatPercent1(
          Math.abs(rrVsGprPct)
        )} vs T12 GPR (reconciliation flag).`
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
    .slice()
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3)
    .map((d) => d.label);
  const driverRankHtml = rankedDrivers.length
    ? `<p class="subsection-title">Stability Drivers (Worst -> Best): ${escapeHtml(
        rankedDrivers.join(" | ")
      )}</p>`
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
  }
  if (!Number.isFinite(occupancy)) {
    occupancy = deriveOccFromRentRollUnits(rentRollPayload);
  }

  const sensitivityRows = [];
  if (Number.isFinite(egi) && Number.isFinite(noi) && Number.isFinite(occupancy)) {
    const noiRevenueShock = noi - 0.05 * egi;
    const egiRevenueShock = egi * 0.95;
    if (Number.isFinite(noiRevenueShock) && Number.isFinite(egiRevenueShock) && egiRevenueShock > 0) {
      sensitivityRows.push(
        `<tr><td>EGI -5% (revenue shock)</td><td>${formatCurrency(
          noiRevenueShock
        )}</td><td>${formatPercent1(noiRevenueShock / egiRevenueShock)}</td></tr>`
      );
    }
    if (Number.isFinite(opex)) {
      const noiCostShock = noi - 0.05 * opex;
      if (Number.isFinite(noiCostShock) && egi > 0) {
        sensitivityRows.push(
          `<tr><td>OpEx +5% (cost shock)</td><td>${formatCurrency(
            noiCostShock
          )}</td><td>${formatPercent1(noiCostShock / egi)}</td></tr>`
        );
      }
    }
  }
  const sensitivityCard = sensitivityRows.length
    ? `<div class="card no-break" style="margin-top:12px;"><p class="subsection-title">NOI Sensitivity (Deterministic)</p><table><thead><tr><th>Scenario</th><th>Implied NOI</th><th>NOI Margin (Implied)</th></tr></thead><tbody>${sensitivityRows.join(
        ""
      )}</tbody></table></div>`
    : "";

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
      `<tr><td>Market Rent Premium (Avg)</td><td>${premiumPct.toLocaleString("en-CA", {
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
  }
  if (Number.isFinite(largestUnitTypeConcentration)) {
    metricsRows.push(
      `<tr><td>Largest Unit Type Concentration</td><td>${formatPercent1(
        largestUnitTypeConcentration
      )}</td></tr>`
    );
  }

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
  }
  if (Number.isFinite(marketPremiumRatio) && marketPremiumRatio >= 0.1) {
    flags.push(
      `In-place rents trail market by ~${formatPercent1(
        marketPremiumRatio
      )} (document-backed upside).`
    );
  }
  if (Number.isFinite(largestUnitTypeConcentration) && largestUnitTypeConcentration >= 0.6) {
    flags.push(
      `Unit mix concentration: ${largestUnitType || "Largest unit type"} represents ${formatPercent1(
        largestUnitTypeConcentration
      )} of units (concentration flag).`
    );
  }
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

console.log(
  `[charts] INLINE_CHARTS=${INLINE_CHARTS} CHART_BASE_URL=${CHART_BASE_URL}`
);

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

  console.log("[charts] dealScoreBarChartUrl:", defaults.dealScoreBarChartUrl.slice(0, 80));

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
      // TEMP DEBUG: remove after one verification run
      console.log(
        "[DEBUG] t12Payload keys:",
        t12Payload && typeof t12Payload === "object" ? Object.keys(t12Payload) : null
      );
      console.log("[DEBUG] rentRollPayload.totals:", rentRollPayload?.totals || null);
      console.log(
        "[DEBUG] rentRollPayload.units[0]:",
        Array.isArray(rentRollPayload?.units) && rentRollPayload.units.length > 0
          ? rentRollPayload.units[0]
          : null
      );
      console.log("[DEBUG] units length:",
        rentRollPayload?.units?.length ?? "no units array"
      );
      console.log("[DEBUG] units[0]:",
        JSON.stringify(rentRollPayload?.units?.[0] ?? null)
      );

      const { data: sourceRows, error: sourceErr } = await supabase
        .from("analysis_job_files")
        .select("original_filename, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (!sourceErr && sourceRows && sourceRows.length > 0) {
        documentSources = sourceRows;
        const items = sourceRows
          .map((row) => {
            const name = escapeHtml(row.original_filename || "Unnamed file");
            const createdAt = row.created_at
              ? new Date(row.created_at).toLocaleString()
              : "Unknown date";
            return `<li>${name}  -  ${escapeHtml(createdAt)}</li>`;
          })
          .join("");
        documentSourcesHtml = `<ul>${items}</ul>`;
      }
    }

    let computedRentRoll = null;
    const rentRollUnits = Array.isArray(rentRollPayload?.units) ? rentRollPayload.units : null;
    if (rentRollUnits && rentRollUnits.length > 0) {
      const totalUnits = rentRollUnits.length;
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
        if (statusText.includes("occup")) {
          occupiedUnits += 1;
        } else if (statusText.includes("vacant")) {
          vacantUnits += 1;
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

        if (Number.isFinite(beds)) {
          const bedKey = String(beds);
          unitMixMap[bedKey] = (unitMixMap[bedKey] || 0) + 1;
          if (Number.isFinite(inPlaceRent)) {
            if (!rentByBeds[bedKey]) {
              rentByBeds[bedKey] = [];
            }
            rentByBeds[bedKey].push(inPlaceRent);
          }
          if (Number.isFinite(marketRent)) {
            if (!marketRentByBeds[bedKey]) {
              marketRentByBeds[bedKey] = [];
            }
            marketRentByBeds[bedKey].push(marketRent);
          }
          if (Number.isFinite(sqft)) {
            if (!sqftByBeds[bedKey]) {
              sqftByBeds[bedKey] = [];
            }
            sqftByBeds[bedKey].push(sqft);
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
            unit_type: bedKey === "0" ? "Studio" : `${bedKey} Bed`,
            count,
            current_rent: Number.isFinite(avgInPlaceRent) ? avgInPlaceRent : null,
            market_rent: Number.isFinite(avgMarketRent) ? avgMarketRent : null,
            avg_sqft: Number.isFinite(avgSqft) ? Math.round(avgSqft) : null,
          };
        });

      computedRentRoll = {
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        vacant_units: vacantUnits,
        occupancy,
        avg_in_place_rent: avgInPlaceRent ?? DATA_NOT_AVAILABLE,
        avg_market_rent: avgMarketRent ?? DATA_NOT_AVAILABLE,
        total_in_place_monthly: totalInPlaceMonthly ?? DATA_NOT_AVAILABLE,
        total_market_monthly: totalMarketMonthly ?? DATA_NOT_AVAILABLE,
        total_in_place_annual: totalInPlaceAnnual ?? DATA_NOT_AVAILABLE,
        total_market_annual: totalMarketAnnual ?? DATA_NOT_AVAILABLE,
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
      sanitizeDisplayText(propertyName)?.trim() || "Property";
    const displayPropertyAddress = sanitizeDisplayText(propertyAddress) || "";
    const displayPropertyTitle = sanitizeDisplayText(propertyTitle) || "";
    const propertyNameDisplay = displayPropertyName
      .replace(/\s*\((clean|messy)\s*test\d+\)\s*/gi, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_NAME}}", propertyNameDisplay);
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_ADDRESS}}", displayPropertyAddress);
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_ADDRESS_LINE}}", displayPropertyAddress);
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_TITLE}}", displayPropertyTitle);
    finalHtml = replaceAll(finalHtml, "{{CITY}}", "");
    finalHtml = replaceAll(finalHtml, "{{PROVINCE}}", "");
    finalHtml = replaceAll(
      finalHtml,
      "{{PROPERTY_SUBMARKET}}",
      ""
    );
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
      "InvestorIQ estimates are derived from uploaded documents and standardized underwriting frameworks. When required inputs are missing, those estimates are omitted rather than inferred."
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{METHODOLOGY_NOTES}}",
      "Metrics and tables reflect document-backed inputs and deterministic calculations. No manual adjustments or external assumptions are introduced when source data is incomplete."
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{LIMITATIONS_NOTES}}",
      "This report is limited to the documents provided and the fields that could be verified. Missing values are disclosed and excluded from analysis."
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{ASSUMPTIONS_DISCLOSURE}}",
      allowAssumptions
        ? "Assumptions in this report are permitted only when anchored to uploaded documents. InvestorIQ does not invent missing data or fabricate market inputs."
        : "This report contains no assumptions. Outputs are derived strictly from uploaded documents. Missing inputs are not inferred."
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
    } else {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S2_INCOME_FORENSICS");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S3_EXPENSE_STRUCTURE");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S4_NOI_STABILITY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S5_RENT_ROLL_DISTRIBUTION");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
      finalHtml = stripMarkedSection(finalHtml, "SECTION_S7_DATA_COVERAGE_GAPS");
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
    finalHtml = replaceAll(
      finalHtml,
      "{{SCENARIO_TABLE}}",
      buildScenarioTable(tables.scenarios || [])
    );
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
    finalHtml = replaceAll(
      finalHtml,
      "{{DEAL_SCORE_TABLE}}",
      buildDealScoreTable(tables.dealScore || [], tables.totalDealScore)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{COMPARABLES_TABLE}}",
      buildCompsTable(tables.comps || [])
    );

    // 6. Inject charts (URLs  -  can be overridden by caller)
    finalHtml = applyChartPlaceholders(finalHtml, charts);

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
    const rrTotalUnits =
      coerceNumber(computedRentRoll?.total_units) ??
      coerceNumber(rentRollPayload?.totals?.total_units);
    const rrOccupiedUnits =
      coerceNumber(computedRentRoll?.occupied_units) ??
      coerceNumber(rentRollPayload?.totals?.occupied_units);
    const execOccFromRR =
      Number.isFinite(rrTotalUnits) && rrTotalUnits > 0 && Number.isFinite(rrOccupiedUnits)
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
        : Number.isFinite(execOccFromRR)
        ? execOccFromRR
        : rrOccFromRows;
    if (!Number.isFinite(execOccupancy)) {
      const rrUnits = rentRollPayload?.units;
      if (Array.isArray(rrUnits) && rrUnits.length > 0) {
        const totalUnits = rrUnits.length;
        const occupiedUnits = rrUnits.filter((u) => {
          const status = String(u.status || u.unit_status || "").toLowerCase();
          if (status) return status.includes("occupied");
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
        rrAnnualInPlaceFromRows ??
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
      Number.isFinite(execGpr) &&
      execGpr > 0
        ? execOpex / execGpr
        : null;
    const breakEvenOccRatio = breakEvenOccupancy;
    const breakEvenOcc = breakEvenOccupancy;
    const toPctValue = (value) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return null;
      return n > 1.5 ? n : n * 100;
    };
    const breakEvenOccPct = toPctValue(breakEvenOcc);
    const operatingCushionPct =
      Number.isFinite(breakEvenOccPct) ? 100 - breakEvenOccPct : null;
    const marketRentPremiumPct =
      Number.isFinite(coerceNumber(computedRentRoll?.avg_market_rent)) &&
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
    const expenseRatioBand = Number.isFinite(expenseRatio)
      ? expenseRatio >= 0.65
        ? "Fragile"
        : expenseRatio >= 0.55
        ? "Sensitized"
        : "Stable"
      : null;
    const noiMarginBand = Number.isFinite(noiMargin)
      ? noiMargin <= 0.3
        ? "Fragile"
        : noiMargin <= 0.45
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

    const execOpexRatioText = Number.isFinite(expenseRatio)
      ? `${formatPercent1(expenseRatio)}${expenseRatioBand ? ` (${expenseRatioBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    const execNoiMarginText = Number.isFinite(noiMargin)
      ? `${formatPercent1(noiMargin)}${noiMarginBand ? ` (${noiMarginBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    const execBreakEvenText = Number.isFinite(breakEvenOccRatio)
      ? `${formatPercent1(breakEvenOccRatio)}${breakEvenBand ? ` (${breakEvenBand})` : ""}`
      : DATA_NOT_AVAILABLE;
    let execRefiLine = "";
    if (effectiveReportMode === "v1_core") {
      const refiTier = buildRefiStabilityModel({
        financials: body?.financials,
        t12Payload,
        formatValue: formatCurrency,
      })?.tier;
      const validRefiTiers = new Set([
        "Stable",
        "Sensitized",
        "Fragile",
        "Refinance Failure Under Stress",
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
      `Occupancy: ${execOccupancyText} · Annual In-Place Rent: ${execAnnualInPlaceText} · OpEx Ratio: ${execOpexRatioText}`
    )}</p>`;
    const execNarrativeHtml = effectiveReportMode === "screening_v1" ? "" : getNarrativeHtml("execSummary");
    const execScreeningLines = [];
    let screeningClass = null;
    let screeningExplanation = null;
    const driverCandidates = [];
    if (Number.isFinite(expenseRatio)) {
      const severity =
        expenseRatio > 0.65
          ? expenseRatio - 0.65
          : expenseRatio > 0.55
          ? expenseRatio - 0.55
          : 0;
      const trigger =
        expenseRatio > 0.65
          ? ">= 65.0% fragile threshold breached"
          : expenseRatio > 0.55
          ? ">= 55.0% sensitized threshold breached"
          : "< 55.0% within stable range";
      driverCandidates.push({
        label: "Expense Ratio",
        value: formatPercent1(expenseRatio),
        trigger,
        severity,
      });
    }
    if (Number.isFinite(noiMargin)) {
      const severity =
        noiMargin < 0.35
          ? 0.35 - noiMargin
          : noiMargin < 0.45
          ? 0.45 - noiMargin
          : 0;
      const trigger =
        noiMargin < 0.35
          ? "<= 35.0% fragile threshold breached"
          : noiMargin < 0.45
          ? "<= 45.0% sensitized threshold breached"
          : ">= 45.0% within stable range";
      driverCandidates.push({
        label: "NOI Margin",
        value: formatPercent1(noiMargin),
        trigger,
        severity,
      });
    }
    if (Number.isFinite(breakEvenOccupancy)) {
      const severity =
        breakEvenOccupancy > 0.85
          ? breakEvenOccupancy - 0.85
          : breakEvenOccupancy > 0.75
          ? breakEvenOccupancy - 0.75
          : 0;
      const trigger =
        breakEvenOccupancy > 0.85
          ? ">= 85.0% fragile threshold breached"
          : breakEvenOccupancy > 0.75
          ? ">= 75.0% sensitized threshold breached"
          : "< 75.0% within stable range";
      driverCandidates.push({
        label: "Break-even Occupancy",
        value: formatPercent1(breakEvenOccupancy),
        trigger,
        severity,
      });
    }
    const rankedDrivers = driverCandidates
      .slice()
      .sort((a, b) => b.severity - a.severity);
    const driver1 = rankedDrivers[0] || null;
    const driver2 = rankedDrivers[1] || null;
    const driver3 = rankedDrivers[2] || null;
    const primaryPressurePoint =
      driver1?.label || DATA_NOT_AVAILABLE;
    const screeningHasSufficientData = hasMinimumScreeningCoverage(t12Payload);
    if (effectiveReportMode === "screening_v1") {
      if (!screeningHasSufficientData) {
        screeningClass = "Insufficient Data";
        screeningExplanation =
          "Insufficient operating data to assess acquisition viability.";
      } else if (
        (Number.isFinite(expenseRatio) && expenseRatio > 0.65) ||
        (Number.isFinite(noiMargin) && noiMargin < 0.35) ||
        (Number.isFinite(breakEvenOccupancy) && breakEvenOccupancy > 0.85)
      ) {
        screeningClass = "Fragile";
        screeningExplanation =
          "Operating margin is thin and vulnerable to modest income or expense shocks.";
      } else if (
        (Number.isFinite(expenseRatio) && expenseRatio > 0.55) ||
        (Number.isFinite(noiMargin) && noiMargin < 0.45) ||
        (Number.isFinite(breakEvenOccupancy) && breakEvenOccupancy > 0.75)
      ) {
        screeningClass = "Sensitized";
        screeningExplanation =
          "Cash flow performance is viable but sensitive to revenue disruption or expense inflation.";
      } else {
        screeningClass = "Stable";
        screeningExplanation =
          "Operating profile demonstrates margin resilience under current income structure.";
      }
      execScreeningLines.push(
        `<p class="exec-classification">${escapeHtml(`Operating Profile: ${screeningClass}`)}</p>`
      );
      execScreeningLines.push(
        `<p class="exec-classification-note">${escapeHtml(screeningExplanation)}</p>`
      );
    }
    const classificationDrivers = [];
    if (Number.isFinite(expenseRatio) && expenseRatio >= 0.55) {
      classificationDrivers.push(
        `elevated Expense Ratio (${formatPercent1(expenseRatio)})`
      );
    }
    if (Number.isFinite(noiMargin) && noiMargin <= 0.45) {
      classificationDrivers.push(
        `compressed NOI Margin (${formatPercent1(noiMargin)})`
      );
    }
    if (Number.isFinite(breakEvenOccRatio) && breakEvenOccRatio >= 0.75) {
      classificationDrivers.push(
        `high Break-even Occupancy (${formatPercent1(breakEvenOccRatio)})`
      );
    }
    const whyLine =
      classificationDrivers.length > 0
        ? `Classification is driven primarily by ${classificationDrivers.join(" and ")}.`
        : "";
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
        `<p class="exec-kpis">${escapeHtml(rentParts.join(" · "))}</p>`
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
    if (Number.isFinite(noiMargin)) {
      execScreeningLines.push(
        `<p class="exec-kpis">${escapeHtml(
          `NOI Margin: ${formatPercent1(noiMargin)}`
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
        )} (document-backed upside).`
      );
    }
    if (Number.isFinite(execOccupancy) && execOccupancy >= 0.95) {
      upsideBullets.push(
        `Occupancy is ${formatPercent1(execOccupancy)}, supporting cash flow stability.`
      );
    }
    if (Number.isFinite(operatingCushionPct) && operatingCushionPct >= 25) {
      upsideBullets.push(
        `Operating cushion is approximately ${formatPercent1(
          operatingCushionPct
        )} above break-even occupancy.`
      );
    }
    const riskBullets = [];
    if (Number.isFinite(expenseRatio) && expenseRatio > 0.55) {
      riskBullets.push(
        `Expense ratio is ${formatPercent1(
          expenseRatio
        )}, pressuring NOI margin.`
      );
    }
    if (Number.isFinite(noiMargin) && noiMargin < 0.45) {
      riskBullets.push(
        `NOI margin is ${formatPercent1(
          noiMargin
        )}, leaving limited buffer for shocks.`
      );
    }
    if (Number.isFinite(breakEvenOccupancy) && breakEvenOccupancy > 0.75) {
      riskBullets.push(
        `Break-even occupancy is ${formatPercent1(
          breakEvenOccupancy
        )}, increasing sensitivity to vacancy and income disruption.`
      );
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
    let execAnnualInPlaceTokenValue = null;
    if (
      Number.isFinite(weightedAvgInPlaceRent) &&
      Number.isFinite(execTotalUnits) &&
      execTotalUnits > 0
    ) {
      execAnnualInPlaceTokenValue = weightedAvgInPlaceRent * execTotalUnits * 12;
    } else if (rrRows.length > 0) {
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
      screeningClass || ""
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{PRIMARY_PRESSURE_POINT}}",
      primaryPressurePoint
    );
    if (whyLine) {
      finalHtml = finalHtml.replace(
        `<p class="exec-signal-line">Primary Pressure Point: ${primaryPressurePoint}</p>`,
        `<p class="exec-signal-line">Primary Pressure Point: ${primaryPressurePoint}</p><p class="exec-signal-line">${escapeHtml(
          whyLine
        )}</p>`
      );
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

    const unitMix = computedRentRoll?.unit_mix || rentRollPayload?.unit_mix;
    const unitMixRows = buildUnitMixRows(
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

    const t12IncomeRows = buildT12IncomeRows(t12Payload, formatCurrency);
    const t12ExpenseRows = buildT12ExpenseRows(t12Payload, formatCurrency);
    const t12EgiValue = coerceNumber(t12Payload?.effective_gross_income);
    const t12TotalExpensesValue = coerceNumber(t12Payload?.total_operating_expenses);
    const t12NoiValue = coerceNumber(t12Payload?.net_operating_income);
    const t12ExpenseRatioValue =
      Number.isFinite(t12EgiValue) &&
      Number.isFinite(t12TotalExpensesValue) &&
      t12EgiValue > 0
        ? formatPercent1(t12TotalExpensesValue / t12EgiValue)
        : DATA_NOT_AVAILABLE;
    finalHtml = replaceAll(finalHtml, "{{T12_INCOME_ROWS}}", t12IncomeRows || "");
    finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_ROWS}}", t12ExpenseRows || "");
    if (!String(t12IncomeRows || "").trim()) {
      finalHtml = replaceAll(finalHtml, "{{T12_INCOME_ROWS}}", "");
      finalHtml = stripMarkedSection(finalHtml, "T12_INCOME_TABLE");
      finalHtml = stripT12DetailSubsection(finalHtml, "Income Reconstruction (TTM)");
    }
    if (!String(t12ExpenseRows || "").trim()) {
      finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_ROWS}}", "");
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
    const screeningIncomeForensicsHtml = buildScreeningIncomeForensicsHtml({
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
      if ((screeningRentRollHtml || "").trim().length === 0) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S5_RENT_ROLL_DISTRIBUTION");
      }
    }
    const screeningRefiSufficiencyHtml = buildScreeningRefiSufficiencyTable({
      financials,
      t12Payload,
    });
    const screeningCoverageHtml = buildScreeningDataCoverageSummary({
      t12Payload,
      computedRentRoll,
      rentRollPayload,
      financials,
    });
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_REFI_DATA_SUFFICIENCY_BLOCK}}",
      screeningRefiSufficiencyHtml
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{SCREENING_DATA_COVERAGE_BLOCK}}",
      screeningCoverageHtml
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
    const hasExplicitRenovationInput = Boolean(
      (renovationPayload && typeof renovationPayload === "object") ||
        (financials && typeof financials === "object" && (
          Array.isArray(financials.renovation_budget_rows) ||
          Array.isArray(financials.renovation_execution_rows) ||
          typeof financials.renovation_budget_note === "string" ||
          typeof financials.renovation_execution_note === "string" ||
          typeof financials.renovation_interpretation === "string"
        ))
    );
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
    if (effectiveReportMode !== "v1_core") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
      finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", "");
    } else {
      const refiResult = buildRefiStabilityModel({
        financials: body?.financials,
        t12Payload,
        formatValue: formatCurrency,
      });
      const validRefiTiers = new Set([
        "Stable",
        "Sensitized",
        "Fragile",
        "Refinance Failure Under Stress",
      ]);
      const refiHtml = String(refiResult?.html || "").trim();
      const canRenderRefi =
        validRefiTiers.has(refiResult?.tier) && refiHtml.length > 0;
      if (canRenderRefi) {
        finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", refiHtml);
      } else {
        const refiSufficiencyHtml = buildScreeningRefiSufficiencyTable({
          financials: body?.financials || financials,
          t12Payload,
        });
        finalHtml = replaceAll(
          finalHtml,
          "{{REFI_STABILITY_BLOCK}}",
          refiSufficiencyHtml || ""
        );
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
    const showRenovationSection = Boolean(
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
      documentSources.some((s) => s?.status || s?.parse_status || s?.doc_type);
    if (!hasDocSources || effectiveReportMode === "screening_v1") {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_DOC_SOURCES");
    }

    const showExec =
      effectiveReportMode === "screening_v1"
        ? true
        : hasMeaningfulNarrative(getNarrativeHtml("execSummary"));
    if (!showExec) {
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
      (Array.isArray(rentRollUnits) && rentRollUnits.length > 0) ||
      (Array.isArray(rentRollPayload?.unit_mix) && rentRollPayload.unit_mix.length > 0);
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
      Number.isFinite(coerceNumber(computedRentRoll?.avg_market_rent)) &&
      Number.isFinite(coerceNumber(computedRentRoll?.avg_in_place_rent)) &&
      coerceNumber(computedRentRoll?.avg_in_place_rent) > 0
        ? (coerceNumber(computedRentRoll?.avg_market_rent) -
            coerceNumber(computedRentRoll?.avg_in_place_rent)) /
          coerceNumber(computedRentRoll?.avg_in_place_rent)
        : null;
    const hasTargetRentInputs =
      (Array.isArray(rentRollUnits) &&
        rentRollUnits.some((unit) => Number.isFinite(coerceNumber(unit?.market_rent)))) ||
      (Array.isArray(computedRentRoll?.unit_mix) &&
        computedRentRoll.unit_mix.some((row) => Number.isFinite(coerceNumber(row?.market_rent)))) ||
      (Array.isArray(rentRollPayload?.unit_mix) &&
        rentRollPayload.unit_mix.some((row) => Number.isFinite(Number(row?.market_rent))));
    const hasPositiveLiftSignal =
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
        ));
    const showSection2 = hasRentRollData && hasTargetRentInputs && hasPositiveLiftSignal;
    if (!showSection2) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_UNIT_VALUE_ADD");
    }

    const showSection2Roi =
      Array.isArray(tables.renovationSummary) && tables.renovationSummary.length > 0;
    if (!showSection2Roi) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_2_RENOVATION_ROI");
    }

    const showSection3 =
      hasRentRollData &&
      hasT12Data &&
      Array.isArray(tables.scenarios) &&
      tables.scenarios.length > 0;
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

    const showSection7 = hasMeaningfulNarrative(getNarrativeHtml("debtStructure"));
    if (!showSection7) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT");
    }

    const showSection7Tables =
      Array.isArray(tables.debtStructure) && tables.debtStructure.length > 0;
    if (!showSection7Tables) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_DEBT_TABLES");
    }

    const showSection8 =
      (Array.isArray(tables.dealScore) && tables.dealScore.length > 0) ||
      hasMeaningfulNarrative(getNarrativeHtml("dealScoreSummary")) ||
      hasMeaningfulNarrative(getNarrativeHtml("dealScoreInterpretation"));
    if (!showSection8) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_8_DEAL_SCORE");
    }

    const showSection9 =
      Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0;
    if (!showSection9) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_9_DCF");
    }

    const showSection9Table =
      Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0;
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
      console.warn("⚠️ Missing narrative sections:", missingKeys.join(", "));
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
      console.warn("?s??,? Sentence Integrity Warnings:");
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

const docraptorMode =
  process.env.DOCRAPTOR_MODE === "production" ? "production" : "test";
const allowProductionPdf = process.env.ALLOW_PRODUCTION_PDF === "true";
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
  pdfResponse = await axios.post(
    "https://docraptor.com/docs",
    {
      test: docraptorMode !== "production",
      document_content: htmlString,
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
  console.error("❌ DOC RAPTOR ERROR STATUS:", err.response?.status);
  console.error("❌ DOC RAPTOR ERROR BODY ↓↓↓");
  console.error(err.response?.data?.toString());
  throw err;
}

        // 10. Create DB row first so we have a deterministic report_id for storage
    const { data: reportRow, error: reportCreateError } = await supabase
      .from("reports")
      .insert({
  user_id: effectiveUserId,
            property_name: property_name || "Property",
  storage_path: "pending",
})
      .select("id")
      .single();

    if (reportCreateError || !reportRow?.id) {
      console.error("❌ Report DB Create Error:", reportCreateError);
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
      console.error("❌ Storage Upload Error:", uploadError);
      throw new Error("Failed to upload report to storage");
    }

    // 12. Update DB row with final storage_path
    const { error: reportUpdateError } = await supabase
      .from("reports")
      .update({ storage_path: storagePath })
      .eq("id", reportId);

    if (reportUpdateError) {
      console.error("❌ Report DB Update Error:", reportUpdateError);
      // Do not throw. The PDF is stored and we can still return the signed URL.
    }

    // 13. Generate Signed URL for immediate viewing (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from("generated_reports")
      .createSignedUrl(storagePath, 3600);

    if (signedError) {
      console.error("❌ Signed URL Error:", signedError);
      throw new Error("Failed to generate access link");
    }

    // 14. Return JSON with the report URL and report_id
    res.status(200).json({
      success: true,
      reportId,
      url: signedData.signedUrl,
    });

  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({ error: err?.message || "Failed to generate report" });
  } finally {
  }
}





