# Script de Optimización NEXUS V1 para Mini PC
# Ejecutar como Administrador

Write-Host "🚀 NEXUS V1 - Script de Optimización para Mini PC" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar si se ejecuta como administrador
function Test-Administrator {
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($user)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "⚠️  Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "   Click derecho → Ejecutar como administrador" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Ejecutando como Administrador" -ForegroundColor Green
Write-Host ""

# 1. Configurar WSL2
Write-Host "📝 Paso 1: Configurando WSL2..." -ForegroundColor Yellow

$wslConfigPath = "$env:USERPROFILE\.wslconfig"
$wslConfig = @"
[wsl2]
memory=2GB
processors=2
swap=1GB
nestedVirtualization=false
guiApplications=false
"@

try {
    $wslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8 -Force
    Write-Host "   ✅ WSL2 configurado: $wslConfigPath" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error configurando WSL2: $_" -ForegroundColor Red
}

# 2. Detener Docker
Write-Host ""
Write-Host "📝 Paso 2: Deteniendo Docker Desktop..." -ForegroundColor Yellow

try {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Docker Desktop detenido" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Docker Desktop no estaba ejecutándose" -ForegroundColor Yellow
}

# 3. Reiniciar WSL
Write-Host ""
Write-Host "📝 Paso 3: Reiniciando WSL2..." -ForegroundColor Yellow

try {
    wsl --shutdown
    Start-Sleep -Seconds 8
    Write-Host "   ✅ WSL2 reiniciado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error reiniciando WSL2: $_" -ForegroundColor Red
}

# 4. Limpiar Docker (si está instalado)
Write-Host ""
Write-Host "📝 Paso 4: Limpiando recursos de Docker..." -ForegroundColor Yellow

$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    try {
        # Esperar a que Docker inicie
        Write-Host "   Esperando a que Docker inicie..." -ForegroundColor Gray
        Start-Sleep -Seconds 10

        # Limpiar contenedores detenidos
        docker container prune -f 2>$null
        Write-Host "   ✅ Contenedores detenidos eliminados" -ForegroundColor Green

        # Limpiar imágenes no usadas
        docker image prune -a -f 2>$null
        Write-Host "   ✅ Imágenes no usadas eliminadas" -ForegroundColor Green

        # Limpiar volúmenes no usados
        docker volume prune -f 2>$null
        Write-Host "   ✅ Volúmenes no usados eliminados" -ForegroundColor Green

        # Limpiar build cache
        docker builder prune -a -f 2>$null
        Write-Host "   ✅ Caché de build limpiado" -ForegroundColor Green

        # Mostrar espacio liberado
        Write-Host ""
        Write-Host "   📊 Espacio en disco de Docker:" -ForegroundColor Cyan
        docker system df

    } catch {
        Write-Host "   ⚠️  Docker no está disponible o no está iniciado" -ForegroundColor Yellow
        Write-Host "   Inicia Docker Desktop manualmente y ejecuta:" -ForegroundColor Yellow
        Write-Host "   docker system prune -a --volumes -f" -ForegroundColor Gray
    }
} else {
    Write-Host "   ⚠️  Docker no está instalado" -ForegroundColor Yellow
}

# 5. Optimizar servicios de Windows
Write-Host ""
Write-Host "📝 Paso 5: Optimizando servicios de Windows..." -ForegroundColor Yellow

# Deshabilitar servicios innecesarios para desarrollo
$servicesToDisable = @(
    "DiagTrack",           # Telemetría
    "dmwappushservice",    # WAP Push
    "SysMain",             # Superfetch (puede ralentizar en PCs lentos)
    "WSearch"              # Windows Search (opcional)
)

foreach ($service in $servicesToDisable) {
    try {
        $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
        if ($svc -and $svc.Status -eq 'Running') {
            Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
            Set-Service -Name $service -StartupType Disabled -ErrorAction SilentlyContinue
            Write-Host "   ✅ Servicio $service deshabilitado" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  No se pudo deshabilitar $service" -ForegroundColor Yellow
    }
}

# 6. Limpiar archivos temporales
Write-Host ""
Write-Host "📝 Paso 6: Limpiando archivos temporales..." -ForegroundColor Yellow

try {
    # Limpiar temp de usuario
    Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Archivos temporales de usuario eliminados" -ForegroundColor Green

    # Limpiar temp de Windows
    Remove-Item "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Archivos temporales de Windows eliminados" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Algunos archivos temporales no pudieron eliminarse" -ForegroundColor Yellow
}

# 7. Verificar espacio en disco
Write-Host ""
Write-Host "📝 Paso 7: Verificando espacio en disco..." -ForegroundColor Yellow

$disk = Get-PSDrive C
$freeSpaceGB = [math]::Round($disk.Free / 1GB, 2)
$totalSpaceGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
$usedSpaceGB = [math]::Round($disk.Used / 1GB, 2)
$percentUsed = [math]::Round(($disk.Used / ($disk.Used + $disk.Free)) * 100, 2)

Write-Host ""
Write-Host "   💾 Disco C:\" -ForegroundColor Cyan
Write-Host "   Total: $totalSpaceGB GB" -ForegroundColor White
Write-Host "   Usado: $usedSpaceGB GB ($percentUsed%)" -ForegroundColor White
Write-Host "   Libre: $freeSpaceGB GB" -ForegroundColor Green

if ($freeSpaceGB -lt 10) {
    Write-Host ""
    Write-Host "   ⚠️  ADVERTENCIA: Menos de 10GB libres!" -ForegroundColor Red
    Write-Host "   Considera liberar más espacio" -ForegroundColor Yellow
}

# 8. Resumen y recomendaciones
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "✅ Optimización completada!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Reinicia tu PC para aplicar todos los cambios" -ForegroundColor White
Write-Host ""
Write-Host "2. Configura Docker Desktop manualmente:" -ForegroundColor White
Write-Host "   - Abre Docker Desktop" -ForegroundColor Gray
Write-Host "   - Settings → Resources" -ForegroundColor Gray
Write-Host "   - Memory: 2 GB" -ForegroundColor Gray
Write-Host "   - CPUs: 2" -ForegroundColor Gray
Write-Host "   - Swap: 1 GB" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Usa docker-compose.minimal.yml:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.minimal.yml up -d" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitorea recursos:" -ForegroundColor White
Write-Host "   docker stats" -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Consejos adicionales:" -ForegroundColor Cyan
Write-Host "   - Cierra aplicaciones no necesarias" -ForegroundColor White
Write-Host "   - Usa SQLite en lugar de MongoDB" -ForegroundColor White
Write-Host "   - Considera deploy a nube gratuita (Vercel + Railway)" -ForegroundColor White
Write-Host "   - Lee GROWTH_PLAN.md para estrategia completa" -ForegroundColor White
Write-Host ""

Write-Host "🚀 ¡Listo para conseguir tus primeros 10 clientes!" -ForegroundColor Green
Write-Host ""

pause

