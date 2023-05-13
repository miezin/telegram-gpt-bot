import { message } from "telegraf/filters";
import { OpenAIStream } from "../services/openai";
import { OpenAIModelID } from "../types/openai";
import { Context, Telegraf } from "telegraf"
import { isBotMentioned } from '../utils'
import { Dialog } from "../models/Dialog";
import { IMessage } from "../models/Dialog";
import { User } from "../models/User";
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken } from '@dqbd/tiktoken/lite';
import { OpenAIModels } from "../types/openai";
import { resetDialog } from "./newDialog";

const pendingReplies = new Set<number>()

const updateDialog = async (ctx: Context, role: IMessage['role'], content: string) => {
  if (ctx.has(message('text'))) {
    const dialog = await Dialog.findOne({chatId: ctx.chat.id})
    if (dialog) {
      const message = {role, content}
      dialog.messages.push(message)
      await dialog.save()
    } else {
      const user = await User.findOne({userId: ctx.from.id})
      if (user) {
        console.log([{role, content}])
        const dialog = new Dialog({
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
  const dialog = await Dialog.findOne({chatId}, { messages: { _id: 0}})
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
          messages.slice(messages.length - 1)
        )

        const placeholderMessage = await ctx.reply('...')
        await ctx.sendChatAction('typing')
  
        let charCount = 0
        let answer = ''
        
        for await (const chunk of stream) {
          const { text, status } = chunk
          const textChunk = text || ''
          answer += textChunk
          charCount += textChunk.length
          
          if (charCount >= 100 || status === 'stop') {
            await ctx.telegram.editMessageText(ctx.chat.id, placeholderMessage.message_id, undefined,  answer);
            charCount = 0;
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


export const handleMessage = async (ctx: Context) => {
  if (ctx.chat && ctx.chat.type === 'private' || isBotMentioned(ctx)) {
    answerToMessage(ctx)
  } 
}