import pdfParse from "pdf-parse";
import { isCanonicalInstitutionalFinancialIntelligence } from "./institutional-financial-intelligence.js";
import {
  INSTITUTIONAL_PDF_CONSTITUTION,
  isCanonicalInstitutionalPdfConstitution,
} from "./institutional-pdf-constitution.js";
import { buildInstitutionalPdfRepairPlan } from "./institutional-pdf-repair-plan.js";

const FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION = "gate10r_final_pdf_publication_quality_boss_v4";
const PAGE_CERTIFICATION_SCOPE = "institutional_page_by_page_certification";
const TEST_WATERMARK_PATTERN = /\b(?:docraptor|test document|test mode)\b/i;
const NONBLOCKING_QUALITY_ISSUE_CODES = new Set([
  "PDF_BLANK_PAGES",
  "PDF_NEARLY_BLANK_PAGES",
  "PDF_ORPHANED_HEADINGS",
  "PDF_TABLE_SEPARATED_FROM_HEADING",
  "PDF_UNREADABLE_TABLE",
  "PDF_DUPLICATED_RUNNING_HEADER",
  "PDF_BROKEN_RUNNING_HEADER",
  "PDF_RUNNING_HEADER_MISSING",
  "PDF_RUNNING_FOOTER_MISSING",
  "PDF_SPACING_OVERLAP",
  "PDF_NUMERIC_COLUMN_MISALIGNMENT",
  "PDF_APPROVED_TABLE_NOT_CERTIFIED",
  "PDF_APPROVED_CHART_NOT_CERTIFIED",
  "PDF_APPROVED_NUMBER_NOT_CERTIFIED",
  "PDF_PAGE_NUMBERS_MISSING",
]);

function issueBlocksCustomerDelivery(code = "") {
  return !NONBLOCKING_QUALITY_ISSUE_CODES.has(String(code || "").trim());
}

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

