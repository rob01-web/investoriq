import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.INVESTORIQ_ADMIN_EMAILS ||= 'owner@example.com';

const {
  isInvestorIQAdmin,
  resolveAuthenticatedActor,
} = await import('../../api/_lib/authenticated-actor.js');

const noAuth = await resolveAuthenticatedActor({ headers: {} });
assert.deepEqual(noAuth, { ok: false, status: 401, error: 'UNAUTHORIZED' });

let observedAuthorization = '';
const authenticated = await resolveAuthenticatedActor(
  { headers: { authorization: 'Bearer actor-token' } },
  {
    createClientImpl: (_url, _key, options) => {
      observedAuthorization = options?.global?.headers?.Authorization || '';
      return {
        auth: {
          getUser: async (token) => ({
            data: {
              user: {
                id: token === 'actor-token' ? 'actor-1' : 'wrong-actor',
                email: 'owner@example.com',
              },
            },
            error: null,
          }),
        },
      };
    },
  },
);
assert.equal(observedAuthorization, 'Bearer actor-token');
assert.equal(authenticated.ok, true);
assert.equal(authenticated.actor.id, 'actor-1');
assert.equal(isInvestorIQAdmin(authenticated.actor), true);
assert.equal(isInvestorIQAdmin({ email: 'customer@example.com' }), false);

const checkoutCreate = fs.readFileSync('api/create-checkout-session.js', 'utf8');
assert.match(checkoutCreate, /resolveAuthenticatedActor\(req\)/);
assert.match(checkoutCreate, /userId: auth\.actor\.id/);
assert.match(checkoutCreate, /client_reference_id: auth\.actor\.id/);
assert.doesNotMatch(checkoutCreate, /const \{[^}]*userId[^}]*\} = req\.body/);
assert.doesNotMatch(checkoutCreate, /const \{[^}]*userEmail[^}]*\} = req\.body/);

const checkoutRead = fs.readFileSync('api/checkout-session.js', 'utf8');
assert.match(checkoutRead, /resolveAuthenticatedActor\(req\)/);
assert.match(checkoutRead, /sessionOwnerId !== auth\.actor\.id/);
assert.match(checkoutRead, /destination: isInvestorIQAdmin\(auth\.actor\)/);
assert.doesNotMatch(checkoutRead, /metadata: session\.metadata/);

const legal = fs.readFileSync('api/legal-acceptance.js', 'utf8');
assert.match(legal, /const userId = auth\.actor\.id/);
assert.match(legal, /POLICY_TEXT_HASH = createHash\('sha256'\)/);
assert.doesNotMatch(legal, /const \{ userId, policyTextHash \} = params/);
assert.doesNotMatch(legal, /getUserById\(userId\)/);

const app = fs.readFileSync('src/App.jsx', 'utf8');
assert.match(app, /checkout-session\?auth_context=1/);
assert.match(app, /Navigate to="\/login\?next=\/dashboard"/);
assert.doesNotMatch(app, /user\?\.email === adminEmail/);

for (const frontendPath of ['src/pages/Pricing.jsx', 'src/pages/Dashboard.jsx']) {
  const source = fs.readFileSync(frontendPath, 'utf8');
  assert.match(source, /Authorization: `Bearer \$\{accessToken\}`/);
}
const pricing = fs.readFileSync('src/pages/Pricing.jsx', 'utf8');
assert.doesNotMatch(pricing, /userId:\s*user\.id/);
assert.doesNotMatch(pricing, /userEmail:\s*user\.email/);

const dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
assert.doesNotMatch(dashboard, /userId:\s*profile\?\.id/);
assert.doesNotMatch(dashboard, /policyTextHash/);

const checkoutSuccess = fs.readFileSync('src/pages/CheckoutSuccess.jsx', 'utf8');
assert.match(checkoutSuccess, /Authorization: `Bearer \$\{accessToken\}`/);
assert.match(checkoutSuccess, /data\?\.productType/);
assert.doesNotMatch(checkoutSuccess, /data\?\.metadata\?\.productType/);

console.log('h1-authenticated-identity-boundary-smoke: PASS');
