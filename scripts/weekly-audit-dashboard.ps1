#!/usr/bin/env pwsh

<#
.SYNOPSIS
    NEXUS V1 Auto-Audit Dashboard - Visualizar datos históricos y tendencias
.DESCRIPTION
    Muestra gráficos y análisis de los datos recolectados por el auto-audit semanal
.USAGE
    .\weekly-audit-dashboard.ps1
#>

$AuditRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $AuditRoot) {
    $AuditRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$DataDir = Join-Path $AuditRoot "audit-data"
$HistoryFile = Join-Path $DataDir "audit-history.json"

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        NEXUS V1 WEEKLY AUTO-AUDIT - INTELLIGENCE DASHBOARD" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Cargar datos históricos
if (-not (Test-Path $HistoryFile)) {
    Write-Host "❌ No hay datos históricos. Ejecuta: .\weekly-auto-audit.ps1`n" -ForegroundColor Red
    exit 1
}

try {
    $history = Get-Content $HistoryFile | ConvertFrom-Json -AsHashtable
}
catch {
    Write-Host "❌ Error al cargar datos históricos: $_`n" -ForegroundColor Red
    exit 1
}

# ============================================================================
# PANEL 1: Tendencia de Seguridad
# ============================================================================

Write-Host "🔐 TENDENCIA DE SEGURIDAD" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Host "`n  Semana                  Vulns   Críticas   Altas   Status" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────────" -ForegroundColor Yellow

$history.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
    $week = $_.Key
    $data = $_.Value
    $vulns = $data.Security.RootVulnerabilities
    $critical = $data.Security.Critical
    $high = $data.Security.High

    $status = if ($vulns -eq 0) { "✅ CLEAN" } elseif ($vulns -lt 5) { "🟡 OK" } else { "🔴 ALERT" }

    Write-Host "  $week              $([string]::Format('{0,5}', $vulns))   $([string]::Format('{0,9}', $critical))   $([string]::Format('{0,5}', $high))   $status" -ForegroundColor Cyan
}

# ============================================================================
# PANEL 2: Crecimiento de Código
# ============================================================================

Write-Host "`n`n📈 CRECIMIENTO DEL CÓDIGO" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Host "`n  Semana              Archivos TS   Archivos JS   Total   Tendencia" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────────" -ForegroundColor Yellow

$prevTotal = 0
$history.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
    $week = $_.Key
    $data = $_.Value
    $ts = $data.Quality.TypeScriptFiles
    $js = $data.Quality.JavaScriptFiles
    $total = $ts + $js

    $trend = if ($prevTotal -eq 0) { "-" } `
        elseif ($total -gt $prevTotal) { "↑ +$($total - $prevTotal)" } `
        elseif ($total -lt $prevTotal) { "↓ $($total - $prevTotal)" } `
        else { "→ Stable" }

    Write-Host "  $week                $([string]::Format('{0,11}', $ts))   $([string]::Format('{0,11}', $js))   $([string]::Format('{0,5}', $total))   $trend" -ForegroundColor Cyan

    $prevTotal = $total
}

# ============================================================================
# PANEL 3: Salud del Repositorio
# ============================================================================

Write-Host "`n`n🐙 SALUD DEL REPOSITORIO" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Host "`n  Semana              Archivos Sucios   Commits Recientes   Status" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────────" -ForegroundColor Yellow

$history.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
    $week = $_.Key
    $data = $_.Value
    $dirty = $data.Compliance.DirtyFiles
    $commits = $data.Quality.RecentCommits

    $status = if ($dirty -eq 0) { "✅ CLEAN" } elseif ($dirty -lt 5) { "🟡 NEEDS PUSH" } else { "🔴 DIRTY" }

    Write-Host "  $week                $([string]::Format('{0,16}', $dirty))   $([string]::Format('{0,17}', $commits))   $status" -ForegroundColor Cyan
}

# ============================================================================
# PANEL 4: Dependencias
# ============================================================================

Write-Host "`n`n📦 EVOLUCIÓN DE DEPENDENCIAS" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Host "`n  Semana              Prod Deps   Dev Deps   Total   Tendencia" -ForegroundColor Yellow
Write-Host "  ─────────────────────────────────────────────────────────────────" -ForegroundColor Yellow

$prevDepCount = 0
$history.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
    $week = $_.Key
    $data = $_.Value
    $prodDeps = $data.Performance.Dependencies
    $devDeps = $data.Performance.DevDependencies
    $totalDeps = $prodDeps + $devDeps

    $trend = if ($prevDepCount -eq 0) { "-" } `
        elseif ($totalDeps -gt $prevDepCount) { "↑ +$($totalDeps - $prevDepCount)" } `
        elseif ($totalDeps -lt $prevDepCount) { "↓ $($totalDeps - $prevDepCount)" } `
        else { "→ Stable" }

    Write-Host "  $week                $([string]::Format('{0,9}', $prodDeps))   $([string]::Format('{0,8}', $devDeps))   $([string]::Format('{0,5}', $totalDeps))   $trend" -ForegroundColor Cyan

    $prevDepCount = $totalDeps
}

# ============================================================================
# PANEL 5: Análisis de Tendencias
# ============================================================================

Write-Host "`n`n💡 ANÁLISIS INTELIGENTE DE TENDENCIAS" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

$sorted = $history.GetEnumerator() | Sort-Object -Property Name -Descending
$current = $sorted[0].Value
$previous = if ($sorted.Count -gt 1) { $sorted[1].Value } else { $null }

Write-Host "`n📊 MÉTRICAS CLAVE:" -ForegroundColor Yellow

