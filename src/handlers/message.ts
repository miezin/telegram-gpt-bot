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

const pendingReplies = new Set<number>()

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

        const model = OpenAIModels[OpenAIModelID.GPT_4]

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
          messages.slice(messages.length - 1),
          DEFAULT_SYSTEM_PROMPT
        )
        
        let placeholderMessage = await ctx.reply('...')

        let answer = ''
        let previousAnswer = ''
        
        for await (const chunk of stream) {
          const { text, status } = chunk
          const textChunk = text || ''
          answer += textChunk;

          if (answer.length >= 4096) {
            answer = textChunk
            placeholderMessage = await ctx.reply(answer)
          } else {
            const chunkSize = ctx.chat.type === 'private' ? 100 : 200;
            if (answer.length - previousAnswer.length > chunkSize || status == 'stop') {
              await ctx.sendChatAction('typing')
              await ctx.telegram.editMessageText(ctx.chat.id, placeholderMessage.message_id, undefined, answer);
              await new Promise(res => setTimeout(res, 1000))
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


export const handleMessage = async (ctx: Context) => {
  if (ctx.chat && ctx.chat.type === 'private' || isBotMentioned(ctx)) {
    answerToMessage(ctx)
  } 
}