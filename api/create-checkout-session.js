// api/create-checkout-session.js
import Stripe from "stripe";

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

const PRICE_CONFIG = {
  screening: { priceId: process.env.STRIPE_PRICE_SCREENING, mode: "payment" },
  underwriting: { priceId: process.env.STRIPE_PRICE_UNDERWRITING, mode: "payment" },
};

function requiredEnvFor(productType) {
  switch (productType) {
    case "screening": return "STRIPE_PRICE_SCREENING";
    case "underwriting": return "STRIPE_PRICE_UNDERWRITING";
    default: return "UNKNOWN";
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { productType, planKey, successUrl, cancelUrl, userId, userEmail } = req.body || {};

    const normalizedProductType = normalizeProductType({ productType, planKey });
    const config = PRICE_CONFIG[normalizedProductType];

    if (!config) {
      return res.status(400).json({ error: "Invalid productType" });
    }

    if (!config.priceId) {
      return res.status(500).json({
        error: `Missing Stripe Price ID env var for "${normalizedProductType}".`,
        expectedEnv: requiredEnvFor(normalizedProductType),
      });
    }

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
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
