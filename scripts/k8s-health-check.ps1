#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Health check completo del deployment de Kubernetes

.DESCRIPTION
    Valida todos los componentes de NEXUS V1 en Kubernetes:
    - Pods en ejecución
    - StatefulSets con réplicas listas
    - Services accesibles
    - Health checks pasando
    - Recursos dentro de límites
    - NetworkPolicies aplicadas
    - HPA configurado correctamente

.PARAMETER Namespace
    Namespace a validar (default: NEXUS V1-dev)

.PARAMETER Detailed
    Mostrar output detallado

.EXAMPLE
    .\k8s-health-check.ps1
    .\k8s-health-check.ps1 -Namespace NEXUS V1-prod -Detailed
#>

[CmdletBinding()]
param(
    [string]$Namespace = "NEXUS V1-dev",
    [switch]$Detailed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$HealthChecks = @{
    Passed = 0
    Failed = 0
    Warnings = 0
}

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-CheckResult {
    param(
        [string]$Check,
        [bool]$Passed,
        [string]$Message = ""
    )

    if ($Passed) {
        Write-ColorOutput "✅ $Check" -Color Green
        $script:HealthChecks.Passed++
    }
    else {
        Write-ColorOutput "❌ $Check" -Color Red
        $script:HealthChecks.Failed++
    }

    if ($Message) {
        Write-ColorOutput "   $Message" -Color Gray
    }
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" -Color Yellow
    $script:HealthChecks.Warnings++
}

# ============================================================================
# VALIDACIONES
# ============================================================================

function Test-NamespaceExists {
    Write-ColorOutput "`n🔍 Validando Namespace..." -Color Cyan

    try {
        $ns = kubectl get namespace $Namespace -o json 2>$null | ConvertFrom-Json
        Write-CheckResult -Check "Namespace existe: $Namespace" -Passed $true

        if ($Detailed) {
            Write-ColorOutput "   Creado: $($ns.metadata.creationTimestamp)" -Color Gray
            Write-ColorOutput "   Fase: $($ns.status.phase)" -Color Gray
        }

        return $true
    }
    catch {
        Write-CheckResult -Check "Namespace existe" -Passed $false -Message "Namespace '$Namespace' no encontrado"
        return $false
    }
}

function Test-Pods {
    Write-ColorOutput "`n🔍 Validando Pods..." -Color Cyan

    try {
        $pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json

        if ($pods.items.Count -eq 0) {
            Write-CheckResult -Check "Pods encontrados" -Passed $false -Message "No hay pods en el namespace"
            return $false
        }

        $runningPods = ($pods.items | Where-Object { $_.status.phase -eq 'Running' }).Count
        $totalPods = $pods.items.Count

        $allRunning = $runningPods -eq $totalPods
        Write-CheckResult -Check "Pods en ejecución: $runningPods/$totalPods" -Passed $allRunning

        # Verificar pods con errores
        $crashLoopPods = $pods.items | Where-Object {
            $_.status.containerStatuses.state.waiting.reason -eq 'CrashLoopBackOff'
        }

        if ($crashLoopPods.Count -gt 0) {
            Write-Warning "Pods en CrashLoopBackOff: $($crashLoopPods.Count)"
            if ($Detailed) {
                $crashLoopPods | ForEach-Object {
                    Write-ColorOutput "   - $($_.metadata.name)" -Color Yellow
                }
            }
        }

        # Verificar pods pendientes
        $pendingPods = $pods.items | Where-Object { $_.status.phase -eq 'Pending' }
        if ($pendingPods.Count -gt 0) {
            Write-Warning "Pods pendientes: $($pendingPods.Count)"
        }

        if ($Detailed) {
            Write-ColorOutput "`n   Detalle de Pods:" -Color Gray
            kubectl get pods -n $Namespace -o wide
        }

        return $allRunning
    }
    catch {
        Write-CheckResult -Check "Pods" -Passed $false -Message "Error obteniendo pods: $_"
        return $false
    }
}

function Test-StatefulSets {
    Write-ColorOutput "`n🔍 Validando StatefulSets..." -Color Cyan

    try {
        $sts = kubectl get statefulsets -n $Namespace -o json | ConvertFrom-Json

        if ($sts.items.Count -eq 0) {
            Write-Warning "No se encontraron StatefulSets"
            return $true  # No es un error si no hay StatefulSets
        }

        $allReady = $true
        foreach ($statefulset in $sts.items) {
            $name = $statefulset.metadata.name
            $ready = $statefulset.status.readyReplicas
            $desired = $statefulset.status.replicas

            $isReady = $ready -eq $desired
            Write-CheckResult -Check "StatefulSet $name : $ready/$desired réplicas" -Passed $isReady

            if (-not $isReady) {
                $allReady = $false
            }

            if ($Detailed -and $isReady) {
                Write-ColorOutput "   Imagen: $($statefulset.spec.template.spec.containers[0].image)" -Color Gray
                Write-ColorOutput "   Volumen: $($statefulset.spec.volumeClaimTemplates[0].spec.resources.requests.storage)" -Color Gray
            }
        }

        return $allReady
    }
    catch {
        Write-CheckResult -Check "StatefulSets" -Passed $false -Message "Error: $_"
        return $false
    }
}

function Test-Deployments {
    Write-ColorOutput "`n🔍 Validando Deployments..." -Color Cyan

    try {
        $deployments = kubectl get deployments -n $Namespace -o json | ConvertFrom-Json

        if ($deployments.items.Count -eq 0) {
            Write-Warning "No se encontraron Deployments"
            return $true
        }

        $allReady = $true
        foreach ($deploy in $deployments.items) {
            $name = $deploy.metadata.name
            $ready = $deploy.status.readyReplicas
            $desired = $deploy.status.replicas

            $isReady = $ready -eq $desired
            Write-CheckResult -Check "Deployment $name : $ready/$desired réplicas" -Passed $isReady

            if (-not $isReady) {
                $allReady = $false
            }

            if ($Detailed -and $isReady) {
                Write-ColorOutput "   Imagen: $($deploy.spec.template.spec.containers[0].image)" -Color Gray
                Write-ColorOutput "   Estrategia: $($deploy.spec.strategy.type)" -Color Gray
            }
        }

        return $allReady
    }
    catch {
        Write-CheckResult -Check "Deployments" -Passed $false -Message "Error: $_"
        return $false
    }
}

function Test-Services {
    Write-ColorOutput "`n🔍 Validando Services..." -Color Cyan

    try {
        $services = kubectl get services -n $Namespace -o json | ConvertFrom-Json

        if ($services.items.Count -eq 0) {
            Write-CheckResult -Check "Services encontrados" -Passed $false
            return $false
        }

        Write-CheckResult -Check "Services encontrados: $($services.items.Count)" -Passed $true

        if ($Detailed) {
            Write-ColorOutput "`n   Detalle de Services:" -Color Gray
            kubectl get services -n $Namespace
        }

        # Verificar endpoints
        foreach ($svc in $services.items) {
            $name = $svc.metadata.name
            $endpoints = kubectl get endpoints $name -n $Namespace -o json 2>$null | ConvertFrom-Json

            if ($endpoints.subsets.addresses.Count -gt 0) {
                Write-CheckResult -Check "Service $name tiene endpoints" -Passed $true
            }
            else {
                Write-CheckResult -Check "Service $name tiene endpoints" -Passed $false
            }
        }

        return $true
    }
    catch {
        Write-CheckResult -Check "Services" -Passed $false -Message "Error: $_"
        return $false
    }
}

function Test-HPA {
    Write-ColorOutput "`n🔍 Validando HorizontalPodAutoscaler..." -Color Cyan

    try {
        $hpa = kubectl get hpa -n $Namespace -o json 2>$null | ConvertFrom-Json

        if ($hpa.items.Count -eq 0) {
            Write-Warning "No se encontraron HPAs (auto-escalado no configurado)"
            return $true
        }

        foreach ($autoscaler in $hpa.items) {
            $name = $autoscaler.metadata.name
            $current = $autoscaler.status.currentReplicas
            $desired = $autoscaler.status.desiredReplicas

            Write-CheckResult -Check "HPA $name : $current réplicas (deseadas: $desired)" -Passed $true

            if ($Detailed) {
                $cpu = $autoscaler.status.currentCPUUtilizationPercentage
                $targetCpu = $autoscaler.spec.targetCPUUtilizationPercentage
                Write-ColorOutput "   CPU actual: $cpu% (target: $targetCpu%)" -Color Gray
            }
        }

        return $true
    }
    catch {
        Write-Warning "HPA no disponible o no configurado"
        return $true
    }
}

function Test-PDB {
    Write-ColorOutput "`n🔍 Validando PodDisruptionBudgets..." -Color Cyan

    try {
        $pdb = kubectl get pdb -n $Namespace -o json 2>$null | ConvertFrom-Json

        if ($pdb.items.Count -eq 0) {
            Write-Warning "No se encontraron PDBs (alta disponibilidad no garantizada)"
            return $true
        }

        foreach ($budget in $pdb.items) {
            $name = $budget.metadata.name
            $allowed = $budget.status.disruptionsAllowed

            Write-CheckResult -Check "PDB $name : $allowed disrupciones permitidas" -Passed $true

            if ($Detailed) {
                Write-ColorOutput "   Min disponible: $($budget.spec.minAvailable)" -Color Gray
                Write-ColorOutput "   Pods actuales: $($budget.status.currentHealthy)" -Color Gray
            }
        }

        return $true
    }
    catch {
        Write-Warning "PDB no disponible"
        return $true
    }
}

function Test-ResourceQuotas {
    Write-ColorOutput "`n🔍 Validando ResourceQuotas..." -Color Cyan

    try {
        $quotas = kubectl get resourcequota -n $Namespace -o json 2>$null | ConvertFrom-Json

        if ($quotas.items.Count -eq 0) {
            Write-Warning "No se encontraron ResourceQuotas (sin límites de namespace)"
            return $true
        }

        foreach ($quota in $quotas.items) {
            $name = $quota.metadata.name
            Write-CheckResult -Check "ResourceQuota $name configurado" -Passed $true

            if ($Detailed) {
                Write-ColorOutput "`n   Uso de recursos:" -Color Gray
                $quota.status.used.PSObject.Properties | ForEach-Object {
                    $resourceName = $_.Name
                    $used = $_.Value
                    $hard = $quota.status.hard.$resourceName
                    Write-ColorOutput "   - $resourceName : $used / $hard" -Color Gray
                }
            }
        }

        return $true
    }
    catch {
        Write-Warning "ResourceQuotas no disponibles"
        return $true
    }
}

function Test-NetworkPolicies {
    Write-ColorOutput "`n🔍 Validando NetworkPolicies..." -Color Cyan

    try {
        $policies = kubectl get networkpolicies -n $Namespace -o json 2>$null | ConvertFrom-Json

        if ($policies.items.Count -eq 0) {
            Write-Warning "No se encontraron NetworkPolicies (sin aislamiento de red)"
            return $true
        }

        Write-CheckResult -Check "NetworkPolicies configuradas: $($policies.items.Count)" -Passed $true

        if ($Detailed) {
            $policies.items | ForEach-Object {
                Write-ColorOutput "   - $($_.metadata.name)" -Color Gray
            }
        }

        return $true
    }
    catch {
        Write-Warning "NetworkPolicies no disponibles"
        return $true
    }
}

function Test-Events {
    Write-ColorOutput "`n🔍 Analizando eventos recientes..." -Color Cyan

    try {
        $events = kubectl get events -n $Namespace --sort-by='.lastTimestamp' -o json | ConvertFrom-Json

        $warningEvents = $events.items | Where-Object { $_.type -eq 'Warning' } | Select-Object -Last 5

        if ($warningEvents.Count -gt 0) {
            Write-Warning "Eventos de advertencia recientes: $($warningEvents.Count)"
            if ($Detailed) {
                $warningEvents | ForEach-Object {
                    Write-ColorOutput "   [$($_.lastTimestamp)] $($_.reason): $($_.message)" -Color Yellow
                }
            }
        }
        else {
            Write-CheckResult -Check "Sin eventos de advertencia recientes" -Passed $true
        }

        return $true
    }
    catch {
        Write-Warning "No se pudieron obtener eventos"
        return $true
    }
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

try {
    Write-ColorOutput "╔═══════════════════════════════════════════════════════════╗" -Color Cyan
    Write-ColorOutput "║  NEXUS V1 Kubernetes Health Check                             ║" -Color Yellow
    Write-ColorOutput "║  Namespace: $($Namespace.PadRight(47)) ║" -Color Yellow
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════╝" -Color Cyan

    # Ejecutar todas las validaciones
    Test-NamespaceExists
    Test-Pods
    Test-StatefulSets
    Test-Deployments
    Test-Services
    Test-HPA
    Test-PDB
    Test-ResourceQuotas
    Test-NetworkPolicies
    Test-Events

    # Resumen final
    Write-ColorOutput "`n╔═══════════════════════════════════════════════════════════╗" -Color Cyan
    Write-ColorOutput "║  RESUMEN DE VALIDACIÓN                                    ║" -Color Yellow
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════╝" -Color Cyan

    Write-ColorOutput "`n✅ Checks pasados: $($HealthChecks.Passed)" -Color Green
    Write-ColorOutput "❌ Checks fallidos: $($HealthChecks.Failed)" -Color Red
    Write-ColorOutput "⚠️ Advertencias: $($HealthChecks.Warnings)" -Color Yellow

    $total = $HealthChecks.Passed + $HealthChecks.Failed
    if ($total -gt 0) {
        $percentage = [math]::Round(($HealthChecks.Passed / $total) * 100, 2)
        Write-ColorOutput "`n📊 Health Score: $percentage%" -Color Cyan

        if ($percentage -ge 95) {
            Write-ColorOutput "`n🎉 Deployment SALUDABLE" -Color Green
            exit 0
        }
        elseif ($percentage -ge 80) {
            Write-ColorOutput "`n⚠️ Deployment con advertencias menores" -Color Yellow
            exit 0
        }
        else {
            Write-ColorOutput "`n❌ Deployment con problemas críticos" -Color Red
            exit 1
        }
    }
}
catch {
    Write-ColorOutput "`n❌ Error durante health check: $_" -Color Red
    Write-ColorOutput $_.ScriptStackTrace -Color Red
    exit 1
}

