import { isCanonicalCoreReconciliationInputContract } from './core-reconciliation-input-contract.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_core_reconciliation_analysis';
const ANALYSIS_VERSION = 1;
const RATIO_PRECISION = 6;
const DISPLAY_PERCENT_PRECISION = 2;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function round(value, precision) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  return Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

function roundMoney(value) {
  return round(value, 2);
}

function formatMoney(value) {
  if (!Number.isFinite(value)) return null;
  return `$${Math.abs(value).toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercentMagnitude(value) {
  if (!Number.isFinite(value)) return null;
  return `${Math.abs(value * 100).toFixed(DISPLAY_PERCENT_PRECISION)}%`;
}

function collapsedResult(inputContract, reasonCode) {
  return {
    calculationStatus: 'collapsed',
    reasonCode,
    comparisonStatus: 'not_assessed',
    t12GrossPotentialRent: inputContract?.facts?.t12GrossPotentialRent?.sourceBacked === true
      ? inputContract.facts.t12GrossPotentialRent.value
      : null,
    rentRollAnnualInPlaceRent: inputContract?.facts?.rentRollAnnualInPlaceRent?.sourceBacked === true
      ? inputContract.facts.rentRollAnnualInPlaceRent.value
      : null,
    differenceAmount: null,
    absoluteDifferenceAmount: null,
    varianceRatioToT12Gpr: null,
    absoluteVarianceRatioToT12Gpr: null,
    displayVariancePercent: null,
    direction: 'not_assessed',
    perUnitMonthlyDifference: null,
    sourceBound: false,
    explanationStatus: 'not_available',
    sourceBoundExplanation: null,
    missingInputs: inputContract?.eligibility?.missingInputs || [],
    evidenceGaps: inputContract?.eligibility?.evidenceGaps || [],
    inputReceipts: [],
    materiality: {
      measurementStatus: 'not_measured',
      classificationStatus: 'not_classified',
      classification: null,
      threshold: null,
      policyAuthority: null,
      reasonCode: 'CANONICAL_MATERIALITY_POLICY_NOT_AVAILABLE',
    },
    causeAssessment: {
      status: 'not_assessed',
      inferredCauses: [],
      unsupportedAdjustmentMade: false,
    },
    reportPublicationBlocker: false,
  };
}

function buildSourceBoundExplanation({ direction, differenceAmount, varianceRatio, t12Gpr }) {
  if (direction === 'aligned_to_cent') {
    return `Accepted Rent Roll annual in-place rent equals accepted T12 Gross Potential Rent at ${formatMoney(t12Gpr)}. The source periods and concepts remain distinct. No further conclusion or adjustment is inferred.`;
  }
  const relationship = direction === 'rent_roll_above_t12_gpr' ? 'above' : 'below';
  return `Accepted Rent Roll annual in-place rent is ${formatMoney(differenceAmount)} ${relationship} accepted T12 Gross Potential Rent, a ${formatPercentMagnitude(varianceRatio)} variance relative to T12 GPR. The comparison places a point-in-time annualized Rent Roll measure beside a trailing T12 source measure. The accepted sources do not establish the cause, and no unsupported adjustment is made.`;
}

export function isCanonicalDeterministicCoreReconciliationAnalysis(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === ANALYSIS_SOURCE &&
    value.analysisVersion === ANALYSIS_VERSION
  );
}

export function buildDeterministicCoreReconciliationAnalysis({ reconciliationInputContract } = {}) {
  if (!isCanonicalCoreReconciliationInputContract(reconciliationInputContract)) {
    throw new Error('CANONICAL_CORE_RECONCILIATION_INPUT_CONTRACT_REQUIRED');
  }
  if (reconciliationInputContract?.eligibility?.eligibleForReconciliation !== true) {
    return deepFreeze({
      source: ANALYSIS_SOURCE,
      analysisVersion: ANALYSIS_VERSION,
      inputContract: {
        source: reconciliationInputContract.source,
        contractVersion: reconciliationInputContract.contractVersion,
        jobId: reconciliationInputContract?.sourceTruth?.jobId || null,
      },
      policy: {
        authorityCreating: false,
        sourceTruthMutationAllowed: false,
        deterministicMathOnly: true,
        rendererBehaviorChanged: false,
        customerFacingCopyPublished: false,
        causeInferenceAllowed: false,
        materialityThresholdInferenceAllowed: false,
        legacyFivePercentThresholdUsed: false,
        arbitraryCallerThresholdAllowed: false,
        optionalReconciliationFailureMayBlockValidatedCorePublication: false,
      },
      reconciliation: collapsedResult(
        reconciliationInputContract,
        'CANONICAL_CORE_RECONCILIATION_INPUTS_NOT_ELIGIBLE'
      ),
      reportPublicationBlocker: false,
    });
  }

  const t12Fact = reconciliationInputContract.facts.t12GrossPotentialRent;
  const rentRollFact = reconciliationInputContract.facts.rentRollAnnualInPlaceRent;
  const totalUnitsFact = reconciliationInputContract.facts.totalUnits;
  const t12Gpr = Number(t12Fact.value);
  const rentRollAnnual = Number(rentRollFact.value);
  if (!Number.isFinite(t12Gpr) || t12Gpr <= 0 || !Number.isFinite(rentRollAnnual) || rentRollAnnual < 0) {
    const collapsed = collapsedResult(reconciliationInputContract, 'CORE_RECONCILIATION_NUMERIC_INPUT_INVALID');
    return deepFreeze({
      source: ANALYSIS_SOURCE,
      analysisVersion: ANALYSIS_VERSION,
      inputContract: {
        source: reconciliationInputContract.source,
        contractVersion: reconciliationInputContract.contractVersion,
        jobId: reconciliationInputContract?.sourceTruth?.jobId || null,
      },
      policy: {
        authorityCreating: false,
        sourceTruthMutationAllowed: false,
        deterministicMathOnly: true,
        rendererBehaviorChanged: false,
        customerFacingCopyPublished: false,
        causeInferenceAllowed: false,
        materialityThresholdInferenceAllowed: false,
        legacyFivePercentThresholdUsed: false,
        arbitraryCallerThresholdAllowed: false,
        optionalReconciliationFailureMayBlockValidatedCorePublication: false,
      },
      reconciliation: collapsed,
      reportPublicationBlocker: false,
    });
  }

  const rawDifference = rentRollAnnual - t12Gpr;
  const differenceAmount = roundMoney(rawDifference);
  const absoluteDifferenceAmount = roundMoney(Math.abs(rawDifference));
  const rawVarianceRatio = rawDifference / t12Gpr;
  const varianceRatioToT12Gpr = round(rawVarianceRatio, RATIO_PRECISION);
  const absoluteVarianceRatioToT12Gpr = round(Math.abs(rawVarianceRatio), RATIO_PRECISION);
  const displayVariancePercent = round(rawVarianceRatio * 100, DISPLAY_PERCENT_PRECISION);
  const direction = differenceAmount === 0
    ? 'aligned_to_cent'
    : differenceAmount > 0
      ? 'rent_roll_above_t12_gpr'
      : 'rent_roll_below_t12_gpr';
  const totalUnits = totalUnitsFact?.sourceBacked === true ? Number(totalUnitsFact.value) : null;
  const perUnitMonthlyDifference = Number.isFinite(totalUnits) && totalUnits > 0
    ? roundMoney(rawDifference / totalUnits / 12)
    : null;

  const reconciliation = {
    calculationStatus: 'calculated',
    reasonCode: null,
    comparisonStatus: direction === 'aligned_to_cent' ? 'amounts_aligned_to_cent' : 'variance_present',
    t12GrossPotentialRent: t12Gpr,
    rentRollAnnualInPlaceRent: rentRollAnnual,
    differenceAmount,
    absoluteDifferenceAmount,
    varianceRatioToT12Gpr,
    absoluteVarianceRatioToT12Gpr,
    displayVariancePercent,
    direction,
    perUnitMonthlyDifference,
    sourceBound: true,
    comparisonBasis: {
      numeratorConcept: 'rent_roll_point_in_time_annualized_in_place_rent',
      denominatorConcept: 't12_gross_potential_rent',
      conceptsEquivalent: false,
      basisLimitation: 'The comparison identifies a difference between accepted source measures but does not establish its cause.',
    },
    explanationStatus: 'deterministic_source_limited',
    sourceBoundExplanation: buildSourceBoundExplanation({
      direction,
      differenceAmount,
      varianceRatio: rawVarianceRatio,
      t12Gpr,
    }),
    missingInputs: [],
    evidenceGaps: [],
    inputReceipts: [
      t12Fact.provenance,
      rentRollFact.provenance,
      totalUnitsFact?.sourceBacked === true ? totalUnitsFact.provenance : null,
    ].filter(Boolean),
    methodology: {
      differenceFormula: 'accepted_rent_roll_annual_in_place_rent_minus_accepted_t12_gross_potential_rent',
      varianceFormula: 'difference_amount_divided_by_accepted_t12_gross_potential_rent',
      ratioPrecisionDecimals: RATIO_PRECISION,
      displayPercentPrecisionDecimals: DISPLAY_PERCENT_PRECISION,
      monetaryPrecision: 'nearest_cent',
    },
    materiality: {
      measurementStatus: 'objective_measures_calculated',
      classificationStatus: 'not_classified',
      classification: null,
      threshold: null,
      policyAuthority: null,
      reasonCode: 'CANONICAL_MATERIALITY_POLICY_NOT_AVAILABLE',
      objectiveMeasures: {
        absoluteDifferenceAmount,
        absoluteVarianceRatioToT12Gpr,
        perUnitMonthlyDifference,
      },
    },
    causeAssessment: {
      status: direction === 'aligned_to_cent'
        ? 'not_applicable_no_amount_variance'
        : 'not_established_by_accepted_sources',
      inferredCauses: [],
      unsupportedAdjustmentMade: false,
    },
    reportPublicationBlocker: false,
  };

  return deepFreeze({
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract: {
      source: reconciliationInputContract.source,
      contractVersion: reconciliationInputContract.contractVersion,
      jobId: reconciliationInputContract?.sourceTruth?.jobId || null,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      deterministicMathOnly: true,
      rendererBehaviorChanged: false,
      customerFacingCopyPublished: false,
      causeInferenceAllowed: false,
      materialityThresholdInferenceAllowed: false,
      legacyFivePercentThresholdUsed: false,
      arbitraryCallerThresholdAllowed: false,
      optionalReconciliationFailureMayBlockValidatedCorePublication: false,
    },
    reconciliation,
    reportPublicationBlocker: false,
  });
}
