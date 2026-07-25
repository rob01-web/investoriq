import { isCanonicalInstitutionalFinancialIntelligence } from './institutional-financial-intelligence.js';
import { isCanonicalInstitutionalUnderwritingInputContract } from './institutional-underwriting-input-contract.js';

const ANALYSIS_SOURCE = 'premium_acquisition_underwriting_v1_deterministic_analysis';
const ANALYSIS_VERSION = 1;
const MONEY_PRECISION = 2;
const RATIO_PRECISION = 6;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value ?? '').trim();
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

function factReceipt(fact, { positive = false, nonnegative = false } = {}) {
  const value = fact?.sourceBacked === true ? finite(fact.value) : null;
  if (value === null || (positive && value <= 0) || (nonnegative && value < 0) || !fact?.provenance) {
    return null;
  }
  return { value, provenance: fact.provenance };
}

function calculation({
  calculationKey,
  label,
  sectionKey,
  formula,
  requiredCanonicalFacts,
  inputs,
  inputProvenance,
  units,
  precision,
  rawResult,
  collapseReason,
  qualification = null,
  limitationCodes = [],
}) {
  const result = round(rawResult, precision);
  const calculated = result !== null;
  return {
    calculationKey,
    label,
    sectionKey,
    formula,
    formulaVersion: `${ANALYSIS_SOURCE}_v${ANALYSIS_VERSION}`,
    requiredCanonicalFacts,
    inputs: clone(inputs),
    inputProvenance: clone(inputProvenance),
    units,
    precision,
    result,
    status: calculated ? 'calculated' : 'collapsed',
    sourceBound: calculated,
    collapseReason: calculated ? null : collapseReason,
    qualification,
    limitationCodes,
    customerSurfaceAuthorized: false,
    rendererEligible: false,
    reportPublicationBlocker: false,
  };
}

function fiReceipt(financialIntelligence, calculationKey) {
  const receipt = financialIntelligence.calculationReceipts.find(
    (candidate) => candidate.calculationKey === calculationKey,
  );
  return receipt?.eligible === true && Number.isFinite(receipt.result) ? receipt : null;
}

function rowNumber(row, keys, { positive = false, nonnegative = false } = {}) {
  for (const key of keys) {
    const value = finite(row?.[key]);
    if (value === null || (positive && value <= 0) || (nonnegative && value < 0)) continue;
    return value;
  }
  return null;
}

function rowLabel(row, index) {
  return text(
    row?.label ??
    row?.unit_type ??
    row?.unitType ??
    row?.name,
  ) || `Unit Type ${index + 1}`;
}

