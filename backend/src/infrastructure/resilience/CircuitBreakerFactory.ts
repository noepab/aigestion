import CircuitBreaker = require('opossum');
import { logger } from '../../utils/logger';

export interface CircuitBreakerConfig {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  name?: string;
  rollingCountTimeout?: number;
  volumeThreshold?: number;
}

export class CircuitBreakerFactory {
  private static readonly DEFAULT_CONFIG = {
    timeout: 5000, // 5 seconds
    errorThresholdPercentage: 50,
    resetTimeout: 10000, // 10 seconds
  };

  /**
   * Creates a new Circuit Breaker for a given function.
   * @param action The function to wrap
   * @param config Configuration overrides
   */
  public static create<TI extends unknown[], TR>(
    action: (...args: TI) => Promise<TR>,
    config: CircuitBreakerConfig = {}
  ): any {
    const options = {
      ...this.DEFAULT_CONFIG,
      ...config,
    };

    const breaker = new CircuitBreaker(action, options);

    breaker.on('open', () => {
      logger.warn(`[CircuitBreaker] OPEN: ${options.name || 'Anonymous'}`);
    });

    breaker.on('halfOpen', () => {
      logger.info(`[CircuitBreaker] HALF-OPEN: ${options.name || 'Anonymous'}`);
    });

    breaker.on('close', () => {
      logger.info(`[CircuitBreaker] CLOSE: ${options.name || 'Anonymous'}`);
    });

    breaker.on('fallback', (_result: any) => {
      logger.warn(`[CircuitBreaker] FALLBACK: ${options.name || 'Anonymous'}`);
    });

    // Don't log every failure to avoid noise, let the caller handle errors.
    // However, if the breaker is open, future calls fail fast.

    return breaker;
  }
}
