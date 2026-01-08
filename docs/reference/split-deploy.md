# Split Deployments in NEXUS V1 Monorepo

This monorepo supports split deployments for independent apps/services (frontend, backend, docs, etc.) using Vercel and GitHub Actions.

## Structure
- **Frontend (Vite/React):** `frontend/apps/dashboard`, `frontend/apps/landingpage`, `frontend/apps/landing-github-pages`
- **Backend:** `apps/backend`
- **Next.js (if present):** `apps/frontend-next`
- **Docs:** `docs/`

## Vercel Configuration
- Root `vercel.json` currently deploys `frontend/apps/dashboard`.
- To deploy other apps, create additional Vercel projects and set their `outputDirectory` accordingly (e.g., `frontend/apps/landingpage/dist`).
- Each app can have its own Vercel project for independent preview/production URLs.

## GitHub Actions
- `.github/workflows/ci-frontend.yml`: Runs build/lint/test for all frontend apps on changes.
- `.github/workflows/vercel-preview.yml`: Deploys preview to Vercel on PRs.
- Add more workflows for backend/docs as needed.

## How to Add a New Split Deploy
1. **Create a new Vercel project** for the app/service.
2. Set the `outputDirectory` in Vercel settings or in a new `vercel.json` (or use project-level config).
3. Add/adjust GitHub Actions workflow to build/test/deploy that app.
4. (Optional) Add a badge or link to the README for each deployed app.

## Example: Add Landing Page Deploy
- Create a new Vercel project for `frontend/apps/landingpage`.
- Set build command: `pnpm build`
- Set output directory: `frontend/apps/landingpage/dist`
- (Optional) Add a new workflow for landing page deploy preview.

## References
- [Vercel Monorepo Docs](https://vercel.com/docs/projects/monorepos)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

For advanced use (custom domains, environment variables, backend deploys, etc.), see the Vercel and GitHub Actions documentation.
