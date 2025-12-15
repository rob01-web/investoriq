// api/lib/generateCharts.js (Riverbend Heights – Institutional Chart Pack)
// ------------------------------------------------------------------------
// Generates all institutional charts for Riverbend Heights using the
// Riverbend dataset JSON as the single source of truth.
//
// Output directory (relative to project root):
//   /public/charts/institutional/*.png
//
// Run locally with:
//   node api/lib/generateCharts.js
//
// These charts are then consumed by sample-report.html as static PNGs
// (DocRaptor-safe, no scripts required).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import ChartJS from "chart.js/auto";

// ------------------------
// Resolve __dirname in ESM
// ------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------
// Brand palette
// ------------------------
const BRAND = {
  navy: "#0F172A",
  teal: "#1F8A8A",
  gold: "#D4AF37",
  slate: "#64748B",
  grid: "#E2E8F0"
};

// ------------------------
// Hero chart canvas (institutional standard)
// ------------------------
const HERO_WIDTH = 1600;
const HERO_HEIGHT = 1000;

// ------------------------
// Canvas defaults
// ------------------------
const WIDTH = 1200;
const HEIGHT = 800;

// ------------------------
// Ensure charts directory
// ------------------------
const chartsDir = path.join(process.cwd(), "public", "charts", "institutional");
if (!fs.existsSync(chartsDir)) {
  fs.mkdirSync(chartsDir, { recursive: true });
}

// ------------------------
// Load Riverbend dataset
// ------------------------
const datasetPath = path.join(__dirname, "..", "data", "riverbend_dataset.json");

if (!fs.existsSync(datasetPath)) {
  console.error("❌ Riverbend dataset not found at:", datasetPath);
  process.exit(1);
}

const riverbend = JSON.parse(fs.readFileSync(datasetPath, "utf8"));

// ------------------------
// ChartJS canvas instance
// ------------------------
// Standard charts
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: "#FFFFFF"
});

// Hero / primary analytical charts
const heroChartJSNodeCanvas = new ChartJSNodeCanvas({
  width: HERO_WIDTH,
  height: HERO_HEIGHT,
  backgroundColour: "#FFFFFF"
});

