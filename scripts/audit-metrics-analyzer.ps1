#!/usr/bin/env pwsh

<#
.SYNOPSIS
    NEXUS V1 Audit Metrics Analyzer - Análisis predictivo de tendencias
.DESCRIPTION
    Analiza métricas históricas, detecta patrones y hace predicciones
    sobre el estado futuro del proyecto
.USAGE
    .\audit-metrics-analyzer.ps1
#>

$repoRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$AuditRoot = $repoRoot
$DataDir = Join-Path $AuditRoot "audit-data"
$HistoryFile = Join-Path $DataDir "audit-history.json"
$AnalysisFile = Join-Path $DataDir "predictive-analysis.json"

Write-Host "`n╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        AUDIT METRICS ANALYZER - PREDICTIVE INTELLIGENCE" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# CLASE: Analizador Predictivo
# ============================================================================

class PredictiveAnalyzer {
    [hashtable] $History
    [hashtable] $Analysis = @{}

    PredictiveAnalyzer([string]$historyFile) {
        if (Test-Path $historyFile) {
            $this.History = Get-Content $historyFile | ConvertFrom-Json -AsHashtable
        }
        else {
            $this.History = @{}
        }
    }

    # Calcular promedio de una métrica
    [double] CalculateMetricAverage([string]$metric) {
        $values = @()

        foreach ($week in $this.History.GetEnumerator()) {
            $data = $week.Value
            $value = $this.GetNestedValue($data, $metric)
            if ($null -ne $value -and ($value -is [int] -or $value -is [double])) {
                $values += $value
            }
        }

        if ($values.Count -eq 0) { return 0 }
        return [math]::Round(($values | Measure-Object -Average).Average, 2)
    }

    # Obtener valor anidado
    [object] GetNestedValue([hashtable]$data, [string]$path) {
        $parts = $path.Split('.')
        $current = $data

        foreach ($part in $parts) {
            if ($current -is [hashtable] -and $current.ContainsKey($part)) {
                $current = $current[$part]
            }
            else {
                return $null
            }
        }

        return $current
    }

    # Calcular tendencia lineal
    [double] CalculateTrend([string]$metric, [int]$weeks = 4) {
        $sorted = $this.History.GetEnumerator() | Sort-Object -Property Name
        $recent = $sorted | Select-Object -Last $weeks

        if ($recent.Count -lt 2) { return 0 }

        $values = @()
        foreach ($week in $recent) {
            $value = $this.GetNestedValue($week.Value, $metric)
            if ($value -is [int] -or $value -is [double]) {
                $values += $value
            }
        }

        if ($values.Count -lt 2) { return 0 }

        # Regresión lineal simple
        $n = $values.Count
        $x = @(0..($n - 1))
        $sumX = ($x | Measure-Object -Sum).Sum
        $sumY = ($values | Measure-Object -Sum).Sum
        $sumXY = 0
        $sumXX = 0

        for ($i = 0; $i -lt $n; $i++) {
            $sumXY += $x[$i] * $values[$i]
            $sumXX += $x[$i] * $x[$i]
        }

        $slope = ($n * $sumXY - $sumX * $sumY) / ($n * $sumXX - $sumX * $sumX)
        return [math]::Round($slope, 2)
    }

