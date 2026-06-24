import assert from "assert";

import { buildDeliveryGateDecision } from "../../api/_lib/qa-action-plan.js";

const coreValidCoverage = {
  qa_status: "pass",
  deterministic_flags: [],
  artifact_inventory: {
    t12_parsed: { present: true, has_core_totals: true },
    rent_roll_parsed: { present: true },
  },
  core_input_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    required_core_docs_missing: false,
    customer_delivery_impact: "allow",
    blocks_customer_delivery: false,
    status: "validated",
  },
  t12_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    required_core_docs_missing: false,
    status: "validated",
  },
  rent_roll_sufficiency_state: {
    publishability_bucket: "core_sufficient_publishable",
    required_core_docs_missing: false,
    status: "validated",
  },
};

const optionalSurfaceGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: coreValidCoverage,
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
        category: "debt_contract",
        source_artifact: "report_contract_qa",
        severity: "high",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
      {
        code: "UNSUPPORTED_RENOVATION_ANALYSIS_RENDERED",
        category: "section_gating_contract",
        source_artifact: "report_contract_qa",
        severity: "high",
        blocks_customer_delivery: false,
        blocks_public_sample: false,
        blocks_high_value_outreach: false,
      },
    ],
  },
  qaActionPlan: {
    prioritized_actions: [],
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});

assert.equal(optionalSurfaceGate.core_valid_required_coverage, true);
assert.equal(optionalSurfaceGate.delivery_gate_status, "deliverable");
assert.equal(optionalSurfaceGate.customer_delivery_ready, true);
assert.equal(optionalSurfaceGate.customer_publish_eligible, true);
assert.equal(optionalSurfaceGate.report_publishable, true);
assert.equal(optionalSurfaceGate.report_blocked, false);
assert.deepEqual(optionalSurfaceGate.customer_publish_blockers, []);
assert.equal(optionalSurfaceGate.customer_delivery_impact, "allow");

const currentDebtSeparationOnlyGate = buildDeliveryGateDecision({
  sourceReportCoverageQa: coreValidCoverage,
  reportContractQa: {
    contract_status: "block",
    customer_delivery_ready: false,
    violations: [
      {
        code: "ACQUISITION_CURRENT_DEBT_SEPARATION_CONTRACT",
        category: "debt_contract",
        source_artifact: "report_contract_qa",
        severity: "critical",
        blocks_customer_delivery: true,
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
  qaActionPlan: {
    prioritized_actions: [],
    customer_delivery_ready: false,
    public_sample_ready: false,
    high_value_outreach_ready: false,
  },
});

assert.equal(currentDebtSeparationOnlyGate.delivery_gate_status, "deliverable");
assert.equal(currentDebtSeparationOnlyGate.customer_publish_eligible, true);
assert.equal(currentDebtSeparationOnlyGate.report_publishable, true);
assert.deepEqual(currentDebtSeparationOnlyGate.customer_publish_blockers, []);

console.log("acquisition-memo-v2-final-boss-compliance-collapse-smoke: ok");
