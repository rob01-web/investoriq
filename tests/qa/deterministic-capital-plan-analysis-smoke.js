import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { adjudicateSupportDocumentAuthority } from '../../api/_lib/support-document-authority-adjudicator.js';
import {
  buildCanonicalSourceTruthPackage,
  constrainCanonicalSourcePackageToSourceTruth,
} from '../../api/_lib/source-truth-package.js';
import {
  buildCanonicalCapitalPlanInputContract,
  isCanonicalCapitalPlanInputContract,
} from '../../api/_lib/capital-plan-input-contract.js';
import {
  buildDeterministicCapitalPlanAnalysis,
  isCanonicalDeterministicCapitalPlanAnalysis,
} from '../../api/_lib/deterministic-capital-plan-analysis.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = [
  fs.readFileSync(path.join(root, 'api/_lib/capital-plan-input-contract.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/deterministic-capital-plan-analysis.js'), 'utf8'),
].join('\n');

const propertyConditionText = [
  'Property Condition Assessment / Capital Needs Assessment',
  'Total Capital Plan $1,200,000',
  'Immediate Capital Needs $200,000',
  'Near-Term Capital Needs $600,000',
  'Long-Term Capital Needs $400,000',
  'Capital Reserve Balance $350,000',
  'Annual Reserve Contribution $64,000',
  'Deferred Maintenance Identified $180,000',
  'Implementation Schedule: 24 months',
].join('\n');

function decision(name, sourceText, { filename = `${name}.pdf`, parserRole = null } = {}) {
  const fileId = `file-${name}`;
  const artifacts = [{
    id: `text-${name}`,
    type: 'document_text_extracted',
    payload: { file_id: fileId, original_filename: filename, text: sourceText },
  }];
  if (parserRole) {
    artifacts.push({
      id: `candidate-${name}`,
      type: 'appraisal_parsed',
      payload: { file_id: fileId, original_filename: filename, semantic_doc_role: parserRole },
    });
  }
  return adjudicateSupportDocumentAuthority({ file: { file_id: fileId, original_filename: filename }, artifacts });
}

function packageForTexts(entries) {
  return buildCanonicalSourceTruthPackage({
    jobId: 'gate-4f-job',
    propertyName: 'Gate 4F Property',
    uploadedFiles: entries.map((entry) => ({
      id: entry.id,
      original_filename: entry.filename,
      parse_status: 'parsed',
    })),
    artifacts: entries.map((entry) => ({
      id: `artifact-${entry.id}`,
      type: 'document_text_extracted',
      payload: { file_id: entry.id, original_filename: entry.filename, text: entry.text },
    })),
  });
}

function withAcceptedUnits(sourceTruthPackage, totalUnits = 64) {
  return {
    ...sourceTruthPackage,
    core: {
      ...(sourceTruthPackage.core || {}),
      rent_roll: {
        status: 'accepted_complete',
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        accepted_facts: { total_units: totalUnits },
      },
    },
  };
}

const propertyDecision = decision('property-condition', propertyConditionText);
assert.equal(propertyDecision.canonicalRole, 'property_condition_context');
assert.equal(propertyDecision.roleAccepted, true);
assert.equal(propertyDecision.sourceBacked, true);
assert.equal(propertyDecision.acceptedFacts.total_capital_plan_amount, 1200000);
assert.equal(propertyDecision.acceptedFacts.capital_reserve_balance, 350000);
assert.equal(propertyDecision.acceptedFacts.annual_reserve_contribution, 64000);
assert.equal(propertyDecision.acceptedFacts.deferred_maintenance_amount, 180000);
assert.equal(propertyDecision.acceptedFacts.deferred_maintenance_status, 'identified');
assert.equal(propertyDecision.acceptedFacts.immediate_capital_amount, 200000);
assert.equal(propertyDecision.acceptedFacts.near_term_capital_amount, 600000);
assert.equal(propertyDecision.acceptedFacts.long_term_capital_amount, 400000);
assert.equal(propertyDecision.acceptedFacts.capital_plan_duration_months, 24);
assert.match(propertyDecision.acceptedFactEvidence.capital_reserve_balance.excerpt, /350,000/);

const parserDisagreement = decision('property-parser-disagreement', propertyConditionText, {
  filename: 'Appraisal_Summary.pdf',
  parserRole: 'appraisal',
});
assert.equal(parserDisagreement.canonicalRole, 'property_condition_context');
assert.equal(parserDisagreement.acceptedFacts.total_capital_plan_amount, 1200000);

