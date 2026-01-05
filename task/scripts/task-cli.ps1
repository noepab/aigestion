#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🎯 NEXUS V1 Task CLI - Interactive Task Management Interface

.DESCRIPTION
    Rich terminal interface for task management with real-time updates and analytics
#>

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TaskRoot = Join-Path $ProjectRoot 'task'
$ManagerScript = Join-Path $ScriptDir 'task-manager.ps1'

# Colors and Emojis
$Colors = @{
    Primary = 'Cyan'
    Success = 'Green'
    Warning = 'Yellow'
    Error   = 'Red'
    Accent  = 'Magenta'
}

$Emojis = @{
    Menu      = '📋'
    Add       = '➕'
    View      = '👁️'
    Update    = '✏️'
    Delete    = '🗑️'
    Complete  = '✅'
    Analytics = '📊'
    Plan      = '🎯'
    Exit      = '🚪'
    Arrow     = '→'
}

function Show-Menu {
    Clear-Host
    Write-Host "`n" -ForegroundColor $Colors.Primary
    Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor $Colors.Primary
    Write-Host "║" -ForegroundColor $Colors.Primary -NoNewline; Write-Host "  🎯 NEXUS V1 TASK MANAGEMENT SYSTEM v1.0" -NoNewline; Write-Host " ║" -ForegroundColor $Colors.Primary
    Write-Host "║" -ForegroundColor $Colors.Primary -NoNewline; Write-Host "  Advanced Task Automation & Planning" -NoNewline; Write-Host "    ║" -ForegroundColor $Colors.Primary
    Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor $Colors.Primary

    Write-Host "`n$($Emojis.Menu) MAIN MENU`n" -ForegroundColor $Colors.Primary
    Write-Host "  [1] $($Emojis.Add) Add New Task" -ForegroundColor Cyan
    Write-Host "  [2] $($Emojis.View) View All Tasks" -ForegroundColor Cyan
    Write-Host "  [3] $($Emojis.Update) Update Task" -ForegroundColor Cyan
    Write-Host "  [4] $($Emojis.Complete) Complete Task" -ForegroundColor Cyan
    Write-Host "  [5] $($Emojis.Analytics) Analytics & Insights" -ForegroundColor Cyan
    Write-Host "  [6] $($Emojis.Plan) Planning & Roadmap" -ForegroundColor Cyan
    Write-Host "  [0] $($Emojis.Exit) Exit" -ForegroundColor Yellow
    Write-Host "`n" -ForegroundColor $Colors.Primary
}

function Get-TaskInput {
    Write-Host "`n📝 Task Details" -ForegroundColor $Colors.Primary

    $Title = Read-Host "Task Title (required)"
    if (-not $Title) {
        Write-Host "❌ Title is required" -ForegroundColor $Colors.Error
        return $null
    }

    Write-Host "`nTask Type:" -ForegroundColor Cyan
    @('feature', 'bugfix', 'optimization', 'documentation', 'research', 'devops', 'infrastructure', 'testing', 'refactoring', 'maintenance') |
    ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "  [$i] $_"
        $i++
    }
    $TypeInput = Read-Host "Select type (1-10, default: 1)"
    $TypeInput = if ($TypeInput) { [int]$TypeInput } else { 1 }
    $Type = @('feature', 'bugfix', 'optimization', 'documentation', 'research', 'devops', 'infrastructure', 'testing', 'refactoring', 'maintenance')[$TypeInput - 1]

    Write-Host "`nPriority:" -ForegroundColor Cyan
    @('critical', 'high', 'medium', 'low', 'minimal') |
    ForEach-Object -Begin { $i = 1 } -Process {
        Write-Host "  [$i] $_"
        $i++
    }
    $PriorityInput = Read-Host "Select priority (1-5, default: 3)"
    $PriorityInput = if ($PriorityInput) { [int]$PriorityInput } else { 3 }
    $Priority = @('critical', 'high', 'medium', 'low', 'minimal')[$PriorityInput - 1]

    $Description = Read-Host "Description (optional)"
    $DueDateInput = Read-Host "Due Date (YYYY-MM-DD, optional)"

    return @{
        Title       = $Title
        Type        = $Type
        Priority    = $Priority
        Description = $Description
        DueDate     = $DueDateInput
    }
}

function Show-TaskList {
    Write-Host "`n📋 Loading tasks...`n" -ForegroundColor $Colors.Primary
    & pwsh $ManagerScript -Action list
}

