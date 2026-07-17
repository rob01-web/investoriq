import { buildCanonicalGate8D } from './institutional-gate-8-chain.js';
import { buildCanonicalInstitutionalScoringInputLineageContract } from '../../../api/_lib/institutional-scoring-input-lineage-contract.js';
import { buildCanonicalInstitutionalScoringMethodologyAuthorityContract } from '../../../api/_lib/institutional-scoring-methodology-authority-contract.js';
import { buildCanonicalInstitutionalScoringExecutionContract } from '../../../api/_lib/institutional-scoring-execution-contract.js';
import { buildCanonicalInstitutionalScoringCompletionHandoffContract } from '../../../api/_lib/institutional-scoring-completion-handoff-contract.js';

export function buildCanonicalGate9A(jobId = 'gate-9-chain-job') {
  return buildCanonicalInstitutionalScoringInputLineageContract({
    dueDiligenceCompletionContract: buildCanonicalGate8D(jobId),
  });
}

export function buildCanonicalGate9B(jobId = 'gate-9-chain-job') {
  return buildCanonicalInstitutionalScoringMethodologyAuthorityContract({
    scoringInputLineageContract: buildCanonicalGate9A(jobId),
  });
}

export function buildCanonicalGate9C(jobId = 'gate-9-chain-job') {
  return buildCanonicalInstitutionalScoringExecutionContract({
    methodologyAuthorityContract: buildCanonicalGate9B(jobId),
  });
}

export function buildCanonicalGate9D(jobId = 'gate-9-chain-job') {
  return buildCanonicalInstitutionalScoringCompletionHandoffContract({
    scoringExecutionContract: buildCanonicalGate9C(jobId),
  });
}
