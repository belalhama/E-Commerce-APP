import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserModel } from '../../DB/models/user.model';

@Module({
  imports: [UserModel],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
