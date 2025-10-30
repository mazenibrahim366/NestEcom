import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument as TDocument } from '../models/Otp.model';
import { DatabaseRepository } from './database.repository';
import { log } from 'console';
@Injectable()
export class OtpRepository extends DatabaseRepository<TDocument> {
  constructor(@InjectModel('Otp') protected readonly model: Model<TDocument>) {
    super(model);
  }
}
// log({sdas:Otp.name})
