/**
 * Builds the full Acquisition Memo data projection from canonical source package only.
 * Must not re-read raw files, parser artifacts, or filename heuristics.
 * Must not independently classify documents.
 */

function isCanonicalSupportDocEntry(entry) {
  return Boolean(entry) && typeof entry === "object";
}

function isSupportRole(entry, role) {
  return String(entry?.canonicalRole || "").trim() === role;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildAcquisitionMemoProjection(canonicalSourcePackage) {
  const supportDocsMap = canonicalSourcePackage?.supportDocs instanceof Map
    ? canonicalSourcePackage.supportDocs
    : new Map();

  const allSupportDocs = Array.from(supportDocsMap.values()).filter(isCanonicalSupportDocEntry);
  const purchaseAssumptions = allSupportDocs.find((entry) => isSupportRole(entry, "purchase_assumptions")) || null;
  const currentDebtContext = allSupportDocs.find((entry) => isSupportRole(entry, "current_debt_context")) || null;
  const structuredRenovation = allSupportDocs.find((entry) => isSupportRole(entry, "structured_renovation_capex_plan")) || null;
  const appraisalContext = allSupportDocs.find((entry) => isSupportRole(entry, "appraisal_context")) || null;
  const marketSurveyContext = allSupportDocs.find((entry) => isSupportRole(entry, "market_survey_context")) || null;
  const environmentalContext = allSupportDocs.find((entry) => isSupportRole(entry, "environmental_context")) || null;
  const otherSupportDocs = allSupportDocs.filter(
    (entry) =>
      !isSupportRole(entry, "purchase_assumptions") &&
      !isSupportRole(entry, "current_debt_context") &&
      !isSupportRole(entry, "structured_renovation_capex_plan") &&
      !isSupportRole(entry, "appraisal_context") &&
      !isSupportRole(entry, "market_survey_context") &&
      !isSupportRole(entry, "environmental_context")
  );

  const coreT12 = canonicalSourcePackage?.coreT12 && typeof canonicalSourcePackage.coreT12 === "object" ? canonicalSourcePackage.coreT12 : null;
  const coreRentRoll = canonicalSourcePackage?.coreRentRoll && typeof canonicalSourcePackage.coreRentRoll === "object" ? canonicalSourcePackage.coreRentRoll : null;

  return {
    authorityVersion: "v2",
    coreSourceSummary: {
      t12: coreT12 ? { fileId: coreT12.fileId || null, originalFilename: coreT12.originalFilename || null, role: coreT12.role || "core_t12" } : null,
      rentRoll: coreRentRoll
        ? { fileId: coreRentRoll.fileId || null, originalFilename: coreRentRoll.originalFilename || null, role: coreRentRoll.role || "core_rent_roll" }
        : null,
      hasCoreT12: Boolean(coreT12),
      hasCoreRentRoll: Boolean(coreRentRoll),
      bothCoreSourcesPresent: Boolean(coreT12) && Boolean(coreRentRoll),
    },
    supportDocProjection: {
      purchaseAssumptions,
      currentDebtContext,
      structuredRenovation,
      appraisalContext,
      marketSurveyContext,
      environmentalContext,
      otherSupportDocs,
      allSupportDocs,
    },
    documentTreatmentRows: allSupportDocs,
    financingReadinessSignals: {
      hasPurchaseAssumptions: Boolean(purchaseAssumptions),
      hasCurrentDebtContext: Boolean(currentDebtContext),
      hasStructuredRenovation: Boolean(structuredRenovation),
      hasAppraisalContext: Boolean(appraisalContext),
      hasMarketSurveyContext: Boolean(marketSurveyContext),
      hasEnvironmentalContext: Boolean(environmentalContext),
    },
    sourceAuthorityDiagnostic: {
      competingDecisionMakersEliminated: true,
      authorityVersion: "v2",
      classifiedBy: "buildCanonicalSourcePackage",
      projectedBy: "buildAcquisitionMemoProjection",
    },
  };
}
