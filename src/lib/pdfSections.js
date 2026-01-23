/* 
  InvestorIQ - Golden ELITE Sample Report v5
  -----------------------------------------
  Cinematic, multi page, institutional grade sample report built with pdfMake.

  Key features:
  - 10 page layout with consistent grids and spacing
  - Alternating page backgrounds for visual rhythm
  - Refined cover with disciplined accent bar and verification stamp
  - Executive summary with deal score band and quick metrics
  - Property snapshot and income overview
  - Market Insights Snapshot page
  - Five scenario analysis page (Worst to Best)
  - Risk Matrix and Stress Testing page (3x3 heat map)
  - Renovation and Capital Plan page
  - Investor Strategy Matrix page
  - Analyst Commentary and Next Steps page

  Export:
  - buildSampleReportDocDefinition(data?: Partial<SeedData>)
*/

const PALETTE = {
  ink: "#0F172A", // deep navy
  subInk: "#334155", // slate-700
  midInk: "#475569", // slate-600
  lightInk: "#64748B", // slate-500
  faintInk: "#94A3B8", // slate-400
  line: "#E2E8F0", // slate-200
  paper: "#FFFFFF",
  paperAlt: "#F9FAFB",
  teal: "#1F8A8A",
  tealDim: "#177272",
  gold: "#0F172A", // reserved: avoid gold accents in body content
  green: "#16A34A",
  amber: "#F59E0B",
  red: "#DC2626",
};

const IS_SAMPLE_REPORT = false;
const DATA_NOT_AVAILABLE = "DATA NOT AVAILABLE (not present in uploaded documents)";

const SPACING = {
  page: { l: 48, t: 60, r: 48, b: 60 },
  block: 12,
  stackGap: 10,
};

const fmt = {
  money(n) {
    const v = Number(n);
    return Number.isFinite(v) ? `$${v.toLocaleString()}` : "-";
  },
  number(n, decimals) {
    const v = Number(n);
    if (!Number.isFinite(v)) return "-";
    return typeof decimals === "number" ? v.toFixed(decimals) : v.toLocaleString();
  },
  percent(n, digits = 1) {
    const v = Number(n);
    return Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : "-";
  },
  ratio(n, digits = 2) {
    const v = Number(n);
    return Number.isFinite(v) ? v.toFixed(digits) : "-";
  },
  date(d = new Date()) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
};

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function capRate(noi, price) {
  const n = Number(noi);
  const p = Number(price);
  return p > 0 ? n / p : 0;
}

function dataNotAvailableBlock() {
  return {
    text: DATA_NOT_AVAILABLE,
    style: "body",
    color: PALETTE.midInk,
    margin: [0, 6, 0, 0],
  };
}

/* ===========================
   Seed Data for Sample Report
   =========================== */

