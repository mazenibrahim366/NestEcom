import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BrandDocument as TDocument } from '../models/Brand.model';
import { DatabaseRepository } from './database.repository';
@Injectable()
export class BrandRepository extends DatabaseRepository<TDocument> {
  constructor(
    @InjectModel('Brand') protected readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
