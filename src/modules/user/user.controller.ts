import {
  Body,
  Controller,
  Get,
  Headers,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { UserDocument } from 'src/DB/models/User.model';
import { Auth, User } from 'src/common/decorators';
import { IResponse } from 'src/common/interfaces/respons.interface';
import { roleEnum, StorageEnum } from 'src/common/utils/enums';
import {
  cloudFileUpload,
  fileValidation,
} from 'src/common/utils/multer/cloud.multer';
import { successResponse } from 'src/common/utils/success.response';
import {
  imageCoverResponse,
  imageResponse,
  ProfileResponse,
} from './entities/user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // @SetMetadata("tokenType", tokenTypeEnum.access)
  @Auth([roleEnum.User, roleEnum.Admin])
  @Get('')
  async profile(
    @Headers() header: any,
    @User() user: UserDocument,
  ): Promise<IResponse<ProfileResponse>> {
    const profile = await this.userService.profile(header, user);
    return successResponse<ProfileResponse>({ data: { profile } });
  }
  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUpload({
        validation: fileValidation.image,
        storageApproach: StorageEnum.memory,
        maxSize: 1,
      }),
    ),
  )
  @Auth([roleEnum.User, roleEnum.Admin])
  @Patch('profile-image')
  async profileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,

    @User() user: UserDocument,
    @Body() Body: { ContentType: string; originalname: string },
  ): Promise<IResponse<imageResponse>> {
    const { url, key } = await this.userService.profileImage(user, file, Body);
    return successResponse<imageResponse>({ data: { url, key } });
  }
  @UseInterceptors(
    FilesInterceptor(
      'coverImages',
      2,
      cloudFileUpload({
        storageApproach: StorageEnum.memory,
        validation: fileValidation.image,
        maxSize: 2,
      }),
    ),
  )
  @Auth([roleEnum.User, roleEnum.Admin])
  @Patch('profile-cover-image')
  async coverImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    files: Array<Express.Multer.File>,
    @User() user: UserDocument,
  ): Promise<IResponse<imageCoverResponse>> {
    const { key } = await this.userService.profileCoverImage(user, files);
    return successResponse<imageCoverResponse>({ data: { key } });
  }
}