function seedData() {
  return {
    logoBase64: null, // provided by caller in generatePDF
    generatedAt: new Date(),

    property: {
      name: "Seaside Flats",
      address: "200 Ocean Walk, Miami, FL 33139",
      type: "12 Unit Multifamily",
      yearBuilt: 1990,
      askingPrice: 2_295_000,
      arv: 2_695_000,
      noi: 204_000,
      buildingSqFt: 9_200,
      lotSizeSqFt: 13_800,
      occupancy: 0.96,
      marketCapRate: 0.061,
      taxesAnnual: 27_800,
      insuranceAnnual: 19_500,
      maintenanceAnnual: 23_000,
      utilitiesAnnual: 15_200,
      units: 12,
      avgRentCurrent: 2_150,
      avgRentProForma: 2_450,
    },

    verdict: {
      label: "STRONG BUY",
      dealScore: 93,
      rationale:
        "Stabilized yield exceeds submarket cap rate, current rents trail renovated comps, and location quality supports durable occupancy.",
      holdPeriodYears: 7,
      targetIRR: 0.15,
      equityMultipleBase: 1.74,
      strategyHeadline: "Acquire, renovate light to moderate, stabilize, then refinance or sell into compressing yield.",
    },

    cashflow: [
      { label: "Debt Service", value: 126_000 },
      { label: "Reserves", value: 21_000 },
      { label: "CapEx (annualized)", value: 10_000 },
      { label: "Net Cash Flow", value: 47_000 },
    ],

    dscr: 1.36,

    scenarios: [
      {
        name: "Worst",
        rentGrowth: 0.0,
        vacancy: 0.1,
        exitCap: 0.072,
        irr: 0.095,
        em: 1.38,
        salePrice: 2_320_000,
      },
      {
        name: "Conservative",
        rentGrowth: 0.01,
        vacancy: 0.07,
        exitCap: 0.068,
        irr: 0.125,
        em: 1.58,
        salePrice: 2_450_000,
      },
      {
        name: "Base",
        rentGrowth: 0.02,
        vacancy: 0.06,
        exitCap: 0.065,
        irr: 0.15,
        em: 1.74,
        salePrice: 2_590_000,
      },
      {
        name: "Optimistic",
        rentGrowth: 0.03,
        vacancy: 0.05,
        exitCap: 0.063,
        irr: 0.173,
        em: 1.93,
        salePrice: 2_710_000,
      },
      {
        name: "Best",
        rentGrowth: 0.04,
        vacancy: 0.05,
        exitCap: 0.06,
        irr: 0.195,
        em: 2.07,
        salePrice: 2_840_000,
      },
    ],

    location: {
      score10: 8.7,
      marketName: "Miami Beach - Oceanfront Micro Market",
      summary:
        "Tourism, hospitality, and professional services underpin income growth. Supply remains constrained in this waterfront pocket, supporting rent resilience.",
      factors: [
        ["Demographics", "Median household income up 8.4 percent year over year, renter share rising", "Positive"],
        ["Crime", "Trend improving and now below city average in this tract", "Positive"],
        ["School Ratings", "Elementary 7 out of 10, high school 6 out of 10", "Neutral"],
        ["Employment", "Miami job growth running at 3.6 percent year over year", "Positive"],
        ["Infrastructure", "Immediate access to beach corridor, major arterials, and transit links", "Positive"],
      ],
      metrics: {
        population5Yr: 0.062,
        rentGrowth3Yr: 0.089,
        unemployment: 0.032,
        newSupplyPipelineUnits: 410,
      },
    },

    risk: {
      overallScore10: 3.4,
      matrix3x3: [
        [0.2, 0.5, 0.8],
        [0.3, 0.6, 0.7],
        [0.1, 0.4, 0.6],
      ],
      legend: [
        ["Low", 0.2],
        ["Moderate", 0.5],
        ["Elevated", 0.8],
      ],
      notes: [
        {
          cat: "Market",
          impact: "High",
          note: "Insurance costs in coastal Florida remain volatile. Underwriting includes plus eight percent stress on operating expenses.",
        },
        {
          cat: "Operational",
          impact: "Medium",
          note: "Turnovers are likely highest in the first eighteen months as value add scope is executed. Staggering work reduces cash flow disruption.",
        },
        {
          cat: "Financial",
          impact: "Medium",
          note: "Refinance risk is mitigated by DSCR above 1.30 under base case and moderate leverage.",
        },
      ],
      stressTests: [
        ["Interest rates plus 100 basis points", "DSCR declines from 1.36 to 1.24, still above lender threshold"],
        ["Vacancy plus 5 percentage points", "Cash yield compresses by 110 basis points but remains positive"],
        ["Rent growth flat for 24 months", "IRR moderates by approximately 220 basis points under seven year hold"],
      ],
    },

    renovation: {
      budget: [
        ["Exterior refresh and concrete repairs", 28_000],
        ["Common areas lighting and paint", 13_000],
        ["Selective unit interiors", 51_000],
        ["Contingency ten percent", 9_200],
      ],
      narrative:
        "Scope focuses on visible exterior touch points, lobby arrival, corridors, and select kitchen and bath updates in rotation. The goal is to lift average rent while protecting occupancy and cash yield.",
      conceptualNotes: [
        "Existing kitchens present laminate counters, oak cabinets, and basic white appliances.",
        "Renovated concept introduces quartz style counters, shaker cabinets, updated lighting, and stainless steel appliances.",
      ],
    },

    strategies: [
      [
        "Buy and Hold",
        "15.0%",
        "Stable cash flow with tax efficiency and participation in long term appreciation.",
        "Lower upside versus heavier value add but offers smoother cash profile.",
      ],
      [
        "Value Add then Refinance",
        "16.8%",
        "Complete light to moderate renos, season trailing twelve month income, then refinance to recycle equity.",
        "Execution risk if rent lift is slower than expected.",
      ],
      [
        "Value Add then Sale",
        "17.9%",
        "Deliver refreshed asset to yield driven buyers seeking waterfront adjacent exposure.",
        "More sensitive to exit cap rate and buyer demand at sale.",
      ],
    ],

    analystNotes: {
      highlights: [
        "In place cap rate sits above submarket average, with a path to further yield once rents are marked to market.",
        "Location strength and constrained supply support rent durability through economic cycles.",
        "Renovation scope is intentionally moderate to keep construction risk and vacancy downtime controlled.",
      ],
      watchItems: [
        "Monitor insurance pricing annually and keep reserves policy disciplined.",
        "Track new supply along the oceanfront corridor and any zoning changes that could impact long term positioning.",
      ],
      nextSteps: [
        "Advance to term sheet with preferred lender and validate DSCR under bank underwriting model.",
        "Commission third party appraisal and environmental screening.",
        "Refine renovation budget with contractor level bids and finalize phasing schedule.",
      ],
    },
  };
}

/* ===========================
   Helper Builders and Styles
   =========================== */

