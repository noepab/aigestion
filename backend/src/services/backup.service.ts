import { injectable, inject } from 'inversify';
import { logger } from '../utils/logger';
import { GoogleDriveService } from './google/google-drive.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';

@injectable()
export class BackupService {
  constructor(
    @inject(GoogleDriveService) private googleDriveService: GoogleDriveService
  ) { }

  /**
   * Main backup function
   * @param sourceDir Absolute path to local directory
   * @param rootTargetFolder Name of the root folder in Drive (e.g. "Backups")
   */
  async backupDirectory(sourceDir: string, rootTargetFolder: string = 'AIGestion_Backups') {
    logger.info(`Starting backup of ${sourceDir} to Drive folder: ${rootTargetFolder}`);

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory not found: ${sourceDir}`);
    }

    try {
      // Ensure root backup folder exists
      const rootId = await this.googleDriveService.ensureFolder(rootTargetFolder);

      // Start recursive sync
      await this.syncMetadata(sourceDir, rootId);

      logger.info('Backup completed successfully');
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  private async syncMetadata(localPath: string, parentDriveId: string) {
    const stats = fs.statSync(localPath);

    if (stats.isDirectory()) {
      const entries = fs.readdirSync(localPath);
      for (const entry of entries) {
        const entryPath = path.join(localPath, entry);
        // Ignore node_modules, .git, etc
        if (entry === 'node_modules' || entry === '.git' || entry === '.DS_Store' || entry === 'dist') continue;

        try {
          const entryStats = fs.statSync(entryPath);
          if (entryStats.isDirectory()) {
            // Ensure subdir exists in Drive
            const folderId = await this.googleDriveService.ensureFolder(entry, parentDriveId);
            // Recurse
            await this.syncMetadata(entryPath, folderId);
          } else {
            // It's a file, sync it
            await this.syncFile(entryPath, entry, parentDriveId);
          }
        } catch (err) {
          logger.warn(`Skipping entry ${entryPath} due to error:`, err);
        }
      }
    }
  }

  private async syncFile(filePath: string, fileName: string, parentId: string) {
    try {
      const hash = await this.calculateHash(filePath);
      const remoteHash = await this.googleDriveService.getFileHash(fileName, parentId);

      if (hash === remoteHash) {
        logger.debug(`Skipping ${fileName} (unchanged)`);
        return;
      }

      logger.info(`Syncing ${fileName}...`);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      await this.googleDriveService.uploadFile(filePath, fileName, parentId, mimeType, hash);
    } catch (err) {
      logger.error(`Failed to sync file ${fileName}:`, err);
    }
  }

  private calculateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const input = fs.createReadStream(filePath);

      input.on('error', reject);
      input.on('data', chunk => hash.update(chunk));
      input.on('close', () => resolve(hash.digest('hex')));
    });
  }
}
