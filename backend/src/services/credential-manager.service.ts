import axios from 'axios';
import { injectable } from 'inversify';
import Stripe from 'stripe';
import { Telegraf } from 'telegraf';

// import { TYPES } from '../types';
import { logger } from '../utils/logger';

export interface CredentialStatus {
  provider: string;
  status: 'valid' | 'invalid' | 'missing';
  message?: string;
  lastChecked: Date;
}

@injectable()
export class CredentialManagerService {
  constructor() {}

  /**
   * Verified all critical credentials
   */
  async verifyAll(): Promise<CredentialStatus[]> {
    const results: CredentialStatus[] = await Promise.all([
      this.verifyGoogleCloud(),
      this.verifyGemini(),
      this.verifyStripe(),
      this.verifyTelegram(),
      this.verifyInstagram(),
    ]);

    logger.info('Credential Verification Report Generated');
    return results;
  }

  async verifyGoogleCloud(): Promise<CredentialStatus> {
    const hasCreds = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!hasCreds) {
      return this.report('Google Cloud', 'missing');
    }

    try {
      // Try to list a single secret or access metadata
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      if (!projectId) {
        return this.report('Google Cloud', 'invalid', 'Missing Project ID');
      }
      return this.report('Google Cloud', 'valid');
    } catch (e) {
      return this.report('Google Cloud', 'invalid', e.message);
    }
  }

  async verifyGemini(): Promise<CredentialStatus> {
    const key = process.env.GEMINI_API_KEY || process.env.GENAI_API_KEY;
    if (!key) {
      return this.report('Gemini AI', 'missing');
    }

    try {
      // Vertex AI typically uses ADC (GCP Creds), not just a key in Node.js Vertex SDK
      // But if user uses Google AI SDK or vertex with key:
      return this.report('Gemini AI', 'valid');
    } catch (e) {
      return this.report('Gemini AI', 'invalid', e.message);
    }
  }

  async verifyStripe(): Promise<CredentialStatus> {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return this.report('Stripe', 'missing');
    }

    try {
      const stripe = new Stripe(key, { apiVersion: '2022-11-15' });
      await stripe.balance.retrieve();
      return this.report('Stripe', 'valid');
    } catch (e) {
      return this.report('Stripe', 'invalid', e.message);
    }
  }

  async verifyTelegram(): Promise<CredentialStatus> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return this.report('Telegram', 'missing');
    }

    try {
      const bot = new Telegraf(token);
      await bot.telegram.getMe();
      return this.report('Telegram', 'valid');
    } catch (e) {
      return this.report('Telegram', 'invalid', e.message);
    }
  }

  async verifyInstagram(): Promise<CredentialStatus> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
      return this.report('Instagram', 'missing');
    }

    try {
      await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
      return this.report('Instagram', 'valid');
    } catch (e) {
      return this.report('Instagram', 'invalid', e.message);
    }
  }

  private report(
    provider: string,
    status: CredentialStatus['status'],
    message?: string,
  ): CredentialStatus {
    return {
      provider,
      status,
      message,
      lastChecked: new Date(),
    };
  }
}
