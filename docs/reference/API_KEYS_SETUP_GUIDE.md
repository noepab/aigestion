# Guía de Configuración - API Keys para NEXUS V1

Esta guía te ayudará a obtener y configurar todas las API keys necesarias para el framework de evaluación de NEXUS V1.

## 📋 API Keys Requeridas

| Servicio | Propósito | Ubicación en NEXUS V1 | Requerido |
|----------|-----------|------------------|-----------|
| **Azure OpenAI** | Evaluadores LLM-as-Judge | `evaluation/NEXUS V1/.env` | ✅ Sí |
| **Google Gemini** | API de generación de contenido | `server/.env` | ✅ Sí |
| **MongoDB** | Base de datos | `server/.env` | ✅ Sí |

---

## 1️⃣ Azure OpenAI (Para Evaluación)

### ¿Para qué se usa?
Los evaluadores de calidad (CoherenceEvaluator, FluencyEvaluator, RelevanceEvaluator) usan Azure OpenAI como "juez LLM" para evaluar las respuestas generadas por Gemini.

### Cómo obtener las credenciales

#### Paso 1: Acceder al Azure Portal
1. Ve a [portal.azure.com](https://portal.azure.com)
2. Inicia sesión con tu cuenta Microsoft/Azure

#### Paso 2: Crear recurso Azure OpenAI (si no existe)
1. En el portal, haz clic en **"Crear un recurso"**
2. Busca **"Azure OpenAI"**
3. Haz clic en **"Crear"**
4. Completa el formulario:
   - **Suscripción:** Selecciona tu suscripción
   - **Grupo de recursos:** Crea uno nuevo o usa existente (ej: `NEXUS V1-resources`)
   - **Región:** Selecciona región cercana (ej: `East US`, `West Europe`)
   - **Nombre:** Dale un nombre único (ej: `NEXUS V1-openai-eval`)
   - **Pricing tier:** Standard S0
5. Haz clic en **"Revisar y crear"** → **"Crear"**
6. Espera 2-3 minutos a que se complete el despliegue

#### Paso 3: Obtener Endpoint y API Key
1. Una vez creado, ve a tu recurso Azure OpenAI
2. En el menú lateral, selecciona **"Keys and Endpoint"**
3. Copia los siguientes valores:
   - **Endpoint:** `https://your-resource-name.openai.azure.com/`
   - **KEY 1:** Tu API key (algo como `abc123def456...`)

#### Paso 4: Desplegar modelo GPT-4
1. En el menú lateral, ve a **"Model deployments"** (o haz clic en "Go to Azure OpenAI Studio")
2. En Azure OpenAI Studio, haz clic en **"Deployments"**
3. Haz clic en **"Create new deployment"**
4. Configura:
   - **Model:** `gpt-4` (recomendado) o `gpt-35-turbo` (más económico)
   - **Deployment name:** `gpt-4` (anota este nombre, lo necesitarás)
   - **Version:** Selecciona la última versión disponible
5. Haz clic en **"Create"**

#### Paso 5: Configurar en NEXUS V1
Edita `evaluation/NEXUS V1/.env`:

```bash
# Endpoint (del paso 3)
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/

# API Key (del paso 3)
AZURE_OPENAI_KEY=abc123def456...

# Deployment name (del paso 4)
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 💰 Costos Estimados

| Modelo | Precio por 1K tokens | Evaluación completa (8 queries) |
|--------|---------------------|--------------------------------|
| GPT-4 | ~$0.03 input / $0.06 output | ~$0.10 - $0.20 |
| GPT-3.5-turbo | ~$0.0005 input / $0.0015 output | ~$0.01 - $0.02 |

**Recomendación:** Usar GPT-4 para evaluaciones de producción, GPT-3.5-turbo para desarrollo.

---

## 2️⃣ Google Gemini API (Para Generación)

### ¿Para qué se usa?
El backend de NEXUS V1 usa Gemini para generar respuestas de texto e imágenes en el endpoint `/api/ai/generate`.

### Cómo obtener la API Key

#### Paso 1: Acceder a Google AI Studio
1. Ve a [aistudio.google.com](https://aistudio.google.com)
2. Inicia sesión con tu cuenta Google
3. Acepta los términos de servicio si es la primera vez

#### Paso 2: Crear API Key
1. En el menú lateral, haz clic en **"Get API key"**
2. Haz clic en **"Create API key"**
3. Selecciona un proyecto de Google Cloud (o crea uno nuevo)
4. Copia la API key generada (formato: `AIza...`)

#### Paso 3: Configurar en NEXUS V1
Edita `server/.env`:

```bash
# API Key de Gemini
GEMINI_API_KEY=AIzaSyABC123...
```

### 📍 Ubicación alternativa en Google Cloud Console
Si prefieres usar Google Cloud Console:

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Selecciona tu proyecto o crea uno nuevo
3. Ve a **"APIs & Services"** → **"Credentials"**
4. Haz clic en **"Create Credentials"** → **"API key"**
5. Copia la key y agrégala a `server/.env`

### 💰 Costos Estimados

| Modelo | Precio | Límite gratuito |
|--------|--------|-----------------|
| Gemini Pro | $0.00025 / 1K chars | 60 requests/min |
| Gemini Pro Vision | $0.0025 / imagen | 60 requests/min |

**Nota:** Google ofrece un tier gratuito generoso para desarrollo.

---

## 3️⃣ MongoDB (Base de Datos)

### ¿Para qué se usa?
NEXUS V1 almacena datos de usuarios, productos, carritos, etc. en MongoDB.

### Opción A: MongoDB Atlas (Cloud - Recomendado)

#### Paso 1: Crear cuenta en MongoDB Atlas
1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Haz clic en **"Try Free"**
3. Regístrate con Google/GitHub o email

#### Paso 2: Crear cluster
1. Selecciona **"M0 Sandbox"** (gratis)
2. Elige región cercana
3. Nombre del cluster: `NEXUS V1-cluster`
4. Haz clic en **"Create Cluster"**

#### Paso 3: Configurar acceso
1. Crea un usuario de base de datos:
   - Username: `NEXUS V1-admin`
   - Password: Genera uno seguro (anótalo)
2. Whitelist IP:
   - Haz clic en **"Add IP Address"**
   - Selecciona **"Allow access from anywhere"** (0.0.0.0/0) para desarrollo
   - Para producción, agrega IPs específicas

#### Paso 4: Obtener Connection String
1. Haz clic en **"Connect"** en tu cluster
2. Selecciona **"Connect your application"**
3. Copia el connection string:
   ```
   mongodb+srv://<username>:<password>@NEXUS V1-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Reemplaza `<username>` y `<password>` con tus credenciales

#### Paso 5: Configurar en NEXUS V1
Edita `server/.env`:

```bash
MONGODB_URI=mongodb+srv://NEXUS V1-admin:your-password@NEXUS V1-cluster.xxxxx.mongodb.net/NEXUS V1?retryWrites=true&w=majority&authSource=admin
```

### Opción B: MongoDB Local (Docker)

Si prefieres usar Docker local (ya configurado en `docker-compose.yml`):

```bash
# server/.env
MONGODB_URI=mongodb://admin:password123@localhost:27017/NEXUS V1?authSource=admin
```

No necesitas configuración adicional, Docker Compose lo maneja automáticamente.

---

## ✅ Verificación de Configuración

### 1. Verificar variables de entorno

```bash
# Backend (server/.env debe tener):
cat server/.env
# GEMINI_API_KEY=AIza...
# MONGODB_URI=mongodb...
# JWT_SECRET=...
# (otras variables)

# Evaluación (evaluation/NEXUS V1/.env debe tener):
cat evaluation/NEXUS V1/.env
# AZURE_OPENAI_ENDPOINT=https://...
# AZURE_OPENAI_KEY=...
# AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 2. Test de conectividad

#### Test Azure OpenAI
```bash
cd evaluation/NEXUS V1

# Crear archivo test
cat > test_azure_openai.py << 'EOF'
import os
from dotenv import load_dotenv
from azure.ai.evaluation import CoherenceEvaluator

load_dotenv()

model_config = {
    "azure_endpoint": os.environ["AZURE_OPENAI_ENDPOINT"],
    "api_key": os.environ["AZURE_OPENAI_KEY"],
    "azure_deployment": os.environ["AZURE_OPENAI_DEPLOYMENT"]
}

evaluator = CoherenceEvaluator(model_config=model_config)
result = evaluator(
    query="What is the capital of France?",
    response="Paris is the capital of France."
)

print("✅ Azure OpenAI connection successful!")
print(f"Coherence score: {result['coherence']}")
EOF

python test_azure_openai.py
```

#### Test Gemini API
```bash
cd server

# Crear archivo test
cat > test_gemini.js << 'EOF'
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

async function test() {
  const result = await model.generateContent('Say hello');
  const text = result.response.text();
  console.log('✅ Gemini API connection successful!');
  console.log('Response:', text);
}

test().catch(console.error);
EOF

node test_gemini.js
```

#### Test MongoDB
```bash
cd server

# Crear archivo test
cat > test_mongo.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connection successful!');
  await mongoose.disconnect();
}

