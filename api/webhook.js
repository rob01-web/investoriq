// api/webhook.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  COMMERCE_CATALOG_VERSION,
  COMMERCE_PRODUCT_TYPES,
  buildExpectedEntitlementAllocation,
  buildExpectedPurchaseSpecs,
  getConfiguredStripePrice,
  normalizeCommerceProductType,
  normalizeCommerceQuantity,
  validateCompletedCheckoutSession,
  validateStripePriceAgainstCatalog,
} from "./_lib/commerce-catalog.js";

export const config = { api: { bodyParser: false } };
export const CHECKOUT_PRODUCT_TYPES = [...COMMERCE_PRODUCT_TYPES];
export const ENTITLEMENT_PRODUCT_TYPES = ["screening", "underwriting"];
export { buildExpectedPurchaseSpecs };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export function verifyExpectedPurchaseSpecs(rows, expectedPurchaseSpecs) {
  const rowsBySessionId = new Map(rows.map((row) => [row.stripe_session_id, row]));
  const missing = [];
  const mismatches = [];
  for (const expected of expectedPurchaseSpecs) {
    const actual = rowsBySessionId.get(expected.stripe_session_id);
    if (!actual) {
      missing.push(expected);
      continue;
    }
    if (actual.user_id !== expected.user_id || actual.product_type !== expected.product_type) {
      mismatches.push({ expected, actual });
    }
  }
  return { missing, mismatches, complete: missing.length === 0 && mismatches.length === 0 };
}

export function buildMissingPurchaseRows(existingPurchases, expectedPurchaseSpecs) {
  const existingSessionIds = new Set(
    existingPurchases.map((row) => row.stripe_session_id).filter(Boolean)
  );
  return expectedPurchaseSpecs
    .filter((spec) => !existingSessionIds.has(spec.stripe_session_id))
    .map((spec) => ({
      user_id: spec.user_id,
      product_type: spec.product_type,
      job_id: null,
      consumed_at: null,
      stripe_session_id: spec.stripe_session_id,
    }));
}

