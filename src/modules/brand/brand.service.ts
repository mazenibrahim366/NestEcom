import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { IBrand } from 'src/common/interfaces/brand.interface';
import { FolderEnum } from 'src/common/utils/enums';
import { S3Service } from 'src/common/utils/multer/s3.service';
import { UserDocument } from 'src/DB/models/User.model';
import { BrandRepository } from 'src/DB/repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createBrandDto: CreateBrandDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<IBrand> {
    const { name, slogan } = createBrandDto;
    const checkDuplicatedBrand = await this.brandRepository.findOne({
      filter: { name },
    });

    if (checkDuplicatedBrand) {
      throw new ConflictException('Brand already exists');
    }

    const image = await this.s3Service.uploadFile({
      file,
      path: `brands/${user._id}`,
    });
    const [brand] = (await this.brandRepository.create({
      data: [{ name, slogan, image, createdBy: user._id }],
    })) as unknown as IBrand[];
    if (!brand) {
      await this.s3Service.deleteFile({ Key: image });
      throw new BadRequestException('filed to create brand');
    }
    return brand;
  }
  async update(
    brandId: Types.ObjectId,
    updateBrandDto: UpdateBrandDto,
    user: UserDocument,
  ): Promise<IBrand> {
    if (
      UpdateBrandDto.name &&
      (await this.brandRepository.findOne({
        filter: { name: updateBrandDto.name },
      }))
    ) {
      throw new ConflictException('Brand already exists');
    }
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      data: { ...updateBrandDto, updatedBy: user._id },
    });
    if (!brand) {
      throw new NotFoundException('fail to find matching brand name');
    }
    return brand;
  }
  async updateAttachment(
    brandId: Types.ObjectId,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<IBrand> {
    const image = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.brand}/${user._id}`,
    });
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      data: { image },
      option: { new: false },
    });
    if (!brand) {
      await this.s3Service.deleteFile({ Key: image });
      throw new NotFoundException('fail to find matching brand name');
    }
    await this.s3Service.deleteFile({ Key: brand.image });
    brand.image = image;
    return brand;
  }

  freeze = async (brandId: Types.ObjectId, user: UserDocument) : Promise<string>=> {
    console.log({ mazen: 'mazem' });

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      data: {
        $unset: { restoreAt: 1 },

        freezeAt: new Date(),

        updatedBy: user._id,
      },
    });
    console.log({ user }, 'oiyuoiyuioy');

    if (!brand) {
      throw new NotFoundException('fail to find matching brand instance');
    }

    return 'done';
  };
  // async freeze(brandId: Types.ObjectId, user: UserDocument) {
  //   console.log({ mazen: 'mazem' });

  //   const objectId =
  //     typeof brandId === 'string' ? new Types.ObjectId(brandId) : brandId;

  //   const brand = await this.brandRepository.findOneAndUpdate({
  //     filter: { _id: objectId },
  //     data: {
  //       $set: {
  //         freezeAt: new Date(),
  //         updatedBy: user._id,
  //       },
  //       $unset: { restoreAt: 1 },
  //     },
  //   });

  //   console.log({ user }, 'oiyuoiyuioy');

  //   if (!brand) {
  //     throw new NotFoundException('fail to find matching brand instance');
  //   }

  //   return 'done';
  // }

  remove(id: number) {
    return `This action removes a #${id} brand`;
  }
  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }
}
