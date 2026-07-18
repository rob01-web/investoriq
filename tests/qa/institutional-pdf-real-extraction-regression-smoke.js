import assert from "node:assert/strict";
import { inspectFinalPdfPublicationQuality } from "../../api/_lib/final-pdf-publication-quality-boss.js";

const approvedHtml = `<!doctype html><html><body>
  <h1>Acquisition Memorandum</h1>
  <section data-iq-chapter="acquisition-context">
    <div class="chapter-heading">Acquisition Context</div>
    <h2>Acquisition Assumptions</h2>
    <table data-iq-table="acquisition-assumptions">
      <thead><tr><th>Metric</th><th>Documented Value</th></tr></thead>
      <tbody>
        <tr><td>Purchase Price</td><td>$12,345,000</td></tr>
        <tr><td>Documented Market Rent</td><td>$2,100</td></tr>
        <tr><td>Net Operating Income</td><td>$864,000</td></tr>
      </tbody>
    </table>
  </section>
</body></html>`;

function item(text, x, y, width, fontSize = 9) {
  return { text, x, y, width, height: fontSize, fontSize };
}

function line(text, y, items, fontSize = Math.max(...items.map((entry) => entry.fontSize))) {
  return {
    text,
    x: Math.min(...items.map((entry) => entry.x)),
    y,
    maxX: Math.max(...items.map((entry) => entry.x + entry.width)),
    fontSize,
    items,
  };
}

function textLine(text, y, x = 42, fontSize = 9) {
  return line(text, y, [item(text, x, y, Math.max(20, text.length * fontSize * 0.44), fontSize)], fontSize);
}

function tableLine(label, valueItems, y) {
  const labelItem = item(label, 60, y, 220, 9);
  return line([label, ...valueItems.map((entry) => entry.text)].join(" "), y, [labelItem, ...valueItems]);
}

const coverLines = [
  textLine("Acquisition Memorandum", 700, 42, 20),
  textLine("Institutional source-bound operating and acquisition review", 662),
  textLine("Prepared for investment committee consideration", 640),
];

const pageTwoLines = [
  textLine("Generic Property 2026 | Acquisition Context", 772, 42, 5.25),
  textLine("Acquisition Context", 730, 42, 16),
  textLine("Acquisition Assumptions", 694, 42, 12),
  tableLine("Metric", [item("Documented Value", 420, 664, 110, 9)], 664),
  tableLine("Purchase Price", [
    item("$12,345,", 455, 638, 48, 9),
    item("000", 503, 638, 27, 9),
  ], 638),
  textLine("Documented", 612, 60),
  tableLine("Market Rent", [item("$2,100", 485, 590, 45, 9)], 590),
  tableLine("Net Operating Income", [item("$864,000", 470, 564, 60, 9)], 564),
  textLine("All displayed values remain limited to the approved customer surface.", 520),
  line("Institutional Grade Property 2026", 490, [item("Institutional Grade Property 2026", 60, 490, 180, 7.5)], 7.5),
  line("31", 487, [item("31", 500, 487, 12, 7.5)], 7.5),
  line("Occupancy 93.8%", 458, [item("Occupancy", 60, 458, 80, 9), item("93.8%", 420, 458, 40, 9)]),
  line("Expense Ratio 37.0%", 436, [item("Expense Ratio", 60, 436, 100, 9), item("37.0%", 500, 436, 40, 9)]),
  line("NOI Margin 63.0%", 414, [item("NOI Margin", 60, 414, 80, 9), item("63.0%", 320, 414, 40, 9)]),
  textLine("InvestorIQ | Confidential Page 2 of 2", 24, 42, 5.25),
];

const pages = [
  {
    pageNumber: 1,
    width: 612,
    height: 792,
    lines: coverLines,
    items: coverLines.flatMap((entry) => entry.items),
    text: coverLines.map((entry) => entry.text).join("\n"),
  },
  {
    pageNumber: 2,
    width: 612,
    height: 792,
    lines: pageTwoLines,
    items: pageTwoLines.flatMap((entry) => entry.items),
    text: pageTwoLines.map((entry) => entry.text).join("\n"),
  },
];

async function inspectPages(candidatePages) {
  return inspectFinalPdfPublicationQuality({
    pdfBytes: Buffer.from("%PDF-real-extraction-regression"),
    approvedHtml,
    deterministicContractQaSeal: { ok: true, status: "pass" },
    requiredTextAnchors: ["Acquisition Memorandum", "Acquisition Context"],
    artifactMode: "docraptor_test_pdf",
    publicationTarget: "internal_test",
    pdfAnalysis: {
      validPdf: true,
      byteLength: 96000,
      pageCount: candidatePages.length,
      pages: candidatePages,
      text: candidatePages.map((entry) => entry.text).join("\n\n"),
    },
  });
}

const result = await inspectPages(pages);

assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
assert.equal(result.institutional_certification.every_table_certified, true);
assert.equal(result.institutional_certification.every_number_certified, true);
assert.equal(result.institutional_certification.page_receipts[1].runningNavigation.pageNumberPresent, true);
assert.ok(result.institutional_certification.resolved_extraction_fragment_count > 0);
assert.equal(result.issues.some((issue) => issue.code === "PDF_UNREADABLE_TABLE"), false);
assert.equal(result.issues.some((issue) => issue.code === "PDF_PAGE_NUMBERS_MISSING"), false);
assert.equal(result.issues.some((issue) => issue.code === "PDF_SPACING_OVERLAP"), false);
assert.equal(result.issues.some((issue) => issue.code === "PDF_NUMERIC_COLUMN_MISALIGNMENT"), false);

const missingDigitPages = structuredClone(pages);
const purchasePriceLine = missingDigitPages[1].lines.find((entry) => entry.text.includes("Purchase Price"));
purchasePriceLine.items.at(-1).text = "00";
purchasePriceLine.text = purchasePriceLine.text.replace(/000$/, "00");
missingDigitPages[1].items = missingDigitPages[1].lines.flatMap((entry) => entry.items);
missingDigitPages[1].text = missingDigitPages[1].lines.map((entry) => entry.text).join("\n");
const missingDigitResult = await inspectPages(missingDigitPages);
assert.equal(missingDigitResult.ok, false);
assert.equal(missingDigitResult.issues.some((issue) => issue.code === "PDF_APPROVED_NUMBER_NOT_CERTIFIED"), true);
assert.equal(missingDigitResult.customer_document_failure, false);

console.log("Gate 10R real PDF extraction regression smoke PASS");
