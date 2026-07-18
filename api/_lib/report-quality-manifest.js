const MANIFEST_SCHEMA_VERSION = 1;
const MANIFEST_CANDIDATE_SOURCE = "report_quality_manifest_candidate";
const MANIFEST_FINAL_SOURCE = "canonical_report_quality_manifest";
const SOURCE_TRUTH_SOURCE = "canonical_source_truth_package";
const DELIVERY_DECISION_SOURCE = "canonical_delivery_decision";

const CORE_SECTION_KEYS = new Set([
  "operating_statement",
  "operating_profile",
  "expense_structure",
  "data_coverage",
  "rent_upside",
  "occupancy_analysis",
  "source_reconciliation",
]);

const SCREENING_SUPPORT_ROLE_BY_SECTION = Object.freeze({
  debt_structure: ["purchase_assumptions", "current_debt_context"],
  renovation_strategy: ["renovation_capex_context"],
  valuation_context: ["appraisal_context"],
  property_tax_context: ["property_tax_support"],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value) {
  return String(value ?? "").trim();
}

function clone(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => clone(entry));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, clone(entry)])
  );
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unique(values) {
  return [...new Set(asArray(values).map(text).filter(Boolean))];
}

function sourceIdentityKey(documentClass, fileId, artifactId = null) {
  const normalizedFileId = text(fileId);
  if (normalizedFileId) return `${documentClass}:file:${normalizedFileId}`;
  const normalizedArtifactId = text(artifactId);
  return normalizedArtifactId ? `${documentClass}:artifact:${normalizedArtifactId}` : null;
}

function explicitDeliveryState(decision = null) {
  const source = asObject(decision);
  const status = text(
    source.delivery_gate_status ||
      source.deliveryGateStatus ||
      source.status
  ) || null;
  const customerDeliveryAllowed =
    source.customer_delivery_allowed === true ||
    source.customerDeliveryAllowed === true ||
    source.customer_publish_eligible === true;
  const holdDelivery =
    source.hold_delivery === true ||
    source.holdDelivery === true ||
    source.customer_publish_eligible === false;
  return {
    status,
    customerDeliveryAllowed,
    holdDelivery,
    reasonCode: text(
      source.reason_code ||
        source.delivery_gate_reason_code ||
        source.customer_status_reason_code ||
        source.fail_closed_reason_code
    ) || null,
  };
}

function finalPdfCustomerDeliveryAllowed(value = {}) {
  const blockingCodes = asArray(value?.blocking_issue_codes);
  const blockingIssues = asArray(value?.issues).filter((issue) => issue?.blocks_customer_delivery === true);
  if (blockingCodes.length > 0 || blockingIssues.length > 0) return false;
  return (value?.customer_delivery_allowed === true &&
      ["certified", "internal_test_artifact_only", "publishable_with_quality_incident"].includes(text(value?.status))) ||
    (value?.ok === true && ["certified", "internal_test_artifact_only"].includes(text(value?.status)));
}

function finalPdfStrictlyCertified(value = {}) {
  return value?.ok === true && value?.status === "certified";
}

function buildCoreDocument(entry, canonicalRole, corePublishable) {
  const source = asObject(entry);
  const acceptedFacts = clone(asObject(source.accepted_facts));
  const factAccepted = Object.keys(acceptedFacts).length > 0;
  const accepted = Boolean(source && Object.keys(source).length > 0);
  const identityKey = sourceIdentityKey("core", source.file_id, source.artifact_id);
  return {
    documentClass: "core",
    documentId: text(source.file_id) || text(source.artifact_id) || canonicalRole,
    sourceIdentityKey: identityKey,
    artifactId: text(source.artifact_id) || null,
    fileId: text(source.file_id) || null,
    originalFilename: text(source.original_filename) || null,
    extraction: {
      state: accepted ? "validated" : "missing",
      quality: text(source.status) || null,
      ocrUsed: null,
      warnings: unique(source.limitations),
    },
    candidateRoles: [canonicalRole],
    adjudicatedRole: accepted ? canonicalRole : null,
    acceptedFacts,
    rejectedFacts: {},
    acceptedFactEvidence: clone(asObject(source.evidence)),
    rejectedFactEvidence: {},
    sourcePresent: accepted,
    roleAccepted: accepted,
    factAccepted,
    sourceBacked: accepted && factAccepted,
    sectionDisplayReady: accepted && factAccepted && corePublishable === true,
    conflict: { state: "none", reasons: [] },
    duplicate: { state: "none", duplicateOf: null },
    confidence: {
      state: accepted && factAccepted ? "deterministically_validated" : "not_accepted",
      numericScore: null,
      basis: "canonical_source_truth_core_acceptance",
    },
    authority: {
      source: SOURCE_TRUTH_SOURCE,
      authorityCreating: false,
      receiptOnly: true,
    },
  };
}

