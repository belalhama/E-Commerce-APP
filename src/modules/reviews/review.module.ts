import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewModel } from '../../DB/models/review.model';
import { ProductModel } from '../../DB/models/product.model';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { ReviewRepository } from '../../DB/repositories/review.repository';

@Module({
  imports: [ReviewModel, ProductModel],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewRepository, ProductRepository],
  exports: [ReviewService, ReviewRepository],
})
export class ReviewModule {}
