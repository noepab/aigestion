import type Stripe from 'stripe';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { CircuitBreakerFactory } from '../infrastructure/resilience/CircuitBreakerFactory';
import { logger } from '../utils/logger';

@Service()
export class StripeService {
  private _stripe: Stripe | undefined;

  // Circuit Breakers
  private createCustomerBreaker: any;
  private createSessionBreaker: any;
  private createPortalBreaker: any;

  private get stripe(): Stripe {
    if (!this._stripe) {
      if (!env.STRIPE_SECRET_KEY) {
        logger.warn('Stripe Secret Key is missing. StripeService will not function correctly.');
      }
      // Lazy load the SDK
      const StripeClass = require('stripe');
      this._stripe = new StripeClass(env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2022-11-15', // Use a fixed API version
        typescript: true,
      });
    }
    return this._stripe as Stripe;
  }

  constructor() {
    // Initialize Circuit Breakers - Note: These lambdas will access 'this.stripe' on execution, triggering lazy load of SDK.
    this.createCustomerBreaker = CircuitBreakerFactory.create(
      (email: string, name: string) => this.stripe.customers.create({ email, name }),
      { name: 'Stripe.createCustomer' }
    );

    this.createSessionBreaker = CircuitBreakerFactory.create(
      (customerId: string, priceId: string, successUrl: string, cancelUrl: string) =>
        this.stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      { name: 'Stripe.createSubscriptionCheckoutSession' }
    );

    this.createPortalBreaker = CircuitBreakerFactory.create(
      (customerId: string, returnUrl: string) =>
        this.stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl }),
      { name: 'Stripe.createPortalSession' }
    );
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.createCustomerBreaker.fire(email, name);
      logger.info(`Stripe customer created: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error(error, 'Error creating Stripe customer');
      throw error;
    }
  }

  /**
   * Create a checkout session for a subscription
   */
  async createSubscriptionCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.createSessionBreaker.fire(customerId, priceId, successUrl, cancelUrl);
      return session;
    } catch (error) {
      logger.error(error, 'Error creating checkout session');
      throw error;
    }
  }

  /**
   * Create a customer portal session
   */
  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    return this.createPortalBreaker.fire(customerId, returnUrl);
  }

  /**
   * Construct and verify a webhook event
   */
  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe Webhook Secret is missing');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  }

  /**
   * Retrieve a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  /**
   * Report usage for metered billing
   * Uses the Usage Records API (Stripe)
   */
  async reportUsage(subscriptionItemId: string, quantity: number): Promise<Stripe.UsageRecord> {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      );
      logger.info(`Stripe usage reported: ${quantity} units for ${subscriptionItemId}`);
      return usageRecord;
    } catch (error) {
      logger.error(error, `Error reporting usage to Stripe for ${subscriptionItemId}`);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
