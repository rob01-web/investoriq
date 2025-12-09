// api/generate-client-report.js

import dotenv from "dotenv";
dotenv.config();
import { ensureSentenceIntegrity } from "./lib/sentenceIntegrity.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; // DocRaptor

// Convert __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function applyChartPlaceholders(html, charts = {}) {
  const defaults = {
    renovationChartUrl:
      "https://investoriq.tech/charts/institutional/renovation_roi.png",
    cashflowChartUrl:
      "https://investoriq.tech/charts/institutional/cashflow_5yr.png",
    irrScenarioChartUrl:
      "https://investoriq.tech/charts/institutional/irr_scenario.png",
    riskRadarChartUrl:
      "https://investoriq.tech/charts/institutional/risk_radar.png",
    dealScoreRadarChartUrl:
      "https://investoriq.tech/charts/institutional/deal_score_radar.png",
    dealScoreBarChartUrl:
      "https://investoriq.tech/charts/institutional/deal_score_bar.png",
    expenseRatioChartUrl:
      "https://investoriq.tech/charts/institutional/expense_ratio.png",
    equityComponentsChartUrl:
      "https://investoriq.tech/charts/institutional/equity_return_components.png",
    noiWaterfallChartUrl:
      "https://investoriq.tech/charts/institutional/noi_waterfall.png",
    breakevenChartUrl:
      "https://investoriq.tech/charts/institutional/break_even_occupancy.png",
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
  try {
    // 1. Parse input JSON (structured)
    const body = req.body || {};
    const sections = body.sections || {};
    const tables = body.tables || {};
    const charts = body.charts || {};

    // Optional property payload; falls back to the Riverbend Heights sample
    const property = body.property || {
      name: "Riverbend Heights",
      city: "London",
      province: "Ontario",
      submarket: "South London (Westminster / Pond Mills)",
    };

    // Optional financials payload; falls back to sample values
    const financials = body.financials || {
      purchasePrice: 27360000,
      totalProjectCost: 29000000,
      equityRequired: 10150000,
      capRateOnCost: 0.059,
      leveredIrr: 0.145,
      equityMultiple: 1.9,
      year1CoC: 0.071,
    };

    const getSection = (key) => sections[key] || "";

    // 2. Load the HTML template (SACRED MASTER COPY)
    const templatePath = path.join(__dirname, "html", "sample-report.html");
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
      formatCurrency(financials.purchasePrice)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{TOTAL_PROJECT_COST}}",
      formatCurrency(financials.totalProjectCost)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{EQUITY_REQUIRED}}",
      formatCurrency(financials.equityRequired)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{CAP_RATE_ON_COST}}",
      formatPercent(financials.capRateOnCost)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{LEVERED_IRR}}",
      formatPercent(financials.leveredIrr)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{EQUITY_MULTIPLE}}",
      formatMultiple(financials.equityMultiple, 2)
    );
    finalHtml = replaceAll(
      finalHtml,
      "{{YEAR1_COC}}",
      formatPercent(financials.year1CoC)
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

    // 8. Ensure sentence integrity across the full HTML
    const { html: safeHtml, warnings } = ensureSentenceIntegrity(finalHtml, {
      autoFixPunctuation: true,
    });

    if (warnings.length > 0) {
      console.warn("⚠️ Sentence Integrity Warnings:");
      warnings.forEach((w) => console.warn(" - " + w));
    }

    // 9. Send to DocRaptor (STILL IN TEST MODE)
    const pdfResponse = await axios.post(
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

    // 10. Return PDF to client
    res.setHeader("Content-Type", "application/pdf");
    res.send(pdfResponse.data);
  } catch (err) {
    console.error("❌ Error generating report:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
