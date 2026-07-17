import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate8A } from './fixtures/institutional-gate-8-chain.js';
import {
  buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract,
  isCanonicalInstitutionalDueDiligenceCoverageClassificationContract,
} from '../../api/_lib/institutional-due-diligence-coverage-classification-contract.js';

const evidenceInventoryContract = buildCanonicalGate8A('gate-8b-job');
const contract = buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
  evidenceInventoryContract,
});

assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.classifications), true);
assert.equal(contract.source, 'canonical_institutional_due_diligence_coverage_classification_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, evidenceInventoryContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-8b-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate8AReceipt, true);
assert.equal(contract.upstreamReceipt.inventoriedCategoryCount, 7);
assert.equal(contract.upstreamReceipt.acceptedEvidenceCategoryCount, 2);

assert.deepEqual(Object.keys(contract.classifications), [
  'documentGaps',
  'leasesAndEstoppels',
  'insurance',
  'utilities',
  'environmental',
  'tax',
  'reserves',
]);
for (const classification of Object.values(contract.classifications)) {
  assert.equal(classification.requirementPolicyState, 'not_established');
  assert.equal(classification.documentGapState, 'not_assessed_no_approved_requirement_policy');
  assert.equal(classification.documentGapEstablished, false);
  assert.equal(classification.adverseFindingEstablished, false);
  assert.equal(classification.propertyConditionConclusion, null);
  assert.equal(classification.priorityAuthorized, false);
  assert.equal(classification.memoExecutionAuthorized, false);
  assert.equal(classification.customerSurfaceAuthorized, false);
  assert.equal(classification.reportPublicationBlocker, false);
}
assert.equal(contract.classifications.documentGaps.coverageState, 'inventory_complete_no_requirement_assessment');
assert.equal(contract.classifications.documentGaps.evidenceLimitationEstablished, false);
assert.equal(
  contract.classifications.leasesAndEstoppels.coverageState,
  'core_context_only_not_diligence_document_authority'
);
assert.equal(contract.classifications.leasesAndEstoppels.evidenceLimitationEstablished, true);
assert.equal(contract.classifications.environmental.coverageState, 'accepted_evidence_available');
assert.deepEqual(contract.classifications.environmental.acceptedEvidenceReferences, [{
  sourceIdentityKey: 'file:environmental-file',
  canonicalRole: 'environmental_context',
}]);
assert.equal(contract.classifications.environmental.evidenceLimitationEstablished, false);
assert.equal(contract.classifications.tax.coverageState, 'accepted_evidence_available');
assert.equal(contract.classifications.reserves.coverageState, 'not_evidenced');
assert.equal(contract.classifications.reserves.evidenceLimitationEstablished, true);
assert.equal(contract.gapRegistry.establishedDocumentGaps.length, 0);
assert.equal(contract.gapRegistry.establishedAdverseFindings.length, 0);
assert.equal(contract.gapRegistry.unresolvedRequirementAssessments.length, 7);
assert.equal(contract.coverage.classifiedCategoryCount, 7);
assert.equal(contract.coverage.acceptedEvidenceCategoryCount, 2);
assert.equal(contract.coverage.evidenceLimitationCategoryCount, 4);
assert.equal(contract.coverage.establishedDocumentGapCount, 0);
assert.equal(contract.coverage.establishedAdverseFindingCount, 0);
assert.equal(contract.coverage.priorityCount, 0);
assert.equal(contract.gate8Receipt.established, false);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
  evidenceInventoryContract,
  requirementPolicy: { insurance: 'required' },
  documentGaps: ['insurance'],
  adverseFindings: ['environmental'],
  priorities: ['high'],
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
    evidenceInventoryContract: {
      source: 'canonical_institutional_due_diligence_evidence_inventory_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_8A_EVIDENCE_INVENTORY_REQUIRED_FOR_GATE_8B_COVERAGE_CLASSIFICATION/
);

const tamperedUpstream = structuredClone(evidenceInventoryContract);
tamperedUpstream.categories.insurance.diligenceEvidenceAuthorized = true;
assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
    evidenceInventoryContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_8A_EVIDENCE_INVENTORY_REQUIRED_FOR_GATE_8B_COVERAGE_CLASSIFICATION/
);

const inferredRequirement = structuredClone(contract);
inferredRequirement.classifications.insurance.requirementPolicyState = 'established';
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(inferredRequirement), false);

const inferredGap = structuredClone(contract);
inferredGap.classifications.insurance.documentGapEstablished = true;
inferredGap.gapRegistry.establishedDocumentGaps = ['insurance'];
inferredGap.coverage.establishedDocumentGapCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(inferredGap), false);

const inferredAdverseFinding = structuredClone(contract);
inferredAdverseFinding.classifications.environmental.adverseFindingEstablished = true;
inferredAdverseFinding.classifications.environmental.propertyConditionConclusion = 'adverse';
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(inferredAdverseFinding), false);

const coreContextPromoted = structuredClone(contract);
coreContextPromoted.classifications.utilities.coverageState = 'accepted_evidence_available';
coreContextPromoted.classifications.utilities.evidenceLimitationEstablished = false;
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(coreContextPromoted), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate8Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
  evidenceInventoryContract: buildCanonicalGate8A('gate-8b-second'),
});
assert.equal(isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(secondContract), true);
assert.equal(secondContract.coverage.establishedDocumentGapCount, 0);
assert.equal(secondContract.coverage.establishedAdverseFindingCount, 0);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-due-diligence-coverage-classification-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-due-diligence-evidence-inventory-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-due-diligence-coverage-classification-contract-smoke: PASS');
