import { isCanonicalDeterministicSourceCaseUnderwritingAnalysis } from './deterministic-source-case-underwriting-analysis.js';
import { isCanonicalDeterministicAcquisitionValuationAnalysis } from './deterministic-acquisition-valuation-analysis.js';
import { isCanonicalDeterministicAcquisitionCapitalStructureAnalysis } from './deterministic-acquisition-capital-structure-analysis.js';

const CONTRACT_SOURCE = 'canonical_institutional_underwriting_return_readiness_contract';
const CONTRACT_VERSION = 1;

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

function calculation(section, calculationKey) {
  return section?.calculations?.find((entry) => entry.calculationKey === calculationKey) || null;
}

function factReference({ referenceKey, fact, units, semanticRestrictionCodes = [] }) {
  const value = finite(fact?.value);
  const available = fact?.sourceBacked === true && value !== null && fact?.provenance;
  return {
    referenceKey,
    value: available ? value : null,
    units,
    referenceAvailable: Boolean(available),
    sourceBound: Boolean(available),
    calculationBound: false,
    authorityState: available ? 'accepted_source_reference' : 'not_available',
    provenance: available ? [fact.provenance] : [],
    formulaKey: null,
    formula: null,
    eligibleAsCompleteReturnInput: false,
    semanticRestrictionCodes,
    reasonCode: available ? null : 'CANONICAL_SOURCE_REFERENCE_NOT_AVAILABLE',
    reportPublicationBlocker: false,
  };
}

function calculationReference({
  referenceKey,
  calculationReceipt,
  units,
  inputKey = null,
  semanticRestrictionCodes = [],
}) {
  const rawValue = inputKey
    ? calculationReceipt?.inputs?.[inputKey]
    : calculationReceipt?.result;
  const value = finite(rawValue);
  const available = calculationReceipt?.sourceBound === true && value !== null;
  return {
    referenceKey,
    value: available ? value : null,
    units,
    referenceAvailable: available,
    sourceBound: available,
    calculationBound: available,
    authorityState: available ? 'canonical_calculation_reference' : 'not_available',
    provenance: available ? calculationReceipt.inputProvenance : [],
    formulaKey: available ? calculationReceipt.formulaKey : null,
    formula: available ? calculationReceipt.formula : null,
    eligibleAsCompleteReturnInput: false,
    semanticRestrictionCodes,
    reasonCode: available ? null : calculationReceipt?.reasonCode || 'CANONICAL_CALCULATION_REFERENCE_NOT_AVAILABLE',
    reportPublicationBlocker: false,
  };
}

function unavailableAuthorityField(fieldKey, units, requiredAuthority, reasonCode) {
  return {
    fieldKey,
    value: null,
    units,
    authorityState: 'not_established',
    sourceBound: false,
    policyBound: false,
    calculationAuthorized: false,
    requiredAuthority,
    provenance: [],
    reasonCode,
    reportPublicationBlocker: false,
  };
}

