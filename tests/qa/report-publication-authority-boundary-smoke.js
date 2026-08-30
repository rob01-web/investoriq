import assert from "node:assert/strict";
import {
  isCustomerVisiblePublishedReportRevision,
  selectCustomerVisiblePublishedReportRevisions,
} from "../../src/lib/reportRevisionAuthority.js";
import { resolveReportSurfaceState } from "../../src/lib/reportSurfaceState.js";

const candidateRow = {
  id: "report-candidate",
  status: "rendering",
  publication_state: "unpublished",
  storage_path: "user-1/report-candidate.pdf",
  revision_kind: "original",
  revision_number: 1,
  revision_family_key: "report-family",
  revision_root_report_id: "report-family",
  revision_source_job_id: "job-candidate",
  is_current_revision: false,
};

const currentPublishedRow = {
  id: "report-current",
  status: "published",
  publication_state: "published",
  storage_path: "user-1/report-current.pdf",
  revision_kind: "original",
  revision_number: 1,
  revision_family_key: "report-family",
  revision_root_report_id: "report-family",
  revision_source_job_id: "job-current",
  is_current_revision: true,
  revision_published_at: "2026-08-08T10:00:00.000Z",
};

const historicalPublishedRow = {
  id: "report-historical",
  status: "published",
  publication_state: "historical_published",
  storage_path: "user-1/report-historical.pdf",
  revision_kind: "corrected",
  revision_number: 2,
  revision_family_key: "report-family",
  revision_root_report_id: "report-family",
  revision_parent_report_id: "report-current",
  revision_source_job_id: "job-historical",
  is_current_revision: false,
  revision_published_at: "2026-08-08T11:00:00.000Z",
};

const failedRestoredRow = {
  id: "report-failed",
  status: "failed",
  publication_state: "unpublished",
  storage_path: "user-1/report-failed.pdf",
  revision_kind: "replacement",
  revision_number: 3,
  revision_family_key: "report-family",
  revision_root_report_id: "report-family",
  revision_parent_report_id: "report-historical",
  revision_source_job_id: "job-failed",
  is_current_revision: false,
};

assert.equal(isCustomerVisiblePublishedReportRevision(candidateRow), false);
assert.equal(isCustomerVisiblePublishedReportRevision(currentPublishedRow), true);
assert.equal(isCustomerVisiblePublishedReportRevision(historicalPublishedRow), false);
assert.equal(isCustomerVisiblePublishedReportRevision(failedRestoredRow), false);

const visibleFamilyRows = selectCustomerVisiblePublishedReportRevisions([
  candidateRow,
  historicalPublishedRow,
  failedRestoredRow,
  currentPublishedRow,
]);
assert.deepEqual(visibleFamilyRows.map((row) => row.id), [currentPublishedRow.id]);

const candidateSurface = resolveReportSurfaceState({
  report: candidateRow,
  reports: [candidateRow, currentPublishedRow],
  job: { status: "rendering" },
});
assert.equal(candidateSurface.isDownloadable, false);
assert.notEqual(candidateSurface.stateKey, "published_current_revision");

const currentSurface = resolveReportSurfaceState({
  report: currentPublishedRow,
  reports: [candidateRow, currentPublishedRow],
  job: { status: "published" },
});
assert.equal(currentSurface.isDownloadable, true);
assert.equal(currentSurface.stateKey, "published_current_revision");
assert.equal(currentSurface.customerDownloadLabel, "Download current");

const historicalSurface = resolveReportSurfaceState({
  report: historicalPublishedRow,
  reports: [candidateRow, historicalPublishedRow, currentPublishedRow],
  job: { status: "published" },
});
assert.equal(historicalSurface.isDownloadable, false);
assert.equal(historicalSurface.stateKey, "published_historical_revision");

const failedSurface = resolveReportSurfaceState({
  report: failedRestoredRow,
  reports: [candidateRow, failedRestoredRow, currentPublishedRow],
  job: { status: "failed", error_code: "REPORT_GENERATION_FAILED" },
  creditRestored: true,
});
assert.equal(failedSurface.isDownloadable, false);
assert.match(failedSurface.customerMessage, /did not complete|system error/i);

const staleFamilyRows = selectCustomerVisiblePublishedReportRevisions([
  candidateRow,
  failedRestoredRow,
  historicalPublishedRow,
  currentPublishedRow,
]);
assert.deepEqual(staleFamilyRows.map((row) => row.id), [currentPublishedRow.id]);

console.log("report publication authority boundary smoke PASS");