// ------------------------
// Helper: write chart file (STANDARD charts)
// ------------------------
async function writeChart(filename, config) {
  const buffer = await chartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Generated: ${filename}`);
}

// ------------------------
// Helper: write HERO chart file (primary analytical charts)
// ------------------------
async function writeHeroChart(filename, config) {
  const buffer = await heroChartJSNodeCanvas.renderToBuffer(config);
  const outPath = path.join(chartsDir, filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`🏆 Generated HERO: ${filename}`);
}

// ------------------------
// CHART 1: IRR SCENARIO
// ------------------------
async function generateIrrScenarioChart() {
  const irr = riverbend.irr_scenarios;

  const labels = ["Downside", "Base Case", "Upside", "Best Case"];
  const data = [irr.downside, irr.base, irr.upside, irr.best];

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "5-Year Levered IRR (InvestorIQ Estimate)",
          data,
          borderRadius: 6, // ⬅ slightly tighter
          backgroundColor: [
            "rgba(15, 23, 42, 0.80)",
            "rgba(31, 138, 138, 0.85)",
            "rgba(212, 175, 55, 0.90)",
            "rgba(15, 23, 42, 0.60)"
          ]
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,

      layout: {
        padding: {
          top: 10,
          bottom: 6,
          left: 12,
          right: 12
        }
      },

      plugins: {
        title: {
          display: true,
          text: "IRR by Scenario – 5-Year Levered Returns",
          color: BRAND.navy,
          font: {
            size: 20,
            weight: "600"
          },
          padding: {
            bottom: 10
          }
        },
        legend: {
          position: "top",
          labels: {
            color: BRAND.navy,
            font: { size: 12 }
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: BRAND.navy,
            font: { size: 12 }
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            font: { size: 12 },
            callback: (v) => v + "%"
          },
          grid: {
            color: BRAND.grid
          }
        }
      }
    }
  };

  await writeChart("irr_scenario.png", config);
}

// --------------------------------------
// CHART 2: ANNUAL LEVERED CASH FLOW (5Y)
// --------------------------------------
async function generateCashFlowChart() {
  const proj = riverbend.cash_flow_projection;
  const years = proj.years.map((y) => `Year ${y}`);
  const cashFlows = proj.levered_cash_flow_millions;

  const config = {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        {
          label: "Annual Levered Cash Flow (Millions, InvestorIQ Estimate)",
          data: cashFlows,
          borderRadius: 6,
          backgroundColor: "rgba(15, 23, 42, 0.90)"
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "5-Year Levered Cash Flow Profile",
          color: BRAND.navy,
          font: { size: 24 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 15 }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: BRAND.navy
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => "$" + v.toFixed(2) + "M"
          },
          grid: {
            color: BRAND.grid
          }
        }
      }
    }
  };

  await writeChart("cash_flow.png", config);
}

// ------------------------------------------
// CHART 3: CUMULATIVE CASH FLOW (5Y LINE)
// ------------------------------------------
async function generateCashFlow5yrChart() {
  const proj = riverbend.cash_flow_projection;
  const years = proj.years.map((y) => `Year ${y}`);
  const cumulative = proj.cumulative_cash_flow_millions;

  const config = {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Cumulative Cash Flow (Millions, InvestorIQ Estimate)",
          data: cumulative,
          borderWidth: 4,
          tension: 0.3,
          borderColor: BRAND.teal,
          backgroundColor: "rgba(31, 138, 138, 0.12)",
          pointRadius: 5,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: BRAND.teal
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Cumulative Distributions to Equity – 5-Year Horizon",
          color: BRAND.navy,
          font: { size: 24 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 15 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => "$" + v.toFixed(1) + "M"
          },
          grid: { color: BRAND.grid }
        }
      }
    }
  };

  await writeChart("cashflow_5yr.png", config);
}

// ---------------------------------
// CHART 4: EXPENSE RATIO DONUT
// ---------------------------------
async function generateExpenseRatioChart() {
  const inc = riverbend.income_statement_snapshot;
  const opEx = Math.abs(inc.annualized.operating_expenses_millions);
  const debt = Math.abs(inc.annualized.debt_service_millions);
  const cash = Math.abs(inc.annualized.pre_tax_cash_flow_millions);

  const total = opEx + debt + cash;

  const data = [
    (opEx / total) * 100,
    (debt / total) * 100,
    (cash / total) * 100
  ];

  const labels = ["Operating Expenses", "Debt Service", "Cash Flow to Equity"];

  const config = {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(15, 23, 42, 0.90)",
            "rgba(31, 138, 138, 0.85)",
            "rgba(212, 175, 55, 0.90)"
          ],
          borderWidth: 1,
          borderColor: "#FFFFFF"
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Operating Expense, Debt Service, and Cash Flow Mix",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          position: "right",
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      cutout: "58%"
    }
  };

  await writeChart("expense_ratio.png", config);
}

// ---------------------------------
// CHART 5: BREAK-EVEN OCCUPANCY
// ---------------------------------
async function generateBreakEvenOccupancyChart() {
  const be = riverbend.break_even_analysis;
  const labels = be.stress_test_occupancies_pct.map((v) => v + "%");
  const dscr = be.stress_test_dscr_estimates;

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Modeled DSCR",
          data: dscr,
          borderWidth: 4,
          tension: 0.3,
          borderColor: BRAND.gold,
          backgroundColor: "rgba(212, 175, 55, 0.14)",
          pointRadius: 5,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: BRAND.gold
        },
        {
          label: "Lender Min DSCR",
          data: dscr.map(() => be.lender_min_dscr),
          borderWidth: 2,
          borderDash: [6, 6],
          borderColor: BRAND.slate,
          pointRadius: 0
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "DSCR Sensitivity vs. Occupancy (InvestorIQ Estimate)",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate
          },
          grid: {
            color: BRAND.grid
          }
        }
      }
    }
  };

  await writeChart("break_even_occupancy.png", config);
}

// ---------------------------------
// CHART 6: BREAK-EVEN DSCR BAR
// ---------------------------------
async function generateBreakEvenDscrChart() {
  const be = riverbend.break_even_analysis;

  const labels = ["Current DSCR", "Lender Minimum"];
  const dscrValues = [be.current_dscr, be.lender_min_dscr];

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "DSCR Comparison",
          data: dscrValues,
          borderRadius: 6,
          backgroundColor: [
            "rgba(31, 138, 138, 0.90)",
            "rgba(15, 23, 42, 0.75)"
          ]
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "DSCR vs. Lender Minimum – Current Underwriting",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy },
          grid: { display: false }
        },
        y: {
          ticks: { color: BRAND.slate },
          grid: { color: BRAND.grid }
        }
      }
    }
  };

  await writeChart("breakeven_dscr.png", config);
}

// ---------------------------------
// CHART 7: NOI WATERFALL
// ---------------------------------
async function generateNoiWaterfallChart() {
  const n = riverbend.noi_waterfall_millions;

  const labels = [
    "Gross Potential Rent",
    "Vacancy & Credit Loss",
    "Other Income",
    "Effective Gross Income",
    "Operating Expenses",
    "Net Operating Income",
    "Debt Service",
    "Cash Flow"
  ];

  const values = [
    n.gross_income,
    n.vacancy_loss,
    n.other_income,
    n.effective_gross_income,
    n.operating_expenses,
    n.noi,
    n.debt_service,
    n.cash_flow
  ];

  const colors = values.map((v) =>
    v >= 0 ? "rgba(31, 138, 138, 0.90)" : "rgba(15, 23, 42, 0.85)"
  );

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Millions",
          data: values,
          backgroundColor: colors,
          borderRadius: 4
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Cash Flow Waterfall – From Gross Income to Cash Flow (Millions)",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy, maxRotation: 45, minRotation: 30 },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => "$" + v.toFixed(1) + "M"
          },
          grid: { color: BRAND.grid }
        }
      }
    }
  };

  await writeChart("noi_waterfall.png", config);
}

// ---------------------------------
// CHART 8: RENOVATION ROI
// ---------------------------------
async function generateRenovationRoiChart() {
  const r = riverbend.renovation_roi;

  const labels = ["Capex Invested", "Value Created"];
  const values = [r.capex_invested_millions, r.value_created_millions];

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Program Economics (Millions, InvestorIQ Estimate)",
          data: values,
          borderRadius: 6,
          backgroundColor: [
            "rgba(15, 23, 42, 0.90)",
            "rgba(212, 175, 55, 0.90)"
          ]
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Renovation Program – Capital vs. Value Creation",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            callback: (v) => "$" + v.toFixed(1) + "M"
          },
          grid: { color: BRAND.grid }
        }
      }
    }
  };

  await writeChart("renovation_roi.png", config);
}

// ---------------------------------
// CHART 9: DEAL SCORE – BAR
// ---------------------------------
async function generateDealScoreBarChart() {
  const d = riverbend.deal_score;

  const labels = [
    "Location",
    "Market",
    "Asset Quality",
    "Financials",
    "Value-Add",
    "Risk (Inverse)"
  ];

  const values = [
    d.location,
    d.market,
    d.asset_quality,
    d.financials,
    d.value_add,
    10 - d.risk // invert risk for visual comparability
  ];

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Score (0–10, InvestorIQ Framework)",
          data: values,
          borderRadius: 6,
          backgroundColor: "rgba(31, 138, 138, 0.90)"
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Deal Score Components – InvestorIQ Framework",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: BRAND.navy },
          grid: { display: false }
        },
        y: {
          min: 0,
          max: 10,
          ticks: { color: BRAND.slate },
          grid: { color: BRAND.grid }
        }
      }
    }
  };

  await writeChart("deal_score_bar.png", config);
}

// ---------------------------------
// CHART 10: DEAL SCORE – RADAR
// ---------------------------------
async function generateDealScoreRadarChart() {
  const d = riverbend.deal_score;

  const labels = [
    "Location",
    "Market",
    "Asset Quality",
    "Financials",
    "Value-Add",
    "Risk-Adjusted"
  ];

  const values = [
    d.location,
    d.market,
    d.asset_quality,
    d.financials,
    d.value_add,
    10 - d.risk
  ];

  const config = {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "InvestorIQ Deal Profile",
          data: values,
          borderColor: BRAND.teal,
          backgroundColor: "rgba(31, 138, 138, 0.15)",
          borderWidth: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: BRAND.teal,
          pointRadius: 4
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Deal Quality Radar – Riverbend Heights",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      scales: {
        r: {
          angleLines: { color: BRAND.grid },
          grid: { color: BRAND.grid },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: {
            display: false
          },
          pointLabels: {
            color: BRAND.navy,
            font: { size: 13 }
          }
        }
      }
    }
  };

  await writeChart("deal_score_radar.png", config);
}

// ---------------------------------
// CHART 11: RISK PROFILE RADAR
// ---------------------------------
async function generateRiskRadarChart() {
  const r = riverbend.risk_profile;

  const labels = [
    "Market Volatility",
    "Location Risk",
    "Tenant Profile",
    "CapEx Risk",
    "Debt Risk",
    "Sponsor Risk"
  ];

  const values = [
    r.market_volatility,
    r.location_risk,
    r.tenant_profile,
    r.capex_risk,
    r.debt_risk,
    r.sponsor_risk
  ];

  const config = {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Risk Profile (0–10, Higher = More Risk)",
          data: values,
          borderColor: BRAND.navy,
          backgroundColor: "rgba(15, 23, 42, 0.12)",
          borderWidth: 3,
          pointBackgroundColor: "#FFFFFF",
          pointBorderColor: BRAND.navy,
          pointRadius: 4
        }
      ]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Risk Factor Radar – Riverbend Heights",
          color: BRAND.navy,
          font: { size: 22 }
        },
        legend: {
          labels: {
            color: BRAND.navy,
            font: { size: 14 }
          }
        }
      },
      scales: {
        r: {
          angleLines: { color: BRAND.grid },
          grid: { color: BRAND.grid },
          suggestedMin: 0,
          suggestedMax: 10,
          ticks: {
            display: false
          },
          pointLabels: {
            color: BRAND.navy,
            font: { size: 13 }
          }
        }
      }
    }
  };

  await writeChart("risk_radar.png", config);
}

// ---------------------------------
// CHART 12: EQUITY CASHFLOW WATERFALL
// ---------------------------------
async function generateCashflowWaterfallChart() {
  const w = riverbend.equity_waterfall_millions;

  const labels = [
    "Initial Equity Invested",
    "Cumulative Cash Flow",
    "Refinance Proceeds",
    "Sale Proceeds"
  ];

  const values = [
    -w.initial_equity,
    w.cumulative_cash_flow,
    w.refinance_proceeds,
    w.sale_proceeds
  ];

  const colors = values.map((v) =>
    v >= 0 ? "rgba(31, 138, 138, 0.90)" : "rgba(15, 23, 42, 0.85)"
  );

  const config = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Equity Flows (Millions)",
          data: values,
          backgroundColor: colors,
          borderRadius: 4
        }
      ]
    },
    options: {
      layout: {
        padding: {
          top: 10,
          bottom: 6
        }
      },
      plugins: {
        title: {
          display: true,
          text: "Equity Cash Flow Waterfall – Riverbend Heights",
          color: BRAND.navy,
          font: { size: 20 }
        },
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: {
            color: BRAND.navy,
            maxRotation: 30,
            minRotation: 0,
            font: { size: 12 }
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: BRAND.slate,
            font: { size: 12 },
            callback: (v) => "$" + v.toFixed(1) + "M"
          },
          grid: { color: BRAND.grid }
        }
      }
    }
  }; // ✅ THIS SEMICOLON IS THE FIX

  await writeChart("cashflow_waterfall.png", config);
}

// ------------------------------
// MAIN EXECUTION
// ------------------------------
async function main() {
  console.log("🚀 Generating Riverbend Heights Institutional Chart Pack...");

  await generateIrrScenarioChart();
  await generateCashFlowChart();
  await generateCashFlow5yrChart();
  await generateExpenseRatioChart();
  await generateBreakEvenOccupancyChart();
  await generateBreakEvenDscrChart();
  await generateNoiWaterfallChart();
  await generateRenovationRoiChart();
  await generateDealScoreBarChart();
  await generateDealScoreRadarChart();
  await generateRiskRadarChart();
  await generateCashflowWaterfallChart();

  console.log("🔥 ALL Riverbend charts generated in:", chartsDir);
}

main().catch((err) => {
  console.error("❌ Chart generation failed:", err);
  process.exit(1);
});
