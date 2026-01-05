#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🔄 NEXUS V1 Task Sync & Report Generator

.DESCRIPTION
    Synchronize tasks with GitHub Issues, generate reports, and maintain documentation
#>

param(
    [ValidateSet('sync', 'report', 'export', 'archive', 'backup')]
    [string]$Action = 'report',
    [ValidateSet('daily', 'weekly', 'monthly')]
    [string]$ReportType = 'weekly',
    [string]$OutputPath = $null
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TaskRoot = Join-Path $ProjectRoot 'task'
$TasksPath = Join-Path $TaskRoot 'data/tasks.json'
$ReportsPath = Join-Path $TaskRoot 'reports'
$ManagerScript = Join-Path $ScriptDir 'task-manager.ps1'
$AnalyticsScript = Join-Path $ScriptDir 'task-analytics.ps1'

$Tasks = (Get-Content $TasksPath -Raw | ConvertFrom-Json).tasks

# ═══════════════════════════════════════════════════════════════════════════════
# REPORT GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

function New-TaskReport {
    param([string]$Type)

    Write-Host "`n📝 Generating $Type Report..." -ForegroundColor Cyan

    $Timestamp = Get-Date
    $FileName = "report_$Type`_$($Timestamp.ToString('yyyyMMdd_HHmmss')).md"
    $ReportPath = if ($OutputPath) { $OutputPath } else { Join-Path $ReportsPath $FileName }

    $Content = @"
# 📊 Task Report - $($Timestamp.ToString('MMMM dd, yyyy HH:mm'))

**Report Type:** $Type | **Period:** $(
    switch ($Type) {
        'daily' { 'Last 24 hours' }
        'weekly' { 'Last 7 days' }
        'monthly' { 'Last 30 days' }
        default { 'Current' }
    }
)

---

## 📈 Executive Summary

"@

    # Statistics
    $Total = $Tasks.Count
    $Completed = @($Tasks | Where-Object { $_.status -eq 'done' }).Count
    $Active = @($Tasks | Where-Object { $_.status -notin @('done', 'cancelled', 'backlog') }).Count
    $Blocked = @($Tasks | Where-Object { $_.status -eq 'blocked' }).Count

    $Content += @"

| Metric | Value |
|--------|-------|
| **Total Tasks** | $Total |
| **Completed** | $Completed ($(([math]::Round($Completed / $Total * 100, 1)))%) |
| **Active** | $Active |
| **Blocked** | $Blocked |
| **Backlog** | $(@($Tasks | Where-Object { $_.status -eq 'backlog' }).Count) |

---

## 🎯 Status Overview

"@

    # Status breakdown
    $StatusGroups = $Tasks | Group-Object -Property status | Sort-Object -Property Count -Descending
    $Content += "`n| Status | Count | Percentage |`n|--------|-------|------------|`n"

    $StatusGroups | ForEach-Object {
        $Pct = [math]::Round($_.Count / $Total * 100, 1)
        $Content += "| $($_.Name) | $($_.Count) | $Pct% |`n"
    }

    # Top priority tasks
    $Content += @"

---

## 🔥 High Priority Tasks

"@

    $HighPriority = $Tasks | Where-Object { $_.priority -in @('critical', 'high') } | Sort-Object -Property priorityValue -Descending | Select-Object -First 10

    if ($HighPriority) {
        $Content += "`n"
        $HighPriority | ForEach-Object {
            $StatusEmoji = switch ($_.status) {
                'done' { '✅' }
                'in_progress' { '⏳' }
                'blocked' { '🚫' }
                default { '📋' }
            }
            $Content += "- $StatusEmoji **#$($_.id):** $($_.title) [$($_.priority)] [$($_.status)]`n"
            if ($_.dueDate) {
                $Content += "  - Due: $($_.dueDate)`n"
            }
        }
    }
    else {
        $Content += "`nNo high priority tasks.`n"
    }

    # Completed this period
    $Content += @"

---

## ✅ Recently Completed

"@

    $RecentlyCompleted = $Tasks | Where-Object { $_.status -eq 'done' } | Sort-Object -Property completed -Descending | Select-Object -First 10

    if ($RecentlyCompleted) {
        $Content += "`n"
        $RecentlyCompleted | ForEach-Object {
            $Content += "- **#$($_.id):** $($_.title) [$($_.type)]`n"
        }
    }
    else {
        $Content += "`nNo recently completed tasks.`n"
    }

    # Blocked tasks
    if ($Blocked -gt 0) {
        $Content += @"

---

## 🚫 Blocked Tasks (Action Required)

"@

        $BlockedTasks = $Tasks | Where-Object { $_.status -eq 'blocked' }
        $Content += "`n"
        $BlockedTasks | ForEach-Object {
            $Content += "- **#$($_.id):** $($_.title) [$($_.priority)]`n"
            if ($_.notes) {
                $Content += "  - Notes: $($_.notes[-1].text)`n"
            }
        }
    }

    # Velocity & Forecast
    $DoneLastWeek = @($Tasks | Where-Object {
            $_.completed -and
            [datetime]::ParseExact($_.completed, 'o', $null) -gt (Get-Date).AddDays(-7)
        }).Count

    $Content += @"

---

## ⚡ Velocity & Forecast

- **Last Week Completion:** $DoneLastWeek tasks
- **Weekly Average:** $([math]::Round($DoneLastWeek, 1)) tasks/week
- **Est. Sprint Capacity:** $([math]::Round($DoneLastWeek * 2, 0)) tasks
- **Remaining Backlog:** $(@($Tasks | Where-Object { $_.status -ne 'done' }).Count) tasks

---

## 🎯 Recommendations

"@

    if ($Blocked -gt 0) {
        $Content += "`n- ⚠️ **Unblock stalled tasks:** $Blocked tasks are blocked. Review dependencies and blockers.`n"
    }

    $Overdue = $Tasks | Where-Object {
        $_.dueDate -and
        [datetime]::ParseExact($_.dueDate, 'yyyy-MM-dd', $null) -lt (Get-Date) -and
        $_.status -ne 'done'
    }

    if ($Overdue) {
        $Content += "- ⏰ **Address overdue items:** $($Overdue.Count) tasks are past due.`n"
    }

    if ($Active -lt 3) {
        $Content += "- 📈 **Increase throughput:** Consider picking up backlog items.`n"
    }

    $Content += @"

---

## 📊 Generated: $($Timestamp.ToString('yyyy-MM-dd HH:mm:ss'))

"@

    # Save report
    if (-not (Test-Path $ReportsPath)) {
        New-Item -ItemType Directory -Path $ReportsPath -Force | Out-Null
    }

    $Content | Set-Content $ReportPath -Encoding UTF8
    Write-Host "✅ Report saved to: $ReportPath" -ForegroundColor Green

    return $ReportPath
}

function Backup-TaskData {
    Write-Host "`n💾 Backing up task data..." -ForegroundColor Cyan

    $BackupDir = Join-Path $TaskRoot "data/backups"
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    }

    $BackupFile = Join-Path $BackupDir "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    Copy-Item -Path $TasksPath -Destination $BackupFile -Force

    Write-Host "✅ Backup created: $BackupFile" -ForegroundColor Green

    # Clean old backups (keep 10)
    $Backups = Get-ChildItem $BackupDir -Filter "backup_*.json" | Sort-Object -Property LastWriteTime -Descending
    $BackupList = @($Backups)
    if ($BackupList.Count -gt 10) {
        $BackupList | Select-Object -Skip 10 | Remove-Item
        Write-Host "🧹 Cleaned old backups" -ForegroundColor Yellow
    }
}

