import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
  isCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildDeterministicAcquisitionValuationAnalysis,
  isCanonicalDeterministicAcquisitionValuationAnalysis,
} from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function option(options, key, fallback) {
  return hasOwn(options, key) ? options[key] : fallback;
}

function evidence(value, excerpt, normalizedValue = value) {
  return {
    excerpt,
    method: 'deterministic_label_value_binding',
    sourceValue: value,
    normalizedValue,
  };
}

function acceptedSupport({ fileId, filename, role, facts, factEvidence, sectionEligibility }) {
  return {
    file_id: fileId,
    original_filename: filename,
    canonical_role: role,
    artifact_id: `${fileId}-artifact`,
    accepted_facts: facts,
    accepted_fact_evidence: factEvidence,
    fact_conflicts: [],
    section_eligibility: sectionEligibility,
    primary_for_role: true,
    authority_decision: {
      fileId,
      sourcePresent: true,
      roleAccepted: true,
      factAccepted: true,
      sourceBacked: true,
      sectionDisplayReady: true,
      canonicalRole: role,
      acceptedFacts: facts,
      acceptedFactEvidence: factEvidence,
    },
  };
}

function buildPurchaseSupport(options) {
  const purchasePrice = option(options, 'purchasePrice', 13500000);
  const noiBasis = option(options, 'purchaseNoiBasis', 945000);
  const goingInCapRate = option(options, 'goingInCapRate', 0.07);
  const facts = {};
  const factEvidence = {};
  if (purchasePrice !== undefined) {
    facts.purchase_price = purchasePrice;
    factEvidence.purchase_price = options.purchasePriceEvidenceMismatch
      ? evidence(999, 'Purchase Price $999', 999)
      : evidence(purchasePrice, `Purchase Price $${purchasePrice}`);
  }
  if (noiBasis !== undefined) {
    facts.noi_basis = noiBasis;
    factEvidence.noi_basis = evidence(noiBasis, `NOI Basis $${noiBasis}`);
  }
  if (goingInCapRate !== undefined) {
    facts.going_in_cap_rate = goingInCapRate;
    factEvidence.going_in_cap_rate = evidence(
      goingInCapRate * 100,
      `Going-In Cap Rate ${goingInCapRate * 100}%`,
      goingInCapRate
    );
  }
  return acceptedSupport({
    fileId: 'purchase-file',
    filename: 'Purchase Assumptions.pdf',
    role: 'purchase_assumptions',
    facts,
    factEvidence,
    sectionEligibility: { acquisitionRequest: true },
  });
}

function buildAppraisalSupport(options) {
  const appraisedValue = option(options, 'appraisedValue', 14200000);
  const appraisalNoi = option(options, 'appraisalNoi', 944300);
  const appraisalCapRate = option(options, 'appraisalCapRate', 0.0665);
  const facts = {};
  const factEvidence = {};
  if (appraisedValue !== undefined) {
    facts.appraised_value = appraisedValue;
    factEvidence.appraised_value = options.appraisedValueEvidenceMismatch
      ? evidence(100, 'As-Is Appraised Value $100', 100)
      : evidence(appraisedValue, `As-Is Appraised Value $${appraisedValue}`);
  }
  if (appraisalNoi !== undefined) {
    facts.appraisal_noi = appraisalNoi;
    factEvidence.appraisal_noi = evidence(appraisalNoi, `Appraisal NOI $${appraisalNoi}`);
  }
  if (appraisalCapRate !== undefined) {
    facts.appraisal_cap_rate = appraisalCapRate;
    factEvidence.appraisal_cap_rate = evidence(
      appraisalCapRate * 100,
      `Appraisal Capitalization Rate ${appraisalCapRate * 100}%`,
      appraisalCapRate
    );
  }
  return acceptedSupport({
    fileId: 'appraisal-file',
    filename: 'Appraisal.pdf',
    role: 'appraisal_context',
    facts,
    factEvidence,
    sectionEligibility: { valuationContext: true },
  });
}

