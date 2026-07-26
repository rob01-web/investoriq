import {
  buildCanonicalReportIdentityReceipt,
} from './report-identity-authority.js';
import {
  buildCanonicalInstitutionalUnderwritingScenarioPolicyContract,
} from './institutional-underwriting-scenario-policy-contract.js';
import {
  buildCanonicalInstitutionalUnderwritingInputContract,
} from './institutional-underwriting-input-contract.js';
import {
  buildDeterministicSourceCaseUnderwritingAnalysis,
} from './deterministic-source-case-underwriting-analysis.js';
import {
  buildDeterministicAcquisitionValuationAnalysis,
} from './deterministic-acquisition-valuation-analysis.js';
import {
  buildDeterministicAcquisitionCapitalStructureAnalysis,
} from './deterministic-acquisition-capital-structure-analysis.js';
import {
  buildPremiumAcquisitionUnderwritingV1ValidatedModel,
} from './premium-acquisition-underwriting-v1-validated-model.js';
import {
  isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt,
} from './premium-acquisition-underwriting-v1-job-surface-authority.js';

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function buildPremiumAcquisitionUnderwritingV1ExternalGeneration({
  jobSurfaceReceipt = null,
  sourceTruthPackage = null,
  financialIntelligence = null,
} = {}) {
  if (jobSurfaceReceipt == null) {
    return deepFreeze({
      enabled: false,
      status: 'base_surface_no_job_start_receipt',
      reportSurfaceVersion: null,
      premiumUnderwritingCapabilityEnabled: false,
      premiumUnderwritingModel: null,
      generationReceipt: null,
    });
  }
  if (
    !isCanonicalPremiumAcquisitionUnderwritingV1JobSurfaceReceipt(
      jobSurfaceReceipt,
    )
  ) {
    throw new Error('INVALID_PREMIUM_JOB_START_SURFACE_RECEIPT');
  }
  if (!jobSurfaceReceipt.premiumSurfaceAssigned) {
    return deepFreeze({
      enabled: false,
      status: 'base_surface_assigned',
      reportSurfaceVersion: jobSurfaceReceipt.reportSurfaceVersion,
      premiumUnderwritingCapabilityEnabled: false,
      premiumUnderwritingModel: null,
      generationReceipt: {
        jobId: jobSurfaceReceipt.jobId,
        reportSurfaceVersion: jobSurfaceReceipt.reportSurfaceVersion,
        premiumSurfaceGenerated: false,
      },
    });
  }
  if (
    jobSurfaceReceipt.assignmentScope !== 'external_job_start' ||
    jobSurfaceReceipt.externalPremiumPromiseEstablished !== true ||
    jobSurfaceReceipt.premiumCertificationRequired !== true
  ) {
    throw new Error('EXTERNAL_PREMIUM_JOB_START_PROMISE_REQUIRED');
  }

  try {
    const underwritingInputContract =
      buildCanonicalInstitutionalUnderwritingInputContract({
        sourceTruthPackage,
        financialIntelligence,
        scenarioPolicyContract:
          buildCanonicalInstitutionalUnderwritingScenarioPolicyContract(),
      });
    const premiumUnderwritingModel =
      buildPremiumAcquisitionUnderwritingV1ValidatedModel({
        sourceTruthPackage,
        reportIdentityReceipt: buildCanonicalReportIdentityReceipt({
          reportMode: 'v1_core',
          reportType: 'underwriting',
        }),
        financialIntelligence,
        underwritingInputContract,
        sourceCaseAnalysis: buildDeterministicSourceCaseUnderwritingAnalysis({
          underwritingInputContract,
        }),
        valuationAnalysis: buildDeterministicAcquisitionValuationAnalysis({
          underwritingInputContract,
        }),
        capitalStructureAnalysis:
          buildDeterministicAcquisitionCapitalStructureAnalysis({
            underwritingInputContract,
          }),
      });
    return deepFreeze({
      enabled: true,
      status: 'external_premium_model_validated',
      reportSurfaceVersion: jobSurfaceReceipt.reportSurfaceVersion,
      premiumUnderwritingCapabilityEnabled: true,
      premiumUnderwritingModel,
      generationReceipt: {
        source:
          'premium_acquisition_underwriting_v1_external_generation_receipt',
        version: 1,
        jobId: jobSurfaceReceipt.jobId,
        reportSurfaceVersion: jobSurfaceReceipt.reportSurfaceVersion,
        premiumSurfaceGenerated: true,
        modelValidationStatus: premiumUnderwritingModel.validation.status,
        modelValidationOk: premiumUnderwritingModel.validation.ok,
        deliveryAuthority: false,
        publicationAuthority: false,
        customerDocumentFailure: false,
      },
    });
  } catch (cause) {
    const error = new Error('PREMIUM_UNDERWRITING_EXTERNAL_GENERATION_FAILED');
    error.code = 'REPORT_RENDER_FAILED';
    error.context = {
      failure_class: 'internal_system_failure',
      customer_document_failure: false,
      job_id: jobSurfaceReceipt.jobId,
      report_surface_version: jobSurfaceReceipt.reportSurfaceVersion,
      cause: String(cause?.message || cause || ''),
    };
    throw error;
  }
}

export {
  buildPremiumAcquisitionUnderwritingV1ExternalGeneration,
};