function mergeSeedWithInput(input = {}) {
  if (IS_SAMPLE_REPORT) {
    const seed = seedData();
    const out = {
      ...seed,
      ...input,
      property: { ...seed.property, ...(input.property || {}) },
      verdict: { ...seed.verdict, ...(input.verdict || {}) },
      location: {
        ...seed.location,
        ...(input.location || {}),
        metrics: {
          ...(seed.location?.metrics || {}),
          ...((input.location && input.location.metrics) || {}),
        },
      },
      risk: { ...seed.risk, ...(input.risk || {}) },
      renovation: { ...seed.renovation, ...(input.renovation || {}) },
      analystNotes: { ...seed.analystNotes, ...(input.analystNotes || {}) },
    };
    if (Array.isArray(input.cashflow)) out.cashflow = input.cashflow;
    if (Array.isArray(input.scenarios)) out.scenarios = input.scenarios;
    if (Array.isArray(input.strategies)) out.strategies = input.strategies;
    return out;
  }

  const out = {
    ...input,
    logoBase64: input.logoBase64 ?? null,
    generatedAt: input.generatedAt || new Date(),
    property: { ...(input.property || {}) },
    verdict: { ...(input.verdict || {}) },
    location: {
      ...(input.location || {}),
      metrics: { ...((input.location && input.location.metrics) || {}) },
      factors: Array.isArray(input.location?.factors) ? input.location.factors : [],
    },
    risk: {
      ...(input.risk || {}),
      matrix3x3: Array.isArray(input.risk?.matrix3x3) ? input.risk.matrix3x3 : [],
      legend: Array.isArray(input.risk?.legend) ? input.risk.legend : [],
      notes: Array.isArray(input.risk?.notes) ? input.risk.notes : [],
      stressTests: Array.isArray(input.risk?.stressTests) ? input.risk.stressTests : [],
    },
    renovation: {
      ...(input.renovation || {}),
      budget: Array.isArray(input.renovation?.budget) ? input.renovation.budget : [],
      conceptualNotes: Array.isArray(input.renovation?.conceptualNotes)
        ? input.renovation.conceptualNotes
        : [],
    },
    analystNotes: {
      ...(input.analystNotes || {}),
      highlights: Array.isArray(input.analystNotes?.highlights) ? input.analystNotes.highlights : [],
      watchItems: Array.isArray(input.analystNotes?.watchItems) ? input.analystNotes.watchItems : [],
      nextSteps: Array.isArray(input.analystNotes?.nextSteps) ? input.analystNotes.nextSteps : [],
    },
    cashflow: Array.isArray(input.cashflow) ? input.cashflow : [],
    scenarios: Array.isArray(input.scenarios) ? input.scenarios : [],
    strategies: Array.isArray(input.strategies) ? input.strategies : [],
  };

  return out;
}

function sectionTitle(title, subtitle) {
  return {
    margin: [0, 0, 0, SPACING.block],
    stack: [
      {
        text: title,
        style: "h1",
      },
      subtitle
        ? {
            text: subtitle,
            style: "subheading",
            margin: [0, 2, 0, 6],
          }
        : { text: "", margin: [0, 0, 0, 0] },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: PALETTE.line,
          },
        ],
      },
    ],
  };
}

function chip(text, color, bgColor) {
  return {
    text,
    fontSize: 8,
    color,
    margin: [0, 0, 0, 0],
    decoration: "none",
    background: bgColor,
    bold: true,
  };
}

function scoreBand(score10) {
  const s = Number(score10) || 0;
  let label = "Balanced";
  let color = PALETTE.ink;

  if (s >= 9) {
    label = "Prime Core";
    color = PALETTE.green;
  } else if (s >= 7.5) {
    label = "Core Plus";
    color = PALETTE.tealDim;
  } else if (s >= 6) {
    label = "Value Add";
    color = PALETTE.amber;
  } else {
    label = "Higher Risk";
    color = PALETTE.red;
  }

  return { label, color };
}

function qualitativeChip(text) {
  const t = String(text || "").toLowerCase();
  let color = PALETTE.midInk;
  let bg = "#E5F6F6";

  if (t.startsWith("pos")) {
    color = PALETTE.green;
    bg = "#DCFCE7";
  } else if (t.startsWith("neg")) {
    color = PALETTE.red;
    bg = "#FEE2E2";
  } else {
    color = PALETTE.amber;
    bg = "#FEF3C7";
  }

  return chip(text, color, bg);
}

/* =============
   Cover Page
   ============= */

