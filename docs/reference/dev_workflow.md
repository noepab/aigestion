---
description: Development workflow for rapid iteration
---
# Development Workflow

This workflow provides a set of commands to quickly set up the development environment, run linting, tests, and start the server. It is stored in `.agent/workflows/dev_workflow.md` and can be invoked by the user or integrated into CI.

## Steps

1. **Install dependencies**
   ```sh
   npm install
   ```

2. **Run lint** (using the updated ESLint config with ignores)
   ```sh
   npm run lint
   ```

3. **Run unit tests** (fast mode)
   ```sh
   npm test
   ```

4. **Run tests with open‑handle detection** (useful when debugging flaky tests)
   ```sh
   npm run test:detect
   ```

5. **Start the development server** (with hot reload)
   ```sh
   npm run dev
   ```

## Optional helper scripts

- **scripts/lint_fix.sh** – runs `npm run lint -- --fix`.
- **scripts/run_tests_detect.sh** – runs `npm run test:detect`.

You can execute any step directly from the terminal or copy‑paste the commands into your IDE's run configuration.
