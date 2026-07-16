import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCanonicalDebtServiceInputContract } from '../../api/_lib/debt-service-input-contract.js';
import {
  buildDeterministicDebtServiceCalculation,
  isCanonicalDeterministicDebtServiceCalculation,
} from '../../api/_lib/deterministic-debt-service-calculation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = fs.readFileSync(
  path.join(root, 'api/_lib/deterministic-debt-service-calculation.js'),
  'utf8'
);

function evidence(value, excerpt, normalizedValue = value) {
  return {
    excerpt,
    method: 'deterministic_label_value_binding',
    sourceValue: value,
    normalizedValue,
  };
}

function supportEntry({ role, fileId, facts, factEvidence, primary = true }) {
  return {
    file_id: fileId,
    canonical_role: role,
    accepted_facts: facts,
    accepted_fact_evidence: factEvidence,
    primary_for_role: primary,
  };
}

function sourceTruth({ noi = 600000, accepted = [], decisions = [], conflicts = [], duplicates = [] } = {}) {
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: 'gate-4b-job',
    core_publishable: noi !== null,
    core: {
      t12: noi === null
        ? null
        : {
            status: 'accepted_complete',
            artifact_id: 't12-artifact',
            file_id: 't12-file',
            accepted_facts: { net_operating_income: noi },
          },
      rent_roll: {
        status: 'accepted_complete',
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        accepted_facts: { total_units: 100 },
      },
    },
    support: {
      accepted,
      advisory: [],
      adjudication_decisions: decisions,
      conflicts,
      duplicates,
    },
  };
}

function calculate(sourceTruthPackage) {
  const debtServiceInputContract = buildCanonicalDebtServiceInputContract({ sourceTruthPackage });
  return buildDeterministicDebtServiceCalculation({ debtServiceInputContract });
}

const proposed = supportEntry({
  role: 'purchase_assumptions',
  fileId: 'proposed-file',
  facts: {
    purchase_price: 13500000,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    lender_fee_percent: 0.0085,
  },
  factEvidence: {
    purchase_price: evidence(13500000, 'Purchase Price: $13,500,000'),
    proposed_loan_amount: evidence(9450000, 'Proposed Loan: $9,450,000'),
    ltv: evidence(70, 'LTV: 70%', 0.7),
    interest_rate: evidence(5.95, 'Interest Rate: 5.95%', 0.0595),
    amortization_years: evidence(30, 'Amortization: 30 years'),
    lender_fee_percent: evidence(0.85, 'Lender Fee: 0.85%', 0.0085),
  },
});

const proposedCalculation = calculate(sourceTruth({ accepted: [proposed] }));
assert.equal(isCanonicalDeterministicDebtServiceCalculation(proposedCalculation), true);
assert.equal(proposedCalculation.proposedFinancing.calculationStatus, 'calculated');
assert.equal(proposedCalculation.proposedFinancing.selectedMethod, 'deterministic_amortization_model');
assert.equal(proposedCalculation.proposedFinancing.monthlyDebtService, 56354.1);
assert.equal(proposedCalculation.proposedFinancing.annualDebtService, 676249.2);
assert.equal(proposedCalculation.proposedFinancing.modeledDebtService, true);
assert.equal(proposedCalculation.proposedFinancing.sourceStatedMonthlyDebtService, false);
assert.equal(proposedCalculation.proposedFinancing.qualificationRequired, true);
assert.equal(proposedCalculation.proposedFinancing.reportPublicationBlocker, false);
assert.equal(proposedCalculation.policy.customerFacingCopyProduced, false);
assert.equal(Object.isFrozen(proposedCalculation), true);

const statedAndModeledCurrent = supportEntry({
  role: 'current_debt_context',
  fileId: 'current-debt-file',
  facts: {
    current_outstanding_balance: 5000000,
    interest_rate: 0.0525,
    amortization_remaining_years: 20,
    monthly_payment: 5850,
    maturity_date: '2031-06-30',
  },
  factEvidence: {
    current_outstanding_balance: evidence(5000000, 'Outstanding Balance: $5,000,000'),
    interest_rate: evidence(5.25, 'Interest Rate: 5.25%', 0.0525),
    amortization_remaining_years: evidence(20, 'Amortization Remaining: 20 years'),
    monthly_payment: evidence(5850, 'Monthly Payment: $5,850'),
    maturity_date: evidence('2031-06-30', 'Maturity Date: 2031-06-30'),
  },
});
const statedCalculation = calculate(sourceTruth({ accepted: [statedAndModeledCurrent] }));
assert.equal(statedCalculation.currentDebt.calculationStatus, 'calculated');
assert.equal(statedCalculation.currentDebt.selectedMethod, 'source_stated_monthly_payment');
assert.equal(statedCalculation.currentDebt.monthlyDebtService, 5850);
assert.equal(statedCalculation.currentDebt.annualDebtService, 70200);
assert.equal(statedCalculation.currentDebt.sourceStatedMonthlyDebtService, true);
assert.equal(statedCalculation.currentDebt.modeledDebtService, false);

const modeledCurrent = structuredClone(statedAndModeledCurrent);
delete modeledCurrent.accepted_facts.monthly_payment;
delete modeledCurrent.accepted_fact_evidence.monthly_payment;
const modeledCurrentCalculation = calculate(sourceTruth({ accepted: [modeledCurrent] }));
assert.equal(modeledCurrentCalculation.currentDebt.selectedMethod, 'deterministic_amortization_model');
assert.equal(modeledCurrentCalculation.currentDebt.monthlyDebtService, 33692.21);
assert.equal(modeledCurrentCalculation.currentDebt.annualDebtService, 404306.52);
assert.equal(modeledCurrentCalculation.currentDebt.qualificationCode, 'MODELED_DEBT_SERVICE_CALCULATION');

