import {
  buildSourceReconciliationRenderState,
  buildSourceReconciliationNarrativeProminencePolicy,
} from "./report-surface-contracts.js";

function normalizeToken(value) {
  const token = String(value ?? "").trim().toLowerCase();
  return token.length > 0 ? token : "";
}

function buildPropertyTaxBindingState({ propertyTaxPayload = null } = {}) {
  const idCandidates = [
    propertyTaxPayload?.source_file_id,
    propertyTaxPayload?.file_id,
    propertyTaxPayload?.document_id,
    propertyTaxPayload?.artifact_file_id,
  ]
    .map(normalizeToken)
    .filter(Boolean);
  const nameCandidates = [
    propertyTaxPayload?.source_original_filename,
    propertyTaxPayload?.original_filename,
    propertyTaxPayload?.file_name,
    propertyTaxPayload?.filename,
  ]
    .map(normalizeToken)
    .filter(Boolean);
  const annualTax = Number(propertyTaxPayload?.annual_tax);
  return {
    hasValidatedAnnualTax: Number.isFinite(annualTax) && annualTax > 0,
    hasReliableBinding: idCandidates.length > 0 || nameCandidates.length > 0,
    bindingCandidates: {
      idCandidates,
      nameCandidates,
    },
  };
}

export function buildFullUnderwritingState(input = {}) {
  const {
    reportMode = null,
    reportType = null,
    currentDebtAssessmentState = null,
    refiDebtRenderState = null,
    scorecardCoverageState = null,
    acquisitionAssumptionState = null,
    acquisitionTriangleValidationState = null,
    sourceReconciliationState = null,
    sourceReconciliationRenderState = null,
    sourceReconciliationNarrativePolicy = null,
    sectionEligibility = null,
    visibleLabelInputs = null,
    visibleLabel = null,
    verdictState = null,
    propertyTaxPayload = null,
    headlineMode = null,
    severityState = null,
    supportingDocsUsed = false,
  } = input || {};

  const resolvedReconciliationRenderState =
    sourceReconciliationRenderState ||
    buildSourceReconciliationRenderState({ sourceReconciliationState });
  const resolvedNarrativePolicy =
    sourceReconciliationNarrativePolicy ||
    buildSourceReconciliationNarrativeProminencePolicy(sourceReconciliationState);
  const sectionConstrainedCount = Number(sectionEligibility?.source_constrained_section_count || 0);
  const sourceConstrainedSectionCodes = Object.entries(sectionEligibility?.sections || {})
    .filter(([, value]) => Boolean(value?.source_constrained))
    .map(([key]) => key);
  const optionalSupportLimitationsPresent = sectionConstrainedCount > 0;

  return {
    meta: {
      reportMode: reportMode || null,
      reportType: reportType || null,
      version: "pr5-b-v1",
    },
    core: {
      currentDebt: {
        assessmentState: currentDebtAssessmentState || null,
        refiRenderState: refiDebtRenderState || null,
        scorecardCoverageState: scorecardCoverageState || null,
      },
      acquisition: {
        assumptionState: acquisitionAssumptionState || null,
        triangleValidationState: acquisitionTriangleValidationState || null, // PR5-D
        renderBehavior: acquisitionTriangleValidationState?.renderedBehavior || null, // PR5-D
      },
      reconciliation: {
        sourceReconciliationState: sourceReconciliationState || null,
        sourceReconciliationRenderState: resolvedReconciliationRenderState || null,
        narrativeProminencePolicy: resolvedNarrativePolicy || null,
      },
      sections: {
        eligibilityState: sectionEligibility || null,
      },
      classification: {
        visibleLabelInputs: visibleLabelInputs || null, // PR5-E
        visibleLabel: visibleLabel || null, // PR5-E
        verdictState: verdictState || null, // PR5-E
      },
      documentTreatment: {
        propertyTaxBindingState: buildPropertyTaxBindingState({ propertyTaxPayload }),
      },
      dataCoverage: {
        headlineMode: headlineMode || null, // PR5-E
        severityState: severityState || null, // PR5-E
        supportingDocsUsed: Boolean(supportingDocsUsed), // PR5-E
        sectionConstrainedCount,
        optionalSupportLimitationsPresent,
        sourceConstrainedSectionCodes,
      },
      optionalSections: {
        renovationEligibility: sectionEligibility?.sections?.renovation_strategy || null,
        appraisalEligibility: sectionEligibility?.sections?.dcf || null,
        marketSurveyEligibility: sectionEligibility?.sections?.advanced_modeling || null,
        environmentalEligibility: sectionEligibility?.sections?.risk_register || null,
        zoningEligibility: sectionEligibility?.sections?.risk_register || null,
      },
    },
  };
}
