#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deployment automatizado de NEXUS V1 a Kubernetes con validaciones

.DESCRIPTION
    Script completo para desplegar NEXUS V1 en Kubernetes con:
    - Pre-validaciones (kubectl, contexts, recursos)
    - Deployment por capas (namespace → secrets → stateful → apps)
    - Health checks automáticos
    - Rollback automático en caso de fallo
    - Validación post-deployment

.PARAMETER Environment
    Entorno de deployment: dev, staging, prod

.PARAMETER SkipValidation
    Omitir validaciones pre-deployment

.PARAMETER DryRun
    Ejecutar en modo simulación (kubectl --dry-run)

.EXAMPLE
    .\deploy-k8s.ps1 -Environment dev
    .\deploy-k8s.ps1 -Environment prod -DryRun
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',

    [switch]$SkipValidation,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$Config = @{
    Namespace           = "NEXUS V1-$Environment"
    K8sDir              = Join-Path $PSScriptRoot ".." "k8s"
    Timeout             = 300  # 5 minutos
    HealthCheckInterval = 10  # segundos
}

# Orden de deployment (importante para dependencias)
$DeploymentOrder = @(
    'namespace.yaml',
    'configmap.yaml',
    'secrets.yaml',
    'resource-quota.yaml',
    'network-policy.yaml',
    'mongodb-statefulset.yaml',
    'redis-statefulset.yaml',
    'rabbitmq-statefulset.yaml',
    'app-deployment.yaml',
    'evaluation-deployment.yaml',
    'hpa.yaml',
    'pdb.yaml',
    'ingress.yaml'
)

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White',
        [switch]$NoNewline
    )

    $params = @{
        Object          = $Message
        ForegroundColor = $Color
    }
    if ($NoNewline) { $params.NoNewline = $true }

    Write-Host @params
}

function Write-Section {
    param([string]$Title)

    Write-Host "`n" -NoNewline
    Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
    Write-ColorOutput "  $Title" -Color Yellow
    Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
}

function Test-Prerequisites {
    Write-Section "VALIDANDO PREREQUISITOS"

    # Verificar kubectl
    Write-ColorOutput "🔍 Verificando kubectl..." -Color Cyan
    try {
        $kubectlVersion = kubectl version --client --output=json | ConvertFrom-Json
        Write-ColorOutput "✅ kubectl instalado: $($kubectlVersion.clientVersion.gitVersion)" -Color Green
    }
    catch {
        Write-ColorOutput "❌ kubectl no encontrado. Instalar desde: https://kubernetes.io/docs/tasks/tools/" -Color Red
        throw "kubectl no disponible"
    }

    # Verificar contexto de Kubernetes
    Write-ColorOutput "🔍 Verificando contexto de Kubernetes..." -Color Cyan
    try {
        $currentContext = kubectl config current-context
        Write-ColorOutput "✅ Contexto actual: $currentContext" -Color Green

        # Confirmar contexto para producción
        if ($Environment -eq 'prod' -and $currentContext -notlike '*prod*') {
            $confirm = Read-Host "⚠️ Deployando a PROD en contexto '$currentContext'. ¿Continuar? (yes/no)"
            if ($confirm -ne 'yes') {
                throw "Deployment cancelado por usuario"
            }
        }
    }
    catch {
        Write-ColorOutput "❌ No se puede obtener contexto de Kubernetes" -Color Red
        throw
    }

    # Verificar acceso al cluster
    Write-ColorOutput "🔍 Verificando acceso al cluster..." -Color Cyan
    try {
        kubectl cluster-info | Out-Null
        Write-ColorOutput "✅ Acceso al cluster verificado" -Color Green
    }
    catch {
        Write-ColorOutput "❌ No se puede acceder al cluster de Kubernetes" -Color Red
        throw "Cluster no accesible"
    }

    # Verificar recursos disponibles
    Write-ColorOutput "🔍 Verificando recursos del cluster..." -Color Cyan
    $nodes = kubectl get nodes -o json | ConvertFrom-Json
    $totalCPU = 0
    $totalMemory = 0

    foreach ($node in $nodes.items) {
        $cpu = [int]($node.status.capacity.cpu)
        $memory = $node.status.capacity.memory -replace '[^0-9]', ''
        $totalCPU += $cpu
        $totalMemory += [math]::Round($memory / 1MB)
    }

    Write-ColorOutput "✅ Recursos disponibles: $totalCPU CPUs, $([math]::Round($totalMemory/1024, 2)) GB RAM" -Color Green

    # Verificar archivos YAML
    Write-ColorOutput "🔍 Verificando archivos YAML..." -Color Cyan
    $missingFiles = @()
    foreach ($file in $DeploymentOrder) {
        $filePath = Join-Path $Config.K8sDir $file
        if (-not (Test-Path $filePath)) {
            $missingFiles += $file
        }
    }

    if ($missingFiles.Count -gt 0) {
        Write-ColorOutput "❌ Archivos faltantes:" -Color Red
        $missingFiles | ForEach-Object { Write-ColorOutput "  - $_" -Color Red }
        throw "Archivos de deployment faltantes"
    }

    Write-ColorOutput "✅ Todos los archivos YAML presentes ($($DeploymentOrder.Count) archivos)" -Color Green
}

