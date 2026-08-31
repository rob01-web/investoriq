export const COMMERCE_CATALOG_VERSION = 'investoriq-commerce-v1-2026-08-31';
export const COMMERCE_CURRENCY = 'usd';

const catalog = {
  screening: {
    productType: 'screening',
    displayName: 'Screening Report',
    unitAmount: 19900,
    currency: COMMERCE_CURRENCY,
    priceEnvKey: 'STRIPE_PRICE_SCREENING',
    quantity: { minimum: 1, maximum: 5, fixed: false },
    entitlementUnit: { screening: 1, underwriting: 0 },
  },
  underwriting: {
    productType: 'underwriting',
    displayName: 'Underwriting Report',
    unitAmount: 49900,
    currency: COMMERCE_CURRENCY,
    priceEnvKey: 'STRIPE_PRICE_UNDERWRITING',
    quantity: { minimum: 1, maximum: 5, fixed: false },
    entitlementUnit: { screening: 0, underwriting: 1 },
  },
  bundle: {
    productType: 'bundle',
    displayName: 'Launch Bundle',
    unitAmount: 69900,
    currency: COMMERCE_CURRENCY,
    priceEnvKey: 'STRIPE_PRICE_BUNDLE',
    quantity: { minimum: 1, maximum: 1, fixed: true },
    entitlementUnit: { screening: 2, underwriting: 1 },
  },
};

export const COMMERCE_PRODUCT_TYPES = Object.freeze(Object.keys(catalog));
export const COMMERCE_CATALOG = Object.freeze(
  Object.fromEntries(
    Object.entries(catalog).map(([key, value]) => [
      key,
      Object.freeze({
        ...value,
        quantity: Object.freeze({ ...value.quantity }),
        entitlementUnit: Object.freeze({ ...value.entitlementUnit }),
      }),
    ])
  )
);

export function normalizeCommerceProductType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return COMMERCE_PRODUCT_TYPES.includes(normalized) ? normalized : '';
}

export function normalizeCommerceQuantity(productType, quantity) {
  const normalizedProductType = normalizeCommerceProductType(productType);
  const product = COMMERCE_CATALOG[normalizedProductType];
  if (!product) return null;

  if (
    quantity === undefined ||
    quantity === null ||
    (typeof quantity === 'string' && quantity.trim() === '')
  ) {
    return 1;
  }

  const raw = typeof quantity === 'number' ? String(quantity) : String(quantity).trim();
  if (!/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed)) return null;
  if (parsed < product.quantity.minimum || parsed > product.quantity.maximum) return null;
  return parsed;
}

export function getCommerceCatalogProduct(productType) {
  return COMMERCE_CATALOG[normalizeCommerceProductType(productType)] || null;
}

export function buildExpectedEntitlementAllocation(productType, quantity) {
  const product = getCommerceCatalogProduct(productType);
  const normalizedQuantity = normalizeCommerceQuantity(productType, quantity);
  if (!product || normalizedQuantity === null) return null;
  return {
    screening: product.entitlementUnit.screening * normalizedQuantity,
    underwriting: product.entitlementUnit.underwriting * normalizedQuantity,
    total:
      (product.entitlementUnit.screening + product.entitlementUnit.underwriting) *
      normalizedQuantity,
  };
}

export function buildExpectedPurchaseSpecs({ sessionId, productType, quantity, userId }) {
  const normalizedProductType = normalizeCommerceProductType(productType);
  const normalizedQuantity = normalizeCommerceQuantity(normalizedProductType, quantity);
  const allocation = buildExpectedEntitlementAllocation(normalizedProductType, normalizedQuantity);
  if (!sessionId || !userId || !allocation) return [];

  const entitlementTypes = [
    ...Array.from({ length: allocation.screening }, () => 'screening'),
    ...Array.from({ length: allocation.underwriting }, () => 'underwriting'),
  ];

  return entitlementTypes.map((entitlementProductType, index) => ({
    stripe_session_id: index === 0 ? sessionId : `${sessionId}#${index + 1}`,
    user_id: userId,
    product_type: entitlementProductType,
    bundle_slot:
      normalizedProductType === 'bundle'
        ? `${entitlementProductType}_${
            entitlementTypes.slice(0, index + 1).filter((value) => value === entitlementProductType).length
          }`
        : null,
  }));
}

