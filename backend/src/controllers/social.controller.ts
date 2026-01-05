import { Request, Response } from 'express';
import axios from 'axios';
import { Container } from 'typedi';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktok.service';
import { XService } from '../services/x.service';
import { LinkedInService } from '../services/linkedin.service';
import { config } from '../config/index';

const FB_API_URL = config.whatsapp.apiUrl;

export class SocialController {
  // Publicar en Facebook Page
  static async publishPost(req: Request, res: Response): Promise<void> {
    try {
      const { message, link } = req.body;
      const pageId = process.env.FACEBOOK_PAGE_ID;
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !accessToken) {
        res.status(500).json({ error: 'Facebook credentials not configured' });
        return;
      }

      console.log(`🚀 Publishing to Facebook Page ${pageId}...`);

      const response = await axios.post(`${FB_API_URL}/${pageId}/feed`, {
        message,
        link,
        access_token: accessToken,
      });

      console.log('✅ Published successfully:', response.data);
      res.json({ success: true, postId: response.data.id });
    } catch (error: any) {
      console.error('❌ Error publishing to Facebook:', error.response?.data || error.message);
      res
        .status(500)
        .json({ error: 'Failed to publish to Facebook', details: error.response?.data });
    }
  }

  // Obtener Métricas de la Página
  static async getPageStats(_req: Request, res: Response): Promise<void> {
    try {
      const pageId = process.env.FACEBOOK_PAGE_ID;
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !accessToken) {
        // Mock data si no hay credenciales (para demo)
        res.json({
          followers: 1250,
          impressions: 4500,
          engagement: 8.5,
          mock: true,
        });
      }

      const response = await axios.get(`${FB_API_URL}/${pageId}`, {
        params: {
          fields: 'fan_count,rating_count,new_like_count,talking_about_count',
          access_token: accessToken,
        },
      });

      res.json(response.data);
    } catch (error: any) {
      console.error('❌ Error fetching FB stats:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }

  // Enviar Mensaje Directo Instagram
  static async sendInstagramDM(req: Request, res: Response): Promise<void> {
    try {
      const { recipientId, text } = req.body;
      const instagramService = Container.get(InstagramService) as any;
      const result = await instagramService.sendDM(recipientId, text);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to send Instagram DM' });
    }
  }

  // Publicar Tweet en X
  static async postTweet(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body as { text?: unknown };
      // Ensure we have a string; if not, coerce to string or reject
      if (typeof text !== 'string' || text.trim() === '') {
        res.status(400).json({ error: 'Invalid tweet text' });
        return;
      }
      const xService = Container.get(XService);
      const result = await xService.postTweet(text);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to post Tweet to X' });
    }
  }

  // Publicar Video en TikTok
  static async publishTikTokVideo(req: Request, res: Response): Promise<void> {
    try {
      const { videoUrl, title } = req.body;
      const tiktokService = Container.get(TikTokService);
      const result = await tiktokService.publishVideo(videoUrl, title);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to publish to TikTok' });
    }
  }

  // Publicar Post en LinkedIn
  static async publishLinkedInPost(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;
      const linkedinService = Container.get(LinkedInService) as any;
      const result = await linkedinService.sharePost(text);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to publish to LinkedIn' });
    }
  }
}
