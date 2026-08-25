import assert from "node:assert/strict";
import fs from "node:fs";

import { INSTITUTIONAL_PDF_CONSTITUTION } from "../../api/_lib/institutional-pdf-constitution.js";

const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const docRaptorSource = fs.readFileSync("api/_lib/docraptor-request.js", "utf8");

assert.match(documentSource, /data-iq-visual-system="institutional-v1"/i);
assert.match(documentSource, /data-iq-design-system="elite-10a-global-v1"/i);
assert.match(documentSource, /data-iq-composition="content-driven-v1"/i);

assert.match(documentSource, /@page\s*\{[\s\S]*?size\s*:\s*Letter\s*;/i);
assert.match(documentSource, /margin\s*:\s*0\.58in\s+0\.55in\s+0\.66in\s+0\.55in\s*;/i);
assert.match(documentSource, /Page " counter\(page\) " of " counter\(pages\)/i);
assert.match(documentSource, /@top-left\s*\{[\s\S]*?string\(report-property\)/i);
assert.match(documentSource, /@top-right\s*\{[\s\S]*?string\(report-chapter\)/i);

for (const token of [
  "--cover-canvas",
  "--forest",
  "--charcoal",
  "--space-1",
  "--space-6",
  "--type-body",
  "--type-table",
  "--rule-strong",
]) {
  assert.match(documentSource, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.match(documentSource, /\.section-header-title\s*\{[^}]*font-family\s*:\s*var\(--font-body\)/i);
assert.match(documentSource, /\.section\s*>\s*\.card\s*\{[^}]*(?:border\s*:\s*0|border-left\s*:\s*0)/i);
assert.match(documentSource, /\.detail-table\s+thead\s*\{\s*display\s*:\s*table-header-group/i);
assert.match(documentSource, /\.detail-table\s+tr\s*\{[^}]*break-inside\s*:\s*avoid/i);
assert.match(documentSource, /\.numeric[^}]*font-variant-numeric\s*:\s*tabular-nums/i);
assert.match(documentSource, /\.iq-callout\s*\{[^}]*break-inside\s*:\s*avoid-page/i);
assert.match(documentSource, /\.iq-evidence-badge\s*\{[^}]*font-family\s*:\s*var\(--font-mono\)/i);
assert.match(documentSource, /@media\s+print\s*\{[\s\S]*?\.report-container\s*\{[^}]*height\s*:\s*auto[^}]*max-height\s*:\s*none[^}]*overflow\s*:\s*visible/i);
assert.match(documentSource, /print-color-adjust\s*:\s*exact/i);

const reportContainerRule = documentSource.match(/\.report-container\s*\{([^}]*)\}/i)?.[1] || "";
assert.doesNotMatch(reportContainerRule, /(?:^|;)\s*(?:height|max-height)\s*:/i);
assert.doesNotMatch(reportContainerRule, /overflow\s*:\s*hidden/i);
assert.match(documentSource, /\.cover-wrap\s*\{[^}]*height\s*:\s*10\.5in[^}]*overflow\s*:\s*hidden/i);

assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.composition.universalPageCountRequired, null);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.composition.pageCountHardcoded, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.composition.contentDrivenPaginationRequired, true);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.pagination.overflowAllowed, false);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.pagination.pageNumberRequiredOnContentPages, true);

assert.doesNotMatch(documentSource, /(?:target|expected|universal)[_-]?page[_-]?count\s*[:=]\s*\d+/i);
assert.doesNotMatch(docRaptorSource, /(?:max|maximum|target|expected)[_-]?pages?\s*[:=]/i);

const chapterOrder = [
  "committee-overview",
  "operating-performance",
  "transaction-context",
  "debt-capital-structure",
  "valuation-reconciliation",
  "source-appendix",
].map((chapter) => documentSource.indexOf(`data-iq-chapter="${chapter}"`));
assert.ok(chapterOrder.every((index) => index >= 0));
assert.deepEqual([...chapterOrder].sort((left, right) => left - right), chapterOrder);

console.log("full-underwriting-elite10a-global-design-system-smoke: PASS");
