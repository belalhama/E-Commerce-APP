import {
  FilterQuery,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1> | string;
  populate?: PopulateOptions | (PopulateOptions | string)[] | string;
  select?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class DatabaseRepository<TDocument> {
  protected constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<TDocument> {
    return this.model.create(data);
  }

  async findOne(
    filter: FilterQuery<TDocument> = {},
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument> & {
      populate?: PopulateOptions | (PopulateOptions | string)[] | string;
    },
  ): Promise<TDocument | null> {
    let query = this.model.findOne(filter, projection, options);
    if (options?.populate) {
      query = query.populate(options.populate as any);
    }
    return query.exec();
  }

  async findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument> & {
      populate?: PopulateOptions | (PopulateOptions | string)[] | string;
    },
  ): Promise<TDocument | null> {
    let query = this.model.findById(id, projection, options);
    if (options?.populate) {
      query = query.populate(options.populate as any);
    }
    return query.exec();
  }

  async find(
    filter: FilterQuery<TDocument> = {},
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument> & {
      populate?: PopulateOptions | (PopulateOptions | string)[] | string;
    },
  ): Promise<TDocument[]> {
    let query = this.model.find(filter, projection, options);
    if (options?.populate) {
      query = query.populate(options.populate as any);
    }
    return query.exec();
  }

  async findPaginated(
    filter: FilterQuery<TDocument> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<TDocument>> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
    const skip = (page - 1) * limit;

    let query = this.model
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort(options.sort || { createdAt: -1 });

    if (options.select) {
      query = query.select(options.select);
    }
    if (options.populate) {
      query = query.populate(options.populate as any);
    }

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOneAndUpdate(
    filter: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> & {
      populate?: PopulateOptions | (PopulateOptions | string)[] | string;
    } = { new: true, runValidators: true },
  ): Promise<TDocument | null> {
    let query = this.model.findOneAndUpdate(filter, update, {
      new: true,
      runValidators: true,
      ...options,
    });
    if (options?.populate) {
      query = query.populate(options.populate as any);
    }
    return query.exec();
  }

  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> & {
      populate?: PopulateOptions | (PopulateOptions | string)[] | string;
    } = { new: true, runValidators: true },
  ): Promise<TDocument | null> {
    let query = this.model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      ...options,
    });
    if (options?.populate) {
      query = query.populate(options.populate as any);
    }
    return query.exec();
  }

  async findOneAndDelete(
    filter: FilterQuery<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findOneAndDelete(filter).exec();
  }

  async findByIdAndDelete(
    id: string | Types.ObjectId,
  ): Promise<TDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(
    filter: FilterQuery<TDocument>,
  ): Promise<{ deletedCount?: number }> {
    return this.model.deleteMany(filter).exec();
  }

  async count(filter: FilterQuery<TDocument> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    const doc = await this.model.exists(filter).exec();
    return Boolean(doc);
  }
}