# Seguridad
Write-Host "`n  🔐 SEGURIDAD:" -ForegroundColor Cyan
Write-Host "    Vulnerabilidades actuales: $($current.Security.RootVulnerabilities)" -ForegroundColor Green

if ($previous) {
    $vulnChange = $current.Security.RootVulnerabilities - $previous.Security.RootVulnerabilities
    if ($vulnChange -eq 0) {
        Write-Host "    Cambio semanal: → Sin cambios ✅" -ForegroundColor Green
    }
    elseif ($vulnChange -gt 0) {
        Write-Host "    Cambio semanal: ↑ +$vulnChange (PREOCUPANTE) 🔴" -ForegroundColor Red
    }
    else {
        Write-Host "    Cambio semanal: ↓ $vulnChange (MEJORA) 🟢" -ForegroundColor Green
    }
}

# Código
Write-Host "`n  📈 CÓDIGO:" -ForegroundColor Cyan
$currentFiles = $current.Quality.TotalFiles
Write-Host "    Archivos de código: $currentFiles" -ForegroundColor Green

if ($previous) {
    $fileChange = $currentFiles - $previous.Quality.TotalFiles
    $growthRate = if ($previous.Quality.TotalFiles -gt 0) {
        [math]::Round(($fileChange / $previous.Quality.TotalFiles) * 100, 2)
    }
    else {
        0
    }

    if ($fileChange -eq 0) {
        Write-Host "    Crecimiento: → Estable" -ForegroundColor Green
    }
    else {
        Write-Host "    Crecimiento: +$fileChange archivos ($growthRate%)" -ForegroundColor Cyan
    }
}

# Repo
Write-Host "`n  🐙 REPOSITORIO:" -ForegroundColor Cyan
if ($current.Compliance.DirtyFiles -eq 0) {
    Write-Host "    Estado: ✅ Limpio y sincronizado" -ForegroundColor Green
}
else {
    Write-Host "    Estado: 🟡 $($current.Compliance.DirtyFiles) archivos sin commitear" -ForegroundColor Yellow
}

# ============================================================================
# PANEL 6: Recomendaciones Basadas en Datos
# ============================================================================

Write-Host "`n`n🎯 RECOMENDACIONES BASADAS EN DATOS" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

$recommendations = @()

# Recomendación 1: Seguridad
if ($current.Security.RootVulnerabilities -gt 0) {
    $recommendations += @{
        Priority = "CRITICAL"
        Icon     = "🔴"
        Text     = "SEGURIDAD: Ejecutar 'npm audit fix' ($($current.Security.RootVulnerabilities) vulnerabilidades)"
    }
}
else {
    $recommendations += @{
        Priority = "INFO"
        Icon     = "✅"
        Text     = "SEGURIDAD: Todas las dependencias están limpias"
    }
}

# Recomendación 2: Código Limpio
if ($current.Compliance.DirtyFiles -gt 5) {
    $recommendations += @{
        Priority = "HIGH"
        Icon     = "🟠"
        Text     = "REPO: Hay $($current.Compliance.DirtyFiles) cambios sin pushear. Sincronizar repositorio"
    }
}

# Recomendación 3: Documentación
if ($current.Quality.DocumentationCoverage -lt 2) {
    $recommendations += @{
        Priority = "MEDIUM"
        Icon     = "🟡"
        Text     = "DOCS: Faltan $([math]::Max(0, 3 - $current.Quality.DocumentationCoverage)) archivos de documentación"
    }
}

# Recomendación 4: Dependencias
if ($current.Performance.Dependencies -gt 150) {
    $recommendations += @{
        Priority = "MEDIUM"
        Icon     = "🟡"
        Text     = "DEPS: $($current.Performance.Dependencies) dependencias de producción. Revisar necesidad"
    }
}

# Recomendación 5: Tendencia
if ($previous) {
    $fileChange = $current.Quality.TotalFiles - $previous.Quality.TotalFiles
    $growthRate = if ($previous.Quality.TotalFiles -gt 0) {
        [math]::Round(($fileChange / $previous.Quality.TotalFiles) * 100, 2)
    }
    else {
        0
    }

    if ($growthRate -gt 30) {
        $recommendations += @{
            Priority = "INFO"
            Icon     = "🚀"
            Text     = "CRECIMIENTO: Proyecto en expansión rápida (+$growthRate% semanal)"
        }
    }
}

Write-Host ""
$recommendations | ForEach-Object {
    $icon = $_.Icon
    $priority = $_.Priority
    $text = $_.Text

    $color = switch ($priority) {
        "CRITICAL" { "Red" }
        "HIGH" { "Yellow" }
        "MEDIUM" { "Yellow" }
        default { "Green" }
    }

    Write-Host "  $icon [$priority] $text" -ForegroundColor $color
}

# ============================================================================
# FOOTER
# ============================================================================

Write-Host "`n`n════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📁 Datos históricos: $HistoryFile" -ForegroundColor Cyan
Write-Host "📁 Reportes: $AuditRoot\audit-data\reports\" -ForegroundColor Cyan
Write-Host "📁 Próximo audit: Siguiente lunes a las 8:00 AM" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

