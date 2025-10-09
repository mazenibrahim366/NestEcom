import { Request } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { nanoid } from 'nanoid';

import { IUserDocument, User, UserSchema } from '../../DB/models/User.model';
import { roleEnum, signatureTypeEnum, tokenTypeEnum } from '../enums';

import { BadRequestException } from '@nestjs/common';
import { Token, TokenSchema } from 'src/DB/models/Token.model';
import { TokenRepository } from 'src/DB/repository';
import { UserRepository } from 'src/DB/repository/user.repository';
const UserModel = new UserRepository(
  mongoose.model(User.name, UserSchema) as any,
);
const TokenModel = new TokenRepository(
  mongoose.model(Token.name, TokenSchema) as any,
);
export const generateToken = async ({
  payload = '',
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
  option = { expiresIn: Number(process.env.ACCESS_EXPIRES) },
} = {}) => {
  return jwt.sign(payload, signature as string, option);
};
export const verifyToken = async ({
  token = '',
  signature = process.env.ACCESS_TOKEN_USER_SIGNATURE,
} = {}) => {
  return jwt.verify(token, signature as string);
};
export const getSignature = async ({
  signatureLevel = signatureTypeEnum.bearer,
}: { signatureLevel?: signatureTypeEnum } = {}) => {
  const signature: {
    accessSignature?: string;
    refreshSignature?: string;
  } = {};

  switch (signatureLevel) {
    case signatureTypeEnum.system:
      signature.accessSignature = process.env
        .ACCESS_TOKEN_SYSTEM_SIGNATURE as string;
      signature.refreshSignature = process.env
        .REFRESH_TOKEN_SYSTEM_SIGNATURE as string;
      break;

    default:
      signature.accessSignature = process.env
        .ACCESS_TOKEN_USER_SIGNATURE as string;
      signature.refreshSignature = process.env
        .REFRESH_TOKEN_USER_SIGNATURE as string;
      break;
  }

  return signature;
};

// Remove duplicate interface
export interface IDecoded extends jwt.JwtPayload {
  _id?: string;
}

// export const tokenTypeEnum = {
//   access: 'access',
//   refresh: 'refresh',
// } as const

// export const signatureTypeEnum = {
//   Bearer: 'Bearer',
//   System: 'System',
// } as const

// type TokenType = keyof typeof tokenTypeEnum
// type SignatureType = keyof typeof signatureTypeEnum

export const decodedToken = async ({
  authorization = '',

  tokenType = tokenTypeEnum.access,
}: {
  authorization?: string;
  tokenType?: tokenTypeEnum;
}) => {
  const [bearer, token] = authorization?.split(' ') || [];

  if (!token || !bearer) {
    throw new BadRequestException('missing token parts');
  }

  if (!Object.values(signatureTypeEnum).includes(bearer as any)) {
    throw new BadRequestException('Invalid bearer type');
  }

  const signature = await getSignature({
    signatureLevel: bearer as signatureTypeEnum,
  });

  const decoded = (await verifyToken({
    token,
    signature:
      tokenType === 'access'
        ? signature.accessSignature
        : signature.refreshSignature,
  })) as IDecoded;

  if (
    decoded.jti &&
    (await TokenModel.findOne({ filter: { jti: decoded.jti } }))
  ) {
    throw new BadRequestException('In-valid login credentials');
  }
  const findUser = await UserModel.findOne({
    filter: { _id: new Types.ObjectId(decoded._id) },
  });
  if (!findUser) {
    throw new BadRequestException('User not found');
  }

  if (
    findUser.changeCredentialsTime &&
    decoded.iat &&
    findUser.changeCredentialsTime.getTime() > decoded.iat * 1000
  ) {
    throw new BadRequestException('In-valid login credentials');
  }

  if (findUser.freezeAt) {
    throw new BadRequestException('Account is freezed');
  }

  //   if (
  //     decoded.jti &&
  //     (await TokenModel.findOne({ filter: { jti: decoded.jti } }))
  //   ) {
  //     throw new BadRequestException('In-valid login credentials ')
  //   }
  //   const findUser =await UserModel.findOne({ filter:{id:new Types.ObjectId(decoded._id)}})

  // if (!findUser) {
  //   throw new BadRequestException('User not found');
  // }
  // if (!findUser.changeCredentialsTime) {
  //   throw new BadRequestException("User credentials time not set");
  // }
  // if (!decoded.iat) {
  //   throw new BadRequestException("Invalid token: missing iat");
  // }

  // if (
  //   !findUser.freezeAt &&
  //   findUser.changeCredentialsTime.getTime() > decoded.iat * 1000
  // ) {
  //   throw new BadRequestException('In-valid login credentials');
  // }

  if (!decoded?._id) {
    throw new BadRequestException('In-valid token');
  }

  const user: any = await UserModel.findById({ id: decoded._id });
  if (!user) {
    throw new BadRequestException('Not register account');
  }

  if (
    !user.freezeBy &&
    user?.changeCredentialsTime?.getTime() > (decoded.iat ?? 0) * 1000
  ) {
    throw new BadRequestException('In-valid login credentials ');
  }

  return { user, decoded };
};

export async function generateLoginToken(user: IUserDocument) {
  const signature = await getSignature({
    signatureLevel:
      user.role != roleEnum.User
        ? signatureTypeEnum.system
        : signatureTypeEnum.bearer,
  });
  const jwtid = nanoid();
  const access_token = await generateToken({
    payload: { _id: user?._id } as { _id: Types.ObjectId } as any,
    signature: signature.accessSignature,
    option: { expiresIn: Number(process.env.ACCESS_EXPIRES), jwtid } as {
      expiresIn: number;
      jwtid: string;
    },
  });
  const refresh_token = await generateToken({
    payload: { _id: user?._id } as any,
    signature: signature.refreshSignature,
    option: { expiresIn: Number(process.env.REFRESH_EXPIRES), jwtid } as {
      expiresIn: number;
      jwtid: string;
    },
  });
  return { access_token, refresh_token };
}

export async function createRevokeToken({
  req,
}: {
  req: Request;
}): Promise<boolean> {
  await TokenModel.create({
    data: [
      {
        jti: req.decoded?.jti as string,
        userId: new mongoose.Types.ObjectId(req.decoded?._id as string),
        expiresIn:
          (req.decoded?.iat as number) + Number(process.env.REFRESH_EXPIRES),
      },
    ],
  });
  return true;
}
