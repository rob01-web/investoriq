// api/cron-worker.js
import { createClient } from '@supabase/supabase-js';

// This endpoint is triggered by Vercel Cron (HTTP GET).
// It advances ONE job per run, one step at a time.

function isVercelCronRequest(req) {
  const ua = String(req.headers['user-agent'] || '');
  // Vercel docs: cron-triggered functions contain "vercel-cron/1.0" in the user agent.
  return ua.includes('vercel-cron/1.0');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Basic protection: only accept Vercel Cron calls.
    // If you ever need a manual run, we can add a keyed override later.
    if (!isVercelCronRequest(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({
        error: 'Missing server env vars',
        expected: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      });
    }

    const sb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Pick ONE job to advance. We only advance jobs that the user has explicitly started
    // by clicking Generate (status: validating_inputs).
    const { data: job, error: pickErr } = await sb
      .from('analysis_jobs')
      .select('id, user_id, status')
      .eq('status', 'validating_inputs')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (pickErr) {
      console.error('cron-worker pick job failed:', pickErr);
      return res.status(500).json({ error: 'Failed to pick job' });
    }

    // No work to do
    if (!job?.id) {
      return res.status(200).json({ ok: true, advanced: 0 });
    }

    // Optimistic advance: only update if status is still validating_inputs.
    const { data: updated, error: advErr } = await sb
      .from('analysis_jobs')
      .update({
        status: 'extracting',
      })
      .eq('id', job.id)
      .eq('status', 'validating_inputs')
      .select('id, status')
      .maybeSingle();

    if (advErr) {
      console.error('cron-worker advance failed:', advErr);
      return res.status(500).json({ error: 'Failed to advance job' });
    }

    // If another worker run advanced it first, updated will be null.
    if (!updated?.id) {
      return res.status(200).json({ ok: true, advanced: 0 });
    }

    return res.status(200).json({
      ok: true,
      advanced: 1,
      jobId: updated.id,
      newStatus: updated.status,
    });
  } catch (err) {
    console.error('cron-worker fatal:', err);
    return res.status(500).json({ error: 'Worker crashed' });
  }
}