function safeWebhookError(res, code, status = 400) {
  return res.status(status).json({ error: code });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).send("Missing Stripe signature");

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe signature verification failed:", err?.message || err);
    return res.status(400).send("Webhook Error: Invalid signature");
  }

  if (event.type !== "checkout.session.completed") {
    return res.status(200).json({ received: true, processed: false });
  }

  const session = event?.data?.object || null;
  const sessionId = String(session?.id || "").trim();
  const eventId = String(event?.id || "").trim();
  const userId = String(session?.metadata?.userId || "").trim();
  const productType = normalizeCommerceProductType(session?.metadata?.productType);
  const quantity = normalizeCommerceQuantity(productType, session?.metadata?.quantity);
  const catalogVersion = String(session?.metadata?.catalogVersion || "").trim();

  if (!sessionId || !eventId || !userId || !productType || quantity === null) {
    console.error("Checkout webhook identity or catalog metadata is incomplete", {
      eventId,
      sessionId,
      productType,
    });
    return safeWebhookError(res, "CHECKOUT_IDENTITY_INVALID");
  }
  if (catalogVersion !== COMMERCE_CATALOG_VERSION) {
    console.error("Checkout webhook catalog version mismatch", { eventId, sessionId, catalogVersion });
    return safeWebhookError(res, "CHECKOUT_CATALOG_VERSION_INVALID");
  }

  const configuredPrice = getConfiguredStripePrice(productType);
  if (!configuredPrice.ok) {
    console.error("Checkout webhook price configuration missing", { productType });
    return safeWebhookError(res, "CHECKOUT_PRICE_CONFIGURATION_INVALID", 500);
  }

  let lineItems;
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 10,
      expand: ["data.price.product"],
    });
  } catch (err) {
    console.error("Checkout webhook line-item lookup failed", {
      eventId,
      sessionId,
      error: err?.message,
    });
    return safeWebhookError(res, "CHECKOUT_LINE_ITEM_LOOKUP_FAILED", 500);
  }

  if (!Array.isArray(lineItems?.data) || lineItems.data.length !== 1) {
    console.error("Checkout webhook requires exactly one canonical line item", {
      eventId,
      sessionId,
      lineItemCount: lineItems?.data?.length ?? null,
    });
    return safeWebhookError(res, "CHECKOUT_LINE_ITEM_INVALID");
  }

  const lineItem = lineItems.data[0];
  const lineItemQuantity = normalizeCommerceQuantity(productType, lineItem?.quantity);
  if (lineItemQuantity === null || lineItemQuantity !== quantity) {
    console.error("Checkout quantity differs from the authenticated catalog request", {
      eventId,
      sessionId,
      metadataQuantity: quantity,
      lineItemQuantity,
    });
    return safeWebhookError(res, "CHECKOUT_QUANTITY_MISMATCH");
  }

  const priceValidation = validateStripePriceAgainstCatalog({
    price: lineItem?.price,
    productType,
    configuredPriceId: configuredPrice.priceId,
  });
  if (!priceValidation.ok) {
    console.error("Checkout webhook Stripe Price failed the canonical catalog contract", {
      eventId,
      sessionId,
      productType,
      issues: priceValidation.issues,
    });
    return safeWebhookError(res, "CHECKOUT_PRICE_INVALID");
  }

  const sessionValidation = validateCompletedCheckoutSession({ session, productType, quantity });
  if (!sessionValidation.ok) {
    console.error("Checkout webhook payment state failed the canonical commerce contract", {
      eventId,
      sessionId,
      issues: sessionValidation.issues,
    });
    return safeWebhookError(res, "CHECKOUT_PAYMENT_STATE_INVALID");
  }

  const allocation = buildExpectedEntitlementAllocation(productType, quantity);
  if (
    Number(session?.metadata?.screeningEntitlements) !== allocation.screening ||
    Number(session?.metadata?.underwritingEntitlements) !== allocation.underwriting
  ) {
    console.error("Checkout webhook entitlement metadata mismatch", { eventId, sessionId, productType });
    return safeWebhookError(res, "CHECKOUT_ENTITLEMENT_METADATA_INVALID");
  }

  const { data: grantRows, error: grantError } = await supabaseAdmin.rpc(
    "grant_checkout_entitlements_v1",
    {
      p_stripe_event_id: eventId,
      p_stripe_session_id: sessionId,
      p_user_id: userId,
      p_checkout_product_type: productType,
      p_quantity: quantity,
      p_catalog_version: COMMERCE_CATALOG_VERSION,
      p_stripe_price_id: configuredPrice.priceId,
      p_currency: String(session.currency || "").toLowerCase(),
      p_amount_subtotal: Number(session.amount_subtotal),
      p_amount_total: Number(session.amount_total),
      p_checkout_status: String(session.status || ""),
      p_payment_status: String(session.payment_status || ""),
    }
  );

  if (grantError) {
    console.error("Atomic checkout entitlement grant failed", {
      eventId,
      sessionId,
      code: grantError.code || null,
      message: grantError.message || null,
    });
    return safeWebhookError(res, "CHECKOUT_ENTITLEMENT_GRANT_FAILED", 500);
  }

  const grant = Array.isArray(grantRows) ? grantRows[0] : grantRows;
  if (
    !grant?.receipt_id ||
    Number(grant.entitlement_count) !== allocation.total ||
    Number(grant.screening_entitlements) !== allocation.screening ||
    Number(grant.underwriting_entitlements) !== allocation.underwriting
  ) {
    console.error("Atomic checkout entitlement grant returned an invalid receipt", {
      eventId,
      sessionId,
    });
    return safeWebhookError(res, "CHECKOUT_ENTITLEMENT_RECEIPT_INVALID", 500);
  }

  return res.status(200).json({
    received: true,
    processed: true,
    idempotent: grant.idempotent_replay === true,
  });
}
