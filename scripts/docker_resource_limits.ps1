# Docker Resource Limits Script

param(
    [int]$MemoryGB = 4,
    [int]$CPUs = 2
)

function Set-DockerLimits {
    $settingsPath = "$env:APPDATA\Docker\settings.json"
    if (-Not (Test-Path $settingsPath)) {
        Write-Host "Docker settings file not found at $settingsPath" -ForegroundColor Red
        return
    }
    $json = Get-Content $settingsPath -Raw | ConvertFrom-Json
    $json.memoryMiB = $MemoryGB * 1024
    $json.cpus = $CPUs
    $json | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    Write-Host "Docker Desktop resource limits updated: Memory=${MemoryGB}GB, CPUs=${CPUs}" -ForegroundColor Green
}

Set-DockerLimits
