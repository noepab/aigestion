# schedule_cleanup_tasks.ps1
# Registers Windows Scheduled Tasks to run cleanup scripts daily at 00:00.
# Requires administrative privileges.

$tasks = @(
  @{ Name = "DockerCleanup"; Script = "C:\\Users\\Alejandro\\AIGestion\\scripts\\docker_cleanup.ps1" },
  @{ Name = "AntigravityRecordingsCleanup"; Script = "C:\\Users\\Alejandro\\AIGestion\\scripts\\cleanup_recordings.ps1" }
)

foreach ($t in $tasks) {
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$($t.Script)`""
  $trigger = New-ScheduledTaskTrigger -Daily -At 00:00
  $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
  $settings = New-ScheduledTaskSettingsSet -Compatibility Win10 -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  try {
    Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    Write-Host "Scheduled task '$($t.Name)' created successfully." -ForegroundColor Green
  }
  catch {
    Write-Host "Failed to create task '$($t.Name)': $_" -ForegroundColor Red
  }
}
