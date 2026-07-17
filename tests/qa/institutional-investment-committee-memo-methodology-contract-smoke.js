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
import {
  buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract,
  isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract,
} from '../../api/_lib/institutional-investment-committee-memo-methodology-contract.js';

function buildSourceTruth({ jobId = 'gate-6b-job', includePurchase = true } = {}) {
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
  return buildCanonicalSourceTruthPackage({ jobId, propertyName: 'Gate 6B Property', artifacts });
}

function buildGate6A(sourceTruthPackage) {
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
  return buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({ returnReadinessContract });
}

const memoAuthorityContract = buildGate6A(buildSourceTruth());
const contract = buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
  memoAuthorityContract,
});

assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.factSelection.selectedEvidenceReferences), true);
assert.equal(Object.isFrozen(contract.componentMethodologies), true);
assert.equal(contract.source, 'canonical_institutional_investment_committee_memo_methodology_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, memoAuthorityContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-6b-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate6AReceipt, true);

assert.deepEqual(contract.policy, {
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
});
assert.equal(contract.reportPublicationBlocker, false);

const selection = contract.factSelection;
assert.equal(selection.completeCanonicalInvestmentCaseFactSelection, true);
assert.equal(selection.documentCompletenessClaimed, false);
assert.equal(selection.unsupportedOrUnavailableEvidenceSelected, false);
assert.equal(selection.evidenceValuesCopied, false);
assert.equal(selection.selectedEvidenceReferenceCount, memoAuthorityContract.coverage.availableObjectiveEvidenceCount);
assert.equal(selection.selectedEvidenceReferenceCount > 0, true);
for (const reference of selection.selectedEvidenceReferences) {
  const family = Object.values(memoAuthorityContract.objectiveEvidence)
    .find((candidate) => candidate.familyKey === reference.familyKey);
  assert.equal(Boolean(family), true);
  assert.equal(family.availableEvidenceKeys.includes(reference.evidenceKey), true);
  assert.equal(reference.canonicalSource, family.canonicalSource);
  assert.equal(reference.referenceOnly, true);
  assert.equal(reference.valueCopied, false);
  assert.equal(reference.provenancePreservedUpstream, true);
  assert.equal(reference.sourceBound, true);
  assert.equal(Object.hasOwn(reference, 'value'), false);
  assert.equal(reference.narrativeAuthorityCreated, false);
  assert.equal(reference.reportPublicationBlocker, false);
}

assert.deepEqual(Object.keys(contract.componentMethodologies), [
  'thesis',
  'strengths',
  'weaknesses',
  'risks',
  'diligence',
  'recommendation',
  'confidence',
]);
for (const methodology of Object.values(contract.componentMethodologies)) {
  assert.equal(methodology.authorityState, 'approved_for_future_bounded_execution');
  assert.equal(methodology.methodologyAuthorityEstablished, true);
  assert.equal(methodology.executionAuthorized, false);
  assert.deepEqual(methodology.assignedEvidenceReferences, []);
  assert.equal(methodology.content, null);
  assert.equal(methodology.classificationPerformed, false);
  assert.equal(methodology.diligencePrioritized, false);
  assert.equal(methodology.recommendationProduced, false);
  assert.equal(methodology.confidenceAssigned, false);
  assert.equal(methodology.customerSurfaceAuthorized, false);
  assert.equal(methodology.reportPublicationBlocker, false);
}
assert.equal(contract.authorityReceipts.completeCanonicalInvestmentCaseFactSelection, true);
assert.equal(contract.authorityReceipts.approvedInvestmentThesisMethodology, true);
assert.equal(contract.authorityReceipts.approvedStrengthClassificationPolicy, true);
assert.equal(contract.authorityReceipts.approvedWeaknessClassificationPolicy, true);
assert.equal(contract.authorityReceipts.approvedRiskClassificationPolicy, true);
assert.equal(contract.authorityReceipts.approvedDiligencePrioritizationPolicy, true);
assert.equal(contract.authorityReceipts.approvedInvestmentRecommendationPolicy, true);
assert.equal(contract.authorityReceipts.approvedRecommendationConfidenceMethodology, true);
assert.equal(contract.authorityReceipts.componentEvidenceAdjudicationComplete, false);
assert.equal(contract.authorityReceipts.authorizedInvestmentRecommendation, false);
assert.equal(contract.authorityReceipts.authorizedRecommendationConfidence, false);
assert.equal(contract.coverage.approvedComponentMethodologyCount, 7);
assert.equal(contract.coverage.executedComponentMethodologyCount, 0);
assert.equal(contract.coverage.authorizedMemoComponentCount, 0);
assert.equal(contract.coverage.generatedMemoOutputCount, 0);
assert.deepEqual(contract.memoOutput, {
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
});

const ignoredCallerOverrides = buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
  memoAuthorityContract,
  selectedEvidenceReferences: [{ evidenceKey: 'invented_number', value: 999999999 }],
  thesis: 'Invented thesis',
  strengths: ['Invented strength'],
  weaknesses: ['Invented weakness'],
  risks: ['Invented risk'],
  diligence: ['Invented priority'],
  recommendation: 'Proceed immediately',
  confidence: 'Certain',
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
    memoAuthorityContract: {
      source: 'canonical_institutional_investment_committee_memo_authority_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_6A_MEMO_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_6B_METHODOLOGY/
);

const tamperedUpstream = structuredClone(memoAuthorityContract);
tamperedUpstream.objectiveEvidence.sourceCaseUnderwriting.availableEvidenceKeys.push('invented_number');
tamperedUpstream.objectiveEvidence.sourceCaseUnderwriting.availableEvidenceCount += 1;
assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
    memoAuthorityContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_6A_MEMO_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_6B_METHODOLOGY/
);

