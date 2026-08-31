import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  isInvestorIQAdmin,
  resolveAuthenticatedResourceOwnership,
  resolveAuthenticatedActor,
} from "./_lib/authenticated-actor.js";
import {
  COMMERCE_CATALOG_VERSION,
  buildExpectedEntitlementAllocation,
  buildExpectedPurchaseSpecs,
  getConfiguredStripePrice,
  normalizeCommerceProductType,
  normalizeCommerceQuantity,
  validateCompletedCheckoutSession,
} from "./_lib/commerce-catalog.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await resolveAuthenticatedActor(req);
    if (!auth.ok) {
      return res.status(auth.status).json({
        error: auth.error,
        ...(auth.missing ? { missing: auth.missing } : {}),
      });
    }

    if (req.query?.auth_context === "1") {
      return res.status(200).json({
        authenticated: true,
        destination: isInvestorIQAdmin(auth.actor) ? "admin" : "customer",
      });
    }

    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const sessionOwnerId =
      session?.client_reference_id || session?.metadata?.userId || "";
    const ownership = resolveAuthenticatedResourceOwnership({
      auth,
      resourceOwnerId: sessionOwnerId,
      allowAdminBypass: false,
      requireResourceOwnerId: true,
      resourceType: "checkout_session",
    });
    if (!ownership.ok) {
      return res.status(ownership.status).json({ error: ownership.error });
    }

    const productType = normalizeCommerceProductType(session?.metadata?.productType);
    const quantity = normalizeCommerceQuantity(productType, session?.metadata?.quantity);
    const catalogVersion = String(session?.metadata?.catalogVersion || "").trim();
    const allocation = buildExpectedEntitlementAllocation(productType, quantity);
    const paymentValidation = validateCompletedCheckoutSession({ session, productType, quantity });

    if (
      !productType ||
      quantity === null ||
      !allocation ||
      catalogVersion !== COMMERCE_CATALOG_VERSION
    ) {
      return res.status(409).json({
        id: session.id,
        entitlement_status: "verification_failed",
        error: "CHECKOUT_CATALOG_METADATA_INVALID",
      });
    }

    if (!paymentValidation.ok) {
      return res.status(200).json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        entitlement_status: "payment_incomplete",
        productType,
        quantity,
      });
    }

    const configuredPrice = getConfiguredStripePrice(productType);
    if (!configuredPrice.ok) {
      return res.status(503).json({
        id: session.id,
        entitlement_status: "verification_unavailable",
      });
    }

    const { data: receipt, error: receiptError } = await supabaseAdmin
      .from("commerce_checkout_receipts")
      .select("id, stripe_session_id, user_id, checkout_product_type, quantity, catalog_version, stripe_price_id, currency, amount_subtotal, amount_total, checkout_status, payment_status, expected_screening_count, expected_underwriting_count, entitlement_count")
      .eq("stripe_session_id", session.id)
      .eq("user_id", auth.actor.id)
      .maybeSingle();

    if (receiptError) {
      console.error("Checkout entitlement receipt lookup failed:", receiptError);
      return res.status(503).json({
        id: session.id,
        entitlement_status: "verification_unavailable",
      });
    }

    if (!receipt) {
      return res.status(200).json({
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        entitlement_status: "processing",
        productType,
        quantity,
      });
    }

    const receiptValid =
      receipt.checkout_product_type === productType &&
      Number(receipt.quantity) === quantity &&
      receipt.catalog_version === COMMERCE_CATALOG_VERSION &&
      receipt.stripe_price_id === configuredPrice.priceId &&
      receipt.currency === paymentValidation.product.currency &&
      Number(receipt.amount_subtotal) === paymentValidation.expectedSubtotal &&
      Number(receipt.amount_total) === Number(session.amount_total) &&
      receipt.checkout_status === session.status &&
      receipt.payment_status === session.payment_status &&
      Number(receipt.expected_screening_count) === allocation.screening &&
      Number(receipt.expected_underwriting_count) === allocation.underwriting &&
      Number(receipt.entitlement_count) === allocation.total;

    if (!receiptValid) {
      console.error("Checkout entitlement receipt failed lineage verification", {
        sessionId: session.id,
        receiptId: receipt.id,
      });
      return res.status(409).json({
        id: session.id,
        entitlement_status: "verification_failed",
      });
    }

    const expectedSpecs = buildExpectedPurchaseSpecs({
      sessionId: session.id,
      productType,
      quantity,
      userId: auth.actor.id,
    });
    const expectedSessionIds = expectedSpecs.map((spec) => spec.stripe_session_id);
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from("report_purchases")
      .select("stripe_session_id, user_id, product_type")
      .in("stripe_session_id", expectedSessionIds);

    if (purchasesError) {
      console.error("Checkout entitlement row lookup failed:", purchasesError);
      return res.status(503).json({ id: session.id, entitlement_status: "verification_unavailable" });
    }

    const purchasesBySessionId = new Map(
      (purchases || []).map((purchase) => [purchase.stripe_session_id, purchase])
    );
    const entitlementsValid = expectedSpecs.every((expected) => {
      const actual = purchasesBySessionId.get(expected.stripe_session_id);
      return actual?.user_id === expected.user_id && actual?.product_type === expected.product_type;
    }) && purchasesBySessionId.size === expectedSpecs.length;

    if (!entitlementsValid) {
      console.error("Checkout entitlement rows failed receipt verification", {
        sessionId: session.id,
        receiptId: receipt.id,
      });
      return res.status(409).json({
        id: session.id,
        entitlement_status: "verification_failed",
        productType,
        quantity,
      });
    }

    return res.status(200).json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      entitlement_status: "granted",
      productType,
      quantity,
      entitlements: allocation,
      catalogVersion: COMMERCE_CATALOG_VERSION,
    });
  } catch (err) {
    console.error("checkout-session error:", err);
    return res.status(500).json({ error: "Failed to retrieve checkout session" });
  }
}
