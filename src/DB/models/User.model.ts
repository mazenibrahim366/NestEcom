import { BadRequestException } from '@nestjs/common';
import { genderEnum, providerEnum, roleEnum } from '../../utils/enums';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { emailEvent } from 'src/utils/Email/email.events';
import { generateHash } from 'src/utils/security/hash.security';

interface IUserVirtuals {
  fullName: string;
}

export type IUserDocument = HydratedDocument<User> & IUserVirtuals;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true, //pranoid
})
export class User {
  @Prop({ required: true, minlength: 2, maxlength: 20 })
  firstName: string;

  @Prop({ required: true, minlength: 2, maxlength: 20 })
  lastName: string;

  @Prop({ required: true, minlength: 5, maxlength: 51 })
  slug: string;

  @Prop({ unique: true, required: true, minlength: 2 })
  email: string;

  @Prop({
    required: function (this: User) {
      return this.provider === providerEnum.system;
    },
    minlength: 2,
  })
  password?: string;

  @Prop({
    enum: Object.values(providerEnum),
    default: providerEnum.system,
  })
  provider: providerEnum;

  @Prop()
  phone?: string;

  @Prop({
    required: function (this: User) {
      return this.provider === providerEnum.system;
    },
  })
  confirmEmailOtp?: string;

  @Prop({
    required: function (this: User) {
      return this.provider === providerEnum.system;
    },
  })
  otpExpired?: Date;

  @Prop({
    type: {
      count: { type: Number , default: 0 },
      bannedUntil: { type: Date },
    },
  })
  otpAttempts?: {
    count?: number;
    bannedUntil?: Date;
  };

  @Prop()
  picture?: string;

  @Prop()
  temProfileImage?: string;

  @Prop([String])
  pictureCover?: string[];

  @Prop({
    enum: Object.values(genderEnum),
    default: genderEnum.male,
  })
  gender: genderEnum;

  @Prop({
    enum: Object.values(roleEnum),
    default: roleEnum.User,
  })
  role: roleEnum;

  @Prop()
  confirmEmail?: Date;

  @Prop()
  deletedAt?: Date;

  @Prop()
  freezeAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  freezeBy?: Types.ObjectId;

  @Prop()
  restoreAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  restoreBy?: Types.ObjectId;

  @Prop([String])
  oldPassword?: string[];

  @Prop()
  updatePassword?: Date;

  @Prop()
  changeCredentialsTime?: Date;

  @Prop()
  confirmPasswordOtp?: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  friend?: Types.ObjectId[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }])
  blockList?: Types.ObjectId[];
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.virtual('fullName')
  .set(function (this: IUserDocument, value: string) {
    const [firstName, lastName] = value?.split(' ');
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') });
  })
  .get(function (this: IUserDocument) {
    return this.firstName + ' ' + this.lastName;
  });

UserSchema.pre(
  'save',
  async function (
    this: IUserDocument & {
      wasNew: boolean;
      confirmPasswordPlanOtp?: string | undefined;
    },
    next,
  ) {
    this.wasNew = this.isNew;
    this.confirmPasswordPlanOtp = this.confirmEmailOtp;

    if (this.isModified('password')) {
      this.password = await generateHash({ plainText: this.password });
    }
    if (this.isModified('confirmEmailOtp')) {
      this.confirmEmailOtp = await generateHash({
        plainText: this.confirmEmailOtp,
      });
    }
    if (!this.slug?.includes('-')) {
      return next(
        new BadRequestException(
          'slug is required and must hold - like ex : any-something ',
        ),
      );
    }
  },
);
UserSchema.post('save', async function (doc, next) {
  const that = this as unknown as IUserDocument & {
    wasNew: boolean;
    confirmPasswordPlanOtp?: string | undefined;
  };
  // console.log(that.wasNew)
  if (that.wasNew && that.confirmPasswordPlanOtp) {
    emailEvent.emit('sendConfirmEmail', [
      this.email,
      'Confirm-Email',
      that.confirmPasswordPlanOtp,
    ]);
  }
});
UserSchema.pre(['findOne', 'find'], function (next) {
  const query = this.getQuery();
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } });
  }
  next();
});

UserSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
  const query = this.getQuery();
  // console.log(this)
  if (query.paranoid == false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } });
  }
  next();
});

