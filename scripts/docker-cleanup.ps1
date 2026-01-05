#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Limpieza automática de recursos Docker no utilizados

.DESCRIPTION
    Elimina contenedores detenidos, imágenes antiguas, volúmenes huérfanos
    y build cache para liberar espacio en disco manteniendo recursos activos

.PARAMETER KeepStorage
    Cantidad de storage de build cache a mantener (default: 20GB)

.PARAMETER ImageRetention
    Horas de retención para imágenes sin usar (default: 72h)

.PARAMETER DryRun
    Mostrar qué se eliminaría sin ejecutar cambios

.EXAMPLE
    .\docker-cleanup.ps1
    .\docker-cleanup.ps1 -KeepStorage 30GB -ImageRetention 168
    .\docker-cleanup.ps1 -DryRun
#>

[CmdletBinding()]
param(
    [string]$KeepStorage = "20GB",
    [int]$ImageRetention = 72,  # horas
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

$Stats = @{
    ContainersRemoved = 0
    ImagesRemoved = 0
    VolumesRemoved = 0
    CacheCleared = 0
    SpaceFreed = 0
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

function Write-Section {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
    Write-ColorOutput "  $Title" -Color Yellow
    Write-ColorOutput "═══════════════════════════════════════════════════════════" -Color Cyan
}

function Get-DockerDiskUsage {
    try {
        $usage = docker system df --format "{{json .}}" | ConvertFrom-Json
        return $usage
    }
    catch {
        Write-ColorOutput "⚠️ No se pudo obtener uso de disco de Docker" -Color Yellow
        return $null
    }
}

function Show-DiskUsage {
    param([string]$Label)

    Write-Section "$Label - Uso de Disco"

    $usage = Get-DockerDiskUsage
    if ($usage) {
        docker system df
    }
}

function Remove-StoppedContainers {
    Write-Section "LIMPIANDO CONTENEDORES DETENIDOS"

    try {
        $stoppedContainers = docker ps -aq -f status=exited -f status=dead

        if (-not $stoppedContainers) {
            Write-ColorOutput "✅ No hay contenedores detenidos" -Color Green
            return
        }

        $count = ($stoppedContainers | Measure-Object).Count
        Write-ColorOutput "🔍 Encontrados $count contenedores detenidos" -Color Cyan

        if ($DryRun) {
            Write-ColorOutput "ℹ️ DRY-RUN: Se eliminarían $count contenedores" -Color Yellow
            $stoppedContainers | ForEach-Object {
                $info = docker inspect $_ --format "{{.Name}} ({{.Image}})" 2>$null
                Write-ColorOutput "   - $info" -Color Gray
            }
        }
        else {
            docker container prune -f
            Write-ColorOutput "✅ $count contenedores eliminados" -Color Green
            $Stats.ContainersRemoved = $count
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando contenedores: $_" -Color Red
    }
}

function Remove-UnusedImages {
    Write-Section "LIMPIANDO IMÁGENES SIN USAR"

    try {
        # Obtener imágenes antiguas (sin usar en las últimas X horas)
        $filter = "until=$($ImageRetention)h"

        if ($DryRun) {
            $unusedImages = docker images -f "dangling=false" --format "{{json .}}" | ConvertFrom-Json
            $oldImages = $unusedImages | Where-Object {
                $_.CreatedAt -match '(\d+) (hour|day|week|month)s? ago'
            }

            if ($oldImages) {
                $count = ($oldImages | Measure-Object).Count
                Write-ColorOutput "ℹ️ DRY-RUN: Se eliminarían ~$count imágenes antiguas" -Color Yellow
                $oldImages | Select-Object -First 10 | ForEach-Object {
                    Write-ColorOutput "   - $($_.Repository):$($_.Tag) ($($_.Size))" -Color Gray
                }
                if ($count -gt 10) {
                    Write-ColorOutput "   ... y $($count - 10) más" -Color Gray
                }
            }
            else {
                Write-ColorOutput "✅ No hay imágenes antiguas" -Color Green
            }
        }
        else {
            $before = (docker images -q | Measure-Object).Count
            docker image prune -a -f --filter $filter
            $after = (docker images -q | Measure-Object).Count
            $removed = $before - $after

            Write-ColorOutput "✅ $removed imágenes eliminadas" -Color Green
            $Stats.ImagesRemoved = $removed
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando imágenes: $_" -Color Red
    }
}

function Remove-DanglingImages {
    Write-Section "LIMPIANDO IMÁGENES DANGLING"

    try {
        $danglingImages = docker images -f "dangling=true" -q

        if (-not $danglingImages) {
            Write-ColorOutput "✅ No hay imágenes dangling" -Color Green
            return
        }

        $count = ($danglingImages | Measure-Object).Count
        Write-ColorOutput "🔍 Encontradas $count imágenes dangling" -Color Cyan

        if ($DryRun) {
            Write-ColorOutput "ℹ️ DRY-RUN: Se eliminarían $count imágenes dangling" -Color Yellow
        }
        else {
            docker image prune -f
            Write-ColorOutput "✅ $count imágenes dangling eliminadas" -Color Green
            $Stats.ImagesRemoved += $count
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando imágenes dangling: $_" -Color Red
    }
}

function Remove-UnusedVolumes {
    Write-Section "LIMPIANDO VOLÚMENES HUÉRFANOS"

    try {
        $unusedVolumes = docker volume ls -qf dangling=true

        if (-not $unusedVolumes) {
            Write-ColorOutput "✅ No hay volúmenes huérfanos" -Color Green
            return
        }

        $count = ($unusedVolumes | Measure-Object).Count
        Write-ColorOutput "🔍 Encontrados $count volúmenes huérfanos" -Color Cyan

        if ($DryRun) {
            Write-ColorOutput "ℹ️ DRY-RUN: Se eliminarían $count volúmenes" -Color Yellow
            $unusedVolumes | ForEach-Object {
                Write-ColorOutput "   - $_" -Color Gray
            }
        }
        else {
            docker volume prune -f
            Write-ColorOutput "✅ $count volúmenes eliminados" -Color Green
            $Stats.VolumesRemoved = $count
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando volúmenes: $_" -Color Red
    }
}

function Clear-BuildCache {
    Write-Section "LIMPIANDO BUILD CACHE"

    try {
        if ($DryRun) {
            $cacheInfo = docker buildx du
            Write-ColorOutput "ℹ️ DRY-RUN: Se limpiaría cache manteniendo $KeepStorage" -Color Yellow
            Write-ColorOutput "`n$cacheInfo" -Color Gray
        }
        else {
            # Obtener tamaño antes de limpiar
            $beforeOutput = docker system df --format "{{.Type}},{{.Reclaimable}}" | Select-String "Build Cache"

            docker builder prune -f --keep-storage $KeepStorage

            # Obtener tamaño después
            $afterOutput = docker system df --format "{{.Type}},{{.Reclaimable}}" | Select-String "Build Cache"

            Write-ColorOutput "✅ Build cache limpiado (manteniendo $KeepStorage)" -Color Green

            if ($beforeOutput -and $afterOutput) {
                Write-ColorOutput "   Antes: $beforeOutput" -Color Gray
                Write-ColorOutput "   Después: $afterOutput" -Color Gray
            }
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando build cache: $_" -Color Red
    }
}

function Remove-UnusedNetworks {
    Write-Section "LIMPIANDO REDES SIN USAR"

    try {
        $unusedNetworks = docker network ls --filter "type=custom" --format "{{.ID}}" | ForEach-Object {
            $network = $_
            $connected = docker network inspect $network --format "{{.Containers}}" 2>$null
            if ($connected -eq "map[]") {
                $network
            }
        }

        if (-not $unusedNetworks) {
            Write-ColorOutput "✅ No hay redes personalizadas sin usar" -Color Green
            return
        }

        $count = ($unusedNetworks | Measure-Object).Count
        Write-ColorOutput "🔍 Encontradas $count redes sin usar" -Color Cyan

        if ($DryRun) {
            Write-ColorOutput "ℹ️ DRY-RUN: Se eliminarían $count redes" -Color Yellow
        }
        else {
            docker network prune -f
            Write-ColorOutput "✅ $count redes eliminadas" -Color Green
        }
    }
    catch {
        Write-ColorOutput "❌ Error limpiando redes: $_" -Color Red
    }
}

function Show-CleanupSummary {
    Write-Section "RESUMEN DE LIMPIEZA"

    if ($DryRun) {
        Write-ColorOutput "ℹ️ Modo DRY-RUN - No se realizaron cambios reales" -Color Yellow
    }
    else {
        Write-ColorOutput "`n📊 Recursos eliminados:" -Color Cyan
        Write-ColorOutput "   Contenedores: $($Stats.ContainersRemoved)" -Color White
        Write-ColorOutput "   Imágenes: $($Stats.ImagesRemoved)" -Color White
        Write-ColorOutput "   Volúmenes: $($Stats.VolumesRemoved)" -Color White

        $totalItems = $Stats.ContainersRemoved + $Stats.ImagesRemoved + $Stats.VolumesRemoved

        if ($totalItems -gt 0) {
            Write-ColorOutput "`n✅ Limpieza completada exitosamente" -Color Green
        }
        else {
            Write-ColorOutput "`n✨ Sistema ya estaba limpio" -Color Green
        }
    }

    # Mostrar uso actual
    Show-DiskUsage -Label "DESPUÉS DE LIMPIEZA"
}

function Show-Recommendations {
    Write-Section "RECOMENDACIONES"

    $usage = Get-DockerDiskUsage
    if (-not $usage) { return }

    # Parsear uso de disco
    $buildCacheLine = docker system df --format "{{.Type}},{{.Size}}" | Select-String "Build Cache"
    if ($buildCacheLine -and $buildCacheLine -match '(\d+\.?\d*)(GB|MB)') {
        $cacheSize = [float]$Matches[1]
        $unit = $Matches[2]

        if ($unit -eq "GB" -and $cacheSize -gt 30) {
            Write-ColorOutput "💡 Build cache muy grande ($cacheSize GB)" -Color Yellow
            Write-ColorOutput "   Ejecutar: docker builder prune -f --keep-storage 15GB" -Color Gray
        }
    }

    # Verificar imágenes
    $totalImages = (docker images -q | Measure-Object).Count
    if ($totalImages -gt 50) {
        Write-ColorOutput "💡 Muchas imágenes almacenadas ($totalImages)" -Color Yellow
        Write-ColorOutput "   Considerar: docker image prune -a -f --filter until=168h" -Color Gray
    }

    # Verificar volúmenes
    $totalVolumes = (docker volume ls -q | Measure-Object).Count
    if ($totalVolumes -gt 20) {
        Write-ColorOutput "💡 Muchos volúmenes ($totalVolumes)" -Color Yellow
        Write-ColorOutput "   Revisar manualmente: docker volume ls" -Color Gray
    }

    # Sugerencia de automatización
    Write-ColorOutput "`n🤖 Automatización recomendada:" -Color Cyan
    Write-ColorOutput "   Ejecutar este script semanalmente con Task Scheduler" -Color Gray
    Write-ColorOutput "   Ver: scripts/README.md - Sección 'Automatización'" -Color Gray
}

# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

try {
    Write-ColorOutput "╔═══════════════════════════════════════════════════════════╗" -Color Cyan
    Write-ColorOutput "║  Docker Cleanup - NEXUS V1                                     ║" -Color Yellow
    Write-ColorOutput "╚═══════════════════════════════════════════════════════════╝" -Color Cyan

    if ($DryRun) {
        Write-ColorOutput "`nℹ️ Modo DRY-RUN activado (sin cambios reales)" -Color Yellow
    }

    Write-ColorOutput "`nConfiguración:" -Color Cyan
    Write-ColorOutput "  Keep Storage: $KeepStorage" -Color White
    Write-ColorOutput "  Image Retention: $ImageRetention hours" -Color White

    # Mostrar uso antes de limpiar
    Show-DiskUsage -Label "ANTES DE LIMPIEZA"

    # Ejecutar limpieza
    Remove-StoppedContainers
    Remove-DanglingImages
    Remove-UnusedImages
    Remove-UnusedVolumes
    Clear-BuildCache
    Remove-UnusedNetworks

    # Resumen y recomendaciones
    Show-CleanupSummary
    Show-Recommendations

    Write-ColorOutput "`n✅ Limpieza finalizada" -Color Green
}
catch {
    Write-ColorOutput "`n❌ Error durante limpieza: $_" -Color Red
    Write-ColorOutput $_.ScriptStackTrace -Color Red
    exit 1
}

