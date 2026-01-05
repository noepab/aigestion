# Monorepo Turbo & Workspace Optimization

This project uses [Turborepo](https://turbo.build/) for fast, scalable monorepo builds and workspace automation.

---

## Key Features
- **turbo.json**: Central pipeline config for build, dev, lint, test, docs
- **Caching**: Smart output caching for builds, tests, and docs
- **Parallelization**: Runs tasks in parallel where possible
- **Incremental**: Only rebuilds what changed

## Usage
- `pnpm build` — Fast, incremental build for all packages/apps
- `pnpm dev` — Start all dev servers
- `pnpm lint` — Lint all packages/apps
- `pnpm test` — Test all packages/apps

## Customization
- Edit `turbo.json` to add/adjust pipelines and outputs
- Add more scripts in `package.json` for workspace-wide automation

---

For more, see the [Turborepo docs](https://turbo.build/repo/docs)
