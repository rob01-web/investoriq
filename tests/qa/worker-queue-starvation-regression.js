import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createWorkerQueueScan, applyWorkerQueueCursor } from '../../api/_lib/worker-queue-scan.js';

// Execute the actual worker selection/claim block, with the installed Supabase
// client and a local HTTP adapter. No live database, providers, purchases or email.
const source = fs.readFileSync('api/admin-run-worker.js', 'utf8');
const factory = source.slice(source.indexOf('    const queueScan = createWorkerQueueScan'), source.indexOf('    while (passesRun < maxPasses'));
const claimBlock = source.slice(source.indexOf('      let claimedThisPass = 0;'), source.indexOf('      const { data: extractingJobs'));
assert.ok(factory && claimBlock);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const makeScan = new AsyncFunction('supabaseAdmin', 'exactJobMode', 'startTime', 'maxSeconds', 'createWorkerQueueScan', 'applyWorkerQueueCursor', `${factory}\nreturn queueScan;`);
const runClaimBlock = new AsyncFunction('ctx', `
  const { queueScan, supabaseAdmin, workerInvocationId, exactJobMode, jobLimit, deferredJobIds,
    writeWorkerEventArtifact, writeWorkerAttemptEvent, applyTerminalFailureOutcome,
    writeStatusTransitionArtifact, recordJobFailure, res } = ctx;
  const transitions = [], failedJobIds = [];
  let passTransitions = 0;
  const nowIso = new Date().toISOString();
  ${claimBlock}
  return { transitions, failedJobIds };
`);
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const row = (n, overrides = {}) => ({
  id: id(n), user_id: id(9000), status: 'queued', report_type: 'screening',
  created_at: '2026-09-11T16:05:09.666291+00:00',
  admission_receipt_id: id(n + 10000), product_identity: 'screening', report_family: 'screening',
  ...overrides,
});
function fixture(rows, { queryError = false } = {}) {
  const events = [], claims = [], requests = [];
  const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const supabaseAdmin = createClient('https://queue-fixture.invalid', 'fixture-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, init) => {
      const url = new URL(input);
      requests.push(url);
      if (url.pathname.endsWith('/analysis_jobs')) {
        if (queryError) return response({ message: 'fixture database unavailable' }, 503);
        assert.equal(url.searchParams.get('status'), 'eq.queued');
        assert.equal(url.searchParams.get('order'), 'created_at.asc,id.asc');
        assert.equal(url.searchParams.get('admission_receipt_id'), 'not.is.null');
        assert.equal(url.searchParams.get('product_identity'), 'in.(screening,full_underwriting)');
        assert.equal(url.searchParams.get('report_family'), 'in.(screening,full_underwriting)');
        let available = rows.filter(j => j.status === 'queued' && j.admission_receipt_id &&
          ['screening', 'full_underwriting'].includes(j.product_identity) &&
          ['screening', 'full_underwriting'].includes(j.report_family));
        const cursor = url.searchParams.get('or');
        if (cursor) {
          const match = cursor.match(/^\(created_at.gt."([^"]+)",and\(created_at.eq."\1",id.gt.([0-9a-f-]+)\)\)$/);
          assert.ok(match, `Invalid tuple cursor: ${cursor}`);
          available = available.filter(j => j.created_at > match[1] || (j.created_at === match[1] && j.id > match[2]));
        }
        available.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
        return response(available.slice(0, Number(url.searchParams.get('limit'))));
      }
      if (url.pathname.endsWith('/rpc/claim_worker_job')) {
        const args = JSON.parse(init.body);
        claims.push(args.p_job_id);
        const j = rows.find(j => j.id === args.p_job_id);
        if (j.claimError) return response({ message: 'fixture claim error' }, 500);
        if (j.reject || j.status !== 'queued' || j.product_identity !== j.report_family) return response([]);
        j.status = 'extracting';
        j.worker_claimed_by = args.p_claimed_by;
        j.worker_attempt_id = id(30000 + claims.length);
        return response([j]);
      }
      if (url.pathname.endsWith('/report_purchases')) return response([{ id: id(7000) }]);
      throw new Error(`Unexpected request: ${url.pathname}`);
    } },
  });
  async function context(exactJobMode = false, jobLimit = 1) {
    return {
      supabaseAdmin, exactJobMode, jobLimit, workerInvocationId: `fixture-${Math.random()}`,
      queueScan: await makeScan(supabaseAdmin, exactJobMode, Date.now(), 270, createWorkerQueueScan, applyWorkerQueueCursor),
      deferredJobIds: new Set(),
      writeWorkerEventArtifact: async (jobId, userId, event, payload) => { events.push({ jobId, event, payload }); return null; },
      writeWorkerAttemptEvent: async () => null,
      writeStatusTransitionArtifact: async () => null,
      applyTerminalFailureOutcome: async () => { throw new Error('Unexpected terminal mutation'); },
      recordJobFailure: async (job, stage, err) => { throw err; },
      res: { status(code) { return { json: body => ({ status: code, body }) }; } },
    };
  }
  return { rows, events, claims, requests, context };
}

