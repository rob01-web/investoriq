import assert from "node:assert/strict";
import fs from "node:fs";

import { ensureReportDownloadArtifact, runBoundedPdfCertificationRecovery } from "../../api/_lib/report-delivery-output.js";
import { isFinalPdfCustomerDeliveryAllowed } from "../../api/_lib/final-pdf-publication-quality-boss.js";
import {
  handlePublicationRetryRequiredHandoff,
  resolveStructuredFinancialWorkerGateDecision,
  resolveStructuredFinancialSourceGateDisposition,
} from "../../api/admin-run-worker.js";
import {
  createConstitutionalWorkerLifecycle,
  resolveConstitutionalTerminalFailureDisposition,
} from "../../api/_lib/worker-constitutional-lifecycle.js";

const queuedTransitionMigrationSource = fs.readFileSync(
  "supabase/migrations/20260814000100_transition_worker_job_release_queued_ownership.sql",
  "utf8"
);

function buildRenderError(message, status, attemptLabel) {
  const error = new Error(message);
  error.code = "PDF_ARTIFACT_FAILED";
  error.response = {
    status,
    data: { error: { code: "docraptor_render_failed", message } },
    headers: { "x-docraptor-request-id": `${attemptLabel}-request` },
  };
  error.context = {
    provider_diagnostics: {
      provider: "docraptor",
      attempt: attemptLabel,
      status,
      retryable: true,
    },
  };
  return error;
}

function makeStorageClient({ uploadError = null, verifyError = null } = {}) {
  const bucket = {
    download: async () => ({ error: { message: "missing" }, data: null }),
    upload: async () => (uploadError ? { error: uploadError } : { error: null }),
  };
  const storage = {
    from: () => bucket,
  };
  const reports = {
    delete: () => ({
      eq: async () => ({ error: null }),
    }),
  };
  return {
    storage,
    from: (table) => (table === "reports" ? reports : { delete: () => ({ eq: async () => ({ error: null }) }) }),
  };
}

const successfulCertification = {
  ok: true,
  status: "certified",
  customer_document_failure: false,
  issues: [],
};

const corePdfBuffer = Buffer.from("%PDF-1.4\ncore");
const commonArtifactArgs = {
  reportId: "recovery-smoke-report",
  storagePath: "user/recovery-smoke-report.pdf",
  finalHtml: "<html><body><h1>Recovery Smoke</h1></body></html>",
  emergencyCoreHtml: "<html><body><h1>Emergency Recovery Smoke</h1></body></html>",
  reportType: "underwriting",
  reportSeed: "recovery-smoke-report",
  propertyName: "Recovery Smoke",
  deliveryGateStatus: "deliverable",
  holdDelivery: false,
  corePublishable: true,
  createdReportRecord: false,
  renderPdfBuffer: async ({ renderAttempt }) => {
    if (renderAttempt === "initial") throw buildRenderError("timeout", 408, "initial");
    if (renderAttempt === "emergency_core") throw buildRenderError("rate limit", 429, "emergency_core");
    return Buffer.from("%PDF-1.4\nrecovery");
  },
  runFinalPdfPublicationQualityBoss: async () => successfulCertification,
};

const initialAndEmergencyFailure = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: makeStorageClient(),
});
assert.equal(initialAndEmergencyFailure.publicationState, "recovery_required");
assert.equal(initialAndEmergencyFailure.publicationRetryRequired, true);
assert.equal(initialAndEmergencyFailure.publicationRetryReason, "initial_emergency_core_render_failed");
assert.equal(initialAndEmergencyFailure.publicationRecoveryError?.context?.provider_diagnostics?.status, 429);

const timeoutFailure = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: makeStorageClient(),
  renderPdfBuffer: async ({ renderAttempt }) => {
    throw buildRenderError(`${renderAttempt} timeout`, 408, renderAttempt);
  },
});
assert.equal(timeoutFailure.publicationState, "recovery_required");
assert.equal(timeoutFailure.publicationRecoveryError?.context?.provider_diagnostics?.status, 408);

const provider429Failure = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: makeStorageClient(),
  renderPdfBuffer: async ({ renderAttempt }) => {
    throw buildRenderError(`${renderAttempt} rate limit`, 429, renderAttempt);
  },
});
assert.equal(provider429Failure.publicationState, "recovery_required");
assert.equal(provider429Failure.publicationRecoveryError?.context?.provider_diagnostics?.status, 429);

const provider5xxFailure = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: makeStorageClient(),
  renderPdfBuffer: async ({ renderAttempt }) => {
    throw buildRenderError(`${renderAttempt} provider failure`, 502, renderAttempt);
  },
});
assert.equal(provider5xxFailure.publicationState, "recovery_required");
assert.equal(provider5xxFailure.publicationRecoveryError?.context?.provider_diagnostics?.status, 502);