const ocrCurrencyLoss = decision('ocr-currency-loss', [
  'Property Condition Assessment / Capital Needs Assessment',
  'Total Capital Plan CAD 1,200,000',
  'Capital Reserve Balance 350,000',
  'Deferred Maintenance Identified 180,000',
].join('\n'));
assert.equal(ocrCurrencyLoss.acceptedFacts.total_capital_plan_amount, 1200000);
assert.equal(ocrCurrencyLoss.acceptedFacts.capital_reserve_balance, 350000);
assert.equal(ocrCurrencyLoss.acceptedFacts.deferred_maintenance_amount, 180000);

const splitLabelValue = decision('split-label-value', [
  'Property Condition Assessment / Capital Needs Assessment',
  'Total Capital Plan',
  '$1,200,000',
  'Capital Reserve Balance',
  '$350,000',
].join('\n'));
assert.equal(splitLabelValue.acceptedFacts.total_capital_plan_amount, 1200000);
assert.equal(splitLabelValue.acceptedFacts.capital_reserve_balance, 350000);

const renovationTiming = decision('renovation-timing', [
  'Renovation / CapEx Plan',
  'Total Renovation Budget $1,280,000',
  '1BR interiors $370,000 Months 1-18',
  '2BR interiors $432,000 Months 1-24',
].join('\n'));
assert.equal(renovationTiming.canonicalRole, 'renovation_capex_context');
assert.equal(renovationTiming.acceptedFacts.capital_plan_start_month, 1);
assert.equal(renovationTiming.acceptedFacts.capital_plan_end_month, 24);
assert.equal(renovationTiming.acceptedFacts.capital_plan_duration_months, 24);

const conflictingTiming = decision('conflicting-timing', [
  'Renovation / CapEx Plan',
  'Total Renovation Budget $800,000',
  'Implementation Schedule: 18 months',
  'Exterior work Months 1-24',
].join('\n'));
assert.equal(conflictingTiming.roleAccepted, true);
assert.equal(conflictingTiming.acceptedFacts.capital_plan_duration_months, undefined);
assert.equal(
  conflictingTiming.factAmbiguities.capital_plan_timing.reason,
  'conflicting_capital_plan_timing_horizons'
);

const noDeferredMaintenance = decision('no-deferred-maintenance', [
  'Property Condition Assessment / Replacement Reserve Study',
  'Total Capital Plan $0',
  'Capital Reserve Balance $250,000',
  'Annual Reserve Contribution $48,000',
  'No deferred maintenance was identified.',
].join('\n'));
assert.equal(noDeferredMaintenance.acceptedFacts.total_capital_plan_amount, 0);
assert.equal(noDeferredMaintenance.acceptedFacts.capital_reserve_balance, 250000);
assert.equal(noDeferredMaintenance.acceptedFacts.deferred_maintenance_status, 'none_identified');

const deferredStatusConflict = decision('deferred-status-conflict', [
  'Property Condition Assessment',
  'Total Capital Plan $100,000',
  'No deferred maintenance was identified.',
  'Deferred maintenance identified at $25,000.',
].join('\n'));
assert.equal(deferredStatusConflict.acceptedFacts.deferred_maintenance_amount, 25000);
assert.equal(deferredStatusConflict.acceptedFacts.deferred_maintenance_status, undefined);
assert.equal(
  deferredStatusConflict.factAmbiguities.deferred_maintenance_status.reason,
  'conflicting_deferred_maintenance_status'
);

const notAssessedDeferred = decision('deferred-not-assessed', [
  'Property Condition Assessment',
  'Total Capital Plan $100,000',
  'Deferred maintenance was not assessed.',
].join('\n'));
assert.equal(notAssessedDeferred.acceptedFacts.deferred_maintenance_status, undefined);
assert.equal(notAssessedDeferred.acceptedFacts.deferred_maintenance_amount, undefined);

const appraisalDeferred = decision('appraisal-deferred', [
  'Appraisal Report / Valuation Context',
  'Appraised Value $14,200,000',
  'Deferred Maintenance Identified $180,000',
].join('\n'));
assert.equal(appraisalDeferred.canonicalRole, 'appraisal_context');
assert.equal(appraisalDeferred.acceptedFacts.deferred_maintenance_amount, 180000);
assert.equal(appraisalDeferred.acceptedFacts.deferred_maintenance_status, 'identified');

const historicalCapital = decision('historical-capital', [
  'Historical CapEx Summary',
  'Completed capital improvements and completed repairs from 2022 to 2025.',
  'Total Renovation Budget $800,000',
].join('\n'));
assert.equal(historicalCapital.canonicalRole, 'historical_capital_context');
assert.equal(historicalCapital.roleAccepted, true);
assert.equal(historicalCapital.acceptedFacts.total_renovation_budget, undefined);

