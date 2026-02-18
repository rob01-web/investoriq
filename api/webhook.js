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
    console.error("❌ Stripe signature verification failed:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Invalid signature"}`);
  }

  console.log("💳 Stripe event received:", event.type);

  // Only process what we actually support.
  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  const userId = session?.metadata?.userId;
  const productType = session?.metadata?.productType;
  if (!userId || !productType) {
    console.warn("Missing metadata userId/productType", {
      userId,
      productType,
    });
    return res.status(400).json({ error: "Missing metadata userId or productType" });
  }

  if (productType !== "screening" && productType !== "underwriting") {
    console.warn("Unknown productType:", productType);
    return res.status(400).json({ error: "Invalid productType" });
  }

  const eventId = event.id;
  const sessionId = session?.id;

  // ✅ Idempotency (HARD): INSERT FIRST. If duplicate => already processed => return 200.
  const { error: insertErr } = await supabaseAdmin
    .from("stripe_events")
    .insert([
      {
        id: eventId,
      },
    ]);

  if (insertErr) {
    const msg = String(insertErr.message || "").toLowerCase();

    // Treat duplicate/unique constraint violations as "already processed"
    if (msg.includes("duplicate") || msg.includes("unique") || msg.includes("already exists")) {
      console.log("ℹ️ Event already processed:", eventId);
      return res.status(200).json({ received: true });
    }

    console.error("❌ Failed to record stripe event (idempotency insert):", insertErr);
    // 500 => Stripe retries => good
    return res.status(500).json({ error: "Webhook processing failed (idempotency)" });
  }

  const { error: purchaseErr } = await supabaseAdmin
    .from("report_purchases")
    .insert([
      {
        user_id: userId,
        product_type: productType,
        job_id: null,
        consumed_at: null,
        stripe_session_id: sessionId || null,
      },
    ]);

  if (purchaseErr) {
    const msg = String(purchaseErr.message || "").toLowerCase();
    if (!msg.includes("duplicate") && !msg.includes("unique") && !msg.includes("already exists")) {
      console.error("Failed to record report purchase:", purchaseErr);
      return res.status(500).json({ error: "Report purchase insert failed" });
    }
  }

  console.log("Recorded purchase for userId=" + userId + " (" + productType + ")");
  return res.status(200).json({ received: true });
}