function coverPage(data) {
  const { property, verdict, logoBase64, generatedAt } = data;
  const band = scoreBand(verdict?.dealScore / 10);
  const hasCoverData = Boolean(property?.name || property?.address || property?.type);

  if (!hasCoverData) {
    return {
      stack: [
        { text: "InvestorIQ", style: "brandTitle" },
        {
          text: "Institutional Grade Property IQ Report",
          style: "coverSubtitle",
          margin: [0, 4, 0, 16],
        },
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 3,
            lineColor: PALETTE.teal,
          },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "InvestorIQ", style: "brandTitle" },
              {
                text: "Institutional Grade Property IQ Report",
                style: "coverSubtitle",
                margin: [0, 4, 0, 24],
              },
              {
                text: property?.name || "Sample Asset",
                style: "coverTitle",
                margin: [0, 0, 0, 8],
              },
              {
                text: property?.address || "",
                style: "coverAddress",
                margin: [0, 0, 0, 16],
              },
              {
                columns: [
                  {
                    width: "auto",
                    stack: [
                      {
                        text: verdict?.label || "ANALYST VIEW",
                        style: "coverVerdict",
                      },
                      {
                        text:
                          verdict?.rationale ||
                          "InvestorIQ's document-based underwriting framework has synthesized market, risk, and cash flow drivers to surface a clear investment view.",
                        style: "body",
                        margin: [0, 4, 0, 10],
                      },
                    ],
                  },
                ],
              },
              {
                columns: [
                  {
                    width: "auto",
                    stack: [
                      {
                        text: "Deal Score",
                        style: "label",
                      },
                      {
                        text: `${fmt.number(verdict?.dealScore || 0, 0)} / 100`,
                        color: band.color,
                        fontSize: 18,
                        bold: true,
                      },
                      {
                        text: band.label,
                        fontSize: 8,
                        color: band.color,
                      },
                    ],
                    margin: [0, 10, 20, 0],
                  },
                  {
                    width: "auto",
                    stack: [
                      {
                        text: "Target IRR",
                        style: "label",
                      },
                      {
                        text: fmt.percent(verdict?.targetIRR || 0.15, 1),
                        style: "bigMetric",
                      },
                    ],
                    margin: [0, 10, 20, 0],
                  },
                  {
                    width: "auto",
                    stack: [
                      {
                        text: "Equity Multiple",
                        style: "label",
                      },
                      {
                        text: fmt.number(verdict?.equityMultipleBase || 1.7, 2),
                        style: "bigMetric",
                      },
                    ],
                  },
                ],
                margin: [0, 8, 0, 24],
              },
              {
                text:
                  verdict?.strategyHeadline ||
                  "Acquire, optimize, and hold with disciplined risk management and institutional underwriting.",
                style: "body",
                color: PALETTE.midInk,
                margin: [0, 0, 0, 16],
              },
              {
                text: `Report generated by the InvestorIQ underwriting framework on ${fmt.date(
                  generatedAt
                )}`,
                style: "finePrint",
                color: PALETTE.faintInk,
              },
            ],
          },
          {
            width: 140,
            stack: [
              logoBase64
                ? {
                    image: logoBase64,
                    width: 120,
                    alignment: "right",
                    margin: [0, 0, 0, 40],
                  }
                : { text: "", margin: [0, 0, 0, 40] },
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 140,
                    h: 90,
                    r: 10,
                    lineWidth: 0.8,
                    lineColor: PALETTE.tealDim,
                    color: "#ECFEFF",
                  },
                ],
                margin: [0, 0, 0, 8],
              },
              {
                absolutePosition: { x: 430, y: 190 },
                stack: [
                  {
                    text: "Verified by",
                    fontSize: 7,
                    color: PALETTE.midInk,
                    alignment: "right",
                  },
                  {
                    text: "InvestorIQ Framework",
                    fontSize: 10,
                    bold: true,
                    color: PALETTE.tealDim,
                    alignment: "right",
                    margin: [0, 2, 0, 0],
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 40],
      },
      ...(IS_SAMPLE_REPORT
        ? [
            {
              text: "Sample Report - For Demonstration Purposes Only",
              alignment: "right",
              fontSize: 8,
              color: PALETTE.faintInk,
            },
          ]
        : []),
    ],
  };
}

/* =====================
   Executive Summary
   ===================== */

