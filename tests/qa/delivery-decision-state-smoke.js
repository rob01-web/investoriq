import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildDeliveryGateDecision,
  buildCanonicalDeliveryDecisionState,
  isCoreValidRequiredCoverageState,
} from "../../api/_lib/qa-action-plan.js";

const baseCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true },
  },
  core_input_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
  },
};

const deliverableGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: baseCoverage,
  reportContractQa: { violations: [] },
  qaActionPlan: { prioritized_actions: [], customer_delivery_ready: true },
});
const deliverableState = buildCanonicalDeliveryDecisionState(deliverableGate);
assert.equal(deliverableState.customer_delivery_allowed, true);
assert.equal(deliverableState.hold_delivery, false);
assert.equal(deliverableState.core_valid_required_coverage, false);

const coreValidCoverage = {
  qa_status: "pass",
  deterministic_flags: [
    {
      code: "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
      blocks_customer_delivery: true,
      blocks_public_sample: true,
      blocks_high_value_outreach: true,
    },
  ],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true },
  },
  t12_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    status: "validated",
  },
  rent_roll_sufficiency_state: {
    publishability_bucket: "section_constrained_publishable",
    status: "validated",
  },
  core_input_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    status: "validated",
  },
};

assert.equal(isCoreValidRequiredCoverageState(coreValidCoverage), true);

const coreValidSectionLeakDecision = buildDeliveryGateDecision({
  sourceReportCoverageQa: coreValidCoverage,
  reportContractQa: {
    violations: [
      {
        code: "REPORT_TYPE_SECTION_LEAK",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
        customer_delivery_impact: "block",
      },
    ],
  },
  qaActionPlan: {
    prioritized_actions: [
      {
        code: "CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
    advisory_only_findings: ["OPENAI_INSUFFICIENT_QUOTA"],
  },
});
const coreValidSectionLeakState = buildCanonicalDeliveryDecisionState(coreValidSectionLeakDecision);
assert.equal(coreValidSectionLeakDecision.core_valid_required_coverage, true);
assert.equal(coreValidSectionLeakDecision.delivery_gate_status, "deliverable");
assert.equal(coreValidSectionLeakDecision.customer_delivery_ready, true);
assert.equal(coreValidSectionLeakDecision.customer_publish_eligible, true);
assert.equal(coreValidSectionLeakDecision.user_needs_documents, false);
assert.equal(coreValidSectionLeakDecision.customer_publish_blockers.includes("CURRENT_DEBT_REFI_CANONICAL_CONFORMANCE_DRIFT"), false);
assert.equal(coreValidSectionLeakDecision.customer_publish_blockers.includes("REPORT_TYPE_SECTION_LEAK"), false);
assert.equal(coreValidSectionLeakState.customer_status_label, "ready");
assert.equal(coreValidSectionLeakState.hold_delivery, false);
assert.equal(coreValidSectionLeakState.credit_restore_required, false);
assert.equal(coreValidSectionLeakState.fail_closed_reason_code, null);

const coreValidSupportDepthDecision = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    ...coreValidCoverage,
    deterministic_flags: [
      {
        code: "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
        routing: "public_sample_blocker",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
        routing: "public_sample_blocker",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
        routing: "public_sample_blocker",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
        routing: "public_sample_blocker",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  reportContractQa: { violations: [] },
  qaActionPlan: {
    prioritized_actions: [
      {
        code: "FULL_UNDERWRITING_TIER_DEPTH_CONSTRAINED",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "FULL_UNDERWRITING_SUPPORT_UNDERUSED",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
        action_type: "render_gating_fix_required",
        owner_area: "report_renderer",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
    customer_delivery_ready: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});
assert.equal(coreValidSupportDepthDecision.core_valid_required_coverage, true);
assert.equal(coreValidSupportDepthDecision.delivery_gate_status, "deliverable");
assert.equal(coreValidSupportDepthDecision.customer_delivery_ready, true);
assert.equal(coreValidSupportDepthDecision.customer_publish_eligible, true);
assert.equal(coreValidSupportDepthDecision.user_needs_documents, false);
assert.equal(coreValidSupportDepthDecision.customer_publish_blockers.length, 0);
assert.equal(coreValidSupportDepthDecision.public_sample_ready, false);
assert.equal(coreValidSupportDepthDecision.high_value_outreach_ready, false);

const distributionOnlyDecision = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    ...coreValidCoverage,
    deterministic_flags: [
      {
        code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
        routing: "public_sample_blocker",
        blocks_customer_delivery: false,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  reportContractQa: { violations: [] },
  qaActionPlan: {
    prioritized_actions: [],
    advisory_only_findings: ["OPENAI_INSUFFICIENT_QUOTA"],
  },
});
assert.equal(distributionOnlyDecision.delivery_gate_status, "deliverable");
assert.equal(distributionOnlyDecision.customer_delivery_ready, true);
assert.equal(distributionOnlyDecision.public_sample_ready, false);
assert.equal(distributionOnlyDecision.high_value_outreach_ready, false);
assert.equal(distributionOnlyDecision.user_needs_documents, false);

const needsDocsGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    ...baseCoverage,
    qa_status: "needs_documents",
    core_input_sufficiency_state: {
      publishability_bucket: "user_needs_documents",
      reason_code: "MISSING_REQUIRED_SOURCE_DATA",
      required_core_docs_missing: true,
    },
  },
  reportContractQa: { violations: [] },
  qaActionPlan: { prioritized_actions: [], customer_delivery_ready: false },
});
const needsDocsState = buildCanonicalDeliveryDecisionState(needsDocsGate);
assert.equal(needsDocsState.customer_delivery_allowed, false);
assert.equal(needsDocsState.hold_delivery, true);
assert.equal(
  needsDocsState.credit_restore_required === true || Boolean(needsDocsState.fail_closed_reason_code),
  true
);

const adminReviewGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: {
    ...baseCoverage,
    core_input_sufficiency_state: {
      publishability_bucket: "admin_review_required",
      reason_code: "SYSTEM_CONTRACT_FAILURE",
      system_contract_failure: true,
    },
  },
  reportContractQa: { violations: [] },
  qaActionPlan: { prioritized_actions: [], customer_delivery_ready: false },
});
const adminReviewState = buildCanonicalDeliveryDecisionState(adminReviewGate);
assert.equal(adminReviewState.customer_delivery_allowed, false);
assert.equal(adminReviewState.delivery_gate_status, "user_needs_documents");
assert.equal(adminReviewState.core_valid_required_coverage, false);

