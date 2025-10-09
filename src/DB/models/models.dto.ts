import type { Document, Types } from 'mongoose'
import mongoose from 'mongoose'
import { genderEnum, providerEnum, roleEnum } from '../../utils/enums'
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
export interface IUser extends Document {
  firstName: string
  lastName: string
  email: string
  password?: string
  slug: string
  provider: providerEnum
  phone?: string
  confirmEmailOtp?: string
  otpExpired?: Date
  otpAttempts: {
    count: number
    bannedUntil?: Date | null
  }
  temProfileImage?: String
  picture?: string
  pictureCover?: {
    public_id?: string
    secure_url?: string
  }[]
  gender: genderEnum
  role: roleEnum
  confirmEmail?: Date
  deletedAt?: Date
  freezeAt?: Date
  freezeBy?: mongoose.Types.ObjectId
  restoreBy?: mongoose.Types.ObjectId
  restoreAt?: Date
  oldPassword: string[]
  updatePassword?: Date
  changeCredentialsTime?: Date
  confirmPasswordOtp?: string
  friend?: string[]
  blockList?: string[]
  fullName: string
}

export interface IToken extends Document {
  jti: string
  expiresIn: number
  userId?: mongoose.Types.ObjectId
}
export interface IPost extends Document {
  content?: string
  attachments?: string[]
  availability?: AvailabilityEnum
  allowComments?: AllowCommentsEnum
  assetsFolderId: string
  tag?: Types.ObjectId[]
  likes?: Types.ObjectId[]
  createdBy: Types.ObjectId

  freezeBy?: Types.ObjectId
  freezeAt?: Date
  comments?: Partial<IComment>[]

  restoredBy?: Types.ObjectId
  restoredAt?: Date
  createdAt?: Date
  updatedAt?: Date
}
export interface IComment extends Document {
  content?: string
  attachments?: string[]

  tag?: Types.ObjectId[]
  likes?: Types.ObjectId[]
  createdBy: Types.ObjectId
  postId: Types.ObjectId | Partial<IPost>
  replyComment?: Partial<IComment>[] //|  Partial<IComment>
  commentId?: Types.ObjectId
  freezeBy?: Types.ObjectId
  freezeAt?: Date

  restoredBy?: Types.ObjectId
  restoredAt?: Date
  createdAt?: Date
  updatedAt?: Date
}
export interface IFriendRequest extends Document {
  createdBy: Types.ObjectId
  sendTo: Types.ObjectId

  acceptedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}
export interface IChat extends Document {
  participants: Types.ObjectId[]
  message: IMessage[]

  group?: string
  group_image?: string
  roomId?: string

  createdBy: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}
export interface IMessage extends Document {
  content: string
  createdBy: Types.ObjectId
  sendTo: Types.ObjectId

  createdAt?: Date
  updatedAt?: Date
}
