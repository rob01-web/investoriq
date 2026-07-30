import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workerPath = path.join(repoRoot, 'api/admin-run-worker.js');
const workerUrl = pathToFileURL(workerPath).href;

const fixedNowIso = '2026-07-30T12:00:00.000Z';
const fixedNowMs = Date.parse(fixedNowIso);
const fixedWorkerInvocationId = fixedNowIso.replace(/:/g, '-');

const realDate = Date;
class FixedDate extends realDate {
  constructor(...args) {
    super(args.length > 0 ? args[0] : fixedNowIso);
  }
  static now() {
    return fixedNowMs;
  }
  static parse(value) {
    return realDate.parse(value);
  }
  static UTC(...args) {
    return realDate.UTC(...args);
  }
}

function toFileUrl(relativePath) {
  return pathToFileURL(path.join(repoRoot, relativePath)).href;
}

function patchWorkerSource(source) {
  return source
    .replace(
      "import { createClient } from '@supabase/supabase-js';",
      "const createClient = globalThis.__h8CreateClient;"
    )
    .replace(
      "    const restoreEntitlementForFailedJob = async (job, restoreReason, restoreErrorCode, workerAttemptId = null) => {",
      "    const restoreEntitlementForFailedJob = globalThis.__h8RestoreEntitlementForFailedJob = async (job, restoreReason, restoreErrorCode, workerAttemptId = null) => {"
    )
    .replaceAll("../lib/email-resend.js", toFileUrl('lib/email-resend.js'))
    .replaceAll("./_lib/validator-diagnostics-rollup.js", toFileUrl('api/_lib/validator-diagnostics-rollup.js'))
    .replaceAll("../lib/terminal-failure-taxonomy.js", toFileUrl('lib/terminal-failure-taxonomy.js'))
    .replaceAll("./_lib/report-delivery-output.js", toFileUrl('api/_lib/report-delivery-output.js'))
    .replaceAll("./_lib/report-quality-manifest.js", toFileUrl('api/_lib/report-quality-manifest.js'))
    .replaceAll("./_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js", toFileUrl('api/_lib/premium-acquisition-underwriting-v1-job-start-surface-receipt.js'))
    .replaceAll("./_lib/premium-acquisition-underwriting-v1-external-certification.js", toFileUrl('api/_lib/premium-acquisition-underwriting-v1-external-certification.js'))
    .replace(
      "    const recordJobFailure = async (job, stage, err) => {",
      "    throw new Error('__H8_EXPOSED__');\n\n    const recordJobFailure = async (job, stage, err) => {"
    );
}

function createRuntimeState() {
  return {
    jobs: new Map(),
    purchases: new Map(),
    reports: [],
    artifacts: [],
    jobEvents: [],
    restoreCalls: [],
    nextRowId: 0,
  };
}

let runtimeState = createRuntimeState();

function seedJob(job) {
  const stored = {
    id: job.id,
    user_id: job.user_id || 'user-1',
    status: job.status,
    worker_attempt_id: job.worker_attempt_id || null,
    worker_claimed_by: job.worker_claimed_by || null,
    worker_attempt_count: job.worker_attempt_count ?? 1,
    worker_lease_expires_at: job.worker_lease_expires_at ?? null,
    purchase_id: job.purchase_id || null,
  };
  runtimeState.jobs.set(stored.id, stored);
  return stored;
}

function seedPurchase(purchase) {
  const stored = {
    id: purchase.id,
    job_id: purchase.job_id || null,
    consumed_at: purchase.consumed_at || null,
  };
  runtimeState.purchases.set(stored.id, stored);
  return stored;
}

function seedPublishedReport(report) {
  runtimeState.reports.push({
    id: report.id,
    job_id: report.job_id,
    status: report.status || 'published',
  });
}

function allocateRowId(prefix) {
  runtimeState.nextRowId += 1;
  return `${prefix}-${runtimeState.nextRowId}`;
}

function matchesFilter(row, filter) {
  const value = (() => {
    if (filter.field === 'payload->>event') return row?.payload?.event ?? null;
    return row?.[filter.field];
  })();
  if (filter.kind === 'eq') return String(value ?? '') === String(filter.value ?? '');
  if (filter.kind === 'in') return Array.isArray(filter.values) && filter.values.map(String).includes(String(value ?? ''));
  if (filter.kind === 'not') {
    if (filter.op === 'is' && filter.value === null) return value !== null && value !== undefined;
  }
  if (filter.kind === 'lte') {
    const left = value ? new Date(value).getTime() : NaN;
    const right = filter.value ? new Date(filter.value).getTime() : NaN;
    return Number.isFinite(left) && Number.isFinite(right) && left <= right;
  }
  return true;
}

