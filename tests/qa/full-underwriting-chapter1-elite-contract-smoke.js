import assert from "node:assert/strict";
import {
  buildFullUnderwritingChapter1EliteContract,
  FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION,
} from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";

function sourceTruthFixture(overrides = {}) {
  const base = {
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "job-elite-02a",
    property_name: "Riverstone Apartments",
    core_publishable: true,
    core: {
      t12: {
        artifact_id: "t12-artifact",
        file_id: "t12-file",
        accepted_facts: {
          gross_potential_rent: 1440000,
          effective_gross_income: 1320000,
          total_operating_expenses: 528000,
          net_operating_income: 792000,
          expense_lines: [
            { label: "Taxes", amount: 180000 },
            { label: "Insurance", amount: 68000 },
            { label: "Repairs", amount: 90000 },
            { label: "Utilities", amount: 80000 },
            { label: "Management", amount: 72000 },
            { label: "Admin", amount: 38000 },
          ],
        },
      },
      rent_roll: {
        artifact_id: "rr-artifact",
        file_id: "rr-file",
        accepted_facts: {
          total_units: 100,
          occupancy: 0.94,
          annual_in_place_rent: 1380000,
          annual_market_rent: 1500000,
        },
      },
    },
    support: { accepted: [], advisory: [] },
    source_reconciliation_state: {
      status: "aligned",
      t12_gpr: 1440000,
      rr_annual_in_place: 1440000,
      difference_amount: 0,
      variance_pct: 0,
      source_reconciliation_disclosure: null,
      source_selection: "canonical",
      t12_gpr_source: "t12.accepted",
      rr_annual_in_place_source: "rent_roll.accepted",
    },
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  };
  return merge(base, overrides);
}

function merge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base?.[key] && typeof base[key] === "object" && !Array.isArray(base[key])) out[key] = merge(base[key], value);
    else out[key] = value;
  }
  return out;
}

function financialIntelligenceFixture({ currentDscr = null, proposedDscr = null } = {}) {
  const calculationReceipts = [];
  for (const [calculationKey, result] of [["currentDebtDscr", currentDscr], ["proposedFinancingDscr", proposedDscr]]) {
    if (result == null) continue;
    calculationReceipts.push({
      calculationKey,
      result,
      units: "ratio_x",
      formula: "accepted_noi_divided_by_annual_debt_service",
      inputProvenance: [{ source: "fixture", key: calculationKey }],
      inputs: { acceptedInput: 1 },
      eligible: true,
      sectionDisplayReady: true,
      authority: { source: "canonical_institutional_financial_intelligence", authorityCreating: false, receiptOnly: true },
    });
  }
  return {
    source: "canonical_institutional_financial_intelligence",
    receiptVersion: 1,
    sourceTruthReceipt: { source: "canonical_source_truth_package", schemaVersion: 1, jobId: "job-elite-02a", corePublishable: true },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      downstreamConsumeOnly: true,
      deterministicMathOnly: true,
      thresholdInferenceAllowed: false,
      scenarioInferenceAllowed: false,
    },
    customerSections: { capitalPlanAnalysis: { displayReady: false, facts: {} } },
    calculationReceipts,
    reportPublicationBlocker: false,
  };
}

function purchaseSupport() {
  return {
    file_id: "purchase-file",
    canonical_role: "purchase_assumptions",
    primary_for_role: true,
    accepted_facts: { purchase_price: 12000000, going_in_cap_rate: 0.066, proposed_loan_amount: 7800000, ltv: 0.65 },
    accepted_fact_evidence: { purchase_price: { source: "purchase-file", page: 1 }, going_in_cap_rate: { source: "purchase-file", page: 1 } },
  };
}

function build({ sourceTruth = {}, financialIntelligence = financialIntelligenceFixture() } = {}) {
  return buildFullUnderwritingChapter1EliteContract({
    sourceTruthPackage: sourceTruthFixture(sourceTruth),
    financialIntelligence,
    propertyProfile: { propertyName: "Riverstone Apartments", propertyAddress: "100 Main Street", assetClass: "Multifamily" },
  });
}

