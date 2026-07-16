import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import { buildCanonicalInstitutionalUnderwritingInputContract } from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildDeterministicSourceCaseUnderwritingAnalysis,
  isCanonicalDeterministicSourceCaseUnderwritingAnalysis,
} from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';

function buildSourceTruth({
  jobId = 'gate-5b-job',
  effectiveGrossIncome = 1500000,
  totalOperatingExpenses = 555000,
  netOperatingIncome = 945000,
  occupancy = 0.9375,
  annualInPlaceRent = 1432800,
  annualMarketRent = 1718400,
  totalUnits = 64,
} = {}) {
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: jobId,
    property_name: 'Gate 5B Property',
    core_publishable: true,
    true_blockers: [],
    core: {
      t12: {
        status: 'accepted_complete',
        artifact_id: 't12-artifact',
        file_id: 't12-file',
        original_filename: 'T12.xlsx',
        accepted_facts: {
          gross_potential_rent: 1718400,
          effective_gross_income: effectiveGrossIncome,
          total_operating_expenses: totalOperatingExpenses,
          net_operating_income: netOperatingIncome,
          income_lines: [{ label: 'Effective Gross Income', amount: effectiveGrossIncome }],
          expense_lines: [{ label: 'Operating Expenses', amount: totalOperatingExpenses }],
        },
      },
      rent_roll: {
        status: 'accepted_complete',
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        original_filename: 'Rent Roll.xlsx',
        accepted_facts: {
          total_units: totalUnits,
          occupancy,
          annual_in_place_rent: annualInPlaceRent,
          annual_market_rent: annualMarketRent,
          unit_mix: [{ label: 'All Units', count: totalUnits, current_rent: 1865.625, market_rent: 2237.5 }],
          units: [{ unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
        },
      },
    },
    support: {
      accepted: [],
      advisory: [],
      rejected: [],
      adjudication_decisions: [],
      conflicts: [],
      fact_conflicts: [],
      duplicates: [],
    },
    section_policy: {},
    disclosures: [],
    source_reconciliation_state: {
      status: 'source_reconciliation_required',
      t12_gpr: 1718400,
      t12_gpr_source: 't12Payload.gross_potential_rent',
      rr_annual_in_place: annualInPlaceRent,
      rr_annual_in_place_source: 'rentRollPayload.total_in_place_annual',
      difference_amount: annualInPlaceRent - 1718400,
      variance_pct: (annualInPlaceRent - 1718400) / 1718400,
      source_reconciliation_disclosure: 'Accepted Rent Roll annual in-place rent differs from accepted T12 Gross Potential Rent.',
      source_selection: {
        t12_gpr: {
          source_path: 't12Payload.gross_potential_rent',
          value: 1718400,
        },
        rr_annual_in_place: {
          source_path: 'rentRollPayload.total_in_place_annual',
          value: annualInPlaceRent,
          selected_reason: 'explicit_annual_total',
          confidence: 'high',
        },
      },
    },
  };
}

function buildGate5B(sourceTruthPackage) {
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-16',
  });
  const scenarioPolicyContract = buildCanonicalInstitutionalUnderwritingScenarioPolicyContract();
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract,
  });
  const analysis = buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract });
  return { underwritingInputContract, analysis };
}

function receipt(section, calculationKey) {
  return section.calculations.find((entry) => entry.calculationKey === calculationKey);
}

const { underwritingInputContract, analysis } = buildGate5B(buildSourceTruth());
assert.equal(isCanonicalDeterministicSourceCaseUnderwritingAnalysis(analysis), true);
assert.equal(Object.isFrozen(analysis), true);
assert.equal(Object.isFrozen(analysis.sections.sourceCaseOperating), true);
assert.equal(Object.isFrozen(analysis.formulaRegistry), true);
assert.equal(analysis.inputReceipt.jobId, 'gate-5b-job');
assert.equal(analysis.inputReceipt.corePublishable, true);
assert.equal(analysis.reportPublicationBlocker, false);
assert.equal(analysis.policy.authorityCreating, false);
assert.equal(analysis.policy.deterministicMathOnly, true);
assert.equal(analysis.policy.acceptedSourceCaseOnly, true);
assert.equal(analysis.policy.downstreamRenderingAuthorized, false);
assert.equal(analysis.policy.screeningBehaviorChanged, false);
assert.equal(analysis.policy.legacyUnderwritingReuseAllowed, false);

