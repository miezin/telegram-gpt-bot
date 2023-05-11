


import { Context } from "telegraf"
import { OpenAIModelID } from "../types/openai";
import { OpenAIStream } from "../services/openai";

export const handleStart = async (ctx: Context) => {
  ctx.reply('Handle start');
}