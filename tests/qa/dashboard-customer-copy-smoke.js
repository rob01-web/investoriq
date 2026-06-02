import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const {
  getCustomerFacingJobStatus,
  getFailedFileGuidance,
  normalizeDashboardCustomerStatusLabel,
  resolveDashboardCustomerStatus,
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
