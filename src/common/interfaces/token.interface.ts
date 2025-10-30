import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IToken {
  _id?: Types.ObjectId;
  jti: string;

  expiresIn?: number;

  userId?: Types.ObjectId |IUser;
  updatedAt?: Date;
  createdAt?: Date;
}
