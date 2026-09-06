import { INVESTORIQ_PUBLICATION_BASE_CSS as BASE_PUBLICATION_CSS } from "./investoriq-publication-base-css-base.js";

// Shared post-audit publication refinements. These rules are intentionally
// presentation-only and apply to both Screening and Underwriting.
export const INVESTORIQ_PUBLICATION_BASE_CSS = `${BASE_PUBLICATION_CSS}

    /* ELITE post-audit shared publication polish. */
    .header-strip::before,
    .section-header::after { display:none !important; }

    .section-header { padding-bottom:2px; margin-bottom:var(--space-3); }
    .chapter-heading { border-bottom:var(--rule-standard); padding-bottom:6px; }

    .summary-strip div { border:0 !important; }
    .iq-ic-metric-grid { border-top:var(--rule-strong) !important; border-bottom:0 !important; }
    .iq-ic-secondary-grid { border-top:var(--rule-soft) !important; border-bottom:0 !important; }
    .iq-ic-metric:nth-child(3n+2),
    .iq-ic-metric:nth-child(3n+3),
    .iq-ic-secondary-metric:nth-child(odd),
    .iq-ic-reconciliation-metric { border-left:0 !important; border-right:0 !important; }

    .source-register-table { table-layout:fixed !important; width:100% !important; }
    .source-register-table th:nth-child(1), .source-register-table td:nth-child(1) { width:31% !important; }
    .source-register-table th:nth-child(2), .source-register-table td:nth-child(2) { width:20% !important; }
    .source-register-table th:nth-child(3), .source-register-table td:nth-child(3) { width:23% !important; }
    .source-register-table th:nth-child(4), .source-register-table td:nth-child(4) { width:26% !important; }
    .source-register-table td { min-width:0 !important; vertical-align:top; }
    .source-register-table .source-filename {
      white-space:normal !important;
      overflow-wrap:anywhere !important;
      word-break:break-word !important;
      hyphens:auto !important;
    }

    .iq-evidence-label,
    .cover-meta-grid span,
    .iq-ic-metric-label,
    .summary-strip span { font-size:7.25pt !important; line-height:1.35; }
    .iq-evidence-label { white-space:normal !important; overflow-wrap:anywhere; }

    .detail-table th { padding-top:6px; padding-bottom:5px; }
    .detail-table td { padding-top:6px; padding-bottom:6px; }
    .detail-table tbody tr:nth-child(even) td { background:var(--row-alt); }

    .iq-callout { border-top:0; border-right:0; border-bottom:0; }
    .card { box-shadow:none !important; }

    @media print {
      .section-header, .subsection-title, .chapter-heading { break-after:avoid-page; page-break-after:avoid; }
      .detail-table thead { display:table-header-group; }
      .detail-table tr, .source-register-table tr { break-inside:avoid; page-break-inside:avoid; }
      .iq-callout, .summary-strip, .evidence-chart, .iq-ic-metric-grid { break-inside:avoid-page; page-break-inside:avoid; }
    }
`;
