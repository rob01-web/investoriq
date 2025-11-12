
/* InvestorIQ – Golden ELITE v4 (Cinematic Pro, Deep Navy Edition)
   ----------------------------------------------------------------
   Ten-page cinematic, institutional-grade sample built with pdfMake (vector-only).
   Upgrades vs v3:
   - Consistent spacing + alignment grid
   - Alternating page backgrounds for rhythm
   - Larger charts with axis labels & values
   - NEW DSCR semicircle gauge (next to Cashflow pie)
   - NEW Neighborhood Pos/Neutral/Neg mini pie
   - NEW 3×3 Risk Matrix heat map (+legend)
   - Executive Summary adds $/Door
   - Subtitled section banners, softer watermark
*/

/* ==============================
   Palette & Utilities
   ============================== */
const PALETTE = {
  ink: "#0F172A",          // deep navy
  subInk: "#334155",       // slate-700
  midInk: "#475569",       // slate-600
  lightInk: "#64748B",     // slate-500
  faintInk: "#94A3B8",     // slate-400
  line: "#E2E8F0",         // slate-200
  paper: "#FFFFFF",
  paperAlt: "#F9FAFB",
  teal: "#1F8A8A",
  tealDim: "#177272",
  gold: "#C9A227",
  primary: "#0EA5E9",
  green: "#16A34A",
  amber: "#F59E0B",
  red: "#DC2626",
};

// Global spacing constants
const SPACING = {
  page: { l: 48, t: 60, r: 48, b: 60 },
  block: 12,
  stackGap: 12,
};

const fmt = {
  money(n) {
    const v = Number(n);
    return isFinite(v) ? `$${v.toLocaleString()}` : "-";
  },
  number(n) {
    const v = Number(n);
    return isFinite(v) ? v.toLocaleString() : "-";
  },
  percent(n, d = 1) {
    const v = Number(n);
    return isFinite(v) ? `${(v * 100).toFixed(d)}%` : "-";
  },
  date(d = new Date()) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  },
};

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function capRate(noi, price) { const n = Number(noi), p = Number(price); return p > 0 ? n / p : 0; }

/* ==============================
   Elite Sample Seed (prefilled)
   ============================== */
