import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CouponRepository } from '../../DB/repositories/coupon.repository';
import { CreateCouponDto, UpdateCouponDto } from './dto/createCoupon.dto';
import { DiscountType } from '../../common/enums';
import { UserDocument } from '../../DB/models/user.model';

@Injectable()
export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async create(dto: CreateCouponDto, user: UserDocument) {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.couponRepository.findOne({ code });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);
    if (toDate <= fromDate) {
      throw new BadRequestException('toDate must be after fromDate');
    }

    if (
      (dto.discountType === DiscountType.PERCENTAGE || !dto.discountType) &&
      dto.amount > 100
    ) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const coupon = await this.couponRepository.create({
      code,
      amount: dto.amount,
      discountType: dto.discountType || DiscountType.PERCENTAGE,
      fromDate,
      toDate,
      maxUses: dto.maxUses || 100,
      createdBy: user._id,
    });

    return {
      message: 'Coupon created successfully',
      coupon,
    };
  }

  async findAll(page = 1, limit = 20) {
    const result = await this.couponRepository.findPaginated({}, { page, limit });
    return {
      message: 'Coupons retrieved successfully',
      ...result,
    };
  }

  async findByCode(code: string) {
    const coupon = await this.couponRepository.findOne({
      code: code.toUpperCase().trim(),
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return {
      message: 'Coupon retrieved successfully',
      coupon,
    };
  }

  async update(id: string, dto: UpdateCouponDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this.couponRepository.findByIdAndUpdate(id, dto);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      message: 'Coupon updated successfully',
      coupon,
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon ID');
    }

    const coupon = await this.couponRepository.findByIdAndDelete(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      message: 'Coupon deleted successfully',
    };
  }
}
