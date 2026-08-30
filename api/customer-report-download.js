import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedActor } from './_lib/authenticated-actor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await resolveAuthenticatedActor(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const storagePath = String(req.body?.storage_path || req.body?.storagePath || '').trim();
  if (!storagePath) return res.status(400).json({ error: 'STORAGE_PATH_REQUIRED' });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: report, error: reportError } = await supabase
    .from('customer_published_report_projection')
    .select('id, user_id, storage_path, publication_receipt_id, publication_job_id, publication_state, storage_object_id')
    .eq('user_id', auth.actor.id)
    .eq('storage_path', storagePath)
    .eq('publication_state', 'published')
    .maybeSingle();

  if (reportError) {
    console.error('[InvestorIQ] Governed download projection failed:', reportError);
    return res.status(500).json({ error: 'DOWNLOAD_REPORT_LOOKUP_FAILED' });
  }
  if (!report) return res.status(404).json({ error: 'CURRENT_REPORT_NOT_FOUND' });

  const { data, error } = await supabase.storage
    .from('generated_reports')
    .createSignedUrl(storagePath, 300);

  if (error || !data?.signedUrl) {
    console.error('[InvestorIQ] Governed signed download failed:', error || 'signed URL missing');
    return res.status(409).json({ error: 'DOWNLOAD_ARTIFACT_UNAVAILABLE' });
  }

  return res.status(200).json({
    success: true,
    signedUrl: data.signedUrl,
    expiresIn: 300,
    report_id: report.id,
    publication_receipt_id: report.publication_receipt_id,
    publication_job_id: report.publication_job_id,
  });
}
