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

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return res.status(500).json({
        error: 'Server misconfigured: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
      });
    }

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

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const supabase = supabaseAdmin;

    const now = new Date();
    let nowIso = now.toISOString();
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
      const { error } = await supabaseAdmin.from('analysis_artifacts').insert([
        {
          job_id: jobId,
          user_id: userId ?? null,
          type: 'worker_event',
          bucket: 'internal',
          object_path: `analysis_jobs/${jobId}/worker_event/${eventName}/${safeTimestamp(nowIso)}.json`,
          payload: payload || {},
        },
      ]);

      return error;
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
          event: 'credit_failed',
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

    let supportsCompletedAt = false;
    let supportsFailedAt = false;
    try {
      supportsCompletedAt = await canUseColumn('completed_at');
      supportsFailedAt = await canUseColumn('failed_at');
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
        .limit(10);

      if (queuedErr) {
        return res.status(500).json({ error: 'Failed to fetch queued jobs', details: queuedErr.message });
      }

      const { data: extractingJobs, error: extractingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at')
        .eq('status', 'extracting')
        .order('created_at', { ascending: true })
        .limit(10);

      if (extractingErr) {
        return res.status(500).json({ error: 'Failed to fetch extracting jobs', details: extractingErr.message });
      }

      if (queuedJobs && queuedJobs.length > 0) {
        const queuedIds = queuedJobs.map((j) => j.id);
        const { error: queuedUpdErr } = await supabaseAdmin
          .from('analysis_jobs')
          .update({
            status: 'extracting',
            started_at: nowIso,
          })
          .in('id', queuedIds);

        if (queuedUpdErr) {
          return res.status(500).json({ error: 'Failed to advance queued jobs', details: queuedUpdErr.message });
        }

        for (const job of queuedJobs) {
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: transitionErr.message,
            });
          }
        }
      }

      if (extractingJobs && extractingJobs.length > 0) {
        for (const job of extractingJobs) {
          const { data: structuredArtifacts, error: structuredErr } = await supabaseAdmin
            .from('analysis_artifacts')
            .select('id, type')
            .eq('job_id', job.id)
            .in('type', ['rent_roll_parsed', 't12_parsed'])
            .limit(1);

          if (structuredErr) {
            return res.status(500).json({
              error: 'Failed to check structured financial artifacts',
              details: structuredErr.message,
            });
          }

          if (!structuredArtifacts || structuredArtifacts.length === 0) {
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
                  event: 'missing_structured_financials',
                  code: 'NO_STRUCTURED_FINANCIALS',
                  level: 'error',
                  message:
                    'No rent roll or T12 has been parsed yet. Job will remain in extracting until structured financials are available.',
                  timestamp: nowIso,
                }
              );

              if (workerEventErr) {
                return res.status(500).json({
                  error: 'Failed to write worker event artifact',
                  details: workerEventErr.message,
                });
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

                  await sendEmailSES({
                    to: userEmail,
                    subject: 'Action required: documents needed to continue your InvestorIQ report',
                    text:
                      'Your InvestorIQ report cannot proceed yet.\n\n' +
                      'We could not identify structured financial documents required for underwriting.\n\n' +
                      'Required:\n' +
                      '- Rent Roll\n' +
                      '- Operating Statement (T12 / Income Statement / P&L)\n\n' +
                      'Please upload at least one of these documents to continue processing.\n\n' +
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

          const { data: extractingUpdate, error: extractingUpdErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'underwriting' })
            .eq('id', job.id)
            .eq('status', 'extracting')
            .select('id')
            .maybeSingle();

          if (extractingUpdErr) {
            return res.status(500).json({
              error: 'Failed to advance extracting job',
              details: extractingUpdErr.message,
            });
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: transitionErr.message,
            });
          }
        }
      }

      const { data: underwritingJobs, error: underwritingErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, started_at')
        .eq('status', 'underwriting')
        .order('created_at', { ascending: true })
        .limit(10);

      if (underwritingErr) {
        return res.status(500).json({ error: 'Failed to fetch underwriting jobs', details: underwritingErr.message });
      }

      if (underwritingJobs && underwritingJobs.length > 0) {
        const underwritingIds = underwritingJobs.map((j) => j.id);
        const { error: underwritingUpdErr } = await supabaseAdmin
          .from('analysis_jobs')
          .update({ status: 'scoring' })
          .in('id', underwritingIds);

        if (underwritingUpdErr) {
          return res.status(500).json({ error: 'Failed to advance underwriting jobs', details: underwritingUpdErr.message });
        }

        for (const job of underwritingJobs) {
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: transitionErr.message,
            });
          }
        }
      }

      const { data: scoringJobs, error: scoringErr } = await supabaseAdmin
        .from('analysis_jobs')
        .select('id, user_id, status, created_at, property_name')
        .eq('status', 'scoring')
        .order('created_at', { ascending: true })
        .limit(5);

      if (scoringErr) {
        return res.status(500).json({ error: 'Failed to fetch scoring jobs', details: scoringErr.message });
      }

      if (scoringJobs && scoringJobs.length > 0) {
        for (const job of scoringJobs) {
          const { data: renderingUpdate, error: renderingErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'rendering' })
            .eq('id', job.id)
            .eq('status', 'scoring')
            .select('id')
            .maybeSingle();

          if (renderingErr) {
            return res.status(500).json({ error: 'Failed to advance scoring job', details: renderingErr.message });
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: scoringTransitionErr.message,
            });
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
              return res.status(500).json({ error: 'Failed to check existing reports', details: reportErr.message });
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
            const { error: failErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update(failUpdate)
              .eq('id', job.id);

            if (failErr) {
              return res.status(500).json({ error: 'Failed to mark scoring job failed', details: failErr.message });
            }

            transitions.push({
              job_id: job.id,
              from_status: 'rendering',
              to_status: 'failed',
            });
            passTransitions += 1;

            const failedTransitionErr = await writeStatusTransitionArtifact(
              job.id,
              'rendering',
              'failed',
              { user_id: job.user_id, error: generatorError }
            );

            if (failedTransitionErr) {
              return res.status(500).json({
                error: 'Failed to write failed status transition artifact',
                details: failedTransitionErr.message,
              });
            }

            const workerEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation_failed', {
              event: 'report_generation_failed',
              error: generatorError,
              timestamp: nowIso,
              ...(generatorFailurePayload || {}),
            });

            if (workerEventErr) {
              return res.status(500).json({
                error: 'Failed to write report generation failure artifact',
                details: workerEventErr.message,
              });
            }

            continue;
          }

          const reportEventErr = await writeWorkerEventArtifact(job.id, job.user_id, 'report_generation', {
            event: 'report_generation',
            source: generatorSource,
            report_id: reportId,
            storage_path: storagePath,
            timestamp: nowIso,
          });

          if (reportEventErr) {
            return res.status(500).json({
              error: 'Failed to write report generation artifact',
              details: reportEventErr.message,
            });
          }

          const { error: pdfGenErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'pdf_generating' })
            .eq('id', job.id);

          if (pdfGenErr) {
            return res.status(500).json({ error: 'Failed to advance job to pdf_generating', details: pdfGenErr.message });
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: pdfTransitionErr.message,
            });
          }

          const { error: publishingErr } = await supabaseAdmin
            .from('analysis_jobs')
            .update({ status: 'publishing' })
            .eq('id', job.id);

          if (publishingErr) {
            return res.status(500).json({ error: 'Failed to advance job to publishing', details: publishingErr.message });
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: publishingTransitionErr.message,
            });
          }

          const creditResult = await consumeCreditOnce(job);
          if (creditResult?.error) {
            return res.status(500).json({
              error: 'Failed to consume credits',
              details: creditResult.error.message || String(creditResult.error),
            });
          }

          if (creditResult?.failed) {
            transitions.push({
              job_id: job.id,
              from_status: 'publishing',
              to_status: 'failed',
            });
            passTransitions += 1;
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
            return res.status(500).json({ error: 'Failed to mark job published', details: completedErr.message });
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
            return res.status(500).json({
              error: 'Failed to write status transition artifact',
              details: completedTransitionErr.message,
            });
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

              await sendEmailSES({
                to: userEmail,
                subject: 'Your InvestorIQ report is ready',
                text:
                  'Your InvestorIQ report has been completed and is now available in your dashboard.\n\n' +
                  'You may download the report at any time by signing in to InvestorIQ.\n\n' +
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
        }
      }

      passesRun += 1;

      if (passTransitions === 0) {
        break;
      }
    }

    return res.status(200).json({
      ok: true,
      advanced_count: transitions.length,
      timeout_failed_count: timedOutJobs.length,
      transitions,
      passes_run: passesRun,
    });
  } catch (err) {
    console.error('admin-run-worker error:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
