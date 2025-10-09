import { UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import multer, { FileFilterCallback } from 'multer'
export enum StorageEnum {
  memory = 'memory',
  disk = 'disk',
}
export const fileValidation = {
  image: ['image/jpeg', 'image/png', 'image/gif'],
  document: ['application/pdf', 'application/msword'],
}

export const cloudFileUpload = ({
  maxSize = 2,
  validation = [],
  storageApproach = StorageEnum.memory,
}: {
  maxSize?: number
  validation: string[]
  storageApproach?: StorageEnum
}): multer.Multer => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage()
      : multer.diskStorage({})
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) => {
    if (!validation.includes(file.mimetype)) {
      callback(
        new UnauthorizedException( {message : 'validation error',
          validationError: [
            {
              key: 'file',
              issues: [{ path: 'file', message: 'Invalid file type!' }],
            },
          ],
        })
      ) // Reject the file
    } else {
      callback(null, true)
    }
  }
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * maxSize },
  }) // 5MB limit
}
