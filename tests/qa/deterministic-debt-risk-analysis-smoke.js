import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCanonicalDebtServiceInputContract } from '../../api/_lib/debt-service-input-contract.js';
import {
  buildDeterministicDebtRiskAnalysis,
  isCanonicalDeterministicDebtRiskAnalysis,
} from '../../api/_lib/deterministic-debt-risk-analysis.js';
import {
  buildCanonicalReportAnalysisContext,
  isCanonicalReportAnalysisContext,
} from '../../api/_lib/report-analysis-context.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const productionSource = [
  fs.readFileSync(path.join(root, 'api/_lib/deterministic-debt-risk-analysis.js'), 'utf8'),
  fs.readFileSync(path.join(root, 'api/_lib/report-analysis-context.js'), 'utf8'),
].join('\n');

function evidence(value, excerpt, normalizedValue = value) {
  return {
    excerpt,
    method: 'deterministic_label_value_binding',
    sourceValue: value,
    normalizedValue,
  };
}

function supportEntry({ role, fileId, facts, factEvidence }) {
  return {
    file_id: fileId,
    canonical_role: role,
    accepted_facts: facts,
    accepted_fact_evidence: factEvidence,
    primary_for_role: true,
  };
}

function sourceTruth({ accepted = [], conflicts = [] } = {}) {
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: 'gate-4d-job',
    core_publishable: true,
    core: {
      t12: {
        status: 'accepted_complete',
        artifact_id: 't12-artifact',
        file_id: 't12-file',
        accepted_facts: { net_operating_income: 600000 },
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
      adjudication_decisions: accepted.map((entry) => ({
        fileId: entry.file_id,
        canonicalRole: entry.canonical_role,
        sourcePresent: true,
      })),
      conflicts,
      duplicates: [],
    },
  };
}

const current = supportEntry({
  role: 'current_debt_context',
  fileId: 'current-file',
  facts: {
    current_outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
    maturity_date: '2029-11-01',
    rate_structure: 'floating',
  },
  factEvidence: {
    current_outstanding_balance: evidence(6800000, 'Current Outstanding Balance $6,800,000'),
    interest_rate: evidence(4.85, 'Interest Rate 4.85%', 0.0485),
    amortization_remaining_years: evidence(24, 'Amortization Remaining 24 years'),
    monthly_payment: evidence(39250, 'Monthly Payment $39,250'),
    maturity_date: evidence('2029-11-01', 'Maturity Date 2029-11-01'),
    rate_structure: evidence('Variable Rate', 'Rate Structure Variable Rate', 'floating'),
  },
});

const proposed = supportEntry({
  role: 'purchase_assumptions',
  fileId: 'proposed-file',
  facts: {
    purchase_price: 13500000,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    loan_term_years: 5,
    lender_fee_percent: 0.0085,
    maturity_date: 'July 15, 2031',
    rate_structure: 'fixed',
  },
  factEvidence: {
    purchase_price: evidence(13500000, 'Purchase Price $13,500,000'),
    proposed_loan_amount: evidence(9450000, 'Proposed Loan Amount $9,450,000'),
    ltv: evidence(70, 'LTV 70%', 0.7),
    interest_rate: evidence(5.95, 'Interest Rate 5.95%', 0.0595),
    amortization_years: evidence(30, 'Amortization 30 years'),
    loan_term_years: evidence(5, 'Loan Term 5 years'),
    lender_fee_percent: evidence(0.85, 'Lender Fee 0.85%', 0.0085),
    maturity_date: evidence('July 15, 2031', 'Maturity Date July 15, 2031'),
    rate_structure: evidence('Fixed Rate', 'Rate Structure Fixed Rate', 'fixed'),
  },
});

function analyze(entries = [current, proposed], asOfDate = '2026-07-16') {
  const debtServiceInputContract = buildCanonicalDebtServiceInputContract({
    sourceTruthPackage: sourceTruth({ accepted: entries }),
  });
  const analysisContext = buildCanonicalReportAnalysisContext({
    jobId: 'gate-4d-job',
    asOfDate,
  });
  return buildDeterministicDebtRiskAnalysis({ debtServiceInputContract, analysisContext });
}

const context = buildCanonicalReportAnalysisContext({ jobId: 'gate-4d-job', asOfDate: '2026-07-16' });
assert.equal(isCanonicalReportAnalysisContext(context), true);
assert.equal(context.policy.systemClockFallbackAllowed, false);
assert.equal(Object.isFrozen(context), true);
assert.throws(
  () => buildCanonicalReportAnalysisContext({ asOfDate: '2026-02-30' }),
  /VALID_CANONICAL_REPORT_AS_OF_DATE_REQUIRED/
);
assert.throws(
  () => buildCanonicalReportAnalysisContext({ asOfDate: '07\/16\/2026' }),
  /VALID_CANONICAL_REPORT_AS_OF_DATE_REQUIRED/
);

