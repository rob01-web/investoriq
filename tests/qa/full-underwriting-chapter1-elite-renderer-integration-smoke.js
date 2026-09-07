import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";
import { renderFullUnderwritingChapter1EliteHtml, executiveDecisionState } from "../../api/_lib/full-underwriting-chapter1-elite-renderer.js";

function merge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return override === undefined ? base : override;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base?.[key] && typeof base[key] === "object" && !Array.isArray(base[key])) out[key] = merge(base[key], value);
    else out[key] = value;
  }
  return out;
}

function sourceTruthFixture(overrides = {}) {
  return merge({
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "job-elite-02b",
    property_name: "Riverstone Apartments",
    core_publishable: true,
    core: {
      t12: { artifact_id: "t12-artifact", file_id: "t12-file", accepted_facts: { gross_potential_rent: 1440000, effective_gross_income: 1320000, total_operating_expenses: 528000, net_operating_income: 792000 } },
      rent_roll: { artifact_id: "rr-artifact", file_id: "rr-file", accepted_facts: { total_units: 100, occupancy: 0.94, annual_in_place_rent: 1380000, annual_market_rent: 1500000 } },
    },
    support: { accepted: [], advisory: [] },
    source_reconciliation_state: { status: "aligned", t12_gpr: 1440000, rr_annual_in_place: 1440000, difference_amount: 0, variance_pct: 0, source_reconciliation_disclosure: null, source_selection: "canonical", t12_gpr_source: "t12.accepted", rr_annual_in_place_source: "rent_roll.accepted" },
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  }, overrides);
}

function financialIntelligenceFixture({ currentDscr = null, proposedDscr = null } = {}) {
  const calculationReceipts = [];
  for (const [calculationKey, result] of [["currentDebtDscr", currentDscr], ["proposedFinancingDscr", proposedDscr]]) {
    if (result == null) continue;
    calculationReceipts.push({ calculationKey, result, units: "ratio_x", formula: "accepted_noi_divided_by_annual_debt_service", inputProvenance: [{ source: "fixture", key: calculationKey }], inputs: { acceptedInput: 1 }, eligible: true, sectionDisplayReady: true, authority: { source: "canonical_institutional_financial_intelligence", authorityCreating: false, receiptOnly: true } });
  }
  return {
    source: "canonical_institutional_financial_intelligence",
    receiptVersion: 1,
    sourceTruthReceipt: { source: "canonical_source_truth_package", schemaVersion: 1, jobId: "job-elite-02b", corePublishable: true },
    policy: { authorityCreating: false, sourceTruthMutationAllowed: false, downstreamConsumeOnly: true, deterministicMathOnly: true, thresholdInferenceAllowed: false, scenarioInferenceAllowed: false },
    customerSections: { capitalPlanAnalysis: { displayReady: false, facts: {} } },
    calculationReceipts,
    reportPublicationBlocker: false,
  };
}

function purchaseSupport() {
  return { file_id: "purchase-file", canonical_role: "purchase_assumptions", primary_for_role: true, accepted_facts: { purchase_price: 12000000, going_in_cap_rate: 0.066, proposed_loan_amount: 7800000, ltv: 0.65 }, accepted_fact_evidence: { purchase_price: { source: "purchase-file", page: 1 }, going_in_cap_rate: { source: "purchase-file", page: 1 } } };
}

function build({ sourceTruth = {}, financialIntelligence = financialIntelligenceFixture() } = {}) {
  return buildFullUnderwritingChapter1EliteContract({
    sourceTruthPackage: sourceTruthFixture(sourceTruth),
    financialIntelligence,
    propertyProfile: { propertyName: "Riverstone Apartments", propertyAddress: "100 Main Street", assetClass: "Multifamily" },
  });
}

