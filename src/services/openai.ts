


import { OpenAIModel, OpenAIModelID } from '../types/openai'
import { IMessage } from '../models/Dialog'
import { OPENAI_API_KEY, OPENAI_MODEL, DEFAULT_TEMPERATURE, DEFAULT_SYSTEM_PROMPT } from "../config"
import { ReadableStream } from 'node:stream/web';
import axios from 'axios';
import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';


export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: string,
  messages: IMessage[],
  systemPrompt: string = '',
  temperature? : number,
  key?: string,
) => {
  let url = 'https://api.openai.com/v1/chat/completions'

  const res = await axios.post(url, {
    model: model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: true,
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    responseType: 'stream'
  })

  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.data;
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          result?.value || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            controller.enqueue({
              text,
              status: json.choices[0].finish_reason
            });

            if (json.choices[0].finish_reason != null) {
              controller.close();
              return;
            }
            
          } catch (e) {
            console.log(data)
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.data as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  });

  return stream;
};

