#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Instala dependencias de OpenTelemetry para observabilidad

.DESCRIPTION
    Instala y configura OpenTelemetry SDK con instrumentaciones
    automáticas para Express, MongoDB, Redis, HTTP/HTTPS

.EXAMPLE
    .\install-otel.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  🔭 Instalando OpenTelemetry para NEXUS V1                           ║" -ForegroundColor Yellow
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📦 PASO 1: Verificar entorno`n" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "server/package.json")) {
    Write-Host "❌ Error: Ejecutar desde el directorio raíz de NEXUS V1" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Directorio correcto" -ForegroundColor Green

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Node.js no encontrado" -ForegroundColor Red
    exit 1
}

# Verificar npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm instalado: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ npm no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 PASO 2: Instalar dependencias de OpenTelemetry`n" -ForegroundColor Cyan

$packages = @(
    "@opentelemetry/api",
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/resources",
    "@opentelemetry/semantic-conventions",
    "@opentelemetry/sdk-trace-base"
)

Write-Host "Instalando $($packages.Count) paquetes..." -ForegroundColor Yellow

cd server

try {
    # Instalar todos los paquetes
    npm install --save $packages 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Paquetes de OpenTelemetry instalados" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️ Hubo advertencias durante la instalación" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "❌ Error instalando paquetes: $_" -ForegroundColor Red
    cd ..
    exit 1
}

cd ..

Write-Host "`n📦 PASO 3: Verificar instalación`n" -ForegroundColor Cyan

# Leer package.json y verificar
$packageJson = Get-Content "server/package.json" | ConvertFrom-Json

$installed = @()
$missing = @()

foreach ($pkg in $packages) {
    if ($packageJson.dependencies.PSObject.Properties.Name -contains $pkg) {
        $version = $packageJson.dependencies.$pkg
        Write-Host "✅ $pkg ($version)" -ForegroundColor Green
        $installed += $pkg
    }
    else {
        Write-Host "❌ $pkg - NO INSTALADO" -ForegroundColor Red
        $missing += $pkg
    }
}

Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "   Instalados: $($installed.Count)/$($packages.Count)" -ForegroundColor $(if ($missing.Count -eq 0) { "Green" } else { "Yellow" })

if ($missing.Count -gt 0) {
    Write-Host "`n⚠️ Paquetes faltantes:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
}

Write-Host "`n📦 PASO 4: Verificar archivo de configuración`n" -ForegroundColor Cyan

if (Test-Path "server/src/tracing.ts") {
    Write-Host "✅ server/src/tracing.ts existe" -ForegroundColor Green

    # Mostrar preview
    Write-Host "`nPreview del archivo:" -ForegroundColor Gray
    Get-Content "server/src/tracing.ts" | Select-Object -First 10 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    Write-Host "   ..." -ForegroundColor Gray
}
else {
    Write-Host "❌ server/src/tracing.ts NO ENCONTRADO" -ForegroundColor Red
    Write-Host "   El archivo debería estar creado en: server/src/tracing.ts" -ForegroundColor Yellow
}

Write-Host "`n📦 PASO 5: Instrucciones de integración`n" -ForegroundColor Cyan

Write-Host "Para activar OpenTelemetry en la aplicación:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Modificar server/src/server.ts (o index.ts):" -ForegroundColor Cyan
Write-Host "   // ⚠️ DEBE ser la PRIMERA línea (antes de otros imports)" -ForegroundColor Gray
Write-Host "   import './tracing';" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣ Agregar variables de entorno:" -ForegroundColor Cyan
Write-Host "   # En .env o k8s ConfigMap" -ForegroundColor Gray
Write-Host "   OTEL_SERVICE_NAME=NEXUS V1-backend" -ForegroundColor White
Write-Host "   OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces" -ForegroundColor White
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣ Rebuild y restart:" -ForegroundColor Cyan
Write-Host "   cd server" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor White
Write-Host "   npm run start" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣ Verificar traces en Jaeger:" -ForegroundColor Cyan
Write-Host "   kubectl port-forward -n NEXUS V1 svc/jaeger 16686:16686" -ForegroundColor White
Write-Host "   Start-Process 'http://localhost:16686'" -ForegroundColor White
Write-Host ""

Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  ✅ INSTALACIÓN DE OPENTELEMETRY COMPLETADA                     ║" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentación:" -ForegroundColor Cyan
Write-Host "   - DEPLOYMENT_GUIDE.md - Guía completa de deployment" -ForegroundColor White
Write-Host "   - K8S_ANALYSIS_REPORT.md - Análisis de Kubernetes" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Próximo paso:" -ForegroundColor Yellow
Write-Host "   Habilitar Kubernetes en Docker Desktop y ejecutar:" -ForegroundColor White
Write-Host "   .\scripts\deploy-k8s.ps1 -Environment dev" -ForegroundColor Cyan
Write-Host ""

