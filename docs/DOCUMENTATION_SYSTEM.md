# 📚 Sistema de Documentación NEXUS V1

## ✅ Completado

Se ha implementado un sistema completo de organización y gestión de documentación para el proyecto NEXUS V1.

### 🎯 Componentes Implementados

#### 1. **Estructura Organizada** (`docs/`)
```
docs/
├── server/          # Documentación del backend
├── api/             # Referencias de API
├── architecture/    # Diseño y arquitectura
├── deployment/      # Deploy e infraestructura
├── guides/          # Guías y tutoriales
├── ai-learning/     # AI/ML y evaluaciones
├── reports/         # Reportes y status
├── audit/           # Auditorías
├── scripts/         # Scripts y automatización
├── overview/        # Visión general
└── reference/       # Referencias técnicas
```

#### 2. **Scripts de Automatización**

**`scripts/organize-docs.ps1`**
- Organiza automáticamente archivos .md según reglas predefinidas
- Mueve documentos dispersos a `docs/` en carpetas apropiadas
- Soporta modo dry-run para preview
- Excluye directorios irrelevantes (node_modules, .venv, etc.)

**Uso:**
```powershell
.\scripts\organize-docs.ps1              # Organizar todo
.\scripts\organize-docs.ps1 -DryRun      # Ver qué se movería
.\scripts\organize-docs.ps1 -Verbose     # Más detalles
```

**`scripts/generate-docs-index.ps1`**
- Genera INDEX.md automáticamente
- Escanea todas las categorías
- Extrae títulos y descripciones
- Crea enlaces organizados

**Uso:**
```powershell
.\scripts\generate-docs-index.ps1
```

#### 3. **GitHub Action** (`.github/workflows/docs-validation.yml`)

**En Pull Requests:**
- ✅ Detecta archivos .md mal ubicados
- ⚠️ Genera warnings si hay documentos fuera de `docs/`
- 🔗 Valida links rotos (opcional)
- 📋 Verifica existencia de INDEX.md

**En Push a Main:**
- 🔄 Organiza automáticamente documentos
- 📝 Regenera INDEX.md
- 💾 Commitea cambios automáticamente
- ⏭️ Usa `[skip ci]` para evitar loops

### 📋 Reglas de Organización

| Patrón                  | Destino         | Ejemplo                           |
| ----------------------- | --------------- | --------------------------------- |
| `EXECUTIVE_SUMMARY*.md` | `server/`       | Resúmenes ejecutivos del servidor |
| `TRACING*.md`           | `server/`       | Trazabilidad y observabilidad     |
| `DEPLOYMENT*.md`        | `deployment/`   | Guías de despliegue               |
| `DOCKER*.md`            | `deployment/`   | Configuración Docker              |
| `K8S*.md`               | `deployment/`   | Kubernetes                        |
| `API*.md`               | `api/`          | Referencias de API                |
| `*GUIDE*.md`            | `guides/`       | Guías generales                   |
| `ARCHITECTURE*.md`      | `architecture/` | Diseño del sistema                |
| `EVALUATION*.md`        | `ai-learning/`  | Evaluaciones de AI                |
| `*SUMMARY*.md`          | `reports/`      | Reportes                          |
| `AUDIT*.md`             | `audit/`        | Auditorías                        |

### 🔄 Workflow Recomendado

#### Para Desarrolladores:
1. Crear documentación en cualquier ubicación
2. El script organizará automáticamente al hacer push
3. INDEX.md se actualiza solo

#### Para Revisiones:
1. PR detecta documentos mal ubicados
2. GitHub Action genera warnings
3. Reviewer puede aprobar o pedir ajustes
4. Al mergear, se organiza automáticamente

### 🚀 Próximos Pasos Sugeridos

- [ ] Agregar validación de formato markdown
- [ ] Implementar linter para convenciones
- [ ] Crear template para nuevos documentos
- [ ] Agregar búsqueda semántica con embeddings
- [ ] Dashboard de cobertura de documentación
- [ ] Integración con ReadTheDocs o Docusaurus

### 📖 Documentos Clave

- `docs/INDEX.md` - Índice maestro (generado automáticamente)
- `docs/README.md` - Información general del proyecto
- `docs/QUICKSTART.md` - Inicio rápido para desarrolladores

---

**Nota:** Este sistema se auto-mantiene. Solo asegúrate de ejecutar los scripts cuando agregues muchos documentos manualmente, o déjalo al CI/CD.

