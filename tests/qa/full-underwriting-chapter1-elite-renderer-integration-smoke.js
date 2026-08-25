import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildFullUnderwritingChapter1EliteContract } from "../../api/_lib/full-underwriting-chapter1-elite-contract.js";
import { renderFullUnderwritingChapter1EliteHtml } from "../../api/_lib/full-underwriting-chapter1-elite-renderer.js";

function merge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) {
    return override === undefined ? base : override;
  }
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

function sourceTruthFixture(overrides = {}) {
  return merge({
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "job-elite-02b",
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
  }, overrides);
}

function financialIntelligenceFixture({ currentDscr = null, proposedDscr = null } = {}) {
  const calculationReceipts = [];
  for (const [calculationKey, result, formula] of [
    ["currentDebtDscr", currentDscr, "accepted_noi_divided_by_current_debt_service"],
    ["proposedFinancingDscr", proposedDscr, "accepted_noi_divided_by_proposed_debt_service"],
  ]) {
    if (result === null || result === undefined) continue;
    calculationReceipts.push({
      calculationKey,
      result,
      units: "ratio_x",
      formula,
      formulaVersion: "test_v1",
      requiredInputs: ["accepted_input"],
      inputProvenance: [{ source: "fixture", key: calculationKey }],
      inputs: { acceptedInput: 1 },
      eligible: true,
      sectionDisplayReady: true,
      authority: {
        source: "canonical_institutional_financial_intelligence",
        authorityCreating: false,
        receiptOnly: true,
      },
    });
  }
  return {
    source: "canonical_institutional_financial_intelligence",
    receiptVersion: 1,
    sourceTruthReceipt: {
      source: "canonical_source_truth_package",
      schemaVersion: 1,
      jobId: "job-elite-02b",
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

function build({ sourceTruth = {}, financialIntelligence = financialIntelligenceFixture(), propertyName = "Riverstone Apartments" } = {}) {
  return buildFullUnderwritingChapter1EliteContract({
    sourceTruthPackage: sourceTruthFixture(sourceTruth),
    financialIntelligence,
    propertyProfile: {
      propertyName,
      propertyAddress: "100 Main Street",
      assetClass: "Multifamily",
    },
  });
}

// 1. Full governed Chapter 1 renders the new institutional surfaces.
{
  const html = renderFullUnderwritingChapter1EliteHtml(build());
  assert.match(html, /data-iq-elite-chapter1="true"/);
  assert.match(html, /Executive Investment Summary/);
  assert.match(html, /Key Metrics Snapshot/);
  assert.match(html, /data-iq-elite10b2="investment-committee-opening-v1"/);
  assert.match(html, /Riverstone Apartments/);
  assert.match(html, /class="iq-ic-asset-descriptor">100-Unit Multifamily/);
  assert.match(html, /Committee Focus/);
  assert.match(html, /Underwriting Observations/);
  assert.doesNotMatch(html, /Key Investor Questions/);
}

// 2. Key metrics are contract-fed and formatted without renderer-side underwriting math.
{
  const html = renderFullUnderwritingChapter1EliteHtml(build());
  assert.match(html, /data-iq-elite-metric="occupancy"/);
  assert.match(html, />94\.0%</);
  assert.match(html, /data-iq-elite-metric="noi"/);
  assert.match(html, />\$792,000</);
  assert.match(html, /data-iq-elite-metric="occupancyBreakEvenSpread"/);
  assert.match(html, />57\.3 pp</);
}

// 3. Aligned primary sources omit the optional reconciliation alert.
{
  const html = renderFullUnderwritingChapter1EliteHtml(build());
  assert.doesNotMatch(html, /Primary Source Reconciliation Alert/);
  assert.doesNotMatch(html, /data-iq-elite-section="sourceReconciliationAlert"/);
}

// 4. Material canonical reconciliation renders exact governed values and disclosure.
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
  const html = renderFullUnderwritingChapter1EliteHtml(contract);
  assert.match(html, /Primary Source Reconciliation Alert/);
  assert.match(html, /\(\$60,000\)/);
  assert.match(html, /-4\.17%/);
  assert.match(html, /does not infer the cause/);
  assert.doesNotMatch(html, /Principal Risks &amp; Constraints/);
  assert.match(html, /data-iq-elite-primary-constraint="PRIMARY_SOURCE_RECONCILIATION_REQUIRED"/);
}

// 5. Accepted purchase assumptions surface transaction/value context without assumptions.
{
  const html = renderFullUnderwritingChapter1EliteHtml(build({
    sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } },
  }));
  assert.match(html, /data-iq-elite-metric="purchasePrice"/);
  assert.match(html, />\$12,000,000</);
  assert.match(html, /data-iq-elite-metric="pricePerUnit"/);
  assert.match(html, />\$120,000</);
  assert.match(html, /data-iq-elite-signal="PURCHASE_BASIS_ESTABLISHED"/);
}

