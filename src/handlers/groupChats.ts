import { callbackQuery } from "telegraf/filters"
import { IChat, Chat } from "../models/Chat"
import { CustomContext } from "../types/customContext"
import { Markup } from "telegraf"
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram"
import { getPagination } from "../utils"

const mapUsersKeyboard = (users: IChat[]) => {
    return users.map(({title, _id, hasAccess}) => ([Markup.button.callback(`${title} ${hasAccess ? '✅' : '🚫'}`, `chats:${_id.toString()}`)]))
}

export const handleChatManager = async (ctx: CustomContext) => {
    if (ctx.from && ctx.session.user?.isAdmin) {
        const chatsCount = await Chat.count()
        
        const users = await Chat.find({ type: {$in: ['group', 'supergroup']}}).limit(10).skip(0)

        const chatsButtons: InlineKeyboardButton[][] = mapUsersKeyboard(users)
        if (chatsCount > 10) {
            chatsButtons.push(getPagination(1, Math.ceil(chatsCount / 10), 'paginateChats'))
        }

        await ctx.editMessageText('Group chats', Markup.inlineKeyboard(chatsButtons))
    }
}

export const handleChatsPaginate = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data'))) {
        const [_, page] = ctx.callbackQuery.data.split(':')
        const chatsCount = await Chat.count()
        const chats = await Chat.find().limit(10).skip((Number(page) - 1) * 10)

        const usersButtons = mapUsersKeyboard(chats)
        await ctx.editMessageText('Users', Markup.inlineKeyboard([
            ...usersButtons,
            getPagination(Number(page), Math.ceil(chatsCount / 10), 'paginateChats')
        ]))
    }
}



export const handleChatManagerEdit = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data'))) {
        const [_, _id] = ctx.callbackQuery.data.split(':')
        const chat = await Chat.findOne({_id})

        if (chat) {
            const action = chat.hasAccess ? 'revoke' : 'grant'

            await ctx.editMessageText(`${chat.title}`, Markup.inlineKeyboard([
                [Markup.button.callback(`${action[0].toUpperCase()}${action.slice(1)} access`, `${action}:${_id}`)]
            ]))
        }
    }
}

export const handleChatChangeAccess = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data'))) {
        const [action, _id] = ctx.callbackQuery.data.split(':')
        const chat = await Chat.findOneAndUpdate({_id}, {
            hasAccess: action === 'grant' ? true : false
        })
        if (chat) {
            await ctx.editMessageText(`Acces ${action}ed for group chat "${chat.title}"`)
        }
    }
}