#!/usr/bin/env pwsh

<#
.SYNOPSIS
    NEXUS V1 Audit System - Quick Start Setup
.DESCRIPTION
    Instalación y configuración rápida del sistema de auditoría
.USAGE
    .\audit-quickstart.ps1
#>

$ErrorActionPreference = "Stop"

$AuditRoot = "c:\Users\Alejandro\NEXUS V1"
$ScriptsDir = "$AuditRoot\scripts"
$DataDir = "$AuditRoot\audit-data"
$ReportsDir = "$DataDir\reports"

# Verbose traces to mark variables as used and help troubleshooting
Write-Verbose "Scripts dir: $ScriptsDir" -Verbose
Write-Verbose "Reports dir: $ReportsDir" -Verbose

$colors = @{
    Banner  = "Cyan"
    Section = "Magenta"
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Blue"
}

function Write-Centered {
    param(
        [string]$Text,
        [string]$Color = "White"
    )

    $width = 70
    $padding = [math]::Max(0, [math]::Floor(($width - $Text.Length) / 2))
    Write-Host (" " * $padding) -NoNewline
    Write-Host $Text -ForegroundColor $Color
}

function Show-Banner {
    Write-Host ""
    Write-Host "================ NEXUS V1 AUDIT SYSTEM - QUICK START ===============" -ForegroundColor $colors.Banner
    Write-Centered "NEXUS V1 AUDIT SYSTEM - QUICK START" $colors.Banner
    Write-Centered "Configuracion e Instalacion" $colors.Banner
    Write-Host "===============================================================" -ForegroundColor $colors.Banner
    Write-Host ""
}

function TestPrerequisites {
    Write-Host "[CHECKING] VERIFICANDO PREREQUISITOS" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    $allGood = $true

    $psVersion = $PSVersionTable.PSVersion.Major
    Write-Host "  PowerShell: v$psVersion " -NoNewline
    if ($psVersion -ge 5) {
        Write-Host "PASS" -ForegroundColor $colors.Success
    }
    else {
        Write-Host "FAIL (Se requiere v5.0+)" -ForegroundColor $colors.Error
        $allGood = $false
    }

    $git = Get-Command git -ErrorAction SilentlyContinue
    Write-Host "  Git: " -NoNewline
    if ($git) {
        Write-Host "PASS" -ForegroundColor $colors.Success
    }
    else {
        Write-Host "FAIL (Se requiere instalacion de Git)" -ForegroundColor $colors.Error
        $allGood = $false
    }

    $npm = Get-Command npm -ErrorAction SilentlyContinue
    Write-Host "  NPM: " -NoNewline
    if ($npm) {
        Write-Host "PASS" -ForegroundColor $colors.Success
    }
    else {
        Write-Host "FAIL (Se requiere instalacion de Node.js)" -ForegroundColor $colors.Error
        $allGood = $false
    }

    Write-Host "  Directorio NEXUS V1: " -NoNewline
    if (Test-Path $AuditRoot) {
        Write-Host "PASS" -ForegroundColor $colors.Success
    }
    else {
        Write-Host "FAIL (No encontrado: $AuditRoot)" -ForegroundColor $colors.Error
        $allGood = $false
    }

    Write-Host ""

    Write-Verbose "Prerequisites status: $allGood" -Verbose

    if (-not $allGood) {
        Write-Host "[WARNING] Algunos prerequisitos no estan disponibles." -ForegroundColor $colors.Warning
        Write-Host "   Por favor, instala los componentes faltantes y vuelve a intentar." -ForegroundColor $colors.Warning
        Write-Host ""
        return $false
    }

    Write-Host "[SUCCESS] Todos los prerequisitos estan disponibles" -ForegroundColor $colors.Success
    Write-Host ""
    return $true
}

function New-AuditDirectories {
    Write-Host "[CREATE] CREANDO ESTRUCTURA DE DIRECTORIOS" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    $dirs = @($DataDir, $ReportsDir)
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "  CREATED: $dir" -ForegroundColor $colors.Success
        }
        else {
            Write-Host "  EXISTS: $dir" -ForegroundColor $colors.Info
        }
    }

    Write-Host ""
}

function Test-AuditScripts {
    Write-Host "[VERIFY] VERIFICANDO SCRIPTS DEL SISTEMA" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    $scripts = @(
        "audit-control-center.ps1",
        "weekly-auto-audit.ps1",
        "audit-metrics-analyzer.ps1",
        "weekly-audit-dashboard.ps1",
        "setup-weekly-audit-scheduler.ps1"
    )

    $allFound = $true

    foreach ($script in $scripts) {
        $path = "$ScriptsDir\$script"
        if (Test-Path $path) {
            Write-Host "  FOUND: $script" -ForegroundColor $colors.Success
        }
        else {
            Write-Host "  MISSING: $script (NO ENCONTRADO)" -ForegroundColor $colors.Error
            $allFound = $false
        }
    }

    Write-Host ""

    if (-not $allFound) {
        Write-Host "[WARNING] Faltan algunos scripts. Por favor, verifica la instalacion." -ForegroundColor $colors.Warning
        Write-Host ""
        return $false
    }

    Write-Host "[SUCCESS] Todos los scripts estan disponibles" -ForegroundColor $colors.Success
    Write-Host ""
    return $true
}

