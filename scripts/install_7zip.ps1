# install_7zip.ps1
# Installs 7-Zip using winget or direct download if winget fails.

Write-Host "Checking for 7-Zip..."
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    Write-Host "7-Zip is already installed."
    exit 0
}

Write-Host "7-Zip not found. Attempting install via winget..."
try {
    winget install --id 7zip.7zip -e --source winget --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -eq 0) {
        Write-Host "7-Zip installed successfully via winget."
        # Refresh env vars in current session usually requires restart or manual update,
        # but we can try to add common paths
        $env:Path += ";C:\Program Files\7-Zip"
        exit 0
    }
} catch {
    Write-Warning "Winget installation failed or not available."
}

Write-Host "Attempting direct download installation..."
$installerUrl = "https://www.7-zip.org/a/7z2301-x64.exe" # Version 23.01 x64
$installerPath = "$env:TEMP\7z_installer.exe"

try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
    Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait -Verb RunAs
    Write-Host "7-Zip installed successfully via direct download."
    $env:Path += ";C:\Program Files\7-Zip"
} catch {
    Write-Error "Failed to install 7-Zip: $_"
    exit 1
}
