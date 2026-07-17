import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import { buildCanonicalInstitutionalUnderwritingInputContract } from '../../api/_lib/institutional-underwriting-input-contract.js';
import { buildDeterministicSourceCaseUnderwritingAnalysis } from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import { buildDeterministicAcquisitionValuationAnalysis } from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import { buildDeterministicAcquisitionCapitalStructureAnalysis } from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import {
  buildCanonicalInstitutionalUnderwritingReturnReadinessContract,
  isCanonicalInstitutionalUnderwritingReturnReadinessContract,
} from '../../api/_lib/institutional-underwriting-return-readiness-contract.js';
import { adjudicateSupportDocumentAuthority } from '../../api/_lib/support-document-authority-adjudicator.js';

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

function acceptedSupport({
  fileId,
  filename,
  role,
  facts,
  factEvidence,
  returnInputFacts = {},
  returnInputFactEvidence = {},
  sectionEligibility,
}) {
  const returnInputSourceBacked = Object.keys(returnInputFacts).length > 0;
  return {
    file_id: fileId,
    original_filename: filename,
    canonical_role: role,
    artifact_id: `${fileId}-artifact`,
    accepted_facts: facts,
    accepted_fact_evidence: factEvidence,
    accepted_return_input_facts: returnInputFacts,
    accepted_return_input_fact_evidence: returnInputFactEvidence,
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
      acceptedReturnInputFacts: returnInputFacts,
      acceptedReturnInputFactEvidence: returnInputFactEvidence,
      returnInputSourceBacked,
    },
  };
}

function buildPurchaseSupport(options) {
  const values = {
    purchase_price: option(options, 'purchasePrice', 13500000),
    proposed_loan_amount: option(options, 'proposedLoanAmount', 9450000),
    ltv: option(options, 'sourceStatedLtv', 0.7),
    interest_rate: option(options, 'interestRate', 0.0595),
    amortization_years: option(options, 'amortizationYears', 30),
    lender_fee_percent: option(options, 'lenderFeeRate', 0.0085),
    going_in_cap_rate: option(options, 'goingInCapRate', 0.07),
    noi_basis: option(options, 'purchaseNoiBasis', 945000),
  };
  const facts = {};
  const factEvidence = {};
  for (const [factName, value] of Object.entries(values)) {
    if (value === undefined) continue;
    facts[factName] = value;
    const isRate = ['ltv', 'interest_rate', 'lender_fee_percent', 'going_in_cap_rate'].includes(factName);
    factEvidence[factName] = evidence(
      isRate ? value * 100 : value,
      `${factName}: ${isRate ? `${value * 100}%` : value}`,
      value
    );
  }
  const closingCostsPercent = option(options, 'closingCostsPercent', 0.02);
  const returnInputFacts = closingCostsPercent === undefined
    ? {}
    : { closing_costs_percent: closingCostsPercent };
  const returnInputFactEvidence = closingCostsPercent === undefined
    ? {}
    : {
        closing_costs_percent: evidence(
          closingCostsPercent * 100,
          `Closing Costs ${closingCostsPercent * 100}%`,
          closingCostsPercent
        ),
      };
  return acceptedSupport({
    fileId: 'purchase-file',
    filename: 'Purchase Assumptions.pdf',
    role: 'purchase_assumptions',
    facts,
    factEvidence,
    returnInputFacts,
    returnInputFactEvidence,
    sectionEligibility: { acquisitionRequest: true, proposedFinancing: true },
  });
}

