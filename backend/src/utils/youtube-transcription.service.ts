import { YoutubeTranscript } from 'youtube-transcript';

import { logger } from './logger';

/**
 * Interface para el resultado de la transcripción
 */
export interface TranscriptionResult {
  videoId: string;
  title: string;
  url: string;
  transcript: string;
  language: string;
  duration: number;
}

/**
 * Servicio para extraer transcripciones de videos de YouTube
 */
export class YoutubeTranscriptionService {
  /**
   * Extrae el ID del video desde una URL de YouTube
   */
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtube\.com\/v\/)([^?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Obtiene la transcripción de un video de YouTube en español
   */
  async getTranscription(videoUrl: string): Promise<TranscriptionResult> {
    try {
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('URL de YouTube inválida');
      }

      logger.info(`Obteniendo transcripción para video: ${videoId}`);

      // Intentar primero con subtítulos en español
      let transcriptItems;
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'es',
        });
      } catch (error) {
        // Si no hay subtítulos en español, intentar con autogenerados
        logger.warn(
          `No se encontraron subtítulos en español para ${videoId}, intentando con autogenerados`
        );
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'es',
        });
      }

      if (!transcriptItems || transcriptItems.length === 0) {
        throw new Error('No se encontraron subtítulos/transcripciones disponibles para este video');
      }

      // Combinar todos los segmentos de texto
      const fullTranscript = transcriptItems
        .map((item: any) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Calcular duración total
      const duration = transcriptItems[transcriptItems.length - 1]?.offset || 0;

      logger.info(
        `Transcripción obtenida exitosamente para ${videoId}. Longitud: ${fullTranscript.length} caracteres`
      );

      return {
        videoId,
        title: `Video de YouTube ${videoId}`,
        url: videoUrl,
        transcript: fullTranscript,
        language: 'es',
        duration: Math.round(duration / 1000), // Convertir a segundos
      };
    } catch (error) {
      logger.error(error, 'Error obteniendo transcripción de YouTube');
      throw new Error(`No se pudo obtener la transcripción: ${(error as Error).message}`);
    }
  }

  /**
   * Formatea la transcripción en párrafos más legibles
   */
  formatTranscript(transcript: string, wordsPerParagraph = 100): string {
    const words = transcript.split(' ');
    const paragraphs: string[] = [];

    for (let i = 0; i < words.length; i += wordsPerParagraph) {
      const paragraph = words.slice(i, i + wordsPerParagraph).join(' ');
      paragraphs.push(paragraph);
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Obtiene información básica del video (sin la transcripción completa)
   */
  async getVideoInfo(videoUrl: string): Promise<{ videoId: string; url: string }> {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('URL de YouTube inválida');
    }

    return {
      videoId,
      url: videoUrl,
    };
  }
}

export const youtubeTranscriptionService = new YoutubeTranscriptionService();
