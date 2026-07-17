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
import { buildCanonicalInstitutionalScenarioEngineInputAuthorityContract } from '../../api/_lib/institutional-scenario-engine-input-authority-contract.js';
import {
  buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract,
  isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract,
} from '../../api/_lib/institutional-scenario-engine-stress-set-authority-contract.js';

function buildSourceTruth(jobId = 'gate-7b-job') {
  return buildCanonicalSourceTruthPackage({
    jobId,
    propertyName: 'Gate 7B Property',
    artifacts: [
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
    ],
  });
}

function buildGate7A(sourceTruthPackage) {
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
  const dependencySequencingContract =
    buildCanonicalInstitutionalInvestmentCommitteeMemoDependencySequencingContract({
      componentEvidenceContract,
    });
  return buildCanonicalInstitutionalScenarioEngineInputAuthorityContract({
    dependencySequencingContract,
  });
}

const inputAuthorityContract = buildGate7A(buildSourceTruth());
const contract = buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
  inputAuthorityContract,
});

assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.inputAuthority), true);
assert.equal(Object.isFrozen(contract.stressSets), true);
assert.equal(contract.source, 'canonical_institutional_scenario_engine_stress_set_authority_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, inputAuthorityContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-7b-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate7AReceipt, true);
assert.equal(contract.upstreamReceipt.availableStressInputCount, 0);
assert.equal(contract.upstreamReceipt.eligibleScenarioFamilyCount, 0);
assert.equal(contract.upstreamReceipt.gate7ScenarioEngineReceiptEstablished, false);

assert.deepEqual(contract.policy, {
  sourceAuthorityCreating: false,
  sourceTruthMutationAllowed: false,
  scenarioPolicyAuthorityResolutionOnly: true,
  deterministicStressSetDefinitionOnly: true,
  exactSourceAuthorityRequired: true,
  explicitApprovedPolicyAuthorityRequiredWhenSourceAuthorityAbsent: true,
  callerStressInputsAccepted: false,
  callerPolicyAccepted: false,
  policyApprovalInferred: false,
  currentFactsPromotedToStressInputs: false,
  stressSetValuesInvented: false,
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

assert.deepEqual(contract.scenarioPolicyAuthority, {
  source: 'canonical_institutional_underwriting_scenario_policy_contract',
  contractVersion: 1,
  exactCanonicalEmbeddedScenarioPolicy: true,
  authorityState: 'not_established',
  approvedPolicyId: null,
  approvedPolicyVersion: null,
  effectiveDate: null,
  approvalReceipt: null,
  approvalComplete: false,
  policyValuesAuthorized: false,
  reportPublicationBlocker: false,
});
assert.equal(contract.sourceCaseContext.sourceCaseAuthorized, true);
assert.equal(contract.sourceCaseContext.eligibleAsStressScenario, false);
assert.equal(Object.values(contract.sourceCaseContext.adjustments).every((value) => value === null), true);

assert.deepEqual(Object.keys(contract.inputAuthority), [
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
for (const input of Object.values(contract.inputAuthority)) {
  assert.equal(input.value, null);
  assert.equal(input.authorityState, 'not_established');
  assert.equal(input.selectedAuthority, null);
  assert.equal(input.exactSourceAuthorityAvailable, false);
  assert.equal(input.exactApprovedPolicyAuthorityAvailable, false);
  assert.equal(input.scenarioInputEligible, false);
  assert.deepEqual(input.provenance, []);
  assert.equal(input.semanticRestrictionCodes.length > 0, true);
  assert.equal(input.reasonCode, 'EXACT_SOURCE_OR_APPROVED_SCENARIO_POLICY_AUTHORITY_NOT_AVAILABLE');
  assert.equal(input.customerSurfaceAuthorized, false);
  assert.equal(input.reportPublicationBlocker, false);
}

assert.deepEqual(Object.keys(contract.stressSets), [
  'rentStress',
  'occupancyStress',
  'rateStress',
  'taxStress',
  'expenseStress',
  'capitalizationRateStress',
  'exitStress',
]);
for (const stressSet of Object.values(contract.stressSets)) {
  assert.equal(stressSet.definitionState, 'deterministically_defined');
  assert.equal(stressSet.authorityState, 'not_established');
  assert.equal(stressSet.stressSetAuthorized, false);
  assert.deepEqual(stressSet.availableInputFields, []);
  assert.deepEqual(stressSet.missingInputFields, stressSet.requiredInputFields);
  assert.equal(stressSet.calculationsPerformed, false);
  assert.equal(stressSet.output, null);
  assert.equal(stressSet.riskClassificationAuthorized, false);
  assert.equal(stressSet.memoExecutionAuthorized, false);
  assert.equal(stressSet.customerSurfaceAuthorized, false);
  assert.equal(stressSet.reportPublicationBlocker, false);
}
assert.deepEqual(contract.stressSets.occupancyStress.requiredInputFields, [
  'stress_occupancy_rate',
  'stress_vacancy_rate',
]);
assert.deepEqual(contract.stressSets.exitStress.requiredInputFields, [
  'exit_capitalization_rate',
  'hold_period_years',
]);
assert.equal(contract.coverage.definedStressSetCount, 7);
assert.equal(contract.coverage.totalStressSetCount, 7);
assert.equal(contract.coverage.authorizedStressSetCount, 0);
assert.equal(contract.coverage.availableStressInputCount, 0);
assert.equal(contract.coverage.totalStressInputCount, 9);
assert.equal(contract.coverage.approvedScenarioPolicyAvailable, false);
assert.equal(contract.gate7Receipt.established, false);
assert.equal(contract.gate7Receipt.missingStressSets.length, 7);
assert.equal(contract.scenarioOutputs.calculationsPerformed, false);
assert.deepEqual(contract.scenarioOutputs.outputs, {});

const ignoredCallerOverrides = buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
  inputAuthorityContract,
  scenarioPolicy: {
    authorityState: 'approved',
    approvedPolicyId: 'caller-policy',
    approvalReceipt: 'caller-receipt',
  },
  stressInputs: { occupancyRate: 0.8, interestRate: 0.075 },
  stressSets: { occupancyStress: { authorized: true } },
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredCallerOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
    inputAuthorityContract: {
      source: 'canonical_institutional_scenario_engine_input_authority_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_7A_INPUT_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7B_STRESS_SET_AUTHORITY/
);

const tamperedUpstream = structuredClone(inputAuthorityContract);
tamperedUpstream.policy.callerStressInputsAccepted = true;
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
    inputAuthorityContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_7A_INPUT_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7B_STRESS_SET_AUTHORITY/
);

const counterfeitApprovedPolicy = structuredClone(inputAuthorityContract);
counterfeitApprovedPolicy.scenarioPolicyReceipt.authorityState = 'approved';
counterfeitApprovedPolicy.scenarioPolicyReceipt.approvedPolicyId = 'counterfeit-policy';
counterfeitApprovedPolicy.scenarioPolicyReceipt.approvalReceipt = 'counterfeit-receipt';
assert.throws(
  () => buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
    inputAuthorityContract: counterfeitApprovedPolicy,
  }),
  /COMPLETE_CANONICAL_GATE_7A_INPUT_AUTHORITY_CONTRACT_REQUIRED_FOR_GATE_7B_STRESS_SET_AUTHORITY/
);

const promotedCurrentOccupancy = structuredClone(contract);
promotedCurrentOccupancy.inputAuthority.occupancyRate.value = 0.9375;
promotedCurrentOccupancy.inputAuthority.occupancyRate.selectedAuthority = 'source';
promotedCurrentOccupancy.inputAuthority.occupancyRate.exactSourceAuthorityAvailable = true;
promotedCurrentOccupancy.inputAuthority.occupancyRate.scenarioInputEligible = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(promotedCurrentOccupancy), false);

const inferredPolicyApproval = structuredClone(contract);
inferredPolicyApproval.scenarioPolicyAuthority.authorityState = 'approved';
inferredPolicyApproval.scenarioPolicyAuthority.approvalComplete = true;
inferredPolicyApproval.scenarioPolicyAuthority.policyValuesAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(inferredPolicyApproval), false);

