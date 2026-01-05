#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Configurar Weekly Auto-Audit programado en Windows Task Scheduler
.DESCRIPTION
    Configura una tarea automática que ejecuta el auto-audit cada lunes a las 8:00 AM
.USAGE
    .\setup-weekly-audit-scheduler.ps1
#>

param(
    [string]$ScriptPath = $null,
    [string]$TaskName = "NEXUS V1-Weekly-Auto-Audit",
    [string]$TaskDescription = "NEXUS V1 Weekly Auto-Audit System - Ejecuta auditoría semanal inteligente",
    [string]$ScheduleTime = "08:00",  # 8:00 AM
    [string]$ScheduleDay = "Monday"    # Cada lunes
)

Write-Host "`n" -ForegroundColor Green
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  NEXUS V1 WEEKLY AUTO-AUDIT - SCHEDULER SETUP" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$resolvedAuditRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $ScriptPath) {
    $ScriptPath = Join-Path $resolvedAuditRoot "scripts\weekly-auto-audit.ps1"
}

# Verificar si la tarea ya existe
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Tarea existente detectada: $TaskName" -ForegroundColor Yellow
    Write-Host "Desinstalando tarea anterior...`n" -ForegroundColor Yellow

    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "✓ Tarea anterior removida`n" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error al remover tarea anterior: $_" -ForegroundColor Red
        exit 1
    }
}

# Verificar que el script existe
if (-not (Test-Path $ScriptPath)) {
    Write-Host "✗ Script no encontrado: $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Configurando programación semanal...`n" -ForegroundColor Yellow
Write-Host "  Tarea: $TaskName" -ForegroundColor Cyan
Write-Host "  Script: $ScriptPath" -ForegroundColor Cyan
Write-Host "  Día: $ScheduleDay" -ForegroundColor Cyan
Write-Host "  Hora: $ScheduleTime`n" -ForegroundColor Cyan

# Crear acción (argumento plano para evitar tokens incompletos)
$argument = "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argument

# Crear trigger (cada lunes a las 8:00 AM)
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek $ScheduleDay `
    -At $ScheduleTime

# Configuración de la tarea
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RunOnlyIfNetworkAvailable `
    -StartWhenAvailable

# Principal (ejecutar como usuario actual)
$principal = New-ScheduledTaskPrincipal `
    -UserID "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

# Crear tarea
try {
    $task = Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $TaskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force

    Write-Host "✅ TAREA CREADA EXITOSAMENTE`n" -ForegroundColor Green
}
catch {
    Write-Host "✗ Error al crear tarea: $_" -ForegroundColor Red
    exit 1
}

# Mostrar detalles
Write-Host "╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📋 DETALLES DE LA TAREA:`n" -ForegroundColor Cyan

$task | Select-Object `
@{Name = "Nombre"; Expression = { $_.TaskName } },
@{Name = "Estado"; Expression = { $_.State } },
@{Name = "Próxima Ejecución"; Expression = { $_.Triggers[0].StartBoundary } } |
Format-Table -AutoSize

Write-Host "📅 CRONOGRAMA:`n" -ForegroundColor Cyan
Write-Host "  ✓ Ejecutará cada: $ScheduleDay a las $ScheduleTime" -ForegroundColor Green
Write-Host "  ✓ Próxima ejecución: $(if ($task.Triggers) { $task.Triggers[0].StartBoundary } else { 'Próximo ' + $ScheduleDay })`n" -ForegroundColor Green

$auditRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$reportDir = Join-Path $auditRoot "audit-data\reports"
$historyFile = Join-Path $auditRoot "audit-data\audit-history.json"

Write-Host "📊 REPORTES DISPONIBLES EN:`n" -ForegroundColor Cyan
Write-Host "  📁 $reportDir" -ForegroundColor Yellow
Write-Host "  📁 $historyFile`n" -ForegroundColor Yellow

Write-Host "🔧 COMANDOS ÚTILES:`n" -ForegroundColor Cyan
Write-Host "  Ver tarea:     Get-ScheduledTask -TaskName '$TaskName' | Select-Object *" -ForegroundColor Magenta
Write-Host "  Ejecutar ahora: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Magenta
Write-Host "  Ver historial: Get-ScheduledTaskInfo -TaskName '$TaskName'" -ForegroundColor Magenta
Write-Host "  Desinstalar:   Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false`n" -ForegroundColor Magenta

Write-Host "✨ El auto-audit está configurado y listo para ejecutarse automáticamente" -ForegroundColor Green
Write-Host "`n"

