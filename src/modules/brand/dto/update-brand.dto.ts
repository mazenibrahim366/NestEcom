import { PartialType } from '@nestjs/mapped-types';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { CreateBrandDto } from './create-brand.dto';
import { containField } from 'src/common/decorators';
@containField()
export class UpdateBrandDto extends PartialType(CreateBrandDto) {
  
}

export class BrandDtoParams {
  @IsMongoId()
  brandId: Types.ObjectId;
}
