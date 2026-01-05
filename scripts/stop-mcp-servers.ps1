<#
Script: stop-mcp-servers.ps1
Descripción: Detiene todos los procesos de servidores MCP lanzados por start-mcp-servers-advanced.ps1
Uso: pwsh ./scripts/stop-mcp-servers.ps1
Recomendación: Ejecuta este script después de start-mcp-servers-advanced.ps1 para liberar recursos y evitar procesos huérfanos.
#>

$mcpConfigPath = "$PSScriptRoot/../vscode-userdata:/c%3A/Users/Alejandro/AppData/Roaming/Code/User/mcp.json"
$mcpConfigRaw = Get-Content $mcpConfigPath -Raw
$mcpConfig = $mcpConfigRaw | ConvertFrom-Json

$servers = $mcpConfig.servers.PSObject.Properties | ForEach-Object { $_.Value.command }
$uniqueCommands = $servers | Select-Object -Unique

foreach ($cmd in $uniqueCommands) {
    Write-Host "Buscando y deteniendo procesos: $cmd ..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.Path -like "*$cmd*" } | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force
            Write-Host "Detenido proceso PID: $($_.Id) ($cmd)" -ForegroundColor Green
        }
        catch {
            Write-Host "No se pudo detener PID: $($_.Id) ($cmd)" -ForegroundColor Red
        }
    }
}
Write-Host "Todos los servidores MCP han sido detenidos (si estaban en ejecución)."

# --- Notificación por correo ---
$mailTo = Read-Host "¿Deseas notificar por correo? Ingresa email destino o deja vacío para omitir"
if ($mailTo) {
    $smtpServer = "smtp.tu-servidor.com" # Cambia por tu servidor SMTP
    $from = "mcp-notify@tu-dominio.com"  # Cambia por tu remitente
    $subject = "[MCP] Servidores detenidos"
    $body = "Se han detenido todos los servidores MCP.\nFecha: $(Get-Date)"
    try {
        Send-MailMessage -To $mailTo -From $from -Subject $subject -Body $body -SmtpServer $smtpServer
        Write-Host "Correo de notificación enviado a $mailTo" -ForegroundColor Green
    }
    catch {
        Write-Host "No se pudo enviar el correo: $_" -ForegroundColor Red
    }
}
# --- Notificación por Telegram ---
$telegramToken = Read-Host "¿Deseas notificar por Telegram? Ingresa el token del bot o deja vacío para omitir"
if ($telegramToken) {
    $chatId = Read-Host "Ingresa el chat_id de Telegram"
    $tgBody = "Se han detenido todos los servidores MCP.%0AFecha: $(Get-Date)"
    $tgUrl = "https://api.telegram.org/bot$telegramToken/sendMessage?chat_id=$chatId&text=$tgBody"
    try {
        Invoke-RestMethod -Uri $tgUrl -Method Get | Out-Null
        Write-Host "Notificación enviada por Telegram" -ForegroundColor Green
    }
    catch {
        Write-Host "No se pudo enviar la notificación por Telegram: $_" -ForegroundColor Red
    }
}
Write-Host "Todos los servidores MCP han sido detenidos (si estaban en ejecución)."