function buildSourceTruth(options = {}) {
  const t12Noi = option(options, 't12Noi', 945000);
  const totalUnits = option(options, 'totalUnits', 64);
  const accepted = [];
  if (options.includePurchase !== false) accepted.push(buildPurchaseSupport(options));
  if (options.includeAppraisal !== false) accepted.push(buildAppraisalSupport(options));
  const rentRollFacts = {
    occupancy: 0.9375,
    annual_in_place_rent: 1432800,
    annual_market_rent: 1718400,
    unit_mix: [{ label: 'All Units', count: totalUnits ?? 64 }],
    units: [{ unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
  };
  if (totalUnits !== undefined) rentRollFacts.total_units = totalUnits;
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: option(options, 'jobId', 'gate-5c-job'),
    property_name: 'Gate 5C Property',
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
          effective_gross_income: 1500000,
          total_operating_expenses: 555000,
          net_operating_income: t12Noi,
          income_lines: [{ label: 'Effective Gross Income', amount: 1500000 }],
          expense_lines: [{ label: 'Operating Expenses', amount: 555000 }],
        },
      },
      rent_roll: {
        status: 'accepted_complete',
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        original_filename: 'Rent Roll.xlsx',
        accepted_facts: rentRollFacts,
      },
    },
    support: {
      accepted,
      advisory: [],
      rejected: [],
      adjudication_decisions: accepted.map((entry) => entry.authority_decision),
      conflicts: [],
      fact_conflicts: options.factConflicts ?? [],
      duplicates: [],
    },
    section_policy: {},
    disclosures: [],
    source_reconciliation_state: {
      status: 'source_reconciliation_required',
      t12_gpr: 1718400,
      t12_gpr_source: 't12Payload.gross_potential_rent',
      rr_annual_in_place: 1432800,
      rr_annual_in_place_source: 'rentRollPayload.total_in_place_annual',
      difference_amount: -285600,
      variance_pct: -0.166201,
      source_reconciliation_disclosure: 'Accepted Rent Roll annual in-place rent differs from accepted T12 Gross Potential Rent.',
      source_selection: {
        t12_gpr: { source_path: 't12Payload.gross_potential_rent', value: 1718400 },
        rr_annual_in_place: {
          source_path: 'rentRollPayload.total_in_place_annual',
          value: 1432800,
          selected_reason: 'explicit_annual_total',
          confidence: 'high',
        },
      },
    },
  };
}

function buildGate5C(sourceTruthPackage) {
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
  assert.equal(isCanonicalInstitutionalUnderwritingInputContract(underwritingInputContract), true);
  const analysis = buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract });
  return { underwritingInputContract, analysis };
}

function receipt(section, calculationKey) {
  return section.calculations.find((entry) => entry.calculationKey === calculationKey);
}

const { underwritingInputContract, analysis } = buildGate5C(buildSourceTruth());
assert.equal(isCanonicalDeterministicAcquisitionValuationAnalysis(analysis), true);
assert.equal(Object.isFrozen(analysis), true);
assert.equal(Object.isFrozen(analysis.sections.acquisitionReference), true);
assert.equal(Object.isFrozen(analysis.formulaRegistry), true);
assert.equal(analysis.inputReceipt.jobId, 'gate-5c-job');
assert.equal(analysis.inputReceipt.corePublishable, true);
assert.equal(analysis.reportPublicationBlocker, false);
assert.equal(analysis.policy.authorityCreating, false);
assert.equal(analysis.policy.deterministicMathOnly, true);
assert.equal(analysis.policy.acceptedSourceReferencesOnly, true);
assert.equal(analysis.policy.sourceNoiBasesKeptDistinct, true);
assert.equal(analysis.policy.sourceStatedCapRatesReplaced, false);
assert.equal(analysis.policy.appraisalTreatedAsFutureValue, false);
assert.equal(analysis.policy.futureValueCalculated, false);
assert.equal(analysis.policy.downstreamRenderingAuthorized, false);
assert.equal(analysis.policy.screeningBehaviorChanged, false);
assert.equal(analysis.policy.legacyUnderwritingReuseAllowed, false);

