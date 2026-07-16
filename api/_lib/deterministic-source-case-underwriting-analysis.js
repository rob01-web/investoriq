import { isCanonicalInstitutionalUnderwritingInputContract } from './institutional-underwriting-input-contract.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_source_case_underwriting_analysis';
const ANALYSIS_VERSION = 1;
const RATIO_PRECISION = 6;
const MONEY_PRECISION = 2;

const FORMULA_REGISTRY = Object.freeze({
  impliedNetOperatingIncome: Object.freeze({
    formulaKey: 'implied_net_operating_income',
    formula: 'accepted_effective_gross_income_minus_accepted_total_operating_expenses',
    inputKeys: Object.freeze(['effectiveGrossIncome', 'totalOperatingExpenses']),
    requiredCanonicalFacts: Object.freeze(['effective_gross_income', 'total_operating_expenses']),
    units: 'currency_per_year',
    precision: MONEY_PRECISION,
  }),
  netOperatingIncomeReconciliationDifference: Object.freeze({
    formulaKey: 'net_operating_income_reconciliation_difference',
    formula: 'accepted_net_operating_income_minus_implied_net_operating_income',
    inputKeys: Object.freeze(['netOperatingIncome', 'impliedNetOperatingIncome']),
    requiredCanonicalFacts: Object.freeze([
      'effective_gross_income',
      'total_operating_expenses',
      'net_operating_income',
    ]),
    units: 'currency_per_year',
    precision: MONEY_PRECISION,
  }),
  operatingExpenseRatio: Object.freeze({
    formulaKey: 'operating_expense_ratio',
    formula: 'accepted_total_operating_expenses_divided_by_accepted_effective_gross_income',
    inputKeys: Object.freeze(['totalOperatingExpenses', 'effectiveGrossIncome']),
    requiredCanonicalFacts: Object.freeze(['total_operating_expenses', 'effective_gross_income']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  netOperatingIncomeMargin: Object.freeze({
    formulaKey: 'net_operating_income_margin',
    formula: 'accepted_net_operating_income_divided_by_accepted_effective_gross_income',
    inputKeys: Object.freeze(['netOperatingIncome', 'effectiveGrossIncome']),
    requiredCanonicalFacts: Object.freeze(['net_operating_income', 'effective_gross_income']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  annualMarketRentDifference: Object.freeze({
    formulaKey: 'annual_market_rent_difference',
    formula: 'accepted_annual_market_rent_minus_accepted_annual_in_place_rent',
    inputKeys: Object.freeze(['annualMarketRent', 'annualInPlaceRent']),
    requiredCanonicalFacts: Object.freeze(['annual_market_rent', 'annual_in_place_rent']),
    units: 'currency_per_year',
    precision: MONEY_PRECISION,
  }),
  marketRentDifferenceRatioToInPlace: Object.freeze({
    formulaKey: 'market_rent_difference_ratio_to_in_place',
    formula: 'annual_market_rent_difference_divided_by_accepted_annual_in_place_rent',
    inputKeys: Object.freeze(['annualMarketRentDifference', 'annualInPlaceRent']),
    requiredCanonicalFacts: Object.freeze(['annual_market_rent', 'annual_in_place_rent']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  marketRentDifferencePerUnitMonthly: Object.freeze({
    formulaKey: 'market_rent_difference_per_unit_monthly',
    formula: 'annual_market_rent_difference_divided_by_accepted_total_units_divided_by_12',
    inputKeys: Object.freeze(['annualMarketRentDifference', 'totalUnits']),
    requiredCanonicalFacts: Object.freeze(['annual_market_rent', 'annual_in_place_rent', 'total_units']),
    units: 'currency_per_unit_per_month',
    precision: MONEY_PRECISION,
  }),
  physicalVacancyRate: Object.freeze({
    formulaKey: 'physical_vacancy_rate',
    formula: 'one_minus_accepted_occupancy',
    inputKeys: Object.freeze(['occupancy']),
    requiredCanonicalFacts: Object.freeze(['occupancy']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  occupiedUnitEquivalent: Object.freeze({
    formulaKey: 'occupied_unit_equivalent',
    formula: 'accepted_total_units_times_accepted_occupancy',
    inputKeys: Object.freeze(['totalUnits', 'occupancy']),
    requiredCanonicalFacts: Object.freeze(['total_units', 'occupancy']),
    units: 'unit_equivalent',
    precision: RATIO_PRECISION,
  }),
  vacantUnitEquivalent: Object.freeze({
    formulaKey: 'vacant_unit_equivalent',
    formula: 'accepted_total_units_times_physical_vacancy_rate',
    inputKeys: Object.freeze(['totalUnits', 'physicalVacancyRate']),
    requiredCanonicalFacts: Object.freeze(['total_units', 'occupancy']),
    units: 'unit_equivalent',
    precision: RATIO_PRECISION,
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function finite(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function round(value, precision) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

function factValue(fact) {
  return fact?.sourceBacked === true ? finite(fact.value) : null;
}

function provenance(...facts) {
  return facts
    .filter((fact) => fact?.sourceBacked === true && fact.provenance)
    .map((fact) => fact.provenance);
}

function formulaResult(formulaKey, inputs) {
  const input = Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, finite(value)]));
  switch (formulaKey) {
    case 'impliedNetOperatingIncome':
      return input.effectiveGrossIncome === null || input.totalOperatingExpenses === null
        ? null
        : input.effectiveGrossIncome - input.totalOperatingExpenses;
    case 'netOperatingIncomeReconciliationDifference':
      return input.netOperatingIncome === null || input.impliedNetOperatingIncome === null
        ? null
        : input.netOperatingIncome - input.impliedNetOperatingIncome;
    case 'operatingExpenseRatio':
      return input.totalOperatingExpenses === null || input.effectiveGrossIncome === null || input.effectiveGrossIncome <= 0
        ? null
        : input.totalOperatingExpenses / input.effectiveGrossIncome;
    case 'netOperatingIncomeMargin':
      return input.netOperatingIncome === null || input.effectiveGrossIncome === null || input.effectiveGrossIncome <= 0
        ? null
        : input.netOperatingIncome / input.effectiveGrossIncome;
    case 'annualMarketRentDifference':
      return input.annualMarketRent === null || input.annualInPlaceRent === null
        ? null
        : input.annualMarketRent - input.annualInPlaceRent;
    case 'marketRentDifferenceRatioToInPlace':
      return input.annualMarketRentDifference === null || input.annualInPlaceRent === null || input.annualInPlaceRent <= 0
        ? null
        : input.annualMarketRentDifference / input.annualInPlaceRent;
    case 'marketRentDifferencePerUnitMonthly':
      return input.annualMarketRentDifference === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.annualMarketRentDifference / input.totalUnits / 12;
    case 'physicalVacancyRate':
      return input.occupancy === null || input.occupancy < 0 || input.occupancy > 1
        ? null
        : 1 - input.occupancy;
    case 'occupiedUnitEquivalent':
      return input.totalUnits === null || input.totalUnits <= 0 || input.occupancy === null || input.occupancy < 0 || input.occupancy > 1
        ? null
        : input.totalUnits * input.occupancy;
    case 'vacantUnitEquivalent':
      return input.totalUnits === null || input.totalUnits <= 0 || input.physicalVacancyRate === null || input.physicalVacancyRate < 0 || input.physicalVacancyRate > 1
        ? null
        : input.totalUnits * input.physicalVacancyRate;
    default:
      return null;
  }
}

function calculationReceipt({
  formulaKey,
  inputs,
  inputProvenance,
  canonicalInputEligible,
  ineligibleReasonCode,
  numericReasonCode,
}) {
  const formula = FORMULA_REGISTRY[formulaKey];
  const rawResult = canonicalInputEligible ? formulaResult(formulaKey, inputs) : null;
  const result = rawResult === null ? null : round(rawResult, formula.precision);
  const calculated = result !== null;
  return {
    calculationKey: formulaKey,
    formulaKey: formula.formulaKey,
    formula: formula.formula,
    requiredCanonicalFacts: [...formula.requiredCanonicalFacts],
    inputs,
    inputProvenance,
    units: formula.units,
    precision: formula.precision,
    result,
    calculationStatus: calculated ? 'calculated' : 'collapsed',
    sourceBound: calculated,
    reasonCode: calculated
      ? null
      : canonicalInputEligible
        ? numericReasonCode
        : ineligibleReasonCode,
    reportPublicationBlocker: false,
  };
}

function section({ sectionKey, eligibility, calculations, inputProvenance, limitationCodes }) {
  const calculatedCount = calculations.filter((receipt) => receipt.calculationStatus === 'calculated').length;
  const inputEligible = eligibility?.calculationEligible === true;
  return {
    sectionKey,
    analysisStatus: inputEligible && calculatedCount > 0 ? 'calculated' : 'collapsed',
    sourceBound: inputEligible && calculatedCount > 0,
    inputEligibility: eligibility,
    calculations,
    inputProvenance,
    calculatedCount,
    collapsedCount: calculations.length - calculatedCount,
    limitationCodes,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unavailableAnalysis(analysisKey, reasonCode) {
  return {
    analysisKey,
    authorityState: 'not_authorized',
    calculationPerformed: false,
    value: null,
    reasonCode,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleAnalysis(inputContract) {
  const operating = inputContract.acceptedInputs.operatingStatement;
  const rentRoll = inputContract.acceptedInputs.rentRoll;
  const sourceCaseEligible = inputContract.eligibility.sourceCaseOperating.calculationEligible === true;
  const rentBridgeEligible = inputContract.eligibility.rentBridge.calculationEligible === true;
  const vacancyEligible = inputContract.eligibility.physicalVacancyPosition.calculationEligible === true;

  const effectiveGrossIncome = factValue(operating.effectiveGrossIncome);
  const totalOperatingExpenses = factValue(operating.totalOperatingExpenses);
  const netOperatingIncome = factValue(operating.netOperatingIncome);
  const impliedNetOperatingIncomeRaw = effectiveGrossIncome === null || totalOperatingExpenses === null
    ? null
    : effectiveGrossIncome - totalOperatingExpenses;
  const impliedNetOperatingIncome = impliedNetOperatingIncomeRaw === null
    ? null
    : round(impliedNetOperatingIncomeRaw, MONEY_PRECISION);
  const operatingProvenance = provenance(
    operating.effectiveGrossIncome,
    operating.totalOperatingExpenses,
    operating.netOperatingIncome
  );
  const operatingCalculations = [
    calculationReceipt({
      formulaKey: 'impliedNetOperatingIncome',
      inputs: { effectiveGrossIncome, totalOperatingExpenses },
      inputProvenance: provenance(operating.effectiveGrossIncome, operating.totalOperatingExpenses),
      canonicalInputEligible: sourceCaseEligible,
      ineligibleReasonCode: 'CANONICAL_SOURCE_CASE_OPERATING_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'SOURCE_CASE_OPERATING_NUMERIC_INPUTS_NOT_ELIGIBLE',
    }),
    calculationReceipt({
      formulaKey: 'netOperatingIncomeReconciliationDifference',
      inputs: { netOperatingIncome, impliedNetOperatingIncome },
      inputProvenance: operatingProvenance,
      canonicalInputEligible: sourceCaseEligible,
      ineligibleReasonCode: 'CANONICAL_SOURCE_CASE_OPERATING_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'SOURCE_CASE_NOI_RECONCILIATION_INPUTS_NOT_ELIGIBLE',
    }),
    calculationReceipt({
      formulaKey: 'operatingExpenseRatio',
      inputs: { totalOperatingExpenses, effectiveGrossIncome },
      inputProvenance: provenance(operating.totalOperatingExpenses, operating.effectiveGrossIncome),
      canonicalInputEligible: sourceCaseEligible,
      ineligibleReasonCode: 'CANONICAL_SOURCE_CASE_OPERATING_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'POSITIVE_EFFECTIVE_GROSS_INCOME_REQUIRED_FOR_EXPENSE_RATIO',
    }),
    calculationReceipt({
      formulaKey: 'netOperatingIncomeMargin',
      inputs: { netOperatingIncome, effectiveGrossIncome },
      inputProvenance: provenance(operating.netOperatingIncome, operating.effectiveGrossIncome),
      canonicalInputEligible: sourceCaseEligible,
      ineligibleReasonCode: 'CANONICAL_SOURCE_CASE_OPERATING_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'POSITIVE_EFFECTIVE_GROSS_INCOME_REQUIRED_FOR_NOI_MARGIN',
    }),
  ];

  const annualInPlaceRent = factValue(rentRoll.annualInPlaceRent);
  const annualMarketRent = factValue(rentRoll.annualMarketRent);
  const totalUnits = factValue(rentRoll.totalUnits);
  const annualMarketRentDifferenceRaw = annualMarketRent === null || annualInPlaceRent === null
    ? null
    : annualMarketRent - annualInPlaceRent;
  const annualMarketRentDifference = annualMarketRentDifferenceRaw === null
    ? null
    : round(annualMarketRentDifferenceRaw, MONEY_PRECISION);
  const rentBridgeProvenance = provenance(
    rentRoll.annualInPlaceRent,
    rentRoll.annualMarketRent,
    rentRoll.totalUnits
  );
  const rentBridgeCalculations = [
    calculationReceipt({
      formulaKey: 'annualMarketRentDifference',
      inputs: { annualMarketRent, annualInPlaceRent },
      inputProvenance: provenance(rentRoll.annualMarketRent, rentRoll.annualInPlaceRent),
      canonicalInputEligible: rentBridgeEligible,
      ineligibleReasonCode: 'CANONICAL_RENT_BRIDGE_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'RENT_BRIDGE_NUMERIC_INPUTS_NOT_ELIGIBLE',
    }),
    calculationReceipt({
      formulaKey: 'marketRentDifferenceRatioToInPlace',
      inputs: { annualMarketRentDifference, annualInPlaceRent },
      inputProvenance: provenance(rentRoll.annualMarketRent, rentRoll.annualInPlaceRent),
      canonicalInputEligible: rentBridgeEligible,
      ineligibleReasonCode: 'CANONICAL_RENT_BRIDGE_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'POSITIVE_ANNUAL_IN_PLACE_RENT_REQUIRED_FOR_RENT_DIFFERENCE_RATIO',
    }),
    calculationReceipt({
      formulaKey: 'marketRentDifferencePerUnitMonthly',
      inputs: { annualMarketRentDifference, totalUnits },
      inputProvenance: rentBridgeProvenance,
      canonicalInputEligible: rentBridgeEligible,
      ineligibleReasonCode: 'CANONICAL_RENT_BRIDGE_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_PER_UNIT_RENT_DIFFERENCE',
    }),
  ];

  const occupancy = factValue(rentRoll.occupancy);
  const physicalVacancyRateRaw = occupancy === null ? null : 1 - occupancy;
  const physicalVacancyRate = physicalVacancyRateRaw === null
    ? null
    : round(physicalVacancyRateRaw, RATIO_PRECISION);
  const vacancyProvenance = provenance(rentRoll.occupancy, rentRoll.totalUnits);
  const vacancyCalculations = [
    calculationReceipt({
      formulaKey: 'physicalVacancyRate',
      inputs: { occupancy },
      inputProvenance: provenance(rentRoll.occupancy),
      canonicalInputEligible: vacancyEligible,
      ineligibleReasonCode: 'CANONICAL_PHYSICAL_VACANCY_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'PHYSICAL_VACANCY_NUMERIC_INPUT_NOT_ELIGIBLE',
    }),
    calculationReceipt({
      formulaKey: 'occupiedUnitEquivalent',
      inputs: { totalUnits, occupancy },
      inputProvenance: vacancyProvenance,
      canonicalInputEligible: vacancyEligible,
      ineligibleReasonCode: 'CANONICAL_PHYSICAL_VACANCY_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'TOTAL_UNITS_REQUIRED_FOR_OCCUPIED_UNIT_EQUIVALENT',
    }),
    calculationReceipt({
      formulaKey: 'vacantUnitEquivalent',
      inputs: { totalUnits, physicalVacancyRate },
      inputProvenance: vacancyProvenance,
      canonicalInputEligible: vacancyEligible,
      ineligibleReasonCode: 'CANONICAL_PHYSICAL_VACANCY_INPUTS_NOT_ELIGIBLE',
      numericReasonCode: 'TOTAL_UNITS_REQUIRED_FOR_VACANT_UNIT_EQUIVALENT',
    }),
  ];

  const sections = {
    sourceCaseOperating: section({
      sectionKey: 'source_case_operating',
      eligibility: inputContract.eligibility.sourceCaseOperating,
      calculations: operatingCalculations,
      inputProvenance: operatingProvenance,
      limitationCodes: [
        'SOURCE_REPORTED_OPERATING_FACTS_PRESERVED_WITHOUT_NORMALIZATION',
        'ECONOMIC_VACANCY_NOT_ESTABLISHED',
      ],
    }),
    rentDifference: section({
      sectionKey: 'rent_difference',
      eligibility: inputContract.eligibility.rentBridge,
      calculations: rentBridgeCalculations,
      inputProvenance: rentBridgeProvenance,
      limitationCodes: [
        'SOURCE_STATED_MARKET_RENT_DIFFERENCE_NOT_RENT_GROWTH',
        'RENT_ACHIEVABILITY_NOT_ASSESSED',
      ],
    }),
    physicalVacancy: section({
      sectionKey: 'physical_vacancy',
      eligibility: inputContract.eligibility.physicalVacancyPosition,
      calculations: vacancyCalculations,
      inputProvenance: vacancyProvenance,
      limitationCodes: [
        'UNIT_EQUIVALENTS_ARE_DERIVED_FROM_ACCEPTED_OCCUPANCY',
        'PHYSICAL_VACANCY_IS_NOT_ECONOMIC_VACANCY',
      ],
    }),
  };
  const allCalculations = Object.values(sections).flatMap((sectionValue) => sectionValue.calculations);

  return {
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract,
    inputReceipt: {
      source: inputContract.source,
      contractVersion: inputContract.contractVersion,
      jobId: inputContract.sourceTruthReceipt.jobId,
      corePublishable: inputContract.sourceTruthReceipt.corePublishable,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      acceptedSourceCaseOnly: true,
      expenseNormalizationPerformed: false,
      economicVacancyInferred: false,
      rentGrowthInferred: false,
      scenarioInferenceAllowed: false,
      refinanceConstraintCalculationAllowed: false,
      returnCalculationAllowed: false,
      classificationAllowed: false,
      recommendationAllowed: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      missingNumericValuesRemainNull: true,
      optionalAnalysisFailureMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    formulaRegistry: FORMULA_REGISTRY,
    sections,
    unavailableAnalyses: {
      expenseNormalization: unavailableAnalysis(
        'expense_normalization',
        'CANONICAL_EXPENSE_NORMALIZATION_POLICY_NOT_AVAILABLE'
      ),
      economicVacancy: unavailableAnalysis(
        'economic_vacancy',
        'CANONICAL_ECONOMIC_VACANCY_INPUT_NOT_AVAILABLE'
      ),
      rentGrowth: unavailableAnalysis(
        'rent_growth',
        'CANONICAL_RENT_GROWTH_SCENARIO_NOT_AVAILABLE'
      ),
      bridgeScenario: unavailableAnalysis(
        'bridge_scenario',
        'CANONICAL_BRIDGE_SCENARIO_NOT_AUTHORIZED'
      ),
      exitScenario: unavailableAnalysis(
        'exit_scenario',
        'CANONICAL_EXIT_SCENARIO_NOT_AUTHORIZED'
      ),
      stressScenario: unavailableAnalysis(
        'stress_scenario',
        'CANONICAL_STRESS_SCENARIO_NOT_AUTHORIZED'
      ),
      refinanceConstraints: unavailableAnalysis(
        'refinance_constraints',
        'CANONICAL_REFINANCE_CONSTRAINT_POLICY_NOT_AVAILABLE'
      ),
      returnAnalysis: unavailableAnalysis(
        'return_analysis',
        'CANONICAL_RETURN_INPUTS_AND_POLICY_NOT_AVAILABLE'
      ),
      riskClassification: unavailableAnalysis(
        'risk_classification',
        'CANONICAL_RISK_CLASSIFICATION_POLICY_NOT_AVAILABLE'
      ),
      recommendation: unavailableAnalysis(
        'recommendation',
        'CANONICAL_RECOMMENDATION_AUTHORITY_NOT_AVAILABLE'
      ),
    },
    coverage: {
      calculatedSectionCount: Object.values(sections).filter((sectionValue) => sectionValue.analysisStatus === 'calculated').length,
      totalSectionCount: Object.keys(sections).length,
      calculatedMeasureCount: allCalculations.filter((receipt) => receipt.calculationStatus === 'calculated').length,
      totalMeasureCount: allCalculations.length,
      unavailableAnalysisCount: 10,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicSourceCaseUnderwritingAnalysis(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalUnderwritingInputContract(value.inputContract)) return false;
  const expected = assembleAnalysis(value.inputContract);
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract } = {}) {
  if (!isCanonicalInstitutionalUnderwritingInputContract(underwritingInputContract)) {
    throw new Error('CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_SOURCE_CASE_ANALYSIS');
  }
  return deepFreeze(assembleAnalysis(underwritingInputContract));
}

export const DETERMINISTIC_SOURCE_CASE_UNDERWRITING_ANALYSIS_CONTRACT = deepFreeze({
  source: ANALYSIS_SOURCE,
  analysisVersion: ANALYSIS_VERSION,
  authorityCreating: false,
  deterministicMathOnly: true,
  customerFacingCopyProduced: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
