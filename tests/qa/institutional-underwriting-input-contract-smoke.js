import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
  isCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import {
  buildCanonicalInstitutionalUnderwritingScenarioPolicyContract,
  isCanonicalInstitutionalUnderwritingScenarioPolicyContract,
} from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
  isCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';

function evidence(value, excerpt, normalizedValue = value) {
  return {
    excerpt,
    method: 'deterministic_label_value_binding',
    sourceValue: value,
    normalizedValue,
  };
}

function acceptedSupport({ fileId, filename, role, facts, factEvidence, sectionEligibility = {} }) {
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
      sectionDisplayReady: Object.values(sectionEligibility).some(Boolean),
      canonicalRole: role,
      acceptedFacts: facts,
      acceptedFactEvidence: factEvidence,
    },
  };
}

const purchaseAssumptions = acceptedSupport({
  fileId: 'purchase-file',
  filename: 'Purchase Assumptions.pdf',
  role: 'purchase_assumptions',
  facts: {
    purchase_price: 13500000,
    noi_basis: 945000,
    going_in_cap_rate: 0.07,
    proposed_loan_amount: 9450000,
    ltv: 0.7,
    interest_rate: 0.0595,
    amortization_years: 30,
    loan_term_years: 5,
    lender_fee_percent: 0.0085,
  },
  factEvidence: {
    purchase_price: evidence(13500000, 'Purchase Price $13,500,000'),
    noi_basis: evidence(945000, 'NOI Basis $945,000'),
    going_in_cap_rate: evidence(7, 'Going-In Cap Rate 7.00%', 0.07),
    proposed_loan_amount: evidence(9450000, 'Proposed Loan $9,450,000'),
    ltv: evidence(70, 'LTV 70%', 0.7),
    interest_rate: evidence(5.95, 'Interest Rate 5.95%', 0.0595),
    amortization_years: evidence(30, 'Amortization 30 years'),
    loan_term_years: evidence(5, 'Loan Term 5 years'),
    lender_fee_percent: evidence(0.85, 'Lender Fee 0.85%', 0.0085),
  },
  sectionEligibility: { acquisitionRequest: true, proposedFinancing: true },
});

const currentDebt = acceptedSupport({
  fileId: 'current-debt-file',
  filename: 'Current Debt.pdf',
  role: 'current_debt_context',
  facts: {
    current_outstanding_balance: 6800000,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
    maturity_date: '2029-11-01',
    rate_structure: 'fixed',
  },
  factEvidence: {
    current_outstanding_balance: evidence(6800000, 'Current Outstanding Balance $6,800,000'),
    interest_rate: evidence(4.85, 'Interest Rate 4.85%', 0.0485),
    amortization_remaining_years: evidence(24, 'Amortization Remaining 24 years'),
    monthly_payment: evidence(39250, 'Monthly Payment $39,250'),
    maturity_date: evidence('2029-11-01', 'Maturity Date 2029-11-01'),
    rate_structure: evidence('fixed', 'Fixed interest rate'),
  },
  sectionEligibility: { currentDebt: true },
});

const appraisal = acceptedSupport({
  fileId: 'appraisal-file',
  filename: 'Appraisal.pdf',
  role: 'appraisal_context',
  facts: {
    appraised_value: 14200000,
    appraisal_cap_rate: 0.0665,
    appraisal_noi: 944300,
  },
  factEvidence: {
    appraised_value: evidence(14200000, 'As-Is Appraised Value $14,200,000'),
    appraisal_cap_rate: evidence(6.65, 'Appraisal Capitalization Rate 6.65%', 0.0665),
    appraisal_noi: evidence(944300, 'Appraisal NOI $944,300'),
  },
  sectionEligibility: { valuationContext: true },
});

