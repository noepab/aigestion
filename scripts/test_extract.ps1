# test_extract.ps1
# Extract the backup archive to a temporary directory and list its contents with error handling

$BackupZip = "C:\\Users\\Alejandro\\AIGestion\\backups\\AIGestion_20260104_091533.zip"
$ExtractDir = "C:\\Users\\Alejandro\\AIGestion\\restore_test"

if (-not (Test-Path $BackupZip)) {
    Write-Error "Backup zip not found at $BackupZip"
    exit 1
}

if (Test-Path $ExtractDir) {
    Remove-Item -Recurse -Force $ExtractDir
}
New-Item -ItemType Directory -Path $ExtractDir | Out-Null

Write-Host "Extracting $BackupZip to $ExtractDir..."
try {
    Expand-Archive -LiteralPath $BackupZip -DestinationPath $ExtractDir -Force -ErrorAction Stop
    Write-Host "Extraction completed successfully."
}
catch {
    Write-Error "Extraction failed: $_"
    exit 1
}

Write-Host "Listing top-level contents of $ExtractDir"
Get-ChildItem -Path $ExtractDir | ForEach-Object { Write-Host $_.Name }
