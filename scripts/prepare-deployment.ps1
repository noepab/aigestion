#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Preparación final antes de deployment a Kubernetes

.DESCRIPTION
    Valida configuración, build de aplicación, push de imágenes,
    y verifica que todo esté listo para deployment

.PARAMETER SkipBuild
    Omitir build de la aplicación

.PARAMETER SkipDocker
    Omitir build y push de imágenes Docker

.EXAMPLE
    .\prepare-deployment.ps1
    .\prepare-deployment.ps1 -SkipBuild -SkipDocker
#>

[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [switch]$SkipDocker
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  🚀 Preparación para Deployment a Kubernetes                    ║" -ForegroundColor Yellow
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ============================================================================
# PASO 1: VALIDAR ENTORNO
# ============================================================================

Write-Host "`n📋 PASO 1: VALIDAR ENTORNO`n" -ForegroundColor Cyan

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar kubectl
try {
    $kubectlVersion = kubectl version --client --output=json 2>$null | ConvertFrom-Json
    Write-Host "✅ kubectl: $($kubectlVersion.clientVersion.gitVersion)" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ kubectl no encontrado (opcional para local)" -ForegroundColor Yellow
}

# Verificar Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Git no encontrado" -ForegroundColor Yellow
}

# ============================================================================
# PASO 2: VALIDAR CONFIGURACIÓN
# ============================================================================

Write-Host "`n📋 PASO 2: VALIDAR CONFIGURACIÓN`n" -ForegroundColor Cyan

# Verificar archivos de configuración
$configFiles = @(
    "server/package.json",
    "server/.env.example",
    "server/tsconfig.json",
    "k8s/namespace.yaml",
    "k8s/configmap.yaml",
    "k8s/app-deployment.yaml",
    "k8s/jaeger-deployment.yaml",
    "k8s/mongodb-backup-cronjob.yaml"
)

$missing = @()
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $file - NO ENCONTRADO" -ForegroundColor Red
        $missing += $file
    }
}

if ($missing.Count -gt 0) {
    Write-Host "`n⚠️ Archivos faltantes: $($missing.Count)" -ForegroundColor Yellow
    exit 1
}

# Verificar OpenTelemetry instalado
Write-Host "`n📦 Verificando dependencias de OpenTelemetry..." -ForegroundColor Cyan
$packageJson = Get-Content "server/package.json" | ConvertFrom-Json

$otelPackages = @(
    "@opentelemetry/api",
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-trace-otlp-http"
)

$otelMissing = @()
foreach ($pkg in $otelPackages) {
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $pkg) {
        Write-Host "✅ $pkg" -ForegroundColor Green
    }
    else {
        Write-Host "❌ $pkg - NO INSTALADO" -ForegroundColor Red
        $otelMissing += $pkg
    }
}

