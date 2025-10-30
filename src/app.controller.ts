import { S3Service } from './common/utils/multer/s3.service';

import { Controller, Get, Param, Query, Response } from '@nestjs/common';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { AppService } from './app.service';
const createS3WriteStreamPipe = promisify(pipeline);
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('upload/Pre-signed/*path')
  async GetPreSignedAssetUrl(
    @Param() params: { path: string[] },
    @Query() query: { downloadName?: string; download?: string },
  ) {
    const url = await this.appService.GetPreSignedAssetUrl(params, query);
    //
    return { message: 'done', data: { url } as Object };
  }
  @Get('upload/*path')
  async GetAssetUrl(
    @Response() res: any,
    @Param() params: { path: string[] },
    @Query() query: { downloadName?: string; download?: string },
  ) {
    const s3Response = await this.appService.GetAssetUrl(res, params, query);
    // s3Response.Body.pipe(res)
    return await createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      res,
    );
  }
}



