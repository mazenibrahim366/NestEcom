
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { User, UserSchema } from 'src/DB/models/User.model';
import { AuthService } from './auth.service';
import { UserRepository } from 'src/DB/repository';
import { Token, TokenSchema } from 'src/DB/models/Token.model';


@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }])],
  controllers: [AuthController],
  providers: [AuthService,UserRepository],
})
export class AuthModule {}