function unitTypeCalculations(unitMixFact) {
  if (unitMixFact?.sourceBacked !== true || !Array.isArray(unitMixFact.value)) return [];
  const provenance = unitMixFact.provenance ? [unitMixFact.provenance] : [];
  const receipts = [];

  unitMixFact.value.forEach((row, index) => {
    const label = rowLabel(row, index);
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `${index + 1}`;
    const count = rowNumber(row, ['count', 'unit_count', 'units'], { positive: true });
    const currentRent = rowNumber(
      row,
      ['current_rent', 'currentRent', 'in_place_rent', 'inPlaceRent', 'inPlace', 'rent'],
      { nonnegative: true },
    );
    const marketRent = rowNumber(
      row,
      ['market_rent', 'marketRent', 'market_rent_monthly', 'marketRentMonthly', 'market'],
      { nonnegative: true },
    );
    const averageSquareFeet = rowNumber(
      row,
      ['avg_sqft', 'average_sqft', 'averageSquareFeet', 'square_feet', 'squareFeet', 'sqft'],
      { positive: true },
    );
    const explicitOccupied = rowNumber(
      row,
      ['occupied_count', 'occupiedCount', 'occupied_units', 'occupiedUnits'],
      { nonnegative: true },
    );
    const explicitVacant = rowNumber(
      row,
      ['vacant_count', 'vacantCount', 'vacant_units', 'vacantUnits'],
      { nonnegative: true },
    );

    if (currentRent !== null && marketRent !== null) {
      receipts.push(calculation({
        calculationKey: `unitTypeRentGap:${key}`,
        label: `${label} Monthly Rent Gap`,
        sectionKey: 'rentRollAndUnitEconomics',
        formula: 'accepted_unit_type_market_rent_minus_accepted_unit_type_in_place_rent',
        requiredCanonicalFacts: ['unit_mix.current_rent', 'unit_mix.market_rent'],
        inputs: { unitType: label, currentRent, marketRent },
        inputProvenance: provenance,
        units: 'currency_per_unit_per_month',
        precision: MONEY_PRECISION,
        rawResult: marketRent - currentRent,
        collapseReason: 'ACCEPTED_UNIT_TYPE_RENT_BUNDLE_NOT_AVAILABLE',
      }));
    }

    if (currentRent !== null && averageSquareFeet !== null) {
      receipts.push(calculation({
        calculationKey: `unitTypeInPlaceRentPerSquareFoot:${key}`,
        label: `${label} In-Place Rent per Square Foot`,
        sectionKey: 'rentRollAndUnitEconomics',
        formula: 'accepted_unit_type_in_place_monthly_rent_divided_by_accepted_average_square_feet',
        requiredCanonicalFacts: ['unit_mix.current_rent', 'unit_mix.avg_sqft'],
        inputs: { unitType: label, currentRent, averageSquareFeet },
        inputProvenance: provenance,
        units: 'currency_per_square_foot_per_month',
        precision: MONEY_PRECISION,
        rawResult: currentRent / averageSquareFeet,
        collapseReason: 'ACCEPTED_UNIT_TYPE_IN_PLACE_RENT_AND_AREA_NOT_AVAILABLE',
      }));
    }

    if (marketRent !== null && averageSquareFeet !== null) {
      receipts.push(calculation({
        calculationKey: `unitTypeMarketRentPerSquareFoot:${key}`,
        label: `${label} Market Rent per Square Foot`,
        sectionKey: 'rentRollAndUnitEconomics',
        formula: 'accepted_unit_type_market_monthly_rent_divided_by_accepted_average_square_feet',
        requiredCanonicalFacts: ['unit_mix.market_rent', 'unit_mix.avg_sqft'],
        inputs: { unitType: label, marketRent, averageSquareFeet },
        inputProvenance: provenance,
        units: 'currency_per_square_foot_per_month',
        precision: MONEY_PRECISION,
        rawResult: marketRent / averageSquareFeet,
        collapseReason: 'ACCEPTED_UNIT_TYPE_MARKET_RENT_AND_AREA_NOT_AVAILABLE',
      }));
    }

    const occupancyCountsCoherent = count !== null && (
      (explicitOccupied !== null && explicitVacant !== null &&
        explicitOccupied + explicitVacant === count) ||
      (explicitOccupied !== null && explicitOccupied <= count) ||
      (explicitVacant !== null && explicitVacant <= count)
    );
    if (occupancyCountsCoherent) {
      const occupied = explicitOccupied ?? count - explicitVacant;
      const vacant = explicitVacant ?? count - explicitOccupied;
      receipts.push(calculation({
        calculationKey: `unitTypeOccupiedCount:${key}`,
        label: `${label} Occupied Units`,
        sectionKey: 'rentRollAndUnitEconomics',
        formula: explicitOccupied !== null
          ? 'accepted_explicit_unit_type_occupied_count'
          : 'accepted_unit_type_count_minus_accepted_explicit_vacant_count',
        requiredCanonicalFacts: explicitOccupied !== null
          ? ['unit_mix.occupied_count']
          : ['unit_mix.count', 'unit_mix.vacant_count'],
        inputs: { unitType: label, count, explicitOccupied, explicitVacant },
        inputProvenance: provenance,
        units: 'units',
        precision: 0,
        rawResult: occupied,
        collapseReason: 'EXPLICIT_UNIT_TYPE_OCCUPANCY_COUNTS_NOT_AVAILABLE',
        qualification: 'Unit-type occupancy is shown only when explicit accepted unit-type occupancy counts are available; aggregate occupancy is not allocated across unit types.',
      }));
      receipts.push(calculation({
        calculationKey: `unitTypeVacantCount:${key}`,
        label: `${label} Vacant Units`,
        sectionKey: 'rentRollAndUnitEconomics',
        formula: explicitVacant !== null
          ? 'accepted_explicit_unit_type_vacant_count'
          : 'accepted_unit_type_count_minus_accepted_explicit_occupied_count',
        requiredCanonicalFacts: explicitVacant !== null
          ? ['unit_mix.vacant_count']
          : ['unit_mix.count', 'unit_mix.occupied_count'],
        inputs: { unitType: label, count, explicitOccupied, explicitVacant },
        inputProvenance: provenance,
        units: 'units',
        precision: 0,
        rawResult: vacant,
        collapseReason: 'EXPLICIT_UNIT_TYPE_OCCUPANCY_COUNTS_NOT_AVAILABLE',
        qualification: 'Unit-type occupancy is shown only when explicit accepted unit-type occupancy counts are available; aggregate occupancy is not allocated across unit types.',
      }));
    }
  });
  return receipts;
}

