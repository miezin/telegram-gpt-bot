import { Context,  } from 'telegraf'
import { isBotMentioned } from '../utils'
import { message } from 'telegraf/filters'
import { User } from '../models/User'

export const sessionMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  if (ctx.has(message('text'))) {
    if (ctx.chat.type === 'private' || isBotMentioned(ctx)) {
      await User.findOneAndUpdate({userId: ctx.from.id}, {
        userId: ctx.from.id,
        firstName: ctx.from.first_name || '',
        lastName: ctx.from.last_name || '',
        username: ctx.from.username,
        lastInteraction: new Date()
      }, {
        new: true,
        upsert: true
      });
    }
  }

  next()
}