const missingStoragePath = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  storagePath: "",
  supabaseAdmin: makeStorageClient(),
});
assert.equal(missingStoragePath.publicationState, "recovery_required");
assert.equal(missingStoragePath.publicationRetryReason, "missing_valid_storage_path");

const missingStorageClient = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: {},
});
assert.equal(missingStorageClient.publicationState, "recovery_required");
assert.equal(missingStorageClient.publicationRetryReason, "missing_report_storage_client");

const missingFinalHtml = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  finalHtml: "   ",
  supabaseAdmin: makeStorageClient(),
});
assert.equal(missingFinalHtml.publicationState, "recovery_required");
assert.equal(missingFinalHtml.publicationRetryReason, "missing_final_html");

const pdfRecoveryFailure = await runBoundedPdfCertificationRecovery({
  initialPdfBuffer: corePdfBuffer,
  finalHtml: "<html><body><h1>Recovery</h1></body></html>",
  coreSafeHtml: "<html><body><h1>Core Safe</h1></body></html>",
  emergencyCoreHtml: "<html><body><h1>Emergency</h1></body></html>",
  corePublishable: true,
  renderPdfBuffer: async ({ renderAttempt }) => {
    if (renderAttempt === "core_safe" || renderAttempt === "emergency_core") {
      return Buffer.from(`%PDF-${renderAttempt}`);
    }
    return Buffer.from(`%PDF-${renderAttempt}`);
  },
  certifyPdf: async (_buffer, { approvedHtmlForCertification }) => {
    const error = new Error("Final PDF failed Publication Quality Boss certification");
    error.code = "PDF_ARTIFACT_FAILED";
    error.context = {
      final_pdf_publication_quality_boss: {
        ok: false,
        status: "internal_pdf_publication_quality_failure",
        customer_document_failure: false,
        issues: [{ code: approvedHtmlForCertification.includes("Emergency") ? "PDF_SPACING_OVERLAP" : "PDF_NUMERIC_COLUMN_MISALIGNMENT" }],
      },
    };
    throw error;
  },
  sectionDispositionReceipts: {
    core: { classification: "core_required" },
  },
});
assert.equal(pdfRecoveryFailure.publicationState !== "failed", true);

const storageFailure = await ensureReportDownloadArtifact({
  ...commonArtifactArgs,
  supabaseAdmin: makeStorageClient({ uploadError: new Error("storage unavailable") }),
  renderPdfBuffer: async () => Buffer.from("%PDF-1.4\nrendered"),
});
assert.equal(storageFailure.publicationState, "recovery_required");
assert.equal(storageFailure.publicationRetryReason, "storage_upload_failed");

const successfulHandoffEvents = [];
const successfulHandoff = await handlePublicationRetryRequiredHandoff({
  job: { id: "handoff-job", user_id: "handoff-user" },
  reportData: {
    publication_state: "recovery_required",
    publication_retry_reason: "missing_final_html",
    reportId: "handoff-report",
    storagePath: "handoff/report.pdf",
  },
  nowIso: "2026-08-12T14:03:00.000Z",
  transitionWorkerJob: async () => ({
    id: "handoff-job",
    status: "queued",
    worker_attempt_id: null,
    worker_claimed_by: null,
    worker_claimed_at: null,
    worker_last_heartbeat_at: null,
    worker_lease_expires_at: null,
  }),
  writeWorkerEventArtifact: async (_jobId, _userId, eventName, payload) => {
    successfulHandoffEvents.push({ eventName, payload });
    return null;
  },
});
assert.equal(successfulHandoff.success, true);
assert.equal(successfulHandoff.transitionedRow?.status, "queued");
assert.equal(successfulHandoff.transitionedRow?.worker_attempt_id, null);
assert.equal(successfulHandoff.transitionedRow?.worker_claimed_by, null);
assert.equal(successfulHandoff.transitionedRow?.worker_lease_expires_at, null);
assert.equal(successfulHandoffEvents[0]?.eventName, "report_publication_retry_required");

const failedHandoffEvents = [];
const failedHandoff = await handlePublicationRetryRequiredHandoff({
  job: { id: "handoff-job-failure", user_id: "handoff-user" },
  reportData: {
    publication_state: "recovery_required",
    publication_retry_reason: "missing_final_html",
    reportId: "handoff-report-failure",
    storagePath: "handoff/report-failure.pdf",
  },
  nowIso: "2026-08-12T14:04:00.000Z",
  transitionWorkerJob: async () => ({ id: "handoff-job-failure", status: "rendering" }),
  writeWorkerEventArtifact: async (_jobId, _userId, eventName, payload) => {
    failedHandoffEvents.push({ eventName, payload });
    return null;
  },
});
assert.equal(failedHandoff.success, false);
assert.equal(failedHandoff.transitionError instanceof Error, true);
assert.equal(failedHandoffEvents.some((entry) => entry.eventName === "report_publication_retry_required"), false);
assert.equal(failedHandoffEvents.some((entry) => entry.eventName === "report_publication_retry_handoff_failed"), false);

