import { CustomContext } from "src/types/customContext";
import { Markup } from "telegraf";

export const handleAccessManager = async (ctx: CustomContext) => {
    if (ctx.from && ctx.session.user?.isAdmin && ctx.chat?.type === 'private') {
        ctx.reply(
            'Access manager',
            Markup.inlineKeyboard([
              [Markup.button.callback('Users', 'users')],
              [Markup.button.callback('Chats', 'chats')],
            ])
          )
    }
}