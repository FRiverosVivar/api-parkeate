import { InputType, Int, Field, PartialType, ArgsType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

@InputType()
@ArgsType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String)
  id: string;
}
