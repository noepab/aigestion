# Script de Optimizacion Docker para Mini PC
# Ejecutar en PowerShell
param(
    [switch]$DryRun,
    [string]$LogPath = "$env:TEMP\docker_optimize_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
)

function Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogPath -Append
    Write-Host $Message
}

Write-Host "🐳 Docker - Optimizacion para Mini PC" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si Docker está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    Write-Host "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Docker instalado" -ForegroundColor Green
Log "Docker installed"
Write-Host ""

# Verificar si Docker está corriendo
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Docker Desktop no está corriendo" -ForegroundColor Yellow
        Write-Host "Iniciando Docker Desktop..." -ForegroundColor Yellow
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        Log "Started Docker Desktop"
        Write-Host "Esperando 30 segundos..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
        Log "Waited 30 seconds for Docker to start"
    }
} catch {
    Write-Host "⚠️  Iniciando Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 30
}

Write-Host "✅ Docker Desktop corriendo" -ForegroundColor Green
Write-Host ""

# Mostrar uso actual
Write-Host "📊 Uso actual de Docker:" -ForegroundColor Cyan
Write-Host ""
docker system df
Write-Host ""

# Menú de opciones
Write-Host "Selecciona una opción:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Limpieza Ligera (contenedores detenidos)" -ForegroundColor White
Write-Host "2. Limpieza Media (+ imágenes no usadas)" -ForegroundColor White
Write-Host "3. Limpieza Completa (TODO - CUIDADO)" -ForegroundColor White
Write-Host "4. Ver estadísticas de recursos" -ForegroundColor White
Write-Host "5. Detener todos los contenedores" -ForegroundColor White
Write-Host "0. Salir" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Opción"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🧹 Limpieza Ligera..." -ForegroundColor Yellow
        Write-Host ""

        # Contenedores detenidos
        Write-Host "Eliminando contenedores detenidos..." -ForegroundColor Gray
        docker container prune -f

        Write-Host ""
        Write-Host "✅ Limpieza ligera completada" -ForegroundColor Green
    }

    "2" {
        Write-Host ""
        Write-Host "🧹 Limpieza Media..." -ForegroundColor Yellow
        Write-Host ""

        # Contenedores detenidos
        Write-Host "Eliminando contenedores detenidos..." -ForegroundColor Gray
        docker container prune -f

        # Imágenes no usadas
        Write-Host "Eliminando imágenes no usadas..." -ForegroundColor Gray
        docker image prune -a -f

        # Volúmenes no usados
        Write-Host "Eliminando volúmenes no usados..." -ForegroundColor Gray
        docker volume prune -f

        # Networks no usadas
        Write-Host "Eliminando networks no usadas..." -ForegroundColor Gray
        docker network prune -f

        Write-Host ""
        Write-Host "✅ Limpieza media completada" -ForegroundColor Green
    }

    "3" {
        Write-Host ""
        Write-Host "⚠️  ADVERTENCIA: Esto eliminará TODO" -ForegroundColor Red
        Write-Host "   - Todos los contenedores detenidos" -ForegroundColor Yellow
        Write-Host "   - Todas las imágenes no usadas" -ForegroundColor Yellow
        Write-Host "   - Todos los volúmenes no usados" -ForegroundColor Yellow
        Write-Host "   - Todo el build cache" -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "¿Estás seguro? (si/no)"

        if ($confirm -eq "si") {
            Write-Host ""
            Write-Host "🧹 Limpieza Completa..." -ForegroundColor Yellow
            Write-Host ""

            # System prune completo
            docker system prune -a --volumes -f

            # Build cache
            Write-Host "Eliminando build cache..." -ForegroundColor Gray
            docker builder prune -a -f

            Write-Host ""
            Write-Host "✅ Limpieza completa terminada" -ForegroundColor Green
        } else {
            Write-Host "❌ Cancelado" -ForegroundColor Yellow
        }
    }

    "4" {
        Write-Host ""
        Write-Host "📊 Estadísticas de Recursos:" -ForegroundColor Cyan
        Write-Host ""

        # Contenedores corriendo
        Write-Host "Contenedores corriendo:" -ForegroundColor Yellow
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.CPUPerc}}\t{{.MemUsage}}"

        Write-Host ""
        Write-Host "Uso de disco:" -ForegroundColor Yellow
        docker system df

        Write-Host ""
        Write-Host "Presiona Ctrl+C para salir del monitoreo en tiempo real" -ForegroundColor Gray
        Write-Host ""
        Start-Sleep -Seconds 2
        docker stats
    }

    "5" {
        Write-Host ""
        Write-Host "🛑 Deteniendo todos los contenedores..." -ForegroundColor Yellow

        $containers = docker ps -q
        if ($containers) {
            docker stop $containers
            Write-Host "✅ Todos los contenedores detenidos" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  No hay contenedores corriendo" -ForegroundColor Cyan
        }
    }

    "0" {
        Write-Host "👋 Saliendo..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

# Mostrar uso después de limpieza
Write-Host ""
Write-Host "📊 Uso después de limpieza:" -ForegroundColor Cyan
Write-Host ""
docker system df
Write-Host ""

# Recomendaciones
Write-Host "💡 Recomendaciones:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configurar Docker Desktop:" -ForegroundColor White
Write-Host "   - Settings → Resources" -ForegroundColor Gray
Write-Host "   - Memory: 2 GB" -ForegroundColor Gray
Write-Host "   - CPUs: 2" -ForegroundColor Gray
Write-Host "   - Swap: 1 GB" -ForegroundColor Gray
Write-Host "   - Disk: 20 GB" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Usar docker-compose.minimal.yml:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.minimal.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitorear recursos regularmente:" -ForegroundColor White
Write-Host "   docker stats" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Limpiar semanalmente:" -ForegroundColor White
Write-Host "   docker system prune -a --volumes -f" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Optimización Docker completada!" -ForegroundColor Green
Write-Host ""

pause
