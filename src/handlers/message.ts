import { message } from "telegraf/filters";
import { OpenAIStream } from "../services/openai";
import { OpenAIModelID } from "../types/openai";
import { Context } from "telegraf"
import { isBotMentioned } from '../utils'
import { Chat } from "../models/Chat";
import { IMessage } from "../models/Chat";
import { User } from "../models/User";
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken } from '@dqbd/tiktoken/lite';
import { OpenAIModels } from "../types/openai";
import { resetDialog } from "./newDialog";
import { DEFAULT_SYSTEM_PROMPT } from "../config";
import { CustomContext } from "../types/customContext";

const pendingReplies = new Set<number>()

interface TelegramError {
  parameters: {
    ok: boolean;
    error_code: number;
    description: string;
    retry_after: number;
  }
}

const updateDialog = async (ctx: Context, role: IMessage['role'], content: string) => {
  if (ctx.has(message('text'))) {
    const dialog = await Chat.findOne({chatId: ctx.chat.id})
    if (dialog) {
      const message = {role, content}
      dialog.messages.push(message)
      await dialog.save()
    } else {
      const user = await User.findOne({userId: ctx.from.id})
      if (user) {
        const dialog = new Chat({
          chatId: ctx.chat.id,
          initiator: user._id,
          messages: [{role, content}]
        })
        await dialog.save()
      }
    }
  } 
}

const getCurrentDialogMessages = async (chatId: number): Promise<IMessage[]> => {
  const dialog = await Chat.findOne({chatId}, { messages: { _id: 0}})
  return dialog && dialog.messages.length
    ? dialog.messages
    :  []
}

const answerToMessage = async (ctx: Context) => {
  if (ctx.has(message('text'))) {
    if (pendingReplies.has(ctx.chat.id)) {
      ctx.reply('Please wait for a response to your previous question.')
    } else {
      try {
        pendingReplies.add(ctx.chat.id)
        await updateDialog(ctx, 'user', ctx.message.text)
        let messages = await getCurrentDialogMessages(ctx.chat.id)

        const encoding = new Tiktoken(
          tiktokenModel.bpe_ranks,
          tiktokenModel.special_tokens,
          tiktokenModel.pat_str,
        );

        const model = OpenAIModels[OpenAIModelID.GPT_3_5]

        let promptTokenCount = 0;

        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          const tokens = encoding.encode(message.content);
    
          if (promptTokenCount + tokens.length + 1000 > model.tokenLimit) {
            ctx.reply(`Starting a new dialogue context because the token limit is exceeded.`)
            await resetDialog(ctx.chat.id, [{role: 'user', content: ctx.message.text}])
            messages = messages.slice(messages.length - 1);
            break;
          }
          promptTokenCount += tokens.length;
        }


        const stream = await OpenAIStream(
          model.id,
          messages,
          DEFAULT_SYSTEM_PROMPT
        )
        
        let placeholderMessage = await ctx.reply('...')

        let answer = ''
        let previousAnswer = ''
        await ctx.sendChatAction('typing')
        for await (const chunk of stream) {
          const { text, status } = chunk
          const textChunk = text || ''
          answer += textChunk;

          if (answer.length >= 4096) {
            answer = textChunk
            placeholderMessage = await ctx.reply(answer)
          } else {
            if (answer.length - previousAnswer.length > 100 || status == 'stop') {
              try {
                await ctx.telegram.editMessageText(ctx.chat.id, placeholderMessage.message_id, undefined, answer);
              } catch (e) {
                const error = e as TelegramError;
                await new Promise(res => setTimeout(res, error.parameters.retry_after * 100))
                await ctx.telegram.editMessageText(ctx.chat.id, placeholderMessage.message_id, undefined, answer);
              }

              previousAnswer = answer
            }
            
          }          
        }

        await updateDialog(ctx, 'assistant', answer)
        pendingReplies.delete(ctx.chat.id)
      } catch (e) {
        console.error('Error', e)
        pendingReplies.delete(ctx.chat.id)
      } 
    }
  }
  
}


export const handleMessage = async (ctx: CustomContext) => {
  if (ctx.chat && ctx.chat.type === 'private' || isBotMentioned(ctx)) {
    const user = ctx.session.user;
    const chat = ctx.session.chat;
    if (
      user?.hasAccess
      || user?.isAdmin
      || chat?.hasAccess
      || user?.userId === Number(process.env.ADMIN_ID)
      ) {
        answerToMessage(ctx)
    }
  } 
}