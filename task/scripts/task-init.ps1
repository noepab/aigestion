#!/usr/bin/env pwsh
<#
.SYNOPSIS
    🎯 NEXUS V1 Task System Initialization & Quick Start

.DESCRIPTION
    Initialize the task system, add sample tasks, and set up automation
#>

param(
    [ValidateSet('init', 'sample', 'setup', 'info')]
    [string]$Action = 'info'
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$TaskRoot = Join-Path $ProjectRoot 'task'
$ManagerScript = Join-Path $ScriptDir 'task-manager.ps1'

function Show-Info {
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  🎯 NEXUS V1 Task Management System - Quick Start Guide" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    Write-Host "`n📚 Documentation" -ForegroundColor Green
    Write-Host "  Read the full guide: task/README.md"
    Write-Host "  Or view online: https://github.com/noepab/NEXUS V1/blob/main/task/README.md"

    Write-Host "`n🚀 Quick Start Commands" -ForegroundColor Green
    Write-Host "  1. Add a task:"
    Write-Host "     pwsh task/scripts/task-manager.ps1 -Action add -Title 'New Feature' -Type feature"
    Write-Host ""
    Write-Host "  2. View all tasks:"
    Write-Host "     pwsh task/scripts/task-manager.ps1 -Action list -ShowStats"
    Write-Host ""
    Write-Host "  3. Interactive CLI:"
    Write-Host "     pwsh task/scripts/task-cli.ps1"
    Write-Host ""
    Write-Host "  4. Analytics:"
    Write-Host "     pwsh task/scripts/task-analytics.ps1 -Analysis metrics"

    Write-Host "`n📊 Available Analysis Types" -ForegroundColor Green
    Write-Host "  • metrics       - KPIs and health status"
    Write-Host "  • velocity      - Velocity analysis and forecast"
    Write-Host "  • forecast      - Capacity forecasting"
    Write-Host "  • roadmap       - Strategic roadmap"
    Write-Host "  • burndown      - Sprint burndown analysis"
    Write-Host "  • export        - Export metrics to JSON"

    Write-Host "`n📝 Planning Horizons" -ForegroundColor Green
    Write-Host "  • Sprint        - 1-2 weeks (15 tasks max)"
    Write-Host "  • Quarter       - 3 months (50 tasks max)"
    Write-Host "  • Year/Roadmap  - 6-12 months (100 tasks max)"

    Write-Host "`n🎯 Create Tasks from Templates" -ForegroundColor Green
    Write-Host "  Feature:  -Type feature -Priority high"
    Write-Host "  Bug:      -Type bugfix -Priority critical"
    Write-Host "  Doc:      -Type documentation -Priority low"
    Write-Host "  Opt:      -Type optimization -Priority medium"

    Write-Host "`n🔧 Configuration" -ForegroundColor Green
    Write-Host "  Edit: task/config/task-config.json"
    Write-Host "  - Customize task types"
    Write-Host "  - Adjust priorities"
    Write-Host "  - Set sprint capacities"
    Write-Host "  - Enable/disable automation"

    Write-Host "`n📈 Key Metrics" -ForegroundColor Green
    Write-Host "  • Completion Rate   - % of tasks done"
    Write-Host "  • Velocity          - Tasks/week completed"
    Write-Host "  • Health Score      - Overall system health (0-100)"
    Write-Host "  • Cycle Time        - Days from start to done"
    Write-Host "  • Blockers          - Tasks stuck (action needed!)"

    Write-Host "`n💡 Pro Tips" -ForegroundColor Yellow
    Write-Host "  ✓ Use 'pwsh task/scripts/task-cli.ps1' for interactive mode"
    Write-Host "  ✓ Generate weekly reports: 'pwsh task/scripts/task-sync.ps1 -Action report'"
    Write-Host "  ✓ Check analytics: 'pwsh task/scripts/task-analytics.ps1 -Analysis roadmap'"
    Write-Host "  ✓ Add -ShowStats to list for instant metrics"
    Write-Host "  ✓ Backup tasks regularly: 'pwsh task/scripts/task-sync.ps1 -Action backup'"

    Write-Host "`n" -ForegroundColor Gray
}

function Initialize-System {
    Write-Host "`n🚀 Initializing Task System..." -ForegroundColor Cyan

    # Verify structure
    $Dirs = @(
        "task/config",
        "task/data",
        "task/scripts",
        "task/templates",
        "task/reports",
        "task/analytics"
    )

    Write-Host "`n✓ Directory Structure" -ForegroundColor Green
    $Dirs | ForEach-Object {
        if (Test-Path (Join-Path $ProjectRoot $_)) {
            Write-Host "  ✅ $_"
        } else {
            Write-Host "  ❌ $_ (missing)"
        }
    }

    # Verify config files
    Write-Host "`n✓ Configuration Files" -ForegroundColor Green
    $ConfigFiles = @(
        "task/config/task-config.json",
        "task/data/tasks.json",
        "task/templates/task-templates.json",
        "task/README.md"
    )

    $ConfigFiles | ForEach-Object {
        if (Test-Path (Join-Path $ProjectRoot $_)) {
            Write-Host "  ✅ $_"
        } else {
            Write-Host "  ❌ $_ (missing)"
        }
    }

    # Verify scripts
    Write-Host "`n✓ Scripts" -ForegroundColor Green
    $Scripts = @(
        "task/scripts/task-manager.ps1",
        "task/scripts/task-cli.ps1",
        "task/scripts/task-analytics.ps1",
        "task/scripts/task-sync.ps1"
    )

    $Scripts | ForEach-Object {
        if (Test-Path (Join-Path $ProjectRoot $_)) {
            Write-Host "  ✅ $_"
        } else {
            Write-Host "  ❌ $_ (missing)"
        }
    }

    Write-Host "`n✅ System initialized successfully!" -ForegroundColor Green
}

function Add-SampleTasks {
    Write-Host "`n📝 Adding Sample Tasks..." -ForegroundColor Cyan

    $SampleTasks = @(
        @{
            Title       = "Set up NEXUS V1 documentation system"
            Type        = "documentation"
            Priority    = "high"
            Description = "Create comprehensive docs for NEXUS V1 project"
            DueDate = "2025-12-14"
        },
        @{
            Title = "Implement authentication system"
            Type = "feature"
            Priority = "critical"
            Description = "OAuth2 and JWT token support"
            DueDate = "2025-12-20"
        },
        @{
            Title = "Fix login page performance"
            Type = "bugfix"
            Priority = "high"
            Description = "Reduce page load time from 3s to <1s"
            DueDate = "2025-12-10"
        },
        @{
            Title = "Refactor database queries"
            Type = "optimization"
            Priority = "medium"
            Description = "Optimize N+1 query issues"
            DueDate = "2025-12-21"
        },
        @{
            Title = "Add unit tests for API"
            Type = "testing"
            Priority = "high"
            Description = "Achieve 80% code coverage"
            DueDate = "2025-12-18"
        },
        @{
            Title = "Research GraphQL vs REST"
            Type = "research"
            Priority = "medium"
            Description = "Evaluate options for API redesign"
            DueDate = "2025-12-25"
        }
    )

    $SampleTasks | ForEach-Object {
        $Args = @(
            '-Action', 'add',
            '-Title', $_.Title,
            '-Type', $_.Type,
            '-Priority', $_.Priority,
            '-Description', $_.Description,
            '-DueDate', $_.DueDate
        )

        & pwsh $ManagerScript @Args 2>&1 | Select-Object -First 1
    }

    Write-Host "`n✅ Sample tasks added!" -ForegroundColor Green
}

function Show-Setup {
    Write-Host "`n⚙️ Setup Complete!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "  1. List your tasks: pwsh task/scripts/task-manager.ps1 -Action list -ShowStats"
    Write-Host "  2. Start interactive mode: pwsh task/scripts/task-cli.ps1"
    Write-Host "  3. View analytics: pwsh task/scripts/task-analytics.ps1 -Analysis metrics"
    Write-Host "  4. Read the docs: task/README.md"
    Write-Host ""
}

# Main execution
switch ($Action) {
    'init' {
        Initialize-System
    }
    'sample' {
        Add-SampleTasks
    }
    'setup' {
        Initialize-System
        Add-SampleTasks
        Show-Setup
    }
    'info' {
        Show-Info
    }
}

Write-Host ""

