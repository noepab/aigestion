# Docker Optimization Script (Jan 2026)
# This script stops Docker Desktop, prunes unused resources, and compacts the Docker WSL2 VHDX file.

param(
    [switch]$DryRun
)

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath "$env:TEMP\docker_optimize.log" -Append
    Write-Host $Message
}

# Ensure Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log "Docker not installed. Exiting."
    exit 1
}

# Stop Docker Desktop if running
$dockerProcess = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
if ($dockerProcess) {
    Log "Stopping Docker Desktop..."
    if (-not $DryRun) { Stop-Process -Id $dockerProcess.Id -Force }
}

# Prune Docker resources
Log "Pruning Docker images, containers, volumes, networks..."
if (-not $DryRun) { docker system prune -a -f }

# Compact the Docker WSL2 VHDX file
$wslVhdxPath = "$env:USERPROFILE\.wsl\docker-desktop-data\ext4.vhdx"
if (Test-Path $wslVhdxPath) {
    Log "Compacting VHDX at $wslVhdxPath"
    if (-not $DryRun) {
        # Detach VHDX if mounted (unlikely), then use diskpart to compact
        $script = @"
select vdisk file="$wslVhdxPath"
attach vdisk readonly
compact vdisk
detach vdisk
exit
"@
        $script | Out-File -FilePath "$env:TEMP\compact_diskpart.txt" -Encoding ascii
        diskpart /s "$env:TEMP\compact_diskpart.txt"
    }
} else {
    Log "VHDX file not found at $wslVhdxPath"
}

Log "Docker optimization completed."
