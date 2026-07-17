import { isCanonicalInstitutionalDueDiligenceCompletionHandoffContract } from './institutional-due-diligence-completion-handoff-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scoring_input_lineage_contract';
const CONTRACT_VERSION = 1;

const DIMENSION_LINEAGE = Object.freeze({
  operational: [
    'canonical_source_truth_core_receipt',
    'canonical_gate_8_due_diligence_engine_completion_receipt',
  ],
  financial: [
    'canonical_source_case_underwriting_receipt',
    'canonical_acquisition_valuation_receipt',
    'canonical_acquisition_capital_structure_receipt',
  ],
  debt: [
    'canonical_debt_service_receipt',
    'canonical_dscr_analysis_receipt',
    'canonical_debt_risk_analysis_receipt',
  ],
  incomeStability: [
    'canonical_core_reconciliation_receipt',
    'canonical_gate_7_scenario_engine_completion_receipt',
  ],
  valueAdd: [
    'canonical_capital_plan_receipt',
    'canonical_acquisition_valuation_receipt',
    'canonical_gate_7_scenario_engine_completion_receipt',
  ],
  executionRisk: [
    'canonical_gate_8_due_diligence_engine_completion_receipt',
    'canonical_gate_7_scenario_engine_completion_receipt',
  ],
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unavailableDimension(dimensionKey, eligibleLineageReceiptKeys) {
  return {
    dimensionKey,
    eligibleLineageReceiptKeys,
    approvedScoringInputPolicyAvailable: false,
    selectedScoringInputs: [],
    copiedNumericValues: [],
    scoringInputAuthorityState: 'not_established',
    scoringInputEligible: false,
    score: null,
    classification: null,
    limitationCodes: ['APPROVED_SCORING_INPUT_POLICY_NOT_ESTABLISHED'],
    customerFacingCopyAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(dueDiligenceCompletionContract) {
  const dimensions = Object.fromEntries(
    Object.entries(DIMENSION_LINEAGE).map(([dimensionKey, receiptKeys]) => [
      dimensionKey,
      unavailableDimension(dimensionKey, receiptKeys),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: dueDiligenceCompletionContract,
    upstreamReceipt: {
      source: dueDiligenceCompletionContract.source,
      contractVersion: dueDiligenceCompletionContract.contractVersion,
      jobId: dueDiligenceCompletionContract.upstreamReceipt.jobId,
      corePublishable: dueDiligenceCompletionContract.upstreamReceipt.corePublishable,
      exactCanonicalGate8DReceipt: true,
      gate8ArchitectureComplete:
        dueDiligenceCompletionContract.gate8CompletionReceipt.architectureComplete,
      gate8CompletionReceiptKey:
        dueDiligenceCompletionContract.gate8CompletionReceipt.receiptKey,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      exactCanonicalLineageOnly: true,
      copiedNumericValuesAllowed: false,
      inferredValuesAllowed: false,
      callerScoringInputsAccepted: false,
      approvedScoringInputPolicyRequired: true,
      screeningScoreReuseAllowed: false,
      legacyUnderwritingReuseAllowed: false,
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
    dimensions,
    scoringInputReceipt: {
      authorityState: 'not_established',
      established: false,
      approvedScoringInputPolicyAvailable: false,
      eligibleDimensionKeys: [],
      selectedScoringInputs: [],
      copiedNumericValues: [],
      scoreCalculationAuthorized: false,
      customerFacingCopyAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      registeredDimensionCount: Object.keys(dimensions).length,
      lineageCataloguedDimensionCount: Object.keys(dimensions).length,
      scoringInputEligibleDimensionCount: 0,
      selectedScoringInputCount: 0,
      copiedNumericValueCount: 0,
      scoredDimensionCount: 0,
      classifiedDimensionCount: 0,
    },
    gate9Receipt: {
      authorityState: 'not_established',
      established: false,
      scoringInputReceiptEstablished: false,
      customerFacingCopyAuthorized: false,
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScoringInputLineageContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScoringInputLineageContract({
  dueDiligenceCompletionContract,
} = {}) {
  if (!isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(dueDiligenceCompletionContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_8D_HANDOFF_REQUIRED_FOR_GATE_9A_SCORING_INPUT_LINEAGE');
  }
  return deepFreeze(assembleContract(dueDiligenceCompletionContract));
}

export const INSTITUTIONAL_SCORING_INPUT_LINEAGE_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  exactCanonicalLineageOnly: true,
  scoringInputsSelected: false,
  valuesCopied: false,
  scoresCalculated: false,
  downstreamRenderingAuthorized: false,
});
