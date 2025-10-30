import { IsString, Length } from 'class-validator';
import { IBrand } from 'src/common/interfaces/brand.interface';

export class CreateBrandDto implements Partial<IBrand> {
  @IsString()
  @Length(2, 50)
  name: string;
  @IsString()
  @Length(2, 70)
  slogan: string;
}
