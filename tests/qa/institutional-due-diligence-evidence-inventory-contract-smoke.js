import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildGate7SourceTruth,
  buildCanonicalGate7EFromSourceTruth,
} from './fixtures/institutional-gate-7-chain.js';
import {
  buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract,
  isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract,
} from '../../api/_lib/institutional-due-diligence-evidence-inventory-contract.js';

function supportTextArtifact(id, filename, text) {
  return {
    id: `${id}-artifact`,
    file_id: `${id}-file`,
    original_filename: filename,
    type: 'document_text_extracted',
    payload: {
      file_id: `${id}-file`,
      original_filename: filename,
      text,
    },
  };
}

const sourceTruthPackage = buildGate7SourceTruth('gate-8a-job', [
  supportTextArtifact(
    'environmental',
    'Phase I ESA.pdf',
    'Phase I ESA / Environmental Due Diligence\nNo recognized environmental condition.'
  ),
  supportTextArtifact(
    'property-tax',
    'Property Tax Bill.pdf',
    'Property Tax Bill\nAnnual Tax $185,000\nAssessment roll 2026.'
  ),
]);
const gate7CompletionContract = buildCanonicalGate7EFromSourceTruth(sourceTruthPackage);
const contract = buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
  gate7CompletionContract,
  sourceTruthPackage,
});

assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.categories), true);
assert.equal(contract.source, 'canonical_institutional_due_diligence_evidence_inventory_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamGate7Contract, gate7CompletionContract);
assert.deepEqual(contract.sourceTruthPackage, sourceTruthPackage);
assert.equal(contract.upstreamReceipts.jobId, 'gate-8a-job');
assert.equal(contract.upstreamReceipts.corePublishable, true);
assert.equal(contract.upstreamReceipts.jobIdentityMatched, true);
assert.equal(contract.upstreamReceipts.coreAuthorityMatched, true);

assert.deepEqual(Object.keys(contract.categories), [
  'documentGaps',
  'leasesAndEstoppels',
  'insurance',
  'utilities',
  'environmental',
  'tax',
  'reserves',
]);
for (const category of Object.values(contract.categories)) {
  assert.equal(category.inventoryState, 'canonical_source_inventory_complete');
  assert.equal(category.requirementPolicyEstablished, false);
  assert.equal(category.documentRequirementEstablished, false);
  assert.equal(category.documentGapEstablished, false);
  assert.equal(category.negativePropertyConditionEstablished, false);
  assert.equal(category.priorityAuthorized, false);
  assert.equal(category.customerSurfaceAuthorized, false);
  assert.equal(category.reportPublicationBlocker, false);
}
assert.equal(contract.categories.documentGaps.evidenceAuthorityState, 'canonical_inventory_only');
assert.equal(contract.categories.leasesAndEstoppels.evidenceAuthorityState, 'core_operating_context_only');
assert.equal(contract.categories.leasesAndEstoppels.diligenceEvidenceAuthorized, false);
assert.deepEqual(contract.categories.leasesAndEstoppels.coreOperatingContext.map((entry) => entry.canonicalRole), [
  'core_rent_roll',
]);
assert.equal(contract.categories.insurance.evidenceAuthorityState, 'core_operating_context_only');
assert.equal(contract.categories.utilities.evidenceAuthorityState, 'core_operating_context_only');
assert.equal(contract.categories.environmental.evidenceAuthorityState, 'accepted_support_evidence_available');
assert.equal(contract.categories.environmental.diligenceEvidenceAuthorized, true);
assert.deepEqual(contract.categories.environmental.acceptedEvidence.map((entry) => entry.canonicalRole), [
  'environmental_context',
]);
assert.equal(contract.categories.tax.evidenceAuthorityState, 'accepted_support_evidence_available');
assert.equal(contract.categories.tax.diligenceEvidenceAuthorized, true);
assert.deepEqual(contract.categories.tax.acceptedEvidence.map((entry) => entry.canonicalRole), [
  'property_tax_support',
]);
assert.equal(contract.categories.reserves.evidenceAuthorityState, 'not_evidenced');
assert.equal(contract.coverage.inventoriedCategoryCount, 7);
assert.equal(contract.coverage.acceptedEvidenceCategoryCount, 2);
assert.equal(contract.coverage.coreContextOnlyCategoryCount, 3);
assert.equal(contract.coverage.notEvidencedCategoryCount, 1);
assert.equal(contract.coverage.documentGapCount, 0);
assert.equal(contract.coverage.priorityCount, 0);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
  gate7CompletionContract,
  sourceTruthPackage,
  insuranceDocument: { accepted: true },
  requiredDocuments: ['estoppels', 'insurance'],
  priorities: ['high'],
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
    gate7CompletionContract: { source: 'canonical_institutional_scenario_engine_completion_handoff_contract' },
    sourceTruthPackage,
  }),
  /COMPLETE_CANONICAL_GATE_7_RECEIPT_REQUIRED_FOR_GATE_8A_DILIGENCE_INVENTORY/
);
assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
    gate7CompletionContract,
    sourceTruthPackage: { source: 'canonical_source_truth_package', schema_version: 1 },
  }),
  /COMPLETE_CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_GATE_8A_DILIGENCE_INVENTORY/
);