function buildSourceTruth({ jobId = 'gate-5a-job', supportAccepted } = {}) {
  const accepted = structuredClone(supportAccepted ?? [purchaseAssumptions, currentDebt, appraisal]);
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: jobId,
    property_name: 'Gate 5A Property',
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
          net_operating_income: 945000,
          income_lines: [{ label: 'Effective Gross Income', amount: 1500000 }],
          expense_lines: [{ label: 'Property Taxes', amount: 185000 }],
        },
      },
      rent_roll: {
        status: 'accepted_complete',
        artifact_id: 'rent-roll-artifact',
        file_id: 'rent-roll-file',
        original_filename: 'Rent Roll.xlsx',
        accepted_facts: {
          total_units: 64,
          occupancy: 0.9375,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
          unit_mix: [{ label: 'All Units', count: 64, current_rent: 1865.625, market_rent: 2237.5 }],
          units: [{ unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
        },
      },
    },
    support: {
      accepted,
      advisory: [],
      rejected: [],
      adjudication_decisions: accepted.map((entry) => entry.authority_decision),
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
      rr_annual_in_place: 1432800,
      rr_annual_in_place_source: 'rentRollPayload.total_in_place_annual',
      difference_amount: -285600,
      variance_pct: -0.166201,
      source_reconciliation_disclosure: 'Accepted Rent Roll annual in-place rent differs from accepted T12 Gross Potential Rent.',
      source_selection: {
        t12_gpr: {
          source_path: 't12Payload.gross_potential_rent',
          value: 1718400,
        },
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

function buildGate5A(sourceTruthPackage) {
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-16',
  });
  assert.equal(isCanonicalInstitutionalFinancialIntelligence(financialIntelligence), true);
  const scenarioPolicyContract = buildCanonicalInstitutionalUnderwritingScenarioPolicyContract();
  const inputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract,
  });
  return { financialIntelligence, scenarioPolicyContract, inputContract };
}

const sourceTruthPackage = buildSourceTruth();
const { financialIntelligence, scenarioPolicyContract, inputContract } = buildGate5A(sourceTruthPackage);

assert.equal(isCanonicalInstitutionalUnderwritingScenarioPolicyContract(scenarioPolicyContract), true);
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(inputContract), true);
assert.equal(Object.isFrozen(scenarioPolicyContract), true);
assert.equal(Object.isFrozen(inputContract), true);
assert.equal(Object.isFrozen(inputContract.acceptedInputs.operatingStatement.netOperatingIncome), true);
assert.equal(inputContract.reportPublicationBlocker, false);
assert.equal(inputContract.policy.calculationsPerformed, false);
assert.equal(inputContract.policy.downstreamRenderingAuthorized, false);
assert.equal(inputContract.policy.legacyUnderwritingReuseAllowed, false);
assert.equal(inputContract.policy.callerThresholdsAccepted, false);
assert.equal(inputContract.policy.acquisitionTermsPromotedToRefinancingTerms, false);
assert.equal(inputContract.policy.currentDebtPromotedToFutureRefinancingTerms, false);

assert.equal(inputContract.acceptedInputs.operatingStatement.netOperatingIncome.value, 945000);
assert.equal(inputContract.acceptedInputs.operatingStatement.netOperatingIncome.sourceBacked, true);
assert.equal(inputContract.acceptedInputs.rentRoll.occupancy.value, 0.9375);
assert.equal(inputContract.acceptedInputs.rentRoll.unitMix.sourceBacked, true);
assert.equal(inputContract.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.value, 13500000);
assert.equal(inputContract.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.sourceBacked, true);
assert.equal(inputContract.acceptedInputs.valuation.appraisal.facts.appraised_value.value, 14200000);
assert.equal(inputContract.acceptedInputs.valuation.appraisal.facts.appraised_value.sourceBacked, true);
assert.equal(inputContract.acceptedInputs.valuation.appraisal.facts.appraised_value.provenance.sourceIdentityKey, 'file:appraisal-file');

assert.equal(inputContract.eligibility.sourceCaseOperating.calculationEligible, true);
assert.equal(inputContract.eligibility.rentBridge.calculationEligible, true);
assert.equal(inputContract.eligibility.physicalVacancyPosition.calculationEligible, true);
assert.equal(inputContract.eligibility.acquisitionValuationReference.calculationEligible, true);
assert.equal(inputContract.eligibility.appraisalValuationReference.calculationEligible, true);
assert.equal(inputContract.eligibility.currentDebt.calculationEligible, true);
assert.equal(inputContract.eligibility.proposedAcquisitionDebt.calculationEligible, true);
assert.equal(inputContract.eligibility.coreReconciliation.calculationEligible, true);
assert.equal(inputContract.eligibility.expenseNormalization.inputEligible, true);
assert.equal(inputContract.eligibility.expenseNormalization.policyEligible, false);
assert.equal(inputContract.eligibility.expenseNormalization.calculationEligible, false);

