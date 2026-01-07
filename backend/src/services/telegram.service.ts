import { Telegraf } from 'telegraf';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class TelegramService {
  private bot: Telegraf | null = null;
  private defaultChatId: string | undefined;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (env.TELEGRAM_BOT_TOKEN) {
      try {
        this.bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
        this.defaultChatId = env.TELEGRAM_CHAT_ID;
        logger.info('Telegram Bot initialized');
      } catch (error) {
        logger.error('Failed to initialize Telegram Bot', error);
      }
    } else {
      logger.warn('TELEGRAM_BOT_TOKEN not provided. Telegram notifications disabled.');
    }
  }

  /**
   * Send a text message to a chat
   * @param chatId Optional chat ID. If not provided, uses the default env CHAT_ID.
   * @param message Message content
   */
  async sendMessage(message: string, chatId?: string | number): Promise<void> {
    const targetChatId = chatId || this.defaultChatId;

    if (!this.bot || !targetChatId) {
      logger.warn('Cannot send Telegram message: Bot not initialized or Chat ID missing');
      return;
    }

    try {
      await this.bot.telegram.sendMessage(targetChatId, message);
      logger.info(`Telegram message sent to ${targetChatId}`);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error sending Telegram message');
    }
  }

  /**
   * Send a video file to a chat
   */
  async sendVideo(videoPath: string, caption?: string, chatId?: string | number): Promise<void> {
    const targetChatId = chatId || this.defaultChatId;

    if (!this.bot || !targetChatId) {
      // logger warning handled by caller or implicit here
      return;
    }

    try {
      await this.bot.telegram.sendVideo(targetChatId, { source: videoPath }, { caption });
      logger.info(`Telegram video sent to ${targetChatId}`);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error sending Telegram video');
      throw error;
    }
  }
}
