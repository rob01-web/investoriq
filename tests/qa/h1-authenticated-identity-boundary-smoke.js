import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.SUPABASE_URL ||= 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'test-anon-key';
process.env.INVESTORIQ_ADMIN_EMAILS ||= 'owner@example.com';

const {
  isInvestorIQAdmin,
  resolveAuthenticatedResourceOwnership,
  resolveAuthenticatedActor,
} = await import('../../api/_lib/authenticated-actor.js');
const { resolveReportGenerationOwnership } = await import('../../api/_lib/report-request-context.js');

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

const ownedResource = resolveAuthenticatedResourceOwnership({
  auth: authenticated,
  resourceOwnerId: 'actor-1',
  resourceType: 'report',
});
assert.equal(ownedResource.ok, true);
assert.equal(ownedResource.resourceOwnerId, 'actor-1');

const crossUserResource = resolveAuthenticatedResourceOwnership({
  auth: authenticated,
  resourceOwnerId: 'someone-else',
  resourceType: 'report',
});
assert.equal(crossUserResource.ok, false);
assert.equal(crossUserResource.status, 403);
assert.equal(crossUserResource.error, 'FORBIDDEN');

const adminOwnedResource = resolveAuthenticatedResourceOwnership({
  auth: {
    ok: true,
    actor: { id: 'admin-1', email: 'owner@example.com' },
  },
  resourceOwnerId: 'someone-else',
  allowAdminBypass: true,
  resourceType: 'report',
});
assert.equal(adminOwnedResource.ok, true);
assert.equal(adminOwnedResource.adminAuthorized, true);

const reportGenerationOwned = resolveReportGenerationOwnership({
  bodyUserId: 'actor-1',
  jobId: 'job-1',
  jobUserId: 'actor-1',
  authenticatedActorId: 'actor-1',
  adminAuthorized: false,
});
assert.equal(reportGenerationOwned.ok, true);
assert.equal(reportGenerationOwned.effectiveUserId, 'actor-1');
assert.equal(reportGenerationOwned.ownershipSource, 'analysis_jobs.user_id');

const reportGenerationMismatch = resolveReportGenerationOwnership({
  bodyUserId: 'wrong-user',
  jobId: 'job-1',
  jobUserId: 'actor-1',
  authenticatedActorId: 'actor-1',
  adminAuthorized: false,
});
assert.equal(reportGenerationMismatch.ok, false);
assert.equal(reportGenerationMismatch.status, 403);
assert.equal(reportGenerationMismatch.error, 'JOB_OWNERSHIP_MISMATCH');

const reportGenerationAdmin = resolveReportGenerationOwnership({
  bodyUserId: 'someone-else',
  authenticatedActorId: 'actor-1',
  adminAuthorized: true,
});
assert.equal(reportGenerationAdmin.ok, true);
assert.equal(reportGenerationAdmin.effectiveUserId, 'someone-else');
assert.equal(reportGenerationAdmin.ownershipSource, 'admin_authorized_body_user_id');

const checkoutCreate = fs.readFileSync('api/create-checkout-session.js', 'utf8');
assert.match(checkoutCreate, /resolveAuthenticatedActor\(req\)/);
assert.match(checkoutCreate, /userId: auth\.actor\.id/);
assert.match(checkoutCreate, /client_reference_id: auth\.actor\.id/);
assert.doesNotMatch(checkoutCreate, /const \{[^}]*userId[^}]*\} = req\.body/);
assert.doesNotMatch(checkoutCreate, /const \{[^}]*userEmail[^}]*\} = req\.body/);

const checkoutRead = fs.readFileSync('api/checkout-session.js', 'utf8');
assert.match(checkoutRead, /resolveAuthenticatedActor\(req\)/);
assert.match(checkoutRead, /resolveAuthenticatedResourceOwnership\(/);
assert.match(checkoutRead, /allowAdminBypass: false/);
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

const reportRequestContext = fs.readFileSync('api/_lib/report-request-context.js', 'utf8');
assert.match(reportRequestContext, /resolveReportGenerationOwnership/);
assert.match(reportRequestContext, /JOB_OWNERSHIP_MISMATCH/);
assert.match(reportRequestContext, /admin_authorized_body_user_id/);

const generatorSource = fs.readFileSync('api/_lib/generate-client-report-impl.js', 'utf8');
assert.match(generatorSource, /resolveReportGenerationOwnership/);
assert.match(generatorSource, /adminAuthorized = isAdminRegen \|\| Boolean\(headerKey && headerKey === adminRunKey\)/);
assert.match(generatorSource, /effectiveUserId = ownershipResolution\.effectiveUserId/);
assert.doesNotMatch(generatorSource, /effectiveUserId = bodyUserId \|\| null;/);

console.log('h1-authenticated-identity-boundary-smoke: PASS');