function claimQueuedJob(job, claimedBy, claimTimeIso) {
  if (!job || job.status !== "queued") {
    return null;
  }
  if (job.worker_attempt_id || job.worker_claimed_by) {
    return null;
  }
  if (job.worker_lease_expires_at && Date.parse(job.worker_lease_expires_at) > Date.parse(claimTimeIso)) {
    return null;
  }

  const attemptId = `${claimedBy}-fresh-attempt`;
  job.status = "extracting";
  job.worker_attempt_id = attemptId;
  job.worker_claimed_by = claimedBy;
  job.worker_claimed_at = claimTimeIso;
  job.worker_last_heartbeat_at = claimTimeIso;
  job.worker_lease_expires_at = new Date(Date.parse(claimTimeIso) + 30 * 60 * 1000).toISOString();
  return attemptId;
}

const publishableSourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  core_publishable: true,
  core_publication_constitution: {
    source: "core_publication_constitution",
    version: "core_publication_constitution_v2",
    core_publishable: true,
    truthful_minimum_core_report_constructible: true,
    minimum_truth_set: {
      satisfied: true,
      constructible: true,
      source_mode: "dual_source_core",
      t12: { satisfied: true },
      rent_roll: { satisfied: true },
    },
  },
};

const immediateRecoveryState = {
  id: "immediate-recovery-job",
  user_id: "immediate-user",
  status: "rendering",
  worker_attempt_id: "worker-a-attempt",
  worker_claimed_by: "worker-a",
  worker_claimed_at: "2026-08-12T14:06:00.000Z",
  worker_last_heartbeat_at: "2026-08-12T14:06:30.000Z",
  worker_lease_expires_at: "2026-08-12T14:35:00.000Z",
  started_at: "2026-08-12T14:06:00.000Z",
  error_code: "REPORT_RENDER_FAILED",
  error_message: "REPORT_RENDER_FAILED",
  failure_reason: "worker_timeout",
};

const immediateRecoveryHarness = createLifecycleHarness({
  sourceTruthPackage: publishableSourceTruthPackage,
  nowIso: "2026-08-12T14:06:45.000Z",
  transitionWorkerJob: async (job, fromStatus, toStatus, meta) => {
    assert.equal(job.id, immediateRecoveryState.id);
    assert.equal(fromStatus, "rendering");
    assert.equal(toStatus, "queued");
    assert.equal(meta?.recovery_context, "constitutional_terminal_failure_rejected");

    immediateRecoveryState.status = "queued";
    immediateRecoveryState.started_at = null;
    immediateRecoveryState.worker_attempt_id = null;
    immediateRecoveryState.worker_claimed_by = null;
    immediateRecoveryState.worker_claimed_at = null;
    immediateRecoveryState.worker_last_heartbeat_at = null;
    immediateRecoveryState.worker_lease_expires_at = null;
    immediateRecoveryState.error_code = null;
    immediateRecoveryState.error_message = null;
    immediateRecoveryState.failure_reason = null;

    return { ...immediateRecoveryState };
  },
});

const immediateRecoveryOutcome = await immediateRecoveryHarness.lifecycle.applyTerminalFailureOutcome(
  immediateRecoveryState,
  {
    fromStatus: "rendering",
    expectedCurrentStatus: "rendering",
    errorCode: "REPORT_RENDER_FAILED",
    errorMessage: "REPORT_RENDER_FAILED",
    restore: {
      enabled: true,
      reason: "report_render_failed",
      errorCode: "REPORT_RENDER_FAILED",
      strict: true,
    },
  }
);
assert.equal(immediateRecoveryOutcome.terminalApplied, false);
assert.equal(immediateRecoveryOutcome.recoveryRequired, true);
assert.equal(immediateRecoveryOutcome.recoveryPersisted, true);
assert.equal(immediateRecoveryOutcome.recoveryStatus, "queued");
assert.equal(immediateRecoveryState.status, "queued");
assert.equal(immediateRecoveryState.worker_attempt_id, null);
assert.equal(immediateRecoveryState.worker_claimed_by, null);
assert.equal(immediateRecoveryState.worker_lease_expires_at, null);

const freshClaimAttempt = claimQueuedJob(immediateRecoveryState, "worker-b", "2026-08-12T14:06:46.000Z");
assert.equal(typeof freshClaimAttempt, "string");
assert.equal(immediateRecoveryState.status, "extracting");
assert.equal(immediateRecoveryState.worker_claimed_by, "worker-b");
assert.equal(immediateRecoveryState.worker_attempt_id, freshClaimAttempt);
assert.equal(claimQueuedJob(immediateRecoveryState, "worker-a", "2026-08-12T14:06:47.000Z"), null);

