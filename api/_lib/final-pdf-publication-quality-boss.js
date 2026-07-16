import pdfParse from "pdf-parse";
import { isCanonicalInstitutionalFinancialIntelligence } from "./institutional-financial-intelligence.js";

const FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION = "p0c_final_pdf_publication_quality_boss_v1";

function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  return null;
}

async function toBufferAsync(value) {
  const direct = toBuffer(value);
  if (direct) return direct;
  if (value && typeof value.arrayBuffer === "function") return Buffer.from(await value.arrayBuffer());
  return null;
}

function decodeHtml(value = "") {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#36;/gi, "$")
    .replace(/&#37;/gi, "%");
}

function stripHtml(value = "") {
  return decodeHtml(String(value || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeComparisonText(value = "") {
  return normalizeText(value)
    .replace(/\s*([$%])\s*/g, "$1")
    .replace(/,/g, "")
    .replace(/\s*([():/|])\s*/g, "$1")
    .replace(/\s+/g, "");
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function buildIssue(code, message, evidence = {}, path = "pdf") {
  return {
    code,
    severity: "critical",
    category: "internal_pdf_publication_quality_failure",
    classification: "internal_system_failure",
    failure_class: "internal_system_failure",
    message,
    evidence,
    path,
    blocks_customer_delivery: true,
    customer_document_failure: false,
  };
}

function lineFromItems(items = [], y = 0) {
  const ordered = [...items].sort((left, right) => left.x - right.x);
  return {
    text: ordered.map((item) => item.text).join(" ").replace(/\s+/g, " ").trim(),
    y,
    x: ordered.length ? Math.min(...ordered.map((item) => item.x)) : 0,
    maxX: ordered.length ? Math.max(...ordered.map((item) => item.x + item.width)) : 0,
    fontSize: ordered.length ? Math.max(...ordered.map((item) => item.fontSize)) : 0,
    items: ordered,
  };
}

function groupItemsIntoLines(items = []) {
  const groups = [];
  for (const item of [...items].sort((left, right) => right.y - left.y || left.x - right.x)) {
    let group = groups.find((candidate) => Math.abs(candidate.y - item.y) <= 2.25);
    if (!group) {
      group = { y: item.y, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups
    .map((group) => lineFromItems(group.items, group.y))
    .sort((left, right) => right.y - left.y || left.x - right.x);
}

export async function analyzeFinalPdfBytes(pdfBytes, { pdfParser = pdfParse } = {}) {
  const buffer = await toBufferAsync(pdfBytes);
  if (!buffer || buffer.length < 5 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    const error = new Error("Final PDF bytes are missing or invalid");
    error.code = "PDF_ARTIFACT_FAILED";
    throw error;
  }

  const pages = [];
  let pageNumber = 0;
  const parsed = await pdfParser(buffer, {
    max: 0,
    version: "v1.10.100",
    pagerender: async (pageData) => {
      pageNumber += 1;
      const viewport = pageData?.getViewport?.(1) || pageData?.getViewport?.({ scale: 1 }) || {};
      const content = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });
      const items = (Array.isArray(content?.items) ? content.items : []).map((item) => {
        const transform = Array.isArray(item?.transform) ? item.transform : [];
        const fontSize = Math.max(Math.abs(Number(transform[0]) || 0), Math.abs(Number(transform[3]) || 0), Number(item?.height) || 0);
        return {
          text: String(item?.str || "").trim(),
          x: Number(transform[4]) || 0,
          y: Number(transform[5]) || 0,
          width: Math.max(0, Number(item?.width) || 0),
          height: Math.max(0, Number(item?.height) || fontSize || 0),
          fontSize,
        };
      }).filter((item) => item.text);
      const lines = groupItemsIntoLines(items);
      const text = lines.map((line) => line.text).join("\n");
      pages.push({
        pageNumber,
        width: Number(viewport?.width) || Number(pageData?.view?.[2]) || 612,
        height: Number(viewport?.height) || Number(pageData?.view?.[3]) || 792,
        items,
        lines,
        text,
      });
      return text;
    },
  });

  return {
    validPdf: true,
    byteLength: buffer.length,
    pageCount: Number(parsed?.numpages) || pages.length,
    text: pages.map((page) => page.text).join("\n\n"),
    pages,
    metadata: parsed?.info || null,
  };
}

function extractApprovedFinancialRows(html = "") {
  const rows = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowPattern.exec(String(html || ""))) !== null) {
    const cells = [];
    const cellPattern = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) cells.push(stripHtml(cellMatch[1]));
    if (cells.length < 2) continue;
    const label = cells[0];
    if (!label) continue;
    for (const value of cells.slice(1)) {
      if (!value || /not available|not provided|not applicable|collapsed|omitted/i.test(value)) continue;
      if (!/(?:[$€£]\s*\(?[\d,.]+|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*x\b|\b\d{4}-\d{2}-\d{2}\b|\b\d+(?:\.\d+)?\s*years?\b)/i.test(value)) continue;
      rows.push({ label, value });
    }
  }
  return rows.filter((row, index, all) => {
    const key = `${normalizeComparisonText(row.label)}|${normalizeComparisonText(row.value)}`;
    return all.findIndex((candidate) => `${normalizeComparisonText(candidate.label)}|${normalizeComparisonText(candidate.value)}` === key) === index;
  });
}

function extractApprovedHeadings(html = "") {
  const headings = [];
  const pattern = /<(?:h1|h2|h3|h4)\b[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4)>/gi;
  let match;
  while ((match = pattern.exec(String(html || ""))) !== null) {
    const text = stripHtml(match[1]);
    if (text.length >= 4 && text.length <= 160) headings.push(text);
  }
  return unique(headings);
}

export function buildApprovedPdfSurfaceManifest({
  approvedHtml = "",
  requiredTextAnchors = [],
  sourceReconciliation = null,
  deterministicContractQaSeal = null,
  financialIntelligence = null,
} = {}) {
  const reconciliationState = sourceReconciliation?.state && typeof sourceReconciliation.state === "object"
    ? sourceReconciliation.state
    : sourceReconciliation;
  const reconciliationRequired = deterministicContractQaSeal?.source_reconciliation?.required === true ||
    ["source_reconciliation_required", "parser_suspected"].includes(String(reconciliationState?.status || "").toLowerCase());
  const financialSectionHeadings = {
    debtServiceCoverage: "Debt Service and Coverage",
    debtTermAnalysis: "Debt Term and Maturity Analysis",
    coreReconciliation: "Core Source Reconciliation",
    capitalPlanAnalysis: "Capital Plan and Reserve Position",
  };
  const financialIntelligenceHeadings = Object.entries(financialIntelligence?.customerSections || {})
    .filter(([, section]) => section?.displayReady === true)
    .map(([sectionKey]) => financialSectionHeadings[sectionKey])
    .filter(Boolean);
  return {
    approvedText: stripHtml(approvedHtml),
    financialRows: extractApprovedFinancialRows(approvedHtml),
    headings: extractApprovedHeadings(approvedHtml),
    requiredTextAnchors: unique(requiredTextAnchors.map((value) => String(value || "").trim())),
    reconciliation: {
      required: reconciliationRequired,
      disclosure: String(reconciliationState?.source_reconciliation_disclosure || "").trim(),
    },
    deterministicContractQaSealOk: deterministicContractQaSeal?.ok === true,
    financialIntelligence: {
      present: financialIntelligence != null,
      valid: financialIntelligence == null ||
        isCanonicalInstitutionalFinancialIntelligence(financialIntelligence),
      requiredHeadings: financialIntelligenceHeadings,
    },
  };
}

function meaningfulPageText(page = {}) {
  return normalizeText(page?.text || "")
    .replace(/\bpage\s+\d+(?:\s+(?:of|\/)\s+\d+)?\b/gi, " ")
    .replace(/\binvestoriq(?: technologies inc\.)?\b/gi, " ")
    .replace(/\bcapital intelligence memorandum\b/gi, " ")
    .replace(/\bconfidential\b/gi, " ")
    .replace(/\bcopyright\b|©/gi, " ")
    .replace(/\bdocraptor\b|\btest document\b|\btest mode\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPageNumberLine(line = {}, page = {}, pageCount = 0) {
  const height = Number(page?.height) || 792;
  if (Number(line?.y) > height * 0.16) return false;
  const text = String(line?.text || "").trim();
  return /^(?:page\s*)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(text) ||
    new RegExp(`^page\\s+${Number(page?.pageNumber)}\\s+of\\s+${pageCount}$`, "i").test(text);
}

function hasPageNumber(page = {}, pageCount = 0) {
  if (page?.hasPageNumber === true) return true;
  return (Array.isArray(page?.lines) ? page.lines : []).some((line) =>
    isPageNumberLine(line, page, pageCount)
  );
}

function isHeadingLine(line = {}) {
  const text = String(line?.text || "").trim();
  if (text.length < 4 || text.length > 150) return false;
  return Number(line?.fontSize) >= 12 || /^\d+(?:\.\d+)*\s+[A-Z]/.test(text) || /^[A-Z][A-Za-z /&-]{3,80}$/.test(text);
}

function tableHeadingLine(line = {}) {
  return isHeadingLine(line) && /(?:table|summary|analysis|reconciliation|unit mix|schedule|source|coverage|diligence|financial|valuation|debt|capitalization)/i.test(String(line?.text || ""));
}

function inspectLayout(analysis = {}) {
  const issues = [];
  const pages = Array.isArray(analysis?.pages) ? analysis.pages : [];
  const blankPages = [];
  const nearlyBlankPages = [];
  const overflow = [];
  const orphanedHeadings = [];
  const separatedTableHeadings = [];
  const unreadableTableRows = [];
  const duplicatedHeaders = [];
  const topLinePresence = new Map();

  for (const page of pages) {
    const meaningful = meaningfulPageText(page);
    const wordCount = meaningful ? meaningful.split(/\s+/).filter(Boolean).length : 0;
    if (!meaningful) blankPages.push(page.pageNumber);
    else if (meaningful.length < 80 || wordCount < 10) nearlyBlankPages.push(page.pageNumber);

    const width = Number(page?.width) || 612;
    const height = Number(page?.height) || 792;
    for (const item of Array.isArray(page?.items) ? page.items : []) {
      if (item.x < -2 || item.y < -2 || item.x + item.width > width + 2 || item.y + item.height > height + 2) {
        overflow.push({ page: page.pageNumber, text: item.text, x: item.x, y: item.y, width: item.width, height: item.height });
      }
    }

    const lines = Array.isArray(page?.lines) ? page.lines : [];
    const topLines = lines.filter((line) => Number(line?.y) >= height * 0.88 && normalizeText(line?.text).length >= 5);
    const pageTopCounts = new Map();
    for (const line of topLines) {
      const key = normalizeText(line.text);
      pageTopCounts.set(key, (pageTopCounts.get(key) || 0) + 1);
      if (!topLinePresence.has(key)) topLinePresence.set(key, new Set());
      topLinePresence.get(key).add(page.pageNumber);
    }
    for (const [text, count] of pageTopCounts.entries()) {
      if (count > 1) duplicatedHeaders.push({ page: page.pageNumber, text, count });
    }

    for (const line of lines) {
      const below = lines.filter((candidate) => candidate.y < line.y - 3 && candidate.y > height * 0.1 && normalizeText(candidate.text).length >= 3);
      if (isHeadingLine(line) && line.y < height * 0.16 && below.length === 0) {
        orphanedHeadings.push({ page: page.pageNumber, heading: line.text, y: line.y });
      }
      if (tableHeadingLine(line) && line.y < height * 0.22 && below.length < 2) {
        separatedTableHeadings.push({ page: page.pageNumber, heading: line.text, y: line.y, following_lines: below.length });
      }
      const numericTokens = String(line?.text || "").match(/(?:[$€£]?\(?\d[\d,.]*\)?%?)/g) || [];
      const pageNumberLine = isPageNumberLine(line, page, Number(analysis?.pageCount) || pages.length);
      if (!pageNumberLine && numericTokens.length >= 2 && Number(line?.fontSize) > 0 && Number(line.fontSize) < 6) {
        unreadableTableRows.push({ page: page.pageNumber, text: line.text, font_size: line.fontSize });
      }
    }
  }

  const contentPages = pages.filter((page) => Number(page?.pageNumber) > 1 && !blankPages.includes(page.pageNumber));
  const brokenHeaders = [];
  for (const [text, pageNumbers] of topLinePresence.entries()) {
    if (contentPages.length < 3 || pageNumbers.size < Math.ceil(contentPages.length * 0.6)) continue;
    const missing = contentPages.map((page) => page.pageNumber).filter((pageNumberValue) => !pageNumbers.has(pageNumberValue));
    if (missing.length > 0) brokenHeaders.push({ header: text, missing_pages: missing });
  }

  if (blankPages.length) issues.push(buildIssue("PDF_BLANK_PAGES", "The final PDF contains blank pages.", { pages: blankPages }, "pdf.pages"));
  if (nearlyBlankPages.length) issues.push(buildIssue("PDF_NEARLY_BLANK_PAGES", "The final PDF contains nearly blank pages.", { pages: nearlyBlankPages }, "pdf.pages"));
  if (overflow.length) issues.push(buildIssue("PDF_PAGE_OVERFLOW", "Rendered PDF content exceeds a page boundary.", { occurrences: overflow.slice(0, 25) }, "pdf.layout"));
  if (orphanedHeadings.length) issues.push(buildIssue("PDF_ORPHANED_HEADINGS", "One or more headings are orphaned at the bottom of a page.", { occurrences: orphanedHeadings }, "pdf.layout"));
  if (separatedTableHeadings.length) issues.push(buildIssue("PDF_TABLE_SEPARATED_FROM_HEADING", "One or more table headings are separated from their table content.", { occurrences: separatedTableHeadings }, "pdf.layout"));
  if (unreadableTableRows.length) issues.push(buildIssue("PDF_UNREADABLE_TABLE", "One or more rendered table rows use unreadably small text.", { occurrences: unreadableTableRows.slice(0, 25) }, "pdf.tables"));
  if (duplicatedHeaders.length) issues.push(buildIssue("PDF_DUPLICATED_RUNNING_HEADER", "A running header is duplicated on the same page.", { occurrences: duplicatedHeaders }, "pdf.headers"));
  if (brokenHeaders.length) issues.push(buildIssue("PDF_BROKEN_RUNNING_HEADER", "A recurring running header disappears on one or more content pages.", { occurrences: brokenHeaders }, "pdf.headers"));
  return issues;
}

function inspectApprovedSurface(analysis = {}, manifest = {}) {
  const issues = [];
  const pdfText = normalizeComparisonText(analysis?.text || "");
  const missingFinancialRows = (Array.isArray(manifest?.financialRows) ? manifest.financialRows : []).filter((row) => {
    const label = normalizeComparisonText(row.label);
    const value = normalizeComparisonText(row.value);
    return !label || !value || !pdfText.includes(label) || !pdfText.includes(value);
  });
  if (missingFinancialRows.length > 0) {
    issues.push(buildIssue(
      "PDF_REQUIRED_FINANCIAL_FACTS_MISSING",
      "The final PDF dropped one or more financial facts that were present on the approved customer surface.",
      { missing_rows: missingFinancialRows.slice(0, 50) },
      "pdf.approvedSurface.financialFacts"
    ));
  }

  const missingAnchors = (Array.isArray(manifest?.requiredTextAnchors) ? manifest.requiredTextAnchors : [])
    .filter((anchor) => !pdfText.includes(normalizeComparisonText(anchor)));
  const missingHeadings = (Array.isArray(manifest?.headings) ? manifest.headings : [])
    .filter((heading) => !pdfText.includes(normalizeComparisonText(heading)));
  if (missingAnchors.length > 0 || missingHeadings.length > 0) {
    issues.push(buildIssue(
      "PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE",
      "The final PDF content disagrees with the approved customer surface.",
      { missing_required_anchors: missingAnchors, missing_approved_headings: missingHeadings },
      "pdf.approvedSurface"
    ));
  }

  if (manifest?.reconciliation?.required === true) {
    const disclosure = String(manifest?.reconciliation?.disclosure || "").trim();
    if (!disclosure || !pdfText.includes(normalizeComparisonText(disclosure))) {
      issues.push(buildIssue(
        "PDF_RECONCILIATION_DISCLOSURE_MISSING",
        "The required approved source reconciliation disclosure did not survive PDF rendering.",
        { approved_disclosure: disclosure || null },
        "pdf.approvedSurface.sourceReconciliation"
      ));
    }
  }
  const missingFinancialIntelligenceHeadings = (Array.isArray(manifest?.financialIntelligence?.requiredHeadings)
    ? manifest.financialIntelligence.requiredHeadings
    : []).filter((heading) => !pdfText.includes(normalizeComparisonText(heading)));
  if (manifest?.financialIntelligence?.valid !== true || missingFinancialIntelligenceHeadings.length > 0) {
    issues.push(buildIssue(
      "PDF_FINANCIAL_INTELLIGENCE_RECEIPT_SURFACE_MISMATCH",
      "The final PDF did not preserve the approved institutional financial-intelligence surface.",
      {
        receipt_valid: manifest?.financialIntelligence?.valid === true,
        missing_headings: missingFinancialIntelligenceHeadings,
      },
      "pdf.approvedSurface.financialIntelligence"
    ));
  }
  return issues;
}

export async function inspectFinalPdfPublicationQuality({
  pdfBytes,
  approvedHtml = "",
  deterministicContractQaSeal = null,
  sourceReconciliation = null,
  financialIntelligence = null,
  requiredTextAnchors = [],
  artifactMode = "production_pdf",
  publicationTarget = "internal_test",
  pdfAnalysis = null,
  pdfParser = pdfParse,
} = {}) {
  const issues = [];
  let analysis = pdfAnalysis;
  try {
    analysis = analysis || await analyzeFinalPdfBytes(pdfBytes, { pdfParser });
  } catch (error) {
    issues.push(buildIssue("PDF_BYTES_INVALID", "The final PDF bytes could not be validated.", { error: error?.message || String(error) }, "pdf.bytes"));
    analysis = { validPdf: false, pageCount: 0, text: "", pages: [] };
  }

  const normalizedArtifactMode = String(artifactMode || "").trim().toLowerCase();
  const normalizedTarget = String(publicationTarget || "").trim().toLowerCase();
  const externalTarget = /(?:external|customer|public|production)/.test(normalizedTarget);
  if (externalTarget && normalizedArtifactMode !== "production_pdf") {
    issues.push(buildIssue(
      "TEST_MODE_PDF_EXTERNAL_PUBLICATION_BLOCKED",
      "A test-mode or stub PDF cannot be published to an external customer path.",
      { artifact_mode: normalizedArtifactMode || null, publication_target: normalizedTarget || null },
      "pdf.publicationMode"
    ));
  }

  const manifest = buildApprovedPdfSurfaceManifest({
    approvedHtml,
    requiredTextAnchors,
    sourceReconciliation,
    deterministicContractQaSeal,
    financialIntelligence,
  });
  const internalStub = normalizedArtifactMode === "stub_pdf" && !externalTarget;
  if (!internalStub) {
    if (deterministicContractQaSeal && deterministicContractQaSeal.ok !== true) {
      issues.push(buildIssue(
        "APPROVED_CUSTOMER_SURFACE_NOT_SEALED",
        "The PDF Publication Quality Boss received a customer surface that was not approved by deterministic Contract QA.",
        { contract_qa_status: deterministicContractQaSeal?.status || null },
        "pdf.approvedSurface.contractQa"
      ));
    }
    issues.push(...inspectLayout(analysis));
    issues.push(...inspectApprovedSurface(analysis, manifest));

    const pageCount = Number(analysis?.pageCount) || 0;
    if (pageCount > 1) {
      const missingPageNumbers = (Array.isArray(analysis?.pages) ? analysis.pages : [])
        .filter((page) => Number(page?.pageNumber) > 1 && !hasPageNumber(page, pageCount))
        .map((page) => page.pageNumber);
      if (missingPageNumbers.length > 0) {
        issues.push(buildIssue("PDF_PAGE_NUMBERS_MISSING", "One or more content pages are missing page numbers.", { pages: missingPageNumbers }, "pdf.pagination"));
      }
    }

    const prohibited = String(analysis?.text || "").match(/(?:\u2013|\u2014|Ã¢â‚¬â€œ|Ã¢â‚¬â€)/g) || [];
    if (prohibited.length > 0) {
      issues.push(buildIssue("PDF_PROHIBITED_PUNCTUATION", "The final PDF contains prohibited customer-visible punctuation.", { matches: unique(prohibited).slice(0, 10) }, "pdf.typography"));
    }
  }

  return {
    version: FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION,
    authority: "final_pdf_publication_quality_boss",
    scope: "rendering_survival_only",
    ok: issues.length === 0,
    status: issues.length === 0 ? (internalStub ? "internal_test_artifact_only" : "certified") : "internal_pdf_publication_quality_failure",
    failure_class: issues.length === 0 ? null : "internal_system_failure",
    customer_document_failure: false,
    external_publication_allowed: issues.length === 0 && normalizedArtifactMode === "production_pdf",
    artifact_mode: normalizedArtifactMode || null,
    publication_target: normalizedTarget || null,
    analysis: {
      valid_pdf: analysis?.validPdf === true,
      byte_length: Number(analysis?.byteLength) || null,
      page_count: Number(analysis?.pageCount) || 0,
    },
    approved_surface: {
      financial_row_count: manifest.financialRows.length,
      required_anchor_count: manifest.requiredTextAnchors.length,
      reconciliation_required: manifest.reconciliation.required,
      contract_qa_sealed: manifest.deterministicContractQaSealOk,
      financial_intelligence_receipt_present: manifest.financialIntelligence.present,
      financial_intelligence_required_section_count: manifest.financialIntelligence.requiredHeadings.length,
    },
    issues,
  };
}

export async function assertFinalPdfPublicationQuality(args = {}) {
  const result = await inspectFinalPdfPublicationQuality(args);
  if (!result.ok) {
    const error = new Error("Final PDF failed Publication Quality Boss certification");
    error.code = "PDF_ARTIFACT_FAILED";
    error.context = {
      failure_class: "internal_system_failure",
      customer_document_failure: false,
      final_pdf_publication_quality_boss: result,
    };
    throw error;
  }
  return result;
}

export const FINAL_PDF_PUBLICATION_QUALITY_CONTRACT = Object.freeze({
  version: FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION,
  scope: "rendering_survival_only",
});
