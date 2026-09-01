import assert from 'node:assert/strict';
import { handleCustomerBoundaryRoute } from '../../api/_lib/customer-boundary-handler.js';

process.env.INVESTORIQ_ADMIN_EMAILS ||= 'hello@investoriq.tech';

const ownerId = '00000000-0000-4000-8000-000000000501';
const otherId = '00000000-0000-4000-8000-000000000502';

const state = {
  jobs: [
    {
      id: '00000000-0000-4000-8000-000000000511',
      user_id: ownerId,
      property_name: 'Phase 5 Property',
      report_type: 'screening',
      status: 'failed',
      created_at: '2026-09-01T10:00:00.000Z',
      error_code: 'INTERNAL_RENDER_STACK_TRACE',
      error_message: 'provider secret details',
      failure_reason: 'worker runtime exploded',
      worker_claimed_by: 'internal-worker-name',
    },
    {
      id: '00000000-0000-4000-8000-000000000512',
      user_id: otherId,
      property_name: 'Other Property',
      report_type: 'underwriting',
      status: 'queued',
      created_at: '2026-09-01T11:00:00.000Z',
      error_code: null,
    },
  ],
  purchases: [
    {
      id: '00000000-0000-4000-8000-000000000521',
      user_id: ownerId,
      product_type: 'screening',
      consumed_at: null,
      created_at: '2026-09-01T09:00:00.000Z',
      stripe_session_id: 'cs_secret_lineage_1',
      job_id: null,
    },
    {
      id: '00000000-0000-4000-8000-000000000522',
      user_id: ownerId,
      product_type: 'underwriting',
      consumed_at: null,
      created_at: '2026-09-01T09:05:00.000Z',
      stripe_session_id: 'cs_secret_lineage_2',
      job_id: null,
    },
  ],
};

