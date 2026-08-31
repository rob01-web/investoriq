import assert from 'node:assert/strict';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.STRIPE_SECRET_KEY ||= 'sk_test_bundle_smoke';
process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_bundle_smoke';
process.env.STRIPE_PRICE_SCREENING ||= 'price_screening_smoke';
process.env.STRIPE_PRICE_UNDERWRITING ||= 'price_underwriting_smoke';
process.env.STRIPE_PRICE_BUNDLE ||= 'price_bundle_smoke';

const {
  COMMERCE_CATALOG,
  COMMERCE_CATALOG_VERSION,
  buildExpectedEntitlementAllocation,
  buildExpectedPurchaseSpecs,
  buildPublicCommerceCatalog,
  normalizeCommerceQuantity,
  validateCompletedCheckoutSession,
  validateStripePriceAgainstCatalog,
} = await import('../../api/_lib/commerce-catalog.js');

const {
  ALLOWED_PRODUCT_TYPES,
  buildCheckoutLineItem,
  buildCheckoutMetadata,
  normalizeCheckoutQuantity,
  normalizeProductType,
} = await import('../../api/create-checkout-session.js');

const {
  CHECKOUT_PRODUCT_TYPES,
  ENTITLEMENT_PRODUCT_TYPES,
  verifyExpectedPurchaseSpecs,
} = await import('../../api/webhook.js');

assert.equal(COMMERCE_CATALOG.screening.unitAmount, 19900);
assert.equal(COMMERCE_CATALOG.underwriting.unitAmount, 49900);
assert.equal(COMMERCE_CATALOG.bundle.unitAmount, 69900);
assert.ok(Object.values(COMMERCE_CATALOG).every((product) => product.currency === 'usd'));
assert.deepEqual(ALLOWED_PRODUCT_TYPES, ['screening', 'underwriting', 'bundle']);
assert.deepEqual(CHECKOUT_PRODUCT_TYPES, ALLOWED_PRODUCT_TYPES);
assert.deepEqual(ENTITLEMENT_PRODUCT_TYPES, ['screening', 'underwriting']);

for (const productType of ['screening', 'underwriting']) {
  for (let quantity = 1; quantity <= 5; quantity += 1) {
    assert.equal(normalizeCommerceQuantity(productType, quantity), quantity);
    assert.equal(normalizeCheckoutQuantity({ productType, quantity }), quantity);
    const allocation = buildExpectedEntitlementAllocation(productType, quantity);
    assert.equal(allocation.total, quantity);
    assert.equal(allocation[productType], quantity);
  }
}

for (const invalid of [0, 6, -1, 1.5, '1.0', '2x', {}, []]) {
  assert.equal(normalizeCommerceQuantity('screening', invalid), null);
}
assert.equal(normalizeCommerceQuantity('bundle', 1), 1);
assert.equal(normalizeCommerceQuantity('bundle', 2), null);
assert.equal(normalizeProductType({ productType: 'premium' }), '');

assert.deepEqual(buildExpectedEntitlementAllocation('bundle', 1), {
  screening: 2,
  underwriting: 1,
  total: 3,
});

const bundleSpecs = buildExpectedPurchaseSpecs({
  sessionId: 'cs_bundle',
  productType: 'bundle',
  quantity: 1,
  userId: 'user-bundle',
});
assert.deepEqual(bundleSpecs.map((spec) => spec.product_type), [
  'screening',
  'screening',
  'underwriting',
]);
assert.deepEqual(bundleSpecs.map((spec) => spec.stripe_session_id), [
  'cs_bundle',
  'cs_bundle#2',
  'cs_bundle#3',
]);
assert.deepEqual(bundleSpecs.map((spec) => spec.bundle_slot), [
  'screening_1',
  'screening_2',
  'underwriting_1',
]);

const metadata = buildCheckoutMetadata({
  actorId: 'user-bundle',
  normalizedProductType: 'bundle',
  normalizedQuantity: 1,
});
assert.deepEqual(metadata, {
  userId: 'user-bundle',
  productType: 'bundle',
  quantity: '1',
  catalogVersion: COMMERCE_CATALOG_VERSION,
  screeningEntitlements: '2',
  underwritingEntitlements: '1',
});

