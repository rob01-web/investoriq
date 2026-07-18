import assert from "node:assert/strict";
import { ensureReportDownloadArtifact } from "../../api/_lib/report-delivery-output.js";
import { isFinalPdfCustomerDeliveryAllowed } from "../../api/_lib/final-pdf-publication-quality-boss.js";

const approvedHtml = "<!doctype html><html><head></head><body><h1>Acquisition Memo</h1><p>Approved source-backed report.</p></body></html>";
const retest32FailureFamily = {
  ok: false,
  status: "publishable_with_quality_incident",
  strict_institutional_certified: false,
  customer_delivery_allowed: true,
  publication_disposition: "publish_with_quality_incident",
  failure_class: null,
  customer_document_failure: false,
  blocking_issue_codes: [],
  quality_incident_codes: [
    "PDF_NUMERIC_COLUMN_MISALIGNMENT",
    "PDF_APPROVED_TABLE_NOT_CERTIFIED",
    "PDF_APPROVED_NUMBER_NOT_CERTIFIED",
  ],
  issues: [
    "PDF_NUMERIC_COLUMN_MISALIGNMENT",
    "PDF_APPROVED_TABLE_NOT_CERTIFIED",
    "PDF_APPROVED_NUMBER_NOT_CERTIFIED",
  ].map((code) => ({
    code,
    blocks_customer_delivery: false,
    classification: "internal_quality_incident",
    customer_document_failure: false,
  })),
};

function storageHarness() {
  const events = [];
  let stored = null;
  return {
    events,
    client: {
      storage: {
        from: () => ({
          async download() {
            events.push("download");
            return stored ? { data: stored, error: null } : { data: null, error: { message: "missing" } };
          },
          async upload(_path, bytes) {
            events.push("upload");
            stored = bytes;
            return { error: null };
          },
        }),
      },
      from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    },
  };
}

assert.equal(isFinalPdfCustomerDeliveryAllowed(retest32FailureFamily), true);
assert.equal(isFinalPdfCustomerDeliveryAllowed({
  ...retest32FailureFamily,
  blocking_issue_codes: ["PDF_BYTES_INVALID"],
}), false, "An allow flag cannot override an explicit blocking issue");

const publishableStorage = storageHarness();
let renderCount = 0;
let bossCount = 0;
const publishable = await ensureReportDownloadArtifact({
  supabaseAdmin: publishableStorage.client,
  reportId: "generic-quality-incident-report",
  storagePath: "generic/generic-quality-incident-report.pdf",
  finalHtml: approvedHtml,
  reportType: "underwriting",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  renderPdfBuffer: async () => {
    renderCount += 1;
    return Buffer.from(renderCount === 1 ? "%PDF-initial" : "%PDF-recomposed");
  },
  runFinalPdfPublicationQualityBoss: async () => {
    bossCount += 1;
    return structuredClone(retest32FailureFamily);
  },
});

assert.equal(renderCount, 2, "One bounded recomposition must remain available");
assert.equal(bossCount, 2, "The recomposed PDF must be recertified");
assert.equal(publishable.publicationQualityBoss.status, "publishable_with_quality_incident");
assert.equal(publishable.institutionalPdfRecovery.recovered, false);
assert.equal(publishable.institutionalPdfRecovery.customerDeliveryPreserved, true);
assert.equal(publishableStorage.events.filter((event) => event === "upload").length, 1);

const unsafeStorage = storageHarness();
await assert.rejects(
  ensureReportDownloadArtifact({
    supabaseAdmin: unsafeStorage.client,
    reportId: "generic-unsafe-report",
    storagePath: "generic/generic-unsafe-report.pdf",
    finalHtml: approvedHtml,
    reportType: "underwriting",
    deliveryGateStatus: "deliverable",
    holdDelivery: false,
    renderPdfBuffer: async () => Buffer.from("not-a-valid-pdf"),
    runFinalPdfPublicationQualityBoss: async () => ({
      ok: false,
      status: "internal_pdf_publication_quality_failure",
      customer_delivery_allowed: false,
      publication_disposition: "block",
      failure_class: "internal_system_failure",
      customer_document_failure: false,
      issues: [{ code: "PDF_BYTES_INVALID", blocks_customer_delivery: true }],
    }),
  }),
  (error) => error?.code === "PDF_ARTIFACT_FAILED"
);
assert.equal(unsafeStorage.events.includes("upload"), false);

console.log("RETEST 32 PDF publication authority regression smoke PASS");
