import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate9B } from './fixtures/institutional-gate-9-chain.js';
import {
  buildCanonicalInstitutionalScoringExecutionContract,
  isCanonicalInstitutionalScoringExecutionContract,
} from '../../api/_lib/institutional-scoring-execution-contract.js';

const methodologyAuthorityContract = buildCanonicalGate9B('gate-9c-job');
const contract = buildCanonicalInstitutionalScoringExecutionContract({
  methodologyAuthorityContract,
});

assert.equal(isCanonicalInstitutionalScoringExecutionContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.executions.debt), true);
assert.equal(contract.upstreamReceipt.jobId, 'gate-9c-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate9BReceipt, true);
assert.equal(contract.upstreamReceipt.registeredDimensionCount, 6);
assert.equal(contract.upstreamReceipt.approvedWeightCount, 0);
assert.equal(contract.upstreamReceipt.scoringEligibleDimensionCount, 0);
assert.deepEqual(Object.keys(contract.executions), [
  'operational',
  'financial',
  'debt',
  'incomeStability',
  'valueAdd',
  'executionRisk',
]);
for (const execution of Object.values(contract.executions)) {
  assert.equal(execution.executionState, 'collapsed_ineligible');
  assert.equal(execution.calculationAttempted, false);
  assert.deepEqual(execution.inputValuesConsumed, []);
  assert.equal(execution.weightApplied, null);
  assert.equal(execution.rawScore, null);
  assert.equal(execution.weightedScore, null);
  assert.equal(execution.classification, null);
  assert.equal(execution.strengthClassification, false);
  assert.equal(execution.weaknessClassification, false);
  assert.equal(execution.riskClassification, false);
  assert.equal(execution.reportPublicationBlocker, false);
}
assert.deepEqual(contract.overallExecution, {
  executionState: 'collapsed_ineligible',
  calculationAttempted: false,
  eligibleDimensionKeys: [],
  scoredDimensionKeys: [],
  reweightedDimensionKeys: [],
  overallScore: null,
  overallClassification: null,
  ranking: null,
  strengths: [],
  weaknesses: [],
  principalRisks: [],
  recommendation: null,
  recommendationConfidence: null,
  reportPublicationBlocker: false,
});
assert.equal(contract.executionReceipt.executionCompleted, true);
assert.equal(contract.executionReceipt.established, false);
assert.equal(contract.executionReceipt.calculationAttemptCount, 0);
assert.equal(contract.coverage.collapsedDimensionCount, 6);
assert.equal(contract.coverage.scoredDimensionCount, 0);
assert.equal(contract.coverage.classifiedDimensionCount, 0);
assert.equal(contract.coverage.reweightedDimensionCount, 0);
assert.equal(contract.gate9Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredFabrication = buildCanonicalInstitutionalScoringExecutionContract({
  methodologyAuthorityContract,
  scores: { operational: 90 },
  overallScore: 90,
  classifications: { operational: 'strength' },
  recommendation: 'approve',
});
assert.deepEqual(ignoredFabrication, contract);

const tamperedMethodology = structuredClone(methodologyAuthorityContract);
tamperedMethodology.methodologies.financial.weight = 1;
assert.throws(
  () => buildCanonicalInstitutionalScoringExecutionContract({
    methodologyAuthorityContract: tamperedMethodology,
  }),
  /COMPLETE_CANONICAL_GATE_9B_METHODOLOGY_AUTHORITY_REQUIRED_FOR_GATE_9C_SCORING_EXECUTION/
);

const fabricatedScore = structuredClone(contract);
fabricatedScore.executions.operational.calculationAttempted = true;
fabricatedScore.executions.operational.rawScore = 80;
fabricatedScore.coverage.scoredDimensionCount = 1;
assert.equal(isCanonicalInstitutionalScoringExecutionContract(fabricatedScore), false);

const fabricatedOverall = structuredClone(contract);
fabricatedOverall.overallExecution.overallScore = 80;
fabricatedOverall.overallExecution.overallClassification = 'strong';
assert.equal(isCanonicalInstitutionalScoringExecutionContract(fabricatedOverall), false);

const reweighted = structuredClone(contract);
reweighted.overallExecution.reweightedDimensionKeys = ['financial'];
reweighted.coverage.reweightedDimensionCount = 1;
assert.equal(isCanonicalInstitutionalScoringExecutionContract(reweighted), false);

const fabricatedConclusions = structuredClone(contract);
fabricatedConclusions.overallExecution.strengths = ['Strong operations'];
fabricatedConclusions.overallExecution.weaknesses = ['Weak debt'];
fabricatedConclusions.overallExecution.principalRisks = ['Execution risk'];
fabricatedConclusions.overallExecution.recommendation = 'approve';
assert.equal(isCanonicalInstitutionalScoringExecutionContract(fabricatedConclusions), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScoringExecutionContract(publicationBlocked), false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scoring-execution-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['\"](.+)['\"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scoring-methodology-authority-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['\"](?:BUY|SELL)['\"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('delivery-gate'), false);

console.log('institutional-scoring-execution-contract-smoke: PASS');
