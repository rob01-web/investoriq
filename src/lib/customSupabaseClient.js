import { createClient } from '@supabase/supabase-js';

/**
 * InvestorIQ Supabase Client
 * --------------------------
 * Centralized connection instance for Supabase database, authentication,
 * and storage operations. Uses environment variables configured via Vite.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safety check to ensure environment variables are configured correctly
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[InvestorIQ] Supabase environment variables are missing. Please verify your .env file or deployment settings.'
  );
}

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
