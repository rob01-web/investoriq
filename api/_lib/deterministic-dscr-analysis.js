import { isCanonicalDebtServiceInputContract } from './debt-service-input-contract.js';
import { buildDeterministicDebtServiceCalculation } from './deterministic-debt-service-calculation.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_dscr_analysis';
const ANALYSIS_VERSION = 1;
const ANALYSIS_PRECISION = 6;
const DISPLAY_PRECISION = 2;

const ROLE_CONFIG = Object.freeze({
  currentDebt: 'current_debt_context',
  proposedFinancing: 'purchase_assumptions',
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function roundRatio(value, precision) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

function acceptedNoiFact(inputContract) {
  const fact = inputContract?.coreInputs?.netOperatingIncome || null;
  const numeric = Number(fact?.value);
  if (fact?.sourceBacked !== true || !Number.isFinite(numeric)) return null;
  return { ...fact, value: numeric };
}

function collapsedCoverageResult({ roleKey, roleInput, debtServiceCalculation, noiFact, reasonCode }) {
  const hasCalculatedDebtService = debtServiceCalculation?.calculationStatus === 'calculated';
  return {
    roleKey,
    canonicalRole: roleInput?.canonicalRole || ROLE_CONFIG[roleKey] || null,
    calculationStatus: 'collapsed',
    eligibilityState: 'ineligible',
    reasonCode,
    annualNetOperatingIncome: noiFact?.sourceBacked === true ? noiFact.value : null,
    annualDebtService: hasCalculatedDebtService
      ? debtServiceCalculation.annualDebtService
      : null,
    ratio: null,
    displayRatio: null,
    ratioUnit: 'x',
    sourceBound: false,
    modeledDebtService: hasCalculatedDebtService && debtServiceCalculation.modeledDebtService === true,
    qualificationRequired: false,
    qualificationCode: null,
    numeratorReceipt: noiFact?.sourceBacked === true ? noiFact.provenance : null,
    denominatorReceipt: hasCalculatedDebtService
      ? {
          calculationSource: 'canonical_deterministic_debt_service_calculation',
          selectedMethod: debtServiceCalculation.selectedMethod,
          inputReceipts: debtServiceCalculation.inputReceipts,
          methodology: debtServiceCalculation.methodology,
        }
      : null,
    inputEligibilityState: roleInput?.dscrEligibility?.eligibilityState || null,
    missingInputs: roleInput?.dscrEligibility?.missingInputs || [],
    evidenceGaps: roleInput?.dscrEligibility?.evidenceGaps || [],
    covenantComparisonPerformed: false,
    minimumRequirement: null,
    thresholdClassification: null,
    reportPublicationBlocker: false,
  };
}

function buildCoverageResult({ roleKey, roleInput, debtServiceCalculation, noiFact }) {
  const expectedRole = ROLE_CONFIG[roleKey];
  if (!expectedRole || roleInput?.canonicalRole !== expectedRole) {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: 'CANONICAL_DSCR_ROLE_MISMATCH',
    });
  }
  if (!noiFact) {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: 'CANONICAL_T12_NOI_NOT_ELIGIBLE',
    });
  }
  if (roleInput?.dscrEligibility?.eligible !== true) {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: 'CANONICAL_DEBT_SERVICE_INPUT_NOT_ELIGIBLE_FOR_DSCR',
    });
  }
  if (debtServiceCalculation?.calculationStatus !== 'calculated') {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: debtServiceCalculation?.reasonCode || 'DEBT_SERVICE_CALCULATION_NOT_AVAILABLE',
    });
  }

  const annualDebtService = Number(debtServiceCalculation.annualDebtService);
  if (!Number.isFinite(annualDebtService) || annualDebtService <= 0) {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: 'ANNUAL_DEBT_SERVICE_NOT_POSITIVE',
    });
  }
  const rawRatio = noiFact.value / annualDebtService;
  const ratio = roundRatio(rawRatio, ANALYSIS_PRECISION);
  const displayRatio = roundRatio(rawRatio, DISPLAY_PRECISION);
  if (!Number.isFinite(ratio) || !Number.isFinite(displayRatio)) {
    return collapsedCoverageResult({
      roleKey,
      roleInput,
      debtServiceCalculation,
      noiFact,
      reasonCode: 'DSCR_NUMERIC_FAILURE',
    });
  }

  const modeledDebtService = debtServiceCalculation.modeledDebtService === true;
  return {
    roleKey,
    canonicalRole: roleInput.canonicalRole,
    calculationStatus: 'calculated',
    eligibilityState: 'eligible',
    reasonCode: null,
    annualNetOperatingIncome: noiFact.value,
    annualDebtService,
    ratio,
    displayRatio,
    ratioUnit: 'x',
    sourceBound: true,
    modeledDebtService,
    qualificationRequired: modeledDebtService,
    qualificationCode: modeledDebtService ? 'MODELED_DEBT_SERVICE_DSCR' : null,
    numeratorReceipt: noiFact.provenance,
    denominatorReceipt: {
      calculationSource: 'canonical_deterministic_debt_service_calculation',
      selectedMethod: debtServiceCalculation.selectedMethod,
      inputReceipts: debtServiceCalculation.inputReceipts,
      methodology: debtServiceCalculation.methodology,
    },
    inputEligibilityState: roleInput.dscrEligibility.eligibilityState,
    missingInputs: [],
    evidenceGaps: [],
    methodology: {
      calculationType: 'annual_net_operating_income_divided_by_annual_debt_service',
      formula: 'accepted_annual_noi_divided_by_deterministic_annual_debt_service',
      analysisPrecisionDecimals: ANALYSIS_PRECISION,
      displayPrecisionDecimals: DISPLAY_PRECISION,
      resultClassification: modeledDebtService
        ? 'coverage_ratio_using_modeled_debt_service'
        : 'coverage_ratio_using_source_stated_monthly_payment_annualized',
    },
    covenantComparisonPerformed: false,
    minimumRequirement: null,
    thresholdClassification: null,
    reportPublicationBlocker: false,
  };
}

