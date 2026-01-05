#!/usr/bin/env pwsh
# Script de limpieza profunda y robusta para NEXUS V1
# Reemplaza comandos de pnpm que pueden fallar por falta de TTY

Write-Host "🧹 Iniciando limpieza profunda del proyecto..." -ForegroundColor Cyan

$Root = $PSScriptRoot | Split-Path -Parent
$DirsToRemove = @("node_modules", ".turbo", "dist", "build", ".next", "storybook-static", "coverage")

# Función para limpiar recursivamente
function Clean-Recursive($Path) {
    if (-not (Test-Path $Path)) { return }
    
    Get-ChildItem -Path $Path -Directory -Recurse | ForEach-Object {
        $dir = $_
        if ($DirsToRemove -contains $dir.Name) {
            Write-Host "   🗑️  Eliminando $($dir.FullName)..." -ForegroundColor Gray
            try {
                Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
            }
            catch {
                Write-Host "   ⚠️  No se pudo eliminar $($dir.FullName): $_" -ForegroundColor Yellow
            }
        }
    }
}

# 1. Limpiar Root
Write-Host "`n1️⃣  Limpiando Root..." -ForegroundColor Yellow
foreach ($dir in $DirsToRemove) {
    $target = Join-Path $Root $dir
    if (Test-Path $target) {
        Write-Host "   🗑️  Eliminando $target..." -ForegroundColor Gray
        Remove-Item -Path $target -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 2. Limpiar Workspaces
Write-Host "`n2️⃣  Limpiando Workspaces..." -ForegroundColor Yellow
Clean-Recursive (Join-Path $Root "server")
Clean-Recursive (Join-Path $Root "frontend")
Clean-Recursive (Join-Path $Root "packages")

# 3. Limpiar Cache Global (Opcional)
# pnpm store prune está comentado para evitar descargas masivas después
# Write-Host "`n3️⃣  Limpiando Cache de PNPM..." -ForegroundColor Yellow
# pnpm store prune

Write-Host "`n✨ Limpieza completada. Ejecuta 'pnpm install' para restaurar dependencias." -ForegroundColor Green

