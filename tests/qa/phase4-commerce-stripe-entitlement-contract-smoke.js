import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = fs.readFileSync('api/_lib/commerce-catalog.js', 'utf8');
const checkout = fs.readFileSync('api/create-checkout-session.js', 'utf8');
const webhook = fs.readFileSync('api/webhook.js', 'utf8');
const checkoutStatus = fs.readFileSync('api/checkout-session.js', 'utf8');
const pricingConfig = fs.readFileSync('src/lib/pricingConfig.js', 'utf8');
const pricingPage = fs.readFileSync('src/pages/Pricing.jsx', 'utf8');
const dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
const adminDashboard = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
const adminMetrics = fs.readFileSync('api/admin/queue-metrics.js', 'utf8');
const migration = fs.readFileSync(
  'supabase/migrations/20260831100000_phase4_atomic_commerce_entitlement_authority.sql',
  'utf8'
);

assert.match(catalog, /screening:[\s\S]*?unitAmount: 19900/);
assert.match(catalog, /underwriting:[\s\S]*?unitAmount: 49900/);
assert.match(catalog, /bundle:[\s\S]*?unitAmount: 69900/);
assert.match(catalog, /COMMERCE_CURRENCY = 'usd'/);
assert.match(catalog, /quantity: \{ minimum: 1, maximum: 5, fixed: false \}/);
assert.match(catalog, /entitlementUnit: \{ screening: 2, underwriting: 1 \}/);
assert.match(catalog, /STRIPE_PRODUCT_IDENTITY_MISMATCH/);
assert.match(catalog, /STRIPE_PRODUCT_CATALOG_VERSION_MISMATCH/);
assert.match(catalog, /CHECKOUT_SUBTOTAL_MISMATCH/);
assert.match(catalog, /paymentStatus === 'paid'/);
assert.match(catalog, /paymentStatus === 'no_payment_required' && total === 0/);

assert.match(checkout, /req\.method === "GET"/);
assert.match(checkout, /buildPublicCommerceCatalog\(Object\.fromEntries\(availabilityEntries\)\)/);
assert.match(checkout, /stripe\.prices\.retrieve\(config\.priceId, \{ expand: \["product"\] \}\)/);
assert.match(checkout, /validateStripePriceAgainstCatalog/);
assert.match(checkout, /session_id=\{CHECKOUT_SESSION_ID\}/);
assert.match(checkout, /allow_promotion_codes: true/);
assert.doesNotMatch(checkout, /adjustable_quantity/);

assert.match(webhook, /stripe\.webhooks\.constructEvent/);
assert.match(webhook, /event\.type !== "checkout\.session\.completed"/);
assert.match(webhook, /expand: \["data\.price\.product"\]/);
assert.match(webhook, /lineItems\.data\.length !== 1/);
assert.match(webhook, /validateStripePriceAgainstCatalog/);
assert.match(webhook, /validateCompletedCheckoutSession/);
assert.match(webhook, /"grant_checkout_entitlements_v1"/);
assert.doesNotMatch(webhook, /\.from\("stripe_events"\)/);
assert.doesNotMatch(webhook, /\.from\("report_purchases"\)\.insert/);

assert.match(migration, /create table if not exists public\.commerce_checkout_receipts/i);
assert.match(migration, /commerce_checkout_receipts_session_key unique \(stripe_session_id\)/i);
assert.match(migration, /commerce_checkout_receipts_event_key unique \(stripe_event_id\)/i);
assert.match(migration, /create unique index if not exists report_purchases_stripe_session_id_unique/i);
assert.match(migration, /PHASE4_DUPLICATE_STRIPE_ENTITLEMENT_KEYS_REQUIRE_REVIEW/i);
assert.match(migration, /create or replace function public\.grant_checkout_entitlements_v1/i);
assert.match(migration, /pg_advisory_xact_lock/i);
assert.match(migration, /v_unit_amount := 19900/i);
assert.match(migration, /v_unit_amount := 49900/i);
assert.match(migration, /v_unit_amount := 69900/i);
assert.match(migration, /v_screening_count := 2/i);
assert.match(migration, /v_underwriting_count := 1/i);
assert.match(migration, /p_payment_status = 'paid'/i);
assert.match(migration, /p_payment_status = 'no_payment_required' and p_amount_total = 0/i);
assert.match(migration, /insert into public\.stripe_events/i);
assert.match(migration, /insert into public\.commerce_checkout_receipts/i);
assert.match(migration, /insert into public\.report_purchases/i);
assert.match(migration, /COMMERCE_RECEIPT_REPLAY_MISMATCH/i);
assert.match(migration, /COMMERCE_ENTITLEMENT_COUNT_MISMATCH/i);
assert.match(migration, /revoke all on function public\.grant_checkout_entitlements_v1[\s\S]*from public, anon, authenticated/i);
assert.match(migration, /grant execute on function public\.grant_checkout_entitlements_v1[\s\S]*to service_role/i);

assert.match(checkoutStatus, /commerce_checkout_receipts/);
assert.match(checkoutStatus, /entitlement_status: "processing"/);
assert.match(checkoutStatus, /entitlement_status: "granted"/);
assert.match(checkoutStatus, /buildExpectedPurchaseSpecs/);
assert.match(checkoutStatus, /report_purchases/);

assert.match(pricingConfig, /loadCommerceCatalog/);
assert.match(pricingConfig, /\/api\/create-checkout-session/);
assert.doesNotMatch(pricingConfig, /VITE_STRIPE_PRICE_ID/);
assert.doesNotMatch(pricingPage, /price:\s*['"]\$199/);
assert.doesNotMatch(pricingPage, /price:\s*['"]\$499/);
assert.doesNotMatch(pricingPage, /price:\s*['"]\$699/);
assert.match(pricingPage, /product\?\.displayPrice/);

assert.match(dashboard, /checkout-session\?session_id=/);
assert.match(dashboard, /entitlement_status === 'granted'/);
assert.match(dashboard, /Confirming your purchase\./);
assert.doesNotMatch(dashboard, /Report credits added to your account/);
assert.doesNotMatch(dashboard, /Your report credit has been added/);

assert.doesNotMatch(adminDashboard, /149900/);
assert.doesNotMatch(adminDashboard, /product_type === 'underwriting' \? 149900 : 49900/);
assert.match(adminDashboard, /include_commerce_summary=true/);
assert.match(adminDashboard, /US dollars, settled checkout receipts/);
assert.match(adminMetrics, /commerce_checkout_receipts/);
assert.match(adminMetrics, /settled_revenue_minor/);

console.log('phase4-commerce-stripe-entitlement-contract-smoke: PASS');
