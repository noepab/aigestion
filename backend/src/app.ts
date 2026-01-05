import express, { Request, Response } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import xssClean from 'xss-clean';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RateLimitRedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { config } from './config';
import { logger } from './utils/logger';
import { setupSwagger } from './docs/swagger';
import mcpRouter from './routes/mcp.routes';

import { requestIdMiddleware } from './middleware/requestId.middleware';

const app = express();
app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));


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
      if (!origin || config.cors.origin === '*' || origin === config.cors.origin) {
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
const apiLimiter = rateLimit({
  store: new RateLimitRedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args)
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api/v1', apiLimiter);

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
    verify: (req: any, _res, buf: Buffer) => {
      if (req.originalUrl.includes('/stripe/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(requestIdMiddleware);





import { createGraphQLRouter } from './graphql/router';

// Mount Routes
setupSwagger(app);
app.use('/api/v1', routes);
app.use('/mcp', mcpRouter);
app.use(createGraphQLRouter());

// Middleware to ensure every JSON response follows the standard API format
import { buildResponse } from './common/response-builder';
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    // If body already looks like a standard response, leave it
    if (body && typeof body === 'object' && 'status' in body && 'data' in body) {
      return originalJson(body);
    }
    const requestId = (req as any).requestId;
    const timestamp = new Date().toISOString();
    const wrapped = buildResponse(body, 200, requestId);
    // Ensure timestamp is present (buildResponse already adds it)
    // Overwrite timestamp just in case
    wrapped.timestamp = timestamp;
    return originalJson(wrapped);
  };
  next();
});

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
