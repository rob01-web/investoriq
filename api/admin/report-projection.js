import { createClient } from '@supabase/supabase-js';

function readAdminKey(req) {
  const direct = String(req.headers['x-admin-run-key'] || '').trim();
  if (direct) return direct;
  const authorization = String(req.headers.authorization || '').trim();
  return authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : '';
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedAdminKey = String(process.env.ADMIN_RUN_KEY || '').trim();
  const suppliedAdminKey = readAdminKey(req);
  if (!expectedAdminKey || !suppliedAdminKey || suppliedAdminKey !== expectedAdminKey) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const limit = clampInteger(req.query?.limit, 20, 1, 100);
  const offset = clampInteger(req.query?.offset, 0, 0, 1000000);
  const search = String(req.query?.search || '').trim();
  const publicationState = String(req.query?.publication_state || '').trim().toLowerCase();
  const reportType = String(req.query?.report_type || '').trim().toLowerCase();

  let query = supabase
    .from('admin_report_projection')
    .select(
      'id, user_id, property_name, storage_path, created_at, report_type, revision_kind, revision_number, revision_family_key, revision_root_report_id, revision_parent_report_id, revision_request_key, revision_source_job_id, is_current_revision, revision_published_at, publication_receipt_id, publication_completed_at, publication_job_id, publication_state, customer_removed',
      { count: 'exact' }
    );

  if (search) query = query.ilike('property_name', `%${search.replace(/[%_]/g, '')}%`);
  if (publicationState && publicationState !== 'all') query = query.eq('publication_state', publicationState);
  if (['screening', 'underwriting'].includes(reportType)) query = query.eq('report_type', reportType);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[InvestorIQ] Admin report projection failed:', error);
    return res.status(500).json({ error: 'REPORT_LOOKUP_FAILED' });
  }

  let todayCount = null;
  if (String(req.query?.include_today_count || '') === 'true') {
    const startOfDay = String(req.query?.start_of_day || '').trim();
    if (startOfDay) {
      const { count: resolvedTodayCount, error: todayError } = await supabase
        .from('admin_report_projection')
        .select('id', { count: 'exact', head: true })
        .eq('publication_state', 'published')
        .gte('publication_completed_at', startOfDay);
      if (todayError) {
        console.error('[InvestorIQ] Admin report today-count failed:', todayError);
      } else {
        todayCount = resolvedTodayCount || 0;
      }
    }
  }

  return res.status(200).json({
    success: true,
    rows: Array.isArray(data) ? data : [],
    count: Number(count || 0),
    today_count: todayCount,
  });
}
