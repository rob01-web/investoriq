import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
  isCanonicalInstitutionalUnderwritingInputContract,
} from '../../api/_lib/institutional-underwriting-input-contract.js';
import {
  buildDeterministicAcquisitionCapitalStructureAnalysis,
  isCanonicalDeterministicAcquisitionCapitalStructureAnalysis,
} from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';

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
  const values = {
    purchase_price: option(options, 'purchasePrice', 13500000),
    proposed_loan_amount: option(options, 'proposedLoanAmount', 9450000),
    ltv: option(options, 'sourceStatedLtv', 0.7),
    interest_rate: option(options, 'interestRate', 0.0595),
    amortization_years: option(options, 'amortizationYears', 30),
    lender_fee_percent: option(options, 'lenderFeeRate', 0.0085),
    going_in_cap_rate: 0.07,
    noi_basis: 945000,
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
  if (options.proposedLoanEvidenceMismatch && hasOwn(facts, 'proposed_loan_amount')) {
    factEvidence.proposed_loan_amount = evidence(1, 'Proposed Loan Amount: 1', 1);
  }
  return acceptedSupport({
    fileId: 'purchase-file',
    filename: 'Purchase Assumptions.pdf',
    role: 'purchase_assumptions',
    facts,
    factEvidence,
    sectionEligibility: { acquisitionRequest: true, proposedFinancing: true },
  });
}

function buildCurrentDebtSupport(balance) {
  const facts = {
    current_outstanding_balance: balance,
    interest_rate: 0.0485,
    amortization_remaining_years: 24,
    monthly_payment: 39250,
  };
  const factEvidence = {
    current_outstanding_balance: evidence(balance, `Current Balance: ${balance}`),
    interest_rate: evidence(4.85, 'Current Interest Rate: 4.85%', 0.0485),
    amortization_remaining_years: evidence(24, 'Remaining Amortization: 24 years'),
    monthly_payment: evidence(39250, 'Monthly Payment: 39250'),
  };
  return acceptedSupport({
    fileId: 'current-debt-file',
    filename: 'Current Debt.pdf',
    role: 'current_debt_context',
    facts,
    factEvidence,
    sectionEligibility: { currentDebt: true },
  });
}

function buildSourceTruth(options = {}) {
  const totalUnits = option(options, 'totalUnits', 64);
  const accepted = [];
  if (options.includePurchase !== false) accepted.push(buildPurchaseSupport(options));
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
    job_id: option(options, 'jobId', 'gate-5d-job'),
    property_name: 'Gate 5D Property',
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

function buildGate5D(sourceTruthPackage) {
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
  const analysis = buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract });
  return { financialIntelligence, underwritingInputContract, analysis };
}

function receipt(analysis, calculationKey) {
  return analysis.section.calculations.find((entry) => entry.calculationKey === calculationKey);
}

