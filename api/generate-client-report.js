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
const IS_SAMPLE_REPORT = false;

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
    }) + " percent"
  );
}

function formatMultiple(value, decimals = 2) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " x"
  );
}

function formatYears(value, decimals = 1) {
  if (isNil(value) || isNaN(Number(value))) return "";
  const num = Number(value);
  return (
    num.toLocaleString("en-CA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + " years"
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
    return { tier: null, evidence: DATA_NOT_AVAILABLE, html: DATA_NOT_AVAILABLE };
  }

  const baseMc = computeMortgageConstant(interestRate, amortYears);
  const baseCap = capRateBase;
  if (!Number.isFinite(baseMc) || !Number.isFinite(baseCap) || baseCap <= 0) {
    return { tier: null, evidence: DATA_NOT_AVAILABLE, html: DATA_NOT_AVAILABLE };
  }
  const baseValue = noiBase / baseCap;
  const baseLoanLtv = baseValue * ltvMax;
  const baseLoanDscr = noiBase / (dscrMin * baseMc);
  const baseMaxProceeds = Math.min(baseLoanLtv, baseLoanDscr);
  const coverageBase = baseMaxProceeds / debtBalance;
  if (!Number.isFinite(coverageBase)) {
    return { tier: null, evidence: DATA_NOT_AVAILABLE, html: DATA_NOT_AVAILABLE };
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
    Number.isFinite(value)
      ? `${(value * 100).toLocaleString("en-CA", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`
      : DATA_NOT_AVAILABLE;
  const evidence = `base_coverage=${formatCoverage(
    coverageBase
  )}; worst_coverage=${formatCoverage(
    worstFiniteCoverage
  )}; thresholds: fail<90.0%, fragile<100.0%, sensitized<110.0%`;
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
  const refiHtml = `<div class="card no-break"><p><strong>Refinance Stability Classification: ${escapeHtml(
    refiTier
  )}</strong></p><p>Base Coverage: ${formatCoverage(
    coverageBase
  )}</p><p>Worst-Case Coverage: ${formatCoverage(
    worstFiniteCoverage
  )}</p><p class="small">${escapeHtml(
    evidence
  )}</p><table><thead><tr><th>NOI Shock</th><th>Cap Expansion (bps)</th><th>Rate Shock (bps)</th><th>Max Proceeds</th><th>Coverage</th></tr></thead><tbody>${worstRows}</tbody></table></div>`;

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
  const candidateCollections = [];
  const pushCandidate = (value) => {
    if (Array.isArray(value) || (value && typeof value === "object")) {
      candidateCollections.push(value);
    }
  };
  Object.entries(t12Payload).forEach(([key, value]) => {
    if (/(income|revenue)/i.test(key)) pushCandidate(value);
  });
  if (t12Payload.statement && typeof t12Payload.statement === "object") {
    Object.entries(t12Payload.statement).forEach(([key, value]) => {
      if (/(income|revenue)/i.test(key)) pushCandidate(value);
    });
  }

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

  for (const collection of candidateCollections) {
    if (Array.isArray(collection)) {
      collection.forEach((entry) => {
        if (entry && typeof entry === "object") {
          const label =
            entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "";
          const amount =
            entry.amount ?? entry.value ?? entry.ttm ?? entry.total ?? null;
          addRow(label, amount);
        }
      });
      continue;
    }
    Object.entries(collection).forEach(([key, value]) => {
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

  return rows.join("");
}

function buildT12ExpenseRows(t12Payload, formatValue) {
  if (!t12Payload || typeof t12Payload !== "object") return "";
  const candidateCollections = [];
  const pushCandidate = (value) => {
    if (Array.isArray(value) || (value && typeof value === "object")) {
      candidateCollections.push(value);
    }
  };
  Object.entries(t12Payload).forEach(([key, value]) => {
    if (/(expense|operating_expense|operating_cost)/i.test(key)) pushCandidate(value);
  });
  if (t12Payload.statement && typeof t12Payload.statement === "object") {
    Object.entries(t12Payload.statement).forEach(([key, value]) => {
      if (/(expense|operating_expense|operating_cost)/i.test(key)) pushCandidate(value);
    });
  }

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

  for (const collection of candidateCollections) {
    if (Array.isArray(collection)) {
      collection.forEach((entry) => {
        if (entry && typeof entry === "object") {
          const label =
            entry.line_item ?? entry.label ?? entry.name ?? entry.item ?? "";
          const amount =
            entry.amount ?? entry.value ?? entry.ttm ?? entry.total ?? null;
          addRow(label, amount);
        }
      });
      continue;
    }
    Object.entries(collection).forEach(([key, value]) => {
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

  const isPresentScalar = (value) => Number.isFinite(value) && value > 0;
  const isPresentArray = (value) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => Number.isFinite(coerceNumber(entry)));
  const formatScalar = (value) =>
    Number.isFinite(value) ? escapeHtml(String(value)) : DATA_NOT_AVAILABLE;
  const formatArray = (value) =>
    Array.isArray(value) && value.length > 0
      ? escapeHtml(value.map((entry) => String(entry)).join(", "))
      : DATA_NOT_AVAILABLE;

  const rows = [
    {
      label: "NOI (base)",
      present: isPresentScalar(noiValue),
      value: formatScalar(noiValue),
    },
    {
      label: "refi_debt_balance",
      present: isPresentScalar(coerceNumber(f.refi_debt_balance)),
      value: formatScalar(coerceNumber(f.refi_debt_balance)),
    },
    {
      label: "refi_ltv_max",
      present: isPresentScalar(coerceNumber(f.refi_ltv_max)),
      value: formatScalar(coerceNumber(f.refi_ltv_max)),
    },
    {
      label: "refi_dscr_min",
      present: isPresentScalar(coerceNumber(f.refi_dscr_min)),
      value: formatScalar(coerceNumber(f.refi_dscr_min)),
    },
    {
      label: "refi_interest_rate",
      present: isPresentScalar(coerceNumber(f.refi_interest_rate)),
      value: formatScalar(coerceNumber(f.refi_interest_rate)),
    },
    {
      label: "refi_amort_years",
      present: isPresentScalar(coerceNumber(f.refi_amort_years)),
      value: formatScalar(coerceNumber(f.refi_amort_years)),
    },
    {
      label: "refi_cap_rate_base",
      present: isPresentScalar(coerceNumber(f.refi_cap_rate_base)),
      value: formatScalar(coerceNumber(f.refi_cap_rate_base)),
    },
    {
      label: "stress_noi_shocks",
      present: isPresentArray(f.stress_noi_shocks),
      value: formatArray(f.stress_noi_shocks),
    },
    {
      label: "stress_cap_rate_bps",
      present: isPresentArray(f.stress_cap_rate_bps),
      value: formatArray(f.stress_cap_rate_bps),
    },
    {
      label: "stress_rate_bps",
      present: isPresentArray(f.stress_rate_bps),
      value: formatArray(f.stress_rate_bps),
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

  return `<table><thead><tr><th>Input</th><th>Status</th><th>Observed Value</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="small">This sufficiency check verifies whether deterministic refinance classification inputs are present in uploaded documents. Missing required inputs prevent refinance stability scoring.</p>`;
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
  const occupancyPresent = Number.isFinite(
    coerceNumber(computedRentRoll?.occupancy ?? rentRollPayload?.occupancy)
  );
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
    { label: "occupancy", present: occupancyPresent },
    { label: "in_place_rent", present: inPlacePresent },
    { label: "market_rent", present: marketPresent },
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

  return `<p>Coverage is measured deterministically from uploaded T12 and rent roll inputs only.</p><table><thead><tr><th>Dataset</th><th>Fields Present</th><th>Coverage</th><th>Missing</th></tr></thead><tbody><tr><td>T12</td><td>${t12PresentCount}/${t12Checks.length}</td><td>${t12CoveragePct}%</td><td>${escapeHtml(
    t12Missing.join(", ") || "None"
  )}</td></tr><tr><td>Rent Roll</td><td>${rrPresentCount}/${rentRollChecks.length}</td><td>${rrCoveragePct}%</td><td>${escapeHtml(
    rrMissing.join(", ") || "None"
  )}</td></tr></tbody></table><ul>${missingHtml}</ul><p class="small">Sections were omitted where minimum source coverage was not met.</p>`;
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
    <th>Score (1–10)</th>
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
        ? formatPercent(row.weight, 0) // already in 0–1 form ideally
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
    const { userId: bodyUserId, property_name } = body;
    const jobId = body?.job_id || body?.jobId;
    effectiveUserId = bodyUserId || null;
    const allowedReportTypes = ["screening", "underwriting", "ic"];
    let jobReportType = null;
    let jobUserId = null;
    if (jobId) {
      const { data: jobRow } = await supabase
        .from("analysis_jobs")
        .select("report_type, user_id")
        .eq("id", jobId)
        .maybeSingle();
      jobReportType = jobRow?.report_type || null;
      jobUserId = jobRow?.user_id || null;
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

    const property = {
  name: property_name || "Unknown Property",
  city: "",
  province: "",
  submarket: "",
};

    // Optional financials payload; falls back to sample values
    const financials = body.financials || {};

    const getSection = (key) => sections[key] || "";
    const getNarrativeHtml = (key) => {
      const html = sections?.[key] || "";
      return typeof html === "string" ? html : "";
    };

    let documentSourcesHtml = "";
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

      const { data: sourceRows, error: sourceErr } = await supabase
        .from("analysis_job_files")
        .select("original_filename, created_at")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (!sourceErr && sourceRows && sourceRows.length > 0) {
        const items = sourceRows
          .map((row) => {
            const name = escapeHtml(row.original_filename || "Unnamed file");
            const createdAt = row.created_at
              ? new Date(row.created_at).toLocaleString()
              : "Unknown date";
            return `<li>${name} &mdash; ${escapeHtml(createdAt)}</li>`;
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
    finalHtml = replaceAll(finalHtml, "{{PROPERTY_NAME}}", property.name);
    finalHtml = replaceAll(finalHtml, "{{CITY}}", property.city);
    finalHtml = replaceAll(finalHtml, "{{PROVINCE}}", property.province);
    finalHtml = replaceAll(
      finalHtml,
      "{{PROPERTY_SUBMARKET}}",
      property.submarket
    );

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

    // 6. Inject charts (URLs – can be overridden by caller)
    finalHtml = applyChartPlaceholders(finalHtml, charts);

    // 7. Inject ALL narrative sections (12)
    finalHtml = finalHtml.replace("{{EXEC_SUMMARY}}", getNarrativeHtml("execSummary"));
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

    const unitMixRows = buildUnitMixRows(
      computedRentRoll?.unit_mix || rentRollPayload?.unit_mix,
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
    finalHtml = replaceAll(finalHtml, "{{UNIT_MIX_ROWS}}", unitMixRows || "");
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
        ? `${((t12TotalExpensesValue / t12EgiValue) * 100).toLocaleString("en-CA", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}%`
        : DATA_NOT_AVAILABLE;
    finalHtml = replaceAll(finalHtml, "{{T12_INCOME_ROWS}}", t12IncomeRows || "");
    finalHtml = replaceAll(finalHtml, "{{T12_EXPENSE_ROWS}}", t12ExpenseRows || "");
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
    finalHtml = replaceAll(finalHtml, "{{SCREENING_INCOME_FORENSICS_BLOCK}}", "");
    finalHtml = replaceAll(finalHtml, "{{SCREENING_EXPENSE_STRUCTURE_BLOCK}}", "");
    finalHtml = replaceAll(finalHtml, "{{SCREENING_NOI_STABILITY_BLOCK}}", "");
    finalHtml = replaceAll(finalHtml, "{{SCREENING_RENT_ROLL_BLOCK}}", "");
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
    const rrUnitsValue = coerceNumber(
      computedRentRoll?.total_units ?? rentRollPayload?.total_units
    );
    const screeningUnits = Array.isArray(computedRentRoll?.unit_mix)
      ? computedRentRoll.unit_mix
      : Array.isArray(rentRollPayload?.unit_mix)
      ? rentRollPayload.unit_mix
      : [];
    const hasInPlaceRentForScreening = screeningUnits.some((row) =>
      Number.isFinite(coerceNumber(row?.in_place_rent ?? row?.current_rent))
    );
    const hasMinimumT12ForScreening =
      Number.isFinite(t12EgiValue) &&
      Number.isFinite(t12TotalExpensesValue) &&
      Number.isFinite(t12NoiValue);
    const hasMinimumRentRollForScreening =
      Number.isFinite(rrUnitsValue) && hasInPlaceRentForScreening;
    const hasMinimumScreeningDataset =
      hasMinimumT12ForScreening && hasMinimumRentRollForScreening;
    if (effectiveReportMode === "screening_v1") {
      if (!hasMinimumScreeningDataset) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S2_INCOME_FORENSICS");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S3_EXPENSE_STRUCTURE");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S4_NOI_STABILITY");
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S5_RENT_ROLL_DISTRIBUTION");
      }
      if (!String(screeningRefiSufficiencyHtml || "").trim()) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S6_REFI_DATA_SUFFICIENCY");
      }
      if (!String(screeningCoverageHtml || "").trim()) {
        finalHtml = stripMarkedSection(finalHtml, "SECTION_S7_DATA_COVERAGE_GAPS");
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
    const refiResult = buildRefiStabilityModel({
      financials: body?.financials,
      t12Payload,
      formatValue: formatCurrency,
    });
    const refiHtmlOrDNA = refiResult?.html || DATA_NOT_AVAILABLE;
    finalHtml = replaceAll(finalHtml, "{{REFI_STABILITY_BLOCK}}", refiHtmlOrDNA);
    if (refiHtmlOrDNA === DATA_NOT_AVAILABLE) {
      finalHtml = stripMarkedSection(finalHtml, "SECTION_7_REFI_STABILITY");
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

    const showExec = hasMeaningfulNarrative(getNarrativeHtml("execSummary"));
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

    const showSection2 = hasRentRollData;
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
      (Array.isArray(tables.returnSummary) && tables.returnSummary.length > 0) ||
      hasMeaningfulNarrative(getNarrativeHtml("dcfInterpretation"));
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

    if (!IS_SAMPLE_REPORT) {
      finalHtml = replaceAll(finalHtml, "Sample Report", "");
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
const htmlString =
  typeof safeHtml === "string"
    ? safeHtml
    : safeHtml && typeof safeHtml === "object" && typeof safeHtml.html === "string"
      ? safeHtml.html
      : String(safeHtml || "");
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
  property_name: property_name || "Unknown Property",
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






