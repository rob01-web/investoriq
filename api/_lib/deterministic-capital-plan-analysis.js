import { isCanonicalCapitalPlanInputContract } from './capital-plan-input-contract.js';

const ANALYSIS_SOURCE = 'canonical_deterministic_capital_plan_analysis';
const ANALYSIS_VERSION = 1;
const RATIO_PRECISION = 6;

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

function money(value) {
  return round(value, 2);
}

function backedValue(fact) {
  return fact?.sourceBacked === true ? fact.value : null;
}

function capitalPlanAmount(source) {
  if (!source?.planFactName) return null;
  return backedValue(source?.facts?.[source.planFactName]);
}

function timingAnalysis(source, planAmount) {
  const facts = source?.facts || {};
  const startMonth = backedValue(facts.capital_plan_start_month);
  const endMonth = backedValue(facts.capital_plan_end_month);
  const durationMonths = backedValue(facts.capital_plan_duration_months);
  const buckets = {
    immediate: backedValue(facts.immediate_capital_amount),
    nearTerm: backedValue(facts.near_term_capital_amount),
    longTerm: backedValue(facts.long_term_capital_amount),
  };
  const availableBuckets = Object.entries(buckets).filter(([, value]) => Number.isFinite(value));
  const accountedAmount = availableBuckets.length > 0
    ? money(availableBuckets.reduce((sum, [, value]) => sum + value, 0))
    : null;
  const completeBucketSet = availableBuckets.length === 3;
  const canReconcile = completeBucketSet && Number.isFinite(planAmount);
  const unallocatedAmount = canReconcile ? money(planAmount - accountedAmount) : null;
  const bucketReconciliationStatus = !canReconcile
    ? availableBuckets.length > 0
      ? 'partial_source_labeled_timing_buckets'
      : 'timing_buckets_not_available'
    : unallocatedAmount === 0
      ? 'source_labeled_buckets_reconcile_to_plan_total'
      : unallocatedAmount > 0
        ? 'source_labeled_buckets_below_plan_total'
        : 'source_labeled_buckets_above_plan_total';
  const timingStatus = Number.isInteger(durationMonths) || availableBuckets.length > 0
    ? 'source_timing_available'
    : 'source_timing_not_available';

  return {
    timingStatus,
    relativeSchedule: {
      startMonth: Number.isInteger(startMonth) ? startMonth : null,
      endMonth: Number.isInteger(endMonth) ? endMonth : null,
      durationMonths: Number.isInteger(durationMonths) ? durationMonths : null,
      sourceBound: Number.isInteger(durationMonths) || Number.isInteger(endMonth),
    },
    sourceLabeledBuckets: buckets,
    bucketReconciliation: {
      status: bucketReconciliationStatus,
      availableBuckets: availableBuckets.map(([bucket]) => bucket),
      completeBucketSet,
      accountedAmount,
      unallocatedAmount,
      ratioOfBucketsToPlan: canReconcile && planAmount > 0
        ? round(accountedAmount / planAmount, RATIO_PRECISION)
        : null,
    },
    policy: {
      monthRangeReclassifiedIntoTimingBuckets: false,
      missingBucketTreatedAsZero: false,
      evenSpendAssumptionUsed: false,
      burnRateCalculated: false,
    },
  };
}

function reserveComparison({ reserveBalance, planAmount, basis }) {
  if (!Number.isFinite(planAmount) || !Number.isFinite(reserveBalance)) {
    return {
      calculationStatus: 'collapsed',
      basis,
      statedRequirementAmount: Number.isFinite(planAmount) ? planAmount : null,
      reserveBalance: Number.isFinite(reserveBalance) ? reserveBalance : null,
      reserveLessRequirementAmount: null,
      reserveCoverageRatio: null,
      objectiveFundingPosition: 'not_assessed',
      missingInputs: [
        Number.isFinite(planAmount) ? null : 'stated_requirement_amount',
        Number.isFinite(reserveBalance) ? null : 'capital_reserve_balance',
      ].filter(Boolean),
    };
  }
  if (planAmount === 0) {
    return {
      calculationStatus: 'calculated',
      basis,
      statedRequirementAmount: 0,
      reserveBalance,
      reserveLessRequirementAmount: money(reserveBalance),
      reserveCoverageRatio: null,
      objectiveFundingPosition: 'no_stated_capital_requirement',
      missingInputs: [],
    };
  }
  const difference = money(reserveBalance - planAmount);
  return {
    calculationStatus: 'calculated',
    basis,
    statedRequirementAmount: planAmount,
    reserveBalance,
    reserveLessRequirementAmount: difference,
    reserveCoverageRatio: round(reserveBalance / planAmount, RATIO_PRECISION),
    objectiveFundingPosition: difference >= 0
      ? 'reserve_meets_or_exceeds_stated_requirement'
      : 'reserve_below_stated_requirement',
    missingInputs: [],
  };
}

