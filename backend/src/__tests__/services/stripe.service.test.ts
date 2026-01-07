import 'reflect-metadata';

import Stripe from 'stripe';

import { StripeService } from '../../services/stripe.service';

// Mock env before other imports
jest.mock('../../config/env.schema', () => ({
  env: {
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
    STRIPE_CURRENCY: 'usd',
  },
}));

jest.mock('stripe');

describe('StripeService', () => {
  let service: StripeService;
  let mockStripeInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Define the mock implementation for the Stripe class constructor
    mockStripeInstance = {
      customers: { create: jest.fn() },
      checkout: { sessions: { create: jest.fn() } },
      webhooks: { constructEvent: jest.fn() },
      subscriptions: { retrieve: jest.fn(), cancel: jest.fn() },
    };

    (Stripe as unknown as jest.Mock).mockImplementation(() => mockStripeInstance);

    service = new StripeService();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = { id: 'cus_123', email: 'test@example.com', name: 'Test User' };
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('test@example.com', 'Test User');

      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw error on failure', async () => {
      mockStripeInstance.customers.create.mockRejectedValue(new Error('Stripe error'));

      await expect(service.createCustomer('fail', 'fail')).rejects.toThrow('Stripe error');
    });
  });

  describe('createSubscriptionCheckoutSession', () => {
    it('should create a session', async () => {
      const mockSession = { id: 'sess_123', url: 'https://checkout.stripe.com/...' };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await service.createSubscriptionCheckoutSession(
        'cus_123',
        'price_123',
        'http://success',
        'http://cancel'
      );

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_123',
          mode: 'subscription',
          success_url: 'http://success',
        })
      );
      expect(result).toEqual(mockSession);
    });
  });
});
