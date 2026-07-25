const PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION =
  "premium_acquisition_underwriting_v1_model_v1";
const PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION =
  "premium_acquisition_underwriting_v1";
const BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION =
  "acquisition_underwriting_base_v1";
const PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG =
  "PREMIUM_ACQUISITION_UNDERWRITING_V1";

const PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS = Object.freeze([
  "executiveUnderwritingSummary",
  "propertyAndTransactionContext",
  "operatingPerformance",
  "rentRollAndUnitEconomics",
  "expenseStructure",
  "currentAndProposedDebt",
  "debtCapacityAndCoverage",
  "valuationAndAppraisalBridge",
  "capitalPlanEvidence",
  "marketEvidence",
  "environmentalEvidence",
  "evidenceAndDiligenceRegister",
  "sourceReconciliation",
  "methodsDefinitionsAndLimitations",
  "supportingAppendices",
]);

const PREMIUM_ACQUISITION_UNDERWRITING_V1_PROHIBITED_INPUTS = Object.freeze([
  "customerSurfaceModel",
  "renderedHtml",
  "rawUploads",
  "unacceptedExtractionCandidates",
  "compatibilityObjects",
  "legacyState",
  "pdfText",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function explicitCapabilityEnabled(value) {
  if (value === true) return true;
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

function receiptSummary(receipt, receiptKey, required) {
  const present = isPlainObject(receipt);
  return {
    receiptKey,
    required: Boolean(required),
    present,
    schemaVersion: present
      ? firstNonEmptyString(
          receipt.schema_version,
          receipt.schemaVersion,
          receipt.version,
          receipt.modelVersion,
          receipt.contract_version,
          receipt.contractVersion,
        )
      : null,
    authority: present
      ? firstNonEmptyString(
          receipt.authority,
          receipt.authority_version,
          receipt.authorityVersion,
          receipt.canonical_authority,
          receipt.canonicalAuthority,
        )
      : null,
    status: present
      ? firstNonEmptyString(
          receipt.status,
          receipt.validation_state,
          receipt.validationState,
          receipt.decision,
        )
      : null,
  };
}

function buildDisconnectedSections() {
  return Object.fromEntries(
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS.map((sectionKey) => [
      sectionKey,
      {
        sectionKey,
        status: "not_connected",
        customerVisible: false,
        facts: [],
        calculations: [],
        lineage: [],
        collapseReason: "premium_model_skeleton_disconnected",
      },
    ]),
  );
}

function freezeTree(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freezeTree(child);
  return Object.freeze(value);
}

function resolvePremiumAcquisitionUnderwritingV1Activation({
  capabilityEnabled = false,
  reportSurfaceVersion = null,
} = {}) {
  const capability = explicitCapabilityEnabled(capabilityEnabled);
  const normalizedSurfaceVersion = firstNonEmptyString(reportSurfaceVersion);
  const premiumSurfacePinned =
    normalizedSurfaceVersion === PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION;
  const requested = capability && premiumSurfacePinned;

  let status = "disabled_capability";
  if (capability && !premiumSurfacePinned) status = "surface_version_not_premium";
  if (requested) status = "requested_disconnected";

  return freezeTree({
    capabilityFlag: PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
    capabilityEnabled: capability,
    reportSurfaceVersion:
      normalizedSurfaceVersion || BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
    premiumSurfacePinned,
    requested,
    status,
    rendererEligible: false,
    publicationEligible: false,
    reason: requested
      ? "premium_model_skeleton_is_not_connected"
      : capability
        ? "job_surface_version_is_not_premium"
        : "premium_capability_is_disabled",
  });
}

function validatePremiumAcquisitionUnderwritingV1Model(model = null) {
  const issues = [];
  const pushIssue = (code, path, message) => {
    issues.push({ code, severity: "critical", path, message });
  };

  if (!isPlainObject(model)) {
    pushIssue(
      "PREMIUM_MODEL_INVALID",
      "model",
      "Premium Acquisition Underwriting V1 model must be an object.",
    );
    return { ok: false, status: "invalid", issues };
  }

  if (model.modelVersion !== PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION) {
    pushIssue(
      "PREMIUM_MODEL_VERSION_INVALID",
      "model.modelVersion",
      "Premium model version is missing or unsupported.",
    );
  }
  if (model.inputReceipts?.canonicalSourceTruthPackage?.present !== true) {
    pushIssue(
      "PREMIUM_CANONICAL_SOURCE_TRUTH_REQUIRED",
      "model.inputReceipts.canonicalSourceTruthPackage",
      "A canonical Source Truth package receipt is required.",
    );
  }
  if (model.inputReceipts?.canonicalReportIdentity?.present !== true) {
    pushIssue(
      "PREMIUM_CANONICAL_REPORT_IDENTITY_REQUIRED",
      "model.inputReceipts.canonicalReportIdentity",
      "A canonical report-identity receipt is required.",
    );
  }
  if (model.integration?.connected !== false) {
    pushIssue(
      "PREMIUM_SKELETON_MUST_REMAIN_DISCONNECTED",
      "model.integration.connected",
      "The Phase 1 premium model skeleton may not connect to a customer surface.",
    );
  }
  for (const authorityKey of [
    "sourceAuthority",
    "deliveryAuthority",
    "publicationAuthority",
    "workerAuthority",
    "billingAuthority",
    "remedyAuthority",
  ]) {
    if (model.authority?.[authorityKey] !== false) {
      pushIssue(
        "PREMIUM_SKELETON_AUTHORITY_PROHIBITED",
        `model.authority.${authorityKey}`,
        `The disconnected premium model may not hold ${authorityKey}.`,
      );
    }
  }

  for (const sectionKey of PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS) {
    const section = model.sections?.[sectionKey];
    if (!isPlainObject(section)) {
      pushIssue(
        "PREMIUM_SECTION_SKELETON_MISSING",
        `model.sections.${sectionKey}`,
        `Premium section skeleton ${sectionKey} is required.`,
      );
      continue;
    }
    if (
      section.status !== "not_connected" ||
      section.customerVisible !== false ||
      !Array.isArray(section.facts) ||
      section.facts.length !== 0 ||
      !Array.isArray(section.calculations) ||
      section.calculations.length !== 0
    ) {
      pushIssue(
        "PREMIUM_SECTION_CONNECTED_BEFORE_AUTHORITY",
        `model.sections.${sectionKey}`,
        `Premium section ${sectionKey} must remain empty and disconnected in Phase 1.`,
      );
    }
  }

  return {
    ok: issues.length === 0,
    status: issues.length === 0 ? "valid_disconnected_skeleton" : "invalid",
    issues,
  };
}

function buildPremiumAcquisitionUnderwritingV1Model({
  canonicalSourceTruthPackage = null,
  canonicalFinancialIntelligence = null,
  canonicalSourceReconciliation = null,
  canonicalReportIdentity = null,
  canonicalDocumentTreatment = null,
  capabilityEnabled = false,
  reportSurfaceVersion = null,
} = {}) {
  const activation = resolvePremiumAcquisitionUnderwritingV1Activation({
    capabilityEnabled,
    reportSurfaceVersion,
  });

  const model = {
    modelVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION,
    doctrineVersion: "premium_acquisition_underwriting_v1_doctrine_2026_07_25",
    phase: "disconnected_model_skeleton",
    activation,
    integration: {
      connected: false,
      customerSurfaceEligible: false,
      rendererInsertionPresent: false,
      reason: "phase_1_disconnected_by_doctrine",
    },
    authority: {
      sourceAuthority: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      workerAuthority: false,
      billingAuthority: false,
      remedyAuthority: false,
    },
    inputContract: {
      mode: "canonical_receipts_only",
      prohibitedInputs: [...PREMIUM_ACQUISITION_UNDERWRITING_V1_PROHIBITED_INPUTS],
      rawReceiptPayloadsRetained: false,
    },
    inputReceipts: {
      canonicalSourceTruthPackage: receiptSummary(
        canonicalSourceTruthPackage,
        "canonicalSourceTruthPackage",
        true,
      ),
      canonicalFinancialIntelligence: receiptSummary(
        canonicalFinancialIntelligence,
        "canonicalFinancialIntelligence",
        false,
      ),
      canonicalSourceReconciliation: receiptSummary(
        canonicalSourceReconciliation,
        "canonicalSourceReconciliation",
        false,
      ),
      canonicalReportIdentity: receiptSummary(
        canonicalReportIdentity,
        "canonicalReportIdentity",
        true,
      ),
      canonicalDocumentTreatment: receiptSummary(
        canonicalDocumentTreatment,
        "canonicalDocumentTreatment",
        false,
      ),
    },
    sections: buildDisconnectedSections(),
    calculations: [],
    customerSurface: null,
  };

  const validation = validatePremiumAcquisitionUnderwritingV1Model(model);
  return freezeTree({
    ...model,
    validation,
  });
}

export {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_MODEL_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_PROHIBITED_INPUTS,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SECTION_KEYS,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  buildPremiumAcquisitionUnderwritingV1Model,
  resolvePremiumAcquisitionUnderwritingV1Activation,
  validatePremiumAcquisitionUnderwritingV1Model,
};