const t12OnlySourceTruthPackage = {
  ...publishableSourceTruthPackage,
  core_publication_constitution: {
    ...publishableSourceTruthPackage.core_publication_constitution,
    minimum_truth_set: {
      satisfied: true,
      constructible: true,
      source_mode: "t12_minimum_core",
      t12: { satisfied: true },
      rent_roll: { satisfied: false },
    },
  },
};

const rentRollOnlySourceTruthPackage = {
  ...publishableSourceTruthPackage,
  core_publication_constitution: {
    ...publishableSourceTruthPackage.core_publication_constitution,
    minimum_truth_set: {
      satisfied: true,
      constructible: true,
      source_mode: "rent_roll_minimum_core",
      t12: { satisfied: false },
      rent_roll: { satisfied: true },
    },
  },
};

const insufficientSourceTruthPackage = {
  source: "canonical_source_truth_package",
  schema_version: 1,
  core_publishable: false,
  core_publication_constitution: {
    source: "core_publication_constitution",
    version: "core_publication_constitution_v2",
    core_publishable: false,
    truthful_minimum_core_report_constructible: false,
    minimum_truth_set: {
      satisfied: false,
      constructible: false,
      source_mode: "insufficient_core",
      t12: { satisfied: false },
      rent_roll: { satisfied: false },
    },
  },
};

function createLifecycleHarness({
  sourceTruthPackage = publishableSourceTruthPackage,
  loadLatestArtifactPayload = async () => sourceTruthPackage,
  rpcImpl = null,
  transitionWorkerJob = null,
  nowIso = "2026-08-12T14:05:00.000Z",
} = {}) {
  const rpcCalls = [];
  const eventCalls = [];
  const transitionCalls = [];
  const restoreCalls = [];
  const ownershipCalls = [];
  const staleCalls = [];
  const lifecycle = createConstitutionalWorkerLifecycle({
    supabaseAdmin: {
      rpc: async (name, args) => {
        rpcCalls.push({ name, args });
        if (typeof rpcImpl === "function") {
          return rpcImpl(name, args, rpcCalls);
        }
        if (name === "requeue_worker_job") {
          return {
            data: [
              {
                id: "requeued-job",
                status: "queued",
                worker_attempt_id: null,
                worker_claimed_by: null,
              },
            ],
            error: null,
          };
        }
        if (name === "fail_worker_job") {
          return {
            data: [
              {
                id: "failed-job",
                status: "failed",
                worker_attempt_id: "worker-attempt-1",
              },
            ],
            error: null,
          };
        }
        throw new Error(`Unexpected RPC: ${name}`);
      },
    },
    workerInvocationId: "worker-invocation-current",
    nowIso,
    loadLatestArtifactPayload,
    writeWorkerEventArtifact: async (_jobId, _userId, eventName, payload) => {
      eventCalls.push({ eventName, payload });
      return null;
    },
    writeStatusTransitionArtifact: async (...args) => {
      transitionCalls.push(args);
      return null;
    },
    restoreEntitlementForFailedJob: async (...args) => {
      restoreCalls.push(args);
      return { restored: true };
    },
    transitionWorkerJob,
    assertCurrentWorkerInvocationOwnership: async (...args) => {
      ownershipCalls.push(args);
    },
    writeStaleWorkerAttemptEvent: async (...args) => {
      staleCalls.push(args);
      return null;
    },
    makeStaleWorkerAttemptError: (details = "") => {
      const error = new Error("STALE_WORKER_ATTEMPT");
      error.code = "STALE_WORKER_ATTEMPT";
      error.details = details;
      return error;
    },
  });

  return {
    lifecycle,
    rpcCalls,
    eventCalls,
    transitionCalls,
    restoreCalls,
    ownershipCalls,
    staleCalls,
  };
}

const publishableDisposition = resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage: publishableSourceTruthPackage,
  proposedErrorCode: "WORKER_ERROR",
  proposedFailureClass: "retryable",
  stage: "rendering",
});
assert.equal(publishableDisposition.terminalFailurePermitted, false);
assert.equal(publishableDisposition.recoveryRequired, true);
assert.equal(publishableDisposition.sourceTruthState, "publishable");

const t12OnlyDisposition = resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage: t12OnlySourceTruthPackage,
  proposedErrorCode: "WORKER_ERROR",
  proposedFailureClass: "retryable",
  stage: "rendering",
});
assert.equal(t12OnlyDisposition.terminalFailurePermitted, false);
assert.equal(t12OnlyDisposition.recoveryRequired, true);
assert.equal(t12OnlyDisposition.sourceTruthState, "publishable");

const rentRollOnlyDisposition = resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage: rentRollOnlySourceTruthPackage,
  proposedErrorCode: "WORKER_ERROR",
  proposedFailureClass: "retryable",
  stage: "rendering",
});
assert.equal(rentRollOnlyDisposition.terminalFailurePermitted, false);
assert.equal(rentRollOnlyDisposition.recoveryRequired, true);

