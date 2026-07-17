import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalSourceTruthPackage } from '../../api/_lib/source-truth-package.js';
import { buildCanonicalInstitutionalFinancialIntelligence } from '../../api/_lib/institutional-financial-intelligence.js';
import { buildCanonicalInstitutionalUnderwritingScenarioPolicyContract } from '../../api/_lib/institutional-underwriting-scenario-policy-contract.js';
import { buildCanonicalInstitutionalUnderwritingInputContract } from '../../api/_lib/institutional-underwriting-input-contract.js';
import { buildDeterministicSourceCaseUnderwritingAnalysis } from '../../api/_lib/deterministic-source-case-underwriting-analysis.js';
import { buildDeterministicAcquisitionValuationAnalysis } from '../../api/_lib/deterministic-acquisition-valuation-analysis.js';
import { buildDeterministicAcquisitionCapitalStructureAnalysis } from '../../api/_lib/deterministic-acquisition-capital-structure-analysis.js';
import { buildCanonicalInstitutionalUnderwritingReturnReadinessContract } from '../../api/_lib/institutional-underwriting-return-readiness-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract } from '../../api/_lib/institutional-investment-committee-memo-authority-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract } from '../../api/_lib/institutional-investment-committee-memo-methodology-contract.js';
import { buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract } from '../../api/_lib/institutional-investment-committee-memo-component-evidence-contract.js';
import {
  buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract,
  isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract,
} from '../../api/_lib/institutional-investment-committee-memo-dependency-sequencing-contract.js';

function buildSourceTruth({ jobId = 'gate-6d-job', includePurchase = true } = {}) {
  const artifacts = [
    {
      id: 't12-artifact',
      file_id: 't12-file',
      original_filename: 'Operating Statement.xlsx',
      type: 't12_parsed',
      payload: {
        validated: true,
        gross_potential_rent: 1718400,
        effective_gross_income: 1500000,
        total_operating_expenses: 555000,
        net_operating_income: 945000,
        income_lines: [{ label: 'Effective Gross Income', amount: 1500000 }],
        expense_lines: [{ label: 'Operating Expenses', amount: 555000 }],
      },
    },
    {
      id: 'rent-roll-artifact',
      file_id: 'rent-roll-file',
      original_filename: 'Rent Roll.xlsx',
      type: 'rent_roll_parsed',
      payload: {
        validated: true,
        total_units: 64,
        occupancy: 0.9375,
        annual_in_place_rent: 1432800,
        annual_market_rent: 1718400,
        unit_mix: [{ label: 'All Units', count: 64 }],
        units: [{ unit_number: '101', current_rent: 1865.625, market_rent: 2237.5 }],
      },
    },
  ];
  if (includePurchase) {
    artifacts.push({
      id: 'purchase-text-artifact',
      file_id: 'purchase-file',
      original_filename: 'Purchase Assumptions.pdf',
      type: 'document_text_extracted',
      payload: {
        text: [
          'Purchase Assumptions / Proposed Acquisition Financing',
          'Purchase Price $13,500,000',
          'NOI Basis $945,000',
          'Going-In Cap Rate 7.00%',
          'Proposed Loan Amount $9,450,000',
          'LTV 70%',
          'Interest Rate 5.95%',
          'Amortization 30 years',
          'Lender Fee 0.85%',
          'Closing Costs 2.00%',
        ].join('\n'),
      },
    });
  }
  return buildCanonicalSourceTruthPackage({ jobId, propertyName: 'Gate 6D Property', artifacts });
}

function buildGate6C(sourceTruthPackage) {
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-17',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  const returnReadinessContract = buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract }),
  });
  const memoAuthorityContract = buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
    returnReadinessContract,
  });
  const methodologyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
    memoAuthorityContract,
  });
  return buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
    methodologyContract,
  });
}

const componentEvidenceContract = buildGate6C(buildSourceTruth());
const contract = buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
  componentEvidenceContract,
});

assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.futureGateDependencies), true);
assert.equal(Object.isFrozen(contract.componentDependencies), true);
assert.equal(contract.source, 'canonical_institutional_investment_committee_memo_dependency_sequencing_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, componentEvidenceContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-6d-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate6CReceipt, true);

assert.deepEqual(contract.policy, {
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
});
assert.equal(contract.reportPublicationBlocker, false);

assert.deepEqual(Object.keys(contract.futureGateDependencies), [
  'gate7ScenarioEngine',
  'gate8DueDiligenceEngine',
  'gate9InstitutionalScoring',
]);
assert.deepEqual(
  Object.values(contract.futureGateDependencies).map((gate) => gate.roadmapOrder),
  [7, 8, 9]
);
for (const gate of Object.values(contract.futureGateDependencies)) {
  assert.equal(gate.authorityState, 'not_available_future_gate');
  assert.equal(gate.canonicalReceipt, null);
  assert.equal(gate.accepted, false);
  assert.equal(gate.mayBeSynthesizedByGate6D, false);
  assert.equal(gate.customerSurfaceAuthorized, false);
  assert.equal(gate.reportPublicationBlocker, false);
}

assert.deepEqual(Object.keys(contract.componentDependencies), [
  'thesis',
  'strengths',
  'weaknesses',
  'risks',
  'diligence',
  'recommendation',
  'confidence',
]);
assert.equal(contract.componentDependencies.thesis.currentEvidenceAuthorityEstablished, true);
assert.deepEqual(contract.componentDependencies.thesis.requiredFutureGateReceipts, []);
assert.deepEqual(contract.componentDependencies.strengths.requiredFutureGateReceipts, [
  'canonical_gate_9_institutional_scoring_receipt',
]);
assert.deepEqual(contract.componentDependencies.weaknesses.requiredFutureGateReceipts, [
  'canonical_gate_9_institutional_scoring_receipt',
]);
assert.deepEqual(contract.componentDependencies.risks.requiredFutureGateReceipts, [
  'canonical_gate_7_scenario_engine_receipt',
  'canonical_gate_8_due_diligence_engine_receipt',
  'canonical_gate_9_institutional_scoring_receipt',
]);
assert.deepEqual(contract.componentDependencies.diligence.requiredFutureGateReceipts, [
  'canonical_gate_8_due_diligence_engine_receipt',
]);
assert.equal(contract.componentDependencies.recommendation.requiredComponentAuthorityReceipts.length, 5);
assert.deepEqual(contract.componentDependencies.confidence.requiredComponentAuthorityReceipts, [
  'authorized_investment_recommendation',
]);
for (const component of Object.values(contract.componentDependencies)) {
  assert.deepEqual(component.availableFutureGateReceipts, []);
  assert.deepEqual(component.availableComponentAuthorityReceipts, []);
  assert.deepEqual(component.availableAdditionalAuthorityReceipts, []);
  assert.equal(component.executionAuthorized, false);
  assert.equal(component.content, null);
  assert.equal(component.classificationPerformed, false);
  assert.equal(component.diligencePrioritized, false);
  assert.equal(component.recommendationProduced, false);
  assert.equal(component.confidenceAssigned, false);
  assert.equal(component.customerSurfaceAuthorized, false);
  assert.equal(component.reportPublicationBlocker, false);
}

assert.deepEqual(contract.executionSequence, {
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
});
assert.equal(contract.coverage.sequencedFutureGateCount, 3);
assert.equal(contract.coverage.availableFutureGateReceiptCount, 0);
assert.equal(contract.coverage.sequencedMemoComponentCount, 7);
assert.equal(contract.coverage.executableMemoComponentCount, 0);
assert.equal(contract.coverage.authorizedMemoComponentCount, 0);
assert.equal(contract.coverage.generatedMemoOutputCount, 0);

assert.deepEqual(contract.memoOutput, {
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
});

const ignoredCallerOverrides = buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
  componentEvidenceContract,
  gate7Receipt: { accepted: true },
  gate8Receipt: { accepted: true },
  gate9Receipt: { accepted: true },
  strengths: ['Invented strength'],
  risks: ['Invented risk'],
  recommendation: 'Proceed immediately',
  confidence: 'Certain',
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
    componentEvidenceContract: {
      source: 'canonical_institutional_investment_committee_memo_component_evidence_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_6C_COMPONENT_EVIDENCE_CONTRACT_REQUIRED_FOR_GATE_6D_SEQUENCING/
);

const tamperedUpstream = structuredClone(componentEvidenceContract);
tamperedUpstream.componentEvidence.strengths.evidenceAuthorityEstablished = true;
assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
    componentEvidenceContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_6C_COMPONENT_EVIDENCE_CONTRACT_REQUIRED_FOR_GATE_6D_SEQUENCING/
);

