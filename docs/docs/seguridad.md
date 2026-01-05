# Seguridad avanzada: 2FA y branch protection

## Recomendaciones para el repositorio

- **2FA**: Habilita la autenticación en dos pasos para todos los colaboradores en la organización y el repositorio.
- **Branch protection**: Activa reglas de protección en la rama `main`:
  - Requerir PR review antes de merge
  - Requerir que los checks de CI pasen antes de merge
  - Requerir commits firmados (opcional)
  - No permitir force push ni borrado de la rama

## Cómo activar

1. Ve a Settings > Branches > Branch protection rules
2. Crea una regla para `main` con los checks anteriores
3. Ve a Settings > Security > Authentication y exige 2FA para la organización

> Documenta y comunica estas políticas en el onboarding y README.
