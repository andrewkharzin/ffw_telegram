import { Telegraf } from 'telegraf';
import { TELEGRAM_BOT_TOKEN } from '../config';

// Initialize the bot with types
export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
