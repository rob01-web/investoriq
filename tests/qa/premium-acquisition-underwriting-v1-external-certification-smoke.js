import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  certifyPremiumAcquisitionUnderwritingV1External,
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication,
} from '../../api/_lib/premium-acquisition-underwriting-v1-external-certification.js';
import {
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
} from '../../api/_lib/premium-acquisition-underwriting-v1-job-surface-authority.js';
import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from '../../api/_lib/premium-acquisition-underwriting-v1-model.js';
import {
  completeObservation,
  premiumUnderwritingModel,
} from './premium-acquisition-underwriting-v1-renderer-integration-smoke.js';
import {
  premiumPdfBoss,
} from './premium-acquisition-underwriting-v1-pdf-composition-smoke.js';

const jobId = 'premium-external-certification-job';
const jobSurfaceReceipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId,
  reportType: 'underwriting',
  requestedSurfaceVersion:
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  capabilityEnabled: true,
  resolvedAt: '2026-07-26T12:00:00.000Z',
  assignmentScope: 'external_job_start',
});
const generationReceipt = {
  source: 'premium_acquisition_underwriting_v1_external_generation_receipt',
  version: 1,
  jobId,
  reportSurfaceVersion:
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
  premiumSurfaceGenerated: true,
  modelValidationStatus: premiumUnderwritingModel.validation.status,
  modelValidationOk: true,
};
const externalPdfBoss = structuredClone(premiumPdfBoss);
externalPdfBoss.publication_target = 'external_customer';
externalPdfBoss.customer_delivery_allowed = true;
externalPdfBoss.external_publication_allowed = true;

const certified = certifyPremiumAcquisitionUnderwritingV1External({
  jobSurfaceReceipt,
  generationReceipt,
  premiumUnderwritingModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: externalPdfBoss,
});
assert.equal(certified.status, 'external_premium_certified');
assert.equal(certified.certificationRequired, true);
assert.equal(certified.externalPremiumCertified, true);
assert.equal(certified.externalPublicationAllowed, true);
assert.equal(certified.reportPublicationBlocker, false);
assert.equal(certified.customerDocumentFailure, false);
assert.equal(certified.issues.length, 0);
assert.equal(certified.authority.premiumCertificationAuthority, true);
assert.equal(certified.authority.sourceAuthority, false);
assert.equal(certified.authority.deliveryAuthority, false);
assert.equal(certified.authority.publicationAuthority, false);
assert.equal(certified.authority.manifestAuthority, false);
assert.equal(certified.authority.workerAuthority, false);
assert.equal(certified.authority.billingAuthority, false);
assert.equal(certified.authority.remedyAuthority, false);

const workerAuthorized =
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
    jobSurfaceReceipt,
    externalCertificationReceipt: certified,
  });
assert.equal(
  workerAuthorized.status,
  'external_premium_publication_authorized',
);
assert.equal(workerAuthorized.publicationBlocked, false);

const missingCertificate =
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
    jobSurfaceReceipt,
    externalCertificationReceipt: null,
  });
assert.equal(
  missingCertificate.status,
  'external_premium_publication_blocked',
);
assert.equal(missingCertificate.publicationBlocked, true);
assert.equal(missingCertificate.customerDocumentFailure, false);
assert.deepEqual(
  missingCertificate.issues.map((issue) => issue.code),
  ['PREMIUM_EXTERNAL_CERTIFICATION_REQUIRED'],
);

const mismatchedCertificate = structuredClone(certified);
mismatchedCertificate.jobId = 'different-job';
assert.equal(
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
    jobSurfaceReceipt,
    externalCertificationReceipt: mismatchedCertificate,
  }).publicationBlocked,
  true,
);

const gapObservation = structuredClone(completeObservation);
gapObservation.status = 'observed_gaps';
gapObservation.observedComplete = false;
gapObservation.issues = [{
  code: 'PREMIUM_CALCULATION_MISSING',
  severity: 'advisory',
}];
const completenessFailure =
  certifyPremiumAcquisitionUnderwritingV1External({
    jobSurfaceReceipt,
    generationReceipt,
    premiumUnderwritingModel,
    qualityObservation: gapObservation,
    pdfPublicationQualityBoss: externalPdfBoss,
  });
