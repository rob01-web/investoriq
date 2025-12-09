// api/webhook.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// SUPABASE (service role for secure writes)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function webhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("💳 Stripe event received:", event.type);

  // 🎯 Handle purchase
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userEmail = session.customer_details?.email;
    const priceId = session.metadata?.price_id;

    console.log("🟢 CHECKOUT COMPLETED FOR:", userEmail);
    console.log("Price ID:", priceId);

    if (!userEmail || !priceId) {
      console.log("⚠️ Missing user email or price ID. Skipping credit insert.");
      return res.status(200).send({ received: true });
    }

    // Determine credits based on product
    let credits = 0;
    if (priceId === "price_1SZwBNPlUvcaYNKZCK6V3lTX") credits = 1; // single
    if (priceId === "price_1SZwDVPlUvcaYNKZBZLV4uSp") credits = 1; // monthly pro
    if (priceId === "price_1SZwFCPlUvcaYNKZFKMxTF2G") credits = 1; // add-on

    // 1️⃣ GET SUPABASE USER PROFILE
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Failed to fetch profile:", profileError);
      return res.status(200).send({ received: true });
    }

    if (!profile) {
      console.error("❌ No profile found for:", userEmail);
      return res.status(200).send({ received: true });
    }

    console.log("👤 Supabase profile:", profile);

    // 2️⃣ ADD CREDIT
    const { error: creditError } = await supabase
      .from("report_credits")
      .insert({
        user_id: profile.id,
        amount: credits,
        source: "purchase",
        created_at: new Date().toISOString(),
      });

    if (creditError) {
      console.error("❌ Failed to insert report credit:", creditError);
    } else {
      console.log(`🟢 CREDIT ADDED: +${credits} for`, userEmail);
    }

    // 3️⃣ LOG TRANSACTION
    await supabase.from("credit_transactions").insert({
      user_id: profile.id,
      amount: credits,
      type: "purchase",
      stripe_event_id: event.id,
      created_at: new Date().toISOString(),
    });

    console.log("📝 Transaction logged");
  }

  res.status(200).send({ received: true });
}
