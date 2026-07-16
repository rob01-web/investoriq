import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCanonicalCoreReconciliationInputContract,
  isCanonicalCoreReconciliationInputContract,
} from '../../api/_lib/core-reconciliation-input-contract.js';
import {
  buildDeterministicCoreReconciliationAnalysis,
  isCanonicalDeterministicCoreReconciliationAnalysis,
} from '../../api/_lib/deterministic-core-reconciliation-analysis.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = [
  fs.readFileSync(path.join(root, 'api/_lib/core-reconciliation-input-contract.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/deterministic-core-reconciliation-analysis.js'), 'utf8'),
].join('\n');

function sourceTruth({
  t12Gpr = 1612800,
  coreT12Gpr = t12Gpr,
  t12SourcePath = 't12Payload.gross_potential_rent',
  rentRollAnnual = 1432800,
  selectedRentRollAnnual = rentRollAnnual,
  rentRollSourcePath = 'row_derived_units.monthly_rent_x_12',
  totalUnits = 64,
  t12Status = 'accepted_complete',
  rentRollStatus = 'accepted_complete',
} = {}) {
  const t12Facts = {
    gross_potential_rent: coreT12Gpr,
    effective_gross_income: 1450000,
    total_operating_expenses: 600000,
    net_operating_income: 850000,
  };
  if (t12SourcePath === 't12Payload.gross_scheduled_rent') {
    t12Facts.gross_scheduled_rent = coreT12Gpr;
  }
  if (t12SourcePath === 't12Payload.gross_income') {
    t12Facts.gross_income = coreT12Gpr;
  }
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: 'gate-4e-job',
    core_publishable: true,
    true_blockers: [],
    core: {
      t12: {
        status: t12Status,
        artifact_id: 't12-artifact',
        file_id: 't12-file',
        accepted_facts: t12Facts,
      },
      rent_roll: {
        status: rentRollStatus,
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        accepted_facts: {
          total_units: totalUnits,
          annual_in_place_rent: rentRollAnnual,
        },
      },
    },
    support: {
      accepted: [],
      advisory: [],
      adjudication_decisions: [],
      conflicts: [],
      fact_conflicts: [],
      duplicates: [],
    },
    source_reconciliation_state: {
      t12_gpr: t12Gpr,
      rr_annual_in_place: rentRollAnnual,
      t12_gpr_source: t12SourcePath,
      rr_annual_in_place_source: rentRollSourcePath,
      source_selection: {
        t12_gpr: {
          source_path: t12SourcePath,
          value: t12Gpr,
        },
        rr_annual_in_place: {
          source_path: rentRollSourcePath,
          value: selectedRentRollAnnual,
          selected_reason: 'row_derived_units_selected',
          confidence: 'high',
        },
      },
      status: 'source_reconciliation_required',
      variance_pct: (rentRollAnnual - t12Gpr) / t12Gpr,
    },
  };
}

function contractFor(options = {}) {
  return buildCanonicalCoreReconciliationInputContract({
    sourceTruthPackage: sourceTruth(options),
  });
}

function analyze(options = {}, extra = {}) {
  const reconciliationInputContract = contractFor(options);
  return buildDeterministicCoreReconciliationAnalysis({
    reconciliationInputContract,
    ...extra,
  });
}

const completeContract = contractFor();
assert.equal(isCanonicalCoreReconciliationInputContract(completeContract), true);
assert.equal(completeContract.policy.authorityCreating, false);
assert.equal(completeContract.policy.broadT12IncomeFallbackAllowed, false);
assert.equal(completeContract.policy.unannualizedMonthlyRentRollValueAllowed, false);
assert.equal(completeContract.policy.legacyFivePercentThresholdAllowed, false);
assert.equal(completeContract.eligibility.eligibleForReconciliation, true);
assert.equal(completeContract.facts.t12GrossPotentialRent.value, 1612800);
assert.equal(completeContract.facts.t12GrossPotentialRent.sourceBacked, true);
assert.equal(completeContract.facts.rentRollAnnualInPlaceRent.value, 1432800);
assert.equal(completeContract.facts.rentRollAnnualInPlaceRent.sourceBacked, true);
assert.equal(completeContract.facts.totalUnits.value, 64);
assert.equal(completeContract.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(completeContract), true);

const constrainedCoreContract = contractFor({
  t12Status: 'accepted_constrained',
  rentRollStatus: 'accepted_constrained',
});
assert.equal(constrainedCoreContract.eligibility.eligibleForReconciliation, true);

