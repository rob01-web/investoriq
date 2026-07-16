import { isCanonicalDebtServiceInputContract } from './debt-service-input-contract.js';
import { isCanonicalReportAnalysisContext } from './report-analysis-context.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_debt_risk_analysis';
const ANALYSIS_VERSION = 1;
const MILLISECONDS_PER_DAY = 86400000;
const MONTHS = Object.freeze({
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
});

const ROLE_CONFIG = Object.freeze({
  currentDebt: 'current_debt_context',
  proposedFinancing: 'purchase_assumptions',
});

function text(value) {
  return String(value ?? '').trim();
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

function roundRatio(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

function acceptedFact(roleInput, factName) {
  const fact = roleInput?.facts?.[factName] || null;
  return fact?.sourceBacked === true ? fact : null;
}

function validUtcDate(year, month, day) {
  const date = new Date(Date.UTC(year, month, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month &&
    date.getUTCDate() === day
  ) ? date : null;
}

function parseDeterministicDayDate(value) {
  const source = text(value);
  const iso = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const date = validUtcDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return date ? { date, normalizedDate: source, datePrecision: 'day' } : null;
  }
  const named = source.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!named) return null;
  const month = MONTHS[named[1].toLowerCase()];
  if (!Number.isInteger(month)) return null;
  const date = validUtcDate(Number(named[3]), month, Number(named[2]));
  return date
    ? { date, normalizedDate: date.toISOString().slice(0, 10), datePrecision: 'day' }
    : null;
}

function collapsedMaturity(roleKey, roleInput, reasonCode, maturityFact = null) {
  return {
    roleKey,
    canonicalRole: roleInput?.canonicalRole || ROLE_CONFIG[roleKey] || null,
    analysisStatus: 'not_assessed',
    reasonCode,
    maturityDate: maturityFact?.value || null,
    normalizedMaturityDate: null,
    asOfDate: null,
    datePrecision: null,
    daysToMaturity: null,
    maturityPosition: 'not_assessed',
    sourcePresent: maturityFact?.sourcePresent === true,
    factAccepted: maturityFact?.factAccepted === true,
    sourceBacked: maturityFact?.sourceBacked === true,
    maturityReceipt: maturityFact?.provenance || null,
    contextReceipt: null,
    thresholdClassification: null,
    riskClassification: null,
    reportPublicationBlocker: false,
  };
}

function buildMaturityAnalysis(roleKey, roleInput, analysisContext) {
  if (roleInput?.canonicalRole !== ROLE_CONFIG[roleKey]) {
    return collapsedMaturity(roleKey, roleInput, 'CANONICAL_DEBT_ROLE_MISMATCH');
  }
  const rawFact = roleInput?.facts?.maturity_date || null;
  const maturityFact = acceptedFact(roleInput, 'maturity_date');
  if (!maturityFact) {
    return collapsedMaturity(
      roleKey,
      roleInput,
      rawFact?.factAccepted === true
        ? 'MATURITY_DATE_EVIDENCE_NOT_SOURCE_BOUND'
        : 'ACCEPTED_MATURITY_DATE_NOT_AVAILABLE',
      rawFact
    );
  }
  const maturity = parseDeterministicDayDate(maturityFact.value);
  if (!maturity) {
    return collapsedMaturity(
      roleKey,
      roleInput,
      'MATURITY_DATE_PRECISION_OR_FORMAT_NOT_DETERMINISTIC',
      maturityFact
    );
  }
  const asOfDate = parseDeterministicDayDate(analysisContext.asOfDate);
  if (!asOfDate) {
    return collapsedMaturity(roleKey, roleInput, 'CANONICAL_REPORT_AS_OF_DATE_INVALID', maturityFact);
  }
  const daysToMaturity = Math.round((maturity.date.getTime() - asOfDate.date.getTime()) / MILLISECONDS_PER_DAY);
  const maturityPosition = daysToMaturity < 0
    ? 'matured'
    : daysToMaturity === 0
      ? 'due_on_analysis_date'
      : 'future';
  return {
    roleKey,
    canonicalRole: roleInput.canonicalRole,
    analysisStatus: 'assessed',
    reasonCode: null,
    maturityDate: maturityFact.value,
    normalizedMaturityDate: maturity.normalizedDate,
    asOfDate: analysisContext.asOfDate,
    datePrecision: maturity.datePrecision,
    daysToMaturity,
    maturityPosition,
    sourcePresent: true,
    factAccepted: true,
    sourceBacked: true,
    maturityReceipt: maturityFact.provenance,
    contextReceipt: {
      source: analysisContext.source,
      contextVersion: analysisContext.contextVersion,
      jobId: analysisContext.jobId,
      asOfDate: analysisContext.asOfDate,
    },
    thresholdClassification: null,
    riskClassification: null,
    reportPublicationBlocker: false,
  };
}

function buildRateStructureAnalysis(roleKey, roleInput) {
  const roleMatches = roleInput?.canonicalRole === ROLE_CONFIG[roleKey];
  const rawFact = roleInput?.facts?.rate_structure || null;
  const fact = roleMatches ? acceptedFact(roleInput, 'rate_structure') : null;
  const rateStructure = text(fact?.value).toLowerCase() || null;
  const exposureState = rateStructure === 'fixed'
    ? 'contractually_fixed_per_accepted_source'
    : rateStructure === 'floating'
      ? 'contractual_rate_variability_present'
      : rateStructure === 'hybrid'
        ? 'contractual_rate_variability_changes_over_term'
        : 'not_assessed';
  return {
    roleKey,
    canonicalRole: roleInput?.canonicalRole || ROLE_CONFIG[roleKey] || null,
    analysisStatus: fact ? 'assessed' : 'not_assessed',
    reasonCode: !roleMatches
      ? 'CANONICAL_DEBT_ROLE_MISMATCH'
      : !fact
        ? rawFact?.factAccepted === true
          ? 'RATE_STRUCTURE_EVIDENCE_NOT_SOURCE_BOUND'
          : 'ACCEPTED_RATE_STRUCTURE_NOT_AVAILABLE'
        : null,
    rateStructure,
    exposureState,
    sourcePresent: rawFact?.sourcePresent === true,
    factAccepted: rawFact?.factAccepted === true,
    sourceBacked: fact?.sourceBacked === true,
    rateStructureReceipt: fact?.provenance || null,
    benchmarkIndex: null,
    contractualSpread: null,
    rateShockCalculated: false,
    thresholdClassification: null,
    riskClassification: null,
    reportPublicationBlocker: false,
  };
}

function buildLenderFeeAnalysis(proposedInput) {
  const rawLoanFact = proposedInput?.facts?.proposed_loan_amount || null;
  const rawFeeFact = proposedInput?.facts?.lender_fee_percent || null;
  const loanFact = acceptedFact(proposedInput, 'proposed_loan_amount');
  const feeFact = acceptedFact(proposedInput, 'lender_fee_percent');
  const purchasePriceFact = acceptedFact(proposedInput, 'purchase_price');
  const missingInputs = [
    rawLoanFact?.factAccepted !== true ? 'proposed_loan_amount' : null,
    rawFeeFact?.factAccepted !== true ? 'lender_fee_percent' : null,
  ].filter(Boolean);
  const evidenceGaps = [
    rawLoanFact?.factAccepted === true && !loanFact ? 'proposed_loan_amount' : null,
    rawFeeFact?.factAccepted === true && !feeFact ? 'lender_fee_percent' : null,
  ].filter(Boolean);
  if (missingInputs.length > 0 || evidenceGaps.length > 0) {
    return {
      calculationStatus: 'collapsed',
      reasonCode: 'ACCEPTED_LENDER_FEE_BUNDLE_NOT_AVAILABLE',
      proposedLoanAmount: loanFact?.value ?? null,
      lenderFeeRate: feeFact?.value ?? null,
      lenderFeeDollars: null,
      purchasePrice: purchasePriceFact?.value ?? null,
      feeShareOfPurchasePrice: null,
      missingInputs,
      evidenceGaps,
      inputReceipts: [loanFact?.provenance, feeFact?.provenance, purchasePriceFact?.provenance].filter(Boolean),
      thresholdClassification: null,
      riskClassification: null,
      reportPublicationBlocker: false,
    };
  }
  const loanAmount = Number(loanFact.value);
  const feeRate = Number(feeFact.value);
  if (!Number.isFinite(loanAmount) || loanAmount <= 0 || !Number.isFinite(feeRate) || feeRate < 0 || feeRate > 1) {
    return {
      calculationStatus: 'collapsed',
      reasonCode: 'ACCEPTED_LENDER_FEE_BUNDLE_NUMERICALLY_INVALID',
      proposedLoanAmount: null,
      lenderFeeRate: null,
      lenderFeeDollars: null,
      purchasePrice: purchasePriceFact?.value ?? null,
      feeShareOfPurchasePrice: null,
      missingInputs: [],
      evidenceGaps: [],
      inputReceipts: [loanFact.provenance, feeFact.provenance, purchasePriceFact?.provenance].filter(Boolean),
      thresholdClassification: null,
      riskClassification: null,
      reportPublicationBlocker: false,
    };
  }
  const lenderFeeDollars = roundMoney(loanAmount * feeRate);
  const purchasePrice = Number(purchasePriceFact?.value);
  const feeShareOfPurchasePrice = purchasePriceFact && Number.isFinite(purchasePrice) && purchasePrice > 0
    ? roundRatio(lenderFeeDollars / purchasePrice)
    : null;
  return {
    calculationStatus: 'calculated',
    reasonCode: null,
    proposedLoanAmount: loanAmount,
    lenderFeeRate: feeRate,
    lenderFeeDollars,
    purchasePrice: purchasePriceFact ? purchasePrice : null,
    feeShareOfPurchasePrice,
    missingInputs: [],
    evidenceGaps: [],
    inputReceipts: [loanFact.provenance, feeFact.provenance, purchasePriceFact?.provenance].filter(Boolean),
    methodology: {
      calculationType: 'accepted_proposed_loan_amount_times_accepted_lender_fee_rate',
      feeDollarPrecision: 'nearest_cent',
      purchasePriceSharePrecisionDecimals: 6,
    },
    thresholdClassification: null,
    riskClassification: null,
    reportPublicationBlocker: false,
  };
}

function buildRefinancingReadiness(inputContract, currentMaturity) {
  const currentDebt = inputContract.currentDebt;
  const proposed = inputContract.proposedFinancing;
  const currentBalance = acceptedFact(currentDebt, 'current_outstanding_balance');
  const currentRate = acceptedFact(currentDebt, 'interest_rate');
  const currentRateStructure = acceptedFact(currentDebt, 'rate_structure');
  const proposedAcquisitionFactsAccepted = Object.values(proposed?.facts || {})
    .some((fact) => fact?.sourceBacked === true);
  const maturityEventIdentified = currentMaturity.analysisStatus === 'assessed';
  return {
    assessmentStatus: maturityEventIdentified ? 'limited' : 'not_assessed',
    assessmentState: maturityEventIdentified
      ? 'current_maturity_identified_refinancing_terms_not_available'
      : 'current_maturity_and_refinancing_terms_not_available',
    refinancingModelEligible: false,
    reasonCode: 'ACCEPTED_REFINANCING_TERMS_NOT_AVAILABLE',
    maturityEventIdentified,
    currentDebtMaturityPosition: maturityEventIdentified ? currentMaturity.maturityPosition : null,
    currentDebtEvidence: {
      maturityDateAccepted: currentMaturity.sourceBacked === true,
      outstandingBalanceAccepted: Boolean(currentBalance),
      interestRateAccepted: Boolean(currentRate),
      rateStructureAccepted: Boolean(currentRateStructure),
      acceptedReceipts: [
        currentMaturity.maturityReceipt,
        currentBalance?.provenance,
        currentRate?.provenance,
        currentRateStructure?.provenance,
      ].filter(Boolean),
    },
    proposedAcquisitionFinancingPresent: proposedAcquisitionFactsAccepted,
    proposedAcquisitionFinancingTreatedAsRefinancing: false,
    requiredFutureCanonicalInputs: [
      'refinancing_loan_amount',
      'refinancing_interest_rate',
      'refinancing_amortization',
      'refinancing_term',
      'refinancing_value_basis',
    ],
    sourcePresent: maturityEventIdentified || Boolean(currentBalance || currentRate || currentRateStructure),
    sourceBacked: false,
    thresholdClassification: null,
    riskClassification: null,
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicDebtRiskAnalysis(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === ANALYSIS_SOURCE &&
    value.analysisVersion === ANALYSIS_VERSION
  );
}

export function buildDeterministicDebtRiskAnalysis({ debtServiceInputContract, analysisContext } = {}) {
  if (!isCanonicalDebtServiceInputContract(debtServiceInputContract)) {
    throw new Error('CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED_FOR_DEBT_RISK_ANALYSIS');
  }
  if (!isCanonicalReportAnalysisContext(analysisContext)) {
    throw new Error('CANONICAL_REPORT_ANALYSIS_CONTEXT_REQUIRED_FOR_DEBT_RISK_ANALYSIS');
  }

  const currentDebtMaturity = buildMaturityAnalysis(
    'currentDebt',
    debtServiceInputContract.currentDebt,
    analysisContext
  );
  const proposedFinancingMaturity = buildMaturityAnalysis(
    'proposedFinancing',
    debtServiceInputContract.proposedFinancing,
    analysisContext
  );
  const currentDebtRateStructure = buildRateStructureAnalysis(
    'currentDebt',
    debtServiceInputContract.currentDebt
  );
  const proposedFinancingRateStructure = buildRateStructureAnalysis(
    'proposedFinancing',
    debtServiceInputContract.proposedFinancing
  );
  const lenderFee = buildLenderFeeAnalysis(debtServiceInputContract.proposedFinancing);
  const refinancingReadiness = buildRefinancingReadiness(
    debtServiceInputContract,
    currentDebtMaturity
  );
  const assessedComponents = [
    currentDebtMaturity,
    proposedFinancingMaturity,
    currentDebtRateStructure,
    proposedFinancingRateStructure,
  ].filter((component) => component.analysisStatus === 'assessed').length +
    (lenderFee.calculationStatus === 'calculated' ? 1 : 0);

  return deepFreeze({
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract: {
      source: debtServiceInputContract.source,
      contractVersion: debtServiceInputContract.contractVersion,
      jobId: debtServiceInputContract?.sourceTruth?.jobId || null,
    },
    analysisContext: {
      source: analysisContext.source,
      contextVersion: analysisContext.contextVersion,
      jobId: analysisContext.jobId,
      asOfDate: analysisContext.asOfDate,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      customerFacingCopyProduced: false,
      rendererBehaviorChanged: false,
      systemClockFallbackAllowed: false,
      thresholdInferenceAllowed: false,
      scenarioInferenceAllowed: false,
      proposedAcquisitionTermsMayBeReclassifiedAsRefinancing: false,
      missingNumericValuesRemainNull: true,
      optionalDebtRiskFailureMayBlockCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    maturity: {
      currentDebt: currentDebtMaturity,
      proposedFinancing: proposedFinancingMaturity,
    },
    rateStructure: {
      currentDebt: currentDebtRateStructure,
      proposedFinancing: proposedFinancingRateStructure,
    },
    lenderFee,
    refinancingReadiness,
    coverage: {
      assessedComponentCount: assessedComponents,
      totalComponentCount: 5,
      collapsedComponentCount: 5 - assessedComponents,
    },
    reportPublicationBlocker: false,
  });
}
