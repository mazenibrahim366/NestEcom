import { Module } from '@nestjs/common';
import { BrandRepository } from 'src/DB/repository';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { S3Service } from 'src/common/utils/multer/s3.service';

@Module({

  controllers: [BrandController ],
  providers: [BrandService, BrandRepository  , S3Service],
})
export class BrandModule {}