function buildAppraisalSupport(options) {
  const values = {
    appraised_value: option(options, 'appraisedValue', 14200000),
    appraisal_noi: option(options, 'appraisalNoi', 944300),
    appraisal_cap_rate: option(options, 'appraisalCapRate', 0.0665),
  };
  const facts = {};
  const factEvidence = {};
  for (const [factName, value] of Object.entries(values)) {
    if (value === undefined) continue;
    facts[factName] = value;
    const isRate = factName === 'appraisal_cap_rate';
    factEvidence[factName] = evidence(
      isRate ? value * 100 : value,
      `${factName}: ${isRate ? `${value * 100}%` : value}`,
      value
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

function buildCurrentDebtSupport(balance) {
  const facts = {
    current_outstanding_balance: balance,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
  };
  return acceptedSupport({
    fileId: 'current-debt-file',
    filename: 'Current Debt.pdf',
    role: 'current_debt_context',
    facts,
    factEvidence: {
      current_outstanding_balance: evidence(balance, `Current Balance: ${balance}`),
      interest_rate: evidence(4.85, 'Current Interest Rate: 4.85%', 0.0485),
      amortization_remaining_years: evidence(24, 'Remaining Amortization: 24 years'),
      monthly_payment: evidence(39250, 'Monthly Payment: 39250'),
    },
    sectionEligibility: { currentDebt: true },
  });
}

function buildSourceTruth(options = {}) {
  const totalUnits = option(options, 'totalUnits', 64);
  const t12Noi = option(options, 't12Noi', 945000);
  const accepted = [];
  if (options.includePurchase !== false) accepted.push(buildPurchaseSupport(options));
  if (options.includeAppraisal !== false) accepted.push(buildAppraisalSupport(options));
  if (hasOwn(options, 'currentDebtBalance')) accepted.push(buildCurrentDebtSupport(options.currentDebtBalance));
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
    job_id: option(options, 'jobId', 'gate-5e-job'),
    property_name: 'Gate 5E Property',
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
      conflicts: options.conflicts ?? [],
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

function buildGate5Analyses(sourceTruthPackage) {
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
  return {
    inputContract: underwritingInputContract,
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract }),
  };
}

function buildReadiness(sourceTruthPackage) {
  const analyses = buildGate5Analyses(sourceTruthPackage);
  return {
    analyses,
    contract: buildCanonicalInstitutionalUnderwritingReturnReadinessContract(analyses),
  };
}

const { analyses, contract } = buildReadiness(buildSourceTruth());
assert.equal(isCanonicalInstitutionalUnderwritingReturnReadinessContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.requiredAuthority), true);
assert.equal(Object.isFrozen(contract.returnOutputs), true);
assert.equal(contract.source, 'canonical_institutional_underwriting_return_readiness_contract');
assert.equal(contract.upstreamReceipt.jobId, 'gate-5e-job');
assert.equal(contract.upstreamReceipt.exactCommonInputContract, true);
assert.deepEqual(contract.upstreamAnalyses.sourceCase, analyses.sourceCaseAnalysis);
assert.deepEqual(contract.upstreamAnalyses.valuation, analyses.valuationAnalysis);
assert.deepEqual(contract.upstreamAnalyses.capitalStructure, analyses.capitalStructureAnalysis);

assert.equal(contract.policy.authorityCreating, false);
assert.equal(contract.policy.eligibilityOnly, true);
assert.equal(contract.policy.calculationsPerformed, false);
assert.equal(contract.policy.returnCalculationAuthorized, false);
assert.equal(contract.policy.sourceCaseNoiPromotedToEquityCashFlow, false);
assert.equal(contract.policy.appraisedValuePromotedToExitValue, false);
assert.equal(contract.policy.purchasePriceLessLoanPromotedToTotalEquity, false);
assert.equal(contract.policy.lenderFeeFundingSourceInferred, false);
assert.equal(contract.policy.holdPeriodInferred, false);
assert.equal(contract.policy.exitValueInferred, false);
assert.equal(contract.policy.currentDebtUsedAsAcquisitionOrExitDebt, false);
assert.equal(contract.policy.refinanceProceedsCalculated, false);
assert.equal(contract.policy.classificationAllowed, false);
assert.equal(contract.policy.recommendationAllowed, false);
assert.equal(contract.policy.customerFacingCopyProduced, false);
assert.equal(contract.policy.downstreamRenderingAuthorized, false);
assert.equal(contract.policy.screeningBehaviorChanged, false);
assert.equal(contract.policy.optionalReadinessFailureMayBlockValidatedCorePublication, false);
assert.equal(contract.reportPublicationBlocker, false);

assert.equal(contract.acceptedReferences.sourceCaseNetOperatingIncome.value, 945000);
assert.equal(contract.acceptedReferences.purchasePrice.value, 13500000);
assert.equal(contract.acceptedReferences.closingCostsPercent.value, 0.02);
assert.equal(contract.acceptedReferences.proposedLoanAmount.value, 9450000);
assert.equal(contract.acceptedReferences.purchasePriceLessProposedLoan.value, 4050000);
assert.equal(contract.acceptedReferences.proposedLenderFeeDollars.value, 80325);
assert.equal(contract.acceptedReferences.appraisedValue.value, 14200000);
for (const reference of Object.values(contract.acceptedReferences)) {
  assert.equal(reference.referenceAvailable, true);
  assert.equal(reference.eligibleAsCompleteReturnInput, false);
  assert.equal(reference.reportPublicationBlocker, false);
  assert.equal(reference.provenance.length > 0, true);
}
assert.equal(
  contract.acceptedReferences.sourceCaseNetOperatingIncome.semanticRestrictionCodes.includes('NET_OPERATING_INCOME_IS_NOT_EQUITY_CASH_FLOW'),
  true
);
assert.equal(
  contract.acceptedReferences.purchasePriceLessProposedLoan.semanticRestrictionCodes.includes('PURCHASE_PRICE_LESS_PROPOSED_LOAN_IS_NOT_TOTAL_EQUITY_REQUIREMENT'),
  true
);
assert.equal(
  contract.acceptedReferences.appraisedValue.semanticRestrictionCodes.includes('APPRAISED_VALUE_IS_NOT_AUTHORIZED_EXIT_VALUE'),
  true
);
assert.equal(
  contract.acceptedReferences.proposedLenderFeeDollars.semanticRestrictionCodes.includes('LENDER_FEE_FUNDING_SOURCE_NOT_ESTABLISHED'),
  true
);
assert.equal(
  contract.acceptedReferences.closingCostsPercent.semanticRestrictionCodes.includes('CLOSING_COSTS_PERCENT_IS_NOT_CLOSING_COST_DOLLARS'),
  true
);
assert.equal(contract.requiredAuthority.closingCosts.value, null);

assert.equal(Object.keys(contract.requiredAuthority).length, 17);
for (const authority of Object.values(contract.requiredAuthority)) {
  assert.equal(authority.value, null);
  assert.equal(authority.authorityState, 'not_established');
  assert.equal(authority.sourceBound, false);
  assert.equal(authority.policyBound, false);
  assert.equal(authority.calculationAuthorized, false);
  assert.equal(authority.provenance.length, 0);
  assert.equal(authority.reportPublicationBlocker, false);
}

assert.equal(Object.keys(contract.readiness).length, 7);
for (const bundle of Object.values(contract.readiness)) {
  assert.equal(bundle.authorityState, 'ineligible_missing_canonical_authority');
  assert.equal(bundle.calculationEligible, false);
  assert.equal(bundle.missingAuthorityFields.length > 0, true);
  assert.equal(bundle.calculationPerformed, false);
  assert.equal(bundle.customerSurfaceAuthorized, false);
  assert.equal(bundle.reportPublicationBlocker, false);
}
assert.deepEqual(
  contract.readiness.initialEquityBasis.missingAuthorityFields,
  [
    'authorized_lender_fee_funding_treatment',
    'accepted_closing_cost_funding_treatment',
    'accepted_other_funding_sources_and_uses',
  ]
);
assert.deepEqual(
  contract.readiness.exitProceeds.missingAuthorityFields,
  ['authorized_exit_value', 'authorized_exit_date', 'accepted_selling_costs', 'accepted_debt_payoff_at_exit']
);

assert.equal(Object.keys(contract.returnOutputs).length, 7);
for (const output of Object.values(contract.returnOutputs)) {
  assert.equal(output.value, null);
  assert.equal(output.calculationStatus, 'not_calculated');
  assert.equal(output.calculationAuthorized, false);
  assert.equal(output.reasonCode, 'CANONICAL_RETURN_READINESS_NOT_ESTABLISHED');
  assert.equal(output.customerSurfaceAuthorized, false);
  assert.equal(output.reportPublicationBlocker, false);
}
assert.deepEqual(contract.coverage, {
  availableReferenceCount: 7,
  totalReferenceCount: 7,
  establishedRequiredAuthorityCount: 0,
  totalRequiredAuthorityCount: 17,
  eligibleReadinessBundleCount: 0,
  totalReadinessBundleCount: 7,
  calculatedReturnCount: 0,
  totalReturnOutputCount: 7,
});

const ignoredCallerOverrides = buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
  ...analyses,
  closingCosts: 250000,
  closingCostsPercent: 0.04,
  lenderFeeFundingTreatment: 'equity',
  holdPeriod: 5,
  exitValue: 17500000,
  sellingCosts: 350000,
  refinanceProceeds: 12000000,
  cashOnCashReturn: 0.1,
  equityMultiple: 2,
  internalRateOfReturn: 0.2,
  recommendation: 'Proceed',
});
assert.deepEqual(ignoredCallerOverrides, contract);