const acquisition = analysis.sections.acquisitionReference;
assert.equal(acquisition.analysisStatus, 'calculated');
assert.equal(receipt(acquisition, 'purchasePricePerUnit').result, 210937.5);
assert.equal(receipt(acquisition, 'sourceCaseAcquisitionCapitalizationRate').result, 0.07);
assert.equal(receipt(acquisition, 'purchaseAssumptionCapitalizationRate').result, 0.07);
assert.equal(receipt(acquisition, 'sourceStatedGoingInCapRateDifference').result, 0);
assert.equal(receipt(acquisition, 'sourceCaseNoiLessPurchaseAssumptionNoi').result, 0);
assert.equal(receipt(acquisition, 'sourceCaseCapRateLessPurchaseAssumptionCapRate').result, 0);
assert.equal(
  receipt(acquisition, 'sourceCaseAcquisitionCapitalizationRate').formula,
  'accepted_t12_net_operating_income_divided_by_accepted_purchase_price'
);
assert.deepEqual(
  receipt(acquisition, 'sourceCaseAcquisitionCapitalizationRate').inputProvenance.map((entry) => entry.sourceIdentityKey),
  ['file:t12-file', 'file:purchase-file']
);

const appraisal = analysis.sections.appraisalReference;
assert.equal(appraisal.analysisStatus, 'calculated');
assert.equal(receipt(appraisal, 'appraisedValuePerUnit').result, 221875);
assert.equal(receipt(appraisal, 'appraisalDerivedCapitalizationRate').result, 0.0665);
assert.equal(receipt(appraisal, 'sourceStatedAppraisalCapRateDifference').result, 0);
assert.deepEqual(
  receipt(appraisal, 'appraisalDerivedCapitalizationRate').inputProvenance.map((entry) => entry.sourceIdentityKey),
  ['file:appraisal-file', 'file:appraisal-file']
);

const comparison = analysis.sections.valuationComparison;
assert.equal(comparison.analysisStatus, 'calculated');
assert.equal(receipt(comparison, 'appraisedValueLessPurchasePrice').result, 700000);
assert.equal(receipt(comparison, 'appraisedValueDifferenceRatioToPurchasePrice').result, 0.051852);
assert.equal(receipt(comparison, 'appraisedValueDifferencePerUnit').result, 10937.5);
assert.deepEqual(
  receipt(comparison, 'appraisedValueLessPurchasePrice').inputProvenance.map((entry) => entry.sourceIdentityKey),
  ['file:appraisal-file', 'file:purchase-file']
);
assert.equal(comparison.limitationCodes.includes('NO_MARKET_VALUE_OR_APPRECIATION_CONCLUSION_INFERRED'), true);

assert.equal(analysis.coverage.calculatedSectionCount, 3);
assert.equal(analysis.coverage.totalSectionCount, 3);
assert.equal(analysis.coverage.calculatedMeasureCount, 12);
assert.equal(analysis.coverage.totalMeasureCount, 12);
assert.equal(analysis.coverage.unavailableAnalysisCount, 8);
for (const unavailable of Object.values(analysis.unavailableAnalyses)) {
  assert.equal(unavailable.authorityState, 'not_authorized');
  assert.equal(unavailable.calculationPerformed, false);
  assert.equal(unavailable.value, null);
  assert.equal(unavailable.customerSurfaceAuthorized, false);
  assert.equal(unavailable.reportPublicationBlocker, false);
}

const ignoredCallerOverrides = buildDeterministicAcquisitionValuationAnalysis({
  underwritingInputContract,
  futureValue: 25000000,
  exitCapRate: 0.05,
  appreciationRate: 0.04,
  refinanceProceeds: 12000000,
  recommendation: 'Proceed',
});
assert.deepEqual(ignoredCallerOverrides, analysis);

const tamperedResult = structuredClone(analysis);
tamperedResult.sections.valuationComparison.calculations[0].result = 900000;
assert.equal(isCanonicalDeterministicAcquisitionValuationAnalysis(tamperedResult), false);
const tamperedFormula = structuredClone(analysis);
tamperedFormula.sections.acquisitionReference.calculations[1].formula = 'caller_supplied_formula';
assert.equal(isCanonicalDeterministicAcquisitionValuationAnalysis(tamperedFormula), false);
const tamperedProvenance = structuredClone(analysis);
tamperedProvenance.sections.appraisalReference.calculations[1].inputProvenance = [];
assert.equal(isCanonicalDeterministicAcquisitionValuationAnalysis(tamperedProvenance), false);
assert.throws(
  () => buildDeterministicAcquisitionValuationAnalysis({
    underwritingInputContract: {
      source: 'canonical_institutional_underwriting_input_contract',
      contractVersion: 1,
    },
  }),
  /CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_ACQUISITION_VALUATION_ANALYSIS/
);

