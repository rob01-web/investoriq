import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test-key";

const { resolveReportTypeAndTier } = await import("../../api/_lib/report-request-context.js");

// Underwriting aliases must normalize to underwriting/tier 2.
for (const alias of [
  "underwriting",
  "full_underwriting",
  "full-underwriting",
  "underwriting_report",
  "underwriting_v1",
  "tier_2",
  "tier2",
]) {
  const resolved = resolveReportTypeAndTier({ bodyReportType: alias });
  assert.equal(resolved.ok, true);
  assert.equal(resolved.reportType, "underwriting");
  assert.equal(resolved.reportTier, 2);
  assert.equal(resolved.effectiveReportMode, "v1_core");
}

// Unknown explicit tokens must fail closed and never downgrade to screening.
const unknown = resolveReportTypeAndTier({ bodyReportType: "uw_vnext_custom" });
assert.equal(unknown.ok, false);
assert.equal(unknown.explicitUnknown, true);
assert.equal(Boolean(unknown.reportType), false);

// Screening remains valid.
const screening = resolveReportTypeAndTier({ bodyReportType: "screening" });
assert.equal(screening.ok, true);
assert.equal(screening.reportType, "screening");
assert.equal(screening.reportTier, 1);
assert.equal(screening.effectiveReportMode, "screening_v1");

// Default behavior remains screening only when no explicit report type is provided.
const defaulted = resolveReportTypeAndTier({ bodyReportType: null, jobReportType: null });
assert.equal(defaulted.ok, true);
assert.equal(defaulted.reportType, "screening");
assert.equal(defaulted.reportTier, 1);
assert.equal(defaulted.usedDefault, true);

console.log("report-type-normalization smoke PASS");
