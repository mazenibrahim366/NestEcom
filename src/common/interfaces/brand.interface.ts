import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IBrand {
  _id?: Types.ObjectId;

  name: string;
  slug: string;
  slogan: string;
  description?: string;
  createdBy?: Types.ObjectId | IUser;
  image: string;
  updatedBy?: Types.ObjectId | IUser;

  deletedAt?: Date;
  freezeAt?: Date;
  freezeBy?: Types.ObjectId;
  restoreAt?: Date;
  restoreBy?: Types.ObjectId;

  updatedAt?: Date;
  createdAt?: Date;
}
