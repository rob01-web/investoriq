import assert from "node:assert/strict";
import { buildFullUnderwritingValuationReconciliationV1 } from "../../api/_lib/full-underwriting-valuation-reconciliation-v1.js";

let assertions = 0;
function check(condition, message) {
  assertions += 1;
  assert.ok(condition, message);
}
function equal(actual, expected, message) {
  assertions += 1;
  assert.equal(actual, expected, message);
}
function close(actual, expected, tolerance, message) {
  assertions += 1;
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

const input = {
  coreMetrics: {
    noi: 600000,
    units: 100,
    goingInCapRate: 0.06,
    purchasePrice: 9500000,
  },
  customerSurfaceModel: {
    valueSemantics: {
      wholePropertyValue: {
        noi: 600000,
        goingInCapRate: 0.06,
        purchasePrice: 9500000,
      },
    },
    sourceBackedFacts: {
      unitMix: { total_units: 100 },
    },
    sections: {
      acquisitionRequestContext: {
        factAvailability: { sourceBacked: true },
        facts: { purchase_price: 9500000, going_in_cap_rate: 0.06 },
      },
      appraisalContext: {
        factAvailability: { sourceBacked: true },
        facts: { appraisal_value: 10250000, stabilized_noi: 625000, stabilized_cap_rate: 0.061 },
      },
      coreReconciliation: {
        factAvailability: { sectionDisplayReady: true },
        facts: {
          t12GrossPotentialRent: 1200000,
          rentRollAnnualInPlaceRent: 1170000,
          differenceAmount: -30000,
          varianceRatioToT12Gpr: -0.025,
          perUnitMonthlyDifference: -25,
        },
      },
    },
  },
  sourcePackage: {
    coreT12: { extractedFacts: { noi: 600000 } },
    coreRentRoll: { extractedFacts: { total_units: 100 } },
    supportDocs: [
      { canonicalRole: "purchase_assumptions", extractedFacts: { purchase_price: 9500000, going_in_cap_rate: 0.06 } },
      { canonicalRole: "appraisal_context", extractedFacts: { appraisal_value: 10250000 } },
    ],
  },
  scenarioAnalysis: {
    capRateSensitivity: {
      rows: [
        { scenarioCapRate: 0.055 },
        { scenarioCapRate: 0.06 },
        { scenarioCapRate: 0.065 },
      ],
    },
  },
};

const before = JSON.stringify(input);
const model = buildFullUnderwritingValuationReconciliationV1(input);

equal(model.version, "elite-08-valuation-reconciliation-v1", "model version");
equal(model.sectionKey, "eliteValuationReconciliation", "section key");
equal(model.visibleLabel, "Valuation Position & Reconciliation", "visible label");
equal(model.disposition, "full", "rich evidence renders full disposition");
equal(model.authority.sourceTruthReadOnly, true, "source truth is read only");
equal(model.authority.sourceTruthMutationAllowed, false, "source truth mutation forbidden");
equal(model.authority.publicationAuthority, false, "no publication authority");
equal(model.authority.deliveryAuthority, false, "no delivery authority");
equal(model.authority.recommendationAuthority, false, "no recommendation authority");
equal(model.authority.scenarioAuthority, "elite-04-scenario-engine-v1", "ELITE-04 owns scenario authority");
equal(model.authority.scenarioOutputsAreSourceEvidence, false, "scenario is not source evidence");
equal(model.authority.appraisalOverridesCanonicalOperatingTruth, false, "appraisal cannot override canonical truth");

close(model.baseValue.noi, 600000, 0.001, "accepted NOI");
close(model.baseValue.acceptedGoingInCapRate, 0.06, 1e-10, "accepted cap rate");
close(model.baseValue.impliedValue, 10000000, 0.01, "implied value");
close(model.baseValue.valuePerUnit, 100000, 0.01, "value per unit");
equal(model.baseValue.evidenceClass, "deterministic_calculated", "base value evidence class");

check(model.purchasePriceComparison.supported, "purchase price comparison supported");
close(model.purchasePriceComparison.purchasePrice, 9500000, 0.01, "purchase price");
close(model.purchasePriceComparison.delta, 500000, 0.01, "implied value less purchase price");
close(model.purchasePriceComparison.deltaPct, 500000 / 9500000, 1e-10, "purchase price variance percentage");
equal(model.purchasePriceComparison.direction, "above", "purchase comparison direction");
close(model.purchasePriceComparison.purchasePriceImpliedCapRate, 600000 / 9500000, 1e-10, "purchase price implied cap ratio");
close(model.purchasePriceComparison.purchasePricePerUnit, 95000, 0.01, "purchase price per unit");

check(model.appraisalComparison.supported, "appraisal comparison supported");
close(model.appraisalComparison.appraisalValue, 10250000, 0.01, "appraisal value");
close(model.appraisalComparison.appraisalStabilizedNoi, 625000, 0.01, "appraisal stabilized NOI remains context");
close(model.appraisalComparison.appraisalStabilizedCapRate, 0.061, 1e-10, "appraisal stabilized cap rate remains context");
close(model.appraisalComparison.deltaVsInvestorIq, 250000, 0.01, "appraisal less InvestorIQ value");
equal(model.appraisalComparison.directionVsInvestorIq, "above", "appraisal comparison direction");
close(model.appraisalComparison.deltaVsPurchasePrice, 750000, 0.01, "appraisal less purchase price");
equal(model.appraisalComparison.evidenceClass, "third_party_context", "appraisal remains third-party context");

check(model.valueSensitivity.supported, "governed cap-rate sensitivity supported");
equal(model.valueSensitivity.authority, "elite-04-scenario-engine-v1", "sensitivity authority preserved");
equal(model.valueSensitivity.scenarioRowCount, 2, "two non-base scenario points");
equal(model.valueSensitivity.rows.length, 3, "base plus two governed scenario points");
close(model.valueSensitivity.rows[0].capRate, 0.055, 1e-10, "lower governed cap rate");
close(model.valueSensitivity.rows[0].impliedValue, 600000 / 0.055, 0.01, "lower-rate scenario value");
equal(model.valueSensitivity.rows[0].evidenceClass, "scenario", "lower governed point remains scenario");
close(model.valueSensitivity.rows[1].capRate, 0.06, 1e-10, "accepted base cap rate");
equal(model.valueSensitivity.rows[1].evidenceClass, "deterministic_calculated", "accepted point remains calculated base");
close(model.valueSensitivity.rows[2].capRate, 0.065, 1e-10, "upper governed cap rate");
close(model.valueSensitivity.rows[2].impliedValue, 600000 / 0.065, 0.01, "upper-rate scenario value");

check(model.valuationBridge.some((row) => row.label === "InvestorIQ Implied Value" && row.evidenceClass === "deterministic_calculated"), "bridge includes deterministic InvestorIQ value");
check(model.valuationBridge.some((row) => row.label === "Purchase Price" && row.evidenceClass === "source_backed"), "bridge includes source-backed purchase price");
check(model.valuationBridge.some((row) => row.label === "Appraised Value" && row.evidenceClass === "third_party_context"), "bridge includes third-party appraisal");
check(model.observations.some((row) => row.code === "IMPLIED_VALUE_VS_PURCHASE_PRICE"), "purchase-price interpretation emitted");
check(model.observations.some((row) => row.code === "PURCHASE_PRICE_IMPLIED_CAP_RATE_CROSSCHECK"), "cap-rate cross-check emitted");
check(model.observations.some((row) => row.code === "APPRAISAL_VS_INVESTORIQ_VALUE"), "appraisal interpretation emitted");
check(model.coreReconciliationContext.supported, "core reconciliation context preserved");
close(model.coreReconciliationContext.differenceAmount, -30000, 0.01, "core revenue-base difference preserved");
check(model.observations.some((row) => row.code === "CORE_REVENUE_BASES_DIFFER"), "core reconciliation interpretation emitted");
check(model.observations.some((row) => row.code === "GOVERNED_CAP_RATE_SCENARIO_RANGE"), "governed scenario range emitted");
equal(JSON.stringify(input), before, "engine does not mutate its inputs");

const appraisalDominance = buildFullUnderwritingValuationReconciliationV1({
  ...input,
  customerSurfaceModel: {
    ...input.customerSurfaceModel,
    sections: {
      ...input.customerSurfaceModel.sections,
      appraisalContext: {
        factAvailability: { sourceBacked: true },
        facts: { appraisal_value: 15000000, stabilized_noi: 900000, stabilized_cap_rate: 0.06 },
      },
    },
  },
});
close(appraisalDominance.baseValue.noi, 600000, 0.001, "appraisal NOI cannot replace canonical T12 NOI");
close(appraisalDominance.baseValue.impliedValue, 10000000, 0.01, "appraisal cannot replace deterministic value basis");
close(appraisalDominance.appraisalComparison.appraisalValue, 15000000, 0.01, "appraisal is retained as comparison context");

const compact = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, goingInCapRate: 0.06, units: 100 },
  scenarioAnalysis: {},
});
equal(compact.disposition, "compact", "base-only valuation renders compact");
check(compact.baseValue.supported, "base-only valuation is supported");
equal(compact.purchasePriceComparison.supported, false, "missing purchase price collapses dependent comparison");
equal(compact.appraisalComparison.supported, false, "missing appraisal collapses dependent comparison");
equal(compact.valueSensitivity.supported, false, "missing governed scenario rows collapses sensitivity");
check(compact.missing.some((row) => row.code === "NO_ACCEPTED_PURCHASE_PRICE"), "missing purchase price recorded");
check(compact.missing.some((row) => row.code === "NO_SOURCE_BACKED_APPRAISAL_VALUE"), "missing appraisal recorded");
check(compact.missing.some((row) => row.code === "NO_GOVERNED_CAP_RATE_SCENARIO_ROWS"), "missing scenario rows recorded");

