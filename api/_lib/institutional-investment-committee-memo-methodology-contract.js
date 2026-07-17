import { isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract } from './institutional-investment-committee-memo-authority-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_investment_committee_memo_methodology_contract';
const CONTRACT_VERSION = 1;

const COMPONENT_METHODOLOGIES = Object.freeze({
  thesis: Object.freeze({
    componentKey: 'investment_thesis',
    methodologyKey: 'source_bound_investment_thesis_methodology',
    authorityField: 'approved_investment_thesis_methodology',
    requiredInputAuthorityFields: Object.freeze([
      'complete_canonical_investment_case_fact_selection',
    ]),
    methodRules: Object.freeze([
      'use_only_separately_adjudicated_canonical_evidence_references',
      'preserve_upstream_semantic_restrictions',
      'require_source_support_for_every_future_claim',
      'omit_component_when_no_authorized_claim_is_available',
    ]),
  }),
  strengths: Object.freeze({
    componentKey: 'investment_strengths',
    methodologyKey: 'source_bound_investment_strength_methodology',
    authorityField: 'approved_strength_classification_policy',
    requiredInputAuthorityFields: Object.freeze([
      'complete_canonical_strength_evidence',
    ]),
    methodRules: Object.freeze([
      'require_separate_deterministic_strength_classification_receipt',
      'use_only_evidence_references_satisfying_the_approved_criterion',
      'preserve_upstream_semantic_restrictions',
      'omit_component_when_no_authorized_strength_is_available',
    ]),
  }),
  weaknesses: Object.freeze({
    componentKey: 'investment_weaknesses',
    methodologyKey: 'source_bound_investment_weakness_methodology',
    authorityField: 'approved_weakness_classification_policy',
    requiredInputAuthorityFields: Object.freeze([
      'complete_canonical_weakness_evidence',
    ]),
    methodRules: Object.freeze([
      'require_separate_deterministic_weakness_classification_receipt',
      'use_only_evidence_references_satisfying_the_approved_criterion',
      'preserve_upstream_semantic_restrictions',
      'omit_component_when_no_authorized_weakness_is_available',
    ]),
  }),
  risks: Object.freeze({
    componentKey: 'principal_risks',
    methodologyKey: 'source_bound_principal_risk_methodology',
    authorityField: 'approved_risk_classification_policy',
    requiredInputAuthorityFields: Object.freeze([
      'complete_canonical_risk_evidence',
    ]),
    methodRules: Object.freeze([
      'require_separate_deterministic_risk_classification_receipt',
      'do_not_promote_missing_optional_evidence_to_a_risk_fact',
      'preserve_upstream_semantic_restrictions',
      'omit_component_when_no_authorized_risk_is_available',
    ]),
  }),
  diligence: Object.freeze({
    componentKey: 'required_diligence',
    methodologyKey: 'source_bound_required_diligence_methodology',
    authorityField: 'approved_diligence_prioritization_policy',
    requiredInputAuthorityFields: Object.freeze([
      'canonical_due_diligence_gap_authority',
    ]),
    methodRules: Object.freeze([
      'require_separate_canonical_due_diligence_gap_receipt',
      'do_not_convert_optional_document_absence_to_core_failure',
      'require_separate_deterministic_priority_receipt',
      'omit_component_when_no_authorized_diligence_item_is_available',
    ]),
  }),
  recommendation: Object.freeze({
    componentKey: 'investment_recommendation',
    methodologyKey: 'source_bound_investment_recommendation_methodology',
    authorityField: 'approved_investment_recommendation_policy',
    requiredInputAuthorityFields: Object.freeze([
      'authorized_investment_thesis',
      'authorized_investment_strengths',
      'authorized_investment_weaknesses',
      'authorized_principal_risks',
      'authorized_required_diligence',
    ]),
    methodRules: Object.freeze([
      'require_all_component_authority_receipts',
      'require_separate_deterministic_recommendation_receipt',
      'prohibit_trading_directive_language',
      'omit_component_when_recommendation_authority_is_incomplete',
    ]),
  }),
  confidence: Object.freeze({
    componentKey: 'recommendation_confidence',
    methodologyKey: 'source_bound_recommendation_confidence_methodology',
    authorityField: 'approved_recommendation_confidence_methodology',
    requiredInputAuthorityFields: Object.freeze([
      'authorized_investment_recommendation',
    ]),
    methodRules: Object.freeze([
      'require_authorized_investment_recommendation',
      'require_separate_deterministic_evidence_coverage_receipt',
      'prohibit_subjective_confidence_assignment',
      'omit_component_when_confidence_authority_is_incomplete',
    ]),
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function selectedEvidenceReferences(memoAuthorityContract) {
  return Object.entries(memoAuthorityContract.objectiveEvidence)
    .flatMap(([familyProperty, family]) => family.availableEvidenceKeys.map((evidenceKey, index) => ({
      familyKey: family.familyKey,
      evidenceKey,
      canonicalSource: family.canonicalSource,
      upstreamPointer: `objectiveEvidence.${familyProperty}.availableEvidenceKeys.${index}`,
      referenceOnly: true,
      valueCopied: false,
      provenancePreservedUpstream: true,
      sourceBound: true,
      narrativeAuthorityCreated: false,
      reportPublicationBlocker: false,
    })));
}

function componentMethodology(definition) {
  return {
    componentKey: definition.componentKey,
    methodologyKey: definition.methodologyKey,
    methodologyVersion: 1,
    authorityField: definition.authorityField,
    authorityState: 'approved_for_future_bounded_execution',
    methodologyAuthorityEstablished: true,
    requiredInputAuthorityFields: [...definition.requiredInputAuthorityFields],
    methodRules: [...definition.methodRules],
    executionAuthorized: false,
    assignedEvidenceReferences: [],
    content: null,
    classificationPerformed: false,
    diligencePrioritized: false,
    recommendationProduced: false,
    confidenceAssigned: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(memoAuthorityContract) {
  const evidenceReferences = selectedEvidenceReferences(memoAuthorityContract);
  const componentMethodologies = Object.fromEntries(
    Object.entries(COMPONENT_METHODOLOGIES).map(([key, definition]) => [
      key,
      componentMethodology(definition),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: memoAuthorityContract,
    upstreamReceipt: {
      source: memoAuthorityContract.source,
      contractVersion: memoAuthorityContract.contractVersion,
      jobId: memoAuthorityContract.upstreamReceipt.jobId,
      corePublishable: memoAuthorityContract.upstreamReceipt.corePublishable,
      exactCanonicalGate6AReceipt: true,
      availableObjectiveEvidenceCount: memoAuthorityContract.coverage.availableObjectiveEvidenceCount,
      authorizedMemoComponentCount: memoAuthorityContract.coverage.authorizedMemoComponentCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      factSelectionAuthorityEstablished: true,
      componentMethodologyAuthorityEstablished: true,
      selectionReferencesOnly: true,
      evidenceValuesCopied: false,
      calculationsPerformed: false,
      evidenceRanked: false,
      evidenceClassified: false,
      thesisInferred: false,
      diligencePrioritized: false,
      recommendationAuthorized: false,
      confidenceAssigned: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      unsupportedSectionsCollapseOrOmit: true,
      optionalMemoAuthorityFailureMayBlockValidatedCorePublication: false,
      callerOverridesAccepted: false,
      legacyUnderwritingReuseAllowed: false,
    },
    factSelection: {
      selectionKey: 'canonical_investment_case_fact_selection',
      authorityState: 'complete_for_available_gate_6a_evidence',
      selectionMode: 'all_available_gate_6a_objective_evidence_references',
      completenessScope: 'available_gate_6a_objective_evidence_only',
      completeCanonicalInvestmentCaseFactSelection: true,
      documentCompletenessClaimed: false,
      unsupportedOrUnavailableEvidenceSelected: false,
      evidenceValuesCopied: false,
      selectedEvidenceReferences: evidenceReferences,
      selectedEvidenceReferenceCount: evidenceReferences.length,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    componentMethodologies,
    authorityReceipts: {
      completeCanonicalInvestmentCaseFactSelection: true,
      approvedInvestmentThesisMethodology: true,
      approvedStrengthClassificationPolicy: true,
      approvedWeaknessClassificationPolicy: true,
      approvedRiskClassificationPolicy: true,
      approvedDiligencePrioritizationPolicy: true,
      approvedInvestmentRecommendationPolicy: true,
      approvedRecommendationConfidenceMethodology: true,
      componentEvidenceAdjudicationComplete: false,
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
      status: 'not_generated_methodology_execution_not_authorized',
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
      selectedEvidenceReferenceCount: evidenceReferences.length,
      availableObjectiveEvidenceCount: memoAuthorityContract.coverage.availableObjectiveEvidenceCount,
      approvedComponentMethodologyCount: Object.keys(componentMethodologies).length,
      totalComponentMethodologyCount: Object.keys(COMPONENT_METHODOLOGIES).length,
      executedComponentMethodologyCount: 0,
      authorizedMemoComponentCount: 0,
      generatedMemoOutputCount: 0,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
  memoAuthorityContract,
} = {}) {
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(memoAuthorityContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_6A_MEMO_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_6B_METHODOLOGY');
  }
  return deepFreeze(assembleContract(memoAuthorityContract));
}

export const INSTITUTIONAL_INVESTMENT_COMMITTEE_MEMO_METHODOLOGY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  sourceAuthorityCreating: false,
  factSelectionAuthorityEstablished: true,
  componentMethodologyAuthorityEstablished: true,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