const missingClosingCosts = buildReadiness(buildSourceTruth({ closingCostsPercent: undefined })).contract;
assert.equal(missingClosingCosts.acceptedReferences.closingCostsPercent.value, null);
assert.equal(missingClosingCosts.acceptedReferences.closingCostsPercent.referenceAvailable, false);
assert.equal(missingClosingCosts.requiredAuthority.closingCosts.value, null);
assert.equal(missingClosingCosts.readiness.acquisitionUses.calculationEligible, false);
assert.equal(missingClosingCosts.coverage.availableReferenceCount, 6);

const zeroClosingCosts = buildReadiness(buildSourceTruth({ closingCostsPercent: 0 })).contract;
assert.equal(zeroClosingCosts.acceptedReferences.closingCostsPercent.value, 0);
assert.equal(zeroClosingCosts.acceptedReferences.closingCostsPercent.referenceAvailable, true);
assert.equal(zeroClosingCosts.requiredAuthority.closingCosts.value, null);
assert.equal(zeroClosingCosts.returnOutputs.totalAcquisitionUses.value, null);

const closingCostsEvidenceMismatchSource = buildSourceTruth({ jobId: 'closing-costs-evidence-mismatch' });
closingCostsEvidenceMismatchSource.support.accepted[0]
  .accepted_return_input_fact_evidence.closing_costs_percent.normalizedValue = 0.03;
