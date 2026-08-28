function normalizeJobIds(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 50);
}

const STAGED_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
const STAGED_UPLOAD_ALLOWED_MIME_TYPES = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.xlsx', new Set(['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])],
  ['.xls', new Set(['application/vnd.ms-excel'])],
  ['.csv', new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel'])],
  ['.doc', new Set(['application/msword'])],
  ['.docx', new Set(['application/vnd.openxmlformats-officedocument.wordprocessingml.document'])],
  ['.jpg', new Set(['image/jpeg', 'image/jpg'])],
  ['.jpeg', new Set(['image/jpeg', 'image/jpg'])],
  ['.png', new Set(['image/png'])],
]);

function stagedUploadError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function fileExtension(name) {
  const match = String(name || '').trim().toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] || '';
}

async function validateStagedUploadFile(file) {
  const name = String(file?.name || '').trim();
  const extension = fileExtension(name);
  const allowedMimeTypes = STAGED_UPLOAD_ALLOWED_MIME_TYPES.get(extension);
  const size = Number(file?.size);
  const mimeType = String(file?.type || '').trim().toLowerCase();

  if (!name || !allowedMimeTypes) {
    throw stagedUploadError('This document type is not supported for report uploads.', 'UNSUPPORTED_UPLOAD_TYPE');
  }
  if (!Number.isFinite(size) || size <= 0) {
    throw stagedUploadError('This document is empty or could not be read.', 'INVALID_UPLOAD_SIZE');
  }
  if (size > STAGED_UPLOAD_MAX_BYTES) {
    throw stagedUploadError('This document is larger than the 50 MB upload limit.', 'UPLOAD_TOO_LARGE');
  }
  if (!mimeType || !allowedMimeTypes.has(mimeType)) {
    throw stagedUploadError('This document type could not be verified. Please choose a supported file.', 'UPLOAD_MIME_MISMATCH');
  }

  if (extension === '.pdf') {
    if (typeof file?.slice !== 'function') {
      throw stagedUploadError('This PDF could not be verified. Please upload a valid PDF file.', 'INVALID_PDF_SIGNATURE');
    }
    const headerBlob = file.slice(0, 5);
    if (typeof headerBlob?.arrayBuffer !== 'function') {
      throw stagedUploadError('This PDF could not be verified. Please upload a valid PDF file.', 'INVALID_PDF_SIGNATURE');
    }
    const header = new Uint8Array(await headerBlob.arrayBuffer());
    const signature = String.fromCharCode(...header);
    if (signature !== '%PDF-') {
      throw stagedUploadError('This PDF could not be verified. Please upload a valid PDF file.', 'INVALID_PDF_SIGNATURE');
    }
  }
}

function safeAdmissionError(rawError) {
  const raw = `${rawError?.code || ''} ${rawError?.message || ''} ${rawError?.details || ''}`.toUpperCase();
  if (
    raw.includes('MISSING_REQUIRED_CORE_DOCUMENTS') ||
    raw.includes('BOTH RENT ROLL AND T12 ARE REQUIRED') ||
    raw.includes('BOTH A RENT ROLL AND A T12 ARE REQUIRED')
  ) {
    return { message: 'Upload a Rent Roll or a T12 before starting analysis.', code: 'MISSING_REQUIRED_CORE_DOCUMENTS' };
  }
  if (raw.includes('PURCHASE_NOT_AVAILABLE')) {
    return { message: 'No available report credit was found for this report.', code: 'PURCHASE_NOT_AVAILABLE' };
  }
  if (raw.includes('ADMISSION_CURRENT_DISCLOSURE_SESSION_REQUIRED')) {
    return { message: 'Please review and accept the analysis disclosure before starting the report.', code: 'DISCLOSURE_REQUIRED' };
  }
  if (raw.includes('INVALID_STAGED_FILES') || raw.includes('ADMISSION_STAGED_OBJECT_METADATA_MISMATCH')) {
    return { message: 'Uploaded files could not be validated. Please review the files and try again.', code: 'UPLOAD_VALIDATION_FAILED' };
  }
  return {
    message: 'We could not start this report. Your report credit was not consumed. Please try again.',
    code: 'REPORT_ADMISSION_FAILED',
  };
}

async function removeAdmissionStagedObjects(baseSupabase, stagedFiles) {
  const paths = [...new Set(
    (Array.isArray(stagedFiles) ? stagedFiles : [])
      .map((row) => String(row?.storage_path || '').trim())
      .filter((path) => path.startsWith('staged/')),
  )];
  if (!paths.length) return { data: [], error: null };
  const result = await baseSupabase.storage.from('staged_uploads').remove(paths);
  if (result?.error) {
    console.error('[InvestorIQ] Failed to compensate staged objects after admission failure:', result.error);
  }
  return result;
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

function wrapStagedUploadBucket(baseSupabase, bucket) {
  return new Proxy(bucket, {
    get(bucketTarget, bucketProperty) {
      if (bucketProperty === 'upload') {
        return async (storagePath, file, options = {}) => {
          try {
            await validateStagedUploadFile(file);
          } catch (error) {
            return { data: null, error: { message: error.message, code: error.code || 'UPLOAD_VALIDATION_FAILED' } };
          }
          const result = await bucketTarget.upload(storagePath, file, options);
          if (result?.error) {
            console.error('[InvestorIQ] Staged upload provider error:', result.error);
            return {
              data: null,
              error: {
                message: 'We could not upload this document. Please try again.',
                code: 'STAGED_UPLOAD_FAILED',
              },
            };
          }
          return result;
        };
      }
      const value = Reflect.get(bucketTarget, bucketProperty, bucketTarget);
      return typeof value === 'function' ? value.bind(bucketTarget) : value;
    },
  });
}

function wrapGeneratedReportsBucket(baseSupabase, bucket) {
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
        if (bucketName === 'staged_uploads') return wrapStagedUploadBucket(baseSupabase, bucket);
        if (bucketName === 'generated_reports') return wrapGeneratedReportsBucket(baseSupabase, bucket);
        return bucket;
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
    if (functionName !== 'consume_purchase_and_create_job') {
      return baseSupabase.rpc(functionName, args, options);
    }

    return (async () => {
      const result = await baseSupabase.rpc(functionName, args, options);
      if (!result?.error) return result;

      console.error('[InvestorIQ] Governed admission error:', result.error);
      await removeAdmissionStagedObjects(baseSupabase, args?.p_staged_files);
      const safe = safeAdmissionError(result.error);
      return {
        data: null,
        error: {
          message: safe.message,
          code: safe.code,
        },
      };
    })();
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
