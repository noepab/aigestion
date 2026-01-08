import { z } from 'zod';

import { User } from '../models/User';
import { stripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';
import { BaseTool } from './base.tool';

export class StripeTool extends BaseTool<{ action: string; userId: string; priceId?: string }> {
  name = 'manage_subscription';
  description =
    'Manage user subscriptions, check status, or generate checkout/portal links. Use this tool when the user asks about their billing, subscription, or upgrading plan.';
  schema = z.object({
    action: z
      .enum(['get_status', 'create_checkout', 'create_portal'])
      .describe('The action to perform.'),
    userId: z.string().describe('The ID of the user context.'),
    priceId: z
      .string()
      .optional()
      .describe('The Stripe Price ID for checkout (required if action is create_checkout).'),
  });

  async execute(input: { action: string; userId: string; priceId?: string }): Promise<any> {
    const { action, userId, priceId } = input;
    logger.info(`[StripeTool] Executing action: ${action} for user: ${userId}`);

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      if (action === 'get_status') {
        return {
          status: user.subscriptionStatus || 'none',
          plan: user.subscriptionPlan || 'free',
          customerId: user.stripeCustomerId,
        };
      }

      if (action === 'create_checkout') {
        if (!user.stripeCustomerId) {
          // Auto-create customer if missing
          const customer = await stripeService.createCustomer(user.email, user.name);
          user.stripeCustomerId = customer.id;
          await user.save();
        }

        if (!priceId) {
          throw new Error('priceId is required for create_checkout action');
        }

        // Hardcoded return/cancel URLs for now - should be configurable
        const successUrl =
          process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/dashboard?success=true';
        const cancelUrl =
          process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/dashboard?canceled=true';

        const session = await stripeService.createSubscriptionCheckoutSession(
          user.stripeCustomerId,
          priceId,
          successUrl,
          cancelUrl,
        );
        return { url: session.url };
      }

      if (action === 'create_portal') {
        if (!user.stripeCustomerId) {
          throw new Error('User has no Stripe Customer ID, cannot create portal session.');
        }

        const returnUrl = process.env.STRIPE_RETURN_URL || 'http://localhost:3000/dashboard';
        const session = await stripeService.createPortalSession(user.stripeCustomerId, returnUrl);
        return { url: session.url };
      }

      throw new Error(`Invalid action: ${action}`);
    } catch (error: any) {
      logger.error(`[StripeTool] Failed: ${error.message}`);
      throw new Error(`Stripe action failed: ${error.message}`);
    }
  }
}
