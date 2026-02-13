// api/create-checkout-session.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Canonical productType contract (LOCKED):
// screening, underwriting
function normalizeProductType({ productType, planKey }) {
  const raw = productType || planKey || "";
  if (!raw) return "";

  const map = {
    // Canonical
    screening: "screening",
    underwriting: "underwriting",
  };

  return map[raw] || "";
}

export const PRICE_CONFIG = {
  screening: { priceId: process.env.STRIPE_PRICE_SCREENING, mode: "payment" },
  underwriting: { priceId: process.env.STRIPE_PRICE_UNDERWRITING, mode: "payment" },
};

export const ALLOWED_PRODUCT_TYPES = ["screening", "underwriting"];

function requiredEnvFor(productType) {
  switch (productType) {
    case "screening": return "STRIPE_PRICE_SCREENING";
    case "underwriting": return "STRIPE_PRICE_UNDERWRITING";
    default: return "UNKNOWN";
  }
}

export function getValidatedPriceConfig() {
  const missing = [];
  for (const type of ALLOWED_PRODUCT_TYPES) {
    const priceId = PRICE_CONFIG?.[type]?.priceId;
    if (!priceId) missing.push(requiredEnvFor(type));
  }

  return {
    ok: missing.length === 0,
    missing,
    config: PRICE_CONFIG,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { productType, planKey, successUrl, cancelUrl, userId, userEmail } = req.body || {};

    const normalizedProductType = normalizeProductType({ productType, planKey });
    const { ok: configOk, missing, config: configMap } = getValidatedPriceConfig();
    if (!configOk) {
      return res.status(500).json({
        error: "Server misconfigured: missing Stripe Price ID env vars.",
        missing,
      });
    }
    const config = configMap[normalizedProductType];

    if (!config) {
      return res.status(400).json({ error: "Invalid productType" });
    }

    if (!config.priceId) {
      return res.status(500).json({
        error: `Missing Stripe Price ID env var for "${normalizedProductType}".`,
        expectedEnv: requiredEnvFor(normalizedProductType),
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        error: "Server misconfigured: missing Supabase env vars.",
        missing: [
          !supabaseUrl ? "SUPABASE_URL" : null,
          !supabaseServiceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
        ].filter(Boolean),
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const runsLimit = normalizedProductType === "underwriting" ? 3 : 2;
    const { data: jobRow, error: jobErr } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        report_type: normalizedProductType,
        status: "needs_documents",
        runs_limit: runsLimit,
        runs_used: 0,
        runs_inflight: 0,
      })
      .select("id")
      .single();

    if (jobErr || !jobRow?.id) {
      return res.status(500).json({ error: "Failed to create analysis job" });
    }
    const jobId = jobRow.id;

    const baseUrl = process.env.PUBLIC_SITE_URL || "https://investoriq.tech";

    const finalSuccessUrl = `${baseUrl}/dashboard?checkout=success`;
    const finalCancelUrl = `${baseUrl}/dashboard?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: config.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        // 🔒 webhook should trust THIS canonical value
        userId: userId || "",
        productType: normalizedProductType || "",
        jobId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}

