import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { emailEvent } from 'src/common/utils/Email/email.events';
import { OtpEnum } from 'src/common/utils/enums';
import { generateHash } from 'src/common/utils/security/hash.security';

export type IOtpDocument = HydratedDocument<Otp>;

@Schema({
  timestamps: true,
})
export class Otp {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: Date, required: true })
  expiredAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
  @Prop({ type: String, enum: OtpEnum, required: true })
  type: OtpEnum;

  // @Prop({
  //   type: {
  //     count: { type: Number, default: 0 },
  //     bannedUntil: { type: Date },
  //   },
  // })
  // otpAttempts?: {
  //   count?: number;
  //   bannedUntil?: Date;
  // };
}
export const OtpSchema = SchemaFactory.createForClass(Otp);
OtpSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

OtpSchema.pre(
  'save',
  async function (
    this: IOtpDocument & {
      wasNew: boolean;
      confirmPasswordPlanOtp?: string | undefined;
    },
    next,
  ) {
    this.wasNew = this.isNew;
    this.confirmPasswordPlanOtp = this.code;

    if (this.isModified('code')) {
      this.code = await generateHash({
        plainText: this.code,
      });
    }
    next();
  },
);
OtpSchema.post('save', async function (doc, next) {
  const that = this as unknown as IOtpDocument & {
    wasNew: boolean;
    confirmPasswordPlanOtp?: string | undefined;
  };
  
  // console.log(that.wasNew)
  if (that.wasNew && that.confirmPasswordPlanOtp) {
    emailEvent.emit('sendConfirmEmail', [
      undefined,
      'Confirm-Email',
      that.confirmPasswordPlanOtp,
      that.createdBy,
    ]);
  }
});
export const OtpModel = MongooseModule.forFeature([
  { name: Otp.name, schema: OtpSchema },
]);
