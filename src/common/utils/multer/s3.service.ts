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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { nanoid } from 'nanoid';
import { StorageEnum } from '../enums';


@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }

  uploadFile = async ({
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
    await this.s3Client.send(command);
    if (!command?.input.Key) {
      throw new UnauthorizedException('File to generate upload key');
    }
    return command.input.Key;
  };
  uploadFiles = async ({
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
      urls = await this.uploadLargeFiles({
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
        return this.uploadFile({ storageApproach, Bucket, ACL, path, file });
      }),
    );

    return urls;
  };
  uploadLargeFiles = async ({
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
        return this.uploadLargeFile({
          storageApproach,
          Bucket,
          ACL,
          path,
          file,
        });
      }),
    );

    return urls;
  };

  uploadLargeFile = async ({
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
      client: this.s3Client,
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

  createPreSignedUploadURL = async ({
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

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    if (!url || !command?.input.Key) {
      throw new UnauthorizedException('File to generate upload url');
    }
    return { url, key: command.input.Key };
  };
  createGetPreSignedURL = async ({
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

    const url = await getSignedUrl(this.s3Client, command, { expiresIn });

    if (!url) {
      throw new UnauthorizedException('File to generate upload url');
    }
    return url;
  };

  getFile = async ({
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
    return await this.s3Client.send(command);
  };

  deleteFile = async ({
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
    return await this.s3Client.send(command);
  };

  deleteFiles = async ({
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
    return await this.s3Client.send(command);
  };
  listDirectoryFiles = async ({
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
    return await this.s3Client.send(command);
  };
  deleteFolderByPrefix = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
    Quiet = false,
  }: {
    Bucket?: string;
    path: string;
    Quiet?: boolean;
  }) => {
    const fileList = await this.listDirectoryFiles({ Bucket, path });
    if (!fileList.Contents?.length) {
      console.log('No files found in this directory', 404);
      return fileList;
    }

    return await this.deleteFiles({
      Bucket,
      urls: fileList.Contents?.map((file) => file.Key as string),
      Quiet,
    });
  };
}
