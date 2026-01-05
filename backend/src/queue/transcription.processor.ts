import { Container } from 'typedi';
import * as fs from 'fs';
import * as path from 'path';
import { TranscriptionJob } from './youtube-transcription.queue';
import { youtubeTranscriptionService } from '../utils/youtube-transcription.service';
import { EmailService } from '../services/email.service';
import { TelegramService } from '../services/telegram.service';
import { logger } from '../utils/logger';

/**
 * Process a transcription job:
 * 1. Fetch transcript from YouTube
 * 2. Save to file
 * 3. Email result
 * 4. Notify via Telegram
 */
export async function processTranscriptionJob(job: TranscriptionJob): Promise<void> {
  const emailService = Container.get(EmailService);
  const telegramService = Container.get(TelegramService);

  logger.info(`⚡ Processing transcription for: ${job.fileName}`);

  try {
    // 1. Get Transcript
    const result = await youtubeTranscriptionService.getTranscription(job.videoUrl);
    const formattedTranscript = youtubeTranscriptionService.formatTranscript(result.transcript);

    // 2. Save to file
    const outputDir = path.resolve(__dirname, '../../youtube/transcripts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFileName = `${path.parse(job.fileName).name}_transcript.txt`;
    const outputPath = path.join(outputDir, outputFileName);

    const fileContent = `
TITLE: ${result.title}
URL: ${result.url}
DURATION: ${result.duration}s
DATE: ${new Date().toISOString()}

--- TRANSCRIPT ---

${formattedTranscript}
    `.trim();

    fs.writeFileSync(outputPath, fileContent);
    logger.info(`💾 Transcript saved to: ${outputPath}`);

    // 3. Send Email
    if (job.recipientEmail) {
      await emailService.sendEmail(
        job.recipientEmail,
        `📝 Transcription Ready: ${result.title}`,
        `<p>Hello,</p>
         <p>Here is the transcription for your video: <b>${result.title}</b></p>
         <p>Video URL: <a href="${result.url}">${result.url}</a></p>
         <br>
         <p>The transcript file is attached.</p>`,
        [{ filename: outputFileName, path: outputPath }]
      );
    }

    // 4. Notify Telegram
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (adminChatId) {
      await telegramService.sendMessage(
        `✅ *Transcription Complete*\n\n` +
        `📹 *Video:* ${result.title}\n` +
        `📂 *File:* \`${outputFileName}\`\n` +
        `📧 *Sent to:* ${job.recipientEmail}`,
        adminChatId
      );
    }

  } catch (error: any) {
    logger.error(error, `❌ Transcription failed for ${job.fileName}`);
    
    // Notify failure
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
    if (adminChatId) {
      await telegramService.sendMessage(
        `❌ *Transcription Failed*\n\n` +
        `📹 *File:* ${job.fileName}\n` +
        `⚠️ *Error:* ${error.message}`,
        adminChatId
      );
    }
  }
}
