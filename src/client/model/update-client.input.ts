import { ArgsType, Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateClientInput } from './create-client.input';

@InputType()
@ArgsType()
export class UpdateClientInput extends PartialType(CreateClientInput) {
  @Field(() => String)
  id: string;
}
