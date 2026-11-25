import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from '../models/coupon.model';
import { DatabaseRepository } from './database.repository';

@Injectable()
export class CouponRepository extends DatabaseRepository<CouponDocument> {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
  ) {
    super(couponModel);
  }
}
