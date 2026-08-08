import assert from "node:assert/strict";
import {
  getCustomerFacingJobStatus,
  resolveDashboardCustomerStatus,
} from "../../src/lib/dashboardCustomerCopy.js";
import {
  resolveReportSurfaceState,
} from "../../src/lib/reportSurfaceState.js";
import {
  selectCurrentPublishedReportRevision,
} from "../../src/lib/reportRevisionAuthority.js";

const publishedCurrent = {
  id: "report-current",
  status: "published",
  storage_path: "user-1/report-current.pdf",
  revision_kind: "original",
  revision_number: 1,
  revision_family_key: "report-current",
  revision_root_report_id: "report-current",
  revision_parent_report_id: null,
  revision_request_key: "original:job-current",
  revision_source_job_id: "job-current",
  is_current_revision: true,
  revision_published_at: "2026-07-30T10:00:00.000Z",
};

const publishedHistorical = {
  id: "report-historical",
  status: "published",
  storage_path: "user-1/report-historical.pdf",
  revision_kind: "corrected",
  revision_number: 2,
  revision_family_key: "report-current",
  revision_root_report_id: "report-current",
  revision_parent_report_id: "report-current",
  revision_request_key: "corrected:report-current:2:report-current:job-corrected",
  revision_source_job_id: "job-corrected",
  is_current_revision: false,
  revision_published_at: "2026-07-30T11:00:00.000Z",
};

const correctedFailed = {
  id: "report-corrected-failed",
  status: "failed",
  revision_kind: "corrected",
  revision_number: 2,
  revision_family_key: "report-current",
  revision_root_report_id: "report-current",
  revision_parent_report_id: "report-current",
  revision_request_key: "corrected:report-current:2:report-current:job-failed",
  revision_source_job_id: "job-failed",
  is_current_revision: false,
  revision_published_at: null,
};

const family = [publishedCurrent, publishedHistorical, correctedFailed];
assert.equal(selectCurrentPublishedReportRevision(family)?.id, publishedCurrent.id);

const currentSurface = resolveReportSurfaceState({
  report: publishedCurrent,
  reports: family,
  job: { status: "published" },
});
assert.equal(currentSurface.stateKey, "published_current_revision");
assert.equal(currentSurface.isCurrentRevision, true);
assert.equal(currentSurface.isHistoricalRevision, false);
assert.equal(currentSurface.isDownloadable, true);
assert.equal(currentSurface.customerDownloadLabel, "Download current");
assert.match(currentSurface.customerMessage, /report complete/i);
assert.match(currentSurface.adminDetail, /current downloadable revision/i);

const historicalSurface = resolveReportSurfaceState({
  report: publishedHistorical,
  reports: family,
  job: { status: "published" },
});
assert.equal(historicalSurface.stateKey, "published_historical_revision");
assert.equal(historicalSurface.isCurrentRevision, false);
assert.equal(historicalSurface.isHistoricalRevision, true);
assert.equal(historicalSurface.isDownloadable, false);
assert.equal(historicalSurface.customerDownloadLabel, "Review historical");
assert.equal(historicalSurface.adminStatusLabel, "Historical published revision");

const correctedFailedSurface = resolveReportSurfaceState({
  report: correctedFailed,
  reports: family,
  job: { status: "failed", error_code: "REPORT_GENERATION_FAILED" },
});
assert.equal(correctedFailedSurface.stateKey, "corrected_replacement_revision_failed");
assert.equal(correctedFailedSurface.customerStatusLabel, "failed");
assert.equal(correctedFailedSurface.isDownloadable, false);
assert.match(correctedFailedSurface.customerMessage, /corrected report revision did not complete/i);
assert.match(correctedFailedSurface.adminDetail, /revision failed/i);

const restoredFailedSurface = resolveReportSurfaceState({
  report: {
    ...publishedCurrent,
    id: "report-failed",
    status: "failed",
    is_current_revision: false,
  },
  reports: [publishedCurrent],
  job: { status: "failed", error_code: "REPORT_GENERATION_FAILED" },
  creditRestored: true,
});
assert.equal(restoredFailedSurface.stateKey, "failed_with_entitlement_restored");
assert.equal(restoredFailedSurface.isDownloadable, false);
assert.match(restoredFailedSurface.customerMessage, /credit has been restored/i);
assert.match(restoredFailedSurface.adminDetail, /restoration evidence/i);

