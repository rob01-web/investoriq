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

function cloneEntry(entry) {
  return entry && typeof entry === "object" ? { ...entry } : null;
}

function buildChecklist(projection) {
  return [
    {
      label: "Purchase assumptions provided",
      value: Boolean(projection?.supportDocProjection?.purchaseAssumptions),
    },
    {
      label: "Current debt context uploaded",
      value: Boolean(projection?.supportDocProjection?.currentDebtContext),
    },
    {
      label: "Proposed acquisition loan terms complete",
      value: Boolean(projection?.supportDocProjection?.purchaseAssumptions?.extractedFacts?.proposed_loan_amount),
    },
    {
      label: "Property tax support",
      value: false,
    },
    {
      label: "Environmental / Phase I support",
      value: Boolean(projection?.supportDocProjection?.environmentalContext),
    },
    {
      label: "Structured renovation / CapEx plan",
      value: Boolean(projection?.supportDocProjection?.structuredRenovation),
    },
  ];
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
  const projection = {
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
      purchaseAssumptions: cloneEntry(purchaseAssumptions),
      currentDebtContext: cloneEntry(currentDebtContext),
      structuredRenovation: cloneEntry(structuredRenovation),
      appraisalContext: cloneEntry(appraisalContext),
      marketSurveyContext: cloneEntry(marketSurveyContext),
      environmentalContext: cloneEntry(environmentalContext),
      otherSupportDocs: otherSupportDocs.map(cloneEntry).filter(Boolean),
      allSupportDocs: allSupportDocs.map(cloneEntry).filter(Boolean),
    },
    documentTreatmentRows: allSupportDocs.map(cloneEntry).filter(Boolean),
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

  projection.acquisitionContext = cloneEntry(purchaseAssumptions);
  projection.proposedFinancingContext = cloneEntry(purchaseAssumptions);
  projection.currentDebtContext = cloneEntry(currentDebtContext);
  projection.renovationContext = cloneEntry(structuredRenovation);
  projection.appraisalContext = cloneEntry(appraisalContext);
  projection.marketSurveyContext = cloneEntry(marketSurveyContext);
  projection.environmentalContext = cloneEntry(environmentalContext);
  projection.lenderDiligenceChecklist = buildChecklist(projection);
  projection.sourcePackageDiagnostics = {
    authorityVersion: "v2",
    supportDocCount: allSupportDocs.length,
    coreT12Present: Boolean(coreT12),
    coreRentRollPresent: Boolean(coreRentRoll),
  };

  return projection;
}
