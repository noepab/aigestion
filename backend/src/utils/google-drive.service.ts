import * as fs from 'node:fs';

import { drive_v3, google } from 'googleapis';

import { env } from '../config/env.schema';
import type { DriveFile, DriveUploadOptions } from '../types/google-cloud.types';
import { logger } from './logger';

/**
 * Servicio para Google Drive API
 * Gestión de archivos en Google Drive
 */
export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = this.initialize();
  }

  /**
   * Obtiene las credenciales para la cuenta de empresa
   */
  private getBusinessCredentials() {
    return {
      clientId: env.YOUTUBE_BUSINESS_CLIENT_ID || env.GMAIL_PROFESSIONAL_CLIENT_ID,
      clientSecret: env.YOUTUBE_BUSINESS_CLIENT_SECRET || env.GMAIL_PROFESSIONAL_CLIENT_SECRET,
      refreshToken: env.YOUTUBE_BUSINESS_REFRESH_TOKEN || env.GMAIL_PROFESSIONAL_REFRESH_TOKEN,
    };
  }

  /**
   * Crea o devuelve un cliente de Drive autenticado (Cached)
   */
  private async getDriveClient(): Promise<drive_v3.Drive> {
    if (this.drive) {
      return this.drive;
    }

    // Si hay credenciales de cuenta de servicio, priorizarlas para procesos de sistema
    if (env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(env.GOOGLE_APPLICATION_CREDENTIALS)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      this.drive = google.drive({ version: 'v3', auth });
      return this.drive;
    }

    // De lo contrario, intentar OAuth2 con la cuenta Business
    const creds = this.getBusinessCredentials();
    if (creds.clientId && creds.clientSecret && creds.refreshToken) {
      const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
      oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
      this.drive = google.drive({ version: 'v3', auth: oauth2Client });
      return this.drive;
    }

    throw new Error(
      'No se encontraron credenciales válidas para Google Drive (Service Account o OAuth2)',
    );
  }

  private initialize(): boolean {
    const creds = this.getBusinessCredentials();
    const hasServiceAccount = !!(
      env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(env.GOOGLE_APPLICATION_CREDENTIALS)
    );
    const hasOAuth = !!(creds.clientId && creds.refreshToken);

    if (!hasServiceAccount && !hasOAuth) {
      logger.warn('Google Drive: No se detectaron credenciales configuradas');
      return false;
    }

    logger.info('Google Drive service initialized (Ready for on-demand auth)');
    return true;
  }

  /**
   * Verifica si el servicio está configurado
   */
  isReady(): boolean {
    return this.isConfigured && this.drive !== null;
  }

  /**
   * Busca una carpeta por nombre. Si no existe, la crea.
   */
  async findOrCreateFolder(name: string, parentFolderId?: string): Promise<string> {
    const drive = await this.getDriveClient();

    try {
      let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!;
      }

      const folder = await this.createFolder(name, parentFolderId);
      return folder.id;
    } catch (error: any) {
      logger.error(error, `Error finding or creating folder ${name}:`);
      throw error;
    }
  }

  /**
   * Busca un archivo por nombre.
   */
  async findFileByName(name: string, parentFolderId?: string): Promise<string | null> {
    const drive = await this.getDriveClient();

    try {
      let query = `name='${name}' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!;
      }

      return null;
    } catch (error: any) {
      logger.error(error, `Error finding file ${name}:`);
      throw error;
    }
  }

  /**
   * Lista archivos en Google Drive
   */
  async listFiles(options?: {
    folderId?: string;
    pageSize?: number;
    mimeType?: string;
    query?: string;
  }): Promise<DriveFile[]> {
    const drive = await this.getDriveClient();

    let query = options?.query || '';
    if (options?.folderId) {
      query += ` '${options.folderId}' in parents`;
    }
    if (options?.mimeType) {
      query += query ? ' and ' : '';
      query += `mimeType='${options.mimeType}'`;
    }
    query += query ? ' and ' : '';
    query += 'trashed=false';

    try {
      const response = await drive.files.list({
        pageSize: options?.pageSize || 100,
        q: query,
        fields:
          'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, thumbnailLink)',
        orderBy: 'modifiedTime desc',
      });

      return (response.data.files || []) as DriveFile[];
    } catch (error: any) {
      logger.error(error, 'Error listing Drive files:');
      throw error;
    }
  }

  /**
   * Sube un archivo a Google Drive
   */
  async uploadFile(filePath: string, options: DriveUploadOptions): Promise<DriveFile> {
    const drive = await this.getDriveClient();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const response = await drive.files.create({
        requestBody: {
          name: options.name,
          mimeType: options.mimeType,
          parents: options.parents,
          description: options.description,
        },
        media: {
          mimeType: options.mimeType,
          body: fs.createReadStream(filePath),
        },
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
      });

      logger.info(`File uploaded to Drive: ${response.data.name} (${response.data.id})`);
      return response.data as DriveFile;
    } catch (error: any) {
      logger.error(error, 'Error uploading file to Drive:');
      throw error;
    }
  }

  /**
   * Sube contenido directamente (Sting/Buffer) a Google Drive
   */
  async uploadContent(content: string | Buffer, options: DriveUploadOptions): Promise<DriveFile> {
    const drive = await this.getDriveClient();
    const { Readable } = await import('node:stream');

    try {
      const response = await drive.files.create({
        requestBody: {
          name: options.name,
          mimeType: options.mimeType,
          parents: options.parents,
          description: options.description,
        },
        media: {
          mimeType: options.mimeType,
          body: Readable.from(content),
        },
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
      });

      logger.info(`Content uploaded to Drive: ${response.data.name} (${response.data.id})`);
      return response.data as DriveFile;
    } catch (error: any) {
      logger.error(error, 'Error uploading content to Drive:');
      throw error;
    }
  }

  /**
   * Descarga un archivo de Google Drive
   */
  async downloadFile(fileId: string, destinationPath: string): Promise<void> {
    const drive = await this.getDriveClient();

    try {
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

      const dest = fs.createWriteStream(destinationPath);

      await new Promise<void>((resolve, reject) => {
        response.data
          .on('end', () => {
            logger.info(`File downloaded from Drive: ${fileId} -> ${destinationPath}`);
            resolve();
          })
          .on('error', (err: any) => {
            logger.error(err, 'Error downloading file from Drive:');
            reject(err);
          })
          .pipe(dest);
      });
    } catch (error: any) {
      logger.error(error, 'Error downloading file from Drive:');
      throw error;
    }
  }

  /**
   * Obtiene metadata de un archivo
   */
  async getFileMetadata(fileId: string): Promise<DriveFile> {
    const drive = await this.getDriveClient();

    try {
      const response = await drive.files.get({
        fileId,
        fields:
          'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, parents, thumbnailLink',
      });

      return response.data as DriveFile;
    } catch (error: any) {
      logger.error(error, 'Error getting file metadata:');
      throw error;
    }
  }

  /**
   * Crea una carpeta en Google Drive
   */
  async createFolder(name: string, parentFolderId?: string): Promise<DriveFile> {
    const drive = await this.getDriveClient();

    try {
      const response = await drive.files.create({
        requestBody: {
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentFolderId ? [parentFolderId] : undefined,
        },
        fields: 'id, name, mimeType, createdTime, webViewLink',
      });

      logger.info(`Folder created in Drive: ${response.data.name} (${response.data.id})`);
      return response.data as DriveFile;
    } catch (error: any) {
      logger.error(error, 'Error creating folder in Drive:');
      throw error;
    }
  }

  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    const drive = await this.getDriveClient();

    try {
      await drive.files.delete({ fileId });
      logger.info(`File deleted from Drive: ${fileId}`);
    } catch (error: any) {
      logger.error(error, 'Error deleting file from Drive:');
      throw error;
    }
  }

  /**
   * Comparte un archivo con permisos específicos
   */
  async shareFile(
    fileId: string,
    emailAddress: string,
    role: 'reader' | 'writer' | 'commenter' = 'reader',
  ): Promise<void> {
    const drive = await this.getDriveClient();

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          type: 'user',
          role,
          emailAddress,
        },
        sendNotificationEmail: true,
      });

      logger.info(`File shared: ${fileId} with ${emailAddress} (${role})`);
    } catch (error: any) {
      logger.error(error, 'Error sharing file:');
      throw error;
    }
  }

  /**
   * Hace público un archivo
   */
  async makePublic(fileId: string): Promise<string> {
    const drive = await this.getDriveClient();

    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          type: 'anyone',
          role: 'reader',
        },
      });

      const file = await this.getFileMetadata(fileId);
      logger.info(`File made public: ${fileId}`);
      return file.webViewLink || '';
    } catch (error) {
      logger.error(error as Error, 'Error making file public:');
      throw error;
    }
  }
}

// Singleton instance
export const googleDriveService = new GoogleDriveService();
