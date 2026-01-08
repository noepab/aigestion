# Performance, Accessibility, and Contract Testing Automation

This project automates:
- **Performance testing:** Lighthouse CI (already integrated)
- **Accessibility testing:** axe-core (GitHub Actions)
- **Contract/API testing:** OpenAPI/Swagger validation (GitHub Actions)

---

## Accessibility Testing (axe-core)

- Add `axe-core` and `jest-axe` for accessibility unit tests.
- Add `pa11y` for CLI/page-level accessibility checks.
- Example workflow: `.github/workflows/accessibility.yml`

## Contract/API Testing

- Add OpenAPI/Swagger spec validation (e.g., with `swagger-cli` or `openapi-cli`).
- Add contract tests using `jest`, `supertest`, or `dredd`.
- Example workflow: `.github/workflows/contract-test.yml`

---

## Example: Accessibility Workflow
```yaml
name: Accessibility
on: [push, pull_request]
jobs:
  pa11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: npm install -g pa11y
      - name: Run pa11y
        run: pa11y https://your-deployed-url.com
```

## Example: Contract Test Workflow
```yaml
name: Contract Test
on: [push, pull_request]
jobs:
  openapi-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: npm install -g swagger-cli
      - name: Validate OpenAPI spec
        run: swagger-cli validate path/to/openapi.yaml
```

---

- Add/adjust URLs and paths as needed for your deployment.
- For more advanced contract tests, use `jest` or `dredd` with your API endpoints.

## References
- [axe-core](https://github.com/dequelabs/axe-core)
- [pa11y](https://github.com/pa11y/pa11y)
- [swagger-cli](https://github.com/APIDevTools/swagger-cli)
- [dredd](https://github.com/apiaryio/dredd)
- [jest-axe](https://github.com/nickcolley/jest-axe)