const t12OnlyWorkerGate = resolveStructuredFinancialWorkerGateDecision({
  hasRentRollParsed: false,
  hasT12Parsed: true,
  stage: "rendering",
});
assert.equal(t12OnlyWorkerGate.action, "continue");
assert.equal(t12OnlyWorkerGate.sourceMode, "t12_minimum_core");

const rentRollOnlyWorkerGate = resolveStructuredFinancialWorkerGateDecision({
  hasRentRollParsed: true,
  hasT12Parsed: false,
  stage: "rendering",
});
assert.equal(rentRollOnlyWorkerGate.action, "continue");
assert.equal(rentRollOnlyWorkerGate.sourceMode, "rent_roll_minimum_core");

const dualSourceWorkerGate = resolveStructuredFinancialWorkerGateDecision({
  hasRentRollParsed: true,
  hasT12Parsed: true,
  stage: "rendering",
});
assert.equal(dualSourceWorkerGate.action, "continue");
assert.equal(dualSourceWorkerGate.sourceMode, "dual_source_core");

const neitherSourceWorkerGate = resolveStructuredFinancialWorkerGateDecision({
  hasRentRollParsed: false,
  hasT12Parsed: false,
  sourceTruthPackage: insufficientSourceTruthPackage,
  stage: "rendering",
});
assert.equal(neitherSourceWorkerGate.action, "terminal");
assert.equal(neitherSourceWorkerGate.reasonCode, "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY");
assert.deepEqual(neitherSourceWorkerGate.missingCoreSources, ["rent_roll", "t12"]);

const t12GateDisposition = resolveStructuredFinancialSourceGateDisposition({
  hasRentRollParsed: false,
  hasT12Parsed: true,
});
assert.equal(t12GateDisposition.shouldContinue, true);
assert.equal(t12GateDisposition.sourceMode, "t12_minimum_core");

const rentRollGateDisposition = resolveStructuredFinancialSourceGateDisposition({
  hasRentRollParsed: true,
  hasT12Parsed: false,
});
assert.equal(rentRollGateDisposition.shouldContinue, true);
assert.equal(rentRollGateDisposition.sourceMode, "rent_roll_minimum_core");

const dualSourceGateDisposition = resolveStructuredFinancialSourceGateDisposition({
  hasRentRollParsed: true,
  hasT12Parsed: true,
});
assert.equal(dualSourceGateDisposition.shouldContinue, true);
assert.equal(dualSourceGateDisposition.sourceMode, "dual_source_core");

const bothInsufficientGateDisposition = resolveStructuredFinancialSourceGateDisposition({
  hasRentRollParsed: false,
  hasT12Parsed: false,
});
assert.equal(bothInsufficientGateDisposition.shouldContinue, false);
assert.equal(bothInsufficientGateDisposition.reasonCode, "both_insufficient_structured_sources");

const insufficientDisposition = resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage: insufficientSourceTruthPackage,
  proposedErrorCode: "WORKER_ERROR",
  proposedFailureClass: "retryable",
  stage: "rendering",
});
assert.equal(insufficientDisposition.terminalFailurePermitted, false);
assert.equal(insufficientDisposition.recoveryRequired, true);
assert.equal(insufficientDisposition.sourceTruthState, "insufficient");
assert.equal(insufficientDisposition.reasonCode, "terminal_reason_not_authorized");

const approvedInsufficientDisposition = resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage: insufficientSourceTruthPackage,
  proposedErrorCode: "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY",
  proposedFailureClass: "terminal",
  stage: "rendering",
});
assert.equal(approvedInsufficientDisposition.terminalFailurePermitted, true);
assert.equal(approvedInsufficientDisposition.recoveryRequired, false);
assert.equal(approvedInsufficientDisposition.sourceTruthState, "insufficient");

const publishableRecoveryHarness = createLifecycleHarness({
  sourceTruthPackage: publishableSourceTruthPackage,
});
const expiredRenderingRecovery = await publishableRecoveryHarness.lifecycle.recoverExpiredPublishableJob({
  job: {
    id: "expired-rendering-job",
    user_id: "user-1",
    status: "rendering",
    worker_attempt_id: "attempt-old",
    worker_claimed_by: "previous-worker",
    worker_lease_expires_at: "2026-08-12T13:59:00.000Z",
  },
  currentStatus: "rendering",
  retryReason: "worker_timeout",
  claimedBy: "admin-run-worker",
});
assert.equal(expiredRenderingRecovery.success, true);
assert.equal(expiredRenderingRecovery.queued, true);
assert.equal(expiredRenderingRecovery.queuedJob?.status, "queued");
assert.equal(expiredRenderingRecovery.recoveryPersisted, true);
assert.equal(expiredRenderingRecovery.recoveryStatus, "queued");
assert.equal(expiredRenderingRecovery.retryEventError, null);
assert.equal(publishableRecoveryHarness.rpcCalls[0]?.name, "requeue_worker_job");
assert.equal(publishableRecoveryHarness.rpcCalls[0]?.args?.p_claimed_by, "admin-run-worker");
assert.equal(publishableRecoveryHarness.rpcCalls[0]?.args?.p_allow_expired_lease_recovery, true);
assert.equal(
  publishableRecoveryHarness.eventCalls.some((entry) => entry.eventName === "report_publication_retry_required"),
  true
);
assert.equal(
  publishableRecoveryHarness.eventCalls.some((entry) => entry.eventName === "report_publication_retry_handoff_failed"),
  false
);
assert.equal(publishableRecoveryHarness.restoreCalls.length, 0);
assert.equal(
  publishableRecoveryHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"),
  false
);

