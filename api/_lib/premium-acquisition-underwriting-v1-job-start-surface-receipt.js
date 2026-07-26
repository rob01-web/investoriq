import {
  BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION,
  PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION,
} from './premium-acquisition-underwriting-v1-model.js';
import {
  EXTERNAL_JOB_START_ASSIGNMENT_SCOPE,
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
  resolvePremiumAcquisitionUnderwritingV1JobSurface,
} from './premium-acquisition-underwriting-v1-job-surface-authority.js';

const JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE =
  'premium_acquisition_underwriting_v1_job_start_surface_receipt';

function text(value) {
  return String(value ?? '').trim();
}

function explicitCapabilityEnabled(value) {
  if (value === true) return true;
  return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

function timestamp(value) {
  const candidate = text(value);
  return candidate && Number.isFinite(Date.parse(candidate))
    ? new Date(candidate).toISOString()
    : null;
}

function buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  job = null,
  capabilityEnabled = false,
  activationStartedAt = null,
  resolvedAt = null,
  existingReceipt = null,
} = {}) {
  if (existingReceipt != null) {
    return resolvePremiumAcquisitionUnderwritingV1JobSurface({
      jobId: job?.id || null,
      existingReceipt,
    });
  }

  const jobCreatedAt = timestamp(job?.created_at);
  const activationAt = timestamp(activationStartedAt);
  const capability = explicitCapabilityEnabled(capabilityEnabled);
  const normalizedReportType = text(job?.report_type).toLowerCase();
  const premiumEligibleByTime =
    capability &&
    activationAt &&
    jobCreatedAt &&
    Date.parse(jobCreatedAt) >= Date.parse(activationAt);
  const requestedSurfaceVersion =
    normalizedReportType === 'underwriting' && premiumEligibleByTime
      ? PREMIUM_ACQUISITION_UNDERWRITING_V1_SURFACE_VERSION
      : BASE_ACQUISITION_UNDERWRITING_SURFACE_VERSION;

  if (capability && !activationAt) {
    throw new Error(
      'PREMIUM_UNDERWRITING_ACTIVATION_TIMESTAMP_REQUIRED_WHEN_CAPABILITY_ENABLED',
    );
  }
  if (!jobCreatedAt) {
    throw new Error('JOB_CREATED_AT_REQUIRED_FOR_REPORT_SURFACE_ASSIGNMENT');
  }

  const receipt = resolvePremiumAcquisitionUnderwritingV1JobSurface({
    jobId: job?.id || null,
    reportType: normalizedReportType,
    requestedSurfaceVersion,
    capabilityEnabled: capability,
    resolvedAt,
    assignmentScope: EXTERNAL_JOB_START_ASSIGNMENT_SCOPE,
  });
  if (
    !receipt.valid ||
    !isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(receipt)
  ) {
    const error = new Error(
      'PREMIUM_UNDERWRITING_JOB_START_SURFACE_ASSIGNMENT_FAILED',
    );
    error.context = { receipt };
    throw error;
  }
  return receipt;
}

async function resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
  supabaseAdmin = null,
  job = null,
  capabilityEnabled = false,
  activationStartedAt = null,
  resolvedAt = null,
} = {}) {
  if (!supabaseAdmin?.from) {
    throw new Error('SUPABASE_ADMIN_REQUIRED_FOR_JOB_START_SURFACE_RECEIPT');
  }
  const { data: existingRows, error: loadError } = await supabaseAdmin
    .from('analysis_artifacts')
    .select('payload')
    .eq('job_id', job?.id || '')
    .eq('type', JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE)
    .order('created_at', { ascending: true })
    .limit(2);
  if (loadError) throw loadError;
  if (Array.isArray(existingRows) && existingRows.length > 1) {
    throw new Error('MULTIPLE_JOB_START_SURFACE_RECEIPTS_DETECTED');
  }
  const existingReceipt = existingRows?.[0]?.payload || null;
  if (existingReceipt) {
    return buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
      job,
      existingReceipt,
    });
  }

  const receipt =
    buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
      job,
      capabilityEnabled,
      activationStartedAt,
      resolvedAt,
    });
  const safeResolvedAt = receipt.resolvedAt.replace(/:/g, '-');
  const { error: insertError } = await supabaseAdmin
    .from('analysis_artifacts')
    .insert([{
      job_id: receipt.jobId,
      user_id: job?.user_id || null,
      type: JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
      bucket: 'internal',
      object_path:
        `analysis_jobs/${receipt.jobId}/${JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE}/${safeResolvedAt}.json`,
      payload: receipt,
    }]);
  if (insertError) throw insertError;
  return receipt;
}

export {
  JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
  buildPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
};
