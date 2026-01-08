import axios from 'axios';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class InstagramService {
  private readonly baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Send a DM (Note: Requires specific permissions and usually only works for replying or business interactons)
   * This implementation assumes we have a valid access token.
   */
  async sendDM(recipientId: string, text: string): Promise<any> {
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      logger.warn('INSTAGRAM_ACCESS_TOKEN not configured');
      return { success: false, error: 'Configuration missing' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text },
        },
        {
          headers: {
            Authorization: `Bearer ${env.INSTAGRAM_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error sending Instagram DM');
      throw error;
    }
  }

  /**
   * Publish a photo to Instagram Business Account
   */
  async publishPhoto(imageUrl: string, caption: string): Promise<string> {
    if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      throw new Error('Instagram credentials not configured');
    }

    try {
      // Step 1: Create Container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: env.INSTAGRAM_ACCESS_TOKEN,
        },
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish Container
      const publishResponse = await axios.post(
        `${this.baseUrl}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`,
        {
          creation_id: containerId,
          access_token: env.INSTAGRAM_ACCESS_TOKEN,
        },
      );

      logger.info(`Instagram photo published: ${publishResponse.data.id}`);
      return publishResponse.data.id;
    } catch (error: any) {
      logger.error(
        { error: error.response?.data || error.message },
        'Error publishing to Instagram',
      );
      throw error;
    }
  }

  /**
   * Get basic account insights
   */
  async getInsights(): Promise<any> {
    if (!env.INSTAGRAM_ACCESS_TOKEN || !env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      return null;
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/${env.INSTAGRAM_BUSINESS_ACCOUNT_ID}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views',
            period: 'day',
            access_token: env.INSTAGRAM_ACCESS_TOKEN,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error fetching Instagram insights');
      return null;
    }
  }
}