function expenseCalculations(expenseLinesFact, totalExpenses, totalUnits) {
  if (expenseLinesFact?.sourceBacked !== true || !Array.isArray(expenseLinesFact.value)) return [];
  const provenance = [
    expenseLinesFact.provenance,
    totalExpenses?.provenance,
    totalUnits?.provenance,
  ].filter(Boolean);
  const receipts = [];
  expenseLinesFact.value.forEach((row, index) => {
    const label = text(row?.label ?? row?.name ?? row?.category) || `Expense ${index + 1}`;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `${index + 1}`;
    const amount = rowNumber(row, ['amount', 'value', 'total', 'annual_amount'], { nonnegative: true });
    if (amount === null) return;
    receipts.push(calculation({
      calculationKey: `expenseComposition:${key}`,
      label: `${label} Share of Operating Expenses`,
      sectionKey: 'expenseStructure',
      formula: 'accepted_expense_line_amount_divided_by_accepted_total_operating_expenses',
      requiredCanonicalFacts: ['expense_lines.amount', 'total_operating_expenses'],
      inputs: { expenseLabel: label, expenseAmount: amount, totalOperatingExpenses: totalExpenses?.value ?? null },
      inputProvenance: provenance,
      units: 'ratio',
      precision: RATIO_PRECISION,
      rawResult: totalExpenses?.value > 0 ? amount / totalExpenses.value : null,
      collapseReason: 'POSITIVE_ACCEPTED_TOTAL_OPERATING_EXPENSES_REQUIRED',
    }));
    receipts.push(calculation({
      calculationKey: `expensePerUnit:${key}`,
      label: `${label} per Unit`,
      sectionKey: 'expenseStructure',
      formula: 'accepted_expense_line_amount_divided_by_accepted_total_units',
      requiredCanonicalFacts: ['expense_lines.amount', 'total_units'],
      inputs: { expenseLabel: label, expenseAmount: amount, totalUnits: totalUnits?.value ?? null },
      inputProvenance: provenance,
      units: 'currency_per_unit_per_year',
      precision: MONEY_PRECISION,
      rawResult: totalUnits?.value > 0 ? amount / totalUnits.value : null,
      collapseReason: 'POSITIVE_ACCEPTED_TOTAL_UNITS_REQUIRED',
    }));
  });
  return receipts;
}

