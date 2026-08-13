import { classifyTerminalFailureCode } from '../../lib/terminal-failure-taxonomy.js';

const SOURCE_TRUTH_MARKER = 'canonical_source_truth_package';
const CONSTITUTIONAL_TERMINAL_CORE_INSUFFICIENCY_CODES = new Set([
  'CORE_T12_CATASTROPHICALLY_UNUSABLE',
  'CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE',
  'CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY',
]);

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isCanonicalSourceTruthPackage(sourceTruthPackage) {
  return Boolean(
    sourceTruthPackage &&
    typeof sourceTruthPackage === 'object' &&
    sourceTruthPackage.source === SOURCE_TRUTH_MARKER
  );
}

function hasTruthfulMinimumCoreBasis(sourceTruthPackage) {
  const constitution = sourceTruthPackage?.core_publication_constitution || null;
  if (!constitution || typeof constitution !== 'object') {
    return false;
  }

  const minimumTruthSet = constitution.minimum_truth_set || null;
  return Boolean(
    constitution.truthful_minimum_core_report_constructible === true ||
    minimumTruthSet?.satisfied === true ||
    minimumTruthSet?.t12?.satisfied === true ||
    minimumTruthSet?.rent_roll?.satisfied === true
  );
}

function isConstitutionallyApprovedCoreInsufficiencyCode(code = '') {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return false;
  const classification = classifyTerminalFailureCode(normalized);
  return classification.customer_document_replacement_required === true &&
    CONSTITUTIONAL_TERMINAL_CORE_INSUFFICIENCY_CODES.has(normalized);
}

export function resolveConstitutionalTerminalFailureDisposition({
  sourceTruthPackage = null,
  sourceTruthLookupState = 'available',
  sourceTruthLookupError = null,
  proposedErrorCode = null,
  proposedFailureClass = null,
  stage = null,
} = {}) {
  const lookupState = normalizeText(sourceTruthLookupState);
  const sourceTruthAvailable = isCanonicalSourceTruthPackage(sourceTruthPackage);
  const constitution = sourceTruthPackage?.core_publication_constitution || null;
  const constitutionalPublishable = constitution?.core_publishable === true;
  const sourceTruthPublishable = sourceTruthPackage?.core_publishable === true;
  const truthfulMinimumCoreSupported = hasTruthfulMinimumCoreBasis(sourceTruthPackage);
  const terminalCoreInsufficiencyApproved = isConstitutionallyApprovedCoreInsufficiencyCode(proposedErrorCode);

  if (lookupState === 'error' || sourceTruthLookupError) {
    return {
      disposition: 'recovery_required',
      terminalFailurePermitted: false,
      recoveryRequired: true,
      sourceTruthState: 'error',
      sourceTruthLookupError: String(sourceTruthLookupError?.message || sourceTruthLookupError || 'source_truth_lookup_error'),
      sourceTruthPackageValid: sourceTruthAvailable,
      constitutionalPublishable,
      sourceTruthPublishable,
      truthfulMinimumCoreSupported,
      terminalCoreInsufficiencyApproved,
      reasonCode: 'source_truth_lookup_error',
      stage: stage || null,
      proposedErrorCode: proposedErrorCode || null,
      proposedFailureClass: proposedFailureClass || null,
    };
  }

  if (!sourceTruthAvailable) {
    return {
      disposition: 'recovery_required',
      terminalFailurePermitted: false,
      recoveryRequired: true,
      sourceTruthState: 'missing',
      sourceTruthLookupError: null,
      sourceTruthPackageValid: false,
      constitutionalPublishable,
      sourceTruthPublishable,
      truthfulMinimumCoreSupported: false,
      terminalCoreInsufficiencyApproved,
      reasonCode: 'source_truth_missing',
      stage: stage || null,
      proposedErrorCode: proposedErrorCode || null,
      proposedFailureClass: proposedFailureClass || null,
    };
  }

  if (constitutionalPublishable || sourceTruthPublishable || truthfulMinimumCoreSupported) {
    return {
      disposition: 'recovery_required',
      terminalFailurePermitted: false,
      recoveryRequired: true,
      sourceTruthState: 'publishable',
      sourceTruthLookupError: null,
      sourceTruthPackageValid: true,
      constitutionalPublishable,
      sourceTruthPublishable,
      truthfulMinimumCoreSupported,
      terminalCoreInsufficiencyApproved,
      reasonCode: 'truthful_minimum_core_report_constructible',
      stage: stage || null,
      proposedErrorCode: proposedErrorCode || null,
      proposedFailureClass: proposedFailureClass || null,
    };
  }

  if (!terminalCoreInsufficiencyApproved) {
    return {
      disposition: 'recovery_required',
      terminalFailurePermitted: false,
      recoveryRequired: true,
      sourceTruthState: 'insufficient',
      sourceTruthLookupError: null,
      sourceTruthPackageValid: true,
      constitutionalPublishable: false,
      sourceTruthPublishable: false,
      truthfulMinimumCoreSupported: false,
      terminalCoreInsufficiencyApproved,
      reasonCode: 'terminal_reason_not_authorized',
      stage: stage || null,
      proposedErrorCode: proposedErrorCode || null,
      proposedFailureClass: proposedFailureClass || null,
    };
  }

  return {
    disposition: 'terminal_failure_permitted',
    terminalFailurePermitted: true,
    recoveryRequired: false,
    sourceTruthState: 'insufficient',
    sourceTruthLookupError: null,
    sourceTruthPackageValid: true,
    constitutionalPublishable: false,
    sourceTruthPublishable: false,
    truthfulMinimumCoreSupported: false,
    terminalCoreInsufficiencyApproved,
    reasonCode: 'constitutionally_terminal_failure_permitted',
    stage: stage || null,
    proposedErrorCode: proposedErrorCode || null,
    proposedFailureClass: proposedFailureClass || null,
  };
}

