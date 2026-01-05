Write-Host "NEXUS V1 NeuroCore - Starting..." -ForegroundColor Cyan

# Check for Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Error "Python no encontrado. Instala Python 3.10+"
  exit 1
}

# Check/Create VENV
if (!(Test-Path ".venv")) {
  Write-Host "Creando entorno virtual..." -ForegroundColor Yellow
  python -m venv .venv
}

# Install Deps if missing
if (!(Test-Path ".venv/Lib/site-packages/fastapi")) {
  Write-Host "Instalando dependencias (esto puede tardar la primera vez)..." -ForegroundColor Yellow
  & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  & .\.venv\Scripts\python.exe -m pip install uvicorn
}

# Run
Write-Host "Iniciando servidor neuronal..." -ForegroundColor Green
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

