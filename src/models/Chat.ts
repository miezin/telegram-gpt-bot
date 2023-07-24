import { ObjectId, Schema, model } from 'mongoose';
import { IUser } from './User';


export interface IChat {
  chatId: number;
  type: string;
  title: string;
  initiator: IUser;
  messages: IMessage[];
  tokensUsed: number;
  hasAccess: boolean;
  _id: ObjectId;
}

export interface IMessage {
  role: 'user' | 'assistant'
  content: string;
}

const messageSchema = new Schema<IMessage>({
  content: String,
  role: {type: String, enum: ['user', 'assistant']}
}, {_id: false})

const chatSchema = new Schema<IChat>({
  chatId: { type: Number, required: true },
  type: {type: String, enum: ['private', 'group', 'supergroup']},
  title: String,
  initiator: { type: Schema.Types.ObjectId, ref: 'User' },
  hasAccess: Boolean,
  messages: [messageSchema],
  tokensUsed: Number
});

export const Chat = model<IChat>('Chat', chatSchema);