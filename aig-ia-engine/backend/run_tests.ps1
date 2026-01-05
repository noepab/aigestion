# NEXUS V1 IA Engine - Run Tests Script (PowerShell)
# This script sets up the environment and runs tests

# Resolve repository root to avoid hard-coded user paths
$repoRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\")).Path
}

# Set Python path
$env:PYTHONPATH = Join-Path $repoRoot "NEXUS V1-ia-engine\backend"

# Run tests using server venv pytest
Write-Host "Running NEXUS V1 IA Engine Tests..." -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

$pytestExe = Join-Path $repoRoot "server\.venv\Scripts\pytest.exe"
& $pytestExe tests\ -v @args

Write-Host ""
Write-Host "Test run complete!" -ForegroundColor Green

