[CmdletBinding()]
param(
    [string]$HandoffPath,
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($HandoffPath)) {
    $RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $HandoffPath = Join-Path $RepositoryRoot 'CHAT_HANDOFF'
} else {
    $HandoffPath = (Resolve-Path $HandoffPath).Path
    $RepositoryRoot = Split-Path $HandoffPath -Parent
}

if (-not (Test-Path $HandoffPath -PathType Container)) {
    throw "CHAT_HANDOFF directory not found: $HandoffPath"
}

$AllowedRootFiles = @(
    '00_CURRENT_HANDOFF.md',
    '01_MASTER_PLAN.md',
    '02_ELITE_REPORT_BLUEPRINT.md',
    '03_FRESH_CHAT_PROMPT.md',
    'README.md'
)

$MissingRootFiles = @(
    $AllowedRootFiles |
        Where-Object { -not (Test-Path -LiteralPath (Join-Path $HandoffPath $_) -PathType Leaf) }
)

if ($MissingRootFiles.Count -gt 0) {
    Write-Host 'Missing canonical root files:'
    $MissingRootFiles | ForEach-Object { Write-Host "  MISSING: $_" }
    throw 'Stop. Pull the canonical handoff update before running consolidation.'
}

$ExtraFiles = @(
    Get-ChildItem -LiteralPath $HandoffPath -File |
        Where-Object { $AllowedRootFiles -notcontains $_.Name } |
        Sort-Object Name
)

Write-Host "CHAT_HANDOFF: $HandoffPath"
Write-Host "Current root files retained: $($AllowedRootFiles.Count)"
Write-Host "Extra root files found: $($ExtraFiles.Count)"

if ($ExtraFiles.Count -eq 0) {
    Write-Host 'Nothing to consolidate.'
    exit 0
}

$ExtraFiles | ForEach-Object { Write-Host "  ARCHIVE: $($_.Name)" }

if (-not $Apply) {
    Write-Host ''
    Write-Host 'DRY RUN ONLY. No files were changed.'
    Write-Host 'Run again with -Apply to create a ZIP backup and archive these files.'
    exit 0
}

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupDirectory = Join-Path $RepositoryRoot '_CHAT_HANDOFF_BACKUPS'
$BackupZip = Join-Path $BackupDirectory "CHAT_HANDOFF-before-consolidation-$Timestamp.zip"
$ArchiveDirectory = Join-Path $HandoffPath "archived\local-root-consolidation-$Timestamp"

New-Item -ItemType Directory -Path $BackupDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $ArchiveDirectory -Force | Out-Null

Compress-Archive -LiteralPath $HandoffPath -DestinationPath $BackupZip -CompressionLevel Optimal

foreach ($File in $ExtraFiles) {
    $Destination = Join-Path $ArchiveDirectory $File.Name
    if (Test-Path -LiteralPath $Destination) {
        $Stem = [System.IO.Path]::GetFileNameWithoutExtension($File.Name)
        $Extension = [System.IO.Path]::GetExtension($File.Name)
        $Destination = Join-Path $ArchiveDirectory "$Stem-$Timestamp$Extension"
    }
    Move-Item -LiteralPath $File.FullName -Destination $Destination
}

Write-Host ''
Write-Host 'Consolidation complete. No files were deleted or overwritten.'
Write-Host "Backup ZIP: $BackupZip"
Write-Host "Archived extras: $ArchiveDirectory"
