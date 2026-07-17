import assert from "node:assert/strict";
import fs from "node:fs";
import {
  inspectFinalPdfPublicationQuality,
} from "../../api/_lib/final-pdf-publication-quality-boss.js";
import { ensureReportDownloadArtifact } from "../../api/_lib/report-delivery-output.js";

const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const acquisitionDocumentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
const reportTemplateSource = fs.readFileSync("api/report-template-runtime.html", "utf8");
const docRaptorCallIndex = generatorSource.indexOf('pdfResponse = await axios.post(');
const directPdfBossIndex = generatorSource.indexOf('finalPdfPublicationQualityBossResult = await inspectFinalPdfPublicationQuality({');
const directStorageUploadIndex = generatorSource.indexOf('.upload(validatedStoragePath, pdfResponse.data, {');
assert.ok(docRaptorCallIndex >= 0 && directPdfBossIndex > docRaptorCallIndex);
assert.ok(directStorageUploadIndex > directPdfBossIndex);
for (const source of [acquisitionDocumentSource, reportTemplateSource]) {
  assert.match(source, /@bottom-right\s*\{[\s\S]*?counter\(page\)[\s\S]*?counter\(pages\)/i);
  assert.match(source, /tr\s*\{[\s\S]*?page-break-inside:\s*avoid/i);
}

const disclosure = "Rent Roll annualized in-place rent is $806,400 below T12 Gross Potential Rent; the variance is disclosed and no unsupported adjustment is made.";
const approvedHtml = `<!DOCTYPE html><html><head><title>InvestorIQ Acquisition Memo</title></head><body>
  <h1>Acquisition Memo</h1>
  <h2>Source Reconciliation</h2>
  <table>
    <tr><td>T12 Gross Potential Rent</td><td>$1,612,800</td></tr>
    <tr><td>Rent Roll Annual In-Place Rent</td><td>$806,400</td></tr>
    <tr><td>Rent Roll less T12</td><td>($806,400)</td></tr>
    <tr><td>Variance</td><td>-50.00%</td></tr>
    <tr><td>Break-Even Occupancy</td><td>34.4%</td></tr>
    <tr><td>Net Operating Income</td><td>$945,000</td></tr>
  </table>
  <p>${disclosure}</p>
</body></html>`;

const deterministicContractQaSeal = {
  ok: true,
  status: "pass",
  source_reconciliation: { required: true, publishability: "disclose_only_publishable" },
};
const sourceReconciliation = {
  state: {
    status: "source_reconciliation_required",
    source_reconciliation_disclosure: disclosure,
  },
  sourceBacked: true,
};

function makeLine(text, y, { x = 40, fontSize = 9, width = null } = {}) {
  const resolvedWidth = width ?? Math.min(520, Math.max(10, String(text).length * fontSize * 0.45));
  return {
    text,
    x,
    y,
    maxX: x + resolvedWidth,
    fontSize,
    items: [{ text, x, y, width: resolvedWidth, height: fontSize, fontSize }],
  };
}

function makePage(pageNumber, bodyLines, { includePageNumber = pageNumber > 1, extraLines = [], extraItems = [] } = {}) {
  const lines = [
    ...(pageNumber > 1 ? [makeLine("InvestorIQ", 770, { fontSize: 7 })] : []),
    ...bodyLines.map((text, index) => makeLine(text, 740 - index * 22, { fontSize: index === 0 ? 15 : 9 })),
    ...extraLines,
    ...(pageNumber > 1 ? [makeLine("Confidential", 38, { x: 40, fontSize: 7 })] : []),
    ...(includePageNumber ? [makeLine(`Page ${pageNumber} of 3`, 24, { x: 500, fontSize: 7 })] : []),
  ];
  return {
    pageNumber,
    width: 612,
    height: 792,
    text: lines.map((line) => line.text).join("\n"),
    lines,
    items: [...lines.flatMap((line) => line.items), ...extraItems],
  };
}

const coverLines = [
  "InvestorIQ Acquisition Memo",
  "Institutional acquisition underwriting and source-bound financial review",
  "Prepared for investment committee review with confidential operating evidence",
];
const reconciliationLines = [
  "Source Reconciliation",
  "T12 Gross Potential Rent $1,612,800",
  "Rent Roll Annual In-Place Rent $806,400",
  "Rent Roll less T12 ($806,400)",
  "Variance -50.00%",
  "Break-Even Occupancy 34.4%",
  "Net Operating Income $945,000",
  disclosure,
];
const conclusionLines = [
  "Risk and Diligence Summary",
  "The approved customer surface remains intact through final PDF rendering.",
  "All displayed figures are preserved from the sealed report contract.",
];

function validAnalysis() {
  const pages = [
    makePage(1, coverLines, { includePageNumber: false }),
    makePage(2, reconciliationLines),
    makePage(3, conclusionLines),
  ];
  return {
    validPdf: true,
    byteLength: 120000,
    pageCount: pages.length,
    pages,
    text: pages.map((page) => page.text).join("\n\n"),
  };
}

function clone(value) {
  return structuredClone(value);
}

function refreshText(analysis) {
  for (const page of analysis.pages) page.text = page.lines.map((line) => line.text).join("\n");
  analysis.text = analysis.pages.map((page) => page.text).join("\n\n");
  return analysis;
}

async function inspect(pdfAnalysis, overrides = {}) {
  return inspectFinalPdfPublicationQuality({
    pdfBytes: Buffer.from("%PDF-test"),
    approvedHtml,
    deterministicContractQaSeal,
    sourceReconciliation,
    requiredTextAnchors: ["Acquisition Memo", "Source Reconciliation"],
    artifactMode: "docraptor_test_pdf",
    publicationTarget: "internal_test",
    pdfAnalysis,
    ...overrides,
  });
}

const valid = await inspect(validAnalysis());
assert.equal(valid.ok, true);
assert.equal(valid.status, "certified");
assert.equal(valid.customer_document_failure, false);
assert.equal(valid.external_publication_allowed, false);
assert.equal(valid.scope, "institutional_page_by_page_certification");
assert.equal(valid.constitution.valid, true);
assert.equal(valid.constitution.page_count_hardcoded, false);
assert.equal(valid.institutional_certification.page_receipt_count, 3);
assert.equal(valid.institutional_certification.every_page_receipt_present, true);
assert.equal(valid.institutional_certification.every_table_certified, true);
assert.equal(valid.institutional_certification.every_number_certified, true);
for (const receipt of valid.institutional_certification.page_receipts) {
  for (const field of ["pageNumber", "sectionIds", "headings", "tables", "charts", "displayedNumbers", "geometry", "defects", "status"]) {
    assert.ok(Object.hasOwn(receipt, field), `${field} page receipt`);
  }
  assert.equal(receipt.status, "pass");
  assert.equal(Object.keys(receipt.dimensions).length, 12);
}

async function assertIssue(code, mutate, overrides = {}) {
  const analysis = validAnalysis();
  mutate?.(analysis);
  refreshText(analysis);
  const result = await inspect(analysis, overrides);
  assert.equal(result.ok, false, code);
  assert.equal(result.failure_class, "internal_system_failure", code);
  assert.equal(result.customer_document_failure, false, code);
  assert.ok(result.issues.some((issue) => issue.code === code), code);
}

await assertIssue("PDF_BLANK_PAGES", (analysis) => {
  analysis.pages[2] = makePage(3, ["InvestorIQ", "Confidential"], { includePageNumber: true });
});
await assertIssue("PDF_NEARLY_BLANK_PAGES", (analysis) => {
  analysis.pages[2] = makePage(3, ["Risk note only"], { includePageNumber: true });
});
await assertIssue("PDF_REQUIRED_FINANCIAL_FACTS_MISSING", (analysis) => {
  analysis.pages[1].lines = analysis.pages[1].lines.filter((line) => !line.text.includes("$945,000"));
});
await assertIssue("PDF_RECONCILIATION_DISCLOSURE_MISSING", (analysis) => {
  analysis.pages[1].lines = analysis.pages[1].lines.filter((line) => line.text !== disclosure);
});
await assertIssue("PDF_DUPLICATED_RUNNING_HEADER", (analysis) => {
  analysis.pages[1].lines.unshift(makeLine("InvestorIQ Acquisition Memo", 770), makeLine("InvestorIQ Acquisition Memo", 760));
});
await assertIssue("PDF_BROKEN_RUNNING_HEADER", (analysis) => {
  analysis.pages.push(
    makePage(4, conclusionLines, { includePageNumber: true }),
    makePage(5, conclusionLines, { includePageNumber: true }),
  );
  analysis.pageCount = 5;
  for (const page of analysis.pages.filter((candidate) => [2, 3, 4].includes(candidate.pageNumber))) {
    page.lines.unshift(makeLine("InvestorIQ Confidential Memorandum", 770));
  }
});
await assertIssue("PDF_PAGE_OVERFLOW", (analysis) => {
  analysis.pages[1].items.push({ text: "$945,000", x: 600, y: 400, width: 80, height: 9, fontSize: 9 });
});
await assertIssue("PDF_ORPHANED_HEADINGS", (analysis) => {
  analysis.pages[2].lines.push(makeLine("Valuation Analysis", 65, { fontSize: 15 }));
});
await assertIssue("PDF_TABLE_SEPARATED_FROM_HEADING", (analysis) => {
  analysis.pages[2].lines.push(makeLine("Debt Analysis", 130, { fontSize: 15 }));
});
await assertIssue("PDF_UNREADABLE_TABLE", (analysis) => {
  analysis.pages[1].lines.push(makeLine("$1,612,800 $806,400 -50.00%", 210, { fontSize: 5 }));
});
const smallFooterAnalysis = validAnalysis();
for (const page of smallFooterAnalysis.pages.filter((candidate) => candidate.pageNumber > 1)) {
  const footer = page.lines.find((line) => /^Page\s+\d+\s+of\s+\d+$/i.test(line.text));
  footer.fontSize = 5.25;
  for (const item of footer.items) {
    item.fontSize = 5.25;
    item.height = 5.25;
  }
}
refreshText(smallFooterAnalysis);
const smallFooterResult = await inspect(smallFooterAnalysis);
assert.equal(smallFooterResult.ok, true);
assert.equal(
  smallFooterResult.issues.some((issue) => issue.code === "PDF_UNREADABLE_TABLE"),
  false
);
await assertIssue("PDF_PAGE_NUMBERS_MISSING", (analysis) => {
  analysis.pages[2].lines = analysis.pages[2].lines.filter((line) => !/^Page 3/.test(line.text));
});
await assertIssue("PDF_RUNNING_HEADER_MISSING", (analysis) => {
  analysis.pages[2].lines = analysis.pages[2].lines.filter((line) => line.text !== "InvestorIQ");
});
await assertIssue("PDF_RUNNING_FOOTER_MISSING", (analysis) => {
  analysis.pages[2].lines = analysis.pages[2].lines.filter((line) => line.text !== "Confidential");
});
await assertIssue("PDF_PROHIBITED_PUNCTUATION", (analysis) => {
  analysis.pages[2].lines.push(makeLine("Approved surface — prohibited punctuation", 200));
});
await assertIssue("PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE", null, {
  requiredTextAnchors: ["Acquisition Memo", "Source Reconciliation", "Missing approved anchor"],
});
await assertIssue("TEST_MODE_PDF_EXTERNAL_PUBLICATION_BLOCKED", null, {
  publicationTarget: "external_customer",
});
await assertIssue("PDF_CONSTITUTION_TAMPERING_REJECTED", null, {
  institutionalPdfConstitution: { source: "caller_override", pageCountHardcoded: true },
});

const watermarkedAnalysis = validAnalysis();
for (const page of watermarkedAnalysis.pages) {
  page.lines.push(makeLine("DocRaptor Test Document", 410, { x: -30, fontSize: 42, width: 720 }));
}
refreshText(watermarkedAnalysis);
const watermarked = await inspect(watermarkedAnalysis);
assert.equal(watermarked.ok, true);
assert.equal(watermarked.issues.length, 0);
assert.ok(watermarked.institutional_certification.page_receipts.every((receipt) =>
  receipt.excludedArtifacts.includes("docraptor_test_watermark")
));

const internalStub = await inspectFinalPdfPublicationQuality({
  pdfBytes: Buffer.from("%PDF-test"),
  approvedHtml,
  artifactMode: "stub_pdf",
  publicationTarget: "internal_test",
  pdfAnalysis: validAnalysis(),
});
assert.equal(internalStub.ok, true);
assert.equal(internalStub.status, "internal_test_artifact_only");
assert.equal(internalStub.external_publication_allowed, false);

function makeSupabaseStorage({ existingData = null } = {}) {
  const events = [];
  let storedData = existingData;
  const bucket = {
    async download() {
      events.push("download");
      return storedData ? { data: storedData, error: null } : { data: null, error: { message: "missing" } };
    },
    async upload(_path, pdfBytes) {
      events.push("upload");
      storedData = pdfBytes;
      return { error: null };
    },
  };
  return {
    events,
    client: {
      storage: { from: () => bucket },
      from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    },
  };
}

const existingStorage = makeSupabaseStorage({ existingData: Buffer.from("%PDF-existing") });
let existingBossCalls = 0;
const existingResult = await ensureReportDownloadArtifact({
  supabaseAdmin: existingStorage.client,
  reportId: "report-1",
  storagePath: "user/report-1.pdf",
  finalHtml: approvedHtml,
  reportType: "full_underwriting",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  runFinalPdfPublicationQualityBoss: async () => {
    existingBossCalls += 1;
    return { ok: true, status: "certified" };
  },
});
assert.equal(existingBossCalls, 1);
assert.equal(existingResult.publicationQualityBoss.status, "certified");
assert.deepEqual(existingStorage.events, ["download"]);

const newStorage = makeSupabaseStorage();
const order = [];
await ensureReportDownloadArtifact({
  supabaseAdmin: newStorage.client,
  reportId: "report-2",
  storagePath: "user/report-2.pdf",
  finalHtml: approvedHtml,
  reportType: "screening",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  renderPdfBuffer: async () => {
    order.push("render");
    return Buffer.from("%PDF-new");
  },
  runFinalPdfPublicationQualityBoss: async () => {
    order.push("boss");
    return { ok: true, status: "certified" };
  },
});
order.push(...newStorage.events.filter((event) => event === "upload"));
assert.deepEqual(order, ["render", "boss", "upload"]);

const rejectedStorage = makeSupabaseStorage();
await assert.rejects(
  ensureReportDownloadArtifact({
    supabaseAdmin: rejectedStorage.client,
    reportId: "report-3",
    storagePath: "user/report-3.pdf",
    finalHtml: approvedHtml,
    reportType: "screening",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    renderPdfBuffer: async () => Buffer.from("%PDF-rejected"),
    runFinalPdfPublicationQualityBoss: async () => {
      const error = new Error("Final PDF failed Publication Quality Boss certification");
      error.code = "PDF_ARTIFACT_FAILED";
      error.context = { customer_document_failure: false };
      throw error;
    },
  }),
  (error) => error?.code === "PDF_ARTIFACT_FAILED" && error?.context?.customer_document_failure === false,
);
assert.equal(rejectedStorage.events.includes("upload"), false);

console.log("P0-C final PDF Publication Quality Boss smoke PASS");
