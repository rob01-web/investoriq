const PHASE7_MARKER = "elite-report-redesign-v1";

function normalizeMode(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function resolveLane(reportMode = "") {
  const mode = normalizeMode(reportMode);
  if (mode === "screening" || mode === "screening_v1" || mode === "screening_report") return "screening";
  if (
    mode === "v1_core" ||
    mode === "underwriting" ||
    mode === "underwriting_report" ||
    mode === "full_underwriting" ||
    mode.startsWith("full_underwriting_")
  ) return "underwriting";
  return null;
}

function addBodyPresentationClass(html = "", lane = null) {
  if (!lane) return String(html || "");
  return String(html || "").replace(/<body\b([^>]*)>/i, (match, attrs = "") => {
    const laneClass = `iq-phase7 iq-phase7-${lane}`;
    if (/\bclass\s*=\s*["'][^"']*["']/i.test(attrs)) {
      return `<body${attrs.replace(/\bclass\s*=\s*(["'])([^"']*)\1/i, (_full, quote, existing) => `class=${quote}${existing} ${laneClass}${quote}`)} data-iq-phase7="${PHASE7_MARKER}">`;
    }
    return `<body${attrs} class="${laneClass}" data-iq-phase7="${PHASE7_MARKER}">`;
  });
}

function annotateExistingSurfaces(html = "") {
  return String(html || "")
    .replace(/class="section-header"/g, 'class="section-header iq-phase7-section-header"')
    .replace(/class="verdict-block"/g, 'class="verdict-block iq-phase7-decision-cockpit"')
    .replace(/class="metric-grid"/g, 'class="metric-grid iq-phase7-metric-grid"')
    .replace(/class="grid-2-balanced"/g, 'class="grid-2-balanced iq-phase7-balanced-grid"')
    .replace(/class="card no-break"/g, 'class="card no-break iq-phase7-card"')
    .replace(/class="card"/g, 'class="card iq-phase7-card"')
    .replace(/class="chart-block/g, 'class="chart-block iq-phase7-chart-block');
}

const PHASE7_STYLE = `
<style id="investoriq-phase7-elite-report-design">
  :root {
    --iq7-ink: #101914;
    --iq7-forest: #10291d;
    --iq7-forest-soft: #183a29;
    --iq7-gold: #b8953f;
    --iq7-gold-soft: #d9c58a;
    --iq7-paper: #fbfaf6;
    --iq7-panel: #f5f5f0;
    --iq7-rule: #ddd9cf;
    --iq7-muted: #667168;
    --iq7-positive: #315d46;
    --iq7-caution: #8b6d29;
    --iq7-risk: #84453f;
  }

  .iq-phase7 {
    color: var(--iq7-ink);
    font-variant-numeric: tabular-nums;
    text-rendering: optimizeLegibility;
  }

  .iq-phase7 .report-container {
    background: #fff;
  }

  .iq-phase7 .cover-wrap {
    background:
      radial-gradient(circle at 84% 18%, rgba(184,149,63,.16), transparent 23%),
      linear-gradient(145deg, #0d2117 0%, #112b1e 58%, #0a1912 100%);
  }

  .iq-phase7 .cover-wrap::after {
    width: 1.35in;
    height: 1.35in;
    border-color: rgba(217,197,138,.16);
  }

  .iq-phase7 .cover-brand-name {
    letter-spacing: .08em;
  }

  .iq-phase7 .cover-prop-name {
    max-width: 6.3in;
    letter-spacing: -.03em;
    line-height: .96;
  }

  .iq-phase7 .cover-divider {
    width: .72in;
    opacity: .88;
  }

  .iq-phase7 .cover-verdict-value {
    letter-spacing: -.025em;
  }

  .iq-phase7 .section {
    padding-top: 20px;
    padding-bottom: 20px;
  }

  .iq-phase7 .iq-phase7-section-header {
    margin-bottom: 18px;
    padding-bottom: 10px;
    display: grid;
    grid-template-columns: minmax(0,1fr) auto;
    align-items: end;
    column-gap: 14px;
    border-bottom: 1px solid var(--iq7-rule);
  }

  .iq-phase7 .iq-phase7-section-header::after {
    width: .42in;
    height: 2px;
    background: var(--iq7-gold);
  }

  .iq-phase7 .section-header-title {
    font-size: 19pt;
    line-height: 1.02;
    color: var(--iq7-ink);
  }

  .iq-phase7 .section-header-sub {
    max-width: 3.2in;
    text-align: right;
    color: var(--iq7-muted);
    font-style: normal;
    font-size: 7.5pt;
    line-height: 1.35;
  }

  .iq-phase7 .iq-phase7-card {
    border: 1px solid var(--iq7-rule);
    border-top: 2px solid var(--iq7-forest-soft);
    border-radius: 2px;
    padding: 12px 14px;
    background: #fff;
  }

  .iq-phase7 .iq-phase7-card + .iq-phase7-card {
    margin-top: 10px;
  }

  .iq-phase7 .subsection-title {
    color: var(--iq7-muted);
    letter-spacing: .12em;
    font-size: 7.5px;
  }

  .iq-phase7 .iq-phase7-decision-cockpit {
    position: relative;
    padding: 16px 18px;
    border: 1px solid #d7d3c8;
    border-left: 4px solid var(--iq7-gold);
    background: linear-gradient(135deg, #fff 0%, var(--iq7-paper) 100%);
  }

  .iq-phase7 .iq-phase7-decision-cockpit::before {
    content: "DECISION COCKPIT";
    display: block;
    margin-bottom: 8px;
    color: var(--iq7-muted);
    font-size: 7px;
    font-weight: 700;
    letter-spacing: .16em;
  }

  .iq-phase7 .iq-phase7-metric-grid,
  .iq-phase7 .metric-grid {
    gap: 8px;
  }

  .iq-phase7 .metric,
  .iq-phase7 .metric-card,
  .iq-phase7 .kpi-card {
    border: 1px solid var(--iq7-rule);
    border-radius: 2px;
    background: var(--iq7-paper);
    padding: 10px 12px;
  }

  .iq-phase7 .metric-value,
  .iq-phase7 .kpi-value {
    color: var(--iq7-forest);
    letter-spacing: -.025em;
  }

  .iq-phase7 table {
    margin-top: 10px;
    border-collapse: separate;
    border-spacing: 0;
  }

  .iq-phase7 th {
    color: #4f5b53;
    background: #f7f6f1;
    border-top: 1px solid var(--iq7-rule);
    border-bottom: 1px solid #cbc6ba;
    font-size: 8px;
    letter-spacing: .08em;
  }

  .iq-phase7 td {
    border-bottom-color: #e7e3db;
  }

  .iq-phase7 tr:nth-child(even) td {
    background: #fbfaf7;
  }

  .iq-phase7 .iq-phase7-chart-block,
  .iq-phase7 .evidence-chart,
  .iq-phase7 .institutional-chart {
    border: 1px solid var(--iq7-rule);
    background: #fff;
    padding: 12px;
    border-radius: 2px;
  }

  .iq-phase7 .institutional-visual-grid,
  .iq-phase7 .iq-phase7-balanced-grid {
    gap: 12px;
  }

  .iq-phase7 .source-register,
  .iq-phase7 .quality-manifest,
  .iq-phase7 [data-section="source-register"],
  .iq-phase7 [data-section="quality-manifest"] {
    background: var(--iq7-paper);
  }

  .iq-phase7-screening .section {
    padding-top: 16px;
    padding-bottom: 16px;
  }

  .iq-phase7-screening .section-header-title {
    font-size: 17.5pt;
  }

  .iq-phase7-screening .iq-phase7-decision-cockpit {
    margin-top: 4px;
  }

  .iq-phase7-underwriting .section-header-title {
    font-size: 19.5pt;
  }

  .iq-phase7-underwriting .institutional-visual-section {
    background: linear-gradient(180deg, #fff 0%, #fbfaf7 100%);
    border-top: 1px solid #ece8df;
    border-bottom: 1px solid #ece8df;
    padding-left: 10px;
    padding-right: 10px;
  }

  @media print {
    .iq-phase7 .iq-phase7-card,
    .iq-phase7 .iq-phase7-decision-cockpit,
    .iq-phase7 .iq-phase7-chart-block {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .iq-phase7 .section-header,
    .iq-phase7 .subsection-title {
      break-after: avoid;
      page-break-after: avoid;
    }
  }
</style>`;

function injectPresentationStyle(html = "") {
  const source = String(html || "");
  if (source.includes('id="investoriq-phase7-elite-report-design"')) return source;
  if (/<\/head>/i.test(source)) return source.replace(/<\/head>/i, `${PHASE7_STYLE}\n</head>`);
  return `${PHASE7_STYLE}${source}`;
}

export function applyPhase7EliteReportPresentation(html, { reportMode = null } = {}) {
  const lane = resolveLane(reportMode);
  const source = String(html || "");
  if (!lane || !source) return source;
  const annotated = annotateExistingSurfaces(addBodyPresentationClass(source, lane));
  return injectPresentationStyle(annotated);
}

export function phase7EliteReportPresentationMetadata(reportMode = null) {
  const lane = resolveLane(reportMode);
  return {
    marker: PHASE7_MARKER,
    lane,
    evidencePreserving: true,
    hardcodedPageCount: false,
    addsFinancialMetrics: false,
    addsSourceFacts: false,
  };
}
