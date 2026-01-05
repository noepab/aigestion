
# backup_brain.ps1
# Backs up the Antigravity Brain (Memory/Knowledge) to Google Drive.
# Targets: .gemini\antigravity

param(
    [string]$BrainPath = "$env:USERPROFILE\.gemini\antigravity",
    [string]$BackupDir = "C:\Users\Alejandro\AIGestion\backups",
    [string]$RemoteName = "gdrive",
    [string]$RemotePath = "Antigravity_Brain_Backups"
)

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = Join-Path $BackupDir "Antigravity_Brain_$timestamp.zip"

function Get-7zPath {
    if (Get-Command "7z" -ErrorAction SilentlyContinue) { return "7z" }
    if (Test-Path "$env:ProgramFiles\7-Zip\7z.exe") { return "$env:ProgramFiles\7-Zip\7z.exe" }
    return $null
}

$7z = Get-7zPath
if (-not $7z) {
    Write-Error "7-Zip not found."
    exit 1
}

Write-Host "Zipping Brain: $BrainPath -> $zipFile"

# Exclusions:
# - browser_recordings: large video files
# - node_modules: dependencies
# - .git: if any
# - backup*: avoid recursion
$p = "$BrainPath\*"
$7zArgs = @(
    "a", "-tzip", $zipFile, $p,
    "-ssw",
    "-xr!browser_recordings",
    "-xr!node_modules",
    "-xr!backup*",
    "-xr!*.log",
    "-xr!*.lock"
)

& $7z $7zArgs | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Error "Zip failed!"
    exit 1
}

# Checksum
$checksum = Get-FileHash -Algorithm SHA256 $zipFile | Select-Object -ExpandProperty Hash
$manifest = "$zipFile.manifest.txt"
"Timestamp: $timestamp`nChecksum: $checksum" | Set-Content -Path $manifest

# Upload
Write-Host "Uploading to Google Drive ($RemotePath)..."
if (Get-Command "rclone" -ErrorAction SilentlyContinue) {
    rclone copy "$zipFile" "${RemoteName}:${RemotePath}" --progress
    rclone copy "$manifest" "${RemoteName}:${RemotePath}" --progress
}
else {
    Write-Warning "rclone not found. Skipping cloud upload. Local backup created."
}

Write-Host "Brain Backup Complete."
