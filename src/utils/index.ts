import { Context } from "telegraf"
import { message } from "telegraf/filters"

export const isBotMentioned = (ctx: Context): boolean => {
  if (ctx.has(message('text'))) {
    return ctx.message.reply_to_message?.from?.id === ctx.botInfo.id ||
    ctx.message.text.includes(`@${ctx.botInfo.username}`)
    
  }

  return false;
}

export const getPagination = ( current: number, maxpage: number, callbackKey: string ) => {
  var keys = [];
  if (current>1) keys.push({ text: `«1`, callback_data: `${callbackKey}:1` });
  if (current>2) keys.push({ text: `‹${current-1}`, callback_data: `${callbackKey}:${(current-1).toString()}` });
  keys.push({ text: `[${current}]`, callback_data: `${callbackKey}:${current.toString()}` });
  if (current<maxpage-1) keys.push({ text: `${current+1}›`, callback_data: `${callbackKey}:${(current+1).toString()}` })
  if (current<maxpage) keys.push({ text: `${maxpage}»`, callback_data: `${callbackKey}:${maxpage.toString()}` });

  return keys;
}