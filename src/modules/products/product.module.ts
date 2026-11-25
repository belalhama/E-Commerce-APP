import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductModel } from '../../DB/models/product.model';
import { CategoryModel } from '../../DB/models/category.model';
import { BrandModel } from '../../DB/models/brand.model';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { CategoryRepository } from '../../DB/repositories/category.repository';
import { BrandRepository } from '../../DB/repositories/brand.repository';

@Module({
  imports: [ProductModel, CategoryModel, BrandModel],
  controllers: [ProductController],
  providers: [
    ProductService,
    ProductRepository,
    CategoryRepository,
    BrandRepository,
  ],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}
