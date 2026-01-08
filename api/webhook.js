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
  // Keep your current mappings, add safe aliases for the 3-report plan.
  if (productType === "singleReport") return 1;
  if (productType === "monthlyPro") return 1; // 1 report / month
  if (productType === "monthly3Reports") return 3; // 3 reports / month (safe alias)
  if (productType === "monthly3") return 3; // safe alias
  if (productType === "addOn") return 1; // adjust later for quantity if you add it
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
    console.warn("⚠️ Missing metadata userId/productType", { userId, productType });
    // Ignore: we can't safely credit without metadata
    return res.status(200).json({ received: true });
  }

  const creditsToAdd = creditsForProductType(productType);
  if (!creditsToAdd) {
    console.warn("⚠️ Unknown productType:", productType);
    // Ignore: we don't want to credit unknown product types
    return res.status(200).json({ received: true });
  }

  const eventId = event.id;
  const sessionId = session?.id;

  // ✅ Idempotency (HARD): INSERT FIRST. If duplicate => already processed => return 200.
  const { error: insertErr } = await supabaseAdmin
    .from("stripe_events")
    .insert([
      {
        id: eventId,
        type: event.type,
        user_id: userId,
        session_id: sessionId,
        product_type: productType,
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

  // ✅ Atomic credit increment via RPC (race-condition proof)
  const { error: rpcErr } = await supabaseAdmin.rpc("add_report_credits", {
    p_user_id: userId,
    p_add: creditsToAdd,
  });

  if (rpcErr) {
    console.error("❌ Failed to increment credits (rpc):", rpcErr);
    // 500 => Stripe retries (safe because idempotency is now strong)
    return res.status(500).json({ error: "Credit update failed" });
  }

  console.log(`✅ Added ${creditsToAdd} credit(s) to userId=${userId} (${productType})`);
  return res.status(200).json({ received: true });
}
