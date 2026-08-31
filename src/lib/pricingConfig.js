// Public commerce catalog loader. Prices and availability come from the
// server-owned checkout authority, never from client environment Price IDs.

export const EMPTY_PRICING_CATALOG = Object.freeze({
  version: null,
  currency: null,
  products: Object.freeze({}),
});

const PRODUCT_TYPES = ['screening', 'underwriting', 'bundle'];

export function validatePublicCommerceCatalog(value) {
  if (!value || typeof value !== 'object' || !value.version || value.currency !== 'usd') {
    return { ok: false, catalog: EMPTY_PRICING_CATALOG };
  }

  for (const productType of PRODUCT_TYPES) {
    const product = value?.products?.[productType];
    if (
      product?.productType !== productType ||
      !Number.isSafeInteger(product?.unitAmount) ||
      product.unitAmount <= 0 ||
      typeof product?.displayPrice !== 'string' ||
      product?.currency !== value.currency ||
      typeof product?.available !== 'boolean' ||
      !Number.isSafeInteger(product?.entitlements?.screening) ||
      !Number.isSafeInteger(product?.entitlements?.underwriting)
    ) {
      return { ok: false, catalog: EMPTY_PRICING_CATALOG };
    }
  }

  return { ok: true, catalog: value };
}

export async function loadCommerceCatalog(fetchImpl = fetch) {
  const response = await fetchImpl('/api/create-checkout-session', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('COMMERCE_CATALOG_UNAVAILABLE');
  const validation = validatePublicCommerceCatalog(payload);
  if (!validation.ok) throw new Error('COMMERCE_CATALOG_INVALID');
  return validation.catalog;
}

export function getProductPricingAvailability(productType, catalog = EMPTY_PRICING_CATALOG) {
  const normalizedProductType = String(productType || '').trim();
  const product = catalog?.products?.[normalizedProductType] || null;
  return {
    ok: product?.available === true,
    missing: product?.available === true ? [] : [normalizedProductType || 'product'],
    product,
    productType: normalizedProductType,
  };
}

export function getPricingAvailabilityMap(catalog = EMPTY_PRICING_CATALOG) {
  return Object.fromEntries(
    PRODUCT_TYPES.map((productType) => [
      productType,
      getProductPricingAvailability(productType, catalog),
    ])
  );
}
