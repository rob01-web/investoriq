import {
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  validatePremiumAcquisitionUnderwritingV1ValidatedModel,
} from './premium-acquisition-underwriting-v1-validated-model.js';
import {
  OBSERVER_SOURCE,
} from './premium-acquisition-underwriting-v1-quality-observer.js';

const INTERNAL_CERTIFIER_SOURCE =
  'premium_acquisition_underwriting_v1_internal_certifier';
const INTERNAL_CERTIFIER_VERSION = 1;
const INTERNAL_CERTIFICATION_STAGE = 'internal_test_required';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function certificationIssue(code, path, message, evidence = {}) {
  return {
    code,
    severity: 'critical',
    classification: 'internal_premium_certification_failure',
    customerDocumentFailure: false,
    coreDeliveryBlocker: false,
    reportPublicationBlocker: false,
    path,
    message,
    evidence,
  };
}

function certifyPremiumAcquisitionUnderwritingV1InternalTest({
  premiumUnderwritingModel = null,
  qualityObservation = null,
  pdfPublicationQualityBoss = null,
} = {}) {
  const issues = [];
  const validation = validatePremiumAcquisitionUnderwritingV1ValidatedModel(
    premiumUnderwritingModel,
  );
  if (!validation.ok || premiumUnderwritingModel?.validation?.ok !== true) {
    issues.push(certificationIssue(
      'PREMIUM_INTERNAL_MODEL_NOT_VALIDATED',
      'premiumUnderwritingModel',
      'Internal premium certification requires a valid canonical premium expansion model.',
      { validationStatus: validation.status },
    ));
  }

  const observationValid =
    qualityObservation?.source === OBSERVER_SOURCE &&
    qualityObservation?.mode === 'observe_only' &&
    qualityObservation?.status === 'observed_complete' &&
    qualityObservation?.observedComplete === true &&
    qualityObservation?.premiumCertified === false &&
    qualityObservation?.deliveryAuthority === false &&
    qualityObservation?.publicationAuthority === false &&
    qualityObservation?.activation?.requested === true &&
    qualityObservation?.activation?.reportSurfaceVersion ===
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION &&
    Array.isArray(qualityObservation?.issues) &&
    qualityObservation.issues.length === 0;
  if (!observationValid) {
    issues.push(certificationIssue(
      'PREMIUM_INTERNAL_COMPLETENESS_NOT_OBSERVED',
      'qualityObservation',
      'Internal premium certification requires a complete observe-only premium quality receipt.',
      {
        source: qualityObservation?.source || null,
        status: qualityObservation?.status || null,
        issueCount: Array.isArray(qualityObservation?.issues)
          ? qualityObservation.issues.length
          : null,
      },
    ));
  }

  const pdfBossValid =
    pdfPublicationQualityBoss?.authority === 'final_pdf_publication_quality_boss' &&
    pdfPublicationQualityBoss?.ok === true &&
    pdfPublicationQualityBoss?.status === 'certified' &&
    pdfPublicationQualityBoss?.strict_institutional_certified === true &&
    pdfPublicationQualityBoss?.artifact_mode === 'production_pdf' &&
    pdfPublicationQualityBoss?.publication_target === 'internal_test' &&
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
    issues.push(certificationIssue(
      'PREMIUM_INTERNAL_PDF_NOT_CERTIFIED',
      'pdfPublicationQualityBoss',
      'Internal premium certification requires a strict, issue-free internal-test PDF Boss receipt.',
      {
        authority: pdfPublicationQualityBoss?.authority || null,
        status: pdfPublicationQualityBoss?.status || null,
        publicationTarget: pdfPublicationQualityBoss?.publication_target || null,
        blockingIssueCount: Array.isArray(
          pdfPublicationQualityBoss?.blocking_issue_codes,
        )
          ? pdfPublicationQualityBoss.blocking_issue_codes.length
          : null,
        qualityIncidentCount: Array.isArray(
          pdfPublicationQualityBoss?.quality_incident_codes,
        )
          ? pdfPublicationQualityBoss.quality_incident_codes.length
          : null,
      },
    ));
  }

  const internalTestCertified = issues.length === 0;
  return deepFreeze({
    source: INTERNAL_CERTIFIER_SOURCE,
    certifierVersion: INTERNAL_CERTIFIER_VERSION,
    certificationStage: INTERNAL_CERTIFICATION_STAGE,
    status: internalTestCertified
      ? 'internal_test_certified'
      : 'internal_test_not_certified',
    jobId: premiumUnderwritingModel?.jobId || null,
    reportSurfaceVersion: PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    internalTestCertified,
    premiumUnderwritingCertified: false,
    externalPremiumCertified: false,
    externalPublicationAllowed: false,
    coreDeliveryEligibilityChanged: false,
    reportPublicationBlocker: false,
    customerDocumentFailure: false,
    authority: {
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
      validatedModel: {
        source: premiumUnderwritingModel?.source || null,
        modelVersion: premiumUnderwritingModel?.modelVersion || null,
        validationStatus: validation.status,
        eligibleSectionCount: validation.eligibleSectionCount ?? null,
      },
      qualityObservation: {
        source: qualityObservation?.source || null,
        observerVersion: qualityObservation?.observerVersion ?? null,
        status: qualityObservation?.status || null,
        issueCount: Array.isArray(qualityObservation?.issues)
          ? qualityObservation.issues.length
          : null,
      },
      pdfPublicationQualityBoss: {
        version: pdfPublicationQualityBoss?.version || null,
        authority: pdfPublicationQualityBoss?.authority || null,
        status: pdfPublicationQualityBoss?.status || null,
        publicationTarget:
          pdfPublicationQualityBoss?.publication_target || null,
        pageCount: pdfPublicationQualityBoss?.analysis?.page_count ?? null,
      },
    },
    issues,
  });
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT =
  deepFreeze({
    source: INTERNAL_CERTIFIER_SOURCE,
    certifierVersion: INTERNAL_CERTIFIER_VERSION,
    certificationStage: INTERNAL_CERTIFICATION_STAGE,
    internalTestOnly: true,
    premiumUnderwritingCertified: false,
    externalPremiumCertified: false,
    externalPublicationAllowed: false,
    coreDeliveryEligibilityChanged: false,
    reportPublicationBlocker: false,
    deliveryAuthority: false,
    publicationAuthority: false,
    manifestAuthority: false,
    workerAuthority: false,
    billingAuthority: false,
    remedyAuthority: false,
    externalEnforcementAuthority: false,
  });

export {
  INTERNAL_CERTIFICATION_STAGE,
  INTERNAL_CERTIFIER_SOURCE,
  INTERNAL_CERTIFIER_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_INTERNAL_CERTIFICATION_CONTRACT,
  certifyPremiumAcquisitionUnderwritingV1InternalTest,
};
