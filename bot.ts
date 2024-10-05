import { Telegraf, Markup, session } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import { TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";
import { MyContext, MySessionData } from "./types";

// Ensure TELEGRAM_BOT_TOKEN is defined
if (!TELEGRAM_BOT_TOKEN) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN is missing from the environment variables."
  );
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!); // '!' asserts these are not undefined

// Initialize Telegraf bot with the token
const bot = new Telegraf<MyContext>(TELEGRAM_BOT_TOKEN!); // Non-null assertion

// Middleware to use sessions
bot.use(
  session({
    defaultSession: () => ({ isAwaitingUNNumber: false }), // Initialize default session
  })
);

// Start command - Start App button
bot.start((ctx) => {
  console.log("Bot received /start command.");

  // Create an inline keyboard with the buttons labeled "Start App" and "List DGR Classes"
  ctx.reply(
    "Welcome! Please choose an action.",
    Markup.inlineKeyboard([
      Markup.button.callback("Start App", "start_app"), // Button for starting app
      Markup.button.callback("List DGR Classes", "list_dgr_classes"), // New button to list DGR Classes
    ])
  );
});

// Handle "Start App" button click
bot.action("start_app", (ctx) => {
  console.log("Start App button clicked.");

  // Create an inline keyboard with the button labeled "UN-CHECK"
  ctx.reply(
    "You have started the app! Click the button below to check a UN number:",
    Markup.inlineKeyboard([
      Markup.button.callback("UN-CHECK", "un_check"), // Button with callback data
    ])
  );
});

// Handle "UN-CHECK" button click
bot.action("un_check", (ctx) => {
  console.log("UN-CHECK button clicked.");

  // Prompt the user to enter the UN number
  ctx.reply("Please enter the UN number (e.g., 1023):");

  // Set a flag in session to expect a UN number input
  ctx.session.isAwaitingUNNumber = true; // Ensure session is initialized properly
});

// Handle user input for UN number
bot.on("text", async (ctx) => {
  // Check if the bot is awaiting a UN number
  if (ctx.session.isAwaitingUNNumber) {
    const unNumber = ctx.message.text.trim();

    console.log(`User entered UN number: ${unNumber}`);

    // Query the Supabase database for the entered UN number
    const { data, error } = await supabase
      .from("dgr_un_list")
      .select("*")
      .eq("un_number", unNumber);

    if (error) {
      console.error("Error querying Supabase:", error);
      ctx.reply("There was an error fetching the UN number. Please try again.");
    } else if (data.length === 0) {
      ctx.reply(`No information found for UN number ${unNumber}.`);
    } else {
      const entry = data[0]; // Assuming the first matching entry

      // Respond with the UN number details
      ctx.replyWithHTML(`
<b>Details for UN number ${unNumber}:</b>\n
<pre>
<b>Name/Description:</b>     ${entry.name_description || "N/A"}
<b>Class/Division:</b>       ${entry.class_devision || "N/A"}
<b>Sub Risk:</b>             ${entry.sub_risk || "N/A"}
<b>Packing Group:</b>        ${entry.un_packing_group || "N/A"}
<b>Special Provision:</b>    ${entry.special_provision || "N/A"}
<b>Limited Quantities:</b>   ${entry.limited_quantities || "N/A"}
<b>Excepted Quantity:</b>    ${entry.excepted_qnty || "N/A"}
</pre>
`);

      // Reset the flag
      ctx.session.isAwaitingUNNumber = false;
    }
  }
});

// Handle "List DGR Classes" button click
bot.action("list_dgr_classes", async (ctx) => {
  console.log("List DGR Classes button clicked.");

  // Fetch DGR Classes from the Supabase database
  const { data, error } = await supabase
    .from("dgr_classes")
    .select("icao_class, description, iata_code");

  if (error) {
    console.error("Error fetching DGR classes:", error);
    ctx.reply("There was an error fetching the DGR classes. Please try again.");
    return;
  }

  if (data.length === 0) {
    ctx.reply("No DGR classes found.");
    return;
  }

  // Construct the message to display the list of DGR classes
  let responseMessage = "<b>List of DGR Classes:</b>\n\n";
  data.forEach((entry, index) => {
    responseMessage += `<b>${index + 1}.</b> ICAO Class: ${
      entry.icao_class || "N/A"
    }\n`;
    responseMessage += `Description: ${entry.description || "N/A"}\n`;
    responseMessage += `<b>IATA Code:</b> ${entry.iata_code || "N/A"}\n\n`; // IATA Code is now bold
  });

  // Reply with the list
  ctx.replyWithHTML(responseMessage);
});

// Log successful launch
bot
  .launch()
  .then(() => {
    console.log("Bot is successfully running...");
  })
  .catch((error) => {
    console.error("Error while launching bot:", error.message);
  });

// Graceful stop on process termination
process.once("SIGINT", () => {
  console.log("Stopping bot (SIGINT)...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("Stopping bot (SIGTERM)...");
  bot.stop("SIGTERM");
});