function seedData() {
  // Fresh elite-feel sample: "Seaside Flats" (Miami) — but same economics tier
  return {
    logoBase64: null, // provided by caller if available
    property: {
      name: "Seaside Flats",
      address: "200 Ocean Walk, Miami, FL 33139",
      type: "12-Unit Multifamily",
      yearBuilt: 1990,
      askingPrice: 2295000,
      arv: 2695000,
      noi: 204000,
      buildingSqFt: 9200,
      lotSizeSqFt: 13800,
      occupancy: 0.96,
      marketCapRate: 0.061,
      taxesAnnual: 27800,
      insuranceAnnual: 19500,
      maintenanceAnnual: 23000,
      utilitiesAnnual: 15200,
      units: 12
    },
    verdict: {
      label: "STRONG BUY",
      dealScore: 93,
      rationale: "Stabilized yield exceeds submarket cap; below-market rents with clear path-to-lift; durable occupancy; defensible waterfront-adjacent location."
    },
    cashflow: [
      { label: "Debt Service", value: 126000 },
      { label: "Reserves", value: 21000 },
      { label: "CapEx (annualized)", value: 10000 },
      { label: "Net Cash Flow", value: 47000 },
    ],
    dscr: 1.36, // model DSCR for gauge
    scenarios: [
      { name: "Worst",        rentGrowth: 0.00, vacancy: 0.10, exitCap: 0.072, irr: 0.095, em: 1.38, salePrice: 2320000 },
      { name: "Conservative", rentGrowth: 0.01, vacancy: 0.07, exitCap: 0.068, irr: 0.125, em: 1.58, salePrice: 2450000 },
      { name: "Base",         rentGrowth: 0.02, vacancy: 0.06, exitCap: 0.065, irr: 0.150, em: 1.74, salePrice: 2590000 },
      { name: "Optimistic",   rentGrowth: 0.03, vacancy: 0.05, exitCap: 0.063, irr: 0.173, em: 1.93, salePrice: 2710000 },
      { name: "Best",         rentGrowth: 0.04, vacancy: 0.05, exitCap: 0.060, irr: 0.195, em: 2.07, salePrice: 2840000 },
    ],
    location: {
      score10: 8.7,
      factors: [
        ["Demographics", "Median HH income +8.4% YoY; renter % rising", "Positive"],
        ["Crime Rate", "Improving; below city average in this tract", "Positive"],
        ["School Ratings", "Elementary 7/10; High 6/10", "Neutral"],
        ["Economic Indicators", "Miami job growth +3.6% YoY; hospitality rebound", "Positive"],
        ["Infrastructure", "Transit, beach access, I-395/95 nearby", "Positive"],
      ],
    },
    risk: {
      overallScore10: 3.4,
      // Likelihood × Impact heat-matrix (3×3). Values 0..1 for color intensity.
      matrix3x3: [
        [0.2, 0.5, 0.8],
        [0.3, 0.6, 0.7],
        [0.1, 0.4, 0.6],
      ],
      legend: [
        ["Low", 0.2], ["Moderate", 0.5], ["Elevated", 0.8]
      ],
      notes: [
        { cat: "Market", impact: "High", note: "Insurance volatility in coastal FL — modeled +8% sensitivity." },
        { cat: "Operational", impact: "Medium", note: "Turnover cadence may reduce near-term NOI; stagger work." },
        { cat: "Financial", impact: "Medium", note: "Refi risk if rates stay elevated; DSCR>1.30 mitigant." },
      ]
    },
    renovation: {
      budget: [
        ["Exterior refresh & concrete repairs", 28000],
        ["Common areas (lighting/paint)", 13000],
        ["Select unit interiors", 51000],
        ["Contingency (10%)", 9200],
      ],
      notes: [
        "[Conceptual Image: Existing 1990s kitchen — laminate counters, oak cabinets]",
        "[Conceptual Image: Renovated kitchen — white quartz, shaker cabinets, SS appliances]",
      ],
    },
    strategies: [
      ["Buy & Hold", "15.0%", "Stable cash flow; tax benefits; appreciation", "Lower upside vs. value-add"],
      ["Value-Add", "17.3%", "Rent lift; forced appreciation; higher EM", "Execution risk; capex timing"],
      ["BRRRR",     "16.1%", "Refi recycles equity; strong returns",     "Refi risk; market rate dependence"],
    ],
    compsHeat: {
      columns: ["Size", "Condition", "Proximity"],
      rows: [
        { name: "Comp A", values: [0.78, 0.92, 0.82] },
        { name: "Comp B", values: [0.56, 0.71, 0.62] },
        { name: "Comp C", values: [0.66, 0.81, 0.75] },
      ],
    },
    dealScoreBreakdown: [
      ["Location", 9], ["Cash Flow", 8], ["Risk", 7], ["Value-Add", 9],
      ["Liquidity", 7], ["Market Trend", 8], ["Team/Ops", 8], ["Exit Clarity", 8],
    ],
    analystNotes: [
      "Subject priced ≈$191k/door vs submarket ~$218k/door (≈12% discount).",
      "Occupancy 96% vs submarket 92% suggests resilient demand.",
      "Insurance sensitivity modeled; broker quote validated.",
      "Value-add scope staged to protect near-term DSCR >1.30.",
    ],
  };
}

/* ==============================
   Canvas Primitives
   ============================== */
function gradientCoverBg() {
  // Subtle stacked gradient (white -> soft gray)
  const ops = [];
  for (let i = 0; i < 80; i++) {
    const shade = 255 - i * 1.5;
    ops.push({ type: "rect", x: 0, y: i * 8, w: 595, h: 8, color: `rgb(${shade},${shade + 6},${shade + 8})` });
  }
  return ops;
}

function pageSoftBgBlock(color = PALETTE.paperAlt) {
  return { canvas: [{ type: "rect", x: -48, y: -60, w: 695, h: 842, color, fillOpacity: 1 }], absolutePosition: { x: 0, y: 0 } };
}

function sectionBanner(title, subtitle = "") {
  const s = [];
  s.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 2, lineColor: PALETTE.teal }] });
  s.push({ text: title, margin: [0, 6, 0, subtitle ? 2 : 8], fontSize: 16, bold: true, color: PALETTE.ink });
  if (subtitle) s.push({ text: subtitle, margin: [0, 0, 0, 10], fontSize: 9, color: PALETTE.lightInk });
  return { stack: s, margin: [0, 8, 0, 12] };
}

function verdictRibbonTeal(text = "STRONG BUY — Deal Score 93/100") {
  return [
    {
      canvas: [
        { type: "rect", x: 0, y: 0, w: 380, h: 30, color: PALETTE.teal },
        { type: "rect", x: 380, y: 0, w: 18, h: 30, color: PALETTE.teal },
        { type: "polyline", points: [{ x: 398, y: 0 }, { x: 414, y: 15 }, { x: 398, y: 30 }], color: PALETTE.teal, lineWidth: 0, closePath: true },
      ],
      width: 414,
      height: 30,
    },
    { text, color: "#FFFFFF", fontSize: 11, bold: true, absolutePosition: { x: 58, y: 4 } },
  ];
}

