# setup_full_restore.ps1
# Master script to automate the full restoration process:
# 1. Install 7-Zip
# 2. Restore Backup from Google Drive
# 3. Install Antigravity

$ScriptDir = $PSScriptRoot

Write-Host ">>> Starting Full System Restoration <<<" -ForegroundColor Cyan

# 1. Install 7-Zip
Write-Host "`n[Step 1/3] Installing 7-Zip..."
& "$ScriptDir\install_7zip.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "7-Zip installation failed. Aborting."
    exit 1
}

# 2. Restore Backup
Write-Host "`n[Step 2/3] Restoring Backup..."
& "$ScriptDir\restore_from_gdrive.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Backup restoration failed. Aborting."
    exit 1
}

# 3. Install Antigravity
Write-Host "`n[Step 3/3] Installing Antigravity..."
& "$ScriptDir\install_antigravity.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Antigravity installation failed."
    exit 1
}

Write-Host "`n>>> Restoration Complete! <<<" -ForegroundColor Green
Write-Host "You can now use Antigravity to manage your system."
