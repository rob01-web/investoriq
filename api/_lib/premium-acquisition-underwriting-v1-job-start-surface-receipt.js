import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  EXTERNAL_JOB_START_ASSIGNMENT_SCOPE,
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
} from './premium-acquisition-underwriting-v1-job-surface-authority.js';

// Historical constant remains exported for archived/test references only. No current
// launch path persists this artifact while Premium is constitutionally OFF.
const JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE =
  'premium_acquisition_underwriting_v1_job_start_surface_receipt';

function text(value) {
  return String(value ?? '').trim();
}

function timestamp(value) {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate))
    ? new Date(candidate).toISOString()
    : null;
}

function buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job = null,
  resolvedAt = null,
  existingReceipt = null,
} = {}) {
  if (existingReceipt != null) {
    const resolved = resolvePremiumAcquisitionUnderwritingV1JobSurface({
      jobId: job?.id || null,
      existingReceipt,
    });
    // A historical premium promise cannot reactivate Premium in the current launch.
    if (resolved?.premiumSurfaceAssigned === true || resolved?.externalPremiumPromiseEstablished === true) {
      throw new Error('PREMIUM_UNDERWRITING_DISABLED_BY_PRODUCT_CONSTITUTION');
    }
    return resolved;
  }

  if (!timestamp(job?.created_at)) {
    throw new Error('JOB_CREATED_AT_REQUIRED_FOR_REPORT_SURFACE_ASSIGNMENT');
  }

  const receipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: job?.id || null,
    reportType: text(job?.report_type).toLowerCase(),
    requestedSurfaceVersion: BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
    capabilityEnabled: false,
    resolvedAt,
    assignmentScope: EXTERNAL_JOB_START_ASSIGNMENT_SCOPE,
  });
  if (!receipt.valid || !isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(receipt)) {
    const error = new Error('BASE_UNDERWRITING_JOB_SURFACE_ASSIGNMENT_FAILED');
    error.context = { receipt };
    throw error;
  }
  return receipt;
}

async function resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job = null,
  resolvedAt = null,
} = {}) {
  // Premium OFF means no Premium artifact lookup, no Premium artifact write, no
  // certification promise, and no Premium publication/billing/remedy authority.
  return buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({ job, resolvedAt });
}

export {
  JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
  buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
};
