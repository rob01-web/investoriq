const QUALITY_MANIFEST_VERSION = "full-underwriting-quality-manifest-v1";
const QUALITY_MANIFEST_SOURCE = "full_underwriting_quality_manifest_projection";

const SUPPORT_ROLE_LABELS = Object.freeze({
  purchase_assumptions: "Transaction / proposed financing support",
  current_debt_context: "Current debt support",
  appraisal_context: "Appraisal / valuation support",
  appraisal: "Appraisal / valuation support",
  property_condition_context: "Property condition support",
  historical_capital_context: "Historical capital support",
  renovation_capex_context: "Renovation / capital plan support",
  structured_renovation_capex_plan: "Renovation / capital plan support",
  market_survey_context: "Market rent survey support",
  environmental_context: "Environmental due diligence support",
  property_tax_support: "Property tax support",
  property_tax: "Property tax support",
  historical_debt_context: "Historical debt support",
});

const SECTION_LABELS = Object.freeze({
  acquisitionRequestContext: "Transaction Terms & Acquisition Context",
  currentDebtContext: "Current Debt Context",
  proposedFinancingContext: "Proposed Financing Context",
  appraisalContext: "Appraisal / Valuation Context",
  renovationContext: "Renovation / CapEx Context",
  marketSurveyContext: "Market Rent Survey Context",
  environmentalContext: "Environmental Due Diligence Context",
  unitMix: "Unit Mix & Rent Positioning",
  capRateValueIndication: "Cap-Rate Value Indication",
  operatingStatementTTMSummary: "Operating Statement / TTM Summary",
  dataCoverageSourceLimitations: "Data Coverage & Source Limitations",
  documentTreatment: "Source Context / Support Document Treatment",
  debtServiceCoverage: "Debt Service & Coverage",
  debtTermAnalysis: "Debt Term & Maturity Analysis",
  coreReconciliation: "Core Source Reconciliation",
  capitalPlanAnalysis: "Capital Plan & Reserve Position",
  debtCapacityAndCoverage: "Debt Capacity & Coverage",
});

const REPLACEMENT_SECTION_LABELS = Object.freeze({
  coreReconciliation: "Primary Source Reconciliation",
  acquisitionRequestContext: "Transaction Terms & Acquisition Context",
  currentDebtContext: "Current Debt Context",
  debtServiceCoverage: "Debt Service & Coverage",
  debtTermAnalysis: "Debt Term & Maturity Analysis",
  debtCapacityAndCoverage: "Debt Capacity & Coverage",
});

function array(value) {
  return Array.isArray(value) ? value : [];
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value) {
  return String(value ?? "").trim();
}

function clone(value) {
  if (value === null || value === undefined || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => clone(entry));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, clone(entry)]));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function unique(values) {
  return [...new Set(array(values).map(text).filter(Boolean))];
}

function hasAcceptedFacts(entry) {
  return Object.keys(object(entry?.accepted_facts)).length > 0;
}

function acceptedCoreEvidence(sourceTruthPackage) {
  const rows = [];
  const t12 = object(sourceTruthPackage?.core?.t12);
  const rentRoll = object(sourceTruthPackage?.core?.rent_roll);
  if (Object.keys(t12).length > 0 && hasAcceptedFacts(t12)) {
    rows.push({ key: "t12", label: "Trailing 12-Month Operating Statement", status: "Accepted core evidence" });
  }
  if (Object.keys(rentRoll).length > 0 && hasAcceptedFacts(rentRoll)) {
    rows.push({ key: "rent_roll", label: "Rent Roll", status: "Accepted core evidence" });
  }
  return rows;
}

function supportRole(entry) {
  return text(
    entry?.canonical_role ||
      entry?.validated_role ||
      entry?.authority_decision?.canonicalRole ||
      entry?.authority_decision?.canonical_role
  );
}

function supportRoleLabel(role) {
  return SUPPORT_ROLE_LABELS[role] || "Supporting document context";
}

function supportDisplayEligible(entry) {
  const eligibility = object(entry?.section_eligibility);
  if (Object.values(eligibility).some((value) => value === true)) return true;
  return entry?.authority_decision?.sectionDisplayReady === true;
}

function supportEvidenceSummary(sourceTruthPackage) {
  const support = object(sourceTruthPackage?.support);
  const accepted = array(support.accepted);
  const used = accepted.filter((entry) => supportDisplayEligible(entry));
  const acceptedLimited = accepted.filter((entry) => !supportDisplayEligible(entry));
  const excluded = [...array(support.advisory), ...array(support.rejected)];
  const excludedIds = unique(
    excluded.map((entry) => entry?.file_id || entry?.fileId || entry?.authority_decision?.fileId)
  );
  return {
    acceptedCount: accepted.length,
    usedCount: used.length,
    acceptedLimitedCount: acceptedLimited.length,
    excludedCount: excludedIds.length || excluded.length,
    usedRoleLabels: unique(used.map((entry) => supportRoleLabel(supportRole(entry)))),
    acceptedRoleLabels: unique(accepted.map((entry) => supportRoleLabel(supportRole(entry)))),
  };
}

