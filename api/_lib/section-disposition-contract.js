/**
 * section-disposition-contract-v1
 *
 * Universal pre-render section disposition contract for Screening and Full
 * Underwriting. Doctrine: Core-Gated Publish-or-Collapse.
 *
 * Dispositions:
 *   include | include_qualified | compact | collapse | omit
 *
 * Classifications:
 *   core_required | analytical | supplementary | optional |
 *   certification_only | presentation_only
 *
 * This module does not rediscover source authority. Callers pass already-
 * governed section state; the contract only records disposition, minimum
 * surviving facts, and certification expectation.
 */

export const SECTION_DISPOSITION_CONTRACT_VERSION = "section-disposition-contract-v1";

export const SECTION_DISPOSITIONS = Object.freeze({
  INCLUDE: "include",
  INCLUDE_QUALIFIED: "include_qualified",
  COMPACT: "compact",
  COLLAPSE: "collapse",
  OMIT: "omit",
});

export const SECTION_CLASSIFICATIONS = Object.freeze({
  CORE_REQUIRED: "core_required",
  ANALYTICAL: "analytical",
  SUPPLEMENTARY: "supplementary",
  OPTIONAL: "optional",
  CERTIFICATION_ONLY: "certification_only",
  PRESENTATION_ONLY: "presentation_only",
});

export const DETAILED_LINEAGE_PLACEMENTS = Object.freeze({
  PRIMARY_CELL: "primary_cell",
  FOOTNOTE: "footnote",
  APPENDIX: "appendix",
  QUALITY_MANIFEST: "quality_manifest",
  INTERNAL_RECEIPT: "internal_receipt",
});

/** Core-required sections may never collapse or omit. */
const CORE_PROTECTED_DISPOSITIONS = new Set([
  SECTION_DISPOSITIONS.INCLUDE,
  SECTION_DISPOSITIONS.INCLUDE_QUALIFIED,
  SECTION_DISPOSITIONS.COMPACT,
]);

export function applySectionDisposition({
  sectionKey = "",
  classification = SECTION_CLASSIFICATIONS.SUPPLEMENTARY,
  requestedDisposition = SECTION_DISPOSITIONS.INCLUDE,
  minimumSurvivingFactKeys = [],
  missingFactOrLimitationReason = null,
  compactRendererEligible = false,
  collapseReason = null,
  manifestDisclosure = null,
  certificationExpectation = "require_minimum_facts",
  customerVisibleSourceLabelPolicy = "institutional_only",
  detailedLineagePlacement = DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
} = {}) {
  const key = String(sectionKey || "").trim();
  const classif = Object.values(SECTION_CLASSIFICATIONS).includes(classification)
    ? classification
    : SECTION_CLASSIFICATIONS.SUPPLEMENTARY;
  let disposition = Object.values(SECTION_DISPOSITIONS).includes(requestedDisposition)
    ? requestedDisposition
    : SECTION_DISPOSITIONS.INCLUDE;

  if (classif === SECTION_CLASSIFICATIONS.CORE_REQUIRED) {
    if (!CORE_PROTECTED_DISPOSITIONS.has(disposition)) {
      disposition = SECTION_DISPOSITIONS.COMPACT;
    }
  }

  if (
    disposition === SECTION_DISPOSITIONS.COMPACT &&
    compactRendererEligible !== true &&
    classif !== SECTION_CLASSIFICATIONS.CORE_REQUIRED
  ) {
    disposition = SECTION_DISPOSITIONS.INCLUDE_QUALIFIED;
  }

  return {
    version: SECTION_DISPOSITION_CONTRACT_VERSION,
    sectionKey: key,
    classification: classif,
    disposition,
    minimumSurvivingFactKeys: Array.isArray(minimumSurvivingFactKeys)
      ? minimumSurvivingFactKeys.map(String)
      : [],
    missingFactOrLimitationReason: missingFactOrLimitationReason
      ? String(missingFactOrLimitationReason)
      : null,
    compactRendererEligible: Boolean(compactRendererEligible),
    collapseReason: collapseReason ? String(collapseReason) : null,
    manifestDisclosure: manifestDisclosure
      ? String(manifestDisclosure)
      : buildDefaultManifestDisclosure(key, disposition, classif),
    certificationExpectation: String(certificationExpectation || "require_minimum_facts"),
    customerVisibleSourceLabelPolicy: String(
      customerVisibleSourceLabelPolicy || "institutional_only"
    ),
    detailedLineagePlacement: Object.values(DETAILED_LINEAGE_PLACEMENTS).includes(
      detailedLineagePlacement
    )
      ? detailedLineagePlacement
      : DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
  };
}

function buildDefaultManifestDisclosure(sectionKey, disposition, classification) {
  if (disposition === SECTION_DISPOSITIONS.INCLUDE) return null;
  const label = sectionKey || "section";
  if (disposition === SECTION_DISPOSITIONS.COMPACT) {
    return `${label}: presented in compact institutional form; detailed lineage recorded in Quality Manifest.`;
  }
  if (disposition === SECTION_DISPOSITIONS.COLLAPSE) {
    return `${label}: supplementary detail collapsed; minimum governed facts retained where available.`;
  }
  if (disposition === SECTION_DISPOSITIONS.OMIT) {
    return `${label}: optional surface omitted (${classification}).`;
  }
  if (disposition === SECTION_DISPOSITIONS.INCLUDE_QUALIFIED) {
    return `${label}: included with qualification; see limitations.`;
  }
  return null;
}

