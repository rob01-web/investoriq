export const INVESTORIQ_VISUAL_ELITE_CSS_VERSION = "investoriq-visual-elite-shell-v1";

export const INVESTORIQ_VISUAL_ELITE_CSS = `
/* Visual ELITE shared publication shell. Presentation only. */
.iq-phase8b {
  --iq-ve-forest:#143e34;
  --iq-ve-forest-deep:#102f28;
  --iq-ve-gold:#bfa367;
  --iq-ve-gold-soft:#d5c394;
  --iq-ve-paper:#ffffff;
  --iq-ve-paper-alt:#f3f6f2;
  --iq-ve-ink:#203c34;
  --iq-ve-copy:#46554f;
  --iq-ve-muted:#65746d;
  --iq-ve-rule:#cfd6d0;
  --iq-ve-rule-strong:#91a096;
  color:var(--iq-ve-copy);
  font-size:9pt;
  line-height:1.43;
}

/* Shared cover identity for Screening and Underwriting. */
.iq-phase8b .cover-wrap {
  height:10.5in !important;
  overflow:hidden !important;
  background:var(--iq-ve-forest) !important;
  color:#fff !important;
  border:0 !important;
}
.iq-phase8b .cover-wrap::before { display:none !important; }
.iq-phase8b .cover-wrap::after {
  content:'' !important;
  display:block !important;
  top:.74in !important;
  left:.62in !important;
  right:.62in !important;
  width:auto !important;
  height:1px !important;
  background:#587567 !important;
  opacity:1 !important;
}
.iq-phase8b .cover-cell {
  height:10.5in !important;
  padding:1.88in .62in .72in .62in !important;
  background:transparent !important;
  overflow:hidden !important;
}
.iq-phase8b .cover-brand-name {
  top:.43in !important;
  left:.62in !important;
  font-family:var(--font-body) !important;
  font-size:14pt !important;
  font-weight:700 !important;
  letter-spacing:-.035em !important;
  text-transform:none !important;
  color:#fff !important;
}
.iq-phase8b .cover-brand-name::after { content:'.'; color:var(--iq-ve-gold); }
.iq-phase8b .cover-brand-sub {
  top:.45in !important;
  right:.62in !important;
  max-width:2.35in !important;
  font-family:var(--font-body) !important;
  font-size:7pt !important;
  font-weight:500 !important;
  line-height:1.3 !important;
  letter-spacing:.02em !important;
  text-transform:none !important;
  text-align:right !important;
  color:#d3d9cc !important;
}
.iq-phase8b .cover-prop-name {
  max-width:5.1in !important;
  margin:0 0 .18in 0 !important;
  font-family:var(--font-display) !important;
  font-size:52pt !important;
  font-weight:400 !important;
  line-height:1.02 !important;
  letter-spacing:-.025em !important;
  color:#fff !important;
  overflow-wrap:normal !important;
  word-break:normal !important;
}
.iq-phase8b .cover-address {
  max-width:5.25in !important;
  margin:0 0 .16in 0 !important;
  font-size:9pt !important;
  line-height:1.4 !important;
  color:#cbd4ca !important;
}
.iq-phase8b .cover-divider {
  width:.46in !important;
  height:2px !important;
  margin:.03in 0 .2in !important;
  background:var(--iq-ve-gold) !important;
  opacity:1 !important;
}
.iq-phase8b .cover-prop-sub {
  margin:0 !important;
  font-family:var(--font-body) !important;
  font-size:14pt !important;
  font-weight:500 !important;
  line-height:1.3 !important;
  letter-spacing:0 !important;
  text-transform:none !important;
  color:#eee9da !important;
}
.iq-phase8b .cover-classification {
  max-width:5.2in !important;
  margin-top:.3in !important;
  padding:0 !important;
  border:0 !important;
  background:transparent !important;
}
.iq-phase8b .cover-classification span {
  margin-bottom:5px !important;
  font-family:var(--font-mono) !important;
  font-size:6.2pt !important;
  font-weight:500 !important;
  letter-spacing:.12em !important;
  color:#cbbd98 !important;
}
.iq-phase8b .cover-classification strong {
  max-width:4.8in !important;
  font-family:var(--font-body) !important;
  font-size:10pt !important;
  font-weight:400 !important;
  line-height:1.45 !important;
  text-transform:none !important;
  color:#cbd4ca !important;
}
.iq-phase8b .cover-meta-grid {
  display:grid !important;
  grid-template-columns:repeat(3,minmax(0,1fr)) !important;
  gap:.28in !important;
  position:absolute !important;
  left:.62in !important;
  right:.62in !important;
  bottom:1.02in !important;
  margin:0 !important;
  padding-top:.2in !important;
  border-top:1px solid #587567 !important;
}
.iq-phase8b .cover-meta-grid span {
  margin-bottom:5px !important;
  font-family:var(--font-mono) !important;
  font-size:5.8pt !important;
  font-weight:500 !important;
  letter-spacing:.08em !important;
  color:#cbd4ca !important;
}
.iq-phase8b .cover-meta-grid strong {
  font-family:var(--font-body) !important;
  font-size:15pt !important;
  font-weight:400 !important;
  line-height:1.15 !important;
  color:#fff !important;
}
.iq-phase8b .cover-footer-row {
  left:.62in !important;
  right:.62in !important;
  bottom:.25in !important;
  height:.28in !important;
  padding:7px 0 0 !important;
  border-top:1px solid #587567 !important;
  background:transparent !important;
}
.iq-phase8b .cover-footer-text {
  font-family:var(--font-mono) !important;
  font-size:5.5pt !important;
  font-weight:400 !important;
  letter-spacing:.04em !important;
  text-transform:none !important;
  color:#cbd4ca !important;
}

/* Editorial body hierarchy and quiet institutional furniture. */
.iq-phase8b .section { background:#fff !important; }
.iq-phase8b .section-header {
  margin:0 0 14px !important;
  padding:0 0 11px !important;
  border-bottom:1px solid var(--iq-ve-rule) !important;
}
.iq-phase8b .section-header::after {
  left:0 !important;
  right:auto !important;
  bottom:-1px !important;
  width:.52in !important;
  height:1.5px !important;
  background:var(--iq-ve-gold) !important;
}
.iq-phase8b .section-header-title {
  padding-right:0 !important;
  font-family:var(--font-display) !important;
  font-size:26pt !important;
  font-weight:400 !important;
  line-height:1.06 !important;
  letter-spacing:-.018em !important;
  color:var(--iq-ve-ink) !important;
}
.iq-phase8b .section-header-eyebrow,
.iq-phase8b .institutional-eyebrow,
.iq-phase8b .subsection-title {
  font-family:var(--font-mono) !important;
  font-size:6pt !important;
  font-weight:500 !important;
  letter-spacing:.11em !important;
  text-transform:uppercase !important;
  color:var(--iq-ve-muted) !important;
}
.iq-phase8b .section-header-sub,
.iq-phase8b .body-copy,
.iq-phase8b p,
.iq-phase8b li { color:var(--iq-ve-copy); }
.iq-phase8b .card {
  border:0 !important;
  border-top:1px solid var(--iq-ve-rule-strong) !important;
  padding:10px 0 !important;
  background:#fff !important;
}
.iq-phase8b .iq-callout {
  border:0 !important;
  border-left:3px solid var(--iq-ve-gold) !important;
  background:var(--iq-ve-paper-alt) !important;
  padding:12px 15px !important;
}
.iq-phase8b table { border-collapse:collapse !important; }
.iq-phase8b table thead { display:table-header-group; }
.iq-phase8b table tr { break-inside:avoid; page-break-inside:avoid; }
.iq-phase8b table th {
  padding:7px 7px !important;
  border-top:0 !important;
  border-bottom:1px solid var(--iq-ve-rule-strong) !important;
  background:#fff !important;
  font-family:var(--font-mono) !important;
  font-size:5.8pt !important;
  font-weight:500 !important;
  letter-spacing:.06em !important;
  color:var(--iq-ve-muted) !important;
}
.iq-phase8b table td {
  padding:7px 7px !important;
  border-bottom:1px solid #dde2de !important;
  background:#fff !important;
  font-size:7.7pt !important;
  line-height:1.35 !important;
}
.iq-phase8b table tbody tr:nth-child(even) td { background:#fbfcfa !important; }
.iq-phase8b .table-note,
.iq-phase8b .small,
.iq-phase8b .phase8b-source-register,
.iq-phase8b .source-note { color:var(--iq-ve-muted) !important; }

@media print {
  .iq-phase8b .cover-wrap { page:auto !important; }
  .iq-phase8b .section-header { break-after:avoid-page !important; page-break-after:avoid !important; }
  .iq-phase8b table thead { display:table-header-group !important; }
}
`;
