import { isCanonicalInstitutionalFinancialIntelligence } from './institutional-financial-intelligence.js';
import { isCanonicalDeterministicSourceCaseUnderwritingAnalysis } from './deterministic-source-case-underwriting-analysis.js';
import { isCanonicalDeterministicAcquisitionValuationAnalysis } from './deterministic-acquisition-valuation-analysis.js';
import { isCanonicalDeterministicAcquisitionCapitalStructureAnalysis } from './deterministic-acquisition-capital-structure-analysis.js';

const RECEIPT_MAP_SOURCE = 'premium_acquisition_underwriting_v1_receipt_map';
const RECEIPT_MAP_VERSION = 1;

const SOURCE_CASE_SECTION_BY_KEY = Object.freeze({
  impliedNetOperatingIncome: 'operatingPerformance',
  netOperatingIncomeReconciliationDifference: 'operatingPerformance',
  operatingExpenseRatio: 'expenseStructure',
  netOperatingIncomeMargin: 'operatingPerformance',
  annualMarketRentDifference: 'rentRollAndUnitEconomics',
  marketRentDifferenceRatioToInPlace: 'rentRollAndUnitEconomics',
  marketRentDifferencePerUnitMonthly: 'rentRollAndUnitEconomics',
  physicalVacancyRate: 'rentRollAndUnitEconomics',
  occupiedUnitEquivalent: 'rentRollAndUnitEconomics',
  vacantUnitEquivalent: 'rentRollAndUnitEconomics',
});

const VALUATION_KEYS = Object.freeze([
  'purchasePricePerUnit',
  'sourceCaseAcquisitionCapitalizationRate',
  'purchaseAssumptionCapitalizationRate',
  'sourceStatedGoingInCapRateDifference',
  'sourceCaseNoiLessPurchaseAssumptionNoi',
  'sourceCaseCapRateLessPurchaseAssumptionCapRate',
  'appraisedValuePerUnit',
  'appraisalDerivedCapitalizationRate',
  'sourceStatedAppraisalCapRateDifference',
  'appraisedValueLessPurchasePrice',
  'appraisedValueDifferenceRatioToPurchasePrice',
  'appraisedValueDifferencePerUnit',
]);

const CAPITAL_STRUCTURE_KEYS = Object.freeze([
  'proposedLoanToPurchasePrice',
  'sourceStatedLtvDifference',
  'purchasePriceLessProposedLoan',
  'unfinancedPurchasePriceShare',
  'proposedLoanPerUnit',
  'unfinancedPurchasePricePerUnit',
  'proposedLenderFeeDollars',
  'lenderFeeShareOfPurchasePrice',
  'sourceStatedLtvImpliedLoanAmount',
  'proposedLoanLessLtvImpliedLoanAmount',
]);

const LABEL_OVERRIDES = Object.freeze({
  purchasePriceLessProposedLoan: 'Minimum Purchase-Price Equity Before Transaction Costs',
});

const QUALIFICATION_OVERRIDES = Object.freeze({
  purchasePriceLessProposedLoan:
    'Purchase price less accepted proposed loan amount only. This is not a complete equity requirement and excludes transaction costs, lender fees, reserves, capital funding, and other uses unless separately accepted.',
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value ?? '').trim();
}

