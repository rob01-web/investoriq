import { isCanonicalSourceTruthPackage } from './source-truth-package.js';
import { isCanonicalInstitutionalScenarioEngineCompletionHandoffContract } from './institutional-scenario-engine-completion-handoff-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_due_diligence_evidence_inventory_contract';
const CONTRACT_VERSION = 1;
const ACCEPTED_CORE_STATES = new Set(['accepted_complete', 'accepted_constrained']);

const DILIGENCE_CATEGORIES = Object.freeze({
  documentGaps: Object.freeze({
    categoryKey: 'document_gaps',
    acceptedCanonicalRoles: Object.freeze([]),
    coreContextRoles: Object.freeze([]),
  }),
  leasesAndEstoppels: Object.freeze({
    categoryKey: 'leases_and_estoppels',
    acceptedCanonicalRoles: Object.freeze([]),
    coreContextRoles: Object.freeze(['core_rent_roll']),
  }),
  insurance: Object.freeze({
    categoryKey: 'insurance',
    acceptedCanonicalRoles: Object.freeze([]),
    coreContextRoles: Object.freeze(['core_t12']),
  }),
  utilities: Object.freeze({
    categoryKey: 'utilities',
    acceptedCanonicalRoles: Object.freeze([]),
    coreContextRoles: Object.freeze(['core_t12']),
  }),
  environmental: Object.freeze({
    categoryKey: 'environmental',
    acceptedCanonicalRoles: Object.freeze(['environmental_context']),
    coreContextRoles: Object.freeze([]),
  }),
  tax: Object.freeze({
    categoryKey: 'tax',
    acceptedCanonicalRoles: Object.freeze(['property_tax_support']),
    coreContextRoles: Object.freeze(['core_t12']),
  }),
  reserves: Object.freeze({
    categoryKey: 'reserves',
    acceptedCanonicalRoles: Object.freeze([
      'property_condition_context',
      'historical_capital_context',
      'renovation_capex_context',
    ]),
    coreContextRoles: Object.freeze([]),
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function canonicalSourceTruthStructureValid(value) {
  const acceptedCoreCoherent = value?.core_publishable !== true || (
    ACCEPTED_CORE_STATES.has(text(value?.core?.t12?.status)) &&
    ACCEPTED_CORE_STATES.has(text(value?.core?.rent_roll?.status)) &&
    array(value?.true_blockers).length === 0
  );
  const conflicts = new Set(array(value?.support?.conflicts).map(text).filter(Boolean));
  const duplicates = new Set(array(value?.support?.duplicates).map(text).filter(Boolean));
  const acceptedSupportCoherent = array(value?.support?.accepted).every((entry) => (
    text(entry?.file_id) &&
    text(entry?.canonical_role) &&
    entry?.authority_decision?.roleAccepted === true &&
    text(entry.authority_decision.fileId) === text(entry.file_id) &&
    text(entry.authority_decision.canonicalRole) === text(entry.canonical_role) &&
    !conflicts.has(text(entry.file_id)) &&
    !duplicates.has(text(entry.file_id))
  ));
  return Boolean(
    isCanonicalSourceTruthPackage(value) &&
    text(value.job_id) &&
    value.core &&
    typeof value.core === 'object' &&
    value.support &&
    typeof value.support === 'object' &&
    Array.isArray(value.support.accepted) &&
    Array.isArray(value.support.advisory) &&
    Array.isArray(value.support.rejected) &&
    Array.isArray(value.support.adjudication_decisions) &&
    Array.isArray(value.support.conflicts) &&
    Array.isArray(value.support.fact_conflicts) &&
    Array.isArray(value.support.duplicates) &&
    typeof value.core_publishable === 'boolean' &&
    Array.isArray(value.true_blockers) &&
    acceptedCoreCoherent &&
    acceptedSupportCoherent
  );
}

function coreContext(sourceTruthPackage, canonicalRole) {
  const entry = canonicalRole === 'core_t12'
    ? sourceTruthPackage.core.t12
    : sourceTruthPackage.core.rent_roll;
  if (!entry || !ACCEPTED_CORE_STATES.has(text(entry.status)) || !text(entry.file_id)) return [];
  return [{
    sourceIdentityKey: `file:${text(entry.file_id)}`,
    fileId: text(entry.file_id),
    originalFilename: entry.original_filename || null,
    canonicalRole,
    authorityState: text(entry.status),
    contextUse: 'operating_context_only_not_due_diligence_document_authority',
  }];
}

function acceptedEvidence(sourceTruthPackage, roles) {
  const roleSet = new Set(roles);
  return array(sourceTruthPackage.support.accepted)
    .filter((entry) => roleSet.has(text(entry.canonical_role)) && entry.primary_for_role === true)
    .map((entry) => ({
      sourceIdentityKey: `file:${text(entry.file_id)}`,
      fileId: text(entry.file_id),
      originalFilename: entry.original_filename || null,
      canonicalRole: text(entry.canonical_role),
      authorityState: 'accepted_primary_support_evidence',
      factNames: Object.keys(entry.accepted_facts || {}).sort(),
      factConflictNames: [...array(entry.fact_conflicts)].sort(),
    }));
}

function advisoryPresence(sourceTruthPackage, roles) {
  const roleSet = new Set(roles);
  return array(sourceTruthPackage.support.advisory)
    .filter((entry) => roleSet.has(text(entry?.authority_decision?.canonicalRole)))
    .map((entry) => ({
      sourceIdentityKey: text(entry.file_id) ? `file:${text(entry.file_id)}` : null,
      fileId: text(entry.file_id) || null,
      candidateCanonicalRole: text(entry?.authority_decision?.canonicalRole) || null,
      authorityState: 'source_present_not_authority_accepted',
    }));
}

function categoryInventory(sourceTruthPackage, definition) {
  const evidence = acceptedEvidence(sourceTruthPackage, definition.acceptedCanonicalRoles);
  const context = definition.coreContextRoles.flatMap((role) => coreContext(sourceTruthPackage, role));
  const advisory = advisoryPresence(sourceTruthPackage, definition.acceptedCanonicalRoles);
  const evidenceAuthorityState = evidence.length > 0
    ? 'accepted_support_evidence_available'
    : context.length > 0
      ? 'core_operating_context_only'
      : advisory.length > 0
        ? 'source_present_not_authority_accepted'
        : definition.categoryKey === 'document_gaps'
          ? 'canonical_inventory_only'
          : 'not_evidenced';
  return {
    categoryKey: definition.categoryKey,
    inventoryState: 'canonical_source_inventory_complete',
    acceptedCanonicalRoles: [...definition.acceptedCanonicalRoles],
    coreContextRoles: [...definition.coreContextRoles],
    acceptedEvidence: evidence,
    coreOperatingContext: context,
    advisorySourcePresence: advisory,
    evidenceAuthorityState,
    diligenceEvidenceAuthorized: evidence.length > 0,
    requirementPolicyEstablished: false,
    documentRequirementEstablished: false,
    documentGapEstablished: false,
    negativePropertyConditionEstablished: false,
    priorityAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(gate7CompletionContract, sourceTruthPackage) {
  const categories = Object.fromEntries(
    Object.entries(DILIGENCE_CATEGORIES).map(([key, definition]) => [
      key,
      categoryInventory(sourceTruthPackage, definition),
    ])
  );
  const evidenceCategoryCount = Object.values(categories)
    .filter((category) => category.diligenceEvidenceAuthorized).length;

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamGate7Contract: gate7CompletionContract,
    sourceTruthPackage,
    upstreamReceipts: {
      gate7Source: gate7CompletionContract.source,
      gate7ContractVersion: gate7CompletionContract.contractVersion,
      sourceTruthSource: sourceTruthPackage.source,
      sourceTruthSchemaVersion: sourceTruthPackage.schema_version,
      jobId: sourceTruthPackage.job_id,
      corePublishable: sourceTruthPackage.core_publishable,
      exactCanonicalGate7CompletionReceipt: true,
      exactCanonicalSourceTruthPackage: true,
      jobIdentityMatched: true,
      coreAuthorityMatched: true,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      canonicalEvidenceInventoryOnly: true,
      acceptedSupportAuthorityRequired: true,
      coreEvidenceMayProvideOperatingContextOnly: true,
      coreContextPromotedToDiligenceDocumentAuthority: false,
      advisorySourcePromotedToAcceptedEvidence: false,
      optionalDocumentRequirementsInferred: false,
      documentGapsClassified: false,
      prioritiesAssigned: false,
      negativePropertyConditionsInferred: false,
      memoComponentsExecuted: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalDiligenceEvidenceAbsenceMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    categories,
    coverage: {
      inventoriedCategoryCount: Object.keys(categories).length,
      totalCategoryCount: Object.keys(DILIGENCE_CATEGORIES).length,
      acceptedEvidenceCategoryCount: evidenceCategoryCount,
      coreContextOnlyCategoryCount: Object.values(categories)
        .filter((category) => category.evidenceAuthorityState === 'core_operating_context_only').length,
      notEvidencedCategoryCount: Object.values(categories)
        .filter((category) => category.evidenceAuthorityState === 'not_evidenced').length,
      documentGapCount: 0,
      priorityCount: 0,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalDueDiligenceEvidenceInventoryContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(value.upstreamGate7Contract)) {
    return false;
  }
  if (!canonicalSourceTruthStructureValid(value.sourceTruthPackage)) return false;
  if (text(value.upstreamGate7Contract.upstreamReceipt.jobId) !== text(value.sourceTruthPackage.job_id)) {
    return false;
  }
  if (value.upstreamGate7Contract.upstreamReceipt.corePublishable !== value.sourceTruthPackage.core_publishable) {
    return false;
  }
  return JSON.stringify(value) === JSON.stringify(
    assembleContract(value.upstreamGate7Contract, value.sourceTruthPackage)
  );
}

export function buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
  gate7CompletionContract,
  sourceTruthPackage,
} = {}) {
  if (!isCanonicalInstitutionalScenarioEngineCompletionHandoffContract(gate7CompletionContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_7_RECEIPT_REQUIRED_FOR_GATE_8A_DILIGENCE_INVENTORY');
  }
  if (!canonicalSourceTruthStructureValid(sourceTruthPackage)) {
    throw new Error('COMPLETE_CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED_FOR_GATE_8A_DILIGENCE_INVENTORY');
  }
  if (
    text(gate7CompletionContract.upstreamReceipt.jobId) !== text(sourceTruthPackage.job_id) ||
    gate7CompletionContract.upstreamReceipt.corePublishable !== sourceTruthPackage.core_publishable
  ) {
    throw new Error('GATE_7_AND_SOURCE_TRUTH_AUTHORITY_MUST_MATCH_FOR_GATE_8A_DILIGENCE_INVENTORY');
  }
  return deepFreeze(assembleContract(gate7CompletionContract, sourceTruthPackage));
}

export const INSTITUTIONAL_DUE_DILIGENCE_EVIDENCE_INVENTORY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  canonicalEvidenceInventoryOnly: true,
  documentGapsClassified: false,
  prioritiesAssigned: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
