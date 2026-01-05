#!/usr/bin/env pwsh
#Requires -Version 7.0
<#
.SYNOPSIS
    Test suite para los scripts de documentación
.DESCRIPTION
    Valida el funcionamiento de organize-docs, generate-docs-index y show-docs-tree
#>

param([switch]$Verbose, [switch]$Coverage)

$ErrorActionPreference = "Stop"
$ScriptsRoot = Split-Path -Parent $PSScriptRoot
$DocsRoot = Join-Path $ScriptsRoot "docs"
$TestResults = @()

class TestResult {
    [string]$Name
    [bool]$Passed
    [string]$Message
    [timespan]$Duration

    TestResult([string]$Name, [bool]$Passed, [string]$Message, [timespan]$Duration) {
        $this.Name = $Name
        $this.Passed = $Passed
        $this.Message = $Message
        $this.Duration = $Duration
    }
}

function Test-Docs-Exist {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $exists = Test-Path $DocsRoot
    $sw.Stop()
    return [TestResult]::new("Docs directory exists", $exists, "docs/ folder found", $sw.Elapsed)
}

function Test-Organize-Script {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $script = Join-Path $ScriptsRoot "scripts/organize-docs.ps1"
        $null = & $script -DryRun
        $sw.Stop()
        return [TestResult]::new("organize-docs.ps1 dry-run", $true, "Script executed without error", $sw.Elapsed)
    }
    catch {
        $sw.Stop()
        return [TestResult]::new("organize-docs.ps1 dry-run", $false, $_.Message, $sw.Elapsed)
    }
}

function Test-Index-Generation {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $script = Join-Path $ScriptsRoot "scripts/generate-docs-index.ps1"
        $null = & $script
        $sw.Stop()

        $indexPath = Join-Path $DocsRoot "INDEX.md"
        $indexExists = Test-Path $indexPath
        $indexHasContent = (Get-Content $indexPath | Measure-Object -Line).Lines -gt 5

        return [TestResult]::new("generate-docs-index.ps1",
            ($indexExists -and $indexHasContent),
            "INDEX.md generated with content",
            $sw.Elapsed)
    }
    catch {
        $sw.Stop()
        return [TestResult]::new("generate-docs-index.ps1", $false, $_.Message, $sw.Elapsed)
    }
}

function Test-Tree-Text-Format {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $script = Join-Path $ScriptsRoot "scripts/show-docs-tree.ps1"
        $output = & $script -Format Text
        $sw.Stop()

        $success = $output -match "📚|📁|📄"
        return [TestResult]::new("show-docs-tree.ps1 (Text)", $success, "Tree output contains expected elements", $sw.Elapsed)
    }
    catch {
        $sw.Stop()
        return [TestResult]::new("show-docs-tree.ps1 (Text)", $false, $_.Message, $sw.Elapsed)
    }
}

function Test-Tree-JSON-Format {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $script = Join-Path $ScriptsRoot "scripts/show-docs-tree.ps1"
        $output = & $script -Format JSON
        $sw.Stop()

        $json = $output | ConvertFrom-Json -ErrorAction SilentlyContinue
        $success = $null -ne $json
        return [TestResult]::new("show-docs-tree.ps1 (JSON)", $success, "Valid JSON output generated", $sw.Elapsed)
    }
    catch {
        $sw.Stop()
        return [TestResult]::new("show-docs-tree.ps1 (JSON)", $false, $_.Message, $sw.Elapsed)
    }
}

function Test-Index-File-Count {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $content = Get-Content (Join-Path $DocsRoot "INDEX.md") -Raw
    $mdCount = (Get-ChildItem -Path $DocsRoot -Filter "*.md" -Recurse).Count
    $sw.Stop()

    $links = [regex]::Matches($content, "\[.+?\]\(.+?\)").Count
    $success = $links -gt 0

    return [TestResult]::new("INDEX.md contains links", $success, "$links links found", $sw.Elapsed)
}

function Test-Categories-Exist {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $categories = @("server", "overview", "guides", "architecture", "deployment", "api")
    $allExist = $true
    $missing = @()

    foreach ($cat in $categories) {
        $path = Join-Path $DocsRoot $cat
        if (-not (Test-Path $path)) {
            $allExist = $false
            $missing += $cat
        }
    }

    $sw.Stop()
    $msg = if ($missing) { "Missing: $($missing -join ', ')" } else { "All required categories exist" }
    return [TestResult]::new("Core categories exist", $allExist, $msg, $sw.Elapsed)
}

function Test-Markdown-Validity {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $mdFiles = Get-ChildItem -Path $DocsRoot -Filter "*.md" -Recurse
    $validCount = 0
    $errors = @()

    foreach ($file in $mdFiles) {
        try {
            $content = Get-Content $file -ErrorAction Stop
            if ($content.Length -gt 0) { $validCount++ }
        }
        catch {
            $errors += $file.Name
        }
    }

    $sw.Stop()
    $success = $errors.Count -eq 0
    $msg = if ($errors) { "Errors in: $($errors -join ', ')" } else { "All markdown files valid" }

    return [TestResult]::new("Markdown file validity", $success, $msg, $sw.Elapsed)
}

function Test-NPM-Scripts {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $packageJson = Get-Content (Join-Path $ScriptsRoot "package.json") | ConvertFrom-Json
        $scripts = $packageJson.scripts.PSObject.Properties.Name
        $required = @("docs:organize", "docs:index", "docs:tree", "docs:full")

        $allExist = $required | ForEach-Object { $_ -in $scripts } | Where-Object { -not $_ } | Measure-Object | Select-Object -ExpandProperty Count -eq 0

        $sw.Stop()
        return [TestResult]::new("NPM scripts configured", $allExist, "Required scripts found", $sw.Elapsed)
    }
    catch {
        $sw.Stop()
        return [TestResult]::new("NPM scripts configured", $false, $_.Message, $sw.Elapsed)
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN TEST EXECUTION
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "`n🧪 NEXUS V1 Documentation Scripts Test Suite" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host ""

$tests = @(
    { Test-Docs-Exist },
    { Test-Organize-Script },
    { Test-Index-Generation },
    { Test-Tree-Text-Format },
    { Test-Tree-JSON-Format },
    { Test-Index-File-Count },
    { Test-Categories-Exist },
    { Test-Markdown-Validity },
    { Test-NPM-Scripts }
)

$passed = 0
$failed = 0
$totalTime = [timespan]::Zero

foreach ($test in $tests) {
    $result = & $test
    $TestResults += $result

    $status = if ($result.Passed) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "$status | $($result.Name)" -ForegroundColor (if ($result.Passed) { "Green" } else { "Red" })
    Write-Host "         $($result.Message) (${$($result.Duration.TotalMilliseconds)}ms)" -ForegroundColor Gray

    if ($result.Passed) { $passed++ } else { $failed++ }
    $totalTime += $result.Duration
}

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host "✅ Passed: $passed"
Write-Host "❌ Failed: $failed"
Write-Host "⏱️  Total Time: $([math]::Round($totalTime.TotalSeconds, 2))s"
Write-Host "📈 Success Rate: $([math]::Round(($passed / $TestResults.Count) * 100, 2))%"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 All tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "⚠️  Some tests failed. Review above for details." -ForegroundColor Yellow
    exit 1
}

