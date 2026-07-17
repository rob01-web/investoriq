import { isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract } from './institutional-investment-committee-memo-component-evidence-contract.js';

const CONTRACT_SOURCE = 'canonical_institutional_investment_committee_memo_dependency_sequencing_contract';
const CONTRACT_VERSION = 1;

const FUTURE_GATE_DEFINITIONS = Object.freeze({
  gate7ScenarioEngine: Object.freeze({
    gateKey: 'gate_7_scenario_engine',
    roadmapOrder: 7,
    purposeKey: 'source_bound_scenario_analysis',
    requiredForComponents: Object.freeze(['principal_risks', 'investment_recommendation', 'recommendation_confidence']),
  }),
  gate8DueDiligenceEngine: Object.freeze({
    gateKey: 'gate_8_due_diligence_engine',
    roadmapOrder: 8,
    purposeKey: 'canonical_due_diligence_gap_authority',
    requiredForComponents: Object.freeze(['principal_risks', 'required_diligence', 'investment_recommendation', 'recommendation_confidence']),
  }),
  gate9InstitutionalScoring: Object.freeze({
    gateKey: 'gate_9_institutional_scoring',
    roadmapOrder: 9,
    purposeKey: 'deterministic_component_classification_authority',
    requiredForComponents: Object.freeze([
      'investment_strengths',
      'investment_weaknesses',
      'principal_risks',
      'investment_recommendation',
      'recommendation_confidence',
    ]),
  }),
});

