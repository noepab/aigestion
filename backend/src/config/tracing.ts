import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK, resources } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Configure diagnostic logger for development
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

// Create trace exporter only if an endpoint is defined; otherwise, skip exporting
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
      headers: {},
      timeoutMillis: 15000,
    })
  : null;

// Configure resource attributes using resourceFromAttributes
const resource = resources.resourceFromAttributes({
  'service.name': process.env.OTEL_SERVICE_NAME || 'NEXUS V1-backend',
  'service.version': process.env.npm_package_version || '1.0.0',
  'deployment.environment': process.env.NODE_ENV || 'development',
});

const sdk = new NodeSDK({
  resource,
  spanProcessors: traceExporter ? [new BatchSpanProcessor(traceExporter)] : [],
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable noisy instrumentations
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      // Enable HTTP/Express tracing
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: req => {
          // Ignore health check and static assets
          return (
            req.url?.includes('/health') ||
            req.url?.includes('/favicon.ico') ||
            req.url?.includes('/static/') ||
            false
          );
        },
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      // Enable MongoDB tracing
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
      // Enable Socket.IO if available
      '@opentelemetry/instrumentation-socket.io': {
        enabled: true,
      },
    }),
  ],
});

// Initialize the SDK with proper error handling
try {
  sdk.start();
  console.log('\u{1F52D} OpenTelemetry tracing initialized successfully');
  if (traceExporter) {
    console.log(`\u{1F4E1} Sending traces to: ${otlpEndpoint}`);
  } else {
    console.log('\u{1F4E1} OTLP exporter disabled (no OTEL_EXPORTER_OTLP_ENDPOINT set)');
  }
} catch (error) {
  console.error('\u{274C} Error initializing OpenTelemetry:', error);
  // Don't crash the app if tracing fails
  console.warn('\u{26A0}\u{FE0F}  Application will continue without tracing');
}

// Graceful shutdown with proper cleanup
const shutdownTracing = async () => {
  try {
    await sdk.shutdown();
    console.log('\u{2705} OpenTelemetry shutdown completed');
  } catch (error) {
    console.error('\u{274C} Error during OpenTelemetry shutdown:', error);
  }
};

process.on('SIGTERM', async () => {
  await shutdownTracing();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownTracing();
  process.exit(0);
});

// Export for manual instrumentation if needed
export { sdk };
