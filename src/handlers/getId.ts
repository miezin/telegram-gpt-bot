import { Context } from "telegraf";

export const handleGetId = async (ctx: Context) => {
    if (ctx.from && ctx.chat) {
        ctx.reply(`User Id: ${ctx.from.id.toString()}\nChat Id: ${ctx.chat.id}`)
    }
}