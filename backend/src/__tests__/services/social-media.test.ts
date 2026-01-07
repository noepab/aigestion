import 'reflect-metadata';

import { jest } from '@jest/globals';
import axios from 'axios';
import { Container } from 'typedi';

import { env } from '../../config/env.schema';
import { InstagramService } from '../../services/instagram.service';
import { LinkedInService } from '../../services/linkedin.service';
import { TikTokService } from '../../services/tiktok.service';
import { XService } from '../../services/x.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Social Media Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InstagramService', () => {
    let service: InstagramService;

    beforeEach(() => {
      service = Container.get(InstagramService);
      // Mock env vars
      (env as any).INSTAGRAM_ACCESS_TOKEN = 'test-token';
      (env as any).INSTAGRAM_BUSINESS_ACCOUNT_ID = 'test-id';
    });

    it('should send DM', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });
      const result = await service.sendDM('recipient', 'message');
      expect(result).toEqual({ success: true });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          recipient: { id: 'recipient' },
          message: { text: 'message' },
        }),
        expect.anything()
      );
    });

    it('should publish photo', async () => {
      // Mock container creation
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'container-id' } });
      // Mock publish
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'media-id' } });

      const result = await service.publishPhoto('http://image.jpg', 'caption');
      expect(result).toBe('media-id');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('LinkedInService', () => {
    let service: LinkedInService;

    beforeEach(() => {
      service = Container.get(LinkedInService);
      (env as any).LINKEDIN_ACCESS_TOKEN = 'test-token';
      (env as any).LINKEDIN_ORGANIZATION_URN = '12345';
    });

    it('should share post', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { id: 'urn:li:share:123' } });
      const result = await service.sharePost('Hello LinkedIn');
      expect(result.id).toBe('urn:li:share:123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/ugcPosts'),
        expect.objectContaining({
          author: 'urn:li:organization:12345',
          specificContent: expect.objectContaining({
            'com.linkedin.ugc.ShareContent': expect.objectContaining({
              shareCommentary: { text: 'Hello LinkedIn' },
            }),
          }),
        }),
        expect.anything()
      );
    });
  });

  describe('TikTokService', () => {
    let service: TikTokService;

    beforeEach(() => {
      service = Container.get(TikTokService);
      (env as any).TIKTOK_ACCESS_TOKEN = 'test-token';
    });

    it('should initialize video upload', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { data: { upload_url: 'http://upload' } } });
      const result = await service.publishVideo('http://video.mp4', 'Title');
      expect(result).toBeDefined();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/post/publish/video/init/'),
        expect.objectContaining({
          post_info: expect.objectContaining({ title: 'Title' }),
        }),
        expect.anything()
      );
    });
  });

  describe('XService', () => {
    let service: XService;

    beforeEach(() => {
      service = Container.get(XService);
      (env as any).X_ACCESS_TOKEN = 'test-token';
    });

    it('should post tweet', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { data: { id: 'tweet-id' } } });
      const result = await service.postTweet('Hello X');
      expect(result.data.id).toBe('tweet-id');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/tweets'),
        expect.objectContaining({
          text: 'Hello X',
        }),
        expect.anything()
      );
    });
  });
});
