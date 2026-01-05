# 📚 NEXUS V1 Documentation System - Architecture

## Overview

El sistema de documentación automático del NEXUS V1 mantiene todos los archivos .md organizados, indexados y actualizados sin intervención manual.

## Componentes

### 1. **organize-docs.ps1** - Organizador Automático
**Propósito**: Ordena automáticamente archivos .md según reglas inteligentes

**Ubicación**: `scripts/organize-docs.ps1`

**Uso**:
```powershell
# Preview de cambios
npm run docs:organize:dry

# Ejecutar organización
npm run docs:organize
```

**Cómo funciona**:
- Escanea proyecto buscando archivos .md
- Excluye automáticamente: node_modules, .git, .venv, proyectos, packages, apps, node
- Aplica reglas de categorización por nombre de archivo:
  - **server/** - server, api, rest, endpoint, route, middleware, auth
  - **overview/** - overview, introduction, getting-started, setup, install
  - **guides/** - guide, tutorial, how-to, manual, handbook
  - **architecture/** - architecture, design, pattern, structure
  - **deployment/** - deploy, docker, kubernetes, k8s, infra
  - **api/** - api, endpoint, rest, openapi, swagger
  - **reference/** - reference, cheatsheet, quick
  - Y más...

**Output**: Mueve archivos a carpetas en `docs/` manteniendo registro de cambios

---

### 2. **generate-docs-index.ps1** - Indexador
**Propósito**: Genera INDEX.md automático con toda la documentación

**Ubicación**: `scripts/generate-docs-index.ps1`

**Uso**:
```powershell
npm run docs:index
```

**Cómo funciona**:
- Lee todas las carpetas en `docs/`
- Extrae archivos .md de cada categoría
- Genera INDEX.md con estructura jerárquica
- Mantiene timestamp de última actualización
- Incluye links navegables

**Salida**: `docs/INDEX.md` con:
```markdown
# NEXUS V1 Documentation Index

Updated: 2025-12-07 10:48:00

## overview
- [README](path/to/README.md)
- [QUICKSTART](path/to/QUICKSTART.md)
...
```

---

### 3. **show-docs-tree.ps1** - Visualizador
**Propósito**: Muestra estructura visual de la documentación

**Ubicación**: `scripts/show-docs-tree.ps1`

**Uso**:
```powershell
npm run docs:tree

# Con estadísticas
pwsh scripts/show-docs-tree.ps1 -ShowStats
```

**Cómo funciona**:
- Recorre recursivamente carpeta `docs/`
- Dibuja árbol ASCII con emojis
- Calcula tamaños y conteos
- Mide tiempo de ejecución

**Output**:
```
📚 NEXUS V1 Documentation Structure
================================================================================
📊 Total: 77 docs | 0.53 MB | 67ms
================================================================================

├── 📁 ai-learning/ (0 docs)
├── 📁 api/ (5 docs)
├── 📁 architecture/ (12 docs)
...
```

---

## Workflow Integrado

### NPM Scripts Disponibles

```json
{
  "docs:organize": "pwsh scripts/organize-docs.ps1",
  "docs:organize:dry": "pwsh scripts/organize-docs.ps1 -DryRun",
  "docs:index": "pwsh scripts/generate-docs-index.ps1",
  "docs:tree": "pwsh scripts/show-docs-tree.ps1",
  "docs:tree:stats": "pwsh scripts/show-docs-tree.ps1 -ShowStats",
  "docs:full": "npm run docs:organize && npm run docs:index && npm run docs:tree",
  "docs:validate": "npm run docs:tree:stats"
}
```

### Flujo de Trabajo Típico

```
1. Crear nuevo archivo .md en cualquier carpeta
2. Ejecutar: npm run docs:organize
   └─ Automáticamente mueve a carpeta correcta
3. Ejecutar: npm run docs:index
   └─ Actualiza INDEX.md con nuevo doc
4. Ejecutar: npm run docs:tree
   └─ Verifica estructura visual
```

---

## Estructura de Carpetas

```
docs/
├── ai-learning/          # IA y Machine Learning
├── api/                  # Referencias de API
├── architecture/         # Diseño y patrones
├── audit/               # Reportes de auditoría
├── deployment/          # Deploy, Docker, K8s
├── guides/              # Tutoriales y guías
├── overview/            # Documentación general
├── reports/             # Reportes y análisis
├── reference/           # Referencias rápidas
├── scripts/             # Documentación de scripts
├── server/              # Backend y servidor
├── INDEX.md             # Índice maestro (auto-generado)
└── [otros archivos].md  # Docs de nivel superior
```

---

## Características Avanzadas

### Smart Categorization
- Coincidencia fuzzy en nombres de archivo
- Fallback a carpeta por defecto si no hay match
- Soporte para archivos con múltiples palabras clave

### Automation
- Puede ejecutarse en CI/CD
- Pre-commit hooks para validación
- GitHub Actions para organización automática

### Safety
- Dry-run mode para preview
- Validación antes de mover
- No sobrescribe archivos existentes

---

## Requisitos

- PowerShell 7.0+
- Node.js 14+ (para npm)
- Permisos de lectura/escritura en proyecto

## Performance

- Escaneo completo: ~100-200ms
- Movimiento de archivos: ~10-50ms por archivo
- Generación de índice: ~50-100ms
- Visualización de árbol: ~100-200ms

---

## Troubleshooting

**P: Los archivos no se mueven correctamente**
- Verificar que ExcludePatterns no incluye la ruta origen
- Ejecutar con `-DryRun` primero para preview
- Revisar permisos del usuario

**P: INDEX.md no se actualiza**
- Ejecutar manualmente: `npm run docs:index`
- Verificar que docs/ contiene archivos .md

**P: El árbol no muestra bien los emojis**
- Actualizar terminal a versión reciente
- Verificar codificación UTF-8

---

**Sistema creado**: Diciembre 2025
**Nivel**: 🔥 Producción (Nivel Dios)
**Status**: Operacional

