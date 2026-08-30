import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const expectedBranch = 'internal-phase2-atomic-publication-20260830';

function git(...args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function fail(message) {
  throw new Error(`STOP: ${message}`);
}

if (git('branch', '--show-current') !== expectedBranch) {
  fail(`Wrong branch. Expected ${expectedBranch}.`);
}

const expectedBlobs = new Map([
  ['src/pages/Dashboard.jsx', '53567f1a0d2bd91dd0c235a314a1666bc0fbfff6'],
  ['src/pages/AdminDashboard.jsx', '9b4bd24561ca3d74fb1d7cdb59703c075de65cf9'],
  ['api/admin-run-worker.js', 'cb42b31690f219da2ae2f9589ae0750838221de8'],
  ['src/lib/reportSurfaceState.js', '4cffc34598b89f666eae1df819615c64871ad5db'],
  ['src/lib/reportRevisionAuthority.js', 'feadb90ded64ddcca69f932b060004883bce7f64'],
  ['src/lib/customerBoundarySupabase.js', 'b3529fd7c0711b85c9e1e92ee01335267229c398'],
  ['api/_lib/customer-boundary-handler.js', '3f6aa36eb00f8e5d92ee255f1873c3af096977c9'],
  ['api/_lib/report-delivery-output.js', 'e1a61a83852c3b7274828a677326b777f79bac96'],
  ['supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql', 'fc18a70368c3a97da9b5d2cd1071cc9268201a1f'],
]);

for (const [relativePath, expectedBlob] of expectedBlobs) {
  const actualBlob = git('rev-parse', `HEAD:${relativePath}`);
  if (actualBlob !== expectedBlob) {
    fail(`${relativePath} branch source changed unexpectedly. Expected ${expectedBlob}, found ${actualBlob}.`);
  }
}

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8').replace(/\r\n/g, '\n');
}

function write(relativePath, text) {
  fs.writeFileSync(fullPath(relativePath), text.replace(/\r\n/g, '\n'), 'utf8');
}

function replaceExact(text, oldText, newText, label) {
  const first = text.indexOf(oldText);
  if (first < 0) fail(`Expected source fragment not found: ${label}`);
  if (text.indexOf(oldText, first + oldText.length) >= 0) {
    fail(`Expected one source fragment but found multiple: ${label}`);
  }
  return text.slice(0, first) + newText + text.slice(first + oldText.length);
}

function replaceRegexOnce(text, regex, replacement, label) {
  const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
  const matcher = new RegExp(regex.source, flags);
  const matches = [...text.matchAll(matcher)];
  if (matches.length !== 1) {
    fail(`Expected exactly one regex match for ${label}, found ${matches.length}.`);
  }
  return text.replace(regex, replacement);
}

