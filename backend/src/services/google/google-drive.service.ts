import fs from 'fs';
import { drive_v3,google } from 'googleapis';
import { injectable } from 'inversify';

import { logger } from '../../utils/logger';


@injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null;
  private readonly DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initializeClient();
  }

  private async initializeClient() {
    try {
      const auth = new google.auth.GoogleAuth({
        scopes: this.DRIVE_SCOPES,
      });
      const authClient = await auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient as any });
      logger.info('Google Drive client initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Drive client:', error);
      throw error;
    }
  }

  private async getDriveClient(): Promise<drive_v3.Drive> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.drive) {
      throw new Error('Google Drive client not initialized');
    }
    return this.drive;
  }

  /**
   * Ensures a folder path exists in Drive, creating missing folders.
   * Path should be relative, e.g. "Backups/Alejandro"
   * Returns the ID of the final folder.
   */
  async ensureFolder(folderPath: string, parentId = 'root'): Promise<string> {
    await this.getDriveClient();

    const parts = folderPath.split('/').filter(p => p.length > 0);
    let currentParentId = parentId;

    for (const part of parts) {
      const foundId = await this.findFolder(part, currentParentId);
      if (foundId) {
        currentParentId = foundId;
      } else {
        currentParentId = await this.createFolder(part, currentParentId);
      }
    }

    return currentParentId;
  }

  async findFolder(name: string, parentId: string): Promise<string | null> {
    const drive = await this.getDriveClient();
    try {
      const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive',
      });
      const files = res.data.files;
      if (files && files.length > 0) {
        return files[0].id || null;
      }
      return null;
    } catch (error) {
      logger.error(`Error finding folder ${name}:`, error);
      throw error;
    }
  }

  async createFolder(name: string, parentId: string): Promise<string> {
    const drive = await this.getDriveClient();
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };
      const file = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      logger.info(`Created folder ${name} (${file.data.id})`);
      return file.data.id!;
    } catch (error) {
      logger.error(`Error creating folder ${name}:`, error);
      throw error;
    }
  }

  /**
   * Uploads a file to Drive.
   * Checks for existing file with same name in parent.
   * If exists, updates it (if we want versioning) or overwrites?
   * For backup sync, usually we want to update content or replace.
   * Here we will search for existing file by name.
   */
  async uploadFile(localPath: string, fileName: string, parentId: string, mimeType: string, hash: string): Promise<void> {
    if (!this.drive) {throw new Error('Drive client not initialized');}

    // Check if file exists
    const existingFileId = await this.findFile(fileName, parentId);

    const requestBody = {
      name: fileName,
      parents: existingFileId ? undefined : [parentId], // Only set parent on create
      properties: {
        localHash: hash
      }
    };

    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(localPath),
    };

    try {
      if (existingFileId) {
        // Update
        await this.drive.files.update({
          fileId: existingFileId,
          requestBody: {
            properties: { localHash: hash } // Update hash
          },
          media: media,
        });
        logger.info(`Updated file ${fileName} (${existingFileId})`);
      } else {
        // Create
        await this.drive.files.create({
          requestBody: requestBody,
          media: media,
          fields: 'id',
        });
        logger.info(`Uploaded new file ${fileName}`);
      }
    } catch (error) {
      logger.error(`Error uploading file ${fileName}:`, error);
      throw error;
    }
  }

  async findFile(name: string, parentId: string): Promise<string | null> {
    if (!this.drive) {throw new Error('Drive client not initialized');}
    try {
      // Note: we don't restrict mimeType here, just name and parent
      const query = `name='${name}' and '${parentId}' in parents and trashed=false`;
      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, properties)',
      });
      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id || null;
      }
      return null;
    } catch (error) {
      // ignore or log
      return null;
    }
  }

  /**
   * Gets specific custom property (hash) of a file
   */
  async getFileHash(name: string, parentId: string): Promise<string | null> {
    if (!this.drive) {throw new Error('Drive client not initialized');}
    try {
      const query = `name='${name}' and '${parentId}' in parents and trashed=false`;
      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, properties)',
      });
      if (res.data.files && res.data.files.length > 0) {
        const file = res.data.files[0];
        return file.properties?.localHash || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Lists contents of a folder for restore purposes
   */
  async listFolderContents(folderId: string): Promise<{ id: string; name: string; mimeType: string; localHash?: string }[]> {
    if (!this.drive) {throw new Error('Drive client not initialized');}
    try {
      const query = `'${folderId}' in parents and trashed=false`;
      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, properties)',
        pageSize: 1000,
      });
      return (res.data.files || []).map(f => ({
        id: f.id!,
        name: f.name!,
        mimeType: f.mimeType!,
        localHash: f.properties?.localHash
      }));
    } catch (error) {
      logger.error(`Error listing folder contents for ${folderId}:`, error);
      throw error;
    }
  }

  /**
   * Downloads a file from Drive to local destination
   */
  async downloadFile(fileId: string, destinationPath: string): Promise<void> {
    if (!this.drive) {throw new Error('Drive client not initialized');}
    return new Promise((resolve, reject) => {
      this.drive!.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      )
        .then(res => {
          const dest = fs.createWriteStream(destinationPath);
          res.data
            .on('end', () => resolve())
            .on('error', err => reject(err))
            .pipe(dest);
        })
        .catch(err => reject(err));
    });
  }
}