// Deal Score semicircle 0..100
function dealScoreGauge(score = 90) {
  const cx = 120, cy = 110, r = 80;
  const frac = clamp01(score / 100);
  const ops = [];
  for (let a = 180; a >= 0; a -= 3) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + r * Math.cos(rad + 0.03), y2: cy + r * Math.sin(rad + 0.03), lineWidth: 8, lineColor: PALETTE.line });
  }
  for (let a = 180; a >= 180 * (1 - frac); a -= 3) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + r * Math.cos(rad + 0.03), y2: cy + r * Math.sin(rad + 0.03), lineWidth: 8, lineColor: PALETTE.teal });
  }
  return [
    { canvas: ops, width: 260, height: 160 },
    { text: `${score}/100`, alignment: "center", bold: true, color: PALETTE.teal, margin: [0, -16, 0, 0] },
  ];
}

// DSCR semicircle gauge (range 1.0–2.0+ visualized 0..100%)
function dscrGauge(dscr = 1.30) {
  const pct = clamp01((Number(dscr) - 1.0) / 1.0);
  const cx = 120, cy = 110, r = 70;
  const ops = [];
  for (let a = 180; a >= 0; a -= 3) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + r * Math.cos(rad + 0.03), y2: cy + r * Math.sin(rad + 0.03), lineWidth: 7, lineColor: PALETTE.line });
  }
  for (let a = 180; a >= 180 * (1 - pct); a -= 3) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + r * Math.cos(rad + 0.03), y2: cy + r * Math.sin(rad + 0.03), lineWidth: 7, lineColor: PALETTE.green });
  }
  return [
    { canvas: ops, width: 240, height: 150 },
    { text: `${Number(dscr).toFixed(2)}× DSCR`, alignment: "center", bold: true, color: PALETTE.green, margin: [0, -12, 0, 0] },
  ];
}

function barChart({ labels = [], values = [], w = 520, h = 220, barColor = PALETTE.teal, max = null, valueFmt = (v)=>`${(v*100).toFixed(1)}%` }) {
  const left = 46, bottom = 32, top = 14, right = 14;
  const innerW = w - left - right;
  const innerH = h - top - bottom;

  const safeVals = values.map(v => Number(v) || 0);
  const vmax = max ?? Math.max(...safeVals, 1);

  const gap = 16;
  const barW = Math.max(18, (innerW - gap * (safeVals.length - 1)) / safeVals.length);
  const ops = [
    { type: "line", x1: left, y1: top, x2: left, y2: top + innerH, lineWidth: 1, lineColor: PALETTE.line },
    { type: "line", x1: left, y1: top + innerH, x2: left + innerW, y2: top + innerH, lineWidth: 1, lineColor: PALETTE.line },
  ];

  for (let i = 0; i <= 4; i++) {
    const y = top + innerH - (innerH * i) / 4;
    ops.push({ type: "line", x1: left, y1: y, x2: left + innerW, y2: y, lineWidth: 0.5, lineColor: PALETTE.line });
    const val = vmax * (i / 4);
    ops.push({ text: valueFmt(val), fontSize: 8, color: PALETTE.faintInk, absolutePosition: { x: 2, y: y - 6 } });
  }

  let x = left;
  safeVals.forEach((v, i) => {
    const barH = Math.max(2, (v / vmax) * innerH);
    const y = top + innerH - barH;
    ops.push({ type: "rect", x, y, w: barW, h: barH, color: barColor });
    ops.push({ text: labels[i] ?? "", fontSize: 9, color: PALETTE.subInk, alignment: "center", absolutePosition: { x: x, y: top + innerH + 6 }, width: barW });
    ops.push({ text: valueFmt(v), fontSize: 9, color: PALETTE.midInk, alignment: "center", absolutePosition: { x: x, y: y - 14 }, width: barW });
    x += barW + gap;
  });

  return [{ canvas: ops, width: w, height: h }];
}

function pieChart({ slices = [], w = 260, h = 260, cx = 130, cy = 130, r = 95 }) {
  const ops = [];
  const colors = [PALETTE.teal, PALETTE.gold, "#8B5CF6", PALETTE.green, PALETTE.amber, PALETTE.primary];
  const total = slices.reduce((s, s1) => s + (Number(s1.value) || 0), 0) || 1;
  let ang = -Math.PI / 2;

  slices.forEach((s, i) => {
    const v = Number(s.value) || 0;
    const frac = v / total;
    const next = ang + frac * Math.PI * 2;
    const pts = [{ x: cx, y: cy }];
    for (let t = ang; t <= next; t += Math.max(0.04, frac * 0.3)) pts.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
    ops.push({ type: "polyline", points: pts, color: colors[i % colors.length], lineWidth: 0, closePath: true, fillOpacity: 1 });
    ang = next;
  });

  return [
    { canvas: ops, width: w, height: h },
    { text: `$${Math.round(total).toLocaleString()}`, bold: true, alignment: "center", margin: [0, -132, 0, 0] }
  ];
}

