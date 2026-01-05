import { container } from '../config/inversify.config';
import { BackupService } from '../services/backup.service';
import { logger } from '../utils/logger';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const sourceDir = args[0] || path.join(process.env.HOME || process.env.USERPROFILE || '', 'ale');

async function runBackup() {
  try {
    logger.info(`Requested backup for directory: ${sourceDir}`);

    const backupService = container.get(BackupService);
    await backupService.backupDirectory(sourceDir);

    logger.info('Backup process finished.');
  } catch (error) {
    logger.error('Backup process failed with error:', error);
    process.exit(1);
  }
}

runBackup();
