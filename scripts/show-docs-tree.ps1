#!/usr/bin/env pwsh
#Requires -Version 7.0
param(
    [ValidateSet("Text", "JSON", "CSV")]
    [string]$Format = "Text",
    [switch]$ShowStats,
    [switch]$Detailed
)
$ErrorActionPreference = "Stop"

$DocsRoot = Join-Path (Split-Path -Parent $PSScriptRoot) "docs"

# Estructura de árbol
function BuildTreeData([string]$Path) {
    $items = @(Get-ChildItem -Path $Path -ErrorAction SilentlyContinue | Sort-Object PSIsContainer -Descending)
    $result = @()

    foreach ($item in $items) {
        $obj = @{
            Name     = $item.Name
            Path     = $item.FullName
            IsDir    = $item.PSIsContainer
            Size     = if ($item.PSIsContainer) { 0 } else { $item.Length }
            Modified = $item.LastWriteTime
            Items    = @()
        }

        if ($item.PSIsContainer) {
            $obj.Items = @(BuildTreeData -Path $item.FullName)
            $obj.Size = ($obj.Items | Measure-Object -Property Size -Sum).Sum
        }

        $result += $obj
    }

    return $result
}

# Renderizar como texto
function RenderText([array]$Items, [string]$Prefix = "") {
    for ($i = 0; $i -lt $Items.Count; $i++) {
        $item = $Items[$i]
        $isLast = $i -eq $Items.Count - 1
        $conn = if ($isLast) { "└── " } else { "├── " }
        $icon = if ($item.IsDir) { "📁" } else { "📄" }

        $sz = if ($item.IsDir) { "($($item.Items.Count) docs)" } else { "($([math]::Round($item.Size/1KB, 1)) KB)" }
        Write-Host "$Prefix$conn$icon $($item.Name) $sz" -ForegroundColor (if ($item.IsDir) { "Cyan" } else { "Gray" })

        if ($item.IsDir -and $item.Items.Count -gt 0) {
            $newPrefix = $Prefix + (if ($isLast) { "    " } else { "│   " })
            RenderText -Items $item.Items -Prefix $newPrefix
        }
    }
}

# Renderizar como JSON
function RenderJSON([array]$Items) {
    $result = @()
    foreach ($item in $Items) {
        $obj = @{
            name        = $item.Name
            isDirectory = $item.IsDir
            size        = $item.Size
            modified    = $item.Modified.ToString("o")
        }

        if ($item.IsDir -and $item.Items.Count -gt 0) {
            $obj.children = @(RenderJSON -Items $item.Items)
        }

        $result += $obj
    }
    return $result
}

# Renderizar como CSV
function RenderCSV([array]$Items, [array]$Rows = @()) {
    foreach ($item in $Items) {
        $row = @{
            Name     = $item.Name
            Type     = if ($item.IsDir) { "Folder" } else { "File" }
            SizeKB   = [math]::Round($item.Size / 1KB, 2)
            Modified = $item.Modified.ToString("yyyy-MM-dd")
        }
        $Rows += $row

        if ($item.IsDir -and $item.Items.Count -gt 0) {
            $Rows = RenderCSV -Items $item.Items -Rows $Rows
        }
    }
    return $Rows
}

# Main execution
Write-Host "`n📚 NEXUS V1 Documentation Structure" -ForegroundColor Green
Write-Host ("=" * 80) -ForegroundColor DarkGray

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$treeData = @(BuildTreeData -Path $DocsRoot)
$sw.Stop()

$allDocs = Get-ChildItem -Path $DocsRoot -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
$totalSize = [math]::Round(($allDocs | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "📊 Total: $($allDocs.Count) docs | $totalSize MB | $([math]::Round($sw.Elapsed.TotalMilliseconds))ms" -ForegroundColor Yellow
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host ""

switch ($Format) {
    "Text" { RenderText -Items $treeData }
    "JSON" { RenderJSON -Items $treeData | ConvertTo-Json -Depth 10 | Write-Host }
    "CSV" {
        $rows = @(RenderCSV -Items $treeData)
        $rows | ConvertTo-Csv -NoTypeInformation | Write-Host
    }
}

# Estadísticas si se solicita
if ($ShowStats) {
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor DarkGray
    Write-Host "📈 Statistics by Category" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor DarkGray

    Get-ChildItem -Path $DocsRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name | ForEach-Object {
        $files = (Get-ChildItem -Path $_.FullName -Filter "*.md" -Recurse -ErrorAction SilentlyContinue).Count
        $size = [math]::Round(((Get-ChildItem -Path $_.FullName -File -Recurse -ErrorAction SilentlyContinue) | Measure-Object -Property Length -Sum).Sum / 1KB, 1)
        Write-Host "📁 $($_.Name): $files files | $size KB" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 80) -ForegroundColor DarkGray
Write-Host "✅ Documentation structure mapped successfully!" -ForegroundColor Green

