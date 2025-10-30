import {
  Body,
  Controller,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { IResponse } from 'src/common/interfaces/respons.interface';
import { successResponse } from 'src/common/utils/success.response';
import { AuthService } from './auth.service';
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
import { LoginResponse } from './entities/auth.entity';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
export class AuthController {
  constructor(private readonly Service: AuthService) {}

  @Post('signup')
  async signup(@Body() body: ISignupBodyInputs) {
    await this.Service.signup(body);
    return successResponse();
  }
  @Post('signup/gmail')
  async signupByGmail(@Body() body: ISignupByGmailBodyInputs) {
    await this.Service.signupByGmail(body);
    return successResponse();
  }
  @Post('login')
  async loginByGmail(
    @Body() body: ILoginBodyInputs,
  ): Promise<IResponse<LoginResponse>> {
    const data = await this.Service.login(body);
    return successResponse<LoginResponse>({ data });
  }
  @Post('/login/gmail')
  async login(@Body() body: ILoginByGmailBodyInputs) {
    await this.Service.loginByGmail(body);
    return successResponse();
  }
  @Patch('confirm-email')
  async confirmEmail(@Body() body: IConfirmEmailBodyInputs) {
    await this.Service.confirmEmail(body);
    return successResponse();
  }
  @Patch('new-confirm-email')
  async newConfirmEmail(@Body() body: any) {
    await this.Service.newConfirmEmail(body);
    return successResponse();
  }
  @Patch('new-confirm-password-otp')
  async newConfirmPasswordOtp(@Body() body: INewConfirmEmailBodyInputs) {
    await this.Service.newConfirmPassword(body);
    return successResponse();
  }
  @Patch('forgot-password')
  async forgotPassword(@Body() body: IForgetPasswordBodyInputs) {
    await this.Service.forgotPassword(body);
    return successResponse();
  }
  @Patch('verify-forgot-password')
  async verifyForgotPassword(@Body() body: IVerifyConfirmEmailBodyInputs) {
    await this.Service.verifyForgotPassword(body);
    return successResponse();
  }
}