const baseline = build();
assert.equal(baseline.version, FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION);
assert.equal(baseline.sourceTruthReceipt.coreSourceMode, "dual_source_core");
assert.equal(baseline.metrics.noi.value, 792000);
assert.equal(baseline.metrics.expenseRatio.value, 0.4);
assert.equal(baseline.metrics.noiMargin.value, 0.6);
assert.equal(baseline.metrics.breakEvenOccupancy.value, 528000 / 1440000, "underlying formula remains unchanged");
assert.equal(baseline.metrics.breakEvenOccupancy.label, "Operating Cost Coverage Ratio");
assert.match(baseline.metrics.breakEvenOccupancy.qualification, /operating expenses \/ accepted T12 gross potential rent/i);
assert.equal(baseline.metrics.occupancyBreakEvenSpread.displayReady, false);
assert.equal(baseline.metrics.occupancyBreakEvenSpread.value, null);
assert.equal((baseline.investmentCase.opportunitySignals || []).some((item) => item.code === "OCCUPANCY_ABOVE_BREAK_EVEN"), false);
assert.equal((baseline.principalRisksAndConstraints.items || []).some((item) => item.code === "OCCUPANCY_BELOW_BREAK_EVEN"), false);

const reconciled = build({ sourceTruth: { source_reconciliation_state: {
  status: "source_reconciliation_required",
  t12_gpr: 1440000,
  rr_annual_in_place: 1380000,
  difference_amount: -60000,
  variance_pct: -60000 / 1440000,
  source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
  source_selection: "canonical",
  t12_gpr_source: "t12.accepted",
  rr_annual_in_place_source: "rent_roll.accepted",
} } });
assert.equal(reconciled.sourceReconciliationAlert.displayReady, true);
assert.equal(reconciled.executiveInvestmentSummary.primaryConstraint.code, "PRIMARY_SOURCE_RECONCILIATION_REQUIRED");
assert.ok(reconciled.investorQuestions.items.some((item) => item.code === "RECONCILE_T12_RENT_ROLL_VARIANCE"));

const expenseMismatch = build({ sourceTruth: { core: { t12: { accepted_facts: {
  gross_potential_rent: 1440000,
  effective_gross_income: 1320000,
  total_operating_expenses: 528000,
  net_operating_income: 792000,
  expense_lines: [{ label: "Taxes", amount: 500000 }],
} } } } });
assert.ok(expenseMismatch.principalRisksAndConstraints.items.some((item) => item.code === "T12_EXPENSE_LINE_RECONCILIATION_REQUIRED"));
assert.ok(expenseMismatch.investorQuestions.items.some((item) => item.code === "RECONCILE_T12_EXPENSE_LINES"));

const purchase = build({ sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } } });
assert.equal(purchase.metrics.purchasePrice.value, 12000000);
assert.equal(purchase.metrics.purchasePrice.evidenceClass, "source_backed");
assert.equal(purchase.metrics.pricePerUnit.value, 120000);
assert.equal(purchase.metrics.goingInCapRate.value, 0.066);
assert.ok(purchase.investmentCase.valueSignals.some((item) => item.code === "PURCHASE_BASIS_ESTABLISHED"));

const debt = build({ sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } }, financialIntelligence: financialIntelligenceFixture({ currentDscr: 0.92, proposedDscr: 1.18 }) });
assert.equal(debt.metrics.currentDebtDscr.value, 0.92);
assert.equal(debt.metrics.proposedFinancingDscr.value, 1.18);
assert.ok(debt.principalRisksAndConstraints.items.some((item) => item.code === "CURRENT_DEBT_DSCR_BELOW_1X"));

assert.equal(baseline.authority.authorityCreating, false);
assert.equal(baseline.authority.sourceTruthMutationAllowed, false);
assert.equal(baseline.authority.scenarioAuthority, false);
assert.equal(baseline.authority.investmentRecommendationAllowed, false);
assert.equal(Object.isFrozen(baseline), true);
assert.equal(Object.isFrozen(baseline.metrics), true);
assert.throws(() => buildFullUnderwritingChapter1EliteContract({ sourceTruthPackage: { source: "wrong" } }), /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_ELITE_CHAPTER1/);

for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "final recommendation"]) {
  const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
  assert.equal(regex.test(JSON.stringify(baseline)), false, `forbidden token leaked: ${token}`);
}

console.log("PASS full-underwriting-chapter1-elite-contract-smoke");
