import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.STRIPE_SECRET_KEY ||= 'sk_test_phase4_checkout';
process.env.STRIPE_PRICE_SCREENING ||= 'price_screening_phase4';
process.env.STRIPE_PRICE_UNDERWRITING ||= 'price_underwriting_phase4';
process.env.STRIPE_PRICE_BUNDLE ||= 'price_bundle_phase4';
process.env.PUBLIC_SITE_URL ||= 'https://investoriq.example';

const repoRoot = path.resolve('.');
const catalogUrl = pathToFileURL(path.join(repoRoot, 'api/_lib/commerce-catalog.js')).href;
let source = fs.readFileSync(path.join(repoRoot, 'api/create-checkout-session.js'), 'utf8');
source = source
  .replace('import Stripe from "stripe";', 'const Stripe = globalThis.__phase4CheckoutStripeConstructor;')
  .replace(
    'import { resolveAuthenticatedActor } from "./_lib/authenticated-actor.js";',
    'const resolveAuthenticatedActor = globalThis.__phase4ResolveAuthenticatedActor;'
  )
  .replace('from "./_lib/commerce-catalog.js";', `from "${catalogUrl}";`);

const contracts = {
  screening: { priceId: process.env.STRIPE_PRICE_SCREENING, amount: 19900 },
  underwriting: { priceId: process.env.STRIPE_PRICE_UNDERWRITING, amount: 49900 },
  bundle: { priceId: process.env.STRIPE_PRICE_BUNDLE, amount: 69900 },
};
const state = { createdSessions: [], wrongAmountProduct: null };

function priceForId(priceId) {
  const [productType, contract] = Object.entries(contracts).find(([, entry]) => entry.priceId === priceId) || [];
  if (!productType) throw new Error('Unknown price');
  return {
    id: priceId,
    active: true,
    currency: 'usd',
    unit_amount: state.wrongAmountProduct === productType ? contract.amount + 100 : contract.amount,
    type: 'one_time',
    product: {
      id: `prod_${productType}`,
      active: true,
      metadata: {
        investoriq_product_type: productType,
        investoriq_catalog_version: 'investoriq-commerce-v1-2026-08-31',
      },
    },
  };
}

globalThis.__phase4CheckoutStripeClient = {
  prices: { async retrieve(priceId) { return priceForId(priceId); } },
  checkout: {
    sessions: {
      async create(args) {
        state.createdSessions.push(args);
        return { id: `cs_${state.createdSessions.length}`, url: 'https://checkout.stripe.test/session' };
      },
    },
  },
};
globalThis.__phase4CheckoutStripeConstructor = function CheckoutStripeConstructor() {
  return globalThis.__phase4CheckoutStripeClient;
};
globalThis.__phase4ResolveAuthenticatedActor = async () => ({
  ok: true,
  actor: {
    id: '00000000-0000-4000-8000-000000000004',
    email: 'investor@example.test',
  },
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: checkoutHandler } = await import(moduleUrl);

function response() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

const catalogResponse = response();
await checkoutHandler({ method: 'GET' }, catalogResponse);
assert.equal(catalogResponse.statusCode, 200);
assert.equal(catalogResponse.body.products.screening.displayPrice, '$199');
assert.equal(catalogResponse.body.products.underwriting.displayPrice, '$499');
assert.equal(catalogResponse.body.products.bundle.displayPrice, '$699');
assert.ok(Object.values(catalogResponse.body.products).every((product) => product.available === true));
assert.match(catalogResponse.headers['Cache-Control'], /max-age=60/);

for (const [productType, quantity] of [
  ['screening', 5],
  ['underwriting', 3],
  ['bundle', 1],
]) {
  const checkoutResponse = response();
  await checkoutHandler({ method: 'POST', body: { productType, quantity } }, checkoutResponse);
  assert.equal(checkoutResponse.statusCode, 200);
  const sessionArgs = state.createdSessions.at(-1);
  assert.deepEqual(sessionArgs.line_items, [{ price: contracts[productType].priceId, quantity }]);
  assert.equal(sessionArgs.metadata.productType, productType);
  assert.equal(sessionArgs.metadata.quantity, String(quantity));
  assert.equal(sessionArgs.metadata.catalogVersion, 'investoriq-commerce-v1-2026-08-31');
  assert.match(sessionArgs.success_url, /session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.equal(sessionArgs.allow_promotion_codes, true);
}

const createdCountBeforeInvalidQuantity = state.createdSessions.length;
const invalidQuantityResponse = response();
await checkoutHandler(
  { method: 'POST', body: { productType: 'screening', quantity: '1.0' } },
  invalidQuantityResponse
);
assert.equal(invalidQuantityResponse.statusCode, 400);
assert.equal(state.createdSessions.length, createdCountBeforeInvalidQuantity);

state.wrongAmountProduct = 'screening';
const wrongPriceResponse = response();
await checkoutHandler(
  { method: 'POST', body: { productType: 'screening', quantity: 1 } },
  wrongPriceResponse
);
assert.equal(wrongPriceResponse.statusCode, 503);
assert.equal(state.createdSessions.length, createdCountBeforeInvalidQuantity);

delete globalThis.__phase4CheckoutStripeClient;
delete globalThis.__phase4CheckoutStripeConstructor;
delete globalThis.__phase4ResolveAuthenticatedActor;

console.log('phase4-checkout-runtime-smoke: PASS');