assert.equal(financialIntelligence.contracts.debtServiceInput.proposedFinancing.facts.ltv.value, 0.7);
assert.equal(scenarioPolicyContract.constraintPolicies.maximumLtv.value, null);
assert.equal(scenarioPolicyContract.constraintPolicies.minimumDscr.value, null);
assert.equal(scenarioPolicyContract.constraintPolicies.refinancingInterestRate.value, null);
assert.equal(scenarioPolicyContract.scenarios.bridge.authorized, false);
assert.equal(scenarioPolicyContract.scenarios.exit.authorized, false);
assert.equal(scenarioPolicyContract.scenarios.stress.authorized, false);
assert.equal(inputContract.eligibility.refinanceLtvConstraint.calculationEligible, false);
assert.deepEqual(inputContract.eligibility.refinanceLtvConstraint.missingPolicyFields, ['maximum_ltv']);
assert.equal(inputContract.eligibility.refinanceDscrConstraint.calculationEligible, false);
assert.equal(inputContract.eligibility.returns.calculationEligible, false);
assert.equal(inputContract.eligibility.bridgeScenario.calculationEligible, false);
assert.equal(inputContract.eligibility.exitScenario.calculationEligible, false);
assert.equal(inputContract.eligibility.stressScenario.calculationEligible, false);

const ignoredOverridePolicy = buildCanonicalInstitutionalUnderwritingScenarioPolicyContract({
  maximumLtv: 0.75,
  minimumDscr: 1.2,
  stress: { occupancyRate: 0.8 },
});
assert.deepEqual(ignoredOverridePolicy, scenarioPolicyContract);

const counterfeitPolicy = structuredClone(scenarioPolicyContract);
counterfeitPolicy.constraintPolicies.maximumLtv.value = 0.75;
counterfeitPolicy.constraintPolicies.maximumLtv.policyBacked = true;
counterfeitPolicy.constraintPolicies.maximumLtv.calculationAuthorized = true;
assert.equal(isCanonicalInstitutionalUnderwritingScenarioPolicyContract(counterfeitPolicy), false);

const counterfeitFormulaPolicy = structuredClone(scenarioPolicyContract);
counterfeitFormulaPolicy.formulaRegistry.ltvConstrainedProceeds.formula = 'caller_defined_formula';
assert.equal(isCanonicalInstitutionalUnderwritingScenarioPolicyContract(counterfeitFormulaPolicy), false);

const evidenceMismatchSourceTruth = buildSourceTruth({ jobId: 'gate-5a-evidence-mismatch' });
evidenceMismatchSourceTruth.support.accepted[2].accepted_fact_evidence.appraised_value.normalizedValue = 14100000;
evidenceMismatchSourceTruth.support.accepted[2].authority_decision.acceptedFactEvidence.appraised_value.normalizedValue = 14100000;
const evidenceMismatch = buildGate5A(evidenceMismatchSourceTruth).inputContract;
assert.equal(evidenceMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.factAccepted, true);
assert.equal(evidenceMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.sourceBacked, false);
assert.equal(evidenceMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.value, null);
assert.equal(evidenceMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.sectionDisplayReady, false);
assert.equal(evidenceMismatch.eligibility.appraisalValuationReference.calculationEligible, false);
assert.equal(evidenceMismatch.reportPublicationBlocker, false);

const adjudicationRejectedSourceTruth = buildSourceTruth({ jobId: 'gate-5a-adjudication-rejected' });
adjudicationRejectedSourceTruth.support.accepted[2].authority_decision.sourceBacked = false;
const adjudicationRejected = buildGate5A(adjudicationRejectedSourceTruth).inputContract;
assert.equal(adjudicationRejected.acceptedInputs.valuation.appraisal.facts.appraised_value.factAccepted, true);
assert.equal(adjudicationRejected.acceptedInputs.valuation.appraisal.facts.appraised_value.sourceBacked, false);
assert.equal(adjudicationRejected.acceptedInputs.valuation.appraisal.facts.appraised_value.value, null);
assert.equal(adjudicationRejected.eligibility.appraisalValuationReference.calculationEligible, false);

const decisionMismatchSourceTruth = buildSourceTruth({ jobId: 'gate-5a-decision-mismatch' });
decisionMismatchSourceTruth.support.accepted[2].authority_decision.acceptedFacts = {
  ...decisionMismatchSourceTruth.support.accepted[2].authority_decision.acceptedFacts,
  appraised_value: 14100000,
};
const decisionMismatch = buildGate5A(decisionMismatchSourceTruth).inputContract;
assert.equal(decisionMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.factAccepted, false);
assert.equal(decisionMismatch.acceptedInputs.valuation.appraisal.facts.appraised_value.sourceBacked, false);
assert.equal(decisionMismatch.eligibility.appraisalValuationReference.calculationEligible, false);

