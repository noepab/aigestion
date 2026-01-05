import { logger } from './logger';

/**
 * Apply indexes to Mongoose models
 */
export async function applyIndexes(models: Record<string, any>) {
  const results: Record<string, boolean> = {};

  for (const [name, model] of Object.entries(models)) {
    try {
      if (model.ensureIndexes) {
        await model.ensureIndexes();
        logger.info(`Indexes applied for model: ${name}`);
        results[name] = true;
      } else {
        logger.warn(`Model ${name} does not have ensureIndexes method`);
        results[name] = false;
      }
    } catch (error) {
      logger.error(error, `Failed to apply indexes for model: ${name}`);
      results[name] = false;
    }
  }

  return results;
}
