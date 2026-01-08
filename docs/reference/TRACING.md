# OpenTelemetry Tracing Guide

## Overview

The NEXUS V1 backend is instrumented with OpenTelemetry for distributed tracing. This allows you to monitor HTTP requests, database operations, and other operations in real-time.

## Quick Start

### 1. Start the Trace Collector

Before running the application, start the AI Toolkit trace collector:

**VS Code Command Palette (Ctrl+Shift+P):**

```text
AI Toolkit: Open Tracing
```


This will start the OTLP collector at `http://localhost:4318`.

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=NEXUS V1-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### 3. Run the Application

```bash
npm run dev
```

You should see:

```text
🔭 OpenTelemetry tracing initialized successfully
📡 Sending traces to: http://localhost:4318
```


### 4. View Traces

Open the AI Toolkit tracing viewer in VS Code to see your traces in real-time.

## What's Automatically Traced

The following operations are automatically instrumented:

- ✅ **HTTP Requests** - All incoming Express routes
- ✅ **MongoDB Operations** - Mongoose queries and updates
- ✅ **Socket.IO Events** - WebSocket connections and messages
- ✅ **External HTTP Calls** - Outgoing HTTP requests

### Excluded from Tracing

To reduce noise, these are not traced:

- `/health` endpoint
- `/favicon.ico` requests
- `/static/*` assets
- File system operations

## Architecture

```text
┌─────────────┐     OTLP/HTTP      ┌──────────────┐
│ NEXUS V1 Backend │ ──────────────────> │ AI Toolkit   │
│  (Port 5000)│    (Port 4318)      │ Collector    │
└─────────────┘                     └──────────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │ Trace Viewer │
                                    │  (VS Code)   │
                                    └──────────────┘
```

## Configuration

### Service Information

The following resource attributes are automatically set:

- **service.name**: From `OTEL_SERVICE_NAME` env var (default: `NEXUS V1-backend`)
- **service.version**: From `package.json` version
- **deployment.environment**: From `NODE_ENV` (default: `development`)

### Exporter Configuration

- **Protocol**: OTLP/HTTP
- **Endpoint**: `http://localhost:4318/v1/traces`
- **Timeout**: 15 seconds
- **Batching**: Enabled (BatchSpanProcessor)

## Advanced Usage

### Manual Instrumentation

If you need to add custom spans, import the tracer:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('NEXUS V1-custom-tracer');

async function myFunction() {
  const span = tracer.startSpan('my-operation');

  try {
    // Your code here
    span.setAttribute('custom.attribute', 'value');
  } catch (error) {
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Using Different Collectors

To use Jaeger, Zipkin, or other OTLP-compatible collectors:

```env
# Jaeger (all-in-one)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Jaeger (custom port)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:14268

# Azure Monitor
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-region.monitor.azure.com
```

## Troubleshooting

### No traces appearing

1. **Check collector is running:**

   ```bash
   # The AI Toolkit trace viewer should show "Collector Status: Running"
   ```

2. **Verify endpoint:**

   ```bash
   curl http://localhost:4318/v1/traces
   # Should return 405 (Method Not Allowed) - this means it's listening
   ```

3. **Check logs:**

   Look for the initialization message:

   ```text
   🔭 OpenTelemetry tracing initialized successfully
   ```


### Application crashes on startup

If tracing initialization fails, the app will continue without tracing (graceful degradation):

```text
❌ Error initializing OpenTelemetry: [error details]
⚠️  Application will continue without tracing
```


### High overhead

If tracing causes performance issues, you can:

1. **Disable in production:**

   ```typescript
   // In src/config/tracing.ts, add at the top:
   if (process.env.NODE_ENV === 'production') {
     process.exit(0); // Don't load tracing in production
   }
   ```


2. **Adjust sampling rate** (future enhancement)

## Integration with AI Toolkit

The AI Toolkit provides:

- **Real-time trace visualization**
- **Span timeline view**
- **Request/response inspection**
- **Performance metrics**
- **Error tracking**

Access it through:

- Command Palette: `AI Toolkit: Open Tracing`
- Activity Bar: Click the AI Toolkit icon
- View: Explorer → AI Toolkit → Tracing

## References

- [OpenTelemetry JavaScript Docs](https://opentelemetry.io/docs/languages/js/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [AI Toolkit Documentation](https://github.com/microsoft/vscode-ai-toolkit)

## Best Practices

1. ✅ Always start the collector before the application
2. ✅ Use environment variables for configuration
3. ✅ Let auto-instrumentation handle common operations
4. ✅ Only add manual spans for custom business logic
5. ✅ Set meaningful span attributes for debugging
6. ⚠️ Don't trace PII or sensitive data
7. ⚠️ Disable or sample in high-traffic production environments