const conflictSourceTruth = buildSourceTruth({ jobId: 'gate-5a-narrow-conflict' });
conflictSourceTruth.support.fact_conflicts = [{
  canonical_role: 'purchase_assumptions',
  fact_name: 'purchase_price',
  sources: [
    { file_id: 'purchase-file', value: 13500000 },
    { file_id: 'purchase-file-2', value: 13750000 },
  ],
  decision: 'fact_rejected_role_preserved',
  customer_delivery_blocker: false,
}];
const narrowConflict = buildGate5A(conflictSourceTruth).inputContract;
assert.equal(narrowConflict.acceptedInputs.valuation.purchaseAssumptions.roleAccepted, true);
assert.equal(narrowConflict.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.value, null);
assert.equal(narrowConflict.acceptedInputs.valuation.purchaseAssumptions.facts.purchase_price.evidenceState, 'canonical_fact_conflict');
assert.equal(narrowConflict.eligibility.acquisitionValuationReference.calculationEligible, false);
assert.equal(narrowConflict.eligibility.sourceCaseOperating.calculationEligible, true);
assert.equal(narrowConflict.reportPublicationBlocker, false);

const roleConflictSourceTruth = buildSourceTruth({ jobId: 'gate-5a-role-conflict' });
roleConflictSourceTruth.support.conflicts = ['appraisal-file'];
const roleConflict = buildGate5A(roleConflictSourceTruth).inputContract;
assert.equal(roleConflict.acceptedInputs.valuation.appraisal.sourcePresent, true);
assert.equal(roleConflict.acceptedInputs.valuation.appraisal.roleAccepted, false);
assert.equal(roleConflict.acceptedInputs.valuation.appraisal.conflictState, 'conflicting');
assert.equal(roleConflict.acceptedInputs.valuation.appraisal.facts.appraised_value.value, null);
assert.equal(roleConflict.eligibility.appraisalValuationReference.calculationEligible, false);

const duplicatePrimarySourceTruth = buildSourceTruth({ jobId: 'gate-5a-duplicate-primary' });
duplicatePrimarySourceTruth.support.duplicates = ['appraisal-file'];
const duplicatePrimary = buildGate5A(duplicatePrimarySourceTruth).inputContract;
assert.equal(duplicatePrimary.acceptedInputs.valuation.appraisal.roleAccepted, false);
assert.equal(duplicatePrimary.acceptedInputs.valuation.appraisal.conflictState, 'conflicting');
assert.equal(duplicatePrimary.eligibility.appraisalValuationReference.calculationEligible, false);

const coreOnlySourceTruth = buildSourceTruth({ jobId: 'gate-5a-core-only', supportAccepted: [] });
const coreOnly = buildGate5A(coreOnlySourceTruth).inputContract;
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(coreOnly), true);
assert.equal(coreOnly.eligibility.sourceCaseOperating.calculationEligible, true);
assert.equal(coreOnly.acceptedInputs.valuation.purchaseAssumptions.sourcePresent, false);
assert.equal(coreOnly.eligibility.acquisitionValuationReference.calculationEligible, false);
assert.equal(coreOnly.eligibility.appraisalValuationReference.calculationEligible, false);
assert.equal(coreOnly.eligibility.currentDebt.calculationEligible, false);
assert.equal(coreOnly.eligibility.proposedAcquisitionDebt.calculationEligible, false);
assert.equal(coreOnly.reportPublicationBlocker, false);

const ambiguousSupportSourceTruth = buildSourceTruth({ jobId: 'gate-5a-ambiguous-support', supportAccepted: [] });
ambiguousSupportSourceTruth.support.advisory = [{
  file_id: 'ambiguous-appraisal-file',
  status: 'ambiguous',
  authority_decision: {
    fileId: 'ambiguous-appraisal-file',
    sourcePresent: true,
    roleAccepted: false,
    factAccepted: false,
    sourceBacked: false,
    sectionDisplayReady: false,
    canonicalRole: 'appraisal_context',
  },
}];
ambiguousSupportSourceTruth.support.adjudication_decisions = [
  ambiguousSupportSourceTruth.support.advisory[0].authority_decision,
];
const ambiguousSupport = buildGate5A(ambiguousSupportSourceTruth).inputContract;
assert.equal(ambiguousSupport.acceptedInputs.valuation.appraisal.sourcePresent, true);
assert.equal(ambiguousSupport.acceptedInputs.valuation.appraisal.roleAccepted, false);
assert.equal(ambiguousSupport.acceptedInputs.valuation.appraisal.factAccepted, false);
assert.equal(ambiguousSupport.acceptedInputs.valuation.appraisal.sourceBacked, false);
assert.equal(ambiguousSupport.eligibility.appraisalValuationReference.calculationEligible, false);
assert.equal(ambiguousSupport.eligibility.sourceCaseOperating.calculationEligible, true);
assert.equal(ambiguousSupport.reportPublicationBlocker, false);

