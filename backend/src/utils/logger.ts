// src/utils/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { requestContext } from './context';

// Define a custom format that adds requestId from AsyncLocalStorage if present
const requestIdFormat = winston.format(info => {
  const store = requestContext.getStore?.();
  if (store) {
    info.requestId = store.get('requestId');
  }
  return info;
});

const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    requestIdFormat(),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Helper to support both (msg, meta) and (meta, msg) signatures
function wrap(method: keyof winston.Logger) {
  return (arg1: any, arg2?: any, ...rest: any[]) => {
    if (typeof arg1 === 'string' && arg2 && typeof arg2 === 'object') {
      // (msg, meta)
      (winstonLogger as any)[method](arg1, arg2, ...rest);
    } else if (typeof arg1 === 'object' && typeof arg2 === 'string') {
      // (meta, msg)
      (winstonLogger as any)[method](arg2, arg1, ...rest);
    } else {
      // fallback
      (winstonLogger as any)[method](arg1, arg2, ...rest);
    }
  };
}

export const logger = {
  info: wrap('info'),
  error: wrap('error'),
  warn: wrap('warn'),
  debug: wrap('debug'),
  verbose: wrap('verbose'),
  silly: wrap('silly'),
};

export default logger;
