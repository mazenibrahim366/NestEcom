import { customAlphabet } from 'nanoid';

import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { IUserDocument } from 'src/DB/models/User.model';
import { UserRepository } from '../../DB/repository/';
import {
  newConfirmOtp,
  newOtpPassword,
} from '../../utils/Email/newConfirmOtp.email';
import { providerEnum } from '../../utils/enums';
import { encryptEncryption } from '../../utils/security/encryption.security';
import { compareHash, generateHash } from '../../utils/security/hash.security';
import { generateLoginToken } from '../../utils/security/token.security';
import { IConfirmEmailBodyInputs, IForgetPasswordBodyInputs, ILoginBodyInputs, ILoginByGmailBodyInputs, INewConfirmEmailBodyInputs, ISignupBodyInputs, ISignupByGmailBodyInputs, IVerifyConfirmEmailBodyInputs } from './dto/auth.dto';

async function verify(idToken: string) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.WEB_CLIENT_ID as string | string[], // Specify the WEB_CLIENT_ID of the app that accesses the backend
    // Or, if multiple clients access the backend:
    //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  return payload;
}

@Injectable()
export class AuthService {
  // private UserModel = new UserRepository(UserSchema)
  constructor(private readonly UserModel: UserRepository) {}
  signupByGmail = async (body:ISignupByGmailBodyInputs
  ) => {
    const { idToken } = body;
    const { email, email_verified, name, picture }: any = await verify(idToken);

    if (!email_verified) {
      throw new BadRequestException('Email not verified');
    }
    const user = await this.UserModel.findOne({ filter: { email } });
    if (user) {
      throw new ConflictException('Email exist');
    }

    const [signupUser] = (await this.UserModel.create({
      data: [
        {
          fullName: name,
          email,
          provider: providerEnum.google,
          picture,
          confirmEmail: Date.now() as unknown as Date,
        },
      ],
    })) as IUserDocument[];

    return {
      statusCode: 201,
      // data: process.env.MOOD === 'development' ? { signupUser } : {},
      data: { signupUser },
    };
  };
  loginByGmail = async (body :ILoginByGmailBodyInputs) => {
    const { idToken } = body;
    const { email, email_verified }: any = await verify(idToken);

    if (!email_verified) {
      throw new BadGatewayException('Email not verified');
    }

    const user = await this.UserModel.findOne({
      filter: { email, provider: providerEnum.google },
    });
    if (!user) {
      throw new BadRequestException('In-valid login data or provider');
    }
    const data = await generateLoginToken(user);

    return {
      status: 201,
      data: process.env.MOOD === 'development' ? { data } : {},
    };
  };
  signup = async (body: ISignupBodyInputs) => {
    let dateExpired = new Date(Date.now() + 2 * 60 * 1000);
    const { fullName, email, password, phone } = body;

    const encPhone = await encryptEncryption({ message: phone });
    const user = await this.UserModel.findOne({
      filter: { email },
    });

    if (user) {
      throw new ConflictException('Email exist');
    }
    const otp = customAlphabet('0123456789', 6)();

    const [signupUser] = (await this.UserModel.create({
      data: [
        {
          fullName,
          email,
          // password: hashPassword,
          password,
          phone: encPhone,
          confirmEmailOtp: otp,
          // confirmEmailOtp: hashOto,
          otpExpired: dateExpired,
          otpAttempts: { bannedUntil: null as any, count: 0 },
        },
      ],
    })) as IUserDocument[];

    return {
      status: 201,
      data: process.env.MOOD === 'development' ? { signupUser } : {},
    };
  };

  login = async (body : ILoginBodyInputs) => {
    const { email, password } = body;
    const user = await this.UserModel.findOne({
      filter: { email, provider: providerEnum.system },
    });
    if (!user) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    if (!user.confirmEmail) {
      throw new BadRequestException('please verify your access first ');
    }
    if (user.deletedAt) {
      throw new BadRequestException('this account is deleted');
    }
    if (
      !(await compareHash({ plainText: password, hashValue: user.password }))
    ) {
      throw new NotFoundException('In-valid login data');
    }
    const data = await generateLoginToken(user);
    return { status: 200, data };
  };
  confirmEmail = async (body: IConfirmEmailBodyInputs) => {
    const { email, otp } = body;
    const user: IUserDocument | null = await this.UserModel.findOne({
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
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new BadRequestException(`OTP Expired `);
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

    if (
      !(await compareHash({ plainText: otp, hashValue: user.confirmEmailOtp }))
    ) {
      throw new BadRequestException('In-valid OTP');
    }

    await this.UserModel.updateOne({
      filter: { email },
      data: {
        $set: { confirmEmail: Date.now() },
        $unset: { confirmEmailOtp: 1, otpExpired: 1, otpAttempts: 1 },
      },
    });

    return { message: 'Done' };
  };
  newConfirmEmail = async (body:INewConfirmEmailBodyInputs) => {
    const { email } = body;

    await newConfirmOtp({ email, subject: 'Confirm-Email' });
  };
  newConfirmPassword = async (body) => {
    const { email } = body;

    await newOtpPassword({ email, subject: 'Confirm Password' });
    return { message: 'Done' };
  };
  verifyForgotPassword = async (body:IVerifyConfirmEmailBodyInputs) => {
    const { email, otp } = body;

    const user = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: true },
        deletedAt: { $exists: false },
        confirmPasswordOtp: { $exists: true },
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
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new BadRequestException(`OTP Expired `);
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

    if (
      !(await compareHash({
        plainText: otp,
        hashValue: user.confirmPasswordOtp,
      }))
    ) {
      throw new BadRequestException('In-valid OTP');
    }
    return { message: 'Done' };
  };
  forgotPassword = async (body: IForgetPasswordBodyInputs) => {
    const { email, password, otp } = body;

    const user: IUserDocument | null = await this.UserModel.findOne({
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
    if (user.otpExpired && user.otpExpired < new Date()) {
      throw new BadRequestException(`OTP Expired `);
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

    if (
      !(await compareHash({
        plainText: otp,
        hashValue: user.confirmPasswordOtp,
      }))
    ) {
      throw new BadRequestException('In-valid OTP');
    }
    if (user.oldPassword?.length) {
      for (const historyPassword of user.oldPassword) {
        if (
          await compareHash({ plainText: password, hashValue: historyPassword })
        ) {
          throw new BadRequestException(
            'this password is used before In-valid old ',
          );
        }
      }
    }
    const hashPassword = await generateHash({ plainText: password });

    await this.UserModel.updateOne({
      filter: { email },
      data: {
        $set: {
          updatePassword: Date.now(),
          changeCredentialsTime: new Date(),
          password: hashPassword,
        },
        $unset: { confirmPasswordOtp: 1, otpExpired: 1, otpAttempts: 1 },
        $inc: { __v: 1 },
        $push: { oldPassword: user.password },
      },
    });
    return { message: 'Done' };
  };
}
