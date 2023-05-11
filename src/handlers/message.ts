import { message } from "telegraf/filters";
import { OpenAIStream } from "../services/openai";
import { OpenAIModelID } from "../types/openai";
import { Context } from "telegraf"
import { isBotMentioned } from '../utils'


const answerToMessage = async (ctx: Context) => {
  if (ctx.has(message('text'))) {
    try {
      const stream = await OpenAIStream(
        OpenAIModelID.GPT_3_5,
        [{
          role: 'user',
          content: ctx.message?.text
        }]
      )
  
      const placeholderMessage = await ctx.reply('...')
      console.log(stream);
      
      let charCount = 0
      let answer = ''
  
      for await (const chunk of stream) {
        const { text, status } = chunk
        const textChunk = text || ''
        answer += textChunk
        charCount += textChunk.length
  
        if (charCount >= 50 || status === 'stop') {
          await ctx.telegram.editMessageText(ctx.chat.id, placeholderMessage.message_id, undefined, answer);
          charCount = 0;
        }
      }
  
    } catch (e) {
      console.log(e)
    } 
  }
  
}


export const handleMessage = async (ctx: Context) => {

  
  if (ctx.chat && ctx.chat.type === 'private') {
    answerToMessage(ctx)
  } 
  
  if (isBotMentioned(ctx)) {

  }
}