const operating = analysis.sections.sourceCaseOperating;
assert.equal(operating.analysisStatus, 'calculated');
assert.equal(operating.sourceBound, true);
assert.equal(receipt(operating, 'impliedNetOperatingIncome').result, 945000);
assert.equal(receipt(operating, 'netOperatingIncomeReconciliationDifference').result, 0);
assert.equal(receipt(operating, 'operatingExpenseRatio').result, 0.37);
assert.equal(receipt(operating, 'netOperatingIncomeMargin').result, 0.63);
assert.equal(receipt(operating, 'impliedNetOperatingIncome').formula, 'accepted_effective_gross_income_minus_accepted_total_operating_expenses');
assert.equal(receipt(operating, 'impliedNetOperatingIncome').inputProvenance.length, 2);
assert.equal(receipt(operating, 'impliedNetOperatingIncome').inputProvenance[0].sourceIdentityKey, 'file:t12-file');

const rentDifference = analysis.sections.rentDifference;
assert.equal(rentDifference.analysisStatus, 'calculated');
assert.equal(receipt(rentDifference, 'annualMarketRentDifference').result, 285600);
assert.equal(receipt(rentDifference, 'marketRentDifferenceRatioToInPlace').result, 0.19933);
assert.equal(receipt(rentDifference, 'marketRentDifferencePerUnitMonthly').result, 371.88);
assert.equal(rentDifference.limitationCodes.includes('SOURCE_STATED_MARKET_RENT_DIFFERENCE_NOT_RENT_GROWTH'), true);
assert.equal(rentDifference.limitationCodes.includes('RENT_ACHIEVABILITY_NOT_ASSESSED'), true);

const physicalVacancy = analysis.sections.physicalVacancy;
assert.equal(physicalVacancy.analysisStatus, 'calculated');
assert.equal(receipt(physicalVacancy, 'physicalVacancyRate').result, 0.0625);
assert.equal(receipt(physicalVacancy, 'occupiedUnitEquivalent').result, 60);
assert.equal(receipt(physicalVacancy, 'vacantUnitEquivalent').result, 4);
assert.equal(physicalVacancy.limitationCodes.includes('PHYSICAL_VACANCY_IS_NOT_ECONOMIC_VACANCY'), true);

assert.equal(analysis.coverage.calculatedSectionCount, 3);
assert.equal(analysis.coverage.totalSectionCount, 3);
assert.equal(analysis.coverage.calculatedMeasureCount, 10);
assert.equal(analysis.coverage.totalMeasureCount, 10);
assert.equal(analysis.coverage.unavailableAnalysisCount, 10);

for (const unavailable of Object.values(analysis.unavailableAnalyses)) {
  assert.equal(unavailable.authorityState, 'not_authorized');
  assert.equal(unavailable.calculationPerformed, false);
  assert.equal(unavailable.value, null);
  assert.equal(unavailable.customerSurfaceAuthorized, false);
  assert.equal(unavailable.reportPublicationBlocker, false);
}
assert.equal(analysis.unavailableAnalyses.expenseNormalization.value, null);
assert.equal(analysis.unavailableAnalyses.economicVacancy.value, null);
assert.equal(analysis.unavailableAnalyses.rentGrowth.value, null);
assert.equal(analysis.unavailableAnalyses.bridgeScenario.value, null);
assert.equal(analysis.unavailableAnalyses.exitScenario.value, null);
assert.equal(analysis.unavailableAnalyses.stressScenario.value, null);
assert.equal(analysis.unavailableAnalyses.refinanceConstraints.value, null);
assert.equal(analysis.unavailableAnalyses.riskClassification.value, null);
assert.equal(analysis.unavailableAnalyses.recommendation.value, null);