function Show-Analytics {
    Write-Host "`n📊 Loading analytics...`n" -ForegroundColor $Colors.Primary
    & pwsh $ManagerScript -Action analyze
    Read-Host "`nPress Enter to continue"
}

function Show-Planning {
    Write-Host "`n🎯 Planning & Roadmap`n" -ForegroundColor $Colors.Primary
    Write-Host "  [1] Sprint Planning (1-2 weeks)" -ForegroundColor Cyan
    Write-Host "  [2] Quarterly Planning (3 months)" -ForegroundColor Cyan
    Write-Host "  [3] Yearly Roadmap (6-12 months)" -ForegroundColor Cyan

    $Choice = Read-Host "`nSelect planning horizon"
    $Period = switch ($Choice) {
        '1' { 'sprint' }
        '2' { 'quarter' }
        '3' { 'year' }
        default { 'sprint' }
    }

    & pwsh $ManagerScript -Action plan -Period $Period
    Read-Host "`nPress Enter to continue"
}

function Update-TaskInteractive {
    Write-Host "`n✏️ Update Task`n" -ForegroundColor $Colors.Primary
    $TaskId = Read-Host "Task ID"

    if (-not $TaskId) {
        Write-Host "❌ Task ID is required" -ForegroundColor $Colors.Error
        return
    }

    Write-Host "`nUpdate Options:" -ForegroundColor Cyan
    Write-Host "  [1] Change Status" -ForegroundColor Cyan
    Write-Host "  [2] Update Progress" -ForegroundColor Cyan
    Write-Host "  [3] Add Note" -ForegroundColor Cyan

    $UpdateChoice = Read-Host "`nSelect option"

    switch ($UpdateChoice) {
        '1' {
            Write-Host "`nStatus options:" -ForegroundColor Cyan
            @('todo', 'in_progress', 'blocked', 'review', 'testing', 'done', 'cancelled') |
            ForEach-Object -Begin { $i = 1 } -Process {
                Write-Host "  [$i] $_"
                $i++
            }
            $StatusInput = Read-Host "Select status (1-7)"
            $Status = @('todo', 'in_progress', 'blocked', 'review', 'testing', 'done', 'cancelled')[[int]$StatusInput - 1]
            & pwsh $ManagerScript -Action update -TaskId $TaskId -Status $Status
        }
        '2' {
            $Progress = Read-Host "Progress percentage (0-100)"
            Write-Host "💡 Not fully implemented in v1.0" -ForegroundColor Yellow
        }
        '3' {
            $Note = Read-Host "Add note"
            & pwsh $ManagerScript -Action update -TaskId $TaskId -Description $Note
        }
    }
}

function Complete-TaskInteractive {
    Write-Host "`n✅ Complete Task`n" -ForegroundColor $Colors.Primary
    $TaskId = Read-Host "Task ID"

    if ($TaskId) {
        & pwsh $ManagerScript -Action complete -TaskId $TaskId
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN LOOP
# ═══════════════════════════════════════════════════════════════════════════════

$Running = $true

while ($Running) {
    Show-Menu
    $Input = Read-Host "Select option"

    switch ($Input) {
        '1' {
            $TaskData = Get-TaskInput
            if ($TaskData) {
                $Args = @(
                    '-Action', 'add',
                    '-Title', $TaskData.Title,
                    '-Type', $TaskData.Type,
                    '-Priority', $TaskData.Priority
                )
                if ($TaskData.Description) { $Args += @('-Description', $TaskData.Description) }
                if ($TaskData.DueDate) { $Args += @('-DueDate', $TaskData.DueDate) }

                & pwsh $ManagerScript @Args
                Read-Host "`nPress Enter to continue"
            }
        }
        '2' {
            Show-TaskList
            Read-Host "`nPress Enter to continue"
        }
        '3' {
            Update-TaskInteractive
            Read-Host "`nPress Enter to continue"
        }
        '4' {
            Complete-TaskInteractive
            Read-Host "`nPress Enter to continue"
        }
        '5' {
            Show-Analytics
        }
        '6' {
            Show-Planning
        }
        '0' {
            Write-Host "`n👋 Goodbye!`n" -ForegroundColor $Colors.Success
            $Running = $false
        }
        default {
            Write-Host "`n❌ Invalid option. Please try again.`n" -ForegroundColor $Colors.Error
            Read-Host "Press Enter to continue"
        }
    }
}

