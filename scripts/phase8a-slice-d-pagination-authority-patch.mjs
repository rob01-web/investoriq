import fs from "node:fs";

const target = "api/_lib/phase8a-owner-acceptance-authority.js";
let source = fs.readFileSync(target, "utf8");

const marker = `@media print {\n  .iq-phase8a-screening .phase8a-axis { break-inside:avoid; page-break-inside:avoid; }`;
if (!source.includes(marker)) {
  throw new Error("PHASE8A_SLICE_D_PRINT_MARKER_MISSING");
}

const replacement = `@media print {
  /* Keep named-page changes on the same logical content box. Without these
     assignments Chromium/Prince can strand a wrapper, chapter heading, or
     trailing appendix block on an otherwise empty page. */
  .iq-phase8a-screening .report-container { page:iq-body; }

  .iq-phase8a-underwriting .header-strip { display:none !important; }
  .iq-phase8a-underwriting .institutional-chapter { page:iq-body; }
  .iq-phase8a-underwriting .institutional-chapter[data-iq-chapter="committee-overview"] { page:iq-decision; }
  .iq-phase8a-underwriting .institutional-chapter[data-iq-chapter="committee-overview"] > div > section.section { page:iq-decision; }
  .iq-phase8a-underwriting .report-footer { display:none !important; }

  /* The cover already supplies the page boundary. Keep the committee heading
     with the decision snapshot, and let the post-snapshot committee sections
     use available space instead of forcing another named-page break. */
  .iq-phase8a-underwriting section[data-iq-elite-section="executiveInvestmentSummary"] {
    break-before:auto !important;
    page-break-before:auto !important;
    break-after:auto !important;
    page-break-after:auto !important;
  }

  /* Phase 7 protected these driver blocks as indivisible. Phase 8A uses
     tighter editorial tables, so allow them to flow instead of leaving
     half-empty pages for a small boundary note. */
  .iq-phase8a-underwriting section[data-iq-elite-driver-section="underwriting-driver-analysis"],
  .iq-phase8a-underwriting [data-iq-elite-driver-boundaries="true"] {
    break-inside:auto !important;
    page-break-inside:auto !important;
  }

  .iq-phase8a-screening .phase8a-axis { break-inside:avoid; page-break-inside:avoid; }`;

source = source.replace(marker, replacement);
fs.writeFileSync(target, source, "utf8");
console.log("phase8a-slice-d-pagination-authority-patch: PATCHED");
