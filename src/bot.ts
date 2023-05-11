import { Telegraf } from "telegraf";
import { message } from 'telegraf/filters'
import mongoose from 'mongoose';


import { handleStart } from "./handlers/start";
import { BOT_TOKEN, MONGODB_URI, NODE_HOST, NODE_PORT } from "./config";
import { sessionMiddleware } from "./middlewares/sessionMiddleware";
import { handleMessage } from "./handlers/message";

const initBot = async () => {
  if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

  try {
    await mongoose.connect(MONGODB_URI);
    const bot = new Telegraf(BOT_TOKEN);

    bot.use(sessionMiddleware)
    bot.on(message('text'), handleMessage)
    // commands
    bot.start(handleStart);

    if (process.env.NODE_ENV === 'development') {
      await bot.launch();
    } else {
      await bot.launch({
        webhook: {
          domain: `https://${NODE_HOST}`,
          port: Number(NODE_PORT)
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}


initBot();
