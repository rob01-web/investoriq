import { isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract } from './institutional-investment-committee-memo-methodology-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_investment_committee_memo_component_evidence_contract';
const CONTRACT_VERSION = 1;

const UNAVAILABLE_COMPONENTS = Object.freeze({
  strengths: Object.freeze({
    componentKey: 'investment_strengths',
    missingAuthorityField: 'complete_canonical_strength_evidence',
    availableAuthorityField: 'approved_strength_classification_policy',
    reasonCode: 'DETERMINISTIC_STRENGTH_CLASSIFICATION_RECEIPT_NOT_AVAILABLE',
  }),
  weaknesses: Object.freeze({
    componentKey: 'investment_weaknesses',
    missingAuthorityField: 'complete_canonical_weakness_evidence',
    availableAuthorityField: 'approved_weakness_classification_policy',
    reasonCode: 'DETERMINISTIC_WEAKNESS_CLASSIFICATION_RECEIPT_NOT_AVAILABLE',
  }),
  risks: Object.freeze({
    componentKey: 'principal_risks',
    missingAuthorityField: 'complete_canonical_risk_evidence',
    availableAuthorityField: 'approved_risk_classification_policy',
    reasonCode: 'DETERMINISTIC_RISK_CLASSIFICATION_RECEIPT_NOT_AVAILABLE',
  }),
  diligence: Object.freeze({
    componentKey: 'required_diligence',
    missingAuthorityField: 'canonical_due_diligence_gap_authority',
    availableAuthorityField: 'approved_diligence_prioritization_policy',
    reasonCode: 'CANONICAL_DUE_DILIGENCE_GAP_RECEIPT_NOT_AVAILABLE',
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function adjudicatedThesisReference(reference, index) {
  return {
    familyKey: reference.familyKey,
    evidenceKey: reference.evidenceKey,
    canonicalSource: reference.canonicalSource,
    gate6BSelectionPointer: `factSelection.selectedEvidenceReferences.${index}`,
    upstreamEvidencePointer: reference.upstreamPointer,
    sourceBound: true,
    referenceOnly: true,
    valueCopied: false,
    provenancePreservedUpstream: true,
    componentSemanticAssignment: 'neutral_investment_case_evidence',
    classificationPerformed: false,
    reportPublicationBlocker: false,
  };
}

function componentEvidenceReceipt({
  componentKey,
  methodology,
  adjudicationState,
  evidenceAuthorityEstablished,
  requiredAuthorityFields,
  availableAuthorityFields,
  missingAuthorityFields,
  adjudicatedEvidenceReferences = [],
  reasonCode,
}) {
  return {
    componentKey,
    methodologyKey: methodology.methodologyKey,
    methodologyVersion: methodology.methodologyVersion,
    adjudicationState,
    evidenceAuthorityEstablished,
    requiredAuthorityFields,
    availableAuthorityFields,
    missingAuthorityFields,
    adjudicatedEvidenceReferences,
    adjudicatedEvidenceReferenceCount: adjudicatedEvidenceReferences.length,
    reasonCode,
    componentMethodologyExecuted: false,
    classificationPerformed: false,
    diligencePrioritized: false,
    recommendationProduced: false,
    confidenceAssigned: false,
    content: null,
    narrativeAuthorized: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unavailableClassifiedComponent(methodologyContract, componentProperty, definition) {
  return componentEvidenceReceipt({
    componentKey: definition.componentKey,
    methodology: methodologyContract.componentMethodologies[componentProperty],
    adjudicationState: 'not_adjudicated_missing_separate_deterministic_receipt',
    evidenceAuthorityEstablished: false,
    requiredAuthorityFields: [
      definition.missingAuthorityField,
      definition.availableAuthorityField,
    ],
    availableAuthorityFields: [definition.availableAuthorityField],
    missingAuthorityFields: [definition.missingAuthorityField],
    reasonCode: definition.reasonCode,
  });
}

function unavailableDependentComponent({
  methodology,
  componentKey,
  requiredAuthorityFields,
  availableAuthorityField,
  reasonCode,
}) {
  return componentEvidenceReceipt({
    componentKey,
    methodology,
    adjudicationState: 'not_adjudicated_missing_authorized_component_receipts',
    evidenceAuthorityEstablished: false,
    requiredAuthorityFields: [...requiredAuthorityFields, availableAuthorityField],
    availableAuthorityFields: [availableAuthorityField],
    missingAuthorityFields: [...requiredAuthorityFields],
    reasonCode,
  });
}

function assembleContract(methodologyContract) {
  const adjudicatedThesisEvidence = methodologyContract.factSelection.selectedEvidenceReferences
    .map(adjudicatedThesisReference);
  const methodologies = methodologyContract.componentMethodologies;
  const componentEvidence = {
    thesis: componentEvidenceReceipt({
      componentKey: 'investment_thesis',
      methodology: methodologies.thesis,
      adjudicationState: 'neutral_evidence_pool_adjudicated',
      evidenceAuthorityEstablished: true,
      requiredAuthorityFields: [
        'complete_canonical_investment_case_fact_selection',
        'approved_investment_thesis_methodology',
      ],
      availableAuthorityFields: [
        'complete_canonical_investment_case_fact_selection',
        'approved_investment_thesis_methodology',
      ],
      missingAuthorityFields: [],
      adjudicatedEvidenceReferences: adjudicatedThesisEvidence,
      reasonCode: null,
    }),
    strengths: unavailableClassifiedComponent(
      methodologyContract,
      'strengths',
      UNAVAILABLE_COMPONENTS.strengths
    ),
    weaknesses: unavailableClassifiedComponent(
      methodologyContract,
      'weaknesses',
      UNAVAILABLE_COMPONENTS.weaknesses
    ),
    risks: unavailableClassifiedComponent(
      methodologyContract,
      'risks',
      UNAVAILABLE_COMPONENTS.risks
    ),
    diligence: unavailableClassifiedComponent(
      methodologyContract,
      'diligence',
      UNAVAILABLE_COMPONENTS.diligence
    ),
    recommendation: unavailableDependentComponent({
      methodology: methodologies.recommendation,
      componentKey: 'investment_recommendation',
      requiredAuthorityFields: [
        'authorized_investment_thesis',
        'authorized_investment_strengths',
        'authorized_investment_weaknesses',
        'authorized_principal_risks',
        'authorized_required_diligence',
      ],
      availableAuthorityField: 'approved_investment_recommendation_policy',
      reasonCode: 'AUTHORIZED_MEMO_COMPONENT_RECEIPTS_NOT_AVAILABLE_FOR_RECOMMENDATION',
    }),
    confidence: unavailableDependentComponent({
      methodology: methodologies.confidence,
      componentKey: 'recommendation_confidence',
      requiredAuthorityFields: ['authorized_investment_recommendation'],
      availableAuthorityField: 'approved_recommendation_confidence_methodology',
      reasonCode: 'AUTHORIZED_INVESTMENT_RECOMMENDATION_NOT_AVAILABLE_FOR_CONFIDENCE',
    }),
  };

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: methodologyContract,
    upstreamReceipt: {
      source: methodologyContract.source,
      contractVersion: methodologyContract.contractVersion,
      jobId: methodologyContract.upstreamReceipt.jobId,
      corePublishable: methodologyContract.upstreamReceipt.corePublishable,
      exactCanonicalGate6BReceipt: true,
      selectedEvidenceReferenceCount: methodologyContract.coverage.selectedEvidenceReferenceCount,
      approvedComponentMethodologyCount: methodologyContract.coverage.approvedComponentMethodologyCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      componentEvidenceAdjudicationAuthorityEstablished: true,
      neutralThesisEvidencePoolEstablished: true,
      evidenceReferencesOnly: true,
      evidenceValuesCopied: false,
      calculationsPerformed: false,
      componentMethodologiesExecuted: false,
      classificationCriteriaCreated: false,
      strengthsClassified: false,
      weaknessesClassified: false,
      risksClassified: false,
      missingOptionalEvidencePromotedToRisk: false,
      diligenceGapsInferred: false,
      diligencePrioritized: false,
      thesisInferred: false,
      recommendationAuthorized: false,
      confidenceAssigned: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      unsupportedComponentsCollapseOrOmit: true,
      optionalComponentEvidenceFailureMayBlockValidatedCorePublication: false,
      callerOverridesAccepted: false,
      legacyUnderwritingReuseAllowed: false,
    },
    componentEvidence,
    authorityReceipts: {
      completeCanonicalInvestmentCaseFactSelection: true,
      completeCanonicalThesisEvidence: true,
      completeCanonicalStrengthEvidence: false,
      completeCanonicalWeaknessEvidence: false,
      completeCanonicalRiskEvidence: false,
      canonicalDueDiligenceGapAuthorityEstablished: false,
      authorizedInvestmentThesis: false,
      authorizedInvestmentStrengths: false,
      authorizedInvestmentWeaknesses: false,
      authorizedPrincipalRisks: false,
      authorizedRequiredDiligence: false,
      authorizedInvestmentRecommendation: false,
      authorizedRecommendationConfidence: false,
    },
    memoOutput: {
      status: 'not_generated_component_methodology_execution_not_authorized',
      thesis: null,
      strengths: null,
      weaknesses: null,
      risks: null,
      diligence: null,
      recommendation: null,
      confidence: null,
      narrativeGenerated: false,
      recommendationGenerated: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    coverage: {
      selectedEvidenceReferenceCount: methodologyContract.coverage.selectedEvidenceReferenceCount,
      adjudicatedThesisEvidenceReferenceCount: adjudicatedThesisEvidence.length,
      componentEvidenceAuthorityCount: 1,
      totalComponentEvidenceCount: Object.keys(componentEvidence).length,
      classifiedComponentCount: 0,
      authorizedMemoComponentCount: 0,
      generatedMemoOutputCount: 0,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
  methodologyContract,
} = {}) {
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(methodologyContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_6B_METHODOLOGY_CONTRACT_REQUIRED_FOR_GATE_6C_COMPONENT_EVIDENCE');
  }
  return deepFreeze(assembleContract(methodologyContract));
}

export const INSTITUTIONAL_INVESTMENT_COMMITTEE_MEMO_COMPONENT_EVIDENCE_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  componentEvidenceAdjudicationAuthorityEstablished: true,
  componentMethodologiesExecuted: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
