[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\Users\robmc\Desktop\InvestorIQ\InvestorIQ-Empire-v1'
)

$ErrorActionPreference = 'Stop'

$RepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
$GitDirectory = Join-Path $RepoPath '.git'
$HandoffPath = Join-Path $RepoPath 'CHAT_HANDOFF'
$PayloadPath = Join-Path $PSScriptRoot 'payload\CHAT_HANDOFF'

if (-not (Test-Path -LiteralPath $GitDirectory)) {
    throw "STOP: Git repository not found at $RepoPath"
}

if (-not (Test-Path -LiteralPath $HandoffPath -PathType Container)) {
    throw "STOP: CHAT_HANDOFF folder not found at $HandoffPath"
}

if (-not (Test-Path -LiteralPath $PayloadPath -PathType Container)) {
    throw "STOP: Cleanup package payload is missing at $PayloadPath"
}

$ExpectedHashes = [ordered]@{
    '00_CURRENT_HANDOFF.md' = '87026df0bcae8977e60ddad728eb2abd11fd260181c6f8f86f93ebf700747672'
    '01_MASTER_PLAN.md' = '607797bfe55d7edfd1acdb15ed51892776399749aa2d5b0e30a2bace8461eeae'
    '02_ELITE_REPORT_BLUEPRINT.md' = '82e4b5514af0f6440e85bf6c1195da7f38a5f660e51dce793998536efac76ad8'
    '03_FRESH_CHAT_PROMPT.md' = '8709d9d0bcfb480ed53c1e8d6a20f5d403f90820eb88998d5a65fcf14c1213d5'
    'README.md' = '4747ae0fc1d6465d82f031a55d8539e562cb6b2a4e75b4ac0669026aa389d5e5'
}

Write-Host ''
Write-Host '=== INVESTORIQ CHAT_HANDOFF LOSSLESS CONSOLIDATION ==='
Write-Host "Repository: $RepoPath"

foreach ($Entry in $ExpectedHashes.GetEnumerator()) {
    $PayloadFile = Join-Path $PayloadPath $Entry.Key
    if (-not (Test-Path -LiteralPath $PayloadFile -PathType Leaf)) {
        throw "STOP: Required package file is missing: $($Entry.Key)"
    }

    $ActualHash = (Get-FileHash -LiteralPath $PayloadFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($ActualHash -cne $Entry.Value) {
        throw "STOP: Package hash mismatch for $($Entry.Key)"
    }
}

$GitStatus = @(git -C $RepoPath status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) {
    throw 'STOP: Could not inspect Git status.'
}

$OutsideHandoffChanges = @(
    $GitStatus | Where-Object { $_ -notmatch 'CHAT_HANDOFF[\\/]' }
)

if ($OutsideHandoffChanges.Count -gt 0) {
    Write-Host ''
    Write-Host 'Changes outside CHAT_HANDOFF were found:'
    $OutsideHandoffChanges | ForEach-Object { Write-Host "  $_" }
    throw 'STOP: Preserve or commit the unrelated work before consolidating CHAT_HANDOFF.'
}

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$RepositoryParent = Split-Path $RepoPath -Parent
$BackupDirectory = Join-Path $RepositoryParent 'InvestorIQ_CHAT_HANDOFF_BACKUPS'
$BackupZip = Join-Path $BackupDirectory "CHAT_HANDOFF-before-consolidation-$Timestamp.zip"
$ArchiveDirectory = Join-Path $HandoffPath "archived\local-root-consolidation-$Timestamp"

New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
Compress-Archive -Path (Join-Path $HandoffPath '*') -DestinationPath $BackupZip -CompressionLevel Optimal

if (-not (Test-Path -LiteralPath $BackupZip -PathType Leaf)) {
    throw 'STOP: Full backup ZIP was not created. No handoff files were moved.'
}

New-Item -ItemType Directory -Path $ArchiveDirectory -Force | Out-Null

$RootItems = @(
    Get-ChildItem -LiteralPath $HandoffPath -Force |
        Where-Object { $_.Name -cne 'archived' } |
        Sort-Object Name
)

foreach ($Item in $RootItems) {
    $Destination = Join-Path $ArchiveDirectory $Item.Name
    if (Test-Path -LiteralPath $Destination) {
        $Destination = Join-Path $ArchiveDirectory "$($Item.Name)-$Timestamp"
    }
    Move-Item -LiteralPath $Item.FullName -Destination $Destination
    Write-Host "Archived: $($Item.Name)"
}

foreach ($Entry in $ExpectedHashes.GetEnumerator()) {
    $PayloadFile = Join-Path $PayloadPath $Entry.Key
    $DestinationFile = Join-Path $HandoffPath $Entry.Key
    Copy-Item -LiteralPath $PayloadFile -Destination $DestinationFile

    $InstalledHash = (Get-FileHash -LiteralPath $DestinationFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($InstalledHash -cne $Entry.Value) {
        throw "STOP: Installed-file verification failed for $($Entry.Key). The original folder remains backed up at $BackupZip"
    }
    Write-Host "Installed: $($Entry.Key)"
}

$FinalRootFiles = @(
    Get-ChildItem -LiteralPath $HandoffPath -File |
        Sort-Object Name |
        Select-Object -ExpandProperty Name
)

if (($FinalRootFiles.Count -ne $ExpectedHashes.Count) -or
    (@($FinalRootFiles | Where-Object { -not $ExpectedHashes.Contains($_) }).Count -gt 0)) {
    throw "STOP: Final root verification failed. The original folder remains backed up at $BackupZip"
}

Write-Host ''
Write-Host 'PASS: CHAT_HANDOFF is clean and no information was deleted.'
Write-Host "Backup ZIP: $BackupZip"
Write-Host "Archived prior root: $ArchiveDirectory"
Write-Host 'New-chat file: CHAT_HANDOFF\03_FRESH_CHAT_PROMPT.md'
Write-Host ''
git -C $RepoPath status --short
