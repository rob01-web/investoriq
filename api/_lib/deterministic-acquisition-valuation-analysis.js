import { isCanonicalInstitutionalUnderwritingInputContract } from './institutional-underwriting-input-contract.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_acquisition_valuation_analysis';
const ANALYSIS_VERSION = 1;
const MONEY_PRECISION = 2;
const RATIO_PRECISION = 6;

const FORMULA_REGISTRY = Object.freeze({
  purchasePricePerUnit: Object.freeze({
    formulaKey: 'purchase_price_per_unit',
    formula: 'accepted_purchase_price_divided_by_accepted_total_units',
    requiredCanonicalFacts: Object.freeze(['purchase_price', 'total_units']),
    units: 'currency_per_unit',
    precision: MONEY_PRECISION,
  }),
  sourceCaseAcquisitionCapitalizationRate: Object.freeze({
    formulaKey: 'source_case_acquisition_capitalization_rate',
    formula: 'accepted_t12_net_operating_income_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['net_operating_income', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  purchaseAssumptionCapitalizationRate: Object.freeze({
    formulaKey: 'purchase_assumption_capitalization_rate',
    formula: 'accepted_purchase_assumption_noi_basis_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['noi_basis', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  sourceStatedGoingInCapRateDifference: Object.freeze({
    formulaKey: 'source_stated_going_in_cap_rate_difference',
    formula: 'accepted_source_stated_going_in_cap_rate_minus_purchase_assumption_capitalization_rate',
    requiredCanonicalFacts: Object.freeze(['going_in_cap_rate', 'noi_basis', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  sourceCaseNoiLessPurchaseAssumptionNoi: Object.freeze({
    formulaKey: 'source_case_noi_less_purchase_assumption_noi',
    formula: 'accepted_t12_net_operating_income_minus_accepted_purchase_assumption_noi_basis',
    requiredCanonicalFacts: Object.freeze(['net_operating_income', 'noi_basis']),
    units: 'currency_per_year',
    precision: MONEY_PRECISION,
  }),
  sourceCaseCapRateLessPurchaseAssumptionCapRate: Object.freeze({
    formulaKey: 'source_case_cap_rate_less_purchase_assumption_cap_rate',
    formula: 'source_case_acquisition_capitalization_rate_minus_purchase_assumption_capitalization_rate',
    requiredCanonicalFacts: Object.freeze(['net_operating_income', 'noi_basis', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  appraisedValuePerUnit: Object.freeze({
    formulaKey: 'appraised_value_per_unit',
    formula: 'accepted_appraised_value_divided_by_accepted_total_units',
    requiredCanonicalFacts: Object.freeze(['appraised_value', 'total_units']),
    units: 'currency_per_unit',
    precision: MONEY_PRECISION,
  }),
  appraisalDerivedCapitalizationRate: Object.freeze({
    formulaKey: 'appraisal_derived_capitalization_rate',
    formula: 'accepted_appraisal_noi_divided_by_accepted_appraised_value',
    requiredCanonicalFacts: Object.freeze(['appraisal_noi', 'appraised_value']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  sourceStatedAppraisalCapRateDifference: Object.freeze({
    formulaKey: 'source_stated_appraisal_cap_rate_difference',
    formula: 'accepted_source_stated_appraisal_cap_rate_minus_appraisal_derived_capitalization_rate',
    requiredCanonicalFacts: Object.freeze(['appraisal_cap_rate', 'appraisal_noi', 'appraised_value']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  appraisedValueLessPurchasePrice: Object.freeze({
    formulaKey: 'appraised_value_less_purchase_price',
    formula: 'accepted_appraised_value_minus_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['appraised_value', 'purchase_price']),
    units: 'currency',
    precision: MONEY_PRECISION,
  }),
  appraisedValueDifferenceRatioToPurchasePrice: Object.freeze({
    formulaKey: 'appraised_value_difference_ratio_to_purchase_price',
    formula: 'appraised_value_less_purchase_price_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['appraised_value', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  appraisedValueDifferencePerUnit: Object.freeze({
    formulaKey: 'appraised_value_difference_per_unit',
    formula: 'appraised_value_less_purchase_price_divided_by_accepted_total_units',
    requiredCanonicalFacts: Object.freeze(['appraised_value', 'purchase_price', 'total_units']),
    units: 'currency_per_unit',
    precision: MONEY_PRECISION,
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

function formulaResult(formulaKey, values) {
  const input = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, finite(value)]));
  switch (formulaKey) {
    case 'purchasePricePerUnit':
      return input.purchasePrice === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.purchasePrice / input.totalUnits;
    case 'sourceCaseAcquisitionCapitalizationRate':
      return input.netOperatingIncome === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.netOperatingIncome / input.purchasePrice;
    case 'purchaseAssumptionCapitalizationRate':
      return input.noiBasis === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.noiBasis / input.purchasePrice;
    case 'sourceStatedGoingInCapRateDifference':
      return input.goingInCapRate === null || input.purchaseAssumptionCapitalizationRate === null
        ? null
        : input.goingInCapRate - input.purchaseAssumptionCapitalizationRate;
    case 'sourceCaseNoiLessPurchaseAssumptionNoi':
      return input.netOperatingIncome === null || input.noiBasis === null
        ? null
        : input.netOperatingIncome - input.noiBasis;
    case 'sourceCaseCapRateLessPurchaseAssumptionCapRate':
      return input.sourceCaseCapitalizationRate === null || input.purchaseAssumptionCapitalizationRate === null
        ? null
        : input.sourceCaseCapitalizationRate - input.purchaseAssumptionCapitalizationRate;
    case 'appraisedValuePerUnit':
      return input.appraisedValue === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.appraisedValue / input.totalUnits;
    case 'appraisalDerivedCapitalizationRate':
      return input.appraisalNoi === null || input.appraisedValue === null || input.appraisedValue <= 0
        ? null
        : input.appraisalNoi / input.appraisedValue;
    case 'sourceStatedAppraisalCapRateDifference':
      return input.appraisalCapRate === null || input.appraisalDerivedCapitalizationRate === null
        ? null
        : input.appraisalCapRate - input.appraisalDerivedCapitalizationRate;
    case 'appraisedValueLessPurchasePrice':
      return input.appraisedValue === null || input.purchasePrice === null
        ? null
        : input.appraisedValue - input.purchasePrice;
    case 'appraisedValueDifferenceRatioToPurchasePrice':
      return input.appraisedValueDifference === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.appraisedValueDifference / input.purchasePrice;
    case 'appraisedValueDifferencePerUnit':
      return input.appraisedValueDifference === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.appraisedValueDifference / input.totalUnits;
    default:
      return null;
  }
}

function calculationReceipt({
  calculationKey,
  inputs,
  inputProvenance,
  calculationEligible,
  ineligibleReasonCode,
  numericReasonCode,
}) {
  const formula = FORMULA_REGISTRY[calculationKey];
  const rawResult = calculationEligible ? formulaResult(calculationKey, inputs) : null;
  const result = rawResult === null ? null : round(rawResult, formula.precision);
  const calculated = result !== null;
  return {
    calculationKey,
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
      : calculationEligible
        ? numericReasonCode
        : ineligibleReasonCode,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function section({ sectionKey, eligibility, calculations, inputProvenance, limitationCodes }) {
  const calculatedCount = calculations.filter((receipt) => receipt.calculationStatus === 'calculated').length;
  return {
    sectionKey,
    analysisStatus: calculatedCount > 0 ? 'calculated' : 'collapsed',
    sourceBound: calculatedCount > 0,
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

function comparisonEligibility(acquisitionEligible, appraisalEligible) {
  const requiredInputs = [
    'canonical_acquisition_valuation_reference',
    'canonical_appraisal_valuation_reference',
  ];
  const availableInputs = [
    acquisitionEligible ? 'canonical_acquisition_valuation_reference' : null,
    appraisalEligible ? 'canonical_appraisal_valuation_reference' : null,
  ].filter(Boolean);
  const missingInputs = requiredInputs.filter((key) => !availableInputs.includes(key));
  const inputEligible = missingInputs.length === 0;
  return {
    bundleKey: 'acquisition_appraisal_valuation_comparison',
    inputEligible,
    policyEligible: true,
    calculationEligible: inputEligible,
    status: inputEligible ? 'eligible' : 'ineligible_missing_canonical_inputs',
    requiredInputs,
    availableInputs,
    missingInputs,
    requiredPolicyFields: [],
    availablePolicyFields: [],
    missingPolicyFields: [],
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
  const purchase = inputContract.acceptedInputs.valuation.purchaseAssumptions.facts;
  const appraisal = inputContract.acceptedInputs.valuation.appraisal.facts;
  const acquisitionEligibility = inputContract.eligibility.acquisitionValuationReference;
  const appraisalEligibility = inputContract.eligibility.appraisalValuationReference;
  const acquisitionEligible = acquisitionEligibility.calculationEligible === true;
  const appraisalEligible = appraisalEligibility.calculationEligible === true;
  const valuationComparisonEligibility = comparisonEligibility(acquisitionEligible, appraisalEligible);
  const comparisonEligible = valuationComparisonEligibility.calculationEligible === true;

  const purchasePrice = factValue(purchase.purchase_price);
  const goingInCapRate = factValue(purchase.going_in_cap_rate);
  const noiBasis = factValue(purchase.noi_basis);
  const netOperatingIncome = factValue(operating.netOperatingIncome);
  const totalUnits = factValue(rentRoll.totalUnits);
  const appraisedValue = factValue(appraisal.appraised_value);
  const appraisalCapRate = factValue(appraisal.appraisal_cap_rate);
  const appraisalNoi = factValue(appraisal.appraisal_noi);

  const acquisitionProvenance = provenance(
    purchase.purchase_price,
    operating.netOperatingIncome,
    purchase.noi_basis,
    purchase.going_in_cap_rate,
    rentRoll.totalUnits
  );
  const purchasePricePerUnit = calculationReceipt({
    calculationKey: 'purchasePricePerUnit',
    inputs: { purchasePrice, totalUnits },
    inputProvenance: provenance(purchase.purchase_price, rentRoll.totalUnits),
    calculationEligible: acquisitionEligible && totalUnits !== null,
    ineligibleReasonCode: 'CANONICAL_PURCHASE_PRICE_AND_TOTAL_UNITS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_PURCHASE_PRICE_PER_UNIT',
  });
  const sourceCaseCapitalizationRate = calculationReceipt({
    calculationKey: 'sourceCaseAcquisitionCapitalizationRate',
    inputs: { netOperatingIncome, purchasePrice },
    inputProvenance: provenance(operating.netOperatingIncome, purchase.purchase_price),
    calculationEligible: acquisitionEligible,
    ineligibleReasonCode: 'CANONICAL_ACQUISITION_VALUATION_REFERENCE_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_SOURCE_CASE_CAPITALIZATION_RATE',
  });
  const purchaseAssumptionCapitalizationRate = calculationReceipt({
    calculationKey: 'purchaseAssumptionCapitalizationRate',
    inputs: { noiBasis, purchasePrice },
    inputProvenance: provenance(purchase.noi_basis, purchase.purchase_price),
    calculationEligible: acquisitionEligible && noiBasis !== null,
    ineligibleReasonCode: 'CANONICAL_PURCHASE_ASSUMPTION_NOI_BASIS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_PURCHASE_ASSUMPTION_CAPITALIZATION_RATE',
  });
  const sourceStatedGoingInCapRateDifference = calculationReceipt({
    calculationKey: 'sourceStatedGoingInCapRateDifference',
    inputs: {
      goingInCapRate,
      purchaseAssumptionCapitalizationRate: purchaseAssumptionCapitalizationRate.result,
    },
    inputProvenance: provenance(purchase.going_in_cap_rate, purchase.noi_basis, purchase.purchase_price),
    calculationEligible: acquisitionEligible && goingInCapRate !== null && purchaseAssumptionCapitalizationRate.result !== null,
    ineligibleReasonCode: 'CANONICAL_SOURCE_STATED_GOING_IN_CAP_RATE_COMPARISON_NOT_ELIGIBLE',
    numericReasonCode: 'SOURCE_STATED_GOING_IN_CAP_RATE_COMPARISON_INPUTS_NOT_ELIGIBLE',
  });
  const sourceCaseNoiDifference = calculationReceipt({
    calculationKey: 'sourceCaseNoiLessPurchaseAssumptionNoi',
    inputs: { netOperatingIncome, noiBasis },
    inputProvenance: provenance(operating.netOperatingIncome, purchase.noi_basis),
    calculationEligible: acquisitionEligible && noiBasis !== null,
    ineligibleReasonCode: 'CANONICAL_PURCHASE_ASSUMPTION_NOI_BASIS_NOT_ELIGIBLE',
    numericReasonCode: 'SOURCE_CASE_AND_PURCHASE_ASSUMPTION_NOI_INPUTS_NOT_ELIGIBLE',
  });
  const sourceCaseCapRateDifference = calculationReceipt({
    calculationKey: 'sourceCaseCapRateLessPurchaseAssumptionCapRate',
    inputs: {
      sourceCaseCapitalizationRate: sourceCaseCapitalizationRate.result,
      purchaseAssumptionCapitalizationRate: purchaseAssumptionCapitalizationRate.result,
    },
    inputProvenance: provenance(operating.netOperatingIncome, purchase.noi_basis, purchase.purchase_price),
    calculationEligible: acquisitionEligible &&
      sourceCaseCapitalizationRate.result !== null &&
      purchaseAssumptionCapitalizationRate.result !== null,
    ineligibleReasonCode: 'CANONICAL_ACQUISITION_CAPITALIZATION_RATE_COMPARISON_NOT_ELIGIBLE',
    numericReasonCode: 'ACQUISITION_CAPITALIZATION_RATE_COMPARISON_INPUTS_NOT_ELIGIBLE',
  });
  const acquisitionCalculations = [
    purchasePricePerUnit,
    sourceCaseCapitalizationRate,
    purchaseAssumptionCapitalizationRate,
    sourceStatedGoingInCapRateDifference,
    sourceCaseNoiDifference,
    sourceCaseCapRateDifference,
  ];

  const appraisalProvenance = provenance(
    appraisal.appraised_value,
    appraisal.appraisal_noi,
    appraisal.appraisal_cap_rate,
    rentRoll.totalUnits
  );
  const appraisedValuePerUnit = calculationReceipt({
    calculationKey: 'appraisedValuePerUnit',
    inputs: { appraisedValue, totalUnits },
    inputProvenance: provenance(appraisal.appraised_value, rentRoll.totalUnits),
    calculationEligible: appraisalEligible && totalUnits !== null,
    ineligibleReasonCode: 'CANONICAL_APPRAISED_VALUE_AND_TOTAL_UNITS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_APPRAISED_VALUE_PER_UNIT',
  });
  const appraisalDerivedCapitalizationRate = calculationReceipt({
    calculationKey: 'appraisalDerivedCapitalizationRate',
    inputs: { appraisalNoi, appraisedValue },
    inputProvenance: provenance(appraisal.appraisal_noi, appraisal.appraised_value),
    calculationEligible: appraisalEligible && appraisalNoi !== null,
    ineligibleReasonCode: 'CANONICAL_APPRAISAL_NOI_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_APPRAISED_VALUE_REQUIRED_FOR_APPRAISAL_CAPITALIZATION_RATE',
  });
  const sourceStatedAppraisalCapRateDifference = calculationReceipt({
    calculationKey: 'sourceStatedAppraisalCapRateDifference',
    inputs: {
      appraisalCapRate,
      appraisalDerivedCapitalizationRate: appraisalDerivedCapitalizationRate.result,
    },
    inputProvenance: provenance(appraisal.appraisal_cap_rate, appraisal.appraisal_noi, appraisal.appraised_value),
    calculationEligible: appraisalEligible &&
      appraisalCapRate !== null &&
      appraisalDerivedCapitalizationRate.result !== null,
    ineligibleReasonCode: 'CANONICAL_SOURCE_STATED_APPRAISAL_CAP_RATE_COMPARISON_NOT_ELIGIBLE',
    numericReasonCode: 'SOURCE_STATED_APPRAISAL_CAP_RATE_COMPARISON_INPUTS_NOT_ELIGIBLE',
  });
  const appraisalCalculations = [
    appraisedValuePerUnit,
    appraisalDerivedCapitalizationRate,
    sourceStatedAppraisalCapRateDifference,
  ];

  const valuationComparisonProvenance = provenance(
    appraisal.appraised_value,
    purchase.purchase_price,
    rentRoll.totalUnits
  );
  const appraisedValueDifference = calculationReceipt({
    calculationKey: 'appraisedValueLessPurchasePrice',
    inputs: { appraisedValue, purchasePrice },
    inputProvenance: provenance(appraisal.appraised_value, purchase.purchase_price),
    calculationEligible: comparisonEligible,
    ineligibleReasonCode: 'CANONICAL_ACQUISITION_AND_APPRAISAL_VALUATION_REFERENCES_NOT_ELIGIBLE',
    numericReasonCode: 'APPRAISED_VALUE_AND_PURCHASE_PRICE_REQUIRED_FOR_VALUE_DIFFERENCE',
  });
  const appraisedValueDifferenceRatio = calculationReceipt({
    calculationKey: 'appraisedValueDifferenceRatioToPurchasePrice',
    inputs: {
      appraisedValueDifference: appraisedValueDifference.result,
      purchasePrice,
    },
    inputProvenance: provenance(appraisal.appraised_value, purchase.purchase_price),
    calculationEligible: comparisonEligible && appraisedValueDifference.result !== null,
    ineligibleReasonCode: 'CANONICAL_ACQUISITION_AND_APPRAISAL_VALUATION_REFERENCES_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_VALUE_DIFFERENCE_RATIO',
  });
  const appraisedValueDifferencePerUnit = calculationReceipt({
    calculationKey: 'appraisedValueDifferencePerUnit',
    inputs: {
      appraisedValueDifference: appraisedValueDifference.result,
      totalUnits,
    },
    inputProvenance: valuationComparisonProvenance,
    calculationEligible: comparisonEligible && appraisedValueDifference.result !== null && totalUnits !== null,
    ineligibleReasonCode: 'CANONICAL_VALUE_DIFFERENCE_AND_TOTAL_UNITS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_VALUE_DIFFERENCE_PER_UNIT',
  });
  const valuationComparisonCalculations = [
    appraisedValueDifference,
    appraisedValueDifferenceRatio,
    appraisedValueDifferencePerUnit,
  ];

  const sections = {
    acquisitionReference: section({
      sectionKey: 'acquisition_valuation_reference',
      eligibility: acquisitionEligibility,
      calculations: acquisitionCalculations,
      inputProvenance: acquisitionProvenance,
      limitationCodes: [
        'SOURCE_CASE_NOI_AND_PURCHASE_ASSUMPTION_NOI_REMAIN_DISTINCT',
        'SOURCE_STATED_GOING_IN_CAP_RATE_IS_NOT_REPLACED',
        'NO_ACQUISITION_VALUE_CONCLUSION_INFERRED',
      ],
    }),
    appraisalReference: section({
      sectionKey: 'appraisal_valuation_reference',
      eligibility: appraisalEligibility,
      calculations: appraisalCalculations,
      inputProvenance: appraisalProvenance,
      limitationCodes: [
        'APPRAISED_VALUE_IS_A_SOURCE_REFERENCE_NOT_FUTURE_VALUE',
        'SOURCE_STATED_APPRAISAL_CAP_RATE_IS_NOT_REPLACED',
        'NO_APPRAISAL_CONCLUSION_INFERRED',
      ],
    }),
    valuationComparison: section({
      sectionKey: 'acquisition_appraisal_valuation_comparison',
      eligibility: valuationComparisonEligibility,
      calculations: valuationComparisonCalculations,
      inputProvenance: valuationComparisonProvenance,
      limitationCodes: [
        'VALUE_DIFFERENCE_IS_ARITHMETIC_NOT_A_DISCOUNT_OR_PREMIUM_CLASSIFICATION',
        'NO_MARKET_VALUE_OR_APPRECIATION_CONCLUSION_INFERRED',
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
      acceptedSourceReferencesOnly: true,
      sourceNoiBasesKeptDistinct: true,
      sourceStatedCapRatesReplaced: false,
      capitalizationRatePolicyInferred: false,
      appraisalTreatedAsFutureValue: false,
      futureValueCalculated: false,
      appreciationInferred: false,
      exitCapitalizationRateInferred: false,
      refinanceProceedsCalculated: false,
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
      marketValueConclusion: unavailableAnalysis(
        'market_value_conclusion',
        'CANONICAL_MARKET_VALUE_CONCLUSION_AUTHORITY_NOT_AVAILABLE'
      ),
      futureValue: unavailableAnalysis(
        'future_value',
        'CANONICAL_FUTURE_VALUE_INPUTS_AND_POLICY_NOT_AVAILABLE'
      ),
      exitCapitalizationRate: unavailableAnalysis(
        'exit_capitalization_rate',
        'CANONICAL_EXIT_CAPITALIZATION_RATE_POLICY_NOT_AVAILABLE'
      ),
      appreciation: unavailableAnalysis(
        'appreciation',
        'CANONICAL_APPRECIATION_INPUTS_AND_POLICY_NOT_AVAILABLE'
      ),
      refinanceProceeds: unavailableAnalysis(
        'refinance_proceeds',
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
      unavailableAnalysisCount: 8,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicAcquisitionValuationAnalysis(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalUnderwritingInputContract(value.inputContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleAnalysis(value.inputContract));
}

export function buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract } = {}) {
  if (!isCanonicalInstitutionalUnderwritingInputContract(underwritingInputContract)) {
    throw new Error('CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_ACQUISITION_VALUATION_ANALYSIS');
  }
  return deepFreeze(assembleAnalysis(underwritingInputContract));
}

export const DETERMINISTIC_ACQUISITION_VALUATION_ANALYSIS_CONTRACT = deepFreeze({
  source: ANALYSIS_SOURCE,
  analysisVersion: ANALYSIS_VERSION,
  authorityCreating: false,
  deterministicMathOnly: true,
  customerFacingCopyProduced: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
