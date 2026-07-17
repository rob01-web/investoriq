/**
 * Builds the full Acquisition Memo data projection from canonical source package only.
 * Must not re-read raw files, parser artifacts, or filename heuristics.
 * Must not independently classify documents.
 */

import { isCanonicalInstitutionalFinancialIntelligence } from "./institutional-financial-intelligence.js";

function isCanonicalSupportDocEntry(entry) {
  return Boolean(entry) && typeof entry === "object";
}

function isSupportRole(entry, role) {
  return String(entry?.canonicalRole || "").trim() === String(role || "").trim();
}

function selectAdjudicatedPrimaryByRole(entries, role) {
  return entries.find((entry) => entry?.primaryForRole === true && isSupportRole(entry, role)) || null;
}

function selectAdjudicatedPrimaryByAcceptedRoles(entries, roles) {
  for (const role of roles) {
    const accepted = selectAdjudicatedPrimaryByRole(entries, role);
    if (accepted) return accepted;
  }
  return null;
}

function cloneEntry(entry) {
  return entry && typeof entry === "object" ? { ...entry } : null;
}

function resolvePurchaseAssumptionLoanAmountCandidate(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeProjectedPurchaseAssumptionEntry(entry) {
  const cloned = cloneEntry(entry);
  if (!cloned) return null;
  const facts = cloneEntry(cloned.extractedFacts) || {};
  const resolvedLoanAmount =
    resolvePurchaseAssumptionLoanAmountCandidate(facts.proposed_loan_amount) ??
    resolvePurchaseAssumptionLoanAmountCandidate(facts.stated_acquisition_loan_amount) ??
    resolvePurchaseAssumptionLoanAmountCandidate(facts.derived_acquisition_loan_amount) ??
    resolvePurchaseAssumptionLoanAmountCandidate(facts.loan_amount);
  if (resolvePurchaseAssumptionLoanAmountCandidate(facts.proposed_loan_amount) == null && resolvedLoanAmount != null) {
    facts.proposed_loan_amount = resolvedLoanAmount;
  }
  cloned.extractedFacts = facts;
  return cloned;
}

function buildFinancialIntelligenceReconciliation(financialIntelligence) {
  if (!isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) return null;
  const result = financialIntelligence?.analyses?.coreReconciliation?.reconciliation || null;
  if (result?.calculationStatus !== "calculated" || result?.sourceBound !== true) {
    return {
      state: {
        status: "insufficient_inputs",
        t12_gpr: null,
        rr_annual_in_place: null,
        difference_amount: null,
        variance_pct: null,
        source_reconciliation_disclosure: null,
        materiality_classification: null,
        source_bound: false,
      },
      disclosures: [],
      sourceBacked: false,
    };
  }
  const variancePresent = Number(result.differenceAmount) !== 0;
  const disclosure = String(result.sourceBoundExplanation || "").trim();
  return {
    state: {
      status: variancePresent ? "source_reconciliation_required" : "aligned",
      t12_gpr: result.t12GrossPotentialRent,
      rr_annual_in_place: result.rentRollAnnualInPlaceRent,
      difference_amount: result.differenceAmount,
      variance_pct: result.varianceRatioToT12Gpr,
      source_reconciliation_disclosure: disclosure,
      materiality_classification: null,
      materiality_threshold: null,
      source_bound: true,
      comparison_status: result.comparisonStatus || null,
    },
    disclosures: variancePresent && disclosure
      ? [{ code: "SOURCE_RECONCILIATION_DISCLOSURE", text: disclosure }]
      : [],
    sourceBacked: true,
  };
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
      value: projection?.supportDocProjection?.purchaseAssumptions?.sectionEligibility?.proposedFinancing === true,
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

export function buildAcquisitionMemoProjection(canonicalSourcePackage, { financialIntelligence = null } = {}) {
  if (financialIntelligence && !isCanonicalInstitutionalFinancialIntelligence(financialIntelligence)) {
    throw new Error("CANONICAL_INSTITUTIONAL_FINANCIAL_INTELLIGENCE_REQUIRED_FOR_ACQUISITION_PROJECTION");
  }
  const supportDocsMap = canonicalSourcePackage?.supportDocs instanceof Map
    ? canonicalSourcePackage.supportDocs
    : new Map();

  const allSupportDocs = Array.from(supportDocsMap.values()).filter(isCanonicalSupportDocEntry);
  const purchaseAssumptions = selectAdjudicatedPrimaryByRole(allSupportDocs, "purchase_assumptions");
  const currentDebtContext = selectAdjudicatedPrimaryByRole(allSupportDocs, "current_debt_context");
  const structuredRenovation = selectAdjudicatedPrimaryByAcceptedRoles(allSupportDocs, [
    "renovation_capex_context",
    "structured_renovation_capex_plan",
  ]);
  const appraisalContext = selectAdjudicatedPrimaryByRole(allSupportDocs, "appraisal_context");
  const marketSurveyContext = selectAdjudicatedPrimaryByRole(allSupportDocs, "market_survey_context");
  const environmentalContext = selectAdjudicatedPrimaryByRole(allSupportDocs, "environmental_context");
  const otherSupportDocs = allSupportDocs.filter(
    (entry) =>
      !isSupportRole(entry, "purchase_assumptions") &&
      !isSupportRole(entry, "current_debt_context") &&
      !isSupportRole(entry, "renovation_capex_context") &&
      !isSupportRole(entry, "structured_renovation_capex_plan") &&
      !isSupportRole(entry, "appraisal_context") &&
      !isSupportRole(entry, "market_survey_context") &&
      !isSupportRole(entry, "environmental_context")
  );

  const coreT12 = canonicalSourcePackage?.coreT12 && typeof canonicalSourcePackage.coreT12 === "object" ? canonicalSourcePackage.coreT12 : null;
  const coreRentRoll = canonicalSourcePackage?.coreRentRoll && typeof canonicalSourcePackage.coreRentRoll === "object" ? canonicalSourcePackage.coreRentRoll : null;
  const sourceTruthAuthority = canonicalSourcePackage?.sourceTruthAuthority && typeof canonicalSourcePackage.sourceTruthAuthority === "object"
    ? canonicalSourcePackage.sourceTruthAuthority
    : null;
  const sourceReconciliationState = cloneEntry(sourceTruthAuthority?.source_reconciliation_state);
  const sourceReconciliationDisclosures = Array.isArray(sourceTruthAuthority?.disclosures)
    ? sourceTruthAuthority.disclosures.map(cloneEntry).filter(Boolean)
    : [];
  const canonicalSourceReconciliation = sourceTruthAuthority
    ? {
        state: sourceReconciliationState
          ? {
              ...sourceReconciliationState,
              materiality_classification: sourceReconciliationState.materiality_classification ?? null,
              materiality_threshold: sourceReconciliationState.materiality_threshold ?? null,
              comparison_status: sourceReconciliationState.comparison_status ?? null,
            }
          : null,
        disclosures: sourceReconciliationDisclosures,
        sourceBacked: Boolean(
          sourceReconciliationState &&
          Number.isFinite(Number(sourceReconciliationState.t12_gpr)) &&
          Number.isFinite(Number(sourceReconciliationState.rr_annual_in_place))
        ),
      }
    : null;
  const financialIntelligenceReconciliation = buildFinancialIntelligenceReconciliation(financialIntelligence);
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
      purchaseAssumptions: normalizeProjectedPurchaseAssumptionEntry(purchaseAssumptions),
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
      purchaseAssumptionsSourcePresent: Array.isArray(canonicalSourcePackage?.supportAuthorityDecisions) && canonicalSourcePackage.supportAuthorityDecisions.some((decision) =>
        decision?.canonicalRole === "purchase_assumptions" || decision?.semanticEvidence?.families?.acquisition_financing?.hasAffirmativeEvidence === true
      ),
      currentDebtSourcePresent: Array.isArray(canonicalSourcePackage?.supportAuthorityDecisions) && canonicalSourcePackage.supportAuthorityDecisions.some((decision) =>
        decision?.canonicalRole === "current_debt_context" || decision?.semanticEvidence?.families?.current_debt?.hasAffirmativeEvidence === true
      ),
      acquisitionRequestDisplayReady: purchaseAssumptions?.sectionEligibility?.acquisitionRequest === true,
      proposedFinancingDisplayReady: purchaseAssumptions?.sectionEligibility?.proposedFinancing === true,
      currentDebtDisplayReady: currentDebtContext?.sectionEligibility?.currentDebt === true,
      hasStructuredRenovation: Boolean(structuredRenovation),
      hasAppraisalContext: Boolean(appraisalContext),
      hasMarketSurveyContext: Boolean(marketSurveyContext),
      hasEnvironmentalContext: Boolean(environmentalContext),
    },
    sourceAuthorityDiagnostic: {
      competingDecisionMakersEliminated: true,
      authorityVersion: "v2",
      classifiedBy: "canonical_source_truth_support_adjudicator",
      projectedBy: "buildAcquisitionMemoProjection",
    },
    sourceReconciliation: canonicalSourceReconciliation || financialIntelligenceReconciliation,
    financialIntelligence,
  };

  projection.acquisitionContext = normalizeProjectedPurchaseAssumptionEntry(purchaseAssumptions);
  projection.proposedFinancingContext = normalizeProjectedPurchaseAssumptionEntry(purchaseAssumptions);
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