export function buildDispositionManifestEntry(dispositionRecord = {}) {
  const d = dispositionRecord || {};
  return {
    sectionKey: d.sectionKey || null,
    originalClassification: d.classification || null,
    finalDisposition: d.disposition || null,
    reason: d.collapseReason || d.missingFactOrLimitationReason || d.manifestDisclosure || null,
    minimumFactsPreserved: Array.isArray(d.minimumSurvivingFactKeys)
      ? d.minimumSurvivingFactKeys
      : [],
    detailMovedOrOmitted:
      d.detailedLineagePlacement &&
      d.detailedLineagePlacement !== DETAILED_LINEAGE_PLACEMENTS.PRIMARY_CELL
        ? d.detailedLineagePlacement
        : null,
    sourceLimitation: d.missingFactOrLimitationReason || null,
    customerMeaningChanged: d.disposition === SECTION_DISPOSITIONS.OMIT,
    certificationOutcome: d.certificationExpectation || null,
    disclosure: d.manifestDisclosure || null,
  };
}

export function compactDenseSourceTablesInApprovedHtml(approvedHtml = "") {
  const html = String(approvedHtml || "");
  if (!html) {
    return {
      html: "",
      receipt: {
        version: SECTION_DISPOSITION_CONTRACT_VERSION,
        attempted: false,
        tablesCompacted: 0,
        reason: "empty_html",
      },
    };
  }

  let tablesCompacted = 0;

  const compactTablePattern =
    /<table\b([^>]*?)>([\s\S]*?)<\/table>/gi;

  const compacted = html.replace(compactTablePattern, (full, attrs, body) => {
    const attrStr = String(attrs || "");
    const isDispositionCompact = /data-iq-disposition\s*=\s*["']compact["']/i.test(attrStr);
    const isSourceTable = /class\s*=\s*["'][^"']*source-table[^"']*["']/i.test(attrStr);
    if (!isDispositionCompact && !isSourceTable) return full;

    const headerMatch = body.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/i);
    if (!headerMatch) return full;
    const headerCells = [];
    const thPattern = /<th\b[^>]*>([\s\S]*?)<\/th>/gi;
    let th;
    while ((th = thPattern.exec(headerMatch[1])) !== null) {
      headerCells.push(
        String(th[1] || "")
          .replace(/<[^>]+>/g, "")
          .trim()
          .toLowerCase()
      );
    }
    if (headerCells.length < 3) return full;
    const hasFormulaOrSources =
      headerCells.some((h) => /formula|numerator|denominator|sources?|provenance/i.test(h));
    if (!hasFormulaOrSources && !isDispositionCompact) return full;

    const tbodyMatch = body.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) return full;
    const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    const newRows = [];
    let rowMatch;
    while ((rowMatch = rowPattern.exec(tbodyMatch[1])) !== null) {
      const cells = [];
      const cellPattern = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[0]);
      }
      if (cells.length < 2) continue;
      newRows.push(`<tr>${cells[0]}${cells[1]}</tr>`);
    }
    if (!newRows.length) return full;

    tablesCompacted += 1;
    const newAttrs = attrStr.includes("data-iq-disposition")
      ? attrStr
      : `${attrStr} data-iq-disposition="compact"`;
    return `<table${newAttrs}><thead><tr><th>Metric</th><th>Result</th></tr></thead><tbody>${newRows.join("")}</tbody></table>`;
  });

  return {
    html: compacted,
    receipt: {
      version: SECTION_DISPOSITION_CONTRACT_VERSION,
      attempted: true,
      tablesCompacted,
      disposition: tablesCompacted > 0 ? SECTION_DISPOSITIONS.COMPACT : null,
      detailedLineagePlacement: DETAILED_LINEAGE_PLACEMENTS.QUALITY_MANIFEST,
      reason:
        tablesCompacted > 0
          ? "dense_source_tables_compacted_to_metric_result"
          : "no_eligible_dense_tables",
    },
  };
}

export function isCollapseEligibleBossIssue(code = "") {
  const c = String(code || "").toUpperCase();
  return (
    c === "PDF_PAGE_OVERFLOW" ||
    c === "PDF_REQUIRED_FINANCIAL_FACTS_MISSING" ||
    c.includes("OVERFLOW") ||
    c.includes("LAYOUT")
  );
}

export default {
  SECTION_DISPOSITION_CONTRACT_VERSION,
  SECTION_DISPOSITIONS,
  SECTION_CLASSIFICATIONS,
  DETAILED_LINEAGE_PLACEMENTS,
  applySectionDisposition,
  buildDispositionManifestEntry,
  compactDenseSourceTablesInApprovedHtml,
  isCollapseEligibleBossIssue,
};
