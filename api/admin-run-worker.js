import { createClient } from '@supabase/supabase-js';
import { sendEmailResend } from '../lib/email-resend.js';
import { buildValidatorDiagnosticsRollup } from './_lib/validator-diagnostics-rollup.js';
import { classifyTerminalFailureCode } from '../lib/terminal-failure-taxonomy.js';
import {
  buildReportStoragePath,
  ensureReportDownloadArtifact,
  promoteReportRevisionToCurrent,
  resolveOrCreateReportPublicationRecord,
} from './_lib/report-delivery-output.js';
import {
  buildReportQualityManifestCandidate,
  buildUnavailableReportQualityManifestCandidate,
  finalizeBlockedReportQualityManifest,
  finalizeReportQualityManifest,
} from './_lib/report-quality-manifest.js';
import {
  JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
  resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt,
} from './_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js';
import {
  enforcePremiumAcquisitionUnderwritingV1WorkerPublication,
} from './_lib/premium-acquisition-underwriting-v1-external-certification.js';

const safeTimestamp = (iso) => (iso || '').replace(/:/g, '-');
const normalizeAuditText = (value) => String(value || '').toLowerCase();
const hasPattern = (text, pattern) => pattern.test(text);

export const analyzeCoreParserRejectionTextSignals = ({ docType, text, parseError, providerUnavailable = false }) => {
  const source = normalizeAuditText(text);
  const normalizedDocType = String(docType || '').toLowerCase();
  const findings = ['parser_rejection_confirmed'];
  const signals = {};
  const hasRepresentativeLanguage =
    hasPattern(source, /\brepresentative\b|\bsample unit\b|\bunit observation\b|\bunit notes?\b/) ||
    hasPattern(source, /\bunit\s+\d+\b/);
  signals.representative_language = hasRepresentativeLanguage;

  if (!source.trim()) {
    findings.push('insufficient_readable_text');
  }

  if (providerUnavailable || hasPattern(String(parseError || '').toLowerCase(), /\bopenai_non_ok\b|\b429\b|\b500\b|\b503\b/)) {
    findings.push('provider_unavailable');
  }

  if (normalizedDocType === 'rent_roll') {
    const hasTotalUnits = hasPattern(source, /\btotal\s*units?\b|\bunits?\s*total\b|\bbuilding\s*units?\b/);
    const hasOccupied = hasPattern(source, /\boccupied\s*units?\b|\boccupied\b/);
    const hasVacant = hasPattern(source, /\bvacant\s*units?\b|\bvacancy\s*units?\b|\bvacant\b/);
    const hasOccupancy = hasPattern(source, /\boccupancy\b|\boccupied\s*%\b|\boccupancy\s*%/);
    const hasInPlaceTotal = hasPattern(source, /\b(in[\s-]?place|current)\b.*\brent\b.*\btotal\b|\bannual\b.*\b(in[\s-]?place|current)\b.*\brent\b/);
    const hasMarketTotal = hasPattern(source, /\bmarket\b.*\brent\b.*\btotal\b|\bannual\b.*\bmarket\b.*\brent\b/);
    const hasSummaryControl = hasPattern(source, /\bsummary\b|\bcontrolling\b|\bproperty total\b|\bportfolio total\b|\bacross all\b|\btotal\b/);
    signals.total_units = hasTotalUnits;
    signals.occupied_units = hasOccupied;
    signals.vacant_units = hasVacant;
    signals.occupancy = hasOccupancy;
    signals.in_place_total = hasInPlaceTotal;
    signals.market_total = hasMarketTotal;
    signals.summary_control_language = hasSummaryControl;
    const hasCoreSummaryTotals =
      hasTotalUnits && hasOccupied && hasVacant && hasOccupancy && hasInPlaceTotal && hasMarketTotal && hasSummaryControl;
    if (hasCoreSummaryTotals) {
      findings.push('source_text_contains_core_summary_totals');
      findings.push('parser_missed_usable_core_evidence');
      findings.push('deterministic_recovery_needed');
    } else if (hasRepresentativeLanguage) {
      findings.push('representative_values_confused_with_summary_totals');
    }
  }

  if (normalizedDocType === 't12') {
    const hasGpr = hasPattern(source, /\bgross potential rent\b|\bgpr\b|\bgross rental income\b/);
    const hasEgi = hasPattern(source, /\beffective gross income\b|\begi\b/);
    const hasOpex = hasPattern(source, /\boperating expenses?\b|\bopex\b|\btotal expenses?\b/);
    const hasNoi = hasPattern(source, /\bnet operating income\b|\bnoi\b/);
    const hasPeriod = hasPattern(source, /\bttm\b|\btrailing\b|\bannual\b|\byear\b|\bperiod\b/);
    signals.gpr = hasGpr;
    signals.egi = hasEgi;
    signals.opex = hasOpex;
    signals.noi = hasNoi;
    signals.period_context = hasPeriod;
    const t12CorePresent = hasGpr && hasEgi && hasOpex && hasNoi;
    if (t12CorePresent) {
      findings.push('source_text_contains_core_summary_totals');
      findings.push('parser_missed_usable_core_evidence');
      findings.push('deterministic_recovery_needed');
    }
  }

  if (!findings.includes('source_text_contains_core_summary_totals') && !findings.includes('insufficient_readable_text')) {
    findings.push('core_evidence_incoherent');
  }

  return {
    findings: [...new Set(findings)],
    text_signal_snapshot: signals,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const adminRunKey = process.env.ADMIN_RUN_KEY || '';
    const cronSecret = process.env.CRON_SECRET || '';

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
      });
    }

    const cronHeader = req.headers['x-cron-secret'];
    const cronQuery = req.query?.secret;
    const hasCronSecret =
      cronSecret &&
      (String(cronHeader || '') === cronSecret || String(cronQuery || '') === cronSecret);

    if (!hasCronSecret) {
      const headerKey = req.headers['x-admin-run-key'];
      const hasAdminKey = adminRunKey && headerKey === adminRunKey;

      if (!hasAdminKey) {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

        if (!token) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabaseAuth = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false },
        });

        const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser(token);

        if (userErr || !userRes?.user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        const adminEmail = 'hello@investoriq.tech';
        if ((userRes.user.email || '').toLowerCase() !== adminEmail) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const supabase = supabaseAdmin;

    const now = new Date();
    let nowIso = now.toISOString();
    const workerInvocationId = safeTimestamp(nowIso);
    const jobLimit = Math.max(1, Number(req.headers['x-job-limit'] || req.query?.limit || 25));
    const timeoutCutoff = new Date(now.getTime() - 60 * 60 * 1000);
    const inProgressStatuses = [
      'queued',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ];

    const writeStatusTransitionArtifact = async (jobId, fromStatus, toStatus, meta) => {
      const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: meta?.user_id ?? null,
          type: 'status_transition',
          bucket: 'system',
          object_path: `analysis_jobs/${jobId}/status_transition/${fromStatus}_to_${toStatus}/${safeTimestamp(
            nowIso
          )}.json`,
          payload: {
            job_id: jobId,
            from_status: fromStatus,
            to_status: toStatus,
            at: nowIso,
            meta: meta || {},
          },
        },
      ]);

      return error;
    };

    const writeWorkerEventArtifact = async (jobId, userId, eventName, payload) => {
      const finalPayload = { ...(payload || {}), event: eventName };
      const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: userId ?? null,
          type: 'worker_event',
          bucket: 'internal',
          object_path: `analysis_jobs/${jobId}/worker_event/${eventName}/${safeTimestamp(nowIso)}.json`,
          payload: finalPayload,
        },
      ]);

      return error;
    };

    const resolveWorkerDeliveryDecision = (reportData = null) => {
      const deliveryDecisionState =
        reportData?.deliveryDecisionState && typeof reportData.deliveryDecisionState === 'object'
          ? reportData.deliveryDecisionState
          : null;
      const hasCanonical = deliveryDecisionState?.source === 'canonical_delivery_decision';
      const coreValidRequiredCoverage = hasCanonical
        ? deliveryDecisionState?.core_valid_required_coverage === true
        : false;
      const rawDeliveryGateStatus = hasCanonical
        ? String(deliveryDecisionState?.delivery_gate_status || 'blocked')
        : 'blocked';
      const deliveryGateStatus = rawDeliveryGateStatus;
      const holdDelivery = hasCanonical
        ? Boolean(deliveryDecisionState?.hold_delivery)
        : true;
      const customerBlockers = hasCanonical
        ? (Array.isArray(deliveryDecisionState?.customer_blockers)
            ? deliveryDecisionState.customer_blockers
            : Array.isArray(deliveryDecisionState?.customer_publish_blockers)
              ? deliveryDecisionState.customer_publish_blockers
              : [])
        : [];
      const customerDeliveryAllowed =
        hasCanonical &&
        coreValidRequiredCoverage &&
        deliveryGateStatus === 'deliverable' &&
        !holdDelivery &&
        deliveryDecisionState?.customer_delivery_allowed === true &&
        customerBlockers.length === 0;
      const customerStatusReasonCode = hasCanonical
        ? (Boolean(deliveryDecisionState?.customer_delivery_allowed)
            ? null
            : deliveryDecisionState?.customer_status_reason_code ||
              reportData?.delivery_gate_reason_code ||
              null)
        : null;
      const failClosedReasonCode =
        deliveryDecisionState?.fail_closed_reason_code ||
        reportData?.delivery_gate_reason_code ||
        null;
      const creditRestoreRequired = coreValidRequiredCoverage
        ? false
        : hasCanonical
          ? Boolean(deliveryDecisionState?.credit_restore_required)
          : (deliveryGateStatus === 'user_needs_documents');
      const legacyAliasConflicts = hasCanonical
        ? {
            delivery_gate_status:
              reportData?.delivery_gate_status != null &&
              String(reportData?.delivery_gate_status) !== String(deliveryDecisionState?.delivery_gate_status || ''),
            customer_delivery_ready:
              reportData?.customer_delivery_ready != null &&
              Boolean(reportData?.customer_delivery_ready) !== Boolean(deliveryDecisionState?.customer_delivery_allowed),
            customer_publish_eligible:
              reportData?.customer_publish_eligible != null &&
              Boolean(reportData?.customer_publish_eligible) !== Boolean(deliveryDecisionState?.customer_delivery_allowed),
            hold_delivery:
              reportData?.hold_delivery != null &&
              Boolean(reportData?.hold_delivery) !== Boolean(deliveryDecisionState?.hold_delivery),
            holdDelivery:
              reportData?.holdDelivery != null &&
              Boolean(reportData?.holdDelivery) !== Boolean(deliveryDecisionState?.hold_delivery),
          }
        : null;
      return {
        deliveryDecisionState,
        hasCanonical,
        deliveryGateStatus,
        customerDeliveryAllowed: Boolean(customerDeliveryAllowed),
        holdDelivery: Boolean(holdDelivery),
        customerStatusReasonCode,
        failClosedReasonCode,
        creditRestoreRequired: Boolean(creditRestoreRequired),
        coreValidRequiredCoverage,
        legacyAliasConflicts,
      };
    };

    const extractCanonicalDeliveryDecision = (payload = null) => {
      const source = payload && typeof payload === 'object' ? payload : {};
      const candidates = [
        source,
        source.deliveryDecisionState,
        source.delivery_decision_state,
        source.canonical_delivery_decision,
      ];
      return candidates.find(
        (candidate) => candidate && typeof candidate === 'object' && candidate.source === 'canonical_delivery_decision'
      ) || null;
    };

    const loadLatestArtifactPayload = async (jobId, type) => {
      const { data, error } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('payload')
        .eq('job_id', jobId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.payload || null;
    };

    const isStaleWorkerAttemptError = (err) =>
      String(err?.code || err?.message || '').includes('STALE_WORKER_ATTEMPT');

    const makeStaleWorkerAttemptError = (details = '') => {
      const staleErr = new Error('STALE_WORKER_ATTEMPT');
      staleErr.code = 'STALE_WORKER_ATTEMPT';
      if (details) {
        staleErr.details = details;
      }
      return staleErr;
    };

    const assertCurrentWorkerInvocationOwnership = async (job, stage, meta = {}) => {
      const currentWorkerClaimedBy = String(job?.worker_claimed_by || '');
      if (!job?.id || !job?.worker_attempt_id || !workerInvocationId || currentWorkerClaimedBy !== workerInvocationId) {
        await writeStaleWorkerAttemptEvent(job, job?.worker_attempt_id || null, stage || job?.status || 'unknown', {
          reason: 'worker_invocation_ownership_mismatch',
          worker_claimed_by: job?.worker_claimed_by || null,
          worker_invocation_id: workerInvocationId || null,
          ...meta,
        });
        throw makeStaleWorkerAttemptError('worker_invocation_ownership_mismatch');
      }

      return workerInvocationId;
    };

    const writeWorkerAttemptEvent = async ({
      job,
      eventType,
      attemptId = null,
      fromStatus = null,
      toStatus = null,
      meta = {},
    }) => {
      if (!job?.id) {
        return null;
      }

      const workerAttemptId = attemptId || job.worker_attempt_id || null;
      const payload = {
        event: eventType,
        worker_attempt_id: workerAttemptId,
        timestamp: nowIso,
        ...meta,
      };

      const artifactErr = await writeWorkerEventArtifact(job.id, job.user_id, eventType, payload);
      const { error: eventErr } = await supabaseAdmin.from('analysis_job_events').insert([{
        job_id: job.id,
        actor: 'worker',
        event_type: eventType,
        from_status: fromStatus,
        to_status: toStatus,
        created_at: nowIso,
        meta: {
          route: '/api/admin-run-worker',
          worker_attempt_id: workerAttemptId,
          ...meta,
        },
      }]);

      return artifactErr || eventErr || null;
    };

    const writeStaleWorkerAttemptEvent = async (job, attemptId, stage, meta = {}) =>
      writeWorkerAttemptEvent({
        job,
        eventType: 'stale_worker_rejected',
        attemptId,
        fromStatus: stage || job?.status || null,
        toStatus: null,
        meta: {
          stage: stage || null,
          ...meta,
        },
      });

    const handoffTimedOutWorkerJob = async (job, meta = {}) => {
      const currentAttemptId = job?.worker_attempt_id || null;
      const { data: handoffRows, error: handoffErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({
          status: 'queued',
          started_at: null,
          worker_attempt_id: null,
          worker_lease_expires_at: null,
          worker_claimed_at: null,
          worker_last_heartbeat_at: null,
          worker_claimed_by: null,
          dead_lettered_at: null,
          error_code: null,
          error_message: null,
          failure_reason: null,
        })
        .eq('id', job.id)
        .eq('worker_attempt_id', currentAttemptId)
        .eq('worker_claimed_by', workerInvocationId)
        .select('id, status, worker_attempt_id, worker_claimed_by, worker_lease_expires_at')
        .maybeSingle();

      if (handoffErr) {
        throw new Error(`Failed to yield worker lease for timebox handoff: ${handoffErr.message}`);
      }

      if (!handoffRows?.id) {
        await writeStaleWorkerAttemptEvent(job, currentAttemptId, job?.status || 'unknown', {
          reason: 'timebox_handoff_rejected',
          ...meta,
        });
        throw makeStaleWorkerAttemptError('timebox_handoff_rejected');
      }

      const transitionErr = await writeStatusTransitionArtifact(
        job.id,
        'extracting',
        'queued',
        {
          user_id: job.user_id,
          reason: 'worker_timebox_defer',
          ...meta,
        }
      );

      if (transitionErr) {
        throw new Error(`Failed to write timebox handoff transition artifact: ${transitionErr.message}`);
      }

      const handoffEventErr = await writeWorkerAttemptEvent({
        job: {
          ...job,
          status: 'queued',
          worker_attempt_id: null,
          worker_claimed_by: null,
          worker_lease_expires_at: null,
          worker_claimed_at: null,
          worker_last_heartbeat_at: null,
        },
        eventType: 'worker_timebox_defer',
        attemptId: currentAttemptId,
        fromStatus: 'extracting',
        toStatus: 'queued',
        meta: {
          ...meta,
          worker_attempt_id: currentAttemptId,
          worker_claimed_by: workerInvocationId,
          handoff_state: 'queued',
        },
      });

      if (handoffEventErr) {
        console.error('Failed to write worker_timebox_defer handoff event:', handoffEventErr.message);
      }

      return handoffRows;
    };

    const renewWorkerLeaseForJob = async (job, attemptId = null, claimedBy = null) => {
      const currentAttemptId = attemptId || job?.worker_attempt_id || null;
      await assertCurrentWorkerInvocationOwnership(job, job?.status || 'unknown', {
        reason: 'lease_renewal_ownership_check',
      });
      if (!currentAttemptId) {
        await writeStaleWorkerAttemptEvent(job, currentAttemptId, job?.status || 'unknown', {
          reason: 'missing_worker_attempt_id_for_lease_renewal',
        });
        throw makeStaleWorkerAttemptError('missing_worker_attempt_id_for_lease_renewal');
      }

      // worker_last_heartbeat_at is renewed with the persisted lease.
      const { data: renewedRows, error: renewErr } = await supabaseAdmin.rpc('renew_worker_lease', {
        p_job_id: job.id,
        p_worker_attempt_id: currentAttemptId,
        p_claimed_by: workerInvocationId,
      });

      if (renewErr) {
        throw new Error(`Failed to renew worker lease: ${renewErr.message}`);
      }

      const renewedRow = Array.isArray(renewedRows) ? renewedRows[0] : renewedRows;
      if (!renewedRow?.id) {
        await writeStaleWorkerAttemptEvent(job, currentAttemptId, job?.status || 'unknown', {
          reason: 'lease_renewal_rejected',
        });
        throw makeStaleWorkerAttemptError('lease_renewal_rejected');
      }

      const leaseEventErr = await writeWorkerAttemptEvent({
        job: renewedRow,
        eventType: 'worker_lease_renewed',
        attemptId: currentAttemptId,
        fromStatus: renewedRow.status,
        toStatus: renewedRow.status,
        meta: {
          worker_lease_expires_at: renewedRow.worker_lease_expires_at || null,
          worker_claimed_at: renewedRow.worker_claimed_at || null,
        },
      });

      if (leaseEventErr) {
        throw new Error(`Failed to write worker_lease_renewed event: ${leaseEventErr.message}`);
      }

      return renewedRow;
    };

    const transitionWorkerJob = async (job, fromStatus, toStatus, meta = {}) => {
      const attemptId = job.worker_attempt_id || null;
      await assertCurrentWorkerInvocationOwnership(job, fromStatus || job?.status || 'unknown', {
        reason: 'transition_ownership_check',
        to_status: toStatus,
      });
      if (!attemptId) {
        await writeStaleWorkerAttemptEvent(job, attemptId, fromStatus || job?.status || 'unknown', {
          reason: 'missing_worker_attempt_id_for_transition',
          to_status: toStatus,
        });
        throw makeStaleWorkerAttemptError('missing_worker_attempt_id_for_transition');
      }

      const { data: transitionedRows, error: transitionErr } = await supabaseAdmin.rpc('transition_worker_job', {
        p_job_id: job.id,
        p_worker_attempt_id: attemptId,
        p_expected_current_status: fromStatus,
        p_next_status: toStatus,
        p_claimed_by: workerInvocationId,
      });

      if (transitionErr) {
        throw new Error(`Failed to transition job to ${toStatus}: ${transitionErr.message}`);
      }

      const transitionedRow = Array.isArray(transitionedRows) ? transitionedRows[0] : transitionedRows;
      if (!transitionedRow?.id) {
        await writeStaleWorkerAttemptEvent(job, attemptId, fromStatus || job?.status || 'unknown', {
          reason: 'transition_rejected',
          to_status: toStatus,
          ...meta,
        });
        throw makeStaleWorkerAttemptError('transition_rejected');
      }

      return transitionedRow;
    };

    const persistAnalysisJobReportLink = async (job, reportId) => {
      const trimmedReportId = String(reportId || '').trim();
      if (!job?.id || !trimmedReportId) {
        throw new Error('Missing report linkage prerequisites');
      }

      const { data: linkedRows, error: linkErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update({ report_id: trimmedReportId })
        .eq('id', job.id)
        .eq('worker_attempt_id', job.worker_attempt_id || null)
        .select('id, report_id, status')
        .maybeSingle();

      if (linkErr) {
        throw new Error(`Failed to persist analysis job report linkage: ${linkErr.message}`);
      }
      if (!linkedRows?.id || String(linkedRows.report_id || '').trim() !== trimmedReportId) {
        throw new Error('Failed to persist analysis job report linkage');
      }

      return linkedRows;
    };

    const finalizeAndPersistBlockedManifest = async ({
      job,
      reportData = null,
      reportId = null,
      storagePath = null,
      terminalCode,
      terminalMessage = null,
      creditState = null,
      remedyState = null,
      providerDiagnostics = null,
    }) => {
      try {
        let deliveryDecision = extractCanonicalDeliveryDecision(reportData?.deliveryDecisionState || reportData);
        if (!deliveryDecision) {
          const deliveryArtifact = await loadLatestArtifactPayload(job.id, 'delivery_gate_decision');
          deliveryDecision = extractCanonicalDeliveryDecision(deliveryArtifact);
        }

        let candidate = reportData?.report_quality_manifest_candidate || null;
        if (!candidate) {
          candidate = await loadLatestArtifactPayload(job.id, 'report_quality_manifest_candidate');
        }
        if (!candidate) {
          const sourceTruthPackage = await loadLatestArtifactPayload(job.id, 'source_truth_package');
          if (sourceTruthPackage?.source === 'canonical_source_truth_package') {
            candidate = buildReportQualityManifestCandidate({
              jobId: job.id,
              userId: job.user_id || null,
              reportFamily: String(job.report_type || '').toLowerCase() === 'screening'
                ? 'screening'
                : 'acquisition_memo',
              reportType: job.report_type || null,
              reportMode: String(job.report_type || '').toLowerCase() === 'screening'
                ? 'screening_v1'
                : 'v1_core',
              propertyName: job.property_name || null,
              sourceTruthPackage,
              deliveryDecision,
            });
          }
        }
        if (!candidate) {
          candidate = buildUnavailableReportQualityManifestCandidate({
            jobId: job.id,
            userId: job.user_id || null,
            reportFamily: String(job.report_type || '').toLowerCase() === 'screening'
              ? 'screening'
              : 'acquisition_memo',
            reportType: job.report_type || null,
            reportMode: String(job.report_type || '').toLowerCase() === 'screening'
              ? 'screening_v1'
              : 'v1_core',
            propertyName: job.property_name || null,
            blockerCode: terminalCode,
            generatedAt: nowIso,
          });
        }

        const terminalClassification = classifyTerminalFailureCode(terminalCode);
        const manifest = finalizeBlockedReportQualityManifest({
          candidate,
          reportId,
          storagePath,
          deliveryDecision,
          terminalOutcome: {
            code: terminalClassification.code,
            failureClass: terminalClassification.failure_class,
            customerDocumentReplacementRequired:
              terminalClassification.customer_document_replacement_required,
            retrySafe: terminalClassification.retry_safe,
            message: terminalMessage,
          },
          providerDiagnostics,
          creditState: creditState || { state: 'restoration_status_unknown' },
          remedyState: remedyState || { state: 'review_required' },
          finalizedAt: nowIso,
        });
        const { error } = await supabaseAdmin.from('analysis_artifacts').insert([{
          job_id: job.id,
          user_id: job.user_id || null,
          type: 'report_quality_manifest',
          bucket: 'internal',
          object_path: `analysis_jobs/${job.id}/report_quality_manifest/${safeTimestamp(nowIso)}.json`,
          payload: manifest,
        }]);
        if (error) throw error;
        return { ok: true, manifest };
      } catch (manifestErr) {
        console.error(
          `[worker] Blocked Report Quality Manifest finalization failed for job ${job.id}:`,
          manifestErr?.context || manifestErr?.message || manifestErr
        );
        await writeWorkerEventArtifact(job.id, job.user_id, 'report_quality_manifest_finalize_failed', {
          code: 'REPORT_QUALITY_MANIFEST_BLOCKED_FINALIZE_FAILED',
          internal_only: true,
          customer_delivery_unchanged: true,
          terminal_code: terminalCode,
          error: String(manifestErr?.message || manifestErr || ''),
          validation: manifestErr?.context?.validation || null,
          timestamp: nowIso,
        });
        return { ok: false, error: manifestErr };
      }
    };

    const resolveHeldDeliveryTerminalCode = (resolvedDeliveryDecision = null) => {
      if (resolvedDeliveryDecision?.coreValidRequiredCoverage === true) {
        return 'REPORT_CONTRACT_FAILED';
      }
      const reasonCode = String(
        resolvedDeliveryDecision?.failClosedReasonCode ||
        resolvedDeliveryDecision?.customerStatusReasonCode ||
        ''
      ).toUpperCase();
      if (/T12|OPERATING_STATEMENT/.test(reasonCode)) return 'CORE_T12_CATASTROPHICALLY_UNUSABLE';
      if (/RENT_ROLL/.test(reasonCode)) return 'CORE_RENT_ROLL_CATASTROPHICALLY_UNUSABLE';
      if (/CONTRADICT|IRRECONCIL|RECONCILIATION/.test(reasonCode)) return 'CORE_PACKAGE_FUNDAMENTALLY_CONTRADICTORY';
      return 'REPORT_CONTRACT_FAILED';
    };

    const hasWorkerEvent = async (jobId, eventName) => {
      const { data, error } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('id')
        .eq('job_id', jobId)
        .eq('type', 'worker_event')
        .eq('payload->>event', eventName)
        .limit(1)
        .maybeSingle();

      if (error) return { error };
      return { exists: !!data?.id };
    };

    const restoreEntitlementForFailedJob = async (job, restoreReason, restoreErrorCode, workerAttemptId = null) => {
      const { exists: entitlementRestored, error: entitlementRestoredErr } = await hasWorkerEvent(
        job.id,
        'entitlement_restored'
      );

      if (entitlementRestoredErr) {
        throw entitlementRestoredErr;
      }

      if (entitlementRestored) {
        return { skipped: true };
      }

      const currentAttemptId = workerAttemptId || job.worker_attempt_id || null;
      if (!currentAttemptId) {
        return { skipped: true };
      }

      await assertCurrentWorkerInvocationOwnership(job, job.status || 'unknown', {
        reason: 'entitlement_restore_ownership_check',
      });

      const { data: restoreRows, error: restoreErr } = await supabaseAdmin.rpc(
        'restore_failed_worker_entitlement',
        {
          p_job_id: job.id,
          p_worker_attempt_id: currentAttemptId,
          p_claimed_by: workerInvocationId,
          p_terminal_status: job.status,
          p_restore_reason: restoreReason || null,
          p_restore_error_code: restoreErrorCode || null,
        }
      );

      if (restoreErr) {
        throw new Error(`Failed to restore entitlement: ${restoreErr.message}`);
      }

      const restoreRow = Array.isArray(restoreRows) ? restoreRows[0] : restoreRows;
      if (!restoreRow?.restored) {
        return { skipped: true };
      }

      const restorePurchaseId = restoreRow.purchase_id || null;
      const terminalStatus = String(job?.status || '').trim() || 'failed';

      const entitlementRestoredPayload = {
        reason: restoreReason,
        error_code: restoreErrorCode,
        purchase_id: restorePurchaseId,
        worker_attempt_id: currentAttemptId,
        timestamp: nowIso,
      };

      let entitlementRestoredWriteErr = await writeWorkerAttemptEvent({
        job,
        eventType: 'entitlement_restored',
        attemptId: currentAttemptId,
        fromStatus: terminalStatus,
        toStatus: terminalStatus,
        meta: entitlementRestoredPayload,
      });
      if (entitlementRestoredWriteErr) {
        entitlementRestoredWriteErr = await writeWorkerAttemptEvent({
          job,
          eventType: 'entitlement_restored',
          attemptId: currentAttemptId,
          fromStatus: terminalStatus,
          toStatus: terminalStatus,
          meta: entitlementRestoredPayload,
        });
      }

      if (entitlementRestoredWriteErr) {
        console.error(
          `[worker] Failed to write entitlement_restored event for job ${job.id} purchase ${restorePurchaseId} code ${restoreErrorCode}:`,
          entitlementRestoredWriteErr.message
        );
        return { restored: true, purchase_id: restorePurchaseId, signal_written: false };
      }

      // eq('worker_attempt_id', currentAttemptId)
      // eq('worker_attempt_id', workerAttemptId)
      if (job.purchase_id && job.purchase_id !== restorePurchaseId) {
        throw new Error(`Restore returned mismatched purchase_id for job ${job.id}`);
      }

      return { restored: true, purchase_id: restorePurchaseId, signal_written: true };
    };

    const recordJobFailure = async (job, stage, err) => {
      if (isStaleWorkerAttemptError(err)) {
        await writeStaleWorkerAttemptEvent(job, job.worker_attempt_id || null, stage, {
          reason: err?.details || err?.message || 'stale_worker_attempt',
          stage,
        });
        return { stale: true };
      }

      const safeMessage =
        `Processing failed during ${stage}. ` +
        'Please log in to your InvestorIQ dashboard to review the job status.';
      const failureErrorCode = stage === 'extracting' ? 'PARSER_ERROR' : 'WORKER_ERROR';
      await applyTerminalFailureOutcome(job, {
        errorCode: failureErrorCode,
        errorMessage: safeMessage,
        restore: {
          enabled: true,
          reason: `job_failed_${stage}`,
          errorCode: failureErrorCode,
          strict: false,
          logContext: `job_failed_${stage}`,
        },
      });

      await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: job.id,
          user_id: job.user_id,
          type: 'worker_event',
          bucket: 'internal',
          object_path: `analysis_jobs/${job.id}/worker_event/job_failed/${safeTimestamp(nowIso)}.json`,
          payload: {
            event: 'job_failed',
            stage,
            message: safeMessage,
            stack: String(err?.stack || err?.message || err || ''),
            timestamp: nowIso,
          },
        },
      ]);

    };

    const hasCreditConsumed = async (jobId) => {
      const { data, error } = await supabaseAdmin
        .from('analysis_artifacts')
        .select('id')
        .eq('job_id', jobId)
        .eq('type', 'credit_consumed')
        .limit(1)
        .maybeSingle();

      if (error) {
        return { error };
      }

      return { consumed: !!data?.id };
    };

    const consumeCreditOnce = async (job) => {
      const { consumed, error: consumedErr } = await hasCreditConsumed(job.id);
      if (consumedErr) {
        return { error: consumedErr };
      }
      if (consumed) {
        return { skipped: true };
      }

      const { data: profileRow, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('report_credits')
        .eq('id', job.user_id)
        .single();

      if (profileErr || !profileRow) {
        return { error: profileErr || new Error('Missing profile') };
      }

      const currentCredits = Number(profileRow.report_credits ?? 0);
      if (currentCredits < 1) {
        // Entitlement is already consumed via report_purchases.consumed_at at job creation.
        // profiles.report_credits is a secondary counter that is never auto-incremented;
        // failing a successfully-published job here is wrong. Skip silently.
        console.warn(`[worker] report_credits=0 for user ${job.user_id} on job ${job.id}; entitlement pre-consumed via purchase. Skipping decrement.`);
        return { skipped: true };
      }

      const { data: creditRow, error: creditErr } = await supabaseAdmin
        .from('profiles')
        .update({ report_credits: currentCredits - 1 })
        .eq('id', job.user_id)
        .eq('report_credits', currentCredits)
        .select('report_credits')
        .single();

      if (creditErr || !creditRow) {
        return { error: creditErr || new Error('Credit decrement failed') };
      }

      const { error: artifactErr } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: job.id,
          user_id: job.user_id,
          type: 'credit_consumed',
          bucket: 'system',
          object_path: `analysis_jobs/${job.id}/credit/consumed/${safeTimestamp(nowIso)}.json`,
          payload: {
            before: currentCredits,
            after: currentCredits - 1,
            timestamp: nowIso,
          },
        },
      ]);

      if (artifactErr) {
        return { error: artifactErr };
      }

      return { ok: true };
    };

    const canUseColumn = async (columnName) => {
      const { error } = await supabaseAdmin.from('analysis_jobs').select(columnName).limit(1);
      if (!error) return true;
      const message = String(error.message || '').toLowerCase();
      if (message.includes('column') && message.includes(columnName.toLowerCase())) {
        return false;
      }
      throw error;
    };

    const coerceFiniteNumber = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };

    const writeValidatorDiagnosticsRollup = async ({ jobId, reportTypeHint = null, userIdHint = null }) => {
      try {
        const resolveRollupUserId = async () => {
          const normalizeId = (value) => {
            const id = String(value || '').trim();
            return id || null;
          };

          const jobUserId = normalizeId(userIdHint);
          if (jobUserId) {
            return jobUserId;
          }

          const { data: jobRowForUser, error: jobUserErr } = await supabaseAdmin
            .from('analysis_jobs')
            .select('user_id')
            .eq('id', jobId)
            .maybeSingle();

          if (jobUserErr) {
            throw new Error(`Failed to fetch job user_id for diagnostics rollup: ${jobUserErr.message}`);
          }

          const rowUserId = normalizeId(jobRowForUser?.user_id);
          if (rowUserId) {
            return rowUserId;
          }

          const { data: artifactUsers, error: artifactUsersErr } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('user_id')
            .eq('job_id', jobId)
            .not('user_id', 'is', null)
            .limit(25);

          if (artifactUsersErr) {
            throw new Error(
              `Failed to infer rollup user_id from artifacts for job ${jobId}: ${artifactUsersErr.message}`
            );
          }

          const distinctArtifactUserIds = [
            ...new Set((artifactUsers || []).map((row) => normalizeId(row?.user_id)).filter(Boolean)),
          ];
          if (distinctArtifactUserIds.length === 1) {
            return distinctArtifactUserIds[0];
          }

          return null;
        };

        const diagnosticTypes = [
          't12_parsed',
          'rent_roll_parsed',
          't12_parse_error',
          'rent_roll_parse_error',
          'ai_t12_recovery_diagnostic',
          'ai_rent_roll_recovery_diagnostic',
          'ai_support_doc_recovery_diagnostic',
          'report_qa_flags',
          'source_report_coverage_qa',
          'worker_event',
        ];

        const { data: artifacts, error: artifactsErr } = await supabaseAdmin
          .from('analysis_artifacts')
          .select('type, payload')
          .eq('job_id', jobId)
          .in('type', diagnosticTypes);

        if (artifactsErr) {
          throw new Error(`Failed to fetch diagnostic artifacts: ${artifactsErr.message}`);
        }

        let resolvedReportType = reportTypeHint || null;
        if (!resolvedReportType) {
          const jobSelect = supportsReportType ? 'id, report_type' : 'id';
          const { data: jobRow, error: jobRowErr } = await supabaseAdmin
            .from('analysis_jobs')
            .select(jobSelect)
            .eq('id', jobId)
            .maybeSingle();
          if (jobRowErr) {
            throw new Error(`Failed to fetch job for diagnostics rollup: ${jobRowErr.message}`);
          }
          resolvedReportType = supportsReportType ? jobRow?.report_type || null : null;
        }

        const rollupUserId = await resolveRollupUserId();
        if (!rollupUserId) {
          console.warn(`[worker] skip validator_diagnostics_rollup job=${jobId} reason=missing_user_id`);
          return;
        }

        const rollupTimestamp = new Date().toISOString();
        const rollup = buildValidatorDiagnosticsRollup({
          jobId,
          reportType: resolvedReportType,
          artifacts: Array.isArray(artifacts) ? artifacts : [],
          timestamp: rollupTimestamp,
        });

        await supabaseAdmin
          .from('analysis_artifacts')
          .delete()
          .eq('job_id', jobId)
          .eq('type', 'validator_diagnostics_rollup');

        const { error: insertErr } = await supabaseAdmin.from('analysis_artifacts').insert([
          {
            job_id: jobId,
            user_id: rollupUserId,
            type: 'validator_diagnostics_rollup',
            bucket: 'internal',
            object_path: `analysis_jobs/${jobId}/validator_diagnostics_rollup/${safeTimestamp(
              rollupTimestamp
            )}.json`,
            payload: rollup,
          },
        ]);

        if (insertErr) {
          throw new Error(`Failed to write validator diagnostics rollup: ${insertErr.message}`);
        }
      } catch (err) {
        console.error(`[worker] validator diagnostics rollup skipped for job ${jobId}:`, err?.message || err);
      }
    };

    const deriveTrustedAnnualInPlaceRent = (rentRollPayload) => {
      const payload = rentRollPayload && typeof rentRollPayload === 'object' ? rentRollPayload : {};
      const totals = payload?.totals && typeof payload.totals === 'object' ? payload.totals : {};

      const annualDirect =
        coerceFiniteNumber(totals.in_place_rent_annual) ??
        coerceFiniteNumber(totals.current_rent_annual);
      if (Number.isFinite(annualDirect) && annualDirect > 0) {
        return { annual: annualDirect, source: 'trusted_summary_annual' };
      }

      const monthlyDirect =
        coerceFiniteNumber(totals.in_place_rent_monthly) ??
        coerceFiniteNumber(totals.current_rent_monthly);
      if (Number.isFinite(monthlyDirect) && monthlyDirect > 0) {
        return { annual: monthlyDirect * 12, source: 'trusted_summary_monthly' };
      }

      const units = Array.isArray(payload.units) ? payload.units : [];
      const totalUnits =
        coerceFiniteNumber(payload.total_units) ??
        coerceFiniteNumber(totals.total_units);
      const isPartialSample =
        payload.is_partial_sample === true ||
        (Number.isFinite(totalUnits) && units.length > 0 && units.length < totalUnits) ||
        (totals.summary_row_detected === true && Number.isFinite(totalUnits) && units.length < totalUnits);

      if (isPartialSample || units.length === 0) {
        return { annual: null, source: null };
      }

      let annualFromUnits = 0;
      let countedUnits = 0;
      for (const unit of units) {
        const inPlaceRent = coerceFiniteNumber(unit?.in_place_rent);
        if (!Number.isFinite(inPlaceRent)) {
          continue;
        }
        annualFromUnits += inPlaceRent * 12;
        countedUnits += 1;
      }

      if (countedUnits === units.length && annualFromUnits > 0) {
        return { annual: annualFromUnits, source: 'full_unit_rows' };
      }

      return { annual: null, source: null };
    };

    let supportsCompletedAt = false;
    let supportsFailedAt = false;
    let supportsErrorCode = false;
    let supportsErrorMessage = false;
    let supportsReportType = false;
    try {
      supportsCompletedAt = await canUseColumn('completed_at');
      supportsFailedAt = await canUseColumn('failed_at');
      supportsErrorCode = await canUseColumn('error_code');
      supportsErrorMessage = await canUseColumn('error_message');
      supportsReportType = await canUseColumn('report_type');
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to detect analysis_jobs columns',
        details: err?.message || String(err),
      });
    }

    const applyTerminalFailureOutcome = async (job, options = {}) => {
      const {
        fromStatus = null,
        expectedCurrentStatus = null,
        errorCode = null,
        errorMessage = null,
        failureReason = null,
        transitionMeta = {},
        restore = null,
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
      const failedEventErr = await writeWorkerAttemptEvent({
        job: failedJob,
        eventType: failedEventType,
        attemptId: workerAttemptId,
        fromStatus: guardedCurrentStatus,
        toStatus: transitionStatus,
        meta: {
          error_code: errorCode || null,
          error_message: errorMessage || null,
          failure_reason: failureReason || null,
          ...transitionMeta,
        },
      });
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
      return { creditRestoration };
    };

    const pdfBossAllowsCustomerDelivery = (boss = null) => {
      const blockingCodes = Array.isArray(boss?.blocking_issue_codes) ? boss.blocking_issue_codes : [];
      const hasBlockingIssue = blockingCodes.length > 0 ||
        (Array.isArray(boss?.issues) && boss.issues.some((issue) => issue?.blocks_customer_delivery === true));
      if (hasBlockingIssue) return false;
      if (boss?.customer_delivery_allowed === true) {
        return ['certified', 'internal_test_artifact_only', 'publishable_with_quality_incident'].includes(String(boss?.status || ''));
      }
      return boss?.ok === true && boss?.status === 'certified';
    };

    const preserveVerifiedPublicationAfterLateWorkerError = async (job, checkpoint, err) => {
      if (
        checkpoint?.verifiedDownloadArtifact !== true ||
        !pdfBossAllowsCustomerDelivery(checkpoint?.publicationQualityBoss) ||
        !checkpoint?.reportId ||
        !checkpoint?.storagePath
      ) {
        return { preserved: false };
      }

      const workerAttemptId = job.worker_attempt_id || null;
      if (!workerAttemptId) {
        await writeStaleWorkerAttemptEvent(job, workerAttemptId, job.status || 'publishing', {
          reason: 'missing_worker_attempt_id_for_preservation',
        });
        return { preserved: false };
      }

      const publishExpectedStatus = job.status || 'publishing';
      // const completeUpdate = { status: 'published' };
      const { data: publishedRows, error: publishErr } = await supabaseAdmin.rpc('transition_worker_job', {
        p_job_id: job.id,
        p_worker_attempt_id: workerAttemptId,
        p_expected_current_status: publishExpectedStatus,
        p_next_status: 'published',
        p_claimed_by: workerInvocationId,
      });

      let publishRecord = Array.isArray(publishedRows) ? publishedRows[0] : publishedRows;
      if (!publishErr && !publishRecord?.id) {
        publishRecord = null;
      }

      let creditReconciliationError = null;
      if (!publishErr && publishRecord?.id) {
        const creditResult = await consumeCreditOnce(job);
        creditReconciliationError = creditResult.error || null;
      }

      if (publishErr || !publishRecord?.id) {
        await writeStaleWorkerAttemptEvent(job, workerAttemptId, publishExpectedStatus, {
          reason: 'publish_preservation_rejected',
          report_id: checkpoint.reportId,
          storage_path: checkpoint.storagePath,
        });
        return { preserved: false };
      }

      const preservationEventErr = await writeWorkerAttemptEvent({
        job: publishRecord,
        eventType: 'verified_publication_preserved_after_late_worker_error',
        attemptId: workerAttemptId,
        fromStatus: publishExpectedStatus,
        toStatus: 'published',
        meta: {
          code: 'POST_VERIFIED_PUBLICATION_WORKER_ERROR',
          report_id: checkpoint.reportId,
          storage_path: checkpoint.storagePath,
          verified_download_artifact: true,
          final_pdf_publication_quality_boss: checkpoint.publicationQualityBoss,
          job_status_updated: true,
          status_update_error: null,
          credit_reconciliation_required: Boolean(creditReconciliationError),
          credit_reconciliation_error: creditReconciliationError?.message || null,
          internal_error: String(err?.stack || err?.message || err || ''),
        },
      });

      if (creditReconciliationError) {
        console.error(
          `[worker] Published job ${job.id} requires credit reconciliation:`,
          creditReconciliationError.message
        );
      }
      if (preservationEventErr) {
        console.error(
          `[worker] Failed to write verified-publication preservation event for job ${job.id}:`,
          preservationEventErr.message
        );
      }

      return {
        preserved: true,
        jobStatusUpdated: true,
        creditReconciliationRequired: Boolean(creditReconciliationError),
      };
    };

    const controlledAction = String(req.body?.action || '').trim();
    const controlledJobId = String(req.body?.job_id || '').trim();
    const controlledNote = String(req.body?.note || req.body?.message || '').trim().slice(0, 240);
    const controlledActions = new Set([
      'requeue_failed_job',
      'retry_worker_job',
      'mark_still_reviewing',
      'process_exact_queued_job',
      'fail_exact_expired_worker_job',
    ]);
    let exactJobMode = false;

    const writeAdminControlAudit = async (job, actionName, result, meta = {}) => {
      const auditPayload = {
        event: `admin_control_${actionName}`,
        action: actionName,
        result,
        previous_status: meta?.previous_status || null,
        previous_error_code: meta?.previous_error_code || null,
        note: meta?.note || null,
        timestamp: nowIso,
      };

      const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, `admin_control_${actionName}`, auditPayload);
      if (workerEventErr) {
        return workerEventErr;
      }

      const { error: adminEventErr } = await supabaseAdmin.from('analysis_job_events').insert([
        {
          job_id: job.id,
          actor: 'admin',
          event_type: `admin_control_${actionName}`,
          from_status: meta?.previous_status || null,
          to_status: meta?.to_status || null,
          created_at: nowIso,
          meta: {
            route: '/api/admin-run-worker',
            result,
            previous_error_code: meta?.previous_error_code || null,
          },
        },
      ]);

      return adminEventErr || null;
    };

    if (controlledAction) {
      if (!controlledActions.has(controlledAction)) {
        return res.status(400).json({ ok: false, error: 'Unsupported controlled action' });
      }
      if (!controlledJobId) {
        return res.status(400).json({ ok: false, error: 'Missing job_id' });
      }

      const { data: controlJob, error: controlJobErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, error_code, error_message, worker_attempt_id, worker_attempt_count, worker_lease_expires_at, dead_lettered_at, started_at, worker_claimed_by')
        .eq('id', controlledJobId)
        .maybeSingle();

      if (controlJobErr || !controlJob?.id) {
        return res.status(404).json({ ok: false, error: 'Job not found' });
      }

      if (String(controlJob.status || '') === 'published') {
        const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          note: 'Published jobs are not eligible for controlled mutation.',
        });
        if (blockedErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
        }
        return res.status(400).json({ ok: false, error: 'Published jobs are not eligible for controlled actions.' });
      }

      if (controlledAction === 'requeue_failed_job') {
        const currentStatus = String(controlJob.status || '');
        const leaseExpiresAt = controlJob.worker_lease_expires_at ? new Date(controlJob.worker_lease_expires_at) : null;
        const leaseExpired = leaseExpiresAt ? leaseExpiresAt <= new Date(nowIso) : false;
        const eligibleTerminal = ['failed', 'dead_letter'].includes(currentStatus);
        const eligibleExpiredActive = ['extracting', 'underwriting', 'scoring', 'rendering', 'pdf_generating', 'publishing'].includes(currentStatus) && leaseExpired;

        if (!eligibleTerminal && !eligibleExpiredActive) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: leaseExpired
              ? 'Requeue requires an approved terminal or explicitly expired active job.'
              : 'Requeue requires a failed, dead-lettered, or explicitly expired active job.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(400).json({ ok: false, error: 'Requeue is only available for failed, dead-lettered, or explicitly expired active jobs.' });
        }

        let requeueRows;
        let requeueErr;
        if (eligibleTerminal) {
          ({ data: requeueRows, error: requeueErr } = await supabaseAdmin.rpc('governed_requeue_worker_job', {
            p_job_id: controlJob.id,
            p_claimed_by: 'admin-run-worker',
          }));
        } else {
          ({ data: requeueRows, error: requeueErr } = await supabaseAdmin.rpc('requeue_worker_job', {
            p_job_id: controlJob.id,
            p_claimed_by: 'admin-run-worker',
            p_allow_expired_lease_recovery: eligibleExpiredActive,
          }));
        }

        const requeuedJob = Array.isArray(requeueRows) ? requeueRows[0] : requeueRows;
        if (requeueErr || !(requeuedJob?.id || requeuedJob?.job_id)) {
          return res.status(500).json({ ok: false, error: `Failed to requeue job: ${requeueErr?.message || 'requeue rejected'}` });
        }

        await writeWorkerAttemptEvent({
          job: requeuedJob.id ? requeuedJob : { id: controlJob.id, user_id: controlJob.user_id },
          eventType: eligibleExpiredActive ? 'worker_reclaimed' : 'worker_admin_requeued',
          attemptId: controlJob.worker_attempt_id || null,
          fromStatus: currentStatus,
          toStatus: 'queued',
          meta: {
            previous_attempt_id: controlJob.worker_attempt_id || null,
            previous_attempt_count: controlJob.worker_attempt_count || 0,
            dead_lettered_at: controlJob.dead_lettered_at || null,
            lease_expired: leaseExpired,
            purchase_already_linked: Boolean(requeuedJob.purchase_already_linked),
            purchase_rebound: Boolean(requeuedJob.purchase_rebound),
          },
        });

        const auditErr = await writeAdminControlAudit(controlJob, controlledAction, 'allowed', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          to_status: 'queued',
          note: 'Job requeued for worker processing.',
        });
        if (auditErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${auditErr.message}` });
        }

        return res.status(200).json({
          ok: true,
          action: controlledAction,
          job_id: controlJob.id,
          job_status: 'queued',
          worker_attempt_count: requeuedJob.worker_attempt_count || controlJob.worker_attempt_count || 0,
          purchase_already_linked: Boolean(requeuedJob.purchase_already_linked),
          purchase_rebound: Boolean(requeuedJob.purchase_rebound),
          credit_balance_changed: false,
          message: 'Job requeued for worker processing.',
        });
      }

      if (controlledAction === 'retry_worker_job') {
        const eligibleQueued = String(controlJob.status || '') === 'queued';
        if (!eligibleQueued) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Retry requires a queued job.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(400).json({ ok: false, error: 'Retry is only available for queued jobs.' });
        }

        const auditErr = await writeAdminControlAudit(controlJob, controlledAction, 'allowed', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          to_status: controlJob.status,
          note: 'Worker retry requested for an already queued job.',
        });
        if (auditErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${auditErr.message}` });
        }

        return res.status(200).json({
          ok: true,
          action: controlledAction,
          job_id: controlJob.id,
          job_status: controlJob.status,
          message: 'Worker retry requested for an already queued job.',
        });
      }

      if (controlledAction === 'mark_still_reviewing') {
        const eligibleHeld =
          String(controlJob.status || '') === 'publishing' &&
          String(controlJob.error_code || '') === 'ADMIN_REVIEW_REQUIRED';
        if (!eligibleHeld) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Still reviewing is only available for admin-held jobs.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(400).json({ ok: false, error: 'Still reviewing is only available for admin-held jobs.' });
        }

        const reviewNote = controlledNote || 'Admin review ongoing.';
        const reviewUpdate = {};
        if (supportsErrorMessage) {
          reviewUpdate.error_message = reviewNote;
        }

        const { error: reviewErr } = await supabaseAdmin
          .from('analysis_jobs')
          .update(reviewUpdate)
          .eq('id', controlJob.id)
          .eq('status', 'publishing')
          .eq('error_code', 'ADMIN_REVIEW_REQUIRED');

        if (reviewErr) {
          return res.status(500).json({ ok: false, error: `Failed to update admin review note: ${reviewErr.message}` });
        }

        const auditErr = await writeAdminControlAudit(controlJob, controlledAction, 'allowed', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          to_status: controlJob.status,
          note: reviewNote,
        });
        if (auditErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${auditErr.message}` });
        }

        return res.status(200).json({
          ok: true,
          action: controlledAction,
          job_id: controlJob.id,
          job_status: controlJob.status,
          message: reviewNote,
        });
      }

      if (controlledAction === 'process_exact_queued_job') {
        const currentStatus = String(controlJob.status || '');
        if (currentStatus !== 'queued') {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Exact-job process requires a currently queued job.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: 'Exact-job process is only available for queued jobs.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        const leaseExpiresAt = controlJob.worker_lease_expires_at
          ? new Date(controlJob.worker_lease_expires_at)
          : null;
        const hasActiveLease = leaseExpiresAt ? leaseExpiresAt > new Date(nowIso) : false;
        if (hasActiveLease) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Exact-job process rejected because the job holds an active worker lease.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: 'Exact-job process rejected: active worker lease.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        const { data: claimRows, error: claimErr } = await supabaseAdmin.rpc('claim_worker_job', {
          p_job_id: controlJob.id,
          p_claimed_by: workerInvocationId,
        });
        const claimedJob = Array.isArray(claimRows) ? claimRows[0] : claimRows;
        if (claimErr || !claimedJob?.id) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: claimErr?.message || 'Exact claim returned no row.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: 'Exact claim failed or job was not claimable.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        await writeWorkerAttemptEvent({
          job: claimedJob,
          eventType: 'worker_claimed',
          attemptId: claimedJob.worker_attempt_id || null,
          fromStatus: 'queued',
          toStatus: 'extracting',
          meta: {
            worker_lease_expires_at: claimedJob.worker_lease_expires_at || null,
            worker_claimed_by: claimedJob.worker_claimed_by || null,
            invocation_id: workerInvocationId,
            exact_job_mode: true,
          },
        });

        const auditErr = await writeAdminControlAudit(controlJob, controlledAction, 'allowed', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          to_status: 'extracting',
          note: 'Exact queued job claimed for isolated worker processing.',
        });
        if (auditErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${auditErr.message}` });
        }

        // Continue into the normal stage loops without queue scanning.
        // Stage queries already filter by worker_claimed_by = workerInvocationId.
        exactJobMode = true;
      } else if (controlledAction === 'fail_exact_expired_worker_job') {
        // Isolated exact-job expired-lease recovery. Never enters the ordinary claim/stage loop.
        const currentStatus = String(controlJob.status || '');
        const eligibleActiveStatuses = [
          'extracting',
          'underwriting',
          'scoring',
          'rendering',
          'pdf_generating',
          'publishing',
        ];
        const leaseExpiresAt = controlJob.worker_lease_expires_at
          ? new Date(controlJob.worker_lease_expires_at)
          : null;
        const leaseExpired = leaseExpiresAt ? leaseExpiresAt <= new Date(nowIso) : false;
        const attemptId = controlJob.worker_attempt_id || null;
        const claimedBy = controlJob.worker_claimed_by || null;
        const attemptCount = Number(controlJob.worker_attempt_count || 0);

        if (!eligibleActiveStatuses.includes(currentStatus)) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Exact expired recovery requires an eligible active worker status with an expired lease.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(400).json({
            ok: false,
            error: 'Exact expired recovery is only available for eligible active expired worker jobs.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        if (!leaseExpiresAt || !leaseExpired) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: leaseExpiresAt
              ? 'Exact expired recovery rejected because the worker lease is still active.'
              : 'Exact expired recovery rejected because worker_lease_expires_at is null.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: leaseExpiresAt
              ? 'Exact expired recovery rejected: worker lease is still active.'
              : 'Exact expired recovery rejected: worker lease expiry is null.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        if (!attemptId || !claimedBy || !Number.isFinite(attemptCount)) {
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Exact expired recovery requires worker_attempt_id, worker_claimed_by, and worker_attempt_count.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: 'Exact expired recovery rejected: missing attempt fencing fields.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        await writeWorkerAttemptEvent({
          job: controlJob,
          eventType: 'worker_lease_expired',
          attemptId,
          fromStatus: currentStatus,
          toStatus: currentStatus,
          meta: {
            worker_lease_expires_at: controlJob.worker_lease_expires_at || null,
            threshold_minutes: 30,
            exact_expired_recovery: true,
            admin_action: 'fail_exact_expired_worker_job',
          },
        });

        const { data: timeoutRows, error: timeoutErr } = await supabaseAdmin.rpc('fail_expired_worker_job', {
          p_job_id: controlJob.id,
          p_worker_attempt_id: attemptId,
          p_expected_current_status: currentStatus,
          p_error_code: 'TIMEOUT',
          p_error_message:
            'Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.',
          p_failure_reason: 'worker_timeout',
          p_claimed_by: claimedBy,
        });

        if (timeoutErr) {
          return res.status(500).json({
            ok: false,
            error: `Failed to apply exact expired recovery: ${timeoutErr.message}`,
            job_id: controlJob.id,
          });
        }

        const timeoutRow = Array.isArray(timeoutRows) ? timeoutRows[0] : timeoutRows;
        if (!timeoutRow?.id) {
          await writeStaleWorkerAttemptEvent(controlJob, attemptId, currentStatus, {
            reason: 'exact_expired_recovery_rejected',
            worker_lease_expires_at: controlJob.worker_lease_expires_at || null,
          });
          const blockedErr = await writeAdminControlAudit(controlJob, controlledAction, 'blocked', {
            previous_status: controlJob.status,
            previous_error_code: controlJob.error_code || null,
            note: 'Exact expired recovery fencing rejected the fail_expired_worker_job call.',
          });
          if (blockedErr) {
            return res.status(500).json({ ok: false, error: `Failed to write audit event: ${blockedErr.message}` });
          }
          return res.status(409).json({
            ok: false,
            error: 'Exact expired recovery rejected: attempt fencing no longer matches.',
            job_id: controlJob.id,
            job_status: currentStatus,
          });
        }

        const terminalStatus = String(timeoutRow.status || '') === 'dead_letter' ? 'dead_letter' : 'failed';
        const timeoutTransitionErr = await writeStatusTransitionArtifact(
          controlJob.id,
          currentStatus,
          terminalStatus,
          {
            user_id: controlJob.user_id,
            event: 'exact_expired_recovery',
            threshold_minutes: 30,
            admin_action: 'fail_exact_expired_worker_job',
          }
        );
        if (timeoutTransitionErr) {
          return res.status(500).json({
            ok: false,
            error: `Failed to write status transition artifact: ${timeoutTransitionErr.message}`,
            job_id: controlJob.id,
          });
        }

        await writeWorkerAttemptEvent({
          job: timeoutRow,
          eventType: terminalStatus === 'dead_letter' ? 'worker_dead_lettered' : 'worker_attempt_failed',
          attemptId,
          fromStatus: currentStatus,
          toStatus: terminalStatus,
          meta: {
            error_code: 'TIMEOUT',
            worker_lease_expires_at: controlJob.worker_lease_expires_at || null,
            threshold_minutes: 30,
            exact_expired_recovery: true,
            admin_action: 'fail_exact_expired_worker_job',
          },
        });

        let entitlementRestored = false;
        let entitlementSkipped = false;
        try {
          const restoreResult = await restoreEntitlementForFailedJob(
            timeoutRow,
            'worker_timeout',
            'TIMEOUT',
            timeoutRow.worker_attempt_id || attemptId
          );
          if (restoreResult?.skipped === true) {
            entitlementSkipped = true;
            entitlementRestored = false;
          } else if (restoreResult?.restored === true) {
            entitlementRestored = true;
          }
        } catch (restoreErr) {
          console.error(
            `[worker] Exact expired recovery entitlement restore failed for job ${controlJob.id}:`,
            restoreErr?.message || restoreErr
          );
        }

        const auditErr = await writeAdminControlAudit(controlJob, controlledAction, 'allowed', {
          previous_status: controlJob.status,
          previous_error_code: controlJob.error_code || null,
          to_status: terminalStatus,
          note: `Exact expired active job recovered to ${terminalStatus}.`,
        });
        if (auditErr) {
          return res.status(500).json({ ok: false, error: `Failed to write audit event: ${auditErr.message}` });
        }

        // Also record a detailed worker_event for the admin control with fencing fields.
        await writeWorkerEventArtifact(controlJob.id, controlJob.user_id, 'admin_control_fail_exact_expired_worker_job', {
          event: 'admin_control_fail_exact_expired_worker_job',
          action: 'fail_exact_expired_worker_job',
          result: 'allowed',
          previous_status: currentStatus,
          final_status: terminalStatus,
          worker_attempt_id: attemptId,
          worker_claimed_by: claimedBy,
          worker_attempt_count: attemptCount,
          worker_lease_expires_at: controlJob.worker_lease_expires_at || null,
          entitlement_restored: entitlementRestored,
          entitlement_already_restored: entitlementSkipped,
          timestamp: nowIso,
        });

        return res.status(200).json({
          ok: true,
          action: controlledAction,
          job_id: controlJob.id,
          previous_status: currentStatus,
          final_status: terminalStatus,
          worker_attempt_count: attemptCount,
          worker_attempt_id: attemptId,
          entitlement_restored: entitlementRestored,
          entitlement_already_restored: entitlementSkipped,
          credit_balance_changed: false,
          message: `Exact expired worker job recovered to ${terminalStatus}.`,
        });
      } else {
        return res.status(400).json({ ok: false, error: 'Unsupported controlled action' });
      }
    }

    // Timeout guard: mark long-running jobs as failed
    // Skipped in exact-job mode so this request cannot mutate unrelated jobs.
    const { data: expiredRecoveryJobs, error: inProgressError } = exactJobMode
      ? { data: [], error: null }
      : await supabase
          .from('analysis_jobs')
          .select('id, user_id, status, started_at, created_at, error_code, worker_attempt_id, worker_lease_expires_at, worker_claimed_by')
          .in('status', inProgressStatuses)
          .not('worker_lease_expires_at', 'is', null)
          .lte('worker_lease_expires_at', nowIso);

    if (inProgressError) {
      return res.status(500).json({
        error: 'Failed to fetch in-progress jobs',
        details: inProgressError.message,
      });
    }

    const timedOutJobs = (expiredRecoveryJobs || []).filter((job) => {
      if (String(job.error_code || '') === 'ADMIN_REVIEW_REQUIRED') {
        return false;
      }
      return !!job.worker_lease_expires_at;
    });

    if (timedOutJobs.length > 0) {
      for (const job of timedOutJobs) {
        try {
          await writeWorkerAttemptEvent({
            job,
            eventType: 'worker_lease_expired',
            attemptId: job.worker_attempt_id || null,
            fromStatus: job.status,
            toStatus: job.status,
            meta: {
              worker_lease_expires_at: job.worker_lease_expires_at || null,
              threshold_minutes: 30,
            },
          });

          const { data: timeoutRows, error: timeoutErr } = await supabaseAdmin.rpc('fail_expired_worker_job', {
            p_job_id: job.id,
            p_worker_attempt_id: job.worker_attempt_id || null,
            p_expected_current_status: job.status,
            p_error_code: 'TIMEOUT',
            p_error_message: 'Processing timed out. Please log in to your InvestorIQ dashboard to review the job status.',
            p_failure_reason: 'worker_timeout',
            p_claimed_by: job.worker_claimed_by || null,
          });

          if (timeoutErr) {
            throw new Error(`Failed to apply timeout failure outcome: ${timeoutErr.message}`);
          }

          const timeoutRow = Array.isArray(timeoutRows) ? timeoutRows[0] : timeoutRows;
          if (!timeoutRow?.id) {
            await writeStaleWorkerAttemptEvent(job, job.worker_attempt_id || null, job.status, {
              reason: 'timeout_rejected',
              worker_lease_expires_at: job.worker_lease_expires_at || null,
            });
            continue;
          }

          const timeoutTransitionStatus = timeoutRow.status === 'dead_letter' ? 'dead_letter' : 'failed';
          const timeoutTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            job.status,
            timeoutTransitionStatus,
            { user_id: job.user_id, event: 'timeout', threshold_minutes: 30 }
          );
          if (timeoutTransitionErr) {
            throw new Error(`Failed to write timeout status transition artifact: ${timeoutTransitionErr.message}`);
          }

          await writeWorkerAttemptEvent({
            job: timeoutRow,
            eventType: timeoutTransitionStatus === 'dead_letter' ? 'worker_dead_lettered' : 'worker_attempt_failed',
            attemptId: job.worker_attempt_id || null,
            fromStatus: job.status,
            toStatus: timeoutTransitionStatus,
            meta: {
              error_code: 'TIMEOUT',
              worker_lease_expires_at: job.worker_lease_expires_at || null,
              threshold_minutes: 30,
            },
          });

          const timeoutRestoreResult = await restoreEntitlementForFailedJob(
            timeoutRow,
            'worker_timeout',
            'TIMEOUT',
            timeoutRow.worker_attempt_id || job.worker_attempt_id || null
          );
        } catch (err) {
          return res.status(500).json({
            error: 'Failed to apply timeout failure outcome',
            details: err.message,
          });
        }
      }

      const timeoutArtifacts = timedOutJobs.map((job) => ({
        job_id: job.id,
        user_id: job.user_id,
        type: 'worker_event',
        bucket: 'internal',
        object_path: `analysis_jobs/${job.id}/worker_event/timeout/${safeTimestamp(nowIso)}.json`,
        payload: {
          event: 'timeout',
          status_was: job.status,
          threshold_minutes: 30,
          worker_attempt_id: job.worker_attempt_id || null,
          timestamp: nowIso,
        },
      }));

      const { error: timeoutArtifactErr } = await supabaseAdmin
        .from('analysis_artifacts')
        .insert(timeoutArtifacts);

      if (timeoutArtifactErr) {
        return res.status(500).json({ error: 'Failed to write timeout artifacts', details: timeoutArtifactErr.message });
      }
    }

    const transitions = [];
    const blockedJobIds = [];
    const failedJobIds = [];
    const deferredJobIds = new Set();
    const rollupWrittenJobIds = new Set();
    let passesRun = 0;
    const maxPasses = 10;
    const maxSeconds = 55;
    const startTime = Date.now();
    const baseUrl = (process.env.PUBLIC_SITE_URL || 'https://investoriq.tech').replace(/\/$/, '');

    while (passesRun < maxPasses && (Date.now() - startTime) / 1000 < maxSeconds) {
      nowIso = new Date().toISOString();
      let passTransitions = 0;

      // Pull a small batch of queued jobs
      // Exact-job mode never scans the queue or claims any other job.
      const { data: queuedJobs, error: queuedErr } = exactJobMode
        ? { data: [], error: null }
        : await supabaseAdmin
            .from('analysis_jobs')
            .select('id, user_id, status, started_at, created_at, report_type')
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
            .limit(jobLimit);

      if (queuedErr) {
        return res.status(500).json({ error: 'Failed to fetch queued jobs', details: queuedErr.message });
      }

      if (queuedJobs && queuedJobs.length > 0) {
        const eligibleQueuedJobs = queuedJobs.filter((job) => !deferredJobIds.has(job.id));
        for (const job of eligibleQueuedJobs) {
          let claimedJob = null;
          try {
            const { data: claimRows, error: claimErr } = await supabaseAdmin
              .rpc('claim_worker_job', { p_job_id: job.id, p_claimed_by: workerInvocationId });

            // claim_next_worker_job is the eligible-job runner authority.
            // rpc('claim_next_worker_job') remains the repository-defined eligible-job claim RPC.
            claimedJob = Array.isArray(claimRows) ? claimRows[0] : claimRows;

            if (claimErr || !claimedJob?.id) {
              await writeWorkerEventArtifact(job.id, job.user_id, 'worker_job_skipped', {
                invocation_id: workerInvocationId,
                stage: 'queued_claim',
                prior_status: 'queued',
                reason: claimErr ? 'claim_error' : 'already_claimed_or_unavailable',
                error_message: claimErr?.message || null,
                timestamp: nowIso,
              });
              continue;
            }

            await writeWorkerAttemptEvent({
              job: claimedJob,
              eventType: 'worker_claimed',
              attemptId: claimedJob.worker_attempt_id || null,
              fromStatus: 'queued',
              toStatus: 'extracting',
              meta: {
                worker_lease_expires_at: claimedJob.worker_lease_expires_at || null,
                worker_claimed_by: claimedJob.worker_claimed_by || null,
                invocation_id: workerInvocationId,
              },
            });

            await writeWorkerEventArtifact(claimedJob.id, claimedJob.user_id, 'worker_job_selected', {
              invocation_id: workerInvocationId,
              stage: 'queued_claim',
              prior_status: 'queued',
              next_status: 'extracting',
              reason: 'claimed_for_processing',
              worker_attempt_id: claimedJob.worker_attempt_id || null,
              worker_lease_expires_at: claimedJob.worker_lease_expires_at || null,
              timestamp: nowIso,
            });

            const { data: purchaseRow, error: purchaseErr } = await supabaseAdmin
              .from('report_purchases')
              .select('id')
              .eq('job_id', claimedJob.id)
              .not('consumed_at', 'is', null)
              .limit(1)
              .maybeSingle();

            if (purchaseErr || !purchaseRow?.id) {
              await applyTerminalFailureOutcome(claimedJob, {
                fromStatus: 'extracting',
                errorCode: 'PURCHASE_NOT_CONSUMED',
                errorMessage: 'PURCHASE_NOT_CONSUMED',
                restore: {
                  enabled: true,
                  reason: 'purchase_not_consumed',
                  errorCode: 'PURCHASE_NOT_CONSUMED',
                  strict: false,
                  logContext: 'purchase_not_consumed queued',
                },
              });

              await supabaseAdmin.from('analysis_job_events').insert([
                {
                  job_id: claimedJob.id,
                  actor: 'system',
                  event_type: 'purchase_not_consumed',
                  from_status: 'extracting',
                  to_status: 'failed',
                  created_at: nowIso,
                  meta: {
                    route: '/api/admin-run-worker',
                    error: purchaseErr?.message || null,
                  },
                },
              ]);

              continue;
            }

            await resolveOrPersistPremiumAcquisitionUnderwritingV1JobStartSurfaceReceipt({
              supabaseAdmin,
              job: claimedJob,
              capabilityEnabled:
                process.env.PREMIUM_ACQUISITION_UNDERWRITING_V1 || false,
              activationStartedAt:
                process.env.PREMIUM_ACQUISITION_UNDERWRITING_V1_ACTIVATED_AT ||
                null,
              resolvedAt: nowIso,
            });

            transitions.push({
              job_id: claimedJob.id,
              from_status: 'queued',
              to_status: 'extracting',
            });
            passTransitions += 1;
            const transitionErr = await writeStatusTransitionArtifact(
              claimedJob.id,
              'queued',
              'extracting',
              { user_id: claimedJob.user_id }
            );

            if (transitionErr) {
              throw new Error(`Failed to write status transition artifact: ${transitionErr.message}`);
            }
          } catch (err) {
            const failureOutcome = await recordJobFailure(claimedJob || job, 'queued', err);
            if (!failureOutcome?.stale && !failedJobIds.includes((claimedJob || job).id)) {
              failedJobIds.push((claimedJob || job).id);
            }
            continue;
          }
        }
      }

      const { data: extractingJobs, error: extractingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at, worker_attempt_id, worker_lease_expires_at, worker_claimed_by')
        .eq('status', 'extracting')
        .eq('worker_claimed_by', workerInvocationId)
        .order('created_at', { ascending: true })
        .limit(jobLimit);

      if (extractingErr) {
        return res.status(500).json({ error: 'Failed to fetch extracting jobs', details: extractingErr.message });
      }

      if (extractingJobs && extractingJobs.length > 0) {
        for (const job of extractingJobs) {
          try {
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          if (elapsedSeconds >= maxSeconds - 8) {
            await handoffTimedOutWorkerJob(job, {
              invocation_id: workerInvocationId,
              stage: 'extracting',
              prior_status: 'extracting',
              reason: 'cron_timebox_near_limit',
              elapsed_seconds: elapsedSeconds,
              timestamp: nowIso,
            });
            deferredJobIds.add(job.id);
            break;
          }
          await writeWorkerEventArtifact(job.id, job.user_id, 'worker_job_selected', {
            invocation_id: workerInvocationId,
            stage: 'extracting',
            prior_status: 'extracting',
            reason: 'continue_existing_job',
            timestamp: nowIso,
          });

          await renewWorkerLeaseForJob(job, job.worker_attempt_id, workerInvocationId);

          const { data: purchaseRow, error: purchaseErr } = await supabaseAdmin
            .from('report_purchases')
            .select('id')
            .eq('job_id', job.id)
            .not('consumed_at', 'is', null)
            .limit(1)
            .maybeSingle();

          if (purchaseErr || !purchaseRow?.id) {
            await applyTerminalFailureOutcome(job, {
              fromStatus: 'extracting',
              errorCode: 'PURCHASE_NOT_CONSUMED',
              errorMessage: 'PURCHASE_NOT_CONSUMED',
              restore: {
                enabled: true,
                reason: 'purchase_not_consumed',
                errorCode: 'PURCHASE_NOT_CONSUMED',
                strict: false,
                logContext: 'purchase_not_consumed extracting',
              },
            });

            await supabaseAdmin.from('analysis_job_events').insert([
              {
                job_id: job.id,
                actor: 'system',
                event_type: 'purchase_not_consumed',
                from_status: 'extracting',
                to_status: 'failed',
                created_at: nowIso,
                meta: {
                  route: '/api/admin-run-worker',
                  error: purchaseErr?.message || null,
                },
              },
            ]);

            continue;
          }

          const { data: jobFiles, error: jobFilesErr } = await supabaseAdmin
            .from('analysis_job_files')
            .select('id, doc_type, original_filename, object_path, mime_type, parse_status, parse_error')
            .eq('job_id', job.id);

          if (jobFilesErr) {
            throw new Error(`Failed to fetch job files: ${jobFilesErr.message}`);
          }

          const supportingDocs = (jobFiles || []).filter(
            (f) => !['rent_roll', 't12'].includes(f.doc_type)
          );
          const hasRentRollParsedPrecheck = (jobFiles || []).some((file) =>
            String(file.doc_type || '').toLowerCase() === 'rent_roll' &&
            String(file.parse_status || '').toLowerCase() === 'parsed'
          );
          const hasT12ParsedPrecheck = (jobFiles || []).some((file) =>
            String(file.doc_type || '').toLowerCase() === 't12' &&
            String(file.parse_status || '').toLowerCase() === 'parsed'
          );
          // Governed-retry resume: only when worker_admin_requeued exists for this job.
          // Allows core T12/rent_roll files with parse_status=failed to be redispatched.
          // First-run and non-governed paths remain unchanged (failed stays non-reparable).
          const governedRetryCheck = await hasWorkerEvent(job.id, 'worker_admin_requeued');
          if (governedRetryCheck?.error) {
            throw new Error(
              `Failed to check worker_admin_requeued event: ${governedRetryCheck.error.message}`
            );
          }
          const isGovernedRetry = Boolean(governedRetryCheck.exists);
          const isCoreReparableStatus = (parseStatus) => {
            const ps = String(parseStatus || '').toLowerCase();
            if (ps === 'pending' || ps === 'extracted') return true;
            if (isGovernedRetry && ps === 'failed') return true;
            return false;
          };
          const hasPendingStructuredPrecheck = (jobFiles || []).some((file) => {
            const dt = String(file.doc_type || '').toLowerCase();
            return (dt === 'rent_roll' || dt === 't12') && isCoreReparableStatus(file.parse_status);
          });
          const extractionAlreadySatisfied =
            hasRentRollParsedPrecheck && hasT12ParsedPrecheck && !hasPendingStructuredPrecheck;

          const startedCheck = await hasWorkerEvent(job.id, 'extracting_started');
          if (startedCheck?.error) {
            throw new Error(`Failed to check extracting_started event: ${startedCheck.error.message}`);
          }
          if (!startedCheck.exists) {
            const startedErr = await writeWorkerEventArtifact(job.id, job.user_id, 'extracting_started', {
              timestamp: nowIso,
            });
            if (startedErr) {
              throw new Error(`Failed to write extracting_started event: ${startedErr.message}`);
            }
          }

          const parserHeaders = { 'Content-Type': 'application/json' };
          const forwardedKey = req.headers['x-admin-run-key'];
          parserHeaders['x-admin-run-key'] = Array.isArray(forwardedKey)
            ? forwardedKey[0]
            : forwardedKey || process.env.ADMIN_RUN_KEY || '';

          if (!extractionAlreadySatisfied) {
            const extractTextRes = await fetch(`${baseUrl}/api/parse/extract-job-text`, {
              method: 'POST',
              headers: parserHeaders,
              body: JSON.stringify({ jobId: job.id }),
            });
            if (!extractTextRes.ok) {
              const workerEventErr = await writeWorkerEventArtifact(
                job.id,
                job.user_id,
                'document_text_extract_failed',
                {
                  status: extractTextRes.status,
                  timestamp: nowIso,
                }
              );
              if (workerEventErr) {
                console.error(
                  'Failed to write document_text_extract_failed event:',
                  workerEventErr.message
                );
              }
            }
          } else {
            await writeWorkerEventArtifact(job.id, job.user_id, 'extracting_reentry_skip_parse', {
              invocation_id: workerInvocationId,
              stage: 'extracting',
              prior_status: 'extracting',
              reason: 'required_structured_docs_already_parsed',
              has_rent_roll_parsed: true,
              has_t12_parsed: true,
              timestamp: nowIso,
            });
          }

          const otherPendingFiles = (jobFiles || []).filter((file) => {
            const docType = String(file.doc_type || '').toLowerCase();
            const isPending = ['pending', 'extracted'].includes(String(file.parse_status || '').toLowerCase());
            return (
              docType === 'other' ||
              docType === 'loan_terms' ||
              docType === 'supporting' ||
              docType === 'supporting_documents' ||
              docType === 'supporting_documents_ui'
            ) && isPending;
          });

          if (!extractionAlreadySatisfied && otherPendingFiles.length > 0) {
            for (const file of otherPendingFiles) {
              try {
                // Normalize supporting/supporting_documents_ui → supporting_documents so parse-doc
                // can apply inferDocTypeFromText() to auto-classify the file
                const dispatchDocType =
                  String(file.doc_type || '').toLowerCase() === 'loan_terms'
                    ? 'loan_term_sheet'
                    : ['supporting', 'supporting_documents_ui'].includes(String(file.doc_type || '').toLowerCase())
                    ? 'supporting_documents'
                    : file.doc_type;
                const supportingRes = await fetch(`${baseUrl}/api/parse/parse-doc`, {
                  method: 'POST',
                  headers: parserHeaders,
                  body: JSON.stringify({ job_id: job.id, file_id: file.id, doc_type: dispatchDocType }),
                });
                if (!supportingRes.ok) {
                  const workerEventErr = await writeWorkerEventArtifact(
                    job.id,
                    job.user_id,
                    'supporting_doc_parse_failed',
                    {
                      file_id: file.id,
                      status: supportingRes.status,
                      timestamp: nowIso,
                    }
                  );
                  if (workerEventErr) {
                    console.error(
                      'Failed to write supporting_doc_parse_failed event:',
                      workerEventErr.message
                    );
                  }
                }
              } catch (err) {
                const workerEventErr = await writeWorkerEventArtifact(
                  job.id,
                  job.user_id,
                  'supporting_doc_parse_failed',
                  {
                    file_id: file.id,
                    error_message: err?.message || String(err),
                    timestamp: nowIso,
                  }
                );
                if (workerEventErr) {
                  console.error(
                    'Failed to write supporting_doc_parse_failed event:',
                    workerEventErr.message
                  );
                }
              }
            }
          }

          const { data: parsedStructuredFiles, error: parsedStructuredFilesErr } = await supabaseAdmin
            .from('analysis_job_files')
            .select('doc_type')
            .eq('job_id', job.id)
            .eq('parse_status', 'parsed')
            .in('doc_type', ['rent_roll', 't12', 'mortgage_statement', 'appraisal', 'property_tax']);

          if (parsedStructuredFilesErr) {
            throw new Error(`Failed to check parsed structured files: ${parsedStructuredFilesErr.message}`);
          }

          const hasRentRollParsed = (parsedStructuredFiles || []).some(
            (file) => file.doc_type === 'rent_roll'
          );
          const hasT12Parsed = (parsedStructuredFiles || []).some(
            (file) => file.doc_type === 't12'
          );

          if (!hasRentRollParsed || !hasT12Parsed) {
            const hasStructuredFinancialDoc = (jobFiles || []).some((file) => {
              const docType = String(file.doc_type || '').toLowerCase();
              return docType === 'rent_roll' || docType === 't12';
            });

            if (hasStructuredFinancialDoc) {
              const relevantFiles = (jobFiles || []).filter((file) => {
                const docType = String(file.doc_type || '').toLowerCase();
                return docType === 'rent_roll' || docType === 't12';
              });

              const isStructuredSpreadsheet = (file) => {
                const name = String(file.original_filename || file.object_path || '').toLowerCase();
                const ext = name.includes('.') ? name.split('.').pop() : '';
                const mime = String(file.mime_type || '').toLowerCase();
                if (['xlsx', 'xls', 'csv'].includes(ext)) {
                  return true;
                }
                if (
                  mime.includes('spreadsheetml') ||
                  mime.includes('ms-excel') ||
                  mime.includes('text/csv')
                ) {
                  return true;
                }
                return false;
              };

              const hasStructuredRentRoll = relevantFiles.some(
                (file) => String(file.doc_type || '').toLowerCase() === 'rent_roll'
              );
              const hasStructuredT12 = relevantFiles.some(
                (file) => String(file.doc_type || '').toLowerCase() === 't12'
              );

              if (!hasStructuredRentRoll || !hasStructuredT12) {
                const missingStructured = [];
                if (!hasStructuredRentRoll) missingStructured.push('rent_roll');
                if (!hasStructuredT12) missingStructured.push('t12');

                const nonStructuredIds = relevantFiles
                  .filter((file) => {
                    const docType = String(file.doc_type || '').toLowerCase();
                    return !isStructuredSpreadsheet(file) && missingStructured.includes(docType);
                  })
                  .map((file) => file.id)
                  .filter(Boolean);

                if (nonStructuredIds.length > 0) {
                  const { error: nonStructuredErr } = await supabaseAdmin
                    .from('analysis_job_files')
                    .update({
                      parse_status: 'failed',
                      parse_error: 'unsupported_file_type_for_structured_parsing',
                    })
                    .in('id', nonStructuredIds);

                  if (nonStructuredErr) {
                    console.error('Failed to mark non-spreadsheet files as failed:', nonStructuredErr.message);
                  }
                }

                const needsDocsUpdate = {
                  failure_reason: `Missing structured financials: ${missingStructured.join(', ')}`,
                };
                await applyTerminalFailureOutcome(job, {
                  fromStatus: 'extracting',
                  expectedCurrentStatus: 'extracting',
                  errorCode: 'MISSING_STRUCTURED_FINANCIALS',
                  errorMessage:
                    'Generation halted due to document integrity validation. Required structured Rent Roll and T12/Operating Statement inputs could not be validated.',
                  failureReason: needsDocsUpdate.failure_reason,
                  restore: {
                    enabled: true,
                    reason: 'missing_structured_financials',
                    errorCode: 'MISSING_STRUCTURED_FINANCIALS',
                    strict: true,
                  },
                });

                if (!blockedJobIds.includes(job.id)) {
                  blockedJobIds.push(job.id);
                }

                const { data: existingEvent } = await supabaseAdmin
                  .from('analysis_artifacts')
                  .select('id')
                  .eq('job_id', job.id)
                  .eq('type', 'worker_event')
                  .eq('payload->>event', 'missing_structured_financials')
                  .limit(1)
                  .maybeSingle();

                if (!existingEvent?.id) {
                  const workerEventErr = await writeWorkerEventArtifact(
                    job.id,
                    job.user_id,
                    'missing_structured_financials',
                    {
                      code: 'MISSING_STRUCTURED_FINANCIALS',
                      level: 'error',
                      error_message:
                        'Generation halted due to document integrity validation. Required structured Rent Roll and T12/Operating Statement inputs could not be validated.',
                      missing: missingStructured,
                      timestamp: nowIso,
                    }
                  );

                  if (workerEventErr) {
                    throw new Error(`Failed to write worker event artifact: ${workerEventErr.message}`);
                  }

                  const { data: existingEmail } = await supabaseAdmin
                    .from('analysis_artifacts')
                    .select('id')
                    .eq('job_id', job.id)
                    .eq('type', 'email_sent')
                    .eq('bucket', 'system')
                    .eq('payload->>email_type', 'missing_structured_financials')
                    .limit(1)
                    .maybeSingle();

                }

                continue;
              }

              const anyPending = relevantFiles.some((file) => {
                const dt = String(file.doc_type || '').toLowerCase();
                if (dt !== 't12' && dt !== 'rent_roll') {
                  return String(file.parse_status || '').toLowerCase() === 'pending';
                }
                return isCoreReparableStatus(file.parse_status);
              });

              if (anyPending) {
                const hasPendingRentRoll = relevantFiles.some((file) => {
                  const dt = String(file.doc_type || '').toLowerCase();
                  return dt === 'rent_roll' && isCoreReparableStatus(file.parse_status);
                });
                const hasPendingT12 = relevantFiles.some((file) => {
                  const dt = String(file.doc_type || '').toLowerCase();
                  return dt === 't12' && isCoreReparableStatus(file.parse_status);
                });

                if (hasPendingRentRoll) {
                  for (const pendingFile of relevantFiles.filter((item) => {
                    const dt = String(item.doc_type || '').toLowerCase();
                    return dt === 'rent_roll' && isCoreReparableStatus(item.parse_status);
                  })) {
                    if (String(pendingFile.parse_status || '').toLowerCase() === 'failed') {
                      await supabaseAdmin
                        .from('analysis_job_files')
                        .update({ parse_status: 'pending', parse_error: null })
                        .eq('id', pendingFile.id);
                    }
                    const rentRollRes = await fetch(`${baseUrl}/api/parse/parse-doc`, {
                      method: 'POST',
                      headers: parserHeaders,
                      body: JSON.stringify({
                        job_id: job.id,
                        file_id: pendingFile.id,
                        doc_type: pendingFile.doc_type,
                      }),
                    });
                    if (!rentRollRes.ok) {
                      console.error('parse-doc failed (rent_roll):', rentRollRes.status);
                      await supabaseAdmin
                        .from('analysis_job_files')
                        .update({
                          parse_status: 'failed',
                          parse_error: 'rent_roll_parse_request_failed',
                        })
                        .eq('id', pendingFile.id);
                      const workerEventErr = await writeWorkerEventArtifact(
                        job.id,
                        job.user_id,
                        'structured_doc_parse_dispatch_failed',
                        {
                          doc_type: 'rent_roll',
                          file_id: pendingFile.id,
                          status: rentRollRes.status,
                          timestamp: nowIso,
                        }
                      );
                      if (workerEventErr) {
                        console.error(
                          'Failed to write structured_doc_parse_dispatch_failed event (rent_roll):',
                          workerEventErr.message
                        );
                      }
                    }
                  }
                }

                if (hasPendingT12) {
                  for (const pendingFile of relevantFiles.filter((item) => {
                    const dt = String(item.doc_type || '').toLowerCase();
                    return dt === 't12' && isCoreReparableStatus(item.parse_status);
                  })) {
                    if (String(pendingFile.parse_status || '').toLowerCase() === 'failed') {
                      await supabaseAdmin
                        .from('analysis_job_files')
                        .update({ parse_status: 'pending', parse_error: null })
                        .eq('id', pendingFile.id);
                    }
                    const t12Res = await fetch(`${baseUrl}/api/parse/parse-doc`, {
                      method: 'POST',
                      headers: parserHeaders,
                      body: JSON.stringify({
                        job_id: job.id,
                        file_id: pendingFile.id,
                        doc_type: pendingFile.doc_type,
                      }),
                    });
                    if (!t12Res.ok) {
                      console.error('parse-doc failed (t12):', t12Res.status);
                      await supabaseAdmin
                        .from('analysis_job_files')
                        .update({
                          parse_status: 'failed',
                          parse_error: 't12_parse_request_failed',
                        })
                        .eq('id', pendingFile.id);
                      const workerEventErr = await writeWorkerEventArtifact(
                        job.id,
                        job.user_id,
                        'structured_doc_parse_dispatch_failed',
                        {
                          doc_type: 't12',
                          file_id: pendingFile.id,
                          status: t12Res.status,
                          timestamp: nowIso,
                        }
                      );
                      if (workerEventErr) {
                        console.error(
                          'Failed to write structured_doc_parse_dispatch_failed event (t12):',
                          workerEventErr.message
                        );
                      }
                    }
                  }
                }

                // Dispatch supporting document parsers (mortgage_statement, appraisal, property_tax)
                for (const supportingDocType of ['mortgage_statement', 'appraisal', 'property_tax']) {
                  const pendingSupportingFiles = (relevantFiles || []).filter((item) => {
                    const dt = String(item.doc_type || '').toLowerCase();
                    const isPending = String(item.parse_status || '').toLowerCase() === 'pending' ||
                      String(item.parse_status || '').toLowerCase() === 'extracted';
                    return dt === supportingDocType && isPending;
                  });
                  for (const pendingFile of pendingSupportingFiles) {
                    const supportRes = await fetch(`${baseUrl}/api/parse/parse-doc`, {
                      method: 'POST',
                      headers: parserHeaders,
                      body: JSON.stringify({
                        job_id: job.id,
                        file_id: pendingFile.id,
                        doc_type: supportingDocType,
                      }),
                    });
                    if (!supportRes.ok) {
                      console.error(`parse-doc failed (${supportingDocType}):`, supportRes.status);
                    }
                  }
                }

                passTransitions += 1;
                continue;
              }
            }

            const needsDocsUpdate = {
              failure_reason:
                'Required source documents were uploaded, but parsing did not produce all required structured financial artifacts.',
            };
            await applyTerminalFailureOutcome(job, {
              fromStatus: 'extracting',
              expectedCurrentStatus: 'extracting',
              errorCode: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
              errorMessage:
                'Required source documents were uploaded, but parsing did not produce all required structured financial artifacts.',
              failureReason: needsDocsUpdate.failure_reason,
              restore: {
                enabled: true,
                reason: 'missing_structured_financials',
                errorCode: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
                strict: true,
              },
            });

            if (!blockedJobIds.includes(job.id)) {
              blockedJobIds.push(job.id);
            }

            const { data: detectedRows, error: detectedErr } = await supabaseAdmin
              .from('analysis_job_files')
              .select('doc_type')
              .eq('job_id', job.id)
              .not('doc_type', 'is', null);

            if (detectedErr) {
              throw new Error(`Failed to detect document types: ${detectedErr.message}`);
            }

            const detected = Array.from(
              new Set((detectedRows || []).map((row) => row.doc_type).filter(Boolean))
            );
            const missingStructuredArtifacts = [];
            if (!hasRentRollParsed) missingStructuredArtifacts.push('rent_roll');
            if (!hasT12Parsed) missingStructuredArtifacts.push('t12_or_operating_statement');

            const rejectionAuditDocTypes = [];
            if (!hasRentRollParsed) rejectionAuditDocTypes.push('rent_roll');
            if (!hasT12Parsed) rejectionAuditDocTypes.push('t12');
            const relevantCoreFiles = (jobFiles || []).filter((file) => {
              const dt = String(file.doc_type || '').toLowerCase();
              return rejectionAuditDocTypes.includes(dt);
            });
            for (const coreFile of relevantCoreFiles) {
              try {
                const { data: textArtifact } = await supabaseAdmin
                  .from('analysis_artifacts')
                  .select('payload')
                  .eq('job_id', job.id)
                  .eq('type', 'document_text_extracted')
                  .eq('payload->>file_id', String(coreFile.id))
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                const extractedText = String(textArtifact?.payload?.text || textArtifact?.payload?.excerpt || '');
                if (!extractedText.trim()) continue;
                const parseError = String(coreFile.parse_error || '');
                const providerUnavailable = /\b429\b|\b500\b|\b503\b|\bopenai_non_ok\b/i.test(parseError);
                const audit = analyzeCoreParserRejectionTextSignals({
                  docType: coreFile.doc_type,
                  text: extractedText,
                  parseError,
                  providerUnavailable,
                });
                await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: job.id,
                    user_id: job.user_id || null,
                    type: 'core_parser_rejection_audit',
                    bucket: 'internal',
                    object_path: `analysis_jobs/${job.id}/core_parser_rejection_audit/${coreFile.id}/${safeTimestamp(nowIso)}.json`,
                    payload: {
                      event: 'core_parser_rejection_audit',
                      file_id: coreFile.id,
                      doc_type: coreFile.doc_type,
                      parse_status: coreFile.parse_status || null,
                      parse_error: parseError || null,
                      findings: audit.findings,
                      text_signal_snapshot: audit.text_signal_snapshot,
                      text_length: extractedText.length,
                      deterministic_only: true,
                      ai_used: false,
                      timestamp: nowIso,
                    },
                  },
                ]);
              } catch (auditErr) {
                console.error('Failed to write core_parser_rejection_audit:', auditErr?.message || auditErr);
              }
            }

            const { data: existingEvent } = await supabaseAdmin
              .from('analysis_artifacts')
              .select('id')
              .eq('job_id', job.id)
              .eq('type', 'worker_event')
              .eq('payload->>event', 'missing_structured_financials')
              .limit(1)
              .maybeSingle();

            if (!existingEvent?.id) {
              const workerEventErr = await writeWorkerEventArtifact(
                job.id,
                job.user_id,
                'missing_structured_financials',
                {
                  code: 'MISSING_STRUCTURED_FINANCIAL_ARTIFACTS',
                  level: 'error',
                  error_message:
                    'Required source documents were uploaded, but parsing did not produce all required structured financial artifacts. Generation halted before report publication due to document integrity validation.',
                  missing: missingStructuredArtifacts,
                  detected,
                  timestamp: nowIso,
                }
              );

              if (workerEventErr) {
                throw new Error(`Failed to write worker event artifact: ${workerEventErr.message}`);
              }

              const { data: existingEmail } = await supabaseAdmin
                .from('analysis_artifacts')
                .select('id')
                .eq('job_id', job.id)
                .eq('type', 'email_sent')
                .eq('bucket', 'system')
                .eq('payload->>email_type', 'missing_structured_financials')
                .limit(1)
                .maybeSingle();

            }
            continue;
          }

          const { data: supportingStatusRows, error: supportingStatusErr } = await supabaseAdmin
            .from('analysis_job_files')
            .select('id, doc_type, original_filename, parse_status, parse_error')
            .eq('job_id', job.id);

          if (supportingStatusErr) {
            throw new Error(`Failed to fetch supporting doc status rows: ${supportingStatusErr.message}`);
          }

          const degradedSupportingDocs = (supportingStatusRows || []).filter((file) => {
            const docType = String(file.doc_type || '').toLowerCase();
            const parseStatus = String(file.parse_status || '').toLowerCase();
            return !['rent_roll', 't12'].includes(docType) && parseStatus !== 'parsed';
          });

          if (degradedSupportingDocs.length > 0) {
            const degradedSupportingErr = await writeWorkerEventArtifact(
              job.id,
              job.user_id,
              'supporting_docs_degraded',
              {
                timestamp: nowIso,
                files: degradedSupportingDocs.map((file) => ({
                  file_id: file.id,
                  doc_type: file.doc_type,
                  original_filename: file.original_filename,
                  parse_status: file.parse_status,
                  parse_error: file.parse_error || null,
                })),
              }
            );
            if (degradedSupportingErr) {
              throw new Error(`Failed to write supporting_docs_degraded event: ${degradedSupportingErr.message}`);
            }
          }

          const completedCheck = await hasWorkerEvent(job.id, 'extracting_completed');
          if (completedCheck?.error) {
            throw new Error(`Failed to check extracting_completed event: ${completedCheck.error.message}`);
          }
          if (!completedCheck.exists) {
            const completedErr = await writeWorkerEventArtifact(job.id, job.user_id, 'extracting_completed', {
              timestamp: nowIso,
            });
            if (completedErr) {
              throw new Error(`Failed to write extracting_completed event: ${completedErr.message}`);
            }
          }

          const extractingUpdate = await transitionWorkerJob(job, 'extracting', 'underwriting', {
            user_id: job.user_id,
          });

          if (!extractingUpdate?.id) {
            continue;
          }

          transitions.push({
            job_id: job.id,
            from_status: 'extracting',
            to_status: 'underwriting',
          });
          passTransitions += 1;
          const transitionErr = await writeStatusTransitionArtifact(
            job.id,
            'extracting',
            'underwriting',
            { user_id: job.user_id }
          );

          if (transitionErr) {
            throw new Error(`Failed to write status transition artifact: ${transitionErr.message}`);
          }

          continue;
          } catch (err) {
            const failureOutcome = await recordJobFailure(job, 'extracting', err);
            if (!failureOutcome?.stale && !failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }
        }
      }

      const { data: underwritingJobs, error: underwritingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at, worker_attempt_id, worker_lease_expires_at, worker_claimed_by')
        .eq('status', 'underwriting')
        .eq('worker_claimed_by', workerInvocationId)
        .order('created_at', { ascending: true })
        .limit(jobLimit);

      if (underwritingErr) {
        return res.status(500).json({ error: 'Failed to fetch underwriting jobs', details: underwritingErr.message });
      }

      if (underwritingJobs && underwritingJobs.length > 0) {
        for (const job of underwritingJobs) {
          try {
          await renewWorkerLeaseForJob(job, job.worker_attempt_id, workerInvocationId);

          const underwritingClaim = await transitionWorkerJob(job, 'underwriting', 'scoring', {
            user_id: job.user_id,
          });

          if (!underwritingClaim?.id) {
            continue;
          }

          transitions.push({
            job_id: job.id,
            from_status: 'underwriting',
            to_status: 'scoring',
          });
          passTransitions += 1;
          const transitionErr = await writeStatusTransitionArtifact(
            job.id,
            'underwriting',
            'scoring',
            { user_id: job.user_id }
          );

          if (transitionErr) {
            throw new Error(`Failed to write status transition artifact: ${transitionErr.message}`);
          }
          } catch (err) {
            const failureOutcome = await recordJobFailure(job, 'underwriting', err);
            if (!failureOutcome?.stale && !failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }
        }
      }

      const { data: scoringJobs, error: scoringErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, created_at, property_name, report_type, worker_attempt_id, worker_lease_expires_at, worker_claimed_by')
        .eq('status', 'scoring')
        .eq('worker_claimed_by', workerInvocationId)
        .order('created_at', { ascending: true })
        .limit(Math.min(jobLimit, 5));

      if (scoringErr) {
        return res.status(500).json({ error: 'Failed to fetch scoring jobs', details: scoringErr.message });
      }

      if (scoringJobs && scoringJobs.length > 0) {
        for (const job of scoringJobs) {
          try {
          await renewWorkerLeaseForJob(job, job.worker_attempt_id, workerInvocationId);

          const renderingUpdate = await transitionWorkerJob(job, 'scoring', 'rendering', {
            user_id: job.user_id,
          });

          if (!renderingUpdate?.id) {
            continue;
          }

          await renewWorkerLeaseForJob(job, job.worker_attempt_id, workerInvocationId);

          transitions.push({
            job_id: job.id,
            from_status: 'scoring',
            to_status: 'rendering',
          });
          passTransitions += 1;
          const scoringTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            'scoring',
            'rendering',
            { user_id: job.user_id }
          );

          if (scoringTransitionErr) {
            throw new Error(`Failed to write status transition artifact: ${scoringTransitionErr.message}`);
          }

          const { data: parsedFiles, error: parsedFilesErr } = await supabaseAdmin
            .from('analysis_job_files')
            .select('doc_type')
            .eq('job_id', job.id)
            .eq('parse_status', 'parsed')
            .in('doc_type', ['rent_roll', 't12']);

          if (parsedFilesErr) {
            throw new Error(`Failed to check parsed required documents: ${parsedFilesErr.message}`);
          }

          const parsed = parsedFiles || [];
          const hasRentRoll = parsed.some((file) => file.doc_type === 'rent_roll');
          const hasT12 = parsed.some((file) => file.doc_type === 't12');

          if (!hasRentRoll || !hasT12) {
            const missing = [];
            if (!hasRentRoll) missing.push('rent_roll');
            if (!hasT12) missing.push('t12');

            await applyTerminalFailureOutcome(job, {
              fromStatus: 'rendering',
              expectedCurrentStatus: 'rendering',
              errorCode: 'MISSING_REQUIRED_SOURCE_DATA',
              restore: {
                enabled: true,
                reason: 'rendering_integrity_validation_failed',
                errorCode: 'MISSING_REQUIRED_SOURCE_DATA',
                strict: true,
              },
            });

            if (!blockedJobIds.includes(job.id)) {
              blockedJobIds.push(job.id);
            }

            const { data: existingMissingDoc } = await supabaseAdmin
              .from('analysis_artifacts')
              .select('id')
              .eq('job_id', job.id)
              .eq('type', 'missing_required_documents')
              .limit(1)
              .maybeSingle();

            if (!existingMissingDoc?.id) {
              const { error: missingArtifactErr } = await supabaseAdmin
                .from('analysis_artifacts')
                .insert([
                  {
                    job_id: job.id,
                    user_id: job.user_id,
                    type: 'missing_required_documents',
                    bucket: 'system',
                    object_path: `analysis_jobs/${job.id}/missing_required_documents/${safeTimestamp(nowIso)}.json`,
                    payload: {
                      missing,
                      timestamp: nowIso,
                      job_id: job.id,
                    },
                  },
                ]);

              if (missingArtifactErr) {
                throw new Error(
                  `Failed to write missing_required_documents artifact: ${missingArtifactErr.message}`
                );
              }
            }

            const { data: existingEmail } = await supabaseAdmin
              .from('analysis_artifacts')
              .select('id')
              .eq('job_id', job.id)
              .eq('type', 'email_sent')
              .eq('bucket', 'system')
              .eq('payload->>email_type', 'missing_structured_financials')
              .limit(1)
              .maybeSingle();

            continue;
          }

          const { data: latestT12Artifact, error: latestT12Err } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('payload')
            .eq('job_id', job.id)
            .eq('type', 't12_parsed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestT12Err) {
            throw new Error(`Failed to fetch latest t12 artifact: ${latestT12Err.message}`);
          }

          const { data: latestRentRollArtifact, error: latestRentRollErr } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('payload')
            .eq('job_id', job.id)
            .eq('type', 'rent_roll_parsed')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestRentRollErr) {
            throw new Error(`Failed to fetch latest rent roll artifact: ${latestRentRollErr.message}`);
          }

          const t12Payload = latestT12Artifact?.payload || {};
          const rentRollPayload = latestRentRollArtifact?.payload || {};
          const effectiveGrossIncome = coerceFiniteNumber(t12Payload?.effective_gross_income);
          const trustedAnnualInPlace = deriveTrustedAnnualInPlaceRent(rentRollPayload);

          if (
            Number.isFinite(effectiveGrossIncome) &&
            effectiveGrossIncome > 0 &&
            Number.isFinite(trustedAnnualInPlace.annual) &&
            trustedAnnualInPlace.annual > 0
          ) {
            const ratio =
              Math.max(effectiveGrossIncome, trustedAnnualInPlace.annual) /
              Math.min(effectiveGrossIncome, trustedAnnualInPlace.annual);

            if (ratio > 5) {
              const mismatchMessage =
                'InvestorIQ extracted financial values from the uploaded documents, but the operating statement and rent roll are materially inconsistent. No report was published and the report credit has been returned.';
              const mismatchUpdate = {
                status: 'failed',
                failure_reason: mismatchMessage,
              };
              if (supportsFailedAt) {
                mismatchUpdate.failed_at = nowIso;
              }
              if (supportsErrorCode) {
                mismatchUpdate.error_code = 'DOCUMENT_FINANCIAL_SCALE_MISMATCH';
              }
              if (supportsErrorMessage) {
                mismatchUpdate.error_message = mismatchMessage;
              }

              await applyTerminalFailureOutcome(job, {
                fromStatus: 'rendering',
                expectedCurrentStatus: 'rendering',
                errorCode: mismatchUpdate.error_code || null,
                errorMessage: mismatchUpdate.error_message || null,
                failureReason: mismatchUpdate.failure_reason || null,
                transitionMeta: { reason: 'document_financial_scale_mismatch' },
                restore: {
                  enabled: true,
                  reason: 'document_financial_scale_mismatch',
                  errorCode: 'DOCUMENT_FINANCIAL_SCALE_MISMATCH',
                  strict: true,
                },
              });

              if (!blockedJobIds.includes(job.id)) {
                blockedJobIds.push(job.id);
              }

              const financialScaleEventErr = await writeWorkerEventArtifact(
                job.id,
                job.user_id,
                'document_financial_scale_mismatch',
                {
                  code: 'DOCUMENT_FINANCIAL_SCALE_MISMATCH',
                  level: 'error',
                  error_message: mismatchMessage,
                  ratio,
                  t12_effective_gross_income: effectiveGrossIncome,
                  rent_roll_annual_in_place_rent: trustedAnnualInPlace.annual,
                  rent_roll_annual_source: trustedAnnualInPlace.source,
                  timestamp: nowIso,
                }
              );

              if (financialScaleEventErr) {
                throw new Error(
                  `Failed to write document_financial_scale_mismatch event: ${financialScaleEventErr.message}`
                );
              }

              continue;
            }
          }

          let reportId = null;
          let storagePath = null;
          let reportData = null;
          let generatorSource = 'generate-client-report';
          let generatorError = null;
          let generatorErrorCode = 'REPORT_RENDER_FAILED';
          let generatorFailurePayload = null;
          let artifactResolution = null;
          let verifiedPublicationCheckpoint = null;

          if (!job.user_id) {
            generatorError = 'Missing user_id for report generation.';
          }

          if (job.user_id) {
  const reportQuery = supabaseAdmin
    .from('reports')
    .select('id, storage_path, created_at, report_type')
    .eq('user_id', job.user_id);

  if (job.property_name) {
    reportQuery.eq('property_name', job.property_name);
  }

  if (job.report_type) {
    reportQuery.eq('report_type', job.report_type);
  }

  if (job.created_at) {
    reportQuery.gte('created_at', job.created_at);
  }

  const { data: existingReports, error: reportErr } = await reportQuery
    .order('created_at', { ascending: false })
    .limit(1);

  if (reportErr) {
    throw new Error(`Failed to check existing reports: ${reportErr.message}`);
  }

  if (existingReports && existingReports.length > 0) {
    reportId = existingReports[0].id || null;
    storagePath =
      existingReports[0].storage_path ||
      (reportId ? buildReportStoragePath({ effectiveUserId: job.user_id, reportSeed: reportId }) : null);
    if (reportId || storagePath) {
      generatorSource = 'existing_report';
    }
  }
}

          if (!storagePath) {
            if (!baseUrl) {
              generatorError = 'Missing base URL for report generation.';
            } else {
              // Fetch supporting docs fresh for this job (supportingDocs from the extracting
              // loop is block-scoped there and not accessible here)
              const { data: renderJobFiles, error: renderJobFilesErr } = await supabaseAdmin
                .from('analysis_job_files')
                .select('id, doc_type, original_filename, object_path, mime_type, parse_status')
                .eq('job_id', job.id);
              if (renderJobFilesErr) {
                throw new Error(`Failed to fetch job files for rendering: ${renderJobFilesErr.message}`);
              }
              const renderSupportingDocs = (renderJobFiles || []).filter(
                (f) => !['rent_roll', 't12'].includes(f.doc_type)
              );

              const headers = { 'Content-Type': 'application/json' };
              const forwardedKey = req.headers['x-admin-run-key'];
              headers['x-admin-run-key'] = Array.isArray(forwardedKey)
                ? forwardedKey[0]
                : forwardedKey || process.env.ADMIN_RUN_KEY || '';

              const fetchUrl = `${baseUrl}/api/generate-client-report`;
              const reportRes = await fetch(fetchUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  userId: job.user_id,
                  property_name: job.property_name,
                  jobId: job.id,
                  supporting_documents: renderSupportingDocs,
                }),
              });

              if (!reportRes.ok) {
                const rawText = await reportRes.text();
                let failureBody = null;
                try {
                  failureBody = JSON.parse(rawText);
                  generatorErrorCode = String(failureBody?.error_code || generatorErrorCode);
                } catch {
                  generatorErrorCode = 'REPORT_RENDER_FAILED';
                }
                const providerDiagnostics = failureBody?.diagnostics?.provider_diagnostics || null;
                const providerDiagnosticsByAttempt =
                  failureBody?.diagnostics?.provider_diagnostics_by_attempt || null;
                generatorFailurePayload = {
                  status: reportRes.status,
                  response_text_preview: rawText.slice(0, 500),
                  has_admin_key: Boolean(headers['x-admin-run-key']),
                  target_url: fetchUrl,
                  ...(providerDiagnostics ? { provider_diagnostics: providerDiagnostics } : {}),
                  ...(providerDiagnosticsByAttempt
                    ? { provider_diagnostics_by_attempt: providerDiagnosticsByAttempt }
                    : {}),
                };
                if (
                  reportRes.status === 409 &&
                  rawText.includes('REVISION_LIMIT_REACHED')
                ) {
                  generatorError = 'Revision limit reached for this job.';
                } else {
                  generatorError = `Report generation failed (${reportRes.status})`;
                }
              } else {
                reportData = await reportRes.json().catch(() => ({}));
                const premiumJobStartSurfaceReceipt =
                  await loadLatestArtifactPayload(
                    job.id,
                    JOB_START_SURFACE_RECEIPT_ARTIFACT_TYPE,
                  );
                const premiumPublicationEnforcement =
                  enforcePremiumAcquisitionUnderwritingV1WorkerPublication({
                    jobSurfaceReceipt: premiumJobStartSurfaceReceipt,
                    externalCertificationReceipt:
                      reportData?.premium_underwriting_external_certification ||
                      null,
                  });
                if (premiumPublicationEnforcement.publicationBlocked === true) {
                  generatorErrorCode = 'REPORT_RENDER_FAILED';
                  generatorError =
                    'Promised premium underwriting certification was not established.';
                  generatorFailurePayload = {
                    failure_class: 'internal_system_failure',
                    customer_document_failure: false,
                    premium_underwriting_publication_enforcement:
                      premiumPublicationEnforcement,
                  };
                }
                const resolvedDeliveryDecision = resolveWorkerDeliveryDecision(reportData);
                const deliveryGateStatus = resolvedDeliveryDecision.deliveryGateStatus;
                const shouldHoldDeliveryOutcome =
                  (deliveryGateStatus === 'user_needs_documents' && !resolvedDeliveryDecision.coreValidRequiredCoverage) ||
                  resolvedDeliveryDecision.holdDelivery === true ||
                  resolvedDeliveryDecision.customerDeliveryAllowed === false;
                let publicationResolution = null;
                if (!generatorError && !shouldHoldDeliveryOutcome) {
                  try {
                    publicationResolution = await resolveOrCreateReportPublicationRecord({
                      supabaseAdmin,
                      job,
                      reportData,
                      existingReportId: reportId,
                      existingStoragePath: storagePath,
                      allowCreate: !shouldHoldDeliveryOutcome,
                      deliveryGateStatus: resolvedDeliveryDecision.deliveryGateStatus,
                      holdDelivery: resolvedDeliveryDecision.holdDelivery,
                    });
                  } catch (publicationErr) {
                    generatorErrorCode = 'STORAGE_PUBLICATION_FAILED';
                    generatorError = publicationErr?.message || 'Report generation failed (report publication resolution failed)';
                    generatorFailurePayload = {
                      error: generatorError,
                      has_report_data: Boolean(reportData),
                      has_final_html: Boolean(reportData?.final_html),
                      target_url: fetchUrl,
                    };
                  }
                }
                const resolvedReportId = publicationResolution?.reportId || reportId || null;
                const resolvedStoragePath =
                  publicationResolution?.storagePath ||
                  storagePath ||
                  (!shouldHoldDeliveryOutcome && resolvedReportId
                    ? buildReportStoragePath({ effectiveUserId: job.user_id, reportSeed: resolvedReportId })
                    : null);
                if (shouldHoldDeliveryOutcome) {
                  reportId = resolvedReportId;
                  storagePath = resolvedStoragePath;
                  generatorSource = publicationResolution?.publicationSource || generatorSource;
                } else if (generatorError) {
                  // Leave generatorError in place for the terminal failure handler below.
                } else if (!resolvedReportId) {
                  generatorError = `Report generation failed (${reportRes.status})`;
                } else {
                  try {
                    artifactResolution = await ensureReportDownloadArtifact({
                      supabaseAdmin,
                      job,
                      reportId: resolvedReportId,
                      storagePath: resolvedStoragePath,
                      finalHtml: reportData?.final_html || "",
                      reportType: reportData?.report_type || job.report_type || null,
                      reportSeed: resolvedReportId,
                      propertyName: job.property_name || "",
                      createdReportRecord: Boolean(publicationResolution?.createdReportRecord),
                      deliveryGateStatus: resolvedDeliveryDecision.deliveryGateStatus,
                      holdDelivery: resolvedDeliveryDecision.holdDelivery,
                      deterministicContractQaSeal: reportData?.deterministic_contract_qa_seal || null,
                      corePublishable: reportData?.core_publishable === true,
                      coreSafeHtml: reportData?.core_safe_html || "",
                      emergencyCoreHtml: reportData?.emergency_core_html || "",
                      sourceReconciliation: reportData?.source_reconciliation || null,
                      reportIdentity: {
                        reportMode: reportData?.report_mode || null,
                        reportType: reportData?.report_type || job.report_type || null,
                      },
                      reportDownloadArtifactMode: reportData?.pdf_artifact_mode || process.env.REPORT_DOWNLOAD_ARTIFACT_MODE || "",
                    });
                  } catch (artifactErr) {
                    generatorErrorCode = 'PDF_ARTIFACT_FAILED';
                    generatorError = artifactErr?.message || `Report generation failed (${reportRes.status})`;
                    generatorFailurePayload = {
                      error: generatorError,
                      has_report_data: Boolean(reportData),
                      has_final_html: Boolean(reportData?.final_html),
                      target_url: fetchUrl,
                      report_id: resolvedReportId,
                      storage_path: resolvedStoragePath,
                      final_pdf_publication_quality_boss:
                        artifactErr?.context?.final_pdf_publication_quality_boss || null,
                      provider_diagnostics: artifactErr?.context?.provider_diagnostics || null,
                      provider_diagnostics_by_attempt:
                        artifactErr?.context?.provider_diagnostics_by_attempt || null,
                    };
                  }
                  if (!generatorError) {
                    reportId = artifactResolution?.reportId || resolvedReportId;
                    storagePath = artifactResolution?.storagePath || resolvedStoragePath;
                    generatorSource =
                      artifactResolution?.artifactSource ||
                      publicationResolution?.publicationSource ||
                      generatorSource;
                    const publicationQualityBoss = artifactResolution?.publicationQualityBoss || null;
                    let revisionPromotionResolution = null;
                    try {
                      const persistedReportLink = await persistAnalysisJobReportLink(job, reportId);
                      if (!persistedReportLink?.id) {
                        throw new Error('Failed to persist canonical report linkage');
                      }
                      revisionPromotionResolution = await promoteReportRevisionToCurrent({
                        supabaseAdmin,
                        reportId,
                      });
                      if (!revisionPromotionResolution?.promoted) {
                        throw new Error(
                          revisionPromotionResolution?.stale === true
                            ? `Report revision promotion resolved stale for ${reportId}`
                            : `Report revision promotion did not establish current authority for ${reportId}`
                        );
                      }
                    } catch (promotionErr) {
                      generatorErrorCode = 'REPORT_PUBLICATION_FAILED';
                      generatorError = promotionErr?.message || 'Report generation failed (report promotion failed)';
                      generatorFailurePayload = {
                        error: generatorError,
                        has_report_data: Boolean(reportData),
                        has_final_html: Boolean(reportData?.final_html),
                        target_url: fetchUrl,
                        report_id: reportId,
                        storage_path: storagePath,
                      };
                    }
                    if (
                      resolvedDeliveryDecision.deliveryGateStatus === 'deliverable' &&
                      resolvedDeliveryDecision.holdDelivery !== true &&
                      resolvedDeliveryDecision.customerDeliveryAllowed === true &&
                      artifactResolution?.verifiedDownloadArtifact === true &&
                      pdfBossAllowsCustomerDelivery(publicationQualityBoss) &&
                      reportId &&
                      storagePath
                    ) {
                      verifiedPublicationCheckpoint = Object.freeze({
                        reportId,
                        storagePath,
                        verifiedDownloadArtifact: true,
                        publicationQualityBoss,
                      });
                    }
                  }
                }
              }
            }
          }

          if (generatorError) {
            const terminalFailureResult = await applyTerminalFailureOutcome(job, {
              fromStatus: 'rendering',
              errorCode: generatorErrorCode,
              errorMessage: generatorError,
              transitionMeta: { error: generatorError },
              restore: {
                enabled: true,
                reason: 'report_generation_failed',
                errorCode: generatorErrorCode,
                strict: false,
                logContext: 'report_generation_failed',
              },
            });
            await finalizeAndPersistBlockedManifest({
              job,
              reportData,
              reportId,
              storagePath,
              terminalCode: generatorErrorCode,
              terminalMessage: generatorError,
              creditState: terminalFailureResult?.creditRestoration || null,
              remedyState: { state: 'internal_review_required' },
              providerDiagnostics: generatorFailurePayload
                ? {
                    current: generatorFailurePayload.provider_diagnostics || null,
                    byAttempt: generatorFailurePayload.provider_diagnostics_by_attempt || null,
                  }
                : null,
            });

            transitions.push({
              job_id: job.id,
              from_status: 'rendering',
              to_status: 'failed',
            });
            passTransitions += 1;
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }

            const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation_failed', {
              error: generatorError,
              error_code: generatorErrorCode,
              timestamp: nowIso,
              ...(generatorFailurePayload || {}),
            });

            if (workerEventErr) {
              console.error(
                `[worker] Failed to write report generation failure artifact for job ${job.id}:`,
                workerEventErr.message
              );
            }

            continue;
          }

          const resolvedDeliveryDecision = resolveWorkerDeliveryDecision(reportData);
          const deliveryGateStatus = resolvedDeliveryDecision.deliveryGateStatus;
          const isTypedGateOutcome = deliveryGateStatus === 'user_needs_documents';
          const isResolvedHoldBlockedOutcome =
            deliveryGateStatus !== 'deliverable' ||
            resolvedDeliveryDecision.holdDelivery === true ||
            resolvedDeliveryDecision.customerDeliveryAllowed === false;
          const shouldHoldDeliveryOutcome = isTypedGateOutcome || isResolvedHoldBlockedOutcome;
          const holdOutcomeStatus = 'user_needs_documents';
          if (shouldHoldDeliveryOutcome) {
            const terminalErrorCode = resolveHeldDeliveryTerminalCode(resolvedDeliveryDecision);
            const terminalClassification = classifyTerminalFailureCode(terminalErrorCode);
            const customerDocumentFailure = terminalClassification.customer_document_replacement_required === true;
            const terminalFailureResult = await applyTerminalFailureOutcome(job, {
              fromStatus: 'rendering',
              errorCode: terminalErrorCode,
              errorMessage: customerDocumentFailure
                ? 'Report generation stopped because required core operating evidence was catastrophically unusable. No report was published.'
                : 'Report generation failed before publication. No report was published. The issue was logged for internal review.',
              transitionMeta: {
                report_id: reportId,
                reason:
                  resolvedDeliveryDecision.customerStatusReasonCode ||
                  resolvedDeliveryDecision.failClosedReasonCode ||
                  reportData?.delivery_gate_reason_code ||
                  'source_documents_missing',
              },
              restore: {
                enabled: !resolvedDeliveryDecision.coreValidRequiredCoverage &&
                  (resolvedDeliveryDecision.creditRestoreRequired || holdOutcomeStatus === 'user_needs_documents'),
                reason:
                  resolvedDeliveryDecision.failClosedReasonCode ||
                  resolvedDeliveryDecision.customerStatusReasonCode ||
                  'user_needs_documents',
                errorCode: terminalErrorCode,
                strict: false,
                logContext: 'needs-documents',
              },
            });
            await finalizeAndPersistBlockedManifest({
              job,
              reportData,
              reportId,
              storagePath,
              terminalCode: terminalErrorCode,
              terminalMessage: customerDocumentFailure
                ? 'Required core operating evidence was catastrophically unusable.'
                : 'An internal report or delivery contract blocked publication.',
              creditState: terminalFailureResult?.creditRestoration || null,
              remedyState: {
                state: customerDocumentFailure
                  ? 'replacement_source_required'
                  : 'internal_review_required',
              },
            });
            transitions.push({
              job_id: job.id,
              from_status: 'rendering',
              to_status: 'failed',
            });
            passTransitions += 1;
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            await writeWorkerEventArtifact(job.id, job.user_id, 'delivery_gate_decision', {
              ...reportData,
              resolved_delivery_decision: {
                delivery_gate_status: resolvedDeliveryDecision.deliveryGateStatus,
                customer_delivery_allowed: resolvedDeliveryDecision.customerDeliveryAllowed,
                hold_delivery: resolvedDeliveryDecision.holdDelivery,
                customer_status_reason_code: resolvedDeliveryDecision.customerStatusReasonCode,
                fail_closed_reason_code: resolvedDeliveryDecision.failClosedReasonCode,
                credit_restore_required: resolvedDeliveryDecision.creditRestoreRequired,
                canonical_precedence_applied: resolvedDeliveryDecision.hasCanonical,
                legacy_alias_conflicts: resolvedDeliveryDecision.legacyAliasConflicts,
              },
              timestamp: nowIso,
            });
            continue;
          }
          if (!reportId || !storagePath) {
            const missingDeliverableArtifact = !reportId ? 'reportId' : 'storagePath';
            generatorError = `Report generation failed (${missingDeliverableArtifact} missing for deliverable path)`;
            const terminalFailureResult = await applyTerminalFailureOutcome(job, {
              fromStatus: 'rendering',
              errorCode: 'PDF_ARTIFACT_FAILED',
              errorMessage: generatorError,
              transitionMeta: { error: generatorError },
              restore: {
                enabled: true,
                reason: 'report_generation_failed',
                errorCode: 'PDF_ARTIFACT_FAILED',
                strict: false,
                logContext: 'deliverable-missing-artifact',
              },
            });
            await finalizeAndPersistBlockedManifest({
              job,
              reportData,
              reportId,
              storagePath,
              terminalCode: 'PDF_ARTIFACT_FAILED',
              terminalMessage: generatorError,
              creditState: terminalFailureResult?.creditRestoration || null,
              remedyState: { state: 'internal_review_required' },
            });
            transitions.push({
              job_id: job.id,
              from_status: 'rendering',
              to_status: 'failed',
            });
            passTransitions += 1;
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation_failed', {
              error: generatorError,
              error_code: 'REPORT_GENERATION_FAILED',
              timestamp: nowIso,
            });
            if (workerEventErr) {
              console.error(
                `[worker] Failed to write report generation failure artifact for job ${job.id}:`,
                workerEventErr.message
              );
            }
            continue;
          }

          const hasExplicitDeliverableAuthority = () =>
            resolvedDeliveryDecision.deliveryGateStatus === 'deliverable' &&
            resolvedDeliveryDecision.holdDelivery !== true &&
            resolvedDeliveryDecision.customerDeliveryAllowed === true;

          const reportEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation', {
            source: generatorSource,
            report_id: reportId,
            storage_path: storagePath,
            final_html: typeof reportData?.final_html === 'string' ? reportData.final_html : null,
            final_html_length: typeof reportData?.final_html === 'string' ? reportData.final_html.length : 0,
            final_pdf_publication_quality_boss:
              artifactResolution?.publicationQualityBoss ||
              reportData?.final_pdf_publication_quality_boss ||
              null,
            timestamp: nowIso,
          });

          if (reportEventErr) {
            throw new Error(`Failed to write report generation artifact: ${reportEventErr.message}`);
          }

          if (!hasExplicitDeliverableAuthority()) {
            throw new Error('Delivery gate blocked before pdf_generating');
          }

          const pdfGeneratingUpdate = await transitionWorkerJob(job, 'rendering', 'pdf_generating', {
            user_id: job.user_id,
            report_id: reportId,
          });

          if (!pdfGeneratingUpdate?.id) {
            continue;
          }

          transitions.push({
            job_id: job.id,
            from_status: 'rendering',
            to_status: 'pdf_generating',
          });
          passTransitions += 1;
          const pdfTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            'rendering',
            'pdf_generating',
            { user_id: job.user_id, report_id: reportId }
          );

          if (pdfTransitionErr) {
            throw new Error(`Failed to write status transition artifact: ${pdfTransitionErr.message}`);
          }

          if (!hasExplicitDeliverableAuthority()) {
            throw new Error('Delivery gate blocked before publishing');
          }

          const publishingUpdate = await transitionWorkerJob(job, 'pdf_generating', 'publishing', {
            user_id: job.user_id,
            report_id: reportId,
          });

          if (!publishingUpdate?.id) {
            continue;
          }

          transitions.push({
            job_id: job.id,
            from_status: 'pdf_generating',
            to_status: 'publishing',
          });
          passTransitions += 1;
          const publishingTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            'pdf_generating',
            'publishing',
            { user_id: job.user_id, report_id: reportId }
          );

          if (publishingTransitionErr) {
            throw new Error(`Failed to write status transition artifact: ${publishingTransitionErr.message}`);
          }

          if (!hasExplicitDeliverableAuthority()) {
            throw new Error('Delivery gate blocked before published');
          }

          const publishedUpdate = await transitionWorkerJob(job, 'publishing', 'published', {
            user_id: job.user_id,
            report_id: reportId,
          });

          if (!publishedUpdate?.id) {
            continue;
          }

          if (supportsCompletedAt) {
            const { error: completedErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update({ completed_at: nowIso })
              .eq('id', job.id)
              .eq('worker_attempt_id', job.worker_attempt_id || null)
              .eq('status', 'published');

            if (completedErr) {
              throw new Error(`Failed to mark job published: ${completedErr.message}`);
            }
          }

          transitions.push({
            job_id: job.id,
            from_status: 'publishing',
            to_status: 'published',
          });
          passTransitions += 1;
          const completedTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            'publishing',
            'published',
            { user_id: job.user_id, report_id: reportId }
          );

          if (completedTransitionErr) {
            throw new Error(`Failed to write status transition artifact: ${completedTransitionErr.message}`);
          }

          const creditResult = await consumeCreditOnce(job);
          if (creditResult.error) {
            throw new Error(`Credit deduction failed: ${creditResult.error.message}`);
          }

          const manifestCandidate = reportData?.report_quality_manifest_candidate || null;
          if (manifestCandidate) {
            try {
              const publicationQualityBoss =
                artifactResolution?.publicationQualityBoss ||
                reportData?.final_pdf_publication_quality_boss ||
                null;
              const reportQualityManifest = finalizeReportQualityManifest({
                candidate: manifestCandidate,
                reportId,
                storagePath,
                deliveryDecision: resolvedDeliveryDecision.deliveryDecisionState,
                finalPdfPublicationQualityBoss: publicationQualityBoss,
                publicationState: 'published',
                creditState: {
                  state: 'reconciled',
                  consumed: creditResult.ok === true,
                  previouslyConsumedOrPrepaid: creditResult.skipped === true,
                },
                remedyState: { state: 'not_required' },
                finalizedAt: nowIso,
              });
              const manifestArtifactPath = `analysis_jobs/${job.id}/report_quality_manifest/${safeTimestamp(
                nowIso
              )}.json`;
              const { error: manifestArtifactErr } = await supabaseAdmin
                .from('analysis_artifacts')
                .insert([
                  {
                    job_id: job.id,
                    user_id: job.user_id,
                    type: 'report_quality_manifest',
                    bucket: 'internal',
                    object_path: manifestArtifactPath,
                    payload: reportQualityManifest,
                  },
                ]);
              if (manifestArtifactErr) {
                throw new Error(`Failed to persist Report Quality Manifest: ${manifestArtifactErr.message}`);
              }
            } catch (manifestErr) {
              console.error(
                `[worker] Report Quality Manifest finalization requires internal repair for job ${job.id}:`,
                manifestErr?.context || manifestErr?.message || manifestErr
              );
              const manifestFailureEventErr = await writeWorkerEventArtifact(
                job.id,
                job.user_id,
                'report_quality_manifest_finalize_failed',
                {
                  code: 'REPORT_QUALITY_MANIFEST_FINALIZE_FAILED',
                  internal_only: true,
                  customer_delivery_unchanged: true,
                  report_id: reportId,
                  storage_path: storagePath,
                  error: String(manifestErr?.message || manifestErr || ''),
                  validation: manifestErr?.context?.validation || null,
                  timestamp: nowIso,
                }
              );
              if (manifestFailureEventErr) {
                console.error(
                  `[worker] Failed to write Report Quality Manifest repair event for job ${job.id}:`,
                  manifestFailureEventErr.message
                );
              }
            }
          } else if (generatorSource !== 'existing_report') {
            const manifestMissingEventErr = await writeWorkerEventArtifact(
              job.id,
              job.user_id,
              'report_quality_manifest_candidate_missing',
              {
                code: 'REPORT_QUALITY_MANIFEST_CANDIDATE_MISSING',
                internal_only: true,
                customer_delivery_unchanged: true,
                report_id: reportId,
                storage_path: storagePath,
                timestamp: nowIso,
              }
            );
            if (manifestMissingEventErr) {
              console.error(
                `[worker] Failed to write missing Report Quality Manifest candidate event for job ${job.id}:`,
                manifestMissingEventErr.message
              );
            }
          }

          const { data: publishedEmail } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('id')
            .eq('job_id', job.id)
            .eq('type', 'email_sent')
            .eq('bucket', 'system')
            .eq('payload->>email_type', 'report_published')
            .limit(1)
            .maybeSingle();

          if (!publishedEmail?.id) {
            try {
              const { data: userRes, error: userErr } =
                await supabaseAdmin.auth.admin.getUserById(job.user_id);

              if (userErr) {
                throw userErr;
              }

              const userEmail = userRes?.user?.email;
              if (!userEmail) {
                throw new Error('Missing user email');
              }

              const { data: profileRow, error: profileErr } = await supabaseAdmin
                .from('profiles')
                .select('full_name')
                .eq('id', job.user_id)
                .maybeSingle();

              if (profileErr) {
                throw profileErr;
              }

              const fullName = String(profileRow?.full_name || '').trim();
              const firstName = fullName ? fullName.split(/\s+/)[0] : 'Investor';

              await sendEmailResend({
                to: userEmail,
                subject: 'Your InvestorIQ report is ready',
                text:
                  `Hello ${firstName},\n\n` +
                  'Your InvestorIQ report has been published and is now available in your dashboard.\n\n' +
                  'Please log in to review and download your report.\n\n' +
                  'Thanks,\n\n' +
                  'InvestorIQ Team',
              });

              await supabaseAdmin.from('analysis_artifacts').insert([
                {
                  job_id: job.id,
                  user_id: job.user_id,
                  type: 'email_sent',
                  bucket: 'system',
                  object_path: `analysis_jobs/${job.id}/email_sent/report_published/${safeTimestamp(
                    nowIso
                  )}.json`,
                  payload: {
                    email_type: 'report_published',
                    job_id: job.id,
                    user_id: job.user_id,
                    timestamp: nowIso,
                  },
                },
              ]);
            } catch (err) {
              console.error('Failed to send report_published email:', err?.message || err);
            }
          }
          await writeValidatorDiagnosticsRollup({ jobId: job.id, userIdHint: job.user_id });
          rollupWrittenJobIds.add(job.id);
          } catch (err) {
            if (verifiedPublicationCheckpoint) {
              const preservationResult = await preserveVerifiedPublicationAfterLateWorkerError(
                job,
                verifiedPublicationCheckpoint,
                err
              );
              if (preservationResult.preserved) {
                if (
                  preservationResult.jobStatusUpdated &&
                  !transitions.some(
                    (transition) => transition.job_id === job.id && transition.to_status === 'published'
                  )
                ) {
                  transitions.push({
                    job_id: job.id,
                    from_status: 'verified_publication_checkpoint',
                    to_status: 'published',
                  });
                  passTransitions += 1;
                }
                continue;
              }
            }
            // } await recordJobFailure(job, 'rendering', err);
            const failureOutcome = await recordJobFailure(job, 'rendering', err);
            if (!failureOutcome?.stale) {
              await finalizeAndPersistBlockedManifest({
                job,
                terminalCode: String(err?.code || 'REPORT_RENDER_FAILED').toUpperCase(),
                terminalMessage: err?.message || 'Unhandled worker failure before publication.',
                creditState: { state: 'restoration_status_unknown' },
                remedyState: { state: 'internal_review_required' },
              });
              if (!failedJobIds.includes(job.id)) {
                failedJobIds.push(job.id);
              }
            }
            continue;
          }
        }
      }

      passesRun += 1;

      if (passTransitions === 0) {
        break;
      }
    }

    for (const job of timedOutJobs) {
      if (!failedJobIds.includes(job.id)) {
        failedJobIds.push(job.id);
      }
    }

    const publishedJobIds = transitions
      .filter((t) => String(t?.to_status || '') === 'published')
      .map((t) => t.job_id)
      .filter(Boolean);
    const terminalRollupJobIds = Array.from(new Set([...failedJobIds, ...blockedJobIds, ...publishedJobIds]))
      .filter((jobId) => !rollupWrittenJobIds.has(jobId));
    for (const rollupJobId of terminalRollupJobIds) {
      await writeValidatorDiagnosticsRollup({ jobId: rollupJobId });
      rollupWrittenJobIds.add(rollupJobId);
    }

    const advancedJobIds = Array.from(new Set(transitions.map((t) => t.job_id)));
    return res.status(200).json({
      ok: true,
      advancedCount: transitions.length,
      blockedNeedsDocumentsCount: blockedJobIds.length,
      failedCount: failedJobIds.length,
      advancedJobIds,
      blockedJobIds,
      failedJobIds,
      transitions,
      passesRun: passesRun,
    });
  } catch (err) {
    console.error('admin-run-worker error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
