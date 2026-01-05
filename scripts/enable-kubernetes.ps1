#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Habilita Kubernetes en Docker Desktop
.DESCRIPTION
    Este script te guía para habilitar Kubernetes en Docker Desktop
    y verifica que esté funcionando correctamente.
#>

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "║  🎯 Habilitar Kubernetes en Docker Desktop                      ║" -ForegroundColor Cyan
Write-Host "║                                                                  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker Desktop esté corriendo
Write-Host "📋 PASO 1: VERIFICAR DOCKER DESKTOP" -ForegroundColor Yellow
Write-Host ""

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop no está corriendo" -ForegroundColor Red
        Write-Host ""
        Write-Host "Por favor:" -ForegroundColor Yellow
        Write-Host "1. Abre Docker Desktop desde el menú de inicio" -ForegroundColor White
        Write-Host "2. Espera a que el ícono en la bandeja del sistema se ponga verde" -ForegroundColor White
        Write-Host "3. Vuelve a ejecutar este script" -ForegroundColor White
        exit 1
    }
    Write-Host "✅ Docker Desktop está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Error verificando Docker Desktop: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 PASO 2: VERIFICAR ESTADO DE KUBERNETES" -ForegroundColor Yellow
Write-Host ""

# Intentar conectar a Kubernetes
$k8sEnabled = $false
try {
    $nodes = kubectl get nodes 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Kubernetes ya está habilitado y funcionando!" -ForegroundColor Green
        Write-Host ""
        kubectl get nodes
        $k8sEnabled = $true
    }
} catch {
    # Kubernetes no está habilitado, continuar con instrucciones
}

if (-not $k8sEnabled) {
    Write-Host "⚠️  Kubernetes NO está habilitado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                  ║" -ForegroundColor Cyan
    Write-Host "║  📝 INSTRUCCIONES PARA HABILITAR KUBERNETES                     ║" -ForegroundColor Cyan
    Write-Host "║                                                                  ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "Sigue estos pasos:" -ForegroundColor White
    Write-Host ""
    Write-Host "1️⃣  Haz clic en el ícono de Docker Desktop en la bandeja del sistema" -ForegroundColor Cyan
    Write-Host "   (Esquina inferior derecha, cerca del reloj)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2️⃣  Haz clic en el ícono de engranaje ⚙️  (Settings)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3️⃣  En el menú de la izquierda, haz clic en 'Kubernetes'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4️⃣  Marca la casilla '☑️  Enable Kubernetes'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5️⃣  Haz clic en 'Apply & Restart' (abajo a la derecha)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "6️⃣  ESPERA de 2 a 5 minutos mientras Kubernetes se inicializa" -ForegroundColor Cyan
    Write-Host "   Verás un indicador de progreso en Docker Desktop" -ForegroundColor Gray
    Write-Host ""
    Write-Host "7️⃣  Cuando veas '🟢 Kubernetes is running', presiona cualquier tecla aquí" -ForegroundColor Cyan
    Write-Host ""

    # Opción para abrir Docker Desktop automáticamente
    Write-Host "¿Quieres que abra Docker Desktop automáticamente? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host

    if ($response -eq 'S' -or $response -eq 's') {
        Write-Host ""
        Write-Host "🚀 Abriendo Docker Desktop..." -ForegroundColor Cyan
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Start-Sleep -Seconds 3
    }

    Write-Host ""
    Write-Host "Presiona cualquier tecla cuando hayas completado los pasos anteriores..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

    # Verificar en bucle
    Write-Host ""
    Write-Host "🔍 Esperando a que Kubernetes esté listo..." -ForegroundColor Cyan
    Write-Host ""

    $maxAttempts = 60  # 5 minutos máximo (60 intentos × 5 segundos)
    $attempt = 0

    while ($attempt -lt $maxAttempts) {
        $attempt++
        Write-Host "   Intento $attempt/$maxAttempts..." -ForegroundColor Gray -NoNewline

        try {
            $nodes = kubectl get nodes 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host " ✅" -ForegroundColor Green
                Write-Host ""
                Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
                Write-Host "║                                                                  ║" -ForegroundColor Green
                Write-Host "║  ✅ ¡KUBERNETES ESTÁ LISTO!                                     ║" -ForegroundColor Green
                Write-Host "║                                                                  ║" -ForegroundColor Green
                Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
                Write-Host ""
                kubectl get nodes
                $k8sEnabled = $true
                break
            }
        } catch {
            # Ignorar errores y continuar
        }

        Write-Host " ⏳" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }

    if (-not $k8sEnabled) {
        Write-Host ""
        Write-Host "⚠️  Kubernetes no respondió después de $maxAttempts intentos" -ForegroundColor Red
        Write-Host ""
        Write-Host "Posibles problemas:" -ForegroundColor Yellow
        Write-Host "1. El proceso de inicialización está tomando más tiempo de lo normal" -ForegroundColor White
        Write-Host "2. Verifica en Docker Desktop que Kubernetes esté habilitado" -ForegroundColor White
        Write-Host "3. Reinicia Docker Desktop y vuelve a intentar" -ForegroundColor White
        Write-Host ""
        Write-Host "Ejecuta este comando manualmente para verificar:" -ForegroundColor Yellow
        Write-Host "  kubectl get nodes" -ForegroundColor Cyan
        exit 1
    }
}

