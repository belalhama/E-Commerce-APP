import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartModel } from '../../DB/models/cart.model';
import { ProductModel } from '../../DB/models/product.model';
import { CartRepository } from '../../DB/repositories/cart.repository';
import { ProductRepository } from '../../DB/repositories/product.repository';

@Module({
  imports: [CartModel, ProductModel],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
  exports: [CartService, CartRepository],
})
export class CartModule {}