const complete = analyze();
assert.equal(isCanonicalDeterministicDebtRiskAnalysis(complete), true);
assert.equal(complete.policy.authorityCreating, false);
assert.equal(complete.policy.thresholdInferenceAllowed, false);
assert.equal(complete.policy.scenarioInferenceAllowed, false);
assert.equal(complete.policy.proposedAcquisitionTermsMayBeReclassifiedAsRefinancing, false);
assert.equal(complete.maturity.currentDebt.analysisStatus, 'assessed');
assert.equal(complete.maturity.currentDebt.daysToMaturity, 1204);
assert.equal(complete.maturity.currentDebt.maturityPosition, 'future');
assert.equal(complete.maturity.currentDebt.riskClassification, null);
assert.equal(complete.maturity.proposedFinancing.normalizedMaturityDate, '2031-07-15');
assert.equal(complete.maturity.proposedFinancing.daysToMaturity, 1825);
assert.equal(complete.rateStructure.currentDebt.rateStructure, 'floating');
assert.equal(complete.rateStructure.currentDebt.exposureState, 'contractual_rate_variability_present');
assert.equal(complete.rateStructure.proposedFinancing.rateStructure, 'fixed');
assert.equal(complete.rateStructure.proposedFinancing.exposureState, 'contractually_fixed_per_accepted_source');
assert.equal(complete.rateStructure.currentDebt.rateShockCalculated, false);
assert.equal(complete.lenderFee.calculationStatus, 'calculated');
assert.equal(complete.lenderFee.lenderFeeDollars, 80325);
assert.equal(complete.lenderFee.feeShareOfPurchasePrice, 0.00595);
assert.equal(complete.lenderFee.riskClassification, null);
assert.equal(complete.refinancingReadiness.refinancingModelEligible, false);
assert.equal(complete.refinancingReadiness.proposedAcquisitionFinancingTreatedAsRefinancing, false);
assert.equal(
  complete.refinancingReadiness.assessmentState,
  'current_maturity_identified_refinancing_terms_not_available'
);
assert.equal(complete.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(complete), true);

const dueToday = analyze([current], '2029-11-01');
assert.equal(dueToday.maturity.currentDebt.daysToMaturity, 0);
assert.equal(dueToday.maturity.currentDebt.maturityPosition, 'due_on_analysis_date');

const matured = analyze([current], '2030-01-01');
assert.equal(matured.maturity.currentDebt.daysToMaturity, -61);
assert.equal(matured.maturity.currentDebt.maturityPosition, 'matured');
assert.equal(matured.maturity.currentDebt.riskClassification, null);

const invalidMaturity = structuredClone(current);
invalidMaturity.accepted_facts.maturity_date = '11/01/2029';
invalidMaturity.accepted_fact_evidence.maturity_date = evidence('11/01/2029', 'Maturity Date 11/01/2029');
const invalidMaturityAnalysis = analyze([invalidMaturity]);
assert.equal(invalidMaturityAnalysis.maturity.currentDebt.analysisStatus, 'not_assessed');
assert.equal(
  invalidMaturityAnalysis.maturity.currentDebt.reasonCode,
  'MATURITY_DATE_PRECISION_OR_FORMAT_NOT_DETERMINISTIC'
);
assert.equal(invalidMaturityAnalysis.maturity.currentDebt.maturityDate, '11/01/2029');
assert.equal(invalidMaturityAnalysis.maturity.currentDebt.daysToMaturity, null);

const noMaturity = structuredClone(current);
delete noMaturity.accepted_facts.maturity_date;
delete noMaturity.accepted_fact_evidence.maturity_date;
const noMaturityAnalysis = analyze([noMaturity]);
assert.equal(noMaturityAnalysis.maturity.currentDebt.analysisStatus, 'not_assessed');
assert.equal(noMaturityAnalysis.maturity.currentDebt.maturityDate, null);
assert.equal(noMaturityAnalysis.maturity.currentDebt.reportPublicationBlocker, false);

const hybrid = structuredClone(current);
hybrid.accepted_facts.rate_structure = 'hybrid';
hybrid.accepted_fact_evidence.rate_structure = evidence(
  'Fixed to Floating Rate',
  'Fixed to Floating Rate',
  'hybrid'
);
const hybridAnalysis = analyze([hybrid]);
assert.equal(hybridAnalysis.rateStructure.currentDebt.rateStructure, 'hybrid');
assert.equal(
  hybridAnalysis.rateStructure.currentDebt.exposureState,
  'contractual_rate_variability_changes_over_term'
);

const noRateStructure = structuredClone(current);
delete noRateStructure.accepted_facts.rate_structure;
delete noRateStructure.accepted_fact_evidence.rate_structure;
const noRateAnalysis = analyze([noRateStructure]);
assert.equal(noRateAnalysis.rateStructure.currentDebt.analysisStatus, 'not_assessed');
assert.equal(noRateAnalysis.rateStructure.currentDebt.rateStructure, null);
assert.equal(noRateAnalysis.rateStructure.currentDebt.riskClassification, null);

