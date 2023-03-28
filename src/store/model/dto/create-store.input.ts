import { ArgsType, Field, InputType } from '@nestjs/graphql';

@InputType()
@ArgsType()
export class CreateStoreInput {
  @Field(() => String, { description: 'city of the store' })
  city: string;
  @Field(() => String, { description: 'address of the store' })
  address: string;
  @Field(() => [String], {
    description: 'employees of the store',
    nullable: true,
  })
  employeesId: string[];
  @Field(() => Date, { description: 'creation date of the store' })
  createdAt: Date;
  @Field(() => Date, { description: 'update date of the store' })
  updatedAt: Date;
  @Field(() => [String], { description: 'product of the store' })
  productsId: string[];
}
