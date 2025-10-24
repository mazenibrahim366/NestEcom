import { Otp } from './../../DB/models/Otp.model';
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
import { OtpRepository, UserRepository } from '../../DB/repository/';

import { log } from 'console';
import { Types } from 'mongoose';
import { confirmEmailOtpService } from 'src/common/utils/Email/newConfirmOtp.email';
import { OtpEnum, providerEnum } from '../../common/utils/enums';
import { encryptEncryption } from '../../common/utils/security/encryption.security';
import {
  compareHash,
  generateHash,
} from '../../common/utils/security/hash.security';

import {
  IConfirmEmailBodyInputs,
  IForgetPasswordBodyInputs,
  ILoginBodyInputs,
  ILoginByGmailBodyInputs,
  INewConfirmEmailBodyInputs,
  ISignupBodyInputs,
  ISignupByGmailBodyInputs,
  IVerifyConfirmEmailBodyInputs,
} from './dto/auth.dto';
import { TokenService } from 'src/common/utils/security/token.security';

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
  constructor(
    private readonly UserModel: UserRepository,
    private readonly confirmEmailOtpService: confirmEmailOtpService,
    private readonly otpModel: OtpRepository,
    private readonly tokenService: TokenService,
  ) {}
  signupByGmail = async (body: ISignupByGmailBodyInputs) => {
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
  loginByGmail = async (body: ILoginByGmailBodyInputs) => {
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
    const data = await this.tokenService.generateLoginToken(user);

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
          password,
          phone: encPhone,
          // confirmEmailOtp: otp,     // new edit otp collection
          // otpExpired: dateExpired,
          otpAttempts: { bannedUntil: null as any, count: 0 },
        },
      ],
    })) as IUserDocument[];
    await this.otpModel.create({
      data: [
        {
          code: otp, // new edit otp collection
          createdBy: Types.ObjectId.createFromHexString(
            signupUser._id.toString(),
          ),
          expiredAt: dateExpired,

          type: OtpEnum.confirmEmail,
        },
      ],
    });

    return {
      status: 201,
      data: process.env.MOOD === 'development' ? { signupUser } : {},
    };
  };

  login = async (body: ILoginBodyInputs) => {
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
    const data = await  this.tokenService.generateLoginToken(user);
    return { status: 200, data };
  };
  confirmEmail = async (body: IConfirmEmailBodyInputs) => {
    const { email, otp } = body;
    const user: IUserDocument | null = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: false },
      },
      option: {
        populate: { path: 'otp', match: { type: OtpEnum.confirmEmail } },
      },
    });
    if (!user) {
      throw new NotFoundException('In-valid account');
    }
    // if (!user.confirmEmail &&user.otp.length) {
    //   throw new BadRequestException(`OTP Expired `);
    // }
    if (
      user.otp[0] &&
      user.otp[0].expiredAt &&
      user.otp[0].expiredAt < new Date()
    ) {
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
    // log({otp,sdsd: user?.otp[0].code})
    // log((await compareHash({ plainText: otp, hashValue: user?.otp[0].code })))
    if (
      user.otp[0] &&
      (await compareHash({ plainText: otp, hashValue: user.otp[0].code }))
    ) {
      throw new BadRequestException('In-valid OTP');
    }

    await this.UserModel.updateOne({
      filter: { email },
      data: {
        $set: { confirmEmail: Date.now() },
        $unset: { otpAttempts: 1 },
      },
    });

    return { message: 'Done' };
  };
  newConfirmEmail = async (body: INewConfirmEmailBodyInputs) => {
    const { email } = body;

    await this.confirmEmailOtpService.newConfirmOtp({
      email,
      subject: 'Confirm-Email',
    });
    return { message: 'Done' };
  };
  newConfirmPassword = async (body) => {
    const { email } = body;

    await this.confirmEmailOtpService.newOtpPassword({
      email,
      subject: 'Confirm Password',
    });
    return { message: 'Done' };
  };
  verifyForgotPassword = async (body: IVerifyConfirmEmailBodyInputs) => {
    const { email, otp } = body;

    const user: IUserDocument | null = await this.UserModel.findOne({
      filter: {
        email,
        provider: providerEnum.system,
        confirmEmail: { $exists: true },
        deletedAt: { $exists: false },
      },
      option: {
        populate: { path: 'otp', match: { type: OtpEnum.resetPassword  ,expiredAt: { $gt: new Date() }} },
      },
    });

    log({ dghkjhsd: user?.otp });
    if (!user) {
      throw new NotFoundException('In-valid account');
    }
    if (user.otp[0] && !user.otp[0].code) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    // log({otp, kl: user?.otp[0].code})
    if (user.otp[0] && !user.otp[0].code) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    if (!user.otp.length) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed or not requested otp',
      );
    }
    if (user.otp[0] && !user.otp[0].code) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    if (
      user.otp[0] &&
      user.otp[0].expiredAt &&
      user.otp[0].expiredAt < new Date()
    ) {
      throw new BadRequestException(`OTP Expired `);
    }
    if (
      user.otp[0] &&
      user.otpAttempts &&
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new BadRequestException(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
      );
    }
    log(
      await compareHash({
        plainText: otp,
        hashValue: user.otp[0].code,
      }),
    );
   
    log({ inputOtp:otp, storedOtp: user?.otp[0].code });
    if (!user.otp?.length || !user.otp[0]?.code) {
  throw new NotFoundException('OTP not found or expired');
}
    // if (

    //   !(await compareHash({
    //     plainText: "615767",
    //     hashValue: "$2b$12$ybBgHZ5d4h9AYEdxKOc4R.AAGIG5FuH/HSRCZ6cK8fGE6X2BOfgay",
    //   }))
    // ) {
    //   throw new BadRequestException('In-valid OTP');
    // }
    if (

      !(await compareHash({
        plainText: otp,
        hashValue: user.otp[0].code,
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
      option: {
        populate: { path: 'otp', match: { type: OtpEnum.resetPassword } },
      },
    });
    if (!user) {
      throw new NotFoundException('In-valid account');
    }
    if (user.otp[0] &&! user.otp[0].code) {
      throw new NotFoundException(
        'In-valid login data or provider or email not confirmed',
      );
    }
    if (
      user.otp[0] &&
      user.otp[0].expiredAt &&
      user.otp[0].expiredAt < new Date()
    ) {
      throw new BadRequestException(`OTP Expired `);
    }
    if (
      user.otp[0] &&
      user.otpAttempts &&
      user.otpAttempts.bannedUntil &&
      user.otpAttempts.bannedUntil > new Date()
    ) {
      throw new BadRequestException(
        `You are temporarily banned until ${user.otpAttempts.bannedUntil.toLocaleTimeString()}`,
      );
    }

    if (
      user.otp[0] &&
      !(await compareHash({
        plainText: otp,
        hashValue: user.otp[0].code,
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
        $unset: { otpAttempts: 1 },
        $inc: { __v: 1 },
        $push: { oldPassword: user.password },
      },
    });
    return { message: 'Done' };
  };
}
