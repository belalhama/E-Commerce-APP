import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import slugify from 'slugify';
import { ProductRepository } from '../../DB/repositories/product.repository';
import { CategoryRepository } from '../../DB/repositories/category.repository';
import { BrandRepository } from '../../DB/repositories/brand.repository';
import {
  CreateProductDto,
  ProductQueryDto,
  UpdateProductDto,
} from './dto/createproduct.dto';
import { UserDocument } from '../../DB/models/user.model';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
  ) {}

  async create(dto: CreateProductDto, user: UserDocument) {
    const categoryExists = await this.categoryRepository.exists({
      _id: new Types.ObjectId(dto.category),
    });
    if (!categoryExists) {
      throw new NotFoundException('Category not found');
    }

    if (dto.brand) {
      const brandExists = await this.brandRepository.exists({
        _id: new Types.ObjectId(dto.brand),
      });
      if (!brandExists) {
        throw new NotFoundException('Brand not found');
      }
    }

    const discount = dto.discountPercent || 0;
    const finalPrice = Number(
      (dto.price - (dto.price * discount) / 100).toFixed(2),
    );

    const product = await this.productRepository.create({
      name: dto.name,
      slug: slugify(dto.name, { lower: true, strict: true }),
      description: dto.description,
      price: dto.price,
      discountPercent: discount,
      finalPrice,
      stock: dto.stock,
      mainImage: dto.mainImage,
      subImages: dto.subImages || [],
      category: new Types.ObjectId(dto.category),
      brand: dto.brand ? new Types.ObjectId(dto.brand) : undefined,
      createdBy: user._id,
    });

    return {
      message: 'Product created successfully',
      product,
    };
  }

  async findAll(query: ProductQueryDto) {
    const filter: Record<string, any> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.category) {
      filter.category = new Types.ObjectId(query.category);
    }

    if (query.brand) {
      filter.brand = new Types.ObjectId(query.brand);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.finalPrice = {};
      if (query.minPrice !== undefined) {
        filter.finalPrice.$gte = Number(query.minPrice);
      }
      if (query.maxPrice !== undefined) {
        filter.finalPrice.$lte = Number(query.maxPrice);
      }
    }

    const result = await this.productRepository.findPaginated(filter, {
      page: query.page,
      limit: query.limit,
      sort: query.sort || { createdAt: -1 },
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
        { path: 'createdBy', select: 'firstName lastName email' },
      ],
    });

    return {
      message: 'Products retrieved successfully',
      ...result,
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productRepository.findById(id, undefined, {
      populate: [
        { path: 'category', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
        { path: 'createdBy', select: 'firstName lastName email' },
      ],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product retrieved successfully',
      product,
    };
  }

  async update(id: string, dto: UpdateProductDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (dto.category) {
      const categoryExists = await this.categoryRepository.exists({
        _id: new Types.ObjectId(dto.category),
      });
      if (!categoryExists) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.brand) {
      const brandExists = await this.brandRepository.exists({
        _id: new Types.ObjectId(dto.brand),
      });
      if (!brandExists) {
        throw new NotFoundException('Brand not found');
      }
    }

    const updateData: Record<string, any> = { ...dto };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true, strict: true });
    }

    const newPrice = dto.price !== undefined ? dto.price : existing.price;
    const newDiscount =
      dto.discountPercent !== undefined
        ? dto.discountPercent
        : existing.discountPercent;
    updateData.finalPrice = Number(
      (newPrice - (newPrice * newDiscount) / 100).toFixed(2),
    );

    if (dto.category) {
      updateData.category = new Types.ObjectId(dto.category);
    }
    if (dto.brand) {
      updateData.brand = new Types.ObjectId(dto.brand);
    }

    const product = await this.productRepository.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        populate: [
          { path: 'category', select: 'name slug' },
          { path: 'brand', select: 'name slug' },
        ],
      },
    );

    return {
      message: 'Product updated successfully',
      product,
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.productRepository.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product deleted successfully',
    };
  }
}
