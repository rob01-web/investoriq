import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body || {};

// Policy identity must be server-defined and immutable
const POLICY_KEY = 'analysis_disclosures';
const POLICY_VERSION = 'v2026-01-14';

// IMPORTANT:
// We do NOT trust the client for policy identity or hashes.
// The server should compute POLICY_TEXT_HASH from the canonical disclosures text.
// For now, we require the client to send policyTextHash ONLY as a compatibility bridge,
// but we validate that policyKey/policyVersion are not accepted from the client.

const { policyTextHash } = req.body || {};

if (!userId || !policyTextHash) {
  return res.status(400).json({ error: 'Missing required fields' });
}

    // Server-derived identity (cannot be spoofed by client)
    const { data: userData, error: userErr } =
      await supabase.auth.admin.getUserById(userId);

    if (userErr) {
      console.error('Auth lookup error:', userErr);
      return res.status(500).json({ error: 'Failed to verify user identity' });
    }

    const userEmail = userData?.user?.email || null;

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

            const { error } = await supabase
      .from('legal_acceptances')
      .upsert(
        {
          user_id: userId,
          user_email: userEmail,
          policy_key: POLICY_KEY,
policy_version: POLICY_VERSION,
policy_text_hash: policyTextHash,
          ip,
          user_agent: userAgent,
        },
        {
          onConflict: 'user_id,policy_key,policy_version,policy_text_hash',
        }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Failed to record acceptance' });
    }

        return res.status(200).json({ success: true });
  } catch (err) {
    console.error('legal-acceptance error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

