# 🚀 NEXUS V1 Audit System - Referencia Rápida

## 📋 Índice Rápido

- [Inicio Rápido](#-inicio-rápido)
- [Comandos Principales](#-comandos-principales)
- [Interpretación de Reportes](#-interpretación-de-reportes)
- [Troubleshooting](#-troubleshooting)
- [Atajos Útiles](#-atajos-útiles)

---

## ⚡ Inicio Rápido

### Primera vez
```powershell
cd c:\Users\Alejandro\NEXUS V1\scripts
.\audit-quickstart.ps1      # Configuración automática
```

### Uso diario
```powershell
# Interfaz principal
.\audit-control-center.ps1

# O acciones específicas
.\audit-control-center.ps1 run        # Ejecutar auditoría
.\audit-control-center.ps1 dashboard  # Ver dashboard
.\audit-control-center.ps1 analyze    # Ver análisis
```

---

## 🎯 Comandos Principales

### Control Center
```powershell
# Modo interactivo (menú)
.\audit-control-center.ps1

# Comandos directos
.\audit-control-center.ps1 run         🏃 Ejecutar auditoría ahora
.\audit-control-center.ps1 analyze     🔍 Análisis predictivo
.\audit-control-center.ps1 dashboard   📊 Dashboard de tendencias
.\audit-control-center.ps1 schedule    ⏰ Configurar agendador
.\audit-control-center.ps1 clean       🗑️  Limpiar datos históricos
.\audit-control-center.ps1 history     📋 Ver histórico
.\audit-control-center.ps1 status      ℹ️  Ver estado del sistema
.\audit-control-center.ps1 help        ❓ Mostrar ayuda
```

### Auditoría Completa
```powershell
# Ejecutar auditoría semanal completa
.\weekly-auto-audit.ps1
```

### Análisis Predictivo
```powershell
# Generar análisis y predicciones
.\audit-metrics-analyzer.ps1
```

### Dashboard
```powershell
# Ver visualización de tendencias
.\weekly-audit-dashboard.ps1
```

### Agendador
```powershell
# Configurar auditoría automática
.\setup-weekly-audit-scheduler.ps1

# Verificar tarea programada
Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit"

# Ver próxima ejecución
(Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit").NextRunTime
```

---

## 📊 Interpretación de Reportes

### Índice de Salud
```
9-10 🟢 EXCELENTE   → Mantener el estándar actual
7-8  🟡 BUENO       → Continuar mejorando
5-6  🟠 ALERTA      → Revisar prioritariamente
<5   🔴 CRÍTICO     → Acción inmediata necesaria
```

### Dashboard - Barras de Salud
```
████████░░  = 8/10 (80%)
███████░░░  = 7/10 (70%)
██████░░░░  = 6/10 (60%)
█████░░░░░  = 5/10 (50%)
```

### Tendencias Detectadas
```
↑ INCREASING    → Métrica en aumento
↓ DECREASING    → Métrica en disminución
→ STABLE        → Sin cambios significativos
↗ RAPID_EXPANSION → Crecimiento rápido
```

### Severidad de Anomalías
```
🔴 CRITICAL     → Requiere atención inmediata
🟠 HIGH         → Revisar esta semana
🟡 MEDIUM       → Monitorear en próximas semanas
🟢 INFO         → Información general
```

---

## 📁 Estructura de Archivos

```
c:\Users\Alejandro\NEXUS V1\
├── scripts/                          # Scripts del sistema
│   ├── audit-control-center.ps1      ⭐ Maestro
│   ├── audit-quickstart.ps1          ⚡ Instalación
│   ├── weekly-auto-audit.ps1         📊 Core
│   ├── audit-metrics-analyzer.ps1    🧠 Análisis
│   ├── weekly-audit-dashboard.ps1    📈 Visualización
│   └── setup-weekly-audit-scheduler.ps1 ⏰ Agendador
│
├── audit-data/                       # Datos
│   ├── audit-history.json            📦 Histórico
│   ├── predictive-analysis.json      🔮 Análisis
│   └── reports/                      📄 Reportes
│       └── WEEKLY_AUDIT_YYYY-ww.md
│
└── AUDIT_SYSTEM_README.md            📚 Documentación
```

---

## 🔍 Troubleshooting

### Problema: "Script no encontrado"
```powershell
# Solución 1: Verificar ubicación
cd c:\Users\Alejandro\NEXUS V1\scripts
ls *.ps1

# Solución 2: Verificar permisos
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: "No hay datos históricos"
```powershell
# Solución: Ejecutar primera auditoría
.\audit-control-center.ps1 run

# Esperar 2+ semanas para análisis completo
```

### Problema: "Tarea programada no se ejecuta"
```powershell
# Verificar estado
Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit" | Select *

# Reinstalar
.\setup-weekly-audit-scheduler.ps1

# Probar manualmente
.\weekly-auto-audit.ps1
```

### Problema: "Datos inconsistentes"
```powershell
# Limpiar y reiniciar
.\audit-control-center.ps1 clean
.\audit-control-center.ps1 run
```

### Problema: "PowerShell lento"
```powershell
# Ejecutar en background
Start-Job -FilePath ".\weekly-auto-audit.ps1"
```

---

## ⏰ Programación Automática

### Default Setup
- **Día**: Lunes
- **Hora**: 8:00 AM
- **Frecuencia**: Semanal
- **Usuario**: Tu usuario actual

### Cambiar Programación
```powershell
# Método 1: Task Scheduler UI
taskmgr → Task Scheduler → NEXUS V1-Weekly-Auto-Audit → Properties

# Método 2: PowerShell
$task = Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit"
$task | Unregister-ScheduledTask -Confirm:$false

# Luego reinstalar con:
.\setup-weekly-audit-scheduler.ps1
```

---

## 📊 Visualización de Datos

### Dashboard Interactivo
```
┌─ TENDENCIA DE SEGURIDAD
│  Semana 2025-01: 5 vulnerabilidades
│  Semana 2025-02: 3 vulnerabilidades ↓ -2 ✅
│
├─ CRECIMIENTO DE CÓDIGO
│  Semana 2025-01: 234 archivos
│  Semana 2025-02: 245 archivos ↑ +11 (4.7%)
│
├─ SALUD DEL REPOSITORIO
│  Archivos sin syncronizar: 0 ✅
│  Commits recientes: 8
│
└─ EVOLUCIÓN DE DEPENDENCIAS
   Semana 2025-01: 145 (prod) + 67 (dev)
   Semana 2025-02: 148 (prod) + 68 (dev) ↑ +4
```

### Exportar Datos
```powershell
# Exportar histórico como JSON (ya está)
type audit-data\audit-history.json

# Exportar como CSV
$history = Get-Content audit-data\audit-history.json | ConvertFrom-Json
$history | ConvertTo-Csv | Out-File audit-export.csv

# Exportar análisis
type audit-data\predictive-analysis.json
```

---

## 💡 Atajos Útiles

### Crear alias en PowerShell
```powershell
# Agregar al profile de PowerShell
$PROFILE | Out-File $PROFILE -Force

# Luego agregar:
Set-Alias NEXUS V1 'c:\Users\Alejandro\NEXUS V1\scripts\audit-control-center.ps1'
```

### Desktop Shortcut
```powershell
$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut("$env:USERPROFILE\Desktop\NEXUS V1-Audit.lnk")
$lnk.TargetPath = "powershell.exe"
$lnk.Arguments = "-NoExit -Command `"cd 'c:\Users\Alejandro\NEXUS V1\scripts'; .\audit-control-center.ps1`""
$lnk.Save()
```

### Abrir en Explorer
```powershell
# Abrir carpeta de datos
explorer.exe c:\Users\Alejandro\NEXUS V1\audit-data

# Abrir reportes
explorer.exe c:\Users\Alejandro\NEXUS V1\audit-data\reports
```

### Ver últimas actualizaciones
```powershell
# Último reporte
Get-ChildItem c:\Users\Alejandro\NEXUS V1\audit-data\reports | Sort-Object LastWriteTime -Descending | Select-Object -First 1

# Ver contenido
Get-Content (Get-ChildItem c:\Users\Alejandro\NEXUS V1\audit-data\reports -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

---

## 📈 Métricas Disponibles

| Métrica | Recolección | Alertas |
|---|---|---|
| 🔐 Vulnerabilidades | Automática (npm audit) | ↑ Aumento > 0 |
| 🔐 Secretos expuestos | Automática (pattern) | > 0 |
| 📝 Archivos TS/JS | Automática | Crecimiento % |
| 📚 Documentación | Automática | < 3 archivos |
| 🐙 Git status | Automática | > 10 archivos sin sync |
| 💾 Dependencias | Automática | ±20 cambios |
| 🔄 Commits | Automática | Promedio semanal |

---

## 🔐 Seguridad

- ✅ Datos locales (sin envíos externos)
- ✅ Sin credenciales sensibles en reportes
- ✅ Histórico encriptable si es necesario
- ✅ Permisos controlados por Windows
- ✅ Auditoría completa en JSON editable

---

## 📞 Ayuda Rápida

| Pregunta | Comando |
|---|---|
| ¿Cómo inicio? | `.\audit-quickstart.ps1` |
| ¿Qué es la salud? | `.\audit-control-center.ps1 analyze` |
| ¿Dónde están mis datos? | `explorer.exe c:\Users\Alejandro\NEXUS V1\audit-data` |
| ¿Cuándo se ejecuta? | `Get-ScheduledTask -TaskName "NEXUS V1-Weekly-Auto-Audit"` |
| ¿Qué veo en el dashboard? | `.\audit-control-center.ps1 dashboard` |
| ¿Cómo limpio datos? | `.\audit-control-center.ps1 clean` |

---

## 🎓 Flujo de Datos Completo

```
┌──────────────────┐
│  weekly-auto-    │  
│  audit.ps1       │  1. Recolecta métricas
└────────┬─────────┘
         │
         ▼
    ┌──────────────────┐
    │  audit-history   │  2. Guarda datos
    │  .json           │
    └────────┬─────────┘
             │
    ┌────────▼──────────┐
    │  audit-metrics-   │  3. Analiza &
    │  analyzer.ps1     │     predice
    └────────┬──────────┘
             │
    ┌────────▼──────────────┐
    │  predictive-analysis  │  4. Guarda
    │  .json                │     análisis
    └────────┬──────────────┘
             │
    ┌────────▼──────────┐
    │  weekly-audit-    │  5. Visualiza
    │  dashboard.ps1    │     en dashboard
    └───────────────────┘
```

---

## 📝 Notas Finales

- **Requisitos mínimos**: 4 semanas de datos para análisis completo
- **Mejor día para revisar**: Lunes por la mañana
- **Almacenamiento**: ~100 KB por auditoría (JSON muy compacto)
- **Rendimiento**: < 5 minutos por auditoría
- **Precisión**: Aumenta con más semanas de datos

---

**Última actualización**: 2024 | **Versión**: 2.0