function buildSupportDocuments(sourceTruthPackage) {
  const support = asObject(sourceTruthPackage?.support);
  const acceptedByFile = new Map(
    asArray(support.accepted)
      .map((entry) => [text(entry?.file_id), entry])
      .filter(([fileId]) => Boolean(fileId))
  );
  const advisoryByFile = new Map(
    asArray(support.advisory)
      .map((entry) => [text(entry?.file_id), entry])
      .filter(([fileId]) => Boolean(fileId))
  );
  const conflicts = new Set(unique(support.conflicts));
  const duplicates = new Set(unique(support.duplicates));
  const factConflicts = asArray(support.fact_conflicts);

  return asArray(support.adjudication_decisions).map((decision) => {
    const fileId = text(decision?.fileId);
    const acceptedEntry = acceptedByFile.get(fileId) || null;
    const advisoryEntry = advisoryByFile.get(fileId) || null;
    const roleAccepted = Boolean(acceptedEntry);
    const fileFactConflicts = factConflicts.filter((conflict) =>
      asArray(conflict?.sources).some((source) => text(source?.file_id) === fileId)
    );
    const rejectedConflictFacts = Object.fromEntries(
      fileFactConflicts.flatMap((conflict) =>
        asArray(conflict?.sources)
          .filter((source) => text(source?.file_id) === fileId)
          .map((source) => [text(conflict?.fact_name), clone(source?.value)])
          .filter(([factName]) => Boolean(factName))
      )
    );
    const rejectedConflictEvidence = Object.fromEntries(
      fileFactConflicts.flatMap((conflict) =>
        asArray(conflict?.sources)
          .filter((source) => text(source?.file_id) === fileId)
          .map((source) => [text(conflict?.fact_name), clone(source?.evidence)])
          .filter(([factName]) => Boolean(factName))
      )
    );
    const acceptedFacts = roleAccepted
      ? clone(asObject(acceptedEntry?.accepted_facts))
      : {};
    const rejectedFacts = roleAccepted
      ? rejectedConflictFacts
      : clone(asObject(decision?.acceptedFacts));
    const factAccepted = roleAccepted && Object.keys(acceptedFacts).length > 0;
    const conflictState = conflicts.has(fileId)
      ? "conflicting"
      : duplicates.has(fileId)
        ? "duplicate"
        : fileFactConflicts.length > 0
          ? "fact_conflict"
        : decision?.ambiguity?.present === true
          ? "ambiguous"
          : roleAccepted
            ? "none"
            : text(advisoryEntry?.status || decision?.adjudicationState || "rejected");
    const candidateRoles = unique([
      ...asArray(decision?.candidateMetadata?.parserRoles),
      decision?.canonicalRole,
    ]);
    const acceptedSourceBacked = Boolean(
      roleAccepted &&
      acceptedEntry?.authority_decision?.sourceBacked === true
    );
    const acceptedSectionEligibility = Object.values(asObject(acceptedEntry?.section_eligibility));

    return {
      documentClass: "support",
      documentId: fileId || text(decision?.sourceFingerprint) || "unidentified_support_document",
      sourceIdentityKey: sourceIdentityKey("support", fileId),
      artifactId: text(acceptedEntry?.artifact_id) || null,
      fileId: fileId || null,
      originalFilename: text(decision?.originalFilename || acceptedEntry?.original_filename || advisoryEntry?.original_filename) || null,
      extraction: {
        state: text(decision?.extractionState) || "unknown",
        quality: null,
        ocrUsed: null,
        warnings: unique(decision?.ambiguity?.reasons),
      },
      candidateRoles,
      adjudicatedRole: roleAccepted ? text(acceptedEntry?.canonical_role) || null : null,
      acceptedFacts,
      rejectedFacts,
      acceptedFactEvidence: roleAccepted
        ? clone(asObject(acceptedEntry?.accepted_fact_evidence))
        : {},
      rejectedFactEvidence: roleAccepted
        ? rejectedConflictEvidence
        : clone(asObject(decision?.acceptedFactEvidence)),
      sourcePresent: decision?.sourcePresent === true,
      roleAccepted,
      factAccepted,
      sourceBacked: acceptedSourceBacked,
      sectionDisplayReady: Boolean(
        acceptedSourceBacked &&
        (
          acceptedSectionEligibility.some((value) => value === true) ||
          (acceptedSectionEligibility.length === 0 && acceptedEntry?.authority_decision?.sectionDisplayReady === true)
        )
      ),
      conflict: {
        state: conflictState,
        reasons: unique([
          ...asArray(decision?.ambiguity?.reasons),
          conflicts.has(fileId) ? "conflicting_accepted_fact_bundle" : null,
          ...fileFactConflicts.map((conflict) => `conflicting_accepted_fact:${text(conflict?.fact_name)}`),
          duplicates.has(fileId) ? "duplicate_physical_source" : null,
          !roleAccepted && advisoryEntry?.status ? advisoryEntry.status : null,
        ]),
      },
      duplicate: {
        state: duplicates.has(fileId) ? "duplicate" : "none",
        duplicateOf: null,
      },
      confidence: {
        state: roleAccepted
          ? "deterministically_adjudicated"
          : decision?.ambiguity?.present === true
            ? "ambiguous_not_accepted"
            : "not_accepted",
        numericScore: null,
        basis: "canonical_source_truth_support_adjudication",
      },
      authority: {
        source: SOURCE_TRUTH_SOURCE,
        adjudicatorVersion: text(decision?.authorityVersion) || null,
        candidateRoleAccepted: decision?.roleAccepted === true,
        authorityCreating: false,
        receiptOnly: true,
      },
    };
  });
}

