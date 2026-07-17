import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate7B } from './fixtures/institutional-gate-7-chain.js';
import {
  buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract,
  isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract,
} from '../../api/_lib/institutional-scenario-engine-formula-eligibility-contract.js';

const stressSetAuthorityContract = buildCanonicalGate7B('gate-7c-job');
const contract = buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
  stressSetAuthorityContract,
});

assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.formulaRegistry), true);
assert.equal(contract.source, 'canonical_institutional_scenario_engine_formula_eligibility_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, stressSetAuthorityContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-7c-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate7BReceipt, true);
assert.equal(contract.upstreamReceipt.definedStressSetCount, 7);
assert.equal(contract.upstreamReceipt.authorizedStressSetCount, 0);
assert.equal(contract.upstreamReceipt.approvedScenarioPolicyAvailable, false);

assert.deepEqual(Object.keys(contract.formulaRegistry), [
  'rentStress',
  'occupancyStress',
  'rateStress',
  'taxStress',
  'expenseStress',
  'capitalizationRateStress',
  'exitStress',
]);
for (const formula of Object.values(contract.formulaRegistry)) {
  assert.equal(formula.formulaAuthorityState, 'canonical_deterministic_formula_registered');
  assert.equal(formula.expression.length > 0, true);
  assert.deepEqual(formula.availableStressInputFields, []);
  assert.deepEqual(formula.missingStressInputFields, formula.requiredStressInputFields);
  assert.deepEqual(formula.availableContextFields, []);
  assert.deepEqual(formula.missingContextFields, formula.requiredContextFields);
  assert.equal(formula.stressSetAuthorityComplete, false);
  assert.equal(formula.contextAuthorityComplete, false);
  assert.equal(formula.calculationEligible, false);
  assert.equal(formula.calculationsPerformed, false);
  assert.equal(formula.output, null);
  assert.equal(formula.riskClassificationAuthorized, false);
  assert.equal(formula.memoExecutionAuthorized, false);
  assert.equal(formula.customerSurfaceAuthorized, false);
  assert.equal(formula.reportPublicationBlocker, false);
}
assert.deepEqual(contract.formulaRegistry.occupancyStress.requiredStressInputFields, [
  'stress_occupancy_rate',
  'stress_vacancy_rate',
]);
assert.equal(
  contract.formulaRegistry.occupancyStress.expression.includes('complement_validation'),
  true
);
assert.deepEqual(contract.formulaRegistry.rateStress.requiredContextFields, [
  'accepted_debt_principal',
  'accepted_amortization_years',
  'authorized_payment_frequency',
]);
assert.deepEqual(contract.formulaRegistry.exitStress.requiredStressInputFields, [
  'exit_capitalization_rate',
  'hold_period_years',
]);
assert.equal(contract.executionAuthority.calculationsAuthorized, false);
assert.equal(contract.executionAuthority.eligibleFormulaKeys.length, 0);
assert.equal(contract.executionAuthority.ineligibleFormulaKeys.length, 7);
assert.equal(contract.coverage.registeredFormulaCount, 7);
assert.equal(contract.coverage.eligibleFormulaCount, 0);
assert.equal(contract.coverage.calculatedFormulaCount, 0);
assert.equal(contract.gate7Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
  stressSetAuthorityContract,
  formulaRegistry: { rentStress: { expression: 'caller_formula' } },
  context: { accepted_annual_rent_basis: 999999999 },
  calculationsAuthorized: true,
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
    stressSetAuthorityContract: {
      source: 'canonical_institutional_scenario_engine_stress_set_authority_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_7B_STRESS_SET_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7C_FORMULA_ELIGIBILITY/
);

const tamperedUpstream = structuredClone(stressSetAuthorityContract);
tamperedUpstream.stressSets.rentStress.stressSetAuthorized = true;
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
    stressSetAuthorityContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_7B_STRESS_SET_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7C_FORMULA_ELIGIBILITY/
);

const callerFormula = structuredClone(contract);
callerFormula.formulaRegistry.rentStress.expression = 'caller_defined_rent_formula';
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(callerFormula), false);

const omittedContext = structuredClone(contract);
omittedContext.formulaRegistry.rateStress.missingContextFields = [];
omittedContext.formulaRegistry.rateStress.contextAuthorityComplete = true;
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(omittedContext), false);

const promotedEligibility = structuredClone(contract);
promotedEligibility.formulaRegistry.occupancyStress.calculationEligible = true;
promotedEligibility.executionAuthority.calculationsAuthorized = true;
promotedEligibility.executionAuthority.eligibleFormulaKeys = ['occupancy_stress_formula'];
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(promotedEligibility), false);

const calculatedOutput = structuredClone(contract);
calculatedOutput.formulaRegistry.expenseStress.calculationsPerformed = true;
calculatedOutput.formulaRegistry.expenseStress.output = 999999999;
calculatedOutput.coverage.calculatedFormulaCount = 1;
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(calculatedOutput), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.formulaRegistry.exitStress.riskClassificationAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(classifiedRisk), false);

const executedMemo = structuredClone(contract);
executedMemo.formulaRegistry.rentStress.memoExecutionAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(executedMemo), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate7Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
  stressSetAuthorityContract: buildCanonicalGate7B('gate-7c-second-core-only'),
});
assert.equal(isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(secondContract), true);
assert.equal(secondContract.upstreamReceipt.corePublishable, true);
assert.equal(secondContract.coverage.registeredFormulaCount, 7);
assert.equal(secondContract.coverage.eligibleFormulaCount, 0);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scenario-engine-formula-eligibility-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scenario-engine-stress-set-authority-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-scenario-engine-formula-eligibility-contract-smoke: PASS');
