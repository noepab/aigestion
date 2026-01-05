# 🏗️ NEXUS V1 - Arquitectura del Sistema

> Documentación técnica de la arquitectura de Autogestión Pro

---

## 📋 Resumen Ejecutivo

NEXUS V1 (Autogestión Pro) es un sistema de gestión automatizada con IA construido como un **monorepo** utilizando:

- **Turborepo** para la gestión del monorepo
- **pnpm** como package manager
- **Node.js/Express** para el backend
- **React/Vite** para el frontend
- **Python** para el motor de IA
- **MongoDB** como base de datos principal
- **Redis** para caching y sesiones
- **Docker/Kubernetes** para containerización y orquestación

---

## 🏛️ Diagrama de Alto Nivel

```
                              ┌─────────────────────────────────────┐
                              │           🌐 INTERNET               │
                              └──────────────────┬──────────────────┘
                                                 │
                              ┌──────────────────▼──────────────────┐
                              │      ☁️ CDN / Load Balancer          │
                              │         (Cloudflare/Vercel)         │
                              └──────────────────┬──────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
          ┌─────────▼─────────┐      ┌───────────▼───────────┐    ┌───────────▼───────────┐
          │   🎨 FRONTEND      │      │    🖥️ BACKEND          │    │    📊 MONITORING      │
          │   (React/Vite)    │      │   (Node.js/Express)   │    │   (Grafana/Prometheus)│
          │   Port: 5173      │      │   Port: 5000          │    │   Ports: 3001/9090    │
          └───────────────────┘      └───────────┬───────────┘    └───────────────────────┘
                                                 │
               ┌─────────────────────────────────┼─────────────────────────────────┐
               │                                 │                                 │
    ┌──────────▼──────────┐         ┌───────────▼───────────┐        ┌────────────▼────────────┐
    │    🗄️ MongoDB       │         │     🔴 Redis           │        │    🐍 Python AI Engine  │
    │    (Database)       │         │     (Cache/Sessions)  │        │    (ML/NLP Processing)  │
    │    Port: 27017      │         │     Port: 6379        │        │                         │
    └─────────────────────┘         └───────────────────────┘        └─────────────────────────┘
               │                                 │                                 │
               └─────────────────────────────────┴─────────────────────────────────┘
                                                 │
                              ┌──────────────────▼──────────────────┐
                              │       🐰 RabbitMQ                   │
                              │       (Message Queue)               │
                              │       Port: 5672                    │
                              └─────────────────────────────────────┘
```

---

## 📦 Componentes Principales

### 1. Frontend (React/Vite)

```
frontend/
├── apps/
│   ├── dashboard/          # Aplicación principal del dashboard
│   │   ├── src/
│   │   │   ├── components/ # Componentes React
│   │   │   ├── pages/      # Páginas/rutas
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── services/   # API services
│   │   │   └── utils/      # Utilidades
│   │   └── package.json
│   │
│   └── landingpage/        # Landing page pública
│
└── shared/                 # Componentes compartidos
    ├── ui/                 # UI components library
    └── utils/              # Utilidades compartidas
```

**Tecnologías:**
- React 19
- Vite 6
- TypeScript 5
- React Router
- Styled Components / CSS Modules
- Vitest (testing)

### 2. Backend (Node.js/Express)

```
server/
├── src/
│   ├── config/             # Configuración
│   │   ├── database.ts     # Conexión MongoDB
│   │   ├── redis.ts        # Conexión Redis
│   │   ├── tracing.ts      # OpenTelemetry
│   │   └── index.ts        # Config principal
│   │
│   ├── controllers/        # Controladores
│   │   ├── auth.controller.ts
│   │   ├── ai.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── middleware/         # Middleware
│   │   ├── auth.middleware.ts    # JWT verification
│   │   ├── rateLimiter.ts        # Rate limiting
│   │   ├── error.middleware.ts   # Error handling
│   │   └── notFound.middleware.ts
│   │
│   ├── models/             # Modelos Mongoose
│   │   ├── User.ts
│   │   └── Conversation.ts
│   │
│   ├── routes/             # Rutas API
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   └── ai.routes.ts
│   │
│   ├── features/           # Features modulares
│   │   └── remote-access/  # Control remoto
│   │
│   ├── queue/              # Message queues
│   │   └── youtube-transcription.queue.ts
│   │
│   ├── utils/              # Utilidades
│   │   ├── logger.ts       # Winston logger
│   │   ├── jwt.ts          # JWT utilities
│   │   └── youtube-watcher.service.ts
│   │
│   └── server.ts           # Entry point
│
└── package.json
```

**Tecnologías:**
- Node.js 18+
- Express.js
- TypeScript
- Mongoose (MongoDB ODM)
- Socket.IO (WebSocket)
- JWT (jsonwebtoken)
- Winston (logging)
- OpenTelemetry (tracing)

### 3. Python AI Engine

```
src/
├── agent/                  # Agente base
│   ├── core.py             # Lógica central del agente
│   └── prompts.py          # Templates de prompts
│
├── help/                   # Sistema de ayuda
│   ├── bot.py              # Bot conversacional
│   ├── web.py              # Interfaz web
│   └── knowledge_base.py   # Base de conocimiento
│
├── training/               # Entrenamiento
│   ├── data_loader.py      # Carga de datos
│   ├── trainer.py          # Entrenador
│   └── evaluator.py        # Evaluador
│
├── validation/             # Validación
│   ├── semantic.py         # Validación semántica
│   ├── format.py           # Validación de formato
│   └── quality.py          # Control de calidad
│
├── notifications/          # Notificaciones
│   ├── slack.py            # Integración Slack
│   └── email.py            # Notificaciones email
│
└── monitoring/             # Monitoreo
    └── metrics.py          # Métricas de AI
```

