import { AsyncLocalStorage } from 'async_hooks';

/**
 * Storage for request context (e.g., Request-ID)
 */
export const requestContext = new AsyncLocalStorage<Map<string, string>>();
