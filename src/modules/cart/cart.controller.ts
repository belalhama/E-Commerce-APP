import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../../DB/models/user.model';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@UseGuards(AuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: UserDocument) {
    return this.cartService.getOrCreateCart(user);
  }

  @Post()
  addToCart(@CurrentUser() user: UserDocument, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(user, dto);
  }

  @Patch(':productId')
  updateItemQuantity(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(user, productId, dto);
  }

  @Delete(':productId')
  removeItem(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user, productId);
  }

  @Delete()
  clearCart(@CurrentUser() user: UserDocument) {
    return this.cartService.clearCart(user);
  }
}
