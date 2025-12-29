// api/webhook.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // REQUIRED for Stripe signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("💳 Stripe event received:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email = session?.customer_details?.email;
    const paymentLinkId = session?.payment_link;

    if (!email || !paymentLinkId) {
      console.warn("⚠️ Missing email or payment link");
      return res.status(200).json({ received: true });
    }

    // 🔐 Map payment link → credits
    let creditsToAdd = 0;

    // Single Report payment link (from your event log)
    if (paymentLinkId === "plink_1Sjk3EPlUvcaYNKZUGQc29EO") {
      creditsToAdd = 1;
    }

    if (creditsToAdd === 0) {
      console.warn("⚠️ Unknown payment link:", paymentLinkId);
      return res.status(200).json({ received: true });
    }

    // Find profile by email
    const { data: profiles, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, report_credits")
      .eq("email", email)
      .limit(1);

    if (fetchError || !profiles || profiles.length === 0) {
      console.error("❌ No profile found for:", email);
      return res.status(200).json({ received: true });
    }

    const profile = profiles[0];
    const newCredits = (profile.report_credits || 0) + creditsToAdd;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ report_credits: newCredits })
      .eq("id", profile.id);

    if (updateError) {
      console.error("❌ Failed to update credits:", updateError);
      return res.status(500).json({ error: "Credit update failed" });
    }

    console.log(`✅ Added ${creditsToAdd} credit to ${email}`);
  }

  return res.status(200).json({ received: true });
}
