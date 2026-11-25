import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReviewRepository } from '../../DB/repositories/review.repository';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { CreateReviewDto, UpdateReviewDto } from './dto/createReview.dto';
import { UserRole } from '../../common/enums';
import { UserDocument } from '../../DB/models/user.model';

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  private async recalculateProductRating(productId: Types.ObjectId) {
    const reviews = await this.reviewRepository.find({ product: productId });
    const ratingsCount = reviews.length;
    const avgRating =
      ratingsCount > 0
        ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / ratingsCount
            ).toFixed(2),
          )
        : 0;

    await this.productRepository.findByIdAndUpdate(productId, {
      avgRating,
      ratingsCount,
    });
  }

  async create(dto: CreateReviewDto, user: UserDocument) {
    const productId = new Types.ObjectId(dto.product);
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.reviewRepository.findOne({
      user: user._id,
      product: productId,
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this product');
    }

    const review = await this.reviewRepository.create({
      comment: dto.comment,
      rating: dto.rating,
      product: productId,
      user: user._id,
    });

    await this.recalculateProductRating(productId);

    return {
      message: 'Review submitted successfully',
      review,
    };
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const result = await this.reviewRepository.findPaginated(
      { product: new Types.ObjectId(productId) },
      {
        page,
        limit,
        populate: { path: 'user', select: 'firstName lastName email' },
      },
    );

    return {
      message: 'Reviews retrieved successfully',
      ...result,
    };
  }

  async update(id: string, dto: UpdateReviewDto, user: UserDocument) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.user.toString() !== user._id.toString()) {
      throw new ForbiddenException('You can only update your own review');
    }

    const updated = await this.reviewRepository.findByIdAndUpdate(id, dto);
    await this.recalculateProductRating(review.product);

    return {
      message: 'Review updated successfully',
      review: updated,
    };
  }

  async remove(id: string, user: UserDocument) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid review ID');
    }

    const review = await this.reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (
      review.user.toString() !== user._id.toString() &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to delete this review');
    }

    await this.reviewRepository.findByIdAndDelete(id);
    await this.recalculateProductRating(review.product);

    return {
      message: 'Review deleted successfully',
    };
  }
}