const zeroRateProposed = structuredClone(proposed);
zeroRateProposed.accepted_facts.proposed_loan_amount = 1200000;
zeroRateProposed.accepted_facts.interest_rate = 0;
zeroRateProposed.accepted_facts.amortization_years = 10;
zeroRateProposed.accepted_fact_evidence.proposed_loan_amount = evidence(1200000, 'Proposed Loan: $1,200,000');
zeroRateProposed.accepted_fact_evidence.interest_rate = evidence(0, 'Interest Rate: 0%', 0);
zeroRateProposed.accepted_fact_evidence.amortization_years = evidence(10, 'Amortization: 10 years');
const zeroRateCalculation = calculate(sourceTruth({ accepted: [zeroRateProposed] }));
assert.equal(zeroRateCalculation.proposedFinancing.monthlyDebtService, 10000);
assert.equal(zeroRateCalculation.proposedFinancing.annualDebtService, 120000);

const nearZeroRateProposed = structuredClone(zeroRateProposed);
nearZeroRateProposed.accepted_facts.interest_rate = 1e-12;
nearZeroRateProposed.accepted_fact_evidence.interest_rate = evidence(1e-12, 'Interest Rate: 0.0000000001%', 1e-12);
const nearZeroRateCalculation = calculate(sourceTruth({ accepted: [nearZeroRateProposed] }));
assert.equal(nearZeroRateCalculation.proposedFinancing.calculationStatus, 'calculated');
assert.equal(nearZeroRateCalculation.proposedFinancing.monthlyDebtService, 10000);
assert.equal(nearZeroRateCalculation.proposedFinancing.annualDebtService, 120000);

const incompleteProposed = structuredClone(proposed);
delete incompleteProposed.accepted_facts.amortization_years;
delete incompleteProposed.accepted_fact_evidence.amortization_years;
const incompleteCalculation = calculate(sourceTruth({ accepted: [incompleteProposed] }));
assert.equal(incompleteCalculation.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(incompleteCalculation.proposedFinancing.reasonCode, 'DEBT_SERVICE_INPUT_BUNDLE_NOT_ELIGIBLE');
assert.equal(incompleteCalculation.proposedFinancing.monthlyDebtService, null);
assert.equal(incompleteCalculation.proposedFinancing.annualDebtService, null);
assert.equal(incompleteCalculation.proposedFinancing.reportPublicationBlocker, false);

const evidenceGapProposed = structuredClone(proposed);
delete evidenceGapProposed.accepted_fact_evidence.interest_rate;
const evidenceGapCalculation = calculate(sourceTruth({ accepted: [evidenceGapProposed] }));
assert.equal(evidenceGapCalculation.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(evidenceGapCalculation.proposedFinancing.monthlyDebtService, null);

const fractionalPeriodProposed = structuredClone(proposed);
fractionalPeriodProposed.accepted_facts.amortization_years = 20.123;
fractionalPeriodProposed.accepted_fact_evidence.amortization_years = evidence(20.123, 'Amortization: 20.123 years');
const fractionalPeriodCalculation = calculate(sourceTruth({ accepted: [fractionalPeriodProposed] }));
assert.equal(fractionalPeriodCalculation.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(
  fractionalPeriodCalculation.proposedFinancing.reasonCode,
  'MODELED_AMORTIZATION_PERIOD_COUNT_NOT_WHOLE'
);
assert.equal(fractionalPeriodCalculation.proposedFinancing.monthlyDebtService, null);

const unsafePeriodProposed = structuredClone(proposed);
unsafePeriodProposed.accepted_facts.amortization_years = Number.MAX_SAFE_INTEGER;
unsafePeriodProposed.accepted_fact_evidence.amortization_years = evidence(
  Number.MAX_SAFE_INTEGER,
  `Amortization: ${Number.MAX_SAFE_INTEGER} years`
);
const unsafePeriodCalculation = calculate(sourceTruth({ accepted: [unsafePeriodProposed] }));
assert.equal(unsafePeriodCalculation.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(
  unsafePeriodCalculation.proposedFinancing.reasonCode,
  'MODELED_AMORTIZATION_PERIOD_COUNT_NOT_WHOLE'
);

const noNoiCalculation = calculate(sourceTruth({ noi: null, accepted: [proposed] }));
assert.equal(noNoiCalculation.proposedFinancing.calculationStatus, 'calculated');
assert.equal(noNoiCalculation.proposedFinancing.annualDebtService, 676249.2);

const conflictCalculation = calculate(sourceTruth({
  accepted: [statedAndModeledCurrent],
  decisions: [{ fileId: 'current-debt-file', canonicalRole: 'current_debt_context', sourcePresent: true }],
  conflicts: ['current-debt-file'],
}));
assert.equal(conflictCalculation.currentDebt.calculationStatus, 'collapsed');
assert.equal(conflictCalculation.currentDebt.monthlyDebtService, null);
assert.equal(conflictCalculation.currentDebt.reportPublicationBlocker, false);

assert.throws(
  () => buildDeterministicDebtServiceCalculation({ debtServiceInputContract: { source: 'legacy_fixture_v2' } }),
  /CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED/
);

const serialized = JSON.stringify(proposedCalculation);
assert.doesNotMatch(serialized, /\bdscr\b/i);
assert.doesNotMatch(serialized, /\u2014/);
assert.doesNotMatch(serialized, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /\u2014/);
assert.doesNotMatch(productionSource, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /full-underwriting-state|legacy_fixture|filename|rawSourceText/);

console.log('deterministic-debt-service-calculation-smoke: PASS');
