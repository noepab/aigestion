#!/usr/bin/env pwsh

$ErrorActionPreference = "Continue"
$AuditRoot = "c:\Users\Alejandro\NEXUS V1"
$ReportDir = "$AuditRoot\audit-reports"
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
$ReportFile = "$ReportDir\AUDIT_COMPLETE_$Timestamp.md"
$startTime = Get-Date

if (-not (Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

Write-Host "=====================================" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "NEXUS V1 COMPREHENSIVE AUDIT SYSTEM" -ForegroundColor Cyan -BackgroundColor Black
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Start Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

$Report = ""
$Report += "# NEXUS V1 Comprehensive Audit Report`n"
$Report += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$Report += "`n---`n`n"

Write-Host "📦 PHASE 1: SECURITY AUDIT" -ForegroundColor Magenta
Write-Host "===========================" -ForegroundColor Magenta
Write-Host ""

# Phase 1.1: NPM Audit - NEXUS V1 Root
Write-Host "🔐 Scanning NEXUS V1 root dependencies..." -ForegroundColor Cyan
Set-Location $AuditRoot
$npmAuditOutput = npm audit --json 2>&1
$auditJson = $null
try {
    $auditJson = $npmAuditOutput | ConvertFrom-Json
    $vulnCount = $auditJson.metadata.vulnerabilities.total
    $highVulns = $auditJson.metadata.vulnerabilities.high
    $criticalVulns = $auditJson.metadata.vulnerabilities.critical

    Write-Host "✓ NPM Audit completed: $vulnCount vulnerabilities found" -ForegroundColor Green
    Write-Host "  - Critical: $criticalVulns" -ForegroundColor $(if ($criticalVulns -gt 0) { "Red" } else { "Green" })
    Write-Host "  - High: $highVulns" -ForegroundColor $(if ($highVulns -gt 0) { "Yellow" } else { "Green" })

    $Report += "`n**Vulnerabilities Found:** $vulnCount (Critical: $criticalVulns, High: $highVulns)`n"

    if ($criticalVulns -gt 0 -or $highVulns -gt 0) {
        $Report += "`n⚠️ **CRITICAL/HIGH VULNERABILITIES DETECTED**`n"
        $Report += "Please run: `npm audit fix` to remediate`n"
    }
}
catch {
    Write-Host "⚠ Could not parse npm audit JSON" -ForegroundColor Yellow
    $Report += "`nℹ️ Could not parse npm audit output (may have formatting issues)`n"
}

# Phase 1.2: NPM Audit - Server
Write-Host ""
Write-Host "🔐 Scanning server dependencies..." -ForegroundColor Cyan
Set-Location "$AuditRoot\server"
$serverAudit = npm audit --json 2>&1
try {
    $serverAuditJson = $serverAudit | ConvertFrom-Json
    $serverVulns = $serverAuditJson.metadata.vulnerabilities.total
    Write-Host "✓ Server vulnerabilities: $serverVulns" -ForegroundColor Green
    $Report += "`n#### Server Vulnerabilities: $serverVulns"
}
catch {
    Write-Host "⚠ Could not scan server" -ForegroundColor Yellow
}

# Phase 1.3: NPM Audit - Client
Write-Host ""
Write-Host "🔐 Scanning client dependencies..." -ForegroundColor Cyan
Set-Location "$AuditRoot\client"
$clientAudit = npm audit --json 2>&1
try {
    $clientAuditJson = $clientAudit | ConvertFrom-Json
    $clientVulns = $clientAuditJson.metadata.vulnerabilities.total
    Write-Host "✓ Client vulnerabilities: $clientVulns" -ForegroundColor Green
    $Report += "`n#### Client Vulnerabilities: $clientVulns"
}
catch {
    Write-Host "⚠ Could not scan client" -ForegroundColor Yellow
}

# Phase 1.4: Gemini-CLI Audit
Write-Host ""
Write-Host "🔐 Scanning gemini-cli dependencies..." -ForegroundColor Cyan
Set-Location "c:\Users\Alejandro\gemini-cli"
$geminiAudit = npm audit --json 2>&1
try {
    $geminiAuditJson = $geminiAudit | ConvertFrom-Json
    $geminiVulns = $geminiAuditJson.metadata.vulnerabilities.total
    Write-Host "✓ Gemini-CLI vulnerabilities: $geminiVulns" -ForegroundColor Green
    $Report += "`n#### Gemini-CLI Vulnerabilities: $geminiVulns"
}
catch {
    Write-Host "⚠ Could not scan gemini-cli" -ForegroundColor Yellow
}

# Phase 2: Code Quality - Linting
Write-Host ""
Write-Host "✨ PHASE 2: CODE QUALITY AUDIT" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

$Report += "`n---`n## Phase 2: Code Quality Audit`n"

Write-Host "🎨 Checking ESLint compliance..." -ForegroundColor Cyan
Set-Location "$AuditRoot"

# Check if eslint exists
$eslintCmd = npm run lint --silent 2>&1
if ($eslintCmd -match "error" -or $eslintCmd -match "eslint") {
    Write-Host "✓ ESLint available" -ForegroundColor Green
    $Report += "`n### Linting Status: ✓ ESLint configured`n"
}
else {
    Write-Host "⚠ ESLint not available or not configured" -ForegroundColor Yellow
    $Report += "`nℹ️ ESLint: Not configured in root`n"
}

# Phase 3: Docker Validation
Write-Host ""
Write-Host "🐳 PHASE 3: INFRASTRUCTURE AUDIT" -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor Magenta
Write-Host ""

$Report += "`n---`n## Phase 3: Infrastructure Audit`n"

# Check Docker Compose
Write-Host "🔧 Validating docker-compose.yml..." -ForegroundColor Cyan
$dcCheck = docker-compose config --quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ docker-compose.yml is valid" -ForegroundColor Green
    $Report += "`n### Docker Compose: ✅ Valid`n"
}
else {
    Write-Host "✗ docker-compose.yml has issues" -ForegroundColor Red
    $Report += "`n### Docker Compose: ❌ Issues found`n$dcCheck`n"
}

# Check Kubernetes manifests
Write-Host "🎯 Validating Kubernetes manifests..." -ForegroundColor Cyan
$k8sDir = "$AuditRoot\k8s"
if (Test-Path $k8sDir) {
    Write-Host "✓ K8s manifests directory exists" -ForegroundColor Green
    $k8sFiles = Get-ChildItem -Path "$k8sDir\*.yaml" -Recurse -ErrorAction SilentlyContinue | Measure-Object
    Write-Host "  Found $($k8sFiles.Count) manifest files" -ForegroundColor Yellow
    $Report += "`n### Kubernetes Manifests: ✅ $($k8sFiles.Count) files found`n"
}
else {
    Write-Host "⚠ K8s manifests directory not found" -ForegroundColor Yellow
    $Report += "`n### Kubernetes Manifests: ⚠️ Directory not found`n"
}

# Phase 4: Build Performance
Write-Host ""
Write-Host "⚡ PHASE 4: PERFORMANCE AUDIT" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta
Write-Host ""

$Report += "`n---`n## Phase 4: Performance Audit`n"

Write-Host "🏗️ Checking build configuration..." -ForegroundColor Cyan
Set-Location "$AuditRoot"

# Check vite config
if (Test-Path "$AuditRoot\vite.config.ts") {
    Write-Host "✓ Vite build configured" -ForegroundColor Green
    $Report += "`n### Build System: ✅ Vite configured`n"
}

# Phase 5: Compliance
Write-Host ""
Write-Host "✅ PHASE 5: COMPLIANCE AUDIT" -ForegroundColor Magenta
Write-Host "==============================" -ForegroundColor Magenta
Write-Host ""

$Report += "`n---`n## Phase 5: Compliance Audit`n"

# Check documentation
Write-Host "📚 Checking documentation..." -ForegroundColor Cyan
$docs = @(
    "README.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "DEPLOYMENT.md"
)
$docsFound = 0
foreach ($doc in $docs) {
    if (Test-Path "$AuditRoot\$doc") {
        Write-Host "✓ $doc found" -ForegroundColor Green
        $docsFound++
    }
}
$Report += "`n### Documentation: ✅ $docsFound/$($docs.Count) key files found`n"

# Check Git status
Write-Host ""
Write-Host "🔗 Checking Git status..." -ForegroundColor Cyan
Set-Location "$AuditRoot"
$gitStatus = git status --short
if ([string]::IsNullOrEmpty($gitStatus)) {
    Write-Host "✓ Working directory clean" -ForegroundColor Green
    $Report += "`n### Git Status: ✅ Clean`n"
}
else {
    Write-Host "⚠ Uncommitted changes detected" -ForegroundColor Yellow
    $Report += "`n### Git Status: ⚠️ $($gitStatus.Split("`n").Count) changes`n"
}

# Get latest commits
$recentCommits = git log --oneline -5
$Report += @"
`n### Recent Commits:
```
$recentCommits
```
"@

# Final Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎉 AUDIT SUMMARY" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan

$Report += "`n---`n## Recommendations`n"
$Report += "`n### Priority 1 (Critical)`n- Run \`npm audit fix\` to remediate vulnerabilities`n- Address any critical security findings`n"
$Report += "`n### Priority 2 (High)`n- Establish 80%+ test coverage target`n- Configure ESLint in all projects`n- Add pre-commit hooks for linting`n"
$Report += "`n### Priority 3 (Medium)`n- Optimize bundle sizes`n- Implement monitoring and alerting`n- Document API endpoints`n"
$Report += "`n---`n`n**Audit Completed:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

# Save report
$Report | Out-File -FilePath $ReportFile -Encoding UTF8
Write-Host "✅ Audit report saved to: $ReportFile" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review audit report: $ReportFile" -ForegroundColor Yellow
Write-Host "2. Run 'npm audit fix' for vulnerabilities" -ForegroundColor Yellow
Write-Host "3. Create issues for Priority 1 & 2 findings" -ForegroundColor Yellow
Write-Host ""
$duration = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 2)
Write-Host "Audit Duration: $duration minutes" -ForegroundColor Magenta

