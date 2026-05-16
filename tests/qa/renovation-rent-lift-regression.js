import assert from "node:assert/strict";

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "test";

const { validateRenovationCandidate } = await import("../../lib/ai-support-doc-recovery.js");
const { __test__: reportTestHelpers } = await import("../../api/generate-client-report.js");

const formatCurrency = (value) => `$${Number(value).toLocaleString("en-US")}`;

const sourceText = [
  "1BR interior scope: 10 units at $12,000 per unit with expected monthly rent lift of $175. Phase 1 Q3 2026.",
  "2BR interior scope: 8 units at $14,000 per unit with expected monthly rent lift of $225. Phase 2 Q4 2026.",
  "Common area lighting scope: 1 project at $20,000 with expected monthly rent lift of $0. Phase 1 Q3 2026.",
  "Total forward-looking renovation budget: $252,000.",
].join("\n");

const candidate = {
  is_renovation_capex: true,
  confidence: 0.92,
  total_budget: 252000,
  budget_rows: [
    {
      category: "Interior Renovation - 1BR",
      scope_of_work: "1BR interior scope",
      unit_type: "1BR",
      unit_count: 10,
      cost_per_unit: 12000,
      estimated_cost: 120000,
      expected_monthly_rent_lift: 175,
      phase_timing: "Phase 1 Q3 2026",
      evidence: ["1BR interior scope: 10 units at $12,000 per unit with expected monthly rent lift of $175. Phase 1 Q3 2026."],
    },
    {
      category: "Interior Renovation - 2BR",
      scope_of_work: "2BR interior scope",
      unit_type: "2BR",
      unit_count: 8,
      cost_per_unit: 14000,
      estimated_cost: 112000,
      expected_monthly_rent_lift: 225,
      phase_timing: "Phase 2 Q4 2026",
      evidence: ["2BR interior scope: 8 units at $14,000 per unit with expected monthly rent lift of $225. Phase 2 Q4 2026."],
    },
    {
      category: "Common Area",
      scope_of_work: "Common area lighting scope",
      unit_type: "Common Area",
      unit_count: 1,
      cost_per_unit: 20000,
      estimated_cost: 20000,
      expected_monthly_rent_lift: 0,
      phase_timing: "Phase 1 Q3 2026",
      evidence: ["Common area lighting scope: 1 project at $20,000 with expected monthly rent lift of $0. Phase 1 Q3 2026."],
    },
  ],
  unit_count: null,
  per_unit_cost: null,
  timing_or_phasing: "Phase 1 Q3 2026 to Phase 2 Q4 2026",
  rent_lift: null,
  roi: null,
  payback_period: null,
  evidence: {
    total_budget: ["Total forward-looking renovation budget: $252,000."],
    budget_rows: [],
    unit_count: [],
    per_unit_cost: [],
    timing_or_phasing: ["Phase 1 Q3 2026"],
    rent_lift: [],
    roi: [],
    payback_period: [],
    warnings: [],
  },
};

const validated = validateRenovationCandidate(candidate, sourceText);
assert.ok(validated, "Expected renovation candidate to validate");
assert.equal(validated.budget_rows.length, 3);
assert.equal(validated.budget_rows[0].expected_monthly_rent_lift, 175);
assert.equal(validated.budget_rows[1].expected_monthly_rent_lift, 225);
assert.equal(validated.budget_rows[2].expected_monthly_rent_lift, 0);

const displayMode = reportTestHelpers.resolveRenovationDisplayMode({
  renovationPayload: validated,
  financials: {},
  hasForwardLookingRenovationInputs: false,
  documentSources: [],
});
assert.equal(displayMode, "forward_looking_with_rent_lift");

const displayCopy = reportTestHelpers.buildHistoricalCapexDisplayCopy({
  renovationDisplayMode: displayMode,
});
assert.match(displayCopy.execution_note, /ROI, payback, and cost recovery are not modeled/i);

const budgetCard = reportTestHelpers.buildRenovationBudgetCardHtml(
  validated.budget_rows,
  formatCurrency,
  displayCopy.budget_note
);
assert.match(budgetCard, /Expected Monthly Rent Lift \(Document-Stated\)/i);
assert.match(budgetCard, /Gross Annual Rent-Lift Potential \(Document-Stated\)/i);
assert.match(budgetCard, /\$21,000/i);
assert.match(budgetCard, /\$21,600/i);
assert.equal(/\bNOI\b|\bROI\b|payback/i.test(budgetCard), false);

const budgetOnlyMode = reportTestHelpers.resolveRenovationDisplayMode({
  renovationPayload: {
    total_budget: 50000,
    budget_rows: [{ category: "Common Area Paint", estimated_cost: 50000, scope_of_work: "Paint" }],
  },
  financials: {},
  hasForwardLookingRenovationInputs: false,
  documentSources: [],
});
assert.equal(budgetOnlyMode, "budget_only_no_roi");

console.log("renovation rent-lift regression PASS");
