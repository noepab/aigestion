# install_antigravity.ps1
# This script checks for Antigravity installation and installs it if missing.

# Function to check Antigravity version
function Get-AntigravityVersion {
    try {
        $version = antigravity --version 2>$null
        return $version
    } catch {
        return $null
    }
}

$existingVersion = Get-AntigravityVersion
if ($existingVersion) {
    Write-Host "Antigravity is already installed. Version: $existingVersion"
    exit 0
}

Write-Host "Antigravity not found. Installing..."
# Download and execute the official install script
$installScriptUrl = "https://raw.githubusercontent.com/google-deepmind/antigravity/main/install.ps1"
try {
    Invoke-Expression (Invoke-WebRequest -Uri $installScriptUrl -UseBasicParsing).Content
    Write-Host "Antigravity installation completed."
    # Verify installation
    $newVersion = Get-AntigravityVersion
    if ($newVersion) {
        Write-Host "Verified Antigravity version: $newVersion"
    } else {
        Write-Error "Installation failed: antigravity command not found after install."
        exit 1
    }
} catch {
    Write-Error "Failed to download or execute the install script: $_"
    exit 1
}