const { financialIntelligence, underwritingInputContract, analysis } = buildGate5D(buildSourceTruth());
assert.equal(isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(analysis), true);
assert.equal(Object.isFrozen(analysis), true);
assert.equal(Object.isFrozen(analysis.section), true);
assert.equal(Object.isFrozen(analysis.formulaRegistry), true);
assert.equal(analysis.inputReceipt.jobId, 'gate-5d-job');
assert.equal(analysis.reportPublicationBlocker, false);
assert.equal(analysis.policy.authorityCreating, false);
assert.equal(analysis.policy.deterministicMathOnly, true);
assert.equal(analysis.policy.acceptedAcquisitionFactsOnly, true);
assert.equal(analysis.policy.debtServiceCompletenessRequiredForCapitalStructure, false);
assert.equal(analysis.policy.currentDebtUsed, false);
assert.equal(analysis.policy.acquisitionTermsPromotedToRefinancingTerms, false);
assert.equal(analysis.policy.closingCostsInferred, false);
assert.equal(analysis.policy.totalEquityRequirementCalculated, false);
assert.equal(analysis.policy.downstreamRenderingAuthorized, false);
assert.equal(analysis.policy.screeningBehaviorChanged, false);
assert.equal(analysis.policy.legacyUnderwritingReuseAllowed, false);
assert.equal(analysis.purchasePriceAuthority.authorityState, 'matched_canonical_copies');
assert.equal(analysis.purchasePriceAuthority.value, 13500000);
assert.equal(analysis.capitalStructureAuthority.capitalStructureCalculationEligible, true);
assert.equal(analysis.section.analysisStatus, 'calculated');
assert.equal(receipt(analysis, 'proposedLoanToPurchasePrice').result, 0.7);
assert.equal(receipt(analysis, 'sourceStatedLtvDifference').result, 0);
assert.equal(receipt(analysis, 'purchasePriceLessProposedLoan').result, 4050000);
assert.equal(receipt(analysis, 'unfinancedPurchasePriceShare').result, 0.3);
assert.equal(receipt(analysis, 'proposedLoanPerUnit').result, 147656.25);
assert.equal(receipt(analysis, 'unfinancedPurchasePricePerUnit').result, 63281.25);
assert.equal(receipt(analysis, 'proposedLenderFeeDollars').result, 80325);
assert.equal(receipt(analysis, 'lenderFeeShareOfPurchasePrice').result, 0.00595);
assert.equal(receipt(analysis, 'sourceStatedLtvImpliedLoanAmount').result, 9450000);
assert.equal(receipt(analysis, 'proposedLoanLessLtvImpliedLoanAmount').result, 0);
assert.equal(receipt(analysis, 'proposedLoanToPurchasePrice').formula, 'accepted_proposed_loan_amount_divided_by_accepted_purchase_price');
assert.equal(receipt(analysis, 'proposedLoanToPurchasePrice').inputProvenance.some((entry) => entry.sourceIdentityKey === 'file:purchase-file'), true);
assert.equal(
  receipt(analysis, 'proposedLenderFeeDollars').result,
  financialIntelligence.analyses.debtRisk.lenderFee.lenderFeeDollars
);
assert.equal(analysis.coverage.calculatedMeasureCount, 10);
assert.equal(analysis.coverage.totalMeasureCount, 10);
assert.equal(analysis.coverage.unavailableAnalysisCount, 8);
for (const unavailable of Object.values(analysis.unavailableAnalyses)) {
  assert.equal(unavailable.authorityState, 'not_authorized');
  assert.equal(unavailable.calculationPerformed, false);
  assert.equal(unavailable.value, null);
  assert.equal(unavailable.customerSurfaceAuthorized, false);
  assert.equal(unavailable.reportPublicationBlocker, false);
}

const ignoredCallerOverrides = buildDeterministicAcquisitionCapitalStructureAnalysis({
  underwritingInputContract,
  closingCosts: 500000,
  currentDebtPayoff: 6800000,
  totalEquityRequirement: 9000000,
  refinanceProceeds: 12000000,
  recommendation: 'Proceed',
});
assert.deepEqual(ignoredCallerOverrides, analysis);

const tamperedResult = structuredClone(analysis);
tamperedResult.section.calculations[0].result = 0.8;
assert.equal(isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(tamperedResult), false);
const tamperedFormula = structuredClone(analysis);
tamperedFormula.section.calculations[2].formula = 'caller_defined_equity_formula';
assert.equal(isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(tamperedFormula), false);
const tamperedProvenance = structuredClone(analysis);
tamperedProvenance.section.calculations[6].inputProvenance = [];
assert.equal(isCanonicalDeterministicAcquisitionCapitalStructureAnalysis(tamperedProvenance), false);
assert.throws(
  () => buildDeterministicAcquisitionCapitalStructureAnalysis({
    underwritingInputContract: {
      source: 'canonical_institutional_underwriting_input_contract',
      contractVersion: 1,
    },
  }),
  /CANONICAL_INSTITUTIONAL_UNDERWRITING_INPUT_CONTRACT_REQUIRED_FOR_ACQUISITION_CAPITAL_STRUCTURE_ANALYSIS/
);

