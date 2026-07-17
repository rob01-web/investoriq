import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate8D } from './fixtures/institutional-gate-8-chain.js';
import {
  buildCanonicalInstitutionalScoringInputLineageContract,
  isCanonicalInstitutionalScoringInputLineageContract,
} from '../../api/_lib/institutional-scoring-input-lineage-contract.js';

const dueDiligenceCompletionContract = buildCanonicalGate8D('gate-9a-job');
const contract = buildCanonicalInstitutionalScoringInputLineageContract({
  dueDiligenceCompletionContract,
});

assert.equal(isCanonicalInstitutionalScoringInputLineageContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.dimensions.operational), true);
assert.equal(contract.upstreamReceipt.jobId, 'gate-9a-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate8DReceipt, true);
assert.equal(contract.upstreamReceipt.gate8ArchitectureComplete, true);
assert.equal(
  contract.upstreamReceipt.gate8CompletionReceiptKey,
  'canonical_gate_8_due_diligence_engine_completion_receipt'
);
assert.deepEqual(Object.keys(contract.dimensions), [
  'operational',
  'financial',
  'debt',
  'incomeStability',
  'valueAdd',
  'executionRisk',
]);
for (const [dimensionKey, dimension] of Object.entries(contract.dimensions)) {
  assert.equal(dimension.dimensionKey, dimensionKey);
  assert.equal(dimension.eligibleLineageReceiptKeys.length >= 2, true);
  assert.equal(dimension.approvedScoringInputPolicyAvailable, false);
  assert.deepEqual(dimension.selectedScoringInputs, []);
  assert.deepEqual(dimension.copiedNumericValues, []);
  assert.equal(dimension.scoringInputAuthorityState, 'not_established');
  assert.equal(dimension.scoringInputEligible, false);
  assert.equal(dimension.score, null);
  assert.equal(dimension.classification, null);
  assert.equal(dimension.reportPublicationBlocker, false);
}
assert.equal(contract.coverage.registeredDimensionCount, 6);
assert.equal(contract.coverage.lineageCataloguedDimensionCount, 6);
assert.equal(contract.coverage.scoringInputEligibleDimensionCount, 0);
assert.equal(contract.coverage.selectedScoringInputCount, 0);
assert.equal(contract.coverage.copiedNumericValueCount, 0);
assert.equal(contract.scoringInputReceipt.established, false);
assert.equal(contract.gate9Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredFabrication = buildCanonicalInstitutionalScoringInputLineageContract({
  dueDiligenceCompletionContract,
  scoringInputs: { financial: [{ value: 99, source: 'caller' }] },
  scores: { financial: 100 },
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredFabrication, contract);

assert.throws(
  () => buildCanonicalInstitutionalScoringInputLineageContract({
    dueDiligenceCompletionContract: {
      source: 'canonical_institutional_due_diligence_completion_handoff_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_8D_HANDOFF_REQUIRED_FOR_GATE_9A_SCORING_INPUT_LINEAGE/
);

const tamperedUpstream = structuredClone(dueDiligenceCompletionContract);
tamperedUpstream.gate8CompletionReceipt.assignedPriorityCount = 1;
assert.throws(
  () => buildCanonicalInstitutionalScoringInputLineageContract({
    dueDiligenceCompletionContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_8D_HANDOFF_REQUIRED_FOR_GATE_9A_SCORING_INPUT_LINEAGE/
);

const fabricatedInput = structuredClone(contract);
fabricatedInput.dimensions.financial.selectedScoringInputs = [{ value: 42 }];
fabricatedInput.dimensions.financial.copiedNumericValues = [42];
fabricatedInput.dimensions.financial.scoringInputEligible = true;
assert.equal(isCanonicalInstitutionalScoringInputLineageContract(fabricatedInput), false);

const screeningReuse = structuredClone(contract);
screeningReuse.policy.screeningScoreReuseAllowed = true;
assert.equal(isCanonicalInstitutionalScoringInputLineageContract(screeningReuse), false);

const fabricatedScore = structuredClone(contract);
fabricatedScore.dimensions.operational.score = 75;
fabricatedScore.coverage.scoredDimensionCount = 1;
assert.equal(isCanonicalInstitutionalScoringInputLineageContract(fabricatedScore), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.scoringInputReceipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScoringInputLineageContract(publicationBlocked), false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scoring-input-lineage-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['\"](.+)['\"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-due-diligence-completion-handoff-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['\"](?:BUY|SELL)['\"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('delivery-gate'), false);

console.log('institutional-scoring-input-lineage-contract-smoke: PASS');
