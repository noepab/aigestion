# Script de Optimizacion NEXUS V1 para Mini PC
# Ejecutar como Administrador

Write-Host "NEXUS V1 - Script de Optimizacion para Mini PC" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar WSL2
Write-Host "Paso 1: Configurando WSL2..." -ForegroundColor Yellow

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
    Write-Host "   WSL2 configurado: $wslConfigPath" -ForegroundColor Green
} catch {
    Write-Host "   Error configurando WSL2: $_" -ForegroundColor Red
}

# 2. Reiniciar WSL
Write-Host ""
Write-Host "Paso 2: Reiniciando WSL2..." -ForegroundColor Yellow

try {
    wsl --shutdown
    Start-Sleep -Seconds 8
    Write-Host "   WSL2 reiniciado" -ForegroundColor Green
} catch {
    Write-Host "   Error reiniciando WSL2: $_" -ForegroundColor Red
}

# 3. Limpiar archivos temporales
Write-Host ""
Write-Host "Paso 3: Limpiando archivos temporales..." -ForegroundColor Yellow

try {
    Write-Host "   Eliminando archivos TEMP generales..." -ForegroundColor Gray
    Remove-Item "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

    # Clean Turborepo Daemon
    Write-Host "   Limpio Daemon de Turborepo..." -ForegroundColor Gray
    $turboPath = "$env:TEMP\turbod"
    if (Test-Path $turboPath) {
        Remove-Item $turboPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Daemon Turborepo eliminado" -ForegroundColor Green
    }

    # Clean Local Turbo Cache
    if (Test-Path ".turbo") {
        Remove-Item ".turbo" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   Cache local .turbo eliminada" -ForegroundColor Green
    }

    Write-Host "   Archivos temporales eliminados" -ForegroundColor Green
} catch {
    Write-Host "   Algunos archivos no pudieron eliminarse (es normal si estan en uso)" -ForegroundColor Yellow
}

# 4. Verificar espacio en disco
Write-Host ""
Write-Host "Paso 4: Verificando espacio en disco..." -ForegroundColor Yellow

$disk = Get-PSDrive C
$freeSpaceGB = [math]::Round($disk.Free / 1GB, 2)
$totalSpaceGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
$usedSpaceGB = [math]::Round($disk.Used / 1GB, 2)

Write-Host ""
Write-Host "   Disco C:\" -ForegroundColor Cyan
Write-Host "   Total: $totalSpaceGB GB" -ForegroundColor White
Write-Host "   Usado: $usedSpaceGB GB" -ForegroundColor White
Write-Host "   Libre: $freeSpaceGB GB" -ForegroundColor Green

if ($freeSpaceGB -lt 10) {
    Write-Host ""
    Write-Host "   ADVERTENCIA: Menos de 10GB libres!" -ForegroundColor Red
}

# 5. Resumen
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Optimizacion completada!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Reinicia tu PC" -ForegroundColor White
Write-Host ""
Write-Host "2. Configura Docker Desktop:" -ForegroundColor White
Write-Host "   - Settings -> Resources" -ForegroundColor Gray
Write-Host "   - Memory: 2 GB" -ForegroundColor Gray
Write-Host "   - CPUs: 2" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Limpiar Docker:" -ForegroundColor White
Write-Host "   docker system prune -a --volumes -f" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Usar docker-compose minimal:" -ForegroundColor White
Write-Host "   docker-compose -f docker-compose.minimal.yml up -d" -ForegroundColor Gray
Write-Host ""

Write-Host "Listo para conseguir tus primeros 10 clientes!" -ForegroundColor Green
Write-Host ""

pause

