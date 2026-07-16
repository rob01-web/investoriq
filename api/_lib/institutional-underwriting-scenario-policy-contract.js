const CONTRACT_SOURCE = 'canonical_institutional_underwriting_scenario_policy_contract';
const CONTRACT_VERSION = 1;
const ADJUSTMENT_KEYS = Object.freeze([
  'rentGrowthRate',
  'occupancyRate',
  'vacancyRate',
  'expenseGrowthRate',
  'taxGrowthRate',
  'interestRate',
  'capitalizationRate',
  'exitCapitalizationRate',
  'holdPeriodYears',
]);
const POLICY_FIELD_AUTHORITY = Object.freeze({
  maximumLtv: {
    fieldKey: 'maximum_ltv',
    requiredAuthority: 'approved_underwriting_policy_or_exact_eligible_source_term',
  },
  minimumDscr: {
    fieldKey: 'minimum_dscr',
    requiredAuthority: 'approved_underwriting_policy_or_exact_lender_requirement',
  },
  capitalizationRateAuthority: {
    fieldKey: 'capitalization_rate_authority',
    requiredAuthority: 'approved_scenario_policy_or_exact_eligible_source_rate',
  },
  refinancingInterestRate: {
    fieldKey: 'refinancing_interest_rate',
    requiredAuthority: 'approved_scenario_policy_or_exact_refinancing_term',
  },
  refinancingAmortizationYears: {
    fieldKey: 'refinancing_amortization_years',
    requiredAuthority: 'approved_scenario_policy_or_exact_refinancing_term',
  },
  refinancingTermYears: {
    fieldKey: 'refinancing_term_years',
    requiredAuthority: 'approved_scenario_policy_or_exact_refinancing_term',
  },
  expenseNormalizationPolicy: {
    fieldKey: 'expense_normalization_policy',
    requiredAuthority: 'approved_expense_normalization_policy',
  },
});
const SCENARIO_POLICY_FIELDS = Object.freeze({
  bridge: Object.freeze([
    'bridge_period',
    'bridge_rent_growth',
    'bridge_occupancy',
    'bridge_expense_policy',
  ]),
  exit: Object.freeze([
    'hold_period',
    'exit_net_operating_income_policy',
    'exit_capitalization_rate',
    'selling_cost_policy',
  ]),
  stress: Object.freeze([
    'stress_net_operating_income',
    'stress_occupancy',
    'stress_interest_rate',
    'stress_capitalization_rate',
  ]),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function hasExactKeys(value, requiredKeys) {
  const keys = Object.keys(value || {}).sort();
  const expected = [...requiredKeys].sort();
  return keys.length === expected.length && expected.every((key, index) => key === keys[index]);
}

function arraysEqual(left, right) {
  return Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function unavailablePolicyField(fieldKey, requiredAuthority) {
  return {
    fieldKey,
    value: null,
    authorityState: 'not_established',
    requiredAuthority,
    sourceBacked: false,
    policyBacked: false,
    calculationAuthorized: false,
  };
}

function unavailableScenario(scenarioKey, requiredPolicyFields) {
  return {
    scenarioKey,
    scenarioType: 'underwriting_scenario',
    authorityState: 'not_established',
    authorized: false,
    requiredPolicyFields,
    adjustments: {
      rentGrowthRate: null,
      occupancyRate: null,
      vacancyRate: null,
      expenseGrowthRate: null,
      taxGrowthRate: null,
      interestRate: null,
      capitalizationRate: null,
      exitCapitalizationRate: null,
      holdPeriodYears: null,
    },
    missingPolicyFields: [...requiredPolicyFields],
    reportPublicationBlocker: false,
  };
}

const FORMULA_REGISTRY = deepFreeze({
  sourceCaseOperatingPosition: {
    formulaKey: 'source_case_operating_position',
    formula: 'accepted_source_operating_facts_preserved_without_adjustment',
    requiredInputs: ['accepted_t12_operating_facts', 'accepted_rent_roll_operating_facts'],
    requiredPolicyFields: [],
    calculationAuthorizedWhenInputsEligible: true,
  },
  normalizedNetOperatingIncome: {
    formulaKey: 'normalized_net_operating_income',
    formula: 'accepted_effective_gross_income_minus_policy_accepted_normalized_operating_expenses',
    requiredInputs: ['accepted_effective_gross_income', 'accepted_operating_expense_lines'],
    requiredPolicyFields: ['expense_normalization_policy'],
    calculationAuthorizedWhenInputsEligible: false,
  },
  valueFromCapitalizationRate: {
    formulaKey: 'value_from_capitalization_rate',
    formula: 'eligible_annual_net_operating_income_divided_by_authorized_capitalization_rate',
    requiredInputs: ['eligible_annual_net_operating_income', 'authorized_capitalization_rate'],
    requiredPolicyFields: ['capitalization_rate_authority'],
    calculationAuthorizedWhenInputsEligible: false,
  },
  ltvConstrainedProceeds: {
    formulaKey: 'ltv_constrained_proceeds',
    formula: 'eligible_value_basis_times_authorized_maximum_ltv',
    requiredInputs: ['eligible_value_basis', 'authorized_maximum_ltv'],
    requiredPolicyFields: ['maximum_ltv'],
    calculationAuthorizedWhenInputsEligible: false,
  },
  dscrConstrainedAnnualDebtService: {
    formulaKey: 'dscr_constrained_annual_debt_service',
    formula: 'eligible_annual_net_operating_income_divided_by_authorized_minimum_dscr',
    requiredInputs: ['eligible_annual_net_operating_income', 'authorized_minimum_dscr'],
    requiredPolicyFields: ['minimum_dscr'],
    calculationAuthorizedWhenInputsEligible: false,
  },
  debtServiceConstrainedPrincipal: {
    formulaKey: 'debt_service_constrained_principal',
    formula: 'present_value_of_authorized_periodic_debt_service_at_authorized_rate_and_amortization',
    requiredInputs: [
      'authorized_annual_debt_service',
      'authorized_interest_rate',
      'authorized_amortization_years',
    ],
    requiredPolicyFields: ['minimum_dscr', 'refinancing_interest_rate', 'refinancing_amortization_years'],
    calculationAuthorizedWhenInputsEligible: false,
  },
  bindingConstraint: {
    formulaKey: 'binding_constraint',
    formula: 'minimum_of_eligible_ltv_constrained_and_dscr_constrained_proceeds',
    requiredInputs: ['eligible_ltv_constrained_proceeds', 'eligible_dscr_constrained_proceeds'],
    requiredPolicyFields: ['maximum_ltv', 'minimum_dscr'],
    calculationAuthorizedWhenInputsEligible: false,
  },
});

export function isCanonicalInstitutionalUnderwritingScenarioPolicyContract(value) {
  const policyFields = value?.constraintPolicies || {};
  const requiredPolicyKeys = Object.keys(POLICY_FIELD_AUTHORITY);
  const policyFieldsValid = requiredPolicyKeys.every((key) => {
    const field = policyFields[key];
    const expected = POLICY_FIELD_AUTHORITY[key];
    return Boolean(
      field &&
      hasExactKeys(field, [
        'fieldKey',
        'value',
        'authorityState',
        'requiredAuthority',
        'sourceBacked',
        'policyBacked',
        'calculationAuthorized',
      ]) &&
      field.fieldKey === expected.fieldKey &&
      field.value === null &&
      field.authorityState === 'not_established' &&
      field.requiredAuthority === expected.requiredAuthority &&
      field.sourceBacked === false &&
      field.policyBacked === false &&
      field.calculationAuthorized === false
    );
  });
  const adjustmentValuesAreNull = (adjustments) => Boolean(
    adjustments &&
    typeof adjustments === 'object' &&
    hasExactKeys(adjustments, ADJUSTMENT_KEYS) &&
    Object.values(adjustments).every((value) => value === null)
  );
  const scenarioKeys = Object.keys(SCENARIO_POLICY_FIELDS);
  const scenariosValid = scenarioKeys.every((key) => {
    const scenario = value?.scenarios?.[key];
    const expectedPolicyFields = SCENARIO_POLICY_FIELDS[key];
    return Boolean(
      scenario &&
      hasExactKeys(scenario, [
        'scenarioKey',
        'scenarioType',
        'authorityState',
        'authorized',
        'requiredPolicyFields',
        'adjustments',
        'missingPolicyFields',
        'reportPublicationBlocker',
      ]) &&
      scenario.scenarioKey === key &&
      scenario.scenarioType === 'underwriting_scenario' &&
      scenario.authorized === false &&
      scenario.authorityState === 'not_established' &&
      arraysEqual(scenario.requiredPolicyFields, expectedPolicyFields) &&
      arraysEqual(scenario.missingPolicyFields, expectedPolicyFields) &&
      adjustmentValuesAreNull(scenario.adjustments) &&
      scenario.reportPublicationBlocker === false
    );
  });
  const formulasValid = Boolean(
    hasExactKeys(value?.formulaRegistry, Object.keys(FORMULA_REGISTRY)) &&
    Object.entries(FORMULA_REGISTRY).every(([key, expected]) => {
      const formula = value.formulaRegistry[key];
      return Boolean(
        formula &&
        hasExactKeys(formula, [
          'formulaKey',
          'formula',
          'requiredInputs',
          'requiredPolicyFields',
          'calculationAuthorizedWhenInputsEligible',
        ]) &&
        formula.formulaKey === expected.formulaKey &&
        formula.formula === expected.formula &&
        arraysEqual(formula.requiredInputs, expected.requiredInputs) &&
        arraysEqual(formula.requiredPolicyFields, expected.requiredPolicyFields) &&
        formula.calculationAuthorizedWhenInputsEligible === expected.calculationAuthorizedWhenInputsEligible
      );
    })
  );
  return Boolean(
    value &&
    typeof value === 'object' &&
    hasExactKeys(value, [
      'source',
      'contractVersion',
      'policy',
      'policyAuthority',
      'sourceCase',
      'constraintPolicies',
      'scenarios',
      'classificationPolicies',
      'formulaRegistry',
      'reportPublicationBlocker',
    ]) &&
    value.source === CONTRACT_SOURCE &&
    value.contractVersion === CONTRACT_VERSION &&
    hasExactKeys(value.policy, [
      'authorityCreating',
      'sourceTruthMutationAllowed',
      'calculationsPerformed',
      'downstreamRenderingAuthorized',
      'callerOverridesAccepted',
      'legacyUnderwritingReuseAllowed',
      'missingPolicyValuesRemainNull',
      'optionalPolicyAbsenceMayBlockValidatedCorePublication',
    ]) &&
    value.policy?.authorityCreating === false &&
    value.policy?.sourceTruthMutationAllowed === false &&
    value.policy?.calculationsPerformed === false &&
    value.policy?.downstreamRenderingAuthorized === false &&
    value.policy?.callerOverridesAccepted === false &&
    value.policy?.legacyUnderwritingReuseAllowed === false &&
    value.policy?.missingPolicyValuesRemainNull === true &&
    value.policy?.optionalPolicyAbsenceMayBlockValidatedCorePublication === false &&
    hasExactKeys(value.policyAuthority, [
      'authorityState',
      'approvedPolicyId',
      'approvedPolicyVersion',
      'effectiveDate',
      'approvalReceipt',
    ]) &&
    value.policyAuthority?.authorityState === 'not_established' &&
    value.policyAuthority?.approvedPolicyId === null &&
    value.policyAuthority?.approvedPolicyVersion === null &&
    value.policyAuthority?.effectiveDate === null &&
    value.policyAuthority?.approvalReceipt === null &&
    hasExactKeys(value.sourceCase, [
      'scenarioKey',
      'scenarioType',
      'authorityState',
      'authorized',
      'adjustmentPolicy',
      'adjustments',
      'reportPublicationBlocker',
    ]) &&
    value.sourceCase?.scenarioKey === 'source_case' &&
    value.sourceCase?.scenarioType === 'accepted_source_case' &&
    value.sourceCase?.authorityState === 'canonical_source_facts_only' &&
    value.sourceCase?.authorized === true &&
    value.sourceCase?.adjustmentPolicy === 'accepted_source_facts_without_adjustment' &&
    adjustmentValuesAreNull(value.sourceCase?.adjustments) &&
    value.sourceCase?.reportPublicationBlocker === false &&
    hasExactKeys(policyFields, requiredPolicyKeys) &&
    policyFieldsValid &&
    hasExactKeys(value?.scenarios, scenarioKeys) &&
    scenariosValid &&
    hasExactKeys(value?.classificationPolicies, ['refinanceStability', 'investmentRisk']) &&
    hasExactKeys(value.classificationPolicies?.refinanceStability, [
      'authorityState',
      'thresholds',
      'classifications',
      'classificationAuthorized',
    ]) &&
    value.classificationPolicies?.refinanceStability?.authorityState === 'not_established' &&
    value.classificationPolicies?.refinanceStability?.classificationAuthorized === false &&
    Array.isArray(value.classificationPolicies?.refinanceStability?.thresholds) &&
    value.classificationPolicies.refinanceStability.thresholds.length === 0 &&
    Array.isArray(value.classificationPolicies?.refinanceStability?.classifications) &&
    value.classificationPolicies.refinanceStability.classifications.length === 0 &&
    hasExactKeys(value.classificationPolicies?.investmentRisk, [
      'authorityState',
      'thresholds',
      'classifications',
      'classificationAuthorized',
    ]) &&
    value.classificationPolicies?.investmentRisk?.authorityState === 'not_established' &&
    value.classificationPolicies?.investmentRisk?.classificationAuthorized === false &&
    Array.isArray(value.classificationPolicies?.investmentRisk?.thresholds) &&
    value.classificationPolicies.investmentRisk.thresholds.length === 0 &&
    Array.isArray(value.classificationPolicies?.investmentRisk?.classifications) &&
    value.classificationPolicies.investmentRisk.classifications.length === 0 &&
    formulasValid &&
    value.reportPublicationBlocker === false
  );
}

export function buildCanonicalInstitutionalUnderwritingScenarioPolicyContract() {
  return deepFreeze({
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      calculationsPerformed: false,
      downstreamRenderingAuthorized: false,
      callerOverridesAccepted: false,
      legacyUnderwritingReuseAllowed: false,
      missingPolicyValuesRemainNull: true,
      optionalPolicyAbsenceMayBlockValidatedCorePublication: false,
    },
    policyAuthority: {
      authorityState: 'not_established',
      approvedPolicyId: null,
      approvedPolicyVersion: null,
      effectiveDate: null,
      approvalReceipt: null,
    },
    sourceCase: {
      scenarioKey: 'source_case',
      scenarioType: 'accepted_source_case',
      authorityState: 'canonical_source_facts_only',
      authorized: true,
      adjustmentPolicy: 'accepted_source_facts_without_adjustment',
      adjustments: {
        rentGrowthRate: null,
        occupancyRate: null,
        vacancyRate: null,
        expenseGrowthRate: null,
        taxGrowthRate: null,
        interestRate: null,
        capitalizationRate: null,
        exitCapitalizationRate: null,
        holdPeriodYears: null,
      },
      reportPublicationBlocker: false,
    },
    constraintPolicies: {
      ...Object.fromEntries(Object.entries(POLICY_FIELD_AUTHORITY).map(([key, authority]) => [
        key,
        unavailablePolicyField(authority.fieldKey, authority.requiredAuthority),
      ])),
    },
    scenarios: {
      ...Object.fromEntries(Object.entries(SCENARIO_POLICY_FIELDS).map(([key, fields]) => [
        key,
        unavailableScenario(key, [...fields]),
      ])),
    },
    classificationPolicies: {
      refinanceStability: {
        authorityState: 'not_established',
        thresholds: [],
        classifications: [],
        classificationAuthorized: false,
      },
      investmentRisk: {
        authorityState: 'not_established',
        thresholds: [],
        classifications: [],
        classificationAuthorized: false,
      },
    },
    formulaRegistry: FORMULA_REGISTRY,
    reportPublicationBlocker: false,
  });
}

export const INSTITUTIONAL_UNDERWRITING_SCENARIO_POLICY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  authorityCreating: false,
  callerOverridesAccepted: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
