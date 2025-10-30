import { BadRequestException } from '@nestjs/common';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import {
  genderEnum,
  LanguageEnum,
  providerEnum,
  roleEnum,
} from 'src/common/utils/enums';
import { generateHash } from 'src/common/utils/security/hash.security';
import { OtpDocument } from './Otp.model';
import { IUser } from 'src/common/interfaces/user.interface';

interface IUserVirtuals {
  fullName: string;
  otp: OtpDocument[];
}

export type UserDocument = HydratedDocument<User> & IUserVirtuals;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strictQuery: true, //pranoid
})
export class User implements IUser {
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
  @Prop({
    type: String,
    enum: LanguageEnum,
    default: LanguageEnum.EN,
  })
  preferredLanguage: LanguageEnum;

  @Prop()
  phone?: string;

  @Prop({
    type: {
      count: { type: Number, default: 0 },
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

  // @Prop()
  // confirmPasswordOtp?: string;

  @Virtual()
  otp: OtpDocument[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
UserSchema.virtual('otp', {
  ref: 'Otp',
  localField: '_id',
  foreignField: 'createdBy',
});
UserSchema.virtual('fullName')
  .set(function (this: UserDocument, value: string) {
    const [firstName, lastName] = value?.split(' ');
    this.set({ firstName, lastName, slug: value.replaceAll(/\s+/g, '-') });
  })
  .get(function (this: UserDocument) {
    return this.firstName + ' ' + this.lastName;
  });

UserSchema.pre(
  'save',
  async function (
    this: UserDocument & {
      wasNew: boolean;
      confirmPasswordPlanOtp?: string | undefined;
    },
    next,
  ) {
    this.wasNew = this.isNew;
    // this.confirmPasswordPlanOtp = this.confirmEmailOtp;

    if (this.isModified('password')) {
      this.password = await generateHash({ plainText: this.password });
    }
    // if (this.isModified('confirmEmailOtp')) {
    //   this.confirmEmailOtp = await generateHash({
    //     plainText: this.confirmEmailOtp,
    //   });
    // }
    if (!this.slug?.includes('-')) {
      return next(
        new BadRequestException(
          'slug is required and must hold - like ex : any-something ',
        ),
      );
    }
  },
);
// UserSchema.post('save', async function (doc, next) {
//   const that = this as unknown as UserDocument & {
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
  if (query.paranoid == false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezeAt: { $exists: false } });
  }
  next();
});
