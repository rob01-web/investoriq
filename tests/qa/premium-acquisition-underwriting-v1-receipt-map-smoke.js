import assert from 'node:assert/strict';

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
  buildDeterministicSourceCaseUnderwritingAnalysis,
} from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import {
  buildDeterministicAcquisitionValuationAnalysis,
} from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import {
  buildDeterministicAcquisitionCapitalStructureAnalysis,
} from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import {
  buildPremiumAcquisitionUnderwritingV1ReceiptMap,
  isCanonicalPremiumAcquisitionUnderwritingV1ReceiptMap,
} from '../../api/_lib/premium-acquisition-underwriting-v1-receipt-map.js';

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

function buildSourceTruth(jobId = 'premium-receipt-map-job') {
  const purchase = acceptedSupport({
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
    },
    factEvidence: {
      current_outstanding_balance: evidence(6800000, 'Outstanding Balance $6,800,000'),
      interest_rate: evidence(4.85, 'Interest Rate 4.85%', 0.0485),
      amortization_remaining_years: evidence(24, 'Amortization Remaining 24 years'),
      monthly_payment: evidence(39250, 'Monthly Payment $39,250'),
      maturity_date: evidence('2029-11-01', 'Maturity Date 2029-11-01'),
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
      appraised_value: evidence(14200000, 'Appraised Value $14,200,000'),
      appraisal_cap_rate: evidence(6.65, 'Appraisal Cap Rate 6.65%', 0.0665),
      appraisal_noi: evidence(944300, 'Appraisal NOI $944,300'),
    },
    sectionEligibility: { valuationContext: true },
  });
  const accepted = [purchase, currentDebt, appraisal];
  return {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: jobId,
    property_name: 'Premium Receipt Map Property',
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
          expense_lines: [
            { label: 'Property Taxes', amount: 185000 },
            { label: 'Insurance', amount: 72000 },
            { label: 'Repairs and Maintenance', amount: 104000 },
            { label: 'Utilities', amount: 86000 },
            { label: 'Property Management', amount: 60000 },
            { label: 'Payroll and Administration', amount: 28000 },
          ],
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
          unit_mix: [
            { label: '1BR', count: 32, current_rent: 1850, market_rent: 2050, avg_sqft: 720 },
            { label: '2BR', count: 32, current_rent: 1881.25, market_rent: 2425, avg_sqft: 940 },
          ],
          units: [
            { unit_number: '101', label: '1BR', current_rent: 1850, market_rent: 2050 },
            { unit_number: '201', label: '2BR', current_rent: 1881.25, market_rent: 2425 },
          ],
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
    disclosures: [{
      code: 'SOURCE_RECONCILIATION_DISCLOSURE',
      text: 'InvestorIQ has not reconciled this variance and does not infer the cause.',
    }],
    source_reconciliation_state: {
      status: 'source_reconciliation_required',
      t12_gpr: 1718400,
      t12_gpr_source: 't12Payload.gross_potential_rent',
      rr_annual_in_place: 1432800,
      rr_annual_in_place_source: 'rentRollPayload.total_in_place_annual',
      difference_amount: -285600,
      variance_pct: -0.166201,
      source_reconciliation_disclosure:
        'Accepted Rent Roll annual in-place rent differs from accepted T12 Gross Potential Rent.',
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

function buildInputs(jobId = 'premium-receipt-map-job') {
  const sourceTruthPackage = buildSourceTruth(jobId);
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-25',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  return {
    financialIntelligence,
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({
      underwritingInputContract,
    }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({
      underwritingInputContract,
    }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({
      underwritingInputContract,
    }),
  };
}

const inputs = buildInputs();
const receiptMap = buildPremiumAcquisitionUnderwritingV1ReceiptMap(inputs);

assert.equal(isCanonicalPremiumAcquisitionUnderwritingV1ReceiptMap(receiptMap, inputs), true);
assert.equal(receiptMap.policy.receiptMappingOnly, true);
assert.equal(receiptMap.policy.recalculationAllowed, false);
assert.equal(receiptMap.policy.customerSurfaceAuthorized, false);
assert.equal(receiptMap.policy.rendererEligible, false);
assert.equal(receiptMap.integration.connected, false);
assert.equal(receiptMap.reportPublicationBlocker, false);
assert.equal(Object.isFrozen(receiptMap), true);
assert.equal(Object.isFrozen(receiptMap.receipts[0]), true);

const currentDebtService = receiptMap.receipts.find(
  (receipt) => receipt.calculationKey === 'currentDebtAnnualDebtService',
);
const currentDebtDscr = receiptMap.receipts.find(
  (receipt) => receipt.calculationKey === 'currentDebtDscr',
);
assert.equal(currentDebtService.result, 471000);
assert.equal(currentDebtDscr.result, 2.006369);
assert.equal(currentDebtService.sectionKey, 'debtCapacityAndCoverage');

const minimumEquity = receiptMap.receipts.find(
  (receipt) => receipt.calculationKey === 'purchasePriceLessProposedLoan',
);
const upstreamMinimumEquity = inputs.capitalStructureAnalysis.section.calculations.find(
  (receipt) => receipt.calculationKey === 'purchasePriceLessProposedLoan',
);
assert.equal(minimumEquity.result, 4050000);
assert.equal(minimumEquity.result, upstreamMinimumEquity.result);
assert.equal(
  minimumEquity.label,
  'Minimum Purchase-Price Equity Before Transaction Costs',
);
assert.match(minimumEquity.qualification, /not a complete equity requirement/i);
assert.equal(minimumEquity.lineage.receiptMappedWithoutRecalculation, true);

const appraisalBridge = receiptMap.receipts.find(
  (receipt) => receipt.calculationKey === 'appraisedValueLessPurchasePrice',
);
assert.equal(appraisalBridge.result, 700000);
assert.equal(appraisalBridge.sectionKey, 'valuationAndAppraisalBridge');
assert.equal(appraisalBridge.customerSurfaceAuthorized, false);
assert.equal(appraisalBridge.rendererEligible, false);

assert.equal('inputContract' in receiptMap, false);
assert.equal('rawUploads' in receiptMap, false);
assert.equal('customerSurfaceModel' in receiptMap, false);
assert.equal(
  receiptMap.receipts.every((receipt) => receipt.lineage.receiptMappedWithoutRecalculation === true),
  true,
);

const tamperedSourceCase = structuredClone(inputs.sourceCaseAnalysis);
tamperedSourceCase.sections.sourceCaseOperating.calculations[0].result = 1;
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1ReceiptMap({
    ...inputs,
    sourceCaseAnalysis: tamperedSourceCase,
  }),
  /CANONICAL_SOURCE_CASE_ANALYSIS_REQUIRED/,
);

const mismatchedInputs = buildInputs('different-premium-job');
assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1ReceiptMap({
    ...inputs,
    valuationAnalysis: mismatchedInputs.valuationAnalysis,
  }),
  /UPSTREAM_JOB_IDENTITY_MISMATCH/,
);

console.log('premium-acquisition-underwriting-v1 receipt-map smoke passed');
