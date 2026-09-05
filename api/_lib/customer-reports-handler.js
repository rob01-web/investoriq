import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedActor } from './authenticated-actor.js';

function clampLimit(value, fallback = 25) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), 100);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await resolveAuthenticatedActor(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const limit = clampLimit(req.query?.limit, 25);

  const { data, error } = await supabase
    .from('customer_published_report_projection')
    .select(
      'id, user_id, property_name, report_type, created_at, storage_path, revision_kind, revision_number, revision_family_key, revision_root_report_id, revision_parent_report_id, revision_request_key, revision_source_job_id, is_current_revision, revision_published_at, publication_state, publication_receipt_id, publication_completed_at, canonical_delivery_action, product_identity, report_family, storage_object_id, publication_job_id'
    )
    .eq('user_id', auth.actor.id)
    .order('revision_published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[InvestorIQ] Governed customer report projection failed:', error);
    return res.status(500).json({ error: 'REPORT_LOOKUP_FAILED' });
  }

  return res.status(200).json({
    success: true,
    rows: Array.isArray(data) ? data : [],
  });
}