// const userSchema = new mongoose.Schema<IUserDocument>(
//   {
//     firstName: { type: String, required: true, minLength: 2, maxLength: 20 },
//     lastName: { type: String, required: true, minLength: 2, maxLength: 20 },
//     slug: { type: String, required: true, minLength: 5, maxLength: 51 },
//     email: { type: String, unique: true, required: true, minLength: 2 },
//     password: {
//       type: String,
//       required: function (this: IUser) {
//         return this.provider === providerEnum.system ? true : false;
//       },
//       minLength: 2,
//     },
//     provider: {
//       type: String,
//       enum: { values: Object.values(providerEnum) },
//       default: providerEnum.system,
//     },
//     phone: { type: String },
//     confirmEmailOtp: {
//       type: String,
//       required: function (this: IUser) {
//         return this.provider === providerEnum.system ? true : false;
//       },
//     },
//     otpExpired: {
//       type: Date,
//       required: function (this: IUser) {
//         return this.provider === providerEnum.system ? true : false;
//       },
//     },
//     otpAttempts: {
//       count: { type: Number, default: 0 },
//       bannedUntil: { type: Date },
//     },
//     picture: String,
//     temProfileImage: String,
//     pictureCover: [String],
//     gender: {
//       type: String,
//       enum: {
//         values: Object.values(genderEnum),
// //        message: `gender only allow ${Object.values(genderEnum)} `,
//       },
//       default: genderEnum.male,
//     },
//     role: {
//       type: String,
//       enum: {
//         values: Object.values(roleEnum),
////message: `role only allow ${Object.values(roleEnum)} `,
//       },
//       default: roleEnum.User,
//     },
//     confirmEmail: { type: Date },
//     deletedAt: { type: Date },
//     freezeAt: { type: Date },
//     freezeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     restoreAt: Date,
//     restoreBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     oldPassword: [String],
//     updatePassword: { type: Date },
//     changeCredentialsTime: { type: Date },
//     confirmPasswordOtp: { type: String },
//     friend: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//     blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//     strictQuery: true, // pranoid
//   },
// );

// userSchema
//   .virtual('fullName')
//   .set(function (this: IUser, value: string) {
//     const [firstName, lastName] = value?.split(' ');
//     this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') });
//   })
//   .get(function (this: IUser) {
//     return this.firstName + ' ' + this.lastName;
//   });

// userSchema.pre(
//   'save',
//   async function (
//     this: IUser & {
//       wasNew: boolean;
//       confirmPasswordPlanOtp?: string | undefined;
//     },
//     next,
//   ) {
//     this.wasNew = this.isNew;
//     this.confirmPasswordPlanOtp = this.confirmEmailOtp;

//     if (this.isModified('password')) {
//       this.password = await generateHash({ plainText: this.password });
//     }
//     if (this.isModified('confirmEmailOtp')) {
//       this.confirmEmailOtp = await generateHash({
//         plainText: this.confirmEmailOtp,
//       });
//     }
//     if (!this.slug?.includes('-')) {
//       return next(
//         new BadError(
//           'slug is required and must hold - like ex : any-something ',
//         ),
//       );
//     }
//   },
// );
// userSchema.post('save', async function (doc, next) {
//   const that = this as unknown as IUser & {
//     wasNew: boolean;
//     confirmPasswordPlanOtp?: string | undefined;
//   };
//   // console.log(that.wasNew)
//   if (that.wasNew && that.confirmPasswordPlanOtp) {
//     emailEvent.emit('sendConfirmEmail', [
//       this.email,
//       'Confirm-Email',
//       that.confirmPasswordPlanOtp,
//     ]);
//   }
// });
// userSchema.pre(['findOne', 'find'], function (next) {
//   const query = this.getQuery();
//   // console.log(this)
//   if (query.paranoid == false) {
//     this.setQuery({ ...query });
//   } else {
//     this.setQuery({ ...query, freezeAt: { $exists: false } });
//   }
//   next();
// });

// userSchema.pre(['findOneAndUpdate', 'updateOne'], function (next) {
//   const query = this.getQuery();
//   // console.log(this)
//   if (query.paranoid == false) {
//     this.setQuery({ ...query });
//   } else {
//     this.setQuery({ ...query, freezeAt: { $exists: false } });
//   }
//   next();
// });