function Sync-WithGitHub {
    Write-Host "`n🔄 Syncing with GitHub..." -ForegroundColor Cyan

    # Check if git is available
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️ Git not found. Skipping GitHub sync." -ForegroundColor Yellow
        return
    }

    # Commit task changes
    $TasksPath
    $status = git -C $ProjectRoot status --short

    if ($status) {
        Write-Host "📤 Committing task changes..." -ForegroundColor Cyan
        git -C $ProjectRoot add "task/data/tasks.json"
        git -C $ProjectRoot commit -m "chore(tasks): update task database [skip ci]" | Out-Null
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "✅ No changes to sync" -ForegroundColor Green
    }
}

function Export-Tasks {
    param([string]$Format = 'json')

    Write-Host "`n📤 Exporting tasks ($Format)..." -ForegroundColor Cyan

    $ExportDir = Join-Path $ReportsPath 'exports'
    if (-not (Test-Path $ExportDir)) {
        New-Item -ItemType Directory -Path $ExportDir -Force | Out-Null
    }

    $Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'

    switch ($Format) {
        'json' {
            $ExportFile = Join-Path $ExportDir "tasks_$Timestamp.json"
            Get-Content $TasksPath | Set-Content $ExportFile
        }
        'csv' {
            $ExportFile = Join-Path $ExportDir "tasks_$Timestamp.csv"
            $Tasks | ConvertTo-Csv -NoTypeInformation | Set-Content $ExportFile
        }
        'markdown' {
            $ExportFile = Join-Path $ExportDir "tasks_$Timestamp.md"
            $Content = "# Tasks Export`n`n"
            $Tasks | ForEach-Object {
                $Content += "## #$($_.id) - $($_.title)`n"
                $Content += "- Type: $($_.type)`n"
                $Content += "- Priority: $($_.priority)`n"
                $Content += "- Status: $($_.status)`n"
                $Content += "- Description: $($_.description)`n`n"
            }
            $Content | Set-Content $ExportFile
        }
    }

    Write-Host "✅ Exported to: $ExportFile" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

switch ($Action) {
    'report' {
        New-TaskReport -Type $ReportType
    }
    'sync' {
        Sync-WithGitHub
    }
    'export' {
        Export-Tasks -Format 'json'
        Export-Tasks -Format 'csv'
    }
    'backup' {
        Backup-TaskData
    }
    'archive' {
        Write-Host "🗂️ Archiving completed tasks..." -ForegroundColor Cyan
        Write-Host "💡 Feature coming in v1.1" -ForegroundColor Yellow
    }
}

Write-Host "`n" -ForegroundColor Gray

