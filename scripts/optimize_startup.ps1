# System Startup Optimization Script

param(
    [switch]$DryRun
)

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath "$env:TEMP\startup_optimize_$(Get-Date -Format 'yyyyMMdd_HHmmss').log" -Append
    Write-Host $Message
}

Log "Starting system startup optimization"

# List of services to disable (example list)
$servicesToDisable = @(
    "DiagTrack",
    "WSearch",
    "Spooler"
)

foreach ($svc in $servicesToDisable) {
    if (Get-Service -Name $svc -ErrorAction SilentlyContinue) {
        if ($DryRun) {
            Log "Would disable service: $svc"
        } else {
            Set-Service -Name $svc -StartupType Disabled
            Log "Disabled service: $svc"
        }
    } else {
        Log "Service not found: $svc"
    }
}

# Reorder autostart entries (example using Task Scheduler)
$tasks = Get-ScheduledTask | Where-Object {$_.State -eq "Ready"}
foreach ($task in $tasks) {
    # Placeholder: actual reordering logic would be complex
    Log "Checked autostart task: $($task.TaskName)"
}

# Create a system restore point (requires admin)
if (-not $DryRun) {
    try {
        Checkpoint-Computer -Description "Startup optimization" -RestorePointType MODIFY_SETTINGS
        Log "System restore point created"
    } catch {
        Log "Failed to create restore point: $_"
    }
} else {
    Log "DryRun: Skipping restore point creation"
}

Log "System startup optimization completed"