    # Detectar anomalías
    [object[]] DetectAnomalies() {
        $anomalies = @()

        $sorted = $this.History.GetEnumerator() | Sort-Object -Property Name
        $current = $sorted[-1].Value
        $previous = if ($sorted.Count -gt 1) { $sorted[-2].Value } else { $null }

        if ($null -eq $previous) { return @() }

        # Anomalía 1: Aumento de vulnerabilidades
        $currentVulns = $this.GetNestedValue($current, "Security.RootVulnerabilities")
        $prevVulns = $this.GetNestedValue($previous, "Security.RootVulnerabilities")

        if ($currentVulns -gt $prevVulns) {
            $anomalies += @{
                Type     = "SECURITY"
                Severity = "CRITICAL"
                Message  = "Vulnerabilidades aumentaron de $prevVulns a $currentVulns"
                Change   = ($currentVulns - $prevVulns)
            }
        }

        # Anomalía 2: Archivos sin sincronizar
        $currentDirty = $this.GetNestedValue($current, "Compliance.DirtyFiles")
        if ($currentDirty -gt 10) {
            $anomalies += @{
                Type     = "REPOSITORY"
                Severity = "HIGH"
                Message  = "Hay $currentDirty archivos sin sincronizar"
                Change   = $currentDirty
            }
        }

        # Anomalía 3: Salto grande en dependencias
        $currentDeps = $this.GetNestedValue($current, "Performance.Dependencies")
        $prevDeps = $this.GetNestedValue($previous, "Performance.Dependencies")
        $depChange = [math]::Abs($currentDeps - $prevDeps)

        if ($depChange -gt 20) {
            $anomalies += @{
                Type     = "DEPENDENCIES"
                Severity = "MEDIUM"
                Message  = "Cambio significativo en dependencias: $depChange nuevas/removidas"
                Change   = ($currentDeps - $prevDeps)
            }
        }

        return $anomalies
    }

    # Generar predicciones
    [object[]] GeneratePredictions() {
        $predictions = @()

        # Predicción 1: Trayectoria de vulnerabilidades
        $vulnTrend = $this.CalculateTrend("Security.RootVulnerabilities", 4)
        if ($vulnTrend -gt 0.5) {
            $predictions += @{
                Metric         = "Security Vulnerabilities"
                Trend          = "INCREASING"
                Slope          = $vulnTrend
                Recommendation = "Revisar dependencias próximamente - la tendencia es al alza"
                Confidence     = 0.85
            }
        }
        elseif ($vulnTrend -lt -0.5) {
            $predictions += @{
                Metric         = "Security Vulnerabilities"
                Trend          = "DECREASING"
                Slope          = $vulnTrend
                Recommendation = "Tendencia positiva - mantener el ritmo de mantenimiento"
                Confidence     = 0.85
            }
        }

        # Predicción 2: Crecimiento de código
        $codeTrend = $this.CalculateTrend("Quality.TotalFiles", 4)

        if ($codeTrend -gt 5) {
            $predictions += @{
                Metric         = "Code Growth"
                Trend          = "RAPID_EXPANSION"
                Slope          = $codeTrend
                Recommendation = "Proyecto en crecimiento rápido (+$([math]::Round($codeTrend)) archivos/semana)"
                Confidence     = 0.90
            }
        }

        # Predicción 3: Actividad del repositorio
        $sorted = $this.History.GetEnumerator() | Sort-Object -Property Name
        $recent = $sorted | Select-Object -Last 4

        $avgCommits = 0
        if ($recent.Count -gt 0) {
            $commits = @()
            foreach ($week in $recent) {
                $c = $this.GetNestedValue($week.Value, "Quality.RecentCommits")
                if ($c -is [int]) { $commits += $c }
            }
            $avgCommits = [math]::Round(($commits | Measure-Object -Average).Average)
        }

        if ($avgCommits -gt 8) {
            $predictions += @{
                Metric         = "Repository Activity"
                Trend          = "HIGHLY_ACTIVE"
                Average        = $avgCommits
                Recommendation = "Actividad sostenida - mantener buenas prácticas de git"
                Confidence     = 0.88
            }
        }

        return $predictions
    }

