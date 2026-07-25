import assert from 'node:assert/strict';

import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import {
  buildCanonicalInstitutionalUnderwritingScenarioPolicyContract,
} from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis,
  isCanonicalPremiumAcquisitionUnderwritingV1DeterministicAnalysis,
} from '../../api/_lib/premium-acquisition-underwriting-v1-deterministic-analysis.js';

function canonicalPremiumSourceTruth(jobId) {
  const sourceTruth = structuredClone(
    buildInstitutionalGate10ReportFixture(jobId).sourceTruthPackage,
  );
  for (const entry of sourceTruth.support.accepted) {
    entry.artifact_id ||= `${entry.file_id}-artifact`;
    entry.fact_conflicts = [];
    entry.authority_decision.fileId = entry.file_id;
  }

  const appraisal = sourceTruth.support.accepted.find(
    (entry) => entry.canonical_role === 'appraisal_context',
  );
  appraisal.accepted_facts = {
    appraised_value: appraisal.accepted_facts.appraisal_value,
    appraisal_noi: appraisal.accepted_facts.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_facts.stabilized_cap_rate,
  };
  appraisal.accepted_fact_evidence = {
    appraised_value: appraisal.accepted_fact_evidence.appraisal_value,
    appraisal_noi: appraisal.accepted_fact_evidence.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_fact_evidence.stabilized_cap_rate,
  };
  appraisal.authority_decision.acceptedFacts = appraisal.accepted_facts;
  appraisal.authority_decision.acceptedFactEvidence = appraisal.accepted_fact_evidence;

  sourceTruth.core.rent_roll.accepted_facts.unit_mix = [
    {
      label: '1BR',
      count: 32,
      current_rent: 1850,
      market_rent: 2050,
      avg_sqft: 720,
      occupied_count: 30,
      vacant_count: 2,
    },
    {
      label: '2BR',
      count: 32,
      current_rent: 1881.25,
      market_rent: 2425,
      avg_sqft: 940,
    },
  ];
  sourceTruth.support.adjudication_decisions = sourceTruth.support.accepted.map(
    (entry) => entry.authority_decision,
  );
  return sourceTruth;
}

function buildInputs(jobId = 'premium-deterministic-analysis-job') {
  const sourceTruthPackage = canonicalPremiumSourceTruth(jobId);
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-25',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  return { financialIntelligence, underwritingInputContract };
}

const inputs = buildInputs();
const analysis = buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis(inputs);
const byKey = (key) => analysis.receipts.find((receipt) => receipt.calculationKey === key);

assert.equal(
  isCanonicalPremiumAcquisitionUnderwritingV1DeterministicAnalysis(analysis, inputs),
  true,
);
assert.equal(Object.isFrozen(analysis), true);
assert.equal(Object.isFrozen(analysis.receipts[0]), true);
assert.equal(analysis.policy.deterministicMathOnly, true);
assert.equal(analysis.policy.customerSurfaceAuthorized, false);
assert.equal(analysis.policy.rendererEligible, false);
assert.equal(analysis.policy.aggregateOccupancyAllocatedAcrossUnitTypes, false);
assert.equal(analysis.policy.expenseNormalizationPerformed, false);
assert.equal(analysis.policy.refinancingTermsInferred, false);
assert.equal(analysis.policy.currentDebtPromotedToAcquisitionDebt, false);
assert.equal(analysis.integration.connected, false);

assert.equal(byKey('unitTypeRentGap:1br').result, 200);
assert.equal(byKey('unitTypeInPlaceRentPerSquareFoot:1br').result, 2.57);
assert.equal(byKey('unitTypeMarketRentPerSquareFoot:1br').result, 2.85);
assert.equal(byKey('unitTypeOccupiedCount:1br').result, 30);
assert.equal(byKey('unitTypeVacantCount:1br').result, 2);
assert.equal(byKey('unitTypeOccupiedCount:2br'), undefined);
assert.equal(byKey('unitTypeVacantCount:2br'), undefined);
assert.equal(analysis.coverage.explicitUnitTypeOccupancyReceiptCount, 2);

assert.equal(byKey('expenseComposition:property_taxes').result, 0.333333);
assert.equal(byKey('expensePerUnit:property_taxes').result, 2890.63);
assert.equal(byKey('totalOperatingExpensesPerUnit').result, 8671.88);
assert.equal(byKey('proposedAcquisitionDebtYield').result, 0.1);
assert.equal(byKey('proposedLoanToAppraisedValue').result, 0.665493);

const currentDebtService = inputs.financialIntelligence.calculationReceipts.find(
  (receipt) => receipt.calculationKey === 'currentDebtAnnualDebtService',
);
const proposedDebtService = inputs.financialIntelligence.calculationReceipts.find(
  (receipt) => receipt.calculationKey === 'proposedFinancingAnnualDebtService',
);
assert.equal(currentDebtService.result, 471000);
assert.equal(proposedDebtService.eligible, true);
assert.equal(
  byKey('proposedDebtServiceIncrease').result,
  Math.round((proposedDebtService.result - currentDebtService.result) * 100) / 100,
);
assert.equal(
  byKey('proposedDebtServiceIncrease').inputs.currentAnnualDebtService,
  currentDebtService.result,
);
assert.match(
  byKey('proposedDebtServiceIncrease').qualification,
  /debt roles remain distinct/i,
);

assert.equal(byKey('currentDebtDebtInclusiveBreakEvenOccupancy').result, 0.636161);
assert.equal(
  byKey('currentDebtDebtInclusiveBreakEvenOccupancy').inputs.debtRole,
  'currentDebt',
);
assert.equal(
  byKey('proposedAcquisitionDebtDebtInclusiveBreakEvenOccupancy').inputs.debtRole,
  'proposedAcquisitionDebt',
);
assert.match(
  byKey('currentDebtDebtInclusiveBreakEvenOccupancy').qualification,
  /accepted T12 operating expenses/i,
);
assert.equal(
  byKey('currentDebtDebtInclusiveBreakEvenOccupancy').limitationCodes.includes(
    'NO_RENT_GROWTH_OR_EXPENSE_NORMALIZATION_APPLIED',
  ),
  true,
);

assert.equal(
  analysis.receipts.every(
    (receipt) =>
      receipt.customerSurfaceAuthorized === false &&
      receipt.rendererEligible === false &&
      receipt.reportPublicationBlocker === false,
  ),
  true,
);
assert.equal('customerSurfaceModel' in analysis, false);
assert.equal('renderedHtml' in analysis, false);
assert.equal('rawUploads' in analysis, false);

const tamperedContract = structuredClone(inputs.underwritingInputContract);
tamperedContract.source = 'caller_forged_underwriting_input_contract';
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis({
    ...inputs,
    underwritingInputContract: tamperedContract,
  }),
  /CANONICAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED/,
);

const mismatched = buildInputs('different-premium-analysis-job');
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis({
    underwritingInputContract: inputs.underwritingInputContract,
    financialIntelligence: mismatched.financialIntelligence,
  }),
  /UPSTREAM_IDENTITY_MISMATCH/,
);

console.log('premium-acquisition-underwriting-v1 deterministic-analysis smoke passed');
