const SOURCE = "canonical_institutional_pdf_recovery";
const VERSION = 1;

const RECOVERABLE_CODES = new Set([
  "PDF_BLANK_PAGES",
  "PDF_NEARLY_BLANK_PAGES",
  "PDF_PAGE_OVERFLOW",
  "PDF_ORPHANED_HEADINGS",
  "PDF_TABLE_SEPARATED_FROM_HEADING",
  "PDF_TABLE_CONTINUATION_HEADER_MISSING",
  "PDF_UNREADABLE_TABLE",
  "PDF_BROKEN_RUNNING_HEADER",
  "PDF_RUNNING_HEADER_MISSING",
  "PDF_RUNNING_FOOTER_MISSING",
  "PDF_SPACING_OVERLAP",
  "PDF_NUMERIC_COLUMN_MISALIGNMENT",
  "PDF_APPROVED_TABLE_NOT_CERTIFIED",
  "PDF_APPROVED_CHART_NOT_CERTIFIED",
  "PDF_APPROVED_NUMBER_NOT_CERTIFIED",
  "PDF_REQUIRED_FINANCIAL_FACTS_MISSING",
  "PDF_RECONCILIATION_DISCLOSURE_MISSING",
  "PDF_FINANCIAL_INTELLIGENCE_SECTION_MISSING",
  "PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE",
  "PDF_PAGE_NUMBERS_MISSING",
]);

const RECOVERY_STYLE = `<style data-iq-pdf-recovery="conservative-v1">
  @page { margin: 0.72in 0.62in 0.68in; }
  html, body { max-width: 100%; }
  body { line-height: 1.32 !important; }
  h1, h2, h3, h4, .chapter-heading, .section-header-title, .subsection-title {
    break-after: avoid-page !important;
    page-break-after: avoid !important;
  }
  table { width: 100% !important; table-layout: fixed !important; }
  thead { display: table-header-group !important; }
  tr, td, th { break-inside: avoid !important; page-break-inside: avoid !important; }
  td, th { font-size: 8pt !important; line-height: 1.25 !important; overflow-wrap: anywhere !important; word-break: normal !important; }
  .institutional-chapter, .section-card, .evidence-chart, figure {
    max-width: 100% !important;
  }
</style>`;

function issueCodes(certification = {}) {
  return (Array.isArray(certification?.issues) ? certification.issues : [])
    .map((issue) => String(issue?.code || "").trim())
    .filter(Boolean);
}

export function isInstitutionalPdfRecoveryEligible(certification = {}) {
  const codes = issueCodes(certification);
  return certification?.ok === false &&
    certification?.customer_document_failure !== true &&
    codes.length > 0 &&
    codes.every((code) => RECOVERABLE_CODES.has(code));
}

export function buildInstitutionalPdfRecoveryHtml({ approvedHtml = "", certification = null } = {}) {
  const sourceHtml = String(approvedHtml || "");
  if (!sourceHtml.trim()) throw new Error("INSTITUTIONAL_PDF_RECOVERY_APPROVED_HTML_REQUIRED");
  const recoveredHtml = /<\/head>/i.test(sourceHtml)
    ? sourceHtml.replace(/<\/head>/i, `${RECOVERY_STYLE}</head>`)
    : `${RECOVERY_STYLE}${sourceHtml}`;
  return Object.freeze({
    html: recoveredHtml,
    receipt: Object.freeze({
      source: SOURCE,
      version: VERSION,
      mode: "single_bounded_conservative_recomposition",
      attemptCount: 1,
      eligibleIssueCodes: Object.freeze(issueCodes(certification)),
      approvedSurfaceChanged: false,
      originalApprovedHtmlMutated: false,
      presentationCssAdded: true,
      valuesMayChange: false,
      sourcesMayChange: false,
      disclosuresMayChange: false,
      calculationsMayChange: false,
      classificationsMayChange: false,
      scenariosMayBeCreated: false,
      rerenderRequired: true,
      recertifyAgainstOriginalApprovedHtml: true,
    }),
  });
}

export const INSTITUTIONAL_PDF_RECOVERY_SOURCE = SOURCE;
export const INSTITUTIONAL_PDF_RECOVERY_VERSION = VERSION;
export const INSTITUTIONAL_PDF_RECOVERABLE_CODES = Object.freeze([...RECOVERABLE_CODES]);
