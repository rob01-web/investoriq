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
import { buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract } from '../../api/_lib/institutional-investment-committee-memo-dependency-sequencing-contract.js';
import {
  buildCanonicalInstitutionalScenarioEngineInputAuthorityContract,
  isCanonicalInstitutionalScenarioEngineInputAuthorityContract,
} from '../../api/_lib/institutional-scenario-engine-input-authority-contract.js';

function buildSourceTruth({ jobId = 'gate-7a-job', includePurchase = true } = {}) {
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
  return buildCanonicalSourceTruthPackage({ jobId, propertyName: 'Gate 7A Property', artifacts });
}

function buildGate6D(sourceTruthPackage) {
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
  const componentEvidenceContract = buildCanonicalInstitutionalInvestmentCommitteeMemoComponentEvidenceContract({
    methodologyContract,
  });
  return buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
    componentEvidenceContract,
  });
}

const dependencySequencingContract = buildGate6D(buildSourceTruth());
const contract = buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
  dependencySequencingContract,
});

assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.stressInputs), true);
assert.equal(Object.isFrozen(contract.scenarioFamilies), true);
assert.equal(contract.source, 'canonical_institutional_scenario_engine_input_authority_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, dependencySequencingContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-7a-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate6DReceipt, true);
assert.equal(contract.upstreamReceipt.nextRoadmapGate, 'gate_7_scenario_engine');

assert.deepEqual(contract.policy, {
  sourceAuthorityCreating: false,
  sourceTruthMutationAllowed: false,
  scenarioInputEligibilityOnly: true,
  sourceCasePreservedWithoutAdjustment: true,
  stressAssumptionsInferred: false,
  callerStressInputsAccepted: false,
  existingRatesPromotedToStressInputs: false,
  currentOccupancyPromotedToStressOccupancy: false,
  physicalVacancyPromotedToEconomicOrStressVacancy: false,
  marketRentDifferencePromotedToRentGrowth: false,
  appraisalRatePromotedToExitRate: false,
  loanTermPromotedToHoldPeriod: false,
  calculationsPerformed: false,
  scenarioOutputsCreated: false,
  riskClassificationAuthorized: false,
  gate7ScenarioEngineReceiptEstablished: false,
  memoComponentsExecuted: false,
  narrativeGenerated: false,
  customerFacingCopyProduced: false,
  downstreamRenderingAuthorized: false,
  screeningBehaviorChanged: false,
  deliveryGateChanged: false,
  corePublicationThresholdChanged: false,
  optionalScenarioAuthorityFailureMayBlockValidatedCorePublication: false,
  legacyUnderwritingReuseAllowed: false,
});
assert.equal(contract.reportPublicationBlocker, false);

assert.deepEqual(contract.scenarioPolicyReceipt, {
  source: 'canonical_institutional_underwriting_scenario_policy_contract',
  contractVersion: 1,
  exactCanonicalEmbeddedScenarioPolicy: true,
  authorityState: 'not_established',
  approvedPolicyId: null,
  approvedPolicyVersion: null,
  effectiveDate: null,
  approvalReceipt: null,
  reportPublicationBlocker: false,
});
assert.equal(contract.sourceCaseContext.authorityState, 'canonical_source_case_only');
assert.equal(contract.sourceCaseContext.sourceCaseAuthorized, true);
assert.equal(contract.sourceCaseContext.eligibleAsStressScenario, false);
assert.equal(Object.values(contract.sourceCaseContext.adjustments).every((value) => value === null), true);

assert.deepEqual(Object.keys(contract.stressInputs), [
  'rentGrowthRate',
  'occupancyRate',
  'vacancyRate',
  'expenseGrowthRate',
  'taxGrowthRate',
  'interestRate',
  'capitalizationRate',
  'exitCapitalizationRate',
  'holdPeriodYears',
]);
for (const input of Object.values(contract.stressInputs)) {
  assert.equal(input.value, null);
  assert.equal(input.authorityState, 'not_established');
  assert.equal(input.sourceBound, false);
  assert.equal(input.policyBound, false);
  assert.equal(input.scenarioInputEligible, false);
  assert.deepEqual(input.provenance, []);
  assert.equal(input.semanticRestrictionCodes.length > 0, true);
  assert.equal(input.reasonCode, 'CANONICAL_SCENARIO_STRESS_INPUT_NOT_AVAILABLE');
  assert.equal(input.customerSurfaceAuthorized, false);
  assert.equal(input.reportPublicationBlocker, false);
}
assert.equal(
  contract.stressInputs.rentGrowthRate.semanticRestrictionCodes.includes(
    'SOURCE_STATED_MARKET_RENT_DIFFERENCE_IS_NOT_RENT_GROWTH'
  ),
  true
);
assert.equal(
  contract.stressInputs.occupancyRate.semanticRestrictionCodes.includes(
    'SOURCE_CASE_OCCUPANCY_IS_NOT_STRESS_OCCUPANCY'
  ),
  true
);
assert.equal(
  contract.stressInputs.interestRate.semanticRestrictionCodes.includes(
    'CURRENT_OR_PROPOSED_ACQUISITION_INTEREST_RATE_IS_NOT_STRESS_RATE'
  ),
  true
);
assert.equal(
  contract.stressInputs.exitCapitalizationRate.semanticRestrictionCodes.includes(
    'APPRAISAL_CAPITALIZATION_RATE_IS_NOT_EXIT_CAPITALIZATION_RATE'
  ),
  true
);

assert.deepEqual(Object.keys(contract.scenarioFamilies), [
  'rentStress',
  'occupancyStress',
  'rateStress',
  'taxStress',
  'expenseStress',
  'capitalizationRateStress',
  'exitStress',
]);
for (const family of Object.values(contract.scenarioFamilies)) {
  assert.equal(family.authorityState, 'not_established');
  assert.equal(family.calculationEligible, false);
  assert.deepEqual(family.availableInputFields, []);
  assert.deepEqual(family.missingInputFields, family.requiredInputFields);
  assert.equal(family.calculationsPerformed, false);
  assert.equal(family.output, null);
  assert.equal(family.riskClassificationAuthorized, false);
  assert.equal(family.customerSurfaceAuthorized, false);
  assert.equal(family.reportPublicationBlocker, false);
}
assert.equal(contract.gate7Receipt.established, false);
assert.equal(contract.gate7Receipt.canonicalReceipt, undefined);
assert.equal(contract.gate7Receipt.availableScenarioFamilies.length, 0);
assert.equal(contract.gate7Receipt.missingScenarioFamilies.length, 7);
assert.equal(contract.coverage.availableStressInputCount, 0);
assert.equal(contract.coverage.totalStressInputCount, 9);
assert.equal(contract.coverage.eligibleScenarioFamilyCount, 0);
assert.equal(contract.coverage.totalScenarioFamilyCount, 7);
assert.equal(contract.coverage.calculatedScenarioFamilyCount, 0);
assert.equal(contract.coverage.gate7ScenarioEngineReceiptEstablished, false);

const ignoredCallerOverrides = buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
  dependencySequencingContract,
  rentGrowthRate: 0.03,
  occupancyRate: 0.8,
  vacancyRate: 0.2,
  expenseGrowthRate: 0.04,
  taxGrowthRate: 0.05,
  interestRate: 0.075,
  capitalizationRate: 0.08,
  exitCapitalizationRate: 0.085,
  holdPeriodYears: 5,
  scenarioPolicy: { approved: true },
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
    dependencySequencingContract: {
      source: 'canonical_institutional_investment_committee_memo_dependency_sequencing_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_6D_DEPENDENCY_SEQUENCING_CONTRACT_REQUIRED_FOR_GATE_7A_SCENARIO_INPUT_AUTHORITY/
);

const tamperedUpstream = structuredClone(dependencySequencingContract);
tamperedUpstream.executionSequence.memoExecutionAuthorized = true;
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
    dependencySequencingContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_6D_DEPENDENCY_SEQUENCING_CONTRACT_REQUIRED_FOR_GATE_7A_SCENARIO_INPUT_AUTHORITY/
);