test().catch(console.error);
EOF

node test_mongo.js
```

---

## 🔐 Seguridad y Mejores Prácticas

### ✅ DO (Hacer)
- ✅ Usar variables de entorno para todas las keys
- ✅ Agregar `.env` a `.gitignore` (ya está configurado)
- ✅ Rotar keys regularmente (cada 3-6 meses)
- ✅ Usar diferentes keys para desarrollo y producción
- ✅ Limitar IPs en MongoDB Atlas para producción
- ✅ Habilitar alertas de uso en Azure/Google Cloud

### ❌ DON'T (No hacer)
- ❌ **NUNCA** commitear archivos `.env` a Git
- ❌ **NUNCA** compartir keys en Slack/Discord público
- ❌ **NUNCA** hardcodear keys en el código
- ❌ **NUNCA** usar las mismas keys en múltiples proyectos
- ❌ **NUNCA** dejar `0.0.0.0/0` en MongoDB producción

---

## 📊 Archivo de Configuración Completo

### `server/.env` (Backend)
```bash
# Google Gemini API
GEMINI_API_KEY=AIzaSyABC123...

# MongoDB
MONGODB_URI=mongodb+srv://NEXUS V1-admin:password@NEXUS V1-cluster.xxxxx.mongodb.net/NEXUS V1?retryWrites=true&w=majority&authSource=admin

