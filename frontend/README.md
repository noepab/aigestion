# NEXUS V1 Frontend Monorepo

## Estructura

```
frontend/
  apps/
    dashboard/            # App principal (dashboard)
    landing-github-pages/ # Primera landing page
    landingpage/          # Segunda landing page
  shared/                 # Componentes/utilidades comunes
  pnpm-workspace.yaml     # Configuración monorepo (pnpm)
  package.json            # Scripts y dependencias globales
  .eslintrc.json          # Linting global
  .prettierrc             # Formateo global
  vitest.config.ts        # Testing global
```

## Flujos de trabajo

- **Instalar dependencias:**

```sh
pnpm install
```

- **Desarrollo de una app:**

```sh
pnpm -F dashboard dev
pnpm -F landing-github-pages dev
pnpm -F landingpage dev
```

- **Lint y formato global:**

```sh
pnpm lint
pnpm format
```

- **Testing global:**

```sh
pnpm test
```

- **Build de todas las apps:**

```sh
pnpm build:all
```

## Compartir código

- Usa `@shared/*` para importar componentes, hooks o utilidades comunes desde cualquier app.
- Ejemplo:

```ts
import { SharedHello } from '@shared/components/SharedHello';
```

## CI/CD

- El monorepo incluye un workflow de GitHub Actions para build, lint y test automático en cada push/PR.

## Buenas prácticas

- Mantén cada app aislada, pero comparte lógica/UI en `shared`.
- Usa scripts globales para mantener la calidad y consistencia.
- Documenta nuevos componentes y flujos en este README.

---

¡Listo para escalar y trabajar en equipo a nivel profesional!

## Storybook

```bash
pnpm storybook          # start Storybook dev server (http://localhost:6006)
pnpm build-storybook    # build static Storybook site
```

The example `Button` component can be found under **Example → Button**.

## Avatars & Visual Identity

The project includes two extensive brand avatars derived from the `presentacion.mp4` video:

1.  **Daniela** (`frontend/assets/daniela.png`): "Beauty & Impact" – rounded, pink/warm styling.
2.  **Nexus** (`frontend/assets/nexus.png`): "Technological Power" – rounded, blue/cool styling.

Use the shared `<Avatar />` component for consistent rendering. See `VISUAL_DESIGN_GUIDE.md` for full implementation details.