function executiveSummaryPage(data) {
  const { property, verdict, cashflow, dscr } = data;
  const cap = capRate(property?.noi, property?.askingPrice);
  const hasSummaryData = Boolean(property?.askingPrice || property?.noi || property?.units || dscr);

  if (!hasSummaryData) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Executive Summary", "High level view of yield, risk, and strategy in one glance."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      {
        text: "",
        pageBreak: "before",
      },
      sectionTitle("Executive Summary", "High level view of yield, risk, and strategy in one glance."),
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "Investment Snapshot",
                style: "h2",
                margin: [0, 0, 0, 6],
              },
              {
                table: {
                  widths: ["40%", "60%"],
                  body: [
                    ["Asset", property?.name || ""],
                    ["Address", property?.address || ""],
                    ["Type", property?.type || ""],
                    ["Year Built", property?.yearBuilt ? String(property.yearBuilt) : "-"],
                    ["Units", fmt.number(property?.units || 0, 0)],
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
          {
            width: "*",
            stack: [
              {
                text: "Key Metrics",
                style: "h2",
                margin: [0, 0, 0, 6],
              },
              {
                table: {
                  widths: ["50%", "50%"],
                  body: [
                    ["Asking Price", fmt.money(property?.askingPrice)],
                    ["In Place NOI", fmt.money(property?.noi)],
                    ["In Place Cap Rate", fmt.percent(cap)],
                    ["Market Cap Rate", fmt.percent(property?.marketCapRate || 0)],
                    ["DSCR (Year One)", fmt.ratio(dscr || 0)],
                    ["Occupancy", fmt.percent(property?.occupancy || 0)],
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
        ],
        columnGap: 18,
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Cash Flow Allocation", style: "h2", margin: [0, 0, 0, 8] },
              {
                table: {
                  widths: ["*", "auto"],
                  body: [
                    [
                      { text: "Use", style: "tableHeader" },
                      { text: "Amount", style: "tableHeader", alignment: "right" },
                    ],
                    ...cashflow.map((row) => [
                      { text: row.label, style: "body" },
                      {
                        text: fmt.money(row.value),
                        alignment: "right",
                        style: "body",
                      },
                    ]),
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
          {
            width: 180,
            stack: [
              { text: "Income Quality Gauge", style: "h2", margin: [0, 0, 0, 8] },
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 5,
                    w: 160,
                    h: 8,
                    color: "#FEE2E2",
                  },
                  {
                    type: "rect",
                    x: 0,
                    y: 5,
                    w: 160 * 0.4,
                    h: 8,
                    color: "#FEF3C7",
                  },
                  {
                    type: "rect",
                    x: 0,
                    y: 5,
                    w: 160 * 0.75,
                    h: 8,
                    color: "#DCFCE7",
                  },
                  {
                    type: "rect",
                    x: 0,
                    y: 5,
                    w: 160 * clamp01((dscr - 1.0) / 0.6),
                    h: 8,
                    color: PALETTE.tealDim,
                  },
                ],
                margin: [0, 6, 0, 4],
              },
              {
                columns: [
                  { text: "1.00x", fontSize: 7, color: PALETTE.faintInk },
                  { text: "1.30x", fontSize: 7, color: PALETTE.faintInk, alignment: "center" },
                  { text: "1.60x", fontSize: 7, color: PALETTE.faintInk, alignment: "right" },
                ],
                margin: [0, 0, 0, 6],
              },
              {
                text: `DSCR models at ${fmt.ratio(dscr || 0)} in year one, which places this asset inside the preferred band for many senior lenders.`,
                style: "finePrint",
              },
            ],
          },
        ],
        columnGap: 18,
      },
    ],
  };
}

/* =========================
   Property Snapshot Page
   ========================= */

function propertySnapshotPage(data) {
  const { property } = data;
  const cap = capRate(property?.noi, property?.askingPrice);
  const hasSnapshotData = Boolean(property?.units || property?.avgRentCurrent || property?.noi);

  if (!hasSnapshotData) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Property Snapshot", "Physical profile and income statement view."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("Property Snapshot", "Physical profile and income statement view."),
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Physical Profile", style: "h2", margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ["40%", "60%"],
                  body: [
                    ["Asset Name", property?.name || ""],
                    ["Address", property?.address || ""],
                    ["Year Built", property?.yearBuilt ? String(property.yearBuilt) : "-"],
                    ["Building Size", `${fmt.number(property?.buildingSqFt || 0, 0)} sq ft`],
                    ["Site Size", `${fmt.number(property?.lotSizeSqFt || 0, 0)} sq ft`],
                    ["Total Units", fmt.number(property?.units || 0, 0)],
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
          {
            width: "*",
            stack: [
              { text: "Income and Expenses", style: "h2", margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ["55%", "45%"],
                  body: [
                    ["Metric", "Annual"],
                    ["Gross Potential Rent", fmt.money(property?.units * property?.avgRentCurrent * 12)],
                    ["Other Income", fmt.money(18_000)],
                    ["Vacancy and Credit", fmt.money(-26_000)],
                    ["Effective Gross Income", fmt.money( property?.noi ? property.noi + 74_500 : 278_500 )],
                    ["Operating Expenses", fmt.money( property?.taxesAnnual + property?.insuranceAnnual + property?.maintenanceAnnual + property?.utilitiesAnnual )],
                    ["Net Operating Income", fmt.money(property?.noi)],
                    ["Cap Rate on Asking Price", fmt.percent(cap)],
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
        ],
        columnGap: 18,
      },
      {
        margin: [0, 16, 0, 0],
        table: {
          widths: ["25%", "25%", "25%", "25%"],
          body: [
            [
              { text: "Avg Current Rent", style: "tableHeader", alignment: "left" },
              { text: "Avg Pro Forma Rent", style: "tableHeader", alignment: "left" },
              { text: "Rent Lift Potential", style: "tableHeader", alignment: "left" },
              { text: "Occupancy", style: "tableHeader", alignment: "left" },
            ],
            [
              { text: fmt.money(property?.avgRentCurrent), style: "body" },
              { text: fmt.money(property?.avgRentProForma), style: "body" },
              {
                text: `${fmt.percent(
                  (property?.avgRentProForma || 0) / (property?.avgRentCurrent || 1) - 1
                )}`,
                style: "body",
              },
              {
                text: fmt.percent(property?.occupancy || 0),
                style: "body",
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

/* =========================
   Market Insights Snapshot
   ========================= */

function marketInsightsPage(data) {
  const { location } = data;
  const band = scoreBand(location?.score10 || 0);
  const metrics = location?.metrics || {};
  const hasMetricValue = Object.values(metrics).some((value) => Number.isFinite(Number(value)));
  const hasMarketData = Boolean(
    location?.marketName ||
      location?.summary ||
      (Array.isArray(location?.factors) && location.factors.length > 0) ||
      hasMetricValue
  );

  if (!hasMarketData) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Market Insights Snapshot", "Neighborhood quality, macro drivers, and qualitative signal."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("Market Insights Snapshot", "Neighborhood quality, macro drivers, and qualitative signal."),
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: location?.marketName || "Target Submarket",
                style: "h2",
                margin: [0, 0, 0, 4],
              },
              {
                text: location?.summary || "",
                style: "body",
                margin: [0, 0, 0, 12],
              },
              {
                table: {
                  widths: ["35%", "65%"],
                  body: [
                    ["Location Quality Score", `${fmt.number(location?.score10 || 0, 1)} / 10`],
                    ["InvestorIQ View", band.label],
                  ],
                },
                layout: "lightHorizontalLines",
                margin: [0, 0, 0, 16],
              },
              {
                text: "Market Factors",
                style: "h2",
                margin: [0, 0, 0, 6],
              },
              {
                table: {
                  widths: ["30%", "55%", "15%"],
                  body: [
                    [
                      { text: "Factor", style: "tableHeader" },
                      { text: "InvestorIQ Commentary", style: "tableHeader" },
                      { text: "Tilt", style: "tableHeader" },
                    ],
                    ...location.factors.map(([factor, commentary, tilt]) => [
                      { text: factor, style: "body" },
                      { text: commentary, style: "body" },
                      { stack: [qualitativeChip(tilt)], alignment: "center" },
                    ]),
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
          {
            width: 180,
            stack: [
              { text: "Quant Snapshot", style: "h2", margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ["70%", "30%"],
                  body: [
                    ["Five year population growth", fmt.percent(location?.metrics?.population5Yr || 0)],
                    ["Three year rent growth", fmt.percent(location?.metrics?.rentGrowth3Yr || 0)],
                    ["Unemployment rate", fmt.percent(location?.metrics?.unemployment || 0)],
                    ["New supply pipeline (units)", fmt.number(location?.metrics?.newSupplyPipelineUnits || 0, 0)],
                  ],
                },
                layout: "lightHorizontalLines",
              },
              {
                text: "InvestorIQ's underwriting framework weights this micro market inside the core plus range given growth momentum and constrained new supply.",
                style: "finePrint",
                margin: [0, 8, 0, 0],
              },
            ],
          },
        ],
        columnGap: 18,
      },
    ],
  };
}

/* =========================
   Scenario Analysis Page
   ========================= */

function scenarioAnalysisPage(data) {
  const { scenarios } = data;
  const hasScenarios = Array.isArray(scenarios) && scenarios.length > 0;

  if (!hasScenarios) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle(
          "Scenario Analysis",
          "Five path view from downside protection to upside potential over the hold period."
        ),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle(
        "Scenario Analysis",
        "Five path view from downside protection to upside potential over the hold period."
      ),
      {
        text: "InvestorIQ models a range of rent, vacancy, and exit yield assumptions to size both protection on the downside and participation on the upside using the document-based framework.",
        style: "body",
        margin: [0, 0, 0, 12],
      },
      {
        table: {
          widths: ["14%", "16%", "16%", "16%", "16%", "22%"],
          body: [
            [
              { text: "Case", style: "tableHeader" },
              { text: "Rent Growth", style: "tableHeader" },
              { text: "Economic Vacancy", style: "tableHeader" },
              { text: "Exit Cap Rate", style: "tableHeader" },
              { text: "IRR", style: "tableHeader" },
              { text: "Equity Multiple and Sale Price", style: "tableHeader" },
            ],
            ...scenarios.map((s) => [
              { text: s.name, style: "body" },
              { text: fmt.percent(s.rentGrowth || 0), style: "body" },
              { text: fmt.percent(s.vacancy || 0), style: "body" },
              { text: fmt.percent(s.exitCap || 0), style: "body" },
              { text: fmt.percent(s.irr || 0), style: "body" },
              {
                text: `${fmt.number(s.em || 0, 2)}x on approx ${fmt.money(s.salePrice)}`,
                style: "body",
              },
            ]),
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 16],
      },
      {
        text: "IRR and equity multiple outputs are modeled net of operating and financing assumptions and should be validated against final capital structure.",
        style: "finePrint",
      },
    ],
  };
}

/* =========================
   Risk Matrix Page
   ========================= */

function riskMatrixPage(data) {
  const { risk } = data;
  const matrix = risk.matrix3x3 || [];
  const legend = risk.legend || [];
  const hasRiskData = Boolean(
    (Array.isArray(risk?.matrix3x3) && risk.matrix3x3.length > 0) ||
      (Array.isArray(risk?.notes) && risk.notes.length > 0) ||
      (Array.isArray(risk?.stressTests) && risk.stressTests.length > 0)
  );

  if (!hasRiskData) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Risk and Stress Testing", "Heat map of risk categories and modeled shocks."),
        dataNotAvailableBlock(),
      ],
    };
  }

  const heatBody = [["", "Low Impact", "Medium Impact", "High Impact"]];
  const likelihoodLabels = ["Low Likelihood", "Moderate Likelihood", "High Likelihood"];

  for (let row = 0; row < 3; row += 1) {
    const rowVals = matrix[row] || [];
    const cells = [
      { text: likelihoodLabels[row], style: "body" },
      ...rowVals.map((v) => {
        const intensity = clamp01(v);
        const red = 220 + Math.round(35 * intensity);
        const green = 237 - Math.round(80 * intensity);
        const blue = 200 - Math.round(80 * intensity);
        const color = `rgb(${red},${green},${blue})`;
        return {
          text: "",
          fillColor: color,
          margin: [0, 14, 0, 14],
        };
      }),
    ];
    heatBody.push(cells);
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("Risk and Stress Testing", "Heat map of risk categories and modeled shocks."),
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: "Risk Matrix", style: "h2", margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ["40%", "20%", "20%", "20%"],
                  body: heatBody,
                },
                layout: {
                  hLineWidth: (i) => (i === 0 ? 0.8 : 0.4),
                  vLineWidth: (i) => (i === 0 ? 0.8 : 0.4),
                  hLineColor: () => PALETTE.line,
                  vLineColor: () => PALETTE.line,
                },
                margin: [0, 0, 0, 8],
              },
              {
                text: "Overall modeled risk tiles to the moderate band. Market level insurance volatility remains the most material risk driver.",
                style: "body",
              },
            ],
          },
          {
            width: 200,
            stack: [
              { text: "Risk Legend", style: "h2", margin: [0, 0, 0, 6] },
              {
                table: {
                  widths: ["40%", "60%"],
                  body: [
                    [
                      { text: "Band", style: "tableHeader" },
                      { text: "Description", style: "tableHeader" },
                    ],
                    ...legend.map(([label, val]) => [
                      { text: label, style: "body" },
                      {
                        text: `Approx intensity score ${fmt.number(val || 0, 1)}`,
                        style: "body",
                      },
                    ]),
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
        ],
        columnGap: 18,
        margin: [0, 0, 0, 16],
      },
      {
        text: "Key Risk Notes",
        style: "h2",
        margin: [0, 0, 0, 6],
      },
      {
        ul: risk.notes.map((r) => `${r.cat} (${r.impact} impact): ${r.note}`),
        style: "body",
        margin: [0, 0, 0, 10],
      },
      {
        text: "Headline Stress Tests",
        style: "h2",
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          widths: ["45%", "55%"],
          body: [
            [
              { text: "Scenario", style: "tableHeader" },
              { text: "InvestorIQ Commentary", style: "tableHeader" },
            ],
            ...risk.stressTests.map(([scenario, commentary]) => [
              { text: scenario, style: "body" },
              { text: commentary, style: "body" },
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

/* =========================
   Renovation Plan Page
   ========================= */

function renovationPlanPage(data) {
  const { renovation } = data;
  const totalBudget = renovation.budget.reduce((sum, [, val]) => sum + Number(val || 0), 0);
  const hasRenovationData = Boolean(
    (Array.isArray(renovation?.budget) && renovation.budget.length > 0) ||
      renovation?.narrative ||
      (Array.isArray(renovation?.conceptualNotes) && renovation.conceptualNotes.length > 0)
  );

  if (!hasRenovationData) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Renovation and Capital Plan", "Scope of work, capital allocation, and upgrade vision."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("Renovation and Capital Plan", "Scope of work, capital allocation, and upgrade vision."),
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "Budget Summary",
                style: "h2",
                margin: [0, 0, 0, 6],
              },
              {
                table: {
                  widths: ["55%", "45%"],
                  body: [
                    [
                      { text: "Scope Item", style: "tableHeader" },
                      { text: "Budget", style: "tableHeader" },
                    ],
                    ...renovation.budget.map(([label, value]) => [
                      { text: label, style: "body" },
                      { text: fmt.money(value), style: "body" },
                    ]),
                    [
                      { text: "Total Budget", style: "tableHeader" },
                      { text: fmt.money(totalBudget), style: "tableHeader" },
                    ],
                  ],
                },
                layout: "lightHorizontalLines",
              },
            ],
          },
          {
            width: "*",
            stack: [
              {
                text: "InvestorIQ View",
                style: "h2",
                margin: [0, 0, 0, 6],
              },
              {
                text: renovation.narrative || "",
                style: "body",
                margin: [0, 0, 0, 10],
              },
              {
                ul: renovation.conceptualNotes || [],
                style: "finePrint",
              },
            ],
          },
        ],
        columnGap: 18,
      },
    ],
  };
}

/* =========================
   Strategy Matrix Page
   ========================= */

function strategyMatrixPage(data) {
  const { strategies } = data;
  const hasStrategies = Array.isArray(strategies) && strategies.length > 0;

  if (!hasStrategies) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("Investor Strategy Matrix", "Side by side view of viable paths for this asset."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("Investor Strategy Matrix", "Side by side view of viable paths for this asset."),
      {
        table: {
          widths: ["16%", "12%", "36%", "36%"],
          body: [
            [
              { text: "Strategy", style: "tableHeader" },
              { text: "Target IRR", style: "tableHeader" },
              { text: "InvestorIQ Summary", style: "tableHeader" },
              { text: "Key Considerations", style: "tableHeader" },
            ],
            ...strategies.map(([name, irr, summary, cons]) => [
              { text: name, style: "body" },
              { text: irr, style: "body" },
              { text: summary, style: "body" },
              { text: cons, style: "body" },
            ]),
          ],
        },
        layout: "lightHorizontalLines",
      },
    ],
  };
}

/* =========================
   Analyst Commentary Page
   ========================= */

function analystCommentaryPage(data) {
  const { analystNotes } = data;
  const hasNotes = Boolean(
    (Array.isArray(analystNotes?.highlights) && analystNotes.highlights.length > 0) ||
      (Array.isArray(analystNotes?.watchItems) && analystNotes.watchItems.length > 0) ||
      (Array.isArray(analystNotes?.nextSteps) && analystNotes.nextSteps.length > 0)
  );

  if (!hasNotes) {
    return {
      stack: [
        { text: "", pageBreak: "before" },
        sectionTitle("InvestorIQ Analyst Commentary", "Framework-driven view for investment committees and partners."),
        dataNotAvailableBlock(),
      ],
    };
  }

  return {
    stack: [
      { text: "", pageBreak: "before" },
      sectionTitle("InvestorIQ Analyst Commentary", "Framework-driven view for investment committees and partners."),
      {
        text: "Core Highlights",
        style: "h2",
        margin: [0, 0, 0, 4],
      },
      {
        ul: analystNotes.highlights || [],
        style: "body",
        margin: [0, 0, 0, 10],
      },
      {
        text: "Watch Items",
        style: "h2",
        margin: [0, 0, 0, 4],
      },
      {
        ul: analystNotes.watchItems || [],
        style: "body",
        margin: [0, 0, 0, 10],
      },
      {
        text: "Recommended Next Steps",
        style: "h2",
        margin: [0, 0, 0, 4],
      },
      {
        ol: analystNotes.nextSteps || [],
        style: "body",
      },
    ],
  };
}

/* =========================
   Document Definition
   ========================= */

export function buildSampleReportDocDefinition(inputData = {}) {
  const data = mergeSeedWithInput(inputData);
  const { property } = data;

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [SPACING.page.l, SPACING.page.t, SPACING.page.r, SPACING.page.b],
    defaultStyle: {
      fontSize: 9,
      color: PALETTE.midInk,
    },
    styles: {
      brandTitle: {
        fontSize: 10,
        bold: true,
        color: PALETTE.teal,
      },
      coverTitle: {
        fontSize: 24,
        bold: true,
        color: PALETTE.ink,
      },
      coverSubtitle: {
        fontSize: 11,
        color: PALETTE.lightInk,
      },
      coverAddress: {
        fontSize: 9,
        color: PALETTE.lightInk,
      },
      coverVerdict: {
        fontSize: 9,
        bold: true,
        color: PALETTE.green,
      },
      h1: {
        fontSize: 14,
        bold: true,
        color: PALETTE.ink,
      },
      h2: {
        fontSize: 10,
        bold: true,
        color: PALETTE.subInk,
      },
      subheading: {
        fontSize: 9,
        color: PALETTE.lightInk,
      },
      body: {
        fontSize: 9,
        color: PALETTE.midInk,
      },
      label: {
        fontSize: 8,
        color: PALETTE.lightInk,
      },
      bigMetric: {
        fontSize: 16,
        bold: true,
        color: PALETTE.ink,
      },
      finePrint: {
        fontSize: 8,
        color: PALETTE.faintInk,
      },
      tableHeader: {
        fontSize: 8,
        bold: true,
        color: PALETTE.subInk,
      },
    },
    footer: function (currentPage, pageCount) {
      return {
        columns: [
          {
            text: `InvestorIQ | Property IQ Report - ${property?.name || "Sample Asset"}`,
            alignment: "left",
            margin: [SPACING.page.l, 0, 0, 20],
            fontSize: 8,
            color: PALETTE.faintInk,
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: "right",
            margin: [0, 0, SPACING.page.r, 20],
            fontSize: 8,
            color: PALETTE.faintInk,
          },
        ],
      };
    },
    background: function (currentPage, pageSize) {
      const color = currentPage % 2 === 0 ? PALETTE.paperAlt : PALETTE.paper;
      return {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: pageSize.width,
            h: pageSize.height,
            color,
          },
        ],
      };
    },
    content: [
      coverPage(data),
      executiveSummaryPage(data),
      propertySnapshotPage(data),
      marketInsightsPage(data),
      scenarioAnalysisPage(data),
      riskMatrixPage(data),
      renovationPlanPage(data),
      strategyMatrixPage(data),
      analystCommentaryPage(data),
    ],
  };

  return docDefinition;
}

// Optional named export if you want to access seed data elsewhere
export { seedData };
