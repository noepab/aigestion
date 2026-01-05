// Sentry integration for NEXUS V1 (frontend example)
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,

  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

// Add this import at the top of your main entry file (e.g., main.tsx or index.tsx)
// import './sentry';

