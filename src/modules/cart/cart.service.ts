import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CartRepository } from '../../DB/repositories/cart.repository';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { UserDocument } from '../../DB/models/user.model';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async getOrCreateCart(user: UserDocument) {
    let cart = await this.cartRepository.findOne({ user: user._id }, undefined, {
      populate: {
        path: 'items.product',
        select: 'name slug price finalPrice stock mainImage',
      },
    });

    if (!cart) {
      cart = await this.cartRepository.create({
        user: user._id,
        items: [],
        subTotal: 0,
      });
    }

    return {
      message: 'Cart retrieved successfully',
      cart,
    };
  }

  async addToCart(user: UserDocument, dto: AddToCartDto) {
    const quantityToAdd = dto.quantity || 1;
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantityToAdd) {
      throw new BadRequestException(
        `Insufficient stock. Available stock: ${product.stock}`,
      );
    }

    let cart = await this.cartRepository.findOne({ user: user._id });
    if (!cart) {
      cart = await this.cartRepository.create({
        user: user._id,
        items: [
          {
            product: product._id,
            quantity: quantityToAdd,
            price: product.finalPrice,
          },
        ],
      });
    } else {
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === product._id.toString(),
      );

      if (existingIndex > -1) {
        const newQty = cart.items[existingIndex].quantity + quantityToAdd;
        if (product.stock < newQty) {
          throw new BadRequestException(
            `Insufficient stock for total quantity (${newQty}). Available: ${product.stock}`,
          );
        }
        cart.items[existingIndex].quantity = newQty;
        cart.items[existingIndex].price = product.finalPrice;
      } else {
        cart.items.push({
          product: product._id,
          quantity: quantityToAdd,
          price: product.finalPrice,
        });
      }
      await cart.save();
    }

    const populated = await this.cartRepository.findById(cart._id, undefined, {
      populate: {
        path: 'items.product',
        select: 'name slug price finalPrice stock mainImage',
      },
    });

    return {
      message: 'Product added to cart successfully',
      cart: populated,
    };
  }

  async updateItemQuantity(
    user: UserDocument,
    productId: string,
    dto: UpdateCartItemDto,
  ) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available stock: ${product.stock}`,
      );
    }

    const cart = await this.cartRepository.findOne({ user: user._id });
    if (!cart) {
      throw new NotFoundException('Cart is empty');
    }

    const index = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (index === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    cart.items[index].quantity = dto.quantity;
    cart.items[index].price = product.finalPrice;
    await cart.save();

    const populated = await this.cartRepository.findById(cart._id, undefined, {
      populate: {
        path: 'items.product',
        select: 'name slug price finalPrice stock mainImage',
      },
    });

    return {
      message: 'Cart item updated successfully',
      cart: populated,
    };
  }

  async removeItem(user: UserDocument, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const cart = await this.cartRepository.findOne({ user: user._id });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    await cart.save();

    return {
      message: 'Item removed from cart',
      cart,
    };
  }

  async clearCart(user: UserDocument) {
    const cart = await this.cartRepository.findOne({ user: user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return {
      message: 'Cart cleared successfully',
      cart,
    };
  }
}
