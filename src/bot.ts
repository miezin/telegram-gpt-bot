import { Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import mongoose from 'mongoose';


import { handleStart } from "./handlers/start";
import { BOT_TOKEN, MONGODB_URI, NODE_HOST, NODE_PORT } from "./config";
import { sessionMiddleware } from "./middlewares/sessionMiddleware";
import { handleMessage } from "./handlers/message";
import { handleGetId } from "./handlers/getId";
import { handleAccessManager } from "./handlers/accessManager";
import { CustomContext } from "./types/customContext";
import { handleNewDialog } from "./handlers/newDialog";
import { handleUserChangeAccess, handleUserManager, handleUserManagerEdit, handleUsersPaginate } from "./handlers/users";
import { handleChatChangeAccess, handleChatManager, handleChatManagerEdit, handleChatsPaginate } from "./handlers/groupChats";

const initBot = async () => {
  if (!BOT_TOKEN) throw new Error('"BOT_TOKEN" env var is required!');

  try {
    await mongoose.connect(MONGODB_URI);
    const bot = new Telegraf<CustomContext>(BOT_TOKEN);

    bot.use(session({ defaultSession: () => ({}) }))
    bot.use(sessionMiddleware)

    bot.action('users', handleUserManager)
    bot.action(/^users:/, handleUserManagerEdit)
    bot.action(/^(grant|revoke):/, handleUserChangeAccess)
    bot.action(/^paginateUsers:/, handleUsersPaginate)

    bot.action('chats', handleChatManager)
    bot.action(/^chats:/, handleChatManagerEdit)
    bot.action(/^(grant|revoke):/, handleChatChangeAccess)
    bot.action(/^paginateChats:/, handleChatsPaginate)

    bot.command('admin', handleAccessManager)
    bot.command('new', handleNewDialog)
    bot.command('getId', handleGetId)

    bot.on(message('text'), handleMessage)
    
    // commands
    bot.start(handleStart);

    if (process.env.NODE_ENV === 'development') {
      bot.launch();
    } else {
      bot.launch({
        webhook: {
          domain: `https://${NODE_HOST}`,
          port: Number(NODE_PORT)
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}


initBot();
