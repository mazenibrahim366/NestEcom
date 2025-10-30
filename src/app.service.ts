import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from './common/utils/multer/s3.service';

@Injectable()
export class AppService {
  constructor(private readonly s3Service:S3Service) {}
  getHello(): string {
    return 'Hello World!';
  }
 async GetAssetUrl(res ,params,query) {
     const { downloadName, download = false } = query;
    const { path } = params;
    const Key = path.join('/');

    const s3Response = await this.s3Service.getFile({ Key });
    if (!s3Response?.Body) {
      throw new BadRequestException('fail to fetch this asset');
    }
    res.setHeader(
      'Content-Type',
      (s3Response.ContentType as string) || 'application/octet-stream',
    );

    if (download == 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${
          downloadName?.split('/').pop() || Key.split('/').pop()
        }"` || `attachment; filename="file"`,
      );
    }
    return s3Response;
  }
  async GetPreSignedAssetUrl(params,query ) {
        const { downloadName, download = 'false' } = query as unknown as {
      downloadName?: string;
      download?: string;
    };
    const { path } = params;
    const Key = path.join('/');

    console.log({ Key }, path.join('/'));
    const url = await this.s3Service.createGetPreSignedURL({
      Key,
      downloadName: downloadName as string,
      download,
    });
    if (!url) {
      throw new BadRequestException('fail to fetch this asset');
    }
    //
    return url;
  }
}
