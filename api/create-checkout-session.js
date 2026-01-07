// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Map friendly product keys to your real Stripe Price IDs
const PRICE_CONFIG = {
  singleReport: {
    priceId: "price_1SZwBNPlUvcaYNKZCK6V3lTX", // $499 one-time
    mode: "payment",
  },
  monthlyPro: {
    priceId: "price_1SZwDVPlUvcaYNKZBZLV4uSp", // $349/month
    mode: "subscription",
  },
  addOn: {
    priceId: "price_1SZwFCPlUvcaYNKZFKMxTF2G", // $299 one-time
    mode: "payment",
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { productType, planKey, successUrl, cancelUrl, userId, userEmail } = req.body || {};

    // Backward compatible:
    // - Dashboard sends productType: "singleReport"
    // - We also accept planKey if present and map it to an existing productType
    const normalizedProductType =
      productType ||
      (planKey === "single" ? "singleReport" : null) ||
      planKey;

    const config = PRICE_CONFIG[normalizedProductType];

    if (!config) {
      return res.status(400).json({ error: "Invalid productType" });
    }

    const baseUrl = process.env.PUBLIC_SITE_URL || "https://investoriq.tech";

    const finalSuccessUrl =
      typeof successUrl === "string" && successUrl.length > 0
        ? successUrl
        : `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

    const finalCancelUrl =
      typeof cancelUrl === "string" && cancelUrl.length > 0
        ? cancelUrl
        : `${baseUrl}/pricing?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: config.priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
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
