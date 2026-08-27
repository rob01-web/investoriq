import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  buildCanonicalReportIdentityReceipt,
  isCanonicalReportIdentityReceipt,
  SCREENING_REPORT_IDENTITY,
  UNDERWRITING_REPORT_IDENTITY,
} from "../../api/_lib/report-identity-authority.js";
import { buildDeterministicReportContractQaSeal } from "../../api/_lib/deterministic-report-contract-qa-seal.js";
import { inspectFinalPdfPublicationQuality } from "../../api/_lib/final-pdf-publication-quality-boss.js";

const underwritingIdentity = buildCanonicalReportIdentityReceipt({
  reportMode: "v1_core",
  reportType: "underwriting",
  reportTier: 2,
});
const screeningIdentity = buildCanonicalReportIdentityReceipt({
  reportMode: "screening_v1",
  reportType: "screening",
  reportTier: 1,
});

assert.equal(isCanonicalReportIdentityReceipt(underwritingIdentity), true);
assert.equal(isCanonicalReportIdentityReceipt(screeningIdentity), true);
assert.deepEqual(underwritingIdentity.requiredPdfTextAnchors, ["Underwriting Report"]);
assert.deepEqual(screeningIdentity.requiredPdfTextAnchors, ["Screening Report"]);
assert.equal(UNDERWRITING_REPORT_IDENTITY.canonicalTitle, "Underwriting Report");
assert.equal(UNDERWRITING_REPORT_IDENTITY.fullTitle, "InvestorIQ Underwriting Report");
assert.equal(SCREENING_REPORT_IDENTITY.canonicalTitle, "Screening Report");
assert.equal(SCREENING_REPORT_IDENTITY.fullTitle, "InvestorIQ Screening Report");
assert.equal(SCREENING_REPORT_IDENTITY.prohibitedVisibleTitles.includes("Preliminary Investment Screening Memorandum"), true);

const approvedHtml = `<!doctype html><html><body>
  <h1>InvestorIQ Underwriting Report</h1>
  <p>Institutional source-bound operating and financial review.</p>
  <p>Prepared for investment committee review.</p>
  <p>Document-backed evidence only.</p>
  <p>Missing optional evidence remains omitted.</p>
  <p>No unsupported value is inferred.</p>
</body></html>`;

const deterministicSeal = buildDeterministicReportContractQaSeal({
  html: approvedHtml,
  reportIdentity: { reportMode: "v1_core", reportType: "underwriting", reportTier: 2 },
});
assert.equal(deterministicSeal.ok, true, JSON.stringify(deterministicSeal.issues));
assert.equal(isCanonicalReportIdentityReceipt(deterministicSeal.report_identity), true);

function line(text, y, fontSize = 9) {
  const width = Math.max(20, text.length * fontSize * 0.45);
  return {
    text,
    x: 40,
    y,
    maxX: 40 + width,
    fontSize,
    items: [{ text, x: 40, y, width, height: fontSize, fontSize }],
  };
}

function analysisWithTitle(title) {
  const lines = [
    line(title, 720, 18),
    line("Institutional source-bound operating and financial review.", 680),
    line("Prepared for investment committee review.", 658),
    line("Document-backed evidence only.", 636),
    line("Missing optional evidence remains omitted.", 614),
    line("No unsupported value is inferred.", 592),
  ];
  const page = {
    pageNumber: 1,
    width: 612,
    height: 792,
    text: lines.map((entry) => entry.text).join("\n"),
    lines,
    items: lines.flatMap((entry) => entry.items),
  };
  return {
    validPdf: true,
    byteLength: 100586,
    pageCount: 1,
    text: page.text,
    pages: [page],
  };
}

const staleCallerAnchor = await inspectFinalPdfPublicationQuality({
  pdfBytes: Buffer.from("%PDF-retest34-canonical-identity"),
  approvedHtml,
  deterministicContractQaSeal: deterministicSeal,
  reportIdentity: underwritingIdentity,
  requiredTextAnchors: ["Acquisition Memo"],
  artifactMode: "docraptor_test_pdf",
  publicationTarget: "internal_test",
  pdfAnalysis: analysisWithTitle("InvestorIQ Underwriting Report"),
});
assert.equal(staleCallerAnchor.customer_delivery_allowed, true);
assert.equal(staleCallerAnchor.status, "publishable_with_quality_incident");
assert.deepEqual(staleCallerAnchor.blocking_issue_codes, []);
assert.ok(staleCallerAnchor.quality_incident_codes.includes("PDF_CALLER_IDENTITY_ANCHOR_REJECTED"));
assert.ok(!staleCallerAnchor.quality_incident_codes.includes("PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE"));
assert.deepEqual(staleCallerAnchor.approved_surface.rejected_caller_identity_anchors, ["Acquisition Memo"]);
assert.deepEqual(staleCallerAnchor.approved_surface.report_identity.requiredPdfTextAnchors, ["Underwriting Report"]);

const actualCanonicalIdentityLoss = await inspectFinalPdfPublicationQuality({
  pdfBytes: Buffer.from("%PDF-retest34-true-identity-loss"),
  approvedHtml,
  deterministicContractQaSeal: deterministicSeal,
  reportIdentity: underwritingIdentity,
  artifactMode: "docraptor_test_pdf",
  publicationTarget: "internal_test",
  pdfAnalysis: analysisWithTitle("InvestorIQ Internal Report"),
});
assert.equal(actualCanonicalIdentityLoss.customer_delivery_allowed, false);
assert.ok(actualCanonicalIdentityLoss.blocking_issue_codes.includes("PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE"));
assert.deepEqual(
  actualCanonicalIdentityLoss.issues.find((issue) => issue.code === "PDF_CONTENT_DISAGREES_WITH_APPROVED_SURFACE")?.evidence?.missing_required_anchors,
  ["Underwriting Report"]
);

function productionFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const resolved = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...productionFiles(resolved));
    else if (/\.(?:js|html)$/.test(entry.name)) files.push(resolved);
  }
  return files;
}

const apiFiles = productionFiles("api");
const literalAnchorOwners = [];
const staleAcquisitionAnchorConsumers = [];
for (const file of apiFiles) {
  const source = fs.readFileSync(file, "utf8");
  if (/requiredPdfTextAnchors\s*:\s*\[\s*["'`]/.test(source)) literalAnchorOwners.push(file.replaceAll("\\", "/"));
  if (/requiredTextAnchors\s*:\s*\[\s*["'`]Acquisition Memo["'`]/.test(source)) {
    staleAcquisitionAnchorConsumers.push(file.replaceAll("\\", "/"));
  }
}
assert.deepEqual(literalAnchorOwners, ["api/_lib/report-identity-authority.js"]);
assert.deepEqual(staleAcquisitionAnchorConsumers, []);

const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const deliverySource = fs.readFileSync("api/_lib/report-delivery-output.js", "utf8");
const documentSource = fs.readFileSync("api/_lib/acquisition-memo-v2-document.js", "utf8");
assert.equal((generatorSource.match(/reportIdentity:\s*finalPdfReportIdentity/g) || []).length, 5);
assert.doesNotMatch(generatorSource, /requiredTextAnchors\s*:\s*\[\s*["'`]Acquisition Memo/);
assert.doesNotMatch(workerSource, /pdf_required_text_anchors|requiredPdfTextAnchors/);
assert.match(deliverySource, /buildCanonicalReportIdentityReceipt/);
assert.match(documentSource, /UNDERWRITING_REPORT_IDENTITY/);

console.log("RETEST 34 canonical report identity authority regression smoke PASS");
