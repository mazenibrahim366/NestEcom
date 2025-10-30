import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { delay, of } from 'rxjs';
import { IUser } from 'src/common/interfaces/user.interface';
import { s3Event } from 'src/common/utils/multer/s3.events';
import { S3Service } from 'src/common/utils/multer/s3.service';
import { UserDocument } from 'src/DB/models/User.model';
import { UserRepository } from 'src/DB/repository';
import { imageCoverResponse, imageResponse } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly s3Service: S3Service,  private readonly UserModel: UserRepository,) {}
  async profile(header, user): Promise<IUser> {
    return user;
  }
  async profileImage(
    user: UserDocument,
    file: Express.Multer.File,
    body: { ContentType: string; originalname: string },
  ): Promise<imageResponse> {
    const {
      ContentType,
      originalname,
    }: { ContentType: string; originalname: string } = body

    const { url, key } = await this.s3Service.createPreSignedUploadURL({
      ContentType,
      originalname,
      path: `users/profileImage/${user?._id}`,
    })
    const findUser = await this.UserModel.findByIdAndUpdate({
      id: new Types.ObjectId(user?._id),
      data: { picture: key, temProfileImage: user?.picture },
    })

    if (!findUser) {
      throw new BadRequestException('fail to update user profile image')
    }
    s3Event.emit('trackFileUpload', {
      key,
      expiresIn: 30000,
      userId: user?._id,
      oldKey: user?.picture,
    })
    return  { url, key } 

  }
  async profileCoverImage(

    user: UserDocument,
    files: Express.Multer.File[],
  ): Promise<imageCoverResponse> {


 const key = await this.s3Service. uploadFiles({
      files: files as Express.Multer.File[],
      path: `users/cover/${user?._id}`,
    })

    const findUser = await this.UserModel.findByIdAndUpdate({
      id: new Types.ObjectId(user?._id),
      data: { pictureCover: key },
      option: { new: false },
    })

    if (findUser?.pictureCover?.length) {
      await this.s3Service.deleteFiles({ urls: findUser.pictureCover as string[] })
    }
    return {key} ;
  }
}
