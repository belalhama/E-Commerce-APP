import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';
import { BrandModule } from './modules/brands/brand.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/products/product.module';
import { ReviewModule } from './modules/reviews/review.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponModule } from './modules/coupons/coupon.module';
import { OrderModule } from './modules/orders/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGO_URI') ||
          'mongodb://127.0.0.1:27017/ecommerce_db',
        onConnectionCreate: (connection) => {
          connection.on('connected', () => {
            console.log('MongoDB connected successfully');
          });
          connection.on('error', (err) => {
            console.error('MongoDB connection error:', err.message);
          });
          return connection;
        },
      }),
    }),
    AuthModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    ReviewModule,
    CartModule,
    CouponModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
