import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCanonicalDebtServiceInputContract } from '../../api/_lib/debt-service-input-contract.js';
import {
  buildDeterministicDscrAnalysis,
  isCanonicalDeterministicDscrAnalysis,
} from '../../api/_lib/deterministic-dscr-analysis.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = fs.readFileSync(path.join(root, 'api/_lib/deterministic-dscr-analysis.js'), 'utf8');

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
    job_id: 'gate-4c-job',
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

function analyze(sourceTruthPackage, extra = {}) {
  const debtServiceInputContract = buildCanonicalDebtServiceInputContract({ sourceTruthPackage });
  return buildDeterministicDscrAnalysis({ debtServiceInputContract, ...extra });
}

const proposed = supportEntry({
  role: 'purchase_assumptions',
  fileId: 'proposed-file',
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
const current = supportEntry({
  role: 'current_debt_context',
  fileId: 'current-file',
  facts: { monthly_payment: 5850 },
  factEvidence: { monthly_payment: evidence(5850, 'Monthly Payment: $5,850') },
});

const completeAnalysis = analyze(sourceTruth({ accepted: [proposed, current] }));
assert.equal(isCanonicalDeterministicDscrAnalysis(completeAnalysis), true);
assert.equal(completeAnalysis.currentDebt.calculationStatus, 'calculated');
assert.equal(completeAnalysis.currentDebt.ratio, 8.547009);
assert.equal(completeAnalysis.currentDebt.displayRatio, 8.55);
assert.equal(completeAnalysis.currentDebt.modeledDebtService, false);
assert.equal(completeAnalysis.currentDebt.qualificationRequired, false);
assert.equal(completeAnalysis.proposedFinancing.calculationStatus, 'calculated');
assert.equal(completeAnalysis.proposedFinancing.ratio, 0.887247);
assert.equal(completeAnalysis.proposedFinancing.displayRatio, 0.89);
assert.equal(completeAnalysis.proposedFinancing.modeledDebtService, true);
assert.equal(completeAnalysis.proposedFinancing.qualificationRequired, true);
assert.equal(completeAnalysis.proposedFinancing.qualificationCode, 'MODELED_DEBT_SERVICE_DSCR');
assert.equal(completeAnalysis.proposedFinancing.minimumRequirement, null);
assert.equal(completeAnalysis.proposedFinancing.thresholdClassification, null);
assert.equal(completeAnalysis.proposedFinancing.covenantComparisonPerformed, false);
assert.equal(completeAnalysis.proposedFinancing.reportPublicationBlocker, false);
assert.equal(completeAnalysis.proposedFinancing.numeratorReceipt.factPath, 'core.t12.accepted_facts.net_operating_income');
assert.equal(completeAnalysis.proposedFinancing.denominatorReceipt.inputReceipts.length, 3);
assert.equal(Object.isFrozen(completeAnalysis), true);

for (const scenarioKey of ['bridge', 'exit', 'stress']) {
  const scenario = completeAnalysis.scenarios[scenarioKey];
  assert.equal(scenario.calculationStatus, 'not_calculated');
  assert.equal(scenario.ratio, null);
  assert.equal(scenario.eligibilityState, 'ineligible_canonical_scenario_contract_not_available');
  assert.equal(scenario.reportPublicationBlocker, false);
}
assert.deepEqual(completeAnalysis.coverage.scenarioRolesCalculated, []);
assert.equal(completeAnalysis.policy.scenarioInferenceAllowed, false);
assert.equal(completeAnalysis.policy.baseCaseReuseAsScenarioAllowed, false);
assert.equal(completeAnalysis.policy.covenantThresholdInferenceAllowed, false);

const arbitraryScenarioAttempt = analyze(sourceTruth({ accepted: [proposed] }), {
  bridgeInputs: { scenario_net_operating_income: 999999999, scenario_annual_debt_service: 1 },
});
assert.equal(arbitraryScenarioAttempt.scenarios.bridge.ratio, null);
assert.equal(arbitraryScenarioAttempt.scenarios.bridge.calculationStatus, 'not_calculated');

const missingNoiAnalysis = analyze(sourceTruth({ noi: null, accepted: [proposed] }));
assert.equal(missingNoiAnalysis.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(missingNoiAnalysis.proposedFinancing.reasonCode, 'CANONICAL_T12_NOI_NOT_ELIGIBLE');
assert.equal(missingNoiAnalysis.proposedFinancing.annualNetOperatingIncome, null);
assert.equal(missingNoiAnalysis.proposedFinancing.annualDebtService, 676249.2);
assert.equal(missingNoiAnalysis.proposedFinancing.denominatorReceipt.selectedMethod, 'deterministic_amortization_model');
assert.equal(missingNoiAnalysis.proposedFinancing.ratio, null);
assert.equal(missingNoiAnalysis.proposedFinancing.reportPublicationBlocker, false);

const zeroNoiAnalysis = analyze(sourceTruth({ noi: 0, accepted: [proposed] }));
assert.equal(zeroNoiAnalysis.proposedFinancing.calculationStatus, 'calculated');
assert.equal(zeroNoiAnalysis.proposedFinancing.ratio, 0);
assert.equal(zeroNoiAnalysis.proposedFinancing.displayRatio, 0);

const negativeNoiAnalysis = analyze(sourceTruth({ noi: -100000, accepted: [proposed] }));
assert.equal(negativeNoiAnalysis.proposedFinancing.calculationStatus, 'calculated');
assert.equal(negativeNoiAnalysis.proposedFinancing.ratio, -0.147874);
assert.equal(negativeNoiAnalysis.proposedFinancing.displayRatio, -0.15);

const incompleteProposed = structuredClone(proposed);
delete incompleteProposed.accepted_facts.amortization_years;
delete incompleteProposed.accepted_fact_evidence.amortization_years;
const incompleteAnalysis = analyze(sourceTruth({ accepted: [incompleteProposed] }));
assert.equal(incompleteAnalysis.proposedFinancing.calculationStatus, 'collapsed');
assert.equal(incompleteAnalysis.proposedFinancing.annualNetOperatingIncome, 600000);
assert.equal(incompleteAnalysis.proposedFinancing.annualDebtService, null);
assert.deepEqual(incompleteAnalysis.proposedFinancing.missingInputs, ['amortization_years']);
assert.equal(incompleteAnalysis.proposedFinancing.ratio, null);
assert.equal(incompleteAnalysis.proposedFinancing.reportPublicationBlocker, false);

const evidenceGapProposed = structuredClone(proposed);
delete evidenceGapProposed.accepted_fact_evidence.interest_rate;
const evidenceGapAnalysis = analyze(sourceTruth({ accepted: [evidenceGapProposed] }));
assert.equal(evidenceGapAnalysis.proposedFinancing.calculationStatus, 'collapsed');
assert.deepEqual(evidenceGapAnalysis.proposedFinancing.evidenceGaps, ['interest_rate']);
assert.equal(evidenceGapAnalysis.proposedFinancing.ratio, null);

const conflictAnalysis = analyze(sourceTruth({
  accepted: [current],
  decisions: [{ fileId: 'current-file', canonicalRole: 'current_debt_context', sourcePresent: true }],
  conflicts: ['current-file'],
}));
assert.equal(conflictAnalysis.currentDebt.calculationStatus, 'collapsed');
assert.equal(conflictAnalysis.currentDebt.ratio, null);
assert.equal(conflictAnalysis.currentDebt.reportPublicationBlocker, false);

assert.throws(
  () => buildDeterministicDscrAnalysis({ debtServiceInputContract: { source: 'legacy_fixture_v2' } }),
  /CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED_FOR_DSCR/
);

const serialized = JSON.stringify(completeAnalysis);
assert.doesNotMatch(serialized, /\u2014/);
assert.doesNotMatch(serialized, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /\u2014/);
assert.doesNotMatch(productionSource, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /full-underwriting-state|legacy_fixture|filename|rawSourceText/);

console.log('deterministic-dscr-analysis-smoke: PASS');