function assembleAnalysis(underwritingInputContract, financialIntelligence) {
  const jobId = text(underwritingInputContract.sourceTruthReceipt?.jobId);
  if (
    !jobId ||
    jobId !== text(financialIntelligence.sourceTruthReceipt?.jobId) ||
    underwritingInputContract.sourceTruthReceipt?.corePublishable !==
      financialIntelligence.sourceTruthReceipt?.corePublishable
  ) {
    throw new Error('PREMIUM_DETERMINISTIC_ANALYSIS_UPSTREAM_IDENTITY_MISMATCH');
  }

  const operating = underwritingInputContract.acceptedInputs.operatingStatement;
  const rentRoll = underwritingInputContract.acceptedInputs.rentRoll;
  const appraisal = underwritingInputContract.acceptedInputs.valuation.appraisal.facts;
  const proposed = underwritingInputContract.gate4Inputs.debtService.proposedFinancing.facts;
  const netOperatingIncome = factReceipt(operating.netOperatingIncome);
  const grossPotentialRent = factReceipt(operating.grossPotentialRent, { positive: true });
  const totalExpenses = factReceipt(operating.totalOperatingExpenses, { nonnegative: true });
  const totalUnits = factReceipt(rentRoll.totalUnits, { positive: true });
  const proposedLoan = factReceipt(proposed.proposed_loan_amount, { positive: true });
  const appraisedValue = factReceipt(appraisal.appraised_value, { positive: true });
  const currentDebtService = fiReceipt(financialIntelligence, 'currentDebtAnnualDebtService');
  const proposedDebtService = fiReceipt(financialIntelligence, 'proposedFinancingAnnualDebtService');
  const receipts = [
    ...unitTypeCalculations(rentRoll.unitMix),
    ...expenseCalculations(operating.expenseLines, totalExpenses, totalUnits),
  ];

  receipts.push(calculation({
    calculationKey: 'totalOperatingExpensesPerUnit',
    label: 'Total Operating Expenses per Unit',
    sectionKey: 'expenseStructure',
    formula: 'accepted_total_operating_expenses_divided_by_accepted_total_units',
    requiredCanonicalFacts: ['total_operating_expenses', 'total_units'],
    inputs: {
      totalOperatingExpenses: totalExpenses?.value ?? null,
      totalUnits: totalUnits?.value ?? null,
    },
    inputProvenance: [totalExpenses?.provenance, totalUnits?.provenance].filter(Boolean),
    units: 'currency_per_unit_per_year',
    precision: MONEY_PRECISION,
    rawResult: totalExpenses && totalUnits ? totalExpenses.value / totalUnits.value : null,
    collapseReason: 'ACCEPTED_TOTAL_EXPENSES_AND_UNIT_COUNT_REQUIRED',
  }));
  receipts.push(calculation({
    calculationKey: 'proposedAcquisitionDebtYield',
    label: 'Proposed Acquisition Debt Yield',
    sectionKey: 'debtCapacityAndCoverage',
    formula: 'accepted_t12_net_operating_income_divided_by_accepted_proposed_loan_amount',
    requiredCanonicalFacts: ['net_operating_income', 'proposed_loan_amount'],
    inputs: {
      netOperatingIncome: netOperatingIncome?.value ?? null,
      proposedLoanAmount: proposedLoan?.value ?? null,
    },
    inputProvenance: [netOperatingIncome?.provenance, proposedLoan?.provenance].filter(Boolean),
    units: 'ratio',
    precision: RATIO_PRECISION,
    rawResult: netOperatingIncome && proposedLoan
      ? netOperatingIncome.value / proposedLoan.value
      : null,
    collapseReason: 'ACCEPTED_NOI_AND_PROPOSED_LOAN_AMOUNT_REQUIRED',
    qualification: 'Debt yield uses accepted T12 net operating income and accepted proposed acquisition loan amount. It is not a refinancing or stabilized debt yield.',
  }));
  receipts.push(calculation({
    calculationKey: 'proposedLoanToAppraisedValue',
    label: 'Proposed Loan to Accepted Appraised Value',
    sectionKey: 'valuationAndAppraisalBridge',
    formula: 'accepted_proposed_loan_amount_divided_by_accepted_appraised_value',
    requiredCanonicalFacts: ['proposed_loan_amount', 'appraised_value'],
    inputs: {
      proposedLoanAmount: proposedLoan?.value ?? null,
      appraisedValue: appraisedValue?.value ?? null,
    },
    inputProvenance: [proposedLoan?.provenance, appraisedValue?.provenance].filter(Boolean),
    units: 'ratio',
    precision: RATIO_PRECISION,
    rawResult: proposedLoan && appraisedValue
      ? proposedLoan.value / appraisedValue.value
      : null,
    collapseReason: 'ACCEPTED_PROPOSED_LOAN_AND_APPRAISED_VALUE_REQUIRED',
    qualification: 'This ratio uses the accepted appraisal reference as its denominator and does not convert the appraisal into a future value.',
  }));
  receipts.push(calculation({
    calculationKey: 'proposedDebtServiceIncrease',
    label: 'Proposed Less Current Annual Debt Service',
    sectionKey: 'currentAndProposedDebt',
    formula: 'canonical_proposed_annual_debt_service_minus_canonical_current_annual_debt_service',
    requiredCanonicalFacts: ['current_annual_debt_service', 'proposed_annual_debt_service'],
    inputs: {
      currentAnnualDebtService: currentDebtService?.result ?? null,
      proposedAnnualDebtService: proposedDebtService?.result ?? null,
    },
    inputProvenance: [
      ...(currentDebtService?.inputProvenance || []),
      ...(proposedDebtService?.inputProvenance || []),
    ],
    units: 'currency_per_year',
    precision: MONEY_PRECISION,
    rawResult: currentDebtService && proposedDebtService
      ? proposedDebtService.result - currentDebtService.result
      : null,
    collapseReason: 'CANONICAL_CURRENT_AND_PROPOSED_DEBT_SERVICE_REQUIRED',
    qualification: 'This is an arithmetic comparison of accepted current debt service and accepted proposed acquisition debt service; the debt roles remain distinct.',
  }));
  receipts.push(calculation({
    calculationKey: 'proposedDebtServiceIncreaseRatioToCurrent',
    label: 'Proposed Debt Service Change Relative to Current',
    sectionKey: 'currentAndProposedDebt',
    formula: 'proposed_less_current_annual_debt_service_divided_by_current_annual_debt_service',
    requiredCanonicalFacts: ['current_annual_debt_service', 'proposed_annual_debt_service'],
    inputs: {
      currentAnnualDebtService: currentDebtService?.result ?? null,
      proposedAnnualDebtService: proposedDebtService?.result ?? null,
    },
    inputProvenance: [
      ...(currentDebtService?.inputProvenance || []),
      ...(proposedDebtService?.inputProvenance || []),
    ],
    units: 'ratio',
    precision: RATIO_PRECISION,
    rawResult: currentDebtService && proposedDebtService && currentDebtService.result > 0
      ? (proposedDebtService.result - currentDebtService.result) / currentDebtService.result
      : null,
    collapseReason: 'POSITIVE_CANONICAL_CURRENT_AND_PROPOSED_DEBT_SERVICE_REQUIRED',
    qualification: 'This comparison does not treat current debt as proposed acquisition financing or as future refinancing debt.',
  }));

  for (const [roleKey, debtService, label] of [
    ['currentDebt', currentDebtService, 'Current-Debt'],
    ['proposedAcquisitionDebt', proposedDebtService, 'Proposed Acquisition Debt'],
  ]) {
    receipts.push(calculation({
      calculationKey: `${roleKey}DebtInclusiveBreakEvenOccupancy`,
      label: `${label} Debt-Inclusive Break-Even Occupancy`,
      sectionKey: 'debtCapacityAndCoverage',
      formula: 'accepted_t12_operating_expenses_plus_canonical_role_specific_annual_debt_service_divided_by_accepted_t12_gross_potential_rent',
      requiredCanonicalFacts: [
        'total_operating_expenses',
        `${roleKey}_annual_debt_service`,
        'gross_potential_rent',
      ],
      inputs: {
        totalOperatingExpenses: totalExpenses?.value ?? null,
        annualDebtService: debtService?.result ?? null,
        grossPotentialRent: grossPotentialRent?.value ?? null,
        debtRole: roleKey,
      },
      inputProvenance: [
        totalExpenses?.provenance,
        ...(debtService?.inputProvenance || []),
        grossPotentialRent?.provenance,
      ].filter(Boolean),
      units: 'ratio',
      precision: RATIO_PRECISION,
      rawResult: totalExpenses && debtService && grossPotentialRent
        ? (totalExpenses.value + debtService.result) / grossPotentialRent.value
        : null,
      collapseReason: 'ACCEPTED_T12_EXPENSES_GPR_AND_ROLE_SPECIFIC_DEBT_SERVICE_REQUIRED',
      qualification: `Debt-inclusive break-even occupancy equals accepted T12 operating expenses plus ${label.toLowerCase()} annual debt service, divided by accepted T12 Gross Potential Rent. It is a deterministic source-case coverage reference, not an economic-vacancy forecast.`,
      limitationCodes: [
        'T12_GROSS_POTENTIAL_RENT_IS_THE_DENOMINATOR',
        'NO_RENT_GROWTH_OR_EXPENSE_NORMALIZATION_APPLIED',
        'DEBT_ROLES_REMAIN_DISTINCT',
      ],
    }));
  }

  const calculatedReceiptCount = receipts.filter((receipt) => receipt.status === 'calculated').length;
  return {
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    jobId,
    inputReceipt: {
      source: underwritingInputContract.source,
      contractVersion: underwritingInputContract.contractVersion,
      jobId,
    },
    financialIntelligenceReceipt: {
      source: financialIntelligence.source,
      receiptVersion: financialIntelligence.receiptVersion,
      jobId,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      acceptedCanonicalInputsOnly: true,
      customerFacingCopyProduced: false,
      customerSurfaceAuthorized: false,
      rendererEligible: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      aggregateOccupancyAllocatedAcrossUnitTypes: false,
      expenseNormalizationPerformed: false,
      refinancingTermsInferred: false,
      acquisitionTermsPromotedToRefinancingTerms: false,
      currentDebtPromotedToAcquisitionDebt: false,
      scenarioInferenceAllowed: false,
      recommendationAllowed: false,
      legacyUnderwritingReuseAllowed: false,
      missingNumericValuesRemainNull: true,
    },
    receipts,
    sections: Object.fromEntries(
      [...new Set(receipts.map((receipt) => receipt.sectionKey))].map((sectionKey) => [
        sectionKey,
        receipts.filter((receipt) => receipt.sectionKey === sectionKey),
      ]),
    ),
    coverage: {
      totalReceiptCount: receipts.length,
      calculatedReceiptCount,
      collapsedReceiptCount: receipts.length - calculatedReceiptCount,
      explicitUnitTypeOccupancyReceiptCount: receipts.filter(
        (receipt) => /^unitType(Occupied|Vacant)Count:/.test(receipt.calculationKey),
      ).length,
    },
    integration: {
      connected: false,
      customerSurfaceEligible: false,
      rendererInsertionPresent: false,
    },
    reportPublicationBlocker: false,
  };
}

function buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis({
  underwritingInputContract,
  financialIntelligence,
} = {}) {
  if (!isCanonicalInstitutionalUnderwritingInputContract(underwritingInputContract)) {
    throw new Error('CANONICAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_PREMIUM_ANALYSIS');
  }
  if (!isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) {
    throw new Error('CANONICAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_PREMIUM_ANALYSIS');
  }
  return deepFreeze(assembleAnalysis(underwritingInputContract, financialIntelligence));
}

function isCanonicalPremiumAcquisitionUnderwritingV1DeterministicAnalysis(value, inputs = {}) {
  if (!value || typeof value !== 'object') return false;
  try {
    return JSON.stringify(value) === JSON.stringify(
      buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis(inputs),
    );
  } catch {
    return false;
  }
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_DETERMINISTIC_ANALYSIS_CONTRACT = deepFreeze({
  source: ANALYSIS_SOURCE,
  analysisVersion: ANALYSIS_VERSION,
  authorityCreating: false,
  deterministicMathOnly: true,
  customerSurfaceAuthorized: false,
  rendererEligible: false,
  aggregateOccupancyAllocatedAcrossUnitTypes: false,
  legacyUnderwritingReuseAllowed: false,
});

export {
  ANALYSIS_SOURCE,
  ANALYSIS_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_DETERMINISTIC_ANALYSIS_CONTRACT,
  buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis,
  isCanonicalPremiumAcquisitionUnderwritingV1DeterministicAnalysis,
};
