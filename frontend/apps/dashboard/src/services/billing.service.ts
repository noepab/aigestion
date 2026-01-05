import api from './api';

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

export interface PortalResponse {
  url: string;
}

export const BillingService = {
  createCheckoutSession: async (priceId: string): Promise<CheckoutResponse> => {
    const response = await api.post('/billing/checkout', { priceId });
    return response.data;
  },

  createPortalSession: async (): Promise<PortalResponse> => {
    const response = await api.post('/billing/portal', {});
    return response.data;
  },
};
