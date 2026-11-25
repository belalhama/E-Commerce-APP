import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../../DB/models/user.model';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateUserRoleDto,
} from './dto/user.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: UserDocument) {
    return this.userService.getProfile(user);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user, dto);
  }

  @Patch('change-password')
  changePassword(
    @CurrentUser() user: UserDocument,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(user, dto);
  }

  @Get('wishlist')
  getWishlist(@CurrentUser() user: UserDocument) {
    return this.userService.getWishlist(user);
  }

  @Post('wishlist/:productId')
  toggleWishlist(
    @CurrentUser() user: UserDocument,
    @Param('productId') productId: string,
  ) {
    return this.userService.toggleWishlist(user, productId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAllUsers(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.userService.findAllUsers(page, limit);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.userService.updateUserRole(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('id') id: string) {
    return this.userService.deactivateUser(id);
  }
}
