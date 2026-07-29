// src/lib/pricingConfig.js
// ─────────────────────────────────────────────────────────────────────────────
// Validates that Stripe price IDs are present in the environment.
// Pricing: Screening / Underwriting / Bundle availability
// ─────────────────────────────────────────────────────────────────────────────

const PRICE_ENV_BY_PRODUCT = {
  screening: 'VITE_STRIPE_PRICE_ID_SCREENING',
  underwriting: 'VITE_STRIPE_PRICE_ID_UNDERWRITING',
  bundle: 'VITE_STRIPE_PRICE_ID_BUNDLE',
};

export function getProductPricingAvailability(productType, pricingEnv = import.meta.env) {
  const normalizedProductType = String(productType || '').trim();
  const envKey = PRICE_ENV_BY_PRODUCT[normalizedProductType];

  if (!envKey) {
    return {
      ok: false,
      missing: [],
      priceId: null,
      envKey: null,
      productType: normalizedProductType,
    };
  }

  const priceId = String(pricingEnv?.[envKey] || '').trim();
  return {
    ok: Boolean(priceId),
    missing: priceId ? [] : [envKey],
    priceId: priceId || null,
    envKey,
    productType: normalizedProductType,
  };
}

export function getPricingAvailabilityMap(pricingEnv = import.meta.env) {
  return {
    screening: getProductPricingAvailability('screening', pricingEnv),
    underwriting: getProductPricingAvailability('underwriting', pricingEnv),
    bundle: getProductPricingAvailability('bundle', pricingEnv),
  };
}