// Mini pie for Neighborhood factor sentiment (Pos/Neu/Neg)
function neighborhoodSentimentPie(factors = []) {
  let pos = 0, neu = 0, neg = 0;
  (factors || []).forEach(f => {
    const tag = (f[2] || "").toLowerCase();
    if (tag.includes("positive")) pos++;
    else if (tag.includes("neutral")) neu++;
    else neg++;
  });
  const slices = [
    { label: "Positive", value: pos },
    { label: "Neutral", value: neu },
    { label: "Negative", value: neg },
  ];
  return pieChart({ slices, w: 200, h: 200, cx: 100, cy: 100, r: 80 });
}

// 3×3 Risk Matrix heat map with legend
function riskHeatMap3x3(grid = [[0.2,0.5,0.8],[0.3,0.6,0.7],[0.1,0.4,0.6]]) {
  const cell = 32, gap = 6, cols = 3, rows = 3;
  const w = cols * (cell + gap) + gap;
  const h = rows * (cell + gap) + gap;
  const ops = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gap + c * (cell + gap);
      const y = gap + r * (cell + gap);
      const t = grid[r][c];
      const color = (t <= 0.33) ? PALETTE.green : (t <= 0.66) ? PALETTE.amber : PALETTE.red;
      const blend = 0.35 + t * 0.45;
      ops.push({ type: "rect", x, y, w: cell, h: cell, color, fillOpacity: blend, lineWidth: 0 });
    }
  }
  ops.push({ type: "rect", x: 0.5, y: 0.5, w: w - 1, h: h - 1, lineWidth: 1, lineColor: PALETTE.line });
  return [{ canvas: ops, width: w, height: h }];
}

function locationGauge(score10 = 8.5) {
  const score = clamp01(score10 / 10);
  const r = 44, cx = 56, cy = 56;
  const ops = [];
  for (let a = 0; a < 360; a += 4) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + (r - 3) * Math.cos(rad), y2: cy + (r - 3) * Math.sin(rad), lineWidth: 3, lineColor: PALETTE.line });
  }
  for (let a = 0; a < 360 * score; a += 4) {
    const rad = (a * Math.PI) / 180;
    ops.push({ type: "line", x1: cx + r * Math.cos(rad), y1: cy + r * Math.sin(rad), x2: cx + (r - 3) * Math.cos(rad), y2: cy + (r - 3) * Math.sin(rad), lineWidth: 3, lineColor: PALETTE.teal });
  }
  return [{ canvas: ops, width: 120, height: 112 }, { text: `${(score * 10).toFixed(1)}/10`, alignment: "center", bold: true, color: PALETTE.teal, margin: [0, -14, 0, 0] }];
}

/* ==============================
   Sections
   ============================== */
function coverPage(data) {
  const { property = {}, logoBase64 } = data;
  return [
    { canvas: gradientCoverBg(), absolutePosition: { x: 0, y: 0 }, width: 595, height: 842 },
    { canvas: [{ type: "rect", x: 0, y: 0, w: 595, h: 8, color: PALETTE.gold }], absolutePosition: { x: 0, y: 0 } },
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "InvestorIQ Property Intelligence Report", fontSize: 28, bold: true, color: PALETTE.ink, margin: [0, 120, 0, 8] },
            { text: "Institutional-Grade Intelligence for Real Estate Investors", fontSize: 13, color: PALETTE.subInk, margin: [0, 0, 0, 18] },
            { text: property.address || "200 Ocean Walk, Miami, FL 33139", fontSize: 11, color: PALETTE.lightInk, margin: [0, 0, 0, 8] },
            { text: fmt.date(new Date()), fontSize: 10, color: PALETTE.lightInk },
            {
              margin: [0, 22, 0, 0],
              table: {
                widths: ["*", "*", "*"],
                body: [
                  [{ text: "Asset Type", style: "k", fillColor: "#FAFAFA" }, { text: "Asking Price", style: "k", fillColor: "#FAFAFA" }, { text: "After-Repair Value (ARV)", style: "k", fillColor: "#FAFAFA" }],
                  [{ text: property.type || "12-Unit Multifamily", style: "v" }, { text: fmt.money(property.askingPrice || 2295000), style: "v" }, { text: fmt.money(property.arv || 2695000), style: "v" }],
                ],
              },
              layout: "lightHorizontalLines",
            },
          ],
        },
        {
          width: 160,
          stack: [
            logoBase64 ? { image: logoBase64, fit: [150, 76], alignment: "right", margin: [0, 120, 0, 0] }
                       : { text: "InvestorIQ", alignment: "right", color: PALETTE.teal, fontSize: 20, margin: [0, 120, 0, 0] },
          ],
        },
      ],
      columnGap: 24,
    },
    { text: " ", pageBreak: "after" },
  ];
}

