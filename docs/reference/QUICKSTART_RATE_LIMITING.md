# Quick Start: Testing Rate Limiting

Esta guía te ayudará a verificar que el sistema de rate limiting está funcionando correctamente.

## Pre-requisitos

1. **Redis debe estar corriendo**:
```bash
# Opción 1: Docker Compose
docker-compose up -d redis

# Opción 2: Docker standalone
docker run -d -p 6379:6379 redis:alpine

# Opción 3: Redis local
redis-server
```

2. **Verificar que Redis está corriendo**:
```bash
# Desde PowerShell/CMD
docker ps | Select-String redis

# O conectarte directamente
docker exec -it <container-name> redis-cli ping
# Debería responder: PONG
```

## Paso 1: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env` en `server/`:

```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=3600000
AUTH_RATE_LIMIT_MAX=10
AI_RATE_LIMIT_WINDOW_MS=600000
AI_RATE_LIMIT_MAX=30

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Otras variables necesarias...
JWT_SECRET=your_secret_key
MONGODB_URI=mongodb://localhost:27017/NEXUS V1
```

## Paso 2: Instalar Dependencias

```bash
cd server
npm install
```

## Paso 3: Iniciar el Servidor

```bash
npm run dev
```

Deberías ver en los logs:
```
✓ Connected to Redis
✓ Rate limiter using Redis store
✓ Server running in development mode on port 5000
```

## Paso 4: Probar el Rate Limiting

### Opción 1: Script Automático

```bash
npm run test:rate-limit
```

Este script hará múltiples requests y mostrará:
- Límites configurados
- Requests restantes
- Cuándo se bloquean las requests

### Opción 2: Prueba Manual con curl

**Test General Rate Limit:**
```bash
# PowerShell
for ($i=1; $i -le 15; $i++) {
  $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/health" -Method GET
  Write-Host "Request $i - Status: $($response.StatusCode)"
  Write-Host "Remaining: $($response.Headers['RateLimit-Remaining'])"
}
```

**Test Auth Rate Limit:**
```bash
# Bash/Git Bash
for i in {1..12}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -i | grep -E "(HTTP|RateLimit)"
  sleep 0.5
done
```

**Test AI Rate Limit:**
```bash
# PowerShell
for ($i=1; $i -le 35; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/v1/ai/generate" `
      -Method POST `
      -ContentType "application/json" `
      -Body '{"prompt":"test"}' `
      -ErrorAction SilentlyContinue
    Write-Host "Request $i - Status: $($response.StatusCode) - Remaining: $($response.Headers['RateLimit-Remaining'])"
  } catch {
    Write-Host "Request $i - RATE LIMITED (429)" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 100
}
```

## Paso 5: Verificar en Redis

Conéctate a Redis para ver las keys de rate limiting:

```bash
# Entrar a Redis CLI
docker exec -it <redis-container> redis-cli

# Ver todas las keys de rate limiting
KEYS rl:*

# Ver valor de una key específica
GET rl:127.0.0.1

# Ver tiempo de expiración (en segundos)
TTL rl:127.0.0.1

# Salir
exit
```

## Paso 6: Monitorear Logs

Los logs del servidor mostrarán:

```
[INFO] Rate limiter using Redis store
[INFO] New request from IP: 127.0.0.1
[WARN] Rate limit approaching for IP: 127.0.0.1 (5 remaining)
```

## Resultados Esperados

### ✅ Comportamiento Correcto

1. **Primeras requests**: Pasan normalmente (200 OK)
2. **Headers presentes**:
   ```
   RateLimit-Limit: 100
   RateLimit-Remaining: 95
   RateLimit-Reset: 1735678901
   ```
3. **Al alcanzar el límite**: Status 429 con mensaje claro
4. **Después de la ventana**: Límites se resetean

### ❌ Problemas Comunes

#### Redis no conecta
**Síntoma**: Logs dicen "rate limiter using memory store"

**Solución**:
```bash
# Verificar que Redis esté corriendo
docker ps | Select-String redis

# Reiniciar Redis
docker-compose restart redis

# Verificar logs de Redis
docker-compose logs redis
```

#### No se aplican límites
**Síntoma**: Puedes hacer 1000+ requests sin bloqueo

**Solución**:
1. Verifica que `.env` tenga las variables correctas
2. Reinicia el servidor después de cambiar `.env`
3. Verifica que el middleware está aplicado en las rutas

#### Límites muy estrictos
**Síntoma**: Te bloquean con muy pocas requests

**Solución**:
Ajusta los valores en `.env`:
```env
# Aumentar límites para desarrollo
RATE_LIMIT_MAX=1000
AUTH_RATE_LIMIT_MAX=100
```

## Testing Avanzado

### Test con Usuario Autenticado

```bash
# 1. Registrar un usuario
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# 2. Login para obtener token
TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.token')

# 3. Hacer requests con el token
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -i
```

### Test Dynamic Role Limiter

Necesitas crear usuarios con diferentes roles y verificar que:
- **Guest**: 30 req / 15 min
- **Authenticated**: 100 req / 15 min
- **Premium**: 300 req / 15 min
- **Admin**: Sin límite

### Limpiar Rate Limits (Desarrollo)

```bash
# Conectar a Redis
docker exec -it <redis-container> redis-cli

# Eliminar todas las keys de rate limiting
KEYS rl:* | xargs redis-cli DEL

# O flush toda la base de datos (¡CUIDADO!)
FLUSHDB
```

## Métricas de Éxito

✅ **Funcionando Correctamente**:
- [ ] Redis conectado ("Rate limiter using Redis store" en logs)
- [ ] Headers `RateLimit-*` presentes en respuestas
- [ ] Status 429 después de exceder límites
- [ ] Límites diferentes para auth, AI y general
- [ ] Admin bypasses rate limiting
- [ ] Keys en Redis con TTL correcto

## Próximos Pasos

Una vez que el rate limiting funciona:

1. **Ajustar límites** según necesidades reales
2. **Agregar monitoreo** (Prometheus/Grafana)
3. **Configurar alertas** para IPs bloqueadas frecuentemente
4. **Implementar whitelist** para IPs confiables
5. **Agregar tests automatizados** (Jest)

## Recursos

- 📖 [Documentación completa](./RATE_LIMITING.md)
- 📖 [Middleware README](./src/middleware/README.md)
- 🧪 [Script de prueba](./scripts/test-rate-limit.js)
- 🧪 [Tests unitarios](./src/middleware/__tests__/rateLimiter.test.ts)

## Soporte

Si encuentras problemas:
1. Revisa los logs del servidor
2. Revisa los logs de Redis
3. Verifica las variables de entorno
4. Consulta la sección Troubleshooting en `RATE_LIMITING.md`

