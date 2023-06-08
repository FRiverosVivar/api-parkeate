import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { UserResolver } from './resolver/user.resolver';
import { registerEnumType } from '@nestjs/graphql';
import { UserTypesEnum } from './constants/constants';
import { EmailService } from '../utils/email/email.service';
import { SmsService } from '../utils/sms/sms.service';
import { PhotoService } from "../photo/service/photo.service";
import { BaseCustomer } from "../utils/interfaces/base-customer.abstract";

registerEnumType(UserTypesEnum, {
  name: 'UserTypesEnum',
});
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, BaseCustomer])],
  providers: [UserResolver, UserService, EmailService, SmsService],
  exports: [UserService, UserResolver],
})
export class UserModule {}
