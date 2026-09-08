import { publicationMoney as money, publicationPercent as percent } from "./publication-format.js";

export const INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS = `
.iq-phase8b [data-iq-elite-operating] { margin-bottom:18px; }
.iq-phase8b [data-iq-elite-operating] > .card { padding-top:0 !important; }
.iq-phase8b [data-iq-elite-operating] .summary-strip,
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0; margin:0 0 14px; border-top:1px solid var(--iq-ve-rule-strong); border-bottom:0; }
.iq-phase8b [data-iq-elite-operating] .summary-strip > div,
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip > div { padding:10px 11px 11px 0; min-width:0; }
.iq-phase8b [data-iq-elite-operating] .summary-strip > div + div,
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip > div + div { padding-left:11px; border-left:1px solid var(--iq-ve-rule); }
.iq-phase8b [data-iq-elite-operating] .summary-strip span,
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip span { display:block; font-family:var(--font-mono); font-size:6.2pt; font-weight:500; letter-spacing:.07em; text-transform:uppercase; color:var(--iq-ve-muted); }
.iq-phase8b [data-iq-elite-operating] .summary-strip strong,
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip strong { display:block; margin-top:5px; font-family:var(--font-body); font-size:15pt; font-weight:400; line-height:1.08; color:var(--iq-ve-ink); }
.iq-phase8b .iq-ve-earnings-bridge { margin:2px 0 18px; padding:12px 0 14px; border-top:1px solid var(--iq-ve-rule-strong); border-bottom:1px solid var(--iq-ve-gold-soft); break-inside:avoid-page; page-break-inside:avoid; }
.iq-phase8b .iq-ve-exhibit-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:6px; }
.iq-phase8b .iq-ve-exhibit-heading span { display:block; font-family:var(--font-mono); font-size:6.2pt; font-weight:500; letter-spacing:.09em; text-transform:uppercase; color:var(--iq-ve-muted); }
.iq-phase8b .iq-ve-exhibit-heading strong { display:block; margin-top:3px; font-family:var(--font-display); font-size:18pt; font-weight:400; line-height:1.05; color:var(--iq-ve-ink); }
.iq-phase8b .iq-ve-exhibit-heading em { font-family:var(--font-mono); font-size:5.2pt; font-style:normal; color:var(--iq-ve-muted); white-space:nowrap; }
.iq-phase8b .iq-ve-earnings-bridge-svg { display:block; width:100%; height:auto; overflow:visible; }
.iq-phase8b .iq-ve-chart-axis { stroke:#9aa59d; stroke-width:1; }
.iq-phase8b .iq-ve-chart-connector { stroke:#a5afa8; stroke-width:1; stroke-dasharray:4 4; }
.iq-phase8b .iq-ve-chart-positive { fill:#143e34; }
.iq-phase8b .iq-ve-chart-deduction { fill:#bfa367; }
.iq-phase8b .iq-ve-chart-value { font-family:var(--font-mono); font-size:12px; font-weight:500; fill:#203c34; }
.iq-phase8b .iq-ve-chart-label { font-family:var(--font-body); font-size:11px; font-weight:500; fill:#344c44; }
.iq-phase8b .iq-ve-chart-note { font-family:var(--font-mono); font-size:8px; font-weight:400; fill:#69766f; }
.iq-phase8b [data-iq-elite="debt-intelligence-v1"] [data-iq-elite07-surface],
.iq-phase8b [data-iq-elite="transaction-diligence-v1"] [data-iq-elite06-surface],
.iq-phase8b [data-iq-section="eliteValuationReconciliation"] [data-iq-subsection] { margin-top:16px; padding-top:10px; border-top:1px solid var(--iq-ve-rule); }
.iq-phase8b [data-iq-elite="debt-intelligence-v1"] [data-iq-elite07-surface]:first-of-type,
.iq-phase8b [data-iq-elite="transaction-diligence-v1"] [data-iq-elite06-surface]:first-of-type { margin-top:6px; }
.iq-phase8b .iq-debt-profile { padding:10px 12px !important; border-top:2px solid var(--iq-ve-forest) !important; background:#fff !important; }
.iq-phase8b .iq-debt-profile + .iq-debt-profile { border-left:1px solid var(--iq-ve-rule) !important; }
.iq-phase8b .iq-scenario-label { display:inline-block; margin:0 0 7px; padding:3px 6px; border:1px solid #d9c995; font-family:var(--font-mono); font-size:6.2pt; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:#6d5c31; background:#fbf8ee; }
.iq-phase8b [data-iq-evidence-class="source_backed"] { color:#29483e; }
.iq-phase8b .iq-evidence-label { display:inline-block; font-family:var(--font-mono); font-size:6.2pt; font-weight:500; letter-spacing:.035em; color:var(--iq-ve-muted); white-space:nowrap; }
.iq-phase8b .iq-evidence-label[data-iq-evidence-class="scenario"] { color:#776433; }
.iq-phase8b .iq-evidence-label[data-iq-evidence-class="third_party_context"] { color:#5e6a65; }
.iq-phase8b .diligence-coverage-table td { vertical-align:top; }
.iq-phase8b [data-iq-elite06-surface="open-diligence-items"] li,
.iq-phase8b [data-iq-elite06-surface="investor-questions"] li,
.iq-phase8b [data-iq-elite07-surface="capacity-interpretation"] li { margin-bottom:7px !important; line-height:1.4; }
.iq-phase8b [data-iq-section="eliteValuationReconciliation"] .card[data-iq-subsection="accepted-value-indication"] { border-top:2px solid var(--iq-ve-forest) !important; padding-top:10px !important; }
.iq-phase8b [data-iq-section="eliteValuationReconciliation"] [data-iq-subsection="core-reconciliation-impact"] { padding:11px 13px; border-left:3px solid var(--iq-ve-gold); background:var(--iq-ve-paper-alt); }
.iq-phase8b-screening .phase8b-screening-evidence-page .phase8b-key-metrics,
.iq-phase8b-screening .phase8b-screening-observations-page .iq-ic-signal-grid,
.iq-phase8b-screening .phase8b-reconciliation-block,
.iq-phase8b-screening .phase8b-diligence-priorities { margin-top:16px !important; }
.iq-phase8b-screening .phase8b-reconciliation-block { border-left:3px solid var(--iq-ve-gold) !important; background:var(--iq-ve-paper-alt) !important; }
.iq-phase8b-screening .phase8b-screening-evidence-page .phase7-evidence-conviction-matrix { border:0 !important; border-top:1px solid var(--iq-ve-rule-strong) !important; padding:10px 0 !important; }
@media print {
  .iq-phase8b .iq-ve-earnings-bridge { break-inside:avoid-page !important; page-break-inside:avoid !important; }
  .iq-phase8b [data-iq-elite-operating] .summary-strip { break-inside:avoid-page; page-break-inside:avoid; }
  .iq-phase8b [data-iq-elite="transaction-diligence-v1"] .diligence-coverage-table thead,
  .iq-phase8b [data-iq-elite="debt-intelligence-v1"] table thead { display:table-header-group !important; }
}
`;

