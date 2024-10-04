// commands/uncheck.ts

import { Telegraf } from 'telegraf';
import { Context } from 'telegraf/typings/context';

export const uncheckCommand = (bot: Telegraf) => {
  bot.command('uncheck', (ctx: Context) => {
    ctx.reply('You have chosen to UN-CHECK!');
    // Add additional logic here if needed
  });
};

export const uncheckButton = (ctx: Context) => {
  ctx.reply('Choose an option:', {
    reply_markup: {
      keyboard: [
        [{ text: 'UN-CHECK' }], // Button with title "UN-CHECK"
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
};
