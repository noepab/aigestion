import * as fs from 'fs';
import { google } from 'googleapis';

import { env } from '../../config/env.schema';
import type { ChannelType, UploadOptions, YouTubeChannel } from '../../types/youtube.types';
import { logger } from '../../utils/logger';

/**
 * Servicio para gestión de múltiples canales de YouTube
 */
export class YouTubeChannelService {
  private readonly channels: Map<ChannelType, YouTubeChannel>;

  constructor() {
    this.channels = new Map();
    this.initializeChannels();
  }

  /**
   * Inicializa la configuración de ambos canales
   */
  private initializeChannels(): void {
    // Canal Personal (nemisanalex) - Para documentación técnica
    const personalChannel: YouTubeChannel = {
      id: env.YOUTUBE_PERSONAL_CHANNEL_ID || '',
      type: 'personal',
      email: env.YOUTUBE_PERSONAL_EMAIL,
      name: 'nemisanalex',
      description: 'Canal personal para documentación técnica y desarrollo',
      purpose: 'Documentar procesos, tutoriales técnicos, y aprendizaje personal',
      credentials: {
        apiKey: env.YOUTUBE_API_KEY,
        clientId: env.YOUTUBE_PERSONAL_CLIENT_ID,
        clientSecret: env.YOUTUBE_PERSONAL_CLIENT_SECRET,
        refreshToken: env.YOUTUBE_PERSONAL_REFRESH_TOKEN,
      },
    };

    // Canal Empresarial (AIGestion) - Para contenido de empresa
    const businessChannel: YouTubeChannel = {
      id: env.YOUTUBE_BUSINESS_CHANNEL_ID || '',
      type: 'business',
      email: env.YOUTUBE_BUSINESS_EMAIL,
      name: 'AIGestion',
      description:
        'Gestión inteligente de empresas con Inteligencia Artificial. Canal oficial de AIGestion (NEXUS V1).',
      purpose:
        'Marketing de producto, tutoriales de automatización, casos de éxito y webinars de gestión avanzada.',
      credentials: {
        apiKey: env.YOUTUBE_API_KEY,
        clientId: env.YOUTUBE_BUSINESS_CLIENT_ID,
        clientSecret: env.YOUTUBE_BUSINESS_CLIENT_SECRET,
        refreshToken: env.YOUTUBE_BUSINESS_REFRESH_TOKEN,
      },
    };

    this.channels.set('personal', personalChannel);
    this.channels.set('business', businessChannel);

    logger.info('YouTube channels initialized');
    logger.info(`Personal: ${personalChannel.email}`);
    logger.info(`Business (AIGestion): ${businessChannel.email}`);
  }

  /**
   * Obtiene el cliente OAuth2 para un canal específico
   */
  private getOAuth2Client(channelType: ChannelType) {
    const channel = this.channels.get(channelType);
    if (!channel) {
      throw new Error(`Channel type ${channelType} not found`);
    }

    const { clientId, clientSecret, refreshToken } = channel.credentials;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        `OAuth2 credentials incomplete for ${channelType} channel. Please configure CLIENT_ID, CLIENT_SECRET, and REFRESH_TOKEN.`,
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return oauth2Client;
  }

  /**
   * Obtiene información del canal
   */
  getChannelInfo(channelType: ChannelType): YouTubeChannel {
    const channel = this.channels.get(channelType);
    if (!channel) {
      throw new Error(`Channel type ${channelType} not found`);
    }
    return channel;
  }

  /**
   * Verifica si un canal está configurado correctamente
   */
  isChannelConfigured(channelType: ChannelType): boolean {
    const channel = this.channels.get(channelType);
    if (!channel) {
      return false;
    }

    const { clientId, clientSecret, refreshToken } = channel.credentials;
    return !!(clientId && clientSecret && refreshToken);
  }

