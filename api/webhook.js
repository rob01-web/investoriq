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

function isDuplicateInsertError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return msg.includes("duplicate") || msg.includes("unique") || msg.includes("already exists");
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
    console.error("Stripe signature verification failed:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Invalid signature"}`);
  }

  console.log("Stripe event received:", event.type);

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
  let quantity = 1;

  if (sessionId) {
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 10 });
      const purchasedQuantity = Number(lineItems?.data?.[0]?.quantity);
      quantity = Math.max(1, Math.min(5, Number.isFinite(purchasedQuantity) ? purchasedQuantity : 1));
    } catch (lineItemErr) {
      console.error("Failed to fetch checkout line items:", lineItemErr);
      return res.status(500).json({ error: "Webhook line item lookup failed" });
    }
  }

  const expectedSessionIds = Array.from({ length: quantity }, (_value, index) =>
    index === 0 ? (sessionId || null) : `${sessionId}#${index + 1}`
  );

  const loadExistingPurchases = async () => {
    if (!sessionId) return { rows: [], error: null };

    const filters = expectedSessionIds
      .filter(Boolean)
      .map((value) => `stripe_session_id.eq.${value}`)
      .join(",");

    if (!filters) return { rows: [], error: null };

    const { data, error } = await supabaseAdmin
      .from("report_purchases")
      .select("id, stripe_session_id")
      .or(filters);

    return { rows: data || [], error };
  };

  const { error: insertErr } = await supabaseAdmin
    .from("stripe_events")
    .insert([
      {
        id: eventId,
      },
    ]);

  if (insertErr) {
    if (isDuplicateInsertError(insertErr)) {
      const { rows: existingRows, error: existingErr } = await loadExistingPurchases();
      if (existingErr) {
        console.error("Failed to verify existing report purchases for duplicate event:", existingErr);
        return res.status(500).json({ error: "Webhook purchase verification failed" });
      }
      if (existingRows.length >= quantity) {
        console.log("Stripe event already processed:", eventId);
        return res.status(200).json({ received: true });
      }
      console.warn("Duplicate Stripe event found without complete entitlement rows; continuing purchase creation:", {
        eventId,
        sessionId,
        expected: quantity,
        existing: existingRows.length,
      });
    } else {
      console.error("Failed to record stripe event (idempotency insert):", insertErr);
      return res.status(500).json({ error: "Webhook processing failed (idempotency)" });
    }
  }

  const { rows: existingPurchases, error: existingPurchasesErr } = await loadExistingPurchases();
  if (existingPurchasesErr) {
    console.error("Failed to load existing report purchases:", existingPurchasesErr);
    return res.status(500).json({ error: "Report purchase verification failed" });
  }

  const existingSessionIds = new Set(
    existingPurchases.map((row) => row.stripe_session_id).filter(Boolean)
  );

  const purchaseRows = expectedSessionIds
    .filter((purchaseSessionId) => !purchaseSessionId || !existingSessionIds.has(purchaseSessionId))
    .map((purchaseSessionId) => ({
      user_id: userId,
      product_type: productType,
      job_id: null,
      consumed_at: null,
      stripe_session_id: purchaseSessionId,
    }));

  if (purchaseRows.length === 0) {
    console.log("Entitlement rows already present for event:", eventId);
    return res.status(200).json({ received: true });
  }

  const { data: insertedPurchases, error: purchaseErr } = await supabaseAdmin
    .from("report_purchases")
    .insert(purchaseRows)
    .select("id");

  if (purchaseErr) {
    console.error("Failed to record report purchase:", purchaseErr);
    return res.status(500).json({ error: "Report purchase insert failed" });
  }

  console.log(
    "Recorded purchase for userId=" +
      userId +
      " (" +
      productType +
      "), inserted_rows=" +
      (insertedPurchases?.length || 0) +
      ", session_id=" +
      (sessionId || "null")
  );
  return res.status(200).json({ received: true });
}