# JWT Secret (genera uno random)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Server Config
PORT=3000
NODE_ENV=development

# OpenTelemetry (opcional)
OTEL_SERVICE_NAME=NEXUS V1-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### `evaluation/NEXUS V1/.env` (Evaluación)
```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=abc123def456...
AZURE_OPENAI_DEPLOYMENT=gpt-4

# NEXUS V1 API (opcional, default: http://localhost:3000)
NEXUS V1_API_URL=http://localhost:3000
```

---

## 🆘 Solución de Problemas

### Error: "Invalid API key"
**Causa:** Key incorrecta o mal formateada
**Solución:**
- Verifica que copiaste la key completa (sin espacios)
- Regenera la key en el portal correspondiente
- Verifica que no haya caracteres especiales mal escapados

### Error: "Model deployment not found"
**Causa:** El nombre del deployment no coincide
**Solución:**
- Ve a Azure OpenAI Studio → Deployments
- Verifica el nombre exacto del deployment
- Actualiza `AZURE_OPENAI_DEPLOYMENT` en `.env`

### Error: "Connection timeout" (MongoDB)
**Causa:** IP no whitelisted o connection string incorrecta
**Solución:**
- En MongoDB Atlas, verifica la whitelist de IPs
- Verifica que el connection string tenga `authSource=admin`
- Prueba con `0.0.0.0/0` para desarrollo

### Error: "Rate limit exceeded"
**Causa:** Demasiadas requests en poco tiempo
**Solución:**
- Espera unos minutos y reintenta
- Verifica los límites de tu tier (Free vs Paid)
- Para Azure: Considera upgrade a tier superior
- Para Gemini: Implementa rate limiting en código

---

## 📞 Soporte

- **Azure OpenAI:** [Documentación oficial](https://learn.microsoft.com/azure/ai-services/openai/)
- **Google Gemini:** [AI Studio](https://ai.google.dev/)
- **MongoDB Atlas:** [Docs](https://www.mongodb.com/docs/atlas/)

---

**✅ Configuración completa!** Una vez que hayas configurado todos los archivos `.env`, puedes proceder a ejecutar NEXUS V1 y las evaluaciones.

