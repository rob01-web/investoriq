import { isCanonicalSourceTruthPackage } from './source-truth-package.js';

const CONTRACT_SOURCE = 'canonical_capital_plan_input_contract';
const CONTRACT_VERSION = 1;
const ACCEPTED_CORE_STATES = new Set(['accepted_complete', 'accepted_constrained']);
const CAPITAL_ROLES = Object.freeze({
  renovation_capex_context: { planFactName: 'total_renovation_budget' },
  property_condition_context: { planFactName: 'total_capital_plan_amount' },
  appraisal_context: { planFactName: null },
});
const FACT_SPECS = Object.freeze({
  total_renovation_budget: { kind: 'positive_number' },
  total_capital_plan_amount: { kind: 'nonnegative_number' },
  capital_reserve_balance: { kind: 'nonnegative_number' },
  annual_reserve_contribution: { kind: 'nonnegative_number' },
  deferred_maintenance_amount: { kind: 'nonnegative_number' },
  deferred_maintenance_status: { kind: 'enum', allowedValues: ['identified', 'none_identified'] },
  immediate_capital_amount: { kind: 'nonnegative_number' },
  near_term_capital_amount: { kind: 'nonnegative_number' },
  long_term_capital_amount: { kind: 'nonnegative_number' },
  capital_plan_start_month: { kind: 'nonnegative_integer' },
  capital_plan_end_month: { kind: 'nonnegative_integer' },
  capital_plan_duration_months: { kind: 'positive_integer' },
});
const ROLE_FACTS = Object.freeze({
  renovation_capex_context: [
    'total_renovation_budget',
    'capital_reserve_balance',
    'annual_reserve_contribution',
    'deferred_maintenance_amount',
    'deferred_maintenance_status',
    'immediate_capital_amount',
    'near_term_capital_amount',
    'long_term_capital_amount',
    'capital_plan_start_month',
    'capital_plan_end_month',
    'capital_plan_duration_months',
  ],
  property_condition_context: [
    'total_capital_plan_amount',
    'capital_reserve_balance',
    'annual_reserve_contribution',
    'deferred_maintenance_amount',
    'deferred_maintenance_status',
    'immediate_capital_amount',
    'near_term_capital_amount',
    'long_term_capital_amount',
    'capital_plan_start_month',
    'capital_plan_end_month',
    'capital_plan_duration_months',
  ],
  appraisal_context: [
    'capital_reserve_balance',
    'annual_reserve_contribution',
    'deferred_maintenance_amount',
    'deferred_maintenance_status',
  ],
});
const CONSENSUS_FACTS = Object.freeze([
  'capital_reserve_balance',
  'annual_reserve_contribution',
  'deferred_maintenance_amount',
  'deferred_maintenance_status',
]);
const CAPITAL_FACT_NAMES = new Set(Object.keys(FACT_SPECS));

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
  if (spec?.kind === 'enum') {
    const normalized = text(value).toLowerCase();
    return spec.allowedValues.includes(normalized) ? normalized : null;
  }
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (spec?.kind === 'positive_number' && numeric <= 0) return null;
  if (spec?.kind === 'nonnegative_number' && numeric < 0) return null;
  if (spec?.kind === 'positive_integer' && (!Number.isInteger(numeric) || numeric <= 0)) return null;
  if (spec?.kind === 'nonnegative_integer' && (!Number.isInteger(numeric) || numeric < 0)) return null;
  return numeric;
}

