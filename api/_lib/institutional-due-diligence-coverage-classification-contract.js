import { isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract } from './institutional-due-diligence-evidence-inventory-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_due_diligence_coverage_classification_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function coverageStateFor(category) {
  if (category.evidenceAuthorityState === 'accepted_support_evidence_available') {
    return 'accepted_evidence_available';
  }
  if (category.evidenceAuthorityState === 'core_operating_context_only') {
    return 'core_context_only_not_diligence_document_authority';
  }
  if (category.evidenceAuthorityState === 'source_present_not_authority_accepted') {
    return 'source_present_not_authority_accepted';
  }
  if (category.evidenceAuthorityState === 'canonical_inventory_only') {
    return 'inventory_complete_no_requirement_assessment';
  }
  return 'not_evidenced';
}

function classifyCoverage(category) {
  const coverageState = coverageStateFor(category);
  return {
    categoryKey: category.categoryKey,
    coverageState,
    acceptedEvidenceCount: category.acceptedEvidence.length,
    coreContextCount: category.coreOperatingContext.length,
    advisorySourceCount: category.advisorySourcePresence.length,
    acceptedEvidenceReferences: category.acceptedEvidence.map((entry) => ({
      sourceIdentityKey: entry.sourceIdentityKey,
      canonicalRole: entry.canonicalRole,
    })),
    evidenceLimitationEstablished: ![
      'accepted_evidence_available',
      'inventory_complete_no_requirement_assessment',
    ].includes(coverageState),
    requirementPolicyState: 'not_established',
    documentGapState: 'not_assessed_no_approved_requirement_policy',
    documentGapEstablished: false,
    adverseFindingEstablished: false,
    propertyConditionConclusion: null,
    priorityAuthorized: false,
    memoExecutionAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(evidenceInventoryContract) {
  const classifications = Object.fromEntries(
    Object.entries(evidenceInventoryContract.categories).map(([key, category]) => [
      key,
      classifyCoverage(category),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: evidenceInventoryContract,
    upstreamReceipt: {
      source: evidenceInventoryContract.source,
      contractVersion: evidenceInventoryContract.contractVersion,
      jobId: evidenceInventoryContract.upstreamReceipts.jobId,
      corePublishable: evidenceInventoryContract.upstreamReceipts.corePublishable,
      exactCanonicalGate8AReceipt: true,
      inventoriedCategoryCount: evidenceInventoryContract.coverage.inventoriedCategoryCount,
      acceptedEvidenceCategoryCount: evidenceInventoryContract.coverage.acceptedEvidenceCategoryCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      neutralCoverageClassificationOnly: true,
      evidenceAbsenceMayEstablishRequirement: false,
      evidenceAbsenceMayEstablishDocumentGap: false,
      evidenceAbsenceMayEstablishAdverseCondition: false,
      coreContextMayEstablishDiligenceDocumentCoverage: false,
      advisorySourceMayEstablishAcceptedCoverage: false,
      callerRequirementPolicyAccepted: false,
      callerGapClassificationAccepted: false,
      prioritiesAssigned: false,
      riskClassificationAuthorized: false,
      memoComponentsExecuted: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalDiligenceCoverageLimitationMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    classifications,
    gapRegistry: {
      requirementPolicyState: 'not_established',
      establishedDocumentGaps: [],
      establishedAdverseFindings: [],
      unresolvedRequirementAssessments: Object.values(classifications)
        .map((classification) => classification.categoryKey),
      priorityAssignmentAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      classifiedCategoryCount: Object.keys(classifications).length,
      totalCategoryCount: Object.keys(classifications).length,
      acceptedEvidenceCategoryCount: Object.values(classifications)
        .filter((classification) => classification.coverageState === 'accepted_evidence_available').length,
      evidenceLimitationCategoryCount: Object.values(classifications)
        .filter((classification) => classification.evidenceLimitationEstablished).length,
      establishedDocumentGapCount: 0,
      establishedAdverseFindingCount: 0,
      priorityCount: 0,
    },
    gate8Receipt: {
      authorityState: 'not_established',
      established: false,
      prioritiesAuthorized: false,
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
  evidenceInventoryContract,
} = {}) {
  if (!isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(evidenceInventoryContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_8A_EVIDENCE_INVENTORY_REQUIRED_FOR_GATE_8B_COVERAGE_CLASSIFICATION');
  }
  return deepFreeze(assembleContract(evidenceInventoryContract));
}

export const INSTITUTIONAL_DUE_DILIGENCE_COVERAGE_CLASSIFICATION_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  neutralCoverageClassificationOnly: true,
  documentGapsEstablished: false,
  prioritiesAssigned: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
