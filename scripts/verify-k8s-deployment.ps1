#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verifica el estado del deployment en Kubernetes
.DESCRIPTION
    Script de validación que verifica todos los componentes desplegados
    en el namespace 'NEXUS V1' y genera un reporte del estado.
#>

param(
    [switch]$Detailed
)

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  🔍 Verificación de Deployment en Kubernetes                    ║" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que kubectl está disponible
try {
    $null = kubectl version --client 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ kubectl no está disponible" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ kubectl no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar que el namespace existe
Write-Host "📋 VERIFICANDO NAMESPACE..." -ForegroundColor Yellow
$namespace = kubectl get namespace NEXUS V1 -o jsonpath='{.metadata.name}' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Namespace 'NEXUS V1' no existe" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Namespace 'NEXUS V1' encontrado" -ForegroundColor Green
Write-Host ""

# Verificar pods
Write-Host "📋 VERIFICANDO PODS..." -ForegroundColor Yellow
Write-Host ""

$pods = kubectl get pods -n NEXUS V1 -o json | ConvertFrom-Json

$totalPods = $pods.items.Count
$runningPods = ($pods.items | Where-Object { $_.status.phase -eq "Running" }).Count
$readyPods = ($pods.items | Where-Object {
        $_.status.conditions | Where-Object { $_.type -eq "Ready" -and $_.status -eq "True" }
    }).Count

Write-Host "   Total de pods: $totalPods" -ForegroundColor White
Write-Host "   Pods Running: $runningPods" -ForegroundColor $(if ($runningPods -eq $totalPods) { "Green" } else { "Yellow" })
Write-Host "   Pods Ready: $readyPods" -ForegroundColor $(if ($readyPods -eq $totalPods) { "Green" } else { "Yellow" })
Write-Host ""

# Mostrar estado de cada pod
foreach ($pod in $pods.items) {
    $podName = $pod.metadata.name
    $phase = $pod.status.phase
    $ready = $pod.status.containerStatuses[0].ready
    $restarts = $pod.status.containerStatuses[0].restartCount

    $status = if ($ready) { "✅" } else { "⚠️ " }
    $color = if ($ready) { "Green" } else { "Yellow" }

    Write-Host "   $status $podName" -ForegroundColor $color -NoNewline
    Write-Host " - $phase (Reinicios: $restarts)" -ForegroundColor Gray
}

Write-Host ""

# Verificar servicios
Write-Host "📋 VERIFICANDO SERVICIOS..." -ForegroundColor Yellow
Write-Host ""

$services = kubectl get svc -n NEXUS V1 -o json | ConvertFrom-Json
$totalServices = $services.items.Count

Write-Host "   Total de servicios: $totalServices" -ForegroundColor White
Write-Host ""

foreach ($svc in $services.items) {
    $svcName = $svc.metadata.name
    $svcType = $svc.spec.type
    $ports = $svc.spec.ports.Count

    Write-Host "   ✅ $svcName" -ForegroundColor Green -NoNewline
    Write-Host " - $svcType ($ports puerto(s))" -ForegroundColor Gray
}

Write-Host ""

# Verificar PVCs
Write-Host "📋 VERIFICANDO ALMACENAMIENTO..." -ForegroundColor Yellow
Write-Host ""

$pvcs = kubectl get pvc -n NEXUS V1 -o json | ConvertFrom-Json
$totalPVCs = $pvcs.items.Count
$boundPVCs = ($pvcs.items | Where-Object { $_.status.phase -eq "Bound" }).Count

Write-Host "   Total de PVCs: $totalPVCs" -ForegroundColor White
Write-Host "   PVCs Bound: $boundPVCs" -ForegroundColor $(if ($boundPVCs -eq $totalPVCs) { "Green" } else { "Yellow" })
Write-Host ""

$totalStorage = 0
foreach ($pvc in $pvcs.items) {
    $pvcName = $pvc.metadata.name
    $status = $pvc.status.phase
    $capacity = $pvc.status.capacity.storage

    # Convertir a número para suma
    if ($capacity -match '(\d+)Gi') {
        $totalStorage += [int]$Matches[1]
    }

    $statusIcon = if ($status -eq "Bound") { "✅" } else { "⚠️ " }
    $color = if ($status -eq "Bound") { "Green" } else { "Yellow" }

    Write-Host "   $statusIcon $pvcName" -ForegroundColor $color -NoNewline
    Write-Host " - $capacity" -ForegroundColor Gray
}

Write-Host ""
Write-Host "   📊 Almacenamiento total: ${totalStorage}Gi" -ForegroundColor Cyan
Write-Host ""

# Verificar deployments y statefulsets
Write-Host "📋 VERIFICANDO WORKLOADS..." -ForegroundColor Yellow
Write-Host ""

$deployments = kubectl get deployment -n NEXUS V1 -o json 2>$null | ConvertFrom-Json
if ($deployments.items) {
    foreach ($deploy in $deployments.items) {
        $deployName = $deploy.metadata.name
        $replicas = $deploy.spec.replicas
        $ready = $deploy.status.readyReplicas

        if ($null -eq $ready) { $ready = 0 }

        $statusIcon = if ($ready -eq $replicas) { "✅" } else { "⚠️ " }
        $color = if ($ready -eq $replicas) { "Green" } else { "Yellow" }

        Write-Host "   $statusIcon Deployment: $deployName" -ForegroundColor $color -NoNewline
        Write-Host " ($ready/$replicas ready)" -ForegroundColor Gray
    }
}

$statefulsets = kubectl get statefulset -n NEXUS V1 -o json 2>$null | ConvertFrom-Json
if ($statefulsets.items) {
    foreach ($sts in $statefulsets.items) {
        $stsName = $sts.metadata.name
        $replicas = $sts.spec.replicas
        $ready = $sts.status.readyReplicas

        if ($null -eq $ready) { $ready = 0 }

        $statusIcon = if ($ready -eq $replicas) { "✅" } else { "⚠️ " }
        $color = if ($ready -eq $replicas) { "Green" } else { "Yellow" }

        Write-Host "   $statusIcon StatefulSet: $stsName" -ForegroundColor $color -NoNewline
        Write-Host " ($ready/$replicas ready)" -ForegroundColor Gray
    }
}

Write-Host ""

# Verificar CronJobs
Write-Host "📋 VERIFICANDO CRONJOBS..." -ForegroundColor Yellow
Write-Host ""

$cronjobs = kubectl get cronjob -n NEXUS V1 -o json 2>$null | ConvertFrom-Json
if ($cronjobs.items) {
    foreach ($cj in $cronjobs.items) {
        $cjName = $cj.metadata.name
        $schedule = $cj.spec.schedule
        $suspend = $cj.spec.suspend

        $statusIcon = if (-not $suspend) { "✅" } else { "⏸️ " }
        $color = if (-not $suspend) { "Green" } else { "Yellow" }

        Write-Host "   $statusIcon $cjName" -ForegroundColor $color -NoNewline
        Write-Host " - Schedule: $schedule" -ForegroundColor Gray
    }
    Write-Host ""
}
else {
    Write-Host "   ℹ️  No hay CronJobs configurados" -ForegroundColor Gray
    Write-Host ""
}

# Resumen final
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Green
Write-Host "║  ✅ VERIFICACIÓN COMPLETADA                                     ║" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 RESUMEN:" -ForegroundColor Cyan
Write-Host "   • Pods: $readyPods/$totalPods ready" -ForegroundColor White
Write-Host "   • Servicios: $totalServices activos" -ForegroundColor White
Write-Host "   • Almacenamiento: ${totalStorage}Gi en $boundPVCs volúmenes" -ForegroundColor White
Write-Host ""

if ($Detailed) {
    Write-Host "📝 COMANDOS ÚTILES:" -ForegroundColor Cyan
    Write-Host "   • Ver logs: kubectl logs <pod-name> -n NEXUS V1" -ForegroundColor White
    Write-Host "   • Describe pod: kubectl describe pod <pod-name> -n NEXUS V1" -ForegroundColor White
    Write-Host "   • Port-forward Jaeger: kubectl port-forward -n NEXUS V1 svc/jaeger 16686:16686" -ForegroundColor White
    Write-Host "   • Ver eventos: kubectl get events -n NEXUS V1 --sort-by='.lastTimestamp'" -ForegroundColor White
    Write-Host ""
}

# Verificar acceso a Jaeger
Write-Host "🎯 ACCESO A SERVICIOS:" -ForegroundColor Cyan
Write-Host "   • Jaeger UI: http://localhost:16686 (requiere port-forward)" -ForegroundColor White
Write-Host "   • Comando: kubectl port-forward -n NEXUS V1 svc/jaeger 16686:16686" -ForegroundColor Gray
Write-Host ""

exit 0

