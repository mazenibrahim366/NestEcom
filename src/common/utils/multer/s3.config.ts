import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UnauthorizedException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { nanoid } from 'nanoid';
import { StorageEnum } from './cloud.multer';
export const s3Config = () => {
  return new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};
export const uploadFile = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = 'private',
  path = 'general',
  file,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.AWS_BUCKET_NAME}/${path}/${nanoid()}_${
      file.originalname
    }`,
    Body:
      storageApproach === StorageEnum.memory
        ? file.buffer
        : createReadStream(file.path),
    ContentType: file.mimetype,
  });
  await s3Config().send(command);
  if (!command?.input.Key) {
    throw new UnauthorizedException('File to generate upload key');
  }
  return command.input.Key as string;
};
export const uploadFiles = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = 'private',
  path = 'general',
  files,
  useLargeFiles = false,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
  useLargeFiles?: boolean;
}) => {
  let urls: string[] = [];
  if (useLargeFiles) {
    urls = await uploadLargeFiles({
      storageApproach,
      Bucket,
      ACL,
      path,
      files,
    });
    return urls;
  }
  urls = await Promise.all(
    files?.map((file) => {
      return uploadFile({ storageApproach, Bucket, ACL, path, file });
    }),
  );

  return urls;
};
export const uploadLargeFiles = async ({
  storageApproach = StorageEnum.disk,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = 'private',
  path = 'general',
  files,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
}) => {
  let urls: string[] = [];

  urls = await Promise.all(
    files?.map((file) => {
      return uploadLargeFile({ storageApproach, Bucket, ACL, path, file });
    }),
  );

  return urls;
};

export const uploadLargeFile = async ({
  storageApproach = StorageEnum.disk,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = 'private',
  path = 'general',
  file,
  PSize = 5,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
  PSize?: number;
}) => {
  const upload = new Upload({
    client: s3Config(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.AWS_BUCKET_NAME}/${path}/${nanoid()}_${
        file.originalname
      }`,
      Body:
        storageApproach === StorageEnum.memory
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
    partSize: PSize * 1024 * 1024,
  });

  upload.on('httpUploadProgress', (progress) => {
    console.log({ progress });
  });
  const { Key } = await upload.done();
  if (!Key) {
    throw new UnauthorizedException('File to generate upload key');
  }
  return Key;
};

export const createPreSignedUploadURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = 'private',
  path = 'general',
  ContentType,
  originalname,
  expiresIn = 120,
}: {
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;

  ContentType?: string;
  originalname?: string;
  expiresIn?: number;
}): Promise<{
  url: string;
  key: string;
}> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.AWS_BUCKET_NAME}/${path}/${nanoid()}_${originalname}`,

    ContentType,
  });

  const url = await getSignedUrl(s3Config(), command, { expiresIn });

  if (!url || !command?.input.Key) {
    throw new UnauthorizedException('File to generate upload url');
  }
  return { url, key: command.input.Key };
};
export const createGetPreSignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
  expiresIn = 120,
  downloadName,
  download = 'false',
}: {
  Bucket?: string;
  Key: string;
  downloadName?: string;
  download?: string;

  expiresIn?: number;
}): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition:
      download === 'true'
        ? `attachment; filename="${Key.split('/').pop()}"` ||
          `attachment; filename="file"`
        : undefined,
  });

  const url = await getSignedUrl(s3Config(), command, { expiresIn });

  if (!url) {
    throw new UnauthorizedException('File to generate upload url');
  }
  return url;
};

export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });
  return await s3Config().send(command);
};

export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });
  return await s3Config().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Quiet = false,
  urls,
}: {
  Bucket?: string;
  Quiet?: boolean;
  urls: string[];
}) => {
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: urls?.map((url) => ({ Key: url })),
      Quiet,
    },
  });
  return await s3Config().send(command);
};
export const listDirectoryFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}/`,
  });
  return await s3Config().send(command);
};
export const deleteFolderByPrefix = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
  Quiet = false,
}: {
  Bucket?: string;
  path: string;
  Quiet?: boolean;
}) => {
  const fileList = await listDirectoryFiles({ Bucket, path });
  if (!fileList.Contents?.length) {
    console.log('No files found in this directory', 404);
    return fileList;
  }

  return await deleteFiles({
    Bucket,
    urls: fileList.Contents?.map((file) => file.Key as string),
    Quiet,
  });
};
