import { ValidationError } from '@nestjs/common';
import {
  IsEmail,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  Length,
  ValidateIf,
  ValidatorOptions,
} from 'class-validator';
import { IsMatched } from 'src/common/decorators';

export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}

export class ISignupBodyInputs {
  @IsString()
  @Length(2, 50)
  fullName: string;
  @IsEmail()
  email: string;
  @IsStrongPassword()
  password: string;

  @ValidateIf(function (data: ISignupBodyInputs) {
    return Boolean(data.password);
  })
  @IsMatched<string>(['password'], {
    message: 'password mismatched confirmation password',
  })
  confirmPassword: string;
  @IsPhoneNumber('EG')
  phone: string;
}

export class ISignupByGmailBodyInputs {
  @IsString()
  idToken: string;
}

export class ILoginBodyInputs {
  @IsEmail()
  email: string;
  @IsStrongPassword()
  password: string;
}

export class ILoginByGmailBodyInputs {
  @IsString()
  idToken: string;
}

export class IConfirmEmailBodyInputs {
  @IsEmail()
  email: string;
  @IsString()
  @Length(6, 6)
  otp: string;
}
export class IVerifyConfirmEmailBodyInputs {
  @IsEmail()
  email: string;
  @IsString()
  @Length(6, 6)
  otp: string;
}
export class IForgetPasswordBodyInputs {
  @IsEmail()
  email: string;
  @IsString()
  @Length(6, 6)
  otp: string;
  @IsStrongPassword()
  password: string;
  @IsMatched<string>(['password'], {
    message: 'password mismatched confirmation password',
  })
  confirmPassword: string;
}
export class INewConfirmEmailBodyInputs {
  @IsEmail()
  email: string;
}
