import { InputType, Int, Field, PartialType, ArgsType } from '@nestjs/graphql';
import { CreateStoreInput } from './create-store.input';
@InputType()
@ArgsType()
export class UpdateStoreInput extends PartialType(CreateStoreInput) {
  @Field(() => String)
  id: string;
}
