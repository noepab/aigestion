import dotenv from 'dotenv';
import path from 'path';
import { Telegraf } from 'telegraf';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function test() {
  console.log('--- Telegram Diagnostic ---');
  console.log('Token exists:', !!token);
  console.log('Chat ID:', chatId);

  if (!token || !chatId) {
    console.error('Missing credentials in .env');
    return;
  }

  const bot = new Telegraf(token);
  try {
    const me = await bot.telegram.getMe();
    console.log('Bot name:', me.username);
    await bot.telegram.sendMessage(chatId, '🚨 NEXUS V1: Test de Alerta Directo via Antigravity');
    console.log('Message sent successfully!');
  } catch (err) {
    console.error('Failed to send message:', err);
  }
}

test();
