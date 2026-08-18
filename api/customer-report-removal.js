import { createClient } from '@supabase/supabase-js';
import {
  isInvestorIQAdmin,
  resolveAuthenticatedActor,
  resolveAuthenticatedResourceOwnership,
} from './_lib/authenticated-actor.js';

function uniqueIds(rows = []) {
  return [...new Set(rows.map((row) => String(row?.id || '').trim()).filter(Boolean))];
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await resolveAuthenticatedActor(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const reportId = String(req.body?.report_id || req.body?.reportId || '').trim();
    if (!reportId) {
      return res.status(400).json({ error: 'REPORT_ID_REQUIRED' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'SERVER_MISCONFIGURED' });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id, revision_family_key, revision_root_report_id')
      .eq('id', reportId)
      .maybeSingle();

    if (reportError) {
      console.error('customer-report-removal report lookup failed:', reportError);
      return res.status(500).json({ error: 'REPORT_LOOKUP_FAILED' });
    }
    if (!report) {
      return res.status(404).json({ error: 'REPORT_NOT_FOUND' });
    }

    const ownership = resolveAuthenticatedResourceOwnership({
      auth,
      resourceOwnerId: report.user_id,
      allowAdminBypass: true,
      resourceType: 'report',
    });
    if (!ownership.ok) {
      return res.status(ownership.status).json({ error: ownership.error });
    }

    let familyQuery = supabase
      .from('reports')
      .select('id, user_id, revision_family_key, revision_root_report_id')
      .eq('user_id', report.user_id);

    if (report.revision_family_key) {
      familyQuery = familyQuery.eq('revision_family_key', report.revision_family_key);
    } else if (report.revision_root_report_id) {
      const rootId = report.revision_root_report_id;
      familyQuery = familyQuery.or(`id.eq.${rootId},revision_root_report_id.eq.${rootId}`);
    } else {
      familyQuery = familyQuery.eq('id', report.id);
    }

    const { data: familyRows, error: familyError } = await familyQuery;
    if (familyError) {
      console.error('customer-report-removal family lookup failed:', familyError);
      return res.status(500).json({ error: 'REPORT_FAMILY_LOOKUP_FAILED' });
    }

    const reportIds = uniqueIds(familyRows?.length ? familyRows : [report]);
    const removedBy = isInvestorIQAdmin(auth.actor) ? 'admin' : 'customer';
    const removalRows = reportIds.map((id) => ({
      report_id: id,
      user_id: report.user_id,
      removed_by_actor_id: auth.actor.id,
      removed_by_role: removedBy,
      removed_at: new Date().toISOString(),
    }));

    const { error: removalError } = await supabase
      .from('customer_report_removals')
      .upsert(removalRows, { onConflict: 'report_id' });

    if (removalError) {
      console.error('customer-report-removal tombstone failed:', removalError);
      return res.status(500).json({ error: 'REPORT_REMOVAL_FAILED' });
    }

    return res.status(200).json({
      success: true,
      removal_mode: 'retained_hidden',
      reports: reportIds.map((id) => ({ id })),
    });
  } catch (error) {
    console.error('customer-report-removal error:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
