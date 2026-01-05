import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.warn('Telegram bot token or chat ID not set; notifications disabled.');
}

export async function notify(message: string): Promise<void> {
  if (!token || !chatId) return;
  const bot = new TelegramBot(token);
  try {
    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}