function planAnalysis(source, reserveBalance) {
  const planAmount = capitalPlanAmount(source);
  const timing = timingAnalysis(source, planAmount);
  const hasPlanEvidence = Number.isFinite(planAmount) || timing.timingStatus === 'source_timing_available';
  const comparison = reserveComparison({
    reserveBalance,
    planAmount,
    basis: source?.planFactName || 'stated_capital_plan_amount_not_available',
  });
  return {
    sourceIdentityKey: source.sourceIdentityKey,
    canonicalRole: source.canonicalRole,
    planFactName: source.planFactName,
    calculationStatus: hasPlanEvidence ? 'calculated_or_source_positioned' : 'collapsed_plan_amount_and_timing_not_available',
    planAmount: Number.isFinite(planAmount) ? planAmount : null,
    timing,
    reserveComparison: comparison,
    adequacy: {
      measurementStatus: comparison.calculationStatus === 'calculated'
        ? 'objective_reserve_comparison_calculated'
        : 'not_measured',
      classificationStatus: 'not_classified',
      classification: null,
      threshold: null,
      policyAuthority: null,
      reasonCode: 'CANONICAL_RESERVE_ADEQUACY_POLICY_NOT_AVAILABLE',
    },
    acceptedProvenanceFields: Object.values(source.facts)
      .filter((fact) => fact.sourceBacked === true)
      .map((fact) => fact.provenance),
    reportPublicationBlocker: false,
  };
}

function reserveAnalysis(inputContract) {
  const reserveFact = inputContract?.consolidatedFacts?.capital_reserve_balance;
  const contributionFact = inputContract?.consolidatedFacts?.annual_reserve_contribution;
  const totalUnitsFact = inputContract?.coreInputs?.totalUnits;
  const reserveBalance = backedValue(reserveFact);
  const annualContribution = backedValue(contributionFact);
  const totalUnits = backedValue(totalUnitsFact);
  const contributionPerUnitAnnual = Number.isFinite(annualContribution) && Number.isFinite(totalUnits) && totalUnits > 0
    ? money(annualContribution / totalUnits)
    : null;
  const contributionPerUnitMonthly = Number.isFinite(contributionPerUnitAnnual)
    ? money(contributionPerUnitAnnual / 12)
    : null;

  return {
    reserveBalance: Number.isFinite(reserveBalance) ? reserveBalance : null,
    annualReserveContribution: Number.isFinite(annualContribution) ? annualContribution : null,
    contributionPerUnitAnnual,
    contributionPerUnitMonthly,
    totalUnits: Number.isFinite(totalUnits) ? totalUnits : null,
    sourceStates: {
      reserveBalance: reserveFact?.evidenceState || 'fact_not_accepted',
      annualReserveContribution: contributionFact?.evidenceState || 'fact_not_accepted',
      totalUnits: totalUnitsFact?.evidenceState || 'accepted_total_units_not_available',
    },
    adequacy: {
      classificationStatus: 'not_classified',
      classification: null,
      threshold: null,
      policyAuthority: null,
      reasonCode: 'CANONICAL_RESERVE_ADEQUACY_POLICY_NOT_AVAILABLE',
    },
  };
}

