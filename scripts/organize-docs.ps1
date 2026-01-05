#!/usr/bin/env pwsh
#Requires -Version 7.0
param([switch]$DryRun, [switch]$Verbose, [switch]$Validate)
$ErrorActionPreference = "Stop"

$DocsRoot = Join-Path (Split-Path -Parent $PSScriptRoot) "docs"
$ExcludePatterns = @("node_modules", ".git", ".venv", "proyectos", "packages", "apps", "node", "htmlcov", ".cache")

# 25+ Reglas de categorización avanzadas
$Rules = @{
    "server"       = @("server", "api", "rest", "endpoint", "route", "middleware", "auth", "backend", "express", "fastify")
    "overview"     = @("overview", "introduction", "getting-started", "setup", "install", "quickstart", "startup")
    "guides"       = @("guide", "tutorial", "how-to", "manual", "handbook", "step-by-step")
    "architecture" = @("architecture", "design", "pattern", "structure", "diagram", "schema")
    "deployment"   = @("deploy", "docker", "kubernetes", "k8s", "infra", "infrastructure", "helm", "aws", "azure")
    "api"          = @("api", "openapi", "swagger", "endpoint", "graphql", "rest")
    "reference"    = @("reference", "cheatsheet", "quick", "lookup", "reference-guide")
    "ai-learning"  = @("ai", "machine-learning", "ml", "neural", "training", "model", "llm")
    "audit"        = @("audit", "security", "compliance", "scan", "report")
    "reports"      = @("report", "analysis", "metrics", "summary", "evaluation")
    "scripts"      = @("script", "automation", "powershell", "bash", "tool")
}

$files = Get-ChildItem -Path (Split-Path -Parent $DocsRoot) -Filter "*.md" -Recurse -ErrorAction SilentlyContinue |
Where-Object { $p = $_.DirectoryName; -not ($ExcludePatterns | Where-Object { $p -match $_ }) }

$moved = 0
$failed = 0
$skipped = 0

$files | ForEach-Object {
    $dest = Join-Path $DocsRoot "reference"  # Default fallback
    $matched = $false

    $Rules.GetEnumerator() | ForEach-Object {
        if ($matched) { return }
        $rule = $_
        $rule.Value | ForEach-Object {
            # Case-insensitive pattern matching
            if ($_.Name -match [regex]::Escape($_)) {
                $dest = Join-Path $DocsRoot $rule.Key
                $matched = $true
            }
        }
    }

    # Validation
    if (-not (Test-Path $_)) {
        Write-Host "  ⚠️  File not found: $($_.Name)" -ForegroundColor Yellow
        $skipped++
        return
    }

    # Create destination if needed
    if (-not (Test-Path $dest)) {
        New-Item -Path $dest -ItemType Directory -Force | Out-Null
    }

    $target = Join-Path $dest $_.Name

    # Safety check - don't overwrite
    if (Test-Path $target) {
        Write-Host "  🔄 Already exists: $($_.Name)" -ForegroundColor Cyan
        $skipped++
        return
    }

    $relPath = [System.IO.Path]::GetRelativePath($DocsRoot, $dest)
    Write-Host "  ✅ $($_.Name) → $relPath" -ForegroundColor Green

    if (-not $DryRun) {
        Move-Item -Path $_.FullName -Destination $target -Force -ErrorAction SilentlyContinue
        $moved++
    }
}

Write-Host ""
Write-Host "📊 Results: $moved moved | $skipped skipped | $failed failed" -ForegroundColor Yellow