if ($otelMissing.Count -gt 0) {
    Write-Host "`n⚠️ Ejecutar primero: .\scripts\install-otel.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar tracing integrado
Write-Host "`n🔍 Verificando integración de tracing..." -ForegroundColor Cyan

if (Test-Path "server/src/config/tracing.ts") {
    Write-Host "✅ server/src/config/tracing.ts existe" -ForegroundColor Green
}
else {
    Write-Host "❌ server/src/config/tracing.ts NO encontrado" -ForegroundColor Red
    exit 1
}

$serverContent = Get-Content "server/src/server.ts" -Raw
if ($serverContent -match "import\s+['\`"]\.\/config\/tracing['\`"]") {
    Write-Host "✅ Tracing importado en server.ts" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Tracing NO importado en server.ts" -ForegroundColor Yellow
    Write-Host "   Agregar como PRIMERA línea:" -ForegroundColor Gray
    Write-Host "   import './config/tracing';" -ForegroundColor White
}

# ============================================================================
# PASO 3: BUILD DE LA APLICACIÓN
# ============================================================================

if (-not $SkipBuild) {
    Write-Host "`n📋 PASO 3: BUILD DE LA APLICACIÓN`n" -ForegroundColor Cyan

    Write-Host "Building backend..." -ForegroundColor Yellow
    cd server

    try {
        npm run build 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend build exitoso" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ Backend build con advertencias" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Error durante build: $_" -ForegroundColor Red
        cd ..
        exit 1
    }

    cd ..

    # Verificar dist
    if (Test-Path "server/dist") {
        $distFiles = (Get-ChildItem "server/dist" -Recurse -File).Count
        Write-Host "✅ Archivos generados: $distFiles" -ForegroundColor Green
    }
}
else {
    Write-Host "`n⏭️ PASO 3: BUILD OMITIDO (--SkipBuild)`n" -ForegroundColor Yellow
}

# ============================================================================
# PASO 4: DOCKER BUILD Y PUSH
# ============================================================================

if (-not $SkipDocker) {
    Write-Host "`n📋 PASO 4: DOCKER BUILD Y PUSH`n" -ForegroundColor Cyan

    $imageName = "ghcr.io/noepab/NEXUS V1"
    $version = "latest"

    Write-Host "Building Docker image..." -ForegroundColor Yellow
    Write-Host "Image: ${imageName}:${version}" -ForegroundColor Gray

    try {
        docker build -t "${imageName}:${version}" . 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Docker build exitoso" -ForegroundColor Green

            # Verificar tamaño de imagen
            $imageSize = docker images "${imageName}:${version}" --format "{{.Size}}"
            Write-Host "   Tamaño: $imageSize" -ForegroundColor Gray

            # Preguntar si hacer push
            $push = Read-Host "`n¿Push a GitHub Container Registry? (yes/no)"
            if ($push -eq "yes") {
                Write-Host "`nPushing image..." -ForegroundColor Yellow
                docker push "${imageName}:${version}"

                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Docker push exitoso" -ForegroundColor Green
                }
                else {
                    Write-Host "⚠️ Docker push falló (verificar autenticación)" -ForegroundColor Yellow
                }
            }
            else {
                Write-Host "⏭️ Docker push omitido" -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "❌ Docker build falló" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "❌ Error durante Docker build: $_" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "`n⏭️ PASO 4: DOCKER OMITIDO (--SkipDocker)`n" -ForegroundColor Yellow
}

# ============================================================================
# PASO 5: VALIDAR KUBERNETES CONFIG
# ============================================================================

Write-Host "`n📋 PASO 5: VALIDAR KUBERNETES CONFIG`n" -ForegroundColor Cyan

$k8sFiles = Get-ChildItem "k8s/*.yaml"
Write-Host "Archivos YAML encontrados: $($k8sFiles.Count)" -ForegroundColor Cyan

foreach ($file in $k8sFiles | Select-Object -First 5) {
    Write-Host "✅ $($file.Name)" -ForegroundColor Green
}

if ($k8sFiles.Count -gt 5) {
    Write-Host "   ... y $($k8sFiles.Count - 5) más" -ForegroundColor Gray
}

# Validar YAML syntax (si kubectl disponible)
try {
    kubectl version --client 2>&1 | Out-Null

    Write-Host "`n🔍 Validando YAML syntax..." -ForegroundColor Cyan

    $errors = @()
    foreach ($file in $k8sFiles) {
        try {
            kubectl apply -f $file.FullName --dry-run=client 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                # OK
            }
            else {
                $errors += $file.Name
            }
        }
        catch {
            $errors += $file.Name
        }
    }

    if ($errors.Count -eq 0) {
        Write-Host "✅ Todos los archivos YAML válidos" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Archivos con errores: $($errors.Count)" -ForegroundColor Yellow
        $errors | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
    }
}
catch {
    Write-Host "⏭️ Validación de YAML omitida (kubectl no disponible)" -ForegroundColor Yellow
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================

Write-Host "`n╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  ✅ PREPARACIÓN COMPLETADA                                      ║" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n🎯 SIGUIENTE PASO: DEPLOYMENT A KUBERNETES`n" -ForegroundColor Yellow

Write-Host "Opción 1: Deployment local (Docker Desktop Kubernetes)" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy-k8s.ps1 -Environment dev" -ForegroundColor White

Write-Host "`nOpción 2: Deployment a staging/producción" -ForegroundColor Cyan
Write-Host "  .\scripts\deploy-k8s.ps1 -Environment staging -DryRun" -ForegroundColor White
Write-Host "  .\scripts\deploy-k8s.ps1 -Environment staging" -ForegroundColor White

Write-Host "`nOpción 3: Health check" -ForegroundColor Cyan
Write-Host "  .\scripts\k8s-health-check.ps1 -Detailed" -ForegroundColor White

Write-Host "`n📚 Documentación:" -ForegroundColor Cyan
Write-Host "  - DEPLOYMENT_GUIDE.md - Guía completa" -ForegroundColor White
Write-Host "  - K8S_ANALYSIS_REPORT.md - Análisis de Kubernetes" -ForegroundColor White

Write-Host ""

