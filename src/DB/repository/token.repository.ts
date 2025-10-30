import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenDocument as TDocument } from '../models/Token.model';
import { Token } from './../models/Token.model';
import { DatabaseRepository } from './database.repository';
@Injectable()
export class TokenRepository extends DatabaseRepository<TDocument> {
  constructor(
    @InjectModel(Token.name) protected readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
