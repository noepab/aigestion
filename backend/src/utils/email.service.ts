import nodemailer from 'nodemailer';

// import type { Transporter } from 'nodemailer';
import { env } from '../config/env.schema';
import { logger } from './logger';

/**
 * Interface para las opciones de email
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
}

/**
 * Servicio de envío de emails usando Nodemailer
 */
export class EmailService {
  private transporter: any = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el transportador de email
   */
  private initialize(): void {
    try {
      // Verificar que las configuraciones necesarias estén presentes
      if (!env.EMAIL_HOST || !env.EMAIL_PORT) {
        logger.warn(
          'Configuración de email incompleta. El servicio de email no estará disponible.'
        );
        return;
      }

      const config: any = {
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_PORT === 465, // true para 465, false para otros puertos
      };

      // Agregar autenticación si está configurada
      if (env.EMAIL_USERNAME && env.EMAIL_PASSWORD) {
        config.auth = {
          user: env.EMAIL_USERNAME,
          pass: env.EMAIL_PASSWORD,
        };
      }

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;

      logger.info('Servicio de email configurado correctamente');
    } catch (error) {
      logger.error(error, 'Error al inicializar el servicio de email:');
      this.isConfigured = false;
    }
  }

  /**
   * Verifica si el servicio está configurado y listo para enviar emails
   */
  isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Verifica la conexión con el servidor SMTP
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Transportador de email no inicializado');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      logger.error(error, 'Error al verificar la conexión SMTP:');
      return false;
    }
  }

  /**
   * Envía un email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isReady()) {
      logger.error('Servicio de email no configurado. No se puede enviar el email.');
      return false;
    }

    try {
      const mailOptions = {
        from: env.EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter!.sendMail(mailOptions);

      logger.info(`Email enviado exitosamente a ${mailOptions.to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(error, 'Error al enviar email:');
      return false;
    }
  }

  /**
   * Envía un email con transcripción de YouTube
   */
  async sendTranscriptionEmail(
    to: string | string[],
    videoTitle: string,
    videoUrl: string,
    transcript: string,
    videoId: string
  ): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #FF0000;
            color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .video-info {
            background-color: #f5f5f5;
            padding: 15px;
            border-left: 4px solid #FF0000;
            margin-bottom: 20px;
          }
          .video-info a {
            color: #FF0000;
            text-decoration: none;
            font-weight: bold;
          }
          .video-info a:hover {
            text-decoration: underline;
          }
          .transcript {
            background-color: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .thumbnail {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📹 Transcripción de YouTube</h1>
        </div>

        <div class="video-info">
          <h2>📺 ${videoTitle}</h2>
          <p><strong>URL:</strong> <a href="${videoUrl}" target="_blank">${videoUrl}</a></p>
          <p><strong>Video ID:</strong> ${videoId}</p>
          <p><strong>Fecha de procesamiento:</strong> ${new Date().toLocaleString('es-ES')}</p>
          <img class="thumbnail" src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="Miniatura del video">
        </div>

        <h3>📝 Transcripción completa:</h3>
        <div class="transcript">
${transcript}
        </div>

        <div class="footer">
          <p>Este email fue generado automáticamente por el sistema NEXUS V1 de transcripción de YouTube.</p>
          <p>Para más información, consulta la carpeta youtube/Videos.Transcripcion en tu proyecto.</p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
TRANSCRIPCIÓN DE YOUTUBE
========================

Título: ${videoTitle}
URL: ${videoUrl}
Video ID: ${videoId}
Fecha: ${new Date().toLocaleString('es-ES')}

TRANSCRIPCIÓN:
--------------

${transcript}

---
Este email fue generado automáticamente por el sistema NEXUS V1 de transcripción de YouTube.
    `;

    return this.sendEmail({
      to,
      subject: `📹 Transcripción: ${videoTitle}`,
      text: textContent,
      html: htmlContent,
    });
  }
}

export const emailService = new EmailService();
