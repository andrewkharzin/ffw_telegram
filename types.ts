import { Context, Scenes } from 'telegraf';

// Define session data structure
export interface MySessionData {
  isAwaitingUNNumber?: boolean;
}

// Extend the Telegraf context with custom session data
export interface MyContext extends Context {
  session: MySessionData;
}
