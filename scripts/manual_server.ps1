# Run Turborepo language server manually to capture errors
# Adjust socket path if needed
$turbodPath = "$env:LOCALAPPDATA\turbod\debug.sock"
Write-Host "Starting Turborepo language server..."
 turbo language-server --socket $turbodPath
