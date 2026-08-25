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
    support: {
      accepted: [],
      advisory: [],
    },
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
    core_input_sufficiency_state: {
      evidence: { core_source_mode: "dual_source_core" },
    },
  };
  return merge(base, overrides);
}

function financialIntelligenceFixture({ currentDscr = null, proposedDscr = null } = {}) {
  const receipts = [];
  const push = (calculationKey, result, units, formula) => {
    if (result === null || result === undefined) return;
    receipts.push({
      calculationKey,
      result,
      units,
      formula,
      formulaVersion: "test_v1",
      requiredInputs: ["accepted_input"],
      inputProvenance: [{ source: "fixture", key: calculationKey }],
      inputs: { acceptedInput: 1 },
      eligible: true,
      sectionDisplayReady: true,
      qualification: "Deterministic test receipt.",
      authority: {
        source: "canonical_institutional_financial_intelligence",
        authorityCreating: false,
        receiptOnly: true,
      },
    });
  };
  push("currentDebtDscr", currentDscr, "ratio_x", "accepted_noi_divided_by_current_debt_service");
  push("proposedFinancingDscr", proposedDscr, "ratio_x", "accepted_noi_divided_by_proposed_debt_service");
  return {
    source: "canonical_institutional_financial_intelligence",
    receiptVersion: 1,
    sourceTruthReceipt: {
      source: "canonical_source_truth_package",
      schemaVersion: 1,
      jobId: "job-elite-02a",
      corePublishable: true,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      downstreamConsumeOnly: true,
      deterministicMathOnly: true,
      thresholdInferenceAllowed: false,
      scenarioInferenceAllowed: false,
    },
    customerSections: {
      capitalPlanAnalysis: {
        displayReady: false,
        facts: {},
      },
    },
    calculationReceipts: receipts,
    reportPublicationBlocker: false,
  };
}

