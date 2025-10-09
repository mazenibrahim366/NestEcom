import { Body, Controller, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';

import { AuthService } from './auth.service';
import { IConfirmEmailBodyInputs, IForgetPasswordBodyInputs, ILoginBodyInputs, ILoginByGmailBodyInputs, INewConfirmEmailBodyInputs, ISignupBodyInputs, ISignupByGmailBodyInputs, IVerifyConfirmEmailBodyInputs } from './dto/auth.dto';

@UsePipes(new ValidationPipe({stopAtFirstError:true,whitelist:true , forbidNonWhitelisted:true}))
@Controller('auth')
export class AuthController {
  constructor(private readonly Service: AuthService) {}

  @Post('signup')
  signup(@Body() body: ISignupBodyInputs) {
    return this.Service.signup(body);
  }
  @Post('signup/gmail')
  signupByGmail(@Body() body: ISignupByGmailBodyInputs) {
    return this.Service.signupByGmail(body);
  }
  @Post('login')
  loginByGmail(@Body() body: ILoginBodyInputs) {
    return this.Service.login(body);
  }
  @Post('/login/gmail')
  login(@Body() body: ILoginByGmailBodyInputs) {
    return this.Service.loginByGmail(body);
  }
  @Patch('confirm-email')
  confirmEmail(@Body() body: IConfirmEmailBodyInputs) {
    return this.Service.confirmEmail(body);
  }
  @Patch('new-confirm-email')
  newConfirmEmail(@Body() body: any) {
    return this.Service.newConfirmEmail(body);
  }
  @Patch('new-confirm-password-otp')
  newConfirmPasswordOtp(@Body() body: INewConfirmEmailBodyInputs) {
    return this.Service.newConfirmPassword(body);
  }
  @Patch('forgot-password')
  forgotPassword(@Body() body: IForgetPasswordBodyInputs) {
    return this.Service.forgotPassword(body);
  }
  @Patch('verify-forgot-password')
  verifyForgotPassword(@Body() body: IVerifyConfirmEmailBodyInputs) {
    return this.Service.verifyForgotPassword(body);
  }
}