const controlledExpiredRecovery = await publishableRecoveryHarness.lifecycle.recoverExpiredPublishableJob({
  job: {
    id: "controlled-expired-job",
    user_id: "user-1",
    status: "publishing",
    worker_attempt_id: "attempt-old-2",
    worker_claimed_by: "previous-worker",
    worker_lease_expires_at: "2026-08-12T13:57:30.000Z",
  },
  currentStatus: "publishing",
  retryReason: "worker_timeout",
  claimedBy: "admin-run-worker",
  recoveryContext: "controlled_fail_exact_expired_worker_job",
});
assert.equal(controlledExpiredRecovery.success, true);
assert.equal(controlledExpiredRecovery.queued, true);
assert.equal(controlledExpiredRecovery.recoveryPersisted, true);
assert.equal(controlledExpiredRecovery.recoveryStatus, "queued");
assert.equal(
  publishableRecoveryHarness.rpcCalls.filter((entry) => entry.name === "requeue_worker_job").length >= 2,
  true
);

const expiredPublishingRecovery = await publishableRecoveryHarness.lifecycle.recoverExpiredPublishableJob({
  job: {
    id: "expired-publishing-job",
    user_id: "user-1",
    status: "publishing",
    worker_attempt_id: "attempt-old",
    worker_claimed_by: "another-worker",
    worker_lease_expires_at: "2026-08-12T13:58:00.000Z",
  },
  currentStatus: "publishing",
  retryReason: "worker_timeout",
  claimedBy: "admin-run-worker",
});
assert.equal(expiredPublishingRecovery.success, true);
assert.equal(expiredPublishingRecovery.queued, true);
assert.equal(
  publishableRecoveryHarness.rpcCalls.filter((entry) => entry.name === "requeue_worker_job").length >= 2,
  true
);
assert.equal(
  publishableRecoveryHarness.rpcCalls.some((entry) => entry.name === "fail_expired_worker_job"),
  false
);

const failedRecoveryHarness = createLifecycleHarness({
  sourceTruthPackage: publishableSourceTruthPackage,
  rpcImpl: async (name) => {
    if (name === "requeue_worker_job") {
      return { data: null, error: new Error("rpc unavailable") };
    }
    throw new Error(`Unexpected RPC: ${name}`);
  },
});
const failedRecovery = await failedRecoveryHarness.lifecycle.recoverExpiredPublishableJob({
  job: {
    id: "expired-failing-job",
    user_id: "user-1",
    status: "rendering",
    worker_attempt_id: "attempt-old",
    worker_claimed_by: "previous-worker",
    worker_lease_expires_at: "2026-08-12T13:57:00.000Z",
  },
  currentStatus: "rendering",
  retryReason: "worker_timeout",
  claimedBy: "admin-run-worker",
});
assert.equal(failedRecovery.success, false);
assert.equal(failedRecovery.recoveryRequired, true);
assert.equal(failedRecovery.requeueError instanceof Error, true);
assert.equal(failedRecoveryHarness.restoreCalls.length, 0);
assert.equal(
  failedRecoveryHarness.eventCalls.some((entry) => entry.eventName === "report_publication_retry_handoff_failed"),
  true
);
assert.equal(
  failedRecoveryHarness.eventCalls.some((entry) => entry.eventName === "report_publication_retry_required"),
  false
);

const sufficientWorkerErrorHarness = createLifecycleHarness({
  sourceTruthPackage: publishableSourceTruthPackage,
});
const sufficientWorkerError = await sufficientWorkerErrorHarness.lifecycle.applyTerminalFailureOutcome({
  id: "sufficient-worker-error-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-current",
  worker_claimed_by: "worker-invocation-current",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "WORKER_ERROR",
  errorMessage: "Processing failed during rendering. Please log in to your InvestorIQ dashboard to review the job status.",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "WORKER_ERROR",
    strict: true,
  },
});
assert.equal(sufficientWorkerError.terminalApplied, false);
assert.equal(sufficientWorkerError.recoveryRequired, true);
assert.equal(sufficientWorkerErrorHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), false);
assert.equal(sufficientWorkerErrorHarness.restoreCalls.length, 0);
assert.equal(
  sufficientWorkerErrorHarness.eventCalls.some((entry) => entry.eventName === "constitutional_terminal_failure_rejected"),
  true
);

