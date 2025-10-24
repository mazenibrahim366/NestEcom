import { Module } from '@nestjs/common';
import { OtpModel } from 'src/DB/models/Otp.model';
import {
  OtpRepository
} from 'src/DB/repository';
import { confirmEmailOtpService } from 'src/common/utils/Email/newConfirmOtp.email';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ OtpModel],
  controllers: [AuthController],
  providers: [
    AuthService,
    
    confirmEmailOtpService,
    OtpRepository,
  
    

  ],
})
export class AuthenticationModule {}