closingCostsEvidenceMismatchSource.support.accepted[0]
  .authority_decision.acceptedReturnInputFactEvidence.closing_costs_percent.normalizedValue = 0.03;
const closingCostsEvidenceMismatch = buildReadiness(closingCostsEvidenceMismatchSource).contract;
assert.equal(closingCostsEvidenceMismatch.acceptedReferences.closingCostsPercent.value, null);
assert.equal(closingCostsEvidenceMismatch.requiredAuthority.closingCosts.value, null);

const closingCostsDecisionMismatchSource = buildSourceTruth({ jobId: 'closing-costs-decision-mismatch' });
closingCostsDecisionMismatchSource.support.accepted[0]
  .authority_decision.acceptedReturnInputFacts.closing_costs_percent = 0.03;
const closingCostsDecisionMismatch = buildReadiness(closingCostsDecisionMismatchSource).contract;
assert.equal(closingCostsDecisionMismatch.acceptedReferences.closingCostsPercent.value, null);

const closingCostsConflictSource = buildSourceTruth({
  jobId: 'closing-costs-fact-conflict',
  factConflicts: [{
    canonical_role: 'purchase_assumptions',
    fact_name: 'closing_costs_percent',
    sources: [
      { file_id: 'purchase-file', value: 0.02 },
      { file_id: 'purchase-file-2', value: 0.03 },
    ],
    decision: 'fact_rejected_role_preserved',
    customer_delivery_blocker: false,
  }],
});
const closingCostsConflict = buildReadiness(closingCostsConflictSource).contract;
assert.equal(closingCostsConflict.acceptedReferences.closingCostsPercent.value, null);
assert.equal(closingCostsConflict.readiness.acquisitionUses.calculationEligible, false);

assert.throws(
  () => buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: { source: 'canonical_deterministic_source_case_underwriting_analysis' },
    valuationAnalysis: analyses.valuationAnalysis,
    capitalStructureAnalysis: analyses.capitalStructureAnalysis,
  }),
  /MATCHING_CANONICAL_GATE_5_ANALYSES_REQUIRED_FOR_RETURN_READINESS/
);

const differentJob = buildGate5Analyses(buildSourceTruth({ jobId: 'different-gate-5e-job' }));
assert.throws(
  () => buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: analyses.sourceCaseAnalysis,
    valuationAnalysis: differentJob.valuationAnalysis,
    capitalStructureAnalysis: differentJob.capitalStructureAnalysis,
  }),
  /MATCHING_CANONICAL_GATE_5_ANALYSES_REQUIRED_FOR_RETURN_READINESS/
);

