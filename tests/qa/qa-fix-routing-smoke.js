import assert from "node:assert/strict";
import { buildQaFixRouting } from "../../api/_lib/qa-fix-routing.js";

const result = buildQaFixRouting({
  jobId: "forest-city-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
  reportType: "underwriting",
  reportTier: 2,
  sourceReportCoverageQa: {
    deterministic_flags: [
      { code: "T12_LINE_ITEM_DETAIL_MISSING", severity: "medium", message: "T12 line detail missing.", evidence: {}, routing: "parser_gap" },
      { code: "RENOVATION_DOC_NOT_STRUCTURED", severity: "medium", message: "Renovation doc not structured.", evidence: {}, routing: "artifact_gap" },
      { code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT", severity: "high", message: "Debt assumptions not structured.", evidence: {}, routing: "artifact_gap" },
      { code: "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED", severity: "high", message: "Full underwriting depth constrained.", evidence: {}, routing: "admin_review_required" },
      { code: "FULL_UNDERWRITING_SUPPORT_UNDERUSED", severity: "high", message: "Support package underused.", evidence: {}, routing: "admin_review_required" },
      { code: "PUBLIC_SAMPLE_NOT_READY", severity: "high", message: "Public sample not ready.", evidence: {}, routing: "public_sample_blocker" },
    ],
  },
  reportQaFlags: [
    { code: "DEBT_FILE_WITH_MISSING_BALANCE", severity: "high", message: "Debt missing balance.", evidence: {} },
    { code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT", severity: "medium", message: "DSCR not assessed with debt context.", evidence: {} },
    { code: "T12_TOTALS_ONLY", severity: "low", message: "T12 totals only.", evidence: {} },
  ],
  renderedReportQa: {
    findings: [
      {
        code: "DATA_NOT_AVAILABLE_VISIBLE",
        severity: "medium",
        issue: "Visible DATA NOT AVAILABLE appears in the rendered report.",
        excerpt: "DATA NOT AVAILABLE",
      },
    ],
  },
});

const routeCodes = result.routes.map((route) => route.code);
const routeTypes = new Set(result.routes.map((route) => route.routing));

assert.equal(result.event, "qa_fix_routing");
assert.equal(result.advisory_only, true);
assert.equal(result.no_public_surface, true);
assert.equal(result.public_sample_ready, false);
assert.equal(result.customer_delivery_action, "advisory_only_no_delivery_block");
assert.equal(result.admin_action_required, true);
assert.equal(result.regenerate_recommended, true);
assert.equal(routeTypes.has("parser_gap"), true);
assert.equal(routeTypes.has("artifact_gap"), true);
assert.equal(routeTypes.has("render_gating_gap"), true);
assert.equal(routeCodes.includes("PUBLIC_SAMPLE_REVIEW_HOLD"), true);
assert.equal(JSON.stringify(result).includes(["qa", "blocked"].join("_")), false);
assert.equal(JSON.stringify(result).includes(["qa", "review", "required"].join("_")), false);

console.log("qa-fix-routing smoke PASS");
console.log(routeCodes.join(", "));
