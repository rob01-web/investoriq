import assert from 'node:assert/strict';

import { constrainCanonicalSourcePackageToSourceTruth } from '../../api/_lib/source-truth-package.js';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
  isCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import { buildAcquisitionMemoProjection } from '../../api/_lib/acquisition-memo-projection.js';
import {
  buildAcquisitionMemoBossContract,
  validateAcquisitionMemoBossContract,
  validateAcquisitionMemoRenderAgainstBossContract,
} from '../../api/_lib/acquisition-memo-boss-contract.js';
import {
  buildAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2CustomerSurfaceModel,
  validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel,
} from '../../api/_lib/acquisition-memo-v2-customer-surface-model.js';
import { renderCompleteAcquisitionMemoV2Html } from '../../api/_lib/acquisition-memo-v2-document.js';
import { buildDeterministicReportContractQaSeal } from '../../api/_lib/deterministic-report-contract-qa-seal.js';
import {
  buildReportQualityManifestCandidate,
  finalizeReportQualityManifest,
  validateReportQualityManifest,
} from '../../api/_lib/report-quality-manifest.js';
import { inspectFinalPdfPublicationQuality } from '../../api/_lib/final-pdf-publication-quality-boss.js';
import { buildReportQualityIncidentProjection } from '../../api/_lib/report-quality-incident-projection.js';

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
    maturity_date: '2031-07-16',
    rate_structure: 'fixed',
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
    maturity_date: evidence('2031-07-16', 'Maturity Date 2031-07-16'),
    rate_structure: evidence('fixed', 'Fixed interest rate'),
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

const propertyCondition = acceptedSupport({
  fileId: 'property-condition-file',
  filename: 'Property Condition Assessment.pdf',
  role: 'property_condition_context',
  facts: {
    total_capital_plan_amount: 1200000,
    capital_reserve_balance: 350000,
    annual_reserve_contribution: 64000,
    deferred_maintenance_status: 'identified',
    deferred_maintenance_amount: 180000,
    immediate_capital_amount: 200000,
    near_term_capital_amount: 600000,
    long_term_capital_amount: 400000,
    capital_plan_duration_months: 24,
  },
  factEvidence: {
    total_capital_plan_amount: evidence(1200000, 'Total Capital Plan $1,200,000'),
    capital_reserve_balance: evidence(350000, 'Capital Reserve Balance $350,000'),
    annual_reserve_contribution: evidence(64000, 'Annual Reserve Contribution $64,000'),
    deferred_maintenance_status: evidence('identified', 'Deferred Maintenance Identified'),
    deferred_maintenance_amount: evidence(180000, 'Deferred Maintenance Identified $180,000'),
    immediate_capital_amount: evidence(200000, 'Immediate Capital Needs $200,000'),
    near_term_capital_amount: evidence(600000, 'Near-Term Capital Needs $600,000'),
    long_term_capital_amount: evidence(400000, 'Long-Term Capital Needs $400,000'),
    capital_plan_duration_months: evidence(24, 'Implementation Schedule 24 months'),
  },
  sectionEligibility: { capitalPlan: true },
});