# Kubernetes está habilitado, verificar componentes
Write-Host ""
Write-Host "📋 PASO 3: VERIFICAR COMPONENTES DE KUBERNETES" -ForegroundColor Yellow
Write-Host ""

# Verificar namespaces
Write-Host "🔍 Namespaces disponibles:" -ForegroundColor Cyan
kubectl get namespaces

Write-Host ""
Write-Host "🔍 Pods del sistema:" -ForegroundColor Cyan
kubectl get pods -n kube-system

Write-Host ""
Write-Host "📋 PASO 4: INSTALAR METRICS SERVER" -ForegroundColor Yellow
Write-Host ""

# Verificar si Metrics Server ya está instalado
$metricsServerExists = $false
try {
    $metricsDeployment = kubectl get deployment metrics-server -n kube-system 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Metrics Server ya está instalado" -ForegroundColor Green
        $metricsServerExists = $true
    }
} catch {
    # Metrics Server no está instalado
}

if (-not $metricsServerExists) {
    Write-Host "⚠️  Metrics Server no está instalado (requerido para HPA)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "¿Quieres instalar Metrics Server ahora? (S/N): " -ForegroundColor Yellow -NoNewline
    $response = Read-Host

    if ($response -eq 'S' -or $response -eq 's') {
        Write-Host ""
        Write-Host "🚀 Instalando Metrics Server..." -ForegroundColor Cyan

        # Descargar y aplicar Metrics Server
        kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

        Write-Host ""
        Write-Host "🔧 Configurando Metrics Server para Docker Desktop..." -ForegroundColor Cyan

        # Patch para Docker Desktop (TLS inseguro)
        kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

        Write-Host ""
        Write-Host "⏳ Esperando a que Metrics Server esté listo..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10

        kubectl get deployment metrics-server -n kube-system
        Write-Host "✅ Metrics Server instalado" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Green
Write-Host "║  ✅ KUBERNETES CONFIGURADO Y LISTO                              ║" -ForegroundColor Green
Write-Host "║                                                                  ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 SIGUIENTES PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Validar configuración completa:" -ForegroundColor Cyan
Write-Host "   .\scripts\prepare-deployment.ps1" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Desplegar a Kubernetes:" -ForegroundColor Cyan
Write-Host "   .\scripts\deploy-k8s.ps1 -Environment dev" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Verificar estado del deployment:" -ForegroundColor Cyan
Write-Host "   .\scripts\k8s-health-check.ps1 -Detailed" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Acceder a Jaeger UI (después del deployment):" -ForegroundColor Cyan
Write-Host "   kubectl port-forward -n NEXUS V1 svc/jaeger 16686:16686" -ForegroundColor White
Write-Host "   Luego abre: http://localhost:16686" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 Documentación útil:" -ForegroundColor Yellow
Write-Host "   - DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   - K8S_ANALYSIS_REPORT.md" -ForegroundColor White
Write-Host ""

