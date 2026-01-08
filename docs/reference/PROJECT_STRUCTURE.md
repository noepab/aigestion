# 📁 Estructura del Proyecto NEXUS V1

## 🚀 NEXUS V1 - Autogestión Pro | Advanced Growth Platform

## ⚠️ Importante: Clarificación de Rutas

### Estructura de Directorios

```text
C:\Users\Alejandro\                    ← Tu directorio HOME (usuario)
├── NEXUS V1/                               ← 🎯 PROYECTO PRINCIPAL (repositorio)
│   ├── .docker/                       ← Configuraciones Docker
│   ├── .github/workflows/             ← GitHub Actions CI/CD
│   ├── .vscode/                       ← Configuración VSCode
│   ├── components/                    ← Componentes React
│   ├── contexts/                      ← React Contexts
│   ├── evaluation/                    ← Sistema de evaluación
│   ├── k8s/                           ← ⭐ Configuraciones Kubernetes
│   ├── monitoring/                    ← Logs y monitoreo
│   ├── scripts/                       ← 🔧 Scripts de operaciones
│   ├── server/                        ← Backend Node.js
│   ├── src/                           ← Frontend React
│   ├── docker-compose.yml             ← Docker Compose (dev)
│   ├── docker-compose.prod.yml        ← Docker Compose (prod)
│   ├── Dockerfile                     ← Dockerfile producción
│   ├── Dockerfile.dev                 ← Dockerfile desarrollo
│   ├── DOCKER.md                      ← Documentación Docker
│   ├── package.json                   ← Dependencias Node.js
│   └── README.md                      ← Documentación principal
│
├── alejandro_config/                  ← Configuraciones auxiliares
├── evaluation/                        ← Evaluaciones antiguas (puede estar duplicado)
├── gemini-cli/                        ← Otro proyecto (CLI de Gemini)
└── ... (otros directorios de usuario)
```

### 🎯 Directorio Principal del Proyecto

**Ruta correcta del proyecto:** `C:\Users\Alejandro\NEXUS V1`

**Nombre:** NEXUS V1 (Autogestión Pro / Advanced Growth Platform)

Este es el repositorio Git que contiene:

- ✅ Todo el código fuente
- ✅ Configuraciones Docker y Kubernetes
- ✅ Scripts de operaciones
- ✅ Workflows de CI/CD
- ✅ Documentación

### ✅ Claridad Total - Sin Confusión

**Estructura clara:**

1. **`C:\Users\Alejandro`** → Tu directorio HOME de Windows (usuario)
2. **`C:\Users\Alejandro\NEXUS V1`** → El repositorio del proyecto (Autogestión Pro)

Ya **NO** hay confusión con nombres duplicados:

```bash
# ✅ Rutas claras y profesionales:
cd C:/Users/Alejandro/NEXUS V1             # Ruta completa
cd ~/NEXUS V1                              # Ruta desde HOME

# NEXUS V1 = Nombre único y profesional
# No más "Alejandro/Alejandro" confuso
```

### 🔧 Variables de Entorno Recomendadas

Para facilitar el trabajo, define estas variables:

```powershell
# En PowerShell (agrega a tu $PROFILE)
$env:NEXUS V1_PROJECT = "C:\Users\Alejandro\NEXUS V1"
$env:NEXUS V1_HOME = "C:\Users\Alejandro"

# Función helper
function NEXUS V1 { Set-Location $env:NEXUS V1_PROJECT }

# Uso:
NEXUS V1  # Te lleva directamente al proyecto NEXUS V1
```

```bash
# En Bash (.bashrc o .bash_profile)
export NEXUS V1_PROJECT="$HOME/NEXUS V1"
export NEXUS V1_HOME="$HOME"

alias NEXUS V1='cd $NEXUS V1_PROJECT'

# Uso:
NEXUS V1  # Te lleva directamente al proyecto NEXUS V1
```

## 📂 Estructura Detallada del Proyecto

### Frontend (React + TypeScript)

```text
src/
├── components/          # Componentes React reutilizables
├── contexts/           # Context API de React
├── hooks/              # Custom React Hooks
├── pages/              # Páginas de la aplicación
├── services/           # Servicios API
├── styles/             # Estilos CSS/SCSS
├── types/              # Tipos TypeScript
└── utils/              # Utilidades

components/
├── admin/              # Componentes del panel admin
├── common/             # Componentes comunes
└── evaluation/         # Componentes de evaluación
```

### Backend (Node.js + Express)

```text
server/
├── controllers/        # Controladores de rutas
├── middleware/         # Middleware Express
├── models/             # Modelos MongoDB (Mongoose)
├── routes/             # Definición de rutas
├── services/           # Lógica de negocio
├── utils/              # Utilidades backend
└── index.ts            # Entry point del servidor
```

### Sistema de Evaluación (Python)

```text
evaluation/
├── agents/             # Agentes de evaluación
├── metrics/            # Métricas y scoring
├── results/            # Resultados de evaluaciones
├── tasks/              # Tareas de evaluación
├── evaluate.py         # Script principal
└── requirements.txt    # Dependencias Python
```

### Infraestructura

