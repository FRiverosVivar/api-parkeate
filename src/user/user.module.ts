import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserResolver } from './resolver/user.resolver';
import { UserTypesEnum } from './model/user.constants';
import { registerEnumType } from '@nestjs/graphql';

registerEnumType(UserTypesEnum, {
  name: 'UserTypesEnum',
});
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserResolver, UserService],
})
export class UserModule {}