function valuesMatch(left, right) {
  if (typeof left === 'number') {
    const numericRight = Number(right);
    if (!Number.isFinite(numericRight)) return false;
    return Math.abs(left - numericRight) <= Math.max(0.000001, Math.abs(left) * 1e-9);
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

function buildSupportFact(entry, role, factName) {
  const spec = FACT_SPECS[factName];
  const rawValue = entry?.accepted_facts?.[factName];
  const value = normalizedFactValue(rawValue, spec);
  const factAccepted = Boolean(entry && hasOwn(entry.accepted_facts, factName) && value !== null);
  const evidence = factAccepted ? entry?.accepted_fact_evidence?.[factName] || null : null;
  const sourceBacked = factAccepted && evidenceMatchesAcceptedFact(evidence, value);
  return {
    factName,
    value: factAccepted ? value : null,
    sourcePresent: Boolean(entry),
    roleAccepted: Boolean(entry?.authority_decision?.roleAccepted === true),
    factAccepted,
    sourceBacked,
    evidenceState: !factAccepted
      ? 'fact_not_accepted'
      : sourceBacked
        ? 'exact_source_evidence_bound'
        : 'accepted_fact_evidence_missing_or_mismatched',
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

function buildCapitalSource(entry) {
  const role = text(entry?.canonical_role);
  const facts = Object.fromEntries(
    toArray(ROLE_FACTS[role]).map((factName) => [factName, buildSupportFact(entry, role, factName)])
  );
  const sourceBackedFacts = Object.values(facts)
    .filter((fact) => fact.sourceBacked)
    .map((fact) => fact.factName);
  return {
    canonicalRole: role,
    sourceIdentityKey: `file:${text(entry?.file_id)}`,
    fileId: text(entry?.file_id) || null,
    artifactId: entry?.artifact_id || null,
    primaryForRole: entry?.primary_for_role === true,
    roleAccepted: entry?.authority_decision?.roleAccepted === true,
    sourceBacked: sourceBackedFacts.length > 0,
    planFactName: CAPITAL_ROLES[role]?.planFactName || null,
    facts,
    sourceBackedFacts,
  };
}

function buildTotalUnitsFact(sourceTruthPackage) {
  const rentRoll = sourceTruthPackage?.core?.rent_roll || null;
  const roleAccepted = Boolean(rentRoll && ACCEPTED_CORE_STATES.has(text(rentRoll.status)));
  const value = Number(rentRoll?.accepted_facts?.total_units);
  const factAccepted = roleAccepted && hasOwn(rentRoll?.accepted_facts, 'total_units') && Number.isFinite(value) && value > 0;
  return {
    factName: 'total_units',
    value: factAccepted ? value : null,
    sourcePresent: Boolean(rentRoll),
    roleAccepted,
    factAccepted,
    sourceBacked: factAccepted,
    evidenceState: factAccepted ? 'canonical_core_fact_bound' : 'accepted_total_units_not_available',
    provenance: factAccepted
      ? {
          authorityBasis: 'canonical_source_truth_package',
          sourceIdentityKey: `file:${text(rentRoll.file_id)}`,
          fileId: text(rentRoll.file_id) || null,
          artifactId: rentRoll.artifact_id || null,
          canonicalRole: 'core_rent_roll',
          factPath: 'core.rent_roll.accepted_facts.total_units',
          coreValidationState: text(rentRoll.status),
        }
      : null,
  };
}

function canonicalFactConflicts(sourceTruthPackage) {
  return toArray(sourceTruthPackage?.support?.fact_conflicts)
    .filter((entry) => CAPITAL_FACT_NAMES.has(text(entry?.fact_name)))
    .map((entry) => ({
      conflictType: 'canonical_same_role_fact_conflict',
      canonicalRole: text(entry?.canonical_role) || null,
      factName: text(entry?.fact_name) || null,
      sources: toArray(entry?.sources),
      decision: text(entry?.decision) || null,
      reportPublicationBlocker: false,
    }));
}

function consensusFact(capitalSources, factName, canonicalConflicts) {
  const sourceFacts = capitalSources
    .map((source) => ({ source, fact: source.facts[factName] }))
    .filter((entry) => entry.fact?.sourceBacked === true);
  const sameRoleConflicts = canonicalConflicts.filter((entry) => entry.factName === factName);
  if (sameRoleConflicts.length > 0) {
    return {
      factName,
      value: null,
      factAccepted: false,
      sourceBacked: false,
      evidenceState: 'canonical_fact_conflict',
      conflictState: 'conflicting',
      sourceIdentityKeys: [],
      provenance: [],
      conflictValues: sameRoleConflicts.flatMap((entry) => entry.sources),
    };
  }
  if (sourceFacts.length === 0) {
    return {
      factName,
      value: null,
      factAccepted: false,
      sourceBacked: false,
      evidenceState: 'fact_not_accepted',
      conflictState: 'none',
      sourceIdentityKeys: [],
      provenance: [],
      conflictValues: [],
    };
  }
  const distinctValues = [];
  for (const entry of sourceFacts) {
    if (!distinctValues.some((value) => valuesMatch(value, entry.fact.value))) distinctValues.push(entry.fact.value);
  }
  if (distinctValues.length > 1) {
    return {
      factName,
      value: null,
      factAccepted: false,
      sourceBacked: false,
      evidenceState: 'cross_role_fact_conflict',
      conflictState: 'conflicting',
      sourceIdentityKeys: [],
      provenance: [],
      conflictValues: sourceFacts.map((entry) => ({
        sourceIdentityKey: entry.source.sourceIdentityKey,
        canonicalRole: entry.source.canonicalRole,
        value: entry.fact.value,
      })),
    };
  }
  return {
    factName,
    value: distinctValues[0],
    factAccepted: true,
    sourceBacked: true,
    evidenceState: sourceFacts.length > 1 ? 'corroborated_exact_value' : 'single_canonical_source_value',
    conflictState: 'none',
    sourceIdentityKeys: sourceFacts.map((entry) => entry.source.sourceIdentityKey),
    provenance: sourceFacts.map((entry) => entry.fact.provenance),
    conflictValues: [],
  };
}

function capitalEvidencePresent(sourceTruthPackage, acceptedEntries) {
  if (acceptedEntries.some((entry) => toArray(ROLE_FACTS[text(entry?.canonical_role)]).some((factName) => hasOwn(entry?.accepted_facts, factName)))) {
    return true;
  }
  return toArray(sourceTruthPackage?.support?.adjudication_decisions).some((decision) => Boolean(
    decision?.semanticEvidence?.families?.property_condition?.hasAffirmativeEvidence === true ||
    decision?.semanticEvidence?.families?.renovation?.hasAffirmativeEvidence === true ||
    decision?.semanticEvidence?.families?.historical_capital?.hasAffirmativeEvidence === true
  ));
}

export function isCanonicalCapitalPlanInputContract(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === CONTRACT_SOURCE &&
    value.contractVersion === CONTRACT_VERSION
  );
}

export function buildCanonicalCapitalPlanInputContract({ sourceTruthPackage } = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error('CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_CAPITAL_PLAN_INPUT_CONTRACT');
  }

  const acceptedEntries = toArray(sourceTruthPackage?.support?.accepted)
    .filter((entry) => Boolean(CAPITAL_ROLES[text(entry?.canonical_role)]));
  const primaryEntries = acceptedEntries.filter((entry) => (
    entry?.primary_for_role === true &&
    entry?.authority_decision?.roleAccepted === true
  ));
  const capitalSources = primaryEntries
    .map(buildCapitalSource)
    .filter((source) => source.sourceBacked);
  const canonicalConflicts = canonicalFactConflicts(sourceTruthPackage);
  const consolidatedFacts = Object.fromEntries(
    CONSENSUS_FACTS.map((factName) => [factName, consensusFact(capitalSources, factName, canonicalConflicts)])
  );
  const crossSourceConflicts = Object.values(consolidatedFacts)
    .filter((fact) => fact.evidenceState === 'cross_role_fact_conflict')
    .map((fact) => ({
      conflictType: 'cross_role_fact_conflict',
      factName: fact.factName,
      sources: fact.conflictValues,
      reportPublicationBlocker: false,
    }));
  const conflicts = [...canonicalConflicts, ...crossSourceConflicts];
  const sourcePresent = capitalEvidencePresent(sourceTruthPackage, acceptedEntries);
  const eligibleForCapitalPlanAnalysis = capitalSources.length > 0;

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
      historicalCapitalPromotedToForwardPlan: false,
      missingNumericValuesRemainNull: true,
      arbitraryAdequacyThresholdAllowed: false,
      arbitrarySeverityClassificationAllowed: false,
      optionalCapitalFailureMayBlockValidatedCorePublication: false,
    },
    coreInputs: {
      totalUnits: buildTotalUnitsFact(sourceTruthPackage),
    },
    capitalSources,
    consolidatedFacts,
    conflicts,
    eligibility: {
      sourcePresent,
      acceptedPrimarySourceCount: capitalSources.length,
      eligibleForCapitalPlanAnalysis,
      status: eligibleForCapitalPlanAnalysis
        ? conflicts.length > 0
          ? 'eligible_with_narrow_fact_conflicts'
          : 'eligible'
        : sourcePresent
          ? 'ineligible_no_source_backed_capital_facts'
          : 'ineligible_capital_source_not_present',
    },
    sectionStatus: eligibleForCapitalPlanAnalysis
      ? conflicts.length > 0
        ? 'qualify_capital_fact_conflict'
        : 'ready_for_deterministic_capital_analysis'
      : sourcePresent
        ? 'collapse_capital_facts_not_accepted'
        : 'collapse_capital_source_not_present',
    reportPublicationBlocker: false,
  });
}
