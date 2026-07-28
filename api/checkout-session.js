import Stripe from "stripe";
import {
  isInvestorIQAdmin,
  resolveAuthenticatedResourceOwnership,
  resolveAuthenticatedActor,
} from "./_lib/authenticated-actor.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    return res.status(200).json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      productType: session?.metadata?.productType || null,
      quantity: session?.metadata?.quantity || null,
    });
  } catch (err) {
    console.error("checkout-session error:", err);
    return res.status(500).json({ error: "Failed to retrieve checkout session" });
  }
}