const debtServiceIncomplete = buildGate5D(buildSourceTruth({
  interestRate: undefined,
  amortizationYears: undefined,
})).analysis;
assert.equal(debtServiceIncomplete.capitalStructureAuthority.debtServiceCalculationEligible, false);
assert.equal(debtServiceIncomplete.capitalStructureAuthority.capitalStructureCalculationEligible, true);
assert.equal(debtServiceIncomplete.coverage.calculatedMeasureCount, 10);

const missingLtv = buildGate5D(buildSourceTruth({ sourceStatedLtv: undefined })).analysis;
assert.equal(receipt(missingLtv, 'proposedLoanToPurchasePrice').result, 0.7);
assert.equal(receipt(missingLtv, 'sourceStatedLtvDifference').result, null);
assert.equal(receipt(missingLtv, 'sourceStatedLtvImpliedLoanAmount').result, null);
assert.equal(receipt(missingLtv, 'proposedLoanLessLtvImpliedLoanAmount').result, null);
assert.equal(missingLtv.reportPublicationBlocker, false);

const missingFee = buildGate5D(buildSourceTruth({ lenderFeeRate: undefined })).analysis;
assert.equal(receipt(missingFee, 'proposedLenderFeeDollars').result, null);
assert.equal(receipt(missingFee, 'lenderFeeShareOfPurchasePrice').result, null);
assert.equal(receipt(missingFee, 'purchasePriceLessProposedLoan').result, 4050000);

const missingUnits = buildGate5D(buildSourceTruth({ totalUnits: undefined })).analysis;
assert.equal(receipt(missingUnits, 'proposedLoanPerUnit').result, null);
assert.equal(receipt(missingUnits, 'unfinancedPurchasePricePerUnit').result, null);
assert.equal(receipt(missingUnits, 'proposedLoanToPurchasePrice').result, 0.7);

const missingLoan = buildGate5D(buildSourceTruth({ proposedLoanAmount: undefined })).analysis;
assert.equal(receipt(missingLoan, 'proposedLoanToPurchasePrice').result, null);
assert.equal(receipt(missingLoan, 'purchasePriceLessProposedLoan').result, null);
assert.equal(receipt(missingLoan, 'proposedLenderFeeDollars').result, null);
assert.equal(receipt(missingLoan, 'sourceStatedLtvImpliedLoanAmount').result, 9450000);
assert.equal(missingLoan.reportPublicationBlocker, false);

const missingPurchasePrice = buildGate5D(buildSourceTruth({ purchasePrice: undefined })).analysis;
assert.equal(missingPurchasePrice.purchasePriceAuthority.eligible, false);
assert.equal(missingPurchasePrice.section.analysisStatus, 'collapsed');
assert.equal(missingPurchasePrice.reportPublicationBlocker, false);

const conflictingPurchase = buildGate5D(buildSourceTruth({ conflicts: ['purchase-file'] })).analysis;
assert.equal(conflictingPurchase.section.analysisStatus, 'collapsed');
assert.equal(conflictingPurchase.reportPublicationBlocker, false);

const loanEvidenceMismatch = buildGate5D(buildSourceTruth({ proposedLoanEvidenceMismatch: true })).analysis;
assert.equal(receipt(loanEvidenceMismatch, 'proposedLoanToPurchasePrice').result, null);
assert.equal(receipt(loanEvidenceMismatch, 'sourceStatedLtvImpliedLoanAmount').result, 9450000);
assert.equal(loanEvidenceMismatch.reportPublicationBlocker, false);

