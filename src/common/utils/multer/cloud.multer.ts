import { UnauthorizedException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { nanoid } from 'nanoid';
import { tmpdir } from 'os';
import { StorageEnum } from '../enums';

export const fileValidation = {
  image: ['image/jpeg', 'image/png', 'image/gif'],
  document: ['application/pdf', 'application/msword'],
};

export const cloudFileUpload = ({
  maxSize = 5,
  validation = [],
  storageApproach = StorageEnum.memory,
}: {
  maxSize?: number;
  validation: string[];
  storageApproach?: StorageEnum;
}): MulterOptions  => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: tmpdir(),
          filename: function (
            req: Request,
            file: Express.Multer.File,
            callback,
          ) {
            callback(null, `${Date.now()}_${nanoid()}_${file.originalname}`);
          },
        });
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback,
  ) => {
    if (!validation.includes(file.mimetype)) {
      callback(
        new UnauthorizedException({
          message: 'validation error',
          validationError: [
            {
              key: 'file',
              issues: [{ path: 'file', message: 'Invalid file type!' }],
            },
          ],
        }),
      ); // Reject the file
    } else {
      callback(null, true);
    }
  };
  return {
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * maxSize },
  }; // 5MB limit
};
