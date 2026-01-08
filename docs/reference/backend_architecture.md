# Backend Architecture Documentation

## Overview
The AIGestion Backend is built with **Node.js** and **TypeScript**, leveraging **InversifyJS** for Dependency Injection (DI) and **Express** as the web framework. This architecture ensures loose coupling, high testability, and clear separation of concerns.

## Core Components

### 1. Dependency Injection (InversifyJS)
- **Container**: (`src/config/inversify.config.ts`) The central registry where all services and controllers are bound.
- **Types**: (`src/types.ts`) Symbol definitions used as unique identifiers for injections.
- **Pattern**: We use Constructor Injection for all services.
    ```typescript
    constructor(@inject(TYPES.MyService) private myService: MyService) {}
    ```

### 2. Application Structure (`src/`)
- **server.ts**: Entry point. Sets up the server, error handling, and signals.
- **app.ts**: Express application configuration (middleware, routes).
- **controllers/**: Request handlers. Should remain thin and delegate logic to services.
- **services/**: Business logic layer. All complex operations happen here.
- **routes/**: Route definitions linking HTTP endpoints to controllers.
- **middleware/**: Custom Express middleware (Authentication, Validation, Logging).
- **dto/**: Data Transfer Objects (Validation Schemas e.g., Zod or Class Validator).

### 3. Key Services
- **AIService**: Orchestrates AI operations using Google Gemini 2.0. Integrates tools like `RagService`, `SearchService`, and `AnalyticsService`.
- **RagService**: Manages Retrieval-Augmented Generation code reading capabilities.
- **AnalyticsService**: Aggregates system and business metrics.

### 4. API Versioning
- Routes are versioned (e.g., `/api/v1`).
- `src/routes/api-v1.routes.ts` aggregates all V1 routers.

## Design Patterns
- **Repository Pattern** (Implicit): Data access is currently handled within Services. (Future consideration: dedicated repositories).
- **Adapter Pattern**: Service wrappers around external APIs (Stripe, Google AI, etc.).

## Setup & Running
- `npm run dev`: Starts the server in development mode (watch mode).
- `npm run build`: Compiles TypeScript to JavaScript (in `dist/`).
- `npm start`: Runs the compiled application.
