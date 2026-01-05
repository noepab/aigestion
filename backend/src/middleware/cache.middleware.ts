import { NextFunction, Request, Response } from 'express';
import { cache } from '../utils/cacheManager';
import { logger } from '../utils/logger';

/**
 * Middleware to cache API responses
 * @param ttl Time to live in seconds (default 300)
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `api:${req.baseUrl}${req.path}`; // Use baseUrl + path so it works with routers

    try {
      // Try to get from cache
      const cached = await cache.get(key);
      if (cached) {
        logger.debug(`Cache hit for ${key}`);
        res.setHeader('X-Cache', 'HIT');
        res.json(cached);
        return;
      }

      // Intercept response to cache it
      const originalJson = res.json;

      res.json = function (body: any): Response<any, Record<string, any>> {
        // Restore original method
        res.json = originalJson;

        // Cache the response asynchronously if successful
        if (res.statusCode === 200) {
          cache.set(key, body, { ttl }).catch((err) => {
            logger.error(err, 'Error caching response:');
          });
        }

        return originalJson.call(this, body);
      };

      res.setHeader('X-Cache', 'MISS');
      next();
    } catch (error) {
      logger.error(error, 'Cache middleware error:');
      next();
    }
  };
};
