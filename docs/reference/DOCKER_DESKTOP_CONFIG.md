# 🚀 Docker Desktop - Configuración Optimizada para NEXUS V1

## 📊 Resumen de Configuración Recomendada

| Configuración | Recomendado | Mínimo | Actual (Usuario) |
|--------------|-------------|--------|------------------|
| CPU | 6 cores | 4 cores | - |
| Memory | 10 GB | 8 GB | - |
| Swap | 2 GB | 1 GB | - |
| Disk Image Size | 100 GB | 60 GB | - |
| WSL 2 | ✅ Habilitado | ✅ Requerido | - |
| Kubernetes | ✅ Habilitado | ❌ Opcional | - |

## 🔧 Configuración Paso a Paso

### 1. Settings → Resources → Advanced

```json
{
  "cpus": 6,
  "memory": 10240,
  "swap": 2048,
  "diskSizeMiB": 102400,
  "experimental": {
    "useContainerdSnapshotter": true
  }
}
```

**Justificación:**
- **6 CPUs**: NEXUS V1 ejecuta 6 contenedores simultáneos (app, mongodb, rabbitmq, redis, jaeger, evaluation)
- **10 GB RAM**:
  - app: 2 GB
  - mongodb: 2 GB
  - rabbitmq: 1 GB
  - redis: 512 MB
  - jaeger: 512 MB
  - evaluation: 1 GB
  - **Total servicios: 7 GB + 3 GB overhead del sistema**
- **2 GB Swap**: Previene OOM kills durante picos de carga
- **100 GB Disk**: Imágenes (~10 GB), volúmenes de MongoDB (~20 GB), logs, builds

### 2. Settings → Docker Engine

```json
{
  "builder": {
    "gc": {
      "enabled": true,
      "defaultKeepStorage": "20GB"
    }
  },
  "features": {
    "buildkit": true
  },
  "experimental": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
```

**Optimizaciones clave:**
- ✅ **BuildKit habilitado**: Builds 50% más rápidos, cache eficiente
- ✅ **Garbage Collection automático**: Mantiene solo 20GB de caché
- ✅ **Log rotation**: 3 archivos × 10MB máximo (previene disk full)
- ✅ **overlay2 storage driver**: Mejor performance que aufs/devicemapper
- ✅ **File descriptors aumentados**: Evita errores "too many open files"

### 3. Settings → Kubernetes

```yaml
Habilitar Kubernetes: ✅
Show system containers: ✅
Kubernetes context: docker-desktop
```

**Comandos de verificación:**
```powershell
# Verificar contexto
kubectl config current-context  # Debe mostrar: docker-desktop

# Verificar nodes
kubectl get nodes
# NAME             STATUS   ROLES           AGE   VERSION
# docker-desktop   Ready    control-plane   Xd    vX.XX.X

# Verificar recursos disponibles
kubectl describe node docker-desktop | Select-String -Pattern "Allocatable" -Context 0,10
```

### 4. Settings → File Sharing (Windows)

Asegurar que el directorio del proyecto está compartido:

```
✅ C:\Users\Alejandro\NEXUS V1
✅ C:\Users\Alejandro\NEXUS V1\server
✅ C:\Users\Alejandro\NEXUS V1\client
```

### 5. WSL 2 Configuration (.wslconfig)

Crear/editar `C:\Users\Alejandro\.wslconfig`:

```ini
[wsl2]
memory=10GB
processors=6
swap=2GB
localhostForwarding=true

# Performance optimizations
nestedVirtualization=true
pageReporting=true
guiApplications=false

# Network
networkingMode=mirrored
firewall=true
```

**Reiniciar WSL:**
```powershell
wsl --shutdown
# Esperar 10 segundos
wsl
```

## 🎯 Optimizaciones de Performance

### Build Cache Optimization

```dockerfile
# Agregar al Dockerfile (ya implementado en NEXUS V1)
# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS base
# ... resto del Dockerfile multi-stage
```

### Docker Compose Performance

```yaml
# docker-compose.yml optimizations (ya aplicadas)
services:
  app:
    build:
      context: .
      cache_from:
        - ghcr.io/nemisanalex/NEXUS V1:latest
      args:
        BUILDKIT_INLINE_CACHE: 1
```

### Prune Automation Script

Crear `scripts/docker-cleanup.ps1`:

