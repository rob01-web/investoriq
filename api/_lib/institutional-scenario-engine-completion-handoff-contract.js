import { isCanonicalInstitutionalScenarioEngineExecutionContract } from './institutional-scenario-engine-execution-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scenario_engine_completion_handoff_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function assembleContract(executionContract) {
  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: executionContract,
    upstreamReceipt: {
      source: executionContract.source,
      contractVersion: executionContract.contractVersion,
      jobId: executionContract.upstreamReceipt.jobId,
      corePublishable: executionContract.upstreamReceipt.corePublishable,
      exactCanonicalGate7DReceipt: true,
      totalFormulaCount: executionContract.coverage.totalFormulaCount,
      calculatedFormulaCount: executionContract.coverage.calculatedFormulaCount,
      collapsedFormulaCount: executionContract.coverage.collapsedFormulaCount,
      scenarioOutputCount: executionContract.coverage.scenarioOutputCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      gate7ArchitectureCompletionOnly: true,
      collapsedAnalysisMayCompleteArchitecture: true,
      collapsedAnalysisMayClaimScenarioOutput: false,
      canonicalGate6HandoffOnly: true,
      upstreamGate6SequencingMutationAllowed: false,
      callerReceiptAccepted: false,
      callerHandoffAccepted: false,
      calculationsPerformed: false,
      scenarioOutputsCreated: false,
      riskClassificationAuthorized: false,
      memoComponentsExecuted: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalScenarioAnalysisAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    gate7CompletionReceipt: {
      receiptKey: 'canonical_gate_7_scenario_engine_completion_receipt',
      receiptVersion: 1,
      authorityState: 'established_collapsed_no_authorized_stress_sets',
      established: true,
      architectureComplete: true,
      scenarioAnalysisState: executionContract.gate7Receipt.scenarioAnalysisState,
      registeredFormulaCount: executionContract.coverage.totalFormulaCount,
      calculatedFormulaCount: executionContract.coverage.calculatedFormulaCount,
      collapsedFormulaCount: executionContract.coverage.collapsedFormulaCount,
      scenarioOutputCount: executionContract.coverage.scenarioOutputCount,
      scenarioOutputs: [],
      limitationCodes: [
        'EXACT_SOURCE_OR_APPROVED_SCENARIO_POLICY_AUTHORITY_NOT_AVAILABLE',
        'NO_CANONICAL_SCENARIO_FORMULA_ELIGIBLE_FOR_EXECUTION',
      ],
      riskClassificationAuthorized: false,
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    gate6Handoff: {
      handoffKey: 'canonical_gate_7_to_gate_6_internal_handoff',
      targetGate: 'gate_6_investment_committee_memo',
      handoffState: 'available_collapsed_scenario_analysis',
      canonicalGate7CompletionReceiptAvailable: true,
      scenarioEvidenceAvailable: false,
      scenarioEvidence: [],
      scenarioOutputsAvailable: false,
      scenarioOutputs: [],
      riskComponentExecutionAuthorized: false,
      memoExecutionAuthorized: false,
      remainingRequiredRoadmapGates: [
        'gate_8_due_diligence_engine',
        'gate_9_institutional_scoring',
      ],
      upstreamGate6SequencingMutated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      gate7ArchitectureComplete: true,
      gate7CompletionReceiptEstablished: true,
      scenarioAnalysisCollapsed: true,
      scenarioOutputCount: 0,
      riskClassificationCount: 0,
      memoComponentExecutionCount: 0,
      gate6InternalHandoffAvailable: true,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScenarioEngineExecutionContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScenarioEngineCompletionHandoffContract({
  executionContract,
} = {}) {
  if (!isCanonicalInstitutionalScenarioEngineExecutionContract(executionContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_7D_EXECUTION_CONTRACT_REQUIRED_FOR_GATE_7E_COMPLETION_HANDOFF');
  }
  return deepFreeze(assembleContract(executionContract));
}

export const INSTITUTIONAL_SCENARIO_ENGINE_COMPLETION_HANDOFF_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  gate7ArchitectureCompletionOnly: true,
  scenarioOutputsCreated: false,
  memoComponentsExecuted: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
