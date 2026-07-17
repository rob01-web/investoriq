import { isCanonicalInstitutionalDueDiligencePriorityEligibilityContract } from './institutional-due-diligence-priority-eligibility-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_due_diligence_completion_handoff_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assembleContract(priorityEligibilityContract) {
  const coverageClassifications = priorityEligibilityContract.upstreamContract.classifications;
  const acceptedEvidenceCategoryKeys = Object.values(coverageClassifications)
    .filter((classification) => classification.coverageState === 'accepted_evidence_available')
    .map((classification) => classification.categoryKey);

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: priorityEligibilityContract,
    upstreamReceipt: {
      source: priorityEligibilityContract.source,
      contractVersion: priorityEligibilityContract.contractVersion,
      jobId: priorityEligibilityContract.upstreamReceipt.jobId,
      corePublishable: priorityEligibilityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate8CReceipt: true,
      assessedCategoryCount: priorityEligibilityContract.coverage.assessedCategoryCount,
      eligiblePriorityCount: priorityEligibilityContract.coverage.eligiblePriorityCount,
      assignedPriorityCount: priorityEligibilityContract.coverage.assignedPriorityCount,
      assignedActionCount: priorityEligibilityContract.coverage.assignedActionCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      gate8ArchitectureCompletionOnly: true,
      neutralCoverageMayCompleteArchitecture: true,
      neutralCoverageMayClaimDocumentGap: false,
      neutralCoverageMayClaimAdverseFinding: false,
      neutralCoverageMayCreatePriority: false,
      canonicalGate6HandoffOnly: true,
      upstreamGate6SequencingMutationAllowed: false,
      callerReceiptAccepted: false,
      callerHandoffAccepted: false,
      riskClassificationAuthorized: false,
      memoComponentsExecuted: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalDiligenceAnalysisAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    gate8CompletionReceipt: {
      receiptKey: 'canonical_gate_8_due_diligence_engine_completion_receipt',
      receiptVersion: 1,
      authorityState: 'established_neutral_coverage_no_approved_requirement_or_priority_policy',
      established: true,
      architectureComplete: true,
      coverageAnalysisState: 'complete_neutral_evidence_coverage_only',
      assessedCategoryCount: priorityEligibilityContract.coverage.assessedCategoryCount,
      acceptedEvidenceCategoryKeys,
      establishedDocumentGapCount:
        priorityEligibilityContract.upstreamReceipt.establishedDocumentGapCount,
      establishedAdverseFindingCount:
        priorityEligibilityContract.upstreamReceipt.establishedAdverseFindingCount,
      assignedPriorityCount: priorityEligibilityContract.coverage.assignedPriorityCount,
      assignedActionCount: priorityEligibilityContract.coverage.assignedActionCount,
      limitationCodes: [
        'APPROVED_DUE_DILIGENCE_REQUIREMENT_POLICY_NOT_ESTABLISHED',
        'APPROVED_DUE_DILIGENCE_PRIORITY_POLICY_NOT_ESTABLISHED',
      ],
      riskClassificationAuthorized: false,
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    gate6Handoff: {
      handoffKey: 'canonical_gate_8_to_gate_6_internal_handoff',
      targetGate: 'gate_6_investment_committee_memo',
      targetComponent: 'diligence',
      handoffState: 'available_neutral_coverage_no_authorized_priorities',
      canonicalGate8CompletionReceiptAvailable: true,
      neutralCoverageReceiptAvailable: true,
      acceptedEvidenceCategoryKeys,
      establishedDocumentGaps: [],
      establishedAdverseFindings: [],
      diligencePriorityReceiptAvailable: false,
      authorizedPriorities: [],
      authorizedActions: [],
      diligenceComponentExecutionAuthorized: false,
      memoExecutionAuthorized: false,
      remainingRequiredRoadmapGates: ['gate_9_institutional_scoring'],
      upstreamGate6SequencingMutated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      gate8ArchitectureComplete: true,
      gate8CompletionReceiptEstablished: true,
      assessedCategoryCount: priorityEligibilityContract.coverage.assessedCategoryCount,
      acceptedEvidenceCategoryCount: acceptedEvidenceCategoryKeys.length,
      establishedDocumentGapCount: 0,
      establishedAdverseFindingCount: 0,
      authorizedPriorityCount: 0,
      authorizedActionCount: 0,
      riskClassificationCount: 0,
      memoComponentExecutionCount: 0,
      gate6InternalHandoffAvailable: true,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
  priorityEligibilityContract,
} = {}) {
  if (!isCanonicalInstitutionalDueDiligencePriorityEligibilityContract(priorityEligibilityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_8C_PRIORITY_ELIGIBILITY_REQUIRED_FOR_GATE_8D_COMPLETION_HANDOFF');
  }
  return deepFreeze(assembleContract(priorityEligibilityContract));
}

export const INSTITUTIONAL_DUE_DILIGENCE_COMPLETION_HANDOFF_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  gate8ArchitectureCompletionOnly: true,
  documentGapsEstablished: false,
  prioritiesAssigned: false,
  memoComponentsExecuted: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