function Deploy-Resource {
    param(
        [string]$FilePath,
        [string]$ResourceName
    )

    $fileName = Split-Path $FilePath -Leaf
    Write-ColorOutput "`n📦 Deployando $fileName..." -Color Cyan

    try {
        if ($DryRun) {
            kubectl apply -f $FilePath --dry-run=client --namespace=$($Config.Namespace)
            Write-ColorOutput "✅ Dry-run exitoso: $fileName" -Color Green
        }
        else {
            kubectl apply -f $FilePath --namespace=$($Config.Namespace)
            Write-ColorOutput "✅ Aplicado: $fileName" -Color Green
        }
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error deployando $fileName : $_" -Color Red
        return $false
    }
}

function Wait-ForStatefulSet {
    param(
        [string]$Name,
        [int]$TimeoutSeconds = 300
    )

    Write-ColorOutput "⏳ Esperando StatefulSet $Name..." -Color Yellow

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $sts = kubectl get statefulset $Name -n $($Config.Namespace) -o json | ConvertFrom-Json
            $ready = $sts.status.readyReplicas
            $desired = $sts.status.replicas

            if ($ready -eq $desired -and $ready -gt 0) {
                Write-ColorOutput "✅ StatefulSet $Name listo ($ready/$desired réplicas)" -Color Green
                return $true
            }

            Write-ColorOutput "  → $ready/$desired réplicas listas..." -Color Gray
        }
        catch {
            Write-ColorOutput "  → Esperando StatefulSet..." -Color Gray
        }

        Start-Sleep -Seconds $Config.HealthCheckInterval
        $elapsed += $Config.HealthCheckInterval
    }

    Write-ColorOutput "⏱️ Timeout esperando StatefulSet $Name" -Color Red
    return $false
}

function Wait-ForDeployment {
    param(
        [string]$Name,
        [int]$TimeoutSeconds = 300
    )

    Write-ColorOutput "⏳ Esperando Deployment $Name..." -Color Yellow

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $deploy = kubectl get deployment $Name -n $($Config.Namespace) -o json | ConvertFrom-Json
            $ready = $deploy.status.readyReplicas
            $desired = $deploy.status.replicas

            if ($ready -eq $desired -and $ready -gt 0) {
                Write-ColorOutput "✅ Deployment $Name listo ($ready/$desired réplicas)" -Color Green
                return $true
            }

            Write-ColorOutput "  → $ready/$desired réplicas listas..." -Color Gray
        }
        catch {
            Write-ColorOutput "  → Esperando Deployment..." -Color Gray
        }

        Start-Sleep -Seconds $Config.HealthCheckInterval
        $elapsed += $Config.HealthCheckInterval
    }

    Write-ColorOutput "⏱️ Timeout esperando Deployment $Name" -Color Red
    return $false
}

function Test-DeploymentHealth {
    Write-Section "VALIDANDO SALUD DEL DEPLOYMENT"

    # Verificar Pods
    Write-ColorOutput "`n📊 Estado de Pods:" -Color Cyan
    kubectl get pods -n $($Config.Namespace) -o wide

    $pods = kubectl get pods -n $($Config.Namespace) -o json | ConvertFrom-Json
    $runningPods = ($pods.items | Where-Object { $_.status.phase -eq 'Running' }).Count
    $totalPods = $pods.items.Count

    Write-ColorOutput "`n✅ Pods en ejecución: $runningPods/$totalPods" -Color Green

    # Verificar Services
    Write-ColorOutput "`n📊 Estado de Services:" -Color Cyan
    kubectl get services -n $($Config.Namespace)

    # Verificar StatefulSets
    Write-ColorOutput "`n📊 Estado de StatefulSets:" -Color Cyan
    kubectl get statefulsets -n $($Config.Namespace)

    # Verificar HPA
    Write-ColorOutput "`n📊 Estado de HPA:" -Color Cyan
    kubectl get hpa -n $($Config.Namespace)

    # Verificar eventos recientes
    Write-ColorOutput "`n📊 Eventos recientes:" -Color Cyan
    kubectl get events -n $($Config.Namespace) --sort-by='.lastTimestamp' | Select-Object -Last 10

    if ($runningPods -eq $totalPods -and $totalPods -gt 0) {
        Write-ColorOutput "`n✅ Deployment saludable" -Color Green
        return $true
    }
    else {
        Write-ColorOutput "`n⚠️ Algunos pods no están en ejecución" -Color Yellow
        return $false
    }
}

