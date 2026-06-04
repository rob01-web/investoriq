import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { formatReportUploadGateErrorMessage, resolveCoreUploadDocType, resolveReportUploadGate } from "../../src/lib/reportUploadGate.js";

const screeningGate = resolveReportUploadGate({
  reportType: "screening",
  uploadedFiles: [
    { docType: "rent_roll" },
    { docType: "t12" },
  ],
});
assert.equal(screeningGate.canGenerate, true);
assert.equal(screeningGate.blockedMessage, "");
assert.equal(screeningGate.isMissingCoreDocs, false);
assert.equal(screeningGate.isMissingSupportDocs, false);

const screeningMissingT12 = resolveReportUploadGate({
  reportType: "screening",
  uploadedFiles: [{ docType: "rent_roll" }],
});
assert.equal(screeningMissingT12.canGenerate, false);
assert.equal(screeningMissingT12.blockedReasonCode, "MISSING_REQUIRED_CORE_DOCUMENTS");
assert.match(screeningMissingT12.blockedMessage, /Upload a T12 to generate/i);

const underwritingCoreOnly = resolveReportUploadGate({
  reportType: "underwriting",
  uploadedFiles: [
    { docType: "rent_roll" },
    { docType: "t12" },
  ],
});
assert.equal(underwritingCoreOnly.canGenerate, false);
assert.equal(underwritingCoreOnly.blockedReasonCode, "MISSING_REQUIRED_SUPPORTING_DOCUMENT");
assert.match(underwritingCoreOnly.blockedMessage, /supporting document/i);

const underwritingWithSupport = resolveReportUploadGate({
  reportType: "underwriting",
  uploadedFiles: [
    { docType: "rent_roll" },
    { docType: "t12" },
    { docType: "supporting_documents" },
  ],
});
assert.equal(underwritingWithSupport.canGenerate, true);
assert.equal(underwritingWithSupport.blockedMessage, "");

const underwritingWithCoreMislabeledAsSupport = resolveReportUploadGate({
  reportType: "underwriting",
  uploadedFiles: [
    { docType: "rent_roll" },
    { docType: "t12" },
    { docType: "supporting_documents_ui" },
  ],
});
assert.equal(underwritingWithCoreMislabeledAsSupport.canGenerate, true);
assert.equal(underwritingWithCoreMislabeledAsSupport.hasSupportDocs, true);
assert.equal(underwritingWithCoreMislabeledAsSupport.hasCoreDocs, true);

const swappedCoreUploads = resolveReportUploadGate({
  reportType: "screening",
  uploadedFiles: [
    { docType: "rent_roll", original_name: "Acme_T12_Operating_Statement.pdf" },
    { docType: "t12", original_name: "Acme_Rent_Roll.xlsx" },
  ],
});
assert.equal(swappedCoreUploads.canGenerate, true);
assert.equal(swappedCoreUploads.blockedMessage, "");
assert.equal(resolveCoreUploadDocType({ docType: "rent_roll", original_name: "Acme_T12_Operating_Statement.pdf" }), "t12");
assert.equal(resolveCoreUploadDocType({ docType: "t12", original_name: "Acme_Rent_Roll.xlsx" }), "rent_roll");

const ambiguousCoreUploads = resolveReportUploadGate({
  reportType: "screening",
  uploadedFiles: [
    { docType: "supporting_documents", original_name: "Notes.pdf" },
    { docType: "supporting_documents", original_name: "Context.pdf" },
  ],
});
assert.equal(ambiguousCoreUploads.canGenerate, false);
assert.equal(ambiguousCoreUploads.blockedReasonCode, "MISSING_REQUIRED_CORE_DOCUMENTS");

assert.equal(
  formatReportUploadGateErrorMessage("MISSING_REQUIRED_CORE_DOCUMENTS", "screening"),
  "Upload a Rent Roll and T12 to generate."
);
assert.equal(
  formatReportUploadGateErrorMessage("MISSING_REQUIRED_CORE_DOCUMENTS", "underwriting"),
  "Upload a Rent Roll, T12, and at least one supporting document to generate."
);
assert.equal(
  formatReportUploadGateErrorMessage("MISSING_REQUIRED_SUPPORTING_DOCUMENT", "underwriting"),
  "Underwriting also requires at least one supporting document."
);

const consumeSql = await fs.readFile("supabase/migrations/20260210100140_consume_purchase_and_create_job.sql", "utf8");
assert.match(consumeSql, /MISSING_REQUIRED_CORE_DOCUMENTS/);
assert.match(consumeSql, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/);
assert.match(consumeSql, /v_has_supporting_docs/);
assert.match(consumeSql, /p_report_type = 'underwriting' and not v_has_supporting_docs/);
assert.match(consumeSql, /v_payload_doc_type in \('supporting', 'supporting_documents', 'supporting_documents_ui'\)/);
assert.match(consumeSql, /'queued'/);
assert.equal(/'needs_documents'/.test(consumeSql), false);

const queueSql = await fs.readFile("supabase/migrations/20260214_0930_queue_job_for_processing.sql", "utf8");
assert.match(queueSql, /MISSING_REQUIRED_CORE_DOCUMENTS/);
assert.match(queueSql, /MISSING_REQUIRED_SUPPORTING_DOCUMENT/);
assert.match(queueSql, /analysis_job_files/);
assert.match(queueSql, /v_has_supporting_docs/);
assert.match(queueSql, /v_report_type = 'underwriting' and not coalesce\(v_has_supporting_docs, false\)/);
assert.match(queueSql, /v_prev_status not in \('queued', 'needs_documents'\)/);
assert.match(queueSql, /status in \('queued', 'needs_documents'\)/);

console.log("report upload gate smoke PASS");
