import assert from "node:assert/strict";
import { buildQaDirectorReview } from "../../api/_lib/qa-director-review.js";

const dscrFalsePositive = buildQaDirectorReview({
  html: "<p>Primary Pressure Point: DSCR of 1.06x constrains refinance capacity below standard lender coverage thresholds.</p>",
  renderedReportQa: {
    findings: [
      {
        issue: "DSCR is not clearly highlighted.",
        excerpt: "DSCR is not clearly highlighted.",
      },
    ],
  },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
});
assert.equal(dscrFalsePositive.overblocked_failure_classes.includes("dscr_highlight_false_positive"), true);
assert.equal(
  dscrFalsePositive.findings.some((finding) => finding.code === "QA_FALSE_POSITIVE_DSCR_HIGHLIGHT_ALREADY_PRESENT"),
  true
);

const unsupportedDisclosureFalsePositive = buildQaDirectorReview({
  html: "<p>Unsupported or unstructured uploads remain excluded from modeled outputs.</p>",
  qaManagerReview: {
    decisions: [
      {
        rationale: "unsupported docs are not clearly excluded",
      },
    ],
  },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
});
assert.equal(
  unsupportedDisclosureFalsePositive.findings.some((finding) => finding.code === "QA_FALSE_POSITIVE_UNSUPPORTED_DOCS_ALREADY_DISCLOSED"),
  true
);

const incompleteActionPlan = buildQaDirectorReview({
  html: "<p>Report body</p>",
  reportContractQa: {
    contract_status: "block",
    violations: [{ code: "HARD_PUBLIC_LANGUAGE_CONTRACT", severity: "critical", blocks_customer_delivery: true }],
  },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
});
assert.equal(incompleteActionPlan.overall_director_decision, "likely_missed_blocker");
assert.equal(incompleteActionPlan.missed_failure_classes.includes("critical_contract_not_reflected_in_action_plan"), true);

const missedBuy = buildQaDirectorReview({
  html: "<p>BUY this property.</p>",
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
});
assert.equal(missedBuy.missed_failure_classes.includes("hard_public_language_not_blocked"), true);
assert.equal(missedBuy.customer_delivery_risk, "critical");

const publicOutreachBlocked = buildQaDirectorReview({
  html: "<p>Report body</p>",
  qaActionPlan: {
    customer_delivery_ready: true,
    public_sample_ready: false,
    high_value_outreach_ready: false,
    prioritized_actions: [
      {
        code: "PARSER_ARTIFACT_REVIEW",
        severity: "high",
        blocks_public_sample: true,
        blocks_high_value_outreach: true,
      },
    ],
  },
});
assert.notEqual(publicOutreachBlocked.overall_director_decision, "no_missed_issue_detected");
assert.equal(
  publicOutreachBlocked.findings.some((finding) => finding.code === "QA_DIRECTOR_ACTION_PLAN_PUBLIC_OUTREACH_BLOCKER_PRESENT"),
  true
);

const reconciliationMismatch = buildQaDirectorReview({
  html: "<p>Report body</p>",
  reportContractQa: {
    violations: [{ code: "CURRENT_DEBT_DSCR_RECONCILIATION_MISMATCH" }],
  },
  qaActionPlan: { customer_delivery_ready: true, prioritized_actions: [] },
});
assert.notEqual(reconciliationMismatch.overall_director_decision, "no_missed_issue_detected");
assert.equal(
  reconciliationMismatch.findings.some((finding) => finding.code === "QA_DIRECTOR_RECONCILIATION_MISMATCH_PRESENT"),
  true
);

console.log("qa-director-review smoke PASS");
