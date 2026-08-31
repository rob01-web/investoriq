import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'service-role-phase4-status';
process.env.STRIPE_SECRET_KEY ||= 'sk_test_phase4_status';
process.env.STRIPE_PRICE_SCREENING ||= 'price_screening_phase4';
process.env.STRIPE_PRICE_UNDERWRITING ||= 'price_underwriting_phase4';
process.env.STRIPE_PRICE_BUNDLE ||= 'price_bundle_phase4';

const repoRoot = path.resolve('.');
const catalogUrl = pathToFileURL(path.join(repoRoot, 'api/_lib/commerce-catalog.js')).href;
let source = fs.readFileSync(path.join(repoRoot, 'api/checkout-session.js'), 'utf8');
source = source
  .replace('import Stripe from "stripe";', 'const Stripe = globalThis.__phase4StatusStripeConstructor;')
  .replace(
    'import { createClient } from "@supabase/supabase-js";',
    'const createClient = globalThis.__phase4StatusCreateClient;'
  )
  .replace(
    /import \{[\s\S]*?\} from "\.\/_lib\/authenticated-actor\.js";/,
    `const {
      isInvestorIQAdmin,
      resolveAuthenticatedResourceOwnership,
      resolveAuthenticatedActor,
    } = globalThis.__phase4StatusAuth;`
  )
  .replace('from "./_lib/commerce-catalog.js";', `from "${catalogUrl}";`);

const userId = '00000000-0000-4000-8000-000000000004';
const sessionId = 'cs_phase4_status_bundle';
const state = { session: null, receipt: null, purchases: [] };

globalThis.__phase4StatusStripeConstructor = function Phase4StatusStripeConstructor() {
  return {
    checkout: { sessions: { async retrieve() { return state.session; } } },
  };
};
globalThis.__phase4StatusCreateClient = () => ({
  from(table) {
    if (table === 'commerce_checkout_receipts') {
      const query = {
        select() { return query; },
        eq() { return query; },
        async maybeSingle() { return { data: state.receipt, error: null }; },
      };
      return query;
    }
    if (table === 'report_purchases') {
      const query = {
        select() { return query; },
        async in() { return { data: state.purchases, error: null }; },
      };
      return query;
    }
    throw new Error(`Unexpected table ${table}`);
  },
});
globalThis.__phase4StatusAuth = {
  isInvestorIQAdmin: () => false,
  resolveAuthenticatedActor: async () => ({ ok: true, actor: { id: userId } }),
  resolveAuthenticatedResourceOwnership: ({ resourceOwnerId }) => ({
    ok: resourceOwnerId === userId,
    status: resourceOwnerId === userId ? 200 : 403,
    error: resourceOwnerId === userId ? null : 'Forbidden',
  }),
};

const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: checkoutStatusHandler } = await import(moduleUrl);

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

function validSession(overrides = {}) {
  return {
    id: sessionId,
    client_reference_id: userId,
    status: 'complete',
    payment_status: 'paid',
    currency: 'usd',
    amount_subtotal: 69900,
    amount_total: 69900,
    metadata: {
      userId,
      productType: 'bundle',
      quantity: '1',
      catalogVersion: 'investoriq-commerce-v1-2026-08-31',
    },
    ...overrides,
  };
}

function validReceipt(overrides = {}) {
  return {
    id: 'receipt-phase4-status',
    stripe_session_id: sessionId,
    user_id: userId,
    checkout_product_type: 'bundle',
    quantity: 1,
    catalog_version: 'investoriq-commerce-v1-2026-08-31',
    stripe_price_id: process.env.STRIPE_PRICE_BUNDLE,
    currency: 'usd',
    amount_subtotal: 69900,
    amount_total: 69900,
    checkout_status: 'complete',
    payment_status: 'paid',
    expected_screening_count: 2,
    expected_underwriting_count: 1,
    entitlement_count: 3,
    ...overrides,
  };
}

const expectedPurchases = [
  { stripe_session_id: sessionId, user_id: userId, product_type: 'screening' },
  { stripe_session_id: `${sessionId}#2`, user_id: userId, product_type: 'screening' },
  { stripe_session_id: `${sessionId}#3`, user_id: userId, product_type: 'underwriting' },
];

state.session = validSession();
state.receipt = null;
state.purchases = [];
const raceResponse = response();
await checkoutStatusHandler(
  { method: 'GET', query: { session_id: sessionId } },
  raceResponse
);
assert.equal(raceResponse.statusCode, 200);
assert.equal(raceResponse.body.entitlement_status, 'processing');

state.receipt = validReceipt();
state.purchases = expectedPurchases;
const grantedResponse = response();
await checkoutStatusHandler(
  { method: 'GET', query: { session_id: sessionId } },
  grantedResponse
);
assert.equal(grantedResponse.statusCode, 200);
assert.equal(grantedResponse.body.entitlement_status, 'granted');
assert.deepEqual(grantedResponse.body.entitlements, { screening: 2, underwriting: 1, total: 3 });

state.purchases = expectedPurchases.slice(0, 2);
const corruptedResponse = response();
await checkoutStatusHandler(
  { method: 'GET', query: { session_id: sessionId } },
  corruptedResponse
);
assert.equal(corruptedResponse.statusCode, 409);
assert.equal(corruptedResponse.body.entitlement_status, 'verification_failed');

state.session = validSession({ payment_status: 'unpaid' });
state.receipt = null;
const unpaidResponse = response();
await checkoutStatusHandler(
  { method: 'GET', query: { session_id: sessionId } },
  unpaidResponse
);
assert.equal(unpaidResponse.statusCode, 200);
assert.equal(unpaidResponse.body.entitlement_status, 'payment_incomplete');

state.session = validSession({
  metadata: {
    userId,
    productType: 'bundle',
    quantity: '1',
    catalogVersion: 'legacy-catalog',
  },
});
const legacyResponse = response();
await checkoutStatusHandler(
  { method: 'GET', query: { session_id: sessionId } },
  legacyResponse
);
assert.equal(legacyResponse.statusCode, 409);
assert.equal(legacyResponse.body.entitlement_status, 'verification_failed');

delete globalThis.__phase4StatusStripeConstructor;
delete globalThis.__phase4StatusCreateClient;
delete globalThis.__phase4StatusAuth;

console.log('phase4-checkout-status-runtime-smoke: PASS');