function execVerdictPage(data) {
  const p = data.property || {};
  const v = data.verdict || {};
  const ribbonText = (v.label || "STRONG BUY") + `  —  Deal Score ${v.dealScore ?? 93}/100`;
  const cap = capRate(p.noi, p.askingPrice);
  const perDoor = p.units ? (Number(p.askingPrice) / Number(p.units)) : null;

  return [
    pageSoftBgBlock(PALETTE.paperAlt),
    sectionBanner("Executive Summary", "Verdict, Key Metrics & Market Position"),
    ...verdictRibbonTeal(ribbonText),
    { text: v.rationale || "InvestorIQ Analyst Rationale: Stabilized yield above market cap; clear rent-lift; durable occupancy; defensible exit.", color: PALETTE.subInk, margin: [0, 36, 0, 16] },

    {
      columns: [
        {
          width: "*",
          table: {
            widths: ["*", "auto"],
            body: [
              [{ text: "Metric", style: "k", fillColor: "#FAFAFA" }, { text: "Value", style: "k", fillColor: "#FAFAFA", alignment: "right" }],
              ["Purchase / Asking", fmt.money(p.askingPrice)],
              ["ARV", fmt.money(p.arv)],
              ["NOI (TTM)", fmt.money(p.noi)],
              ["Cap Rate (on Ask)", fmt.percent(cap, 2)],
              ["Market Cap Rate", fmt.percent(p.marketCapRate, 2)],
              ["Occupancy", fmt.percent(p.occupancy, 1)],
              ["$ / Door", perDoor ? fmt.money(perDoor) : "-"],
              ["Building Size", `${fmt.number(p.buildingSqFt)} sf`],
              ["Lot Size", `${fmt.number(p.lotSizeSqFt)} sf`],
            ].map(([k, v]) => [{ text: k, style: "v" }, { text: v, style: "v", alignment: "right" }])
          },
          layout: "lightHorizontalLines",
        },
        { width: 22, text: "" },
        {
          width: 260,
          stack: [
            { text: "Cap Rate vs Market", style: "h2", margin: [0, 0, 0, 6] },
            ...barChart({
              labels: ["Subject", "Market"],
              values: [cap, p.marketCapRate || 0.061],
              w: 260, h: 160, barColor: PALETTE.teal,
              max: Math.max(cap, p.marketCapRate || 0.061) * 1.2,
              valueFmt: (v)=>`${(v*100).toFixed(1)}%`
            }),
            { text: `Subject: ${fmt.percent(cap, 2)} vs Market: ${fmt.percent(p.marketCapRate, 2)}`, fontSize: 8, color: PALETTE.faintInk, margin: [0, 6, 0, 0] },
          ],
        },
      ],
    },
    { text: " ", pageBreak: "after" },
  ];
}

function dealGaugeAndCashflowPage(data) {
  const dscr = Number(data.dscr ?? seedData().dscr);
  return [
    sectionBanner("Performance Snapshot", "Deal Score, Cashflow Mix & DSCR"),
    {
      columns: [
        { width: 260, stack: [{ text: "Deal Score", style: "h2", margin: [0, 0, 0, 6] }, ...dealScoreGauge((data.verdict?.dealScore ?? 93))] },
        { width: 22, text: "" },
        {
          width: "*",
          stack: [
            { text: "Cashflow Breakdown", style: "h2", margin: [0, 0, 0, 6] },
            {
              columns: [
                { width: 260, stack: [...pieChart({ slices: data.cashflow || seedData().cashflow })] },
                { width: 22, text: "" },
                { width: 240, stack: [{ text: "Debt Service Coverage", style: "h2", margin: [0, 0, 0, 6] }, ...dscrGauge(dscr)] },
              ],
            },
          ],
        },
      ],
    },
    { text: " ", pageBreak: "after" },
  ];
}

