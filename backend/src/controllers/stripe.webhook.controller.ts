import { Request, Response } from 'express';
import { controller, httpPost, request, response } from 'inversify-express-utils';
import { inject } from 'inversify';
import { StripeService } from '../services/stripe.service';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

@controller('/api/v1/stripe/webhook')
export class StripeWebhookController {
  constructor(@inject(StripeService) private stripeService: StripeService) { }

  @httpPost('/')
  async handleWebhook(@request() req: Request, @response() res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).send('Webhook Error: Missing stripe-signature');
    }

    let event: Stripe.Event;

    try {
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        logger.error('Webhook Error: Missing rawBody. parsing middleware configuration might be incorrect.');
        return res.status(400).send('Webhook Error: Missing rawBody');
      }

      // Use raw body for signature verification
      event = this.stripeService.constructEvent(rawBody, sig as string);
    } catch (err: any) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await this.handleCheckoutSessionCompleted(session);
          break;
        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionUpdated(subscriptionUpdated);
          break;
        case 'customer.subscription.deleted':
          const subscriptionDeleted = event.data.object as Stripe.Subscription;
          await this.handleSubscriptionDeleted(subscriptionDeleted);
          break;
        default:
          logger.info(`Unhandled event type ${event.type}`);
      }
      res.json({ received: true });
    } catch (error) {
      logger.error(error, 'Error processing webhook event');
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (!session.customer || !session.subscription) return;

    const user = await User.findOne({ email: session.customer_details?.email });
    if (user) {
      user.stripeCustomerId = session.customer as string;
      user.subscriptionId = session.subscription as string;
      user.subscriptionStatus = 'active';
      // Map price ID to plan name if needed, or store price ID
      // user.subscriptionPlan = ...
      await user.save();
      logger.info(`User ${user.email} subscription activated via checkout`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const user = await User.findOne({ stripeCustomerId: subscription.customer as string });
    if (user) {
      user.subscriptionStatus = subscription.status;
      user.subscriptionId = subscription.id;
      // Update plan info if changed
      await user.save();
      logger.info(`User ${user.email} subscription updated to ${subscription.status}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const user = await User.findOne({ stripeCustomerId: subscription.customer as string });
    if (user) {
      user.subscriptionStatus = 'canceled';
      user.subscriptionId = undefined;
      await user.save();
      logger.info(`User ${user.email} subscription canceled`);
    }
  }
}
