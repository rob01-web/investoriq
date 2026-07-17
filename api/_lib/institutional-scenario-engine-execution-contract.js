import { isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract } from './institutional-scenario-engine-formula-eligibility-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scenario_engine_execution_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function collapsedExecution(formula) {
  const collapseReasonCodes = [];
  if (!formula.stressSetAuthorityComplete) {
    collapseReasonCodes.push('CANONICAL_STRESS_SET_AUTHORITY_NOT_COMPLETE');
  }
  if (!formula.contextAuthorityComplete) {
    collapseReasonCodes.push('CANONICAL_SCENARIO_CONTEXT_AUTHORITY_NOT_COMPLETE');
  }
  return {
    formulaKey: formula.formulaKey,
    stressSetKey: formula.stressSetKey,
    familyKey: formula.familyKey,
    executionState: 'collapsed_ineligible',
    calculationEligible: formula.calculationEligible,
    calculationAttempted: false,
    calculationPerformed: false,
    inputSnapshot: {},
    arithmeticDiagnostics: [],
    output: null,
    collapseReasonCodes,
    riskClassificationAuthorized: false,
    memoExecutionAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(formulaEligibilityContract) {
  const executions = Object.fromEntries(
    Object.entries(formulaEligibilityContract.formulaRegistry).map(([key, formula]) => [
      key,
      collapsedExecution(formula),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: formulaEligibilityContract,
    upstreamReceipt: {
      source: formulaEligibilityContract.source,
      contractVersion: formulaEligibilityContract.contractVersion,
      jobId: formulaEligibilityContract.upstreamReceipt.jobId,
      corePublishable: formulaEligibilityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate7CReceipt: true,
      registeredFormulaCount: formulaEligibilityContract.coverage.registeredFormulaCount,
      eligibleFormulaCount: formulaEligibilityContract.coverage.eligibleFormulaCount,
      authorizedStressSetCount: formulaEligibilityContract.coverage.authorizedStressSetCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      canonicalEligibleFormulaExecutionOnly: true,
      ineligibleFormulaCollapseRequired: true,
      callerInputsAccepted: false,
      callerOutputsAccepted: false,
      missingValuesInferred: false,
      ineligibleCalculationsAttempted: false,
      calculationsPerformed: false,
      scenarioOutputsCreated: false,
      riskClassificationAuthorized: false,
      gate7ScenarioEngineReceiptEstablished: false,
      memoComponentsExecuted: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalScenarioExecutionAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    executions,
    executionSummary: {
      executionState: 'collapsed_no_eligible_canonical_scenario_formulas',
      totalFormulaCount: Object.keys(executions).length,
      eligibleFormulaCount: 0,
      attemptedFormulaCount: 0,
      calculatedFormulaCount: 0,
      collapsedFormulaCount: Object.keys(executions).length,
      outputCount: 0,
      outputs: {},
      reportPublicationBlocker: false,
    },
    gate7Receipt: {
      authorityState: 'not_established',
      established: false,
      scenarioAnalysisState: 'collapsed_no_authorized_stress_sets',
      calculationsPerformed: false,
      scenarioOutputCount: 0,
      riskClassificationAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      totalFormulaCount: Object.keys(executions).length,
      eligibleFormulaCount: 0,
      attemptedFormulaCount: 0,
      calculatedFormulaCount: 0,
      collapsedFormulaCount: Object.keys(executions).length,
      scenarioOutputCount: 0,
      gate7ScenarioEngineReceiptEstablished: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScenarioEngineExecutionContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScenarioEngineExecutionContract({
  formulaEligibilityContract,
} = {}) {
  if (!isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(formulaEligibilityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_7C_FORMULA_ELIGIBILITY_CONTRACT_REQUIRED_FOR_GATE_7D_EXECUTION');
  }
  return deepFreeze(assembleContract(formulaEligibilityContract));
}

export const INSTITUTIONAL_SCENARIO_ENGINE_EXECUTION_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  canonicalEligibleFormulaExecutionOnly: true,
  ineligibleFormulaCollapseRequired: true,
  calculationsPerformed: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
