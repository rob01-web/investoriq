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

function creditsForProductType(productType) {
  if (productType === "singleReport") return 1;
  if (productType === "monthlyPro") return 1; // adjust later if monthly gives >1
  if (productType === "addOn") return 1;      // adjust later for quantity
  return 0;
}

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

  const userId = session?.metadata?.userId;
  const productType = session?.metadata?.productType;

  if (!userId || !productType) {
    console.warn("⚠️ Missing metadata userId/productType", {
      userId,
      productType,
    });
    return res.status(200).json({ received: true });
  }

  const creditsToAdd = creditsForProductType(productType);

  if (!creditsToAdd) {
    console.warn("⚠️ Unknown productType:", productType);
    return res.status(200).json({ received: true });
  }

  // ✅ Idempotency: prevent double-crediting if Stripe retries
  // Requires a table 'stripe_events' (I’ll give you the SQL below)
  const eventId = event.id;

  try {
    const { data: already } = await supabaseAdmin
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (already?.id) {
      console.log("ℹ️ Event already processed:", eventId);
      return res.status(200).json({ received: true });
    }
  } catch (e) {
    // If the table doesn't exist yet, we'll still proceed once.
    console.warn("⚠️ stripe_events table missing or unreadable (ok for now).");
  }

  // Fetch current credits
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("id, report_credits")
    .eq("id", userId)
    .single();

  if (fetchError || !profile) {
    console.error("❌ No profile found for userId:", userId, fetchError);
    return res.status(200).json({ received: true });
  }

  const newCredits = Number(profile.report_credits || 0) + creditsToAdd;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ report_credits: newCredits })
    .eq("id", userId);

  if (updateError) {
    console.error("❌ Failed to update credits:", updateError);
    return res.status(500).json({ error: "Credit update failed" });
  }

  // Mark event processed (idempotency)
  try {
    await supabaseAdmin.from("stripe_events").insert([{ id: eventId }]);
  } catch (e) {
    // ok if table missing; create it for production reliability
  }

  console.log(`✅ Added ${creditsToAdd} credit(s) to userId=${userId} (${productType})`);
}

  return res.status(200).json({ received: true });
}
