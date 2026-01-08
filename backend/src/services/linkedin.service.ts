import axios from 'axios';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class LinkedInService {
  private readonly baseUrl = 'https://api.linkedin.com/v2';

  /**
   * Share a text post to LinkedIn Organization or Personal Profile
   * @param text Content of the post
   * @param visibility 'PUBLIC' or 'CONNECTIONS'
   */
  async sharePost(text: string, visibility: 'PUBLIC' | 'CONNECTIONS' = 'PUBLIC'): Promise<any> {
    if (!env.LINKEDIN_ACCESS_TOKEN || !env.LINKEDIN_ORGANIZATION_URN) {
      logger.warn(
        'LinkedIn credentials missing (LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORGANIZATION_URN)',
      );
      return { success: false, error: 'Configuration missing' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/ugcPosts`,
        {
          author: `urn:li:organization:${env.LINKEDIN_ORGANIZATION_URN}`,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: text,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': visibility,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
        },
      );

      logger.info(`LinkedIn post shared: ${response.data.id}`);
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error sharing to LinkedIn');
      throw error;
    }
  }
}
