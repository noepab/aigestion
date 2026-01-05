#!/usr/bin/env pwsh
<#
.SYNOPSIS
    📊 NEXUS V1 Task Analytics & Forecasting System

.DESCRIPTION
    Advanced analytics, burndown charts, velocity tracking, and capacity planning
#>

param(
    [ValidateSet('metrics', 'burndown', 'velocity', 'forecast', 'roadmap', 'export')]
    [string]$Analysis = 'metrics',
    [ValidateSet('sprint', 'quarter', 'year')]
    [string]$Period = 'sprint',
    [string]$OutputFormat = 'console'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TaskRoot = Join-Path $ProjectRoot 'task'
$ConfigPath = Join-Path $TaskRoot 'config/task-config.json'
$TasksPath = Join-Path $TaskRoot 'data/tasks.json'
$AnalyticsPath = Join-Path $TaskRoot 'data/analytics.json'

$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$Tasks = (Get-Content $TasksPath -Raw | ConvertFrom-Json).tasks

# ═══════════════════════════════════════════════════════════════════════════════
# METRICS CALCULATION
# ═══════════════════════════════════════════════════════════════════════════════

function Get-TaskMetrics {
    Write-Host "`n📊 TASK METRICS & KPIs" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Basic counts
    $Total = $Tasks.Count
    $Completed = ($Tasks | Where-Object { $_.status -eq 'done' }).Count
    $Active = ($Tasks | Where-Object { $_.status -notin @('done', 'cancelled', 'backlog') }).Count
    $Blocked = ($Tasks | Where-Object { $_.status -eq 'blocked' }).Count
    $Backlog = ($Tasks | Where-Object { $_.status -eq 'backlog' }).Count

    # Progress
    $CompletionRate = if ($Total -gt 0) { [math]::Round(($Completed / $Total * 100), 1) } else { 0 }

    # Time-based metrics
    $Now = Get-Date
    $DoneLastWeek = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-7)
    }).Count
    $DoneLastMonth = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-30)
    }).Count

    # Display core metrics
    Write-Host "`n📈 Core Metrics" -ForegroundColor Green
    Write-Host "├─ Total Tasks:        $Total"
    Write-Host "├─ Completed:          $Completed ($CompletionRate%)" -ForegroundColor Green
    Write-Host "├─ Active In Progress: $Active" -ForegroundColor Cyan
    Write-Host "├─ Blocked:            $Blocked" -ForegroundColor Red
    Write-Host "└─ Backlog:            $Backlog"

    # Velocity
    Write-Host "`n⚡ Velocity" -ForegroundColor Green
    Write-Host "├─ Last 7 days:  $DoneLastWeek tasks" -ForegroundColor Yellow
    Write-Host "├─ Last 30 days: $DoneLastMonth tasks" -ForegroundColor Yellow
    Write-Host "├─ Daily average (7d):  $(([math]::Round($DoneLastWeek / 7, 2))) tasks/day"
    Write-Host "└─ Weekly average (4w):  $(([math]::Round($DoneLastMonth / 4, 2))) tasks/week"

    # Priority distribution
    Write-Host "`n🔥 Priority Distribution" -ForegroundColor Green
    @('critical', 'high', 'medium', 'low', 'minimal') | ForEach-Object {
        $Count = ($Tasks | Where-Object { $_.priority -eq $_ }).Count
        if ($Count -gt 0) {
            $Icon = switch ($_) {
                'critical' { '🔴' }
                'high' { '🟠' }
                'medium' { '🟡' }
                'low' { '🟢' }
                'minimal' { '🔵' }
            }
            Write-Host "├─ $Icon $($_.ToUpper().PadRight(8)): $($Count.ToString().PadRight(3)) $(if ($Count -gt 5) { '⚠️' } else { '' })"
        }
    }

    # Type distribution
    Write-Host "`n📁 Task Types" -ForegroundColor Green
    $Tasks | Group-Object -Property type | Sort-Object -Property Count -Descending | ForEach-Object {
        Write-Host "├─ $($_.Name.PadRight(15)): $($_.Count)"
    }

    # Health status
    Write-Host "`n💚 Health Status" -ForegroundColor Green
    $HealthScore = if ($CompletionRate -ge 75 -and $Blocked -eq 0) { 100 }
                  elseif ($CompletionRate -ge 50 -and $Blocked -le 2) { 75 }
                  elseif ($CompletionRate -ge 25) { 50 }
                  else { 25 }

    Write-Host "├─ Health Score:       $HealthScore/100" -ForegroundColor $(if ($HealthScore -ge 75) { 'Green' } elseif ($HealthScore -ge 50) { 'Yellow' } else { 'Red' })
    Write-Host "├─ Status:             $(if ($HealthScore -ge 75) { '🟢 Excellent' } elseif ($HealthScore -ge 50) { '🟡 Good' } else { '🔴 Needs Attention' })"
    Write-Host "└─ Blockers:           $Blocked $(if ($Blocked -gt 0) { '⚠️ ACTION NEEDED' } else { '✅ Clear' })"
}

