import { INVESTORIQ_UNDERWRITING_OPENING_CSS } from "./investoriq-publication-design-system.js";
// Canonical base typography and geometry, consumed by both products.
export const INVESTORIQ_PUBLICATION_BASE_CSS = `
    @page {
      size: Letter;
      margin: 0.58in 0.55in 0.66in 0.55in;
      @top-left {
        content: string(report-property);
        font-family: 'DM Sans', sans-serif;
        font-size: 7px;
        color: #606060;
      }
      @top-right {
        content: string(report-chapter);
        font-family: 'DM Mono', 'Courier New', monospace;
        font-size: 7px;
        color: #9A9A9A;
      }
      @bottom-left {
        content: "INVESTORIQ | CONFIDENTIAL";
        font-family: 'DM Mono', 'Courier New', monospace;
        font-size: 7px;
        color: #9A9A9A;
      }
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'DM Mono', 'Courier New', monospace;
        font-size: 7px;
        color: #9A9A9A;
      }
    }
    @page :first {
      margin: 0;
      @top-left { content: none; }
      @top-right { content: none; }
      @bottom-left { content: none; }
      @bottom-right { content: none; }
    }
    :root {
      --cover-bg: #FFFFFF;
      --cover-canvas: #FFFFFF;
      --forest: #173F2B;
      --forest-deep: #0F2318;
      --charcoal: #161A18;
      --gold: #C9A84C;
      --gold-dark: #9A7A2C;
      --white: #FFFFFF;
      --paper-warm: #FAFAF8;
      --ink: #0C0C0C;
      --ink-2: #363636;
      --ink-3: #606060;
      --ink-4: #9A9A9A;
      --hairline: #E8E5DF;
      --hairline-mid: #D0CCC4;
      --row-alt: #FAFAF8;
      --chart-1: #173F2B;
      --chart-2: #B28A36;
      --chart-3: #61766A;
      --space-1: 4px;
      --space-2: 8px;
      --space-3: 12px;
      --space-4: 16px;
      --space-5: 18px;
      --space-6: 26px;
      --type-body: 11.5px;
      --type-table: 10.5px;
      --type-note: 9.5px;
      --rule-strong: 1.5px solid var(--ink);
      --rule-standard: 1px solid var(--hairline-mid);
      --rule-soft: 1px solid var(--hairline);
      --font-display: 'Cormorant Garamond', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
      --font-mono: 'DM Mono', 'Courier New', monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; background:var(--white); color:var(--ink); font-family:var(--font-body); font-size:var(--type-body); line-height:1.52; font-variant-numeric:tabular-nums; orphans:3; widows:3; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { margin:0; padding:0; background:var(--white); color:var(--ink); font-family:var(--font-body); font-size:var(--type-body); line-height:1.52; }
    .report-container { width:100%; padding:0; box-sizing:border-box; background:var(--white); }
    img, svg { max-width:100%; height:auto; }
    p, li { orphans:3; widows:3; }
    ul, ol { margin-top:0; margin-bottom:var(--space-3); }
    .cover-wrap { page-break-after:always; page-break-inside:avoid; margin:0; padding:0; width:100%; height:10.5in; overflow:hidden; position:relative; background:var(--cover-canvas); }
    .cover-wrap::before { content:''; position:absolute; top:0; bottom:0; left:0; width:0.18in; background:var(--forest-deep); }
    .cover-wrap::after { content:''; position:absolute; top:0; left:0.82in; width:1.05in; height:3px; background:var(--gold); }
    .cover-table { width:100%; border-collapse:collapse; height:100%; table-layout:fixed; }
    .cover-cell { background:var(--cover-canvas); padding:1.42in 0.68in 0.82in 0.82in; vertical-align:top; width:100%; height:100%; overflow:hidden; position:relative; }
    .cover-brand-name { position:absolute; top:0.34in; left:0.82in; font-family:var(--font-display); font-size:14pt; font-weight:600; color:var(--forest-deep); letter-spacing:0.025em; white-space:nowrap; hyphens:none; text-transform:uppercase; margin:0; }
    .cover-brand-sub { position:absolute; top:0.41in; right:0.68in; font-family:var(--font-mono); font-size:6pt; font-weight:500; color:var(--ink-4); letter-spacing:0.16em; white-space:nowrap; hyphens:none; text-transform:uppercase; margin:0; }

    .cover-prop-name { font-family:var(--font-display); font-size:34pt; font-weight:600; color:var(--charcoal); line-height:1.04; letter-spacing:-0.025em; max-width:6.25in; white-space:normal; overflow-wrap:break-word; word-break:normal; hyphens:none; margin:0 0 0.12in 0; }
    .cover-address { max-width:6.1in; font-family:var(--font-body); font-size:9.5pt; font-weight:400; color:var(--ink-3); line-height:1.45; margin:0 0 0.22in 0; }
    .cover-divider { border:none; width:0.68in; height:1.5px; background:var(--gold); opacity:0.9; margin:0 0 0.18in 0; }
    .cover-prop-sub { font-family:var(--font-body); font-size:10pt; font-weight:600; color:var(--ink-2); letter-spacing:0.08em; text-transform:uppercase; margin:0; }
    .cover-classification { max-width:5.8in; margin-top:0.62in; padding:0.12in 0.16in; border-left:3px solid var(--forest); background:rgba(23,63,43,0.045); }
    .cover-classification span { display:block; font-family:var(--font-mono); font-size:6.5pt; font-weight:600; color:var(--ink-4); letter-spacing:0.14em; text-transform:uppercase; margin-bottom:4pt; }
    .cover-classification strong { display:block; font-family:var(--font-body); font-size:14pt; font-weight:600; color:var(--charcoal); line-height:1.25; }
    .cover-meta-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0.22in; position:absolute; left:0.82in; right:0.68in; bottom:0.88in; padding-top:0.16in; border-top:1px solid var(--hairline-mid); }
    .cover-meta-grid span { display:block; font-family:var(--font-mono); font-size:6pt; font-weight:600; text-transform:uppercase; letter-spacing:0.14em; color:var(--ink-4); margin-bottom:4pt; }
    .cover-meta-grid strong { display:block; font-family:var(--font-body); font-size:10pt; font-weight:600; color:var(--charcoal); line-height:1.3; }
    .cover-footer-row { display:flex; justify-content:space-between; align-items:center; position:absolute; bottom:0; left:0.18in; right:0; height:0.42in; padding:0 0.68in 0 0.64in; background:rgba(255,255,255,0.22); border-top:1px solid var(--hairline); }
    .cover-footer-text { font-family:var(--font-mono); font-size:6pt; font-weight:500; color:var(--ink-4); letter-spacing:0.1em; text-transform:uppercase; }
    .cover-footer-row .cover-footer-text:last-child { color:var(--forest); letter-spacing:0.11em; }
    .header-strip { position:relative; border-top:none; border-bottom:var(--rule-soft); padding:0 0 0.12in 0; margin:0 0 0.22in 0; background:var(--white); }
    .header-strip::before { content:''; position:absolute; top:0; left:0; right:0; height:1.5px; background:var(--gold); opacity:0.55; }
    .header-top { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0.12in 0 0 0; }
    .report-running-property { string-set:report-property content(text); }
    .brand-mark { font-family:var(--font-display); font-size:8pt; font-weight:600; color:var(--ink); letter-spacing:0.04em; text-transform:uppercase; white-space:nowrap; hyphens:none; }
    .tagline { font-size:7px; font-weight:600; text-transform:uppercase; letter-spacing:0.14em; color:var(--ink-4); margin-top:3px; }
    .institutional-chapter { break-before:auto; }
    .institutional-chapter + .institutional-chapter { break-before:page; page-break-before:always; }
    .chapter-heading { string-set:report-chapter content(text); margin:0 0 var(--space-5) 0; padding:0 0 7px 0; border-bottom:1px solid var(--ink); font-family:var(--font-body); font-size:8px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-2); break-after:avoid-page; page-break-after:avoid; }
    .section { margin:0; padding:0 0 var(--space-5) 0; background:var(--white); }
    .section + .section { margin-top:0; }
    .section-break { break-before:auto; page-break-before:auto; }
    .section-header { position:relative; margin-top:0; margin-bottom:var(--space-3); padding-bottom:7px; border-bottom:none; break-after:avoid-page; page-break-after:avoid; }
    .section-header::after { content:''; position:absolute; left:0; bottom:0; width:0.28in; height:1.5px; background:var(--gold); opacity:0.82; }
    .section-header-title { display:block; font-family:var(--font-body); font-size:15pt; font-weight:600; letter-spacing:-0.015em; color:var(--ink); line-height:1.12; word-break:keep-all; overflow-wrap:normal; hyphens:none; margin-bottom:2pt; }
    .card { background:var(--white); border:var(--rule-soft); padding:var(--space-3) var(--space-4); break-inside:auto; page-break-inside:auto; }
    .section > .card { border:0; padding:0; }
    .no-break { break-inside:avoid-page; page-break-inside:avoid; }
    .allow-break { break-inside:auto; page-break-inside:auto; }
    .body-copy { margin:2px 0 var(--space-2) 0; color:var(--ink-3); font-size:10.5px; line-height:1.52; }
    .small { color:var(--ink-3); font-size:var(--type-note); line-height:1.5; }
    .subsection-block + .subsection-block { margin-top:var(--space-3); }
    .subsection-title { margin:0 0 var(--space-2) 0; font-family:var(--font-body); font-size:8.5px; text-transform:uppercase; letter-spacing:0.08em; color:var(--ink-3); font-weight:700; break-after:avoid-page; page-break-after:avoid; }
    .detail-table { width:100%; border-collapse:collapse; font-size:var(--type-table); table-layout:fixed; font-variant-numeric:tabular-nums; }
    .detail-table thead { display:table-header-group; }
    .detail-table th { font-family:var(--font-body); font-size:8.5px; font-weight:700; letter-spacing:0.045em; text-transform:uppercase; color:var(--ink-3); border-top:var(--rule-standard); border-bottom:var(--rule-standard); padding:7px 8px 6px; text-align:left; background:var(--paper-warm); }
    .detail-table tr { break-inside:avoid; page-break-inside:avoid; }
    .detail-table td { border-bottom:var(--rule-soft); padding:6px 8px; vertical-align:top; line-height:1.34; }
    .detail-table tr:first-child td { border-top:none; }
    .detail-table tbody tr:nth-child(even) td { background:var(--row-alt); }
    .detail-table tbody tr > td:first-child:nth-last-child(2) { width:58%; color:var(--ink-3); }
    .detail-table tbody tr > td:first-child:nth-last-child(2) + td { width:42%; font-weight:600; color:var(--ink); text-align:right; font-variant-numeric:tabular-nums; }
    .detail-table.metric-note-table tbody tr > td:first-child:nth-last-child(3) { width:46%; color:var(--ink-3); }
    .detail-table.metric-note-table tbody tr > td:nth-child(2) { width:24%; font-weight:600; color:var(--ink); text-align:right; font-variant-numeric:tabular-nums; }
    .detail-table.metric-note-table tbody tr > td:nth-child(3) { width:30%; color:var(--ink-3); text-align:right; font-size:9px; }
    .detail-table.iq-numeric-table th:not(:first-child), .detail-table.iq-numeric-table td:not(:first-child) { text-align:right; font-variant-numeric:tabular-nums; }
    .detail-table.iq-numeric-table td:not(:first-child) { color:var(--ink); }
    .numeric, .numeric-value { text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; }
    .table-note { margin-top:var(--space-2); color:var(--ink-4); font-size:var(--type-note); line-height:1.45; }
    .iq-callout { margin:var(--space-3) 0; padding:var(--space-3) var(--space-4); border-left:3px solid var(--forest); background:var(--paper-warm); break-inside:avoid-page; page-break-inside:avoid; }
    .iq-callout[data-iq-tone="constraint"] { border-left-color:var(--gold-dark); }
    .iq-callout[data-iq-tone="scenario"] { border-left-color:var(--chart-3); }
    .iq-callout-title { margin:0 0 var(--space-1) 0; font-size:8.5px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-2); }
    .iq-callout-copy { margin:0; color:var(--ink-3); font-size:10.5px; line-height:1.5; }
    .iq-evidence-badge { font-family:var(--font-mono); font-size:7px; letter-spacing:0.04em; white-space:nowrap; }
${INVESTORIQ_UNDERWRITING_OPENING_CSS}
    .data-coverage-table { width:100%; table-layout:fixed; }
    .data-coverage-table td { white-space:normal; overflow-wrap:anywhere; word-break:break-word; hyphens:auto; }
    .data-coverage-table td:last-child, .source-register-table td:last-child { text-align:left; }
    .data-coverage-table-3col td:nth-child(1) { width:26%; }
    .data-coverage-table-3col td:nth-child(2) { width:39%; }
    .data-coverage-table-3col td:nth-child(3) { width:35%; }
    .data-coverage-table-2col td:nth-child(1) { width:74%; }
    .data-coverage-table-2col td:nth-child(2) { width:26%; text-align:right; }
    .data-coverage-source-summary { margin-top:2px; }
    .source-register-table { width:100%; table-layout:fixed; }
    .source-register-table td { overflow-wrap:break-word; word-break:normal; hyphens:none; padding:5px 7px; line-height:1.25; font-size:9px; }
    .source-register-table th { padding:5px 7px; font-size:8px; }
    .source-register-table .source-filename { font-size:8.5px; line-height:1.2; overflow-wrap:normal; word-break:normal; }
    .source-register-table th:nth-child(1), .source-register-table td:nth-child(1) { width:30%; }
    .source-register-table th:nth-child(2), .source-register-table td:nth-child(2) { width:24%; }
    .source-register-table th:nth-child(3), .source-register-table td:nth-child(3) { width:20%; }
    .source-register-table th:nth-child(4), .source-register-table td:nth-child(4) { width:26%; }
    .diligence-coverage-table th:nth-child(1), .diligence-coverage-table td:nth-child(1) { width:29%; }
    .diligence-coverage-table th:nth-child(2), .diligence-coverage-table td:nth-child(2) { width:18%; }
    .diligence-coverage-table th:nth-child(3), .diligence-coverage-table td:nth-child(3) { width:29%; }
    .diligence-coverage-table th:nth-child(4), .diligence-coverage-table td:nth-child(4) { width:24%; }
    .source-register-table thead { display:table-header-group; }
    .numeric-context-table td:last-child { text-align:right; font-family:var(--font-mono); }
    .renovation-plan-table th:nth-child(1), .renovation-plan-table td:nth-child(1) { width:25%; text-align:left; }
    .renovation-plan-table th:nth-child(2), .renovation-plan-table td:nth-child(2) { width:11%; text-align:right; }
    .renovation-plan-table th:nth-child(3), .renovation-plan-table td:nth-child(3) { width:23%; text-align:right; }
    .renovation-plan-table th:nth-child(4), .renovation-plan-table td:nth-child(4) { width:22%; text-align:right; }
    .renovation-plan-table th:nth-child(5), .renovation-plan-table td:nth-child(5) { width:19%; text-align:right; }
    .market-range-table th:nth-child(2), .market-range-table td:nth-child(2), .market-range-table th:nth-child(3), .market-range-table td:nth-child(3) { text-align:right; font-variant-numeric:tabular-nums; }
    .unit-mix-table { width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed; }
    .unit-mix-table th { font-family:var(--font-body); font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink-3); border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline-mid); padding:0 8px 6px; text-align:left; background:var(--white); }
    .unit-mix-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; }
    .unit-mix-table th:nth-child(n+2), .unit-mix-table td:nth-child(n+2) { text-align:right; font-variant-numeric:tabular-nums; }
    .unit-mix-table tr:nth-child(even) td { background:var(--row-alt); }
    .summary-strip { display:grid; grid-template-columns:repeat(auto-fit,minmax(1.42in,1fr)); gap:12px; margin-top:10px; }
    .summary-strip div { border:0; border-top:1px solid var(--hairline-mid); padding:8px 6px 4px 0; background:transparent; }
    .summary-strip span { display:block; font-family:var(--font-mono); font-size:6.5pt; letter-spacing:0.14em; text-transform:uppercase; color:var(--ink-4); margin-bottom:4px; }
    .summary-strip strong { font-family:var(--font-display); font-size:16pt; font-weight:500; color:var(--ink); }
    .section[data-iq-elite-operating="overview"] .summary-strip { grid-template-columns:repeat(4,minmax(0,1fr)); }
    [data-iq-elite06-surface="diligence-coverage"] .summary-strip { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .debt-capacity-strip { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .institutional-visual-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .evidence-chart { border:0; border-top:1px solid var(--hairline-mid); padding:10px 8px 8px 0; background:transparent; break-inside:avoid; page-break-inside:avoid; }
    .evidence-chart-row { display:grid; grid-template-columns:1.25fr 2fr 0.9fr; gap:8px; align-items:center; margin-top:7px; }
    .evidence-chart-label { color:var(--ink-3); font-size:9px; line-height:1.25; }
    .evidence-chart-track { height:8px; background:#E5E3DE; overflow:hidden; }
    .evidence-chart-bar { height:100%; min-width:1px; }
    .evidence-chart-bar-1 { background:var(--chart-1); }
    .evidence-chart-bar-2 { background:var(--chart-2); }
    .evidence-chart-bar-3 { background:var(--chart-3); }
    .evidence-chart-value { font-family:var(--font-mono); font-size:8px; color:var(--ink); text-align:right; font-variant-numeric:tabular-nums; }
    .evidence-chart-stats { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid var(--hairline); }
    .evidence-chart-stat span { display:block; color:var(--ink-4); font-size:7px; text-transform:uppercase; letter-spacing:0.08em; }
    .evidence-chart-stat strong { display:block; margin-top:2px; font-family:var(--font-mono); font-size:10px; color:var(--ink); font-variant-numeric:tabular-nums; }
    .readiness-summary { margin-bottom:8px; font-size:10.25px; line-height:1.5; color:var(--ink-3); }
    .readiness-pair-table { table-layout:fixed; }
    .readiness-pair-table td { padding:6px 8px; }
    .readiness-pair-table td:nth-child(1), .readiness-pair-table td:nth-child(3) { width:28%; color:var(--ink-3); }
    .readiness-pair-table td:nth-child(2), .readiness-pair-table td:nth-child(4) { width:22%; text-align:right; font-weight:600; }
    .readiness-pair-table td:nth-child(3) { border-left:1px solid var(--hairline); padding-left:14px; }
    .data-coverage-strip { grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:0; }
    .reconciliation-metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0; border-top:1px solid var(--hairline-mid); }
    .reconciliation-metric-grid > div { padding:7px 10px 5px 0; min-height:46px; }
    .reconciliation-metric-grid > div + div { border-left:1px solid var(--hairline); padding-left:10px; }
    .reconciliation-metric-grid span { display:block; color:var(--ink-3); font-size:8.5px; line-height:1.3; margin-bottom:4px; }
    .reconciliation-metric-grid strong { font-family:var(--font-mono); font-size:10px; font-weight:600; color:var(--ink); white-space:nowrap; }
    .debt-capacity-strip { margin-bottom:var(--space-3); }
    .debt-break-even-table td:first-child { width:76%; }
    .debt-break-even-table td:last-child { width:24%; text-align:right; font-family:var(--font-mono); font-weight:600; white-space:nowrap; }
    .iq-renovation-detail { margin-top:var(--space-4); }
    .iq-renovation-detail > .subsection-title { font-size:10.5px; letter-spacing:0.04em; color:var(--ink-2); }
    .iq-renovation-detail .subsection-block { margin-top:var(--space-2); }
    .methodology-compact { margin-top:var(--space-4); padding-top:var(--space-3); border-top:1px solid var(--hairline-mid); }
    .methodology-compact-title { font-size:10.5px; letter-spacing:0.04em; color:var(--ink-2); margin-bottom:8px; }
    .methodology-compact-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
    .methodology-compact-grid p { margin:0; color:var(--ink-3); font-size:9.25px; line-height:1.4; }
    .source-table { width:100%; border-collapse:collapse; font-size:10.5px; table-layout:fixed; margin-top:8px; }
    .source-table th { font-family:var(--font-body); font-size:10px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--ink-3); border-top:1px solid var(--hairline); border-bottom:1px solid var(--hairline-mid); padding:0 8px 6px; text-align:left; background:var(--white); }
    .source-table td { border-bottom:1px solid var(--hairline); padding:6px 8px; vertical-align:top; }
    .source-table th:nth-child(2), .source-table td:nth-child(2), .source-table th:nth-child(3), .source-table td:nth-child(3), .source-table th:nth-child(4), .source-table td:nth-child(4) { text-align:right; font-variant-numeric:tabular-nums; }
    .source-table tr:nth-child(even) td { background:var(--row-alt); }
    .grid-2-balanced { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
    .footer-note { margin-top:10px; color:var(--ink-4); font-size:9.25px; line-height:1.4; font-style:italic; }
    .report-footer { margin-top:18px; padding-top:10px; border-top:1px solid var(--hairline); }
    .report-footer-inner { width:100%; display:flex; justify-content:space-between; gap:12px; align-items:center; }
    .report-footer-inner span:first-child { font-family:var(--font-mono); font-size:6pt; color:var(--ink-4); letter-spacing:0.1em; text-transform:uppercase; }
    .report-footer-inner span:last-child { font-family:var(--font-body); font-size:6.5pt; color:var(--ink-4); letter-spacing:0.02em; }
    .meta-line { display:flex; justify-content:space-between; border-bottom:1px solid var(--hairline); padding:5px 0; font-size:10.5px; }
    .meta-label { color:var(--ink-3); }
    .meta-value { font-weight:600; color:var(--ink); text-align:right; }
    .iq-scenario-label { display:inline-block; font-family:var(--font-mono); font-size:6.5pt; letter-spacing:0.08em; text-transform:uppercase; color:var(--gold-dark); margin:0 0 7px 0; }
    .iq-debt-profile { border:0; border-top:1px solid var(--hairline-mid); padding:10px 0 0; }
    .iq-debt-profile .detail-table { margin-top:2px; }
    .iq-driver-table th, .iq-driver-table td { vertical-align:top; }
    .iq-driver-table th:nth-child(1), .iq-driver-table td:nth-child(1) { width:8%; text-align:center; }
    .iq-driver-table th:nth-child(2), .iq-driver-table td:nth-child(2) { width:24%; }
    .iq-driver-table th:nth-child(3), .iq-driver-table td:nth-child(3) { width:18%; }
    .iq-driver-table th:nth-child(4), .iq-driver-table td:nth-child(4) { width:24%; }
    .iq-driver-table th:nth-child(5), .iq-driver-table td:nth-child(5) { width:13%; text-align:right; }
    .iq-driver-table th:nth-child(6), .iq-driver-table td:nth-child(6) { width:13%; text-align:right; }
    .iq-table-subtext { display:block; margin-top:2px; color:var(--ink-4); font-size:8.5px; line-height:1.3; font-weight:400; }
    .iq-boundary-list { border-top:1px solid var(--hairline-mid); padding-top:var(--space-3); margin-top:var(--space-3); }
    .iq-evidence-label { font-family:var(--font-mono); font-size:7px; letter-spacing:0.03em; color:var(--ink-3); white-space:nowrap; }
    #quality-manifest-title .card { border:0; border-top:1px solid var(--hairline-mid); padding:10px 0 0; }
    #quality-manifest-title .grid-2-balanced { gap:20px; }
    @media print {
      html, body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      .institutional-chapter, .section, .card, table, tr, img, svg { max-width:100%; }
      .chapter-heading, .section-header, .subsection-title { break-after:avoid-page; page-break-after:avoid; }
      .report-container { height:auto; max-height:none; overflow:visible; }
      a { color:inherit; text-decoration:none; }
    }
`;
