# Auto Clean Motor - AIGestion
# Standard system maintenance script

Write-Host "Starting AIGestion Auto-Clean Motor..." -ForegroundColor Cyan

# 1. Docker Cleanup (Conservative)
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Pruning stopped Docker containers..."
    docker container prune -f | Out-Null
    Write-Host "Docker cleaned." -ForegroundColor Green
}

# 2. Temp Folders
$tempFolders = @(
    $env:TEMP,
    "$env:WINDIR\Temp"
)

foreach ($folder in $tempFolders) {
    if (Test-Path $folder) {
        Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Cleaned: $folder"
    }
}

# 3. Browser Cache (Chrome/Edge - only if closed)
$browsers = @(
    @{ Name="chrome"; Path="$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache" },
    @{ Name="msedge"; Path="$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache" }
)

foreach ($b in $browsers) {
    if (-not (Get-Process -Name $b.Name -ErrorAction SilentlyContinue)) {
        if (Test-Path $b.Path) {
            Remove-Item -Path "$b.Path\*" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "Cleaned $($b.Name) cache."
        }
    } else {
        Write-Host "Skipping $($b.Name) cache (Browser Open)." -ForegroundColor Yellow
    }
}

# 4. Success Sound
[System.Console]::Beep(1000, 200)
Write-Host "System Clean Complete." -ForegroundColor Green