# ═══════════════════════════════════════════════════════════════════════════════
# VELOCITY & CAPACITY FORECAST
# ═══════════════════════════════════════════════════════════════════════════════

function Get-VelocityForecast {
    param([string]$Period)

    Write-Host "`n⚡ VELOCITY ANALYSIS & FORECAST" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Historical data
    $Now = Get-Date
    $DoneWeek1 = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-7) -and
        [datetime]::ParseExact($_.completed, 'o', $null) -le $Now
    }).Count
    $DoneWeek2 = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-14) -and
        [datetime]::ParseExact($_.completed, 'o', $null) -le $Now.AddDays(-7)
    }).Count
    $DoneWeek3 = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-21) -and
        [datetime]::ParseExact($_.completed, 'o', $null) -le $Now.AddDays(-14)
    }).Count
    $DoneWeek4 = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-28) -and
        [datetime]::ParseExact($_.completed, 'o', $null) -le $Now.AddDays(-21)
    }).Count

    Write-Host "`n📊 Historical Velocity" -ForegroundColor Green
    Write-Host "├─ Week 1 (most recent): $DoneWeek1 tasks" -ForegroundColor Yellow
    Write-Host "├─ Week 2:               $DoneWeek2 tasks"
    Write-Host "├─ Week 3:               $DoneWeek3 tasks"
    Write-Host "└─ Week 4:               $DoneWeek4 tasks"

    # Calculate average velocity
    $VelocityData = @($DoneWeek1, $DoneWeek2, $DoneWeek3, $DoneWeek4)
    $AvgVelocity = [math]::Round(($VelocityData | Measure-Object -Average).Average, 1)
    $TrendVelocity = if ($DoneWeek1 -gt $AvgVelocity) { '📈 Increasing' }
                    elseif ($DoneWeek1 -lt $AvgVelocity) { '📉 Decreasing' }
                    else { '➡️ Stable' }

    Write-Host "`n📈 Velocity Analysis" -ForegroundColor Green
    Write-Host "├─ Average Weekly Velocity: $AvgVelocity tasks/week"
    Write-Host "├─ Trend:                   $TrendVelocity"
    Write-Host "└─ Confidence:              $(if ([math]::Abs($DoneWeek1 - $AvgVelocity) -le 2) { 'High ✅' } else { 'Moderate ⚠️' })"

    # Forecast
    Write-Host "`n🔮 Forecasts" -ForegroundColor Green

    $Remaining = ($Tasks | Where-Object { $_.status -ne 'done' }).Count

    switch ($Period) {
        'sprint' {
            $ForecastWeeks = 2
            $SprintCapacity = [math]::Round($AvgVelocity * $ForecastWeeks, 0)
            $CompletionDate = (Get-Date).AddDays([math]::Ceiling($Remaining / $AvgVelocity * 7))

            Write-Host "├─ Next Sprint Capacity (2 weeks): ~$SprintCapacity tasks"
            Write-Host "├─ Tasks Remaining:              $Remaining"
            Write-Host "├─ Projected Sprints Needed:     $([math]::Ceiling($Remaining / $SprintCapacity))"
            Write-Host "└─ Est. Completion:              $($CompletionDate.ToString('yyyy-MM-dd'))"
        }
        'quarter' {
            $ForecastWeeks = 12
            $QuarterCapacity = [math]::Round($AvgVelocity * $ForecastWeeks, 0)
            $CompletionDate = (Get-Date).AddDays([math]::Ceiling($Remaining / $AvgVelocity * 7))

            Write-Host "├─ Quarterly Capacity (13 weeks): ~$QuarterCapacity tasks"
            Write-Host "├─ Tasks Remaining:              $Remaining"
            Write-Host "├─ Projected Quarters Needed:    $([math]::Ceiling($Remaining / $QuarterCapacity))"
            Write-Host "└─ Est. Completion:              $($CompletionDate.ToString('yyyy-MM-dd'))"
        }
        'year' {
            $ForecastWeeks = 52
            $YearCapacity = [math]::Round($AvgVelocity * $ForecastWeeks, 0)

            Write-Host "├─ Annual Capacity (52 weeks): ~$YearCapacity tasks"
            Write-Host "├─ Tasks Remaining:            $Remaining"
            Write-Host "└─ Achievable in 1 year:       $(if ($Remaining -le $YearCapacity) { '✅ YES' } else { '❌ NO - needs $([math]::Ceiling($Remaining / $YearCapacity)) years' })"
        }
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# ROADMAP GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

function New-Roadmap {
    Write-Host "`n🗺️ STRATEGIC ROADMAP" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Calculate velocity
    $Now = Get-Date
    $DoneLastMonth = ($Tasks | Where-Object {
        $_.completed -and
        [datetime]::ParseExact($_.completed, 'o', $null) -gt $Now.AddDays(-30)
    }).Count
    $WeeklyVelocity = [math]::Round($DoneLastMonth / 4.3, 1)

    # Phase planning
    $AllTasks = $Tasks | Where-Object { $_.status -ne 'done' }
    $CriticalTasks = $AllTasks | Where-Object { $_.priority -eq 'critical' }
    $HighPriorityTasks = $AllTasks | Where-Object { $_.priority -eq 'high' }

    # Short-term (2 weeks)
    Write-Host "`n⚡ SHORT-TERM (Sprint - 1-2 weeks)" -ForegroundColor Yellow
    Write-Host "├─ Velocity Available:  $([math]::Round($WeeklyVelocity * 2, 0)) tasks"
    Write-Host "├─ Priority:            Critical & High Priority tasks"
    Write-Host "├─ Tasks to Schedule:   $($CriticalTasks.Count) critical + $($HighPriorityTasks.Count) high"
    Write-Host "├─ Goal:                Clear blockers & critical issues"
    Write-Host "└─ Success Criteria:    ✅ 100% of critical, 50% of high"

    # Medium-term (3 months)
    Write-Host "`n📊 MEDIUM-TERM (Quarter - 3 months)" -ForegroundColor Yellow
    $QuarterCapacity = [math]::Round($WeeklyVelocity * 13, 0)
    $MediumTermTasks = $AllTasks | Where-Object { $_.priority -in @('high', 'medium') } | Select-Object -First 40

    Write-Host "├─ Velocity Available:  $QuarterCapacity tasks"
    Write-Host "├─ Priority:            High & Medium priority"
    Write-Host "├─ Estimated Tasks:     ~$($MediumTermTasks.Count) in scope"
    Write-Host "├─ Major Initiatives:   $(($MediumTermTasks | Group-Object -Property type | Select-Object -First 3 | ForEach-Object { $_.Name }) -join ', ')"
    Write-Host "└─ Success Criteria:    ✅ All high priority + 50% medium"

    # Long-term (6-12 months)
    Write-Host "`n🎯 LONG-TERM (Roadmap - 6-12 months)" -ForegroundColor Yellow
    $YearCapacity = [math]::Round($WeeklyVelocity * 52, 0)
    $TotalRemaining = $AllTasks.Count

    Write-Host "├─ Annual Capacity:     $YearCapacity tasks"
    Write-Host "├─ Total Remaining:     $TotalRemaining tasks"
    Write-Host "├─ Coverage:            $(([math]::Round($YearCapacity / $TotalRemaining * 100, 1)))% of backlog"

    if ($YearCapacity -ge $TotalRemaining) {
        Write-Host "├─ Feasibility:         ✅ Can complete all tasks in 1 year"
        Write-Host "└─ Years Needed:        $(([math]::Ceiling($TotalRemaining / $YearCapacity)))"
    } else {
        Write-Host "├─ Feasibility:         ⚠️ Cannot complete all tasks in 1 year"
        Write-Host "└─ Years Needed:        $([math]::Ceiling($TotalRemaining / $YearCapacity)) years"
    }

    # Vision
    Write-Host "`n🚀 VISION" -ForegroundColor Cyan
    Write-Host "├─ Phase 1 (Sprint):    Address critical issues & unblock work"
    Write-Host "├─ Phase 2 (Quarter):   Implement high-priority features"
    Write-Host "├─ Phase 3 (Year):      Complete roadmap & reach ambitious goals"
    Write-Host "└─ Overall Timeline:    $(([math]::Ceiling($TotalRemaining / $YearCapacity))) years to complete full vision"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

switch ($Analysis) {
    'metrics' {
        Get-TaskMetrics
    }
    'velocity' {
        Get-VelocityForecast -Period $Period
    }
    'forecast' {
        Get-VelocityForecast -Period $Period
    }
    'roadmap' {
        New-Roadmap
    }
    'burndown' {
        Get-TaskMetrics
        Get-VelocityForecast -Period 'sprint'
    }
    'export' {
        # Export to JSON
        Write-Host "📤 Exporting analytics..." -ForegroundColor Cyan
        $ExportData = @{
            timestamp = (Get-Date -AsUTC).ToString('o')
            period = $Period
            metrics = @{
                total = $Tasks.Count
                completed = ($Tasks | Where-Object { $_.status -eq 'done' }).Count
                active = ($Tasks | Where-Object { $_.status -notin @('done', 'cancelled', 'backlog') }).Count
            }
        }
        $ExportPath = Join-Path $TaskRoot "reports/analytics_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
        $ExportData | ConvertTo-Json | Set-Content $ExportPath
        Write-Host "✅ Analytics exported to: $ExportPath" -ForegroundColor Green
    }
}

Write-Host "`n" -ForegroundColor Gray