export function getConfiguredStripePrice(productType, env = process.env) {
  const product = getCommerceCatalogProduct(productType);
  if (!product) return { ok: false, product: null, priceId: null, missing: [] };
  const priceId = String(env?.[product.priceEnvKey] || '').trim();
  return {
    ok: Boolean(priceId),
    product,
    priceId: priceId || null,
    missing: priceId ? [] : [product.priceEnvKey],
  };
}

function stripeProductObject(price) {
  return price?.product && typeof price.product === 'object' ? price.product : null;
}

export function validateStripePriceAgainstCatalog({ price, productType, configuredPriceId }) {
  const product = getCommerceCatalogProduct(productType);
  const stripeProduct = stripeProductObject(price);
  const issues = [];

  if (!product) issues.push('CATALOG_PRODUCT_INVALID');
  if (!price?.id || price.id !== configuredPriceId) issues.push('STRIPE_PRICE_ID_MISMATCH');
  if (price?.active !== true) issues.push('STRIPE_PRICE_INACTIVE');
  if (String(price?.currency || '').toLowerCase() !== product?.currency) issues.push('STRIPE_PRICE_CURRENCY_MISMATCH');
  if (Number(price?.unit_amount) !== product?.unitAmount) issues.push('STRIPE_PRICE_AMOUNT_MISMATCH');
  if (price?.type !== 'one_time') issues.push('STRIPE_PRICE_TYPE_MISMATCH');
  if (!stripeProduct || stripeProduct.active !== true) issues.push('STRIPE_PRODUCT_INACTIVE_OR_UNEXPANDED');
  if (stripeProduct?.metadata?.investoriq_product_type !== product?.productType) {
    issues.push('STRIPE_PRODUCT_IDENTITY_MISMATCH');
  }
  if (stripeProduct?.metadata?.investoriq_catalog_version !== COMMERCE_CATALOG_VERSION) {
    issues.push('STRIPE_PRODUCT_CATALOG_VERSION_MISMATCH');
  }

  return { ok: issues.length === 0, issues, product, stripeProduct };
}

export function validateCompletedCheckoutSession({ session, productType, quantity }) {
  const product = getCommerceCatalogProduct(productType);
  const normalizedQuantity = normalizeCommerceQuantity(productType, quantity);
  const issues = [];
  const expectedSubtotal = product && normalizedQuantity !== null
    ? product.unitAmount * normalizedQuantity
    : null;
  const subtotal = Number(session?.amount_subtotal);
  const total = Number(session?.amount_total);
  const status = String(session?.status || '');
  const paymentStatus = String(session?.payment_status || '');

  if (!product || normalizedQuantity === null) issues.push('CHECKOUT_CATALOG_INPUT_INVALID');
  if (status !== 'complete') issues.push('CHECKOUT_NOT_COMPLETE');
  if (String(session?.currency || '').toLowerCase() !== product?.currency) issues.push('CHECKOUT_CURRENCY_MISMATCH');
  if (!Number.isSafeInteger(subtotal) || subtotal !== expectedSubtotal) issues.push('CHECKOUT_SUBTOTAL_MISMATCH');
  if (!Number.isSafeInteger(total) || total < 0 || total > subtotal) issues.push('CHECKOUT_TOTAL_INVALID');

  const paid = paymentStatus === 'paid';
  const validZeroDollar = paymentStatus === 'no_payment_required' && total === 0;
  if (!paid && !validZeroDollar) issues.push('CHECKOUT_PAYMENT_NOT_SETTLED');

  return {
    ok: issues.length === 0,
    issues,
    paid,
    validZeroDollar,
    expectedSubtotal,
    product,
    normalizedQuantity,
  };
}

export function buildPublicCommerceCatalog(availabilityByProduct = {}) {
  return {
    version: COMMERCE_CATALOG_VERSION,
    currency: COMMERCE_CURRENCY,
    products: Object.fromEntries(
      COMMERCE_PRODUCT_TYPES.map((productType) => {
        const product = COMMERCE_CATALOG[productType];
        return [
          productType,
          {
            productType,
            displayName: product.displayName,
            unitAmount: product.unitAmount,
            displayPrice: `$${(product.unitAmount / 100).toLocaleString('en-US')}`,
            currency: product.currency,
            available: availabilityByProduct[productType] === true,
            quantity: { ...product.quantity },
            entitlements: { ...product.entitlementUnit },
          },
        ];
      })
    ),
  };
}
