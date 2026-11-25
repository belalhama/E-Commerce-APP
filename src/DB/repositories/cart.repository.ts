import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../models/cart.model';
import { DatabaseRepository } from './database.repository';

@Injectable()
export class CartRepository extends DatabaseRepository<CartDocument> {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
  ) {
    super(cartModel);
  }
}
