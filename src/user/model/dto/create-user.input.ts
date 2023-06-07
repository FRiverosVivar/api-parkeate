import { InputType, Int, Field, ArgsType } from '@nestjs/graphql';
import { Column } from 'typeorm';
import { UserTypesEnum } from '../../constants/constants';
import { BaseCustomer } from '../../../utils/interfaces/base-customer.abstract';

@InputType()
@ArgsType()
export class CreateUserInput extends BaseCustomer {
  @Field(() => Int, { description: 'type of the user' })
  userType: UserTypesEnum;
  @Field(() => Boolean, { description: 'validated email' })
  validatedEmail: boolean;
  @Field(() => Boolean, { description: 'validated phone' })
  validatedPhone: boolean;
}
