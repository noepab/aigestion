import { google, sheets_v4 } from 'googleapis';

import { env } from '../config/env.schema';
import type { CellValue, SpreadsheetInfo } from '../types/google-cloud.types';
import { logger } from './logger';

/**
 * Servicio para Google Sheets API
 * Gestión de hojas de cálculo de Google
 */
export class GoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
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
   * Crea o devuelve un cliente de Sheets autenticado (Cached)
   */
  private async getSheetsClient(): Promise<sheets_v4.Sheets> {
    if (this.sheets) {
      return this.sheets;
    }

    // Si hay credenciales de cuenta de servicio, priorizarlas
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      const auth = new google.auth.GoogleAuth({
        keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
      return this.sheets;
    }

    // De lo contrario, intentar OAuth2
    const creds = this.getBusinessCredentials();
    if (creds.clientId && creds.clientSecret && creds.refreshToken) {
      const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
      oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
      this.sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      return this.sheets;
    }

    throw new Error('No se encontraron credenciales válidas para Google Sheets');
  }

  private initialize(): boolean {
    const creds = this.getBusinessCredentials();
    const hasServiceAccount = !!env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasOAuth = !!(creds.clientId && creds.refreshToken);

    if (!hasServiceAccount && !hasOAuth) {
      logger.warn('Google Sheets: No se detectaron credenciales configuradas');
      return false;
    }

    logger.info('Google Sheets service initialized (Ready for on-demand auth)');
    return true;
  }

  isReady(): boolean {
    return this.isConfigured && this.sheets !== null;
  }

  /**
   * Busca una hoja de cálculo por nombre. Si no existe, la crea.
   */
  async findOrCreateSpreadsheet(
    title: string,
    sheetTitles: string[] = ['Videos'],
  ): Promise<string> {
    try {
      // Necesitamos Drive API para buscar por nombre de archivo si no tenemos el ID
      // Por ahora, asumimos que si no lo tenemos, lo creamos y logueamos el ID
      // Como mejora futura, podríamos integrar GoogleDriveService aquí para buscar el archivo.

      // Implementación simple por ahora: Crear si no hay persistencia de ID
      // (En NEXUS V1 real, guardaríamos este ID en una base de datos o config)
      return await this.createSpreadsheet(title, sheetTitles);
    } catch (error: any) {
      logger.error(error, `Error finding or creating spreadsheet ${title}:`);
      throw error;
    }
  }

  /**
   * Crea una nueva hoja de cálculo
   */
  async createSpreadsheet(title: string, sheetTitles: string[] = ['Sheet1']): Promise<string> {
    const sheets = await this.getSheetsClient();

    try {
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: sheetTitles.map(sheetTitle => ({
            properties: { title: sheetTitle },
          })),
        },
      });

      const spreadsheetId = response.data.spreadsheetId!;
      logger.info(`Spreadsheet created: ${title} (${spreadsheetId})`);
      return spreadsheetId;
    } catch (error: any) {
      logger.error(error, 'Error creating spreadsheet:');
      throw error;
    }
  }

  /**
   * Obtiene información de una hoja de cálculo
   */
  async getSpreadsheetInfo(spreadsheetId: string): Promise<SpreadsheetInfo> {
    const sheets = await this.getSheetsClient();

    try {
      const response = await sheets.spreadsheets.get({ spreadsheetId });

      return {
        spreadsheetId,
        title: response.data.properties?.title || '',
        sheets:
          response.data.sheets?.map(sheet => ({
            sheetId: sheet.properties?.sheetId || 0,
            title: sheet.properties?.title || '',
            index: sheet.properties?.index || 0,
            rowCount: sheet.properties?.gridProperties?.rowCount || 0,
            columnCount: sheet.properties?.gridProperties?.columnCount || 0,
          })) || [],
      };
    } catch (error: any) {
      logger.error(error, 'Error getting spreadsheet info:');
      throw error;
    }
  }

  /**
   * Lee valores de un rango
   */
  async readRange(spreadsheetId: string, range: string): Promise<CellValue[][]> {
    const sheets = await this.getSheetsClient();

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return (response.data.values || []) as CellValue[][];
    } catch (error: any) {
      logger.error(error, 'Error reading range:');
      throw error;
    }
  }

  /**
   * Escribe valores en un rango
   */
  async writeRange(
    spreadsheetId: string,
    range: string,
    values: CellValue[][],
    valueInputOption: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED',
  ): Promise<void> {
    const sheets = await this.getSheetsClient();

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption,
        requestBody: { values },
      });

      logger.info(`Values written to range: ${range}`);
    } catch (error: any) {
      logger.error(error, 'Error writing range:');
      throw error;
    }
  }

  /**
   * Añade filas al final de una hoja
   */
  async appendRows(
    spreadsheetId: string,
    sheetName: string,
    values: CellValue[][],
    valueInputOption: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED',
  ): Promise<void> {
    const sheets = await this.getSheetsClient();

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: sheetName,
        valueInputOption,
        requestBody: { values },
      });

      logger.info(`Rows appended to sheet: ${sheetName}`);
    } catch (error: any) {
      logger.error(error, 'Error appending rows:');
      throw error;
    }
  }

  /**
   * Limpia un rango de celdas
   */
  async clearRange(spreadsheetId: string, range: string): Promise<void> {
    const sheets = await this.getSheetsClient();

    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });

      logger.info(`Range cleared: ${range}`);
    } catch (error: any) {
      logger.error(error, 'Error clearing range:');
      throw error;
    }
  }

  /**
   * Crea una nueva hoja dentro de una spreadsheet
   */
  async addSheet(spreadsheetId: string, title: string): Promise<number> {
    const sheets = await this.getSheetsClient();

    try {
      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title },
              },
            },
          ],
        },
      });

      const sheetId = response.data.replies?.[0]?.addSheet?.properties?.sheetId || 0;
      logger.info(`Sheet added: ${title} (${sheetId})`);
      return sheetId;
    } catch (error: any) {
      logger.error(error, 'Error adding sheet:');
      throw error;
    }
  }

  /**
   * Elimina una hoja
   */
  async deleteSheet(spreadsheetId: string, sheetId: number): Promise<void> {
    const sheets = await this.getSheetsClient();

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: { sheetId },
            },
          ],
        },
      });

      logger.info(`Sheet deleted: ${sheetId}`);
    } catch (error: any) {
      logger.error(error, 'Error deleting sheet:');
      throw error;
    }
  }

  /**
   * Formatea celdas (negrita, color, etc.)
   */
  async formatCells(
    spreadsheetId: string,
    sheetId: number,
    startRowIndex: number,
    endRowIndex: number,
    startColumnIndex: number,
    endColumnIndex: number,
    format: {
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      backgroundColor?: { red: number; green: number; blue: number };
      textColor?: { red: number; green: number; blue: number };
    },
  ): Promise<void> {
    const sheets = await this.getSheetsClient();

    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex,
                  endRowIndex,
                  startColumnIndex,
                  endColumnIndex,
                },
                cell: {
                  userEnteredFormat: {
                    textFormat: {
                      bold: format.bold,
                      italic: format.italic,
                      fontSize: format.fontSize,
                      foregroundColor: format.textColor,
                    },
                    backgroundColor: format.backgroundColor,
                  },
                },
                fields: 'userEnteredFormat(textFormat,backgroundColor)',
              },
            },
          ],
        },
      });

      logger.info('Cells formatted successfully');
    } catch (error: any) {
      logger.error(error, 'Error formatting cells:');
      throw error;
    }
  }

  /**
   * Busca y reemplaza texto
   */
  async findAndReplace(
    spreadsheetId: string,
    find: string,
    replacement: string,
    sheetId?: number,
  ): Promise<number> {
    const sheets = await this.getSheetsClient();

    try {
      const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              findReplace: {
                find,
                replacement,
                sheetId,
                allSheets: sheetId === undefined,
              },
            },
          ],
        },
      });

      const occurrencesChanged = response.data.replies?.[0]?.findReplace?.occurrencesChanged || 0;
      logger.info(`Find and replace: ${occurrencesChanged} occurrences changed`);
      return occurrencesChanged;
    } catch (error) {
      logger.error(error as Error, 'Error in find and replace:');
      throw error;
    }
  }
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();
