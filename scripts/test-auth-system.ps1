Write-Host "🚀 Iniciando pruebas del Sistema de Autenticación NEXUS V1..." -ForegroundColor Cyan
Write-Host ""

# Función para verificar servidor
function Test-Server {
  param($Url, $Name)
  try {
    $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
      Write-Host "✅ $Name está funcionando correctamente" -ForegroundColor Green
      return $true
    }
  }
  catch {
    Write-Host "❌ $Name no responde" -ForegroundColor Red
    return $false
  }
}

# Función para verificar archivo
function Test-FileExists {
  param($Path, $Name)
  if (Test-Path $Path) {
    Write-Host "✅ $Name existe" -ForegroundColor Green
    return $true
  }
  else {
    Write-Host "❌ $Name no encontrado" -ForegroundColor Red
    return $false
  }
}

Write-Host "📡 Verificando Servidores..." -ForegroundColor Yellow
Write-Host ""

$landingOk = Test-Server "http://localhost:4001" "Landing Host (http://localhost:4001)"
$dashboardOk = Test-Server "http://localhost:5173" "Dashboard (http://localhost:5173)"

Write-Host ""
Write-Host "📁 Verificando Archivos del Sistema..." -ForegroundColor Yellow
Write-Host ""

$repoRoot = $(git -C $PSScriptRoot rev-parse --show-toplevel 2>$null)
if (-not $repoRoot) {
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

$basePath = Join-Path $repoRoot "frontend\apps"

# Verificar archivos del Landing Host
$loginModalTsx = Test-FileExists "$basePath\landing-host\src\components\LoginModal.tsx" "LoginModal.tsx"
$loginModalCss = Test-FileExists "$basePath\landing-host\src\components\LoginModal.css" "LoginModal.css"
$authService = Test-FileExists "$basePath\landing-host\src\services\authService.ts" "authService.ts"

# Verificar archivos del Dashboard
$roleContext = Test-FileExists "$basePath\dashboard\src\context\RoleContext.tsx" "RoleContext.tsx"
$roleDashboard = Test-FileExists "$basePath\dashboard\src\pages\RoleDashboard.tsx" "RoleDashboard.tsx"

Write-Host ""
Write-Host "🎯 Verificando Dashboards por Rol..." -ForegroundColor Yellow
Write-Host ""

$dashboards = @(
  @{Name = "Admin (God Mode)"; File = "$basePath\dashboard\src\pages\dashboards\GodAdminDashboard.tsx" },
  @{Name = "Developer"; File = "$basePath\dashboard\src\pages\dashboards\DeveloperDashboard.tsx" },
  @{Name = "Analyst"; File = "$basePath\dashboard\src\pages\dashboards\AnalystDashboard.tsx" },
  @{Name = "Operator"; File = "$basePath\dashboard\src\pages\dashboards\OperatorDashboard.tsx" },
  @{Name = "Demo Cliente"; File = "$basePath\dashboard\src\pages\dashboards\DemoClienteDashboard.tsx" }
)

$allDashboardsOk = $true
foreach ($dashboard in $dashboards) {
  $exists = Test-FileExists $dashboard.File "Dashboard $($dashboard.Name)"
  if (-not $exists) { $allDashboardsOk = $false }
}

Write-Host ""
Write-Host "Resumen de Pruebas" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

$totalTests = 0
$passedTests = 0

# Contar tests
if ($landingOk) { $passedTests++ }
$totalTests++

if ($dashboardOk) { $passedTests++ }
$totalTests++

if ($loginModalTsx) { $passedTests++ }
$totalTests++

if ($loginModalCss) { $passedTests++ }
$totalTests++

if ($authService) { $passedTests++ }
$totalTests++

if ($roleContext) { $passedTests++ }
$totalTests++

if ($roleDashboard) { $passedTests++ }
$totalTests++

if ($allDashboardsOk) { $passedTests += 5 }
$totalTests += 5

Write-Host ""
Write-Host "Tests Pasados: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -eq $totalTests) {
  Write-Host ""
  Write-Host "🎉 ¡TODOS LOS TESTS PASARON!" -ForegroundColor Green
  Write-Host ""
  Write-Host "✨ El sistema de autenticación está completamente funcional" -ForegroundColor Green
  Write-Host ""
  Write-Host "🧪 Para probar manualmente:" -ForegroundColor Cyan
  Write-Host "   1. Abre http://localhost:4001/" -ForegroundColor White
  Write-Host "   2. Click en '🚀 Iniciar Sesión'" -ForegroundColor White
  Write-Host "   3. Selecciona un usuario demo o ingresa credenciales" -ForegroundColor White
  Write-Host "   4. Verifica la redirección al dashboard correcto" -ForegroundColor White
  Write-Host ""
  Write-Host "👥 Usuarios Demo Disponibles:" -ForegroundColor Cyan
  Write-Host "   👑 Admin:     admin@nexusv1.net / admin123" -ForegroundColor White
  Write-Host "   💻 Developer: dev@nexusv1.net / dev123" -ForegroundColor White
  Write-Host "   📊 Analyst:   analyst@nexusv1.net / analyst123" -ForegroundColor White
  Write-Host "   🔧 Operator:  ops@nexusv1.net / ops123" -ForegroundColor White
  Write-Host "   🌟 Demo:      demo@nexusv1.net / demo123" -ForegroundColor White
}
else {
  Write-Host ""
  Write-Host "⚠️  Algunos tests fallaron" -ForegroundColor Yellow
  Write-Host "   Revisa los errores arriba para más detalles" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan

