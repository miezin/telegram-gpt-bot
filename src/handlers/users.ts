import { callbackQuery } from "telegraf/filters"
import { IUser, User } from "../models/User"
import { CustomContext } from "../types/customContext"
import { Markup } from "telegraf"
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram"
import { getPagination } from "../utils"

const mapUsersKeyboard = (users: IUser[]) => {
    return users.map(({username, firstName, lastName, _id, hasAccess}) => ([Markup.button.callback(`${firstName} ${lastName} | ${username} ${hasAccess ? '✅' : '🚫'}`, `users:${_id.toString()}`)]))
}

export const handleUserManager = async (ctx: CustomContext) => {
    if (ctx.from && ctx.session.user?.isAdmin) {
        const usersCount = await User.count()
        
        const users = await User.find().limit(10).skip(0)

        const usersButtons: InlineKeyboardButton[][] = mapUsersKeyboard(users)
        if (usersCount > 10) {
            usersButtons.push(getPagination(1, Math.ceil(usersCount / 10), 'paginateUsers'))
        }

        await ctx.editMessageText('Users', Markup.inlineKeyboard(usersButtons))
    }
}

export const handleUsersPaginate = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data')) && ctx.session.user?.isAdmin) {
        const [_, page] = ctx.callbackQuery.data.split(':')
        const usersCount = await User.count()
        const users = await User.find().limit(10).skip((Number(page) - 1) * 10)

        const usersButtons = mapUsersKeyboard(users)
        await ctx.editMessageText('Users', Markup.inlineKeyboard([
            ...usersButtons,
            getPagination(Number(page), Math.ceil(usersCount / 10), 'paginateUsers')
        ]))
    }
}



export const handleUserManagerEdit = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data')) && ctx.session.user?.isAdmin) {
        const [_, _id] = ctx.callbackQuery.data.split(':')
        const user = await User.findOne({_id})

        if (user) {
            const {firstName, lastName, username} = user
            const action = user.hasAccess ? 'revoke' : 'grant'

            await ctx.editMessageText(`${firstName} ${lastName} | ${username}`, Markup.inlineKeyboard([
                [Markup.button.callback(`${action[0].toUpperCase()}${action.slice(1)} access`, `${action}:${_id}`)]
            ]))
        }
    }
}

export const handleUserChangeAccess = async (ctx: CustomContext) => {
    if (ctx.has(callbackQuery('data')) && ctx.session.user?.isAdmin) {
        const [action, _id] = ctx.callbackQuery.data.split(':')
        const user = await User.findOneAndUpdate({_id}, {
            hasAccess: action === 'grant' ? true : false
        })
        if (user) {
            const {firstName, lastName, username} = user
        await ctx.editMessageText(`Acces ${action}ed for user "${firstName} ${lastName} | ${username}"`)
        }
    }
}