const scheduledRentContract = contractFor({
  t12SourcePath: 't12Payload.gross_scheduled_rent',
});
assert.equal(scheduledRentContract.facts.t12GrossPotentialRent.sourceBacked, true);
assert.equal(
  scheduledRentContract.facts.t12GrossPotentialRent.provenance.factPath,
  'core.t12.accepted_facts.gross_scheduled_rent'
);

const broadIncomeFallback = contractFor({
  t12SourcePath: 't12Payload.gross_income',
});
assert.equal(broadIncomeFallback.facts.t12GrossPotentialRent.factAccepted, true);
assert.equal(broadIncomeFallback.facts.t12GrossPotentialRent.sourceBacked, false);
assert.equal(
  broadIncomeFallback.facts.t12GrossPotentialRent.evidenceState,
  't12_gpr_semantic_source_path_not_allowed'
);
assert.deepEqual(broadIncomeFallback.eligibility.evidenceGaps, ['t12_gross_potential_rent']);

const t12Mismatch = contractFor({ coreT12Gpr: 1500000 });
assert.equal(t12Mismatch.facts.t12GrossPotentialRent.sourceBacked, false);
assert.equal(
  t12Mismatch.facts.t12GrossPotentialRent.evidenceState,
  't12_gpr_reconciliation_value_mismatches_core_fact'
);

const unannualizedMonthly = contractFor({
  rentRollAnnual: 119400,
  selectedRentRollAnnual: 119400,
  rentRollSourcePath: 'rentRollPayload.totals.in_place_rent_monthly',
});
assert.equal(unannualizedMonthly.facts.rentRollAnnualInPlaceRent.factAccepted, true);
assert.equal(unannualizedMonthly.facts.rentRollAnnualInPlaceRent.sourceBacked, false);
assert.equal(
  unannualizedMonthly.facts.rentRollAnnualInPlaceRent.evidenceState,
  'rent_roll_annual_source_path_not_allowed'
);

const rentRollSelectionMismatch = contractFor({ selectedRentRollAnnual: 1962456 });
assert.equal(rentRollSelectionMismatch.facts.rentRollAnnualInPlaceRent.sourceBacked, false);
assert.equal(
  rentRollSelectionMismatch.facts.rentRollAnnualInPlaceRent.evidenceState,
  'rent_roll_reconciliation_value_mismatches_source_selection'
);

const missingGpr = contractFor({ t12Gpr: null, coreT12Gpr: null, t12SourcePath: null });
assert.equal(missingGpr.facts.t12GrossPotentialRent.value, null);
assert.equal(missingGpr.facts.t12GrossPotentialRent.factAccepted, false);
assert.deepEqual(missingGpr.eligibility.missingInputs, ['t12_gross_potential_rent']);
assert.equal(missingGpr.reportPublicationBlocker, false);