function sourceModeSummary(sourceTruthPackage) {
  const mode = text(sourceTruthPackage?.core_input_sufficiency_state?.evidence?.core_source_mode).toLowerCase();
  const labels = {
    dual_source_core: "T12 + Rent Roll",
    t12_minimum_core: "T12-led core evidence",
    rent_roll_minimum_core: "Rent Roll-led core evidence",
    insufficient_core: "Insufficient core evidence",
  };
  return {
    code: mode || null,
    label: labels[mode] || "Accepted core evidence",
  };
}

function reconciliationSummary(sourceTruthPackage) {
  const state = object(sourceTruthPackage?.source_reconciliation_state);
  const status = text(state.status).toLowerCase();
  const disclosurePresent =
    text(state.source_reconciliation_disclosure).length > 0 || array(sourceTruthPackage?.disclosures).length > 0;
  if (disclosurePresent || ["source_reconciliation_required", "parser_suspected"].includes(status)) {
    return { status: status || null, label: "Reconciliation disclosure presented" };
  }
  if (status) {
    return { status, label: "Core evidence reconciliation reviewed" };
  }
  return { status: null, label: "Reconciliation recorded with source treatment" };
}

function sectionLabel(sectionKey) {
  if (SECTION_LABELS[sectionKey]) return SECTION_LABELS[sectionKey];
  return text(sectionKey)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sectionCoverageSummary(customerSurfaceModel, replacementCoverage = null) {
  const entries = array(customerSurfaceModel?.qualityManifest?.sectionDispositionEntries);
  const replacements = object(replacementCoverage);
  const replacedSectionKeys = new Set(
    Object.entries(replacements)
      .filter(([, rendered]) => rendered === true)
      .map(([sectionKey]) => sectionKey)
  );
  const summary = {
    total: entries.length,
    included: 0,
    qualified: 0,
    compact: 0,
    collapsed: 0,
    omitted: 0,
    reducedOrOmittedSections: [],
    replacementSections: unique(
      [...replacedSectionKeys].map(
        (sectionKey) => REPLACEMENT_SECTION_LABELS[sectionKey] || sectionLabel(sectionKey)
      )
    ),
  };
  for (const entry of entries) {
    const disposition = text(entry?.finalDisposition).toLowerCase();
    if (disposition === "include") summary.included += 1;
    else if (disposition === "include_qualified") summary.qualified += 1;
    else if (disposition === "compact") summary.compact += 1;
    else if (disposition === "collapse") summary.collapsed += 1;
    else if (disposition === "omit") summary.omitted += 1;
    if (["compact", "collapse", "omit"].includes(disposition) && !replacedSectionKeys.has(entry?.sectionKey)) {
      summary.reducedOrOmittedSections.push(sectionLabel(entry?.sectionKey));
    }
  }
  summary.reducedOrOmittedSections = unique(summary.reducedOrOmittedSections);
  return summary;
}

function calculationSummary(customerSurfaceModel, financialIntelligence) {
  const receiptVersion = Number(financialIntelligence?.receiptVersion);
  const financialTruthCount = Object.keys(object(customerSurfaceModel?.financialTruth)).length;
  const calculationReceiptCount = array(financialIntelligence?.calculationReceipts).length;
  const hasDeterministicCalculations = financialTruthCount > 0 || calculationReceiptCount > 0;
  return {
    hasDeterministicCalculations,
    frameworkVersion: Number.isInteger(receiptVersion) && receiptVersion > 0 ? receiptVersion : null,
    receiptCount: calculationReceiptCount,
    label: hasDeterministicCalculations
      ? "Deterministic calculations from accepted report inputs"
      : "No additional deterministic calculation receipts",
  };
}

function scenarioSummary(scenarioEngine) {
  const available = Boolean(scenarioEngine && typeof scenarioEngine === "object" && Object.keys(scenarioEngine).length > 0);
  return {
    included: available,
    label: available
      ? "Sensitivity analysis is included and clearly identified as scenario analysis."
      : "No scenario analysis was rendered from the available inputs.",
    evidenceBoundary: "Scenario outputs are analytical cases, not uploaded evidence.",
  };
}

export function validateFullUnderwritingQualityManifestV1(contract) {
  const issues = [];
  const push = (code, path, message) => issues.push({ code, path, message });
  if (contract?.source !== QUALITY_MANIFEST_SOURCE) push("QUALITY_MANIFEST_SOURCE_INVALID", "source", "Projection source is invalid.");
  if (contract?.version !== QUALITY_MANIFEST_VERSION) push("QUALITY_MANIFEST_VERSION_INVALID", "version", "Projection version is invalid.");
  if (contract?.authority?.authorityCreating !== false || contract?.authority?.downstreamConsumeOnly !== true) {
    push("QUALITY_MANIFEST_AUTHORITY_BOUNDARY_INVALID", "authority", "Quality Manifest projection must remain downstream-only and non-authoritative.");
  }
  if (contract?.coreEvidence?.length === 0) push("QUALITY_MANIFEST_CORE_EVIDENCE_MISSING", "coreEvidence", "At least one accepted core evidence source is required.");
  if (!text(contract?.report?.productIdentity)) push("QUALITY_MANIFEST_PRODUCT_IDENTITY_MISSING", "report.productIdentity", "Product identity is required.");
  if (!text(contract?.evidenceBasis?.sourceMode?.label)) push("QUALITY_MANIFEST_SOURCE_MODE_MISSING", "evidenceBasis.sourceMode", "Evidence basis is required.");
  return deepFreeze({ ok: issues.length === 0, issues });
}

export function buildFullUnderwritingQualityManifestV1({
  sourceTruthPackage = null,
  customerSurfaceModel = null,
  financialIntelligence = null,
  scenarioEngine = null,
  reportMeta = null,
  reportIdentity = null,
  propertyProfile = null,
  replacementCoverage = null,
} = {}) {
  if (!sourceTruthPackage || typeof sourceTruthPackage !== "object") {
    throw new Error("FULL_UNDERWRITING_QUALITY_MANIFEST_SOURCE_TRUTH_REQUIRED");
  }
  const coreEvidence = acceptedCoreEvidence(sourceTruthPackage);
  const supportEvidence = supportEvidenceSummary(sourceTruthPackage);
  const sourceMode = sourceModeSummary(sourceTruthPackage);
  const reconciliation = reconciliationSummary(sourceTruthPackage);
  const sectionCoverage = sectionCoverageSummary(customerSurfaceModel, replacementCoverage);
  const calculations = calculationSummary(customerSurfaceModel, financialIntelligence);
  const scenarios = scenarioSummary(scenarioEngine);
  const propertyName = text(
    customerSurfaceModel?.identity?.propertyName ||
      propertyProfile?.propertyName ||
      propertyProfile?.property_name ||
      reportMeta?.propertyName ||
      reportMeta?.property_name
  ) || null;
  const productIdentity = text(
    reportIdentity?.fullTitle ||
      reportIdentity?.canonicalTitle ||
      customerSurfaceModel?.identity?.reportTitle
  ) || "InvestorIQ Underwriting Report";
  const generatedAt = text(reportMeta?.generatedAt || reportMeta?.generated_at) || null;

  const contract = {
    source: QUALITY_MANIFEST_SOURCE,
    version: QUALITY_MANIFEST_VERSION,
    authority: {
      authorityCreating: false,
      receiptOnly: true,
      downstreamConsumeOnly: true,
      changesSourceTruth: false,
      changesDeliveryAuthority: false,
      changesPublicationAuthority: false,
    },
    report: {
      productIdentity,
      propertyName,
      generatedAt,
      revisionIdentityState: "assigned_at_publication",
      publicationReceiptState: "recorded_after_pdf_certification",
    },
    evidenceBasis: {
      sourceMode,
      coreReconciliation: reconciliation,
    },
    coreEvidence,
    supportEvidence,
    sectionCoverage,
    scenarios,
    calculations,
    certification: {
      finalPdfCertificationState: "recorded_with_publication_record",
      qualityIncidentState: "recorded_with_publication_record",
      revisionIdentityState: "recorded_with_publication_record",
      publicationReceiptState: "recorded_with_publication_record",
      customerCopy: "Final PDF certification, revision identity, publication receipt, and any publication-level certification notes are retained with the report publication record.",
    },
  };

  const validation = validateFullUnderwritingQualityManifestV1(contract);
  if (!validation.ok) {
    const error = new Error("FULL_UNDERWRITING_QUALITY_MANIFEST_INVALID");
    error.context = { validation: clone(validation) };
    throw error;
  }
  return deepFreeze(contract);
}

export const FULL_UNDERWRITING_QUALITY_MANIFEST_V1_CONTRACT = deepFreeze({
  source: QUALITY_MANIFEST_SOURCE,
  version: QUALITY_MANIFEST_VERSION,
  authorityCreating: false,
  downstreamConsumeOnly: true,
});

export default buildFullUnderwritingQualityManifestV1;
