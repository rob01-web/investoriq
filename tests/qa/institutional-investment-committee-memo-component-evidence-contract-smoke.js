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
import {
  buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract,
  isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract,
} from '../../api/_lib/institutional-investment-committee-memo-component-evidence-contract.js';

function buildSourceTruth({ jobId = 'gate-6c-job', includePurchase = true } = {}) {
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
  return buildCanonicalSourceTruthPackage({ jobId, propertyName: 'Gate 6C Property', artifacts });
}

function buildGate6B(sourceTruthPackage) {
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
  return buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
    memoAuthorityContract,
  });
}

const methodologyContract = buildGate6B(buildSourceTruth());
const contract = buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
  methodologyContract,
});

assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.componentEvidence), true);
assert.equal(Object.isFrozen(contract.componentEvidence.thesis.adjudicatedEvidenceReferences), true);
assert.equal(contract.source, 'canonical_institutional_investment_committee_memo_component_evidence_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, methodologyContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-6c-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate6BReceipt, true);

assert.deepEqual(contract.policy, {
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
});
assert.equal(contract.reportPublicationBlocker, false);

const thesis = contract.componentEvidence.thesis;
assert.equal(thesis.adjudicationState, 'neutral_evidence_pool_adjudicated');
assert.equal(thesis.evidenceAuthorityEstablished, true);
assert.deepEqual(thesis.missingAuthorityFields, []);
assert.equal(
  thesis.adjudicatedEvidenceReferenceCount,
  methodologyContract.factSelection.selectedEvidenceReferenceCount
);
assert.equal(thesis.adjudicatedEvidenceReferenceCount > 0, true);
for (const [index, reference] of thesis.adjudicatedEvidenceReferences.entries()) {
  const selected = methodologyContract.factSelection.selectedEvidenceReferences[index];
  assert.equal(reference.familyKey, selected.familyKey);
  assert.equal(reference.evidenceKey, selected.evidenceKey);
  assert.equal(reference.canonicalSource, selected.canonicalSource);
  assert.equal(reference.gate6BSelectionPointer, `factSelection.selectedEvidenceReferences.${index}`);
  assert.equal(reference.upstreamEvidencePointer, selected.upstreamPointer);
  assert.equal(reference.sourceBound, true);
  assert.equal(reference.referenceOnly, true);
  assert.equal(reference.valueCopied, false);
  assert.equal(reference.provenancePreservedUpstream, true);
  assert.equal(reference.componentSemanticAssignment, 'neutral_investment_case_evidence');
  assert.equal(reference.classificationPerformed, false);
  assert.equal(Object.hasOwn(reference, 'value'), false);
  assert.equal(reference.reportPublicationBlocker, false);
}

assert.deepEqual(Object.keys(contract.componentEvidence), [
  'thesis',
  'strengths',
  'weaknesses',
  'risks',
  'diligence',
  'recommendation',
  'confidence',
]);
for (const key of ['strengths', 'weaknesses', 'risks', 'diligence', 'recommendation', 'confidence']) {
  const receipt = contract.componentEvidence[key];
  assert.equal(receipt.evidenceAuthorityEstablished, false);
  assert.equal(receipt.adjudicatedEvidenceReferenceCount, 0);
  assert.deepEqual(receipt.adjudicatedEvidenceReferences, []);
  assert.equal(receipt.missingAuthorityFields.length > 0, true);
}
for (const receipt of Object.values(contract.componentEvidence)) {
  assert.equal(receipt.componentMethodologyExecuted, false);
  assert.equal(receipt.classificationPerformed, false);
  assert.equal(receipt.diligencePrioritized, false);
  assert.equal(receipt.recommendationProduced, false);
  assert.equal(receipt.confidenceAssigned, false);
  assert.equal(receipt.content, null);
  assert.equal(receipt.narrativeAuthorized, false);
  assert.equal(receipt.customerSurfaceAuthorized, false);
  assert.equal(receipt.reportPublicationBlocker, false);
}
assert.equal(contract.authorityReceipts.completeCanonicalThesisEvidence, true);
assert.equal(contract.authorityReceipts.completeCanonicalStrengthEvidence, false);
assert.equal(contract.authorityReceipts.completeCanonicalWeaknessEvidence, false);
assert.equal(contract.authorityReceipts.completeCanonicalRiskEvidence, false);
assert.equal(contract.authorityReceipts.canonicalDueDiligenceGapAuthorityEstablished, false);
assert.equal(contract.authorityReceipts.authorizedInvestmentThesis, false);
assert.equal(contract.authorityReceipts.authorizedInvestmentRecommendation, false);
assert.equal(contract.authorityReceipts.authorizedRecommendationConfidence, false);
assert.equal(contract.coverage.componentEvidenceAuthorityCount, 1);
assert.equal(contract.coverage.totalComponentEvidenceCount, 7);
assert.equal(contract.coverage.classifiedComponentCount, 0);
assert.equal(contract.coverage.authorizedMemoComponentCount, 0);
assert.equal(contract.coverage.generatedMemoOutputCount, 0);

assert.deepEqual(contract.memoOutput, {
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
});

const ignoredCallerOverrides = buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
  methodologyContract,
  adjudicatedEvidenceReferences: [{ evidenceKey: 'invented_number', value: 999999999 }],
  strengths: ['Invented strength'],
  weaknesses: ['Invented weakness'],
  risks: ['Invented risk'],
  diligence: ['Invented priority'],
  thesis: 'Invented thesis',
  recommendation: 'Proceed immediately',
  confidence: 'Certain',
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
    methodologyContract: {
      source: 'canonical_institutional_investment_committee_memo_methodology_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_6B_METHODOLOGY_CONTRACT_REQUIRED_FOR_GATE_6C_COMPONENT_EVIDENCE/
);

const tamperedUpstream = structuredClone(methodologyContract);
tamperedUpstream.factSelection.selectedEvidenceReferences.push({
  familyKey: 'source_case_underwriting',
  evidenceKey: 'invented_number',
});
tamperedUpstream.factSelection.selectedEvidenceReferenceCount += 1;
assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
    methodologyContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_6B_METHODOLOGY_CONTRACT_REQUIRED_FOR_GATE_6C_COMPONENT_EVIDENCE/
);