function humanize(value) {
  return text(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function analysisCalculations(analysis) {
  if (Array.isArray(analysis?.section?.calculations)) return analysis.section.calculations;
  return Object.values(analysis?.sections || {}).flatMap((section) => (
    Array.isArray(section?.calculations) ? section.calculations : []
  ));
}

function calculationStatus(receipt) {
  if (receipt?.eligible === true || receipt?.calculationStatus === 'calculated') return 'calculated';
  return 'collapsed';
}

function mapReceipt({
  origin,
  originVersion,
  sectionKey,
  receipt,
  limitationCodes = [],
}) {
  const calculationKey = text(receipt?.calculationKey);
  const status = calculationStatus(receipt);
  return {
    premiumReceiptKey: `${origin}:${calculationKey}`,
    calculationKey,
    label: LABEL_OVERRIDES[calculationKey] || text(receipt?.label) || humanize(calculationKey),
    sectionKey,
    formulaKey: text(receipt?.formulaKey) || null,
    formula: text(receipt?.formula) || null,
    formulaVersion: text(receipt?.formulaVersion) || null,
    requiredCanonicalFacts: clone(receipt?.requiredCanonicalFacts || []),
    requiredInputs: clone(receipt?.requiredInputs || []),
    inputs: clone(receipt?.inputs || {}),
    inputProvenance: clone(receipt?.inputProvenance || []),
    units: text(receipt?.units) || null,
    precision: Number.isInteger(receipt?.precision) ? receipt.precision : null,
    result: status === 'calculated' ? receipt.result : null,
    status,
    sourceBound: status === 'calculated' && (
      receipt?.sourceBound === true ||
      receipt?.eligible === true
    ),
    collapseReason: status === 'collapsed'
      ? text(receipt?.reasonCode || receipt?.collapseReason) || 'UPSTREAM_RECEIPT_NOT_ELIGIBLE'
      : null,
    qualification: QUALIFICATION_OVERRIDES[calculationKey] || text(receipt?.qualification) || null,
    limitationCodes: clone(limitationCodes),
    lineage: {
      origin,
      originVersion,
      originCalculationKey: calculationKey,
      receiptMappedWithoutRecalculation: true,
    },
    customerSurfaceAuthorized: false,
    rendererEligible: false,
    reportPublicationBlocker: false,
  };
}

function receiptByKey(receipts, key) {
  return receipts.find((receipt) => receipt?.calculationKey === key) || null;
}

function requireSharedJobIdentity(values) {
  const jobIds = values.map((value) => text(value)).filter(Boolean);
  return jobIds.length === values.length && new Set(jobIds).size === 1 ? jobIds[0] : null;
}

function buildPremiumAcquisitionUnderwritingV1ReceiptMap({
  financialIntelligence,
  sourceCaseAnalysis,
  valuationAnalysis,
  capitalStructureAnalysis,
} = {}) {
  if (!isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) {
    throw new Error('CANONICAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_PREMIUM_RECEIPT_MAP');
  }
  if (!isCanonicalDeterministicSourceCaseUnderwritingAnalysis(sourceCaseAnalysis)) {
    throw new Error('CANONICAL_SOURCE_CASE_ANALYSIS_REQUIRED_FOR_PREMIUM_RECEIPT_MAP');
  }
  if (!isCanonicalDeterministicAcquisitionValuationAnalysis(valuationAnalysis)) {
    throw new Error('CANONICAL_VALUATION_ANALYSIS_REQUIRED_FOR_PREMIUM_RECEIPT_MAP');
  }
  if (!isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(capitalStructureAnalysis)) {
    throw new Error('CANONICAL_CAPITAL_STRUCTURE_ANALYSIS_REQUIRED_FOR_PREMIUM_RECEIPT_MAP');
  }

  const jobId = requireSharedJobIdentity([
    financialIntelligence.sourceTruthReceipt?.jobId,
    sourceCaseAnalysis.inputReceipt?.jobId,
    valuationAnalysis.inputReceipt?.jobId,
    capitalStructureAnalysis.inputReceipt?.jobId,
  ]);
  if (!jobId) {
    throw new Error('PREMIUM_RECEIPT_MAP_UPSTREAM_JOB_IDENTITY_MISMATCH');
  }

  const receipts = [];
  for (const receipt of financialIntelligence.calculationReceipts) {
    const key = text(receipt?.calculationKey);
    let sectionKey = null;
    if (/^(currentDebt|proposedFinancing)(AnnualDebtService|Dscr)$/.test(key)) {
      sectionKey = 'debtCapacityAndCoverage';
    } else if (/^coreRent/.test(key)) {
      sectionKey = 'sourceReconciliation';
    } else if (/^capitalPlan\d+ReserveLessRequirement$/.test(key) || key === 'annualReserveContributionPerUnit') {
      sectionKey = 'capitalPlanEvidence';
    }
    if (!sectionKey) continue;
    receipts.push(mapReceipt({
      origin: financialIntelligence.source,
      originVersion: financialIntelligence.receiptVersion,
      sectionKey,
      receipt,
    }));
  }

  const sourceReceipts = analysisCalculations(sourceCaseAnalysis);
  for (const [key, sectionKey] of Object.entries(SOURCE_CASE_SECTION_BY_KEY)) {
    const receipt = receiptByKey(sourceReceipts, key);
    if (!receipt) throw new Error(`PREMIUM_RECEIPT_MAP_SOURCE_CASE_RECEIPT_MISSING:${key}`);
    const section = Object.values(sourceCaseAnalysis.sections)
      .find((candidate) => candidate.calculations?.some((item) => item.calculationKey === key));
    receipts.push(mapReceipt({
      origin: sourceCaseAnalysis.source,
      originVersion: sourceCaseAnalysis.analysisVersion,
      sectionKey,
      receipt,
      limitationCodes: section?.limitationCodes || [],
    }));
  }

  const valuationReceipts = analysisCalculations(valuationAnalysis);
  for (const key of VALUATION_KEYS) {
    const receipt = receiptByKey(valuationReceipts, key);
    if (!receipt) throw new Error(`PREMIUM_RECEIPT_MAP_VALUATION_RECEIPT_MISSING:${key}`);
    const section = Object.values(valuationAnalysis.sections)
      .find((candidate) => candidate.calculations?.some((item) => item.calculationKey === key));
    receipts.push(mapReceipt({
      origin: valuationAnalysis.source,
      originVersion: valuationAnalysis.analysisVersion,
      sectionKey: 'valuationAndAppraisalBridge',
      receipt,
      limitationCodes: section?.limitationCodes || [],
    }));
  }

  const capitalReceipts = analysisCalculations(capitalStructureAnalysis);
  for (const key of CAPITAL_STRUCTURE_KEYS) {
    const receipt = receiptByKey(capitalReceipts, key);
    if (!receipt) throw new Error(`PREMIUM_RECEIPT_MAP_CAPITAL_RECEIPT_MISSING:${key}`);
    receipts.push(mapReceipt({
      origin: capitalStructureAnalysis.source,
      originVersion: capitalStructureAnalysis.analysisVersion,
      sectionKey: 'currentAndProposedDebt',
      receipt,
      limitationCodes: capitalStructureAnalysis.section?.limitationCodes || [],
    }));
  }

  const calculatedReceiptCount = receipts.filter((receipt) => receipt.status === 'calculated').length;
  return deepFreeze({
    source: RECEIPT_MAP_SOURCE,
    receiptMapVersion: RECEIPT_MAP_VERSION,
    jobId,
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      receiptMappingOnly: true,
      recalculationAllowed: false,
      rawReceiptPayloadsRetained: false,
      customerFacingCopyProduced: false,
      customerSurfaceAuthorized: false,
      rendererEligible: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      scenarioInferenceAllowed: false,
      recommendationAllowed: false,
      legacyUnderwritingReuseAllowed: false,
      missingNumericValuesRemainNull: true,
    },
    upstreamReceipts: {
      financialIntelligence: {
        source: financialIntelligence.source,
        version: financialIntelligence.receiptVersion,
        jobId,
      },
      sourceCaseAnalysis: {
        source: sourceCaseAnalysis.source,
        version: sourceCaseAnalysis.analysisVersion,
        jobId,
      },
      valuationAnalysis: {
        source: valuationAnalysis.source,
        version: valuationAnalysis.analysisVersion,
        jobId,
      },
      capitalStructureAnalysis: {
        source: capitalStructureAnalysis.source,
        version: capitalStructureAnalysis.analysisVersion,
        jobId,
      },
    },
    receipts,
    sections: Object.fromEntries(
      [...new Set(receipts.map((receipt) => receipt.sectionKey))].map((sectionKey) => [
        sectionKey,
        receipts.filter((receipt) => receipt.sectionKey === sectionKey),
      ]),
    ),
    coverage: {
      mappedReceiptCount: receipts.length,
      calculatedReceiptCount,
      collapsedReceiptCount: receipts.length - calculatedReceiptCount,
    },
    integration: {
      connected: false,
      customerSurfaceEligible: false,
      rendererInsertionPresent: false,
    },
    reportPublicationBlocker: false,
  });
}

function isCanonicalPremiumAcquisitionUnderwritingV1ReceiptMap(value, inputs = {}) {
  if (!value || typeof value !== 'object') return false;
  try {
    return JSON.stringify(value) === JSON.stringify(
      buildPremiumAcquisitionUnderwritingV1ReceiptMap(inputs),
    );
  } catch {
    return false;
  }
}

export {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_RECEIPT_MAP_CONTRACT,
  RECEIPT_MAP_SOURCE,
  RECEIPT_MAP_VERSION,
  buildPremiumAcquisitionUnderwritingV1ReceiptMap,
  isCanonicalPremiumAcquisitionUnderwritingV1ReceiptMap,
};

const PREMIUM_ACQUISITION_UNDERWRITING_V1_RECEIPT_MAP_CONTRACT = deepFreeze({
  source: RECEIPT_MAP_SOURCE,
  receiptMapVersion: RECEIPT_MAP_VERSION,
  authorityCreating: false,
  receiptMappingOnly: true,
  recalculationAllowed: false,
  customerSurfaceAuthorized: false,
  rendererEligible: false,
  legacyUnderwritingReuseAllowed: false,
});
