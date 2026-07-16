import { isCanonicalSourceTruthPackage } from './source-truth-package.js';

const CONTRACT_SOURCE = 'canonical_debt_service_input_contract';
const CONTRACT_VERSION = 1;
const ACCEPTED_CORE_STATES = new Set(['accepted_complete', 'accepted_constrained']);

const SUPPORT_FACT_SPECS = Object.freeze({
  current_outstanding_balance: { kind: 'positive_number' },
  interest_rate: { kind: 'rate' },
  amortization_remaining_years: { kind: 'positive_number' },
  monthly_payment: { kind: 'positive_number' },
  maturity_date: { kind: 'text' },
  purchase_price: { kind: 'positive_number' },
  proposed_loan_amount: { kind: 'positive_number' },
  ltv: { kind: 'positive_ratio' },
  amortization_years: { kind: 'positive_number' },
  lender_fee_percent: { kind: 'rate' },
});

const ROLE_FAMILY = Object.freeze({
  current_debt_context: 'current_debt',
  purchase_assumptions: 'acquisition_financing',
});

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function hasOwn(source, key) {
  return Boolean(source && Object.prototype.hasOwnProperty.call(source, key));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function normalizedFactValue(value, spec) {
  if (spec?.kind === 'text') return text(value) || null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (spec?.kind === 'positive_number' && numeric <= 0) return null;
  if (spec?.kind === 'positive_ratio' && numeric <= 0) return null;
  if (spec?.kind === 'rate' && (numeric < 0 || numeric > 1)) return null;
  return numeric;
}

function valuesMatch(left, right) {
  if (typeof left === 'number') {
    const numericRight = Number(right);
    if (!Number.isFinite(numericRight)) return false;
    return Math.abs(left - numericRight) <= Math.max(1e-9, Math.abs(left) * 1e-9);
  }
  return text(left) === text(right);
}

function evidenceMatchesAcceptedFact(evidence, acceptedValue) {
  if (!evidence || typeof evidence !== 'object') return false;
  if (!text(evidence.excerpt) || !text(evidence.method)) return false;
  const evidencedValue = evidence.normalizedValue ?? evidence.sourceValue;
  if (evidencedValue === null || evidencedValue === undefined || evidencedValue === '') return false;
  return valuesMatch(acceptedValue, evidencedValue);
}

function decisionMatchesRole(decision, role) {
  if (!decision || typeof decision !== 'object') return false;
  if (text(decision.canonicalRole) === role) return true;
  const family = ROLE_FAMILY[role];
  return Boolean(family && decision?.semanticEvidence?.families?.[family]?.hasAffirmativeEvidence === true);
}

function roleAuthorityState(sourceTruthPackage, role) {
  const acceptedEntries = toArray(sourceTruthPackage?.support?.accepted)
    .filter((entry) => text(entry?.canonical_role) === role);
  const primaryEntries = acceptedEntries.filter((entry) => entry?.primary_for_role === true);
  const decisions = toArray(sourceTruthPackage?.support?.adjudication_decisions)
    .filter((decision) => decisionMatchesRole(decision, role));
  const conflictIds = new Set(toArray(sourceTruthPackage?.support?.conflicts).map(text).filter(Boolean));
  const duplicateIds = new Set(toArray(sourceTruthPackage?.support?.duplicates).map(text).filter(Boolean));
  const roleConflictIds = decisions.map((decision) => text(decision?.fileId)).filter((id) => conflictIds.has(id));
  const roleDuplicateIds = decisions.map((decision) => text(decision?.fileId)).filter((id) => duplicateIds.has(id));
  const primary = primaryEntries.length === 1 && roleConflictIds.length === 0 ? primaryEntries[0] : null;
  const sourcePresent = acceptedEntries.length > 0 || decisions.some((decision) => decision?.sourcePresent === true);
  const conflictState = roleConflictIds.length > 0 || primaryEntries.length > 1
    ? 'conflicting'
    : acceptedEntries.length > 0 && !primary
      ? 'accepted_without_single_primary'
      : 'none';

  return {
    sourcePresent,
    roleAccepted: acceptedEntries.length > 0,
    primaryAccepted: Boolean(primary),
    conflictState,
    primary,
    acceptedSourceCount: acceptedEntries.length,
    conflictFileIds: [...new Set(roleConflictIds)],
    duplicateFileIds: [...new Set(roleDuplicateIds)],
  };
}

function buildSupportFact(entry, role, factName) {
  const spec = SUPPORT_FACT_SPECS[factName];
  const rawValue = entry?.accepted_facts?.[factName];
  const value = normalizedFactValue(rawValue, spec);
  const factAccepted = Boolean(entry && hasOwn(entry.accepted_facts, factName) && value !== null);
  const evidence = factAccepted ? entry?.accepted_fact_evidence?.[factName] || null : null;
  const sourceBacked = factAccepted && evidenceMatchesAcceptedFact(evidence, value);
  return {
    factName,
    value: factAccepted ? value : null,
    sourcePresent: Boolean(entry),
    roleAccepted: Boolean(entry),
    factAccepted,
    sourceBacked,
    evidenceState: !factAccepted ? 'fact_not_accepted' : sourceBacked ? 'exact_source_evidence_bound' : 'accepted_fact_evidence_missing_or_mismatched',
    provenance: sourceBacked
      ? {
          authorityBasis: 'canonical_source_truth_package',
          sourceIdentityKey: `file:${text(entry.file_id)}`,
          fileId: text(entry.file_id) || null,
          artifactId: entry.artifact_id || null,
          canonicalRole: role,
          factPath: `support.accepted_facts.${factName}`,
          evidenceExcerpt: text(evidence.excerpt),
          evidenceMethod: text(evidence.method),
          sourceValue: evidence.sourceValue ?? null,
          normalizedValue: evidence.normalizedValue ?? value,
        }
      : null,
  };
}

function buildCoreNoiFact(sourceTruthPackage) {
  const t12 = sourceTruthPackage?.core?.t12 || null;
  const roleAccepted = Boolean(t12 && ACCEPTED_CORE_STATES.has(text(t12.status)));
  const rawNoi = t12?.accepted_facts?.net_operating_income;
  const value = Number(rawNoi);
  const factAccepted = roleAccepted && hasOwn(t12?.accepted_facts, 'net_operating_income') && Number.isFinite(value);
  return {
    factName: 'net_operating_income',
    value: factAccepted ? value : null,
    sourcePresent: Boolean(t12),
    roleAccepted,
    factAccepted,
    sourceBacked: factAccepted,
    evidenceState: factAccepted ? 'canonical_core_validation_bound' : 'canonical_t12_noi_not_accepted',
    provenance: factAccepted
      ? {
          authorityBasis: 'canonical_source_truth_package',
          sourceIdentityKey: `file:${text(t12.file_id)}`,
          fileId: text(t12.file_id) || null,
          artifactId: t12.artifact_id || null,
          canonicalRole: 'core_t12',
          factPath: 'core.t12.accepted_facts.net_operating_income',
          coreValidationState: text(t12.status),
        }
      : null,
  };
}

function buildFactBundle({ method, facts, requiredFacts, authorityState }) {
  const missingFacts = requiredFacts.filter((factName) => facts[factName]?.factAccepted !== true);
  const evidenceGaps = requiredFacts.filter(
    (factName) => facts[factName]?.factAccepted === true && facts[factName]?.sourceBacked !== true
  );
  const eligible = Boolean(
    authorityState.primaryAccepted &&
    authorityState.conflictState === 'none' &&
    missingFacts.length === 0 &&
    evidenceGaps.length === 0
  );
  const eligibilityState = eligible
    ? 'eligible'
    : authorityState.conflictState !== 'none'
      ? 'ineligible_conflicting_or_noncanonical_primary'
      : !authorityState.sourcePresent
        ? 'ineligible_source_not_present'
        : missingFacts.length > 0
          ? 'ineligible_missing_accepted_facts'
          : evidenceGaps.length > 0
            ? 'ineligible_evidence_gap'
            : 'ineligible_role_not_accepted';
  return {
    method,
    requiredFacts,
    factAccepted: missingFacts.length === 0,
    sourceBacked: eligible,
    eligibleForDeterministicCalculation: eligible,
    eligibilityState,
    missingFacts,
    evidenceGaps,
    acceptedProvenanceFields: eligible
      ? requiredFacts.map((factName) => facts[factName].provenance)
      : [],
  };
}

function buildDscrEligibility({ debtServiceBundles, noiFact, authorityState }) {
  const selectedBundle = debtServiceBundles.find((bundle) => bundle.eligibleForDeterministicCalculation) || null;
  const diagnosticBundle = selectedBundle || [...debtServiceBundles].sort((left, right) =>
    (left.missingFacts.length + left.evidenceGaps.length) -
      (right.missingFacts.length + right.evidenceGaps.length)
  )[0] || null;
  const eligible = Boolean(selectedBundle && noiFact.sourceBacked && authorityState.conflictState === 'none');
  return {
    eligible,
    selectedDebtServiceMethod: selectedBundle?.method || null,
    candidateDebtServiceMethod: diagnosticBundle?.method || null,
    eligibilityState: eligible
      ? 'eligible'
      : authorityState.conflictState !== 'none'
        ? 'ineligible_conflicting_debt_authority'
        : !selectedBundle
          ? 'ineligible_debt_service_bundle'
          : 'ineligible_canonical_t12_noi',
    requiredAcceptedInputs: diagnosticBundle
      ? [...diagnosticBundle.requiredFacts, 'net_operating_income']
      : ['net_operating_income'],
    missingInputs: [
      ...(diagnosticBundle ? diagnosticBundle.missingFacts : []),
      ...(noiFact.factAccepted ? [] : ['net_operating_income']),
    ],
    evidenceGaps: [
      ...(diagnosticBundle ? diagnosticBundle.evidenceGaps : []),
      ...(noiFact.factAccepted && !noiFact.sourceBacked ? ['net_operating_income'] : []),
    ],
  };
}

function sectionStatus(authorityState, dscrEligibility, debtServiceBundles) {
  if (dscrEligibility.eligible) return 'ready_for_downstream_calculation';
  if (authorityState.conflictState !== 'none') return 'collapse_conflicting_authority';
  if (!authorityState.sourcePresent) return 'collapse_source_not_present';
  if (debtServiceBundles.some((bundle) => bundle.eligibleForDeterministicCalculation)) {
    return 'qualify_missing_canonical_noi';
  }
  return 'collapse_incomplete_fact_bundle';
}

function buildRoleContract({ sourceTruthPackage, role, factNames, bundleDefinitions, noiFact }) {
  const authorityState = roleAuthorityState(sourceTruthPackage, role);
  const facts = Object.fromEntries(
    factNames.map((factName) => [factName, buildSupportFact(authorityState.primary, role, factName)])
  );
  const debtServiceBundles = bundleDefinitions.map((definition) => buildFactBundle({
    ...definition,
    facts,
    authorityState,
  }));
  const dscrEligibility = buildDscrEligibility({ debtServiceBundles, noiFact, authorityState });
  return {
    canonicalRole: role,
    sourcePresent: authorityState.sourcePresent,
    roleAccepted: authorityState.roleAccepted,
    primaryAccepted: authorityState.primaryAccepted,
    factAccepted: Object.values(facts).some((fact) => fact.factAccepted),
    sourceBacked: debtServiceBundles.some((bundle) => bundle.sourceBacked),
    conflictState: authorityState.conflictState,
    acceptedSourceCount: authorityState.acceptedSourceCount,
    conflictFileIds: authorityState.conflictFileIds,
    duplicateFileIds: authorityState.duplicateFileIds,
    sourceIdentityKey: authorityState.primary ? `file:${text(authorityState.primary.file_id)}` : null,
    facts,
    debtServiceBundles,
    dscrEligibility,
    sectionStatus: sectionStatus(authorityState, dscrEligibility, debtServiceBundles),
    reportPublicationBlocker: false,
  };
}

export function isCanonicalDebtServiceInputContract(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === CONTRACT_SOURCE &&
    value.contractVersion === CONTRACT_VERSION
  );
}

