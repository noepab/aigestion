
$excludeDirs = @(".git", "node_modules", "dist", "build", "coverage", ".next")
$excludeExtensions = @(".png", ".jpg", ".jpeg", ".gif", ".ico", ".mp4", ".mov", ".avi", ".pdf", ".zip", ".tar", ".gz", ".7z", ".exe", ".dll", ".so", ".dylib", ".class", ".pyc")

function Update-FileContent {
    param (
        [string]$Path
    )

    try {
        $content = Get-Content -Path $Path -Raw -ErrorAction Stop
        
        # Case insensitive replacement for generic AIG -> NEXUS V1
        # We also want to preserve case if possible for common patterns:
        # AIG -> NEXUS V1
        # Aig -> NEXUS V1
        # aig -> NEXUS V1
        
        if ($content -match "AIG") {
            $newContent = $content -creplace "AIG", "NEXUS V1" `
                -creplace "Aig", "NEXUS V1" `
                -creplace "aig", "NEXUS V1"
            
            if ($content -ne $newContent) {
                Set-Content -Path $Path -Value $newContent -NoNewline -Encoding UTF8
                Write-Host "Updated: $Path"
            }
        }
    }
    catch {
        Write-Warning "Could not process $Path : $_"
    }
}

Get-ChildItem -Path . -Recurse -File | ForEach-Object {
    $file = $_
    $relPath = $file.FullName.Substring((Get-Location).Path.Length)
    
    # Check excludes
    $skip = $false
    
    # Skip the script itself
    if ($file.Name -eq "replace_content_aig_to_NEXUS V1.ps1") { $skip = $true }

    foreach ($dir in $excludeDirs) {
        if ($relPath -match "\\$dir\\") { $skip = $true; break }
    }
    if ($excludeExtensions -contains $file.Extension) { $skip = $true }
    
    if (-not $skip) {
        Update-FileContent -Path $file.FullName
    }
}
Write-Host "Global replacement complete."

