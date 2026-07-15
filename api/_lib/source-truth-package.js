import {
  buildCoreInputSufficiencyState,
  buildRentRollSufficiencyState,
  buildSourceReconciliationState,
  buildT12SufficiencyState,
} from "./report-surface-contracts.js";
import {
  adjudicateSupportDocumentAuthority,
  buildSupportDocumentAuthorityShadowComparison,
} from "./support-document-authority-adjudicator.js";

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

function positiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function expectedSupportSemanticRole(artifactType = "") {
  const roles = {
    loan_term_sheet_parsed: "purchase_assumptions",
    mortgage_statement_parsed: "current_debt_context",
    appraisal_parsed: "appraisal",
    renovation_parsed: "structured_renovation_capex_plan",
    property_tax_parsed: "property_tax",
  };
  return roles[String(artifactType || "").trim()] || null;
}

function hasCoherentSupportFacts(artifact = null) {
  const payload = artifact?.payload || {};
  switch (artifact?.type) {
    case "loan_term_sheet_parsed":
      return Boolean(
        positiveNumber(payload.purchase_price) ||
        positiveNumber(payload.proposed_loan_amount) ||
        positiveNumber(payload.stated_acquisition_loan_amount) ||
        positiveNumber(payload.derived_acquisition_loan_amount) ||
        positiveNumber(payload.ltv)
      );
    case "mortgage_statement_parsed":
      return Boolean(
        positiveNumber(payload.outstanding_balance) ||
        positiveNumber(payload.current_outstanding_balance) ||
        positiveNumber(payload.current_loan_balance) ||
        positiveNumber(payload.monthly_payment)
      );
    case "appraisal_parsed":
      return positiveNumber(payload.appraised_value);
    case "renovation_parsed":
      return Boolean(positiveNumber(payload.total_budget) || (Array.isArray(payload.budget_rows) && payload.budget_rows.length > 0));
    case "property_tax_parsed":
      return positiveNumber(payload.annual_tax);
    default:
      return payload?.validated === true;
  }
}

function isAcceptedSupportArtifact(artifact = null) {
  if (!artifact || !String(artifact.type || "").endsWith("_parsed")) return false;
  if (artifact.payload?.validated !== true) return false;
  return hasCoherentSupportFacts(artifact);
}

