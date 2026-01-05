# 🔧 NEXUS V1 - Índice de Scripts

> Documentación de todos los scripts disponibles en el proyecto

---

## 📁 Ubicación: `scripts/`

---

## 🔍 Auditoría

Scripts para auditorías automatizadas y análisis de calidad.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `audit-control-center.ps1` | Centro de control de auditorías con UI interactiva | `.\scripts\audit-control-center.ps1` |
| `audit-metrics-analyzer.ps1` | Analizador de métricas de auditoría | `.\scripts\audit-metrics-analyzer.ps1` |
| `audit-quickstart.ps1` | Inicio rápido de auditoría | `.\scripts\audit-quickstart.ps1` |
| `run-complete-audit.ps1` | Ejecuta auditoría completa del proyecto | `.\scripts\run-complete-audit.ps1` |
| `weekly-auto-audit.ps1` | Auditoría semanal automatizada | `.\scripts\weekly-auto-audit.ps1` |
| `weekly-audit-dashboard.ps1` | Dashboard de auditorías semanales | `.\scripts\weekly-audit-dashboard.ps1` |
| `setup-weekly-audit-scheduler.ps1` | Configura scheduler para auditorías | `.\scripts\setup-weekly-audit-scheduler.ps1` |

---

## 🚀 Deployment

Scripts para deployment y preparación de releases.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `deploy-k8s.ps1` | Deploy a cluster Kubernetes | `.\scripts\deploy-k8s.ps1 -Environment prod` |
| `prepare-deployment.ps1` | Prepara archivos para deployment | `.\scripts\prepare-deployment.ps1` |
| `verify-k8s-deployment.ps1` | Verifica estado del deployment en K8s | `.\scripts\verify-k8s-deployment.ps1` |
| `k8s-deploy.sh` | Deploy K8s (versión bash) | `./scripts/k8s-deploy.sh` |
| `k8s-health-check.ps1` | Health check de pods en K8s | `.\scripts\k8s-health-check.ps1` |
| `k8s-health-check.sh` | Health check (versión bash) | `./scripts/k8s-health-check.sh` |

---

## 🐋 Docker

Scripts para gestión de contenedores Docker.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `docker-cleanup.ps1` | Limpieza de imágenes y contenedores no usados | `.\scripts\docker-cleanup.ps1` |
| `docker-health-check.sh` | Verifica salud de contenedores | `./scripts/docker-health-check.sh` |
| `docker-setup.sh` | Setup inicial de Docker | `./scripts/docker-setup.sh` |
| `docker-test.sh` | Ejecuta tests en contenedores Docker | `./scripts/docker-test.sh` |

---

## 📚 Documentación

Scripts para organizar y generar documentación.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `organize-docs.ps1` | Organiza archivos de documentación | `.\scripts\organize-docs.ps1` |
| `generate-docs-index.ps1` | Genera índice automático de docs | `.\scripts\generate-docs-index.ps1` |
| `show-docs-tree.ps1` | Muestra árbol de documentación | `.\scripts\show-docs-tree.ps1` |

---

## ⚙️ Configuración

Scripts para configuración del entorno de desarrollo.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `enable-kubernetes.ps1` | Habilita Kubernetes en Docker Desktop | `.\scripts\enable-kubernetes.ps1` |
| `install-otel.ps1` | Instala OpenTelemetry | `.\scripts\install-otel.ps1` |
| `launch-multi-agent-team.ps1` | Lanza equipo multi-agente | `.\scripts\launch-multi-agent-team.ps1` |

---

## 🧪 Testing

Scripts para testing.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `test_colab_integration.py` | Test de integración con Google Colab | `python scripts/test_colab_integration.py` |

---

## 📁 Ubicación: Raíz del Proyecto

Scripts en la raíz del proyecto.

| Script | Descripción | Uso |
|--------|-------------|-----|
| `setup-dev.ps1` | Setup del entorno de desarrollo | `.\setup-dev.ps1` |
| `audit_NEXUS V1.ps1` | Script de auditoría principal | `.\audit_NEXUS V1.ps1` |

---

## 🐍 Scripts Python (Raíz)

