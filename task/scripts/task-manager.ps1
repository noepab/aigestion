#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🎯 NEXUS V1 Task Management System
    Advanced automated task management, tracking, and planning

.DESCRIPTION
    Comprehensive task management system with automation, analytics, and strategic planning
    - Task CRUD operations
    - Sprint planning (short/medium/long term)
    - Automated analytics and forecasting
    - Performance metrics tracking
    - Report generation

.EXAMPLE
    pwsh scripts/task-manager.ps1 -Action add -Title "New Feature" -Type feature -Priority high
    pwsh scripts/task-manager.ps1 -Action list -Filter "status:in_progress"
    pwsh scripts/task-manager.ps1 -Action analyze -Period quarter

.NOTES
    Part of NEXUS V1 Task Management System v1.0
    Requires PowerShell 7.0+
#>

param(
    [ValidateSet('add', 'list', 'update', 'delete', 'complete', 'analyze', 'report', 'plan', 'archive', 'sync')]
    [string]$Action = 'list',

    [string]$Title,
    [ValidateSet('feature', 'bugfix', 'optimization', 'documentation', 'research', 'devops', 'infrastructure', 'testing', 'refactoring', 'maintenance')]
    [string]$Type = 'feature',
    [ValidateSet('critical', 'high', 'medium', 'low', 'minimal')]
    [string]$Priority = 'medium',
    [string]$Description,
    [datetime]$DueDate,
    [ValidateSet('backlog', 'todo', 'in_progress', 'blocked', 'review', 'testing', 'done', 'cancelled')]
    [string]$Status = 'backlog',
    [string[]]$Tags,
    [int]$EstimatedHours = 0,
    [int]$TaskId,
    [string]$Filter,
    [ValidateSet('day', 'week', 'sprint', 'quarter', 'year')]
    [string]$Period = 'week',
    [switch]$Verbose,
    [switch]$ShowStats
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION & INITIALIZATION
# ═══════════════════════════════════════════════════════════════════════════════

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TaskRoot = Join-Path $ProjectRoot 'task'
$ConfigPath = Join-Path $TaskRoot 'config/task-config.json'
$TasksPath = Join-Path $TaskRoot 'data/tasks.json'
$AnalyticsPath = Join-Path $TaskRoot 'data/analytics.json'
$CachePath = Join-Path $TaskRoot 'data/.cache/tasks-cache.json'
$ReportsPath = Join-Path $TaskRoot 'reports'

# Load configuration
$Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$TaskStorage = Get-Content $TasksPath -Raw | ConvertFrom-Json

# Ensure tasks is an array
if ($null -eq $TaskStorage.tasks) {
    $TaskStorage.tasks = @()
}
elseif ($TaskStorage.tasks -isnot [array]) {
    $TaskStorage.tasks = @($TaskStorage.tasks)
}

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

function Write-TaskHeader {
    param([string]$Text)
    Write-Host "`n🎯 $Text" -ForegroundColor Cyan
    Write-Host ('─' * 80) -ForegroundColor Cyan
}

function Write-TaskSuccess {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-TaskWarning {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor Yellow
}

function Write-TaskError {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Get-NextTaskId {
    if ($null -eq $TaskStorage.tasks -or $TaskStorage.tasks.Count -eq 0) {
        return 1
    }
    return ($TaskStorage.tasks | Measure-Object -Property id -Maximum).Maximum + 1
}

function Save-Tasks {
    $TaskStorage.metadata.lastUpdated = (Get-Date -AsUTC).ToString('o')

    # Ensure tasks is always an array
    if ($null -eq $TaskStorage.tasks) {
        $TaskStorage.tasks = @()
    }

    $TaskStorage.metadata.totalTasks = $TaskStorage.tasks.Count

    $completedTasks = @($TaskStorage.tasks | Where-Object { $_.status -eq 'done' })
    $TaskStorage.metadata.completedTasks = $completedTasks.Count

    $activeTasks = @($TaskStorage.tasks | Where-Object { $_.status -notin @('done', 'cancelled', 'backlog') })
    $TaskStorage.metadata.activeTasks = $activeTasks.Count

    $TaskStorage | ConvertTo-Json -Depth 10 | Set-Content $TasksPath -Encoding UTF8
    Write-TaskSuccess "Tasks saved"
}function Get-TaskPriority {
    param([string]$Priority)
    return $Config.priorities.$Priority
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN FUNCTIONS: CRUD OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

function New-Task {
    Write-TaskHeader "Creating New Task"

    if (-not $Title) {
        Write-TaskError "Title is required"
        return
    }

    $TaskId = Get-NextTaskId
    $NewTask = [PSCustomObject]@{
        id             = $TaskId
        title          = $Title
        type           = $Type
        priority       = $Priority
        priorityValue  = (Get-TaskPriority $Priority)
        status         = $Status
        description    = $Description
        tags           = $Tags -join ','
        dueDate        = if ($DueDate) { $DueDate.ToString('yyyy-MM-dd') } else { $null }
        created        = (Get-Date -AsUTC).ToString('o')
        updated        = (Get-Date -AsUTC).ToString('o')
        completed      = $null
        estimatedHours = $EstimatedHours
        actualHours    = 0
        progress       = 0
        assignee       = $env:USERNAME
        dependencies   = @()
        notes          = @()
    }

    $TaskStorage.tasks += $NewTask
    Save-Tasks

    Write-TaskSuccess "Task #$TaskId created: $Title"
    Write-Host "Type: $Type | Priority: $Priority | Status: $Status"
    if ($DueDate) {
        Write-Host "Due: $($DueDate.ToString('yyyy-MM-dd'))"
    }
}

function Get-Tasks {
    Write-TaskHeader "Task List"

    $Tasks = $TaskStorage.tasks

    # Apply filters
    if ($Filter) {
        $FilterParts = $Filter -split ':'
        if ($FilterParts.Count -eq 2) {
            $Property = $FilterParts[0]
            $Value = $FilterParts[1]
            $Tasks = $Tasks | Where-Object { $_.$Property -eq $Value }
        }
    }

    if ($Tasks.Count -eq 0) {
        Write-Host "No tasks found" -ForegroundColor Gray
        return
    }

    # Sort by priority and due date
    $Tasks = $Tasks | Sort-Object -Property @{Expression = 'priorityValue'; Descending = $true }, @{Expression = 'dueDate'; Descending = $false }

    # Display tasks
    $Tasks | ForEach-Object {
        $StatusEmoji = switch ($_.status) {
            'done' { '✅' }
            'in_progress' { '⏳' }
            'blocked' { '🚫' }
            'review' { '👀' }
            'testing' { '🧪' }
            'todo' { '📋' }
            'backlog' { '📦' }
            'cancelled' { '❌' }
            default { '❓' }
        }

        $TypeEmoji = switch ($_.type) {
            'feature' { '⭐' }
            'bugfix' { '🐛' }
            'optimization' { '⚡' }
            'documentation' { '📚' }
            'research' { '🔬' }
            'devops' { '🚀' }
            'infrastructure' { '🏗️' }
            'testing' { '🧪' }
            'refactoring' { '♻️' }
            'maintenance' { '🔧' }
            default { '📌' }
        }

        Write-Host "$('{0:D3}' -f $_.id) $StatusEmoji $TypeEmoji $($_.title)" -ForegroundColor Cyan
        Write-Host "     Type: $($_.type) | Priority: $($_.priority) | Status: $($_.status)" -ForegroundColor Gray
        if ($_.dueDate) {
            Write-Host "     Due: $($_.dueDate) | Progress: $($_.progress)%" -ForegroundColor Gray
        }
    }

    $CompletedCount = @($Tasks | Where-Object { $_.status -eq 'done' }).Count
    Write-Host "`nTotal: $($Tasks.Count) tasks | Completed: $CompletedCount" -ForegroundColor Green
}

function Update-Task {
    param(
        [int]$Id,
        [string]$NewStatus,
        [int]$Progress,
        [string]$Note
    )

    $Task = $TaskStorage.tasks | Where-Object { $_.id -eq $Id }

    if (-not $Task) {
        Write-TaskError "Task #$Id not found"
        return
    }

    if ($NewStatus) {
        $Task.status = $NewStatus
        Write-TaskSuccess "Task #$Id status updated to: $NewStatus"
    }

    if ($Progress) {
        $Task.progress = [Math]::Min($Progress, 100)
        Write-TaskSuccess "Task #$Id progress updated to: $Progress%"
    }

    if ($Note) {
        $Task.notes += @{ text = $Note; timestamp = (Get-Date -AsUTC).ToString('o') }
        Write-TaskSuccess "Note added to task #$Id"
    }

    $Task.updated = (Get-Date -AsUTC).ToString('o')
    Save-Tasks
}

function Complete-Task {
    param([int]$Id)

    $Task = $TaskStorage.tasks | Where-Object { $_.id -eq $Id }

    if (-not $Task) {
        Write-TaskError "Task #$Id not found"
        return
    }

    $Task.status = 'done'
    $Task.completed = (Get-Date -AsUTC).ToString('o')
    $Task.progress = 100
    $Task.updated = (Get-Date -AsUTC).ToString('o')

    Save-Tasks
    Write-TaskSuccess "Task #$Id marked as completed! 🎉"
}

function Remove-Task {
    param([int]$Id)

    $Task = $TaskStorage.tasks | Where-Object { $_.id -eq $Id }

    if (-not $Task) {
        Write-TaskError "Task #$Id not found"
        return
    }

    $TaskStorage.tasks = $TaskStorage.tasks | Where-Object { $_.id -ne $Id }
    Save-Tasks
    Write-TaskSuccess "Task #$Id deleted"
}

# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS & PLANNING
# ═══════════════════════════════════════════════════════════════════════════════

function Invoke-Analytics {
    Write-TaskHeader "Task Analytics & Insights"

    $AllTasks = @($TaskStorage.tasks)
    $CompletedTasks = @($AllTasks | Where-Object { $_.status -eq 'done' })
    $ActiveTasks = @($AllTasks | Where-Object { $_.status -notin @('done', 'cancelled', 'backlog') })
    $BlockedTasks = @($AllTasks | Where-Object { $_.status -eq 'blocked' })

    # Overall Statistics
    Write-Host "`n📊 Overall Statistics" -ForegroundColor Green
    Write-Host "├─ Total Tasks: $($AllTasks.Count)"
    Write-Host "├─ Completed: $($CompletedTasks.Count) ($(([math]::Round(($CompletedTasks.Count / $AllTasks.Count * 100), 1)))%)" -ForegroundColor Green
    Write-Host "├─ Active: $($ActiveTasks.Count)"
    Write-Host "├─ Blocked: $($BlockedTasks.Count)" -ForegroundColor Red
    $BacklogTasks = @($AllTasks | Where-Object { $_.status -eq 'backlog' })
    Write-Host "└─ Backlog: $($BacklogTasks.Count)"

    # By Type
    Write-Host "`n📁 Tasks by Type" -ForegroundColor Green
    $AllTasks | Group-Object -Property type | Sort-Object -Property Count -Descending | ForEach-Object {
        $completedInGroup = @($_.Group | Where-Object { $_.status -eq 'done' })
        Write-Host "├─ $($_.Name): $($_.Count) [✅ $($completedInGroup.Count) done]"
    }

    # By Priority
    Write-Host "`n🔥 Tasks by Priority" -ForegroundColor Green
    @('critical', 'high', 'medium', 'low', 'minimal') | ForEach-Object {
        $priorityTasks = @($AllTasks | Where-Object { $_.priority -eq $_ })
        $count = $priorityTasks.Count
        if ($count -gt 0) {
            $icon = switch ($_) {
                'critical' { '🔴' }
                'high' { '🟠' }
                'medium' { '🟡' }
                'low' { '🟢' }
                'minimal' { '🔵' }
            }
            Write-Host "├─ $icon $($_.ToUpper()): $count"
        }
    }

    # Completion Rate
    if ($CompletedTasks.Count -gt 0) {
        Write-Host "`n📈 Completion Metrics" -ForegroundColor Green
        Write-Host "├─ Completion Rate: $(([math]::Round(($CompletedTasks.Count / $AllTasks.Count * 100), 1)))%"
        Write-Host "├─ Average Tasks/Week: $(([math]::Round(($CompletedTasks.Count / 4), 1)))"
        Write-Host "└─ Estimated Completion Time: $(([math]::Round(($AllTasks.Count / ($CompletedTasks.Count / 4) * 7), 0))) days"
    }

    # Timeline Analysis
    if ($ActiveTasks.Count -gt 0) {
        Write-Host "`n⏰ Timeline Analysis" -ForegroundColor Green
        $UpcomingDeadlines = $ActiveTasks | Where-Object { $_.dueDate } | Sort-Object -Property dueDate | Select-Object -First 5
        if ($UpcomingDeadlines) {
            Write-Host "├─ Upcoming Deadlines:"
            $UpcomingDeadlines | ForEach-Object {
                $daysUntilDue = ([datetime]::ParseExact($_.dueDate, 'yyyy-MM-dd', $null) - (Get-Date).Date).Days
                $urgency = if ($daysUntilDue -lt 3) { '🔴' } elseif ($daysUntilDue -lt 7) { '🟠' } else { '🟢' }
                Write-Host "│  $urgency #$($_.id) - $($_.title) (Due: $($_.dueDate), $daysUntilDue days)"
            }
        }
    }
}

function New-PlanningReport {
    param(
        [ValidateSet('sprint', 'quarter', 'year')]
        [string]$Horizon = 'sprint'
    )

    Write-TaskHeader "Strategic Planning Report - $Horizon"

    $AllTasks = $TaskStorage.tasks
    $SprintConfig = $Config.sprints["$($Horizon)Term"]

    Write-Host "`n📅 Planning Horizon: $($SprintConfig.name)" -ForegroundColor Cyan
    Write-Host "Duration: $($SprintConfig.duration) days | Max Tasks: $($SprintConfig.maxTasks)" -ForegroundColor Gray

    # Sprint Tasks
    Write-Host "`n📋 Current Sprint Tasks ($($SprintConfig.name))" -ForegroundColor Green
    $SprintTasks = $AllTasks | Where-Object { $_.status -notin @('done', 'cancelled') } | Sort-Object -Property priorityValue -Descending | Select-Object -First $SprintConfig.maxTasks

    $SprintTasks | ForEach-Object {
        Write-Host "  #$($_.id) - $($_.title) [$($_.type)] [$($_.priority)]"
    }

    # Capacity Analysis
    $CapacityUsed = $SprintTasks.Count
    $CapacityRemaining = $SprintConfig.maxTasks - $CapacityUsed

    Write-Host "`n💪 Capacity Analysis" -ForegroundColor Green
    Write-Host "├─ Capacity Used: $CapacityUsed/$($SprintConfig.maxTasks) ($([math]::Round(($CapacityUsed / $SprintConfig.maxTasks * 100), 1))%)"
    Write-Host "├─ Capacity Remaining: $CapacityRemaining"
    Write-Host "└─ Utilization: $(if ($CapacityUsed -ge $SprintConfig.maxTasks) { '⚠️  Full' } else { '✅ Available' })"

    # Velocity Forecast
    Write-Host "`n🎯 Velocity Forecast" -ForegroundColor Green
    $CompletedInPeriod = ($AllTasks | Where-Object { $_.status -eq 'done' }).Count
    $DaysInPeriod = if ($Horizon -eq 'sprint') { 14 } elseif ($Horizon -eq 'quarter') { 90 } else { 365 }
    $EstimatedVelocity = [math]::Round(($CompletedInPeriod / $DaysInPeriod * $DaysInPeriod), 0)

    Write-Host "├─ Current Velocity: $CompletedInPeriod completed"
    Write-Host "├─ Period: $DaysInPeriod days"
    Write-Host "└─ Forecast: ~$EstimatedVelocity tasks in next period"

    # Risk Assessment
    $BlockedCount = ($AllTasks | Where-Object { $_.status -eq 'blocked' }).Count
    $OverdueCount = ($AllTasks | Where-Object { $_.dueDate -and [datetime]::ParseExact($_.dueDate, 'yyyy-MM-dd', $null) -lt (Get-Date) -and $_.status -ne 'done' }).Count

    Write-Host "`n⚠️  Risk Assessment" -ForegroundColor Yellow
    Write-Host "├─ Blocked Tasks: $BlockedCount" -ForegroundColor $(if ($BlockedCount -gt 0) { 'Red' } else { 'Green' })
    Write-Host "├─ Overdue Tasks: $OverdueCount" -ForegroundColor $(if ($OverdueCount -gt 0) { 'Red' } else { 'Green' })
    Write-Host "└─ Overall Health: $(if ($BlockedCount -eq 0 -and $OverdueCount -eq 0) { '🟢 Healthy' } else { '🟡 Needs Attention' })"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

switch ($Action) {
    'add' {
        New-Task
    }
    'list' {
        Get-Tasks
        if ($ShowStats) {
            Invoke-Analytics
        }
    }
    'update' {
        if ($TaskId -eq 0) {
            Write-TaskError "Task ID is required for update"
            exit 1
        }
        Update-Task -Id $TaskId -NewStatus $Status -Progress 0 -Note $Description
    }
    'complete' {
        if ($TaskId -eq 0) {
            Write-TaskError "Task ID is required for complete"
            exit 1
        }
        Complete-Task -Id $TaskId
    }
    'delete' {
        if ($TaskId -eq 0) {
            Write-TaskError "Task ID is required for delete"
            exit 1
        }
        Remove-Task -Id $TaskId
    }
    'analyze' {
        Invoke-Analytics
    }
    'plan' {
        New-PlanningReport -Horizon $Period
    }
    'report' {
        New-PlanningReport -Horizon 'sprint'
        New-PlanningReport -Horizon 'quarter'
    }
}

Write-Host "`n" -ForegroundColor Gray

