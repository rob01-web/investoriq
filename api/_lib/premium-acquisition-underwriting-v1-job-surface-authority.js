import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from './premium-acquisition-underwriting-v1-model.js';

const JOB_SURFACE_AUTHORITY_SOURCE =
  'premium_acquisition_underwriting_v1_job_surface_authority';
const JOB_SURFACE_AUTHORITY_VERSION = 1;
const INTERNAL_ASSIGNMENT_SCOPE = 'internal_test_only';

const KNOWN_SURFACE_VERSIONS = new Set([
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
]);

function text(value) {
  return String(value ?? '').trim();
}

function explicitCapabilityEnabled(value) {
  if (value === true) return true;
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function isIsoTimestamp(value) {
  const candidate = text(value);
  if (!candidate || !/^\d{4}-\d{2}-\d{2}T/.test(candidate)) return false;
  return Number.isFinite(Date.parse(candidate));
}

function isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
  receipt,
) {
  if (!receipt || typeof receipt !== 'object') return false;
  if (
    receipt.source !== JOB_SURFACE_AUTHORITY_SOURCE ||
    receipt.authorityVersion !== JOB_SURFACE_AUTHORITY_VERSION ||
    receipt.valid !== true ||
    !Array.isArray(receipt.issues) ||
    receipt.issues.length !== 0 ||
    receipt.immutable !== true ||
    !text(receipt.jobId) ||
    !isIsoTimestamp(receipt.resolvedAt) ||
    !KNOWN_SURFACE_VERSIONS.has(receipt.reportSurfaceVersion) ||
    receipt.assignmentScope !== INTERNAL_ASSIGNMENT_SCOPE ||
    receipt.authority?.reportSurfaceVersionAuthority !== true
  ) {
    return false;
  }
  for (const authorityKey of [
    'sourceAuthority',
    'deliveryAuthority',
    'publicationAuthority',
    'manifestAuthority',
    'workerAuthority',
    'billingAuthority',
    'remedyAuthority',
    'externalEnforcementAuthority',
  ]) {
    if (receipt.authority?.[authorityKey] !== false) return false;
  }
  const premiumAssigned =
    receipt.reportSurfaceVersion ===
    PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION;
  if (receipt.premiumSurfaceAssigned !== premiumAssigned) return false;
  if (
    premiumAssigned &&
    (
      receipt.capabilityEnabledAtResolution !== true ||
      receipt.reportType !== 'underwriting' ||
      receipt.status !== 'premium_surface_assigned_internal_test'
    )
  ) {
    return false;
  }
  if (
    !premiumAssigned &&
    receipt.reportSurfaceVersion !==
      BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION
  ) {
    return false;
  }
  return true;
}

function resolvePremiumAcquisitionUnderwritingV1JobSurface({
  jobId = null,
  reportType = null,
  requestedSurfaceVersion = null,
  capabilityEnabled = false,
  resolvedAt = null,
  existingReceipt = null,
} = {}) {
  const normalizedJobId = text(jobId);
  if (existingReceipt != null) {
    if (
      !isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
        existingReceipt,
      )
    ) {
      throw new Error('INVALID_EXISTING_JOB_REPORT_SURFACE_VERSION_RECEIPT');
    }
    if (normalizedJobId && normalizedJobId !== existingReceipt.jobId) {
      throw new Error('JOB_REPORT_SURFACE_VERSION_RECEIPT_JOB_MISMATCH');
    }
    return deepFreeze(structuredClone(existingReceipt));
  }

  const normalizedReportType = text(reportType).toLowerCase();
  const requested = text(requestedSurfaceVersion) ||
    BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION;
  const capability = explicitCapabilityEnabled(capabilityEnabled);
  const issues = [];
  if (!normalizedJobId) issues.push('JOB_ID_REQUIRED');
  if (!isIsoTimestamp(resolvedAt)) issues.push('JOB_START_TIMESTAMP_REQUIRED');
  if (!['underwriting', 'screening'].includes(normalizedReportType)) {
    issues.push('SUPPORTED_REPORT_TYPE_REQUIRED');
  }
  if (!KNOWN_SURFACE_VERSIONS.has(requested)) {
    issues.push('UNKNOWN_REPORT_SURFACE_VERSION');
  }

  const premiumRequested =
    requested === PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION;
  if (premiumRequested && normalizedReportType !== 'underwriting') {
    issues.push('PREMIUM_SURFACE_REQUIRES_UNDERWRITING_REPORT');
  }
  if (premiumRequested && !capability) {
    issues.push('PREMIUM_CAPABILITY_DISABLED');
  }

  const premiumSurfaceAssigned =
    issues.length === 0 &&
    premiumRequested &&
    capability &&
    normalizedReportType === 'underwriting';
  const reportSurfaceVersion = premiumSurfaceAssigned
    ? PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION
    : BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION;

  let status = 'base_surface_assigned';
  if (premiumSurfaceAssigned) status = 'premium_surface_assigned_internal_test';
  else if (issues.length > 0) status = 'surface_assignment_rejected_fail_closed';

  return deepFreeze({
    source: JOB_SURFACE_AUTHORITY_SOURCE,
    authorityVersion: JOB_SURFACE_AUTHORITY_VERSION,
    jobId: normalizedJobId || null,
    reportType: normalizedReportType || null,
    requestedSurfaceVersion: requested,
    reportSurfaceVersion,
    capabilityFlag: PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
    capabilityEnabledAtResolution: capability,
    premiumSurfaceRequested: premiumRequested,
    premiumSurfaceAssigned,
    assignmentScope: INTERNAL_ASSIGNMENT_SCOPE,
    status,
    valid: issues.length === 0,
    immutable: true,
    resolvedAt: isIsoTimestamp(resolvedAt) ? text(resolvedAt) : null,
    externalPremiumPromiseEstablished: false,
    externalPublicationAllowed: false,
    coreDeliveryEligibilityChanged: false,
    reportPublicationBlocker: false,
    customerDocumentFailure: false,
    authority: {
      reportSurfaceVersionAuthority: true,
      sourceAuthority: false,
      deliveryAuthority: false,
      publicationAuthority: false,
      manifestAuthority: false,
      workerAuthority: false,
      billingAuthority: false,
      remedyAuthority: false,
      externalEnforcementAuthority: false,
    },
    issues: issues.map((code) => ({
      code,
      severity: 'critical',
      classification: 'internal_job_surface_assignment_failure',
      customerDocumentFailure: false,
    })),
  });
}

const PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT =
  deepFreeze({
    source: JOB_SURFACE_AUTHORITY_SOURCE,
    authorityVersion: JOB_SURFACE_AUTHORITY_VERSION,
    defaultSurfaceVersion:
      BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
    premiumSurfaceVersion:
      PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
    capabilityFlag: PREMIUM_ACQUISITION_UNDERWRITING_V1_CAPABILITY_FLAG,
    assignmentScope: INTERNAL_ASSIGNMENT_SCOPE,
    immutable: true,
    externalPremiumPromiseEstablished: false,
    externalPublicationAllowed: false,
    deliveryAuthority: false,
    publicationAuthority: false,
    manifestAuthority: false,
    workerAuthority: false,
    billingAuthority: false,
    remedyAuthority: false,
    externalEnforcementAuthority: false,
  });

export {
  INTERNAL_ASSIGNMENT_SCOPE,
  JOB_SURFACE_AUTHORITY_SOURCE,
  JOB_SURFACE_AUTHORITY_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_JOB_SURFACE_AUTHORITY_CONTRACT,
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
};