const tamperedUpstream = structuredClone(analyses.capitalStructureAnalysis);
tamperedUpstream.section.calculations[0].result = 0.95;
assert.throws(
  () => buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: analyses.sourceCaseAnalysis,
    valuationAnalysis: analyses.valuationAnalysis,
    capitalStructureAnalysis: tamperedUpstream,
  }),
  /MATCHING_CANONICAL_GATE_5_ANALYSES_REQUIRED_FOR_RETURN_READINESS/
);

const tamperedReadiness = structuredClone(contract);
tamperedReadiness.readiness.cashOnCashReturn.calculationEligible = true;
assert.equal(isCanonicalInstitutionalUnderwritingReturnReadinessContract(tamperedReadiness), false);
const tamperedReturn = structuredClone(contract);
tamperedReturn.returnOutputs.internalRateOfReturn.value = 0.2;
assert.equal(isCanonicalInstitutionalUnderwritingReturnReadinessContract(tamperedReturn), false);
const tamperedSemanticBoundary = structuredClone(contract);
tamperedSemanticBoundary.acceptedReferences.appraisedValue.eligibleAsCompleteReturnInput = true;
assert.equal(isCanonicalInstitutionalUnderwritingReturnReadinessContract(tamperedSemanticBoundary), false);
const tamperedProvenance = structuredClone(contract);
tamperedProvenance.acceptedReferences.purchasePrice.provenance = [];
assert.equal(isCanonicalInstitutionalUnderwritingReturnReadinessContract(tamperedProvenance), false);

const missingLenderFee = buildReadiness(buildSourceTruth({ lenderFeeRate: undefined })).contract;
assert.equal(missingLenderFee.acceptedReferences.proposedLenderFeeDollars.value, null);
assert.equal(missingLenderFee.acceptedReferences.proposedLenderFeeDollars.referenceAvailable, false);
assert.equal(missingLenderFee.readiness.acquisitionUses.calculationEligible, false);
assert.equal(missingLenderFee.reportPublicationBlocker, false);

const zeroLenderFee = buildReadiness(buildSourceTruth({ lenderFeeRate: 0 })).contract;
assert.equal(zeroLenderFee.acceptedReferences.proposedLenderFeeDollars.value, 0);
assert.equal(zeroLenderFee.acceptedReferences.proposedLenderFeeDollars.referenceAvailable, true);
assert.equal(zeroLenderFee.readiness.acquisitionUses.calculationEligible, false);
assert.equal(zeroLenderFee.returnOutputs.initialEquityBasis.value, null);

const missingPurchasePrice = buildReadiness(buildSourceTruth({ purchasePrice: undefined })).contract;
assert.equal(missingPurchasePrice.acceptedReferences.purchasePrice.value, null);
assert.equal(missingPurchasePrice.acceptedReferences.purchasePrice.referenceAvailable, false);
assert.equal(missingPurchasePrice.acceptedReferences.purchasePriceLessProposedLoan.value, null);
assert.equal(missingPurchasePrice.returnOutputs.totalAcquisitionUses.value, null);
assert.equal(missingPurchasePrice.reportPublicationBlocker, false);

const missingLoan = buildReadiness(buildSourceTruth({ proposedLoanAmount: undefined })).contract;
assert.equal(missingLoan.acceptedReferences.proposedLoanAmount.value, null);
assert.equal(missingLoan.acceptedReferences.purchasePriceLessProposedLoan.value, null);
assert.equal(missingLoan.returnOutputs.initialEquityBasis.value, null);

const missingAppraisal = buildReadiness(buildSourceTruth({ appraisedValue: undefined })).contract;
assert.equal(missingAppraisal.acceptedReferences.appraisedValue.value, null);
assert.equal(missingAppraisal.requiredAuthority.exitValue.value, null);
assert.equal(missingAppraisal.readiness.exitProceeds.calculationEligible, false);

const zeroNoi = buildReadiness(buildSourceTruth({ t12Noi: 0 })).contract;
assert.equal(zeroNoi.acceptedReferences.sourceCaseNetOperatingIncome.value, 0);
assert.equal(zeroNoi.acceptedReferences.sourceCaseNetOperatingIncome.referenceAvailable, true);
assert.equal(zeroNoi.readiness.annualEquityCashFlow.calculationEligible, false);
assert.equal(zeroNoi.returnOutputs.annualEquityCashFlow.value, null);

