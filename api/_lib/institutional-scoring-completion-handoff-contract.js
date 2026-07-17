import { isCanonicalInstitutionalScoringExecutionContract } from './institutional-scoring-execution-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scoring_completion_handoff_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assembleContract(scoringExecutionContract) {
  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: scoringExecutionContract,
    upstreamReceipt: {
      source: scoringExecutionContract.source,
      contractVersion: scoringExecutionContract.contractVersion,
      jobId: scoringExecutionContract.upstreamReceipt.jobId,
      corePublishable: scoringExecutionContract.upstreamReceipt.corePublishable,
      exactCanonicalGate9CReceipt: true,
      registeredDimensionCount: scoringExecutionContract.coverage.registeredDimensionCount,
      collapsedDimensionCount: scoringExecutionContract.coverage.collapsedDimensionCount,
      scoredDimensionCount: scoringExecutionContract.coverage.scoredDimensionCount,
      classifiedDimensionCount: scoringExecutionContract.coverage.classifiedDimensionCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      gate9ArchitectureCompletionOnly: true,
      collapsedExecutionMayCompleteArchitecture: true,
      collapsedExecutionMayClaimScore: false,
      collapsedExecutionMayClaimClassification: false,
      canonicalGate6HandoffOnly: true,
      upstreamGate6SequencingMutationAllowed: false,
      callerReceiptAccepted: false,
      callerHandoffAccepted: false,
      scoresCalculated: false,
      classificationsCreated: false,
      strengthsCreated: false,
      weaknessesCreated: false,
      principalRisksCreated: false,
      recommendationAuthorized: false,
      memoComponentsExecuted: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalScoringAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    gate9CompletionReceipt: {
      receiptKey: 'canonical_gate_9_institutional_scoring_receipt',
      receiptVersion: 1,
      authorityState: 'established_collapsed_no_approved_scoring_policy',
      established: true,
      architectureComplete: true,
      scoringAnalysisState: 'complete_all_dimensions_collapsed',
      registeredDimensionCount: scoringExecutionContract.coverage.registeredDimensionCount,
      scoringInputEligibleDimensionCount: 0,
      approvedWeightCount: 0,
      scoredDimensionCount: scoringExecutionContract.coverage.scoredDimensionCount,
      classifiedDimensionCount: scoringExecutionContract.coverage.classifiedDimensionCount,
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
    },
    gate6Handoff: {
      handoffKey: 'canonical_gate_9_to_gate_6_internal_handoff',
      targetGate: 'gate_6_investment_committee_memo',
      handoffState: 'available_collapsed_scoring_no_classification_authority',
      canonicalGate9CompletionReceiptAvailable: true,
      deterministicStrengthClassificationReceiptAvailable: false,
      deterministicWeaknessClassificationReceiptAvailable: false,
      deterministicPrincipalRiskClassificationReceiptAvailable: false,
      authorizedStrengths: [],
      authorizedWeaknesses: [],
      authorizedPrincipalRisks: [],
      recommendation: null,
      recommendationConfidence: null,
      strengthComponentExecutionAuthorized: false,
      weaknessComponentExecutionAuthorized: false,
      riskComponentExecutionAuthorized: false,
      recommendationExecutionAuthorized: false,
      confidenceExecutionAuthorized: false,
      memoExecutionAuthorized: false,
      remainingRequiredRoadmapGates: [],
      nextRoadmapGate: 'gate_10_elite_presentation_and_pdf_system',
      upstreamGate6SequencingMutated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      gate9ArchitectureComplete: true,
      gate9CompletionReceiptEstablished: true,
      scoringAnalysisCollapsed: true,
      registeredDimensionCount: scoringExecutionContract.coverage.registeredDimensionCount,
      scoringInputEligibleDimensionCount: 0,
      approvedWeightCount: 0,
      scoredDimensionCount: 0,
      classifiedDimensionCount: 0,
      strengthCount: 0,
      weaknessCount: 0,
      principalRiskCount: 0,
      memoComponentExecutionCount: 0,
      gate6InternalHandoffAvailable: true,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScoringCompletionHandoffContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScoringExecutionContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScoringCompletionHandoffContract({
  scoringExecutionContract,
} = {}) {
  if (!isCanonicalInstitutionalScoringExecutionContract(scoringExecutionContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_9C_EXECUTION_REQUIRED_FOR_GATE_9D_COMPLETION_HANDOFF');
  }
  return deepFreeze(assembleContract(scoringExecutionContract));
}

export const INSTITUTIONAL_SCORING_COMPLETION_HANDOFF_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  gate9ArchitectureCompletionOnly: true,
  scoresCreated: false,
  classificationsCreated: false,
  memoComponentsExecuted: false,
  downstreamRenderingAuthorized: false,
});
