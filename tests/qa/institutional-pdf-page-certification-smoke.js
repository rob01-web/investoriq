import assert from "node:assert/strict";
import { inspectFinalPdfPublicationQuality } from "../../api/_lib/final-pdf-publication-quality-boss.js";
import { INSTITUTIONAL_PDF_CONSTITUTION } from "../../api/_lib/institutional-pdf-constitution.js";

const approvedHtml = `<!doctype html><html><body>
  <h1>Acquisition Memorandum</h1>
  <section class="institutional-chapter" data-iq-chapter="operating-performance">
    <div class="chapter-heading">Operating Performance</div>
    <div class="evidence-chart" data-iq-chart="income-composition" data-iq-chart-receipt="income-composition" data-iq-source-paths="sourceTruth.t12.revenue|sourceTruth.t12.expenses">
      <p class="subsection-title">Income Composition</p>
      <div data-iq-value="1500000" data-iq-source-path="sourceTruth.t12.revenue"><div class="evidence-chart-label">Total Revenue</div><div>$1,500,000</div></div>
      <div data-iq-value="650000" data-iq-source-path="sourceTruth.t12.expenses"><div class="evidence-chart-label">Total Operating Expenses</div><div>$650,000</div></div>
    </div>
    <h2>Operating Summary</h2>
    <table data-iq-table="operating-summary">
      <thead><tr><th>Metric</th><th>Current</th></tr></thead>
      <tbody>
        <tr><td>Total Revenue</td><td>$1,500,000</td></tr>
        <tr><td>Expenses</td><td>$650,000</td></tr>
        <tr><td>Net Operating Income</td><td>$850,000</td></tr>
      </tbody>
    </table>
  </section>
</body></html>`;

function item(text, x, y, width, fontSize = 9) {
  return { text, x, y, width, height: fontSize, fontSize };
}

function line(text, y, { x = 42, width = null, fontSize = 9, items = null } = {}) {
  const resolvedWidth = width ?? Math.max(20, String(text).length * fontSize * 0.45);
  const resolvedItems = items || [item(text, x, y, resolvedWidth, fontSize)];
  return {
    text,
    x: Math.min(...resolvedItems.map((entry) => entry.x)),
    y,
    maxX: Math.max(...resolvedItems.map((entry) => entry.x + entry.width)),
    fontSize,
    items: resolvedItems,
  };
}

function tableLine(label, value, y, rightEdge = 540) {
  const labelItem = item(label, 60, y, 210, 9);
  const valueWidth = Math.max(45, value.length * 5);
  const valueItem = item(value, rightEdge - valueWidth, y, valueWidth, 9);
  return line(`${label} ${value}`, y, { items: [labelItem, valueItem] });
}

function page(pageNumber, bodyLines, { pageCount = 2 } = {}) {
  const navigation = pageNumber === 1 ? [] : [
    line("Stonebridge Lofts | Operating Performance", 772, { fontSize: 7 }),
    line("Confidential", 38, { fontSize: 7 }),
    line(`Page ${pageNumber} of ${pageCount}`, 24, { x: 500, fontSize: 7 }),
  ];
  const lines = [...bodyLines, ...navigation];
  return {
    pageNumber,
    width: 612,
    height: 792,
    lines,
    items: lines.flatMap((entry) => entry.items),
    text: lines.map((entry) => entry.text).join("\n"),
  };
}

function validAnalysis() {
  const pages = [
    page(1, [
      line("Acquisition Memorandum", 700, { fontSize: 20 }),
      line("Institutional source-bound operating and financial review", 660, { fontSize: 10 }),
      line("Prepared for investment committee consideration", 638, { fontSize: 10 }),
    ]),
    page(2, [
      line("Operating Performance", 730, { fontSize: 16 }),
      line("Income Composition", 694, { fontSize: 12 }),
      line("Total Revenue $1,500,000", 666),
      line("Total Operating Expenses $650,000", 644),
      line("Operating Summary", 596, { fontSize: 12 }),
      line("Metric Current", 566, { fontSize: 9 }),
      tableLine("Total Revenue", "$1,500,000", 540),
      tableLine("Expenses", "$650,000", 518),
      tableLine("Net Operating Income", "$850,000", 496),
    ]),
  ];
  return {
    validPdf: true,
    byteLength: 98000,
    pageCount: pages.length,
    pages,
    text: pages.map((entry) => entry.text).join("\n\n"),
  };
}

function refresh(analysis) {
  for (const entry of analysis.pages) {
    entry.items = entry.lines.flatMap((candidate) => candidate.items);
    entry.text = entry.lines.map((candidate) => candidate.text).join("\n");
  }
  analysis.text = analysis.pages.map((entry) => entry.text).join("\n\n");
  return analysis;
}

async function inspect(analysis, overrides = {}) {
  return inspectFinalPdfPublicationQuality({
    pdfBytes: Buffer.from("%PDF-gate10e"),
    approvedHtml,
    deterministicContractQaSeal: { ok: true, status: "pass" },
    requiredTextAnchors: ["Acquisition Memorandum", "Operating Performance"],
    artifactMode: "docraptor_test_pdf",
    publicationTarget: "internal_test",
    pdfAnalysis: analysis,
    ...overrides,
  });
}

