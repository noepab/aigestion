# Task: Implement OpenTelemetry Observability 🔭

## Status

- [ ] Configure Tracing in Backend (`tracing.ts`)
- [ ] Initialize Tracing in Server Entrypoint (`server.ts`)
- [ ] Verify Implementation (Build & Run)
- [ ] Commit & Create Pull Request

## Context

We are implementing **Improvement #3: Complete Observability** from the 2025 Strategic Roadmap. This involves adding OpenTelemetry to the backend to trace requests and visualizing them in Jaeger.

## Detailed Steps

### 1. Configure Tracing in Backend

- Create `server/src/config/tracing.ts` to initialize the OpenTelemetry SDK.
- Configure the OTLP exporter to send traces to Jaeger.
- Enable auto-instrumentation for Express, Mongoose, and HTTP.

### 2. Initialize Tracing in Server Entrypoint

- Modify `server/src/server.ts` to import the tracing configuration **before** any other imports.
- This ensures that the instrumentation hooks are applied correctly at startup.

### 3. Verify Implementation

- Rebuild the Docker containers to include the new dependencies and configuration.
- Start the stack with `docker-compose up -d`.
- Generate some traffic to the API.
- Verify traces appear in the Jaeger UI (`http://localhost:16686`).

### 4. Commit & Create Pull Request

- Commit the changes to the `feat/observability-opentelemetry` branch.
- Push changes and create a PR description.
