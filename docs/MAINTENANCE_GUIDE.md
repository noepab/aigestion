# 📚 Guía de Mantenimiento del Sistema de Documentación

## 🎯 Para Nuevos Desarrolladores

### Al Crear Nueva Documentación

1. **Crea el archivo .md donde sea conveniente**
   ```bash
   # Puedes crear en cualquier lugar (no dentro de node_modules, .venv, etc.)
   code nuevo-feature.md
   ```

2. **El sistema lo organizará automáticamente**
   - En el próximo `git push`, GitHub Actions lo moverá
   - O ejecuta manualmente: `npm run docs:full`

3. **Usa nombres descriptivos que sigan las convenciones**
   - `DEPLOYMENT_*.md` → va a `docs/deployment/`
   - `API_*.md` → va a `docs/api/`
   - `*_GUIDE.md` → va a `docs/guides/`
   - Ver tabla completa en DOCUMENTATION_IMPLEMENTATION_COMPLETE.md

### Antes de Hacer Commit

```bash
# Valida que todo esté bien
npm run docs:validate

# Si hay archivos fuera de docs/, organízalos
npm run docs:organize

# Ver estructura actual
npm run docs:tree
```

## 🔧 Para Mantenedores

### Agregar Nueva Regla de Organización

Edita `scripts/organize-docs.ps1`:

```powershell
$OrganizationRules = @{
    # ... reglas existentes ...

    # Nueva regla
    "NUEVA_CATEGORIA*.md" = "nueva-carpeta"
}
```

Luego:
```bash
npm run docs:organize
git commit -m "feat: nueva regla de organización"
```

### Crear Nueva Categoría

1. **Edita** `scripts/generate-docs-index.ps1`
```powershell
$Categories = [ordered]@{
    # ... categorías existentes ...
    "nueva-categoria" = "🆕 Nueva Categoría"
}
```

2. **Crea la carpeta**
```bash
mkdir docs/nueva-categoria
```

3. **Regenera índice**
```bash
npm run docs:index
```

### Modificar GitHub Action

Edita `.github/workflows/docs-validation.yml`:

```yaml
# Ajustar exclusiones
-not -path "./nueva-exclusion/*" \
```

## 🚨 Solución de Problemas

### Problema: Archivos no se organizan automáticamente

**Solución:**
```bash
# 1. Verifica que el archivo no esté excluido
npm run docs:organize:dry

# 2. Verifica las reglas
cat scripts/organize-docs.ps1 | grep 'OrganizationRules'

# 3. Ejecuta manualmente
npm run docs:organize
```

### Problema: INDEX.md desactualizado

**Solución:**
```bash
npm run docs:index
git add docs/INDEX.md
git commit -m "docs: actualizar índice"
```

### Problema: GitHub Action falla

**Solución:**
1. Revisa los logs en GitHub Actions
2. Verifica que PowerShell esté instalado en runner
3. Prueba localmente:
```bash
npm run docs:full
```

## 📋 Checklist de Mantenimiento Semanal

- [ ] Ejecutar `npm run docs:tree` para ver estructura
- [ ] Revisar que no haya archivos .md fuera de docs/
- [ ] Verificar que INDEX.md esté actualizado
- [ ] Revisar logs de GitHub Actions
- [ ] Buscar documentos duplicados o obsoletos

## 🔄 Comandos de Mantenimiento

### Reorganizar Todo
```bash
npm run docs:full
```

### Ver Estado Actual
```bash
npm run docs:tree
```

### Limpiar y Reorganizar
```bash
# 1. Ver qué se va a mover
npm run docs:organize:dry

# 2. Hacer backup
cp -r docs docs.backup

# 3. Reorganizar
npm run docs:organize

# 4. Regenerar índice
npm run docs:index
```

### Validar Antes de PR
```bash
npm run docs:validate
npm run docs:tree
```

## 🎨 Personalización

### Cambiar Iconos en Árbol

Edita `scripts/show-docs-tree.ps1`:

```powershell
$icon = if ($item.Extension -eq ".md") { "📄" } else { "📋" }
# Cambia "📄" por el emoji que prefieras
```

### Cambiar Formato de INDEX.md

Edita `scripts/generate-docs-index.ps1`:

```powershell
# Modifica el template de IndexContent
$IndexContent = @"
# Tu formato personalizado aquí
"@
```

## 📊 Monitoreo

### Métricas a Seguir

```powershell
# Total de documentos
(Get-ChildItem docs/ -Filter *.md -Recurse).Count

# Tamaño total
(Get-ChildItem docs/ -Filter *.md -Recurse | Measure-Object Length -Sum).Sum / 1MB

# Documentos por categoría
Get-ChildItem docs/ -Directory | ForEach-Object {
    $count = (Get-ChildItem $_.FullName -Filter *.md -Recurse).Count
    "$($_.Name): $count docs"
}
```

### Alertas Automatizadas

Puedes agregar en GitHub Action:

```yaml
- name: Check doc count
  run: |
    count=$(find ./docs -name "*.md" | wc -l)
    if [ $count -lt 50 ]; then
      echo "::warning::Documentation count below threshold"
    fi
```

## 🔐 Permisos y Seguridad

### Scripts de Ejecución

Todos los scripts PowerShell deben tener:
```powershell
#!/usr/bin/env pwsh
# Al inicio del archivo
```

### GitHub Action Secrets

No se requieren secrets especiales, pero si integras con servicios externos:

```yaml
env:
  DOCS_API_KEY: ${{ secrets.DOCS_API_KEY }}
```

## 📚 Recursos Adicionales

- [PowerShell Docs](https://docs.microsoft.com/powershell/)
- [GitHub Actions Docs](https://docs.github.com/actions)
- [Markdown Guide](https://www.markdownguide.org/)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa `DOCUMENTATION_IMPLEMENTATION_COMPLETE.md`
2. Consulta `scripts/README.md`
3. Ejecuta `npm run docs:tree` para diagnosticar
4. Revisa GitHub Actions logs

## ✅ Best Practices

1. **Siempre usa nombres descriptivos**
2. **Sigue las convenciones de nomenclatura**
3. **Ejecuta `docs:validate` antes de commit**
4. **No edites INDEX.md manualmente**
5. **Usa categorías existentes cuando sea posible**
6. **Documenta cambios en scripts**
7. **Prueba en dry-run antes de aplicar**

---

**Última actualización**: Diciembre 2025
**Versión del sistema**: 1.0.0
**Mantenedor**: NEXUS V1 Team

