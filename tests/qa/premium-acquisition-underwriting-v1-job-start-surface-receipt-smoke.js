import assert from 'node:assert/strict';

import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from '../../api/_lib/premium-acquisition-underwriting-v1-model.js';
import {
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js';
import {
  JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
  buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js';

const activationStartedAt = '2026-07-26T12:00:00.000Z';
const resolvedAt = '2026-07-26T12:00:01.000Z';

const existingUnderwriting = buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job: {
    id: 'existing-underwriting',
    report_type: 'underwriting',
    created_at: '2026-07-26T11:59:59.999Z',
  },
  capabilityEnabled: true,
  activationStartedAt,
  resolvedAt,
});
assert.equal(
  existingUnderwriting.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(existingUnderwriting.externalPremiumPromiseEstablished, false);
assert.equal(existingUnderwriting.premiumCertificationRequired, false);

const newUnderwriting = buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job: {
    id: 'new-underwriting',
    report_type: 'underwriting',
    created_at: activationStartedAt,
  },
  capabilityEnabled: true,
  activationStartedAt,
  resolvedAt,
});
assert.equal(
  newUnderwriting.reportSurfaceVersion,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
);
assert.equal(newUnderwriting.assignmentScope, 'external_job_start');
assert.equal(
  newUnderwriting.status,
  'premium_surface_assigned_external_job_start',
);
assert.equal(newUnderwriting.externalPremiumPromiseEstablished, true);
assert.equal(newUnderwriting.externalPublicationAllowed, false);
assert.equal(newUnderwriting.premiumCertificationRequired, true);
assert.equal(newUnderwriting.authority.workerAuthority, false);
assert.equal(newUnderwriting.authority.publicationAuthority, false);
assert.equal(
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(newUnderwriting),
  true,
);

const screening = buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job: {
    id: 'new-screening',
    report_type: 'screening',
    created_at: '2026-07-26T12:00:02.000Z',
  },
  capabilityEnabled: true,
  activationStartedAt,
  resolvedAt,
});
assert.equal(
  screening.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(screening.externalPremiumPromiseEstablished, false);

const defaultOff = buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job: {
    id: 'default-off-underwriting',
    report_type: 'underwriting',
    created_at: '2026-07-26T12:00:02.000Z',
  },
  capabilityEnabled: false,
  resolvedAt,
});
assert.equal(
  defaultOff.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);

assert.throws(
  () => buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
    job: {
      id: 'partial-activation',
      report_type: 'underwriting',
      created_at: '2026-07-26T12:00:02.000Z',
    },
    capabilityEnabled: true,
    resolvedAt,
  }),
  /ACTIVATION_TIMESTAMP_REQUIRED/,
);

function buildArtifactStore(initialRows = []) {
  const rows = [...initialRows];
  return {
    rows,
    from(table) {
      assert.equal(table, 'analysis_artifacts');
      const filters = {};
      const query = {
        select() { return query; },
        eq(key, value) { filters[key] = value; return query; },
        order() { return query; },
        limit() {
          return Promise.resolve({
            data: rows
              .filter((row) =>
                row.job_id === filters.job_id &&
                row.type === filters.type)
              .slice(0, 2)
              .map((row) => ({ payload: row.payload })),
            error: null,
          });
        },
        insert(entries) {
          rows.push(...entries);
          return Promise.resolve({ error: null });
        },
      };
      return query;
    },
  };
}

const store = buildArtifactStore();
const persisted = await resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  supabaseAdmin: store,
  job: {
    id: 'persisted-underwriting',
    user_id: 'user-1',
    report_type: 'underwriting',
    created_at: activationStartedAt,
  },
  capabilityEnabled: true,
  activationStartedAt,
  resolvedAt,
});
assert.equal(persisted.premiumSurfaceAssigned, true);
assert.equal(store.rows.length, 1);
assert.equal(store.rows[0].type, JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE);

const replayed = await resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  supabaseAdmin: store,
  job: {
    id: 'persisted-underwriting',
    user_id: 'user-1',
    report_type: 'underwriting',
    created_at: activationStartedAt,
  },
  capabilityEnabled: false,
  resolvedAt: '2027-01-01T00:00:00.000Z',
});
assert.deepEqual(replayed, persisted);
assert.equal(store.rows.length, 1);

const duplicateStore = buildArtifactStore([
  {
    job_id: 'duplicate-job',
    type: JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
    payload: persisted,
  },
  {
    job_id: 'duplicate-job',
    type: JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
    payload: persisted,
  },
]);
await assert.rejects(
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
    supabaseAdmin: duplicateStore,
    job: { id: 'duplicate-job' },
  }),
  /MULTIPLE_JOB_START_SURFACE_RECEIPTS_DETECTED/,
);

console.log(
  'premium-acquisition-underwriting-v1 job-start-surface-receipt smoke passed',
);