// // userSchema.pre(['updateOne'], async function (next) {
// //   // const query = this.getQuery()
// //   const update = this.getUpdate() as UpdateQuery<IUser>

// //   if (update.freezeAt) {
// //     this.setUpdate({...update, changeCredentialsTime: new Date()})
// //   }
// // })
// // userSchema.post(['updateOne'], async function (doc,next) {
// //   const query = this.getQuery()
// //   const update = this.getUpdate() as UpdateQuery<IUser>

// //   if (update["$set"].changeCredentialsTime) {

// //   const TokenModel = new TokenRepository(TokenModels)
// // await TokenModel.deleteMany({filter:{userId:query._id}})

// //   }
// // })
// // userSchema.post(['deleteOne'], async function (doc,next) {
// //   const query = this.getQuery()
// //   const update = this.getUpdate() as UpdateQuery<IUser>

// //   if (update["$set"].changeCredentialsTime) {

// //   const TokenModel = new TokenRepository(TokenModels)
// // await TokenModel.deleteMany({filter:{userId:query._id}})

// //   }
// // })
// const UserModels =
//   mongoose.models.User || mongoose.model<IUser>('User', userSchema);

// UserModels.syncIndexes();

// export default UserModels;

// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { HydratedDocument } from 'mongoose';

// export type UserDocument = HydratedDocument<IUser>;

// @Schema()
// export class User {
//   @Prop({ type: String, required: true, minLength: 2, maxLength: 20 })
//   firstName: string;
//   @Prop()
//   lastName: { type: String; required: true; minLength: 2; maxLength: 20 };
//   @Prop()
//   slug: { type: String; required: true; minLength: 5; maxLength: 51 };
//   @Prop()
//   email: { type: String; unique: true; required: true; minLength: 2 };
//   @Prop({
//     required: function (this: IUser) {
//       return this.provider === providerEnum.system ? true : false;
//     },
//   })
//   password: {
//     type: String;

//     minLength: 2;
//   };

//   @Prop({ enum: { values: Object.values(providerEnum) } })
//   provider: {
//     type: String;

//     default: providerEnum.system;
//   };
//   @Prop()
//   phone: { type: String };
//   @Prop({
//     required: function (this: IUser) {
//       return this.provider === providerEnum.system ? true : false;
//     },
//   })
//   confirmEmailOtp: {
//     type: String;
//   };
//   @Prop({
//     required: function (this: IUser) {
//       return this.provider === providerEnum.system ? true : false;
//     },
//   })
//   otpExpired: {
//     type: Date;
//   };
//   @Prop()
//   otpAttempts: {
//     count: { type: Number; default: 0 };
//     bannedUntil: { type: Date };
//   };
//   @Prop()
//   picture: String;
//   @Prop()
//   temProfileImage: String;
//   @Prop()
//   pictureCover: [String];
//   @Prop({
//     enum: {
//       values: Object.values(genderEnum),
//       message: `gender only allow ${Object.values(genderEnum)} `,
//     },
//   })
//   gender: {
//     type: String;

//     default: genderEnum.male;
//   };
//   @Prop({
//     enum: {
//       values: Object.values(roleEnum),
//       message: `role only allow ${Object.values(roleEnum)} `,
//     },
//   })
//   role: {
//     type: String;

//     default: roleEnum.User;
//   };
//   @Prop()
//   confirmEmail: { type: Date };
//   @Prop()
//   deletedAt: { type: Date };
//   @Prop()
//   freezeAt: { type: Date };

//   @Prop()
//   freezeBy: { type: mongoose.Schema.Types.ObjectId; ref: 'User' };
//   @Prop()
//   restoreAt: Date;
//   @Prop()
//   restoreBy: { type: mongoose.Schema.Types.ObjectId; ref: 'User' };
//   @Prop()
//   oldPassword: [String];
//   @Prop()
//   updatePassword: { type: Date };
//   @Prop()
//   changeCredentialsTime: { type: Date };
//   @Prop()
//   confirmPasswordOtp: { type: String };
//   @Prop()
//   friend: [{ type: mongoose.Schema.Types.ObjectId; ref: 'User' }];
//   @Prop()
//   blockList: [{ type: mongoose.Schema.Types.ObjectId; ref: 'User' }];
// }

// export const UserSchema = SchemaFactory.createForClass(User);
