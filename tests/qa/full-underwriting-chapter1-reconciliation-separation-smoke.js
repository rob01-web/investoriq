import assert from "node:assert/strict";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";

const sourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  job_id: "chapter1-reconciliation-separation",
  property_name: "Reconciliation House",
  core_publishable: true,
  core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  source_reconciliation_state: {
    status: "source_reconciliation_required",
    t12_gpr: 1612800,
    rr_annual_in_place: 1432800,
    difference_amount: 180000,
    variance_pct: 180000 / 1612800,
    source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  },
  core: {
    t12: {
      file_id: "t12-file",
      artifact_id: "t12-artifact",
      accepted_facts: {
        gross_potential_rent: 1612800,
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
        expense_lines: [
          { label: "Property Taxes", amount: 185000 },
          { label: "Insurance", amount: 72000 },
          { label: "Repairs & Maintenance", amount: 104000 },
          { label: "Utilities", amount: 86000 },
          { label: "Property Management", amount: 60000 },
          { label: "Payroll / Admin", amount: 28000 },
        ],
      },
    },
    rent_roll: {
      file_id: "rr-file",
      artifact_id: "rr-artifact",
      accepted_facts: {
        total_units: 64,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        annual_market_rent: 1718400,
      },
    },
  },
  support: { accepted: [], advisory: [], rejected: [] },
};

const contract = buildFullUnderwritingChapter1EliteContract({ sourceTruthPackage });
const risks = contract.principalRisksAndConstraints.items || [];
const riskCodes = risks.map((item) => item.code);
assert.ok(riskCodes.includes("PRIMARY_SOURCE_RECONCILIATION_REQUIRED"), "cross-source rent reconciliation remains explicit");
assert.ok(riskCodes.includes("T12_EXPENSE_LINE_RECONCILIATION_REQUIRED"), "T12 expense-line reconciliation is a separate issue");
assert.equal(riskCodes.filter((code) => code === "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED").length, 1);

const expenseRisk = risks.find((item) => item.code === "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED");
assert.match(expenseRisk.statement, /\$555,000/);
assert.match(expenseRisk.statement, /\$535,000/);
assert.match(expenseRisk.statement, /\$20,000/);
assert.match(expenseRisk.investorImpact, /accepted T12 total remains the calculation basis/i);
assert.match(expenseRisk.followUp, /does not infer the cause/i);

assert.equal(contract.executiveInvestmentSummary.primaryConstraint.code, "PRIMARY_SOURCE_RECONCILIATION_REQUIRED", "primary cross-source reconciliation retains priority");
const unresolvedCodes = contract.executiveInvestmentSummary.unresolvedDiligence.map((item) => item.code);
assert.ok(unresolvedCodes.includes("RECONCILE_T12_RENT_ROLL_VARIANCE"));
assert.ok(unresolvedCodes.includes("RECONCILE_T12_EXPENSE_LINES"));

assert.equal(contract.metrics.breakEvenOccupancy.label, "Operating Cost Coverage Ratio");
assert.match(contract.metrics.breakEvenOccupancy.qualification, /operating expenses \/ accepted T12 gross potential rent/i);
assert.equal(contract.metrics.occupancyBreakEvenSpread.displayReady, false);
assert.equal(contract.metrics.occupancyBreakEvenSpread.value, null);
const decisionCodes = [
  ...(contract.investmentCase.opportunitySignals || []),
  ...(contract.investmentCase.constraintSignals || []),
  ...(contract.principalRisksAndConstraints.items || []),
].map((item) => item.code);
assert.equal(decisionCodes.includes("OCCUPANCY_ABOVE_BREAK_EVEN"), false);
assert.equal(decisionCodes.includes("OCCUPANCY_BELOW_BREAK_EVEN"), false);

assert.doesNotMatch(JSON.stringify(contract), /[—–]/, "customer-bound contract text uses publication-safe punctuation");
console.log("PASS full-underwriting-chapter1-reconciliation-separation-smoke");
