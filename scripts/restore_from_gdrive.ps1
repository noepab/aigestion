# restore_from_gdrive.ps1
# This script lists available backups in Google Drive, downloads the selected archive, verifies checksum, and extracts it.

param(
    [string]$BackupDir = "C:\\Users\\Alejandro\\AIGestion\\backups",
    [string]$RemoteName = "gdrive",
    [string]$RemotePath = "AIGestion_Backups"
)

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# List backups on remote
Write-Host "Fetching list of backups from Google Drive..."
rclone lsf "$RemoteName:$RemotePath" --files-only > "$env:TEMP\gdrive_backups.txt"
$files = Get-Content "$env:TEMP\gdrive_backups.txt" | Where-Object { $_ -match "\.zip$" }
if ($files.Count -eq 0) {
    Write-Error "No backup archives found on remote."
    exit 1
}
Write-Host "Available backups:"
$files | ForEach-Object { Write-Host " - $_" }

$choice = Read-Host "Enter the name of the backup to restore"
if (-not ($files -contains $choice)) {
    Write-Error "Invalid selection."
    exit 1
}

$localZip = Join-Path $BackupDir $choice
$localManifest = "$localZip.manifest.txt"

# Download archive and manifest
Write-Host "Downloading $choice..."
rclone copy "$RemoteName:$RemotePath/$choice" "$BackupDir" --progress
$rmanifest = $choice -replace "\.zip$", ".manifest.txt"
rclone copy "$RemoteName:$RemotePath/$rmanifest" "$BackupDir" --progress

# Verify checksum
if (-not (Test-Path $localManifest)) {
    Write-Error "Manifest file missing; cannot verify integrity."
    exit 1
}
$manifestContent = Get-Content $localManifest
$expectedChecksum = ($manifestContent -match "Checksum: (.*)")[0].Split(": ")[1]
$actualChecksum = Get-FileHash -Algorithm SHA256 $localZip | Select-Object -ExpandProperty Hash
if ($expectedChecksum -ne $actualChecksum) {
    Write-Error "Checksum mismatch! Abort restoration."
    exit 1
}
Write-Host "Checksum verified. Extracting archive..."
Expand-Archive -Path $localZip -DestinationPath "C:\\Users\\Alejandro\\AIGestion" -Force
Write-Host "Restore completed successfully."
