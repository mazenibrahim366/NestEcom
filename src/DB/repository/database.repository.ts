import {
  CreateOptions,
  DeleteResult,
  FilterQuery,
  Model,
  PopulateOptions,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

export class DatabaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async findOne({
    filter = {},
    select = '',
    option = {},
  }: {
    filter?: FilterQuery<TDocument>;
    select?: string;
    option?: QueryOptions;
  }): Promise<TDocument | null> {
    let doc = this.model.findOne(filter).select(select);
    if (option?.populate) {
      doc = doc.populate(option.populate as PopulateOptions);
    }
    if (option?.lean) {
      doc.lean(option.lean);
    }
    return await doc.exec();
  }

  async find({
    filter = {},
    select = '',
    option = {},
  }: {
    filter?: FilterQuery<TDocument>;
    select?: string;
    option?: QueryOptions;
  }): Promise<TDocument[] | unknown> {
    let doc = this.model.find(filter).select(select);
    if (option?.populate) {
      doc = doc.populate(option.populate as PopulateOptions);
    }
    if (option?.lean) {
      doc.lean(option.lean);
    }
    if (option?.limit) {
      doc.limit(option.limit);
    }
    if (option?.skip) {
      doc.skip(option.skip);
    }
    return await doc.exec();
  }
  async paginate({
    filter = {},
    select = '',
    option = {},
    page = 'all',
    size = 5,
  }: {
    filter: FilterQuery<TDocument>;
    select?: string;
    option?: QueryOptions;
    page?: number | 'all';
    size?: number;
  }): Promise<TDocument[] | unknown> {
    let docCount: number | undefined = undefined;
    let pages: number | undefined = undefined;
    docCount = await this.model.countDocuments(filter);
    if (page !== 'all') {
      page = Math.floor(page < 1 ? 1 : page);
      option.limit = Math.floor(size < 1 || !size ? 5 : size);
      option.skip = (page - 1) * option.limit;
      pages = Math.ceil(docCount / option.limit);
    }
    let result = await this.find({ filter, option, select });

    return { docCount, pages, limit: option.limit, currentPage: page, result };
  }

  async findById({
    id,
    select = '',
    option = {},
  }: {
    id: string;
    select?: string;
    option?: QueryOptions;
  }): Promise<TDocument | null> {
    let doc = this.model.findById(id).select(select);
    if (option?.populate) {
      doc = doc.populate(option.populate as PopulateOptions);
    }
    if (option?.lean) {
      doc.lean(option.lean);
    }
    return await doc.exec();
  }

  async updateOne({
    filter = {},
    data = {} as UpdateQuery<TDocument>,
    option = { runValidators: true },
  }: {
    filter?: FilterQuery<TDocument>;
    data?: UpdateQuery<TDocument>;
    option?: object;
  }) {
    if (Array.isArray(data)) {
      // ?                      update as cheek
      data.push({
        $set: { __v: { $add: ['$__v', 1] } },
      });
      return await this.model.updateOne(filter, data, option);
    }
    return await this.model.updateOne(
      filter,
      { ...data, $inc: { __v: 1 } },
      option,
    );
  }

  async findOneAndUpdate({
    filter = {},
    data = {} as UpdateQuery<TDocument>,
    option = { runValidators: true, new: true },
    select = '',
    populate = [],
  }: {
    filter?: FilterQuery<TDocument>;
    data?: UpdateQuery<TDocument>;
    option?: object;
    select?: string;
    populate?: any;
  }): Promise<TDocument | null> {
    return this.model
      .findOneAndUpdate(filter, { ...data, $inc: { __v: 1 } }, option)
      .select(select)
      .populate(populate);
  }
  async findByIdAndUpdate({
    id,
    data = {} as UpdateQuery<TDocument>,
    option = { runValidators: true, new: true },
    select = '',
    populate = [],
  }: {
    id?: Types.ObjectId | undefined;
    data?: UpdateQuery<TDocument>;
    option?: object;
    select?: string;
    populate?: any;
  }): Promise<TDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { ...data, $inc: { __v: 1 } }, option)
      .select(select)
      .populate(populate);
  }

  async create({
    data,
    option = { validateBeforeSave: true },
  }: {
    data: Partial<TDocument>[];
    option?: CreateOptions;
  }): Promise<TDocument | TDocument[]> {
    return this.model.create(data, option);
  }

  async deleteOne({
    filter = {},
  }: {
    filter?: FilterQuery<TDocument>;
  }): Promise<DeleteResult> {
    return this.model.deleteOne(filter);
  }
  async deleteMany({
    filter = {},
  }: {
    filter?: FilterQuery<TDocument>;
  }): Promise<DeleteResult> {
    return this.model.deleteMany(filter);
  }
}
