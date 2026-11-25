import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Gender, UserRole } from '../../common/enums';
import { hashPassword } from '../../common/utils/hash.util';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, any>) => {
      delete ret.password;
      delete ret.otp;
      delete ret.__v;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, enum: Gender, default: Gender.MALE })
  gender: Gender;

  @Prop({ default: false })
  isConfirmed: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  otp?: string;

  @Prop()
  otpExpires?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  wishlist: Types.ObjectId[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('userName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

export const UserModel = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
]);
