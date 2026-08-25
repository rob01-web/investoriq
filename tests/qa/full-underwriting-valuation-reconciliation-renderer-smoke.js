import assert from "node:assert/strict";
import { buildFullUnderwritingValuationReconciliationV1 } from "../../api/_lib/full-underwriting-valuation-reconciliation-v1.js";
import { renderFullUnderwritingValuationReconciliation } from "../../api/_lib/full-underwriting-valuation-reconciliation-renderer.js";

let assertions = 0;
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}
function equal(actual, expected, message) {
  assertions += 1;
  assert.equal(actual, expected, message);
}

const model = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, units: 100, goingInCapRate: 0.06, purchasePrice: 9500000 },
  customerSurfaceModel: {
    valueSemantics: { wholePropertyValue: { noi: 600000, goingInCapRate: 0.06, purchasePrice: 9500000 } },
    sourceBackedFacts: { unitMix: { total_units: 100 } },
    sections: {
      acquisitionRequestContext: { factAvailability: { sourceBacked: true }, facts: { purchase_price: 9500000, going_in_cap_rate: 0.06 } },
      appraisalContext: { factAvailability: { sourceBacked: true }, facts: { appraisal_value: 10250000, stabilized_noi: 625000, stabilized_cap_rate: 0.061 } },
      coreReconciliation: {
        factAvailability: { sectionDisplayReady: true },
        facts: { t12GrossPotentialRent: 1200000, rentRollAnnualInPlaceRent: 1170000, differenceAmount: -30000, varianceRatioToT12Gpr: -0.025, perUnitMonthlyDifference: -25 },
      },
    },
  },
  scenarioAnalysis: { capRateSensitivity: { rows: [{ scenarioCapRate: 0.055 }, { scenarioCapRate: 0.06 }, { scenarioCapRate: 0.065 }] } },
});

const html = renderFullUnderwritingValuationReconciliation(model);
check(html.includes('data-iq-section="eliteValuationReconciliation"'), "section identity rendered");
check(html.includes('data-iq-disposition="full"'), "full disposition rendered");
check(html.includes("Valuation Position &amp; Reconciliation") || html.includes("Valuation Position & Reconciliation"), "section title rendered");
check(html.includes("Accepted-Basis Value Indication"), "accepted value indication rendered");
check(html.includes("Accepted T12 NOI"), "accepted NOI label rendered");
check(html.includes("Accepted Going-In Cap Rate"), "accepted cap-rate label rendered");
check(html.includes("InvestorIQ Implied Value"), "InvestorIQ implied value rendered");
check(html.includes("Implied Value Per Unit"), "value per unit rendered");
check(html.includes("$10,000,000"), "base implied value rendered");
check(html.includes("$100,000"), "base value per unit rendered");
check(html.includes('data-iq-subsection="valuation-bridge"'), "valuation bridge rendered");
check(html.includes("Purchase Price Reconciliation"), "purchase-price reconciliation rendered");
check(html.includes("Accepted NOI / Purchase Price"), "purchase-price cap-rate cross-check rendered");
check(html.includes("Appraisal Reconciliation"), "appraisal reconciliation rendered");
check(html.includes("$10,250,000"), "appraisal value rendered");
check(html.includes("Appraisal Stabilized NOI"), "appraisal stabilized NOI rendered as context");
check(html.includes("Appraisal Stabilized Cap Rate"), "appraisal stabilized cap rate rendered as context");
check(html.includes("Core Evidence Reconciliation Impact"), "core reconciliation impact rendered");
check(html.includes("This revenue-base difference is not capitalized"), "core revenue variance is not capitalized");
check(html.includes('data-iq-subsection="governed-cap-rate-value-sensitivity"'), "governed sensitivity rendered");
check(html.includes("Cap-Rate Value Sensitivity"), "sensitivity title rendered");
check(html.includes("defined sensitivity set"), "scenario analysis disclosed in customer language");
check(html.includes('data-iq-valuation-sensitivity-row="scenario"'), "scenario rows explicitly labeled");
check(html.includes('data-iq-valuation-sensitivity-row="accepted"'), "accepted base row explicitly labeled");
check(html.includes('data-iq-evidence-class="source_backed"'), "source-backed evidence class rendered");
check(html.includes('data-iq-evidence-class="third_party_context"'), "third-party evidence class rendered");
check(html.includes('data-iq-evidence-class="deterministic_calculated"'), "deterministic evidence class rendered");
check(html.includes('data-iq-evidence-class="scenario"'), "scenario evidence class rendered");
check(html.includes("Scenario values are sensitivity outputs, not source evidence"), "scenario/evidence boundary rendered");
check(html.includes("cannot replace accepted T12 NOI"), "appraisal/source boundary rendered");
check(html.includes("Reconciliation Interpretation"), "decision-readable interpretation rendered");
check(!/\bIRR\b/i.test(html), "no IRR surface");
check(!/\bMOIC\b/i.test(html), "no MOIC surface");
check(!/\bBUY\b|\bSELL\b|\bHOLD\b/.test(html), "no BUY/SELL/HOLD surface");
check(!/\brefinance\b|\brefi\b/i.test(html), "no prohibited debt wording");
check(!/exit\s+cap/i.test(html), "no exit-cap assumption surface");
check(!/terminal\s+value/i.test(html), "no terminal-value assumption surface");

const compact = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, units: 100, goingInCapRate: 0.06 },
  scenarioAnalysis: {},
});
const compactHtml = renderFullUnderwritingValuationReconciliation(compact);
check(compactHtml.includes('data-iq-disposition="compact"'), "compact section renders when base only is supported");
check(compactHtml.includes("Not shown because supporting evidence is unavailable"), "collapsed dependent surfaces disclosed");
check(!compactHtml.includes("Purchase Price Reconciliation"), "missing purchase comparison collapses cleanly");
check(!compactHtml.includes("Appraisal Reconciliation"), "missing appraisal comparison collapses cleanly");
check(!compactHtml.includes("Cap-Rate Value Sensitivity"), "missing scenario sensitivity collapses cleanly");

const negativeZeroHtml = renderFullUnderwritingValuationReconciliation({
  disposition: "full",
  visibleLabel: "Valuation Position & Reconciliation",
  baseValue: { supported: true, noi: 945000, acceptedGoingInCapRate: 0.07, impliedValue: 13500000 },
  valuationBridge: [],
  purchasePriceComparison: {
    supported: true,
    purchasePrice: 13500000,
    delta: -0.01,
    deltaPct: -0.00001,
    purchasePriceImpliedCapRate: 0.07,
    direction: "aligned",
  },
  missing: [{ code: "NO_GOVERNED_CAP_RATE_SCENARIO_ROWS" }],
}, { reportCapRateSensitivityRendered: true });
check(negativeZeroHtml.includes("Variance vs Purchase Price</td><td>0.0%"), "display-rounded negative zero is normalized");
check(!negativeZeroHtml.includes("-0.0%"), "negative zero is absent");
check(!negativeZeroHtml.includes("cap-rate sensitivity"), "report-level scenario coverage suppresses the false missing note");

equal(renderFullUnderwritingValuationReconciliation({ disposition: "collapsed", baseValue: { supported: false } }), "", "collapsed section omits cleanly");
equal(renderFullUnderwritingValuationReconciliation(null), "", "null model omits cleanly");

console.log(`PASS full-underwriting-valuation-reconciliation-renderer-smoke (${assertions}/${assertions})`);
