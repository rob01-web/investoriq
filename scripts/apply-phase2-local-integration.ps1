$ErrorActionPreference = "Stop"

$repo = "C:\Users\robmc\Desktop\InvestorIQ\InvestorIQ-Empire-v1"
$branch = "internal-phase2-atomic-publication-20260830"
$expectedMain = "b69d8dd3911449b82c94770d51f22302e47adcd9"

Set-Location $repo

Write-Host ""
Write-Host "=== INVESTORIQ PHASE 2 GUARDED LOCAL INTEGRATION ===" -ForegroundColor Cyan

if ((git branch --show-current).Trim() -cne $branch) {
    throw "STOP: Wrong branch. Expected $branch"
}

$currentHead = (git rev-parse HEAD).Trim()
$remoteHead = (git rev-parse "refs/remotes/origin/$branch").Trim()
if ($currentHead -cne $remoteHead) {
    throw "STOP: Local Phase 2 branch is not at the fetched remote checkpoint."
}

$productDirty = @(
    git status --porcelain=v1 --untracked-files=all |
        Where-Object { $_ -notmatch 'CHAT_HANDOFF[\\/]' }
)
if ($productDirty.Count -gt 0) {
    Write-Host "STOP: Non-CHAT_HANDOFF changes already exist:" -ForegroundColor Red
    $productDirty
    throw "No Phase 2 integration changes were made."
}

function Assert-BlobHash([string]$Path, [string]$Expected) {
    $actual = (git hash-object -- $Path).Trim()
    if ($actual -cne $Expected) {
        throw "STOP: $Path changed unexpectedly. Expected blob $Expected but found $actual"
    }
}

function Read-Utf8([string]$Path) {
    return [IO.File]::ReadAllText((Join-Path $repo $Path))
}

function Write-Utf8([string]$Path, [string]$Text) {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText((Join-Path $repo $Path), $Text, $utf8NoBom)
}

function Replace-Exact([string]$Text, [string]$Old, [string]$New, [string]$Label) {
    if (-not $Text.Contains($Old)) {
        throw "STOP: Expected Phase 2 source fragment not found: $Label"
    }
    return $Text.Replace($Old, $New)
}

function Replace-RegexOnce([string]$Text, [string]$Pattern, [string]$Replacement, [string]$Label) {
    $matches = [regex]::Matches($Text, $Pattern, [Text.RegularExpressions.RegexOptions]::Singleline)
    if ($matches.Count -ne 1) {
        throw "STOP: Expected exactly one regex match for $Label but found $($matches.Count)."
    }
    return [regex]::Replace(
        $Text,
        $Pattern,
        $Replacement,
        [Text.RegularExpressions.RegexOptions]::Singleline
    )
}

# Exact branch-source guards before touching large files.
Assert-BlobHash "src/pages/Dashboard.jsx" "53567f1a0d2bd91dd0c235a314a1666bc0fbfff6"
Assert-BlobHash "src/pages/AdminDashboard.jsx" "9b4bd24561ca3d74fb1d7cdb59703c075de65cf9"
Assert-BlobHash "api/admin-run-worker.js" "cb42b31690f219da2ae2f9589ae0750838221de8"
Assert-BlobHash "src/lib/reportSurfaceState.js" "4cffc34598b89f666eae1df819615c64871ad5db"
Assert-BlobHash "src/lib/customerBoundarySupabase.js" "b3529fd7c0711b85c9e1e92ee01335267229c398"
Assert-BlobHash "api/_lib/customer-boundary-handler.js" "3f6aa36eb00f8e5d92ee255f1873c3af096977c9"
Assert-BlobHash "supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql" "fc18a70368c3a97da9b5d2cd1071cc9268201a1f"

# -----------------------------------------------------------------------------
# 1. Correct the final manifest shape in the forward migration.
# -----------------------------------------------------------------------------
$migrationPath = "supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql"
$migration = Read-Utf8 $migrationPath
$migration = Replace-Exact $migration @'
  if coalesce(p_manifest_payload->>'publicationState', p_manifest_payload->>'publication_state', '') <> 'published' then
    raise exception 'PUBLICATION_FINAL_MANIFEST_STATE_INVALID';
  end if;
