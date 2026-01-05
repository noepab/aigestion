# Configuración de Docker Desktop para Mini PC
# Optimizada para recursos limitados

{
  "builder": {
    "gc": {
      "enabled": true,
      "defaultKeepStorage": "10GB"
    }
  },
  "experimental": false,
  "features": {
    "buildkit": true
  },
  "memoryMiB": 2048,
  "cpus": 2,
  "diskSizeMiB": 20480,
  "swapMiB": 1024
}

# INSTRUCCIONES DE CONFIGURACIÓN:

# Opción 1: Configurar desde Docker Desktop UI
# 1. Abre Docker Desktop
# 2. Ve a Settings (⚙️) → Resources
# 3. Ajusta:
#    - Memory: 2 GB
#    - CPUs: 2
#    - Disk image size: 20 GB
#    - Swap: 1 GB
# 4. Click "Apply & Restart"

# Opción 2: Editar archivo de configuración
# Windows: %APPDATA%\Docker\settings.json
# Copia los valores de arriba al archivo

# CONFIGURACIONES ADICIONALES RECOMENDADAS:

# General:
# - [ ] Start Docker Desktop when you log in: DESACTIVAR (ahorra recursos)
# - [ ] Use Docker Compose V2: ACTIVAR

# Resources → Advanced:
# - Memory: 2 GB
# - CPUs: 2
# - Swap: 1 GB
# - Disk image size: 20 GB

# Resources → File Sharing:
# - Solo compartir carpetas necesarias

# Docker Engine (configuración avanzada):
{
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

# LIMPIEZA REGULAR (Ejecutar semanalmente):

# PowerShell/CMD:
# docker system prune -a --volumes -f
# docker builder prune -a -f

# MONITOREO:

# Ver uso de recursos:
# docker stats

# Ver espacio en disco:
# docker system df

# OPTIMIZACIONES ADICIONALES:

# 1. Usar imágenes Alpine cuando sea posible
# FROM node:18-alpine

# 2. Multi-stage builds para reducir tamaño
# 3. .dockerignore para excluir archivos innecesarios
# 4. Limpiar caché de build regularmente
# 5. Usar volúmenes named en lugar de bind mounts cuando sea posible

# TROUBLESHOOTING:

# Si Docker usa demasiada RAM:
# 1. Reduce memoryMiB a 1536 (1.5GB)
# 2. Cierra contenedores no usados
# 3. Limpia imágenes antiguas

# Si Docker es muy lento:
# 1. Aumenta cpus a 3 si tienes 4+ cores
# 2. Verifica que WSL2 esté actualizado
# 3. Considera usar Docker sin Desktop (solo CLI)

# ALTERNATIVA LIGERA (Sin Docker Desktop):

# Usar solo Docker CLI con WSL2:
# 1. Instalar Docker en WSL2 directamente
# 2. No usar Docker Desktop
# 3. Ahorra ~500MB de RAM
# 4. Más complejo de configurar pero más eficiente
