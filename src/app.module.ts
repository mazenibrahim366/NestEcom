import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { OtpModel } from './DB/models/Otp.model';
import { AuthenticationModule } from './modules/auth/auth.module';
import { SharedAuthModule } from './common/modules/auth.module';


@Module({
  imports: [ ConfigModule.forRoot({ envFilePath : resolve("./config/.env.development"),isGlobal: true }),
    MongooseModule.forRoot(process.env.DB_URL as string ),
  SharedAuthModule,AuthenticationModule,UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

