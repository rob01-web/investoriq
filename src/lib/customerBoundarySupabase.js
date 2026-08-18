function normalizeJobIds(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 50);
}

async function getAccessToken(baseSupabase) {
  const { data, error } = await baseSupabase.auth.getSession();
  if (error) throw error;
  return data?.session?.access_token || '';
}

async function requestJson(baseSupabase, url, options = {}) {
  const accessToken = await getAccessToken(baseSupabase);
  if (!accessToken) return { data: null, error: { message: 'Session expired', code: 'UNAUTHORIZED' } };
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        data: null,
        error: {
          message: body?.message || body?.error || `Request failed (${response.status})`,
          code: body?.error || `HTTP_${response.status}`,
          status: response.status,
        },
      };
    }
    return { data: body, error: null };
  } catch (error) {
    return { data: null, error: { message: error?.message || 'Request failed', code: 'NETWORK_ERROR' } };
  }
}

class CustomerArtifactQueryBuilder {
  constructor(baseSupabase) {
    this.baseSupabase = baseSupabase;
    this.filters = { jobIds: [], type: null, events: [], limit: null };
  }
  select() { return this; }
  eq(column, value) {
    if (column === 'job_id') this.filters.jobIds = normalizeJobIds(value);
    else if (column === 'type') this.filters.type = String(value || '').trim();
    else if (column === 'payload->>event') this.filters.events = normalizeJobIds(value);
    return this;
  }
  in(column, values) {
    if (column === 'job_id') this.filters.jobIds = normalizeJobIds(values);
    else if (column === 'payload->>event') this.filters.events = normalizeJobIds(values);
    return this;
  }
  order() { return this; }
  limit(value) {
    const parsed = Number(value);
    this.filters.limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : null;
    return this;
  }
  async execute({ maybeSingle = false } = {}) {
    const params = new URLSearchParams();
    if (this.filters.jobIds.length) params.set('job_ids', this.filters.jobIds.join(','));
    if (this.filters.type) params.set('type', this.filters.type);
    if (this.filters.events.length) params.set('events', this.filters.events.join(','));
    if (this.filters.limit) params.set('limit', String(this.filters.limit));
    const { data, error } = await requestJson(
      this.baseSupabase,
      `/api/customer-job-status?${params.toString()}`,
      { method: 'GET' },
    );
    if (error) return { data: null, error };
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (maybeSingle) return { data: rows[0] || null, error: null };
    return { data: rows, error: null };
  }
  maybeSingle() { return this.execute({ maybeSingle: true }); }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

function governedRemovalError(error) {
  const failure = new Error(error?.message || 'Governed report removal failed');
  failure.code = error?.code || 'REPORT_REMOVAL_FAILED';
  failure.status = error?.status || null;
  return failure;
}

class CustomerReportDeleteBuilder {
  constructor(baseSupabase) {
    this.baseSupabase = baseSupabase;
    this.reportId = null;
    this.invalidFilter = false;
  }
  eq(column, value) {
    if (column === 'id' && !this.reportId) this.reportId = String(value || '').trim();
    else this.invalidFilter = true;
    return this;
  }
  async execute() {
    if (!this.reportId || this.invalidFilter) {
      throw governedRemovalError({
        message: 'Governed report removal requires one exact report id',
        code: 'INVALID_REPORT_REMOVAL',
      });
    }
    const { data, error } = await requestJson(this.baseSupabase, '/api/customer-report-removal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: this.reportId }),
    });
    if (error) throw governedRemovalError(error);
    return { data: data?.reports || [], error: null };
  }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

function wrapReportsTable(baseSupabase) {
  const table = baseSupabase.from('reports');
  return new Proxy(table, {
    get(target, property) {
      if (property === 'delete') return () => new CustomerReportDeleteBuilder(baseSupabase);
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function wrapStorage(baseSupabase) {
  return new Proxy(baseSupabase.storage, {
    get(target, property) {
      if (property !== 'from') {
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }
      return (bucketName) => {
        const bucket = target.from(bucketName);
        if (bucketName !== 'generated_reports') return bucket;
        return new Proxy(bucket, {
          get(bucketTarget, bucketProperty) {
            if (bucketProperty === 'remove') {
              return async (paths) => ({
                data: Array.isArray(paths) ? paths.map((name) => ({ name })) : [],
                error: null,
                governedRemovalDeferred: true,
              });
            }
            if (bucketProperty === 'createSignedUrl') {
              return async (storagePath) => {
                const { data, error } = await requestJson(baseSupabase, '/api/customer-report-download', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ storage_path: String(storagePath || '').trim() }),
                });
                if (error) return { data: null, error };
                return {
                  data: { signedUrl: data?.signedUrl || null },
                  error: data?.signedUrl ? null : { message: 'Download artifact unavailable', code: 'DOWNLOAD_ARTIFACT_UNAVAILABLE' },
                };
              };
            }
            const value = Reflect.get(bucketTarget, bucketProperty, bucketTarget);
            return typeof value === 'function' ? value.bind(bucketTarget) : value;
          },
        });
      };
    },
  });
}

function wrapRpc(baseSupabase) {
  return (functionName, args = {}, options = {}) => {
    if (functionName === 'queue_job_for_processing') {
      return Promise.resolve({
        data: { status: 'queued', governedAdmissionAlreadyQueued: true },
        error: null,
      });
    }
    return baseSupabase.rpc(functionName, args, options);
  };
}

export function wrapSupabaseWithCustomerBoundaries(baseSupabase) {
  const storage = wrapStorage(baseSupabase);
  const rpc = wrapRpc(baseSupabase);
  return new Proxy(baseSupabase, {
    get(target, property) {
      if (property === 'storage') return storage;
      if (property === 'rpc') return rpc;
      if (property === 'from') {
        return (tableName) => {
          if (tableName === 'analysis_artifacts') return new CustomerArtifactQueryBuilder(baseSupabase);
          if (tableName === 'reports') return wrapReportsTable(baseSupabase);
          return baseSupabase.from(tableName);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