const authorizedIncompleteSet = structuredClone(contract);
authorizedIncompleteSet.stressSets.exitStress.authorityState = 'authorized';
authorizedIncompleteSet.stressSets.exitStress.stressSetAuthorized = true;
authorizedIncompleteSet.coverage.authorizedStressSetCount = 1;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(authorizedIncompleteSet), false);

const calculatedScenario = structuredClone(contract);
calculatedScenario.stressSets.rateStress.calculationsPerformed = true;
calculatedScenario.stressSets.rateStress.output = { stressedDebtService: 999999999 };
calculatedScenario.scenarioOutputs.calculationsPerformed = true;
calculatedScenario.scenarioOutputs.outputs.rateStress = { stressedDebtService: 999999999 };
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(calculatedScenario), false);

const fabricatedGate7Receipt = structuredClone(contract);
fabricatedGate7Receipt.gate7Receipt.authorityState = 'established';
fabricatedGate7Receipt.gate7Receipt.established = true;
fabricatedGate7Receipt.coverage.gate7ScenarioEngineReceiptEstablished = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(fabricatedGate7Receipt), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.stressSets.exitStress.riskClassificationAuthorized = true;
classifiedRisk.scenarioOutputs.riskClassificationGenerated = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(classifiedRisk), false);

const executedMemo = structuredClone(contract);
executedMemo.stressSets.rentStress.memoExecutionAuthorized = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(executedMemo), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate7Receipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(publicationBlocked), false);

const secondCoreOnlyContract = buildCanonicalInstitutionalScenarioEngineStressSetAuthorityContract({
  inputAuthorityContract: buildGate7A(buildSourceTruth('gate-7b-second-core-only')),
});
assert.equal(isCanonicalInstitutionalScenarioEngineStressSetAuthorityContract(secondCoreOnlyContract), true);
assert.equal(secondCoreOnlyContract.upstreamReceipt.corePublishable, true);
assert.equal(secondCoreOnlyContract.coverage.definedStressSetCount, 7);
assert.equal(secondCoreOnlyContract.coverage.authorizedStressSetCount, 0);
assert.equal(secondCoreOnlyContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-scenario-engine-stress-set-authority-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-scenario-engine-input-authority-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-scenario-engine-stress-set-authority-contract-smoke: PASS');
