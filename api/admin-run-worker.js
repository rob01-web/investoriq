import { createClient } from '@supabase/supabase-js';
import { sendEmailSES } from './_lib/email-ses.js';

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
    const jobLimit = Math.max(1, Number(req.headers['x-job-limit'] || req.query?.limit || 25));
    const timeoutCutoff = new Date(now.getTime() - 60 * 60 * 1000);
    const inProgressStatuses = [
      'queued',
      'validating_inputs',
      'extracting',
      'underwriting',
      'scoring',
      'rendering',
      'pdf_generating',
      'publishing',
    ];

    const safeTimestamp = (iso) => (iso || '').replace(/:/g, '-');

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

    const recordJobFailure = async (job, stage, err) => {
      const safeMessage =
        `Processing failed during ${stage}. ` +
        'Please log in to your InvestorIQ dashboard to upload replacement documents or try again.';
      const update = { status: 'failed' };
      if (supportsFailedAt) {
        update.failed_at = nowIso;
      }
      if (supportsErrorCode) {
        update.error_code = stage === 'extracting' ? 'PARSER_ERROR' : 'WORKER_ERROR';
      }
      if (supportsErrorMessage) {
        update.error_message = safeMessage;
      }

      await supabaseAdmin.from('analysis_jobs').update(update).eq('id', job.id);

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
        const failUpdate = { status: 'failed' };
        if (supportsFailedAt) {
          failUpdate.failed_at = nowIso;
        }

        const { error: failErr } = await supabaseAdmin
          .from('analysis_jobs')
          .update(failUpdate)
          .eq('id', job.id);

        if (failErr) {
          return { error: failErr };
        }

        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          'publishing',
          'failed',
          { user_id: job.user_id, error: 'Insufficient credits' }
        );

        if (transitionErr) {
          return { error: transitionErr };
        }

        const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'credit_failed', {
          reason: 'Insufficient credits',
          credits_available: currentCredits,
          timestamp: nowIso,
        });

        if (workerEventErr) {
          return { error: workerEventErr };
        }

        return { failed: true };
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

    const allowedReportTypes = ['screening', 'underwriting', 'ic'];
    const rawReportType = String(req.body?.report_type || req.query?.report_type || '').toLowerCase();
    const reportType = allowedReportTypes.includes(rawReportType) ? rawReportType : 'screening';

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

    // Timeout guard: mark long-running jobs as failed
    const { data: inProgressJobs, error: inProgressError } = await supabase
      .from('analysis_jobs')
      .select('id, user_id, status, started_at, created_at')
      .in('status', inProgressStatuses);

    if (inProgressError) {
      return res.status(500).json({
        error: 'Failed to fetch in-progress jobs',
        details: inProgressError.message,
      });
    }

    const timedOutJobs = (inProgressJobs || []).filter((job) => {
      const startedAt = job.started_at ? new Date(job.started_at) : null;
      const createdAt = job.created_at ? new Date(job.created_at) : null;
      const anchor = startedAt || createdAt;
      return anchor ? anchor <= timeoutCutoff : false;
    });

    if (timedOutJobs.length > 0) {
      const timedOutIds = timedOutJobs.map((job) => job.id);
      const timeoutUpdate = { status: 'failed' };
      if (supportsFailedAt) {
        timeoutUpdate.failed_at = nowIso;
      }
      if (supportsErrorCode) {
        timeoutUpdate.error_code = 'TIMEOUT';
      }
      if (supportsErrorMessage) {
        timeoutUpdate.error_message =
          'Processing timed out. Please log in to your InvestorIQ dashboard to retry or upload replacement documents.';
      }
      const { error: failErr } = await supabaseAdmin
        .from('analysis_jobs')
        .update(timeoutUpdate)
        .in('id', timedOutIds);

      if (failErr) {
        return res.status(500).json({ error: 'Failed to mark timed-out jobs', details: failErr.message });
      }

      for (const job of timedOutJobs) {
        const transitionErr = await writeStatusTransitionArtifact(
          job.id,
          job.status,
          'failed',
          { event: 'timeout', threshold_minutes: 60, user_id: job.user_id }
        );

        if (transitionErr) {
          return res.status(500).json({
            error: 'Failed to write timeout status transition artifact',
            details: transitionErr.message,
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
          threshold_minutes: 60,
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
    let passesRun = 0;
    const maxPasses = 10;
    const maxSeconds = 20;
    const startTime = Date.now();
    const baseUrl = (process.env.PUBLIC_SITE_URL || 'https://investoriq.tech').replace(/\/$/, '');

    while (passesRun < maxPasses && (Date.now() - startTime) / 1000 < maxSeconds) {
      nowIso = new Date().toISOString();
      let passTransitions = 0;

      // Pull a small batch of queued jobs
      const { data: queuedJobs, error: queuedErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at')
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(jobLimit);

      if (queuedErr) {
        return res.status(500).json({ error: 'Failed to fetch queued jobs', details: queuedErr.message });
      }

      const { data: extractingJobs, error: extractingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at')
        .eq('status', 'extracting')
        .order('created_at', { ascending: true })
        .limit(jobLimit);

      if (extractingErr) {
        return res.status(500).json({ error: 'Failed to fetch extracting jobs', details: extractingErr.message });
      }

      if (queuedJobs && queuedJobs.length > 0) {
        for (const job of queuedJobs) {
          try {
            const claimUpdate = {
              status: 'extracting',
              started_at: nowIso,
            };
            if (supportsReportType) {
              claimUpdate.report_type = reportType;
            }
            const { data: claimed, error: claimErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update(claimUpdate)
              .eq('id', job.id)
              .eq('status', 'queued')
              .select('id, user_id, status');

            if (claimErr) {
              throw new Error(`Failed to advance queued jobs: ${claimErr.message}`);
            }

            if (!claimed || claimed.length === 0) {
              continue;
            }

            transitions.push({
              job_id: job.id,
              from_status: 'queued',
              to_status: 'extracting',
            });
            passTransitions += 1;
            const transitionErr = await writeStatusTransitionArtifact(
              job.id,
              'queued',
              'extracting',
              { user_id: job.user_id }
            );

            if (transitionErr) {
              throw new Error(`Failed to write status transition artifact: ${transitionErr.message}`);
            }
          } catch (err) {
            await recordJobFailure(job, 'queued', err);
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }
        }
      }

      if (extractingJobs && extractingJobs.length > 0) {
        for (const job of extractingJobs) {
          try {
          const { data: jobFiles, error: jobFilesErr } = await supabaseAdmin
            .from('analysis_job_files')
            .select('id, doc_type, original_filename, object_path, mime_type, parse_status, parse_error')
            .eq('job_id', job.id);

          if (jobFilesErr) {
            throw new Error(`Failed to fetch job files: ${jobFilesErr.message}`);
          }

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

          const otherPendingFiles = (jobFiles || []).filter((file) => {
            const docType = String(file.doc_type || '').toLowerCase();
            const isPending = String(file.parse_status || '').toLowerCase() === 'pending';
            return docType === 'other' && isPending;
          });

          if (otherPendingFiles.length > 0) {
            for (const file of otherPendingFiles) {
              try {
                const supportingRes = await fetch(`${baseUrl}/api/parse/parse-doc`, {
                  method: 'POST',
                  headers: parserHeaders,
                  body: JSON.stringify({ job_id: job.id, file_id: file.id, doc_type: file.doc_type }),
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

          const { data: structuredArtifacts, error: structuredErr } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('id, type')
            .eq('job_id', job.id)
            .in('type', ['rent_roll_parsed', 't12_parsed']);

          if (structuredErr) {
            throw new Error(`Failed to check structured financial artifacts: ${structuredErr.message}`);
          }

          const hasRentRollParsed = (structuredArtifacts || []).some((artifact) => artifact.type === 'rent_roll_parsed');
          const hasT12Parsed = (structuredArtifacts || []).some((artifact) => artifact.type === 't12_parsed');

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
                (file) => String(file.doc_type || '').toLowerCase() === 'rent_roll' && isStructuredSpreadsheet(file)
              );
              const hasStructuredT12 = relevantFiles.some(
                (file) => String(file.doc_type || '').toLowerCase() === 't12' && isStructuredSpreadsheet(file)
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

                const needsDocsUpdate = { status: 'needs_documents' };
                if (supportsErrorCode) {
                  needsDocsUpdate.error_code = 'MISSING_STRUCTURED_FINANCIALS';
                }
                if (supportsErrorMessage) {
                  needsDocsUpdate.error_message =
                    'A spreadsheet version of your Rent Roll and T12/Operating Statement is required to complete underwriting. Please upload XLSX or CSV.';
                }

                const { error: needsDocsErr } = await supabaseAdmin
                  .from('analysis_jobs')
                  .update(needsDocsUpdate)
                  .eq('id', job.id)
                  .eq('status', 'extracting');

                if (needsDocsErr) {
                  throw new Error(`Failed to mark job needs_documents: ${needsDocsErr.message}`);
                }

                const needsDocsTransitionErr = await writeStatusTransitionArtifact(
                  job.id,
                  'extracting',
                  'needs_documents',
                  { user_id: job.user_id }
                );

                if (needsDocsTransitionErr) {
                  throw new Error(
                    `Failed to write extracting->needs_documents status transition artifact: ${needsDocsTransitionErr.message}`
                  );
                }

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
                        'A spreadsheet version of your Rent Roll and T12/Operating Statement is required to complete underwriting. Please upload XLSX or CSV.',
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

                  if (!existingEmail?.id) {
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

                      await sendEmailSES({
                        to: userEmail,
                        subject: 'Action required: documents needed to continue your InvestorIQ report',
                        text:
                          `Hello ${firstName},\n\n` +
                          'Your InvestorIQ report cannot proceed yet.\n\n' +
                          'We could not identify structured financial documents required for underwriting.\n\n' +
                          'Required:\n' +
                          '- Rent Roll\n' +
                          '- T12 (Operating Statement)\n\n' +
                          'Please log in to your InvestorIQ dashboard\n' +
                          'and upload the required documents to continue processing.\n\n' +
                          'This report will remain paused until required documents are available.',
                      });

                      await supabaseAdmin.from('analysis_artifacts').insert([
                        {
                          job_id: job.id,
                          user_id: job.user_id,
                          type: 'email_sent',
                          bucket: 'system',
                          object_path: `analysis_jobs/${job.id}/email_sent/missing_structured_financials/${safeTimestamp(
                            nowIso
                          )}.json`,
                          payload: {
                            email_type: 'missing_structured_financials',
                            job_id: job.id,
                            user_id: job.user_id,
                            timestamp: nowIso,
                          },
                        },
                      ]);
                    } catch (err) {
                      console.error('Failed to send missing_structured_financials email:', err?.message || err);
                    }
                  }
                }

                continue;
              }

              const anyPending = relevantFiles.some(
                (file) => String(file.parse_status || '').toLowerCase() === 'pending'
              );

              if (anyPending) {
                const hasPendingRentRoll = relevantFiles.some((file) => {
                  const dt = String(file.doc_type || '').toLowerCase();
                  const isPending = String(file.parse_status || '').toLowerCase() === 'pending';
                  return isPending && dt === 'rent_roll' && isStructuredSpreadsheet(file);
                });
                const hasPendingT12 = relevantFiles.some((file) => {
                  const dt = String(file.doc_type || '').toLowerCase();
                  const isPending = String(file.parse_status || '').toLowerCase() === 'pending';
                  return isPending && dt === 't12' && isStructuredSpreadsheet(file);
                });

                if (hasPendingRentRoll) {
                  for (const pendingFile of relevantFiles.filter((item) => {
                    const dt = String(item.doc_type || '').toLowerCase();
                    const isPending = String(item.parse_status || '').toLowerCase() === 'pending';
                    return dt === 'rent_roll' && isPending && isStructuredSpreadsheet(item);
                  })) {
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
                    }
                  }
                }

                if (hasPendingT12) {
                  for (const pendingFile of relevantFiles.filter((item) => {
                    const dt = String(item.doc_type || '').toLowerCase();
                    const isPending = String(item.parse_status || '').toLowerCase() === 'pending';
                    return dt === 't12' && isPending && isStructuredSpreadsheet(item);
                  })) {
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
                    }
                  }
                }

                passTransitions += 1;
                continue;
              }
            }

            const { error: needsDocsErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update({ status: 'needs_documents' })
              .eq('id', job.id)
              .eq('status', 'extracting');

            if (needsDocsErr) {
              throw new Error(`Failed to mark job needs_documents: ${needsDocsErr.message}`);
            }

            const needsDocsTransitionErr = await writeStatusTransitionArtifact(
              job.id,
              'extracting',
              'needs_documents',
              { user_id: job.user_id }
            );

            if (needsDocsTransitionErr) {
              throw new Error(
                `Failed to write extracting->needs_documents status transition artifact: ${needsDocsTransitionErr.message}`
              );
            }

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
                  code: 'NO_STRUCTURED_FINANCIALS',
                  level: 'error',
                  error_message:
                    'No rent roll or T12 has been parsed yet. Job will remain in needs_documents until structured financials are available.',
                  missing: ['rent_roll', 't12_or_operating_statement'],
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

              if (!existingEmail?.id) {
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

                  await sendEmailSES({
                    to: userEmail,
                    subject: 'Action required: documents needed to continue your InvestorIQ report',
                    text:
                      `Hello ${firstName},\n\n` +
                      'Your InvestorIQ report cannot proceed yet.\n\n' +
                      'We could not identify structured financial documents required for underwriting.\n\n' +
                      'Required:\n' +
                      '- Rent Roll\n' +
                      '- T12 (Operating Statement)\n\n' +
                      'Please log in to your InvestorIQ dashboard\n' +
                      'and upload the required documents to continue processing.\n\n' +
                      'This report will remain paused until required documents are available.',
                  });

                  await supabaseAdmin.from('analysis_artifacts').insert([
                    {
                      job_id: job.id,
                      user_id: job.user_id,
                      type: 'email_sent',
                      bucket: 'system',
                      object_path: `analysis_jobs/${job.id}/email_sent/missing_structured_financials/${safeTimestamp(
                        nowIso
                      )}.json`,
                      payload: {
                        email_type: 'missing_structured_financials',
                        job_id: job.id,
                        user_id: job.user_id,
                        timestamp: nowIso,
                      },
                    },
                  ]);
                } catch (err) {
                  console.error('Failed to send missing_structured_financials email:', err?.message || err);
                }
              }
            }
            continue;
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

          const { data: extractingUpdate, error: extractingUpdErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'underwriting' })
            .eq('id', job.id)
            .eq('status', 'extracting')
            .select('id')
            .maybeSingle();

          if (extractingUpdErr) {
            throw new Error(`Failed to advance extracting job: ${extractingUpdErr.message}`);
          }

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
          } catch (err) {
            await recordJobFailure(job, 'extracting', err);
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }
        }
      }

      const { data: underwritingJobs, error: underwritingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at')
        .eq('status', 'underwriting')
        .order('created_at', { ascending: true })
        .limit(jobLimit);

      if (underwritingErr) {
        return res.status(500).json({ error: 'Failed to fetch underwriting jobs', details: underwritingErr.message });
      }

      if (underwritingJobs && underwritingJobs.length > 0) {
        for (const job of underwritingJobs) {
          try {
          const { data: underwritingClaim, error: underwritingUpdErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'scoring' })
            .eq('id', job.id)
            .eq('status', 'underwriting')
            .select('id');

          if (underwritingUpdErr) {
            throw new Error(`Failed to advance underwriting jobs: ${underwritingUpdErr.message}`);
          }

          if (!underwritingClaim || underwritingClaim.length === 0) {
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
            await recordJobFailure(job, 'underwriting', err);
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }
        }
      }

      const { data: scoringJobs, error: scoringErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, created_at, property_name')
        .eq('status', 'scoring')
        .order('created_at', { ascending: true })
        .limit(Math.min(jobLimit, 5));

      if (scoringErr) {
        return res.status(500).json({ error: 'Failed to fetch scoring jobs', details: scoringErr.message });
      }

      if (scoringJobs && scoringJobs.length > 0) {
        for (const job of scoringJobs) {
          try {
          const { data: renderingUpdate, error: renderingErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'rendering' })
            .eq('id', job.id)
            .eq('status', 'scoring')
            .select('id')
            .maybeSingle();

          if (renderingErr) {
            throw new Error(`Failed to advance scoring job: ${renderingErr.message}`);
          }

          if (!renderingUpdate?.id) {
            continue;
          }

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

          const { data: requiredArtifacts, error: requiredErr } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('id, type')
            .eq('job_id', job.id)
            .in('type', ['rent_roll_parsed', 't12_parsed']);

          if (requiredErr) {
            throw new Error(`Failed to check required document artifacts: ${requiredErr.message}`);
          }

          const hasRentRoll = (requiredArtifacts || []).some((artifact) => artifact.type === 'rent_roll_parsed');
          const hasT12 = (requiredArtifacts || []).some((artifact) => artifact.type === 't12_parsed');

          if (!hasRentRoll || !hasT12) {
            const missing = [];
            if (!hasRentRoll) missing.push('rent_roll');
            if (!hasT12) missing.push('t12');

            const { error: needsDocsErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update({ status: 'needs_documents' })
              .eq('id', job.id)
              .eq('status', 'rendering');

            if (needsDocsErr) {
              throw new Error(`Failed to mark job needs_documents: ${needsDocsErr.message}`);
            }

            const needsDocsTransitionErr = await writeStatusTransitionArtifact(
              job.id,
              'rendering',
              'needs_documents',
              { user_id: job.user_id }
            );

            if (needsDocsTransitionErr) {
              throw new Error(
                `Failed to write rendering->needs_documents status transition artifact: ${needsDocsTransitionErr.message}`
              );
            }

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

            if (!existingEmail?.id) {
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

                await sendEmailSES({
                  to: userEmail,
                  subject: 'Action required: documents needed to continue your InvestorIQ report',
                  text:
                    `Hello ${firstName},\n\n` +
                    'Your InvestorIQ report cannot proceed yet.\n\n' +
                    'We could not identify structured financial documents required for underwriting.\n\n' +
                    'Required:\n' +
                    '- Rent Roll\n' +
                    '- T12 (Operating Statement)\n\n' +
                    'Please log in to your InvestorIQ dashboard\n' +
                    'and upload the required documents to continue processing.\n\n' +
                    'This report will remain paused until required documents are available.',
                });

                await supabaseAdmin.from('analysis_artifacts').insert([
                  {
                    job_id: job.id,
                    user_id: job.user_id,
                    type: 'email_sent',
                    bucket: 'system',
                    object_path: `analysis_jobs/${job.id}/email_sent/missing_structured_financials/${safeTimestamp(
                      nowIso
                    )}.json`,
                    payload: {
                      email_type: 'missing_structured_financials',
                      job_id: job.id,
                      user_id: job.user_id,
                      timestamp: nowIso,
                    },
                  },
                ]);
              } catch (err) {
                console.error('Failed to send missing_structured_financials email:', err?.message || err);
              }
            }

            continue;
          }

          let reportId = null;
          let storagePath = null;
          let generatorSource = 'generate-client-report';
          let generatorError = null;
          let generatorFailurePayload = null;

          if (!job.user_id) {
            generatorError = 'Missing user_id for report generation.';
          }

          if (job.user_id) {
            const reportQuery = supabaseAdmin
              .from('reports')
              .select('id, storage_path, created_at')
              .eq('user_id', job.user_id);

            if (job.property_name) {
              reportQuery.eq('property_name', job.property_name);
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

            if (existingReports && existingReports.length > 0 && existingReports[0].storage_path) {
              reportId = existingReports[0].id;
              storagePath = existingReports[0].storage_path;
              generatorSource = 'existing_report';
            }
          }

          if (!storagePath) {
            if (!baseUrl) {
              generatorError = 'Missing base URL for report generation.';
            } else {
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
                }),
              });

              if (!reportRes.ok) {
                const rawText = await reportRes.text();
                generatorFailurePayload = {
                  status: reportRes.status,
                  response_text_preview: rawText.slice(0, 500),
                  has_admin_key: Boolean(headers['x-admin-run-key']),
                  target_url: fetchUrl,
                };
                generatorError = `Report generation failed (${reportRes.status})`;
              } else {
                const reportData = await reportRes.json().catch(() => ({}));
                if (!reportData?.reportId) {
                  generatorError = `Report generation failed (${reportRes.status})`;
                } else {
                  reportId = reportData.reportId;
                  storagePath = `${job.user_id}/${reportId}.pdf`;
                }
              }
            }
          }

          if (generatorError) {
            const failUpdate = { status: 'failed' };
            if (supportsFailedAt) {
              failUpdate.failed_at = nowIso;
            }
            if (supportsErrorCode) {
              failUpdate.error_code = 'REPORT_GENERATION_FAILED';
            }
            if (supportsErrorMessage) {
              failUpdate.error_message = generatorError;
            }
            const { error: failErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update(failUpdate)
              .eq('id', job.id);

            if (failErr) {
              throw new Error(`Failed to mark scoring job failed: ${failErr.message}`);
            }

            transitions.push({
              job_id: job.id,
              from_status: 'rendering',
              to_status: 'failed',
            });
            passTransitions += 1;
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }

            const failedTransitionErr = await writeStatusTransitionArtifact(
              job.id,
              'rendering',
              'failed',
              { user_id: job.user_id, error: generatorError }
            );

            if (failedTransitionErr) {
              throw new Error(
                `Failed to write failed status transition artifact: ${failedTransitionErr.message}`
              );
            }

            const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation_failed', {
              error: generatorError,
              timestamp: nowIso,
              ...(generatorFailurePayload || {}),
            });

            if (workerEventErr) {
              throw new Error(
                `Failed to write report generation failure artifact: ${workerEventErr.message}`
              );
            }

            continue;
          }

          const reportEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation', {
            source: generatorSource,
            report_id: reportId,
            storage_path: storagePath,
            timestamp: nowIso,
          });

          if (reportEventErr) {
            throw new Error(`Failed to write report generation artifact: ${reportEventErr.message}`);
          }

          const { error: pdfGenErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'pdf_generating' })
            .eq('id', job.id);

          if (pdfGenErr) {
            throw new Error(`Failed to advance job to pdf_generating: ${pdfGenErr.message}`);
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

          const { error: publishingErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'publishing' })
            .eq('id', job.id);

          if (publishingErr) {
            throw new Error(`Failed to advance job to publishing: ${publishingErr.message}`);
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

          const creditResult = await consumeCreditOnce(job);
          if (creditResult?.error) {
            throw new Error(
              `Failed to consume credits: ${creditResult.error.message || String(creditResult.error)}`
            );
          }

          if (creditResult?.failed) {
            transitions.push({
              job_id: job.id,
              from_status: 'publishing',
              to_status: 'failed',
            });
            passTransitions += 1;
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
            }
            continue;
          }

          const completeUpdate = { status: 'published' };
          if (supportsCompletedAt) {
            completeUpdate.completed_at = nowIso;
          }

          const { error: completedErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update(completeUpdate)
            .eq('id', job.id);

          if (completedErr) {
            throw new Error(`Failed to mark job published: ${completedErr.message}`);
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

              await sendEmailSES({
                to: userEmail,
                subject: 'Your InvestorIQ report is ready',
                text:
                  `Hello ${firstName},\n\n` +
                  'Your InvestorIQ report has been completed and is now available in your dashboard.\n\n' +
                  'Please log in to your InvestorIQ dashboard\n' +
                  'to review and download your report.\n\n' +
                  'If you have additional documents or wish to run another analysis,\n' +
                  'you may start a new report from your dashboard.',
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
          } catch (err) {
            await recordJobFailure(job, 'rendering', err);
            if (!failedJobIds.includes(job.id)) {
              failedJobIds.push(job.id);
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

    return res.status(200).json({
      ok: true,
      advancedCount: transitions.length,
      blockedNeedsDocumentsCount: blockedJobIds.length,
      failedCount: failedJobIds.length,
      advancedJobIds: transitions.map((t) => t.job_id),
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