function Set-AuditScheduler {
    Write-Host "[CONFIG] CONFIGURANDO AUDITORIA AUTOMATICA" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    $taskExists = $null -ne (Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit" -ErrorAction SilentlyContinue)

    if ($taskExists) {
        Write-Host "  INFO: La tarea ya esta programada" -ForegroundColor $colors.Info
        $task = Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit"
        Write-Host "     Estado: $($task.State)" -ForegroundColor $colors.Info
        Write-Host "     Proxima ejecucion: $($task.NextRunTime)" -ForegroundColor $colors.Info
    }
    else {
        Write-Host "  WAITING: Creando tarea programada..." -ForegroundColor $colors.Warning
        try {
            & "$ScriptsDir\setup-weekly-audit-scheduler.ps1" *>$null
            Write-Host "  SUCCESS: Tarea programada creada exitosamente" -ForegroundColor $colors.Success
            Write-Host "     Proxima ejecucion: Proximo lunes a las 8:00 AM" -ForegroundColor $colors.Success
        }
        catch {
            Write-Host "  ERROR: Error al crear tarea: $_" -ForegroundColor $colors.Error
        }
    }

    Write-Host ""
}

function Invoke-FirstAudit {
    Write-Host "[RUN] EJECUTANDO PRIMERA AUDITORIA" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    Write-Host "  WAITING: Recolectando datos iniciales..." -ForegroundColor $colors.Warning
    Write-Host ""

    try {
        & "$ScriptsDir\weekly-auto-audit.ps1"
        Write-Host ""
        Write-Host "  SUCCESS: Primera auditoria completada exitosamente" -ForegroundColor $colors.Success
    }
    catch {
        Write-Host ""
        Write-Host "  WARNING: Error durante la auditoria: $_" -ForegroundColor $colors.Warning
    }

    Write-Host ""
}

function Show-Summary {
    Write-Host "[SUMMARY] RESUMEN DE INSTALACION" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    Write-Host "  Ubicacion: $AuditRoot" -ForegroundColor $colors.Info
    Write-Host "  Datos historicos: $DataDir\audit-history.json" -ForegroundColor $colors.Info
    Write-Host "  Reportes: $ReportsDir\" -ForegroundColor $colors.Info
    Write-Host "  Auditoria automatica: Cada lunes a las 8:00 AM" -ForegroundColor $colors.Info

    Write-Host ""
    Write-Host "[SUCCESS] Sistema de auditoria configurado exitosamente!" -ForegroundColor $colors.Success
    Write-Host ""
}

function Show-Next-Steps {
    Write-Host "[NEXT] PROXIMOS PASOS" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    Write-Host "  1. Control Center (Interfaz principal)" -ForegroundColor $colors.Info
    Write-Host "     Set-Location $ScriptsDir" -ForegroundColor $colors.Warning
    Write-Host "     .\audit-control-center.ps1" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  2. Ejecutar auditoria manual" -ForegroundColor $colors.Info
    Write-Host "     .\audit-control-center.ps1 run" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  3. Ver dashboard de tendencias" -ForegroundColor $colors.Info
    Write-Host "     .\audit-control-center.ps1 dashboard" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  4. Analisis predictivo (despues de 2+ semanas)" -ForegroundColor $colors.Info
    Write-Host "     .\audit-control-center.ps1 analyze" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  5. Ver documentacion completa" -ForegroundColor $colors.Info
    Write-Host "     $AuditRoot\AUDIT_SYSTEM_README.md" -ForegroundColor $colors.Warning
    Write-Host ""
}

function Show-Tips {
    Write-Host "[TIPS] CONSEJOS Y TRUCOS" -ForegroundColor $colors.Section
    Write-Host "════════════════════════════════════════════════════════════════════" -ForegroundColor $colors.Section
    Write-Host ""

    Write-Host "  [TIP] Guardar atajos en PowerShell profile:" -ForegroundColor $colors.Info
    Write-Host "     alias NEXUS V1='$ScriptsDir\audit-control-center.ps1'" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  [TIP] Crear Desktop shortcut:" -ForegroundColor $colors.Info
    Write-Host "     New-Item -Path '`$([Environment]::GetFolderPath("Desktop"))' -ItemType Link -Value '$ScriptsDir\audit-control-center.ps1'" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  [TIP] Ver logs en tiempo real:" -ForegroundColor $colors.Info
    Write-Host "     Get-Content $ReportsDir\*.md | Select-Object -Last 20" -ForegroundColor $colors.Warning
    Write-Host ""

    Write-Host "  [TIP] Exportar datos a Excel:" -ForegroundColor $colors.Info
    Write-Host "     `$history | ConvertTo-Csv | Out-File 'audit-report.csv'" -ForegroundColor $colors.Warning
    Write-Host ""
}

# ============================================================================
# EJECUCION PRINCIPAL
# ============================================================================

Clear-Host
Show-Banner

Write-Host "Este script configurara e instalara el NEXUS V1 Audit System." -ForegroundColor $colors.Info
Write-Host ""

if (-not (TestPrerequisites)) {
    Write-Host "[ERROR] La instalacion no puede continuar debido a prerequisitos faltantes." -ForegroundColor $colors.Error
    Read-Host "Presiona Enter para salir"
    exit 1
}

New-AuditDirectories

if (-not (Test-AuditScripts)) {
    Write-Host "[ERROR] La instalacion no puede continuar debido a scripts faltantes." -ForegroundColor $colors.Error
    Read-Host "Presiona Enter para salir"
    exit 1
}

Set-AuditScheduler

$runAudit = Read-Host "Ejecutar primera auditoria ahora? (s/n)"
if ($runAudit.ToLower() -eq "s") {
    Invoke-FirstAudit
}

Show-Summary
Show-Next-Steps
Show-Tips

Write-Host "[INFO] Documentacion: Para mas informacion, lee AUDIT_SYSTEM_README.md" -ForegroundColor $colors.Info
Write-Host ""

Read-Host "Presiona Enter para finalizar"

