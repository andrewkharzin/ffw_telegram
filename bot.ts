import { Telegraf, Markup, session } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { MyContext, MySessionData } from './types';

// Ensure TELEGRAM_BOT_TOKEN is defined
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is missing from the environment variables.");
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!); // '!' asserts these are not undefined

// Initialize Telegraf bot with the token
const bot = new Telegraf<MyContext>(TELEGRAM_BOT_TOKEN!); // Non-null assertion

// Middleware to use sessions
bot.use(session({
  defaultSession: () => ({ isAwaitingUNNumber: false }), // Initialize default session
}));

// Start command - Start App button
bot.start((ctx) => {
  console.log("Bot received /start command.");
  
  // Create an inline keyboard with the button labeled "Start App"
  ctx.reply('Welcome! Please click the button below to start the app.', 
    Markup.inlineKeyboard([
      Markup.button.callback('Start App', 'start_app') // Button with callback data
    ])
  );
});

// Handle "Start App" button click
bot.action('start_app', (ctx) => {
  console.log("Start App button clicked.");

  // Create an inline keyboard with the button labeled "UN-CHECK"
  ctx.reply('You have started the app! Click the button below to check a UN number:', 
    Markup.inlineKeyboard([
      Markup.button.callback('UN-CHECK', 'un_check') // Button with callback data
    ])
  );
});

// Handle "UN-CHECK" button click
bot.action('un_check', (ctx) => {
  console.log("UN-CHECK button clicked.");

  // Prompt the user to enter the UN number
  ctx.reply('Please enter the UN number (e.g., 1023):');
  
  // Set a flag in session to expect a UN number input
  ctx.session.isAwaitingUNNumber = true; // Ensure session is initialized properly
});

// Handle user input for UN number
bot.on('text', async (ctx) => {
  // Check if the bot is awaiting a UN number
  if (ctx.session.isAwaitingUNNumber) {
    const unNumber = ctx.message.text.trim();

    console.log(`User entered UN number: ${unNumber}`);

    // Query the Supabase database for the entered UN number
    const { data, error } = await supabase
      .from('dgr_un_list')
      .select('*')
      .eq('un_number', unNumber);

    if (error) {
      console.error('Error querying Supabase:', error);
      ctx.reply('There was an error fetching the UN number. Please try again.');
    } else if (data.length === 0) {
      ctx.reply(`No information found for UN number ${unNumber}.`);
    } else {
      const entry = data[0]; // Assuming the first matching entry

      // Respond with the UN number details
      ctx.replyWithMarkdown(`
        *Details for UN number ${unNumber}:*\n
        *Name/Description:* ${entry.name_description || 'N/A'}
        *Class/Division:* ${entry.class_devision || 'N/A'}
        *Sub Risk:* ${entry.sub_risk || 'N/A'}
        *Packing Group:* ${entry.un_packing_group || 'N/A'}
        *Special Provision:* ${entry.special_provision || 'N/A'}
        *Limited Quantities:* ${entry.limited_quantities || 'N/A'}
        *Excepted Quantity:* ${entry.excepted_qnty || 'N/A'}
        `);
        

      // Reset the flag
      ctx.session.isAwaitingUNNumber = false;
    }
  }
});

// Log successful launch
bot.launch()
  .then(() => {
    console.log('Bot is successfully running...');
  })
  .catch((error) => {
    console.error('Error while launching bot:', error.message);
  });

// Graceful stop on process termination
process.once('SIGINT', () => {
  console.log('Stopping bot (SIGINT)...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('Stopping bot (SIGTERM)...');
  bot.stop('SIGTERM');
});
