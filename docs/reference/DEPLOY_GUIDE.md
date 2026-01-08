# 🚀 Guía de Deploy - NEXUS V1 Dashboard (Nube Gratuita)

**Objetivo**: Deploy completo sin costo usando servicios gratuitos

---

## 📋 Servicios que Usaremos

| Servicio | Uso | Límite Gratuito |
|----------|-----|-----------------|
| **Vercel** | Frontend (Landing + Dashboard) | Ilimitado |
| **Railway** | Backend API | 500 horas/mes |
| **Supabase** | Base de datos PostgreSQL | 500MB |
| **Cloudflare** | DNS + CDN | Ilimitado |

**Costo Total**: **$0/mes** ✅

---

## 🎯 PASO 1: Preparar el Código

### 1.1 Crear archivos de configuración

**Vercel** - Frontend Dashboard:
```json
// frontend/apps/dashboard/vercel.json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://tu-backend.railway.app/api"
  }
}
```

**Vercel** - Frontend Landing:
```json
// frontend/apps/landing-host/vercel.json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

**Railway** - Backend:
```json
// server/railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Actualizar package.json del backend

```json
// server/package.json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "tsx watch src/server.ts",
    "postinstall": "npm run build"
  }
}
```

---

## 🚀 PASO 2: Deploy Frontend a Vercel

### 2.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Login en Vercel

```bash
vercel login
```

### 2.3 Deploy Landing Page

```bash
cd frontend/apps/landing-host

# Deploy
vercel

# Seguir prompts:
# - Set up and deploy? Y
# - Which scope? (tu cuenta)
# - Link to existing project? N
# - Project name? NEXUS V1-landing
# - Directory? ./
# - Override settings? N

# Deploy a producción
vercel --prod
```

**URL resultante**: `https://NEXUS V1-landing.vercel.app`

### 2.4 Deploy Dashboard

```bash
cd frontend/apps/dashboard

# Deploy
vercel

# Prompts:
# - Project name? NEXUS V1-dashboard
# - Directory? ./

# Deploy a producción
vercel --prod
```

**URL resultante**: `https://NEXUS V1-dashboard.vercel.app`

---

## 🔧 PASO 3: Deploy Backend a Railway

### 3.1 Crear cuenta en Railway

1. Ir a https://railway.app
2. Sign up con GitHub
3. Verificar email

### 3.2 Instalar Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# O descargar desde: https://railway.app/cli
```

### 3.3 Login en Railway

```bash
railway login
```

### 3.4 Inicializar proyecto

```bash
cd server

# Inicializar
railway init

# Prompts:
# - Project name? NEXUS V1-backend
# - Environment? production
```

### 3.5 Agregar variables de entorno

```bash
# Configurar variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set DATABASE_URL=postgresql://...
```

### 3.6 Deploy

```bash
# Deploy
railway up

# Ver logs
railway logs

# Abrir en navegador
railway open
```

**URL resultante**: `https://NEXUS V1-backend.up.railway.app`

---

## 🗄️ PASO 4: Configurar Base de Datos (Supabase)

### 4.1 Crear proyecto en Supabase

1. Ir a https://supabase.com
2. Sign up con GitHub
3. New Project
   - Name: NEXUS V1-database
   - Database Password: (guardar seguro)
   - Region: Europe West (Frankfurt)

### 4.2 Obtener connection string

```
Settings → Database → Connection string → URI

postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 4.3 Configurar en Railway

```bash
railway variables set DATABASE_URL="postgresql://postgres:..."
```

### 4.4 Crear tablas (opcional)

```sql
-- En Supabase SQL Editor

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  cpu DECIMAL(5,2),
  memory DECIMAL(5,2),
  network DECIMAL(10,2)
);
```

---

## 🌐 PASO 5: Configurar Dominio (Cloudflare)

### 5.1 Registrar dominio (opcional)

- Namecheap: ~$10/año
- Porkbun: ~$8/año
- O usar subdominio gratuito de Vercel

### 5.2 Agregar a Cloudflare

1. Ir a https://cloudflare.com
2. Add Site
3. Seguir instrucciones para cambiar nameservers

### 5.3 Configurar DNS

```
Type  Name       Content
A     @          (IP de Vercel)
CNAME www        NEXUS V1-landing.vercel.app
CNAME dashboard  NEXUS V1-dashboard.vercel.app
CNAME api        NEXUS V1-backend.up.railway.app
```

### 5.4 Configurar SSL

- Cloudflare → SSL/TLS → Full (strict)
- Edge Certificates → Always Use HTTPS: ON

---

## 🔗 PASO 6: Conectar Frontend con Backend

### 6.1 Actualizar variables de entorno

**Dashboard**:
```bash
cd frontend/apps/dashboard

