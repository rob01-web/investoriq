import { isCanonicalDebtServiceInputContract } from './debt-service-input-contract.js';

const CALCULATION_SOURCE = 'canonical_deterministic_debt_service_calculation';
const CALCULATION_VERSION = 1;
const PERIODS_PER_YEAR = 12;

const METHOD_PRIORITY = Object.freeze({
  source_stated_monthly_payment: 1,
  deterministic_amortization_model: 2,
});

const ROLE_CONFIG = Object.freeze({
  currentDebt: Object.freeze({
    canonicalRole: 'current_debt_context',
    principalFact: 'current_outstanding_balance',
    amortizationFact: 'amortization_remaining_years',
    allowedMethods: Object.freeze([
      'source_stated_monthly_payment',
      'deterministic_amortization_model',
    ]),
  }),
  proposedFinancing: Object.freeze({
    canonicalRole: 'purchase_assumptions',
    principalFact: 'proposed_loan_amount',
    amortizationFact: 'amortization_years',
    allowedMethods: Object.freeze(['deterministic_amortization_model']),
  }),
});

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function roundMoney(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function acceptedNumericFact(roleContract, factName, { positive = false, rate = false } = {}) {
  const fact = roleContract?.facts?.[factName] || null;
  if (fact?.sourceBacked !== true) return null;
  const numeric = Number(fact.value);
  if (!Number.isFinite(numeric)) return null;
  if (positive && numeric <= 0) return null;
  if (rate && (numeric < 0 || numeric > 1)) return null;
  return numeric;
}

function collapsedResult(roleKey, roleContract, reasonCode, inputState = null) {
  return {
    roleKey,
    canonicalRole: roleContract?.canonicalRole || ROLE_CONFIG[roleKey]?.canonicalRole || null,
    calculationStatus: 'collapsed',
    reasonCode,
    selectedMethod: null,
    monthlyDebtService: null,
    annualDebtService: null,
    inputBundleSourceBacked: false,
    sourceStatedMonthlyDebtService: false,
    modeledDebtService: false,
    qualificationRequired: false,
    qualificationCode: null,
    inputState,
    inputReceipts: [],
    methodology: null,
    reportPublicationBlocker: false,
  };
}

function selectEligibleBundle(roleContract, allowedMethods) {
  return toArray(roleContract?.debtServiceBundles)
    .filter(
      (bundle) =>
        bundle?.eligibleForDeterministicCalculation === true &&
        bundle?.sourceBacked === true &&
        allowedMethods.includes(bundle?.method)
    )
    .sort(
      (left, right) =>
        (METHOD_PRIORITY[left.method] || Number.MAX_SAFE_INTEGER) -
        (METHOD_PRIORITY[right.method] || Number.MAX_SAFE_INTEGER)
    )[0] || null;
}

function calculateModeledMonthlyDebtService({ principal, annualInterestRate, amortizationYears }) {
  if (!Number.isFinite(principal) || principal <= 0) {
    return { ok: false, reasonCode: 'MODELED_PRINCIPAL_INVALID' };
  }
  if (!Number.isFinite(annualInterestRate) || annualInterestRate < 0 || annualInterestRate > 1) {
    return { ok: false, reasonCode: 'MODELED_ANNUAL_INTEREST_RATE_INVALID' };
  }
  if (!Number.isFinite(amortizationYears) || amortizationYears <= 0) {
    return { ok: false, reasonCode: 'MODELED_AMORTIZATION_INVALID' };
  }

  const rawPeriods = amortizationYears * PERIODS_PER_YEAR;
  const totalPeriods = Math.round(rawPeriods);
  if (
    totalPeriods <= 0 ||
    !Number.isSafeInteger(totalPeriods) ||
    Math.abs(rawPeriods - totalPeriods) > 1e-9
  ) {
    return { ok: false, reasonCode: 'MODELED_AMORTIZATION_PERIOD_COUNT_NOT_WHOLE' };
  }

  const periodicRate = annualInterestRate / PERIODS_PER_YEAR;
  const stableAmortizationDenominator = periodicRate === 0
    ? null
    : -Math.expm1(-totalPeriods * Math.log1p(periodicRate));
  const rawMonthlyDebtService = periodicRate === 0
    ? principal / totalPeriods
    : principal * periodicRate / stableAmortizationDenominator;
  const monthlyDebtService = roundMoney(rawMonthlyDebtService);
  if (!Number.isFinite(monthlyDebtService) || monthlyDebtService <= 0) {
    return { ok: false, reasonCode: 'MODELED_DEBT_SERVICE_NUMERIC_FAILURE' };
  }
  const annualDebtService = roundMoney(monthlyDebtService * PERIODS_PER_YEAR);
  if (!Number.isFinite(annualDebtService) || annualDebtService <= 0) {
    return { ok: false, reasonCode: 'MODELED_ANNUAL_DEBT_SERVICE_NUMERIC_FAILURE' };
  }

  return {
    ok: true,
    principal,
    annualInterestRate,
    amortizationYears,
    periodicRate,
    totalPeriods,
    monthlyDebtService,
    annualDebtService,
  };
}

function buildSourceStatedCalculation(roleKey, roleContract, bundle) {
  const monthlyDebtService = acceptedNumericFact(roleContract, 'monthly_payment', { positive: true });
  if (monthlyDebtService === null) {
    return collapsedResult(roleKey, roleContract, 'SOURCE_STATED_MONTHLY_PAYMENT_NOT_ACCEPTED', bundle?.eligibilityState || null);
  }
  const annualDebtService = roundMoney(monthlyDebtService * PERIODS_PER_YEAR);
  if (annualDebtService === null || annualDebtService <= 0) {
    return collapsedResult(roleKey, roleContract, 'SOURCE_STATED_ANNUALIZATION_NUMERIC_FAILURE', bundle?.eligibilityState || null);
  }
  return {
    roleKey,
    canonicalRole: roleContract.canonicalRole,
    calculationStatus: 'calculated',
    reasonCode: null,
    selectedMethod: 'source_stated_monthly_payment',
    monthlyDebtService,
    annualDebtService,
    inputBundleSourceBacked: true,
    sourceStatedMonthlyDebtService: true,
    modeledDebtService: false,
    qualificationRequired: false,
    qualificationCode: null,
    inputState: bundle.eligibilityState,
    inputReceipts: bundle.acceptedProvenanceFields,
    methodology: {
      calculationType: 'source_stated_monthly_payment_annualization',
      annualizationPeriods: PERIODS_PER_YEAR,
      annualizationFormula: 'accepted_monthly_payment_times_12',
      resultClassification: 'source_stated_monthly_and_deterministically_annualized',
    },
    reportPublicationBlocker: false,
  };
}

function buildModeledCalculation(roleKey, roleContract, bundle, config) {
  const principal = acceptedNumericFact(roleContract, config.principalFact, { positive: true });
  const annualInterestRate = acceptedNumericFact(roleContract, 'interest_rate', { rate: true });
  const amortizationYears = acceptedNumericFact(roleContract, config.amortizationFact, { positive: true });
  const result = calculateModeledMonthlyDebtService({
    principal,
    annualInterestRate,
    amortizationYears,
  });
  if (!result.ok) {
    return collapsedResult(roleKey, roleContract, result.reasonCode, bundle?.eligibilityState || null);
  }
  return {
    roleKey,
    canonicalRole: roleContract.canonicalRole,
    calculationStatus: 'calculated',
    reasonCode: null,
    selectedMethod: 'deterministic_amortization_model',
    monthlyDebtService: result.monthlyDebtService,
    annualDebtService: result.annualDebtService,
    inputBundleSourceBacked: true,
    sourceStatedMonthlyDebtService: false,
    modeledDebtService: true,
    qualificationRequired: true,
    qualificationCode: 'MODELED_DEBT_SERVICE_CALCULATION',
    inputState: bundle.eligibilityState,
    inputReceipts: bundle.acceptedProvenanceFields,
    methodology: {
      calculationType: 'deterministic_level_payment_amortization',
      principal: result.principal,
      acceptedAnnualInterestRate: result.annualInterestRate,
      acceptedAmortizationYears: result.amortizationYears,
      periodsPerYear: PERIODS_PER_YEAR,
      totalPeriods: result.totalPeriods,
      periodicRate: result.periodicRate,
      periodicRateConvention: 'accepted_annual_interest_rate_divided_by_12',
      paymentTiming: 'end_of_period',
      formula: 'principal_times_periodic_rate_divided_by_one_minus_one_plus_periodic_rate_to_negative_total_periods',
      resultClassification: 'modeled_not_source_stated',
    },
    reportPublicationBlocker: false,
  };
}

function buildRoleCalculation(roleKey, roleContract) {
  const config = ROLE_CONFIG[roleKey];
  if (!config || !roleContract || roleContract.canonicalRole !== config.canonicalRole) {
    return collapsedResult(roleKey, roleContract, 'CANONICAL_ROLE_CONTRACT_MISMATCH');
  }
  const bundle = selectEligibleBundle(roleContract, config.allowedMethods);
  if (!bundle) {
    return collapsedResult(
      roleKey,
      roleContract,
      'DEBT_SERVICE_INPUT_BUNDLE_NOT_ELIGIBLE',
      roleContract.sectionStatus || null
    );
  }
  if (bundle.method === 'source_stated_monthly_payment') {
    return buildSourceStatedCalculation(roleKey, roleContract, bundle);
  }
  if (bundle.method === 'deterministic_amortization_model') {
    return buildModeledCalculation(roleKey, roleContract, bundle, config);
  }
  return collapsedResult(roleKey, roleContract, 'DEBT_SERVICE_METHOD_NOT_SUPPORTED', bundle.method || null);
}

export function isCanonicalDeterministicDebtServiceCalculation(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === CALCULATION_SOURCE &&
    value.calculationVersion === CALCULATION_VERSION
  );
}