class FakeQuery {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.limitCount = null;
    this.orderSpec = null;
  }

  select() { return this; }
  eq(field, value) { this.filters.push({ kind: 'eq', field, value }); return this; }
  not(field, op, value) { this.filters.push({ kind: 'not', field, op, value }); return this; }
  in(field, values) { this.filters.push({ kind: 'in', field, values }); return this; }
  lte(field, value) { this.filters.push({ kind: 'lte', field, value }); return this; }
  order(field, options = {}) { this.orderSpec = { field, ascending: options.ascending !== false }; return this; }
  limit(count) { this.limitCount = count; return this; }

  _rows() {
    if (this.table === 'analysis_artifacts') {
      return runtimeState.artifacts;
    }
    if (this.table === 'analysis_job_events') {
      return runtimeState.jobEvents;
    }
    if (this.table === 'analysis_jobs') {
      return [...runtimeState.jobs.values()];
    }
    if (this.table === 'reports') {
      return runtimeState.reports;
    }
    if (this.table === 'report_purchases') {
      return [...runtimeState.purchases.values()];
    }
    return [];
  }

  _filteredRows() {
    let rows = this._rows().filter((row) => this.filters.every((filter) => matchesFilter(row, filter)));
    if (this.orderSpec?.field) {
      const field = this.orderSpec.field;
      const ascending = this.orderSpec.ascending;
      rows = rows.slice().sort((left, right) => {
        const l = left?.[field];
        const r = right?.[field];
        if (String(l ?? '') === String(r ?? '')) return 0;
        return String(l ?? '').localeCompare(String(r ?? '')) * (ascending ? 1 : -1);
      });
    }
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }
    return rows;
  }

  async maybeSingle() {
    const rows = this._filteredRows();
    return { data: rows[0] || null, error: null };
  }

  async single() {
    const rows = this._filteredRows();
    return { data: rows[0] || null, error: null };
  }

  then(resolve, reject) {
    return Promise.resolve({ data: this._filteredRows(), error: null }).then(resolve, reject);
  }
}

function makeSupabaseClient() {
  return {
    auth: {
      admin: {
        async getUserById() {
          return { data: { user: { email: 'user@example.com' } }, error: null };
        },
      },
    },
    storage: {
      from() {
        return {
          async download() {
            return { data: null, error: new Error('not used') };
          },
          async upload() {
            return { data: null, error: null };
          },
        };
      },
    },
    from(table) {
      return {
        select() {
          return new FakeQuery(table);
        },
        insert(rows) {
          const entries = Array.isArray(rows) ? rows : [rows];
          if (table === 'analysis_artifacts') {
            runtimeState.artifacts.push(...entries.map((entry) => ({ id: entry.id || allocateRowId('artifact'), ...entry })));
          } else if (table === 'analysis_job_events') {
            runtimeState.jobEvents.push(...entries.map((entry) => ({ id: entry.id || allocateRowId('job_event'), ...entry })));
          } else if (table === 'reports') {
            runtimeState.reports.push(...entries.map((entry) => ({ id: entry.id || allocateRowId('report'), ...entry })));
          }
          return Promise.resolve({ data: entries, error: null });
        },
      };
    },
    rpc(name, args = {}) {
      if (name !== 'restore_failed_worker_entitlement') {
        return Promise.resolve({ data: [], error: null });
      }
      runtimeState.restoreCalls.push({ name, args: { ...args } });
      const job = runtimeState.jobs.get(args.p_job_id);
      if (!job) return Promise.resolve({ data: [], error: null });
      if (String(job.worker_attempt_id || '') !== String(args.p_worker_attempt_id || '')) return Promise.resolve({ data: [], error: null });
      if (String(job.worker_claimed_by || '') !== String(args.p_claimed_by || '')) return Promise.resolve({ data: [], error: null });
      if (String(job.status || '') !== String(args.p_terminal_status || '')) return Promise.resolve({ data: [], error: null });
      if (!['failed', 'dead_letter'].includes(String(job.status || ''))) return Promise.resolve({ data: [], error: null });
      if (runtimeState.reports.some((report) => report.job_id === job.id && String(report.status || '') === 'published')) {
        return Promise.resolve({ data: [], error: null });
      }

      const purchase = [...runtimeState.purchases.values()].find((row) => row.job_id === job.id && row.consumed_at !== null);
      if (!purchase) return Promise.resolve({ data: [], error: null });

      purchase.consumed_at = null;
      purchase.job_id = null;
      job.purchase_id = null;

      return Promise.resolve({
        data: [{ restored: true, purchase_id: purchase.id, job_id: job.id }],
        error: null,
      });
    },
  };
}

