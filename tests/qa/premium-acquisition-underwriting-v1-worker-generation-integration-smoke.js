import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildInstitutionalGate10ReportFixture } from './fixtures/institutional-gate-10-report.js';
import {
  buildCanonicalInstitutionalFinancialIntelligence,
} from '../../api/_lib/institutional-financial-intelligence.js';
import {
  buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js';
import {
  buildPremiumAcquisitionUnderwritingV1ExternalGeneration,
} from '../../api/_lib/premium-acquisition-underwriting-v1-external-generation.js';

function canonicalSourceTruth(jobId) {
  const sourceTruth = structuredClone(
    buildInstitutionalGate10ReportFixture(jobId).sourceTruthPackage,
  );
  for (const entry of sourceTruth.support.accepted) {
    entry.artifact_id ||= `${entry.file_id}-artifact`;
    entry.fact_conflicts = [];
    entry.authority_decision.fileId = entry.file_id;
  }
  const appraisal = sourceTruth.support.accepted.find(
    (entry) => entry.canonical_role === 'appraisal_context',
  );
  appraisal.accepted_facts = {
    appraised_value: appraisal.accepted_facts.appraisal_value,
    appraisal_noi: appraisal.accepted_facts.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_facts.stabilized_cap_rate,
  };
  appraisal.accepted_fact_evidence = {
    appraised_value: appraisal.accepted_fact_evidence.appraisal_value,
    appraisal_noi: appraisal.accepted_fact_evidence.stabilized_noi,
    appraisal_cap_rate: appraisal.accepted_fact_evidence.stabilized_cap_rate,
  };
  appraisal.authority_decision.acceptedFacts = appraisal.accepted_facts;
  appraisal.authority_decision.acceptedFactEvidence =
    appraisal.accepted_fact_evidence;
  sourceTruth.core.rent_roll.accepted_facts.unit_mix = [{
    label: '1BR',
    count: 64,
    current_rent: 1865.625,
    market_rent: 2237.5,
    avg_sqft: 830,
    occupied_count: 62,
    vacant_count: 2,
  }];
  sourceTruth.support.adjudication_decisions =
    sourceTruth.support.accepted.map((entry) => entry.authority_decision);
  return sourceTruth;
}

const activationStartedAt = '2026-07-26T12:00:00.000Z';
const jobId = 'worker-generation-premium-job';
const jobSurfaceReceipt =
  buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
    job: {
      id: jobId,
      report_type: 'underwriting',
      created_at: activationStartedAt,
    },
    capabilityEnabled: true,
    activationStartedAt,
    resolvedAt: '2026-07-26T12:00:01.000Z',
  });
const sourceTruthPackage = canonicalSourceTruth(jobId);
const financialIntelligence = buildCanonicalInstitutionalFinancialIntelligence({
  sourceTruthPackage,
  asOfDate: '2026-07-26',
});
const generation =
  buildPremiumAcquisitionUnderwritingV1ExternalGeneration({
    jobSurfaceReceipt,
    sourceTruthPackage,
    financialIntelligence,
  });
assert.equal(generation.enabled, true);
assert.equal(generation.status, 'external_premium_model_validated');
assert.equal(generation.premiumUnderwritingCapabilityEnabled, true);
assert.equal(generation.premiumUnderwritingModel.validation.ok, true);
assert.equal(generation.generationReceipt.premiumSurfaceGenerated, true);
assert.equal(generation.generationReceipt.deliveryAuthority, false);
assert.equal(generation.generationReceipt.publicationAuthority, false);

const baseGeneration =
  buildPremiumAcquisitionUnderwritingV1ExternalGeneration({
    jobSurfaceReceipt: buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
      job: {
        id: 'worker-generation-base-job',
        report_type: 'underwriting',
        created_at: '2026-07-26T11:59:59.000Z',
      },
      capabilityEnabled: true,
      activationStartedAt,
      resolvedAt: '2026-07-26T12:00:01.000Z',
    }),
    sourceTruthPackage,
    financialIntelligence,
  });
assert.equal(baseGeneration.enabled, false);
assert.equal(baseGeneration.premiumUnderwritingModel, null);

assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1ExternalGeneration({
    jobSurfaceReceipt,
    sourceTruthPackage: null,
    financialIntelligence,
  }),
  /PREMIUM_UNDERWRITING_EXTERNAL_GENERATION_FAILED/,
);

const workerSource = readFileSync(
  new URL('../../api/admin-run-worker.js', import.meta.url),
  'utf8',
);
const generatorSource = readFileSync(
  new URL('../../api/_lib/generate-client-report-impl.js', import.meta.url),
  'utf8',
);
assert.match(
  workerSource,
  /resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt/,
);
assert.match(
  workerSource,
  /PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT/,
);
assert.match(
  generatorSource,
  /JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE/,
);
assert.match(
  generatorSource,
  /buildPremiumAcquisitionUnderwritingV1ExternalGeneration/,
);
assert.match(
  generatorSource,
  /premiumUnderwritingModel:\s*premiumExternalGeneration\.premiumUnderwritingModel/,
);
assert.match(
  generatorSource,
  /premium_underwriting_job_start_surface_receipt/,
);
assert.doesNotMatch(
  generatorSource,
  /body\?\.premium_underwriting_job_start_surface_receipt/,
);

console.log(
  'premium-acquisition-underwriting-v1 worker-generation-integration smoke passed',
);
