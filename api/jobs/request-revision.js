import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    return res.status(500).json({ error: 'SERVER_MISCONFIGURED', missing });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !authData?.user) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const jobId = req.body?.job_id;
  if (!jobId) {
    return res.status(404).json({ ok: false, error: 'JOB_NOT_FOUND' });
  }

  const { data: jobRow, error: jobErr } = await supabaseAdmin
    .from('analysis_jobs')
    .select('id, user_id, status')
    .eq('id', jobId)
    .maybeSingle();

  if (jobErr || !jobRow || jobRow.user_id !== authData.user.id) {
    return res.status(404).json({ ok: false, error: 'JOB_NOT_FOUND' });
  }

  const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc(
    'consume_revision_slot',
    { p_job_id: jobId }
  );
  if (consumeErr) {
    return res.status(403).json({ ok: false, error: 'REVISION_LIMIT_REACHED' });
  }
  if (consumed === false) {
    return res.status(403).json({ ok: false, error: 'REVISION_LIMIT_REACHED' });
  }

  const nowIso = new Date().toISOString();
  const { error: eventErr } = await supabaseAdmin.from('analysis_job_events').insert([
    {
      job_id: jobId,
      actor: 'user',
      event_type: 'revision_requested',
      from_status: jobRow.status,
      to_status: 'queued',
      created_at: nowIso,
      meta: { route: '/api/jobs/request-revision' },
    },
  ]);
  if (eventErr) {
    return res.status(500).json({ ok: false, error: 'SERVER_MISCONFIGURED' });
  }

  const { error: updateErr } = await supabaseAdmin
    .from('analysis_jobs')
    .update({ status: 'queued', error_code: null, error_message: null })
    .eq('id', jobId);

  if (updateErr) {
    return res.status(500).json({ ok: false, error: 'SERVER_MISCONFIGURED' });
  }

  return res.status(200).json({ ok: true });
}
