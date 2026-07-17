import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCanonicalGate8C } from './fixtures/institutional-gate-8-chain.js';
import {
  buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract,
  isCanonicalInstitutionalDueDiligenceCompletionHandoffContract,
} from '../../api/_lib/institutional-due-diligence-completion-handoff-contract.js';

const priorityEligibilityContract = buildCanonicalGate8C('gate-8d-job');
const contract = buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
  priorityEligibilityContract,
});

assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(contract), true);
assert.equal(Object.isFrozen(contract), true);
assert.equal(Object.isFrozen(contract.gate8CompletionReceipt), true);
assert.equal(Object.isFrozen(contract.gate6Handoff), true);
assert.equal(contract.source, 'canonical_institutional_due_diligence_completion_handoff_contract');
assert.equal(contract.contractVersion, 1);
assert.deepEqual(contract.upstreamContract, priorityEligibilityContract);
assert.equal(contract.upstreamReceipt.jobId, 'gate-8d-job');
assert.equal(contract.upstreamReceipt.corePublishable, true);
assert.equal(contract.upstreamReceipt.exactCanonicalGate8CReceipt, true);
assert.equal(contract.upstreamReceipt.assessedCategoryCount, 7);
assert.equal(contract.upstreamReceipt.eligiblePriorityCount, 0);
assert.equal(contract.upstreamReceipt.assignedPriorityCount, 0);
assert.equal(contract.upstreamReceipt.assignedActionCount, 0);

assert.deepEqual(contract.gate8CompletionReceipt, {
  receiptKey: 'canonical_gate_8_due_diligence_engine_completion_receipt',
  receiptVersion: 1,
  authorityState: 'established_neutral_coverage_no_approved_requirement_or_priority_policy',
  established: true,
  architectureComplete: true,
  coverageAnalysisState: 'complete_neutral_evidence_coverage_only',
  assessedCategoryCount: 7,
  acceptedEvidenceCategoryKeys: ['environmental', 'tax'],
  establishedDocumentGapCount: 0,
  establishedAdverseFindingCount: 0,
  assignedPriorityCount: 0,
  assignedActionCount: 0,
  limitationCodes: [
    'APPROVED_DUE_DILIGENCE_REQUIREMENT_POLICY_NOT_ESTABLISHED',
    'APPROVED_DUE_DILIGENCE_PRIORITY_POLICY_NOT_ESTABLISHED',
  ],
  riskClassificationAuthorized: false,
  memoExecutionAuthorized: false,
  customerSurfaceAuthorized: false,
  reportPublicationBlocker: false,
});
assert.deepEqual(contract.gate6Handoff, {
  handoffKey: 'canonical_gate_8_to_gate_6_internal_handoff',
  targetGate: 'gate_6_investment_committee_memo',
  targetComponent: 'diligence',
  handoffState: 'available_neutral_coverage_no_authorized_priorities',
  canonicalGate8CompletionReceiptAvailable: true,
  neutralCoverageReceiptAvailable: true,
  acceptedEvidenceCategoryKeys: ['environmental', 'tax'],
  establishedDocumentGaps: [],
  establishedAdverseFindings: [],
  diligencePriorityReceiptAvailable: false,
  authorizedPriorities: [],
  authorizedActions: [],
  diligenceComponentExecutionAuthorized: false,
  memoExecutionAuthorized: false,
  remainingRequiredRoadmapGates: ['gate_9_institutional_scoring'],
  upstreamGate6SequencingMutated: false,
  customerSurfaceAuthorized: false,
  reportPublicationBlocker: false,
});
assert.equal(contract.coverage.gate8ArchitectureComplete, true);
assert.equal(contract.coverage.gate8CompletionReceiptEstablished, true);
assert.equal(contract.coverage.acceptedEvidenceCategoryCount, 2);
assert.equal(contract.coverage.establishedDocumentGapCount, 0);
assert.equal(contract.coverage.establishedAdverseFindingCount, 0);
assert.equal(contract.coverage.authorizedPriorityCount, 0);
assert.equal(contract.coverage.authorizedActionCount, 0);
assert.equal(contract.coverage.riskClassificationCount, 0);
assert.equal(contract.coverage.memoComponentExecutionCount, 0);
assert.equal(contract.coverage.gate6InternalHandoffAvailable, true);
assert.equal(contract.reportPublicationBlocker, false);

