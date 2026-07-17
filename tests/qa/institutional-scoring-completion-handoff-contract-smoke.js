import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate9C } from './fixtures/institutional-gate-9-chain.js';
import {
  buildCanonicalInstitutionalScoringCompletionHandoffContract,
  isCanonicalInstitutionalScoringCompletionHandoffContract,
} from '../../api/_lib/institutional-scoring-completion-handoff-contract.js';

const scoringExecutionContract = buildCanonicalGate9C('gate-9d-job');
const contract = buildCanonicalInstitutionalScoringCompletionHandoffContract({
  scoringExecutionContract,
});

assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.gate9CompletionReceipt), true);
assert.equal(Object.isFrozen(contract.gate6Handoff), true);
assert.equal(contract.upstreamReceipt.jobId, 'gate-9d-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate9CReceipt, true);
assert.equal(contract.upstreamReceipt.registeredDimensionCount, 6);
assert.equal(contract.upstreamReceipt.collapsedDimensionCount, 6);
assert.equal(contract.upstreamReceipt.scoredDimensionCount, 0);
assert.equal(contract.upstreamReceipt.classifiedDimensionCount, 0);
assert.deepEqual(contract.gate9CompletionReceipt, {
  receiptKey: 'canonical_gate_9_institutional_scoring_receipt',
  receiptVersion: 1,
  authorityState: 'established_collapsed_no_approved_scoring_policy',
  established: true,
  architectureComplete: true,
  scoringAnalysisState: 'complete_all_dimensions_collapsed',
  registeredDimensionCount: 6,
  scoringInputEligibleDimensionCount: 0,
  approvedWeightCount: 0,
  scoredDimensionCount: 0,
  classifiedDimensionCount: 0,
  overallScore: null,
  overallClassification: null,
  strengths: [],
  weaknesses: [],
  principalRisks: [],
  limitationCodes: [
    'APPROVED_SCORING_INPUT_POLICY_NOT_ESTABLISHED',
    'APPROVED_SCORING_METHODOLOGY_POLICY_NOT_ESTABLISHED',
    'NO_CANONICAL_SCORING_DIMENSION_ELIGIBLE_FOR_EXECUTION',
  ],
  memoExecutionAuthorized: false,
  customerSurfaceAuthorized: false,
  reportPublicationBlocker: false,
});
assert.equal(contract.gate6Handoff.canonicalGate9CompletionReceiptAvailable, true);
assert.equal(contract.gate6Handoff.deterministicStrengthClassificationReceiptAvailable, false);
assert.equal(contract.gate6Handoff.deterministicWeaknessClassificationReceiptAvailable, false);
assert.equal(contract.gate6Handoff.deterministicPrincipalRiskClassificationReceiptAvailable, false);
assert.deepEqual(contract.gate6Handoff.authorizedStrengths, []);
assert.deepEqual(contract.gate6Handoff.authorizedWeaknesses, []);
assert.deepEqual(contract.gate6Handoff.authorizedPrincipalRisks, []);
assert.equal(contract.gate6Handoff.recommendation, null);
assert.equal(contract.gate6Handoff.recommendationConfidence, null);
assert.equal(contract.gate6Handoff.strengthComponentExecutionAuthorized, false);
assert.equal(contract.gate6Handoff.weaknessComponentExecutionAuthorized, false);
assert.equal(contract.gate6Handoff.riskComponentExecutionAuthorized, false);
assert.equal(contract.gate6Handoff.recommendationExecutionAuthorized, false);
assert.equal(contract.gate6Handoff.confidenceExecutionAuthorized, false);
assert.equal(contract.gate6Handoff.memoExecutionAuthorized, false);
assert.deepEqual(contract.gate6Handoff.remainingRequiredRoadmapGates, []);
assert.equal(contract.gate6Handoff.nextRoadmapGate, 'gate_10_elite_presentation_and_pdf_system');
assert.equal(contract.gate6Handoff.upstreamGate6SequencingMutated, false);
assert.equal(contract.coverage.gate9ArchitectureComplete, true);
assert.equal(contract.coverage.gate9CompletionReceiptEstablished, true);
assert.equal(contract.coverage.scoringAnalysisCollapsed, true);
assert.equal(contract.coverage.memoComponentExecutionCount, 0);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredFabrication = buildCanonicalInstitutionalScoringCompletionHandoffContract({
  scoringExecutionContract,
  completionReceipt: { overallScore: 95 },
  gate6Handoff: { strengthComponentExecutionAuthorized: true },
  recommendation: 'approve',
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredFabrication, contract);

const tamperedExecution = structuredClone(scoringExecutionContract);
tamperedExecution.overallExecution.overallScore = 95;
assert.throws(
  () => buildCanonicalInstitutionalScoringCompletionHandoffContract({
    scoringExecutionContract: tamperedExecution,
  }),
  /COMPLETE_CANONICAL_GATE_9C_EXECUTION_REQUIRED_FOR_GATE_9D_COMPLETION_HANDOFF/
);

const fabricatedScore = structuredClone(contract);
fabricatedScore.gate9CompletionReceipt.overallScore = 95;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(fabricatedScore), false);

const fabricatedClassifications = structuredClone(contract);
fabricatedClassifications.gate9CompletionReceipt.strengths = ['Financial'];
fabricatedClassifications.gate6Handoff.authorizedStrengths = ['Financial'];
fabricatedClassifications.gate6Handoff.deterministicStrengthClassificationReceiptAvailable = true;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(fabricatedClassifications), false);

const executedMemo = structuredClone(contract);
executedMemo.gate6Handoff.memoExecutionAuthorized = true;
executedMemo.gate6Handoff.recommendation = 'approve';
executedMemo.coverage.memoComponentExecutionCount = 1;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(executedMemo), false);

const mutatedSequence = structuredClone(contract);
mutatedSequence.gate6Handoff.upstreamGate6SequencingMutated = true;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(mutatedSequence), false);

const customerAuthorized = structuredClone(contract);
customerAuthorized.gate9CompletionReceipt.customerSurfaceAuthorized = true;
customerAuthorized.gate6Handoff.customerSurfaceAuthorized = true;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(customerAuthorized), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScoringCompletionHandoffContract(publicationBlocked), false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scoring-completion-handoff-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['\"](.+)['\"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scoring-execution-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['\"](?:BUY|SELL)['\"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('delivery-gate'), false);

console.log('institutional-scoring-completion-handoff-contract-smoke: PASS');
