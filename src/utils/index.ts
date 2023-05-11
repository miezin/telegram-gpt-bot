import { Context } from "telegraf"
import { message } from "telegraf/filters"

export const isBotMentioned = (ctx: Context): boolean => {
  if (ctx.has(message('text'))) {
    return ctx.message.reply_to_message?.from?.id === ctx.botInfo.id ||
    ctx.message.text.includes(`@${ctx.botInfo.username}`)
    
  }

  return false;
}