class Query {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.limitValue = null;
    this.mode = 'select';
  }
  select() { return this; }
  eq(column, value) { this.filters.push(['eq', column, value]); return this; }
  in(column, values) { this.filters.push(['in', column, values]); return this; }
  is(column, value) { this.filters.push(['is', column, value]); return this; }
  order() { return this; }
  limit(value) { this.limitValue = Number(value); return this; }
  delete() { this.mode = 'delete'; return this; }
  rows() {
    const source = this.table === 'analysis_jobs' ? state.jobs : state.purchases;
    let rows = [...source];
    for (const [kind, column, value] of this.filters) {
      if (kind === 'eq') rows = rows.filter((row) => row?.[column] === value);
      else if (kind === 'in') rows = rows.filter((row) => Array.isArray(value) && value.includes(row?.[column]));
      else if (kind === 'is') rows = rows.filter((row) => row?.[column] === value);
    }
    if (Number.isFinite(this.limitValue)) rows = rows.slice(0, this.limitValue);
    return rows;
  }
  async execute() {
    if (this.mode === 'delete') {
      const deleting = new Set(this.rows().map((row) => row.id));
      state.purchases = state.purchases.filter((row) => !deleting.has(row.id));
      return { data: null, error: null };
    }
    return { data: this.rows(), error: null };
  }
  async maybeSingle() {
    const result = await this.execute();
    return { data: result.data?.[0] || null, error: result.error };
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

const supabase = {
  from(table) {
    if (!['analysis_jobs', 'report_purchases'].includes(table)) {
      throw new Error(`Unexpected table: ${table}`);
    }
    const query = new Query(table);
    query.insert = async (rows) => {
      const values = Array.isArray(rows) ? rows : [rows];
      values.forEach((row, index) => {
        state.purchases.push({
          id: `00000000-0000-4000-8000-${String(600000000000 + state.purchases.length + index).padStart(12, '0')}`,
          created_at: new Date().toISOString(),
          ...row,
        });
      });
      return { data: values, error: null };
    };
    return query;
  },
};

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

const customerAuth = { ok: true, actor: { id: ownerId, email: 'customer@example.com' } };
const adminAuth = { ok: true, actor: { id: otherId, email: 'hello@investoriq.tech' } };

// Customer jobs are ownership-bound and strip internal runtime/database detail.
const jobsRes = response();
await handleCustomerBoundaryRoute({
  req: { method: 'GET', query: { customer_route: 'job_status', surface: 'jobs', limit: '25' } },
  res: jobsRes,
  auth: customerAuth,
  supabase,
});
assert.equal(jobsRes.statusCode, 200);
assert.equal(jobsRes.body.rows.length, 1);
assert.equal(jobsRes.body.rows[0].property_name, 'Phase 5 Property');
assert.equal(jobsRes.body.rows[0].error_code, 'REPORT_GENERATION_FAILED');
assert.equal(jobsRes.body.rows[0].error_message, null);
assert.equal(jobsRes.body.rows[0].failure_reason, null);
assert.equal('worker_claimed_by' in jobsRes.body.rows[0], false);
assert.equal('user_id' in jobsRes.body.rows[0], false);

// Customer entitlement projection returns only safe product identity/counts.
const entitlementsRes = response();
await handleCustomerBoundaryRoute({
  req: { method: 'GET', query: { customer_route: 'job_status', surface: 'entitlements' } },
  res: entitlementsRes,
  auth: customerAuth,
  supabase,
});
assert.equal(entitlementsRes.statusCode, 200);
assert.deepEqual(entitlementsRes.body.counts, { screening: 1, underwriting: 1 });
assert.deepEqual(entitlementsRes.body.rows, [
  { product_type: 'screening' },
  { product_type: 'underwriting' },
]);
assert.equal(JSON.stringify(entitlementsRes.body).includes('cs_secret_lineage'), false);

// A normal customer cannot invoke the admin entitlement surface.
const deniedRes = response();
await handleCustomerBoundaryRoute({
  req: {
    method: 'GET',
    query: {
      customer_route: 'job_status',
      surface: 'admin_entitlements',
      user_id: ownerId,
      product_type: 'screening',
    },
  },
  res: deniedRes,
  auth: customerAuth,
  supabase,
});
assert.equal(deniedRes.statusCode, 403);

// Authorized admin can inspect exact unconsumed IDs for controlled revocation.
const adminListRes = response();
await handleCustomerBoundaryRoute({
  req: {
    method: 'GET',
    query: {
      customer_route: 'job_status',
      surface: 'admin_entitlements',
      user_id: ownerId,
      product_type: 'screening',
      limit: '25',
    },
  },
  res: adminListRes,
  auth: adminAuth,
  supabase,
});
assert.equal(adminListRes.statusCode, 200);
assert.equal(adminListRes.body.rows.length, 1);
assert.equal(adminListRes.body.rows[0].id, '00000000-0000-4000-8000-000000000521');

// Authorized admin grant/revoke stays server-owned and bounded.
const grantRes = response();
await handleCustomerBoundaryRoute({
  req: {
    method: 'POST',
    query: { customer_route: 'job_status', surface: 'admin_entitlements' },
    body: { action: 'grant', user_id: ownerId, product_type: 'screening', count: 2 },
  },
  res: grantRes,
  auth: adminAuth,
  supabase,
});
assert.equal(grantRes.statusCode, 200);
assert.equal(grantRes.body.granted, 2);
assert.equal(state.purchases.filter((row) => row.user_id === ownerId && row.product_type === 'screening' && row.consumed_at === null).length, 3);

const revokeRes = response();
await handleCustomerBoundaryRoute({
  req: {
    method: 'POST',
    query: { customer_route: 'job_status', surface: 'admin_entitlements' },
    body: { action: 'revoke_ids', ids: ['00000000-0000-4000-8000-000000000521'] },
  },
  res: revokeRes,
  auth: adminAuth,
  supabase,
});
assert.equal(revokeRes.statusCode, 200);
assert.equal(revokeRes.body.revoked, 1);
assert.equal(state.purchases.some((row) => row.id === '00000000-0000-4000-8000-000000000521'), false);

console.log('phase5-customer-boundary-runtime-smoke: PASS');
