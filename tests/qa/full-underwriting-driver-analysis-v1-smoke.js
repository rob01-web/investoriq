import assert from "node:assert/strict";
import { buildFullUnderwritingScenarioEngineV1 } from "../../api/_lib/full-underwriting-scenario-engine-v1.js";
import {
  buildFullUnderwritingDriverAnalysisV1,
  validateFullUnderwritingDriverAnalysisV1,
  FULL_UNDERWRITING_DRIVER_ANALYSIS_VERSION,
  FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION,
} from "../../api/_lib/full-underwriting-driver-analysis-v1.js";

let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed += 1;
}
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  passed += 1;
}
function close(actual, expected, tolerance, message) {
  assert.ok(Math.abs(Number(actual) - Number(expected)) <= tolerance, `${message}: ${actual} vs ${expected}`);
  passed += 1;
}

function metric(key, value, units, evidenceClass = "source_backed") {
  return {
    key,
    value,
    units,
    evidenceClass,
    displayReady: value !== null,
    authorityPath: `operatingIntelligence.metrics.${key}`,
    provenance: [`core.${key}`],
  };
}

function buildScenario({ includeOccupancy = true, includeAcquisition = true } = {}) {
  const sourceTruthPackage = {
    source: "canonical_source_truth_package",
    schema_version: 1,
    job_id: "elite-05-smoke",
    property_name: "ELITE Driver Property",
    core_publishable: true,
    core_input_sufficiency_state: { evidence: { core_source_mode: "dual_source_core" } },
  };
  const operatingIntelligence = {
    version: "full_underwriting_operating_intelligence_v1",
    authority: { sourceTruthMutationAllowed: false, scenarioAllowed: false },
    sourceTruthReceipt: {
      source: "canonical_source_truth_package",
      coreSourceMode: "dual_source_core",
    },
    identity: { propertyName: "ELITE Driver Property" },
    metrics: {
      units: metric("units", 100, "count"),
      occupancy: metric("occupancy", includeOccupancy ? 0.95 : null, "ratio"),
      egi: metric("egi", 1500000, "currency"),
      operatingExpenses: metric("operatingExpenses", 600000, "currency"),
      noi: metric("noi", 900000, "currency", "deterministic_calculated"),
      noiMargin: metric("noiMargin", 0.60, "ratio", "deterministic_calculated"),
    },
  };
  const customerSurfaceModel = includeAcquisition
    ? {
        sections: {
          acquisitionRequestContext: {
            factAvailability: { sourceBacked: true },
            facts: { purchase_price: 13000000, going_in_cap_rate: 0.07 },
            sourceDoc: { acceptedProvenance: { acceptedSourceIdentityKey: "file:purchase" } },
          },
        },
      }
    : { sections: {} };
  return buildFullUnderwritingScenarioEngineV1({
    sourceTruthPackage,
    operatingIntelligence,
    customerSurfaceModel,
    propertyProfile: { propertyName: "ELITE Driver Property" },
    reportMeta: { propertyName: "ELITE Driver Property" },
  });
}

const scenario = buildScenario();
const contract = buildFullUnderwritingDriverAnalysisV1({ scenarioEngine: scenario });
const validation = validateFullUnderwritingDriverAnalysisV1(contract);

equal(contract.version, FULL_UNDERWRITING_DRIVER_ANALYSIS_VERSION, "version");
equal(contract.policyVersion, FULL_UNDERWRITING_DRIVER_ANALYSIS_POLICY_VERSION, "policy version");
equal(validation.ok, true, JSON.stringify(validation.issues));
equal(contract.authority.sourceTruthMutationAllowed, false, "source truth mutation firewall");
equal(contract.authority.sourceFactAuthority, false, "source fact authority firewall");
equal(contract.authority.deterministicBaseAuthority, false, "base authority firewall");
equal(contract.authority.scenarioAuthority, false, "scenario authority remains ELITE-04");
equal(contract.authority.driverComputationAuthority, true, "driver computation authority");
equal(contract.authority.investmentRecommendationAllowed, false, "recommendation firewall");
equal(contract.authority.riskLabelInferenceAllowed, false, "risk-label firewall");
equal(contract.authority.thresholdInferenceAllowed, false, "threshold firewall");
equal(contract.scenarioEngineReceipt.version, "full_underwriting_scenario_engine_v1", "scenario receipt version");
equal(contract.scenarioEngineReceipt.policyVersion, "full_underwriting_scenario_policy_v1", "scenario policy receipt");
equal(contract.scenarioEngineReceipt.sourceTruthReceipt.source, "canonical_source_truth_package", "source truth receipt preserved");
equal(contract.availability.rankedDriverCount, 3, "three supported drivers");
equal(contract.rankedDrivers.length, 3, "rank rows");

