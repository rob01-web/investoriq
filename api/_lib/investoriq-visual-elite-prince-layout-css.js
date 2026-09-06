export const INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS_VERSION = "investoriq-visual-elite-prince-layout-v1";

export const INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS = `
/* Visual ELITE Prince-safe layout normalization. Presentation only. */

/* Executive metric surfaces: replace CSS Grid with predictable wrapping flex. */
.iq-phase8b .iq-ic-metric-grid {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .iq-ic-metric-grid > .iq-ic-metric {
  flex:0 0 33.333% !important;
  width:33.333% !important;
  box-sizing:border-box !important;
}
.iq-phase8b .iq-ic-secondary-grid {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .iq-ic-secondary-grid > .iq-ic-secondary-metric {
  display:flex !important;
  align-items:baseline !important;
  justify-content:space-between !important;
  flex:0 0 50% !important;
  width:50% !important;
  box-sizing:border-box !important;
  gap:8px !important;
}
.iq-phase8b .iq-ic-secondary-metric .iq-ic-secondary-label { flex:1 1 auto !important; }
.iq-phase8b .iq-ic-secondary-metric .iq-ic-secondary-value { flex:0 0 auto !important; }

/* Observation, question, and reconciliation surfaces. */
.iq-phase8b .iq-ic-signal-grid,
.iq-phase8b .iq-ic-question-grid {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .iq-ic-signal-grid > .iq-ic-signal-panel,
.iq-phase8b .iq-ic-question-grid > .iq-ic-question-item {
  flex:0 0 50% !important;
  width:50% !important;
  box-sizing:border-box !important;
  padding-right:12px !important;
}
.iq-phase8b .iq-ic-signal-grid > .iq-ic-signal-panel:nth-child(even),
.iq-phase8b .iq-ic-question-grid > .iq-ic-question-item:nth-child(even) {
  padding-left:12px !important;
  padding-right:0 !important;
}
.iq-phase8b .iq-ic-reconciliation-grid,
.iq-phase8b .reconciliation-metric-grid {
  display:flex !important;
  flex-wrap:nowrap !important;
  gap:0 !important;
}
.iq-phase8b .iq-ic-reconciliation-grid > .iq-ic-reconciliation-metric,
.iq-phase8b .reconciliation-metric-grid > div {
  flex:0 0 25% !important;
  width:25% !important;
  box-sizing:border-box !important;
}

/* Shared summary strips: use compact horizontal flex instead of stacked Grid fallbacks. */
.iq-phase8b .summary-strip {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .summary-strip > div {
  box-sizing:border-box !important;
  flex:1 1 1.42in !important;
}
.iq-phase8b [data-iq-elite-operating] .summary-strip > div,
.iq-phase8b .debt-capacity-strip > div {
  flex:0 0 25% !important;
  width:25% !important;
}
.iq-phase8b [data-iq-elite06-surface="diligence-coverage"] .summary-strip > div,
.iq-phase8b .data-coverage-strip > div {
  flex:0 0 33.333% !important;
  width:33.333% !important;
}

/* Balanced columns and publication grids. */
.iq-phase8b .grid-2-balanced {
  display:flex !important;
  align-items:flex-start !important;
  gap:18px !important;
}
.iq-phase8b .grid-2-balanced > * {
  flex:1 1 0 !important;
  min-width:0 !important;
}
.iq-phase8b .institutional-visual-grid,
.iq-phase8b .methodology-compact-grid {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .institutional-visual-grid > *,
.iq-phase8b .methodology-compact-grid > * {
  flex:0 0 33.333% !important;
  width:33.333% !important;
  box-sizing:border-box !important;
  padding-right:12px !important;
}
.iq-phase8b .institutional-visual-grid > *:nth-child(3n),
.iq-phase8b .methodology-compact-grid > *:nth-child(3n) { padding-right:0 !important; }

/* Evidence chart rows retain their intended label / bar / value proportions. */
.iq-phase8b .evidence-chart-row {
  display:flex !important;
  align-items:center !important;
  gap:8px !important;
}
.iq-phase8b .evidence-chart-row > .evidence-chart-label { flex:1.25 1 0 !important; min-width:0 !important; }
.iq-phase8b .evidence-chart-row > .evidence-chart-track { flex:2 1 0 !important; min-width:0 !important; }
.iq-phase8b .evidence-chart-row > .evidence-chart-value { flex:.9 1 0 !important; min-width:0 !important; }
.iq-phase8b .evidence-chart-stats {
  display:flex !important;
  flex-wrap:nowrap !important;
  gap:8px !important;
}
.iq-phase8b .evidence-chart-stats > * { flex:1 1 50% !important; }

/* Legacy/opening helpers that can survive in composed Underwriting HTML. */
.iq-phase8b .iq-ic-focus-grid,
.iq-phase8a-underwriting .phase8a-exec-metrics,
.iq-phase8a-underwriting .phase8a-exec-columns {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b .iq-ic-focus-grid > *,
.iq-phase8a-underwriting .phase8a-exec-metrics > * { flex:0 0 50% !important; width:50% !important; box-sizing:border-box !important; }
.iq-phase8a-underwriting .phase8a-exec-columns > * { flex:0 0 33.333% !important; width:33.333% !important; box-sizing:border-box !important; }

/* Screening support surfaces must use the same Prince-safe publication geometry. */
.iq-phase8b-screening .phase8b-governance-grid,
.iq-phase8b-screening .iq-ic-signal-grid,
.iq-phase8b-screening .phase8b-methodology ul {
  display:flex !important;
  flex-wrap:wrap !important;
  gap:0 !important;
}
.iq-phase8b-screening .phase8b-governance-grid > *,
.iq-phase8b-screening .iq-ic-signal-grid > *,
.iq-phase8b-screening .phase8b-methodology ul > li {
  flex:0 0 50% !important;
  width:50% !important;
  box-sizing:border-box !important;
  padding-right:12px !important;
}
.iq-phase8b-screening .iq-ic-reconciliation-grid {
  display:flex !important;
  flex-wrap:nowrap !important;
}
.iq-phase8b-screening .iq-ic-reconciliation-grid > * {
  flex:0 0 25% !important;
  width:25% !important;
  box-sizing:border-box !important;
}

/* Explicitly preserve the already-approved Prince-safe cover and decision opening. */
.iq-phase8b .cover-meta-grid,
.iq-phase8b .phase8a-investment-decision-band,
.iq-phase8b .phase8b-screening-decision-band,
.iq-phase8b .phase8a-exec-columns.phase8b-screening-decision-panels,
.iq-phase8b .phase8b-screening-decision-panels {
  grid-template-columns:none !important;
}
`;
