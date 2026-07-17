import {
  buildGate7SourceTruth,
  buildCanonicalGate7EFromSourceTruth,
} from './institutional-gate-7-chain.js';
import { buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract } from '../../../api/_lib/institutional-due-diligence-evidence-inventory-contract.js';
import { buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract } from '../../../api/_lib/institutional-due-diligence-coverage-classification-contract.js';
import { buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract } from '../../../api/_lib/institutional-due-diligence-priority-eligibility-contract.js';
import { buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract } from '../../../api/_lib/institutional-due-diligence-completion-handoff-contract.js';

function supportTextArtifact(id, filename, text) {
  return {
    id: `${id}-artifact`,
    file_id: `${id}-file`,
    original_filename: filename,
    type: 'document_text_extracted',
    payload: {
      file_id: `${id}-file`,
      original_filename: filename,
      text,
    },
  };
}

export function buildCanonicalGate8A(jobId = 'gate-8-chain-job') {
  const sourceTruthPackage = buildGate7SourceTruth(jobId, [
    supportTextArtifact(
      'environmental',
      'Phase I ESA.pdf',
      'Phase I ESA / Environmental Due Diligence\nNo recognized environmental condition.'
    ),
    supportTextArtifact(
      'property-tax',
      'Property Tax Bill.pdf',
      'Property Tax Bill\nAnnual Tax $185,000\nAssessment roll 2026.'
    ),
  ]);
  return buildCanonicalInstitutionalDueDiligenceEvidenceInventoryContract({
    gate7CompletionContract: buildCanonicalGate7EFromSourceTruth(sourceTruthPackage),
    sourceTruthPackage,
  });
}

export function buildCanonicalGate8B(jobId = 'gate-8-chain-job') {
  return buildCanonicalInstitutionalDueDiligenceCoverageClassificationContract({
    evidenceInventoryContract: buildCanonicalGate8A(jobId),
  });
}

export function buildCanonicalGate8C(jobId = 'gate-8-chain-job') {
  return buildCanonicalInstitutionalDueDiligencePriorityEligibilityContract({
    coverageClassificationContract: buildCanonicalGate8B(jobId),
  });
}

export function buildCanonicalGate8D(jobId = 'gate-8-chain-job') {
  return buildCanonicalInstitutionalDueDiligenceCompletionHandoffContract({
    priorityEligibilityContract: buildCanonicalGate8C(jobId),
  });
}
