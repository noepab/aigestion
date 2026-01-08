import { Router } from 'express';

import { buildError, buildResponse } from '../common/response-builder';
import { User } from '../models/User';
import { stripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';

const stripeRouter = Router();

/**
 * @openapi
 * /stripe/checkout:
 *   post:
 *     summary: Create a Stripe Checkout Session
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceId:
 *                 type: string
 *               successUrl:
 *                 type: string
 *               cancelUrl:
 *                 type: string
 *               userId:
 *                 type: string
 *                 description: Optional user ID for testing
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 url:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
stripeRouter.post('/checkout', async (req: any, res: any) => {
  const requestId = req.requestId;
  try {
    const { priceId, successUrl, cancelUrl, userId } = req.body;
    // In a real app, userId comes from auth middleware: (req as any).user.id

    if (!priceId || !successUrl || !cancelUrl) {
      return res
        .status(400)
        .json(buildError('Missing required fields', 'VALIDATION_ERROR', 400, requestId));
    }

    // Default to a test user if auth is missing in this context
    const userToCharge = userId ? await User.findById(userId) : null;

    // Create customer if needed (simplified logic)
    let customerId = userToCharge?.stripeCustomerId;
    if (userToCharge && !customerId) {
      const customer = await stripeService.createCustomer(userToCharge.email, userToCharge.name);
      customerId = customer.id;
      userToCharge.stripeCustomerId = customerId;
      await userToCharge.save();
    }

    // Fallback for testing without DB
    if (!customerId) {
      // Create a guest customer just for the session if we don't have a user
      // Or throw error in strict mode. For now, we'll assume we need a user.
      return res
        .status(400)
        .json(buildError('User not found or no customer ID', 'USER_ERROR', 400, requestId));
    }

    const session = await stripeService.createSubscriptionCheckoutSession(
      customerId,
      priceId,
      successUrl,
      cancelUrl,
    );

    return res.json(buildResponse({ sessionId: session.id, url: session.url }, 200, requestId));
  } catch (error: any) {
    logger.error(error, 'Checkout session creation failed');
    return res.status(500).json(buildError(error.message, 'STRIPE_ERROR', 500, requestId));
  }
});

/**
 * @openapi
 * /stripe/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Bad request
 */
stripeRouter.post('/webhook', async (req: any, res: any) => {
  const sig = req.headers['stripe-signature'];
  const rawBody = req.rawBody;

  if (!sig || !rawBody) {
    return res.status(400).send('Webhook Error: Missing signature or body');
  }

  try {
    const event = stripeService.constructEvent(rawBody, sig as string); // Cast req.body to buffer? No, use rawBody string/buffer

    logger.info(`Stripe event received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        logger.info(`Checkout session completed for ${session.customer}`);
        // TODO: Update user subscription status
        if (session.customer) {
          const user = await User.findOne({ stripeCustomerId: session.customer });
          if (user) {
            user.subscriptionStatus = 'active';
            if (session.subscription) {
              user.subscriptionId = session.subscription as string;
            }
            await user.save();
            logger.info(`User ${user.email} subscription activated`);
          }
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        const user = await User.findOne({ subscriptionId: subscription.id });
        if (user) {
          user.subscriptionStatus = 'canceled';
          await user.save();
          logger.info(`User ${user.email} subscription canceled`);
        }
        break;

      default:
      // logger.info(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    logger.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default stripeRouter;
