import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCanonicalDebtServiceInputContract,
  isCanonicalDebtServiceInputContract,
} from '../../api/_lib/debt-service-input-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = fs.readFileSync(path.join(root, 'api/_lib/debt-service-input-contract.js'), 'utf8');

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
    job_id: 'gate-4a-job',
    core_publishable: true,
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

const completeProposedContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [proposed] }),
});
assert.equal(isCanonicalDebtServiceInputContract(completeProposedContract), true);
assert.equal(completeProposedContract.policy.authorityCreating, false);
assert.equal(completeProposedContract.policy.calculationsPerformed, false);
assert.equal(completeProposedContract.proposedFinancing.dscrEligibility.eligible, true);
assert.equal(
  completeProposedContract.proposedFinancing.dscrEligibility.selectedDebtServiceMethod,
  'deterministic_amortization_model'
);
assert.equal(completeProposedContract.proposedFinancing.facts.proposed_loan_amount.value, 9450000);
assert.equal(completeProposedContract.proposedFinancing.facts.interest_rate.sourceBacked, true);
assert.equal(completeProposedContract.proposedFinancing.facts.lender_fee_percent.factAccepted, true);
assert.equal(completeProposedContract.proposedFinancing.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(completeProposedContract), true);

const incompleteProposed = structuredClone(proposed);
delete incompleteProposed.accepted_facts.amortization_years;
delete incompleteProposed.accepted_fact_evidence.amortization_years;
const incompleteContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [incompleteProposed] }),
});
assert.equal(incompleteContract.proposedFinancing.dscrEligibility.eligible, false);
assert.equal(incompleteContract.proposedFinancing.facts.amortization_years.value, null);
assert.deepEqual(incompleteContract.proposedFinancing.dscrEligibility.missingInputs, ['amortization_years']);
assert.equal(incompleteContract.proposedFinancing.sectionStatus, 'collapse_incomplete_fact_bundle');
assert.equal(incompleteContract.proposedFinancing.reportPublicationBlocker, false);

const evidenceGapProposed = structuredClone(proposed);
delete evidenceGapProposed.accepted_fact_evidence.interest_rate;
const evidenceGapContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [evidenceGapProposed] }),
});
assert.equal(evidenceGapContract.proposedFinancing.facts.interest_rate.factAccepted, true);
assert.equal(evidenceGapContract.proposedFinancing.facts.interest_rate.sourceBacked, false);
assert.equal(evidenceGapContract.proposedFinancing.dscrEligibility.eligible, false);
assert.deepEqual(
  evidenceGapContract.proposedFinancing.debtServiceBundles[0].evidenceGaps,
  ['interest_rate']
);

const currentDebtStated = supportEntry({
  role: 'current_debt_context',
  fileId: 'current-debt-file',
  facts: { monthly_payment: 5850 },
  factEvidence: { monthly_payment: evidence(5850, 'Monthly Payment: $5,850') },
});
const statedCurrentContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [currentDebtStated] }),
});
assert.equal(statedCurrentContract.currentDebt.debtServiceBundles[0].eligibleForDeterministicCalculation, true);
assert.equal(statedCurrentContract.currentDebt.debtServiceBundles[1].eligibleForDeterministicCalculation, false);
assert.equal(statedCurrentContract.currentDebt.dscrEligibility.eligible, true);
assert.equal(statedCurrentContract.currentDebt.dscrEligibility.selectedDebtServiceMethod, 'source_stated_monthly_payment');

const currentDebtModeled = supportEntry({
  role: 'current_debt_context',
  fileId: 'modeled-current-debt-file',
  facts: {
    current_outstanding_balance: 5000000,
    interest_rate: 0.0525,
    amortization_remaining_years: 20,
  },
  factEvidence: {
    current_outstanding_balance: evidence(5000000, 'Outstanding Balance: $5,000,000'),
    interest_rate: evidence(5.25, 'Interest Rate: 5.25%', 0.0525),
    amortization_remaining_years: evidence(20, 'Amortization Remaining: 20 years'),
  },
});
const modeledCurrentContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [currentDebtModeled] }),
});
assert.equal(modeledCurrentContract.currentDebt.debtServiceBundles[1].eligibleForDeterministicCalculation, true);
assert.equal(modeledCurrentContract.currentDebt.dscrEligibility.eligible, true);
assert.equal(modeledCurrentContract.currentDebt.dscrEligibility.selectedDebtServiceMethod, 'deterministic_amortization_model');

const noNoiContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ noi: null, accepted: [proposed] }),
});
assert.equal(noNoiContract.proposedFinancing.debtServiceBundles[0].eligibleForDeterministicCalculation, true);
assert.equal(noNoiContract.proposedFinancing.dscrEligibility.eligible, false);
assert.equal(noNoiContract.proposedFinancing.sectionStatus, 'qualify_missing_canonical_noi');

const conflictDecision = {
  fileId: 'conflicted-debt-file',
  canonicalRole: 'current_debt_context',
  sourcePresent: true,
};
const conflictContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({
    decisions: [conflictDecision],
    conflicts: ['conflicted-debt-file'],
  }),
});
assert.equal(conflictContract.currentDebt.sourcePresent, true);
assert.equal(conflictContract.currentDebt.roleAccepted, false);
assert.equal(conflictContract.currentDebt.sourceBacked, false);
assert.equal(conflictContract.currentDebt.conflictState, 'conflicting');
assert.equal(conflictContract.currentDebt.sectionStatus, 'collapse_conflicting_authority');
assert.equal(conflictContract.currentDebt.reportPublicationBlocker, false);

const duplicateDecision = {
  fileId: 'duplicate-proposed-file',
  canonicalRole: 'purchase_assumptions',
  sourcePresent: true,
};
const duplicateContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({
    accepted: [proposed],
    decisions: [duplicateDecision],
    duplicates: ['duplicate-proposed-file'],
  }),
});
assert.equal(duplicateContract.proposedFinancing.dscrEligibility.eligible, true);
assert.deepEqual(duplicateContract.proposedFinancing.duplicateFileIds, ['duplicate-proposed-file']);
assert.equal(duplicateContract.proposedFinancing.conflictState, 'none');

const crossRoleEntry = supportEntry({
  role: 'current_debt_context',
  fileId: 'cross-role-file',
  facts: {
    proposed_loan_amount: 9450000,
    interest_rate: 0.0595,
    amortization_years: 30,
  },
  factEvidence: {
    proposed_loan_amount: evidence(9450000, 'Proposed Loan: $9,450,000'),
    interest_rate: evidence(5.95, 'Interest Rate: 5.95%', 0.0595),
    amortization_years: evidence(30, 'Amortization: 30 years'),
  },
});
const crossRoleContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [crossRoleEntry] }),
});
assert.equal(crossRoleContract.currentDebt.facts.current_outstanding_balance.value, null);
assert.equal(crossRoleContract.currentDebt.dscrEligibility.eligible, false);
assert.equal(crossRoleContract.proposedFinancing.sourcePresent, false);

const noPrimaryContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [{ ...currentDebtStated, primary_for_role: false }] }),
});
assert.equal(noPrimaryContract.currentDebt.roleAccepted, true);
assert.equal(noPrimaryContract.currentDebt.primaryAccepted, false);
assert.equal(noPrimaryContract.currentDebt.facts.monthly_payment.value, null);
assert.equal(noPrimaryContract.currentDebt.dscrEligibility.eligible, false);

const zeroPrincipal = structuredClone(proposed);
zeroPrincipal.accepted_facts.proposed_loan_amount = 0;
zeroPrincipal.accepted_fact_evidence.proposed_loan_amount = evidence(0, 'Proposed Loan: $0');
const zeroContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [zeroPrincipal] }),
});
assert.equal(zeroContract.proposedFinancing.facts.proposed_loan_amount.value, null);
assert.equal(zeroContract.proposedFinancing.dscrEligibility.eligible, false);

assert.throws(
  () => buildCanonicalDebtServiceInputContract({ sourceTruthPackage: { source: 'legacy_fixture_v2' } }),
  /CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_DEBT_SERVICE_INPUT_CONTRACT/
);

const serialized = JSON.stringify(completeProposedContract);
assert.doesNotMatch(serialized, /annual_debt_service|monthly_debt_service|dscr_result|calculated_payment/i);
assert.doesNotMatch(productionSource, /full-underwriting-state|legacy_fixture|parser|filename|rawSourceText/);

console.log('debt-service-input-contract-smoke: PASS');