'@ @'
  if coalesce(p_manifest_payload #>> '{publication,state}', '') <> 'published' then
    raise exception 'PUBLICATION_FINAL_MANIFEST_STATE_INVALID';
  end if;
  if coalesce(p_manifest_payload #>> '{publication,storagePath}', '') <> v_report.storage_path then
    raise exception 'PUBLICATION_FINAL_MANIFEST_STORAGE_MISMATCH';
  end if;
'@ "nested final manifest publication shape"

$migration = Replace-Exact $migration @'
  v_action := case
    when lower(coalesce(v_decision->>'delivery_gate_status','')) like '%quality%'
      or lower(coalesce(p_manifest_payload->>'publication_state', p_manifest_payload->>'publicationState', '')) like '%quality%'
      then 'DELIVER_WITH_QUALITY_INCIDENT'
    else 'DELIVER'
  end;
'@ @'
  v_action := upper(coalesce(v_decision->>'canonical_delivery_action',''));
  if v_action not in ('DELIVER','DELIVER_WITH_QUALITY_INCIDENT') then
    v_action := case
      when coalesce(p_manifest_payload #>> '{qualityState,confidence}', '') = 'verified_publication_with_quality_incident'
        then 'DELIVER_WITH_QUALITY_INCIDENT'
      else 'DELIVER'
    end;
  end if;
'@ "canonical delivery action resolution"
Write-Utf8 $migrationPath $migration

# -----------------------------------------------------------------------------
# 2. Route all browser report reads through the governed server projection.
# -----------------------------------------------------------------------------
$boundaryPath = "src/lib/customerBoundarySupabase.js"
$boundary = Read-Utf8 $boundaryPath
$boundaryReplacement = @'
class CustomerReportQueryBuilder {
  constructor(baseSupabase) {
    this.baseSupabase = baseSupabase;
    this.limitValue = 25;
    this.invalidFilter = false;
  }
  select() { return this; }
  eq(column) {
    if (column !== 'user_id' && column !== 'publication_state') this.invalidFilter = true;
    return this;
  }
  order() { return this; }
  limit(value) {
    const parsed = Number(value);
    this.limitValue = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : 25;
    return this;
  }
  async execute({ maybeSingle = false } = {}) {
    if (this.invalidFilter) {
      return { data: maybeSingle ? null : [], error: { message: 'Unsupported governed report filter', code: 'INVALID_REPORT_FILTER' } };
    }
    const { data, error } = await requestJson(
      this.baseSupabase,
      `/api/customer-reports?limit=${this.limitValue}`,
      { method: 'GET' },
    );
    if (error) return { data: null, error };
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (maybeSingle) return { data: rows[0] || null, error: null };
    return { data: rows, count: rows.length, error: null };
  }
  maybeSingle() { return this.execute({ maybeSingle: true }); }
  then(resolve, reject) { return this.execute().then(resolve, reject); }
}

function wrapReportsTable(baseSupabase) {
  return {
    select: () => new CustomerReportQueryBuilder(baseSupabase),
    delete: () => new CustomerReportDeleteBuilder(baseSupabase),
  };
}

function wrapStagedUploadBucket
'@
$boundary = Replace-RegexOnce $boundary 'function wrapReportsTable\(baseSupabase\) \{[\s\S]*?\n\}\n\nfunction wrapStagedUploadBucket' $boundaryReplacement "customer report boundary"
Write-Utf8 $boundaryPath $boundary

# -----------------------------------------------------------------------------
# 3. Report surface state derives from publication_state, never reports.status.
# -----------------------------------------------------------------------------
$surfacePath = "src/lib/reportSurfaceState.js"
$surface = Read-Utf8 $surfacePath
$surface = Replace-Exact $surface '  const normalizedReportStatus = normalizeStatus(report?.status);' @'
  const normalizedReportStatus = normalizeStatus(report?.publication_state);
  const reportHasPublishedLineage = ["published", "historical_published"].includes(normalizedReportStatus);
'@ "report publication state"
$surface = Replace-Exact $surface '  if (revisionState?.isHistoricalPublished && normalizedReportStatus === "published") return "published_historical_revision";' '  if (revisionState?.isHistoricalPublished && reportHasPublishedLineage) return "published_historical_revision";' "historical publication state"
$surface = Replace-Exact $surface '  if (normalizedReportStatus === "published") return "superseded_revision";' '  if (reportHasPublishedLineage) return "superseded_revision";' "superseded publication state"
$surface = Replace-Exact $surface '    jobStatus: job?.status || report?.status || "",' '    jobStatus: job?.status || report?.publication_state || "",' "surface job/report state"
if ($surface.Contains('report?.status')) { throw "STOP: reportSurfaceState still depends on reports.status." }
Write-Utf8 $surfacePath $surface

# -----------------------------------------------------------------------------
# 4. Customer Dashboard uses the governed report endpoint.
# -----------------------------------------------------------------------------
$dashboardPath = "src/pages/Dashboard.jsx"
$dashboard = Read-Utf8 $dashboardPath
$dashboardFetchReports = @'
  const fetchReports = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setReportsLoading(true);
      const accessToken = session?.access_token || '';
      if (!accessToken) throw new Error('Session expired');
      const response = await fetch('/api/customer-reports?limit=25', {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Report lookup failed');
      const rows = sortReportRevisions(Array.isArray(payload?.rows) ? payload.rows : []);
      setReports((prev) => {
        const serialize = (items) => items.map((report) => `${report.id}|${report.property_name || ''}|${report.report_type || ''}|${report.created_at || ''}|${report.storage_path || ''}|${report.publication_state || ''}|${report.publication_receipt_id || ''}|${report.revision_kind || ''}|${report.revision_number || ''}|${report.revision_family_key || ''}|${report.revision_request_key || ''}|${report.is_current_revision ? '1' : '0'}`).join('||');
        return serialize(prev) === serialize(rows) ? prev : rows;
      });
    } catch (err) {
      console.error('Error fetching governed reports:', err?.message || err);
    } finally {
      setReportsLoading(false);
    }
  }, [profile?.id, session?.access_token]);
'@
$dashboard = Replace-RegexOnce $dashboard '  const fetchReports = useCallback\(async \(\) => \{[\s\S]*?\n  \}, \[profile\?\.id\]\);' $dashboardFetchReports "Dashboard governed fetchReports"
$dashboard = $dashboard.Replace('report.status || (isCurrentRevision ? ''published'' : ''historical'')', 'report.publication_state || (isCurrentRevision ? ''published'' : ''historical_published'')')
if ($dashboard.Contains('storage_path, status, revision_kind')) { throw "STOP: Dashboard still selects reports.status." }
if ($dashboard.Contains('report.status')) { throw "STOP: Dashboard still reads report.status." }
if (-not $dashboard.Contains('/api/customer-reports')) { throw "STOP: Dashboard governed report endpoint missing." }
Write-Utf8 $dashboardPath $dashboard

# -----------------------------------------------------------------------------
# 5. Admin report inventory uses the service-owned admin projection.
# -----------------------------------------------------------------------------
$adminPath = "src/pages/AdminDashboard.jsx"
$admin = Read-Utf8 $adminPath
$adminFetchReports = @'
  // REPORTS
  const fetchReports = useCallback(async (page = 0, search = '', filter = 'all') => {
    setRptLoading(true);
    try {
      if (!adminRunKey.trim()) {
        setReports([]);
        setRptTotal(0);
        return;
      }
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (search.trim()) params.set('search', search.trim());
      if (filter !== 'all') params.set('report_type', filter);
      const response = await fetch(`/api/admin/report-projection?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load reports');
      setReports(sortReportRevisions(Array.isArray(payload?.rows) ? payload.rows : []));
      setRptTotal(Number(payload?.count || 0));
    } catch (e) {
      toast({ title:'Failed to load reports', variant:'destructive' });
    } finally { setRptLoading(false); }
  }, [adminRunKey, toast]);
'@
$admin = Replace-RegexOnce $admin '  // REPORTS\n  const fetchReports = useCallback\(async \(page = 0, search = '''', filter = ''all''\) => \{[\s\S]*?\n  \}, \[toast\]\);' $adminFetchReports "Admin governed fetchReports"

$adminReportsTodayOld = @'
      // Reports today
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      const { count: rptToday } = await supabase
        .from('reports').select('id', { count:'exact', head:true })
        .gte('created_at', startOfDay.toISOString());
'@
$adminReportsTodayNew = @'
      // Reports today from the governed admin projection.
      const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
      let rptToday = 0;
      if (adminRunKey.trim()) {
        const reportStatsResponse = await fetch(`/api/admin/report-projection?limit=1&offset=0&include_today_count=true&start_of_day=${encodeURIComponent(startOfDay.toISOString())}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${adminRunKey.trim()}` },
        });
        const reportStatsPayload = await reportStatsResponse.json().catch(() => ({}));
        if (reportStatsResponse.ok) rptToday = Number(reportStatsPayload?.today_count || 0);
      }
'@
$admin = Replace-Exact $admin $adminReportsTodayOld $adminReportsTodayNew "Admin reports-today projection"
$admin = Replace-Exact $admin "  }, []);`n`n  // REPORTS" "  }, [adminRunKey]);`n`n  // REPORTS" "Admin stats callback dependency"
$admin = $admin.Replace("r.status || (revisionState.isCurrent ? 'published' : 'historical')", "r.publication_state || (revisionState.isCurrent ? 'published' : 'historical_published')")
$admin = $admin.Replace('report_type, status, revision state', 'report type plus governed publication and revision state')
if ($admin.Contains('report_type, status, revision_kind')) { throw "STOP: AdminDashboard still selects reports.status." }
if ($admin.Contains('r.status ||')) { throw "STOP: AdminDashboard still renders report-row status." }
if (-not $admin.Contains('/api/admin/report-projection')) { throw "STOP: Admin report projection endpoint missing." }
Write-Utf8 $adminPath $admin

# -----------------------------------------------------------------------------
# 6. Legacy customer-boundary download path is made projection-faithful too.
# -----------------------------------------------------------------------------
$handlerPath = "api/_lib/customer-boundary-handler.js"
$handler = Read-Utf8 $handlerPath
$downloadHandler = @'
async function handleCustomerReportDownload({ req, res, auth, supabase }) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const storagePath = String(req.body?.storage_path || req.body?.storagePath || '').trim();
  if (!storagePath) return res.status(400).json({ error: 'STORAGE_PATH_REQUIRED' });

  const { data: report, error: reportError } = await supabase
    .from('customer_published_report_projection')
    .select('id, user_id, storage_path, publication_receipt_id, publication_job_id, publication_state')
    .eq('user_id', auth.actor.id)
    .eq('storage_path', storagePath)
    .eq('publication_state', 'published')
    .maybeSingle();
  if (reportError) return res.status(500).json({ error: 'DOWNLOAD_REPORT_LOOKUP_FAILED' });
  if (!report) return res.status(404).json({ error: 'CURRENT_REPORT_NOT_FOUND' });

  const { data, error } = await supabase.storage.from('generated_reports').createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) return res.status(409).json({ error: 'DOWNLOAD_ARTIFACT_UNAVAILABLE' });

  return res.status(200).json({
    success: true,
    signedUrl: data.signedUrl,
    expiresIn: 300,
    report_id: report.id,
    publication_receipt_id: report.publication_receipt_id,
    publication_job_id: report.publication_job_id,
  });
}

export async function handleCustomerBoundaryRoute
'@
$handler = Replace-RegexOnce $handler 'async function handleCustomerReportDownload\(\{ req, res, auth, supabase \}\) \{[\s\S]*?\n\}\n\nexport async function handleCustomerBoundaryRoute' $downloadHandler "legacy governed download handler"
if ($handler.Contains(".select('id, user_id, status, storage_path")) { throw "STOP: Legacy customer download still selects reports.status." }
Write-Utf8 $handlerPath $handler

# -----------------------------------------------------------------------------
# 7. Worker publication becomes one atomic RPC and late errors can only preserve proof.
# -----------------------------------------------------------------------------
$workerPath = "api/admin-run-worker.js"
$worker = Read-Utf8 $workerPath
$worker = Replace-Exact $worker "  promoteReportRevisionToCurrent,`n" "" "obsolete worker revision promotion import"

$preserveReplacement = @'
    const preserveVerifiedPublicationAfterLateWorkerError = async (job, checkpoint, err) => {
      if (
        checkpoint?.verifiedDownloadArtifact !== true ||
        !pdfBossAllowsCustomerDelivery(checkpoint?.publicationQualityBoss) ||
        !checkpoint?.reportId ||
        !checkpoint?.storagePath
      ) {
        return { preserved: false };
      }

      const { data: governedPublishedReport, error: governedLookupError } = await supabaseAdmin
        .from('customer_published_report_projection')
        .select('id, publication_job_id, publication_receipt_id, storage_path, publication_state')
        .eq('id', checkpoint.reportId)
        .eq('user_id', job.user_id)
        .eq('publication_job_id', job.id)
        .eq('storage_path', checkpoint.storagePath)
        .eq('publication_state', 'published')
        .maybeSingle();

      if (governedLookupError || !governedPublishedReport?.id) {
        return { preserved: false };
      }

      const preservationEventErr = await writeWorkerEventArtifact(
        job.id,
        job.user_id,
        'atomic_publication_preserved_after_late_worker_error',
        {
          code: 'POST_ATOMIC_PUBLICATION_WORKER_ERROR',
          report_id: checkpoint.reportId,
          storage_path: checkpoint.storagePath,
          publication_receipt_id: governedPublishedReport.publication_receipt_id || null,
          internal_error: String(err?.stack || err?.message || err || ''),
          timestamp: nowIso,
        }
      );
      if (preservationEventErr) {
        console.error(
          `[worker] Failed to write atomic-publication preservation event for job ${job.id}:`,
          preservationEventErr.message
        );
      }

      return {
        preserved: true,
        jobStatusUpdated: false,
        creditReconciliationRequired: false,
      };
    };

    const controlledAction
'@
$worker = Replace-RegexOnce $worker '    const preserveVerifiedPublicationAfterLateWorkerError = async \(job, checkpoint, err\) => \{[\s\S]*?\n    \};\n\n    const controlledAction' $preserveReplacement "late-error publication preservation"

$atomicPublicationReplacement = @'
          let reportQualityManifest = null;
          let manifestArtifactPath = null;
          try {
            const publicationQualityBoss =
              artifactResolution?.publicationQualityBoss ||
              reportData?.final_pdf_publication_quality_boss ||
              null;
            reportQualityManifest = finalizeReportQualityManifest({
              candidate: manifestCandidate,
              reportId,
              storagePath,
              deliveryDecision: resolvedDeliveryDecision.deliveryDecisionState,
              finalPdfPublicationQualityBoss: publicationQualityBoss,
              publicationState: 'published',
              creditState: {
                state: creditResult.error ? 'secondary_reconciliation_required' : 'reconciled',
                consumed: creditResult.ok === true,
                previouslyConsumedOrPrepaid: creditResult.skipped === true,
                compensated: creditResult.compensated === true,
                reconciliationRequired: creditResult.reconciliationRequired === true,
                error: creditResult.error?.message || null,
              },
              remedyState: { state: 'not_required' },
              finalizedAt: nowIso,
            });
            manifestArtifactPath = `analysis_jobs/${job.id}/report_quality_manifest/${safeTimestamp(
              nowIso
            )}.json`;
          } catch (manifestErr) {
            console.error(
              `[worker] Report Quality Manifest blocked publication finalization for job ${job.id}:`,
              manifestErr?.context || manifestErr?.message || manifestErr
            );
            const manifestFailureEventErr = await writeWorkerEventArtifact(
              job.id,
              job.user_id,
              'report_quality_manifest_finalize_failed',
              {
                code: 'REPORT_QUALITY_MANIFEST_FINALIZE_FAILED',
                internal_only: true,
                customer_delivery_unchanged: true,
                publication_state: 'recovery_required',
                report_id: reportId,
                storage_path: storagePath,
                error: String(manifestErr?.message || manifestErr || ''),
                validation: manifestErr?.context?.validation || null,
                timestamp: nowIso,
              }
            );
            if (manifestFailureEventErr) {
              console.error(
                `[worker] Failed to write Report Quality Manifest recovery event for job ${job.id}:`,
                manifestFailureEventErr.message
              );
            }
            const queuedUpdate = await requeuePublicationCommitFailure(
              job,
              'report_quality_manifest_finalize_failed',
              {
                report_id: reportId,
                storage_path: storagePath,
                error: String(manifestErr?.message || manifestErr || ''),
              }
            );
            if (queuedUpdate?.id) {
              transitions.push({
                job_id: job.id,
                from_status: 'publishing',
                to_status: 'queued',
              });
              passTransitions += 1;
              deferredJobIds.add(job.id);
            }
            continue;
          }

          const { data: atomicPublishedRows, error: atomicPublicationErr } = await supabaseAdmin.rpc(
            'finalize_worker_publication_v2',
            {
              p_job_id: job.id,
              p_worker_attempt_id: job.worker_attempt_id || null,
              p_expected_current_status: 'publishing',
              p_claimed_by: workerInvocationId,
              p_manifest_payload: reportQualityManifest,
              p_manifest_object_path: manifestArtifactPath,
            }
          );
          if (atomicPublicationErr) {
            const publicationError = new Error(
              `Atomic publication commit failed: ${atomicPublicationErr.message}`
            );
            publicationError.code = 'PUBLICATION_ATOMIC_COMMIT_FAILED';
            throw publicationError;
          }

          const publishedUpdate = Array.isArray(atomicPublishedRows)
            ? atomicPublishedRows[0]
            : atomicPublishedRows;
          if (!publishedUpdate?.id || String(publishedUpdate.status || '') !== 'published') {
            throw new Error('Atomic publication commit did not return a published job');
          }

          if (verifiedPublicationCheckpoint) {
            verifiedPublicationCheckpoint = Object.freeze({
              ...verifiedPublicationCheckpoint,
              publicationCommitReady: true,
              creditReconciliationAttempted: true,
            });
          }

          if (supportsCompletedAt) {
            const { error: completedErr } = await supabaseAdmin
              .from('analysis_jobs')
              .update({ completed_at: nowIso })
              .eq('id', job.id)
              .eq('status', 'published');

            if (completedErr) {
              throw new Error(`Failed to record publication completion timestamp: ${completedErr.message}`);
            }
          }

          transitions.push({
            job_id: job.id,
            from_status: 'publishing',
            to_status: 'published',
          });
          passTransitions += 1;
          const completedTransitionErr = await writeStatusTransitionArtifact(
            job.id,
            'publishing',
            'published',
            { user_id: job.user_id, report_id: reportId, publication_authority: 'atomic_v2' }
          );

          if (completedTransitionErr) {
            throw new Error(`Failed to write status transition artifact: ${completedTransitionErr.message}`);
          }

          const { data: publishedEmail }
'@
$worker = Replace-RegexOnce $worker '          try \{\n            const publicationQualityBoss =[\s\S]*?\n          const \{ data: publishedEmail \}' $atomicPublicationReplacement "atomic worker publication commit"

if ($worker.Contains('promoteReportRevisionToCurrent')) { throw "STOP: Worker still imports or invokes post-publication promotion." }
if ($worker.Contains("transitionWorkerJob(job, 'publishing', 'published'")) { throw "STOP: Worker still performs generic published transition." }
if (-not $worker.Contains('finalize_worker_publication_v2')) { throw "STOP: Atomic v2 publication RPC missing from worker." }
Write-Utf8 $workerPath $worker

# -----------------------------------------------------------------------------
# 8. Static guards and focused certifications.
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "=== PHASE 2 STATIC CERTIFICATION ===" -ForegroundColor Cyan

node --check .\api\admin-run-worker.js
if ($LASTEXITCODE -ne 0) { throw "STOP: admin-run-worker syntax failed." }
node --check .\api\customer-reports.js
if ($LASTEXITCODE -ne 0) { throw "STOP: customer-reports syntax failed." }
node --check .\api\customer-report-download.js
if ($LASTEXITCODE -ne 0) { throw "STOP: customer-report-download syntax failed." }
node --check .\api\admin\report-projection.js
if ($LASTEXITCODE -ne 0) { throw "STOP: admin report projection syntax failed." }
node --check .\api\_lib\customer-boundary-handler.js
if ($LASTEXITCODE -ne 0) { throw "STOP: customer boundary handler syntax failed." }
node --check .\src\lib\customerBoundarySupabase.js
if ($LASTEXITCODE -ne 0) { throw "STOP: customer boundary client syntax failed." }
node --check .\src\lib\reportRevisionAuthority.js
if ($LASTEXITCODE -ne 0) { throw "STOP: report revision authority syntax failed." }
node --check .\src\lib\reportSurfaceState.js
if ($LASTEXITCODE -ne 0) { throw "STOP: report surface state syntax failed." }

git diff --check
if ($LASTEXITCODE -ne 0) { throw "STOP: git diff --check failed." }

Write-Host ""
Write-Host "=== PHASE 1 REGRESSION GUARD ===" -ForegroundColor Cyan
node .\tests\qa\phase1-admission-core-mode-contract-smoke.js
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 1 regression guard failed." }

Write-Host ""
Write-Host "=== PHASE 2 FOCUSED CONTRACT ===" -ForegroundColor Cyan
node .\tests\qa\phase2-atomic-publication-delivery-contract-smoke.js
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 focused contract failed." }

Write-Host ""
Write-Host "=== FULL LOCAL BUILD ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "STOP: Full local build failed." }

# -----------------------------------------------------------------------------
# 9. Commit only the guarded local integration files.
# -----------------------------------------------------------------------------
$allowedChanges = @(
    'api/_lib/customer-boundary-handler.js',
    'api/admin-run-worker.js',
    'src/lib/customerBoundarySupabase.js',
    'src/lib/reportSurfaceState.js',
    'src/pages/AdminDashboard.jsx',
    'src/pages/Dashboard.jsx',
    'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql'
)

$unexpectedProductChanges = @(
    git status --porcelain=v1 --untracked-files=all |
        Where-Object { $_ -notmatch 'CHAT_HANDOFF[\\/]' } |
        ForEach-Object { $_.Substring(3).Trim('"') } |
        Where-Object { $allowedChanges -notcontains $_ }
)
if ($unexpectedProductChanges.Count -gt 0) {
    Write-Host "STOP: Unexpected product files changed:" -ForegroundColor Red
    $unexpectedProductChanges
    throw "No Phase 2 integration commit was made."
}

foreach ($path in $allowedChanges) {
    git add -- $path
}

$staged = @(git diff --cached --name-only)
$missing = @($allowedChanges | Where-Object { $staged -notcontains $_ })
$extra = @($staged | Where-Object { $allowedChanges -notcontains $_ })
if ($missing.Count -gt 0 -or $extra.Count -gt 0) {
    throw "STOP: Phase 2 staging boundary mismatch. Missing=[$($missing -join ', ')] Extra=[$($extra -join ', ')]"
}

git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw "STOP: Staged Phase 2 diff failed git diff --check." }

git commit -m "Phase 2: wire atomic publication through customer surfaces"
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 integration commit failed." }

git push origin "HEAD:refs/heads/$branch"
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 branch push failed." }

# -----------------------------------------------------------------------------
# 10. Final preservation proof.
# -----------------------------------------------------------------------------
git fetch origin "refs/heads/main:refs/remotes/origin/main" | Out-Null
$mainAfter = (git rev-parse refs/remotes/origin/main).Trim()
if ($mainAfter -cne $expectedMain) {
    throw "STOP: Production main changed unexpectedly."
}

$finalHead = (git rev-parse HEAD).Trim()
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   INVESTORIQ PHASE 2 LOCAL CERT COMPLETE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Branch:       $branch"
Write-Host "Phase 2 HEAD: $finalHead"
Write-Host "Main:         $mainAfter"
Write-Host ""
Write-Host "Phase 1 regression guard: PASS" -ForegroundColor Green
Write-Host "Phase 2 focused contract:   PASS" -ForegroundColor Green
Write-Host "Full local build:           PASS" -ForegroundColor Green
Write-Host "Production main:            UNCHANGED" -ForegroundColor Green
Write-Host "Production migration:       NOT APPLIED" -ForegroundColor Green
Write-Host ""
Write-Host "FINAL WORKTREE:"
git status --short
