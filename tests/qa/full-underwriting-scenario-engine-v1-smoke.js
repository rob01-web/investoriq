import assert from "node:assert/strict";
import {
  buildFullUnderwritingScenarioEngineV1,
  validateFullUnderwritingScenarioEngineV1,
  FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION,
  FULL_UNDERWRITING_SCENARIO_POLICY_VERSION,
} from "../../api/_lib/full-underwriting-scenario-engine-v1.js";

function metric(key, value, units, evidenceClass = "source_backed") {
  return {
    key,
    label: key,
    value,
    units,
    evidenceClass,
    displayReady: value !== null,
    authorityPath: `operating.${key}`,
    provenance: [`source:${key}`],
  };
}

function baseFixture({ capRate = 0.07, purchasePrice = 13_500_000, occupancy = 0.9375 } = {}) {
  const sourceTruthPackage = {
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "elite-04-smoke",
    property_name: "ELITE Scenario Property",
    core_publishable: true,
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  };
  const operatingIntelligence = {
    version: "full_underwriting_operating_intelligence_v1",
    authority: {
      sourceTruthMutationAllowed: false,
      scenarioAllowed: false,
    },
    sourceTruthReceipt: {
      source: "canonical_source_truth_package",
      coreSourceMode: "dual_source_core",
    },
    identity: { propertyName: "ELITE Scenario Property" },
    metrics: {
      units: metric("units", 64, "count"),
      occupancy: metric("occupancy", occupancy, "ratio"),
      egi: metric("egi", 1_500_000, "currency"),
      operatingExpenses: metric("operatingExpenses", 555_000, "currency"),
      noi: metric("noi", 945_000, "currency"),
      noiMargin: metric("noiMargin", 0.63, "ratio", "deterministic_calculated"),
    },
  };
  const customerSurfaceModel = {
    sections: {
      acquisitionRequestContext: {
        factAvailability: { sourceBacked: capRate !== null || purchasePrice !== null },
        facts: {
          going_in_cap_rate: capRate,
          purchase_price: purchasePrice,
        },
        sourceDoc: {
          acceptedProvenance: { acceptedSourceIdentityKey: "file:purchase-file" },
        },
      },
    },
  };
  return { sourceTruthPackage, operatingIntelligence, customerSurfaceModel };
}

