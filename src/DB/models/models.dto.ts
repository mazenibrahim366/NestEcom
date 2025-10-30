import type { Document, Types } from 'mongoose';
import mongoose from 'mongoose';
import { genderEnum, providerEnum, roleEnum } from '../../common/utils/enums';
export enum AllowCommentsEnum {
  allow = 'allow',
  deny = 'deny',
}
export enum AvailabilityEnum {
  public = 'public',
  friends = 'friends',
  onlyMe = 'only-me',
}
export enum LikeActionEnum {
  like = 'like',
  unlike = 'unlike',
}