    # Calcular índice de salud
    [hashtable] CalculateHealthScore() {
        $sorted = $this.History.GetEnumerator() | Sort-Object -Property Name
        $current = $sorted[-1].Value

        $scores = @{
            Security    = 10
            Quality     = 10
            Repository  = 10
            Performance = 10
        }

        # Seguridad: -1 por vulnerabilidad
        $vulns = $this.GetNestedValue($current, "Security.RootVulnerabilities")
        $scores.Security = [math]::Max(0, 10 - $vulns)

        # Calidad: -0.5 por archivo faltante de documentación
        $docs = $this.GetNestedValue($current, "Quality.DocumentationCoverage")
        $scores.Quality = 10 - ((3 - $docs) * 0.5)

        # Repositorio: -1 por cada 5 archivos sin sincronizar
        $dirty = $this.GetNestedValue($current, "Compliance.DirtyFiles")
        $scores.Repository = [math]::Max(0, 10 - ($dirty / 5))

        # Performance: -0.1 por cada dependencia de más
        $deps = $this.GetNestedValue($current, "Performance.Dependencies")
        $avgDeps = $this.CalculateMetricAverage("Performance.Dependencies")
        $scores.Performance = [math]::Max(0, 10 - (($deps - $avgDeps) / 10))

        $overall = [math]::Round(
            ($scores.Security + $scores.Quality + $scores.Repository + $scores.Performance) / 4,
            2
        )

        return @{
            Security    = [math]::Max(0, [math]::Round($scores.Security, 1))
            Quality     = [math]::Max(0, [math]::Round($scores.Quality, 1))
            Repository  = [math]::Max(0, [math]::Round($scores.Repository, 1))
            Performance = [math]::Max(0, [math]::Round($scores.Performance, 1))
            Overall     = $overall
            Timestamp   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        }
    }

    # Guardar análisis
    [void] SaveAnalysis([string]$file) {
        $this.Analysis = @{
            Timestamp   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            HealthScore = $this.CalculateHealthScore()
            Anomalies   = $this.DetectAnomalies()
            Predictions = $this.GeneratePredictions()
            Trends      = @{
                Vulnerabilities = $this.CalculateTrend("Security.RootVulnerabilities")
                CodeGrowth      = $this.CalculateTrend("Quality.TotalFiles")
                Dependencies    = $this.CalculateTrend("Performance.Dependencies")
            }
        }

        $this.Analysis | ConvertTo-Json -Depth 10 | Set-Content $file
    }
}

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

