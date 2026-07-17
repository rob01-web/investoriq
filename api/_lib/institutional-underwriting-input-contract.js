import { isCanonicalSourceTruthPackage } from './source-truth-package.js';
import { isCanonicalInstitutionalFinancialIntelligence } from './institutional-financial-intelligence.js';
import { isCanonicalInstitutionalUnderwritingScenarioPolicyContract } from './institutional-underwriting-scenario-policy-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_underwriting_input_contract';
const CONTRACT_VERSION = 1;
const ACCEPTED_CORE_STATES = new Set(['accepted_complete', 'accepted_constrained']);

const CORE_FACT_SPECS = Object.freeze({
  gross_potential_rent: { kind: 'nonnegative_number' },
  effective_gross_income: { kind: 'nonnegative_number' },
  total_operating_expenses: { kind: 'nonnegative_number' },
  net_operating_income: { kind: 'number' },
  income_lines: { kind: 'nonempty_array' },
  expense_lines: { kind: 'nonempty_array' },
  total_units: { kind: 'positive_integer' },
  occupancy: { kind: 'rate' },
  annual_in_place_rent: { kind: 'nonnegative_number' },
  annual_market_rent: { kind: 'nonnegative_number' },
  unit_mix: { kind: 'nonempty_array' },
  units: { kind: 'nonempty_array' },
});

const SUPPORT_FACT_SPECS = Object.freeze({
  purchase_assumptions: {
    purchase_price: { kind: 'positive_number' },
    going_in_cap_rate: { kind: 'positive_rate' },
    noi_basis: { kind: 'number' },
    closing_costs_percent: { kind: 'rate', returnInputOnly: true },
  },
  appraisal_context: {
    appraised_value: { kind: 'positive_number' },
    appraisal_cap_rate: { kind: 'positive_rate' },
    appraisal_noi: { kind: 'number' },
  },
});

const OPERATING_INPUT_KEYS = Object.freeze([
  'grossPotentialRent',
  'effectiveGrossIncome',
  'totalOperatingExpenses',
  'netOperatingIncome',
  'incomeLines',
  'expenseLines',
]);
const RENT_ROLL_INPUT_KEYS = Object.freeze([
  'totalUnits',
  'occupancy',
  'annualInPlaceRent',
  'annualMarketRent',
  'unitMix',
  'units',
]);
const ELIGIBILITY_KEYS = Object.freeze([
  'sourceCaseOperating',
  'expenseNormalization',
  'rentBridge',
  'physicalVacancyPosition',
  'acquisitionValuationReference',
  'appraisalValuationReference',
  'currentDebt',
  'proposedAcquisitionDebt',
  'coreReconciliation',
  'capitalPlan',
  'refinanceLtvConstraint',
  'refinanceDscrConstraint',
  'returns',
  'bridgeScenario',
  'exitScenario',
  'stressScenario',
]);