const needsDocsDecision = resolveDashboardCustomerStatus(
  { status: "failed", error_code: "MISSING_REQUIRED_SOURCE_DATA", failure_reason: "missing required source documents" },
  {
    source: "canonical_delivery_decision",
    delivery_gate_status: "user_needs_documents",
    customer_status_label: "failed",
    customer_status_reason_code: "MISSING_REQUIRED_SOURCE_DATA",
    customer_message: "Upload the missing rent roll and T12.",
    customer_delivery_allowed: false,
  }
);
assert.equal(getCustomerFacingJobStatus({ status: "queued" }), "queued");
assert.equal(getCustomerFacingJobStatus({ status: "rendering" }), "rendering");
assert.equal(needsDocsDecision.customer_status_label, "failed");
assert.match(needsDocsDecision.customer_message, /upload the missing rent roll and t12/i);

const needsDocsSurface = resolveReportSurfaceState({
  report: {
    ...publishedCurrent,
    id: "report-needs-docs",
    status: "failed",
    is_current_revision: false,
  },
  job: { status: "failed", error_code: "MISSING_REQUIRED_SOURCE_DATA", failure_reason: "missing required source documents" },
  deliveryDecision: needsDocsDecision,
});
assert.equal(needsDocsSurface.stateKey, "customer_needs_documents");
assert.match(needsDocsSurface.customerMessage, /missing rent roll and t12/i);
assert.match(needsDocsSurface.adminDetail, /customer needs documents/i);

const adminReviewSurface = resolveReportSurfaceState({
  report: {
    ...publishedCurrent,
    id: "report-admin-review",
    status: "publishing",
    is_current_revision: false,
  },
  job: { status: "publishing", error_code: "ADMIN_REVIEW_REQUIRED", failure_reason: "worker-7 contract mismatch" },
  deliveryDecision: resolveDashboardCustomerStatus(
    { status: "publishing", error_code: "ADMIN_REVIEW_REQUIRED", failure_reason: "worker-7 contract mismatch" },
    {
      source: "canonical_delivery_decision",
      delivery_gate_status: "admin_review_required",
      customer_status_label: "failed",
      customer_status_reason_code: "SYSTEM_CONTRACT_FAILURE",
      customer_message: "Internal review required.",
      customer_delivery_allowed: false,
    }
  ),
});
assert.equal(adminReviewSurface.stateKey, "admin_review");
assert.equal(/worker-7|ADMIN_REVIEW_REQUIRED/i.test(adminReviewSurface.customerMessage), false);
assert.match(adminReviewSurface.adminDetail, /internal review required/i);

const queuedSurface = resolveReportSurfaceState({
  report: { ...publishedCurrent, id: "report-queued", status: "queued", is_current_revision: false },
  job: { status: "queued" },
});
assert.equal(queuedSurface.stateKey, "queued");
assert.equal(queuedSurface.customerMessage, "Report generation has been queued.");

const processingSurface = resolveReportSurfaceState({
  report: { ...publishedCurrent, id: "report-processing", status: "rendering", is_current_revision: false },
  job: { status: "rendering" },
});
assert.equal(processingSurface.stateKey, "actively_processing");
assert.equal(processingSurface.customerMessage, "Report generation is in progress.");

const staleSurface = resolveReportSurfaceState({
  report: { ...publishedCurrent, id: "report-stale", status: "publishing", is_current_revision: false },
  job: {
    status: "publishing",
    worker_lease_expires_at: "2026-07-29T00:00:00.000Z",
    worker_attempt_id: "attempt-stale",
    worker_claimed_by: "worker-stale",
  },
  now: new Date("2026-07-30T00:00:00.000Z"),
});
assert.equal(staleSurface.stateKey, "stale_or_abandoned_worker");
assert.match(staleSurface.customerMessage, /generation paused before publication/i);

const deadLetterSurface = resolveReportSurfaceState({
  report: { ...publishedCurrent, id: "report-dead-letter", status: "dead_letter", is_current_revision: false },
  job: { status: "dead_letter", dead_lettered_at: "2026-07-30T00:30:00.000Z" },
});
assert.equal(deadLetterSurface.stateKey, "dead_letter");
assert.match(deadLetterSurface.customerMessage, /generation paused before publication/i);
assert.match(deadLetterSurface.adminDetail, /dead-letter terminal state/i);

assert.equal(currentSurface.adminStatusLabel, "Current published revision");
assert.equal(historicalSurface.adminStatusLabel, "Historical published revision");
assert.equal(queuedSurface.adminStatusLabel, "Queued");
assert.equal(processingSurface.adminStatusLabel, "Processing");
assert.equal(staleSurface.adminStatusLabel, "Stale worker");

console.log("report surface convergence smoke PASS");
