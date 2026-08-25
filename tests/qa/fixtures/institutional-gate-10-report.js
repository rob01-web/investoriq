import { constrainCanonicalSourcePackageToSourceTruth } from '../../../api/_lib/source-truth-package.js';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../../api/_lib/institutional-financial-intelligence.js';
import { buildAcquisitionMemoProjection } from '../../../api/_lib/acquisition-memo-projection.js';
import { buildAcquisitionMemoBossContract } from '../../../api/_lib/acquisition-memo-boss-contract.js';
import { buildAcquisitionMemoV2CustomerSurfaceModel } from '../../../api/_lib/acquisition-memo-v2-customer-surface-model.js';
import {
  renderAcquisitionMemo,
  renderCompleteAcquisitionMemoV2Html,
} from '../../../api/_lib/acquisition-memo-v2-document.js';

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
    accepted_facts: facts,
    accepted_fact_evidence: factEvidence,
    section_eligibility: sectionEligibility,
    primary_for_role: true,
    authority_decision: {
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

export function buildInstitutionalGate10ReportFixture(jobId = 'gate-10-report-job') {
  const purchaseAssumptions = acceptedSupport({
    fileId: 'purchase-file',
    filename: 'Institutional_Acquisition_Assumptions_With_Long_Source_Name.pdf',
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
    filename: 'Institutional_Current_Debt_Statement_With_Long_Source_Name.pdf',
    role: 'current_debt_context',
    facts: {
      current_outstanding_balance: 6800000,
      interest_rate: 0.0485,
      amortization_remaining_years: 24,
      monthly_payment: 39250,
      maturity_date: '2029-11-01',
    },
    factEvidence: {
      current_outstanding_balance: evidence(6800000, 'Current Outstanding Balance $6,800,000'),
      interest_rate: evidence(4.85, 'Interest Rate 4.85%', 0.0485),
      amortization_remaining_years: evidence(24, 'Amortization Remaining 24 years'),
      monthly_payment: evidence(39250, 'Monthly Payment $39,250'),
      maturity_date: evidence('2029-11-01', 'Maturity Date 2029-11-01'),
    },
    sectionEligibility: { currentDebt: true },
  });
  const capitalPlan = acceptedSupport({
    fileId: 'capital-plan-file',
    filename: 'Institutional_Capital_Plan_With_Long_Source_Name.pdf',
    role: 'property_condition_context',
    facts: {
      total_capital_plan_amount: 1280000,
      capital_plan_duration_months: 24,
    },
    factEvidence: {
      total_capital_plan_amount: evidence(1280000, 'Total Capital Plan $1,280,000'),
      capital_plan_duration_months: evidence(24, 'Implementation Schedule 24 months'),
    },
    sectionEligibility: { capitalPlan: true },
  });
  const appraisal = acceptedSupport({
    fileId: 'appraisal-file',
    filename: 'Institutional_Appraisal_Context_With_Long_Source_Name.pdf',
    role: 'appraisal_context',
    facts: {
      appraisal_value: 14200000,
      stabilized_noi: 1050000,
      stabilized_cap_rate: 0.074,
    },
    factEvidence: {
      appraisal_value: evidence(14200000, 'Appraised Value $14,200,000'),
      stabilized_noi: evidence(1050000, 'Stabilized NOI $1,050,000'),
      stabilized_cap_rate: evidence(7.4, 'Stabilized Cap Rate 7.40%', 0.074),
    },
    sectionEligibility: { appraisal: true },
  });
  const renovation = acceptedSupport({
    fileId: 'renovation-file',
    filename: 'Institutional_Renovation_Context_With_Long_Source_Name.pdf',
    role: 'renovation_capex_context',
    facts: {
      total_renovation_budget: 1280000,
      capital_plan_start_month: 1,
      capital_plan_end_month: 24,
      capital_plan_duration_months: 24,
      renovation_plan_rows: [
        { category: '1BR Interiors', unit_type: '1BR', unit_count: 20, cost_per_unit: 18500, expected_monthly_rent_lift: 225, start_month: 1, end_month: 18 },
        { category: '2BR Interiors', unit_type: '2BR', unit_count: 18, cost_per_unit: 24000, expected_monthly_rent_lift: 325, start_month: 1, end_month: 24 },
        { category: 'Common Area Refresh', stated_amount: 210000 },
      ],
    },
    factEvidence: {
      total_renovation_budget: evidence(1280000, 'Total Renovation Budget $1,280,000'),
      renovation_plan_rows: [
        evidence(null, '1BR Interiors 20 units X $18,500/unit; expected rent lift $225/month; Months 1-18'),
        evidence(null, '2BR Interiors 18 units X $24,000/unit; expected rent lift $325/month; Months 1-24'),
        evidence(null, 'Common Area Refresh $210,000'),
      ],
    },
    sectionEligibility: { renovation: true },
  });
  const marketSurvey = acceptedSupport({
    fileId: 'market-survey-file',
    filename: 'Institutional_Market_Survey_Context_With_Long_Source_Name.pdf',
    role: 'market_survey_context',
    facts: {
      market_rent_ranges: [
        { unit_type: '1BR', low_monthly_rent: 2100, high_monthly_rent: 2250 },
        { unit_type: '2BR', low_monthly_rent: 2500, high_monthly_rent: 2700 },
      ],
    },
    factEvidence: {
      market_rent_ranges: [
        evidence(null, '1BR $2,100-$2,250'),
        evidence(null, '2BR $2,500-$2,700'),
      ],
    },
    sectionEligibility: { marketSurvey: true },
  });
  const environmental = acceptedSupport({
    fileId: 'environmental-file',
    filename: 'Institutional_Phase_I_ESA_Context_With_Long_Source_Name.pdf',
    role: 'environmental_context',
    facts: { phase_i_status: 'none_identified_in_summary' },
    factEvidence: {
      phase_i_status: evidence('None identified in this summary', 'Recognized Environmental Conditions: None identified in this summary.', 'none_identified_in_summary'),
    },
    sectionEligibility: { environmental: true },
  });
  const sourceTruthPackage = {
    source: 'canonical_source_truth_package',
    schema_version: 1,
    job_id: jobId,
    property_name: 'Institutional Gate 10 Property',
    core_publishable: true,
    true_blockers: [],
    core: {
      t12: {
        status: 'accepted_complete',
        artifact_id: 't12-artifact',
        file_id: 't12-file',
        original_filename: 'Institutional_T12_Operating_Statement_With_Long_Source_Name.xlsx',
        accepted_facts: {
          gross_potential_rent: 1612800,
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
        original_filename: 'Institutional_Rent_Roll_With_Long_Source_Name.xlsx',
        accepted_facts: {
          total_units: 64,
          occupancy: 0.9375,
          annual_in_place_rent: 1432800,
          annual_market_rent: 1718400,
          unit_mix: [
            { label: '1BR', count: 32, current_rent: 1850, market_rent: 2050 },
            { label: '2BR', count: 32, current_rent: 1881.25, market_rent: 2425 },
          ],
          units: [
            { unit_number: '101', label: '1BR', current_rent: 1850, market_rent: 2050 },
            { unit_number: '201', label: '2BR', current_rent: 1881.25, market_rent: 2425 },
          ],
        },
      },
    },
    support: {
      accepted: [purchaseAssumptions, currentDebt, capitalPlan, appraisal, renovation, marketSurvey, environmental],
      advisory: [],
      rejected: [],
      adjudication_decisions: [
        purchaseAssumptions.authority_decision,
        currentDebt.authority_decision,
        capitalPlan.authority_decision,
        appraisal.authority_decision,
        renovation.authority_decision,
        marketSurvey.authority_decision,
        environmental.authority_decision,
      ],
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
      t12_gpr: 1612800,
      rr_annual_in_place: 1432800,
      difference_amount: -180000,
      variance_pct: -180000 / 1612800,
      source_reconciliation_disclosure: 'InvestorIQ has not reconciled this variance and does not infer the cause.',
    },
  };
  const sourcePackage = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruthPackage);
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-17',
  });
  const acquisitionMemoProjection = buildAcquisitionMemoProjection(sourcePackage, { financialIntelligence });
  const coreMetrics = {
    units: 64,
    occupancy: 0.9375,
    annualInPlaceRent: 1432800,
    annualMarketRent: 1718400,
    egi: 1500000,
    opEx: 555000,
    noi: 945000,
    expenseRatio: 0.37,
    noiMargin: 0.63,
    breakEvenOccupancy: 555000 / 1612800,
    purchasePrice: 13500000,
    goingInCapRate: 0.07,
  };
  const reportMeta = {
    reportType: 'underwriting',
    reportMode: 'v1_core',
    reportTier: 2,
    visibleClassification: 'Review - Source Reconciliation Disclosure',
    generatedAt: '2026-07-17T12:00:00.000Z',
    propertyName: 'Institutional Gate 10 Property',
    propertyAddress: '100 Main Street',
    propertyTitle: 'Institutional Gate 10 Property',
  };
  const propertyProfile = {
    propertyName: 'Institutional Gate 10 Property',
    propertyAddress: '100 Main Street',
    propertyTitle: 'Institutional Gate 10 Property',
  };
  const bossContract = buildAcquisitionMemoBossContract({
    canonicalSourcePackage: sourcePackage,
    sourceTruthPackage,
    acquisitionMemoProjection,
    financialIntelligence,
    coreMetrics,
    t12Payload: sourceTruthPackage.core.t12.accepted_facts,
    propertyProfile,
    reportMeta,
    reportMode: 'v1_core',
  });
  const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
    canonicalSourcePackage: sourcePackage,
    acquisitionMemoProjection,
    bossContract,
    financialIntelligence,
    coreMetrics,
    propertyProfile,
    reportMeta,
    reportMode: 'v1_core',
  });
  const renderedAcquisitionMemo = renderAcquisitionMemo(acquisitionMemoProjection);
  const html = renderCompleteAcquisitionMemoV2Html({
    acquisitionMemoProjection,
    renderedAcquisitionMemo,
    sourcePackage,
    sourceTruthPackage,
    t12Payload: sourceTruthPackage.core.t12.accepted_facts,
    coreMetrics,
    reportMeta,
    propertyProfile,
    bossContract,
    customerSurfaceModel,
    financialIntelligence,
  });
  return {
    sourceTruthPackage,
    sourcePackage,
    financialIntelligence,
    acquisitionMemoProjection,
    coreMetrics,
    reportMeta,
    propertyProfile,
    bossContract,
    customerSurfaceModel,
    renderedAcquisitionMemo,
    html,
  };
}