const sourceTruthPackage = {
  source: 'canonical_source_truth_package',
  schema_version: 1,
  job_id: 'gate-4g-job',
  property_name: 'Gate 4G Property',
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
        unit_mix: [
          { label: 'All Units', count: 64, current_rent: 1865.625, market_rent: 2237.5 },
        ],
        units: [{ label: 'All Units', unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
      },
    },
  },
  support: {
    accepted: [purchaseAssumptions, currentDebt, propertyCondition],
    advisory: [],
    rejected: [],
    adjudication_decisions: [
      purchaseAssumptions.authority_decision,
      currentDebt.authority_decision,
      propertyCondition.authority_decision,
    ],
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

const sourcePackage = constrainCanonicalSourcePackageToSourceTruth(null, sourceTruthPackage);
const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage,
  asOfDate: '2026-07-16',
});
assert.equal(isCanonicalInstitutionalFinancialIntelligence(financialIntelligence), true);
const markerOnlyFinancialIntelligence = {
  source: 'canonical_institutional_financial_intelligence',
  receiptVersion: 1,
};
assert.equal(isCanonicalInstitutionalFinancialIntelligence(markerOnlyFinancialIntelligence), false);
assert.throws(
  () => buildAcquisitionMemoProjection(sourcePackage, {
    financialIntelligence: markerOnlyFinancialIntelligence,
  }),
  /CANONICAL_INSTITUTIONAL_FINANCIAL_INTELLIGENCE_REQUIRED/
);
assert.equal(Object.isFrozen(financialIntelligence), true);
assert.equal(financialIntelligence.reportPublicationBlocker, false);
assert.equal(financialIntelligence.analyses.debtService.currentDebt.annualDebtService, 471000);
assert.equal(financialIntelligence.analyses.dscr.currentDebt.displayRatio, 2.01);
assert.equal(financialIntelligence.analyses.dscr.proposedFinancing.displayRatio, 1.4);
assert.equal(financialIntelligence.analyses.debtRisk.lenderFee.lenderFeeDollars, 80325);
assert.equal(financialIntelligence.analyses.coreReconciliation.reconciliation.differenceAmount, -285600);
assert.equal(financialIntelligence.analyses.capitalPlan.analysis.capitalPlans[0].reserveComparison.reserveLessRequirementAmount, -850000);
assert.equal(financialIntelligence.customerSections.debtServiceCoverage.displayReady, true);
assert.equal(financialIntelligence.customerSections.debtTermAnalysis.displayReady, true);
assert.equal(financialIntelligence.customerSections.coreReconciliation.displayReady, true);
assert.equal(financialIntelligence.customerSections.capitalPlanAnalysis.displayReady, true);
assert.equal(financialIntelligence.policy.thresholdInferenceAllowed, false);
assert.equal(financialIntelligence.policy.scenarioInferenceAllowed, false);

const projection = buildAcquisitionMemoProjection(sourcePackage, { financialIntelligence });
assert.equal(projection.financialIntelligence, financialIntelligence);
assert.equal(projection.sourceReconciliation.state.status, 'source_reconciliation_required');
assert.equal(projection.sourceReconciliation.state.materiality_classification, null);

const reportMeta = {
  reportType: 'underwriting',
  reportMode: 'v1_core',
  reportTier: 2,
  visibleClassification: 'Stable',
  generatedAt: '2026-07-16T12:00:00.000Z',
  propertyName: 'Gate 4G Property',
  propertyAddress: '100 Main Street',
  propertyTitle: 'Gate 4G Property',
};
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
  breakEvenOccupancy: 555000 / 1718400,
  purchasePrice: 13500000,
  goingInCapRate: 0.07,
};
const propertyProfile = {
  propertyName: 'Gate 4G Property',
  propertyAddress: '100 Main Street',
  propertyTitle: 'Gate 4G Property',
};
const bossContract = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  sourceTruthPackage,
  acquisitionMemoProjection: projection,
  financialIntelligence,
  coreMetrics,
  t12Payload: sourceTruthPackage.core.t12.accepted_facts,
  propertyProfile,
  reportMeta,
  reportMode: 'v1_core',
});
assert.equal(validateAcquisitionMemoBossContract(bossContract).ok, true);
assert.equal(bossContract.forbiddenSurfaces.includes('DSCR'), false);
assert.equal(bossContract.forbiddenSurfaces.includes('refinance'), true);
assert.equal(bossContract.sections.debtServiceCoverage.status, 'required');
assert.equal(bossContract.sections.capitalPlanAnalysis.status, 'required');

const customerSurfaceModel = buildAcquisitionMemoV2CustomerSurfaceModel({
  canonicalSourcePackage: sourcePackage,
  acquisitionMemoProjection: projection,
  bossContract,
  financialIntelligence,
  coreMetrics,
  propertyProfile,
  reportMeta,
  reportMode: 'v1_core',
});
assert.equal(validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel).ok, true);
assert.equal(customerSurfaceModel.sections.debtServiceCoverage.factAvailability.sourceBacked, true);
assert.equal(customerSurfaceModel.sections.coreReconciliation.factAvailability.sourceBacked, true);

