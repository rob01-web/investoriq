import assert from 'node:assert/strict';
import fs from 'node:fs';
process.env.SUPABASE_URL = 'https://customer-boundary.invalid';
process.env.SUPABASE_ANON_KEY = 'test-anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service';
const calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  calls.push({ url, options });
  assert.equal(url.hostname, 'customer-boundary.invalid');
  if (url.pathname === '/auth/v1/user') return Response.json({ id: 'owner', email: 'owner@example.invalid' });
  if (url.pathname === '/rest/v1/customer_published_report_projection') {
    assert.equal(url.searchParams.get('user_id'), 'eq.owner');
    const path = url.searchParams.get('storage_path');
    if (!path) return Response.json([{ id: 'owned-report', user_id: 'owner' }]);
    assert.equal(url.searchParams.get('publication_state'), 'eq.published');
    return Response.json(path === 'eq.owner/report.pdf' ? { id: 'owned-report', user_id: 'owner', publication_state: 'published' } : null);
  }
  if (url.pathname === '/storage/v1/object/sign/generated_reports/owner/report.pdf') {
    assert.equal(JSON.parse(options.body).expiresIn, 300);
    return Response.json({ signedURL: '/object/sign/generated_reports/owner/report.pdf?token=test' });
  }
  throw new Error(`Unexpected network operation: ${url.pathname}`);
};
const { default: handler } = await import('../../api/legal-acceptance.js');
const config = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url)));
async function request(path, method, body = {}, authenticated = true) {
  const mapping = config.routes.find((route) => route.src && new RegExp(route.src).test(path));
  assert.ok(mapping?.dest.startsWith('/api/legal-acceptance?'));
  const destination = new URL(mapping.dest, 'https://site.invalid');
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
  await handler({ method, query: Object.fromEntries(destination.searchParams), headers: authenticated ? { authorization: 'Bearer test-token' } : {}, body }, res);
  return res;
}
try {
  assert.equal((await request('/api/customer-reports', 'GET', {}, false)).statusCode, 401);
  assert.equal((await request('/api/customer-reports', 'POST')).statusCode, 405);
  assert.equal((await request('/api/customer-reports', 'GET')).body.rows[0].id, 'owned-report');
  assert.equal((await request('/api/customer-report-download', 'GET')).statusCode, 405);
  const before = calls.filter((call) => call.url.pathname.startsWith('/storage')).length;
  assert.equal((await request('/api/customer-report-download', 'POST', { storage_path: 'other/report.pdf' })).statusCode, 404);
  assert.equal(calls.filter((call) => call.url.pathname.startsWith('/storage')).length, before);
  const download = await request('/api/customer-report-download', 'POST', { storage_path: 'owner/report.pdf', user_id: 'other' });
  assert.equal(download.statusCode, 200);
  assert.equal(download.body.expiresIn, 300);
  assert.equal((await request('/api/jobs/request-revision', 'POST')).statusCode, 403);
  assert.equal((await request('/api/jobs/request-revision', 'POST', {}, false)).statusCode, 401);
  console.log('customer-route-dispatch-runtime: PASS (real dispatcher/auth/query/signing logic; transport stubbed, no live services)');
} finally { globalThis.fetch = originalFetch; }
