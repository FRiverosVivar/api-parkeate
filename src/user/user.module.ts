import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserResolver } from './resolver/user.resolver';
import { registerEnumType } from '@nestjs/graphql';
import { UserTypesEnum } from './constants/constants';

registerEnumType(UserTypesEnum, {
  name: 'UserTypesEnum',
});
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserResolver, UserService],
  exports: [UserService, UserResolver],
})
export class UserModule {}