// 6. Eligible DSCR receipts render as deterministic coverage facts only.
{
  const html = renderFullUnderwritingChapter1EliteHtml(build({
    sourceTruth: { support: { accepted: [purchaseSupport()], advisory: [] } },
    financialIntelligence: financialIntelligenceFixture({ currentDscr: 0.92, proposedDscr: 1.18 }),
  }));
  assert.match(html, /data-iq-elite-metric="currentDebtDscr"/);
  assert.match(html, />0\.92x</);
  assert.match(html, /data-iq-elite-primary-constraint="CURRENT_DEBT_DSCR_BELOW_1X"/);
  assert.match(html, /below 1\.00x/);
  const visibleText = html.replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(visibleText, /\b(?:safe|strong|weak)\b|institutional threshold/i);
}

// 7. Hidden dispositions do not leave empty section shells.
{
  const contract = build();
  assert.equal(contract.principalRisksAndConstraints.disposition, "collapse");
  const html = renderFullUnderwritingChapter1EliteHtml(contract);
  assert.doesNotMatch(html, /data-iq-elite-section="principalRisksAndConstraints"/);
}

// 8. Customer-facing strings are HTML escaped.
{
  const base = build();
  const contract = {
    ...base,
    executiveInvestmentSummary: {
      ...base.executiveInvestmentSummary,
      assetStatement: "100-Unit <script>alert(1)</script>",
    },
  };
  const html = renderFullUnderwritingChapter1EliteHtml(contract);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
}

// 9. Wrong/missing contract versions fail closed to empty HTML so the document renderer can use its legacy fallback.
{
  assert.equal(renderFullUnderwritingChapter1EliteHtml(null), "");
  assert.equal(renderFullUnderwritingChapter1EliteHtml({ version: "wrong" }), "");
}

// 10. Integration source remains a dumb renderer: no raw report/parser/projection inputs and no recommendation language.
{
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rendererSource = fs.readFileSync(path.resolve(here, "../../api/_lib/full-underwriting-chapter1-elite-renderer.js"), "utf8");
  for (const forbidden of ["t12Payload", "rentRollPayload", "mortgagePayload", "acquisitionTermsPayload", "loanTermSheetTermsPayload", "acquisitionMemoProjection"]) {
    assert.equal(rendererSource.includes(forbidden), false, `raw/governance input leaked into renderer: ${forbidden}`);
  }
  for (const token of ["BUY", "SELL", "HOLD", "IRR", "MOIC", "FINAL RECOMMENDATION"]) {
    const regex = new RegExp(`(?:^|[^A-Z])${token}(?:[^A-Z]|$)`, "i");
    assert.equal(regex.test(rendererSource), false, `forbidden recommendation token leaked into renderer: ${token}`);
  }
}

console.log("PASS full-underwriting-chapter1-elite-renderer-integration-smoke (10/10)");