const inventedReference = structuredClone(contract);
inventedReference.factSelection.selectedEvidenceReferences.push({
  familyKey: 'source_case_underwriting',
  evidenceKey: 'invented_number',
});
inventedReference.factSelection.selectedEvidenceReferenceCount += 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(inventedReference), false);

const copiedValue = structuredClone(contract);
copiedValue.factSelection.selectedEvidenceReferences[0].value = 999999999;
copiedValue.factSelection.selectedEvidenceReferences[0].valueCopied = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(copiedValue), false);

const classifiedStrength = structuredClone(contract);
classifiedStrength.componentMethodologies.strengths.classificationPerformed = true;
classifiedStrength.componentMethodologies.strengths.assignedEvidenceReferences.push(
  contract.factSelection.selectedEvidenceReferences[0]
);
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(classifiedStrength), false);

const generatedNarrative = structuredClone(contract);
generatedNarrative.componentMethodologies.thesis.content = 'Invented investment thesis';
generatedNarrative.componentMethodologies.thesis.executionAuthorized = true;
generatedNarrative.memoOutput.thesis = 'Invented investment thesis';
generatedNarrative.memoOutput.narrativeGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(generatedNarrative), false);

const generatedRecommendation = structuredClone(contract);
generatedRecommendation.componentMethodologies.recommendation.recommendationProduced = true;
generatedRecommendation.memoOutput.recommendation = 'Proceed';
generatedRecommendation.memoOutput.recommendationGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(generatedRecommendation), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.memoOutput.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(publicationBlocked), false);

const coreOnlyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract({
  memoAuthorityContract: buildGate6A(buildSourceTruth({
    jobId: 'gate-6b-core-only',
    includePurchase: false,
  })),
});
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoMethodologyContract(coreOnlyContract), true);
assert.equal(
  coreOnlyContract.coverage.selectedEvidenceReferenceCount < contract.coverage.selectedEvidenceReferenceCount,
  true
);
assert.equal(coreOnlyContract.factSelection.completeCanonicalInvestmentCaseFactSelection, true);
assert.equal(coreOnlyContract.coverage.executedComponentMethodologyCount, 0);
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-investment-committee-memo-methodology-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-investment-committee-memo-authority-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-investment-committee-memo-methodology-contract-smoke: PASS');
