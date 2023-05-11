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
  content: String;
}

const dialogSchema = new Schema<IDialog>({
  chatId: { type: Number, required: true },
  initiator: { type: Schema.Types.ObjectId, ref: 'User' },
  messages: [{
    content: String,
    role: {enum: ['user', 'assistant']}
  }],
  tokensUsed: Number
});

export const Dialog = model<IDialog>('User', dialogSchema);