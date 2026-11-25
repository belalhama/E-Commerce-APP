import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from '../models/brand.model';
import { DatabaseRepository } from './database.repository';

@Injectable()
export class BrandRepository extends DatabaseRepository<BrandDocument> {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {
    super(brandModel);
  }
}
