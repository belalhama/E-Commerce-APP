# E-Commerce Backend (NestJS + Mongoose Repository Architecture)

A complete E-Commerce REST API built with **NestJS**, **MongoDB/Mongoose**, **JWT Authentication**, and the **Generic Repository Pattern** (`src/DB/models`, `src/DB/repositories`, `src/modules`).

## Folder Structure

```text
src/
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── enums/
│   │   └── index.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   ├── utils/
│   │   └── hash.util.ts
│   └── index.ts
├── DB/
│   ├── models/
│   │   ├── brand.model.ts
│   │   ├── cart.model.ts
│   │   ├── category.model.ts
│   │   ├── coupon.model.ts
│   │   ├── order.model.ts
│   │   ├── product.model.ts
│   │   ├── review.model.ts
│   │   └── user.model.ts
│   └── repositories/
│       ├── brand.repository.ts
│       ├── cart.repository.ts
│       ├── category.repository.ts
│       ├── coupon.repository.ts
│       ├── database.repository.ts
│       ├── order.repository.ts
│       ├── product.repository.ts
│       ├── review.repository.ts
│       └── user.repository.ts
├── modules/
│   ├── auth/
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── brands/
│   │   ├── dto/
│   │   │   └── createBrand.dto.ts
│   │   ├── brand.controller.ts
│   │   ├── brand.module.ts
│   │   └── brand.service.ts
│   ├── cart/
│   │   ├── dto/
│   │   │   └── cart.dto.ts
│   │   ├── cart.controller.ts
│   │   ├── cart.module.ts
│   │   └── cart.service.ts
│   ├── category/
│   │   ├── dto/
│   │   │   └── createCategory.dto.ts
│   │   ├── category.controller.ts
│   │   ├── category.module.ts
│   │   └── category.service.ts
│   ├── coupons/
│   │   ├── dto/
│   │   │   └── createCoupon.dto.ts
│   │   ├── coupon.controller.ts
│   │   ├── coupon.module.ts
│   │   └── coupon.service.ts
│   ├── orders/
│   │   ├── dto/
│   │   │   └── createOrder.dto.ts
│   │   ├── order.controller.ts
│   │   ├── order.module.ts
│   │   └── order.service.ts
│   ├── products/
│   │   ├── dto/
│   │   │   └── createproduct.dto.ts
│   │   ├── product.controller.ts
│   │   ├── product.module.ts
│   │   └── product.service.ts
│   ├── reviews/
│   │   ├── dto/
│   │   │   └── createReview.dto.ts
│   │   ├── review.controller.ts
│   │   ├── review.module.ts
│   │   └── review.service.ts
│   └── users/
│       ├── dto/
│       │   └── user.dto.ts
│       ├── user.controller.ts
│       ├── user.module.ts
│       └── user.service.ts
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## API Endpoints Overview (Base URL: `/api/v1`)

| Module | Endpoints | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/signup`, `POST /auth/confirm-email`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password` | User registration, OTP verification, JWT login, and password reset |
| **Users** | `GET /users/profile`, `PATCH /users/profile`, `PATCH /users/change-password`, `GET /users/wishlist`, `POST /users/wishlist/:productId`, `GET /users`, `PATCH /users/:id/role`, `DELETE /users/:id` | User profile, password update, wishlist management, and admin user administration |
| **Brands** | `POST /brands`, `GET /brands`, `GET /brands/:idOrSlug`, `PATCH /brands/:id`, `DELETE /brands/:id` | Brand catalog management with automatic slug generation |
| **Categories** | `POST /categories`, `GET /categories`, `GET /categories/:idOrSlug`, `PATCH /categories/:id`, `DELETE /categories/:id` | Category management linked with brands |
| **Products** | `POST /products`, `GET /products`, `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id` | Product CRUD, discount & final price computation, search, price range & category/brand filtering |
| **Reviews** | `POST /reviews`, `GET /reviews/product/:productId`, `PATCH /reviews/:id`, `DELETE /reviews/:id` | Customer product reviews with automatic product `avgRating` & `ratingsCount` updates |
| **Cart** | `GET /cart`, `POST /cart`, `PATCH /cart/:productId`, `DELETE /cart/:productId`, `DELETE /cart` | Persistent shopping cart with real-time stock checks and subtotal calculation |
| **Coupons** | `POST /coupons`, `GET /coupons`, `GET /coupons/:code`, `PATCH /coupons/:id`, `DELETE /coupons/:id` | Percentage and fixed-amount discount coupons with validity windows and usage limits |
| **Orders** | `POST /orders`, `GET /orders/my-orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel`, `PATCH /orders/:id/status` | Order checkout from cart, coupon discount application, stock deduction/restoration, and status tracking |

## Getting Started

1. Configure `.env` (or copy `.env.example` to `.env`):
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_db
   JWT_SECRET=super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   SALT_ROUNDS=10
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run start:dev
   ```
4. Build and run tests:
   ```bash
   npm run build
   npm test
   ```
