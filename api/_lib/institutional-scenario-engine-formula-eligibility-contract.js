import { isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract } from './institutional-scenario-engine-stress-set-authority-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scenario_engine_formula_eligibility_contract';
const CONTRACT_VERSION = 1;

const FORMULA_DEFINITIONS = Object.freeze({
  rentStress: Object.freeze({
    formulaKey: 'rent_stress_formula',
    expression: 'accepted_annual_rent_basis_times_one_plus_authorized_period_rent_growth_rate',
    requiredContextFields: Object.freeze(['accepted_annual_rent_basis', 'authorized_growth_period']),
  }),
  occupancyStress: Object.freeze({
    formulaKey: 'occupancy_stress_formula',
    expression: 'accepted_gross_potential_rent_basis_times_authorized_stress_occupancy_rate_after_occupancy_vacancy_complement_validation',
    requiredContextFields: Object.freeze(['accepted_gross_potential_rent_basis']),
  }),
  rateStress: Object.freeze({
    formulaKey: 'interest_rate_stress_formula',
    expression: 'deterministic_amortizing_debt_service_at_authorized_stress_interest_rate_and_accepted_debt_terms',
    requiredContextFields: Object.freeze([
      'accepted_debt_principal',
      'accepted_amortization_years',
      'authorized_payment_frequency',
    ]),
  }),
  taxStress: Object.freeze({
    formulaKey: 'tax_stress_formula',
    expression: 'accepted_property_tax_basis_times_one_plus_authorized_period_tax_growth_rate',
    requiredContextFields: Object.freeze(['accepted_property_tax_basis', 'authorized_growth_period']),
  }),
  expenseStress: Object.freeze({
    formulaKey: 'expense_stress_formula',
    expression: 'accepted_operating_expense_basis_times_one_plus_authorized_period_expense_growth_rate',
    requiredContextFields: Object.freeze(['accepted_operating_expense_basis', 'authorized_growth_period']),
  }),
  capitalizationRateStress: Object.freeze({
    formulaKey: 'capitalization_rate_stress_formula',
    expression: 'authorized_stress_net_operating_income_divided_by_authorized_stress_capitalization_rate',
    requiredContextFields: Object.freeze(['authorized_stress_net_operating_income']),
  }),
  exitStress: Object.freeze({
    formulaKey: 'exit_stress_formula',
    expression: 'authorized_exit_net_operating_income_at_authorized_hold_period_divided_by_authorized_exit_capitalization_rate',
    requiredContextFields: Object.freeze(['authorized_exit_net_operating_income_policy']),
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function formulaEligibility(definition, stressSet) {
  return {
    formulaKey: definition.formulaKey,
    stressSetKey: stressSet.setKey,
    familyKey: stressSet.familyKey,
    formulaAuthorityState: 'canonical_deterministic_formula_registered',
    expression: definition.expression,
    requiredStressInputFields: [...stressSet.requiredInputFields],
    availableStressInputFields: [...stressSet.availableInputFields],
    missingStressInputFields: [...stressSet.missingInputFields],
    requiredContextFields: [...definition.requiredContextFields],
    availableContextFields: [],
    missingContextFields: [...definition.requiredContextFields],
    stressSetAuthorityComplete: stressSet.stressSetAuthorized,
    contextAuthorityComplete: false,
    calculationEligible: false,
    calculationsPerformed: false,
    output: null,
    riskClassificationAuthorized: false,
    memoExecutionAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(stressSetAuthorityContract) {
  const formulaRegistry = Object.fromEntries(
    Object.entries(FORMULA_DEFINITIONS).map(([key, definition]) => [
      key,
      formulaEligibility(definition, stressSetAuthorityContract.stressSets[key]),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: stressSetAuthorityContract,
    upstreamReceipt: {
      source: stressSetAuthorityContract.source,
      contractVersion: stressSetAuthorityContract.contractVersion,
      jobId: stressSetAuthorityContract.upstreamReceipt.jobId,
      corePublishable: stressSetAuthorityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate7BReceipt: true,
      definedStressSetCount: stressSetAuthorityContract.coverage.definedStressSetCount,
      authorizedStressSetCount: stressSetAuthorityContract.coverage.authorizedStressSetCount,
      approvedScenarioPolicyAvailable:
        stressSetAuthorityContract.coverage.approvedScenarioPolicyAvailable,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicFormulaRegistryOnly: true,
      calculationEligibilityOnly: true,
      callerFormulaAccepted: false,
      callerContextAccepted: false,
      missingContextInferred: false,
      unauthorizedStressSetCalculated: false,
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
    formulaRegistry,
    executionAuthority: {
      authorityState: 'not_established',
      eligibleFormulaKeys: [],
      ineligibleFormulaKeys: Object.values(FORMULA_DEFINITIONS).map((formula) => formula.formulaKey),
      calculationsAuthorized: false,
      calculationsPerformed: false,
      reportPublicationBlocker: false,
    },
    gate7Receipt: {
      authorityState: 'not_established',
      established: false,
      calculationsPerformed: false,
      riskClassificationAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      registeredFormulaCount: Object.keys(formulaRegistry).length,
      totalFormulaCount: Object.keys(FORMULA_DEFINITIONS).length,
      eligibleFormulaCount: 0,
      calculatedFormulaCount: 0,
      authorizedStressSetCount: stressSetAuthorityContract.coverage.authorizedStressSetCount,
      totalStressSetCount: stressSetAuthorityContract.coverage.totalStressSetCount,
      gate7ScenarioEngineReceiptEstablished: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScenarioEngineFormulaEligibilityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScenarioEngineFormulaEligibilityContract({
  stressSetAuthorityContract,
} = {}) {
  if (!isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(stressSetAuthorityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_7B_STRESS_SET_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7C_FORMULA_ELIGIBILITY');
  }
  return deepFreeze(assembleContract(stressSetAuthorityContract));
}

export const INSTITUTIONAL_SCENARIO_ENGINE_FORMULA_ELIGIBILITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  deterministicFormulaRegistryOnly: true,
  calculationsPerformed: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
