import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { Container } from 'typedi';

import { env } from '../config/env.schema';
import { TranscriptionJob, youtubeTranscriptionQueue } from '../queue/youtube-transcription.queue';
import { youtubeChannelService } from '../services/google/youtube-channel.service';
import { TelegramService } from '../services/telegram.service';
import { logger } from '../utils/logger';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv'];

/**
 * Servicio de vigilancia de carpeta para archivos de YouTube
 */
export class YoutubeWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private watchPath: string;
  private processedPath: string;
  private recipientEmail: string;

  constructor() {
    // La carpeta a vigilar está en la raíz del proyecto NEXUS V1
    const projectRoot = path.resolve(__dirname, '../../../../');
    this.watchPath = path.join(projectRoot, 'youtube', 'Videos.Transcripcion');
    this.processedPath = path.join(this.watchPath, 'processed');

    // Email del destinatario (puede ser configurado via variable de entorno)
    this.recipientEmail = process.env.YOUTUBE_TRANSCRIPTION_EMAIL || env.EMAIL_FROM;
  }

  /**
   * Asegura que las carpetas necesarias existan
   */
  private ensureDirectories(): void {
    if (!fs.existsSync(this.watchPath)) {
      fs.mkdirSync(this.watchPath, { recursive: true });
      logger.info(`Carpeta creada: ${this.watchPath}`);
    }

    if (!fs.existsSync(this.processedPath)) {
      fs.mkdirSync(this.processedPath, { recursive: true });
      logger.info(`Carpeta creada: ${this.processedPath}`);
    }
  }

  /**
   * Extrae la URL del video desde un archivo de texto
   */
  private extractVideoUrl(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();

      // Validar que parece ser una URL de YouTube
      if (content.includes('youtube.com') || content.includes('youtu.be')) {
        // Extraer la primera línea que contenga una URL
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
            return trimmed;
          }
        }
      }

      return null;
    } catch (error: any) {
      logger.error(error, `Error leyendo archivo ${filePath}`);
      return null;
    }
  }

  /**
   * Mueve el archivo procesado a la carpeta processed/
   */
  private moveToProcessed(filePath: string): void {
    try {
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const newFileName = `${timestamp}_${fileName}`;
      const newPath = path.join(this.processedPath, newFileName);

      fs.renameSync(filePath, newPath);
      logger.info(`Archivo movido a processed: ${newFileName}`);
    } catch (error: any) {
      logger.error(error, `Error moviendo archivo ${filePath}`);
    }
  }

  /**
   * Procesa un nuevo archivo detectado
   */
  private async processFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);

    // Ignorar archivos temporales o del sistema
    if (fileName.startsWith('.') || fileName.startsWith('~')) {
      return;
    }

    // Soporte para archivos de texto (URL)
    if (path.extname(filePath) === '.txt') {
      await this.processTxtFile(filePath, fileName);
      return;
    }

    // Soporte para archivos de video (Upload)
    if (VIDEO_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) {
      await this.processVideoFile(filePath, fileName);
      return;
    }

    logger.debug(`Archivo ignorado (extensión no soportada): ${fileName}`);
  }

  /**
   * Procesa un archivo .txt que contiene una URL de YouTube
   */
  private async processTxtFile(filePath: string, fileName: string): Promise<void> {
    logger.info(`Analizando archivo de texto: ${fileName}`);

    // Pequeña demora para asegurar que el archivo se terminó de escribir
    await new Promise(resolve => setTimeout(resolve, 500));

    // Extraer URL del video
    const videoUrl = this.extractVideoUrl(filePath);

    if (!videoUrl) {
      logger.warn(`No se encontró una URL de YouTube válida en: ${fileName}`);
      return;
    }

    logger.info(`URL de YouTube detectada: ${videoUrl}`);

    // Crear job de transcripción
    const job: TranscriptionJob = {
      videoUrl,
      recipientEmail: this.recipientEmail,
      fileName,
      timestamp: new Date().toISOString(),
    };

    // Encolar el job
    const enqueued = await youtubeTranscriptionQueue.publishTranscriptionJob(job);

    if (enqueued) {
      logger.info(`Job encolado exitosamente para: ${fileName}`);
      this.moveToProcessed(filePath);
    }
  }

  /**
   * Sube un video local a AIGestion y luego encola su transcripción
   */
  private async processVideoFile(filePath: string, fileName: string): Promise<void> {
    logger.info(`🚀 Iniciando carga premium de video: ${fileName}`);

    try {
      // 1. Subir a YouTube (Canal AIGestion)
      const videoId = await youtubeChannelService.uploadVideo({
        channelType: 'business',
        filePath: filePath,
        metadata: {
          title: path.parse(fileName).name, // Nombre del archivo sin extensión
          description: 'Video procesado automáticamente por AIGestion (NEXUS V1)',
          tags: ['AIGestion', 'Automation', 'Tutorial'],
          categoryId: '27', // Education
          privacyStatus: 'unlisted', // Por defecto oculto por privacidad
        },
      });

      // 2. Añadir a la lista de Tutoriales
      const playlistId = await youtubeChannelService.findPlaylistByName('business', 'Tutoriales');
      if (playlistId) {
        await youtubeChannelService.addVideoToPlaylist('business', videoId, playlistId);
        logger.info(`Video añadido a la playlist Tutoriales: ${playlistId}`);
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      logger.info(`Video subido exitosamente: ${videoUrl}`);

      // 3. Encolar transcripción (usaremos la URL generada)
      const job: TranscriptionJob = {
        videoUrl,
        recipientEmail: this.recipientEmail,
        fileName,
        timestamp: new Date().toISOString(),
      };

      const enqueued = await youtubeTranscriptionQueue.publishTranscriptionJob(job);

      if (enqueued) {
        logger.info(`Job de transcripción encolado para video subido: ${fileName}`);
        this.moveToProcessed(filePath);

        // 4. Notificación Premium por Telegram
        try {
          const telegramService = Container.get(TelegramService);
          const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

          if (adminChatId) {
            const message =
              `🎬 *NEXUS V1: Video Automatizado*\n\n` +
              `✅ *Archivo:* \`${fileName}\` subido exitosamente.\n` +
              `💎 *Canal:* AIGestion (Empresa)\n` +
              `📌 *Playlist:* Tutoriales\n` +
              `🔗 *URL:* ${videoUrl}\n\n` +
              `📝 _La transcripción se está procesando y se incluirá en el próximo Briefing._`;

            await telegramService.sendMessage(adminChatId, message);
            logger.info('Notificación de Telegram enviada exitosamente.');
          }
        } catch (msgError) {
          logger.error(msgError, 'Error enviando notificación de Telegram');
        }
      }
    } catch (error: any) {
      logger.error(error, `Error durante la automatización premium del video ${fileName}`);
    }
  }

  /**
   * Inicia el servicio de vigilancia
   */
  start(): void {
    this.ensureDirectories();

    logger.info(`Iniciando vigilancia de carpeta: ${this.watchPath}`);
    logger.info(`Email de destino: ${this.recipientEmail}`);

    this.watcher = chokidar.watch(this.watchPath, {
      ignored: [
        /(^|[\/\\])\../, // Archivos ocultos
        /processed/, // Carpeta processed
        /README\.md/, // README
      ],
      persistent: true,
      ignoreInitial: true, // No procesar archivos existentes al iniciar
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', filePath => {
        this.processFile(filePath).catch((error: any) => {
          logger.error(error, `Error procesando archivo ${filePath}`);
        });
      })
      .on('error', (error: any) => {
        logger.error(error, 'Error en el watcher');
      })
      .on('ready', () => {
        logger.info('✅ Watcher de YouTube listo. Esperando archivos...');
      });
  }

  /**
   * Detiene el servicio de vigilancia
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      logger.info('Watcher de YouTube detenido');
    }
  }

  /**
   * Obtiene el estado del watcher
   */
  getStatus(): {
    isRunning: boolean;
    watchPath: string;
    recipientEmail: string;
  } {
    return {
      isRunning: this.watcher !== null,
      watchPath: this.watchPath,
      recipientEmail: this.recipientEmail,
    };
  }
}

export const youtubeWatcherService = new YoutubeWatcherService();
