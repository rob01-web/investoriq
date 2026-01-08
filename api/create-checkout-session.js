// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Canonical productType contract (LOCKED):
// single, monthly_1, monthly_3, addon_1, addon_3, addon_5
function normalizeProductType({ productType, planKey }) {
  const raw = productType || planKey || "";
  if (!raw) return "";

  const map = {
    // ✅ Canonical
    single: "single",
    monthly_1: "monthly_1",
    monthly_3: "monthly_3",
    addon_1: "addon_1",
    addon_3: "addon_3",
    addon_5: "addon_5",

    // ✅ Legacy (back-compat)
    singleReport: "single",
    monthlyPro: "monthly_1",
    monthly3Reports: "monthly_3",
    monthly3: "monthly_3",
    addOn: "addon_1",

    // ✅ Legacy planKey style
    // (old: planKey === "single" -> "singleReport")
    // now we lock it to canonical "single"
  };

  return map[raw] || "";
}

const PRICE_CONFIG = {
  single: { priceId: process.env.STRIPE_PRICE_SINGLE, mode: "payment" },
  monthly_1: { priceId: process.env.STRIPE_PRICE_MONTHLY_1, mode: "subscription" },
  monthly_3: { priceId: process.env.STRIPE_PRICE_MONTHLY_3, mode: "subscription" },

  addon_1: { priceId: process.env.STRIPE_PRICE_ADDON_1, mode: "payment" },
  addon_3: { priceId: process.env.STRIPE_PRICE_ADDON_3, mode: "payment" },
  addon_5: { priceId: process.env.STRIPE_PRICE_ADDON_5, mode: "payment" },
};

function requiredEnvFor(productType) {
  switch (productType) {
    case "single": return "STRIPE_PRICE_SINGLE";
    case "monthly_1": return "STRIPE_PRICE_MONTHLY_1";
    case "monthly_3": return "STRIPE_PRICE_MONTHLY_3";
    case "addon_1": return "STRIPE_PRICE_ADDON_1";
    case "addon_3": return "STRIPE_PRICE_ADDON_3";
    case "addon_5": return "STRIPE_PRICE_ADDON_5";
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

    const finalSuccessUrl =
      typeof successUrl === "string" && successUrl.length > 0
        ? successUrl
        : `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

    const finalCancelUrl =
      typeof cancelUrl === "string" && cancelUrl.length > 0
        ? cancelUrl
        : `${baseUrl}/dashboard?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: config.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        // 🔒 webhook should trust THIS canonical value
        productType: normalizedProductType || "",
        userId: userId || "",
        userEmail: userEmail || "",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
