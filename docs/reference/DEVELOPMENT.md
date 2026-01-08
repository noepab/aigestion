# ⚡ NEXUS V1 - Guía de Desarrollo NIVEL DIOS ⚡

> Sistema de gestión automatizada con IA - Optimizado para máxima productividad

---

## 🚀 Quick Start

```powershell
# Clonar e instalar
git clone https://github.com/noepab/NEXUS V1.git
cd NEXUS V1
pnpm install

# Desarrollo
pnpm run dev          # Inicia todo (Turbo)
pnpm run dev:frontend # Solo frontend
pnpm run dev:backend  # Solo backend
```

---

## 📁 Estructura del Proyecto

```
NEXUS V1/
├── 📦 server/              # Backend Node.js/Express
│   ├── src/
│   │   ├── config/         # Configuración
│   │   ├── controllers/    # Controladores
│   │   ├── middleware/     # Middleware (auth, rate-limit, etc.)
│   │   ├── models/         # Modelos Mongoose
│   │   ├── routes/         # Rutas API
│   │   ├── features/       # Features modulares
│   │   └── utils/          # Utilidades
│   └── package.json
│
├── 🎨 frontend/            # Frontend React/Vite
│   ├── apps/
│   │   └── dashboard/      # App principal
│   └── shared/             # Componentes compartidos
│
├── 🐍 src/                 # Python AI Engine
│   ├── agent/              # Agente base
│   ├── help/               # Help bot y web
│   ├── training/           # Training data
│   └── validation/         # Validadores
│
├── 📚 docs/                # Documentación
├── 🐋 docker/              # Configuración Docker
├── ☸️  k8s/                 # Kubernetes manifests
├── 📊 monitoring/          # Grafana, Prometheus
└── 🔧 scripts/             # Scripts de utilidad
```

---

## ⌨️ Comandos Principales

### 🚀 Desarrollo

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev` | Desarrollo completo (Turbo) |
| `pnpm run dev:frontend` | Solo frontend |
| `pnpm run dev:backend` | Solo backend |
| `pnpm run storybook` | Storybook (componentes) |

### 🔨 Build

| Comando | Descripción |
|---------|-------------|
| `pnpm run build` | Build de todo |
| `pnpm run build-storybook` | Build de Storybook |

### 🧪 Testing

| Comando | Descripción |
|---------|-------------|
| `pnpm run test` | Ejecutar todos los tests |
| `pnpm run test:e2e` | Tests E2E con Cypress |
| `pnpm run cy:open` | Cypress interactivo |

### 🔍 Linting & Formatting

| Comando | Descripción |
|---------|-------------|
| `pnpm run lint` | Lint de todo el proyecto |
| `pnpm --filter server run format` | Formatear backend |

---

## 🎯 Tasks de VSCode (Ctrl+Shift+P → Tasks)

Las tasks están organizadas con emojis para fácil identificación:

- 🚀 **Dev:** Desarrollo
- 🔨 **Build:** Compilación
- 🧪 **Test:** Testing
- 🔍 **Lint:** Linting
- 🐋 **Docker:** Contenedores
- 📦 **Install:** Dependencias
- 📚 **Docs:** Documentación
- 🔧 **Clean/Reset:** Utilidades

---

## 🐞 Debugging (F5)

### Configuraciones disponibles:

1. **🚀 Backend: Debug** - Inicia el backend con debugging
2. **🔧 Backend: Attach** - Attach a proceso existente
3. **🎨 Frontend: Chrome Debug** - Debug en Chrome
4. **🐍 Python: Current File** - Debug archivo Python actual
5. **🧪 Jest: Current File** - Debug test actual
6. **🚀 Full Stack** - Backend + Frontend simultáneo

---

## 🐋 Docker

```powershell
# Desarrollo local
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f

# Parar todo
docker-compose down
```

---

## 📊 Monitoreo

```
📊 Grafana:     http://localhost:3001
📈 Prometheus:  http://localhost:9090
🔍 Jaeger:      http://localhost:16686
```

---

## 🐍 Python (AI Engine)

```powershell
# Activar entorno virtual
.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r src/requirements.txt

# Ejecutar bot de ayuda
python NEXUS V1_help_bot.py

# Ejecutar web de ayuda
python NEXUS V1_help_web.py

# Tests
pytest -v
```

---

## 📝 Commits (Conventional)

Usar commits convencionales:

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato (no afecta código)
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

```powershell
# Commit interactivo
pnpm run commit
```

---

## 🔧 Snippets Disponibles

### JavaScript/TypeScript
- `cl` → Console log
- `af` → Arrow function
- `rfc` → React functional component
- `rus` → React useState
- `rue` → React useEffect

### Python
- `pr` → Print con f-string
- `def` → Function con docstring
- `cls` → Class
- `try` → Try-except
- `fapi` → FastAPI router

---

## 🚀 CI/CD

### GitHub Actions Workflows:
- `ci.yml` - Tests y lint en cada PR
- `deploy.yml` - Deploy a producción
- `storybook.yml` - Deploy Storybook a Chromatic

---

## 📚 Recursos

- [Documentación Completa](./docs/README.md)
- [API Reference](./docs/api/README.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

---

## 💡 Tips de Productividad

1. **Usa las Tasks de VSCode** (`Ctrl+Shift+P` → "Tasks: Run Task")
2. **Multi-cursor** (`Ctrl+Alt+↓`) para editar múltiples líneas
3. **Quick Open** (`Ctrl+P`) para navegar archivos rápidamente
4. **Inline Chat** (`Ctrl+I`) para editar con AI
5. **Git Graph** (extensión) para visualizar branches
6. **Error Lens** muestra errores inline
7. **Todo Tree** para ver todos los TODOs del proyecto

---

*Configuración optimizada por Antigravity AI Assistant* ⚡