function unavailableScenario(scenarioKey) {
  return {
    scenarioKey,
    calculationStatus: 'not_calculated',
    eligibilityState: 'ineligible_canonical_scenario_contract_not_available',
    reasonCode: 'CANONICAL_SCENARIO_INPUT_CONTRACT_REQUIRED',
    requiredCanonicalInputs: [
      'scenario_net_operating_income',
      'scenario_annual_debt_service',
    ],
    inputContractPresent: false,
    sourcePresent: false,
    factAccepted: false,
    sourceBacked: false,
    annualNetOperatingIncome: null,
    annualDebtService: null,
    ratio: null,
    displayRatio: null,
    sourceBound: false,
    covenantComparisonPerformed: false,
    minimumRequirement: null,
    thresholdClassification: null,
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicDscrAnalysis(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === ANALYSIS_SOURCE &&
    value.analysisVersion === ANALYSIS_VERSION
  );
}

export function buildDeterministicDscrAnalysis({ debtServiceInputContract } = {}) {
  if (!isCanonicalDebtServiceInputContract(debtServiceInputContract)) {
    throw new Error('CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED_FOR_DSCR');
  }

  const debtServiceCalculation = buildDeterministicDebtServiceCalculation({ debtServiceInputContract });
  const noiFact = acceptedNoiFact(debtServiceInputContract);
  const currentDebt = buildCoverageResult({
    roleKey: 'currentDebt',
    roleInput: debtServiceInputContract.currentDebt,
    debtServiceCalculation: debtServiceCalculation.currentDebt,
    noiFact,
  });
  const proposedFinancing = buildCoverageResult({
    roleKey: 'proposedFinancing',
    roleInput: debtServiceInputContract.proposedFinancing,
    debtServiceCalculation: debtServiceCalculation.proposedFinancing,
    noiFact,
  });
  const calculatedRoles = [currentDebt, proposedFinancing]
    .filter((result) => result.calculationStatus === 'calculated')
    .map((result) => result.roleKey);

  return deepFreeze({
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract: {
      source: debtServiceInputContract.source,
      contractVersion: debtServiceInputContract.contractVersion,
      jobId: debtServiceInputContract?.sourceTruth?.jobId || null,
    },
    debtServiceCalculation: {
      source: debtServiceCalculation.source,
      calculationVersion: debtServiceCalculation.calculationVersion,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      customerFacingCopyProduced: false,
      rendererBehaviorChanged: false,
      scenarioInferenceAllowed: false,
      baseCaseReuseAsScenarioAllowed: false,
      covenantThresholdInferenceAllowed: false,
      missingNumericValuesRemainNull: true,
      optionalDscrFailureMayBlockCorePublication: false,
      modeledResultsMustBeQualified: true,
      legacyUnderwritingReuseAllowed: false,
    },
    currentDebt,
    proposedFinancing,
    scenarios: {
      bridge: unavailableScenario('bridge'),
      exit: unavailableScenario('exit'),
      stress: unavailableScenario('stress'),
    },
    coverage: {
      calculatedRoleCount: calculatedRoles.length,
      calculatedRoles,
      collapsedRoles: ['currentDebt', 'proposedFinancing'].filter((roleKey) => !calculatedRoles.includes(roleKey)),
      scenarioRolesCalculated: [],
    },
  });
}
