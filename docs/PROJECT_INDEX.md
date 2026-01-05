# 📚 NEXUS V1 - Índice Maestro del Proyecto

> **Autogestión Pro** - Sistema de gestión automatizada con IA
>
> Última actualización: 2024-12-09

---

## 📋 Tabla de Contenidos

- [🏗️ Arquitectura](#️-arquitectura)
- [📁 Estructura de Directorios](#-estructura-de-directorios)
- [🖥️ Backend (Server)](#️-backend-server)
- [🎨 Frontend](#-frontend)
- [🐍 Python AI Engine](#-python-ai-engine)
- [🔧 Scripts](#-scripts)
- [🐋 Docker & DevOps](#-docker--devops)
- [📊 Monitoreo](#-monitoreo)
- [🔄 CI/CD Workflows](#-cicd-workflows)
- [📖 Documentación](#-documentación)
- [⚙️ Configuración](#️-configuración)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        🌐 USUARIOS                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     🎨 FRONTEND (React/Vite)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Dashboard  │  │  Landing    │  │  Componentes Shared     │  │
│  │  (React)    │  │  Page       │  │  (UI Library)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  🖥️ BACKEND (Node.js/Express)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Routes  │  │  Middle  │  │  Control │  │  Features      │  │
│  │  API     │  │  ware    │  │  lers    │  │  (Modulares)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐
│  🗄️ MongoDB  │    │  🔴 Redis    │    │  🐍 Python AI Engine    │
│  (Database) │    │  (Cache)    │    │  (Help Bot, Training)  │
└─────────────┘    └─────────────┘    └─────────────────────────┘
         │                  │                       │
         └──────────────────┼───────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    📊 MONITOREO & OBSERVABILIDAD                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Grafana  │  │Prometheus│  │  Jaeger  │  │  OpenTelemetry │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Directorios

```
NEXUS V1/
│
├── 📄 Archivos Raíz
│   ├── package.json          # Configuración monorepo
│   ├── pnpm-workspace.yaml   # Workspaces pnpm
│   ├── turbo.json            # Configuración Turborepo
│   ├── docker-compose.yml    # Docker desarrollo
│   ├── docker-compose.prod.yml # Docker producción
│   ├── Dockerfile            # Imagen Docker principal
│   ├── .env                  # Variables de entorno
│   └── vercel.json           # Configuración Vercel
│
├── 🖥️ server/                # Backend Node.js
├── 🎨 frontend/              # Frontend React/Vite
├── 🐍 src/                   # Python AI Engine
├── 📚 docs/                  # Documentación
├── 🔧 scripts/               # Scripts de utilidad
├── 🐋 docker/                # Configuración Docker
├── ☸️  k8s/                   # Kubernetes manifests
├── 📊 monitoring/            # Grafana, Prometheus
├── 🧪 tests/                 # Tests globales
├── 📦 packages/              # Paquetes compartidos
├── 🎭 .storybook/            # Configuración Storybook
├── 🔄 .github/               # GitHub Actions & templates
└── ⚙️  .vscode/               # Configuración VSCode
```

---

## 🖥️ Backend (Server)

**Ubicación:** `server/`

### Estructura

| Directorio | Descripción | Archivos |
|------------|-------------|----------|
| `src/config/` | Configuración (DB, Redis, env) | 5 archivos |
| `src/controllers/` | Controladores de API | 3 archivos |
| `src/middleware/` | Middleware (auth, rate-limit, security) | 5 archivos |
| `src/models/` | Modelos Mongoose | 2 archivos |
| `src/routes/` | Definición de rutas API | 3 archivos |
| `src/features/` | Features modulares | 5 carpetas |
| `src/utils/` | Utilidades y helpers | 9 archivos |
| `src/types/` | Tipos TypeScript | 4 archivos |
| `src/queue/` | Cola de mensajes (RabbitMQ) | 2 archivos |
| `src/cache/` | Caching (Redis) | 1 archivo |
| `src/__tests__/` | Tests unitarios | 2 archivos |

### Tecnologías

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis
- **Auth:** JWT, bcryptjs
- **Validation:** Joi, Zod
- **API Docs:** Swagger
- **Real-time:** Socket.io
- **Queue:** RabbitMQ (amqplib)
- **Observability:** OpenTelemetry
- **Security:** Helmet, HPP, XSS-Clean, Rate Limiting

### Scripts Disponibles

```bash
pnpm --filter NEXUS V1-dashboard-backend run dev    # Desarrollo
pnpm --filter NEXUS V1-dashboard-backend run build  # Build
pnpm --filter NEXUS V1-dashboard-backend run test   # Tests
pnpm --filter NEXUS V1-dashboard-backend run lint   # Linting
```

---

## 🎨 Frontend

**Ubicación:** `frontend/`

### Estructura

| Directorio | Descripción |
|------------|-------------|
| `apps/dashboard/` | Dashboard principal (React) |
| `apps/landingpage/` | Landing page |
| `apps/landing-github-pages/` | Landing para GitHub Pages |
| `shared/` | Componentes y utilidades compartidas |

### Tecnologías

- **Framework:** React 19
- **Build:** Vite 6
- **Styling:** CSS/Styled Components
- **Testing:** Vitest
- **Types:** TypeScript 5
- **State:** React Context/Hooks

### Scripts Disponibles

```bash
pnpm --filter landingpage run dev    # Desarrollo
pnpm --filter landingpage run build  # Build
pnpm run storybook                   # Storybook
```

---

## 🐍 Python AI Engine

**Ubicación:** `src/` (Python)

### Estructura

| Directorio | Descripción | Archivos |
|------------|-------------|----------|
| `agent/` | Agente base | 2 archivos |
| `help/` | Help bot y web | 3 archivos |
| `training/` | Training data | 3 archivos |
| `validation/` | Validadores | 3 archivos |
| `notifications/` | Sistema de notificaciones | 2 archivos |
| `monitoring/` | Monitoreo AI | - |

### Scripts Python Principales

| Archivo | Descripción |
|---------|-------------|
| `NEXUS V1_help_bot.py` | Bot de ayuda conversacional |
| `NEXUS V1_help_web.py` | Interfaz web de ayuda |
| `auto_evaluation.py` | Evaluación automática |
| `retrain_agent.py` | Re-entrenamiento del agente |
| `semantic_validation.py` | Validación semántica |

### Ejecución

```bash
# Activar entorno virtual
.venv\Scripts\Activate.ps1

# Ejecutar bot
python NEXUS V1_help_bot.py

# Ejecutar web
python NEXUS V1_help_web.py
```

---

## 🔧 Scripts

**Ubicación:** `scripts/`

### Scripts de Auditoría

| Script | Descripción |
|--------|-------------|
| `audit-control-center.ps1` | Centro de control de auditorías |
| `audit-metrics-analyzer.ps1` | Analizador de métricas |
| `audit-quickstart.ps1` | Inicio rápido de auditoría |
| `run-complete-audit.ps1` | Auditoría completa |
| `weekly-auto-audit.ps1` | Auditoría semanal automática |
| `weekly-audit-dashboard.ps1` | Dashboard de auditorías |

### Scripts de Deployment

| Script | Descripción |
|--------|-------------|
| `deploy-k8s.ps1` | Deploy a Kubernetes |
| `prepare-deployment.ps1` | Preparar deployment |
| `verify-k8s-deployment.ps1` | Verificar deployment K8s |
| `k8s-deploy.sh` | Deploy K8s (bash) |
| `k8s-health-check.ps1` | Health check K8s |

### Scripts de Docker

| Script | Descripción |
|--------|-------------|
| `docker-cleanup.ps1` | Limpieza de Docker |
| `docker-health-check.sh` | Health check Docker |
| `docker-setup.sh` | Setup de Docker |
| `docker-test.sh` | Tests de Docker |

### Scripts de Documentación

| Script | Descripción |
|--------|-------------|
| `organize-docs.ps1` | Organizar documentación |
| `generate-docs-index.ps1` | Generar índice de docs |
| `show-docs-tree.ps1` | Mostrar árbol de docs |

### Scripts de Configuración

| Script | Descripción |
|--------|-------------|
| `enable-kubernetes.ps1` | Habilitar Kubernetes |
| `install-otel.ps1` | Instalar OpenTelemetry |
| `launch-multi-agent-team.ps1` | Lanzar equipo multi-agente |

---

## 🐋 Docker & DevOps

### Archivos Docker

| Archivo | Descripción |
|---------|-------------|
| `Dockerfile` | Imagen principal |
| `Dockerfile.dev` | Imagen de desarrollo |
| `Dockerfile.simple` | Imagen simplificada |
| `docker-compose.yml` | Compose desarrollo |
| `docker-compose.prod.yml` | Compose producción |
| `.dockerignore` | Archivos ignorados |

### Servicios Docker Compose

- **Backend:** Node.js API
- **Frontend:** Nginx + React
- **MongoDB:** Base de datos
- **Redis:** Cache
- **RabbitMQ:** Message queue
- **Grafana:** Dashboards
- **Prometheus:** Métricas
- **Jaeger:** Tracing

---

## ☸️ Kubernetes

**Ubicación:** `k8s/`

### Manifests

| Archivo | Descripción |
|---------|-------------|
| `namespace.yaml` | Namespace NEXUS V1 |
| `deployment.yaml` | Deployments |
| `service.yaml` | Services |
| `ingress.yaml` | Ingress controller |
| `configmap.yaml` | ConfigMaps |
| `secrets.yaml` | Secrets |
| `hpa.yaml` | Horizontal Pod Autoscaler |
| `pdb.yaml` | Pod Disruption Budget |

---

## 📊 Monitoreo

**Ubicación:** `monitoring/`

### Componentes

| Componente | Puerto | Descripción |
|------------|--------|-------------|
| Grafana | 3001 | Dashboards visuales |
| Prometheus | 9090 | Métricas y alertas |
| Jaeger | 16686 | Distributed tracing |
| Alertmanager | 9093 | Gestión de alertas |

### Dashboards Grafana

- API Performance
- Database Metrics
- AI Agent Metrics
- Infrastructure Overview

---

## 🔄 CI/CD Workflows

**Ubicación:** `.github/workflows/`

### Workflows de CI

| Workflow | Descripción |
|----------|-------------|
| `ci.yml` | CI principal |
| `ci-frontend.yml` | CI frontend |
| `test-matrix.yml` | Matrix de tests |
| `e2e.yml` | Tests E2E |

### Workflows de Seguridad

| Workflow | Descripción |
|----------|-------------|
| `codeql.yml` | CodeQL analysis |
| `snyk.yml` | Snyk security |
| `npm-audit.yml` | NPM audit |
| `sonarcloud.yml` | SonarCloud |

### Workflows de AI

| Workflow | Descripción |
|----------|-------------|
| `ai-evaluation.yml` | Evaluación de AI |
| `ai-monitoring.yml` | Monitoreo de AI |
| `agent-evaluation.yml` | Evaluación de agentes |
| `scheduled_evaluation.yml` | Evaluación programada |

### Workflows de Deploy

| Workflow | Descripción |
|----------|-------------|
| `release.yml` | Semantic release |
| `docker-ci.yml` | Docker CI/CD |
| `vercel-preview.yml` | Preview en Vercel |

### Workflows de Documentación

| Workflow | Descripción |
|----------|-------------|
| `docs-validation.yml` | Validación de docs |
| `lint-md-yaml.yml` | Lint MD/YAML |

---

## 📖 Documentación

**Ubicación:** `docs/`

### Documentos Principales

| Documento | Descripción |
|-----------|-------------|
| `README.md` | Readme principal |
| `DEVELOPMENT.md` | Guía de desarrollo |
| `CONTRIBUTING.md` | Guía de contribución |
| `SECURITY.md` | Política de seguridad |
| `CHANGELOG.md` | Historial de cambios |
| `PYTHON_INDEX.md` | Índice de Python |

### Documentación Técnica

| Categoría | Documentos |
|-----------|------------|
| Arquitectura | `docs/ARCHITECTURE.md` |
| API | `docs/api/` |
| Deployment | `DEPLOYMENT_GUIDE.md`, `DOCKER.md` |
| Auditoría | `AUDIT_*.md` (múltiples) |
| Mejoras | `NEXUS V1_MEJORAS_2025.md` |

---

## ⚙️ Configuración

### VSCode (`.vscode/`)

| Archivo | Descripción |
|---------|-------------|
| `settings.json` | Configuración del workspace |
| `launch.json` | Configuraciones de debug |
| `tasks.json` | Tasks automatizadas |
| `extensions.json` | Extensiones recomendadas |

### Linting & Formatting

| Archivo | Descripción |
|---------|-------------|
| `.eslintrc.json` | Configuración ESLint (server, frontend) |
| `.prettierrc` | Configuración Prettier |
| `.editorconfig` | Configuración de editor |
| `commitlint.config.js` | Lint de commits |
| `.lintstagedrc` | Lint-staged |

### Git

| Archivo | Descripción |
|---------|-------------|
| `.gitignore` | Archivos ignorados |
| `.husky/` | Git hooks |

### Otros

| Archivo | Descripción |
|---------|-------------|
| `tsconfig.json` | Configuración TypeScript |
| `jest.config.ts` | Configuración Jest |
| `vitest.config.ts` | Configuración Vitest |
| `cypress.config.json` | Configuración Cypress |
| `lighthouserc.json` | Configuración Lighthouse |

---

## 🔗 Enlaces Rápidos

- **Desarrollo:** `pnpm run dev`
- **Build:** `pnpm run build`
- **Tests:** `pnpm run test`
- **Storybook:** `pnpm run storybook`
- **Docs:** `pnpm run docs:dev`

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Subdirectorios raíz | 49 |
| Archivos raíz | 72 |
| Workflows CI/CD | 24 |
| Scripts PowerShell/Bash | 26 |
| Documentos .md | 100+ |

---

*Índice generado por Antigravity AI Assistant - 2024-12-09* ⚡

