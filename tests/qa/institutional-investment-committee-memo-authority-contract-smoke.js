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
import {
  buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract,
  isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract,
} from '../../api/_lib/institutional-investment-committee-memo-authority-contract.js';

function buildSourceTruth({ jobId = 'gate-6a-job', includePurchase = true } = {}) {
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
  return buildCanonicalSourceTruthPackage({ jobId, propertyName: 'Gate 6A Property', artifacts });
}

function buildGate5F(sourceTruthPackage) {
  const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
    sourceTruthPackage,
    asOfDate: '2026-07-17',
  });
  const underwritingInputContract = buildCanonicalInstitutionalUnderwritingInputContract({
    sourceTruthPackage,
    financialIntelligence,
    scenarioPolicyContract: buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
  });
  return buildCanonicalInstitutionalUnderwritingReturnReadinessContract({
    sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({ underwritingInputContract }),
    valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({ underwritingInputContract }),
    capitalStructureAnalysis: buildDeterministicAcquisitionCapitalStructureAnalysis({ underwritingInputContract }),
  });
}

const returnReadinessContract = buildGate5F(buildSourceTruth());
const contract = buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
  returnReadinessContract,
});

assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.memoComponents), true);
assert.equal(Object.isFrozen(contract.upstreamContract), true);
assert.equal(contract.source, 'canonical_institutional_investment_committee_memo_authority_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, returnReadinessContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-6a-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate5Receipt, true);
assert.equal(contract.upstreamReceipt.calculatedReturnCount, 0);

assert.deepEqual(contract.policy, {
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
});
assert.equal(contract.reportPublicationBlocker, false);

assert.deepEqual(Object.keys(contract.objectiveEvidence), [
  'sourceCaseUnderwriting',
  'acquisitionValuation',
  'acquisitionCapitalStructure',
  'returnReadinessReferences',
]);
assert.equal(contract.objectiveEvidence.sourceCaseUnderwriting.availableEvidenceCount > 0, true);
assert.equal(contract.objectiveEvidence.returnReadinessReferences.availableEvidenceCount > 0, true);
for (const family of Object.values(contract.objectiveEvidence)) {
  assert.equal(Array.isArray(family.availableEvidenceKeys), true);
  assert.equal(new Set(family.availableEvidenceKeys).size, family.availableEvidenceKeys.length);
  assert.equal(family.narrativeAuthorityCreated, false);
  assert.equal(family.classificationAuthorityCreated, false);
  assert.equal(family.recommendationAuthorityCreated, false);
  assert.equal(family.customerSurfaceAuthorized, false);
  assert.equal(family.reportPublicationBlocker, false);
}
assert.equal(
  contract.objectiveEvidence.returnReadinessReferences.availableEvidenceKeys.includes('closing_costs_percent'),
  true
);
assert.equal(contract.objectiveEvidence.returnReadinessReferences.completeReturnAuthorityEstablished, false);

assert.deepEqual(Object.keys(contract.memoComponents), [
  'thesis',
  'strengths',
  'weaknesses',
  'risks',
  'diligence',
  'recommendation',
  'confidence',
]);
for (const component of Object.values(contract.memoComponents)) {
  assert.equal(component.content, null);
  assert.equal(component.authorityState, 'not_authorized');
  assert.equal(component.sourceBound, false);
  assert.equal(component.policyBound, false);
  assert.equal(component.narrativeAuthorized, false);
  assert.equal(component.classificationAuthorized, false);
  assert.deepEqual(component.availableAuthorityFields, []);
  assert.deepEqual(component.missingAuthorityFields, component.requiredAuthorityFields);
  assert.equal(component.customerSurfaceAuthorized, false);
  assert.equal(component.reportPublicationBlocker, false);
}
assert.equal(contract.memoComponents.recommendation.reasonCode, 'CANONICAL_INVESTMENT_RECOMMENDATION_AUTHORITY_NOT_AVAILABLE');
assert.equal(contract.memoComponents.confidence.reasonCode, 'CANONICAL_RECOMMENDATION_CONFIDENCE_AUTHORITY_NOT_AVAILABLE');

assert.deepEqual(contract.memoOutput, {
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
});
assert.equal(contract.coverage.objectiveEvidenceFamilyCount, 4);
assert.equal(contract.coverage.availableObjectiveEvidenceCount > 0, true);
assert.equal(contract.coverage.authorizedMemoComponentCount, 0);
assert.equal(contract.coverage.totalMemoComponentCount, 7);
assert.equal(contract.coverage.generatedMemoOutputCount, 0);
assert.equal(contract.coverage.totalMemoOutputCount, 7);

const ignoredCallerOverrides = buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
  returnReadinessContract,
  thesis: 'Compelling investment opportunity.',
  strengths: ['Strong operations'],
  weaknesses: ['Capital needs'],
  risks: ['Refinance risk'],
  diligence: ['Confirm leases'],
  recommendation: 'BUY',
  confidence: 'High',
  classificationPolicy: { approved: true },
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
    returnReadinessContract: {
      source: 'canonical_institutional_underwriting_return_readiness_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_5_RETURN_READINESS_CONTRACT_REQUIRED_FOR_INVESTMENT_COMMITTEE_MEMO_AUTHORITY/
);

const tamperedUpstream = structuredClone(returnReadinessContract);
tamperedUpstream.coverage.calculatedReturnCount = 1;
assert.throws(
  () => buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
    returnReadinessContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_5_RETURN_READINESS_CONTRACT_REQUIRED_FOR_INVESTMENT_COMMITTEE_MEMO_AUTHORITY/
);

const tamperedComponent = structuredClone(contract);
tamperedComponent.memoComponents.thesis.content = 'Invented thesis';
tamperedComponent.memoComponents.thesis.authorityState = 'authorized';
tamperedComponent.memoComponents.thesis.narrativeAuthorized = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(tamperedComponent), false);

const tamperedRecommendation = structuredClone(contract);
tamperedRecommendation.memoOutput.recommendation = 'Proceed';
tamperedRecommendation.memoOutput.recommendationGenerated = true;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(tamperedRecommendation), false);

const tamperedConfidence = structuredClone(contract);
tamperedConfidence.memoOutput.confidence = 'High';
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(tamperedConfidence), false);

const tamperedEvidenceInventory = structuredClone(contract);
tamperedEvidenceInventory.objectiveEvidence.sourceCaseUnderwriting.availableEvidenceKeys.push('fabricated_measure');
tamperedEvidenceInventory.objectiveEvidence.sourceCaseUnderwriting.availableEvidenceCount += 1;
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(tamperedEvidenceInventory), false);

const coreOnlyContract = buildCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract({
  returnReadinessContract: buildGate5F(buildSourceTruth({
    jobId: 'gate-6a-core-only',
    includePurchase: false,
  })),
});
assert.equal(isCanonicalInstitutionalInvestmentCommitteeMemoAuthorityContract(coreOnlyContract), true);
assert.equal(
  coreOnlyContract.coverage.availableObjectiveEvidenceCount < contract.coverage.availableObjectiveEvidenceCount,
  true
);
assert.equal(coreOnlyContract.coverage.authorizedMemoComponentCount, 0);
assert.equal(coreOnlyContract.memoOutput.status, 'not_generated_authority_not_established');
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-investment-committee-memo-authority-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-underwriting-return-readiness-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-investment-committee-memo-authority-contract-smoke: PASS');
