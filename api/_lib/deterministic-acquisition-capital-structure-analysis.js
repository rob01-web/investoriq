import { isCanonicalInstitutionalUnderwritingInputContract } from './institutional-underwriting-input-contract.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_acquisition_capital_structure_analysis';
const ANALYSIS_VERSION = 1;
const MONEY_PRECISION = 2;
const RATIO_PRECISION = 6;

const FORMULA_REGISTRY = Object.freeze({
  proposedLoanToPurchasePrice: Object.freeze({
    formulaKey: 'proposed_loan_to_purchase_price',
    formula: 'accepted_proposed_loan_amount_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['proposed_loan_amount', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  sourceStatedLtvDifference: Object.freeze({
    formulaKey: 'source_stated_ltv_difference',
    formula: 'accepted_source_stated_ltv_minus_derived_proposed_loan_to_purchase_price',
    requiredCanonicalFacts: Object.freeze(['ltv', 'proposed_loan_amount', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  purchasePriceLessProposedLoan: Object.freeze({
    formulaKey: 'purchase_price_less_proposed_loan',
    formula: 'accepted_purchase_price_minus_accepted_proposed_loan_amount',
    requiredCanonicalFacts: Object.freeze(['purchase_price', 'proposed_loan_amount']),
    units: 'currency',
    precision: MONEY_PRECISION,
  }),
  unfinancedPurchasePriceShare: Object.freeze({
    formulaKey: 'unfinanced_purchase_price_share',
    formula: 'purchase_price_less_proposed_loan_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['purchase_price', 'proposed_loan_amount']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  proposedLoanPerUnit: Object.freeze({
    formulaKey: 'proposed_loan_per_unit',
    formula: 'accepted_proposed_loan_amount_divided_by_accepted_total_units',
    requiredCanonicalFacts: Object.freeze(['proposed_loan_amount', 'total_units']),
    units: 'currency_per_unit',
    precision: MONEY_PRECISION,
  }),
  unfinancedPurchasePricePerUnit: Object.freeze({
    formulaKey: 'unfinanced_purchase_price_per_unit',
    formula: 'purchase_price_less_proposed_loan_divided_by_accepted_total_units',
    requiredCanonicalFacts: Object.freeze(['purchase_price', 'proposed_loan_amount', 'total_units']),
    units: 'currency_per_unit',
    precision: MONEY_PRECISION,
  }),
  proposedLenderFeeDollars: Object.freeze({
    formulaKey: 'proposed_lender_fee_dollars',
    formula: 'accepted_proposed_loan_amount_times_accepted_lender_fee_rate',
    requiredCanonicalFacts: Object.freeze(['proposed_loan_amount', 'lender_fee_percent']),
    units: 'currency',
    precision: MONEY_PRECISION,
  }),
  lenderFeeShareOfPurchasePrice: Object.freeze({
    formulaKey: 'lender_fee_share_of_purchase_price',
    formula: 'proposed_lender_fee_dollars_divided_by_accepted_purchase_price',
    requiredCanonicalFacts: Object.freeze(['proposed_loan_amount', 'lender_fee_percent', 'purchase_price']),
    units: 'ratio',
    precision: RATIO_PRECISION,
  }),
  sourceStatedLtvImpliedLoanAmount: Object.freeze({
    formulaKey: 'source_stated_ltv_implied_loan_amount',
    formula: 'accepted_purchase_price_times_accepted_source_stated_ltv',
    requiredCanonicalFacts: Object.freeze(['purchase_price', 'ltv']),
    units: 'currency',
    precision: MONEY_PRECISION,
  }),
  proposedLoanLessLtvImpliedLoanAmount: Object.freeze({
    formulaKey: 'proposed_loan_less_ltv_implied_loan_amount',
    formula: 'accepted_proposed_loan_amount_minus_source_stated_ltv_implied_loan_amount',
    requiredCanonicalFacts: Object.freeze(['proposed_loan_amount', 'purchase_price', 'ltv']),
    units: 'currency',
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

function valuesMatch(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return Math.abs(left - right) <= Math.max(0.000001, Math.abs(left) * 1e-9);
}

function acceptedValuationPurchasePrice(inputContract) {
  const fact = inputContract?.acceptedInputs?.valuation?.purchaseAssumptions?.facts?.purchase_price;
  const value = finite(fact?.value);
  return fact?.sourceBacked === true &&
    value !== null &&
    value > 0 &&
    fact?.provenance?.canonicalRole === 'purchase_assumptions' &&
    fact?.provenance?.factPath === 'support.accepted_facts.purchase_price' &&
    fact?.provenance?.sourceIdentityKey
    ? { value, provenance: fact.provenance }
    : null;
}

function acceptedProposedFact(proposed, factName, { positive = false, rate = false } = {}) {
  const fact = proposed?.facts?.[factName];
  const value = finite(fact?.value);
  const provenance = fact?.provenance;
  if (
    proposed?.canonicalRole !== 'purchase_assumptions' ||
    proposed?.primaryAccepted !== true ||
    proposed?.conflictState !== 'none' ||
    fact?.factAccepted !== true ||
    fact?.sourceBacked !== true ||
    value === null ||
    (positive && value <= 0) ||
    (rate && (value < 0 || value > 1)) ||
    provenance?.canonicalRole !== 'purchase_assumptions' ||
    provenance?.factPath !== `support.accepted_facts.${factName}` ||
    !provenance?.sourceIdentityKey ||
    provenance.sourceIdentityKey !== proposed.sourceIdentityKey
  ) {
    return null;
  }
  return { value, provenance };
}

function acceptedTotalUnits(inputContract) {
  const fact = inputContract?.acceptedInputs?.rentRoll?.totalUnits;
  const value = finite(fact?.value);
  return fact?.sourceBacked === true && Number.isInteger(value) && value > 0 && fact?.provenance
    ? { value, provenance: fact.provenance }
    : null;
}

function purchasePriceAuthority(inputContract, proposed) {
  const valuationPrice = acceptedValuationPurchasePrice(inputContract);
  const proposedPrice = acceptedProposedFact(proposed, 'purchase_price', { positive: true });
  const proposedIdentity = proposed?.sourceIdentityKey || null;
  if (!valuationPrice) {
    return {
      authorityState: 'unavailable',
      eligible: false,
      value: null,
      valuationReceipt: null,
      debtContractReceipt: proposedPrice?.provenance || null,
      reasonCode: 'CANONICAL_PURCHASE_PRICE_NOT_AVAILABLE',
    };
  }
  if (!proposedIdentity || valuationPrice.provenance.sourceIdentityKey !== proposedIdentity) {
    return {
      authorityState: 'source_identity_mismatch',
      eligible: false,
      value: null,
      valuationReceipt: valuationPrice.provenance,
      debtContractReceipt: proposedPrice?.provenance || null,
      reasonCode: 'PURCHASE_PRICE_AND_PROPOSED_FINANCING_SOURCE_IDENTITY_MISMATCH',
    };
  }
  if (proposedPrice && !valuesMatch(valuationPrice.value, proposedPrice.value)) {
    return {
      authorityState: 'conflicting_canonical_copies',
      eligible: false,
      value: null,
      valuationReceipt: valuationPrice.provenance,
      debtContractReceipt: proposedPrice.provenance,
      reasonCode: 'PURCHASE_PRICE_CANONICAL_COPY_MISMATCH',
    };
  }
  return {
    authorityState: proposedPrice ? 'matched_canonical_copies' : 'valuation_receipt_only',
    eligible: true,
    value: valuationPrice.value,
    valuationReceipt: valuationPrice.provenance,
    debtContractReceipt: proposedPrice?.provenance || null,
    reasonCode: null,
  };
}

function formulaResult(calculationKey, values) {
  const input = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, finite(value)]));
  switch (calculationKey) {
    case 'proposedLoanToPurchasePrice':
      return input.proposedLoanAmount === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.proposedLoanAmount / input.purchasePrice;
    case 'sourceStatedLtvDifference':
      return input.sourceStatedLtv === null || input.derivedLoanToPurchasePrice === null
        ? null
        : input.sourceStatedLtv - input.derivedLoanToPurchasePrice;
    case 'purchasePriceLessProposedLoan':
      return input.purchasePrice === null || input.proposedLoanAmount === null
        ? null
        : input.purchasePrice - input.proposedLoanAmount;
    case 'unfinancedPurchasePriceShare':
      return input.unfinancedPurchasePrice === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.unfinancedPurchasePrice / input.purchasePrice;
    case 'proposedLoanPerUnit':
      return input.proposedLoanAmount === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.proposedLoanAmount / input.totalUnits;
    case 'unfinancedPurchasePricePerUnit':
      return input.unfinancedPurchasePrice === null || input.totalUnits === null || input.totalUnits <= 0
        ? null
        : input.unfinancedPurchasePrice / input.totalUnits;
    case 'proposedLenderFeeDollars':
      return input.proposedLoanAmount === null || input.lenderFeeRate === null
        ? null
        : input.proposedLoanAmount * input.lenderFeeRate;
    case 'lenderFeeShareOfPurchasePrice':
      return input.lenderFeeDollars === null || input.purchasePrice === null || input.purchasePrice <= 0
        ? null
        : input.lenderFeeDollars / input.purchasePrice;
    case 'sourceStatedLtvImpliedLoanAmount':
      return input.purchasePrice === null || input.sourceStatedLtv === null
        ? null
        : input.purchasePrice * input.sourceStatedLtv;
    case 'proposedLoanLessLtvImpliedLoanAmount':
      return input.proposedLoanAmount === null || input.ltvImpliedLoanAmount === null
        ? null
        : input.proposedLoanAmount - input.ltvImpliedLoanAmount;
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
  const proposed = inputContract.gate4Inputs.debtService.proposedFinancing;
  const corePublishable = inputContract.sourceTruthReceipt.corePublishable === true;
  const purchasePriceReceipt = purchasePriceAuthority(inputContract, proposed);
  const purchasePrice = purchasePriceReceipt.eligible ? purchasePriceReceipt.value : null;
  const proposedLoan = acceptedProposedFact(proposed, 'proposed_loan_amount', { positive: true });
  const sourceStatedLtv = acceptedProposedFact(proposed, 'ltv', { positive: true });
  const lenderFeeRate = acceptedProposedFact(proposed, 'lender_fee_percent', { rate: true });
  const totalUnits = acceptedTotalUnits(inputContract);
  const roleEligible = corePublishable &&
    proposed?.canonicalRole === 'purchase_assumptions' &&
    proposed?.primaryAccepted === true &&
    proposed?.conflictState === 'none' &&
    proposed?.sourceIdentityKey === purchasePriceReceipt.valuationReceipt?.sourceIdentityKey;
  const priceEligible = roleEligible && purchasePriceReceipt.eligible;
  const loanEligible = priceEligible && Boolean(proposedLoan);

  const priceProvenance = [
    purchasePriceReceipt.valuationReceipt,
    purchasePriceReceipt.debtContractReceipt,
  ].filter(Boolean);
  const derivedLtv = calculationReceipt({
    calculationKey: 'proposedLoanToPurchasePrice',
    inputs: { proposedLoanAmount: proposedLoan?.value ?? null, purchasePrice },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance].filter(Boolean),
    calculationEligible: loanEligible,
    ineligibleReasonCode: purchasePriceReceipt.reasonCode || 'CANONICAL_PROPOSED_LOAN_AMOUNT_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_DERIVED_LOAN_TO_PRICE',
  });
  const statedLtvDifference = calculationReceipt({
    calculationKey: 'sourceStatedLtvDifference',
    inputs: {
      sourceStatedLtv: sourceStatedLtv?.value ?? null,
      derivedLoanToPurchasePrice: derivedLtv.result,
    },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance, sourceStatedLtv?.provenance].filter(Boolean),
    calculationEligible: loanEligible && Boolean(sourceStatedLtv) && derivedLtv.result !== null,
    ineligibleReasonCode: 'CANONICAL_SOURCE_STATED_LTV_COMPARISON_NOT_ELIGIBLE',
    numericReasonCode: 'SOURCE_STATED_LTV_COMPARISON_INPUTS_NOT_ELIGIBLE',
  });
  const unfinancedPurchasePrice = calculationReceipt({
    calculationKey: 'purchasePriceLessProposedLoan',
    inputs: { purchasePrice, proposedLoanAmount: proposedLoan?.value ?? null },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance].filter(Boolean),
    calculationEligible: loanEligible,
    ineligibleReasonCode: purchasePriceReceipt.reasonCode || 'CANONICAL_PROPOSED_LOAN_AMOUNT_NOT_ELIGIBLE',
    numericReasonCode: 'PURCHASE_PRICE_AND_PROPOSED_LOAN_REQUIRED_FOR_UNFINANCED_PURCHASE_PRICE',
  });
  const unfinancedPurchasePriceShare = calculationReceipt({
    calculationKey: 'unfinancedPurchasePriceShare',
    inputs: { unfinancedPurchasePrice: unfinancedPurchasePrice.result, purchasePrice },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance].filter(Boolean),
    calculationEligible: loanEligible && unfinancedPurchasePrice.result !== null,
    ineligibleReasonCode: 'CANONICAL_UNFINANCED_PURCHASE_PRICE_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_UNFINANCED_PURCHASE_SHARE',
  });
  const proposedLoanPerUnit = calculationReceipt({
    calculationKey: 'proposedLoanPerUnit',
    inputs: { proposedLoanAmount: proposedLoan?.value ?? null, totalUnits: totalUnits?.value ?? null },
    inputProvenance: [proposedLoan?.provenance, totalUnits?.provenance].filter(Boolean),
    calculationEligible: loanEligible && Boolean(totalUnits),
    ineligibleReasonCode: 'CANONICAL_PROPOSED_LOAN_AND_TOTAL_UNITS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_PROPOSED_LOAN_PER_UNIT',
  });
  const unfinancedPurchasePricePerUnit = calculationReceipt({
    calculationKey: 'unfinancedPurchasePricePerUnit',
    inputs: {
      unfinancedPurchasePrice: unfinancedPurchasePrice.result,
      totalUnits: totalUnits?.value ?? null,
    },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance, totalUnits?.provenance].filter(Boolean),
    calculationEligible: loanEligible && unfinancedPurchasePrice.result !== null && Boolean(totalUnits),
    ineligibleReasonCode: 'CANONICAL_UNFINANCED_PURCHASE_PRICE_AND_TOTAL_UNITS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_TOTAL_UNITS_REQUIRED_FOR_UNFINANCED_PURCHASE_PRICE_PER_UNIT',
  });
  const lenderFeeDollars = calculationReceipt({
    calculationKey: 'proposedLenderFeeDollars',
    inputs: {
      proposedLoanAmount: proposedLoan?.value ?? null,
      lenderFeeRate: lenderFeeRate?.value ?? null,
    },
    inputProvenance: [proposedLoan?.provenance, lenderFeeRate?.provenance].filter(Boolean),
    calculationEligible: loanEligible && Boolean(lenderFeeRate),
    ineligibleReasonCode: 'CANONICAL_PROPOSED_LENDER_FEE_BUNDLE_NOT_ELIGIBLE',
    numericReasonCode: 'PROPOSED_LOAN_AND_LENDER_FEE_RATE_REQUIRED',
  });
  const lenderFeeShare = calculationReceipt({
    calculationKey: 'lenderFeeShareOfPurchasePrice',
    inputs: { lenderFeeDollars: lenderFeeDollars.result, purchasePrice },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance, lenderFeeRate?.provenance].filter(Boolean),
    calculationEligible: loanEligible && lenderFeeDollars.result !== null,
    ineligibleReasonCode: 'CANONICAL_PROPOSED_LENDER_FEE_DOLLARS_NOT_ELIGIBLE',
    numericReasonCode: 'POSITIVE_PURCHASE_PRICE_REQUIRED_FOR_LENDER_FEE_SHARE',
  });
  const ltvImpliedLoanAmount = calculationReceipt({
    calculationKey: 'sourceStatedLtvImpliedLoanAmount',
    inputs: { purchasePrice, sourceStatedLtv: sourceStatedLtv?.value ?? null },
    inputProvenance: [...priceProvenance, sourceStatedLtv?.provenance].filter(Boolean),
    calculationEligible: priceEligible && Boolean(sourceStatedLtv),
    ineligibleReasonCode: 'CANONICAL_PURCHASE_PRICE_AND_SOURCE_STATED_LTV_NOT_ELIGIBLE',
    numericReasonCode: 'PURCHASE_PRICE_AND_SOURCE_STATED_LTV_REQUIRED_FOR_IMPLIED_LOAN_AMOUNT',
  });
  const proposedLoanDifference = calculationReceipt({
    calculationKey: 'proposedLoanLessLtvImpliedLoanAmount',
    inputs: {
      proposedLoanAmount: proposedLoan?.value ?? null,
      ltvImpliedLoanAmount: ltvImpliedLoanAmount.result,
    },
    inputProvenance: [...priceProvenance, proposedLoan?.provenance, sourceStatedLtv?.provenance].filter(Boolean),
    calculationEligible: loanEligible && ltvImpliedLoanAmount.result !== null,
    ineligibleReasonCode: 'CANONICAL_PROPOSED_LOAN_AND_LTV_IMPLIED_LOAN_NOT_ELIGIBLE',
    numericReasonCode: 'PROPOSED_LOAN_AND_LTV_IMPLIED_LOAN_REQUIRED_FOR_DIFFERENCE',
  });
  const calculations = [
    derivedLtv,
    statedLtvDifference,
    unfinancedPurchasePrice,
    unfinancedPurchasePriceShare,
    proposedLoanPerUnit,
    unfinancedPurchasePricePerUnit,
    lenderFeeDollars,
    lenderFeeShare,
    ltvImpliedLoanAmount,
    proposedLoanDifference,
  ];
  const calculatedCount = calculations.filter((receipt) => receipt.calculationStatus === 'calculated').length;

  return {
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract,
    inputReceipt: {
      source: inputContract.source,
      contractVersion: inputContract.contractVersion,
      jobId: inputContract.sourceTruthReceipt.jobId,
      corePublishable,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      acceptedAcquisitionFactsOnly: true,
      purchasePriceAuthorityReconciled: purchasePriceReceipt.eligible,
      debtServiceCompletenessRequiredForCapitalStructure: false,
      currentDebtUsed: false,
      acquisitionTermsPromotedToRefinancingTerms: false,
      closingCostsInferred: false,
      lenderFeeFundingSourceInferred: false,
      totalEquityRequirementCalculated: false,
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
    purchasePriceAuthority: purchasePriceReceipt,
    capitalStructureAuthority: {
      corePublishable,
      proposedFinancingRoleAccepted: proposed?.roleAccepted === true,
      proposedFinancingPrimaryAccepted: proposed?.primaryAccepted === true,
      proposedFinancingConflictState: proposed?.conflictState || 'none',
      sourceIdentityKey: proposed?.sourceIdentityKey || null,
      debtServiceCalculationEligible: inputContract.eligibility.proposedAcquisitionDebt.calculationEligible === true,
      acceptedFactNames: [
        proposedLoan ? 'proposed_loan_amount' : null,
        sourceStatedLtv ? 'ltv' : null,
        lenderFeeRate ? 'lender_fee_percent' : null,
        totalUnits ? 'total_units' : null,
      ].filter(Boolean),
      capitalStructureCalculationEligible: priceEligible && Boolean(proposedLoan),
      reportPublicationBlocker: false,
    },
    formulaRegistry: FORMULA_REGISTRY,
    section: {
      sectionKey: 'acquisition_capital_structure_reference',
      analysisStatus: calculatedCount > 0 ? 'calculated' : 'collapsed',
      sourceBound: calculatedCount > 0,
      calculations,
      calculatedCount,
      collapsedCount: calculations.length - calculatedCount,
      limitationCodes: [
        'PURCHASE_PRICE_LESS_PROPOSED_LOAN_IS_NOT_TOTAL_EQUITY_REQUIREMENT',
        'LENDER_FEE_FUNDING_SOURCE_NOT_ESTABLISHED',
        'CLOSING_COSTS_AND_OTHER_ACQUISITION_COSTS_NOT_ESTABLISHED',
        'CURRENT_DEBT_NOT_USED_AS_ACQUISITION_FINANCING',
        'ACQUISITION_TERMS_NOT_PROMOTED_TO_REFINANCING_TERMS',
      ],
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    unavailableAnalyses: {
      closingCosts: unavailableAnalysis(
        'closing_costs',
        'CANONICAL_CLOSING_COST_INPUTS_NOT_AVAILABLE'
      ),
      totalEquityRequirement: unavailableAnalysis(
        'total_equity_requirement',
        'COMPLETE_CANONICAL_ACQUISITION_COST_AND_FUNDING_BUNDLE_NOT_AVAILABLE'
      ),
      lenderFeeFundingSource: unavailableAnalysis(
        'lender_fee_funding_source',
        'CANONICAL_LENDER_FEE_FUNDING_SOURCE_NOT_AVAILABLE'
      ),
      currentDebtPayoff: unavailableAnalysis(
        'current_debt_payoff',
        'CURRENT_DEBT_PAYOFF_NOT_AUTHORIZED_AS_ACQUISITION_USE'
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
      calculatedMeasureCount: calculatedCount,
      totalMeasureCount: calculations.length,
      unavailableAnalysisCount: 8,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalUnderwritingInputContract(value.inputContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleAnalysis(value.inputContract));
}

export function buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract } = {}) {
  if (!isCanonicalInstitutionalUnderwritingInputContract(underwritingInputContract)) {
    throw new Error('CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_ACQUISITION_CAPITAL_STRUCTURE_ANALYSIS');
  }
  return deepFreeze(assembleAnalysis(underwritingInputContract));
}

export const DETERMINISTIC_ACQUISITION_CAPITAL_STRUCTURE_ANALYSIS_CONTRACT = deepFreeze({
  source: ANALYSIS_SOURCE,
  analysisVersion: ANALYSIS_VERSION,
  authorityCreating: false,
  deterministicMathOnly: true,
  customerFacingCopyProduced: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
