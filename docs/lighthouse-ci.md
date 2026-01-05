# Lighthouse CI Integration

This project uses [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) to automate web performance, accessibility, best practices, and SEO checks on every push and pull request to `main`/`master`.

## How it works
- On every push/PR to `main`/`master`, GitHub Actions runs Lighthouse CI against the local dev server.
- Results are uploaded to temporary public storage and can be viewed in the workflow logs.
- Performance, accessibility, best practices, and SEO must all score at least 90% to pass.

## Configuration
- **Config file:** `lighthouserc.json` at the repo root.
- **Workflow:** `.github/workflows/lighthouseci.yml`
- **URL tested:** `http://localhost:5173` (update if your dev server runs elsewhere)
- **Runs:** 3 runs per PR/push for stability.

## Usage
- To run locally:
  ```sh
  pnpm install
  pnpm build
  npx lhci autorun --config=./lighthouserc.json
  ```
- To view results in CI, check the GitHub Actions tab for the `Lighthouse CI` workflow.

## GitHub Token
- Set the `LHCI_GITHUB_APP_TOKEN` secret in your repo for GitHub status checks.
- [How to create a token](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/recipes/github-actions.md#github-app-token).

## Resources
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
