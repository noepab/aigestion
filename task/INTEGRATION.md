#!/usr/bin/env pwsh
<#
.SYNOPSIS
    📋 NEXUS V1 Task System - Package.json Integration Guide

.DESCRIPTION
    Instructions for integrating task system with NPM scripts
#>

Write-Host @"

╔════════════════════════════════════════════════════════════════════════╗
║                    TASK SYSTEM NPM INTEGRATION GUIDE                  ║
╚════════════════════════════════════════════════════════════════════════╝

Add these scripts to your package.json for convenient task management:

┌────────────────────────────────────────────────────────────────────────┐
│ "scripts": {                                                            │
│   // Task Management                                                    │
│   "task:cli": "pwsh task/scripts/task-cli.ps1",                        │
│   "task:list": "pwsh task/scripts/task-manager.ps1 -Action list -ShowStats", │
│   "task:add": "pwsh task/scripts/task-manager.ps1 -Action add",        │
│                                                                         │
│   // Analytics & Planning                                              │
│   "task:metrics": "pwsh task/scripts/task-analytics.ps1 -Analysis metrics", │
│   "task:velocity": "pwsh task/scripts/task-analytics.ps1 -Analysis velocity", │
│   "task:roadmap": "pwsh task/scripts/task-analytics.ps1 -Analysis roadmap", │
│   "task:plan": "pwsh task/scripts/task-manager.ps1 -Action plan",     │
│                                                                         │
│   // Reporting & Sync                                                  │
│   "task:report": "pwsh task/scripts/task-sync.ps1 -Action report",    │
│   "task:backup": "pwsh task/scripts/task-sync.ps1 -Action backup",    │
│   "task:sync": "pwsh task/scripts/task-sync.ps1 -Action sync",        │
│   "task:export": "pwsh task/scripts/task-sync.ps1 -Action export",    │
│                                                                         │
│   // Initialization                                                     │
│   "task:init": "pwsh task/scripts/task-init.ps1 -Action init",        │
│   "task:sample": "pwsh task/scripts/task-init.ps1 -Action sample",    │
│   "task:setup": "pwsh task/scripts/task-init.ps1 -Action setup",      │
│   "task:help": "pwsh task/scripts/task-init.ps1 -Action info"         │
│ }                                                                       │
└────────────────────────────────────────────────────────────────────────┘

USAGE EXAMPLES:

npm run task:cli                 # Launch interactive task manager
npm run task:list               # Show all tasks with stats
npm run task:metrics            # View KPIs and health metrics
npm run task:roadmap            # Show strategic roadmap
npm run task:report             # Generate weekly report
npm run task:help               # Show quick start guide


DETAILED COMMAND REFERENCE:

Task Management:
  npm run task:cli              Interactive CLI interface
  npm run task:list             List all tasks (with stats)
  npm run task:add              Add new task (interactive)

Analytics:
  npm run task:metrics          Core metrics & KPIs
  npm run task:velocity         Velocity analysis & forecast
  npm run task:roadmap          6-12 month strategic plan
  npm run task:plan             Planning by horizon

Reporting:
  npm run task:report           Generate weekly report
  npm run task:backup           Backup task database
  npm run task:sync             Sync with GitHub
  npm run task:export           Export tasks to JSON/CSV

System:
  npm run task:init             Initialize system
  npm run task:sample           Add sample tasks
  npm run task:setup            Full initialization + samples
  npm run task:help             Show quick start guide


COMMON WORKFLOWS:

Start of Day:
  npm run task:cli              # Launch interactive interface
  npm run task:metrics          # Check health & metrics
  npm run task:list             # See what's due today

Sprint Planning:
  npm run task:list             # Current task list
  npm run task:velocity         # Check velocity
  npm run task:plan             # Plan sprint

Weekly Review:
  npm run task:report           # Generate weekly report
  npm run task:metrics          # Check progress
  npm run task:roadmap          # Confirm direction

Monthly Retrospective:
  npm run task:report           # Monthly report
  npm run task:velocity         # Velocity trend
  npm run task:backup           # Backup current state

Quarterly Planning:
  npm run task:plan             # Quarterly plan
  npm run task:roadmap          # Review full roadmap
  npm run task:export           # Export historical data


AUTOMATION IDEAS:

1. Daily Report
   Add to scheduled task (Windows):
  "schtasks /create /tn NEXUS V1DailyTaskReport /tr \"npm run task:report\" /sc daily /st 08:00"

2. Weekly Backup
   Add to GitHub Actions workflow:
   - name: Weekly Task Backup
     run: npm run task:backup

3. Daily Standup Email
   Combine with email service:
   npm run task:report | send-email "team@company.com"

4. Slack Notifications
   Use with Slack webhook:
   npm run task:metrics | post-slack


TIPS & TRICKS:

✓ Create aliases for frequently used commands:
  alias tlist='npm run task:list'
  alias tmetrics='npm run task:metrics'
  alias tcli='npm run task:cli'

✓ Use in CI/CD pipelines:
  - name: Validate Tasks
    run: npm run task:list

✓ Generate reports on PR/Push:
  npm run task:report | comment-on-pr

✓ Track metrics over time:
  npm run task:export          # Export daily
  # Analyze exported files for trends


DIRECTORY STRUCTURE:

task/
├── config/
│   └── task-config.json       # System configuration
├── data/
│   ├── tasks.json            # Main database
│   ├── analytics.json        # Historical data
│   └── backups/              # Auto-backups
├── scripts/
│   ├── task-manager.ps1      # Core operations
│   ├── task-cli.ps1          # Interactive UI
│   ├── task-analytics.ps1    # Analytics
│   ├── task-sync.ps1         # Sync & reports
│   └── task-init.ps1         # Initialization
├── templates/
│   └── task-templates.json   # Task templates
├── reports/
│   └── report_*.md           # Generated reports
├── README.md                 # Full documentation
├── PLANNING_GUIDE.md         # Planning strategies
└── INTEGRATION.md            # This file


TROUBLESHOOTING:

Issue: PowerShell execution policy
Solution: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Issue: Scripts not found
Solution: Ensure you're in project root directory

Issue: JSON formatting errors
Solution: Validate JSON files in VS Code or online validator

Issue: Permissions denied
Solution: Check that task/ directory is writable


NEXT STEPS:

1. Add scripts to package.json
2. Run: npm run task:help
3. Create sample tasks: npm run task:sample
4. Explore: npm run task:cli
5. Read documentation: task/README.md

"@ -ForegroundColor Cyan

Write-Host "`nFor more details, see: task/README.md`n" -ForegroundColor Green

