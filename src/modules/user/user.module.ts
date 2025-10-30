import { Module } from '@nestjs/common';

import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { S3Service } from 'src/common/utils/multer/s3.service';

@Module({
  imports: [MulterModule.register({ storage: diskStorage({}) })],
  controllers: [UserController],
  providers: [UserService,S3Service],
})
export class UserModule {}