function scenariosPage(data) {
  const sc = data.scenarios || seedData().scenarios;
  const headers = [
    { text: "Scenario", style: "k", fillColor: "#FAFAFA" },
    { text: "Rent Growth", style: "k", fillColor: "#FAFAFA", alignment: "right" },
    { text: "Vacancy", style: "k", fillColor: "#FAFAFA", alignment: "right" },
    { text: "Exit Cap", style: "k", fillColor: "#FAFAFA", alignment: "right" },
    { text: "5-Yr IRR", style: "k", fillColor: "#FAFAFA", alignment: "right" },
    { text: "Equity Multiple", style: "k", fillColor: "#FAFAFA", alignment: "right" },
    { text: "Exit Price", style: "k", fillColor: "#FAFAFA", alignment: "right" },
  ];

  const body = [
    headers,
    ...sc.map((r, i) => [
      { text: r.name, style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: fmt.percent(r.rentGrowth, 1), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: fmt.percent(r.vacancy, 1), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: fmt.percent(r.exitCap, 2), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: fmt.percent(r.irr, 1), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: (Number(r.em) || 0).toFixed(2) + "x", style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
      { text: fmt.money(r.salePrice), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
    ]),
  ];

  const irrVals = sc.map((r) => Number(r.irr) || 0);
  const irrLabels = sc.map((r) => r.name);

  return [
    pageSoftBgBlock(PALETTE.paperAlt),
    sectionBanner("5-Year Scenario Projections", "Assumptions & Returns Across Five Cases"),
    { table: { widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto"], body }, layout: "lightHorizontalLines" },
    { text: " ", margin: [0, 10, 0, 6] },
    { text: "IRR Across Scenarios", style: "h2", margin: [0, 0, 0, 6] },
    ...barChart({ labels: irrLabels, values: irrVals, w: 520, h: 220, barColor: PALETTE.teal, max: Math.max(...irrVals) * 1.2, valueFmt: (v)=>`${(v*100).toFixed(1)}%` }),
    { text: "Sensitivity & Break-Even: IRR remains above 12% in conservative case; break-even occupancy ~89% at current expense load.", fontSize: 9, color: PALETTE.faintInk, margin: [0, 8, 0, 0] },
    { text: " ", pageBreak: "after" },
  ];
}

function neighborhoodPage(data) {
  const loc = data.location || seedData().location;
  return [
    sectionBanner("Neighborhood Overview", "Location Score & Factor Sentiment"),
    {
      columns: [
        { width: 140, stack: [{ text: "Location Score", style: "h2", margin: [0, 0, 0, 6] }, ...locationGauge(loc.score10)] },
        { width: 22, text: "" },
        {
          width: "*",
          stack: [
            { text: "Factor Sentiment", style: "h2", margin: [0, 0, 0, 6] },
            ...neighborhoodSentimentPie(loc.factors),
          ],
        },
      ],
    },
    { text: " ", margin: [0, 10, 0, 6] },
    {
      table: {
        widths: ["*", "*", "auto"],
        body: [
          [{ text: "Factor", style: "k", fillColor: "#FAFAFA" }, { text: "Data", style: "k", fillColor: "#FAFAFA" }, { text: "Impact", style: "k", fillColor: "#FAFAFA" }],
          ...loc.factors.map((row, i) => [
            { text: row[0], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
            { text: row[1], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
            { text: row[2], style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
          ]),
        ],
      },
      layout: "lightHorizontalLines",
    },
    { text: " ", pageBreak: "after" },
  ];
}

function riskPage(data) {
  const r = data.risk || seedData().risk;
  return [
    pageSoftBgBlock(PALETTE.paperAlt),
    sectionBanner("Risk Assessment", "Likelihood × Impact Heat Map & Notes"),
    { text: "Risk Matrix (3×3)", style: "h2", margin: [0, 0, 0, 6] },
    ...riskHeatMap3x3(r.matrix3x3),
    { text: " ", margin: [0, 8, 0, 0] },
    {
      columns: [
        { width: "*", stack: r.notes.map(n => ({ text: `${n.cat} (${n.impact}) — ${n.note}`, fontSize: 9, color: PALETTE.subInk, margin: [0, 4, 0, 0] })) },
        {
          width: 160,
          stack: [
            { text: "Legend", style: "h2", margin: [0, 0, 0, 6] },
            { text: "Green = Low  •  Amber = Moderate  •  Red = Elevated", fontSize: 8, color: PALETTE.faintInk },
          ],
        },
      ],
    },
    { text: `Overall Risk Score: ${(r.overallScore10 ?? 3.4).toFixed(1)}/10 (lower is better)`, fontSize: 9, color: PALETTE.faintInk, margin: [0, 10, 0, 0] },
    { text: " ", pageBreak: "after" },
  ];
}

function renovationPage(data) {
  const ren = data.renovation || seedData().renovation;
  const rows = ren.budget || [];
  return [
    sectionBanner("Renovation Analysis", "Budget Allocation & Visual Concept"),
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "Renovation Budget Breakdown", style: "h2", margin: [0, 0, 0, 6] },
            {
              table: {
                widths: ["*", "auto"],
                body: [
                  [{ text: "Line Item", style: "k", fillColor: "#FAFAFA" }, { text: "Amount", style: "k", fillColor: "#FAFAFA", alignment: "right" }],
                  ...rows.map((r, i) => [
                    { text: r[0], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                    { text: fmt.money(r[1]), style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                  ]),
                ],
              },
              layout: "lightHorizontalLines",
            },
            { text: "Post-Renovation Impact: Modeled uplift on rent-ready units with conservative lease-up cadence.", fontSize: 9, color: PALETTE.faintInk, margin: [0, 8, 0, 0] },
          ],
        },
        { width: 24, text: "" },
        {
          width: 250,
          stack: [
            { text: "Conceptual Visuals", style: "h2", margin: [0, 0, 0, 6] },
            ...ren.notes.map(n => ({ text: n, fontSize: 9, color: PALETTE.subInk, margin: [0, 4, 0, 0] })),
          ],
        },
      ],
    },
    { text: " ", pageBreak: "after" },
  ];
}

function strategyNotesPage(data) {
  const strategies = data.strategies || seedData().strategies;
  const scoreRows = data.dealScoreBreakdown || seedData().dealScoreBreakdown;
  const notes = data.analystNotes || seedData().analystNotes;

  return [
    sectionBanner("Investment Strategy & Analyst Notes", "Comparative Returns & Execution Considerations"),
    {
      columns: [
        {
          width: "*",
          stack: [
            { text: "Strategy Comparison", style: "h2", margin: [0, 0, 0, 6] },
            {
              table: {
                widths: ["*", "auto", "*", "*"],
                body: [
                  [{ text: "Strategy", style: "k", fillColor: "#FAFAFA" }, { text: "5-Yr IRR", style: "k", fillColor: "#FAFAFA", alignment: "right" }, { text: "Pros", style: "k", fillColor: "#FAFAFA" }, { text: "Cons", style: "k", fillColor: "#FAFAFA" }],
                  ...strategies.map((r, i) => [
                    { text: r[0], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                    { text: r[1], style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                    { text: r[2], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                    { text: r[3], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                  ]),
                ],
              },
              layout: "lightHorizontalLines",
            },
          ],
        },
        { width: 20, text: "" },
        {
          width: 240,
          stack: [
            { text: "Deal Score Breakdown", style: "h2", margin: [0, 0, 0, 6] },
            {
              table: {
                widths: ["*", "auto"],
                body: [
                  [{ text: "Factor", style: "k", fillColor: "#FAFAFA" }, { text: "Score", style: "k", fillColor: "#FAFAFA", alignment: "right" }],
                  ...scoreRows.map((r, i) => [
                    { text: r[0], style: "v", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                    { text: `${r[1]}/10`, style: "v", alignment: "right", fillColor: i % 2 ? "#FFFFFF" : "#F9FAFB" },
                  ]),
                ],
              },
              layout: "lightHorizontalLines",
            },
          ],
        },
      ],
    },
    { text: "Analyst Commentary & Market Insights", style: "h2", margin: [0, 12, 0, 6] },
    { ul: notes.map(n => ({ text: n, color: PALETTE.ink })), margin: [0, 0, 0, 0] },
    { text: " ", pageBreak: "after" },
  ];
}

function investorSummaryPage(data) {
  const p = data.property || seedData().property;
  const v = data.verdict || seedData().verdict;
  const base = (data.scenarios || seedData().scenarios)[2]; // base case

  return [
    pageSoftBgBlock(PALETTE.paperAlt),
    sectionBanner("Investor Summary Sheet", "Recap of Returns, Valuation & Exit"),
    {
      table: {
        widths: ["*", "auto", "auto"],
        body: [
          [{ text: "Metric", style: "k", fillColor: "#FAFAFA" }, { text: "Value", style: "k", fillColor: "#FAFAFA", alignment: "right" }, { text: "Notes", style: "k", fillColor: "#FAFAFA" }],
          [{ text: "Deal Verdict", style: "v" }, { text: `${v.label} — ${v.dealScore}/100`, style: "v", alignment: "right" }, { text: v.rationale || "Clear rent lift; stable cashflow; realistic exit.", style: "v" }],
          [{ text: "Target IRR (5-Yr)", style: "v" }, { text: fmt.percent(base.irr, 1), style: "v", alignment: "right" }, { text: "Base case; conservative rent growth", style: "v" }],
          [{ text: "Equity Multiple", style: "v" }, { text: (Number(base.em) || 0).toFixed(2) + "x", style: "v", alignment: "right" }, { text: "Across 5-year hold", style: "v" }],
          [{ text: "Cap on Cost (Yr-1, Stab.)", style: "v" }, { text: fmt.percent(capRate(p.noi, p.askingPrice), 2), style: "v", alignment: "right" }, { text: "On total cost basis if applicable", style: "v" }],
          [{ text: "Exit Value", style: "v" }, { text: fmt.money(base.salePrice), style: "v", alignment: "right" }, { text: `Exit cap ~${fmt.percent(base.exitCap, 2)}`, style: "v" }],
          [{ text: "Market Cap Rate", style: "v" }, { text: fmt.percent(p.marketCapRate, 2), style: "v", alignment: "right" }, { text: "Submarket indicative", style: "v" }],
        ],
      },
      layout: "lightHorizontalLines",
    },
    { text: " ", margin: [0, 14, 0, 6] },
    { text: "Generated by the InvestorIQ AI Analyst Engine — Institutional-Grade Reports On Demand.", alignment: "center", bold: true, color: PALETTE.teal },
    { text: " ", margin: [0, 18, 0, 6] },
    { text: "Legal Disclaimer", style: "h2" },
    { text: "This sample is for demonstration purposes only and does not constitute investment advice. All figures are estimates based on provided or assumed data. Investors should conduct independent due diligence and consult qualified professionals before making investment decisions.", fontSize: 8, color: PALETTE.faintInk, margin: [0, 6, 0, 0] },
    { text: " ", pageBreak: "after" },
  ];
}

function deepNavyFinalePage(data) {
  const logoText = "InvestorIQ.ai";
  return [
    { canvas: [{ type: "rect", x: -48, y: -60, w: 695, h: 842, color: PALETTE.ink }], absolutePosition: { x: 0, y: 0 } },
    {
      stack: [
        { text: logoText, alignment: "center", fontSize: 26, bold: true, color: PALETTE.gold, margin: [0, 240, 0, 12] },
        { text: "Institutional Intelligence for Real Estate Investors", alignment: "center", fontSize: 12, color: "#E9E4D0" },
        { text: " ", margin: [0, 12, 0, 0] },
        { canvas: [{ type: "line", x1: 120, y1: 0, x2: 475, y2: 0, lineWidth: 2, lineColor: PALETTE.gold }], margin: [0, 12, 0, 0] },
      ],
      margin: [0, 0, 0, 0]
    },
  ];
}

/* ==============================
   Public Builder (Doc Definition)
   ============================== */
export function buildSampleReportDocDefinition(input) {
  const seed = seedData();
  const data = {
    ...seed,
    ...input,
    property: { ...seed.property, ...(input?.property || {}) },
    verdict: { ...seed.verdict, ...(input?.verdict || {}) },
    cashflow: (input?.cashflow && input.cashflow.length ? input.cashflow : seed.cashflow),
    scenarios: (input?.scenarios && input.scenarios.length ? input.scenarios : seed.scenarios),
    location: { ...seed.location, ...(input?.location || {}) },
    risk: { ...seed.risk, ...(input?.risk || {}) },
    renovation: { ...seed.renovation, ...(input?.renovation || {}) },
    strategies: (input?.strategies && input.strategies.length ? input.strategies : seed.strategies),
    compsHeat: { ...seed.compsHeat, ...(input?.compsHeat || {}) },
    dealScoreBreakdown: (input?.dealScoreBreakdown && input.dealScoreBreakdown.length ? input.dealScoreBreakdown : seed.dealScoreBreakdown),
    analystNotes: (input?.analystNotes && input.analystNotes.length ? input.analystNotes : seed.analystNotes),
    dscr: (input?.dscr != null ? input.dscr : seed.dscr),
  };

  return {
    info: { title: "InvestorIQ Property IQ Report™" },
    compress: true,
    pageSize: "LETTER",
    pageMargins: [SPACING.page.l, SPACING.page.t, SPACING.page.r, SPACING.page.b],
    defaultStyle: { fontSize: 10, color: PALETTE.ink },
    styles: {
      h1: { fontSize: 16, bold: true, color: PALETTE.ink },
      h2: { fontSize: 12, bold: true, color: PALETTE.ink },
      k:  { fontSize: 9, color: PALETTE.subInk },
      v:  { fontSize: 10, color: PALETTE.ink },
      tiny: { fontSize: 8, color: PALETTE.faintInk },
    },
    watermark: { text: "InvestorIQ Confidential", color: "#000000", opacity: 0.03, angle: 40 },
    footer: (page, pages) => ({
      stack: [
        { text: "InvestorIQ.ai | Institutional Intelligence for Real Estate Investors", alignment: "center", fontSize: 8, color: PALETTE.faintInk },
        { text: `Confidential & Proprietary © 2025 InvestorIQ  •  Page ${page} of ${pages}`, alignment: "center", fontSize: 7, color: PALETTE.faintInk },
      ],
    }),
    content: [
      // 1 Cover
      ...coverPage(data),
      // 2 Exec verdict card + metrics
      ...execVerdictPage(data),
      // 3 Gauge + Cashflow + DSCR
      ...dealGaugeAndCashflowPage(data),
      // 4 Scenarios + IRR chart
      ...scenariosPage(data),
      // 5 Neighborhood (gauge + sentiment pie + table)
      ...neighborhoodPage(data),
      // 6 Risk (3×3 heat map + notes)
      ...riskPage(data),
      // 7 Renovation
      ...renovationPage(data),
      // 8 Strategy + Notes
      ...strategyNotesPage(data),
      // 9 Investor Summary
      ...investorSummaryPage(data),
      // 10 Deep Navy CTA
      ...deepNavyFinalePage(data),
    ],
  };
}

// Export palette to keep consistency with your app if desired
export const PALETTE_EXPORT = PALETTE;
