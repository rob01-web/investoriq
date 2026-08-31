import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'service-role-test';
process.env.STRIPE_SECRET_KEY ||= 'sk_test_phase4';
process.env.STRIPE_WEBHOOK_SECRET ||= 'whsec_phase4';
process.env.STRIPE_PRICE_SCREENING ||= 'price_screening_phase4';
process.env.STRIPE_PRICE_UNDERWRITING ||= 'price_underwriting_phase4';
process.env.STRIPE_PRICE_BUNDLE ||= 'price_bundle_phase4';

const repoRoot = path.resolve('.');
const catalogUrl = pathToFileURL(path.join(repoRoot, 'api/_lib/commerce-catalog.js')).href;
let source = fs.readFileSync(path.join(repoRoot, 'api/webhook.js'), 'utf8');
source = source
  .replace('import Stripe from "stripe";', 'const Stripe = globalThis.__phase4StripeConstructor;')
  .replace(
    'import { createClient } from "@supabase/supabase-js";',
    'const createClient = globalThis.__phase4CreateClient;'
  )
  .replace('from "./_lib/commerce-catalog.js";', `from "${catalogUrl}";`);

const state = {
  event: null,
  lineItems: null,
  rpcCalls: [],
};

globalThis.__phase4StripeClient = {
  webhooks: {
    constructEvent() {
      return state.event;
    },
  },
  checkout: {
    sessions: {
      async listLineItems() {
        return state.lineItems;
      },
    },
  },
};
globalThis.__phase4StripeConstructor = function Phase4StripeConstructor() {
  return globalThis.__phase4StripeClient;
};
globalThis.__phase4CreateClient = () => ({
  async rpc(name, args) {
    state.rpcCalls.push({ name, args });
    const productType = args.p_checkout_product_type;
    const quantity = args.p_quantity;
    const screening = productType === 'bundle' ? 2 : productType === 'screening' ? quantity : 0;
    const underwriting = productType === 'bundle' ? 1 : productType === 'underwriting' ? quantity : 0;
    return {
      data: [{
        receipt_id: 'receipt-phase4',
        entitlement_count: screening + underwriting,
        screening_entitlements: screening,
        underwriting_entitlements: underwriting,
        idempotent_replay: state.rpcCalls.length > 1,
      }],
      error: null,
    };
  },
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: webhookHandler } = await import(moduleUrl);

function mockRequest() {
  const handlers = {};
  return {
    method: 'POST',
    headers: { 'stripe-signature': 'signed-phase4' },
    on(eventName, callback) {
      handlers[eventName] = callback;
      if (eventName === 'data') callback(Buffer.from('{}'));
      if (eventName === 'end') callback();
      return this;
    },
  };
}

function mockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
  };
}

const productContract = {
  screening: { amount: 19900, priceId: process.env.STRIPE_PRICE_SCREENING, screening: 1, underwriting: 0 },
  underwriting: { amount: 49900, priceId: process.env.STRIPE_PRICE_UNDERWRITING, screening: 0, underwriting: 1 },
  bundle: { amount: 69900, priceId: process.env.STRIPE_PRICE_BUNDLE, screening: 2, underwriting: 1 },
};

function setScenario({ productType, quantity, paymentStatus = 'paid', amountTotal, priceAmount }) {
  const contract = productContract[productType];
  const subtotal = contract.amount * quantity;
  const screeningEntitlements = contract.screening * quantity;
  const underwritingEntitlements = contract.underwriting * quantity;
  state.event = {
    id: `evt_${productType}_${quantity}_${state.rpcCalls.length}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_${productType}_${quantity}`,
        status: 'complete',
        payment_status: paymentStatus,
        currency: 'usd',
        amount_subtotal: subtotal,
        amount_total: amountTotal ?? subtotal,
        metadata: {
          userId: '00000000-0000-4000-8000-000000000004',
          productType,
          quantity: String(quantity),
          catalogVersion: 'investoriq-commerce-v1-2026-08-31',
          screeningEntitlements: String(screeningEntitlements),
          underwritingEntitlements: String(underwritingEntitlements),
        },
      },
    },
  };
  state.lineItems = {
    data: [{
      quantity,
      price: {
        id: contract.priceId,
        active: true,
        currency: 'usd',
        unit_amount: priceAmount ?? contract.amount,
        type: 'one_time',
        product: {
          id: `prod_${productType}`,
          active: true,
          metadata: {
            investoriq_product_type: productType,
            investoriq_catalog_version: 'investoriq-commerce-v1-2026-08-31',
          },
        },
      },
    }],
  };
}

for (const productType of ['screening', 'underwriting']) {
  for (let quantity = 1; quantity <= 5; quantity += 1) {
    state.rpcCalls = [];
    setScenario({ productType, quantity });
    const response = mockResponse();
    await webhookHandler(mockRequest(), response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.processed, true);
    assert.equal(state.rpcCalls.length, 1);
    assert.equal(state.rpcCalls[0].name, 'grant_checkout_entitlements_v1');
    assert.equal(state.rpcCalls[0].args.p_quantity, quantity);
    assert.equal(state.rpcCalls[0].args.p_amount_subtotal, productContract[productType].amount * quantity);
  }
}

state.rpcCalls = [];
setScenario({ productType: 'bundle', quantity: 1, paymentStatus: 'no_payment_required', amountTotal: 0 });
const zeroPromoResponse = mockResponse();
await webhookHandler(mockRequest(), zeroPromoResponse);
assert.equal(zeroPromoResponse.statusCode, 200);
assert.equal(state.rpcCalls[0].args.p_amount_total, 0);
assert.equal(state.rpcCalls[0].args.p_payment_status, 'no_payment_required');

state.rpcCalls = [];
setScenario({ productType: 'screening', quantity: 1, paymentStatus: 'unpaid' });
const unpaidResponse = mockResponse();
await webhookHandler(mockRequest(), unpaidResponse);
assert.equal(unpaidResponse.statusCode, 400);
assert.equal(state.rpcCalls.length, 0);

state.rpcCalls = [];
setScenario({ productType: 'screening', quantity: 1, priceAmount: 49900 });
const wrongPriceResponse = mockResponse();
await webhookHandler(mockRequest(), wrongPriceResponse);
assert.equal(wrongPriceResponse.statusCode, 400);
assert.equal(state.rpcCalls.length, 0);

state.rpcCalls = [];
setScenario({ productType: 'bundle', quantity: 1 });
const firstDelivery = mockResponse();
await webhookHandler(mockRequest(), firstDelivery);
const repeatedDelivery = mockResponse();
await webhookHandler(mockRequest(), repeatedDelivery);
assert.equal(firstDelivery.statusCode, 200);
assert.equal(repeatedDelivery.statusCode, 200);
assert.equal(repeatedDelivery.body.idempotent, true);
assert.equal(state.rpcCalls.length, 2);
assert.deepEqual(state.rpcCalls[0].args, state.rpcCalls[1].args);

delete globalThis.__phase4StripeClient;
delete globalThis.__phase4StripeConstructor;
delete globalThis.__phase4CreateClient;

console.log('phase4-webhook-runtime-smoke: PASS');