const lineItem = buildCheckoutLineItem({
  normalizedProductType: 'screening',
  normalizedQuantity: 5,
  priceId: 'price_screening_smoke',
});
assert.deepEqual(lineItem, { price: 'price_screening_smoke', quantity: 5 });

function canonicalPrice(productType, overrides = {}) {
  const product = COMMERCE_CATALOG[productType];
  return {
    id: `price_${productType}_smoke`,
    active: true,
    currency: product.currency,
    unit_amount: product.unitAmount,
    type: 'one_time',
    product: {
      id: `prod_${productType}_smoke`,
      active: true,
      metadata: {
        investoriq_product_type: productType,
        investoriq_catalog_version: COMMERCE_CATALOG_VERSION,
      },
    },
    ...overrides,
  };
}

for (const productType of ALLOWED_PRODUCT_TYPES) {
  const price = canonicalPrice(productType);
  assert.equal(validateStripePriceAgainstCatalog({
    price,
    productType,
    configuredPriceId: price.id,
  }).ok, true);
}

assert.equal(validateStripePriceAgainstCatalog({
  price: canonicalPrice('screening', { unit_amount: 49900 }),
  productType: 'screening',
  configuredPriceId: 'price_screening_smoke',
}).ok, false);
assert.equal(validateStripePriceAgainstCatalog({
  price: canonicalPrice('screening', { currency: 'cad' }),
  productType: 'screening',
  configuredPriceId: 'price_screening_smoke',
}).ok, false);
assert.equal(validateStripePriceAgainstCatalog({
  price: canonicalPrice('screening', { type: null }),
  productType: 'screening',
  configuredPriceId: 'price_screening_smoke',
}).ok, false);

function checkoutSession(productType, quantity, overrides = {}) {
  const product = COMMERCE_CATALOG[productType];
  const subtotal = product.unitAmount * quantity;
  return {
    status: 'complete',
    payment_status: 'paid',
    currency: product.currency,
    amount_subtotal: subtotal,
    amount_total: subtotal,
    ...overrides,
  };
}

assert.equal(validateCompletedCheckoutSession({
  session: checkoutSession('screening', 3),
  productType: 'screening',
  quantity: 3,
}).ok, true);

assert.equal(validateCompletedCheckoutSession({
  session: checkoutSession('underwriting', 1, { amount_total: 24950 }),
  productType: 'underwriting',
  quantity: 1,
}).ok, true, 'paid partner promotion remains valid against the nominal catalog subtotal');

assert.equal(validateCompletedCheckoutSession({
  session: checkoutSession('bundle', 1, {
    payment_status: 'no_payment_required',
    amount_total: 0,
  }),
  productType: 'bundle',
  quantity: 1,
}).validZeroDollar, true);

assert.equal(validateCompletedCheckoutSession({
  session: checkoutSession('screening', 1, { payment_status: 'unpaid' }),
  productType: 'screening',
  quantity: 1,
}).ok, false);
assert.equal(validateCompletedCheckoutSession({
  session: checkoutSession('screening', 1, { amount_subtotal: 49900 }),
  productType: 'screening',
  quantity: 1,
}).ok, false);

const exactRows = bundleSpecs.map((spec) => ({ ...spec }));
assert.equal(verifyExpectedPurchaseSpecs(exactRows, bundleSpecs).complete, true);
assert.equal(verifyExpectedPurchaseSpecs(exactRows.slice(0, 2), bundleSpecs).complete, false);

const publicCatalog = buildPublicCommerceCatalog();
assert.equal(publicCatalog.products.screening.displayPrice, '$199');
assert.equal(publicCatalog.products.underwriting.displayPrice, '$499');
assert.equal(publicCatalog.products.bundle.displayPrice, '$699');
assert.equal(publicCatalog.version, COMMERCE_CATALOG_VERSION);

console.log('h4-bundle-entitlement-creation-smoke: PASS');