let checks = 0;
function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}
function equal(actual, expected, message) {
  checks += 1;
  assert.equal(actual, expected, message);
}
function close(actual, expected, tolerance = 1e-6, message = "") {
  checks += 1;
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message} actual=${actual} expected=${expected}`);
}

const fixture = baseFixture();
const sourceBefore = JSON.stringify(fixture.sourceTruthPackage);
const operatingBefore = JSON.stringify(fixture.operatingIntelligence);
const modelBefore = JSON.stringify(fixture.customerSurfaceModel);
const contract = buildFullUnderwritingScenarioEngineV1(fixture);

const validation = validateFullUnderwritingScenarioEngineV1(contract);
equal(validation.ok, true, JSON.stringify(validation.issues));
equal(contract.version, FULL_UNDERWRITING_SCENARIO_ENGINE_VERSION);
equal(contract.policyVersion, FULL_UNDERWRITING_SCENARIO_POLICY_VERSION);
equal(contract.authority.sourceTruthMutationAllowed, false);
equal(contract.authority.sourceFactAuthority, false);
equal(contract.authority.scenarioComputationAuthority, true);
equal(contract.authority.forwardForecastAuthority, false);
equal(contract.authority.probabilityAuthority, false);
equal(contract.authority.investmentRecommendationAllowed, false);
equal(contract.authority.irrAllowed, false);
equal(contract.authority.moicAllowed, false);
equal(contract.sourceTruthReceipt.source, "canonical_source_truth_package");
equal(contract.sourceTruthReceipt.coreSourceMode, "dual_source_core");
equal(contract.availability.chapterDisplayReady, true);
equal(contract.availability.scenarioFamilyCount, 4);
check(Object.isFrozen(contract), "contract must be frozen");
check(Object.isFrozen(contract.occupancyStress.rows), "scenario rows must be frozen");

equal(contract.scenarioBasis.evidenceClass, "scenario");
equal(contract.scenarioBasis.sourceBacked, false);
equal(contract.scenarioBasis.base.occupancy.evidenceClass, "source_backed");
equal(contract.scenarioBasis.base.noiMargin.evidenceClass, "deterministic_calculated");
equal(contract.scenarioBasis.base.goingInCapRate.evidenceClass, "source_backed");
equal(contract.scenarioBasis.base.purchasePrice.evidenceClass, "source_backed");

const occupancyRows = contract.occupancyStress.rows;
equal(occupancyRows.length, 3);
equal(occupancyRows[0].evidenceClass, "scenario");
equal(occupancyRows[0].sourceBacked, false);
equal(occupancyRows[1].scenarioInputs.occupancyDeltaPercentagePoints, -0.05);
close(occupancyRows[1].scenarioInputs.scenarioOccupancy, 0.8875, 1e-12, "5pp occupancy stress");
close(occupancyRows[1].outputs.egi, 1_420_000, 1e-6, "5pp EGI");
close(occupancyRows[1].outputs.noi, 865_000, 1e-6, "5pp NOI");
close(occupancyRows[1].outputs.noiDeltaVsBase, -80_000, 1e-6, "5pp NOI delta");
close(occupancyRows[2].scenarioInputs.scenarioOccupancy, 0.8375, 1e-12, "10pp occupancy stress");
close(occupancyRows[2].outputs.noi, 785_000, 1e-6, "10pp NOI");

const expenseRows = contract.expenseStress.rows;
equal(expenseRows.length, 3);
equal(expenseRows[1].scenarioInputs.operatingExpenseStressRate, 0.05);
close(expenseRows[1].outputs.operatingExpenses, 582_750, 1e-6, "5pct OpEx");
close(expenseRows[1].outputs.noi, 917_250, 1e-6, "5pct NOI");
close(expenseRows[1].outputs.noiDeltaVsBase, -27_750, 1e-6, "5pct NOI delta");
close(expenseRows[2].outputs.operatingExpenses, 610_500, 1e-6, "10pct OpEx");
close(expenseRows[2].outputs.noi, 889_500, 1e-6, "10pct NOI");

const capRows = contract.capRateValueSensitivity.rows;
equal(capRows.length, 3);
close(capRows[0].scenarioInputs.scenarioCapRate, 0.07, 1e-12, "base cap");
close(capRows[0].outputs.impliedValue, 13_500_000, 1e-6, "base value");
close(capRows[0].outputs.valuePerUnit, 210_937.5, 1e-6, "base value/unit");
close(capRows[0].outputs.valueDeltaVsPurchasePrice, 0, 1e-6, "base delta");
close(capRows[1].scenarioInputs.scenarioCapRate, 0.075, 1e-12, "+50bps cap");
close(capRows[1].outputs.impliedValue, 12_600_000, 1e-6, "+50bps value");
close(capRows[1].outputs.valueDeltaVsPurchasePrice, -900_000, 1e-6, "+50bps purchase delta");
close(capRows[2].scenarioInputs.scenarioCapRate, 0.08, 1e-12, "+100bps cap");
close(capRows[2].outputs.impliedValue, 11_812_500, 1e-6, "+100bps value");

const matrix = contract.occupancyExpenseMatrix;
equal(matrix.occupancyLevels.length, 3);
equal(matrix.expenseLevels.length, 3);
equal(matrix.cells.length, 9);
const worstCell = matrix.cells.find((cell) => cell.rowKey === "minus_10pp" && cell.columnKey === "plus_10pct");
check(Boolean(worstCell), "worst matrix cell missing");
close(worstCell.scenarioNoi, 729_500, 1e-6, "combined stress NOI");
equal(worstCell.evidenceClass, "scenario");
equal(worstCell.sourceBacked, false);

check(contract.deferredScenarioFamilies.some((item) => item.key === "rent_stress"), "rent stress boundary missing");
check(contract.deferredScenarioFamilies.some((item) => item.key === "interest_rate_stress"), "interest rate boundary missing");
check(contract.deferredScenarioFamilies.some((item) => item.key === "irr_moic"), "IRR/MOIC boundary missing");
equal(contract.provenance.rawParserInputsUsed, false);
equal(contract.provenance.externalMarketInputsUsed, false);
equal(contract.provenance.hiddenAssumptionsUsed, false);
equal(contract.provenance.scenarioValuesPromotedToSourceBacked, false);
equal(contract.provenance.scenarioValuesPromotedToDeterministicBaseFacts, false);

equal(JSON.stringify(fixture.sourceTruthPackage), sourceBefore, "source truth mutated");
equal(JSON.stringify(fixture.operatingIntelligence), operatingBefore, "operating intelligence mutated");
equal(JSON.stringify(fixture.customerSurfaceModel), modelBefore, "customer surface mutated");

const noCapFixture = baseFixture({ capRate: null, purchasePrice: null });
const noCap = buildFullUnderwritingScenarioEngineV1(noCapFixture);
equal(noCap.capRateValueSensitivity.displayReady, false);
equal(noCap.capRateValueSensitivity.disposition.disposition, "collapse");
equal(noCap.availability.chapterDisplayReady, true);
equal(noCap.availability.scenarioFamilyCount, 3);

const missingOperating = baseFixture();
missingOperating.operatingIntelligence.metrics.occupancy = metric("occupancy", null, "ratio");
const partial = buildFullUnderwritingScenarioEngineV1(missingOperating);
equal(partial.occupancyStress.displayReady, false);
equal(partial.occupancyExpenseMatrix.displayReady, false);
equal(partial.expenseStress.displayReady, true);
equal(partial.capRateValueSensitivity.displayReady, true);

assert.throws(
  () => buildFullUnderwritingScenarioEngineV1({
    ...fixture,
    sourceTruthPackage: { ...fixture.sourceTruthPackage, source: "not_canonical" },
  }),
  /ELITE_SCENARIO_CANONICAL_SOURCE_TRUTH_REQUIRED/
);
checks += 1;
assert.throws(
  () => buildFullUnderwritingScenarioEngineV1({
    ...fixture,
    sourceTruthPackage: { ...fixture.sourceTruthPackage, core_publishable: false },
  }),
  /ELITE_SCENARIO_VALIDATED_CORE_REQUIRED/
);
checks += 1;
assert.throws(
  () => buildFullUnderwritingScenarioEngineV1({
    ...fixture,
    operatingIntelligence: null,
  }),
  /ELITE_SCENARIO_OPERATING_INTELLIGENCE_REQUIRED/
);
checks += 1;

const serialized = JSON.stringify(contract).toLowerCase();
check(!serialized.includes('"buy"'), "BUY recommendation leaked");
check(!serialized.includes('"sell"'), "SELL recommendation leaked");
check(!serialized.includes('"hold"'), "HOLD recommendation leaked");

console.log(`PASS full-underwriting-scenario-engine-v1-smoke (${checks}/${checks})`);
