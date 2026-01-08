# NEXUS V1 Tracing Setup - Implementation Summary

## ✅ What Was Added

### 1. Enhanced OpenTelemetry Configuration
**File:** `server/src/config/tracing.ts`

**Improvements:**
- ✅ Updated to use modern semantic convention imports (`ATTR_*` instead of deprecated `SemanticResourceAttributes`)
- ✅ Added `BatchSpanProcessor` for better performance
- ✅ Enhanced error handling with graceful degradation
- ✅ Added request filtering to ignore health checks and static assets
- ✅ Improved logging with emoji indicators
- ✅ Added SIGINT handler for better shutdown (Ctrl+C support)
- ✅ Exported SDK for manual instrumentation if needed
- ✅ Added timeout configuration (15 seconds)

### 2. Environment Configuration
**File:** `server/.env.example`

**Added:**
```env
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=NEXUS V1-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### 3. Documentation
**File:** `server/TRACING.md`

**Includes:**
- Quick start guide
- Architecture diagram
- Configuration options
- Troubleshooting tips
- Advanced usage examples
- AI Toolkit integration guide

## 🎯 How to Use

### Step 1: Start AI Toolkit Trace Collector

**Option A - Command Palette:**
1. Press `Ctrl+Shift+P`
2. Type: `AI Toolkit: Open Tracing`
3. Press Enter

**Option B - Activity Bar:**
1. Click AI Toolkit icon in Activity Bar
2. Navigate to Tracing section

### Step 2: Configure Environment

Copy the environment variables:
```bash
cd server
cp .env.example .env
```

Ensure these are set in `.env`:
```env
OTEL_SERVICE_NAME=NEXUS V1-backend
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Step 3: Run the Server

```bash
cd server
npm run dev
```

You should see:
```
🔭 OpenTelemetry tracing initialized successfully
📡 Sending traces to: http://localhost:4318
```

### Step 4: View Traces

Open the AI Toolkit tracing viewer in VS Code to see your traces in real-time.

## 📊 What Gets Traced

### Automatically Instrumented:
- ✅ **HTTP Requests** - All Express routes and middleware
- ✅ **MongoDB Operations** - Mongoose queries, updates, deletes
- ✅ **Socket.IO Events** - WebSocket connections and messages
- ✅ **External HTTP** - Outgoing HTTP/HTTPS requests

### Excluded from Tracing:
- ❌ `/health` endpoint
- ❌ `/favicon.ico`
- ❌ `/static/*` assets
- ❌ File system operations (too noisy)

## 🔧 Architecture

```
┌───────────────────┐
│  NEXUS V1 Backend      │
│  (Express App)    │
│                   │
│  ┌─────────────┐  │
│  │  Tracing    │  │
│  │  Config     │  │
│  └──────┬──────┘  │
│         │         │
│         │ OTLP/HTTP
│         │ (Port 4318)
└─────────┼─────────┘
          │
          ▼
┌─────────────────────┐
│  AI Toolkit         │
│  OTLP Collector     │
│  (localhost:4318)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  VS Code            │
│  Trace Viewer       │
│  (AI Toolkit)       │
└─────────────────────┘
```

## 🚀 Advanced Features

### Manual Instrumentation

If you need custom spans:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('NEXUS V1-custom');

async function processData(userId: string) {
  const span = tracer.startSpan('process-user-data');
  span.setAttribute('user.id', userId);

  try {
    // Your business logic
    const result = await someOperation();
    span.setAttribute('result.count', result.length);
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### Custom Attributes

Add context to auto-instrumented spans:

```typescript
import { context, trace } from '@opentelemetry/api';

// In your middleware or route handler
app.get('/api/users', (req, res) => {
  const currentSpan = trace.getActiveSpan();
  currentSpan?.setAttribute('user.role', req.user?.role);
  currentSpan?.setAttribute('request.query.limit', req.query.limit);

  // ... rest of your code
});
```

## 🔍 Troubleshooting

### Problem: No traces appearing

**Solution 1:** Check collector status
- Open AI Toolkit in VS Code
- Verify "Collector Status: Running"

**Solution 2:** Test endpoint
```bash
curl http://localhost:4318/v1/traces
# Should return: 405 Method Not Allowed (this is correct!)
```

**Solution 3:** Check logs
Look for initialization message in server logs:
```
🔭 OpenTelemetry tracing initialized successfully
```

### Problem: Application won't start

**Check for:** Import errors or missing dependencies

**Solution:**
```bash
cd server
npm install
npm run build
```

The tracing system has graceful degradation - if it fails, the app will continue:
```
❌ Error initializing OpenTelemetry: [error details]
⚠️  Application will continue without tracing
```

## 📚 Key Files Modified

| File | Purpose | Status |
|------|---------|--------|
| `server/src/config/tracing.ts` | OpenTelemetry configuration | ✅ Enhanced |
| `server/.env.example` | Environment template | ✅ Updated |
| `server/TRACING.md` | Detailed documentation | ✅ Created |
| `TRACING_SETUP_SUMMARY.md` | Quick reference (this file) | ✅ Created |

## 🎓 Best Practices

1. ✅ **Always start collector first** - Before running your app
2. ✅ **Use environment variables** - Don't hardcode endpoints
3. ✅ **Let auto-instrumentation work** - Only add manual spans when needed
4. ✅ **Add meaningful attributes** - Help with debugging
5. ⚠️ **Don't trace PII** - Avoid logging sensitive user data
6. ⚠️ **Sample in production** - High-traffic apps need sampling

## 🔗 Resources

- **Detailed Guide:** `server/TRACING.md`
- **Configuration:** `server/src/config/tracing.ts`
- **OpenTelemetry Docs:** https://opentelemetry.io/docs/languages/js/
- **AI Toolkit:** https://github.com/microsoft/vscode-ai-toolkit

## ✨ Next Steps

1. Start the AI Toolkit trace collector
2. Run the server (`npm run dev`)
3. Make some API requests
4. View traces in AI Toolkit viewer
5. Explore span details and performance metrics

---

**Status:** ✅ Tracing fully configured and ready to use
**Collector:** AI Toolkit OTLP (http://localhost:4318)
**Viewer:** VS Code AI Toolkit Extension
**Documentation:** Complete

