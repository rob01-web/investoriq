import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
} from './premium-acquisition-underwriting-v1-validated-model.js';
import {
  OBSERVER_SOURCE,
} from './premium-acquisition-underwriting-v1-quality-observer.js';
import {
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
} from './premium-acquisition-underwriting-v1-job-surface-authority.js';

const EXTERNAL_CERTIFIER_SOURCE =
  'premium_acquisition_underwriting_v1_external_certifier';
const EXTERNAL_CERTIFIER_VERSION = 1;
const EXTERNAL_CERTIFICATION_ARTIFACT_TYPE =
  'premium_acquisition_underwriting_v1_external_certification';
const EXTERNAL_ENFORCER_SOURCE =
  'premium_acquisition_underwriting_v1_worker_external_enforcer';
const EXTERNAL_PUBLICATION_TARGETS = new Set([
  'customer',
  'external_customer',
  'external_publication',
  'production',
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function issue(code, path, message, evidence = {}) {
  return {
    code,
    severity: 'critical',
    classification: 'external_premium_certification_failure',
    customerDocumentFailure: false,
    coreDeliveryBlocker: false,
    reportPublicationBlocker: true,
    path,
    message,
    evidence,
  };
}

function isExternalPremiumPromise(receipt) {
  return (
    isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(receipt) &&
    receipt.assignmentScope === 'external_job_start' &&
    receipt.premiumSurfaceAssigned === true &&
    receipt.externalPremiumPromiseEstablished === true &&
    receipt.premiumCertificationRequired === true &&
    receipt.reportSurfaceVersion ===
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION
  );
}

function certifyPremiumAcquisitionUnderwritingV1External({
  jobSurfaceReceipt = null,
  generationReceipt = null,
  premiumUnderwritingModel = null,
  qualityObservation = null,
  pdfPublicationQualityBoss = null,
} = {}) {
  if (
    jobSurfaceReceipt == null ||
    (
      isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
        jobSurfaceReceipt,
      ) &&
      !jobSurfaceReceipt.externalPremiumPromiseEstablished
    )
  ) {
    return deepFreeze({
      source: EXTERNAL_CERTIFIER_SOURCE,
      certifierVersion: EXTERNAL_CERTIFIER_VERSION,
      status: 'not_required',
      jobId: jobSurfaceReceipt?.jobId || null,
      reportSurfaceVersion: jobSurfaceReceipt?.reportSurfaceVersion || null,
      certificationRequired: false,
      externalPremiumCertified: false,
      externalPublicationAllowed: false,
      reportPublicationBlocker: false,
      customerDocumentFailure: false,
      issues: [],
    });
  }

  const issues = [];
  if (!isExternalPremiumPromise(jobSurfaceReceipt)) {
    issues.push(issue(
      'PREMIUM_EXTERNAL_JOB_SURFACE_PROMISE_INVALID',
      'jobSurfaceReceipt',
      'External premium certification requires the immutable canonical external job-start promise.',
    ));
  }

  const generationValid =
    generationReceipt?.source ===
      'premium_acquisition_underwriting_v1_external_generation_receipt' &&
    generationReceipt?.version === 1 &&
    generationReceipt?.jobId === jobSurfaceReceipt?.jobId &&
    generationReceipt?.reportSurfaceVersion ===
      jobSurfaceReceipt?.reportSurfaceVersion &&
    generationReceipt?.premiumSurfaceGenerated === true &&
    generationReceipt?.modelValidationOk === true;
  if (!generationValid) {
    issues.push(issue(
      'PREMIUM_EXTERNAL_GENERATION_RECEIPT_INVALID',
      'generationReceipt',
      'The promised premium surface requires a matching validated generation receipt.',
    ));
  }

  const modelValidation =
    validatePremiumAcquisitionUnderwritingV1ValidatedModel(
      premiumUnderwritingModel,
    );
  if (
    !modelValidation.ok ||
    premiumUnderwritingModel?.validation?.ok !== true
  ) {
    issues.push(issue(
      'PREMIUM_EXTERNAL_MODEL_NOT_VALIDATED',
      'premiumUnderwritingModel',
      'The promised premium surface requires a valid canonical premium model.',
      { validationStatus: modelValidation.status },
    ));
  }

  const observationValid =
    qualityObservation?.source === OBSERVER_SOURCE &&
    qualityObservation?.mode === 'observe_only' &&
    qualityObservation?.status === 'observed_complete' &&
    qualityObservation?.observedComplete === true &&
    qualityObservation?.activation?.requested === true &&
    qualityObservation?.activation?.reportSurfaceVersion ===
      jobSurfaceReceipt?.reportSurfaceVersion &&
    Array.isArray(qualityObservation?.issues) &&
    qualityObservation.issues.length === 0;
  if (!observationValid) {
    issues.push(issue(
      'PREMIUM_EXTERNAL_COMPLETENESS_NOT_OBSERVED',
      'qualityObservation',
      'The promised premium surface requires a complete rendered-surface observation.',
    ));
  }

  const publicationTarget = String(
    pdfPublicationQualityBoss?.publication_target || '',
  ).trim().toLowerCase();
  const pdfBossValid =
    pdfPublicationQualityBoss?.authority ===
      'final_pdf_publication_quality_boss' &&
    pdfPublicationQualityBoss?.ok === true &&
    pdfPublicationQualityBoss?.status === 'certified' &&
    pdfPublicationQualityBoss?.strict_institutional_certified === true &&
    pdfPublicationQualityBoss?.customer_delivery_allowed === true &&
    pdfPublicationQualityBoss?.external_publication_allowed === true &&
    pdfPublicationQualityBoss?.artifact_mode === 'production_pdf' &&
    EXTERNAL_PUBLICATION_TARGETS.has(publicationTarget) &&
    pdfPublicationQualityBoss?.constitution?.valid === true &&
    Number(pdfPublicationQualityBoss?.analysis?.page_count) > 1 &&
    pdfPublicationQualityBoss?.institutional_certification
      ?.every_page_receipt_present === true &&
    pdfPublicationQualityBoss?.institutional_certification
      ?.every_table_certified === true &&
    pdfPublicationQualityBoss?.institutional_certification
      ?.every_chart_certified === true &&
    pdfPublicationQualityBoss?.institutional_certification
      ?.every_number_certified === true &&
    Array.isArray(pdfPublicationQualityBoss?.blocking_issue_codes) &&
    pdfPublicationQualityBoss.blocking_issue_codes.length === 0 &&
    Array.isArray(pdfPublicationQualityBoss?.quality_incident_codes) &&
    pdfPublicationQualityBoss.quality_incident_codes.length === 0 &&
    Array.isArray(pdfPublicationQualityBoss?.issues) &&
    pdfPublicationQualityBoss.issues.length === 0;
  if (!pdfBossValid) {
    issues.push(issue(
      'PREMIUM_EXTERNAL_PDF_NOT_CERTIFIED',
      'pdfPublicationQualityBoss',
      'The promised premium surface requires a strict, issue-free production PDF Boss certification.',
      {
        status: pdfPublicationQualityBoss?.status || null,
        artifactMode: pdfPublicationQualityBoss?.artifact_mode || null,
        publicationTarget: publicationTarget || null,
      },
    ));
  }

  const externalPremiumCertified = issues.length === 0;
  return deepFreeze({
    source: EXTERNAL_CERTIFIER_SOURCE,
    certifierVersion: EXTERNAL_CERTIFIER_VERSION,
    status: externalPremiumCertified
      ? 'external_premium_certified'
      : 'external_premium_not_certified',
    jobId: jobSurfaceReceipt?.jobId || null,
    reportSurfaceVersion:
      jobSurfaceReceipt?.reportSurfaceVersion || null,
    certificationRequired: true,
    externalPremiumCertified,
    externalPublicationAllowed: externalPremiumCertified,
    coreDeliveryEligibilityChanged: false,
    reportPublicationBlocker: !externalPremiumCertified,
    customerDocumentFailure: false,
    authority: {
      premiumCertificationAuthority: true,
      sourceAuthority: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      manifestAuthority: false,
      workerAuthority: false,
      billingAuthority: false,
      remedyAuthority: false,
      externalEnforcementAuthority: false,
    },
    evidence: {
      generationReceiptSource: generationReceipt?.source || null,
      modelValidationStatus: modelValidation.status,
      qualityObservationStatus: qualityObservation?.status || null,
      pdfBossStatus: pdfPublicationQualityBoss?.status || null,
      pdfArtifactMode: pdfPublicationQualityBoss?.artifact_mode || null,
      pdfPublicationTarget: publicationTarget || null,
    },
    issues,
  });
}

function enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
  jobSurfaceReceipt = null,
  externalCertificationReceipt = null,
} = {}) {
  if (
    !isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
      jobSurfaceReceipt,
    )
  ) {
    return deepFreeze({
      source: EXTERNAL_ENFORCER_SOURCE,
      status: 'job_surface_receipt_invalid',
      jobId: jobSurfaceReceipt?.jobId || null,
      publicationBlocked: true,
      customerDocumentFailure: false,
      authority: { externalEnforcementAuthority: true },
      issues: [issue(
        'PREMIUM_JOB_START_SURFACE_RECEIPT_REQUIRED',
        'jobSurfaceReceipt',
        'Worker publication requires the immutable canonical job-start surface receipt.',
      )],
    });
  }
  if (!isExternalPremiumPromise(jobSurfaceReceipt)) {
    return deepFreeze({
      source: EXTERNAL_ENFORCER_SOURCE,
      status: 'not_required',
      jobId: jobSurfaceReceipt?.jobId || null,
      publicationBlocked: false,
      customerDocumentFailure: false,
      authority: { externalEnforcementAuthority: true },
      issues: [],
    });
  }

  const valid =
    externalCertificationReceipt?.source === EXTERNAL_CERTIFIER_SOURCE &&
    externalCertificationReceipt?.certifierVersion ===
      EXTERNAL_CERTIFIER_VERSION &&
    externalCertificationReceipt?.status ===
      'external_premium_certified' &&
    externalCertificationReceipt?.jobId === jobSurfaceReceipt.jobId &&
    externalCertificationReceipt?.reportSurfaceVersion ===
      jobSurfaceReceipt.reportSurfaceVersion &&
    externalCertificationReceipt?.certificationRequired === true &&
    externalCertificationReceipt?.externalPremiumCertified === true &&
    externalCertificationReceipt?.externalPublicationAllowed === true &&
    externalCertificationReceipt?.reportPublicationBlocker === false &&
    externalCertificationReceipt?.customerDocumentFailure === false &&
    externalCertificationReceipt?.authority
      ?.premiumCertificationAuthority === true &&
    Array.isArray(externalCertificationReceipt?.issues) &&
    externalCertificationReceipt.issues.length === 0;

  return deepFreeze({
    source: EXTERNAL_ENFORCER_SOURCE,
    status: valid
      ? 'external_premium_publication_authorized'
      : 'external_premium_publication_blocked',
    jobId: jobSurfaceReceipt.jobId,
    reportSurfaceVersion: jobSurfaceReceipt.reportSurfaceVersion,
    publicationBlocked: !valid,
    customerDocumentFailure: false,
    authority: { externalEnforcementAuthority: true },
    issues: valid
      ? []
      : [issue(
          'PREMIUM_EXTERNAL_CERTIFICATION_REQUIRED',
          'externalCertificationReceipt',
          'Worker publication is blocked because the promised premium surface lacks its matching external certification.',
        )],
  });
}

export {
  EXTERNAL_CERTIFICATION_ARTIFACT_TYPE,
  EXTERNAL_CERTIFIER_SOURCE,
  EXTERNAL_CERTIFIER_VERSION,
  certifyPremiumAcquisitionUnderwritingV1External,
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication,
};
