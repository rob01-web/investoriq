import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate7C } from './fixtures/institutional-gate-7-chain.js';
import {
  buildCanonicalInstitutionalScenarioEngineExecutionContract,
  isCanonicalInstitutionalScenarioEngineExecutionContract,
} from '../../api/_lib/institutional-scenario-engine-execution-contract.js';

const formulaEligibilityContract = buildCanonicalGate7C('gate-7d-job');
const contract = buildCanonicalInstitutionalScenarioEngineExecutionContract({
  formulaEligibilityContract,
});

assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.executions), true);
assert.equal(contract.source, 'canonical_institutional_scenario_engine_execution_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, formulaEligibilityContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-7d-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate7CReceipt, true);
assert.equal(contract.upstreamReceipt.registeredFormulaCount, 7);
assert.equal(contract.upstreamReceipt.eligibleFormulaCount, 0);
assert.equal(contract.upstreamReceipt.authorizedStressSetCount, 0);

assert.deepEqual(Object.keys(contract.executions), [
  'rentStress',
  'occupancyStress',
  'rateStress',
  'taxStress',
  'expenseStress',
  'capitalizationRateStress',
  'exitStress',
]);
for (const execution of Object.values(contract.executions)) {
  assert.equal(execution.executionState, 'collapsed_ineligible');
  assert.equal(execution.calculationEligible, false);
  assert.equal(execution.calculationAttempted, false);
  assert.equal(execution.calculationPerformed, false);
  assert.deepEqual(execution.inputSnapshot, {});
  assert.deepEqual(execution.arithmeticDiagnostics, []);
  assert.equal(execution.output, null);
  assert.deepEqual(execution.collapseReasonCodes, [
    'CANONICAL_STRESS_SET_AUTHORITY_NOT_COMPLETE',
    'CANONICAL_SCENARIO_CONTEXT_AUTHORITY_NOT_COMPLETE',
  ]);
  assert.equal(execution.riskClassificationAuthorized, false);
  assert.equal(execution.memoExecutionAuthorized, false);
  assert.equal(execution.customerSurfaceAuthorized, false);
  assert.equal(execution.reportPublicationBlocker, false);
}
assert.deepEqual(contract.executionSummary, {
  executionState: 'collapsed_no_eligible_canonical_scenario_formulas',
  totalFormulaCount: 7,
  eligibleFormulaCount: 0,
  attemptedFormulaCount: 0,
  calculatedFormulaCount: 0,
  collapsedFormulaCount: 7,
  outputCount: 0,
  outputs: {},
  reportPublicationBlocker: false,
});
assert.equal(contract.gate7Receipt.established, false);
assert.equal(contract.gate7Receipt.scenarioAnalysisState, 'collapsed_no_authorized_stress_sets');
assert.equal(contract.coverage.collapsedFormulaCount, 7);
assert.equal(contract.coverage.scenarioOutputCount, 0);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalScenarioEngineExecutionContract({
  formulaEligibilityContract,
  inputs: { occupancyRate: 0.8 },
  outputs: { occupancyStress: 0.8 },
  execute: true,
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineExecutionContract({
    formulaEligibilityContract: {
      source: 'canonical_institutional_scenario_engine_formula_eligibility_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_7C_FORMULA_ELIGIBILITY_CONTRACT_REQUIRED_FOR_GATE_7D_EXECUTION/
);

const tamperedUpstream = structuredClone(formulaEligibilityContract);
tamperedUpstream.formulaRegistry.rentStress.calculationEligible = true;
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineExecutionContract({
    formulaEligibilityContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_7C_FORMULA_ELIGIBILITY_CONTRACT_REQUIRED_FOR_GATE_7D_EXECUTION/
);

const attemptedIneligibleFormula = structuredClone(contract);
attemptedIneligibleFormula.executions.rentStress.calculationAttempted = true;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(attemptedIneligibleFormula), false);

const fabricatedInputSnapshot = structuredClone(contract);
fabricatedInputSnapshot.executions.occupancyStress.inputSnapshot = { occupancyRate: 0.8 };
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(fabricatedInputSnapshot), false);

const fabricatedOutput = structuredClone(contract);
fabricatedOutput.executions.rateStress.calculationPerformed = true;
fabricatedOutput.executions.rateStress.output = 999999999;
fabricatedOutput.executionSummary.outputCount = 1;
fabricatedOutput.executionSummary.outputs.rateStress = 999999999;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(fabricatedOutput), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.executions.exitStress.riskClassificationAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(classifiedRisk), false);

const executedMemo = structuredClone(contract);
executedMemo.executions.expenseStress.memoExecutionAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(executedMemo), false);

const fabricatedGate7Receipt = structuredClone(contract);
fabricatedGate7Receipt.gate7Receipt.authorityState = 'established';
fabricatedGate7Receipt.gate7Receipt.established = true;
fabricatedGate7Receipt.coverage.gate7ScenarioEngineReceiptEstablished = true;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(fabricatedGate7Receipt), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate7Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalScenarioEngineExecutionContract({
  formulaEligibilityContract: buildCanonicalGate7C('gate-7d-second-core-only'),
});
assert.equal(isCanonicalInstitutionalScenarioEngineExecutionContract(secondContract), true);
assert.equal(secondContract.upstreamReceipt.corePublishable, true);
assert.equal(secondContract.coverage.collapsedFormulaCount, 7);
assert.equal(secondContract.coverage.scenarioOutputCount, 0);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scenario-engine-execution-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scenario-engine-formula-eligibility-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-scenario-engine-execution-contract-smoke: PASS');
