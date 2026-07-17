import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate7D } from './fixtures/institutional-gate-7-chain.js';
import {
  buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract,
  isCanonicalInstitutionalScenarioEngineCompletionHandoffContract,
} from '../../api/_lib/institutional-scenario-engine-completion-handoff-contract.js';

const executionContract = buildCanonicalGate7D('gate-7e-job');
const contract = buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
  executionContract,
});

assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.gate7CompletionReceipt), true);
assert.equal(Object.isFrozen(contract.gate6Handoff), true);
assert.equal(contract.source, 'canonical_institutional_scenario_engine_completion_handoff_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, executionContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-7e-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate7DReceipt, true);
assert.equal(contract.upstreamReceipt.totalFormulaCount, 7);
assert.equal(contract.upstreamReceipt.calculatedFormulaCount, 0);
assert.equal(contract.upstreamReceipt.collapsedFormulaCount, 7);
assert.equal(contract.upstreamReceipt.scenarioOutputCount, 0);

assert.deepEqual(contract.gate7CompletionReceipt, {
  receiptKey: 'canonical_gate_7_scenario_engine_completion_receipt',
  receiptVersion: 1,
  authorityState: 'established_collapsed_no_authorized_stress_sets',
  established: true,
  architectureComplete: true,
  scenarioAnalysisState: 'collapsed_no_authorized_stress_sets',
  registeredFormulaCount: 7,
  calculatedFormulaCount: 0,
  collapsedFormulaCount: 7,
  scenarioOutputCount: 0,
  scenarioOutputs: [],
  limitationCodes: [
    'EXACT_SOURCE_OR_APPROVED_SCENARIO_POLICY_AUTHORITY_NOT_AVAILABLE',
    'NO_CANONICAL_SCENARIO_FORMULA_ELIGIBLE_FOR_EXECUTION',
  ],
  riskClassificationAuthorized: false,
  memoExecutionAuthorized: false,
  customerSurfaceAuthorized: false,
  reportPublicationBlocker: false,
});
assert.deepEqual(contract.gate6Handoff, {
  handoffKey: 'canonical_gate_7_to_gate_6_internal_handoff',
  targetGate: 'gate_6_investment_committee_memo',
  handoffState: 'available_collapsed_scenario_analysis',
  canonicalGate7CompletionReceiptAvailable: true,
  scenarioEvidenceAvailable: false,
  scenarioEvidence: [],
  scenarioOutputsAvailable: false,
  scenarioOutputs: [],
  riskComponentExecutionAuthorized: false,
  memoExecutionAuthorized: false,
  remainingRequiredRoadmapGates: [
    'gate_8_due_diligence_engine',
    'gate_9_institutional_scoring',
  ],
  upstreamGate6SequencingMutated: false,
  customerSurfaceAuthorized: false,
  reportPublicationBlocker: false,
});
assert.equal(contract.coverage.gate7ArchitectureComplete, true);
assert.equal(contract.coverage.gate7CompletionReceiptEstablished, true);
assert.equal(contract.coverage.scenarioAnalysisCollapsed, true);
assert.equal(contract.coverage.scenarioOutputCount, 0);
assert.equal(contract.coverage.riskClassificationCount, 0);
assert.equal(contract.coverage.memoComponentExecutionCount, 0);
assert.equal(contract.coverage.gate6InternalHandoffAvailable, true);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
  executionContract,
  completionReceipt: { scenarioOutputCount: 1 },
  gate6Handoff: { memoExecutionAuthorized: true },
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
    executionContract: {
      source: 'canonical_institutional_scenario_engine_execution_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_7D_EXECUTION_CONTRACT_REQUIRED_FOR_GATE_7E_COMPLETION_HANDOFF/
);

const tamperedUpstream = structuredClone(executionContract);
tamperedUpstream.executionSummary.outputCount = 1;
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
    executionContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_7D_EXECUTION_CONTRACT_REQUIRED_FOR_GATE_7E_COMPLETION_HANDOFF/
);

const fabricatedScenarioOutput = structuredClone(contract);
fabricatedScenarioOutput.gate7CompletionReceipt.scenarioOutputCount = 1;
fabricatedScenarioOutput.gate7CompletionReceipt.scenarioOutputs = [{ familyKey: 'rent_stress' }];
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(fabricatedScenarioOutput), false);

const fabricatedScenarioEvidence = structuredClone(contract);
fabricatedScenarioEvidence.gate6Handoff.scenarioEvidenceAvailable = true;
fabricatedScenarioEvidence.gate6Handoff.scenarioEvidence = [{ claim: 'fabricated downside' }];
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(fabricatedScenarioEvidence), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.gate7CompletionReceipt.riskClassificationAuthorized = true;
classifiedRisk.coverage.riskClassificationCount = 1;
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(classifiedRisk), false);

const executedMemo = structuredClone(contract);
executedMemo.gate6Handoff.riskComponentExecutionAuthorized = true;
executedMemo.gate6Handoff.memoExecutionAuthorized = true;
executedMemo.coverage.memoComponentExecutionCount = 1;
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(executedMemo), false);

const mutatedGate6Sequence = structuredClone(contract);
mutatedGate6Sequence.gate6Handoff.upstreamGate6SequencingMutated = true;
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(mutatedGate6Sequence), false);

const customerAuthorized = structuredClone(contract);
customerAuthorized.gate7CompletionReceipt.customerSurfaceAuthorized = true;
customerAuthorized.gate6Handoff.customerSurfaceAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(customerAuthorized), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate7CompletionReceipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
  executionContract: buildCanonicalGate7D('gate-7e-second-core-only'),
});
assert.equal(isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(secondContract), true);
assert.equal(secondContract.upstreamReceipt.corePublishable, true);
assert.equal(secondContract.gate7CompletionReceipt.established, true);
assert.equal(secondContract.gate7CompletionReceipt.scenarioOutputCount, 0);
assert.equal(secondContract.gate6Handoff.memoExecutionAuthorized, false);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scenario-engine-completion-handoff-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scenario-engine-execution-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-scenario-engine-completion-handoff-contract-smoke: PASS');
