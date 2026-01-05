import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware that logs the feature flags attached to the request.
 * It also pushes the flags to Sentry (if Sentry is configured) so they appear in
 * the context of each error/performance event.
 */
export const flagAnalytics = (req: Request, _res: Response, next: NextFunction) => {
  const flags = (req as any).flags;
  if (flags) {
    logger.info({ flags, path: req.path, method: req.method }, 'Feature flags attached to request');
    // If Sentry is initialized, add flags to the current scope
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/node');
      if (Sentry && typeof Sentry.setContext === 'function') {
        Sentry.setContext('featureFlags', flags);
      }
    } catch (_) {
      // Sentry not installed or not initialized – ignore silently
    }
  }
  next();
};
