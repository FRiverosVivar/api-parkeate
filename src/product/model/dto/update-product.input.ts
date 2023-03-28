import { InputType, Int, Field, PartialType, ArgsType } from '@nestjs/graphql';
import { CreateProductInput } from './create-product.input';
@InputType()
@ArgsType()
export class UpdateProductInput extends PartialType(CreateProductInput) {
  @Field(() => String)
  id: string;
}
