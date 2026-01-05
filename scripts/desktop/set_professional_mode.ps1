# Set Professional Mode - AIGestion
# Forces wallpaper and ensures clean desktop state

$wallpaperPath = "C:\Users\Alejandro\AIGestion\assets\wallpaper_aigestion_pro.png"

# 1. Kill known conflicting processes
$conflicts = @("Comet", "Perplexity Loop", "WallpaperEngine")
foreach ($proc in $conflicts) {
    if (Get-Process -Name $proc -ErrorAction SilentlyContinue) {
        Stop-Process -Name $proc -Force -ErrorAction SilentlyContinue
        Write-Host "Terminated conflicting process: $proc"
    }
}

# 2. Set Wallpaper (using SystemParametersInfo SPI_SETDESKWALLPAPER)
$code = @'
using System;
using System.Runtime.InteropServices;
public class Wallpaper {
    [DllImport("user32.dll", CharSet=CharSet.Auto)]
    public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
'@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

# SPI_SETDESKWALLPAPER = 20, SPIF_UPDATEINIFILE = 0x01, SPIF_SENDWININICHANGE = 0x02
$SPI_SETDESKWALLPAPER = 20
$SPIF_UPDATEINIFILE = 0x01
$SPIF_SENDWININICHANGE = 0x02

if (Test-Path $wallpaperPath) {
    [Wallpaper]::SystemParametersInfo($SPI_SETDESKWALLPAPER, 0, $wallpaperPath, $SPIF_UPDATEINIFILE -bor $SPIF_SENDWININICHANGE)
    Write-Host "Wallpaper set to: $wallpaperPath"
} else {
    Write-Warning "Wallpaper file not found at: $wallpaperPath"
}

# 3. Refresh Desktop (optional trigger)
rundll32.exe user32.dll,UpdatePerUserSystemParameters