const missingGoingIn = buildGate5C(buildSourceTruth({ goingInCapRate: undefined })).analysis;
assert.equal(receipt(missingGoingIn.sections.acquisitionReference, 'sourceStatedGoingInCapRateDifference').result, null);
assert.equal(receipt(missingGoingIn.sections.acquisitionReference, 'purchaseAssumptionCapitalizationRate').result, 0.07);
assert.equal(missingGoingIn.sections.acquisitionReference.reportPublicationBlocker, false);

const missingPurchaseNoi = buildGate5C(buildSourceTruth({ purchaseNoiBasis: undefined })).analysis;
assert.equal(receipt(missingPurchaseNoi.sections.acquisitionReference, 'sourceCaseAcquisitionCapitalizationRate').result, 0.07);
assert.equal(receipt(missingPurchaseNoi.sections.acquisitionReference, 'purchaseAssumptionCapitalizationRate').result, null);
assert.equal(receipt(missingPurchaseNoi.sections.acquisitionReference, 'sourceCaseNoiLessPurchaseAssumptionNoi').result, null);
assert.equal(receipt(missingPurchaseNoi.sections.acquisitionReference, 'sourceCaseCapRateLessPurchaseAssumptionCapRate').result, null);

const missingAppraisalNoiAndCap = buildGate5C(buildSourceTruth({
  appraisalNoi: undefined,
  appraisalCapRate: undefined,
})).analysis;
assert.equal(receipt(missingAppraisalNoiAndCap.sections.appraisalReference, 'appraisedValuePerUnit').result, 221875);
assert.equal(receipt(missingAppraisalNoiAndCap.sections.appraisalReference, 'appraisalDerivedCapitalizationRate').result, null);
assert.equal(receipt(missingAppraisalNoiAndCap.sections.appraisalReference, 'sourceStatedAppraisalCapRateDifference').result, null);
assert.equal(receipt(missingAppraisalNoiAndCap.sections.valuationComparison, 'appraisedValueLessPurchasePrice').result, 700000);

const missingUnits = buildGate5C(buildSourceTruth({ totalUnits: undefined })).analysis;
assert.equal(receipt(missingUnits.sections.acquisitionReference, 'purchasePricePerUnit').result, null);
assert.equal(receipt(missingUnits.sections.appraisalReference, 'appraisedValuePerUnit').result, null);
assert.equal(receipt(missingUnits.sections.valuationComparison, 'appraisedValueDifferencePerUnit').result, null);
assert.equal(receipt(missingUnits.sections.acquisitionReference, 'sourceCaseAcquisitionCapitalizationRate').result, 0.07);
assert.equal(receipt(missingUnits.sections.valuationComparison, 'appraisedValueLessPurchasePrice').result, 700000);

const missingAppraisal = buildGate5C(buildSourceTruth({ includeAppraisal: false })).analysis;
assert.equal(missingAppraisal.sections.acquisitionReference.analysisStatus, 'calculated');
assert.equal(missingAppraisal.sections.appraisalReference.analysisStatus, 'collapsed');
assert.equal(missingAppraisal.sections.valuationComparison.analysisStatus, 'collapsed');
assert.equal(missingAppraisal.reportPublicationBlocker, false);

const missingPurchase = buildGate5C(buildSourceTruth({ includePurchase: false })).analysis;
assert.equal(missingPurchase.sections.acquisitionReference.analysisStatus, 'collapsed');
assert.equal(missingPurchase.sections.appraisalReference.analysisStatus, 'calculated');
assert.equal(missingPurchase.sections.valuationComparison.analysisStatus, 'collapsed');
assert.equal(missingPurchase.reportPublicationBlocker, false);

const purchaseConflict = buildGate5C(buildSourceTruth({
  factConflicts: [{ canonical_role: 'purchase_assumptions', fact_name: 'purchase_price' }],
}));
assert.equal(purchaseConflict.underwritingInputContract.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.value, null);
assert.equal(purchaseConflict.analysis.sections.acquisitionReference.analysisStatus, 'collapsed');
assert.equal(purchaseConflict.analysis.sections.appraisalReference.analysisStatus, 'calculated');
assert.equal(purchaseConflict.analysis.sections.valuationComparison.analysisStatus, 'collapsed');

