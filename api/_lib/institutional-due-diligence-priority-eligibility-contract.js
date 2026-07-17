import { isCanonicalInstitutionalDueDiligenceCoverageClassificationContract } from './institutional-due-diligence-coverage-classification-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_due_diligence_priority_eligibility_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unavailablePriority(classification) {
  const limitationCodes = [];
  if (classification.requirementPolicyState !== 'established') {
    limitationCodes.push('APPROVED_DUE_DILIGENCE_REQUIREMENT_POLICY_NOT_ESTABLISHED');
  }
  if (!classification.documentGapEstablished && !classification.adverseFindingEstablished) {
    limitationCodes.push('CANONICAL_DILIGENCE_ISSUE_NOT_ESTABLISHED');
  }
  return {
    categoryKey: classification.categoryKey,
    coverageState: classification.coverageState,
    acceptedEvidenceReferenceCount: classification.acceptedEvidenceReferences.length,
    documentGapEstablished: classification.documentGapEstablished,
    adverseFindingEstablished: classification.adverseFindingEstablished,
    priorityPolicyState: 'not_established',
    priorityAuthorityState: 'not_established',
    priorityEligible: false,
    priority: null,
    action: null,
    owner: null,
    deadline: null,
    limitationCodes,
    riskClassificationAuthorized: false,
    memoExecutionAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(coverageClassificationContract) {
  const priorityEligibility = Object.fromEntries(
    Object.entries(coverageClassificationContract.classifications).map(([key, classification]) => [
      key,
      unavailablePriority(classification),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: coverageClassificationContract,
    upstreamReceipt: {
      source: coverageClassificationContract.source,
      contractVersion: coverageClassificationContract.contractVersion,
      jobId: coverageClassificationContract.upstreamReceipt.jobId,
      corePublishable: coverageClassificationContract.upstreamReceipt.corePublishable,
      exactCanonicalGate8BReceipt: true,
      classifiedCategoryCount: coverageClassificationContract.coverage.classifiedCategoryCount,
      establishedDocumentGapCount:
        coverageClassificationContract.coverage.establishedDocumentGapCount,
      establishedAdverseFindingCount:
        coverageClassificationContract.coverage.establishedAdverseFindingCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicPriorityEligibilityOnly: true,
      establishedCanonicalIssueRequired: true,
      approvedPriorityPolicyRequired: true,
      evidenceLimitationPromotedToPriority: false,
      acceptedEvidencePromotedToPriority: false,
      callerPriorityAccepted: false,
      callerActionAccepted: false,
      prioritiesAssigned: false,
      actionsAssigned: false,
      riskClassificationAuthorized: false,
      memoComponentsExecuted: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalDiligencePriorityAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    priorityEligibility,
    priorityReceipt: {
      authorityState: 'not_established',
      established: false,
      approvedPriorityPolicyAvailable: false,
      eligibleCategoryKeys: [],
      assignedPriorities: [],
      assignedActions: [],
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      assessedCategoryCount: Object.keys(priorityEligibility).length,
      totalCategoryCount: Object.keys(priorityEligibility).length,
      eligiblePriorityCount: 0,
      assignedPriorityCount: 0,
      assignedActionCount: 0,
      riskClassificationCount: 0,
      memoComponentExecutionCount: 0,
    },
    gate8Receipt: {
      authorityState: 'not_established',
      established: false,
      priorityReceiptEstablished: false,
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
  coverageClassificationContract,
} = {}) {
  if (!isCanonicalInstitutionalDueDiligenceCoverageClassificationContract(coverageClassificationContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_8B_COVERAGE_CLASSIFICATION_REQUIRED_FOR_GATE_8C_PRIORITY_ELIGIBILITY');
  }
  return deepFreeze(assembleContract(coverageClassificationContract));
}

export const INSTITUTIONAL_DUE_DILIGENCE_PRIORITY_ELIGIBILITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  deterministicPriorityEligibilityOnly: true,
  prioritiesAssigned: false,
  actionsAssigned: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
