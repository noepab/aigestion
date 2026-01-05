# backup_to_gdrive.ps1
# This script creates a zip archive of the AIGestion project and uploads it to Google Drive using rclone.

param(
    [string]$ProjectPath = "C:\\Users\\Alejandro\\AIGestion",
    [string]$BackupDir = "C:\\Users\\Alejandro\\AIGestion\\backups",
    [string]$RemoteName = "gdrive",
    [string]$RemotePath = "AIGestion_Backups"
)

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Create timestamped zip file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipFile = Join-Path $BackupDir "AIGestion_$timestamp.zip"
# Find 7-Zip
function Get-7zPath {
    if (Get-Command "7z" -ErrorAction SilentlyContinue) { return "7z" }
    if (Test-Path "$env:ProgramFiles\7-Zip\7z.exe") { return "$env:ProgramFiles\7-Zip\7z.exe" }
    return $null
}
$7z = Get-7zPath
if (-not $7z) {
    Write-Error "7-Zip not found. Please run install_7zip.ps1 or install 7-Zip."
    exit 1
}

Write-Host "Creating archive $zipFile using 7-Zip..."
# -tzip: create zip
# -mx5: normal compression (faster than ultra)
# -xr!backups: exclude backups folder (critical!)
# -xr!restore_test*: exclude test restore folders
# -xr!node_modules: optional, but keeping it for 'FULL' backup as requested, user said 'TODO'.
# Actually user said 'todo', so I will KEEP node_modules but EXCLUDE backups.
$p = "$ProjectPath\\*"
$7zArgs = @("a", "-tzip", $zipFile, $p, "-xr!backups", "-xr!restore_test*")
& $7z $7zArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "7-Zip backup failed with exit code $LASTEXITCODE"
    exit 1
}

# Generate checksum
$checksum = Get-FileHash -Algorithm SHA256 $zipFile | Select-Object -ExpandProperty Hash
$manifest = "$zipFile.manifest.txt"
"Timestamp: $timestamp`nChecksum: $checksum" | Set-Content -Path $manifest

# Upload using rclone
Write-Host "Uploading to Google Drive..."
if ($RemoteName -and $RemotePath) {
    rclone copy "$zipFile" "${RemoteName}:${RemotePath}" --progress
    rclone copy "$manifest" "${RemoteName}:${RemotePath}" --progress
}
else {
    Write-Host "No remote configured. Skipping upload."
}

Write-Host "Backup completed successfully."
