// api/generate-client-report.js

import dotenv from "dotenv";
dotenv.config();
import { ensureSentenceIntegrity } from "../src/lib/sentenceIntegrity.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; // DocRaptor
import { createClient } from "@supabase/supabase-js";

const INVESTORIQ_MASTER_PROMPT_V71 = `INVESTORIQ
INSTITUTIONAL ANALYST ENGINE - v7.1 (FINAL)
ROLE & IDENTITY (NON-NEGOTIABLE)
You are InvestorIQ, an institutional-grade real estate underwriting analyst.
You produce underwriting narratives equivalent to:
    • Blackstone
    • Brookfield
    • Large private equity real estate investment committees
Your output is designed to withstand:
    • Investor scrutiny
    • Lender review
    • Legal and compliance review
This is not marketing copy.
This is not casual analysis.
This is investment committee–ready underwriting.

CORE GOVERNING PRINCIPLES (ABSOLUTE)
🚫 ZERO ASSUMPTIONS
    • You must never invent, infer, interpolate, estimate, or “fill in” missing data.
    • You must never create financial values not explicitly supported by provided inputs.
🚫 ZERO HALLUCINATION
    • If a figure, metric, or conclusion cannot be supported by uploaded documents, you must not fabricate it.
✅ EXPLICIT DISCLOSURE
    • Missing, incomplete, or unusable data must be explicitly disclosed.
    • Transparency is mandatory.
REQUIRED DOCUMENT DISCIPLINE
Mandatory for full underwriting:
    • Rent Roll
    • T12 / Operating Statement / P&L
If required inputs are missing, degraded, or partially unusable:
    • You must not proceed with dependent calculations.
    • You must shift into Degraded Analysis Mode (see below).

DATA AVAILABILITY RULE (LOCKED OUTPUT)
If data required for a section, metric, or conclusion is missing or unusable, you must output exactly:
DATA NOT AVAILABLE (not present in uploaded documents)
Rules:
    • Do not soften the wording
    • Do not pad with commentary
    • Do not summarize missing data
    • Do not approximate
This phrase must appear verbatim.

DEGRADED ANALYSIS MODE (MANDATORY WHEN APPLICABLE)
If required documents are present but incomplete, inconsistent, or partially unusable:
You must:
    • Clearly explain which analysis is degraded and why
    • Suppress conclusions that rely on missing inputs
    • Avoid STRONG BUY / BUY recommendations
    • Default to HOLD or PASS where determinism is compromised
    • Maintain institutional tone — never apologetic, never speculative
OUTPUT STRUCTURE (STRICT)
You must generate only the following sections, in order, with no extras:
    1. Executive Summary
    2. Unit-Level Value Add Analysis
    3. Cash Flow & Scenario Analysis
    4. Neighborhood & Market Fundamentals
    5. Risk Assessment
    6. Renovation Strategy & Capital Plan
    7. Debt Structure & Financing
    8. Deal Score Summary & Interpretation
    9. Discounted Cash Flow (DCF) Interpretation
    10. Final Recommendation
Each section must be:
    • Self-contained
    • Deterministic
    • Directly tied to document-backed inputs

SECTION-SPECIFIC RULES
Executive Summary
    • Concise, investment-committee tone
    • No invented metrics
    • Clear articulation of strategy, risks, and return drivers
Unit-Level Value Add
    • Focus on operational execution, not financial engineering
    • Rent lift must be supported by rent roll or explicitly marked unavailable
Cash Flow & Scenarios
    • Scenarios must reflect document-supported assumptions
    • If scenario inputs are missing → suppress scenario tables
Neighborhood Analysis
    • Qualitative analysis only unless data is provided
    • No fabricated statistics
Risk Assessment
    • Enumerate real, document-supported risks
    • Mitigation must be operationally realistic
Debt Structure
    • Financing assumptions must be explicitly labeled as InvestorIQ Estimates
    • If debt terms are missing → suppress DSCR-dependent conclusions
Deal Score
    • Score components must be internally consistent
    • No “rounding to feel right”
DCF
    • Only interpret DCF outputs
    • Do not restate fabricated projections
Final Recommendation
    • Must logically follow from prior sections
    • Conservative bias preferred over optimism

LANGUAGE & STYLE (LOCKED)
    • Institutional
    • Conservative
    • Precise
    • No hype
    • No emojis
    • No marketing adjectives
    • No conversational tone
Write as if your output will be:
    • Printed
    • Archived
    • Reviewed years later

PROHIBITIONS (ABSOLUTE)
You must NOT:
    • Assume missing data
    • Infer values
    • Smooth inconsistencies
    • Backfill gaps
    • Overwrite DATA NOT AVAILABLE sections
    • Produce content outside the defined structure

OBJECTIVE
Produce a report that:
    • Matches institutional underwriting quality
    • Is explainable, auditable, and defensible
    • Maintains identical standards across every report generated
    • Can confidently be priced at $8k–$10k equivalent quality

END OF PROMPT
Version: v7.1 — FINAL`;

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildUnitMixRows(unitMix = [], totalUnits, formatValue) {
  if (!Array.isArray(unitMix) || unitMix.length === 0) return "";
  const rows = unitMix
    .map((row) => {
      const unitType = escapeHtml(row.unit_type || "");
      const count = typeof row.count === "number" ? row.count : Number(row.count || 0);
      const rent =
        typeof row.current_rent === "number" ? formatValue(row.current_rent) : DATA_NOT_AVAILABLE;
      return `<tr>
            <td>${unitType || DATA_NOT_AVAILABLE}</td>
            <td>${count || DATA_NOT_AVAILABLE}</td>
            <td>${rent}</td>
            <td>${DATA_NOT_AVAILABLE}</td>
            <td>${DATA_NOT_AVAILABLE}</td>
            <td>${DATA_NOT_AVAILABLE}</td>
          </tr>`;
    })
    .join("");

  const total = Number.isFinite(Number(totalUnits)) ? Number(totalUnits) : DATA_NOT_AVAILABLE;

  const totalRow = `<tr>
            <td><strong>Blended / Total</strong></td>
            <td><strong>${total}</strong></td>
            <td><strong>${DATA_NOT_AVAILABLE}</strong></td>
            <td><strong>${DATA_NOT_AVAILABLE}</strong></td>
            <td><strong>${DATA_NOT_AVAILABLE}</strong></td>
            <td><strong>${DATA_NOT_AVAILABLE}</strong></td>
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
  const occupancyPercent = `${Math.round(Number(occupancy) * 100)}%`;
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
      const display = Number.isFinite(Number(value)) ? formatValue(value) : DATA_NOT_AVAILABLE;
      return `<tr><td>${label}</td><td>${display}</td></tr>`;
    })
    .join("");

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
      const display = Number.isFinite(Number(value)) ? formatValue(value) : DATA_NOT_AVAILABLE;
      return `<tr>
          <td>${label}</td>
          <td>${display}</td>
        </tr>`;
    })
    .join("");
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
  try {
    const adminRunKey = (process.env.ADMIN_RUN_KEY || "").trim();
    let headerKey = req.headers["x-admin-run-key"];
    if (Array.isArray(headerKey)) headerKey = headerKey[0];
    headerKey = (typeof headerKey === "string" ? headerKey : "").trim();

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

    // 1. Parse input JSON (structured)
    const body = req.body || {};
    const { userId, property_name, jobId } = body;
    const nowIso = new Date().toISOString();
    const promptInstructions = [
      INVESTORIQ_MASTER_PROMPT_V71,
      ...(Array.isArray(body.instructions) ? body.instructions : []),
    ];

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const sections = body.sections || {};
    if (promptInstructions.length > 0) {
      const safeTimestamp = nowIso.replace(/:/g, "-");
      const { error: promptEventErr } = await supabase
        .from("analysis_artifacts")
        .insert({
          job_id: jobId || null,
          user_id: userId,
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
const REQUIRED_SECTIONS = [
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
];

REQUIRED_SECTIONS.forEach((key) => {
  if (!sections[key]) {
    sections[key] = `<p class="muted">${DATA_NOT_AVAILABLE}</p>`;
  }
});
    
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

    let documentSourcesHtml = `<p class="muted">${DATA_NOT_AVAILABLE}</p>`;
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
            return `<li>${name} — ${escapeHtml(createdAt)}</li>`;
          })
          .join("");
        documentSourcesHtml = `<ul>${items}</ul>`;
      }
    }

    // 2. Load the HTML template (SACRED MASTER COPY)
    const templatePath = path.join(__dirname, "report-template.html");
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

    // 5. Inject dynamic tables (fall back to blank if not provided)
    finalHtml = replaceAll(
      finalHtml,
      "{{UNIT_MIX_TABLE}}",
      buildUnitMixTable(tables.unitMix || [])
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
    finalHtml = finalHtml.replace("{{EXEC_SUMMARY}}", getSection("execSummary"));
    finalHtml = finalHtml.replace(
      "{{UNIT_VALUE_ADD}}",
      getSection("unitValueAdd")
    );
    finalHtml = finalHtml.replace(
      "{{CASH_FLOW_PROJECTIONS}}",
      getSection("cashFlowProjections")
    );
    finalHtml = finalHtml.replace(
      "{{NEIGHBORHOOD_ANALYSIS}}",
      getSection("neighborhoodAnalysis")
    );
    finalHtml = finalHtml.replace(
      "{{RISK_ASSESSMENT}}",
      getSection("riskAssessment")
    );
    finalHtml = finalHtml.replace(
      "{{RENOVATION_NARRATIVE}}",
      getSection("renovationNarrative")
    );
    finalHtml = finalHtml.replace(
      "{{DEBT_STRUCTURE}}",
      getSection("debtStructure")
    );
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_SUMMARY}}",
      getSection("dealScoreSummary")
    );
    finalHtml = finalHtml.replace(
      "{{DEAL_SCORE_INTERPRETATION}}",
      getSection("dealScoreInterpretation")
    );
    finalHtml = finalHtml.replace(
      "{{ADVANCED_MODELING_INTRO}}",
      getSection("advancedModelingIntro")
    );
    finalHtml = finalHtml.replace(
      "{{DCF_INTERPRETATION}}",
      getSection("dcfInterpretation")
    );
    finalHtml = finalHtml.replace(
      "{{FINAL_RECOMMENDATION}}",
      getSection("finalRecommendation")
    );

    const unitMixRows = buildUnitMixRows(
      rentRollPayload?.unit_mix,
      rentRollPayload?.total_units,
      formatCurrency
    );
    finalHtml = injectUnitMixTable(finalHtml, unitMixRows);
    finalHtml = injectOccupancyNote(finalHtml, rentRollPayload?.occupancy);

    const t12Rows = buildT12KeyMetricRows(t12Payload, formatCurrency);
    finalHtml = injectKeyMetricsRows(finalHtml, t12Rows);

    finalHtml = replaceAll(finalHtml, "{{DOCUMENT_SOURCES}}", documentSourcesHtml);

    if (!IS_SAMPLE_REPORT) {
      finalHtml = replaceAll(finalHtml, "Sample Report", "");
      finalHtml = replaceAll(finalHtml, "Sample Output for Demonstration Only", "");
      finalHtml = replaceAll(finalHtml, "Sample Output for Demonstration", "");
    }

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

    // 8. TEMP: Skip sentence integrity to avoid corrupting HTML
const safeHtml = finalHtml;
const warnings = [];

    if (warnings.length > 0) {
      console.warn("⚠️ Sentence Integrity Warnings:");
      warnings.forEach((w) => console.warn(" - " + w));
    }

    // 9. Send to DocRaptor (STILL IN TEST MODE)
let pdfResponse;

try {
  pdfResponse = await axios.post(
    "https://docraptor.com/docs",
    {
      test: true, // keep true until you're ready to burn real (non-watermark) credits
      document_content: safeHtml,
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
  user_id: userId,
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
    const storagePath = `${userId}/${reportId}.pdf`;

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
  }
}
