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
    const sessionIdentifier = auth.sessionIdentifier || null;
    const sessionIdentifierSource = auth.sessionIdentifierSource || null;

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

    const sessionAckRequested =
      req.body?.session_ack === true ||
      req.body?.sessionAck === true ||
      req.body?.ack_type === 'session';

    if (sessionAckRequested) {
      if (!sessionIdentifier) {
        return res.status(500).json({
          error: 'SESSION_IDENTIFIER_UNAVAILABLE',
        });
      }

      const ip =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        null;

      const userAgent = req.headers['user-agent'] || null;

      const payload = {
        user_id: userId,
        disclosure_key: INVESTORIQ_DISCLOSURE_KEY,
        disclosure_version: INVESTORIQ_DISCLOSURE_VERSION,
        disclosure_text_hash: INVESTORIQ_DISCLOSURE_TEXT_HASH,
        session_identifier: sessionIdentifier,
        acknowledged_at: new Date().toISOString(),
        ip,
        user_agent: userAgent,
      };

      const { data: insertedRow, error } = await supabase
        .from('disclosure_session_ack_events')
        .insert(payload)
        .select(
          'id, user_id, disclosure_key, disclosure_version, disclosure_text_hash, session_identifier, acknowledged_at, ip, user_agent, created_at',
        )
        .single();

      if (error) {
        if (error.code === '23505') {
          const { data: existingRow, error: readErr } = await supabase
            .from('disclosure_session_ack_events')
            .select(
              'id, user_id, disclosure_key, disclosure_version, disclosure_text_hash, session_identifier, acknowledged_at, ip, user_agent, created_at',
            )
            .eq('user_id', userId)
            .eq('disclosure_key', INVESTORIQ_DISCLOSURE_KEY)
            .eq('disclosure_version', INVESTORIQ_DISCLOSURE_VERSION)
            .eq('disclosure_text_hash', INVESTORIQ_DISCLOSURE_TEXT_HASH)
            .eq('session_identifier', sessionIdentifier)
            .order('acknowledged_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (readErr) {
            console.error('Disclosure session ack duplicate read error:', readErr);
            return res.status(500).json({
              error: 'Failed to read disclosure session acknowledgement',
            });
          }

          return res.status(200).json({
            success: true,
            alreadyRecorded: true,
            sessionIdentifierSource,
            record: existingRow || null,
          });
        }

        console.error('Disclosure session ack insert error:', error);
        return res.status(500).json({
          error: 'Failed to record disclosure session acknowledgement',
        });
      }

      return res.status(200).json({
        success: true,
        sessionIdentifierSource,
        record: insertedRow || null,
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
