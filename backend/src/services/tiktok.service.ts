import axios from 'axios';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class TikTokService {
  private readonly baseUrl = 'https://open.tiktokapis.com/v2';

  /**
   * Publish a video to TikTok
   * Note: Direct video upload via API is complex (init, upload, finish).
   * This implementation initiates the process or posts a video via URL if supported by specific endpoints,
   * otherwise it serves as a robust placeholder for the full flow.
   */
  async publishVideo(_videoUrl: string, title: string): Promise<any> {
    if (!env.TIKTOK_ACCESS_TOKEN) {
      logger.warn('TIKTOK_ACCESS_TOKEN not configured');
      return { success: false, error: 'Configuration missing' };
    }

    try {
      // Example implementation for v2 post usage
      // TikTok API typically requires uploading binary data.
      // This is a simplified "Direct Post" call structure for reference.

      const response = await axios.post(
        `${this.baseUrl}/post/publish/video/init/`,
        {
          post_info: {
            title: title,
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            // In a real implementation, you'd upload the file chunks here
          },
        },
        {
          headers: {
            Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      logger.info('TikTok video upload initialized');
      return response.data;
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error publishing to TikTok');
      throw error;
    }
  }
}
