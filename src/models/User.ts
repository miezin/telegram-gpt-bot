import { Schema, Types, model } from 'mongoose';


export interface IUser {
  userId: Number;
  username: String;
  firstName: String;
  lastName?: String;
  lastInteraction: Date;
  activeDialog: Types.ObjectId,
  tokensUsed: Number;
}

const userSchema = new Schema<IUser>({
  userId: { type: Number, required: true },
  firstName: { type: String, required: true },
  lastName: String,
  username: { type: String, required: true },
  lastInteraction: Date,
  activeDialog: { type: Schema.Types.ObjectId, ref: 'Dialog' },
  tokensUsed: Number
});

export const User = model<IUser>('User', userSchema);