export function buildCanonicalDebtServiceInputContract({ sourceTruthPackage } = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error('CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_DEBT_SERVICE_INPUT_CONTRACT');
  }

  const noiFact = buildCoreNoiFact(sourceTruthPackage);
  const currentDebt = buildRoleContract({
    sourceTruthPackage,
    role: 'current_debt_context',
    factNames: [
      'current_outstanding_balance',
      'interest_rate',
      'amortization_remaining_years',
      'monthly_payment',
      'maturity_date',
    ],
    bundleDefinitions: [
      {
        method: 'source_stated_monthly_payment',
        requiredFacts: ['monthly_payment'],
      },
      {
        method: 'deterministic_amortization_model',
        requiredFacts: ['current_outstanding_balance', 'interest_rate', 'amortization_remaining_years'],
      },
    ],
    noiFact,
  });
  const proposedFinancing = buildRoleContract({
    sourceTruthPackage,
    role: 'purchase_assumptions',
    factNames: [
      'purchase_price',
      'proposed_loan_amount',
      'ltv',
      'interest_rate',
      'amortization_years',
      'lender_fee_percent',
    ],
    bundleDefinitions: [
      {
        method: 'deterministic_amortization_model',
        requiredFacts: ['proposed_loan_amount', 'interest_rate', 'amortization_years'],
      },
    ],
    noiFact,
  });

  return deepFreeze({
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    sourceTruth: {
      source: sourceTruthPackage.source,
      schemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id || null,
      corePublishable: sourceTruthPackage.core_publishable === true,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      calculationsPerformed: false,
      rendererBehaviorChanged: false,
      missingNumericValuesRemainNull: true,
      optionalDebtFailureMayBlockCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    coreInputs: {
      netOperatingIncome: noiFact,
    },
    currentDebt,
    proposedFinancing,
  });
}
