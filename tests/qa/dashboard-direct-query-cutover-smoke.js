import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { wrapSupabaseWithCustomerBoundaries } from '../../src/lib/customerBoundarySupabase.js';

const traverse = traverseModule.default || traverseModule;
const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const ast = (source) => parse(source, { sourceType: 'module', plugins: ['jsx'] });
const importedFrom = (binding, name, source) => (
  binding?.path.isImportSpecifier()
  && binding.path.node.imported.name === name
  && binding.path.parent.source.value === source
);

// A .from('analysis_jobs') call is governed only when its actual lexical
// binding is the wrapped client. A broad text ban incorrectly rejects it.
let jobReads = 0;
traverse(ast(read('src/pages/Dashboard.jsx')), {
  ImportDeclaration(p) {
    assert.notEqual(p.node.source.value, '@supabase/supabase-js', 'Dashboard must not create a raw browser client');
  },
  CallExpression(p) {
    const call = p.node;
    const member = call.callee;
    if (member.type !== 'MemberExpression') return;
    const method = member.computed ? member.property.value : member.property.name;
    if (method !== 'from' || call.arguments[0]?.value !== 'analysis_jobs') return;
    jobReads += 1;
    assert.equal(member.object.type, 'Identifier', 'Job reads must use the governed client directly');
    assert.ok(importedFrom(p.scope.getBinding(member.object.name), 'supabase', '@/lib/customSupabaseClient'),
      'Dashboard analysis_jobs reads must bind to the customer boundary client');
  },
});
assert.ok(jobReads > 0, 'Dashboard job-status reads must be covered by this contract');

let wrappedExport = false;
traverse(ast(read('src/lib/customSupabaseClient.js')), {
  ExportNamedDeclaration(p) {
    const declarations = p.get('declaration');
    if (!declarations.isVariableDeclaration()) return;
    for (const declaration of declarations.get('declarations')) {
      if (declaration.node.id.name !== 'supabase') continue;
      const init = declaration.node.init;
      assert.equal(init?.type, 'CallExpression', 'Exported client must be wrapped');
      assert.ok(importedFrom(declaration.scope.getBinding(init.callee.name),
        'wrapSupabaseWithCustomerBoundaries', './customerBoundarySupabase'),
      'Export must use the real customer boundary wrapper');
      assert.equal(init.arguments[0]?.name, 'baseSupabase');
      wrappedExport = true;
    }
  },
});
assert.ok(wrappedExport, 'Dashboard client must export the wrapped Supabase instance');

// Exercise the actual wrapper with a raw client that records and rejects every
// table access. No network, database, token, or production account is used.
let rawReads = 0;
let token = 'local-boundary-test-token';
const base = {
  auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null }, error: null }) },
  storage: {},
  from() { rawReads += 1; throw new Error('Raw browser table access is forbidden'); },
};
const client = wrapSupabaseWithCustomerBoundaries(base);
const requests = [];
let mode = 'success';
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  requests.push({ url, options });
  if (mode === 'network') throw new Error('Local simulated network failure');
  return {
    ok: mode === 'success',
    status: mode === 'success' ? 200 : 403,
    json: async () => mode === 'success'
      ? { rows: [{ id: 'local-job', status: 'failed' }] }
      : { error: 'FORBIDDEN' },
  };
};
const jobs = () => client.from('analysis_jobs').select('id, status').eq('user_id', 'local-owner');
try {
  const result = await jobs().in('status', ['queued', 'failed']).order('created_at', { ascending: false }).limit(500);
  assert.equal(result.error, null);
  assert.deepEqual(result.data, [{ id: 'local-job', status: 'failed' }]);
  assert.equal(requests.length, 1);
  const request = requests[0];
  const url = new URL(request.url, 'https://local.invalid');
  assert.equal(url.pathname, '/api/customer-job-status');
  assert.equal(url.searchParams.get('surface'), 'jobs');
  assert.equal(url.searchParams.get('limit'), '50');
  assert.equal(url.searchParams.get('statuses'), 'queued,failed');
  assert.equal(url.searchParams.has('user_id'), false, 'Server identity must control ownership');
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, `Bearer ${token}`);
  assert.equal((await jobs().eq('status', 'failed').limit(1).maybeSingle()).data.id, 'local-job');

  const beforeInvalid = requests.length;
  assert.equal((await jobs().eq('internal_field', 'value')).error.code, 'INVALID_JOB_FILTER');
  assert.deepEqual((await client.from('analysis_jobs').select('*')).data, []);
  assert.equal(requests.length, beforeInvalid, 'Invalid/unscoped reads must fail closed locally');

  token = '';
  assert.equal((await jobs()).error.code, 'UNAUTHORIZED');
  assert.equal(requests.length, beforeInvalid, 'Expired sessions must not issue requests');
  token = 'local-boundary-test-token';
  mode = 'denied';
  assert.equal((await jobs()).error.code, 'FORBIDDEN');
  mode = 'network';
  assert.equal((await jobs()).error.code, 'NETWORK_ERROR');
  assert.equal(rawReads, 0, 'Neither success nor any failure may fall back to raw browser queries');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('dashboard-direct-query-cutover-smoke: PASS');
