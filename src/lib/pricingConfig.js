// src/lib/pricingConfig.js
// ─────────────────────────────────────────────────────────────────────────────
// Validates that Stripe price IDs are present in the environment.
// Used as a runtime guard before initiating checkout.
// Pricing: $399 Screening / $1,499 Underwriting (updated March 2026)
// ─────────────────────────────────────────────────────────────────────────────

export function getValidatedPriceConfig() {
  const screeningId    = String(import.meta.env.VITE_STRIPE_PRICE_ID_SCREENING    || '').trim();
  const underwritingId = String(import.meta.env.VITE_STRIPE_PRICE_ID_UNDERWRITING || '').trim();

  const missing = [];
  if (!screeningId)    missing.push('VITE_STRIPE_PRICE_ID_SCREENING');
  if (!underwritingId) missing.push('VITE_STRIPE_PRICE_ID_UNDERWRITING');

  return {
    ok: missing.length === 0,
    missing,
    prices: {
      screening: {
        priceId:  screeningId    || null,
        amount:   399,
        currency: 'USD',
        label:    'Screening Report',
      },
      underwriting: {
        priceId:  underwritingId || null,
        amount:   1499,
        currency: 'USD',
        label:    'Underwriting Report',
      },
    },
  };
}
