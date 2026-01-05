
<#
.SYNOPSIS
    Monitors system resources (CPU, RAM, Disk) and sends Telegram alerts.

.DESCRIPTION
    Checks for high CPU/RAM usage and low disk space.
    Requires telegram_config.json in the same directory.
    Can be scheduled to run via Task Scheduler.

.EXAMPLE
    ./monitor-system.ps1
#>

param (
    [int]$CpuThreshold = 90,
    [int]$RamThreshold = 90,
    [int]$DiskMinFreeGB = 10,
    [string]$ConfigPath = "$PSScriptRoot\telegram_config.json"
)

# Configuration
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Configuration file not found at $ConfigPath"
    exit 1
}

$Config = Get-Content $ConfigPath | ConvertFrom-Json
$BotToken = $Config.BotToken
$ChatId = $Config.ChatId

if ([string]::IsNullOrWhiteSpace($BotToken) -or [string]::IsNullOrWhiteSpace($ChatId)) {
    Write-Warning "Telegram credentials missing in $ConfigPath. Skipping alerts."
    # Try to load from Environment as fallback checking for user specific claims
    $EnvToken = $env:TELEGRAM_BOT_TOKEN
    $EnvChatId = $env:TELEGRAM_CHAT_ID

    if (-not [string]::IsNullOrWhiteSpace($EnvToken) -and -not [string]::IsNullOrWhiteSpace($EnvChatId)) {
        Write-Host "Found credentials in Environment Variables."
        $BotToken = $EnvToken
        $ChatId = $EnvChatId
    } else {
        exit 1
    }
}

function Send-TelegramMessage {
    param(
        [string]$Message
    )
    $Uri = "https://api.telegram.org/bot$BotToken/sendMessage"
    $Body = @{
        chat_id = $ChatId
        text    = $Message
        parse_mode = "Markdown"
    }
    try {
        Invoke-RestMethod -Uri $Uri -Method Post -Body $Body -ErrorAction Stop | Out-Null
        Write-Host "Alert sent to Telegram."
    }
    catch {
        Write-Error "Failed to send Telegram message: $_"
    }
}

# 1. CPU Check
$Cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average | Select-Object -ExpandProperty Average
Write-Host "CPU Usage: $Cpu%"

# 2. RAM Check
$Os = Get-CimInstance Win32_OperatingSystem
$TotalRamGB = [math]::Round($Os.TotalVisibleMemorySize / 1MB, 2)
$FreeRamGB = [math]::Round($Os.FreePhysicalMemory / 1MB, 2)
$UsedRamGB = $TotalRamGB - $FreeRamGB
$RamPercent = [math]::Round(($UsedRamGB / $TotalRamGB) * 100, 1)
Write-Host "RAM Usage: $RamPercent% ($FreeRamGB GB Free)"

# 3. Disk Check (C: Drive)
$Disk = Get-Volume -DriveLetter C
$FreeDiskGB = [math]::Round($Disk.SizeRemaining / 1GB, 2)
Write-Host "Disk Free: $FreeDiskGB GB"

# Alert Logic
$Alerts = @()

if ($Cpu -gt $CpuThreshold) {
    $Alerts += "⚠️ *High CPU Alert*: Usage is at *${Cpu}%*"
}

if ($RamPercent -gt $RamThreshold) {
    $Alerts += "⚠️ *High Memory Alert*: Usage is at *${RamPercent}%* (Only ${FreeRamGB}GB free)"
}

if ($FreeDiskGB -lt $DiskMinFreeGB) {
    $Alerts += "🚨 *Low Disk Space*: Only *${FreeDiskGB}GB* remaining on C:"
}

if ($Alerts.Count -gt 0) {
    $AlertMessage = "🖥️ *System Alert - $(Get-Date)*`n`n" + ($Alerts -join "`n")
    Send-TelegramMessage -Message $AlertMessage
} else {
    Write-Host "System Normal. No alerts triggered."
}