function array(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function hasOwn(source, key) {
  return Boolean(source && Object.prototype.hasOwnProperty.call(source, key));
}

function hasExactKeys(value, requiredKeys) {
  const keys = Object.keys(value || {}).sort();
  const expected = [...requiredKeys].sort();
  return keys.length === expected.length && expected.every((key, index) => key === keys[index]);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function normalizedFactValue(value, spec) {
  if (spec?.kind === 'nonempty_array') return Array.isArray(value) && value.length > 0 ? value : null;
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (spec?.kind === 'nonnegative_number' && numeric < 0) return null;
  if (spec?.kind === 'positive_number' && numeric <= 0) return null;
  if (spec?.kind === 'positive_integer' && (!Number.isInteger(numeric) || numeric <= 0)) return null;
  if (spec?.kind === 'rate' && (numeric < 0 || numeric > 1)) return null;
  if (spec?.kind === 'positive_rate' && (numeric <= 0 || numeric > 1)) return null;
  return numeric;
}

function valuesMatch(left, right) {
  if (typeof left === 'number') {
    const numericRight = Number(right);
    if (!Number.isFinite(numericRight)) return false;
    return Math.abs(left - numericRight) <= Math.max(0.000001, Math.abs(left) * 1e-9);
  }
  return text(left) === text(right);
}

function evidenceMatchesAcceptedFact(evidence, acceptedValue) {
  if (!evidence || typeof evidence !== 'object') return false;
  if (!text(evidence.excerpt) || !text(evidence.method)) return false;
  const evidencedValue = evidence.normalizedValue ?? evidence.sourceValue;
  if (evidencedValue === null || evidencedValue === undefined || evidencedValue === '') return false;
  return valuesMatch(acceptedValue, evidencedValue);
}

function canonicalSourceTruthStructureValid(value) {
  const acceptedCoreCoherent = value?.core_publishable !== true || (
    ACCEPTED_CORE_STATES.has(text(value?.core?.t12?.status)) &&
    ACCEPTED_CORE_STATES.has(text(value?.core?.rent_roll?.status)) &&
    array(value?.true_blockers).length === 0
  );
  return Boolean(
    isCanonicalSourceTruthPackage(value) &&
    text(value.job_id) &&
    value.core &&
    typeof value.core === 'object' &&
    value.support &&
    typeof value.support === 'object' &&
    Array.isArray(value.support.accepted) &&
    Array.isArray(value.support.advisory) &&
    Array.isArray(value.support.rejected) &&
    Array.isArray(value.support.adjudication_decisions) &&
    Array.isArray(value.support.conflicts) &&
    Array.isArray(value.support.fact_conflicts) &&
    Array.isArray(value.support.duplicates) &&
    typeof value.core_publishable === 'boolean' &&
    Array.isArray(value.true_blockers) &&
    (value.core_publishable === true || value.true_blockers.length > 0) &&
    acceptedCoreCoherent
  );
}

function buildCoreFact(entry, canonicalRole, factName) {
  const spec = CORE_FACT_SPECS[factName];
  const roleAccepted = Boolean(entry && ACCEPTED_CORE_STATES.has(text(entry.status)));
  const value = normalizedFactValue(entry?.accepted_facts?.[factName], spec);
  const factAccepted = roleAccepted &&
    Boolean(text(entry?.file_id)) &&
    hasOwn(entry?.accepted_facts, factName) &&
    value !== null;
  return {
    factName,
    value: factAccepted ? value : null,
    sourcePresent: Boolean(entry),
    roleAccepted,
    factAccepted,
    sourceBacked: factAccepted,
    sectionDisplayReady: factAccepted,
    evidenceState: factAccepted ? 'canonical_core_validation_bound' : 'canonical_core_fact_not_accepted',
    provenance: factAccepted
      ? {
          authorityBasis: 'canonical_source_truth_package',
          sourceIdentityKey: `file:${text(entry.file_id)}`,
          fileId: text(entry.file_id) || null,
          artifactId: entry.artifact_id || null,
          canonicalRole,
          factPath: `core.${canonicalRole === 'core_t12' ? 't12' : 'rent_roll'}.accepted_facts.${factName}`,
          coreValidationState: text(entry.status),
        }
      : null,
  };
}

function roleAuthorityState(sourceTruthPackage, canonicalRole) {
  const acceptedEntries = array(sourceTruthPackage?.support?.accepted)
    .filter((entry) => text(entry?.canonical_role) === canonicalRole);
  const primaryEntries = acceptedEntries.filter((entry) => (
    entry?.primary_for_role === true &&
    entry?.authority_decision?.roleAccepted === true &&
    text(entry?.authority_decision?.canonicalRole) === canonicalRole &&
    Boolean(text(entry?.file_id)) &&
    text(entry?.authority_decision?.fileId) === text(entry?.file_id)
  ));
  const conflictingFileIds = new Set(array(sourceTruthPackage?.support?.conflicts).map(text).filter(Boolean));
  const duplicateFileIds = new Set(array(sourceTruthPackage?.support?.duplicates).map(text).filter(Boolean));
  const excludedPrimary = primaryEntries.some((entry) => (
    conflictingFileIds.has(text(entry?.file_id)) ||
    duplicateFileIds.has(text(entry?.file_id))
  ));
  const primary = primaryEntries.length === 1 && !excludedPrimary ? primaryEntries[0] : null;
  const sourcePresent = acceptedEntries.length > 0 || array(sourceTruthPackage?.support?.adjudication_decisions)
    .some((decision) => text(decision?.canonicalRole) === canonicalRole && decision?.sourcePresent === true);
  const conflictState = excludedPrimary || primaryEntries.length > 1
    ? 'conflicting'
    : acceptedEntries.length > 0 && !primary
      ? 'accepted_without_single_primary'
      : 'none';
  return {
    sourcePresent,
    roleAccepted: acceptedEntries.length > 0,
    primaryAccepted: Boolean(primary),
    primary,
    conflictState,
    acceptedSourceCount: acceptedEntries.length,
  };
}

function supportFactConflict(sourceTruthPackage, canonicalRole, factName) {
  return array(sourceTruthPackage?.support?.fact_conflicts).some((conflict) => (
    text(conflict?.canonical_role) === canonicalRole &&
    text(conflict?.fact_name) === factName
  ));
}

function buildSupportFact(sourceTruthPackage, authorityState, canonicalRole, factName) {
  const entry = authorityState.primary;
  const spec = SUPPORT_FACT_SPECS[canonicalRole]?.[factName];
  const acceptedFacts = spec?.returnInputOnly
    ? entry?.accepted_return_input_facts
    : entry?.accepted_facts;
  const acceptedFactEvidence = spec?.returnInputOnly
    ? entry?.accepted_return_input_fact_evidence
    : entry?.accepted_fact_evidence;
  const decisionFacts = spec?.returnInputOnly
    ? entry?.authority_decision?.acceptedReturnInputFacts
    : entry?.authority_decision?.acceptedFacts;
  const decisionFactEvidence = spec?.returnInputOnly
    ? entry?.authority_decision?.acceptedReturnInputFactEvidence
    : entry?.authority_decision?.acceptedFactEvidence;
  const decisionSourceBacked = spec?.returnInputOnly
    ? entry?.authority_decision?.returnInputSourceBacked
    : entry?.authority_decision?.sourceBacked;
  const decisionFactAccepted = spec?.returnInputOnly
    ? entry?.authority_decision?.returnInputSourceBacked === true
    : entry?.authority_decision?.factAccepted === true;
  const conflicted = supportFactConflict(sourceTruthPackage, canonicalRole, factName);
  const value = normalizedFactValue(acceptedFacts?.[factName], spec);
  const decisionValue = normalizedFactValue(decisionFacts?.[factName], spec);
  const decisionFactMatches = hasOwn(decisionFacts, factName) &&
    value !== null &&
    decisionValue !== null &&
    valuesMatch(value, decisionValue);
  const factAccepted = Boolean(
    authorityState.primaryAccepted &&
    authorityState.conflictState === 'none' &&
    decisionFactAccepted &&
    decisionFactMatches &&
    !conflicted &&
    hasOwn(acceptedFacts, factName) &&
    value !== null
  );
  const evidence = factAccepted ? acceptedFactEvidence?.[factName] || null : null;
  const decisionEvidence = factAccepted ? decisionFactEvidence?.[factName] || null : null;
  const sourceBacked = factAccepted &&
    decisionSourceBacked === true &&
    evidenceMatchesAcceptedFact(evidence, value) &&
    evidenceMatchesAcceptedFact(decisionEvidence, value);
  return {
    factName,
    value: sourceBacked ? value : null,
    sourcePresent: authorityState.sourcePresent,
    roleAccepted: authorityState.primaryAccepted && authorityState.conflictState === 'none',
    factAccepted,
    sourceBacked,
    sectionDisplayReady: sourceBacked,
    evidenceState: conflicted
      ? 'canonical_fact_conflict'
      : authorityState.conflictState !== 'none'
        ? 'canonical_role_conflict_or_primary_ambiguity'
        : !factAccepted
          ? 'fact_not_accepted'
          : sourceBacked
            ? 'exact_source_evidence_bound'
            : 'accepted_fact_evidence_missing_or_mismatched',
    provenance: sourceBacked
      ? {
          authorityBasis: 'canonical_source_truth_package',
          sourceIdentityKey: `file:${text(entry.file_id)}`,
          fileId: text(entry.file_id) || null,
          artifactId: entry.artifact_id || null,
          canonicalRole,
          factPath: spec?.returnInputOnly
            ? `support.accepted_return_input_facts.${factName}`
            : `support.accepted_facts.${factName}`,
          evidenceExcerpt: text(evidence.excerpt),
          evidenceMethod: text(evidence.method),
          sourceValue: evidence.sourceValue ?? null,
          normalizedValue: evidence.normalizedValue ?? value,
        }
      : null,
  };
}

function buildSupportRole(sourceTruthPackage, canonicalRole) {
  const authorityState = roleAuthorityState(sourceTruthPackage, canonicalRole);
  const facts = Object.fromEntries(Object.keys(SUPPORT_FACT_SPECS[canonicalRole]).map((factName) => [
    factName,
    buildSupportFact(sourceTruthPackage, authorityState, canonicalRole, factName),
  ]));
  const sourceBackedFacts = Object.values(facts).filter((fact) => fact.sourceBacked).map((fact) => fact.factName);
  return {
    canonicalRole,
    sourcePresent: authorityState.sourcePresent,
    roleAccepted: authorityState.primaryAccepted && authorityState.conflictState === 'none',
    factAccepted: Object.values(facts).some((fact) => fact.factAccepted),
    sourceBacked: sourceBackedFacts.length > 0,
    sectionDisplayReady: sourceBackedFacts.length > 0,
    primaryAccepted: authorityState.primaryAccepted,
    conflictState: authorityState.conflictState,
    acceptedSourceCount: authorityState.acceptedSourceCount,
    sourceIdentityKey: authorityState.primary ? `file:${text(authorityState.primary.file_id)}` : null,
    sourceBackedFacts,
    facts,
    reportPublicationBlocker: false,
  };
}

function factAvailable(fact) {
  return fact?.sourceBacked === true;
}

function gate4SectionAvailable(financialIntelligence, sectionKey) {
  return financialIntelligence?.customerSections?.[sectionKey]?.displayReady === true;
}

function eligibility({
  bundleKey,
  requiredInputs = [],
  availableInputs = [],
  requiredPolicyFields = [],
  availablePolicyFields = [],
}) {
  const uniqueRequiredInputs = [...new Set(requiredInputs)];
  const uniqueAvailableInputs = [...new Set(availableInputs)];
  const uniqueRequiredPolicyFields = [...new Set(requiredPolicyFields)];
  const uniqueAvailablePolicyFields = [...new Set(availablePolicyFields)];
  const missingInputs = uniqueRequiredInputs.filter((key) => !uniqueAvailableInputs.includes(key));
  const missingPolicyFields = uniqueRequiredPolicyFields.filter((key) => !uniqueAvailablePolicyFields.includes(key));
  const inputEligible = missingInputs.length === 0;
  const policyEligible = missingPolicyFields.length === 0;
  const calculationEligible = inputEligible && policyEligible;
  return {
    bundleKey,
    inputEligible,
    policyEligible,
    calculationEligible,
    status: calculationEligible
      ? 'eligible'
      : !inputEligible
        ? 'ineligible_missing_canonical_inputs'
        : 'ineligible_policy_authority_not_established',
    requiredInputs: uniqueRequiredInputs,
    availableInputs: uniqueAvailableInputs,
    missingInputs,
    requiredPolicyFields: uniqueRequiredPolicyFields,
    availablePolicyFields: uniqueAvailablePolicyFields,
    missingPolicyFields,
    reportPublicationBlocker: false,
  };
}

function buildEligibility({ operating, rentRoll, valuation, financialIntelligence, scenarioPolicyContract }) {
  const corePublishable = financialIntelligence.sourceTruthReceipt?.corePublishable === true;
  const coreAvailability = corePublishable ? ['canonical_core_publishable'] : [];
  const sourceOperatingAvailable = [
    factAvailable(operating.effectiveGrossIncome) ? 'accepted_effective_gross_income' : null,
    factAvailable(operating.totalOperatingExpenses) ? 'accepted_total_operating_expenses' : null,
    factAvailable(operating.netOperatingIncome) ? 'accepted_net_operating_income' : null,
    factAvailable(rentRoll.annualInPlaceRent) ? 'accepted_annual_in_place_rent' : null,
    factAvailable(rentRoll.occupancy) ? 'accepted_occupancy' : null,
  ].filter(Boolean);
  const rentBridgeAvailable = [
    factAvailable(rentRoll.annualInPlaceRent) ? 'accepted_annual_in_place_rent' : null,
    factAvailable(rentRoll.annualMarketRent) ? 'accepted_annual_market_rent' : null,
    factAvailable(rentRoll.totalUnits) ? 'accepted_total_units' : null,
  ].filter(Boolean);
  const acquisitionAvailable = [
    factAvailable(valuation.purchaseAssumptions.facts.purchase_price) ? 'accepted_purchase_price' : null,
    factAvailable(operating.netOperatingIncome) ? 'accepted_net_operating_income' : null,
  ].filter(Boolean);
  const appraisalAvailable = [
    factAvailable(valuation.appraisal.facts.appraised_value) ? 'accepted_appraised_value' : null,
  ].filter(Boolean);
  const acceptedPolicyFields = Object.values(scenarioPolicyContract.constraintPolicies)
    .filter((field) => field.policyBacked === true && field.calculationAuthorized === true)
    .map((field) => field.fieldKey);

  return {
    sourceCaseOperating: eligibility({
      bundleKey: 'source_case_operating',
      requiredInputs: [
        'canonical_core_publishable',
        'accepted_effective_gross_income',
        'accepted_total_operating_expenses',
        'accepted_net_operating_income',
        'accepted_annual_in_place_rent',
        'accepted_occupancy',
      ],
      availableInputs: [...coreAvailability, ...sourceOperatingAvailable],
    }),
    expenseNormalization: eligibility({
      bundleKey: 'expense_normalization',
      requiredInputs: ['canonical_core_publishable', 'accepted_effective_gross_income', 'accepted_operating_expense_lines'],
      availableInputs: [
        ...coreAvailability,
        factAvailable(operating.effectiveGrossIncome) ? 'accepted_effective_gross_income' : null,
        factAvailable(operating.expenseLines) ? 'accepted_operating_expense_lines' : null,
      ].filter(Boolean),
      requiredPolicyFields: ['expense_normalization_policy'],
      availablePolicyFields: acceptedPolicyFields,
    }),
    rentBridge: eligibility({
      bundleKey: 'rent_bridge',
      requiredInputs: ['canonical_core_publishable', 'accepted_annual_in_place_rent', 'accepted_annual_market_rent', 'accepted_total_units'],
      availableInputs: [...coreAvailability, ...rentBridgeAvailable],
    }),
    physicalVacancyPosition: eligibility({
      bundleKey: 'physical_vacancy_position',
      requiredInputs: ['canonical_core_publishable', 'accepted_occupancy'],
      availableInputs: [...coreAvailability, ...(factAvailable(rentRoll.occupancy) ? ['accepted_occupancy'] : [])],
    }),
    acquisitionValuationReference: eligibility({
      bundleKey: 'acquisition_valuation_reference',
      requiredInputs: ['canonical_core_publishable', 'accepted_purchase_price', 'accepted_net_operating_income'],
      availableInputs: [...coreAvailability, ...acquisitionAvailable],
    }),
    appraisalValuationReference: eligibility({
      bundleKey: 'appraisal_valuation_reference',
      requiredInputs: ['canonical_core_publishable', 'accepted_appraised_value'],
      availableInputs: [...coreAvailability, ...appraisalAvailable],
    }),
    currentDebt: eligibility({
      bundleKey: 'current_debt',
      requiredInputs: ['canonical_core_publishable', 'canonical_gate4_current_debt'],
      availableInputs: [
        ...coreAvailability,
        ...(financialIntelligence.contracts.debtServiceInput?.currentDebt?.sourceBacked === true
          ? ['canonical_gate4_current_debt']
          : []),
      ],
    }),
    proposedAcquisitionDebt: eligibility({
      bundleKey: 'proposed_acquisition_debt',
      requiredInputs: ['canonical_core_publishable', 'canonical_gate4_proposed_financing'],
      availableInputs: [
        ...coreAvailability,
        ...(financialIntelligence.contracts.debtServiceInput?.proposedFinancing?.sourceBacked === true
          ? ['canonical_gate4_proposed_financing']
          : []),
      ],
    }),
    coreReconciliation: eligibility({
      bundleKey: 'core_reconciliation',
      requiredInputs: ['canonical_core_publishable', 'canonical_gate4_core_reconciliation'],
      availableInputs: [
        ...coreAvailability,
        ...(gate4SectionAvailable(financialIntelligence, 'coreReconciliation')
          ? ['canonical_gate4_core_reconciliation']
          : []),
      ],
    }),
    capitalPlan: eligibility({
      bundleKey: 'capital_plan',
      requiredInputs: ['canonical_core_publishable', 'canonical_gate4_capital_plan'],
      availableInputs: [
        ...coreAvailability,
        ...(financialIntelligence.contracts.capitalPlanInput?.eligibility?.eligibleForCapitalPlanAnalysis === true
          ? ['canonical_gate4_capital_plan']
          : []),
      ],
    }),
    refinanceLtvConstraint: eligibility({
      bundleKey: 'refinance_ltv_constraint',
      requiredInputs: ['canonical_core_publishable', 'eligible_refinance_value_basis'],
      availableInputs: coreAvailability,
      requiredPolicyFields: ['maximum_ltv'],
      availablePolicyFields: acceptedPolicyFields,
    }),
    refinanceDscrConstraint: eligibility({
      bundleKey: 'refinance_dscr_constraint',
      requiredInputs: ['canonical_core_publishable', 'accepted_net_operating_income', 'authorized_refinancing_terms'],
      availableInputs: [
        ...coreAvailability,
        ...(factAvailable(operating.netOperatingIncome) ? ['accepted_net_operating_income'] : []),
      ],
      requiredPolicyFields: ['minimum_dscr', 'refinancing_interest_rate', 'refinancing_amortization_years'],
      availablePolicyFields: acceptedPolicyFields,
    }),
    returns: eligibility({
      bundleKey: 'returns',
      requiredInputs: ['canonical_core_publishable', 'accepted_equity_basis', 'authorized_hold_period', 'authorized_exit_value', 'authorized_selling_costs'],
      availableInputs: coreAvailability,
      requiredPolicyFields: ['hold_period', 'exit_capitalization_rate', 'selling_cost_policy'],
      availablePolicyFields: [],
    }),
    bridgeScenario: eligibility({
      bundleKey: 'bridge_scenario',
      requiredInputs: ['canonical_core_publishable', 'accepted_source_case_operating_inputs'],
      availableInputs: [
        ...coreAvailability,
        ...(sourceOperatingAvailable.length === 5 ? ['accepted_source_case_operating_inputs'] : []),
      ],
      requiredPolicyFields: scenarioPolicyContract.scenarios.bridge.requiredPolicyFields,
      availablePolicyFields: [],
    }),
    exitScenario: eligibility({
      bundleKey: 'exit_scenario',
      requiredInputs: ['canonical_core_publishable', 'accepted_source_case_operating_inputs'],
      availableInputs: [
        ...coreAvailability,
        ...(sourceOperatingAvailable.length === 5 ? ['accepted_source_case_operating_inputs'] : []),
      ],
      requiredPolicyFields: scenarioPolicyContract.scenarios.exit.requiredPolicyFields,
      availablePolicyFields: [],
    }),
    stressScenario: eligibility({
      bundleKey: 'stress_scenario',
      requiredInputs: ['canonical_core_publishable', 'accepted_source_case_operating_inputs'],
      availableInputs: [
        ...coreAvailability,
        ...(sourceOperatingAvailable.length === 5 ? ['accepted_source_case_operating_inputs'] : []),
      ],
      requiredPolicyFields: scenarioPolicyContract.scenarios.stress.requiredPolicyFields,
      availablePolicyFields: [],
    }),
  };
}

function factReceiptValid(fact) {
  return Boolean(
    fact &&
    hasExactKeys(fact, [
      'factName',
      'value',
      'sourcePresent',
      'roleAccepted',
      'factAccepted',
      'sourceBacked',
      'sectionDisplayReady',
      'evidenceState',
      'provenance',
    ]) &&
    typeof fact.factName === 'string' &&
    typeof fact.sourcePresent === 'boolean' &&
    typeof fact.roleAccepted === 'boolean' &&
    typeof fact.factAccepted === 'boolean' &&
    typeof fact.sourceBacked === 'boolean' &&
    typeof fact.sectionDisplayReady === 'boolean' &&
    typeof fact.evidenceState === 'string' &&
    fact.sectionDisplayReady === fact.sourceBacked &&
    (fact.factAccepted === true || fact.value === null) &&
    (fact.sourceBacked === true || (fact.value === null && fact.provenance === null)) &&
    (fact.sourceBacked !== true || (
      fact.roleAccepted === true &&
      fact.factAccepted === true &&
      fact.sectionDisplayReady === true &&
      fact.value !== null &&
      fact.value !== undefined &&
      fact.provenance?.authorityBasis === 'canonical_source_truth_package' &&
      text(fact.provenance?.sourceIdentityKey)
    ))
  );
}

function eligibilityValid(bundle) {
  const requiredInputs = array(bundle?.requiredInputs);
  const availableInputs = array(bundle?.availableInputs);
  const requiredPolicyFields = array(bundle?.requiredPolicyFields);
  const availablePolicyFields = array(bundle?.availablePolicyFields);
  const expectedMissingInputs = requiredInputs.filter((key) => !availableInputs.includes(key));
  const expectedMissingPolicyFields = requiredPolicyFields.filter((key) => !availablePolicyFields.includes(key));
  const expectedInputEligible = expectedMissingInputs.length === 0;
  const expectedPolicyEligible = expectedMissingPolicyFields.length === 0;
  const expectedStatus = expectedInputEligible && expectedPolicyEligible
    ? 'eligible'
    : !expectedInputEligible
      ? 'ineligible_missing_canonical_inputs'
      : 'ineligible_policy_authority_not_established';
  return Boolean(
    bundle &&
    hasExactKeys(bundle, [
      'bundleKey',
      'inputEligible',
      'policyEligible',
      'calculationEligible',
      'status',
      'requiredInputs',
      'availableInputs',
      'missingInputs',
      'requiredPolicyFields',
      'availablePolicyFields',
      'missingPolicyFields',
      'reportPublicationBlocker',
    ]) &&
    typeof bundle.bundleKey === 'string' &&
    typeof bundle.inputEligible === 'boolean' &&
    typeof bundle.policyEligible === 'boolean' &&
    typeof bundle.calculationEligible === 'boolean' &&
    Array.isArray(bundle.requiredInputs) &&
    Array.isArray(bundle.availableInputs) &&
    Array.isArray(bundle.missingInputs) &&
    Array.isArray(bundle.requiredPolicyFields) &&
    Array.isArray(bundle.availablePolicyFields) &&
    Array.isArray(bundle.missingPolicyFields) &&
    new Set(requiredInputs).size === requiredInputs.length &&
    new Set(availableInputs).size === availableInputs.length &&
    new Set(requiredPolicyFields).size === requiredPolicyFields.length &&
    new Set(availablePolicyFields).size === availablePolicyFields.length &&
    bundle.inputEligible === expectedInputEligible &&
    bundle.policyEligible === expectedPolicyEligible &&
    bundle.calculationEligible === (bundle.inputEligible && bundle.policyEligible) &&
    bundle.status === expectedStatus &&
    bundle.missingInputs.length === expectedMissingInputs.length &&
    bundle.missingInputs.every((key, index) => key === expectedMissingInputs[index]) &&
    bundle.missingPolicyFields.length === expectedMissingPolicyFields.length &&
    bundle.missingPolicyFields.every((key, index) => key === expectedMissingPolicyFields[index]) &&
    bundle.reportPublicationBlocker === false
  );
}

function supportRoleValid(role, expectedCanonicalRole) {
  const facts = role?.facts || {};
  const sourceBackedFacts = Object.values(facts).filter((fact) => fact.sourceBacked).map((fact) => fact.factName);
  return Boolean(
    role &&
    hasExactKeys(role, [
      'canonicalRole',
      'sourcePresent',
      'roleAccepted',
      'factAccepted',
      'sourceBacked',
      'sectionDisplayReady',
      'primaryAccepted',
      'conflictState',
      'acceptedSourceCount',
      'sourceIdentityKey',
      'sourceBackedFacts',
      'facts',
      'reportPublicationBlocker',
    ]) &&
    role.canonicalRole === expectedCanonicalRole &&
    typeof role.sourcePresent === 'boolean' &&
    typeof role.roleAccepted === 'boolean' &&
    typeof role.factAccepted === 'boolean' &&
    typeof role.sourceBacked === 'boolean' &&
    typeof role.sectionDisplayReady === 'boolean' &&
    typeof role.primaryAccepted === 'boolean' &&
    ['none', 'conflicting', 'accepted_without_single_primary'].includes(role.conflictState) &&
    Number.isInteger(role.acceptedSourceCount) &&
    role.acceptedSourceCount >= 0 &&
    Array.isArray(role.sourceBackedFacts) &&
    role.sourceBackedFacts.length === sourceBackedFacts.length &&
    role.sourceBackedFacts.every((factName, index) => factName === sourceBackedFacts[index]) &&
    role.factAccepted === Object.values(facts).some((fact) => fact.factAccepted) &&
    role.sourceBacked === (sourceBackedFacts.length > 0) &&
    role.sectionDisplayReady === role.sourceBacked &&
    (role.sourceBacked !== true || (role.roleAccepted === true && text(role.sourceIdentityKey))) &&
    role.reportPublicationBlocker === false
  );
}

export function isCanonicalInstitutionalUnderwritingInputContract(value) {
  const operatingFacts = Object.values(value?.acceptedInputs?.operatingStatement || {});
  const rentRollFacts = Object.values(value?.acceptedInputs?.rentRoll || {});
  const valuationFacts = [
    ...Object.values(value?.acceptedInputs?.valuation?.purchaseAssumptions?.facts || {}),
    ...Object.values(value?.acceptedInputs?.valuation?.appraisal?.facts || {}),
  ];
  const inputKeysValid = hasExactKeys(value?.acceptedInputs?.operatingStatement, OPERATING_INPUT_KEYS) &&
    hasExactKeys(value?.acceptedInputs?.rentRoll, RENT_ROLL_INPUT_KEYS) &&
    hasExactKeys(value?.acceptedInputs?.valuation, ['purchaseAssumptions', 'appraisal']) &&
    hasExactKeys(value?.acceptedInputs?.valuation?.purchaseAssumptions?.facts, Object.keys(SUPPORT_FACT_SPECS.purchase_assumptions)) &&
    hasExactKeys(value?.acceptedInputs?.valuation?.appraisal?.facts, Object.keys(SUPPORT_FACT_SPECS.appraisal_context)) &&
    supportRoleValid(value?.acceptedInputs?.valuation?.purchaseAssumptions, 'purchase_assumptions') &&
    supportRoleValid(value?.acceptedInputs?.valuation?.appraisal, 'appraisal_context');
  const factReceiptsValid = inputKeysValid && [...operatingFacts, ...rentRollFacts, ...valuationFacts]
    .every(factReceiptValid);
  const eligibilityBundlesValid = hasExactKeys(value?.eligibility, ELIGIBILITY_KEYS) &&
    ELIGIBILITY_KEYS.every((key) => (
      eligibilityValid(value.eligibility[key]) &&
      value.eligibility[key].bundleKey === key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    ));
  const jobIdentityMatches = text(value?.sourceTruthReceipt?.jobId) === text(value?.financialIntelligenceReceipt?.jobId);
  const coreAuthorityMatches = value?.sourceTruthReceipt?.corePublishable === value?.financialIntelligenceReceipt?.corePublishable;
  const gate4IdentityMatches = ['debtService', 'coreReconciliation', 'capitalPlan'].every((key) => (
    text(value?.gate4Inputs?.[key]?.sourceTruth?.jobId) === text(value?.sourceTruthReceipt?.jobId)
  ));
  return Boolean(
    value &&
    typeof value === 'object' &&
    hasExactKeys(value, [
      'source',
      'contractVersion',
      'sourceTruthReceipt',
      'financialIntelligenceReceipt',
      'policy',
      'acceptedInputs',
      'gate4Inputs',
      'scenarioPolicy',
      'eligibility',
      'reportPublicationBlocker',
    ]) &&
    value.source === CONTRACT_SOURCE &&
    value.contractVersion === CONTRACT_VERSION &&
    hasExactKeys(value.sourceTruthReceipt, ['source', 'schemaVersion', 'jobId', 'corePublishable']) &&
    value.sourceTruthReceipt?.source === 'canonical_source_truth_package' &&
    hasExactKeys(value.financialIntelligenceReceipt, [
      'source',
      'receiptVersion',
      'jobId',
      'corePublishable',
      'displayReadySectionCount',
      'eligibleCalculationCount',
    ]) &&
    value.financialIntelligenceReceipt?.source === 'canonical_institutional_financial_intelligence' &&
    jobIdentityMatches &&
    coreAuthorityMatches &&
    hasExactKeys(value.policy, [
      'authorityCreating',
      'sourceTruthMutationAllowed',
      'calculationsPerformed',
      'downstreamRenderingAuthorized',
      'callerAliasesAccepted',
      'callerThresholdsAccepted',
      'scenarioInferenceAllowed',
      'acquisitionTermsPromotedToRefinancingTerms',
      'currentDebtPromotedToFutureRefinancingTerms',
      'legacyUnderwritingReuseAllowed',
      'missingNumericValuesRemainNull',
      'optionalUnderwritingFailureMayBlockValidatedCorePublication',
    ]) &&
    value.policy?.authorityCreating === false &&
    value.policy?.sourceTruthMutationAllowed === false &&
    value.policy?.calculationsPerformed === false &&
    value.policy?.downstreamRenderingAuthorized === false &&
    value.policy?.callerAliasesAccepted === false &&
    value.policy?.callerThresholdsAccepted === false &&
    value.policy?.scenarioInferenceAllowed === false &&
    value.policy?.acquisitionTermsPromotedToRefinancingTerms === false &&
    value.policy?.currentDebtPromotedToFutureRefinancingTerms === false &&
    value.policy?.legacyUnderwritingReuseAllowed === false &&
    value.policy?.missingNumericValuesRemainNull === true &&
    value.policy?.optionalUnderwritingFailureMayBlockValidatedCorePublication === false &&
    isCanonicalInstitutionalUnderwritingScenarioPolicyContract(value.scenarioPolicy) &&
    hasExactKeys(value.gate4Inputs, ['debtService', 'coreReconciliation', 'capitalPlan']) &&
    value.gate4Inputs?.debtService?.source === 'canonical_debt_service_input_contract' &&
    value.gate4Inputs?.coreReconciliation?.source === 'canonical_core_reconciliation_input_contract' &&
    value.gate4Inputs?.capitalPlan?.source === 'canonical_capital_plan_input_contract' &&
    gate4IdentityMatches &&
    factReceiptsValid &&
    eligibilityBundlesValid &&
    value.reportPublicationBlocker === false
  );
}

export function buildCanonicalInstitutionalUnderwritingInputContract({
  sourceTruthPackage,
  financialIntelligence,
  scenarioPolicyContract,
} = {}) {
  if (!canonicalSourceTruthStructureValid(sourceTruthPackage)) {
    throw new Error('COMPLETE_CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_INSTITUTIONAL_UNDERWRITING');
  }
  if (!isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) {
    throw new Error('COMPLETE_CANONICAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_INSTITUTIONAL_UNDERWRITING');
  }
  if (!isCanonicalInstitutionalUnderwritingScenarioPolicyContract(scenarioPolicyContract)) {
    throw new Error('CANONICAL_UNDERWRITING_SCENARIO_POLICY_CONTRACT_REQUIRED');
  }
  if (
    text(sourceTruthPackage.job_id) !== text(financialIntelligence.sourceTruthReceipt?.jobId) ||
    sourceTruthPackage.source !== financialIntelligence.sourceTruthReceipt?.source ||
    sourceTruthPackage.schema_version !== financialIntelligence.sourceTruthReceipt?.schemaVersion ||
    sourceTruthPackage.core_publishable !== financialIntelligence.sourceTruthReceipt?.corePublishable
  ) {
    throw new Error('INSTITUTIONAL_UNDERWRITING_UPSTREAM_RECEIPT_IDENTITY_MISMATCH');
  }

  const t12 = sourceTruthPackage.core.t12 || null;
  const rentRollEntry = sourceTruthPackage.core.rent_roll || null;
  const operating = {
    grossPotentialRent: buildCoreFact(t12, 'core_t12', 'gross_potential_rent'),
    effectiveGrossIncome: buildCoreFact(t12, 'core_t12', 'effective_gross_income'),
    totalOperatingExpenses: buildCoreFact(t12, 'core_t12', 'total_operating_expenses'),
    netOperatingIncome: buildCoreFact(t12, 'core_t12', 'net_operating_income'),
    incomeLines: buildCoreFact(t12, 'core_t12', 'income_lines'),
    expenseLines: buildCoreFact(t12, 'core_t12', 'expense_lines'),
  };
  const rentRoll = {
    totalUnits: buildCoreFact(rentRollEntry, 'core_rent_roll', 'total_units'),
    occupancy: buildCoreFact(rentRollEntry, 'core_rent_roll', 'occupancy'),
    annualInPlaceRent: buildCoreFact(rentRollEntry, 'core_rent_roll', 'annual_in_place_rent'),
    annualMarketRent: buildCoreFact(rentRollEntry, 'core_rent_roll', 'annual_market_rent'),
    unitMix: buildCoreFact(rentRollEntry, 'core_rent_roll', 'unit_mix'),
    units: buildCoreFact(rentRollEntry, 'core_rent_roll', 'units'),
  };
  const valuation = {
    purchaseAssumptions: buildSupportRole(sourceTruthPackage, 'purchase_assumptions'),
    appraisal: buildSupportRole(sourceTruthPackage, 'appraisal_context'),
  };
  const eligibilityBundles = buildEligibility({
    operating,
    rentRoll,
    valuation,
    financialIntelligence,
    scenarioPolicyContract,
  });

  return deepFreeze({
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    sourceTruthReceipt: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id || null,
      corePublishable: sourceTruthPackage.core_publishable === true,
    },
    financialIntelligenceReceipt: {
      source: financialIntelligence.source,
      receiptVersion: financialIntelligence.receiptVersion,
      jobId: financialIntelligence.sourceTruthReceipt.jobId || null,
      corePublishable: financialIntelligence.sourceTruthReceipt.corePublishable === true,
      displayReadySectionCount: financialIntelligence.coverage?.displayReadySectionCount ?? null,
      eligibleCalculationCount: financialIntelligence.coverage?.eligibleCalculationCount ?? null,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      calculationsPerformed: false,
      downstreamRenderingAuthorized: false,
      callerAliasesAccepted: false,
      callerThresholdsAccepted: false,
      scenarioInferenceAllowed: false,
      acquisitionTermsPromotedToRefinancingTerms: false,
      currentDebtPromotedToFutureRefinancingTerms: false,
      legacyUnderwritingReuseAllowed: false,
      missingNumericValuesRemainNull: true,
      optionalUnderwritingFailureMayBlockValidatedCorePublication: false,
    },
    acceptedInputs: {
      operatingStatement: operating,
      rentRoll,
      valuation,
    },
    gate4Inputs: {
      debtService: financialIntelligence.contracts.debtServiceInput,
      coreReconciliation: financialIntelligence.contracts.coreReconciliationInput,
      capitalPlan: financialIntelligence.contracts.capitalPlanInput,
    },
    scenarioPolicy: scenarioPolicyContract,
    eligibility: eligibilityBundles,
    reportPublicationBlocker: false,
  });
}

export const INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  authorityCreating: false,
  calculationsPerformed: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
