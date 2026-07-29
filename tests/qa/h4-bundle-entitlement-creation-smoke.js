import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role-key';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.STRIPE_SECRET_KEY ||= 'sk_test_bundle_smoke';
process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_bundle_smoke';
process.env.STRIPE_PRICE_SCREENING ||= 'price_screening_smoke';
process.env.STRIPE_PRICE_UNDERWRITING ||= 'price_underwriting_smoke';
process.env.STRIPE_PRICE_BUNDLE ||= 'price_bundle_smoke';

const {
  ALLOWED_PRODUCT_TYPES,
  PRICE_CONFIG,
  normalizeProductType,
  normalizeCheckoutQuantity,
  buildCheckoutMetadata,
  buildCheckoutLineItem,
  getValidatedPriceConfigForProduct,
} = await import('../../api/create-checkout-session.js');

const {
  getProductPricingAvailability,
  getPricingAvailabilityMap,
} = await import('../../src/lib/pricingConfig.js');

const {
  CHECKOUT_PRODUCT_TYPES,
  ENTITLEMENT_PRODUCT_TYPES,
  buildExpectedPurchaseSpecs,
  buildMissingPurchaseRows,
  verifyExpectedPurchaseSpecs,
} = await import('../../api/webhook.js');

const bundleSessionId = 'cs_test_bundle_smoke';
const bundleUserId = 'user_bundle_smoke';
const pricingEnvBase = {
  VITE_STRIPE_PRICE_ID_SCREENING: 'price_screening_smoke',
  VITE_STRIPE_PRICE_ID_UNDERWRITING: 'price_underwriting_smoke',
  VITE_STRIPE_PRICE_ID_BUNDLE: 'price_bundle_smoke',
};

assert.equal(PRICE_CONFIG.bundle.priceId, 'price_bundle_smoke');
assert.ok(ALLOWED_PRODUCT_TYPES.includes('bundle'));
assert.ok(CHECKOUT_PRODUCT_TYPES.includes('bundle'));
assert.deepEqual(ENTITLEMENT_PRODUCT_TYPES, ['screening', 'underwriting']);
assert.equal(normalizeProductType({ productType: 'bundle' }), 'bundle');
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle' }), 1);
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle', quantity: '1' }), 1);
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle', quantity: 1 }), 1);
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle', quantity: 2 }), null);
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle', quantity: '2' }), null);
assert.equal(normalizeCheckoutQuantity({ productType: 'bundle', quantity: '1.0' }), null);
assert.equal(normalizeCheckoutQuantity({ productType: 'screening', quantity: '3' }), 3);
assert.equal(normalizeCheckoutQuantity({ productType: 'underwriting', quantity: '4' }), 4);

const bundleMissingConfig = {
  screening: { priceId: 'price_screening_smoke', mode: 'payment' },
  underwriting: { priceId: 'price_underwriting_smoke', mode: 'payment' },
  bundle: { priceId: '', mode: 'payment' },
};

assert.equal(getValidatedPriceConfigForProduct('screening', bundleMissingConfig).ok, true);
assert.equal(getValidatedPriceConfigForProduct('underwriting', bundleMissingConfig).ok, true);
assert.equal(getValidatedPriceConfigForProduct('bundle', bundleMissingConfig).ok, false);
assert.deepEqual(
  getValidatedPriceConfigForProduct('bundle', bundleMissingConfig).missing,
  ['STRIPE_PRICE_BUNDLE'],
);

const fullPricingAvailability = getPricingAvailabilityMap(pricingEnvBase);
assert.equal(fullPricingAvailability.screening.ok, true);
assert.equal(fullPricingAvailability.underwriting.ok, true);
assert.equal(fullPricingAvailability.bundle.ok, true);
assert.equal(fullPricingAvailability.bundle.priceId, 'price_bundle_smoke');

const missingBundlePricingAvailability = getPricingAvailabilityMap({
  ...pricingEnvBase,
  VITE_STRIPE_PRICE_ID_BUNDLE: '',
});
assert.equal(missingBundlePricingAvailability.screening.ok, true);
assert.equal(missingBundlePricingAvailability.underwriting.ok, true);
assert.equal(missingBundlePricingAvailability.bundle.ok, false);
assert.deepEqual(missingBundlePricingAvailability.bundle.missing, ['VITE_STRIPE_PRICE_ID_BUNDLE']);

const missingScreeningPricingAvailability = getPricingAvailabilityMap({
  ...pricingEnvBase,
  VITE_STRIPE_PRICE_ID_SCREENING: '',
});
assert.equal(missingScreeningPricingAvailability.screening.ok, false);
assert.equal(missingScreeningPricingAvailability.underwriting.ok, true);
assert.equal(missingScreeningPricingAvailability.bundle.ok, true);
assert.deepEqual(missingScreeningPricingAvailability.screening.missing, ['VITE_STRIPE_PRICE_ID_SCREENING']);

