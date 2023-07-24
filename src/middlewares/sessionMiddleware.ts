import { message } from 'telegraf/filters'
import { User } from '../models/User'
import { CustomContext } from 'src/types/customContext';
import { Chat } from '../models/Chat';
import * as TTypes from 'telegraf/typings/core/types/typegram';

export const sessionMiddleware = async (ctx: CustomContext, next: () => Promise<void>) => {
  if (ctx.chat && ctx.from) {
    
    const chat = await Chat.findOneAndUpdate({chatId: ctx.chat.id}, {
      chatId: ctx.chat.id,
      title: (ctx.chat as TTypes.Chat.GroupChat).title || (ctx.chat as TTypes.Chat.PrivateChat).first_name,
      type: ctx.chat.type
    },
    {
      new: true,
      upsert: true
    })
    const user = await User.findOneAndUpdate({userId: ctx.from.id}, {
      userId: ctx.from.id,
      firstName: ctx.from.first_name || '',
      lastName: ctx.from.last_name || '',
      username: ctx.from.username,
      lastInteraction: new Date()
    }, {
      new: true,
      upsert: true
    });
    ctx.session.user = user;
    ctx.session.chat = chat;

    next()
  }
}