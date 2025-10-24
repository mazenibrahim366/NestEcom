import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateOptions,
  FilterQuery,
  Model,
  PopulateOptions,
  QueryOptions,
} from 'mongoose';

import { IUserDocument as TDocument, User } from '../models/User.model';
import { DatabaseRepository } from './database.repository';
import { decryptEncryption } from 'src/common/utils/security/encryption.security';
@Injectable()
export class UserRepository extends DatabaseRepository<TDocument> {
  constructor(
    @InjectModel(User.name) protected readonly model: Model<TDocument>,
  ) {
    super(model);
  }

  async createUser({
    data,
    option = { validateBeforeSave: true },
  }: {
    data: Partial<TDocument>[];
    option?: CreateOptions;
  }): Promise<TDocument | TDocument[]> {
    const [user] = (await this.create({ data, option })) as TDocument[];

    if (!user) {
      throw new NotFoundException('User not created');
    }

    return user;
  }

  async findCursor({
    filter = {},
    select = '',
    option = {},
  }: {
    filter?: FilterQuery<TDocument>;
    select?: string;
    option?: QueryOptions;
  }): Promise<TDocument[] | unknown> {
    let users = [] as any;
    let cursor = this.model
      .find(filter)
      .select(select)
      .populate(option?.populate as PopulateOptions)
      .cursor();

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      const decryptedPhone = await decryptEncryption({
        cipherText: doc?.phone as string,
      });
      doc.phone = decryptedPhone;
      users.push(doc);
    }

    return users;
  }
}
