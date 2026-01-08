# 🔌 NEXUS V1 API Reference

> Documentación completa de la API REST del backend NEXUS V1

---

## 📋 Información General

| Propiedad | Valor |
|-----------|-------|
| **Base URL** | `http://localhost:5000/api/v1` |
| **Formato** | JSON |
| **Autenticación** | JWT Bearer Token |
| **Rate Limiting** | 100 req/15min (general) |
| **Documentación Swagger** | `http://localhost:5000/api-docs` |

---

## 🔐 Autenticación

### Headers Requeridos

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 📡 Endpoints

### 🏥 Health Check

#### GET /health
Verifica el estado de salud del servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-09T18:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

#### GET /ready
Verifica si el servidor está listo para recibir tráfico.

**Response:**
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected"
}
```

---

### 🔑 Auth (`/api/v1/auth`)

#### POST /auth/register
Registra un nuevo usuario.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/login
Autentica un usuario existente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/logout
Cierra la sesión del usuario.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/me
Obtiene el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 🤖 AI (`/api/v1/ai`)

#### POST /ai/chat
Envía un mensaje al agente de IA.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "message": "¿Cómo puedo configurar mi cuenta?",
  "context": {
    "conversationId": "conv_123",
    "userId": "user_456"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Para configurar tu cuenta, sigue estos pasos...",
    "conversationId": "conv_123",
    "confidence": 0.95,
    "sources": [
      {
        "title": "Guía de configuración",
        "url": "/docs/setup"
      }
    ]
  }
}
```

#### POST /ai/evaluate
Evalúa la respuesta del agente.

**Request Body:**
```json
{
  "conversationId": "conv_123",
  "rating": 5,
  "feedback": "Muy útil, gracias!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

---

## 🔒 Middleware

### Rate Limiting

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General (`/api/*`) | 100 requests | 15 minutos |
| Auth (`/api/v1/auth/*`) | 20 requests | 15 minutos |
| AI (`/api/v1/ai/*`) | 50 requests | 15 minutos |

### Security Headers

El servidor aplica los siguientes headers de seguridad mediante Helmet:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

---

## ❌ Errores

### Formato de Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": {}
  }
}
```

### Códigos de Error Comunes

| Código HTTP | Error Code | Descripción |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Datos de entrada inválidos |
| 401 | `UNAUTHORIZED` | Token inválido o expirado |
| 403 | `FORBIDDEN` | Sin permisos para esta acción |
| 404 | `NOT_FOUND` | Recurso no encontrado |
| 429 | `RATE_LIMIT_EXCEEDED` | Límite de rate excedido |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

---

## 🔌 WebSocket (Socket.IO)

### Conexión

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Eventos Client → Server

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `joinRoom` | `string` (roomId) | Unirse a una sala |
| `leaveRoom` | `string` (roomId) | Salir de una sala |

### Eventos Server → Client

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `notification` | `{ type, message, data }` | Notificación en tiempo real |
| `aiResponse` | `{ conversationId, response }` | Respuesta del agente AI |

---

## 📊 Métricas y Observabilidad

### Endpoints de Métricas

| Endpoint | Descripción |
|----------|-------------|
| `/metrics` | Métricas Prometheus |
| `/health` | Health check |
| `/ready` | Readiness check |

### OpenTelemetry

Las trazas se exportan a Jaeger:
- **Jaeger UI:** `http://localhost:16686`

---

## 🧪 Testing de API

### Con cURL

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Chat con AI (autenticado)
curl -X POST http://localhost:5000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Hola, necesito ayuda"}'
```

### Con Thunder Client (VSCode)
Usar la extensión Thunder Client para testing visual de la API.

---

## 📚 Swagger/OpenAPI

La documentación interactiva de Swagger está disponible en:

**URL:** `http://localhost:5000/api-docs`

Incluye:
- Todos los endpoints documentados
- Schemas de request/response
- Autenticación integrada
- Testing interactivo

---

*Documentación de API generada por Antigravity AI Assistant* ⚡