function Invoke-Rollback {
    Write-Section "EJECUTANDO ROLLBACK"

    Write-ColorOutput "⚠️ Iniciando rollback del deployment..." -Color Yellow

    try {
        # Rollback de deployments
        $deployments = kubectl get deployments -n $($Config.Namespace) -o json | ConvertFrom-Json
        foreach ($deploy in $deployments.items) {
            $name = $deploy.metadata.name
            Write-ColorOutput "🔄 Rollback: $name" -Color Yellow
            kubectl rollout undo deployment/$name -n $($Config.Namespace)
        }

        Write-ColorOutput "✅ Rollback completado" -Color Green
    }
    catch {
        Write-ColorOutput "❌ Error durante rollback: $_" -Color Red
    }
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

try {
    Write-Section "NEXUS V1 KUBERNETES DEPLOYMENT - $($Environment.ToUpper())"

    if ($DryRun) {
        Write-ColorOutput "ℹ️ Modo DRY-RUN activado (sin cambios reales)" -Color Yellow
    }

    # Pre-validaciones
    if (-not $SkipValidation) {
        Test-Prerequisites
    }
    else {
        Write-ColorOutput "⚠️ Validaciones omitidas (--SkipValidation)" -Color Yellow
    }

    # Deployment por capas
    Write-Section "DEPLOYANDO RECURSOS"

    $failedDeployments = @()

    foreach ($file in $DeploymentOrder) {
        $filePath = Join-Path $Config.K8sDir $file
        $success = Deploy-Resource -FilePath $filePath -ResourceName $file

        if (-not $success) {
            $failedDeployments += $file
        }

        # Esperar por StatefulSets críticos
        if ($file -match 'statefulset' -and -not $DryRun) {
            $resourceName = $file -replace '-statefulset\.yaml', ''
            Wait-ForStatefulSet -Name $resourceName
        }

        # Esperar por Deployments críticos
        if ($file -match 'deployment' -and -not $DryRun) {
            $resourceName = $file -replace '-deployment\.yaml', ''
            Wait-ForDeployment -Name $resourceName
        }
    }

    # Validación post-deployment
    if (-not $DryRun) {
        $healthy = Test-DeploymentHealth

        if ($failedDeployments.Count -gt 0) {
            Write-ColorOutput "`n⚠️ Deployments fallidos:" -Color Red
            $failedDeployments | ForEach-Object { Write-ColorOutput "  - $_" -Color Red }

            $rollback = Read-Host "`n¿Ejecutar rollback? (yes/no)"
            if ($rollback -eq 'yes') {
                Invoke-Rollback
            }

            exit 1
        }

        if ($healthy) {
            Write-Section "DEPLOYMENT EXITOSO"
            Write-ColorOutput "`n🎉 NEXUS V1 deployado exitosamente en $Environment" -Color Green
            Write-ColorOutput "`nComandos útiles:" -Color Cyan
            Write-ColorOutput "  kubectl get all -n $($Config.Namespace)" -Color White
            Write-ColorOutput "  kubectl logs -f -n $($Config.Namespace) -l app=NEXUS V1" -Color White
            Write-ColorOutput "  kubectl port-forward -n $($Config.Namespace) svc/NEXUS V1 3000:3000" -Color White
        }
        else {
            Write-ColorOutput "`n⚠️ Deployment completado con advertencias" -Color Yellow
        }
    }
    else {
        Write-ColorOutput "`n✅ Dry-run completado exitosamente" -Color Green
    }
}
catch {
    Write-ColorOutput "`n❌ Error durante deployment: $_" -Color Red
    Write-ColorOutput $_.ScriptStackTrace -Color Red
    exit 1
}

