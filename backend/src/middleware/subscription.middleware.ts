import type { NextFunction, Request, Response } from 'express-serve-static-core';

import { User } from '../models/User';
import { logger } from '../utils/logger';

export const requireSubscription = (requiredPlan?: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!(req as any).user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await User.findById((req as any).user.id);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.role === 'god' || user.role === 'admin' || user.role === 'dev') {
        return next();
      }

      if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
        return res.status(403).json({
          error: 'Subscription required',
          message: 'Active subscription is required to access this resource.',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }

      // If a specific plan is required, check for it (logic tailored to however you map plans)
      if (requiredPlan && user.subscriptionPlan !== requiredPlan) {
        // Simplistic check - in reality, you'd likely compare tier levels
        // return res.status(403).json({ error: `Plan ${requiredPlan} required` });
      }

      next();
    } catch (error) {
      logger.error(error, 'Subscription middleware error');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};
