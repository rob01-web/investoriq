import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.status(200).json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata || {},
      productType: session?.metadata?.productType || null,
    });
  } catch (err) {
    console.error("checkout-session error:", err);
    return res.status(500).json({ error: "Failed to retrieve checkout session" });
  }
}