# Crear .env.production
echo "VITE_API_URL=https://NEXUS V1-backend.up.railway.app/api" > .env.production

# Re-deploy
vercel --prod
```

**Landing**:
```bash
cd frontend/apps/landing-host

# Crear .env.production
echo "VITE_API_URL=https://NEXUS V1-backend.up.railway.app/api" > .env.production

# Re-deploy
vercel --prod
```

### 6.2 Configurar CORS en backend

```typescript
// server/src/server.ts

import cors from 'cors';

app.use(cors({
  origin: [
    'https://NEXUS V1-landing.vercel.app',
    'https://NEXUS V1-dashboard.vercel.app',
    'http://localhost:5173',
    'http://localhost:4001'
  ],
  credentials: true
}));
```

---

## ✅ PASO 7: Verificar Deploy

### 7.1 Checklist

- [ ] Landing page carga: https://NEXUS V1-landing.vercel.app
- [ ] Dashboard carga: https://NEXUS V1-dashboard.vercel.app
- [ ] Backend responde: https://NEXUS V1-backend.up.railway.app/api/health
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] No hay errores en consola

### 7.2 Pruebas

```bash
# Test backend
curl https://NEXUS V1-backend.up.railway.app/api/health

# Test endpoints
curl https://NEXUS V1-backend.up.railway.app/api/system/metrics
curl https://NEXUS V1-backend.up.railway.app/api/docker/containers
```

---

## 📊 PASO 8: Monitoreo

### 8.1 Vercel Analytics (Gratis)

1. Vercel Dashboard → Analytics
2. Enable Analytics
3. Ver métricas de tráfico

### 8.2 Railway Metrics

```bash
# Ver métricas
railway metrics

# Ver logs en tiempo real
railway logs --follow
```

### 8.3 UptimeRobot (Gratis)

1. Ir a https://uptimerobot.com
2. Add New Monitor
   - Type: HTTP(s)
   - URL: https://NEXUS V1-backend.up.railway.app/api/health
   - Interval: 5 minutes
3. Recibir alertas por email

---

## 💰 Costos Estimados

### Tier Gratuito (0-10 clientes)

| Servicio | Costo | Límite |
|----------|-------|--------|
| Vercel | $0 | Ilimitado |
| Railway | $0 | 500h/mes |
| Supabase | $0 | 500MB DB |
| Cloudflare | $0 | Ilimitado |
| **TOTAL** | **$0/mes** | ✅ |

### Cuando Crecer (10+ clientes)

| Servicio | Costo | Capacidad |
|----------|-------|-----------|
| Railway Pro | $5/mes | 500h + $0.01/h extra |
| Supabase Pro | $25/mes | 8GB DB |
| Vercel Pro | $20/mes | Más builds |
| **TOTAL** | **~$50/mes** | 50+ clientes |

---

## 🔧 Troubleshooting

### Error: Build failed

```bash
# Verificar logs
vercel logs

# Limpiar cache
vercel --force

# Verificar node version
node --version  # Debe ser 18+
```

### Error: Railway deploy failed

```bash
# Ver logs
railway logs

# Verificar variables
railway variables

# Re-deploy
railway up --detach
```

### Error: Database connection

```bash
# Verificar connection string
railway variables get DATABASE_URL

# Test conexión
psql "postgresql://..."
```

### Error: CORS

```typescript
// Agregar dominio a CORS
app.use(cors({
  origin: ['https://tu-dominio.vercel.app']
}));
```

---

## 📝 Comandos Útiles

### Vercel

```bash
# Ver proyectos
vercel list

# Ver deployments
vercel ls

# Rollback
vercel rollback

# Ver logs
vercel logs [deployment-url]

# Eliminar proyecto
vercel remove [project-name]
```

### Railway

```bash
# Ver proyectos
railway list

# Ver variables
railway variables

# Ver logs
railway logs --follow

# Abrir dashboard
railway open

# Eliminar proyecto
railway delete
```

---

## 🎯 Próximos Pasos

Después del deploy:

1. ✅ Configurar dominio personalizado
2. ✅ Agregar Google Analytics
3. ✅ Configurar Sentry para errores
4. ✅ Crear video demo
5. ✅ Iniciar marketing
6. ✅ Conseguir primeros clientes

---

## 📚 Recursos

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Cloudflare Docs: https://developers.cloudflare.com

---

**¡Listo para deploy! 🚀**

*Tiempo estimado: 30-60 minutos*
*Costo: $0*
*Resultado: Sistema en producción*