**Tecnologías:**
- Python 3.10+
- Google Generative AI (Gemini)
- FastAPI / Flask
- Pydantic
- Structlog (logging)

---

## 🔄 Flujo de Datos

### Request Flow

```
┌────────┐     ┌─────────┐     ┌────────────┐     ┌───────────┐     ┌─────────┐
│ Client │────▶│  Nginx  │────▶│   Rate     │────▶│   Auth    │────▶│ Route   │
│        │     │  /CDN   │     │  Limiter   │     │  Middleware│    │ Handler │
└────────┘     └─────────┘     └────────────┘     └───────────┘     └────┬────┘
                                                                          │
    ┌─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│ Controller │────▶│  Service   │────▶│   Model    │────▶│  Database  │
│            │     │  Layer     │     │  Layer     │     │  (MongoDB) │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
    │
    │ (Si es request de AI)
    ▼
┌────────────┐     ┌────────────┐
│  RabbitMQ  │────▶│  Python    │
│  Queue     │     │  AI Engine │
└────────────┘     └────────────┘
```

### Authentication Flow

```
┌────────┐                    ┌─────────┐                    ┌─────────┐
│ Client │───── Login ───────▶│ Backend │───── Verify ──────▶│ MongoDB │
│        │                    │         │                    │         │
│        │◀──── JWT Token ────│         │◀──── User Data ────│         │
└────────┘                    └─────────┘                    └─────────┘
    │
    │ (Subsequent requests)
    ▼
┌────────┐     ┌────────────────┐     ┌─────────────┐
│ Client │────▶│ JWT Middleware │────▶│  Protected  │
│ + JWT  │     │    Verify      │     │  Resources  │
└────────┘     └────────────────┘     └─────────────┘
```

---

## 🗄️ Base de Datos

### MongoDB Schema

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  role: String (enum: ['user', 'admin']),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}

// Conversations Collection
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  messages: [
    {
      role: String (enum: ['user', 'assistant']),
      content: String,
      timestamp: Date,
      metadata: Object
    }
  ],
  status: String,
  rating: Number,
  feedback: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Redis Keys

| Key Pattern | Tipo | TTL | Descripción |
|-------------|------|-----|-------------|
| `session:<userId>` | String | 24h | Sesión de usuario |
| `rate:<ip>` | String | 15min | Contador de rate limit |
| `cache:user:<id>` | Hash | 1h | Cache de usuario |
| `queue:ai` | List | - | Cola de mensajes AI |

---

## 🐋 Infraestructura Docker

### Servicios

```yaml
services:
  # Backend API
  backend:
    build: ./server
    ports: ["5000:5000"]
    depends_on: [mongodb, redis]

  # Frontend
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]

  # Database
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongodb_data:/data/db]

  # Cache
  redis:
    image: redis:alpine
    ports: ["6379:6379"]

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]

  # Monitoring
  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana
    ports: ["3001:3000"]

  jaeger:
    image: jaegertracing/all-in-one
    ports: ["16686:16686"]
```

---

## ☸️ Kubernetes

### Recursos

- **Namespace:** `NEXUS V1`
- **Deployments:** backend, frontend
- **Services:** ClusterIP para interno, LoadBalancer para externo
- **Ingress:** NGINX Ingress Controller
- **ConfigMaps:** Configuración de aplicación
- **Secrets:** Credenciales sensibles
- **HPA:** Horizontal Pod Autoscaler
- **PDB:** Pod Disruption Budget

### Scaling

```yaml
# HPA Configuration
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 📊 Observabilidad

### Logging

- **Backend:** Winston → stdout → Loki
- **Frontend:** console → browser devtools
- **Python:** structlog → stdout → Loki

### Métricas

- **Prometheus** recolecta métricas de:
  - Node.js (process metrics)
  - Express (HTTP metrics)
  - Custom business metrics
  - Container metrics (cAdvisor)

### Tracing

- **OpenTelemetry** con exportación a Jaeger
- Traces distribuidos entre servicios
- Correlation IDs para debugging

---

## 🔐 Seguridad

### Capas de Seguridad

1. **Network:** Firewall, VPN, Private subnets
2. **Load Balancer:** DDoS protection, SSL termination
3. **Application:**
   - Helmet (security headers)
   - CORS configuration
   - Rate limiting
   - Input validation (Joi/Zod)
   - XSS protection
   - SQL/NoSQL injection prevention
4. **Authentication:** JWT, bcrypt
5. **Data:** Encryption at rest, TLS in transit

---

## 🚀 CI/CD Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Push   │────▶│  Lint   │────▶│  Test   │────▶│  Build  │────▶│ Deploy  │
│  Code   │     │  Check  │     │  Suite  │     │  Images │     │  (K8s)  │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
                    │               │               │               │
                    ▼               ▼               ▼               ▼
               ESLint/TS       Jest/Vitest      Docker         ArgoCD/
               Prettier        Cypress          Registry       Helm
```

---

*Documentación de arquitectura generada por Antigravity AI Assistant* ⚡