const promotedOccupancy = structuredClone(contract);
promotedOccupancy.stressInputs.occupancyRate.value = 0.9375;
promotedOccupancy.stressInputs.occupancyRate.sourceBound = true;
promotedOccupancy.stressInputs.occupancyRate.scenarioInputEligible = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(promotedOccupancy), false);

const promotedMarketRentDifference = structuredClone(contract);
promotedMarketRentDifference.stressInputs.rentGrowthRate.value = 0.2;
promotedMarketRentDifference.stressInputs.rentGrowthRate.sourceBound = true;
promotedMarketRentDifference.stressInputs.rentGrowthRate.scenarioInputEligible = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(promotedMarketRentDifference), false);

const promotedInterestRate = structuredClone(contract);
promotedInterestRate.stressInputs.interestRate.value = 0.0595;
promotedInterestRate.stressInputs.interestRate.sourceBound = true;
promotedInterestRate.stressInputs.interestRate.scenarioInputEligible = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(promotedInterestRate), false);

const promotedAppraisalRate = structuredClone(contract);
promotedAppraisalRate.stressInputs.exitCapitalizationRate.value = 0.07;
promotedAppraisalRate.stressInputs.exitCapitalizationRate.sourceBound = true;
promotedAppraisalRate.stressInputs.exitCapitalizationRate.scenarioInputEligible = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(promotedAppraisalRate), false);

