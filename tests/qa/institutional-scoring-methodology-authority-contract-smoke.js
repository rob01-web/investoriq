import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate9A } from './fixtures/institutional-gate-9-chain.js';
import {
  buildCanonicalInstitutionalScoringMethodologyAuthorityContract,
  isCanonicalInstitutionalScoringMethodologyAuthorityContract,
} from '../../api/_lib/institutional-scoring-methodology-authority-contract.js';

const scoringInputLineageContract = buildCanonicalGate9A('gate-9b-job');
const contract = buildCanonicalInstitutionalScoringMethodologyAuthorityContract({
  scoringInputLineageContract,
});

assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.methodologies.financial), true);
assert.equal(contract.upstreamReceipt.jobId, 'gate-9b-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate9AReceipt, true);
assert.equal(contract.upstreamReceipt.registeredDimensionCount, 6);
assert.equal(contract.upstreamReceipt.scoringInputEligibleDimensionCount, 0);
assert.deepEqual(Object.keys(contract.methodologies), [
  'operational',
  'financial',
  'debt',
  'incomeStability',
  'valueAdd',
  'executionRisk',
]);
for (const methodology of Object.values(contract.methodologies)) {
  assert.equal(methodology.approvedMethodologyPolicyAvailable, false);
  assert.equal(methodology.approvedPolicyId, null);
  assert.equal(methodology.weight, null);
  assert.deepEqual(methodology.thresholds, []);
  assert.equal(methodology.normalizationFormula, null);
  assert.deepEqual(methodology.classificationBands, []);
  assert.equal(methodology.missingDimensionBehavior, 'collapse_dimension_no_reweighting');
  assert.equal(methodology.methodologyAuthorityState, 'not_established');
  assert.equal(methodology.scoringEligible, false);
  assert.equal(methodology.reportPublicationBlocker, false);
}
assert.deepEqual(contract.overallScorePolicy, {
  authorityState: 'not_established',
  established: false,
  approvedPolicyId: null,
  approvedPolicyVersion: null,
  approvedEffectiveDate: null,
  approvalReceipt: null,
  weightSum: null,
  overallFormula: null,
  overallThresholds: [],
  missingDimensionBehavior: 'collapse_dimension_no_reweighting',
  overallScoreEligible: false,
  reportPublicationBlocker: false,
});
assert.equal(contract.coverage.registeredDimensionCount, 6);
assert.equal(contract.coverage.approvedWeightCount, 0);
assert.equal(contract.coverage.approvedThresholdSetCount, 0);
assert.equal(contract.coverage.approvedNormalizationFormulaCount, 0);
assert.equal(contract.coverage.scoringEligibleDimensionCount, 0);
assert.equal(contract.coverage.reweightedDimensionCount, 0);
assert.equal(contract.methodologyReceipt.established, false);
assert.equal(contract.gate9Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredPolicy = buildCanonicalInstitutionalScoringMethodologyAuthorityContract({
  scoringInputLineageContract,
  policy: { approved: true },
  weights: { financial: 100 },
  thresholds: { financial: [50, 80] },
  screeningDealScore: 99,
});
assert.deepEqual(ignoredPolicy, contract);

const tamperedInput = structuredClone(scoringInputLineageContract);
tamperedInput.dimensions.financial.scoringInputEligible = true;
assert.throws(
  () => buildCanonicalInstitutionalScoringMethodologyAuthorityContract({
    scoringInputLineageContract: tamperedInput,
  }),
  /COMPLETE_CANONICAL_GATE_9A_INPUT_LINEAGE_REQUIRED_FOR_GATE_9B_METHODOLOGY_AUTHORITY/
);

const fabricatedWeight = structuredClone(contract);
fabricatedWeight.methodologies.financial.weight = 100;
fabricatedWeight.coverage.approvedWeightCount = 1;
assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(fabricatedWeight), false);

const fabricatedThreshold = structuredClone(contract);
fabricatedThreshold.methodologies.debt.thresholds = [25, 50, 75];
assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(fabricatedThreshold), false);

const redistributedWeight = structuredClone(contract);
redistributedWeight.methodologies.operational.missingDimensionBehavior = 'redistribute_weight';
redistributedWeight.policy.missingDimensionReweightingAllowed = true;
assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(redistributedWeight), false);

const screeningReuse = structuredClone(contract);
screeningReuse.policy.screeningScoreReuseAllowed = true;
assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(screeningReuse), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScoringMethodologyAuthorityContract(publicationBlocked), false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scoring-methodology-authority-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['\"](.+)['\"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scoring-input-lineage-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['\"](?:BUY|SELL)['\"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('delivery-gate'), false);

console.log('institutional-scoring-methodology-authority-contract-smoke: PASS');