function finiteDisplayMetric(receipt = null) {
  if (receipt?.displayReady !== true) return null;
  const value = Number(receipt?.value);
  return Number.isFinite(value) ? value : null;
}

function svgText(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderVisualEliteOperatingEarningsBridge(noiAnalysis = null) {
  const egi = finiteDisplayMetric(noiAnalysis?.egi);
  const opex = finiteDisplayMetric(noiAnalysis?.operatingExpenses);
  const noi = finiteDisplayMetric(noiAnalysis?.noi);
  const noiMargin = finiteDisplayMetric(noiAnalysis?.noiMargin);
  if (!(egi > 0) || !(opex >= 0) || !(noi >= 0)) return "";
  if (noiAnalysis?.noiIdentityReconciles !== true) return "";
  const arithmeticNoi = egi - opex;
  const tolerance = Math.max(1, Math.abs(egi) * 0.001);
  if (Math.abs(arithmeticNoi - noi) > tolerance) return "";
  const baseline = 146;
  const plotHeight = 104;
  const egiHeight = plotHeight;
  const opexHeight = Math.max(0, Math.min(plotHeight, (opex / egi) * plotHeight));
  const noiHeight = Math.max(0, Math.min(plotHeight, (noi / egi) * plotHeight));
  const egiTop = baseline - egiHeight;
  const noiTop = baseline - noiHeight;
  const expenseBottom = Math.min(baseline, egiTop + opexHeight);
  const expenseShare = egi > 0 ? opex / egi : null;
  const resolvedNoiMargin = noiMargin ?? (egi > 0 ? noi / egi : null);
  return `<style id="investoriq-visual-elite-analysis-v1">${INVESTORIQ_VISUAL_ELITE_ANALYSIS_CSS}</style><figure class="iq-ve-earnings-bridge no-break" data-iq-visual-elite-exhibit="t12-earnings-bridge-v1">
    <div class="iq-ve-exhibit-heading"><div><span>T12 Earnings Bridge</span><strong>From income to NOI</strong></div><em>Annual dollars / reported operating basis</em></div>
    <svg class="iq-ve-earnings-bridge-svg" viewBox="0 0 720 202" role="img" aria-label="Earnings bridge from effective gross income through operating expenses to net operating income">
      <line x1="48" y1="${baseline}" x2="676" y2="${baseline}" class="iq-ve-chart-axis" />
      <line x1="190" y1="${egiTop}" x2="292" y2="${egiTop}" class="iq-ve-chart-connector" />
      <line x1="412" y1="${expenseBottom}" x2="512" y2="${noiTop}" class="iq-ve-chart-connector" />
      <rect x="70" y="${egiTop}" width="120" height="${egiHeight}" rx="2" class="iq-ve-chart-positive" />
      <rect x="292" y="${egiTop}" width="120" height="${opexHeight}" rx="2" class="iq-ve-chart-deduction" />
      <rect x="512" y="${noiTop}" width="120" height="${noiHeight}" rx="2" class="iq-ve-chart-positive" />
      <text x="130" y="${Math.max(18, egiTop - 8)}" text-anchor="middle" class="iq-ve-chart-value">${svgText(money(egi))}</text>
      <text x="352" y="${Math.max(18, egiTop - 8)}" text-anchor="middle" class="iq-ve-chart-value">(${svgText(money(opex))})</text>
      <text x="572" y="${Math.max(18, noiTop - 8)}" text-anchor="middle" class="iq-ve-chart-value">${svgText(money(noi))}</text>
      <text x="130" y="164" text-anchor="middle" class="iq-ve-chart-label">Effective gross income</text>
      <text x="352" y="164" text-anchor="middle" class="iq-ve-chart-label">Operating expenses</text>
      <text x="572" y="164" text-anchor="middle" class="iq-ve-chart-label">Net operating income</text>
      <text x="130" y="181" text-anchor="middle" class="iq-ve-chart-note">Reported T12 income</text>
      <text x="352" y="181" text-anchor="middle" class="iq-ve-chart-note">${svgText(expenseShare === null ? "" : `${percent(expenseShare)} of EGI`)}</text>
      <text x="572" y="181" text-anchor="middle" class="iq-ve-chart-note">${svgText(resolvedNoiMargin === null ? "" : `${percent(resolvedNoiMargin)} of EGI`)}</text>
    </svg>
  </figure>`;
}
