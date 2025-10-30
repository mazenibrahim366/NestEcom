import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenModel } from 'src/DB/models/Token.model';
import { UserModel } from 'src/DB/models/User.model';
import { TokenRepository, UserRepository } from 'src/DB/repository';
import { BrandModule } from 'src/modules/brand/brand.module';
import { TokenService } from '../utils/security/token.security';
import { S3Service } from '../utils/multer/s3.service';
import { BrandModel } from 'src/DB/models/Brand.model';


@Global()
@Module({
  imports: [UserModel, TokenModel , BrandModel],
  controllers: [],
  providers: [UserRepository, TokenService, TokenRepository, JwtService],
  exports: [
    UserRepository,

    TokenService,
    TokenRepository,
    JwtService,
    UserModel,
    TokenModel,
  ],
})
export class SharedAuthModule {}