function sectionOutcome(status) {
  const normalized = text(status).toLowerCase();
  if (["collapse", "collapsed"].includes(normalized)) return "collapsed";
  if (["omit", "omitted"].includes(normalized)) return "omitted";
  if (["qualify", "qualified"].includes(normalized)) return "qualified";
  if (["disclose", "disclosed", "disclosure"].includes(normalized)) return "disclosed";
  if (["render", "rendered", "required", "optional", "required_if_source_present"].includes(normalized)) {
    return "rendered";
  }
  return "unresolved";
}

function customerImpactForOutcome(outcome) {
  const copy = {
    rendered: "Section included under its canonical source and fact contract.",
    collapsed: "Section withheld because its accepted fact bundle was incomplete or unavailable.",
    omitted: "Section intentionally omitted under canonical section policy.",
    qualified: "Section included with a source or completeness qualification.",
    disclosed: "Section included as a source limitation or reconciliation disclosure.",
    unresolved: "Section decision was not resolved by a canonical section contract.",
  };
  return copy[outcome] || copy.unresolved;
}

function buildAcquisitionSections(customerSurfaceModel) {
  return Object.entries(asObject(customerSurfaceModel?.sections)).map(([sectionKey, section]) => {
    const factAvailability = asObject(section?.factAvailability);
    const outcome = sectionOutcome(section?.status);
    const acceptedFacts = clone(asObject(section?.facts));
    const availableFacts = unique(factAvailability.available);
    const sourceBacked = factAvailability.sourceBacked === true;
    const sourceDocument = asObject(section?.sourceDoc);
    return {
      sectionKey,
      contractStatus: text(section?.status) || null,
      outcome,
      reasonCodes: unique([
        ...asArray(factAvailability.missing).map((fact) => `missing:${text(fact)}`),
        outcome === "unresolved" ? "SECTION_CONTRACT_STATUS_UNRESOLVED" : null,
      ]),
      severity: outcome === "unresolved" ? "critical" : "informational",
      customerImpact: customerImpactForOutcome(outcome),
      expected: outcome !== "unresolved",
      reviewRequired: outcome === "unresolved",
      customerContactRequired: false,
      sourcePresent: factAvailability.sourcePresent === true || Boolean(text(sourceDocument.fileId || sourceDocument.file_id)),
      roleAccepted: factAvailability.roleAccepted === true || sourceBacked || Boolean(text(section?.sourceRole).startsWith("core_")),
      factAccepted: factAvailability.factAccepted === true || availableFacts.length > 0,
      sourceBacked,
      sectionDisplayReady: outcome === "rendered" || outcome === "qualified" || outcome === "disclosed",
      acceptedFacts,
      requiredFacts: unique(factAvailability.required || section?.requiredFacts),
      availableFacts,
      missingFacts: unique(factAvailability.missing),
      sourceBindings: clone(asArray(section?.sourceBindings)),
      sourceIdentityKeys: unique([
        sourceDocument?.acceptedProvenance?.acceptedSourceIdentityKey,
        sourceDocument?.acceptedSourceIdentityKey,
        sourceIdentityKey(
          text(section?.sourceRole).startsWith("core_") ? "core" : "support",
          sourceDocument?.fileId || sourceDocument?.file_id,
          sourceDocument?.artifactId || sourceDocument?.artifact_id
        ),
      ]),
    };
  });
}

function buildScreeningSections(sourceTruthPackage) {
  const policy = asObject(sourceTruthPackage?.section_policy);
  const acceptedSupport = asArray(sourceTruthPackage?.support?.accepted);
  const supportDecisions = asArray(sourceTruthPackage?.support?.adjudication_decisions);
  const coreBacked = sourceTruthPackage?.core_publishable === true;
  return Object.entries(policy).map(([sectionKey, action]) => {
    const roles = SCREENING_SUPPORT_ROLE_BY_SECTION[sectionKey] || [];
    const supportEntry = acceptedSupport.find((entry) => roles.includes(text(entry?.canonical_role))) || null;
    const roleDecision = supportDecisions.find((decision) => roles.includes(text(decision?.canonicalRole))) || null;
    const isCore = CORE_SECTION_KEYS.has(sectionKey);
    const sourcePresent = isCore
      ? Boolean(sourceTruthPackage?.core?.t12 && sourceTruthPackage?.core?.rent_roll)
      : roleDecision?.sourcePresent === true;
    const roleAccepted = isCore ? coreBacked : Boolean(supportEntry);
    const acceptedFacts = isCore ? {} : clone(asObject(supportEntry?.accepted_facts));
    const factAccepted = isCore ? coreBacked : Object.keys(acceptedFacts).length > 0;
    const sourceBacked = isCore ? coreBacked : Boolean(supportEntry?.authority_decision?.sourceBacked === true);
    const outcome = sectionOutcome(action);
    return {
      sectionKey,
      contractStatus: text(action) || null,
      outcome,
      reasonCodes: outcome === "unresolved" ? ["SECTION_POLICY_STATUS_UNRESOLVED"] : [],
      severity: outcome === "unresolved" ? "critical" : "informational",
      customerImpact: customerImpactForOutcome(outcome),
      expected: outcome !== "unresolved",
      reviewRequired: outcome === "unresolved",
      customerContactRequired: false,
      sourcePresent,
      roleAccepted,
      factAccepted,
      sourceBacked,
      sectionDisplayReady: ["rendered", "qualified", "disclosed"].includes(outcome),
      acceptedFacts,
      requiredFacts: [],
      availableFacts: Object.keys(acceptedFacts),
      missingFacts: [],
      sourceBindings: [],
      sourceIdentityKeys: unique([
        supportEntry ? sourceIdentityKey("support", supportEntry.file_id, supportEntry.artifact_id) : null,
      ]),
    };
  });
}