| Script | Descripción | Uso |
|--------|-------------|-----|
| `NEXUS V1_help_bot.py` | Bot de ayuda conversacional | `python NEXUS V1_help_bot.py` |
| `NEXUS V1_help_web.py` | Interfaz web de ayuda | `python NEXUS V1_help_web.py` |
| `auto_evaluation.py` | Evaluación automática de respuestas | `python auto_evaluation.py` |
| `retrain_agent.py` | Re-entrenamiento del agente | `python retrain_agent.py` |
| `semantic_validation.py` | Validación semántica | `python semantic_validation.py` |
| `validate_faq_format.py` | Valida formato de FAQs | `python validate_faq_format.py` |
| `validate_artifact_integrity.py` | Valida integridad de artefactos | `python validate_artifact_integrity.py` |
| `validate_script_permissions.py` | Valida permisos de scripts | `python validate_script_permissions.py` |
| `validate_slack_credentials.py` | Valida credenciales de Slack | `python validate_slack_credentials.py` |
| `notify_critical_suggestions_slack.py` | Notifica sugerencias críticas a Slack | `python notify_critical_suggestions_slack.py` |
| `notify_error_slack.py` | Notifica errores a Slack | `python notify_error_slack.py` |
| `notify_faq_suggestions.py` | Notifica sugerencias de FAQ | `python notify_faq_suggestions.py` |
| `notify_quality.py` | Notifica sobre calidad | `python notify_quality.py` |
| `generate_faq_changelog.py` | Genera changelog de FAQs | `python generate_faq_changelog.py` |
| `generate_faq_dashboard.py` | Genera dashboard de FAQs | `python generate_faq_dashboard.py` |
| `generate_weekly_faq_summary.py` | Genera resumen semanal de FAQs | `python generate_weekly_faq_summary.py` |
| `export_semantic_csv.py` | Exporta datos semánticos a CSV | `python export_semantic_csv.py` |
| `update_faq_workflow_cron.py` | Actualiza cron de workflow FAQ | `python update_faq_workflow_cron.py` |
| `analyze_help_queries.py` | Analiza consultas de ayuda | `python analyze_help_queries.py` |

---

## 📦 NPM Scripts (package.json)

### Raíz del Monorepo

```bash
# Desarrollo
pnpm run dev              # Desarrollo completo (Turbo)
pnpm run dev:frontend     # Solo frontend
pnpm run dev:backend      # Solo backend
pnpm run dev:all          # Backend + Frontend paralelo

# Build
pnpm run build            # Build de todo

# Testing
pnpm run test             # Ejecutar tests
pnpm run test:e2e         # Tests E2E

# Linting
pnpm run lint             # Lint de todo

# Documentación
pnpm run docs:organize    # Organizar docs
pnpm run docs:index       # Generar índice
pnpm run docs:tree        # Mostrar árbol
pnpm run docs:full        # Organizar + índice
pnpm run docs:validate    # Validar docs
pnpm run docs:dev         # Server de docs
pnpm run docs:build       # Build de docs

# Storybook
pnpm run storybook        # Iniciar Storybook
pnpm run build-storybook  # Build Storybook
pnpm run chromatic        # Deploy a Chromatic

# Cypress
pnpm run cy:open          # Abrir Cypress
pnpm run cy:run           # Ejecutar Cypress

# Release
pnpm run release          # Semantic release
pnpm run commit           # Commit convencional

# Auditoría
pnpm run audit:run        # Ejecutar auditoría
```

### Backend (server/)

```bash
pnpm --filter NEXUS V1-dashboard-backend run start     # Producción
pnpm --filter NEXUS V1-dashboard-backend run dev       # Desarrollo
pnpm --filter NEXUS V1-dashboard-backend run build     # Build
pnpm --filter NEXUS V1-dashboard-backend run test      # Tests
pnpm --filter NEXUS V1-dashboard-backend run lint      # Lint
pnpm --filter NEXUS V1-dashboard-backend run format    # Format
pnpm --filter NEXUS V1-dashboard-backend run setup     # Setup inicial
```

### Frontend

```bash
pnpm --filter landingpage run dev     # Desarrollo landing
pnpm --filter landingpage run build   # Build landing
pnpm --filter dashboard run dev       # Desarrollo dashboard
pnpm --filter dashboard run build     # Build dashboard
```

---

*Índice de scripts generado por Antigravity AI Assistant* ⚡

