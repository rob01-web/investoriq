import { INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS } from "./investoriq-visual-elite-prince-layout-css.js";

export const INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS_VERSION = "investoriq-visual-elite-typography-v1";

export const INVESTORIQ_VISUAL_ELITE_TYPOGRAPHY_CSS = `
/* Visual ELITE typography normalization. Presentation only. */
.iq-phase8b {
  font-kerning:normal !important;
  font-variant-numeric:proportional-nums !important;
  font-feature-settings:"kern" 1, "pnum" 1 !important;
  word-spacing:normal !important;
}
.iq-phase8b p,
.iq-phase8b li,
.iq-phase8b .body-copy {
  letter-spacing:normal !important;
  word-spacing:0 !important;
  font-kerning:normal !important;
  font-variant-numeric:proportional-nums !important;
  font-feature-settings:"kern" 1, "pnum" 1 !important;
}

/* Keep tabular numerals only where column alignment is useful. */
.iq-phase8b table,
.iq-phase8b .numeric,
.iq-phase8b .numeric-value {
  font-variant-numeric:tabular-nums !important;
  font-feature-settings:"kern" 1, "tnum" 1 !important;
}

/* Executive/customer-facing values use proportional numerals and tighter tracking. */
.iq-phase8b .cover-classification strong,
.iq-phase8b .cover-meta-grid strong,
.iq-phase8b .phase8b-screening-decision-band strong,
.iq-phase8b .phase8a-investment-decision-band strong,
.iq-phase8b .phase8b-screening-metric-matrix td strong,
.iq-phase8b .phase8b-evidence-metric-matrix td strong,
.iq-phase8b .phase8a-investment-snapshot-table td strong,
.iq-phase8b .summary-strip strong,
.iq-phase8b .iq-ic-metric-value {
  font-kerning:normal !important;
  font-variant-numeric:proportional-nums !important;
  font-feature-settings:"kern" 1, "pnum" 1 !important;
  word-spacing:0 !important;
  letter-spacing:-.014em !important;
}
.iq-phase8b .phase8b-screening-metric-matrix tr:first-child td strong,
.iq-phase8b .phase8a-investment-snapshot-table tr:first-child td strong {
  letter-spacing:-.022em !important;
}
.iq-phase8b .cover-meta-grid strong { letter-spacing:-.012em !important; }
.iq-phase8b .phase8b-screening-decision-band > div:first-child strong,
.iq-phase8b .phase8a-investment-decision-band > div:first-child strong {
  letter-spacing:-.018em !important;
}

/* Technical labels remain differentiated, but not over-tracked. */
.iq-phase8b .chapter-heading,
.iq-phase8b .section-header-eyebrow,
.iq-phase8b .institutional-eyebrow,
.iq-phase8b .subsection-title,
.iq-phase8b .iq-ic-metric-label {
  letter-spacing:.055em !important;
  word-spacing:0 !important;
}
.iq-phase8b .cover-classification span,
.iq-phase8b .cover-meta-grid span {
  letter-spacing:.05em !important;
  word-spacing:0 !important;
}
.iq-phase8b .phase8b-screening-decision-band span,
.iq-phase8b .phase8a-investment-decision-band span {
  letter-spacing:.045em !important;
  word-spacing:0 !important;
}
.iq-phase8b .phase8b-screening-metric-matrix td span,
.iq-phase8b .phase8b-evidence-metric-matrix td span,
.iq-phase8b .phase8a-investment-snapshot-table td span,
.iq-phase8b table th {
  letter-spacing:.035em !important;
  word-spacing:0 !important;
}
.iq-phase8b .cover-footer-text,
.iq-phase8b .iq-scenario-label,
.iq-phase8b .iq-evidence-badge {
  letter-spacing:.03em !important;
  word-spacing:0 !important;
}

/* Confirmed short sections stay intact so Prince cannot strand the heading. */
.iq-phase8b section[data-iq-elite-section="keyMetricsSnapshot"],
.iq-phase8b section[data-iq-elite-operating="noi-margin-analysis"],
.iq-phase8b section[data-iq-elite-scenario-section="operating-expense-stress"] {
  break-inside:avoid-page !important;
  page-break-inside:avoid !important;
}

${INVESTORIQ_VISUAL_ELITE_PRINCE_LAYOUT_CSS}
`;