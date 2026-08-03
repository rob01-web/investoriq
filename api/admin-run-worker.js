import { createClient } from '@supabase/supabase-js';
// EMERGENCY: full restore pending - this intermediate is invalid
export default async function handler(req, res) {
  return res.status(503).json({ error: 'admin-run-worker temporarily unavailable during restore' });
}
