import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ConnectionDB from './DB/connection.db';

async function bootstrap() {
  const port: number | string = process.env.PORT || 5000;
  const app = await NestFactory.create(AppModule);
  await ConnectionDB();
  await app.listen(port, () =>
    console.log(`Server is running on port => ${port}!`),
  );
}
bootstrap();
