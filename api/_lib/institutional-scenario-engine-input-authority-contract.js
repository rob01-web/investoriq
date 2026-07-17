import { isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract } from './institutional-investment-committee-memo-dependency-sequencing-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_scenario_engine_input_authority_contract';
const CONTRACT_VERSION = 1;

const STRESS_INPUT_FIELDS = Object.freeze({
  rentGrowthRate: Object.freeze({
    fieldKey: 'rent_growth_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_rent_growth_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'SOURCE_STATED_MARKET_RENT_DIFFERENCE_IS_NOT_RENT_GROWTH',
      'CURRENT_RENT_AND_MARKET_RENT_DO_NOT_ESTABLISH_A_GROWTH_PERIOD',
    ]),
  }),
  occupancyRate: Object.freeze({
    fieldKey: 'stress_occupancy_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_occupancy_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'SOURCE_CASE_OCCUPANCY_IS_NOT_STRESS_OCCUPANCY',
      'OCCUPANCY_TARGET_MAY_NOT_BE_INFERRED_FROM_CURRENT_OCCUPANCY',
    ]),
  }),
  vacancyRate: Object.freeze({
    fieldKey: 'stress_vacancy_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_vacancy_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'SOURCE_CASE_PHYSICAL_VACANCY_IS_NOT_STRESS_VACANCY',
      'ECONOMIC_VACANCY_MAY_NOT_BE_INFERRED_FROM_PHYSICAL_VACANCY',
    ]),
  }),
  expenseGrowthRate: Object.freeze({
    fieldKey: 'expense_growth_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_expense_growth_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'CURRENT_OPERATING_EXPENSES_DO_NOT_ESTABLISH_EXPENSE_GROWTH',
      'EXPENSE_GROWTH_MAY_NOT_BE_INFERRED_FROM_AN_EXPENSE_RATIO',
    ]),
  }),
  taxGrowthRate: Object.freeze({
    fieldKey: 'tax_growth_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_tax_growth_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'CURRENT_PROPERTY_TAX_DOES_NOT_ESTABLISH_TAX_GROWTH',
      'TAX_GROWTH_MAY_NOT_BE_INFERRED_WITHOUT_A_PERIOD_AND_SOURCE',
    ]),
  }),
  interestRate: Object.freeze({
    fieldKey: 'stress_interest_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_interest_rate_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'CURRENT_OR_PROPOSED_ACQUISITION_INTEREST_RATE_IS_NOT_STRESS_RATE',
      'REFINANCING_RATE_MAY_NOT_BE_INFERRED_FROM_CURRENT_DEBT',
    ]),
  }),
  capitalizationRate: Object.freeze({
    fieldKey: 'stress_capitalization_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_scenario_capitalization_rate_or_approved_scenario_policy',
    semanticRestrictionCodes: Object.freeze([
      'SOURCE_CASE_CAPITALIZATION_RATE_IS_NOT_STRESS_CAPITALIZATION_RATE',
      'APPRAISAL_CAPITALIZATION_RATE_IS_NOT_SCENARIO_POLICY',
    ]),
  }),
  exitCapitalizationRate: Object.freeze({
    fieldKey: 'exit_capitalization_rate',
    units: 'rate',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_exit_capitalization_rate_or_approved_exit_policy',
    semanticRestrictionCodes: Object.freeze([
      'APPRAISAL_CAPITALIZATION_RATE_IS_NOT_EXIT_CAPITALIZATION_RATE',
      'ACQUISITION_CAPITALIZATION_RATE_IS_NOT_EXIT_CAPITALIZATION_RATE',
    ]),
  }),
  holdPeriodYears: Object.freeze({
    fieldKey: 'hold_period_years',
    units: 'years',
    requiredAuthority: 'exact_accepted_source_assumption_explicitly_labeled_as_hold_period_or_approved_exit_policy',
    semanticRestrictionCodes: Object.freeze([
      'HOLD_PERIOD_MAY_NOT_BE_INFERRED_FROM_LOAN_TERM',
      'HOLD_PERIOD_MAY_NOT_BE_INFERRED_FROM_AMORTIZATION',
    ]),
  }),
});