assert.equal(completenessFailure.externalPremiumCertified, false);
assert.equal(completenessFailure.externalPublicationAllowed, false);
assert.equal(completenessFailure.reportPublicationBlocker, true);
assert.equal(
  completenessFailure.issues.some(
    (item) => item.code ===
      'PREMIUM_EXTERNAL_COMPLETENESS_NOT_OBSERVED',
  ),
  true,
);

const incidentPdfBoss = structuredClone(externalPdfBoss);
incidentPdfBoss.status = 'publishable_with_quality_incident';
incidentPdfBoss.strict_institutional_certified = false;
incidentPdfBoss.quality_incident_codes = ['PDF_ORPHANED_HEADINGS'];
incidentPdfBoss.issues = [{ code: 'PDF_ORPHANED_HEADINGS' }];
const pdfFailure = certifyPremiumAcquisitionUnderwritingV1External({
  jobSurfaceReceipt,
  generationReceipt,
  premiumUnderwritingModel,
  qualityObservation: completeObservation,
  pdfPublicationQualityBoss: incidentPdfBoss,
});
assert.equal(pdfFailure.reportPublicationBlocker, true);
assert.equal(
  pdfFailure.issues.some(
    (item) => item.code === 'PREMIUM_EXTERNAL_PDF_NOT_CERTIFIED',
  ),
  true,
);

const baseSurfaceReceipt =
  resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: 'base-job',
    reportType: 'underwriting',
    requestedSurfaceVersion:
      BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
    capabilityEnabled: false,
    resolvedAt: '2026-07-26T12:00:00.000Z',
    assignmentScope: 'external_job_start',
  });
const baseCertification =
  certifyPremiumAcquisitionUnderwritingV1External({
    jobSurfaceReceipt: baseSurfaceReceipt,
  });
assert.equal(baseCertification.status, 'not_required');
assert.equal(baseCertification.certificationRequired, false);
assert.equal(baseCertification.reportPublicationBlocker, false);
assert.equal(
  certifyPremiumAcquisitionUnderwritingV1External({
    jobSurfaceReceipt: null,
  }).status,
  'not_required',
);
assert.equal(
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
    jobSurfaceReceipt: baseSurfaceReceipt,
    externalCertificationReceipt: null,
  }).publicationBlocked,
  false,
);
const missingJobSurfaceReceipt =
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
    jobSurfaceReceipt: null,
    externalCertificationReceipt: certified,
  });
assert.equal(missingJobSurfaceReceipt.publicationBlocked, true);
assert.deepEqual(
  missingJobSurfaceReceipt.issues.map((item) => item.code),
  ['PREMIUM_JOB_START_SURFACE_RECEIPT_REQUIRED'],
);

const generatorSource = await readFile(
  new URL('../../api/_lib/generate-client-report-impl.js', import.meta.url),
  'utf8',
);
const generatorCertificationIndex = generatorSource.indexOf(
  'certifyPremiumAcquisitionUnderwritingV1External({',
);
const generatorStorageUploadIndex = generatorSource.indexOf(
  'supabase.storage',
  generatorCertificationIndex,
);
assert.ok(generatorCertificationIndex > 0);
assert.ok(generatorStorageUploadIndex > generatorCertificationIndex);

const workerSource = await readFile(
  new URL('../../api/admin-run-worker.js', import.meta.url),
  'utf8',
);
const workerResponseIndex = workerSource.indexOf(
  'reportData = await reportRes.json()',
);
const workerEnforcementIndex = workerSource.indexOf(
  'enforcePremiumAcquisitionUnderwritingV1WorkerPublication({',
  workerResponseIndex,
);
const workerPublicationIndex = workerSource.indexOf(
  'resolveOrCreateReportPublicationRecord({',
  workerResponseIndex,
);
assert.ok(workerResponseIndex > 0);
assert.ok(workerEnforcementIndex > workerResponseIndex);
assert.ok(workerPublicationIndex > workerEnforcementIndex);

console.log(
  'premium-acquisition-underwriting-v1 external-certification smoke passed',
);
