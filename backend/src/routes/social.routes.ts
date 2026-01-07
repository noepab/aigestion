import { Router } from 'express';

import { SocialController } from '../controllers/social.controller';

const router = Router();

// Facebook Routes
router.post('/facebook/publish', SocialController.publishPost);
router.get('/facebook/stats', SocialController.getPageStats);

// Instagram Routes
router.post('/instagram/dm', SocialController.sendInstagramDM);

// X (Twitter) Routes
router.post('/x/tweet', SocialController.postTweet);

// TikTok Routes
router.post('/tiktok/publish', SocialController.publishTikTokVideo);

// LinkedIn Routes
router.post('/linkedin/post', SocialController.publishLinkedInPost);

export default router;
