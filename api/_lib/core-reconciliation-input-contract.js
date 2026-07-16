import { isCanonicalSourceTruthPackage } from './source-truth-package.js';

const CONTRACT_SOURCE = 'canonical_core_reconciliation_input_contract';
const CONTRACT_VERSION = 1;
const ACCEPTED_CORE_STATES = new Set(['accepted_complete', 'accepted_constrained']);
const T12_GPR_SOURCE_PATHS = Object.freeze({
  't12Payload.gross_potential_rent': 'gross_potential_rent',
  't12Payload.gross_scheduled_rent': 'gross_scheduled_rent',
});
const RENT_ROLL_ANNUAL_SOURCE_PATHS = new Set([
  'rentRollPayload.totals.in_place_rent_annual',
  'rentRollPayload.total_in_place_annual',
  'computedRentRoll.total_in_place_annual',
  'row_derived_units.monthly_rent_x_12',
  'weighted_avg_rent * total_units * 12',
]);

function text(value) {
  return String(value ?? '').trim();
}

function hasOwn(source, key) {
  return Boolean(source && Object.prototype.hasOwnProperty.call(source, key));
}

function finite(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function valuesMatch(left, right) {
  const leftNumber = finite(left);
  const rightNumber = finite(right);
  if (!Number.isFinite(leftNumber) || !Number.isFinite(rightNumber)) return false;
  return Math.abs(leftNumber - rightNumber) <= Math.max(0.01, Math.abs(leftNumber) * 1e-9);
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function coreRoleAccepted(entry) {
  return Boolean(entry && ACCEPTED_CORE_STATES.has(text(entry.status)));
}

function factReceipt({ factName, value, sourcePresent, roleAccepted, factAccepted, sourceBacked, evidenceState, provenance }) {
  return {
    factName,
    value: factAccepted ? value : null,
    sourcePresent,
    roleAccepted,
    factAccepted,
    sourceBacked,
    evidenceState,
    provenance: sourceBacked ? provenance : null,
  };
}

function buildT12GprFact(sourceTruthPackage) {
  const entry = sourceTruthPackage?.core?.t12 || null;
  const reconciliationState = sourceTruthPackage?.source_reconciliation_state || null;
  const sourcePresent = Boolean(entry);
  const roleAccepted = coreRoleAccepted(entry);
  const stateValue = finite(reconciliationState?.t12_gpr);
  const sourcePath = text(
    reconciliationState?.t12_gpr_source ||
    reconciliationState?.source_selection?.t12_gpr?.source_path
  );
  const acceptedFactName = T12_GPR_SOURCE_PATHS[sourcePath] || null;
  const acceptedValue = acceptedFactName ? finite(entry?.accepted_facts?.[acceptedFactName]) : null;
  const factAccepted = roleAccepted && Number.isFinite(stateValue) && stateValue > 0;
  const sourcePathAllowed = Boolean(acceptedFactName);
  const acceptedCoreFactPresent = Boolean(
    acceptedFactName &&
    hasOwn(entry?.accepted_facts, acceptedFactName) &&
    Number.isFinite(acceptedValue) &&
    acceptedValue > 0
  );
  const valueMatchesCoreFact = acceptedCoreFactPresent && valuesMatch(stateValue, acceptedValue);
  const sourceBacked = factAccepted && sourcePathAllowed && acceptedCoreFactPresent && valueMatchesCoreFact;
  const evidenceState = !sourcePresent
    ? 'core_t12_not_present'
    : !roleAccepted
      ? 'core_t12_not_accepted'
      : !factAccepted
        ? 't12_gpr_not_accepted_in_source_truth_reconciliation'
        : !sourcePathAllowed
          ? 't12_gpr_semantic_source_path_not_allowed'
          : !acceptedCoreFactPresent
            ? 't12_gpr_core_fact_not_present'
            : !valueMatchesCoreFact
              ? 't12_gpr_reconciliation_value_mismatches_core_fact'
              : 'canonical_core_fact_and_reconciliation_decision_bound';
  return factReceipt({
    factName: 't12_gross_potential_rent',
    value: stateValue,
    sourcePresent,
    roleAccepted,
    factAccepted,
    sourceBacked,
    evidenceState,
    provenance: {
      authorityBasis: 'canonical_source_truth_package',
      sourceIdentityKey: `file:${text(entry?.file_id)}`,
      fileId: text(entry?.file_id) || null,
      artifactId: entry?.artifact_id || null,
      canonicalRole: 'core_t12',
      factPath: `core.t12.accepted_facts.${acceptedFactName}`,
      reconciliationFactPath: 'source_reconciliation_state.t12_gpr',
      sourceSelectionPath: sourcePath,
      coreValidationState: text(entry?.status),
    },
  });
}

function buildRentRollAnnualInPlaceFact(sourceTruthPackage) {
  const entry = sourceTruthPackage?.core?.rent_roll || null;
  const reconciliationState = sourceTruthPackage?.source_reconciliation_state || null;
  const selection = reconciliationState?.source_selection?.rr_annual_in_place || null;
  const sourcePresent = Boolean(entry);
  const roleAccepted = coreRoleAccepted(entry);
  const stateValue = finite(reconciliationState?.rr_annual_in_place);
  const selectedValue = finite(selection?.value);
  const sourcePath = text(reconciliationState?.rr_annual_in_place_source || selection?.source_path);
  const factAccepted = roleAccepted && Number.isFinite(stateValue) && stateValue >= 0;
  const sourcePathAllowed = RENT_ROLL_ANNUAL_SOURCE_PATHS.has(sourcePath);
  const selectedValuePresent = Number.isFinite(selectedValue) && selectedValue >= 0;
  const selectionMatchesState = selectedValuePresent && valuesMatch(stateValue, selectedValue);
  const sourceBacked = factAccepted && sourcePathAllowed && selectionMatchesState;
  const evidenceState = !sourcePresent
    ? 'core_rent_roll_not_present'
    : !roleAccepted
      ? 'core_rent_roll_not_accepted'
      : !factAccepted
        ? 'rent_roll_annual_in_place_not_accepted_in_source_truth_reconciliation'
        : !sourcePathAllowed
          ? 'rent_roll_annual_source_path_not_allowed'
          : !selectedValuePresent
            ? 'rent_roll_source_selection_value_not_present'
            : !selectionMatchesState
              ? 'rent_roll_reconciliation_value_mismatches_source_selection'
              : 'canonical_reconciliation_selection_bound_to_core_rent_roll';
  return factReceipt({
    factName: 'rent_roll_annual_in_place_rent',
    value: stateValue,
    sourcePresent,
    roleAccepted,
    factAccepted,
    sourceBacked,
    evidenceState,
    provenance: {
      authorityBasis: 'canonical_source_truth_package',
      sourceIdentityKey: `file:${text(entry?.file_id)}`,
      fileId: text(entry?.file_id) || null,
      artifactId: entry?.artifact_id || null,
      canonicalRole: 'core_rent_roll',
      factPath: 'source_reconciliation_state.rr_annual_in_place',
      sourceSelectionPath: sourcePath,
      selectedReason: text(selection?.selected_reason) || null,
      selectionConfidence: text(selection?.confidence) || null,
      coreValidationState: text(entry?.status),
    },
  });
}

function buildTotalUnitsFact(sourceTruthPackage) {
  const entry = sourceTruthPackage?.core?.rent_roll || null;
  const roleAccepted = coreRoleAccepted(entry);
  const value = finite(entry?.accepted_facts?.total_units);
  const factAccepted = roleAccepted && hasOwn(entry?.accepted_facts, 'total_units') && Number.isFinite(value) && value > 0;
  return factReceipt({
    factName: 'total_units',
    value,
    sourcePresent: Boolean(entry),
    roleAccepted,
    factAccepted,
    sourceBacked: factAccepted,
    evidenceState: factAccepted ? 'canonical_core_fact_bound' : 'accepted_total_units_not_available',
    provenance: {
      authorityBasis: 'canonical_source_truth_package',
      sourceIdentityKey: `file:${text(entry?.file_id)}`,
      fileId: text(entry?.file_id) || null,
      artifactId: entry?.artifact_id || null,
      canonicalRole: 'core_rent_roll',
      factPath: 'core.rent_roll.accepted_facts.total_units',
      coreValidationState: text(entry?.status),
    },
  });
}

export function isCanonicalCoreReconciliationInputContract(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    value.source === CONTRACT_SOURCE &&
    value.contractVersion === CONTRACT_VERSION
  );
}

export function buildCanonicalCoreReconciliationInputContract({ sourceTruthPackage } = {}) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error('CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_CORE_RECONCILIATION');
  }

  const t12GrossPotentialRent = buildT12GprFact(sourceTruthPackage);
  const rentRollAnnualInPlaceRent = buildRentRollAnnualInPlaceFact(sourceTruthPackage);
  const totalUnits = buildTotalUnitsFact(sourceTruthPackage);
  const requiredFacts = { t12GrossPotentialRent, rentRollAnnualInPlaceRent };
  const missingInputs = Object.values(requiredFacts)
    .filter((fact) => fact.factAccepted !== true)
    .map((fact) => fact.factName);
  const evidenceGaps = Object.values(requiredFacts)
    .filter((fact) => fact.factAccepted === true && fact.sourceBacked !== true)
    .map((fact) => fact.factName);
  const eligibleForReconciliation = missingInputs.length === 0 && evidenceGaps.length === 0;

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
      broadT12IncomeFallbackAllowed: false,
      unannualizedMonthlyRentRollValueAllowed: false,
      legacyFivePercentThresholdAllowed: false,
      arbitraryMaterialityThresholdAllowed: false,
      missingNumericValuesRemainNull: true,
      reconciliationFailureMayBlockValidatedCorePublication: false,
    },
    facts: {
      t12GrossPotentialRent,
      rentRollAnnualInPlaceRent,
      totalUnits,
    },
    eligibility: {
      eligibleForReconciliation,
      status: eligibleForReconciliation
        ? 'eligible'
        : missingInputs.length > 0
          ? 'ineligible_missing_accepted_core_facts'
          : 'ineligible_core_fact_evidence_gap',
      requiredFacts: ['t12_gross_potential_rent', 'rent_roll_annual_in_place_rent'],
      missingInputs,
      evidenceGaps,
    },
    sectionStatus: eligibleForReconciliation ? 'ready_for_deterministic_reconciliation' : 'collapse_reconciliation_analysis',
    reportPublicationBlocker: false,
  });
}