  /**
   * Sube un video a un canal específico
   */
  async uploadVideo(options: UploadOptions): Promise<string> {
    const {
      channelType,
      filePath,
      metadata,
      notifySubscribers = true,
      madeForKids = false,
    } = options;

    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Video file not found: ${filePath}`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    const channel = this.channels.get(channelType);
    logger.info(`Uploading video to ${channel?.name} (${channel?.email})`);

    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        notifySubscribers,
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: metadata.categoryId,
          },
          status: {
            privacyStatus: metadata.privacyStatus,
            publishAt: metadata.publishAt,
            selfDeclaredMadeForKids: madeForKids,
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      });

      const videoId = response.data.id;
      logger.info(`Video uploaded successfully: ${videoId}`);
      logger.info(`URL: https://youtube.com/watch?v=${videoId}`);

      return videoId || '';
    } catch (error: any) {
      logger.error(error, `Error uploading video to ${channelType} channel:`);
      throw error;
    }
  }

  /**
   * Lista los videos de un canal
   */
  async listVideos(channelType: ChannelType, maxResults = 50): Promise<any[]> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      const response = await youtube.search.list({
        part: ['snippet'],
        forMine: true,
        type: ['video'],
        maxResults,
        order: 'date',
      });

      return response.data.items || [];
    } catch (error: any) {
      logger.error(error, `Error listing videos for ${channelType} channel:`);
      throw error;
    }
  }

  /**
   * Lista las playlists de un canal
   */
  async listPlaylists(channelType: ChannelType, maxResults = 50): Promise<any[]> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      const response = await youtube.playlists.list({
        part: ['snippet', 'contentDetails'],
        mine: true,
        maxResults,
      });

      return response.data.items || [];
    } catch (error: any) {
      logger.error(error, `Error listing playlists for ${channelType} channel:`);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de un video
   */
  async getVideoStats(channelType: ChannelType, videoId: string): Promise<any> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      const response = await youtube.videos.list({
        part: ['statistics', 'snippet'],
        id: [videoId],
      });

      return response.data.items?.[0] || null;
    } catch (error: any) {
      logger.error(error, `Error getting video stats:`);
      throw error;
    }
  }

  /**
   * Crea una playlist en un canal
   */
  async createPlaylist(
    channelType: ChannelType,
    title: string,
    description: string,
    privacyStatus: 'public' | 'private' | 'unlisted' = 'public',
  ): Promise<string> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      const response = await youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus,
          },
        },
      });

      const playlistId = response.data.id || '';
      logger.info(`Playlist created: ${playlistId}`);
      return playlistId;
    } catch (error: any) {
      logger.error(error, `Error creating playlist:`);
      throw error;
    }
  }

  /**
   * Busca una playlist por nombre
   */
  async findPlaylistByName(channelType: ChannelType, name: string): Promise<string | null> {
    try {
      const playlists = await this.listPlaylists(channelType);
      const found = playlists.find(p =>
        p.snippet?.title.toLowerCase().includes(name.toLowerCase()),
      );
      return found?.id || null;
    } catch (error) {
      logger.error(error, `Error finding playlist by name: ${name}`);
      return null;
    }
  }

  /**
   * Busca o crea una playlist
   */
  async findOrCreatePlaylist(
    channelType: ChannelType,
    title: string,
    description: string,
  ): Promise<string> {
    const existing = await this.findPlaylistByName(channelType, title);
    if (existing) {
      return existing;
    }
    return this.createPlaylist(channelType, title, description);
  }

  /**
   * Añade un video a una playlist
   */
  async addVideoToPlaylist(
    channelType: ChannelType,
    videoId: string,
    playlistId: string,
  ): Promise<void> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      await youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId,
            },
          },
        },
      });

      logger.info(`Video ${videoId} added to playlist ${playlistId}`);
    } catch (error: any) {
      logger.error(error, `Error adding video to playlist:`);
      throw error;
    }
  }

  /**
   * Configura el canal empresarial con playlists estándar premium
   */
  async setupBusinessChannel(): Promise<{ playlistsCreated: string[] }> {
    if (!this.isChannelConfigured('business')) {
      throw new Error('Business channel is not properly configured');
    }

    const playlists = [
      {
        title: '💎 AIGestion: Software Demos',
        description: 'Demostraciones detalladas de las capacidades de automatización de AIGestion.',
      },
      {
        title: '🚀 Tutoriales de Automatización',
        description: 'Guías paso a paso para optimizar tu empresa con Inteligencia Artificial.',
      },
      {
        title: '📊 Casos de Éxito & Webinars',
        description: 'Sesiones en directo y testimonios de transformación empresarial.',
      },
      {
        title: '🤖 NEXUS V1 Core Updates',
        description: 'Novedades y actualizaciones técnicas del motor NEXUS V1.',
      },
    ];

    const results: string[] = [];

    for (const playlist of playlists) {
      try {
        const id = await this.findOrCreatePlaylist(
          'business',
          playlist.title,
          playlist.description,
        );
        results.push(`${playlist.title} (${id})`);
      } catch (error: any) {
        logger.error(error, `Error during setup of playlist ${playlist.title}`);
      }
    }

    return { playlistsCreated: results };
  }

  /**
   * Actualiza el metadata de un video (SEO)
   */
  async updateVideoMetadata(
    channelType: ChannelType,
    videoId: string,
    metadata: {
      title?: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
    },
  ): Promise<void> {
    if (!this.isChannelConfigured(channelType)) {
      throw new Error(`${channelType} channel is not properly configured`);
    }

    const auth = this.getOAuth2Client(channelType);
    const youtube = google.youtube({ version: 'v3', auth });

    try {
      // 1. Obtener snippet actual para no sobrescribir datos que no cambiamos
      const currentVideo = await youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
      });

      if (!currentVideo.data.items || currentVideo.data.items.length === 0) {
        throw new Error(`Video ${videoId} not found`);
      }

      const snippet = currentVideo.data.items[0].snippet!;

      // 2. Aplicar actualizaciones
      const updateRequest = {
        id: videoId,
        snippet: {
          ...snippet,
          title: metadata.title || snippet.title,
          description: metadata.description || snippet.description,
          tags: metadata.tags || snippet.tags,
          categoryId: metadata.categoryId || snippet.categoryId,
        },
      };

      // 3. Enviar actualización
      await youtube.videos.update({
        part: ['snippet'],
        requestBody: updateRequest,
      });

      logger.info(`Video metadata updated for ${videoId}`);
    } catch (error: any) {
      logger.error(error, `Error updating video metadata for ${videoId}:`);
      throw error;
    }
  }
}

// Singleton instance
export const youtubeChannelService = new YouTubeChannelService();
