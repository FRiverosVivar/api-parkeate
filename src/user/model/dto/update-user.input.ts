import { InputType, Int, Field, PartialType, ArgsType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { Column } from "typeorm";

@InputType()
@ArgsType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => String)
  id: string;

  // `tbkId` is optional, and it's only added when the user made an inscription to Oneclick
  @Field(() => String, { nullable: true })
  tbkId?: string;
}
