// api/create-checkout-session.js
import dotenv from "dotenv";
dotenv.config();

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
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { productType, successUrl, cancelUrl, userId, userEmail } =
      req.body || {};

    const config = PRICE_CONFIG[productType];

    if (!config) {
      return res.status(400).json({ error: "Invalid productType" });
    }

    // Default redirect URLs for now (we can wire real pages later)
    const defaultSuccessUrl =
      successUrl || "http://localhost:3000/test-download.html?checkout=success";
    const defaultCancelUrl =
      cancelUrl || "http://localhost:3000/index.html?checkout=cancel";

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      success_url: defaultSuccessUrl,
      cancel_url: defaultCancelUrl,
      // We'll use this metadata later in the webhook to attach credits
      metadata: {
        productType,
        userId: userId || "",
        userEmail: userEmail || "",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
