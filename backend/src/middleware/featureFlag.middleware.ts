// Feature Flag middleware
import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { buildFeatureFlags, FeatureFlags } from '../utils/featureFlags';

declare global {
  namespace Express {
    interface Request {
      /** All feature flags resolved for this request */
      flags?: FeatureFlags;
    }
  }
}

/**
 * Middleware that builds the FeatureFlags object for every request and
 * attaches it to `req.flags`. It must run after `cookieParser` so that
 * `req.cookies` is populated.
 */
export const featureFlagMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.flags = buildFeatureFlags(req);
  next();
};
