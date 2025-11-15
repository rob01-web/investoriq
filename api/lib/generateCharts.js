import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";
import path from "path";

// 5× resolution for institutional quality
const LANDSCAPE_WIDTH = 1800;
const LANDSCAPE_HEIGHT = 900;
const SQUARE_SIZE = 1500;

const chartRenderer = new ChartJSNodeCanvas({
  width: LANDSCAPE_WIDTH,
  height: LANDSCAPE_HEIGHT,
  backgroundColour: "white",
});

const chartRendererSquare = new ChartJSNodeCanvas({
  width: SQUARE_SIZE,
  height: SQUARE_SIZE,
  backgroundColour: "white",
});

// Ensure /public/charts exists
const chartsDir = path.join(process.cwd(), "public", "charts");
if (!fs.existsSync(chartsDir)) {
  fs.mkdirSync(chartsDir, { recursive: true });
}

/**
 * 1. IRR Scenario Chart
 * File: /public/charts/irr_scenario.png
 */
async function generateIRRChart() {
  const configuration = {
    type: "bar",
    data: {
      labels: ["Worst", "Conservative", "Base", "Optimistic", "Best"],
      datasets: [
        {
          data: [9.1, 12.2, 14.5, 16.7, 18.8],
          backgroundColor: "#1F8A8A",
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "5-Year Levered IRR by Scenario",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "IRR (%)",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          ticks: {
            color: "#D4AF37",
            font: { size: 32, weight: "bold" },
          },
          grid: { display: false },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "irr_scenario.png"), imageBuffer);
  console.log("✅ IRR chart generated");
}

/**
 * 2. Renovation ROI Chart
 * File: /public/charts/renovation_roi.png
 */
async function generateRenovationChart() {
  const configuration = {
    type: "bar",
    data: {
      labels: ["Kitchen + Appliances", "Bathroom Upgrades", "Flooring + Paint"],
      datasets: [
        {
          label: "Rent Lift ($/mo)",
          data: [90, 35, 45],
          backgroundColor: "#1F8A8A",
          borderColor: "#0F172A",
          borderWidth: 4,
        },
        {
          label: "Cost per Unit ($)",
          data: [7500, 3000, 4000],
          backgroundColor: "#D4AF37",
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        title: {
          display: true,
          text: "Renovation ROI vs Rent Lift",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
        legend: {
          labels: {
            color: "#0F172A",
            font: { family: "Inter", size: 28, weight: "600" },
          },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Value ($)",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          ticks: {
            color: "#0F172A",
            font: { size: 28, weight: "600" },
          },
          grid: { display: false },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "renovation_roi.png"), imageBuffer);
  console.log("✅ Renovation ROI chart generated");
}

/**
 * 3. 5-Year Cash Flow Trendline
 * File: /public/charts/cashflow_5yr.png
 */
async function generateCashFlowChart() {
  const configuration = {
    type: "line",
    data: {
      labels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
      datasets: [
        {
          label: "Projected Free Cash Flow ($000s)",
          data: [180, 215, 240, 260, 285],
          borderColor: "#D4AF37",
          borderWidth: 6,
          tension: 0.35,
          pointRadius: 12,
          pointBackgroundColor: "#1F8A8A",
          pointBorderColor: "#0F172A",
          pointBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "5-Year Cash Flow Projection",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Cash Flow ($000s)",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          title: {
            display: true,
            text: "Fiscal Year",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "cashflow_5yr.png"), imageBuffer);
  console.log("✅ Cash Flow chart generated");
}

/**
 * 4. Break-Even Occupancy (DSCR Curve)
 * File: /public/charts/breakeven_dscr.png
 */
async function generateBreakEvenChart() {
  const configuration = {
    type: "line",
    data: {
      labels: ["70", "75", "80", "85", "90", "95", "100"],
      datasets: [
        {
          label: "DSCR at Given Occupancy",
          data: [0.78, 0.84, 0.92, 1.03, 1.12, 1.24, 1.32],
          borderColor: "#1F8A8A",
          borderWidth: 6,
          tension: 0.3,
          pointRadius: 10,
          pointBackgroundColor: "#D4AF37",
          pointBorderColor: "#0F172A",
          pointBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Break-Even Occupancy (DSCR Curve)",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "DSCR",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          suggestedMin: 0.7,
          suggestedMax: 1.4,
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          title: {
            display: true,
            text: "Occupancy %",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "breakeven_dscr.png"), imageBuffer);
  console.log("✅ Break-Even chart generated");
}

/**
 * 5. Risk Impact Radar
 * File: /public/charts/risk_radar.png
 */
async function generateRiskRadar() {
  const configuration = {
    type: "radar",
    data: {
      labels: ["Property", "Market", "Financial", "Operational", "Regulatory"],
      datasets: [
        {
          label: "Risk Impact (1 = Low, 10 = High)",
          data: [8, 6, 9, 6, 6],
          backgroundColor: "rgba(31, 138, 138, 0.2)",
          borderColor: "#1F8A8A",
          borderWidth: 6,
          pointBackgroundColor: "#D4AF37",
          pointBorderColor: "#0F172A",
          pointRadius: 10,
          pointBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Risk Impact Radar",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        r: {
          angleLines: { color: "#E5E7EB" },
          grid: { color: "#E5E7EB" },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: { display: false },
          pointLabels: {
            color: "#0F172A",
            font: { family: "Inter", size: 32, weight: "600" },
          },
        },
      },
    },
  };

  const imageBuffer = await chartRendererSquare.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "risk_radar.png"), imageBuffer);
  console.log("✅ Risk Radar chart generated");
}

/**
 * 6. Deal Score Radar
 * File: /public/charts/deal_score_radar.png
 */
async function generateDealScoreRadar() {
  const configuration = {
    type: "radar",
    data: {
      labels: [
        "Location",
        "Cash Flow",
        "DSCR",
        "Liquidity",
        "Market Outlook",
        "Value Add",
        "Risk Profile",
        "Mgmt Intensity",
      ],
      datasets: [
        {
          label: "Score (1–10)",
          data: [8, 8, 7, 7, 8, 8, 8, 6],
          backgroundColor: "rgba(31, 138, 138, 0.2)",
          borderColor: "#1F8A8A",
          borderWidth: 6,
          pointBackgroundColor: "#D4AF37",
          pointBorderColor: "#0F172A",
          pointRadius: 12,
          pointBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Deal Score Breakdown",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 10,
          ticks: { display: false },
          angleLines: { color: "#E5E7EB" },
          grid: { color: "#E5E7EB" },
          pointLabels: {
            color: "#0F172A",
            font: { family: "Inter", size: 28, weight: "600" },
          },
        },
      },
    },
  };

  const imageBuffer = await chartRendererSquare.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "deal_score_radar.png"), imageBuffer);
  console.log("✅ Deal Score Radar chart generated");
}

/**
 * 7. Deal Score Bar Chart
 * File: /public/charts/deal_score_bar.png
 */
async function generateDealScoreBar() {
  const configuration = {
    type: "bar",
    data: {
      labels: [
        "Location",
        "Cash Flow",
        "DSCR",
        "Liquidity",
        "Market",
        "Value Add",
        "Risk",
        "Mgmt",
      ],
      datasets: [
        {
          label: "Weighted Contribution",
          data: [12, 12, 7, 7, 12, 12, 8, 6],
          backgroundColor: "#1F8A8A",
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Deal Score Component Breakdown",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Weighted Points",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          ticks: {
            color: "#0F172A",
            font: { size: 28, weight: "600" },
          },
          grid: { display: false },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "deal_score_bar.png"), imageBuffer);
  console.log("✅ Deal Score Bar chart generated");
}

/**
 * 8. NOI Waterfall
 * File: /public/charts/noi_waterfall.png
 */
async function generateNOIWaterfall() {
  const configuration = {
    type: "bar",
    data: {
      labels: [
        "Y1 NOI",
        "Reno Uplift",
        "Lease-Up",
        "Expense Opt",
        "Stabilized",
        "Y5 NOI",
      ],
      datasets: [
        {
          data: [290, 75, 20, 15, 400, 435],
          backgroundColor: [
            "#1F8A8A",
            "#D4AF37",
            "#1F8A8A",
            "#1F8A8A",
            "#D4AF37",
            "#1F8A8A",
          ],
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "NOI Value Creation Waterfall ($000s)",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "NOI ($000s)",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
            callback: (value) => "$" + value + "k",
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          ticks: {
            color: "#0F172A",
            font: { size: 28, weight: "600" },
          },
          grid: { display: false },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "noi_waterfall.png"), imageBuffer);
  console.log("✅ NOI Waterfall chart generated");
}

/**
 * 9. Operating Expense Ratio Donut
 * File: /public/charts/expense_ratio.png
 */
async function generateExpenseDonut() {
  const configuration = {
    type: "doughnut",
    data: {
      labels: ["Net Operating Income", "Operating Expenses"],
      datasets: [
        {
          data: [62, 38],
          backgroundColor: ["#1F8A8A", "#D4AF37"],
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#0F172A",
            font: { family: "Inter", size: 32, weight: "600" },
            padding: 30,
          },
        },
        title: {
          display: true,
          text: "Operating Expense Ratio (38% of EGI)",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      cutout: "55%",
    },
  };

  const imageBuffer = await chartRendererSquare.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "expense_ratio.png"), imageBuffer);
  console.log("✅ Expense Ratio chart generated");
}

/**
 * 10. 5-Year Cash Flow Waterfall
 * File: /public/charts/cashflow_waterfall.png
 */
async function generateCashFlowWaterfall() {
  const configuration = {
    type: "bar",
    data: {
      labels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Sale"],
      datasets: [
        {
          label: "Net Cash Flow ($)",
          data: [42000, 47000, 52000, 56000, 60000, 540000],
          backgroundColor: "#1F8A8A",
          borderColor: "#0F172A",
          borderWidth: 4,
        },
      ],
    },
    options: {
      responsive: false,
      devicePixelRatio: 3,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "5-Year Cash Flow Waterfall",
          color: "#0F172A",
          font: { family: "Merriweather", size: 48, weight: "bold" },
        },
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Dollars ($)",
            color: "#0F172A",
            font: { size: 36, weight: "600" },
          },
          ticks: {
            color: "#0F172A",
            font: { size: 32 },
          },
          grid: { color: "#E5E7EB" },
        },
        x: {
          ticks: {
            color: "#0F172A",
            font: { size: 32, weight: "600" },
          },
          grid: { display: false },
        },
      },
    },
  };

  const imageBuffer = await chartRenderer.renderToBuffer(configuration);
  fs.writeFileSync(path.join(chartsDir, "cashflow_waterfall.png"), imageBuffer);
  console.log("✅ Cash Flow Waterfall chart generated");
}

/**
 * Generate ALL charts (5× institutional quality)
 */
export async function generateAllCharts() {
  console.log("🚀 Generating institutional-quality charts at 5× resolution...");

  await generateIRRChart();
  await generateRenovationChart();
  await generateCashFlowChart();
  await generateBreakEvenChart();
  await generateRiskRadar();
  await generateDealScoreRadar();
  await generateDealScoreBar();
  await generateNOIWaterfall();
  await generateExpenseDonut();
  await generateCashFlowWaterfall();

  console.log("✅ All 10 charts generated! Saved to /public/charts/");
}

// Allow running directly: `node api/lib/generateCharts.js`
if (process.argv[1] && process.argv[1].endsWith("generateCharts.js")) {
  generateAllCharts().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