function deferredMaintenanceAnalysis(inputContract, reserveBalance) {
  const statusFact = inputContract?.consolidatedFacts?.deferred_maintenance_status;
  const amountFact = inputContract?.consolidatedFacts?.deferred_maintenance_amount;
  const status = backedValue(statusFact);
  const amount = backedValue(amountFact);
  const comparison = reserveComparison({
    reserveBalance,
    planAmount: amount,
    basis: 'deferred_maintenance_amount',
  });
  return {
    sourceStatus: status || 'not_established',
    amount: Number.isFinite(amount) ? amount : null,
    amountStatus: Number.isFinite(amount)
      ? 'source_amount_available'
      : status === 'identified'
        ? 'identified_amount_not_stated'
        : 'amount_not_available',
    reserveComparison: comparison,
    classification: {
      classificationStatus: status ? 'source_status_preserved' : 'not_classified',
      sourceClassification: status || null,
      severity: null,
      threshold: null,
      policyAuthority: null,
      reasonCode: 'CANONICAL_DEFERRED_MAINTENANCE_SEVERITY_POLICY_NOT_AVAILABLE',
    },
    causeAssessment: {
      status: 'not_assessed',
      inferredCauses: [],
      unsupportedAdjustmentMade: false,
    },
    acceptedProvenanceFields: [
      ...(statusFact?.sourceBacked === true ? statusFact.provenance : []),
      ...(amountFact?.sourceBacked === true ? amountFact.provenance : []),
    ],
    reportPublicationBlocker: false,
  };
}

function collapsedAnalysis(inputContract) {
  return {
    calculationStatus: 'collapsed',
    reasonCode: 'CANONICAL_CAPITAL_PLAN_INPUTS_NOT_ELIGIBLE',
    capitalPlans: [],
    reserve: reserveAnalysis(inputContract),
    deferredMaintenance: deferredMaintenanceAnalysis(inputContract, null),
    conflicts: inputContract?.conflicts || [],
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDeterministicCapitalPlanAnalysis(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === ANALYSIS_SOURCE &&
    value.analysisVersion === ANALYSIS_VERSION
  );
}

export function buildDeterministicCapitalPlanAnalysis({ capitalPlanInputContract } = {}) {
  if (!isCanonicalCapitalPlanInputContract(capitalPlanInputContract)) {
    throw new Error('CANONICAL_CAPITAL_PLAN_INPUT_CONTRACT_REQUIRED');
  }

  const policy = {
    authorityCreating: false,
    sourceTruthMutationAllowed: false,
    deterministicMathOnly: true,
    rendererBehaviorChanged: false,
    customerFacingCopyPublished: false,
    historicalCapitalPromotedToForwardPlan: false,
    missingNumericValuesTreatedAsZero: false,
    timingBucketInferenceAllowed: false,
    reserveAdequacyThresholdInferenceAllowed: false,
    deferredMaintenanceSeverityInferenceAllowed: false,
    arbitraryCallerPolicyAllowed: false,
    optionalCapitalFailureMayBlockValidatedCorePublication: false,
  };
  const inputReceipt = {
    source: capitalPlanInputContract.source,
    contractVersion: capitalPlanInputContract.contractVersion,
    jobId: capitalPlanInputContract?.sourceTruth?.jobId || null,
  };
  if (capitalPlanInputContract?.eligibility?.eligibleForCapitalPlanAnalysis !== true) {
    return deepFreeze({
      source: ANALYSIS_SOURCE,
      analysisVersion: ANALYSIS_VERSION,
      inputContract: inputReceipt,
      policy,
      analysis: collapsedAnalysis(capitalPlanInputContract),
      reportPublicationBlocker: false,
    });
  }

  const reserve = reserveAnalysis(capitalPlanInputContract);
  const reserveBalance = reserve.reserveBalance;
  const capitalPlans = capitalPlanInputContract.capitalSources
    .filter((source) => source.planFactName || [
      'capital_plan_duration_months',
      'immediate_capital_amount',
      'near_term_capital_amount',
      'long_term_capital_amount',
    ].some((factName) => source?.facts?.[factName]?.sourceBacked === true))
    .map((source) => planAnalysis(source, reserveBalance));
  const deferredMaintenance = deferredMaintenanceAnalysis(capitalPlanInputContract, reserveBalance);

  return deepFreeze({
    source: ANALYSIS_SOURCE,
    analysisVersion: ANALYSIS_VERSION,
    inputContract: inputReceipt,
    policy,
    analysis: {
      calculationStatus: 'calculated_or_source_positioned',
      reasonCode: null,
      capitalPlans,
      reserve,
      deferredMaintenance,
      conflicts: capitalPlanInputContract.conflicts,
      limitations: [
        reserve.adequacy.reasonCode,
        deferredMaintenance.classification.reasonCode,
        ...capitalPlanInputContract.conflicts.map((conflict) => `${conflict.conflictType}:${conflict.factName}`),
      ],
      reportPublicationBlocker: false,
    },
    reportPublicationBlocker: false,
  });
}