const filenameOnly = decision('filename-only', 'General property notes without capital facts.', {
  filename: 'Property_Condition_Assessment.pdf',
});
assert.equal(filenameOnly.canonicalRole, null);
assert.equal(filenameOnly.roleAccepted, false);

const canonicalPackage = packageForTexts([{
  id: 'pca-source',
  filename: 'Property Condition Assessment.pdf',
  text: propertyConditionText,
}]);
const acceptedPropertySource = canonicalPackage.support.accepted.find(
  (entry) => entry.canonical_role === 'property_condition_context'
);
assert.ok(acceptedPropertySource);
assert.equal(acceptedPropertySource.primary_for_role, true);
assert.equal(acceptedPropertySource.accepted_facts.total_capital_plan_amount, 1200000);
const constrainedPropertyPackage = constrainCanonicalSourcePackageToSourceTruth(null, canonicalPackage);
assert.equal(
  constrainedPropertyPackage.supportDocs.get('pca-source')?.canonicalLabel,
  'Property Condition / Capital Needs Context'
);
assert.notEqual(
  constrainedPropertyPackage.supportDocs.get('pca-source')?.canonicalLabel,
  'Other Support Document'
);

const inputContract = buildCanonicalCapitalPlanInputContract({
  sourceTruthPackage: withAcceptedUnits(canonicalPackage),
});
assert.equal(isCanonicalCapitalPlanInputContract(inputContract), true);
assert.equal(inputContract.policy.authorityCreating, false);
assert.equal(inputContract.policy.historicalCapitalPromotedToForwardPlan, false);
assert.equal(inputContract.policy.arbitraryAdequacyThresholdAllowed, false);
assert.equal(inputContract.eligibility.eligibleForCapitalPlanAnalysis, true);
assert.equal(inputContract.eligibility.acceptedPrimarySourceCount, 1);
assert.equal(inputContract.capitalSources[0].canonicalRole, 'property_condition_context');
assert.equal(inputContract.capitalSources[0].facts.total_capital_plan_amount.sourceBacked, true);
assert.equal(inputContract.consolidatedFacts.capital_reserve_balance.value, 350000);
assert.equal(inputContract.consolidatedFacts.capital_reserve_balance.sourceBacked, true);
assert.equal(inputContract.coreInputs.totalUnits.value, 64);
assert.equal(inputContract.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(inputContract), true);

const analysis = buildDeterministicCapitalPlanAnalysis({ capitalPlanInputContract: inputContract });
assert.equal(isCanonicalDeterministicCapitalPlanAnalysis(analysis), true);
assert.equal(analysis.policy.authorityCreating, false);
assert.equal(analysis.policy.timingBucketInferenceAllowed, false);
assert.equal(analysis.policy.reserveAdequacyThresholdInferenceAllowed, false);
assert.equal(analysis.policy.deferredMaintenanceSeverityInferenceAllowed, false);
assert.equal(analysis.analysis.capitalPlans.length, 1);
const plan = analysis.analysis.capitalPlans[0];
assert.equal(plan.planAmount, 1200000);
assert.equal(plan.timing.relativeSchedule.durationMonths, 24);
assert.deepEqual(plan.timing.sourceLabeledBuckets, {
  immediate: 200000,
  nearTerm: 600000,
  longTerm: 400000,
});
assert.equal(plan.timing.bucketReconciliation.accountedAmount, 1200000);
assert.equal(plan.timing.bucketReconciliation.unallocatedAmount, 0);
assert.equal(plan.timing.bucketReconciliation.ratioOfBucketsToPlan, 1);
assert.equal(plan.reserveComparison.reserveLessRequirementAmount, -850000);
assert.equal(plan.reserveComparison.reserveCoverageRatio, 0.291667);
assert.equal(plan.reserveComparison.objectiveFundingPosition, 'reserve_below_stated_requirement');
assert.equal(plan.adequacy.classificationStatus, 'not_classified');
assert.equal(plan.adequacy.classification, null);
assert.equal(plan.adequacy.threshold, null);
assert.equal(analysis.analysis.reserve.annualReserveContribution, 64000);
assert.equal(analysis.analysis.reserve.contributionPerUnitAnnual, 1000);
assert.equal(analysis.analysis.reserve.contributionPerUnitMonthly, 83.33);
assert.equal(analysis.analysis.deferredMaintenance.sourceStatus, 'identified');
assert.equal(analysis.analysis.deferredMaintenance.amount, 180000);
assert.equal(analysis.analysis.deferredMaintenance.reserveComparison.reserveLessRequirementAmount, 170000);
assert.equal(analysis.analysis.deferredMaintenance.reserveComparison.reserveCoverageRatio, 1.944444);
assert.equal(
  analysis.analysis.deferredMaintenance.reserveComparison.objectiveFundingPosition,
  'reserve_meets_or_exceeds_stated_requirement'
);
assert.equal(analysis.analysis.deferredMaintenance.classification.severity, null);
assert.deepEqual(analysis.analysis.deferredMaintenance.causeAssessment.inferredCauses, []);
assert.equal(analysis.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(analysis), true);

