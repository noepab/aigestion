// Sentry advanced configuration example
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    // Removed ts-ignore; BrowserTracing works without it
    new BrowserTracing({
      // You can customize routing instrumentation here
    }),
  ],
  tracesSampleRate: 1.0, // Adjust for production
  environment: process.env.NODE_ENV,
  release: process.env.REACT_APP_RELEASE || undefined,
  beforeSend(event) {
    // Example: filter out specific errors
    if (
      event.exception?.values?.[0].type === 'IgnoredError'
    ) {
      return null;
    }
    return event;
  },
  // Example: attach user context
  initialScope: {
    user: {
      id: 'user_id', // Replace with dynamic user id
      email: 'user@example.com', // Replace with dynamic user email
    },
  },
});

// To use: import './sentry.advanced' in your entrypoint
