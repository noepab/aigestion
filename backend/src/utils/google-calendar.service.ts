import { calendar_v3, google } from 'googleapis';

import { env } from '../config/env.schema';
import type { CalendarEvent } from '../types/google-cloud.types';
import { logger } from './logger';

/**
 * Servicio para Google Calendar API
 * Gestión de eventos de calendario
 */
export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar | null = null;
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
   * Crea o devuelve un cliente de Calendario autenticado (Cached)
   */
  private async getCalendarClient(): Promise<calendar_v3.Calendar> {
    if (this.calendar) {
      return this.calendar;
    }

    // Si hay credenciales de cuenta de servicio, priorizarlas
    if (env.GOOGLE_APPLICATION_CREDENTIALS) {
      const auth = new google.auth.GoogleAuth({
        keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      this.calendar = google.calendar({ version: 'v3', auth });
      return this.calendar;
    }

    // De lo contrario, intentar OAuth2
    const creds = this.getBusinessCredentials();
    if (creds.clientId && creds.clientSecret && creds.refreshToken) {
      const oauth2Client = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
      oauth2Client.setCredentials({ refresh_token: creds.refreshToken });
      this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      return this.calendar;
    }

    throw new Error('No se encontraron credenciales válidas para Google Calendar');
  }

  private initialize(): boolean {
    const creds = this.getBusinessCredentials();
    const hasServiceAccount = !!env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasOAuth = !!(creds.clientId && creds.refreshToken);

    if (!hasServiceAccount && !hasOAuth) {
      logger.warn('Google Calendar: No se detectaron credenciales configuradas');
      return false;
    }

    logger.info('Google Calendar service initialized (Ready for on-demand auth)');
    return true;
  }

  isReady(): boolean {
    return this.isConfigured && this.calendar !== null;
  }

  /* logic removed */

  /**
   * Lista calendarios disponibles
   */
  async listCalendars(): Promise<any[]> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.calendarList.list();
      return response.data.items || [];
    } catch (error: any) {
      logger.error(error, 'Error listing calendars:');
      throw error;
    }
  }

  /**
   * Crea un evento en el calendario
   */
  async createEvent(calendarId: string, event: CalendarEvent): Promise<string> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event as any,
        sendUpdates: 'all',
      });

      const eventId = response.data.id!;
      logger.info(`Event created: ${event.summary} (${eventId})`);
      return eventId;
    } catch (error: any) {
      logger.error(error, 'Error creating event:');
      throw error;
    }
  }

  /**
   * Lista eventos en un rango de fechas
   */
  async listEvents(
    calendarId: string,
    options?: {
      timeMin?: string; // ISO 8601
      timeMax?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    },
  ): Promise<any[]> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: options?.timeMin || new Date().toISOString(),
        timeMax: options?.timeMax,
        maxResults: options?.maxResults || 100,
        singleEvents: options?.singleEvents ?? true,
        orderBy: options?.orderBy || 'startTime',
      });

      return response.data.items || [];
    } catch (error: any) {
      logger.error(error, 'Error listing events:');
      throw error;
    }
  }

  /**
   * Obtiene un evento específico
   */
  async getEvent(calendarId: string, eventId: string): Promise<any> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.events.get({
        calendarId,
        eventId,
      });

      return response.data;
    } catch (error: any) {
      logger.error(error, 'Error getting event:');
      throw error;
    }
  }

  /**
   * Actualiza un evento
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<CalendarEvent>,
  ): Promise<void> {
    const calendar = await this.getCalendarClient();

    try {
      await calendar.events.patch({
        calendarId,
        eventId,
        requestBody: updates as any,
        sendUpdates: 'all',
      });

      logger.info(`Event updated: ${eventId}`);
    } catch (error: any) {
      logger.error(error, 'Error updating event:');
      throw error;
    }
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    const calendar = await this.getCalendarClient();

    try {
      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });

      logger.info(`Event deleted: ${eventId}`);
    } catch (error: any) {
      logger.error(error, 'Error deleting event:');
      throw error;
    }
  }

  /**
   * Crea un evento rápido (formato simple)
   */
  async quickAddEvent(calendarId: string, text: string): Promise<string> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.events.quickAdd({
        calendarId,
        text,
        sendUpdates: 'all',
      });

      const eventId = response.data.id!;
      logger.info(`Quick event created: ${text} (${eventId})`);
      return eventId;
    } catch (error: any) {
      logger.error(error, 'Error creating quick event:');
      throw error;
    }
  }

  /**
   * Busca eventos libres (para agendar reuniones)
   */
  async findFreeBusySlots(calendarIds: string[], timeMin: string, timeMax: string): Promise<any> {
    const calendar = await this.getCalendarClient();

    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendarIds.map(id => ({ id })),
        },
      });

      return response.data.calendars;
    } catch (error: any) {
      logger.error(error, 'Error querying free/busy:');
      throw error;
    }
  }

  /**
   * Crea un evento recurrente
   */
  async createRecurringEvent(
    calendarId: string,
    event: CalendarEvent,
    recurrenceRule: string,
  ): Promise<string> {
    const calendar = await this.getCalendarClient();

    const eventWithRecurrence = {
      ...event,
      recurrence: [recurrenceRule],
    };

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: eventWithRecurrence as any,
        sendUpdates: 'all',
      });

      const eventId = response.data.id!;
      logger.info(`Recurring event created: ${event.summary} (${eventId})`);
      return eventId;
    } catch (error: any) {
      logger.error(error, 'Error creating recurring event:');
      throw error;
    }
  }

  /**
   * Agenda una revisión de video para el día siguiente
   */
  async scheduleVideoReview(videoTitle: string, videoUrl: string): Promise<string> {
    // Calcular fecha: Mañana a las 10:00 AM
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30); // 30 min duración

    const event: CalendarEvent = {
      summary: `🎥 Revisar Tutorial: ${videoTitle}`,
      description: `Video subido automáticamente a AIGestion.\n\n🔗 URL: ${videoUrl}\n\n✅ Tareas:\n- Verificar transcripción en Drive\n- Revisar Tags SEO\n- Confirmar visibilidad (Unlisted -> Public)`,
      start: { dateTime: startTime.toISOString(), timeZone: 'Europe/Madrid' },
      end: { dateTime: endTime.toISOString(), timeZone: 'Europe/Madrid' },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 15 }],
      },
    };

    try {
      // Usamos 'primary' que se resolverá al calendario de la cuenta autenticada (Business)
      return await this.createEvent('primary', event);
    } catch (error) {
      logger.error(error as Error, 'Error scheduling video review:');
      throw error;
    }
  }
}

// Singleton instance
export const googleCalendarService = new GoogleCalendarService();