const docraptorOnlyGate = buildCanonicalDeliveryDecisionState({
  delivery_gate_status: "deliverable",
  customer_publish_eligible: false,
  customer_delivery_ready: false,
  customer_publish_blockers: [],
  public_sample_ready: false,
  public_sample_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
  high_value_outreach_ready: false,
  high_value_outreach_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
  reason_code: "customer_publish_not_ready",
});
assert.equal(docraptorOnlyGate.customer_delivery_allowed, true);
assert.equal(docraptorOnlyGate.customer_status_label, "ready");
assert.equal(docraptorOnlyGate.hold_delivery, false);
assert.equal(docraptorOnlyGate.public_sample_ready, false);
assert.equal(docraptorOnlyGate.high_value_outreach_ready, false);

const docraptorWithCustomerBlockerGate = buildCanonicalDeliveryDecisionState({
  delivery_gate_status: "deliverable",
  customer_publish_eligible: true,
  customer_delivery_ready: true,
  customer_publish_blockers: ["RENDERED_TEMPLATE_TOKEN_LEAK"],
  public_sample_ready: false,
  public_sample_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
  high_value_outreach_ready: false,
  high_value_outreach_blockers: ["DOCRAPTOR_NOT_PRODUCTION_MODE"],
  reason_code: "customer_blocked:RENDERED_TEMPLATE_TOKEN_LEAK",
});
assert.equal(docraptorWithCustomerBlockerGate.customer_delivery_allowed, false);
assert.equal(docraptorWithCustomerBlockerGate.customer_status_label, "publication_held");

const canonicalPrecedenceOverLegacyAliases = buildCanonicalDeliveryDecisionState({
  source: "canonical_delivery_decision",
  delivery_gate_status: "deliverable",
  customer_delivery_allowed: true,
  hold_delivery: false,
  customer_publish_eligible: false,
  customer_delivery_ready: false,
  customer_publish_blockers: [],
  public_sample_ready: false,
  high_value_outreach_ready: false,
  reason_code: "customer_publish_eligible",
});
assert.equal(canonicalPrecedenceOverLegacyAliases.customer_delivery_allowed, true);
assert.equal(canonicalPrecedenceOverLegacyAliases.customer_status_label, "ready");
assert.equal(canonicalPrecedenceOverLegacyAliases.customer_status_reason_code, null);
assert.equal(canonicalPrecedenceOverLegacyAliases.legacy_compatibility?.customer_status_reason_code, "customer_publish_eligible");

const generatorSource = fs.readFileSync("api/generate-client-report.js", "utf8");
assert.match(generatorSource, /deliveryDecisionState:/);
assert.match(generatorSource, /payload:\s*\{[\s\S]*deliveryDecisionState:/);
assert.match(generatorSource, /function buildDeliveryResponseCompatibilityAliases\(/);
assert.match(generatorSource, /const deliveryAliases = buildDeliveryResponseCompatibilityAliases\(blockedDecisionState\)/);
assert.match(generatorSource, /const deliveryAliases = buildDeliveryResponseCompatibilityAliases\(canonicalDeliveryDecisionState\)/);
assert.match(generatorSource, /legacy_compatibility:\s*\{/);
assert.match(generatorSource, /customer_delivery_allowed:\s*customerDeliveryAllowed/);
assert.match(generatorSource, /legacy_compatibility:\s*\{[\s\S]{0,220}customer_delivery_ready:\s*customerDeliveryAllowed/);
assert.match(generatorSource, /legacy_compatibility:\s*\{[\s\S]{0,220}customer_publish_eligible:\s*customerDeliveryAllowed/);
assert.match(generatorSource, /legacy_compatibility:\s*\{[\s\S]{0,220}hold_delivery:\s*holdDelivery/);
assert.match(generatorSource, /coreValidRequiredCoverage: Boolean\(canonicalDeliveryDecisionState\?\.core_valid_required_coverage\)/);
assert.match(generatorSource, /deliveryGateDecisionResult\?\.delivery_gate_status === "user_needs_documents" &&[\s\S]{0,120}deliveryDecisionStateResult\?\.core_valid_required_coverage !== true/);
assert.match(generatorSource, /coreValidRequiredCoverage: Boolean\(canonicalDeliveryDecisionState\?\.core_valid_required_coverage\),/);
assert.match(generatorSource, /holdDelivery,?\s*\n/);
assert.match(generatorSource, /public_sample_ready:\s*Boolean\(state\.public_sample_ready\)/);
assert.match(generatorSource, /high_value_outreach_ready:\s*Boolean\(state\.high_value_outreach_ready\)/);
assert.match(generatorSource, /hold_delivery:/);
assert.match(generatorSource, /holdDelivery:/);

console.log("delivery decision state smoke PASS");
