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

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Check Environment Health**
   ```bash
   npm run nexus:doctor
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📚 Documentation
- [Nexus Sentinel Guide](backend/docs/nexus-sentinel.md)
- [Credential Manager Architecture](backend/docs/credential-manager.md)

## 🤝 Contributing
Please read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