const html = renderCompleteAcquisitionMemoV2Html({
  acquisitionMemoProjection: projection,
  renderedAcquisitionMemo: {},
  sourcePackage,
  t12Payload: sourceTruthPackage.core.t12.accepted_facts,
  coreMetrics,
  reportMeta,
  propertyProfile,
  bossContract,
  customerSurfaceModel,
  financialIntelligence,
});
assert.match(html, /Debt Service and Coverage/);
assert.match(html, /<td>All Units<\/td>/);
assert.match(html, /Current Debt[\s\S]*?2\.01x/);
assert.match(html, /Proposed Acquisition Financing[\s\S]*?1\.40x/);
assert.match(html, /Debt Term and Maturity Analysis/);
assert.match(html, /Proposed Lender Fee[\s\S]*?\$80,325/);
assert.match(html, /Core Source Reconciliation/);
assert.match(html, /Rent Roll less T12[\s\S]*?\(\$285,600\)/);
assert.match(html, /Capital Plan and Reserve Position/);
assert.match(html, /Capital Plan 1 Reserve less Requirement[\s\S]*?\(\$850,000\)/);
assert.doesNotMatch(html, /\b(?:AI|LLM|parser|prompt)\b/i);
assert.doesNotMatch(html, /[\u2013\u2014]/);
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(bossContract, html).ok, true);
const customerHtmlValidation = validateAcquisitionMemoV2HtmlAgainstCustomerSurfaceModel(html, customerSurfaceModel);
assert.equal(customerHtmlValidation.ok, true, JSON.stringify(customerHtmlValidation.issues, null, 2));

const deterministicSeal = buildDeterministicReportContractQaSeal({
  html,
  reportIdentity: { reportMode: 'v1_core', reportType: 'underwriting', reportTier: 2 },
  sourceReconciliation: customerSurfaceModel.sourceTruth.sourceReconciliation,
  breakEven: customerSurfaceModel.financialTruth.breakEvenOccupancy,
  supportSections: customerSurfaceModel.sections,
  financialIntelligence,
  grossRentCapitalizationAuthorized: false,
});
assert.equal(deterministicSeal.ok, true, JSON.stringify(deterministicSeal.issues, null, 2));
const markerOnlySeal = buildDeterministicReportContractQaSeal({
  html,
  reportIdentity: { reportMode: 'v1_core', reportType: 'underwriting', reportTier: 2 },
  sourceReconciliation: customerSurfaceModel.sourceTruth.sourceReconciliation,
  breakEven: customerSurfaceModel.financialTruth.breakEvenOccupancy,
  supportSections: customerSurfaceModel.sections,
  financialIntelligence: markerOnlyFinancialIntelligence,
  grossRentCapitalizationAuthorized: false,
});
assert.equal(markerOnlySeal.ok, false);
assert.equal(markerOnlySeal.issues.some(
  (issue) => issue.code === 'FINANCIAL_INTELLIGENCE_RECEIPT_INVALID'
), true);

const plainText = html
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&#39;/gi, "'")
  .replace(/&copy;/gi, 'copyright')
  .replace(/\s+/g, ' ')
  .trim();
const pdfBoss = await inspectFinalPdfPublicationQuality({
  pdfBytes: Buffer.from('local-proof'),
  approvedHtml: html,
  deterministicContractQaSeal: deterministicSeal,
  sourceReconciliation: customerSurfaceModel.sourceTruth.sourceReconciliation,
  financialIntelligence,
  requiredTextAnchors: ['Acquisition Memo'],
  artifactMode: 'production_pdf',
  publicationTarget: 'internal_test',
  pdfAnalysis: {
    validPdf: true,
    byteLength: 1000,
    pageCount: 1,
    text: plainText,
    pages: [{ pageNumber: 1, text: plainText, width: 612, height: 792, items: [], lines: [] }],
  },
});
assert.equal(pdfBoss.ok, true, JSON.stringify(pdfBoss.issues, null, 2));
assert.equal(pdfBoss.approved_surface.financial_intelligence_required_section_count, 4);
const markerOnlyPdfBoss = await inspectFinalPdfPublicationQuality({
  pdfBytes: Buffer.from('local-proof'),
  approvedHtml: html,
  deterministicContractQaSeal: deterministicSeal,
  sourceReconciliation: customerSurfaceModel.sourceTruth.sourceReconciliation,
  financialIntelligence: markerOnlyFinancialIntelligence,
  requiredTextAnchors: ['Acquisition Memo'],
  artifactMode: 'production_pdf',
  publicationTarget: 'internal_test',
  pdfAnalysis: {
    validPdf: true,
    byteLength: 1000,
    pageCount: 1,
    text: plainText,
    pages: [{ pageNumber: 1, text: plainText, width: 612, height: 792, items: [], lines: [] }],
  },
});
assert.equal(markerOnlyPdfBoss.ok, false);
assert.equal(markerOnlyPdfBoss.issues.some(
  (issue) => issue.code === 'PDF_FINANCIAL_INTELLIGENCE_RECEIPT_SURFACE_MISMATCH'
), true);

