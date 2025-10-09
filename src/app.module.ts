import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { AuthModule } from './modules/auth/auth.module';


@Module({
  imports: [ ConfigModule.forRoot({ envFilePath : resolve("./config/.env.development"),isGlobal: true }),
    MongooseModule.forRoot(process.env.DB_URL as string ),
  AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
