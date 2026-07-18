import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildInstitutionalPdfRecoveryHtml,
  INSTITUTIONAL_PDF_RECOVERABLE_CODES,
  isInstitutionalPdfRecoveryEligible,
} from "../../api/_lib/institutional-pdf-recovery.js";
import { INSTITUTIONAL_PDF_CONSTITUTION } from "../../api/_lib/institutional-pdf-constitution.js";
import { FINAL_PDF_PUBLICATION_QUALITY_CONTRACT } from "../../api/_lib/final-pdf-publication-quality-boss.js";

const approvedHtml = "<!doctype html><html><head></head><body><h1>Acquisition Memorandum</h1><p>$864,000</p></body></html>";
const recoverableCertification = {
  ok: false,
  customer_document_failure: false,
  issues: [
    { code: "PDF_SPACING_OVERLAP" },
    { code: "PDF_NUMERIC_COLUMN_MISALIGNMENT" },
  ],
};

assert.equal(isInstitutionalPdfRecoveryEligible(recoverableCertification), true);
assert.ok(INSTITUTIONAL_PDF_RECOVERABLE_CODES.includes("PDF_APPROVED_NUMBER_NOT_CERTIFIED"));

for (const code of [
  "PDF_BYTES_INVALID",
  "PDF_CONSTITUTION_TAMPERING_REJECTED",
  "PDF_INTERNAL_IMPLEMENTATION_LANGUAGE",
  "PDF_PROHIBITED_PUNCTUATION",
  "TEST_MODE_PDF_EXTERNAL_PUBLICATION_BLOCKED",
]) {
  assert.equal(isInstitutionalPdfRecoveryEligible({
    ok: false,
    customer_document_failure: false,
    issues: [{ code }],
  }), false, code);
}

const recovery = buildInstitutionalPdfRecoveryHtml({
  approvedHtml,
  certification: recoverableCertification,
});
assert.match(recovery.html, /data-iq-pdf-recovery="conservative-v1"/);
assert.ok(recovery.html.includes(approvedHtml.replace("</head>", "")) === false);
assert.match(recovery.html, /<h1>Acquisition Memorandum<\/h1><p>\$864,000<\/p>/);
assert.equal(recovery.receipt.approvedSurfaceChanged, false);
assert.equal(recovery.receipt.valuesMayChange, false);
assert.equal(recovery.receipt.sourcesMayChange, false);
assert.equal(recovery.receipt.disclosuresMayChange, false);
assert.equal(recovery.receipt.attemptCount, 1);
assert.equal(recovery.receipt.recertifyAgainstOriginalApprovedHtml, true);

assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.constitutionVersion, 3);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.repair.maximumAutomaticRecompositionAttempts, 1);
assert.equal(INSTITUTIONAL_PDF_CONSTITUTION.certification.inferredValueReconstructionAllowed, false);
assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.orderedExactGlyphFragmentTolerance, true);
assert.equal(FINAL_PDF_PUBLICATION_QUALITY_CONTRACT.inferredValueReconstructionAllowed, false);

const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const deliverySource = fs.readFileSync("api/_lib/report-delivery-output.js", "utf8");
for (const source of [generatorSource, deliverySource]) {
  assert.match(source, /buildInstitutionalPdfRecoveryHtml/);
  assert.match(source, /isInstitutionalPdfRecoveryEligible/);
}
assert.match(generatorSource, /approvedHtml:\s*docHtml/);
assert.match(deliverySource, /approvedHtml:\s*finalHtml/);
assert.doesNotMatch(`${generatorSource}\n${deliverySource}`, /Stonebridge|RETEST\s*31|Final Attack Test/i);

console.log("Gate 10R institutional PDF recovery contract smoke PASS");
