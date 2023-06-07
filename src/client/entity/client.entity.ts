import { Column, Entity } from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { BaseCustomer } from '../../utils/interfaces/base-customer.abstract';

@Entity('client')
@ObjectType()
export class ClientEntity extends BaseCustomer {
  @Column()
  @Field(() => Boolean)
  validatedAccount: boolean;
}
