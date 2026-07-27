import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { resolveAuthenticatedActor } from './_lib/authenticated-actor.js';

const POLICY_TEXT =
  'InvestorIQ produces document-backed and framework-constrained underwriting, does not provide investment or appraisal advice, and will disclose any missing or degraded inputs in the final report. No invented data or gap-filling is performed.';
const POLICY_TEXT_HASH = createHash('sha256').update(POLICY_TEXT).digest('hex');
const POLICY_KEY = 'analysis_disclosures';
const POLICY_VERSION = 'v2026-01-14';

export default async function handler(req, res) {
  try {
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await resolveAuthenticatedActor(req);
    if (!auth.ok) {
      return res.status(auth.status).json({
        error: auth.error,
        ...(auth.missing ? { missing: auth.missing } : {}),
      });
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: 'SERVER_MISCONFIGURED',
        missing: [
          !supabaseUrl ? 'SUPABASE_URL' : null,
          !supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
        ].filter(Boolean),
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = auth.actor.id;

    if (req.method === 'GET') {
      const { data: existingRow, error: readErr } = await supabase
        .from('legal_acceptances')
        .select('accepted_at')
        .eq('user_id', userId)
        .eq('policy_key', POLICY_KEY)
        .eq('policy_version', POLICY_VERSION)
        .eq('policy_text_hash', POLICY_TEXT_HASH)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (readErr) {
        console.error('Supabase read error:', readErr);
        return res.status(500).json({ error: 'Failed to read acceptance' });
      }

      return res.status(200).json({
        success: true,
        accepted_at: existingRow?.accepted_at || null,
      });
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    const { data: insertedRow, error } = await supabase
      .from('legal_acceptances')
      .insert({
        user_id: userId,
        user_email: auth.actor.email,
        policy_key: POLICY_KEY,
        policy_version: POLICY_VERSION,
        policy_text_hash: POLICY_TEXT_HASH,
        ip,
        user_agent: userAgent,
      })
      .select('accepted_at')
      .single();

    if (error) {
      // Duplicate acceptance is OK (unique index hit)
      if (error.code === '23505') {
        const { data: existingRow, error: readErr } = await supabase
          .from('legal_acceptances')
          .select('accepted_at')
          .eq('user_id', userId)
          .eq('policy_key', POLICY_KEY)
          .eq('policy_version', POLICY_VERSION)
          .eq('policy_text_hash', POLICY_TEXT_HASH)
          .order('accepted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (readErr) {
          console.error('Supabase duplicate read error:', readErr);
          return res.status(500).json({ error: 'Failed to read acceptance' });
        }

        return res.status(200).json({
          success: true,
          alreadyAccepted: true,
          accepted_at: existingRow?.accepted_at || null,
        });
      }

      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to record acceptance' });
    }

    return res.status(200).json({
      success: true,
      accepted_at: insertedRow?.accepted_at || null,
    });
  } catch (err) {
    console.error('legal-acceptance error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
