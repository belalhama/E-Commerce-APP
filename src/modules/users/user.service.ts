import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRepository } from '../../DB/repositories/user.repository';
import { UserDocument } from '../../DB/models/user.model';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateUserRoleDto,
} from './dto/user.dto';
import { comparePassword } from '../../common/utils/hash.util';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(user: UserDocument) {
    return {
      message: 'User profile retrieved successfully',
      user,
    };
  }

  async updateProfile(user: UserDocument, dto: UpdateProfileDto) {
    const updated = await this.userRepository.findByIdAndUpdate(user._id, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'Profile updated successfully',
      user: updated,
    };
  }

  async changePassword(user: UserDocument, dto: ChangePasswordDto) {
    const currentUser = await this.userRepository.findById(user._id);
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await comparePassword(
      dto.oldPassword,
      currentUser.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    currentUser.password = dto.newPassword;
    await currentUser.save();

    return {
      message: 'Password changed successfully',
    };
  }

  async toggleWishlist(user: UserDocument, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const existsInWishlist = user.wishlist.some(
      (id) => id.toString() === productId,
    );

    const update = existsInWishlist
      ? { $pull: { wishlist: new Types.ObjectId(productId) } }
      : { $addToSet: { wishlist: new Types.ObjectId(productId) } };

    const updated = await this.userRepository.findByIdAndUpdate(
      user._id,
      update,
      { new: true, populate: 'wishlist' },
    );

    return {
      message: existsInWishlist
        ? 'Product removed from wishlist'
        : 'Product added to wishlist',
      wishlist: updated?.wishlist || [],
    };
  }

  async getWishlist(user: UserDocument) {
    const populated = await this.userRepository.findById(user._id, undefined, {
      populate: 'wishlist',
    });
    return {
      message: 'Wishlist retrieved successfully',
      wishlist: populated?.wishlist || [],
    };
  }

  async findAllUsers(page = 1, limit = 10) {
    const result = await this.userRepository.findPaginated(
      { isDeleted: false },
      { page, limit },
    );
    return {
      message: 'Users retrieved successfully',
      ...result,
    };
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updated = await this.userRepository.findByIdAndUpdate(userId, {
      role: dto.role,
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User role updated successfully',
      user: updated,
    };
  }

  async deactivateUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    const updated = await this.userRepository.findByIdAndUpdate(userId, {
      isDeleted: true,
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User account deactivated successfully',
    };
  }
}