function attributeValue(tag = "", name = "") {
  const escapedName = String(name || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag || "").match(new RegExp(`${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return decodeHtml(match?.[1] ?? match?.[2] ?? "").trim();
}

function extractElementBlock(html = "", openIndex = -1, tagName = "div") {
  if (openIndex < 0) return "";
  const source = String(html || "");
  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tagPattern.lastIndex = openIndex;
  let depth = 0;
  let match;
  while ((match = tagPattern.exec(source)) !== null) {
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return source.slice(openIndex, tagPattern.lastIndex);
  }
  return source.slice(openIndex);
}

function extractDisplayedNumbers(value = "") {
  const visibleText = stripHtml(value);
  const matches = visibleText.match(/(?:\(\s*)?(?:[$€£]\s*)?-?\d[\d,]*(?:\.\d+)?\)?(?:\s*%|\s*x|\s*years?)?/gi) || [];
  return unique(matches.map((number) => number.replace(/\s+/g, " ").trim()));
}

function numberKey(value = "") {
  return normalizeComparisonText(value).replace(/[()]/g, "").replace(/^-/, "negative");
}

function orderedLineTextCandidates(line = {}) {
  const items = [...(Array.isArray(line?.items) ? line.items : [])]
    .filter((item) => !isTestWatermarkText(item?.text))
    .sort((left, right) => Number(left.x) - Number(right.x));
  return unique([
    String(line?.text || ""),
    items.map((item) => item.text).join(" "),
    items.map((item) => item.text).join(""),
  ]);
}

function pageTextCandidates(page = {}) {
  return unique([
    pageTextWithoutExcludedArtifacts(page),
    ...(Array.isArray(page?.lines) ? page.lines : []).flatMap(orderedLineTextCandidates),
  ]);
}

function directComparisonMatch(value = "", candidate = "") {
  const expected = normalizeComparisonText(value);
  return Boolean(expected) && normalizeComparisonText(candidate).includes(expected);
}

function orderedGlyphMatch(value = "", candidate = "") {
  const expected = normalizeComparisonText(value).replace(/[^a-z0-9$€£%.-]/g, "");
  const actual = normalizeComparisonText(candidate).replace(/[^a-z0-9$€£%.-]/g, "");
  return Boolean(expected) && actual.includes(expected);
}

function certificationMatch(analysis = {}, value = "") {
  for (const page of Array.isArray(analysis?.pages) ? analysis.pages : []) {
    for (const candidate of pageTextCandidates(page)) {
      if (directComparisonMatch(value, candidate)) return { certified: true, method: "direct_text", page: page.pageNumber };
      if (orderedGlyphMatch(value, candidate)) return { certified: true, method: "ordered_glyph_reconstruction", page: page.pageNumber };
    }
  }
  return { certified: false, method: "not_found", page: null };
}

function numberCertificationMatch(analysis = {}, value = "") {
  const expected = numberKey(value);
  if (!expected) return { certified: false, method: "not_found", page: null };
  for (const page of Array.isArray(analysis?.pages) ? analysis.pages : []) {
    for (const candidate of pageTextCandidates(page)) {
      const actual = numberKey(candidate);
      let index = actual.indexOf(expected);
      while (index >= 0) {
        const preceding = actual[index - 1] || "";
        const following = actual[index + expected.length] || "";
        const positiveExpected = !expected.startsWith("negative");
        const numericBoundaryViolation = /[0-9.]/.test(preceding) || /[0-9.]/.test(following);
        if (!(positiveExpected && preceding === "-") && !numericBoundaryViolation) {
          return {
            certified: true,
            method: "ordered_glyph_reconstruction",
            page: page.pageNumber,
          };
        }
        index = actual.indexOf(expected, index + 1);
      }
    }
  }
  return { certified: false, method: "not_found", page: null };
}

function buildIssue(code, message, evidence = {}, path = "pdf") {
  const blocksCustomerDelivery = issueBlocksCustomerDelivery(code);
  return {
    code,
    severity: blocksCustomerDelivery ? "critical" : "high",
    category: blocksCustomerDelivery ? "internal_pdf_publication_quality_failure" : "internal_pdf_quality_incident",
    classification: blocksCustomerDelivery ? "internal_system_failure" : "internal_quality_incident",
    failure_class: blocksCustomerDelivery ? "internal_system_failure" : null,
    message,
    evidence,
    path,
    blocks_customer_delivery: blocksCustomerDelivery,
    publication_disposition: blocksCustomerDelivery ? "block" : "publish_with_quality_incident",
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
  const classHeadingPattern = /<(?:div|span|p)\b[^>]*class=(?:"[^"]*(?:chapter-heading|section-header-title|subsection-title)[^"]*"|'[^']*(?:chapter-heading|section-header-title|subsection-title)[^']*')[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi;
  while ((match = classHeadingPattern.exec(String(html || ""))) !== null) {
    const text = stripHtml(match[1]);
    if (text.length >= 4 && text.length <= 160) headings.push(text);
  }
  return unique(headings);
}

function extractApprovedChapters(html = "") {
  const source = String(html || "");
  const chapters = [];
  const pattern = /<section\b[^>]*data-iq-chapter=(?:"[^"]+"|'[^']+')[^>]*>/gi;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const block = extractElementBlock(source, match.index, "section");
    const titleMatch = block.match(/<div\b[^>]*class=(?:"[^"]*chapter-heading[^"]*"|'[^']*chapter-heading[^']*')[^>]*>([\s\S]*?)<\/div>/i);
    chapters.push({
      id: attributeValue(match[0], "data-iq-chapter"),
      title: stripHtml(titleMatch?.[1] || ""),
    });
  }
  return chapters.filter((chapter) => chapter.id);
}

function extractApprovedTables(html = "") {
  const source = String(html || "");
  const tables = [];
  const pattern = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const cells = [];
    const headers = [];
    const rowColumnCounts = [];
    const rows = [];
    const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowPattern.exec(match[1])) !== null) {
      const rowCells = [];
      const cellPattern = /<(t[dh])\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
        const text = stripHtml(cellMatch[2]);
        if (!text) continue;
        rowCells.push(text);
        cells.push(text);
        if (String(cellMatch[1]).toLowerCase() === "th") headers.push(text);
      }
      if (rowCells.length) {
        rowColumnCounts.push(rowCells.length);
        rows.push(rowCells);
      }
    }
    const openTag = match[0].match(/^<table\b[^>]*>/i)?.[0] || "";
    const preceding = source.slice(Math.max(0, match.index - 600), match.index);
    const precedingHeadings = extractApprovedHeadings(preceding);
    const explicitId = attributeValue(openTag, "data-iq-table");
    const columnCount = rowColumnCounts.length ? Math.max(...rowColumnCounts) : 0;
    if (!explicitId && columnCount < 2) continue;
    const id = explicitId || `approved-table-${tables.length + 1}`;
    tables.push({
      id,
      title: precedingHeadings.at(-1) || null,
      headers: unique(headers),
      cells,
      rows,
      columnCount,
      displayedNumbers: extractDisplayedNumbers(match[0]),
    });
  }
  return tables;
}

function extractApprovedCharts(html = "") {
  const source = String(html || "");
  const charts = [];
  const pattern = /<div\b[^>]*data-iq-chart=(?:"[^"]+"|'[^']+')[^>]*>/gi;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const block = extractElementBlock(source, match.index, "div");
    const titleMatch = block.match(/<(?:p|div|span)\b[^>]*class=(?:"[^"]*(?:subsection-title|evidence-chart-title)[^"]*"|'[^']*(?:subsection-title|evidence-chart-title)[^']*')[^>]*>([\s\S]*?)<\/(?:p|div|span)>/i);
    const values = [];
    const sourcePaths = [];
    const labels = [];
    const labelPattern = /<(?:div|span)\b[^>]*class=(?:"[^"]*evidence-chart-label[^"]*"|'[^']*evidence-chart-label[^']*')[^>]*>([\s\S]*?)<\/(?:div|span)>/gi;
    let labelMatch;
    while ((labelMatch = labelPattern.exec(block)) !== null) labels.push(stripHtml(labelMatch[1]));
    const valuePattern = /<[^>]+data-iq-value=(?:"[^"]*"|'[^']*')[^>]*>/gi;
    let valueMatch;
    while ((valueMatch = valuePattern.exec(block)) !== null) {
      values.push(attributeValue(valueMatch[0], "data-iq-value"));
      sourcePaths.push(attributeValue(valueMatch[0], "data-iq-source-path"));
    }
    charts.push({
      id: attributeValue(match[0], "data-iq-chart"),
      receipt: attributeValue(match[0], "data-iq-chart-receipt"),
      title: stripHtml(titleMatch?.[1] || ""),
      labels: unique(labels),
      visibleText: stripHtml(block),
      displayedNumbers: extractDisplayedNumbers(block),
      values: unique(values),
      sourcePaths: unique([
        ...sourcePaths,
        ...attributeValue(match[0], "data-iq-source-paths").split("|").map((value) => value.trim()),
      ]),
    });
  }
  return charts.filter((chart) => chart.id);
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
    chapters: extractApprovedChapters(approvedHtml),
    tables: extractApprovedTables(approvedHtml),
    charts: extractApprovedCharts(approvedHtml),
    displayedNumbers: extractDisplayedNumbers(approvedHtml),
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

function isTestWatermarkText(value = "") {
  return TEST_WATERMARK_PATTERN.test(String(value || ""));
}

function pageTextWithoutExcludedArtifacts(page = {}) {
  const lines = Array.isArray(page?.lines) ? page.lines : [];
  if (lines.length) return lines.filter((line) => !isTestWatermarkText(line?.text)).map((line) => line.text).join("\n");
  return String(page?.text || "").split(/\r?\n/).filter((line) => !isTestWatermarkText(line)).join("\n");
}

function meaningfulPageText(page = {}) {
  return normalizeText(pageTextWithoutExcludedArtifacts(page))
    .replace(/\bpage\s+\d+(?:\s+(?:of|\/)\s+\d+)?\b/gi, " ")
    .replace(/\binvestoriq(?: technologies inc\.)?\b/gi, " ")
    .replace(/\bcapital intelligence memorandum\b/gi, " ")
    .replace(/\bconfidential\b/gi, " ")
    .replace(/\bcopyright\b|©/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPageNumberLine(line = {}, page = {}, pageCount = 0) {
  const height = Number(page?.height) || 792;
  if (Number(line?.y) > height * 0.16) return false;
  const text = String(line?.text || "").trim();
  const expectedPage = Number(page?.pageNumber);
  const exactOrEmbedded = new RegExp(`(?:^|\\b)page\\s*${expectedPage}\\s*(?:of|\\/)\\s*${pageCount}(?:\\b|$)`, "i");
  return /^(?:page\s*)?\d+(?:\s*(?:of|\/)\s*\d+)?$/i.test(text) || exactOrEmbedded.test(text);
}

function hasPageNumber(page = {}, pageCount = 0) {
  if (page?.hasPageNumber === true) return true;
  return (Array.isArray(page?.lines) ? page.lines : []).some((line) =>
    isPageNumberLine(line, page, pageCount)
  );
}

function hasRunningFooterContent(line = {}, page = {}, pageCount = 0) {
  const height = Number(page?.height) || 792;
  if (Number(line?.y) > height * 0.08) return false;
  const pagePattern = new RegExp(`(?:^|\\b)page\\s*${Number(page?.pageNumber)}\\s*(?:of|\\/)\\s*${pageCount}(?:\\b|$)`, "ig");
  const remainder = String(line?.text || "").replace(pagePattern, " ").replace(/[|:/-]+/g, " ").replace(/\s+/g, " ").trim();
  return normalizeText(remainder).length >= 4;
}

function isHeadingLine(line = {}) {
  const text = String(line?.text || "").trim();
  if (text.length < 4 || text.length > 150) return false;
  return Number(line?.fontSize) >= 12 || /^\d+(?:\.\d+)*\s+[A-Z]/.test(text) || /^[A-Z][A-Za-z /&-]{3,80}$/.test(text);
}

function tableHeadingLine(line = {}) {
  return isHeadingLine(line) && /(?:table|summary|analysis|reconciliation|unit mix|schedule|source|coverage|diligence|financial|valuation|debt|capitalization)/i.test(String(line?.text || ""));
}

function inspectLayout(analysis = {}, manifest = {}) {
  const issues = [];
  const pages = Array.isArray(analysis?.pages) ? analysis.pages : [];
  const blankPages = [];
  const nearlyBlankPages = [];
  const overflow = [];
  const orphanedHeadings = [];
  const separatedTableHeadings = [];
  const unreadableTableRows = [];
  const duplicatedHeaders = [];
  const missingRunningHeaders = [];
  const missingRunningFooters = [];
  const spacingOverlaps = [];
  const numericColumnMisalignments = [];
  const topLinePresence = new Map();

  for (const page of pages) {
    const meaningful = meaningfulPageText(page);
    const wordCount = meaningful ? meaningful.split(/\s+/).filter(Boolean).length : 0;
    if (!meaningful) blankPages.push(page.pageNumber);
    else if (meaningful.length < 80 || wordCount < 10) nearlyBlankPages.push(page.pageNumber);

    const width = Number(page?.width) || 612;
    const height = Number(page?.height) || 792;
    for (const item of (Array.isArray(page?.items) ? page.items : []).filter((candidate) => !isTestWatermarkText(candidate?.text))) {
      if (item.x < -2 || item.y < -2 || item.x + item.width > width + 2 || item.y + item.height > height + 2) {
        overflow.push({ page: page.pageNumber, text: item.text, x: item.x, y: item.y, width: item.width, height: item.height });
      }
    }

    const lines = (Array.isArray(page?.lines) ? page.lines : []).filter((line) => !isTestWatermarkText(line?.text));
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
      if (isHeadingLine(line) && line.y > height * 0.08 && line.y < height * 0.16 && below.length === 0) {
        orphanedHeadings.push({ page: page.pageNumber, heading: line.text, y: line.y });
      }
      if (tableHeadingLine(line) && line.y > height * 0.08 && line.y < height * 0.22 && below.length < 2) {
        separatedTableHeadings.push({ page: page.pageNumber, heading: line.text, y: line.y, following_lines: below.length });
      }
      const numericTokens = String(line?.text || "").match(/(?:[$€£]?\(?\d[\d,.]*\)?%?)/g) || [];
      const pageNumberLine = isPageNumberLine(line, page, Number(analysis?.pageCount) || pages.length);
      const bodyRegion = Number(line?.y) > height * 0.08 && Number(line?.y) < height * 0.92;
      if (bodyRegion && !pageNumberLine && numericTokens.length >= 2 && Number(line?.fontSize) > 0 && Number(line.fontSize) < 6) {
        unreadableTableRows.push({ page: page.pageNumber, text: line.text, font_size: line.fontSize });
      }
    }

    if (Number(page?.pageNumber) > 1 && meaningful) {
      const runningHeaders = lines.filter((line) => Number(line?.y) >= height * 0.95 && normalizeText(line?.text).length >= 4);
      const runningFooters = lines.filter((line) =>
        Number(line?.y) <= height * 0.08 &&
        normalizeText(line?.text).length >= 4 &&
        hasRunningFooterContent(line, page, Number(analysis?.pageCount) || pages.length)
      );
      if (page?.hasRunningHeader !== true && runningHeaders.length === 0) missingRunningHeaders.push(page.pageNumber);
      if (page?.hasRunningFooter !== true && runningFooters.length === 0) missingRunningFooters.push(page.pageNumber);
    }

    const bodyLines = lines
      .filter((line) => Number(line?.y) > height * 0.1 && Number(line?.y) < height * 0.92)
      .sort((left, right) => right.y - left.y);
    for (let index = 0; index < bodyLines.length - 1; index += 1) {
      const current = bodyLines[index];
      const next = bodyLines[index + 1];
      const verticalDistance = Number(current.y) - Number(next.y);
      const requiredDistance = Math.max(Number(current.fontSize) || 0, Number(next.fontSize) || 0) * 0.25;
      const horizontalOverlap = Math.min(Number(current.maxX) || 0, Number(next.maxX) || 0) - Math.max(Number(current.x) || 0, Number(next.x) || 0);
      if (requiredDistance > 0 && horizontalOverlap > 2 && verticalDistance < requiredDistance) {
        spacingOverlaps.push({
          page: page.pageNumber,
          upper_line: current.text,
          lower_line: next.text,
          vertical_distance: verticalDistance,
          required_distance: requiredDistance,
        });
      }
    }

    const approvedRows = (manifest.tables || []).flatMap((table) => (table.rows || []).slice(1).map((row) => ({
      tableId: table.id,
      label: row[0],
    }))).filter((row) => row.label);
    const numericRows = bodyLines.map((line) => {
      const lineCandidates = orderedLineTextCandidates(line);
      const approvedRow = approvedRows.find((row) => lineCandidates.some((candidate) => directComparisonMatch(row.label, candidate)));
      if (!approvedRow || !Array.isArray(line?.items) || line.items.length < 2) return null;
      const numericItems = [...(Array.isArray(line?.items) ? line.items : [])]
        .filter((item) => /(?:[$€£]?\(?-?\d[\d,.]*\)?%?|\d+(?:\.\d+)?x)/i.test(String(item?.text || "")))
        .sort((left, right) => Number(left.x) - Number(right.x));
      const clusters = [];
      for (const item of numericItems) {
        const previous = clusters.at(-1);
        const gap = previous ? Number(item.x) - Number(previous.maxX) : Number.POSITIVE_INFINITY;
        if (previous && gap <= 4) {
          previous.maxX = Math.max(previous.maxX, Number(item.x) + Number(item.width));
        } else {
          clusters.push({ maxX: Number(item.x) + Number(item.width) });
        }
      }
      return { line, tableId: approvedRow.tableId, cells: clusters.map((cluster) => cluster.maxX) };
    }).filter((row) => row?.cells?.length > 0);
    const numericGroups = [];
    for (const row of numericRows) {
      const group = numericGroups.at(-1);
      if (!group || group.at(-1).tableId !== row.tableId || Number(group.at(-1).line.y) - Number(row.line.y) > 32) numericGroups.push([row]);
      else group.push(row);
    }
    for (const group of numericGroups.filter((candidate) => candidate.length >= 3)) {
      const ordinalCount = Math.max(...group.map((row) => row.cells.length));
      for (let ordinal = 0; ordinal < ordinalCount; ordinal += 1) {
        const rightEdges = group.map((row) => row.cells[ordinal]).filter(Number.isFinite);
        if (rightEdges.length < 3 || Math.max(...rightEdges) - Math.min(...rightEdges) <= 8) continue;
        numericColumnMisalignments.push({
          page: page.pageNumber,
          column_ordinal: ordinal + 1,
          right_edges: rightEdges,
          spread: Math.max(...rightEdges) - Math.min(...rightEdges),
        });
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
  if (missingRunningHeaders.length) issues.push(buildIssue("PDF_RUNNING_HEADER_MISSING", "One or more content pages are missing institutional running navigation.", { pages: missingRunningHeaders }, "pdf.headers"));
  if (missingRunningFooters.length) issues.push(buildIssue("PDF_RUNNING_FOOTER_MISSING", "One or more content pages are missing the institutional running footer.", { pages: missingRunningFooters }, "pdf.footers"));
  if (spacingOverlaps.length) issues.push(buildIssue("PDF_SPACING_OVERLAP", "Rendered lines overlap or violate the approved minimum readable spacing.", { occurrences: spacingOverlaps.slice(0, 25) }, "pdf.spacing"));
  if (numericColumnMisalignments.length) issues.push(buildIssue("PDF_NUMERIC_COLUMN_MISALIGNMENT", "One or more numeric table columns are not consistently aligned.", { occurrences: numericColumnMisalignments.slice(0, 25) }, "pdf.alignment"));
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

function inspectInstitutionalCoverage(analysis = {}, manifest = {}) {
  const issues = [];
  const pdfNumberKeys = new Set(extractDisplayedNumbers(analysis?.text || "").map(numberKey));
  const tableCoverage = (Array.isArray(manifest?.tables) ? manifest.tables : []).map((table) => {
    const cellCoverage = table.cells.map((cell) => ({ cell, ...certificationMatch(analysis, cell) }));
    const missingCells = cellCoverage.filter((cell) => !cell.certified).map((cell) => cell.cell);
    return {
      id: table.id,
      title: table.title,
      columnCount: table.columnCount,
      certified: missingCells.length === 0,
      certifiedCellCount: table.cells.length - missingCells.length,
      totalCellCount: table.cells.length,
      missingCells,
      resolvedExtractionFragments: cellCoverage.filter((cell) => cell.certified && cell.method === "ordered_glyph_reconstruction").length,
    };
  });
  const chartCoverage = (Array.isArray(manifest?.charts) ? manifest.charts : []).map((chart) => {
    const requiredVisibleValues = unique([chart.title, ...chart.labels, ...chart.displayedNumbers]).filter(Boolean);
    const visibleCoverage = requiredVisibleValues.map((value) => ({ value, ...certificationMatch(analysis, value) }));
    const missingVisibleValues = visibleCoverage.filter((value) => !value.certified).map((value) => value.value);
    return {
      id: chart.id,
      receipt: chart.receipt,
      title: chart.title,
      sourcePaths: chart.sourcePaths,
      exactValues: chart.values,
      certified: missingVisibleValues.length === 0 && chart.receipt === chart.id && chart.sourcePaths.length > 0,
      missingVisibleValues,
      receiptValid: chart.receipt === chart.id && chart.sourcePaths.length > 0,
      resolvedExtractionFragments: visibleCoverage.filter((value) => value.certified && value.method === "ordered_glyph_reconstruction").length,
    };
  });
  const numberCoverage = (Array.isArray(manifest?.displayedNumbers) ? manifest.displayedNumbers : []).map((value) => {
    const directCertified = pdfNumberKeys.has(numberKey(value));
    const fallback = directCertified ? null : numberCertificationMatch(analysis, value);
    return {
      value,
      key: numberKey(value),
      certified: directCertified || fallback?.certified === true,
      certificationMethod: directCertified ? "direct_number_token" : fallback?.method || "not_found",
      page: fallback?.page || null,
    };
  });

  const failedTables = tableCoverage.filter((table) => !table.certified);
  if (failedTables.length) {
    issues.push(buildIssue(
      "PDF_APPROVED_TABLE_NOT_CERTIFIED",
      "One or more approved tables did not survive the final PDF with every cell and column intact.",
      { tables: failedTables.slice(0, 25) },
      "pdf.certification.tables"
    ));
  }
  const failedCharts = chartCoverage.filter((chart) => !chart.certified);
  if (failedCharts.length) {
    issues.push(buildIssue(
      "PDF_APPROVED_CHART_NOT_CERTIFIED",
      "One or more approved source-backed charts did not survive the final PDF with its receipt, labels, and exact displayed values intact.",
      { charts: failedCharts.slice(0, 25) },
      "pdf.certification.charts"
    ));
  }
  const failedNumbers = numberCoverage.filter((number) => !number.certified);
  if (failedNumbers.length) {
    issues.push(buildIssue(
      "PDF_APPROVED_NUMBER_NOT_CERTIFIED",
      "One or more approved displayed numbers did not survive the final PDF.",
      { numbers: failedNumbers.slice(0, 100) },
      "pdf.certification.numbers"
    ));
  }
  return { issues, tableCoverage, chartCoverage, numberCoverage };
}

function inspectInstitutionalLanguage(analysis = {}) {
  const text = pageTextWithoutExcludedArtifacts({
    text: analysis?.text || "",
    lines: (Array.isArray(analysis?.pages) ? analysis.pages : []).flatMap((page) => page?.lines || []),
  });
  const issues = [];
  const internalTerms = unique((text.match(/\b(?:customer_document_failure|internal_system_failure|deterministic_contract_qa|sourceauthority|publishallowed|delivery_gate|repair_plan|data-iq-[a-z-]+)\b/gi) || []));
  if (internalTerms.length) {
    issues.push(buildIssue(
      "PDF_INTERNAL_IMPLEMENTATION_LANGUAGE",
      "The final PDF exposes internal implementation or authority terminology to the customer surface.",
      { matches: internalTerms },
      "pdf.language"
    ));
  }
  const buySellTerms = unique((text.match(/\b(?:buy|sell)\b/gi) || []));
  if (buySellTerms.length) {
    issues.push(buildIssue(
      "PDF_BUY_SELL_LANGUAGE",
      "The final PDF contains prohibited BUY or SELL language.",
      { matches: buySellTerms },
      "pdf.language"
    ));
  }
  return issues;
}

function issuePageNumbers(issue = {}) {
  const evidence = issue?.evidence && typeof issue.evidence === "object" ? issue.evidence : {};
  return unique([
    ...(Array.isArray(evidence.pages) ? evidence.pages : []),
    ...(Array.isArray(evidence.missing_pages) ? evidence.missing_pages : []),
    ...(Array.isArray(evidence.occurrences) ? evidence.occurrences.flatMap((occurrence) => [
      occurrence?.page,
      occurrence?.pageNumber,
      ...(Array.isArray(occurrence?.missing_pages) ? occurrence.missing_pages : []),
    ]) : []),
  ].map(Number).filter((value) => Number.isInteger(value) && value > 0));
}

function dimensionsForIssue(issue = {}) {
  const code = String(issue?.code || "");
  const dimensions = [];
  if (/BLANK|DENSITY/.test(code)) dimensions.push("content_density");
  if (/OVERFLOW|BYTES_INVALID/.test(code)) dimensions.push("geometry");
  if (/HEADING/.test(code)) dimensions.push("heading_hierarchy", "page_breaks");
  if (/TABLE/.test(code)) dimensions.push("tables");
  if (/CHART/.test(code)) dimensions.push("charts");
  if (/NUMBER|FINANCIAL_FACT/.test(code)) dimensions.push("numbers");
  if (/PAGE_NUMBERS|RUNNING_HEADER|RUNNING_FOOTER/.test(code)) dimensions.push("running_navigation");
  if (/SPACING/.test(code)) dimensions.push("spacing");
  if (/ALIGNMENT/.test(code)) dimensions.push("alignment");
  if (/LANGUAGE|PUNCTUATION/.test(code)) dimensions.push("customer_language");
  if (/APPROVED|CONTENT_DISAGREES|RECONCILIATION|FINANCIAL_INTELLIGENCE/.test(code)) dimensions.push("approved_surface_parity");
  return unique(dimensions.length ? dimensions : ["approved_surface_parity"]);
}

function pageGeometry(page = {}) {
  const width = Number(page?.width) || 612;
  const height = Number(page?.height) || 792;
  const items = (Array.isArray(page?.items) ? page.items : []).filter((item) => !isTestWatermarkText(item?.text));
  const minX = items.length ? Math.min(...items.map((item) => Number(item.x) || 0)) : null;
  const minY = items.length ? Math.min(...items.map((item) => Number(item.y) || 0)) : null;
  const maxX = items.length ? Math.max(...items.map((item) => (Number(item.x) || 0) + (Number(item.width) || 0))) : null;
  const maxY = items.length ? Math.max(...items.map((item) => (Number(item.y) || 0) + (Number(item.height) || 0))) : null;
  return {
    pageWidth: width,
    pageHeight: height,
    contentBounds: { minX, minY, maxX, maxY },
    edgeClearance: {
      left: minX,
      right: maxX == null ? null : width - maxX,
      bottom: minY,
      top: maxY == null ? null : height - maxY,
    },
    itemCount: items.length,
  };
}

function pageSpacingEvidence(page = {}) {
  const height = Number(page?.height) || 792;
  const lines = (Array.isArray(page?.lines) ? page.lines : [])
    .filter((line) => !isTestWatermarkText(line?.text) && Number(line?.y) > height * 0.1 && Number(line?.y) < height * 0.92)
    .sort((left, right) => right.y - left.y);
  const gaps = [];
  for (let index = 0; index < lines.length - 1; index += 1) gaps.push(Number(lines[index].y) - Number(lines[index + 1].y));
  return {
    inspectedLineCount: lines.length,
    minimumBaselineGap: gaps.length ? Math.min(...gaps) : null,
    maximumBaselineGap: gaps.length ? Math.max(...gaps) : null,
  };
}

function pageAlignmentEvidence(page = {}) {
  const numericRightEdges = (Array.isArray(page?.lines) ? page.lines : []).flatMap((line) =>
    (Array.isArray(line?.items) ? line.items : [])
      .filter((item) => /(?:[$€£]?\(?-?\d[\d,.]*\)?%?|\d+(?:\.\d+)?x)/i.test(String(item?.text || "")))
      .map((item) => Number((Number(item.x) + Number(item.width)).toFixed(3)))
  );
  return { inspectedNumericCellCount: numericRightEdges.length, numericRightEdges };
}

function buildPageCertificationReceipts({ analysis = {}, manifest = {}, issues = [], coverage = {}, artifactMode = "" } = {}) {
  const pages = Array.isArray(analysis?.pages) ? analysis.pages : [];
  const pageCount = Number(analysis?.pageCount) || pages.length;
  let activeChapter = null;
  return pages.map((page) => {
    const pageText = normalizeComparisonText(pageTextWithoutExcludedArtifacts(page));
    const chapterOnPage = (manifest.chapters || []).find((chapter) => chapter.title && pageText.includes(normalizeComparisonText(chapter.title)));
    if (chapterOnPage) activeChapter = chapterOnPage.id;
    const mappedIssues = issues.filter((issue) => issuePageNumbers(issue).includes(Number(page.pageNumber)));
    const headings = (Array.isArray(page?.lines) ? page.lines : [])
      .filter((line) => !isTestWatermarkText(line?.text) && isHeadingLine(line) && !isPageNumberLine(line, page, pageCount))
      .map((line) => line.text);
    const tables = (coverage.tableCoverage || []).filter((table) => {
      const approved = (manifest.tables || []).find((candidate) => candidate.id === table.id);
      return approved?.cells?.some((cell) => normalizeComparisonText(cell).length >= 2 && pageText.includes(normalizeComparisonText(cell)));
    }).map((table) => ({
      id: table.id,
      title: table.title,
      columnCount: table.columnCount,
      certifiedCellCount: table.certifiedCellCount,
      totalCellCount: table.totalCellCount,
      status: table.certified ? "pass" : "internal_delivery_failure",
    }));
    const charts = (coverage.chartCoverage || []).filter((chart) => {
      const approved = (manifest.charts || []).find((candidate) => candidate.id === chart.id);
      if (approved?.title) return pageText.includes(normalizeComparisonText(approved.title));
      return [...(approved?.labels || []), ...(approved?.displayedNumbers || [])]
        .filter(Boolean)
        .some((value) => pageText.includes(normalizeComparisonText(value)));
    }).map((chart) => ({
      id: chart.id,
      receipt: chart.receipt,
      sourcePaths: chart.sourcePaths,
      exactValues: chart.exactValues,
      status: chart.certified ? "pass" : "internal_delivery_failure",
    }));
    const displayedNumbers = extractDisplayedNumbers(pageTextWithoutExcludedArtifacts(page)).map((value) => ({
      value,
      approved: (coverage.numberCoverage || []).some((number) => number.key === numberKey(value)),
    }));
    const dimensions = Object.fromEntries(INSTITUTIONAL_PDF_CONSTITUTION.certification.certificationDimensions.map((dimension) => [
      dimension,
      {
        status: mappedIssues.some((issue) => dimensionsForIssue(issue).includes(dimension)) ? "fail" : "pass",
        issueCodes: mappedIssues.filter((issue) => dimensionsForIssue(issue).includes(dimension)).map((issue) => issue.code),
      },
    ]));
    const status = mappedIssues.length === 0
      ? "pass"
      : mappedIssues.some((issue) => /(?:NUMBER|FINANCIAL_FACT|APPROVED|RECONCILIATION|REQUIRED|CONSTITUTION)/.test(issue.code))
        ? "internal_delivery_failure"
        : "repair_required";
    return {
      pageNumber: Number(page.pageNumber),
      sectionIds: unique([Number(page.pageNumber) === 1 ? "cover" : activeChapter || "approved-surface"]),
      headings,
      tables,
      charts,
      displayedNumbers,
      geometry: pageGeometry(page),
      defects: mappedIssues.map((issue) => ({ code: issue.code, dimensions: dimensionsForIssue(issue), path: issue.path })),
      status,
      dimensions,
      pageBreak: {
        precedingPageNumber: Number(page.pageNumber) > 1 ? Number(page.pageNumber) - 1 : null,
        headingOrphanDetected: mappedIssues.some((issue) => issue.code === "PDF_ORPHANED_HEADINGS"),
        tableHeadingSeparated: mappedIssues.some((issue) => issue.code === "PDF_TABLE_SEPARATED_FROM_HEADING"),
      },
      spacing: pageSpacingEvidence(page),
      alignment: pageAlignmentEvidence(page),
      runningNavigation: {
        coverExempt: Number(page.pageNumber) === 1,
        pageNumberPresent: Number(page.pageNumber) === 1 || hasPageNumber(page, pageCount),
        runningHeaderPresent: Number(page.pageNumber) === 1 || !mappedIssues.some((issue) => issue.code === "PDF_RUNNING_HEADER_MISSING"),
        runningFooterPresent: Number(page.pageNumber) === 1 || !mappedIssues.some((issue) => issue.code === "PDF_RUNNING_FOOTER_MISSING"),
      },
      excludedArtifacts: String(artifactMode || "").includes("test") ? ["docraptor_test_watermark"] : [],
    };
  });
}

function repairDefectsFromIssues(issues = []) {
  return issues.map((issue) => {
    const pages = issuePageNumbers(issue);
    const required = issue.blocks_customer_delivery === true &&
      /(?:NUMBER|FINANCIAL_FACT|APPROVED|RECONCILIATION|REQUIRED|CONSTITUTION|SOURCE)/.test(issue.code);
    const category = /NUMBER|FINANCIAL_FACT/.test(issue.code)
      ? "number"
      : /RECONCILIATION|SOURCE|CONSTITUTION/.test(issue.code)
        ? "source"
        : required
          ? "required_content"
          : "composition";
    return {
      code: issue.code,
      category,
      surfaceId: issue.path,
      pageNumber: pages[0] || null,
      required,
      optional: false,
    };
  });
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
  institutionalPdfConstitution = INSTITUTIONAL_PDF_CONSTITUTION,
} = {}) {
  const issues = [];
  if (!isCanonicalInstitutionalPdfConstitution(institutionalPdfConstitution)) {
    issues.push(buildIssue(
      "PDF_CONSTITUTION_TAMPERING_REJECTED",
      "The Final PDF Publication Quality Boss rejected a non-canonical institutional PDF constitution.",
      { received_source: institutionalPdfConstitution?.source || null },
      "pdf.constitution"
    ));
  }
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
  let coverage = { tableCoverage: [], chartCoverage: [], numberCoverage: [] };
  if (!internalStub) {
    if (deterministicContractQaSeal && deterministicContractQaSeal.ok !== true) {
      issues.push(buildIssue(
        "APPROVED_CUSTOMER_SURFACE_NOT_SEALED",
        "The PDF Publication Quality Boss received a customer surface that was not approved by deterministic Contract QA.",
        { contract_qa_status: deterministicContractQaSeal?.status || null },
        "pdf.approvedSurface.contractQa"
      ));
    }
    issues.push(...inspectLayout(analysis, manifest));
    issues.push(...inspectApprovedSurface(analysis, manifest));
    coverage = inspectInstitutionalCoverage(analysis, manifest);
    issues.push(...coverage.issues);
    issues.push(...inspectInstitutionalLanguage(analysis));

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

  const pageReceipts = internalStub ? [] : buildPageCertificationReceipts({
    analysis,
    manifest,
    issues,
    coverage,
    artifactMode: normalizedArtifactMode,
  });
  const reportDefects = issues.filter((issue) => issuePageNumbers(issue).length === 0).map((issue) => ({
    code: issue.code,
    dimensions: dimensionsForIssue(issue),
    path: issue.path,
  }));
  const repairPlan = buildInstitutionalPdfRepairPlan({ defects: repairDefectsFromIssues(issues) });
  const ok = issues.length === 0;
  const blockingIssues = issues.filter((issue) => issue.blocks_customer_delivery === true);
  const qualityIncidents = issues.filter((issue) => issue.blocks_customer_delivery !== true);
  const customerDeliveryAllowed = blockingIssues.length === 0;
  const status = ok
    ? (internalStub ? "internal_test_artifact_only" : "certified")
    : customerDeliveryAllowed
      ? "publishable_with_quality_incident"
      : "internal_pdf_publication_quality_failure";
  const resolvedRepairPlan = Object.freeze({
    ...repairPlan,
    publicationDisposition: ok
      ? repairPlan.publicationDisposition
      : customerDeliveryAllowed
        ? "publish_with_quality_incident"
        : "hold_for_internal_repair",
    customerDeliveryBlocked: !customerDeliveryAllowed,
  });

  return {
    version: FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION,
    authority: "final_pdf_publication_quality_boss",
    scope: PAGE_CERTIFICATION_SCOPE,
    ok,
    status,
    strict_institutional_certified: ok,
    customer_delivery_allowed: customerDeliveryAllowed,
    publication_disposition: customerDeliveryAllowed
      ? (ok ? "publish" : "publish_with_quality_incident")
      : "block",
    blocking_issue_codes: blockingIssues.map((issue) => issue.code),
    quality_incident_codes: qualityIncidents.map((issue) => issue.code),
    failure_class: blockingIssues.length > 0 ? "internal_system_failure" : null,
    customer_document_failure: false,
    external_publication_allowed: customerDeliveryAllowed && normalizedArtifactMode === "production_pdf",
    artifact_mode: normalizedArtifactMode || null,
    publication_target: normalizedTarget || null,
    constitution: {
      source: INSTITUTIONAL_PDF_CONSTITUTION.source,
      version: INSTITUTIONAL_PDF_CONSTITUTION.constitutionVersion,
      valid: isCanonicalInstitutionalPdfConstitution(institutionalPdfConstitution),
      page_count_hardcoded: false,
      test_watermark_excluded_from_scoring: INSTITUTIONAL_PDF_CONSTITUTION.publication.testWatermarkExcludedFromInstitutionalScoring,
    },
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
      chapter_count: manifest.chapters.length,
      table_count: manifest.tables.length,
      chart_count: manifest.charts.length,
      displayed_number_count: manifest.displayedNumbers.length,
    },
    institutional_certification: {
      required: !internalStub,
      page_by_page: !internalStub,
      dimensions: [...INSTITUTIONAL_PDF_CONSTITUTION.certification.certificationDimensions],
      page_receipt_count: pageReceipts.length,
      page_receipts: pageReceipts,
      every_page_receipt_present: internalStub || pageReceipts.length === (Number(analysis?.pageCount) || 0),
      every_table_certified: coverage.tableCoverage.every((table) => table.certified),
      every_chart_certified: coverage.chartCoverage.every((chart) => chart.certified),
      every_number_certified: coverage.numberCoverage.every((number) => number.certified),
      resolved_extraction_fragment_count:
        coverage.tableCoverage.reduce((sum, table) => sum + Number(table.resolvedExtractionFragments || 0), 0) +
        coverage.chartCoverage.reduce((sum, chart) => sum + Number(chart.resolvedExtractionFragments || 0), 0) +
        coverage.numberCoverage.filter((number) => number.certificationMethod === "ordered_glyph_reconstruction").length,
      table_coverage: coverage.tableCoverage,
      chart_coverage: coverage.chartCoverage,
      number_coverage: coverage.numberCoverage,
      report_defects: reportDefects,
    },
    repair_plan: resolvedRepairPlan,
    issues,
  };
}

export async function assertFinalPdfPublicationQuality(args = {}) {
  const result = await inspectFinalPdfPublicationQuality(args);
  if (!isFinalPdfCustomerDeliveryAllowed(result)) {
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

export function isFinalPdfCustomerDeliveryAllowed(result = {}) {
  const blockingCodes = Array.isArray(result?.blocking_issue_codes) ? result.blocking_issue_codes : [];
  const hasBlockingIssue = blockingCodes.length > 0 ||
    (Array.isArray(result?.issues) && result.issues.some((issue) => issue?.blocks_customer_delivery === true));
  if (hasBlockingIssue) return false;
  if (result?.customer_delivery_allowed === true) {
    return ["certified", "internal_test_artifact_only", "publishable_with_quality_incident"].includes(String(result?.status || ""));
  }
  return result?.ok === true && ["certified", "internal_test_artifact_only"].includes(String(result?.status || ""));
}

export const FINAL_PDF_PUBLICATION_QUALITY_CONTRACT = Object.freeze({
  version: FINAL_PDF_PUBLICATION_QUALITY_BOSS_VERSION,
  scope: PAGE_CERTIFICATION_SCOPE,
  constitutionSource: INSTITUTIONAL_PDF_CONSTITUTION.source,
  constitutionVersion: INSTITUTIONAL_PDF_CONSTITUTION.constitutionVersion,
  pageByPageCertificationRequired: true,
  pageCountHardcoded: false,
  orderedExactGlyphFragmentTolerance: true,
  inferredValueReconstructionAllowed: false,
  alignmentRequiresApprovedTableRowScope: true,
  maximumAutomaticRecompositionAttempts: 1,
  strictCertificationRecordedSeparatelyFromDelivery: true,
  nonblockingQualityIncidentMayPublish: true,
});
