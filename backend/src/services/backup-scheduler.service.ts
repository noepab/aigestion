import { inject, injectable } from 'inversify';
import path from 'path';

import { TYPES } from '../types';
import { logger } from '../utils/logger';
import { BackupService } from './backup.service';
import { TelegramService } from './telegram.service';

@injectable()
export class BackupSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  // Default: run every 24 hours
  private readonly INTERVAL_MS = 24 * 60 * 60 * 1000;
  // Default source: User's 'ale' folder (adjust as needed)
  private readonly SOURCE_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', 'ale');

  constructor(
    @inject(TYPES.BackupService) private backupService: BackupService,
    @inject(TYPES.TelegramService) private telegramService: TelegramService,
  ) {}

  public start() {
    logger.info(
      'BackupSchedulerService started. First backup will run immediately (async) and then daily.',
    );

    // Run initial backup after a short delay to let server startup finish
    setTimeout(() => this.runBackupJob(), 10000);

    this.timer = setInterval(() => {
      this.runBackupJob();
    }, this.INTERVAL_MS);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runBackupJob() {
    logger.info(`Starting scheduled backup for ${this.SOURCE_DIR}`);
    try {
      await this.backupService.backupDirectory(this.SOURCE_DIR);
      const msg = `✅ Backup Successful: ${this.SOURCE_DIR}`;
      logger.info(msg);
      // Optional: don't spam success message to telegram every day unless requested
      // await this.telegramService.sendMessage(msg);
    } catch (error: any) {
      const msg = `🚨 Backup FAILED: ${error.message}`;
      logger.error(msg, error);
      try {
        await this.telegramService.sendMessage(msg);
      } catch (tgError) {
        logger.error('Failed to send backup failure alert to Telegram', tgError);
      }
    }
  }
}
