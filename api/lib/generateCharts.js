// api/lib/generateCharts.js (ESM Version)
// ---------------------------------------
// Uses ChartJSNodeCanvas to generate institutional-quality chart PNGs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ChartJS from "chart.js/auto";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// BRAND PALETTE
const BRAND = {
  navy: "#0F172A",
  teal: "#1F8A8A",
  gold: "#D4AF37",
  slate: "#64748B",
};

const WIDTH = 1200;
const HEIGHT = 800;

// Ensure charts directory exists
const chartsDir = path.join(process.cwd(), "public", "charts");
if (!fs.existsSync(chartsDir)) {
  fs.mkdirSync(chartsDir, { recursive: true });
}

// Initialize canvas
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: "#FFFFFF",
});

// ------------------------------
// CHART 1: IRR SCENARIO
// ------------------------------
async function generateIrrScenarioChart() {
  const config = {
    type: "bar",
    data: {
      labels: ["Conservative", "Base Case", "Upside"],
      datasets: [
        {
          label: "10-Year Levered IRR",
          data: [14.7, 18.4, 21.9],
          borderRadius: 6,
          backgroundColor: [
            "rgba(15, 23, 42, 0.75)",
            "rgba(31, 138, 138, 0.85)",
            "rgba(212, 175, 55, 0.9)",
          ],
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "IRR by Scenario – 10-Year Levered Returns",
          color: BRAND.navy,
          font: { size: 24 },
        },
        legend: {
          labels: { color: BRAND.navy, font: { size: 16 } },
        },
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy, font: { size: 14 } },
        },
        y: {
          ticks: {
            color: BRAND.slate,
            font: { size: 14 },
            callback: (value) => value + "%",
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, "irr_scenario.png");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ IRR chart generated →", outPath);
}

// ------------------------------
// CHART 2: RENOVATION ROI
// ------------------------------
async function generateRenovationRoiChart() {
  const config = {
    type: "line",
    data: {
      labels: ["Baseline", "+$3k/Unit", "+$6k/Unit", "+$9k/Unit"],
      datasets: [
        {
          label: "Renovation ROI",
          data: [0, 15, 24, 28],
          tension: 0.35,
          borderColor: BRAND.teal,
          borderWidth: 4,
          backgroundColor: "rgba(31, 138, 138, 0.15)",
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: BRAND.teal,
          pointRadius: 5,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Renovation ROI by Capital Spend",
          color: BRAND.navy,
          font: { size: 24 },
        },
        legend: {
          labels: { color: BRAND.navy, font: { size: 16 } },
        },
      },
      scales: {
        x: { ticks: { color: BRAND.navy } },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => v + "%",
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, "renovation_roi.png");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Renovation ROI chart generated →", outPath);
}

// ------------------------------
// CHART 3: CASH FLOW
// ------------------------------
async function generateCashFlowChart() {
  const years = Array.from({ length: 10 }, (_, i) => `Year ${i + 1}`);
  const yields = [6.1, 6.8, 7.2, 7.6, 7.9, 8.3, 8.7, 9.1, 9.5, 10.0];

  const config = {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Net Cash Flow Yield",
          data: yields,
          borderRadius: 4,
          backgroundColor: "rgba(15, 23, 42, 0.9)",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "10-Year Net Distributable Cash Flow Yield",
          color: BRAND.navy,
          font: { size: 24 },
        },
        legend: {
          labels: { color: BRAND.navy, font: { size: 16 } },
        },
      },
      scales: {
        x: { ticks: { color: BRAND.navy } },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => v + "%",
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, "cash_flow.png");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Cash Flow chart generated →", outPath);
}

// ------------------------------
// CHART 4: BREAK-EVEN OCCUPANCY
// ------------------------------
async function generateBreakEvenChart() {
  const config = {
    type: "line",
    data: {
      labels: ["50% LTV", "60% LTV", "70% LTV"],
      datasets: [
        {
          label: "Break-Even Occupancy",
          data: [69, 73.5, 78.2],
          borderWidth: 4,
          tension: 0.25,
          borderColor: BRAND.gold,
          backgroundColor: "rgba(212, 175, 55, 0.15)",
          pointBorderColor: BRAND.gold,
          pointBackgroundColor: "#FFFFFF",
          pointRadius: 5,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Break-Even Occupancy vs. Leverage",
          color: BRAND.navy,
          font: { size: 24 },
        },
        legend: {
          labels: { color: BRAND.navy, font: { size: 16 } },
        },
      },
      scales: {
        x: { ticks: { color: BRAND.navy } },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => v + "%",
          },
        },
      },
    },
  };

  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, "break_even_occupancy.png");
  fs.writeFileSync(outPath, buffer);
  console.log("✅ Break-Even chart generated →", outPath);
}

// ------------------------------
// MAIN EXECUTION
// ------------------------------
async function main() {
  console.log("🚀 Generating institutional-quality charts...");

  await generateIrrScenarioChart();
  await generateRenovationRoiChart();
  await generateCashFlowChart();
  await generateBreakEvenChart();

  console.log("🔥 All charts generated successfully!");
}

main().catch((err) => {
  console.error("❌ Chart generation failed:", err);
});
