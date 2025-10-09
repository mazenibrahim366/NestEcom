import { Response } from 'express';
import { customAlphabet } from 'nanoid';

import { log } from 'console';
import mongoose from 'mongoose';

import { IUserDocument, User, UserSchema } from '../../DB/models/User.model';
import { UserRepository } from '../../DB/repository/user.repository';
import { providerEnum } from '../enums';

import { generateHash } from '../security/hash.security';
import { emailEvent } from './email.events';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
const UserModel = new UserRepository(
  mongoose.model(User.name, UserSchema) as any,
);
export const newConfirmOtp = async ({
  email = '',
  subject = 'Confirm-Email',

}: {
  email: string;
  subject?: string;

}) => {
  const user: IUserDocument | null = await UserModel.findOne({
    filter: {
      email,
      provider: providerEnum.system,
      confirmEmail: { $exists: false },
      confirmEmailOtp: { $exists: true },
    },
  });
  if (!user) {
    throw new NotFoundException('In-valid account');
  }
  if (user.otpExpired && user.otpExpired > new Date()) {
    throw new UnauthorizedException(
      `wait is not expired , expireDate : ${user.otpExpired.toLocaleTimeString()}`,

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

  await UserModel.updateOne({
    filter: { email },
    data: {
      confirmEmailOtp: hashOto,
      otpExpired: new Date(Date.now() + 2 * 60 * 1000),
      otpAttempts: {
        count:   (user.otpAttempts?.count ?? 0) + 1 >= 5 ? 0 :   (user.otpAttempts?.count ?? 0)+ 1,
        bannedUntil:
           (user.otpAttempts?.count ?? 0) + 1 >= 5
            ? new Date(new Date().getTime() + 5 * 60 * 1000)
            : null,
      },
    },
  });
  console.log(otp);

  emailEvent.emit('sendConfirmEmail', [email, subject, otp]);

  return {message : "Done"};
};
export const newOtpPassword = async ({
  email = '',
  subject = 'Confirm-Password',
 
}: {
  email: string;
  subject?: string;

}) => {
  const user = await UserModel.findOne({
    filter: {
      email,
      provider: providerEnum.system,
      confirmEmail: { $exists: true },
      deletedAt: { $exists: false },
    },
  });
  if (!user) {
    throw new NotFoundException('In-valid account');
  }
  if (user.confirmEmailOtp) {
    throw new NotFoundException(
      'In-valid login data or provider or email not confirmed',

    );
  }
  if (user.otpExpired && user.otpExpired > new Date()) {
    throw new UnauthorizedException(
      `wait is not expired , expireDate : ${user.otpExpired.toLocaleTimeString()}`,

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
  log(otp);
  const hashOto = await generateHash({ plainText: otp });

  await UserModel.updateOne({
    filter: { email },
    data: {
      confirmPasswordOtp: hashOto,
      otpExpired: new Date(Date.now() + 2 * 60 * 1000),
      otpAttempts: {
        count: (user.otpAttempts?.count ?? 0)  + 1 >= 5 ? 0 :  (user.otpAttempts?.count ?? 0)  + 1,
        bannedUntil:
           (user.otpAttempts?.count ?? 0)   + 1 >= 5
            ? new Date(new Date().getTime() + 5 * 60 * 1000)
            : null,
      },
    },
  });

  emailEvent.emit('sendConfirmEmail', [email, 'Confirm-Password', otp]);
  // console.log(otp);
  // console.log(hashOto);
  return {message : "Done"};
};