const baseline = build();
const baselineHtml = renderFullUnderwritingChapter1EliteHtml(baseline);
assert.match(baselineHtml, /data-iq-elite-chapter1="true"/);
assert.match(baselineHtml, /Investment Decision Snapshot/);
assert.match(baselineHtml, /Key Metrics Snapshot/);
assert.match(baselineHtml, /Riverstone Apartments/);
assert.match(baselineHtml, /100-Unit Multifamily/);
assert.match(baselineHtml, /Underwriting Observations/);
assert.match(baselineHtml, /data-iq-elite-metric="occupancy"/);
assert.match(baselineHtml, />94\.0%</);
assert.match(baselineHtml, /data-iq-elite-metric="noi"/);
assert.match(baselineHtml, />\$792,000</);
assert.match(baselineHtml, /Operating Cost Coverage Ratio/);
assert.doesNotMatch(baselineHtml, /data-iq-elite-metric="occupancyBreakEvenSpread"/);
assert.doesNotMatch(baselineHtml, /57\.3 pp/);
assert.doesNotMatch(baselineHtml, /RECONCILIATION REQUIRED/);

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
const reconciledHtml = renderFullUnderwritingChapter1EliteHtml(reconciled);
assert.equal(executiveDecisionState(reconciled.executiveInvestmentSummary.primaryConstraint), "SOURCE DIFFERENCE REQUIRES REVIEW");
assert.equal(reconciled.sourceReconciliationAlert.varianceRatio, -60000 / 1440000);
assert.match(reconciledHtml, /SOURCE DIFFERENCE REQUIRES REVIEW/);
assert.match(reconciledHtml, /data-iq-elite-signal="PRIMARY_SOURCE_RECONCILIATION_REQUIRED"/);
assert.doesNotMatch(reconciledHtml, /data-iq-elite-section="sourceReconciliationAlert"/);
assert.doesNotMatch(reconciledHtml, /Primary Source Reconciliation Alert|Source Difference Review/);
assert.doesNotMatch(reconciledHtml, /RECONCILIATION REQUIRED/);

const purchaseHtml = renderFullUnderwritingChapter1EliteHtml(build({ sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } } }));
assert.match(purchaseHtml, /data-iq-elite-metric="purchasePrice"/);
assert.match(purchaseHtml, />\$12,000,000</);
assert.match(purchaseHtml, /data-iq-elite-metric="pricePerUnit"/);
assert.match(purchaseHtml, />\$120,000</);
assert.match(purchaseHtml, /data-iq-elite-signal="PURCHASE_BASIS_ESTABLISHED"/);

const debtHtml = renderFullUnderwritingChapter1EliteHtml(build({
  sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } },
  financialIntelligence: financialIntelligenceFixture({ currentDscr: 0.92, proposedDscr: 1.18 }),
}));
assert.match(debtHtml, /data-iq-elite-metric="currentDebtDscr"/);
assert.match(debtHtml, />0\.92x</);
assert.match(debtHtml, /data-iq-elite-signal="CURRENT_DEBT_DSCR_BELOW_1X"/);

assert.equal(renderFullUnderwritingChapter1EliteHtml(null), "");
assert.equal(renderFullUnderwritingChapter1EliteHtml({ version: "wrong" }), "");

const here = path.dirname(fileURLToPath(import.meta.url));
const wrapperSource = fs.readFileSync(path.resolve(here, "../../api/_lib/full-underwriting-chapter1-elite-renderer.js"), "utf8");
const baseSource = fs.readFileSync(path.resolve(here, "../../api/_lib/full-underwriting-chapter1-elite-renderer-base.js"), "utf8");
for (const source of [wrapperSource, baseSource]) {
  for (const forbidden of ["t12Payload", "rentRollPayload", "mortgagePayload", "acquisitionTermsPayload", "loanTermSheetTermsPayload", "acquisitionMemoProjection"]) {
    assert.equal(source.includes(forbidden), false, `raw/governance input leaked into renderer: ${forbidden}`);
  }
}
for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "FINAL RECOMMENDATION"]) {
  const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
  assert.equal(regex.test(wrapperSource), false, `forbidden recommendation token leaked into public renderer: ${token}`);
}

console.log("PASS full-underwriting-chapter1-elite-renderer-integration-smoke");