function buildCalculationReceipts(customerSurfaceModel) {
  const coreT12 = asObject(customerSurfaceModel?.coreSources?.coreT12);
  const coreRentRoll = asObject(customerSurfaceModel?.coreSources?.coreRentRoll);
  const coreIdentityKeys = unique([
    sourceIdentityKey("core", coreT12.fileId || coreT12.file_id, coreT12.artifactId || coreT12.artifact_id),
    sourceIdentityKey("core", coreRentRoll.fileId || coreRentRoll.file_id, coreRentRoll.artifactId || coreRentRoll.artifact_id),
  ]);
  const existingReceipts = Object.entries(asObject(customerSurfaceModel?.financialTruth)).map(([calculationKey, receipt]) => {
    const numerator = Number(receipt?.numerator);
    const denominator = Number(receipt?.denominator);
    const result = Number(receipt?.result);
    const eligible = receipt?.displayReady === true && Number.isFinite(result);
    return {
      calculationKey,
      label: text(receipt?.label) || calculationKey,
      formula: text(receipt?.formula) || null,
      formulaVersion: "customer_surface_financial_truth_v1",
      requiredInputs: unique([receipt?.numeratorFact, receipt?.denominatorFact]),
      inputProvenance: coreIdentityKeys,
      units: calculationKey.toLowerCase().includes("occupancy") ? "ratio" : null,
      inputs: {
        numerator: Number.isFinite(numerator) ? numerator : null,
        denominator: Number.isFinite(denominator) ? denominator : null,
      },
      result: eligible ? result : null,
      eligible,
      sectionDisplayReady: eligible,
      collapseReason: eligible ? null : "CALCULATION_REQUIRED_INPUTS_INCOMPLETE",
      authority: {
        source: "customer_surface_model_financial_truth",
        authorityCreating: false,
        receiptOnly: true,
      },
    };
  });
  const institutionalReceipts = asArray(
    customerSurfaceModel?.financialIntelligence?.calculationReceipts
  ).map((receipt) => ({
    ...clone(asObject(receipt)),
    authority: {
      ...clone(asObject(receipt?.authority)),
      source: "canonical_institutional_financial_intelligence",
      authorityCreating: false,
      receiptOnly: true,
    },
  }));
  const byKey = new Map();
  for (const receipt of [...existingReceipts, ...institutionalReceipts]) {
    const key = text(receipt?.calculationKey);
    if (!key) continue;
    byKey.set(key, receipt);
  }
  return [...byKey.values()];
}

function receiptSummary(value, fields = []) {
  if (!value || typeof value !== "object") return null;
  const output = {};
  for (const field of fields) {
    if (value[field] !== undefined) output[field] = clone(value[field]);
  }
  return output;
}

