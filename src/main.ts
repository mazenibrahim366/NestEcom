import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ConnectionDB from './DB/connection.db';
import { LoggingInterceptor } from './common/interceptor';
import * as express from 'express';
import path from 'path';
async function bootstrap() {
  const port: number | string = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);
  app.use('/uploads', express.static(path.resolve('./uploads')));
  await ConnectionDB();
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(port, () =>
    console.log(`Server is running on port => ${port}!`),
  );
}
bootstrap();
