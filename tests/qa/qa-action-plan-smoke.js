import assert from "node:assert/strict";
import { buildQaActionPlan } from "../../api/_lib/qa-action-plan.js";
import { buildQaFixRouting } from "../../api/_lib/qa-fix-routing.js";

const sourceReportCoverageQa = {
  deterministic_flags: [
    {
      code: "T12_LINE_ITEM_DETAIL_MISSING",
      severity: "medium",
      message: "T12 line-item detail did not reach the report.",
      evidence: { income_line_count: 0, expense_line_count: 0 },
    },
    {
      code: "PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT",
      severity: "high",
      message: "Purchase assumptions did not reach debt output.",
      evidence: {
        loan_term_sheet: {
          has_purchase_price: true,
          has_derived_acquisition_debt: true,
          has_balance: false,
          has_rate: true,
          has_amortization: true,
        },
      },
    },
    {
      code: "PUBLIC_SAMPLE_NOT_READY",
      severity: "high",
      message: "Rollup sample readiness flag.",
      evidence: {},
    },
  ],
};

const reportQaFlags = [
  {
    code: "DEBT_FILE_WITH_MISSING_BALANCE",
    severity: "high",
    message: "Debt file missing current balance.",
    evidence: {
      loan_term_sheet: {
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
      },
    },
  },
  {
    code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
    severity: "medium",
    message: "DSCR not assessed with debt context.",
    evidence: {
      loan_term_sheet: {
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
      },
    },
  },
  {
    code: "DOCRAPTOR_NOT_PRODUCTION_MODE",
    severity: "medium",
    message: "DocRaptor not production mode.",
    evidence: { docraptor_mode: "test" },
  },
];

const renderedReportQa = {
  findings: [
    {
      code: "RENDERED_DISPLAY_WARNING",
      severity: "medium",
      issue: "Vague Insufficient Data wording appears in final report.",
      excerpt: "Insufficient Data",
    },
  ],
};

const qaFixRouting = buildQaFixRouting({
  reportQaFlags,
  sourceReportCoverageQa,
  renderedReportQa,
  reportType: "underwriting",
  reportTier: 2,
});

const plan = buildQaActionPlan({
  reportQaFlags,
  sourceReportCoverageQa,
  renderedReportQa,
  qaFixRouting,
  reportType: "underwriting",
  reportTier: 2,
  jobId: "forest-city-action-plan-smoke",
  userId: "user-smoke",
  propertyName: "Forest City Manor",
});

const actionsByCode = Object.fromEntries(plan.prioritized_actions.map((action) => [action.code, action]));
const serialized = JSON.stringify(plan);

assert.equal(plan.event, "qa_action_plan");
assert.equal(plan.advisory_only, true);
assert.equal(plan.no_public_surface, true);
assert.equal(plan.public_sample_ready, false);
assert.equal(plan.high_value_outreach_ready, false);
assert.equal(plan.customer_delivery_ready, true);
assert.notEqual(plan.delivery_recommendation, "customer_deliverable");
assert.equal(actionsByCode.T12_LINE_ITEM_DETAIL_MISSING.action_type, "parser_fix_required");
assert.equal(
  ["render_gating_fix_required", "artifact_mapping_fix_required"].includes(
    actionsByCode.PURCHASE_ASSUMPTIONS_NOT_STRUCTURED_FOR_DEBT.action_type
  ),
  true
);
assert.equal(actionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type, "artifact_mapping_fix_required");
assert.equal(actionsByCode.DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT.action_type, "source_document_limitation");
assert.equal(actionsByCode.DOCRAPTOR_NOT_PRODUCTION_MODE.action_type, "production_config_only");
assert.equal(Boolean(actionsByCode.PUBLIC_SAMPLE_NOT_READY), false);
assert.equal(/OpenAI|LLM|vendor/i.test(serialized), false);

const sparseDebtFlagPlan = buildQaActionPlan({
  reportQaFlags: [
    {
      code: "DEBT_FILE_WITH_MISSING_BALANCE",
      severity: "high",
      message: "Debt file missing current balance.",
      evidence: { parse_warning: "missing_loan_amount" },
    },
    {
      code: "DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT",
      severity: "medium",
      message: "DSCR not assessed with debt context.",
      evidence: { has_debt_terms_payload: true },
    },
  ],
  sourceReportCoverageQa: {
    artifact_inventory: {
      loan_term_sheet_parsed: {
        present: true,
        has_purchase_price: true,
        has_derived_acquisition_debt: true,
        has_balance: false,
        has_rate: true,
        has_amortization: true,
      },
    },
    deterministic_flags: [],
  },
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
});

const sparseActionsByCode = Object.fromEntries(
  sparseDebtFlagPlan.prioritized_actions.map((action) => [action.code, action])
);

assert.notEqual(sparseActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type, "parser_fix_required");
assert.equal(
  ["artifact_mapping_fix_required", "render_gating_fix_required"].includes(
    sparseActionsByCode.DEBT_FILE_WITH_MISSING_BALANCE.action_type
  ),
  true
);
assert.equal(sparseActionsByCode.DSCR_NOT_ASSESSED_WITH_DEBT_CONTEXT.action_type, "source_document_limitation");

const cleanPlanWithoutRouting = buildQaActionPlan({
  reportQaFlags: [],
  sourceReportCoverageQa: null,
  renderedReportQa: { findings: [] },
  qaFixRouting: null,
});
assert.equal(cleanPlanWithoutRouting.public_sample_ready, true);

console.log("qa-action-plan smoke PASS");
console.log(plan.prioritized_actions.map((action) => `${action.code}:${action.action_type}`).join(", "));