try {
    if (-not (Test-Path $HistoryFile)) {
        Write-Host "⚠️  No hay datos históricos. Ejecuta primero: .\weekly-auto-audit.ps1`n" -ForegroundColor Yellow
        exit 1
    }

    $analyzer = [PredictiveAnalyzer]::new($HistoryFile)

    # ────────────────────────────────────────────────────────────────────
    # PANEL 1: PUNTUACIÓN DE SALUD
    # ────────────────────────────────────────────────────────────────────

    Write-Host "💚 ÍNDICE DE SALUD DEL PROYECTO" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    $healthScore = $analyzer.CalculateHealthScore()

    Write-Host "`n  Seguridad:       $($healthScore.Security)/10   " -NoNewline -ForegroundColor Yellow
    Write-Host (Get-HealthBar $healthScore.Security) -ForegroundColor (Get-HealthColor $healthScore.Security)

    Write-Host "  Calidad:         $($healthScore.Quality)/10   " -NoNewline -ForegroundColor Yellow
    Write-Host (Get-HealthBar $healthScore.Quality) -ForegroundColor (Get-HealthColor $healthScore.Quality)

    Write-Host "  Repositorio:     $($healthScore.Repository)/10   " -NoNewline -ForegroundColor Yellow
    Write-Host (Get-HealthBar $healthScore.Repository) -ForegroundColor (Get-HealthColor $healthScore.Repository)

    Write-Host "  Performance:     $($healthScore.Performance)/10   " -NoNewline -ForegroundColor Yellow
    Write-Host (Get-HealthBar $healthScore.Performance) -ForegroundColor (Get-HealthColor $healthScore.Performance)

    Write-Host "`n  ╔════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║ SALUD GENERAL:  $($healthScore.Overall)/10  ║" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════╝`n" -ForegroundColor Cyan

    # ────────────────────────────────────────────────────────────────────
    # PANEL 2: TENDENCIAS
    # ────────────────────────────────────────────────────────────────────

    Write-Host "ANALISIS DE TENDENCIAS (ultimas 4 semanas)" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    $predictions = $analyzer.GeneratePredictions()

    if ($predictions.Count -eq 0) {
        Write-Host "`n  ℹ️  Datos insuficientes para predicciones (se requieren 2+ semanas)`n" -ForegroundColor Gray
    }
    else {
        Write-Host ""
        $predictions | ForEach-Object {
            Write-Host "  [TENDENCIA] $($_.Metric)" -ForegroundColor Yellow
            Write-Host "     Tendencia: $($_.Trend)" -ForegroundColor Cyan
            Write-Host "     $($_.Recommendation)" -ForegroundColor Green
            Write-Host "     Confianza: $([math]::Round($_.Confidence * 100))%" -ForegroundColor Gray
            Write-Host ""
        }
    }

    # ────────────────────────────────────────────────────────────────────
    # PANEL 3: ANOMALÍAS
    # ────────────────────────────────────────────────────────────────────

    Write-Host "`nALERTAS / ANOMALIAS DETECTADAS" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    $anomalies = $analyzer.DetectAnomalies()

    if ($anomalies.Count -eq 0) {
        Write-Host "`n  OK: No se detectaron anomalías`n" -ForegroundColor Green
    }
    else {
        Write-Host ""
        $iconMap = @{
            "CRITICAL" = "[CRIT]"
            "HIGH"     = "[HIGH]"
            "MEDIUM"   = "[MED]"
        }

        $colorMap = @{
            "CRITICAL" = "Red"
            "HIGH"     = "Yellow"
            "MEDIUM"   = "Yellow"
        }

        $anomalies | ForEach-Object {
            $icon = "[OK]"
            if ($iconMap.ContainsKey($_.Severity)) { $icon = $iconMap[$_.Severity] }

            $color = "Green"
            if ($colorMap.ContainsKey($_.Severity)) { $color = $colorMap[$_.Severity] }

            Write-Host "  $icon [$($_.Type)] $($_.Message)" -ForegroundColor $color
        }
        Write-Host ""
    }

    # ────────────────────────────────────────────────────────────────────
    # PANEL 4: PROMEDIOS HISTÓRICOS
    # ────────────────────────────────────────────────────────────────────

    Write-Host "`n📈 PROMEDIOS HISTÓRICOS" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    $avgVulns = $analyzer.CalculateMetricAverage("Security.RootVulnerabilities")
    $avgFiles = $analyzer.CalculateMetricAverage("Quality.TotalFiles")
    $avgDeps = $analyzer.CalculateMetricAverage("Performance.Dependencies")

    Write-Host "`n  Vulnerabilidades promedio: $($avgVulns)" -ForegroundColor Cyan
    Write-Host "  Archivos promedio: $($avgFiles)" -ForegroundColor Cyan
    Write-Host "  Dependencias promedio: $($avgDeps)" -ForegroundColor Cyan

    # Guardar análisis
    $analyzer.SaveAnalysis($AnalysisFile)
    Write-Host "`n  ✓ Análisis guardado en: $AnalysisFile" -ForegroundColor Green

    Write-Host "`n════════════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

}
catch {
    Write-Host "`n❌ Error: $_`n" -ForegroundColor Red
    exit 1
}

# Funciones auxiliares para visualización
function Get-HealthBar {
    param([double]$score)

    $percentage = [math]::Min(100, ($score / 10) * 100)
    $filled = [math]::Round($percentage / 10)
    $empty = 10 - $filled

    $bar = "█" * $filled + "░" * $empty
    return $bar
}

function Get-HealthColor {
    param([double]$score)

    if ($score -ge 8) { return "Green" }
    elseif ($score -ge 6) { return "Yellow" }
    else { return "Red" }
}

