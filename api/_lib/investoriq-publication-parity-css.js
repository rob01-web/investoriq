// Final shared presentation authority. Product differences are content and
// column count, never a second font, cover, table, or page-furniture system.
export const INVESTORIQ_PUBLICATION_PARITY_CSS = `
@page iq-body {
  size: Letter; margin: .46in .52in .56in;
  @top-left { content: "INVESTORIQ"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.08em; color:#173f2b; }
  @top-right { content: string(iq-section, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#606b64; }
  @bottom-left { content: string(iq-property) " | CONFIDENTIAL"; font-family:'DM Sans',sans-serif; font-size:5.8pt; color:#606b64; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#606b64; }
}
@page {
  size: Letter; margin: .46in .52in .56in;
  @top-left { content: "INVESTORIQ"; font-family:'DM Sans',sans-serif; font-size:6pt; font-weight:700; letter-spacing:.08em; color:#173f2b; }
  @top-right { content: string(iq-section, first); font-family:'DM Sans',sans-serif; font-size:6pt; color:#606b64; }
  @bottom-left { content: string(iq-property) " | CONFIDENTIAL"; font-family:'DM Sans',sans-serif; font-size:5.8pt; color:#606b64; }
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font-family:'DM Mono',monospace; font-size:5.8pt; color:#606b64; }
}
.iq-phase8b { margin:0 !important; padding:0 !important; --font-display:'Cormorant Garamond',Georgia,serif; --font-body:'DM Sans',sans-serif; --font-mono:'DM Mono',monospace; font-family:var(--font-body); font-size:8.5pt; line-height:1.42; }
.iq-phase8b [data-iq-phase8b-slice] { display:none !important; }
.iq-phase8b .report-container { width:100% !important; max-width:none !important; margin:0 !important; padding:0 !important; box-shadow:none !important; }
.iq-phase8b .cover-wrap { height:10.5in !important; background:#fff !important; overflow:visible !important; }
.iq-phase8b .cover-wrap::before { width:.18in !important; height:100% !important; background:#0f2318 !important; }
.iq-phase8b .cover-wrap::after { top:0 !important; left:.82in !important; right:auto !important; width:1.05in !important; height:3px !important; border:0 !important; background:#c9a84c !important; transform:none !important; }
.iq-phase8b .cover-table, .iq-phase8b .cover-table tbody, .iq-phase8b .cover-table tr { display:block; height:auto !important; min-height:0 !important; margin:0; padding:0; border:0; }
.iq-phase8b .cover-cell { display:block; box-sizing:border-box; height:10.5in !important; min-height:0 !important; padding:1.55in .68in .82in .82in !important; position:relative !important; background:#fff !important; border:0 !important; }
.iq-phase8b .cover-brand-name { top:.45in !important; left:.82in !important; font-family:var(--font-display) !important; font-size:14pt !important; font-weight:600 !important; letter-spacing:.025em !important; color:#0f2318 !important; }
.iq-phase8b .cover-brand-sub { top:.53in !important; right:.68in !important; font-family:var(--font-mono) !important; font-size:6pt !important; font-weight:500 !important; letter-spacing:.16em !important; color:#606b64 !important; }
.iq-phase8b .cover-prop-name { font-family:var(--font-display) !important; font-size:34pt !important; font-weight:600 !important; line-height:1.04 !important; letter-spacing:-.025em !important; color:#161a18 !important; margin:0 0 .12in !important; string-set:iq-property content(); }
.iq-phase8b .cover-divider { width:.68in !important; height:1.5px !important; margin:0 0 .18in !important; background:#c9a84c !important; }
.iq-phase8b .cover-prop-sub { font-family:var(--font-body) !important; font-size:10pt !important; font-weight:600 !important; line-height:1.3 !important; letter-spacing:.08em !important; text-transform:uppercase !important; color:#606b64 !important; margin:0 !important; }
.iq-phase8b .cover-classification { max-width:5.8in !important; margin-top:.62in !important; padding:.12in .16in !important; border-left:3px solid #173f2b !important; background:#f4f6f4 !important; }
.iq-phase8b .cover-classification span, .iq-phase8b .cover-meta-grid span { display:block; font-family:var(--font-mono) !important; font-size:6pt !important; font-weight:500 !important; letter-spacing:.14em !important; text-transform:uppercase !important; color:#606b64 !important; margin-bottom:4pt !important; }
.iq-phase8b .cover-classification strong { display:block; font-family:var(--font-body) !important; font-size:14pt !important; font-weight:600 !important; line-height:1.25 !important; text-transform:uppercase !important; color:#161a18 !important; }
.iq-phase8b .cover-meta-grid { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:.22in !important; position:relative !important; left:auto !important; right:auto !important; bottom:auto !important; margin-top:.34in !important; padding-top:.16in !important; border-top:1px solid #d0ccc4 !important; }
.iq-phase8b .cover-meta-grid strong { display:block; font-family:var(--font-body) !important; font-size:10pt !important; font-weight:600 !important; line-height:1.3 !important; color:#161a18 !important; }
.iq-phase8b .cover-footer-row { top:auto !important; bottom:0 !important; left:0 !important; right:0 !important; padding:0 .68in 0 .82in !important; height:.42in !important; border-top:1px solid #e8e5df !important; }
.iq-phase8b .cover-footer-text { font-family:var(--font-mono) !important; font-size:6pt !important; font-weight:500 !important; letter-spacing:.1em !important; color:#606b64 !important; text-transform:uppercase !important; }
.iq-phase8b .section-header { display:block !important; position:relative !important; margin:0 0 12px !important; padding:0 0 10px !important; border-bottom:1px solid #ddd9cf !important; }
.iq-phase8b .section-header::after { content:'' !important; position:absolute !important; left:auto !important; right:0 !important; bottom:8px !important; width:.42in !important; height:1.5px !important; background:#c9a84c !important; }
.iq-phase8b .section-header-title { display:block; bookmark-label:content(text); font-family:var(--font-body) !important; font-size:19pt !important; font-weight:600 !important; line-height:1.12 !important; letter-spacing:-.015em !important; color:#101914 !important; text-transform:none !important; padding-right:.5in; string-set:iq-section content(); bookmark-level:1; -prince-bookmark-level:1; }
.iq-phase8b .subsection-title { font-family:var(--font-body) !important; font-size:6.5pt !important; font-weight:700 !important; letter-spacing:.08em !important; text-transform:uppercase !important; color:#606b64 !important; }
.iq-phase8b .card { border:1px solid #ddd9cf !important; border-top:1.5px solid #173f2b !important; border-radius:0 !important; padding:10px 12px; }
.iq-phase8b table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
.iq-phase8b table th { font-family:var(--font-body) !important; font-size:6.2pt !important; font-weight:700 !important; letter-spacing:.065em !important; text-transform:uppercase !important; color:#606b64 !important; background:#f7f7f2 !important; }
.iq-phase8b table td { line-height:1.35; overflow-wrap:anywhere; word-wrap:break-word; }
.iq-phase8b .phase8b-source-register td:first-child { word-break:break-all; }
.iq-phase8b .phase7-evidence-conviction-matrix table { table-layout:fixed !important; width:100% !important; }
.iq-phase8b .phase7-evidence-conviction-matrix { padding:10px 12px !important; }
.iq-phase8b .phase7-evidence-conviction-matrix th, .iq-phase8b .phase7-evidence-conviction-matrix td { padding:5px 6px !important; font-size:6.2pt !important; line-height:1.35 !important; }
.iq-phase8b .phase7-evidence-conviction-matrix th:nth-child(1), .iq-phase8b .phase7-evidence-conviction-matrix td:nth-child(1) { width:23% !important; }
.iq-phase8b .phase7-evidence-conviction-matrix th:nth-child(2), .iq-phase8b .phase7-evidence-conviction-matrix td:nth-child(2) { width:18% !important; }
.iq-phase8b .phase7-evidence-conviction-matrix > .subsection-title { font-size:10pt !important; }
.iq-phase8b .phase7-evidence-conviction-matrix > p.small { font-size:6.2pt !important; }
.iq-phase8b .phase8b-screening-decision-band, .iq-phase8b .phase8a-investment-decision-band { display:table !important; table-layout:fixed; width:100%; height:auto !important; background:#0f2318 !important; margin:0 0 11px !important; }
.iq-phase8b .phase8b-screening-decision-band > div, .iq-phase8b .phase8a-investment-decision-band > div { display:table-cell !important; vertical-align:top; width:28%; padding:12px 14px !important; }
.iq-phase8b .phase8b-screening-decision-band > div:first-child, .iq-phase8b .phase8a-investment-decision-band > div:first-child { width:44%; }
.iq-phase8b .phase8b-screening-decision-band span, .iq-phase8b .phase8a-investment-decision-band span { font-family:var(--font-body) !important; font-size:6pt !important; font-weight:700 !important; letter-spacing:.1em !important; text-transform:uppercase !important; }
.iq-phase8b .phase8b-screening-decision-band strong, .iq-phase8b .phase8a-investment-decision-band strong { font-family:var(--font-display) !important; font-size:13pt !important; line-height:1.08 !important; font-weight:600 !important; }
.iq-phase8b .phase8b-screening-decision-band p, .iq-phase8b .phase8a-investment-decision-band p { font-size:6.5pt !important; line-height:1.3 !important; }
.iq-phase8b .phase8b-screening-metric-matrix td span, .iq-phase8b .phase8b-evidence-metric-matrix td span, .iq-phase8b .phase8a-investment-snapshot-table td span { font-family:var(--font-body) !important; font-size:6pt !important; font-weight:700 !important; letter-spacing:.07em !important; text-transform:uppercase !important; }
.iq-phase8b .phase8b-screening-metric-matrix td strong, .iq-phase8b .phase8b-evidence-metric-matrix td strong, .iq-phase8b .phase8a-investment-snapshot-table td strong { font-family:var(--font-display) !important; font-size:11.5pt !important; font-weight:600 !important; line-height:1.12 !important; }
.iq-phase8b .phase8b-screening-metric-matrix td, .iq-phase8b .phase8b-evidence-metric-matrix td, .iq-phase8b .phase8a-investment-snapshot-table td { padding:6px 7px 6px 0 !important; }
.iq-phase8b .phase8a-exec-panel li { font-family:var(--font-body) !important; font-size:7pt !important; line-height:1.35 !important; }
.iq-phase8b .iq-ic-signal-list li { font-family:var(--font-body) !important; font-size:8pt !important; line-height:1.4 !important; }
.iq-phase8b .iq-ic-signal-qualification { font-size:6.5pt !important; }
.iq-phase8b [data-iq-elite07-surface="coverage-headroom"] > .grid-2-balanced { display:table !important; table-layout:fixed; width:100%; border-spacing:0; break-inside:avoid; }
.iq-phase8b .iq-debt-profile { box-sizing:border-box; display:table-cell; width:50%; vertical-align:top; break-inside:avoid; }
.iq-phase8b .iq-capital-plan-group { break-before:page; break-inside:avoid; }
.iq-phase8b .iq-capital-plan-group > section { break-before:auto !important; }
.iq-phase8b .iq-debt-profile .detail-table { margin:0; }
.iq-phase8b .iq-boundary-list { break-inside:avoid !important; }
@media print {
  .iq-phase8b .report-container, .iq-phase8b .institutional-chapter, .iq-phase8b .section,
  .iq-phase8b .institutional-chapter[data-iq-chapter="committee-overview"],
  .iq-phase8b .institutional-chapter[data-iq-chapter="committee-overview"] > div > section.section { page:iq-body !important; }
  .iq-phase8b .header-strip, .iq-phase8b .report-footer { display:none !important; }
  .iq-phase8b .section-header, .iq-phase8b .subsection-title { break-after:avoid !important; }
  .iq-phase8b section[data-iq-elite-section="screeningDecisionSnapshot"] { break-before:auto !important; }
  .iq-phase8b .iq-debt-profile { break-inside:avoid !important; page-break-inside:avoid !important; }
}
`;