const certified = await inspect(validAnalysis());
assert.equal(certified.ok, true);
assert.equal(certified.scope, "institutional_page_by_page_certification");
assert.equal(certified.constitution.source, INSTITUTIONAL_PDF_CONSTITUTION.source);
assert.equal(certified.constitution.valid, true);
assert.equal(certified.constitution.page_count_hardcoded, false);
assert.equal(certified.institutional_certification.page_receipt_count, 2);
assert.equal(certified.institutional_certification.every_page_receipt_present, true);
assert.equal(certified.institutional_certification.every_table_certified, true);
assert.equal(certified.institutional_certification.every_chart_certified, true);
assert.equal(certified.institutional_certification.every_number_certified, true);
assert.equal(certified.institutional_certification.table_coverage[0].columnCount, 2);
assert.deepEqual(certified.institutional_certification.chart_coverage[0].exactValues, ["1500000", "650000"]);
assert.deepEqual(certified.institutional_certification.chart_coverage[0].sourcePaths, [
  "sourceTruth.t12.revenue",
  "sourceTruth.t12.expenses",
]);
for (const receipt of certified.institutional_certification.page_receipts) {
  assert.deepEqual(Object.keys(receipt.dimensions), INSTITUTIONAL_PDF_CONSTITUTION.certification.certificationDimensions);
  assert.equal(receipt.status, "pass");
  for (const field of INSTITUTIONAL_PDF_CONSTITUTION.certification.pageReceiptRequiredFields) {
    assert.ok(Object.hasOwn(receipt, field), `${field} on page ${receipt.pageNumber}`);
  }
}
const operatingReceipt = certified.institutional_certification.page_receipts[1];
assert.deepEqual(operatingReceipt.sectionIds, ["operating-performance"]);
assert.equal(operatingReceipt.tables[0].columnCount, 2);
assert.equal(operatingReceipt.charts[0].receipt, "income-composition");
assert.ok(operatingReceipt.displayedNumbers.some((number) => number.value === "$850,000" && number.approved));

async function assertIssue(code, mutate, overrides = {}) {
  const analysis = validAnalysis();
  mutate?.(analysis);
  refresh(analysis);
  const result = await inspect(analysis, overrides);
  assert.equal(result.ok, false, code);
  assert.equal(result.customer_document_failure, false, code);
  assert.ok(result.issues.some((issue) => issue.code === code), code);
  assert.notEqual(result.repair_plan.publicationDisposition, "certified", code);
  return result;
}

await assertIssue("PDF_APPROVED_TABLE_NOT_CERTIFIED", (analysis) => {
  analysis.pages[1].lines = analysis.pages[1].lines.filter((candidate) => !candidate.text.includes("Net Operating Income"));
});
await assertIssue("PDF_APPROVED_CHART_NOT_CERTIFIED", (analysis) => {
  analysis.pages[1].lines = analysis.pages[1].lines.filter((candidate) => !candidate.text.includes("Total Operating Expenses"));
});
const missingNumber = await assertIssue("PDF_APPROVED_NUMBER_NOT_CERTIFIED", (analysis) => {
  analysis.pages[1].lines = analysis.pages[1].lines.filter((candidate) => !candidate.text.includes("$850,000"));
});
assert.equal(missingNumber.repair_plan.publicationDisposition, "hold_for_internal_repair");

const misaligned = await assertIssue("PDF_NUMERIC_COLUMN_MISALIGNMENT", (analysis) => {
  const row = analysis.pages[1].lines.find((candidate) => candidate.text === "Expenses $650,000");
  row.items[1].x -= 28;
  row.x = Math.min(...row.items.map((entry) => entry.x));
  row.maxX = Math.max(...row.items.map((entry) => entry.x + entry.width));
});
assert.equal(misaligned.institutional_certification.page_receipts[1].dimensions.alignment.status, "fail");

const spacing = await assertIssue("PDF_SPACING_OVERLAP", (analysis) => {
  const row = analysis.pages[1].lines.find((candidate) => candidate.text === "Expenses $650,000");
  row.y = 539;
  for (const entry of row.items) entry.y = 539;
});
assert.equal(spacing.institutional_certification.page_receipts[1].dimensions.spacing.status, "fail");

const watermarked = validAnalysis();
for (const entry of watermarked.pages) {
  entry.lines.push(line("DocRaptor Test Document", 400, { x: -100, width: 850, fontSize: 48 }));
}
refresh(watermarked);
const watermarkedResult = await inspect(watermarked);
assert.equal(watermarkedResult.ok, true);
assert.ok(watermarkedResult.institutional_certification.page_receipts.every((receipt) =>
  receipt.excludedArtifacts.includes("docraptor_test_watermark")
));

await assertIssue("PDF_CONSTITUTION_TAMPERING_REJECTED", null, {
  institutionalPdfConstitution: { ...INSTITUTIONAL_PDF_CONSTITUTION, certification: {} },
});

console.log("Gate 10E institutional page certification smoke PASS");