```powershell
#!/usr/bin/env pwsh
# Ejecutar semanalmente para liberar espacio

Write-Host "🧹 Limpiando Docker..." -ForegroundColor Cyan

# Eliminar contenedores detenidos
docker container prune -f

# Eliminar imágenes sin usar
docker image prune -a -f --filter "until=72h"

# Eliminar volúmenes huérfanos
docker volume prune -f

# Eliminar build cache antiguo
docker builder prune -f --keep-storage 20GB

# Estadísticas finales
docker system df
```

## 📈 Monitoreo de Recursos

### Dashboard de Docker Desktop

Abrir: **Docker Desktop → Dashboard → Containers**

Métricas clave a monitorear:
- **CPU %**: No debe exceder 80% sostenido
- **Memory**: No debe llegar al límite configurado
- **Disk I/O**: Picos indican necesidad de más IOPS
- **Network**: Útil para debugging de conectividad

### CLI Monitoring

```powershell
# Monitoreo en tiempo real
docker stats

# Filtrar solo contenedores de NEXUS V1
docker stats $(docker ps --filter "name=NEXUS V1" -q)

# Exportar métricas a JSON
docker stats --no-stream --format "{{json .}}" | ConvertFrom-Json
```

### Prometheus + Grafana (Opcional)

```yaml
# Agregar a docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
```

## 🔍 Troubleshooting Común

### Problema: "Docker Desktop is slow"

**Solución 1: Verificar WSL 2 backend**
```powershell
docker info | Select-String -Pattern "Operating System"
# Debe mostrar: WSL 2
```

**Solución 2: Aumentar recursos**
```powershell
# Ver uso actual
Get-Process "Docker Desktop" | Format-List CPU, WorkingSet64

# Si WorkingSet64 > 8GB, aumentar memory en Docker Desktop
```

**Solución 3: Deshabilitar extensiones innecesarias**
```
Docker Desktop → Settings → Extensions → Deshabilitar extensiones no usadas
```

### Problema: "Cannot start service X: port already in use"

**Solución:**
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso
Stop-Process -Id <PID> -Force

# O cambiar puerto en docker-compose.yml
```

### Problema: "Out of disk space"

**Solución:**
```powershell
# Ver uso de disco
docker system df

# Limpieza agresiva (⚠️ cuidado en producción)
docker system prune -a --volumes -f

# Aumentar "Disk Image Size" en Docker Desktop Settings
```

### Problema: "Build fails with network timeout"

**Solución:**
```powershell
# Configurar DNS alternativo en Docker Engine settings
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}

# O usar VPN bypass para npm registry
npm config set registry https://registry.npmjs.org/
```

## ✅ Checklist de Validación

Después de configurar Docker Desktop, ejecutar:

```powershell
# 1. Verificar Docker funcionando
docker --version
docker-compose --version

# 2. Verificar recursos
docker info | Select-String -Pattern "CPUs", "Total Memory"

# 3. Verificar BuildKit
docker buildx ls

# 4. Verificar Kubernetes
kubectl cluster-info

# 5. Test build de NEXUS V1
cd C:\Users\Alejandro\NEXUS V1
docker-compose build --no-cache app
# Debe completar en ~4 minutos (con BuildKit)

# 6. Test deployment
docker-compose up -d
docker-compose ps
# Todos los servicios deben mostrar "Up (healthy)"

# 7. Verificar health checks
docker inspect NEXUS V1-app | ConvertFrom-Json | Select-Object -ExpandProperty State | Select-Object Health
# Debe mostrar: Health.Status = "healthy"
```

## 🚀 Quick Start Optimizado

```powershell
# Script de inicio rápido
cd C:\Users\Alejandro\NEXUS V1

# Usar BuildKit cache
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

# Build con cache
docker-compose build

# Start con health checks
docker-compose up -d

# Esperar health checks (max 60s)
$elapsed = 0
while ($elapsed -lt 60) {
    $healthy = docker-compose ps | Select-String "healthy"
    if ($healthy.Count -eq 5) {
        Write-Host "✅ Todos los servicios saludables" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
}

# Abrir logs
docker-compose logs -f app
```

## 📚 Referencias

- [Docker Desktop Best Practices](https://docs.docker.com/desktop/settings/windows/)
- [WSL 2 Configuration](https://docs.microsoft.com/en-us/windows/wsl/wsl-config)
- [BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)

---

**Última actualización:** 2025-12-XX
**Versión:** 1.0.0
**Mantenedor:** NEXUS V1 DevOps Team

