import { isCanonicalInstitutionalScoringInputLineageContract } from './institutional-scoring-input-lineage-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scoring_methodology_authority_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unavailableMethodology(dimension) {
  return {
    dimensionKey: dimension.dimensionKey,
    scoringInputAuthorityState: dimension.scoringInputAuthorityState,
    scoringInputEligible: dimension.scoringInputEligible,
    approvedMethodologyPolicyAvailable: false,
    approvedPolicyId: null,
    approvedPolicyVersion: null,
    weight: null,
    thresholds: [],
    normalizationFormula: null,
    classificationBands: [],
    missingDimensionBehavior: 'collapse_dimension_no_reweighting',
    methodologyAuthorityState: 'not_established',
    scoringEligible: false,
    limitationCodes: [
      'APPROVED_SCORING_INPUT_POLICY_NOT_ESTABLISHED',
      'APPROVED_SCORING_METHODOLOGY_POLICY_NOT_ESTABLISHED',
    ],
    reportPublicationBlocker: false,
  };
}

function assembleContract(scoringInputLineageContract) {
  const methodologies = Object.fromEntries(
    Object.entries(scoringInputLineageContract.dimensions).map(([key, dimension]) => [
      key,
      unavailableMethodology(dimension),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: scoringInputLineageContract,
    upstreamReceipt: {
      source: scoringInputLineageContract.source,
      contractVersion: scoringInputLineageContract.contractVersion,
      jobId: scoringInputLineageContract.upstreamReceipt.jobId,
      corePublishable: scoringInputLineageContract.upstreamReceipt.corePublishable,
      exactCanonicalGate9AReceipt: true,
      registeredDimensionCount: scoringInputLineageContract.coverage.registeredDimensionCount,
      scoringInputEligibleDimensionCount:
        scoringInputLineageContract.coverage.scoringInputEligibleDimensionCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      approvedMethodologyPolicyRequired: true,
      callerPolicyAccepted: false,
      callerWeightsAccepted: false,
      callerThresholdsAccepted: false,
      callerNormalizationAccepted: false,
      callerClassificationBandsAccepted: false,
      screeningScoreReuseAllowed: false,
      legacyUnderwritingReuseAllowed: false,
      missingDimensionReweightingAllowed: false,
      arbitraryWeightRedistributionAllowed: false,
      scoreCalculationAuthorized: false,
      classificationAuthorized: false,
      memoComponentsExecuted: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalScoringAbsenceMayBlockValidatedCorePublication: false,
    },
    methodologies,
    overallScorePolicy: {
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
    },
    methodologyReceipt: {
      authorityState: 'not_established',
      established: false,
      approvedMethodologyPolicyAvailable: false,
      weightedDimensionKeys: [],
      thresholdedDimensionKeys: [],
      normalizedDimensionKeys: [],
      scoringEligibleDimensionKeys: [],
      scoreCalculationAuthorized: false,
      classificationAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      registeredDimensionCount: Object.keys(methodologies).length,
      methodologyAssessedDimensionCount: Object.keys(methodologies).length,
      approvedWeightCount: 0,
      approvedThresholdSetCount: 0,
      approvedNormalizationFormulaCount: 0,
      scoringEligibleDimensionCount: 0,
      reweightedDimensionCount: 0,
    },
    gate9Receipt: {
      authorityState: 'not_established',
      established: false,
      methodologyReceiptEstablished: false,
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScoringMethodologyAuthorityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScoringInputLineageContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScoringMethodologyAuthorityContract({
  scoringInputLineageContract,
} = {}) {
  if (!isCanonicalInstitutionalScoringInputLineageContract(scoringInputLineageContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_9A_INPUT_LINEAGE_REQUIRED_FOR_GATE_9B_METHODOLOGY_AUTHORITY');
  }
  return deepFreeze(assembleContract(scoringInputLineageContract));
}

export const INSTITUTIONAL_SCORING_METHODOLOGY_AUTHORITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  methodologyPolicyEstablished: false,
  weightsAssigned: false,
  thresholdsAssigned: false,
  reweightingAllowed: false,
  scoresCalculated: false,
  downstreamRenderingAuthorized: false,
});