const fabricatedGateReceipt = structuredClone(contract);
fabricatedGateReceipt.futureGateDependencies.gate7ScenarioEngine.authorityState = 'available';
fabricatedGateReceipt.futureGateDependencies.gate7ScenarioEngine.accepted = true;
fabricatedGateReceipt.futureGateDependencies.gate7ScenarioEngine.canonicalReceipt = { source: 'invented' };
fabricatedGateReceipt.coverage.availableFutureGateReceiptCount = 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(fabricatedGateReceipt), false);

const removedRiskDependency = structuredClone(contract);
removedRiskDependency.componentDependencies.risks.requiredFutureGateReceipts.pop();
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(removedRiskDependency), false);

const authorizedStrength = structuredClone(contract);
authorizedStrength.componentDependencies.strengths.availableFutureGateReceipts.push(
  'canonical_gate_9_institutional_scoring_receipt'
);
authorizedStrength.componentDependencies.strengths.executionAuthorized = true;
authorizedStrength.componentDependencies.strengths.classificationPerformed = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(authorizedStrength), false);

const inferredDiligence = structuredClone(contract);
inferredDiligence.componentDependencies.diligence.diligencePrioritized = true;
inferredDiligence.componentDependencies.diligence.content = ['Invented diligence priority'];
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(inferredDiligence), false);

const generatedNarrative = structuredClone(contract);
generatedNarrative.componentDependencies.thesis.content = 'Invented investment thesis';
generatedNarrative.componentDependencies.thesis.executionAuthorized = true;
generatedNarrative.memoOutput.thesis = 'Invented investment thesis';
generatedNarrative.memoOutput.narrativeGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(generatedNarrative), false);

const generatedRecommendation = structuredClone(contract);
generatedRecommendation.componentDependencies.recommendation.recommendationProduced = true;
generatedRecommendation.memoOutput.recommendation = 'Proceed';
generatedRecommendation.memoOutput.recommendationGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(generatedRecommendation), false);

const assignedConfidence = structuredClone(contract);
assignedConfidence.componentDependencies.confidence.confidenceAssigned = true;
assignedConfidence.memoOutput.confidence = 'High';
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(assignedConfidence), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.executionSequence.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(publicationBlocked), false);

const coreOnlyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
  componentEvidenceContract: buildGate6C(buildSourceTruth({
    jobId: 'gate-6d-core-only',
    includePurchase: false,
  })),
});
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract(coreOnlyContract), true);
assert.deepEqual(coreOnlyContract.executionSequence.requiredFutureGateOrder, [
  'gate_7_scenario_engine',
  'gate_8_due_diligence_engine',
  'gate_9_institutional_scoring',
]);
assert.equal(coreOnlyContract.executionSequence.gate6PreDownstreamAuthorityScaffoldComplete, true);
assert.equal(coreOnlyContract.coverage.availableFutureGateReceiptCount, 0);
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-investment-committee-memo-dependency-sequencing-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-investment-committee-memo-component-evidence-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-investment-committee-memo-dependency-sequencing-contract-smoke: PASS');
