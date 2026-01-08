import nodemailer from 'nodemailer';
// import type { Transporter } from 'nodemailer';
import { Service } from 'typedi';

import { env } from '../config/env.schema';
import { logger } from '../utils/logger';

@Service()
export class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.EMAIL_USERNAME,
        pass: env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Verify SMTP connection configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('✅ SMTP Connection verified');
      return true;
    } catch (error) {
      logger.error(error, '❌ SMTP Connection failed');
      return false;
    }
    // No database connection handling here; skip shutdown of DB.
    // If a DB connection is needed, integrate it with connectToDatabase.
    // Placeholder for future DB cleanup.
  }

  /**
   * Send an email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: { filename: string; path?: string; content?: string }[],
  ): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${env.API_TITLE}" <${env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        attachments,
      });

      logger.info(`📧 Email sent: ${info.messageId} to ${to}`);
    } catch (error) {
      logger.error(error, `Failed to send email to ${to}`);
      throw error;
    }
  }
}
