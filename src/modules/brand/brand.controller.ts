import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Auth, User } from 'src/common/decorators';
import { IResponse } from 'src/common/interfaces/respons.interface';
import { successResponse } from 'src/common/utils/success.response';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandDtoParams, UpdateBrandDto } from './dto/update-brand.dto';
import { brandResponse } from './entities/brand.entity';

import { FileInterceptor } from '@nestjs/platform-express';
import {
  cloudFileUpload,
  fileValidation,
} from 'src/common/utils/multer/cloud.multer';
import type { UserDocument } from 'src/DB/models/User.model';
import { endpoint } from './authorization.module';
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUpload({ validation: fileValidation.image }),
    ),
  )
  @Auth(endpoint.create)
  @Post('create')
  async create(
    @User() user: UserDocument,
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<brandResponse>> {
    const brand = await this.brandService.create(createBrandDto, user, file);
    return successResponse<brandResponse>({ data: { brand } });
  }
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUpload({ validation: fileValidation.image }),
    ),
  )
  @Auth(endpoint.create)
  @Patch(':brandId/attachment')
  async updateAttachment(
    @Param() params: BrandDtoParams,
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<brandResponse>> {
    const brand = await this.brandService.updateAttachment(
      params.brandId,
      user,
      file,
    );
    return successResponse<brandResponse>({ data: { brand } });
  }
  @Auth(endpoint.create)
  @Patch(':brandId')
  async update(
    @Param() params: BrandDtoParams,
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: UserDocument,
  ): Promise<IResponse<brandResponse>> {
    const brand = await this.brandService.update(
      params.brandId,
      updateBrandDto,
      user,
    );
    return successResponse<brandResponse>({ data: { brand } });
  }

  @Auth(endpoint.create)
  @Delete(':brandId/freeze')
  async freeze(
    @Param() params: BrandDtoParams,
    @User() user: UserDocument,
  ): Promise<IResponse> {
      console.log({params:params.brandId,user});
    await this.brandService.freeze(params.brandId, user);
    console.log({g:":sdfdasfaesdf"});
    
    return successResponse();
  }
  // @Get()
  // findAll() {
  //   return this.brandService.findAll();
  // }

  // @Get(':brandId')
  // findOne(@Param('brandId') brandId: string) {
  //   return this.brandService.findOne(+brandId);
  // }

  // @Delete(':brandId')
  // remove(@Param('brandId') brandId: string) {
  //   return this.brandService.remove(+brandId);
  // }
}
