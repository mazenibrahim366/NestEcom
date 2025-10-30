import { customAlphabet } from 'nanoid';

import { log } from 'console';

import { UserDocument } from '../../../DB/models/User.model';
import { UserRepository } from '../../../DB/repository/user.repository';
import { OtpEnum, providerEnum } from '../enums';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpRepository } from 'src/DB/repository';
import { generateHash } from '../security/hash.security';
import { emailEvent } from './email.events';

@Injectable()
export class confirmEmailOtpService {
  constructor(
    private readonly UserModel: UserRepository,
    private readonly OtpModel: OtpRepository,
  ) {}
  newConfirmOtp = async ({
    email = '',
    subject = 'Confirm-Email',
  }: {
    email: string;
    subject?: string;
  }) => {
    const user: UserDocument | null = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: false },
        // confirmEmailOtp: { $exists: true },
      },
      option: {
        populate: {
          path: 'otp',
          match: { type: OtpEnum.confirmEmail },
        },
      },
    });
    console.log(user);

    if (!user) {
      throw new NotFoundException('In-valid account');
    }
    if (
      user.otp[0] &&
      user.otp[0].expiredAt &&
      user.otp[0].expiredAt > new Date()
    ) {
      throw new UnauthorizedException(
        `wait is not expired , expireDate : ${user.otp[0].expiredAt.toLocaleTimeString()}`,
      );
    }
    if (
      user.otpAttempts &&
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new BadRequestException(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
      );
    }

    const otp = customAlphabet('0123456789', 6)();

    const hashOto = await generateHash({ plainText: otp });
    const findUserOtp = await this.OtpModel.findOne({
      filter: {
        createdBy: user._id,
        type: OtpEnum.confirmEmail,
        expiredAt: { $gt: new Date() },
      },
    });
    if (findUserOtp) {
      throw new NotFoundException('Please wait until current OTP expires ');
    }
    await this.OtpModel.create({
      data: [
        {
          code: hashOto,
          createdBy: user._id,
          type: OtpEnum.confirmEmail,
          expiredAt: new Date(Date.now() + 2 * 60 * 1000),
        },
      ],
    });
    await this.UserModel.updateOne({
      filter: { _id: user._id, confirmEmail: { $exists: false } },
      data: {
        otpAttempts: {
          count:
            (user.otpAttempts?.count ?? 0) + 1 >= 5
              ? 0
              : (user.otpAttempts?.count ?? 0) + 1,
          bannedUntil:
            (user.otpAttempts?.count ?? 0) + 1 >= 5
              ? new Date(new Date().getTime() + 5 * 60 * 1000)
              : undefined,
        },
      },
    });
    console.log(otp);

    emailEvent.emit('sendConfirmEmail', [email, subject, otp]);

    return { message: 'Done' };
  };
  newOtpPassword = async ({
    email = '',
    subject = 'Confirm-Password',
  }: {
    email: string;
    subject?: string;
  }) => {
    const user = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: true },
        deletedAt: { $exists: false },
      },
      option: {
        populate: {
          path: 'otp',
          match: { type: OtpEnum.resetPassword, code: { $exists: true } },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('In-valid account');
    }

    // test otp document =======================================
    if (user.otp[0] && !user.otp[0].code) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    if (
      user.otp[0] &&
      user.otp[0].expiredAt &&
      user.otp[0].expiredAt > new Date()
    ) {
      throw new UnauthorizedException(
        `wait is not expired , expireDate : ${user.otp[0].expiredAt.toLocaleTimeString()}`,
      );
    }
    if (
      user.otpAttempts &&
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new BadRequestException(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
      );
    }

    const otp = customAlphabet('0123456789', 6)();
    log({ otp });
    // const hashOto = await generateHash({ plainText: otp });
    const findUserOtp = await this.OtpModel.findOne({
      filter: {
        createdBy: user._id,
        type: OtpEnum.resetPassword,
        expiredAt: { $gt: new Date() },
      },
    });
    if (findUserOtp) {
      throw new BadRequestException('Please wait until current OTP expires ');
    }
    await this.OtpModel.create({
      data: [
        {
          type: OtpEnum.resetPassword,
          code: otp,
          createdBy: user._id,
          expiredAt: new Date(Date.now() + 2 * 60 * 1000),
        },
      ],
    });
    await this.UserModel.updateOne({
      filter: { _id: user._id, confirmEmail: { $exists: true } },
      data: {
        otpAttempts: {
          count:
            (user.otpAttempts?.count ?? 0) + 1 >= 5
              ? 0
              : (user.otpAttempts?.count ?? 0) + 1,
          bannedUntil:
            (user.otpAttempts?.count ?? 0) + 1 >= 5
              ? new Date(new Date().getTime() + 5 * 60 * 1000)
              : null,
        },
      },
    });

    emailEvent.emit('sendConfirmEmail', [email, 'Confirm-Password', otp]);
    // console.log(otp);
    // console.log(hashOto);
    return { message: 'Done' };
  };
}