const appraisalEvidenceMismatch = buildGate5C(buildSourceTruth({ appraisedValueEvidenceMismatch: true }));
assert.equal(appraisalEvidenceMismatch.underwritingInputContract.acceptedInputs.valuation.appraisal.facts.appraised_value.value, null);
assert.equal(appraisalEvidenceMismatch.analysis.sections.appraisalReference.analysisStatus, 'collapsed');
assert.equal(appraisalEvidenceMismatch.analysis.sections.valuationComparison.analysisStatus, 'collapsed');
assert.equal(appraisalEvidenceMismatch.analysis.sections.acquisitionReference.analysisStatus, 'calculated');

const zeroPurchasePrice = buildGate5C(buildSourceTruth({ purchasePrice: 0 }));
assert.equal(zeroPurchasePrice.underwritingInputContract.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.value, null);
assert.equal(zeroPurchasePrice.analysis.sections.acquisitionReference.analysisStatus, 'collapsed');
assert.equal(zeroPurchasePrice.analysis.sections.appraisalReference.analysisStatus, 'calculated');
assert.equal(zeroPurchasePrice.analysis.sections.valuationComparison.analysisStatus, 'collapsed');

const zeroAppraisedValue = buildGate5C(buildSourceTruth({ appraisedValue: 0 }));
assert.equal(zeroAppraisedValue.underwritingInputContract.acceptedInputs.valuation.appraisal.facts.appraised_value.value, null);
assert.equal(zeroAppraisedValue.analysis.sections.acquisitionReference.analysisStatus, 'calculated');
assert.equal(zeroAppraisedValue.analysis.sections.appraisalReference.analysisStatus, 'collapsed');
assert.equal(zeroAppraisedValue.analysis.sections.valuationComparison.analysisStatus, 'collapsed');

const zeroNoi = buildGate5C(buildSourceTruth({
  t12Noi: 0,
  purchaseNoiBasis: 0,
  appraisalNoi: 0,
})).analysis;
assert.equal(receipt(zeroNoi.sections.acquisitionReference, 'sourceCaseAcquisitionCapitalizationRate').result, 0);
assert.equal(receipt(zeroNoi.sections.acquisitionReference, 'purchaseAssumptionCapitalizationRate').result, 0);
assert.equal(receipt(zeroNoi.sections.acquisitionReference, 'sourceStatedGoingInCapRateDifference').result, 0.07);
assert.equal(receipt(zeroNoi.sections.appraisalReference, 'appraisalDerivedCapitalizationRate').result, 0);
assert.equal(receipt(zeroNoi.sections.appraisalReference, 'sourceStatedAppraisalCapRateDifference').result, 0.0665);

const negativeNoi = buildGate5C(buildSourceTruth({
  t12Noi: -135000,
  purchaseNoiBasis: -270000,
  appraisalNoi: -142000,
})).analysis;
assert.equal(receipt(negativeNoi.sections.acquisitionReference, 'sourceCaseAcquisitionCapitalizationRate').result, -0.01);
assert.equal(receipt(negativeNoi.sections.acquisitionReference, 'purchaseAssumptionCapitalizationRate').result, -0.02);
assert.equal(receipt(negativeNoi.sections.appraisalReference, 'appraisalDerivedCapitalizationRate').result, -0.01);
assert.equal(negativeNoi.unavailableAnalyses.riskClassification.value, null);

const negativeValueDifference = buildGate5C(buildSourceTruth({ appraisedValue: 13000000 })).analysis;
assert.equal(receipt(negativeValueDifference.sections.valuationComparison, 'appraisedValueLessPurchasePrice').result, -500000);
assert.equal(receipt(negativeValueDifference.sections.valuationComparison, 'appraisedValueDifferenceRatioToPurchasePrice').result, -0.037037);
assert.equal(receipt(negativeValueDifference.sections.valuationComparison, 'appraisedValueDifferencePerUnit').result, -7812.5);
assert.equal(negativeValueDifference.unavailableAnalyses.marketValueConclusion.value, null);
assert.equal(negativeValueDifference.unavailableAnalyses.recommendation.value, null);

const productionSource = readFileSync(
  new URL('../../api/_lib/deterministic-acquisition-valuation-analysis.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-underwriting-input-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(productionSource.includes('legacy-underwriting'), false);

console.log('deterministic-acquisition-valuation-analysis-smoke: PASS');