const SCENARIO_FAMILIES = Object.freeze({
  rentStress: Object.freeze({
    familyKey: 'rent_stress',
    requiredInputFields: Object.freeze(['rent_growth_rate']),
  }),
  occupancyStress: Object.freeze({
    familyKey: 'occupancy_stress',
    requiredInputFields: Object.freeze(['stress_occupancy_rate', 'stress_vacancy_rate']),
  }),
  rateStress: Object.freeze({
    familyKey: 'interest_rate_stress',
    requiredInputFields: Object.freeze(['stress_interest_rate']),
  }),
  taxStress: Object.freeze({
    familyKey: 'tax_stress',
    requiredInputFields: Object.freeze(['tax_growth_rate']),
  }),
  expenseStress: Object.freeze({
    familyKey: 'expense_stress',
    requiredInputFields: Object.freeze(['expense_growth_rate']),
  }),
  capitalizationRateStress: Object.freeze({
    familyKey: 'capitalization_rate_stress',
    requiredInputFields: Object.freeze(['stress_capitalization_rate']),
  }),
  exitStress: Object.freeze({
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

function scenarioPolicyContractFrom(sequenceContract) {
  return sequenceContract
    .upstreamContract
    .upstreamContract
    .upstreamContract
    .upstreamContract
    .upstreamAnalyses
    .sourceCase
    .inputContract
    .scenarioPolicy;
}

function unavailableStressInput(definition) {
  return {
    fieldKey: definition.fieldKey,
    value: null,
    units: definition.units,
    authorityState: 'not_established',
    sourceBound: false,
    policyBound: false,
    scenarioInputEligible: false,
    requiredAuthority: definition.requiredAuthority,
    provenance: [],
    semanticRestrictionCodes: [...definition.semanticRestrictionCodes],
    reasonCode: 'CANONICAL_SCENARIO_STRESS_INPUT_NOT_AVAILABLE',
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unavailableScenarioFamily(definition) {
  return {
    familyKey: definition.familyKey,
    authorityState: 'not_established',
    calculationEligible: false,
    requiredInputFields: [...definition.requiredInputFields],
    availableInputFields: [],
    missingInputFields: [...definition.requiredInputFields],
    calculationsPerformed: false,
    output: null,
    riskClassificationAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(sequenceContract) {
  const scenarioPolicyContract = scenarioPolicyContractFrom(sequenceContract);
  const stressInputs = Object.fromEntries(
    Object.entries(STRESS_INPUT_FIELDS).map(([key, definition]) => [
      key,
      unavailableStressInput(definition),
    ])
  );
  const scenarioFamilies = Object.fromEntries(
    Object.entries(SCENARIO_FAMILIES).map(([key, definition]) => [
      key,
      unavailableScenarioFamily(definition),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: sequenceContract,
    upstreamReceipt: {
      source: sequenceContract.source,
      contractVersion: sequenceContract.contractVersion,
      jobId: sequenceContract.upstreamReceipt.jobId,
      corePublishable: sequenceContract.upstreamReceipt.corePublishable,
      exactCanonicalGate6DReceipt: true,
      gate6PreDownstreamAuthorityScaffoldComplete:
        sequenceContract.executionSequence.gate6PreDownstreamAuthorityScaffoldComplete,
      nextRoadmapGate: sequenceContract.executionSequence.nextRoadmapGate,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      scenarioInputEligibilityOnly: true,
      sourceCasePreservedWithoutAdjustment: true,
      stressAssumptionsInferred: false,
      callerStressInputsAccepted: false,
      existingRatesPromotedToStressInputs: false,
      currentOccupancyPromotedToStressOccupancy: false,
      physicalVacancyPromotedToEconomicOrStressVacancy: false,
      marketRentDifferencePromotedToRentGrowth: false,
      appraisalRatePromotedToExitRate: false,
      loanTermPromotedToHoldPeriod: false,
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
    scenarioPolicyReceipt: {
      source: scenarioPolicyContract.source,
      contractVersion: scenarioPolicyContract.contractVersion,
      exactCanonicalEmbeddedScenarioPolicy: true,
      authorityState: scenarioPolicyContract.policyAuthority.authorityState,
      approvedPolicyId: scenarioPolicyContract.policyAuthority.approvedPolicyId,
      approvedPolicyVersion: scenarioPolicyContract.policyAuthority.approvedPolicyVersion,
      effectiveDate: scenarioPolicyContract.policyAuthority.effectiveDate,
      approvalReceipt: scenarioPolicyContract.policyAuthority.approvalReceipt,
      reportPublicationBlocker: false,
    },
    sourceCaseContext: {
      authorityState: 'canonical_source_case_only',
      upstreamPointer: 'embeddedScenarioPolicy.sourceCase',
      adjustmentPolicy: scenarioPolicyContract.sourceCase.adjustmentPolicy,
      adjustments: { ...scenarioPolicyContract.sourceCase.adjustments },
      sourceCaseAuthorized: scenarioPolicyContract.sourceCase.authorized,
      eligibleAsStressScenario: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    stressInputs,
    scenarioFamilies,
    gate7Receipt: {
      receiptKey: 'canonical_gate_7_scenario_engine_receipt',
      authorityState: 'not_established',
      established: false,
      requiredScenarioFamilies: Object.values(SCENARIO_FAMILIES).map((family) => family.familyKey),
      availableScenarioFamilies: [],
      missingScenarioFamilies: Object.values(SCENARIO_FAMILIES).map((family) => family.familyKey),
      calculationsPerformed: false,
      riskClassificationAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    scenarioOutputs: {
      status: 'not_calculated_canonical_stress_inputs_not_available',
      rentStress: null,
      occupancyStress: null,
      rateStress: null,
      taxStress: null,
      expenseStress: null,
      capitalizationRateStress: null,
      exitStress: null,
      calculationsPerformed: false,
      riskClassificationGenerated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      sourceCaseContextAvailable: true,
      availableStressInputCount: 0,
      totalStressInputCount: Object.keys(stressInputs).length,
      eligibleScenarioFamilyCount: 0,
      totalScenarioFamilyCount: Object.keys(scenarioFamilies).length,
      calculatedScenarioFamilyCount: 0,
      gate7ScenarioEngineReceiptEstablished: false,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalScenarioEngineInputAuthorityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(value.upstreamContract)) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
  dependencySequencingContract,
} = {}) {
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(dependencySequencingContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_6D_DEPENDENCY_SEQUENCING_CONTRACT_REQUIRED_FOR_GATE_7A_SCENARIO_INPUT_AUTHORITY');
  }
  return deepFreeze(assembleContract(dependencySequencingContract));
}

export const INSTITUTIONAL_SCENARIO_ENGINE_INPUT_AUTHORITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  scenarioInputEligibilityOnly: true,
  calculationsPerformed: false,
  gate7ScenarioEngineReceiptEstablished: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