const zeroLoan = buildGate5D(buildSourceTruth({ proposedLoanAmount: 0 })).analysis;
assert.equal(receipt(zeroLoan, 'proposedLoanToPurchasePrice').result, null);
assert.equal(receipt(zeroLoan, 'sourceStatedLtvImpliedLoanAmount').result, 9450000);
assert.equal(zeroLoan.unavailableAnalyses.totalEquityRequirement.value, null);

const zeroFee = buildGate5D(buildSourceTruth({ lenderFeeRate: 0 })).analysis;
assert.equal(receipt(zeroFee, 'proposedLenderFeeDollars').result, 0);
assert.equal(receipt(zeroFee, 'lenderFeeShareOfPurchasePrice').result, 0);

const overLoan = buildGate5D(buildSourceTruth({ proposedLoanAmount: 14850000 })).analysis;
assert.equal(receipt(overLoan, 'proposedLoanToPurchasePrice').result, 1.1);
assert.equal(receipt(overLoan, 'purchasePriceLessProposedLoan').result, -1350000);
assert.equal(receipt(overLoan, 'unfinancedPurchasePriceShare').result, -0.1);
assert.equal(overLoan.unavailableAnalyses.riskClassification.value, null);
assert.equal(overLoan.unavailableAnalyses.recommendation.value, null);

const statedLtvMismatch = buildGate5D(buildSourceTruth({ sourceStatedLtv: 0.72 })).analysis;
assert.equal(receipt(statedLtvMismatch, 'sourceStatedLtvDifference').result, 0.02);
assert.equal(receipt(statedLtvMismatch, 'sourceStatedLtvImpliedLoanAmount').result, 9720000);
assert.equal(receipt(statedLtvMismatch, 'proposedLoanLessLtvImpliedLoanAmount').result, -270000);
assert.equal(statedLtvMismatch.unavailableAnalyses.riskClassification.value, null);

const debtCopyMismatchInput = structuredClone(underwritingInputContract);
debtCopyMismatchInput.gate4Inputs.debtService.proposedFinancing.facts.purchase_price.value = 14000000;
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(debtCopyMismatchInput), true);
const debtCopyMismatch = buildDeterministicAcquisitionCapitalStructureAnalysis({
  underwritingInputContract: debtCopyMismatchInput,
});
assert.equal(debtCopyMismatch.purchasePriceAuthority.authorityState, 'conflicting_canonical_copies');
assert.equal(debtCopyMismatch.section.analysisStatus, 'collapsed');

const loanIdentityMismatchInput = structuredClone(underwritingInputContract);
loanIdentityMismatchInput.gate4Inputs.debtService.proposedFinancing.facts.proposed_loan_amount.provenance.sourceIdentityKey = 'file:other-file';
assert.equal(isCanonicalInstitutionalUnderwritingInputContract(loanIdentityMismatchInput), true);
const loanIdentityMismatch = buildDeterministicAcquisitionCapitalStructureAnalysis({
  underwritingInputContract: loanIdentityMismatchInput,
});
assert.equal(receipt(loanIdentityMismatch, 'proposedLoanToPurchasePrice').result, null);
assert.equal(receipt(loanIdentityMismatch, 'sourceStatedLtvImpliedLoanAmount').result, 9450000);

const lowCurrentDebt = buildGate5D(buildSourceTruth({ currentDebtBalance: 1000000 })).analysis;
const highCurrentDebt = buildGate5D(buildSourceTruth({ currentDebtBalance: 9000000 })).analysis;
assert.deepEqual(lowCurrentDebt.section.calculations, highCurrentDebt.section.calculations);
assert.equal(lowCurrentDebt.policy.currentDebtUsed, false);
assert.equal(highCurrentDebt.policy.currentDebtUsed, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/deterministic-acquisition-capital-structure-analysis.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-underwriting-input-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(productionSource.includes('legacy-underwriting'), false);

console.log('deterministic-acquisition-capital-structure-analysis-smoke: PASS');
