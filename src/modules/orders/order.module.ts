import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderModel } from '../../DB/models/order.model';
import { CartModel } from '../../DB/models/cart.model';
import { ProductModel } from '../../DB/models/product.model';
import { CouponModel } from '../../DB/models/coupon.model';
import { OrderRepository } from '../../DB/repositories/order.repository';
import { CartRepository } from '../../DB/repositories/cart.repository';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { CouponRepository } from '../../DB/repositories/coupon.repository';

@Module({
  imports: [OrderModel, CartModel, ProductModel, CouponModel],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    CartRepository,
    ProductRepository,
    CouponRepository,
  ],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