const ignoredCallerOverrides = buildDeterministicSourceCaseUnderwritingAnalysis({
  underwritingInputContract,
  normalizedExpenses: 400000,
  economicVacancy: 0.08,
  rentGrowth: 0.04,
  stressOccupancy: 0.8,
  recommendation: 'caller_value',
});
assert.deepEqual(ignoredCallerOverrides, analysis);

const tamperedResult = structuredClone(analysis);
receipt(tamperedResult.sections.rentDifference, 'annualMarketRentDifference').result = 999999;
assert.equal(isCanonicalDeterministicSourceCaseUnderwritingAnalysis(tamperedResult), false);

const tamperedFormula = structuredClone(analysis);
receipt(tamperedFormula.sections.sourceCaseOperating, 'operatingExpenseRatio').formula = 'caller_formula';
assert.equal(isCanonicalDeterministicSourceCaseUnderwritingAnalysis(tamperedFormula), false);

const tamperedProvenance = structuredClone(analysis);
receipt(tamperedProvenance.sections.physicalVacancy, 'physicalVacancyRate').inputProvenance = [];
assert.equal(isCanonicalDeterministicSourceCaseUnderwritingAnalysis(tamperedProvenance), false);

assert.throws(
  () => buildDeterministicSourceCaseUnderwritingAnalysis({
    underwritingInputContract: {
      source: 'canonical_institutional_underwriting_input_contract',
      contractVersion: 1,
    },
  }),
  /CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_SOURCE_CASE_ANALYSIS/
);

const missingMarketRentSourceTruth = buildSourceTruth({ jobId: 'gate-5b-missing-market-rent' });
delete missingMarketRentSourceTruth.core.rent_roll.accepted_facts.annual_market_rent;
const missingMarketRent = buildGate5B(missingMarketRentSourceTruth).analysis;
assert.equal(missingMarketRent.sections.sourceCaseOperating.analysisStatus, 'calculated');
assert.equal(missingMarketRent.sections.rentDifference.analysisStatus, 'collapsed');
assert.equal(receipt(missingMarketRent.sections.rentDifference, 'annualMarketRentDifference').result, null);
assert.equal(receipt(missingMarketRent.sections.rentDifference, 'marketRentDifferenceRatioToInPlace').result, null);
assert.equal(receipt(missingMarketRent.sections.rentDifference, 'marketRentDifferencePerUnitMonthly').result, null);
assert.equal(missingMarketRent.sections.physicalVacancy.analysisStatus, 'calculated');
assert.equal(missingMarketRent.reportPublicationBlocker, false);
assert.equal(isCanonicalDeterministicSourceCaseUnderwritingAnalysis(missingMarketRent), true);

const zeroIncome = buildGate5B(buildSourceTruth({
  jobId: 'gate-5b-zero-income',
  effectiveGrossIncome: 0,
  totalOperatingExpenses: 0,
  netOperatingIncome: 0,
})).analysis;
assert.equal(receipt(zeroIncome.sections.sourceCaseOperating, 'impliedNetOperatingIncome').result, 0);
assert.equal(receipt(zeroIncome.sections.sourceCaseOperating, 'netOperatingIncomeReconciliationDifference').result, 0);
assert.equal(receipt(zeroIncome.sections.sourceCaseOperating, 'operatingExpenseRatio').result, null);
assert.equal(receipt(zeroIncome.sections.sourceCaseOperating, 'operatingExpenseRatio').reasonCode, 'POSITIVE_EFFECTIVE_GROSS_INCOME_REQUIRED_FOR_EXPENSE_RATIO');
assert.equal(receipt(zeroIncome.sections.sourceCaseOperating, 'netOperatingIncomeMargin').result, null);
assert.equal(zeroIncome.sections.sourceCaseOperating.analysisStatus, 'calculated');

