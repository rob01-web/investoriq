import { isCanonicalInstitutionalScenarioEngineInputAuthorityContract } from './institutional-scenario-engine-input-authority-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scenario_engine_stress_set_authority_contract';
const CONTRACT_VERSION = 1;

const STRESS_SET_DEFINITIONS = Object.freeze({
  rentStress: Object.freeze({
    setKey: 'rent_stress_set',
    familyKey: 'rent_stress',
    requiredInputFields: Object.freeze(['rent_growth_rate']),
  }),
  occupancyStress: Object.freeze({
    setKey: 'occupancy_stress_set',
    familyKey: 'occupancy_stress',
    requiredInputFields: Object.freeze(['stress_occupancy_rate', 'stress_vacancy_rate']),
  }),
  rateStress: Object.freeze({
    setKey: 'interest_rate_stress_set',
    familyKey: 'interest_rate_stress',
    requiredInputFields: Object.freeze(['stress_interest_rate']),
  }),
  taxStress: Object.freeze({
    setKey: 'tax_stress_set',
    familyKey: 'tax_stress',
    requiredInputFields: Object.freeze(['tax_growth_rate']),
  }),
  expenseStress: Object.freeze({
    setKey: 'expense_stress_set',
    familyKey: 'expense_stress',
    requiredInputFields: Object.freeze(['expense_growth_rate']),
  }),
  capitalizationRateStress: Object.freeze({
    setKey: 'capitalization_rate_stress_set',
    familyKey: 'capitalization_rate_stress',
    requiredInputFields: Object.freeze(['stress_capitalization_rate']),
  }),
  exitStress: Object.freeze({
    setKey: 'exit_stress_set',
    familyKey: 'exit_stress',
    requiredInputFields: Object.freeze(['exit_capitalization_rate', 'hold_period_years']),
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unresolvedInputAuthority(input) {
  return {
    fieldKey: input.fieldKey,
    value: null,
    units: input.units,
    authorityState: 'not_established',
    selectedAuthority: null,
    exactSourceAuthorityAvailable: false,
    exactApprovedPolicyAuthorityAvailable: false,
    scenarioInputEligible: false,
    requiredAuthority: input.requiredAuthority,
    provenance: [],
    semanticRestrictionCodes: [...input.semanticRestrictionCodes],
    reasonCode: 'EXACT_SOURCE_OR_APPROVED_SCENARIO_POLICY_AUTHORITY_NOT_AVAILABLE',
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unresolvedStressSet(definition, upstreamFamily) {
  return {
    setKey: definition.setKey,
    familyKey: definition.familyKey,
    definitionState: 'deterministically_defined',
    authorityRule:
      'every_required_input_must_have_exact_source_authority_or_exact_explicitly_approved_scenario_policy_authority',
    requiredInputFields: [...definition.requiredInputFields],
    availableInputFields: [],
    missingInputFields: [...definition.requiredInputFields],
    upstreamFamilyAuthorityState: upstreamFamily.authorityState,
    authorityState: 'not_established',
    stressSetAuthorized: false,
    calculationsPerformed: false,
    output: null,
    riskClassificationAuthorized: false,
    memoExecutionAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(inputAuthorityContract) {
  const inputAuthority = Object.fromEntries(
    Object.entries(inputAuthorityContract.stressInputs).map(([key, input]) => [
      key,
      unresolvedInputAuthority(input),
    ])
  );
  const stressSets = Object.fromEntries(
    Object.entries(STRESS_SET_DEFINITIONS).map(([key, definition]) => [
      key,
      unresolvedStressSet(definition, inputAuthorityContract.scenarioFamilies[key]),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: inputAuthorityContract,
    upstreamReceipt: {
      source: inputAuthorityContract.source,
      contractVersion: inputAuthorityContract.contractVersion,
      jobId: inputAuthorityContract.upstreamReceipt.jobId,
      corePublishable: inputAuthorityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate7AReceipt: true,
      availableStressInputCount: inputAuthorityContract.coverage.availableStressInputCount,
      eligibleScenarioFamilyCount: inputAuthorityContract.coverage.eligibleScenarioFamilyCount,
      gate7ScenarioEngineReceiptEstablished:
        inputAuthorityContract.coverage.gate7ScenarioEngineReceiptEstablished,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      scenarioPolicyAuthorityResolutionOnly: true,
      deterministicStressSetDefinitionOnly: true,
      exactSourceAuthorityRequired: true,
      explicitApprovedPolicyAuthorityRequiredWhenSourceAuthorityAbsent: true,
      callerStressInputsAccepted: false,
      callerPolicyAccepted: false,
      policyApprovalInferred: false,
      currentFactsPromotedToStressInputs: false,
      stressSetValuesInvented: false,
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
      optionalScenarioAuthorityFailureMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    scenarioPolicyAuthority: {
      source: inputAuthorityContract.scenarioPolicyReceipt.source,
      contractVersion: inputAuthorityContract.scenarioPolicyReceipt.contractVersion,
      exactCanonicalEmbeddedScenarioPolicy: true,
      authorityState: inputAuthorityContract.scenarioPolicyReceipt.authorityState,
      approvedPolicyId: inputAuthorityContract.scenarioPolicyReceipt.approvedPolicyId,
      approvedPolicyVersion: inputAuthorityContract.scenarioPolicyReceipt.approvedPolicyVersion,
      effectiveDate: inputAuthorityContract.scenarioPolicyReceipt.effectiveDate,
      approvalReceipt: inputAuthorityContract.scenarioPolicyReceipt.approvalReceipt,
      approvalComplete: false,
      policyValuesAuthorized: false,
      reportPublicationBlocker: false,
    },
    sourceCaseContext: {
      authorityState: inputAuthorityContract.sourceCaseContext.authorityState,
      adjustmentPolicy: inputAuthorityContract.sourceCaseContext.adjustmentPolicy,
      adjustments: { ...inputAuthorityContract.sourceCaseContext.adjustments },
      sourceCaseAuthorized: inputAuthorityContract.sourceCaseContext.sourceCaseAuthorized,
      eligibleAsStressScenario: false,
      reportPublicationBlocker: false,
    },
    inputAuthority,
    stressSets,
    gate7Receipt: {
      receiptKey: 'canonical_gate_7_scenario_engine_receipt',
      authorityState: 'not_established',
      established: false,
      requiredStressSets: Object.values(STRESS_SET_DEFINITIONS).map((set) => set.setKey),
      authorizedStressSets: [],
      missingStressSets: Object.values(STRESS_SET_DEFINITIONS).map((set) => set.setKey),
      calculationsPerformed: false,
      riskClassificationAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    scenarioOutputs: {
      status: 'not_calculated_canonical_stress_set_authority_not_available',
      calculationsPerformed: false,
      outputs: {},
      riskClassificationGenerated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      definedStressSetCount: Object.keys(stressSets).length,
      totalStressSetCount: Object.keys(STRESS_SET_DEFINITIONS).length,
      authorizedStressSetCount: 0,
      availableStressInputCount: 0,
      totalStressInputCount: Object.keys(inputAuthority).length,
      approvedScenarioPolicyAvailable: false,
      gate7ScenarioEngineReceiptEstablished: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScenarioEngineInputAuthorityContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
  inputAuthorityContract,
} = {}) {
  if (!isCanonicalInstitutionalScenarioEngineInputAuthorityContract(inputAuthorityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_7A_INPUT_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7B_STRESS_SET_AUTHORITY');
  }
  return deepFreeze(assembleContract(inputAuthorityContract));
}

export const INSTITUTIONAL_SCENARIO_ENGINE_STRESS_SET_AUTHORITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  deterministicStressSetDefinitionOnly: true,
  calculationsPerformed: false,
  gate7ScenarioEngineReceiptEstablished: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