const lowCurrentDebt = buildReadiness(buildSourceTruth({ currentDebtBalance: 1000000 })).contract;
const highCurrentDebt = buildReadiness(buildSourceTruth({ currentDebtBalance: 9000000 })).contract;
assert.deepEqual(lowCurrentDebt.acceptedReferences, highCurrentDebt.acceptedReferences);
assert.deepEqual(lowCurrentDebt.requiredAuthority, highCurrentDebt.requiredAuthority);
assert.deepEqual(lowCurrentDebt.readiness, highCurrentDebt.readiness);
assert.deepEqual(lowCurrentDebt.returnOutputs, highCurrentDebt.returnOutputs);
assert.equal(lowCurrentDebt.policy.currentDebtUsedAsAcquisitionOrExitDebt, false);

const conflictingPurchase = buildReadiness(buildSourceTruth({ conflicts: ['purchase-file'] })).contract;
assert.equal(conflictingPurchase.acceptedReferences.purchasePrice.value, null);
assert.equal(conflictingPurchase.acceptedReferences.closingCostsPercent.value, null);
assert.equal(conflictingPurchase.returnOutputs.initialEquityBasis.value, null);
assert.equal(conflictingPurchase.reportPublicationBlocker, false);

function adjudicatePurchaseReturnInput(name, sourceText) {
  const fileId = `return-input-${name}`;
  return adjudicateSupportDocumentAuthority({
    file: { file_id: fileId, original_filename: `${name}.pdf` },
    artifacts: [{
      id: `${fileId}-text`,
      type: 'document_text_extracted',
      payload: { file_id: fileId, original_filename: `${name}.pdf`, text: sourceText },
    }],
  });
}

const exactClosingCostsDecision = adjudicatePurchaseReturnInput(
  'exact-closing-costs',
  'Purchase Assumptions\nClosing Costs 2.00%'
);
assert.equal(exactClosingCostsDecision.canonicalRole, 'purchase_assumptions');
assert.equal(exactClosingCostsDecision.roleAccepted, true);
assert.equal(exactClosingCostsDecision.returnInputSourceBacked, true);
assert.equal(exactClosingCostsDecision.acceptedReturnInputFacts.closing_costs_percent, 0.02);
assert.match(
  exactClosingCostsDecision.acceptedReturnInputFactEvidence.closing_costs_percent.excerpt,
  /Closing Costs 2\.00%/
);

const nonQuantifiedClosingCostsDecision = adjudicatePurchaseReturnInput(
  'non-quantified-closing-costs',
  'Purchase Assumptions\nStandard closing costs apply.'
);
assert.equal(nonQuantifiedClosingCostsDecision.acceptedReturnInputFacts.closing_costs_percent, undefined);
assert.equal(nonQuantifiedClosingCostsDecision.returnInputSourceBacked, false);

const ambiguousClosingCostsDecision = adjudicatePurchaseReturnInput(
  'ambiguous-closing-costs',
  'Purchase Assumptions\nClosing Costs 2.00%\nClosing Costs 3.00%'
);
assert.equal(ambiguousClosingCostsDecision.acceptedReturnInputFacts.closing_costs_percent, undefined);
assert.equal(
  ambiguousClosingCostsDecision.returnInputFactAmbiguities.closing_costs_percent.reason,
  'conflicting_exact_source_values'
);
assert.equal(ambiguousClosingCostsDecision.returnInputSourceBacked, false);

const nonAuthoritativeClosingCostsDecision = adjudicatePurchaseReturnInput(
  'non-authoritative-closing-costs',
  'Purchase Assumptions\nClosing Costs 2.00%\nIllustrative and non-binding.'
);
assert.equal(nonAuthoritativeClosingCostsDecision.roleAccepted, false);
assert.equal(nonAuthoritativeClosingCostsDecision.returnInputSourceBacked, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-underwriting-return-readiness-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, [
  './deterministic-source-case-underwriting-analysis.js',
  './deterministic-acquisition-valuation-analysis.js',
  './deterministic-acquisition-capital-structure-analysis.js',
]);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-underwriting-return-readiness-contract-smoke: PASS');