```text
.docker/
├── mongo-init/         # Scripts inicialización MongoDB
├── nginx/              # Configuraciones Nginx
├── rabbitmq/           # Configuraciones RabbitMQ
└── redis/              # Configuraciones Redis

k8s/
├── app-deployment.yaml          # Deployment de la app
├── evaluation-deployment.yaml   # Deployment servicio evaluación
├── mongodb-statefulset.yaml     # StatefulSet MongoDB
├── rabbitmq-statefulset.yaml    # StatefulSet RabbitMQ
├── redis-statefulset.yaml       # StatefulSet Redis
├── configmap.yaml               # ConfigMap
├── secrets.yaml                 # Secrets (template)
├── ingress.yaml                 # Ingress (tráfico externo)
├── hpa.yaml                     # Horizontal Pod Autoscaler
├── network-policy.yaml          # Network policies
├── resource-quota.yaml          # Resource quotas
└── README.md                    # Guía de Kubernetes

scripts/
├── docker-health-check.sh       # Health check Docker
├── docker-test.sh               # Tests pre-deployment
├── docker-setup.sh              # Setup automático Docker
├── k8s-deploy.sh                # Deployment Kubernetes
└── k8s-health-check.sh          # Health check Kubernetes
```

### CI/CD

```text
.github/
└── workflows/
    ├── docker-ci.yml              # CI/CD Docker (7 jobs)
    └── scheduled_evaluation.yml   # Evaluaciones programadas
```

### Configuración VSCode

```text
.vscode/
├── settings.json             # Configuración del editor
├── launch.json               # Configuraciones de debug
├── tasks.json                # Tasks automatizadas
├── extensions.json           # Extensiones recomendadas
├── alejandro.code-snippets   # Snippets JavaScript/TypeScript
└── python.code-snippets      # Snippets Python
```

## 🚀 Comandos Rápidos

### Navegación

```bash
# Desde cualquier lugar
cd ~/NEXUS V1                          # Ir al proyecto
cd ~/NEXUS V1/scripts                 # Ir a scripts
cd ~/NEXUS V1/k8s                     # Ir a configs K8s

# Listar archivos
ls -la ~/NEXUS V1                     # Ver todos los archivos
tree ~/NEXUS V1 -L 2                  # Ver estructura (2 niveles)
```

### Docker

```bash
# Desde el proyecto
cd ~/NEXUS V1

# Setup
./scripts/docker-setup.sh

# Health check
./scripts/docker-health-check.sh

# Tests
./scripts/docker-test.sh

# Compose
docker-compose up -d                    # Levantar servicios (dev)
docker-compose -f docker-compose.prod.yml up -d  # Producción
```

### Kubernetes

```bash
# Desde el proyecto
cd ~/NEXUS V1

# Deploy
./scripts/k8s-deploy.sh

# Health check
./scripts/k8s-health-check.sh

# Manual
kubectl apply -f k8s/              # Aplicar todas las configs
kubectl get all -n NEXUS V1             # Ver recursos
kubectl logs -f deployment/NEXUS V1-app -n NEXUS V1  # Ver logs
```

### Git

```bash
# Desde el proyecto
cd ~/NEXUS V1

git status
git add .
git commit -m "feat: add new feature"
git push origin main
```

## 📝 Convenciones de Nombres

### Branches

- `main` → Producción
- `develop` → Desarrollo
- `feature/nombre` → Nueva funcionalidad
- `fix/nombre` → Bug fix
- `hotfix/nombre` → Fix urgente producción
- `release/v1.2.3` → Release preparation

### Commits (Conventional Commits)

```text
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato, punto y coma faltante, etc.
refactor: refactorización de código
test: añadir tests
chore: actualizar dependencias, configuración
perf: mejoras de performance
ci: cambios en CI/CD
```

### Archivos y Directorios

- Lowercase con guiones: `docker-compose.yml`, `k8s-deploy.sh`
- Componentes React: PascalCase: `AdminPanel.tsx`
- Utilities: camelCase: `formatDate.ts`
- Configs: kebab-case: `nginx.prod.conf`

## 🔐 Seguridad

### Archivos que NO deben commitearse

```text
.env                    # Variables de entorno locales
.env.local              # Variables locales
.env.*.local            # Variables de entorno específicas
node_modules/           # Dependencias Node
__pycache__/            # Cache Python
*.pyc                   # Bytecode Python
.DS_Store               # MacOS
Thumbs.db               # Windows
*.log                   # Logs
logs/                   # Directorio de logs
secrets/                # Secrets reales
k8s/secrets-real.yaml   # Secrets reales K8s
```

### Verificar .gitignore

```bash
# Desde el proyecto
cd ~/Alejandro
cat .gitignore           # Ver archivos ignorados
git status --ignored     # Ver archivos ignorados por Git
```

## 📚 Documentación Adicional

- **Docker:** Ver `DOCKER.md`
- **Kubernetes:** Ver `k8s/README.md`
- **Contribución:** Ver `CONTRIBUTING.md`
- **API:** Ver documentación en `/docs/api` (cuando exista)
- **Frontend:** Ver `src/README.md` (cuando exista)
- **Backend:** Ver `server/README.md` (cuando exista)

## 🆘 Soporte

Si tienes dudas sobre la estructura del proyecto:

1. Lee este documento primero
2. Revisa la documentación específica (DOCKER.md, k8s/README.md)
3. Consulta los scripts en `scripts/` (tienen comentarios)
4. Revisa los workflows en `.github/workflows/`

## 🎯 Resumen

- **Proyecto:** `C:\Users\Alejandro\NEXUS V1` (Autogestión Pro)
- **Home:** `C:\Users\Alejandro`
- **Claridad total:** Ya no hay confusión de nombres
- **NEXUS V1:** Nombre profesional y único
- **Usar siempre rutas desde el proyecto** para comandos
- **Verificar** que estás en el directorio correcto antes de ejecutar comandos

---

**Última actualización:** Noviembre 17, 2025
**Mantenido por:** NEXUS V1 Team
**Estado:** 🟢 Documentación Completa

