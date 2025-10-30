import { Types } from 'mongoose';
import { OtpEnum } from '../utils/enums';
import { IUser } from './user.interface';

export interface IOtp {
  _id?: Types.ObjectId;
  code: string;
  expiredAt?: Date;
  createdBy: Types.ObjectId |IUser;
  type: OtpEnum;
  updatedAt?: Date;
  createdAt?: Date;
}
