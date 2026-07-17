import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate8B } from './fixtures/institutional-gate-8-chain.js';
import {
  buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract,
  isCanonicalInstitutionalDueDiligencePriorityEligibilityContract,
} from '../../api/_lib/institutional-due-diligence-priority-eligibility-contract.js';

const coverageClassificationContract = buildCanonicalGate8B('gate-8c-job');
const contract = buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
  coverageClassificationContract,
});

assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.priorityEligibility), true);
assert.equal(contract.source, 'canonical_institutional_due_diligence_priority_eligibility_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, coverageClassificationContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-8c-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate8BReceipt, true);
assert.equal(contract.upstreamReceipt.classifiedCategoryCount, 7);
assert.equal(contract.upstreamReceipt.establishedDocumentGapCount, 0);
assert.equal(contract.upstreamReceipt.establishedAdverseFindingCount, 0);

assert.deepEqual(Object.keys(contract.priorityEligibility), [
  'documentGaps',
  'leasesAndEstoppels',
  'insurance',
  'utilities',
  'environmental',
  'tax',
  'reserves',
]);
for (const priority of Object.values(contract.priorityEligibility)) {
  assert.equal(priority.documentGapEstablished, false);
  assert.equal(priority.adverseFindingEstablished, false);
  assert.equal(priority.priorityPolicyState, 'not_established');
  assert.equal(priority.priorityAuthorityState, 'not_established');
  assert.equal(priority.priorityEligible, false);
  assert.equal(priority.priority, null);
  assert.equal(priority.action, null);
  assert.equal(priority.owner, null);
  assert.equal(priority.deadline, null);
  assert.deepEqual(priority.limitationCodes, [
    'APPROVED_DUE_DILIGENCE_REQUIREMENT_POLICY_NOT_ESTABLISHED',
    'CANONICAL_DILIGENCE_ISSUE_NOT_ESTABLISHED',
  ]);
  assert.equal(priority.riskClassificationAuthorized, false);
  assert.equal(priority.memoExecutionAuthorized, false);
  assert.equal(priority.customerSurfaceAuthorized, false);
  assert.equal(priority.reportPublicationBlocker, false);
}
assert.equal(contract.priorityEligibility.environmental.acceptedEvidenceReferenceCount, 1);
assert.equal(contract.priorityEligibility.environmental.priorityEligible, false);
assert.equal(contract.priorityEligibility.reserves.acceptedEvidenceReferenceCount, 0);
assert.equal(contract.priorityEligibility.reserves.priorityEligible, false);
assert.equal(contract.priorityReceipt.established, false);
assert.equal(contract.priorityReceipt.approvedPriorityPolicyAvailable, false);
assert.deepEqual(contract.priorityReceipt.eligibleCategoryKeys, []);
assert.deepEqual(contract.priorityReceipt.assignedPriorities, []);
assert.deepEqual(contract.priorityReceipt.assignedActions, []);
assert.equal(contract.coverage.assessedCategoryCount, 7);
assert.equal(contract.coverage.eligiblePriorityCount, 0);
assert.equal(contract.coverage.assignedPriorityCount, 0);
assert.equal(contract.coverage.assignedActionCount, 0);
assert.equal(contract.gate8Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
  coverageClassificationContract,
  priorityPolicy: { approved: true },
  priorities: [{ category: 'insurance', priority: 'high' }],
  actions: [{ category: 'insurance', action: 'obtain policy' }],
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
    coverageClassificationContract: {
      source: 'canonical_institutional_due_diligence_coverage_classification_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_8B_COVERAGE_CLASSIFICATION_REQUIRED_FOR_GATE_8C_PRIORITY_ELIGIBILITY/
);

const tamperedUpstream = structuredClone(coverageClassificationContract);
tamperedUpstream.classifications.insurance.documentGapEstablished = true;
assert.throws(
  () => buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
    coverageClassificationContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_8B_COVERAGE_CLASSIFICATION_REQUIRED_FOR_GATE_8C_PRIORITY_ELIGIBILITY/
);

const evidencePromotedToPriority = structuredClone(contract);
evidencePromotedToPriority.priorityEligibility.environmental.priorityEligible = true;
evidencePromotedToPriority.priorityEligibility.environmental.priority = 'high';
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(evidencePromotedToPriority), false);

const limitationPromotedToAction = structuredClone(contract);
limitationPromotedToAction.priorityEligibility.reserves.action = 'fund reserves';
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(limitationPromotedToAction), false);

const inferredPolicy = structuredClone(contract);
inferredPolicy.priorityReceipt.approvedPriorityPolicyAvailable = true;
inferredPolicy.priorityReceipt.established = true;
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(inferredPolicy), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.priorityEligibility.tax.riskClassificationAuthorized = true;
classifiedRisk.coverage.riskClassificationCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(classifiedRisk), false);

const executedMemo = structuredClone(contract);
executedMemo.priorityEligibility.environmental.memoExecutionAuthorized = true;
executedMemo.coverage.memoComponentExecutionCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(executedMemo), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate8Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
  coverageClassificationContract: buildCanonicalGate8B('gate-8c-second'),
});
assert.equal(isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(secondContract), true);
assert.equal(secondContract.coverage.eligiblePriorityCount, 0);
assert.equal(secondContract.coverage.assignedActionCount, 0);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-due-diligence-priority-eligibility-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-due-diligence-coverage-classification-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-due-diligence-priority-eligibility-contract-smoke: PASS');