export function validateReportQualityManifest(manifest, { requireFinal = false } = {}) {
  const issues = [];
  const push = (code, path, message) => issues.push({ code, path, message });
  const source = text(manifest?.source);
  if (![MANIFEST_CANDIDATE_SOURCE, MANIFEST_FINAL_SOURCE].includes(source)) {
    push("MANIFEST_SOURCE_INVALID", "source", "Manifest source marker is invalid.");
  }
  if (manifest?.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    push("MANIFEST_SCHEMA_VERSION_INVALID", "schemaVersion", "Manifest schema version is invalid.");
  }
  if (manifest?.authority?.authorityCreating !== false || manifest?.authority?.receiptOnly !== true) {
    push("MANIFEST_AUTHORITY_BOUNDARY_INVALID", "authority", "Manifest must remain receipt-only and non-authoritative.");
  }
  if (text(manifest?.report?.jobId).length === 0) {
    push("MANIFEST_JOB_ID_MISSING", "report.jobId", "A job identity is required.");
  }
  if (text(manifest?.report?.reportFamily).length === 0) {
    push("MANIFEST_REPORT_FAMILY_MISSING", "report.reportFamily", "A report family is required.");
  }

  const documents = asArray(manifest?.documents);
  const identityKeys = documents.map((document) => text(document?.sourceIdentityKey)).filter(Boolean);
  if (identityKeys.length !== new Set(identityKeys).size) {
    push("MANIFEST_DOCUMENT_IDENTITY_DUPLICATE", "documents", "Document source identity keys must be unique.");
  }
  for (const [index, document] of documents.entries()) {
    const path = `documents[${index}]`;
    if (document?.roleAccepted !== true && Object.keys(asObject(document?.acceptedFacts)).length > 0) {
      push("MANIFEST_UNACCEPTED_FACT_LEAK", `${path}.acceptedFacts`, "Unaccepted documents cannot contain accepted facts.");
    }
    if (document?.factAccepted === true && Object.keys(asObject(document?.acceptedFacts)).length === 0) {
      push("MANIFEST_FALSE_FACT_ACCEPTANCE", `${path}.factAccepted`, "Fact acceptance requires accepted facts.");
    }
    if (document?.sourceBacked === true && document?.roleAccepted !== true) {
      push("MANIFEST_SOURCE_BACKED_WITHOUT_ROLE", `${path}.sourceBacked`, "Source-backed state requires accepted role authority.");
    }
    if (document?.sectionDisplayReady === true && document?.sourceBacked !== true) {
      push("MANIFEST_DISPLAY_READY_WITHOUT_SOURCE_BACKING", `${path}.sectionDisplayReady`, "Display-ready support requires source-backed authority.");
    }
    if (["conflicting", "duplicate", "ambiguous"].includes(text(document?.conflict?.state)) && document?.roleAccepted === true) {
      push("MANIFEST_CONFLICT_ACCEPTED", `${path}.roleAccepted`, "Conflicting, duplicate, or ambiguous documents cannot be accepted authority.");
    }
  }

  for (const [index, section] of asArray(manifest?.sections).entries()) {
    if (!["rendered", "collapsed", "omitted", "qualified", "disclosed"].includes(text(section?.outcome))) {
      push("MANIFEST_SECTION_OUTCOME_INVALID", `sections[${index}].outcome`, "Section outcome must be canonical and resolved.");
    }
  }

  for (const [index, calculation] of asArray(manifest?.calculations).entries()) {
    const path = `calculations[${index}]`;
    if (calculation?.eligible !== true && calculation?.result !== null) {
      push("MANIFEST_INELIGIBLE_CALCULATION_RESULT", `${path}.result`, "Ineligible calculations must not expose a result.");
    }
    if (calculation?.eligible === true && !Number.isFinite(Number(calculation?.result))) {
      push("MANIFEST_ELIGIBLE_CALCULATION_RESULT_MISSING", `${path}.result`, "Eligible calculations require a finite result.");
    }
    if (calculation?.calculationKey === "breakEvenOccupancy" && calculation?.eligible === true) {
      const numerator = Number(calculation?.inputs?.numerator);
      const denominator = Number(calculation?.inputs?.denominator);
      const result = Number(calculation?.result);
      if (!(Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0)) {
        push("MANIFEST_BREAK_EVEN_INPUTS_INVALID", `${path}.inputs`, "Break-even occupancy requires finite inputs and a positive denominator.");
      } else if (Math.abs(numerator / denominator - result) > 1e-9) {
        push("MANIFEST_BREAK_EVEN_RESULT_MISMATCH", `${path}.result`, "Break-even occupancy does not reconcile to its recorded inputs.");
      }
    }
  }

  const institutionalFinancialIntelligence = asObject(
    manifest?.receipts?.institutionalFinancialIntelligence
  );
  if (Object.keys(institutionalFinancialIntelligence).length > 0) {
    if (
      institutionalFinancialIntelligence.source !== "canonical_institutional_financial_intelligence" ||
      institutionalFinancialIntelligence.receiptVersion !== 1 ||
      institutionalFinancialIntelligence?.policy?.authorityCreating !== false ||
      institutionalFinancialIntelligence?.policy?.downstreamConsumeOnly !== true ||
      institutionalFinancialIntelligence.reportPublicationBlocker !== false
    ) {
      push(
        "MANIFEST_FINANCIAL_INTELLIGENCE_RECEIPT_INVALID",
        "receipts.institutionalFinancialIntelligence",
        "Institutional financial intelligence must remain canonical, consume-only, non-authoritative, and non-blocking."
      );
    }
  }

  if (requireFinal || source === MANIFEST_FINAL_SOURCE) {
    const publicationState = text(manifest?.publication?.state);
    const deliveryReceipt = asObject(manifest?.receipts?.deliveryGate);
    const delivery = explicitDeliveryState(deliveryReceipt);
    const hasCanonicalDelivery = deliveryReceipt.source === DELIVERY_DECISION_SOURCE;
    if (!["published", "blocked"].includes(publicationState)) {
      push("MANIFEST_FINAL_PUBLICATION_STATE_INVALID", "publication.state", "Final manifest requires a published or blocked terminal state.");
    }
    if (publicationState === "published") {
      if (!hasCanonicalDelivery) {
        push("MANIFEST_FINAL_CANONICAL_DELIVERY_REQUIRED", "receipts.deliveryGate", "Published manifest requires the canonical delivery decision receipt.");
      }
      if (!text(manifest?.report?.reportId) || !text(manifest?.publication?.storagePath)) {
        push("MANIFEST_FINAL_PUBLICATION_IDENTITY_MISSING", "publication", "Published manifest requires report and storage identity.");
      }
      if (delivery.status !== "deliverable" || delivery.customerDeliveryAllowed !== true || delivery.holdDelivery === true) {
        push("MANIFEST_FINAL_DELIVERY_NOT_ALLOWED", "receipts.deliveryGate", "Published manifest requires explicit deliverable authority.");
      }
      if (!finalPdfCustomerDeliveryAllowed(manifest?.receipts?.finalPdfPublicationQualityBoss)) {
        push("MANIFEST_FINAL_PDF_DELIVERY_NOT_ALLOWED", "receipts.finalPdfPublicationQualityBoss", "Published manifest requires a PDF Boss receipt that explicitly allows customer delivery.");
      }
    }
    if (publicationState === "blocked") {
      if (!text(manifest?.terminalOutcome?.code) || !text(manifest?.terminalOutcome?.failureClass)) {
        push("MANIFEST_BLOCKED_TERMINAL_OUTCOME_MISSING", "terminalOutcome", "Blocked manifest requires an explicit terminal outcome receipt.");
      }
      if (Object.keys(deliveryReceipt).length > 0 && !hasCanonicalDelivery) {
        push("MANIFEST_BLOCKED_DELIVERY_RECEIPT_NONCANONICAL", "receipts.deliveryGate", "A blocked delivery receipt must be canonical when present.");
      }
      if (
        hasCanonicalDelivery &&
        delivery.customerDeliveryAllowed === true &&
        delivery.holdDelivery !== true &&
        text(manifest?.terminalOutcome?.failureClass) === "customer_document_failure"
      ) {
        push("MANIFEST_BLOCKED_CORE_FAILURE_WITH_DELIVERABLE_AUTHORITY", "receipts.deliveryGate", "A catastrophic core-evidence block cannot carry deliverable customer authority.");
      }
      if (manifest?.publication?.pdfCertified === true) {
        push("MANIFEST_BLOCKED_PDF_CERTIFIED", "publication.pdfCertified", "Blocked manifest cannot represent a certified customer publication.");
      }
    }
  }

  return deepFreeze({ ok: issues.length === 0, issues });
}

