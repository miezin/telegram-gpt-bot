import { Chat, IMessage } from "../models/Chat";
import { Context } from "telegraf";

export const resetDialog = async (chatId: number, messages: IMessage[] = []) => {
    await Chat.findOneAndUpdate({chatId}, { messages })
}

export const handleNewDialog = async (ctx: Context) => {
    if (ctx.chat) {
        resetDialog(ctx.chat.id)
        ctx.reply('Previous dialog context has been cleared')
    }
}