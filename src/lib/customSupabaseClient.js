// src/lib/customSupabaseClient.js
// InvestorIQ ELITE - Secure Supabase client initialization

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for InvestorIQ
 * Environment variables must be set in your .env file:
 *
 *  NEXT_PUBLIC_SUPABASE_URL="https://yourproject.supabase.co"
 *  NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
 *
 * These are public keys by design, but should never be hard-coded in the repo.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment setup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file."
  );
}

/**
 * Create a single instance of the Supabase client.
 * This will be imported anywhere you need database access or auth.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Optional: simple helper for server health checks or debugging
 */
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
    console.log("✅ Supabase connection verified.");
    return true;
  } catch (err) {
    console.error("❌ Supabase test query failed:", err.message);
    return false;
  }
};
