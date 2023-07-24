import { IChat } from "../models/Chat";
import { IUser } from "../models/User";
import { Context } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";

export interface CustomContext <U extends Update = Update> extends Context<U> {
	session: {
		user: IUser | undefined,
		chat: IChat | undefined,
	},
};