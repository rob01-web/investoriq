// api/create-checkout-session.js
import Stripe from "stripe";
import { resolveAuthenticatedActor } from "./_lib/authenticated-actor.js";
import {
  COMMERCE_CATALOG_VERSION,
  COMMERCE_PRODUCT_TYPES,
  buildExpectedEntitlementAllocation,
  buildPublicCommerceCatalog,
  getConfiguredStripePrice,
  normalizeCommerceProductType,
  normalizeCommerceQuantity,
  validateStripePriceAgainstCatalog,
} from "./_lib/commerce-catalog.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Canonical productType contract (LOCKED):
// screening, underwriting, bundle
export function normalizeProductType({ productType, planKey }) {
  return normalizeCommerceProductType(productType || planKey || "");
}

export const PRICE_CONFIG = Object.fromEntries(
  COMMERCE_PRODUCT_TYPES.map((productType) => {
    const resolution = getConfiguredStripePrice(productType);
    return [productType, { priceId: resolution.priceId, mode: "payment" }];
  })
);

export const ALLOWED_PRODUCT_TYPES = [...COMMERCE_PRODUCT_TYPES];

function requiredEnvFor(productType) {
  switch (productType) {
    case "screening": return "STRIPE_PRICE_SCREENING";
    case "underwriting": return "STRIPE_PRICE_UNDERWRITING";
    case "bundle": return "STRIPE_PRICE_BUNDLE";
    default: return "UNKNOWN";
  }
}

export function getValidatedPriceConfig() {
  const missing = [];
  for (const type of ALLOWED_PRODUCT_TYPES) {
    const priceId = PRICE_CONFIG?.[type]?.priceId;
    if (!priceId) missing.push(requiredEnvFor(type));
  }

  return {
    ok: missing.length === 0,
    missing,
    config: PRICE_CONFIG,
  };
}

export function getValidatedPriceConfigForProduct(productType, priceConfig = PRICE_CONFIG) {
  const normalizedProductType = normalizeProductType({ productType });
  if (!normalizedProductType) {
    return {
      ok: false,
      missing: [],
      config: null,
      normalizedProductType: "",
    };
  }

  const config = priceConfig?.[normalizedProductType];
  if (!config?.priceId) {
    return {
      ok: false,
      missing: [requiredEnvFor(normalizedProductType)],
      config: null,
      normalizedProductType,
    };
  }

  return {
    ok: true,
    missing: [],
    config,
    normalizedProductType,
  };
}

function normalizeStandaloneQuantity(quantity) {
  return normalizeCommerceQuantity("screening", quantity);
}

function normalizeBundleQuantity(quantity) {
  if (quantity === undefined || quantity === null || String(quantity).trim() === "") {
    return 1;
  }
  if (typeof quantity === "number") {
    return quantity === 1 ? 1 : null;
  }
  if (typeof quantity === "string") {
    return /^\s*1\s*$/.test(quantity) ? 1 : null;
  }
  return null;
}

export function normalizeCheckoutQuantity({ productType, quantity }) {
  if (productType === "bundle") return normalizeBundleQuantity(quantity);
  if (productType === "screening" || productType === "underwriting") {
    return normalizeStandaloneQuantity(quantity);
  }
  return null;
}

export function buildCheckoutLineItem({ normalizedProductType, normalizedQuantity, priceId }) {
  const lineItem = { price: priceId };
  return {
    ...lineItem,
    quantity: normalizedProductType === "bundle" ? 1 : normalizedQuantity,
  };
}

export function buildCheckoutMetadata({ actorId, normalizedProductType, normalizedQuantity }) {
  const allocation = buildExpectedEntitlementAllocation(normalizedProductType, normalizedQuantity);
  return {
    userId: actorId,
    productType: normalizedProductType || "",
    quantity: String(normalizedQuantity),
    catalogVersion: COMMERCE_CATALOG_VERSION,
    screeningEntitlements: String(allocation?.screening ?? 0),
    underwritingEntitlements: String(allocation?.underwriting ?? 0),
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const availabilityEntries = await Promise.all(
        COMMERCE_PRODUCT_TYPES.map(async (productType) => {
          const configuredPrice = getConfiguredStripePrice(productType);
          if (!configuredPrice.ok) return [productType, false];
          try {
            const price = await stripe.prices.retrieve(configuredPrice.priceId, { expand: ["product"] });
            const validation = validateStripePriceAgainstCatalog({
              price,
              productType,
              configuredPriceId: configuredPrice.priceId,
            });
            return [productType, validation.ok];
          } catch (error) {
            console.error("Commerce catalog availability check failed", {
              productType,
              message: error?.message || null,
            });
            return [productType, false];
          }
        })
      );
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      return res.status(200).json(
        buildPublicCommerceCatalog(Object.fromEntries(availabilityEntries))
      );
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await resolveAuthenticatedActor(req);
    if (!auth.ok) {
      return res.status(auth.status).json({
        error: auth.error,
        ...(auth.missing ? { missing: auth.missing } : {}),
      });
    }

    const { productType, planKey, quantity } = req.body || {};

    const normalizedProductType = normalizeProductType({ productType, planKey });
    if (!normalizedProductType) {
      return res.status(400).json({ error: "Invalid productType" });
    }

    const normalizedQuantity = normalizeCheckoutQuantity({ productType: normalizedProductType, quantity });
    if (normalizedQuantity === null) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const { ok: configOk, missing, config } = getValidatedPriceConfigForProduct(normalizedProductType);
    if (!configOk) {
      console.error("Canonical Stripe price configuration is incomplete", {
        productType: normalizedProductType,
        missing,
      });
      return res.status(503).json({ error: "Pricing is temporarily unavailable" });
    }

    const price = await stripe.prices.retrieve(config.priceId, { expand: ["product"] });
    const priceValidation = validateStripePriceAgainstCatalog({
      price,
      productType: normalizedProductType,
      configuredPriceId: config.priceId,
    });
    if (!priceValidation.ok) {
      console.error("Configured Stripe price failed the canonical commerce contract:", {
        productType: normalizedProductType,
        issues: priceValidation.issues,
      });
      return res.status(503).json({ error: "Pricing is temporarily unavailable" });
    }

    const baseUrl = String(process.env.PUBLIC_SITE_URL || "https://investoriq.tech").replace(/\/$/, "");

    const finalSuccessUrl = `${baseUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = `${baseUrl}/dashboard?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{
        ...buildCheckoutLineItem({
          normalizedProductType,
          normalizedQuantity,
          priceId: config.priceId,
        }),
      }],
      allow_promotion_codes: true,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      client_reference_id: auth.actor.id,
      ...(auth.actor.email ? { customer_email: auth.actor.email } : {}),
      metadata: {
        ...buildCheckoutMetadata({
          actorId: auth.actor.id,
          normalizedProductType,
          normalizedQuantity,
        }),
      },
    });

    return res.status(200).json({
      url: session.url,
      catalogVersion: COMMERCE_CATALOG_VERSION,
      productType: normalizedProductType,
      quantity: normalizedQuantity,
    });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