const ignoredOverrides = buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
  priorityEligibilityContract,
  completionReceipt: { establishedDocumentGapCount: 1 },
  gate6Handoff: { diligenceComponentExecutionAuthorized: true },
  reportPublicationBlocker: true,
});
assert.deepEqual(ignoredOverrides, contract);

assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
    priorityEligibilityContract: {
      source: 'canonical_institutional_due_diligence_priority_eligibility_contract',
      contractVersion: 1,
    },
  }),
  /COMPLETE_CANONICAL_GATE_8C_PRIORITY_ELIGIBILITY_REQUIRED_FOR_GATE_8D_COMPLETION_HANDOFF/
);

const tamperedUpstream = structuredClone(priorityEligibilityContract);
tamperedUpstream.priorityReceipt.established = true;
assert.throws(
  () => buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
    priorityEligibilityContract: tamperedUpstream,
  }),
  /COMPLETE_CANONICAL_GATE_8C_PRIORITY_ELIGIBILITY_REQUIRED_FOR_GATE_8D_COMPLETION_HANDOFF/
);

const fabricatedGap = structuredClone(contract);
fabricatedGap.gate8CompletionReceipt.establishedDocumentGapCount = 1;
fabricatedGap.gate6Handoff.establishedDocumentGaps = ['insurance'];
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(fabricatedGap), false);

const fabricatedAdverseFinding = structuredClone(contract);
fabricatedAdverseFinding.gate8CompletionReceipt.establishedAdverseFindingCount = 1;
fabricatedAdverseFinding.gate6Handoff.establishedAdverseFindings = ['environmental'];
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(fabricatedAdverseFinding), false);

const fabricatedPriority = structuredClone(contract);
fabricatedPriority.gate6Handoff.diligencePriorityReceiptAvailable = true;
fabricatedPriority.gate6Handoff.authorizedPriorities = [{ categoryKey: 'insurance', priority: 'high' }];
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(fabricatedPriority), false);

const executedMemo = structuredClone(contract);
executedMemo.gate6Handoff.diligenceComponentExecutionAuthorized = true;
executedMemo.gate6Handoff.memoExecutionAuthorized = true;
executedMemo.coverage.memoComponentExecutionCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(executedMemo), false);

const classifiedRisk = structuredClone(contract);
classifiedRisk.gate8CompletionReceipt.riskClassificationAuthorized = true;
classifiedRisk.coverage.riskClassificationCount = 1;
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(classifiedRisk), false);

const mutatedGate6Sequence = structuredClone(contract);
mutatedGate6Sequence.gate6Handoff.upstreamGate6SequencingMutated = true;
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(mutatedGate6Sequence), false);

const customerAuthorized = structuredClone(contract);
customerAuthorized.gate8CompletionReceipt.customerSurfaceAuthorized = true;
customerAuthorized.gate6Handoff.customerSurfaceAuthorized = true;
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(customerAuthorized), false);

const publicationBlocked = structuredClone(contract);
publicationBlocked.reportPublicationBlocker = true;
publicationBlocked.gate8CompletionReceipt.reportPublicationBlocker = true;
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(publicationBlocked), false);

const secondContract = buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
  priorityEligibilityContract: buildCanonicalGate8C('gate-8d-second'),
});
assert.equal(isCanonicalInstitutionalDueDiligenceCompletionHandoffContract(secondContract), true);
assert.equal(secondContract.gate8CompletionReceipt.established, true);
assert.equal(secondContract.coverage.establishedDocumentGapCount, 0);
assert.equal(secondContract.gate6Handoff.diligenceComponentExecutionAuthorized, false);
assert.equal(secondContract.reportPublicationBlocker, false);

const productionSource = readFileSync(
  new URL('../../api/_lib/institutional-due-diligence-completion-handoff-contract.js', import.meta.url),
  'utf8'
);
const importedModules = [...productionSource.matchAll(/^import .* from ['"](.+)['"];$/gm)]
  .map((match) => match[1]);
assert.deepEqual(importedModules, ['./institutional-due-diligence-priority-eligibility-contract.js']);
assert.equal(productionSource.includes('\u2014'), false);
assert.equal(/['"](?:BUY|SELL)['"]/.test(productionSource), false);
assert.equal(productionSource.includes('generate-client-report'), false);
assert.equal(productionSource.includes('customer-surface'), false);
assert.equal(productionSource.includes('delivery-gate'), false);
assert.equal(productionSource.toLowerCase().includes('legacy-underwriting'), false);

console.log('institutional-due-diligence-completion-handoff-contract-smoke: PASS');