assert.throws(
  () => buildCanonicalCoreReconciliationInputContract({
    sourceTruthPackage: { source: 'legacy_fixture_v2', schema_version: 1 },
  }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_CORE_RECONCILIATION/
);

const completeAnalysis = analyze();
assert.equal(isCanonicalDeterministicCoreReconciliationAnalysis(completeAnalysis), true);
assert.equal(completeAnalysis.policy.authorityCreating, false);
assert.equal(completeAnalysis.policy.causeInferenceAllowed, false);
assert.equal(completeAnalysis.policy.materialityThresholdInferenceAllowed, false);
assert.equal(completeAnalysis.policy.legacyFivePercentThresholdUsed, false);
assert.equal(completeAnalysis.reconciliation.calculationStatus, 'calculated');
assert.equal(completeAnalysis.reconciliation.comparisonStatus, 'variance_present');
assert.equal(completeAnalysis.reconciliation.differenceAmount, -180000);
assert.equal(completeAnalysis.reconciliation.absoluteDifferenceAmount, 180000);
assert.equal(completeAnalysis.reconciliation.varianceRatioToT12Gpr, -0.111607);
assert.equal(completeAnalysis.reconciliation.absoluteVarianceRatioToT12Gpr, 0.111607);
assert.equal(completeAnalysis.reconciliation.displayVariancePercent, -11.16);
assert.equal(completeAnalysis.reconciliation.direction, 'rent_roll_below_t12_gpr');
assert.equal(completeAnalysis.reconciliation.perUnitMonthlyDifference, -234.38);
assert.equal(completeAnalysis.reconciliation.materiality.measurementStatus, 'objective_measures_calculated');
assert.equal(completeAnalysis.reconciliation.materiality.classificationStatus, 'not_classified');
assert.equal(completeAnalysis.reconciliation.materiality.classification, null);
assert.equal(completeAnalysis.reconciliation.materiality.threshold, null);
assert.equal(
  completeAnalysis.reconciliation.materiality.reasonCode,
  'CANONICAL_MATERIALITY_POLICY_NOT_AVAILABLE'
);
assert.deepEqual(completeAnalysis.reconciliation.causeAssessment.inferredCauses, []);
assert.equal(completeAnalysis.reconciliation.causeAssessment.unsupportedAdjustmentMade, false);
assert.match(completeAnalysis.reconciliation.sourceBoundExplanation, /\$180,000\.00 below/);
assert.match(completeAnalysis.reconciliation.sourceBoundExplanation, /11\.16% variance/);
assert.match(completeAnalysis.reconciliation.sourceBoundExplanation, /do not establish the cause/);
assert.equal(completeAnalysis.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(completeAnalysis), true);

const aboveAnalysis = analyze({ rentRollAnnual: 1712800, selectedRentRollAnnual: 1712800 });
assert.equal(aboveAnalysis.reconciliation.direction, 'rent_roll_above_t12_gpr');
assert.equal(aboveAnalysis.reconciliation.differenceAmount, 100000);
assert.equal(aboveAnalysis.reconciliation.displayVariancePercent, 6.2);
assert.match(aboveAnalysis.reconciliation.sourceBoundExplanation, /\$100,000\.00 above/);
assert.equal(aboveAnalysis.reconciliation.materiality.classification, null);

const alignedAnalysis = analyze({ rentRollAnnual: 1612800, selectedRentRollAnnual: 1612800 });
assert.equal(alignedAnalysis.reconciliation.direction, 'aligned_to_cent');
assert.equal(alignedAnalysis.reconciliation.comparisonStatus, 'amounts_aligned_to_cent');
assert.equal(alignedAnalysis.reconciliation.differenceAmount, 0);
assert.equal(alignedAnalysis.reconciliation.varianceRatioToT12Gpr, 0);
assert.match(alignedAnalysis.reconciliation.sourceBoundExplanation, /equals accepted T12 Gross Potential Rent/);
assert.equal(
  alignedAnalysis.reconciliation.causeAssessment.status,
  'not_applicable_no_amount_variance'
);

const zeroRentRollAnalysis = analyze({ rentRollAnnual: 0, selectedRentRollAnnual: 0 });
assert.equal(zeroRentRollAnalysis.reconciliation.calculationStatus, 'calculated');
assert.equal(zeroRentRollAnalysis.reconciliation.rentRollAnnualInPlaceRent, 0);
assert.equal(zeroRentRollAnalysis.reconciliation.differenceAmount, -1612800);
assert.equal(zeroRentRollAnalysis.reconciliation.varianceRatioToT12Gpr, -1);
assert.equal(zeroRentRollAnalysis.reconciliation.displayVariancePercent, -100);

const missingAnalysis = buildDeterministicCoreReconciliationAnalysis({
  reconciliationInputContract: missingGpr,
});
assert.equal(missingAnalysis.reconciliation.calculationStatus, 'collapsed');
assert.equal(missingAnalysis.reconciliation.t12GrossPotentialRent, null);
assert.equal(missingAnalysis.reconciliation.rentRollAnnualInPlaceRent, 1432800);
assert.deepEqual(missingAnalysis.reconciliation.missingInputs, ['t12_gross_potential_rent']);
assert.equal(missingAnalysis.reconciliation.differenceAmount, null);
assert.equal(missingAnalysis.reconciliation.materiality.classification, null);
assert.equal(missingAnalysis.reconciliation.reportPublicationBlocker, false);

const arbitraryThresholdAttempt = buildDeterministicCoreReconciliationAnalysis({
  reconciliationInputContract: completeContract,
  materialityThreshold: 0,
  causeNarrative: 'Vacancy caused the difference.',
});
assert.equal(arbitraryThresholdAttempt.reconciliation.materiality.threshold, null);
assert.equal(arbitraryThresholdAttempt.reconciliation.materiality.classification, null);
assert.deepEqual(arbitraryThresholdAttempt.reconciliation.causeAssessment.inferredCauses, []);
assert.doesNotMatch(arbitraryThresholdAttempt.reconciliation.sourceBoundExplanation, /vacancy caused/i);

assert.throws(
  () => buildDeterministicCoreReconciliationAnalysis({
    reconciliationInputContract: { source: 'legacy_fixture_v2' },
  }),
  /CANONICAL_CORE_RECONCILIATION_INPUT_CONTRACT_REQUIRED/
);

const serialized = JSON.stringify(completeAnalysis);
assert.doesNotMatch(serialized, /\u2014/);
assert.doesNotMatch(serialized, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /\u2014/);
assert.doesNotMatch(productionSource, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /full-underwriting-state|legacy_fixture|filename|rawSourceText/);

console.log('deterministic-core-reconciliation-analysis-smoke: PASS');
