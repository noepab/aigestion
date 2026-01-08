import axios from 'axios';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class XService {
  private readonly baseUrl = 'https://api.twitter.com/2';

  /**
   * Post a tweet using Twitter API v2
   */
  async postTweet(text: string): Promise<any> {
    if (!env.X_ACCESS_TOKEN) {
      // Note: For v2, typically OAuth 2.0 User Context (Access Token) is needed
      logger.warn('X_ACCESS_TOKEN not configured');
      return { success: false, error: 'Configuration missing' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/tweets`,
        {
          text: text,
        },
        {
          headers: {
            Authorization: `Bearer ${env.X_ACCESS_TOKEN}`, // Assuming OAuth2 Bearer Token for User Context
            'Content-Type': 'application/json',
          },
        },
      );

      logger.info(`Tweet posted: ${response.data.data?.id}`);
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error posting to X');
      throw error;
    }
  }
}
