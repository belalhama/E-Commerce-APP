import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import slugify from 'slugify';
import { CategoryRepository } from '../../DB/repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/createCategory.dto';
import { UserDocument } from '../../DB/models/user.model';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async create(dto: CreateCategoryDto, user: UserDocument) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existing = await this.categoryRepository.findOne({
      $or: [{ name: dto.name.trim() }, { slug }],
    });
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
      image: dto.image,
      brands: dto.brands?.map((id) => new Types.ObjectId(id)) || [],
      createdBy: user._id,
    });

    return {
      message: 'Category created successfully',
      category,
    };
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const filter: Record<string, any> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const result = await this.categoryRepository.findPaginated(filter, {
      page,
      limit,
      populate: [
        { path: 'brands', select: 'name slug image' },
        { path: 'createdBy', select: 'firstName lastName email' },
      ],
    });

    return {
      message: 'Categories retrieved successfully',
      ...result,
    };
  }

  async findOne(idOrSlug: string) {
    const filter = Types.ObjectId.isValid(idOrSlug)
      ? { _id: new Types.ObjectId(idOrSlug) }
      : { slug: idOrSlug.toLowerCase() };

    const category = await this.categoryRepository.findOne(filter, undefined, {
      populate: [
        { path: 'brands', select: 'name slug image' },
        { path: 'createdBy', select: 'firstName lastName email' },
      ],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category retrieved successfully',
      category,
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const updateData: Record<string, any> = { ...dto };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true, strict: true });
      const duplicate = await this.categoryRepository.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        $or: [{ name: dto.name.trim() }, { slug: updateData.slug }],
      });
      if (duplicate) {
        throw new ConflictException(
          'Another category with this name already exists',
        );
      }
    }

    if (dto.brands) {
      updateData.brands = dto.brands.map((brandId) => new Types.ObjectId(brandId));
    }

    const category = await this.categoryRepository.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        populate: { path: 'brands', select: 'name slug image' },
      },
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category updated successfully',
      category,
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    const category = await this.categoryRepository.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category deleted successfully',
    };
  }
}
