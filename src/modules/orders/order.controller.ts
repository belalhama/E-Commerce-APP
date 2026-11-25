import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/createOrder.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus, UserRole } from '../../common/enums';
import { UserDocument } from '../../DB/models/user.model';

@UseGuards(AuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateOrderDto) {
    return this.orderService.createFromCart(user, dto);
  }

  @Get('my-orders')
  findMyOrders(
    @CurrentUser() user: UserDocument,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findMyOrders(user, page, limit);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.findAllOrders(page, limit, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.orderService.findOne(id, user);
  }

  @Patch(':id/cancel')
  cancelOrder(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.orderService.cancelOrder(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto);
  }
}
