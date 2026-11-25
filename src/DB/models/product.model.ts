import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import slugify from 'slugify';
import { User } from './user.model';
import { Category } from './category.model';
import { Brand } from './brand.model';

@Schema({ timestamps: true })
export class Product {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 150,
  })
  name: string;

  @Prop({ lowercase: true, trim: true })
  slug: string;

  @Prop({ trim: true, maxlength: 2000 })
  description?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ min: 0 })
  finalPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ default: 0, min: 0 })
  sold: number;

  @Prop({ trim: true })
  mainImage?: string;

  @Prop({ type: [String], default: [] })
  subImages: string[];

  @Prop({ type: Types.ObjectId, ref: Category.name, required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Brand.name })
  brand?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  createdBy: Types.ObjectId;

  @Prop({ default: 0, min: 0, max: 5 })
  avgRating: number;

  @Prop({ default: 0, min: 0 })
  ratingsCount: number;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  const discount = this.discountPercent || 0;
  this.finalPrice = Number(
    (this.price - (this.price * discount) / 100).toFixed(2),
  );
  next();
});

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema },
]);