const inventedThesisEvidence = structuredClone(contract);
inventedThesisEvidence.componentEvidence.thesis.adjudicatedEvidenceReferences.push({
  familyKey: 'source_case_underwriting',
  evidenceKey: 'invented_number',
});
inventedThesisEvidence.componentEvidence.thesis.adjudicatedEvidenceReferenceCount += 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(inventedThesisEvidence), false);

const copiedValue = structuredClone(contract);
copiedValue.componentEvidence.thesis.adjudicatedEvidenceReferences[0].value = 999999999;
copiedValue.componentEvidence.thesis.adjudicatedEvidenceReferences[0].valueCopied = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(copiedValue), false);

const classifiedStrength = structuredClone(contract);
classifiedStrength.componentEvidence.strengths.evidenceAuthorityEstablished = true;
classifiedStrength.componentEvidence.strengths.classificationPerformed = true;
classifiedStrength.componentEvidence.strengths.adjudicatedEvidenceReferences.push(
  contract.componentEvidence.thesis.adjudicatedEvidenceReferences[0]
);
classifiedStrength.componentEvidence.strengths.adjudicatedEvidenceReferenceCount = 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(classifiedStrength), false);

const inferredRisk = structuredClone(contract);
inferredRisk.componentEvidence.risks.evidenceAuthorityEstablished = true;
inferredRisk.componentEvidence.risks.classificationPerformed = true;
inferredRisk.componentEvidence.risks.adjudicatedEvidenceReferences.push({
  evidenceKey: 'missing_optional_document',
});
inferredRisk.componentEvidence.risks.adjudicatedEvidenceReferenceCount = 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(inferredRisk), false);

const prioritizedDiligence = structuredClone(contract);
prioritizedDiligence.componentEvidence.diligence.evidenceAuthorityEstablished = true;
prioritizedDiligence.componentEvidence.diligence.diligencePrioritized = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(prioritizedDiligence), false);

const generatedNarrative = structuredClone(contract);
generatedNarrative.componentEvidence.thesis.content = 'Invented investment thesis';
generatedNarrative.componentEvidence.thesis.narrativeAuthorized = true;
generatedNarrative.memoOutput.thesis = 'Invented investment thesis';
generatedNarrative.memoOutput.narrativeGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(generatedNarrative), false);

const generatedRecommendation = structuredClone(contract);
generatedRecommendation.componentEvidence.recommendation.recommendationProduced = true;
generatedRecommendation.memoOutput.recommendation = 'Proceed';
generatedRecommendation.memoOutput.recommendationGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(generatedRecommendation), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.memoOutput.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(publicationBlocked), false);

const coreOnlyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
  methodologyContract: buildGate6B(buildSourceTruth({
    jobId: 'gate-6c-core-only',
    includePurchase: false,
  })),
});
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract(coreOnlyContract), true);
assert.equal(
  coreOnlyContract.coverage.adjudicatedThesisEvidenceReferenceCount <
    contract.coverage.adjudicatedThesisEvidenceReferenceCount,
  true
);
assert.equal(coreOnlyContract.componentEvidence.thesis.evidenceAuthorityEstablished, true);
assert.equal(coreOnlyContract.coverage.classifiedComponentCount, 0);
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-investment-committee-memo-component-evidence-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-investment-committee-memo-methodology-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-investment-committee-memo-component-evidence-contract-smoke: PASS');
