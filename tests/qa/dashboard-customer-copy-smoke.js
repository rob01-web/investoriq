import assert from "node:assert/strict";
import fs from "node:fs";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE,
  getCustomerFacingJobStatus,
  normalizeDashboardCustomerStatusLabel,
  resolveDashboardCustomerStatus,
  resolveDoctrineCustomerMessage,
} = await import("../../src/lib/dashboardCustomerCopy.js");

assert.equal(normalizeDashboardCustomerStatusLabel("under_review"), "failed");
assert.equal(normalizeDashboardCustomerStatusLabel("needs_documents"), "failed");
assert.equal(normalizeDashboardCustomerStatusLabel("published"), "published");

assert.equal(getCustomerFacingJobStatus({ status: "queued" }), "queued");
assert.equal(getCustomerFacingJobStatus({ status: "rendering" }), "rendering");
assert.equal(
  getCustomerFacingJobStatus(
    { status: "failed", core_valid_required_coverage: true },
    { customer_status_label: "publication_held", core_valid_required_coverage: true, customer_message: "Source package could not be verified." }
  ),
  "failed"
);

assert.equal(
  resolveDoctrineCustomerMessage(
    { status: "failed", core_valid_required_coverage: true },
    { customer_message: "Submission under review", core_valid_required_coverage: true }
  ),
  "Submission under review"
);

const coreValidDecision = resolveDashboardCustomerStatus(
  { status: "failed", error_code: "MISSING_REQUIRED_SOURCE_DATA", core_valid_required_coverage: true },
  {
    source: "canonical_delivery_decision",
    delivery_gate_status: "user_needs_documents",
    customer_status_label: "publication_held",
    customer_message: "Source package could not be verified as complete and usable for this report.",
    core_valid_required_coverage: true,
  }
);
assert.equal(coreValidDecision.customer_status_label, "failed");
assert.match(coreValidDecision.customer_message, /Source package could not be verified/i);

const missingCanonicalDecision = resolveDashboardCustomerStatus({
  status: "failed",
  error_code: "MISSING_REQUIRED_SOURCE_DATA",
  failure_reason: "Rent roll parse failed",
});
assert.equal(missingCanonicalDecision.hasCanonicalDeliveryDecision, false);
assert.equal(missingCanonicalDecision.customer_message, DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE);
assert.equal(/rent roll|upload|replace|clearer documents/i.test(missingCanonicalDecision.customer_message), false);

const aliasOnlyDecision = resolveDashboardCustomerStatus(
  { status: "failed" },
  {
    delivery_gate_status: "deliverable",
    customer_delivery_allowed: true,
    customer_message: "Legacy alias says ready",
  }
);
assert.equal(aliasOnlyDecision.hasCanonicalDeliveryDecision, false);
assert.equal(aliasOnlyDecision.customer_message, DASHBOARD_NEUTRAL_SYSTEM_FAILURE_MESSAGE);

const dashboardSource = fs.readFileSync("src/pages/Dashboard.jsx", "utf8");
assert.match(
  dashboardSource,
  /Report generation may take up to 24 business hours\. You will be notified when your report is ready\./
);
assert.equal(/Processing underway\. Monitor status in Active Jobs below\./.test(dashboardSource), false);
const adminDashboardSource = fs.readFileSync("src/pages/AdminDashboard.jsx", "utf8");
assert.match(adminDashboardSource, /Internal review marker logged for internal diagnostics only\./);
assert.match(adminDashboardSource, /<option value='reviewing'>Internal review marker<\/option>|<option value="reviewing">Internal review marker<\/option>/);
assert.match(adminDashboardSource, /Internal review marker<\/Btn>|Internal review marker<\/button>/);
const queueMetricsSource = fs.readFileSync("api/admin/queue-metrics.js", "utf8");
assert.match(queueMetricsSource, /Internal review required/);
assert.match(queueMetricsSource, /Internal documents required/);

assert.equal(/getFailedFileGuidance/.test(dashboardSource), false);
assert.equal(/select\('original_filename, doc_type, parse_status, parse_error'\)/.test(dashboardSource), false);
assert.doesNotMatch(dashboardSource, /window\.location\.reload\(\)/);
assert.match(dashboardSource, /const refreshDashboardSnapshot = async \(\) =>/);
for (const refreshTarget of [
  "fetchReports()",
  "fetchInProgressJobs()",
  "fetchRecentJobs()",
  "fetchLatestFailedJob()",
  "fetchEntitlements()",
]) {
  assert.match(
    dashboardSource,
    new RegExp(refreshTarget.replace(/[()]/g, "\\$&")),
    refreshTarget,
  );
}
assert.match(dashboardSource, /onClick=\{refreshDashboardSnapshot\}/);
assert.match(dashboardSource, /disabled=\{dashboardSnapshotRefreshing\}/);
assert.match(dashboardSource, /data-report-history-status="failed"/);
assert.match(dashboardSource, /failedJobsForHistory\.map/);
assert.match(
  dashboardSource,
  /Failed reports include the current credit-restoration message\./,
);

console.log("dashboard customer-copy smoke PASS");
