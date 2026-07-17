import { isCanonicalInstitutionalUnderwritingReturnReadinessContract } from './institutional-underwriting-return-readiness-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_investment_committee_memo_authority_contract';
const CONTRACT_VERSION = 1;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function calculationEvidenceFamily({ familyKey, canonicalSource, sections }) {
  const calculations = Object.values(sections || {})
    .flatMap((section) => section?.calculations || [])
    .filter((receipt) => receipt?.calculationStatus === 'calculated' && receipt?.sourceBound === true);
  return {
    familyKey,
    canonicalSource,
    evidenceState: calculations.length > 0
      ? 'objective_source_bound_evidence_available'
      : 'objective_source_bound_evidence_not_available',
    availableEvidenceKeys: calculations.map((receipt) => receipt.calculationKey || receipt.formulaKey),
    availableEvidenceCount: calculations.length,
    narrativeAuthorityCreated: false,
    classificationAuthorityCreated: false,
    recommendationAuthorityCreated: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function returnReferenceEvidenceFamily(returnReadinessContract) {
  const references = Object.values(returnReadinessContract.acceptedReferences || {})
    .filter((reference) => reference?.referenceAvailable === true && reference?.sourceBound === true);
  return {
    familyKey: 'return_readiness_references',
    canonicalSource: returnReadinessContract.source,
    evidenceState: references.length > 0
      ? 'objective_source_bound_evidence_available'
      : 'objective_source_bound_evidence_not_available',
    availableEvidenceKeys: references.map((reference) => reference.referenceKey),
    availableEvidenceCount: references.length,
    completeReturnAuthorityEstablished: false,
    narrativeAuthorityCreated: false,
    classificationAuthorityCreated: false,
    recommendationAuthorityCreated: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function unavailableMemoComponent({ componentKey, requiredAuthorityFields, reasonCode }) {
  return {
    componentKey,
    content: null,
    authorityState: 'not_authorized',
    sourceBound: false,
    policyBound: false,
    narrativeAuthorized: false,
    classificationAuthorized: false,
    requiredAuthorityFields,
    availableAuthorityFields: [],
    missingAuthorityFields: requiredAuthorityFields,
    reasonCode,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(returnReadinessContract) {
  const sourceCaseAnalysis = returnReadinessContract.upstreamAnalyses.sourceCase;
  const valuationAnalysis = returnReadinessContract.upstreamAnalyses.valuation;
  const capitalStructureAnalysis = returnReadinessContract.upstreamAnalyses.capitalStructure;
  const objectiveEvidence = {
    sourceCaseUnderwriting: calculationEvidenceFamily({
      familyKey: 'source_case_underwriting',
      canonicalSource: sourceCaseAnalysis.source,
      sections: sourceCaseAnalysis.sections,
    }),
    acquisitionValuation: calculationEvidenceFamily({
      familyKey: 'acquisition_valuation',
      canonicalSource: valuationAnalysis.source,
      sections: valuationAnalysis.sections,
    }),
    acquisitionCapitalStructure: calculationEvidenceFamily({
      familyKey: 'acquisition_capital_structure',
      canonicalSource: capitalStructureAnalysis.source,
      sections: { capitalStructure: capitalStructureAnalysis.section },
    }),
    returnReadinessReferences: returnReferenceEvidenceFamily(returnReadinessContract),
  };
  const memoComponents = {
    thesis: unavailableMemoComponent({
      componentKey: 'investment_thesis',
      requiredAuthorityFields: [
        'complete_canonical_investment_case_fact_selection',
        'approved_investment_thesis_methodology',
      ],
      reasonCode: 'CANONICAL_INVESTMENT_THESIS_AUTHORITY_NOT_AVAILABLE',
    }),
    strengths: unavailableMemoComponent({
      componentKey: 'investment_strengths',
      requiredAuthorityFields: [
        'complete_canonical_strength_evidence',
        'approved_strength_classification_policy',
      ],
      reasonCode: 'CANONICAL_INVESTMENT_STRENGTH_AUTHORITY_NOT_AVAILABLE',
    }),
    weaknesses: unavailableMemoComponent({
      componentKey: 'investment_weaknesses',
      requiredAuthorityFields: [
        'complete_canonical_weakness_evidence',
        'approved_weakness_classification_policy',
      ],
      reasonCode: 'CANONICAL_INVESTMENT_WEAKNESS_AUTHORITY_NOT_AVAILABLE',
    }),
    risks: unavailableMemoComponent({
      componentKey: 'principal_risks',
      requiredAuthorityFields: [
        'complete_canonical_risk_evidence',
        'approved_risk_classification_policy',
      ],
      reasonCode: 'CANONICAL_PRINCIPAL_RISK_AUTHORITY_NOT_AVAILABLE',
    }),
    diligence: unavailableMemoComponent({
      componentKey: 'required_diligence',
      requiredAuthorityFields: [
        'canonical_due_diligence_gap_authority',
        'approved_diligence_prioritization_policy',
      ],
      reasonCode: 'CANONICAL_DUE_DILIGENCE_AUTHORITY_NOT_AVAILABLE',
    }),
    recommendation: unavailableMemoComponent({
      componentKey: 'investment_recommendation',
      requiredAuthorityFields: [
        'authorized_investment_thesis',
        'authorized_investment_strengths',
        'authorized_investment_weaknesses',
        'authorized_principal_risks',
        'authorized_required_diligence',
        'approved_investment_recommendation_policy',
      ],
      reasonCode: 'CANONICAL_INVESTMENT_RECOMMENDATION_AUTHORITY_NOT_AVAILABLE',
    }),
    confidence: unavailableMemoComponent({
      componentKey: 'recommendation_confidence',
      requiredAuthorityFields: [
        'authorized_investment_recommendation',
        'approved_recommendation_confidence_methodology',
      ],
      reasonCode: 'CANONICAL_RECOMMENDATION_CONFIDENCE_AUTHORITY_NOT_AVAILABLE',
    }),
  };
  const availableObjectiveEvidenceCount = Object.values(objectiveEvidence)
    .reduce((sum, family) => sum + family.availableEvidenceCount, 0);

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: returnReadinessContract,
    upstreamReceipt: {
      source: returnReadinessContract.source,
      contractVersion: returnReadinessContract.contractVersion,
      jobId: returnReadinessContract.upstreamReceipt.jobId,
      corePublishable: returnReadinessContract.upstreamReceipt.corePublishable,
      exactCanonicalGate5Receipt: true,
      availableReferenceCount: returnReadinessContract.coverage.availableReferenceCount,
      eligibleReadinessBundleCount: returnReadinessContract.coverage.eligibleReadinessBundleCount,
      calculatedReturnCount: returnReadinessContract.coverage.calculatedReturnCount,
    },
    policy: {
      authorityCreating: false,
      sourceTruthMutationAllowed: false,
      objectiveEvidenceInventoryOnly: true,
      calculationsPerformed: false,
      factsPromotedToNarrative: false,
      arithmeticPromotedToInvestmentJudgment: false,
      thesisMethodologyInferred: false,
      strengthClassificationInferred: false,
      weaknessClassificationInferred: false,
      riskClassificationInferred: false,
      diligencePriorityInferred: false,
      recommendationAuthorized: false,
      confidenceClassificationAuthorized: false,
      buySellLanguageAllowed: false,
      hypeLanguageAllowed: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      missingAuthorityRemainsNull: true,
      optionalMemoAuthorityFailureMayBlockValidatedCorePublication: false,
      legacyUnderwritingReuseAllowed: false,
    },
    objectiveEvidence,
    memoComponents,
    memoOutput: {
      status: 'not_generated_authority_not_established',
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
      availableObjectiveEvidenceCount,
      objectiveEvidenceFamilyCount: Object.keys(objectiveEvidence).length,
      authorizedMemoComponentCount: 0,
      totalMemoComponentCount: Object.keys(memoComponents).length,
      generatedMemoOutputCount: 0,
      totalMemoOutputCount: 7,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalUnderwritingReturnReadinessContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
  returnReadinessContract,
} = {}) {
  if (!isCanonicalInstitutionalUnderwritingReturnReadinessContract(returnReadinessContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_5_RETURN_READINESS_CONTRACT_REQUIRED_FOR_INVESTMENT_COMMITTEE_MEMO_AUTHORITY');
  }
  return deepFreeze(assembleContract(returnReadinessContract));
}

export const INSTITUTIONAL_INVESTMENT_COMMITTEE_MEMO_AUTHORITY_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  authorityCreating: false,
  objectiveEvidenceInventoryOnly: true,
  recommendationAuthorized: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