export function buildReportQualityManifestCandidate({
  jobId,
  userId = null,
  reportId = null,
  reportFamily,
  reportType = null,
  reportMode = null,
  propertyName = null,
  generatedAt = new Date().toISOString(),
  sourceTruthPackage,
  customerSurfaceModel = null,
  customerSurfaceModelValidation = null,
  customerSurfaceHtmlValidation = null,
  deterministicContractQaSeal = null,
  bossCompliance = null,
  deliveryDecision = null,
  sourceCoverageQa = null,
  renderedQaStatus = null,
  sourcePackageQa = null,
  qaManagerReview = null,
  finalPdfPublicationQualityBoss = null,
} = {}) {
  if (sourceTruthPackage?.source !== SOURCE_TRUTH_SOURCE) {
    throw new Error("REPORT_QUALITY_MANIFEST_CANONICAL_SOURCE_TRUTH_REQUIRED");
  }
  const corePublishable = sourceTruthPackage?.core_publishable === true;
  const documents = [
    buildCoreDocument(sourceTruthPackage?.core?.t12, "core_t12", corePublishable),
    buildCoreDocument(sourceTruthPackage?.core?.rent_roll, "core_rent_roll", corePublishable),
    ...buildSupportDocuments(sourceTruthPackage),
  ];
  const sections = customerSurfaceModel
    ? buildAcquisitionSections(customerSurfaceModel)
    : buildScreeningSections(sourceTruthPackage);
  const calculations = customerSurfaceModel
    ? buildCalculationReceipts(customerSurfaceModel)
    : [];
  const delivery = explicitDeliveryState(deliveryDecision);
  const supportDocuments = documents.filter((document) => document.documentClass === "support");
  const candidate = {
    source: MANIFEST_CANDIDATE_SOURCE,
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt,
    finalizedAt: null,
    authority: {
      source: "canonical_receipts_only",
      authorityCreating: false,
      receiptOnly: true,
      downstreamConsumeOnly: true,
      legacyUnderwritingReuseAllowed: false,
    },
    report: {
      jobId: text(jobId) || null,
      userId: text(userId) || null,
      reportId: text(reportId) || null,
      reportFamily: text(reportFamily) || null,
      reportType: text(reportType) || null,
      reportMode: text(reportMode) || null,
      propertyName: text(propertyName) || null,
    },
    qualityState: {
      corePublishable,
      trueBlockers: unique(sourceTruthPackage?.true_blockers),
      confidence: corePublishable ? "core_validated" : "core_not_publishable",
      optionalSupport: {
        sourcePresentCount: supportDocuments.filter((document) => document.sourcePresent).length,
        roleAcceptedCount: supportDocuments.filter((document) => document.roleAccepted).length,
        factAcceptedCount: supportDocuments.filter((document) => document.factAccepted).length,
        sourceBackedCount: supportDocuments.filter((document) => document.sourceBacked).length,
        ambiguousOrConflictingCount: supportDocuments.filter((document) =>
          ["ambiguous", "conflicting", "fact_conflict", "duplicate"].includes(text(document?.conflict?.state))
        ).length,
      },
      delivery: delivery,
    },
    documents,
    calculations,
    sections,
    conflicts: clone(asArray(sourceTruthPackage?.support?.conflicts)),
    factConflicts: clone(asArray(sourceTruthPackage?.support?.fact_conflicts)),
    duplicates: clone(asArray(sourceTruthPackage?.support?.duplicates)),
    disclosures: clone(asArray(sourceTruthPackage?.disclosures)),
    receipts: {
      sourceTruth: {
        source: sourceTruthPackage.source,
        schemaVersion: sourceTruthPackage.schema_version,
        corePublishable,
        trueBlockers: clone(asArray(sourceTruthPackage?.true_blockers)),
      },
      customerSurfaceModel: customerSurfaceModel
        ? {
            modelVersion: text(customerSurfaceModel?.modelVersion) || null,
            validation: receiptSummary(customerSurfaceModelValidation, ["ok", "issues"]),
            htmlValidation: receiptSummary(customerSurfaceHtmlValidation, ["ok", "issues"]),
          }
        : null,
      institutionalFinancialIntelligence: customerSurfaceModel?.financialIntelligence
        ? receiptSummary(customerSurfaceModel.financialIntelligence, [
            "source",
            "receiptVersion",
            "sourceTruthReceipt",
            "analysisContext",
            "policy",
            "customerSections",
            "calculationReceipts",
            "coverage",
            "reportPublicationBlocker",
          ])
        : null,
      deterministicContractQaSeal: receiptSummary(deterministicContractQaSeal, [
        "source",
        "version",
        "ok",
        "status",
        "issues",
        "violations",
      ]),
      boss: receiptSummary(bossCompliance, ["ok", "status", "violations", "issues"]),
      deliveryGate: clone(asObject(deliveryDecision)),
      finalPdfPublicationQualityBoss: finalPdfPublicationQualityBoss
        ? clone(asObject(finalPdfPublicationQualityBoss))
        : null,
      advisoryQa: {
        renderedQaStatus: text(renderedQaStatus) || null,
        sourceCoverageQa: receiptSummary(sourceCoverageQa, ["severity", "deterministic_flags"]),
        sourcePackageQa: receiptSummary(sourcePackageQa, ["status", "score", "counts", "findings"]),
        qaManagerReview: receiptSummary(qaManagerReview, ["status", "score", "counts", "findings"]),
      },
    },
    publication: {
      state: "candidate",
      storagePath: null,
      pdfCertified: finalPdfStrictlyCertified(finalPdfPublicationQualityBoss),
      pdfQualityDisposition: finalPdfPublicationQualityBoss?.publication_disposition || null,
    },
    credit: { state: "not_finalized" },
    remedy: { state: "not_required_for_candidate" },
  };
  const validation = validateReportQualityManifest(candidate);
  if (!validation.ok) {
    const error = new Error("REPORT_QUALITY_MANIFEST_CANDIDATE_INVALID");
    error.context = { validation };
    throw error;
  }
  return deepFreeze(candidate);
}