for (const errorCode of ["TIMEOUT", "REPORT_RENDER_FAILED", "PDF_ARTIFACT_FAILED", "REPORT_PUBLICATION_FAILED"]) {
  const harness = createLifecycleHarness({
    sourceTruthPackage: publishableSourceTruthPackage,
  });
  const outcome = await harness.lifecycle.applyTerminalFailureOutcome({
    id: `sufficient-${errorCode.toLowerCase()}-job`,
    user_id: "user-1",
    status: "rendering",
    worker_attempt_id: "attempt-current",
    worker_claimed_by: "worker-invocation-current",
  }, {
    fromStatus: "rendering",
    expectedCurrentStatus: "rendering",
    errorCode,
    errorMessage: errorCode,
    restore: {
      enabled: true,
      reason: `job_failed_rendering_${errorCode.toLowerCase()}`,
      errorCode,
      strict: true,
    },
  });
  assert.equal(outcome.terminalApplied, false, errorCode);
  assert.equal(harness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), false, errorCode);
  assert.equal(harness.restoreCalls.length, 0, errorCode);
}

const t12OnlyHarness = createLifecycleHarness({
  sourceTruthPackage: t12OnlySourceTruthPackage,
});
const t12OnlyOutcome = await t12OnlyHarness.lifecycle.applyTerminalFailureOutcome({
  id: "t12-only-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-current",
  worker_claimed_by: "worker-invocation-current",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "WORKER_ERROR",
  errorMessage: "WORKER_ERROR",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "WORKER_ERROR",
    strict: true,
  },
});
assert.equal(t12OnlyOutcome.terminalApplied, false);
assert.equal(t12OnlyHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), false);
assert.equal(t12OnlyOutcome.recoveryRequired, true);
assert.equal(t12OnlyOutcome.constitutionalDisposition.sourceTruthState, "publishable");

const rentRollOnlyHarness = createLifecycleHarness({
  sourceTruthPackage: rentRollOnlySourceTruthPackage,
});
const rentRollOnlyOutcome = await rentRollOnlyHarness.lifecycle.applyTerminalFailureOutcome({
  id: "rent-roll-only-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-current",
  worker_claimed_by: "worker-invocation-current",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "WORKER_ERROR",
  errorMessage: "WORKER_ERROR",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "WORKER_ERROR",
    strict: true,
  },
});
assert.equal(rentRollOnlyOutcome.terminalApplied, false);
assert.equal(rentRollOnlyHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), false);
assert.equal(rentRollOnlyOutcome.recoveryRequired, true);
assert.equal(rentRollOnlyOutcome.constitutionalDisposition.sourceTruthState, "publishable");

const insufficientHarness = createLifecycleHarness({
  sourceTruthPackage: insufficientSourceTruthPackage,
});
const insufficientOutcome = await insufficientHarness.lifecycle.applyTerminalFailureOutcome({
  id: "insufficient-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-current",
  worker_claimed_by: "worker-invocation-current",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY",
  errorMessage: "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY",
    strict: true,
  },
});
assert.equal(insufficientOutcome.terminalApplied, true);
assert.equal(insufficientOutcome.recoveryRequired, false);
assert.equal(insufficientHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), true);
assert.equal(insufficientHarness.restoreCalls.length, 1);
assert.equal(insufficientOutcome.constitutionalDisposition.reasonCode, "constitutionally_terminal_failure_permitted");