const mismatchedSourceTruth = buildGate7SourceTruth('different-job');
assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
    gate7CompletionContract,
    sourceTruthPackage: mismatchedSourceTruth,
  }),
  /GATE_7_AND_SOURCE_TRUTH_AUTHORITY_MUST_MATCH_FOR_GATE_8A_DILIGENCE_INVENTORY/
);

const counterfeitAcceptedEvidence = structuredClone(sourceTruthPackage);
counterfeitAcceptedEvidence.support.accepted.push({
  file_id: 'counterfeit-file',
  canonical_role: 'environmental_context',
  primary_for_role: true,
  authority_decision: { roleAccepted: false, fileId: 'counterfeit-file', canonicalRole: 'environmental_context' },
});
assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
    gate7CompletionContract,
    sourceTruthPackage: counterfeitAcceptedEvidence,
  }),
  /COMPLETE_CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_GATE_8A_DILIGENCE_INVENTORY/
);

const promotedCoreContext = structuredClone(contract);
promotedCoreContext.categories.insurance.diligenceEvidenceAuthorized = true;
promotedCoreContext.categories.insurance.evidenceAuthorityState = 'accepted_support_evidence_available';
assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(promotedCoreContext), false);

const inferredDocumentGap = structuredClone(contract);
inferredDocumentGap.categories.reserves.documentRequirementEstablished = true;
inferredDocumentGap.categories.reserves.documentGapEstablished = true;
inferredDocumentGap.coverage.documentGapCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(inferredDocumentGap), false);

const inferredNegativeCondition = structuredClone(contract);
inferredNegativeCondition.categories.environmental.negativePropertyConditionEstablished = true;
assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(inferredNegativeCondition), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.categories.reserves.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(publicationBlocked), false);

const coreOnlySourceTruth = buildGate7SourceTruth('gate-8a-core-only');
const coreOnlyContract = buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
  gate7CompletionContract: buildCanonicalGate7EFromSourceTruth(coreOnlySourceTruth),
  sourceTruthPackage: coreOnlySourceTruth,
});
assert.equal(isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(coreOnlyContract), true);
assert.equal(coreOnlyContract.coverage.acceptedEvidenceCategoryCount, 0);
assert.equal(coreOnlyContract.coverage.documentGapCount, 0);
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-due-diligence-evidence-inventory-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, [
  './source-truth-package.js',
  './institutional-scenario-engine-completion-handoff-contract.js',
]);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-due-diligence-evidence-inventory-contract-smoke: PASS');