equal(contract.rankedDrivers[0].driverKey, "occupancy", "occupancy ranks first in fixture");
equal(contract.rankedDrivers[0].overallRank, 1, "rank 1");
equal(contract.rankedDrivers[0].impactLabel, "Primary driver", "primary label");
equal(contract.rankedDrivers[1].driverKey, "capRate", "cap rate ranks second in fixture");
equal(contract.rankedDrivers[1].overallRank, 2, "rank 2");
equal(contract.rankedDrivers[1].impactLabel, "Material driver", "material label");
equal(contract.rankedDrivers[2].driverKey, "operatingExpenses", "opex ranks third in fixture");
equal(contract.rankedDrivers[2].overallRank, 3, "rank 3");
equal(contract.rankedDrivers[2].impactLabel, "Secondary driver", "secondary label");

const occupancy = contract.rankedDrivers.find((row) => row.driverKey === "occupancy");
const expenses = contract.rankedDrivers.find((row) => row.driverKey === "operatingExpenses");
const capRate = contract.rankedDrivers.find((row) => row.driverKey === "capRate");
check(Boolean(occupancy && expenses && capRate), "all driver rows exist");
close(occupancy.baseInput.value, 0.95, 1e-12, "occupancy base");
close(occupancy.stressInput.value, 0.85, 1e-12, "occupancy stress");
close(occupancy.targetOutput.baseValue, 900000, 1e-6, "occupancy base NOI");
close(occupancy.targetOutput.stressedValue, 742105.2631578947, 1e-6, "occupancy stressed NOI");
close(occupancy.targetOutput.outputChange, -157894.7368421053, 1e-6, "occupancy NOI change");
close(occupancy.targetOutput.relativeImpactRatio, 157894.7368421053 / 900000, 1e-12, "occupancy relative impact");
close(expenses.stressInput.value, 660000, 1e-6, "expense stress input");
close(expenses.targetOutput.outputChange, -60000, 1e-6, "expense NOI change");
close(expenses.targetOutput.relativeImpactRatio, 60000 / 900000, 1e-12, "expense relative impact");
close(capRate.baseInput.value, 0.07, 1e-12, "cap rate base");
close(capRate.stressInput.value, 0.08, 1e-12, "cap rate stress");
close(capRate.targetOutput.relativeImpactRatio, 0.125, 1e-12, "cap rate relative impact");

equal(occupancy.evidenceClass, "scenario", "occupancy evidence class");
equal(occupancy.sourceBacked, false, "occupancy not evidence");
equal(occupancy.scenario, true, "occupancy scenario flag");
equal(occupancy.evidenceBasis.scenarioOutputIsEvidence, false, "scenario output firewall");
equal(capRate.evidenceBasis.baseEvidenceClass, "source_backed", "cap rate base evidence receipt");
equal(contract.rankingPolicy.stressSelection, "maximum_single_driver_downside_stress_available_in_elite04_v1", "max stress selection");
check(contract.rankingPolicy.crossOutputComparisonCaveat.includes("Stress magnitudes differ"), "cross-output caveat visible");
equal(contract.rankingsByTargetOutput.noi.length, 2, "two NOI drivers");
equal(contract.rankingsByTargetOutput.noi[0].driverKey, "occupancy", "NOI target rank");
equal(contract.rankingsByTargetOutput.impliedValue[0].driverKey, "capRate", "value target rank");