export function createConstitutionalWorkerLifecycle({
  supabaseAdmin,
  workerInvocationId,
  nowIso,
  loadLatestArtifactPayload,
  writeWorkerEventArtifact,
  writeStatusTransitionArtifact,
  restoreEntitlementForFailedJob,
  assertCurrentWorkerInvocationOwnership,
  writeStaleWorkerAttemptEvent,
  makeStaleWorkerAttemptError,
  transitionWorkerJob,
} = {}) {
  if (!supabaseAdmin) {
    throw new TypeError('createConstitutionalWorkerLifecycle requires supabaseAdmin');
  }

  const safeNowIso = nowIso || new Date().toISOString();
  const queuedRecoveryStatuses = new Set(['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing']);

  const writeConstitutionalTerminalRejectionEvent = async (job, payload = {}) => {
    if (typeof writeWorkerEventArtifact !== 'function') {
      return null;
    }
    return writeWorkerEventArtifact(job.id, job.user_id, 'constitutional_terminal_failure_rejected', {
      event: 'constitutional_terminal_failure_rejected',
      internal_only: true,
      customer_delivery_unchanged: true,
      timestamp: safeNowIso,
      ...payload,
    });
  };

  const writeRetryRequiredEvent = async (job, payload = {}) => {
    if (typeof writeWorkerEventArtifact !== 'function') {
      return null;
    }
    return writeWorkerEventArtifact(job.id, job.user_id, 'report_publication_retry_required', {
      publication_state: 'recovery_required',
      timestamp: safeNowIso,
      ...payload,
    });
  };

  async function recoverExpiredPublishableJob({
    job = null,
    currentStatus = null,
    sourceTruthPackage = null,
    sourceTruthLookupState = 'available',
    sourceTruthLookupError = null,
    retryReason = 'worker_timeout',
    claimedBy = 'admin-run-worker',
    publicationState = 'recovery_required',
    recoveryContext = 'timeout_recovery',
  } = {}) {
    if (!job?.id) {
      throw new TypeError('recoverExpiredPublishableJob requires a job');
    }

    const effectiveStatus = normalizeText(currentStatus || job.status || '');
    const leaseExpiresAt = job.worker_lease_expires_at ? new Date(job.worker_lease_expires_at) : null;
    const leaseExpired = Boolean(leaseExpiresAt && leaseExpiresAt <= new Date(safeNowIso));

    if (!queuedRecoveryStatuses.has(effectiveStatus)) {
      const reasonCode = 'status_not_eligible';
      await writeRetryRequiredEvent(job, {
        publication_retry_reason: retryReason,
        publication_state: publicationState,
        recovery_context: recoveryContext,
        reason_code: reasonCode,
        current_status: job.status || null,
        worker_lease_expires_at: job.worker_lease_expires_at || null,
      });
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: true,
        queued: false,
        reasonCode,
        sourceTruthState: 'missing',
      };
    }

    if (!leaseExpired) {
      const reasonCode = 'lease_not_expired';
      await writeRetryRequiredEvent(job, {
        publication_retry_reason: retryReason,
        publication_state: publicationState,
        recovery_context: recoveryContext,
        reason_code: reasonCode,
        current_status: job.status || null,
        worker_lease_expires_at: job.worker_lease_expires_at || null,
      });
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: true,
        queued: false,
        reasonCode,
        sourceTruthState: 'missing',
      };
    }

    let loadedSourceTruthPackage = sourceTruthPackage;
    let lookupState = sourceTruthLookupState;
    let lookupError = sourceTruthLookupError;

    if (!loadedSourceTruthPackage && typeof loadLatestArtifactPayload === 'function') {
      try {
        loadedSourceTruthPackage = await loadLatestArtifactPayload(job.id, 'source_truth_package');
        lookupState = loadedSourceTruthPackage ? 'available' : 'missing';
      } catch (err) {
        lookupState = 'error';
        lookupError = err;
      }
    }

    const disposition = resolveConstitutionalTerminalFailureDisposition({
      sourceTruthPackage: loadedSourceTruthPackage,
      sourceTruthLookupState: lookupState,
      sourceTruthLookupError: lookupError,
      proposedErrorCode: 'TIMEOUT',
      proposedFailureClass: 'retryable',
      stage: effectiveStatus,
    });

    if (disposition.terminalFailurePermitted) {
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: false,
        queued: false,
        reasonCode: disposition.reasonCode,
        sourceTruthState: disposition.sourceTruthState,
      };
    }

    if (lookupState === 'missing' || lookupState === 'error' || disposition.sourceTruthState !== 'publishable') {
      const reasonCode = lookupState === 'error' ? 'source_truth_lookup_error' : 'source_truth_missing';
      const retryHandoffError = await writeWorkerEventArtifact?.(
        job.id,
        job.user_id,
        'report_publication_retry_handoff_failed',
        {
          publication_state: publicationState,
          publication_retry_reason: retryReason,
          recovery_context: recoveryContext,
          reason_code: reasonCode,
          source_truth_state: disposition.sourceTruthState,
          source_truth_lookup_error: disposition.sourceTruthLookupError || null,
          worker_lease_expires_at: job.worker_lease_expires_at || null,
          timestamp: safeNowIso,
        }
      );
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: true,
        queued: false,
        reasonCode,
        sourceTruthState: disposition.sourceTruthState,
        sourceTruthLookupError: disposition.sourceTruthLookupError || null,
        retryHandoffError: retryHandoffError || null,
      };
    }

    const { data: requeuedRows, error: requeueErr } = await supabaseAdmin.rpc('requeue_worker_job', {
      p_job_id: job.id,
      p_claimed_by: claimedBy || 'admin-run-worker',
      p_allow_expired_lease_recovery: true,
    });

    if (requeueErr) {
      const retryHandoffError = await writeWorkerEventArtifact?.(
        job.id,
        job.user_id,
        'report_publication_retry_handoff_failed',
        {
          publication_state: publicationState,
          publication_retry_reason: retryReason,
          recovery_context: recoveryContext,
          reason_code: 'expired_lease_requeue_failed',
          source_truth_state: disposition.sourceTruthState,
          source_truth_lookup_error: disposition.sourceTruthLookupError || null,
          transition_error: requeueErr.message || String(requeueErr),
          worker_lease_expires_at: job.worker_lease_expires_at || null,
          timestamp: safeNowIso,
        }
      );
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: true,
        queued: false,
        reasonCode: 'expired_lease_requeue_failed',
        sourceTruthState: disposition.sourceTruthState,
        requeueError: requeueErr,
        retryHandoffError: retryHandoffError || null,
      };
    }

    const requeuedJob = Array.isArray(requeuedRows) ? requeuedRows[0] : requeuedRows;
    if (!requeuedJob?.id || normalizeText(requeuedJob.status || '') !== 'queued') {
      const retryHandoffError = await writeWorkerEventArtifact?.(
        job.id,
        job.user_id,
        'report_publication_retry_handoff_failed',
        {
          publication_state: publicationState,
          publication_retry_reason: retryReason,
          recovery_context: recoveryContext,
          reason_code: 'requeue_did_not_queue',
          source_truth_state: disposition.sourceTruthState,
          source_truth_lookup_error: disposition.sourceTruthLookupError || null,
          worker_lease_expires_at: job.worker_lease_expires_at || null,
          timestamp: safeNowIso,
        }
      );
      return {
        success: false,
        terminalApplied: false,
        recoveryRequired: true,
        queued: false,
        reasonCode: 'requeue_did_not_queue',
        sourceTruthState: disposition.sourceTruthState,
        retryHandoffError: retryHandoffError || null,
      };
    }

    const retryEventError = await writeRetryRequiredEvent(job, {
      publication_retry_reason: retryReason,
      publication_state: publicationState,
      recovery_context: recoveryContext,
      source_truth_state: disposition.sourceTruthState,
      worker_lease_expires_at: job.worker_lease_expires_at || null,
      claimed_by: claimedBy || 'admin-run-worker',
    });

    return {
      success: true,
      terminalApplied: false,
      recoveryRequired: true,
      recoveryPersisted: true,
      recoveryStatus: 'queued',
      queued: true,
      reasonCode: 'expired_publishable_job_requeued',
      sourceTruthState: disposition.sourceTruthState,
      queuedJob: requeuedJob,
      retryEventError: retryEventError || null,
      publication_state: publicationState,
      publication_retry_reason: retryReason,
      recovery_context: recoveryContext,
    };
  }

  async function applyTerminalFailureOutcome(job, options = {}) {
    const {
      fromStatus = null,
      expectedCurrentStatus = null,
      errorCode = null,
      errorMessage = null,
      failureReason = null,
      transitionMeta = {},
      restore = null,
      sourceTruthPackage = null,
    } = options;

    const workerAttemptId = job.worker_attempt_id || null;
    const guardedCurrentStatus = expectedCurrentStatus || fromStatus || job.status || null;

    await assertCurrentWorkerInvocationOwnership(job, guardedCurrentStatus, {
      reason: 'terminal_failure_ownership_check',
    });

    if (!workerAttemptId || !guardedCurrentStatus) {
      await writeStaleWorkerAttemptEvent(job, workerAttemptId, guardedCurrentStatus || 'unknown', {
        reason: 'missing_worker_attempt_id',
      });
      throw makeStaleWorkerAttemptError('missing_worker_attempt_id');
    }

    let loadedSourceTruthPackage = sourceTruthPackage;
    let sourceTruthLookupState = 'available';
    let sourceTruthLookupError = null;

    if (!loadedSourceTruthPackage && typeof loadLatestArtifactPayload === 'function') {
      try {
        loadedSourceTruthPackage = await loadLatestArtifactPayload(job.id, 'source_truth_package');
        sourceTruthLookupState = loadedSourceTruthPackage ? 'available' : 'missing';
      } catch (err) {
        sourceTruthLookupState = 'error';
        sourceTruthLookupError = err;
      }
    } else if (!loadedSourceTruthPackage) {
      sourceTruthLookupState = 'missing';
    }

    const disposition = resolveConstitutionalTerminalFailureDisposition({
      sourceTruthPackage: loadedSourceTruthPackage,
      sourceTruthLookupState,
      sourceTruthLookupError,
      proposedErrorCode: errorCode || null,
      proposedFailureClass: null,
      stage: guardedCurrentStatus,
    });

    if (!disposition.terminalFailurePermitted) {
      const recoveryReason = errorCode || 'constitutional_terminal_failure_rejected';
      const leaseExpired = Boolean(
        job.worker_lease_expires_at &&
        new Date(job.worker_lease_expires_at).getTime() <= new Date(safeNowIso).getTime()
      );

      if (disposition.sourceTruthState === 'publishable') {
        try {
          if (leaseExpired) {
            const recoveryOutcome = await recoverExpiredPublishableJob({
              job,
              currentStatus: guardedCurrentStatus,
              sourceTruthPackage: loadedSourceTruthPackage || null,
              sourceTruthLookupState,
              sourceTruthLookupError,
              retryReason: recoveryReason,
              claimedBy: workerInvocationId,
              publicationState: 'recovery_required',
              recoveryContext: 'constitutional_terminal_failure_rejected',
            });
            if (recoveryOutcome?.success !== true || recoveryOutcome?.queued !== true) {
              throw new Error(recoveryOutcome?.reasonCode || 'expired_publishable_recovery_failed');
            }

            const constitutionalEventError = await writeConstitutionalTerminalRejectionEvent(job, {
              proposed_error_code: errorCode || null,
              proposed_failure_class: null,
              stage: guardedCurrentStatus,
              source_truth_state: disposition.sourceTruthState,
              source_truth_lookup_error: disposition.sourceTruthLookupError || null,
              constitutional_publishable: disposition.constitutionalPublishable,
              source_truth_publishable: disposition.sourceTruthPublishable,
              truthful_minimum_core_supported: disposition.truthfulMinimumCoreSupported,
              recovery_required: true,
              recovery_persisted: true,
              recovery_status: 'queued',
            });
            return {
              terminalApplied: false,
              recoveryRequired: true,
              recoveryPersisted: true,
              recoveryStatus: 'queued',
              constitutionalDisposition: disposition,
              sourceTruthPackage: loadedSourceTruthPackage || null,
              sourceTruthLookupState,
              sourceTruthLookupError: sourceTruthLookupError ? String(sourceTruthLookupError?.message || sourceTruthLookupError) : null,
              constitutionalEventError: constitutionalEventError || null,
              retryEventError: recoveryOutcome?.retryEventError || null,
              creditRestoration: null,
            };
          } else if (typeof transitionWorkerJob === 'function') {
            const transitionedJob = await transitionWorkerJob(job, guardedCurrentStatus, 'queued', {
              reason: recoveryReason,
              publication_state: 'recovery_required',
              publication_retry_reason: recoveryReason,
              recovery_context: 'constitutional_terminal_failure_rejected',
              source_truth_state: disposition.sourceTruthState,
              proposed_error_code: errorCode || null,
            });
            if (!transitionedJob?.id || normalizeText(transitionedJob.status || '') !== 'queued') {
              throw new Error('Current-owner recovery did not resolve to queued status');
            }
          } else {
            throw new Error('Current-owner recovery transition authority unavailable');
          }

          const constitutionalEventError = await writeConstitutionalTerminalRejectionEvent(job, {
            proposed_error_code: errorCode || null,
            proposed_failure_class: null,
            stage: guardedCurrentStatus,
            source_truth_state: disposition.sourceTruthState,
            source_truth_lookup_error: disposition.sourceTruthLookupError || null,
            constitutional_publishable: disposition.constitutionalPublishable,
            source_truth_publishable: disposition.sourceTruthPublishable,
            truthful_minimum_core_supported: disposition.truthfulMinimumCoreSupported,
            recovery_required: true,
            recovery_persisted: true,
            recovery_status: 'queued',
          });
          const retryEventError = await writeRetryRequiredEvent(job, {
            publication_retry_reason: recoveryReason,
            publication_state: 'recovery_required',
            recovery_context: 'constitutional_terminal_failure_rejected',
            source_truth_state: disposition.sourceTruthState,
            recovery_status: 'queued',
            recovery_persisted: true,
          });

          return {
            terminalApplied: false,
            recoveryRequired: true,
            recoveryPersisted: true,
            recoveryStatus: 'queued',
            constitutionalDisposition: disposition,
            sourceTruthPackage: loadedSourceTruthPackage || null,
            sourceTruthLookupState,
            sourceTruthLookupError: sourceTruthLookupError ? String(sourceTruthLookupError?.message || sourceTruthLookupError) : null,
            constitutionalEventError: constitutionalEventError || null,
            retryEventError: retryEventError || null,
            creditRestoration: null,
          };
        } catch (recoveryErr) {
          const constitutionalEventError = await writeConstitutionalTerminalRejectionEvent(job, {
            proposed_error_code: errorCode || null,
            proposed_failure_class: null,
            stage: guardedCurrentStatus,
            source_truth_state: disposition.sourceTruthState,
            source_truth_lookup_error: disposition.sourceTruthLookupError || null,
            constitutional_publishable: disposition.constitutionalPublishable,
            source_truth_publishable: disposition.sourceTruthPublishable,
            truthful_minimum_core_supported: disposition.truthfulMinimumCoreSupported,
            recovery_required: true,
            recovery_persisted: false,
          });
          const retryHandoffError = await writeWorkerEventArtifact?.(
            job.id,
            job.user_id,
            'report_publication_retry_handoff_failed',
            {
              publication_state: 'recovery_required',
              publication_retry_reason: recoveryReason,
              recovery_context: 'constitutional_terminal_failure_rejected',
              proposed_error_code: errorCode || null,
              stage: guardedCurrentStatus,
              source_truth_state: disposition.sourceTruthState,
              source_truth_lookup_error: disposition.sourceTruthLookupError || null,
              recovery_required: true,
              recovery_persisted: false,
              transition_error: recoveryErr?.message || String(recoveryErr),
              timestamp: safeNowIso,
            }
          );
          return {
            terminalApplied: false,
            recoveryRequired: true,
            recoveryPersisted: false,
            recoveryStatus: job.status || guardedCurrentStatus || null,
            constitutionalDisposition: disposition,
            sourceTruthPackage: loadedSourceTruthPackage || null,
            sourceTruthLookupState,
            sourceTruthLookupError: sourceTruthLookupError ? String(sourceTruthLookupError?.message || sourceTruthLookupError) : null,
            constitutionalEventError: constitutionalEventError || null,
            retryHandoffError: retryHandoffError || null,
            creditRestoration: null,
          };
        }
      }

      const constitutionalEventError = await writeConstitutionalTerminalRejectionEvent(job, {
        proposed_error_code: errorCode || null,
        proposed_failure_class: null,
        stage: guardedCurrentStatus,
        source_truth_state: disposition.sourceTruthState,
        source_truth_lookup_error: disposition.sourceTruthLookupError || null,
        constitutional_publishable: disposition.constitutionalPublishable,
        source_truth_publishable: disposition.sourceTruthPublishable,
        truthful_minimum_core_supported: disposition.truthfulMinimumCoreSupported,
        recovery_required: true,
      });
      const retryHandoffError = await writeWorkerEventArtifact?.(
        job.id,
        job.user_id,
        'report_publication_retry_handoff_failed',
        {
          publication_state: 'recovery_required',
          publication_retry_reason: recoveryReason,
          recovery_context: 'constitutional_terminal_failure_rejected',
          proposed_error_code: errorCode || null,
          stage: guardedCurrentStatus,
          source_truth_state: disposition.sourceTruthState,
          source_truth_lookup_error: disposition.sourceTruthLookupError || null,
          recovery_required: true,
          recovery_persisted: false,
          timestamp: safeNowIso,
        }
      );

      return {
        terminalApplied: false,
        recoveryRequired: true,
        recoveryPersisted: false,
        recoveryStatus: job.status || guardedCurrentStatus || null,
        constitutionalDisposition: disposition,
        sourceTruthPackage: loadedSourceTruthPackage || null,
        sourceTruthLookupState,
        sourceTruthLookupError: sourceTruthLookupError ? String(sourceTruthLookupError?.message || sourceTruthLookupError) : null,
        constitutionalEventError: constitutionalEventError || null,
        retryHandoffError: retryHandoffError || null,
        creditRestoration: null,
      };
    }

    const { data: failedRows, error: failErr } = await supabaseAdmin.rpc('fail_worker_job', {
      p_job_id: job.id,
      p_worker_attempt_id: workerAttemptId,
      p_expected_current_status: guardedCurrentStatus,
      p_error_code: errorCode || null,
      p_error_message: errorMessage || null,
      p_failure_reason: failureReason || null,
      p_claimed_by: workerInvocationId,
    });

    if (failErr) {
      throw new Error(`Failed to mark job failed: ${failErr.message}`);
    }

    const failedJob = Array.isArray(failedRows) ? failedRows[0] : failedRows;
    if (!failedJob?.id) {
      await writeStaleWorkerAttemptEvent(job, workerAttemptId, guardedCurrentStatus, {
        reason: 'fenced_failure_rejected',
        error_code: errorCode || null,
      });
      throw makeStaleWorkerAttemptError('fenced_failure_rejected');
    }

    const terminalStatus = String(failedJob.status || 'failed');
    const transitionStatus = terminalStatus === 'dead_letter' ? 'dead_letter' : 'failed';

    if (fromStatus) {
      const transitionErr = await writeStatusTransitionArtifact(
        job.id,
        fromStatus,
        transitionStatus,
        { user_id: job.user_id, ...(transitionMeta || {}) }
      );
      if (transitionErr) {
        throw new Error(`Failed to write ${fromStatus}->${transitionStatus} status transition artifact: ${transitionErr.message}`);
      }
    }

    const failedEventType = transitionStatus === 'dead_letter'
      ? 'worker_dead_lettered'
      : 'worker_attempt_failed';
    const failedEventErr = await writeWorkerEventArtifact(
      job.id,
      job.user_id,
      failedEventType,
      {
        event: failedEventType,
        error_code: errorCode || null,
        error_message: errorMessage || null,
        failure_reason: failureReason || null,
        attempt_id: workerAttemptId,
        from_status: guardedCurrentStatus,
        to_status: transitionStatus,
        ...transitionMeta,
      }
    );
    if (failedEventErr) {
      throw new Error(`Failed to write ${failedEventType} event: ${failedEventErr.message}`);
    }

    const creditRestoration = {
      state: restore?.enabled ? 'restoration_attempted' : 'not_required',
      restored: false,
      skipped: false,
      error: null,
    };
    if (restore?.enabled) {
      try {
        const restoreResult = await restoreEntitlementForFailedJob(
          failedJob,
          restore.reason || 'terminal_failure',
          restore.errorCode || errorCode || 'WORKER_ERROR',
          workerAttemptId
        );
        creditRestoration.state = restoreResult?.skipped ? 'already_restored' : 'restored';
        creditRestoration.restored = restoreResult?.skipped !== true;
        creditRestoration.skipped = restoreResult?.skipped === true;
      } catch (restoreErr) {
        creditRestoration.state = 'restoration_failed';
        creditRestoration.error = restoreErr?.message || String(restoreErr);
        if (restore.strict) {
          throw new Error(`Failed to restore entitlement: ${restoreErr.message}`);
        }
        console.error(
          `[worker] Failed to restore entitlement for ${restore.logContext || 'terminal-failure'} job ${job.id}:`,
          restoreErr?.message
        );
      }
    }

    return {
      terminalApplied: true,
      recoveryRequired: false,
      constitutionalDisposition: disposition,
      sourceTruthPackage: loadedSourceTruthPackage || null,
      sourceTruthLookupState,
      sourceTruthLookupError: sourceTruthLookupError ? String(sourceTruthLookupError?.message || sourceTruthLookupError) : null,
      failedJob,
      terminalStatus,
      transitionStatus,
      creditRestoration,
    };
  }

  return {
    recoverExpiredPublishableJob,
    applyTerminalFailureOutcome,
  };
}
