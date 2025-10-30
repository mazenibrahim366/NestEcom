import { Types } from 'mongoose';
import { OtpDocument } from 'src/DB/models/Otp.model';
import {
  genderEnum,
  LanguageEnum,
  providerEnum,
  roleEnum,
} from '../utils/enums';
import { IOtp } from './otp.interface';

export interface IUser {
  _id?: Types.ObjectId;
  firstName: string;

  lastName: string;

  slug: string;

  email: string;

  password?: string;

  provider: providerEnum;

  preferredLanguage: LanguageEnum;

  phone?: string;

  otpAttempts?: {
    count?: number;
    bannedUntil?: Date;
  };

  picture?: string;

  temProfileImage?: string;

  pictureCover?: string[];

  gender: genderEnum;

  role: roleEnum;

  confirmEmail?: Date;

  deletedAt?: Date;

  freezeAt?: Date;

  freezeBy?: Types.ObjectId;

  restoreAt?: Date;

  restoreBy?: Types.ObjectId;

  oldPassword?: string[];

  updatePassword?: Date;

  changeCredentialsTime?: Date;

  otp?: OtpDocument[] | IOtp[];
  updatedAt?: Date;
  createdAt?: Date;
    fullName?: string;

}
