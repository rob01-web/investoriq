import { isCanonicalSourceTruthPackage } from './source-truth-package.js';
import { isCanonicalReportIdentityReceipt } from './report-identity-authority.js';
import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  buildPremiumAcquisitionUnderwritingV1ReceiptMap,
} from './premium-acquisition-underwriting-v1-receipt-map.js';
import {
  buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis,
} from './premium-acquisition-underwriting-v1-deterministic-analysis.js';

const VALIDATED_MODEL_SOURCE = 'premium_acquisition_underwriting_v1_validated_model';
const VALIDATED_MODEL_VERSION = 1;

const CORE_FACTS = Object.freeze({
  t12: Object.freeze({
    gross_potential_rent: ['Gross Potential Rent', 'currency_per_year', 'operatingPerformance'],
    effective_gross_income: ['Effective Gross Income', 'currency_per_year', 'operatingPerformance'],
    total_operating_expenses: ['Total Operating Expenses', 'currency_per_year', 'expenseStructure'],
    net_operating_income: ['Net Operating Income', 'currency_per_year', 'operatingPerformance'],
    income_lines: ['Income Detail', 'structured_rows', 'operatingPerformance'],
    expense_lines: ['Expense Detail', 'structured_rows', 'expenseStructure'],
  }),
  rent_roll: Object.freeze({
    total_units: ['Total Units', 'units', 'propertyAndTransactionContext'],
    occupancy: ['Physical Occupancy', 'ratio', 'rentRollAndUnitEconomics'],
    annual_in_place_rent: ['Annual In-Place Rent', 'currency_per_year', 'rentRollAndUnitEconomics'],
    annual_market_rent: ['Annual Market Rent', 'currency_per_year', 'rentRollAndUnitEconomics'],
    unit_mix: ['Unit Mix and Accepted Rent Detail', 'structured_rows', 'rentRollAndUnitEconomics'],
    units: ['Accepted Unit Detail', 'structured_rows', 'supportingAppendices'],
  }),
});

const SUPPORT_FACTS = Object.freeze({
  purchase_assumptions: Object.freeze({
    purchase_price: ['Purchase Price', 'currency', 'propertyAndTransactionContext'],
    noi_basis: ['Purchase-Assumption NOI Basis', 'currency_per_year', 'valuationAndAppraisalBridge'],
    going_in_cap_rate: ['Source-Stated Going-In Capitalization Rate', 'ratio', 'valuationAndAppraisalBridge'],
    proposed_loan_amount: ['Proposed Acquisition Loan Amount', 'currency', 'currentAndProposedDebt'],
    ltv: ['Source-Stated Proposed Loan-to-Value', 'ratio', 'currentAndProposedDebt'],
    interest_rate: ['Proposed Acquisition Interest Rate', 'ratio', 'currentAndProposedDebt'],
    amortization_years: ['Proposed Acquisition Amortization', 'years', 'currentAndProposedDebt'],
    loan_term_years: ['Proposed Acquisition Loan Term', 'years', 'currentAndProposedDebt'],
    lender_fee_percent: ['Proposed Lender Fee Rate', 'ratio', 'currentAndProposedDebt'],
    maturity_date: ['Proposed Acquisition Maturity Date', 'date', 'currentAndProposedDebt'],
    rate_structure: ['Proposed Acquisition Rate Structure', 'text', 'currentAndProposedDebt'],
  }),
  current_debt_context: Object.freeze({
    current_outstanding_balance: ['Current Outstanding Balance', 'currency', 'currentAndProposedDebt'],
    interest_rate: ['Current Debt Interest Rate', 'ratio', 'currentAndProposedDebt'],
    amortization_remaining_years: ['Current Debt Remaining Amortization', 'years', 'currentAndProposedDebt'],
    monthly_payment: ['Current Monthly Payment', 'currency_per_month', 'currentAndProposedDebt'],
    maturity_date: ['Current Debt Maturity Date', 'date', 'currentAndProposedDebt'],
    rate_structure: ['Current Debt Rate Structure', 'text', 'currentAndProposedDebt'],
  }),
  appraisal_context: Object.freeze({
    appraised_value: ['Accepted Appraised Value', 'currency', 'valuationAndAppraisalBridge'],
    appraisal_noi: ['Appraisal NOI Reference', 'currency_per_year', 'valuationAndAppraisalBridge'],
    appraisal_cap_rate: ['Appraisal Capitalization Rate Reference', 'ratio', 'valuationAndAppraisalBridge'],
  }),
  property_condition_context: Object.freeze({
    total_capital_plan_amount: ['Total Capital Plan Amount', 'currency', 'capitalPlanEvidence'],
    capital_reserve_balance: ['Capital Reserve Balance', 'currency', 'capitalPlanEvidence'],
    annual_reserve_contribution: ['Annual Reserve Contribution', 'currency_per_year', 'capitalPlanEvidence'],
    deferred_maintenance_status: ['Deferred Maintenance Status', 'text', 'capitalPlanEvidence'],
    deferred_maintenance_amount: ['Deferred Maintenance Amount', 'currency', 'capitalPlanEvidence'],
    immediate_capital_amount: ['Immediate Capital Amount', 'currency', 'capitalPlanEvidence'],
    near_term_capital_amount: ['Near-Term Capital Amount', 'currency', 'capitalPlanEvidence'],
    long_term_capital_amount: ['Long-Term Capital Amount', 'currency', 'capitalPlanEvidence'],
    capital_plan_duration_months: ['Capital Plan Duration', 'months', 'capitalPlanEvidence'],
  }),
  renovation_capex_context: Object.freeze({
    total_renovation_budget: ['Total Renovation Budget', 'currency', 'capitalPlanEvidence'],
    capital_plan_start_month: ['Capital Plan Start Month', 'month_number', 'capitalPlanEvidence'],
    capital_plan_end_month: ['Capital Plan End Month', 'month_number', 'capitalPlanEvidence'],
    capital_plan_duration_months: ['Capital Plan Duration', 'months', 'capitalPlanEvidence'],
    renovation_plan_rows: ['Document-Stated Renovation Plan', 'structured_rows', 'capitalPlanEvidence'],
  }),
  market_survey_context: Object.freeze({
    market_rent_ranges: ['Document-Stated Market Rent Ranges', 'structured_rows', 'marketEvidence'],
  }),
  environmental_context: Object.freeze({
    phase_i_status: ['Phase I Environmental Status', 'text', 'environmentalEvidence'],
  }),
});