const missingUnderwritingPricingAvailability = getPricingAvailabilityMap({
  ...pricingEnvBase,
  VITE_STRIPE_PRICE_ID_UNDERWRITING: '',
});
assert.equal(missingUnderwritingPricingAvailability.screening.ok, true);
assert.equal(missingUnderwritingPricingAvailability.underwriting.ok, false);
assert.equal(missingUnderwritingPricingAvailability.bundle.ok, true);
assert.deepEqual(missingUnderwritingPricingAvailability.underwriting.missing, ['VITE_STRIPE_PRICE_ID_UNDERWRITING']);

assert.equal(getProductPricingAvailability('bogus', pricingEnvBase).ok, false);

assert.deepEqual(
  buildCheckoutMetadata({
    actorId: bundleUserId,
    normalizedProductType: 'bundle',
    normalizedQuantity: 1,
  }),
  {
    userId: bundleUserId,
    productType: 'bundle',
    quantity: '1',
  },
);

const standaloneLineItem = buildCheckoutLineItem({
  normalizedProductType: 'screening',
  normalizedQuantity: 3,
  priceId: 'price_screening_smoke',
});
assert.equal(standaloneLineItem.price, 'price_screening_smoke');
assert.equal(standaloneLineItem.quantity, 3);
assert.equal(standaloneLineItem.adjustable_quantity.enabled, true);
assert.equal(standaloneLineItem.adjustable_quantity.minimum, 1);
assert.equal(standaloneLineItem.adjustable_quantity.maximum, 5);

const bundleLineItem = buildCheckoutLineItem({
  normalizedProductType: 'bundle',
  normalizedQuantity: 1,
  priceId: 'price_bundle_smoke',
});
assert.equal(bundleLineItem.price, 'price_bundle_smoke');
assert.equal(bundleLineItem.quantity, 1);
assert.equal(Object.prototype.hasOwnProperty.call(bundleLineItem, 'adjustable_quantity'), false);

const bundleSpecs = buildExpectedPurchaseSpecs({
  sessionId: bundleSessionId,
  productType: 'bundle',
  quantity: 1,
  userId: bundleUserId,
});

assert.equal(bundleSpecs.length, 3);
assert.deepEqual(
  bundleSpecs.map((spec) => spec.stripe_session_id),
  [bundleSessionId, `${bundleSessionId}#2`, `${bundleSessionId}#3`],
);
assert.deepEqual(
  bundleSpecs.map((spec) => spec.product_type),
  ['screening', 'screening', 'underwriting'],
);
assert.deepEqual(
  bundleSpecs.map((spec) => spec.bundle_slot),
  ['screening_1', 'screening_2', 'underwriting_1'],
);
assert.ok(bundleSpecs.every((spec) => spec.product_type !== 'bundle'));
assert.ok(new Set(bundleSpecs.map((spec) => spec.stripe_session_id)).size === 3);

function purchaseRowFromSpec(spec, overrides = {}) {
  return {
    stripe_session_id: spec.stripe_session_id,
    user_id: spec.user_id,
    product_type: spec.product_type,
    ...overrides,
  };
}

const firstDeliveryRows = buildMissingPurchaseRows([], bundleSpecs);
assert.equal(firstDeliveryRows.length, 3);
assert.deepEqual(
  firstDeliveryRows.map((row) => row.product_type),
  ['screening', 'screening', 'underwriting'],
);
assert.deepEqual(
  firstDeliveryRows.map((row) => row.stripe_session_id),
  [bundleSessionId, `${bundleSessionId}#2`, `${bundleSessionId}#3`],
);

for (const subset of [
  [],
  [0],
  [1],
  [2],
  [0, 1],
  [0, 2],
  [1, 2],
  [0, 1, 2],
]) {
  const existingRows = subset.map((index) => purchaseRowFromSpec(bundleSpecs[index]));
  const verification = verifyExpectedPurchaseSpecs(existingRows, bundleSpecs);
  const missingRows = buildMissingPurchaseRows(existingRows, bundleSpecs);
  assert.equal(verification.mismatches.length, 0);
  assert.equal(verification.missing.length, 3 - subset.length);
  assert.equal(verification.complete, subset.length === 3);
  assert.equal(missingRows.length, 3 - subset.length);
  assert.deepEqual(
    missingRows.map((row) => row.stripe_session_id),
    bundleSpecs
      .filter((_, index) => !subset.includes(index))
      .map((spec) => spec.stripe_session_id),
  );
}

const exactDuplicateVerification = verifyExpectedPurchaseSpecs(
  bundleSpecs.map((spec) => purchaseRowFromSpec(spec)),
  bundleSpecs,
);
assert.equal(exactDuplicateVerification.complete, true);
assert.equal(exactDuplicateVerification.missing.length, 0);
assert.equal(exactDuplicateVerification.mismatches.length, 0);

const ownerMismatchVerification = verifyExpectedPurchaseSpecs(
  [purchaseRowFromSpec(bundleSpecs[0], { user_id: 'other-user' })],
  bundleSpecs,
);
assert.equal(ownerMismatchVerification.complete, false);
assert.equal(ownerMismatchVerification.mismatches.length, 1);

