import { isCanonicalInstitutionalScoringMethodologyAuthorityContract } from './institutional-scoring-methodology-authority-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scoring_execution_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function collapsedExecution(methodology) {
  return {
    dimensionKey: methodology.dimensionKey,
    methodologyAuthorityState: methodology.methodologyAuthorityState,
    scoringEligible: methodology.scoringEligible,
    executionState: 'collapsed_ineligible',
    calculationAttempted: false,
    inputValuesConsumed: [],
    weightApplied: null,
    rawScore: null,
    weightedScore: null,
    classification: null,
    strengthClassification: false,
    weaknessClassification: false,
    riskClassification: false,
    limitationCodes: methodology.limitationCodes,
    reportPublicationBlocker: false,
  };
}

function assembleContract(methodologyAuthorityContract) {
  const executions = Object.fromEntries(
    Object.entries(methodologyAuthorityContract.methodologies).map(([key, methodology]) => [
      key,
      collapsedExecution(methodology),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: methodologyAuthorityContract,
    upstreamReceipt: {
      source: methodologyAuthorityContract.source,
      contractVersion: methodologyAuthorityContract.contractVersion,
      jobId: methodologyAuthorityContract.upstreamReceipt.jobId,
      corePublishable: methodologyAuthorityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate9BReceipt: true,
      registeredDimensionCount: methodologyAuthorityContract.coverage.registeredDimensionCount,
      approvedWeightCount: methodologyAuthorityContract.coverage.approvedWeightCount,
      scoringEligibleDimensionCount:
        methodologyAuthorityContract.coverage.scoringEligibleDimensionCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      exactApprovedMethodologyRequired: true,
      callerScoresAccepted: false,
      callerClassificationsAccepted: false,
      callerRankingsAccepted: false,
      screeningScoreReuseAllowed: false,
      legacyUnderwritingReuseAllowed: false,
      missingDimensionReweightingAllowed: false,
      ineligibleDimensionCalculationAllowed: false,
      unapprovedOverallScoreAllowed: false,
      strengthClassificationAuthorized: false,
      weaknessClassificationAuthorized: false,
      riskClassificationAuthorized: false,
      recommendationAuthorized: false,
      memoComponentsExecuted: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalScoringAbsenceMayBlockValidatedCorePublication: false,
    },
    executions,
    overallExecution: {
      executionState: 'collapsed_ineligible',
      calculationAttempted: false,
      eligibleDimensionKeys: [],
      scoredDimensionKeys: [],
      reweightedDimensionKeys: [],
      overallScore: null,
      overallClassification: null,
      ranking: null,
      strengths: [],
      weaknesses: [],
      principalRisks: [],
      recommendation: null,
      recommendationConfidence: null,
      reportPublicationBlocker: false,
    },
    executionReceipt: {
      authorityState: 'not_established',
      established: false,
      executionCompleted: true,
      executionOutcome: 'all_dimensions_collapsed_no_approved_scoring_policy',
      calculationAttemptCount: 0,
      scoredDimensionKeys: [],
      classifiedDimensionKeys: [],
      overallScoreEstablished: false,
      recommendationEstablished: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      registeredDimensionCount: Object.keys(executions).length,
      assessedDimensionCount: Object.keys(executions).length,
      collapsedDimensionCount: Object.keys(executions).length,
      calculationAttemptCount: 0,
      scoredDimensionCount: 0,
      classifiedDimensionCount: 0,
      reweightedDimensionCount: 0,
      strengthCount: 0,
      weaknessCount: 0,
      principalRiskCount: 0,
    },
    gate9Receipt: {
      authorityState: 'not_established',
      established: false,
      executionReceiptEstablished: false,
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScoringExecutionContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScoringMethodologyAuthorityContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScoringExecutionContract({
  methodologyAuthorityContract,
} = {}) {
  if (!isCanonicalInstitutionalScoringMethodologyAuthorityContract(methodologyAuthorityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_9B_METHODOLOGY_AUTHORITY_REQUIRED_FOR_GATE_9C_SCORING_EXECUTION');
  }
  return deepFreeze(assembleContract(methodologyAuthorityContract));
}

export const INSTITUTIONAL_SCORING_EXECUTION_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  allDimensionsCollapsed: true,
  calculationsAttempted: false,
  overallScoreEstablished: false,
  classificationsEstablished: false,
  downstreamRenderingAuthorized: false,
});