const collapsedNoNoi = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { goingInCapRate: 0.06, units: 100 },
  scenarioAnalysis: input.scenarioAnalysis,
});
equal(collapsedNoNoi.disposition, "collapsed", "missing canonical NOI collapses section");
equal(collapsedNoNoi.baseValue.supported, false, "no base value without canonical NOI");

const collapsedNoCap = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, units: 100 },
  scenarioAnalysis: input.scenarioAnalysis,
});
equal(collapsedNoCap.disposition, "collapsed", "missing accepted cap rate collapses section");
equal(collapsedNoCap.baseValue.supported, false, "no base value without accepted cap rate");

const noInventedScenarioRates = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, goingInCapRate: 0.06, purchasePrice: 10000000 },
  scenarioAnalysis: { occupancySensitivity: [{ occupancy: 0.9 }, { occupancy: 0.95 }] },
});
equal(noInventedScenarioRates.valueSensitivity.supported, false, "ELITE-08 does not manufacture cap-rate points from non-cap-rate scenarios");
equal(noInventedScenarioRates.valueSensitivity.rows.length, 0, "no scenario rate means no valuation sensitivity rows");

const ignoresDeltaOnly = buildFullUnderwritingValuationReconciliationV1({
  coreMetrics: { noi: 600000, goingInCapRate: 0.06, purchasePrice: 10000000 },
  scenarioAnalysis: { capRateSensitivity: [{ capRateDelta: -0.005 }, { capRateDelta: 0.005 }] },
});
equal(ignoresDeltaOnly.valueSensitivity.supported, false, "cap-rate deltas alone are not reinterpreted as absolute scenario rates");

console.log(`PASS full-underwriting-valuation-reconciliation-v1-smoke (${assertions}/${assertions})`);
