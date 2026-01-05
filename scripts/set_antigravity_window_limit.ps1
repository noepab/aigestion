# PowerShell script to set Antigravity window limit
# This script updates the settings.json file in the user's Antigravity config directory.

$settingsPath = "$env:USERPROFILE\.antigravity\settings.json"

if (Test-Path $settingsPath) {
    $json = Get-Content $settingsPath -Raw | ConvertFrom-Json
} else {
    $json = @{}
}

if (-not $json.editor) { $json | Add-Member -MemberType NoteProperty -Name editor -Value @{} }
$json.editor.maxOpenWindows = 10
$json.editor.autoCloseOldest = $true

$json | ConvertTo-Json -Depth 10 | Set-Content -Path $settingsPath -Encoding UTF8

Write-Host "Antigravity window limit set to 10 (auto-close oldest enabled)."