const missingMarketRentSourceTruth = buildSourceTruth({ jobId: 'gate-5a-missing-market-rent', supportAccepted: [] });
delete missingMarketRentSourceTruth.core.rent_roll.accepted_facts.annual_market_rent;
const missingMarketRent = buildGate5A(missingMarketRentSourceTruth).inputContract;
assert.equal(missingMarketRent.acceptedInputs.rentRoll.annualMarketRent.value, null);
assert.equal(missingMarketRent.acceptedInputs.rentRoll.annualMarketRent.factAccepted, false);
assert.equal(missingMarketRent.acceptedInputs.rentRoll.annualMarketRent.sourceBacked, false);
assert.equal(missingMarketRent.eligibility.rentBridge.calculationEligible, false);
assert.equal(missingMarketRent.reportPublicationBlocker, false);

const invalidCoreSourceTruth = buildSourceTruth({ jobId: 'gate-5a-invalid-core', supportAccepted: [] });
invalidCoreSourceTruth.core_publishable = false;
invalidCoreSourceTruth.true_blockers = ['CORE_T12_NOT_VALIDATED'];
invalidCoreSourceTruth.core.t12.status = 'rejected';
const invalidCore = buildGate5A(invalidCoreSourceTruth).inputContract;
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(invalidCore), true);
assert.equal(invalidCore.sourceTruthReceipt.corePublishable, false);
assert.equal(invalidCore.eligibility.sourceCaseOperating.calculationEligible, false);
assert.equal(invalidCore.eligibility.rentBridge.calculationEligible, false);
assert.equal(invalidCore.eligibility.physicalVacancyPosition.calculationEligible, false);
assert.equal(invalidCore.reportPublicationBlocker, false);

const zeroSourceTruth = buildSourceTruth({ jobId: 'gate-5a-zero-preservation', supportAccepted: [] });
zeroSourceTruth.core.t12.accepted_facts.total_operating_expenses = 0;
zeroSourceTruth.core.t12.accepted_facts.net_operating_income = 1500000;
zeroSourceTruth.core.rent_roll.accepted_facts.occupancy = 0;
const zeroContract = buildGate5A(zeroSourceTruth).inputContract;
assert.equal(zeroContract.acceptedInputs.operatingStatement.totalOperatingExpenses.value, 0);
assert.equal(zeroContract.acceptedInputs.operatingStatement.totalOperatingExpenses.sourceBacked, true);
assert.equal(zeroContract.acceptedInputs.rentRoll.occupancy.value, 0);
assert.equal(zeroContract.acceptedInputs.rentRoll.occupancy.sourceBacked, true);

assert.throws(
  () => buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage: { source: 'canonical_source_truth_package', schema_version: 1 },
    financialIntelligence,
    scenarioPolicyContract,
  }),
  /COMPLETE_CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_INSTITUTIONAL_UNDERWRITING/
);
assert.throws(
  () => buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence: { source: 'canonical_institutional_financial_intelligence', receiptVersion: 1 },
    scenarioPolicyContract,
  }),
  /COMPLETE_CANONICAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_INSTITUTIONAL_UNDERWRITING/
);
assert.throws(
  () => buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage: buildSourceTruth({ jobId: 'different-job' }),
    financialIntelligence,
    scenarioPolicyContract,
  }),
  /INSTITUTIONAL_UNDERWRITING_UPSTREAM_RECEIPT_IDENTITY_MISMATCH/
);

const counterfeitInput = structuredClone(inputContract);
counterfeitInput.policy.callerThresholdsAccepted = true;
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(counterfeitInput), false);

const missingInputSection = structuredClone(inputContract);
delete missingInputSection.acceptedInputs.operatingStatement.netOperatingIncome;
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(missingInputSection), false);

const misstatedEligibility = structuredClone(inputContract);
misstatedEligibility.eligibility.refinanceLtvConstraint.status = 'eligible';
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(misstatedEligibility), false);

const substitutedGate4Section = structuredClone(inputContract);
substitutedGate4Section.gate4Inputs.debtService.source = 'caller_debt_input';
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(substitutedGate4Section), false);

const ownerSource = readFileSync(new URL('../../api/_lib/institutional-underwriting-input-contract.js', import.meta.url), 'utf8');
const policySource = readFileSync(new URL('../../api/_lib/institutional-underwriting-scenario-policy-contract.js', import.meta.url), 'utf8');
assert.doesNotMatch(ownerSource, /full-underwriting-state|legacy-underwriting/i);
assert.doesNotMatch(policySource, /full-underwriting-state|legacy-underwriting/i);
assert.doesNotMatch(`${ownerSource}\n${policySource}`, /[\u2013\u2014]/);

console.log('institutional-underwriting-input-contract-smoke: PASS');
