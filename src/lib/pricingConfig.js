export function getValidatedPriceConfig() {
  const screeningId = String(import.meta.env.VITE_STRIPE_PRICE_ID_SCREENING || '').trim();
  const underwritingId = String(import.meta.env.VITE_STRIPE_PRICE_ID_UNDERWRITING || '').trim();

  const missing = [];
  if (!screeningId) missing.push('VITE_STRIPE_PRICE_ID_SCREENING');
  if (!underwritingId) missing.push('VITE_STRIPE_PRICE_ID_UNDERWRITING');

  return {
    ok: missing.length === 0,
    missing,
    prices: {
      screening: { priceId: screeningId || null, amount: 249, currency: 'USD' },
      underwriting: { priceId: underwritingId || null, amount: 699, currency: 'USD' },
    },
  };
}
