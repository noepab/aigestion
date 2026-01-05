# PowerShell dev‑environment bootstrap for NEXUS V1
# -------------------------------------------------
# 1. Download & install Node.js LTS (silent)
Write-Host "Downloading Node.js LTS..."
$nodeUrl = "https://nodejs.org/dist/v20.12.0/node-v20.12.0-x64.msi"
$nodeMsi = "$env:TEMP\node.msi"
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
Write-Host "Installing Node.js..."
Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart" -Wait
# 2. Download & install Git (silent)
Write-Host "Downloading Git..."
$gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.45.0.windows.1/Git-2.45.0-64-bit.exe"
$gitExe = "$env:TEMP\git-installer.exe"
Invoke-WebRequest -Uri $gitUrl -OutFile $gitExe -UseBasicParsing
Write-Host "Installing Git..."
Start-Process -FilePath $gitExe -ArgumentList "/VERYSILENT /NORESTART" -Wait
# 3. Refresh PATH for this session
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = $env:PATH + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
Write-Host "\n=== Verification ==="
node -v
npm -v
git --version
# 4. Install Turbo globally
Write-Host "\nInstalling Turbo (global npm package)..."
npm i -g turbo
# 5. Project setup
$repoRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}
Set-Location $repoRoot
Write-Host "\nRunning npm ci (clean install)..."
npm ci
Write-Host "\nRunning npm run prepare (sets up Husky pre‑commit hook)..."
npm run prepare
Write-Host "\nSetup complete! You can now use git, npm, npx, turbo."

