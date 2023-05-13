import { Context } from "telegraf";
import { message } from "telegraf/filters";

export const handleAccessManager = async (ctx: Context) => {
    if (ctx.from && ctx.from.id === Number(process.env.ADMIN_ID)) {
        ctx.reply(' ')
    }
}