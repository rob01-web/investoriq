import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildDeliveryGateDecision,
  buildCanonicalDeliveryDecisionState,
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
assert.equal(adminReviewState.public_sample_ready, false);
assert.equal(adminReviewState.high_value_outreach_ready, false);

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

const generatorSource = fs.readFileSync("api/generate-client-report.js", "utf8");
assert.match(generatorSource, /deliveryDecisionState:/);
assert.match(generatorSource, /payload:\s*\{[\s\S]*deliveryDecisionState:/);
assert.match(generatorSource, /function buildDeliveryResponseCompatibilityAliases\(/);
assert.match(generatorSource, /const deliveryAliases = buildDeliveryResponseCompatibilityAliases\(blockedDecisionState\)/);
assert.match(generatorSource, /const deliveryAliases = buildDeliveryResponseCompatibilityAliases\(canonicalDeliveryDecisionState\)/);
assert.match(generatorSource, /delivery_gate_status:\s*deliveryGateStatus/);
assert.match(generatorSource, /customer_delivery_ready:\s*customerDeliveryAllowed/);
assert.match(generatorSource, /customer_publish_eligible:\s*customerDeliveryAllowed/);
assert.match(generatorSource, /hold_delivery:\s*holdDelivery/);
assert.match(generatorSource, /holdDelivery,?\s*\n/);
assert.match(generatorSource, /public_sample_ready:\s*Boolean\(state\.public_sample_ready\)/);
assert.match(generatorSource, /high_value_outreach_ready:\s*Boolean\(state\.high_value_outreach_ready\)/);
assert.match(generatorSource, /hold_delivery:/);
assert.match(generatorSource, /holdDelivery:/);

console.log("delivery decision state smoke PASS");