check(contract.decisionInterpretation.displayReady, "decision interpretation available");
check(contract.decisionInterpretation.headline.includes("Occupancy"), "headline names top driver");
check(contract.decisionInterpretation.caveat.includes("not a probability"), "decision caveat");
check(Boolean(contract.decisionInterpretation.combinedDownsideContext), "compound downside context present");
equal(contract.decisionInterpretation.combinedDownsideContext.evidenceClass, "scenario", "compound context evidence class");
equal(contract.decisionInterpretation.combinedDownsideContext.sourceBacked, false, "compound context not evidence");
equal(contract.decisionInterpretation.combinedDownsideContext.scenario, true, "compound context scenario");
close(contract.decisionInterpretation.combinedDownsideContext.scenarioOccupancy, 0.85, 1e-12, "compound occupancy");
close(contract.decisionInterpretation.combinedDownsideContext.operatingExpenseStressRate, 0.10, 1e-12, "compound expense stress");

const deferredKeys = new Set(contract.deferredDrivers.map((row) => row.driverKey));
for (const key of ["rent", "interestRate", "purchasePrice", "debtAmount", "majorCapEx", "taxExpense"]) {
  check(deferredKeys.has(key), `deferred driver ${key}`);
}
check(contract.unsupportedTargetOutputs.some((row) => row.key === "dscr"), "DSCR target deferred");
check(contract.unsupportedTargetOutputs.some((row) => row.key === "breakEvenOccupancy"), "break-even target deferred");
check(contract.unsupportedTargetOutputs.some((row) => row.key === "annualCashBurden"), "cash burden target deferred");

equal(contract.sectionDispositions.underwritingDriverAnalysis.disposition, "include", "driver section included");
equal(contract.sectionDispositions.decisionInterpretation.disposition, "include", "decision section included");
equal(contract.sectionDispositions.deferredDrivers.disposition, "compact", "deferred list compact");
equal(contract.provenance.rawParserInputsUsed, false, "raw parser forbidden");
equal(contract.provenance.externalMarketInputsUsed, false, "external market inputs absent");
equal(contract.provenance.hiddenStressMagnitudesUsed, false, "hidden stress forbidden");
equal(contract.provenance.scenarioValuesPromotedToAcceptedFacts, false, "scenario promotion forbidden");
equal(contract.provenance.scenarioValuesPromotedToDeterministicBaseFacts, false, "base promotion forbidden");
equal(contract.provenance.recommendationAuthorityCreated, false, "recommendation authority absent");
check(Object.isFrozen(contract), "contract frozen");
check(Object.isFrozen(contract.rankedDrivers), "ranked drivers frozen");

const withoutAcquisition = buildFullUnderwritingDriverAnalysisV1({ scenarioEngine: buildScenario({ includeAcquisition: false }) });
equal(withoutAcquisition.availability.rankedDriverCount, 2, "cap rate absent without acquisition support");
check(!withoutAcquisition.rankedDrivers.some((row) => row.driverKey === "capRate"), "cap rate not ranked without base");
equal(withoutAcquisition.rankedDrivers[0].driverKey, "occupancy", "occupancy remains top without cap rate");

let scenarioError = null;
try {
  buildFullUnderwritingDriverAnalysisV1({ scenarioEngine: { version: "fake" } });
} catch (err) {
  scenarioError = err;
}
check(Boolean(scenarioError), "invalid scenario engine rejected");
equal(scenarioError?.message, "ELITE_DRIVER_VALID_SCENARIO_ENGINE_REQUIRED", "invalid engine error code");

const mutated = JSON.parse(JSON.stringify(contract));
mutated.authority.riskLabelInferenceAllowed = true;
const mutatedValidation = validateFullUnderwritingDriverAnalysisV1(mutated);
equal(mutatedValidation.ok, false, "mutated policy rejected");
check(mutatedValidation.issues.includes("RISK_LABEL_INFERENCE_MUST_BE_FALSE"), "risk mutation issue surfaced");

const visibleLanguage = JSON.stringify(contract).toUpperCase();
check(!visibleLanguage.includes("HIGH RISK"), "no high risk label");
check(!visibleLanguage.includes("MODERATE RISK"), "no moderate risk label");
check(!visibleLanguage.includes("LOW RISK"), "no low risk label");
check(!visibleLanguage.includes('"BUY"'), "no BUY recommendation");
check(!visibleLanguage.includes('"SELL"'), "no SELL recommendation");
check(!visibleLanguage.includes('"HOLD"'), "no HOLD recommendation");

console.log(`PASS full-underwriting-driver-analysis-v1-smoke (${passed}/${passed})`);
