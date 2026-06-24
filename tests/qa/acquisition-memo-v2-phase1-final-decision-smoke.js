import assert from "assert";

import { buildAcquisitionMemoV2FinalDeliveryDecision } from "../../api/_lib/acquisition-memo-v2-final-decision.js";
import { repairAcquisitionMemoV2HtmlForRepairPlan } from "../../api/_lib/acquisition-memo-v2-boss-repair.js";

const validCoreGate = { publishAllowed: true, fatalReasons: [] };

const repairedPublishDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: { ok: true, violations: [] },
    bossCompliance: { ok: true, fatal_core: [] },
    customerSurfaceModelValidation: { ok: true, issues: [] },
    customerSurfaceHtmlValidation: { ok: true, issues: [] },
  },
  qaActionPlan: { customer_delivery_ready: true, report_publishable: true },
  reportContractQa: { contract_status: "warn", report_quality_status: "warn", customer_delivery_ready: true },
  deliveryGateDecision: {
    delivery_gate_status: "deliverable",
    customer_delivery_ready: true,
    customer_publish_eligible: true,
    report_publishable: true,
  },
  coreGate: validCoreGate,
  repairPlan: {
    coreFatal: [],
    repairableOptionalSupport: [{ code: "UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED" }],
    forbiddenSurface: [],
    repairableSectionKeys: ["renovationContext"],
  },
  diagnostics: {
    repairAttempted: true,
    repairedHtmlRevalidated: true,
  },
});

assert.equal(repairedPublishDecision.customer_publish_eligible, true);
assert.equal(repairedPublishDecision.report_publishable, true);
assert.equal(repairedPublishDecision.classifications.repairableOptionalSupport, true);
assert.equal(repairedPublishDecision.repair.attempted, true);
assert.equal(repairedPublishDecision.repair.repairedHtmlRevalidated, true);

const hardForbiddenDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: {
      ok: false,
      violations: [{ code: "HTML_FORBIDDEN_SURFACES_PRESENT", severity: "fatal_core", section: "html.forbiddenSurfaces" }],
    },
    bossCompliance: { ok: false, fatal_core: [{ code: "NO_FORBIDDEN_SURFACES" }] },
    customerSurfaceModelValidation: { ok: true, issues: [] },
    customerSurfaceHtmlValidation: {
      ok: false,
      issues: [{ code: "HTML_FORBIDDEN_SURFACES_PRESENT", severity: "fatal_core", path: "html.forbiddenSurfaces" }],
    },
  },
  coreGate: validCoreGate,
  repairPlan: {
    coreFatal: [],
    repairableOptionalSupport: [],
    forbiddenSurface: [{ code: "HTML_FORBIDDEN_SURFACES_PRESENT" }],
    repairableSectionKeys: [],
  },
  diagnostics: {
    repairAttempted: true,
    repairedHtmlRevalidated: true,
  },
});

assert.equal(hardForbiddenDecision.customer_publish_eligible, false);
assert.equal(hardForbiddenDecision.fatalCategory, "true_unrepaired_unsafe_final_html");

const internalLeakDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: {
      ok: false,
      violations: [{ code: "HTML_INTERNAL_LANGUAGE_LEAK", severity: "critical", section: "html.internal" }],
    },
    bossCompliance: { ok: true, fatal_core: [] },
    customerSurfaceModelValidation: { ok: true, issues: [] },
    customerSurfaceHtmlValidation: {
      ok: false,
      issues: [{ code: "HTML_INTERNAL_LANGUAGE_LEAK", severity: "critical", path: "html.internal" }],
    },
  },
  coreGate: validCoreGate,
  repairPlan: {
    coreFatal: [],
    repairableOptionalSupport: [],
    forbiddenSurface: [{ code: "HTML_INTERNAL_LANGUAGE_LEAK" }],
    repairableSectionKeys: [],
  },
  diagnostics: {
    repairAttempted: true,
    repairedHtmlRevalidated: true,
  },
});

assert.equal(internalLeakDecision.customer_publish_eligible, false);
assert.equal(internalLeakDecision.classifications.trueUnrepairedUnsafeFinalHtml, true);

const missingT12Decision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: {
      ok: false,
      violations: [{ code: "MODEL_CORE_T12_MISSING", severity: "critical", section: "model.coreSources.coreT12" }],
    },
  },
  coreGate: { publishAllowed: false, fatalReasons: ["missing_core_t12"] },
  repairPlan: { coreFatal: [{ code: "MODEL_CORE_T12_MISSING" }] },
});

assert.equal(missingT12Decision.customer_publish_eligible, false);
assert.equal(missingT12Decision.fatalCategory, "true_core_fatal");

const missingRentRollDecision = buildAcquisitionMemoV2FinalDeliveryDecision({
  finalization: {
    compliance: {
      ok: false,
      violations: [{ code: "MODEL_CORE_RENT_ROLL_MISSING", severity: "critical", section: "model.coreSources.coreRentRoll" }],
    },
  },
  coreGate: { publishAllowed: false, fatalReasons: ["missing_core_rent_roll"] },
  repairPlan: { coreFatal: [{ code: "MODEL_CORE_RENT_ROLL_MISSING" }] },
});

assert.equal(missingRentRollDecision.customer_publish_eligible, false);
assert.equal(missingRentRollDecision.fatalCategory, "true_core_fatal");

const repairedHtml = repairAcquisitionMemoV2HtmlForRepairPlan(
  '<section><!-- IQ_SOURCE_AUTHORITY: {"classifiedBy":"buildCanonicalSourcePackage"} --><p>Boss Contract DSCR refinance DCF final recommendation</p></section>',
  { forbiddenSurface: [{ code: "HTML_INTERNAL_LANGUAGE_LEAK" }] }
);

assert.equal(/IQ_SOURCE_AUTHORITY|Boss Contract|DSCR|refinance|DCF/i.test(repairedHtml), false);
assert.equal(/final recommendation/i.test(repairedHtml), true, "hard recommendation language must not be silently scrubbed");

console.log("acquisition-memo-v2-phase1-final-decision-smoke: ok");