// Characterize the old failure before testing the repaired actual worker block.
{
  const rows = [row(1, { admission_receipt_id: null }), row(2), row(3)];
  for (let i = 0; i < 3; i++) assert.equal(rows.filter(j => j.status === 'queued').slice(0, 1)[0].id, id(1));
  const f = fixture(rows);
  const ctx = await f.context();
  assert.equal((await runClaimBlock(ctx)).transitions[0].job_id, id(2));
  assert.equal((await runClaimBlock(ctx)).transitions[0].job_id, id(3));
  assert.equal(rows[0].status, 'queued', 'legacy row must not be mutated');
  assert.deepEqual(f.claims, [id(2), id(3)]);
}
// Thousands of legacy rows cannot consume the server-side candidate window.
{
  const f = fixture([...Array.from({ length: 1000 }, (_, i) => row(i + 1, { admission_receipt_id: null })), row(1001)]);
  assert.equal((await runClaimBlock(await f.context())).transitions[0].job_id, id(1001));
  assert.equal(f.claims.length, 1);
}
// Rejected candidates, identical timestamps, multiple pages and claim errors.
{
  const f = fixture([...Array.from({ length: 70 }, (_, i) => row(i + 1, { reject: true })), row(71, { claimError: true }), row(72), row(73)]);
  const ctx = await f.context();
  assert.equal((await runClaimBlock(ctx)).transitions[0].job_id, id(72));
  assert.equal((await runClaimBlock(ctx)).transitions[0].job_id, id(73));
  assert.equal(ctx.queueScan.stats.skipped, 71);
  assert.equal(ctx.queueScan.stats.claimErrors, 1);
  assert.equal(new Set(f.claims).size, f.claims.length, 'rejected candidates must not repeat');
  assert.ok(ctx.queueScan.stats.pages >= 3);
}
// Claims remove rows from the live queue: keyset pagination must not skip rows.
{
  const f = fixture(Array.from({ length: 80 }, (_, i) => row(i + 1)));
  const ctx = await f.context(false, 3);
  for (let i = 0; i < 27; i++) await runClaimBlock(ctx);
  assert.equal(ctx.queueScan.stats.claimed, 80);
  assert.equal(new Set(f.claims).size, 80);
}
// Simulated competing workers may race, but only the claim authority can win.
{
  const f = fixture(Array.from({ length: 12 }, (_, i) => row(i + 1)));
  const a = await f.context(false, 3), b = await f.context(false, 3);
  const results = await Promise.all([runClaimBlock(a), runClaimBlock(b)]);
  const publishedClaims = results.flatMap(r => r.transitions.map(t => t.job_id));
  assert.equal(publishedClaims.length, 6);
  assert.equal(new Set(publishedClaims).size, 6);
}
// Exact mode remains isolated; query failures do not masquerade as empty queues.
{
  const f = fixture([row(1)]);
  await runClaimBlock(await f.context(true));
  assert.equal(f.requests.length, 0);
  const broken = fixture([row(1)], { queryError: true });
  assert.equal((await runClaimBlock(await broken.context())).status, 500);
}
// Bounded work surfaces exhaustion rather than claiming that the queue is empty.
{
  const f = fixture(Array.from({ length: 260 }, (_, i) => row(i + 1, { reject: true })));
  const ctx = await f.context();
  await runClaimBlock(ctx);
  assert.equal(ctx.queueScan.stats.scanned, 250);
  assert.equal(ctx.queueScan.stats.scanBudgetExhausted, true);
  const scan = createWorkerQueueScan({ fetchPage: () => assert.fail('past deadline'), deadlineMs: 1, now: () => 2 });
  assert.equal(await scan.next(), null);
  assert.equal(scan.stats.scanBudgetExhausted, true);
}
// Timestamp precision and filter sanitization.
{
  let filter;
  applyWorkerQueueCursor({ or(value) { filter = value; } }, { id: id(1), created_at: '2026-09-11T16:05:09.666291+00:00' });
  assert.ok(filter.includes('.666291'));
  assert.throws(() => applyWorkerQueueCursor({}, { id: id(1), created_at: 'bad),status.eq.queued' }));
}
assert.match(source, /queue_requires_attention/);
assert.match(source, /queue: \{ \.\.\.queueScan.stats, needsAttention: queueNeedsAttention \}/);
console.log('worker-queue-starvation-regression: PASS (actual worker block; local HTTP adapter; no production writes)');