const partialTimingPackage = packageForTexts([{
  id: 'partial-timing',
  filename: 'Partial Capital Plan.pdf',
  text: [
    'Property Condition Assessment / Capital Needs Assessment',
    'Total Capital Plan $900,000',
    'Immediate Capital Needs $200,000',
    'Near-Term Capital Needs $500,000',
  ].join('\n'),
}]);
const partialTimingAnalysis = buildDeterministicCapitalPlanAnalysis({
  capitalPlanInputContract: buildCanonicalCapitalPlanInputContract({ sourceTruthPackage: partialTimingPackage }),
});
assert.equal(
  partialTimingAnalysis.analysis.capitalPlans[0].timing.bucketReconciliation.status,
  'partial_source_labeled_timing_buckets'
);
assert.equal(partialTimingAnalysis.analysis.capitalPlans[0].timing.bucketReconciliation.accountedAmount, 700000);
assert.equal(partialTimingAnalysis.analysis.capitalPlans[0].timing.bucketReconciliation.unallocatedAmount, null);

const reserveConflictPackage = packageForTexts([
  {
    id: 'reserve-a',
    filename: 'PCA A.pdf',
    text: propertyConditionText,
  },
  {
    id: 'reserve-b',
    filename: 'PCA B.pdf',
    text: propertyConditionText.replace('$350,000', '$400,000'),
  },
]);
assert.deepEqual(
  reserveConflictPackage.support.fact_conflicts.map((entry) => entry.fact_name),
  ['capital_reserve_balance']
);
assert.equal(
  reserveConflictPackage.support.accepted.filter((entry) => entry.canonical_role === 'property_condition_context').length,
  2
);
const reserveConflictContract = buildCanonicalCapitalPlanInputContract({
  sourceTruthPackage: reserveConflictPackage,
});
assert.equal(reserveConflictContract.eligibility.eligibleForCapitalPlanAnalysis, true);
assert.equal(reserveConflictContract.eligibility.status, 'eligible_with_narrow_fact_conflicts');
assert.equal(reserveConflictContract.consolidatedFacts.capital_reserve_balance.value, null);
assert.equal(
  reserveConflictContract.consolidatedFacts.capital_reserve_balance.evidenceState,
  'canonical_fact_conflict'
);
const reserveConflictAnalysis = buildDeterministicCapitalPlanAnalysis({
  capitalPlanInputContract: reserveConflictContract,
});
assert.equal(reserveConflictAnalysis.analysis.capitalPlans[0].reserveComparison.calculationStatus, 'collapsed');
assert.equal(reserveConflictAnalysis.analysis.capitalPlans[0].planAmount, 1200000);
assert.equal(reserveConflictAnalysis.reportPublicationBlocker, false);

const crossRoleReserveConflictPackage = packageForTexts([
  {
    id: 'pca-cross',
    filename: 'PCA.pdf',
    text: propertyConditionText,
  },
  {
    id: 'reno-cross',
    filename: 'Renovation Plan.pdf',
    text: [
      'Renovation / CapEx Plan',
      'Total Renovation Budget $500,000',
      'Capital Reserve Balance $400,000',
      'Implementation Schedule: 18 months',
    ].join('\n'),
  },
]);
const crossRoleReserveConflictContract = buildCanonicalCapitalPlanInputContract({
  sourceTruthPackage: crossRoleReserveConflictPackage,
});
assert.equal(
  crossRoleReserveConflictContract.consolidatedFacts.capital_reserve_balance.evidenceState,
  'cross_role_fact_conflict'
);
assert.equal(
  crossRoleReserveConflictContract.conflicts.some((entry) => entry.conflictType === 'cross_role_fact_conflict'),
  true
);

