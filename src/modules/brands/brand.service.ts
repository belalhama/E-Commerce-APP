import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import slugify from 'slugify';
import { BrandRepository } from '../../DB/repositories/brand.repository';
import { CreateBrandDto, UpdateBrandDto } from './dto/createBrand.dto';
import { UserDocument } from '../../DB/models/user.model';

@Injectable()
export class BrandService {
  constructor(private readonly brandRepository: BrandRepository) {}

  async create(dto: CreateBrandDto, user: UserDocument) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    const existing = await this.brandRepository.findOne({
      $or: [{ name: dto.name.trim() }, { slug }],
    });
    if (existing) {
      throw new ConflictException('Brand with this name already exists');
    }

    const brand = await this.brandRepository.create({
      ...dto,
      slug,
      createdBy: user._id,
    });

    return {
      message: 'Brand created successfully',
      brand,
    };
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const filter: Record<string, any> = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const result = await this.brandRepository.findPaginated(filter, {
      page,
      limit,
      populate: { path: 'createdBy', select: 'firstName lastName email' },
    });

    return {
      message: 'Brands retrieved successfully',
      ...result,
    };
  }

  async findOne(idOrSlug: string) {
    const filter = Types.ObjectId.isValid(idOrSlug)
      ? { _id: new Types.ObjectId(idOrSlug) }
      : { slug: idOrSlug.toLowerCase() };

    const brand = await this.brandRepository.findOne(filter, undefined, {
      populate: { path: 'createdBy', select: 'firstName lastName email' },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand retrieved successfully',
      brand,
    };
  }

  async update(id: string, dto: UpdateBrandDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID');
    }

    const updateData: Record<string, any> = { ...dto };
    if (dto.name) {
      updateData.slug = slugify(dto.name, { lower: true, strict: true });
      const duplicate = await this.brandRepository.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        $or: [{ name: dto.name.trim() }, { slug: updateData.slug }],
      });
      if (duplicate) {
        throw new ConflictException('Another brand with this name already exists');
      }
    }

    const brand = await this.brandRepository.findByIdAndUpdate(id, updateData);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand updated successfully',
      brand,
    };
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid brand ID');
    }

    const brand = await this.brandRepository.findByIdAndDelete(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      message: 'Brand deleted successfully',
    };
  }
}