const PROHIBITED_CALCULATION_PATTERNS = Object.freeze([
  /(^|:)irr($|:)/i,
  /equityMultiple/i,
  /cashOnCash/i,
  /exitValue/i,
  /discountedCashFlow/i,
  /renovationRoi/i,
  /refinanceProceeds/i,
  /recommendation/i,
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function text(value) {
  return String(value ?? '').trim();
}

function baseSections() {
  return Object.fromEntries(
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS.map((sectionKey) => [
      sectionKey,
      {
        sectionKey,
        status: 'collapsed',
        customerSurfaceEligible: false,
        facts: [],
        calculations: [],
        lineage: [],
        collapseReason: 'NO_ELIGIBLE_ACCEPTED_EVIDENCE',
      },
    ]),
  );
}

function acceptedCoreEntry(entry) {
  return Boolean(
    entry &&
    ['accepted_complete', 'accepted_constrained'].includes(text(entry.status)) &&
    text(entry.file_id) &&
    entry.accepted_facts &&
    typeof entry.accepted_facts === 'object',
  );
}

function acceptedSupportEntry(entry) {
  const decision = entry?.authority_decision;
  return Boolean(
    entry &&
    entry.primary_for_role === true &&
    text(entry.file_id) &&
    text(entry.canonical_role) &&
    decision?.roleAccepted === true &&
    text(decision.canonicalRole) === text(entry.canonical_role) &&
    (!text(decision.fileId) || text(decision.fileId) === text(entry.file_id)) &&
    entry.accepted_facts &&
    typeof entry.accepted_facts === 'object',
  );
}

function fact({
  factKey,
  label,
  value,
  units,
  canonicalRole,
  sourcePath,
  fileId,
  artifactId = null,
  debtRole = null,
}) {
  return {
    factKey,
    label,
    value: clone(value),
    units,
    canonicalRole,
    debtRole,
    sourceBacked: true,
    provenance: {
      authorityBasis: 'canonical_source_truth_package',
      sourceIdentityKey: `file:${fileId}`,
      fileId,
      artifactId,
      canonicalRole,
      factPath: sourcePath,
    },
  };
}

function addFact(sections, sectionKey, factValue) {
  sections[sectionKey].facts.push(factValue);
  sections[sectionKey].lineage.push(factValue.provenance);
}

function mapCoreFacts(sourceTruthPackage, sections) {
  for (const [coreKey, specs] of Object.entries(CORE_FACTS)) {
    const entry = sourceTruthPackage.core?.[coreKey];
    if (!acceptedCoreEntry(entry)) continue;
    const canonicalRole = coreKey === 't12' ? 'core_t12' : 'core_rent_roll';
    for (const [factKey, [label, units, sectionKey]] of Object.entries(specs)) {
      if (!Object.prototype.hasOwnProperty.call(entry.accepted_facts, factKey)) continue;
      const value = entry.accepted_facts[factKey];
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      addFact(sections, sectionKey, fact({
        factKey,
        label,
        value,
        units,
        canonicalRole,
        sourcePath: `core.${coreKey}.accepted_facts.${factKey}`,
        fileId: text(entry.file_id),
        artifactId: entry.artifact_id || null,
      }));
    }
  }
}

function mapSupportFacts(sourceTruthPackage, sections) {
  for (const entry of sourceTruthPackage.support.accepted) {
    if (!acceptedSupportEntry(entry)) continue;
    const canonicalRole = text(entry.canonical_role);
    const specs = SUPPORT_FACTS[canonicalRole];
    if (!specs) continue;
    for (const [factKey, [label, units, sectionKey]] of Object.entries(specs)) {
      if (!Object.prototype.hasOwnProperty.call(entry.accepted_facts, factKey)) continue;
      const value = entry.accepted_facts[factKey];
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      addFact(sections, sectionKey, fact({
        factKey,
        label,
        value,
        units,
        canonicalRole,
        debtRole: canonicalRole === 'current_debt_context'
          ? 'current_debt'
          : canonicalRole === 'purchase_assumptions' && [
              'proposed_loan_amount',
              'ltv',
              'interest_rate',
              'amortization_years',
              'loan_term_years',
              'lender_fee_percent',
              'maturity_date',
              'rate_structure',
            ].includes(factKey)
            ? 'proposed_acquisition_debt'
            : null,
        sourcePath: `support.accepted_facts.${factKey}`,
        fileId: text(entry.file_id),
        artifactId: entry.artifact_id || null,
      }));
    }
  }
}

function evidenceRegister(sourceTruthPackage) {
  const rows = [];
  for (const [disposition, entries] of [
    ['accepted', sourceTruthPackage.support.accepted],
    ['advisory', sourceTruthPackage.support.advisory],
    ['rejected', sourceTruthPackage.support.rejected],
  ]) {
    for (const entry of entries) {
      rows.push({
        disposition,
        canonicalRole: text(entry?.canonical_role) || null,
        filename: text(entry?.original_filename) || null,
        fileId: text(entry?.file_id) || null,
        acceptedFactNames: disposition === 'accepted'
          ? Object.keys(entry?.accepted_facts || {}).sort()
          : [],
        sourceTreatment: disposition === 'accepted'
          ? entry?.primary_for_role === true
            ? 'accepted_primary'
            : 'accepted_non_primary'
          : disposition,
        severity: null,
        recommendation: null,
      });
    }
  }
  return rows;
}

function addEvidenceAndReconciliation(sourceTruthPackage, sections) {
  const register = evidenceRegister(sourceTruthPackage);
  if (register.length > 0) {
    const registerFact = {
      factKey: 'evidence_and_diligence_register',
      label: 'Evidence and Diligence Register',
      value: register,
      units: 'structured_rows',
      canonicalRole: 'source_truth_support_register',
      debtRole: null,
      sourceBacked: true,
      provenance: {
        authorityBasis: 'canonical_source_truth_package',
        sourceIdentityKey: `job:${text(sourceTruthPackage.job_id)}`,
        fileId: null,
        artifactId: null,
        canonicalRole: 'source_truth_support_register',
        factPath: 'support',
      },
    };
    addFact(sections, 'evidenceAndDiligenceRegister', registerFact);
  }

  const reconciliation = sourceTruthPackage.source_reconciliation_state;
  if (reconciliation && typeof reconciliation === 'object') {
    const selected = {
      status: text(reconciliation.status) || null,
      t12GrossPotentialRent: reconciliation.t12_gpr ?? null,
      rentRollAnnualInPlaceRent: reconciliation.rr_annual_in_place ?? null,
      differenceAmount: reconciliation.difference_amount ?? null,
      varianceRatio: reconciliation.variance_pct ?? null,
      disclosure: text(reconciliation.source_reconciliation_disclosure) || null,
    };
    const reconciliationFact = {
      factKey: 'source_reconciliation',
      label: 'Source Reconciliation',
      value: selected,
      units: 'structured_record',
      canonicalRole: 'source_reconciliation',
      debtRole: null,
      sourceBacked: true,
      provenance: {
        authorityBasis: 'canonical_source_truth_package',
        sourceIdentityKey: `job:${text(sourceTruthPackage.job_id)}`,
        fileId: null,
        artifactId: null,
        canonicalRole: 'source_reconciliation',
        factPath: 'source_reconciliation_state',
      },
    };
    addFact(sections, 'sourceReconciliation', reconciliationFact);
  }
}

function addCalculations(sections, receiptMap, deterministicAnalysis) {
  for (const receipt of [...receiptMap.receipts, ...deterministicAnalysis.receipts]) {
    if (!sections[receipt.sectionKey]) continue;
    const mapped = clone(receipt);
    mapped.customerSurfaceEligible = mapped.status === 'calculated';
    mapped.customerSurfaceAuthorized = false;
    mapped.rendererEligible = false;
    sections[receipt.sectionKey].calculations.push(mapped);
    sections[receipt.sectionKey].lineage.push(...clone(receipt.inputProvenance || []));
  }
}

function addMethodsSection(sections, receiptMap, deterministicAnalysis) {
  const rows = [...receiptMap.receipts, ...deterministicAnalysis.receipts]
    .filter((receipt) => receipt.status === 'calculated')
    .map((receipt) => ({
      calculationKey: receipt.calculationKey,
      label: receipt.label,
      formula: receipt.formula,
      formulaVersion: receipt.formulaVersion,
      units: receipt.units,
      qualification: receipt.qualification || null,
      limitationCodes: clone(receipt.limitationCodes || []),
    }));
  if (rows.length === 0) return;
  const methodsFact = {
    factKey: 'methods_definitions_and_limitations',
    label: 'Methods, Definitions, and Limitations',
    value: rows,
    units: 'structured_rows',
    canonicalRole: 'deterministic_calculation_receipts',
    debtRole: null,
    sourceBacked: true,
    provenance: {
      authorityBasis: 'canonical_deterministic_receipts',
      sourceIdentityKey: `job:${receiptMap.jobId}`,
      fileId: null,
      artifactId: null,
      canonicalRole: 'deterministic_calculation_receipts',
      factPath: 'premium_receipts',
    },
  };
  addFact(sections, 'methodsDefinitionsAndLimitations', methodsFact);
}

function finalizeSections(sections) {
  for (const section of Object.values(sections)) {
    const eligibleFacts = section.facts.filter((item) => item.sourceBacked === true).length;
    const eligibleCalculations = section.calculations.filter(
      (item) => item.status === 'calculated' && item.sourceBound === true,
    ).length;
    const eligible = eligibleFacts + eligibleCalculations > 0;
    section.status = eligible ? 'eligible' : 'collapsed';
    section.customerSurfaceEligible = eligible;
    section.collapseReason = eligible ? null : 'NO_ELIGIBLE_ACCEPTED_EVIDENCE';
    section.coverage = {
      eligibleFactCount: eligibleFacts,
      eligibleCalculationCount: eligibleCalculations,
      collapsedCalculationCount: section.calculations.length - eligibleCalculations,
    };
  }
}

function validatePremiumAcquisitionUnderwritingV1ValidatedModel(model) {
  const issues = [];
  const issue = (code, path, message) => issues.push({
    code,
    severity: 'critical',
    path,
    message,
  });

  if (!model || typeof model !== 'object') {
    issue('PREMIUM_VALIDATED_MODEL_INVALID', 'model', 'Premium validated model must be an object.');
    return { ok: false, status: 'invalid', issues };
  }
  if (model.source !== VALIDATED_MODEL_SOURCE || model.modelVersion !== VALIDATED_MODEL_VERSION) {
    issue('PREMIUM_VALIDATED_MODEL_VERSION_INVALID', 'model', 'Premium validated model version is unsupported.');
  }
  if (model.identity?.identityKey !== 'underwriting' || model.identity?.canonicalTitle !== 'Underwriting Report') {
    issue('PREMIUM_UNDERWRITING_IDENTITY_REQUIRED', 'model.identity', 'Canonical Underwriting Report identity is required.');
  }
  if (model.coreDeliveryReceipt?.corePublishable !== true) {
    issue('PREMIUM_CORE_DELIVERY_INELIGIBLE', 'model.coreDeliveryReceipt', 'Premium validation requires canonical core publishability.');
  }
  if (model.integration?.connected !== false || model.integration?.rendererInsertionPresent !== false) {
    issue('PREMIUM_MODEL_CONNECTED_BEFORE_RENDERER_PHASE', 'model.integration', 'Phase 4 validated model must remain disconnected.');
  }
  for (const key of ['deliveryAuthority', 'publicationAuthority', 'workerAuthority', 'billingAuthority', 'remedyAuthority']) {
    if (model.authority?.[key] !== false) {
      issue('PREMIUM_PROTECTED_AUTHORITY_PRESENT', `model.authority.${key}`, `Premium model may not hold ${key}.`);
    }
  }

  const sectionKeys = Object.keys(model.sections || {});
  if (
    sectionKeys.length !== PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS.length ||
    !PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS.every((key) => sectionKeys.includes(key))
  ) {
    issue('PREMIUM_SECTION_CONTRACT_INCOMPLETE', 'model.sections', 'Every premium section slot is required.');
  }

  const allCalculations = Object.values(model.sections || {}).flatMap(
    (section) => section.calculations || [],
  );
  const receiptKeys = allCalculations.map((receipt) => (
    receipt.premiumReceiptKey || `${receipt.formulaVersion}:${receipt.calculationKey}`
  ));
  if (new Set(receiptKeys).size !== receiptKeys.length) {
    issue('PREMIUM_DUPLICATE_CALCULATION_RECEIPT', 'model.sections', 'Premium calculation receipts must be unique.');
  }
  for (const receipt of allCalculations) {
    if (PROHIBITED_CALCULATION_PATTERNS.some((pattern) => pattern.test(receipt.calculationKey))) {
      issue('PREMIUM_UNAUTHORIZED_CALCULATION_PRESENT', `calculation.${receipt.calculationKey}`, 'An unauthorized calculation is present.');
    }
    if (
      receipt.status === 'calculated' &&
      (
        receipt.sourceBound !== true ||
        !Number.isFinite(receipt.result) ||
        !Array.isArray(receipt.inputProvenance) ||
        receipt.inputProvenance.length === 0
      )
    ) {
      issue('PREMIUM_CALCULATED_RECEIPT_LINEAGE_INVALID', `calculation.${receipt.calculationKey}`, 'Calculated receipts require finite results and canonical lineage.');
    }
    if (
      receipt.customerSurfaceAuthorized !== false ||
      receipt.rendererEligible !== false ||
      receipt.reportPublicationBlocker !== false
    ) {
      issue('PREMIUM_RECEIPT_PREMATURE_AUTHORITY', `calculation.${receipt.calculationKey}`, 'Phase 4 receipts may not hold renderer or publication authority.');
    }
  }

  const debtFacts = Object.values(model.sections || {}).flatMap((section) => section.facts || [])
    .filter((item) => item.canonicalRole === 'current_debt_context' || item.debtRole);
  for (const item of debtFacts) {
    if (
      item.canonicalRole === 'current_debt_context' && item.debtRole !== 'current_debt' ||
      item.canonicalRole === 'purchase_assumptions' && item.debtRole !== 'proposed_acquisition_debt'
    ) {
      issue('PREMIUM_DEBT_ROLE_SEPARATION_INVALID', `fact.${item.factKey}`, 'Current and proposed debt roles must remain explicit and separate.');
    }
  }

  const eligibleSectionCount = Object.values(model.sections || {}).filter(
    (section) => section.status === 'eligible' && section.customerSurfaceEligible === true,
  ).length;
  if (eligibleSectionCount === 0) {
    issue('PREMIUM_NO_ELIGIBLE_SECTIONS', 'model.sections', 'At least one source-backed premium section is required.');
  }

  return {
    ok: issues.length === 0,
    status: issues.length === 0 ? 'valid_disconnected_expansion_model' : 'invalid',
    issues,
    eligibleSectionCount,
    premiumCertified: false,
    certificationStage: 'not_started',
  };
}

function buildPremiumAcquisitionUnderwritingV1ValidatedModel({
  sourceTruthPackage,
  reportIdentityReceipt,
  financialIntelligence,
  underwritingInputContract,
  sourceCaseAnalysis,
  valuationAnalysis,
  capitalStructureAnalysis,
} = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error('CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_PREMIUM_VALIDATED_MODEL');
  }
  if (!isCanonicalReportIdentityReceipt(reportIdentityReceipt) || reportIdentityReceipt.identityKey !== 'underwriting') {
    throw new Error('CANONICAL_UNDERWRITING_REPORT_IDENTITY_REQUIRED_FOR_PREMIUM_VALIDATED_MODEL');
  }
  const receiptMap = buildPremiumAcquisitionUnderwritingV1ReceiptMap({
    financialIntelligence,
    sourceCaseAnalysis,
    valuationAnalysis,
    capitalStructureAnalysis,
  });
  const deterministicAnalysis = buildPremiumAcquisitionUnderwritingV1DeterministicAnalysis({
    underwritingInputContract,
    financialIntelligence,
  });
  const jobId = text(sourceTruthPackage.job_id);
  if (
    !jobId ||
    jobId !== receiptMap.jobId ||
    jobId !== deterministicAnalysis.jobId
  ) {
    throw new Error('PREMIUM_VALIDATED_MODEL_UPSTREAM_JOB_IDENTITY_MISMATCH');
  }

  const sections = baseSections();
  mapCoreFacts(sourceTruthPackage, sections);
  mapSupportFacts(sourceTruthPackage, sections);
  addEvidenceAndReconciliation(sourceTruthPackage, sections);
  addCalculations(sections, receiptMap, deterministicAnalysis);
  addMethodsSection(sections, receiptMap, deterministicAnalysis);
  finalizeSections(sections);

  const preliminary = {
    source: VALIDATED_MODEL_SOURCE,
    modelVersion: VALIDATED_MODEL_VERSION,
    doctrineVersion: 'premium_acquisition_underwriting_v1_doctrine_2026_07_25',
    jobId,
    phase: 'validated_disconnected_expansion_model',
    identity: clone(reportIdentityReceipt),
    coreDeliveryReceipt: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId,
      corePublishable: sourceTruthPackage.core_publishable === true,
      trueBlockerCount: Array.isArray(sourceTruthPackage.true_blockers)
        ? sourceTruthPackage.true_blockers.length
        : null,
    },
    authority: {
      sourceAuthority: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      workerAuthority: false,
      billingAuthority: false,
      remedyAuthority: false,
    },
    policy: {
      canonicalReceiptsOnly: true,
      deterministicMathOnly: true,
      sourceTruthMutationAllowed: false,
      rendererRecalculationAllowed: false,
      rawUploadsRetained: false,
      customerSurfaceModelConsumed: false,
      renderedHtmlConsumed: false,
      missingEvidenceCollapses: true,
      recommendationsAllowed: false,
      scenarioInferenceAllowed: false,
      legacyUnderwritingReuseAllowed: false,
      premiumCertificationSeparateFromCoreDelivery: true,
    },
    upstream: {
      receiptMap: {
        source: receiptMap.source,
        version: receiptMap.receiptMapVersion,
        jobId,
      },
      deterministicAnalysis: {
        source: deterministicAnalysis.source,
        version: deterministicAnalysis.analysisVersion,
        jobId,
      },
    },
    sections,
    integration: {
      connected: false,
      customerSurfaceEligible: false,
      rendererInsertionPresent: false,
      featureFlagEvaluated: false,
    },
    certification: {
      premiumCertified: false,
      stage: 'not_started',
      coreDeliveryEligibilityChanged: false,
    },
    reportPublicationBlocker: false,
  };
  const validation = validatePremiumAcquisitionUnderwritingV1ValidatedModel(preliminary);
  return deepFreeze({
    ...preliminary,
    validation,
  });
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_VALIDATED_MODEL_CONTRACT = deepFreeze({
  source: VALIDATED_MODEL_SOURCE,
  modelVersion: VALIDATED_MODEL_VERSION,
  sourceAuthority: false,
  deliveryAuthority: false,
  publicationAuthority: false,
  rendererInsertionPresent: false,
  premiumCertified: false,
});

export {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_VALIDATED_MODEL_CONTRACT,
  VALIDATED_MODEL_SOURCE,
  VALIDATED_MODEL_VERSION,
  buildPremiumAcquisitionUnderwritingV1ValidatedModel,
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
};
