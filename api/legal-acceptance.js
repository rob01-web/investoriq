import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedActor } from './_lib/authenticated-actor.js';
import {
  INVESTORIQ_DISCLOSURE_KEY,
  INVESTORIQ_DISCLOSURE_TEXT_HASH,
  INVESTORIQ_DISCLOSURE_VERSION,
  buildInvestorIQDisclosureAcceptanceRecord,
} from '../src/lib/investoriq-disclosure-authority.js';

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
        .eq('policy_key', INVESTORIQ_DISCLOSURE_KEY)
        .eq('policy_version', INVESTORIQ_DISCLOSURE_VERSION)
        .eq('policy_text_hash', INVESTORIQ_DISCLOSURE_TEXT_HASH)
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
      .insert(
        buildInvestorIQDisclosureAcceptanceRecord({
          userId,
          userEmail: auth.actor.email,
          ip,
          userAgent,
        }),
      )
      .select('accepted_at')
      .single();

    if (error) {
      // Duplicate acceptance is OK (unique index hit)
      if (error.code === '23505') {
        const { data: existingRow, error: readErr } = await supabase
          .from('legal_acceptances')
          .select('accepted_at')
          .eq('user_id', userId)
          .eq('policy_key', INVESTORIQ_DISCLOSURE_KEY)
          .eq('policy_version', INVESTORIQ_DISCLOSURE_VERSION)
          .eq('policy_text_hash', INVESTORIQ_DISCLOSURE_TEXT_HASH)
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