function merge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base?.[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      out[key] = merge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function purchaseSupport() {
  return {
    file_id: "purchase-file",
    canonical_role: "purchase_assumptions",
    primary_for_role: true,
    accepted_facts: {
      purchase_price: 12000000,
      going_in_cap_rate: 0.066,
      proposed_loan_amount: 7800000,
      ltv: 0.65,
    },
    accepted_fact_evidence: {
      purchase_price: { source: "purchase-file", page: 1 },
      going_in_cap_rate: { source: "purchase-file", page: 1 },
      proposed_loan_amount: { source: "purchase-file", page: 1 },
      ltv: { source: "purchase-file", page: 1 },
    },
  };
}

function currentDebtSupport() {
  return {
    file_id: "debt-file",
    canonical_role: "current_debt_context",
    primary_for_role: true,
    accepted_facts: {
      current_outstanding_balance: 6200000,
    },
    accepted_fact_evidence: {
      current_outstanding_balance: { source: "debt-file", page: 1 },
    },
  };
}

function build(args = {}) {
  return buildFullUnderwritingChapter1EliteContract({
    sourceTruthPackage: sourceTruthFixture(args.sourceTruth || {}),
    financialIntelligence: args.financialIntelligence === undefined ? financialIntelligenceFixture() : args.financialIntelligence,
    coreMetrics: args.coreMetrics || {},
    propertyProfile: {
      propertyName: "Riverstone Apartments",
      propertyAddress: "100 Main Street",
      assetClass: "Multifamily",
    },
  });
}

// 1. Dual-core aligned baseline.
{
  const contract = build();
  assert.equal(contract.version, FULL_UNDERWRITING_CHAPTER1_ELITE_CONTRACT_VERSION);
  assert.equal(contract.sourceTruthReceipt.coreSourceMode, "dual_source_core");
  assert.equal(contract.sourceReconciliationAlert.disposition, "omit");
  assert.equal(contract.metrics.units.value, 100);
  assert.equal(contract.metrics.noi.value, 792000);
  assert.equal(contract.metrics.expenseRatio.value, 0.4);
  assert.equal(contract.metrics.noiMargin.value, 0.6);
  assert.equal(contract.metrics.breakEvenOccupancy.value, 528000 / 1440000);
  assert.equal(contract.metrics.occupancyBreakEvenSpread.value, 0.94 - 528000 / 1440000);
  assert.equal(contract.sectionDispositions.executiveInvestmentSummary.classification, "core_required");
  assert.notEqual(contract.sectionDispositions.executiveInvestmentSummary.disposition, "collapse");
  assert.notEqual(contract.sectionDispositions.executiveInvestmentSummary.disposition, "omit");
}

// 2. Material canonical reconciliation is elevated without inventing a cause.
{
  const contract = build({
    sourceTruth: {
      source_reconciliation_state: {
        status: "source_reconciliation_required",
        t12_gpr: 1440000,
        rr_annual_in_place: 1380000,
        difference_amount: -60000,
        variance_pct: -60000 / 1440000,
        source_reconciliation_disclosure: "InvestorIQ has not reconciled this variance and does not infer the cause.",
        source_selection: "canonical",
        t12_gpr_source: "t12.accepted",
        rr_annual_in_place_source: "rent_roll.accepted",
      },
    },
  });
  assert.equal(contract.sourceReconciliationAlert.displayReady, true);
  assert.equal(contract.sourceReconciliationAlert.disposition, "include");
  assert.equal(contract.principalRisksAndConstraints.items[0].code, "PRIMARY_SOURCE_RECONCILIATION_REQUIRED");
  assert.equal(contract.executiveInvestmentSummary.primaryConstraint.code, "PRIMARY_SOURCE_RECONCILIATION_REQUIRED");
  assert.equal(contract.investorQuestions.items[0].code, "RECONCILE_T12_RENT_ROLL_VARIANCE");
}

// 3. No financing support remains publishable and does not fabricate DSCR.
{
  const contract = build();
  assert.equal(contract.metrics.currentDebtDscr.displayReady, false);
  assert.equal(contract.metrics.proposedFinancingDscr.displayReady, false);
  assert.equal(contract.executiveInvestmentSummary.financingPosition.length, 0);
  assert.equal(contract.authority.deliveryAuthority, false);
  assert.equal(contract.authority.publicationAuthority, false);
}

// 4. Accepted purchase assumptions become source-backed transaction/value context.
{
  const contract = build({
    sourceTruth: {
      support: {
        accepted: [purchaseSupport()],
        advisory: [],
      },
    },
  });
  assert.equal(contract.metrics.purchasePrice.value, 12000000);
  assert.equal(contract.metrics.purchasePrice.evidenceClass, "source_backed");
  assert.equal(contract.metrics.pricePerUnit.value, 120000);
  assert.equal(contract.metrics.goingInCapRate.value, 0.066);
  assert.equal(contract.metrics.noiToPurchasePriceCapRate.value, 792000 / 12000000);
  assert.ok(contract.investmentCase.valueSignals.some((item) => item.code === "PURCHASE_BASIS_ESTABLISHED"));
  assert.ok(!contract.investorQuestions.items.some((item) => item.code === "ESTABLISH_ACQUISITION_BASIS"));
}

// 5. Eligible canonical DSCR is consumed; below 1.00x is a mathematical constraint, not a policy grade.
{
  const contract = build({
    sourceTruth: {
      support: {
        accepted: [purchaseSupport(), currentDebtSupport()],
        advisory: [],
      },
    },
    financialIntelligence: financialIntelligenceFixture({ currentDscr: 0.92, proposedDscr: 1.18 }),
  });
  assert.equal(contract.metrics.currentDebtDscr.value, 0.92);
  assert.equal(contract.metrics.proposedFinancingDscr.value, 1.18);
  assert.ok(contract.principalRisksAndConstraints.items.some((item) => item.code === "CURRENT_DEBT_DSCR_BELOW_1X"));
  assert.ok(contract.investmentCase.financingSignals.some((item) => item.code === "PROPOSED_FINANCING_DSCR_ESTABLISHED"));
}

// 6. Source-present but non-authority-accepted debt context stays non-quantitative and triggers diligence only.
{
  const contract = build({
    sourceTruth: {
      support: {
        accepted: [],
        advisory: [
          {
            file_id: "unaccepted-debt-file",
            status: "ambiguous",
            authority_decision: { canonicalRole: "current_debt_context" },
          },
        ],
      },
    },
  });
  assert.equal(contract.metrics.currentDebtBalance.displayReady, false);
  assert.ok(contract.investorQuestions.items.some((item) => item.code === "DEBT_COVERAGE_INPUTS_INCOMPLETE"));
}

// 7. Optional support absence collapses/omits optional decision surfaces cleanly; no broken empty risk claim.
{
  const contract = build({
    sourceTruth: {
      core: {
        rent_roll: {
          artifact_id: "rr-artifact",
          file_id: "rr-file",
          accepted_facts: {
            total_units: 100,
            occupancy: 0.5,
            annual_in_place_rent: 1380000,
          },
        },
      },
    },
    coreMetrics: {},
  });
  assert.ok(["include", "include_qualified", "collapse"].includes(contract.investmentCase.disposition));
  assert.notEqual(contract.sectionDispositions.executiveInvestmentSummary.disposition, "omit");
  assert.notEqual(contract.sectionDispositions.keyMetricsSnapshot.disposition, "omit");
}

// 8. Forbidden recommendation/scenario leakage cannot appear in the contract.
{
  const contract = build({
    sourceTruth: {
      support: {
        accepted: [purchaseSupport()],
        advisory: [],
      },
    },
  });
  const serialized = JSON.stringify(contract);
  for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "final recommendation"]) {
    const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
    assert.equal(regex.test(serialized), false, `forbidden token leaked: ${token}`);
  }
  assert.equal(contract.authority.scenarioAuthority, false);
  assert.equal(contract.authority.investmentRecommendationAllowed, false);
}

