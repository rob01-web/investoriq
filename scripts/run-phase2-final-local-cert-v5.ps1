$ErrorActionPreference = "Stop"

$repo = "C:\Users\robmc\Desktop\InvestorIQ\InvestorIQ-Empire-v1"
$branch = "internal-phase2-atomic-publication-20260830"
$expectedMain = "b69d8dd3911449b82c94770d51f22302e47adcd9"

Set-Location $repo

Write-Host ""
Write-Host "=== INVESTORIQ PHASE 2 FINAL LOCAL CERTIFICATION V5 ===" -ForegroundColor Cyan

if ((git branch --show-current).Trim() -cne $branch) {
    throw "STOP: Wrong branch. Expected $branch"
}

$currentHead = (git rev-parse HEAD).Trim()
$remoteHead = (git rev-parse "refs/remotes/origin/$branch").Trim()
if ($currentHead -cne $remoteHead) {
    throw "STOP: Local Phase 2 branch is not at the fetched remote checkpoint."
}

$expectedDirty = @(
    'api/_lib/customer-boundary-handler.js',
    'api/_lib/report-delivery-output.js',
    'api/admin-run-worker.js',
    'src/lib/customerBoundarySupabase.js',
    'src/lib/reportSurfaceState.js',
    'src/pages/AdminDashboard.jsx',
    'src/pages/Dashboard.jsx',
    'supabase/migrations/20260830121500_phase2_atomic_publication_delivery_authority.sql',
    'tests/qa/report-quality-manifest-smoke.js',
    'tests/qa/full-underwriting-publication-atomicity-regression.js'
)

$preDirtyPaths = @(
    git status --porcelain=v1 --untracked-files=all |
        Where-Object { $_ -notmatch 'CHAT_HANDOFF[\\/]' } |
        ForEach-Object { $_.Substring(3).Trim('"') }
)
$unexpectedPre = @($preDirtyPaths | Where-Object { $expectedDirty -notcontains $_ })
$missingPre = @($expectedDirty | Where-Object { $preDirtyPaths -notcontains $_ })

if ($unexpectedPre.Count -gt 0 -or $missingPre.Count -gt 0) {
    Write-Host "STOP: V5 did not find the exact preserved V4 local state." -ForegroundColor Red
    if ($missingPre.Count -gt 0) {
        Write-Host "Missing expected modified files:" -ForegroundColor Yellow
        $missingPre
    }
    if ($unexpectedPre.Count -gt 0) {
        Write-Host "Unexpected product files:" -ForegroundColor Yellow
        $unexpectedPre
    }
    throw "No additional Phase 2 changes were made."
}

Write-Host ""
Write-Host "=== REPAIR ATOMICITY REGRESSION V2 ===" -ForegroundColor Cyan
node --check .\scripts\phase2-repair-atomicity-regression-v2.mjs
if ($LASTEXITCODE -ne 0) { throw "STOP: Atomicity V2 repair script syntax failed." }
node .\scripts\phase2-repair-atomicity-regression-v2.mjs
if ($LASTEXITCODE -ne 0) { throw "STOP: Atomicity V2 regression repair failed." }

Write-Host ""
Write-Host "=== SOURCE SYNTAX ===" -ForegroundColor Cyan
$syntaxFiles = @(
    '.\api\admin-run-worker.js',
    '.\api\customer-reports.js',
    '.\api\customer-report-download.js',
    '.\api\admin\report-projection.js',
    '.\api\_lib\customer-boundary-handler.js',
    '.\api\_lib\report-delivery-output.js',
    '.\src\lib\customerBoundarySupabase.js',
    '.\src\lib\reportRevisionAuthority.js',
    '.\src\lib\reportSurfaceState.js',
    '.\tests\qa\report-quality-manifest-smoke.js',
    '.\tests\qa\full-underwriting-publication-atomicity-regression.js'
)
foreach ($file in $syntaxFiles) {
    node --check $file
    if ($LASTEXITCODE -ne 0) { throw "STOP: Syntax failed for $file" }
}

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
Write-Host "=== PHASE 2 ARTIFACT COMPENSATION ===" -ForegroundColor Cyan
node .\tests\qa\phase2-artifact-compensation-regression.js
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 artifact compensation regression failed." }

Write-Host ""
Write-Host "=== PUBLICATION REGRESSION SET ===" -ForegroundColor Cyan
$publicationTests = @(
    '.\tests\qa\report-quality-manifest-smoke.js',
    '.\tests\qa\report-publication-authority-class-smoke.js',
    '.\tests\qa\full-underwriting-publication-atomicity-regression.js'
)
foreach ($test in $publicationTests) {
    node $test
    if ($LASTEXITCODE -ne 0) { throw "STOP: Publication regression failed: $test" }
}

Write-Host ""
Write-Host "=== FULL LOCAL BUILD ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "STOP: Full local build failed." }

$allowedChanges = $expectedDirty

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

$missingFinalChanges = @(
    $allowedChanges | Where-Object {
        -not ((git status --porcelain=v1 --untracked-files=all -- $_) -join "")
    }
)
if ($missingFinalChanges.Count -gt 0) {
    Write-Host "STOP: Expected Phase 2 files are no longer modified:" -ForegroundColor Red
    $missingFinalChanges
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

Write-Host ""
Write-Host "=== COMMIT PHASE 2 LOCAL CERTIFIED INTEGRATION ===" -ForegroundColor Cyan
git commit -m "Phase 2: close atomic publication and delivery authority"
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 integration commit failed." }

git push origin "HEAD:refs/heads/$branch"
if ($LASTEXITCODE -ne 0) { throw "STOP: Phase 2 branch push failed." }

# Production main must remain frozen.
git fetch origin "refs/heads/main:refs/remotes/origin/main" | Out-Null
$mainAfter = (git rev-parse refs/remotes/origin/main).Trim()
if ($mainAfter -cne $expectedMain) {
    throw "STOP: Production main changed unexpectedly."
}

$finalHead = (git rev-parse HEAD).Trim()

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "   INVESTORIQ PHASE 2 LOCAL CERTIFICATION COMPLETE" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Branch:       $branch"
Write-Host "Phase 2 HEAD: $finalHead"
Write-Host "Main:         $mainAfter"
Write-Host ""
Write-Host "Phase 1 regression guard:         PASS" -ForegroundColor Green
Write-Host "Phase 2 focused contract:         PASS" -ForegroundColor Green
Write-Host "Artifact compensation regression: PASS" -ForegroundColor Green
Write-Host "Publication regression set:       PASS" -ForegroundColor Green
Write-Host "Full local build:                 PASS" -ForegroundColor Green
Write-Host "Production main:                  UNCHANGED" -ForegroundColor Green
Write-Host "Production migration:             NOT APPLIED" -ForegroundColor Green
Write-Host "Production deploy:                NOT PERFORMED" -ForegroundColor Green
Write-Host ""
Write-Host "FINAL WORKTREE:"
git status --short
