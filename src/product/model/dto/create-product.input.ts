import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { Column, ManyToMany } from 'typeorm';
import { StoreEntity } from '../../../store/entity/store.entity';

@InputType()
@ArgsType()
export class CreateProductInput {
  @Field(() => String, { description: 'id of the product' })
  id: string;
  @Field(() => String, { description: 'stock of the product' })
  name: string;
  @Field(() => String, { description: 'description of the product' })
  description: string;
  @Field(() => Int, { description: 'stock of the product' })
  stock: number;
  @Field(() => String, { description: 'brand of the product' })
  brand: string;
  @Field(() => Int, { description: 'price of the product' })
  price: number;
  @Field(() => Date, { description: 'creation date of the product' })
  createdAt: Date;
  @Field(() => Date, { description: 'update date of the product' })
  updatedAt: Date;
}
