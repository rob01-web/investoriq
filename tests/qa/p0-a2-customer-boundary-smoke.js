import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wrapSupabaseWithCustomerBoundaries } from '../../src/lib/customerBoundarySupabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  if (String(url).startsWith('/api/customer-job-status')) {
    return new Response(JSON.stringify({ rows: [{ job_id: 'job-1', type: 'worker_event', payload: { event: 'entitlement_restored' }, created_at: '2026-08-18T00:00:00Z' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  if (String(url) === '/api/customer-report-removal') {
    return new Response(JSON.stringify({ success: true, reports: [{ id: 'report-1' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }
  throw new Error(`Unexpected fetch: ${url}`);
};

let rawArtifactReadCount = 0;
let rawReportDeleteCount = 0;
let rawGeneratedRemoveCount = 0;

const fakeBase = {
  auth: {
    async getSession() {
      return { data: { session: { access_token: 'token-1' } }, error: null };
    },
  },
  from(tableName) {
    if (tableName === 'analysis_artifacts') rawArtifactReadCount += 1;
    const builder = {
      select() { return builder; },
      eq() { return builder; },
      in() { return builder; },
      order() { return builder; },
      limit() { return builder; },
      delete() { rawReportDeleteCount += 1; return builder; },
    };
    return builder;
  },
  storage: {
    from() {
      return {
        async remove() { rawGeneratedRemoveCount += 1; return { data: [], error: null }; },
        async createSignedUrl() { return { data: { signedUrl: 'https://example.invalid' }, error: null }; },
      };
    },
  },
};

try {
  const governed = wrapSupabaseWithCustomerBoundaries(fakeBase);

  const artifactResult = await governed
    .from('analysis_artifacts')
    .select('job_id, payload')
    .eq('type', 'worker_event')
    .in('job_id', ['job-1'])
    .eq('payload->>event', 'entitlement_restored');

  assert.equal(rawArtifactReadCount, 0, 'analysis_artifacts must not be read directly by the browser client');
  assert.equal(artifactResult.error, null);
  assert.equal(artifactResult.data[0].payload.event, 'entitlement_restored');
  assert.match(calls[0].url, /^\/api\/customer-job-status\?/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token-1');

  const storageResult = await governed.storage.from('generated_reports').remove(['owner/report.pdf']);
  assert.equal(storageResult.error, null);
  assert.equal(rawGeneratedRemoveCount, 0, 'generated report objects must not be removed directly by the browser client');

  const reportResult = await governed.from('reports').delete().eq('id', 'report-1');
  assert.equal(rawReportDeleteCount, 0, 'reports must not be deleted directly by the browser client');
  assert.equal(reportResult.error, null);
  assert.equal(calls.at(-1).url, '/api/customer-report-removal');

  const migration = fs.readFileSync(
    path.join(repoRoot, 'supabase/migrations/20260818090000_p0_a2_customer_safe_read_report_removal.sql'),
    'utf8',
  );
  assert.match(migration, /drop policy if exists analysis_artifacts_select_own/i);
  assert.match(migration, /revoke select on table public\.analysis_artifacts from authenticated/i);
  assert.match(migration, /drop policy if exists "Users can delete their own reports"/i);
  assert.match(migration, /revoke delete on table public\.reports from anon, authenticated/i);
  assert.match(migration, /customer_report_removals/i);

  const statusEndpoint = fs.readFileSync(path.join(repoRoot, 'api/customer-job-status.js'), 'utf8');
  assert.doesNotMatch(statusEndpoint, /source_truth_package|premium|recovery[_-]/i);
  assert.match(statusEndpoint, /delivery_gate_decision/);
  assert.match(statusEndpoint, /entitlement_restored/);
  assert.match(statusEndpoint, /rent_roll_parsed/);

  console.log('P0-A2 customer boundary smoke: PASS');
} finally {
  globalThis.fetch = originalFetch;
}