export function buildDeterministicDebtServiceCalculation({ debtServiceInputContract } = {}) {
  if (!isCanonicalDebtServiceInputContract(debtServiceInputContract)) {
    throw new Error('CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED');
  }

  const currentDebt = buildRoleCalculation('currentDebt', debtServiceInputContract.currentDebt);
  const proposedFinancing = buildRoleCalculation('proposedFinancing', debtServiceInputContract.proposedFinancing);
  const results = { currentDebt, proposedFinancing };
  const calculatedRoles = Object.entries(results)
    .filter(([, result]) => result.calculationStatus === 'calculated')
    .map(([roleKey]) => roleKey);

  return deepFreeze({
    source: CALCULATION_SOURCE,
    calculationVersion: CALCULATION_VERSION,
    inputContract: {
      source: debtServiceInputContract.source,
      contractVersion: debtServiceInputContract.contractVersion,
      jobId: debtServiceInputContract?.sourceTruth?.jobId || null,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      calculationsPerformed: true,
      customerFacingCopyProduced: false,
      rendererBehaviorChanged: false,
      modeledResultsMustBeQualified: true,
      missingNumericValuesRemainNull: true,
      optionalDebtFailureMayBlockCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    currentDebt,
    proposedFinancing,
    coverage: {
      calculatedRoleCount: calculatedRoles.length,
      calculatedRoles,
      collapsedRoles: Object.keys(results).filter((roleKey) => !calculatedRoles.includes(roleKey)),
    },
  });
}