// -----------------------------------------------------------------------------
// 1. Atomic database authority: nested manifest truth plus categorical Storage lockdown.
// -----------------------------------------------------------------------------
{
  const relativePath = 'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql';
  let text = read(relativePath);

  text = replaceExact(
    text,
    `  if coalesce(p_manifest_payload->>'publicationState', p_manifest_payload->>'publication_state', '') <> 'published' then\n    raise exception 'PUBLICATION_FINAL_MANIFEST_STATE_INVALID';\n  end if;\n`,
    `  if coalesce(p_manifest_payload #>> '{publication,state}', '') <> 'published' then\n    raise exception 'PUBLICATION_FINAL_MANIFEST_STATE_INVALID';\n  end if;\n  if coalesce(p_manifest_payload #>> '{publication,storagePath}', '') <> v_report.storage_path then\n    raise exception 'PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH';\n  end if;\n`,
    'nested final manifest publication receipt',
  );

  text = replaceExact(
    text,
    `  v_action := case\n    when lower(coalesce(v_decision->>'delivery_gate_status','')) like '%quality%'\n      or lower(coalesce(p_manifest_payload->>'publication_state', p_manifest_payload->>'publicationState', '')) like '%quality%'\n      then 'DELIVER_WITH_QUALITY_INCIDENT'\n    else 'DELIVER'\n  end;\n`,
    `  v_action := upper(coalesce(v_decision->>'canonical_delivery_action',''));\n  if v_action not in ('DELIVER','DELIVER_WITH_QUALITY_INCIDENT') then\n    v_action := case\n      when coalesce(p_manifest_payload #>> '{qualityState,confidence}', '') = 'verified_publication_with_quality_incident'\n        then 'DELIVER_WITH_QUALITY_INCIDENT'\n      else 'DELIVER'\n    end;\n  end if;\n`,
    'canonical delivery action resolution',
  );

  const oldStorageLockdown = `-- Remove direct authenticated/public generated-report read policies while preserving\n-- unrelated Storage policies. Service-role governed download remains available.\ndo $$\ndeclare\n  v_policy record;\nbegin\n  for v_policy in\n    select policyname\n    from pg_policies\n    where schemaname = 'storage'\n      and tablename = 'objects'\n      and cmd in ('SELECT','ALL')\n      and (\n        roles::text ilike '%authenticated%' or\n        roles::text ilike '%public%'\n      )\n      and coalesce(qual, '') ilike '%generated_reports%'\n  loop\n    execute format('drop policy if exists %I on storage.objects', v_policy.policyname);\n  end loop;\nend $$;\n`;

  const newStorageLockdown = `-- Remove direct authenticated generated-report policies while preserving unrelated\n-- Storage policies, then add restrictive bucket guards. Signed downloads are created only\n-- by the service-role customer endpoint after publication lineage is proven.\ndo $$\ndeclare\n  v_policy record;\nbegin\n  for v_policy in\n    select policyname\n    from pg_policies\n    where schemaname = 'storage'\n      and tablename = 'objects'\n      and cmd in ('SELECT','INSERT','UPDATE','DELETE','ALL')\n      and roles::text ilike '%authenticated%'\n      and (\n        coalesce(qual, '') ilike '%generated_reports%' or\n        coalesce(with_check, '') ilike '%generated_reports%'\n      )\n  loop\n    execute format('drop policy if exists %I on storage.objects', v_policy.policyname);\n  end loop;\nend $$;\n\ndrop policy if exists generated_reports_authenticated_select_denied on storage.objects;\ncreate policy generated_reports_authenticated_select_denied\non storage.objects as restrictive\nfor select to authenticated\nusing (bucket_id <> 'generated_reports');\n\ndrop policy if exists generated_reports_authenticated_insert_denied on storage.objects;\ncreate policy generated_reports_authenticated_insert_denied\non storage.objects as restrictive\nfor insert to authenticated\nwith check (bucket_id <> 'generated_reports');\n\ndrop policy if exists generated_reports_authenticated_update_denied on storage.objects;\ncreate policy generated_reports_authenticated_update_denied\non storage.objects as restrictive\nfor update to authenticated\nusing (bucket_id <> 'generated_reports')\nwith check (bucket_id <> 'generated_reports');\n\ndrop policy if exists generated_reports_authenticated_delete_denied on storage.objects;\ncreate policy generated_reports_authenticated_delete_denied\non storage.objects as restrictive\nfor delete to authenticated\nusing (bucket_id <> 'generated_reports');\n`;

  text = replaceExact(text, oldStorageLockdown, newStorageLockdown, 'generated_reports direct-access lockdown');
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 2. Revision authority consumes governed publication_state, with legacy status fallback only.
// -----------------------------------------------------------------------------
{
  const relativePath = 'src/lib/reportRevisionAuthority.js';
  let text = read(relativePath);

  text = replaceExact(
    text,
    `function normalizeRevisionText(value) {\n  return String(value ?? "").trim().toLowerCase();\n}\n`,
    `function normalizeRevisionText(value) {\n  return String(value ?? "").trim().toLowerCase();\n}\n\nfunction normalizeReportPublicationState(row = {}) {\n  const governedState = normalizeRevisionText(row?.publication_state);\n  if (governedState) return governedState;\n  return normalizeRevisionText(row?.status);\n}\n\nfunction hasPublishedReportLineage(row = {}) {\n  return ["published", "historical_published"].includes(normalizeReportPublicationState(row));\n}\n`,
    'publication-state normalizer',
  );

  text = replaceExact(
    text,
    `export function isCurrentPublishedReportRevision(row = {}) {\n  return String(row?.status ?? "") === "published" && row?.is_current_revision === true;\n}\n`,
    `export function isCurrentPublishedReportRevision(row = {}) {\n  return normalizeReportPublicationState(row) === "published" && row?.is_current_revision === true;\n}\n`,
    'current published revision authority',
  );

  text = replaceExact(
    text,
    `  const leftPublished = String(left?.status ?? "") === "published" ? 1 : 0;\n  const rightPublished = String(right?.status ?? "") === "published" ? 1 : 0;\n`,
    `  const leftPublished = hasPublishedReportLineage(left) ? 1 : 0;\n  const rightPublished = hasPublishedReportLineage(right) ? 1 : 0;\n`,
    'revision sort publication authority',
  );

  text = replaceExact(
    text,
    `  return revisions.find(isCurrentPublishedReportRevision) || revisions.find((row) => String(row?.status ?? "") === "published") || null;\n`,
    `  return revisions.find(isCurrentPublishedReportRevision) || revisions.find(hasPublishedReportLineage) || null;\n`,
    'current revision fallback',
  );

  text = replaceExact(
    text,
    `  const isPublished = String(row?.status ?? "") === "published";\n  const isCurrent = Boolean(row?.is_current_revision) && isPublished;\n`,
    `  const publicationState = normalizeReportPublicationState(row);\n  const isPublished = hasPublishedReportLineage(row);\n  const isCurrent = Boolean(row?.is_current_revision) && publicationState === "published";\n`,
    'revision display publication state',
  );

  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 3. Customer report surface consumes publication_state, never reports.status.
// -----------------------------------------------------------------------------
{
  const relativePath = 'src/lib/reportSurfaceState.js';
  let text = read(relativePath);
  text = replaceExact(
    text,
    `  const normalizedReportStatus = normalizeStatus(report?.status);\n`,
    `  const normalizedReportStatus = normalizeStatus(report?.publication_state);\n  const reportHasPublishedLineage = ["published", "historical_published"].includes(normalizedReportStatus);\n`,
    'report surface publication state',
  );
  text = replaceExact(
    text,
    `  if (revisionState?.isHistoricalPublished && normalizedReportStatus === "published") return "published_historical_revision";\n`,
    `  if (revisionState?.isHistoricalPublished && reportHasPublishedLineage) return "published_historical_revision";\n`,
    'historical report surface state',
  );
  text = replaceExact(
    text,
    `  if (normalizedReportStatus === "published") return "superseded_revision";\n`,
    `  if (reportHasPublishedLineage) return "superseded_revision";\n`,
    'superseded report surface state',
  );
  text = replaceExact(
    text,
    `    jobStatus: job?.status || report?.status || "",\n`,
    `    jobStatus: job?.status || report?.publication_state || "",\n`,
    'report surface fallback state',
  );
  if (text.includes('report?.status')) fail('reportSurfaceState still depends on reports.status.');
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 4. Browser-side reports table is a governed API projection, not direct PostgREST.
// -----------------------------------------------------------------------------
{
  const relativePath = 'src/lib/customerBoundarySupabase.js';
  let text = read(relativePath);
  const replacement = `class CustomerReportQueryBuilder {\n  constructor(baseSupabase) {\n    this.baseSupabase = baseSupabase;\n    this.limitValue = 25;\n    this.invalidFilter = false;\n  }\n  select() { return this; }\n  eq(column) {\n    if (column !== 'user_id' && column !== 'publication_state') this.invalidFilter = true;\n    return this;\n  }\n  order() { return this; }\n  limit(value) {\n    const parsed = Number(value);\n    this.limitValue = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : 25;\n    return this;\n  }\n  async execute({ maybeSingle = false } = {}) {\n    if (this.invalidFilter) {\n      return { data: maybeSingle ? null : [], error: { message: 'Unsupported governed report filter', code: 'INVALID_REPORT_FILTER' } };\n    }\n    const { data, error } = await requestJson(\n      this.baseSupabase,\n      \`/api/customer-reports?limit=\${this.limitValue}\`,\n      { method: 'GET' },\n    );\n    if (error) return { data: null, error };\n    const rows = Array.isArray(data?.rows) ? data.rows : [];\n    if (maybeSingle) return { data: rows[0] || null, error: null };\n    return { data: rows, count: rows.length, error: null };\n  }\n  maybeSingle() { return this.execute({ maybeSingle: true }); }\n  then(resolve, reject) { return this.execute().then(resolve, reject); }\n}\n\nfunction wrapReportsTable(baseSupabase) {\n  return {\n    select: () => new CustomerReportQueryBuilder(baseSupabase),\n    delete: () => new CustomerReportDeleteBuilder(baseSupabase),\n  };\n}\n\nfunction wrapStagedUploadBucket`;
  text = replaceRegexOnce(
    text,
    /function wrapReportsTable\(baseSupabase\) \{[\s\S]*?\n\}\n\nfunction wrapStagedUploadBucket/,
    replacement,
    'customer report API boundary',
  );
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 5. Dashboard customer report inventory comes only from governed projection.
// -----------------------------------------------------------------------------
{
  const relativePath = 'src/pages/Dashboard.jsx';
  let text = read(relativePath);
  const replacement = `  const fetchReports = useCallback(async () => {\n    if (!profile?.id) return;\n    try {\n      setReportsLoading(true);\n      const accessToken = session?.access_token || '';\n      if (!accessToken) throw new Error('Session expired');\n      const response = await fetch('/api/customer-reports?limit=25', {\n        method: 'GET',\n        headers: { Authorization: \`Bearer \${accessToken}\` },\n      });\n      const payload = await response.json().catch(() => ({}));\n      if (!response.ok) throw new Error(payload?.error || 'Report lookup failed');\n      const rows = sortReportRevisions(Array.isArray(payload?.rows) ? payload.rows : []);\n      setReports((prev) => {\n        const serialize = (items) => items.map((report) => \`\${report.id}|\${report.property_name || ''}|\${report.report_type || ''}|\${report.created_at || ''}|\${report.storage_path || ''}|\${report.publication_state || ''}|\${report.publication_receipt_id || ''}|\${report.revision_kind || ''}|\${report.revision_number || ''}|\${report.revision_family_key || ''}|\${report.revision_request_key || ''}|\${report.is_current_revision ? '1' : '0'}\`).join('||');\n        return serialize(prev) === serialize(rows) ? prev : rows;\n      });\n    } catch (err) {\n      console.error('Error fetching governed reports:', err?.message || err);\n    } finally {\n      setReportsLoading(false);\n    }\n  }, [profile?.id, session?.access_token]);`;
  text = replaceRegexOnce(
    text,
    /  const fetchReports = useCallback\(async \(\) => \{[\s\S]*?\n  \}, \[profile\?\.id\]\);/,
    replacement,
    'Dashboard governed fetchReports',
  );
  text = text.replace(
    `report.status || (isCurrentRevision ? 'published' : 'historical')`,
    `report.publication_state || (isCurrentRevision ? 'published' : 'historical_published')`,
  );
  if (text.includes('storage_path, status, revision_kind')) fail('Dashboard still selects reports.status.');
  if (text.includes('report.status')) fail('Dashboard still reads report.status.');
  if (!text.includes('/api/customer-reports')) fail('Dashboard governed report endpoint missing.');
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 6. Admin report inventory and counts come from service-owned projection.
// -----------------------------------------------------------------------------
{
  const relativePath = 'src/pages/AdminDashboard.jsx';
  let text = read(relativePath);
  const fetchReplacement = `  // REPORTS\n  const fetchReports = useCallback(async (page = 0, search = '', filter = 'all') => {\n    setRptLoading(true);\n    try {\n      if (!adminRunKey.trim()) {\n        setReports([]);\n        setRptTotal(0);\n        return;\n      }\n      const params = new URLSearchParams({\n        limit: String(PAGE_SIZE),\n        offset: String(page * PAGE_SIZE),\n      });\n      if (search.trim()) params.set('search', search.trim());\n      if (filter !== 'all') params.set('report_type', filter);\n      const response = await fetch(\`/api/admin/report-projection?\${params.toString()}\`, {\n        method: 'GET',\n        headers: { Authorization: \`Bearer \${adminRunKey.trim()}\` },\n      });\n      const payload = await response.json().catch(() => ({}));\n      if (!response.ok) throw new Error(payload?.error || 'Failed to load reports');\n      setReports(sortReportRevisions(Array.isArray(payload?.rows) ? payload.rows : []));\n      setRptTotal(Number(payload?.count || 0));\n    } catch (e) {\n      toast({ title:'Failed to load reports', variant:'destructive' });\n    } finally { setRptLoading(false); }\n  }, [adminRunKey, toast]);`;
  text = replaceRegexOnce(
    text,
    /  \/\/ REPORTS\n  const fetchReports = useCallback\(async \(page = 0, search = '', filter = 'all'\) => \{[\s\S]*?\n  \}, \[toast\]\);/,
    fetchReplacement,
    'Admin governed fetchReports',
  );

  const oldToday = `      // Reports today\n      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);\n      const { count: rptToday } = await supabase\n        .from('reports').select('id', { count:'exact', head:true })\n        .gte('created_at', startOfDay.toISOString());\n`;
  const newToday = `      // Reports today from the governed admin projection.\n      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);\n      let rptToday = 0;\n      if (adminRunKey.trim()) {\n        const reportStatsResponse = await fetch(\`/api/admin/report-projection?limit=1&offset=0&include_today_count=true&start_of_day=\${encodeURIComponent(startOfDay.toISOString())}\`, {\n          method: 'GET',\n          headers: { Authorization: \`Bearer \${adminRunKey.trim()}\` },\n        });\n        const reportStatsPayload = await reportStatsResponse.json().catch(() => ({}));\n        if (reportStatsResponse.ok) rptToday = Number(reportStatsPayload?.today_count || 0);\n      }\n`;
  text = replaceExact(text, oldToday, newToday, 'Admin governed reports-today count');
  text = replaceExact(text, `  }, []);\n\n  // REPORTS`, `  }, [adminRunKey]);\n\n  // REPORTS`, 'Admin stats callback dependency');
  text = text.replace(
    `r.status || (revisionState.isCurrent ? 'published' : 'historical')`,
    `r.publication_state || (revisionState.isCurrent ? 'published' : 'historical_published')`,
  );
  text = text.replace('report_type, status, revision state', 'report type plus governed publication and revision state');
  if (text.includes('report_type, status, revision_kind')) fail('AdminDashboard still selects reports.status.');
  if (text.includes('r.status ||')) fail('AdminDashboard still renders report-row status.');
  if (!text.includes('/api/admin/report-projection')) fail('Admin report projection endpoint missing.');
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 7. Compatibility download handler is projection-faithful too.
// -----------------------------------------------------------------------------
{
  const relativePath = 'api/_lib/customer-boundary-handler.js';
  let text = read(relativePath);
  const replacement = `async function handleCustomerReportDownload({ req, res, auth, supabase }) {\n  if (req.method !== 'POST') {\n    res.setHeader('Allow', 'POST');\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n\n  const storagePath = String(req.body?.storage_path || req.body?.storagePath || '').trim();\n  if (!storagePath) return res.status(400).json({ error: 'STORAGE_PATH_REQUIRED' });\n\n  const { data: report, error: reportError } = await supabase\n    .from('customer_published_report_projection')\n    .select('id, user_id, storage_path, publication_receipt_id, publication_job_id, publication_state')\n    .eq('user_id', auth.actor.id)\n    .eq('storage_path', storagePath)\n    .eq('publication_state', 'published')\n    .maybeSingle();\n  if (reportError) return res.status(500).json({ error: 'DOWNLOAD_REPORT_LOOKUP_FAILED' });\n  if (!report) return res.status(404).json({ error: 'CURRENT_REPORT_NOT_FOUND' });\n\n  const { data, error } = await supabase.storage.from('generated_reports').createSignedUrl(storagePath, 300);\n  if (error || !data?.signedUrl) return res.status(409).json({ error: 'DOWNLOAD_ARTIFACT_UNAVAILABLE' });\n\n  return res.status(200).json({\n    success: true,\n    signedUrl: data.signedUrl,\n    expiresIn: 300,\n    report_id: report.id,\n    publication_receipt_id: report.publication_receipt_id,\n    publication_job_id: report.publication_job_id,\n  });\n}\n\nexport async function handleCustomerBoundaryRoute`;
  text = replaceRegexOnce(
    text,
    /async function handleCustomerReportDownload\(\{ req, res, auth, supabase \}\) \{[\s\S]*?\n\}\n\nexport async function handleCustomerBoundaryRoute/,
    replacement,
    'compatibility governed download',
  );
  if (text.includes(`.select('id, user_id, status, storage_path`)) fail('Compatibility download still selects reports.status.');
  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 8. Artifact creation compensation: fresh object + fresh row are cleaned as one unit.
// -----------------------------------------------------------------------------
{
  const relativePath = 'api/_lib/report-delivery-output.js';
  let text = read(relativePath);

  const oldCleanup = `  const cleanupCreatedReportRecord = async (logContext) => {\n    if (!createdReportRecord || !reportId) return;\n    try {\n      await supabaseAdmin.from("reports").delete().eq("id", reportId);\n    } catch (cleanupErr) {\n      console.error(\`Failed to cleanup report record after \${logContext}:\`, cleanupErr);\n    }\n  };\n`;
  const newCleanup = `  const cleanupCreatedReportRecord = async (logContext) => {\n    if (!createdReportRecord || !reportId) return { removed: false, skipped: true, error: null };\n    try {\n      const { error: cleanupError } = await supabaseAdmin.from("reports").delete().eq("id", reportId);\n      if (cleanupError) {\n        console.error(\`Failed to cleanup report record after \${logContext}:\`, cleanupError);\n        return { removed: false, skipped: false, error: cleanupError };\n      }\n      return { removed: true, skipped: false, error: null };\n    } catch (cleanupErr) {\n      console.error(\`Failed to cleanup report record after \${logContext}:\`, cleanupErr);\n      return { removed: false, skipped: false, error: cleanupErr };\n    }\n  };\n`;
  text = replaceExact(text, oldCleanup, newCleanup, 'report-row cleanup result authority');

  const oldUploadFailure = `  if (uploadError) {\n    if (createdReportRecord && reportId) {\n      try {\n        await supabaseAdmin.from("reports").delete().eq("id", reportId);\n      } catch (cleanupErr) {\n        console.error("Failed to cleanup report record after storage upload failure:", cleanupErr);\n      }\n    }\n    const err = new Error(\`Failed to upload report to storage: \${uploadError.message}\`);\n`;
  const newUploadFailure = `  if (uploadError) {\n    const reportCleanup = await cleanupCreatedReportRecord("storage upload failure");\n    const err = new Error(\`Failed to upload report to storage: \${uploadError.message}\`);\n`;
  text = replaceExact(text, oldUploadFailure, newUploadFailure, 'upload-failure report compensation');
  text = replaceExact(
    text,
    `      createdReportRecord: Boolean(createdReportRecord),\n    };\n    if (resolvedCorePublishable === true) {\n      return buildRecoverableArtifactResult({\n        publicationRetryReason: "storage_upload_failed",`,
    `      createdReportRecord: Boolean(createdReportRecord),\n      reportCleanup,\n    };\n    if (resolvedCorePublishable === true) {\n      return buildRecoverableArtifactResult({\n        publicationRetryReason: "storage_upload_failed",`,
    'upload-failure cleanup receipt',
  );

  const oldVerifyFailure = `  const verifyResult = await storageBucket.download(normalizedStoragePath);\n  if (verifyResult?.error || !verifyResult?.data) {\n    if (createdReportRecord && reportId) {\n      try {\n        await supabaseAdmin.from("reports").delete().eq("id", reportId);\n      } catch (cleanupErr) {\n        console.error("Failed to cleanup report record after storage verification failure:", cleanupErr);\n      }\n    }\n    const err = new Error("Failed to verify report download artifact");\n`;
  const newVerifyFailure = `  const verifyResult = await storageBucket.download(normalizedStoragePath);\n  if (verifyResult?.error || !verifyResult?.data) {\n    let storageCleanup = { removed: false, error: null };\n    try {\n      const { error: storageCleanupError } = await storageBucket.remove([normalizedStoragePath]);\n      storageCleanup = { removed: !storageCleanupError, error: storageCleanupError || null };\n      if (storageCleanupError) {\n        console.error("Failed to cleanup fresh report object after storage verification failure:", storageCleanupError);\n      }\n    } catch (storageCleanupErr) {\n      storageCleanup = { removed: false, error: storageCleanupErr };\n      console.error("Failed to cleanup fresh report object after storage verification failure:", storageCleanupErr);\n    }\n\n    const reportCleanup = storageCleanup.removed\n      ? await cleanupCreatedReportRecord("storage verification failure")\n      : { removed: false, skipped: true, retainedToPreserveObjectReference: true, error: null };\n\n    const err = new Error("Failed to verify report download artifact");\n`;
  text = replaceExact(text, oldVerifyFailure, newVerifyFailure, 'verification-failure object compensation');
  text = replaceExact(
    text,
    `      createdReportRecord: Boolean(createdReportRecord),\n    };\n    if (resolvedCorePublishable === true) {\n      return buildRecoverableArtifactResult({\n        publicationRetryReason: "storage_verification_failed",`,
    `      createdReportRecord: Boolean(createdReportRecord),\n      storageCleanup: { removed: storageCleanup.removed, error: storageCleanup.error?.message || null },\n      reportCleanup: {\n        removed: reportCleanup.removed === true,\n        skipped: reportCleanup.skipped === true,\n        retainedToPreserveObjectReference: reportCleanup.retainedToPreserveObjectReference === true,\n        error: reportCleanup.error?.message || null,\n      },\n    };\n    if (resolvedCorePublishable === true) {\n      return buildRecoverableArtifactResult({\n        publicationRetryReason: "storage_verification_failed",`,
    'verification-failure cleanup receipt',
  );

  write(relativePath, text);
}

// -----------------------------------------------------------------------------
// 9. Worker publication: one finalizer transaction, no post-publish promotion repair.
// -----------------------------------------------------------------------------
{
  const relativePath = 'api/admin-run-worker.js';
  let text = read(relativePath);
  text = replaceExact(text, `  promoteReportRevisionToCurrent,\n`, '', 'obsolete revision promotion import');

  const preserveReplacement = `    const preserveVerifiedPublicationAfterLateWorkerError = async (job, checkpoint, err) => {\n      if (\n        checkpoint?.verifiedDownloadArtifact !== true ||\n        !pdfBossAllowsCustomerDelivery(checkpoint?.publicationQualityBoss) ||\n        !checkpoint?.reportId ||\n        !checkpoint?.storagePath\n      ) {\n        return { preserved: false };\n      }\n\n      const { data: governedPublishedReport, error: governedLookupError } = await supabaseAdmin\n        .from('customer_published_report_projection')\n        .select('id, publication_job_id, publication_receipt_id, storage_path, publication_state')\n        .eq('id', checkpoint.reportId)\n        .eq('user_id', job.user_id)\n        .eq('publication_job_id', job.id)\n        .eq('storage_path', checkpoint.storagePath)\n        .eq('publication_state', 'published')\n        .maybeSingle();\n\n      if (governedLookupError || !governedPublishedReport?.id) {\n        return { preserved: false };\n      }\n\n      const preservationEventErr = await writeWorkerEventArtifact(\n        job.id,\n        job.user_id,\n        'atomic_publication_preserved_after_late_worker_error',\n        {\n          code: 'POST_ATOMIC_PUBLICATION_WORKER_ERROR',\n          report_id: checkpoint.reportId,\n          storage_path: checkpoint.storagePath,\n          publication_receipt_id: governedPublishedReport.publication_receipt_id || null,\n          internal_error: String(err?.stack || err?.message || err || ''),\n          timestamp: nowIso,\n        }\n      );\n      if (preservationEventErr) {\n        console.error(\n          \`[worker] Failed to write atomic-publication preservation event for job \${job.id}:\`,\n          preservationEventErr.message\n        );\n      }\n\n      return {\n        preserved: true,\n        jobStatusUpdated: false,\n        creditReconciliationRequired: false,\n      };\n    };\n\n    const controlledAction`;
  text = replaceRegexOnce(
    text,
    /    const preserveVerifiedPublicationAfterLateWorkerError = async \(job, checkpoint, err\) => \{[\s\S]*?\n    \};\n\n    const controlledAction/,
    preserveReplacement,
    'late worker error publication preservation',
  );

  const atomicReplacement = `          let reportQualityManifest = null;\n          let manifestArtifactPath = null;\n          try {\n            const publicationQualityBoss =\n              artifactResolution?.publicationQualityBoss ||\n              reportData?.final_pdf_publication_quality_boss ||\n              null;\n            reportQualityManifest = finalizeReportQualityManifest({\n              candidate: manifestCandidate,\n              reportId,\n              storagePath,\n              deliveryDecision: resolvedDeliveryDecision.deliveryDecisionState,\n              finalPdfPublicationQualityBoss: publicationQualityBoss,\n              publicationState: 'published',\n              creditState: {\n                state: creditResult.error ? 'secondary_reconciliation_required' : 'reconciled',\n                consumed: creditResult.ok === true,\n                previouslyConsumedOrPrepaid: creditResult.skipped === true,\n                compensated: creditResult.compensated === true,\n                reconciliationRequired: creditResult.reconciliationRequired === true,\n                error: creditResult.error?.message || null,\n              },\n              remedyState: { state: 'not_required' },\n              finalizedAt: nowIso,\n            });\n            manifestArtifactPath = \`analysis_jobs/\${job.id}/report_quality_manifest/\${safeTimestamp(\n              nowIso\n            )}.json\`;\n          } catch (manifestErr) {\n            console.error(\n              \`[worker] Report Quality Manifest blocked publication finalization for job \${job.id}:\`,\n              manifestErr?.context || manifestErr?.message || manifestErr\n            );\n            const manifestFailureEventErr = await writeWorkerEventArtifact(\n              job.id,\n              job.user_id,\n              'report_quality_manifest_finalize_failed',\n              {\n                code: 'REPORT_QUALITY_MANIFEST_FINALIZE_FAILED',\n                internal_only: true,\n                customer_delivery_unchanged: true,\n                publication_state: 'recovery_required',\n                report_id: reportId,\n                storage_path: storagePath,\n                error: String(manifestErr?.message || manifestErr || ''),\n                validation: manifestErr?.context?.validation || null,\n                timestamp: nowIso,\n              }\n            );\n            if (manifestFailureEventErr) {\n              console.error(\n                \`[worker] Failed to write Report Quality Manifest recovery event for job \${job.id}:\`,\n                manifestFailureEventErr.message\n              );\n            }\n            const queuedUpdate = await requeuePublicationCommitFailure(\n              job,\n              'report_quality_manifest_finalize_failed',\n              {\n                report_id: reportId,\n                storage_path: storagePath,\n                error: String(manifestErr?.message || manifestErr || ''),\n              }\n            );\n            if (queuedUpdate?.id) {\n              transitions.push({\n                job_id: job.id,\n                from_status: 'publishing',\n                to_status: 'queued',\n              });\n              passTransitions += 1;\n              deferredJobIds.add(job.id);\n            }\n            continue;\n          }\n\n          const { data: atomicPublishedRows, error: atomicPublicationErr } = await supabaseAdmin.rpc(\n            'finalize_worker_publication_v2',\n            {\n              p_job_id: job.id,\n              p_worker_attempt_id: job.worker_attempt_id || null,\n              p_expected_current_status: 'publishing',\n              p_claimed_by: workerInvocationId,\n              p_manifest_payload: reportQualityManifest,\n              p_manifest_object_path: manifestArtifactPath,\n            }\n          );\n          if (atomicPublicationErr) {\n            const publicationError = new Error(\n              \`Atomic publication commit failed: \${atomicPublicationErr.message}\`\n            );\n            publicationError.code = 'PUBLICATION_ATOMIC_COMMIT_FAILED';\n            throw publicationError;\n          }\n\n          const publishedUpdate = Array.isArray(atomicPublishedRows)\n            ? atomicPublishedRows[0]\n            : atomicPublishedRows;\n          if (!publishedUpdate?.id || String(publishedUpdate.status || '') !== 'published') {\n            throw new Error('Atomic publication commit did not return a published job');\n          }\n\n          if (verifiedPublicationCheckpoint) {\n            verifiedPublicationCheckpoint = Object.freeze({\n              ...verifiedPublicationCheckpoint,\n              publicationCommitReady: true,\n              creditReconciliationAttempted: true,\n            });\n          }\n\n          if (supportsCompletedAt) {\n            const { error: completedErr } = await supabaseAdmin\n              .from('analysis_jobs')\n              .update({ completed_at: nowIso })\n              .eq('id', job.id)\n              .eq('status', 'published');\n\n            if (completedErr) {\n              throw new Error(\`Failed to record publication completion timestamp: \${completedErr.message}\`);\n            }\n          }\n\n          transitions.push({\n            job_id: job.id,\n            from_status: 'publishing',\n            to_status: 'published',\n          });\n          passTransitions += 1;\n          const completedTransitionErr = await writeStatusTransitionArtifact(\n            job.id,\n            'publishing',\n            'published',\n            { user_id: job.user_id, report_id: reportId, publication_authority: 'atomic_v2' }\n          );\n\n          if (completedTransitionErr) {\n            throw new Error(\`Failed to write status transition artifact: \${completedTransitionErr.message}\`);\n          }\n\n          const { data: publishedEmail }`;

  text = replaceRegexOnce(
    text,
    /          try \{\n            const publicationQualityBoss =[\s\S]*?\n          const \{ data: publishedEmail \}/,
    atomicReplacement,
    'atomic worker publication commit',
  );

  if (text.includes('promoteReportRevisionToCurrent')) fail('Worker still imports or invokes post-publication promotion.');
  if (text.includes(`transitionWorkerJob(job, 'publishing', 'published'`)) fail('Worker still performs generic publish transition.');
  if (!text.includes('finalize_worker_publication_v2')) fail('Atomic v2 publication RPC missing from worker.');
  write(relativePath, text);
}

const changed = git('status', '--porcelain=v1', '--untracked-files=all')
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((line) => !/CHAT_HANDOFF[\\/]/.test(line));

console.log('Phase 2 guarded patch applied.');
console.log(changed.join('\n'));
