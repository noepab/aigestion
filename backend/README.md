# NEXUS V1 - Backend

This is the backend service for the NEXUS V1 Dashboard, built with Node.js, Express, and TypeScript.
It features a modular architecture using InversifyJS for Dependency Injection and utilizes Stripe for billing, Redis/RabbitMQ for async processing, and MongoDB for storage.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or v20 recommended)
- pnpm (v8+)
- MongoDB
- Redis
- RabbitMQ (Optional for dev, required for queues)

### Installation

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up Environment Variables:
    - Copy `.env.example` to `.env`
    - Fill in the required values (DB URI, Stripe Keys, etc.)

### Technical Documentation
For detailed architecture and development guides, please refer to:
- [Backend Architecture Guide](src/docs/backend_architecture.md)
- [AI Integration & RAG Guide](src/docs/ai_integration_guide.md)
- [API Documentation](src/docs/api_documentation.md) (If available)

## Development


Start the development server with hot-reload:

```bash
pnpm dev
```

The server runs on `http://localhost:3000` by default.

### Scripts

- `pnpm build`: Compile TypeScript to JavaScript (dist folder).
- `pnpm start`: Run the compiled production server.
- `pnpm test`: Run unit tests using Vitest.
- `pnpm typecheck`: Run TypeScript compiler check without emitting files.
- `pnpm lint`:/ Run ESLint.

## 🏗️ Architecture

- **Dependency Injection**: Powered by `inversify` and `inversify-express-utils`.
- **Testing**: `vitest` with `vi` globals for mocking.
- **Validation**: `zod` for request validation and environment config.
- **Logging**: `winston` + `morgan` for HTTP logging.

## 🛠️ Linters
The project uses the following linters and formatters:
- ESLint: Code linting
- Prettier: Code formatting
- Stylelint: CSS linting
- Commitlint: Conventional commit messages
- Secretlint: Secret detection
- Markdownlint: Markdown linting
- TSC: TypeScript compilation and type checking

## 🐳 Docker

Build the image:

```bash
docker build -t nexus-backend .
```

Run the container:

```bash
docker run -p 3000:3000 --env-file .env nexus-backend
```

## 💳 Billing (Stripe)

- Webhook endpoint: `/api/v1/stripe/webhook`
- Requires `STRIPE_WEBHOOK_SECRET` in `.env`.
- Use the Stripe CLI to forward events locally:
  ```bash
  stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
  ```
