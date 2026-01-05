# 🛠️ Documentation System - Maintenance Guide

## Daily Operations

### Check Documentation Health
```powershell
npm run docs:validate  # Muestra estadísticas y estructura
```

### Add New Documentation
```powershell
# 1. Crear archivo en cualquier carpeta
$content | Out-File "guide-nuevo.md"

# 2. Organizar automáticamente
npm run docs:organize

# 3. Actualizar índice
npm run docs:index
```

### Preview Changes
```powershell
# Ver qué cambiaría sin ejecutar
npm run docs:organize:dry
```

---

## Maintenance Tasks

### Weekly
- ✅ Ejecutar `npm run docs:full` para sincronizar
- ✅ Revisar `docs/INDEX.md` para nuevas entradas
- ✅ Verificar categorías en `docs/scripts/OPTIMIZATION_GUIDE.md`

### Monthly
- ✅ Revisar archivos sin categorizar en `docs/`
- ✅ Actualizar reglas en `organize-docs.ps1` si hay cambios
- ✅ Limpiar archivos duplicados o obsoletos

### Quarterly
- ✅ Auditar todo el directorio `docs/`
- ✅ Validar links en `INDEX.md`
- ✅ Revisar y actualizar documentación de scripts

---

## Troubleshooting

### Problema: "Archivo no se movió"

**Solución**:
```powershell
# 1. Verificar que no está excluido
$file = "path/to/file.md"
$excluded = @("node_modules", ".git", ".venv")
$excluded | ForEach-Object { if ($file -match $_) { Write-Host "EXCLUIDO" } }

# 2. Ejecutar con verbose
pwsh scripts/organize-docs.ps1 -Verbose

# 3. Verificar permisos
Test-Path "docs/" -PathType Container
```

### Problema: INDEX.md corrupto

**Solución**:
```powershell
# Regenerar desde cero
Remove-Item "docs/INDEX.md" -Force
npm run docs:index
```

### Problema: Script falla en CI/CD

**Solución**:
```powershell
# Ejecutar en ambiente limpio
pwsh -NoProfile scripts/organize-docs.ps1

# Verificar PowerShell versión
$PSVersionTable

# Debe ser 7.0+
```

---

## Configuration

Editar reglas en `organize-docs.ps1`:

```powershell
$Rules = @{
    "categoria" = @("palabra1", "palabra2", "palabra3")
}
```

Agregar nuevas categorías según necesidad del proyecto.

---

## Performance Optimization

### Si está lento:

1. **Reducir recursión**
   ```powershell
   # Especificar ruta exacta en lugar de recurso
   Get-ChildItem -Path "docs/" -Filter "*.md" -Depth 2
   ```

2. **Caché en CI/CD**
   ```powershell
   # Guardar INDEX.md en caché entre builds
   ```

3. **Parallelizar**
   ```powershell
   # Para 50+ archivos, usar parallelización
   ForEach-Object -Parallel { ... }
   ```

---

## Scripts Relacionados

- `organize-docs.ps1` - Organizador principal
- `generate-docs-index.ps1` - Generador de índices
- `show-docs-tree.ps1` - Visualizador
- `package.json` - Aliases npm

## Documentación

- `DOCUMENTATION_SYSTEM.md` - Arquitectura
- `MAINTENANCE_GUIDE.md` - Este archivo
- `OPTIMIZATION_GUIDE.md` - Optimizaciones

---

## Emergency Recovery

Si algo se rompe:

```powershell
# 1. Hacer backup
Copy-Item "docs/" "docs.backup" -Recurse

# 2. Limpiar
Remove-Item "docs/*" -Recurse -Exclude "*.backup"

# 3. Regenerar
npm run docs:organize:dry   # Preview primero
npm run docs:organize       # Ejecutar

# 4. Verificar
npm run docs:tree
```

---

**Última actualización**: Diciembre 2025
**Contacto**: Alejandro (noepab)
**Status**: Operacional 🟢