async function loadWorkerModule() {
  const source = fs.readFileSync(workerPath, 'utf8');
  const patchedSource = patchWorkerSource(source);
  const workerModule = await import(`data:text/javascript;base64,${Buffer.from(patchedSource, 'utf8').toString('base64')}`);
  return workerModule;
}

function makeReqRes() {
  return {
    req: {
      method: 'POST',
      headers: { 'x-admin-run-key': 'admin-key' },
      query: {},
      body: {},
    },
    res: {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    },
  };
}

function assertRestorationEvent(jobId, expectedTerminalStatus) {
  const jobEvent = runtimeState.jobEvents.filter((row) => row.job_id === jobId && row.event_type === 'entitlement_restored');
  assert.equal(jobEvent.length, 1);
  assert.equal(jobEvent[0].from_status, expectedTerminalStatus);
  assert.equal(jobEvent[0].to_status, expectedTerminalStatus);

  const artifactEvent = runtimeState.artifacts.filter(
    (row) => row.job_id === jobId && row.type === 'worker_event' && row.payload?.event === 'entitlement_restored'
  );
  assert.equal(artifactEvent.length, 1);
  assert.equal(artifactEvent[0].payload.worker_attempt_id, runtimeState.jobs.get(jobId).worker_attempt_id);
}

async function invokeRestore(helper, job, restoreReason = 'terminal_failure', restoreErrorCode = 'WORKER_ERROR', workerAttemptId = null) {
  return helper(job, restoreReason, restoreErrorCode, workerAttemptId);
}

globalThis.__h8CreateClient = makeSupabaseClient;
globalThis.Date = FixedDate;
process.env.SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
process.env.SUPABASE_ANON_KEY = 'anon-key';
process.env.ADMIN_RUN_KEY = 'admin-key';

const workerModule = await loadWorkerModule();
const { req, res } = makeReqRes();
await workerModule.default(req, res);
const restoreHelper = globalThis.__h8RestoreEntitlementForFailedJob;

assert.equal(typeof restoreHelper, 'function');

runtimeState = createRuntimeState();
const failedJob = seedJob({
  id: 'job-failed',
  user_id: 'user-1',
  status: 'failed',
  worker_attempt_id: 'attempt-failed',
  worker_claimed_by: fixedWorkerInvocationId,
  purchase_id: 'purchase-failed',
});
const failedPurchase = seedPurchase({
  id: 'purchase-failed',
  job_id: 'job-failed',
  consumed_at: '2026-07-30T11:00:00.000Z',
});

const failedRestore = await invokeRestore(restoreHelper, failedJob, 'terminal_failure', 'WORKER_ERROR', failedJob.worker_attempt_id);
assert.equal(failedRestore.restored, true);
assert.equal(failedRestore.purchase_id, 'purchase-failed');
assert.equal(failedRestore.signal_written, true);
assert.equal(failedPurchase.consumed_at, null);
assert.equal(failedPurchase.job_id, null);
assert.equal(runtimeState.jobs.get('job-failed').purchase_id, null);
assertRestorationEvent('job-failed', 'failed');

