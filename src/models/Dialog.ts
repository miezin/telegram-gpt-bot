import { Schema, Types, model } from 'mongoose';
import { IUser } from './User';


export interface IDialog {
  chatId: Number;
  initiator: IUser;
  messages: IMessage[];
  tokensUsed: Number;
}

export interface IMessage {
  role: 'user' | 'assistant'
  content: string;
}

const messageSchema = new Schema<IMessage>({
  content: String,
  role: {type: String, enum: ['user', 'assistant']}
}, {_id: false})

const dialogSchema = new Schema<IDialog>({
  chatId: { type: Number, required: true },
  initiator: { type: Schema.Types.ObjectId, ref: 'User' },
  messages: [messageSchema],
  tokensUsed: Number
});

export const Dialog = model<IDialog>('Dialog', dialogSchema);