const COMPONENT_DEPENDENCIES = Object.freeze({
  thesis: Object.freeze({
    componentKey: 'investment_thesis',
    currentEvidenceAuthorityField: 'complete_canonical_thesis_evidence',
    currentEvidenceAuthorityEstablished: true,
    requiredFutureGateReceipts: Object.freeze([]),
    requiredComponentAuthorityReceipts: Object.freeze([]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'canonical_source_bound_thesis_claim_composition_receipt',
    ]),
    dependencyState: 'deferred_missing_claim_composition_authority',
  }),
  strengths: Object.freeze({
    componentKey: 'investment_strengths',
    currentEvidenceAuthorityField: 'complete_canonical_strength_evidence',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze(['canonical_gate_9_institutional_scoring_receipt']),
    requiredComponentAuthorityReceipts: Object.freeze([]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_strength_classification_receipt',
    ]),
    dependencyState: 'deferred_to_gate_9_classification_authority',
  }),
  weaknesses: Object.freeze({
    componentKey: 'investment_weaknesses',
    currentEvidenceAuthorityField: 'complete_canonical_weakness_evidence',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze(['canonical_gate_9_institutional_scoring_receipt']),
    requiredComponentAuthorityReceipts: Object.freeze([]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_weakness_classification_receipt',
    ]),
    dependencyState: 'deferred_to_gate_9_classification_authority',
  }),
  risks: Object.freeze({
    componentKey: 'principal_risks',
    currentEvidenceAuthorityField: 'complete_canonical_risk_evidence',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze([
      'canonical_gate_7_scenario_engine_receipt',
      'canonical_gate_8_due_diligence_engine_receipt',
      'canonical_gate_9_institutional_scoring_receipt',
    ]),
    requiredComponentAuthorityReceipts: Object.freeze([]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_principal_risk_classification_receipt',
    ]),
    dependencyState: 'deferred_to_gates_7_through_9_risk_authority',
  }),
  diligence: Object.freeze({
    componentKey: 'required_diligence',
    currentEvidenceAuthorityField: 'canonical_due_diligence_gap_authority',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze(['canonical_gate_8_due_diligence_engine_receipt']),
    requiredComponentAuthorityReceipts: Object.freeze([]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_diligence_priority_receipt',
    ]),
    dependencyState: 'deferred_to_gate_8_due_diligence_authority',
  }),
  recommendation: Object.freeze({
    componentKey: 'investment_recommendation',
    currentEvidenceAuthorityField: 'authorized_investment_recommendation',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze([
      'canonical_gate_7_scenario_engine_receipt',
      'canonical_gate_8_due_diligence_engine_receipt',
      'canonical_gate_9_institutional_scoring_receipt',
    ]),
    requiredComponentAuthorityReceipts: Object.freeze([
      'authorized_investment_thesis',
      'authorized_investment_strengths',
      'authorized_investment_weaknesses',
      'authorized_principal_risks',
      'authorized_required_diligence',
    ]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_investment_recommendation_execution_receipt',
    ]),
    dependencyState: 'deferred_until_all_substantive_components_are_authorized',
  }),
  confidence: Object.freeze({
    componentKey: 'recommendation_confidence',
    currentEvidenceAuthorityField: 'authorized_recommendation_confidence',
    currentEvidenceAuthorityEstablished: false,
    requiredFutureGateReceipts: Object.freeze([
      'canonical_gate_7_scenario_engine_receipt',
      'canonical_gate_8_due_diligence_engine_receipt',
      'canonical_gate_9_institutional_scoring_receipt',
    ]),
    requiredComponentAuthorityReceipts: Object.freeze([
      'authorized_investment_recommendation',
    ]),
    requiredAdditionalAuthorityReceipts: Object.freeze([
      'deterministic_evidence_coverage_receipt',
    ]),
    dependencyState: 'deferred_until_recommendation_and_coverage_are_authorized',
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function futureGateDependency(definition) {
  return {
    gateKey: definition.gateKey,
    roadmapOrder: definition.roadmapOrder,
    purposeKey: definition.purposeKey,
    authorityState: 'not_available_future_gate',
    canonicalReceipt: null,
    accepted: false,
    requiredForComponents: [...definition.requiredForComponents],
    mayBeSynthesizedByGate6D: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function componentDependency(definition) {
  return {
    componentKey: definition.componentKey,
    currentEvidenceAuthorityField: definition.currentEvidenceAuthorityField,
    currentEvidenceAuthorityEstablished: definition.currentEvidenceAuthorityEstablished,
    requiredFutureGateReceipts: [...definition.requiredFutureGateReceipts],
    availableFutureGateReceipts: [],
    requiredComponentAuthorityReceipts: [...definition.requiredComponentAuthorityReceipts],
    availableComponentAuthorityReceipts: [],
    requiredAdditionalAuthorityReceipts: [...definition.requiredAdditionalAuthorityReceipts],
    availableAdditionalAuthorityReceipts: [],
    dependencyState: definition.dependencyState,
    executionAuthorized: false,
    content: null,
    classificationPerformed: false,
    diligencePrioritized: false,
    recommendationProduced: false,
    confidenceAssigned: false,
    customerSurfaceAuthorized: false,
    reportPublicationBlocker: false,
  };
}

function assembleContract(componentEvidenceContract) {
  const futureGateDependencies = Object.fromEntries(
    Object.entries(FUTURE_GATE_DEFINITIONS).map(([key, definition]) => [
      key,
      futureGateDependency(definition),
    ])
  );
  const componentDependencies = Object.fromEntries(
    Object.entries(COMPONENT_DEPENDENCIES).map(([key, definition]) => [
      key,
      componentDependency(definition),
    ])
  );

  return {
    source: CONTRACT_SOURCE,
    contractVersion: CONTRACT_VERSION,
    upstreamContract: componentEvidenceContract,
    upstreamReceipt: {
      source: componentEvidenceContract.source,
      contractVersion: componentEvidenceContract.contractVersion,
      jobId: componentEvidenceContract.upstreamReceipt.jobId,
      corePublishable: componentEvidenceContract.upstreamReceipt.corePublishable,
      exactCanonicalGate6CReceipt: true,
      componentEvidenceAuthorityCount: componentEvidenceContract.coverage.componentEvidenceAuthorityCount,
      authorizedMemoComponentCount: componentEvidenceContract.coverage.authorizedMemoComponentCount,
    },
    policy: {
      sourceAuthorityCreating: false,
      sourceTruthMutationAllowed: false,
      dependencySequencingAuthorityOnly: true,
      gate6PreDownstreamAuthorityScaffoldComplete: true,
      futureGateReceiptsAccepted: false,
      futureGateAuthoritySynthesized: false,
      evidenceValuesCopied: false,
      calculationsPerformed: false,
      classificationCriteriaCreated: false,
      componentsClassified: false,
      diligenceGapsInferred: false,
      diligencePrioritized: false,
      thesisComposed: false,
      recommendationAuthorized: false,
      confidenceAssigned: false,
      narrativeGenerated: false,
      customerFacingCopyProduced: false,
      downstreamRenderingAuthorized: false,
      screeningBehaviorChanged: false,
      deliveryGateChanged: false,
      corePublicationThresholdChanged: false,
      optionalDependencyAbsenceMayBlockValidatedCorePublication: false,
      callerOverridesAccepted: false,
      legacyUnderwritingReuseAllowed: false,
    },
    futureGateDependencies,
    componentDependencies,
    executionSequence: {
      status: 'gate_6_authority_scaffold_complete_downstream_inputs_pending',
      gate6PreDownstreamAuthorityScaffoldComplete: true,
      gate6FinalMemoExecutionDeferred: true,
      requiredFutureGateOrder: [
        'gate_7_scenario_engine',
        'gate_8_due_diligence_engine',
        'gate_9_institutional_scoring',
      ],
      resumeGate6After: 'canonical_gate_9_institutional_scoring_receipt',
      nextRoadmapGate: 'gate_7_scenario_engine',
      gate7ExecutionAuthorizedByThisContract: false,
      memoExecutionAuthorized: false,
      customerSurfaceAuthorized: false,
      reportPublicationBlocker: false,
    },
    memoOutput: {
      status: 'not_generated_downstream_authority_dependencies_pending',
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
      sequencedFutureGateCount: Object.keys(futureGateDependencies).length,
      availableFutureGateReceiptCount: 0,
      sequencedMemoComponentCount: Object.keys(componentDependencies).length,
      executableMemoComponentCount: 0,
      authorizedMemoComponentCount: 0,
      generatedMemoOutputCount: 0,
    },
    reportPublicationBlocker: false,
  };
}

export function isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(value) {
  if (!value || typeof value !== 'object') return false;
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(value.upstreamContract)) return false;
  return JSON.stringify(value) === JSON.stringify(assembleContract(value.upstreamContract));
}

export function buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
  componentEvidenceContract,
} = {}) {
  if (!isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(componentEvidenceContract)) {
    throw new Error('COMPLETE_CANONICAL_GATE_6C_COMPONENT_EVIDENCE_CONTRACT_REQUIRED_FOR_GATE_6D_SEQUENCING');
  }
  return deepFreeze(assembleContract(componentEvidenceContract));
}

export const INSTITUTIONAL_INVESTMENT_COMMITTEE_MEMO_DEPENDENCY_SEQUENCING_CONTRACT = deepFreeze({
  source: CONTRACT_SOURCE,
  contractVersion: CONTRACT_VERSION,
  dependencySequencingAuthorityOnly: true,
  gate6PreDownstreamAuthorityScaffoldComplete: true,
  futureGateReceiptsAccepted: false,
  downstreamRenderingAuthorized: false,
  legacyUnderwritingReuseAllowed: false,
});