const deliveryDecision = {
  source: 'canonical_delivery_decision',
  delivery_gate_status: 'deliverable',
  customer_delivery_allowed: true,
  hold_delivery: false,
  customer_publish_eligible: true,
};
const candidate = buildReportQualityManifestCandidate({
  jobId: 'gate-4g-job',
  reportFamily: 'acquisition_memo',
  reportType: 'underwriting',
  reportMode: 'v1_core',
  propertyName: 'Gate 4G Property',
  generatedAt: reportMeta.generatedAt,
  sourceTruthPackage,
  customerSurfaceModel,
  customerSurfaceModelValidation: validateAcquisitionMemoV2CustomerSurfaceModel(customerSurfaceModel),
  customerSurfaceHtmlValidation: customerHtmlValidation,
  deterministicContractQaSeal: deterministicSeal,
  bossCompliance: { ok: true, status: 'pass', violations: [] },
  deliveryDecision,
  finalPdfPublicationQualityBoss: pdfBoss,
});
assert.equal(validateReportQualityManifest(candidate).ok, true);
assert.equal(candidate.receipts.institutionalFinancialIntelligence.source, 'canonical_institutional_financial_intelligence');
assert.equal(candidate.calculations.some((receipt) => receipt.calculationKey === 'currentDebtDscr' && receipt.result === financialIntelligence.analyses.dscr.currentDebt.ratio), true);
assert.equal(candidate.calculations.some((receipt) => receipt.calculationKey === 'coreRentDifference' && receipt.result === -285600), true);

const finalManifest = finalizeReportQualityManifest({
  candidate,
  reportId: 'gate-4g-report',
  storagePath: 'reports/gate-4g-report.pdf',
  deliveryDecision,
  finalPdfPublicationQualityBoss: pdfBoss,
});
const incident = buildReportQualityIncidentProjection({
  manifest: finalManifest,
  canonicalDeliveryDecision: deliveryDecision,
});
assert.equal(incident.financialIntelligence.source, 'canonical_institutional_financial_intelligence');
assert.equal(incident.financialIntelligence.eligibleCalculationCount > 0, true);
assert.equal(incident.calculations.some((receipt) => receipt.calculationKey === 'proposedFinancingDscr'), true);

const coreOnlySourceTruth = {
  ...sourceTruthPackage,
  job_id: 'gate-4g-core-only-job',
  support: { accepted: [], advisory: [], rejected: [], adjudication_decisions: [], conflicts: [], fact_conflicts: [], duplicates: [] },
};
const coreOnlyFinancialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage: coreOnlySourceTruth,
  asOfDate: '2026-07-16',
});
assert.equal(coreOnlyFinancialIntelligence.customerSections.debtServiceCoverage.displayReady, false);
assert.equal(coreOnlyFinancialIntelligence.customerSections.debtTermAnalysis.displayReady, false);
assert.equal(coreOnlyFinancialIntelligence.customerSections.coreReconciliation.displayReady, true);
assert.equal(coreOnlyFinancialIntelligence.customerSections.capitalPlanAnalysis.displayReady, false);
assert.equal(coreOnlyFinancialIntelligence.reportPublicationBlocker, false);

const legacyProjection = buildAcquisitionMemoProjection(sourcePackage);
const legacyBoss = buildAcquisitionMemoBossContract({
  canonicalSourcePackage: sourcePackage,
  sourceTruthPackage,
  acquisitionMemoProjection: legacyProjection,
  coreMetrics,
  t12Payload: sourceTruthPackage.core.t12.accepted_facts,
  propertyProfile,
  reportMeta,
  reportMode: 'v1_core',
});
assert.equal(legacyBoss.forbiddenSurfaces.includes('DSCR'), true);
assert.equal(validateAcquisitionMemoRenderAgainstBossContract(legacyBoss, `${html}<p>DSCR</p>`).ok, false);

console.log('institutional-financial-intelligence-integration-smoke: PASS');
