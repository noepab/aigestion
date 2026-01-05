#!/usr/bin/env pwsh
#Requires -Version 7.0
param([switch]$NoCache, [switch]$Verbose)
$ErrorActionPreference = "Stop"

$DocsRoot = Join-Path (Split-Path -Parent $PSScriptRoot) "docs"
$CacheDir = Join-Path (Split-Path -Parent $DocsRoot) ".cache"
$CacheFile = Join-Path $CacheDir "docs-index.cache"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

# Crear caché directory si no existe
if (-not (Test-Path $CacheDir)) { New-Item -Path $CacheDir -ItemType Directory -Force | Out-Null }

# Cargar caché anterior
$cache = @{}
if ((Test-Path $CacheFile) -and -not $NoCache) {
    try {
        $cache = Get-Content $CacheFile -Raw | ConvertFrom-Json -AsHashtable
        Write-Host "📦 Cache loaded ($(($cache.Keys).Count) entries)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "⚠️  Cache corrupted, regenerating..." -ForegroundColor Yellow
        $cache = @{}
    }
}

# Generar índice
$index = "# NEXUS V1 Documentation Index`n`nUpdated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"
$metadata = @{}
$categoryCount = 0

Get-ChildItem -Path $DocsRoot -Directory | Sort-Object Name | ForEach-Object {
    $cat = $_
    $catName = $cat.Name
    $index += "## $catName`n`n"
    $categoryCount++

    Get-ChildItem -Path $cat.FullName -Filter "*.md" -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $docName = $_.BaseName
        $docPath = $_.FullName.Replace('\', '/')
        $docKey = "$catName/$docName"

        # Verificar si está en caché
        if ($cache.ContainsKey($docKey)) {
            $metadata[$docKey] = $cache[$docKey]
        }
        else {
            # Extraer metadata
            $firstLine = (Get-Content -Path $_.FullName -TotalCount 5 -ErrorAction SilentlyContinue | Where-Object { $_ -match "^#" }) | Select-Object -First 1
            $desc = if ($firstLine) { $firstLine.Replace("# ", "").Replace("## ", "") } else { "" }

            $metadata[$docKey] = @{
                name        = $docName
                path        = $docPath
                description = $desc
                size        = $_.Length
                modified    = $_.LastWriteTime.ToString("yyyy-MM-dd")
            }
        }

        $entry = $metadata[$docKey]
        $index += "- **[$($entry.name)]($($entry.path))** - $($entry.description) *($($entry.modified))*`n"
    }
    $index += "`n"
}

# Guardar índice
$index | Set-Content (Join-Path $DocsRoot "INDEX.md")

# Guardar caché
$metadata | ConvertTo-Json | Set-Content $CacheFile

$sw.Stop()
Write-Host "✅ Index generated: $categoryCount categories | $(($metadata.Keys).Count) docs | $($sw.Elapsed.TotalSeconds)ms" -ForegroundColor Green