export function buildUnavailableReportQualityManifestCandidate({
  jobId,
  userId = null,
  reportFamily,
  reportType = null,
  reportMode = null,
  propertyName = null,
  blockerCode,
  generatedAt = new Date().toISOString(),
} = {}) {
  const candidate = {
    source: MANIFEST_CANDIDATE_SOURCE,
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    generatedAt,
    finalizedAt: null,
    authority: {
      source: "canonical_receipts_only",
      authorityCreating: false,
      receiptOnly: true,
      downstreamConsumeOnly: true,
      legacyUnderwritingReuseAllowed: false,
    },
    report: {
      jobId: text(jobId) || null,
      userId: text(userId) || null,
      reportId: null,
      reportFamily: text(reportFamily) || null,
      reportType: text(reportType) || null,
      reportMode: text(reportMode) || null,
      propertyName: text(propertyName) || null,
    },
    qualityState: {
      corePublishable: false,
      trueBlockers: unique([blockerCode]),
      confidence: "canonical_evidence_unavailable",
      optionalSupport: {
        sourcePresentCount: 0,
        roleAcceptedCount: 0,
        factAcceptedCount: 0,
        sourceBackedCount: 0,
        ambiguousOrConflictingCount: 0,
      },
      delivery: explicitDeliveryState(null),
    },
    documents: [],
    calculations: [],
    sections: [],
    conflicts: [],
    duplicates: [],
    disclosures: [],
    receipts: {
      sourceTruth: null,
      customerSurfaceModel: null,
      deterministicContractQaSeal: null,
      boss: null,
      deliveryGate: null,
      finalPdfPublicationQualityBoss: null,
      advisoryQa: null,
    },
    publication: {
      state: "candidate",
      storagePath: null,
      pdfCertified: false,
    },
    credit: { state: "not_finalized" },
    remedy: { state: "not_required_for_candidate" },
  };
  const validation = validateReportQualityManifest(candidate);
  if (!validation.ok) {
    const error = new Error("REPORT_QUALITY_MANIFEST_UNAVAILABLE_CANDIDATE_INVALID");
    error.context = { validation };
    throw error;
  }
  return deepFreeze(candidate);
}

