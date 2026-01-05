# extract_with_7zip.ps1
# Extracts the backup archive using 7-Zip (7z.exe)

param(
    [string]$BackupZip = "C:\\Users\\Alejandro\\AIGestion\\backups\\AIGestion_20260104_091533.zip",
    [string]$ExtractDir = "C:\\Users\\Alejandro\\AIGestion\\restore_test_7z"
)

# Function to find 7z executable
function Get-7zPath {
    if (Get-Command "7z" -ErrorAction SilentlyContinue) { return "7z" }
    if (Test-Path "$env:ProgramFiles\7-Zip\7z.exe") { return "$env:ProgramFiles\7-Zip\7z.exe" }
    return $null
}

$7z = Get-7zPath
if (-not $7z) {
    Write-Error "7-Zip not found. Please run install_7zip.ps1 first."
    exit 1
}

if (-not (Test-Path $BackupZip)) {
    Write-Error "Backup zip not found at $BackupZip"
    exit 1
}

if (Test-Path $ExtractDir) {
    Remove-Item -Recurse -Force $ExtractDir
}
New-Item -ItemType Directory -Path $ExtractDir | Out-Null

Write-Host "Extracting $BackupZip to $ExtractDir using 7-Zip..."
# x: extract with full paths, -o: output directory (no space), -y: assume yes on all queries
$args = @("x", $BackupZip, "-o$ExtractDir", "-y")
& $7z $args

if ($LASTEXITCODE -eq 0) {
    Write-Host "Extraction completed successfully."
    Write-Host "Top-level contents:"
    Get-ChildItem -Path $ExtractDir | ForEach-Object { Write-Host $_.Name }
} else {
    Write-Error "7-Zip extraction failed with exit code $LASTEXITCODE"
    exit 1
}