const screeningSlotMismatchVerification = verifyExpectedPurchaseSpecs(
  [
    purchaseRowFromSpec(bundleSpecs[0], { product_type: 'underwriting' }),
    purchaseRowFromSpec(bundleSpecs[1]),
    purchaseRowFromSpec(bundleSpecs[2]),
  ],
  bundleSpecs,
);
assert.equal(screeningSlotMismatchVerification.complete, false);
assert.equal(screeningSlotMismatchVerification.mismatches.length, 1);

const underwritingSlotMismatchVerification = verifyExpectedPurchaseSpecs(
  [
    purchaseRowFromSpec(bundleSpecs[0]),
    purchaseRowFromSpec(bundleSpecs[1]),
    purchaseRowFromSpec(bundleSpecs[2], { product_type: 'screening' }),
  ],
  bundleSpecs,
);
assert.equal(underwritingSlotMismatchVerification.complete, false);
assert.equal(underwritingSlotMismatchVerification.mismatches.length, 1);

const concurrentRecoveryVerification = verifyExpectedPurchaseSpecs(
  bundleSpecs.map((spec) => purchaseRowFromSpec(spec)),
  bundleSpecs,
);
assert.equal(concurrentRecoveryVerification.complete, true);

const missingAfterRecoveryVerification = verifyExpectedPurchaseSpecs(
  bundleSpecs.slice(0, 2).map((spec) => purchaseRowFromSpec(spec)),
  bundleSpecs,
);
assert.equal(missingAfterRecoveryVerification.complete, false);
assert.equal(missingAfterRecoveryVerification.missing.length, 1);

assert.equal(normalizeProductType({ productType: 'bogus' }), '');
assert.equal(ALLOWED_PRODUCT_TYPES.includes('bogus'), false);
assert.equal(CHECKOUT_PRODUCT_TYPES.includes('bogus'), false);

const standaloneScreeningSpecs = buildExpectedPurchaseSpecs({
  sessionId: 'cs_test_screening_smoke',
  productType: 'screening',
  quantity: 3,
  userId: 'user-screening',
});
assert.equal(standaloneScreeningSpecs.length, 3);
assert.ok(standaloneScreeningSpecs.every((spec) => spec.product_type === 'screening'));
assert.deepEqual(
  standaloneScreeningSpecs.map((spec) => spec.stripe_session_id),
  ['cs_test_screening_smoke', 'cs_test_screening_smoke#2', 'cs_test_screening_smoke#3'],
);

const standaloneUnderwritingSpecs = buildExpectedPurchaseSpecs({
  sessionId: 'cs_test_underwriting_smoke',
  productType: 'underwriting',
  quantity: 2,
  userId: 'user-underwriting',
});
assert.equal(standaloneUnderwritingSpecs.length, 2);
assert.ok(standaloneUnderwritingSpecs.every((spec) => spec.product_type === 'underwriting'));

const pricingSource = readFileSync(new URL('../../src/pages/Pricing.jsx', import.meta.url), 'utf8');
const pricingConfigSource = readFileSync(new URL('../../src/lib/pricingConfig.js', import.meta.url), 'utf8');
assert.ok(pricingSource.includes("price:       '$199'"));
assert.ok(pricingSource.includes("price:       '$499'"));
assert.ok(pricingSource.includes("price:       '$699'"));
assert.match(pricingSource, /const pricingAvailability\s+=\s+getPricingAvailabilityMap\(\);/);
assert.match(pricingSource, /const hasAnyPricingAvailable\s+=\s+Object\.values\(pricingAvailability\)\.some\(\(entry\) => entry\.ok\);/);
assert.ok(pricingSource.includes("pricingAvailable={pricingAvailability[tier.productType]?.ok ?? false}"));
assert.ok(!pricingSource.includes('getValidatedPriceConfig'));
assert.ok(pricingSource.includes("const comparisonTiers = tiers.filter((tier) => tier.productType !== 'bundle');"));
assert.ok(pricingSource.includes('{comparisonTiers.map((t) => ('));
assert.ok(pricingSource.includes("title:       'Launch Bundle'"));
assert.ok(pricingSource.includes("price:       '$699'"));
assert.ok(pricingSource.includes("valueLine:   'Two Screening reports plus one Full Underwriting report in one fixed-price package.'"));
assert.ok(pricingSource.includes("description: 'Two Screening reports plus one Full Underwriting report in one fixed-price package.'"));
assert.ok(pricingSource.includes("tier.productType === 'bundle' ? 'Flat fee | 3 report credits' : 'Flat fee | One property'"));
assert.ok(pricingSource.includes("Flat fee | 3 report credits"));
assert.ok(!pricingConfigSource.includes('getValidatedPriceConfig('));
assert.ok(!pricingConfigSource.includes('1499'));
assert.ok(!pricingConfigSource.includes('amount:   499'));
assert.ok(pricingConfigSource.includes("screening: getProductPricingAvailability('screening', pricingEnv),"));
assert.ok(pricingConfigSource.includes("underwriting: getProductPricingAvailability('underwriting', pricingEnv),"));
assert.ok(pricingConfigSource.includes("bundle: getProductPricingAvailability('bundle', pricingEnv),"));

console.log('h4-bundle-entitlement-creation-smoke: PASS');
