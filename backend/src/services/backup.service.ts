import crypto from 'crypto';
import fs, { promises as fsPromises } from 'fs';
import { inject, injectable } from 'inversify';
import path from 'path';

import { logger } from '../utils/logger';
import { GoogleDriveService } from './google/google-drive.service';
const mime = require('mime-types');

@injectable()
export class BackupService {
  constructor(@inject(GoogleDriveService) private googleDriveService: GoogleDriveService) {}

  /**
   * Main backup function
   * @param sourceDir Absolute path to local directory
   * @param rootTargetFolder Name of the root folder in Drive (e.g. "Backups")
   */
  async backupDirectory(sourceDir: string, rootTargetFolder = 'AIGestion_Backups') {
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
        if (
          entry === 'node_modules' ||
          entry === '.git' ||
          entry === '.DS_Store' ||
          entry === 'dist'
        ) {
          continue;
        }

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

  /**
   * Restore a backup from Drive to local file system
   * @param targetDir Local directory to restore to
   * @param rootSourceFolder Name of the root folder in Drive
   */
  async restoreDirectory(targetDir: string, rootSourceFolder = 'AIGestion_Backups') {
    logger.info(`Starting restore from ${rootSourceFolder} to ${targetDir}`);

    if (!fs.existsSync(targetDir)) {
      await fsPromises.mkdir(targetDir, { recursive: true });
    }

    try {
      // Find root backup folder
      const rootId = await this.googleDriveService.findFolder(rootSourceFolder, 'root');
      if (!rootId) {
        throw new Error(`Remote backup folder not found: ${rootSourceFolder}`);
      }

      await this.downloadMetadata(targetDir, rootId);
      logger.info('Restore completed successfully');
    } catch (error) {
      logger.error('Restore failed:', error);
      throw error;
    }
  }

  private async downloadMetadata(localPath: string, driveFolderId: string) {
    const contents = await this.googleDriveService.listFolderContents(driveFolderId);

    for (const item of contents) {
      const localItemPath = path.join(localPath, item.name);

      if (item.mimeType === 'application/vnd.google-apps.folder') {
        // It's a folder
        if (!fs.existsSync(localItemPath)) {
          await fsPromises.mkdir(localItemPath, { recursive: true });
        }
        await this.downloadMetadata(localItemPath, item.id);
      } else {
        // It's a file
        await this.restoreFile(localItemPath, item.id, item.localHash);
      }
    }
  }

  private async restoreFile(filePath: string, fileId: string, remoteHash?: string) {
    try {
      // Check if local file exists and matches hash
      if (fs.existsSync(filePath) && remoteHash) {
        const localHash = await this.calculateHash(filePath);
        if (localHash === remoteHash) {
          logger.debug(`Skipping ${filePath} (matching hash)`);
          return;
        }
      }

      logger.info(`Downloading to ${filePath}...`);
      await this.googleDriveService.downloadFile(fileId, filePath);
    } catch (err) {
      logger.error(`Failed to restore file ${filePath}:`, err);
    }
  }
}
