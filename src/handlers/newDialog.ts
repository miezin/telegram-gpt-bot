import { Dialog, IMessage } from "../models/Dialog";
import { Context } from "telegraf";
import { message } from 'telegraf/filters'

export const resetDialog = async (chatId: number, messages: IMessage[] = []) => {
    await Dialog.findOneAndUpdate({chatId}, { messages })
}

export const handleNewDialog = async (ctx: Context) => {
    if (ctx.chat) {
        resetDialog(ctx.chat.id)
        ctx.reply('Previous dialog context has been cleared')
    }
}