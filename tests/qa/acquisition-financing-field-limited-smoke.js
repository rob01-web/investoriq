import assert from "node:assert/strict";
import { buildQaActionPlan } from "../../api/_lib/qa-action-plan.js";

const limitedFinding = {
  code: "ACQUISITION_FINANCING_FIELD_LIMITED",
  severity: "medium",
  message: "Acquisition financing purchase price was not verified; acquisition section should be qualified/limited.",
  evidence: {
    purchase_price_present: false,
    ltv_present: true,
  },
};

const expectedLimitedPlan = buildQaActionPlan({
  reportQaFlags: [limitedFinding],
  sourceReportCoverageQa: {
    qa_status: "pass",
    rendered_text_signals: ["acquisition_financing_readiness_limited"],
  },
});
const expectedLimitedAction = expectedLimitedPlan.prioritized_actions.find((action) => action.code === "ACQUISITION_FINANCING_FIELD_LIMITED");
assert.ok(expectedLimitedAction, "Expected financing-limited action missing");
assert.equal(expectedLimitedAction.action_type, "no_action_false_positive");
assert.equal(expectedLimitedAction.requires_code_patch, false);
assert.equal(expectedLimitedAction.requires_regeneration, false);
assert.equal(expectedLimitedAction.blocks_public_sample, false);
assert.equal(expectedLimitedAction.blocks_high_value_outreach, false);

const cautionPlan = buildQaActionPlan({
  reportQaFlags: [limitedFinding],
  sourceReportCoverageQa: {
    qa_status: "pass",
    rendered_text_signals: [],
  },
});
const cautionAction = cautionPlan.prioritized_actions.find((action) => action.code === "ACQUISITION_FINANCING_FIELD_LIMITED");
assert.ok(cautionAction, "Expected financing-limited caution action missing");
assert.equal(cautionAction.action_type, "source_document_limitation");
assert.equal(cautionAction.requires_code_patch, false);
assert.equal(cautionAction.requires_regeneration, false);
assert.equal(cautionAction.blocks_public_sample, true);
assert.equal(cautionAction.blocks_high_value_outreach, true);

console.log("acquisition-financing-field-limited smoke PASS");
