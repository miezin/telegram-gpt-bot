import { ObjectId, Schema, Types, model } from 'mongoose';


export interface IUser {
  userId: number;
  username: string;
  firstName: string;
  lastName?: string;
  lastInteraction: Date;
  activeDialog: Types.ObjectId,
  tokensUsed: number;
  hasAccess: boolean;
  isAdmin: boolean;
  _id: ObjectId;
}

const userSchema = new Schema<IUser>({
  userId: { type: Number, required: true },
  firstName: { type: String, required: true },
  lastName: String,
  username: { type: String, required: true },
  lastInteraction: Date,
  activeDialog: { type: Schema.Types.ObjectId, ref: 'Dialog' },
  tokensUsed: Number,
  hasAccess: {type: Boolean, default: false },
  isAdmin: {type: Boolean, default: false }
});

export const User = model<IUser>('User', userSchema);