# cleanup_recordings.ps1
# Prunes Antigravity recordings to keep only the most recent ones.
param(
    [string]$RecordingsPath = "$env:USERPROFILE\.gemini\antigravity\recordings",
    [int]$KeepCount = 50
)

Write-Host "Checking recordings in: $RecordingsPath"

if (-not (Test-Path $RecordingsPath)) {
    Write-Host "Recordings directory not found: $RecordingsPath" -ForegroundColor Yellow
    exit
}

$DirInfo = New-Object System.IO.DirectoryInfo($RecordingsPath)
$Files = $DirInfo.GetFiles() | Sort-Object LastWriteTime -Descending

Write-Host "Found $($Files.Count) files."

if ($Files.Count -gt $KeepCount) {
    $FilesToRemove = $Files | Select-Object -Skip $KeepCount
    foreach ($File in $FilesToRemove) {
        Write-Host "Removing old recording: $($File.Name)"
        Remove-Item $File.FullName -Force
    }
    Write-Host "Cleaned up $($FilesToRemove.Count) recordings." -ForegroundColor Green
} else {
    Write-Host "Recording count ($($Files.Count)) is within limit ($KeepCount). No action needed." -ForegroundColor Green
}