// 9. Disposition contract: core surfaces survive; reconciliation optional surface omits when aligned.
{
  const contract = build();
  assert.equal(contract.sectionDispositions.executiveInvestmentSummary.version, "section-disposition-contract-v1");
  assert.equal(contract.sectionDispositions.keyMetricsSnapshot.classification, "core_required");
  assert.equal(contract.sectionDispositions.sourceReconciliationAlert.classification, "optional");
  assert.equal(contract.sectionDispositions.sourceReconciliationAlert.disposition, "omit");
}

// 10. Provenance survives into source and deterministic calculation receipts.
{
  const contract = build({
    sourceTruth: {
      support: {
        accepted: [purchaseSupport(), currentDebtSupport()],
        advisory: [],
      },
    },
    financialIntelligence: financialIntelligenceFixture({ currentDscr: 1.1 }),
  });
  assert.ok(contract.metrics.noi.provenance.length > 0);
  assert.ok(contract.metrics.purchasePrice.provenance.length > 0);
  assert.equal(contract.metrics.currentDebtDscr.calculationReceiptKey, "currentDebtDscr");
  assert.ok(contract.metrics.currentDebtDscr.provenance.length > 0);
  assert.ok(contract.provenance.calculationReceiptsUsed.includes("currentDebtDscr"));
}

// 11. Survivor-lane inputs do not force an ELITE report-surface failure.
{
  const contract = build({
    sourceTruth: {
      core: { rent_roll: null },
      core_input_sufficiency_state: { evidence: { core_source_mode: "t12_minimum_core" } },
      source_reconciliation_state: { status: "insufficient_inputs" },
    },
  });
  assert.equal(contract.sourceTruthReceipt.coreSourceMode, "t12_minimum_core");
  assert.equal(contract.sectionDispositions.executiveInvestmentSummary.classification, "core_required");
  assert.notEqual(contract.sectionDispositions.executiveInvestmentSummary.disposition, "omit");
}

// 12. Canonical authority guards fail closed.
{
  assert.throws(
    () => buildFullUnderwritingChapter1EliteContract({ sourceTruthPackage: { source: "wrong" } }),
    /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_ELITE_CHAPTER1/
  );
  const sourceTruth = sourceTruthFixture();
  const contract = buildFullUnderwritingChapter1EliteContract({
    sourceTruthPackage: sourceTruth,
    financialIntelligence: {
      ...financialIntelligenceFixture(),
      sourceTruthReceipt: { source: "canonical_source_truth_package", jobId: "wrong-job" },
    },
  });
  assert.equal(contract.authorityDiagnostics.invalidFinancialIntelligenceIgnored, true);
  assert.equal(contract.metrics.currentDebtDscr.displayReady, false);
}

// 13. Returned contract is immutable.
{
  const contract = build();
  assert.equal(Object.isFrozen(contract), true);
  assert.equal(Object.isFrozen(contract.metrics), true);
  assert.equal(Object.isFrozen(contract.metrics.noi), true);
}

console.log("PASS full-underwriting-chapter1-elite-contract-smoke (13/13)");
