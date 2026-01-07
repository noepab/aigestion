import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express-serve-static-core';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import RateLimitRedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
// @ts-ignore
import xssClean from 'xss-clean';

// Middleware to ensure every JSON response follows the standard API for
import { config } from './config/config';
import { setupSwagger } from './docs/swagger';
import { createGraphQLRouter } from './graphql/router';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import routes from './routes';
import mcpRouter from './routes/mcp.routes';
import { logger } from './utils/logger';

import { buildResponse } from './common/response-builder';
const app = express();



// Request Traceability
app.use(requestIdMiddleware);

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
  })
);
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = config.cors.origin;
      const isAllowed =
        !origin ||
        allowedOrigins === '*' ||
        (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Redis client for rate limiting store
const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(err => logger.error('Redis connection error:', err));

// Rate limiting middleware (15 min window, 100 requests per IP)
// Rate limiting middleware (15 min window, 100 requests per IP)
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;

const apiLimiter = rateLimit({
  store: isTest
    ? undefined // Use default MemoryStore for tests
    : new RateLimitRedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
if (!isTest) {
  app.use('/api/v1', apiLimiter);
}

// Security middlewares
app.use(hpp());
app.use(xssClean());

// Performance Middleware
app.use(
  compression({
    level: 6, // Equilibrium between speed and compression
    threshold: 1024, // Only compress responses above 1KB
  })
);

// Logging Middleware
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: (req: Request) => req.url === '/api/v1/health',
  })
);

// Request Parsing
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res: Response, buf: Buffer) => {
      if (req.originalUrl.includes('/stripe/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(cookieParser());

// Mount Routes
setupSwagger(app);

app.get('/api/v1/health', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const response = buildResponse({ status: 'healthy', uptime: process.uptime(), version: '1.0.0' }, 200, requestId);
  console.log('DEBUG: App.ts /health response:', JSON.stringify(response, null, 2));
  res.json(response);
});
app.use('/api/v1', routes);
app.use('/mcp', mcpRouter);
app.use(createGraphQLRouter());


// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await redisClient.disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await redisClient.disconnect();
  process.exit(0);
});

export { app };
