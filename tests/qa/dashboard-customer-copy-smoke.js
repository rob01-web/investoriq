import assert from "node:assert/strict";
import fs from "node:fs";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  getCustomerFacingJobStatus,
  getFailedFileGuidance,
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
  "Report could not be generated.\n\nInvestorIQ encountered a processing issue while preparing this report. Please try again or contact support if it repeats."
);

const coreValidDecision = resolveDashboardCustomerStatus(
  { status: "failed", error_code: "MISSING_REQUIRED_SOURCE_DATA", core_valid_required_coverage: true },
  {
    delivery_gate_status: "user_needs_documents",
    customer_status_label: "publication_held",
    customer_message: "Source package could not be verified as complete and usable for this report.",
    core_valid_required_coverage: true,
  }
);
assert.equal(coreValidDecision.customer_status_label, "failed");
assert.equal(/source package|rent roll|additional required documents|needs documents/i.test(String(coreValidDecision.customer_message || "")), false);

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

const failedGuidance = getFailedFileGuidance(
  [
    { original_filename: "T12.pdf", doc_type: "t12", parse_status: "failed" },
    { original_filename: "Rent Roll.csv", doc_type: "rent_roll", parse_status: "failed" },
  ],
  "underwriting",
  true
);
assert.equal(failedGuidance, "");

const missingT12Guidance = getFailedFileGuidance(
  [
    { original_filename: "T12.pdf", doc_type: "t12", parse_status: "failed" },
  ],
  "underwriting",
  false
);
assert.match(missingT12Guidance, /T12 \/ operating statement/i);
assert.match(missingT12Guidance, /credit has been restored/i);

console.log("dashboard customer-copy smoke PASS");