function readinessBundle({ bundleKey, requiredAuthorityFields, availableAuthorityFields }) {
  const available = [...new Set(availableAuthorityFields)];
  const missing = requiredAuthorityFields.filter((field) => !available.includes(field));
  const eligible = missing.length === 0;
  return {
    bundleKey,
    authorityState: eligible ? 'eligible' : 'ineligible_missing_canonical_authority',
    calculationEligible: eligible,
    requiredAuthorityFields,
    availableAuthorityFields: available,
    missingAuthorityFields: missing,
    calculationPerformed: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unavailableReturnOutput(outputKey, requiredReadinessBundle) {
  return {
    outputKey,
    value: null,
    calculationStatus: 'not_calculated',
    calculationAuthorized: false,
    requiredReadinessBundle,
    reasonCode: 'CANONICAL_RETURN_READINESS_NOT_ESTABLISHED',
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function upstreamAnalysesValid({ sourceCaseAnalysis, valuationAnalysis, capitalStructureAnalysis }) {
  if (!isCanonicalDeterministicSourceCaseUnderwritingAnalysis(sourceCaseAnalysis)) return false;
  if (!isCanonicalDeterministicAcquisitionValuationAnalysis(valuationAnalysis)) return false;
  if (!isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(capitalStructureAnalysis)) return false;
  const sourceCaseInput = JSON.stringify(sourceCaseAnalysis.inputContract);
  const valuationInput = JSON.stringify(valuationAnalysis.inputContract);
  const capitalStructureInput = JSON.stringify(capitalStructureAnalysis.inputContract);
  return sourceCaseInput === valuationInput && valuationInput === capitalStructureInput;
}

function assembleContract({ sourceCaseAnalysis, valuationAnalysis, capitalStructureAnalysis }) {
  const inputContract = sourceCaseAnalysis.inputContract;
  const sourceCaseNoi = factReference({
    referenceKey: 'source_case_net_operating_income',
    fact: inputContract.acceptedInputs.operatingStatement.netOperatingIncome,
    units: 'currency_per_year',
    semanticRestrictionCodes: [
      'NET_OPERATING_INCOME_IS_NOT_EQUITY_CASH_FLOW',
      'DEBT_SERVICE_CAPITAL_EXPENDITURES_RESERVES_AND_TAX_EFFECTS_NOT_INCLUDED',
    ],
  });
  const purchasePrice = factReference({
    referenceKey: 'purchase_price',
    fact: inputContract.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price,
    units: 'currency',
    semanticRestrictionCodes: ['PURCHASE_PRICE_IS_NOT_TOTAL_ACQUISITION_USES'],
  });
  const closingCostsPercent = factReference({
    referenceKey: 'closing_costs_percent',
    fact: inputContract.acceptedInputs.valuation.purchaseAssumptions.facts.closing_costs_percent,
    units: 'rate',
    semanticRestrictionCodes: [
      'CLOSING_COSTS_PERCENT_IS_NOT_CLOSING_COST_DOLLARS',
      'CLOSING_COSTS_FUNDING_TREATMENT_NOT_ESTABLISHED',
    ],
  });
  const appraisedValue = factReference({
    referenceKey: 'appraised_value',
    fact: inputContract.acceptedInputs.valuation.appraisal.facts.appraised_value,
    units: 'currency',
    semanticRestrictionCodes: [
      'APPRAISED_VALUE_IS_NOT_AUTHORIZED_EXIT_VALUE',
      'APPRAISED_VALUE_IS_NOT_FUTURE_VALUE',
    ],
  });
  const proposedLoanCalculation = calculation(
    capitalStructureAnalysis.section,
    'proposedLoanToPurchasePrice'
  );
  const proposedLoanAmount = calculationReference({
    referenceKey: 'proposed_loan_amount',
    calculationReceipt: proposedLoanCalculation,
    inputKey: 'proposedLoanAmount',
    units: 'currency',
    semanticRestrictionCodes: [
      'PROPOSED_ACQUISITION_LOAN_IS_NOT_REFINANCE_PROCEEDS',
      'PROPOSED_ACQUISITION_LOAN_IS_NOT_NET_EQUITY',
    ],
  });
  const unfinancedPurchasePrice = calculationReference({
    referenceKey: 'purchase_price_less_proposed_loan',
    calculationReceipt: calculation(
      capitalStructureAnalysis.section,
      'purchasePriceLessProposedLoan'
    ),
    units: 'currency',
    semanticRestrictionCodes: [
      'PURCHASE_PRICE_LESS_PROPOSED_LOAN_IS_NOT_TOTAL_EQUITY_REQUIREMENT',
      'ACQUISITION_COSTS_AND_FUNDING_TREATMENTS_NOT_INCLUDED',
    ],
  });
  const lenderFeeDollars = calculationReference({
    referenceKey: 'proposed_lender_fee_dollars',
    calculationReceipt: calculation(
      capitalStructureAnalysis.section,
      'proposedLenderFeeDollars'
    ),
    units: 'currency',
    semanticRestrictionCodes: [
      'LENDER_FEE_FUNDING_SOURCE_NOT_ESTABLISHED',
      'LENDER_FEE_IS_NOT_AUTOMATICALLY_AN_EQUITY_USE',
    ],
  });

  const acceptedReferences = {
    sourceCaseNetOperatingIncome: sourceCaseNoi,
    purchasePrice,
    closingCostsPercent,
    proposedLoanAmount,
    purchasePriceLessProposedLoan: unfinancedPurchasePrice,
    proposedLenderFeeDollars: lenderFeeDollars,
    appraisedValue,
  };
  const availableReferenceFields = {
    purchasePrice: purchasePrice.referenceAvailable ? 'accepted_purchase_price' : null,
    proposedLoanAmount: proposedLoanAmount.referenceAvailable ? 'accepted_proposed_loan_amount' : null,
    lenderFeeDollars: lenderFeeDollars.referenceAvailable ? 'accepted_proposed_lender_fee_dollars' : null,
    sourceCaseNoi: sourceCaseNoi.referenceAvailable ? 'accepted_source_case_net_operating_income' : null,
    appraisedValue: appraisedValue.referenceAvailable ? 'accepted_appraised_value_reference' : null,
  };

  const requiredAuthority = {
    closingCosts: unavailableAuthorityField(
      'closing_costs',
      'currency',
      'exact_accepted_source_fact_or_approved_customer_assumption',
      'CANONICAL_CLOSING_COSTS_NOT_AVAILABLE'
    ),
    otherAcquisitionCosts: unavailableAuthorityField(
      'other_acquisition_costs',
      'currency',
      'exact_accepted_source_fact_or_approved_customer_assumption',
      'CANONICAL_OTHER_ACQUISITION_COSTS_NOT_AVAILABLE'
    ),
    lenderFeeFundingTreatment: unavailableAuthorityField(
      'lender_fee_funding_treatment',
      'text',
      'exact_accepted_funding_source_or_approved_treatment_policy',
      'CANONICAL_LENDER_FEE_FUNDING_TREATMENT_NOT_AVAILABLE'
    ),
    capitalPlanAcquisitionTreatment: unavailableAuthorityField(
      'capital_plan_acquisition_treatment',
      'text',
      'exact_accepted_timing_and_funding_source',
      'CANONICAL_CAPITAL_PLAN_ACQUISITION_TREATMENT_NOT_AVAILABLE'
    ),
    otherFundingSourcesAndUses: unavailableAuthorityField(
      'other_funding_sources_and_uses',
      'currency',
      'exact_accepted_source_and_use_schedule',
      'CANONICAL_OTHER_FUNDING_SOURCES_AND_USES_NOT_AVAILABLE'
    ),
    initialEquityBasis: unavailableAuthorityField(
      'initial_equity_basis',
      'currency',
      'complete_canonical_acquisition_sources_and_uses_bundle',
      'CANONICAL_INITIAL_EQUITY_BASIS_NOT_AVAILABLE'
    ),
    annualDebtService: unavailableAuthorityField(
      'annual_acquisition_debt_service_for_returns',
      'currency_per_year',
      'canonical_return_period_debt_service_receipt',
      'CANONICAL_RETURN_PERIOD_DEBT_SERVICE_NOT_AVAILABLE'
    ),
    annualCapitalExpenditures: unavailableAuthorityField(
      'annual_capital_expenditures_for_returns',
      'currency_per_year',
      'accepted_annual_capital_schedule_and_timing',
      'CANONICAL_ANNUAL_CAPITAL_EXPENDITURES_NOT_AVAILABLE'
    ),
    annualReserveContribution: unavailableAuthorityField(
      'annual_reserve_contribution_for_returns',
      'currency_per_year',
      'accepted_annual_reserve_treatment',
      'CANONICAL_ANNUAL_RESERVE_TREATMENT_NOT_AVAILABLE'
    ),
    otherEquityCashFlowItems: unavailableAuthorityField(
      'other_equity_cash_flow_items',
      'currency_per_year',
      'exact_accepted_cash_flow_items',
      'CANONICAL_OTHER_EQUITY_CASH_FLOW_ITEMS_NOT_AVAILABLE'
    ),
    holdPeriod: unavailableAuthorityField(
      'hold_period',
      'years',
      'exact_accepted_source_assumption_or_approved_scenario_policy',
      'CANONICAL_HOLD_PERIOD_NOT_AVAILABLE'
    ),
    interimCashFlows: unavailableAuthorityField(
      'dated_interim_equity_cash_flows',
      'dated_currency_series',
      'complete_dated_source_bound_cash_flow_series',
      'CANONICAL_DATED_INTERIM_CASH_FLOWS_NOT_AVAILABLE'
    ),
    exitValue: unavailableAuthorityField(
      'exit_value',
      'currency',
      'authorized_exit_value_source_or_approved_exit_scenario',
      'CANONICAL_EXIT_VALUE_NOT_AVAILABLE'
    ),
    exitDate: unavailableAuthorityField(
      'exit_date',
      'date',
      'exact_accepted_exit_timing_or_approved_scenario_policy',
      'CANONICAL_EXIT_DATE_NOT_AVAILABLE'
    ),
    sellingCosts: unavailableAuthorityField(
      'selling_costs',
      'currency',
      'exact_accepted_source_fact_or_approved_selling_cost_policy',
      'CANONICAL_SELLING_COSTS_NOT_AVAILABLE'
    ),
    debtPayoffAtExit: unavailableAuthorityField(
      'debt_payoff_at_exit',
      'currency',
      'authorized_exit_date_debt_balance_schedule',
      'CANONICAL_DEBT_PAYOFF_AT_EXIT_NOT_AVAILABLE'
    ),
    netExitProceeds: unavailableAuthorityField(
      'net_exit_proceeds',
      'currency',
      'complete_canonical_exit_value_cost_and_debt_payoff_bundle',
      'CANONICAL_NET_EXIT_PROCEEDS_NOT_AVAILABLE'
    ),
  };

  const readiness = {
    acquisitionUses: readinessBundle({
      bundleKey: 'acquisition_uses',
      requiredAuthorityFields: [
        'accepted_purchase_price',
        'accepted_proposed_lender_fee_dollars',
        'accepted_closing_costs',
        'accepted_other_acquisition_costs',
        'authorized_capital_plan_acquisition_treatment',
      ],
      availableAuthorityFields: [
        availableReferenceFields.purchasePrice,
        availableReferenceFields.lenderFeeDollars,
      ].filter(Boolean),
    }),
    initialEquityBasis: readinessBundle({
      bundleKey: 'initial_equity_basis',
      requiredAuthorityFields: [
        'accepted_purchase_price',
        'accepted_proposed_loan_amount',
        'authorized_lender_fee_funding_treatment',
        'accepted_closing_cost_funding_treatment',
        'accepted_other_funding_sources_and_uses',
      ],
      availableAuthorityFields: [
        availableReferenceFields.purchasePrice,
        availableReferenceFields.proposedLoanAmount,
      ].filter(Boolean),
    }),
    annualEquityCashFlow: readinessBundle({
      bundleKey: 'annual_equity_cash_flow',
      requiredAuthorityFields: [
        'accepted_source_case_net_operating_income',
        'accepted_annual_acquisition_debt_service',
        'accepted_annual_capital_expenditures',
        'accepted_annual_reserve_contribution',
        'accepted_other_equity_cash_flow_items',
      ],
      availableAuthorityFields: [availableReferenceFields.sourceCaseNoi].filter(Boolean),
    }),
    exitProceeds: readinessBundle({
      bundleKey: 'exit_proceeds',
      requiredAuthorityFields: [
        'authorized_exit_value',
        'authorized_exit_date',
        'accepted_selling_costs',
        'accepted_debt_payoff_at_exit',
      ],
      availableAuthorityFields: [],
    }),
    cashOnCashReturn: readinessBundle({
      bundleKey: 'cash_on_cash_return',
      requiredAuthorityFields: [
        'canonical_initial_equity_basis',
        'canonical_annual_equity_cash_flow',
      ],
      availableAuthorityFields: [],
    }),
    equityMultiple: readinessBundle({
      bundleKey: 'equity_multiple',
      requiredAuthorityFields: [
        'canonical_initial_equity_basis',
        'canonical_aggregate_equity_distributions',
        'canonical_net_exit_proceeds',
      ],
      availableAuthorityFields: [],
    }),
    internalRateOfReturn: readinessBundle({
      bundleKey: 'internal_rate_of_return',
      requiredAuthorityFields: ['complete_canonical_dated_equity_cash_flow_series'],
      availableAuthorityFields: [],
    }),
  };

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamAnalyses: {
      sourceCase: sourceCaseAnalysis,
      valuation: valuationAnalysis,
      capitalStructure: capitalStructureAnalysis,
    },
    upstreamReceipt: {
      jobId: inputContract.sourceTruthReceipt.jobId,
      corePublishable: inputContract.sourceTruthReceipt.corePublishable,
      sourceCaseSource: sourceCaseAnalysis.source,
      valuationSource: valuationAnalysis.source,
      capitalStructureSource: capitalStructureAnalysis.source,
      exactCommonInputContract: true,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      eligibilityOnly: true,
      calculationsPerformed: false,
      returnCalculationAuthorized: false,
      sourceCaseNoiPromotedToEquityCashFlow: false,
      appraisedValuePromotedToExitValue: false,
      purchasePriceLessLoanPromotedToTotalEquity: false,
      lenderFeeFundingSourceInferred: false,
      capitalPlanFundingOrTimingInferred: false,
      closingCostsInferred: false,
      holdPeriodInferred: false,
      exitValueInferred: false,
      sellingCostsInferred: false,
      currentDebtUsedAsAcquisitionOrExitDebt: false,
      refinanceProceedsCalculated: false,
      classificationAllowed: false,
      recommendationAllowed: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      missingValuesRemainNull: true,
      optionalReadinessFailureMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    acceptedReferences,
    requiredAuthority,
    readiness,
    returnOutputs: {
      totalAcquisitionUses: unavailableReturnOutput('total_acquisition_uses', 'acquisition_uses'),
      initialEquityBasis: unavailableReturnOutput('initial_equity_basis', 'initial_equity_basis'),
      annualEquityCashFlow: unavailableReturnOutput('annual_equity_cash_flow', 'annual_equity_cash_flow'),
      netExitProceeds: unavailableReturnOutput('net_exit_proceeds', 'exit_proceeds'),
      cashOnCashReturn: unavailableReturnOutput('cash_on_cash_return', 'cash_on_cash_return'),
      equityMultiple: unavailableReturnOutput('equity_multiple', 'equity_multiple'),
      internalRateOfReturn: unavailableReturnOutput('internal_rate_of_return', 'internal_rate_of_return'),
    },
    coverage: {
      availableReferenceCount: Object.values(acceptedReferences).filter((reference) => reference.referenceAvailable).length,
      totalReferenceCount: Object.keys(acceptedReferences).length,
      establishedRequiredAuthorityCount: 0,
      totalRequiredAuthorityCount: Object.keys(requiredAuthority).length,
      eligibleReadinessBundleCount: Object.values(readiness).filter((bundle) => bundle.calculationEligible).length,
      totalReadinessBundleCount: Object.keys(readiness).length,
      calculatedReturnCount: 0,
      totalReturnOutputCount: 7,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalUnderwritingReturnReadinessContract(value) {
  if (!value || typeof value !== 'object') return false;
  const upstream = value.upstreamAnalyses || {};
  if (!upstreamAnalysesValid({
    sourceCaseAnalysis: upstream.sourceCase,
    valuationAnalysis: upstream.valuation,
    capitalStructureAnalysis: upstream.capitalStructure,
  })) return false;
  const expected = assembleContract({
    sourceCaseAnalysis: upstream.sourceCase,
    valuationAnalysis: upstream.valuation,
    capitalStructureAnalysis: upstream.capitalStructure,
  });
  return JSON.stringify(value) === JSON.stringify(expected);
}

export function buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
  sourceCaseAnalysis,
  valuationAnalysis,
  capitalStructureAnalysis,
} = {}) {
  if (!upstreamAnalysesValid({ sourceCaseAnalysis, valuationAnalysis, capitalStructureAnalysis })) {
    throw new Error('MATCHING_CANONICAL_GATE_5_ANALYSES_REQUIRED_FOR_RETURN_READINESS');
  }
  return deepFreeze(assembleContract({ sourceCaseAnalysis, valuationAnalysis, capitalStructureAnalysis }));
}

export const INSTITUTIONAL_UNDERWRITING_RETURN_READINESS_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  authorityCreating: false,
  eligibilityOnly: true,
  calculationsPerformed: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