export function finalizeReportQualityManifest({
  candidate,
  reportId,
  storagePath,
  deliveryDecision,
  finalPdfPublicationQualityBoss,
  publicationState = "published",
  creditState = null,
  remedyState = null,
  finalizedAt = new Date().toISOString(),
} = {}) {
  const candidateValidation = validateReportQualityManifest(candidate);
  if (!candidateValidation.ok || candidate?.source !== MANIFEST_CANDIDATE_SOURCE) {
    const error = new Error("REPORT_QUALITY_MANIFEST_VALID_CANDIDATE_REQUIRED");
    error.context = { validation: candidateValidation };
    throw error;
  }
  const finalManifest = {
    ...clone(candidate),
    source: MANIFEST_FINAL_SOURCE,
    finalizedAt,
    report: {
      ...clone(candidate.report),
      reportId: text(reportId) || null,
    },
    qualityState: {
      ...clone(candidate.qualityState),
      confidence: finalPdfStrictlyCertified(finalPdfPublicationQualityBoss)
        ? "verified_publication"
        : "verified_publication_with_quality_incident",
      delivery: explicitDeliveryState(deliveryDecision),
    },
    receipts: {
      ...clone(candidate.receipts),
      deliveryGate: clone(asObject(deliveryDecision)),
      finalPdfPublicationQualityBoss: clone(asObject(finalPdfPublicationQualityBoss)),
    },
    publication: {
      state: text(publicationState) || null,
      storagePath: text(storagePath) || null,
      pdfCertified:
        finalPdfStrictlyCertified(finalPdfPublicationQualityBoss),
      pdfQualityDisposition: finalPdfPublicationQualityBoss?.publication_disposition || null,
    },
    credit: clone(creditState || { state: "reconciled" }),
    remedy: clone(remedyState || { state: "not_required" }),
  };
  const validation = validateReportQualityManifest(finalManifest, { requireFinal: true });
  if (!validation.ok) {
    const error = new Error("REPORT_QUALITY_MANIFEST_FINAL_INVALID");
    error.context = { validation };
    throw error;
  }
  return deepFreeze(finalManifest);
}

export function finalizeBlockedReportQualityManifest({
  candidate,
  reportId = null,
  storagePath = null,
  deliveryDecision = null,
  terminalOutcome,
  creditState = null,
  remedyState = null,
  finalizedAt = new Date().toISOString(),
} = {}) {
  const candidateValidation = validateReportQualityManifest(candidate);
  if (!candidateValidation.ok || candidate?.source !== MANIFEST_CANDIDATE_SOURCE) {
    const error = new Error("REPORT_QUALITY_MANIFEST_VALID_CANDIDATE_REQUIRED");
    error.context = { validation: candidateValidation };
    throw error;
  }
  const terminal = asObject(terminalOutcome);
  const finalManifest = {
    ...clone(candidate),
    source: MANIFEST_FINAL_SOURCE,
    finalizedAt,
    report: {
      ...clone(candidate.report),
      reportId: text(reportId) || null,
    },
    qualityState: {
      ...clone(candidate.qualityState),
      confidence: "verified_terminal_block",
      delivery: explicitDeliveryState(deliveryDecision),
    },
    receipts: {
      ...clone(candidate.receipts),
      deliveryGate: deliveryDecision ? clone(asObject(deliveryDecision)) : null,
      finalPdfPublicationQualityBoss: null,
    },
    publication: {
      state: "blocked",
      storagePath: text(storagePath) || null,
      pdfCertified: false,
    },
    terminalOutcome: {
      code: text(terminal.code) || null,
      failureClass: text(terminal.failureClass || terminal.failure_class) || null,
      customerDocumentReplacementRequired:
        terminal.customerDocumentReplacementRequired === true ||
        terminal.customer_document_replacement_required === true,
      retrySafe: terminal.retrySafe === true || terminal.retry_safe === true,
      message: text(terminal.message) || null,
    },
    credit: clone(creditState || { state: "restoration_status_unknown" }),
    remedy: clone(remedyState || { state: "review_required" }),
  };
  const validation = validateReportQualityManifest(finalManifest, { requireFinal: true });
  if (!validation.ok) {
    const error = new Error("REPORT_QUALITY_MANIFEST_BLOCKED_FINAL_INVALID");
    error.context = { validation };
    throw error;
  }
  return deepFreeze(finalManifest);
}

export const REPORT_QUALITY_MANIFEST_CONTRACT = deepFreeze({
  schemaVersion: MANIFEST_SCHEMA_VERSION,
  candidateSource: MANIFEST_CANDIDATE_SOURCE,
  finalSource: MANIFEST_FINAL_SOURCE,
  authorityCreating: false,
  receiptOnly: true,
  legacyUnderwritingReuseAllowed: false,
  terminalStates: ["published", "blocked"],
});