const rateEvidenceGap = structuredClone(current);
delete rateEvidenceGap.accepted_fact_evidence.rate_structure;
const rateEvidenceGapAnalysis = analyze([rateEvidenceGap]);
assert.equal(rateEvidenceGapAnalysis.rateStructure.currentDebt.analysisStatus, 'not_assessed');
assert.equal(
  rateEvidenceGapAnalysis.rateStructure.currentDebt.reasonCode,
  'RATE_STRUCTURE_EVIDENCE_NOT_SOURCE_BOUND'
);

const maturityEvidenceGap = structuredClone(current);
delete maturityEvidenceGap.accepted_fact_evidence.maturity_date;
const maturityEvidenceGapAnalysis = analyze([maturityEvidenceGap]);
assert.equal(maturityEvidenceGapAnalysis.maturity.currentDebt.analysisStatus, 'not_assessed');
assert.equal(
  maturityEvidenceGapAnalysis.maturity.currentDebt.reasonCode,
  'MATURITY_DATE_EVIDENCE_NOT_SOURCE_BOUND'
);

const zeroFee = structuredClone(proposed);
zeroFee.accepted_facts.lender_fee_percent = 0;
zeroFee.accepted_fact_evidence.lender_fee_percent = evidence(0, 'Lender Fee 0%');
const zeroFeeAnalysis = analyze([zeroFee]);
assert.equal(zeroFeeAnalysis.lenderFee.calculationStatus, 'calculated');
assert.equal(zeroFeeAnalysis.lenderFee.lenderFeeDollars, 0);
assert.equal(zeroFeeAnalysis.lenderFee.feeShareOfPurchasePrice, 0);

const noFee = structuredClone(proposed);
delete noFee.accepted_facts.lender_fee_percent;
delete noFee.accepted_fact_evidence.lender_fee_percent;
const noFeeAnalysis = analyze([noFee]);
assert.equal(noFeeAnalysis.lenderFee.calculationStatus, 'collapsed');
assert.deepEqual(noFeeAnalysis.lenderFee.missingInputs, ['lender_fee_percent']);
assert.equal(noFeeAnalysis.lenderFee.lenderFeeDollars, null);
assert.equal(noFeeAnalysis.lenderFee.reportPublicationBlocker, false);

const feeEvidenceGap = structuredClone(proposed);
delete feeEvidenceGap.accepted_fact_evidence.lender_fee_percent;
const feeEvidenceGapAnalysis = analyze([feeEvidenceGap]);
assert.equal(feeEvidenceGapAnalysis.lenderFee.calculationStatus, 'collapsed');
assert.deepEqual(feeEvidenceGapAnalysis.lenderFee.missingInputs, []);
assert.deepEqual(feeEvidenceGapAnalysis.lenderFee.evidenceGaps, ['lender_fee_percent']);
assert.equal(feeEvidenceGapAnalysis.lenderFee.lenderFeeDollars, null);

const noPurchasePrice = structuredClone(proposed);
delete noPurchasePrice.accepted_facts.purchase_price;
delete noPurchasePrice.accepted_fact_evidence.purchase_price;
const noPurchasePriceAnalysis = analyze([noPurchasePrice]);
assert.equal(noPurchasePriceAnalysis.lenderFee.lenderFeeDollars, 80325);
assert.equal(noPurchasePriceAnalysis.lenderFee.purchasePrice, null);
assert.equal(noPurchasePriceAnalysis.lenderFee.feeShareOfPurchasePrice, null);

const conflictedContract = buildCanonicalDebtServiceInputContract({
  sourceTruthPackage: sourceTruth({ accepted: [], conflicts: ['current-file'] }),
});
const conflictedAnalysis = buildDeterministicDebtRiskAnalysis({
  debtServiceInputContract: conflictedContract,
  analysisContext: context,
});
assert.equal(conflictedAnalysis.maturity.currentDebt.analysisStatus, 'not_assessed');
assert.equal(conflictedAnalysis.rateStructure.currentDebt.analysisStatus, 'not_assessed');
assert.equal(conflictedAnalysis.reportPublicationBlocker, false);

assert.throws(
  () => buildDeterministicDebtRiskAnalysis({ debtServiceInputContract: { source: 'legacy_fixture_v2' }, analysisContext: context }),
  /CANONICAL_DEBT_SERVICE_INPUT_CONTRACT_REQUIRED_FOR_DEBT_RISK_ANALYSIS/
);
assert.throws(
  () => buildDeterministicDebtRiskAnalysis({
    debtServiceInputContract: buildCanonicalDebtServiceInputContract({ sourceTruthPackage: sourceTruth() }),
    analysisContext: { source: 'legacy_fixture_v2', asOfDate: '2026-07-16' },
  }),
  /CANONICAL_REPORT_ANALYSIS_CONTEXT_REQUIRED_FOR_DEBT_RISK_ANALYSIS/
);

const serialized = JSON.stringify(complete);
assert.doesNotMatch(serialized, /\u2014/);
assert.doesNotMatch(serialized, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /\u2014/);
assert.doesNotMatch(productionSource, /\b(?:artificial intelligence|language model|prompt|parser|AI)\b/i);
assert.doesNotMatch(productionSource, /full-underwriting-state|legacy_fixture|filename|rawSourceText/);

console.log('deterministic-debt-risk-analysis-smoke: PASS');
