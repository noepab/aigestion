import 'dotenv/config';

import fs from 'fs';
import path from 'path';

import { container, TYPES } from '../config/inversify.config';
import { BackupService } from '../services/backup.service';
import { logger } from '../utils/logger';

// Parse command line arguments
const args = process.argv.slice(2);
const sourceDir = args[0] || path.join(process.env.HOME || process.env.USERPROFILE || '', 'ale');

console.log('DEBUG: Script started');
console.log('DEBUG: Source Dir:', sourceDir);

async function runBackup() {
  console.log('DEBUG: runBackup started');
  // Check credentials
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath) {
    const resolvedPath = path.resolve(process.cwd(), credsPath);
    console.log('DEBUG: Checking credentials at:', resolvedPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(
        `WARNING: GOOGLE_APPLICATION_CREDENTIALS points to missing file: ${credsPath}. Unsetting to try default ADC.`,
      );
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else {
      console.log('DEBUG: Credentials file exists.');
    }
  } else {
    console.log('DEBUG: GOOGLE_APPLICATION_CREDENTIALS is not set.');
  }

  try {
    const msg = `Requested backup for directory: ${sourceDir}`;
    console.log(msg);
    logger.info(msg);

    const backupService = container.get<BackupService>(TYPES.BackupService);
    await backupService.backupDirectory(sourceDir);

    console.log('Backup process finished.');
    logger.info('Backup process finished.');
  } catch (error) {
    logger.error('Backup process failed with error:', error);
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

runBackup();
