import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from '../../api/_lib/premium-acquisition-underwriting-v1-model.js';
import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT,
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js';

const resolvedAt = '2026-07-25T12:00:00.000Z';

const defaultOff = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId: 'surface-default-off-job',
  reportType: 'underwriting',
  capabilityEnabled: false,
  resolvedAt,
});
assert.equal(defaultOff.valid, true);
assert.equal(defaultOff.status, 'base_surface_assigned');
assert.equal(
  defaultOff.requestedSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(
  defaultOff.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(defaultOff.premiumSurfaceRequested, false);
assert.equal(defaultOff.premiumSurfaceAssigned, false);
assert.equal(defaultOff.externalPremiumPromiseEstablished, false);
assert.equal(defaultOff.externalPublicationAllowed, false);
assert.equal(defaultOff.coreDeliveryEligibilityChanged, false);
assert.equal(defaultOff.reportPublicationBlocker, false);
assert.equal(defaultOff.authority.reportSurfaceVersionAuthority, true);
assert.equal(defaultOff.authority.deliveryAuthority, false);
assert.equal(defaultOff.authority.publicationAuthority, false);
assert.equal(defaultOff.authority.manifestAuthority, false);
assert.equal(defaultOff.authority.workerAuthority, false);
assert.equal(Object.isFrozen(defaultOff), true);
assert.equal(Object.isFrozen(defaultOff.authority), true);
assert.equal(
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(defaultOff),
  true,
);

const rejectedWhileDisabled =
  resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: 'surface-disabled-premium-job',
    reportType: 'underwriting',
    requestedSurfaceVersion:
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    capabilityEnabled: false,
    resolvedAt,
  });
assert.equal(rejectedWhileDisabled.valid, false);
assert.equal(
  rejectedWhileDisabled.status,
  'surface_assignment_rejected_fail_closed',
);
assert.equal(
  rejectedWhileDisabled.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(rejectedWhileDisabled.premiumSurfaceRequested, true);
assert.equal(rejectedWhileDisabled.premiumSurfaceAssigned, false);
assert.equal(
  rejectedWhileDisabled.issues.some(
    (issue) => issue.code === 'PREMIUM_CAPABILITY_DISABLED',
  ),
  true,
);
assert.equal(rejectedWhileDisabled.reportPublicationBlocker, false);

const premiumInternal = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId: 'surface-premium-internal-job',
  reportType: 'underwriting',
  requestedSurfaceVersion:
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  capabilityEnabled: true,
  resolvedAt,
});
assert.equal(premiumInternal.valid, true);
assert.equal(
  premiumInternal.status,
  'premium_surface_assigned_internal_test',
);
assert.equal(
  premiumInternal.reportSurfaceVersion,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
);
assert.equal(premiumInternal.premiumSurfaceAssigned, true);
assert.equal(premiumInternal.assignmentScope, 'internal_test_only');
assert.equal(premiumInternal.externalPremiumPromiseEstablished, false);
assert.equal(premiumInternal.externalPublicationAllowed, false);
assert.equal(premiumInternal.authority.deliveryAuthority, false);
assert.equal(premiumInternal.authority.publicationAuthority, false);
assert.equal(premiumInternal.authority.workerAuthority, false);
assert.equal(
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
    premiumInternal,
  ),
  true,
);

const replayedReceipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId: premiumInternal.jobId,
  reportType: 'underwriting',
  requestedSurfaceVersion:
    BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  capabilityEnabled: false,
  resolvedAt: '2027-01-01T00:00:00.000Z',
  existingReceipt: premiumInternal,
});
assert.deepEqual(replayedReceipt, premiumInternal);
assert.notEqual(replayedReceipt, premiumInternal);
assert.equal(replayedReceipt.reportSurfaceVersion,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION);
assert.equal(replayedReceipt.capabilityEnabledAtResolution, true);
assert.equal(replayedReceipt.resolvedAt, resolvedAt);
assert.equal(Object.isFrozen(replayedReceipt), true);

assert.throws(
  () => resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: 'different-job',
    existingReceipt: premiumInternal,
  }),
  /JOB_REPORT_SURFACE_VERSION_RECEIPT_JOB_MISMATCH/,
);
const forgedReceipt = structuredClone(premiumInternal);
forgedReceipt.authority.publicationAuthority = true;
assert.equal(
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(forgedReceipt),
  false,
);
assert.throws(
  () => resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: forgedReceipt.jobId,
    existingReceipt: forgedReceipt,
  }),
  /INVALID_EXISTING_JOB_REPORT_SURFACE_VERSION_RECEIPT/,
);

const screeningPremium =
  resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: 'surface-screening-job',
    reportType: 'screening',
    requestedSurfaceVersion:
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    capabilityEnabled: true,
    resolvedAt,
  });
assert.equal(screeningPremium.valid, false);
assert.equal(
  screeningPremium.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(
  screeningPremium.issues.some(
    (issue) => issue.code ===
      'PREMIUM_SURFACE_REQUIRES_UNDERWRITING_REPORT',
  ),
  true,
);
assert.equal(screeningPremium.coreDeliveryEligibilityChanged, false);

const unknownSurface =
  resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: 'surface-unknown-job',
    reportType: 'underwriting',
    requestedSurfaceVersion: 'premium_underwriting_future_v99',
    capabilityEnabled: true,
    resolvedAt,
  });
assert.equal(unknownSurface.valid, false);
assert.equal(
  unknownSurface.reportSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(
  unknownSurface.issues.some(
    (issue) => issue.code === 'UNKNOWN_REPORT_SURFACE_VERSION',
  ),
  true,
);

const missingIdentity = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  reportType: 'underwriting',
  capabilityEnabled: false,
});
assert.equal(missingIdentity.valid, false);
assert.equal(missingIdentity.jobId, null);
assert.equal(missingIdentity.resolvedAt, null);
assert.equal(missingIdentity.reportPublicationBlocker, false);
assert.equal(missingIdentity.customerDocumentFailure, false);

assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT
    .defaultSurfaceVersion,
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT
    .premiumSurfaceVersion,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT
    .assignmentScope,
  'internal_test_only',
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT
    .workerAuthority,
  false,
);
assert.equal(
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT
    .externalEnforcementAuthority,
  false,
);

const moduleSource = readFileSync(
  new URL(
    '../../api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js',
    import.meta.url,
  ),
  'utf8',
);
assert.equal(moduleSource.includes('process.env'), false);
assert.equal(moduleSource.includes('admin-run-worker'), false);
assert.equal(moduleSource.includes('Delivery Gate'), false);
assert.equal(moduleSource.includes('report-quality-manifest'), false);

console.log(
  'premium-acquisition-underwriting-v1 job-surface-authority smoke passed',
);