const zeroPackage = packageForTexts([{
  id: 'zero-capital',
  filename: 'Reserve Study.pdf',
  text: [
    'Property Condition Assessment / Replacement Reserve Study',
    'Total Capital Plan $0',
    'Capital Reserve Balance $0',
    'Annual Reserve Contribution $0',
    'No deferred maintenance was identified.',
  ].join('\n'),
}]);
const zeroAnalysis = buildDeterministicCapitalPlanAnalysis({
  capitalPlanInputContract: buildCanonicalCapitalPlanInputContract({ sourceTruthPackage: zeroPackage }),
});
assert.equal(zeroAnalysis.analysis.capitalPlans[0].planAmount, 0);
assert.equal(zeroAnalysis.analysis.reserve.reserveBalance, 0);
assert.equal(zeroAnalysis.analysis.reserve.annualReserveContribution, 0);
assert.equal(
  zeroAnalysis.analysis.capitalPlans[0].reserveComparison.objectiveFundingPosition,
  'no_stated_capital_requirement'
);
assert.equal(zeroAnalysis.analysis.deferredMaintenance.sourceStatus, 'none_identified');

const historicalOnlyPackage = packageForTexts([{
  id: 'historical-only',
  filename: 'Historical CapEx.pdf',
  text: [
    'Historical CapEx Summary',
    'Completed capital improvements and completed repairs from 2022 to 2025.',
    'Total Renovation Budget $800,000',
  ].join('\n'),
}]);
const historicalOnlyContract = buildCanonicalCapitalPlanInputContract({
  sourceTruthPackage: historicalOnlyPackage,
});
const constrainedHistoricalPackage = constrainCanonicalSourcePackageToSourceTruth(null, historicalOnlyPackage);
assert.equal(
  constrainedHistoricalPackage.supportDocs.get('historical-only')?.canonicalLabel,
  'Historical Capital Context'
);
assert.equal(historicalOnlyContract.eligibility.sourcePresent, true);
assert.equal(historicalOnlyContract.eligibility.eligibleForCapitalPlanAnalysis, false);
assert.equal(historicalOnlyContract.capitalSources.length, 0);
const historicalOnlyAnalysis = buildDeterministicCapitalPlanAnalysis({
  capitalPlanInputContract: historicalOnlyContract,
});
assert.equal(historicalOnlyAnalysis.analysis.calculationStatus, 'collapsed');
assert.equal(historicalOnlyAnalysis.reportPublicationBlocker, false);

const evidenceGapPackage = {
  source: 'canonical_source_truth_package',
  schema_version: 1,
  job_id: 'evidence-gap',
  core_publishable: true,
  core: {},
  support: {
    accepted: [{
      file_id: 'gap-file',
      canonical_role: 'property_condition_context',
      primary_for_role: true,
      accepted_facts: { total_capital_plan_amount: 500000 },
      accepted_fact_evidence: {},
      authority_decision: { roleAccepted: true },
    }],
    adjudication_decisions: [],
    fact_conflicts: [],
  },
};
const evidenceGapContract = buildCanonicalCapitalPlanInputContract({
  sourceTruthPackage: evidenceGapPackage,
});
assert.equal(evidenceGapContract.eligibility.sourcePresent, true);
assert.equal(evidenceGapContract.eligibility.eligibleForCapitalPlanAnalysis, false);
assert.equal(evidenceGapContract.reportPublicationBlocker, false);

const arbitraryPolicyAttempt = buildDeterministicCapitalPlanAnalysis({
  capitalPlanInputContract: inputContract,
  reserveAdequacyThreshold: 0,
  deferredMaintenanceSeverity: 'critical',
  inferredCause: 'roof failure',
});
assert.equal(arbitraryPolicyAttempt.analysis.capitalPlans[0].adequacy.threshold, null);
assert.equal(arbitraryPolicyAttempt.analysis.capitalPlans[0].adequacy.classification, null);
assert.equal(arbitraryPolicyAttempt.analysis.deferredMaintenance.classification.severity, null);
assert.deepEqual(arbitraryPolicyAttempt.analysis.deferredMaintenance.causeAssessment.inferredCauses, []);

assert.throws(
  () => buildCanonicalCapitalPlanInputContract({
    sourceTruthPackage: { source: 'legacy_fixture_v2', schema_version: 1 },
  }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_CAPITAL_PLAN_INPUT_CONTRACT/
);
assert.throws(
  () => buildDeterministicCapitalPlanAnalysis({
    capitalPlanInputContract: { source: 'legacy_fixture_v2' },
  }),
  /CANONICAL_CAPITAL_PLAN_INPUT_CONTRACT_REQUIRED/
);

const serialized = JSON.stringify(analysis);
assert.doesNotMatch(serialized, /\u2014/);
assert.doesNotMatch(serialized, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /\u2014/);
assert.doesNotMatch(productionSource, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /legacy_fixture|filename|rawSourceText/);

console.log('deterministic-capital-plan-analysis-smoke: PASS');
