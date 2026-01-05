# Script de Deploy Automatizado - NEXUS V1 Dashboard
# Ejecutar desde la raíz del proyecto

Write-Host "🚀 NEXUS V1 - Deploy Automatizado" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path ".\frontend") -or -not (Test-Path ".\server")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto NEXUS V1" -ForegroundColor Red
    exit 1
}

# Función para verificar si un comando existe
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Verificar dependencias
Write-Host "📋 Verificando dependencias..." -ForegroundColor Yellow

$missingDeps = @()

if (-not (Test-Command "node")) {
    $missingDeps += "Node.js"
}

if (-not (Test-Command "pnpm")) {
    $missingDeps += "pnpm"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "❌ Faltan dependencias: $($missingDeps -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instala las dependencias faltantes:" -ForegroundColor Yellow
    if ($missingDeps -contains "Node.js") {
        Write-Host "  - Node.js: https://nodejs.org" -ForegroundColor Gray
    }
    if ($missingDeps -contains "pnpm") {
        Write-Host "  - pnpm: npm install -g pnpm" -ForegroundColor Gray
    }
    exit 1
}

Write-Host "✅ Todas las dependencias instaladas" -ForegroundColor Green
Write-Host ""

# Menú de opciones
Write-Host "Selecciona qué deseas deployar:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Landing Page (Vercel)" -ForegroundColor White
Write-Host "2. Dashboard (Vercel)" -ForegroundColor White
Write-Host "3. Backend (Railway)" -ForegroundColor White
Write-Host "4. Todo (Landing + Dashboard + Backend)" -ForegroundColor White
Write-Host "5. Solo Build Local (sin deploy)" -ForegroundColor White
Write-Host "0. Salir" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Opción"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Deploying Landing Page..." -ForegroundColor Cyan

        cd frontend\apps\landing-host

        # Build
        Write-Host "📦 Building..." -ForegroundColor Yellow
        pnpm run build

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build exitoso" -ForegroundColor Green

            # Deploy
            if (Test-Command "vercel") {
                Write-Host ""
                Write-Host "🚀 Deploying a Vercel..." -ForegroundColor Yellow
                vercel --prod
            } else {
                Write-Host ""
                Write-Host "⚠️  Vercel CLI no instalado" -ForegroundColor Yellow
                Write-Host "Instala con: npm install -g vercel" -ForegroundColor Gray
                Write-Host ""
                Write-Host "O deploy manualmente:" -ForegroundColor Yellow
                Write-Host "1. Ir a https://vercel.com" -ForegroundColor Gray
                Write-Host "2. Import Git Repository" -ForegroundColor Gray
                Write-Host "3. Seleccionar frontend/apps/landing-host" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Build falló" -ForegroundColor Red
        }

        cd ..\..\..
    }

    "2" {
        Write-Host ""
        Write-Host "🚀 Deploying Dashboard..." -ForegroundColor Cyan

        cd frontend\apps\dashboard

        # Verificar .env.production
        if (-not (Test-Path ".env.production")) {
            Write-Host "⚠️  Creando .env.production desde template..." -ForegroundColor Yellow
            Copy-Item ".env.production.template" ".env.production"
            Write-Host ""
            Write-Host "⚠️  IMPORTANTE: Edita .env.production con tu URL de backend" -ForegroundColor Yellow
            Write-Host "Archivo: frontend\apps\dashboard\.env.production" -ForegroundColor Gray
            Write-Host ""
            pause
        }

        # Build
        Write-Host "📦 Building..." -ForegroundColor Yellow
        pnpm run build

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build exitoso" -ForegroundColor Green

            # Deploy
            if (Test-Command "vercel") {
                Write-Host ""
                Write-Host "🚀 Deploying a Vercel..." -ForegroundColor Yellow
                vercel --prod
            } else {
                Write-Host ""
                Write-Host "⚠️  Vercel CLI no instalado" -ForegroundColor Yellow
                Write-Host "Instala con: npm install -g vercel" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Build falló" -ForegroundColor Red
        }

        cd ..\..\..
    }

    "3" {
        Write-Host ""
        Write-Host "🚀 Deploying Backend..." -ForegroundColor Cyan

        cd server

        # Build
        Write-Host "📦 Building..." -ForegroundColor Yellow
        npm run build

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Build exitoso" -ForegroundColor Green

            # Deploy
            if (Test-Command "railway") {
                Write-Host ""
                Write-Host "🚀 Deploying a Railway..." -ForegroundColor Yellow
                railway up
            } else {
                Write-Host ""
                Write-Host "⚠️  Railway CLI no instalado" -ForegroundColor Yellow
                Write-Host "Instala desde: https://railway.app/cli" -ForegroundColor Gray
                Write-Host ""
                Write-Host "O deploy manualmente:" -ForegroundColor Yellow
                Write-Host "1. Ir a https://railway.app" -ForegroundColor Gray
                Write-Host "2. New Project → Deploy from GitHub" -ForegroundColor Gray
                Write-Host "3. Seleccionar repositorio" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Build falló" -ForegroundColor Red
        }

        cd ..
    }

    "4" {
        Write-Host ""
        Write-Host "🚀 Deploying TODO..." -ForegroundColor Cyan
        Write-Host ""

        # Landing
        Write-Host "1/3 Landing Page..." -ForegroundColor Yellow
        cd frontend\apps\landing-host
        pnpm run build
        if (Test-Command "vercel") { vercel --prod }
        cd ..\..\..

        # Dashboard
        Write-Host ""
        Write-Host "2/3 Dashboard..." -ForegroundColor Yellow
        cd frontend\apps\dashboard
        pnpm run build
        if (Test-Command "vercel") { vercel --prod }
        cd ..\..\..

        # Backend
        Write-Host ""
        Write-Host "3/3 Backend..." -ForegroundColor Yellow
        cd server
        npm run build
        if (Test-Command "railway") { railway up }
        cd ..

        Write-Host ""
        Write-Host "✅ Deploy completo!" -ForegroundColor Green
    }

    "5" {
        Write-Host ""
        Write-Host "📦 Building localmente..." -ForegroundColor Cyan

        # Landing
        Write-Host ""
        Write-Host "1/3 Landing Page..." -ForegroundColor Yellow
        cd frontend\apps\landing-host
        pnpm run build
        cd ..\..\..

        # Dashboard
        Write-Host ""
        Write-Host "2/3 Dashboard..." -ForegroundColor Yellow
        cd frontend\apps\dashboard
        pnpm run build
        cd ..\..\..

        # Backend
        Write-Host ""
        Write-Host "3/3 Backend..." -ForegroundColor Yellow
        cd server
        npm run build
        cd ..

        Write-Host ""
        Write-Host "✅ Build completo!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Archivos generados:" -ForegroundColor Cyan
        Write-Host "  - frontend/apps/landing-host/dist" -ForegroundColor Gray
        Write-Host "  - frontend/apps/dashboard/dist" -ForegroundColor Gray
        Write-Host "  - server/dist" -ForegroundColor Gray
    }

    "0" {
        Write-Host "👋 Saliendo..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "✅ Proceso completado!" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que los deploys funcionan" -ForegroundColor White
Write-Host "2. Configura variables de entorno" -ForegroundColor White
Write-Host "3. Prueba el sistema completo" -ForegroundColor White
Write-Host "4. Lee DEPLOY_GUIDE.md para más detalles" -ForegroundColor White
Write-Host ""

pause