const zeroOccupancy = buildGate5B(buildSourceTruth({
  jobId: 'gate-5b-zero-occupancy',
  occupancy: 0,
})).analysis;
assert.equal(receipt(zeroOccupancy.sections.physicalVacancy, 'physicalVacancyRate').result, 1);
assert.equal(receipt(zeroOccupancy.sections.physicalVacancy, 'occupiedUnitEquivalent').result, 0);
assert.equal(receipt(zeroOccupancy.sections.physicalVacancy, 'vacantUnitEquivalent').result, 64);

const zeroInPlaceRent = buildGate5B(buildSourceTruth({
  jobId: 'gate-5b-zero-in-place-rent',
  annualInPlaceRent: 0,
  annualMarketRent: 120000,
})).analysis;
assert.equal(receipt(zeroInPlaceRent.sections.rentDifference, 'annualMarketRentDifference').result, 120000);
assert.equal(receipt(zeroInPlaceRent.sections.rentDifference, 'marketRentDifferenceRatioToInPlace').result, null);
assert.equal(receipt(zeroInPlaceRent.sections.rentDifference, 'marketRentDifferenceRatioToInPlace').reasonCode, 'POSITIVE_ANNUAL_IN_PLACE_RENT_REQUIRED_FOR_RENT_DIFFERENCE_RATIO');
assert.equal(receipt(zeroInPlaceRent.sections.rentDifference, 'marketRentDifferencePerUnitMonthly').result, 156.25);

const negativeNoi = buildGate5B(buildSourceTruth({
  jobId: 'gate-5b-negative-noi',
  effectiveGrossIncome: 1000000,
  totalOperatingExpenses: 1200000,
  netOperatingIncome: -200000,
})).analysis;
assert.equal(receipt(negativeNoi.sections.sourceCaseOperating, 'impliedNetOperatingIncome').result, -200000);
assert.equal(receipt(negativeNoi.sections.sourceCaseOperating, 'netOperatingIncomeReconciliationDifference').result, 0);
assert.equal(receipt(negativeNoi.sections.sourceCaseOperating, 'operatingExpenseRatio').result, 1.2);
assert.equal(receipt(negativeNoi.sections.sourceCaseOperating, 'netOperatingIncomeMargin').result, -0.2);

const marketBelowInPlace = buildGate5B(buildSourceTruth({
  jobId: 'gate-5b-market-below-in-place',
  annualInPlaceRent: 1500000,
  annualMarketRent: 1440000,
})).analysis;
assert.equal(receipt(marketBelowInPlace.sections.rentDifference, 'annualMarketRentDifference').result, -60000);
assert.equal(receipt(marketBelowInPlace.sections.rentDifference, 'marketRentDifferenceRatioToInPlace').result, -0.04);
assert.equal(receipt(marketBelowInPlace.sections.rentDifference, 'marketRentDifferencePerUnitMonthly').result, -78.13);

const missingOccupancySourceTruth = buildSourceTruth({ jobId: 'gate-5b-missing-occupancy' });
delete missingOccupancySourceTruth.core.rent_roll.accepted_facts.occupancy;
const missingOccupancy = buildGate5B(missingOccupancySourceTruth).analysis;
assert.equal(missingOccupancy.sections.sourceCaseOperating.analysisStatus, 'collapsed');
assert.equal(missingOccupancy.sections.rentDifference.analysisStatus, 'calculated');
assert.equal(missingOccupancy.sections.physicalVacancy.analysisStatus, 'collapsed');
assert.equal(receipt(missingOccupancy.sections.physicalVacancy, 'physicalVacancyRate').result, null);
assert.equal(missingOccupancy.reportPublicationBlocker, false);

const ownerSource = readFileSync(
  new URL('../../api/_lib/deterministic-source-case-underwriting-analysis.js', import.meta.url),
  'utf8'
);
assert.doesNotMatch(ownerSource, /full-underwriting-state|legacy-underwriting/i);
assert.doesNotMatch(ownerSource, /generate-client-report|screening-report-renderer|acquisition-memo-v2-document/i);
assert.doesNotMatch(ownerSource, /[\u2013\u2014]/);

console.log('deterministic-source-case-underwriting-analysis-smoke: PASS');
