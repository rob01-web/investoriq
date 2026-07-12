import {
  buildCoreInputSufficiencyState,
  buildRentRollSufficiencyState,
  buildSourceReconciliationState,
  buildT12SufficiencyState,
} from "./report-surface-contracts.js";

const SOURCE_TRUTH_MARKER = "canonical_source_truth_package";
const SOURCE_TRUTH_SCHEMA_VERSION = 1;

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePayload(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return payload;
  if (typeof payload !== "string") return {};
  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeArtifact(artifact, index) {
  const payload = normalizePayload(artifact?.payload);
  return {
    ...artifact,
    payload,
    type: String(artifact?.type || payload?.type || "").trim(),
    id: String(artifact?.id || payload?.artifact_id || `artifact-${index}`).trim(),
    file_id: String(
      artifact?.file_id ||
      artifact?.fileId ||
      payload?.file_id ||
      payload?.fileId ||
      payload?.source_file_id ||
      ""
    ).trim(),
    original_filename: String(
      artifact?.original_filename ||
      artifact?.originalFilename ||
      payload?.original_filename ||
      payload?.originalFilename ||
      payload?.source_original_filename ||
      ""
    ).trim(),
    created_at: artifact?.created_at || null,
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function isValidatedState(state) {
  return Boolean(
    state &&
    typeof state === "object" &&
    state.status === "validated" &&
    state.user_needs_documents !== true &&
    state.admin_review_required !== true &&
    state.system_contract_failure !== true
  );
}

function constitutionalStatus(state) {
  return state?.publishability_bucket === "core_sufficient_publishable"
    ? "accepted_complete"
    : "accepted_constrained";
}

function hasExplicitValidationAcceptance(payload = {}) {
  return Boolean(
    payload?.core_t12_validation?.ok === true ||
    payload?.validated === true ||
    payload?.parser_diagnostics?.validation_reasons?.length === 0
  );
}

function hasExplicitValidationRejection(payload = {}) {
  return payload?.core_t12_validation?.ok === false || payload?.validated === false;
}

function resolveCoreFacts(artifact, type) {
  const nested = artifact?.payload?.[type];
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested
    : artifact?.payload || {};
}

function selectValidatedCoreArtifact(artifacts, type, buildState) {
  const candidates = artifacts
    .filter((artifact) => artifact.type === type)
    .map((artifact) => {
      const facts = resolveCoreFacts(artifact, type);
      return { artifact, facts, state: buildState(facts) };
    })
    .filter((candidate) =>
      !hasExplicitValidationRejection(candidate.artifact.payload) &&
      !hasExplicitValidationRejection(candidate.facts) &&
      isValidatedState(candidate.state)
    )
    .sort((left, right) => {
      const explicitDifference =
        Number(hasExplicitValidationAcceptance(right.facts) || hasExplicitValidationAcceptance(right.artifact.payload)) -
        Number(hasExplicitValidationAcceptance(left.facts) || hasExplicitValidationAcceptance(left.artifact.payload));
      if (explicitDifference !== 0) return explicitDifference;
      const completeDifference =
        Number(right.state?.publishability_bucket === "core_sufficient_publishable") -
        Number(left.state?.publishability_bucket === "core_sufficient_publishable");
      if (completeDifference !== 0) return completeDifference;
      const timestampDifference =
        (Date.parse(right.artifact.created_at || "") || 0) -
        (Date.parse(left.artifact.created_at || "") || 0);
      if (timestampDifference !== 0) return timestampDifference;
      return String(left.artifact.id).localeCompare(String(right.artifact.id));
    });
  return candidates[0] || null;
}

function buildCoreEntry(candidate, validatedRole) {
  if (!candidate) return null;
  const { artifact, state } = candidate;
  return {
    status: constitutionalStatus(state),
    artifact_id: artifact.id,
    file_id: artifact.file_id || null,
    original_filename: artifact.original_filename || null,
    validated_role: validatedRole,
    accepted_facts: candidate.facts,
    limitations: state.reason_code ? [state.reason_code] : [],
    evidence: {
      parser_validation:
        candidate.facts?.core_t12_validation ||
        candidate.facts?.parser_diagnostics ||
        artifact.payload?.core_t12_validation ||
        artifact.payload?.parser_diagnostics ||
        null,
      sufficiency_state: state,
    },
  };
}

function buildSupportAuthority(artifacts, coreFileIds) {
  const byFile = new Map();
  for (const artifact of artifacts) {
    if (!artifact.file_id || coreFileIds.has(artifact.file_id)) continue;
    const rows = byFile.get(artifact.file_id) || [];
    rows.push(artifact);
    byFile.set(artifact.file_id, rows);
  }

  const accepted = [];
  const advisory = [];
  const rejected = [];
  for (const [fileId, rows] of byFile.entries()) {
    const parsed = rows.filter((row) => row.type.endsWith("_parsed") && !["t12_parsed", "rent_roll_parsed"].includes(row.type));
    const acceptedArtifact = parsed.find((row) => row.payload?.validated !== false) || null;
    const rejectedArtifacts = rows.filter((row) => row.type.endsWith("_parse_error") || row.payload?.validated === false);
    const textArtifact = rows.find((row) => row.type === "document_text_extracted") || null;
    const originalFilename = rows.find((row) => row.original_filename)?.original_filename || null;

    if (acceptedArtifact) {
      accepted.push({
        file_id: fileId,
        original_filename: acceptedArtifact.original_filename || originalFilename,
        validated_role: acceptedArtifact.type.replace(/_parsed$/, ""),
        artifact_id: acceptedArtifact.id,
        accepted_facts: acceptedArtifact.payload,
      });
      continue;
    }
    if (rejectedArtifacts.length > 0) {
      rejected.push({
        file_id: fileId,
        original_filename: originalFilename,
        candidate_roles: [...new Set(rejectedArtifacts.map((row) => row.type.replace(/_parse_error$/, "")))],
        artifact_ids: rejectedArtifacts.map((row) => row.id),
        reasons: rejectedArtifacts
          .map((row) => row.payload?.error_message || row.payload?.reason || row.payload?.rejection_reason || null)
          .filter(Boolean),
        customer_delivery_blocker: false,
      });
      continue;
    }
    if (textArtifact) {
      advisory.push({
        file_id: fileId,
        original_filename: textArtifact.original_filename || originalFilename,
        artifact_id: textArtifact.id,
        status: "candidate_only",
        customer_delivery_blocker: false,
      });
    }
  }
  return { accepted, advisory, rejected };
}

function hasAcceptedSupportRole(support, roles) {
  const acceptedRoles = new Set(toArray(support?.accepted).map((entry) => entry.validated_role));
  return roles.some((role) => acceptedRoles.has(role));
}

function buildSectionPolicy({ t12State, rentRollState, support, sourceReconciliationState }) {
  const policy = {
    operating_statement: "render",
    operating_profile: "render",
    expense_structure: "render",
    data_coverage: "render",
    rent_upside: "render",
    occupancy_analysis: "render",
    source_reconciliation: sourceReconciliationState?.status === "source_reconciliation_required" ? "disclose" : "render",
    debt_structure: hasAcceptedSupportRole(support, ["mortgage_statement", "loan_term_sheet"]) ? "render" : "collapse",
    renovation_strategy: hasAcceptedSupportRole(support, ["renovation"]) ? "render" : "collapse",
    valuation_context: hasAcceptedSupportRole(support, ["appraisal"]) ? "render" : "omit",
    property_tax_context: hasAcceptedSupportRole(support, ["property_tax"]) ? "render" : "omit",
  };

  if (t12State?.reason_code === "t12_gpr_missing") {
    policy.rent_upside = "collapse";
    policy.source_reconciliation = "collapse";
  }
  if (rentRollState?.reason_code === "rent_roll_occupancy_not_modeled") {
    policy.occupancy_analysis = "qualify";
  }
  if (rentRollState?.evidence?.optional_detail_present !== true) {
    policy.rent_upside = "collapse";
  }
  return policy;
}

export function isCanonicalSourceTruthPackage(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    value.source === SOURCE_TRUTH_MARKER &&
    value.schema_version === SOURCE_TRUTH_SCHEMA_VERSION
  );
}

function buildLegacyCoreView(entry, canonicalRole, canonicalLabel) {
  if (!entry) return null;
  return {
    fileId: entry.file_id || null,
    originalFilename: entry.original_filename || null,
    sourceKind: canonicalRole,
    canonicalRole,
    canonicalLabel,
    roleLabel: canonicalLabel,
    role: canonicalRole,
    treatment: "Primary quantitative input",
    use: "Validated core quantitative source.",
    allowedUses: ["core_quantitative_input"],
    forbiddenUses: ["support_doc"],
    extractedFacts: entry.accepted_facts || {},
    sourceEvidence: entry.evidence || null,
    sourceAuthorityVersion: `source_truth_v${SOURCE_TRUTH_SCHEMA_VERSION}`,
    authorityBasis: SOURCE_TRUTH_MARKER,
  };
}

export function constrainCanonicalSourcePackageToSourceTruth(
  canonicalSourcePackage = null,
  sourceTruthPackage = null
) {
  if (!isCanonicalSourceTruthPackage(sourceTruthPackage)) {
    throw new Error("CANONICAL_SOURCE_TRUTH_PACKAGE_REQUIRED");
  }
  const acceptedSupportFileIds = new Set(
    toArray(sourceTruthPackage?.support?.accepted).map((entry) => String(entry?.file_id || "").trim()).filter(Boolean)
  );
  const legacySupportDocs = canonicalSourcePackage?.supportDocs instanceof Map
    ? canonicalSourcePackage.supportDocs
    : new Map();
  const constrainedSupportDocs = new Map(
    [...legacySupportDocs.entries()].filter(([fileId]) => acceptedSupportFileIds.has(String(fileId || "").trim()))
  );
  const t12FileId = String(sourceTruthPackage?.core?.t12?.file_id || "").trim();
  const rentRollFileId = String(sourceTruthPackage?.core?.rent_roll?.file_id || "").trim();
  const legacyT12 = String(canonicalSourcePackage?.coreT12?.fileId || "").trim() === t12FileId
    ? canonicalSourcePackage.coreT12
    : null;
  const legacyRentRoll = String(canonicalSourcePackage?.coreRentRoll?.fileId || "").trim() === rentRollFileId
    ? canonicalSourcePackage.coreRentRoll
    : null;

  return {
    ...(canonicalSourcePackage || {}),
    coreT12: legacyT12 || buildLegacyCoreView(
      sourceTruthPackage?.core?.t12,
      "core_t12",
      "Core Quantitative Source - Trailing 12-Month Income Statement"
    ),
    coreRentRoll: legacyRentRoll || buildLegacyCoreView(
      sourceTruthPackage?.core?.rent_roll,
      "core_rent_roll",
      "Core Quantitative Source - Rent Roll"
    ),
    supportDocs: constrainedSupportDocs,
    authorityVersion: `source_truth_v${SOURCE_TRUTH_SCHEMA_VERSION}`,
    sourceTruthAuthority: {
      source: sourceTruthPackage.source,
      schema_version: sourceTruthPackage.schema_version,
      core_publishable: sourceTruthPackage.core_publishable,
      true_blockers: sourceTruthPackage.true_blockers,
      section_policy: sourceTruthPackage.section_policy,
    },
  };
}

export function buildCanonicalSourceTruthPackage({
  jobId = null,
  propertyName = null,
  uploadedFiles = [],
  artifacts = [],
  parsedArtifacts = [],
} = {}) {
  const normalizedArtifacts = [...toArray(artifacts), ...toArray(parsedArtifacts)]
    .map(normalizeArtifact)
    .filter((artifact) => artifact.type);

  const selectedT12 = selectValidatedCoreArtifact(
    normalizedArtifacts,
    "t12_parsed",
    (payload) => buildT12SufficiencyState({ t12Payload: payload })
  );
  const selectedRentRoll = selectValidatedCoreArtifact(
    normalizedArtifacts,
    "rent_roll_parsed",
    (payload) => buildRentRollSufficiencyState({ computedRentRoll: payload, rentRollPayload: payload })
  );
  const t12Payload = selectedT12?.facts || null;
  const rentRollPayload = selectedRentRoll?.facts || null;
  const sourceReconciliationState = buildSourceReconciliationState({
    computedRentRoll: rentRollPayload,
    rentRollPayload,
    t12Payload,
  });
  const t12State = selectedT12?.state || buildT12SufficiencyState({ t12Payload: null });
  const rentRollState = selectedRentRoll?.state || buildRentRollSufficiencyState({ computedRentRoll: null, rentRollPayload: null });
  const coreInputState = buildCoreInputSufficiencyState({
    t12Payload,
    computedRentRoll: rentRollPayload,
    rentRollPayload,
    sourceReconciliationState,
  });
  const coreFileIds = new Set(
    [selectedT12?.artifact?.file_id, selectedRentRoll?.artifact?.file_id].filter(Boolean)
  );
  const support = buildSupportAuthority(normalizedArtifacts, coreFileIds);
  const corePublishable = Boolean(
    selectedT12 &&
    selectedRentRoll &&
    isValidatedState(t12State) &&
    isValidatedState(rentRollState) &&
    isValidatedState(coreInputState)
  );
  const trueBlockers = [];
  if (!selectedT12) trueBlockers.push("CORE_T12_NOT_VALIDATED");
  if (!selectedRentRoll) trueBlockers.push("CORE_RENT_ROLL_NOT_VALIDATED");
  if (selectedT12 && selectedRentRoll && !isValidatedState(coreInputState)) {
    trueBlockers.push(coreInputState.reason_code || "CORE_OPERATING_EVIDENCE_NOT_VALIDATED");
  }
  const disclosures = [];
  if (sourceReconciliationState?.source_reconciliation_disclosure) {
    disclosures.push({
      code: "SOURCE_RECONCILIATION_DISCLOSURE",
      text: sourceReconciliationState.source_reconciliation_disclosure,
    });
  }

  return deepFreeze({
    source: SOURCE_TRUTH_MARKER,
    schema_version: SOURCE_TRUTH_SCHEMA_VERSION,
    job_id: jobId,
    property_name: propertyName,
    uploaded_file_count: toArray(uploadedFiles).length,
    core: {
      t12: buildCoreEntry(selectedT12, "t12"),
      rent_roll: buildCoreEntry(selectedRentRoll, "rent_roll"),
    },
    support,
    core_publishable: corePublishable,
    true_blockers: trueBlockers,
    section_policy: buildSectionPolicy({
      t12State,
      rentRollState,
      support,
      sourceReconciliationState,
    }),
    disclosures,
    source_reconciliation_state: sourceReconciliationState,
    core_input_sufficiency_state: coreInputState,
  });
}
