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
const routeText = result.routes
  .flatMap((route) => [route.code, route.routing, route.category, route.action, route.message])
  .filter(Boolean)
  .join(" | ");
const resultText = JSON.stringify(result);

const acquisitionFinancingLimitedRender = buildQaFixRouting({
  reportQaFlags: [
    {
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      severity: "medium",
      message: "Acquisition financing is intentionally source-limited.",
      evidence: {},
    },
  ],
  sourceReportCoverageQa: {
    rendered_text_signals: ["acquisition_financing_readiness_limited"],
  },
});

const acquisitionFinancingCaution = buildQaFixRouting({
  reportQaFlags: [
    {
      code: "ACQUISITION_FINANCING_FIELD_LIMITED",
      severity: "medium",
      message: "Acquisition financing source limitation review.",
      evidence: {},
    },
  ],
});

assert.equal(result.event, "qa_fix_routing");
assert.equal(result.advisory_only, true);
assert.equal(result.no_public_surface, true);
assert.equal(result.customer_delivery_action, "advisory_only_no_delivery_block");
assert.equal(result.admin_action_required, true);
assert.equal(result.regenerate_recommended, true);
assert.equal(result.elite_ready, false);
assert.equal(result.elite_readiness_blockers.length > 0, true);
assert.equal(result.distribution_config_blocked, false);
assert.equal(routeTypes.has("parser_gap"), true);
assert.equal(routeTypes.has("artifact_gap"), true);
assert.equal(routeTypes.has("render_gating_gap"), true);
assert.equal(routeCodes.includes("PUBLIC_SAMPLE_REVIEW_HOLD"), false);
assert.equal(/public sample|outreach sample|high-value|Ken|public_sample|high_value|public_or_outreach/i.test(routeText), false);
assert.equal(/public sample|outreach sample|high-value|Ken|public_sample|high_value|public_or_outreach/i.test(resultText), false);
assert.equal(resultText.includes("public_sample_ready"), false);
assert.equal(resultText.includes("public_sample_blocker"), false);

const limitedRoute = acquisitionFinancingLimitedRender.routes.find((route) => route.code === "ACQUISITION_FINANCING_FIELD_LIMITED");
assert.equal(acquisitionFinancingLimitedRender.elite_ready, true);
assert.equal(acquisitionFinancingLimitedRender.admin_action_required, false);
assert.equal(acquisitionFinancingLimitedRender.elite_readiness_blockers.includes("ACQUISITION_FINANCING_FIELD_LIMITED"), false);
assert.equal(acquisitionFinancingLimitedRender.advisory_only_findings.includes("ACQUISITION_FINANCING_FIELD_LIMITED"), true);
assert.equal(limitedRoute.routing, "source_insufficient");
assert.equal(limitedRoute.action, "no_action_false_positive");
assert.equal(limitedRoute.elite_blocker, false);
assert.equal(limitedRoute.requires_regeneration, false);

const cautionRoute = acquisitionFinancingCaution.routes.find((route) => route.code === "ACQUISITION_FINANCING_FIELD_LIMITED");
assert.equal(acquisitionFinancingCaution.elite_ready, true);
assert.equal(acquisitionFinancingCaution.admin_action_required, false);
assert.equal(acquisitionFinancingCaution.elite_readiness_blockers.includes("ACQUISITION_FINANCING_FIELD_LIMITED"), false);
assert.equal(acquisitionFinancingCaution.advisory_only_findings.includes("ACQUISITION_FINANCING_FIELD_LIMITED"), true);
assert.equal(cautionRoute.routing, "source_insufficient");
assert.equal(cautionRoute.action, "acquisition_financing_remains_source_limited_until_terms_are_complete");
assert.equal(cautionRoute.elite_blocker, false);
assert.equal(cautionRoute.requires_regeneration, false);

const docRaptorOnly = buildQaFixRouting({
  reportQaFlags: [
    { code: "DOCRAPTOR_NOT_PRODUCTION_MODE", severity: "medium", message: "DocRaptor is in test mode.", evidence: {} },
  ],
});
assert.equal(docRaptorOnly.elite_ready, true);
assert.equal(docRaptorOnly.distribution_config_blocked, true);
assert.equal(docRaptorOnly.distribution_config_blockers.includes("DOCRAPTOR_NOT_PRODUCTION_MODE"), true);
assert.equal(docRaptorOnly.elite_readiness_blockers.length, 0);
assert.equal(docRaptorOnly.routes.some((route) => route.elite_blocker), false);
assert.equal(/public sample|outreach sample|high-value|Ken|public_sample|high_value|public_or_outreach/i.test(JSON.stringify(docRaptorOnly)), false);

console.log("qa-fix-routing smoke PASS");
console.log(routeCodes.join(", "));
