#!/usr/bin/env pwsh

<#
.SYNOPSIS
    NEXUS V1 Weekly Auto-Audit System - Automated learning-based audit
.DESCRIPTION
    Ejecuta auditoría semanal automática, aprende de datos históricos,
    detecta anomalías y genera reportes comparativos inteligentes
.NOTES
    - Ejecutar cada semana (lunes 8:00 AM)
    - Mantiene histórico en audit-data/
    - Detecta tendencias y anomalías
    - Aprende de cambios semana a semana
#>

$ErrorActionPreference = "Continue"
$AuditRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $AuditRoot) {
    $AuditRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$DataDir = Join-Path $AuditRoot "audit-data"
$HistoryFile = "$DataDir\audit-history.json"
$reportRoot = Join-Path $DataDir "reports"
Write-Verbose "Reports directory: $reportRoot" -Verbose

# Crear directorios
@($DataDir, $reportRoot) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

$Week = (Get-Date -Format "yyyy-ww")

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          NEXUS V1 WEEKLY AUTO-AUDIT SYSTEM" -ForegroundColor Cyan
Write-Host "║          Semana: $Week" -ForegroundColor Cyan
Write-Host "║          Modo: Learning-Based Adaptive" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ============================================================================
# CLASE 1: Recolección de Datos
# ============================================================================

class AuditDataCollector {
    [hashtable] $Data = @{}
    [string] $Timestamp
    [string] $Week

    AuditDataCollector() {
        $this.Timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
        $this.Week = (Get-Date -Format "yyyy-ww")
    }

    [void] CollectSecurity([string]$root) {
        Write-Host "🔐 Recolectando datos de seguridad..." -ForegroundColor Cyan

        $security = @{}

        # NPM Audit
        try {
            $audit = npm audit --json 2>$null | ConvertFrom-Json
            $security.RootVulnerabilities = $audit.metadata.vulnerabilities.total
            $security.Critical = $audit.metadata.vulnerabilities.critical
            $security.High = $audit.metadata.vulnerabilities.high
            $security.Medium = $audit.metadata.vulnerabilities.moderate
            $security.Low = $audit.metadata.vulnerabilities.low
        }
        catch {
            $security.RootVulnerabilities = -1
        }

        # Escanear por secretos
        $security.ExposedSecrets = $this.CountExposedSecrets($root)

        # Verificar archivos sensibles
        $security.SensitiveFilesExposed = $this.CheckSensitiveFiles($root)

        $this.Data.Security = $security
        Write-Host "  ✓ Seguridad recolectada" -ForegroundColor Green
    }

    [void] CollectQuality([string]$root) {
        Write-Host "✨ Recolectando datos de calidad..." -ForegroundColor Cyan

        $quality = @{}

        # Contar archivos y líneas
        $tsFiles = @(Get-ChildItem "$root\**\*.ts" -Exclude node_modules -ErrorAction SilentlyContinue)
        $jsFiles = @(Get-ChildItem "$root\**\*.js" -Exclude node_modules -ErrorAction SilentlyContinue)

        $quality.TypeScriptFiles = $tsFiles.Count
        $quality.JavaScriptFiles = $jsFiles.Count
        $quality.TotalFiles = $tsFiles.Count + $jsFiles.Count

        # Documentación
        $docs = @("README.md", "CONTRIBUTING.md", "CHANGELOG.md")
        $quality.DocumentationCoverage = (
            $docs | Where-Object { Test-Path "$root\$_" } | Measure-Object
        ).Count

        # Commits recientes
        $commits = git log --oneline -10 2>$null
        $quality.RecentCommits = ($commits | Measure-Object).Count

        $this.Data.Quality = $quality
        Write-Host "  ✓ Calidad recolectada" -ForegroundColor Green
    }

    [void] CollectPerformance([string]$root) {
        Write-Host "⚡ Recolectando datos de performance..." -ForegroundColor Cyan

        $performance = @{}

        # Tamaño de dependencias
        $packageJson = Get-Content "$root\package.json" 2>$null | ConvertFrom-Json
        $performance.Dependencies = $packageJson.dependencies.Count
        $performance.DevDependencies = $packageJson.devDependencies.Count

        # Directorios principales
        $performance.DirectoryCount = (Get-ChildItem "$root" -Directory).Count

        $this.Data.Performance = $performance
        Write-Host "  ✓ Performance recolectada" -ForegroundColor Green
    }

    [void] CollectCompliance([string]$root) {
        Write-Host "✅ Recolectando datos de compliance..." -ForegroundColor Cyan

        $compliance = @{}

        # Git status
        $gitStatus = git status --short 2>$null
        $compliance.DirtyFiles = ($gitStatus | Measure-Object).Count

        # Branch
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
        $compliance.Branch = $branch

        # Último commit
        $lastCommit = git log -1 --format="%h" 2>$null
        $compliance.LastCommit = $lastCommit

        $this.Data.Compliance = $compliance
        Write-Host "  ✓ Compliance recolectada" -ForegroundColor Green
    }

    [int] CountExposedSecrets([string]$root) {
        $count = 0
        $patterns = @("password", "secret", "key", "token", "api_key")

        $envFiles = Get-ChildItem "$root\*.env*" -ErrorAction SilentlyContinue
        foreach ($file in $envFiles) {
            $content = Get-Content $file 2>$null
            foreach ($pattern in $patterns) {
                if ($content -match $pattern) {
                    $count++
                }
            }
        }

        return $count
    }

    [int] CheckSensitiveFiles([string]$root) {
        $sensitiveFiles = @(
            "*.pem", "*.key", "*.p12", ".ssh", "secrets.json",
            "config.prod.ts", ".env.production"
        )

        $count = 0
        foreach ($pattern in $sensitiveFiles) {
            $files = @(Get-ChildItem "$root\**\$pattern" -ErrorAction SilentlyContinue)
            $count += $files.Count
        }

        return $count
    }
}

# ============================================================================
# CLASE 2: Análisis Inteligente (Machine Learning simple)
# ============================================================================

class IntelligentAnalyzer {
    [hashtable] $CurrentData
    [hashtable] $HistoricalData = @{}
    [hashtable] $Anomalies = @{}
    [hashtable] $Trends = @{}

    IntelligentAnalyzer([hashtable]$current, [hashtable]$historical) {
        $this.CurrentData = $current
        $this.HistoricalData = $historical
    }

    [void] DetectAnomalies() {
        Write-Host "`n🔍 Detectando anomalías y cambios..." -ForegroundColor Magenta

        $this.Anomalies = @{}

        # Seguridad: Detectar aumento de vulnerabilidades
        if ($this.HistoricalData.Count -gt 0) {
            $lastData = $this.HistoricalData.GetEnumerator() | Select-Object -Last 1

            if ($lastData) {
                $lastVulns = $lastData.Value.Security.RootVulnerabilities
                $currentVulns = $this.CurrentData.Security.RootVulnerabilities

                if ($currentVulns -gt $lastVulns) {
                    $this.Anomalies.VulnerabilityIncrease = @{
                        Previous = $lastVulns
                        Current  = $currentVulns
                        Change   = $currentVulns - $lastVulns
                        Severity = "HIGH"
                    }
                    Write-Host "  ⚠️  ANOMALIA: Vulnerabilidades aumentaron de $lastVulns a $currentVulns" -ForegroundColor Red
                }
            }
        }

        # Archivos sucios: Detectar commits sin pushear
        if ($this.CurrentData.Compliance.DirtyFiles -gt 5) {
            $this.Anomalies.HighDirtyFiles = @{
                Count    = $this.CurrentData.Compliance.DirtyFiles
                Severity = "MEDIUM"
            }
            Write-Host "  ⚠️  ANOMALIA: $($this.CurrentData.Compliance.DirtyFiles) archivos sucios en repo" -ForegroundColor Yellow
        }

        if ($this.Anomalies.Count -eq 0) {
            Write-Host "  ✓ No se detectaron anomalías" -ForegroundColor Green
        }
    }

    [void] AnalyzeTrends() {
        Write-Host "`n📈 Analizando tendencias..." -ForegroundColor Magenta

        $this.Trends = @{}

        if ($this.HistoricalData.Count -lt 2) {
            Write-Host "  ℹ️  Datos insuficientes para análisis de tendencias (necesita 2+ semanas)" -ForegroundColor Yellow
            return
        }

        # Obtener últimas 2 semanas
        $sorted = $this.HistoricalData.GetEnumerator() | Sort-Object -Property Name -Descending | Select-Object -First 2

        if ($sorted.Count -ge 2) {
            $prev = $sorted[1].Value
            $curr = $sorted[0].Value

            # Tendencia de dependencias
            $depChange = $curr.Performance.Dependencies - $prev.Performance.Dependencies
            if ($depChange -ne 0) {
                $this.Trends.DependencyTrend = @{
                    Previous  = $prev.Performance.Dependencies
                    Current   = $curr.Performance.Dependencies
                    Change    = $depChange
                    Direction = if ($depChange -gt 0) { "UP" } else { "DOWN" }
                }
                Write-Host "  📊 Tendencia de dependencias: $($this.Trends.DependencyTrend.Direction) ($depChange)" -ForegroundColor Cyan
            }

            # Tendencia de archivos de código
            $fileChange = $curr.Quality.TotalFiles - $prev.Quality.TotalFiles
            if ($fileChange -ne 0) {
                $this.Trends.CodeGrowth = @{
                    Previous   = $prev.Quality.TotalFiles
                    Current    = $curr.Quality.TotalFiles
                    Change     = $fileChange
                    GrowthRate = [math]::Round(($fileChange / $prev.Quality.TotalFiles) * 100, 2)
                }
                Write-Host "  📊 Crecimiento de código: +$($this.Trends.CodeGrowth.GrowthRate)% ($fileChange archivos)" -ForegroundColor Cyan
            }
        }
    }

    [hashtable] GenerateInsights() {
        Write-Host "`n💡 Generando insights..." -ForegroundColor Magenta

        $insights = @{}

        # Insight 1: Estado de Seguridad
        $vulns = $this.CurrentData.Security.RootVulnerabilities
        if ($vulns -eq 0) {
            $insights.SecurityStatus = "✅ EXCELLENTE - Sin vulnerabilidades"
        }
        elseif ($vulns -lt 5) {
            $insights.SecurityStatus = "🟡 BUENO - Pocas vulnerabilidades"
        }
        else {
            $insights.SecurityStatus = "🔴 CRÍTICO - Muchas vulnerabilidades"
        }

        # Insight 2: Salud del Repositorio
        if ($this.CurrentData.Compliance.DirtyFiles -eq 0) {
            $insights.RepoHealth = "✅ Repositorio limpio y sincronizado"
        }
        else {
            $insights.RepoHealth = "🟡 Hay cambios sin commitear"
        }

        # Insight 3: Crecimiento del Proyecto
        if ($this.Trends.CodeGrowth) {
            $growth = $this.Trends.CodeGrowth.GrowthRate
            if ($growth -lt 5) {
                $insights.ProjectGrowth = "📊 Crecimiento estable (< 5% semanal)"
            }
            elseif ($growth -lt 20) {
                $insights.ProjectGrowth = "📈 Crecimiento moderado ($growth% semanal)"
            }
            else {
                $insights.ProjectGrowth = "🚀 Crecimiento acelerado ($growth% semanal)"
            }
        }

        Write-Host "  $($insights.SecurityStatus)" -ForegroundColor Cyan
        Write-Host "  $($insights.RepoHealth)" -ForegroundColor Cyan
        if ($insights.ProjectGrowth) {
            Write-Host "  $($insights.ProjectGrowth)" -ForegroundColor Cyan
        }

        return $insights
    }
}

# ============================================================================
# EJECUCIÓN PRINCIPAL
# ============================================================================

Write-Host "`n[1/5] Recolectando datos..." -ForegroundColor Yellow

Set-Location $AuditRoot

$collector = [AuditDataCollector]::new()
$collector.CollectSecurity($AuditRoot)
$collector.CollectQuality($AuditRoot)
$collector.CollectPerformance($AuditRoot)
$collector.CollectCompliance($AuditRoot)

$currentData = $collector.Data

# Cargar histórico
$historical = @{}
if (Test-Path $HistoryFile) {
    try {
        $historical = Get-Content $HistoryFile | ConvertFrom-Json -AsHashtable
    }
    catch {
        Write-Host "  ℹ️  Iniciando histórico nuevo" -ForegroundColor Yellow
    }
}

# Análisis inteligente
Write-Host "`n[2/5] Analizando tendencias..." -ForegroundColor Yellow

$analyzer = [IntelligentAnalyzer]::new($currentData, $historical)
$analyzer.DetectAnomalies()
$analyzer.AnalyzeTrends()
$insights = $analyzer.GenerateInsights()

# Guardar datos históricos
$historical[$Week] = $currentData
$historical | ConvertTo-Json -Depth 10 | Set-Content $HistoryFile
Write-Host "`n[3/5] Histórico actualizado" -ForegroundColor Yellow

# Generar reporte semanal
Write-Host "`n[4/5] Generando reporte..." -ForegroundColor Yellow

$reportContent = @"
# 📊 NEXUS V1 Weekly Auto-Audit Report
**Semana:** $Week
**Fecha:** $(Get-Date -Format 'dddd, dd MMMM yyyy - HH:mm:ss')

---

## 🎯 Resumen Ejecutivo

### Estado General
- **Seguridad:** $($insights.SecurityStatus)
- **Repositorio:** $($insights.RepoHealth)
- **Crecimiento:** $($insights.ProjectGrowth)

---

## 🔐 Seguridad

### Vulnerabilidades
- Total: $($currentData.Security.RootVulnerabilities)
- Críticas: $($currentData.Security.Critical)
- Altas: $($currentData.Security.High)
- Medias: $($currentData.Security.Medium)
- Bajas: $($currentData.Security.Low)

### Archivos Sensibles
- Expuestos: $($currentData.Security.SensitiveFilesExposed)
- Secretos detectados: $($currentData.Security.ExposedSecrets)

---

## 📈 Código

### Métricas
- Archivos TypeScript: $($currentData.Quality.TypeScriptFiles)
- Archivos JavaScript: $($currentData.Quality.JavaScriptFiles)
- Total Archivos: $($currentData.Quality.TotalFiles)
- Cobertura Docs: $($currentData.Quality.DocumentationCoverage)/3

### Actividad
- Commits recientes: $($currentData.Quality.RecentCommits)
- Branch actual: $($currentData.Compliance.Branch)
- Último commit: $($currentData.Compliance.LastCommit)

---

## ⚡ Performance

### Dependencias
- Producción: $($currentData.Performance.Dependencies)
- Desarrollo: $($currentData.Performance.DevDependencies)
- Total: $($currentData.Performance.Dependencies + $currentData.Performance.DevDependencies)

### Estructura
- Directorios: $($currentData.Performance.DirectoryCount)

---

## 🔍 Anomalías Detectadas

"@

if ($analyzer.Anomalies.Count -gt 0) {
    $analyzer.Anomalies.GetEnumerator() | ForEach-Object {
        $reportContent += "`n### ⚠️  $($_.Key)`n"
        $_.Value.GetEnumerator() | ForEach-Object {
            $reportContent += "- $($_.Key): $($_.Value)`n"
        }
    }
}
else {
    $reportContent += "`n✅ **No se detectaron anomalías**`n"
}

$reportContent += "`n---`n`n## 📊 Tendencias`n`n"

if ($analyzer.Trends.Count -gt 0) {
    $analyzer.Trends.GetEnumerator() | ForEach-Object {
        $reportContent += "### $($_.Key)`n"
        $_.Value.GetEnumerator() | ForEach-Object {
            $reportContent += "- $($_.Key): $($_.Value)`n"
        }
        $reportContent += "`n"
    }
}
else {
    $reportContent += "ℹ️ Datos insuficientes para análisis de tendencias\n"
}

$reportContent += @"
---

## ✅ Recomendaciones

"@

# Generar recomendaciones basadas en datos
$recommendations = @()

if ($currentData.Security.RootVulnerabilities -gt 0) {
    $recommendations += "🔐 **SEGURIDAD**: Ejecutar `npm audit fix` para resolver $($currentData.Security.RootVulnerabilities) vulnerabilidad(es)"
}

if ($currentData.Compliance.DirtyFiles -gt 5) {
    $recommendations += "📝 **GIT**: Hay $($currentData.Compliance.DirtyFiles) archivos sin commitear. Revisar y pushear cambios"
}

if ($currentData.Quality.DocumentationCoverage -lt 2) {
    $recommendations += "📚 **DOCUMENTACIÓN**: Faltan archivos de documentación. Completar README, CONTRIBUTING, CHANGELOG"
}

if ($currentData.Performance.Dependencies -gt 200) {
    $recommendations += "📦 **DEPENDENCIAS**: $($currentData.Performance.Dependencies) dependencias. Revisar y eliminar no-utilizadas"
}

if ($recommendations.Count -eq 0) {
    $recommendations += "✅ Sin recomendaciones urgentes"
}

$recommendations | ForEach-Object {
    $reportContent += "- $_`n"
}

$reportContent += @"

---

**Reporte generado automáticamente por NEXUS V1 Weekly Auto-Audit System**
**Próximo audit: $(([DateTime]::Now.AddDays(7)).ToString('dddd, dd MMMM yyyy'))**

"@

# Guardar reporte
$reportFile = (Join-Path $reportRoot "WEEKLY_AUDIT_$Week.md")
$reportContent | Out-File -FilePath $reportFile -Encoding UTF8 -Force

Write-Host "  ✓ Reporte guardado: $reportFile" -ForegroundColor Green

# Resumen en consola
Write-Host "`n[5/5] Resumen final" -ForegroundColor Yellow
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              AUTO-AUDIT COMPLETADO" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📊 RESUMEN EJECUTIVO:`n" -ForegroundColor Cyan
Write-Host "  Seguridad:       $($currentData.Security.RootVulnerabilities) vulnerabilidades" -ForegroundColor Yellow
Write-Host "  Archivos TS:     $($currentData.Quality.TypeScriptFiles)" -ForegroundColor Yellow
Write-Host "  Archivos JS:     $($currentData.Quality.JavaScriptFiles)" -ForegroundColor Yellow
Write-Host "  Dependencias:    $($currentData.Performance.Dependencies + $currentData.Performance.DevDependencies)" -ForegroundColor Yellow
Write-Host "  Repo Limpio:     $($currentData.Compliance.DirtyFiles -eq 0)" -ForegroundColor Yellow

Write-Host "`n💡 INSIGHTS:" -ForegroundColor Cyan
$insights.GetEnumerator() | ForEach-Object {
    Write-Host "  - $($_.Value)" -ForegroundColor Green
}

Write-Host "`n🎯 PRÓXIMOS PASOS:" -ForegroundColor Cyan
$recommendations | Select-Object -First 3 | ForEach-Object {
    Write-Host "  - $_" -ForegroundColor Yellow
}

Write-Host "`n📁 Reporte disponible en:" -ForegroundColor Cyan
Write-Host "  $reportFile`n" -ForegroundColor Green

