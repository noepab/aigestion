#!/usr/bin/env pwsh

<#
.SYNOPSIS
    NEXUS V1 Audit System Control Center - Centro de control del sistema de auditoría
.DESCRIPTION
    Interfaz unificada para ejecutar, programar, analizar y visualizar auditorías
.USAGE
    .\audit-control-center.ps1 [action] [options]

.EXAMPLES
    # Ver panel de control completo
    .\audit-control-center.ps1

    # Ejecutar auditoría manualmente
    .\audit-control-center.ps1 run

    # Ver análisis predictivo
    .\audit-control-center.ps1 analyze

    # Ver dashboard de tendencias
    .\audit-control-center.ps1 dashboard

    # Agendar auditorías automáticas
    .\audit-control-center.ps1 schedule

    # Ver estado del sistema de auditoría
    .\audit-control-center.ps1 status
#>

param(
    [string]$Action = "status",
    [switch]$Force
)

$repoRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$AuditRoot = $repoRoot
$ScriptsDir = Join-Path $AuditRoot "scripts"
$DataDir = Join-Path $AuditRoot "audit-data"
$HistoryFile = "$DataDir\audit-history.json"
$AnalysisFile = "$DataDir\predictive-analysis.json"

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Show-Banner {
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         NEXUS V1 AUDIT SYSTEM - CONTROL CENTER" -ForegroundColor Cyan
    Write-Host "║         Automated Learning-Based Quality Management" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Status {
    Write-Host "📊 ESTADO DEL SISTEMA DE AUDITORÍA" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    # Verificar archivos
    $historyExists = Test-Path $HistoryFile
    $taskExists = $null -ne (Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit" -ErrorAction SilentlyContinue)
    $analysisExists = Test-Path $AnalysisFile

    Write-Host "`n  ✓ Auditoría automática: $(if($taskExists) { '🟢 ACTIVA' } else { '🔴 INACTIVA' })" -ForegroundColor $(if ($taskExists) { 'Green' } else { 'Yellow' })
    Write-Host "  ✓ Datos históricos: $(if($historyExists) { '🟢 DISPONIBLES' } else { '🟡 VACÍOS' })" -ForegroundColor $(if ($historyExists) { 'Green' } else { 'Yellow' })
    Write-Host "  ✓ Análisis predictivo: $(if($analysisExists) { '🟢 ACTUALIZADO' } else { '🟡 SIN DATOS' })" -ForegroundColor $(if ($analysisExists) { 'Green' } else { 'Yellow' })

    # Información de la tarea
    if ($taskExists) {
        $task = Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit"
        $lastRun = $task.LastRunTime
        $nextRun = $task.NextRunTime
        $state = $task.State

        Write-Host "`n  📋 Tarea Programada:" -ForegroundColor Yellow
        Write-Host "     Estado: $state" -ForegroundColor Cyan
        Write-Host "     Última ejecución: $(if($lastRun) { $lastRun } else { 'Nunca' })" -ForegroundColor Cyan
        Write-Host "     Próxima ejecución: $nextRun" -ForegroundColor Cyan
    }

    # Contador de auditorías
    if ($historyExists) {
        $history = Get-Content $HistoryFile | ConvertFrom-Json
        $count = $history.Count
        Write-Host "`n  📈 Auditorías completadas: $count" -ForegroundColor Green
    }

    Write-Host "`n" -ForegroundColor Cyan
}

function Show-Menu {
    Write-Host "🎯 ACCIONES DISPONIBLES" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  [1] 🏃 run       - Ejecutar auditoría manualmente ahora" -ForegroundColor Cyan
    Write-Host "  [2] 🔍 analyze  - Ver análisis predictivo e inteligencia" -ForegroundColor Cyan
    Write-Host "  [3] 📊 dashboard - Ver dashboard de tendencias históricas" -ForegroundColor Cyan
    Write-Host "  [4] ⏰ schedule  - Configurar/verificar agendador automático" -ForegroundColor Cyan
    Write-Host "  [5] 🗑️  clean    - Limpiar datos históricos" -ForegroundColor Cyan
    Write-Host "  [6] 📋 history  - Ver histórico completo de auditorías" -ForegroundColor Cyan
    Write-Host "  [7] ❓ help     - Mostrar ayuda y comandos" -ForegroundColor Cyan
    Write-Host "  [8] 🚪 exit     - Salir del control center" -ForegroundColor Cyan
    Write-Host ""
}

function Run-Audit {
    Write-Host "`n🏃 Ejecutando auditoría manual..." -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    try {
        $auditScript = "$ScriptsDir\weekly-auto-audit.ps1"
        if (-not (Test-Path $auditScript)) {
            Write-Host "❌ Script no encontrado: $auditScript" -ForegroundColor Red
            return
        }

        & $auditScript
        Write-Host "`n✅ Auditoría completada exitosamente" -ForegroundColor Green
    }
    catch {
        Write-Host "`n❌ Error al ejecutar auditoría: $_" -ForegroundColor Red
    }
}

function Run-Analysis {
    Write-Host "`n🔍 Ejecutando análisis predictivo..." -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    try {
        $analysisScript = "$ScriptsDir\audit-metrics-analyzer.ps1"
        if (-not (Test-Path $analysisScript)) {
            Write-Host "❌ Script no encontrado: $analysisScript" -ForegroundColor Red
            return
        }

        & $analysisScript
    }
    catch {
        Write-Host "`n❌ Error al ejecutar análisis: $_" -ForegroundColor Red
    }
}

function Show-Dashboard {
    Write-Host "`n📊 Cargando dashboard de tendencias..." -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    try {
        $dashboardScript = "$ScriptsDir\weekly-audit-dashboard.ps1"
        if (-not (Test-Path $dashboardScript)) {
            Write-Host "❌ Script no encontrado: $dashboardScript" -ForegroundColor Red
            return
        }

        & $dashboardScript
    }
    catch {
        Write-Host "`n❌ Error al mostrar dashboard: $_" -ForegroundColor Red
    }
}

function Setup-Scheduler {
    Write-Host "`n⏰ Configurando agendador automático..." -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

    try {
        $schedulerScript = "$ScriptsDir\setup-weekly-audit-scheduler.ps1"
        if (-not (Test-Path $schedulerScript)) {
            Write-Host "❌ Script no encontrado: $schedulerScript" -ForegroundColor Red
            return
        }

        & $schedulerScript
    }
    catch {
        Write-Host "`n❌ Error al configurar agendador: $_" -ForegroundColor Red
    }
}

function Clean-History {
    Write-Host "`n🗑️  Limpiando datos históricos..." -ForegroundColor Yellow

    $confirm = Read-Host "¿Estás seguro? Esto eliminará todo el histórico de auditorías (s/n)"

    if ($confirm -eq "s") {
        try {
            if (Test-Path $HistoryFile) {
                Remove-Item $HistoryFile -Force
                Write-Host "✅ Datos históricos eliminados" -ForegroundColor Green
            }
            if (Test-Path $AnalysisFile) {
                Remove-Item $AnalysisFile -Force
                Write-Host "✅ Análisis predictivo eliminado" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "❌ Error al limpiar datos: $_" -ForegroundColor Red
        }
    }
    else {
        Write-Host "❌ Operación cancelada" -ForegroundColor Yellow
    }
}

function Show-History {
    Write-Host "`n📋 HISTÓRICO DE AUDITORÍAS" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta

    if (-not (Test-Path $HistoryFile)) {
        Write-Host "`n⚠️  No hay datos históricos disponibles`n" -ForegroundColor Yellow
        return
    }

    try {
        $history = Get-Content $HistoryFile | ConvertFrom-Json -AsHashtable

        Write-Host "`n  Semana          Vulnerabilidades   Archivos   Commits   Estado" -ForegroundColor Yellow
        Write-Host "  ─────────────────────────────────────────────────────────────────" -ForegroundColor Yellow

        $history.GetEnumerator() | Sort-Object -Property Name | ForEach-Object {
            $week = $_.Key
            $data = $_.Value
            $vulns = $data.Security.RootVulnerabilities
            $files = $data.Quality.TotalFiles
            $commits = $data.Quality.RecentCommits
            $status = if ($vulns -eq 0) { "✅" } elseif ($vulns -lt 5) { "🟡" } else { "🔴" }

            Write-Host "  $week          $([string]::Format('{0,18}', $vulns))   $([string]::Format('{0,8}', $files))   $([string]::Format('{0,7}', $commits))   $status" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "`n❌ Error al leer histórico: $_" -ForegroundColor Red
    }

    Write-Host ""
}

function Show-Help {
    Write-Host "`n❓ AYUDA Y DOCUMENTACIÓN" -ForegroundColor Magenta
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "DESCRIPCIÓN:" -ForegroundColor Yellow
    Write-Host "  El sistema de auditoría NEXUS V1 es un sistema inteligente, automático y"
    Write-Host "  basado en aprendizaje que monitorea la salud del proyecto continuamente."
    Write-Host ""
    Write-Host "COMPONENTES:" -ForegroundColor Yellow
    Write-Host "  • weekly-auto-audit.ps1       - Core de recolección de métricas" -ForegroundColor Cyan
    Write-Host "  • audit-metrics-analyzer.ps1  - Motor de análisis predictivo" -ForegroundColor Cyan
    Write-Host "  • weekly-audit-dashboard.ps1  - Visualización de tendencias" -ForegroundColor Cyan
    Write-Host "  • setup-weekly-audit-scheduler.ps1 - Configuración del agendador" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "FLUJO DE DATOS:" -ForegroundColor Yellow
    Write-Host "  1. Auditoría recolecta métricas ➜ audit-history.json" -ForegroundColor Cyan
    Write-Host "  2. Analizador procesa histórico ➜ predictive-analysis.json" -ForegroundColor Cyan
    Write-Host "  3. Dashboard visualiza tendencias ➜ reportes Markdown" -ForegroundColor Cyan
    Write-Host "  4. Agendador ejecuta automáticamente cada lunes" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "MÉTRICAS MONITOREADAS:" -ForegroundColor Yellow
    Write-Host "  • Seguridad: Vulnerabilidades, secretos expuestos" -ForegroundColor Cyan
    Write-Host "  • Calidad: Archivos TS/JS, documentación" -ForegroundColor Cyan
    Write-Host "  • Repositorio: Estado git, commits recientes" -ForegroundColor Cyan
    Write-Host "  • Performance: Dependencias, tamaño" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# LÓGICA PRINCIPAL
# ============================================================================

Show-Banner

# Modo script
if ($Action -ne "status") {
    switch ($Action.ToLower()) {
        "run" { Run-Audit }
        "analyze" { Run-Analysis }
        "dashboard" { Show-Dashboard }
        "schedule" { Setup-Scheduler }
        "clean" { Clean-History }
        "history" { Show-History }
        "help" { Show-Help }
        "exit" { exit 0 }
        default {
            Write-Host "❌ Acción desconocida: $Action" -ForegroundColor Red
            Write-Host "`nAcciones disponibles: run, analyze, dashboard, schedule, clean, history, help, exit, status`n" -ForegroundColor Yellow
        }
    }
    exit 0
}

# Modo interactivo
Show-Status
Show-Menu

do {
    $choice = Read-Host "`n🎯 Selecciona una acción (1-8 o comando)"

    switch ($choice.ToLower()) {
        "1" { Run-Audit }
        "run" { Run-Audit }
        "2" { Run-Analysis }
        "analyze" { Run-Analysis }
        "3" { Show-Dashboard }
        "dashboard" { Show-Dashboard }
        "4" { Setup-Scheduler }
        "schedule" { Setup-Scheduler }
        "5" { Clean-History }
        "clean" { Clean-History }
        "6" { Show-History }
        "history" { Show-History }
        "7" { Show-Help }
        "help" { Show-Help }
        "8" { break }
        "exit" { break }
        "status" { Show-Status }
        default { Write-Host "❌ Opción inválida. Intenta de nuevo." -ForegroundColor Red }
    }

    Read-Host "`nPresiona Enter para continuar"
    Clear-Host
    Show-Banner
    Show-Status
    Show-Menu

} while ($true)

Write-Host "`n👋 Gracias por usar NEXUS V1 Audit System. ¡Hasta pronto!`n" -ForegroundColor Cyan

