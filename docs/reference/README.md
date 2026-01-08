# NEXUS V1 - AI Dashboard & Infrastructure

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue)
![Engine](https://img.shields.io/badge/node-%3E%3D18.0.0-green)

> **"God-Level" Optimization & Agentic Automation**

NEXUS V1 is a next-generation AI Dashboard backend featuring InversifyJS architecture, premium security auditing, self-healing dependency management, and real-time social media alerting.

## 🚀 Key Features

### 🛡️ Nexus Sentinel
Automated dependency health management system.
- `npm run nexus:doctor`: Instant environment diagnostic.
- `npm run nexus:heal`: One-click "Scorched Earth" recovery.

### ⚡ Phase 4: Granular Optimization
- **Granular Rate Limiting**: Intelligent protection for `/ai` and Auth endpoints.
- **Mobile Awareness**: Network status detection and responsive UI feedback.
- **Performance**: Web Workers, Virtual Scrolling, and Redis Caching.

### 🚀 Phase 5: NestJS Enterprise Pilot
- **Micro-Architecture**: Established `packages/nexus-core-nestjs` as the new standard for robust modules.
- **System Module**: Advanced telemetry and health monitoring with Swagger integration.
- **Documentation**: Automated API docs accessible at `/docs`.

### 🔐 Premium Credential Manager
Proactive security auditing for external integrations.
- Verifies **Stripe**, **Google Cloud**, **Gemini**, **Telegram**, **Instagram**.
- Sends real-time alerts to the `AIGestion` Telegram channel upon failure.
- Secured via **InversifyJS** architecture.

### 🏗️ Architecture
- **Dependency Injection**: Powered by `InversifyJS`.
- **API**: Standardized REST API v1 with `AppError` handling and Swagger/OpenAPI docs.
- **Monitoring**: Comprehensive logging with Winston and custom metrics.

## 🛠️ Quick Start

1. **Install all dependencies**
    ```bash
    pnpm install
    ```

2. **Run backend locally**
    ```bash
    pnpm dev:backend
    ```

3. **Run frontend locally**
    ```bash
    pnpm dev:frontend
    ```

4. **Or run the whole stack with Docker**
    ```bash
    pnpm dev:docker
    ```

5. **Check environment health**
    ```bash
    npm run nexus:doctor
    ```

## 📚 Documentation
- [Nexus Sentinel Guide](backend/docs/nexus-sentinel.md)
- [Credential Manager Architecture](backend/docs/credential-manager.md)

## 🤝 Contributing
Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Supported Linters

- actionlint
- ansible-lint
- autopep8
- bandit
- biome
- black
- brakeman
- buf
- buildifier
- cfnlint
- checkov
- circleci
- clang-format
- clang-tidy
- clippy
- cmake-format
- codespell
- cspell
- cue-fmt
- dart
- deno
- detekt
- djlint
- dotenv-linter
- dotnet-format
- dustilock
- eslint
- flake8
- git-diff-check
- gitleaks
- gofmt
- gofumpt
- goimports
- gokart
- golangci-lint
- golines
- google-java-format
- graphql-schema-linter
- hadolint
- haml-lint
- isort
- iwyu
- ktlint
- kube-linter
- ls-lint
- markdown-link-check
- markdown-table-prettify
- markdownlint
- markdownlint-cli2
- mypy
- ... (add remaining linters as needed)