const authorizedScenario = structuredClone(contract);
authorizedScenario.scenarioFamilies.occupancyStress.authorityState = 'authorized';
authorizedScenario.scenarioFamilies.occupancyStress.calculationEligible = true;
authorizedScenario.scenarioFamilies.occupancyStress.availableInputFields = ['stress_occupancy_rate'];
authorizedScenario.scenarioFamilies.occupancyStress.missingInputFields = [];
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(authorizedScenario), false);

const calculatedScenario = structuredClone(contract);
calculatedScenario.scenarioFamilies.rateStress.calculationsPerformed = true;
calculatedScenario.scenarioFamilies.rateStress.output = { stressedDebtService: 999999999 };
calculatedScenario.scenarioOutputs.rateStress = { stressedDebtService: 999999999 };
calculatedScenario.scenarioOutputs.calculationsPerformed = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(calculatedScenario), false);

const fabricatedGate7Receipt = structuredClone(contract);
fabricatedGate7Receipt.gate7Receipt.authorityState = 'established';
fabricatedGate7Receipt.gate7Receipt.established = true;
fabricatedGate7Receipt.coverage.gate7ScenarioEngineReceiptEstablished = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(fabricatedGate7Receipt), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.scenarioFamilies.exitStress.riskClassificationAuthorized = true;
classifiedRisk.scenarioOutputs.riskClassificationGenerated = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(classifiedRisk), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate7Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(publicationBlocked), false);

const coreOnlyContract = buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
  dependencySequencingContract: buildGate6D(buildSourceTruth({
    jobId: 'gate-7a-core-only',
    includePurchase: false,
  })),
});
assert.equal(isCanonicalInstitutionalScenarioEngineInputAuthorityContract(coreOnlyContract), true);
assert.equal(coreOnlyContract.sourceCaseContext.sourceCaseAuthorized, true);
assert.equal(coreOnlyContract.coverage.availableStressInputCount, 0);
assert.equal(coreOnlyContract.coverage.eligibleScenarioFamilyCount, 0);
assert.equal(coreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scenario-engine-input-authority-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)].map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-investment-committee-memo-dependency-sequencing-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-scenario-engine-input-authority-contract-smoke: PASS');