const lookupErrorHarness = createLifecycleHarness({
  sourceTruthPackage: null,
  loadLatestArtifactPayload: async () => {
    throw new Error("source truth lookup failed");
  },
});
const lookupErrorOutcome = await lookupErrorHarness.lifecycle.applyTerminalFailureOutcome({
  id: "lookup-error-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-current",
  worker_claimed_by: "worker-invocation-current",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "WORKER_ERROR",
  errorMessage: "WORKER_ERROR",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "WORKER_ERROR",
    strict: true,
  },
});
assert.equal(lookupErrorOutcome.terminalApplied, false);
assert.equal(lookupErrorOutcome.recoveryRequired, true);
assert.equal(lookupErrorOutcome.recoveryPersisted, false);
assert.equal(lookupErrorHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"), false);
assert.equal(lookupErrorHarness.restoreCalls.length, 0);
assert.equal(
  lookupErrorHarness.eventCalls.some((entry) => entry.eventName === "constitutional_terminal_failure_rejected"),
  true
);

const expiredTerminalRecoveryHarness = createLifecycleHarness({
  sourceTruthPackage: publishableSourceTruthPackage,
});
const expiredTerminalRecovery = await expiredTerminalRecoveryHarness.lifecycle.applyTerminalFailureOutcome({
  id: "expired-terminal-job",
  user_id: "user-1",
  status: "rendering",
  worker_attempt_id: "attempt-expired",
  worker_claimed_by: "previous-worker",
  worker_lease_expires_at: "2026-08-12T13:56:00.000Z",
}, {
  fromStatus: "rendering",
  expectedCurrentStatus: "rendering",
  errorCode: "WORKER_ERROR",
  errorMessage: "WORKER_ERROR",
  restore: {
    enabled: true,
    reason: "job_failed_rendering",
    errorCode: "WORKER_ERROR",
    strict: true,
  },
});
assert.equal(expiredTerminalRecovery.terminalApplied, false);
assert.equal(expiredTerminalRecovery.recoveryRequired, true);
assert.equal(expiredTerminalRecovery.recoveryPersisted, true);
assert.equal(expiredTerminalRecovery.recoveryStatus, "queued");
assert.equal(
  expiredTerminalRecoveryHarness.rpcCalls.some((entry) => entry.name === "requeue_worker_job"),
  true
);
assert.equal(
  expiredTerminalRecoveryHarness.rpcCalls.some((entry) => entry.name === "fail_worker_job"),
  false
);

assert.match(queuedTransitionMigrationSource, /create or replace function public\.transition_worker_job\(/);
assert.match(queuedTransitionMigrationSource, /started_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /worker_last_heartbeat_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /worker_lease_expires_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /worker_attempt_id = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /worker_claimed_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /worker_claimed_by = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /dead_lettered_at = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /error_code = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /error_message = case[\s\S]*when p_next_status = 'queued' then null/i);
assert.match(queuedTransitionMigrationSource, /failure_reason = case[\s\S]*when p_next_status = 'queued' then null/i);

const workerCallerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const callerGuardIdx = workerCallerSource.indexOf("if (failureOutcome?.terminalApplied === false)");
const callerFinalizeIdx = workerCallerSource.indexOf("finalizeAndPersistBlockedManifest({", callerGuardIdx);
assert.ok(callerGuardIdx > 0, "recordJobFailure caller must inspect terminalApplied");
assert.ok(callerFinalizeIdx > callerGuardIdx, "blocked-manifest bookkeeping must remain after the guard");

const generatorSource = fs.readFileSync("api/_lib/generate-client-report-impl.js", "utf8");
const workerSource = fs.readFileSync("api/admin-run-worker.js", "utf8");
const shouldRetryPublicationRecovery = (publicationState, publicationQualityBoss) =>
  publicationState === "recovery_required" &&
  !isFinalPdfCustomerDeliveryAllowed(publicationQualityBoss);

assert.equal(
  shouldRetryPublicationRecovery("recovery_required", {
    status: "publishable_with_quality_incident",
    customer_delivery_allowed: true,
    blocking_issue_codes: [],
    issues: [],
  }),
  false
);
assert.equal(
  shouldRetryPublicationRecovery("recovery_required", {
    status: "internal_pdf_publication_quality_failure",
    customer_delivery_allowed: false,
    blocking_issue_codes: ["PDF_PUBLICATION_QUALITY_UNCERTIFIED"],
    issues: [{ blocks_customer_delivery: true }],
  }),
  true
);
assert.match(generatorSource, /publication_state: "recovery_required"/);
assert.match(generatorSource, /report_record_creation_failed/);
assert.match(generatorSource, /const boundedRecoveryRequiresRetry =[\s\S]*!isFinalPdfCustomerDeliveryAllowed\(finalPdfPublicationQualityBossResult\)/);
assert.match(workerSource, /recoverExpiredPublishableJob\(\{\s*job: controlJob/);
assert.match(workerSource, /recoverExpiredPublishableJob\(\{\s*job,\s*currentStatus: job\.status/);
const renderingSourceTruthLoadIdx = workerSource.indexOf("const sourceTruthPackage = await loadLatestArtifactPayload(job.id, 'source_truth_package');");
const renderingGateCallIdx = workerSource.indexOf("resolveStructuredFinancialWorkerGateDecision({", renderingSourceTruthLoadIdx);
assert.ok(renderingSourceTruthLoadIdx > -1, "rendering gate must load source_truth_package");
assert.ok(renderingGateCallIdx > renderingSourceTruthLoadIdx, "rendering gate must load source_truth_package before worker decision");
assert.equal(/transitionWorkerJob\(controlJob,\s*currentStatus,\s*'queued'/.test(workerSource), false);
assert.equal(/transitionWorkerJob\(job,\s*job\.status,\s*'queued'/.test(workerSource), false);
assert.match(workerSource, /publication_retry_required/);
assert.match(workerSource, /transitionWorkerJob\(job, 'rendering', 'queued'/);
assert.equal(/finalPdfPublicationContract/.test(workerSource), false);

console.log("Core publication recovery smoke PASS");
