import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderRepository } from '../../DB/repositories/order.repository';
import { CartRepository } from '../../DB/repositories/cart.repository';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { CouponRepository } from '../../DB/repositories/coupon.repository';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/createOrder.dto';
import { UserDocument } from '../../DB/models/user.model';
import {
  DiscountType,
  OrderStatus,
  PaymentMethod,
  UserRole,
} from '../../common/enums';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
    private readonly couponRepository: CouponRepository,
  ) {}

  async createFromCart(user: UserDocument, dto: CreateOrderDto) {
    const cart = await this.cartRepository.findOne({ user: user._id });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cannot place an order with an empty cart');
    }

    const orderItems: {
      product: Types.ObjectId;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[] = [];

    let subTotal = 0;

    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Product ${item.product} no longer exists`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}`,
        );
      }

      const unitPrice = product.finalPrice;
      const totalPrice = Number((unitPrice * item.quantity).toFixed(2));
      subTotal += totalPrice;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    subTotal = Number(subTotal.toFixed(2));
    let discountAmount = 0;
    let couponId: Types.ObjectId | undefined;

    if (dto.couponCode) {
      const coupon = await this.couponRepository.findOne({
        code: dto.couponCode.toUpperCase().trim(),
        isActive: true,
      });
      if (!coupon) {
        throw new NotFoundException('Invalid or inactive coupon code');
      }

      const now = new Date();
      if (now < coupon.fromDate || now > coupon.toDate) {
        throw new BadRequestException('Coupon is outside its valid date range');
      }
      if (coupon.usedBy.length >= coupon.maxUses) {
        throw new BadRequestException('Coupon usage limit has been reached');
      }
      if (coupon.usedBy.some((id) => id.toString() === user._id.toString())) {
        throw new BadRequestException('You have already used this coupon');
      }

      if (coupon.discountType === DiscountType.PERCENTAGE) {
        discountAmount = Number(((subTotal * coupon.amount) / 100).toFixed(2));
      } else {
        discountAmount = Math.min(subTotal, coupon.amount);
      }

      couponId = coupon._id;
      await this.couponRepository.findByIdAndUpdate(coupon._id, {
        $addToSet: { usedBy: user._id },
      });
    }

    const totalPrice = Number(Math.max(0, subTotal - discountAmount).toFixed(2));

    // Decrement product stock and increment sold count
    for (const item of orderItems) {
      await this.productRepository.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    const order = await this.orderRepository.create({
      user: user._id,
      items: orderItems,
      shippingAddress: dto.shippingAddress,
      phone: dto.phone,
      note: dto.note,
      paymentMethod: dto.paymentMethod || PaymentMethod.CASH,
      status: OrderStatus.PENDING,
      coupon: couponId,
      subTotal,
      discountAmount,
      totalPrice,
    });

    // Clear user's cart
    cart.items = [];
    cart.subTotal = 0;
    await cart.save();

    return {
      message: 'Order placed successfully',
      order,
    };
  }

  async findMyOrders(user: UserDocument, page = 1, limit = 10) {
    const result = await this.orderRepository.findPaginated(
      { user: user._id },
      {
        page,
        limit,
        populate: { path: 'items.product', select: 'name slug mainImage' },
      },
    );

    return {
      message: 'Orders retrieved successfully',
      ...result,
    };
  }

  async findAllOrders(page = 1, limit = 20, status?: OrderStatus) {
    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const result = await this.orderRepository.findPaginated(filter, {
      page,
      limit,
      populate: [
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'coupon', select: 'code amount discountType' },
      ],
    });

    return {
      message: 'All orders retrieved successfully',
      ...result,
    };
  }

  async findOne(id: string, user: UserDocument) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderRepository.findById(id, undefined, {
      populate: [
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'items.product', select: 'name slug mainImage' },
        { path: 'coupon', select: 'code amount discountType' },
      ],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const ownerId =
      (order.user as any)?._id?.toString() || order.user.toString();
    if (ownerId !== user._id.toString() && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to view this order');
    }

    return {
      message: 'Order retrieved successfully',
      order,
    };
  }

  async cancelOrder(id: string, user: UserDocument) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.user.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to cancel this order');
    }

    if (
      ![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)
    ) {
      throw new BadRequestException(
        `Order cannot be cancelled in "${order.status}" status`,
      );
    }

    // Restore stock
    for (const item of order.items) {
      await this.productRepository.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    await order.save();

    return {
      message: 'Order cancelled and stock restored successfully',
      order,
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid order ID');
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = dto.status;
    if (dto.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      order.paidAt = order.paidAt || new Date();
    } else if (dto.status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    await order.save();

    return {
      message: 'Order status updated successfully',
      order,
    };
  }
}