runtimeState = createRuntimeState();
const deadLetterJob = seedJob({
  id: 'job-dead-letter',
  user_id: 'user-1',
  status: 'dead_letter',
  worker_attempt_id: 'attempt-dead-letter',
  worker_claimed_by: fixedWorkerInvocationId,
  purchase_id: 'purchase-dead-letter',
});
seedPurchase({
  id: 'purchase-dead-letter',
  job_id: 'job-dead-letter',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
const deadLetterRestore = await invokeRestore(restoreHelper, deadLetterJob, 'terminal_failure', 'TIMEOUT', deadLetterJob.worker_attempt_id);
assert.equal(deadLetterRestore.restored, true);
assertRestorationEvent('job-dead-letter', 'dead_letter');

const duplicateRestore = await invokeRestore(restoreHelper, deadLetterJob, 'terminal_failure', 'TIMEOUT', deadLetterJob.worker_attempt_id);
assert.equal(duplicateRestore.skipped, true);
assert.equal(runtimeState.restoreCalls.length, 1);
assert.equal(
  runtimeState.jobEvents.filter((row) => row.job_id === 'job-dead-letter' && row.event_type === 'entitlement_restored').length,
  1
);

runtimeState = createRuntimeState();
const staleJob = seedJob({
  id: 'job-stale',
  user_id: 'user-1',
  status: 'failed',
  worker_attempt_id: 'attempt-stale',
  worker_claimed_by: 'worker-older',
  purchase_id: 'purchase-stale',
});
seedPurchase({
  id: 'purchase-stale',
  job_id: 'job-stale',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
const staleRestore = await invokeRestore(restoreHelper, staleJob, 'terminal_failure', 'WORKER_ERROR', staleJob.worker_attempt_id)
  .then((result) => ({ result }))
  .catch((error) => ({ error }));
assert.ok(
  staleRestore.error
    ? String(staleRestore.error?.code || staleRestore.error?.message || '').includes('STALE_WORKER_ATTEMPT')
    : staleRestore.result?.skipped === true
);
assert.equal(runtimeState.restoreCalls.length, 0);
assert.equal(
  runtimeState.artifacts.some((row) => row.payload?.event === 'stale_worker_rejected'),
  true
);

runtimeState = createRuntimeState();
const publishedJob = seedJob({
  id: 'job-published',
  user_id: 'user-1',
  status: 'published',
  worker_attempt_id: 'attempt-published',
  worker_claimed_by: fixedWorkerInvocationId,
  purchase_id: 'purchase-published',
});
seedPurchase({
  id: 'purchase-published',
  job_id: 'job-published',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
seedPublishedReport({ id: 'report-published', job_id: 'job-published', status: 'published' });
const publishedRestore = await invokeRestore(restoreHelper, publishedJob, 'terminal_failure', 'WORKER_ERROR', publishedJob.worker_attempt_id);
assert.equal(publishedRestore.skipped, true);
assert.equal(runtimeState.restoreCalls.length, 1);
assert.equal(runtimeState.purchases.get('purchase-published').consumed_at, '2026-07-30T11:00:00.000Z');

runtimeState = createRuntimeState();
const queuedJob = seedJob({
  id: 'job-queued',
  user_id: 'user-1',
  status: 'queued',
  worker_attempt_id: 'attempt-queued',
  worker_claimed_by: fixedWorkerInvocationId,
  purchase_id: 'purchase-queued',
});
seedPurchase({
  id: 'purchase-queued',
  job_id: 'job-queued',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
const queuedRestore = await invokeRestore(restoreHelper, queuedJob, 'terminal_failure', 'WORKER_ERROR', queuedJob.worker_attempt_id);
assert.equal(queuedRestore.skipped, true);
assert.equal(runtimeState.restoreCalls.length, 1);

runtimeState = createRuntimeState();
const activeJob = seedJob({
  id: 'job-active',
  user_id: 'user-1',
  status: 'extracting',
  worker_attempt_id: 'attempt-active',
  worker_claimed_by: fixedWorkerInvocationId,
  worker_lease_expires_at: '2026-07-30T12:30:00.000Z',
  purchase_id: 'purchase-active',
});
seedPurchase({
  id: 'purchase-active',
  job_id: 'job-active',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
const activeRestore = await invokeRestore(restoreHelper, activeJob, 'terminal_failure', 'WORKER_ERROR', activeJob.worker_attempt_id);
assert.equal(activeRestore.skipped, true);

runtimeState = createRuntimeState();
const requeuedJob = seedJob({
  id: 'job-requeued',
  user_id: 'user-1',
  status: 'queued',
  worker_attempt_id: null,
  worker_claimed_by: null,
  purchase_id: 'purchase-requeued',
});
seedPurchase({
  id: 'purchase-requeued',
  job_id: 'job-requeued',
  consumed_at: '2026-07-30T11:00:00.000Z',
});
const requeuedRestore = await invokeRestore(restoreHelper, requeuedJob, 'terminal_failure', 'WORKER_ERROR', null)
  .then((result) => ({ result }))
  .catch((error) => ({ error }));
assert.ok(requeuedRestore.error ? isStaleWorkerAttemptError(requeuedRestore.error) : requeuedRestore.result?.skipped === true);
assert.equal(runtimeState.restoreCalls.length, 0);
assert.equal(
  runtimeState.jobEvents.filter((row) => row.job_id === 'job-requeued' && row.event_type === 'entitlement_restored').length,
  0
);

console.log('h8-entitlement-restoration-event-smoke: PASS');
