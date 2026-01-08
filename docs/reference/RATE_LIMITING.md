# Rate Limiting Implementation Guide

## Overview

El servidor NEXUS V1 implementa un sistema robusto de rate limiting con soporte para Redis como backend de almacenamiento y múltiples niveles de limitación según el tipo de endpoint y rol de usuario.

## Características

✅ **Redis Store**: Almacenamiento distribuido de límites (fallback a memoria si Redis no está disponible)
✅ **Rate Limiters Específicos**: Diferentes límites para auth, AI, uploads, etc.
✅ **Limitación Dinámica por Rol**: Diferentes cuotas para guest, authenticated, premium y admin
✅ **Headers Estándar**: Retorna información de límites en headers `RateLimit-*`
✅ **Identificación Inteligente**: Por user ID si está autenticado, por IP si no

## Rate Limiters Disponibles

### 1. General Limiter (Default)
**Ruta**: Todas las rutas `/api/*`
**Límite**: 100 requests / 15 minutos
**Variables de entorno**:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX=100
```

### 2. Auth Limiter
**Rutas**: `/api/v1/auth/login`, `/api/v1/auth/register`
**Límite**: 10 requests / 1 hora
**Variables de entorno**:
```env
AUTH_RATE_LIMIT_WINDOW_MS=3600000  # 1 hora
AUTH_RATE_LIMIT_MAX=10
```
**Propósito**: Prevenir ataques de fuerza bruta en endpoints de autenticación.

### 3. AI Limiter
**Rutas**: `/api/v1/ai/*`
**Límite**: 30 requests / 10 minutos
**Variables de entorno**:
```env
AI_RATE_LIMIT_WINDOW_MS=600000  # 10 minutos
AI_RATE_LIMIT_MAX=30
```
**Propósito**: Controlar uso de APIs costosas (Gemini, OpenAI, etc.).

### 4. Strict Limiter
**Uso**: Endpoints administrativos sensibles
**Límite**: 5 requests / 15 minutos
**Ejemplo**:
```typescript
router.delete('/admin/users/:id', strictLimiter, protect, deleteUser);
```

### 5. Upload Limiter
**Uso**: Endpoints de subida de archivos
**Límite**: 20 uploads / 1 hora
**Ejemplo**:
```typescript
router.post('/upload/avatar', uploadLimiter, protect, uploadAvatar);
```

### 6. WebSocket Limiter
**Uso**: Conexiones WebSocket
**Límite**: 10 conexiones / 1 minuto

### 7. Dynamic Role Limiter
**Límites por rol**:
- **Guest**: 30 requests / 15 minutos
- **Authenticated**: 100 requests / 15 minutos
- **Premium**: 300 requests / 15 minutos
- **Admin**: Sin límite

**Uso**:
```typescript
router.get('/premium/feature', dynamicRoleLimiter, protect, getPremiumFeature);
```

## Configuración de Redis

El rate limiter utiliza Redis como store para compartir límites entre múltiples instancias del servidor.

### Variables de entorno requeridas:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password  # Opcional
```

### Fallback automático
Si Redis no está disponible, el sistema automáticamente cambia a almacenamiento en memoria (no distribuido).

## Uso en Rutas

### Ejemplo básico
```typescript
import { authLimiter, aiLimiter } from '../middleware/rateLimiter';

// Aplicar a una ruta específica
router.post('/login', authLimiter, login);
router.post('/ai/generate', aiLimiter, generateContent);
```

### Ejemplo con múltiples middlewares
```typescript
router.post(
  '/admin/sensitive-action',
  strictLimiter,     // Rate limiting estricto
  protect,           // Autenticación
  authorize('admin'), // Autorización
  sensitiveAction    // Handler
);
```

### Ejemplo con limitación dinámica por rol
```typescript
router.get(
  '/api/data',
  dynamicRoleLimiter,  // Límites según rol del usuario
  protect,
  getData
);
```

## Headers de Respuesta

Cuando se aplica rate limiting, el servidor retorna los siguientes headers:

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1735678901
```

- **RateLimit-Limit**: Número máximo de requests permitidos
- **RateLimit-Remaining**: Requests restantes en la ventana actual
- **RateLimit-Reset**: Timestamp UNIX cuando se resetea el límite

## Respuesta cuando se excede el límite

**Status Code**: `429 Too Many Requests`

**Body**:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later."
}
```

## Key Generation Strategy

El sistema identifica usuarios de la siguiente manera:

1. **Usuario autenticado**: Usa `user.id` del token JWT
2. **Usuario no autenticado**: Usa dirección IP
3. **Fallback**: Usa `'unknown'` si no hay ni user ID ni IP

Esto permite:
- Rastrear usuarios autenticados incluso si cambian de IP
- Limitar usuarios no autenticados por IP
- Evitar bypass del rate limiting cambiando de cuenta

## Monitoreo

### Ver límites en Redis
```bash
# Conectar a Redis
docker-compose exec redis redis-cli

# Ver todas las keys de rate limiting
KEYS rl:*

# Ver valor de una key específica
GET rl:127.0.0.1

# Ver TTL de una key
TTL rl:127.0.0.1
```

### Logs
El sistema registra:
- Cuando se inicializa con Redis store
- Cuando falla Redis y usa memoria
- Información de conexión en `logger`

## Testing

### Test manual con curl
```bash
# Hacer múltiples requests para alcanzar el límite
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -v
done
```

### Test unitario ejemplo
```typescript
describe('Rate Limiter', () => {
  it('should block after max requests', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/v1/auth/login');
    }

    const response = await request(app).post('/api/v1/auth/login');
    expect(response.status).toBe(429);
  });
});
```

## Mejores Prácticas

1. **Redis en producción**: Siempre usa Redis en producción para compartir límites entre instancias
2. **Ajusta los límites**: Monitorea y ajusta según tu caso de uso real
3. **Endpoints sensibles**: Usa `strictLimiter` o `authLimiter` en endpoints críticos
4. **APIs costosas**: Aplica límites más estrictos a endpoints que consumen recursos (AI, uploads)
5. **Comunicación clara**: Los mensajes de error deben indicar cuándo puede reintentar el usuario

## Troubleshooting

### Redis no conecta
**Síntoma**: Logs indican "rate limiter using memory store"
**Solución**: Verificar que Redis esté corriendo y accesible
```bash
docker-compose ps redis
docker-compose logs redis
```

### Límites muy estrictos
**Síntoma**: Usuarios legítimos reciben 429
**Solución**: Ajustar `RATE_LIMIT_MAX` y `RATE_LIMIT_WINDOW_MS` en `.env`

### Bypass de límites
**Síntoma**: Usuarios superan los límites
**Solución**: Verificar que Redis está funcionando correctamente y que las keys no expiran prematuramente

## Extensión

### Agregar un nuevo limiter personalizado
```typescript
// En middleware/rateLimiter.ts
export const customLimiter = createRateLimiter(
  5 * 60 * 1000,  // 5 minutos
  20,             // 20 requests
  'Custom limit exceeded'
);

// En routes
router.post('/custom-endpoint', customLimiter, handler);
```

### Limiter por endpoint específico
```typescript
const createEndpointLimiter = (endpoint: string) => {
  return createRateLimiter(
    config.rateLimit.windowMs,
    config.rateLimit.max,
    `Too many requests to ${endpoint}`
  );
};
```

## Referencias

- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit)
- [rate-limit-redis](https://github.com/wyattjoh/rate-limit-redis)
- [Redis Documentation](https://redis.io/docs/)