function normalizeAcceptedSupportFacts(artifact = null) {
  const payload = artifact?.payload || {};
  const expectedRole = expectedSupportSemanticRole(artifact?.type);
  if (!expectedRole) return payload;
  const parserSemanticRole = payload?.semantic_doc_role || null;
  return {
    ...payload,
    semantic_doc_role: expectedRole,
    semantic_doc_role_reason: parserSemanticRole && parserSemanticRole !== expectedRole
      ? "source_truth_role_fact_coherence_reconciliation"
      : (payload?.semantic_doc_role_reason || "source_truth_validated_artifact_role"),
    parser_semantic_doc_role: parserSemanticRole,
  };
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

  const decisions = [];
  const shadowComparisons = [];
  for (const [fileId, rows] of byFile.entries()) {
    const parsed = rows.filter((row) => row.type.endsWith("_parsed") && !["t12_parsed", "rent_roll_parsed"].includes(row.type));
    const acceptedArtifact = parsed.find(isAcceptedSupportArtifact) || null;
    const originalFilename = rows.find((row) => row.original_filename)?.original_filename || null;
    shadowComparisons.push(
      buildSupportDocumentAuthorityShadowComparison({
        file: { file_id: fileId, original_filename: originalFilename },
        artifacts: rows,
        legacyDecision: acceptedArtifact?.payload || parsed[0]?.payload || null,
      })
    );
    decisions.push(
      adjudicateSupportDocumentAuthority({
        file: { file_id: fileId, original_filename: originalFilename },
        artifacts: rows,
      })
    );
  }

  const duplicateFileIds = new Set();
  const firstByFingerprint = new Map();
  for (const decision of [...decisions].sort((left, right) => String(left.fileId).localeCompare(String(right.fileId)))) {
    if (!decision.sourceFingerprint) continue;
    if (firstByFingerprint.has(decision.sourceFingerprint)) duplicateFileIds.add(decision.fileId);
    else firstByFingerprint.set(decision.sourceFingerprint, decision.fileId);
  }

  const conflictingFileIds = new Set();
  const acceptedByRole = new Map();
  for (const decision of decisions) {
    if (!decision.roleAccepted || duplicateFileIds.has(decision.fileId)) continue;
    const bucket = acceptedByRole.get(decision.canonicalRole) || [];
    bucket.push(decision);
    acceptedByRole.set(decision.canonicalRole, bucket);
  }
  for (const roleDecisions of acceptedByRole.values()) {
    for (let leftIndex = 0; leftIndex < roleDecisions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < roleDecisions.length; rightIndex += 1) {
        const left = roleDecisions[leftIndex];
        const right = roleDecisions[rightIndex];
        for (const field of Object.keys(left.acceptedFacts || {})) {
          if (!(field in (right.acceptedFacts || {}))) continue;
          if (String(left.acceptedFacts[field]) !== String(right.acceptedFacts[field])) {
            conflictingFileIds.add(left.fileId);
            conflictingFileIds.add(right.fileId);
          }
        }
      }
    }
  }

  const validatedRoleByCanonicalRole = {
    purchase_assumptions: "loan_term_sheet",
    current_debt_context: "mortgage_statement",
    appraisal_context: "appraisal",
    renovation_capex_context: "renovation",
    market_survey_context: "market_survey",
    environmental_context: "environmental",
    property_tax_support: "property_tax",
    historical_debt_context: "historical_debt",
  };
  const primaryFileByRole = new Map();
  for (const [role, roleDecisions] of acceptedByRole.entries()) {
    const primary = roleDecisions
      .filter((decision) => !duplicateFileIds.has(decision.fileId) && !conflictingFileIds.has(decision.fileId))
      .sort((left, right) =>
        Object.values(right.sectionEligibility || {}).filter(Boolean).length - Object.values(left.sectionEligibility || {}).filter(Boolean).length ||
        Object.keys(right.acceptedFacts || {}).length - Object.keys(left.acceptedFacts || {}).length ||
        String(left.fileId).localeCompare(String(right.fileId))
      )[0] || null;
    if (primary) primaryFileByRole.set(role, primary.fileId);
  }
  const accepted = decisions
    .filter((decision) => decision.roleAccepted && !duplicateFileIds.has(decision.fileId) && !conflictingFileIds.has(decision.fileId))
    .map((decision) => ({
      file_id: decision.fileId,
      original_filename: decision.originalFilename,
      validated_role: validatedRoleByCanonicalRole[decision.canonicalRole] || decision.canonicalRole,
      canonical_role: decision.canonicalRole,
      artifact_id: null,
      accepted_facts: decision.acceptedFacts,
      accepted_fact_evidence: decision.acceptedFactEvidence,
      section_eligibility: decision.sectionEligibility,
      primary_for_role: primaryFileByRole.get(decision.canonicalRole) === decision.fileId,
      authority_decision: decision,
    }));
  const advisory = decisions
    .filter((decision) => !decision.roleAccepted || duplicateFileIds.has(decision.fileId) || conflictingFileIds.has(decision.fileId))
    .map((decision) => ({
      file_id: decision.fileId,
      original_filename: decision.originalFilename,
      status: duplicateFileIds.has(decision.fileId)
        ? "duplicate"
        : conflictingFileIds.has(decision.fileId)
          ? "conflicting"
          : decision.adjudicationState,
      authority_decision: decision,
      customer_delivery_blocker: false,
    }));
  const rejected = advisory
    .filter((entry) => ["rejected", "unreadable"].includes(entry.status))
    .map((entry) => ({ ...entry, reasons: [entry.status], customer_delivery_blocker: false }));
  return {
    accepted,
    advisory,
    rejected,
    adjudication_decisions: decisions,
    shadow_comparisons: shadowComparisons,
    conflicts: [...conflictingFileIds],
    duplicates: [...duplicateFileIds],
  };
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
  const canonicalRoleLabels = {
    purchase_assumptions: "Purchase Assumptions / Proposed Acquisition Financing Context",
    current_debt_context: "Existing Debt Context / Current Mortgage / Debt Statement",
    appraisal_context: "Appraisal / Valuation Context",
    renovation_capex_context: "Renovation / CapEx Context",
    market_survey_context: "Market Rent Survey Context",
    environmental_context: "Environmental Due Diligence Context",
    property_tax_support: "Property Tax Support",
    historical_debt_context: "Historical Debt Context",
  };
  const constrainedSupportDocs = new Map(
    toArray(sourceTruthPackage?.support?.accepted)
      .map((entry) => {
        const fileId = String(entry?.file_id || "").trim();
        const canonicalRole = String(entry?.canonical_role || entry?.accepted_facts?.acceptedSemanticDocRole || "").trim();
        if (!fileId || !canonicalRole) return null;
        const canonicalLabel = canonicalRoleLabels[canonicalRole] || "Other Support Document";
        return [fileId, {
          fileId,
          originalFilename: entry?.original_filename || null,
          sourceKind: "support_doc",
          canonicalRole,
          canonicalLabel,
          roleLabel: canonicalLabel,
          treatment: "Document-derived context",
          use: "Canonical Source Truth accepted facts only.",
          category: "Displayed / Limited Use",
          allowedUses: [canonicalRole],
          forbiddenUses: ["source_reclassification", "raw_parser_fallback"],
          extractedFacts: entry?.accepted_facts || {},
          sourceEvidence: entry?.accepted_fact_evidence || {},
          sourceAuthorityVersion: `source_truth_v${SOURCE_TRUTH_SCHEMA_VERSION}`,
          authorityBasis: SOURCE_TRUTH_MARKER,
          acceptedSemanticDocRole: canonicalRole,
          acceptedDebtBasis: canonicalRole === "purchase_assumptions"
            ? "acquisition_financing_assumption"
            : canonicalRole === "current_debt_context"
              ? "current_debt_context"
              : canonicalRole,
          acceptedSemanticDocDisplayLabel: canonicalLabel,
          acceptedSourceIdentityKey: `file:${fileId}`,
          acceptedSourceTruth: {
            hasPurchaseAssumptions: canonicalRole === "purchase_assumptions",
            hasCurrentDebt: canonicalRole === "current_debt_context",
          },
          acceptedPurchaseAssumptionsTruth: canonicalRole === "purchase_assumptions",
          acceptedCurrentDebtTruth: canonicalRole === "current_debt_context",
          acceptedProvenance: {
            acceptedSourceIdentityKey: `file:${fileId}`,
            acceptedSemanticDocRole: canonicalRole,
            authorityBasis: SOURCE_TRUTH_MARKER,
          },
          sectionEligibility: entry?.section_eligibility || {},
          primaryForRole: entry?.primary_for_role === true,
        }];
      })
      .filter(Boolean)
  );
  for (const entry of toArray(sourceTruthPackage?.support?.advisory)) {
    const fileId = String(entry?.file_id || "").trim();
    if (!fileId || constrainedSupportDocs.has(fileId)) continue;
    const authorityDecision = entry?.authority_decision || null;
    const adjudicationStatus = String(entry?.status || authorityDecision?.adjudicationState || "unclassified").trim();
    constrainedSupportDocs.set(fileId, {
      fileId,
      originalFilename: entry?.original_filename || null,
      sourceKind: "support_doc",
      canonicalRole: "unclassified_support",
      canonicalLabel: "Source-Present Support Document / Not Authority-Accepted",
      roleLabel: "Source-Present Support Document / Not Authority-Accepted",
      treatment: `Source present / ${adjudicationStatus}`,
      use: "Retained for source auditability; no accepted quantitative facts.",
      category: "Source Present / Not Source-Backed",
      allowedUses: ["source_presence_disclosure"],
      forbiddenUses: ["source_reclassification", "raw_parser_fallback", "quantitative_fact_authority"],
      extractedFacts: {},
      sourceEvidence: {},
      sourceAuthorityVersion: `source_truth_v${SOURCE_TRUTH_SCHEMA_VERSION}`,
      authorityBasis: SOURCE_TRUTH_MARKER,
      sourcePresent: authorityDecision?.sourcePresent === true,
      roleAccepted: false,
      factAccepted: false,
      sourceBacked: false,
      sectionDisplayReady: false,
      candidateCanonicalRole: authorityDecision?.canonicalRole || null,
      ambiguity: authorityDecision?.ambiguity || null,
      adjudicationStatus,
      primaryForRole: false,
    });
  }
  const t12FileId = String(sourceTruthPackage?.core?.t12?.file_id || "").trim();
  const rentRollFileId = String(sourceTruthPackage?.core?.rent_roll?.file_id || "").trim();
  const legacyT12 = canonicalSourcePackage?.coreT12 && t12FileId && String(canonicalSourcePackage.coreT12.fileId || "").trim() === t12FileId
    ? canonicalSourcePackage.coreT12
    : null;
  const legacyRentRoll = canonicalSourcePackage?.coreRentRoll && rentRollFileId && String(canonicalSourcePackage.coreRentRoll.fileId || "").trim() === rentRollFileId
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
    supportAuthorityDecisions: toArray(sourceTruthPackage?.support?.adjudication_decisions),
    authorityVersion: `source_truth_v${SOURCE_TRUTH_SCHEMA_VERSION}`,
    sourceTruthAuthority: {
      source: sourceTruthPackage.source,
      schema_version: sourceTruthPackage.schema_version,
      core_publishable: sourceTruthPackage.core_publishable,
      true_blockers: sourceTruthPackage.true_blockers,
      section_policy: sourceTruthPackage.section_policy,
      disclosures: sourceTruthPackage.disclosures,
      source_reconciliation_state: sourceTruthPackage.source_reconciliation_state,
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
