import { injectable, inject } from 'inversify';
import { encode } from 'gpt-tokenizer';
import { User } from '../models/User';
import { UsageRecord } from '../models/UsageRecord';
import { StripeService } from './stripe.service';
import { TYPES } from '../types';
import { logger } from '../utils/logger';

@injectable()
export class UsageService {
  constructor(@inject(TYPES.StripeService) private stripeService: StripeService) {}

  /**
   * Calculates token count for a text
   */
  public countTokens(text: string): number {
    if (!text) return 0;
    try {
      // gpt-tokenizer is compatible with most modern LLMs (BPE)
      return encode(text).length;
    } catch (error) {
      logger.warn('Token counting failed, using fallback estimate');
      return Math.ceil(text.length / 4); // Very rough fallback
    }
  }

  /**
   * Tracks and reports AI usage
   */
  public async trackUsage(params: {
    userId: string;
    provider: string;
    modelId: string;
    prompt: string;
    completion: string;
  }): Promise<void> {
    const promptTokens = this.countTokens(params.prompt);
    const completionTokens = this.countTokens(params.completion);
    const totalTokens = promptTokens + completionTokens;

    try {
      // 1. Save record to DB for internal auditing
      const record = new UsageRecord({
        userId: params.userId,
        provider: params.provider,
        modelId: params.modelId,
        promptTokens,
        completionTokens,
        totalTokens,
        costEstimate: this.estimateCost(params.modelId, promptTokens, completionTokens),
      });
      await record.save();

      // 2. Report to Stripe if user has a metered subscription
      const user = await User.findById(params.userId).select('+stripeSubscriptionItemId');
      if (user?.stripeSubscriptionItemId) {
        // Stripe usually bills in fixed units.
        // Example: 1 unit per 1,000 tokens.
        const units = Math.ceil(totalTokens / 1000);
        if (units > 0) {
          await this.stripeService.reportUsage(user.stripeSubscriptionItemId, units);
        }
      }

      logger.info(
        `[UsageService] Tracked ${totalTokens} tokens for user ${params.userId} (${params.modelId})`,
      );
    } catch (error) {
      logger.error(error, `[UsageService] Failed to track usage for user ${params.userId}`);
    }
  }

  /**
   * Simple cost estimator (Reflected in USD)
   */
  private estimateCost(modelId: string, promptTokens: number, completionTokens: number): number {
    const rates: Record<string, { prompt: number; completion: number }> = {
      'gemini-3.0-flash': { prompt: 0.1 / 1_000_000, completion: 0.3 / 1_000_000 },
      'gemini-1.5-flash-8b': { prompt: 0.03 / 1_000_000, completion: 0.09 / 1_000_000 },
      'claude-3-5-sonnet-20241022': { prompt: 3 / 1_000_000, completion: 15 / 1_000_000 },
    };

    const rate = rates[modelId] || rates['gemini-3.0-flash'];
    return promptTokens * rate.prompt + completionTokens * rate.completion;
  }
}
